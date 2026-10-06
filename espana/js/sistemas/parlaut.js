/* Parlamento autonómico: sesiones, disolución, Diputación Permanente y decretos-ley autonómicos con convalidación (en el Pleno, o en la Diputación Permanente si el Parlamento está disuelto).
   Estado por comunidad: E.esp.ccaa[c].pa = { dis, dp, rdl: [], hist: [] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp, T = C.Territorio;
  const PLAZO = 4, MAX_PEND = 3;
  const nm = c => D().ccaa[c].nombre;

  Object.assign(T, {
    paAsegurar(E, c) { const rc = E.esp.ccaa[c]; if (!rc.pa) rc.pa = { dis: false, dp: null, rdl: [], hist: [] }; return rc.pa; },
    /* ¿Está disuelto el Parlamento? Desde la convocatoria de elecciones hasta que se constituye el nuevo. */
    disuelto(E, c) { const rc = E.esp.ccaa[c], t = E.fecha.t; return !!(rc.suspendida || (rc.parl.proxT > t && rc.parl.proxT - t <= 7)); },

    /* Diputación Permanente: reparto proporcional (D'Hondt) de unos 1/5 de los escaños. */
    dp(E, c) {
      const pa = T.paAsegurar(E, c), esc = E.esp.ccaa[c].parl.escanos, sig = JSON.stringify(esc);
      if (pa.dp && pa.dp.sig === sig) return pa.dp;
      const tot = U.suma(Object.values(esc)), n = clamp(Math.round(tot * 0.2), 7, 21), r = {};
      Object.keys(esc).forEach(k => r[k] = 0);
      for (let i = 0; i < n; i++) { let mk = null, mv = -1; for (const k in esc) { const q = esc[k] / (r[k] + 1); if (q > mv) { mv = q; mk = k; } } r[mk]++; }
      const g = E.esp.ccaa[c].gob, gob = g ? U.suma(g.coalicion.map(k => r[k] || 0)) + 0 : 0;
      return pa.dp = { sig, n, seats: r, gob, may: Math.floor(n / 2) + 1 };
    },
    jugadorEnDP(E, c) {
      const J = E.jugador; if (!T.jugadorEnParl(E, c)) return false; const dp = T.dp(E, c);
      return (dp.seats[J.partido] || 0) > 0 && (['portavoz', 'direccion', 'lider'].includes(J.rol) || J.prestigio >= 40 || J.cargo === 'presauto');
    },
    /* Organo que convalida ahora mismo. */
    organo(E, c) { return T.disuelto(E, c) ? 'dp' : 'pleno'; },

    /* El Gobierno aprueba un decreto-ley: entra en vigor ya y debe convalidarse en 30 días (4 semanas). */
    decretar(E, c, progId, o) {
      o = o || {}; const rc = E.esp.ccaa[c], g = rc.gob, pa = T.paAsegurar(E, c), prog = T.programa(progId), t = E.fecha.t;
      if (!g || !prog) return { ok: false, msg: 'Decreto no válido' };
      if (pa.rdl.filter(d => d.estado === 'vigor').length >= MAX_PEND) return { ok: false, msg: 'Ya hay demasiados decretos-ley pendientes de convalidación' };
      if (pa.rdl.some(d => d.prog === progId && d.estado === 'vigor')) return { ok: false, msg: 'Ese decreto ya está en vigor' };
      const eff = o.eff || 0.5 + 0.35 * Math.min(1, T.nivelArea(E, c, prog.area) / 1.5), ruido = {};
      for (const k in rc.parl.escanos) ruido[k] = Math.round(U.gauss(0, 0.1) * 100) / 100;
      T.aplicarPrograma(E, c, prog, eff * 0.9);
      const d = { id: 'DL' + t + progId, prog: progId, t, tVoto: t + PLAZO, estado: 'vigor', quien: o.quien || 'Gobierno autonómico', pid: g.partido, jugador: !!o.jugador, eff: eff * 0.9, ruido, v: null, dis: T.disuelto(E, c) };
      pa.rdl.unshift(d); if (pa.rdl.length > 30) pa.rdl.length = 30;
      C.Noticias.poner(E, 'politica', `El Consejo de Gobierno de ${nm(c)} aprueba el decreto-ley «${prog.n}»${d.dis ? ' (con el Parlamento disuelto: lo convalidará la Diputación Permanente)' : ''}.`, 'ES');
      return { ok: true, msg: `Decreto-ley «${prog.n}» en vigor. Debe convalidarse en ${PLAZO} semanas${d.dis ? ' en la Diputación Permanente' : ' en el Pleno'}.`, d };
    },
    /* Votación de convalidación. mi = voto del jugador o null. */
    convalidar(E, c, d, mi) {
      const rc = E.esp.ccaa[c], pa = T.paAsegurar(E, c), prog = T.programa(d.prog), J = E.jugador, dp = T.organo(E, c) === 'dp';
      const base = dp ? T.dp(E, c).seats : rc.parl.escanos, b = { pid: d.pid, cab: {}, neg: {}, ruido: d.ruido, interv: 0, decreto: true };
      let si = 0, no = 0, abs = 0; const det = {};
      for (const k in base) {
        let n = base[k]; if (!n) continue; const ju = mi && J && k === J.partido && (!dp || T.jugadorEnDP(E, c));
        if (ju) n -= 1;
        const ps = T.posturaAut(E, c, b, k), gob = rc.gob && rc.gob.coalicion.includes(k);
        const v = ps.voto === 'no' && gob ? 'si' : ps.voto === 'abs' && (rc.gob && !gob && U.chance(0.35)) ? 'si' : ps.voto;
        let sn = 0, nn = 0, an = 0; const add = (vv, q) => { if (vv === 'si') sn += q; else if (vv === 'no') nn += q; else an += q; };
        add(v, n); if (ju) add(mi, 1); si += sn; no += nn; abs += an; det[k] = { si: sn, no: nn, abs: an };
      }
      const ok = si > no; d.v = { si, no, abs, ok, det, t: E.fecha.t, organo: dp ? 'dp' : 'pleno', mi };
      d.estado = ok ? 'convalidado' : 'derogado'; d.t1 = E.fecha.t;
      pa.hist.unshift({ t: E.fecha.t, id: d.id, prog: d.prog, organo: d.v.organo, si, no, abs, ok }); if (pa.hist.length > 25) pa.hist.length = 25;
      const org = dp ? 'la Diputación Permanente' : 'el Parlamento';
      if (ok) {
        C.Noticias.poner(E, 'politica', `${org === 'el Parlamento' ? 'El Parlamento' : 'La Diputación Permanente'} de ${nm(c)} convalida el decreto-ley «${prog.n}» (${si}–${no}).`, 'ES');
        if (rc.gob) rc.gob.estab = clamp(rc.gob.estab + 1.5, 0, 100);
      } else {
        rc.gestion[prog.area] = clamp(rc.gestion[prog.area] - prog.gest * d.eff * 0.8, 5, 98);
        if (rc.gob) { rc.gob.estab = clamp(rc.gob.estab - 4, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob - 1.2, 5, 90); }
        C.Noticias.poner(E, 'politica', `${org === 'el Parlamento' ? 'El Parlamento' : 'La Diputación Permanente'} de ${nm(c)} deroga el decreto-ley «${prog.n}» (${si}–${no}).`, 'ES');
      }
      if (J && d.jugador && J.region === c) { C.Personaje.log(E, `${ok ? 'Se convalida' : 'Se deroga'} tu decreto-ley: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: ok ? 1.5 : -2 }, true); }
      if (mi && J) { const linea = T.posturaAut(E, c, b, J.partido).voto; if (linea !== mi && linea !== 'abs') C.Personaje.cambiar(E, { prestigio: -1 }, true); }
      if (E.esp.pendienteConvAut && E.esp.pendienteConvAut.id === d.id) E.esp.pendienteConvAut = null;
      return d.v;
    },
    rdlAut(E, c, id) { return T.paAsegurar(E, c).rdl.find(x => x.id === id); },

    /* Turno semanal del Parlamento: disolución (caducan las iniciativas), decretos del Gobierno y convalidaciones. */
    parlTurno(E, c) {
      const rc = E.esp.ccaa[c], pa = T.paAsegurar(E, c), t = E.fecha.t, J = E.jugador, dis = T.disuelto(E, c);
      if (dis && !pa.dis) {
        pa.dis = true; let cad = 0;
        for (const b of (rc.leyes || [])) if (b.estado === 'tramite' && b.etapa && !b.pres) { b.estado = 'rechazada'; b.etapa = 'fin'; b.t1 = t; b.tEtapa = t; b.hist.push({ t, txt: 'Caduca por la disolución del Parlamento' }); cad++; if (E.esp.pendienteVotoAut && E.esp.pendienteVotoAut.id === b.id) E.esp.pendienteVotoAut = null; }
        C.Noticias.poner(E, 'politica', `El Parlamento de ${nm(c)} queda disuelto${cad ? ': caducan ' + cad + ' iniciativa(s) en trámite' : ''}. La Diputación Permanente asume las funciones de control y convalidación.`, 'ES');
      } else if (!dis && pa.dis) { pa.dis = false; pa.dp = null; }
      // El Gobierno aprueba decretos-ley (más cuando no puede legislar)
      const jug = J && J.pais === 'ES' && J.region === c && J.cargo === 'presauto' && rc.gob && rc.gob.pres === 'J';
      if (rc.gob && !jug && !rc.suspendida) {
        const pend = pa.rdl.filter(d => d.estado === 'vigor').length;
        if (pend < MAX_PEND && U.chance(dis ? 0.05 : 0.008)) {
          const disp = T.leyesDisponibles(E, c).filter(p => !pa.rdl.some(d => d.prog === p.id && d.estado === 'vigor') && !(rc.leyes || []).some(l => l.prog === p.id && l.estado === 'tramite'));
          if (disp.length) T.decretar(E, c, U.pick(disp).id, { quien: 'Gobierno autonómico' });
        }
      }
      // Convalidaciones vencidas
      for (const d of pa.rdl) {
        if (d.estado !== 'vigor' || t < d.tVoto) continue;
        const dp = T.organo(E, c) === 'dp', votante = J && J.pais === 'ES' && J.region === c && T.jugadorEnParl(E, c) && !(rc.gob && rc.gob.pres === 'J') && (!dp || T.jugadorEnDP(E, c));
        if (votante && !E.meta.presim) { if (!E.esp.pendienteConvAut) E.esp.pendienteConvAut = { c, id: d.id }; }
        else T.convalidar(E, c, d, null);
      }
    }
  });

  // Gancho en la tramitación semanal de cada comunidad: la disolución se resuelve antes que las leyes
  const f0 = T.leyesTurno; T.leyesTurno = function (E, c) { T.parlTurno(E, c); return f0.apply(this, arguments); };
  // No se pueden registrar proposiciones con el Parlamento disuelto
  const p0 = T.proponerLeyAut; T.proponerLeyAut = function (E, c, progId) { if (T.disuelto(E, c)) return { ok: false, msg: 'El Parlamento está disuelto: sólo puede reunirse la Diputación Permanente.' }; return p0.apply(this, arguments); };

  C.Acciones.registrar({ id: 'decreto_ley_aut', nombre: 'Aprobar un decreto-ley autonómico', icono: '📑', costo: 2, grupo: 'autonomico',
    desc: 'Presidente/a autonómico/a: el Consejo de Gobierno aprueba un decreto-ley que entra en vigor ya y debe convalidarse en 30 días (Pleno o Diputación Permanente si el Parlamento está disuelto).',
    disponible: E => { const J = E.jugador, rc = J.region && E.esp.ccaa[J.region]; return rc && rc.gob && rc.gob.pres === 'J' ? true : 'Sólo el presidente autonómico'; },
    ejecutar: (E, a) => { const r = T.decretar(E, E.jugador.region, a.prog, { jugador: true, quien: E.jugador.nombre }); return r; } });
})(window.ESP);

/* Barones territoriales: los presidentes autonómicos de tu partido tienen lealtad y ambición propias.
   Si se sienten maltratados pueden rebelarse y, en último extremo, fundar un partido regional que se lleva votos, escaños y gobierno.
   Estado: E.esp.bar = { b:{REG:{id,leal,amb,ult}}, esc:[{t,reg,pid,baron,de}], hist[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const Br = C.Barones = {
    asegurar(E) { if (!E.esp.bar) E.esp.bar = { b: {}, esc: [], hist: [] }; return E.esp.bar; },
    nota(E, txt) { const s = Br.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 20) s.hist.length = 20; },
    /* Barones actuales: presidentes autonómicos del partido del jugador (que no sean él/ella). */
    lista(E) {
      const J = E.jugador, s = Br.asegurar(E), out = []; if (!J || J.pais !== 'ES') return out;
      for (const c of C.Territorio.ids()) {
        const g = E.esp.ccaa[c].gob, pol = g && E.politicos[g.pres];
        if (g && g.partido === J.partido && pol && g.pres !== 'J') {
          let b = s.b[c]; if (!b || b.id !== g.pres) b = s.b[c] = { id: g.pres, leal: clamp(U.gauss(65, 10), 35, 90), amb: Math.round(U.clamp(U.gauss(50, 18), 10, 95)), ult: -99 };
          out.push({ c, b, pol });
        } else if (s.b[c]) delete s.b[c];
      }
      return out;
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const t = E.fecha.t, pa = E.partidos[J.partido], P = E.paises.ES, pm = P.gob.partido === J.partido;
      for (const { c, b } of Br.lista(E)) {
        const rc = E.esp.ccaa[c], obj = 38 + pa.cohesion * 0.35 + (J.prestigio - 50) * 0.18 + (rc.relM - 55) * (pm ? 0.3 : 0.1) - rc.agravio * 0.8 - (b.amb - 50) * 0.25 + (rc.gob.aprob - 50) * 0.15;
        b.leal = clamp(b.leal + (obj - b.leal) * 0.04 + U.gauss(0, 1), 0, 100);
        if (b.leal < 30 && t - b.ult >= 10 && C.Dilemas && !C.Dilemas.asegurar(E).act.some(x => x.id === 'escision') && U.chance(0.05 + (30 - b.leal) * 0.003)) { const x = C.Dilemas.nuevo(E, 'escision'); if (x) { x.reg = c; b.ult = t; } }
      }
    },
    /* El barón se marcha y funda un partido regional. fuerza 0.4–1: cuánta estructura se lleva. */
    fundar(E, c, fuerza) {
      const J = E.jugador, P = E.paises.ES, s = Br.asegurar(E), rc = E.esp.ccaa[c]; if (!rc) return null; const g = rc.gob, old = J.partido, op = E.partidos[old], pol = g && E.politicos[g.pres]; if (!pol || g.partido !== old) return null;
      const cn = D().ccaa[c].nombre, sigla = ('B' + c).slice(0, 4), pid = 'ES_' + sigla + s.esc.length;
      const reg = (E.esp.aggReg && E.esp.aggReg[c] && E.esp.aggReg[c][old]) || 20, cuota = clamp(reg * (0.25 + fuerza * 0.3), 3, 28);
      const nombre = U.pick(['Unidos por ' + cn, 'Alternativa ' + cn, cn + ' Primero', 'Compromís ' + cn, 'Partido Regionalista de ' + cn]);
      const pa = { id: pid, pais: 'ES', nombre, sigla, arq: op.arq, color: '#' + ((parseInt(op.color.slice(1), 16) ^ 0x3a5f2c) & 0xffffff).toString(16).padStart(6, '0'), eco: op.eco + U.ri(-6, 6), soc: op.soc + U.ri(-6, 6), eu: op.eu, ter: clamp((op.ter || 0) + 20, -60, 80), indep: 0, grupo: op.grupo, amb: 'reg', region: c, pop: cuota, base: cuota, popN: 0, cohesion: 80, finanzas: 35, militantes: 3000, lider: pol.id, nuevo: true, rp: { [c]: cuota }, rp0: { [c]: cuota } };
      E.partidos[pid] = pa; P.partidos.push(pid); E.esp.regionales.push(pid);
      for (const prov in D().provincias) { E.esp.pn[prov][pid] = 1; if (D().provincias[prov][1] === c) E.esp.pn[prov][old] *= clamp(1 - cuota / Math.max(reg, 1) * 0.9, 0.35, 0.95); }
      pol.p = pid; pol.partido = pid; g.partido = pid; g.coalicion = [pid].concat(g.coalicion.filter(k => k !== old && k !== pid));
      // Escaños autonómicos y diputados al Congreso que se van con él
      const esc = rc.parl.escanos, tr = Math.round((esc[old] || 0) * clamp(fuerza * 0.55, 0.2, 0.6)); esc[old] = (esc[old] || 0) - tr; esc[pid] = tr; if (!esc[old]) delete esc[old];
      let dip = 0; if (C.Personas) { const cand = E.parl.miembros.filter(id => E.politicos[id] && E.politicos[id].p === old && id !== 'J'); const n = Math.min(cand.length || 0, Math.round(1 + fuerza * 3)); for (let i = 0; i < n; i++) if (C.Personas.mover(E, cand.splice(U.ri(0, cand.length - 1), 1)[0], pid, 'escisión')) dip++; }
      op.cohesion = clamp(op.cohesion - 6 * fuerza, 15, 99); if (C.PartidoInt) { const pi = C.PartidoInt.asegurar(E); pi.fac.barones = clamp(pi.fac.barones - 3, 5, 60); }
      C.Personaje.cambiar(E, { prestigio: -2.5 * fuerza }, true); if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, -35);
      s.esc.unshift({ t: E.fecha.t, reg: c, pid, baron: pol.n, de: old, dip }); delete s.b[c];
      Br.nota(E, `${pol.n} abandona ${op.sigla} y funda «${nombre}» en ${cn}${dip ? ` con ${dip} diputado(s)` : ''}.`);
      C.Noticias.poner(E, 'politica', `ESCISIÓN: ${pol.n}, presidente/a de ${cn}, abandona ${op.sigla} y funda «${nombre}»; se lleva el gobierno autonómico.`, 'ES');
      return pid;
    },
    /* Reabsorbe una escisión (si la relación lo permite): el partido regional se disuelve y el barón vuelve. */
    reconciliar(E, pid) {
      const J = E.jugador, s = Br.asegurar(E), e = s.esc.find(x => x.pid === pid && !x.cerrada), pa = E.partidos[pid]; if (!e || !pa) return { ok: false, msg: 'No hay nada que reconciliar' };
      if (E.fecha.t - e.t < 20) return { ok: false, msg: 'Es pronto: las heridas siguen abiertas' };
      const rel = C.Mayorias ? C.Mayorias.asegurar(E).rel[pid] : 0; if (rel < 10) return { ok: false, msg: 'La relación está demasiado rota (necesitas mejorarla con el partido regional)' };
      if (!U.chance(clamp(0.3 + rel / 120 + (J.atrib.negociacion || 5) / 30, 0.2, 0.85))) { if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, -4); return { ok: true, exito: false, msg: 'El intento de reconciliación fracasa' }; }
      const old = E.partidos[e.de], c = e.reg, rc = E.esp.ccaa[c], pol = E.politicos[pa.lider], esc = rc.parl.escanos; pa.rp[c] = 0; e.cerrada = true; pa.disuelto = true;
      for (const prov in D().provincias) if (D().provincias[prov][1] === c) E.esp.pn[prov][e.de] = Math.min(1.3, E.esp.pn[prov][e.de] / 0.6);
      esc[e.de] = (esc[e.de] || 0) + (esc[pid] || 0); delete esc[pid]; if (pol) { pol.p = e.de; pol.partido = e.de; } if (rc.gob && rc.gob.partido === pid) { rc.gob.partido = e.de; rc.gob.coalicion = [e.de].concat(rc.gob.coalicion.filter(k => k !== pid)); }
      old.cohesion = clamp(old.cohesion + 4, 15, 99); C.Personaje.cambiar(E, { prestigio: 2.5 }); Br.nota(E, `${pol ? pol.n : 'El barón'} regresa a ${old.sigla}.`); C.Noticias.poner(E, 'politica', `Reconciliación: ${pa.nombre} se disuelve y su líder vuelve a ${old.sigla}.`, 'ES');
      return { ok: true, msg: 'Reconciliación lograda: el barón vuelve a casa' };
    },
    cortejar(E, c) {
      const s = Br.asegurar(E), b = s.b[c]; Br.lista(E); if (!b) return { ok: false, msg: 'Ese territorio no tiene un barón de tu partido' };
      const pol = E.politicos[b.id]; b.leal = clamp(b.leal + 12, 0, 100); E.esp.ccaa[c].agravio = Math.max(0, E.esp.ccaa[c].agravio - 0.6); C.Personaje.cambiar(E, { prestigio: 0.3 }); return { ok: true, msg: `Atiendes a ${pol.n}: su lealtad sube.` };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'partido', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España' }, o));
  R({ id: 'cortejar_baron', nombre: 'Atender a un barón', icono: '🧑‍💼', desc: 'Una llamada, una visita y un gesto: sube la lealtad de un presidente autonómico de tu partido.', ejecutar: (E, a) => Br.cortejar(E, a && a.c) });
  R({ id: 'reconciliar_baron', nombre: 'Reconciliar con un barón escindido', icono: '🕊️', costo: 2, desc: 'Intenta que el partido fundado por un barón se disuelva y vuelva al redil.', ejecutar: (E, a) => Br.reconciliar(E, a && a.pid) });
  C.Tiempo.registrar('barones', { turno: Br.turno }, 57);
})(window.ESP);

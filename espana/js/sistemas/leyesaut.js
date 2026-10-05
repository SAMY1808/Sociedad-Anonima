/* Leyes autonómicas con tramitación parlamentaria: registro → comisión → pleno → votación.
   Igual que en las Cortes, el jugador puede cabildear con cada grupo, intervenir en el debate, negociar en bloque con contrapartidas y votar. Amplía C.Territorio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio, clamp = U.clamp;
  const afin = (E, a, b) => 1 - U.distIdeo(E.partidos[a], E.partidos[b]);
  const SEM_REG = 1, SEM_COM = 2, SEM_PLE = 1;
  const f = (E, ...ks) => U.suma(ks.map(k => E.jugador.atrib[k])) / (10 * ks.length);
  const nom = c => D().ccaa[c].nombre;

  /* Contrapartidas que un grupo puede pedir a cambio de su voto. */
  const OFERTAS = {
    enmienda: { n: 'Aceptar una enmienda suya', d: 'Recorta un 12 % el alcance de la ley.', v: 0.34, icono: '✍️' },
    inversion: { n: 'Inversión en su territorio', d: 'Sube algo la deuda autonómica.', v: 0.3, icono: '🏗️' },
    cargo: { n: 'Un puesto en el Gobierno / altos cargos', d: 'Erosiona un poco la estabilidad de tu bloque.', v: 0.27, icono: '💼' },
    favor: { n: 'Prometer apoyar su próxima ley', d: 'Te compromete: pierdes algo de prestigio si no cumples.', v: 0.2, icono: '🤝' }
  };

  Object.assign(T, {
    OFERTAS_AUT: OFERTAS, SEM_REG, SEM_COM, SEM_PLE,
    ETAPAS_AUT: [['registro', 'Registro'], ['comision', 'Comisión'], ['pleno', 'Pleno'], ['fin', 'Resultado']],

    /* Leyes autonómicas que se pueden presentar: los programas de tipo «ley» de las áreas con competencias. */
    leyesDisponibles(E, c) {
      const out = [];
      for (const a in D().programas) for (const p of D().programas[a]) if (p.tipo === 'ley') out.push(p);
      return out.filter(p => T.nivelArea(E, c, p.area) >= 0.45 || ['pre', 'eco'].includes(p.area));
    },

    /* Postura de un grupo ante una ley: afinidad con el autor, gobierno/oposición, cabildeo, negociación y azar. */
    posturaAut(E, c, b, k) {
      const rc = E.esp.ccaa[c], g = rc.gob, fac = [];
      const gob = !!(g && g.coalicion.includes(k)), autorGob = !!(g && g.coalicion.includes(b.pid));
      const a = k === b.pid ? 1 : afin(E, b.pid, k);
      const base = a * 1.5 - 0.85; fac.push(['Afinidad con el autor', base]);
      let ctx = 0; if (gob && autorGob) ctx = 0.12; else if (gob && !autorGob) ctx = -0.02; else if (!gob && autorGob) ctx = -0.1; else ctx = 0.03;
      if (ctx) fac.push([gob ? 'Grupo del Gobierno' : 'Oposición', ctx]);
      if (b.pres) fac.push(['Responsabilidad institucional (presupuestos)', 0.16]);
      const cab = (b.cab && b.cab[k]) || 0; if (cab) fac.push(['Cabildeo', cab]);
      const neg = (b.neg && b.neg[k]) || 0; if (neg) fac.push(['Negociación', neg]);
      const iv = (b.interv || 0) * 0.04; if (iv) fac.push(['Debate', iv]);
      const rz = (b.ruido && b.ruido[k]) || 0; if (rz) fac.push(['Línea del grupo', rz]);
      const score = fac.reduce((s, x) => s + x[1], 0);
      return { voto: score >= 0.2 ? 'si' : score <= -0.05 ? 'no' : 'abs', score, factores: fac };
    },
    proyectarAut(E, c, b) {
      const rc = E.esp.ccaa[c], esc = rc.parl.escanos, tot = U.suma(Object.values(esc));
      let si = 0, no = 0, abs = 0; const pos = {};
      for (const k in esc) { const ps = T.posturaAut(E, c, b, k); pos[k] = ps; if (ps.voto === 'si') si += esc[k]; else if (ps.voto === 'no') no += esc[k]; else abs += esc[k]; }
      return { si, no, abs, tot, may: Math.floor(tot / 2) + 1, dist: si - no, pos, p: clamp(0.5 + (si - no) / tot * 2.6, 0.04, 0.96) };
    },
    /* Estimación previa a presentar una ley un partido. */
    votoLeyAut(E, c, prog, pid) { return T.proyectarAut(E, c, { pid, cab: {}, neg: {}, ruido: {}, interv: 0 }); },

    presLey: true,
    nuevaLeyAut(E, c, o) {
      const rc = E.esp.ccaa[c], t = E.fecha.t, ruido = {};
      for (const k in rc.parl.escanos) ruido[k] = Math.round(U.gauss(0, 0.1) * 100) / 100;
      const b = { id: (o.jugador ? 'L' : 'G') + t + o.prog, prog: o.prog, pid: o.pid, quien: o.quien, jugador: !!o.jugador, estado: 'tramite', etapa: 'registro', t0: t, tEtapa: t, eff: o.eff, cab: {}, neg: {}, enm: 0, interv: 0, intervEtapa: false, ruido, ofertas: [], hist: [{ t, txt: `${o.quien} registra la ley en el Parlamento` }], v: null };
      T.registrarLey(E, c, b);
      return b;
    },
    leyAut(E, c, id) { return (E.esp.ccaa[c].leyes || []).find(x => x.id === id); },
    activa(b) { return b && b.estado === 'tramite' && b.etapa; },

    /* El jugador, diputado/a autonómico/a, registra una proposición de ley. */
    proponerLeyAut(E, c, progId) {
      const rc = E.esp.ccaa[c], J = E.jugador, prog = T.programa(progId);
      if (!prog || prog.tipo !== 'ley') return { ok: false, msg: 'Ley desconocida' };
      T.asegurarAut(E, c);
      if ((rc.leyes || []).some(l => l.prog === progId && l.estado === 'tramite') || rc.pend.some(p => p.tipo === 'prog' && p.prog === progId)) return { ok: false, msg: 'Esa ley ya está en tramitación.' };
      const eff = 0.5 + 0.35 * Math.min(1, T.nivelArea(E, c, prog.area) / 1.5);
      const b = T.nuevaLeyAut(E, c, { prog: progId, pid: J.partido, quien: J.nombre, jugador: true, eff });
      const v = T.proyectarAut(E, c, b);
      return { ok: true, msg: `Registras la proposición «${prog.n}». Pasará por comisión y se votará en el pleno en unas ${SEM_REG + SEM_COM + SEM_PLE} semanas: cabildea, negocia y debate para sumar apoyos (ahora ${v.si} sí · ${v.no} no).`, p: v.p };
    },

    /* ── Tramitación semanal ── */
    leyesTurno(E, c) {
      const rc = E.esp.ccaa[c], t = E.fecha.t, J = E.jugador;
      for (const b of (rc.leyes || [])) {
        if (b.estado !== 'tramite' || !b.etapa) continue;
        if (b.etapa === 'registro' && t - b.tEtapa >= SEM_REG) T.avanzarLey(E, c, b, 'comision', 'Admitida a trámite: pasa a la Comisión');
        else if (b.etapa === 'comision' && t - b.tEtapa >= SEM_COM) T.avanzarLey(E, c, b, 'pleno', 'Dictamen de la Comisión: pasa al Pleno');
        else if (b.etapa === 'pleno' && t - b.tEtapa >= SEM_PLE) {
          if (T.jugadorEnParl && T.jugadorEnParl(E, c) && !E.meta.presim) { if (!E.esp.pendienteVotoAut) E.esp.pendienteVotoAut = { c, id: b.id }; }
          else T.votarLey(E, c, b, null);
        }
      }
      // Proposiciones de la oposición en la comunidad del jugador
      if (J && J.region === c && !E.meta.presim && (rc.leyes || []).filter(l => l.estado === 'tramite').length < 3 && U.chance(0.012)) {
        const g = rc.gob, esc = rc.parl.escanos, op = Object.keys(esc).filter(k => esc[k] >= 4 && !(g && g.coalicion.includes(k)) && k !== J.partido);
        const disp = T.leyesDisponibles(E, c).filter(p => !(rc.leyes || []).some(l => l.prog === p.id && l.estado === 'tramite'));
        if (op.length && disp.length) { const pid = U.pick(op), prog = U.pick(disp); T.nuevaLeyAut(E, c, { prog: prog.id, pid, quien: 'Grupo ' + E.partidos[pid].sigla, jugador: false, eff: 0.5 }); C.Noticias.poner(E, 'politica', `${E.partidos[pid].sigla} registra en el Parlamento de ${nom(c)} la proposición «${prog.n}».`, 'ES'); }
      }
    },
    avanzarLey(E, c, b, etapa, txt) { b.etapa = etapa; b.tEtapa = E.fecha.t; b.intervEtapa = false; b.hist.push({ t: E.fecha.t, txt }); },

    /* Votación en el pleno. mi = voto del jugador (si, abs, no) o null. */
    votarLey(E, c, b, mi) {
      const rc = E.esp.ccaa[c], prog = T.programa(b.prog), J = E.jugador, esc = rc.parl.escanos; if (!prog) { b.estado = 'rechazada'; return; }
      const pr = T.proyectarAut(E, c, b); let si = 0, no = 0, abs = 0; const det = {};
      for (const k in esc) {
        let n = esc[k], v = pr.pos[k].voto, linea = v;
        const ju = mi && J && k === J.partido;
        if (ju) n -= 1;
        // Indisciplina de unos pocos diputados
        const rebel = Math.round(n * (v === 'abs' ? 0.04 : 0.025) * (U.chance(0.5) ? 1 : 0));
        let sn = 0, nn = 0, an = 0;
        const add = (vv, q) => { if (vv === 'si') sn += q; else if (vv === 'no') nn += q; else an += q; };
        add(v, n - rebel); if (rebel) add(v === 'si' ? 'abs' : v === 'no' ? 'abs' : 'no', rebel);
        if (ju) add(mi, 1);
        si += sn; no += nn; abs += an; det[k] = { linea, si: sn, no: nn, abs: an };
      }
      const ok = si > no, nm = nom(c);
      b.v = { si, no, abs, ok, det, t: E.fecha.t, mi };
      if (b.pres) { b.estado = ok ? 'aprobada' : 'rechazada'; b.etapa = 'fin'; b.t1 = E.fecha.t; b.tEtapa = E.fecha.t; b.hist.push({ t: E.fecha.t, txt: `Pleno: ${si} a favor, ${no} en contra, ${abs} abstenciones. ${ok ? 'APROBADOS' : 'RECHAZADOS'}` }); T.presResultado(E, c, ok, rc.pres.tramite || { alloc: rc.pres.alloc, def: rc.pres.def, fisc: rc.fisc }); if (E.esp.pendienteVotoAut && E.esp.pendienteVotoAut.id === b.id) E.esp.pendienteVotoAut = null; return b.v; }
      b.estado = ok ? 'aprobada' : 'rechazada'; b.etapa = 'fin'; b.t1 = E.fecha.t; b.tEtapa = E.fecha.t;
      b.hist.push({ t: E.fecha.t, txt: `Pleno: ${si} a favor, ${no} en contra, ${abs} abstenciones. ${ok ? 'APROBADA' : 'RECHAZADA'}` });
      const sg = E.partidos[b.pid].sigla;
      if (ok) {
        T.aplicarPrograma(E, c, prog, b.eff * (1 - 0.12 * (b.enm || 0)));
        C.Noticias.poner(E, 'politica', `El Parlamento de ${nm} aprueba${b.jugador ? ' la proposición de ley de ' + b.quien + ' (' + sg + ')' : ''}: ${prog.n} (${si}–${no}).`, 'ES');
        if (J && b.jugador && J.region === c) { C.Personaje.log(E, `El Parlamento de ${nm} aprueba tu proposición: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: 3 + (b.neg && Object.keys(b.neg).length ? 0.5 : 0), pop: 1.5 }, true); }
      } else {
        if (rc.gob && !b.jugador && rc.gob.coalicion.includes(b.pid)) rc.gob.estab = clamp(rc.gob.estab - 2, 0, 100);
        C.Noticias.poner(E, 'politica', `El Parlamento de ${nm} rechaza${b.jugador ? ' la proposición de ley de ' + sg : ''}: ${prog.n} (${si}–${no}).`, 'ES');
        if (J && b.jugador && J.region === c) { C.Personaje.log(E, `El Parlamento de ${nm} rechaza tu proposición: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: -1 }, true); }
      }
      if (mi && J) { const linea = pr.pos[J.partido] ? pr.pos[J.partido].voto : mi; if (linea !== mi && linea !== 'abs') C.Personaje.cambiar(E, { prestigio: -1.2 }, true); }
      if (E.esp.pendienteVotoAut && E.esp.pendienteVotoAut.id === b.id) E.esp.pendienteVotoAut = null;
      return b.v;
    },

    /* ── Acciones del jugador sobre una ley en trámite ── */
    cabildearAut(E, c, id, k, lado) {
      const b = T.leyAut(E, c, id); if (!T.activa(b)) return { ok: false, msg: 'Elige una ley en trámite' };
      if (!E.partidos[k] || !(E.esp.ccaa[c].parl.escanos[k] > 0)) return { ok: false, msg: 'Elige un grupo' };
      const x = f(E, 'negociacion', 'carisma'), gana = lado === 'no' ? -1 : 1;
      if (U.chance(0.45 + 0.5 * x)) { b.cab[k] = clamp((b.cab[k] || 0) + gana * (0.2 + 0.2 * x), -0.8, 0.8); b.hist.push({ t: E.fecha.t, txt: `${E.jugador.nombre} cabildea con ${E.partidos[k].sigla} ${gana > 0 ? 'a favor' : 'en contra'}` }); return { ok: true, msg: `${E.partidos[k].sigla} acepta moverse ${gana > 0 ? 'a favor' : 'en contra'} de la ley.` }; }
      return { ok: true, exito: false, msg: `${E.partidos[k].sigla} no se deja convencer.` };
    },
    intervenirAut(E, c, id) {
      const b = T.leyAut(E, c, id); if (!T.activa(b) || !['comision', 'pleno'].includes(b.etapa)) return { ok: false, msg: 'Sólo puedes intervenir en comisión o en el pleno' };
      if (b.intervEtapa) return { ok: false, msg: 'Ya has intervenido en esta fase' };
      const x = f(E, 'oratoria', 'carisma'); b.intervEtapa = true;
      const ef = (U.chance(0.35 + 0.6 * x) ? 1 : 0) * (E.jugador.partido === b.pid || E.partidos[b.pid] && afin(E, E.jugador.partido, b.pid) > 0.5 ? 1 : -1);
      b.interv = (b.interv || 0) + ef * (1 + (x > 0.6 ? 1 : 0));
      b.hist.push({ t: E.fecha.t, txt: `${E.jugador.nombre} interviene en el debate de ${b.etapa === 'comision' ? 'la Comisión' : 'el Pleno'}` });
      if (ef) { C.Personaje.cambiar(E, { pop: 0.8 + 1.5 * x, prestigio: 0.5 + x }); return { ok: true, msg: 'Tu intervención inclina el debate' + (ef > 0 ? ' a favor de la ley.' : ' en contra de la ley.') }; }
      C.Personaje.cambiar(E, { pop: 0.1 }); return { ok: true, exito: false, msg: 'Tu intervención pasa sin pena ni gloria.' };
    },
    /* Negociación en bloque: ofertas = { pid: 'enmienda'|'inversion'|'cargo'|'favor' }. */
    negociarAut(E, c, id, ofertas) {
      const b = T.leyAut(E, c, id), rc = E.esp.ccaa[c]; if (!T.activa(b)) return { ok: false, msg: 'Elige una ley en trámite' };
      const ks = Object.keys(ofertas || {}).filter(k => ofertas[k] && OFERTAS[ofertas[k]]); if (!ks.length) return { ok: false, msg: 'Elige al menos un grupo y una contrapartida' };
      const x = f(E, 'negociacion', 'carisma'); let ok = 0, fallo = 0; const res = [];
      for (const k of ks) {
        const of = OFERTAS[ofertas[k]], a = k === b.pid ? 1 : afin(E, b.pid, k), veta = a < 0.22;
        const p = clamp(0.5 + x * 0.35 + (a - 0.5) * 0.5 - (veta ? 0.4 : 0), 0.08, 0.92);
        if (U.chance(p)) {
          b.neg[k] = clamp((b.neg[k] || 0) + of.v, -0.8, 0.9); ok++; res.push(E.partidos[k].sigla + ' ✔');
          if (ofertas[k] === 'enmienda') b.enm = (b.enm || 0) + 1;
          else if (ofertas[k] === 'inversion') rc.deuda = clamp(rc.deuda + 0.8, 3, 120);
          else if (ofertas[k] === 'cargo' && rc.gob) rc.gob.estab = clamp(rc.gob.estab - 1.2, 0, 100);
          else if (ofertas[k] === 'favor') { b.ofertas.push(k); E.jugador.favoresAut = (E.jugador.favoresAut || 0) + 1; }
        } else { fallo++; res.push(E.partidos[k].sigla + ' ✘'); }
      }
      b.hist.push({ t: E.fecha.t, txt: `${E.jugador.nombre} negocia en bloque (${res.join(', ')})` });
      if (ok) C.Personaje.cambiar(E, { prestigio: 0.6 + 0.3 * ok });
      return { ok: true, exito: ok > 0, msg: `Negociación: ${res.join(' · ')}.` };
    }
  });
})(window.ESP);

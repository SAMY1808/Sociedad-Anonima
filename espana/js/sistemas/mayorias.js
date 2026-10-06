/* Mayorías alternativas y rivales: calculadora de mayorías para mociones de censura, y oposición con personalidad (bloqueo, pacto, populismo…).
   Estado: E.esp.mayo = { estilo:{pid}, rel:{pid}, ofertas:[], sonda:{t, est}, hist:[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const ESTILOS = {
    bloqueo: ['Bloqueo', '🧱', 'Vota en contra de casi todo y desgasta al Gobierno (baja su estabilidad).'],
    pactista: ['Pactista', '🤝', 'Ofrece pactos de Estado y busca el protagonismo del acuerdo.'],
    populista: ['Populista', '📣', 'Vive en la calle y en las redes: sube sola en opinión a costa del Gobierno.'],
    institucional: ['Institucional', '🏛', 'Apoya la política de Estado: sube su relación contigo si gobiernas con responsabilidad.'],
    oportunista: ['Oportunista', '🦊', 'Se lanza sobre cada escándalo y pide dimisiones.']
  };
  const M = C.Mayorias = {
    ESTILOS,
    asegurar(E) { if (!E.esp.mayo) E.esp.mayo = { estilo: {}, rel: {}, ofertas: [], sonda: null, hist: [], ult: {} }; const m = E.esp.mayo; const P = E.paises.ES, J = E.jugador;
      for (const k of P.partidos) { if (m.estilo[k] == null) { const p = E.partidos[k], r = Math.abs(p.ter || 0); m.estilo[k] = p.amb === 'reg' ? U.pick(['pactista', 'oportunista', 'institucional']) : p.eco > 25 || r > 45 ? U.pick(['bloqueo', 'populista', 'oportunista']) : U.pick(['institucional', 'pactista', 'oportunista', 'bloqueo']); }
        if (m.rel[k] == null) m.rel[k] = J ? Math.round(clamp(55 - U.distIdeo(E.partidos[J.partido], E.partidos[k]) * 80 + U.gauss(0, 8), -80, 90)) : 0; }
      return m; },
    oposicion(E) { return C.Ejecutivo.oposicion(E); },
    /* Alternativas nacionales a una moción de censura. */
    alternativas(E) {
      const P = E.paises.ES, out = [];
      for (const cand of M.oposicion(E).slice(0, 4)) { const pl = C.Ejecutivo.mejorPlan(E, cand), ev = pl.ev; out.push({ cand, bloque: pl.bloque, si: ev.si, no: ev.no, abs: ev.abs, falta: Math.max(0, 176 - ev.si), exito: ev.exito1, est: ev.est, vetos: P.partidos.filter(p => !pl.bloque.includes(p) && (P.escanos[p] || 0) > 0 && pl.bloque.some(q => C.Ejecutivo.vetaA(E, p, q))) }); }
      return out;
    },
    /* Alternativas autonómicas (bloque opositor más afín). */
    alternativasAut(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, esc = rc.parl.escanos, tot = U.suma(Object.values(esc)), may = Math.floor(tot / 2) + 1; if (!g) return [];
      const opo = Object.keys(esc).filter(k => !g.coalicion.includes(k) && esc[k] > 0).sort((a, b) => esc[b] - esc[a]), out = [];
      for (const cand of opo.slice(0, 3)) { const b = [cand]; let s = esc[cand]; for (const k of Object.keys(esc).sort((x, y) => C.Ejecutivo.afinidad(E, cand, y) - C.Ejecutivo.afinidad(E, cand, x))) { if (b.includes(k) || C.Ejecutivo.afinidad(E, cand, k) < 0.3 || b.some(q => C.Ejecutivo.vetaA(E, k, q))) continue; b.push(k); s += esc[k]; if (s >= may) break; } out.push({ cand, bloque: b, si: s, may, falta: Math.max(0, may - s), exito: s >= may }); }
      return out;
    },
    cambiarRel(E, pid, d) { const m = M.asegurar(E); m.rel[pid] = clamp((m.rel[pid] || 0) + d, -100, 100); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const m = M.asegurar(E), P = E.paises.ES, g = P.gob, t = E.fecha.t;
      const opo = P.partidos.filter(k => !g.coalicion.includes(k) && (P.escanos[k] || 0) >= 8);
      for (const k of opo) { const e = m.estilo[k], p = E.partidos[k], suyo = k === J.partido;
        if (e === 'bloqueo' && !suyo) g.estab = clamp(g.estab - 0.04, 0, 100);
        else if (e === 'populista' && !suyo && U.chance(0.04)) C.Opinion.empujeES(E, k, 0.02);
        else if (e === 'institucional' && g.pm === 'J' && g.estab > 45) M.cambiarRel(E, k, 0.08);
        else if (e === 'oportunista' && !suyo && g.aprob < 42 && U.chance(0.015)) { C.Noticias.poner(E, 'politica', `${p.sigla} exige la dimisión del Gobierno: «no puede seguir así».`, 'ES'); g.aprob = clamp(g.aprob - 0.3, 5, 90); }
        else if (e === 'pactista' && !suyo && g.pm === 'J' && U.chance(0.012) && m.ofertas.length < 2 && !m.ofertas.some(o => o.pid === k)) m.ofertas.push({ id: U.id('o'), pid: k, t, tema: U.pick(['un pacto por la educación', 'un pacto de Estado por la sanidad', 'un acuerdo antiterrorista renovado', 'un pacto por el agua', 'un pacto de rentas']) });
      }
      m.ofertas = m.ofertas.filter(o => t - o.t < 8);
      for (const k of Object.keys(m.rel)) m.rel[k] = clamp(m.rel[k] + (50 - U.distIdeo(E.partidos[J.partido], E.partidos[k]) * 80 - m.rel[k]) * 0.004, -100, 100);
    },
    aceptarOferta(E, id) {
      const m = M.asegurar(E), o = m.ofertas.find(x => x.id === id), g = E.paises.ES.gob; if (!o) return { ok: false, msg: 'La oferta ha caducado' };
      m.ofertas = m.ofertas.filter(x => x !== o); g.estab = clamp(g.estab + 4, 0, 100); g.aprob = clamp(g.aprob + 0.8, 5, 90); M.cambiarRel(E, o.pid, 10); C.Personaje.cambiar(E, { prestigio: 1.5, pop: 0.5 });
      C.Noticias.poner(E, 'politica', `El Gobierno y ${E.partidos[o.pid].sigla} acuerdan ${o.tema}.`, 'ES'); m.hist.unshift({ t: E.fecha.t, txt: `Pacto con ${E.partidos[o.pid].sigla}: ${o.tema}.` }); return { ok: true, msg: `Pacto cerrado con ${E.partidos[o.pid].sigla}: ${o.tema}.` };
    },
    rechazarOferta(E, id) { const m = M.asegurar(E), o = m.ofertas.find(x => x.id === id); if (o) { M.cambiarRel(E, o.pid, -6); m.ofertas = m.ofertas.filter(x => x !== o); } return { ok: true, msg: 'Rechazas la oferta.' }; }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const es = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  R({ id: 'reunirse_rival', nombre: 'Reunirte con un rival', icono: '☕', desc: 'Una reunión discreta con el líder de otro partido: mejora vuestra relación.', disponible: es, ejecutar: (E, a) => { const p = E.partidos[a.pid]; if (!p) return { ok: false, msg: 'Elige un partido' }; M.cambiarRel(E, a.pid, 8 + E.jugador.atrib.negociacion / 2); return { ok: true, msg: `Te reúnes con ${p.sigla}: la relación mejora.` }; } });
  R({ id: 'atacar_rival', nombre: 'Atacar a un rival', icono: '🗡️', desc: 'Una ofensiva dialéctica contra otro partido: le resta apoyo pero empeora la relación.', disponible: es, ejecutar: (E, a) => { const p = E.partidos[a.pid]; if (!p || a.pid === E.jugador.partido) return { ok: false, msg: 'Elige un rival' }; C.Opinion.empujeES(E, a.pid, -0.05 - E.jugador.atrib.oratoria / 200); C.Opinion.empuje(E, E.jugador.partido, 0.02, 0.3); M.cambiarRel(E, a.pid, -7); return { ok: true, msg: `Atacas a ${p.sigla}: le restas apoyo.` }; } });
  R({ id: 'sondear_mayoria', nombre: 'Sondear a los grupos', icono: '📡', desc: 'Averigua con quién contaría cada alternativa de gobierno durante unas semanas.', disponible: es, ejecutar: E => { const m = M.asegurar(E); m.sonda = { t: E.fecha.t }; return { ok: true, msg: 'Tus colaboradores sondean a los grupos: verás las posturas probables.' }; } });
  C.Tiempo.registrar('mayorias', { turno: M.turno }, 44);
})(window.ESP);

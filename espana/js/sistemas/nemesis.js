/* Némesis: un rival personal con nombre, historia y memoria que reacciona a lo que haces (filtra casos, te quita aliados, te reta a debatir)
   y al que te enfrentas en cada elección. Estado: E.esp.nem = { pid, id, odio, ult, hist[], enfr[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const N = C.Nemesis = {
    asegurar(E) { if (!E.esp.nem) E.esp.nem = { pid: null, id: null, odio: 30, ult: -99, hist: [], enfr: [] }; return E.esp.nem; },
    /* Escoge (o renueva) al némesis: el líder del partido rival con más intención de voto. */
    elegir(E) {
      const J = E.jugador, s = N.asegurar(E), P = E.paises.ES; if (!J || J.pais !== 'ES') return s;
      const ok = k => P.partidos.includes(k) && k !== J.partido && E.partidos[k].amb === 'nac' && E.partidos[k].lider && E.partidos[k].lider !== 'J' && E.politicos[E.partidos[k].lider];
      const mejor = P.partidos.filter(ok).sort((a, b) => (E.partidos[b].popN || E.partidos[b].pop) - (E.partidos[a].popN || E.partidos[a].pop))[0];
      if (!mejor) return s;
      if (!s.pid || !ok(s.pid) || s.id !== E.partidos[s.pid].lider || (mejor !== s.pid && (E.partidos[mejor].popN || 0) > (E.partidos[s.pid].popN || 0) + 4)) { const cambio = s.pid; s.pid = mejor; s.id = E.partidos[mejor].lider; if (cambio) { s.odio = clamp(s.odio * 0.6, 10, 90); N.nota(E, `Nuevo némesis: ${E.politicos[s.id].n} (${E.partidos[mejor].sigla}).`); } else N.nota(E, `Tu némesis es ${E.politicos[s.id].n} (${E.partidos[mejor].sigla}).`); }
      return s;
    },
    nota(E, txt) { const s = N.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 25) s.hist.length = 25; },
    nombre(E) { const s = N.elegir(E); return s.id && E.politicos[s.id] ? E.politicos[s.id].n : 'tu rival'; },
    subir(E, d) { const s = N.asegurar(E); s.odio = clamp(s.odio + d, 0, 100); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const s = N.elegir(E), t = E.fecha.t, P = E.paises.ES; if (!s.pid) return; if (C.Tutor) C.Tutor.una(E, 'nemesis');
      const pa = E.partidos[J.partido], r = E.partidos[s.pid], nom = N.nombre(E), poder = (J.prestigio + (P.gob.pm === 'J' ? 20 : 0)) / 100;
      s.odio = clamp(s.odio + (30 + poder * 25 - s.odio) * 0.01 + (C.Mayorias ? (-C.Mayorias.asegurar(E).rel[s.pid] || 0) * 0.0006 : 0), 0, 100);
      const p = (0.012 + s.odio / 100 * 0.03) * ((C.Ajustes && C.Ajustes.get(E).rival) || 1); if (t - s.ult < 5 || !U.chance(p)) return; s.ult = t;
      const k = U.pesado(['filtra', 'ataca', 'aliado', 'reta'], x => ({ filtra: 1, ataca: 1.5, aliado: 0.8, reta: 0.8 })[x]);
      if (k === 'filtra' && C.Corrupcion && C.Corrupcion.asegurar(E).casos.filter(c => c.pid === J.partido && c.fase !== 'cerrado').length < 2) { C.Corrupcion.nuevo(E, J.partido, { gravedad: U.rf(0.25, 0.55), por: s.pid }); C.Noticias.poner(E, 'politica', `${nom} (${r.sigla}) respalda las informaciones que salpican a ${pa.sigla}.`, 'ES'); N.nota(E, `${nom} te filtra un caso.`); }
      else if (k === 'aliado' && C.Mayorias) { const ally = P.partidos.filter(x => x !== J.partido && x !== s.pid && (P.escanos[x] || 0) > 5).sort((a, b) => C.Mayorias.asegurar(E).rel[b] - C.Mayorias.asegurar(E).rel[a])[0]; if (ally) { C.Mayorias.cambiarRel(E, ally, -6); C.Mayorias.cambiarRel(E, s.pid, 4); C.Noticias.poner(E, 'politica', `${nom} se reúne con ${E.partidos[ally].sigla}: movimientos en el tablero de alianzas.`, 'ES'); N.nota(E, `${nom} te quita un aliado: ${E.partidos[ally].sigla}.`); } }
      else if (k === 'reta' && E.eventos.pendientes.length === 0) { const d = C.Eventos.def('nem_debate'); if (d && !C.Eventos.enfriado(E, d)) C.Eventos.disparar(E, d); }
      else { C.Opinion.empujeES(E, J.partido, -0.03 - s.odio / 100 * 0.03); C.Noticias.poner(E, 'politica', `${nom} (${r.sigla}) lanza una dura ofensiva contra ${J.nombre}: «${U.pick(['no está a la altura', 'ha traicionado a sus votantes', 'es el problema, no la solución', 'sólo piensa en su carrera'])}».`, 'ES'); N.nota(E, `${nom} te ataca públicamente.`); }
    },
    /* Cara a cara tras unas generales: se compara tu resultado con el suyo. */
    registrarElecciones(E, n) {
      const J = E.jugador, s = N.elegir(E); if (!s.pid || !J || J.pais !== 'ES') return; const tu = n.escanos[J.partido] || 0, el = n.escanos[s.pid] || 0;
      s.enfr.unshift({ t: E.fecha.t, tu, el, gana: tu > el }); if (s.enfr.length > 8) s.enfr.length = 8; N.nota(E, `Cara a cara en las urnas: ${E.partidos[J.partido].sigla} ${tu} frente a ${E.partidos[s.pid].sigla} ${el}.`);
      s.odio = clamp(s.odio + (tu > el ? 6 : -2), 0, 100);
    },
    tenderMano(E) { const s = N.elegir(E); if (!s.pid) return { ok: false, msg: 'Aún no tienes némesis' }; N.subir(E, -12); if (C.Mayorias) C.Mayorias.cambiarRel(E, s.pid, 7); C.Personaje.cambiar(E, { prestigio: 0.8 }); return { ok: true, msg: `Tiendes la mano a ${N.nombre(E)}: baja la tensión.` }; },
    provocar(E) { const s = N.elegir(E); if (!s.pid) return { ok: false, msg: 'Aún no tienes némesis' }; N.subir(E, 12); if (C.Mayorias) C.Mayorias.cambiarRel(E, s.pid, -6); C.Opinion.empujeES(E, s.pid, -0.04); C.Opinion.empuje(E, E.jugador.partido, 0.02, 0.3); return { ok: true, msg: `Provocas a ${N.nombre(E)}: sube el odio pero le restas apoyo.` }; },
    desafiar(E) { const s = N.elegir(E); if (!s.pid) return { ok: false, msg: 'Aún no tienes némesis' }; const J = E.jugador, o = (J.atrib.oratoria + J.atrib.carisma) / 20; N.subir(E, 6); if (U.chance(clamp(0.35 + o * 0.45, 0.2, 0.85))) { C.Opinion.empujeES(E, s.pid, -0.05); C.Opinion.empuje(E, J.partido, 0.04, 0.3); C.Personaje.cambiar(E, { prestigio: 1.5, pop: 1 }); N.nota(E, `Ganas un cara a cara a ${N.nombre(E)}.`); if (C.Dilemas) C.Dilemas.registrar(E, 'duelo', `Cara a cara con ${N.nombre(E)}: victoria`, 3); return { ok: true, msg: `Ganas el duelo dialéctico a ${N.nombre(E)}.` }; } C.Personaje.cambiar(E, { prestigio: -1.2, pop: -0.6 }); N.nota(E, `Pierdes un duelo con ${N.nombre(E)}.`); if (C.Dilemas) C.Dilemas.registrar(E, 'duelo', `Cara a cara con ${N.nombre(E)}: derrota`, -2.6); return { ok: true, exito: false, msg: `Sales mal parado del duelo con ${N.nombre(E)}.` }; }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España' }, o));
  R({ id: 'tender_mano_nemesis', nombre: 'Tender la mano a tu némesis', icono: '🕊️', desc: 'Bajas la tensión con tu gran rival.', ejecutar: E => N.tenderMano(E) });
  R({ id: 'provocar_nemesis', nombre: 'Provocar a tu némesis', icono: '🔥', desc: 'Subes la tensión: le restas apoyo pero crece el odio.', ejecutar: E => N.provocar(E) });
  R({ id: 'desafiar_nemesis', nombre: 'Desafiarle a un cara a cara', icono: '🥊', costo: 2, desc: 'Un duelo televisado con tu némesis: ganas o pierdes prestigio.', ejecutar: E => N.desafiar(E) });
  C.Tiempo.registrar('nemesis', { turno: N.turno }, 55);
})(window.ESP);

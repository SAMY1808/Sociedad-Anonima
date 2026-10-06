/* La Corona: popularidad del Rey, relación con el Gobierno, polémicas de la Casa Real, discurso y abdicación. Estado: E.esp.corona. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const POLEMICAS = ['un viaje privado que despierta críticas', 'la polémica por las cuentas de la Casa Real', 'unas declaraciones fuera de protocolo', 'el patrimonio de un miembro de la familia real', 'un negocio de un pariente del Rey'];
  const Co = C.Corona = {
    asegurar(E) { if (!E.esp.corona) E.esp.corona = { pop: 58, rel: 60, neutral: 70, crisis: null, bajas: 0, hist: [], ult: 0, reinado: 0, serie: [] }; return E.esp.corona; },
    nota(E, txt) { const c = Co.asegurar(E); c.hist.unshift({ t: E.fecha.t, txt }); if (c.hist.length > 20) c.hist.length = 20; },
    cambiar(E, d) { const c = Co.asegurar(E); c.pop = clamp(c.pop + d, 5, 95); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const c = Co.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob;
      c.pop = clamp(c.pop + (60 - c.pop) * 0.004 + U.gauss(0, 0.25) + (c.neutral - 70) * 0.001, 5, 95); c.rel = clamp(c.rel + (62 - c.rel) * 0.01, 0, 100);
      if (t % 4 === 0) { c.serie.push([t, Math.round(c.pop)]); if (c.serie.length > 150) c.serie.shift(); }
      // Polémicas
      if (U.chance(0.01) && !E.meta.presim) { const d = U.rf(1.5, 5); Co.cambiar(E, -d); C.Noticias.poner(E, 'politica', `La Casa Real, en el centro de la polémica por ${U.pick(POLEMICAS)}.`, 'ES'); Co.nota(E, 'Polémica en la Casa Real.'); C.Opinion.empujeES(E, 'ES_UPC', 0.02); }
      // Un Rey impopular alimenta el republicanismo
      if (c.pop < 35 && U.chance(0.1)) for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop += 0.015; }
      // Crisis de legitimidad y abdicación
      if (c.pop < 28) c.bajas++; else c.bajas = Math.max(0, c.bajas - 2);
      if (!c.crisis && c.bajas > 12) { c.crisis = { t, tipo: 'legitimidad' }; C.Noticias.poner(E, 'politica', 'Crece el debate sobre la continuidad de la Corona: encuestas históricamente bajas.', 'ES'); Co.nota(E, 'Crisis de legitimidad de la Corona.'); }
      if (c.crisis && t - c.crisis.t > 14 && U.chance(0.05)) Co.abdicar(E);
      // Equilibrio con el Gobierno
      if (g && g.aprob < 35) c.rel = clamp(c.rel - 0.05, 0, 100);
    },
    abdicar(E) {
      const c = Co.asegurar(E); c.crisis = null; c.bajas = 0; c.pop = 62; c.reinado++; c.neutral = 75; C.Noticias.poner(E, 'politica', 'El Rey abdica en la Princesa heredera: comienza un nuevo reinado.', 'ES'); Co.nota(E, 'Abdicación y nuevo reinado.');
      for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop = Math.max(0.2, p.pop - 0.1); } C.Opinion.normalizarES(E);
    },
    audiencia(E) {
      const J = E.jugador, c = Co.asegurar(E), o = (J.atrib.carisma + J.atrib.oratoria) / 20; c.rel = clamp(c.rel + 6 + o * 6, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.8 + o * 0.6 }); Co.nota(E, `Audiencia con ${J.nombre}.`);
      return { ok: true, msg: 'Audiencia en la Zarzuela: la Corona valora tu institucionalidad.' };
    },
    postura(E, defiende) {
      const J = E.jugador, c = Co.asegurar(E), p = E.partidos[J.partido];
      if (defiende) { Co.cambiar(E, 1.2); c.neutral = clamp(c.neutral + 1, 0, 100); C.Personaje.cambiar(E, { prestigio: p.eco > 0 ? 0.8 : -0.4, pop: p.soc > 0 ? 0.6 : -0.2 }); return { ok: true, msg: 'Defiendes públicamente a la Corona: refuerza su imagen.' }; }
      Co.cambiar(E, -1.5); C.Personaje.cambiar(E, { prestigio: p.soc < 0 ? 0.6 : -0.6, pop: p.soc < 0 ? 0.8 : -0.8 }); C.Opinion.empujeES(E, 'ES_UPC', 0.02); return { ok: true, msg: 'Cuestionas la monarquía: aplauden los tuyos, protestan los demás.' };
    },
    mediar(E) {
      const c = Co.asegurar(E); if (!c.crisis) return { ok: false, msg: 'No hay crisis abierta' }; const J = E.jugador;
      if (U.chance(clamp(0.35 + J.atrib.negociacion / 20, 0.2, 0.8))) { c.crisis = null; c.bajas = 0; Co.cambiar(E, 6); C.Personaje.cambiar(E, { prestigio: 2.5 }); Co.nota(E, 'Mediación exitosa: se calma la crisis.'); return { ok: true, msg: 'Tu mediación reconduce la crisis de la Corona.' }; }
      return { ok: true, exito: false, msg: 'La crisis sigue abierta: no logras reconducirla.' };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'carrera' }, o));
  const es = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  R({ id: 'audiencia_rey', nombre: 'Audiencia con el Rey', icono: '👑', desc: 'Una visita institucional: mejora tu relación con la Corona y tu prestigio.', disponible: E => es(E) === true ? (['pm', 'ministro', 'presauto'].includes(E.jugador.cargo) || E.jugador.rol === 'lider' ? true : 'Necesitas un cargo de peso') : es(E), ejecutar: E => Co.audiencia(E) });
  R({ id: 'defender_corona', nombre: 'Defender a la Corona', icono: '🛡️', desc: 'Sales en defensa de la institución: sube su popularidad y tu prestigio con el electorado conservador.', disponible: es, ejecutar: E => Co.postura(E, true) });
  R({ id: 'cuestionar_corona', nombre: 'Cuestionar la monarquía', icono: '🏴', desc: 'Abres el debate sobre la forma del Estado: aplauden los republicanos y se enfada el resto.', disponible: es, ejecutar: E => Co.postura(E, false) });
  R({ id: 'mediar_corona', nombre: 'Mediar en la crisis de la Corona', icono: '🕊️', costo: 2, desc: 'Intentas reconducir una crisis de legitimidad antes de una abdicación.', disponible: E => es(E) === true ? (Co.asegurar(E).crisis ? true : 'No hay crisis de la Corona') : es(E), ejecutar: E => Co.mediar(E) });
  C.Tiempo.registrar('corona', { turno: Co.turno }, 46);
})(window.ESP);

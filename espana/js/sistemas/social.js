/* Diálogo social: mesas con sindicatos y patronal sobre salario mínimo, reforma laboral, pensiones y jornada; conflictividad y huelgas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  /* niveles: L de −1 a +2. sind/pat = nivel que aceptan (sindicatos piden al menos `sind`; patronal admite como mucho `pat`). */
  const TEMAS = {
    smi: { n: 'Salario mínimo', ic: '💶', sind: 1, pat: 0, niveles: { '-1': ['Congelarlo', { igual: -0.5, paro: -0.1 }], 0: ['Subirlo con el IPC', { igual: 0.2 }], 1: ['Subida notable', { igual: 0.8, prot: 0.2, paro: 0.1 }], 2: ['Subida fuerte', { igual: 1.4, prot: 0.4, paro: 0.3, comp: -0.3 }] } },
    laboral: { n: 'Reforma laboral', ic: '👷', sind: 1, pat: 0, niveles: { '-1': ['Flexibilizar el despido', { igual: -0.8, comp: 0.5, paro: -0.15 }], 0: ['Mantener el marco', {}], 1: ['Reforzar la estabilidad', { igual: 0.6, comp: -0.2, paro: -0.1 }], 2: ['Reforma profunda', { igual: 1.1, comp: -0.5, prot: 0.3 }] } },
    pensiones: { n: 'Pensiones', ic: '🧓', sind: 1, pat: 0, niveles: { '-1': ['Tope a la revalorización', { prot: -0.9, deficit: -0.2 }], 0: ['Revalorizar con el IPC', { prot: 0.1 }], 1: ['Mejora de las pensiones', { prot: 0.8, deficit: 0.2, igual: 0.2 }], 2: ['Gran mejora', { prot: 1.4, deficit: 0.45, igual: 0.4 }] } },
    jornada: { n: 'Jornada laboral', ic: '⏱️', sind: 1, pat: 0, niveles: { '-1': ['Flexibilidad horaria', { comp: 0.3, igual: -0.2 }], 0: ['Mantener las 40 horas', {}], 1: ['37,5 horas', { igual: 0.4, comp: -0.2, aprob: 1 }], 2: ['35 horas', { igual: 0.6, comp: -0.5, aprob: 1.5, crec: -0.05 }] } }
  };
  const SIND = [['cso', 'Confederación Sindical Obrera', '✊'], ['utg', 'Unión de Trabajadores', '🤝']];

  const So = C.Social = {
    TEMAS, SIND,
    asegurar(E) {
      if (E.esp.social) return E.esp.social;
      const niv = {}; Object.keys(TEMAS).forEach(k => niv[k] = 0);
      return E.esp.social = { conf: 35, niv, sindSat: 50, patSat: 50, acuerdos: [], huelgas: [], ult: {} };
    },
    puede(E) { const J = E.jugador, g = E.paises.ES.gob; return J && J.pais === 'ES' && (g.pm === 'J' || J.ministerio === 'tra' || J.ministerio === 'eco'); },

    /* Probabilidad de que cada parte acepte un nivel (con las concesiones que añades). */
    prob(E, tema, L, comp) {
      const s = So.asegurar(E), T = TEMAS[tema], J = E.jugador, neg = J ? J.atrib.negociacion / 10 : 0.5;
      const sind = clamp(0.62 + (L - T.sind) * 0.2 + (s.sindSat - 50) / 250 + neg * 0.1, 0.03, 0.97);
      const pat = clamp(0.6 + (T.pat - L) * 0.2 + (s.patSat - 50) / 250 + neg * 0.1 + (comp ? 0.22 : 0), 0.03, 0.97);
      return { sind, pat, ac: sind * pat };
    },
    /* Mesa de diálogo social: el jugador (presidente o ministro) propone un nivel. */
    mesa(E, tema, L, comp) {
      const s = So.asegurar(E), T = TEMAS[tema]; if (!T) return { ok: false, msg: 'Tema desconocido' };
      if (E.fecha.t - (s.ult[tema] || -99) < 12) return { ok: false, msg: 'Acabáis de negociar este asunto: esperad unas semanas' };
      s.ult[tema] = E.fecha.t; const p = So.prob(E, tema, L, comp), okS = U.chance(p.sind), okP = U.chance(p.pat);
      if (comp) C.Economia.aplicar(E, 'ES', { deficit: 0.12 });
      if (okS && okP) { So.aplicar(E, tema, L, 'acuerdo'); s.conf = clamp(s.conf - 8, 0, 100); s.sindSat = clamp(s.sindSat + 6, 0, 100); s.patSat = clamp(s.patSat + 6, 0, 100); s.niv[tema] = L; s.acuerdos.unshift({ t: E.fecha.t, tema, L, tipo: 'acuerdo' }); C.Noticias.poner(E, 'economia', `Acuerdo del diálogo social: ${T.n.toLowerCase()} — ${T.niveles[L][0].toLowerCase()}.`, 'ES'); return { ok: true, msg: `Acuerdo tripartito: ${T.niveles[L][0]}.` }; }
      s.sindSat = clamp(s.sindSat + (okS ? 2 : -6), 0, 100); s.patSat = clamp(s.patSat + (okP ? 2 : -6), 0, 100); s.conf = clamp(s.conf + 5, 0, 100);
      s.acuerdos.unshift({ t: E.fecha.t, tema, L, tipo: 'ruptura' });
      C.Noticias.poner(E, 'economia', `Se rompe la mesa del diálogo social sobre ${T.n.toLowerCase()}: ${!okS ? 'los sindicatos' : 'la patronal'} no aceptan.`, 'ES');
      return { ok: true, exito: false, msg: `Sin acuerdo: ${!okS && !okP ? 'ni sindicatos ni patronal aceptan' : !okS ? 'los sindicatos rechazan la oferta' : 'la patronal rechaza la oferta'}. Puedes imponerlo por decreto.` };
    },
    imponer(E, tema, L) {
      const s = So.asegurar(E), T = TEMAS[tema]; if (!T.niveles[L]) return { ok: false, msg: 'Nivel no válido' };
      So.aplicar(E, tema, L, 'decreto'); s.niv[tema] = L; s.conf = clamp(s.conf + (L >= T.sind ? 2 : 8) + (L > T.pat ? 5 : 0), 0, 100); s.acuerdos.unshift({ t: E.fecha.t, tema, L, tipo: 'decreto' });
      C.Personaje.cambiar(E, { prestigio: 0.3 }); return { ok: true, msg: `Impones por decreto: ${T.niveles[L][0]}.` };
    },
    aplicar(E, tema, L, via) {
      const ef = TEMAS[tema].niveles[L][1], S = C.Impacto && C.Impacto.asegurar(E), ec = {};
      for (const k in ef) { if (k === 'paro' || k === 'deficit' || k === 'crec' || k === 'aprob') ec[k] = ef[k]; else if (S) S.off[k] = (S.off[k] || 0) + ef[k] * 1.2; }
      if (Object.keys(ec).length) C.Economia.aplicar(E, 'ES', ec);
    },

    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const s = So.asegurar(E), ec = E.paises.ES.ec, g = E.paises.ES.gob, t = E.fecha.t;
      const base = 28 + (ec.paro - 10) * 1.4 + (ec.infl - 2) * 5 - (s.sindSat - 50) / 4; s.conf = clamp(s.conf + (base - s.conf) * 0.03 + U.gauss(0, 0.5), 0, 100);
      s.sindSat += (50 - s.sindSat) * 0.01; s.patSat += (50 - s.patSat) * 0.01;
      // IA: el Gobierno negocia por su cuenta de vez en cuando
      if (g.pm !== 'J' && J.ministerio !== 'tra' && U.chance(0.012)) { const k = U.pick(Object.keys(TEMAS)), izq = E.partidos[g.partido].eco < 0, L = izq ? U.pick([0, 1, 1, 2]) : U.pick([-1, 0, 0, 1]); s.ult[k] = t; if (U.chance(So.prob(E, k, L).ac + 0.15)) { So.aplicar(E, k, L); s.niv[k] = L; s.conf = clamp(s.conf - 5, 0, 100); s.acuerdos.unshift({ t, tema: k, L, tipo: 'acuerdo' }); C.Noticias.poner(E, 'economia', `Acuerdo social: ${TEMAS[k].n.toLowerCase()} — ${TEMAS[k].niveles[L][0].toLowerCase()}.`, 'ES'); } else { s.conf = clamp(s.conf + 4, 0, 100); s.acuerdos.unshift({ t, tema: k, L, tipo: 'ruptura' }); } }
      if (s.acuerdos.length > 24) s.acuerdos.length = 24;
      // Huelgas
      s.huelgas = s.huelgas.filter(h => t - h.t < h.dur);
      if (s.conf > 52 && U.chance((s.conf - 50) / 1600) && s.huelgas.length < 2) {
        const gen = s.conf > 78 && U.chance(0.3), sec = U.pick(['transporte', 'sanidad', 'educación', 'industria', 'limpieza', 'servicios']);
        s.huelgas.push({ id: U.id('h'), t, dur: gen ? 2 : U.ri(2, 5), sector: gen ? 'general' : sec, fuerza: gen ? 1 : U.rf(0.3, 0.7) });
        C.Noticias.poner(E, 'economia', gen ? 'Huelga general en toda España.' : `Huelga del sector ${sec}.`, 'ES');
      }
      for (const h of s.huelgas) { g.aprob = clamp(g.aprob - 0.12 * h.fuerza, 5, 90); C.Economia.aplicar(E, 'ES', { crec: -0.01 * h.fuerza }); }
    },
    calmar(E) { const s = So.asegurar(E); s.conf = clamp(s.conf - 3, 0, 100); s.sindSat = clamp(s.sindSat + 3, 0, 100); s.patSat = clamp(s.patSat + 2, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.3 }); return { ok: true, msg: 'Reúnes a sindicatos y patronal: baja la tensión social.' }; }
  };
  C.Tiempo.registrar('social', { turno: So.turno, postInit: E => { if (E.jugador && E.jugador.pais === 'ES') So.asegurar(E); } }, 41);

  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  R({ id: 'mesa_dialogo', nombre: 'Mesa de diálogo social', icono: '🤝', costo: 2, desc: 'Presidente o ministro de Economía o Trabajo: negocia con sindicatos y patronal un nivel para salario mínimo, reforma laboral, pensiones o jornada.', disponible: E => So.puede(E) ? true : 'Sólo el presidente o los ministros de Economía y Trabajo', ejecutar: (E, a) => So.mesa(E, a.tema, +a.L, !!a.comp) });
  R({ id: 'imponer_decreto_social', nombre: 'Imponer por decreto', icono: '⚡', costo: 2, desc: 'Aprueba por decreto el nivel elegido sin acuerdo social: más rápido, pero sube la conflictividad.', disponible: E => So.puede(E) ? true : 'Sólo el Gobierno', ejecutar: (E, a) => So.imponer(E, a.tema, +a.L) });
  R({ id: 'calmar_conflicto', nombre: 'Reunir a los agentes sociales', icono: '🕊️', desc: 'Baja la conflictividad con una ronda de contactos con sindicatos y patronal.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: E => So.calmar(E) });
  if (C.Jefe) C.Jefe.registrar('social', {
    propone(E) { const s = So.asegurar(E); return s.conf > 50 ? [{ txt: `La conflictividad social está en ${Math.round(s.conf)}: reunir a los agentes sociales.`, accion: 'calmar_conflicto', args: {} }] : []; },
    hace(E) { const s = So.asegurar(E), out = []; if (s.conf > 45) { const r = C.Jefe.gastarAgenda(E, [{ accion: 'calmar_conflicto', args: {}, txt: 'reúne a los agentes sociales' }], C.Jefe.capacidad(E)); if (r.length) out.push('Diálogo social: ' + r[0]); } return out; }
  });
})(window.ESP);

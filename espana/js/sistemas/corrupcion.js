/* Corrupción y control: casos que escalan (rumor → filtración → investigación → juicio), comisiones de investigación,
   reprobaciones y comparecencias. Estado: E.esp.corr = { casos[], coms[], calor:{pid}, hist[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const TIPOS = { financiacion: ['Financiación irregular del partido', '💶'], cohecho: ['Cohecho y comisiones', '💼'], malversacion: ['Malversación de fondos públicos', '🏦'], trama: ['Trama de contratos amañados', '🕸️'], tesorero: ['Caja B del tesorero', '🗄️'] };
  const FASES = ['rumor', 'filtracion', 'investigacion', 'juicio', 'cerrado'], FASE_TXT = { rumor: 'Rumor', filtracion: 'Filtración', investigacion: 'Instrucción', juicio: 'Juicio oral', cerrado: 'Cerrado' };
  const DUR = { rumor: 3, filtracion: 5, investigacion: 12, juicio: 8 };
  const K = C.Corrupcion = {
    TIPOS, FASE_TXT,
    asegurar(E) { if (!E.esp.corr) E.esp.corr = { casos: [], coms: [], calor: {}, hist: [], ult: 0 }; return E.esp.corr; },
    calor(E, pid) { return K.asegurar(E).calor[pid] || 0; },
    sube(E, pid, d) { const k = K.asegurar(E); k.calor[pid] = clamp((k.calor[pid] || 0) + d, 0, 100); },
    nombre(E, pid) { const p = E.partidos[pid], l = E.politicos[p.lider]; return l ? l.n : p.sigla; },
    /* Nuevo caso contra un partido. */
    nuevo(E, pid, o) {
      o = o || {}; const k = K.asegurar(E), tipo = o.tipo || U.pick(Object.keys(TIPOS)), t = E.fecha.t;
      const quien = o.quien || (U.chance(0.5) ? 'un ex tesorero' : 'un alto cargo') + ' de ' + E.partidos[pid].sigla;
      const c = { id: U.id('cc'), pid, tipo, quien, gravedad: o.gravedad || U.rf(0.3, 0.9), fase: 'rumor', t0: t, tFase: t, destapadoPor: o.por || null, com: null, defensa: 0, limpio: false, res: null };
      k.casos.unshift(c); if (k.casos.length > 30) k.casos.length = 30; K.sube(E, pid, 6 + c.gravedad * 8);
      C.Noticias.poner(E, 'justicia', `Medios publican indicios de ${TIPOS[tipo][0].toLowerCase()} que salpican a ${E.partidos[pid].sigla}.`, 'ES'); return c;
    },
    /* Efecto de la fase sobre el partido. */
    pega(E, c, f) {
      const g = E.paises.ES.gob, pa = E.partidos[c.pid], m = (c.limpio ? 0.6 : 1) * (1 - Math.min(0.4, c.defensa * 0.1));
      K.sube(E, c.pid, f * 10 * m); if (c.pid === g.partido) g.aprob = clamp(g.aprob - f * 1.4 * m, 5, 90); pa.cohesion = clamp(pa.cohesion - f * 1.2 * m, 15, 99);
      if (c.tipo === 'financiacion' || c.tipo === 'tesorero') pa.finanzas = clamp(pa.finanzas - f * 4 * m, 0, 100);
    },
    avanzar(E, c) {
      const i = FASES.indexOf(c.fase), t = E.fecha.t, J = E.jugador, suyo = J && J.pais === 'ES' && c.pid === J.partido, sig = E.partidos[c.pid].sigla;
      c.fase = FASES[i + 1]; c.tFase = t;
      if (c.fase === 'filtracion') { K.pega(E, c, 0.8 * c.gravedad); C.Noticias.poner(E, 'justicia', `Se filtra un informe sobre ${c.quien}: ${TIPOS[c.tipo][0].toLowerCase()} en ${sig}.`, 'ES'); }
      else if (c.fase === 'investigacion') { K.pega(E, c, 1.1 * c.gravedad); C.Noticias.poner(E, 'justicia', `Un juez abre diligencias por ${TIPOS[c.tipo][0].toLowerCase()} vinculada a ${sig}.`, 'ES'); if (C.Justicia && C.Justicia.nueva && U.chance(0.5)) C.Justicia.nueva(E, c.pid, U.pick(Object.keys(E.politicos).filter(x => E.politicos[x].p === c.pid && x !== 'J')) || 'J', c.gravedad); }
      else if (c.fase === 'juicio') { K.pega(E, c, 0.9 * c.gravedad); C.Noticias.poner(E, 'justicia', `Se abre juicio oral por el caso de ${sig}.`, 'ES'); }
      else if (c.fase === 'cerrado') {
        const condena = U.chance(clamp(0.25 + c.gravedad * 0.55 - c.defensa * 0.05, 0.1, 0.9)); c.res = condena ? 'condena' : 'absolución';
        K.pega(E, c, condena ? 1.6 * c.gravedad : -0.5 * c.gravedad); C.Noticias.poner(E, 'justicia', `${condena ? 'Condena' : 'Absolución'} en el caso de ${sig}: ${TIPOS[c.tipo][0].toLowerCase()}.`, 'ES');
        K.asegurar(E).hist.unshift({ t, txt: `${sig}: ${TIPOS[c.tipo][0]} → ${c.res}.` });
        if (suyo && !E.meta.presim) C.Personaje.log(E, `Cierra el caso de ${TIPOS[c.tipo][0].toLowerCase()} de tu partido: ${c.res}.`);
      }
    },
    /* ── Comisiones de investigación ── */
    abrirCom(E, casoId, promotor) {
      const k = K.asegurar(E), c = k.casos.find(x => x.id === casoId); if (!c || c.fase === 'cerrado') return { ok: false, msg: 'Ese caso ya está cerrado' };
      if (c.com) return { ok: false, msg: 'Ya hay una comisión sobre ese caso' };
      if (k.coms.filter(x => x.estado === 'abierta').length >= 2) return { ok: false, msg: 'Ya hay dos comisiones en marcha' };
      const P = E.paises.ES, esc = P.escanos[promotor] || 0, tot = U.suma(Object.values(P.escanos)), g = P.gob;
      const apoyo = U.suma(P.partidos.filter(x => x !== c.pid && (x === promotor || !g.coalicion.includes(x) || U.chance(0.3))).map(x => P.escanos[x] || 0));
      if (apoyo < tot * 0.3 && esc < tot * 0.15) return { ok: false, msg: 'No logras reunir apoyos para constituir la comisión de investigación' };
      const com = { id: U.id('ci'), caso: c.id, promotor, t0: E.fecha.t, dur: 10, estado: 'abierta', hallazgos: 0, aut: false }; k.coms.unshift(com); c.com = com.id;
      C.Noticias.poner(E, 'parlamento', `${E.partidos[promotor].sigla} logra constituir una comisión de investigación sobre el caso de ${E.partidos[c.pid].sigla}.`, 'ES'); return { ok: true, msg: 'Comisión de investigación constituida. Citará a comparecientes durante unas 10 semanas.' };
    },
    turnoCom(E, com) {
      const k = K.asegurar(E), c = k.casos.find(x => x.id === com.caso); if (!c) { com.estado = 'cerrada'; return; }
      if (U.chance(0.22)) { com.hallazgos++; c.gravedad = clamp(c.gravedad + 0.04, 0, 1); K.pega(E, c, 0.35); C.Noticias.poner(E, 'parlamento', `Comparecencia explosiva en la comisión sobre ${E.partidos[c.pid].sigla}: ${U.pick(['un exdirectivo implica a la cúpula', 'aparece un documento comprometedor', 'un testigo cambia su versión', 'un alto cargo se niega a responder'])}.`, 'ES'); }
      if (E.fecha.t - com.t0 >= com.dur) { com.estado = 'cerrada'; const g = E.paises.ES.gob, culp = com.hallazgos >= 2; c.com = null; if (culp) { K.pega(E, c, 0.6); } else { K.sube(E, c.pid, -4); }
        C.Noticias.poner(E, 'parlamento', `La comisión de investigación concluye ${culp ? 'con duras conclusiones contra ' + E.partidos[c.pid].sigla : 'sin conclusiones contundentes'}.`, 'ES'); k.hist.unshift({ t: E.fecha.t, txt: `Comisión sobre ${E.partidos[c.pid].sigla}: ${culp ? 'conclusiones condenatorias' : 'sin consecuencias'}.` }); }
    },
    /* ── Control parlamentario ── */
    reprobar(E, mid, promotor) {
      const g = E.paises.ES.gob, id = g.ministros[mid]; if (!id || id === 'J') return { ok: false, msg: 'No hay ministro que reprobar' };
      const pol = E.politicos[id], P = E.paises.ES, tot = U.suma(Object.values(P.escanos));
      const si = U.suma(P.partidos.filter(x => !g.coalicion.includes(x) && !(g.apoyoExterno || []).includes(x)).map(x => P.escanos[x] || 0)) + U.suma((g.apoyoExterno || []).map(x => U.chance(0.2) ? (P.escanos[x] || 0) : 0));
      const ok = si > tot / 2 || (si > tot * 0.42 && U.chance(0.3));
      if (ok) { g.estab = clamp(g.estab - 3, 0, 100); g.aprob = clamp(g.aprob - 0.8, 5, 90); C.Noticias.poner(E, 'parlamento', `El Congreso reprueba a ${pol.n}, ministro/a de ${((C.DATA.ministerios || []).find(x => x.id === mid) || {}).nombre || mid}.`, 'ES'); if (U.chance(0.35) && C.Gabinete && C.Gabinete.dimision) { try { C.Gabinete.dimision(E, C.Gabinete.cargos(E, 'central').find(x => x.id === mid), pol); } catch (e) { } } return { ok: true, msg: `El Congreso reprueba a ${pol.n}.` }; }
      C.Noticias.poner(E, 'parlamento', `El Congreso rechaza reprobar a ${pol.n}.`, 'ES'); return { ok: true, exito: false, msg: 'La reprobación no sale adelante: el Gobierno resiste.' };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const k = K.asegurar(E), t = E.fecha.t, P = E.paises.ES, g = P.gob;
      for (const pid in k.calor) { k.calor[pid] *= 0.985; if (k.calor[pid] > 3) C.Opinion.empujeES(E, pid, -k.calor[pid] * 0.00035); }
      // Casos nuevos
      if (!E.meta.presim || U.chance(0.2)) {
        if (U.chance(0.012) && k.casos.filter(c => c.fase !== 'cerrado').length < 5) {
          const ps = P.partidos.filter(x => E.partidos[x].amb === 'nac' && (P.escanos[x] || 0) >= 8); const w = x => (g.coalicion.includes(x) ? 1.3 : 1) * (0.6 + (100 - (E.partidos[x].integridad || 60)) / 60) * Math.sqrt(P.escanos[x] || 1);
          const pid = U.pesado(ps, w); if (pid) K.nuevo(E, pid);
        }
      }
      for (const c of k.casos) { if (c.fase === 'cerrado') continue; const dur = DUR[c.fase] * (c.com ? 1.0 : 1) + c.defensa; if (t - c.tFase >= dur) K.avanzar(E, c); }
      for (const com of k.coms) if (com.estado === 'abierta') K.turnoCom(E, com);
    },
    suyos(E) { const J = E.jugador; return K.asegurar(E).casos.filter(c => c.pid === J.partido && c.fase !== 'cerrado'); },
    destapar(E, pid) {
      const J = E.jugador, md = C.Medios && C.Medios.asegurar(E), rel = md ? Math.max(...Object.values(md.rel)) : 0; if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige otro partido' };
      if (rel < 12) return { ok: false, msg: 'Ningún medio te hace caso lo bastante para publicar tu información' };
      const k = K.asegurar(E), abiertos = k.casos.filter(c => c.pid === pid && c.fase !== 'cerrado'); if (abiertos.length >= 2) return { ok: false, msg: 'Ya hay demasiados casos abiertos contra ese partido' };
      const riesgo = clamp(0.3 - J.atrib.integridad / 40, 0.05, 0.4); if (U.chance(riesgo)) { C.Personaje.cambiar(E, { prestigio: -2.5, pop: -1 }, true); return { ok: true, exito: false, msg: 'La información era floja y se te vuelve en contra.' }; }
      if (U.chance(0.55)) { K.nuevo(E, pid, { por: J.partido, gravedad: U.rf(0.35, 0.8) }); return { ok: true, msg: 'Un medio publica tu información: se abre un caso contra ' + E.partidos[pid].sigla + '.' }; }
      return { ok: true, exito: false, msg: 'Los medios no ven historia en lo que les pasas.' };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const es = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  R({ id: 'exigir_comision', nombre: 'Exigir una comisión de investigación', icono: '🔍', costo: 2, desc: 'Reúne apoyos para abrir una comisión sobre un caso abierto y exponer a su partido.', disponible: es, ejecutar: (E, a) => K.abrirCom(E, a.caso, E.jugador.partido) });
  R({ id: 'destapar_caso', nombre: 'Filtrar un caso contra un rival', icono: '🕵️', costo: 2, desc: 'Pasa información comprometida a la prensa: puede abrir un caso contra otro partido, o salirte mal.', disponible: es, ejecutar: (E, a) => K.destapar(E, a.pid) });
  R({ id: 'limpiar_partido', nombre: 'Depurar responsabilidades en tu partido', icono: '🧹', desc: 'Suspendes de militancia a los implicados en un caso: reduce un 40 % el daño, pero rompe cohesión.', disponible: E => es(E) === true ? (K.suyos(E).length ? true : 'No hay casos abiertos en tu partido') : es(E), ejecutar: E => { const c = K.suyos(E).find(x => !x.limpio); if (!c) return { ok: false, msg: 'Ya has depurado responsabilidades' }; c.limpio = true; const pa = E.partidos[E.jugador.partido]; pa.cohesion = clamp(pa.cohesion - 3, 15, 99); K.sube(E, c.pid, -6); C.Personaje.cambiar(E, { prestigio: 1.2 }); return { ok: true, msg: 'Suspendes de militancia a los implicados: bajas el daño.' }; } });
  R({ id: 'defender_caso', nombre: 'Defender la inocencia del partido', icono: '🛡️', desc: 'Una ofensiva de comunicación y recursos judiciales: alarga el proceso (más tiempo, pero más desgaste si hay condena).', disponible: E => es(E) === true ? (K.suyos(E).length ? true : 'No hay casos abiertos en tu partido') : es(E), ejecutar: E => { const c = K.suyos(E)[0]; c.defensa = Math.min(4, c.defensa + 1); C.Opinion.empuje(E, c.pid, 0.02, 0.3); return { ok: true, msg: 'Montas la defensa: el caso se alarga y logras respirar.' }; } });
  R({ id: 'reprobar_ministro', nombre: 'Reprobar a un ministro', icono: '📜', desc: 'Una iniciativa del Congreso para censurar políticamente a un ministro.', disponible: es, ejecutar: (E, a) => K.reprobar(E, a.mid, E.jugador.partido) });
  R({ id: 'comparecer_congreso', nombre: 'Comparecer en el Congreso', icono: '🎤', desc: 'El presidente o un ministro da explicaciones sobre un caso: enfría el calor político de su partido.', disponible: E => { const g = E.paises.ES.gob; return E.jugador.pais === 'ES' && (g.pm === 'J' || E.jugador.ministerio) ? true : 'Sólo el presidente o un ministro'; }, ejecutar: E => { const J = E.jugador, o = (J.atrib.oratoria + J.atrib.integridad) / 20; K.sube(E, E.paises.ES.gob.partido, -(5 + o * 8)); C.Personaje.cambiar(E, { prestigio: 0.6 + o, pop: 0.4 }); return { ok: true, msg: 'Das la cara en el Pleno: baja la tensión.' }; } });
  C.Tiempo.registrar('corrupcion', { turno: K.turno }, 45);
})(window.ESP);

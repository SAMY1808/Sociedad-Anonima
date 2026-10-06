/* Referendos y consultas: nacionales (art. 92), autonómicos y locales. Propuesta → autorización → campaña → votación → consecuencias.
   Estado: E.esp.ref = { act:[], hist:[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const TEMAS = {
    monarquia: { n: '¿República o monarquía?', q: '¿Quieres que España sea una república?', amb: 'nacional', ic: '👑', v: { soc: -0.5, ter: 0.15 }, tipo: 'consulta', desc: 'Consulta no vinculante sobre la forma del Estado.' },
    electoral: { n: 'Reforma del sistema electoral', q: '¿Apoyas rebajar los umbrales y reforzar la proporcionalidad?', amb: 'nacional', ic: '🗳️', v: { ter: 0.3, soc: -0.1 }, tipo: 'consulta', desc: 'Más proporcionalidad: favorece a los partidos pequeños.' },
    ue: { n: 'Más soberanía compartida con la UE', q: '¿Aceptas ceder más competencias a las instituciones europeas?', amb: 'nacional', ic: '🇪🇺', v: { eu: 0.6 }, tipo: 'consulta', desc: 'Profundizar la integración europea.' },
    nuclear: { n: 'Futuro de las nucleares', q: '¿Debe prolongarse la vida de las centrales nucleares?', amb: 'nacional', ic: '☢️', v: { eco: 0.3, soc: 0.2 }, tipo: 'consulta', desc: 'Debate energético con gran carga ideológica.' },
    autodet: { n: 'Consulta de autodeterminación', q: '¿Quieres que tu comunidad sea un Estado independiente?', amb: 'ccaa', ic: '🏴', v: { ter: 0.75 }, tipo: 'ccaa', desc: 'Sin pacto con el Estado, el Constitucional la suspende; con pacto, es vinculante.' },
    autogob: { n: 'Consulta sobre el autogobierno', q: '¿Apruebas más autogobierno para tu comunidad?', amb: 'ccaa', ic: '🏛️', v: { ter: 0.4 }, tipo: 'ccaa', desc: 'Consulta autonómica consultiva sobre competencias.' },
    peatonal: { n: 'Centro sin coches', q: '¿Apoyas peatonalizar el centro de la ciudad?', amb: 'muni', ic: '🚲', v: { soc: -0.3, eco: -0.15 }, tipo: 'muni', ind: 'movilidad', ef: 8, desc: 'Consulta municipal sobre movilidad.' },
    turismo: { n: 'Límite a las viviendas turísticas', q: '¿Quieres limitar los pisos turísticos?', amb: 'muni', ic: '🏠', v: { eco: -0.4, soc: -0.2 }, tipo: 'muni', ind: 'vivienda', ef: 9, desc: 'Consulta municipal sobre vivienda y turismo.' },
    tranvia: { n: 'Nuevo tranvía', q: '¿Apoyas construir la línea de tranvía?', amb: 'muni', ic: '🚋', v: { eco: -0.2, soc: -0.15 }, tipo: 'muni', ind: 'movilidad', ef: 11, desc: 'Gran obra de transporte público.' }
  };
  const Rf = C.Referendos = {
    TEMAS,
    asegurar(E) { if (!E.esp.ref) E.esp.ref = { act: [], hist: [] }; return E.esp.ref; },
    /* Apoyo de un partido al «sí» de un tema. */
    apoyoPartido(E, tema, pid) {
      const p = E.partidos[pid], T = TEMAS[tema]; let s = 0; for (const k in T.v) s += T.v[k] * (p[k] || 0) / 100; return clamp(0.5 + s, 0.04, 0.96);
    },
    /* Opinión pública sobre el «sí» (ponderada por intención de voto). */
    opinion(E, tema, c) {
      const P = E.paises.ES; let num = 0, den = 0; for (const k of P.partidos) { const w = E.partidos[k].popN || E.partidos[k].pop || 0; if (!w) continue; num += w * Rf.apoyoPartido(E, tema, k); den += w; }
      let x = den ? num / den : 0.5; if (TEMAS[tema].amb === 'ccaa' && c) { const d = D().ccaa[c], rc = E.esp.ccaa[c]; x = tema === 'autodet' ? clamp((rc.indep || d.indep) / 100 * 1.1 + 0.05, 0.05, 0.8) : clamp(0.45 + (rc.indep - 10) / 150 + (50 - rc.relM) / 300, 0.15, 0.85); }
      return x;
    },
    puedeProponer(E, tema) {
      const J = E.jugador, T = TEMAS[tema], g = E.paises.ES.gob; if (!T) return 'Tema desconocido'; if (J.pais !== 'ES') return 'Sólo en España';
      if (T.amb === 'nacional') return g.pm === 'J' || J.rol === 'lider' ? true : 'Sólo el presidente del Gobierno o líderes de partido';
      if (T.amb === 'ccaa') return J.cargo === 'presauto' && E.esp.ccaa[J.region].gob.pres === 'J' ? true : 'Sólo el presidente autonómico';
      return J.cargo === 'alcalde' ? true : 'Sólo el alcalde';
    },
    proponer(E, tema) {
      const J = E.jugador, T = TEMAS[tema], r = Rf.puedeProponer(E, tema), s = Rf.asegurar(E); if (r !== true) return { ok: false, msg: r };
      if (s.act.some(x => x.tema === tema && x.estado !== 'cerrado')) return { ok: false, msg: 'Ese referéndum ya está en marcha' };
      if (s.act.filter(x => x.estado !== 'cerrado').length >= 2) return { ok: false, msg: 'Ya hay dos consultas en marcha' };
      const c = T.amb === 'ccaa' ? J.region : T.amb === 'muni' ? J.muni : null, P = E.paises.ES, g = P.gob;
      let p, txt;
      if (T.amb === 'nacional') {
        const tot = U.suma(Object.values(P.escanos)), apoya = U.suma(P.partidos.filter(k => g.coalicion.includes(k) || (g.apoyoExterno || []).includes(k) || Rf.apoyoPartido(E, tema, k) > 0.6).map(k => P.escanos[k] || 0)); p = clamp(apoya / tot * 1.25, 0.1, 0.92); txt = 'El Congreso debe autorizarlo por mayoría absoluta.';
      } else if (T.amb === 'ccaa') {
        const rc = E.esp.ccaa[c], esc = rc.parl.escanos, tot = U.suma(Object.values(esc)), apoya = U.suma(Object.keys(esc).filter(k => (rc.gob && rc.gob.coalicion.includes(k)) || E.partidos[k].ter > 35).map(k => esc[k])); p = clamp(apoya / tot * 1.2, 0.1, 0.9); txt = 'El Parlamento autonómico debe autorizarlo.';
      } else { const m = E.esp.muni.m[c], tot = U.suma(Object.values(m.esc)), apoya = U.suma(Object.keys(m.esc).filter(k => (m.coalicion || []).includes(k) || k === J.partido).map(k => m.esc[k])); p = clamp(apoya / tot * 1.2, 0.2, 0.9); txt = 'El pleno municipal debe autorizarlo.'; }
      if (!U.chance(p)) { C.Personaje.cambiar(E, { prestigio: -1 }); return { ok: true, exito: false, msg: `No logras la autorización (${Math.round(p * 100)} % de probabilidad). ${txt}` }; }
      const ref = { id: U.id('rf'), tema, ambito: T.amb, c, estado: 'campana', t0: E.fecha.t, tVoto: E.fecha.t + 7, camp: { si: 0, no: 0 }, prom: J.partido, res: null, suspendido: false };
      if (tema === 'autodet' && !E.esp.flags.refPactado) { ref.unilateral = true; if (U.chance(0.8)) { ref.suspendido = true; ref.estado = 'cerrado'; ref.res = { suspendido: true }; C.Noticias.poner(E, 'justicia', `El Constitucional suspende la consulta de autodeterminación en ${D().ccaa[c].nombre}.`, 'ES'); const rc = E.esp.ccaa[c]; rc.relM = clamp(rc.relM - 6, 0, 100); rc.indep = clamp(rc.indep + 1, 0, 100); s.act.unshift(ref); s.hist.unshift({ t: E.fecha.t, txt: `${T.n}: suspendida por el TC` }); return { ok: true, exito: false, msg: 'El Tribunal Constitucional suspende la consulta. Tu desafío tensa la relación con Moncloa.' }; } }
      s.act.unshift(ref); C.Noticias.poner(E, 'politica', `Se convoca ${T.tipo === 'consulta' ? 'una consulta nacional' : T.tipo === 'ccaa' ? 'una consulta en ' + D().ccaa[c].nombre : 'una consulta municipal'}: «${T.q}».`, 'ES');
      return { ok: true, msg: `Consulta convocada para dentro de 7 semanas: «${T.q}». Haz campaña.` };
    },
    campana(E, id, lado) {
      const ref = Rf.asegurar(E).act.find(x => x.id === id), J = E.jugador; if (!ref || ref.estado !== 'campana') return { ok: false, msg: 'Esa consulta ya no está en campaña' }; if (!['si', 'no'].includes(lado)) return { ok: false, msg: 'Elige el sí o el no' };
      if (ref.camp[lado] >= 10) return { ok: false, msg: 'Has agotado la campaña por esa opción' }; const x = 1 + (J.atrib.oratoria + J.atrib.carisma) / 14; ref.camp[lado] = Math.min(10, ref.camp[lado] + x); C.Personaje.cambiar(E, { pop: 0.3 });
      return { ok: true, msg: `Haces campaña por el ${lado === 'si' ? 'sí' : 'no'} (+${U.d1(x)}).` };
    },
    votar(E, ref) {
      const T = TEMAS[ref.tema], s = Rf.asegurar(E), g = E.paises.ES.gob; let si = Rf.opinion(E, ref.tema, ref.c) * 100 + (ref.camp.si - ref.camp.no) * 0.9 + U.gauss(0, 4);
      if (ref.ambito === 'nacional' && g.aprob < 40) si += (E.jugador && g.pm === 'J' ? -2 : 0); si = clamp(si, 5, 95);
      let part = clamp(58 + U.gauss(0, 7), 25, 85); if (ref.unilateral) { part = clamp(46 + U.gauss(0, 8), 25, 80); si = clamp(si + 14, 5, 96); }
      const gana = si > 50; ref.estado = 'cerrado'; ref.res = { si: Math.round(si * 10) / 10, part: Math.round(part * 10) / 10, gana };
      C.Noticias.poner(E, 'elecciones', `Resultado de la consulta «${T.n}»: ${U.d1(si)} % de síes (participación ${U.d1(part)} %).`, 'ES'); s.hist.unshift({ t: E.fecha.t, txt: `${T.n}: ${gana ? 'gana el sí' : 'gana el no'} (${U.d1(si)} %).` });
      const J = E.jugador, mio = J && ref.prom === J.partido;
      if (ref.tema === 'monarquia') { const co = C.Corona && C.Corona.asegurar(E); if (co) { co.pop = clamp(co.pop + (gana ? -16 : 8), 5, 95); if (gana) { co.bajas = 14; } } for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop += gana ? 0.4 : -0.1; } C.Opinion.normalizarES(E); }
      else if (ref.tema === 'electoral' && gana) { E.esp.um = Math.max(1, (E.esp.um || 3) - 1); C.Noticias.poner(E, 'politica', `El resultado empuja una reforma electoral: umbral del ${E.esp.um} %.`, 'ES'); }
      else if (ref.tema === 'ue') { if (E.paises.ES.ue) E.paises.ES.ue.rel = clamp((E.paises.ES.ue.rel || 50) + (gana ? 6 : -6), 0, 100); }
      else if (ref.tema === 'nuclear') { E.esp.flags.nuclear = gana ? 'prolongar' : 'cierre'; }
      else if (ref.tema === 'autodet' || ref.tema === 'autogob') { const rc = E.esp.ccaa[ref.c]; if (ref.tema === 'autodet') { rc.indep = clamp(rc.indep + (gana ? 6 : -3), 0, 100); if (ref.unilateral) { rc.relM = clamp(rc.relM - 8, 0, 100); rc.agravio += 1; } else rc.relM = clamp(rc.relM + 4, 0, 100); } else { rc.relM = clamp(rc.relM + (gana ? 3 : -2), 0, 100); if (gana) rc.presion && Object.keys(rc.presion).forEach(k => rc.presion[k] = Math.min(0.3, rc.presion[k] + 0.04)); } }
      else if (T.tipo === 'muni' && ref.c) { const m = E.esp.muni.m[ref.c]; if (m && gana) { m.shock[T.ind] = (m.shock[T.ind] || 0) + T.ef; m.aprob = clamp(m.aprob + 2, 10, 90); } else if (m) m.aprob = clamp(m.aprob - 1, 10, 90); }
      if (mio) { const buen = (ref.camp.si > ref.camp.no) === gana; C.Personaje.cambiar(E, { prestigio: buen ? 2 : -2, pop: buen ? 1 : -1 }, true); C.Personaje.log(E, `Consulta «${T.n}»: ${gana ? 'gana el sí' : 'gana el no'} (${U.d1(si)} %).`); }
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const s = Rf.asegurar(E), t = E.fecha.t;
      for (const ref of s.act) if (ref.estado === 'campana' && t >= ref.tVoto) Rf.votar(E, ref);
      s.act = s.act.filter(x => x.estado !== 'cerrado' || t - (x.res && x.res.t || x.tVoto) < 200); if (s.hist.length > 20) s.hist.length = 20;
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 2, grupo: 'carrera' }, o));
  R({ id: 'proponer_referendo', nombre: 'Convocar un referéndum o consulta', icono: '🗳️', desc: 'Propón una consulta nacional, autonómica o municipal según tu cargo; hay que lograr la autorización.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: (E, a) => Rf.proponer(E, a.tema) });
  R({ id: 'campana_referendo', nombre: 'Hacer campaña en una consulta', icono: '📢', costo: 1, desc: 'Pide el sí o el no en una consulta en campaña.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: (E, a) => Rf.campana(E, a.id, a.lado) });
  C.Tiempo.registrar('referendos', { turno: Rf.turno }, 49);
})(window.ESP);

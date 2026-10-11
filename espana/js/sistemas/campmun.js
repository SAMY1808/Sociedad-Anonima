/* Campaña municipal completa: en las doce semanas previas a las municipales, tu partido disputa las grandes ciudades una a una.
   Cada ciudad recibe esfuerzo (mítines, tu presencia si es la tuya), gasto local (puerta a puerta, cartelería, radio, digital) y, si quieres, un candidato estrella;
   todo eso es un empujón al voto de tu partido en esa ciudad (Municipios.votos lo incluye). Hay encuestas con margen de error, sucesos de campaña y un balance final.
   Estado: E.esp.cmun = { act, tVoto, presup:{total,gastado,credito}, tope, esf:{ciudad}, gasto:{ciudad}, estrella:{ciudad}, enc:{t,tipo}, suc[], base:{ciudad:esc}, bal }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, Mu = C.Municipios;
  const VENT = 12, TOPE = 60, MAX_ESTRELLA = 4;
  const CANALES = {
    puerta: { ic: '🚪', n: 'Puerta a puerta y voluntariado', coste: 1.2, pts: 2.2, d: 'Barato y eficaz en barrios populares.' },
    cartel: { ic: '🪧', n: 'Cartelería y mailing', coste: 1.8, pts: 2.8, d: 'Presencia en la calle de toda la ciudad.' },
    digital: { ic: '📱', n: 'Redes y publicidad digital', coste: 1.0, pts: 1.8, d: 'Barato y rápido; rinde menos en el voto mayor.' },
    radio: { ic: '📻', n: 'Radio y prensa local', coste: 2.2, pts: 3.2, d: 'Llega a quien decide tarde.' }
  };
  const ENC = { propia: { n: 'Encuesta propia', coste: 2, sd: 0.04, d: 'Precisa: previsión por ciudad con poco margen de error.' }, prensa: { n: 'Sondeo de un medio local', coste: 0, sd: 0.1, d: 'Gratis, pero con más margen de error.' } };
  const SUCESOS = [
    { id: 'escandalo', ic: '🧱', t: c => `Un escándalo urbanístico salpica a tu candidato/a en ${c}`, d: -1.6 },
    { id: 'mitin', ic: '🎤', t: c => `Un mitin multitudinario llena la plaza principal de ${c}`, d: 1.3 },
    { id: 'alcalde', ic: '🤝', t: c => `Un concejal díscolo de otro partido apoya tu lista en ${c}`, d: 1.0 },
    { id: 'lluvia', ic: '🌧', t: c => `La lluvia deslucen los actos de campaña en ${c}`, d: -0.6 },
    { id: 'viral', ic: '📲', t: c => `Un vídeo de tu candidato/a se hace viral en ${c}`, d: 1.5 },
    { id: 'encuesta', ic: '📊', t: c => `Una encuesta local te coloca en cabeza en ${c}`, d: 0.9 }
  ];
  const hash = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const gaussSeed = s => { const r = hash(s), a = Math.max(1e-9, r()), b = r(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); };
  const xJ = E => { const J = E.jugador; return (J.atrib.oratoria + J.atrib.carisma) / 20; };
  const nombre = id => (Mu.def(id) || { nombre: id }).nombre;

  const Cm = C.CampMun = {
    VENT, CANALES, ENC, TOPE,
    asegurar(E) { if (!E.esp.cmun) E.esp.cmun = { act: false, tVoto: 0, presup: { total: 0, gastado: 0, credito: 0 }, tope: TOPE, esf: {}, gasto: {}, estrella: {}, enc: { t: -99, tipo: null }, suc: [], base: {}, bal: null }; return E.esp.cmun; },
    semanas(E) { return E.esp.muni ? E.esp.muni.proxT - E.fecha.t : 99; },
    activa(E) { return !!(E.esp.cmun && E.esp.cmun.act); },
    libre(cm) { return cm.presup.total + cm.presup.credito - cm.presup.gastado; },

    /* Empujón al voto del partido del jugador en una ciudad. */
    bono(E, id) {
      const cm = E.esp.cmun; if (!cm || !cm.act) return 0; const J = E.jugador;
      const propia = J && J.muni === id ? 1.4 : 1;
      return clamp(propia * (0.016 * (cm.esf[id] || 0) + 0.0042 * (cm.gasto[id] || 0)) + (cm.estrella[id] ? 0.03 : 0), 0, 0.32);
    },

    /* Proyección de concejales de tu partido en una ciudad. Con ruido, imita una encuesta (más margen si no hay una reciente). */
    proyectar(E, id, ruido) {
      const m = E.esp.muni.m[id], pid = E.jugador.partido, v0 = Mu.votos(E, id, 0), cm = Cm.asegurar(E);
      const sd = ruido ? (E.fecha.t - cm.enc.t <= 3 ? ENC[cm.enc.tipo || 'prensa'].sd : 0.12) : 0, v = {}; let s = 0;
      for (const k in v0) { v[k] = v0[k] * (sd ? Math.exp(gaussSeed(id + '|' + k + '|' + Math.floor(E.fecha.t / 2)) * sd) : 1); s += v[k]; } for (const k in v) v[k] = v[k] * 100 / s;
      const esc = n => { const w = {}; for (const k in n) if (n[k] >= 5) w[k] = n[k]; return C.Elecciones.divisores(w, m.n, false); };
      const e = esc(v), mi = e[pid] || 0, ps = Object.keys(e).sort((a, b) => e[b] - e[a]), primero = ps[0] === pid, tot = U.suma(Object.values(e)), may = Math.floor(tot / 2) + 1;
      // puntos de voto para ganar o perder un concejal
      const mueve = d => { const w = Object.assign({}, v); w[pid] = Math.max(0, (w[pid] || 0) + d); const s2 = U.suma(Object.values(w)); for (const k in w) w[k] = w[k] * 100 / s2; return esc(w)[pid] || 0; };
      let ganar = null, perder = null; for (let d = 0.2; d <= 12; d += 0.2) { if (ganar == null && mueve(d) > mi) ganar = d; if (perder == null && mueve(-d) < mi) perder = d; if (ganar != null && perder != null) break; }
      const segundo = ps.find(k => k !== ps[0]), enJuego = (ps[0] === pid ? (e[pid] - (e[segundo] || 0)) : (e[ps[0]] - mi)) <= 3 || (e[pid] || 0) >= may - 2 && mi < may;
      return { v, esc: e, mias: mi, n: m.n, primero, ganar, perder, enJuego, lider: ps[0], may };
    },
    /* Ciudades ordenadas por lo disputadas que están (y por su peso). */
    enDisputa(E) {
      const J = E.jugador;
      return Mu.ids().map(id => { const p = Cm.proyectar(E, id, true), m = E.esp.muni.m[id], sc = (p.enJuego ? 0 : 5) + Math.min(p.ganar == null ? 12 : p.ganar, p.perder == null ? 12 : p.perder) - Math.log10(m.pob) * 1.5 - (J.muni === id ? 6 : 0); return { id, p, sc }; }).sort((a, b) => a.sc - b.sc);
    },

    iniciar(E) {
      const cm = Cm.asegurar(E), J = E.jugador, pa = E.partidos[J.partido]; if (!pa || E.meta.presim) return;
      const base = {}; Object.assign(cm, { act: true, tVoto: E.esp.muni.proxT, presup: { total: Math.round(clamp(pa.finanzas * 0.3 + 5, 5, 40)), gastado: 0, credito: 0 }, tope: TOPE, esf: {}, gasto: {}, estrella: {}, enc: { t: -99, tipo: null }, suc: [], bal: null });
      cm.act = false; for (const id of Mu.ids()) base[id] = Cm.proyectar(E, id, false).mias; cm.base = base; cm.act = true;
      if (J.muni && Mu.ids().includes(J.muni)) cm.esf[J.muni] = 1;
      C.Noticias.poner(E, 'elecciones', `Arranca la campaña de las municipales: ${pa.sigla} se juega las ${Mu.ids().length} grandes ciudades.`, 'ES', 'local');
    },

    mitin(E, id) {
      const cm = Cm.asegurar(E); if (!cm.act) return { ok: false, msg: 'La campaña municipal aún no ha empezado' };
      if (!Mu.ids().includes(id)) return { ok: false, msg: 'Elige una ciudad' };
      const e0 = cm.esf[id] || 0, g = (0.8 + xJ(E) * 1.1) * (e0 > 7 ? 0.5 : 1);
      cm.esf[id] = clamp(e0 + g, 0, 12); C.Personaje.cambiar(E, { pop: 0.15 + xJ(E) * 0.25 });
      const j = E.jugador; return { ok: true, msg: `Mitin en ${nombre(id)}: esfuerzo +${U.d1(g)}${j.muni === id ? ' (tu ciudad: cuenta más)' : ''}.` };
    },
    gastar(E, id, canal) {
      const cm = Cm.asegurar(E), cn = CANALES[canal]; if (!cm.act) return { ok: false, msg: 'La campaña municipal aún no ha empezado' };
      if (!cn) return { ok: false, msg: 'Elige un canal' }; if (!Mu.ids().includes(id)) return { ok: false, msg: 'Elige una ciudad' };
      const coste = Math.round(cn.coste * (0.6 + E.esp.muni.m[id].pob / 2500) * 10) / 10;
      if (Cm.libre(cm) < coste) return { ok: false, msg: `Sin fondos: te quedan ${U.d1(Cm.libre(cm))} M€ y esto cuesta ${coste}.` };
      if (cm.presup.gastado + coste > cm.tope) return { ok: false, msg: `Superarías el tope legal de ${cm.tope} M€.` };
      cm.presup.gastado += coste; const pts = cn.pts * (0.85 + 0.3 * E.jugador.atrib.gestion / 10); cm.gasto[id] = (cm.gasto[id] || 0) + pts;
      return { ok: true, msg: `${cn.ic} ${cn.n} en ${nombre(id)}: −${coste} M€.` };
    },
    estrella(E, id) {
      const cm = Cm.asegurar(E); if (!cm.act) return { ok: false, msg: 'La campaña municipal aún no ha empezado' };
      if (!Mu.ids().includes(id)) return { ok: false, msg: 'Elige una ciudad' }; if (cm.estrella[id]) return { ok: false, msg: 'Ya tienes candidato/a estrella allí' };
      if (Object.keys(cm.estrella).length >= MAX_ESTRELLA) return { ok: false, msg: `Sólo puedes presentar ${MAX_ESTRELLA} candidatos/as estrella` };
      cm.estrella[id] = true; C.Personaje.cambiar(E, { prestigio: -0.2 });
      return { ok: true, msg: `Fichas un candidato/a estrella para ${nombre(id)}: más tirón personal en las urnas.` };
    },
    encuesta(E, tipo) {
      const cm = Cm.asegurar(E), cfg = ENC[tipo]; if (!cm.act) return { ok: false, msg: 'La campaña municipal aún no ha empezado' }; if (!cfg) return { ok: false, msg: 'Elige un tipo de encuesta' };
      if (cfg.coste && Cm.libre(cm) < cfg.coste) return { ok: false, msg: `Sin fondos: cuesta ${cfg.coste} M€` };
      cm.presup.gastado += cfg.coste; cm.enc = { t: E.fecha.t, tipo };
      return { ok: true, msg: `${cfg.n}: previsión por ciudad actualizada (margen de error ${tipo === 'propia' ? '±1' : '±2,5'} puntos).` };
    },
    /* Reparte el gasto disponible entre las ciudades más disputadas. */
    auto(E) {
      const cm = Cm.asegurar(E); if (!cm.act) return { ok: false, msg: 'La campaña municipal aún no ha empezado' };
      const top = Cm.enDisputa(E).slice(0, 8); let n = 0, i = 0;
      while (n < 24 && i < 60) { const x = top[i % top.length], canal = ['puerta', 'cartel', 'radio', 'digital'][i % 4], r = Cm.gastar(E, x.id, canal); i++; if (r.ok) n++; else if (/Sin fondos|tope/.test(r.msg)) break; }
      return n ? { ok: true, msg: `Reparto automático: ${n} inversiones en las ciudades más disputadas.` } : { ok: false, msg: 'No queda presupuesto para repartir' };
    },

    suceso(E) {
      const cm = Cm.asegurar(E), top = Cm.enDisputa(E).slice(0, 14), x = U.pick(top), s = U.pick(SUCESOS), m = E.esp.muni.m[x.id];
      cm.esf[x.id] = clamp((cm.esf[x.id] || 0) + s.d, 0, 12); const txt = s.t(m.nombre); cm.suc.unshift({ t: E.fecha.t, ic: s.ic, txt, d: s.d }); if (cm.suc.length > 8) cm.suc.length = 8;
      C.Noticias.poner(E, 'elecciones', txt + '.', 'ES', 'local');
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return;
      const cm = Cm.asegurar(E), s = Cm.semanas(E);
      if (!cm.act && s > 0 && s <= VENT) Cm.iniciar(E);
      if (cm.act && U.chance(0.35)) Cm.suceso(E);
    },
    /* Tras el recuento: balance de lo que aportó la campaña. */
    cerrar(E) {
      const cm = Cm.asegurar(E), J = E.jugador; if (!cm.act) return; const pid = J.partido; let conc = 0, gan = [], per = [], alc = 0;
      for (const id of Mu.ids()) { const m = E.esp.muni.m[id], n = m.esc[pid] || 0, b = cm.base[id] || 0; conc += n - b; if (n > b) gan.push({ id, d: n - b }); else if (n < b) per.push({ id, d: n - b }); if (m.alcalde === pid) alc++; }
      cm.bal = { t: E.fecha.t, conc, alc, gasto: Math.round(cm.presup.gastado * 10) / 10, gan: gan.sort((a, b) => b.d - a.d).slice(0, 5), per: per.sort((a, b) => a.d - b.d).slice(0, 5), estrellas: Object.keys(cm.estrella).length };
      const multa = cm.presup.gastado > cm.tope; if (multa) C.Personaje.cambiar(E, { prestigio: -1.5 });
      C.Noticias.poner(E, 'elecciones', `${E.partidos[pid].sigla} cierra su campaña municipal con ${conc >= 0 ? '+' : '−'}${Math.abs(conc)} concejales sobre lo previsto y ${alc} alcaldías entre las ${Mu.ids().length} grandes ciudades.`, 'ES', 'local');
      if (conc > 0) C.Personaje.cambiar(E, { prestigio: Math.min(2, conc * 0.15), pop: Math.min(1, conc * 0.1) }, true);
      cm.act = false; cm.esf = {}; cm.gasto = {}; cm.estrella = {};
    }
  };

  /* ── Ganchos ── */
  if (Mu && Mu.votos) { const f = Mu.votos; Mu.votos = function (E, id, ruido) { const r = f.apply(this, arguments), b = Cm.bono(E, id), pid = E.jugador && E.jugador.partido; if (b > 0 && r[pid] != null) { r[pid] *= 1 + b; const s = U.suma(Object.values(r)); for (const k in r) r[k] = r[k] * 100 / s; } return r; }; }
  if (Mu && Mu.elecciones) { const f = Mu.elecciones; Mu.elecciones = function (E, inicial) { const r = f.apply(this, arguments); if (!inicial) Cm.cerrar(E); return r; }; }
  C.Tiempo.registrar('campmun', { turno: E => Cm.turno(E) }, 35);

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'campana' }, o));
  const ES = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  const en = E => { const r = ES(E); if (r !== true) return r; const cm = Cm.asegurar(E); return cm.act ? true : (Cm.semanas(E) > VENT ? `La campaña municipal empieza en ${Cm.semanas(E) - VENT} semanas` : 'La campaña municipal aún no ha empezado'); };
  R({ id: 'mitin_local', nombre: 'Mitin en una ciudad', icono: '🎤', desc: 'Recorres una de las grandes ciudades: suma esfuerzo y empuja tu voto allí (más en tu ciudad).', disponible: en, ejecutar: (E, a) => Cm.mitin(E, a.muni) });
  R({ id: 'gasto_local', nombre: 'Gasto de campaña en una ciudad', icono: '💶', costo: 0, desc: 'Invierte parte del presupuesto en una ciudad: puerta a puerta, cartelería, radio local o redes.', disponible: en, ejecutar: (E, a) => Cm.gastar(E, a.muni, a.canal) });
  R({ id: 'candidato_estrella', nombre: 'Candidato/a estrella', icono: '⭐', costo: 2, desc: 'Presenta una cara conocida en una ciudad: más tirón personal en las urnas (máximo cuatro).', disponible: en, ejecutar: (E, a) => Cm.estrella(E, a.muni) });
  R({ id: 'encuesta_local', nombre: 'Encuesta de ciudades', icono: '📊', desc: 'Actualiza la previsión de concejales en todas las grandes ciudades: la propia cuesta presupuesto y es más precisa.', disponible: en, ejecutar: (E, a) => Cm.encuesta(E, a.tipo || 'prensa') });
  R({ id: 'campana_mun_auto', nombre: 'Campaña municipal automática', icono: '⚡', costo: 1, desc: 'Reparte el presupuesto entre las ciudades más disputadas.', disponible: en, ejecutar: E => Cm.auto(E) });
})(window.ESP);

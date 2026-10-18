/* Obras públicas sobre el mapa: autovías, alta velocidad y líneas eléctricas entre dos ciudades, y obras puntuales (aeropuertos, hospitales, campus, parques solares).
   Quien tiene la competencia las ordena desde el mapa (capa «Obras»); los demás las piden y la administración competente decide. Cuestan dinero mientras se construyen
   (déficit del Estado o deuda de la comunidad) y, al inaugurarlas, dan crecimiento, aprobación, voto en las provincias que cruzan y menos agravio territorial.
   Las administraciones que no controla el jugador también anuncian y construyen las suyas. Las distancias salen del propio mapa (data/mapa-es.js: 1 unidad = 250 m).
   Estado: E.esp.obras = { lista[{ id, tipo, a, b, owner ('E' o comunidad), quien ('jug' | 'pedida' | 'ia' | 'red'), t0, dur, prog, coste, gast, km, imp, estado ('curso' | 'hecha' | 'cancelada'),
   pausa, acel, provs[[provincia, peso]], t1 }], seq, ver, bonus{provincia:{partido:multiplicador}}, niv{ciudad:{tipo:nivel}}, hist[], cd{}, sembrado }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, G = () => D().mapaEs;
  const f2 = n => Math.round(n * 100) / 100;
  /* Escala de juego: a tamaño real ninguna obra se notaría en el déficit del Estado ni en la deuda de una comunidad. */
  const ESCALA = 4;
  const AISLA = { m_pal2: 'BAL', m_lpa: 'LPA', m_tfe: 'TFE', m_ceu: 'CEU', m_mel: 'MEL' }, CANARIAS = ['m_lpa', 'm_tfe'];
  const masa = id => AISLA[id] || 'PEN';
  /* Terreno accidentado de cada provincia: encarece y alarga las vías. */
  const RELIEVE = { AST: 1.4, CNT: 1.35, BIZ: 1.35, GIP: 1.35, NAV: 1.3, HUE: 1.35, LLE: 1.25, GIR: 1.25, LEO: 1.25, OUR: 1.3, LUG: 1.25, PON: 1.25, ACO: 1.15, TER: 1.25, CUE: 1.2, SEG: 1.2, AVI: 1.2, SOR: 1.15, GRA: 1.3, JAE: 1.2, MAL: 1.25, ALM: 1.15, CAS: 1.15, BUR: 1.1, ALA: 1.1, MAD: 1.1, BCN: 1.2, TAR: 1.1, LPA: 1.4, TFE: 1.4 };

  const TIPOS = {
    autovia: { ic: '🛣', n: 'Autovía', art: 'la', nom: 'autovía', ab: true, amb: 'ambos', sec: ['tpt'], col: '#ecd9a0', ancho: 2.2, tarifa: 5.2, tort: 1.18, sem0: 26, semKm: 0.3, min: 20, max: 650, pol: 1, ec: { crec: 0.035, paro: -0.02 }, desc: 'Carretera de doble calzada entre dos ciudades: acerca las comarcas que cruza.' },
    ave: { ic: '🚄', n: 'Alta velocidad', art: 'la', nom: 'línea de alta velocidad', ab: true, amb: 'est', sec: ['tpt'], col: '#ff8f7e', ancho: 2.6, tarifa: 14, tort: 1.12, sem0: 40, semKm: 0.45, min: 60, max: 800, pol: 1.15, ec: { crec: 0.05 }, desc: 'Tren de alta velocidad: la obra más cara y la más vistosa. Sólo la construye el Estado.' },
    electrica: { ic: '⚡', n: 'Línea eléctrica', art: 'la', nom: 'línea eléctrica', ab: true, amb: 'est', sec: ['amb', 'ind'], col: '#ffd84a', ancho: 1.7, tarifa: 1.6, tort: 1.05, sem0: 20, semKm: 0.12, min: 40, max: 700, pol: 0.55, ec: { infl: -0.03, crec: 0.015 }, desc: 'Red de alta tensión (con cable submarino hasta las islas): abarata la energía, pero casi nadie la ve.' },
    aeropuerto: { ic: '✈️', n: 'Aeropuerto', art: 'el', nom: 'aeropuerto', ab: false, amb: 'est', sec: ['tpt'], base: 320, porHab: 0.34, sem0: 104, semHab: 0.02, maxNiv: 3, pol: 0.9, ec: { crec: 0.04, paro: -0.04 }, desc: 'Más vuelos, turismo y empleo en la ciudad y su provincia.' },
    hospital: { ic: '🏥', n: 'Hospital', art: 'el', nom: 'hospital', ab: false, amb: 'reg', sec: [], base: 140, porHab: 0.12, sem0: 78, semHab: 0.016, maxNiv: 4, pol: 1.5, ec: {}, desc: 'La sanidad es competencia autonómica: muy popular, pero sólo lo ordena la comunidad (o el Estado en Ceuta y Melilla).' },
    campus: { ic: '🎓', n: 'Campus universitario', art: 'el', nom: 'campus', ab: false, amb: 'reg', sec: [], base: 110, porHab: 0.08, sem0: 90, semHab: 0.01, maxNiv: 3, pol: 1, ec: { crec: 0.02 }, desc: 'Universidad y empleo cualificado; competencia de las comunidades.' },
    solar: { ic: '☀️', n: 'Parque solar', art: 'el', nom: 'parque solar', ab: false, amb: 'ambos', sec: ['amb', 'ind'], base: 260, porHab: 0.03, sem0: 52, semHab: 0.004, maxNiv: 3, pol: 0.7, ec: { infl: -0.03, crec: 0.01 }, desc: 'Energía renovable: abarata la factura y crea empleo local.' }
  };
  const ORDEN = ['autovia', 'ave', 'electrica', 'aeropuerto', 'hospital', 'campus', 'solar'];
  const BASE_NIV = { aeropuerto: p => p >= 600 ? 2 : p >= 100 ? 1 : 0, hospital: p => p >= 400 ? 2 : p >= 40 ? 1 : 0, campus: p => p >= 400 ? 2 : p >= 70 ? 1 : 0, solar: () => 0 };

  /* Red que ya existe al empezar (aproximada: líneas rectas entre capitales, no trazados reales). */
  const RED0 = {
    ave: [['mad', 'zar'], ['zar', 'lle'], ['lle', 'bcn'], ['bcn', 'gir'], ['mad', 'cor'], ['cor', 'sev'], ['cor', 'mal'], ['mad', 'cue'], ['cue', 'vlc'], ['vlc', 'ali'], ['ali', 'mur'], ['mad', 'seg'], ['seg', 'vll'], ['vll', 'leo'], ['leo', 'ovi'], ['vll', 'bur'], ['zar', 'hue']],
    autovia: [['mad', 'bur'], ['bur', 'vit'], ['vit', 'bil'], ['bil', 'snt'], ['snt', 'gij'], ['gij', 'ovi'], ['ovi', 'leo'], ['bil', 'ssb'], ['vit', 'pam'], ['pam', 'ssb'], ['pam', 'zar'], ['pam', 'log'], ['log', 'zar'], ['vit', 'log'], ['mad', 'zar'], ['zar', 'lle'], ['lle', 'bcn'], ['bcn', 'gir'], ['bcn', 'tar'], ['tar', 'cas'], ['cas', 'vlc'], ['vlc', 'ali'], ['ali', 'mur'], ['mur', 'alm'], ['alm', 'mal'], ['alm', 'gra'], ['mal', 'gra'], ['mal', 'cad'], ['mal', 'sev'], ['mad', 'vlc'], ['mad', 'alb'], ['alb', 'mur'], ['alb', 'vlc'], ['mad', 'cor'], ['cor', 'sev'], ['sev', 'cad'], ['sev', 'huv'], ['sev', 'bda'], ['cor', 'jae'], ['jae', 'gra'], ['mad', 'bda'], ['bda', 'cac'], ['cac', 'sal'], ['sal', 'zam'], ['zam', 'leo'], ['mad', 'vll'], ['vll', 'leo'], ['vll', 'bur'], ['vll', 'sal'], ['leo', 'lug'], ['lug', 'aco'], ['aco', 'vig'], ['vig', 'pon'], ['vig', 'our'], ['our', 'lug'], ['mad', 'tol'], ['mad', 'gua'], ['mad', 'cue'], ['tol', 'cre'], ['cre', 'cor'], ['cre', 'alb'], ['mad', 'seg'], ['seg', 'avi'], ['mad', 'avi'], ['zar', 'hue'], ['zar', 'ter'], ['ter', 'vlc'], ['sor', 'zar'], ['sor', 'bur']],
    electrica: [['bil', 'vit'], ['vit', 'bur'], ['bur', 'vll'], ['vll', 'mad'], ['mad', 'cor'], ['cor', 'sev'], ['sev', 'huv'], ['sev', 'cad'], ['mad', 'vlc'], ['vlc', 'bcn'], ['mad', 'zar'], ['zar', 'bcn'], ['zar', 'pam'], ['mad', 'bda'], ['mal', 'gra'], ['mur', 'ali'], ['vlc', 'pal2'], ['lpa', 'tfe']]
  };

  /* ── Geometría ── */
  const ciu = id => { const g = G(); return g && g.ciu ? g.ciu[id] : undefined; };   // sin los datos del mapa no hay ciudades: nada se puede trazar
  const km = (a, b) => Math.hypot(ciu(a)[0] - ciu(b)[0], ciu(a)[1] - ciu(b)[1]) / 4;
  const mun = (E, id) => E.esp.muni.m[id];
  const pobDe = (E, id) => { const m = mun(E, id); return m ? m.pob : 0; };
  const nombre = (E, id) => { const m = mun(E, id); return m ? m.nombre : id; };
  const ccaaNom = c => D().ccaa[c] ? D().ccaa[c].nombre : c;
  /* La comunidad con su artículo, para frases como «el Gobierno de la Comunidad de Madrid» o «en el País Vasco». */
  const LUGAR = { MAD: 'la Comunidad de Madrid', MUR: 'la Región de Murcia', VAL: 'la Comunitat Valenciana', PVA: 'el País Vasco', BAL: 'Baleares' };
  const lugar = c => LUGAR[c] || ccaaNom(c), deLugar = c => { const l = lugar(c); return l.startsWith('el ') ? 'del ' + l.slice(3) : 'de ' + l; }, enLugar = c => 'en ' + lugar(c);
  const provCerca = (x, y) => { const cen = G().cen; let mejor = null, bd = Infinity; for (const p in cen) { const dx = cen[p][0] - x, dy = cen[p][1] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; mejor = p; } } return mejor; };
  /* Trazo curvo (Bézier cuadrática) entre dos ciudades: determinista, para que dos obras paralelas no se tapen. */
  function trazo(tipo, a, b) {
    const A = ciu(a), B = ciu(b), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1, s = tipo + a + b; let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    const curv = tipo === 'electrica' ? 0.03 : 0.07 + (Math.abs(h) % 5) / 100, sg = (h & 1) ? 1 : -1;
    return { ax: A[0], ay: A[1], bx: B[0], by: B[1], cx: (A[0] + B[0]) / 2 - dy / len * len * curv * sg, cy: (A[1] + B[1]) / 2 + dx / len * len * curv * sg };
  }
  const punto = (t, u) => { const k = 1 - u; return [k * k * t.ax + 2 * k * u * t.cx + u * u * t.bx, k * k * t.ay + 2 * k * u * t.cy + u * u * t.by]; };
  /* Provincias que atraviesa un trazo, con su peso (extremos 1, tránsito 0,6). */
  function provincias(E, tipo, a, b) {
    const ma = mun(E, a), out = [{ p: ma.prov, w: 1 }]; if (!b) return out;
    const mb = mun(E, b), t = trazo(tipo, a, b), n = clamp(Math.round(km(a, b) / 20), 6, 40), vistas = new Set([ma.prov]);
    for (let i = 1; i < n; i++) { const q = punto(t, i / n), p = provCerca(q[0], q[1]); if (p && !vistas.has(p)) { vistas.add(p); out.push({ p, w: 0.6 }); } }
    if (vistas.has(mb.prov)) out.find(q => q.p === mb.prov).w = 1; else out.push({ p: mb.prov, w: 1 });
    return out;
  }

  const Ob = C.Obras = {
    TIPOS, ORDEN, ESCALA, RED0, trazo, punto, km,

    /* ── Estado ── */
    asegurar(E) {
      let o = E.esp.obras;
      if (!o) o = E.esp.obras = { lista: [], seq: 1, ver: 0, bonus: {}, niv: {}, hist: [], cd: {}, sembrado: false };
      if (!o.sembrado) { o.sembrado = true; Ob._sembrar(E, o); }
      return o;
    },
    _sembrar(E, o) {
      for (const tipo of Object.keys(RED0)) for (const [a, b] of RED0[tipo]) {
        const A = 'm_' + a, B = 'm_' + b; if (!mun(E, A) || !mun(E, B) || !ciu(A) || !ciu(B)) continue;
        const info = Ob.calcular(E, tipo, A, B, o);
        o.lista.push({ id: 'r' + (o.seq++), tipo, a: A, b: B, owner: 'E', quien: 'red', t0: -1, dur: info.sem, prog: 1, coste: info.coste, gast: info.coste, km: info.km, imp: info.imp, estado: 'hecha', pausa: 0, acel: -99, provs: info.provs.map(q => [q.p, q.w]), t1: -1 });
      }
      o.ver++;
    },
    nivel(E, id, tipo) { const o = E.esp.obras || Ob.asegurar(E), n = o.niv[id]; return n && n[tipo] != null ? n[tipo] : (BASE_NIV[tipo] ? BASE_NIV[tipo](pobDe(E, id)) : 0); },
    nota(E, txt) { const o = Ob.asegurar(E); o.hist.unshift({ t: E.fecha.t, txt }); if (o.hist.length > 30) o.hist.length = 30; },

    /* ── Textos ── */
    titulo(E, w) { const T = TIPOS[w.tipo]; return T.ab ? `${T.n} ${nombre(E, w.a)}–${nombre(E, w.b)}` : `${T.n} de ${nombre(E, w.a)}`; },
    descripcion(E, w) { const T = TIPOS[w.tipo]; return T.ab ? `${T.art} ${T.nom} ${nombre(E, w.a)}–${nombre(E, w.b)}` : `${T.art} ${T.nom} de ${nombre(E, w.a)}`; },
    dueno(E, owner, may) { const t = 'el Gobierno ' + (owner === 'E' ? 'de España' : deLugar(owner)); return may ? 'E' + t.slice(1) : t; },
    aDueno(E, owner) { return 'al Gobierno ' + (owner === 'E' ? 'de España' : deLugar(owner)); },
    duenoCorto(owner) { return owner === 'E' ? 'Estado' : ccaaNom(owner); },
    /* Para las noticias de obras autonómicas: el nombre de la comunidad hace que la noticia sea suya (Foco). */
    lug(w) { return w.owner === 'E' ? '' : ' (' + ccaaNom(w.owner) + ')'; },
    eur(m) { return U.n(Math.round(m)) + ' M€'; },
    plazo(sem) { sem = Math.round(sem); if (sem < 9) return sem + ' semana' + (sem === 1 ? '' : 's'); const a = Math.floor(sem / 52), m = Math.round((sem - a * 52) / 4.345); if (!a) return m + ' meses'; return a + (a === 1 ? ' año' : ' años') + (m ? ' y ' + m + (m === 1 ? ' mes' : ' meses') : ''); },

    /* ── Cálculo de una obra: kilómetros, coste, plazo, importancia y provincias que toca ── */
    calcular(E, tipo, a, b, o) {
      const T = TIPOS[tipo];
      if (T.ab) {
        const d = km(a, b), kmObra = d * T.tort, provs = provincias(E, tipo, a, b), pw = provs.reduce((s, q) => s + q.w, 0) || 1;
        const relieve = tipo === 'electrica' ? 1 : provs.reduce((s, q) => s + (RELIEVE[q.p] || 1) * q.w, 0) / pw, mar = masa(a) !== masa(b);
        const coste = Math.max(5, Math.round(kmObra * T.tarifa * relieve * (mar ? 3.2 : 1) / 5) * 5);
        const sem = Math.round((T.sem0 + T.semKm * kmObra * (1 + (relieve - 1) * 0.6)) * (mar ? 1.4 : 1));
        let imp = Math.pow(Math.sqrt(pobDe(E, a) * pobDe(E, b)) / 400, 0.55); if (d < 60) imp *= 0.75; imp *= tipo === 'ave' ? 1.2 : tipo === 'electrica' ? 0.9 : 1;
        return { km: Math.round(d), kmObra: Math.round(kmObra), relieve: f2(relieve), mar, coste, sem, imp: f2(clamp(imp, 0.3, 3)), provs };
      }
      const pob = pobDe(E, a), n = Ob.nivel(E, a, tipo);
      const coste = Math.max(20, Math.round((T.base + T.porHab * pob) * (1 + 0.5 * n) / 5) * 5), sem = Math.round(T.sem0 + T.semHab * pob + 6 * n);
      return { km: 0, kmObra: 0, relieve: 1, mar: false, coste, sem, imp: f2(clamp(Math.pow(pob / 450, 0.5) * (1 - 0.12 * n), 0.3, 2.6)), provs: [{ p: mun(E, a).prov, w: 1 }] };
    },

    /* Lo que da una obra al inaugurarla (sirve para la previsión y para aplicarlo de verdad). */
    efectos(E, w) {
      const T = TIPOS[w.tipo], imp = w.imp, est = w.owner === 'E', k = est ? 1 : 0.5, ec = {};
      for (const key in T.ec) ec[key] = f2(T.ec[key] * imp * k * 1000) / 1000;
      const provs = (w.provs || []).map(q => Array.isArray(q) ? q : [q.p, q.w]), tot = provs.reduce((s, q) => s + q[1], 0) || 1, regs = {};
      for (const [p, pe] of provs) { const c = D().provincias[p][1]; regs[c] = (regs[c] || 0) + pe / tot; }
      return { aprob: f2(clamp(0.6 * imp * T.pol, 0.15, 2.4)), voto: f2(clamp(0.012 * imp * T.pol, 0.002, 0.03) * 1000) / 1000, agravio: f2(0.12 * imp), relM: f2(0.5 * imp), ec, regs, provs: provs.length };
    },

    /* ── Comprobaciones: geometría y existencia (sin mirar quién la ordena) ── */
    existe(E, tipo, a, b) { const o = Ob.asegurar(E); return o.lista.some(w => w.estado !== 'cancelada' && w.tipo === tipo && ((w.a === a && w.b === b) || (w.a === b && w.b === a))); },
    chequear(E, tipo, a, b) {
      const T = TIPOS[tipo]; if (!T) return { ok: false, motivo: 'Tipo de obra desconocido' };
      if (!a || !mun(E, a) || !ciu(a)) return { ok: false, motivo: T.ab ? 'Elige la ciudad de origen' : 'Elige la ciudad', incompleto: true };
      if (T.ab) {
        if (!b || !mun(E, b) || !ciu(b)) return { ok: false, motivo: 'Elige la ciudad de destino', incompleto: true };
        if (a === b) return { ok: false, motivo: 'El origen y el destino son la misma ciudad' };
        const d = km(a, b);
        if (tipo !== 'electrica' && masa(a) !== masa(b)) return { ok: false, motivo: `No hay forma de unir ${nombre(E, a)} y ${nombre(E, b)} por tierra` };
        if (tipo === 'electrica' && CANARIAS.includes(a) !== CANARIAS.includes(b)) return { ok: false, motivo: 'Canarias es un sistema eléctrico aislado: sólo se interconectan las islas entre sí' };
        if (tipo === 'electrica' && masa(a) !== masa(b) && masa(a) !== 'PEN' && masa(b) !== 'PEN' && !(CANARIAS.includes(a) && CANARIAS.includes(b))) return { ok: false, motivo: 'Las islas y las ciudades autónomas se conectan con la Península, no entre sí' };
        if (d < T.min) return { ok: false, motivo: `Demasiado cerca (${Math.round(d)} km): mínimo ${T.min} km` };
        if (d > T.max) return { ok: false, motivo: `Demasiado lejos (${Math.round(d)} km): máximo ${T.max} km, divídela en tramos` };
        if (Ob.existe(E, tipo, a, b)) return { ok: false, motivo: 'Esa conexión ya existe o ya se está construyendo' };
      } else {
        const o = Ob.asegurar(E), n = Ob.nivel(E, a, tipo);
        if (n >= T.maxNiv) return { ok: false, motivo: `${nombre(E, a)} ya no puede albergar más (${T.nom})` };
        if (o.lista.some(w => w.estado === 'curso' && w.tipo === tipo && w.a === a)) return { ok: false, motivo: 'Ya hay una obra de ese tipo en marcha allí' };
      }
      const info = Ob.calcular(E, tipo, a, T.ab ? b : null);
      return { ok: true, info };
    },

    /* ── Quién puede ordenarla y quién decide si se pide ── */
    ambitoReal(E, tipo, a) { const T = TIPOS[tipo], m = mun(E, a); return T.amb === 'reg' && m && (m.ccaa === 'CEU' || m.ccaa === 'MEL') ? 'est' : T.amb; },
    decisor(E, tipo, a, b) {
      const T = TIPOS[tipo], ambito = Ob.ambitoReal(E, tipo, a), cA = mun(E, a).ccaa, cB = b ? mun(E, b).ccaa : cA;
      if (ambito === 'est') return 'E'; if (ambito === 'reg') return cA;
      return cA === cB ? cA : 'E';
    },
    competencia(E, tipo, a, b) {
      const J = E.jugador, T = TIPOS[tipo]; if (!J || J.pais !== 'ES') return { motivo: 'Las obras públicas sólo existen en España' };
      const amb = Ob.ambitoReal(E, tipo, a), cA = mun(E, a) ? mun(E, a).ccaa : null, cB = b && mun(E, b) ? mun(E, b).ccaa : cA;
      if (J.cargo === 'pm' || J.cargo === 'vicepres') return amb === 'reg' ? { motivo: `${T.n}: es competencia de las comunidades autónomas; puedes pedirl${T.art === 'la' ? 'a' : 'o'} ${Ob.aDueno(E, cA)}` } : { owner: 'E' };
      if (J.cargo === 'ministro') {
        if (amb === 'reg') return { motivo: `${T.n}: es competencia de las comunidades autónomas` };
        const m = D().ministerios.find(x => x.id === J.ministerio);
        return T.sec.includes(J.ministerio) ? { owner: 'E' } : { motivo: `Tu cartera${m ? ' (' + m.nombre + ')' : ''} no ordena ${T.art === 'la' ? 'esta' : 'este'} ${T.nom}; puedes pedirl${T.art === 'la' ? 'a' : 'o'}` };
      }
      if (J.cargo === 'presauto') {
        if (amb === 'est') return { motivo: `${T.art === 'la' ? 'La' : 'El'} ${T.nom} es competencia del Estado; puedes pedirl${T.art === 'la' ? 'a' : 'o'}` };
        if (cA !== J.region || cB !== J.region) return { motivo: `Una comunidad sólo construye dentro de su territorio (${ccaaNom(J.region)})` };
        return { owner: J.region };
      }
      return { motivo: 'Tu cargo no ordena obras públicas; puedes pedirlas al Gobierno competente' };
    },
    /* Lo que puede ordenar el jugador: { nivel: 'estado' | 'comunidad' | 'ninguno', owner, tipos[], texto } */
    autoridad(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return { nivel: 'ninguno', owner: null, tipos: [], texto: 'Las obras públicas sólo existen en España.' };
      if (J.cargo === 'pm' || J.cargo === 'vicepres') return { nivel: 'estado', owner: 'E', tipos: ORDEN.filter(t => TIPOS[t].amb !== 'reg'), texto: 'Ordenas las obras del Estado: autovías, alta velocidad, red eléctrica, aeropuertos y energía. Hospitales y campus son competencia de las comunidades: se piden.' };
      if (J.cargo === 'ministro') { const m = D().ministerios.find(x => x.id === J.ministerio), tipos = ORDEN.filter(t => TIPOS[t].amb !== 'reg' && TIPOS[t].sec.includes(J.ministerio)); return { nivel: tipos.length ? 'estado' : 'ninguno', owner: 'E', tipos, texto: tipos.length ? `Desde ${m ? m.nombre : 'tu ministerio'} ordenas ${tipos.map(t => TIPOS[t].nom).join(', ')}. Lo demás se pide al resto del Consejo de Ministros.` : `Tu cartera${m ? ' (' + m.nombre + ')' : ''} no ordena obras públicas: puedes pedirlas.` }; }
      if (J.cargo === 'presauto') return { nivel: 'comunidad', owner: J.region, tipos: ORDEN.filter(t => TIPOS[t].amb !== 'est'), texto: `Ordenas las obras ${deLugar(J.region)} (dentro de su territorio): autovías autonómicas, hospitales, campus y parques solares. Alta velocidad, red eléctrica y aeropuertos son del Estado: se piden.` };
      return { nivel: 'ninguno', owner: null, tipos: [], texto: 'Tu cargo no ordena obras públicas, pero puedes pedirlas al Gobierno competente: cuanto más afín y más popular seas, más fácil.' };
    },
    /* Obras en marcha de una administración y su tope. */
    activas(E, owner) { const o = Ob.asegurar(E); return o.lista.filter(w => w.estado === 'curso' && (owner == null || w.owner === owner)); },
    tope(owner) { return owner === 'E' ? 4 : 2; },
    limite(E, owner, coste) {
      const act = Ob.activas(E, owner).length;
      if (act >= Ob.tope(owner)) return `${Ob.dueno(E, owner, true)} ya tiene ${act} obras en marcha (máximo ${Ob.tope(owner)})`;
      if (owner === 'E') { if (E.paises.ES.ec.pde && coste > 1000) return 'Con el procedimiento de déficit excesivo abierto, Bruselas no tolera obras de más de 1.000 M€'; }
      else { const rc = E.esp.ccaa[owner]; if (!rc || !rc.gob) return 'La comunidad no tiene gobierno'; if (rc.suspendida) return 'La comunidad está intervenida (artículo 155)'; if (rc.deuda > 62) return `La deuda ${deLugar(owner)} (${Math.round(rc.deuda)} %) no permite licitar más obras`; }
      return null;
    },
    puedeOrdenar(E, a) {
      a = a || {}; const v = Ob.chequear(E, a.tipo, a.a, a.b); if (!v.ok) return v.motivo;
      const c = Ob.competencia(E, a.tipo, a.a, a.b); if (!c.owner) return c.motivo;
      const lim = Ob.limite(E, c.owner, v.info.coste); return lim || true;
    },
    cooldown(E, tipo, a, b) { const o = Ob.asegurar(E), t = o.cd['p:' + tipo + ':' + a + ':' + (b || '')]; return t != null && E.fecha.t - t < 26 ? 26 - (E.fecha.t - t) : 0; },
    afinidad(gob, pid) { if (!gob) return 0; return gob.partido === pid ? 1 : (gob.coalicion || []).includes(pid) ? 0.7 : (gob.apoyoExterno || []).includes(pid) ? 0.4 : 0; },
    gobDe(E, owner) { return owner === 'E' ? E.paises.ES.gob : (E.esp.ccaa[owner] ? E.esp.ccaa[owner].gob : null); },
    /* Probabilidad (0-1) de que la administración competente acepte una petición del jugador. */
    probPedir(E, tipo, a, b, info) {
      const J = E.jugador, dec = Ob.decisor(E, tipo, a, b), gob = Ob.gobDe(E, dec); if (!gob) return 0;
      info = info || Ob.calcular(E, tipo, a, TIPOS[tipo].ab ? b : null);
      let p = 0.16 + 0.34 * Ob.afinidad(gob, J.partido) + 0.12 * (J.pop - 40) / 60 + 0.1 * clamp((info.imp - 0.8) / 2, 0, 1);
      const rcJ = E.esp.ccaa[J.region]; if (dec === 'E' && rcJ) p += (rcJ.relM - 45) / 300;
      if (dec === 'E' && E.paises.ES.ec.pde) p -= 0.15;
      if (dec !== 'E' && E.esp.ccaa[dec] && E.esp.ccaa[dec].deuda > 50) p -= 0.1;
      p -= 0.07 * Ob.activas(E, dec).length;
      return f2(clamp(p, 0.04, 0.88));
    },
    puedePedir(E, a) {
      a = a || {}; const J = E.jugador; if (!J || J.pais !== 'ES') return 'Las obras públicas sólo existen en España';
      const v = Ob.chequear(E, a.tipo, a.a, a.b); if (!v.ok) return v.motivo;
      if (Ob.competencia(E, a.tipo, a.a, a.b).owner) return 'Puedes ordenarla tú: no hace falta pedirla';
      const dec = Ob.decisor(E, a.tipo, a.a, a.b), gob = Ob.gobDe(E, dec);
      if (!gob) return `No hay gobierno ${enLugar(dec)} al que pedírsela`;
      if (J.cargo === 'presauto' && dec === J.region) return 'Puedes ordenarla tú: no hace falta pedirla';
      const cd = Ob.cooldown(E, a.tipo, a.a, a.b); if (cd) return `Ya la pediste hace poco: espera ${cd} semana${cd === 1 ? '' : 's'}`;
      const lim = Ob.limite(E, dec, v.info.coste); if (lim) return 'Ahora no la aceptará: ' + lim.charAt(0).toLowerCase() + lim.slice(1);
      return true;
    },
    /* Previsión para el panel: qué cuesta, cuánto tarda, quién la paga y qué cabe esperar. */
    prevision(E, tipo, a, b) {
      const v = Ob.chequear(E, tipo, a, b); if (!v.ok) return v;
      const T = TIPOS[tipo], info = v.info, comp = Ob.competencia(E, tipo, a, b), dec = Ob.decisor(E, tipo, a, b), owner = comp.owner || dec;
      const ef = Ob.efectos(E, { tipo, imp: info.imp, owner, provs: info.provs.map(q => [q.p, q.w]) });
      const r = { ok: true, info, T, ef, owner, ordena: !!comp.owner, motivoOrdenar: comp.owner ? Ob.limite(E, comp.owner, info.coste) : comp.motivo };
      if (!comp.owner) { r.pedir = Ob.puedePedir(E, { tipo, a, b }); r.prob = Ob.probPedir(E, tipo, a, b, info); r.decisor = dec; }
      return r;
    },

    /* ── Ciclo de vida ── */
    _crear(E, tipo, a, b, owner, quien) {
      const o = Ob.asegurar(E), info = Ob.calcular(E, tipo, a, TIPOS[tipo].ab ? b : null);
      const w = { id: 'o' + (o.seq++), tipo, a, b: TIPOS[tipo].ab ? b : null, owner, quien, t0: E.fecha.t, dur: info.sem, prog: 0, coste: info.coste, gast: 0, km: info.km, imp: info.imp, estado: 'curso', pausa: 0, acel: -99, provs: info.provs.map(q => [q.p, q.w]) };
      o.lista.push(w); o.ver++;
      const txt = `${Ob.dueno(E, owner, true)} ${quien === 'pedida' ? 'accede a la petición y ' : ''}anuncia ${Ob.descripcion(E, w)}: ${w.km ? w.km + ' km, ' : ''}${Ob.eur(w.coste)} y ${Ob.plazo(w.dur)} de obras.`;
      C.Noticias.poner(E, owner === 'E' ? 'gobierno' : 'politica', txt, 'ES', owner === 'E' ? 'central' : 'aut');
      if (quien !== 'ia') Ob.nota(E, txt);
      C.Bus.emit('obra:anunciada', { id: w.id, tipo, owner, quien });
      return w;
    },
    ordenar(E, a) {
      const r = Ob.puedeOrdenar(E, a); if (r !== true) return { ok: false, msg: r };
      const c = Ob.competencia(E, a.tipo, a.a, a.b), w = Ob._crear(E, a.tipo, a.a, a.b, c.owner, 'jug');
      C.Personaje.cambiar(E, { prestigio: 3, pop: 2 });
      Ob.limpiarConstructor(E, w.id);
      return { ok: true, msg: `Ordenas ${Ob.descripcion(E, w)}: ${Ob.eur(w.coste)} y ${Ob.plazo(w.dur)} de obras.`, id: w.id };
    },
    pedir(E, a) {
      const r = Ob.puedePedir(E, a); if (r !== true) return { ok: false, msg: r };
      const o = Ob.asegurar(E), J = E.jugador, v = Ob.chequear(E, a.tipo, a.a, a.b), dec = Ob.decisor(E, a.tipo, a.a, a.b);
      o.cd['p:' + a.tipo + ':' + a.a + ':' + (a.b || '')] = E.fecha.t;
      const p = Ob.probPedir(E, a.tipo, a.a, a.b, v.info), lim = Ob.limite(E, dec, v.info.coste), T = TIPOS[a.tipo];
      const desc = (T.ab ? `${T.art} ${T.nom} ${nombre(E, a.a)}–${nombre(E, a.b)}` : `${T.art} ${T.nom} de ${nombre(E, a.a)}`);
      if (lim || !U.chance(p)) {
        Ob.limpiarConstructor(E); C.Personaje.cambiar(E, { pop: -0.5 });
        return { ok: true, exito: false, msg: `${Ob.dueno(E, dec, true)} rechaza por ahora tu petición de ${desc}${lim ? ' (' + lim.charAt(0).toLowerCase() + lim.slice(1) + ')' : ''}.` };
      }
      const w = Ob._crear(E, a.tipo, a.a, a.b, dec, 'pedida');
      Ob.limpiarConstructor(E, w.id); C.Personaje.cambiar(E, { prestigio: 3, pop: 3 });
      const rc = E.esp.ccaa[J.region]; if (rc && v.info.provs.some(q => D().provincias[q.p][1] === J.region)) rc.agravio = clamp(rc.agravio - 0.2, 0, 100);
      return { ok: true, msg: `${Ob.dueno(E, dec, true)} accede: ${desc} se construirá (${Ob.eur(w.coste)}, ${Ob.plazo(w.dur)}).`, id: w.id };
    },
    cancelar(E, id) {
      const o = Ob.asegurar(E), w = o.lista.find(x => x.id === id);
      if (!w || w.estado !== 'curso') return { ok: false, msg: 'Esa obra no está en marcha' };
      if (w.quien !== 'jug') return { ok: false, msg: 'Sólo puedes cancelar las obras que has ordenado tú' };
      w.estado = 'cancelada'; o.ver++;
      const gob = Ob.gobDe(E, w.owner); if (gob) gob.aprob = clamp(gob.aprob - 0.5 * w.imp, 5, 90);
      for (const [c, pe] of Object.entries(Ob.efectos(E, w).regs)) { const rc = E.esp.ccaa[c]; if (rc) rc.agravio = clamp(rc.agravio + 0.5 * w.imp * pe, 0, 100); }
      C.Personaje.cambiar(E, { prestigio: -4, pop: -3 });
      const txt = `Se cancela ${Ob.descripcion(E, w)}${Ob.lug(w)} cuando llevaba un ${Math.round(w.prog * 100)} % (${Ob.eur(w.gast)} ya gastados).`;
      C.Noticias.poner(E, w.owner === 'E' ? 'gobierno' : 'politica', txt, 'ES', w.owner === 'E' ? 'central' : 'aut'); Ob.nota(E, txt);
      return { ok: true, msg: txt };
    },
    acelerar(E, id) {
      const o = Ob.asegurar(E), w = o.lista.find(x => x.id === id);
      if (!w || w.estado !== 'curso') return { ok: false, msg: 'Esa obra no está en marcha' };
      if (w.quien !== 'jug') return { ok: false, msg: 'Sólo puedes acelerar las obras que has ordenado tú' };
      if (E.fecha.t - w.acel < 8) return { ok: false, msg: `Ya aceleraste esta obra: espera ${8 - (E.fecha.t - w.acel)} semana(s)` };
      w.prog = Math.min(0.995, w.prog + 0.08); w.pausa = 0; w.coste = Math.round(w.coste * 1.05 / 5) * 5; w.acel = E.fecha.t; o.ver++;
      return { ok: true, msg: `Aceleras ${Ob.descripcion(E, w)} (+8 % de avance, 5 % más cara): lleva el ${Math.round(w.prog * 100)} %.` };
    },
    /* Cierra el constructor del mapa (y, si se da la obra, la deja seleccionada). */
    limpiarConstructor(E, id) { const m = E.ui && E.ui.mapa; if (!m) return; m.obra = null; if (id) m.sel = { t: 'obra', id }; },

    /* Gasto de la semana: déficit del Estado o deuda de la comunidad. */
    _pagar(E, w, gasto) {
      if (w.owner === 'E') { const pib = E.paises.ES.ec.pib || 1600; C.Economia.aplicar(E, 'ES', { deficit: gasto * 52 / (pib * 1000) * 100 * 0.0045 * ESCALA }); return; }
      const rc = E.esp.ccaa[w.owner]; if (!rc) return;
      const tot = U.suma(Object.values(D().ccaa).map(c => c.pob)) || 47, pibReg = (E.paises.ES.ec.pib || 1600) * (D().ccaa[w.owner].pob / tot);
      rc.deuda = clamp(rc.deuda + gasto / (pibReg * 1000) * 100 * ESCALA, 0, 200);
    },
    _incidente(E, w) {
      const mio = w.quien === 'jug' || w.quien === 'pedida', r = U.r(); let txt;
      if (r < 0.4) { const extra = Math.max(2, Math.round(w.dur * clamp(U.gauss(0.07, 0.03), 0.02, 0.15))); w.dur += extra; txt = `se retrasa unas ${extra} semanas por las expropiaciones y la licitación`; }
      else if (r < 0.75) { const k = 1 + clamp(U.gauss(0.08, 0.04), 0.02, 0.2); w.coste = Math.round(w.coste * k / 5) * 5; txt = `sufre un sobrecoste del ${Math.round((k - 1) * 100)} %`; }
      else { w.pausa = 6 + Math.floor(U.r() * 6); txt = `queda paralizada unas ${w.pausa} semanas por un hallazgo arqueológico`; }
      if (mio) { const t = `${Ob.descripcion(E, w)}${Ob.lug(w)} ${txt}.`; C.Noticias.poner(E, w.owner === 'E' ? 'gobierno' : 'politica', t.charAt(0).toUpperCase() + t.slice(1), 'ES', w.owner === 'E' ? 'central' : 'aut'); }
    },
    _terminar(E, o, w) {
      w.estado = 'hecha'; w.t1 = E.fecha.t; w.prog = 1; w.gast = w.coste; o.ver++;
      const ef = Ob.efectos(E, w), gob = Ob.gobDe(E, w.owner), T = TIPOS[w.tipo];
      if (gob) {
        gob.aprob = clamp(gob.aprob + ef.aprob, 5, 90);
        const ben = [[gob.partido, 1]].concat((gob.coalicion || []).filter(k => k !== gob.partido).map(k => [k, 0.4]));
        for (const [p, pe] of w.provs) for (const [pid, sh] of ben) { if (!E.partidos[pid]) continue; const bp = o.bonus[p] = o.bonus[p] || {}; bp[pid] = Math.min(1.1, (bp[pid] || 1) * (1 + ef.voto * pe * sh)); }
      }
      for (const c in ef.regs) { const rc = E.esp.ccaa[c]; if (!rc) continue; rc.agravio = clamp(rc.agravio - ef.agravio * ef.regs[c], 0, 100); if (w.owner === 'E') rc.relM = clamp(rc.relM + ef.relM * ef.regs[c], 0, 100); }
      if (Object.keys(ef.ec).length) C.Economia.aplicar(E, 'ES', ef.ec);
      if (!T.ab) { const n = Ob.nivel(E, w.a, w.tipo); (o.niv[w.a] = o.niv[w.a] || {})[w.tipo] = n + 1; }
      if (w.quien === 'jug' || w.quien === 'pedida') C.Personaje.cambiar(E, { prestigio: 4 + 3 * w.imp, pop: 3 + 2 * w.imp });
      const txt = `Se inaugura ${Ob.descripcion(E, w)}${Ob.lug(w)}${w.km ? ' (' + w.km + ' km)' : ''}: ${Ob.eur(w.coste)} y ${Ob.plazo(E.fecha.t - w.t0)} de obras.`;
      C.Noticias.poner(E, w.owner === 'E' ? 'gobierno' : 'politica', txt, 'ES', w.owner === 'E' ? 'central' : 'aut');
      if (w.quien === 'jug' || w.quien === 'pedida') Ob.nota(E, txt);
      C.Bus.emit('obra:inaugurada', { id: w.id, tipo: w.tipo, owner: w.owner, quien: w.quien, texto: txt });
    },
    _avanzar(E, o, w) {
      if (w.pausa > 0) { w.pausa--; return; }
      const paso = 1 / w.dur, gasto = w.coste * paso;
      Ob._pagar(E, w, gasto); w.prog = Math.min(1, w.prog + paso); w.gast = Math.min(w.coste, w.gast + gasto);
      if (w.prog < 1 && U.chance(1 / 240)) Ob._incidente(E, w);
      if (w.prog >= 1) Ob._terminar(E, o, w);
    },

    /* ── Administraciones que no controla el jugador: también anuncian obras ── */
    _candidata(E, owner) {
      const ids = Object.keys(E.esp.muni.m).filter(id => ciu(id) && (owner === 'E' || mun(E, id).ccaa === owner)); if (!ids.length) return null;
      const tipos = owner === 'E' ? ['autovia', 'autovia', 'ave', 'electrica', 'aeropuerto', 'solar'] : ['hospital', 'hospital', 'campus', 'solar', 'autovia'];
      const w = ids.map(id => Math.sqrt(pobDe(E, id))), W = U.suma(w);
      for (let i = 0; i < 14; i++) {
        const tipo = U.pick(tipos), T = TIPOS[tipo]; let r = U.r() * W, k = 0; for (; k < ids.length - 1 && r > w[k]; k++) r -= w[k]; const a = ids[k]; let b = null;
        if (T.ab) { const cerca = ids.filter(x => x !== a).sort((p, q) => km(a, p) - km(a, q)).slice(0, 7); if (!cerca.length) continue; b = U.pick(cerca); }
        if (owner === 'E' && T.amb === 'reg' && !['CEU', 'MEL'].includes(mun(E, a).ccaa)) continue;
        const v = Ob.chequear(E, tipo, a, b); if (!v.ok) continue;
        if (Ob.limite(E, owner, v.info.coste)) return null;
        return { tipo, a, b };
      }
      return null;
    },
    _ia(E, o) {
      if (E.fecha.t % 4 !== 1) return;
      const J = E.jugador, estatal = J && J.pais === 'ES' && (J.cargo === 'pm' || J.cargo === 'vicepres');
      const prueba = owner => { const c = Ob._candidata(E, owner); if (c) Ob._crear(E, c.tipo, c.a, c.b, owner, 'ia'); };
      if (!estatal && Ob.activas(E, 'E').length < 3 && U.chance(0.11)) prueba('E');
      for (const c of C.Territorio.ids()) { if (J && J.cargo === 'presauto' && J.region === c) continue; if (!Ob.activas(E, c).length && U.chance(0.012)) prueba(c); }
    },
    turno(E) {
      if (!G() || !E.esp || !E.esp.muni || !E.esp.muni.m) return;   // sin la geometría del mapa (data/mapa-es.js) no hay obras
      const o = Ob.asegurar(E);
      for (const w of o.lista) if (w.estado === 'curso') Ob._avanzar(E, o, w);
      // El recuerdo de las inauguraciones se diluye en unos dos años
      for (const p in o.bonus) { const bp = o.bonus[p]; for (const k in bp) { bp[k] = 1 + (bp[k] - 1) * 0.9937; if (Math.abs(bp[k] - 1) < 0.0008) delete bp[k]; } if (!Object.keys(bp).length) delete o.bonus[p]; }
      Ob._ia(E, o);
    },

    /* ── Consultas para la interfaz ── */
    visibles(E) { return Ob.asegurar(E).lista.filter(w => w.estado !== 'cancelada'); },
    deLaCiudad(E, id) { return Ob.visibles(E).filter(w => w.a === id || w.b === id); },
    porProv(E) {
      const o = Ob.asegurar(E), clave = E.fecha.t + ':' + o.ver + ':' + o.lista.length;
      if (Ob._memo && Ob._memo.E === E && Ob._memo.clave === clave) return Ob._memo.v;
      const v = {}; for (const p in D().provincias) v[p] = { inv: 0, autovia: 0, ave: 0, electrica: 0, puntos: 0, curso: 0 };
      for (const w of o.lista) {
        if (w.estado === 'cancelada') continue; const f = w.estado === 'hecha' ? 1 : w.prog, tot = w.provs.reduce((s, q) => s + q[1], 0) || 1;
        for (const [p, pe] of w.provs) { const x = v[p]; if (!x) continue; x.inv += w.coste * f * pe / tot; if (TIPOS[w.tipo].ab) x[w.tipo]++; else x.puntos++; if (w.estado === 'curso') x.curso++; }
      }
      for (const p in v) v[p].eurHab = v[p].inv * 1000 / Math.max(50, D().provincias[p][3]);
      Ob._memo = { E, clave, v }; return v;
    },
    /* Propuestas para el jugador: las obras más rentables (importancia por coste) que puede ordenar o, si su cargo no ordena obras, pedir para su comunidad. */
    sugerencias(E, n) {
      /* Con su propio generador (fijo en cada semana): dibujar el panel no consume el azar de la partida y las propuestas no cambian al redibujarlo. */
      let sd = (E.fecha.t * 1009 + Ob.asegurar(E).lista.length * 31) | 0; const r = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }, pick = arr => arr[Math.floor(r() * arr.length)];
      n = n || 3; const J = E.jugador, aut = Ob.autoridad(E), modo = aut.tipos.length ? 'lanzar' : 'pedir', out = [], vistos = new Set();
      const ids = Object.keys(E.esp.muni.m).filter(id => ciu(id)).filter(id => aut.nivel === 'comunidad' ? mun(E, id).ccaa === aut.owner : modo === 'pedir' && J.region ? mun(E, id).ccaa === J.region : true);
      if (!ids.length) return out;
      const tipos = modo === 'lanzar' ? aut.tipos : ORDEN;
      for (let i = 0; i < 90 && out.length < 40; i++) {
        const tipo = pick(tipos), T = TIPOS[tipo], a = pick(ids); let b = null;
        if (T.ab) { const cerca = ids.filter(x => x !== a).sort((p, q) => km(a, p) - km(a, q)).slice(0, 6); if (!cerca.length) continue; b = pick(cerca); }
        const k = tipo + a + (b || ''); if (vistos.has(k)) continue; vistos.add(k);
        const v = Ob.chequear(E, tipo, a, b); if (!v.ok) continue;
        if ((modo === 'lanzar' ? Ob.puedeOrdenar(E, { tipo, a, b }) : Ob.puedePedir(E, { tipo, a, b })) !== true) continue;
        out.push({ tipo, a, b, modo, imp: v.info.imp, coste: v.info.coste, km: v.info.km, sem: v.info.sem, puntua: v.info.imp / Math.pow(v.info.coste / 1000 + 0.3, 0.4) });
      }
      out.sort((x, y) => y.puntua - x.puntua);
      const res = [], usados = new Set();
      for (const s of out) { if (!usados.has(s.tipo)) { usados.add(s.tipo); res.push(s); if (res.length >= n) break; } }
      for (const s of out) { if (res.length >= n) break; if (!res.includes(s)) res.push(s); }
      return res;
    },
    /* Para el piloto automático y las pruebas: una obra válida al azar que el jugador pueda ordenar (modo 'lanzar') o pedir (modo 'pedir'). */
    aleatoria(E, modo) {
      const ids = Object.keys(E.esp.muni.m).filter(id => ciu(id));
      for (let i = 0; i < 40; i++) {
        const tipo = U.pick(ORDEN), a = U.pick(ids), b = TIPOS[tipo].ab ? U.pick(ids) : null, args = { tipo, a, b };
        if ((modo === 'pedir' ? Ob.puedePedir(E, args) : Ob.puedeOrdenar(E, args)) === true) return args;
      }
      return null;
    }
  };

  /* ── Acciones (sólo desde el mapa: pertenecen al grupo «mapa», que la Agenda no lista) ── */
  const R = (id, nombre, icono, desc, costo, disp, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo: 'mapa', disponible: disp, ejecutar });
  R('obra_lanzar', 'Ordenar una obra', '🏗', 'Desde la capa «Obras» del mapa: eliges el tipo, el origen y el destino.', 2, (E, a) => Ob.puedeOrdenar(E, a), (E, a) => Ob.ordenar(E, a));
  R('obra_pedir', 'Pedir una obra', '🙏', 'Pides a la administración competente que la construya: depende de la afinidad y de tu popularidad.', 1, (E, a) => Ob.puedePedir(E, a), (E, a) => Ob.pedir(E, a));
  R('obra_cancelar', 'Cancelar una obra', '🛑', 'Paras una obra que ordenaste: pierdes lo gastado y el agravio sube.', 1, (E, a) => { const w = Ob.asegurar(E).lista.find(x => x.id === (a && a.id)); return !w || w.estado !== 'curso' ? 'Esa obra no está en marcha' : w.quien !== 'jug' ? 'Sólo puedes cancelar las obras que has ordenado tú' : true; }, (E, a) => Ob.cancelar(E, a && a.id));
  R('obra_acelerar', 'Acelerar una obra', '⏩', 'Más avance (+8 %) a cambio de un 5 % más de coste; una vez cada 8 semanas.', 2, (E, a) => { const w = Ob.asegurar(E).lista.find(x => x.id === (a && a.id)); return !w || w.estado !== 'curso' ? 'Esa obra no está en marcha' : w.quien !== 'jug' ? 'Sólo puedes acelerar las obras que has ordenado tú' : E.fecha.t - w.acel < 8 ? 'Ya la aceleraste hace poco' : true; }, (E, a) => Ob.acelerar(E, a && a.id));

  C.Tiempo.registrar('obras', { turno: Ob.turno }, 42);
})(window.ESP);

/* Campaña electoral (generales y autonómicas): presupuesto y topes de gasto, esfuerzo por provincias, encuestas con ruido (CIS, prensa, propias y sondeo a pie
   de urna), debate decisivo, voto útil, movilización, coaliciones preelectorales, sucesos de campaña, asesor semanal y campaña automática.
   Contexto de campaña: E.esp.camp (generales) y E.esp.campA[ccaa] (autonómicas), con camp.ambito = 'gen' | 'aut'. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const afin = (E, a, b) => 1 - U.distIdeo(E.partidos[a], E.partidos[b]);
  const SEM_LISTAS = 3;                       // las listas se cierran tres semanas antes de las urnas
  const CANALES = {
    tv: { n: 'Televisión y radio', icono: '📺', coste: 6, pts: 5, d: 'Llega a todo el territorio: mejora tu voto en todas las provincias.' },
    redes: { n: 'Redes y publicidad digital', icono: '📱', coste: 3, pts: 3.2, d: 'Barato y rápido; algo menos efectivo en el voto mayor.' },
    cartel: { n: 'Carteles, mailing y actos', icono: '🪧', coste: 4, pts: 3.6, d: 'Presencia en la calle en todo el territorio.' },
    territorio: { n: 'Aparato local de una provincia', icono: '🏘️', coste: 2.5, pts: 4, prov: true, d: 'Interventores, voluntarios y mítines en una provincia concreta.' }
  };
  const ENCUESTAS = { propia: { n: 'Encuesta propia del partido', coste: 3, sd: 0.6, d: 'La más precisa: te dice cómo vas provincia a provincia.' }, prensa: { n: 'Sondeo de un medio', coste: 0, sd: 1.1, d: 'Gratis, pero con el sesgo del periódico.' } };

  // Ruido determinista a partir de una cadena (la misma consulta da el mismo resultado esa semana)
  const hash = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const gaussSeed = s => { const r = hash(s); const a = Math.max(1e-9, r()), b = r(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); };
  const provincias = c => C.Es.provinciasDe(c);

  const Ca = C.Campana = {
    CANALES, ENCUESTAS, SEM_LISTAS, TOPE: 90,

    /* ── Contexto ── */
    camps(E) {
      const out = [], g = E.esp.camp; if (g && g.activa) out.push({ key: 'gen', camp: g });
      const A = E.esp.campA || {}; for (const c in A) if (A[c].activa) out.push({ key: c, camp: A[c] });
      return out;
    },
    cur(E) { const l = Ca.camps(E); if (!l.length) return null; const k = E.ui && E.ui.campScope; return (l.find(x => x.key === k) || l[0]).camp; },
    activa(E) { return !!Ca.cur(E); },
    semanasHasta(E, camp) { camp = camp || Ca.cur(E); return camp ? Math.max(0, camp.tVoto - E.fecha.t) : 0; },
    listasAbiertas(E, camp) { camp = camp || Ca.cur(E); return !camp || !camp.activa || camp.tVoto - E.fecha.t > SEM_LISTAS; },
    tope(camp) { return camp.tope; },
    peso(E, camp) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return false; camp = camp || Ca.cur(E);
      if (['lider', 'direccion'].includes(J.rol)) return true;
      return !!(camp && camp.ambito === 'aut' && E.esp.ccaa[camp.c].cab[J.partido] === 'J');
    },
    nombre(E, camp) { return camp.ambito === 'gen' ? 'las generales' : 'las autonómicas de ' + D().ccaa[camp.c].nombre; },
    /* Territorios de la campaña: las 52 provincias o las de la comunidad. */
    territorios(camp) { return camp.ambito === 'gen' ? Object.keys(D().provincias) : provincias(camp.c); },
    pop(id) { return D().provincias[id][3]; },

    /* ── Apertura ── */
    nueva(E, o) {
      const P = E.paises.ES, J = E.jugador, pa = J && J.pais === 'ES' ? E.partidos[J.partido] : null, gen = o.ambito === 'gen';
      let tope = 90, total = pa ? Math.round(pa.finanzas * 1.1 + 12) : 0;
      if (!gen) { const pob = U.suma(provincias(o.c).map(id => D().provincias[id][3])); tope = Math.round(clamp(pob / 1000 * 1.5 + 5, 6, 30)); total = pa ? Math.round(clamp(pa.finanzas * 0.4 + 4, 4, tope * 0.9)) : 0; }
      const camp = { ambito: o.ambito, c: o.c || null, activa: true, t0: E.fecha.t, tVoto: o.tVoto, tope, escala: gen ? 1 : clamp(tope / 90 * 2.2, 0.3, 0.8), presup: { total, gastado: 0, credito: 0 }, focus: {}, nac: 0, mom: {}, movil: {}, util: {}, enc: [], sucesos: [], debate: { t: o.tVoto - (gen ? 3 : 2), hecho: false, res: null }, coal: null, sesgo: {}, base0: null };
      P.partidos.forEach(k => { camp.mom[k] = 0; camp.movil[k] = 0; camp.util[k] = 0; });
      camp.sesgo = { medio: U.pick(P.partidos.filter(k => E.partidos[k].amb === 'nac')), v: U.rf(0.4, 1.3) };
      return camp;
    },
    iniciar(E) {
      const camp = E.esp.camp = Ca.nueva(E, { ambito: 'gen', tVoto: E.esp.cortes.proxT });
      const r = Ca.encuesta(E, 'cis', camp); camp.base0 = Object.assign({}, r.votos);
      return camp;
    },
    iniciarAut(E, c) {
      E.esp.campA = E.esp.campA || {};
      const camp = E.esp.campA[c] = Ca.nueva(E, { ambito: 'aut', c, tVoto: E.esp.ccaa[c].parl.proxT });
      const r = Ca.encuesta(E, 'cis', camp); camp.base0 = Object.assign({}, r.votos);
      return camp;
    },

    /* ── Efecto de la campaña en el voto (determinista; el ruido se aplica antes) ── */
    efectoProv(pts, pob) { return 0.12 * (1 - Math.exp(-pts / (2.5 + pob / 350))); },
    /* Momentum, movilización y maquinaria de cada partido. */
    comunes(E, camp, v, share) {
      for (const k in v) {
        const pa = E.partidos[k];
        v[k] *= 1 + camp.mom[k] / Math.max(4, share ? share[k] : (pa.popN || pa.pop || 4));
        v[k] *= 1 + (camp.movil[k] || 0) * 0.02;
        v[k] *= 1 + (pa.finanzas - 60) / 60 * 0.012;
      }
    },
    /* Voto útil: los partidos sin opciones se desangran hacia los dos primeros. um = cuota por debajo de la cual hay fuga. */
    votoUtilAplica(E, camp, v, um) {
      const s = U.suma(Object.values(v)) || 1, sh = {}; for (const k in v) sh[k] = v[k] * 100 / s;
      const orden = Object.keys(sh).sort((a, b) => sh[b] - sh[a]), top = orden.slice(0, 2), u0 = Ca.fuerzaUtil(E);
      for (const k of orden.slice(2)) {
        if (sh[k] >= um) continue;
        const fuga = u0 * (1 - sh[k] / um) * v[k] * (E.partidos[k].amb === 'reg' ? 0.5 : 1);
        if (fuga <= 0) continue;
        const w = top.map(t => Math.max(0.05, afin(E, k, t)) * (1 + (camp.util[t] || 0)));
        const sw = U.suma(w); v[k] -= fuga; top.forEach((t, i) => v[t] += fuga * w[i] / sw);
      }
    },
    ajustarProv(E, id, v) {
      const camp = E.esp.camp; if (!camp || !camp.activa) return v;
      const J = E.jugador, d = D().provincias[id], n = d[2];
      Ca.comunes(E, camp, v);
      if (J && J.pais === 'ES' && v[J.partido] != null) {
        const f = camp.focus[id] || 0, nac = Math.min(2.6, camp.nac * 0.02), pa = E.partidos[J.partido];
        v[J.partido] *= 1 + Ca.efectoProv(f, d[3]) + nac / Math.max(4, pa.popN || pa.pop || 4);
      }
      if (n >= 2 && n <= 12) Ca.votoUtilAplica(E, camp, v, 100 / (n + 1) * 0.85);
      return v;
    },
    /* Elecciones autonómicas: v = voto de la comunidad (sin normalizar). */
    ajustarReg(E, c, v) {
      const camp = E.esp.campA && E.esp.campA[c]; if (!camp || !camp.activa) return v;
      const J = E.jugador, ps = provincias(c), totp = U.suma(ps.map(Ca.pop));
      const s0 = U.suma(Object.values(v)) || 1, share = {}; for (const k in v) share[k] = v[k] * 100 / s0;
      Ca.comunes(E, camp, v, share);
      if (J && J.pais === 'ES' && v[J.partido] != null) {
        let b = 0; ps.forEach(id => { b += Ca.pop(id) / totp * Ca.efectoProv(camp.focus[id] || 0, Ca.pop(id)); });
        v[J.partido] *= 1 + b + Math.min(2.6, camp.nac * 0.02) / Math.max(4, share[J.partido]);
      }
      Ca.votoUtilAplica(E, camp, v, D().ccaa[c].um * 2.2);
      return v;
    },
    /* Cuanto más reñida la pelea entre los dos primeros, más fuerte es el voto útil (0.06–0.22). */
    fuerzaUtil(E) {
      const P = E.paises.ES, o = P.partidos.map(k => E.partidos[k].popN || 0).sort((a, b) => b - a);
      return clamp(0.22 - Math.abs(o[0] - o[1]) * 0.012, 0.06, 0.22);
    },

    /* Coaliciones preelectorales: los votos de los socios se suman con una pequeña fuga. */
    fusionar(E, v, camp) {
      if (!camp || !camp.activa || !camp.coal) return null;
      const { a, b } = camp.coal; if (v[a] == null || v[b] == null) return null;
      const f = { a, b, va: v[a], vb: v[b] }; v[a] = (v[a] + v[b]) * 0.93; v[b] = 0; return f;
    },
    desfusionar(e, f) {
      if (!f) return;
      const tot = (e[f.a] || 0) + (e[f.b] || 0); if (!tot) return;
      let sa = Math.round(tot * f.va / (f.va + f.vb)); if (f.va > 0 && sa === 0 && tot > 0 && f.va >= f.vb) sa = 1;
      e[f.a] = sa; e[f.b] = tot - sa; if (!e[f.b]) delete e[f.b]; if (!e[f.a]) delete e[f.a];
    },

    /* ── Encuestas ── */
    simula(E, camp) { return camp.ambito === 'gen' ? C.Generales.simular(E, { ruido: 0, ruidoN: 0 }) : C.Territorio.simular(E, camp.c, { ruido: 0 }); },
    encuesta(E, tipo, camp) {
      camp = camp || Ca.cur(E);
      const P = E.paises.ES, gen = !camp || camp.ambito === 'gen';
      const cfg = ENCUESTAS[tipo] || { sd: tipo === 'cis' ? 1.7 : tipo === 'pie' ? 0.35 : 1.1 };
      const res = camp ? Ca.simula(E, camp) : C.Generales.simular(E, { ruido: 0, ruidoN: 0 }), nat = gen ? res.nat : res.votos, escR = gen ? res.esc : res.escanos, votos = {}, g = gen ? (P.gob && P.gob.partido) : (camp && E.esp.ccaa[camp.c].gob && E.esp.ccaa[camp.c].gob.partido);
      const totEsc = U.suma(Object.values(escR)) || 1;
      let sum = 0;
      for (const k of P.partidos) {
        if (nat[k] == null) continue;
        let x = nat[k] + U.gauss(0, cfg.sd * Math.sqrt(Math.max(0.3, nat[k]) / 14));
        if (tipo === 'cis') x += C.Organismos ? C.Organismos.sesgoCIS(E, k) : (k === g ? 0.8 : 0);
        if (tipo === 'prensa' && camp && camp.sesgo && camp.sesgo.medio === k) x += camp.sesgo.v;
        votos[k] = Math.max(0, x); sum += votos[k];
      }
      for (const k in votos) votos[k] = votos[k] * 100 / sum;
      const esc = {}; let se = 0;
      for (const k in votos) { esc[k] = Math.max(0, Math.round((escR[k] || 0) * (votos[k] / Math.max(0.1, nat[k])) ** 0.9 + U.gauss(0, (gen ? 2.5 : 1.2) * cfg.sd))); se += esc[k]; }
      if (se > 0) for (const k in esc) esc[k] = Math.round(esc[k] * totEsc / se);
      const r = { t: E.fecha.t, tipo, votos, esc, n: tipo === 'cis' ? 3000 : tipo === 'propia' ? 1800 : 1200, ambito: gen ? 'gen' : 'aut' };
      if (camp) { camp.enc.unshift(r); if (camp.enc.length > 30) camp.enc.length = 30; }
      if (gen) { E.esp.encs = E.esp.encs || []; E.esp.encs.unshift(r); if (E.esp.encs.length > 24) E.esp.encs.length = 24; }
      return r;
    },
    ultimaEncuesta(E, tipo, camp) { camp = camp || Ca.cur(E); const l = (camp ? camp.enc : E.esp.encs) || []; return l.find(x => !tipo || x.tipo === tipo) || null; },
    propiaReciente(E, camp) { camp = camp || Ca.cur(E); return !!(camp && camp.enc.some(x => x.tipo === 'propia' && E.fecha.t - x.t <= 2)); },

    /* ── Reparto D'Hondt: distancia hasta ganar o perder un escaño ── */
    margen(v, n, um, pid) {
      const elig = Object.keys(v).filter(k => v[k] >= um), q = [];
      elig.forEach(k => { for (let i = 1; i <= n + 1; i++) q.push({ k, q: v[k] / i }); });
      q.sort((a, b) => b.q - a.q);
      const mios = q.slice(0, n).filter(x => x.k === pid).length, qn = q[n - 1] ? q[n - 1].q : 0, vp = v[pid] || 0;
      const rival = q.slice(n).find(x => x.k !== pid);
      return { esc: mios, voto: vp, ganar: vp > 0 && elig.includes(pid) ? Math.max(0, qn / (vp / (mios + 1)) - 1) : 9, perder: mios > 0 && rival ? (vp / mios) / rival.q - 1 : null, lider: Object.keys(v).sort((a, b) => v[b] - v[a])[0] };
    },
    estima(E, v, camp, id, pid) {
      const sd = Ca.propiaReciente(E, camp) ? 0.03 : 0.07; v = Object.assign({}, v);
      if (v[pid] != null) v[pid] *= Math.exp(sd * gaussSeed(id + ':' + E.fecha.t + ':' + pid));
      const s = U.suma(Object.values(v)); for (const k in v) v[k] = v[k] * 100 / s; return v;
    },
    provInfo(E, id) {
      const J = E.jugador, d = D().provincias[id], camp = E.esp.camp, act = camp && camp.activa;
      let v = C.Es.votosProv(E, id, 0); if (act) v = Ca.ajustarProv(E, id, v);
      v = Ca.estima(E, v, camp, id, J.partido);
      const m = Ca.margen(v, d[2], E.esp.um != null ? E.esp.um : 3, J.partido);
      return Object.assign({ id, nombre: d[0], n: d[2], pob: d[3], esfuerzo: act ? camp.focus[id] || 0 : 0, disputa: Math.min(m.ganar, m.perder == null ? 9 : m.perder) }, m);
    },
    provincias(E) { return Object.keys(D().provincias).map(id => Ca.provInfo(E, id)); },
    /* Autonómicas: los territorios de la comunidad (peso y esfuerzo) y el margen global de tu partido. */
    territoriosAut(E, c) {
      const camp = E.esp.campA && E.esp.campA[c], ps = provincias(c), totp = U.suma(ps.map(Ca.pop));
      return ps.map(id => ({ id, nombre: D().provincias[id][0], pob: Ca.pop(id), peso: Ca.pop(id) / totp, esfuerzo: camp ? camp.focus[id] || 0 : 0 })).sort((a, b) => b.peso - a.peso);
    },
    regInfo(E, c) {
      const J = E.jugador, camp = E.esp.campA && E.esp.campA[c], d = D().ccaa[c];
      let v = C.Territorio.votosReg(E, c, 0); if (camp && camp.activa) v = Ca.ajustarReg(E, c, v);
      v = Ca.estima(E, v, camp, c, J.partido);
      const w = {}; for (const k in v) if (v[k] >= d.um) w[k] = v[k];
      return Object.assign({ n: d.esc, may: Math.floor(d.esc / 2) + 1, um: d.um }, Ca.margen(v, d.esc, d.um, J.partido));
    },

    /* ── Acciones del jugador (sobre la campaña activa) ── */
    enCurso(E) { const camp = Ca.cur(E); return camp ? { camp } : null; },
    gastar(E, canal, prov) {
      const camp = Ca.cur(E), J = E.jugador, cn = CANALES[canal]; if (!camp || !cn) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E, camp)) return { ok: false, msg: 'Necesitas peso en la dirección del partido para gestionar el presupuesto' };
      const coste = Math.round(cn.coste * camp.escala * 10) / 10, lib = camp.presup.total + camp.presup.credito - camp.presup.gastado;
      if (lib < coste) return { ok: false, msg: `Sin fondos: te quedan ${U.d1(lib)} M€ y esto cuesta ${coste}. Pide un crédito.` };
      if (cn.prov && !Ca.territorios(camp).includes(prov)) return { ok: false, msg: 'Elige una provincia' };
      camp.presup.gastado += coste;
      const pts = cn.pts * (0.85 + 0.3 * J.atrib.gestion / 10);
      if (cn.prov) camp.focus[prov] = (camp.focus[prov] || 0) + pts; else camp.nac += pts;
      return { ok: true, msg: `${cn.icono} ${cn.n}${cn.prov ? ' en ' + D().provincias[prov][0] : ''}: −${coste} M€.` };
    },
    coste(camp, canal) { return Math.round(CANALES[canal].coste * camp.escala * 10) / 10; },
    libre(camp) { return camp.presup.total + camp.presup.credito - camp.presup.gastado; },
    encargar(E, tipo) {
      const camp = Ca.cur(E), cfg = ENCUESTAS[tipo]; if (!camp || !cfg) return { ok: false, msg: 'No hay campaña en marcha' };
      const coste = Math.round(cfg.coste * camp.escala * 10) / 10;
      if (coste) { if (!Ca.peso(E, camp)) return { ok: false, msg: 'Necesitas peso en la dirección' }; if (Ca.libre(camp) < coste) return { ok: false, msg: 'Sin fondos' }; camp.presup.gastado += coste; }
      const r = Ca.encuesta(E, tipo, camp), top = Object.keys(r.votos).sort((a, b) => r.votos[b] - r.votos[a])[0];
      return { ok: true, msg: `${cfg.n}: ${E.partidos[top].sigla} lidera con el ${U.d1(r.votos[top])} %.` };
    },
    credito(E) {
      const camp = Ca.cur(E), pa = E.partidos[E.jugador.partido]; if (!camp) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E, camp)) return { ok: false, msg: 'Necesitas peso en la dirección' };
      const cant = Math.round(30 * camp.escala);
      if (camp.presup.credito >= cant * 2) return { ok: false, msg: 'Los bancos no te dan más crédito' };
      camp.presup.credito += cant; pa.finanzas = clamp(pa.finanzas - 5 * camp.escala - 1, 5, 99);
      return { ok: true, msg: `Obtienes un crédito de ${cant} M€: tendrás que devolverlo tras las elecciones (finanzas del partido a la baja).` };
    },
    movilizar(E) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E, camp)) return { ok: false, msg: 'Necesitas peso en la dirección' };
      const coste = Math.round(4 * camp.escala * 10) / 10; if (Ca.libre(camp) < coste) return { ok: false, msg: `Sin fondos (${coste} M€)` };
      camp.presup.gastado += coste; camp.movil[J.partido] = Math.min(3, camp.movil[J.partido] + 0.7 + J.atrib.carisma / 20);
      return { ok: true, msg: 'Campaña de movilización: tus votantes tienen más ganas de ir a votar.' };
    },
    votoUtil(E) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp) return { ok: false, msg: 'No hay campaña en marcha' };
      camp.util[J.partido] = Math.min(2, camp.util[J.partido] + 0.5 + J.atrib.oratoria / 25);
      return { ok: true, msg: 'Apelas al voto útil: los votantes dudosos de los partidos pequeños se acercan a ti, si eres de los dos primeros.' };
    },
    mitinProv(E, prov) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp || !Ca.territorios(camp).includes(prov)) return { ok: false, msg: 'Elige una provincia' };
      const x = (J.atrib.oratoria + J.atrib.carisma) / 20;
      camp.focus[prov] = (camp.focus[prov] || 0) + 2.2 + 3 * x; J.campania = J.campania || { pts: 0, mitines: 0 }; J.campania.mitines++;
      C.Personaje.cambiar(E, { pop: 0.5 });
      return { ok: true, msg: `Mitin multitudinario en ${D().provincias[prov][0]}.` };
    },
    pactarCoalicion(E, pid) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E, camp)) return { ok: false, msg: 'Sólo la dirección puede pactar una coalición' };
      if (!Ca.listasAbiertas(E, camp)) return { ok: false, msg: 'Las listas ya están cerradas' };
      if (camp.coal) return { ok: false, msg: 'Ya has pactado una coalición' };
      if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige un socio' };
      if (E.partidos[J.partido].amb === 'reg' && camp.ambito === 'gen') return { ok: false, msg: 'Tu partido regional no puede concurrir en coalición nacional' };
      const a = afin(E, J.partido, pid), p = clamp(a * 0.95 - 0.12 + J.prestigio / 300 + J.atrib.negociacion / 40, 0.05, 0.85);
      if (!U.chance(p)) return { ok: true, exito: false, msg: `${E.partidos[pid].sigla} rechaza concurrir en coalición contigo.` };
      camp.coal = { a: J.partido, b: pid };
      C.Noticias.poner(E, 'politica', `${E.partidos[J.partido].sigla} y ${E.partidos[pid].sigla} concurrirán en coalición a ${Ca.nombre(E, camp)}.`, 'ES');
      return { ok: true, msg: `Coalición preelectoral con ${E.partidos[pid].sigla}: sumáis votos (con una fuga del 7 %) y los escaños se reparten según el voto de cada uno.` };
    },
    /* Candidatos de coalición posibles. */
    socios(E, camp) {
      camp = camp || Ca.cur(E); const J = E.jugador, P = E.paises.ES;
      const pres = k => camp && camp.ambito === 'aut' ? (E.esp.ccaa[camp.c].parl.escanos[k] || 0) >= 2 : (E.partidos[k].popN || E.partidos[k].pop || 0) >= 0.8;
      return P.partidos.filter(k => k !== J.partido && pres(k)).map(k => ({ k, a: afin(E, J.partido, k), p: clamp(afin(E, J.partido, k) * 0.95 - 0.12 + J.prestigio / 300 + J.atrib.negociacion / 40, 0.05, 0.85) })).sort((a, b) => b.a - a.a).slice(0, 8);
    },

    /* ── Debate decisivo ── */
    participantes(E, camp) {
      camp = camp || Ca.cur(E);
      if (camp && camp.ambito === 'aut') { const e = E.esp.campA[camp.c]; const r = ((Ca.ultimaEncuesta(E, 'cis', camp) || {}).votos) || {}; return Object.keys(E.esp.ccaa[camp.c].parl.escanos).sort((a, b) => (r[b] || 0) - (r[a] || 0)).slice(0, 3); }
      return E.paises.ES.partidos.filter(k => E.partidos[k].amb === 'nac').sort((a, b) => (E.partidos[b].popN || 0) - (E.partidos[a].popN || 0)).slice(0, 4);
    },
    lideres(E, camp, k) {
      if (camp.ambito === 'aut') { const rc = E.esp.ccaa[camp.c]; if (rc.cab[k] === 'J') return E.politicos.J; return C.Territorio.cabeza(E, camp.c, k); }
      return E.politicos[E.partidos[k].lider];
    },
    debateJugador(E, camp) {
      camp = camp || Ca.cur(E); const J = E.jugador; if (!J || J.pais !== 'ES' || !camp) return false;
      if (!Ca.participantes(E, camp).includes(J.partido)) return false;
      return camp.ambito === 'aut' ? (E.esp.ccaa[camp.c].cab[J.partido] === 'J' || (E.partidos[J.partido].amb === 'reg' && E.partidos[J.partido].lider === 'J')) : E.partidos[J.partido].lider === 'J';
    },
    celebrarDebate(E, estrategia, camp) {
      camp = camp || Ca.cur(E) || E.esp.camp; const J = E.jugador, ps = Ca.participantes(E, camp), sc = {};
      for (const k of ps) {
        const l = Ca.lideres(E, camp, k);
        let s = ((l ? l.c : 55) / 100) + U.gauss(0, 0.22);
        if (J && l && l.id === 'J') {
          const o = J.atrib.oratoria / 10, ca = J.atrib.carisma / 10;
          s = 0.3 + (o + ca) / 2 * 0.5;
          if (estrategia === 'ataque') s += 0.1 + U.gauss(0, 0.45); else if (estrategia === 'propuestas') s += 0.1 + o * 0.15; else s += -0.04 + U.gauss(0, 0.1);
        }
        sc[k] = s;
      }
      const orden = ps.slice().sort((a, b) => sc[b] - sc[a]), efs = [0.9, 0.3, -0.2, -0.6];
      orden.forEach((k, i) => { camp.mom[k] += efs[i]; });
      camp.debate.hecho = true; camp.debate.res = orden;
      const ld = Ca.lideres(E, camp, orden[0]), lugar = camp.ambito === 'gen' ? '' : ' en ' + D().ccaa[camp.c].nombre;
      C.Noticias.poner(E, 'politica', `Debate decisivo${lugar}: ${ld ? ld.n : E.partidos[orden[0]].sigla} (${E.partidos[orden[0]].sigla}) se impone en el cara a cara; ${E.partidos[orden[ps.length - 1]].sigla} sale tocado.`, 'ES');
      camp.sucesos.unshift({ t: E.fecha.t, txt: `Debate: gana ${E.partidos[orden[0]].sigla}, pierde ${E.partidos[orden[ps.length - 1]].sigla}.` });
      if (J && Ca.debateJugador(E, camp)) { const pos = orden.indexOf(J.partido); C.Personaje.cambiar(E, { prestigio: [3, 1, -1, -2.5][pos], pop: [2, 0.8, -0.5, -1.5][pos] }, true); C.Personaje.log(E, `Debate decisivo${lugar}: quedas ${pos + 1}º.`); }
      E.esp.pendienteDebate = false;
      return orden;
    },

    /* ── Asesor: qué conviene hacer esta semana ── */
    consejos(E, camp) {
      camp = camp || Ca.cur(E); const J = E.jugador, out = [], peso = Ca.peso(E, camp), libre = Ca.libre(camp), sem = Ca.semanasHasta(E, camp);
      if (!camp) return out;
      const add = (icono, txt, accion, args, label, prio) => out.push({ icono, txt, accion, args, label, prio });
      if (E.esp.pendienteDebate) add('🎙', 'El debate te espera: elige tu estrategia.', null, null, null, 0);
      if (peso && !Ca.propiaReciente(E, camp) && libre >= Ca.coste(camp, 'redes') && ENCUESTAS.propia.coste * camp.escala <= libre) add('📊', 'Encarga una encuesta propia: sin ella estimas a ciegas (±7 %).', 'encargar_encuesta', { tipo: 'propia' }, 'Encargar', 1);
      if (camp.ambito === 'gen') {
        const ps = Ca.provincias(E).filter(p => p.ganar < 0.12 || (p.perder != null && p.perder < 0.12)).sort((a, b) => a.disputa - b.disputa).slice(0, 3);
        ps.forEach(p => { add('📣', `${p.nombre}: ${p.ganar < 0.12 ? 'un empujón te da un escaño más' : 'riesgo de perder un escaño'}.`, 'mitin_prov', { prov: p.id }, 'Mitin', 2); if (peso && libre >= Ca.coste(camp, 'territorio')) add('🏘️', `Refuerza el aparato local en ${p.nombre}.`, 'gasto_campana', { canal: 'territorio', prov: p.id }, 'Invertir', 3); });
      } else {
        const t = Ca.territoriosAut(E, camp.c)[0]; if (t && (camp.focus[t.id] || 0) < 6) add('📣', `${t.nombre} concentra el ${Math.round(t.peso * 100)} % del voto: haz un mitin allí.`, 'mitin_prov', { prov: t.id }, 'Mitin', 2);
        if (peso && libre >= Ca.coste(camp, 'tv')) add('📺', 'Una campaña en televisión autonómica llega a toda la comunidad.', 'gasto_campana', { canal: 'tv' }, 'Contratar', 3);
      }
      if (peso && (camp.movil[J.partido] || 0) < 1 && libre >= 4 * camp.escala) add('🗳️', 'Tus votantes están poco movilizados: lanza una campaña de movilización.', 'movilizar_votantes', {}, 'Movilizar', 4);
      const top = Object.keys((Ca.ultimaEncuesta(E, 'cis', camp) || { votos: {} }).votos).sort((a, b) => (Ca.ultimaEncuesta(E, 'cis', camp).votos[b]) - (Ca.ultimaEncuesta(E, 'cis', camp).votos[a])).slice(0, 2);
      if (top.includes(J.partido) && (camp.util[J.partido] || 0) < 0.8) add('🎯', 'Eres de los dos primeros: apela al voto útil para absorber a los indecisos de los pequeños.', 'apelar_voto_util', {}, 'Apelar', 4);
      if (peso && Ca.listasAbiertas(E, camp) && !camp.coal) { const s = Ca.socios(E, camp).find(x => x.p >= 0.5); if (s) add('🤝', `${E.partidos[s.k].sigla} aceptaría una coalición (${Math.round(s.p * 100)} %); las listas se cierran en ${Math.max(0, sem - SEM_LISTAS)} semanas.`, 'coalicion_pre', { pid: s.k }, 'Proponer', 5); }
      if (peso && libre < 3 * camp.escala) add('🏦', 'Te quedas sin fondos: un crédito te da margen.', 'credito_campana', {}, 'Pedir', 3);
      if (camp.presup.gastado > camp.tope * 0.85) add('⚠️', `Estás cerca del tope legal de gasto (${camp.tope} M€): superarlo te cuesta una multa.`, null, null, null, 0);
      if (!camp.debate.hecho) add('📺', `Debate en ${Math.max(0, camp.debate.t - E.fecha.t)} semana(s).`, null, null, null, 6);
      return out.sort((a, b) => a.prio - b.prio).slice(0, 7);
    },
    /* Campaña automática: reparte el presupuesto libre entre lo más rentable. */
    auto(E) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E, camp)) return { ok: false, msg: 'Sólo la dirección gestiona el presupuesto' };
      let n = 0; const hechos = [];
      const ped = () => ['tv', 'territorio', 'cartel', 'redes'];
      let ts = camp.ambito === 'gen' ? Ca.provincias(E).sort((a, b) => a.disputa - b.disputa).map(p => p.id) : Ca.territoriosAut(E, camp.c).map(t => t.id);
      if (!Ca.propiaReciente(E, camp) && Ca.libre(camp) > 8 * camp.escala) { const r = Ca.encargar(E, 'propia'); if (r.ok) { n++; hechos.push('encuesta propia'); } }
      if (Ca.libre(camp) >= Ca.coste(camp, 'tv') + 4 * camp.escala && camp.nac < 6) { if (Ca.gastar(E, 'tv').ok) { n++; hechos.push('televisión'); } }
      let i = 0; while (Ca.libre(camp) >= Ca.coste(camp, 'territorio') && i < 12 && ts.length) { const p = ts[i % Math.min(5, ts.length)]; if (!Ca.gastar(E, 'territorio', p).ok) break; i++; n++; }
      if (i) hechos.push(i + ' inversiones locales');
      if ((camp.movil[J.partido] || 0) < 0.7 && Ca.libre(camp) >= 4 * camp.escala) { if (Ca.movilizar(E).ok) { n++; hechos.push('movilización'); } }
      return n ? { ok: true, msg: 'Campaña automática: ' + hechos.join(', ') + '.' } : { ok: false, msg: 'No queda presupuesto que repartir.' };
    },

    /* ── Turno semanal ── */
    turnoCamp(E, camp) {
      const t = E.fecha.t, P = E.paises.ES;
      for (const k of P.partidos) camp.mom[k] = clamp(camp.mom[k] * 0.9 + U.gauss(0, 0.22), -4, 4);
      Ca.encuesta(E, 'cis', camp);
      if (!camp.debate.hecho && t >= camp.debate.t) { if (Ca.debateJugador(E, camp) && !E.meta.presim) E.esp.pendienteDebate = true; else Ca.celebrarDebate(E, null, camp); }
      if (U.chance(camp.ambito === 'gen' ? 0.22 : 0.15)) {
        const pool = camp.ambito === 'gen' ? P.partidos.filter(x => E.partidos[x].amb === 'nac') : Object.keys(E.esp.ccaa[camp.c].parl.escanos);
        const k = U.pick(pool.filter(x => !E.jugador || x !== E.jugador.partido)); if (!k) return;
        const T = [['sale a la luz una filtración sobre su financiación', -1.1], ['comete un tropiezo en un mitin viral', -0.7], ['recibe el apoyo de una figura muy popular', 0.8], ['cierra un acto multitudinario', 0.6], ['pierde a un candidato clave por un escándalo', -1.3]];
        const [txt, dv] = U.pick(T); camp.mom[k] = clamp(camp.mom[k] + dv, -4, 4);
        camp.sucesos.unshift({ t, txt: `${E.partidos[k].sigla} ${txt}.` }); if (camp.sucesos.length > 20) camp.sucesos.length = 20;
        C.Noticias.poner(E, 'politica', `Campaña${camp.ambito === 'aut' ? ' en ' + D().ccaa[camp.c].nombre : ''}: ${E.partidos[k].sigla} ${txt}.`, 'ES');
      }
    },
    turno(E) {
      const t = E.fecha.t, J = E.jugador;
      const g = E.esp.camp;
      if (g && g.activa) Ca.turnoCamp(E, g); else if (t % 4 === 0 && E.esp.cortes.estado === 'activa') Ca.encuesta(E, 'cis', null);
      // Campañas autonómicas: se abren ocho semanas antes de las urnas en la comunidad del jugador (o por la que concurre)
      if (J && J.pais === 'ES' && !E.meta.presim) {
        const regs = new Set([J.region]); if (J.aspira && J.aspira.nivel === 'autonomico' && J.aspira.region) regs.add(J.aspira.region);
        E.esp.campA = E.esp.campA || {};
        for (const c of regs) {
          const rc = c && E.esp.ccaa[c]; if (!rc || rc.suspendida || rc.inv) continue;
          const cp = E.esp.campA[c], falta = rc.parl.proxT - t;
          if ((!cp || !cp.activa) && falta > 0 && falta <= 8 && !(cp && cp.fin && t - cp.fin < 20)) Ca.iniciarAut(E, c);
        }
      }
      for (const c in (E.esp.campA || {})) { const cp = E.esp.campA[c]; if (cp.activa) Ca.turnoCamp(E, cp); }
    },

    /* Efecto de un suceso de campaña sobre tu partido (usado por los eventos). */
    mover(E, pid, dv, txt) { const camp = Ca.cur(E); if (!camp) return; camp.mom[pid] = clamp((camp.mom[pid] || 0) + dv, -4, 4); if (txt) { camp.sucesos.unshift({ t: E.fecha.t, txt }); if (camp.sucesos.length > 20) camp.sucesos.length = 20; } },

    /* ── Cierre: gasto, multas y datos de la noche electoral ── */
    cierre(E, res) { return Ca.cerrar(E, E.esp.camp, { votos: res.nat, esc: res.esc }, res.prov); },
    cierreAut(E, c, res) { const camp = E.esp.campA && E.esp.campA[c]; if (!camp || !camp.activa) return null; return Ca.cerrar(E, camp, { votos: res.votos, esc: res.escanos }, null); },
    cerrar(E, camp, r, prov) {
      const J = E.jugador, P = E.paises.ES; if (!camp) return null;
      const out = { sondeo: null, ajustados: [], gasto: camp.presup.gastado, tope: camp.tope, multa: false, ambito: camp.ambito, c: camp.c };
      const votos = {}; let s = 0;
      for (const k of P.partidos) { if (r.votos[k] == null) continue; votos[k] = Math.max(0, r.votos[k] + U.gauss(0, 0.3 * Math.sqrt(Math.max(0.3, r.votos[k]) / 14))); s += votos[k]; }
      for (const k in votos) votos[k] = votos[k] * 100 / s;
      const esc = {}; for (const k in votos) esc[k] = Math.max(0, Math.round((r.esc[k] || 0) + U.gauss(0, camp.ambito === 'gen' ? 2.2 : 1)));
      out.sondeo = { votos, esc };
      out.ultimaCIS = (camp.enc.find(x => x.tipo === 'cis') || {}).votos || null;
      if (J && J.pais === 'ES' && camp.ambito === 'gen' && prov) {
        const pid = J.partido;
        for (const id in prov) {
          const v = prov[id].votos, d = D().provincias[id], n = d[2], um = E.esp.um != null ? E.esp.um : 3;
          const elig = Object.keys(v).filter(k => v[k] >= um), q = [];
          elig.forEach(k => { for (let i = 1; i <= n + 1; i++) q.push({ k, q: v[k] / i }); }); q.sort((a, b) => b.q - a.q);
          const ult = q[n - 1], sig = q[n]; if (!ult || !sig) continue;
          if (ult.k === pid && Math.abs(ult.q - sig.q) / sig.q < 0.12) out.ajustados.push({ id, nombre: d[0], gana: true, pct: (ult.q / sig.q - 1) * 100, rival: sig.k });
          else if (sig.k === pid && Math.abs(ult.q - sig.q) / sig.q < 0.12) out.ajustados.push({ id, nombre: d[0], gana: false, pct: (ult.q / sig.q - 1) * 100, rival: ult.k });
        }
        out.ajustados.sort((a, b) => a.pct - b.pct); out.ajustados = out.ajustados.slice(0, 8);
      }
      if (J && J.pais === 'ES') {
        const pa = E.partidos[J.partido];
        if (camp.presup.gastado > camp.tope) { out.multa = true; C.Personaje.cambiar(E, { prestigio: -3 }, true); pa.finanzas = clamp(pa.finanzas - 8 * camp.escala - 2, 5, 99); C.Noticias.poner(E, 'politica', `El Tribunal de Cuentas multa a ${pa.sigla} por superar el tope de gasto de campaña.`, 'ES'); }
        if (camp.presup.credito) pa.finanzas = clamp(pa.finanzas - camp.presup.credito * 0.15, 5, 99);
        pa.finanzas = clamp(pa.finanzas - camp.presup.gastado * 0.12 * camp.escala + 6 * camp.escala, 5, 99);
      }
      camp.activa = false; camp.fin = E.fecha.t; if (camp.ambito === 'gen') E.esp.campPrev = { t: E.fecha.t, gastado: camp.presup.gastado, coal: camp.coal };
      E.esp.pendienteDebate = false;
      return out;
    }
  };
  C.Tiempo.registrar('campana', { turno: Ca.turno }, 9);
})(window.ESP);

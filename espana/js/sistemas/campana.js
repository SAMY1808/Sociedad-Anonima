/* Campaña electoral de las generales: presupuesto y topes de gasto, esfuerzo por provincias (el último escaño), encuestas con ruido (CIS, prensa,
   propias y sondeo a pie de urna), debate decisivo, voto útil, movilización, coaliciones preelectorales y sucesos de campaña. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const afin = (E, a, b) => 1 - U.distIdeo(E.partidos[a], E.partidos[b]);
  const SEM_LISTAS = 3;                       // las listas se cierran tres semanas antes de las urnas
  const TOPE = 90;                            // tope legal de gasto de campaña (M€)
  const CANALES = {
    tv: { n: 'Televisión y radio', icono: '📺', coste: 6, pts: 5, d: 'Llega a todo el país: mejora tu voto en todas las provincias.' },
    redes: { n: 'Redes y publicidad digital', icono: '📱', coste: 3, pts: 3.2, d: 'Barato y rápido; algo menos efectivo en el voto mayor.' },
    cartel: { n: 'Carteles, mailing y actos', icono: '🪧', coste: 4, pts: 3.6, d: 'Presencia en la calle en todo el territorio.' },
    territorio: { n: 'Aparato local de una provincia', icono: '🏘️', coste: 2.5, pts: 4, prov: true, d: 'Interventores, voluntarios y mítines en una provincia concreta.' }
  };
  const ENCUESTAS = { propia: { n: 'Encuesta propia del partido', coste: 3, sd: 0.6, d: 'La más precisa: te dice cómo vas provincia a provincia.' }, prensa: { n: 'Sondeo de un medio', coste: 0, sd: 1.1, d: 'Gratis, pero con el sesgo del periódico.' } };

  // Ruido determinista a partir de una cadena (para que la misma consulta dé el mismo resultado esa semana)
  const hash = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const gaussSeed = s => { const r = hash(s); const a = Math.max(1e-9, r()), b = r(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); };

  const Ca = C.Campana = {
    CANALES, ENCUESTAS, TOPE, SEM_LISTAS,

    activa(E) { return !!(E.esp && E.esp.camp && E.esp.camp.activa); },
    semanasHasta(E) { const c = E.esp.camp; return c ? Math.max(0, c.tVoto - E.fecha.t) : 0; },
    listasAbiertas(E) { const c = E.esp.camp; return !c || !c.activa || c.tVoto - E.fecha.t > SEM_LISTAS; },
    peso(E) { const J = E.jugador; return !!(J && J.pais === 'ES' && ['lider', 'direccion'].includes(J.rol)); },

    /* Se abre la campaña al disolverse las Cortes. */
    iniciar(E) {
      const P = E.paises.ES, J = E.jugador, c = E.esp.cortes, pa = J && J.pais === 'ES' ? E.partidos[J.partido] : null;
      const camp = E.esp.camp = { activa: true, t0: E.fecha.t, tVoto: c.proxT, presup: { total: pa ? Math.round(pa.finanzas * 1.1 + 12) : 0, gastado: 0, credito: 0 }, focus: {}, nac: 0, mom: {}, movil: {}, util: {}, enc: [], sucesos: [], debate: { t: c.proxT - 3, hecho: false, res: null }, coal: null, sesgo: {}, hechos: {} };
      P.partidos.forEach(k => { camp.mom[k] = 0; camp.movil[k] = 0; camp.util[k] = 0; });
      camp.sesgo = { medio: U.pick(P.partidos.filter(k => E.partidos[k].amb === 'nac')), v: U.rf(0.4, 1.3) };
      Ca.encuesta(E, 'cis');
      return camp;
    },

    /* ── Efecto de la campaña en el voto de una provincia (determinista; el ruido se aplica antes) ── */
    efectoProv(pts, pob) { return 0.12 * (1 - Math.exp(-pts / (2.5 + pob / 350))); },
    ajustarProv(E, id, v) {
      const camp = E.esp.camp; if (!camp || !camp.activa) return v;
      const J = E.jugador, d = D().provincias[id], P = E.paises.ES, n = d[2];
      for (const k in v) {
        const pa = E.partidos[k];
        v[k] *= 1 + camp.mom[k] / Math.max(4, pa.popN || pa.pop || 4);                  // momentum nacional (pp sobre la cuota)
        v[k] *= 1 + (camp.movil[k] || 0) * 0.02;                                           // movilización de los suyos
        v[k] *= 1 + (pa.finanzas - 60) / 60 * 0.012;                                       // la maquinaria económica del partido
      }
      if (J && J.pais === 'ES' && v[J.partido] != null) {
        const f = camp.focus[id] || 0, nac = Math.min(2.6, camp.nac * 0.02), pa = E.partidos[J.partido];
        v[J.partido] *= 1 + Ca.efectoProv(f, d[3]) + nac / Math.max(4, pa.popN || pa.pop || 4);
      }
      // Voto útil: quien no puede sacar escaño se desangra hacia los dos primeros
      const s = U.suma(Object.values(v)) || 1, sh = {}; for (const k in v) sh[k] = v[k] * 100 / s;
      const orden = Object.keys(sh).sort((a, b) => sh[b] - sh[a]), top = orden.slice(0, 2);
      if (n >= 2 && n <= 12) {
        const um = 100 / (n + 1) * 0.85, u0 = Ca.fuerzaUtil(E);
        for (const k of orden.slice(2)) {
          if (sh[k] >= um) continue;
          const fuga = u0 * (1 - sh[k] / um) * v[k] * (E.partidos[k].amb === 'reg' ? 0.5 : 1);
          if (fuga <= 0) continue;
          const w = top.map(t => Math.max(0.05, afin(E, k, t)) * (1 + (camp.util[t] || 0)));
          const sw = U.suma(w); v[k] -= fuga; top.forEach((t, i) => v[t] += fuga * w[i] / sw);
        }
      }
      return v;
    },
    /* Cuanto más reñida la pelea entre los dos primeros, más fuerte es el voto útil (0.06–0.22). */
    fuerzaUtil(E) {
      const P = E.paises.ES, o = P.partidos.map(k => E.partidos[k].popN || 0).sort((a, b) => b - a);
      return clamp(0.22 - Math.abs(o[0] - o[1]) * 0.012, 0.06, 0.22);
    },

    /* Coaliciones preelectorales: los votos de los socios se suman con una pequeña fuga. */
    fusionar(E, v) {
      const camp = E.esp.camp; if (!camp || !camp.activa || !camp.coal) return null;
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
    encuesta(E, tipo) {
      const P = E.paises.ES, camp = E.esp.camp, Gen = C.Generales;
      const cfg = ENCUESTAS[tipo] || { sd: tipo === 'cis' ? 1.7 : tipo === 'pie' ? 0.35 : 1.1 };
      const res = Gen.simular(E, { ruido: 0, ruidoN: 0 }), votos = {}, g = P.gob && P.gob.partido;
      let sum = 0;
      for (const k of P.partidos) {
        let x = res.nat[k] + U.gauss(0, cfg.sd * Math.sqrt(Math.max(0.3, res.nat[k]) / 14));
        if (tipo === 'cis' && k === g) x += 0.8;
        if (tipo === 'prensa' && camp && camp.sesgo && camp.sesgo.medio === k) x += camp.sesgo.v;
        votos[k] = Math.max(0, x); sum += votos[k];
      }
      for (const k in votos) votos[k] = votos[k] * 100 / sum;
      const esc = {}; let se = 0;
      for (const k of P.partidos) { esc[k] = Math.max(0, Math.round(res.esc[k] * (votos[k] / Math.max(0.1, res.nat[k])) ** 0.9 + U.gauss(0, 2.5 * cfg.sd))); se += esc[k]; }
      if (se > 0) for (const k in esc) esc[k] = Math.round(esc[k] * 350 / se);
      const r = { t: E.fecha.t, tipo, votos, esc, n: tipo === 'cis' ? 3000 : tipo === 'propia' ? 1800 : 1200 };
      if (camp) { camp.enc.unshift(r); if (camp.enc.length > 30) camp.enc.length = 30; }
      E.esp.encs = E.esp.encs || []; E.esp.encs.unshift(r); if (E.esp.encs.length > 24) E.esp.encs.length = 24;
      return r;
    },
    ultimaEncuesta(E, tipo) { const l = (E.esp.camp ? E.esp.camp.enc : E.esp.encs) || []; return l.find(x => !tipo || x.tipo === tipo) || null; },
    propiaReciente(E) { const camp = E.esp.camp; return !!(camp && camp.enc.some(x => x.tipo === 'propia' && E.fecha.t - x.t <= 2)); },

    /* ── Estado de cada provincia para tu partido: ¿qué distancia hay hasta ganar o perder un escaño? ── */
    provInfo(E, id) {
      const J = E.jugador, d = D().provincias[id], pid = J.partido, n = d[2];
      let v = C.Es.votosProv(E, id, 0);
      if (E.esp.camp && E.esp.camp.activa) v = Ca.ajustarProv(E, id, v);
      // Lo que tú percibes: ±7 % (±3 % con encuesta propia reciente)
      const sd = Ca.propiaReciente(E) ? 0.03 : 0.07;
      v = Object.assign({}, v); if (v[pid] != null) v[pid] *= Math.exp(sd * gaussSeed(id + ':' + E.fecha.t + ':' + pid));
      const s = U.suma(Object.values(v)); for (const k in v) v[k] = v[k] * 100 / s;
      const um = E.esp.um != null ? E.esp.um : 3, elig = Object.keys(v).filter(k => v[k] >= um);
      const q = []; elig.forEach(k => { for (let i = 1; i <= n + 1; i++) q.push({ k, q: v[k] / i }); });
      q.sort((a, b) => b.q - a.q);
      const premiados = q.slice(0, n), mios = premiados.filter(x => x.k === pid).length;
      const qn = q[n - 1] ? q[n - 1].q : 0, vp = v[pid] || 0;
      const noPrem = q.slice(n), rivalMax = noPrem.find(x => x.k !== pid);
      const ganar = vp > 0 && elig.includes(pid) ? Math.max(0, qn / (vp / (mios + 1)) - 1) : (vp > 0 ? 9 : 9);
      const perder = mios > 0 && rivalMax ? (vp / mios) / rivalMax.q - 1 : null;
      const gan = Object.keys(v).sort((a, b) => v[b] - v[a])[0];
      return { id, nombre: d[0], n, pob: d[3], esc: mios, voto: vp, ganar, perder, esfuerzo: (E.esp.camp && E.esp.camp.focus[id]) || 0, lider: gan, disputa: Math.min(ganar, perder == null ? 9 : perder) };
    },
    provincias(E) { return Object.keys(D().provincias).map(id => Ca.provInfo(E, id)); },

    /* ── Acciones del jugador ── */
    gastar(E, canal, prov) {
      const camp = E.esp.camp, J = E.jugador, cn = CANALES[canal]; if (!camp || !camp.activa || !cn) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E)) return { ok: false, msg: 'Necesitas peso en la dirección del partido para gestionar el presupuesto' };
      const lib = camp.presup.total + camp.presup.credito - camp.presup.gastado;
      if (lib < cn.coste) return { ok: false, msg: `Sin fondos: te quedan ${U.d1(lib)} M€ y esto cuesta ${cn.coste}. Pide un crédito.` };
      if (cn.prov && !D().provincias[prov]) return { ok: false, msg: 'Elige una provincia' };
      camp.presup.gastado += cn.coste;
      const pts = cn.pts * (0.85 + 0.3 * J.atrib.gestion / 10);
      if (cn.prov) camp.focus[prov] = (camp.focus[prov] || 0) + pts; else camp.nac += pts;
      return { ok: true, msg: `${cn.icono} ${cn.n}${cn.prov ? ' en ' + D().provincias[prov][0] : ''}: −${cn.coste} M€.` };
    },
    encargar(E, tipo) {
      const camp = E.esp.camp, cfg = ENCUESTAS[tipo]; if (!camp || !camp.activa || !cfg) return { ok: false, msg: 'No hay campaña en marcha' };
      if (cfg.coste) { if (!Ca.peso(E)) return { ok: false, msg: 'Necesitas peso en la dirección' }; if (camp.presup.total + camp.presup.credito - camp.presup.gastado < cfg.coste) return { ok: false, msg: 'Sin fondos' }; camp.presup.gastado += cfg.coste; }
      const r = Ca.encuesta(E, tipo); return { ok: true, msg: `${cfg.n}: ${E.partidos[E.paises.ES.partidos.slice().sort((a, b) => r.votos[b] - r.votos[a])[0]].sigla} lidera con el ${U.d1(Math.max(...Object.values(r.votos)))} %.` };
    },
    credito(E) {
      const camp = E.esp.camp, pa = E.partidos[E.jugador.partido]; if (!camp || !camp.activa) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E)) return { ok: false, msg: 'Necesitas peso en la dirección' };
      if (camp.presup.credito >= 60) return { ok: false, msg: 'Los bancos no te dan más crédito' };
      camp.presup.credito += 30; pa.finanzas = clamp(pa.finanzas - 5, 5, 99);
      return { ok: true, msg: 'Obtienes un crédito de 30 M€: tendrás que devolverlo tras las elecciones (finanzas del partido −5).' };
    },
    movilizar(E) {
      const camp = E.esp.camp, J = E.jugador; if (!camp || !camp.activa) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E)) return { ok: false, msg: 'Necesitas peso en la dirección' };
      if (camp.presup.total + camp.presup.credito - camp.presup.gastado < 4) return { ok: false, msg: 'Sin fondos (4 M€)' };
      camp.presup.gastado += 4; camp.movil[J.partido] = Math.min(3, camp.movil[J.partido] + 0.7 + J.atrib.carisma / 20);
      return { ok: true, msg: 'Campaña de movilización: tus votantes tienen más ganas de ir a votar.' };
    },
    votoUtil(E) {
      const camp = E.esp.camp, J = E.jugador; if (!camp || !camp.activa) return { ok: false, msg: 'No hay campaña en marcha' };
      camp.util[J.partido] = Math.min(2, camp.util[J.partido] + 0.5 + J.atrib.oratoria / 25);
      return { ok: true, msg: 'Apelas al voto útil: los votantes dudosos de los partidos pequeños se acercan a ti, si eres de los dos primeros.' };
    },
    mitinProv(E, prov) {
      const camp = E.esp.camp, J = E.jugador; if (!camp || !camp.activa || !D().provincias[prov]) return { ok: false, msg: 'Elige una provincia' };
      const x = (J.atrib.oratoria + J.atrib.carisma) / 20;
      camp.focus[prov] = (camp.focus[prov] || 0) + 2.2 + 3 * x; J.campania = J.campania || { pts: 0, mitines: 0 }; J.campania.mitines++;
      C.Personaje.cambiar(E, { pop: 0.5 });
      return { ok: true, msg: `Mitin multitudinario en ${D().provincias[prov][0]}.` };
    },
    pactarCoalicion(E, pid) {
      const camp = E.esp.camp, J = E.jugador; if (!camp || !camp.activa) return { ok: false, msg: 'No hay campaña en marcha' };
      if (!Ca.peso(E)) return { ok: false, msg: 'Sólo la dirección puede pactar una coalición' };
      if (!Ca.listasAbiertas(E)) return { ok: false, msg: 'Las listas ya están cerradas' };
      if (camp.coal) return { ok: false, msg: 'Ya has pactado una coalición' };
      if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige un socio' };
      const a = afin(E, J.partido, pid), p = clamp(a * 0.95 - 0.12 + J.prestigio / 300 + J.atrib.negociacion / 40, 0.05, 0.85);
      if (E.partidos[J.partido].amb === 'reg') return { ok: false, msg: 'Tu partido regional no puede concurrir en coalición nacional' };
      if (!U.chance(p)) return { ok: true, exito: false, msg: `${E.partidos[pid].sigla} rechaza concurrir en coalición contigo.` };
      camp.coal = { a: J.partido, b: pid };
      C.Noticias.poner(E, 'politica', `${E.partidos[J.partido].sigla} y ${E.partidos[pid].sigla} concurrirán en coalición a las generales.`, 'ES');
      return { ok: true, msg: `Coalición preelectoral con ${E.partidos[pid].sigla}: sumáis votos (con una fuga del 7 %) y los escaños se reparten según el voto de cada uno.` };
    },
    /* Candidatos de coalición posibles. */
    socios(E) {
      const J = E.jugador, P = E.paises.ES;
      return P.partidos.filter(k => k !== J.partido && (E.partidos[k].popN || E.partidos[k].pop || 0) >= 0.8).map(k => ({ k, a: afin(E, J.partido, k), p: clamp(afin(E, J.partido, k) * 0.95 - 0.12 + J.prestigio / 300 + J.atrib.negociacion / 40, 0.05, 0.85) })).sort((a, b) => b.a - a.a).slice(0, 8);
    },

    /* ── Debate decisivo ── */
    debateJugador(E) { const J = E.jugador, P = E.paises.ES; if (!J || J.pais !== 'ES') return false; const top = Ca.participantes(E); return top.includes(J.partido) && E.partidos[J.partido].lider === 'J'; },
    participantes(E) { return E.paises.ES.partidos.filter(k => E.partidos[k].amb === 'nac').sort((a, b) => (E.partidos[b].popN || 0) - (E.partidos[a].popN || 0)).slice(0, 4); },
    celebrarDebate(E, estrategia) {
      const camp = E.esp.camp, J = E.jugador, ps = Ca.participantes(E), sc = {};
      for (const k of ps) {
        const l = E.politicos[E.partidos[k].lider];
        let s = ((l ? l.c : 55) / 100) + U.gauss(0, 0.22);
        if (J && E.partidos[k].lider === 'J') {
          const o = J.atrib.oratoria / 10, ca = J.atrib.carisma / 10;
          s = 0.3 + (o + ca) / 2 * 0.5;
          if (estrategia === 'ataque') s += 0.1 + U.gauss(0, 0.45); else if (estrategia === 'propuestas') s += 0.1 + o * 0.15; else s += -0.04 + U.gauss(0, 0.1);
        }
        sc[k] = s;
      }
      const orden = ps.slice().sort((a, b) => sc[b] - sc[a]), efs = [0.9, 0.3, -0.2, -0.6];
      orden.forEach((k, i) => { camp.mom[k] += efs[i]; });
      camp.debate.hecho = true; camp.debate.res = orden;
      const g = E.politicos[E.partidos[orden[0]].lider];
      C.Noticias.poner(E, 'politica', `Debate decisivo: ${g ? g.n : E.partidos[orden[0]].sigla} (${E.partidos[orden[0]].sigla}) se impone en el cara a cara; ${E.partidos[orden[ps.length - 1]].sigla} sale tocado.`, 'ES');
      camp.sucesos.unshift({ t: E.fecha.t, txt: `Debate: gana ${E.partidos[orden[0]].sigla}, pierde ${E.partidos[orden[ps.length - 1]].sigla}.` });
      if (J && E.partidos[J.partido].lider === 'J') { const pos = orden.indexOf(J.partido); C.Personaje.cambiar(E, { prestigio: [3, 1, -1, -2.5][pos], pop: [2, 0.8, -0.5, -1.5][pos] }, true); C.Personaje.log(E, `Debate decisivo: quedas ${pos + 1}º.`); }
      E.esp.pendienteDebate = false;
      return orden;
    },

    /* ── Turno semanal ── */
    turno(E) {
      const camp = E.esp.camp, t = E.fecha.t, P = E.paises.ES;
      if (!camp || !camp.activa) { if (t % 4 === 0 && E.esp.cortes.estado === 'activa') Ca.encuesta(E, 'cis'); return; }
      for (const k of P.partidos) camp.mom[k] = clamp(camp.mom[k] * 0.9 + U.gauss(0, 0.22), -4, 4);
      if (t % 1 === 0) Ca.encuesta(E, 'cis');
      if (!camp.debate.hecho && t >= camp.debate.t) {
        if (Ca.debateJugador(E) && !E.meta.presim) E.esp.pendienteDebate = true; else Ca.celebrarDebate(E, null);
      }
      // Sucesos de campaña de otros partidos
      if (U.chance(0.22)) {
        const k = U.pick(P.partidos.filter(x => E.partidos[x].amb === 'nac' && (!E.jugador || x !== E.jugador.partido) ));
        const T = [['sale a la luz una filtración sobre su financiación', -1.1], ['comete un tropiezo en un mitin viral', -0.7], ['recibe el apoyo de una figura muy popular', 0.8], ['cierra un acto multitudinario', 0.6], ['pierde a un candidato clave por un escándalo', -1.3]];
        const [txt, dv] = U.pick(T); camp.mom[k] = clamp(camp.mom[k] + dv, -4, 4);
        camp.sucesos.unshift({ t, txt: `${E.partidos[k].sigla} ${txt}.` }); if (camp.sucesos.length > 20) camp.sucesos.length = 20;
        C.Noticias.poner(E, 'politica', `Campaña: ${E.partidos[k].sigla} ${txt}.`, 'ES');
      }
    },

    /* Efecto de un suceso de campaña sobre tu partido (usado por los eventos). */
    mover(E, pid, dv, txt) { const camp = E.esp.camp; if (!camp) return; camp.mom[pid] = clamp((camp.mom[pid] || 0) + dv, -4, 4); if (txt) { camp.sucesos.unshift({ t: E.fecha.t, txt }); if (camp.sucesos.length > 20) camp.sucesos.length = 20; } },

    /* ── Cierre: gasto, multas y datos de la noche electoral ── */
    cierre(E, res, previo) {
      const camp = E.esp.camp, J = E.jugador, P = E.paises.ES; if (!camp) return null;
      const out = { sondeo: null, ajustados: [], gasto: camp.presup.gastado, tope: TOPE, multa: false };
      // Sondeo a pie de urna: casi exacto
      const votos = {}; let s = 0;
      for (const k of P.partidos) { votos[k] = Math.max(0, res.nat[k] + U.gauss(0, 0.3 * Math.sqrt(Math.max(0.3, res.nat[k]) / 14))); s += votos[k]; }
      for (const k in votos) votos[k] = votos[k] * 100 / s;
      const esc = {}; for (const k of P.partidos) esc[k] = Math.max(0, Math.round((res.esc[k] || 0) + U.gauss(0, 2.2)));
      out.sondeo = { votos, esc };
      out.ultimaCIS = (camp.enc.find(x => x.tipo === 'cis') || {}).votos || null;
      if (J && J.pais === 'ES') {
        const pid = J.partido;
        for (const id in res.prov) {
          const pv = res.prov[id], d = D().provincias[id], v = pv.votos, n = d[2], um = E.esp.um != null ? E.esp.um : 3;
          const elig = Object.keys(v).filter(k => v[k] >= um), q = [];
          elig.forEach(k => { for (let i = 1; i <= n + 1; i++) q.push({ k, q: v[k] / i, i }); }); q.sort((a, b) => b.q - a.q);
          const ult = q[n - 1], sig = q[n]; if (!ult || !sig) continue;
          const mia = q.slice(0, n).filter(x => x.k === pid).length;
          // Margen en puntos de voto: diferencia entre el último escaño asignado y el primero no asignado
          const dif = (ult.q - sig.q) * (ult.k === pid ? 1 : 0) + 0;
          if (ult.k === pid && Math.abs(ult.q - sig.q) / sig.q < 0.12) out.ajustados.push({ id, nombre: d[0], gana: true, pct: (ult.q / sig.q - 1) * 100, rival: sig.k });
          else if (sig.k === pid && Math.abs(ult.q - sig.q) / sig.q < 0.12) out.ajustados.push({ id, nombre: d[0], gana: false, pct: (ult.q / sig.q - 1) * 100, rival: ult.k });
        }
        out.ajustados.sort((a, b) => a.pct - b.pct); out.ajustados = out.ajustados.slice(0, 8);
        // Cuentas de la campaña
        const pa = E.partidos[pid];
        if (camp.presup.gastado > TOPE) { out.multa = true; C.Personaje.cambiar(E, { prestigio: -3 }, true); pa.finanzas = clamp(pa.finanzas - 8, 5, 99); C.Noticias.poner(E, 'politica', `El Tribunal de Cuentas multa a ${pa.sigla} por superar el tope de gasto de campaña.`, 'ES'); }
        if (camp.presup.credito) pa.finanzas = clamp(pa.finanzas - camp.presup.credito * 0.15, 5, 99);
        pa.finanzas = clamp(pa.finanzas - camp.presup.gastado * 0.12 + 6, 5, 99);
      }
      camp.activa = false; camp.fin = E.fecha.t; E.esp.campPrev = { t: E.fecha.t, gastado: camp.presup.gastado, coal: camp.coal };
      E.esp.pendienteDebate = false;
      return out;
    }
  };
  C.Tiempo.registrar('campana', { turno: Ca.turno }, 9);
})(window.ESP);

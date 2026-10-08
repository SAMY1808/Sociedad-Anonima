/* Gobierno de España: investidura con pactos y vetos, constitución de las Cortes, moción de censura,
   disolución anticipada, reparto de ministerios, estabilidad de la coalición y cumplimiento de pactos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const MAYORIA = 176;

  const Ej = {
    P: E => E.paises.ES,
    esc: (E, pid) => E.paises.ES.escanos[pid] || 0,
    sig: (E, pid) => E.partidos[pid].sigla,
    id: (E, sigla) => 'ES_' + sigla,

    /* ── Vetos y afinidad ── */
    vetaA(E, p, q) { const v = D().vetos[Ej.sig(E, p)]; return !!v && v.includes(Ej.sig(E, q)); },

    afinidad(E, cand, p) {
      const c = E.partidos[cand], q = E.partidos[p];
      return U.clamp(1.12 - 2.4 * U.distIdeo(c, q), 0, 1);
    },

    /* Postura de un partido ante un candidato y un bloque dados. */
    postura(E, p, cand, bloque, aceptadas) {
      if (p === cand || bloque.includes(p)) return 'si';
      const J = E.jugador;
      if (E.esp.votoJ && J && p === J.partido && J.rol === 'lider') return E.esp.votoJ;           // el jugador decide el voto de su grupo
      if (bloque.some(q => Ej.vetaA(E, p, q))) return 'no';
      const aff = Ej.afinidad(E, cand, p), perf = D().perfilSocios[Ej.sig(E, p)] || { req: [] };
      const acc = aceptadas[p] || [];
      if (aff >= 0.62) return 'si';
      if (perf.req.length && perf.req.every(d => acc.includes(d)) && aff >= 0.1) return 'si';
      if (aff >= 0.33) return 'abs';
      return 'no';
    },

    /* Resultado de una investidura (o moción) con el plan dado. */
    evaluar(E, cand, plan) {
      const P = Ej.P(E), est = {}; let si = 0, no = 0, abs = 0;
      for (const p of P.partidos) {
        const n = P.escanos[p] || 0; if (!n) continue;
        const s = Ej.postura(E, p, cand, plan.bloque, plan.aceptadas);
        est[p] = s;
        if (s === 'si') si += n; else if (s === 'no') no += n; else abs += n;
      }
      return { est, si, no, abs, exito1: si >= MAYORIA, exito2: si > no };
    },

    /* La IA arma el bloque más barato que le permite ganar. conExt: acepta a la extrema derecha. */
    armar(E, cand, conExt) {
      const P = Ej.P(E), c = E.partidos[cand];
      const plan = { cand, bloque: [cand], aceptadas: {}, coste: 0 };
      const socios = P.partidos.filter(p => p !== cand && (P.escanos[p] || 0) > 0).sort((a, b) => P.escanos[b] - P.escanos[a]);
      const ok = p => !plan.bloque.some(q => Ej.vetaA(E, p, q) || Ej.vetaA(E, q, p));
      // Fase 1: aliados naturales
      for (const p of socios) {
        if (!conExt && Ej.sig(E, p) === 'VAP') continue;
        if (!ok(p)) continue;
        if (Ej.postura(E, p, cand, plan.bloque, plan.aceptadas) === 'si') plan.bloque.push(p);
      }
      // Fase 2: socios que exigen contrapartidas, de más a menos escaños por coste
      const pagables = socios.filter(p => !plan.bloque.includes(p) && (conExt || Ej.sig(E, p) !== 'VAP')).map(p => {
        const perf = D().perfilSocios[Ej.sig(E, p)] || { req: [] };
        const tabu = perf.req.some(d => D().demandas[d].tabu(c));
        const coste = U.suma(perf.req.map(d => D().demandas[d].coste)) + 1;
        return { p, perf, tabu, coste, rend: (P.escanos[p] || 0) / coste };
      }).filter(x => !x.tabu && x.perf.req.length && Ej.afinidad(E, cand, x.p) >= 0.1).sort((a, b) => b.rend - a.rend);
      for (const x of pagables) {
        const ev = Ej.evaluar(E, cand, plan);
        if (ev.exito1) break;
        if (!ok(x.p)) continue;
        plan.aceptadas[x.p] = x.perf.req.slice();
        if (Ej.postura(E, x.p, cand, plan.bloque.concat([x.p]), plan.aceptadas) === 'si') { plan.bloque.push(x.p); plan.coste += x.coste; }
        else delete plan.aceptadas[x.p];
      }
      // Fase 3: completar con los que aún den la mayoría simple en segunda votación
      plan.ev = Ej.evaluar(E, cand, plan);
      return plan;
    },

    mejorPlan(E, cand) {
      const a = Ej.armar(E, cand, false), b = Ej.armar(E, cand, true);
      const score = p => (p.ev.exito1 ? 3 : p.ev.exito2 ? 2 : 0) - p.coste * 0.01 + p.ev.si / 1000;
      return score(a) >= score(b) ? a : b;
    },

    /* ── Gobierno de partida ── */
    init(E) {
      const P = Ej.P(E), c = E.esp.cortes;
      P.gob = null; E.esp.pactos = []; E.esp.fallidos = [];
      const orden = P.partidos.filter(k => (P.escanos[k] || 0) >= 25).sort((a, b) => P.escanos[b] - P.escanos[a]);
      let elegido = null;
      const asd = Ej.id(E, 'ASD'); if (orden.includes(asd)) orden.splice(orden.indexOf(asd), 1), orden.unshift(asd);   // el partido del Gobierno saliente intenta repetir
      for (const cand of orden) { const plan = Ej.mejorPlan(E, cand); if (plan.ev.exito2) { elegido = plan; break; } }
      if (!elegido) elegido = Ej.mejorPlan(E, orden[0]);
      Ej.proclamar(E, elegido, { inicial: true, t: c.constituida + 2 });
    },

    /* Crea el Gobierno: presidente, coalición, apoyos externos, pactos y ministros. */
    proclamar(E, plan, o = {}) {
      const P = Ej.P(E), c = E.esp.cortes, cand = plan.cand;
      const aceptadas = plan.aceptadas, bloque = plan.bloque;
      const lider = E.politicos[E.partidos[cand].lider];
      const coal = [cand], ext = [];
      bloque.forEach(p => {
        if (p === cand) return;
        const sg = Ej.sig(E, p), entra = (aceptadas[p] || []).includes('ministerios') || (Ej.sig(E, cand) === 'ASD' && (sg === 'PPI' || sg === 'APU' && Ej.afinidad(E, cand, p) > 0.6));
        if (entra) coal.push(p); else ext.push(p);
      });
      // Partidos no incluidos que votan sí por afinidad cuentan como apoyo
      P.partidos.forEach(p => { if (!bloque.includes(p) && plan.ev && plan.ev.est[p] === 'si' && (P.escanos[p] || 0)) ext.push(p); });
      const seatsC = U.suma(coal.map(k => P.escanos[k] || 0)), seatsE = U.suma(ext.map(k => P.escanos[k] || 0));
      const tipo = coal.length === 1 && seatsC >= MAYORIA ? 'mono' : seatsC >= MAYORIA ? 'mayoria' : 'minoria';
      const t = o.t != null ? o.t : E.fecha.t;
      const viejo = P.gob;
      P.gob = {
        pm: lider ? lider.id : null, partido: cand, coalicion: coal, apoyoExterno: ext, tipo,
        aprob: o.inicial ? U.clamp(40 + U.gauss(0, 5), 30, 52) : 47 + U.gauss(0, 4), formado: t,
        estab: U.clamp(80 - ext.length * 2 - (coal.length - 1) * 3 - (tipo === 'minoria' ? 6 : 0) + U.gauss(0, 5), 25, 92), ministros: {}, vp: {}, enFunciones: false
      };
      c.estado = 'activa'; c.enFunciones = false; c.investidura = null; c.constituida = c.constituida || t; c.mocion = null; c.fallidos = [];
      P.partidos.forEach(p => { E.partidos[p].postura = coal.includes(p) ? 'gobierno' : ext.includes(p) ? 'apoyo' : 'oposicion'; });
      // Pactos firmados
      for (const p in aceptadas) for (const d of aceptadas[p]) {
        if (d === 'ministerios') continue;
        const def = D().demandas[d];
        E.esp.pactos.push({ pid: p, dem: d, t, limite: t + U.ri(40, 90), estado: o.inicial && U.chance(0.55) ? 'cumplida' : 'pendiente' });
        if (!o.inicial) Ej.aplicarCoste(E, p, def);
      }
      if (!o.inicial) { const coste = U.suma(Object.values(aceptadas).flat().map(d => D().demandas[d] ? D().demandas[d].coste : 0)); P.gob.aprob = U.clamp(P.gob.aprob - coste * 0.35, 25, 70); }
      if (E.parl && E.parl.miembros && E.parl.miembros.length) Ej.repartirMinisterios(E);
      if (!o.inicial && E.jugador && E.jugador.pais === 'ES') {
        const J = E.jugador;
        if (P.gob.pm === 'J') E.esp.pendienteGabinete = { key: 'central', formacion: true };
        else if (P.gob.coalicion.includes(J.partido) && J.rol === 'lider') E.esp.pendienteGabinete = { key: 'central', formacion: true, solo: J.partido };
        if (E.esp.gab) E.esp.gab.pool = {};
      }
      if (!o.inicial) {
        C.Noticias.poner(E, 'politica', `${lider ? lider.n : 'Un nuevo líder'} (${Ej.sig(E, cand)}) ${o.censura ? 'es investido presidente/a tras una moción de censura' : 'es investido presidente/a del Gobierno'} con ${plan.ev.si} votos${coal.length > 1 ? ', en coalición con ' + coal.filter(k => k !== cand).map(k => Ej.sig(E, k)).join(', ') : ''}.`, 'ES');
        if (E.jugador && E.jugador.pais === 'ES' && C.Personaje.sincronizar) C.Personaje.sincronizar(E);
      }
      return P.gob;
    },

    aplicarCoste(E, p, def) {
      const reg = E.partidos[p].region; const rc = reg && E.esp.ccaa[reg];
      if (def.ef.indep && rc) rc.indep = Math.max(1, rc.indep + def.ef.indep);
      if (def.ef.aut && rc) rc.aut = Math.min(100, rc.aut + def.ef.aut);
      if (def.ef.rel && rc) rc.relM = Math.min(100, rc.relM + def.ef.rel);
      if (def.coste >= 6) { // la oposición capitaliza el malestar
        for (const k of E.esp.nacionales) { const q = E.partidos[k]; if (q.postura === 'oposicion' && q.ter < -20) q.pop *= 1 + def.coste * 0.0025; }
        C.Opinion.normalizarES(E);
      }
    },

    /* ── Ministerios ── */
    repartirMinisterios(E) {
      const P = Ej.P(E), g = P.gob, J = E.jugador;
      // Libera a los ministros anteriores
      Object.values(g.ministros || {}).forEach(id => { const q = E.politicos[id]; if (q && q.cargo && q.cargo.startsWith('min:')) q.cargo = null; });
      g.ministros = {}; g.vp = {};
      const pm = E.politicos[g.pm]; if (pm) pm.cargo = 'pm';
      const coal = g.coalicion, N = D().ministerios.length;
      const peso = {}; let tp = 0; coal.forEach(k => { peso[k] = Math.pow(P.escanos[k] || 1, 0.72); tp += peso[k]; });
      const cuota = {}; coal.forEach(k => cuota[k] = peso[k] / tp * N);
      const usados = new Set([g.pm]);
      const orden = D().ministerios.slice().sort((a, b) => b.peso - a.peso);
      // Los socios eligen primero las carteras de su sector afín
      const afin = { PPI: ['tra', 'dso', 'cie', 'cul', 'igu'], APU: ['igu', 'dso', 'jov'], VAP: ['int', 'def', 'agr', 'ter'], UPC: ['hac', 'eco', 'int', 'ext', 'def'] };
      const asign = {};
      coal.forEach(k => { if (k !== g.partido) (afin[Ej.sig(E, k)] || []).forEach(mid => { if (!asign[mid] && cuota[k] >= 0.7 && Object.values(asign).filter(x => x === k).length < Math.round(cuota[k])) asign[mid] = k; }); });
      orden.forEach(m => {
        if (!asign[m.id]) { const k = coal.slice().sort((a, b) => cuota[b] - cuota[a])[0]; asign[m.id] = k; }
        cuota[asign[m.id]] -= 1;
      });
      orden.forEach(m => {
        const k = asign[m.id];
        let cand = (E.parl.miembros || []).map(i => E.politicos[i]).filter(p => p && p.p === k && !usados.has(p.id) && p.id !== 'J');
        let ele = null;
        if (J && J.ministerio === m.id && J.partido === k && C.Personaje.enParlamento(E)) ele = E.politicos.J;
        if (!ele) ele = cand.sort((a, b) => ((b.a + b.c + b.i) / 3 + U.gauss(0, 14)) - ((a.a + a.c + a.i) / 3 + U.gauss(0, 14)))[0];
        if (!ele) { const nuevo = C.Mundo.politico(E, { pais: 'ES', partido: k, eco: E.partidos[k].eco + U.gauss(0, 8), soc: E.partidos[k].soc + U.gauss(0, 8), eu: E.partidos[k].eu + U.gauss(0, 8), a: 70 }); ele = nuevo; }
        g.ministros[m.id] = ele.id; usados.add(ele.id);
        if (ele.id !== 'J') ele.cargo = 'min:' + m.id;
        if (m.vp) g.vp[m.vp] = m.id;
      });
      if (J && J.ministerio && !Object.values(g.ministros).includes('J')) J.ministerio = null;
    },

    ministroDe(E, mid) { const g = Ej.P(E).gob; return g && g.ministros[mid] ? E.politicos[g.ministros[mid]] : null; },

    cubrirVacantes(E) {
      const g = Ej.P(E).gob; if (!g) return;
      D().ministerios.forEach(m => {
        if (g.ministros[m.id]) return;
        const k = U.pick(g.coalicion);
        const c = (E.parl.miembros || []).map(i => E.politicos[i]).filter(p => p && p.p === k && p.id !== 'J' && !Object.values(g.ministros).includes(p.id)).sort((a, b) => b.a - a.a)[0];
        const ele = c || C.Mundo.politico(E, { pais: 'ES', partido: k, eco: E.partidos[k].eco, soc: E.partidos[k].soc, eu: E.partidos[k].eu, a: 70 });
        g.ministros[m.id] = ele.id; ele.cargo = 'min:' + m.id;
      });
    },

    nuevoLider(E, pid, motivo) {
      const p = E.partidos[pid], viejo = E.politicos[p.lider];
      const n = C.Mundo.politico(E, { pais: 'ES', partido: pid, eco: p.eco + U.gauss(0, 6), soc: p.soc + U.gauss(0, 6), eu: p.eu + U.gauss(0, 6), e: U.ri(40, 58), c: U.gauss(62, 14), a: 85 });
      p.lider = n.id;
      const P = Ej.P(E);
      if (P.gob && P.gob.partido === pid && P.gob.pm !== 'J') { P.gob.pm = n.id; Ej.repartirMinisterios(E); }
      C.Noticias.poner(E, 'partido', `${p.sigla}: ${n.n} sustituye a ${viejo ? viejo.n : 'su anterior líder'} ${motivo || ''}.`, 'ES');
      return n;
    },

    /* ── Fases tras las elecciones ── */
    turno(E) {
      const c = E.esp.cortes, t = E.fecha.t, P = Ej.P(E);
      if (!P.gob) return;
      if (c.estado === 'constitucion' && t >= c.tConst) Ej.constituir(E);
      else if (c.estado === 'consultas' && t >= c.tConsulta) Ej.consultas(E);
      else if (c.estado === 'investidura' && c.investidura && t >= c.investidura.tVoto && !c.investidura.negociaJ && !E.esp.pendienteSocio) Ej.votar(E);
      else if (c.estado === 'activa') Ej.vidaOrdinaria(E);
      else if (c.estado === 'disueltas') P.gob.estab = Math.max(10, P.gob.estab - 0.02);
    },

    constituir(E) {
      const c = E.esp.cortes, P = Ej.P(E);
      const orden = P.partidos.filter(k => (P.escanos[k] || 0) >= 25).sort((a, b) => P.escanos[b] - P.escanos[a]);
      let mesa = null;
      for (const cand of orden.slice(0, 3)) { const pl = Ej.mejorPlan(E, cand); if (pl.ev.exito2) { mesa = { partido: cand, plan: pl }; break; } }
      if (!mesa) mesa = { partido: orden[0] };
      const J = E.jugador;
      const jPres = !!(J && J.pais === 'ES' && J.electo && J.nivel === 'nacional' && J.rol !== 'lider' && mesa.partido === J.partido && (J.rol === 'direccion' || J.rol === 'portavoz' || J.prestigio >= 50));
      const pres = jPres ? null : C.Mundo.politico(E, { pais: 'ES', partido: mesa.partido, eco: E.partidos[mesa.partido].eco, soc: E.partidos[mesa.partido].soc, eu: E.partidos[mesa.partido].eu, a: 60 });
      c.mesa = { presidente: jPres ? 'J' : pres.id, partido: mesa.partido };
      c.estado = 'consultas'; c.tConsulta = E.fecha.t + 1; c.fallidos = []; c.t1 = null;
      C.Noticias.poner(E, 'politica', `Se constituyen las Cortes. ${jPres ? J.nombre : pres.n} (${Ej.sig(E, mesa.partido)}) preside el Congreso.`, 'ES');
      if (jPres) C.Eventos.info(E, '🏛 Presides el Congreso', 'La Cámara te elige presidente/a del Congreso de los Diputados. Tras las consultas con los grupos propondrás al Rey el candidato a la investidura.');
    },

    /* Ronda de consultas del Rey: propone un candidato. */
    consultas(E) {
      const c = E.esp.cortes, P = Ej.P(E), J = E.jugador;
      if (c.t1 != null && E.fecha.t > c.t1 + 9) { C.Generales.disolver(E, 'sin investidura en dos meses', true); return; }
      const orden = P.partidos.filter(k => (P.escanos[k] || 0) >= 20 && !(c.fallidos || []).includes(k)).sort((a, b) => P.escanos[b] - P.escanos[a]);
      if (!orden.length) { C.Generales.disolver(E, 'ningún candidato logra la investidura', true); return; }
      if (c.mesa && c.mesa.presidente === 'J' && J && J.electo) { c.estado = 'nominaJ'; E.esp.pendienteInvAut = { c: 'ES', tipo: 'nominar' }; return; }
      let cand = null, plan = null;
      for (const k of orden) { const pl = Ej.mejorPlan(E, k); if (pl.ev.exito2) { cand = k; plan = pl; break; } }
      if (!cand) { cand = orden[0]; plan = Ej.mejorPlan(E, cand); }
      Ej.proponer(E, cand, plan);
    },

    /* Candidatos que la Presidencia del Congreso puede proponer, con su mejor bloque previsto. */
    candidatosInv(E) {
      const c = E.esp.cortes, P = Ej.P(E);
      return P.partidos.filter(k => (P.escanos[k] || 0) >= 20 && !(c.fallidos || []).includes(k)).sort((a, b) => P.escanos[b] - P.escanos[a]).map(k => ({ p: k, plan: Ej.mejorPlan(E, k) }));
    },
    /* El jugador, presidente del Congreso, propone al candidato (refrendo al Rey). */
    nominarJugador(E, cand) {
      const c = E.esp.cortes; if (c.estado !== 'nominaJ') return false;
      E.esp.pendienteInvAut = null; Ej.proponer(E, cand, Ej.mejorPlan(E, cand), true);
      C.Personaje.cambiar(E, { prestigio: 2, pop: 1 }, true); return true;
    },

    proponer(E, cand, plan, porJ) {
      const c = E.esp.cortes, P = Ej.P(E), J = E.jugador;
      const lider = E.politicos[E.partidos[cand].lider];
      c.estado = 'investidura';
      C.Noticias.poner(E, 'politica', `${porJ ? 'A propuesta del presidente del Congreso, el' : 'El'} Rey propone a ${lider ? lider.n : Ej.sig(E, cand)} (${Ej.sig(E, cand)}) como candidato a la investidura.`, 'ES');
      c.investidura = { cand, plan, tVoto: E.fecha.t + 1, negociaJ: false };
      if (J && J.pais === 'ES' && E.partidos[cand].lider === 'J') { c.investidura.negociaJ = true; E.esp.pendienteInvestidura = true; }
      else if (J && J.pais === 'ES' && J.rol === 'lider' && (P.escanos[J.partido] || 0) >= 1 && !plan.bloque.includes(J.partido)) { c.investidura.socioJ = true; c.investidura.tVoto = E.fecha.t + 1; E.esp.pendienteSocio = true; }
    },

    votar(E) {
      const c = E.esp.cortes, inv = c.investidura, P = Ej.P(E);
      // Pequeño azar de última hora
      const ev = Ej.evaluar(E, inv.cand, inv.plan);
      let si = ev.si, no = ev.no;
      for (const p in ev.est) {
        const n = P.escanos[p] || 0, acc = inv.plan.aceptadas[p];
        if (ev.est[p] === 'si' && acc && acc.length && U.chance(0.03)) { si -= n; no += n; }
        else if (ev.est[p] === 'abs' && U.chance(0.03)) no += n;
      }
      const cand = inv.cand; E.esp.votoJ = null;
      if (c.t1 == null) c.t1 = E.fecha.t;
      const nombre = (E.politicos[E.partidos[cand].lider] || {}).n || Ej.sig(E, cand);
      if (si >= MAYORIA) { Ej.proclamar(E, inv.plan, {}); return; }
      if (si > no) { C.Noticias.poner(E, 'politica', `${nombre} no alcanza la mayoría absoluta en la primera votación (${si} votos).`, 'ES'); Ej.proclamar(E, Object.assign({}, inv.plan, { ev: Object.assign({}, inv.plan.ev, { si }) }), {}); return; }
      c.fallidos.push(cand);
      C.Noticias.poner(E, 'politica', `Fracasa la investidura de ${nombre} (${Ej.sig(E, cand)}): ${si} votos a favor y ${no} en contra.`, 'ES');
      c.estado = 'consultas'; c.tConsulta = E.fecha.t + 2; c.investidura = null;
      if (E.jugador && E.jugador.pais === 'ES' && E.jugador.rol === 'lider' && E.jugador.partido === cand) C.Eventos.info(E, '🗳️ Investidura fallida', `Tu investidura fracasa (${si} votos a favor, ${no} en contra). Se abre un nuevo plazo: si pasan dos meses desde la primera votación sin presidente, se convocan nuevas elecciones.`);
    },

    /* Investidura del jugador: aplica su plan y vota. */
    investidurJugador(E, plan) {
      const c = E.esp.cortes; const inv = c.investidura; if (!inv) return;
      plan.ev = Ej.evaluar(E, plan.cand, plan);
      inv.plan = plan; inv.negociaJ = false; inv.tVoto = E.fecha.t; E.esp.pendienteInvestidura = false;
      Ej.votar(E);
    },

    /* El jugador, líder de un partido bisagra, fija su voto y sus condiciones ante el candidato. */
    socioJugador(E, voto, demandas) {
      const c = E.esp.cortes, inv = c.investidura, J = E.jugador; if (!inv) return;
      E.esp.pendienteSocio = false; inv.socioJ = false;
      E.esp.votoJ = voto;
      const plan = Ej.mejorPlan(E, inv.cand);
      if (voto === 'si' && demandas && demandas.length) {
        plan.aceptadas[J.partido] = demandas.slice();
        if (!plan.bloque.includes(J.partido)) plan.bloque.push(J.partido);
        plan.coste += U.suma(demandas.map(d => D().demandas[d].coste));
        plan.ev = Ej.evaluar(E, inv.cand, plan);
      }
      inv.plan = plan;
    },

    renunciarInvestidura(E) {
      const c = E.esp.cortes, inv = c.investidura; if (!inv) return;
      c.fallidos.push(inv.cand); c.estado = 'consultas'; c.tConsulta = E.fecha.t + 1; c.investidura = null; E.esp.pendienteInvestidura = false;
      if (c.t1 == null) c.t1 = E.fecha.t;
      C.Noticias.poner(E, 'politica', `${(E.politicos[E.partidos[inv.cand].lider] || {}).n || 'El candidato'} renuncia a someterse a la investidura.`, 'ES');
    },

    /* ── Vida ordinaria de la legislatura ── */
    oposicion(E) {
      const P = Ej.P(E), g = P.gob;
      return P.partidos.filter(k => !g.coalicion.includes(k) && !(g.apoyoExterno || []).includes(k) && (P.escanos[k] || 0) >= 20).sort((a, b) => P.escanos[b] - P.escanos[a]);
    },

    estabilidad(E) {
      const P = Ej.P(E), g = P.gob; if (!g) return;
      const sc = U.suma(g.coalicion.map(k => P.escanos[k] || 0)), se = U.suma((g.apoyoExterno || []).map(k => P.escanos[k] || 0));
      const margen = sc + se - MAYORIA;
      g.estab += U.gauss(0, 0.5) + (g.aprob - 38) * 0.008 + (60 - g.estab) * 0.004 + (margen < 0 ? -0.2 : margen < 6 ? -0.05 : 0.03) + (g.tipo === 'minoria' ? -0.03 : 0);
      g.estab = U.clamp(g.estab, 0, 100);
    },

    vidaOrdinaria(E) {
      const P = Ej.P(E), g = P.gob, c = E.esp.cortes, t = E.fecha.t, J = E.jugador;
      Ej.estabilidad(E);
      // Pactos
      for (const pa of E.esp.pactos) {
        if (pa.estado !== 'pendiente' || t < pa.limite) continue;
        const def = D().demandas[pa.dem];
        const retira = C.Coaliciones ? C.Coaliciones.retira(E, pa) : U.chance(0.25);
        pa.estado = retira ? 'incumplida' : 'cumplida';
        if (retira) {
          g.estab = Math.max(0, g.estab - 6);
          if ((g.apoyoExterno || []).includes(pa.pid)) {
            g.apoyoExterno = g.apoyoExterno.filter(k => k !== pa.pid);
            C.Noticias.poner(E, 'politica', `${Ej.sig(E, pa.pid)} retira su apoyo al Gobierno por el incumplimiento de «${def.nombre}».`, 'ES');
            if (J && J.pais === 'ES') C.Eventos.info(E, '⚠️ Un socio rompe', `${E.partidos[pa.pid].nombre} retira su apoyo al Gobierno porque no se ha cumplido «${def.nombre}». La estabilidad de la legislatura se resiente.`);
          }
        }
      }
      // Moción de censura de la oposición
      if (!c.mocion && g.estab < 48 && t - (c.ultMocion || -99) > 26 && U.chance(0.03)) {
        const opo = Ej.oposicion(E);
        for (const cand of opo.slice(0, 2)) {
          if (J && J.pais === 'ES' && E.partidos[cand].lider === 'J') continue;
          const pl = Ej.mejorPlan(E, cand);
          if (pl.ev.exito1) { Ej.presentarMocion(E, pl); break; }
        }
      }
      if (c.mocion && t >= c.mocion.tVoto) Ej.votarMocion(E);
      // Disolución anticipada por el presidente (IA)
      if (g.pm !== 'J' && C.Generales.puedeDisolver(E) === true && t >= 2 && c.finMax - t > 14) {
        const proy = C.Generales.proyeccion(E);
        const bloque = U.suma(g.coalicion.concat(g.apoyoExterno || []).map(k => proy[k] || 0)), rival = Math.max(...Ej.oposicion(E).map(k => E.partidos[k].popN || 0), 0);
        const ventaja = (E.partidos[g.partido].popN || 0) - rival;
        let pr = 0;
        if (g.estab < 22) pr = 0.03; else if (g.estab < 34 && margenBajo(E)) pr = 0.006;
        if (ventaja > 2.5 && bloque >= MAYORIA && c.finMax - t < 40) pr = Math.max(pr, 0.02);
        if (C.Presion) pr = Math.max(pr, C.Presion.probDisolucion(E, ventaja));
        if (U.chance(pr)) C.Generales.disolver(E, g.estab < 38 ? 'falta de apoyos parlamentarios' : (C.Presion && C.Presion.asegurar(E).nivel >= 55 ? 'ante la presión de la oposición' : 'adelanto electoral por conveniencia'), false);
      }
    },

    presentarMocion(E, plan) {
      const c = E.esp.cortes;
      c.mocion = { cand: plan.cand, plan, tVoto: E.fecha.t + 1 };
      const l = E.politicos[E.partidos[plan.cand].lider];
      C.Noticias.poner(E, 'politica', `${l ? l.n : Ej.sig(E, plan.cand)} (${Ej.sig(E, plan.cand)}) registra una moción de censura contra el Gobierno.`, 'ES');
    },

    votarMocion(E) {
      const c = E.esp.cortes, m = c.mocion; c.mocion = null; c.ultMocion = E.fecha.t;
      const ev = Ej.evaluar(E, m.cand, m.plan);
      if (ev.si >= MAYORIA) { Ej.proclamar(E, Object.assign({}, m.plan, { ev }), { censura: true }); return true; }
      C.Noticias.poner(E, 'politica', `La moción de censura de ${Ej.sig(E, m.cand)} fracasa: ${ev.si} votos a favor.`, 'ES');
      E.partidos[m.cand].cohesion = Math.max(30, E.partidos[m.cand].cohesion - 3);
      return false;
    }
  };

  /* ¿Está el bloque de Gobierno justo de apoyos? */
  function margenBajo(E) {
    const P = E.paises.ES, g = P.gob;
    return U.suma(g.coalicion.concat(g.apoyoExterno || []).map(k => P.escanos[k] || 0)) - MAYORIA < 6;
  }

  C.Ejecutivo = Ej;
  C.Tiempo.registrar('ejecutivo', Ej, 25);
})(window.ESP);

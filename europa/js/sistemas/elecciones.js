/* Elecciones legislativas: sistemas electorales (proporcional, mayoritario, mixto), umbrales,
   calendario de cada país y noche electoral del país del jugador. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;

  /* Asignación de escaños por divisores: D'Hondt (1,2,3…) o Sainte-Laguë (1,3,5…) */
  function divisores(pesos, n, sl) {
    const esc = {}; for (const k in pesos) esc[k] = 0;
    const claves = Object.keys(pesos);
    if (!claves.length) return esc;
    for (let i = 0; i < n; i++) {
      let mejor = null, mv = -1;
      for (const k of claves) { const v = pesos[k] / (sl ? 2 * esc[k] + 1 : esc[k] + 1); if (v > mv) { mv = v; mejor = k; } }
      esc[mejor]++;
    }
    return esc;
  }

  const El = {
    divisores,

    /* Reparte `n` escaños según el sistema electoral del país. votos: {pid: %} */
    reparto(E, paisId, votos, n) {
      const d = Object.assign({}, D().paises[paisId], E.paises[paisId].sist || {});
      const ids = Object.keys(votos);
      const sl = d.form === 'sl';
      const elegibles = ids.filter(k => votos[k] >= d.um);
      if (!elegibles.length) elegibles.push(ids.sort((a, b) => votos[b] - votos[a])[0]);
      const proporcional = nn => {
        const w = {}; elegibles.forEach(k => w[k] = Math.pow(votos[k] / 100, d.k || 1));
        return divisores(w, nn, sl);
      };
      const mayoritario = (nn, k) => {
        const w = {};
        ids.forEach(pid => {
          const v = votos[pid]; if (v < 0.8) return;
          const reg = E.partidos[pid] && E.partidos[pid].arq === 'reg' ? 1.9 : 1;      // el voto regional se concentra
          w[pid] = Math.pow(v / 100, k) * reg;
        });
        return divisores(w, nn, false);
      };
      if (d.sis === 'prop') return proporcional(n);
      if (d.sis === 'mayor') return mayoritario(n, d.k || 2.4);
      const nm = Math.round(n * (d.fm || 0.5));
      const a = mayoritario(nm, 2.2), b = proporcional(n - nm), r = {};
      ids.forEach(k => { const s = (a[k] || 0) + (b[k] || 0); if (s) r[k] = s; });
      return r;
    },

    /* Simula una elección: votos con ruido, participación y escaños. */
    simular(E, paisId, opts = {}) {
      const P = E.paises[paisId], d = D().paises[paisId];
      const crudo = {};
      P.partidos.forEach(pid => {
        const p = E.partidos[pid];
        crudo[pid] = p.pop * Math.exp(U.gauss(0, opts.ruido != null ? opts.ruido : 0.09)) + ((opts.bonus && opts.bonus[pid]) || 0);
      });
      const tot = U.suma(Object.values(crudo));
      const votos = {}; for (const k in crudo) votos[k] = crudo[k] * 100 / tot;
      const part = Math.round(U.clamp((d.reg === 'pres' ? 74 : 66) + U.gauss(0, 5) + (['BE', 'LU', 'MT', 'TR', 'SE', 'DK', 'AL'].includes(paisId) ? 14 : 0) - (['PL', 'RO', 'BG', 'MK', 'BA', 'LT', 'LV'].includes(paisId) ? 7 : 0), 40, 92));
      const escanos = El.reparto(E, paisId, votos, d.esc);
      return { votos, escanos, part };
    },

    init(E) {
      for (const id in E.paises) {
        const P = E.paises[id], d = D().paises[id];
        // Fecha de la próxima elección
        const [y, m] = d.prox;
        let t = U.turnoDe(U.domingo(y, m - 1, 2));
        while (t < 3) t += d.mand * 52;
        P.elec.proxT = t;
        // Última elección (ya celebrada): resultado y escaños de partida
        const res = El.simular(E, id, { ruido: 0.07 });
        P.elec.ultima = { t: t - d.mand * 52, votos: res.votos, escanos: res.escanos, part: res.part };
        P.escanos = res.escanos;
        P.partidos.forEach(pid => { E.partidos[pid].pop = E.partidos[pid].pop * 0.5 + res.votos[pid] * 0.5; });
        C.Opinion.normalizar(P.partidos.map(p => E.partidos[p]), 'pop');
        if (d.guerra) P.flags.leyMarcial = true;
      }
      E.elecciones.historico = [];
    },

    /* Elecciones presidenciales iniciales (sólo países con jefe de Estado elegido). */
    postInit(E) {
      for (const id in E.paises) {
        const d = D().paises[id]; if (!d.pres) continue;
        const P = E.paises[id];
        let t = U.turnoDe(U.domingo(d.pres.prox[0], d.pres.prox[1] - 1, 2));
        while (t < 3) t += d.pres.mand * 52;
        const r = El.presidenciales(E, id, {});
        const pid = r.ganador, pa = E.partidos[pid];
        P.pres = { pol: pa.lider, partido: pid, t0: t - d.pres.mand * 52, proxT: t, mandatos: 1 };
        P.flags.cohab = d.reg === 'semi' && P.gob && !P.gob.coalicion.includes(pid);
        if (d.reg === 'pres') C.Gobierno.formar(E, id, { inicial: true });
      }
    },

    /* Presidenciales a dos vueltas: devuelve {r1:[{pid,v}], r2:[{pid,v}]|null, ganador}. */
    presidenciales(E, id, opts) {
      const P = E.paises[id], d = D().paises[id], J = E.jugador;
      const lim = d.pres.lim, prev = P.pres;
      const cands = P.partidos.map(k => E.partidos[k]).filter(p => p.pop >= 4.5 || (J && p.lider === 'J' && p.pop >= 2)).sort((a, b) => b.pop - a.pop).slice(0, 7);
      const fuerza = {};
      cands.forEach(p => {
        const ld = E.politicos[p.lider]; const c = ld ? ld.c : 50;
        // Un presidente que ya agotó mandatos no puede repetir: su partido presenta a otra persona
        const bloqueado = prev && prev.pol === p.lider && lim && prev.mandatos >= lim;
        fuerza[p.id] = p.pop * (0.75 + 0.5 * c / 100) * Math.exp(U.gauss(0, 0.14)) * (bloqueado ? 0.8 : 1) * (prev && prev.pol === p.lider && !bloqueado ? (1 + (P.gob && P.gob.aprob > 45 ? 0.08 : -0.08)) : 1);
        if (J && p.lider === 'J') fuerza[p.id] *= 1 + J.pop / 400 + (J.campania ? J.campania.pts * 0.003 : 0);
      });
      const tot = U.suma(Object.values(fuerza));
      const r1 = cands.map(p => ({ pid: p.id, v: fuerza[p.id] * 100 / tot })).sort((a, b) => b.v - a.v);
      if (r1[0].v > 50) return { r1, r2: null, ganador: r1[0].pid };
      const a = r1[0].pid, b = r1[1].pid, A = E.partidos[a], B = E.partidos[b];
      let va = r1[0].v, vb = r1[1].v;
      r1.slice(2).forEach(o => {
        const q = E.partidos[o.pid], wa = Math.exp(-3.2 * U.distIdeo(q, A)), wb = Math.exp(-3.2 * U.distIdeo(q, B));
        const abst = 0.18; va += o.v * (1 - abst) * wa / (wa + wb); vb += o.v * (1 - abst) * wb / (wa + wb);
      });
      va *= Math.exp(U.gauss(0, 0.05)); vb *= Math.exp(U.gauss(0, 0.05));
      const t2 = va + vb;
      const r2 = [{ pid: a, v: va * 100 / t2 }, { pid: b, v: vb * 100 / t2 }].sort((x, y) => y.v - x.v);
      return { r1, r2, ganador: r2[0].pid };
    },

    celebrarPres(E, id) {
      const P = E.paises[id], d = D().paises[id], J = E.jugador;
      const prev = P.pres;
      const res = El.presidenciales(E, id, {});
      const nombres = {}; res.r1.forEach(c => { const l = E.politicos[E.partidos[c.pid].lider]; nombres[c.pid] = l ? l.n : E.partidos[c.pid].sigla; });
      const pa = E.partidos[res.ganador];
      let pol = pa.lider;
      const mismo = prev && prev.pol === pol;
      if (prev && mismo && d.pres.lim && prev.mandatos >= d.pres.lim) {       // no puede repetir: nuevo candidato
        const n = C.Gobierno.nuevoLider(E, res.ganador, 'como candidato presidencial'); pol = n.id;
      }
      P.pres = { pol, partido: res.ganador, t0: E.fecha.t, proxT: E.fecha.t + d.pres.mand * 52 + U.ri(-3, 3), mandatos: mismo && pol === prev.pol ? prev.mandatos + 1 : 1 };
      const persona = E.politicos[pol];
      const propio = J && J.pais === id;
      if (d.reg === 'pres') {
        C.Gobierno.formar(E, id, { tras: true });
        if (propio) C.Personaje.sincronizar(E);
      } else {
        P.flags.cohab = !P.gob.coalicion.includes(res.ganador);
        if (P.flags.cohab && U.chance(0.35) && P.elec.proxT - E.fecha.t > 20) El.adelantar(E, id, U.ri(8, 12));
      }
      C.Noticias.poner(E, 'elecciones', `${d.nombre}: ${persona ? persona.n : 'un nuevo líder'} (${pa.sigla}) gana la presidencia${res.r2 ? ' en segunda vuelta (' + U.d1(res.r2[0].v) + ' %)' : ' en primera vuelta'}.`, id);
      if (propio) {
        const eraJ = pol === 'J';
        if (eraJ) { C.Personaje.alPresidente(E); }
        else if (J.cargo === 'presidente') { J.cargo = 'activista'; C.Personaje.sincronizar(E); }
        E.elecciones.presPendiente = { pais: id, t: E.fecha.t, res, ganador: res.ganador, pol, propio: eraJ, nombres };
      }
      C.Bus.emit('presidenciales', { pais: id });
    },

    turno(E) {
      const J = E.jugador;
      for (const id in E.paises) {
        const P = E.paises[id];
        if (P.flags.leyMarcial) {
          // Si nadie juega en Ucrania, la guerra puede acabar por sí sola
          if (id === 'UA' && !(J && J.pais === 'UA') && E.fecha.t > 200 && U.chance(0.004)) {
            P.flags.leyMarcial = false; El.adelantar(E, 'UA', 22);
            C.Noticias.poner(E, 'mundo', 'Ucrania levanta la ley marcial tras un alto el fuego y convoca elecciones.', 'UA');
          }
          continue;
        }
        const resto = P.elec.proxT - E.fecha.t;
        if (J && id === J.pais && resto === 8) {
          C.Noticias.poner(E, 'politica', `Arranca la precampaña en ${D().paises[id].nombre}: faltan ocho semanas para las elecciones.`, id);
          J.campania = { pts: 0, mitines: 0 }; P.flags.campana = true;
        }
        if (E.fecha.t >= P.elec.proxT) El.celebrar(E, id);
        if (P.pres && E.fecha.t >= P.pres.proxT && !P.flags.leyMarcial) El.celebrarPres(E, id);
      }
    },

    /* Celebra las elecciones de un país. En el del jugador deja una noche electoral pendiente. */
    celebrar(E, id) {
      const P = E.paises[id], d = D().paises[id], J = E.jugador;
      const propio = J && J.pais === id;
      const previo = P.elec.ultima;
      const bonus = {};
      if (propio && J.campania) bonus[J.partido] = Math.min(2.5, (J.campania.pts || 0) * 0.02);
      const res = El.simular(E, id, { bonus });
      const antes = Object.assign({}, P.escanos);
      P.elec.ultima = { t: E.fecha.t, votos: res.votos, escanos: res.escanos, part: res.part };
      P.escanos = res.escanos;
      P.elec.proxT = E.fecha.t + d.mand * 52 + U.ri(-4, 4);
      P.flags.campana = false; P.flags.anticipada = false;
      // La opinión se reajusta al resultado real
      P.partidos.forEach(pid => { const p = E.partidos[pid]; p.pop = p.pop * 0.35 + res.votos[pid] * 0.65; p.base = p.base * 0.7 + res.votos[pid] * 0.3; });
      C.Opinion.normalizar(P.partidos.map(p => E.partidos[p]), 'pop');
      C.Opinion.normalizar(P.partidos.map(p => E.partidos[p]), 'base');
      // Liderazgos: los grandes perdedores relevan al líder
      P.partidos.forEach(pid => {
        const p = E.partidos[pid];
        if (propio && E.jugador.rol === 'lider' && pid === J.partido) return;
        const dv = res.votos[pid] - (previo && previo.votos[pid] || 0);
        if (dv < -3.5 && U.chance(0.55)) C.Gobierno.nuevoLider(E, pid, 'tras el mal resultado electoral');
      });
      if (propio) {
        C.Parlamento.recomponer(E, antes);
        const personal = C.Personaje.tras_elecciones(E, previo, res);
        C.Gobierno.formar(E, id, { tras: true });
        E.elecciones.historico.unshift({ t: E.fecha.t, pais: id, votos: res.votos, escanos: res.escanos, part: res.part });
        E.elecciones.nochePendiente = { pais: id, t: E.fecha.t, votos: res.votos, escanos: res.escanos, antes, part: res.part, previo: previo ? previo.votos : null, personal };
      } else {
        C.Gobierno.formar(E, id, { tras: true });
        const g = P.gob, l = E.politicos[g.pm];
        C.Noticias.poner(E, 'elecciones', `${d.nombre}: ${E.partidos[g.partido].nombre} gana las elecciones (${C.U.d1(res.votos[g.partido])} %). ${l ? l.n : 'Nuevo gobierno'} ${g.tipo === 'mayoria' ? 'forma gobierno' : 'gobierna en minoría'}.`, id);
      }
      C.Bus.emit('elecciones', { pais: id });
      return res;
    },

    /* Convoca elecciones anticipadas en `semanas` semanas. */
    adelantar(E, id, semanas) {
      const P = E.paises[id];
      P.elec.proxT = E.fecha.t + Math.max(4, semanas);
      P.flags.anticipada = true;
      C.Noticias.poner(E, 'politica', `${D().paises[id].nombre}: se convocan elecciones anticipadas para ${C.U.fmtT(P.elec.proxT, true)}.`, id);
    },

    semanasHasta(E, id) { return Math.max(0, E.paises[id].elec.proxT - E.fecha.t); }
  };

  C.Elecciones = El;
  C.Tiempo.registrar('elecciones', El, 20);
})(window.EUROPA);

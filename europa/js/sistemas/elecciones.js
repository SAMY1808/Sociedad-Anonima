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

    turno(E) {
      const J = E.jugador;
      for (const id in E.paises) {
        const P = E.paises[id];
        if (P.flags.leyMarcial) continue;
        const resto = P.elec.proxT - E.fecha.t;
        if (J && id === J.pais && resto === 8) {
          C.Noticias.poner(E, 'politica', `Arranca la precampaña en ${D().paises[id].nombre}: faltan ocho semanas para las elecciones.`, id);
          J.campania = { pts: 0, mitines: 0 }; P.flags.campana = true;
        }
        if (E.fecha.t >= P.elec.proxT) El.celebrar(E, id);
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

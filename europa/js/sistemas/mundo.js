/* Mundo: generación procedural (semilla) de los 37 países, sus partidos y líderes. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const INICIO = '2026-10-05';

  const aclarar = (hex, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); return '#' + h(hex).map(v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join(''); };
  const oscurecer = (hex, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); return '#' + h(hex).map(v => Math.round(v * (1 - t)).toString(16).padStart(2, '0')).join(''); };

  const M = {
    opts: null,

    /* Nombre y género aleatorios con el ámbito lingüístico del país. */
    persona(paisId, genero) {
      const g = genero || (U.chance(0.5) ? 'm' : 'f');
      const pool = D().nombres[D().idiomaNombres[paisId]] || D().nombres.es;
      const nombre = U.pick(pool[g === 'm' ? 0 : 1]) + ' ' + U.pick(pool[2]);
      return { n: nombre, g };
    },

    /* Crea un político en E.politicos y devuelve su registro. */
    politico(E, o) {
      const pers = o.n ? { n: o.n, g: o.g || 'm' } : M.persona(o.pais, o.g);
      const id = o.id || U.id('p');
      const p = {
        id, n: pers.n, g: pers.g, e: o.e || U.ri(34, 66), pais: o.pais, p: o.partido,
        eco: Math.round(U.clamp(o.eco || 0, -100, 100)), soc: Math.round(U.clamp(o.soc || 0, -100, 100)), eu: Math.round(U.clamp(o.eu || 0, -100, 100)),
        d: Math.round(U.clamp(o.d != null ? o.d : U.gauss(72, 14), 10, 99)),   // disciplina
        a: Math.round(U.clamp(o.a != null ? o.a : U.gauss(55, 20), 5, 99)),    // ambición
        pr: Math.round(U.clamp(o.pr != null ? o.pr : U.gauss(50, 18), 5, 99)), // pragmatismo
        c: Math.round(U.clamp(o.c != null ? o.c : U.gauss(50, 18), 5, 99)),    // carisma
        i: Math.round(U.clamp(o.i != null ? o.i : U.gauss(60, 20), 5, 99)),    // integridad
        rel: 0
      };
      E.politicos[id] = p;
      return p;
    },

    init(E) {
      const op = M.opts || {};
      for (const id in D().paises) {
        const d = D().paises[id];
        const P = E.paises[id] = { id, estado: d.estado, euro: d.euro, meps: d.meps, partidos: [], ec: null, elec: { ultima: null, proxT: 0 }, gob: null, escanos: {}, ue: { rel: 50, progreso: d.candidato ? d.candidato.progreso : 0, ritmo: d.candidato ? d.candidato.ritmo : 0, congelada: !!(d.candidato && d.candidato.congelada), clusters: 0 }, flags: {} };
        const lista = D().partidos[id].slice();
        if (op.pais === id && op.nuevo) lista.push([op.nuevo.nombre, op.nuevo.sigla, op.nuevo.arq || 'cen', op.nuevo.apoyo || 2.2, op.nuevo]);
        const pops = lista.map(l => l[3] * (1 + U.gauss(0, 0.07)));
        const tot = U.suma(pops);
        const usados = {};
        lista.forEach((l, i) => {
          const arq = D().arquetipos[l[2]], nuevo = l[4];
          const pid = id + '_' + i;
          usados[l[2]] = (usados[l[2]] || 0) + 1;
          let color = nuevo && nuevo.color ? nuevo.color : arq.color;
          if (!(nuevo && nuevo.color)) { if (usados[l[2]] === 2) color = aclarar(color, 0.38); else if (usados[l[2]] >= 3) color = oscurecer(color, 0.35); }
          const sh = 0.22;
          const pa = {
            id: pid, pais: id, nombre: l[0], sigla: l[1], arq: l[2], color,
            eco: Math.round(nuevo ? nuevo.eco : U.clamp(arq.eco + sh * d.elec.eco + U.gauss(0, 9), -100, 100)),
            soc: Math.round(nuevo ? nuevo.soc : U.clamp(arq.soc + sh * d.elec.soc + U.gauss(0, 9), -100, 100)),
            eu: Math.round(nuevo ? nuevo.eu : U.clamp(arq.eu + sh * d.elec.eu + U.gauss(0, 10), -100, 100)),
            grupo: arq.grupo,
            pop: pops[i] * 100 / tot, base: pops[i] * 100 / tot,
            cohesion: Math.round(U.clamp(U.gauss(72, 10), 40, 95)), finanzas: Math.round(U.rf(30, 80)),
            militantes: Math.round(d.pob * 1e6 * U.rf(0.0008, 0.012) * (l[3] / 20 + 0.4) / 100) * 100,
            lider: null, nuevo: !!nuevo
          };
          if (nuevo) { pa.pop = Math.max(0.6, pa.pop); pa.base = pa.pop; }
          E.partidos[pid] = pa;
          P.partidos.push(pid);
          const ld = M.politico(E, { pais: id, partido: pid, eco: pa.eco + U.gauss(0, 5), soc: pa.soc + U.gauss(0, 5), eu: pa.eu + U.gauss(0, 5), e: U.ri(42, 68), c: U.gauss(62, 14), a: 85 });
          pa.lider = ld.id;
        });
        // Renormaliza por si el nuevo partido alteró el total
        C.Opinion.normalizar(P.partidos.map(p => E.partidos[p]), 'pop');
        C.Opinion.normalizar(P.partidos.map(p => E.partidos[p]), 'base');
      }
    },

    /* Cálculo auxiliar: ideología media de un conjunto de partidos ponderada por apoyo. */
    centroide(E, pids, pesos) {
      let w = 0, eco = 0, soc = 0, eu = 0;
      pids.forEach(pid => { const p = E.partidos[pid]; const x = pesos ? (pesos[pid] || 0) : p.pop; w += x; eco += p.eco * x; soc += p.soc * x; eu += p.eu * x; });
      return w ? { eco: eco / w, soc: soc / w, eu: eu / w } : { eco: 0, soc: 0, eu: 0 };
    },

    /* Crea el estado de una partida nueva con las opciones de creación. */
    nueva(opts) {
      M.opts = opts;
      const E = C.Estado.vacio(opts.semilla || (Math.random() * 2 ** 31) | 0, INICIO);
      C.E = E;
      C.U.sembrar(E.meta.rng);
      E.meta.nombrePartida = opts.nombrePartida || '';
      E.meta.dificultad = opts.dificultad || 'normal';
      E.meta.opts = opts;
      E.meta.presim = true;
      C.Tiempo.iniciarMundo(E);
      E.meta.presim = false;
      M.opts = null;
      return E;
    }
  };

  C.Mundo = M;
  C.Tiempo.registrar('mundo', M, 1);
})(window.EUROPA);

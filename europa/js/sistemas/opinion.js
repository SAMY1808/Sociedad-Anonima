/* Opinión: aprobación de los gobiernos, popularidad de los partidos y encuestas. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;

  const Op = {
    init(E) {
      for (const id in E.paises) {
        const P = E.paises[id];
        P.aprobInicial = null;
      }
    },
    postInit(E) {
      for (const id in E.paises) {
        const P = E.paises[id];
        if (P.gob && P.gob.aprob === undefined) P.gob.aprob = 40 + U.gauss(0, 8);
      }
      if (E.jugador) Op.serie(E);
    },

    turno(E) {
      for (const id in E.paises) {
        const P = E.paises[id];
        const g = P.gob;
        if (g) {
          // Aprobación: clima económico + desgaste + ruido
          const objetivo = 44 + 7 * C.Economia.clima(E, id) - Math.min(8, (E.fecha.t - g.formado) / 52 * 1.4) + (g.tipo === 'mayoria' ? 0 : -2);
          g.aprob += (objetivo - g.aprob) * 0.04 + U.gauss(0, 0.5);
          g.aprob = U.clamp(g.aprob, 8, 85);
        }
        // Popularidad de partidos
        const ps = P.partidos.map(p => E.partidos[p]);
        for (const p of ps) {
          const enGob = g && (g.coalicion.includes(p.id));
          const apoyoExt = g && g.apoyoExterno && g.apoyoExterno.includes(p.id);
          let d = (p.base - p.pop) * 0.012;
          if (g) {
            if (enGob) d += (g.aprob - 42) * 0.0016 * (p.id === g.partido ? 1.1 : 0.55);
            else if (!apoyoExt) d += (42 - g.aprob) * 0.0007;
          }
          d += U.gauss(0, 0.045 + 0.012 * Math.sqrt(p.pop));
          p.pop = Math.max(0.15, p.pop + d);
          // La base de largo plazo deriva despacio (los partidos nuevos y los populistas suben con crisis)
          p.base += U.gauss(0, 0.01);
          if (p.base < 0.2) p.base = 0.2;
        }
        Op.normalizar(ps, 'pop'); Op.normalizar(ps, 'base');
        // Estado de la cohesión interna
        for (const p of ps) p.cohesion = U.clamp(p.cohesion + U.gauss(0, 0.35) + (p.cohesion < 70 ? 0.1 : -0.05), 25, 98);
      }
      if (E.jugador && E.fecha.t % 2 === 0) Op.serie(E);
    },

    normalizar(ps, k) {
      const s = U.suma(ps.map(p => p[k])); if (s <= 0) return;
      for (const p of ps) p[k] = p[k] * 100 / s;
    },

    serie(E) {
      const P = E.paises[E.jugador.pais];
      P.partidos.forEach(pid => U.serie('pop:' + pid, E.partidos[pid].pop, 400));
    },

    /* Encuesta publicada: la popularidad real con error de muestreo y sesgo del medio. */
    encuesta(E, id, error = 1.1) {
      const P = E.paises[id], r = {};
      for (const pid of P.partidos) r[pid] = Math.max(0, E.partidos[pid].pop + U.gauss(0, error * Math.sqrt(Math.max(0.5, E.partidos[pid].pop) / 15)));
      const s = U.suma(Object.values(r)); for (const k in r) r[k] = r[k] * 100 / s;
      return r;
    },

    /* Empuje de las acciones del jugador: con presupuesto semanal para evitar crecimientos irreales. */
    empujeJ(E, delta, base = 0.5) {
      const J = E.jugador; if (!J || delta <= 0) return 0;
      const cap = J.campania ? 0.06 : 0.02;
      if (!E._ppj || E._ppj.t !== E.fecha.t) E._ppj = { t: E.fecha.t, v: 0 };
      const d = Math.min(delta * (J.fatiga || 1), Math.max(0, cap - E._ppj.v));
      if (d <= 0) return 0;
      E._ppj.v += d;
      Op.empuje(E, J.partido, d, base);
      return d;
    },

    /* Pequeño empujón al partido (evento, ley…). */
    empuje(E, pid, delta, base = 0.35) {
      const p = E.partidos[pid]; if (!p) return;
      p.pop = Math.max(0.2, p.pop + delta);
      p.base = Math.max(0.2, p.base + delta * base);
      Op.normalizar(E.paises[p.pais].partidos.map(x => E.partidos[x]), 'pop');
      Op.normalizar(E.paises[p.pais].partidos.map(x => E.partidos[x]), 'base');
    }
  };

  C.Opinion = Op;
  C.Tiempo.registrar('opinion', Op, 15);
})(window.EUROPA);

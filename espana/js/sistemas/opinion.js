/* Opinión: aprobación de los gobiernos, popularidad de los partidos y encuestas. */
window.ESP = window.ESP || {};
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
      if (E.esp) E.esp.sumaNac = U.suma(E.esp.nacionales.map(k => E.partidos[k].pop));
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
          const objetivo = 44 + 7 * C.Economia.clima(E, id) - Math.min(8, (E.fecha.t - g.formado) / 52 * 1.4) + (g.tipo === 'mayoria' ? 0 : -2) + (id === 'ES' && E.esp && E.esp.soc ? 0.14 * E.esp.soc.clima : 0);
          g.aprob += (objetivo - g.aprob) * 0.04 + U.gauss(0, 0.5);
          g.aprob = U.clamp(g.aprob, 8, 85);
        }
        if (id === 'ES') { Op.turnoES(E); continue; }
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

    /* España: partidos nacionales (voto base) y regionales (voto en su territorio). */
    turnoES(E) {
      const P = E.paises.ES, g = P.gob;
      if (E.esp.sumaNac == null) E.esp.sumaNac = U.suma(E.esp.nacionales.map(k => E.partidos[k].pop));
      const S = E.esp.soc, GR = C.DATA.colectivos, sw = GR ? U.suma(Object.keys(GR).map(k => GR[k].peso)) : 1;
      for (const k of E.esp.nacionales) {
        const p = E.partidos[k];
        let d = (p.base - p.pop) * 0.012;
        if (g) {
          const enGob = g.coalicion.includes(k), apoyo = (g.apoyoExterno || []).includes(k);
          if (enGob) d += (g.aprob - 42) * 0.0016 * (k === g.partido ? 1.1 : 0.55);
          else if (!apoyo) d += (42 - g.aprob) * 0.0007;
          // Los grupos sociales descontentos se van hacia los partidos que sienten cercanos (y los satisfechos premian al Gobierno)
          if (S && GR) {
            let x = 0; for (const gk in GR) x += GR[gk].peso / sw * C.Impacto.afinidad(E, gk, k) * (S.sat[gk] - 50) / 50;
            d += 0.2 * x * (enGob ? 1 : apoyo ? 0.5 : -0.7);
          }
        }
        d += U.gauss(0, 0.04 + 0.01 * Math.sqrt(p.pop));
        p.pop = Math.max(0.15, p.pop + d); p.base = Math.max(0.15, p.base + U.gauss(0, 0.008));
      }
      Op.normalizarES(E);
      for (const k of E.esp.regionales) {
        const p = E.partidos[k];
        for (const r in p.rp) {
          const rec = E.esp.ccaa[r];
          let d = (p.rp0[r] - p.rp[r]) * 0.01 + U.gauss(0, 0.05 + 0.01 * Math.sqrt(p.rp[r]));
          if (rec && p.indep > 0.5) d += (rec.indep - rec.indep0) * 0.004 * p.indep;     // la marea independentista arrastra a los partidos
          p.rp[r] = U.clamp(p.rp[r] + d, 0.3, 60);
        }
        p.pop = p.rp[p.region];
      }
    },
    empujeES(E, pid, d) { const p = E.partidos[pid]; if (!p || p.amb !== 'nac') return; p.pop = Math.max(0.2, p.pop + d); p.base = Math.max(0.2, p.base + d * 0.3); Op.normalizarES(E); },
    /* Mantiene constante la suma del voto base de los nacionales (el resto va a los regionales). */
    normalizarES(E) {
      const ks = E.esp.nacionales, s = U.suma(ks.map(k => E.partidos[k].pop)), objetivo = E.esp.sumaNac != null ? E.esp.sumaNac : s;
      ks.forEach(k => { E.partidos[k].pop = E.partidos[k].pop * objetivo / s; });
      const sb = U.suma(ks.map(k => E.partidos[k].base)); ks.forEach(k => { E.partidos[k].base = E.partidos[k].base * objetivo / sb; });
    },

    normalizar(ps, k) {
      const s = U.suma(ps.map(p => p[k])); if (s <= 0) return;
      for (const p of ps) p[k] = p[k] * 100 / s;
    },

    serie(E) {
      const P = E.paises[E.jugador.pais];
      P.partidos.forEach(pid => U.serie('pop:' + pid, E.jugador.pais === 'ES' ? (E.partidos[pid].popN || E.partidos[pid].pop) : E.partidos[pid].pop, 400));
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
})(window.ESP);

/* Economía política simplificada: indicadores con inercia, reglas de retroalimentación
   y efectos rezagados de las políticas (inmediato / mediano / largo plazo). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const PIB_BILLONES = 1750;   // PIB nominal de referencia (billones COP)

  /* Horizontes: [inicio, fin] en semanas después de la sanción */
  const PLAZOS = { i: [1, 6], m: [26, 52], l: [90, 200] };
  const INDICES = ['educacion', 'salud', 'seguridad', 'infraestructura'];

  const Ec = {
    VARS: {
      crecimiento: { n: 'Crecimiento del PIB', u: '%', bueno: 1 },
      inflacion:   { n: 'Inflación', u: '%', bueno: -1 },
      desempleo:   { n: 'Desempleo', u: '%', bueno: -1 },
      pobreza:     { n: 'Pobreza monetaria', u: '%', bueno: -1 },
      deficit:     { n: 'Déficit fiscal', u: '% PIB', bueno: -1 },
      deuda:       { n: 'Deuda pública', u: '% PIB', bueno: -1 },
      tasa:        { n: 'Tasa de interés', u: '%', bueno: 0 },
      inversion:   { n: 'Inversión (FBK)', u: '% PIB', bueno: 1 },
      exportaciones:{ n: 'Exportaciones', u: 'mil MUSD', bueno: 1 },
      confianza:   { n: 'Confianza institucional', u: '/100', bueno: 1 }
    },
    init(E) {
      E.economia = {
        pib: PIB_BILLONES, crecimiento: 2.4, inflacion: 5.1, desempleo: 9.6, pobreza: 33.0,
        deficit: 5.6, deuda: 58.5, tasa: 8.25, inversion: 17.5, exportaciones: 49.0, confianza: 42,
        recaudo: 16.2, gasto: 21.8,
        pendientes: []   // { t0, t1, v, d, origen }
      };
      Ec.series(E);
    },
    /* Programa efectos de una ley o decisión. efectos: [{v,d,p}] */
    programar(E, efectos, origen, escala = 1) {
      for (const ef of efectos || []) {
        const [a, b] = PLAZOS[ef.p || 'i'];
        const t0 = E.fecha.t + a + U.ri(0, 2), t1 = E.fecha.t + b + U.ri(0, 4);
        E.economia.pendientes.push({ t0, t1, v: ef.v, d: ef.d * escala, origen });
      }
    },
    /* Impacto fiscal: costo en billones → puntos de déficit (%PIB) */
    impactoFiscal: costo => costo / (PIB_BILLONES / 100),
    aplicarDelta(E, v, d) {
      const Ev = E.economia;
      if (INDICES.includes(v)) { for (const dep of Object.values(E.deptos)) dep[v] = U.clamp(dep[v] + d, 5, 98); return; }
      if (v === 'aprobacion') { E.opinion.aprobacionPres = U.clamp((E.opinion.aprobacionPres || 45) + d, 3, 95); return; }
      if (v === 'pobreza') for (const dep of Object.values(E.deptos)) dep.pobreza = U.clamp(dep.pobreza + d, 3, 90);
      if (v === 'desempleo') for (const dep of Object.values(E.deptos)) dep.desempleo = U.clamp(dep.desempleo + d, 2, 40);
      if (Ev[v] != null) Ev[v] += d;
    },

    turno(E) {
      const Ev = E.economia;
      // 1. Efectos rezagados (se reparten linealmente en su ventana)
      const vivos = [];
      for (const pe of Ev.pendientes) {
        if (E.fecha.t >= pe.t0 && E.fecha.t <= pe.t1) Ec.aplicarDelta(E, pe.v, pe.d / (pe.t1 - pe.t0 + 1));
        if (E.fecha.t < pe.t1) vivos.push(pe);
      }
      Ev.pendientes = vivos;

      // 2. Dinámica macro con inercia (valores objetivo y retroalimentación)
      const k = 1 / 52;
      const crecPot = 3.0 + (Ev.inversion - 17.5) * 0.25 - Math.max(0, Ev.deuda - 65) * 0.05;
      Ev.crecimiento += (crecPot - (Ev.tasa - 7) * 0.25 - Ev.crecimiento) * 0.02 + U.gauss(0, 0.04);
      // Regla de Taylor simplificada del Banco de la República (meta 3 %)
      const tasaObj = 4.5 + 1.4 * (Ev.inflacion - 3) + 0.4 * (Ev.crecimiento - 3);
      Ev.tasa += U.clamp(tasaObj - Ev.tasa, -0.25, 0.25) * 0.08;
      Ev.tasa = U.clamp(Ev.tasa, 1.75, 16);
      Ev.inflacion += ((3 + (Ev.crecimiento - 3) * 0.3 - (Ev.tasa - 6) * 0.25 + Ev.deficit * 0.05) - Ev.inflacion) * 0.015 + U.gauss(0, 0.03);
      // Okun: más crecimiento → menos desempleo
      const desObj = 10.2 - (Ev.crecimiento - 2.5) * 0.6;
      const dDes = (desObj - Ev.desempleo) * 0.01;
      Ev.desempleo += dDes; for (const d of Object.values(E.deptos)) d.desempleo = U.clamp(d.desempleo + dDes, 2, 40);
      const dPob = ((Ev.desempleo - 9.5) * 0.4 + (Ev.inflacion - 4) * 0.3 - (Ev.crecimiento - 2) * 0.3) * k;
      Ev.pobreza += dPob; for (const d of Object.values(E.deptos)) d.pobreza = U.clamp(d.pobreza + dPob, 3, 90);
      // Déficit tiende a su nivel estructural; deuda acumula déficit y se diluye con crecimiento nominal
      // La regla fiscal empuja el déficit hacia su nivel estructural (ajustes de Hacienda)
      Ev.deficit += (4.2 - Ev.deficit) * (Ev.deficit > 6 ? 0.018 : 0.01) + U.gauss(0, 0.01);
      Ev.deuda += (Ev.deficit - Ev.deuda * (Ev.crecimiento + Ev.inflacion) / 100) * k;
      Ev.inversion += (17.5 - Ev.inversion) * 0.005 - (Ev.tasa - 8) * 0.003 + U.gauss(0, 0.02);
      Ev.exportaciones += (Ev.exportaciones * 0.02 * k) + U.gauss(0, 0.08);
      Ev.confianza += (40 - Ev.confianza) * 0.003 + U.gauss(0, 0.1);
      Ev.pib *= 1 + (Ev.crecimiento + Ev.inflacion) / 100 * k;

      Ev.crecimiento = U.clamp(Ev.crecimiento, -8, 9); Ev.inflacion = U.clamp(Ev.inflacion, -1, 25);
      Ev.desempleo = U.clamp(Ev.desempleo, 4, 25); Ev.pobreza = U.clamp(Ev.pobreza, 10, 60);
      Ev.deficit = U.clamp(Ev.deficit, -3, 14); Ev.deuda = U.clamp(Ev.deuda, 20, 120);
      Ev.confianza = U.clamp(Ev.confianza, 5, 95);
      Ec.series(E);
    },
    series(E) {
      const Ev = E.economia;
      for (const v of Object.keys(Ec.VARS)) U.serie('eco:' + v, Ev[v]);
    },
    /* Salud económica 0-100 para el tablero */
    indice(E) {
      const Ev = E.economia;
      return U.clamp(50 + (Ev.crecimiento - 2.5) * 8 - (Ev.inflacion - 3.5) * 4 - (Ev.desempleo - 9) * 3 - (Ev.deficit - 4) * 2, 0, 100);
    }
  };

  C.Economia = Ec;
  C.Tiempo.registrar('economia', Ec, 10);
})(window.CURUL);

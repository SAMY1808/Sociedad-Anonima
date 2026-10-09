/* Rivales con IA estratégica: los partidos de la IA gestionan su tesorería (crisis de caja, donaciones, casos de financiación)
   y reposicionan su ideología (giros estratégicos) según cómo les va en las encuestas. Estado: E.esp.riv[pid] = { pop52, t52, giro[], crisis }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const Rv = C.Rivales = {
    asegurar(E, k) { const r = E.esp.riv = E.esp.riv || {}; return r[k] = r[k] || { pop52: E.partidos[k].popN || E.partidos[k].pop, t52: E.fecha.t, giro: [], crisis: -99 }; },
    centroide() { const GR = D().colectivos, sw = U.suma(Object.keys(GR).map(g => GR[g].peso)), c = { eco: 0, soc: 0, eu: 0, ter: 0 }; for (const g in GR) for (const ax in c) c[ax] += GR[g][ax] * GR[g].peso / sw; return c; },
    /* Balance semanal aproximado de la tesorería de un partido de la IA (en puntos de finanzas). */
    balance(p) { const pop = p.popN || p.pop || 0, ing = p.militantes / 100000 * 0.08 + pop / 100 * 0.6, gas = 0.04 + 0.18 * clamp(p.militantes / 200000, 0, 1) + 0.005 * pop + 0.0095 * Math.max(0, pop - 2); return ing - gas; },
    giro(E, k) {
      const p = E.partidos[k], r = Rv.asegurar(E, k), c = Rv.centroide(), pop = p.popN || p.pop, cae = pop < r.pop52 * 0.92, sube = pop > r.pop52 * 1.08; let txt = null;
      if (cae && p.cohesion > 40) { const mov = ax => { const d = c[ax] - p[ax], paso = clamp(d, -4, 4); return paso; }; const antes = Math.abs(p.eco - c.eco) + Math.abs(p.soc - c.soc); for (const ax of ['eco', 'soc', 'eu', 'ter']) p[ax] = Math.round(clamp(p[ax] + mov(ax) * (ax === 'ter' ? 0.3 : 1), -100, 100)); const despues = Math.abs(p.eco - c.eco) + Math.abs(p.soc - c.soc); p.cohesion = clamp(p.cohesion - 1.5, 15, 99); txt = despues < antes ? `${p.sigla} modera su discurso para recuperar terreno.` : `${p.sigla} reorienta su mensaje.`; }
      else if (sube && U.chance(0.5)) { const ax = U.pick(['eco', 'soc']); p[ax] = Math.round(clamp(p[ax] + Math.sign(p[ax] || 1) * 3, -100, 100)); txt = `${p.sigla}, al alza, refuerza su perfil ideológico.`; }
      if (txt) { r.giro.unshift({ t: E.fecha.t, txt }); if (r.giro.length > 6) r.giro.length = 6; C.Noticias.poner(E, 'partido', txt, 'ES'); }
      r.pop52 = pop; r.t52 = E.fecha.t; return txt;
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const P = E.paises.ES, t = E.fecha.t;
      for (const k of E.esp.nacionales) {
        if (k === J.partido) continue; const p = E.partidos[k]; if (!p || p.lider === 'J') continue; const r = Rv.asegurar(E, k);
        // tesorería
        p.finanzas = clamp(p.finanzas + Rv.balance(p) * 0.9, 0, 99); if (p.finanzas < 15) p.finanzas = clamp(p.finanzas + 0.15, 0, 99); if (p.finanzas > 88) p.finanzas -= 0.1;
        if (p.finanzas < 7) { p.cohesion = clamp(p.cohesion - 0.08, 15, 99); if (t - r.crisis > 40 && U.chance(0.03)) { r.crisis = t; C.Noticias.poner(E, 'partido', `${p.sigla} atraviesa una grave crisis de tesorería: nóminas retrasadas y deuda con proveedores.`, 'ES'); if (C.Corrupcion && U.chance(0.4)) C.Corrupcion.nuevo(E, k, { gravedad: U.rf(0.2, 0.45), tipo: 'financiacion' }); } }
        // giro estratégico anual (escalonado por partido)
        if (t - r.t52 >= 52 + (k.length * 3) % 17) Rv.giro(E, k);
      }
    },
    linea(E, k) { const r = E.esp.riv && E.esp.riv[k], p = E.partidos[k]; return { caja: Math.round(p.finanzas * 1.1), crisis: p.finanzas < 7, giro: r && r.giro[0] }; }
  };
  C.Tiempo.registrar('rivales', { turno: Rv.turno }, 36);
})(window.ESP);

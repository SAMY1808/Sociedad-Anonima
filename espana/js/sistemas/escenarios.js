/* Escenarios de inicio: situaciones políticas de partida (minoría, crisis territorial, crisis económica, bipartidismo, fragmentación, escándalo). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const LISTA = [
    ['normal', 'Octubre de 2026 (por defecto)', 'La España calibrada a 2023: derecha primera en escaños y un Gobierno de izquierdas apoyado por regionalistas.'],
    ['minoria', 'Gobierno en minoría y presupuestos prorrogados', 'El Gobierno apenas se sostiene, los socios exigen y las cuentas están prorrogadas.'],
    ['crisis_territorial', 'Crisis territorial abierta', 'El pulso con Cataluña está en su punto más alto: relación rota y desafío en marcha.'],
    ['crisis_economica', 'Crisis económica (inspirado en 2011)', 'Paro alto, déficit disparado, prima de riesgo por las nubes y un Gobierno desgastado.'],
    ['bipartidismo', 'Bipartidismo (inspirado en 1996)', 'Dos grandes partidos se reparten casi todo el voto; los pequeños pesan menos.'],
    ['fragmentacion', 'Fragmentación (inspirado en 2016)', 'Parlamento muy repartido: cualquier mayoría exige pactos amplios.'],
    ['escandalo', 'Escándalo de corrupción', 'Un caso salpica al partido del Gobierno y la oposición huele sangre.']
  ];
  C.Escenarios = {
    LISTA,
    aplicar(E, id) {
      const P = E.paises.ES, g = P.gob, ec = P.ec, E0 = C.Economia; if (!id || id === 'normal' || !g) return;
      const empujar = (f) => { for (const k of P.partidos) { const p = E.partidos[k]; if (p.amb !== 'nac' && p.amb !== 'reg') continue; p.pop = Math.max(0.2, f(k, p)); p.base = Math.max(0.2, p.base * 0.7 + p.pop * 0.3); } C.Opinion.normalizarES(E); };
      if (id === 'minoria') { g.estab = 28; g.aprob = clamp(g.aprob - 6, 20, 80); if (C.Presupuesto) { const pg = C.Presupuesto.asegurar(E); pg.estado = 'prorrogado'; pg.prorrogas = 1; } if (E.esp.consejo) for (const k in E.esp.consejo.sat) E.esp.consejo.sat[k] = clamp(E.esp.consejo.sat[k] - 20, 10, 90); }
      else if (id === 'crisis_territorial') { const rc = E.esp.ccaa.CAT; rc.relM = 18; rc.indep = clamp(rc.indep + 12, 0, 100); rc.agravio += 3; if (E.esp.procesos && E.esp.procesos.CAT) { E.esp.procesos.CAT.fase = 'tension'; } g.estab = clamp(g.estab - 8, 0, 100); for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop += 0.5; } C.Opinion.normalizarES(E); }
      else if (id === 'crisis_economica') { E0.aplicar(E, 'ES', { paro: 6, deficit: 3, crec: -0.03, deuda: 10 }); g.aprob = clamp(g.aprob - 14, 15, 80); g.estab = clamp(g.estab - 8, 0, 100); if (C.Estructural) { const s = C.Estructural.asegurar(E); s.fin.prima = 420; s.fin.shock = 120; s.fin.bancos = 45; s.viv.precio = 88; } empujar((k, p) => p.id === g.partido ? p.pop * 0.78 : p.pop * (p.eco > 0 ? 1.12 : 1.0)); }
      else if (id === 'bipartidismo') { const top = P.partidos.slice().sort((a, b) => E.partidos[b].pop - E.partidos[a].pop).slice(0, 2); empujar((k, p) => top.includes(k) ? p.pop * 1.28 : p.pop * 0.68); g.estab = clamp(g.estab + 6, 0, 100); }
      else if (id === 'fragmentacion') { empujar((k, p) => Math.sqrt(Math.max(0.2, p.pop)) * 2.2 + 1.5); g.estab = clamp(g.estab - 10, 0, 100); }
      else if (id === 'escandalo') { if (C.Corrupcion) { const c = C.Corrupcion.nuevo(E, g.partido, { tipo: 'financiacion', gravedad: 0.85 }); c.fase = 'filtracion'; c.tFase = E.fecha.t; C.Corrupcion.sube(E, g.partido, 45); } g.aprob = clamp(g.aprob - 7, 15, 80); E.partidos[g.partido].cohesion = clamp(E.partidos[g.partido].cohesion - 12, 15, 99); }
      E.meta.escenario = id; if (C.Noticias) C.Noticias.poner(E, 'politica', 'Comienza la partida: ' + LISTA.find(x => x[0] === id)[1] + '.', 'ES');
    }
  };
})(window.ESP);

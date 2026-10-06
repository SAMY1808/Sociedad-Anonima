/* Mundo: relaciones bilaterales, OTAN, Europa por dentro (fondos Next Generation, eurobonos, déficit) y familias políticas en el poder en la UE.
   Estado: E.esp.ext. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const PAISES = {
    marruecos: { n: 'Marruecos', ic: '🇲🇦', base: 50, desc: 'Frontera sur, migración, Ceuta y Melilla.' },
    francia: { n: 'Francia', ic: '🇫🇷', base: 62, desc: 'Socio clave en Europa y seguridad.' },
    portugal: { n: 'Portugal', ic: '🇵🇹', base: 75, desc: 'Vecino y aliado natural en el sur.' },
    alemania: { n: 'Alemania', ic: '🇩🇪', base: 62, desc: 'Motor de la UE y de la política fiscal.' },
    eeuu: { n: 'Estados Unidos', ic: '🇺🇸', base: 55, desc: 'Socio atlántico, defensa y comercio.' },
    latam: { n: 'América Latina', ic: '🌎', base: 62, desc: 'Lazos históricos, inversión y diáspora.' },
    china: { n: 'China', ic: '🇨🇳', base: 38, desc: 'Comercio y tecnología; fricción con EE. UU.' },
    otan: { n: 'OTAN', ic: '🛡️', base: 65, desc: 'Compromisos de defensa y gasto.' }
  };
  const Ex = C.Exterior = {
    PAISES,
    asegurar(E) { if (!E.esp.ext) { const rel = {}; for (const k in PAISES) rel[k] = PAISES[k].base + U.ri(-6, 6); E.esp.ext = { rel, ng: { total: 140, cobrado: 30, ejec: 22, aviso: 0 }, postura: 'dialogante', alianza: 0, hist: [], ult: {} }; } return E.esp.ext; },
    nota(E, txt) { const x = Ex.asegurar(E); x.hist.unshift({ t: E.fecha.t, txt }); if (x.hist.length > 20) x.hist.length = 20; },
    rel(E, k, d) { const x = Ex.asegurar(E); x.rel[k] = clamp(x.rel[k] + d, 0, 100); },
    /* Familias políticas en el poder en la UE. */
    familias(E) {
      const r = {}; let tot = 0; for (const id in E.paises) { if (id === 'ES' || !D().paises[id] || !E.paises[id].gob || !D().paises[id].meps) continue; const p = E.partidos[E.paises[id].gob.partido]; if (!p) continue; r[p.grupo] = (r[p.grupo] || 0) + 1; tot++; } return { n: r, tot };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const x = Ex.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob;
      for (const k in PAISES) x.rel[k] = clamp(x.rel[k] + (PAISES[k].base - x.rel[k]) * 0.006 + U.gauss(0, 0.2), 0, 100);
      // Efectos económicos de unas buenas relaciones
      const com = (x.rel.alemania + x.rel.francia + x.rel.eeuu + x.rel.latam) / 4; if (com > 66) C.Economia.aplicar(E, 'ES', { crec: 0.00004 * (com - 66) }); if (x.rel.marruecos < 30 && C.Estructural) { const im = C.Estructural.asegurar(E).inm; im.llegadas = clamp(im.llegadas + 0.15, 20, 300); }
      // Fondos Next Generation: se cobra por tramos y se pierde lo no ejecutado
      const ng = x.ng; if (ng.cobrado < ng.total && t % 26 === 0) { const tr = Math.min(ng.total - ng.cobrado, 20); ng.cobrado += tr; if (g.pm === 'J') Ex.nota(E, `Se desembolsa un tramo de ${tr} mil millones de fondos europeos.`); }
      ng.ejec = clamp(ng.ejec + (g.pm === 'J' ? 0.05 : 0.04) * (g.estab / 60), 0, 100); if (ng.ejec > 20) C.Economia.aplicar(E, 'ES', { crec: 0.00003 * (ng.ejec - 20) / 10 });
      if (E.paises.ES.ec.pde && U.chance(0.01)) { E.paises.ES.ue.rel = clamp((E.paises.ES.ue.rel || 50) - 1, 0, 100); }
      // Postura negociadora ante la UE
      if (g.pm === 'J') { const ue = E.paises.ES.ue; if (x.postura === 'duro') { ue.rel = clamp(ue.rel - 0.04, 0, 100); x.alianza += 0.02; } else if (x.postura === 'bloque_sur') { x.alianza += 0.12; ue.rel = clamp(ue.rel + 0.01, 0, 100); } else ue.rel = clamp(ue.rel + 0.03, 0, 100);
        if (x.alianza > 100 && !E.ue.eurobonos && U.chance(0.05)) { E.ue.eurobonos = true; x.alianza = 0; C.Noticias.poner(E, 'europa', 'El bloque sur logra que el Consejo Europeo apruebe los eurobonos.', 'ES'); Ex.nota(E, 'Eurobonos aprobados gracias a tu alianza del sur.'); C.Personaje.cambiar(E, { prestigio: 4, capEU: 3 }); } }
      // Familia política en el poder en Europa
      if (t % 13 === 0) { const f = Ex.familias(E), mi = E.partidos[J.partido].grupo, share = f.tot ? (f.n[mi] || 0) / f.tot : 0; J.capEU = clamp((J.capEU || 0) + (share - 0.25) * 2, 0, 100); }
    },
    cumbre(E, k) {
      const J = E.jugador, g = E.paises.ES.gob, x = Ex.asegurar(E); if (!PAISES[k] || k === 'otan') return { ok: false, msg: 'Elige un país' }; if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno hace cumbres bilaterales' };
      if (E.fecha.t - (x.ult[k] || -99) < 10) return { ok: false, msg: 'Acabas de reunirte con ese país: espera unas semanas' }; x.ult[k] = E.fecha.t;
      const o = (J.atrib.carisma + J.atrib.negociacion) / 20, d = 6 + o * 8; Ex.rel(E, k, d); C.Personaje.cambiar(E, { prestigio: 0.8 + o * 0.6, capEU: ['francia', 'alemania', 'portugal'].includes(k) ? 1 : 0.2 });
      if (k === 'eeuu') Ex.rel(E, 'china', -2); if (k === 'china') Ex.rel(E, 'eeuu', -3); if (k === 'marruecos' && C.Estructural) C.Estructural.asegurar(E).inm.marruecos = clamp(C.Estructural.asegurar(E).inm.marruecos + 6, 0, 100);
      Ex.nota(E, `Cumbre con ${PAISES[k].n}: relación +${Math.round(d)}.`); return { ok: true, msg: `Cumbre con ${PAISES[k].n}: la relación mejora (+${Math.round(d)}).` };
    },
    otan(E) {
      const g = E.paises.ES.gob; if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno' }; Ex.rel(E, 'otan', 10); Ex.rel(E, 'eeuu', 4); C.Economia.aplicar(E, 'ES', { deficit: 0.06 });
      for (const k of E.paises.ES.partidos) { const p = E.partidos[k]; if (p.soc < -25 && p.eco < -15) C.Opinion.empujeES(E, k, 0.01); } Ex.nota(E, 'Aumenta el gasto en defensa hacia el objetivo del 2 %.'); return { ok: true, msg: 'Elevas el gasto en defensa: mejora tu crédito en la OTAN y sube el déficit.' };
    },
    fondos(E) {
      const J = E.jugador, g = E.paises.ES.gob, ng = Ex.asegurar(E).ng; if (g.pm !== 'J' && !J.ministerio) return { ok: false, msg: 'Sólo el presidente o un ministro' }; const x = 3 + J.atrib.gestion / 2.5; ng.ejec = clamp(ng.ejec + x, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.4 });
      return { ok: true, msg: `Aceleras la ejecución de los fondos europeos (+${U.d1(x)} puntos).` };
    },
    postura(E, p) { if (!['duro', 'dialogante', 'bloque_sur'].includes(p)) return { ok: false, msg: 'Postura no válida' }; if (E.paises.ES.gob.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno' }; Ex.asegurar(E).postura = p; return { ok: true, msg: `Tu postura en Bruselas: ${{ duro: 'línea dura', dialogante: 'diálogo y consenso', bloque_sur: 'liderar el bloque del sur' }[p]}.` }; }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 2, grupo: 'nacional' }, o));
  const es = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  R({ id: 'cumbre_bilateral', nombre: 'Cumbre bilateral', icono: '🤝', desc: 'El presidente se reúne con otro Gobierno: sube la relación y tu prestigio exterior.', disponible: es, ejecutar: (E, a) => Ex.cumbre(E, a.pais) });
  R({ id: 'compromiso_otan', nombre: 'Aumentar el gasto en defensa', icono: '🛡️', desc: 'Cumples el objetivo de la OTAN: crédito exterior a cambio de déficit y críticas de la izquierda.', disponible: es, ejecutar: E => Ex.otan(E) });
  R({ id: 'gestionar_fondos', nombre: 'Acelerar los fondos europeos', icono: '💶', costo: 1, desc: 'Presidente o ministro: impulsa la ejecución de los fondos Next Generation.', disponible: es, ejecutar: E => Ex.fondos(E) });
  R({ id: 'postura_ue', nombre: 'Fijar la postura en Bruselas', icono: '🇪🇺', costo: 1, desc: 'Línea dura, diálogo o liderar el bloque del sur.', disponible: es, ejecutar: (E, a) => Ex.postura(E, a.postura) });
  C.Tiempo.registrar('exterior', { turno: Ex.turno }, 51);
})(window.ESP);

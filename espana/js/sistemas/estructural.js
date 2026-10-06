/* Problemas de país: vivienda y turismo, sector financiero y prima de riesgo, energía y clima, inmigración y fronteras.
   Cuatro submodelos con indicadores propios, palancas del jugador y crisis. Estado: E.esp.est. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const Es = C.Estructural = {
    asegurar(E) {
      if (E.esp.est) return E.esp.est;
      return E.esp.est = {
        viv: { precio: 112, alquiler: 118, oferta: 38, turist: 52, tope: 0, hist: [] },
        fin: { prima: 95, confianza: 60, crisis: null, shock: 0, hist: [], bancos: 70 },
        ener: { precio: 105, renov: 46, dep: 62, sequia: 35, nuclear: 0, hist: [] },
        inm: { llegadas: 100, integ: 50, tension: 40, marruecos: 50, reparto: 0, hist: [] },
        log: []
      };
    },
    nota(E, txt) { const s = Es.asegurar(E); s.log.unshift({ t: E.fecha.t, txt }); if (s.log.length > 25) s.log.length = 25; },
    /* ¿Qué escala de efecto tiene tu cargo? Estado 1, comunidad 0,5, ayuntamiento 0,3. */
    escala(E) { const J = E.jugador, g = E.paises.ES.gob; if (J.pais !== 'ES') return 0; if (g.pm === 'J' || J.ministerio) return 1; if (J.cargo === 'presauto') return 0.5; if (J.cargo === 'alcalde') return 0.3; return 0; },
    puede(E) { return Es.escala(E) > 0 ? true : 'Necesitas ser presidente, ministro, presidente autonómico o alcalde'; },
    registrarHist(s, k, v, t) { const h = s[k].hist; h.push([t, Math.round(v * 10) / 10]); if (h.length > 120) h.shift(); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const s = Es.asegurar(E), P = E.paises.ES, g = P.gob, ec = P.ec, t = E.fecha.t, v = s.viv, f = s.fin, en = s.ener, im = s.inm;
      const infl = ec.infl || 0, crec = ec.crec || 0, def = ec.deficit || 0, deuda = ec.deuda || 90;
      // ── Vivienda y turismo
      const presion = v.turist / 100 * 0.5 + (100 - v.oferta) / 100 * 0.6 + Math.max(0, infl - 3) * 0.04;
      v.precio = clamp(v.precio + presion * 0.12 - 0.045 + crec * 0.01 + U.gauss(0, 0.25), 60, 280); v.alquiler = clamp(v.alquiler + (v.precio * 1.02 - v.alquiler) * 0.02 - (v.tope ? 0.12 : 0) + U.gauss(0, 0.15), 60, 300);
      v.turist = clamp(v.turist + 0.025 + U.gauss(0, 0.05), 5, 100); v.oferta = clamp(v.oferta - (v.tope ? 0.05 : 0.01) + 0.005, 5, 100); if (v.tope > 0) v.tope = Math.max(0, v.tope - 1);
      const esfuerzo = Es.esfuerzo(E); if (esfuerzo > 40) g.aprob = clamp(g.aprob - (esfuerzo - 40) * 0.004, 5, 90);
      // ── Finanzas
      const conf = C.Organismos ? C.Organismos.mercados(E) : 60;
      const objP = 60 + Math.max(0, deuda - 90) * 3 + Math.max(0, def - 3) * 35 + (50 - conf) * 1.2 + (50 - g.estab) * 1 + f.shock;
      f.prima = clamp(f.prima + (objP - f.prima) * 0.05 + U.gauss(0, 1.5), 25, 900); f.shock *= 0.97; f.confianza = clamp(100 - f.prima / 6, 5, 100);
      if (f.prima > 400) { C.Economia.aplicar(E, 'ES', { crec: -0.0015 }); g.estab = clamp(g.estab - 0.05, 0, 100); }
      if (!f.crisis && f.prima > 300 && U.chance(0.004) && !E.meta.presim) Es.crisisBancaria(E);
      // ── Energía y clima
      en.sequia = clamp(35 + 28 * Math.sin(t / 52 * 2 * Math.PI / 3.1) + U.gauss(0, 3), 0, 100); en.renov = clamp(en.renov + 0.025 + U.gauss(0, 0.04), 20, 95); en.dep = clamp(en.dep - 0.012 - (en.renov - 46) * 0.0004, 15, 90);
      en.precio = clamp(en.precio + ((100 + en.dep * 0.5 - (en.renov - 30) * 0.8 + en.sequia * 0.25 + (en.nuclear ? -4 : 0)) - en.precio) * 0.04 + U.gauss(0, 0.8), 50, 260);
      if (en.precio > 130) { g.aprob = clamp(g.aprob - (en.precio - 130) * 0.003, 5, 90); C.Economia.aplicar(E, 'ES', { infl: 0.0006 * (en.precio - 130) }); }
      if (en.sequia > 70 && U.chance(0.02) && !E.meta.presim) Es.conflictoAgua(E);
      // ── Inmigración
      const est = Math.sin((t % 52) / 52 * 2 * Math.PI - 1) * 12; im.llegadas = clamp(im.llegadas + (100 + est - im.llegadas) * 0.04 + (50 - im.marruecos) * 0.01 + U.gauss(0, 1.5), 20, 300);
      im.integ = clamp(im.integ + 0.01 + U.gauss(0, 0.04), 5, 95); im.tension = clamp(im.tension + ((im.llegadas - 100) * 0.25 + (50 - im.integ) * 0.6 + 40 - im.tension - im.reparto * 0.3) * 0.04, 0, 100);
      if (im.tension > 55) for (const k of P.partidos) { const p = E.partidos[k]; if (p.soc > 30 && p.ter < -20) C.Opinion.empujeES(E, k, (im.tension - 50) * 0.0005); }
      if (U.chance(0.01) && im.tension > 45 && !E.meta.presim) { C.Noticias.poner(E, 'politica', U.pick(['Una nueva oleada de pateras llega a Canarias', 'Los ayuntamientos costeros piden ayuda por la llegada de menores', 'Tensión en un barrio por el reparto de acogida']), 'ES'); im.llegadas = clamp(im.llegadas + 12, 20, 300); }
      if (t % 4 === 0) { Es.registrarHist(s, 'viv', v.precio, t); Es.registrarHist(s, 'fin', f.prima, t); Es.registrarHist(s, 'ener', en.precio, t); Es.registrarHist(s, 'inm', im.tension, t); }
    },
    esfuerzo(E) { return 22 + (Es.asegurar(E).viv.alquiler - 100) * 0.3; },
    crisisBancaria(E) { const f = Es.asegurar(E).fin; f.crisis = { t: E.fecha.t, entidad: U.pick(['Banco del Mediterráneo', 'Caja Meridional', 'Banco Ibérico del Norte', 'Caixa Atlántica']) }; f.bancos = clamp(f.bancos - 20, 0, 100); C.Noticias.poner(E, 'economia', `Pánico en los mercados: ${f.crisis.entidad} tiene graves problemas de solvencia.`, 'ES'); C.Economia.aplicar(E, 'ES', { crec: -0.003 }); Es.nota(E, `Crisis bancaria: ${f.crisis.entidad}.`);
      if (!E.meta.presim && E.paises.ES.gob.pm === 'J') C.Eventos.info(E, '🏦 Crisis bancaria', `${f.crisis.entidad} se tambalea. Decide en la pestaña Problemas de país → Finanzas si la rescatas, la fusionas o la dejas caer.`); },
    resolverBanco(E, k) {
      const s = Es.asegurar(E), f = s.fin, g = E.paises.ES.gob; if (!f.crisis) return { ok: false, msg: 'No hay ninguna entidad en crisis' }; if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno decide' };
      const n = f.crisis.entidad; f.crisis = null;
      if (k === 'rescate') { C.Economia.aplicar(E, 'ES', { deficit: 0.5 }); g.aprob = clamp(g.aprob - 3, 5, 90); f.bancos = clamp(f.bancos + 18, 0, 100); f.shock -= 25; Es.nota(E, `Rescate público de ${n}.`); return { ok: true, msg: `Rescatas a ${n} con dinero público: se calman los mercados, pero la opinión pública te lo reprocha.` }; }
      if (k === 'fusion') { f.bancos = clamp(f.bancos + 10, 0, 100); f.shock -= 12; C.Personaje.cambiar(E, { prestigio: 1 }); Es.nota(E, `${n} se fusiona con un banco mayor.`); return { ok: true, msg: `${n} se integra en otro banco: crisis contenida sin gran coste.` }; }
      f.shock += 60; C.Economia.aplicar(E, 'ES', { crec: -0.004 }); g.estab = clamp(g.estab - 3, 0, 100); Es.nota(E, `${n} quiebra.`); return { ok: true, msg: `Dejas caer a ${n}: se dispara la prima de riesgo.` };
    },
    conflictoAgua(E) {
      const ids = C.Territorio.ids(), a = U.pick(ids), b = U.pick(ids.filter(x => x !== a)); const ra = E.esp.ccaa[a], rb = E.esp.ccaa[b]; ra.relM = clamp(ra.relM - 1, 0, 100); rb.agravio += 0.3;
      C.Noticias.poner(E, 'politica', `Conflicto por el agua: ${C.DATA.ccaa[a].nombre} y ${C.DATA.ccaa[b].nombre} chocan por el trasvase.`, 'ES'); Es.nota(E, `Conflicto del agua entre ${C.DATA.ccaa[a].nombre} y ${C.DATA.ccaa[b].nombre}.`);
    },
    /* Palancas: cada una devuelve {ok,msg}. k = escala del cargo. */
    palanca(E, id) {
      const s = Es.asegurar(E), k = Es.escala(E), v = s.viv, f = s.fin, en = s.ener, im = s.inm, g = E.paises.ES.gob, J = E.jugador; if (!k) return { ok: false, msg: Es.puede(E) };
      const c = (x) => C.Economia.aplicar(E, 'ES', x); const nota = (m) => { Es.nota(E, m); return { ok: true, msg: m }; };
      switch (id) {
        case 'plan_vivienda': v.oferta = clamp(v.oferta + 7 * k, 0, 100); v.precio = clamp(v.precio - 2 * k, 60, 280); c({ deficit: 0.12 * k }); return nota('Plan de vivienda pública: más oferta asequible y algo de déficit.');
        case 'limitar_turismo': v.turist = clamp(v.turist - 9 * k, 5, 100); v.precio = clamp(v.precio - 2.5 * k, 60, 280); c({ crec: -0.0008 * k }); g.aprob = clamp(g.aprob - 0.3 * k, 5, 90); return nota('Límites a los pisos turísticos: baja la presión sobre los precios, el sector protesta.');
        case 'tope_alquiler': v.tope = 26; v.alquiler = clamp(v.alquiler - 5 * k, 60, 300); g.aprob = clamp(g.aprob + 0.6 * k, 5, 90); return nota('Tope al alquiler: bajan los precios ahora, pero la oferta se resiente en los próximos meses.');
        case 'plan_fiscal': f.shock -= 22 * k; c({ deficit: -0.15 * k, crec: -0.0005 * k }); g.aprob = clamp(g.aprob - 1.2 * k, 5, 90); return nota('Plan de consolidación fiscal: los mercados lo agradecen y el electorado no.');
        case 'reforma_banca': f.bancos = clamp(f.bancos + 8 * k, 0, 100); f.shock -= 8 * k; C.Personaje.cambiar(E, { prestigio: 0.8 }); return nota('Refuerzo de la supervisión bancaria: más solvencia.');
        case 'plan_renovables': en.renov = clamp(en.renov + 5 * k, 0, 95); en.dep = clamp(en.dep - 3 * k, 0, 95); c({ deficit: 0.1 * k }); return nota('Plan de renovables: cae la dependencia energética a medio plazo.');
        case 'subsidio_energia': en.precio = clamp(en.precio - 12 * k, 50, 260); c({ deficit: 0.2 * k }); g.aprob = clamp(g.aprob + 0.9 * k, 5, 90); return nota('Subsidio a la factura: alivio inmediato y déficit.');
        case 'prorrogar_nucleares': en.nuclear = 1; en.precio = clamp(en.precio - 3 * k, 50, 260); E.esp.flags.nuclear = 'prolongar'; C.Opinion.empujeES(E, 'ES_VAP', 0.01); return nota('Prórroga de las nucleares: precio algo menor, malestar ecologista.');
        case 'pacto_agua': for (const x of C.Territorio.ids()) E.esp.ccaa[x].relM = clamp(E.esp.ccaa[x].relM + 0.8, 0, 100); en.sequia = clamp(en.sequia - 6, 0, 100); c({ deficit: 0.06 * k }); return nota('Pacto del agua entre comunidades: se calman los trasvases.');
        case 'acuerdo_marruecos': im.marruecos = clamp(im.marruecos + 12 * k, 0, 100); im.llegadas = clamp(im.llegadas - 8 * k, 20, 300); C.Personaje.cambiar(E, { prestigio: 0.6 }); return nota('Acuerdo de cooperación con Marruecos: bajan las llegadas.');
        case 'cupo_reparto': im.reparto = clamp(im.reparto + 10 * k, 0, 100); for (const x of C.Territorio.ids()) { const rc = E.esp.ccaa[x]; if (rc.gob && !g.coalicion.includes(rc.gob.partido)) rc.relM = clamp(rc.relM - 1.5 * k, 0, 100); } return nota('Reparto obligatorio entre comunidades: baja la tensión, protestan las autonomías afines a la oposición.');
        case 'plan_integracion': im.integ = clamp(im.integ + 8 * k, 0, 100); c({ deficit: 0.06 * k }); return nota('Plan de integración: formación, vivienda y mediación.');
        case 'endurecer_fronteras': im.llegadas = clamp(im.llegadas - 14 * k, 20, 300); im.tension = clamp(im.tension - 2, 0, 100); for (const x of E.paises.ES.partidos) { const p = E.partidos[x]; if (p.soc < -20) C.Opinion.empujeES(E, x, -0.008 * k); } C.Personaje.cambiar(E, { prestigio: J.atrib.integridad > 6 ? -0.8 : 0 }); return nota('Endurecimiento de fronteras: bajan las llegadas, críticas de la izquierda y de las ONG.');
      }
      return { ok: false, msg: 'Medida desconocida' };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 2, grupo: 'nacional', disponible: E => Es.puede(E) }, o));
  const m = (id, nombre, icono, desc, costo) => R({ id, nombre, icono, desc, costo: costo || 2, ejecutar: E => Es.palanca(E, id) });
  m('plan_vivienda', 'Plan de vivienda pública', '🏘️', 'Promueve vivienda asequible: sube la oferta pública y baja algo los precios.');
  m('limitar_turismo', 'Limitar los pisos turísticos', '🧳', 'Regula el alquiler turístico: baja la turistificación y los precios, y enfada al sector.');
  m('tope_alquiler', 'Topar el alquiler', '📉', 'Un tope que baja el alquiler ya, con efecto rebote sobre la oferta.', 1);
  m('plan_fiscal', 'Plan de consolidación fiscal', '🧮', 'Recortes y reformas para tranquilizar a los mercados: baja la prima de riesgo.');
  m('reforma_banca', 'Reforzar la supervisión bancaria', '🏦', 'Más solvencia del sistema financiero.', 1);
  m('plan_renovables', 'Plan de energías renovables', '🌞', 'Inversión en renovables: menos dependencia energética.');
  m('subsidio_energia', 'Subsidiar la factura eléctrica', '💡', 'Alivia el precio de la luz a costa del déficit.', 1);
  m('prorrogar_nucleares', 'Prorrogar las nucleares', '☢️', 'Aplaza el cierre: algo de precio, algo de polémica.', 1);
  m('pacto_agua', 'Pacto del agua', '💧', 'Reúne a las comunidades para repartir recursos hídricos.', 1);
  m('acuerdo_marruecos', 'Acuerdo con Marruecos', '🤝', 'Cooperación migratoria y de seguridad en la frontera sur.');
  m('cupo_reparto', 'Reparto de acogida entre comunidades', '🧭', 'Cupos de acogida para aliviar a Canarias, Ceuta y Melilla.');
  m('plan_integracion', 'Plan de integración', '🎓', 'Formación, vivienda y mediación para facilitar la integración.', 1);
  m('endurecer_fronteras', 'Endurecer el control de fronteras', '🚧', 'Más vigilancia y devoluciones: bajan las llegadas, suben las críticas.');
  R({ id: 'resolver_crisis_bancaria', nombre: 'Resolver una crisis bancaria', icono: '🏦', desc: 'Rescate, fusión o liquidación de la entidad en apuros.', disponible: E => { const g = E.paises.ES.gob; return E.jugador.pais === 'ES' && g.pm === 'J' ? (Es.asegurar(E).fin.crisis ? true : 'No hay ninguna entidad en crisis') : 'Sólo el presidente del Gobierno'; }, ejecutar: (E, a) => Es.resolverBanco(E, a.k) });
  C.Tiempo.registrar('estructural', { turno: Es.turno }, 50);
})(window.ESP);

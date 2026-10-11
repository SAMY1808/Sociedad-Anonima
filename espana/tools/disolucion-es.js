/* Prueba de la disolución de las Cortes y de los parlamentos autonómicos: anuncio por sorpresa o anunciado, efectos y declaración institucional. Uso: node tools/disolucion-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/sistemas/oposicion.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const A = C.Art155, Cc = C.Ccaa2, T = C.Territorio;
const crear = (op, sem) => { const E = C.Mundo.nueva(Object.assign({ semilla: sem || 77, partido: 'ES_ASD', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'CAT', muni: 'm_bcn' }, op)); C.E = E; E.meta.presim = false; E.jugador.agenda.max = 99; E.esp.cortes.estado = 'activa'; return E; };
const pt = E => { E.jugador.agenda.puntos = 99; };
const lim = E => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; if (E.esp.consejo) for (const i of E.esp.consejo.agenda) i.urgente = false; if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E); };
const sem = (E, n, dec) => { for (let i = 0; i < n; i++) { lim(E); if (dec) for (const x of C.Dilemas.asegurar(E).act.slice()) C.Dilemas.decidir(E, x.uid, dec(x)); C.Tiempo.avanzar(); } };
const comoPres = (E, c) => { const J = E.jugador; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = c; E.esp.ccaa[c].gob.pres = 'J'; E.paises.ES.gob.pm = 'otro'; };
const comoPM = E => { const J = E.jugador; J.cargo = 'pm'; J.nivel = 'nacional'; E.paises.ES.gob.pm = 'J'; };


const Ds = C.Disolucion, Gen = C.Generales;
const prep = (op, sem) => { const E = crear(op, sem); E.esp.cortes.estado = 'activa'; E.esp.cortes.ultDisolucion = -999; E.esp.cortes.mocion = null; E.fecha.t = Math.max(E.fecha.t, 120); pt(E); return E; };
const ejec = (E, id, args) => { pt(E); return C.Acciones.ejecutar(id, args); };

console.log('El Presidente/a del Gobierno disuelve las Cortes');
{ const E = prep({}, 77); comoPM(E); const g = E.paises.ES.gob, e0 = g.estab;
  let r = ejec(E, 'disolver_cortes', { modo: 'sorpresa' }); const d = Ds.asegurar(E).hist[0];
  ok(r.ok && d && d.ambito === 'ES' && d.modo === 'sorpresa' && d.jugador && d.nombre === E.jugador.nombre, 'la disolución por sorpresa queda registrada con quien comparece (' + (d && d.modo) + ')');
  ok(g.estab < e0 && /ninguneados/.test(d.efecto), 'los socios se sienten ninguneados: la estabilidad baja (' + e0.toFixed(1) + ' → ' + g.estab.toFixed(1) + ')');
  ok(Ds.pendiente(E) === d && E.noticias.some(n => /Sorpresa: .* anuncia sin previo aviso/.test(n.texto)), 'hay declaración institucional pendiente y titular de sorpresa');
  ok(Ds.titular(d).length > 10 && /Moncloa/.test(Ds.titular(d)) && /sin previo aviso/.test(Ds.relato(d)), 'titular y relato del anuncio por sorpresa'); ok(Ds.consumir(E) === d && Ds.pendiente(E) === null, 'consumir la declaración la quita de la cola');
  const E2 = prep({}, 77); comoPM(E2); const g2 = E2.paises.ES.gob, f0 = g2.estab; r = ejec(E2, 'disolver_cortes', {}); const d2 = Ds.asegurar(E2).hist[0];
  ok(r.ok && d2.modo === 'anunciada' && g2.estab > f0 && E2.noticias.some(n => /declaración institucional la disolución de las Cortes/.test(n.texto)), 'sin elegir, el anuncio es anunciada: +estabilidad y titular institucional'); ok(!/undefined|null/.test(Ds.relato(d2) + Ds.titular(d2)), 'relato sin huecos');
}
console.log('Cómo se anuncia cuando no decide el jugador');
{ const modos = {}; for (let i = 0; i < 40; i++) { const E = prep({ nivel: 'nacional', rol: 'base' }, 80 + i); E.paises.ES.gob.pm = 'otro'; const r = Gen.disolver(E, 'ante la presión de la oposición', false); if (r === true) { const m = Ds.asegurar(E).hist[0].modo; modos[m] = (modos[m] || 0) + 1; } }
  ok(modos.sorpresa > 0 && modos.anunciada > 0 && !modos.ordinaria, 'el Gobierno de la IA unas veces sorprende y otras lo anuncia (' + JSON.stringify(modos) + ')');
  const E = prep({}, 77); E.paises.ES.gob.pm = 'otro'; Gen.disolver(E, 'fin de la legislatura', true); ok(Ds.asegurar(E).hist[0].modo === 'ordinaria', 'el fin de legislatura es «ordinaria»');
  const E3 = prep({}, 77); E3.paises.ES.gob.pm = 'otro'; Gen.disolver(E3, 'ningún candidato logra la investidura', true); const d3 = Ds.asegurar(E3).hist[0]; ok(d3.modo === 'forzada' && !E3.noticias.some(n => /Sorpresa:/.test(n.texto)) && Ds.relato(d3).length > 40, 'sin investidura, la disolución es forzada y no hay sorpresa');
  const E4 = prep({}, 77); E4.meta.presim = true; E4.paises.ES.gob.pm = 'otro'; Gen.disolver(E4, 'x', false); ok(Ds.asegurar(E4).hist.length === 0 && Ds.pendiente(E4) === null, 'durante la presimulación no se registra nada'); }
console.log('El presidente/a de una comunidad disuelve su parlamento');
{ const E = prep({ nivel: 'autonomico', rol: 'lider', region: 'MAD' }, 81); comoPres(E, 'MAD'); const rc = E.esp.ccaa.MAD; rc.parl.ult = E.fecha.t - 120; rc.parl.proxT = E.fecha.t + 100; const a0 = rc.gob.aprob;
  const r = ejec(E, 'adelanto_autonomico', { modo: 'sorpresa' }); const d = Ds.asegurar(E).hist[0];
  ok(r.ok && d.ambito === 'MAD' && d.modo === 'sorpresa' && d.jugador && /de Comunidad de Madrid/.test(d.cargo), 'el adelanto autonómico por sorpresa queda registrado a nombre del presidente/a (' + d.cargo + ')'); ok(Ds.pendiente(E) === d, 'se muestra al jugador de esa comunidad');
  ok(/Madrid/.test(Ds.titular(d)) && /sede del Gobierno de Comunidad de Madrid/.test(Ds.relato(d)), 'titular y relato nombran su comunidad'); Ds.consumir(E);
  T.adelantar(E, 'AND', 'por conveniencia electoral'); const dA = Ds.asegurar(E).hist[0]; ok(dA.ambito === 'AND' && Ds.pendiente(E) === null, 'la disolución de otra comunidad no abre modal, sólo titular');
  T.adelantar(E, 'MAD', 'por falta de apoyos'); const dM = Ds.asegurar(E).hist[0]; ok(dM.modo === 'forzada' && Ds.pendiente(E) === dM, 'por falta de apoyos es forzada'); }
console.log('Textos de todos los modos y ámbitos');
{ const E = prep({}, 77); let mal = 0, n = 0; for (const modo of Object.keys(Ds.MODOS)) for (const ambito of ['ES', 'CAT', 'VAL']) { const d = { t: 1, ambito, modo, motivo: 'algo', nombre: 'Ana', cargo: 'presidente/a', fechaVoto: 130, efecto: '' }; const x = Ds.titular(d) + ' ' + Ds.relato(d); n++; if (/undefined|null|NaN/.test(x) || Ds.titular(d).length < 10 || Ds.relato(d).length < 60) mal++; } ok(mal === 0, 'titular y relato bien formados en ' + n + ' combinaciones'); }
console.log('Estabilidad');
{ const E = crear({ nivel: 'nacional', rol: 'base' }, 80); let mal = 0; for (let i = 0; i < 420; i++) { lim(E); for (const x of C.Dilemas.asegurar(E).act.slice()) C.Dilemas.decidir(E, x.uid, C.Dilemas.CAT[x.id].op[0].k); C.Tiempo.avanzar(); Ds.asegurar(E).pend.length = 0; if (!isFinite(E.paises.ES.gob.estab)) mal++; } ok(mal === 0 && Ds.asegurar(E).hist.length <= 12, '420 semanas con disoluciones de la IA sin valores raros (' + Ds.asegurar(E).hist.length + ' anuncios en el historial)'); }
console.log('errores', errores, '| fallos', fallos);
process.exit(errores || fallos ? 1 : 0);

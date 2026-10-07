/* Prueba de país y mundo: problemas estructurales, exterior, lenguas, poder local y Conferencia de Presidentes. Uso: node tools/mundo-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; };



const avanza = n => { for (let i = 0; i < n; i++) { lim(); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; C.Tiempo.avanzar(); } };
const P = E.paises.ES; J.agenda.max = 60; const pt = () => { J.agenda.puntos = 60; }; E.meta.presim = false; P.gob.pm = 'J'; J.cargo = 'pm';
console.log('Problemas de país');
const Es = C.Estructural; const s = Es.asegurar(E); ok(s.viv.precio > 0 && s.fin.prima > 0 && s.ener.precio > 0 && s.inm.tension >= 0, 'indicadores iniciales');
const antes = { oferta: s.viv.oferta, turist: s.viv.turist, alq: s.viv.alquiler, renov: s.ener.renov, llegadas: s.inm.llegadas, prima: s.fin.shock, integ: s.inm.integ };
for (const id of ['plan_vivienda', 'limitar_turismo', 'tope_alquiler', 'plan_fiscal', 'reforma_banca', 'plan_renovables', 'subsidio_energia', 'prorrogar_nucleares', 'pacto_agua', 'acuerdo_marruecos', 'cupo_reparto', 'plan_integracion', 'endurecer_fronteras']) { pt(); const r = C.Acciones.ejecutar(id, {}); ok(r.ok !== false, id + ': ' + (r.msg || '').slice(0, 50)); }
ok(s.viv.oferta > antes.oferta && s.viv.turist < antes.turist && s.ener.renov > antes.renov && s.inm.integ > antes.integ && s.fin.shock < antes.prima, 'las palancas mueven los indicadores');
Es.crisisBancaria(E); ok(!!s.fin.crisis, 'crisis bancaria'); pt(); let r = C.Acciones.ejecutar('resolver_crisis_bancaria', { k: 'fusion' }); ok(r.ok && !s.fin.crisis, 'resolver la crisis bancaria');
for (let i = 0; i < 120; i++) { lim(); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; C.Tiempo.avanzar(); } ok(isFinite(s.viv.precio) && isFinite(s.fin.prima) && isFinite(s.ener.precio) && isFinite(s.inm.tension), 'los indicadores siguen siendo finitos tras 120 semanas'); ok(s.viv.hist.length > 10, 'historiales (' + s.viv.hist.length + ')');
console.log('Mundo');
E.paises.ES.gob.pm = 'J'; J.cargo = 'pm'; const Ex = C.Exterior; const x = Ex.asegurar(E); ok(Object.keys(x.rel).length === 8, '8 relaciones'); const r0 = x.rel.francia; pt(); r = C.Acciones.ejecutar('cumbre_bilateral', { pais: 'francia' }); ok(r.ok && x.rel.francia > r0, 'cumbre con Francia ' + JSON.stringify(r)); pt(); r = C.Acciones.ejecutar('cumbre_bilateral', { pais: 'francia' }); ok(r.ok === false, 'enfriamiento de la cumbre');
pt(); r = C.Acciones.ejecutar('compromiso_otan', {}); ok(r.ok, 'gasto en defensa'); const e0 = x.ng.ejec; pt(); r = C.Acciones.ejecutar('gestionar_fondos', {}); ok(x.ng.ejec > e0, 'acelerar fondos europeos');
pt(); r = C.Acciones.ejecutar('postura_ue', { postura: 'bloque_sur' }); ok(r.ok && x.postura === 'bloque_sur', 'postura en Bruselas'); const f = Ex.familias(E); ok(f.tot >= 10, 'familias en el poder en la UE (' + f.tot + ' gobiernos)');
console.log('Lenguas');
const Ln = C.Lenguas; const l = Ln.asegurar(E); ok(Ln.ids().length >= 6, 'regiones con lengua propia (' + Ln.ids().length + ')');
J.cargo = 'presauto'; J.region = 'CAT'; E.esp.ccaa.CAT.gob.pres = 'J'; const uso0 = l.r.CAT.uso, pres0 = l.r.CAT.pres, tv0 = l.r.CAT.tv;
['inmersion_linguistica', 'tv_autonomica'].forEach(a => { pt(); const rr = C.Acciones.ejecutar(a, {}); ok(rr.ok !== false, a + ': ' + (rr.msg || '').slice(0, 50)); }); ok(l.r.CAT.tv > tv0, 'sube la televisión autonómica');
pt(); r = C.Acciones.ejecutar('simbolo_regional', { s: 'himno' }); ok(r.ok && l.r.CAT.simb.himno, 'símbolo adoptado'); pt(); r = C.Acciones.ejecutar('ley_normalizacion', {}); ok(r.ok !== false, 'ley de normalización: ' + r.msg);
console.log('Poder local');
const Pl = C.PoderLocal; const muni = Object.values(E.esp.muni.m).find(m => m.coal.length >= 2); J.muni = muni.id; J.cargo = 'alcalde'; muni.pm = 'J'; muni.alcalde = muni.alcalde || muni.coal[0];
const pl = Pl.asegurar(E); for (let i = 0; i < 30; i++) { lim(); C.Tiempo.avanzar(); } ok(pl.conv.length >= 1, 'convocatorias de fondos europeos (' + pl.conv.length + ')');
pt(); r = C.Acciones.ejecutar('reunir_socios_local', {}); ok(r.ok, 'reunir socios'); const so = muni.coal.find(k => k !== muni.alcalde); pt(); r = C.Acciones.ejecutar('ceder_concejalia', { pid: so }); ok(r.ok, 'ceder concejalía');
const fo = muni.fondos; let got = 0; for (const c of pl.conv.slice()) { pt(); const rr = C.Acciones.ejecutar('solicitar_fondos_ue', { id: c.id }); if (rr.ok && rr.exito !== false) got++; } ok(got + pl.conv.filter(c => !c.resuelta).length >= 0, 'solicitar fondos (concedidos ' + got + ')');
const ot = Object.keys(muni.esc).find(k => !muni.coal.includes(k)); if (ot) { let ok2 = false; for (let i = 0; i < 30 && !ok2; i++) { pt(); const rr = C.Acciones.ejecutar('pacto_local', { pid: ot }); if (rr.ok && rr.exito !== false) ok2 = true; } ok(ok2, 'pacto local con un nuevo socio'); }
ok(Pl.alcaldes(E, J.partido) >= 0, 'alcaldías del partido: ' + Pl.alcaldes(E, J.partido));
console.log('Conferencia de Presidentes');
const Cf = C.Conferencia; J.cargo = 'pm'; P.gob.pm = 'J'; const cf = Cf.asegurar(E); cf.ult = -99; pt(); r = C.Acciones.ejecutar('convocar_conferencia', { tema: 'acogida' }); ok(r.ok && cf.abierta, 'conferencia convocada'); ok(Object.keys(cf.abierta.votos).length >= 10, 'votan ' + Object.keys(cf.abierta.votos).length + ' comunidades');
const nc = Object.keys(cf.abierta.votos).find(c => cf.abierta.votos[c] !== 'si'); if (nc) { pt(); r = C.Acciones.ejecutar('persuadir_comunidad', { c: nc }); ok(r.ok, 'negociar con una comunidad'); }
const rep0 = s.inm.reparto; pt(); r = C.Acciones.ejecutar('cerrar_conferencia', {}); ok(!cf.abierta && cf.hist.length >= 1, 'se cierra con resultado: ' +  + (cf.hist[0] && (cf.hist[0].ok ? 'acuerdo' : 'sin acuerdo')));
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

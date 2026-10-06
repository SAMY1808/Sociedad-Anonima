/* Prueba de autogobierno: presión por competencias y reforma del Estatuto por artículos. Uso: node tools/autogob-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({ nivel: 'autonomico', region: 'ARA', rol: 'direccion' }), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; };


const T = C.Territorio, c = 'ARA', rc = E.esp.ccaa[c];
// El jugador preside Aragón
rc.gob.pres = 'J'; J.cargo = 'presauto'; J.region = c; J.escReg = true; J.prestigio = 60; J.agenda.puntos = 40; J.agenda.max = 40;
const pt = () => { J.agenda.puntos = 40; };
console.log('Competencias');
const k = Object.keys(C.DATA.competencias).find(x => rc.comp[x] < 2 && !C.DATA.competencias[x].ley);
const e0 = T.estadoComp(E, c, k); ok(e0.f === 'libre' || e0.f === 'hecho', 'estado inicial de ' + k + ': ' + e0.txt);
const p0 = T.probComp(E, c, k);
let r; for (const v of Object.keys(T.VIAS)) { pt(); r = C.Acciones.ejecutar('presionar_competencia', { comp: k, via: v }); console.log('   vía', v, r.ok !== false ? 'ok' : r.msg); }
ok(T.probComp(E, c, k) > p0, 'la presión sube la probabilidad (' + Math.round(p0 * 100) + ' → ' + Math.round(T.probComp(E, c, k) * 100) + ' %)');
pt(); r = C.Acciones.ejecutar('presionar_competencia', { comp: k, via: 'bilateral' }); console.log('   r', JSON.stringify(r)); ok(r.ok === false && /hace poco/.test(r.msg), 'enfriamiento de la vía');
pt(); r = C.Acciones.ejecutar('reclamar_competencia', { comp: k }); ok(r.ok, 'reclamación: ' + (r.msg || ''));
ok(T.estadoComp(E, c, k).f === 'consejo', 'se puede verificar: ' + T.estadoComp(E, c, k).txt);
console.log('Reforma del Estatuto');
rc.estatuto.proceso = null; rc.estatuto.ultReforma = -99; pt();
r = C.Acciones.ejecutar('abrir_reforma_estatuto', {}); ok(r.ok, 'borrador abierto');
const cat = T.catalogoReforma(E, c); ok(cat.length > 15, 'catálogo de ' + cat.length + ' artículos');
pt(); r = C.Acciones.ejecutar('presentar_reforma_estatuto', {}); ok(r.ok === false && /dos artículos/.test(r.msg), 'se exigen artículos');
['carta', 'inversion', 'lengua', 'comp_' + Object.keys(C.DATA.competencias).find(x => rc.comp[x] < 2 && C.DATA.competencias[x].dif < 0.3)].forEach(id => ok(T.marcarArticulo(E, c, id).ok, 'incluye ' + id));
// Parlamento: todos a favor para el test
rc.parl.escanos = Object.fromEntries(Object.keys(rc.parl.escanos).map(x => [x, rc.parl.escanos[x]])); const a = T.apoyoReforma(E, c, T.reformaActiva(E, c).items.map(x => x.id)); console.log('   apoyo previsto', a.si, '/', a.tot, 'req', a.req);
let fase = null; for (let i = 0; i < 8 && fase !== 'comision'; i++) { pt(); E.fecha.t += 5; r = T.votarParlamento(E, c); fase = T.reformaActiva(E, c).fase; }
ok(fase === 'comision', 'el Parlamento aprueba y se abre la negociación (' + (r.msg || '').slice(0, 60) + ')');
const rf = T.reformaActiva(E, c); console.log('   estados', rf.items.map(x => x.id + ':' + x.estado).join(' '));
const mal = rf.items.find(x => ['recortado', 'rechazado'].includes(x.estado)); if (mal) { pt(); r = C.Acciones.ejecutar('insistir_articulo', { id: mal.id }); ok(r.ok !== false, 'insistir: ' + r.msg); }
const ced = rf.items.find(x => x.estado === 'rechazado'); if (ced) ok(T.ceder(E, c, ced.id).ok, 'ceder un artículo');
rf.items.forEach(x => { if (['pedido', 'rechazado'].includes(x.estado)) x.estado = 'aceptado'; });
pt(); r = C.Acciones.ejecutar('cerrar_acuerdo_estatuto', {}); ok(r.ok, 'acuerdo remitido a las Cortes: ' + r.msg);
ok(rf.fase === 'cortes' && E.proyectos[rf.propId].estIt.length >= 2, 'el proyecto llega al Congreso con sus artículos');
// Saltamos las Cortes: la ley se aprueba
const p = E.proyectos[rf.propId]; p.etapa = 'sancionada'; C.Impacto && 0;
const tpl = C.Congreso.plantilla(p.tpl); rc.pend.push({ tipo: 'refer_estatuto', t: E.fecha.t + 1, aut: 5, tpl: p.tpl, t0: E.fecha.t, estIt: p.estIt }); rc.estatuto.proceso = { fase: 'referendum', t: E.fecha.t };
rc.relM = 95; rc.gob.aprob = 80; const comp0 = Object.keys(C.DATA.competencias).filter(x => rc.comp[x] === 2).length;
for (let i = 0; i < 40 && rf.fase !== 'cerrada'; i++) { lim(); C.Tiempo.avanzar(); }
ok(rf.fase === 'cerrada', 'el proceso termina: ' + rf.fase + ' ' + rf.res + ' proceso ' + JSON.stringify(rc.estatuto.proceso) + ' ratif ' + rc.estatuto.ratif);
console.log('   historial:', rf.hist.slice(0, 5).map(x => x.txt).join(' | '));
console.log('Recurso ante el TC');
{ const c2 = 'CAT', r2 = E.esp.ccaa[c2]; let anul = 0, n = 0;
  for (let i = 0; i < 25; i++) { r2.estatuto.reforma = { fase: 'tc', items: ['consulta', 'nacionalidad', 'financ', 'comp_pol'].map(id => ({ id, estado: 'aceptado', ins: 0 })), ronda: 3, t: 0, tFase: E.fecha.t, tTC: E.fecha.t, hist: [], ultParl: -99 }; r2.estatuto.items = ['consulta', 'nacionalidad', 'financ']; r2.comp.pol = 2; T.estTurno(E, c2); n++; if (r2.estatuto.reforma.anulados && r2.estatuto.reforma.anulados.length) anul++; }
  ok(anul > 0 && anul < n, 'el TC anula artículos en parte de los casos (' + anul + '/' + n + ')'); }
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

/* Prueba de extras: tertulias y sondeos, guía, balance de legislatura, ajustes, escenarios y partido propio. Uso: node tools/extras-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; };




const avanza = (E, n) => { for (let i = 0; i < n; i++) { lim(E); E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (E.esp.gab) E.esp.gab.escandalo = null; C.Tiempo.avanzar(); } };
const P = E.paises.ES; J.agenda.max = 60; const pt = () => { J.agenda.puntos = 60; }; E.meta.presim = false;
console.log('Tertulias y sondeos');
const Md = C.Medios; const tn = Md.tendencias(E); ok(Array.isArray(tn), 'tendencias (' + tn.length + ')'); const te = Md.tertulias(E); ok(te.length === 8 || tn.length === 0, 'una tertulia por medio'); pt(); let r = C.Acciones.ejecutar('encuesta_privada', {}); ok(r.ok && Md.asegurar(E).priv && Object.keys(Md.asegurar(E).priv.votos).length > 5, 'sondeo privado');
console.log('Guía');
const Gd = C.Guia; const sg = Gd.sugerencias(E); ok(sg.length >= 1 && sg.every(x => x.txt), 'sugerencias del asesor (' + sg.length + ')'); E.ui.vis = { agenda: 1, leyes: 1 }; ok(Gd.progreso(E).n === 2 && Gd.MAPA.length >= 15, 'progreso de exploración');
console.log('Balance de legislatura');
const Lg = C.Legado; const b = Lg.balance(E); ok(b.rows.length >= 4 && b.prom.length === 4 && typeof b.nota === 'string', 'balance: ' + b.nota + ' (' + b.pts + ') con ' + b.prom.map(p => p.k).join(','));
avanza(E, 60); const b2 = Lg.balance(E); ok(isFinite(b2.pts), 'el balance se actualiza');
console.log('Ajustes');
const Aj = C.Ajustes; ok(Aj.get(E).dif === 'normal', 'dificultad normal por defecto'); const m0 = C.Personaje.maxAgenda(E); Aj.fijar(E, 'dif', 'facil'); ok(C.Personaje.maxAgenda(E) === m0 + 1, 'fácil: +1 de agenda'); Aj.fijar(E, 'dif', 'dificil'); ok(C.Personaje.maxAgenda(E) === m0 - 1, 'difícil: −1 de agenda'); ok(Aj.fijar(E, 'eventos', 1.5) && Aj.get(E).eventos === 1.5, 'frecuencia de sucesos'); Aj.fijar(E, 'dif', 'normal'); Aj.fijar(E, 'eventos', 1);
console.log('Escenarios');
for (const [id] of C.Escenarios.LISTA) { const E2 = crear({ semilla: 77 }); const l2 = () => { E2.eventos.pendientes.length = 0; E2.parl.pendienteVoto.length = 0; E2.ue.pendiente.length = 0; E2.esp.pendienteGabinete = null; E2.esp.pendienteInvAut = null; E2.esp.pendienteVotoAut = null; E2.esp.pendienteConvAut = null; E2.esp.pendienteInvestidura = false; E2.esp.pendienteSocio = false; E2.esp.pendienteDebate = false; E2.elecciones.nochePendiente = E2.elecciones.presPendiente = E2.elecciones.pePendiente = null; if (E2.esp.gab) E2.esp.gab.escandalo = null; };
  C.E = E2; C.Escenarios.aplicar(E2, id); const pops = E2.paises.ES.partidos.map(k => E2.partidos[k].pop); let fin = pops.every(isFinite); for (let i = 0; i < 25; i++) { l2(); C.Tiempo.avanzar(); } ok(fin && E2.paises.ES.partidos.every(k => isFinite(E2.partidos[k].pop)), 'escenario ' + id + ' arranca y avanza 25 semanas'); }
C.E = E;
console.log('Partido propio');
const E3 = crear({ semilla: 5, pais: 'ES', partido: undefined, rol: 'lider', nuevo: { nombre: 'Aragón Futura', sigla: 'AFU', eco: -10, soc: -20, eu: 30, ter: 5, color: '#16A085', arq: 'cen', logo: '🌿', fin: 'potente', implant: ['ARA'] } });
const pa = E3.partidos.ES_AFU; ok(pa && pa.logo === '🌿' && pa.finanzas === 68 && pa.militantes === 12000, 'logo, financiación y militancia del partido nuevo'); const pnA = E3.esp.pn.ZAR || E3.esp.pn[Object.keys(C.DATA.provincias).find(p => C.DATA.provincias[p][1] === 'ARA')]; const pnM = E3.esp.pn[Object.keys(C.DATA.provincias).find(p => C.DATA.provincias[p][1] === 'MAD')];
ok(pnA.ES_AFU > pnM.ES_AFU, 'implantación territorial: más fuerte en Aragón que en Madrid (' + pnA.ES_AFU.toFixed(2) + ' vs ' + pnM.ES_AFU.toFixed(2) + ')');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

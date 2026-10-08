/* Prueba de renuncia a cargos (concejal, diputado/a autonómico/a y nacional, presidencias). Uso: node tools/renuncia-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 81, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const sim = E => { for (let i = 0; i < 20; i++) { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.elecciones.nochePendiente = null; C.Tiempo.avanzar(); } };
const prueba = (nombre, o, esperado) => {
  console.log(nombre);
  const E = crear(o), J = E.jugador;
  const ops = C.Personaje.cargosRenunciables(E);
  console.log('  cargo', J.cargo, '| renunciables:', ops.map(x => x.k).join(','));
  ok(ops.some(x => x.k === esperado), 'puede renunciar a ' + esperado);
  const pre = J.prestigio;
  const r = C.Acciones.ejecutar('renunciar_cargo', { k: esperado });
  ok(r.ok, r.msg);
  ok(!C.Personaje.cargosRenunciables(E).some(x => x.k === esperado), 'el cargo ya no figura');
  ok(J.prestigio < pre, 'baja el prestigio');
  console.log('  cargo ahora:', J.cargo, J.rol);
  sim(E); console.log('  tras 20 semanas:', J.cargo);
  return E;
};
let E = prueba('Concejal', { nivel: 'local', rol: 'direccion', muni: Object.values(crear({ nivel: 'nacional' }).esp.muni.m).find(m => m.ccaa === 'MAD').id }, 'concejal');
E = prueba('Diputado/a autonómico/a', { nivel: 'autonomico', rol: 'direccion' }, 'dipauto');
E = prueba('Diputado/a nacional', { nivel: 'nacional', rol: 'lider', partido: 'ES_UPC' }, 'diputado');
E = prueba('Presidente/a autonómico/a', { nivel: 'autonomico', rol: 'lider', partido: 'ES_UPC' }, 'presauto');
E = prueba('Líder nacional (pm si gobierna)', { nivel: 'nacional', rol: 'lider', partido: crear({ nivel: 'nacional' }).paises.ES.gob.partido }, 'pm');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

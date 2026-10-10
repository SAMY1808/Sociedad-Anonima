/* Prueba del foco por cargo: simula un perfil de cada ámbito y comprueba que sólo llegan al jugador decisiones de su nivel. Uso: node tools/foco-es.js [semillas] [semanas] */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const PRUEBAS = []; let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const sembar = +process.argv[2] || 2, sem = +process.argv[3] || 260;
const PERFILES = [['nac-lider', { nivel: 'nacional', rol: 'lider' }], ['nac-base', { nivel: 'nacional', rol: 'base' }], ['aut-base', { nivel: 'autonomico', region: 'MAD', rol: 'base' }], ['aut-lider', { nivel: 'autonomico', region: 'CAT', rol: 'lider' }], ['local-base', { nivel: 'local', muni: 'm_mad', rol: 'base' }], ['local-lider', { nivel: 'local', muni: 'm_bcn', rol: 'lider' }]];
for (const [nombre, op] of PERFILES) {
  const cuenta = {}, add = (cargo, k) => { (cuenta[cargo] = cuenta[cargo] || {})[k] = (cuenta[cargo][k] || 0) + 1; };
  for (let s = 0; s < sembar; s++) {
    let E; try { E = C.Mundo.nueva(Object.assign({ semilla: 20 + s, partido: 'ES_ASD', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES' }, op)); } catch (e) { console.log(nombre, 'no se pudo crear', e.message); break; }
    C.E = E; E.meta.presim = false; const J = E.jugador, P = E.paises.ES; const vistos = new Set();
    for (let i = 0; i < sem; i++) {
      let g = 0;
      while (C.Tiempo.bloqueo() && g++ < 20) {
        const b = C.Tiempo.bloqueo(), cg = J.cargo; let k = b;
        if (E.esp.pendienteSesion) { k = 'sesion:' + E.esp.pendienteSesion.tipo; C.Sesion.resolverAuto(E, U.rf(-0.5, 0.8)); }
        else if (b === 'evento' && E.esp.pendienteCongreso) { k = 'congreso-partido'; C.PartidoInt.congreso(E, { bonus: U.ri(0, 6) }); }
        else if (b === 'evento' && E.esp.pendienteCrisisV) { const cr = C.CrisisDirecto.asegurar(E).act.find(x => x.uid === E.esp.pendienteCrisisV); if (!cr) { E.esp.pendienteCrisisV = null; continue; } k = 'crisisV:' + cr.a; const sc = C.CrisisDirecto.cat(cr.id); while (cr.paso < sc.pasos.length) C.CrisisDirecto.elegir(E, cr, U.pick(sc.pasos[cr.paso][4])[0]); C.CrisisDirecto.cerrar(E, cr); E.esp.pendienteCrisisV = null; }
        else if (b === 'evento' && E.esp.pendienteDebate) { k = 'debate'; C.Campana.celebrarDebate(E, U.pick(['ataque', 'propuestas', 'prudente'])); }
        else if (b === 'evento') { const ev = E.eventos.pendientes[0]; k = 'evento:' + (ev.key || 'info'); if (ev.key && !C.Foco.evento(E, ev.key)) add(cg, 'VIOLA:evento:' + ev.key); C.Eventos.resolver(E, 0, U.ri(0, Math.max(0, ev.opciones.length - 1))); }
        else if (b === 'voto' && E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; k = 'votoAut:' + pv.c; C.Territorio.votarLey(E, pv.c, C.Territorio.leyAut(E, pv.c, pv.id), U.pick(['si', 'abs', 'no'])); }
        else if (b === 'voto' && E.esp.pendienteConvAut) { k = 'convAut'; const pc = E.esp.pendienteConvAut, d = C.Territorio.rdlAut(E, pc.c, pc.id); if (d) C.Territorio.convalidar(E, pc.c, d, U.pick(['si', 'no', 'abs'])); else E.esp.pendienteConvAut = null; }
        else if (b === 'voto') { k = 'votoCongreso'; const id = E.parl.pendienteVoto.shift(); const p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, U.pick(['si', 'no', 'abs'])); }
        else if (b === 'ue') { k = 'ue'; C.UE.decidir(E, 0, U.pick(['si', 'no', 'abs'])); }
        else if (b === 'noche') { const n = E.elecciones.nochePendiente || E.elecciones.pePendiente || E.elecciones.presPendiente; k = 'noche:' + ((n && (n.tipo || n.pais)) || 'x'); E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; }
        else if (b === 'investidura') { const pa = E.esp.pendienteInvAut; k = 'investidura:' + (pa ? pa.c : (E.esp.pendienteSocio ? 'socio' : 'x')); if (pa && pa.c === 'ES') { const cs = C.Ejecutivo.candidatosInv(E); C.Ejecutivo.nominarJugador(E, U.pick(cs).p); } else if (pa) { E.esp.pendienteInvAut = null; } else { E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; } }
        else if (b === 'gabinete') { k = 'gabinete:' + E.esp.pendienteGabinete.key; C.Gabinete.confirmar(E, E.esp.pendienteGabinete.key); E.esp.pendienteGabinete = null; }
        else if (b === 'escandalo') { E.esp.gab.escandalo = null; }
        else if (b === 'consejo') { k = 'consejo'; const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, U.pick(ops).k); }
        else break;
        add(cg, k);
      }
      for (const x of C.Dilemas.asegurar(E).act.slice()) { if (!vistos.has(x.uid)) { vistos.add(x.uid); add(J.cargo, 'dilema:' + x.id); if (!C.Foco.dilema(E, x.id)) add(J.cargo, 'VIOLA:dilema:' + x.id); } C.Dilemas.decidir(E, x.uid, C.Dilemas.CAT[x.id].op[0].k); }
      C.Tiempo.avanzar();
    }
  }
  PRUEBAS.push([nombre, cuenta]);
}

const AMB = { pm: 'central', vicepres: 'central', ministro: 'central', diputado: 'central', senador: 'central', activista: 'central', mep: 'central', presauto: 'aut', consejero: 'aut', dipauto: 'aut', alcalde: 'local', concejal: 'local' };
const PROHIBIDO = {
  central: /^(VIOLA|noche:locales|votoAut|convAut|crisisV:(aut|mun))/,
  aut: /^(VIOLA|noche:(generales|ES)|ue$|votoCongreso|crisisV:(nac|mun))/,
  local: /^(VIOLA|noche:(generales|ES)|ue$|votoCongreso|votoAut|convAut|crisisV:(nac|aut))/
};
for (const [nombre, cuenta] of PRUEBAS) {
  let malos = [], total = 0;
  for (const cg of Object.keys(cuenta)) { const am = AMB[cg]; if (!am) continue; for (const k of Object.keys(cuenta[cg])) { total += cuenta[cg][k]; if (PROHIBIDO[am].test(k)) malos.push(cg + ':' + k + '×' + cuenta[cg][k]); } }
  ok(total > 0 && malos.length === 0, nombre + ': ' + total + ' decisiones de su nivel' + (malos.length ? ' · FUERA DE NIVEL: ' + malos.join(', ') : ''));
}
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

/* Prueba del procedimiento de investidura (autonómico y central): fuerza elecciones, resuelve las decisiones del jugador y comprueba el calendario.
   Uso: node tools/invest-es.js [semilla] [partido] [rol] [region] */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
const arg = process.argv.slice(2);
const E = C.Mundo.nueva({ semilla: +arg[0] || 31, partido: arg[1] || 'ES_ASD', nivel: 'autonomico', rol: arg[2] || 'direccion', region: arg[3] || 'MAD', muni: null, nombre: 'Test', g: 'm', edad: 40 });
const J = E.jugador, T = C.Territorio, c = J.region, rc = E.esp.ccaa[c];
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const log = []; const np = C.Noticias.poner; C.Noticias.poner = (E2, t, x, p) => { log.push(U.fmtT(E2.fecha.t) + ' ' + x); return np(E2, t, x, p); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const resolver = () => { let g = 0; while (C.Tiempo.bloqueo() && g++ < 30) { const b = C.Tiempo.bloqueo();
  if (b === 'evento') { const ev = E.eventos.pendientes[0]; C.Eventos.resolver(E, 0, 0); }
  else if (b === 'voto' && E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; T.votarLey(E, pv.c, T.leyAut(E, pv.c, pv.id), 'abs'); }
  else if (b === 'voto' && E.esp.pendienteConvAut) { const pc = E.esp.pendienteConvAut, d = T.rdlAut(E, pc.c, pc.id); if (d) T.convalidar(E, pc.c, d, 'abs'); else E.esp.pendienteConvAut = null; }
  else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); const p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, 'abs'); }
  else if (b === 'ue') C.UE.decidir(E, 0, 'abs');
  else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; }
  else if (b === 'investidura') { const pa = E.esp.pendienteInvAut; if (pa) { E.__dec = (E.__dec || []).concat(pa.tipo + ':' + pa.c); if (pa.c === 'ES') C.Ejecutivo.nominarJugador(E, C.Ejecutivo.candidatosInv(E)[0].p); else if (pa.tipo === 'nominar') T.invNominarJugador(E, pa.c, T.invOpciones(E, pa.c)[0].p); else T.invCandidatoJugador(E, pa.c, T.bloque(E, pa.c, E.esp.ccaa[pa.c].inv.cand).bloque); } else if (E.esp.pendienteSocio) C.Ejecutivo.socioJugador(E, 'abs', []); else { const inv = E.esp.cortes.investidura; if (inv) C.Ejecutivo.investidurJugador(E, inv.plan); else E.esp.pendienteInvestidura = false; } }
  else if (b === 'gabinete') { C.Gabinete.confirmar(E, E.esp.pendienteGabinete.key); E.esp.pendienteGabinete = null; }
  else if (b === 'escandalo') E.esp.gab.escandalo = null;
  else if (b === 'consejo') { const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, ops[0].k); }
  else break; } };
const avanzar = n => { for (let i = 0; i < n; i++) { resolver(); C.Tiempo.avanzar(); } resolver(); };
console.log('Autonómicas en', c, '— jugador', J.cargo, J.rol);
J.prestigio = 60; J.escReg = true;
avanzar(2);
rc.parl.proxT = E.fecha.t + 1;   // fuerza elecciones
rc.cab[J.partido] = 'J'; J.lidReg = c; J.aspira = { nivel: 'autonomico', region: c, cabeza: true };
C.Tiempo.avanzar(); resolver();
ok(!!rc.inv, 'se abre el procedimiento de investidura tras las elecciones');
const cal = T.calendarioAut(E, c);
ok(cal.activo && cal.pasos.length === 6, 'calendario autonómico con seis pasos');
ok(rc.inv.tConst === rc.inv.t0 + 4, 'sesión constitutiva a las 4 semanas (' + U.fmtT(rc.inv.tConst, true) + ')');
ok(rc.gob && rc.gob.pres !== undefined, 'el gobierno anterior sigue en funciones');
const t0 = rc.inv.t0; let estados = [];
for (let i = 0; i < 14 && rc.inv; i++) { avanzar(1); if (rc.inv) estados.push(rc.inv.estado); }
ok(!rc.inv, 'la investidura termina (estados: ' + estados.join(',') + ')');
ok(rc.gob && rc.gob.formado > t0, 'nuevo gobierno instalado el ' + U.fmtT(rc.gob.formado, true) + ' (' + (rc.gob.formado - t0) + ' semanas tras las elecciones)');
console.log('  presidente:', (E.politicos[rc.gob.pres] || {}).n, '| partido', rc.gob.partido, '| cargo jugador', J.cargo, '| decisiones', JSON.stringify(E.__dec || []));
console.log(log.filter(x => /investid|Parlamento de|candidat|propone/i.test(x)).slice(-10).join('\n'));
// Central: forzar generales
console.log('Generales: calendario');
E.esp.cortes.estado = 'constitucion'; E.esp.cortes.tConst = E.fecha.t + 2; E.esp.cortes.ultElec = E.fecha.t - 1; E.esp.cortes.investidura = null;
const cc = T.calendarioCentral(E); ok(cc.activo && cc.pasos.length === 5, 'calendario central con cinco pasos');
const vistos = []; for (let i = 0; i < 30; i++) { avanzar(1); const e = E.esp.cortes.estado; if (vistos[vistos.length - 1] !== e) vistos.push(e); }
ok(['constitucion', 'consultas', 'investidura'].every(e => vistos.includes(e)), 'las Cortes recorren todas las fases (' + vistos.join(' → ') + ')');
ok(log.some(x => /Se constituyen las Cortes/.test(x)), 'se constituyen las Cortes');
const qv = () => { E.esp.pendienteConvAut = null; const pv = E.esp.pendienteVotoAut; if (pv) T.votarLey(E, pv.c, T.leyAut(E, pv.c, pv.id), 'abs'); E.parl.pendienteVoto.length = 0; E.eventos.pendientes.length = 0; };
console.log('Presidente del Parlamento autonómico: propone candidato');
rc.parl.proxT = E.fecha.t + 1; qv(); C.Tiempo.avanzar(); resolver();
ok(!!rc.inv, 'nuevas autonómicas abren otra investidura');
for (let i = 0; i < 8 && rc.inv && rc.inv.estado === 'constitucion'; i++) avanzar(1);
ok(rc.inv && rc.inv.estado === 'consultas', 'tras la sesión constitutiva se abren las consultas');
J.escReg = true; rc.parl.escanos[J.partido] = rc.parl.escanos[J.partido] || 3; rc.inv.mesa = { partido: J.partido, pres: 'J', n: J.nombre }; rc.inv.tNom = E.fecha.t + 1;
qv(); C.Tiempo.avanzar();
ok(rc.inv.estado === 'nominaJ' && E.esp.pendienteInvAut && E.esp.pendienteInvAut.tipo === 'nominar', 'el jugador presidente de la Cámara debe proponer candidato');
ok(!!C.Tiempo.bloqueo(), 'el tiempo queda bloqueado hasta decidir');
const ops = T.invOpciones(E, c); ok(ops.length >= 2, 'hay varios candidatos posibles (' + ops.map(o => E.partidos[o.p].sigla).join(', ') + ')');
T.invNominarJugador(E, c, ops[ops.length - 1].p);
ok(rc.inv.cand === ops[ops.length - 1].p && ['debate', 'candidatoJ'].includes(rc.inv.estado), 'se propone al candidato elegido');
resolver(); for (let i = 0; i < 12 && rc.inv; i++) avanzar(1);
ok(!rc.inv, 'termina la investidura');
console.log('Presidente del Congreso: propone candidato');
const cs = E.esp.cortes; J.nivel = 'nacional'; J.electo = true;
cs.estado = 'constitucion'; cs.tConst = E.fecha.t + 1; cs.fallidos = []; cs.t1 = null; cs.investidura = null; E.esp.pendienteSocio = false;
const Pp = E.paises.ES; const orden = Pp.partidos.slice().sort((a, b) => Pp.escanos[b] - Pp.escanos[a]);
const parti = J.partido; Pp.escanos[parti] = Math.max(Pp.escanos[parti] || 0, 120); J.rol = 'direccion';
const oc = C.Ejecutivo.constituir; C.Ejecutivo.constituir = function (E2) { const r = oc.call(this, E2); if (!E2.esp.cortes.mesa || E2.esp.cortes.mesa.presidente !== 'J') { E2.esp.cortes.mesa = { presidente: 'J', partido: parti }; } return r; };
qv(); C.Tiempo.avanzar();   // constituye
ok(cs.estado === 'consultas' && cs.mesa.presidente === 'J', 'el jugador preside el Congreso');
qv(); C.Tiempo.avanzar();
ok(cs.estado === 'nominaJ' && E.esp.pendienteInvAut && E.esp.pendienteInvAut.c === 'ES', 'el jugador propone al candidato a la Presidencia del Gobierno');
const cands = C.Ejecutivo.candidatosInv(E); ok(cands.length >= 2, 'candidatos: ' + cands.map(x => E.partidos[x.p].sigla).join(', '));
C.Ejecutivo.nominarJugador(E, cands[0].p);
ok(cs.estado === 'investidura' && cs.investidura.cand === cands[0].p, 'el Rey propone al candidato elegido');
resolver();
console.log('errores', errores, '| fallos', fallos);
process.exit(fallos || errores ? 1 : 0);

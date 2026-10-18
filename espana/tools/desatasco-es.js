/* Prueba del desatasco: el bloqueo del tiempo por un debate que el cargo no ve (partida de Meritxell Vila), la reparación al cargar y la red de seguridad que resuelve decisiones sin ventana. Uso: node tools/desatasco-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/ui/escudos.js','js/ui/logos.js','js/sistemas/oposicion.js','js/sistemas/desatasco.js','js/sistemas/obras.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const Ca = C.Campana, Ds = C.Desatasco;
const nuevo = (o = {}) => { const E = C.Mundo.nueva(Object.assign({ semilla: 4321, partido: 'ES_UPC', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES', nivel: 'autonomico', rol: 'lider', region: 'CAT', muni: 'm_bcn' }, o)); C.E = E; E.partidos[E.jugador.partido].lider = 'J'; /* como tras ganar un congreso del partido */ return E; };
/* Unas generales en campaña con el debate ya debido. */
const generales = E => { E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 6; const camp = Ca.iniciar(E); camp.debate.t = E.fecha.t; camp.debate.hecho = false; return camp; };

console.log('El debate de unas generales que tu cargo no ve (la partida de Meritxell Vila)');
{ const E = nuevo(), J = E.jugador, camp = generales(E);
  ok(C.Foco.ambito(E) === 'aut' && E.partidos[J.partido].lider === 'J', 'presidencia autonómica con el liderazgo de un partido nacional');
  ok(Ca.camps(E).length === 1 && Ca.mias(E).length === 0 && !Ca.esMia(E, camp), 'la campaña de las generales existe, pero tu cargo no la ve');
  ok(Ca.participantes(E, camp).includes(J.partido) && Ca.debateJugador(E, camp), 'tu partido debate en televisión (y tú lo lideras)');
  E.esp.pendienteDebate = false; Ca.turnoCamp(E, camp);
  ok(camp.debate.hecho && !E.esp.pendienteDebate, 'el debate se celebra solo: no queda ninguna decisión pendiente sin ventana');
  ok(!C.Tiempo.bloqueo() || C.Tiempo.bloqueo() !== 'evento' || !E.esp.pendienteDebate, 'el tiempo no se detiene por ese debate'); }
{ const E = nuevo(), camp = generales(E); E.meta.ajustes = Object.assign({}, E.meta.ajustes, { foco: 'todo' });
  ok(Ca.esMia(E, camp) && Ca.mias(E).length === 1, 'con el enfoque desactivado la campaña sí es tuya');
  Ca.turnoCamp(E, camp); ok(E.esp.pendienteDebate === true && !camp.debate.hecho && C.Tiempo.bloqueo() === 'evento', 'y entonces el debate te lo pide a ti (se detiene el tiempo)');
  Ca.celebrarDebate(E, 'prudente', camp); ok(!E.esp.pendienteDebate && camp.debate.hecho, 'al celebrarlo se libera'); }
{ const E = nuevo({ nivel: 'nacional', region: 'MAD' }), camp = generales(E);
  ok(C.Foco.ambito(E) === 'central' && Ca.esMia(E, camp), 'quien juega a nivel nacional sí hace campaña en las generales');
  Ca.turnoCamp(E, camp); ok(E.esp.pendienteDebate === true && C.Tiempo.bloqueo() === 'evento', 'y el debate sigue pidiéndole su decisión'); }

console.log('Partidas guardadas con el aviso huérfano');
{ const E = nuevo(), camp = generales(E); E.esp.pendienteDebate = true;
  ok(C.Tiempo.bloqueo() === 'evento', 'una partida así tiene el tiempo detenido');
  C.Bus.emit('partida:cargada', E);
  ok(!E.esp.pendienteDebate && camp.debate.hecho && C.Tiempo.bloqueo() === null, 'al cargarla se repara: el debate se celebra y el tiempo vuelve a correr'); }
{ const E = nuevo({ nivel: 'nacional', region: 'MAD' }), camp = generales(E); E.esp.pendienteDebate = true; C.Bus.emit('partida:cargada', E);
  ok(E.esp.pendienteDebate === true && !camp.debate.hecho, 'si el debate es tuyo, cargar la partida no te lo quita'); }
{ const E = nuevo(); E.esp.pendienteDebate = true; C.Bus.emit('partida:cargada', E); ok(!E.esp.pendienteDebate, 'un aviso de debate sin ninguna campaña también se limpia'); }

console.log('Desatasco: resolver lo que no se puede mostrar');
{ const E = nuevo({ nivel: 'nacional', region: 'MAD' });
  ok(Ds.resolver(E) === null, 'sin decisiones pendientes no hace nada');
  C.Eventos.info(E, 'Prueba', 'Un suceso cualquiera'); ok(C.Tiempo.bloqueo() === 'evento', 'un suceso pendiente detiene el tiempo'); const t = Ds.resolver(E); ok(/Se resolvió automáticamente un suceso/.test(t) && !C.Tiempo.bloqueo(), 'se resuelve con su primera opción: «' + t + '»');
  const camp = generales(E); Ca.turnoCamp(E, camp); ok(C.Tiempo.bloqueo() === 'evento' && E.esp.pendienteDebate, 'un debate pendiente'); ok(/un debate/.test(Ds.resolver(E)) && !E.esp.pendienteDebate && camp.debate.hecho && !C.Tiempo.bloqueo(), 'se celebra con tono prudente');
  E.elecciones.nochePendiente = { tipo: 'generales' }; ok(C.Tiempo.bloqueo() === 'noche' && /noche electoral/.test(Ds.resolver(E)) && !C.Tiempo.bloqueo(), 'una noche electoral sin ventana se descarta');
  E.esp.gab = E.esp.gab || {}; E.esp.gab.escandalo = { texto: 'x' }; ok(C.Tiempo.bloqueo() === 'escandalo' && /escándalo/.test(Ds.resolver(E)) && !C.Tiempo.bloqueo(), 'un escándalo sin ventana se cierra');
  E.esp.pendienteInvestidura = true; E.esp.cortes.investidura = null; ok(C.Tiempo.bloqueo() === 'investidura' && Ds.resolver(E) && !C.Tiempo.bloqueo(), 'una investidura que no existe se limpia');
  E.esp.pendienteCrisisV = 'cv-inexistente'; ok(C.Tiempo.bloqueo() === 'evento' && Ds.resolver(E) && !C.Tiempo.bloqueo(), 'una crisis en directo que ya no existe se limpia');
  E.esp.pendienteCongreso = true; ok(C.Tiempo.bloqueo() === 'evento' && Ds.resolver(E) && !C.Tiempo.bloqueo(), 'un congreso del partido pendiente se celebra o se limpia');
  C.Eventos.info(E, 'A', 'a'); C.Eventos.info(E, 'B', 'b'); E.elecciones.nochePendiente = { tipo: 'generales' }; E.esp.pendienteDebate = true; E.esp.pendienteSocio = true;
  let n = 0; while (C.Tiempo.bloqueo() && n++ < 12) Ds.resolver(E); ok(!C.Tiempo.bloqueo() && n <= 8, 'varias decisiones a la vez se van resolviendo una a una (' + n + ' pasos) hasta liberar el tiempo');
  E.esp.pendienteSesion = { x: 1 }; E.esp.pendienteVotoAut = { c: 'XXX', id: 'nada' }; E.esp.pendienteGabinete = { key: 'no-existe' }; Ds.limpiar(E); ok(!C.Tiempo.bloqueo(), 'la limpieza de último recurso libera cualquier bloqueo');
  const w0 = E.fecha.t; ok(C.Tiempo.avanzar() && E.fecha.t === w0 + 1, 'y el tiempo vuelve a avanzar'); }

console.log('Cuarenta semanas de campaña con un cargo autonómico, sin atascarse');
{ const E = nuevo(), t0 = E.fecha.t; let paradas = 0, debates = 0; E.esp.cortes.estado = 'disueltas'; E.esp.cortes.proxT = E.fecha.t + 12; const camp = Ca.iniciar(E);
  for (let i = 0; i < 40; i++) { let g = 0; while (C.Tiempo.bloqueo() && g++ < 12) { if (E.esp.pendienteDebate) debates++; paradas++; Ds.resolver(E); } if (!C.Tiempo.avanzar()) break; }
  ok(E.fecha.t - t0 === 40, 'el tiempo avanza las 40 semanas por las generales (' + paradas + ' decisiones de otro tipo tuvieron que resolverse con el desatasco)');
  ok(debates === 0 && camp.debate.hecho && !E.esp.pendienteDebate, 'sin ningún debate pendiente por el camino: se celebró solo');
  ok(E.esp.cortes.estado !== 'disueltas' || E.esp.cortes.proxT > E.fecha.t, 'las generales se celebran (estado: ' + E.esp.cortes.estado + ')'); }
console.log('Cada bloqueo tiene su ventana y su desatasco');
{ const fs = require('fs'), path = require('path'), src = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const t = src('js/core/tiempo.js'), i0 = t.indexOf('bloqueo() {'), blo = t.slice(i0, t.indexOf('\n    }', i0));
  const flags = [...new Set([...blo.matchAll(/\.(pendiente\w*|\w+Pendiente|escandalo)\b/g)].map(m => m[1]))];
  const app = src('js/app.js'), rev = app.slice(app.indexOf('_revisar(E) {'), app.indexOf('    ayuda() {')), des = src('js/sistemas/desatasco.js');
  ok(flags.length >= 17, 'Tiempo.bloqueo vigila ' + flags.length + ' avisos (' + flags.join(', ') + ')');
  const sinVentana = flags.filter(f => !rev.includes(f)); ok(!sinVentana.length, 'cada aviso que detiene el tiempo tiene su ventana en App._revisar' + (sinVentana.length ? ': faltan ' + sinVentana.join(', ') : ''));
  const sinSalida = flags.filter(f => !des.includes(f) && !(f === 'pendientes' && des.includes('eventos.pendientes')) && !(f === 'pendiente' && des.includes('ue.pendiente'))); ok(!sinSalida.length, 'cada aviso tiene su salida en el desatasco' + (sinSalida.length ? ': faltan ' + sinSalida.join(', ') : ''));
  ok(/pendientesJugador/.test(rev) && /urgente/.test(des), 'los asuntos urgentes del Consejo de Ministros también'); }
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

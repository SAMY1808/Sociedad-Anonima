/* Prueba de los gobiernos autonómicos más vivos: gobierno en funciones, cordón sanitario, negociación de la investidura, bloqueo y repetición de elecciones. Uso: node tools/gobaut-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const T = C.Territorio, Ga = C.GobAut, Ej = C.Ejecutivo, In = C.Intriga;
const crear = (op, sem) => { const E = C.Mundo.nueva(Object.assign({ semilla: sem || 77, partido: 'ES_ASD', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }, op)); C.E = E; E.meta.presim = false; E.jugador.agenda.max = 99; E.esp.cortes.estado = 'activa'; return E; };
const pt = E => { E.jugador.agenda.puntos = 99; };
const lim = E => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; E.esp.pendienteCrisisV = null; E.esp.pendienteCongreso = false; if (E.esp.consejo) for (const i of E.esp.consejo.agenda) i.urgente = false; if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E); };
const sem = (E, n) => { for (let i = 0; i < n; i++) { lim(E); for (const x of C.Dilemas.asegurar(E).act.slice()) C.Dilemas.decidir(E, x.uid, x.op ? 0 : 0); C.Tiempo.avanzar(); } };
const ejec = (E, id, args) => { pt(E); return C.Acciones.ejecutar(id, args); };
const comoPres = (E, c) => { const J = E.jugador; J.cargo = 'presauto'; J.nivel = 'autonomico'; J.region = c; E.esp.ccaa[c].gob.pres = 'J'; E.paises.ES.gob.pm = 'otro'; };
/* El jugador encabeza la lista de su partido en el Parlamento de c (puede negociar su investidura). */
const comoCandidato = (E, c) => { const J = E.jugador, rc = E.esp.ccaa[c]; J.cargo = 'dipauto'; J.nivel = 'autonomico'; J.region = c; J.escReg = true; E.paises.ES.gob.pm = 'otro'; if (!(rc.parl.escanos[J.partido] > 0)) rc.parl.escanos[J.partido] = 20; rc.cab[J.partido] = 'J'; };
const c0 = U.chance, g0 = U.gauss; const seguro = v => { U.chance = () => v; }; const normal = () => { U.chance = c0; U.gauss = g0; };

console.log('Gobierno en funciones');
{ const E = crear({}); comoPres(E, 'MAD'); pt(E); const rc = E.esp.ccaa.MAD;
  ok(!Ga.enFunciones(E, 'MAD') && Ga.limite(E) === true, 'sin investidura abierta el Gobierno no está en funciones');
  T.abrirInvestidura(E, 'MAD'); ok(Ga.enFunciones(E, 'MAD') && /en funciones/.test(Ga.limite(E)), 'al abrirse la investidura el Gobierno queda en funciones');
  const bloqueadas = Ga.FUNC.filter(id => C.Acciones.get(id) && /en funciones/.test(String(C.Acciones.razon(id, {}))));
  ok(!bloqueadas.includes('decreto_ley_aut'), 'el decreto-ley por urgencia sigue disponible en funciones'); ok(bloqueadas.length >= 8 && ['presupuesto_aut', 'proponer_ley_aut', 'reorganizar_gobierno', 'reclamar_competencia'].every(id => bloqueadas.includes(id)), 'las decisiones de gobierno quedan bloqueadas (' + bloqueadas.length + ' acciones)');
  ok(Ga.FUNC.filter(id => C.Acciones.get(id)).length >= 11, 'la lista bloqueada apunta a acciones que existen (' + Ga.FUNC.filter(id => C.Acciones.get(id)).length + ' de ' + Ga.FUNC.length + ')');
  const r = T.iniciarPrograma(E, 'AND', Object.keys(C.DATA.programas || {})[0] || 'x', true); T.abrirInvestidura(E, 'AND'); ok(!T.iniciarPrograma(E, 'AND', 'x', true).ok, 'el Gobierno de la IA en funciones no lanza programas');
  rc.gob.aprob = 50; rc.inv.t0 = E.fecha.t - 3; Ga.turno(E); ok(rc.gob.aprob === 50, 'las primeras semanas no pasan factura'); rc.inv.t0 = E.fecha.t - 14; Ga.turno(E); ok(rc.gob.aprob < 50, 'un Gobierno mucho tiempo en funciones pierde aprobación (' + rc.gob.aprob.toFixed(2) + ')');
  rc.inv = null; ok(!/en funciones/.test(String(C.Acciones.razon('presupuesto_aut', {}))) , 'tras la investidura vuelve a actuar'); ok(Ga.resumen(E).every(x => x.c !== 'MAD'), 'el resumen ya no lista a esa comunidad'); }

console.log('Cordón sanitario');
{ const E = crear({}); const co = Ga.cordones(E), vap = co.find(x => x.pid === 'ES_VAP');
  ok(co.length >= 2 && vap && vap.por.length >= 8 && co[0].por.length >= co[co.length - 1].por.length, 'el cordón señala a los partidos más vetados (' + co.map(x => E.partidos[x.pid].sigla + ':' + x.por.length).join(' ') + ')');
  ok(Ej.vetaA(E, 'ES_PPI', 'ES_VAP') && Ej.vetaA(E, 'ES_VAP', 'ES_PPI'), 'de partida PPI y VAP se vetan');
  ok(Ej.afinidad(E, 'ES_PPI', 'ES_VAP') < 0.3, 'PPI y VAP no se soportan (afinidad ' + Ej.afinidad(E, 'ES_PPI', 'ES_VAP').toFixed(2) + ')'); ok(Ga.romper(E, 'ES_PPI', 'ES_VAP', null, 'IA') && !Ej.vetaA(E, 'ES_PPI', 'ES_VAP') && !Ej.vetaA(E, 'ES_VAP', 'ES_PPI'), 'romper el cordón levanta el veto en los dos sentidos'); ok(Ej.afinidad(E, 'ES_PPI', 'ES_VAP') >= Ga.AFIN_ROTO && Ej.afinidad(E, 'ES_VAP', 'ES_PPI') >= Ga.AFIN_ROTO, 'y fija un suelo de afinidad (pacto abierto)'); ok(!Ga.romper(E, 'ES_VAP', 'ES_PPI', null, 'IA'), 'no se rompe dos veces'); ok(Ej.vetaA(E, 'ES_APU', 'ES_VAP'), 'los demás vetos siguen');
  ok(Ga.restaurar(E, 'ES_PPI', 'ES_VAP') && Ej.vetaA(E, 'ES_PPI', 'ES_VAP'), 'restaurar devuelve el veto');
  Ga.romper(E, 'ES_APU', 'ES_VAP', 'MAD', 'IA'); ok(Ej.vetaA(E, 'ES_APU', 'ES_VAP') && Ga.en('MAD', () => !Ej.vetaA(E, 'ES_APU', 'ES_VAP')) && Ga.en('AND', () => Ej.vetaA(E, 'ES_APU', 'ES_VAP')), 'una ruptura regional sólo vale en su comunidad');
  Ga.romper(E, 'ES_ASD', 'ES_VAP', null, 'IA'); In.vetar(E, 'ES_ASD', 'ES_VAP', 'jugador'); ok(Ej.vetaA(E, 'ES_ASD', 'ES_VAP'), 'un veto que se impone el jugador después de la ruptura sigue vigente'); In.levantar(E, 'ES_ASD', 'ES_VAP'); Ga.restaurar(E, 'ES_ASD', 'ES_VAP');
  // Acciones del jugador
  const E2 = crear({}); const J = E2.jugador; seguro(true); const p0 = J.prestigio; const r = ejec(E2, 'romper_cordon', { pid: 'ES_VAP' }); normal();
  ok(r.ok && Ga.roto(E2, 'ES_ASD', 'ES_VAP') && J.prestigio < p0, 'pactar con un partido vetado rompe el veto y cuesta prestigio (' + p0.toFixed(1) + ' → ' + J.prestigio.toFixed(1) + ')');
  ok(E2.noticias.some(n => /rompen el cordón sanitario/.test(n.txt || n.t || n.texto || JSON.stringify(n))), 'sale en las noticias'); ok(Ga.hayVeto(E2, 'ES_ASD', 'ES_VAP') === false, 'el veto entre ambos desaparece');
  const rr = ejec(E2, 'restaurar_cordon', { pid: 'ES_VAP' }); ok(rr.ok && !Ga.roto(E2, 'ES_ASD', 'ES_VAP') && Ga.hayVeto(E2, 'ES_ASD', 'ES_VAP'), 'restablecer el cordón vuelve a vetarlos'); ok(!ejec(E2, 'restaurar_cordon', { pid: 'ES_VAP' }).ok, 'no se restablece lo que no está roto');
  seguro(false); const rf = ejec(E2, 'romper_cordon', { pid: 'ES_VAP' }); normal(); ok(rf.ok && rf.exito === false && !Ga.roto(E2, 'ES_ASD', 'ES_VAP'), 'si el otro partido se niega, el veto se mantiene');
  ok(!ejec(E2, 'romper_cordon', { pid: 'ES_PPI' }).ok, 'sin veto no hay nada que romper');
  const pAlta = (() => { const a = Ej.afinidad(E2, 'ES_ASD', 'ES_VAP'); return a; })(); ok(pAlta < 0.3, 'ASD y VAP están lejos entre sí (afinidad ' + pAlta.toFixed(2) + '): el pacto es improbable'); }

console.log('Negociación de la investidura');
{ const E = crear({}); comoCandidato(E, 'MAD'); const J = E.jugador, rc = E.esp.ccaa.MAD, cand = J.partido;
  ok(typeof Ga.puedeNegociar(E, 'MAD') === 'string', 'sin investidura abierta no se negocia'); T.abrirInvestidura(E, 'MAD'); ok(Ga.puedeNegociar(E, 'MAD') === true, 'con la investidura abierta y encabezando la lista se puede negociar');
  const esc = rc.parl.escanos, otros = Object.keys(esc).filter(k => k !== cand && esc[k] > 0);
  const vet = otros.find(k => Ga.hayVeto(E, cand, k, 'MAD')), nop = otros.find(k => Ga.postura(E, 'MAD', cand, k) === 'no'), abs = otros.find(k => Ga.postura(E, 'MAD', cand, k) === 'abs');
  ok(vet && nop, 'hay un grupo que veta y otro que dice no (' + (vet && E.partidos[vet].sigla) + ', ' + (nop && E.partidos[nop].sigla) + ')');
  if (vet) { const r = ejec(E, 'cabildear_investidura', { c: 'MAD', pid: vet }); ok(!r.ok && /romper el veto/.test(r.msg), 'no se cabildea a quien te veta'); }
  if (nop) {
    const a0 = Ej.afinidad(E, cand, nop), b0 = Ga.en('MAD', () => Ej.afinidad(E, cand, nop)); seguro(true); const r1 = ejec(E, 'cabildear_investidura', { c: 'MAD', pid: nop }); normal();
    ok(r1.ok && r1.exito !== false && Ga.neg(E, 'MAD').cab[nop] > 0, 'cabildear mejora la disposición del grupo'); ok(Ga.en('MAD', () => Ej.afinidad(E, cand, nop)) > b0 && Ej.afinidad(E, cand, nop) === a0, 'la afinidad sólo cambia dentro de esa investidura (' + b0.toFixed(2) + ' → ' + Ga.en('MAD', () => Ej.afinidad(E, cand, nop)).toFixed(2) + ')');
    ok(!ejec(E, 'cabildear_investidura', { c: 'MAD', pid: nop }).ok, 'no se insiste dos veces en la misma semana'); E.fecha.t += 1; seguro(true); for (let i = 0; i < 5; i++) { E.fecha.t += 1; ejec(E, 'cabildear_investidura', { c: 'MAD', pid: nop }); } normal(); ok(Ga.neg(E, 'MAD').cab[nop] <= Ga.MAXCAB + 1e-9, 'el cabildeo tiene un tope (' + Ga.neg(E, 'MAD').cab[nop].toFixed(2) + ')');
    const pr0 = J.prestigio, co0 = E.partidos[cand].cohesion; const rc1 = ejec(E, 'contrapartida_investidura', { c: 'MAD', pid: nop, tipo: 'programa' }); ok(rc1.ok && Ga.neg(E, 'MAD').con[nop] === 'programa' && J.prestigio < pr0 && E.partidos[cand].cohesion < co0, 'una contrapartida de programa cuesta prestigio y cohesión'); ok(!ejec(E, 'contrapartida_investidura', { c: 'MAD', pid: nop, tipo: 'cargos' }).ok, 'una sola contrapartida por grupo');
    ok(['abs', 'si'].includes(Ga.postura(E, 'MAD', cand, nop)), 'con cabildeo y contrapartida el grupo deja de votar en contra (' + Ga.postura(E, 'MAD', cand, nop) + ')');
    const b = T.bloque(E, 'MAD', cand), ev = T.evalBloque(E, 'MAD', cand, [cand]); ok(b.si >= ev.si && ev.si > 0, 'el bloque automático cuenta lo negociado (' + b.si + ' síes)'); }
  ok(!ejec(E, 'contrapartida_investidura', { c: 'MAD', pid: otros[0], tipo: 'inexistente' }).ok, 'una contrapartida desconocida se rechaza');
  const E2 = crear({}); const r2 = (() => { E2.jugador.cargo = 'diputado'; return C.Acciones.razon('cabildear_investidura', { c: 'MAD', pid: 'ES_PPI' }); })(); ok(typeof r2 === 'string', 'quien no encabeza una lista no negocia');
  // Pagar las contrapartidas al ser investido
  const E3 = crear({}); comoCandidato(E3, 'MAD'); T.abrirInvestidura(E3, 'MAD'); const rc3 = E3.esp.ccaa.MAD, v3 = rc3.inv, c3 = E3.jugador.partido; const k3 = Object.keys(rc3.parl.escanos).find(k => k !== c3 && !Ga.hayVeto(E3, c3, k, 'MAD')); Ga.neg(E3, 'MAD', true).con[k3] = 'cargos';
  const b3 = T.bloque(E3, 'MAD', c3); T.invInstalar(E3, 'MAD', b3, 'es investido/a'); ok(rc3.gob.partido === c3 && Ga.asegurar(E3).hist.some(h => /contrapartida/.test(h.txt)), 'al ser investido se anotan las contrapartidas pagadas'); ok(rc3.inv === null, 'la investidura se cierra'); }

console.log('Bloqueo, repetición de elecciones y culpas');
{ const E = crear({}); const rc = E.esp.ccaa.AND, g = Ga.asegurar(E); T.abrirInvestidura(E, 'AND'); const v = rc.inv; const esc = rc.parl.escanos, may = Math.floor(U.suma(Object.values(esc)) / 2) + 1;
  const ordenados = Object.keys(esc).sort((a, b) => esc[b] - esc[a]); const [a, b, c3] = ordenados;
  v.fallidos = [a, b]; v.t1 = E.fecha.t - 12; v.estado = 'consultas'; v.tNom = E.fecha.t; T.invNominar(E, 'AND');
  ok(g.rep.AND && g.rep.AND.n === 1 && g.rep.AND.culpa[a] === 1 && g.rep.AND.culpa[b] === 1, 'si nadie es investido en dos meses se repiten las elecciones y se reparten las culpas'); ok(rc.inv === null && rc.parl.proxT - E.fecha.t <= 20, 'se convocan nuevas elecciones');
  ok(E.noticias.some(n => /REPETICIÓN ELECTORAL en Andalucía/.test(JSON.stringify(n))), 'la repetición sale en las noticias');
  const antes = (() => { const x = g.rep.AND; delete g.rep.AND; const r = T.votosReg(E, 'AND', 0); g.rep.AND = x; return r; })(), con = T.votosReg(E, 'AND', 0);
  ok(con[a] < antes[a] && con[b] < antes[b] && Math.abs(U.suma(Object.values(con)) - U.suma(Object.values(antes))) < 1e-6, 'los culpables pierden voto y el total se conserva (' + antes[a].toFixed(1) + ' → ' + con[a].toFixed(1) + ' %)');
  U.gauss = () => 0; const p1 = T.simular(E, 'AND', { ruido: 0 }).part; const x = g.rep.AND; delete g.rep.AND; const p0 = T.simular(E, 'AND', { ruido: 0 }).part; g.rep.AND = x; U.gauss = g0; ok(p1 < p0, 'la participación baja en las elecciones repetidas (' + p0 + ' → ' + p1 + ' %)');
  const res = Ga.resumen(E).find(x => x.c === 'AND'); ok(res && res.rep === 1 && !res.func, 'el resumen refleja la repetición');
  // Culpar a otro partido
  comoPres(E, 'AND'); const J = E.jugador; J.partido = c3 || J.partido; const rival = ordenados.find(k => k !== J.partido && !g.rep.AND.culpa[k]) || ordenados[0];
  seguro(true); const cr = ejec(E, 'culpar_bloqueo', { c: 'AND', pid: rival }); normal(); ok(cr.ok && g.rep.AND.culpa[rival] >= 0.4, 'culpar a un partido sube su parte de la culpa (' + g.rep.AND.culpa[rival] + ')');
  seguro(false); const cf = ejec(E, 'culpar_bloqueo', { c: 'AND', pid: rival }); normal(); ok(cf.ok && cf.exito === false, 'si no convence, no pasa nada más que perder prestigio');
  ok(!ejec(E, 'culpar_bloqueo', { c: 'MAD', pid: rival }).ok, 'no se culpa donde no hay bloqueo');
  // Fin del bloqueo
  const m = T.bloque(E, 'AND', ordenados[0]); T.instalar(E, 'AND', m, false); ok(!g.rep.AND, 'al formarse Gobierno termina el bloqueo');
  // Si el Parlamento sin candidatos
  const E2 = crear({}, 5); T.abrirInvestidura(E2, 'AND'); E2.esp.ccaa.AND.inv.fallidos = Object.keys(E2.esp.ccaa.AND.parl.escanos); T.invNominar(E2, 'AND'); ok(Ga.asegurar(E2).rep.AND && Ga.asegurar(E2).rep.AND.n === 1, 'sin candidatos posibles también hay repetición'); }

console.log('Voto del grupo del jugador: apoyar, facilitar o bloquear');
{ const E = crear({}); comoCandidato(E, 'MAD'); const J = E.jugador, rc = E.esp.ccaa.MAD; rc.parl.escanos = { ES_PPI: 50, ES_ASD: 40, ES_UPC: 30, ES_TVE: 15 }; T.abrirInvestidura(E, 'MAD'); const v = rc.inv; v.cand = 'ES_PPI'; v.bloq = T.bloque(E, 'MAD', 'ES_PPI'); v.estado = 'debate'; v.vuelta = 2; v.t1 = E.fecha.t - 1;
  const b0 = T.evalBloque(E, 'MAD', 'ES_PPI', ['ES_PPI']); ok(Ga.puedeVotar(E, 'MAD') === true, 'quien encabeza un grupo que no es el del candidato puede fijar su voto');
  const co0 = E.partidos.ES_ASD.cohesion; let r = ejec(E, 'voto_investidura_aut', { c: 'MAD', voto: 'abs' }); const b1 = T.evalBloque(E, 'MAD', 'ES_PPI', ['ES_PPI']); ok(r.ok && v.votoJ === 'abs' && b1.no <= b0.no && b1.si >= b0.si && /abstendrá/.test(r.msg), 'facilitar con la abstención quita noes (' + b0.si + '/' + b0.no + ' → ' + b1.si + '/' + b1.no + ')'); ok(E.partidos.ES_ASD.cohesion < co0, 'facilitar enfada a tu base');
  r = ejec(E, 'voto_investidura_aut', { c: 'MAD', voto: 'no' }); const b2 = T.evalBloque(E, 'MAD', 'ES_PPI', ['ES_PPI']); ok(r.ok && b2.no >= b0.no + (b0.no >= 40 ? 0 : 40), 'bloquear suma los noes de tu grupo (' + b2.no + ')'); ok(!ejec(E, 'voto_investidura_aut', { c: 'MAD', voto: 'no' }).ok, 'no se repite la misma postura');
  ok(Ga.culpa(E, 'MAD').ES_ASD >= 1, 'quien bloquea a propósito carga con la culpa'); r = ejec(E, 'voto_investidura_aut', { c: 'MAD', voto: 'si' }); const b3 = T.evalBloque(E, 'MAD', 'ES_PPI', ['ES_PPI']); ok(r.ok && b3.si >= b0.si + (b0.si >= 40 ? 0 : 40), 'apoyar suma sus síes (' + b3.si + ')');
  ok(!ejec(E, 'voto_investidura_aut', { c: 'MAD', voto: 'inventado' }).ok, 'una postura desconocida se rechaza');
  // Efecto en la votación
  const prueba = (voto, azar) => { const E2 = crear({}); comoCandidato(E2, 'MAD'); const rc2 = E2.esp.ccaa.MAD; rc2.parl.escanos = { ES_PPI: 50, ES_ASD: 40, ES_TVE: 45 }; T.abrirInvestidura(E2, 'MAD'); const v2 = rc2.inv; v2.cand = 'ES_PPI'; v2.bloq = T.bloque(E2, 'MAD', 'ES_PPI'); v2.estado = 'debate'; v2.vuelta = 2; v2.t1 = E2.fecha.t - 1; if (voto) ejec(E2, 'voto_investidura_aut', { c: 'MAD', voto }); seguro(azar); T.invVotar(E2, 'MAD'); normal(); return { gob: rc2.gob.partido, fallo: rc2.inv && rc2.inv.fallidos.includes('ES_PPI') }; };
  const pf = prueba('abs', false), pb = prueba('no', true); ok(pf.gob === 'ES_PPI', 'si tu grupo se abstiene, el candidato es investido'); ok(pb.fallo && pb.gob !== 'ES_PPI', 'si tu grupo bloquea, no hay pacto de última hora que valga y la investidura fracasa');
  const E4 = crear({}); comoCandidato(E4, 'MAD'); E4.esp.ccaa.MAD.parl.escanos = { ES_PPI: 50, ES_ASD: 40, ES_UPC: 30, ES_TVE: 15 }; T.abrirInvestidura(E4, 'MAD'); E4.esp.ccaa.MAD.inv.cand = E4.jugador.partido; ok(typeof Ga.puedeVotar(E4, 'MAD') === 'string', 'el candidato no fija su abstención'); }

console.log('La IA rompe el cordón cuando se queda sin mayoría');
{ const E = crear({}); const rc = E.esp.ccaa.MAD; rc.parl.escanos = { ES_PPI: 40, ES_VAP: 20, ES_UPC: 10, ES_TVE: 40 }; T.abrirInvestidura(E, 'MAD'); const v = rc.inv; v.cand = 'ES_PPI'; v.bloq = T.bloque(E, 'MAD', 'ES_PPI'); v.fallidos = ['ES_TVE']; v.vuelta = 2; v.estado = 'debate';
  ok(!v.bloq.bloque.includes('ES_VAP') && Ga.hayVeto(E, 'ES_PPI', 'ES_VAP', 'MAD'), 'de partida el bloque de PPI no incluye a VAP (se vetan)'); ok(Ej.afinidad(E, 'ES_PPI', 'ES_VAP') < 0.3, 'PPI y VAP están lejos: sin ruptura no sumarían');
  seguro(false); ok(!Ga.intentarRuptura(E, 'MAD'), 'sin suerte no hay ruptura'); seguro(true); const r = Ga.intentarRuptura(E, 'MAD'); normal();
  ok(r && Ga.roto(E, 'ES_PPI', 'ES_VAP', 'MAD') && v.bloq.bloque.includes('ES_VAP') && v.bloq.s >= v.bloq.may && Ga.en('MAD', () => Ej.afinidad(E, 'ES_PPI', 'ES_VAP')) >= Ga.AFIN_ROTO, 'el candidato rompe el cordón en esa comunidad y suma la mayoría (' + v.bloq.s + ' de ' + v.bloq.may + ')');
  ok(!Ga.roto(E, 'ES_PPI', 'ES_VAP', 'AND') && Ga.hayVeto(E, 'ES_PPI', 'ES_VAP', 'AND'), 'en otras comunidades el veto sigue'); ok(E.noticias.some(n => /rompe el cordón sanitario con VAP/.test(JSON.stringify(n))), 'sale en las noticias');
  seguro(true); T.invVotar(E, 'MAD'); normal(); ok(rc.inv === null && rc.gob.partido === 'ES_PPI' && rc.gob.coalicion.includes('ES_VAP'), 'la investidura prospera con el apoyo de VAP');
  // Sin mayoría posible no hay ruptura
  const E2 = crear({}); const rc2 = E2.esp.ccaa.MAD; rc2.parl.escanos = { ES_PPI: 40, ES_VAP: 10, ES_UPC: 20, ES_TVE: 65 }; T.abrirInvestidura(E2, 'MAD'); const v2 = rc2.inv; v2.cand = 'ES_PPI'; v2.bloq = T.bloque(E2, 'MAD', 'ES_PPI'); seguro(true); ok(!Ga.intentarRuptura(E2, 'MAD') && !Ga.roto(E2, 'ES_PPI', 'ES_VAP', 'MAD'), 'si ni así hay mayoría, no se rompe nada'); normal(); }

console.log('Estabilidad con partidas largas');
for (const sm of [3, 9]) { const E = crear({ partido: 'ES_ASD' }, sm); let rotos = 0, reps = 0; for (let i = 0; i < 400; i++) { sem(E, 1); } const g = Ga.asegurar(E); rotos = Object.keys(g.roto).length; reps = g.hist.filter(h => /Repetición/.test(h.txt)).length;
  const raros = []; for (const c of T.ids()) { const rc = E.esp.ccaa[c]; if (!isFinite(rc.gob && rc.gob.aprob) || !isFinite(rc.relM) || !isFinite(rc.parl.escanos && U.suma(Object.values(rc.parl.escanos)))) raros.push(c); }
  ok(!raros.length, 'semilla ' + sm + ': 400 semanas sin valores raros (' + rotos + ' rupturas del cordón, ' + reps + ' repeticiones)'); }
normal();
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

/* Prueba del jugador en España: crea una partida con un perfil y simula, ejecutando acciones y resolviendo eventos al azar. */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;
const arg = process.argv.slice(2);
const perfil = { semilla: +arg[0] || 11, partido: arg[1] || 'ES_ASD', nivel: arg[2] || 'nacional', rol: arg[3] || 'base', region: arg[4] || null, muni: arg[5] || null, nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES' };
const sem = +arg[6] || 260;
const E = C.Mundo.nueva(perfil), J = E.jugador, P = E.paises.ES;
const f = o => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => (E.partidos[k] ? E.partidos[k].sigla : k) + ' ' + (Math.round(o[k] * 10) / 10)).join(' · ');
console.log('JUGADOR', J.partido, 'nivel', J.nivel, 'cargo', C.Personaje.cargoTxt(E), 'rol', J.rol, 'region', J.region, 'muni', J.muni);
const todas = []; const np = C.Noticias.poner; C.Noticias.poner = (E2, t, x, p) => { todas.push(U.fmtT(E2.fecha.t) + ' ' + x); return np(E2, t, x, p); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const acciones = C.Acciones.lista().map(a => a.id);
let hechas = {};
for (let i = 0; i < sem; i++) {
  // resolver bloqueos
  let g = 0;
  while (C.Tiempo.bloqueo() && g++ < 20) {
    const b = C.Tiempo.bloqueo();
    if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E, U.rf(-0.5, 0.8));
    else if (b === 'evento' && E.esp.pendienteCongreso) C.PartidoInt.congreso(E, { bonus: U.ri(0, 6) });
    else if (b === 'evento' && E.esp.pendienteCrisisV) { const cr = C.CrisisDirecto.asegurar(E).act.find(x => x.uid === E.esp.pendienteCrisisV); if (!cr) E.esp.pendienteCrisisV = null; else { const sc = C.CrisisDirecto.cat(cr.id); while (cr.paso < sc.pasos.length) C.CrisisDirecto.elegir(E, cr, U.pick(sc.pasos[cr.paso][4])[0]); C.CrisisDirecto.cerrar(E, cr); } }
    else if (b === 'evento' && E.esp.pendienteDebate) C.Campana.celebrarDebate(E, U.pick(['ataque', 'propuestas', 'prudente']));
    else if (b === 'evento') { const ev = E.eventos.pendientes[0]; C.Eventos.resolver(E, 0, U.ri(0, Math.max(0, ev.opciones.length - 1))); }
    else if (b === 'voto' && E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; C.Territorio.votarLey(E, pv.c, C.Territorio.leyAut(E, pv.c, pv.id), U.pick(['si', 'abs', 'no'])); }
    else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); const p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, U.pick(['si', 'no', 'abs'])); }
    else if (b === 'ue') { C.UE.decidir(E, 0, U.pick(['si', 'no', 'abs'])); }
    else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; }
    else if (b === 'investidura') { const pa = E.esp.pendienteInvAut; if (pa && pa.c === 'ES') { const cs = C.Ejecutivo.candidatosInv(E); C.Ejecutivo.nominarJugador(E, U.pick(cs).p); } else if (pa) { const T = C.Territorio, v = E.esp.ccaa[pa.c].inv; if (pa.tipo === 'nominar') T.invNominarJugador(E, pa.c, U.pick(T.invOpciones(E, pa.c)).p); else if (U.chance(0.2)) T.invRenunciaJugador(E, pa.c); else T.invCandidatoJugador(E, pa.c, T.bloque(E, pa.c, v.cand).bloque); } else if (E.esp.pendienteSocio) C.Ejecutivo.socioJugador(E, U.pick(['si', 'abs', 'no']), []); else { const inv = E.esp.cortes.investidura; if (inv) C.Ejecutivo.investidurJugador(E, inv.plan); else E.esp.pendienteInvestidura = false; } }
    else if (b === 'gabinete') { C.Gabinete.confirmar(E, E.esp.pendienteGabinete.key); E.esp.pendienteGabinete = null; }
    else if (b === 'escandalo') { E.esp.gab.escandalo = null; }
    else if (b === 'consejo') { const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, U.pick(ops).k); }
    else break;
  }
  // acciones aleatorias
  for (let k = 0; k < 3; k++) {
    const id = U.pick(acciones); const a = C.Acciones.get(id); const args = {};
    if (id === 'proponer_ley' || id === 'propuesta_consejo') args.tpl = U.pick(C.DATA.leyes.filter(l => !l.manual && !l.rdlSolo)).id;
    if (id === 'cabildear_ley') { const ab = C.Congreso.abiertos(E); if (ab.length) { args.proy = U.pick(ab).id; args.pid = U.pick(P.partidos); } }
    if (id === 'reclamar_competencia') args.comp = U.pick(Object.keys(C.DATA.competencias));
    if (id === 'ofrecer_comp') { args.region = U.pick(C.Territorio.ids()); args.comp = U.pick(Object.keys(C.DATA.competencias)); }
    if (id === 'negociar_financiacion') args.tipo = U.pick(['cesion', 'nivelacion', 'singular']);
    if (id === 'politica_fiscal') args.dir = U.pick(['bajar', 'subir']);
    if (id === 'proyecto_urbano') args.proy = U.pick(Object.keys(C.Municipios.PROYECTOS));
    if (id === 'politica_gasto') { args.area = U.pick(C.Municipios.AREAS); args.nivel = U.ri(0, 2); }
    if (id === 'politica_ibi') args.dir = U.pick(['subir', 'bajar']);
    if (id === 'fondos_municipales') args.quien = U.pick(['ccaa', 'estado', 'ue']);
    if (id === 'visita_ccaa') args.region = U.pick(C.Territorio.ids());
    if (id === 'proponer_cambio_ley') { const v = (E.esp.vigor || []).filter(x => x.estado === 'activa'); if (v.length) { args.vigor = U.pick(v).id; args.tipo = U.pick(['derogar', 'reformar']); } }
    if (id === 'aceptar_enmienda') { const ps = C.Congreso.abiertos(E).filter(p => p.autor.tipo === 'jugador' || p.autor.tipo === 'gobierno'); if (ps.length) { const p = U.pick(ps), en = C.Impacto.enmiendas(E, p); if (en.length) { args.proy = p.id; args.k = en[0].cambio.k; args.v = en[0].cambio.v; args.pid = en[0].pid; } } }
    if (id === 'programa_consejeria') { const T = C.Territorio, Jx = E.jugador; if (Jx.region && E.esp.ccaa[Jx.region]) { const ps = Jx.cargo === 'presauto' ? Object.values(C.DATA.programas).flat() : (Jx.area ? T.programasDe(E, Jx.region, Jx.area) : []); if (ps.length) args.prog = U.pick(ps).id; } }
    if (id === 'reorganizar_gobierno') args.n = U.ri(7, 15);
    if (id === 'candidatura_aut') { const o = U.pick(C.Personaje.opcionesLista(E)); args.region = o.c; args.cabeza = U.chance(0.5); }
    if (id === 'ordenanza') args.tipo = U.pick(['vivienda', 'obras', 'turismo']);
    if (id === 'cabildear_exp') { const ab = C.UE.abiertos(E); if (ab.length) args.exp = U.pick(ab).id; }
    if (id === 'proponer_exp') args.tpl = U.pick(C.DATA.expedientes.filter(x => x.tipo !== 'cumbre')).id;
    const r = C.Acciones.ejecutar(id, args); if (r.ok !== false) hechas[id] = (hechas[id] || 0) + 1;
  }
  // modal de consultas de moción
  if (E.ui.abrir) E.ui.abrir = null;
  if (!C.Tiempo.avanzar()) break;
}
console.error = oe;
console.log('--- tras', sem, 'semanas (', U.fmtT(E.fecha.t), '), errores:', errores);
console.log('Jugador:', C.Personaje.cargoTxt(E), '| nivel', J.nivel, '| prestigio', Math.round(J.prestigio), '| rol', J.rol, '| partido', J.partido, '| electo', J.electo, 'escReg', J.escReg, 'concejal', J.concejal);
console.log('Hitos:', Object.keys(J.hitos).map(k => k + '@' + J.hitos[k]).join(', '));
console.log('Gobierno:', E.partidos[P.gob.partido].sigla, 'pm', E.politicos[P.gob.pm] && E.politicos[P.gob.pm].n);
console.log('Acciones usadas:', JSON.stringify(hechas));
console.log('Historial jugador:'); J.historial.slice(0, 15).reverse().forEach(h => console.log('  ', U.fmtT(h.t), h.txt));

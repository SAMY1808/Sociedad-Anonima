/* Prueba del foco por cargo: simula un perfil de cada ámbito y comprueba que sólo llegan al jugador decisiones de su nivel. Uso: node tools/foco-es.js [semillas] [semanas] */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/sistemas/legado.js'];
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
        const b = C.Tiempo.bloqueo(), cg = J.cargo === 'activista' ? 'activista@' + J.nivel : J.cargo; let k = b;
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
      for (const x of C.Dilemas.asegurar(E).act.slice()) { if (!vistos.has(x.uid)) { vistos.add(x.uid); add(J.cargo === 'activista' ? 'activista@' + J.nivel : J.cargo, 'dilema:' + x.id); if (!C.Foco.dilema(E, x.id)) add(J.cargo === 'activista' ? 'activista@' + J.nivel : J.cargo, 'VIOLA:dilema:' + x.id); } C.Dilemas.decidir(E, x.uid, C.Dilemas.CAT[x.id].op[0].k); }
      C.Tiempo.avanzar();
    }
  }
  PRUEBAS.push([nombre, cuenta]);
}

const AMB = { pm: 'central', vicepres: 'central', ministro: 'central', diputado: 'central', senador: 'central', 'activista@nacional': 'central', 'activista@autonomico': 'aut', 'activista@local': 'local', mep: 'central', presauto: 'aut', consejero: 'aut', dipauto: 'aut', alcalde: 'local', concejal: 'local' };
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
// Titulares por nivel
{ const E = C.Mundo.nueva({ semilla: 41, partido: 'ES_ASD', nombre: 'P', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }); C.E = E; const J = E.jugador; const N = C.Noticias, nv = (t, x, a) => N.nivel(E, t, x, a);
  let v = nv('politica', 'El Parlamento de Extremadura deroga el decreto-ley «Ley agraria autonómica» (26–39).'); ok(v.amb === 'aut' && v.reg === 'EXT', 'titular del parlamento de Extremadura: autonómico (' + v.amb + '/' + v.reg + ')');
  v = nv('politica', 'Fracasa la investidura de Rafael Romero (PPI) en Aragón: 29 votos a favor y 38 en contra.'); ok(v.amb === 'aut' && v.reg === 'ARA', 'investidura fallida en Aragón: autonómico');
  v = nv('politica', 'El pleno municipal de Bilbao aprueba la ordenanza de terrazas.'); ok(v.amb === 'local' && v.muni === 'm_bil', 'pleno municipal de Bilbao: local (' + v.amb + '/' + v.muni + ')');
  v = nv('elecciones', 'Elecciones municipales: UPC 3346 alcaldías, ASD 2289 alcaldías.'); ok(v.amb === 'central', 'el resumen de las municipales es noticia general');
  v = nv('elecciones', 'Elecciones en La Rioja: UPC gana con el 46,5 %.'); ok(v.amb === 'aut' && v.reg === 'RIO', 'elecciones en La Rioja: autonómico');
  v = nv('politica', 'El Congreso aprueba la ley de vivienda.'); ok(v.amb === 'central', 'una ley del Congreso es noticia general');
  N.poner(E, 'politica', 'El Parlamento de Extremadura deroga el decreto-ley «Ley agraria autonómica» (26–39).', 'ES'); N.poner(E, 'politica', 'El pleno municipal de Bilbao aprueba la ordenanza de terrazas.', 'ES'); N.poner(E, 'politica', 'El Parlamento de Madrid aprueba la ley de suelo (50–40).', 'ES'); N.poner(E, 'politica', 'El Congreso aprueba la ley de vivienda.', 'ES');
  const vis = () => E.noticias.slice(0, 4).filter(n => C.Foco.noticia(E, n)).length;
  J.cargo = 'pm'; J.nivel = 'nacional'; ok(vis() === 1, 'Presidencia: sólo ve el titular nacional (' + vis() + ')');
  J.cargo = 'dipauto'; J.nivel = 'autonomico'; J.region = 'MAD'; ok(vis() === 2, 'Cargo autonómico de Madrid: ve lo nacional y lo de su comunidad, no el parlamento de otra comunidad ni el pleno de Bilbao (' + vis() + ')');
  J.cargo = 'alcalde'; J.nivel = 'local'; J.muni = 'm_bil'; J.region = 'PVA'; ok(vis() === 2, 'Alcalde/sa de Bilbao: ve lo nacional y lo de su ciudad (' + vis() + ')');
  C.Ajustes.fijar(E, 'foco', 'todo'); ok(vis() === 4, 'Panorámico: ve todos los titulares'); C.Ajustes.fijar(E, 'foco', 'cargo'); }
// Crisis: ministros y consejeros gestionan las de su ramo
{ const E = C.Mundo.nueva({ semilla: 42, partido: 'ES_ASD', nombre: 'P', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }); C.E = E; E.meta.presim = false; const J = E.jugador, Cv = C.CrisisDirecto; E.paises.ES.gob.pm = 'otro';
  J.cargo = 'ministro'; J.ministerio = 'int'; ok(Cv.decide(E, 'nac', null, 'cv_atentado') && !Cv.decide(E, 'nac', null, 'cv_tren') && !Cv.decide(E, 'nac', null, undefined), 'el/la ministro/a de Interior gestiona el atentado, no el accidente ferroviario');
  J.ministerio = 'tpt'; ok(Cv.decide(E, 'nac', null, 'cv_tren') && !Cv.decide(E, 'nac', null, 'cv_atentado'), 'el/la ministro/a de Transportes gestiona el accidente ferroviario');
  J.cargo = 'consejero'; J.region = 'MAD'; J.area = 'sal'; ok(Cv.decide(E, 'aut', 'MAD', 'cv_urgencias') && !Cv.decide(E, 'aut', 'MAD', 'cv_colegios') && !Cv.decide(E, 'aut', 'CAT', 'cv_urgencias'), 'el/la consejero/a de Sanidad gestiona las urgencias de su comunidad, no los colegios ni las de otra comunidad');
  J.cargo = 'diputado'; ok(!Cv.decide(E, 'nac', null, 'cv_atentado') && !Cv.decide(E, 'aut', 'MAD', 'cv_urgencias'), 'un/a diputado/a no gestiona crisis');
  J.cargo = 'ministro'; J.ministerio = 'int'; let jugadas = 0; for (let i = 0; i < 80 && jugadas < 2; i++) { Cv.asegurar(E).cd = {}; Cv.asegurar(E).act.length = 0; E.esp.pendienteCrisisV = null; const cr = Cv.nueva(E, 'nac'); if (cr && cr.jug && E.esp.pendienteCrisisV) { const sc = Cv.cat(cr.id); ok(Cv.SECTOR[cr.id] && Cv.SECTOR[cr.id].includes('int'), 'a Interior le toca «' + sc.n + '»'); while (cr.paso < sc.pasos.length) Cv.elegir(E, cr, sc.pasos[cr.paso][4][0][0]); const r = Cv.cerrar(E, cr); ok(isFinite(r.V) && E.esp.pendienteCrisisV === null, 'la crisis del ramo se juega entera'); jugadas++; } } ok(jugadas >= 1, 'el/la ministro/a recibe crisis de su ramo (' + jugadas + ')');
  ok(C.DATA.crisisDirecto.filter(s => s.a !== 'mun').every(s => Cv.SECTOR[s.id]), 'todas las crisis nacionales y autonómicas tienen ramo asignado'); }
// Metas por cargo
{ const E = C.Mundo.nueva({ semilla: 43, partido: 'ES_ASD', nombre: 'P', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }); C.E = E; const J = E.jugador, Mt = C.Metas;
  J.cargo = 'pm'; J.nivel = 'nacional'; let vs = Mt.visibles(E); ok(vs.includes('pm') && vs.includes('absoluta') && !vs.includes('presauto') && !vs.includes('alcaldia'), 'Presidencia: metas del Gobierno, sin las autonómicas ni las locales');
  J.cargo = 'dipauto'; J.nivel = 'autonomico'; J.region = 'MAD'; vs = Mt.visibles(E); ok(vs.includes('presauto') && vs.includes('mayoria_aut') && !vs.includes('pm') && !vs.includes('mayoria_local') && vs.includes('veterano'), 'Cargo autonómico: metas de su comunidad y las generales');
  J.cargo = 'concejal'; J.nivel = 'local'; J.muni = 'm_mad'; vs = Mt.visibles(E); ok(vs.includes('alcaldia') && vs.includes('deuda_local') && !vs.includes('presauto'), 'Cargo local: metas de su ciudad');
  ok(Object.keys(Mt.META).every(k => { const p = Mt.progreso(E, k); return isFinite(p) && p >= 0 && p <= 1; }), 'los progresos de todas las metas son válidos'); C.Ajustes.fijar(E, 'foco', 'todo'); ok(Mt.visibles(E).length === Object.keys(Mt.META).length, 'Panorámico: todas las metas'); }
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

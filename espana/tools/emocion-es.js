/* Prueba de némesis y dilemas con reloj. Uso: node tools/emocion-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; };
const P = E.paises.ES; J.agenda.max = 80; const pt = () => { J.agenda.puntos = 80; }; E.meta.presim = false;
const N = C.Nemesis, D = C.Dilemas;
console.log('Némesis');
const s = N.elegir(E); ok(!!s.pid && s.pid !== J.partido, 'némesis elegido: ' + N.nombre(E));
const o0 = s.odio; pt(); let r = C.Acciones.ejecutar('provocar_nemesis', {}); ok(r.ok !== false && s.odio > o0, 'provocar sube el odio');
pt(); r = C.Acciones.ejecutar('tender_mano_nemesis', {}); ok(r.ok !== false, 'tender la mano: ' + (r.msg || '').slice(0, 50));
pt(); r = C.Acciones.ejecutar('desafiar_nemesis', {}); ok(r.ok !== false, 'desafiar: ' + (r.msg || '').slice(0, 60));
console.log('Dilemas');
const d = D.asegurar(E); ok(d.capital === 50, 'capital inicial 50');
for (const id of Object.keys(D.CAT)) {
  const x = D.nuevo(E, id); ok(!!x, 'dilema ' + id);
  if (!x) continue; d.act.length = 0; for (const o of D.CAT[id].op) { d.capital = 100; const y = D.nuevo(E, id); r = D.decidir(E, y.uid, o.k); ok(r.ok, `  ${id}/${o.k}: ${(r.msg || '').slice(0, 50)}`); }
  d.act.length = 0;
}
D.nuevo(E, 'huelga'); const caduca = d.act[0]; d.act[0].limite = E.fecha.t; D.turno(E); ok(!d.act.some(z => z === caduca), 'caduca y aplica el defecto');
ok(d.memoria.length > 0, 'memoria: ' + d.memoria.length); for (const m of d.memoria) m.t -= 30; let h = 0; for (let i = 0; i < 20; i++) if (D.hemeroteca(E)) h++; ok(h > 0, 'hemeroteca cobra: ' + h);
for (let i = 0; i < 400; i++) { lim(); E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; while (E.eventos.pendientes.length) C.Eventos.resolver(E, 0, 0); for (const x of d.act.slice()) if (i % 3 === 0) D.decidir(E, x.uid, D.CAT[x.id].op[0].k); C.Tiempo.avanzar(); }
ok(true, '400 semanas sin errores; nemesis hist ' + s.hist.length + ', dilemas hist ' + d.hist.length);
console.log('Barones'); const B = C.Barones;
const rg = C.Territorio.ids().find(c => E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.partido !== J.partido && E.politicos[E.esp.ccaa[c].gob.pres]); const rc = E.esp.ccaa[rg]; rc.gob.partido = J.partido; rc.gob.coalicion = [J.partido];
ok(B.lista(E).some(x => x.c === rg), 'barón detectado en ' + rg); pt(); r = C.Acciones.ejecutar('cortejar_baron', { c: rg }); ok(r.ok, 'atender barón');
const np = E.paises.ES.partidos.length; const pid = B.fundar(E, rg, 0.8); ok(!!pid && E.paises.ES.partidos.length === np + 1, 'se funda el partido ' + (pid && E.partidos[pid].nombre));
const v = C.Es.votosProv(E, Object.keys(C.DATA.provincias).find(p => C.DATA.provincias[p][1] === rg), 0); const sm = Object.values(v).reduce((a, b) => a + b, 0); ok(Math.abs(sm - 100) < 0.5 && v[pid] > 0, 'votos suman 100 con el nuevo partido (' + v[pid].toFixed(1) + ' %)');
ok(rc.gob.partido === pid, 'el barón se lleva el gobierno autonómico');
for (let i = 0; i < 60; i++) { lim(); E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = null; C.Tiempo.avanzar(); }
ok(true, '60 semanas con el nuevo partido sin errores');
C.Mayorias.cambiarRel(E, pid, 50); E.paises.ES.partidos.includes(pid); B.asegurar(E).esc[0].t -= 30; J.atrib.negociacion = 9; let rr; for (let i = 0; i < 12 && !(rr && rr.msg.includes('lograda')); i++) { pt(); rr = C.Acciones.ejecutar('reconciliar_baron', { pid }); } ok(rr && rr.msg.includes('lograda'), 'reconciliación: ' + (rr && rr.msg));
const x0 = D.nuevo(E, 'escision'); x0.reg = rg; ok(D.CAT.escision.txt(E, x0).length > 10, 'dilema de escisión se redacta');
const rv2 = C.Territorio.ids().find(c => c !== rg && E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.partido !== J.partido && E.partidos[E.esp.ccaa[c].gob.partido].amb === 'nac' && E.politicos[E.esp.ccaa[c].gob.pres]);
if (rv2) { const pr = B.fundar(E, rv2, 0.7, E.esp.ccaa[rv2].gob.partido); ok(!!pr && B.asegurar(E).esc[0].rival, 'escisión en un partido rival (' + E.esp.ccaa[rv2].gob.pres + ')'); for (let i = 0; i < 30; i++) { lim(); C.Tiempo.avanzar(); } ok(true, 'el mundo sigue con la escisión rival'); }
console.log('Presión electoral'); const Pr = C.Presion, gb = E.paises.ES.gob, pm0 = gb.pm; const cor = E.esp.cortes;
E.esp.cortes.estado = 'activa'; cor.mocion = null; cor.ultDisolucion = -999; cor.finMax = E.fecha.t + 150; gb.pm = 'p_otro'; ok(!Pr.esPM(E) && Pr.disponible(E) === true, 'sin ser presidente se puede presionar');
const n0 = Pr.asegurar(E).nivel; pt(); r = C.Acciones.ejecutar('exigir_elecciones', {}); ok(r.ok && Pr.asegurar(E).nivel > n0, 'exigir elecciones sube la presión'); pt(); r = C.Acciones.ejecutar('movilizar_elecciones', {}); ok(r.ok, 'movilización: ' + r.msg.slice(0, 50)); pt(); r = C.Acciones.ejecutar('bloquear_gobierno', {}); ok(r.ok, 'obstrucción');
const so = gb.coalicion.find(k => k !== gb.partido); if (so) { pt(); r = C.Acciones.ejecutar('presionar_socio_gobierno', { pid: so }); ok(r.ok, 'presionar a un socio: ' + r.msg.slice(0, 50)); }
pt(); r = C.Acciones.ejecutar('exigir_elecciones', {}); ok(r.ok === false, 'enfriamiento de acciones'); gb.pm = pm0;
// la IA disuelve bajo presión alta
const antes = cor.estado; let disuelto = false; const guarda = { pm: gb.pm }; const otro = Object.keys(E.politicos).find(id => id !== 'J' && E.politicos[id].p === gb.partido); gb.pm = otro;
for (let i = 0; i < 400 && !disuelto; i++) { lim(); E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null; if (cor.estado === 'activa') { Pr.asegurar(E).nivel = 95; cor.ultDisolucion = -999; gb.estab = Math.min(gb.estab, 45); } C.Tiempo.avanzar(); if (cor.estado !== 'activa') disuelto = true; }
ok(disuelto, 'con presión máxima el presidente acaba convocando elecciones ' + JSON.stringify({ est: cor.estado, pd: C.Generales.puedeDisolver(E), fm: cor.finMax - E.fecha.t, pm: gb.pm, ev: C.Tiempo.bloqueo() }));
// dilema para el presidente
for (let i = 0; i < 30 && cor.estado !== 'activa'; i++) { lim(); E.elecciones.nochePendiente = null; C.Tiempo.avanzar(); } cor.estado = 'activa'; cor.mocion = null; cor.ultDisolucion = -999; cor.finMax = E.fecha.t + 150; gb.pm = 'J'; Pr.asegurar(E).nivel = 80; D.asegurar(E).act.length = 0; lim(); Pr.turno(E); ok(D.asegurar(E).act.some(x => x.id === 'presion'), 'al presidente le llega el dilema de presión');
for (const k of ['resistir', 'convocar', 'confianza']) { cor.estado = 'activa'; cor.mocion = null; cor.ultDisolucion = -999; d.capital = 100; const y = D.act ? null : D.nuevo(E, 'presion'); const z = D.asegurar(E).act.find(x => x.id === 'presion') || D.nuevo(E, 'presion'); r = D.decidir(E, z.uid, k); ok(r.ok, 'dilema presión/' + k + ': ' + r.msg.slice(0, 60)); }
console.log('Intriga'); const In = C.Intriga; const P2 = E.paises.ES; const dos = P2.partidos.filter(k => (P2.escanos[k] || 0) >= 10 && k !== J.partido && E.partidos[k].lider !== 'J').slice(0, 2);
ok(In.vetar(E, dos[0], dos[1], 'test') && C.Ejecutivo.vetaA(E, dos[0], dos[1]) && !C.Ejecutivo.vetaA(E, dos[1], dos[0]), 'veto dinámico unidireccional'); In.levantar(E, dos[0], dos[1]);
pt(); r = C.Acciones.ejecutar('vetar_partido', { pid: dos[0] }); ok(r.ok && In.vetaDin(E, J.partido, dos[0]), 'el jugador veta a un partido'); pt(); r = C.Acciones.ejecutar('levantar_veto', { pid: dos[0] }); ok(r.ok && !In.vetaDin(E, J.partido, dos[0]), 'el jugador levanta su veto');
In.generarVetos(E); ok(Array.isArray(In.asegurar(E).vetos), 'vetos generados al arrancar la campaña: ' + In.asegurar(E).vetos.length);
// candidato que abandona: se fuerza una campaña y una probabilidad alta
cor.estado = 'disueltas'; const camp2 = C.Campana.iniciar(E); const lid0 = Object.fromEntries(P2.partidos.map(k => [k, E.partidos[k].lider])); const chance0 = U.chance; U.chance = () => true; In.abandonos(E); U.chance = chance0; ok(P2.partidos.some(k => E.partidos[k].lider !== lid0[k]), 'un candidato abandona en plena campaña');
const casas = Object.keys(In.asegurar(E).lazos).length; for (const id of In.conocidos(E).slice(0, 3)) In.sumarLazo(E, id, 40); ok(In.top(E).length >= 1, 'lazos personales registrados'); const idn = In.conocidos(E)[0]; In.sumarLazo(E, idn, 60); const pidn = E.politicos[idn].p; const r0 = C.Mayorias.asegurar(E).rel[pidn]; C.Mayorias.cambiarRel(E, pidn, 10); ok(C.Mayorias.asegurar(E).rel[pidn] - r0 > 10, 'un amigo responde mejor (relación +' + (C.Mayorias.asegurar(E).rel[pidn] - r0).toFixed(1) + ')');
E.fecha.t = E.fecha.t; In.discursoRey(E); ok(true, 'discurso del Rey sin errores');
In.ecoExtranjero(E, { pais: 'FR' }); In.ecoExtranjero(E, { pais: 'DE' }); ok(true, 'eco de elecciones extranjeras sin errores');
for (const id of ['favorAmigo', 'traicion', 'reportaje', 'rey', 'extranjero']) { D.asegurar(E).act.length = 0; const y = D.nuevo(E, id); y.pol = idn; y.ext = 'FR'; y.nom = 'Francia'; y.sg = 'X'; y.gr = 'ANR'; d.capital = 100; for (const o of D.CAT[id].op) { const z = D.nuevo(E, id) || y; z.pol = idn; z.ext = 'FR'; z.nom = 'Francia'; z.sg = 'X'; z.gr = 'ANR'; d.capital = 100; r = D.decidir(E, z.uid, o.k); ok(r.ok, `dilema ${id}/${o.k}: ${r.msg.slice(0, 40)}`); D.asegurar(E).act.length = 0; } }
cor.estado = 'activa'; for (let i = 0; i < 12; i++) { lim(); C.Tiempo.avanzar(); }
console.log('Metas y crónica'); const Mt = C.Metas; delete Mt.asegurar(E).hechas.veterano; ok(Mt.elegir(E, 'veterano').ok, 'elegir meta'); E.fecha.t = Math.max(E.fecha.t, 521); lim(); E.elecciones.nochePendiente = null; Mt.turno(E); ok(!!Mt.asegurar(E).hechas.veterano, 'meta cumplida'); const ed = C.Cronica.edicion(E); ok(ed.titular && ed.editorial, 'crónica: ' + ed.titular.slice(0, 50)); ok(/Metas cumplidas/.test(C.Legado.epilogo(E)), 'epílogo menciona metas');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

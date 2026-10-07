/* Prueba de némesis y dilemas con reloj. Uso: node tools/emocion-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 171, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, g = E.paises.ES.gob;
const lim = () => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteVotoAut = null; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; };
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
for (let i = 0; i < 400; i++) { lim(); E.esp.pendienteConvAut = null; if (E.esp.gab) E.esp.gab.escandalo = null; E.elecciones.nochePendiente = null; while (E.eventos.pendientes.length) C.Eventos.resolver(E, 0, 0); for (const x of d.act.slice()) if (i % 3 === 0) D.decidir(E, x.uid, D.CAT[x.id].op[0].k); C.Tiempo.avanzar(); }
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
console.log('Metas y crónica'); const Mt = C.Metas; ok(Mt.elegir(E, 'veterano').ok, 'elegir meta'); E.fecha.t = Math.max(E.fecha.t, 521); lim(); E.elecciones.nochePendiente = null; Mt.turno(E); ok(!!Mt.asegurar(E).hechas.veterano, 'meta cumplida'); const ed = C.Cronica.edicion(E); ok(ed.titular && ed.editorial, 'crónica: ' + ed.titular.slice(0, 50)); ok(/Metas cumplidas/.test(C.Legado.epilogo(E)), 'epílogo menciona metas');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

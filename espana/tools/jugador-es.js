/* Prueba del jugador en España: crea una partida con un perfil y simula, ejecutando acciones y resolviendo eventos al azar. */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/territorio.js','js/sistemas/municipios.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js'];
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
    if (b === 'evento') { const ev = E.eventos.pendientes[0]; C.Eventos.resolver(E, 0, U.ri(0, Math.max(0, ev.opciones.length - 1))); }
    else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); const p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, U.pick(['si', 'no', 'abs'])); }
    else if (b === 'ue') { C.UE.decidir(E, 0, U.pick(['si', 'no', 'abs'])); }
    else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; }
    else if (b === 'investidura') { if (E.esp.pendienteSocio) C.Ejecutivo.socioJugador(E, U.pick(['si', 'abs', 'no']), []); else { const inv = E.esp.cortes.investidura; if (inv) C.Ejecutivo.investidurJugador(E, inv.plan); else E.esp.pendienteInvestidura = false; } }
    else if (b === 'consejo') { const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, U.pick(ops).k); }
    else break;
  }
  // acciones aleatorias
  for (let k = 0; k < 3; k++) {
    const id = U.pick(acciones); const a = C.Acciones.get(id); const args = {};
    if (id === 'proponer_ley' || id === 'propuesta_consejo') args.tpl = U.pick(C.DATA.leyes.filter(l => !l.manual && !l.rdlSolo)).id;
    if (id === 'cabildear_ley') { const ab = C.Congreso.abiertos(E); if (ab.length) { args.proy = U.pick(ab).id; args.pid = U.pick(P.partidos); } }
    if (id === 'visita_ccaa') args.region = U.pick(C.Territorio.ids());
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

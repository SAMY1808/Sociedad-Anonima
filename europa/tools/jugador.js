/* Agente que juega con una estrategia sencilla para calibrar el ritmo de carrera. */
const { cargar } = require('./headless');
const C = cargar();
const pais = process.argv[2] || 'ES', pidx = +(process.argv[3] || 1), anios = +(process.argv[4] || 12), semilla = +(process.argv[5] || 1);
const E = C.Mundo.nueva({ semilla, pais, partido: pais + '_' + pidx, nombre: 'Test', trayectoria: 'concejal', genero: 'm', edad: 36, atrib: { carisma: 5, oratoria: 5, gestion: 5, negociacion: 5, integridad: 3 }, rol: 'base' });
const J = E.jugador;
let ultimo = '';
const marca = (txt) => { const k = txt.replace(/\|\s*prest.*$/, ''); if (k !== ultimo) { ultimo = k; console.log(C.U.fmtT(E.fecha.t, true).padEnd(12), txt); } };
const acciones = ['dialogo_ue', 'recorrer_bases', 'discurso', 'ascender', 'desafiar_lider', 'viajar_bruselas', 'negociar_coalicion', 'plan_ministerio', 'mediar_partido', 'entrevista', 'mitin', 'pregunta_control'];
for (let w = 0; w < 52 * anios; w++) {
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) {
    const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0);
    else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); }
    else if (b === 'ue') C.UE.decidir(E, 0, E.ue.pendiente[0] ? 'si' : 'si');
    else if (b === 'noche') E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null;
  }
  let guard = 0;
  while (J.agenda.puntos > 0 && guard++ < 12) {
    let hecho = false;
    const disp = acciones.filter(a => C.Acciones.puede(a, {}) === true);
    const w = a => ({ ascender: 5, desafiar_lider: 4, viajar_bruselas: E.jugador.capEU < 50 ? 2 : 0.3, })[a] || 1;
    const tot = disp.reduce((x, a) => x + w(a), 0); let r0 = Math.random() * tot, elegida = disp[0];
    for (const a of disp) { r0 -= w(a); if (r0 <= 0) { elegida = a; break; } }
    if (elegida) { const r = C.Acciones.ejecutar(elegida, {}); if (r.ok !== false) hecho = true; }
    if (!hecho) break;
  }
  C.Tiempo.avanzar();
  marca(`${C.Personaje.cargoTxt(E)} | rol ${J.rol} | gob:${E.paises[pais].gob.coalicion.includes(J.partido) ? 'si' : 'no'}  [prest ${J.prestigio.toFixed(0)} pop ${J.pop.toFixed(0)} capEU ${J.capEU.toFixed(0)} edad ${J.edad}]`.replace(/\[.*$/, '') + `| prest ${J.prestigio.toFixed(0)} pop ${J.pop.toFixed(0)} capEU ${J.capEU.toFixed(0)}`);
}
console.log('FIN', C.U.fmtT(E.fecha.t), C.Personaje.cargoTxt(E), 'prest', J.prestigio.toFixed(0));

const { cargar } = require('./headless');
const C = cargar();
const pais = process.argv[2] || 'ES', anios = +(process.argv[3] || 14), semilla = +(process.argv[4] || 1);
const E = C.Mundo.nueva({ semilla, pais, nuevo: { nombre: 'Movimiento Nuevo', sigla: 'MNU', eco: -10, soc: -20, eu: 40, color: '#8E44AD', arq: 'cen', apoyo: 2.2 }, nombre: 'Test', trayectoria: 'activista', genero: 'f', edad: 36, atrib: { carisma: 6, oratoria: 6, gestion: 4, negociacion: 4, integridad: 3 }, rol: 'lider' });
const J = E.jugador, pid = J.partido;
console.log('inicio', C.Personaje.cargoTxt(E), 'pop', E.partidos[pid].pop.toFixed(2), 'escaños', E.paises[pais].escanos[pid] || 0);
for (let w = 0; w < 52 * anios; w++) {
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') { const n = E.elecciones.nochePendiente; console.log(C.U.fmtT(E.fecha.t, true), 'ELECCIONES: voto', n.votos[pid].toFixed(1), '% escaños', n.escanos[pid] || 0, 'electo', n.personal.electo, 'pop', E.partidos[pid].pop.toFixed(1)); E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; } }
  const as = ['mitin', 'discurso', 'entrevista', 'redes', 'recorrer_bases', 'pregunta_control'];
  let guard = 0; while (J.agenda.puntos > 0 && guard++ < 10) { const d = as.filter(a => C.Acciones.puede(a, {}) === true); if (!d.length) break; C.Acciones.ejecutar(d[Math.floor(Math.random() * d.length)], {}); }
  C.Tiempo.avanzar();
}
console.log('fin', C.U.fmtT(E.fecha.t), C.Personaje.cargoTxt(E), 'pop', E.partidos[pid].pop.toFixed(1), 'base', E.partidos[pid].base.toFixed(1));

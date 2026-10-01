const { cargar } = require('./headless');
const C = cargar();
const pais = process.argv[2] || 'ES', anios = +(process.argv[3] || 30);
const E = C.Mundo.nueva({ semilla: 3, pais, partido: pais + '_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
const J = E.jugador;
for (let w = 0; w < 52 * anios; w++) {
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; } }
  C.Tiempo.avanzar();
  if (w % 260 === 259) {
    const P = E.paises[pais];
    console.log(C.U.fmtT(E.fecha.t, true), P.partidos.map(k => E.partidos[k].sigla + ' ' + E.partidos[k].pop.toFixed(1)).join(' | '), '| gob', P.gob.coalicion.map(k => E.partidos[k].sigla).join('+'), '| econ', P.ec.crec.toFixed(1), P.ec.paro.toFixed(1), P.ec.infl.toFixed(1), P.ec.deuda.toFixed(0), P.ec.deficit.toFixed(1));
  }
}
console.log('KB', (JSON.stringify(E).length / 1024).toFixed(0), 'politicos', Object.keys(E.politicos).length, 'proyectos', Object.keys(E.proyectos).length);
console.log('Miembros UE', C.UE.miembros(E).length, 'candidatos', Object.keys(E.paises).filter(c => E.paises[c].estado === 'candidato').join(','));

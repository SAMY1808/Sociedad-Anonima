const { cargar } = require('./headless');
const C = cargar();
const pais = process.argv[2] || 'DE';
const E = C.Mundo.nueva({ semilla: 777, pais, partido: pais + '_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
const orig = C.Parlamento.resolver;
C.Parlamento.resolver = function (E, p, v) {
  const pr = C.Parlamento.proyectar(E, p);
  const r = orig.call(this, E, p, v);
  if (p.autor.tipo === 'gobierno' && p.etapa === 'rechazada') {
    const vt = E.votaciones[0];
    console.log('KO', p.t.slice(0, 40), 'proy', pr.si, pr.no, pr.abs, 'real', vt.si, vt.no, vt.abs, 'desert', vt.desertores, JSON.stringify(vt.posturas));
  }
  return r;
};
for (let w = 0; w < 52 * 4; w++) {
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; }
  C.Tiempo.avanzar();
}
console.log(E.paises[pais].partidos.map(k => E.partidos[k].sigla + ':' + E.paises[pais].escanos[k]).join(' '), 'gob', E.paises[pais].gob.coalicion);

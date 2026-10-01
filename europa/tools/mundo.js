const { cargar } = require('./headless');
const C = cargar();
const E = C.Mundo.nueva({ semilla: +(process.argv[2] || 2024), pais: 'ES', partido: 'ES_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
for (const id in E.paises) {
  const P = E.paises[id], g = P.gob, d = C.DATA.paises[id];
  const sig = new Set(); P.partidos.forEach(k => { if (sig.has(E.partidos[k].sigla)) console.log('SIGLA DUPLICADA', id, E.partidos[k].sigla); sig.add(E.partidos[k].sigla); });
  const top = P.partidos.slice().sort((a, b) => (P.escanos[b] || 0) - (P.escanos[a] || 0)).slice(0, 4).map(k => E.partidos[k].sigla + ':' + (P.escanos[k] || 0)).join(' ');
  const sg = g.coalicion.reduce((s, k) => s + (P.escanos[k] || 0), 0);
  console.log(id.padEnd(3), (d.estado).padEnd(9), top.padEnd(36), 'GOB', g.coalicion.map(k => E.partidos[k].sigla).join('+').padEnd(22), g.tipo.padEnd(8), sg + '/' + d.esc, 'aprob', g.aprob.toFixed(0), 'estab', g.estab.toFixed(0));
}
console.log('PE', JSON.stringify(E.ue.pe.escanos));

const { cargar } = require('./headless');
const C = cargar();
let mn = 100, c = 0;
for (let s = 1; s < 40; s++) {
  const E = C.Mundo.nueva({ semilla: s * 7919, pais: 'ES', partido: 'ES_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
  for (const id in E.paises) { const a = E.paises[id].gob.aprob; if (a < 25 || a > 70) { c++; console.log(s, id, a.toFixed(1)); } mn = Math.min(mn, a); }
}
console.log('min', mn, c);

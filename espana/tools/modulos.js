/* Lista de módulos del juego en el orden en que los carga index.html: datos, núcleo y sistemas (sin interfaz).
   Las pruebas nuevas la usan para no quedarse sin un módulo añadido después. Uso: const C = require('./mini')(require('./modulos')()); */
const fs = require('fs'), path = require('path');
module.exports = function (raiz) {
  raiz = raiz || path.join(__dirname, '..');
  const h = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  return [...h.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]).filter(s => /^(data\/|js\/core\/|js\/sistemas\/)/.test(s));
};

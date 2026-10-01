/* Carga datos, núcleo y sistemas en Node (sin DOM) para pruebas de simulación:  node tools/headless.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
function cargar(opts = {}) {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !/\/ui\/|\/pantallas\/|app\.js/.test(s) || opts.todo);
  const win = { console, Math, Date, JSON, Object, Array, Intl, Number, String, setTimeout, clearTimeout,
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  win.window = win;
  const ctx = vm.createContext(win);
  for (const s of scripts) {
    if (/guardado/.test(s)) continue;
    vm.runInContext(fs.readFileSync(path.join(raiz, s), 'utf8'), ctx, { filename: s });
  }
  return win.EUROPA;
}
module.exports = { cargar };
if (require.main === module) {
  const C = cargar();
  console.log('Sistemas:', C.Tiempo ? C.Tiempo.sistemas() : '—');
}

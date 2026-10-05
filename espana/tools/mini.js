/* Carga una lista de archivos concreta (para probar módulos sueltos). */
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function (archivos) {
  const raiz = path.join(__dirname, '..');
  const win = { console, Math, Date, JSON, Object, Array, Intl, Number, String, setTimeout, clearTimeout, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  win.window = win; vm.createContext(win);
  for (const f of archivos) vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), win, { filename: f });
  return win.ESP;
};

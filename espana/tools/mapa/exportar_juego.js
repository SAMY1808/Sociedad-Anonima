/* Vuelca a JSON los ids de provincias, comunidades y municipios del juego (para construir_mapa.py). Uso: node tools/mapa/exportar_juego.js > juego.json */
global.window = {}; global.ESP = { DATA: {} }; window.ESP = ESP;
require('../../data/territorio.js');
const P = ESP.DATA.provincias, M = ESP.DATA.municipios;
console.log(JSON.stringify({ prov: Object.fromEntries(Object.entries(P).map(([k, v]) => [k, { n: v[0], c: v[1] }])), ccaa: Object.fromEntries(Object.entries(ESP.DATA.ccaa).map(([k, v]) => [k, v.nombre])), muni: Object.fromEntries(M.map(m => [m[0], { n: m[1], p: m[2], pob: m[3] }])) }));

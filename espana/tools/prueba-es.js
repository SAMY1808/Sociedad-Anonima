/* Prueba rápida del motor de España (sin UI): crea el mundo y simula años. */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js'];
const C = mini(F);
const U = C.U;
C.Personaje = { sincronizar() {}, cambiar() {}, log() {}, enParlamento: () => false, tras_generales: () => null, tras_autonomicas: () => null, tras_municipales: () => null };
C.Eventos = { info(E, t, x) { if (process.env.V) console.log('  [info]', t); } };
const sem = +process.argv[2] || 260;
const E = C.Mundo.nueva({ semilla: +process.argv[3] || 7, pais: 'ES' });
const P = E.paises.ES;
const f = o => Object.keys(o).sort((a, b) => o[b] - o[a]).map(k => (E.partidos[k] ? E.partidos[k].sigla : k) + ' ' + (Math.round(o[k] * 10) / 10)).join(' · ');
console.log('Congreso:', f(P.escanos));
console.log('Senado:', f(E.esp.senado.escanos), 'mayoría', E.esp.senado.mayoria);
console.log('Gobierno:', E.partidos[P.gob.partido].sigla, 'coal', P.gob.coalicion.map(k => E.partidos[k].sigla).join('+'), 'ext', (P.gob.apoyoExterno || []).map(k => E.partidos[k].sigla).join('+'), P.gob.tipo, 'estab', Math.round(P.gob.estab));
const pres = {}; for (const c of C.Territorio.ids()) { const g = E.esp.ccaa[c].gob; pres[g.partido] = (pres[g.partido] || 0) + 1; }
console.log('CCAA presidencias:', f(pres));
console.log('Alcaldías:', f(E.esp.muni.resumen.alcRes), 'total', E.esp.muni.resumen.total);
const todas = []; const np = C.Noticias.poner; C.Noticias.poner = (E2, tipo, txt, pais) => { todas.push(U.fmtT(E2.fecha.t) + ' ' + txt); return np(E2, tipo, txt, pais); };
let t0 = Date.now();
for (let i = 0; i < sem; i++) {
  E.parl.pendienteVoto = []; E.elecciones.nochePendiente = null; E.eventos.pendientes = [];
  if (process.env.EST && i % 13 === 0) console.log(U.fmtT(E.fecha.t), 'estab', Math.round(P.gob.estab), 'aprob', Math.round(P.gob.aprob), 'ten', Math.round(E.esp.consejo.tension), E.esp.cortes.estado, P.gob.tipo, 'margen', (P.gob.coalicion.concat(P.gob.apoyoExterno||[]).reduce((a,k)=>a+(P.escanos[k]||0),0)-176));
  if (!C.Tiempo.avanzar()) { E.esp.consejo.agenda = []; E.esp.pendienteInvestidura = false; }
}
console.log('--- tras', sem, 'semanas (', U.fmtT(E.fecha.t), ') en', Date.now() - t0, 'ms');
console.log('Congreso:', f(P.escanos), '| estado', E.esp.cortes.estado, 'legislatura', E.esp.cortes.legislatura);
console.log('Gobierno:', E.partidos[P.gob.partido].sigla, P.gob.coalicion.map(k => E.partidos[k].sigla).join('+'), 'ext', (P.gob.apoyoExterno || []).map(k => E.partidos[k].sigla).join('+'), 'estab', Math.round(P.gob.estab), 'aprob', Math.round(P.gob.aprob));
console.log('Noticias:'); E.noticias.slice(0, 25).reverse().forEach(n => console.log(' ', U.fmtT(n.t), n.texto));
console.log('Eco:', JSON.stringify({ crec: P.ec.crec.toFixed(1), paro: P.ec.paro.toFixed(1), deficit: P.ec.deficit.toFixed(1), deuda: P.ec.deuda.toFixed(0) }));
console.log('CAT indep', E.esp.ccaa.CAT.indep.toFixed(1), 'rel', E.esp.ccaa.CAT.relM.toFixed(0), 'proces', E.esp.proces.fase);

if (process.env.G) todas.filter(x => new RegExp(process.env.G).test(x)).forEach(x => console.log(x));

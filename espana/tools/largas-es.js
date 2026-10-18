/* Partidas largas en Node: varios perfiles jugados durante años por el piloto automático (tools/piloto.js).
   Comprueba que el tiempo nunca se atasca (el piloto no necesita el desatasco), que no salta ningún error, que no aparecen valores NaN o infinitos,
   que el estado es sólo datos (se puede guardar) y que la partida sobrevive a guardarla y cargarla cada año (ida y vuelta por JSON como el guardado real).
   Uso: node tools/largas-es.js [semanas=520] [filtro de perfil] [semillas por perfil=2] */
const mini = require('./mini'), modulos = require('./modulos');
const C = mini(modulos()), U = C.U, D = C.DATA, piloto = require('./piloto')(C);
const SEM = +process.argv[2] || 520, SOLO = process.argv[3] || '', SEMILLAS = +process.argv[4] || 2;
let errores = 0; const errTxt = []; const oe = console.error; console.error = (...a) => { errores++; if (errTxt.length < 6) errTxt.push(a.map(x => (x && x.message) || String(x)).join(' ').slice(0, 200)); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const base = { nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES' };
const PERFILES = [
  { id: 'nac · ASD · base', o: { semilla: 11, partido: 'ES_ASD', nivel: 'nacional', rol: 'base', region: 'MAD', muni: 'm_mad' } },
  { id: 'nac · UPC · líder', o: { semilla: 12, partido: 'ES_UPC', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' } },
  { id: 'nac · PPI · dirección', o: { semilla: 13, partido: 'ES_PPI', nivel: 'nacional', rol: 'direccion', region: 'AND', muni: 'm_sev' } },
  { id: 'nac · VAP · líder (bisagra)', o: { semilla: 14, partido: 'ES_VAP', nivel: 'nacional', rol: 'lider', region: 'VAL', muni: 'm_val' } },
  { id: 'aut · UPC · líder · Madrid', o: { semilla: 21, partido: 'ES_UPC', nivel: 'autonomico', rol: 'lider', region: 'MAD', muni: 'm_mad' } },
  { id: 'aut · CLD · líder · Cataluña', o: { semilla: 22, partido: 'ES_CLD', nivel: 'autonomico', rol: 'lider', region: 'CAT', muni: 'm_bcn' } },
  { id: 'aut · ASD · base · Andalucía', o: { semilla: 23, partido: 'ES_ASD', nivel: 'autonomico', rol: 'base', region: 'AND', muni: 'm_sev' } },
  { id: 'loc · ASD · base · Barcelona', o: { semilla: 31, partido: 'ES_ASD', nivel: 'local', rol: 'base', region: 'CAT', muni: 'm_bcn' } },
  { id: 'loc · UPC · líder · Sevilla', o: { semilla: 32, partido: 'ES_UPC', nivel: 'local', rol: 'lider', region: 'AND', muni: 'm_sev' } },
  { id: 'modo partido · ASD', o: { semilla: 41, partido: 'ES_ASD', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }, modoPartido: true }
].filter(p => !SOLO || p.id.includes(SOLO)).flatMap(p => Array.from({ length: SEMILLAS }, (_, k) => ({ id: p.id + (SEMILLAS > 1 ? ' #' + (k + 1) : ''), modoPartido: p.modoPartido, o: Object.assign({}, p.o, { semilla: p.o.semilla + k * 100 }) })));

/* Rutas con números no finitos o con cosas que no son datos (funciones, Set, Map, instancias de clases): no sobrevivirían a un guardado. */
const raros = E => {
  const out = [], vis = new Set();
  (function rec(o, ruta, prof) {
    if (out.length >= 5 || prof > 16) return;
    if (typeof o === 'number') { if (!Number.isFinite(o)) out.push(ruta + ' = ' + o); return; }
    if (typeof o === 'function') { out.push(ruta + ' es una función'); return; }
    if (o === null || typeof o !== 'object' || vis.has(o)) return; vis.add(o);
    const tipo = Object.prototype.toString.call(o), pr = Object.getPrototypeOf(o);      // el juego corre en otro contexto de vm: se compara por forma, no por identidad del prototipo
    if (tipo !== '[object Object]' && tipo !== '[object Array]') { out.push(ruta + ' no es un dato simple (' + tipo + ')'); return; }
    if (tipo === '[object Object]' && pr !== null && Object.getPrototypeOf(pr) !== null) { out.push(ruta + ' es la instancia de una clase (' + (o.constructor && o.constructor.name) + ')'); return; }
    if (Array.isArray(o)) o.forEach((x, i) => rec(x, ruta + '[' + i + ']', prof + 1)); else for (const k of Object.keys(o)) rec(o[k], ruta + '.' + k, prof + 1);
  })(E, 'E', 0);
  return out;
};
/* Guardar y cargar como el juego real: JSON → migrar → evento de partida cargada. */
const cargar = txt => { const E2 = JSON.parse(txt); C.Estado.migrar(E2); C.E = E2; C.Bus.emit('partida:cargada', E2); return E2; };
/* La primera carga puede reparar cosas (partidas con datos de versiones antiguas); lo que se exige es que, una vez cargada, guardar y volver a cargar no cambie nada. */
const idaYVuelta = E => { const E2 = cargar(JSON.stringify(E)), t2 = JSON.stringify(E2), E3 = cargar(t2); return { E2: E3, igual: JSON.stringify(E3) === t2 }; };

console.log('Partidas largas: ' + PERFILES.length + ' perfiles × ' + SEM + ' semanas (≈ ' + Math.round(SEM / 52) + ' años)');
for (const p of PERFILES) {
  const t0 = Date.now(); errores = 0; errTxt.length = 0; piloto.desatascos.length = 0;
  let E = C.Mundo.nueva(Object.assign({}, base, p.o)); C.E = E; if (p.modoPartido) { E.meta.modoPartido = true; E.meta.vistaPartido = true; }
  const t00 = E.fecha.t, hechas = {}, problemas = []; let jugadas = 0, desiguales = 0;
  for (let i = 0; i < SEM; i++) {
    if (!piloto.semana(E, hechas)) { problemas.push('el tiempo se paró el ' + U.fmtT(E.fecha.t) + ' (bloqueo: ' + C.Tiempo.bloqueo() + ')'); break; }
    jugadas++;
    if (jugadas % 52 === 0) {
      const r = raros(E); if (r.length) { problemas.push('año ' + jugadas / 52 + ': ' + r.join('; ')); break; }
      const esc = U.suma(Object.values(E.paises.ES.escanos)); if (esc !== 350) { problemas.push('año ' + jugadas / 52 + ': el Congreso suma ' + esc + ' escaños'); break; }
      const v = idaYVuelta(E); E = v.E2; if (!v.igual) desiguales++;
    }
  }
  const seg = Math.round((Date.now() - t0) / 100) / 10;
  ok(!problemas.length && jugadas === SEM && E.fecha.t - t00 === SEM, `${p.id}: ${jugadas} semanas hasta ${U.fmtT(E.fecha.t)} como ${C.Personaje.cargoTxt(E)} (${seg} s)` + (problemas.length ? ' — ' + problemas[0] : ''));
  ok(errores === 0, `${p.id}: sin errores del juego durante la partida` + (errores ? ' — ' + errTxt.slice(0, 2).join(' | ') : ''));
  ok(piloto.desatascos.length === 0, `${p.id}: ninguna decisión se quedó sin resolver` + (piloto.desatascos.length ? ' — ' + piloto.desatascos.slice(0, 2).join(' | ') : ''));
  ok(desiguales === 0, `${p.id}: guardar y cargar cada año deja la partida igual (estable tras la primera carga)`);
  const kb = Math.round(JSON.stringify(E).length / 1024), msSem = Math.round((Date.now() - t0) / Math.max(1, jugadas));
  ok(kb < 400 + 400 * (SEM / 52) && msSem < 150, `${p.id}: la partida no se hincha ni se ralentiza (${kb} KB y ${msSem} ms por semana tras ${Math.round(SEM / 52)} años)`);
}
console.error = oe;
console.log('fallos', fallos); process.exit(fallos ? 1 : 0);

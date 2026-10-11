/* Prueba del mapa de España: geometría real (data/mapa-es.js), capas de datos, dibujo SVG, marcas y enfoque por cargo. Uso: node tools/mapa-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/mapa-es.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js','data/eventos-campana.js','data/crisis-directo.js','data/programa.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/estructural.js','js/sistemas/exterior.js','js/sistemas/lenguas.js','js/sistemas/local2.js','js/sistemas/conferencia.js','js/sistemas/guia.js','js/sistemas/ajustes.js','js/sistemas/escenarios.js','js/sistemas/campana3.js','js/sistemas/nemesis.js','js/sistemas/dilemas.js','js/sistemas/metas.js','js/sistemas/barones.js','js/sistemas/presion.js','js/sistemas/intriga.js','js/sistemas/crisis2.js','js/sistemas/debate.js','js/sistemas/sesion.js','js/sistemas/vida.js','js/sistemas/fama.js','js/sistemas/escision.js','js/sistemas/sede.js','js/sistemas/pactos2.js','js/sistemas/fusion.js','js/sistemas/satelites.js','js/sistemas/militancia.js','js/sistemas/rivales.js','js/sistemas/objetivos.js','js/sistemas/informe.js','js/sistemas/foco.js','js/sistemas/art155.js','js/sistemas/ccaa2.js','js/sistemas/disolucion.js','js/sistemas/financia.js','js/sistemas/campmun.js','js/sistemas/crisis3.js','js/sistemas/constit.js','js/sistemas/gobaut.js','js/ui/escudos.js','js/ui/logos.js','js/ui/mapa.js','js/ui/mosaico.js','js/sistemas/oposicion.js','js/sistemas/legado.js'];

const C = mini(F), U = C.U;
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const D = C.DATA, G = D.mapaEs, Mp = C.Mapa, ids = Object.keys(D.provincias);
const limpio = s => typeof s === 'string' && !/NaN|undefined|\bnull\b/.test(s);
const nuevo = (o = {}) => { const E = C.Mundo.nueva(Object.assign({ semilla: 77, partido: 'ES_ASD', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' }, o)); C.E = E; return E; };
const cuenta = (s, re) => (s.match(re) || []).length;

console.log('Geometría real (Natural Earth, dominio público)');
{ const gp = Object.keys(G.prov);
  ok(ids.length === 52 && gp.length === 52 && ids.every(p => G.prov[p]), 'las 52 circunscripciones (50 provincias, Ceuta y Melilla) tienen su contorno');
  ok(gp.every(p => /^M-?\d+ -?\d+/.test(G.prov[p]) && !/NaN|undefined/.test(G.prov[p]) && cuenta(G.prov[p], /-?\d+/g) >= 8), 'los contornos son rutas SVG bien formadas, con vértices suficientes');
  ok(Object.keys(D.ccaa).length === 19 && Object.keys(G.ccaa).length === 19 && Object.keys(G.ccaa).every(c => D.ccaa[c]), 'las 19 comunidades están en el mapa');
  ok(ids.every(p => G.ccaa[D.provincias[p][1]].includes(p)) && Object.values(G.ccaa).flat().length === 52, 'cada provincia está en su comunidad, sin repeticiones');
  ok(ids.every(p => { const b = G.bb[p], c = G.cen[p]; return b && c && c[0] >= b[0] && c[0] <= b[2] && c[1] >= b[1] && c[1] <= b[3]; }), 'el centro de cada provincia cae dentro de su caja');
  ok(ids.every(p => { const b = G.bb[p]; return b[0] >= -10 && b[1] >= -10 && b[2] <= G.vb[2] + 10 && b[3] <= G.vb[3] + 10; }), 'todas las cajas caben en el lienzo (' + G.vb.join(' × ') + ')');
  ok(Object.keys(D.ccaa).every(c => G.ccBb[c] && G.ccCen[c]), 'cada comunidad tiene caja y centro para encuadrar y etiquetar');
  const m = D.municipios, fuera = m.filter(x => { const p = G.ciu[x[0]], b = G.bb[x[2]]; return !p || p[0] < b[0] - 70 || p[0] > b[2] + 70 || p[1] < b[1] - 70 || p[1] > b[3] + 70; });
  ok(m.length === 66 && !fuera.length, 'las 66 grandes ciudades caen dentro (o junto a la costa) de su provincia' + (fuera.length ? ': ' + fuera.map(x => x[1]).join(', ') : ''));
  const cp = ids.filter(p => D.provincias[p][1] === 'CAN'), I = G.inset;
  ok(cp.length === 2 && cp.every(p => { const b = G.bb[p]; return b[0] >= I[0] - 5 && b[1] >= I[1] - 5 && b[2] <= I[0] + I[2] + 5 && b[3] <= I[1] + I[3] + 5; }), 'Canarias va en su recuadro propio');
  ok(ids.filter(p => D.provincias[p][1] !== 'CAN').every(p => G.bb[p][3] < I[1]), 'ninguna provincia peninsular invade el recuadro de Canarias');
  ok(['bExt', 'bCcaa', 'bProv'].every(k => typeof G[k] === 'string' && G[k].length > 1000), 'hay bordes exteriores, autonómicos y provinciales');
  ok(G.bProv.length > 3000 && G.bCcaa.length > 3000 && G.bExt.length > G.bCcaa.length, 'los bordes interiores (provinciales dentro de cada comunidad y autonómicos) y la costa se dibujan por separado');
  const kb = Math.round(JSON.stringify(G).length / 1024); ok(kb < 90, 'el mapa pesa poco (' + kb + ' KB)'); }

console.log('Capas de datos');
{ const E = nuevo();
  ok(Mp.CAPAS.length >= 16 && new Set(Mp.CAPAS.map(c => c.id)).size === Mp.CAPAS.length, 'hay ' + Mp.CAPAS.length + ' capas con identificador único');
  ok(Mp.grupos().map(g => g.n).join() === 'Política,Territorio,Economía,Emergencias,Partido', 'las capas se agrupan en 5 familias: ' + Mp.grupos().map(g => g.n + ' (' + g.capas.length + ')').join(', '));
  const mal = []; for (const L of Mp.CAPAS) for (const p of ids) { const c = L.color(E, p), t = L.tt(E, p); if (!c || typeof c.f !== 'string' || !limpio(t) || t.length < 20) mal.push(L.id + ':' + p); }
  ok(!mal.length, 'las ' + Mp.CAPAS.length + ' capas dan color y aviso limpios para las 52 circunscripciones' + (mal.length ? ' (fallan ' + mal.slice(0, 5).join(',') + ')' : ''));
  const lg = Mp.CAPAS.filter(L => { const h = Mp.leyenda(E, L.id); return !limpio(h) || h.length < 30; }); ok(!lg.length, 'todas las capas tienen leyenda' + (lg.length ? ': ' + lg.map(L => L.id).join(',') : ''));
  const rk = Mp.CAPAS.filter(L => L.rank).map(L => Mp.ranking(E, L.id)); ok(rk.length >= 8 && rk.every(r => r.ids.length >= 17 && r.ids.every((x, i) => i === 0 || r.ids[i - 1].v >= x.v)), 'las capas por comunidad tienen ranking ordenado (' + rk.length + ' capas)');
  ok(Mp.ranking(E, 'voto') === null && Mp.capa('inexistente').id === 'voto', 'las capas de provincia no tienen ranking y una capa desconocida cae en «Generales»');
  const v = Mp.CAPAS.find(L => L.id === 'voto'), a = Mp.CAPAS.find(L => L.id === 'autonomico'); ok(ids.every(p => E.partidos[E.esp.prov[p].ganador].color === v.color(E, p).f), 'Generales pinta cada provincia con el color de su partido ganador');
  ok(Object.keys(D.ccaa).every(c => { const rc = E.esp.ccaa[c]; return !rc.gob || ids.filter(p => D.provincias[p][1] === c).every(p => a.color(E, p).f === E.partidos[rc.gob.partido].color); }), 'Gobierno autonómico pinta cada comunidad con el color de su gobierno');
  E.esp.ccaa.CAT.suspendida = true; ok(ids.filter(p => D.provincias[p][1] === 'CAT').every(p => a.color(E, p).h === true) && !a.color(E, 'MAD').h, 'una comunidad intervenida (artículo 155) se pinta rayada'); E.esp.ccaa.CAT.suspendida = false;
  const rv = Object.values(E.esp.ccaa).map(rc => rc.relM), g = E.paises.ES.gob.coalicion; ok(rv.every(v => v >= 0 && v <= 100) && Math.max(...rv) - Math.min(...rv) >= 30, 'la relación con Moncloa no arranca plana: va por el color del gobierno regional (de ' + Math.round(Math.min(...rv)) + ' a ' + Math.round(Math.max(...rv)) + ')');
  const afines = Object.values(E.esp.ccaa).filter(rc => rc.gob && g.includes(rc.gob.partido)), resto = Object.values(E.esp.ccaa).filter(rc => rc.gob && !g.includes(rc.gob.partido)); ok(afines.length && resto.length && Math.min(...afines.map(rc => rc.relM)) > Math.max(...resto.map(rc => rc.relM)) - 1, 'las comunidades gobernadas por socios del Gobierno central empiezan mejor con Moncloa que las demás'); }

console.log('Dibujo SVG');
{ const E = nuevo(); const bien = s => typeof s === 'string' && s.startsWith('<svg') && s.endsWith('</svg>') && limpio(s) && cuenta(s, /<g[ >]/g) === cuenta(s, /<\/g>/g);
  const mal = Mp.CAPAS.filter(L => !bien(Mp.svg(E, L.id))); ok(!mal.length, 'las ' + Mp.CAPAS.length + ' capas generan un SVG bien formado' + (mal.length ? ': ' + mal.map(L => L.id).join(',') : ''));
  const s = Mp.svg(E, 'voto'); ok(cuenta(s, /class="ficha"/g) === 52 && cuenta(s, /class="ficha m-aro"/g) === 2, 'el mapa lleva 52 contornos pulsables más los anillos de Ceuta y Melilla');
  ok(new Set([...s.matchAll(/data-prov="([A-Z]+)"/g)].map(x => x[1])).size === 52 && cuenta(s, /data-tt="/g) >= 54, 'cada circunscripción lleva su identificador y su aviso');
  ok(s.includes('viewBox="' + G.vb.join(' ') + '"') && s.includes('aria-label="Mapa de España: Generales"'), 'el lienzo y la etiqueta de accesibilidad son los esperados');
  ok(cuenta(s, /class="m-b-prov"/g) === 1 && cuenta(s, /class="m-costa"/g) === 1 && s.includes('class="m-inset"'), 'dibuja bordes provinciales, costa y recuadro de Canarias');
  const oc = Mp.svg(E, 'voto', { visible: new Set(['MAD', 'CEU']) }); ok(cuenta(oc, /fill="#16223a"/g) === 51 && /data-prov="MAD"[^>]*data-tt/.test(oc) && !/data-prov="BCN"[^>]*data-tt/.test(oc), 'con «visible» sólo se colorea lo escrutado y lo demás queda en sombra, sin avisos');
  const cat = Mp.svg(E, 'voto', { region: 'CAT' }); ok(cuenta(cat, /class="m-sel"/g) === 4, 'resalta las 4 provincias de la comunidad elegida');
  const pv = Mp.svg(E, 'voto', { region: 'CAT', prov: 'BCN' }); ok(cuenta(pv, /class="m-sel-c"/g) === 4 && cuenta(pv, /class="m-sel"/g) === 1, 'la provincia elegida destaca sobre su comunidad');
  ok(cuenta(s, /class="m-propio"/g) >= 1 && cuenta(Mp.svg(E, 'voto', { sinPropio: true }), /class="m-propio"/g) === 0, 'marca lo tuyo (tu circunscripción) y se puede desactivar');
  const ci = Mp.svg(E, 'alcaldias', { ciudades: true, muni: 'm_mad' }); ok(cuenta(ci, /data-muni="/g) === 66 && cuenta(ci, /class="ciu sel"/g) === 1, 'dibuja las 66 ciudades y resalta la elegida');
  ok(s.includes('>MAD</text>') && !Mp.svg(E, 'voto', { etq: 'no' }).includes('m-etq-est') && Mp.svg(E, 'voto', { etq: 'ccaa' }).includes('>CAT</text>'), 'las etiquetas son de provincia o de comunidad, o ninguna');
  const it = Mp.svg(E, 'voto', { interactivo: true, etq: 'no' }); ok(it.includes('class="mapa-es mapa-int"') && ['m-ciu', 'm-marc', 'm-etq'].every(k => it.includes('class="' + k + '"')), 'la versión interactiva reserva las capas dinámicas (ciudades, marcas, etiquetas)');
  ok(E.partidos.ES_ASD && Mp.svg(E, 'voto').length < 150000, 'un mapa completo pesa ' + Math.round(Mp.svg(E, 'voto').length / 1024) + ' KB de texto'); }

console.log('Marcas, lo tuyo y compatibilidad');
{ const E = nuevo(); ok(Mp.marcas(E, 'emerg').filter(m => m.ic !== '⚖️').length === 0, 'sin crisis no hay marcas de emergencia');
  const cr = C.Crisis.nueva(E, { tipo: 'incendios', sev: 2 }); const m = Mp.marcas(E, 'emerg'); ok(cr && m.length >= 1 && m.every(x => x.c && x.ic && limpio(x.t)), 'una crisis activa deja marcas en sus comunidades (' + m.length + ')');
  const L = Mp.CAPAS.find(x => x.id === 'emerg'), ca = cr.regs[0], pa = ids.find(p => D.provincias[p][1] === ca); ok(L.color(E, pa).f !== Mp.ESC.NEUTRO && /Nivel|Emergencia/.test(L.tt(E, pa)), 'la comunidad afectada se pinta con el nivel de emergencia');
  E.esp.ccaa.CAT.suspendida = true; ok(Mp.marcas(E, 'voto').some(x => x.c === 'CAT' && x.ic === '⚖️'), 'el artículo 155 deja su marca en la comunidad intervenida'); E.esp.ccaa.CAT.suspendida = false;
  ok(nuevo().jugador && Mp.propio(nuevo({ nivel: 'nacional' })).prov === 'MAD', 'tu circunscripción es lo tuyo cuando juegas a nivel nacional');
  ok(Mp.propio(nuevo({ nivel: 'autonomico', region: 'CAT' })).ccaa === 'CAT' && Mp.propio(nuevo({ nivel: 'local', muni: 'm_bcn', region: 'CAT' })).muni === 'm_bcn', 'tu comunidad o tu ciudad son lo tuyo a nivel autonómico o local');
  const E2 = nuevo(); ok(C.Mosaico.provincias(E2, 'voto', { altoMax: 230 }) === Mp.svg(E2, 'voto', { altoMax: 230 }) && C.Mosaico.leyendaEs(E2, 'voto') === Mp.leyenda(E2, 'voto'), 'las pantallas antiguas (Elecciones, Noche, Sede, Creación) reciben el mapa real por el mismo camino'); }

console.log('Integración con el enfoque por cargo');
{ for (const [nom, o] of [['nacional', {}], ['autonómico', { nivel: 'autonomico', region: 'CAT' }], ['local', { nivel: 'local', muni: 'm_bcn', region: 'CAT' }]]) { const E = nuevo(o);
    ok(C.Foco.pantalla(E, 'mapa') && C.Foco.principales(E).includes('mapa') && C.Foco.principales(E).length === 5, 'jugando a nivel ' + nom + ', «Mapa» está en el menú y en la barra inferior del móvil (' + C.Foco.principales(E).join(', ') + ')'); }
  const E = nuevo(); E.meta.ajustes = Object.assign({}, E.meta.ajustes, { foco: 'todo' }); ok(C.Foco.pantalla(E, 'mapa') && C.Foco.principales(E).includes('mapa'), 'con el enfoque desactivado también se ve'); }
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

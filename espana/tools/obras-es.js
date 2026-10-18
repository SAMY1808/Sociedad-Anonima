/* Prueba de las obras públicas sobre el mapa (sistemas/obras.js): modelo de coste y plazo, normas de cada tipo, quién puede ordenar o pedir cada obra, ciclo de vida
   (anuncio, construcción, incidentes, inauguración, cancelación), efectos (aprobación, agravio, relación con Moncloa, economía y voto por provincia), tope de obras y
   endeudamiento, administraciones que construyen por su cuenta, partidas antiguas sin obras, estado serializable y una partida larga del piloto con obras al azar.
   Uso: node tools/obras-es.js */
const mini = require('./mini'), modulos = require('./modulos');
const C = mini(modulos()), U = C.U, Ob = C.Obras, D = C.DATA, piloto = require('./piloto')(C);
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
const base = { semilla: 5, partido: 'ES_ASD', nombre: 'Prueba', trayectoria: 'abogado', pais: 'ES', nivel: 'nacional', rol: 'lider', region: 'MAD', muni: 'm_mad' };
const nuevo = (o = {}) => C.Mundo.nueva(Object.assign({}, base, o));
const sinNaN = (x, ruta = '') => { const mal = []; (function rec(v, r) { if (v === null || v === undefined) return; if (typeof v === 'number') { if (!isFinite(v)) mal.push(r); } else if (Array.isArray(v)) v.forEach((y, i) => rec(y, r + '[' + i + ']')); else if (typeof v === 'object') for (const k in v) rec(v[k], r + '.' + k); })(x, ruta); return mal; };
const avanza = (E, n) => { for (let i = 0; i < n; i++) { piloto.resolver(E); C.Tiempo.avanzar(); } };
const pm = E => { const J = E.jugador; J.cargo = 'pm'; return E; };

console.log('Red inicial y modelo de coste');
{ const E = nuevo(), o = Ob.asegurar(E), pares = new Set();
  const n = t => o.lista.filter(w => w.tipo === t && w.quien === 'red').length;
  ok(n('autovia') > 40 && n('ave') >= 12 && n('electrica') >= 10, `la red existente trae ${n('autovia')} autovías, ${n('ave')} tramos de alta velocidad y ${n('electrica')} líneas eléctricas`);
  let dup = 0, mal = 0; for (const w of o.lista) { const k = w.tipo + [w.a, w.b].sort().join('-'); if (pares.has(k)) dup++; pares.add(k); if (!D.mapaEs.ciu[w.a] || !D.mapaEs.ciu[w.b] || !w.provs.length) mal++; }
  ok(!dup && !mal, 'sin tramos repetidos y todos con ciudades y provincias válidas');
  ok(Ob.asegurar(E) === o && o.lista.length === Object.values(Ob.RED0).reduce((s, l) => s + l.length, 0), 'asegurar es idempotente (no vuelve a sembrar la red)');
  const km = (a, b) => Ob.km(a, b);
  ok(Math.abs(km('m_mad', 'm_bcn') - 505) < 20 && Math.abs(km('m_mad', 'm_sev') - 390) < 20, `las distancias salen del mapa y son reales (Madrid–Barcelona ${Math.round(km('m_mad', 'm_bcn'))} km, Madrid–Sevilla ${Math.round(km('m_mad', 'm_sev'))} km)`);
  const corta = Ob.chequear(E, 'autovia', 'm_mad', 'm_leo'), larga = Ob.chequear(E, 'autovia', 'm_mad', 'm_vig'), ave = Ob.chequear(E, 'ave', 'm_mad', 'm_vig');
  ok(corta.ok && larga.ok && ave.ok && larga.info.coste > corta.info.coste && larga.info.sem > corta.info.sem, `más distancia, más coste y más plazo (Madrid–León ${Ob.eur(corta.info.coste)} / ${Ob.plazo(corta.info.sem)}; Madrid–Vigo ${Ob.eur(larga.info.coste)} / ${Ob.plazo(larga.info.sem)})`);
  ok(ave.info.coste > 2 * larga.info.coste && ave.info.sem > larga.info.sem, `la alta velocidad cuesta y tarda mucho más que la autovía (${Ob.eur(ave.info.coste)} / ${Ob.plazo(ave.info.sem)})`);
  const mont = Ob.chequear(E, 'autovia', 'm_snt', 'm_ovi'), llano = Ob.chequear(E, 'autovia', 'm_cre', 'm_bda');
  ok(mont.ok && llano.ok && mont.info.relieve > llano.info.relieve, `el terreno accidentado encarece (cornisa cantábrica ×${mont.info && mont.info.relieve} frente a la llanura manchega ×${llano.info && llano.info.relieve})`);
  const mar = Ob.chequear(E, 'electrica', 'm_alm', 'm_mel'), tierra = Ob.chequear(E, 'electrica', 'm_mad', 'm_tol');
  ok(mar.ok && mar.info.mar && mar.info.coste / mar.info.km > 2 * tierra.info.coste / tierra.info.km, 'el cable submarino cuesta por kilómetro mucho más que la línea por tierra');
  const aer1 = Ob.chequear(E, 'aeropuerto', 'm_mad', null), aer2 = Ob.chequear(E, 'aeropuerto', 'm_sor', null);
  ok(aer1.ok && aer2.ok && aer1.info.imp > aer2.info.imp && aer1.info.coste > aer2.info.coste, 'un aeropuerto en Madrid es más importante y caro que uno en Soria');
  const todas = Object.keys(Ob.TIPOS).every(t => { const T = Ob.TIPOS[t]; return T.ic && T.n && T.desc && T.art && T.nom; }); ok(todas, 'los siete tipos de obra tienen icono, nombre y descripción'); }

console.log('Normas de cada tipo');
{ const E = nuevo(), no = (tipo, a, b, re) => { const v = Ob.chequear(E, tipo, a, b); return !v.ok && re.test(v.motivo); };
  ok(no('autovia', 'm_mad', 'm_pal2', /por tierra/), 'no hay autovía entre la Península y Palma');
  ok(no('ave', 'm_lpa', 'm_tfe', /por tierra/), 'tampoco alta velocidad entre islas');
  ok(no('electrica', 'm_mad', 'm_lpa', /Canarias/), 'Canarias es un sistema eléctrico aislado');
  ok(no('electrica', 'm_ceu', 'm_mel', /Península/) && no('electrica', 'm_pal2', 'm_mel', /Península/), 'las islas y las ciudades autónomas no se conectan entre sí, sino con la Península');
  ok(Ob.chequear(E, 'electrica', 'm_mal', 'm_ceu').ok, 'sí se puede tender un cable submarino a Ceuta');
  ok(no('autovia', 'm_mad', 'm_get', /cerca/), 'demasiado cerca para una autovía');
  ok(no('ave', 'm_mad', 'm_get', /cerca/), 'demasiado cerca para alta velocidad');
  ok(no('autovia', 'm_mad', 'm_mad', /misma ciudad/), 'origen y destino distintos');
  ok(no('autovia', 'm_mad', 'm_zar', /ya existe|ya se está/), 'una conexión que ya existe no se repite');
  ok(no('autovia', 'm_lpa', 'm_lpa', /misma ciudad/) && Ob.chequear(E, 'autovia', null, null).incompleto, 'sin origen o sin destino pide elegirlos');
  ok(Ob.chequear(E, 'tren', 'm_mad', 'm_bcn').motivo === 'Tipo de obra desconocido', 'tipo desconocido');
  const lejos = Ob.chequear(E, 'autovia', 'm_aco', 'm_alm'); ok(!lejos.ok && /lejos/.test(lejos.motivo), 'demasiado lejos: se divide en tramos');
  // Obras puntuales: niveles
  const n0 = Ob.nivel(E, 'm_mad', 'aeropuerto'), nS = Ob.nivel(E, 'm_sor', 'aeropuerto'); ok(n0 >= 2 && nS === 0, `el aeropuerto de Madrid parte de nivel ${n0}; Soria no tiene (${nS})`);
  const o = Ob.asegurar(E); o.niv.m_mad = { aeropuerto: Ob.TIPOS.aeropuerto.maxNiv }; ok(no('aeropuerto', 'm_mad', null, /no puede albergar más/), 'una ciudad no pasa del nivel máximo');
  const v = Ob.chequear(E, 'solar', 'm_alm', null); ok(v.ok, 'parque solar en Almería'); }

console.log('Quién puede ordenar y quién puede pedir');
{ const E = nuevo(), J = E.jugador; pm(E);
  const ord = (tipo, a, b) => Ob.puedeOrdenar(E, { tipo, a, b });
  ok(ord('autovia', 'm_mad', 'm_leo') === true && ord('ave', 'm_mad', 'm_vig') === true && ord('electrica', 'm_mad', 'm_leo') === true && ord('solar', 'm_alm') === true, 'el presidente del Gobierno ordena autovías, alta velocidad, red eléctrica y energía');
  ok(/competencia de las comunidades/.test(ord('hospital', 'm_mad')) && /competencia de las comunidades/.test(ord('campus', 'm_mad')), 'pero un hospital o un campus son de las comunidades');
  ok(ord('hospital', 'm_ceu') === true, 'salvo en Ceuta y Melilla, donde la sanidad es estatal');
  J.cargo = 'ministro'; J.ministerio = 'tpt'; ok(ord('autovia', 'm_mad', 'm_leo') === true && ord('ave', 'm_mad', 'm_vig') === true && ord('aeropuerto', 'm_sev') === true && /cartera/.test(ord('electrica', 'm_mad', 'm_leo')), 'el ministro de Transportes ordena carreteras, trenes y aeropuertos, pero no la red eléctrica');
  J.ministerio = 'amb'; ok(ord('electrica', 'm_mad', 'm_leo') === true && ord('solar', 'm_alm') === true && /cartera/.test(ord('autovia', 'm_mad', 'm_leo')), 'el de Transición Ecológica, la red eléctrica y la energía');
  J.ministerio = 'sal'; ok(Ob.autoridad(E).nivel === 'ninguno' && /cartera/.test(ord('autovia', 'm_mad', 'm_leo')), 'otros ministerios no ordenan obras (se piden)');
  J.cargo = 'presauto'; J.region = 'CYL'; ok(ord('autovia', 'm_leo', 'm_bur') === true && ord('hospital', 'm_leo') === true && ord('campus', 'm_sal') === true && ord('solar', 'm_vll') === true, 'el presidente de Castilla y León ordena autovías, hospitales, campus y parques solares en su comunidad');
  ok(/dentro de su territorio/.test(ord('autovia', 'm_leo', 'm_mad')) && /dentro de su territorio/.test(ord('hospital', 'm_mad')), 'pero no fuera de ella');
  ok(/competencia del Estado/.test(ord('ave', 'm_leo', 'm_bur')) && /competencia del Estado/.test(ord('aeropuerto', 'm_leo')), 'alta velocidad y aeropuertos son del Estado');
  J.cargo = 'diputado'; ok(/no ordena/.test(ord('autovia', 'm_leo', 'm_bur')) && Ob.autoridad(E).nivel === 'ninguno', 'un diputado no ordena nada');
  J.cargo = 'alcalde'; ok(Ob.autoridad(E).tipos.length === 0, 'un alcalde tampoco');
  // Pedir
  const ped = (tipo, a, b) => Ob.puedePedir(E, { tipo, a, b });
  ok(ped('autovia', 'm_leo', 'm_bur') === true && ped('hospital', 'm_mad') === true, 'se puede pedir lo que no se ordena');
  pm(E); ok(/Puedes ordenarla/.test(ped('autovia', 'm_mad', 'm_leo')), 'quien puede ordenar una obra no la pide');
  ok(Ob.decisor(E, 'hospital', 'm_leo') === 'CYL' && Ob.decisor(E, 'ave', 'm_mad', 'm_vig') === 'E' && Ob.decisor(E, 'autovia', 'm_leo', 'm_bur') === 'CYL' && Ob.decisor(E, 'autovia', 'm_leo', 'm_mad') === 'E' && Ob.decisor(E, 'hospital', 'm_ceu') === 'E', 'decide quien tiene la competencia: la comunidad, el Estado o (si la vía cruza comunidades) el Estado');
  J.cargo = 'diputado'; J.partido = 'ES_ASD'; const g = E.paises.ES.gob; g.partido = 'ES_ASD'; g.coalicion = ['ES_ASD'];
  const pSame = Ob.probPedir(E, 'ave', 'm_mad', 'm_vig'); g.partido = 'ES_PPI'; g.coalicion = ['ES_PPI']; const pOpo = Ob.probPedir(E, 'ave', 'm_mad', 'm_vig');
  ok(pSame > pOpo + 0.2 && pOpo >= 0.04 && pSame <= 0.88, `pedirle una obra a un Gobierno de tu partido es mucho más fácil (${Math.round(pSame * 100)} % frente a ${Math.round(pOpo * 100)} %)`);
  J.pop = 90; const pPop = Ob.probPedir(E, 'ave', 'm_mad', 'm_vig'); J.pop = 10; const pImp = Ob.probPedir(E, 'ave', 'm_mad', 'm_vig'); ok(pPop > pImp, 'la popularidad ayuda a conseguirlo'); }

console.log('Ordenar una obra y verla construirse');
{ const E = pm(nuevo({ semilla: 7 })), J = E.jugador, o = Ob.asegurar(E), P = E.paises.ES;
  const r = C.Acciones.ejecutar('obra_lanzar', { tipo: 'autovia', a: 'm_mad', b: 'm_leo' });
  ok(r.ok && /Ordenas la autovía Madrid–León/.test(r.msg), 'la acción ordena la autovía Madrid–León: ' + r.msg);
  const w = Ob.activas(E)[0]; ok(w && w.owner === 'E' && w.quien === 'jug' && w.estado === 'curso' && w.prog === 0, 'queda en obras, pagada por el Estado y ordenada por el jugador');
  ok(J.agenda.puntos === 4 && J.agenda.hechas.some(h => h.id === 'obra_lanzar'), 'cuesta 2 puntos de agenda');
  ok(E.noticias.some(n => /anuncia la autovía Madrid–León/.test(n.texto)), 'sale en las noticias');
  ok(Ob.chequear(E, 'autovia', 'm_mad', 'm_leo').ok === false, 'ya no se puede ordenar de nuevo');
  const def0 = P.ec.pol.deficit, ap0 = P.gob.aprob, rm0 = E.esp.ccaa.CYL.relM, ag0 = E.esp.ccaa.CYL.agravio; E.esp.ccaa.CYL.agravio = 3; const ag1 = 3;
  avanza(E, 20); ok(w.prog > 0.1 && w.gast > 0 && P.ec.pol.deficit > def0, `mientras se construye sube el déficit (${def0.toFixed(3)} → ${P.ec.pol.deficit.toFixed(3)} pp) y avanza la obra (${Math.round(w.prog * 100)} %)`);
  let guardia = 0; while (w.estado === 'curso' && guardia++ < 400) avanza(E, 1);
  ok(w.estado === 'hecha' && w.t1 != null && Math.abs((w.t1 - w.t0) - w.dur) < 90, `se inaugura a las ${w.t1 - w.t0} semanas (previstas ${w.dur}; los incidentes la alargan o encarecen)`);
  ok(E.noticias.some(n => /Se inaugura la autovía Madrid–León/.test(n.texto)), 'la inauguración sale en las noticias');
  ok(Object.keys(o.bonus).length >= 3 && Object.values(o.bonus).every(b => Object.values(b).every(v => v > 1 && v <= 1.1)), `deja un crédito electoral acotado en ${Object.keys(o.bonus).length} provincias`);
  ok(E.esp.ccaa.CYL.agravio < ag1, `baja el agravio de Castilla y León (${ag1} → ${E.esp.ccaa.CYL.agravio.toFixed(2)})`);
  ok(o.hist.some(h => /inaugura/.test(h.txt)), 'queda en la bitácora de obras');
  ok(w.gast === w.coste && w.coste >= 1900, `el gasto total coincide con el coste final (${Ob.eur(w.coste)})`);
  ok(!sinNaN(o).length && !sinNaN(E.paises.ES.ec).length, 'sin valores NaN'); }

console.log('Efecto en el voto: sólo para quien gobierna, sólo donde pasa la obra');
{ const E = pm(nuevo({ semilla: 9 })), o = Ob.asegurar(E), gob = E.paises.ES.gob.partido;
  const ant = {}; for (const p of Object.keys(D.provincias)) ant[p] = C.Es.votosProv(E, p, 0);
  const w = Ob._crear(E, 'autovia', 'm_zar', 'm_pam', 'E', 'jug'); w.prog = 0.999; Ob._avanzar(E, o, w);
  ok(w.estado === 'hecha', 'se inaugura la autovía Zaragoza–Pamplona');
  const tocadas = new Set(w.provs.map(q => q[0])); let sube = 0, intactas = 0, suma = 0;
  for (const p of Object.keys(D.provincias)) { const v = C.Es.votosProv(E, p, 0); suma = Math.max(suma, Math.abs(U.suma(Object.values(v)) - 100)); if (tocadas.has(p)) { if (v[gob] > ant[p][gob]) sube++; } else if (Math.abs(v[gob] - ant[p][gob]) < 1e-9) intactas++; }
  ok(sube === tocadas.size && intactas === Object.keys(D.provincias).length - tocadas.size, `el partido del Gobierno sube en las ${tocadas.size} provincias que cruza y en ninguna más`);
  ok(suma < 1e-6, 'el reparto de voto de cada provincia sigue sumando 100');
  const otro = E.paises.ES.partidos.find(k => k !== gob && E.partidos[k].amb === 'nac'), p0 = w.provs[0][0], antes = ant[p0][otro], ahora = C.Es.votosProv(E, p0, 0)[otro];
  ok(ahora < antes, 'los demás partidos nacionales ceden algo en esas provincias (el reparto es relativo)');
  // El crédito se diluye con los años
  const m0 = o.bonus[p0][gob]; for (let i = 0; i < 104; i++) Ob.turno(E);
  ok(o.bonus[p0] && o.bonus[p0][gob] < m0 && o.bonus[p0][gob] > 1, `el crédito se diluye con el tiempo (${m0.toFixed(4)} → ${o.bonus[p0][gob].toFixed(4)} en dos años)`);
  for (let i = 0; i < 1200; i++) Ob.turno(E); ok(Object.keys(o.bonus).length === 0, 'y acaba desapareciendo'); }

console.log('Obras de una comunidad: pagan la deuda autonómica');
{ const E = nuevo({ semilla: 11 }), J = E.jugador, o = Ob.asegurar(E); J.cargo = 'presauto'; J.region = 'AND';
  const rc = E.esp.ccaa.AND; rc.gob = rc.gob || { partido: J.partido, coalicion: [J.partido], aprob: 50, estab: 60, pres: 'J', tipo: 'mayoria' };
  const r = C.Acciones.ejecutar('obra_lanzar', { tipo: 'hospital', a: 'm_mal' }); ok(r.ok, 'el presidente de Andalucía ordena un hospital en Málaga: ' + r.msg);
  const w = Ob.activas(E, 'AND')[0]; ok(w && w.owner === 'AND', 'la obra es de la comunidad');
  const d0 = rc.deuda, def0 = E.paises.ES.ec.pol.deficit; for (let i = 0; i < 30; i++) Ob.turno(E);
  ok(rc.deuda > d0 && E.paises.ES.ec.pol.deficit === def0, `la paga la comunidad (deuda ${d0.toFixed(2)} → ${rc.deuda.toFixed(2)} %), no el Estado`);
  const n0 = Ob.nivel(E, 'm_mal', 'hospital'), ap = rc.gob.aprob; w.prog = 0.9999; w.pausa = 0; Ob.turno(E);
  ok(w.estado === 'hecha' && Ob.nivel(E, 'm_mal', 'hospital') === n0 + 1, `al inaugurarlo, el hospital de Málaga sube de nivel (${n0} → ${n0 + 1})`);
  ok(rc.gob.aprob > ap, 'y sube la aprobación del Gobierno andaluz');
  ok(E.noticias.some(n => /Se inaugura el hospital de Málaga/.test(n.texto) && n.amb === 'aut' && n.reg === 'AND'), 'la noticia es autonómica de Andalucía');
  ok(Ob.chequear(E, 'hospital', 'm_mal', null).ok, 'se puede ampliar otra vez hasta el nivel máximo'); }

console.log('Límites: obras a la vez, déficit excesivo y deuda');
{ const E = pm(nuevo({ semilla: 13 })), P = E.paises.ES;
  const lanzar = (t, a, b) => C.Acciones.ejecutar('obra_lanzar', { tipo: t, a, b }); E.jugador.agenda.puntos = 99;
  const lista = [['autovia', 'm_mad', 'm_leo'], ['autovia', 'm_bil', 'm_zar'], ['solar', 'm_alm'], ['solar', 'm_sev'], ['solar', 'm_mur']];
  const rs = lista.map(x => lanzar(...x)); ok(rs.slice(0, 4).every(r => r.ok) && !rs[4].ok && /máximo 4/.test(rs[4].msg), 'el Estado no lleva más de 4 obras a la vez: ' + rs[4].msg);
  const E2 = pm(nuevo({ semilla: 14 })); E2.paises.ES.ec.pde = true; E2.jugador.agenda.puntos = 9;
  const caro = C.Acciones.ejecutar('obra_lanzar', { tipo: 'ave', a: 'm_mad', b: 'm_vig' }), barato = C.Acciones.ejecutar('obra_lanzar', { tipo: 'solar', a: 'm_alm' });
  ok(!caro.ok && /déficit excesivo/.test(caro.msg) && barato.ok, 'con el procedimiento de déficit excesivo, Bruselas frena las obras de más de 1.000 M€: ' + caro.msg);
  const E3 = nuevo({ semilla: 15 }); E3.jugador.cargo = 'presauto'; E3.jugador.region = 'VAL'; const rv = E3.esp.ccaa.VAL; rv.gob = rv.gob || { partido: E3.jugador.partido, coalicion: [E3.jugador.partido], aprob: 50, estab: 60, pres: 'J', tipo: 'mayoria' }; rv.deuda = 70; E3.jugador.agenda.puntos = 9;
  const d = C.Acciones.ejecutar('obra_lanzar', { tipo: 'hospital', a: 'm_vlc' }); ok(!d.ok && /deuda/.test(d.msg), 'una comunidad endeudada no licita obras nuevas: ' + d.msg);
  const E5 = nuevo({ semilla: 18 }); E5.jugador.cargo = 'diputado'; for (const id of ['m_alm', 'm_sev', 'm_mur', 'm_mal']) Ob._crear(E5, 'aeropuerto', id, null, 'E', 'ia'); const pe5 = Ob.puedePedir(E5, { tipo: 'aeropuerto', a: 'm_zar' }); ok(/no la aceptará/.test(pe5) && /máximo 4/.test(pe5), 'no se pide a una administración que ya está a tope: ' + pe5);
  const E4 = pm(nuevo({ semilla: 16 })); E4.jugador.agenda.puntos = 0; ok(!C.Acciones.ejecutar('obra_lanzar', { tipo: 'solar', a: 'm_alm' }).ok, 'sin puntos de agenda no se puede ordenar'); }

console.log('Pedir una obra');
{ const E = nuevo({ semilla: 17 }), J = E.jugador; J.cargo = 'diputado'; J.agenda.puntos = 9; const g = E.paises.ES.gob; g.partido = J.partido; g.coalicion = [J.partido]; J.pop = 95;
  let exito = 0, fallo = 0, w0 = Ob.asegurar(E).lista.length; const o = Ob.asegurar(E);
  const pares = [['ave', 'm_mad', 'm_vig'], ['autovia', 'm_ovi', 'm_snt'], ['solar', 'm_alm'], ['aeropuerto', 'm_zar'], ['electrica', 'm_bil', 'm_ssb'], ['autovia', 'm_bur', 'm_leo'], ['aeropuerto', 'm_sev'], ['solar', 'm_mal']];
  for (const [t, a, b] of pares) { const r = C.Acciones.ejecutar('obra_pedir', { tipo: t, a, b }); if (r.ok && r.exito !== false) exito++; else if (r.ok) fallo++; }
  ok(exito + fallo === pares.length || exito + fallo >= 5, `se pide y se responde (${exito} aceptadas, ${fallo} rechazadas, ${pares.length - exito - fallo} no permitidas por el tope)`);
  const pedidas = o.lista.filter(w => w.quien === 'pedida'); ok(pedidas.length === exito && pedidas.every(w => w.owner === Ob.decisor(E, w.tipo, w.a, w.b) && w.estado === 'curso'), 'las aceptadas se construyen con cargo a la administración que las concede (el Estado o la comunidad) y quedan marcadas como pedidas por ti');
  ok(J.agenda.puntos === 9 - (exito + fallo), 'cada petición cuesta 1 punto de agenda');
  const rep = C.Acciones.ejecutar('obra_pedir', { tipo: 'autovia', a: 'm_ovi', b: 'm_snt' }); ok(!rep.ok, 'no se puede repetir la misma petición enseguida (' + (rep.msg || '').slice(0, 60) + ')');
  // Con un Gobierno rival acepta menos
  let aceptan = 0, tot = 0; for (let s = 0; s < 40; s++) { const e = nuevo({ semilla: 100 + s }); e.jugador.cargo = 'diputado'; e.jugador.agenda.puntos = 9; e.paises.ES.gob.partido = 'ES_PPI'; e.paises.ES.gob.coalicion = ['ES_PPI']; e.jugador.partido = 'ES_ASD'; e.jugador.pop = 30; const r = C.Acciones.ejecutar('obra_pedir', { tipo: 'solar', a: 'm_alm' }); if (r.ok) { tot++; if (r.exito !== false) aceptan++; } }
  ok(tot === 40 && aceptan < 40 * 0.6, `un Gobierno rival acepta pocas peticiones (${aceptan} de ${tot})`); }

console.log('Cancelar y acelerar');
{ const E = pm(nuevo({ semilla: 19 })); E.jugador.agenda.puntos = 99; const r = C.Acciones.ejecutar('obra_lanzar', { tipo: 'autovia', a: 'm_mad', b: 'm_leo' }); const w = Ob.activas(E)[0];
  const ac = C.Acciones.ejecutar('obra_acelerar', { id: w.id }); ok(ac.ok && w.prog >= 0.08 && w.coste > 1980, `acelerar da +8 % de avance a cambio de más coste (${Math.round(w.prog * 100)} %, ${Ob.eur(w.coste)})`);
  ok(!C.Acciones.ejecutar('obra_acelerar', { id: w.id }).ok, 'no se puede acelerar dos veces seguidas');
  const ap = E.paises.ES.gob.aprob, pop = E.jugador.pop; const ca = C.Acciones.ejecutar('obra_cancelar', { id: w.id });
  ok(ca.ok && w.estado === 'cancelada' && E.paises.ES.gob.aprob < ap && E.jugador.pop < pop, 'cancelar cuesta aprobación y popularidad: ' + ca.msg);
  ok(!Ob.visibles(E).includes(w) && Ob.activas(E).length === 0, 'una obra cancelada deja de verse y libera el cupo');
  ok(!C.Acciones.ejecutar('obra_cancelar', { id: w.id }).ok && !C.Acciones.ejecutar('obra_acelerar', { id: 'zzz' }).ok, 'no se cancela dos veces ni lo que no existe');
  const E2 = pm(nuevo({ semilla: 20 })); const aj = Ob._crear(E2, 'autovia', 'm_mad', 'm_leo', 'E', 'ia'); E2.jugador.agenda.puntos = 9; ok(!C.Acciones.ejecutar('obra_cancelar', { id: aj.id }).ok, 'sólo se cancelan las obras ordenadas por ti'); }

console.log('Las administraciones construyen por su cuenta');
{ const a = nuevo({ semilla: 21, nivel: 'nacional', rol: 'base' }); a.jugador.cargo = 'diputado';
  let anun = 0; C.Bus.on('obra:anunciada', () => anun++);
  avanza(a, 208); const o = Ob.asegurar(a), ia = o.lista.filter(w => w.quien === 'ia');
  ok(ia.length >= 3, `en cuatro años el Estado y las comunidades anuncian obras (${ia.length}: ${ia.filter(w => w.owner === 'E').length} del Estado y ${ia.filter(w => w.owner !== 'E').length} autonómicas)`);
  ok(ia.some(w => w.owner === 'E') && ia.some(w => w.owner !== 'E'), 'hay obras estatales y autonómicas');
  ok(ia.filter(w => w.estado === 'hecha').length >= 1 && E_tope(a), 'algunas se inauguran y nunca se rebasa el tope de obras en marcha');
  ok(Ob.activas(a, 'E').length <= 4 && C.Territorio.ids().every(c => Ob.activas(a, c).length <= 2), 'sin pasar del tope de cada administración');
  let ajenas = 0, mientras = 0; const p = pm(nuevo({ semilla: 22 })); C.Bus.on('obra:anunciada', ev => { if (ev.quien === 'ia' && ev.owner === 'E' && C.E === p && (p.jugador.cargo === 'pm' || p.jugador.cargo === 'vicepres')) ajenas++; }); for (let i = 0; i < 208; i++) { if (p.jugador.cargo === 'pm') mientras++; avanza(p, 1); }
  ok(mientras > 20 && !ajenas, `mientras presides el Gobierno (${mientras} semanas), el Estado no construye nada sin que tú lo ordenes`);
  const rg = nuevo({ semilla: 23 }); rg.jugador.cargo = 'presauto'; rg.jugador.region = 'GAL'; avanza(rg, 208); ok(!Ob.asegurar(rg).lista.some(w => w.quien === 'ia' && w.owner === 'GAL'), 'y si presides una comunidad, ella tampoco'); }
function E_tope(E) { return Ob.activas(E, 'E').length <= 4; }

console.log('Efecto económico, previsión y consultas');
{ const E = pm(nuevo({ semilla: 25 })), P = E.paises.ES; const pr = Ob.prevision(E, 'autovia', 'm_mad', 'm_leo');
  ok(pr.ok && pr.ordena && pr.owner === 'E' && pr.ef.aprob > 0 && pr.ef.voto > 0 && pr.ef.ec.crec > 0 && Object.keys(pr.ef.regs).includes('CYL'), 'la previsión de una autovía da aprobación, voto, crecimiento y regiones beneficiadas');
  const pe = Ob.prevision(E, 'hospital', 'm_leo', null); ok(pe.ok && !pe.ordena && pe.decisor === 'CYL' && typeof pe.prob === 'number', 'lo que no puedes ordenar se prevé como petición con su probabilidad');
  const e1 = Ob.efectos(E, { tipo: 'electrica', imp: 1, owner: 'E', provs: [['MAD', 1]] }), e2 = Ob.efectos(E, { tipo: 'electrica', imp: 1, owner: 'CYL', provs: [['MAD', 1]] });
  ok(e1.ec.infl < 0 && Math.abs(e1.ec.infl) > Math.abs(e2.ec.infl), 'la línea eléctrica abarata la energía y pesa más si la hace el Estado');
  const hos = Ob.efectos(E, { tipo: 'hospital', imp: 1, owner: 'CYL', provs: [['MAD', 1]] }), ele = Ob.efectos(E, { tipo: 'electrica', imp: 1, owner: 'E', provs: [['MAD', 1]] }); ok(hos.aprob > 2 * ele.aprob, 'un hospital da mucha más aprobación que una línea de alta tensión que nadie ve');
  const por = Ob.porProv(E); ok(Object.keys(por).length === Object.keys(D.provincias).length && por.MAD.autovia > 0 && por.SOR.eurHab >= 0, 'inversión y conexiones por provincia para el mapa');
  const t0 = E.meta.rng, s1 = JSON.stringify(Ob.sugerencias(E, 3)), s2 = JSON.stringify(Ob.sugerencias(E, 3)); Ob.porProv(E); Ob.prevision(E, 'ave', 'm_mad', 'm_vig');
  ok(E.meta.rng === t0 && s1 === s2 && JSON.parse(s1).length === 3, 'las propuestas son estables y consultar el mapa no gasta el azar de la partida');
  const sg = JSON.parse(s1); ok(sg.every(s => Ob.puedeOrdenar(E, s) === true), 'todas las propuestas se pueden ordenar de verdad'); const dip = nuevo({ semilla: 26 }); dip.jugador.cargo = 'diputado'; const sd = Ob.sugerencias(dip, 3); ok(sd.length > 0 && sd.every(s => s.modo === 'pedir'), 'quien no ordena obras recibe propuestas para pedir');
  const ob = Ob._crear(E, 'solar', 'm_alm', null, 'E', 'jug'); ok(Ob.deLaCiudad(E, 'm_alm').includes(ob) && Ob.titulo(E, ob) === 'Parque solar de Almería' && /el parque solar de Almería/.test(Ob.descripcion(E, ob)), 'consulta por ciudad y títulos'); }

console.log('Partidas antiguas y estado guardable');
{ const E = nuevo({ semilla: 27 }); delete E.esp.obras; const v0 = C.Es.votosProv(E, 'MAD', 0); ok(!!v0 && Math.abs(U.suma(Object.values(v0)) - 100) < 1e-6, 'sin obras en la partida, el voto se calcula igual');
  avanza(E, 3); ok(E.esp.obras && E.esp.obras.sembrado && E.esp.obras.lista.length > 80, 'una partida sin obras recibe la red al avanzar');
  const t = JSON.parse(JSON.stringify(E.esp.obras)); ok(JSON.stringify(t) === JSON.stringify(E.esp.obras), 'el estado es sólo datos: sobrevive a guardarlo y cargarlo');
  const E2 = pm(nuevo({ semilla: 28 })); C.Acciones.ejecutar('obra_lanzar', { tipo: 'autovia', a: 'm_mad', b: 'm_leo' }); avanza(E2, 40);
  const txt = JSON.stringify(E2); const E3 = JSON.parse(txt); C.E = E3; U.sembrar && 0; const w3 = Ob.activas(E3)[0]; ok(w3 && w3.prog > 0.1, 'una obra a medias se carga con su avance'); const a = Ob.asegurar(E3).lista.length; Ob.asegurar(E3); ok(Ob.asegurar(E3).lista.length === a, 'cargar y volver a asegurar no duplica la red'); C.E = E2; }

console.log('Partida larga con el piloto: ordena, pide, cancela y acelera obras al azar');
{ for (const [i, o] of [{ semilla: 31 }, { semilla: 32, nivel: 'autonomico', region: 'AND', muni: 'm_sev' }, { semilla: 33, partido: 'ES_UPC' }].entries()) {
    const E = nuevo(o), hechas = {}; if (i === 0) pm(E); let parado = false, ob = 0;
    for (let s = 0; s < 400; s++) { if (!piloto.semana(E, hechas)) { parado = true; break; } }
    const l = Ob.asegurar(E).lista; ob = (hechas.obra_lanzar || 0) + (hechas.obra_pedir || 0) + (hechas.obra_cancelar || 0) + (hechas.obra_acelerar || 0);
    ok(!parado, `partida ${i + 1}: el tiempo nunca se para (${E.fecha.t} semanas, ${ob} acciones de obras del piloto)`);
    const mal = l.filter(w => !(w.prog >= 0 && w.prog <= 1) || !(w.gast >= 0 && w.gast <= w.coste + 1) || !(w.dur > 0) || !(w.coste > 0)); ok(!mal.length, `partida ${i + 1}: avance, gasto y plazos coherentes en ${l.length} obras`);
    ok(!sinNaN(E).length, `partida ${i + 1}: ningún valor NaN o infinito en todo el estado`);
    ok(Ob.activas(E, 'E').length <= 4 && C.Territorio.ids().every(c => Ob.activas(E, c).length <= 2), `partida ${i + 1}: nunca se rebasa el tope de obras`);
    ok(l.filter(w => w.estado === 'hecha' && w.quien !== 'red').length >= 3, `partida ${i + 1}: se inauguran obras (${l.filter(w => w.estado === 'hecha' && w.quien !== 'red').length})`); } }

ok(errores === 0, 'sin errores internos en la consola');
console.log(fallos ? '✗ ' + fallos + ' fallos' : 'Todo bien'); process.exit(fallos ? 1 : 0);

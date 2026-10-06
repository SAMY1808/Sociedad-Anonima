/* Prueba del sistema de Presupuestos Generales: cuentas, negociación, aprobación, prórroga y ejecución. Uso: node tools/presupuesto-es.js */
/* Prueba de leyes por nivel: proposición de ley autonómica (diputado/a autonómico/a) y moción al pleno (concejal/a). Uso: node tools/leyesniv-es.js */
const mini = require('./mini');
const F = ['data/paises.js','data/partidos.js','data/nombres.js','data/instituciones.js','data/leyes.js','data/impactos.js','data/territorio.js','data/partidos-es.js','data/pactos.js','data/competencias.js','data/ue.js','data/eventos.js',
  'js/core/util.js','js/core/bus.js','js/core/estado.js','js/core/tiempo.js','js/core/acciones.js','js/sistemas/economia.js','js/sistemas/opinion.js','js/sistemas/impacto.js','js/sistemas/mundo.js','js/sistemas/elecciones.js','js/sistemas/gobierno.js',
  'js/sistemas/espana.js','js/sistemas/generales.js','js/sistemas/campana.js','js/sistemas/ejecutivo.js','js/sistemas/congreso.js','js/sistemas/consejo.js','js/sistemas/presupuesto.js','js/sistemas/gabinete.js','js/sistemas/territorio.js','js/sistemas/autonomia.js','js/sistemas/invaut.js','js/sistemas/leyesaut.js','js/sistemas/municipios.js','js/sistemas/ayuntamientos.js','js/sistemas/ue.js','js/sistemas/eventos.js','js/sistemas/personaje.js','js/sistemas/leyesniv.js','js/sistemas/jefe.js','js/sistemas/medios.js','js/sistemas/justicia.js','js/sistemas/partidoint.js','js/sistemas/social.js','js/sistemas/crisis.js','js/sistemas/campana2.js','js/sistemas/parlaut.js','js/sistemas/autogobierno.js','js/sistemas/mayorias.js','js/sistemas/corrupcion.js','js/sistemas/coaliciones.js','js/sistemas/corona.js','js/sistemas/personas.js','js/sistemas/organismos.js','js/sistemas/referendos.js','js/sistemas/legado.js'];
const C = mini(F), U = C.U;

const crear = o => C.Mundo.nueva(Object.assign({ semilla: 151, partido: 'ES_ASD', nombre: 'Test', g: 'm', edad: 40, region: 'MAD', muni: null, nivel: 'nacional', rol: 'lider' }, o));
let fallos = 0; const ok = (x, m) => { if (!x) { fallos++; console.log('  ✗', m); } else console.log('  ✓', m); };
let errores = 0; const oe = console.error; console.error = (...a) => { errores++; oe(...a); };
const E = crear({}), J = E.jugador, Pr = C.Presupuesto, ec = E.paises.ES.ec, g = E.paises.ES.gob; const pg = Pr.asegurar(E);
console.log('PGE nacional');
const n = Pr.cuentas(E, Pr.vacio()); ok(Math.abs(n.deficit - ec.base.deficit) < 0.2, `con las palancas a cero el déficit es el de base (${n.deficit.toFixed(2)} vs ${ec.base.deficit})`);
ok(Math.abs(n.totG - n.totI - n.deficit) < 1e-9 && n.totI > 35 && n.totG > 35, `ingresos ${n.totI.toFixed(1)} % y gasto ${n.totG.toFixed(1)} % del PIB`);
const l = Pr.vacio(); l.gas.sal = 15; l.gas.pens = 5; const c2 = Pr.cuentas(E, l); ok(c2.deficit > n.deficit && c2.impulso > 0.3, `más gasto sube el déficit (${n.deficit.toFixed(2)} → ${c2.deficit.toFixed(2)})`);
const l3 = Pr.vacio(); l3.ing.irpf = 10; l3.ing.iva = 10; l3.gran = 80; const c3 = Pr.cuentas(E, l3); ok(c3.deficit < n.deficit - 0.5, `más impuestos bajan el déficit (${c3.deficit.toFixed(2)})`);
ok(c2.deuda3 > c3.deuda3, 'la deuda a tres años refleja el déficit'); ok(!Pr.cuentas(E, (() => { const x = Pr.vacio(); x.gas.def = 30; x.gas.pens = 20; x.gas.sal = 25; x.ing.irpf = -15; return x; })()).ue.ok, 'la regla fiscal avisa cuando superas el 3 %');
const pd = Pr.porDefecto(E); ok(typeof pd.gas.pens === 'number' && Math.abs(pd.ing.irpf) < 12, 'borrador por defecto coherente con la ideología del Gobierno');
const socios = g.coalicion.concat(g.apoyoExterno || []).filter(k => k !== g.partido).concat(E.paises.ES.partidos.filter(k => E.partidos[k].amb === 'reg').slice(0, 1));
const dm = Pr.demandas(E, socios[0]); ok(dm.length >= 2, `${E.partidos[socios[0]].sigla} pide: ` + dm.map(d => d.n).join(' | '));
const r1 = Pr.conceder(E, socios[0], dm[0].k); ok(r1.ok && pg.borrador, r1.msg);
const rr = Pr.conceder(E, socios[0], dm[0].k); ok(rr.ok === false, 'no se concede dos veces lo mismo');
const pr = Pr.presentar(E); ok(pr && pr.pge && pg.tramite === pr.id, 'el proyecto entra en el Congreso'); ok(pr.apoyo[socios[0]] > 0, 'la concesión suma apoyo en la votación');
const crec0 = ec.pol.crec, def0 = ec.pol.deficit, sal0 = (E.esp.soc && E.esp.soc.off && E.esp.soc.off.sal) || 0;
C.Consejo.alFinalizar(E, { pge: true }, true);
ok(pg.estado === 'aprobado' && !pg.tramite && pg.ejec && pg.ultimo, 'se aprueban y arranca la ejecución'); ok(Math.abs(ec.pol.deficit - def0) > 0.001 || Math.abs(ec.pol.crec - crec0) > 0.001, 'el presupuesto mueve la economía');
const rf = pg.ultimo.deficit; ok(isFinite(rf), 'déficit presupuestado: ' + rf.toFixed(2) + ' %');
console.log('Prórroga'); const pg0 = pg.prorrogas; Pr.prorrogar(E, 'test'); ok(pg.estado === 'prorrogado' && pg.prorrogas === pg0 + 1, 'se prorroga y se erosionan los servicios');
console.log('Ejecución'); pg.ejec = { t0: E.fecha.t, deficitPrev: 2.0, crecPrev: 2, ano: 2026, cerrado: 0 }; pg.estado = 'aprobado'; ec.deficit = 3.4;
for (let i = 0; i < 80 && !(pg.hist.length && pg.desviacion); i++) { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteVotoAut = null; E.esp.pendienteConvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; ec.deficit = 3.4; pg.ejec && (pg.ejec.cerrado = pg.ejec.cerrado || 0); if (E.esp.gab) E.esp.gab.escandalo = null; C.Tiempo.avanzar(); }
ok(pg.hist.length >= 1, 'cierre de ejercicio: ' + JSON.stringify(pg.hist[0] || {}));
ok(!!pg.desviacion || pg.hist[0].gap <= 0.6, 'desviación detectada si el déficit se escapa');
if (pg.desviacion) { const m = Pr.ajustar(E, 'recorte'); ok(/ajuste/.test(m) && !pg.desviacion, 'se puede responder a la desviación'); }
console.log('Presupuesto autonómico');
const E2 = crear({ semilla: 152, nivel: 'autonomico', rol: 'lider', region: 'MAD', partido: 'ES_UPC' }), J2 = E2.jugador, T = C.Territorio, c = J2.region, rc = E2.esp.ccaa[c];
const lim = E => { E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0; E.esp.pendienteGabinete = null; E.esp.pendienteInvAut = null; E.esp.pendienteInvestidura = false; E.esp.pendienteSocio = false; E.esp.pendienteDebate = false; E.elecciones.nochePendiente = null; if (E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; T.votarLey(E, pv.c, T.leyAut(E, pv.c, pv.id), 'si'); } };
const p = T.presInit(E2, c); ok(rc.fisc && p.hist, 'presupuesto con impuestos propios e historial');
ok(T.presIntereses(E2, c) > 0 && T.presPool(E2, c, p.total) < p.total, 'los intereses se descuentan del total (' + T.presIntereses(E2, c).toFixed(2) + ' de ' + p.total.toFixed(1) + ')');
const t0 = T.presTotal(E2, c); rc.fisc.irpf = 5; ok(T.presTotal(E2, c) > t0, 'subir el IRPF autonómico sube los ingresos'); rc.fisc.irpf = 0;
J2.agenda.puntos = 20; p.pendiente = E2.fecha.t + 5;
const okp = T.presPresentar(E2, c, null, 1, false, { irpf: -4, patr: 0, suc: -5, tasas: 0 }); ok(okp && p.tramite && p.tramite.bill, 'los presupuestos entran como una ley en el Parlamento');
const bill = T.leyAut(E2, c, p.tramite.bill); ok(bill && bill.pres && bill.etapa === 'registro', 'etapa de registro');
for (let i = 0; i < 8 && bill.estado === 'tramite'; i++) { lim(E2); C.Tiempo.avanzar(); }
ok(bill.estado !== 'tramite' && !p.tramite, 'el pleno vota los presupuestos (' + bill.estado + ')');
ok(p.estado === (bill.estado === 'aprobada' ? 'aprobado' : 'prorrogado'), 'estado del presupuesto coherente: ' + p.estado);
if (bill.estado === 'aprobada') ok(rc.fisc.irpf === -4 && rc.fisc.suc === -5, 'se aprueban los impuestos propios pactados');
rc.deuda = 45; T.reglaFiscal(E2, c); ok(rc.pef === true, 'con deuda alta se exige un plan económico-financiero');
ok(T.presPresentar(E2, c, null, 2, false) === false || (p.tramite && p.tramite.def === 0), 'bajo plan económico-financiero no se autoriza déficit');
rc.deuda = 60; rc.fla = false; T.reglaFiscal(E2, c); ok(rc.fla === true, 'con deuda desbocada entra el fondo de liquidez del Estado');
rc.deuda = 30; T.reglaFiscal(E2, c); ok(!rc.pef && !rc.fla, 'al bajar la deuda se levantan las restricciones');
p.tramite = null; const l0 = (p.hist || []).length; T.presCierre(E2, c); ok(p.hist.length === l0 + 1, 'cierre de ejercicio registrado');
const gS = T.grupos(E2, c).find(x => x.id === 'sal') || T.grupos(E2, c)[1], pS = T.programasDe(E2, c, gS.id).find(x => x.tipo === 'obra');
p.cred[gS.id] = 0.001; J2.agenda.puntos = 20;
const rs = T.iniciarPrograma(E2, c, pS.id, false, false); ok(rs.ok === false && rs.deuda, 'sin crédito se ofrece financiar con deuda');
const dd0 = rc.deuda; rc.pef = false; rc.fla = false; const rd = T.iniciarPrograma(E2, c, pS.id, false, true); ok(rd.ok && rc.deuda > dd0, 'financiar con deuda sube la deuda (' + dd0.toFixed(2) + ' → ' + rc.deuda.toFixed(2) + ')');
ok(T.progCoste(E2, c, pS) < p.total * 0.3, 'el coste de un programa es proporcional al presupuesto de la comunidad (' + T.progCoste(E2, c, pS).toFixed(3) + ' de ' + p.total.toFixed(1) + ')');
console.log('errores', errores, '| fallos', fallos); process.exit(fallos || errores ? 1 : 0);

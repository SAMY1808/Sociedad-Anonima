/* Mapa: el mapa de España como centro del juego. Capas de datos, selección de comunidad, provincia o ciudad, panel con estadísticas y acciones sobre el territorio,
   zoom y desplazamiento. Pantalla «Mapa», pestaña Territorio → Mapa y tarjeta del Centro de mando. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const CORTO = { AND: 'Andalucía', ARA: 'Aragón', AST: 'Asturias', BAL: 'Baleares', CAN: 'Canarias', CNT: 'Cantabria', CLM: 'Castilla-La Mancha', CYL: 'Castilla y León', CAT: 'Cataluña', VAL: 'C. Valenciana', EXT: 'Extremadura', GAL: 'Galicia', MAD: 'Madrid', MUR: 'Murcia', NAV: 'Navarra', PVA: 'País Vasco', RIO: 'La Rioja', CEU: 'Ceuta', MEL: 'Melilla' };
  const ESCONDE = /^Sólo|^Necesitas|^Debes|^Tu partido no|^Sin gobierno|^Ya |^No hay|^Eres |^Ese |^No puedes|^No se /;
  const ccaaDe = p => D().provincias[p][1];
  const bn = c => C.Banderas ? C.Banderas.mini(c, 14) : '';
  const hoy = E => E.fecha.t, f1 = n => Math.round(n * 10) / 10;
  let activo = null;   // controlador del mapa montado (no se guarda en E: E.ui se serializa)

  /* Estado del mapa guardado en E.ui para que sobreviva a los refrescos de pantalla. */
  const estado = E => { const u = E.ui = E.ui || {}; if (!u.mapa) u.mapa = { capa: null, sel: null, cam: null }; return u.mapa; };
  /* La cámara se guarda aparte para el mapa grande y para el compacto (Centro de mando, Territorio, Crisis): cada uno recuerda su encuadre. */
  const claveCam = o => o && o.compacto ? 'camC' : 'cam', claveIni = o => o && o.compacto ? 'inicialC' : 'inicial';
  const capaPorDefecto = E => { const am = C.Foco ? C.Foco.ambito(E) : 'todo'; return am === 'aut' ? 'autonomico' : am === 'local' ? 'alcaldias' : 'voto'; };
  const muniDe = (E, p) => Object.values(E.esp.muni.m).filter(m => m.prov === p).sort((a, b) => b.pob - a.pob);

  /* Acciones que se pueden lanzar desde el territorio seleccionado (sólo las que tienen sentido para tu cargo). */
  const accionesDe = (E, tipo, id) => {
    const lista = [];
    const add = (aid, args, etq, cls) => { const a = C.Acciones.get(aid); if (!a) return; if (C.Foco && !C.Foco.accion(E, a)) return; const r = C.Acciones.razon(aid, args); if (r !== true && ESCONDE.test(String(r))) return; lista.push(UI.botonAccion(aid, args, etq, cls || 'chico')); };
    if (tipo === 'ccaa') {
      add('visita_ccaa', { region: id }, '🧳 Visitar la comunidad'); add('persuadir_comunidad', { c: id }, '🤝 Negociar con la comunidad'); add('cabildear_ccaa_fin', { c: id }, '💶 Cabildear (financiación)'); add('contrapartida_ccaa_fin', { c: id }, '🎁 Contrapartida (financiación)');
      add('plan_territorial', { c: id }, '🗺 Plan territorial'); add('cortejar_baron', { c: id }, '☕ Atender al barón'); add('cambiar_comunidad', { c: id }, '📍 Mudarme aquí');
      if (C.Crisis) for (const cr of C.Crisis.asegurar(E).activas.filter(x => x.fase !== 'cerrada' && x.regs.includes(id)).slice(0, 2)) add('visita_emergencia', { id: cr.id }, '🦺 Visitar: ' + C.Crisis.TIPOS[cr.tipo].n);
    } else if (tipo === 'prov') {
      add('mitin_prov', { prov: id }, '🎤 Mitin'); add('gasto_campana', { prov: id }, '💶 Gasto de campaña'); add('abrir_sede', { prov: id }, '🏢 Abrir sede'); add('cambiar_provincia', { prov: id }, '📍 Mudarme aquí');
    } else if (tipo === 'muni') {
      add('mitin_local', { muni: id }, '🎤 Mitin en la ciudad'); add('candidato_estrella', { muni: id }, '⭐ Candidato/a estrella');
    }
    return lista;
  };

  const chipP = (E, k) => E.partidos[k] ? Comp.partido(E, k) : '—';
  const kpi = (l, v, tip) => `<div class="kpi"${tip ? UI.tt(tip) : ''}><span class="v">${v}</span><span class="l">${l}</span></div>`;
  const val = (v, bueno, malo) => `<span class="${v >= bueno ? 'bien' : v <= malo ? 'mal' : ''}">${Math.round(v)}</span>`;

  /* ── Obras públicas (sistemas/obras.js): constructor sobre el mapa y fichas ── */
  const OB = () => C.Obras, cn = (E, id) => (E.esp.muni.m[id] || {}).nombre || id;
  const NOM_TIPO = { autovia: 'Autovía', ave: 'Alta velocidad', electrica: 'Línea eléctrica', aeropuerto: 'Aeropuerto', hospital: 'Hospital', campus: 'Campus', solar: 'Parque solar' };
  const estrellas = imp => { const n = Math.max(1, Math.min(5, Math.round(imp * 1.6))); return '★'.repeat(n) + '☆'.repeat(5 - n); };
  const ciudadesOrden = E => Object.values(E.esp.muni.m).filter(m => C.Mapa.geo().ciu[m.id]).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const pasoObra = ob => { if (!ob || !ob.tipo) return 'tipo'; const T = OB().TIPOS[ob.tipo]; if (!ob.a) return 'a'; if (T.ab && !ob.b) return 'b'; return 'listo'; };
  const ttObra = (E, w) => { const T = OB().TIPOS[w.tipo], pct = Math.round(w.prog * 100); return `<div class="tt-t">${T.ic} ${esc(OB().titulo(E, w))}</div><div class="tt-f"><span>Estado</span><b>${w.estado === 'curso' ? 'En obras · ' + pct + ' %' : w.quien === 'red' ? 'En servicio' : 'Inaugurada'}</b></div><div class="tt-f"><span>Paga</span><b>${esc(OB().duenoCorto(w.owner))}</b></div>${w.quien === 'red' ? '' : `<div class="tt-f"><span>Coste</span><b>${esc(OB().eur(w.coste))}</b></div>`}`; };
  const filaObra = (E, w) => {
    const T = OB().TIPOS[w.tipo], pct = Math.round(w.prog * 100), rest = Math.max(0, Math.round((1 - w.prog) * w.dur)) + (w.pausa || 0);
    return `<div class="it ob-fila" data-mobra-sel="${w.id}" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:3px" tabindex="0" role="button"><div class="fila" style="justify-content:space-between;gap:6px;flex-wrap:nowrap"><span style="min-width:0">${T.ic} <b>${esc(OB().titulo(E, w))}</b></span><span class="etq${w.quien === 'jug' ? ' oro' : ''}">${esc(OB().duenoCorto(w.owner))}</span></div><div class="barra-h"><i style="width:${pct}%;background:var(--oro)"></i></div><div class="tenue" style="font-size:11.5px">${pct} % · ${w.pausa ? 'paralizada · ' : ''}faltan ${esc(OB().plazo(rest))} · ${esc(OB().eur(w.coste))}</div></div>`;
  };
  const efectosHtml = (E, ef, owner, w) => {
    const regs = Object.keys(ef.regs).sort((a, b) => ef.regs[b] - ef.regs[a]).slice(0, 3).map(c => CORTO[c]).join(', ');
    const eco = { crec: 'crecimiento', paro: 'paro', infl: 'inflación' }, ecs = Object.keys(ef.ec).filter(k => eco[k] && Math.abs(ef.ec[k]) >= 0.005).map(k => `${eco[k]} ${ef.ec[k] > 0 ? '+' : '−'}${String(Math.round(Math.abs(ef.ec[k]) * 100) / 100).replace('.', ',')} pp`).join(' · ');
    const filas = [[`Aprobación de ${owner === 'E' ? 'tu Gobierno' : 'quien gobierna'}`, '+' + String(ef.aprob).replace('.', ',')], ['Voto del partido que gobierne', `+${U.d1(ef.voto * 100)} % en ${ef.provs} provincia${ef.provs === 1 ? '' : 's'}`], ['Agravio territorial', `−${String(ef.agravio).replace('.', ',')} en ${regs}`]];
    if (owner === 'E') filas.push(['Relación con Moncloa', `+${String(ef.relM).replace('.', ',')} en ${regs}`]);
    if (ecs) filas.push(['Economía', ecs]);
    return `<div class="lista" style="font-size:12.5px">${filas.map(([k, v]) => `<div class="it"><span>${k}</span><b style="margin-left:auto;text-align:right">${esc(v)}</b></div>`).join('')}</div>`;
  };
  /* Tarjeta del constructor: tipo, origen, destino, previsión y botones. */
  const panelConstructor = (E, st) => {
    const ob = st.obra, T = OB().TIPOS[ob.tipo], paso = pasoObra(ob), ids = ciudadesOrden(E);
    const opt = (sel, filtro) => '<option value="">— elige —</option>' + ids.map(m => { const t = filtro(m); return `<option value="${m.id}"${m.id === sel ? ' selected' : ''}${t.dis ? ' disabled' : ''}>${esc(m.nombre)}${t.txt ? ' · ' + esc(t.txt) : ''}</option>`; }).join('');
    const corto = s => s.length > 36 ? s.slice(0, 34) + '…' : s;
    const filtroA = m => { if (T.ab) return {}; const v = OB().chequear(E, ob.tipo, m.id, null); return v.ok ? { txt: 'nivel ' + OB().nivel(E, m.id, ob.tipo) + '/' + T.maxNiv } : { dis: true, txt: corto(v.motivo) }; };
    const filtroB = m => { if (m.id === ob.a) return { dis: true, txt: 'origen' }; const v = OB().chequear(E, ob.tipo, ob.a, m.id); return v.ok ? { txt: v.info.km + ' km' } : { dis: true, txt: corto(v.motivo) }; };
    const pr = paso === 'listo' ? OB().prevision(E, ob.tipo, ob.a, T.ab ? ob.b : null) : null;
    let cuerpo = '';
    if (pr && !pr.ok) cuerpo = `<div class="nota mal" style="margin-top:8px;font-size:12.5px">${esc(pr.motivo)}</div>`;
    else if (pr) {
      const i = pr.info, n = T.ab ? 0 : OB().nivel(E, ob.a, ob.tipo), sem = OB().plazo(i.sem), sem$ = Math.round(i.coste / Math.max(1, i.sem) * 10) / 10;
      cuerpo = `<div class="mapa-kpis" style="margin-top:10px">${T.ab ? kpi('Distancia', i.km + ' km', i.mar ? 'Con cable submarino' : 'Línea recta entre ciudades; la obra real recorre ' + i.kmObra + ' km') : kpi('Nivel', n + ' → ' + (n + 1))}${kpi('Coste', OB().eur(i.coste))}${kpi('Plazo', sem)}${kpi('Importancia', estrellas(i.imp), 'Según la población que sirve')}${kpi('Paga', esc(OB().duenoCorto(pr.owner)))}${T.ab && ob.tipo !== 'electrica' ? kpi('Terreno', '×' + String(i.relieve).replace('.', ','), 'Montañas encarecen y alargan la obra') : kpi('Gasto', U.d1(sem$) + ' M€/sem.')}</div>
        <div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 4px">Al inaugurarla</div>${efectosHtml(E, pr.ef, pr.owner)}
        <div class="tenue" style="font-size:11.5px;margin-top:6px">Mientras se construye pesa en ${pr.owner === 'E' ? 'el déficit del Estado' : 'la deuda de la comunidad'}. Pueden surgir retrasos, sobrecostes y hallazgos arqueológicos.</div>`;
      const args = { tipo: ob.tipo, a: ob.a, b: T.ab ? ob.b : null };
      if (pr.ordena) cuerpo += `${pr.motivoOrdenar ? `<div class="nota mal" style="margin-top:8px;font-size:12.5px">${esc(pr.motivoOrdenar)}</div>` : ''}<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('obra_lanzar', args, '🏗 Ordenar la obra', '')}</div>`;
      else cuerpo += `<div class="tenue" style="font-size:12.5px;margin-top:8px">${esc(pr.motivoOrdenar || '')}</div>${pr.pedir === true ? `<div class="tenue" style="font-size:12.5px;margin-top:4px">Probabilidad estimada de que acepte: <b>${Math.round(pr.prob * 100)} %</b></div>` : `<div class="nota mal" style="margin-top:6px;font-size:12.5px">${esc(String(pr.pedir))}</div>`}<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${UI.botonAccion('obra_pedir', args, '🙏 Pedir la obra', '')}</div>`;
    }
    const ayuda = paso === 'a' ? (T.ab ? 'Pulsa en el mapa la ciudad de origen (o elígela abajo).' : 'Pulsa en el mapa la ciudad (o elígela abajo).') : paso === 'b' ? 'Ahora pulsa la ciudad de destino: las que se pueden unir quedan resaltadas.' : '';
    return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${T.ic} ${esc(T.n)}</h3><button class="btn chico fant" data-mobra-x>✕ Cancelar</button></div>
      <div class="tenue" style="font-size:12.5px;margin-bottom:8px">${esc(T.desc)}</div>
      <div class="mapa-pasos"><span class="${paso === 'a' ? 'ahora' : ob.a ? 'hecho' : ''}">① ${T.ab ? 'Origen' : 'Ciudad'} <b>${ob.a ? esc(cn(E, ob.a)) : '—'}</b></span>${T.ab ? `<span class="${paso === 'b' ? 'ahora' : ob.b ? 'hecho' : ''}">② Destino <b>${ob.b ? esc(cn(E, ob.b)) : '—'}</b></span>` : ''}</div>
      ${ayuda ? `<div class="mapa-ayuda">${ayuda}</div>` : ''}
      <label class="mapa-lab">${T.ab ? 'Origen' : 'Ciudad'}<select id="ob-a" class="mapa-selc">${opt(ob.a, filtroA)}</select></label>
      ${T.ab ? `<label class="mapa-lab">Destino<select id="ob-b" class="mapa-selc"${ob.a ? '' : ' disabled'}>${opt(ob.b, filtroB)}</select></label>` : ''}${cuerpo}</div>`;
  };
  /* Panel de la capa «Obras»: lo que puedes hacer, tipos de obra, propuestas, obras en marcha. */
  const panelObras = (E, st) => {
    const Obs = OB(), aut = Obs.autoridad(E), vis = st.vis || {}, curso = Obs.activas(E), mias = curso.filter(w => w.quien === 'jug'), o = Obs.asegurar(E);
    const tipos = Obs.ORDEN.map(t => { const T = Obs.TIPOS[t], ord = aut.tipos.includes(t); return `<button class="btn chico m-tipo${ord ? ' ord' : ''}" data-mobra-tipo="${t}" title="${esc(T.desc)}">${T.ic} ${esc(T.n)}</button>`; }).join('');
    const sug = Obs.sugerencias(E, 3).map(s => { const T = Obs.TIPOS[s.tipo], tit = T.ab ? `${T.n} ${cn(E, s.a)}–${cn(E, s.b)}` : `${T.n} de ${cn(E, s.a)}`; return `<div class="it" style="gap:8px"><div style="min-width:0"><b style="font-size:13px">${T.ic} ${esc(tit)}</b><div class="tenue" style="font-size:11.5px">${s.km ? s.km + ' km · ' : ''}${esc(Obs.eur(s.coste))} · ${esc(Obs.plazo(s.sem))} · ${estrellas(s.imp)}</div></div><button class="btn chico" style="margin-left:auto" data-mobra-prep="${s.tipo}|${s.a}|${s.b || ''}">Preparar</button></div>`; }).join('');
    const filtros = ['autovia', 'ave', 'electrica'].map(t => `<button class="m-chip${vis[t] === false ? '' : ' activo'}" data-mvis="${t}">${Obs.TIPOS[t].ic} ${esc(NOM_TIPO[t])}</button>`).join('');
    const ult = o.hist.slice(0, 4).map(h => `<div class="it" style="font-size:12.5px"><span class="tenue" style="width:64px;flex:none">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('');
    const pde = E.paises.ES.ec.pde;
    return `<div class="tarjeta"><div class="t-cab"><h3>🏗 Obras públicas</h3><span class="etq${mias.length ? ' oro' : ''}">${curso.length} en marcha</span></div>
        <div class="tenue" style="font-size:12.5px">${esc(aut.texto)}</div>
        <div class="fila" style="gap:5px;flex-wrap:wrap;margin-top:8px"><span class="etq">Déficit ${U.d1(E.paises.ES.ec.deficit)} %</span><span class="etq">Deuda ${Math.round(E.paises.ES.ec.deuda)} %</span>${pde ? '<span class="etq rojo">Déficit excesivo (UE)</span>' : ''}${aut.owner ? `<span class="etq">Obras de ${esc(Obs.duenoCorto(aut.owner))}: ${Obs.activas(E, aut.owner).length}/${Obs.tope(aut.owner)}</span>` : ''}</div></div>
      <div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Nueva obra</h3></div><div class="tenue" style="font-size:12.5px;margin-bottom:6px">Elige un tipo y marca después las ciudades en el mapa. Las de borde dorado son las que puedes ordenar; el resto, las puedes pedir.</div><div class="fila" style="gap:6px;flex-wrap:wrap">${tipos}</div></div>
      ${sug ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>💡 Propuestas</h3></div><div class="lista">${sug}</div></div>` : ''}
      <div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>En marcha</h3></div>${curso.length ? `<div class="lista">${curso.map(w => filaObra(E, w)).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">No hay obras en marcha.</div>'}</div>
      <div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Ver en el mapa</h3></div><div class="fila" style="gap:6px;flex-wrap:wrap">${filtros}</div></div>
      ${ult ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Tus obras</h3></div><div class="lista">${ult}</div></div>` : ''}`;
  };
  /* Ficha de una obra concreta. */
  const panelObra = (E, id) => {
    const Obs = OB(), w = Obs.asegurar(E).lista.find(x => x.id === id); if (!w) return Panel.nacion(E, 'obras');
    const T = Obs.TIPOS[w.tipo], curso = w.estado === 'curso', pct = Math.round(w.prog * 100), rest = Math.max(0, Math.round((1 - w.prog) * w.dur)) + (w.pausa || 0), ef = Obs.efectos(E, w), mia = w.quien === 'jug';
    const est = w.estado === 'curso' ? '<span class="etq amar">En construcción</span>' : w.estado === 'cancelada' ? '<span class="etq rojo">Cancelada</span>' : w.quien === 'red' ? '<span class="etq verde">En servicio</span>' : '<span class="etq verde">Inaugurada</span>';
    const regs = Object.keys(ef.regs).map(c => `<a href="#" data-msel="ccaa:${c}">${bn(c)}${esc(CORTO[c])}</a>`).join(' · ');
    const quien = { jug: 'Ordenada por ti', pedida: 'La pediste tú', ia: 'Iniciativa de la administración', red: 'Red existente' }[w.quien];
    return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${T.ic} ${esc(Obs.titulo(E, w))}</h3>${est}</div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px">${esc(Obs.dueno(E, w.owner, true))} · ${esc(quien)}</div>
        ${curso ? `<div class="barra-h" style="margin:4px 0"><i style="width:${pct}%;background:var(--oro)"></i></div><div class="tenue" style="font-size:12px;margin-bottom:8px">${pct} % · ${w.pausa ? 'paralizada ' + w.pausa + ' semanas · ' : ''}faltan ${esc(Obs.plazo(rest))}</div>` : ''}
        <div class="mapa-kpis">${T.ab ? kpi('Distancia', w.km + ' km') : kpi('Tipo', esc(T.n))}${kpi(w.quien === 'red' ? 'Coste estimado' : 'Coste', esc(Obs.eur(w.coste)))}${kpi('Importancia', estrellas(w.imp))}</div>
        <div class="tenue" style="font-size:12px;margin-top:8px">Provincias: ${w.provs.map(q => esc(D().provincias[q[0]][0])).join(', ')}</div>
        ${w.quien === 'red' ? '' : `<div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 4px">${curso ? 'Al inaugurarla' : 'Efectos'}</div>${efectosHtml(E, ef, w.owner)}`}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mzobra="${w.id}">🔍 Acercar</button><button class="btn chico" data-mobra-todas>↰ Obras</button>${curso && mia ? UI.botonAccion('obra_acelerar', { id: w.id }, '⏩ Acelerar', 'chico') + UI.botonAccion('obra_cancelar', { id: w.id }, '🛑 Cancelar', 'chico') : ''}</div>
        <div class="tenue" style="font-size:12px;margin-top:8px">${regs}</div></div>`;
  };
  /* En la ficha de una ciudad: dotaciones, conexiones, obras en marcha y botones para proyectar desde ella. */
  const obrasCiudad = (E, id) => {
    const Obs = OB(); if (!Obs) return '';
    const ws = Obs.deLaCiudad(E, id), T = Obs.TIPOS;
    const nivs = ['aeropuerto', 'hospital', 'campus', 'solar'].map(t => { const n = Obs.nivel(E, id, t); return n ? `<span class="etq" title="${esc(T[t].n)}">${T[t].ic} ${n}/${T[t].maxNiv}</span>` : ''; }).join('');
    const lin = ['autovia', 'ave', 'electrica'].map(t => { const l = ws.filter(w => w.tipo === t && w.estado === 'hecha').map(w => esc(cn(E, w.a === id ? w.b : w.a))); return l.length ? `<div class="it" style="font-size:12.5px"><span>${T[t].ic} ${esc(T[t].n)}</span><span class="tenue" style="margin-left:auto;text-align:right">${l.slice(0, 5).join(', ')}${l.length > 5 ? '…' : ''}</span></div>` : ''; }).join('');
    const curso = ws.filter(w => w.estado === 'curso').map(w => filaObra(E, w)).join('');
    const nuevo = Obs.ORDEN.map(t => `<button class="btn chico" data-mobra-desde="${t}|${id}">${T[t].ic} ${esc(NOM_TIPO[t])}</button>`).join('');
    return `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>🏗 Obras y conexiones</h3></div>${nivs ? `<div class="fila" style="gap:5px;flex-wrap:wrap;margin-bottom:6px">${nivs}</div>` : ''}<div class="lista">${lin || '<div class="tenue" style="font-size:12.5px">Sin conexiones directas en la red.</div>'}</div>${curso ? `<div class="lista" style="margin-top:6px">${curso}</div>` : ''}<div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 4px">Proyectar desde aquí</div><div class="fila" style="gap:5px;flex-wrap:wrap">${nuevo}</div></div>`;
  };

  /* ── Paneles ── */
  const Panel = {
    nacion(E, capa) {
      const L = C.Mapa.capa(capa), P = E.paises.ES, g = P.gob, pm = E.politicos[g.pm], rk = C.Mapa.ranking(E, capa);
      let h = `<div class="tarjeta"><div class="t-cab"><h3>🇪🇸 España</h3><span class="etq">${U.fmtT(hoy(E), true)}</span></div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px">Gobierno ${chipP(E, g.partido)}${g.coalicion.length > 1 ? ' <span class="tenue">+' + (g.coalicion.length - 1) + '</span>' : ''} · ${esc(pm ? pm.n : '—')} · aprobación <b>${Math.round(g.aprob)}</b></div>
        <div class="tenue" style="font-size:12px;margin-top:4px">Generales como tarde el ${U.fmtT(E.esp.cortes.finMax)} · municipales ${U.fmtT(E.esp.muni.proxT, true)}</div></div>`;
      h += `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>${esc(L.n)}</h3></div>`;
      if (rk) {
        const fila = x => `<div class="it" data-msel="ccaa:${x.c}" style="cursor:pointer"><span>${bn(x.c)}${esc(CORTO[x.c])}</span><b style="margin-left:auto">${esc(rk.L.fmt ? rk.L.fmt(x.v) : Math.round(x.v))}</b></div>`;
        h += `<div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Valor más alto</div><div class="lista" style="font-size:12.5px">${rk.ids.slice(0, 4).map(fila).join('')}</div><div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-top:6px">Valor más bajo</div><div class="lista" style="font-size:12.5px">${rk.ids.slice(-4).reverse().map(fila).join('')}</div>`;
      } else if (capa === 'voto') {
        const es = P.escanos, ks = Object.keys(es).filter(k => es[k] > 0).sort((a, b) => es[b] - es[a]).slice(0, 7);
        h += `<div class="lista" style="font-size:12.5px">${ks.map(k => `<div class="it">${chipP(E, k)}<b style="margin-left:auto">${es[k]}</b></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Escaños en el Congreso (350). El mapa muestra el partido más votado por circunscripción.</div>`;
      } else if (capa === 'autonomico') {
        const n = {}; for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.gob) n[rc.gob.partido] = (n[rc.gob.partido] || 0) + 1; }
        h += `<div class="lista" style="font-size:12.5px">${Object.keys(n).sort((a, b) => n[b] - n[a]).map(k => `<div class="it">${chipP(E, k)}<b style="margin-left:auto">${n[k]} / 19</b></div>`).join('')}</div>`;
      } else if (capa === 'alcaldias') {
        const a = C.Municipios.alcaldias(E), ks = Object.keys(a).sort((x, y) => a[y] - a[x]).slice(0, 7);
        h += `<div class="lista" style="font-size:12.5px">${ks.map(k => `<div class="it">${k === 'IND' ? 'Indep.' : chipP(E, k)}<b style="margin-left:auto">${U.n(a[k])}</b></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Alcaldías de España (las 66 grandes ciudades y el resto estimado). Próximas municipales ${U.fmtT(E.esp.muni.proxT, true)}.</div>`;
      } else if (capa === 'emerg') {
        const cs = C.Crisis ? C.Crisis.asegurar(E).activas.filter(c => c.fase !== 'cerrada') : [];
        h += cs.length ? `<div class="lista" style="font-size:12.5px">${cs.map(cr => { const T = C.Crisis.TIPOS[cr.tipo]; return `<div class="it" data-msel="ccaa:${cr.regs[0]}" style="cursor:pointer"><span>${T.ic} ${esc(T.n)}</span><span class="tenue" style="margin-left:auto">${cr.regs.length > 4 ? 'toda España' : cr.regs.map(c => esc(CORTO[c])).join(', ')}</span></div>`; }).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">Sin emergencias activas.</div>';
      }
      h += '</div>';
      // Avisos
      const av = [];
      if (C.GobAut) for (const x of C.GobAut.resumen(E).slice(0, 4)) av.push(`<div class="it" data-msel="ccaa:${x.c}" style="cursor:pointer"><span>${bn(x.c)}${esc(CORTO[x.c])}</span><span class="etq ${x.rep ? 'rojo' : 'amar'}" style="margin-left:auto">${x.rep ? 'Elecciones repetidas' : 'En funciones'}</span></div>`);
      for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.suspendida) av.push(`<div class="it" data-msel="ccaa:${c}" style="cursor:pointer"><span>${bn(c)}${esc(CORTO[c])}</span><span class="etq rojo" style="margin-left:auto">Art. 155</span></div>`); else if (!rc.inv && semanas(E, rc.parl.proxT) <= 12) av.push(`<div class="it" data-msel="ccaa:${c}" style="cursor:pointer"><span>${bn(c)}${esc(CORTO[c])}</span><span class="etq oro" style="margin-left:auto">Elecciones en ${semanas(E, rc.parl.proxT)} sem.</span></div>`); }
      if (av.length) h += `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>⚠ En el mapa</h3></div><div class="lista" style="font-size:12.5px">${av.slice(0, 8).join('')}</div></div>`;
      return h;
    },

    ccaa(E, c, capa) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c], g = rc.gob, pres = g && E.politicos[g.pres], T = C.Territorio, M = C.Mapa.geo();
      const alertas = [];
      if (C.GobAut && C.GobAut.enFunciones(E, c)) alertas.push('<span class="etq amar">En funciones</span>');
      if (C.GobAut && E.esp.gau && E.esp.gau.rep[c]) alertas.push('<span class="etq rojo">Elecciones repetidas</span>');
      if (rc.suspendida) alertas.push('<span class="etq rojo">Intervenida (155)</span>');
      else if (E.esp.a155 && E.esp.a155.p && E.esp.a155.p[c]) alertas.push('<span class="etq rojo">Procedimiento del 155</span>');
      if (C.Crisis) for (const cr of C.Crisis.asegurar(E).activas.filter(x => x.fase !== 'cerrada' && x.regs.includes(c))) alertas.push(`<span class="etq rojo">${C.Crisis.TIPOS[cr.tipo].ic} ${esc(C.Crisis.TIPOS[cr.tipo].n)}</span>`);
      const sem = semanas(E, rc.parl.proxT); alertas.push(`<span class="etq ${sem <= 12 ? 'oro' : ''}">Elecciones ${U.fmtT(rc.parl.proxT, true)}</span>`);
      if (rc.indep > 25) alertas.push('<span class="etq amar">Independentismo alto</span>');
      const provs = (M.ccaa[c] || []).map(p => { const pr = E.esp.prov[p], dd = D().provincias[p]; return `<tr data-msel="prov:${p}" style="cursor:pointer"><td><b>${esc(dd[0])}</b></td><td class="num">${dd[2]}</td><td>${pr ? chipP(E, pr.ganador) : '—'}</td></tr>`; }).join('');
      const ms = Object.values(E.esp.muni.m).filter(m => m.ccaa === c).sort((a, b) => b.pob - a.pob).slice(0, 6).map(m => `<div class="it" data-msel="muni:${m.id}" style="cursor:pointer">${C.Escudos ? C.Escudos.mini(m.id, 14) : ''}<span>${esc(m.nombre)}</span><span style="margin-left:auto">${chipP(E, m.alcalde)}</span></div>`).join('');
      const acc = accionesDe(E, 'ccaa', c);
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${bn(c)}${esc(d.nombre)}</h3><span class="etq oro">${U.d1(d.pob)} M hab.</span></div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px;margin-bottom:6px">${g ? `Gobierno ${chipP(E, g.partido)}${g.coalicion.length > 1 ? ' <span class="tenue">+' + (g.coalicion.length - 1) + '</span>' : ''} · ${esc(pres ? pres.n : '—')}` : 'Sin gobierno'}</div>
        <div class="fila" style="gap:5px;flex-wrap:wrap;margin-bottom:8px">${alertas.join('')}</div>
        <div class="mapa-kpis">${kpi('Relación con Moncloa', val(rc.relM, 60, 30))}${kpi('Independentismo', U.d1(rc.indep) + ' %')}${kpi('Autogobierno', Math.round(rc.aut))}${kpi('Financiación', Math.round(rc.fin.nivel), 'Régimen ' + ({ comun: 'común', foral: 'foral', singular: 'singular', canario: 'canario' }[rc.fin.regimen] || rc.fin.regimen))}${kpi('Deuda', Math.round(rc.deuda) + ' %')}${g ? kpi('Aprobación', val(g.aprob, 55, 38)) + kpi('Estabilidad', val(g.estab, 65, 40)) : ''}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="ccaa:${c}">🔍 Acercar</button><button class="btn chico" data-mficha="${c}">📋 Ficha completa</button></div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}
        <div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Provincias</h3></div><div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Provincia</th><th class="num">Dip.</th><th>Más votado</th></tr></thead><tbody>${provs}</tbody></table></div></div>
        ${ms ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Grandes ciudades</h3></div><div class="lista" style="font-size:12.5px">${ms}</div></div>` : ''}`;
    },

    prov(E, p, capa) {
      const d = D().provincias[p], c = d[1], pr = E.esp.prov[p];
      const tabla = pr ? Object.keys(pr.votos).sort((a, b) => pr.votos[b] - pr.votos[a]).slice(0, 6).map(k => `<tr><td>${chipP(E, k)}</td><td class="num">${U.d1(pr.votos[k])} %</td><td class="num"><b>${pr.escanos[k] || 0}</b></td></tr>`).join('') : '';
      const acc = accionesDe(E, 'prov', p), ms = muniDe(E, p).slice(0, 5).map(m => `<div class="it" data-msel="muni:${m.id}" style="cursor:pointer">${C.Escudos ? C.Escudos.mini(m.id, 14) : ''}<span>${esc(m.nombre)}</span><span style="margin-left:auto">${chipP(E, m.alcalde)}</span></div>`).join('');
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${esc(d[0])}</h3><span class="etq oro">${d[2]} diputado${d[2] === 1 ? '' : 's'}</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px"><a href="#" data-msel="ccaa:${c}">${bn(c)}${esc(CORTO[c])}</a> · ${U.n(d[3])} mil hab.${C.Sede ? ' · implantación de tu partido ' + Math.round(C.Sede.asegurar(E).impl[p] || 0) + ' %' : ''}</div>
        ${tabla ? `<div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Partido</th><th class="num">Voto</th><th class="num">Esc.</th></tr></thead><tbody>${tabla}</tbody></table></div>` : ''}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="prov:${p}">🔍 Acercar</button><button class="btn chico" data-msel="ccaa:${c}">↰ ${esc(CORTO[c])}</button></div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}
        ${ms ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Grandes ciudades</h3></div><div class="lista" style="font-size:12.5px">${ms}</div></div>` : ''}`;
    },

    muni(E, id, capa) {
      const m = E.esp.muni.m[id]; if (!m) return Panel.nacion(E, capa);
      const alc = E.politicos[m.pm], acc = accionesDe(E, 'muni', id), esAlc = m.pm === 'J', coal = (m.coal || []).filter(k => k !== m.alcalde);
      const cm = C.CampMun && C.CampMun.activa && C.CampMun.activa(E) ? C.CampMun.asegurar(E) : null, pyr = cm && C.CampMun.proyectar ? C.CampMun.proyectar(E, id, 0) : null;
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${C.Escudos ? C.Escudos.svg(id, { h: 30 }) : ''} ${esc(m.nombre)}</h3><span class="etq oro">${U.n(m.pob)} mil hab.</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px"><a href="#" data-msel="ccaa:${m.ccaa}">${bn(m.ccaa)}${esc(CORTO[m.ccaa])}</a> · ${esc(D().provincias[m.prov][0])} · ${m.n} concejales</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px;margin-bottom:8px">Alcaldía ${chipP(E, m.alcalde)}${coal.length ? ' <span class="tenue">con</span> ' + coal.map(k => chipP(E, k)).join(' ') : ''} · ${esc(alc ? alc.n : '—')}${esAlc ? ' <span class="etq oro">Tú</span>' : ''}</div>
        <div class="mapa-kpis">${kpi('Aprobación', val(m.aprob, 58, 40))}${kpi('Deuda', Math.round(m.deuda) + ' %')}${pyr ? kpi('Tus concejales previstos', pyr.mias + '/' + pyr.n) : ''}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="muni:${id}">🔍 Acercar</button>${E.jugador.muni === id ? '<button class="btn chico" data-ir="ayuntamiento">🏘 Mi ayuntamiento</button>' : ''}</div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}
        ${obrasCiudad(E, id)}`;
    }
  };
  const semanas = (E, t) => Math.max(0, Math.round(t - E.fecha.t));
  const panelHtml = (E, st) => {
    const s = st.sel, capa = st.capa;
    if (st.obra && st.obra.tipo && C.Obras) return panelConstructor(E, st);
    if (!s) return capa === 'obras' && C.Obras ? panelObras(E, st) : Panel.nacion(E, capa);
    if (s.t === 'ccaa') return Panel.ccaa(E, s.id, capa); if (s.t === 'prov') return Panel.prov(E, s.id, capa); if (s.t === 'obra' && C.Obras) return panelObra(E, s.id);
    return Panel.muni(E, s.id, capa);
  };

  /* Todas las comunidades, provincias y ciudades se pueden seleccionar; la caja de encuadre se calcula a partir de la geometría. */
  const cajaDe = (E, s) => { const Mp = C.Mapa; if (!s) return null; if (s.t === 'ccaa') return Mp.bbCcaa(s.id); if (s.t === 'prov') return Mp.bbProv(s.id);
    if (s.t === 'obra') { const w = E.esp.obras && E.esp.obras.lista.find(x => x.id === s.id), ci = Mp.geo().ciu; if (!w || !ci[w.a]) return null; const A = ci[w.a], B = w.b && ci[w.b] ? ci[w.b] : A, r = w.b ? 80 : 190; return [Math.min(A[0], B[0]) - r, Math.min(A[1], B[1]) - r, Math.max(A[0], B[0]) + r, Math.max(A[1], B[1]) + r]; }
    const m = E.esp.muni.m[s.id], c = Mp.geo().ciu[s.id]; if (!m || !c) return null; const r = 190; return [c[0] - r, c[1] - r, c[0] + r, c[1] + r]; };
  const provDeSel = (E, s) => !s ? null : s.t === 'prov' ? s.id : s.t === 'muni' && E.esp.muni.m[s.id] ? E.esp.muni.m[s.id].prov : null;
  const ccaaDeSel = (E, s) => !s ? null : s.t === 'ccaa' ? s.id : s.t === 'prov' ? ccaaDe(s.id) : s.t === 'muni' && E.esp.muni.m[s.id] ? E.esp.muni.m[s.id].ccaa : null;

  /* Al inaugurarse una obra tuya (la ordenaste o la pediste), aviso en pantalla. */
  C.Bus.on('obra:inaugurada', ev => { try { if ((ev.quien === 'jug' || ev.quien === 'pedida') && UI.toast && ev.texto) UI.toast('🎀 ' + esc(ev.texto), 'bien'); } catch (e) { /* el aviso es opcional */ } });

  const Pa = C.Pantallas.mapa = {
    CORTO,
    /* HTML del mapa interactivo. o: { compacto (más bajo), suave (dentro de una página que se desplaza), cab (cabecera con enlace al mapa completo), capa + id (capa con la que se abre al entrar desde esa pantalla) } */
    html(E, o = {}) {
      const st = estado(E); if (o.capa && st.origen !== o.id && C.Mapa.CAPAS.some(c => c.id === o.capa)) { st.capa = o.capa; st.sel = null; st.camC = null; st.inicialC = true; } st.origen = o.id || null; if (!st.capa || !C.Mapa.CAPAS.some(c => c.id === st.capa)) st.capa = capaPorDefecto(E);
      const L = C.Mapa.capa(st.capa), grupos = C.Mapa.grupos();
      const tabs = grupos.map(g => `<button data-mgrupo="${esc(g.n)}" class="${g.n === L.g ? 'activo' : ''}">${esc(g.n)}</button>`).join('');
      const chips = grupos.map(g => g.capas.map(c => `<button data-mcapa="${c.id}" data-g="${esc(g.n)}" class="${c.id === st.capa ? 'activo' : ''}"${g.n === L.g ? '' : ' hidden'}>${esc(c.n)}</button>`).join('')).join('');
      return `<div class="mapa-w${o.compacto ? ' compacto' : ''}${o.suave ? ' suave' : ''}${st.obra && st.obra.tipo && C.Obras ? ' construyendo' : ''}" id="mapa-w">${o.cab ? `<div class="t-cab"><h3>🗺 Mapa de España</h3><button class="btn chico fant" data-ir="mapa">Abrir el mapa →</button></div>` : ''}<select class="mapa-sel" id="mapa-capa" aria-label="Capa del mapa">${grupos.map(g => `<optgroup label="${esc(g.n)}">${g.capas.map(c => `<option value="${c.id}"${c.id === st.capa ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</optgroup>`).join('')}</select><div class="mapa-barra"><div class="mapa-tabs" role="group" aria-label="Familias de capas">${tabs}</div><div class="mapa-chips" role="group" aria-label="Capas">${chips}</div></div><div class="mapa-desc" id="mapa-desc"><b>${esc(L.n)}</b> · ${esc(L.d)}</div>
        <div class="mapa-cuerpo"><div class="mapa-lienzo" id="mapa-lienzo">${C.Mapa.svg(E, st.capa, { interactivo: true, region: ccaaDeSel(E, st.sel), etq: 'no' })}
          <div class="mapa-zoom"><button data-mzoom="in" aria-label="Acercar">+</button><button data-mzoom="out" aria-label="Alejar">−</button><button data-mzoom="todo" aria-label="Ver toda España" title="Ver toda España">⌂</button><button data-mzoom="yo" aria-label="Mi territorio" title="Mi territorio">📍</button>${C.Obras ? '<button data-mobras aria-label="Mostrar las obras en el mapa" title="Mostrar las obras en el mapa" class="m-btn-obras">🛣</button>' : ''}</div>
          <div class="mapa-resumen" id="mapa-resumen"></div><div class="mapa-obrabar" id="mapa-obrabar"></div>
          <div class="mapa-leyenda" id="mapa-leyenda">${C.Mapa.leyenda(E, st.capa)}</div>${o.suave ? '<div class="mapa-pista" id="mapa-pista">Ctrl + rueda para acercar</div>' : ''}</div>
          <aside class="mapa-panel" id="mapa-panel">${panelHtml(E, st)}</aside></div></div>`;
    },

    /* Cablea el mapa: cámara, selección, capas, panel y capas dinámicas (etiquetas, ciudades, marcas). */
    enlazar(el, E, o = {}) {
      const w = UI.$('#mapa-w', el), svg = UI.$('svg.mapa-es', w), lienzo = UI.$('#mapa-lienzo', w), panel = UI.$('#mapa-panel', w), st = estado(E), M = C.Mapa.geo();
      if (!w || !svg) return null;
      let cam = null, pendiente = false;
      /* El panel se redibuja al seleccionar: sus filas pulsables también se alcanzan con el teclado. */
      const obraNombre = id => { const w = E.esp.obras && E.esp.obras.lista.find(x => x.id === id); return w ? C.Obras.titulo(E, w) : ''; };
      const nombreSel = s_ => !s_ ? '' : s_.t === 'ccaa' ? CORTO[s_.id] : s_.t === 'prov' ? D().provincias[s_.id][0] : s_.t === 'obra' ? obraNombre(s_.id) : (E.esp.muni.m[s_.id] || {}).nombre || '';
      const ponerPanel = () => { const rs = UI.$('#mapa-resumen', w); rs.classList.toggle('ver', !!st.sel); rs.innerHTML = st.sel ? `<b>${esc(nombreSel(st.sel))}</b><button class="btn chico" data-mver>Ver ficha ↓</button>` : ''; panel.innerHTML = panelHtml(E, st); UI.$$('[data-msel]', panel).forEach(x => { if (!/^(A|BUTTON)$/.test(x.tagName)) { x.setAttribute('tabindex', '0'); x.setAttribute('role', 'button'); } }); sincObra(); };
      w.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-msel][role="button"],[data-mobra-sel]')) { e.preventDefault(); e.target.click(); } });
      const ciudades = Object.values(E.esp.muni.m).sort((a, b) => b.pob - a.pob);

      /* ── Obras: constructor sobre el mapa (tipo → origen → destino → previsión), superposición de la red y marcas ── */
      const ciudadDeProv = p => { const m = muniDe(E, p).find(x => M.ciu[x.id]); return m ? m.id : null; };
      let memoEv = { k: '', v: null };
      const ttCiudad = (tit, filas) => `<div class="tt-t">${esc(tit)}</div>` + filas.map(([k, v]) => `<div class="tt-f"><span>${k}</span><b>${v}</b></div>`).join('');
      /* Qué ciudades se pueden elegir ahora (y el aviso de cada una): se recalcula sólo si cambia el constructor. */
      const evalObra = () => {
        const ob = st.obra, Obs = C.Obras, T = Obs.TIPOS[ob.tipo], k = [ob.tipo, ob.a, ob.b, E.fecha.t, Obs.asegurar(E).ver].join('|');
        if (memoEv.k === k) return memoEv.v;
        const v = {};
        for (const m of ciudades) {
          if (!M.ciu[m.id]) continue; const x = v[m.id] = { a: m.id === ob.a, b: m.id === ob.b, ok: true, tt: '' };
          if (T.ab) {
            if (!ob.a) x.tt = ttCiudad(m.nombre, [['Origen', 'Pulsa para empezar aquí']]);
            else if (m.id === ob.a) x.tt = ttCiudad(m.nombre, [['Origen', 'Pulsa otra vez para cambiarlo']]);
            else { const r = Obs.chequear(E, ob.tipo, ob.a, m.id); x.ok = r.ok; x.tt = r.ok ? ttCiudad(`${cn(E, ob.a)} → ${m.nombre}`, [['Distancia', r.info.km + ' km'], ['Coste', esc(Obs.eur(r.info.coste))], ['Plazo', esc(Obs.plazo(r.info.sem))]]) : ttCiudad(m.nombre, [['No se puede', esc(r.motivo)]]); }
          } else { const r = Obs.chequear(E, ob.tipo, m.id, null); x.ok = r.ok; x.tt = r.ok ? ttCiudad(m.nombre, [[esc(T.n), 'nivel ' + Obs.nivel(E, m.id, ob.tipo) + ' → ' + (Obs.nivel(E, m.id, ob.tipo) + 1)], ['Coste', esc(Obs.eur(r.info.coste))], ['Plazo', esc(Obs.plazo(r.info.sem))]]) : ttCiudad(m.nombre, [['No se puede', esc(r.motivo)]]); }
        }
        memoEv = { k, v }; return v;
      };
      /* Barra sobre el mapa con el paso actual del constructor. */
      const sincObra = () => {
        const ob = st.obra && st.obra.tipo && C.Obras ? st.obra : null; svg.classList.toggle('construyendo', !!ob); w.classList.toggle('construyendo', !!ob);
        const bar = UI.$('#mapa-obrabar', w); if (!bar) return; bar.classList.toggle('ver', !!ob);
        if (!ob) { bar.innerHTML = ''; return; }
        const T = C.Obras.TIPOS[ob.tipo], paso = pasoObra(ob);
        const txt = paso === 'a' ? (T.ab ? 'Pulsa la ciudad de origen' : 'Pulsa la ciudad') : paso === 'b' ? `${esc(cn(E, ob.a))} → pulsa el destino` : T.ab ? `${esc(cn(E, ob.a))} → ${esc(cn(E, ob.b))}` : esc(cn(E, ob.a));
        bar.innerHTML = `<b>${T.ic}<em class="nom"> ${esc(T.n)}</em></b><span>${txt}</span>${paso === 'listo' ? '<button class="btn chico" data-mver>Resumen ↓</button>' : ''}<button class="btn chico fant" data-mobra-x aria-label="Cancelar la obra">✕</button>`;
      };
      const sincBotonObras = () => { const b = UI.$('[data-mobras]', w); if (!b) return; const on = !!(C.Mapa.capa(st.capa).obras || st.verObras); b.classList.toggle('activo', on); b.setAttribute('aria-pressed', String(on)); };
      /* La red de obras: trazos (hechas, en curso y vista previa). No depende del zoom, así que sólo se redibuja al cambiar algo. */
      const pintarObras = () => {
        const g = UI.$('.m-obras', svg); if (!g) return; const Obs = C.Obras;
        const ob = st.obra && st.obra.tipo && Obs ? st.obra : null;
        if (!Obs || !(C.Mapa.capa(st.capa).obras || st.verObras || ob)) { g.innerHTML = ''; return; }
        const vis = st.vis || {}, sel = st.sel && st.sel.t === 'obra' ? st.sel.id : null, d = t => `M${f1(t.ax)} ${f1(t.ay)}Q${f1(t.cx)} ${f1(t.cy)} ${f1(t.bx)} ${f1(t.by)}`;
        let hechas = '', curso = '', hits = '', prev = '';
        for (const wk of Obs.visibles(E)) {
          const T = Obs.TIPOS[wk.tipo]; if (!T.ab || vis[wk.tipo] === false) continue;
          const t = Obs.trazo(wk.tipo, wk.a, wk.b), cl = wk.id === sel ? ' sel' : '';
          if (wk.estado === 'hecha') hechas += `<path class="o-h${wk.quien === 'red' ? ' o-red' : ''}${cl}" d="${d(t)}" stroke="${T.col}" style="stroke-width:${T.ancho}px"/>`;
          else {
            const u = Math.max(0, Math.min(1, wk.prog)), pu = Obs.punto(t, u);
            curso += `<path class="o-c${cl}" d="${d(t)}" stroke="${T.col}" style="stroke-width:${T.ancho}px"/>` + (u > 0.005 ? `<path class="o-p" d="M${f1(t.ax)} ${f1(t.ay)}Q${f1(t.ax + (t.cx - t.ax) * u)} ${f1(t.ay + (t.cy - t.ay) * u)} ${f1(pu[0])} ${f1(pu[1])}" stroke="${T.col}" style="stroke-width:${T.ancho + 1.4}px"/>` : '');
          }
          hits += `<path class="o-hit" data-obra="${wk.id}" d="${d(t)}" data-tt="${esc(ttObra(E, wk))}"/>`;
        }
        if (ob) { const T = Obs.TIPOS[ob.tipo]; if (T.ab && ob.a && ob.b && Obs.chequear(E, ob.tipo, ob.a, ob.b).ok) prev = `<path class="o-prev" d="${d(Obs.trazo(ob.tipo, ob.a, ob.b))}"/>`; }
        g.innerHTML = hechas + curso + prev + hits;
      };
      /* Marcas que dependen del zoom: la cabeza de cada obra en marcha y las obras puntuales. */
      const marcasObras = px => {
        const Obs = C.Obras; if (!Obs || !(C.Mapa.capa(st.capa).obras || st.verObras)) return '';
        const vis = st.vis || {}; let ms = '';
        for (const wk of Obs.visibles(E)) {
          if (wk.estado !== 'curso') continue; const T = Obs.TIPOS[wk.tipo]; let q, r, col;
          if (T.ab) { if (vis[wk.tipo] === false) continue; q = Obs.punto(Obs.trazo(wk.tipo, wk.a, wk.b), Math.max(0, Math.min(1, wk.prog))); r = px(5.5); col = T.col; } else { q = M.ciu[wk.a]; r = px(10); col = '#e07a2f'; }
          if (!q) continue;
          ms += `<g class="marca obra-m" data-obra="${wk.id}" data-tt="${esc(ttObra(E, wk))}"><circle class="pulso" cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(r)}" fill="${col}"/>${T.ab ? '' : `<text x="${f1(q[0])}" y="${f1(q[1] + px(4.5))}" style="font-size:${px(13)}px" text-anchor="middle">${T.ic}</text>`}</g>`;
        }
        return ms;
      };
      const refrescarObra = () => { ponerPanel(); pintarObras(); pedir(); };
      const frameObra = () => { const ob = st.obra; if (!ob || !ob.a || !cam) return; const A = M.ciu[ob.a], B = ob.b && M.ciu[ob.b] ? M.ciu[ob.b] : A, r = ob.b ? 120 : 260; if (A) cam.ajustarA([Math.min(A[0], B[0]) - r, Math.min(A[1], B[1]) - r, Math.max(A[0], B[0]) + r, Math.max(A[1], B[1]) + r], 1.25, 460, 7); };
      const iniciarObra = (tipo, a, b) => {
        const Obs = C.Obras; if (!Obs || !Obs.TIPOS[tipo]) return; const T = Obs.TIPOS[tipo];
        st.obra = { tipo, a: a && M.ciu[a] ? a : null, b: T.ab && b && M.ciu[b] ? b : null }; st.sel = null; if (st.capa !== 'obras') pintarCapa('obras'); resalta(); refrescarObra();
        if (pasoObra(st.obra) === 'listo') frameObra(); panel.scrollTop = 0;
      };
      /* Una ciudad pulsada en el mapa (o la principal de la provincia pulsada) según el paso del constructor. */
      const elegirCiudad = id => {
        const ob = st.obra, T = C.Obras.TIPOS[ob.tipo];
        if (!T.ab) { ob.a = id; ob.b = null; }
        else if (!ob.a) ob.a = id;
        else if (ob.a === id) { ob.a = null; ob.b = null; }
        else ob.b = id;
        refrescarObra(); if (pasoObra(ob) === 'listo') frameObra();
      };
      const obrasClic = e => {
        const t = e.target;
        const bt = t.closest('[data-mobra-tipo]'); if (bt) { iniciarObra(bt.dataset.mobraTipo); return true; }
        if (t.closest('[data-mobra-x]')) { st.obra = null; refrescarObra(); return true; }
        const pp = t.closest('[data-mobra-prep]'); if (pp) { const [tipo, a, b] = pp.dataset.mobraPrep.split('|'); iniciarObra(tipo, a || null, b || null); return true; }
        const dd = t.closest('[data-mobra-desde]'); if (dd) { const [tipo, a] = dd.dataset.mobraDesde.split('|'); iniciarObra(tipo, a); return true; }
        const vv = t.closest('[data-mvis]'); if (vv) { st.vis = st.vis || {}; st.vis[vv.dataset.mvis] = st.vis[vv.dataset.mvis] === false; ponerPanel(); pintarObras(); pedir(); return true; }
        const os = t.closest('[data-mobra-sel]'); if (os) { seleccionar({ t: 'obra', id: os.dataset.mobraSel }, true); return true; }
        if (t.closest('[data-mobra-todas]')) { seleccionar(null); return true; }
        const oz = t.closest('[data-mzobra]'); if (oz) { const bb = cajaDe(E, { t: 'obra', id: oz.dataset.mzobra }); if (bb) cam.ajustarA(bb, 1.3, 460, 8); return true; }
        if (t.closest('[data-mobras]')) { st.verObras = !st.verObras; sincBotonObras(); pintarObras(); pedir(); return true; }
        return false;
      };
      w.addEventListener('change', e => {
        const t = e.target, ob = st.obra; if (!ob || !ob.tipo || !C.Obras) return;
        if (t.id === 'ob-a') { ob.a = t.value || null; if (!C.Obras.TIPOS[ob.tipo].ab || ob.b === ob.a) ob.b = null; }
        else if (t.id === 'ob-b') ob.b = t.value || null; else return;
        refrescarObra(); if (pasoObra(ob) === 'listo') frameObra();
      });

      /* Capas dinámicas: dependen del zoom, así que se redibujan cuando la cámara se mueve. */
      const dinamico = () => {
        pendiente = false; if (!cam || !svg.isConnected) return; const z = cam.z(), v = cam.vista(), r = svg.getBoundingClientRect(), upp = v.w / Math.max(1, r.width), L = C.Mapa.capa(st.capa), propio = C.Mapa.propio(E);
        const px = n => f1(n * upp), fs = n => px(n);
        // Etiquetas (las grandes primero; las que chocan con otra ya colocada se omiten)
        let t = ''; const puestas = [], cajas = [];
        const txt = (x, y, s, tam, cl) => `<text class="${cl}" x="${f1(x)}" y="${f1(y)}" style="font-size:${fs(tam)}px;stroke-width:${px(tam * 0.34)}px">${esc(s)}</text>`;
        const libre = (x, y, s, tam) => { const w = s.length * tam * 0.62 * upp, h = tam * 1.15 * upp, r = [x - w / 2, y - h * 0.8, x + w / 2, y + h * 0.2]; if (puestas.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return false; puestas.push(r); return true; };
        const libreIzq = (x, y, s, tam) => { const w = s.length * tam * 0.58 * upp, h = tam * 1.15 * upp, r = [x, y - h * 0.8, x + w, y + h * 0.2]; if (puestas.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return false; puestas.push(r); return true; };
        const area = bb => (bb[2] - bb[0]) * (bb[3] - bb[1]);
        if (z < 2.6) { for (const c of Object.keys(M.ccCen).filter(c => c !== 'CEU' && c !== 'MEL').sort((a, b) => area(M.ccBb[b]) - area(M.ccBb[a]))) { if (libre(M.ccCen[c][0], M.ccCen[c][1], CORTO[c], 11)) t += txt(M.ccCen[c][0], M.ccCen[c][1], CORTO[c], 11, 'et-c'); } }
        else { for (const p of Object.keys(M.cen).filter(p => p !== 'CEU' && p !== 'MEL').sort((a, b) => area(M.bb[b]) - area(M.bb[a]))) { const bb = M.bb[p]; if ((bb[2] - bb[0]) / upp < 40) continue; const nom = D().provincias[p][0], rot = (bb[2] - bb[0]) / upp > nom.length * 7.4 ? nom : p; if (!libre(M.cen[p][0], M.cen[p][1] - px(3), rot, 10.5)) continue; t += txt(M.cen[p][0], M.cen[p][1] - px(3), rot, 10.5, 'et-p'); if (L.etq) { const e = L.etq(E, p); if (e != null) t += txt(M.cen[p][0], M.cen[p][1] + px(10), String(e), 10, 'et-v'); } } }
        if (z >= 1.5) for (const p of ['CEU', 'MEL']) t += txt(M.cen[p][0] + px(18), M.cen[p][1] + px(4), p, 10, 'et-p et-izq');
        // Ciudades (sus nombres van con el resto de etiquetas, por encima de los puntos)
        const cc = ccaaDeSel(E, st.sel), todas = L.ciudades === 'todas', n = z < 1.5 ? 10 : z < 2.5 ? 22 : z < 4 ? 40 : 99; const cs = []; let lc = '';
        const ob = st.obra && st.obra.tipo && C.Obras ? st.obra : null, ev = ob ? evalObra() : null;
        ciudades.forEach((m, i) => {
          const sel = st.sel && st.sel.t === 'muni' && st.sel.id === m.id, mia = propio.muni === m.id;
          if (!(i < n || todas || ob || sel || mia || (cc && m.ccaa === cc && z >= 1.8))) return;
          const p = M.ciu[m.id]; if (!p) return; const rp = 3.4 + Math.sqrt(m.pob) / 15, col = todas && !L.ciuNeutra ? ((E.partidos[m.alcalde] || {}).color || '#ccc') : '#f2eee0';
          let tip = C.Mapa.avisoCiudad(E, m), cl = ''; if (ev && ev[m.id]) { const x = ev[m.id]; tip = x.tt; cl = x.a ? ' ob-a' : x.b ? ' ob-b' : x.ok ? ' ob-ok' : ' ob-no'; }
          cs.push(`<circle class="ciu${sel ? ' sel' : ''}${mia ? ' mia' : ''}${cl}" data-muni="${m.id}" data-tt="${esc(tip)}" cx="${p[0]}" cy="${p[1]}" r="${px((sel ? rp + 2 : rp) + (ob ? 1.2 : 0))}" fill="${col}" vector-effect="non-scaling-stroke"/>`);
          if ((z >= 3 || sel || (cc && m.ccaa === cc && z >= 2.2)) && (sel || mia ? (libreIzq(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5) || true) : libreIzq(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5))) lc += txt(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5, 'et-m');
        });
        UI.$('.m-ciu', svg).innerHTML = (ob ? cs.reverse() : cs).join(''); UI.$('.m-etq', svg).innerHTML = t + lc;   // al construir, las ciudades grandes quedan encima (las del área metropolitana se alcanzan acercando)
        // Marcas (emergencias, 155)
        const marcas = C.Mapa.marcas(E, st.capa), usados = {}; let ms = '';
        for (const m of marcas) { const q = M.ccCen[m.c]; if (!q) continue; const k = usados[m.c] = (usados[m.c] || 0) + 1, x = q[0] + (k - 1) * px(26), y = q[1] - px(14), col = m.nivel >= 3 ? '#cf3c3a' : m.nivel === 2 ? '#e07a2f' : m.nivel === 1 ? '#d8b13f' : '#cf3c3a';
          ms += `<g class="marca" data-ccaa="${m.c}" data-tt="${esc(`<div class="tt-t">${esc(m.t)}</div>`)}"><circle class="pulso" cx="${f1(x)}" cy="${f1(y)}" r="${px(11)}" fill="${col}"/><text x="${f1(x)}" y="${f1(y + px(4.5))}" style="font-size:${px(13)}px" text-anchor="middle">${m.ic}</text></g>`; }
        UI.$('.m-marc', svg).innerHTML = ms + marcasObras(px);
        st[claveCam(o)] = { c: cam.centro(), z };
      };
      const pedir = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(dinamico); };

      /* Selección */
      const resalta = () => {
        const cc = ccaaDeSel(E, st.sel), g = UI.$('.m-res', svg), ps = cc && M.ccaa[cc] ? (st.sel.t === 'prov' ? [st.sel.id] : st.sel.t === 'ccaa' ? M.ccaa[cc] : []) : [];
        const base = ps.map(p => `<path class="m-sel" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join(''), pr = C.Mapa.propio(E);
        const propios = (pr.ccaa && M.ccaa[pr.ccaa] ? M.ccaa[pr.ccaa] : pr.prov ? [pr.prov] : []).map(p => `<path class="m-propio" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('');
        const cx = st.sel && st.sel.t === 'ccaa' ? M.ccaa[cc].map(p => `<path class="m-sel-c" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('') : '';
        g.innerHTML = propios + cx + base;
      };
      const seleccionar = (s, ir) => {
        st.sel = s; resalta(); ponerPanel(); pintarObras(); pedir(); panel.scrollTop = 0;
        const bb = ir && s ? cajaDe(E, s) : null; if (bb) cam.ajustarA(bb, s.t === 'muni' ? 1 : s.t === 'obra' ? 1.3 : 1.5, 460, s.t === 'muni' ? 9 : 8);
      };
      const clickEn = (e, el_) => {
        const cl = el_ && el_.closest ? el_.closest.bind(el_) : null;
        if (st.obra && st.obra.tipo && C.Obras) { const c = cl && cl('[data-muni],[data-prov]'); if (c && svg.contains(c)) { const id = c.dataset.muni || ciudadDeProv(c.dataset.prov); if (id) elegirCiudad(id); } return; }
        const ow = cl && cl('[data-obra]'); if (ow && svg.contains(ow)) return seleccionar({ t: 'obra', id: ow.dataset.obra });
        const t = el_ && el_.closest ? el_.closest('[data-muni],[data-prov],[data-ccaa]') : null; if (!t || !svg.contains(t)) { if (!(el_ && el_.closest && el_.closest('.mapa-zoom'))) seleccionar(null); return; }
        if (t.dataset.muni) return seleccionar({ t: 'muni', id: t.dataset.muni });
        const L = C.Mapa.capa(st.capa), p = t.dataset.prov, c = t.dataset.ccaa, actual = ccaaDeSel(E, st.sel);
        if (p && (L.nivel === 'prov' || actual === c)) return seleccionar({ t: 'prov', id: p });
        seleccionar({ t: 'ccaa', id: c });
      };

      /* Capas de datos */
      const pintarCapa = capa => {
        st.capa = capa; const L = C.Mapa.capa(capa); let haches = '', puntos = '';
        UI.$$('.ficha[data-prov]', svg).forEach(f => { const p = f.dataset.prov, s = L.color(E, p); f.setAttribute('fill', s.f); if (s.o != null) f.setAttribute('fill-opacity', String(Math.round(s.o * 10) / 10)); else f.removeAttribute('fill-opacity'); f.setAttribute('data-tt', L.tt(E, p)); });
        for (const p in M.prov) { const s = L.color(E, p); if (s.h) haches += `<path d="${M.prov[p]}" fill="url(#m-rayas)" pointer-events="none"/>`; if (s.p) puntos += `<path d="${M.prov[p]}" fill="url(#m-puntos)" pointer-events="none"/>`; }
        UI.$('.m-trama', svg).innerHTML = haches + puntos;
        UI.$('#mapa-leyenda', w).innerHTML = C.Mapa.leyenda(E, capa); UI.$('#mapa-desc', w).innerHTML = '<b>' + esc(L.n) + '</b> · ' + esc(L.d);
        (st.ultima = st.ultima || {})[L.g] = capa;
        UI.$$('[data-mgrupo]', w).forEach(b => b.classList.toggle('activo', b.dataset.mgrupo === L.g));
        UI.$$('[data-mcapa]', w).forEach(b => { b.hidden = b.dataset.g !== L.g; b.classList.toggle('activo', b.dataset.mcapa === capa); }); UI.$('#mapa-capa', w).value = capa;
        if (!st.sel) ponerPanel(); pintarObras(); sincBotonObras(); pedir();
      };
      UI.$$('[data-mcapa]', w).forEach(b => b.onclick = () => pintarCapa(b.dataset.mcapa));
      UI.$$('[data-mgrupo]', w).forEach(b => b.onclick = () => { const g = C.Mapa.grupos().find(x => x.n === b.dataset.mgrupo); if (g) pintarCapa((st.ultima && g.capas.some(c => c.id === st.ultima[g.n]) ? st.ultima[g.n] : g.capas[0].id)); });
      UI.$('#mapa-capa', w).onchange = e => pintarCapa(e.target.value);

      /* Cámara */
      const pistaEl = UI.$('#mapa-pista', w); let tPista = 0;
      const pista = pistaEl ? () => { pistaEl.classList.add('ver'); clearTimeout(tPista); tPista = setTimeout(() => pistaEl.classList.remove('ver'), 1500); } : null;
      cam = C.Mapa.camara(svg, lienzo, { click: clickEn, cambio: pedir, gestos: !(E.ui && E.ui.mapaSinGestos), suave: !!o.suave, pista });
      const aMiTerritorio = (ms, forzar) => {
        const pr = C.Mapa.propio(E), J = E.jugador, enc = (s, pad, zmax) => { cam.ajustarA(cajaDe(E, s), pad, ms, zmax); return s; };
        if (pr.muni && E.esp.muni.m[pr.muni]) return enc({ t: 'muni', id: pr.muni }, 1, 9);
        if (pr.ccaa && M.ccaa[pr.ccaa]) return enc({ t: 'ccaa', id: pr.ccaa }, 1.5, 8);
        if (forzar && pr.prov && M.prov[pr.prov]) return enc({ t: 'prov', id: pr.prov }, 1.5, 8);
        if (forzar && J.region && J.region !== 'ES' && M.ccaa[J.region]) return enc({ t: 'ccaa', id: J.region }, 1.5, 8);
        cam.reset(ms); return null;
      };
      w.addEventListener('click', e => {
        if (C.Obras && obrasClic(e)) return;
        const z = e.target.closest('[data-mzoom]'); if (z) { const k = z.dataset.mzoom; if (k === 'in') cam.zoom(1.6); else if (k === 'out') cam.zoom(1 / 1.6); else if (k === 'todo') { cam.reset(420); seleccionar(null); } else { const s = aMiTerritorio(420, true); if (s) seleccionar(s); } return; }
        if (e.target.closest('[data-mver]')) { panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
        const s = e.target.closest('[data-msel]'); if (s) { e.preventDefault(); const [t, id] = s.dataset.msel.split(':'); seleccionar({ t, id }, true); return; }
        const q = e.target.closest('[data-mz]'); if (q) { const [t, id] = q.dataset.mz.split(':'); cam.ajustarA(cajaDe(E, { t, id }), t === 'muni' ? 1 : 1.5, 460, t === 'muni' ? 9 : 8); return; }
        const f = e.target.closest('[data-mficha]'); if (f) { C.Pantallas.territorio.verCcaa(f.dataset.mficha); return; }
        const ir = e.target.closest('[data-ir]'); if (ir) { e.preventDefault(); C.App.ir(ir.dataset.ir); }
      });
      svg.addEventListener('dblclick', e => { const t = e.target.closest('[data-prov],[data-ccaa]'); if (t && st.sel) cam.ajustarA(cajaDe(E, st.sel), 1.5, 460, 8); });

      // Estado inicial: cámara guardada o encuadre del cargo
      const kc = claveCam(o), ki = claveIni(o);
      if (st[kc] && st[kc].c) cam.fijar(st[kc].c[0], st[kc].c[1], st[kc].z);
      else if (!st[ki]) { st[ki] = true; const am = C.Foco ? C.Foco.ambito(E) : 'todo'; if (am === 'aut' || am === 'local') { const s = aMiTerritorio(0, false); if (s && !st.sel) { st.sel = s; ponerPanel(); } } }
      if (!(st[kc] && st[kc].c) && st.sel) { const bb = cajaDe(E, st.sel); if (bb) cam.ajustarA(bb, st.sel.t === 'muni' ? 1 : 1.5, 0, st.sel.t === 'muni' ? 9 : 8); }
      resalta(); pintarCapa(st.capa); ponerPanel(); dinamico();
      /* Al girar el móvil o cambiar el tamaño de la ventana, el encuadre se recalcula con el nuevo lienzo. */
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (svg.isConnected) cam.aplicar(); }) : null; if (ro) ro.observe(lienzo);
      return { cam, seleccionar, pintarCapa, destruir: () => { cam.destruir(); if (ro) ro.disconnect(); } };
    },

    /* Monta el mapa en el elemento y libera la cámara anterior. */
    montar(el, E, o) { if (activo) activo.destruir(); activo = Pa.enlazar(el, E, o); return activo; },

    /* Pantalla completa */
    render(el, params) {
      const E = C.E, st = estado(E), sel = params && params.sel; if (params && params.capa) st.capa = params.capa; if (sel) { st.sel = sel; st.cam = null; st.inicial = true; }
      if (params) { delete params.capa; delete params.sel; }   // se aplican una sola vez: si no, cada refresco de pantalla devolvería el mapa a la capa y al encuadre de entrada
      el.innerHTML = `<div class="cab"><div><h1>🗺 Mapa de España</h1><div class="sub">Tu mesa de mando: elige una capa, pulsa una comunidad, provincia o ciudad y actúa desde ahí. En la capa <b>Obras</b> trazas carreteras y trenes de una ciudad a otra</div></div></div>${Pa.html(E)}`;
      const m = Pa.montar(el, E); if (sel) m.seleccionar(sel, true);
    }
  };
})(window.ESP);

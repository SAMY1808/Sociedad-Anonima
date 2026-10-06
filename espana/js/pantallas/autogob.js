/* Autogobierno: seguimiento y presión sobre las competencias, y reforma del Estatuto por artículos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['comp', '🏛 Competencias'], ['reforma', '📖 Reforma del Estatuto'], ['vigente', '📜 Estatuto vigente']];
  const FASES = [['borrador', 'Borrador'], ['comision', 'Negociación'], ['cortes', 'Cortes'], ['referendum', 'Referéndum'], ['tc', 'Tribunal Constitucional']];
  const EST = { pedido: ['Pedido', ''], aceptado: ['Aceptado', 'verde'], recortado: ['Recortado', 'amar'], rechazado: ['Rechazado', 'rojo'], cedido: ['Cedido', ''] };
  const pct = x => Math.round(x * 100) + ' %';
  const barra = (v, col) => `<div class="barra-h" style="height:6px;width:70px;display:inline-block;vertical-align:middle"><i style="width:${Math.min(100, v * 100)}%;background:${col}"></i></div>`;

  const AG = C.Pantallas.autogob = {
    region(E) { const J = E.jugador, T = C.Territorio, r = E.ui.regAG || (J.region && E.esp.ccaa[J.region] ? J.region : T.ids()[0]); return E.esp.ccaa[r] ? r : T.ids()[0]; },
    render(el, params) {
      const E = C.E, T = C.Territorio, J = E.jugador; if (params && params.reg) E.ui.regAG = params.reg;
      const c = AG.region(E), rc = E.esp.ccaa[c], tab = (params && params.tab) || E.ui.tabAG || 'comp'; E.ui.tabAG = tab;
      const gestor = J.pais === 'ES' && J.region === c && ['presauto', 'consejero'].includes(J.cargo), presi = J.pais === 'ES' && J.region === c && J.cargo === 'presauto' && rc.gob && rc.gob.pres === 'J';
      let h = `<div class="cab"><div><h1>🏛 Autogobierno de ${esc(D().ccaa[c].nombre)}</h1><div class="sub">Autogobierno ${Math.round(rc.aut)} · relación con Moncloa ${Math.round(rc.relM)} · Estatuto de ${rc.estatuto.ano}</div></div>
        <select id="ag-reg" class="btn" style="max-width:190px">${T.ids().map(x => `<option value="${x}" ${x === c ? 'selected' : ''}>${esc(D().ccaa[x].nombre)}</option>`).join('')}</select></div>
        <div class="tabs" style="margin-bottom:12px">${TABS.map(([k, n]) => `<button data-tab-ag="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      h += tab === 'comp' ? AG.competencias(E, c, gestor) : tab === 'reforma' ? AG.reforma(E, c, presi) : AG.vigente(E, c);
      el.innerHTML = h;
      UI.$$('[data-tab-ag]', el).forEach(b => b.onclick = () => C.App.ir('autogob', { tab: b.dataset.tabAg }));
      const sel = UI.$('#ag-reg', el); if (sel) sel.onchange = () => { E.ui.regAG = sel.value; C.App.refrescar(); };
      UI.$$('[data-art]', el).forEach(b => b.onclick = () => { const r = T.marcarArticulo(E, c, b.dataset.art); if (!r.ok) UI.toast(esc(r.msg), 'mal'); C.App.refrescar(); });
      UI.$$('[data-ceder]', el).forEach(b => b.onclick = () => { const r = T.ceder(E, c, b.dataset.ceder); UI.toast(esc(r.msg), r.ok ? 'bien' : 'mal'); C.App.refrescar(); });
      const dd = UI.$('#ag-desc', el); if (dd) dd.onclick = () => { const r = T.descartarBorrador(E, c); UI.toast(esc(r.msg), 'bien'); C.App.refrescar(); };
    },

    competencias(E, c, gestor) {
      const T = C.Territorio, rc = E.esp.ccaa[c], cp = D().competencias, ks = Object.keys(cp).sort((a, b) => rc.comp[a] - rc.comp[b] || cp[a].dif - cp[b].dif);
      const nota = gestor ? '' : '<div class="nota" style="margin-bottom:10px">Observas el proceso. Sólo el presidente o los consejeros de la comunidad pueden presionar al Estado.</div>';
      return `${nota}<div class="tarjeta"><div class="t-cab"><h3>Competencias y seguimiento</h3></div><div class="lista">${ks.map(k => {
        const x = cp[k], e = T.estadoComp(E, c, k), p = rc.comp[k] < 2 ? T.probComp(E, c, k) : null, pres = rc.presion[k] || 0;
        const cls = e.f === 'hecho' ? 'verde' : ['consejo', 'comision', 'cortes', 'estatuto'].includes(e.f) ? 'oro' : '';
        const pie = gestor && rc.comp[k] < 2 ? `<div class="fila" style="gap:4px;flex-wrap:wrap;margin-top:6px">${e.f === 'libre' ? UI.botonAccion('reclamar_competencia', { comp: k }, '🏛 Reclamar', 'chico prim') : ''}${Object.keys(T.VIAS).map(v => UI.botonAccion('presionar_competencia', { comp: k, via: v }, T.VIAS[v].ic + ' ' + T.VIAS[v].n, 'chico')).join('')}</div>` : '';
        return `<div class="it" style="flex-direction:column;align-items:stretch"><div class="fila" style="gap:8px;flex-wrap:wrap"><span style="font-size:18px">${x.icono}</span><div class="cuerpo" style="flex:1;min-width:180px"><b>${esc(x.nombre)}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(e.txt)}</div></div>
          <span class="etq ${rc.comp[k] === 2 ? 'verde' : rc.comp[k] === 1 ? 'amar' : ''}">${T.NIV[rc.comp[k]]}</span>${p != null ? `<span class="tenue" style="font-size:11.5px">Acuerdo ${pct(p)}</span>${barra(pres / 0.3, 'var(--oro)')}<span class="tenue" style="font-size:11px">presión</span>` : ''}</div>${pie}</div>`; }).join('')}</div></div>
        ${gestor ? `<div class="tarjeta"><h3>Vías de presión</h3><div class="lista">${Object.keys(T.VIAS).map(v => `<div class="it"><span>${T.VIAS[v].ic}</span><div class="cuerpo" style="flex:1"><b>${T.VIAS[v].n}</b><div class="tenue" style="font-size:12px;white-space:normal">${esc(T.VIAS[v].d)}</div></div><span class="etq">◆ ${T.VIAS[v].costo}</span></div>`).join('')}</div></div>` : ''}`;
    },

    reforma(E, c, presi) {
      const T = C.Territorio, rc = E.esp.ccaa[c], r = T.reformaActiva(E, c) || rc.estatuto.reforma;
      const info = id => T.itemInfo(E, c, id) || { n: id, ic: '•', dif: 0.5, tc: 0.3 };
      let h = '';
      const timeline = r => { const idx = Math.max(0, FASES.findIndex(f => f[0] === r.fase)); return `<div class="tramite" style="margin:6px 0 14px">${FASES.map(([k, n], i) => `<div class="paso ${i < idx || r.fase === 'cerrada' ? 'hecha' : ''} ${i === idx && r.fase !== 'cerrada' ? 'actual' : ''}">${n}</div>`).join('')}</div>`; };
      if (!r) {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Sin reforma en marcha</h3></div><div class="tenue" style="font-size:13px;line-height:1.6">Una reforma estatutaria sigue cinco pasos: <b>borrador</b> con artículos concretos → <b>Parlamento autonómico</b> (tres quintos) → <b>negociación con el Estado</b> artículo por artículo → <b>Cortes</b> (ley orgánica) → <b>referéndum</b> y posible recurso ante el <b>Tribunal Constitucional</b>.</div>
          ${presi ? `<div style="margin-top:10px">${UI.botonAccion('abrir_reforma_estatuto', {}, '📖 Abrir un borrador', 'prim')}</div>` : '<div class="tenue" style="font-size:12px;margin-top:8px">Sólo el presidente autonómico puede abrir la reforma.</div>'}</div>`;
        return h;
      }
      h += timeline(r);
      if (r.fase === 'borrador') {
        const cat = T.catalogoReforma(E, c), sel = r.items.map(x => x.id), a = T.apoyoReforma(E, c, sel);
        const fila = x => { const on = sel.includes(x.id); return `<div class="it" style="flex-wrap:wrap;${on ? 'background:rgba(227,192,106,.08)' : ''}"><span style="font-size:18px">${x.ic}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(x.n)}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(x.d)}</div><div style="font-size:11px" class="tenue">Dificultad ${barra(x.dif, 'var(--no)')} · Riesgo TC ${barra(x.tc, 'var(--amar, #E0B54A)')}</div></div>${presi ? `<button class="btn chico ${on ? 'prim' : ''}" data-art="${x.id}">${on ? '✔ Incluido' : 'Incluir'}</button>` : ''}</div>`; };
        h += `<div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Artículos disponibles</h3><span class="etq">${sel.length}/8</span></div><div class="lista">${cat.filter(x => !x.comp).map(fila).join('')}</div><h3 style="margin-top:12px">Competencias</h3><div class="lista" style="max-height:340px;overflow:auto">${cat.filter(x => x.comp).map(fila).join('')}</div></div>
          <div class="col"><div class="tarjeta"><div class="t-cab"><h3>Apoyo en el Parlamento</h3><span class="etq ${a.ok ? 'verde' : 'rojo'}">${a.ok ? 'Tres quintos' : 'No llega'}</span></div>${G.apilada([{ etq: 'Previstos a favor', v: a.si, color: 'var(--si)' }, { etq: 'Resto', v: Math.max(0, a.tot - a.si), color: 'var(--no)' }], { total: a.tot, mayoria: a.req, alto: 18 })}<div class="tenue" style="font-size:12px;margin-top:6px">${a.si} de ${a.tot} escaños; hacen falta ${a.req} (3/5). Cuantos más artículos ambiciosos, más partidos se bajan.</div>
          <table class="tabla" style="margin-top:8px"><tbody>${Object.keys(a.por).sort((x, y) => rc.parl.escanos[y] - rc.parl.escanos[x]).map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${rc.parl.escanos[k]}</td><td><span class="etq ${a.por[k] > 0.6 ? 'verde' : a.por[k] > 0.35 ? 'amar' : 'rojo'}">${pct(a.por[k])}</span></td></tr>`).join('')}</tbody></table></div>
          ${presi ? `<div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('presentar_reforma_estatuto', {}, '🏛 Presentar al Parlamento', 'prim')}<button class="btn" id="ag-desc">🗑 Descartar</button></div>` : ''}</div></div>`;
      } else if (r.fase === 'comision') {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Negociación con el Estado</h3><span class="etq oro">Ronda ${Math.min(r.ronda, 3)} de 3</span></div><div class="tenue" style="font-size:12.5px;margin-bottom:8px">El Gobierno responde a cada artículo. Puedes <b>insistir</b> (cuesta relación), <b>ceder</b> (gesto de buena voluntad) o <b>cerrar el acuerdo</b>. Si se agota el plazo, se remite lo pactado.</div><div class="lista">${r.items.map(it => { const i = info(it.id), e = EST[it.estado] || EST.pedido; return `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${i.ic}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(i.n)}</b><div class="tenue" style="font-size:11px">Probabilidad de que el Estado acepte: ${pct(T.probArticulo(E, c, it, it.ins * 0.15))}${it.ins ? ' · insistencias ' + it.ins + '/2' : ''}</div></div><span class="etq ${e[1]}">${e[0]}</span>${presi && ['recortado', 'rechazado'].includes(it.estado) ? UI.botonAccion('insistir_articulo', { id: it.id }, '✊ Insistir', 'chico') : ''}${presi && it.estado !== 'cedido' ? `<button class="btn chico" data-ceder="${it.id}">Ceder</button>` : ''}</div>`; }).join('')}</div>
          ${presi ? `<div style="margin-top:10px">${UI.botonAccion('cerrar_acuerdo_estatuto', {}, '✅ Cerrar acuerdo y remitir a las Cortes', 'prim')}</div>` : ''}</div>`;
      } else {
        const p = r.propId && E.proyectos[r.propId];
        h += `<div class="tarjeta"><div class="t-cab"><h3>${r.fase === 'cortes' ? 'En las Cortes Generales' : r.fase === 'referendum' ? 'Pendiente de referéndum' : r.fase === 'tc' ? 'Pendiente del Tribunal Constitucional' : 'Proceso cerrado: ' + esc(r.res || '')}</h3>${p && r.fase === 'cortes' ? `<span class="etq oro">${Comp.etapa(p.etapa)}</span>` : ''}</div>
          <div class="lista">${r.items.filter(x => ['aceptado', 'recortado'].includes(x.estado)).map(it => { const i = info(it.id), an = (r.anulados || []).includes(it.id); return `<div class="it"><span style="font-size:18px">${i.ic}</span><div class="cuerpo" style="flex:1"><b style="white-space:normal">${esc(i.n)}</b></div><span class="etq ${an ? 'rojo' : it.estado === 'recortado' ? 'amar' : 'verde'}">${an ? 'Anulado por el TC' : it.estado === 'recortado' ? 'Recortado' : 'Aceptado'}</span></div>`; }).join('')}</div>
          ${r.fase === 'cortes' && p ? `<div style="margin-top:8px"><button class="btn chico" id="ag-ver">Ver en Cortes Generales</button></div>` : ''}</div>`;
        setTimeout(() => { const b = document.getElementById('ag-ver'); if (b) b.onclick = () => C.App.ir('cortes', { tab: 'votaciones' }); }, 0);
      }
      h += `<div class="tarjeta"><div class="t-cab"><h3>📓 Cuaderno del proceso</h3></div><div class="lista">${r.hist.slice(0, 10).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin anotaciones.</div>'}</div></div>`;
      return h;
    },

    vigente(E, c) {
      const T = C.Territorio, rc = E.esp.ccaa[c], its = rc.estatuto.items || [], cp = D().competencias, hechas = Object.keys(cp).filter(k => rc.comp[k] === 2), comp = Object.keys(cp).filter(k => rc.comp[k] === 1);
      return `<div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Estatuto de ${rc.estatuto.ano}</h3><span class="etq">Autogobierno ${Math.round(rc.aut)}</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:8px">Reformas fallidas: ${rc.estatuto.rechazos || 0}</div><h3>Artículos especiales vigentes</h3><div class="lista">${its.map(id => { const i = T.itemInfo(E, c, id) || ARTI(id); return `<div class="it"><span style="font-size:18px">${i.ic}</span><div class="cuerpo" style="flex:1"><b style="white-space:normal">${esc(i.n)}</b></div></div>`; }).join('') || '<div class="vacio" style="padding:10px">Ninguno: el estatuto no recoge cláusulas singulares.</div>'}</div></div>
        <div class="tarjeta"><h3>Competencias</h3><div class="chips">${hechas.map(k => `<span class="etq verde">${cp[k].icono} ${esc(cp[k].nombre)}</span>`).join('')}${comp.map(k => `<span class="etq amar">${cp[k].icono} ${esc(cp[k].nombre)} (compartida)</span>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:8px">${hechas.length} transferidas · ${comp.length} compartidas · ${Object.keys(cp).length - hechas.length - comp.length} del Estado</div></div></div>`;
      function ARTI(id) { const a = C.Territorio.ARTICULOS[id]; return a ? { n: a.n, ic: a.ic } : { n: id, ic: '•' }; }
    }
  };
})(window.ESP);

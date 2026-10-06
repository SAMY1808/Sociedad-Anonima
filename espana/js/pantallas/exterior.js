/* Mundo: exterior, Europa por dentro y elecciones en otros países. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['ext', '🌍 Exterior'], ['ue', '🇪🇺 Europa por dentro'], ['mundo', '🗳 Elecciones en el mundo']];
  const barra = (v, max) => `<div class="barra-h" style="height:8px;width:100px;display:inline-block;vertical-align:middle"><i style="width:${Math.min(100, v / max * 100)}%;background:${v > 60 ? 'var(--si)' : v > 40 ? 'var(--oro)' : 'var(--no)'}"></i></div>`;
  C.Pantallas.exterior = {
    render(el) {
      const E = C.E, Ex = C.Exterior, x = Ex.asegurar(E), tab = E.ui.tabExt || 'ext', J = E.jugador, pm = E.paises.ES.gob.pm === 'J';
      let h = `<div class="cab"><div><h1>🌍 Mundo</h1><div class="sub">Relaciones exteriores, Europa y el poder político fuera de España</div></div></div><div class="tabs" style="margin-bottom:12px">${TABS.map(([k, n]) => `<button data-tx="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      if (tab === 'ext') {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Relaciones bilaterales</h3>${pm ? UI.botonAccion('compromiso_otan', {}, '🛡️ Gasto en defensa', 'chico') : ''}</div><div class="lista">${Object.keys(Ex.PAISES).map(k => { const p = Ex.PAISES[k], v = Math.round(x.rel[k]); return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${p.ic}</span><div class="cuerpo" style="flex:1;min-width:170px"><b>${p.n}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(p.desc)}</div></div>${barra(v, 100)}<span class="tenue" style="font-size:11.5px;width:26px">${v}</span>${k !== 'otan' && pm ? UI.botonAccion('cumbre_bilateral', { pais: k }, '🤝 Cumbre', 'chico') : ''}</div>`; }).join('')}</div></div>`;
      } else if (tab === 'ue') {
        const ng = x.ng, f = Ex.familias(E), mi = E.partidos[J.partido].grupo, ue = E.paises.ES.ue;
        h += `<div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Fondos Next Generation</h3></div><div style="font-size:12.5px;margin:6px 0">Cobrado <b>${ng.cobrado}</b> de <b>${ng.total}</b> mil millones</div><div class="barra-h" style="height:8px"><i style="width:${ng.cobrado / ng.total * 100}%;background:var(--oro)"></i></div><div style="font-size:12.5px;margin:10px 0 6px">Ejecución de los proyectos <b>${Math.round(ng.ejec)} %</b></div><div class="barra-h" style="height:8px"><i style="width:${ng.ejec}%;background:var(--si)"></i></div><div style="margin-top:10px">${UI.botonAccion('gestionar_fondos', {}, '💶 Acelerar ejecución', 'chico prim')}</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>Tu postura en Bruselas</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Relación de España con la UE: <b>${Math.round(ue.rel)}</b>${E.ue.eurobonos ? ' · eurobonos aprobados' : ' · alianza del sur: ' + Math.round(x.alianza) + '/100'}</div><div class="seg">${[['dialogante', '🕊 Diálogo'], ['duro', '✊ Línea dura'], ['bloque_sur', '🌅 Bloque sur']].map(([k, n]) => `<button data-post="${k}" class="${x.postura === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div></div>
          <div class="tarjeta"><div class="t-cab"><h3>Quién gobierna en la UE</h3></div><div class="lista">${Object.keys(f.n).sort((a, b) => f.n[b] - f.n[a]).map(k => `<div class="it"><b style="min-width:70px">${esc(D().grupos[k] ? D().grupos[k].sigla : k)}${k === mi ? ' ⭐' : ''}</b><div class="barra-h" style="height:8px;flex:1;margin:0 8px"><i style="width:${f.n[k] / f.tot * 100}%;background:${D().grupos[k] ? D().grupos[k].color : 'var(--oro)'}"></i></div><span class="tenue" style="font-size:11.5px">${f.n[k]} gobiernos</span></div>`).join('')}</div><div class="tenue" style="font-size:12px;margin-top:6px">Tener a tu familia en el poder en más países refuerza tu capital europeo.</div></div>`;
      } else {
        const hs = E.elecciones.historico.filter(x2 => x2.pais && x2.pais !== 'ES').slice(0, 10);
        h += `<div class="tarjeta"><div class="t-cab"><h3>Últimas elecciones fuera de España</h3></div><div class="lista">${hs.map(e => { const ks = Object.keys(e.escanos || {}).sort((a, b) => e.escanos[b] - e.escanos[a]), w = E.partidos[ks[0]], pa = D().paises[e.pais]; return `<div class="it"><span class="etq">${U.fmtT(e.t, true)}</span><div class="cuerpo" style="flex:1"><b>${esc(pa ? pa.nombre : e.pais)}</b> <span class="tenue" style="font-size:12px">gana ${w ? esc(w.sigla) : '—'} (${e.escanos[ks[0]]} esc.)${w && w.grupo ? ' · ' + esc((D().grupos[w.grupo] || {}).sigla || '') : ''}</span></div></div>`; }).join('') || '<div class="vacio" style="padding:10px">Aún no ha habido elecciones en otros países durante tu partida.</div>'}</div></div>`;
      }
      h += `<div class="tarjeta"><div class="t-cab"><h3>📓 Diario exterior</h3></div><div class="lista">${x.hist.slice(0, 8).map(y => `<div class="it"><span class="etq">${U.fmtT(y.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(y.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin novedades.</div>'}</div></div>`;
      el.innerHTML = h; UI.$$('[data-tx]', el).forEach(b => b.onclick = () => { E.ui.tabExt = b.dataset.tx; C.App.refrescar(); });
      UI.$$('[data-post]', el).forEach(b => b.onclick = () => { const r = Ex.postura(E, b.dataset.post); UI.toast(esc(r.msg), r.ok ? 'bien' : 'mal'); C.App.refrescar(); });
    }
  };
})(window.ESP);

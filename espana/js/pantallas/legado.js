/* Legado: resumen semanal, estadísticas, logros y epílogo, cada uno en su pestaña. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['semana', '🗞 Resumen semanal'], ['stats', '📊 Estadísticas'], ['logros', '🏆 Logros'], ['epilogo', '📖 Epílogo']];
  C.Pantallas.legado = {
    render(el) {
      const E = C.E, Lg = C.Legado, l = Lg.asegurar(E), tab = E.ui.tabLegado || 'semana'; let h;
      if (tab === 'semana') h = `<div class="tarjeta"><div class="t-cab"><h3>Lo que ha cambiado</h3></div>${l.resumen.map(r => `<div style="margin-bottom:12px"><div class="etq">${U.fmtT(r.t, true)}</div><div class="lista">${r.lineas.map(x => `<div class="it"><span>${x[0]}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x[1])}</div></div>`).join('') || '<div class="tenue" style="font-size:12px;padding:6px">Semana tranquila.</div>'}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Avanza una semana para ver el primer resumen.</div>'}</div>`;
      else if (tab === 'stats') {
        const ser = l.ser.slice(-120), mk = (n, c, i) => ({ nombre: n, color: c, datos: ser.map(x => [x[0], x[i]]) });
        h = `<div class="cuadricula-2">${Lg.stats(E).map(([k, v]) => `<div class="tarjeta"><div class="tenue" style="font-size:12px">${k}</div><div style="font-size:24px;font-weight:700">${v}</div></div>`).join('')}</div>${ser.length > 2 ? `<div class="tarjeta"><div class="t-cab"><h3>Evolución de tu carrera</h3></div>${G.linea([mk('Prestigio', '#E3C06A', 1), mk('Popularidad', '#6CC4F5', 2), mk('Tu partido (%)', '#7BD88F', 3)], { alto: 200 })}</div>` : ''}`;
      } else if (tab === 'logros') {
        h = `<div class="cuadricula-2">${Object.keys(Lg.LOGROS).map(k => { const g = Lg.LOGROS[k], t = l.logros[k]; return `<div class="tarjeta" style="${t ? 'border-color:var(--oro)' : 'opacity:.55'}"><div class="t-cab"><h3>${t ? g[0] : '🔒'} ${esc(g[1])}</h3>${t ? `<span class="etq oro">${U.fmtT(t, true)}</span>` : ''}</div><div class="tenue" style="font-size:12.5px">${esc(g[2])}</div></div>`; }).join('')}</div>`;
      } else h = `<div class="tarjeta"><div class="t-cab"><h3>📖 Tu epílogo, hasta ahora</h3></div><p style="font-size:14px;line-height:1.6">${esc(Lg.epilogo(E))}</p><div class="tenue" style="font-size:12px">Se reescribe a medida que avanza tu carrera. Si te retiras, esta es la historia que queda.</div></div>`;
      el.innerHTML = `<div class="cab"><div><h1>🏆 Legado</h1><div class="sub">Qué ha pasado esta semana, cómo vas y qué has conseguido</div></div></div><div class="seg" style="margin-bottom:12px;flex-wrap:wrap">${TABS.map(([k, n]) => `<button data-tl="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${h}`;
      UI.$$('[data-tl]', el).forEach(b => b.onclick = () => { E.ui.tabLegado = b.dataset.tl; C.App.refrescar(); });
    }
  };
})(window.ESP);

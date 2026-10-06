/* Legado: resumen semanal, estadísticas, logros y epílogo, cada uno en su pestaña. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['semana', '🗞 Resumen semanal'], ['stats', '📊 Estadísticas'], ['balance', '⚖️ Balance de legislatura'], ['logros', '🏆 Logros'], ['epilogo', '📖 Epílogo']];
  C.Pantallas.legado = {
    render(el) {
      const E = C.E, Lg = C.Legado, l = Lg.asegurar(E), tab = E.ui.tabLegado || 'semana'; let h;
      if (tab === 'semana') h = `<div class="tarjeta"><div class="t-cab"><h3>Lo que ha cambiado</h3></div>${l.resumen.map(r => `<div style="margin-bottom:12px"><div class="etq">${U.fmtT(r.t, true)}</div><div class="lista">${r.lineas.map(x => `<div class="it"><span>${x[0]}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x[1])}</div></div>`).join('') || '<div class="tenue" style="font-size:12px;padding:6px">Semana tranquila.</div>'}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Avanza una semana para ver el primer resumen.</div>'}</div>`;
      else if (tab === 'stats') {
        const ser = l.ser.slice(-120), mk = (n, c, i) => ({ nombre: n, color: c, datos: ser.map(x => [x[0], x[i]]) });
        h = `<div class="cuadricula-2">${Lg.stats(E).map(([k, v]) => `<div class="tarjeta"><div class="tenue" style="font-size:12px">${k}</div><div style="font-size:24px;font-weight:700">${v}</div></div>`).join('')}</div>${ser.length > 2 ? `<div class="tarjeta"><div class="t-cab"><h3>Evolución de tu carrera</h3></div>${G.linea([mk('Prestigio', '#E3C06A', 1), mk('Popularidad', '#6CC4F5', 2), mk('Tu partido (%)', '#7BD88F', 3)], { alto: 200 })}</div>` : ''}`;
      } else if (tab === 'balance') {
        const b = Lg.balance(E), f = x => (Math.round(x * 10) / 10).toLocaleString('es-ES');
        h = `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>Balance de la legislatura ${b.lg.n}</h3><span class="etq oro">${b.nota} · ${b.pts}/100</span></div><div class="tenue" style="font-size:12.5px">${b.ok} de ${b.prom.length} promesas cumplidas hasta ahora.</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>📣 Lo que prometiste</h3></div><div class="lista">${b.prom.map(p => { const v = Lg.valor(E, p.k), ok = Lg.cumplida(E, p); return `<div class="it" style="flex-wrap:wrap"><span>${ok ? '✅' : '⏳'}</span><div class="cuerpo" style="flex:1;min-width:190px;white-space:normal"><b style="font-weight:500">${esc(p.txt)}</b><div class="tenue" style="font-size:11px">Al empezar: ${f(p.ini)} · ahora: ${f(v)} · meta: ${f(p.meta)}</div></div><span class="etq ${ok ? 'verde' : 'amar'}">${ok ? 'Cumplida' : 'En curso'}</span></div>`; }).join('')}</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>📊 Cómo ha cambiado el país</h3></div><table class="tabla"><thead><tr><th>Indicador</th><th class="num">Inicio</th><th class="num">Ahora</th><th class="num">Sin tus políticas</th><th></th></tr></thead><tbody>${b.rows.map(r => `<tr><td>${esc(r.n)}</td><td class="num">${f(r.ini)}</td><td class="num">${f(r.act)}</td><td class="num">${r.base != null ? f(r.base) : '—'}</td><td><span class="etq ${r.bien ? 'verde' : 'rojo'}">${r.bien ? 'mejor' : 'peor'}</span></td></tr>`).join('')}</tbody></table><div class="tenue" style="font-size:11.5px;margin-top:6px">«Sin tus políticas» compara con la trayectoria base de la economía sin las medidas aplicadas (cuando está disponible).</div></div>
          ${(Lg.asegurar(E).legs || []).length ? `<div class="tarjeta"><h3>Legislaturas anteriores</h3><div class="lista">${Lg.asegurar(E).legs.map(x => `<div class="it"><span class="etq">${U.fmtT(x.t1, true)}</span><div class="cuerpo" style="flex:1">Legislatura ${x.n}: ${x.ok}/${x.tot} promesas</div><span class="etq oro">${esc(x.nota)} · ${x.pts}</span></div>`).join('')}</div></div>` : ''}`;
      } else if (tab === 'logros') {
        h = `<div class="cuadricula-2">${Object.keys(Lg.LOGROS).map(k => { const g = Lg.LOGROS[k], t = l.logros[k]; return `<div class="tarjeta" style="${t ? 'border-color:var(--oro)' : 'opacity:.55'}"><div class="t-cab"><h3>${t ? g[0] : '🔒'} ${esc(g[1])}</h3>${t ? `<span class="etq oro">${U.fmtT(t, true)}</span>` : ''}</div><div class="tenue" style="font-size:12.5px">${esc(g[2])}</div></div>`; }).join('')}</div>`;
      } else h = `<div class="tarjeta"><div class="t-cab"><h3>📖 Tu epílogo, hasta ahora</h3></div><p style="font-size:14px;line-height:1.6">${esc(Lg.epilogo(E))}</p><div class="tenue" style="font-size:12px">Se reescribe a medida que avanza tu carrera. Si te retiras, esta es la historia que queda.</div></div>`;
      el.innerHTML = `<div class="cab"><div><h1>🏆 Legado</h1><div class="sub">Qué ha pasado esta semana, cómo vas y qué has conseguido</div></div></div><div class="seg" style="margin-bottom:12px;flex-wrap:wrap">${TABS.map(([k, n]) => `<button data-tl="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${h}`;
      UI.$$('[data-tl]', el).forEach(b => b.onclick = () => { E.ui.tabLegado = b.dataset.tl; C.App.refrescar(); });
    }
  };
})(window.ESP);

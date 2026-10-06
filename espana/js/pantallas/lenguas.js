/* Lenguas y símbolos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  const g = (n, v) => `<div style="margin:6px 0"><div class="fila" style="justify-content:space-between;font-size:12px"><span>${n}</span><b>${Math.round(v)}</b></div><div class="barra-h" style="height:6px"><i style="width:${v}%;background:var(--oro)"></i></div></div>`;
  C.Pantallas.lenguas = {
    render(el) {
      const E = C.E, Ln = C.Lenguas, l = Ln.asegurar(E), J = E.jugador, mia = Ln.gestor(E) ? J.region : null;
      el.innerHTML = `<div class="cab"><div><h1>🗣 Lenguas y símbolos</h1><div class="sub">Identidad, lenguas cooficiales y símbolos de cada comunidad${mia ? '' : ' · para actuar necesitas gobernar una comunidad con lengua propia'}</div></div></div>
        ${mia ? `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>Tus decisiones en ${esc(D().ccaa[mia].nombre)}</h3></div><div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('inmersion_linguistica', {}, '🏫 Reforzar en la escuela', 'chico')}${UI.botonAccion('ley_normalizacion', {}, '📖 Ley de normalización', 'chico')}${UI.botonAccion('tv_autonomica', {}, '📺 Televisión autonómica', 'chico')}</div><div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${Object.keys(Ln.SIMBOLOS).map(k => UI.botonAccion('simbolo_regional', { s: k }, Ln.SIMBOLOS[k][1] + ' ' + Ln.SIMBOLOS[k][0] + (l.r[mia].simb[k] ? ' ✔' : ''), 'chico')).join('')}</div></div>` : ''}
        <div class="cuadricula-2" style="align-items:start">${Ln.ids().map(c => { const x = l.r[c], rc = E.esp.ccaa[c]; return `<div class="tarjeta"><div class="t-cab"><h3>${esc(D().ccaa[c].nombre)}</h3><span class="etq">${esc(D().ccaa[c].lengua)}</span></div>${g('Uso social', x.uso)}${g('Presencia en escuela y administración', x.pres)}${g('Televisión autonómica', x.tv)}<div class="tenue" style="font-size:11.5px;margin-top:6px">Símbolos: ${Object.keys(x.simb).map(k => Ln.SIMBOLOS[k][1]).join(' ') || 'ninguno propio'} · relación con Moncloa ${Math.round(rc.relM)}</div></div>`; }).join('')}</div>
        <div class="tarjeta"><div class="t-cab"><h3>📓 Cuaderno</h3></div><div class="lista">${l.hist.slice(0, 8).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin novedades.</div>'}</div></div>`;
    }
  };
})(window.ESP);

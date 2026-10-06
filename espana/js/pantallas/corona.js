/* La Corona. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.corona = {
    render(el) {
      const E = C.E, Co = C.Corona, c = Co.asegurar(E); c.serie = c.serie || []; c.hist = c.hist || []; const col = v => v > 60 ? 'var(--si)' : v > 40 ? 'var(--oro)' : 'var(--no)';
      const barra = (n, v) => `<div style="margin:8px 0"><div class="fila" style="justify-content:space-between;font-size:12.5px"><b>${n}</b><span>${Math.round(v)}</span></div><div class="barra-h" style="height:8px"><i style="width:${v}%;background:${col(v)}"></i></div></div>`;
      el.innerHTML = `<div class="cab"><div><h1>👑 La Corona</h1><div class="sub">${c.reinado ? 'Reinado de la Princesa heredera' : 'Reinado actual'}${c.crisis ? ' · <b style="color:var(--no)">crisis de legitimidad</b>' : ''}</div></div></div>
        <div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Imagen de la Casa Real</h3></div>${barra('Popularidad del Rey', c.pop)}${barra('Relación con el Gobierno', c.rel)}${barra('Neutralidad percibida', c.neutral)}${c.serie.length > 2 ? G.linea([{ nombre: 'Popularidad', color: '#E3C06A', datos: c.serie.slice(-100) }], { alto: 150 }) : ''}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Tu relación con la Corona</h3></div><div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('audiencia_rey', {}, '👑 Audiencia', 'chico prim')}${UI.botonAccion('defender_corona', {}, '🛡️ Defender', 'chico')}${UI.botonAccion('cuestionar_corona', {}, '🏴 Cuestionar', 'chico')}${c.crisis ? UI.botonAccion('mediar_corona', {}, '🕊️ Mediar', 'chico') : ''}</div>
        <div class="tenue" style="font-size:12px;margin-top:10px;line-height:1.5">Un Rey impopular alimenta el republicanismo (UPC, VAP). Si la popularidad se hunde, se abre una crisis de legitimidad que puede acabar en abdicación. El Rey interviene en las rondas de consultas de cada investidura y en el discurso de Navidad.</div></div></div>
        <div class="tarjeta"><div class="t-cab"><h3>📓 Crónica de la Casa Real</h3></div><div class="lista">${c.hist.map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin novedades en Palacio.</div>'}</div></div>`;
    }
  };
})(window.ESP);

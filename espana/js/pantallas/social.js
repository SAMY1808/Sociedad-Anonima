/* Diálogo social: mesa con sindicatos y patronal, conflictividad y huelgas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.social = {
    render(el) {
      const E = C.E, So = C.Social, s = So.asegurar(E), puede = So.puede(E), sel = E.ui.socialTema || 'smi';
      const T = So.TEMAS, tm = T[sel];
      let h = `<div class="cab"><div><h1>🤝 Diálogo social</h1><div class="sub">Sindicatos, patronal y calle: negocia salarios, reforma laboral, pensiones y jornada</div></div></div>`;
      h += `<div class="cuadricula-2"><div class="tarjeta"><div class="t-cab"><h3>🔥 Conflictividad social</h3><span class="etq ${s.conf > 60 ? 'rojo' : s.conf > 35 ? 'amar' : 'verde'}">${Math.round(s.conf)} / 100</span></div>
        <div class="barra-h" style="height:10px"><i style="width:${s.conf}%;background:${s.conf > 60 ? 'var(--no)' : 'var(--oro)'}"></i></div>
        <div class="tenue" style="font-size:12px;margin:8px 0">Satisfacción: sindicatos <b>${Math.round(s.sindSat)}</b> · patronal <b>${Math.round(s.patSat)}</b></div>
        ${s.huelgas.length ? `<div class="nota" style="border-color:var(--no)">✊ ${s.huelgas.length} huelga(s) en curso</div>` : ''}
        <div style="margin-top:8px">${UI.botonAccion('calmar_conflicto', {}, '🕊️ Reunir a los agentes sociales', 'chico')}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Estado actual</h3></div><div class="lista">${Object.keys(T).map(k => `<div class="it"><span>${T[k].ic}</span><div class="cuerpo" style="flex:1"><b>${T[k].n}</b></div><span class="etq">${esc(T[k].niveles[s.niv[k] || 0][0])}</span></div>`).join('')}</div></div></div>`;
      if (puede !== true) h += `<div class="nota">🔒 Sólo el presidente del Gobierno o los ministros de Economía y Trabajo pueden abrir la mesa. Mientras tanto, sigues el diálogo social como observador.</div>`;
      else {
        h += `<div class="seg" style="margin:12px 0">${Object.keys(T).map(k => `<button data-tema="${k}" class="${sel === k ? 'activo' : ''}">${T[k].ic} ${T[k].n}</button>`).join('')}</div>`;
        h += `<div class="tarjeta"><div class="t-cab"><h3>${tm.ic} ${tm.n}</h3><span class="etq">Enfriamiento: ${Math.max(0, 12 - Math.round(E.fecha.t - (s.ult[sel] || -99)))} sem</span></div>
          <label class="fila" style="gap:6px;font-size:12.5px;margin-bottom:8px"><input type="checkbox" id="so-comp"> Ofrecer compensaciones a la patronal (+ aceptación empresarial, cuesta déficit)</label>
          <div class="lista">${[-1, 0, 1, 2].map(L => { const p = So.prob(E, sel, L, !!E.ui.socialComp); return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px"><b>${esc(tm.niveles[L][0])}</b><div class="tenue" style="font-size:11px">Sindicatos ${Math.round(p.sind * 100)} % · Patronal ${Math.round(p.pat * 100)} % · Acuerdo ${Math.round(p.ac * 100)} %</div></div>
            ${UI.botonAccion('mesa_dialogo', { tema: sel, L, comp: !!E.ui.socialComp }, '🤝 Negociar', 'chico')}${UI.botonAccion('imponer_decreto_social', { tema: sel, L }, '⚡ Decreto', 'chico')}</div>`; }).join('')}</div></div>`;
      }
      h += `<div class="tarjeta"><div class="t-cab"><h3>📜 Historial de acuerdos y rupturas</h3></div><div class="lista">${s.acuerdos.slice(0, 12).map(a => `<div class="it"><span class="etq">${U.fmtT(a.t, true)}</span><div class="cuerpo" style="flex:1"><b style="font-weight:500">${T[a.tema].n}: ${esc(T[a.tema].niveles[a.L][0])}</b></div><span class="etq ${a.tipo === 'ruptura' ? 'rojo' : a.tipo === 'decreto' ? 'amar' : 'verde'}">${a.tipo}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no hay acuerdos.</div>'}</div></div>`;
      el.innerHTML = h;
      UI.$$('[data-tema]', el).forEach(b => b.onclick = () => { E.ui.socialTema = b.dataset.tema; C.App.refrescar(); });
      const cb = UI.$('#so-comp', el); if (cb) { cb.checked = !!E.ui.socialComp; cb.onchange = () => { E.ui.socialComp = cb.checked; C.App.refrescar(); }; }
    }
  };
})(window.ESP);

/* Panel «Campaña viva»: fase, cuenta atrás, indecisos, impulso de cada partido, dosieres y mitin de cierre. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.campana3 = {
    html(E, camp) {
      const V3 = C.Campana3, Ca = C.Campana, J = E.jugador, v = V3.v3(camp), gen = camp.ambito === 'gen', sem = Math.max(0, camp.tVoto - E.fecha.t), fase = V3.fase(E, camp), P = E.paises.ES;
      const idx = V3.FASES.findIndex(f => f[0] === fase);
      const lineaT = `<div class="tramite" style="margin:6px 0 12px">${V3.FASES.map((f, i) => `<div class="paso ${i < idx ? 'hecha' : ''} ${i === idx ? 'actual' : ''}">${f[1].replace(/^\S+\s/, '')}</div>`).join('')}<div class="paso ${sem <= 0 ? 'actual' : ''}">Urnas</div></div>`;
      const ks = P.partidos.filter(k => E.partidos[k].amb === 'nac' || k === J.partido).sort((a, b) => (camp.mom[b] || 0) - (camp.mom[a] || 0)).slice(0, 7);
      const ola = ks.map(k => { const m = camp.mom[k] || 0, w = Math.abs(m) / 4 * 50; return `<div class="fila" style="gap:8px;align-items:center;margin:3px 0"><b style="width:60px;font-size:12px">${Comp.partido(E, k)}</b><div style="flex:1;height:8px;background:#1b2640;border-radius:4px;position:relative"><div style="position:absolute;top:0;bottom:0;${m >= 0 ? 'left:50%' : `right:50%`};width:${w}%;background:${m >= 0 ? 'var(--si)' : 'var(--no)'};border-radius:4px"></div><div style="position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#4a5a7a"></div></div><span class="tenue" style="width:34px;font-size:11px;text-align:right">${m >= 0 ? '+' : ''}${U.d1(m)}</span></div>`; }).join('');
      let dos = '', cierre = '';
      if (gen) {
        const rs = P.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac').sort((a, b) => (E.partidos[b].popN || 0) - (E.partidos[a].popN || 0)).slice(0, 3);
        dos = `<h3 style="margin:12px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase" class="tenue">🗂 Dosieres de campaña</h3><div class="lista">${rs.map(k => { const p = v.dossier[k] || 0; return `<div class="it" style="flex-wrap:wrap"><b style="width:60px">${Comp.partido(E, k)}</b><div class="barra-h" style="height:8px;flex:1;min-width:90px"><i style="width:${p * 10}%;background:var(--oro)"></i></div><span class="tenue" style="font-size:11px;width:30px">${U.d1(p)}</span>${UI.botonAccion('investigar_rival', { pid: k }, '🔎', 'chico')}${UI.botonAccion('publicar_dossier', { pid: k }, '🗂️ Publicar', 'chico')}</div>`; }).join('')}</div>`;
        cierre = v.cierre ? '<div class="nota" style="margin-top:10px">🎤 Ya has hecho el mitin de cierre.</div>' : `<h3 style="margin:12px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase" class="tenue">🎤 Mitin de cierre ${sem > 2 ? '(se desbloquea en ' + (sem - 2) + ' sem)' : ''}</h3><div class="fila" style="gap:6px;flex-wrap:wrap">${Object.keys(V3.LUGARES).map(k => { const L = V3.LUGARES[k]; return UI.botonAccion('mitin_cierre', { lugar: k }, `${L[1]} ${L[0]} (${L[2]} M€)`, 'chico'); }).join('')}</div>`;
      }
      return `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>🔥 Campaña viva</h3><span class="etq oro">${sem > 0 ? sem + ' semanas para las urnas' : 'Día de las elecciones'}</span></div>${lineaT}
        <div style="font-size:12.5px;margin:4px 0"><b>Indecisos</b> <span class="tenue">· se van decantando cada semana</span><span style="float:right"><b>${U.d1(v.indecisos)} %</b></span></div><div class="barra-h" style="height:8px;margin-bottom:10px"><i style="width:${Math.min(100, v.indecisos / 40 * 100)}%;background:var(--oro)"></i></div>
        <h3 style="margin:8px 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase" class="tenue">🌊 Impulso de campaña</h3>${ola}${dos}${cierre}</div>`;
    }
  };
})(window.ESP);

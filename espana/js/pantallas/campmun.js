/* Campaña municipal completa: panel de la pestaña «Municipales» (y de «Campaña» para cargos locales). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const pct = x => x == null ? '—' : '+' + U.d1(x) + ' %';
  const barra = (v, max, col) => `<div class="barra-h" style="height:6px;width:64px;display:inline-block;vertical-align:middle"><i style="width:${Math.min(100, v / max * 100)}%;background:${col}"></i></div>`;

  C.Pantallas.campmun = {
    panel(E) {
      const Cm = C.CampMun; if (!Cm) return '';
      const cm = Cm.asegurar(E), J = E.jugador, s = Cm.semanas(E), act = Cm.activa(E), pa = E.partidos[J.partido];
      if (!act) {
        const bal = cm.bal ? `<div class="nota" style="margin-top:8px"><b>Balance de tu última campaña municipal</b> (${U.fmtT(cm.bal.t, true)}): ${cm.bal.conc >= 0 ? '+' : '−'}${Math.abs(cm.bal.conc)} concejales sobre lo previsto, ${cm.bal.alc} alcaldías en las grandes ciudades, ${cm.bal.gasto} M€ gastados${cm.bal.gan.length ? '. Mejor resultado en ' + cm.bal.gan.slice(0, 3).map(x => esc(E.esp.muni.m[x.id].nombre) + ' (+' + x.d + ')').join(', ') : ''}.</div>` : '';
        return `<div class="tarjeta"><div class="t-cab"><h3>🏘 Tu campaña de las municipales</h3><span class="etq">${s > Cm.VENT && s < 99 ? 'Empieza en ' + (s - Cm.VENT) + ' semanas' : 'Sin campaña'}</span></div>
          <div class="tenue" style="font-size:12.5px;line-height:1.55">Doce semanas antes de las municipales se abre la campaña: <b>mítines</b> y <b>gasto local</b> en cada una de las grandes ciudades, <b>candidatos estrella</b>, encuestas con margen de error y sucesos de campaña. Un buen reparto del esfuerzo gana concejales y, a veces, la alcaldía.</div>${bal}</div>`;
      }
      const lib = Cm.libre(cm), lista = Cm.enDisputa(E), top = lista.slice(0, 12), propia = J.muni && E.esp.muni.m[J.muni] && !top.some(x => x.id === J.muni) ? lista.find(x => x.id === J.muni) : null;
      const filas = top.concat(propia ? [propia] : []).map(x => { const m = E.esp.muni.m[x.id], p = x.p, esf = cm.esf[x.id] || 0, g = cm.gasto[x.id] || 0, mia = J.muni === x.id;
        const sit = p.enJuego ? `<span class="etq ${p.primero ? 'verde' : 'rojo'}">${p.primero ? 'Alcaldía a tu alcance' : 'Alcaldía en juego'}</span>` : `<span class="tenue" style="font-size:11.5px">${p.ganar != null && p.ganar < 6 ? 'Con ' + pct(p.ganar) + ' ganas un concejal' : 'Sin cambios a la vista'}</span>`;
        return `<tr${mia ? ' style="background:rgba(217,180,90,.08)"' : ''}><td>${C.Escudos ? C.Escudos.mini(x.id) : ''}<b>${esc(m.nombre)}</b>${mia ? ' <span class="etq oro">tu ciudad</span>' : ''}<br><span class="tenue" style="font-size:11.5px">${esc(C.DATA.ccaa[m.ccaa].nombre)} · ${U.n(m.pob)} mil hab. · ${m.n} concejales</span></td><td>${Comp.partido(E, m.alcalde)}</td><td class="num"><b>${p.mias}</b>/${p.n}</td><td>${sit}</td><td>${barra(esf, 10, 'var(--oro)')}<div class="tenue" style="font-size:10.5px">esf. ${U.d1(esf)} · gasto ${U.d1(g)}${cm.estrella[x.id] ? ' · ⭐' : ''}</div></td><td style="white-space:nowrap">${UI.botonAccion('mitin_local', { muni: x.id }, '🎤', 'chico')} ${cm.estrella[x.id] ? '' : UI.botonAccion('candidato_estrella', { muni: x.id }, '⭐', 'chico')}</td></tr>`; }).join('');
      const opts = lista.map(x => `<option value="${x.id}">${esc(E.esp.muni.m[x.id].nombre)}</option>`).join('');
      const canales = Object.keys(Cm.CANALES).map(k => `<option value="${k}">${Cm.CANALES[k].ic} ${esc(Cm.CANALES[k].n)}</option>`).join('');
      const enc = cm.enc.tipo ? `<div class="tenue" style="font-size:12px">Última encuesta: ${esc(Cm.ENC[cm.enc.tipo].n)} (${U.fmtT(cm.enc.t, true)}). ${E.fecha.t - cm.enc.t <= 3 ? 'Previsión con poco margen de error.' : 'Ya está desfasada: margen de error ±3 puntos.'}</div>` : '<div class="tenue" style="font-size:12px">Sin encuestas: la previsión por ciudad tiene un margen de error de ±3 puntos.</div>';
      const suc = cm.suc.length ? `<div class="lista" style="font-size:12.5px;margin-top:6px">${cm.suc.slice(0, 5).map(x => `<div class="it"><span style="width:60px" class="tenue">${U.fmtT(x.t, true)}</span><span>${x.ic} ${esc(x.txt)} <b class="${x.d >= 0 ? 'bien' : 'mal'}">${x.d >= 0 ? '+' : '−'}${Math.abs(x.d)}</b></span></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px;margin-top:6px">Sin sucesos todavía.</div>';
      return `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>🏘 Campaña municipal · ${esc(pa.sigla)}</h3><span class="etq oro">${s} semanas para votar · ◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
        <div class="fila" style="gap:12px;font-size:12.5px;flex-wrap:wrap;margin-bottom:6px"><span>Presupuesto <b>${U.d1(cm.presup.gastado)}</b> de ${cm.presup.total + cm.presup.credito} M€</span><span>Disponible <b>${U.d1(lib)}</b> M€</span><span class="tenue">tope legal ${cm.tope} M€</span><span>⭐ ${Object.keys(cm.estrella).length}/4</span></div>
        <div class="barra-h" style="height:8px;margin-bottom:8px"><i style="width:${Math.min(100, cm.presup.gastado / Math.max(1, cm.presup.total + cm.presup.credito) * 100)}%;background:var(--oro)"></i></div>${enc}
        <div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${UI.botonAccion('encuesta_local', { tipo: 'propia' }, '📊 Encuesta propia', 'chico')}${UI.botonAccion('encuesta_local', { tipo: 'prensa' }, '📰 Sondeo de un medio', 'chico')}${UI.botonAccion('campana_mun_auto', {}, '⚡ Reparto automático', 'chico')}${C.CampMini ? UI.botonAccion('campana_mun', {}, '🏘 Acto de campaña (impulso general)', 'chico') : ''}</div></div>
        <div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🗺 Ciudades en disputa</h3><span class="etq">Concejales previstos / total</span></div><div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Ciudad</th><th>Alcaldía</th><th class="num">Tuyos</th><th>Situación</th><th>Campaña</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>
          <div class="tenue" style="font-size:11.5px;margin-top:6px">Ordenadas por lo disputadas que están (un empujón da o quita un concejal; «alcaldía» = a pocos concejales de la lista más votada). Cada mitin y cada euro suman esfuerzo en esa ciudad.</div></div>
        <div class="tarjeta accion-form" style="margin-top:12px"><div class="t-cab"><h3>💶 Gasto local</h3></div><div class="fila" style="gap:6px;flex-wrap:wrap"><select data-arg="muni">${opts}</select><select data-arg="canal">${canales}</select>${UI.botonAccion('gasto_local', {}, '💶 Invertir', 'prim')}</div><div class="tenue" style="font-size:12px;margin-top:6px">${Object.keys(Cm.CANALES).map(k => `${Cm.CANALES[k].ic} ${esc(Cm.CANALES[k].d)}`).join(' · ')}</div></div>
        <div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🗞 Sucesos de campaña</h3></div>${suc}</div><div style="height:12px"></div>`;
    }
  };
})(window.ESP);

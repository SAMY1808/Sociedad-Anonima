/* Mi partido: apoyo, ideología, cohesión, escalera interna. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.partido = {
    render(el) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], pa = E.partidos[J.partido], S = E.series;
      const lider = E.politicos[pa.lider];
      const top = P.partidos.slice().sort((a, b) => (E.partidos[b].popN || E.partidos[b].pop) - (E.partidos[a].popN || E.partidos[a].pop)).slice(0, 5);
      if (!top.includes(J.partido)) top.push(J.partido);
      const series = top.map(k => ({ nombre: E.partidos[k].sigla, color: E.partidos[k].color, datos: (S['pop:' + k] || []).slice(-100) }));
      const pts = P.partidos.map(k => { const p = E.partidos[k]; return { x: p.eco, y: p.soc, r: 4 + Math.sqrt(p.popN || p.pop) * 2, color: p.color, etq: p.sigla, tt: `<b>${esc(p.nombre)}</b><br>${U.d1(p.popN || p.pop)} %`, borde: k === J.partido ? '#FFF3C4' : '#0A111D', bw: k === J.partido ? 3 : 2, op: .8 }; });
      pts.push({ x: J.eco, y: J.soc, r: 5, color: '#FFFFFF', etq: 'Tú', borde: '#0A111D', bw: 2, tt: '<b>Tu posición</b>' });
      const roles = ['base', 'portavoz', 'direccion', 'lider'];
      const escal = roles.map(r => `<div class="paso ${roles.indexOf(J.rol) > roles.indexOf(r) ? 'hecha' : ''} ${J.rol === r ? 'actual' : ''}">${esc(D().rolesPartido[r].nombre)}</div>`).join('');
      const dist = U.distIdeo(J, pa);
      el.innerHTML = `<div class="cab"><div><h1><i class="pto" style="background:${pa.color};width:16px;height:16px"></i> ${esc(pa.nombre)}</h1><div class="sub">${esc(D().arquetipos[pa.arq].nombre)} · ${esc(D().grupos[pa.grupo].nombre)} en Europa · ${esc(Comp.terTxt(pa.ter))}${pa.nuevo ? ' · <span class="oro">fundado por ti</span>' : ''}</div></div></div>
        <div class="grid g4"><div class="tarjeta">${Comp.kpi('Apoyo estatal', U.d1(pa.popN || pa.pop) + ' %', Comp.delta(S['pop:' + pa.id], 12))}</div><div class="tarjeta">${Comp.kpi('Escaños', P.escanos[pa.id] || 0, `<span class="tenue">de 350</span>`)}</div><div class="tarjeta">${Comp.kpi('Cohesión', Math.round(pa.cohesion), Comp.barraRango(pa.cohesion, pa.cohesion > 65 ? 'var(--bien)' : 'var(--alerta)'))}</div><div class="tarjeta">${Comp.kpi('Militantes', U.n(pa.militantes), `<span class="tenue">Finanzas ${Math.round(pa.finanzas)}/100</span>`)}</div></div>
        <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>Evolución del apoyo (%)</h3>${G.linea(series, { alto: 190, unidad: ' %' })}</div>
          <div class="tarjeta"><h3>Mapa ideológico</h3>${G.plano(pts, { tam: 320 })}<div class="tenue" style="font-size:12px;margin-top:4px">Distancia con la línea del partido: <b>${Math.round(dist * 100)} %</b> ${dist > 0.25 ? '<span class="alerta">(riesgo de fricción)</span>' : ''}</div></div></div>
        <div class="grid g4" style="margin-top:14px"><div class="tarjeta">${Comp.kpi('Presidencias autonómicas', C.Territorio.nPresidentes(E, pa.id), `<span class="tenue">de 19</span>`)}</div><div class="tarjeta">${Comp.kpi('Alcaldías', U.n(C.Municipios.alcaldias(E)[pa.id] || 0), `<span class="tenue">de ${U.n(E.esp.muni.resumen.total)}</span>`)}</div><div class="tarjeta">${Comp.kpi('Diputados autonómicos', C.Territorio.aggPartido(E, pa.id), `<span class="tenue">de ${C.Territorio.escanosTotales(E)}</span>`)}</div><div class="tarjeta">${Comp.kpi('Senadores', (E.esp.senado.escanos[pa.id] || 0), `<span class="tenue">de ${E.esp.senado.total}</span>`)}</div></div>
        <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>Tu posición en el partido</h3><div class="tramite" style="margin:10px 0 14px">${escal}</div>
          <div class="fila" style="gap:8px">${UI.botonAccion('ascender', {}, '📈 Ascender', '')}${UI.botonAccion('desafiar_lider', {}, '⚔️ Desafiar al líder', 'peligro')}${UI.botonAccion('mediar_partido', {}, '🕊️ Mediar', '')}${UI.botonAccion('recorrer_bases', {}, '🚌 Recorrer bases', '')}${UI.botonAccion('liderar_region', {}, '📍 Liderar tu comunidad', '')}</div>
          <div class="lista" style="margin-top:12px;font-size:13px"><div class="it"><span class="tenue" style="width:120px">Líder</span><b>${esc(lider ? lider.n : '—')}${pa.lider === 'J' ? ' <span class="etq oro">Tú</span>' : ''}</b></div><div class="it"><span class="tenue" style="width:120px">Prestigio</span><b>${Math.round(J.prestigio)}/100</b></div><div class="it"><span class="tenue" style="width:120px">Postura</span>${Comp.postura(pa.postura)}</div></div></div>
          <div class="tarjeta"><h3>Rivales y socios</h3><div class="lista" style="font-size:13px">${P.partidos.filter(k => k !== J.partido).sort((a, b) => U.distIdeo(pa, E.partidos[a]) - U.distIdeo(pa, E.partidos[b])).slice(0, 6).map(k => { const p = E.partidos[k], di = U.distIdeo(pa, p); return `<div class="it">${Comp.partido(E, k, true)}<span class="tenue" style="margin-left:auto">${U.d1(p.popN || p.pop)} % · afinidad ${Math.round((1 - di) * 100)} %</span></div>`; }).join('')}</div></div></div>`;
    }
  };
})(window.ESP);

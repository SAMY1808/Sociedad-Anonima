/* Organismos y altos cargos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.organismos = {
    render(el) {
      const E = C.E, Og = C.Organismos, s = Og.asegurar(E), g = E.paises.ES.gob, pm = g.pm === 'J';
      el.innerHTML = `<div class="cab"><div><h1>🏢 Organismos y altos cargos</h1><div class="sub">Confianza institucional <b>${Math.round(Og.confianza(E))}</b> · mercados <b>${Math.round(Og.mercados(E))}</b></div></div></div>
        ${pm ? '' : '<div class="nota" style="margin-bottom:10px">Sólo el presidente del Gobierno nombra a los titulares. Observas el reparto del poder institucional.</div>'}
        <div class="lista">${Object.keys(Og.ORGS).map(k => { const O = Og.ORGS[k], o = s.o[k], rest = Math.round(o.t0 + O.mandato - E.fecha.t); return `<div class="tarjeta"><div class="t-cab"><h3>${O.ic} ${esc(O.n)}</h3><span class="etq ${o.indep > 60 ? 'verde' : o.indep < 40 ? 'rojo' : 'amar'}">Independencia ${o.indep}</span></div>
          <div class="tenue" style="font-size:12px;margin-bottom:6px">${esc(O.desc)}</div><div class="fila" style="gap:8px;flex-wrap:wrap"><b>${esc(o.titular.n)}</b>${o.pid ? `<span class="tenue" style="font-size:12px">afín a</span> ${Comp.partido(E, o.pid)}` : '<span class="etq">Sin afinidad</span>'}<span class="tenue" style="font-size:11.5px;margin-left:auto">${rest > 0 ? 'mandato: ' + Math.round(rest / 52 * 10) / 10 + ' años' : '<b style="color:var(--no)">mandato vencido</b>'}</span></div>
          ${pm ? `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:8px">${UI.botonAccion('nombrar_organismo', { org: k, perfil: 'afin' }, '🤝 Afín', 'chico')}${UI.botonAccion('nombrar_organismo', { org: k, perfil: 'tecnico' }, '🎓 Técnico', 'chico')}${UI.botonAccion('nombrar_organismo', { org: k, perfil: 'consenso' }, '🕊️ Consenso', 'chico')}</div>` : ''}</div>`; }).join('')}</div>
        <div class="tarjeta"><div class="t-cab"><h3>📓 Nombramientos</h3></div><div class="lista">${s.hist.slice(0, 10).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin cambios.</div>'}</div></div>`;
    }
  };
})(window.ESP);

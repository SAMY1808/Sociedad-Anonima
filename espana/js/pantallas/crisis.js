/* Crisis y sucesos nacionales: catástrofes, emergencias sanitarias y de seguridad con respuesta del Estado y de las comunidades. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.crisis = {
    render(el) {
      const E = C.E, Cr = C.Crisis, cs = Cr.asegurar(E), act = cs.activas.filter(c => c.fase !== 'cerrada'), est = Cr.jugadorEstado(E);
      let h = `<div class="cab"><div><h1>🚨 Crisis nacionales</h1><div class="sub">DANA, incendios, pandemias, atentados, apagones… la gestión se juzga en las urnas</div></div></div>`;
      if (!act.length) h += `<div class="vacio">Sin crisis activas. España respira tranquila… por ahora.</div>`;
      for (const c of act) {
        const T = Cr.TIPOS[c.tipo], lugar = c.regs.length > 4 ? 'toda España' : c.regs.map(x => D().ccaa[x].nombre).join(', '), reg = Cr.jugadorRegion(E, c);
        const efi = Math.round(U.suma(c.regs.map(x => c.efic[x])) / c.regs.length * 100), rest = Math.max(0, Math.round(c.t0 + c.dur - E.fecha.t));
        h += `<div class="tarjeta" style="border-color:${c.sev === 3 ? 'var(--no)' : 'var(--oro)'}"><div class="t-cab"><h3>${T.ic} ${T.n}</h3><span class="etq ${c.sev === 3 ? 'rojo' : 'amar'}">Gravedad ${c.sev}/3</span></div>
          <div class="tenue" style="font-size:12px">📍 ${esc(lugar)} · quedan ~${rest} semanas</div>
          <div style="margin:8px 0;font-size:12.5px">Eficacia de la respuesta <b>${efi} %</b><div class="barra-h" style="height:8px"><i style="width:${Math.min(100, efi)}%;background:${efi > 55 ? 'var(--si)' : efi > 35 ? 'var(--oro)' : 'var(--no)'}"></i></div></div>`;
        if (est) h += `<div class="lista">${Object.keys(Cr.OPC_ESTADO).map(k => { const o = Cr.OPC_ESTADO[k], u = c.usadas.includes(k); return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(o[0])}</b><div class="tenue" style="font-size:11px;white-space:normal">${esc(o[1])}</div></div>${u ? '<span class="etq verde">✔ Hecho</span>' : UI.botonAccion('gestionar_crisis', { id: c.id, k, ambito: 'estado' }, 'Ordenar', 'chico')}</div>`; }).join('')}</div>`;
        else if (reg) h += `<div class="lista">${Object.keys(Cr.OPC_REG).map(k => { const o = Cr.OPC_REG[k], u = c.usadasReg.includes(k); return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(o[0])}</b><div class="tenue" style="font-size:11px;white-space:normal">${esc(o[1])}</div></div>${u ? '<span class="etq verde">✔ Hecho</span>' : UI.botonAccion('gestionar_crisis', { id: c.id, k, ambito: 'region' }, 'Decidir', 'chico')}</div>`; }).join('')}</div>`;
        else h += `<div class="nota">Sigues la crisis como observador: la respuesta la dirige el Gobierno y las comunidades afectadas.</div>`;
        h += `</div>`;
      }
      const hist = cs.hist.slice(0, 10);
      h += `<div class="tarjeta"><div class="t-cab"><h3>🗂 Crisis pasadas</h3></div><div class="lista">${hist.map(c => { const T = Cr.TIPOS[c.tipo]; return `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${T.ic}</span><div class="cuerpo" style="flex:1;min-width:160px"><b>${T.n}</b><div class="tenue" style="font-size:11px">${U.fmtT(c.t0, true)} · ${c.regs.length > 4 ? 'toda España' : esc(c.regs.map(x => D().ccaa[x].nombre).join(', '))}</div></div><span class="etq ${c.score < 0.35 ? 'verde' : c.score < 0.65 ? 'amar' : 'rojo'}">${c.score < 0.35 ? 'Buena gestión' : c.score < 0.65 ? 'Gestión mixta' : 'Mala gestión'}</span><span class="tenue" style="font-size:11px">${c.victimas} víctimas · ${c.danos} M€</span></div>`; }).join('') || '<div class="vacio" style="padding:10px">Todavía no ha habido crisis.</div>'}</div></div>`;
      el.innerHTML = h;
    }
  };
})(window.ESP);

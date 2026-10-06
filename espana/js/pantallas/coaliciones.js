/* Acuerdos de gobierno: cláusulas pendientes y cumplidas con cada socio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.coaliciones = {
    render(el) {
      const E = C.E, Cl = C.Coaliciones, g = E.paises.ES.gob, pm = Cl.pm(E), socios = g.coalicion.concat(g.apoyoExterno || []).filter(k => k !== g.partido);
      const pend = E.esp.pactos.filter(p => p.estado === 'pendiente'), hechos = E.esp.pactos.filter(p => p.estado !== 'pendiente').slice(-10).reverse();
      let h = `<div class="cab"><div><h1>📝 Acuerdos de gobierno</h1><div class="sub">${g.coalicion.map(k => E.partidos[k].sigla).join(' + ')}${(g.apoyoExterno || []).length ? ' con apoyo de ' + g.apoyoExterno.map(k => E.partidos[k].sigla).join(', ') : ''} · estabilidad ${Math.round(g.estab)}</div></div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Satisfacción de los socios</h3>${pm ? UI.botonAccion('comision_seguimiento', {}, '📋 Comisión de seguimiento', 'chico prim') : ''}</div><div class="lista">${socios.map(k => { const s = Math.round(Cl.sat(E, k)); return `<div class="it"><b style="min-width:70px">${Comp.partido(E, k)}</b><div class="barra-h" style="height:8px;flex:1;margin:0 8px"><i style="width:${s}%;background:${s > 60 ? 'var(--si)' : s > 40 ? 'var(--oro)' : 'var(--no)'}"></i></div><span class="tenue" style="font-size:11.5px">${s}</span></div>`; }).join('') || '<div class="vacio" style="padding:10px">Gobierno en solitario: sin socios que atender.</div>'}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Cláusulas pendientes</h3><span class="etq">${pend.length}</span></div><div class="lista">${pend.map(p => { const d = Cl.def(p), pr = Cl.progreso(E, p); return `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${d.icono}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(d.nombre)}</b><div class="tenue" style="font-size:11px">${E.partidos[p.pid].sigla} · plazo en ${Math.max(0, Math.round(p.limite - E.fecha.t))} sem${p.seg ? ' · seguimiento ×' + p.seg : ''}</div></div><span class="etq ${pr === 'tramite' ? 'oro' : ''}">${pr === 'tramite' ? 'En tramitación' : 'Sin empezar'}</span>${pm && pr !== 'tramite' ? UI.botonAccion('cumplir_pacto', { pid: p.pid, dem: p.dem }, '📝 Cumplir', 'chico') : ''}${pm && !p.reneg ? UI.botonAccion('renegociar_pacto', { pid: p.pid, dem: p.dem }, '⏳', 'chico') : ''}</div>`; }).join('') || '<div class="vacio" style="padding:10px">No hay cláusulas pendientes.</div>'}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Historial</h3></div><div class="lista">${hechos.map(p => { const d = Cl.def(p); return `<div class="it"><span>${d.icono}</span><div class="cuerpo" style="flex:1;white-space:normal"><b style="font-weight:500">${esc(d.nombre)}</b> <span class="tenue" style="font-size:11px">${E.partidos[p.pid].sigla}</span></div><span class="etq ${p.estado === 'cumplida' ? 'verde' : 'rojo'}">${p.estado}</span></div>`; }).join('') || '<div class="vacio" style="padding:10px">Sin historial.</div>'}</div></div>`;
      el.innerHTML = h;
    }
  };
})(window.ESP);

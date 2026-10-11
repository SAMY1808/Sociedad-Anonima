/* Poder local: gobierno municipal, fondos europeos, peso en el partido. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.local2 = {
    render(el) {
      const E = C.E, Pl = C.PoderLocal, s = Pl.asegurar(E), m = Pl.muni(E), J = E.jugador;
      if (!m) { el.innerHTML = `<div class="cab"><div><h1>🏘 Poder local</h1></div></div><div class="vacio">Esta pestaña se activa cuando tienes un municipio asociado (concejal/a o alcalde/sa).</div>`; return; }
      const alc = m.pm === 'J', nuestros = Pl.alcaldes(E, J.partido), ps = Object.keys(m.esc).filter(k => !m.coal.includes(k) && m.esc[k] > 0).sort((a, b) => m.esc[b] - m.esc[a]);
      el.innerHTML = `<div class="cab"><div><h1>${C.Escudos ? C.Escudos.svg(m.id, { h: 34 }) : '🏘'} Poder local · ${esc(m.nombre)}</h1><div class="sub">Aprobación ${Math.round(m.aprob)} · deuda ${Math.round(m.deuda)} · fondos europeos activos ${m.fondos}</div></div></div>
        <div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Gobierno municipal</h3>${alc ? UI.botonAccion('reunir_socios_local', {}, '☕ Reunir socios', 'chico') : ''}</div><div class="lista">${m.coal.map(k => { const sat = k === m.alcalde ? null : Pl.sat(E, m, k); return `<div class="it" style="flex-wrap:wrap"><b style="min-width:60px">${Comp.partido(E, k)}</b><span class="tenue" style="font-size:12px;flex:1">${m.esc[k] || 0} concejales${k === m.alcalde ? ' · alcaldía' : ''}</span>${sat != null ? `<div class="barra-h" style="height:6px;width:70px"><i style="width:${sat}%;background:${sat > 55 ? 'var(--si)' : sat > 35 ? 'var(--oro)' : 'var(--no)'}"></i></div>${alc ? UI.botonAccion('ceder_concejalia', { pid: k }, '🪑 Ceder', 'chico') : ''}` : ''}</div>`; }).join('')}</div>
          <h3 style="margin-top:10px">Posibles socios</h3><div class="lista">${ps.map(k => `<div class="it"><b style="min-width:60px">${Comp.partido(E, k)}</b><span class="tenue" style="font-size:12px;flex:1">${m.esc[k]} concejales</span>${alc ? UI.botonAccion('pacto_local', { pid: k }, '🤝 Pactar', 'chico') : ''}</div>`).join('') || '<div class="vacio" style="padding:10px">No quedan partidos fuera del gobierno.</div>'}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>🇪🇺 Fondos europeos para la ciudad</h3></div><div class="lista">${s.conv.map(c => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(c.n)}</b><div class="tenue" style="font-size:11px">${c.importe} M€ · cierra en ${Math.max(0, Math.round(c.cierre - E.fecha.t))} sem · dificultad ${Math.round(c.dif * 100)} %</div></div>${alc ? UI.botonAccion('solicitar_fondos_ue', { id: c.id }, 'Solicitar', 'chico') : ''}</div>`).join('') || '<div class="vacio" style="padding:10px">No hay convocatorias abiertas.</div>'}</div></div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Tu partido y las alcaldías</h3></div><div class="tenue" style="font-size:13px;line-height:1.6">${esc(E.partidos[J.partido].nombre)} gobierna <b>${nuestros}</b> de los municipios simulados. Cuantas más alcaldías, más pesan los <b>barones</b> en las decisiones internas del partido; un alcalde con buena aprobación refuerza su posición.</div></div>`;
    }
  };
})(window.ESP);

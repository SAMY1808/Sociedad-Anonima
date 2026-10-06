/* Justicia y contrapesos: CGPJ, Tribunal Constitucional, Fiscal General y causas judiciales. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const barra = (a, b, ca, cb, la, lb) => `<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;font-size:11px;font-weight:600"><div style="flex:${a};background:${ca};display:flex;align-items:center;justify-content:center;color:#fff">${la} ${a}</div><div style="flex:${b};background:${cb};display:flex;align-items:center;justify-content:center;color:#fff">${lb} ${b}</div></div>`;

  C.Pantallas.justicia = {
    render(el) {
      const E = C.E, Jx = C.Justicia, jt = Jx.asegurar(E), J = E.jugador, g = E.paises.ES.gob, tc = Jx.tc(E), cg = jt.cgpj;
      const pm = g.pm === 'J', abiertas = jt.causas.filter(c => c.fase !== 'cerrada'), cerradas = jt.causas.filter(c => c.fase === 'cerrada');
      const vigor = (E.esp.vigor || []).filter(v => v.estado === 'activa' && !E.esp.tc.recursos.some(r => r.tpl === v.tpl)).slice(0, 6);
      const oposicion = !g.coalicion.includes(J.partido);
      let h = `<div class="cab"><div><h1>⚖️ Justicia y contrapesos</h1><div class="sub">Independencia judicial ${Math.round(jt.indep)} / 100</div></div></div>`;
      const mia = jt.causas.find(c => c.quien === 'J' && c.fase !== 'cerrada');
      if (mia) h += `<div class="tarjeta" style="border-color:var(--no)"><div class="t-cab"><h3>🚨 Causa judicial contra ti</h3><span class="etq rojo">${Jx.FASE_TXT[mia.fase]}</span></div><div style="font-size:13px">Investigación por <b>${esc(mia.delito)}</b>. Gravedad ${Math.round(mia.gravedad * 100)} %. ${mia.colabora ? 'Colaboras con la justicia.' : ''}</div></div>`;
      h += `<div class="cuadricula-2"><div class="tarjeta"><div class="t-cab"><h3>🏛 Consejo General del Poder Judicial</h3><span class="etq ${cg.caducado ? 'rojo' : 'verde'}">${cg.caducado ? 'Caducado' : 'Renovado'}</span></div>
        ${barra(cg.prog, cg.cons, '#C0392B', '#2E6BB5', 'Prog.', 'Cons.')}
        <div class="tenue" style="font-size:12px;margin:8px 0">${cg.caducado ? `Lleva ${Math.max(1, Math.round((E.fecha.t - cg.desde) / 52))} año(s) sin renovarse por falta de acuerdo entre bloques.` : 'Los vocales han sido renovados por acuerdo parlamentario.'}</div>
        ${cg.caducado ? UI.botonAccion('negociar_cgpj', {}, '⚖️ Negociar la renovación', 'chico prim') : ''}</div>
        <div class="tarjeta"><div class="t-cab"><h3>🏛 Tribunal Constitucional</h3><span class="etq">12 magistrados</span></div>
        ${barra(tc.prog, tc.cons, '#C0392B', '#2E6BB5', 'Prog.', 'Cons.')}
        <div class="tenue" style="font-size:12px;margin:8px 0">Recursos pendientes: <b>${E.esp.tc.recursos.length}</b> · Próxima renovación: ${U.fmtT(jt.tcRenov, true)}</div></div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>🕴 Fiscal General del Estado</h3><span class="etq ${jt.fiscal.indep > 60 ? 'verde' : 'amar'}">${jt.fiscal.indep > 60 ? 'Independiente' : 'Afín al Gobierno'}</span></div>
        <div style="font-size:13px">${esc(jt.fiscal.n)}${jt.fiscal.pid ? ' · propuesto por ' + esc(E.partidos[jt.fiscal.pid].sigla) : ''}</div>
        ${pm ? `<div class="fila" style="gap:6px;margin-top:8px">${UI.botonAccion('nombrar_fiscal', { perfil: 'independiente' }, '🧑‍⚖️ Nombrar independiente', 'chico')}${UI.botonAccion('nombrar_fiscal', { perfil: 'afin' }, '🤝 Nombrar afín', 'chico')}</div>` : ''}</div>`;
      if (oposicion && vigor.length) h += `<div class="tarjeta"><div class="t-cab"><h3>📜 Recurrir una ley ante el TC</h3></div><div class="lista">${vigor.map(v => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal;font-weight:500">${esc(v.t)}</b></div>${UI.botonAccion('recurrir_ley', { vigor: v.id }, 'Recurrir', 'chico')}</div>`).join('')}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>🗂 Causas abiertas en el sistema</h3><span class="etq">${abiertas.length}</span></div><div class="lista">${abiertas.map(c => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(c.nombre)}${c.quien === 'J' ? ' (tú)' : ''} · ${esc(c.delito)}</b><div class="tenue" style="font-size:11px">${esc(E.partidos[c.pid] ? E.partidos[c.pid].sigla : '')} · desde ${U.fmtT(c.t0, true)}</div></div><span class="etq ${c.fase === 'sentencia' ? 'rojo' : 'amar'}">${Jx.FASE_TXT[c.fase]}</span></div>`).join('') || '<div class="vacio" style="padding:10px">No hay causas abiertas.</div>'}</div></div>`;
      if (cerradas.length) h += `<div class="tarjeta"><div class="t-cab"><h3>Archivo de sentencias</h3></div><div class="lista">${cerradas.slice(0, 8).map(c => `<div class="it"><div class="cuerpo" style="flex:1"><b style="white-space:normal;font-weight:500">${esc(c.nombre)} · ${esc(c.delito)}</b></div><span class="etq ${c.resultado === 'condena' ? 'rojo' : 'verde'}">${c.resultado === 'condena' ? 'Condena' : 'Absolución'}</span></div>`).join('')}</div></div>`;
      el.innerHTML = h;
    }
  };
})(window.ESP);

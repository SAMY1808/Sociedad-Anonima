/* Gobierno: coalición, gabinete, economía y oposición. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.gobierno = {
    render(el, params) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais], g = P.gob, S = E.series, ec = P.ec;
      const tab = (params && params.tab) || E.ui.tabGob || 'coalicion';
      E.ui.tabGob = tab;
      const total = E.parl.miembros.length, maj = Math.floor(total / 2) + 1;
      const pm = E.politicos[g.pm];
      let cuerpo = '';
      if (tab === 'coalicion') {
        const socios = g.coalicion.map(k => ({ k, n: P.escanos[k] || 0 })).sort((a, b) => b.n - a.n);
        const sg = U.suma(socios.map(s => s.n));
        cuerpo = `<div class="grid g-dash"><div class="tarjeta"><h3>${esc(d.jefe)}</h3><div class="fila" style="gap:14px">${Comp.avatar(E, pm, 56)}<div><div style="font-size:20px;font-family:var(--display)">${esc(pm ? pm.n : '—')}${g.pm === 'J' ? ' <span class="etq oro">Tú</span>' : ''}</div><div class="tenue">${Comp.partido(E, g.partido, true)} · en el cargo desde ${U.fmtT(g.formado)}</div></div></div>
          <h3 style="margin:16px 0 8px">Coalición</h3>${G.apilada(socios.map(s => ({ etq: E.partidos[s.k].sigla, v: s.n, color: E.partidos[s.k].color })), { total, mayoria: maj, alto: 26, etiquetas: true })}
          <div class="tenue" style="font-size:12.5px;margin-top:6px">${sg} de ${total} escaños · mayoría ${maj} ${(g.apoyoExterno || []).length ? '· apoyo externo: ' + g.apoyoExterno.map(k => E.partidos[k].sigla).join(', ') : ''}</div>
          <div class="lista" style="margin-top:10px;font-size:13px">${socios.map(s => `<div class="it">${Comp.partido(E, s.k, true)}<span class="tenue" style="margin-left:auto">${s.n} esc. · líder ${esc((E.politicos[E.partidos[s.k].lider] || {}).n || '—')}</span></div>`).join('')}</div></div>
          <div class="col"><div class="tarjeta"><h3>Aprobación</h3><div class="fila" style="justify-content:space-around">${G.medidor(g.aprob, { tam: 150, etq: 'APRUEBA' })}${G.medidor(g.estab, { tam: 150, etq: 'ESTABILIDAD' })}</div>${G.linea([{ nombre: 'Aprobación', color: '#D9B45A', datos: (S.aprob || []).slice(-80) }], { alto: 120, min: 10, max: 80, unidad: ' %' })}</div>
          <div class="tarjeta"><h3>Tipo de Gobierno</h3><p style="margin:0;font-size:13.5px;color:var(--texto2)">${({ mono: 'Un solo partido controla el Ejecutivo.', mayoria: 'Coalición con mayoría parlamentaria: los socios negocian cada ley.', minoria: 'Gobierno en minoría: depende de apoyos puntuales y puede caer con facilidad.' })[g.tipo]}</p></div></div></div>`;
      } else if (tab === 'gabinete') {
        cuerpo = `<div class="tarjeta"><table class="tabla"><thead><tr><th>Ministerio</th><th>Titular</th><th>Partido</th><th>Perfil</th></tr></thead><tbody>
          <tr><td><b>${esc(d.jefe)}</b></td><td>${esc(pm ? pm.n : '—')}</td><td>${Comp.partido(E, g.partido)}</td><td class="tenue" style="font-size:12px">${pm ? Comp.ideoTxt(pm) : ''}</td></tr>
          ${D().ministerios.map(m => { const id = g.ministros[m.id], q = E.politicos[id]; return `<tr${id === 'J' ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${m.icono} ${esc(m.nombre)}</td><td>${q ? esc(q.n) : '<span class="tenue">vacante</span>'}${id === 'J' ? ' <span class="etq oro">Tú</span>' : ''}</td><td>${q ? Comp.partido(E, q.p) : ''}</td><td class="tenue" style="font-size:12px">${q ? Comp.ideoTxt(q) : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
      } else if (tab === 'economia') {
        const ser = (k, n, c, o) => `<div class="tarjeta"><div class="t-cab"><h3>${n}</h3><b class="num">${o.fmt(ec[k] != null ? ec[k] : 0)}</b></div>${G.linea([{ nombre: n, color: c, datos: (S[k] || []).slice(-90) }], Object.assign({ alto: 130, area: true }, o))}</div>`;
        cuerpo = `<div class="grid g2">${ser('crec', 'Crecimiento del PIB', '#6CC4F5', { fmt: v => U.d1(v) + ' %', unidad: ' %' })}${ser('paro', 'Desempleo', '#E0504A', { fmt: v => U.d1(v) + ' %', unidad: ' %' })}${ser('infl', 'Inflación', '#E8A33D', { fmt: v => U.d1(v) + ' %', unidad: ' %' })}${ser('deficit', 'Déficit público', '#A15BD1', { fmt: v => U.d1(v) + ' % PIB', unidad: ' %', ref: 3 })}${ser('deuda', 'Deuda pública', '#26B59A', { fmt: v => U.n(v) + ' % PIB', unidad: ' %', ref: 60 })}
          <div class="tarjeta"><h3>Reglas fiscales europeas</h3><p style="margin:0 0 8px;font-size:13px;color:var(--texto2)">El Pacto de Estabilidad fija un déficit máximo del 3 % y una deuda del 60 % del PIB.${P.estado === 'ue' ? '' : ' (Referencia: tu país no está sujeto a ellas todavía.)'}</p>${ec.pde ? '<div class="nota" style="border-color:var(--mal)">🔴 La Comisión mantiene un <b>procedimiento de déficit excesivo</b> abierto.</div>' : '<div class="nota">🟢 Sin procedimiento abierto.</div>'}
            <div class="lista" style="margin-top:8px;font-size:13px"><div class="it"><span class="tenue" style="width:120px">PIB</span><b>${U.eur(ec.pib)}</b></div><div class="it"><span class="tenue" style="width:120px">PIB per cápita</span><b>${U.n(ec.pib / d.pob)} mil €</b></div></div></div></div>`;
      } else {
        const op = P.partidos.filter(k => !g.coalicion.includes(k) && (P.escanos[k] || 0) > 0).sort((a, b) => P.escanos[b] - P.escanos[a]);
        cuerpo = `<div class="tarjeta"><table class="tabla"><thead><tr><th>Partido</th><th class="num">Escaños</th><th>Postura</th><th>Líder</th><th>Perfil</th></tr></thead><tbody>${op.map(k => { const p = E.partidos[k]; return `<tr><td>${Comp.partido(E, k, true)}</td><td class="num">${P.escanos[k]}</td><td>${Comp.postura(p.postura)}</td><td>${esc((E.politicos[p.lider] || {}).n || '—')}</td><td class="tenue" style="font-size:12px">${Comp.ideoTxt(p)}</td></tr>`; }).join('')}</tbody></table></div>`;
      }
      el.innerHTML = `<div class="cab"><div><h1>Gobierno</h1><div class="sub">${d.bandera} ${esc(d.nombre)} · ${esc(d.jefe)} ${esc(pm ? pm.n : '')}</div></div></div>
        <div class="tabs">${[['coalicion', 'Coalición'], ['gabinete', 'Gabinete'], ['economia', 'Economía'], ['oposicion', 'Oposición']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('gobierno', { tab: b.dataset.tab }));
    }
  };
})(window.EUROPA);

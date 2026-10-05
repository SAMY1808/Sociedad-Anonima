/* Mi ayuntamiento: indicadores urbanos, presupuesto, proyectos, pleno y gobierno municipal. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, Mu = () => C.Municipios;
  C.Pantallas = C.Pantallas || {};
  const col = v => v >= 62 ? 'var(--bien)' : v >= 42 ? 'var(--alerta)' : 'var(--mal)';

  C.Pantallas.ayuntamiento = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      let id = (params && params.id) || E.ui.idAyto || J.muni;
      if (!E.esp.muni.m[id]) id = J.muni && E.esp.muni.m[J.muni] ? J.muni : (J.region && Object.keys(E.esp.muni.m).find(k => E.esp.muni.m[k].ccaa === J.region)) || Object.keys(E.esp.muni.m)[0];
      E.ui.idAyto = id;
      const m = E.esp.muni.m[id], esAlc = m.pm === 'J';
      const tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1, gobEsc = U.suma(m.coal.map(k => m.esc[k] || 0));
      const rc = E.esp.ccaa[m.ccaa], alc = E.politicos[m.pm];
      const A = Mu().AREAS;
      const ind = Mu().indicesTxt(E, m);
      const conc = Object.keys(D().concejalias).map(a => { const per = C.Gabinete.persona(E, 'muni:' + id, a), cg = C.Gabinete.cargos(E, 'muni:' + id).find(x => x.id === a); return { a, per, r: C.Gabinete.rend(E, cg, per) }; });
      el.innerHTML = `<div class="cab"><div><h1>🏘 ${esc(m.nombre)}</h1><div class="sub">${U.n(m.pob)} mil habitantes · ${esc(D().ccaa[m.ccaa].nombre)} · alcalde/sa ${alc ? esc(alc.n) : '—'}${esAlc ? ' <span class="etq oro">Tú</span>' : ''} (${Comp.partido(E, m.alcalde)}) · próximas municipales ${U.fmtT(E.esp.muni.proxT, true)}</div></div>
        <div class="fila">${esAlc ? UI.botonAccion('proyecto_urbano', {}, '🏗 Proyecto urbano', 'prim') : ''}<button class="btn" data-gab="1">🧑‍💼 Gobierno municipal</button></div></div>
        <div class="grid g4"><div class="tarjeta">${G.medidor(m.aprob, { tam: 120, etq: 'APROBACIÓN' })}</div>
          <div class="tarjeta">${Comp.kpi('Deuda municipal', Math.round(m.deuda) + ' %', `<span class="${m.deuda > 90 ? 'mal' : m.deuda > 60 ? 'alerta' : 'bien'}">${m.deuda > 90 ? 'Muy alta' : m.deuda > 60 ? 'Elevada' : 'Sostenible'}</span>`)}<div class="tenue" style="font-size:12px;margin-top:6px">IBI y tasas: <b>${m.ibi > 0 ? '+' + m.ibi : m.ibi}</b> · fondos conseguidos: ${m.fondos}</div></div>
          <div class="tarjeta">${Comp.kpi('Pleno', gobEsc + ' / ' + tot, gobEsc >= may ? '<span class="bien">Mayoría de gobierno</span>' : `<span class="mal">Minoría: faltan ${may - gobEsc}</span>`)}<div class="chips" style="margin-top:6px">${m.coal.map(k => Comp.partido(E, k)).join(' ')}</div></div>
          <div class="tarjeta">${Comp.kpi('Tensión social', Math.round(m.tension), Comp.barraRango(m.tension, m.tension > 65 ? 'var(--mal)' : 'var(--alerta)'))}<div class="tenue" style="font-size:12px;margin-top:6px">Relación con la comunidad: ${Math.round(rc.relM)}</div></div></div>
        <div class="grid g-dash" style="margin-top:14px"><div class="col">
          <div class="tarjeta"><h3>Estado de la ciudad</h3>${G.barrasH(ind.map(i => ({ etq: esc(i.nombre), v: i.v, color: col(i.v) })), { max: 100, fmt: v => Math.round(v), anchoEtq: '150px' })}</div>
          <div class="tarjeta"><h3>Grandes obras en marcha</h3>${m.proyectos.length ? m.proyectos.map(p => { const pr = Mu().PROYECTOS[p.id], f = U.clamp((E.fecha.t - p.t0) / (p.fin - p.t0) * 100, 0, 100); return `<div style="margin-bottom:8px"><div class="fila" style="justify-content:space-between"><span>${pr.icono} <b>${esc(pr.nombre)}</b></span><span class="tenue">${Comp.semanasA(E, p.fin)}</span></div>${Comp.barraRango(f, '#E0B54A')}</div>`; }).join('') : '<div class="vacio">Ninguna obra en marcha.</div>'}</div>
          <div class="tarjeta"><h3>Últimos plenos</h3><div class="lista" style="font-size:12.5px">${m.pleno.length ? m.pleno.map(x => `<div class="it"><span class="tenue" style="width:80px">${U.fmtT(x.t, true)}</span><div class="cuerpo"><b style="white-space:normal">${esc(x.asunto)}</b><span>${x.ok ? '✔' : '✘'} ${esc(x.txt)}</span></div></div>`).join('') : '<div class="vacio">Sin votaciones recientes.</div>'}</div></div></div>
        <div class="col"><div class="tarjeta"><h3>Presupuesto por áreas</h3>${A.map(a => `<div class="fila" style="justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${D().concejalias[a].icono} ${esc(D().concejalias[a].nombre)}</span><span class="etq ${m.gasto[a] === 2 ? 'verde' : m.gasto[a] === 0 ? 'rojo' : ''}">${Mu().NOM_G[m.gasto[a]]}</span></div>`).join('')}
            ${esAlc ? `<div class="fila" style="margin-top:8px;gap:6px">${UI.botonAccion('politica_gasto', {}, '📊 Presupuesto', 'chico')}${UI.botonAccion('politica_ibi', {}, '🧾 IBI y tasas', 'chico')}${UI.botonAccion('fondos_municipales', {}, '🤲 Pedir fondos', 'chico')}</div>` : ''}</div>
          <div class="tarjeta"><h3>Gobierno municipal</h3><div class="lista" style="font-size:12.5px">${conc.map(c => `<div class="it"><span style="width:26px">${D().concejalias[c.a].icono}</span><div class="cuerpo"><b>${esc(D().concejalias[c.a].nombre)}</b><span>${c.per ? esc(c.per.n) + (c.per.id === 'J' ? ' (tú)' : '') : '—'}</span></div><span class="num" style="color:${col(c.r)}"><b>${c.r}</b></span></div>`).join('')}</div></div></div></div>`;
      UI.$$('[data-gab]', el).forEach(b => b.onclick = () => C.App.ir('gabinete', { key: 'muni:' + id }));
    }
  };
})(window.ESP);

/* Centro de mando. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.dashboard = {
    render(el) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais], S = E.series, ec = P.ec, g = P.gob;
      const total = E.parl.miembros.length, maj = Math.floor(total / 2) + 1;
      const sg = U.suma(g.coalicion.map(k => P.escanos[k] || 0)), sa = U.suma((g.apoyoExterno || []).map(k => P.escanos[k] || 0));
      const pm = E.politicos[g.pm];
      const pa = E.partidos[J.partido];
      const mios = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && ['registro', 'comision', 'pleno', 'pleno_pend'].includes(p.etapa));
      const noticias = E.noticias.filter(n => !n.pais || n.pais === J.pais || n.tipo === 'europa' || n.tipo === 'mundo').slice(0, 7);
      const encuesta = C.Opinion.encuesta(E, J.pais, 0.4);
      const orden = P.partidos.slice().sort((a, b) => encuesta[b] - encuesta[a]).slice(0, 6);
      const ue = E.ue, abiertos = C.UE.abiertos(E).slice(0, 3);
      const miembro = P.estado === 'ue';

      el.innerHTML = `
      <div class="cab"><div><h1>${d.bandera} Centro de mando</h1><div class="sub">${esc(C.Personaje.cargoTxt(E))} · ${Comp.partido(E, J.partido, true)} ${Comp.postura(pa.postura)}</div></div>
        <div class="fila"><button class="btn prim" data-ir="agenda">🎯 Agenda de la semana <span class="coste">${J.agenda.puntos} ◆</span></button></div></div>

      ${E.fecha.t < 14 && !E.ui.sinGuia ? `<div class="tarjeta" style="margin-bottom:14px;border-color:var(--oro)"><div class="t-cab"><h3>👋 Primeros pasos</h3><button class="btn chico fant" id="d-cerrar-guia">Ocultar</button></div>
        <div class="fila" style="gap:18px;font-size:13px;color:var(--texto2)"><span>1. Gasta tus <b>5 puntos</b> en la <a href="#" data-ir="agenda">Agenda</a> (discurso, bases, Bruselas…).</span><span>2. Pulsa <b>▶ Semana</b> para avanzar el tiempo (tecla N).</span><span>3. Cuando haya votaciones o decisiones, el juego se detiene y te pregunta.</span><span>4. Pulsa <b>?</b> arriba para ver la guía completa.</span></div></div>` : ''}
      <div class="grid g4">
        <div class="tarjeta clic" data-ir="gobierno"><div class="t-cab"><h3>Gobierno</h3>${Comp.delta(S.aprob, 8)}</div>
          <div class="fila" style="flex-wrap:nowrap;justify-content:space-between">${G.medidor(g.aprob, { tam: 120, etq: 'APRUEBA' })}<div style="min-width:0;flex:1"><div style="font-size:12.5px"><b>${esc(pm ? pm.n : '—')}</b><div class="tenue">${esc(d.jefe)}</div></div><div class="chips" style="margin-top:6px">${g.coalicion.map(k => Comp.partido(E, k)).join(' ')}</div>${P.pres ? `<div class="tenue" style="font-size:11.5px;margin-top:6px">🎖️ Presidente: <b style="color:var(--texto2)">${esc((E.politicos[P.pres.pol] || {}).n || '—')}</b> (${esc(E.partidos[P.pres.partido].sigla)})${P.flags.cohab ? ' · cohabitación' : ''}</div>` : ''}</div></div></div>
        <div class="tarjeta clic" data-ir="gobierno" data-tab="economia"><div class="t-cab"><h3>Economía</h3>${ec.pde ? '<span class="etq rojo">Déficit excesivo</span>' : ''}</div>
          <div class="kpi-fila">${Comp.kpi('Crecimiento', U.signo(ec.crec) + ' %', Comp.delta(S.crec, 12))}${G.sparkline((S.crec || []).slice(-52), '#6CC4F5', 100, 36)}</div>
          <div class="fila" style="margin-top:8px;gap:12px;font-size:12px"><span>Paro <b class="num">${U.d1(ec.paro)} %</b></span><span>Inflación <b class="num">${U.d1(ec.infl)} %</b></span><span>Deuda <b class="num">${U.n(ec.deuda)} %</b></span></div></div>
        <div class="tarjeta clic" data-ir="parlamento"><div class="t-cab"><h3>Parlamento</h3><span class="etq ${g.estab > 60 ? 'verde' : g.estab > 35 ? 'amar' : 'rojo'}"${UI.tt('Estabilidad de la coalición')}>Estabilidad ${Math.round(g.estab)} %</span></div>
          <div class="kpi-fila">${Comp.kpi('Escaños del Gobierno', `${sg}<small class="tenue" style="font-size:15px">/${total}</small>`, sg >= maj ? '<span class="bien">Mayoría</span>' : sg + sa >= maj ? '<span class="alerta">Con apoyo externo</span>' : `<span class="mal">Faltan ${maj - sg}</span>`)}</div>
          <div style="margin-top:8px">${G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyo externo', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: total - sg - sa, color: '#5E8DF0' }], { total, mayoria: maj, alto: 14 })}</div></div>
        <div class="tarjeta clic" data-ir="personaje"><div class="t-cab"><h3>Tu carrera</h3><span class="etq oro">${esc(D().rolesPartido[J.rol].nombre)}</span></div>
          ${[['Prestigio interno', J.prestigio, 'var(--oro)'], ['Popularidad', J.pop, '#6CC4F5'], ['Capital europeo', J.capEU, '#5E8DF0']].map(([n, v, c]) => `<div style="margin-bottom:7px"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">${n}</span><b class="num">${Math.round(v)}</b></div>${Comp.barraRango(v, c)}</div>`).join('')}</div>
      </div>

      <div class="grid g-dash" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>${esc(d.cam)}</h3><button class="btn chico fant" data-ir="parlamento">Ver más →</button></div>${H.parlamento(E, { altoMax: 320, mayoria: maj })}${H.leyendaPartidos(E, P.escanos)}</div>
        <div class="col">
          <div class="tarjeta"><div class="t-cab"><h3>Esta semana</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
            <div class="lista" style="font-size:13px">
              ${E.parl.pendienteVoto.length ? `<div class="it clic" data-ir="leyes"><span>🗳</span><div class="cuerpo"><b>${E.parl.pendienteVoto.length} votación(es) en el pleno</b><span>Requiere tu decisión</span></div></div>` : ''}
              ${mios.map(p => `<div class="it clic" data-ir="leyes"><span>📜</span><div class="cuerpo"><b>${esc(p.t)}</b><span>Tu proyecto · ${Comp.etapa(p.etapa)}</span></div></div>`).join('')}
              ${P.flags.campana ? '<div class="it clic" data-ir="elecciones"><span>📣</span><div class="cuerpo"><b>Estás en campaña electoral</b><span>Los mítines mueven votos</span></div></div>' : ''}
              ${miembro ? `<div class="it clic" data-ir="europa"><span>🇪🇺</span><div class="cuerpo"><b>Consejo Europeo en ${Comp.semanasA(E, ue.proxCumbre)}</b><span>${abiertos.length} expedientes abiertos en Bruselas</span></div></div>` : `<div class="it clic" data-ir="europa"><span>🇪🇺</span><div class="cuerpo"><b>${P.estado === 'candidato' ? 'Adhesión: ' + U.n(P.ue.progreso) + ' %' : 'Relación con la UE: ' + U.n(P.ue.rel) + ' / 100'}</b><span>${P.ue.congelada ? 'Proceso congelado' : 'Negociaciones en curso'}</span></div></div>`}
              ${!E.parl.pendienteVoto.length && !mios.length && !P.flags.campana ? '<div class="it"><span class="tenue">Sin urgencias. Dedica tus puntos a ganar prestigio y capital europeo.</span></div>' : ''}</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>Encuesta · ${esc(d.nombre)}</h3><button class="btn chico fant" data-ir="elecciones">Más →</button></div>
            ${G.barrasH(orden.map(k => ({ etq: Comp.partido(E, k), v: encuesta[k], color: E.partidos[k].color })), { max: Math.max(...orden.map(k => encuesta[k])) * 1.1, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' })}</div>
        </div></div>

      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Última hora</h3></div><div class="lista" style="font-size:13px">${noticias.map(n => `<div class="it"><span style="font-size:18px">${n.pais ? D().paises[n.pais].bandera : '🌍'}</span><div class="cuerpo"><b style="white-space:normal">${esc(n.texto)}</b><span>${U.fmtT(n.t, true)}</span></div></div>`).join('') || '<div class="vacio">Sin noticias</div>'}</div></div>
        <div class="tarjeta clic" data-ir="europa"><div class="t-cab"><h3>Parlamento Europeo</h3><span class="etq">${ue.comision.presidente.n}</span></div>${H.europeo(E, { altoMax: 240, centro: true })}
          <div class="leyenda">${D().ordenGrupos.filter(k => ue.pe.escanos[k]).map(k => `<span><i style="background:${D().grupos[k].color}"></i>${D().grupos[k].sigla} <b class="num">${ue.pe.escanos[k]}</b></span>`).join('')}</div></div>
      </div>`;
      UI.$$('[data-ir]', el).forEach(b => b.onclick = e => { e.preventDefault(); C.App.ir(b.dataset.ir, b.dataset.tab ? { tab: b.dataset.tab } : null); });
      const gg = UI.$('#d-cerrar-guia', el); if (gg) gg.onclick = () => { E.ui.sinGuia = true; C.App.refrescar(); };
    }
  };
})(window.EUROPA);

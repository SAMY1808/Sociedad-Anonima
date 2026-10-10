/* Centro de mando. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.dashboard = {
    /* Tarjeta con tu foco: qué decides tú y qué sigue por su cuenta. */
    foco(E) {
      const f = C.Foco && C.Foco.info(E); if (!f) return '';
      const ic = { central: '🇪🇸', aut: '🗺', local: '🏘' }[f.ambito];
      return `<div class="tarjeta" style="margin-bottom:14px"><div class="t-cab"><h3>${ic} ${esc(f.titulo)}</h3><span class="etq oro">${esc(f.cargo)}</span></div><div style="font-size:13px">${esc(f.texto)}</div><div class="tenue" style="font-size:12px;margin-top:6px">${esc(f.auto)} <a href="#" data-ir="ajustes">Cambiar el enfoque</a></div></div>`;
    },
    contexto(E) {
      const P = E.paises.ES, g = P.gob, S = E.series, ec = P.ec, pm = E.politicos[g.pm];
      return `<div class="tarjeta"><div class="t-cab"><h3>🇪🇸 España, de fondo</h3><span class="etq">Gobierno ${C.Comp.partido(E, g.partido)}</span></div><div class="fila" style="gap:14px;font-size:12.5px;flex-wrap:wrap"><span>${esc(pm ? pm.n : '—')}</span><span>Aprobación <b class="num">${Math.round(g.aprob)}</b></span><span>Crecimiento <b class="num">${U.signo(ec.crec)} %</b></span><span>Paro <b class="num">${U.d1(ec.paro)} %</b></span><span>Inflación <b class="num">${U.d1(ec.infl)} %</b></span></div></div>`;
    },
    cierre(el) {
      UI.$$('[data-ir]', el).forEach(b => b.onclick = e => { e.preventDefault(); C.App.ir(b.dataset.ir, b.dataset.tab ? { tab: b.dataset.tab } : null); });
      const gg = UI.$('#d-cerrar-guia', el); if (gg) gg.onclick = () => { C.E.ui.sinGuia = true; C.App.refrescar(); };
    },
    noticias(E) {
      const ns = E.noticias.filter(n => (!n.pais || n.pais === 'ES' || n.tipo === 'europa') && (!C.Foco || C.Foco.noticia(E, n))).slice(0, 8);
      return `<div class="tarjeta"><div class="t-cab"><h3>Última hora</h3></div><div class="lista" style="font-size:13px">${ns.map(n => `<div class="it"><span style="font-size:18px">${n.pais === 'ES' ? '🇪🇸' : n.pais && D().paises[n.pais] ? D().paises[n.pais].bandera : '🌍'}</span><div class="cuerpo"><b style="white-space:normal">${esc(n.texto)}</b><span>${U.fmtT(n.t, true)}</span></div></div>`).join('') || '<div class="vacio">Sin noticias</div>'}</div></div>`;
    },
    carrera(E) {
      const J = E.jugador;
      return `<div class="tarjeta clic" data-ir="personaje"><div class="t-cab"><h3>Tu carrera</h3><span class="etq oro">${esc(D().rolesPartido[J.rol].nombre)}</span></div>${[['Prestigio interno', J.prestigio, 'var(--oro)'], ['Popularidad', J.pop, '#6CC4F5']].map(([n, v]) => `<div style="margin-bottom:7px"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">${n}</span><b class="num">${Math.round(v)}</b></div>${Comp.barraRango(v, n === 'Popularidad' ? '#6CC4F5' : 'var(--oro)')}</div>`).join('')}${J.aspira ? `<div class="nota" style="margin-top:8px;font-size:12.5px">🗳️ <b>Candidatura:</b> ${esc(C.Personaje.aspiraTxt(E))}</div>` : ''}</div>`;
    },
    bloques(E, e) { return Object.keys(e).filter(k => e[k] && E.partidos[k]).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).map(k => ({ n: e[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${e[k]}</b></div>` })); },
    cabecera(E, ic, titulo) {
      const J = E.jugador, pa = E.partidos[J.partido];
      return `<div class="cab"><div><h1>${ic} ${titulo}</h1><div class="sub">${esc(C.Personaje.cargoTxt(E))} · ${Comp.partido(E, J.partido, true)} ${Comp.postura(pa.postura)}</div></div><div class="fila"><button class="btn prim" data-ir="agenda">🎯 Agenda de la semana <span class="coste">${J.agenda.puntos} ◆</span></button></div></div>`;
    },
    /* Centro de mando de un cargo autonómico: tu comunidad por delante. */
    renderAut(el) {
      const E = C.E, J = E.jugador, c = J.region, rc = E.esp.ccaa[c], d = D().ccaa[c], g = rc.gob, DB = C.Pantallas.dashboard, H2 = C.Hemiciclo, T = C.Territorio;
      const tot = U.suma(Object.values(rc.parl.escanos)), may = Math.floor(tot / 2) + 1, sg = g ? U.suma(g.coalicion.map(k => rc.parl.escanos[k] || 0)) : 0, sa = g ? U.suma((g.apoyoExterno || []).map(k => rc.parl.escanos[k] || 0)) : 0;
      const pres = g && g.pres === 'J' ? { n: J.nombre } : g && E.politicos[g.pres];
      const camp = C.Campana.activa(E), votoAut = E.esp.pendienteVotoAut, dis = T.disuelto ? T.disuelto(E, c) : false;
      el.innerHTML = `${DB.cabecera(E, '🗺', 'Centro de mando · ' + esc(d.nombre))}${DB.foco(E)}
      <div class="grid g4">
        <div class="tarjeta clic" data-ir="${C.Foco.ejecutivo(E) ? 'consejo' : 'parlaut'}"><div class="t-cab"><h3>Gobierno autonómico</h3><span class="etq">${g ? esc(({ minoria: 'En minoría', mayoria: 'Mayoría', coalicion: 'Coalición' })[g.tipo] || g.tipo || '') : ''}</span></div>
          <div class="fila" style="flex-wrap:nowrap;justify-content:space-between">${G.medidor(g ? g.aprob : 50, { tam: 120, etq: 'APRUEBA' })}<div style="min-width:0;flex:1"><div style="font-size:12.5px"><b>${esc(pres ? pres.n : '—')}</b><div class="tenue">${g ? g.coalicion.map(k => Comp.partido(E, k)).join(' ') : ''}</div></div><div class="tenue" style="font-size:12px;margin-top:4px">Estabilidad <b class="num">${Math.round(g ? g.estab : 0)}</b></div></div></div></div>
        <div class="tarjeta clic" data-ir="parlaut"><div class="t-cab"><h3>Parlamento</h3><span class="etq ${sg >= may ? 'verde' : 'amar'}">${sg + sa}/${tot}</span></div>${Comp.kpi('Bloque del Gobierno', `${sg + sa}<small class="tenue" style="font-size:15px">/${tot}</small>`, sg >= may ? '<span class="bien">Mayoría propia</span>' : `<span class="tenue">mayoría: ${may}</span>`)}<div style="margin-top:8px">${G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyos', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: Math.max(0, tot - sg - sa), color: '#5E8DF0' }], { alto: 10 })}</div><div class="tenue" style="font-size:11.5px;margin-top:6px">${dis ? 'Parlamento disuelto' : 'Elecciones autonómicas: ' + U.fmtT(rc.parl.proxT, true)}</div></div>
        <div class="tarjeta clic" data-ir="territorio" data-tab="competencias"><div class="t-cab"><h3>Relación con el Estado</h3></div>${[['Relación con Moncloa', rc.relM, rc.relM > 55 ? 'var(--bien)' : rc.relM > 30 ? 'var(--alerta)' : 'var(--mal)'], ['Autogobierno', rc.aut, '#6CC4F5'], ['Deuda', rc.deuda * 2, '#9AA7C0']].map(([n, v, col]) => `<div style="margin-bottom:7px"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">${n}</span><b class="num">${Math.round(v)}</b></div>${Comp.barraRango(Math.min(100, v), col)}</div>`).join('')}${rc.indep > 3 ? `<div class="tenue" style="font-size:12px">Independentismo <b class="num">${U.d1(rc.indep)} %</b></div>` : ''}</div>
        ${DB.carrera(E)}
      </div>
      <div class="grid g-dash" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Parlamento de ${esc(d.nombre)}</h3><button class="btn chico fant" data-ir="parlaut">Ver más →</button></div>${H2.bloques(DB.bloques(E, rc.parl.escanos), { altoMax: 300, mayoria: may, centroSub: 'ESCAÑOS · MAYORÍA ' + may })}${H2.leyendaPartidos ? H2.leyendaPartidos(E, rc.parl.escanos) : ''}</div>
        <div class="col">
          <div class="tarjeta"><div class="t-cab"><h3>Esta semana</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div><div class="lista" style="font-size:13px">
            ${votoAut ? `<div class="it clic" data-ir="parlaut"><span>🗳</span><div class="cuerpo"><b>Votación en el parlamento autonómico</b><span>Requiere tu decisión</span></div></div>` : ''}
            ${camp ? C.Pantallas.campana.resumen(E) : ''}
            <div class="it clic" data-ir="parlaut"><span>🏛</span><div class="cuerpo"><b>Parlamento autonómico</b><span>Leyes, decretos-ley y votaciones de tu comunidad</span></div></div>
            <div class="it clic" data-ir="territorio" data-tab="financiacion"><span>💶</span><div class="cuerpo"><b>Financiación y competencias</b><span>Tu negociación con el Estado</span></div></div>
            ${!votoAut && !camp ? '<div class="it"><span class="tenue">Sin urgencias. Dedica tus puntos a tu comunidad y a tu carrera.</span></div>' : ''}</div></div>
          ${DB.contexto(E)}
        </div></div>
      <div style="margin-top:14px">${DB.noticias(E)}</div>`;
      DB.cierre(el);
    },
    /* Centro de mando de un cargo municipal: tu ciudad por delante. */
    renderLocal(el) {
      const E = C.E, J = E.jugador, m = E.esp.muni.m[J.muni], DB = C.Pantallas.dashboard, H2 = C.Hemiciclo; if (!m) return DB.renderCentral(el);
      const tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1, sg = U.suma(m.coal.map(k => m.esc[k] || 0)), alc = E.politicos[m.pm], esAlc = m.pm === 'J', rc = E.esp.ccaa[m.ccaa];
      const proy = (m.proyectos || []).length;
      el.innerHTML = `${DB.cabecera(E, '🏘', 'Centro de mando · ' + esc(m.nombre))}${DB.foco(E)}
      <div class="grid g4">
        <div class="tarjeta clic" data-ir="ayuntamiento"><div class="t-cab"><h3>Alcaldía</h3><span class="etq">${Comp.partido(E, m.alcalde)}</span></div><div class="fila" style="flex-wrap:nowrap;justify-content:space-between">${G.medidor(m.aprob, { tam: 120, etq: 'APRUEBA' })}<div style="min-width:0;flex:1"><div style="font-size:12.5px"><b>${esc(esAlc ? J.nombre : alc ? alc.n : '—')}</b>${esAlc ? ' <span class="etq oro">Tú</span>' : ''}<div class="tenue">${U.n(m.pob)} mil habitantes</div></div></div></div></div>
        <div class="tarjeta clic" data-ir="ayuntamiento"><div class="t-cab"><h3>Pleno</h3><span class="etq ${sg >= may ? 'verde' : 'amar'}">${sg}/${tot}</span></div>${Comp.kpi('Gobierno municipal', `${sg}<small class="tenue" style="font-size:15px">/${tot}</small>`, sg >= may ? '<span class="bien">Mayoría propia</span>' : `<span class="tenue">mayoría: ${may}</span>`)}<div class="tenue" style="font-size:11.5px;margin-top:6px">Municipales: ${U.fmtT(E.esp.muni.proxT, true)}</div></div>
        <div class="tarjeta clic" data-ir="local2"><div class="t-cab"><h3>La ciudad</h3></div>${[['Deuda municipal', Math.min(100, m.deuda * 2), '#9AA7C0'], ['Tensión social', m.tension, m.tension > 60 ? 'var(--mal)' : m.tension > 35 ? 'var(--alerta)' : 'var(--bien)']].map(([n, v, col]) => `<div style="margin-bottom:7px"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">${n}</span><b class="num">${Math.round(v)}</b></div>${Comp.barraRango(v, col)}</div>`).join('')}</div>
        ${DB.carrera(E)}
      </div>
      <div class="grid g-dash" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Pleno de ${esc(m.nombre)}</h3><button class="btn chico fant" data-ir="ayuntamiento">Ver más →</button></div>${H2.bloques(DB.bloques(E, m.esc), { altoMax: 300, mayoria: may, centroSub: 'CONCEJALES · MAYORÍA ' + may })}${H2.leyendaPartidos ? H2.leyendaPartidos(E, m.esc) : ''}</div>
        <div class="col">
          <div class="tarjeta"><div class="t-cab"><h3>Esta semana</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div><div class="lista" style="font-size:13px">
            ${esAlc ? `<div class="it clic" data-ir="ayuntamiento"><span>🏗</span><div class="cuerpo"><b>${proy ? proy + ' proyecto(s) urbano(s) en marcha' : 'Sin proyectos urbanos en marcha'}</b><span>Decides como alcalde/sa</span></div></div>` : ''}
            <div class="it clic" data-ir="ayuntamiento"><span>🏘</span><div class="cuerpo"><b>Plenos, ordenanzas y presupuesto</b><span>El día a día de tu ayuntamiento</span></div></div>
            <div class="it clic" data-ir="local2"><span>🤝</span><div class="cuerpo"><b>Poder local</b><span>Pactos, fondos y relación con la comunidad</span></div></div>
            ${E.esp.pendienteVotoAut ? '' : ''}</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>${esc(D().ccaa[m.ccaa].nombre)} y España, de fondo</h3></div><div class="fila" style="gap:14px;font-size:12.5px;flex-wrap:wrap"><span>Comunidad: gobierno ${rc && rc.gob ? Comp.partido(E, rc.gob.partido) : '—'}</span><span>Gobierno de España: ${Comp.partido(E, E.paises.ES.gob.partido)} · aprob. <b class="num">${Math.round(E.paises.ES.gob.aprob)}</b></span></div></div>
        </div></div>
      <div style="margin-top:14px">${DB.noticias(E)}</div>`;
      DB.cierre(el);
    },
    render(el) {
      const E0 = C.E, am = C.Foco && C.Foco.ambito(E0), DB = C.Pantallas.dashboard;
      if (am === 'aut' && E0.jugador.region && E0.esp.ccaa[E0.jugador.region]) return DB.renderAut(el);
      if (am === 'local' && E0.jugador.muni && E0.esp.muni.m[E0.jugador.muni]) return DB.renderLocal(el);
      return DB.renderCentral(el);
    },
    renderCentral(el) {
      const E = C.E, J = E.jugador, P = E.paises.ES, S = E.series, ec = P.ec, g = P.gob, cs = E.esp.cortes;
      const total = E.parl.miembros.length, maj = 176;
      const sg = U.suma(g.coalicion.map(k => P.escanos[k] || 0)), sa = U.suma((g.apoyoExterno || []).map(k => P.escanos[k] || 0));
      const pm = E.politicos[g.pm];
      const pa = E.partidos[J.partido];
      const mios = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && C.Congreso.ABIERTAS.includes(p.etapa));
      const noticias = E.noticias.filter(n => (!n.pais || n.pais === 'ES' || n.tipo === 'europa') && (!C.Foco || C.Foco.noticia(E, n))).slice(0, 7);
      const encuesta = C.Generales.encuesta(E, 0.5);
      const orden = P.partidos.slice().sort((a, b) => encuesta[b] - encuesta[a]).slice(0, 7);
      const ue = E.ue, abiertos = C.UE.abiertos(E).slice(0, 3);
      const rc = J.region && E.esp.ccaa[J.region], mu = J.muni && E.esp.muni.m[J.muni];
      const T = C.Territorio;
      const cargoEstado = { activa: 'Legislatura en curso', disueltas: 'Cortes disueltas · campaña', constitucion: 'Constitución de las Cortes', consultas: 'Consultas del Rey', investidura: 'Debate de investidura' }[cs.estado];

      el.innerHTML = `
      <div class="cab"><div><h1>🇪🇸 Centro de mando</h1><div class="sub">${esc(C.Personaje.cargoTxt(E))} · ${Comp.partido(E, J.partido, true)} ${Comp.postura(pa.postura)}</div></div>
        <div class="fila"><button class="btn prim" data-ir="agenda">🎯 Agenda de la semana <span class="coste">${J.agenda.puntos} ◆</span></button></div></div>

      ${C.Pantallas.dashboard.foco(E)}

      ${E.fecha.t < 14 && !E.ui.sinGuia ? `<div class="tarjeta" style="margin-bottom:14px;border-color:var(--oro)"><div class="t-cab"><h3>👋 Primeros pasos</h3><button class="btn chico fant" id="d-cerrar-guia">Ocultar</button></div>
        <div class="fila" style="gap:18px;font-size:13px;color:var(--texto2)"><span>1. Gasta tus <b>${J.agenda.max} puntos</b> en la <a href="#" data-ir="agenda">Agenda</a>.</span><span>2. Pulsa <b>▶ Semana</b> para avanzar el tiempo (tecla N).</span><span>3. Cuando haya votaciones, Consejo de Ministros, investiduras o decisiones, el juego se detiene.</span><span>4. Pulsa <b>?</b> arriba (en el móvil: <b>Más → Cómo se juega</b>) para ver la guía.</span></div></div>` : ''}
      <div class="grid g4">
        <div class="tarjeta clic" data-ir="consejo"><div class="t-cab"><h3>Gobierno</h3>${Comp.delta(S.aprob, 8)}</div>
          <div class="fila" style="flex-wrap:nowrap;justify-content:space-between">${G.medidor(g.aprob, { tam: 120, etq: 'APRUEBA' })}<div style="min-width:0;flex:1"><div style="font-size:12.5px"><b>${esc(pm ? pm.n : '—')}</b><div class="tenue">Presidente/a del Gobierno</div></div><div class="chips" style="margin-top:6px">${g.coalicion.map(k => Comp.partido(E, k)).join(' ')}</div>${(g.apoyoExterno || []).length ? `<div class="tenue" style="font-size:11.5px;margin-top:4px">Apoyo: ${g.apoyoExterno.map(k => Comp.partido(E, k)).join(' ')}</div>` : ''}</div></div></div>
        <div class="tarjeta clic" data-ir="consejo" data-tab="economia"><div class="t-cab"><h3>Economía</h3>${ec.pde ? '<span class="etq rojo">Déficit excesivo</span>' : ''}</div>
          <div class="kpi-fila">${Comp.kpi('Crecimiento', U.signo(ec.crec) + ' %', Comp.delta(S.crec, 12))}${G.sparkline((S.crec || []).slice(-52), '#6CC4F5', 100, 36)}</div>
          <div class="fila" style="margin-top:8px;gap:12px;font-size:12px"><span>Paro <b class="num">${U.d1(ec.paro)} %</b></span><span>Inflación <b class="num">${U.d1(ec.infl)} %</b></span><span>Deuda <b class="num">${U.n(ec.deuda)} %</b></span></div></div>
        <div class="tarjeta clic" data-ir="cortes"><div class="t-cab"><h3>Cortes</h3><span class="etq ${g.estab > 60 ? 'verde' : g.estab > 35 ? 'amar' : 'rojo'}"${UI.tt('Estabilidad de la mayoría de gobierno')}>Estabilidad ${Math.round(g.estab)} %</span></div>
          <div class="kpi-fila">${Comp.kpi('Bloque del Gobierno', `${sg + sa}<small class="tenue" style="font-size:15px">/${total}</small>`, sg >= maj ? '<span class="bien">Mayoría propia</span>' : sg + sa >= maj ? '<span class="alerta">Con apoyos</span>' : `<span class="mal">Faltan ${maj - sg - sa}</span>`)}</div>
          <div style="margin-top:8px">${G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyos', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: total - sg - sa, color: '#5E8DF0' }], { total, mayoria: maj, alto: 14 })}</div>
          <div class="tenue" style="font-size:11.5px;margin-top:6px">${cargoEstado}</div></div>
        <div class="tarjeta clic" data-ir="personaje"><div class="t-cab"><h3>Tu carrera</h3><span class="etq oro">${esc(D().rolesPartido[J.rol].nombre)}</span></div>
          ${[['Prestigio interno', J.prestigio, 'var(--oro)'], ['Popularidad', J.pop, '#6CC4F5'], ['Capital europeo', J.capEU, '#5E8DF0']].map(([n, v, c]) => `<div style="margin-bottom:7px"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">${n}</span><b class="num">${Math.round(v)}</b></div>${Comp.barraRango(v, c)}</div>`).join('')}${J.aspira ? `<div class="nota" style="margin-top:8px;font-size:12.5px">🗳️ <b>Candidatura:</b> ${esc(C.Personaje.aspiraTxt(E))}</div>` : ''}</div>
      </div>

      <div class="grid g-dash" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Congreso de los Diputados</h3><button class="btn chico fant" data-ir="cortes">Ver más →</button></div>${H.parlamento(E, { altoMax: 320, mayoria: maj })}${H.leyendaPartidos(E, P.escanos)}</div>
        <div class="col">
          <div class="tarjeta"><div class="t-cab"><h3>Esta semana</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
            <div class="lista" style="font-size:13px">
              ${E.parl.pendienteVoto.length ? `<div class="it clic" data-ir="leyes"><span>🗳</span><div class="cuerpo"><b>${E.parl.pendienteVoto.length} votación(es) en el pleno</b><span>Requiere tu decisión</span></div></div>` : ''}
              ${C.Consejo.pmEsJ(E) && E.esp.consejo.agenda.length ? `<div class="it clic" data-ir="consejo"><span>🦅</span><div class="cuerpo"><b>${E.esp.consejo.agenda.length} punto(s) en el Consejo de Ministros</b><span>Decides como presidente/a</span></div></div>` : ''}
              ${mios.map(p => `<div class="it clic" data-ir="leyes"><span>📜</span><div class="cuerpo"><b>${esc(p.t)}</b><span>Tu proyecto · ${Comp.etapa(p.etapa)}</span></div></div>`).join('')}
              ${C.Campana.activa(E) ? C.Pantallas.campana.resumen(E) : J.campania ? '<div class="it clic" data-ir="elecciones"><span>📣</span><div class="cuerpo"><b>Estás en campaña electoral</b><span>Los mítines mueven votos</span></div></div>' : ''}
              ${cs.estado === 'disueltas' ? `<div class="it clic" data-ir="elecciones"><span>🗳</span><div class="cuerpo"><b>Generales el ${U.fmtT(cs.proxT)}</b><span>Cortes disueltas</span></div></div>` : ''}
              <div class="it clic" data-ir="europa"><span>🇪🇺</span><div class="cuerpo"><b>Consejo Europeo en ${Comp.semanasA(E, ue.proxCumbre)}</b><span>${abiertos.length} expedientes abiertos en Bruselas</span></div></div>
              ${!E.parl.pendienteVoto.length && !mios.length && !J.campania && !C.Campana.activa(E) ? '<div class="it"><span class="tenue">Sin urgencias. Dedica tus puntos a ganar prestigio y apoyos.</span></div>' : ''}</div></div>
          <div class="tarjeta"><div class="t-cab"><h3>Encuesta estatal</h3><button class="btn chico fant" data-ir="elecciones">Más →</button></div>
            ${G.barrasH(orden.map(k => ({ etq: Comp.partido(E, k), v: encuesta[k], color: E.partidos[k].color })), { max: Math.max(...orden.map(k => encuesta[k])) * 1.1, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' })}</div>
        </div></div>

      ${(() => { const Im = C.Impacto, S = Im.asegurar(E), ind = Im.indicadores(E).slice().sort((a, b) => a.v - b.v); const peor = ind.slice(0, 3), mejor = ind.slice(-3).reverse(); const fila = x => `<div class="fila" style="gap:8px;font-size:12.5px"><span style="width:150px">${x.icono} ${esc(x.nombre)}</span><div style="flex:1">${Comp.barraRango(x.v, x.v >= 60 ? 'var(--bien)' : x.v >= 40 ? 'var(--oro)' : 'var(--mal)')}</div><b class="num" style="width:26px;text-align:right">${Math.round(x.v)}</b></div>`;
        const gr = Im.grupos(E).sort((a, b) => a.v - b.v); return `<div class="tarjeta clic" data-ir="leyes" data-tab="pais" style="margin-top:14px"><div class="t-cab"><h3>📊 Estado del país</h3><span class="fila" style="gap:6px"><span class="etq">👑 Apoyo a la Corona ${Math.round((E.esp.corona || { apoyo: 58 }).apoyo)} %</span><span class="etq ${S.clima >= 4 ? 'verde' : S.clima <= -4 ? 'rojo' : 'amar'}">Clima social ${U.signo(S.clima, 0)}</span></span></div>
          <div class="grid g2"><div class="col" style="gap:6px"><span class="tenue" style="font-size:11.5px;text-transform:uppercase;letter-spacing:.1em">Más débil</span>${peor.map(fila).join('')}</div><div class="col" style="gap:6px"><span class="tenue" style="font-size:11.5px;text-transform:uppercase;letter-spacing:.1em">Más fuerte</span>${mejor.map(fila).join('')}</div></div>
          <div class="tenue" style="font-size:12.5px;margin-top:8px">Colectivos más descontentos: ${gr.slice(0, 3).map(x => x.icono + ' ' + esc(x.nombre) + ' (' + Math.round(x.v) + ')').join(' · ')}. Las leyes que apruebas cambian estos indicadores.</div></div>`; })()}
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Territorio</h3><span class="etq">${T.ids().filter(c => E.esp.ccaa[c].gob && ['ES_UPC', 'ES_VAP'].includes(E.esp.ccaa[c].gob.partido)).length} comunidades de la derecha · ${T.ids().filter(c => E.esp.ccaa[c].gob && ['ES_ASD', 'ES_PPI', 'ES_APU'].includes(E.esp.ccaa[c].gob.partido)).length} de la izquierda</span></div>${C.Mosaico.provincias(E, 'autonomico', { altoMax: 230, region: J.region })}
          ${rc && !(C.Foco && C.Foco.activo(E)) ? `<div class="fila" style="margin-top:8px;gap:14px;font-size:12.5px"><span><b>${esc(D().ccaa[J.region].nombre)}</b></span><span>Gobierno ${Comp.partido(E, rc.gob.partido)}</span><span>Relación con Moncloa <b class="num">${Math.round(rc.relM)}</b></span><span>Independentismo <b class="num">${U.d1(rc.indep)} %</b></span>${mu ? `<span>${esc(mu.nombre)}: alcaldía ${Comp.partido(E, mu.alcalde)} · aprob. <b class="num">${Math.round(mu.aprob)}</b></span>` : ''}</div>` : ''}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Última hora</h3></div><div class="lista" style="font-size:13px">${noticias.map(n => `<div class="it"><span style="font-size:18px">${n.pais === 'ES' ? '🇪🇸' : n.pais && D().paises[n.pais] ? D().paises[n.pais].bandera : '🌍'}</span><div class="cuerpo"><b style="white-space:normal">${esc(n.texto)}</b><span>${U.fmtT(n.t, true)}</span></div></div>`).join('') || '<div class="vacio">Sin noticias</div>'}</div></div>
      </div>`;
      UI.$$('[data-ir]', el).forEach(b => b.onclick = e => { e.preventDefault(); C.App.ir(b.dataset.ir, b.dataset.tab ? { tab: b.dataset.tab } : null); });
      UI.$$('[data-ccaa]', el).forEach(g => g.onclick = e => { e.stopPropagation(); C.Pantallas.territorio.verCcaa(g.dataset.ccaa); });
      const gg = UI.$('#d-cerrar-guia', el); if (gg) gg.onclick = () => { E.ui.sinGuia = true; C.App.refrescar(); };
    }
  };
})(window.ESP);

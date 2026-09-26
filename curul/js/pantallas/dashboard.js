/* Centro de mando: la pantalla principal del político. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.dashboard = {
    render(el) {
      const E = C.E, J = E.jugador, S = E.series, Ev = E.economia;
      const capa = E.ui.capaDash || 'senado';
      const comS = C.Congreso.composicion(E, 'senado'), comC = C.Congreso.composicion(E, 'camara');
      const coalS = comS.porPostura.gobierno, coalC = comC.porPostura.gobierno;
      const esCong = !!J.camara;
      const pa = E.partidos[J.partido];
      const pres = E.gobierno.presidente === 'J' ? { nombre: J.nombre } : E.politicos[E.gobierno.presidente];
      const est = C.Gobierno.estabilidad(E);
      const prox = C.Elecciones.proxima(E);
      const od = E.congreso.ordenDia;
      const agenda = [];
      if (od && esCong) {
        const K = od[J.camara];
        for (const id of K.plenaria) agenda.push({ id, donde: 'Plenaria ' + C.Congreso.delCamara(J.camara) });
        for (const [n, ids] of Object.entries(K.comisiones)) if (+n === J.comision) ids.forEach(id => agenda.push({ id, donde: 'Tu comisión (' + C.DATA.comisiones[n - 1].nombre + ')' }));
      }
      for (const p of C.Legislacion.activos(E).filter(p => p.autor === 'J')) if (!agenda.some(a => a.id === p.id)) agenda.push({ id: p.id, donde: 'Tu proyecto · ' + (C.Legislacion.infoEtapa(p) || {}).nombre });
      const mapa = C.Mapa.svg(E, { capa, altoMax: 460, marcador: J.residencia });
      const misProy = Object.values(E.proyectos).filter(p => p.autor === 'J' || p.coautores.includes('J')).sort((a, b) => b.radicado - a.radicado).slice(0, 4);
      const quick = esCong ? [
        ['radicar', null, '📥 Radicar proyecto', 'abrirRadicar'], ['controlPolitico', { ministerio: 'hacienda' }, null, 'control'],
        ['entrevista', null, null, 'medios'], ['recorrer', { depto: J.residencia }, 'Recorrer ' + E.deptos[J.residencia].nombre]
      ] : [
        ['trabajar', {}, null], ['recorrer', { depto: J.residencia }, 'Recorrer ' + E.deptos[J.residencia].nombre],
        ['entrevista', null, null, 'medios'], ['inscribir', null, '🗳 Candidatura', 'elecciones']
      ];

      el.innerHTML = `
      <div class="cab"><div><h1>Centro de mando</h1><div class="sub">${esc(C.DATA.cargos[J.cargo].nombre)} · ${Comp.partido(E, J.partido, true)} ${pa ? Comp.postura(pa.postura) : ''} ${J.comision ? `<span class="etq">Comisión ${C.DATA.comisiones[J.comision - 1].nombre}</span>` : ''}</div></div>
        <div class="fila">${quick.map(q => q[3] ? `<button class="btn" data-quick="${q[3]}">${q[2] || (C.Acciones.get(q[0]).icono + ' ' + C.Acciones.get(q[0]).nombre)}</button>` : UI.botonAccion(q[0], q[1], q[2])).join('')}</div></div>

      <div class="grid g4">
        <div class="tarjeta clic" data-ir="gobierno"><div class="t-cab"><h3>Aprobación presidencial</h3>${Comp.delta(S.aprobacion, 4)}</div>
          <div class="fila" style="justify-content:space-between;flex-wrap:nowrap">${G.medidor(E.opinion.aprobacionPres, { tam: 128, etq: 'APRUEBA', tt: 'Aprobación de ' + esc(pres ? pres.nombre : '') })}<div style="flex:1;min-width:0">${G.sparkline(S.aprobacion.slice(-52), '#D9B45A', 130, 40)}<div class="tenue" style="font-size:11.5px">${esc(pres ? pres.nombre : '')}<br>${Comp.partido(E, E.gobierno.partido)}</div></div></div></div>
        <div class="tarjeta clic" data-ir="gobierno" data-tab="economia"><div class="t-cab"><h3>Economía</h3><span class="etq">${C.Economia.indice(E) > 55 ? 'Expansión' : C.Economia.indice(E) > 40 ? 'Estable' : 'Débil'}</span></div>
          <div class="kpi-fila">${Comp.kpi('Crecimiento', U.signo(Ev.crecimiento) + '%', Comp.delta(S['eco:crecimiento'], 12))}${G.sparkline((S['eco:crecimiento'] || []).slice(-52), '#6CC4F5', 100, 36)}</div>
          <div class="fila" style="margin-top:8px;gap:14px;font-size:12px"><span>Inflación <b class="num">${U.d1(Ev.inflacion)}%</b></span><span>Desempleo <b class="num">${U.d1(Ev.desempleo)}%</b></span><span>Déficit <b class="num">${U.d1(Ev.deficit)}%</b></span></div></div>
        <div class="tarjeta clic" data-ir="congreso" data-tab="composicion"><div class="t-cab"><h3>Congreso</h3><span class="etq ${est.total > 60 ? 'verde' : est.total > 40 ? 'amar' : 'rojo'}"${UI.tt('Estabilidad de la coalición de gobierno')}>Coalición ${Math.round(est.total)}%</span></div>
          <div class="kpi-fila">${Comp.kpi('Gobierno en Senado', `${coalS}<small class="tenue" style="font-size:15px">/${comS.total}</small>`, coalS >= comS.mayoria ? '<span class="bien">Mayoría</span>' : `<span class="mal">Faltan ${comS.mayoria - coalS}</span>`)}${Comp.kpi('Cámara', `${coalC}<small class="tenue" style="font-size:15px">/${comC.total}</small>`, coalC >= comC.mayoria ? '<span class="bien">Mayoría</span>' : `<span class="mal">Faltan ${comC.mayoria - coalC}</span>`)}</div>
          <div style="margin-top:8px">${G.apilada([{ etq: 'Gobierno', v: coalS, color: C.Hemiciclo.POSTURA.gobierno }, { etq: 'Independientes', v: comS.porPostura.independiente, color: C.Hemiciclo.POSTURA.independiente }, { etq: 'Oposición', v: comS.porPostura.oposicion, color: C.Hemiciclo.POSTURA.oposicion }], { mayoria: comS.mayoria, alto: 14 })}</div></div>
        <div class="tarjeta clic" data-ir="personaje"><div class="t-cab"><h3>Tu imagen</h3>${Comp.delta(S['jug:favorabilidad'], 4)}</div>
          <div class="kpi-fila">${Comp.kpi('Favorabilidad', U.n(J.popularidad) + '%')}${Comp.kpi('Reconocimiento', U.n(J.reconocimiento) + '%')}</div>
          <div class="fila" style="margin-top:6px;justify-content:space-between">${G.sparkline((S['jug:reconocimiento'] || []).slice(-52), '#D9B45A', 120, 30)}<span class="tenue" style="font-size:11.5px">Credibilidad <b>${U.n(J.credibilidad)}</b></span></div></div>
      </div>

      <div class="grid g-dash" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Mapa político</h3>${C.Mapa.selectorCapas(capa)}</div>
          <div class="mapa-dash" id="d-mapa">${mapa.svg}</div>${mapa.leyenda}</div>
        <div class="col">
          <div class="tarjeta"><div class="t-cab"><h3>Agenda de la semana</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max} puntos</span></div>
            <div class="lista">${agenda.length ? agenda.slice(0, 6).map(a => {
              const p = E.proyectos[a.id]; if (!p) return '';
              const pr = C.Legislacion.camaraDeEtapa(p) ? C.Legislacion.proyectar(E, p) : null;
              return `<div class="it clic" data-proy="${p.id}"><span style="font-size:18px">${C.DATA.sectores[p.sector].icono}</span><div class="cuerpo"><b>${esc(p.titulo)}</b><span>${esc(a.donde)}</span></div>${pr ? `<span class="etq ${pr.distancia <= 0 ? 'verde' : 'rojo'}"${UI.tt('Distancia de mayoría: votos que faltan según la proyección')}>${pr.distancia <= 0 ? 'Pasa +' + (-pr.distancia) : 'Faltan ' + pr.distancia}</span>` : ''}</div>`;
            }).join('') : `<div class="vacio">${esCong ? (C.Congreso.enSesion(E) ? 'Nada en tu orden del día esta semana.' : 'El Congreso está en receso.') : 'Sin agenda legislativa: trabaja tu base, los medios y tu partido.'}</div>`}</div>
            ${J.agenda.hechas.filter(h => h.t === E.fecha.t).length ? `<div class="hechas">${J.agenda.hechas.filter(h => h.t === E.fecha.t).map(h => `<span class="etq">✔ ${esc(h.txt)}</span>`).join('')}</div>` : ''}</div>
          <div class="tarjeta clic" data-ir="elecciones"><div class="t-cab"><h3>Próximas elecciones</h3>${E.elecciones.campana ? '<span class="etq oro">● En campaña</span>' : ''}</div>
            ${C.Elecciones.calendario(E, 4).slice(0, 3).map(ev => `<div class="fila" style="justify-content:space-between;padding:4px 0"><span>${esc(ev.nombre)}</span><span class="tenue num">${U.fmtFecha(ev.fecha, true)} · <b style="color:var(--texto)">${C.Elecciones.semanasPara(E, ev)} sem.</b></span></div>`).join('')}
            ${E.elecciones.campana ? (() => { const p = C.Elecciones.proyeccion(E, false); return `<div style="margin-top:8px">${G.barrasH([{ etq: 'Prob. de ganar', v: p.prob * 100, color: 'var(--oro)' }], { max: 100, fmt: v => U.n(v) + '%' })}</div>`; })() : ''}</div>
          <div class="tarjeta"><div class="t-cab"><h3>Tu partido</h3>${pa ? Comp.postura(pa.postura) : ''}</div>
            ${pa ? `<div class="fila" style="justify-content:space-between"><div>${Comp.partido(E, pa.id, true)}<div class="tenue" style="font-size:12px">«${esc(pa.lema)}»</div></div>${G.sparkline((S['pop:' + pa.id] || []).slice(-26), pa.color, 90, 30)}</div>
              <div class="fila" style="margin-top:8px;gap:16px;font-size:12.5px"><span>Intención <b>${U.d1(pa.popularidad)}%</b></span><span>Senado <b>${comS.porPartido[pa.id] || 0}</b></span><span>Cámara <b>${comC.porPartido[pa.id] || 0}</b></span><span>Relación ${Comp.relacion(pa.relJ)}</span></div>`
              : `<div class="vacio">No militas en ningún partido. <button class="btn chico" data-ir="partidos">Ver partidos</button></div>`}</div>
        </div>
      </div>

      <div class="grid g3" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Noticias</h3><button class="btn chico fant" data-ir="medios">Ver todo →</button></div>
          <div class="lista noticias">${E.medios.noticias.slice(0, 7).map(n => `<div class="it"><span class="tono ${n.tono > 0 ? 'pos' : n.tono < 0 ? 'neg' : ''}"></span><div class="cuerpo"><b style="white-space:normal">${esc(n.titular)}</b><span>${esc(C.Medios.medio(E, n.medio).nombre)} · ${U.fmtT(n.t)}</span></div></div>`).join('')}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Mis proyectos</h3><button class="btn chico fant" data-ir="proyectos">Ver todo →</button></div>
          ${misProy.length ? misProy.map(p => `<div class="mini-proy clic" data-proy="${p.id}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap"><b style="font-size:13px">${esc(p.titulo)}</b>${Comp.estadoProyecto(p)}</div>${Comp.tramite(E, p, true)}</div>`).join('') : `<div class="vacio">${esCong ? 'Aún no has radicado proyectos.<br><button class="btn chico prim" data-quick="abrirRadicar" style="margin-top:8px">📥 Radicar el primero</button>' : 'Sólo congresistas y el Gobierno radican proyectos.'}</div>`}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Actividad del Congreso</h3><button class="btn chico fant" data-ir="congreso" data-tab="actividad">Ver todo →</button></div>
          <div class="lista">${E.agendaMundo.slice(0, 7).map(a => `<div class="it ${a.ref && a.ref.proyecto ? 'clic' : ''}" ${a.ref && a.ref.proyecto ? `data-proy="${a.ref.proyecto}"` : ''}><span class="tenue num" style="font-size:11px;width:54px">${U.fmtT(a.t).replace(/ \d{4}$/, '')}</span><div class="cuerpo" style="font-size:12.5px">${esc(a.txt)}</div></div>`).join('')}</div></div>
      </div>`;

      const selCapa = UI.$('.sel-capa', el);
      selCapa.onchange = e => { E.ui.capaDash = e.target.value; C.App.refrescar(); };
      C.Mapa.enlazar(UI.$('#d-mapa', el), id => C.App.ir('mapa', { depto: id, capa }));
      UI.$$('[data-ir]', el).forEach(b => b.addEventListener('click', e => { if (e.target.closest('select,button:not([data-ir])')) return; e.stopPropagation(); C.App.ir(b.dataset.ir, b.dataset.tab ? { tab: b.dataset.tab } : null); }));
      UI.$$('[data-proy]', el).forEach(b => b.onclick = () => C.Pantallas.proyectos.expediente(b.dataset.proy));
      UI.$$('[data-quick]', el).forEach(b => b.onclick = () => {
        const q = b.dataset.quick;
        if (q === 'abrirRadicar') C.Pantallas.proyectos.radicar();
        if (q === 'control') C.App.ir('gobierno', { tab: 'oposicion' });
        if (q === 'medios') C.App.ir('medios');
        if (q === 'elecciones') C.App.ir('elecciones');
      });
    }
  };
})(window.CURUL);

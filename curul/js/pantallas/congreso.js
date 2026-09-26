/* Congreso visual: Senado, Cámara (hemiciclo y circunscripciones), composición y coaliciones,
   comisiones, orden del día y actividad legislativa. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const MODOS = [['partido', 'Partidos'], ['postura', 'Gobierno / oposición'], ['ideologia', 'Ideología'], ['relacion', 'Relación contigo'], ['comision', 'Comisiones']];
  const pidDe = (E, p) => p.id === 'J' ? (E.jugador.partido || 'IND') : (p.partido || 'IND');

  /* Cámara: mapa de circunscripciones con las curules de cada departamento */
  const mapaCircunscripciones = (E) => {
    const data = C.DATA.mapa;
    const miembros = C.Congreso.miembros(E, 'camara');
    let s = `<svg class="mapa-col" viewBox="${data.viewBox}" style="max-height:600px">`;
    s += `<rect x="6" y="18" width="72" height="150" rx="6" fill="none" stroke="#2c3e60" stroke-dasharray="3 3"/>`;
    for (const [id, g] of Object.entries(data.deptos)) s += `<path d="${g.d}" class="depto" fill="#15233a" data-depto="${id}"${UI.tt(esc(E.deptos[id].nombre) + ' · ' + E.deptos[id].camara + ' curules')}/>`;
    for (const [id, g] of Object.entries(data.deptos)) {
      const ms = H.ordenar(E, miembros.filter(p => (p.id === 'J' ? E.jugador.cargoInfo.circ : p.cargo && p.cargo.circ) === id));
      const n = ms.length, cols = Math.ceil(Math.sqrt(n * 1.6)), r = 5.2, paso = 11.5;
      const filas = Math.ceil(n / cols);
      ms.forEach((p, i) => {
        const cx = g.cx + ((i % cols) - (cols - 1) / 2) * paso, cy = g.cy + (Math.floor(i / cols) - (filas - 1) / 2) * paso;
        const pa = E.partidos[pidDe(E, p)];
        s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${pa ? pa.color : '#8C96A3'}" data-pol="${p.id}" class="curul" stroke="${p.id === 'J' ? '#FFF3C4' : '#0A111D'}" stroke-width="${p.id === 'J' ? 2.5 : 1}"/>`;
      });
    }
    s += '</svg>';
    const esp = miembros.filter(p => { const c = p.id === 'J' ? E.jugador.cargoInfo.circ : p.cargo && p.cargo.circ; return c && !E.deptos[c]; });
    const grupos = U.agrupar(esp, p => p.id === 'J' ? E.jugador.cargoInfo.circ : p.cargo.circ);
    return s + `<div class="especiales">${Object.entries(grupos).map(([c, ps]) => `<div class="esp"><span class="tenue">${esc(C.Congreso.nombreCirc(c))}</span><div class="curules-mini">${H.ordenar(E, ps).map(p => `<span class="curul-mini" data-pol="${p.id}" style="background:${E.partidos[pidDe(E, p)] ? E.partidos[pidDe(E, p)].color : '#8C96A3'}"></span>`).join('')}</div></div>`).join('')}</div>`;
  };

  const vistaCamara = (E, cam) => {
    const K = E.congreso[cam];
    const modo = E.ui.modoHemi || 'partido';
    const vista = E.ui.vistaCamara || 'hemiciclo';
    const miembros = C.Congreso.miembros(E, cam);
    const comp = C.Congreso.composicion(E, cam);
    const mesa = K.mesa || {};
    const bancadas = Object.entries(comp.porPartido).sort((a, b) => b[1] - a[1]);
    const filtro = (E.ui.filtroCong || '').toLowerCase();
    const lista = H.ordenar(E, miembros).filter(p => !filtro || p.nombre.toLowerCase().includes(filtro) || (E.partidos[pidDe(E, p)] || {}).sigla?.toLowerCase() === filtro);
    return `<div class="grid congreso-grid">
      <div class="tarjeta ${cam === 'senado' ? 'recinto-senado' : 'recinto-camara'}">
        <div class="t-cab"><h3>${cam === 'senado' ? 'Salón Elíptico · Senado de la República' : 'Recinto de la Cámara de Representantes'}</h3>
          <div class="fila">${cam === 'camara' ? `<div class="seg" id="c-vista"><button data-v="hemiciclo" class="${vista === 'hemiciclo' ? 'activo' : ''}">Hemiciclo</button><button data-v="mapa" class="${vista === 'mapa' ? 'activo' : ''}">Circunscripciones</button></div>` : ''}
          <select id="c-modo">${MODOS.map(([k, n]) => `<option value="${k}" ${k === modo ? 'selected' : ''}>Color: ${n}</option>`).join('')}</select></div></div>
        <div id="c-hemi" class="hemi-cont">${cam === 'camara' && vista === 'mapa' ? mapaCircunscripciones(E) : H.svg(E, cam, { modo })}</div>
        ${H.leyenda(E, cam, cam === 'camara' && vista === 'mapa' ? 'partido' : modo)}
        <div class="tenue" style="font-size:11.5px;margin-top:6px">Pasa el cursor sobre una curul para ver al congresista; haz clic para abrir su ficha. ${E.jugador.camara === cam ? 'Tu curul tiene borde dorado.' : ''}</div>
      </div>
      <div class="col">
        <div class="tarjeta"><h3>Mesa directiva ${C.Congreso.periodo(E).legislatura}</h3><div class="lista">
          ${[['presidente', 'Presidente'], ['vice1', 'Primer vicepresidente'], ['vice2', 'Segundo vicepresidente']].map(([k, n]) => { const p = E.politicos[mesa[k]]; return p ? `<div class="it clic" data-ficha="${p.id}">${Comp.avatar(E, p, 34)}<div class="cuerpo"><b>${esc(p.nombre)}</b><span>${n} · ${Comp.partido(E, p.partido)}</span></div></div>` : ''; }).join('')}</div></div>
        <div class="tarjeta"><h3>Bancadas</h3><div class="lista">${bancadas.map(([pid, n]) => {
          const pa = E.partidos[pid]; const b = K.bancadas[pid] || {}; const voc = E.politicos[b.vocero];
          return `<div class="it"><i class="pto" style="background:${pa ? pa.color : '#8C96A3'};width:12px;height:12px"></i><div class="cuerpo"><b>${esc(pa ? pa.nombre : pid)}</b><span>${voc ? 'Vocero: ' + esc(voc.nombre) : ''} ${pa ? '· cohesión ' + pa.cohesion : ''}</span></div>${pa ? Comp.postura(pa.postura) : ''}<b class="num" style="width:28px;text-align:right">${n}</b></div>`;
        }).join('')}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Directorio (${lista.length})</h3><input id="c-buscar" placeholder="Buscar nombre o sigla" value="${esc(E.ui.filtroCong || '')}" style="background:var(--panel);border:1px solid var(--borde2);border-radius:6px;padding:4px 8px;width:150px"></div>
          <div class="lista directorio">${lista.slice(0, 60).map(p => `<div class="it clic" data-ficha="${p.id}">${Comp.avatar(E, p, 28)}<div class="cuerpo"><b>${esc(p.nombre)}${p.id === 'J' ? ' (tú)' : ''}</b><span>${Comp.partido(E, pidDe(E, p))} · ${esc(C.Congreso.nombreCirc(p.id === 'J' ? E.jugador.cargoInfo.circ : p.cargo.circ))}</span></div>${p.id === 'J' ? '' : `<span class="num tenue" style="font-size:11px">${p.relJ > 20 ? '🤝' : p.relJ < -20 ? '⚔' : ''}</span>`}</div>`).join('')}</div></div>
      </div></div>`;
  };

  /* Coaliciones mínimas ganadoras ideológicamente conectadas */
  const alianzas = (E) => {
    const cs = C.Congreso.composicion(E, 'senado'), cc = C.Congreso.composicion(E, 'camara');
    const orden = C.Congreso.ordenPartidos(E).filter(p => (cs.porPartido[p] || 0) + (cc.porPartido[p] || 0) > 0);
    const res = [];
    for (let i = 0; i < orden.length; i++) {
      let s = 0, c = 0;
      for (let j = i; j < orden.length; j++) {
        s += cs.porPartido[orden[j]] || 0; c += cc.porPartido[orden[j]] || 0;
        if (s >= cs.mayoria && c >= cc.mayoria) { res.push({ partidos: orden.slice(i, j + 1), s, c }); break; }
      }
    }
    return res.sort((a, b) => a.partidos.length - b.partidos.length).slice(0, 4);
  };

  const vistaComposicion = (E) => {
    const est = C.Gobierno.estabilidad(E);
    const sel = E.ui.coalSim || E.gobierno.coalicion.slice();
    const bloque = cam => {
      const comp = C.Congreso.composicion(E, cam);
      const orden = C.Congreso.ordenPartidos(E).filter(p => comp.porPartido[p]);
      const sim = U.suma(sel.map(p => comp.porPartido[p] || 0));
      return `<div class="tarjeta"><div class="t-cab"><h3>${cam === 'senado' ? 'Senado' : 'Cámara'} · ${comp.total} curules · mayoría ${comp.mayoria}</h3></div>
        <div class="fila" style="gap:18px;align-items:center;flex-wrap:nowrap">
          ${G.dona(orden.map(p => ({ etq: E.partidos[p] ? E.partidos[p].nombre : p, v: comp.porPartido[p], color: E.partidos[p] ? E.partidos[p].color : '#8C96A3' })), { tam: 130, centro: comp.total, sub: 'curules' })}
          <div style="flex:1;min-width:0" class="col">
            <div class="tenue" style="font-size:11px">POR PARTIDO (izquierda → derecha)</div>
            ${G.apilada(orden.map(p => ({ etq: E.partidos[p] ? E.partidos[p].sigla : p, v: comp.porPartido[p], color: E.partidos[p] ? E.partidos[p].color : '#8C96A3' })), { mayoria: comp.mayoria, alto: 26 })}
            <div class="tenue" style="font-size:11px;margin-top:4px">GOBIERNO · INDEPENDIENTES · OPOSICIÓN</div>
            ${G.apilada([{ etq: 'Gobierno', v: comp.porPostura.gobierno, color: H.POSTURA.gobierno }, { etq: 'Independientes', v: comp.porPostura.independiente, color: H.POSTURA.independiente }, { etq: 'Oposición', v: comp.porPostura.oposicion, color: H.POSTURA.oposicion }], { mayoria: comp.mayoria, alto: 22, etiquetas: true })}
            <div class="fila" style="justify-content:space-between;margin-top:4px"><span>Tu coalición simulada: <b class="num">${sim}</b></span>${sim >= comp.mayoria ? `<span class="etq verde">Mayoría (+${sim - comp.mayoria})</span>` : `<span class="etq rojo">Faltan ${comp.mayoria - sim}</span>`}</div>
          </div></div>
        ${G.barrasH(orden.map(p => ({ etq: Comp.partido(E, p), v: comp.porPartido[p], color: E.partidos[p] ? E.partidos[p].color : '#8C96A3', tt: esc(E.partidos[p] ? E.partidos[p].nombre : p) })), { fmt: v => U.n(v), anchoEtq: '64px', grosor: 8 })}
      </div>`;
    };
    return `<div class="grid g2">${bloque('senado')}${bloque('camara')}</div>
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Simulador de coaliciones</h3><button class="btn chico" id="coal-reset">Coalición real</button></div>
          <div class="fila" id="coal-chips">${C.Congreso.ordenPartidos(E).filter(p => E.partidos[p] && !E.partidos[p].especial).map(p => `<button class="btn chico ${sel.includes(p) ? 'prim' : ''}" data-coal="${p}"><i class="pto" style="background:${E.partidos[p].color}"></i> ${esc(E.partidos[p].sigla)}</button>`).join('')}</div>
          <h3 style="margin-top:14px">Posibles alianzas mínimas ganadoras</h3>
          <div class="lista">${alianzas(E).map(a => `<div class="it clic" data-alianza="${a.partidos.join(',')}"><div class="cuerpo"><b>${a.partidos.map(p => E.partidos[p] ? E.partidos[p].sigla : p).join(' + ')}</b><span>Senado ${a.s} · Cámara ${a.c} · amplitud ideológica ${Math.round(U.distIdeo(E.partidos[a.partidos[0]] || { eco: 0, soc: 0 }, E.partidos[a.partidos[a.partidos.length - 1]] || { eco: 0, soc: 0 }) * 100)}</span></div></div>`).join('') || '<div class="vacio">Ninguna combinación contigua alcanza mayoría en ambas cámaras.</div>'}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Estabilidad de la coalición de gobierno</h3><span class="kpi"><span class="v" style="font-size:26px;color:${est.total > 60 ? 'var(--bien)' : est.total > 40 ? 'var(--alerta)' : 'var(--mal)'}">${Math.round(est.total)}%</span></span></div>
          <div class="tenue" style="font-size:12px;margin-bottom:8px">Qué la fortalece (verde) y qué la debilita (rojo):</div>
          ${est.factores.map(f => `<div class="factor"><span>${esc(f.n)}</span><div class="eje-div"><i style="${f.v >= 0 ? 'left:50%' : 'right:50%'};width:${Math.min(50, Math.abs(f.v) * 2)}%;background:${f.v >= 0 ? 'var(--bien)' : 'var(--mal)'}"></i></div><b class="num">${U.signo(f.v)}</b></div>`).join('')}
          <h3 style="margin-top:14px">Por partido</h3>
          ${G.barrasH(Object.entries(est.porPartido).map(([p, x]) => ({ etq: Comp.partido(E, p), v: x.s, color: x.s > 55 ? 'var(--bien)' : x.s > 35 ? 'var(--alerta)' : 'var(--mal)' })), { max: 100, fmt: v => U.n(v) + '%', anchoEtq: '64px' })}
          ${G.linea([{ nombre: 'Estabilidad', color: '#D9B45A', datos: E.series.coalicion || [] }], { alto: 110, min: 0, max: 100, unidad: '%' })}</div>
      </div>`;
  };

  const vistaComisiones = (E) => {
    const cam = E.ui.camCom || (E.jugador.camara || 'senado');
    const K = E.congreso[cam];
    const activos = C.Legislacion.activos(E);
    return `<div class="fila" style="margin-bottom:12px"><div class="seg" id="com-cam"><button data-c="senado" class="${cam === 'senado' ? 'activo' : ''}">Senado</button><button data-c="camara" class="${cam === 'camara' ? 'activo' : ''}">Cámara</button></div></div>
      <div class="grid g3">${C.DATA.comisiones.map(c => {
        const com = K.comisiones[c.n]; const ms = com.miembros.map(id => E.politicos[id]).filter(Boolean);
        const pres = E.politicos[com.presidente], vice = E.politicos[com.vice];
        const proy = activos.filter(p => p.comision === c.n && C.Legislacion.camaraDeEtapa(p) === cam && (C.Legislacion.infoEtapa(p) || {}).instancia === 'comision');
        const mia = E.jugador.camara === cam && E.jugador.comision === c.n;
        const cnt = U.contar(ms, p => pidDe(E, p));
        return `<div class="tarjeta ${mia ? 'mia' : ''}"><div class="t-cab"><h3>Comisión ${c.nombre}${mia ? ' · la tuya' : ''}</h3><span class="etq">${ms.length} miembros</span></div>
          <div class="tenue" style="font-size:12px;min-height:34px">${esc(c.tema)}</div>
          ${H.svg(E, cam, { miembros: ms, centroTxt: ms.length, centroSub: 'MIEMBROS', altoMax: 150, filas: 3 })}
          ${G.apilada(C.Congreso.ordenPartidos(E).filter(p => cnt[p]).map(p => ({ etq: E.partidos[p] ? E.partidos[p].sigla : p, v: cnt[p], color: E.partidos[p] ? E.partidos[p].color : '#8C96A3' })), { alto: 10, mayoria: Math.floor(ms.length / 2) + 1 })}
          <div class="lista" style="margin-top:6px">${pres ? `<div class="it clic" data-ficha="${pres.id}">${Comp.avatar(E, pres, 26)}<div class="cuerpo"><b>${esc(pres.nombre)}</b><span>Presidente · ${Comp.partido(E, pres.partido)}</span></div></div>` : ''}${vice ? `<div class="it clic" data-ficha="${vice.id}">${Comp.avatar(E, vice, 26)}<div class="cuerpo"><b>${esc(vice.nombre)}</b><span>Vicepresidente · ${Comp.partido(E, vice.partido)}</span></div></div>` : ''}</div>
          <div class="tenue" style="font-size:11px;margin-top:6px">PROYECTOS EN ESTUDIO (${proy.length})</div>
          <div class="lista">${proy.slice(0, 4).map(p => `<div class="it clic" data-proy="${p.id}"><div class="cuerpo"><b style="font-size:12.5px">${esc(p.titulo)}</b><span>${Comp.estadoProyecto(p)}</span></div></div>`).join('') || '<span class="tenue" style="font-size:12px">—</span>'}</div>
        </div>`;
      }).join('')}</div>`;
  };

  const vistaOrden = (E) => {
    const od = E.congreso.ordenDia;
    if (!od || !C.Congreso.enSesion(E)) return `<div class="tarjeta vacio">El Congreso está en receso. Las sesiones ordinarias van del 20 de julio al 16 de diciembre y del 16 de marzo al 20 de junio.</div>`;
    const filas = [];
    for (const cam of C.Congreso.CAMARAS) {
      for (const [n, ids] of Object.entries(od[cam].comisiones)) ids.forEach(id => filas.push({ id, cam, inst: 'comision', donde: `Comisión ${C.DATA.comisiones[n - 1].nombre} · ${C.Congreso.nombreCamara(cam)}`, mia: E.jugador.camara === cam && E.jugador.comision === +n }));
      od[cam].plenaria.forEach(id => filas.push({ id, cam, inst: 'plenaria', donde: 'Plenaria · ' + C.Congreso.nombreCamara(cam), mia: E.jugador.camara === cam }));
    }
    od.senado.conciliacion.forEach(id => filas.push({ id, cam: 'senado', inst: 'plenaria', donde: 'Conciliación · ambas plenarias', mia: !!E.jugador.camara }));
    od.objeciones.forEach(id => filas.push({ id, cam: 'senado', inst: 'plenaria', donde: 'Objeciones presidenciales · ambas plenarias', mia: !!E.jugador.camara }));
    filas.sort((a, b) => b.mia - a.mia);
    return `<p class="tenue" style="margin-top:0">Lo que se votará la próxima semana. Cabildea, negocia o fija tu voto antes de avanzar el tiempo.</p>
      <div class="col">${filas.map(f => {
        const p = E.proyectos[f.id]; if (!p) return '';
        const pr = C.Legislacion.proyectar(E, p, f.cam, f.inst);
        const pct = pr.si / Math.max(1, pr.si + pr.no) * 100;
        const miVoto = (E.jugador.votos || {})[p.id] || 'bancada';
        return `<div class="tarjeta orden ${f.mia ? 'mia' : ''}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start">
          <div style="min-width:0"><div class="tenue" style="font-size:11.5px">${esc(f.donde)} ${f.mia ? '<span class="etq oro">Votas tú</span>' : ''} ${p.gobierno ? '<span class="etq">Gobierno</span>' : ''} ${p.autor === 'J' ? '<span class="etq verde">Tu proyecto</span>' : ''}</div>
            <b class="clic" data-proy="${p.id}" style="font-size:15px;cursor:pointer">${esc(p.titulo)}</b><div class="tenue" style="font-size:12px">PL ${esc(p.numero)} · ${esc(C.Legislacion.nombreAutor(E, p))}</div></div>
          <div style="text-align:right;flex:none"><div class="kpi"><span class="v" style="font-size:22px;color:${pr.distancia <= 0 ? 'var(--bien)' : 'var(--mal)'}">${pr.distancia <= 0 ? 'Pasa' : 'Faltan ' + pr.distancia}</span><span class="l">Distancia de mayoría</span></div></div></div>
          <div class="proy-barra"${UI.tt(`Proyección: ${pr.si} sí · ${pr.no} no · ${pr.aus} ausencias esperadas · mayoría ${pr.req} (${pr.necesarios})`)}><i class="si" style="width:${pct}%"></i><i class="no" style="width:${100 - pct}%"></i><b style="left:${pr.necesarios / Math.max(1, pr.si + pr.no) * 100}%"></b></div>
          <div class="fila" style="justify-content:space-between;margin-top:8px"><span class="tenue" style="font-size:12px">${pr.si} a favor · ${pr.no} en contra (proyección)</span>
          ${f.mia ? `<div class="seg voto-sel" data-proyecto="${p.id}">${[['bancada', 'Según bancada'], ['si', '🟢 Sí'], ['no', '🔴 No'], ['abs', '🟡 Abst.'], ['aus', '⚪ Ausente']].map(([k, n]) => `<button data-v="${k}" class="${miVoto === k ? 'activo' : ''}">${n}</button>`).join('')}</div>` : ''}</div></div>`;
      }).join('') || '<div class="tarjeta vacio">No hay votaciones programadas para la próxima semana.</div>'}</div>`;
  };

  const vistaActividad = (E) => {
    const f = E.ui.filtroAct || 'todo';
    const tipos = { todo: 'Todo', votacion: 'Votaciones', ley: 'Leyes', radicacion: 'Radicaciones', control: 'Control político', coalicion: 'Coalición' };
    const items = E.agendaMundo.filter(a => f === 'todo' || a.tipo === f);
    const leg = E.congreso.legislatura;
    const proys = Object.values(E.proyectos);
    const semanas = Array.from({ length: 12 }, (_, i) => E.fecha.t - 11 + i);
    return `<div class="grid g4">
        ${Comp.kpi('Proyectos en trámite', C.Legislacion.activos(E).length)}${Comp.kpi('Leyes sancionadas', proys.filter(p => p.estado === 'ley').length)}${Comp.kpi('Proyectos archivados', proys.filter(p => p.estado === 'archivado').length)}${Comp.kpi('Votaciones nominales', E.votaciones.length)}</div>
      <div class="grid g2" style="margin-top:14px">
        <div class="tarjeta"><div class="t-cab"><h3>Bitácora del Congreso</h3><select id="act-f">${Object.entries(tipos).map(([k, n]) => `<option value="${k}" ${k === f ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="lista bitacora">${items.slice(0, 60).map(a => `<div class="it ${a.ref ? 'clic' : ''}" ${a.ref && a.ref.votacion ? `data-voto-ver="${a.ref.votacion}"` : a.ref && a.ref.proyecto ? `data-proy="${a.ref.proyecto}"` : ''}><span class="tenue num" style="font-size:11px;width:78px;flex:none">${U.fmtT(a.t)}</span><span>${{ votacion: '🗳', ley: '📜', radicacion: '📥', control: '🔥', coalicion: '🤝', mesa: '🔔', sesion: '🏛', instalacion: '🏛', gobierno: '🦅', curul: '💺' }[a.tipo] || '•'}</span><div class="cuerpo" style="font-size:12.5px">${esc(a.txt)}</div></div>`).join('') || '<div class="vacio">Sin actividad</div>'}</div></div>
        <div class="col">
          <div class="tarjeta"><h3>Votaciones por semana (últimas 12)</h3>${G.barrasV(semanas.map(t => ({ etq: U.fmtT(t).split(' ').slice(0, 2).join(' '), v: E.votaciones.filter(v => v.t === t).length, color: '#6f86b3' })), { alto: 150, valores: true, fmt: v => U.n(v) })}</div>
          <div class="tarjeta"><h3>Últimas votaciones</h3><div class="lista">${E.votaciones.slice(-12).reverse().map(v => { const p = E.proyectos[v.proyecto]; if (!p) return ''; return `<div class="it clic" data-voto-ver="${v.id}"><span>${v.resultado.aprobado ? '🟢' : '🔴'}</span><div class="cuerpo"><b style="font-size:12.5px">${esc(p.titulo)}</b><span>${v.instancia === 'comision' ? 'Comisión' : 'Plenaria'} · ${C.Congreso.nombreCamara(v.camara)} · ${v.resultado.si}-${v.resultado.no} · ${U.fmtT(v.t)}</span></div></div>`; }).join('') || '<div class="vacio">Aún no hay votaciones.</div>'}</div></div>
        </div></div>`;
  };

  C.Pantallas.congreso = {
    render(el, params) {
      const E = C.E;
      const tab = params.tab || E.ui.tabCong || (E.jugador.camara || 'senado');
      E.ui.tabCong = tab;
      const tabs = [['senado', '🔴 Senado'], ['camara', '🟢 Cámara'], ['composicion', 'Composición y coaliciones'], ['comisiones', 'Comisiones'], ['orden', 'Orden del día'], ['actividad', 'Actividad']];
      const cuerpo = tab === 'senado' || tab === 'camara' ? vistaCamara(E, tab) : tab === 'composicion' ? vistaComposicion(E) : tab === 'comisiones' ? vistaComisiones(E) : tab === 'orden' ? vistaOrden(E) : vistaActividad(E);
      el.innerHTML = `<div class="cab"><div><h1>Congreso de la República</h1><div class="sub">Cuatrienio ${esc(E.congreso.cuatrienio)} · Legislatura ${C.Congreso.periodo(E).legislatura} · ${C.Congreso.enSesion(E) ? '<span class="bien">en sesiones ordinarias</span>' : '<span class="tenue">en receso</span>'}</div></div></div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('.tabs [data-tab]', el).forEach(b => b.onclick = () => C.App.ir('congreso', { tab: b.dataset.tab }));
      const modo = UI.$('#c-modo', el); if (modo) modo.onchange = e => { E.ui.modoHemi = e.target.value; C.App.refrescar(); };
      UI.$$('#c-vista button', el).forEach(b => b.onclick = () => { E.ui.vistaCamara = b.dataset.v; C.App.refrescar(); });
      const bus = UI.$('#c-buscar', el); if (bus) bus.onchange = e => { E.ui.filtroCong = e.target.value; C.App.refrescar(); };
      el.onclick = e => {
        const s = e.target.closest('.curul[data-pol],.curul-mini[data-pol]'); if (s) return Comp.fichaPolitico(E, s.dataset.pol);
        const f = e.target.closest('[data-ficha]'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha);
        const p = e.target.closest('[data-proy]'); if (p) return C.Pantallas.proyectos.expediente(p.dataset.proy);
        const v = e.target.closest('[data-voto-ver]'); if (v) return C.Pantallas.votacion.abrir(v.dataset.votoVer);
        const c = e.target.closest('[data-coal]'); if (c) { const s2 = new Set(E.ui.coalSim || E.gobierno.coalicion); s2.has(c.dataset.coal) ? s2.delete(c.dataset.coal) : s2.add(c.dataset.coal); E.ui.coalSim = [...s2]; return C.App.refrescar(); }
        const a = e.target.closest('[data-alianza]'); if (a) { E.ui.coalSim = a.dataset.alianza.split(','); return C.App.refrescar(); }
        if (e.target.closest('#coal-reset')) { E.ui.coalSim = null; return C.App.refrescar(); }
        const cc = e.target.closest('#com-cam [data-c]'); if (cc) { E.ui.camCom = cc.dataset.c; return C.App.refrescar(); }
        const vs = e.target.closest('.voto-sel [data-v]'); if (vs) { const pid = vs.closest('.voto-sel').dataset.proyecto; E.jugador.votos[pid] = vs.dataset.v; return C.App.refrescar(); }
      };
      const af = UI.$('#act-f', el); if (af) af.onchange = e => { E.ui.filtroAct = e.target.value; C.App.refrescar(); };
    }
  };
})(window.CURUL);

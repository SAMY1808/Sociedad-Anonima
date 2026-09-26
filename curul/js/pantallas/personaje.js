/* Mi carrera: perfil, reputación, imagen por segmentos, finanzas, familia, árbol de carrera e historial. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  /* Árbol de carrera: rutas electorales y no electorales */
  const NODOS = {
    ciudadano: [0, 2, 'Ciudadano'],
    lider: [1, 0, 'Líder comunitario'], activista: [1, 1, 'Activista'], academico: [1, 2, 'Académico'], periodista: [1, 3, 'Periodista'], asesor: [1, 4, 'Asesor'],
    empresario: [1, 5, 'Empresario'], sindicalista: [1, 6, 'Sindicalista'], ong: [1, 7, 'ONG'],
    concejal: [2, 1.5, 'Concejal'], diputado: [2, 3.5, 'Diputado'],
    alcalde: [3, 1, 'Alcalde'], representante: [3, 3, 'Representante'], ministro: [3, 5.5, 'Ministro'],
    gobernador: [4, 1.5, 'Gobernador'], senador: [4, 3.5, 'Senador'],
    presidente: [5, 3, 'Presidente']
  };
  const ARISTAS = [['ciudadano', 'lider'], ['ciudadano', 'activista'], ['ciudadano', 'academico'], ['ciudadano', 'periodista'], ['ciudadano', 'asesor'], ['ciudadano', 'empresario'], ['ciudadano', 'sindicalista'], ['ciudadano', 'ong'],
    ['lider', 'concejal'], ['activista', 'concejal'], ['activista', 'diputado'], ['sindicalista', 'representante'], ['periodista', 'representante'], ['periodista', 'senador'], ['academico', 'ministro'], ['asesor', 'ministro'], ['asesor', 'representante'], ['empresario', 'alcalde'], ['ong', 'diputado'], ['empresario', 'ministro'],
    ['concejal', 'alcalde'], ['concejal', 'representante'], ['diputado', 'representante'], ['diputado', 'gobernador'],
    ['alcalde', 'gobernador'], ['representante', 'senador'], ['representante', 'ministro'], ['ministro', 'presidente'], ['gobernador', 'presidente'], ['senador', 'presidente'], ['senador', 'ministro'], ['alcalde', 'presidente']];

  const arbol = (E) => {
    const J = E.jugador, oc = new Set(J.ocupados || [J.cargo]);
    const W = 760, H = 330, x = c => 60 + c * (W - 120) / 5, y = f => 26 + f * (H - 52) / 7;
    let s = `<svg class="graf arbol" viewBox="0 0 ${W} ${H}">`;
    for (const [a, b] of ARISTAS) { const A = NODOS[a], B = NODOS[b]; const act = oc.has(a) && oc.has(b); s += `<path d="M${x(A[0])},${y(A[1])} C${x(A[0]) + 50},${y(A[1])} ${x(B[0]) - 50},${y(B[1])} ${x(B[0])},${y(B[1])}" fill="none" stroke="${act ? '#D9B45A' : '#243452'}" stroke-width="${act ? 2.5 : 1.2}"/>`; }
    for (const [k, [c, f, n]] of Object.entries(NODOS)) {
      const act = J.cargo === k, fue = oc.has(k);
      s += `<g${UI.tt(esc(n) + (act ? ' · cargo actual' : fue ? ' · ya ocupado' : ''))}><rect x="${x(c) - 50}" y="${y(f) - 13}" width="100" height="26" rx="13" fill="${act ? '#D9B45A' : fue ? '#3b3320' : '#121D30'}" stroke="${act || fue ? '#D9B45A' : '#2c3e60'}"/><text x="${x(c)}" y="${y(f) + 4}" text-anchor="middle" style="fill:${act ? '#1A1405' : fue ? '#F0D48A' : '#8392AA'};font-size:11px;font-weight:${act ? 700 : 500}">${esc(n)}</text></g>`;
    }
    return s + '</svg>';
  };

  C.Pantallas.personaje = {
    render(el) {
      const E = C.E, J = E.jugador, S = E.series;
      const dim = E.ui.dimSeg || 'nivel';
      const segs = C.Opinion.SEGMENTOS[dim];
      const pa = E.partidos[J.partido];
      const topDep = Object.values(E.deptos).map(d => ({ d, v: C.Opinion.favDepto(E, d.id) })).sort((a, b) => b.v - a.v);
      el.innerHTML = `<div class="cab"><div><h1>Mi carrera</h1><div class="sub">${esc(C.DATA.cargos[J.cargo].nombre)} · ${U.anio() - J.nac} años · ${esc(J.profesion)} · ${esc(J.educacion)}</div></div>
        <div class="fila">${UI.botonAccion('descansar', {})}${UI.botonAccion('estudiar', {})}${UI.botonAccion('trabajar', {})}</div></div>
      <div class="grid g3">
        <div class="tarjeta perfil"><div class="fila" style="flex-wrap:nowrap">${Comp.avatar(E, E.politicos.J, 92)}<div><h2 style="font-size:23px">${esc(J.nombre)}</h2>
          <div class="tenue" style="font-size:12.5px">Nacido en ${esc(E.deptos[J.nacimiento].capital)} · vive en ${esc(E.deptos[J.residencia].capital)}</div>
          <div class="fila" style="margin-top:6px">${Comp.partido(E, J.partido, true)}${pa ? Comp.postura(pa.postura) : ''}</div></div></div>
          <div style="margin-top:10px">${Comp.ideoBarra(J.ideologia.eco, J.ideologia.soc)}<div class="tenue" style="font-size:11.5px;margin-top:3px">${Comp.etiquetaIdeo(J.ideologia.eco)} · ${J.ideologia.soc > 25 ? 'conservador' : J.ideologia.soc < -25 ? 'progresista' : 'moderado'} en lo social</div></div>
          <h3 style="margin-top:12px">Atributos</h3>${G.barrasH(Object.entries({ carisma: 'Carisma', oratoria: 'Oratoria', gestion: 'Gestión', negociacion: 'Negociación', integridad: 'Integridad' }).map(([k, n]) => ({ etq: n, v: J.atributos[k], color: '#6f86b3' })), { max: 100, fmt: v => U.n(v), anchoEtq: '84px' })}
          <div class="grid g3" style="margin-top:12px">${Comp.kpi('Favorabilidad', U.n(J.popularidad) + '%')}${Comp.kpi('Reconocimiento', U.n(J.reconocimiento) + '%')}${Comp.kpi('Credibilidad', U.n(J.credibilidad))}</div></div>
        <div class="tarjeta"><h3>Reputación</h3><div style="display:flex;justify-content:center">${G.radar(Object.entries({ honestidad: 'Honestidad', competencia: 'Competencia', liderazgo: 'Liderazgo', experiencia: 'Experiencia', cercania: 'Cercanía', transparencia: 'Transparencia' }).map(([k, n]) => ({ etq: n, v: J.rep[k] })), { tam: 260 })}</div>
          ${G.linea([{ nombre: 'Favorabilidad', color: '#D9B45A', datos: S['jug:favorabilidad'] || [] }, { nombre: 'Reconocimiento', color: '#6CC4F5', datos: S['jug:reconocimiento'] || [] }], { alto: 120, min: 0, max: 100, unidad: '%' })}</div>
        <div class="tarjeta"><div class="t-cab"><h3>Imagen por segmento</h3><select id="p-dim">${Object.entries(C.Opinion.DIM).map(([k, n]) => `<option value="${k}" ${k === dim ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          ${G.barrasH(segs.map(s => ({ etq: s[1], v: C.Opinion.favSegmento(E, s[0]), color: C.Opinion.favSegmento(E, s[0]) > 50 ? 'var(--bien)' : 'var(--alerta)', tt: `Peso en el electorado: ${Math.round(s[4] * 100)} %` })), { max: 100, marca: 50, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}
          <h3 style="margin-top:14px">Dónde te quieren más</h3>${G.barrasH(topDep.slice(0, 5).map(x => ({ etq: esc(x.d.nombre), v: x.v, color: '#5DB85A' })), { max: 100, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}
          <h3 style="margin-top:10px">Dónde te rechazan</h3>${G.barrasH(topDep.slice(-3).reverse().map(x => ({ etq: esc(x.d.nombre), v: x.v, color: '#E8812A' })), { max: 100, fmt: v => U.n(v) + '%', anchoEtq: '110px' })}</div>
      </div>
      <div class="tarjeta" style="margin-top:14px"><h3>Árbol de carrera</h3>${arbol(E)}<div class="tenue" style="font-size:12px">Dorado: cargos que has ocupado. Hay muchas rutas hacia la Casa de Nariño: por la vía territorial, la legislativa o la técnica.</div></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="tarjeta"><h3>Patrimonio y finanzas</h3>${Comp.kpi('Patrimonio', U.cop(J.patrimonio * 1))}
          <div class="tt-f" style="margin-top:6px"><span class="tenue">Ingresos mensuales</span><b>${U.cop(J.ingresos)}</b></div><div class="tt-f"><span class="tenue">Gastos mensuales</span><b>${U.cop(J.gastos)}</b></div>
          ${G.linea([{ nombre: 'Patrimonio', color: '#5DB85A', datos: S['jug:patrimonio'] || [] }], { alto: 110, fmt: v => U.n(v), unidad: ' M' })}
          <h3 style="margin-top:10px">Familia · bienestar ${Math.round(J.bienestar || 60)}%</h3><div class="lista">${J.familia.map(f => `<div class="it"><span>${{ Pareja: '💞', Hijo: '👦', Hija: '👧', Madre: '👩‍🦳', Padre: '👨‍🦳' }[f.rol] || '👤'}</span><div class="cuerpo"><b>${esc(f.nombre)}</b><span>${f.rol} · ${f.edad} años</span></div></div>`).join('')}</div></div>
        <div class="tarjeta"><h3>Trayectoria</h3><div class="timeline">${J.trayectoria.slice().reverse().map(t => `<div class="tl"><span class="tl-f">${U.fmtT(t.t)}</span><span class="tl-t">${esc(t.txt)}</span></div>`).join('')}</div></div>
        <div class="tarjeta"><h3>Historial electoral</h3><div class="lista">${J.historialElectoral.slice().reverse().map(h => `<div class="it"><span>${h.electo ? '✅' : '❌'}</span><div class="cuerpo"><b>${esc(C.Elecciones.CARGOS_CAMPANA[h.cargo] || h.cargo)} ${h.anio}</b><span>${U.n(h.votos)} votos${h.depto ? ' · ' + esc(E.deptos[h.depto].nombre) : ''}</span></div></div>`).join('') || '<div class="vacio">Aún no has sido candidato.</div>'}</div>
          <h3 style="margin-top:12px">Historial legislativo</h3><div class="lista">${J.historialLegislativo.slice().reverse().slice(0, 8).map(h => `<div class="it"><span>${h.resultado === 'ley' ? '📜' : '🗄'}</span><div class="cuerpo"><b style="white-space:normal">${esc(h.titulo)}</b><span>${h.rol} · ${h.resultado === 'ley' ? 'Ley ' + h.ley : esc(h.motivo || 'archivado')}</span></div></div>`).join('') || '<div class="vacio">Sin iniciativas concluidas.</div>'}</div>
          <h3 style="margin-top:12px">Escándalos y reconocimientos</h3><div class="lista">${[...J.escandalos.map(x => ({ ...x, i: '🔎', txt: x.titulo })), ...J.reconocimientos.map(x => ({ ...x, i: '🏅' }))].sort((a, b) => b.t - a.t).map(x => `<div class="it"><span>${x.i}</span><div class="cuerpo"><b style="white-space:normal">${esc(x.txt)}</b><span>${U.fmtT(x.t)}</span></div></div>`).join('') || '<div class="vacio">Hoja de vida limpia y sin distinciones aún.</div>'}</div></div>
      </div>
      <div class="tarjeta" style="margin-top:14px"><h3>Cambiar de rumbo</h3><div class="fila accion-form"><select data-arg="oficio">${Object.entries(C.Personaje.ORIGENES).filter(([k, o]) => !o.electo).map(([k, o]) => `<option value="${k}">${o.icono} ${o.n}</option>`).join('')}</select>${UI.botonAccion('cambiarOficio', {})}
        <select data-arg="partido">${Object.values(E.partidos).filter(p => !p.especial).map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>${UI.botonAccion('afiliarse', {})}</div>
        <p class="tenue" style="font-size:12px">La vida sigue fuera de los cargos: academia, periodismo, gremios u ONG te mantienen vigente para volver a la arena electoral.</p></div>`;
      UI.$('#p-dim', el).onchange = e => { E.ui.dimSeg = e.target.value; C.App.refrescar(); };
    }
  };
})(window.CURUL);

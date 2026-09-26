/* Mapa interactivo por capas y tablero regional de cada departamento. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  const panelDepto = (E, id) => {
    const d = E.deptos[id];
    const reps = C.Congreso.miembros(E, 'camara').filter(p => (p.id === 'J' ? E.jugador.cargoInfo.circ : p.cargo && p.cargo.circ) === id);
    const sens = C.Congreso.miembros(E, 'senado').filter(p => p.depto === id);
    const gob = E.politicos[d.gobernador], alc = E.politicos[d.alcalde];
    const rC = C.Mapa.ultima(E, 'congreso');
    const votos = rC ? Object.entries(rC.porDepto[id].votos).filter(([k]) => k !== 'BLANCO').sort((a, b) => b[1] - a[1]).slice(0, 7) : [];
    const totV = rC ? rC.porDepto[id].validos : 1;
    const rP = E.elecciones.historico.slice().reverse().find(h => h.tipo === 'presidencial');
    const pv = rP ? Object.entries(rP.porDepto[id].votos).filter(([k]) => k !== 'BLANCO').sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
    const pvTot = rP ? rP.porDepto[id].validos : 1;
    const nat = k => U.prom(Object.values(E.deptos).map(x => x[k]));
    const ind = (k, n, inv) => { const v = d[k], m = nat(k), mejor = inv ? v < m : v > m; return `<div class="ind"><span>${n}</span><div class="barra-h"><i style="width:${U.clamp(v, 0, 100)}%;background:${mejor ? 'var(--bien)' : 'var(--alerta)'}"></i><b style="position:absolute;left:${U.clamp(m, 0, 100)}%;top:-2px;bottom:-2px;width:2px;background:#fff;opacity:.6"${UI.tt('Promedio nacional: ' + U.d1(m))}></b></div><b class="num">${U.d1(v)}</b></div>`; };
    return `<div class="panel-depto">
      <div class="t-cab"><div><h2 style="font-size:24px">${esc(d.nombre)}</h2><div class="tenue">Capital: ${esc(d.capital)} · Región ${esc(d.region)}</div></div><button class="cerrar" id="pd-cerrar">×</button></div>
      <div class="grid g3" style="gap:8px;margin:8px 0 12px">
        ${Comp.kpi('Población', U.n(d.poblacion * 1000))}${Comp.kpi('PIB per cápita', '$' + U.n(d.pibPc) + ' M')}${Comp.kpi('Curules Cámara', d.camara)}</div>
      <div class="tarjeta"><h3>Indicadores sociales</h3>
        ${ind('pobreza', 'Pobreza %', true)}${ind('desempleo', 'Desempleo %', true)}${ind('educacion', 'Educación')}${ind('salud', 'Salud')}${ind('seguridad', 'Seguridad')}${ind('infraestructura', 'Infraestructura')}</div>
      <div class="tarjeta" style="margin-top:10px"><h3>Poder regional</h3>
        <div class="lista">
          ${gob ? `<div class="it clic" data-pol-ficha="${gob.id}">${Comp.avatar(E, gob, 34)}<div class="cuerpo"><b>${esc(gob.nombre)}</b><span>Gobernador · ${Comp.partido(E, gob.partido)}</span></div></div>` : ''}
          ${alc ? `<div class="it clic" data-pol-ficha="${alc.id}">${Comp.avatar(E, alc, 34)}<div class="cuerpo"><b>${esc(alc.nombre)}</b><span>Alcalde de ${esc(d.capital)} · ${Comp.partido(E, alc.partido)}</span></div></div>` : ''}
        </div>
        <div style="margin-top:8px"><div class="tenue" style="font-size:11.5px;margin-bottom:4px">REPRESENTANTES (${reps.length})</div><div class="curules-mini">${reps.map(p => `<span class="curul-mini" data-pol="${p.id}" style="background:${E.partidos[p.id === 'J' ? E.jugador.partido : p.partido] ? E.partidos[p.id === 'J' ? E.jugador.partido : p.partido].color : '#8C96A3'}${p.id === 'J' ? ';outline:2px solid #FFF3C4' : ''}"></span>`).join('')}</div></div>
        <div style="margin-top:8px"><div class="tenue" style="font-size:11.5px;margin-bottom:4px">SENADORES CON BASE EN LA REGIÓN (${sens.length})</div><div class="curules-mini">${sens.map(p => `<span class="curul-mini" data-pol="${p.id}" style="background:${E.partidos[p.id === 'J' ? E.jugador.partido : p.partido] ? E.partidos[p.id === 'J' ? E.jugador.partido : p.partido].color : '#8C96A3'}"></span>`).join('') || '<span class="tenue">—</span>'}</div></div>
      </div>
      <div class="tarjeta" style="margin-top:10px"><h3>Senado ${rC ? rC.anio : ''} · votos en el departamento</h3>
        ${G.barrasH(votos.map(([p, v]) => ({ etq: Comp.partido(E, p), v: v / totV * 100, color: E.partidos[p] ? E.partidos[p].color : '#F0D48A', tt: `${U.n(v)} votos` })), { fmt: v => U.d1(v) + '%', anchoEtq: '70px' })}</div>
      ${pv.length ? `<div class="tarjeta" style="margin-top:10px"><h3>Presidencial ${rP.anio}${rP.vuelta === 2 ? ' · 2ª vuelta' : ''}</h3>${G.barrasH(pv.map(([pol, v]) => { const c = rP.candidatos.find(x => x.pol === pol); return { etq: esc(Comp.nombrePol(E, pol).split(' ').slice(0, 2).join(' ')), v: v / pvTot * 100, color: E.partidos[c.partido] ? E.partidos[c.partido].color : '#F0D48A' }; }), { fmt: v => U.d1(v) + '%', anchoEtq: '110px' })}</div>` : ''}
      <div class="tarjeta" style="margin-top:10px"><h3>Opinión pública</h3>
        <div class="grid g3" style="gap:6px">${Comp.kpi('Aprobación pres.', U.n(C.Opinion.aprobDepto(E, id)) + '%')}${Comp.kpi('Tu favorabilidad', U.n(C.Opinion.favDepto(E, id)) + '%')}${Comp.kpi('Te conocen', U.n(C.Opinion.recDepto(E, id)) + '%')}</div>
        <div class="fila" style="margin-top:10px">${UI.botonAccion('recorrer', { depto: id }, 'Recorrer')}${UI.botonAccion('reunionLideres', { depto: id }, 'Líderes locales')}${E.elecciones.campana ? UI.botonAccion('mitin', { depto: id }, 'Evento de campaña') : ''}</div></div>
    </div>`;
  };

  C.Pantallas.mapa = {
    render(el, params) {
      const E = C.E;
      const capa = params.capa || E.ui.capaMapa || 'senado';
      const sel = params.depto || null;
      const m = C.Mapa.svg(E, { capa, seleccion: sel, etiquetas: true, altoMax: 760 });
      const capas = Object.entries(C.Mapa.CAPAS);
      el.innerHTML = `<div class="cab"><div><h1>Mapa de Colombia</h1><div class="sub">Haz clic en un departamento para abrir su tablero regional.</div></div></div>
        <div class="mapa-layout ${sel ? 'con-panel' : ''}">
          <div class="tarjeta">
            <div class="capas">${Object.entries(U.agrupar(capas, ([k, c]) => c.grupo)).map(([g, arr]) => `<div class="capa-grupo"><span>${g}</span>${arr.map(([k, c]) => `<button class="btn chico ${k === capa ? 'prim' : ''}" data-capa="${k}">${esc(c.n)}</button>`).join('')}</div>`).join('')}</div>
            <div id="m-mapa" class="mapa-grande">${m.svg}</div>${m.leyenda}
          </div>
          ${sel ? `<div class="tarjeta">${panelDepto(E, sel)}</div>` : ''}
        </div>`;
      UI.$$('[data-capa]', el).forEach(b => b.onclick = () => { E.ui.capaMapa = b.dataset.capa; C.App.ir('mapa', { capa: b.dataset.capa, depto: sel }); });
      C.Mapa.enlazar(UI.$('#m-mapa', el), id => C.App.ir('mapa', { capa, depto: id }));
      const c = UI.$('#pd-cerrar', el); if (c) c.onclick = () => C.App.ir('mapa', { capa });
      UI.$$('[data-pol-ficha]', el).forEach(b => b.onclick = () => Comp.fichaPolitico(E, b.dataset.polFicha));
      UI.$$('.curul-mini', el).forEach(b => b.onclick = () => Comp.fichaPolitico(E, b.dataset.pol));
    }
  };
})(window.CURUL);

/* Mapa interactivo de Colombia por capas (electorales, sociales y de opinión). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const mezcla = (a, b, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); t = U.clamp(t, 0, 1); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const SEQ = ['#1E2C47', '#F0C862'];
  const seq = (v, min, max) => mezcla(SEQ[0], SEQ[1], (v - min) / ((max - min) || 1));
  const div = (v, rango) => v < 0 ? mezcla('#6B7589', '#E8812A', -v / rango) : mezcla('#6B7589', '#26B59A', v / rango);

  const ultima = (E, tipo, vuelta) => E.elecciones.historico.slice().reverse().find(h => h.tipo === tipo && (!vuelta || h.vuelta === vuelta || (tipo === 'presidencial' && (h.ganador))));
  const ganadorVotos = votos => Object.entries(votos).filter(([k]) => k !== 'BLANCO').sort((a, b) => b[1] - a[1]);
  const partidoPol = (E, id) => id === 'J' ? (E.jugador.partido || 'IND') : (E.politicos[id] ? E.politicos[id].partido : null);
  const colorPartido = (E, pid) => E.partidos[pid] ? E.partidos[pid].color : (pid === 'MOV' ? '#F0D48A' : '#8C96A3');
  const nombrePartido = (E, pid) => E.partidos[pid] ? E.partidos[pid].sigla : (pid === 'MOV' ? 'Movimiento propio' : '—');
  const nomPol = (E, id) => id === 'J' ? E.jugador.nombre : (E.politicos[id] ? E.politicos[id].nombre : 'Candidato');

  const indicador = (clave, n, fmt, min, max, desc) => ({ n, grupo: 'Territorio', tipo: 'seq',
    info: (E, d) => ({ fill: seq(d[clave], min, max), txt: fmt(d[clave]) }), leyenda: () => ({ tipo: 'seq', min: fmt(min), max: fmt(max), desc }) });

  const CAPAS = {
    senado: { n: 'Senado (lista más votada)', grupo: 'Electoral', info(E, d) {
      const r = ultima(E, 'congreso'); if (!r) return null;
      const g = ganadorVotos(r.porDepto[d.id].votos), tot = U.suma(g.map(x => x[1]));
      return { fill: colorPartido(E, g[0][0]), op: 0.55 + (g[0][1] / tot) * 1.2, txt: `${nombrePartido(E, g[0][0])} ${U.d1(g[0][1] / tot * 100)} %`, pid: g[0][0] };
    } },
    camara: { n: 'Cámara (curules por departamento)', grupo: 'Electoral', info(E, d) {
      const r = ultima(E, 'congreso'); if (!r) return null;
      const cur = r.camara.porDepto[d.id].curules;
      const g = Object.entries(cur).sort((a, b) => b[1] - a[1]);
      if (!g.length) return null;
      return { fill: colorPartido(E, g[0][0]), op: 0.5 + g[0][1] / d.camara * 0.5, txt: g.map(([p, n]) => nombrePartido(E, p) + ' ' + n).join(' · '), pid: g[0][0] };
    } },
    presidencial: { n: 'Presidencial (ganador)', grupo: 'Electoral', info(E, d) {
      const r = E.elecciones.historico.slice().reverse().find(h => h.tipo === 'presidencial'); if (!r) return null;
      const g = ganadorVotos(r.porDepto[d.id].votos), tot = U.suma(g.map(x => x[1]));
      const c = r.candidatos.find(x => x.pol === g[0][0]);
      return { fill: colorPartido(E, c ? c.partido : null), op: 0.5 + (g[0][1] / tot - 0.3) * 1.6, txt: `${nomPol(E, g[0][0])} ${U.d1(g[0][1] / tot * 100)} %`, pid: c && c.partido };
    } },
    gobernadores: { n: 'Gobernadores', grupo: 'Electoral', info(E, d) { const pid = partidoPol(E, d.gobernador); return { fill: colorPartido(E, pid), txt: nomPol(E, d.gobernador) + ' (' + nombrePartido(E, pid) + ')', pid }; } },
    alcaldes: { n: 'Alcaldes de capitales', grupo: 'Electoral', info(E, d) { const pid = partidoPol(E, d.alcalde); return { fill: colorPartido(E, pid), txt: nomPol(E, d.alcalde) + ' (' + nombrePartido(E, pid) + ')', pid }; } },
    pobreza: indicador('pobreza', 'Pobreza monetaria', v => U.d1(v) + ' %', 15, 70, 'más claro = más pobreza'),
    pib: indicador('pibPc', 'PIB per cápita', v => '$' + U.n(v) + ' M', 6, 42, 'millones de pesos por habitante'),
    desempleo: indicador('desempleo', 'Desempleo', v => U.d1(v) + ' %', 6, 18, ''),
    seguridad: indicador('seguridad', 'Seguridad', v => U.n(v) + '/100', 20, 80, 'índice 0-100'),
    educacion: indicador('educacion', 'Educación', v => U.n(v) + '/100', 35, 80, 'índice 0-100'),
    salud: indicador('salud', 'Salud', v => U.n(v) + '/100', 35, 80, 'índice 0-100'),
    infraestructura: indicador('infraestructura', 'Infraestructura', v => U.n(v) + '/100', 10, 75, 'índice 0-100'),
    poblacion: { n: 'Población', grupo: 'Territorio', info: (E, d) => ({ fill: seq(Math.log(d.poblacion), Math.log(45), Math.log(8000)), txt: U.n(d.poblacion * 1000) + ' hab.' }), leyenda: () => ({ tipo: 'seq', min: '45 mil', max: '8 millones' }) },
    aprobacion: { n: 'Aprobación presidencial', grupo: 'Opinión', info: (E, d) => { const v = C.Opinion.aprobDepto(E, d.id); return { fill: div(v - 50, 30), txt: U.d1(v) + ' %' }; }, leyenda: () => ({ tipo: 'div', min: '20 %', mid: '50 %', max: '80 %' }) },
    favorabilidad: { n: 'Tu favorabilidad', grupo: 'Opinión', info: (E, d) => { const v = C.Opinion.favDepto(E, d.id); return { fill: div(v - 50, 30), txt: U.d1(v) + ' %' }; }, leyenda: () => ({ tipo: 'div', min: '20 %', mid: '50 %', max: '80 %' }) },
    reconocimiento: { n: 'Tu reconocimiento', grupo: 'Opinión', info: (E, d) => { const v = C.Opinion.recDepto(E, d.id); return { fill: seq(v, 0, 90), txt: U.d1(v) + ' %' }; }, leyenda: () => ({ tipo: 'seq', min: '0 %', max: '90 %' }) }
  };

  const M = {
    CAPAS,
    ultima,
    svg(E, o = {}) {
      const capa = CAPAS[o.capa || 'senado'];
      const data = C.DATA.mapa;
      let s = `<svg class="mapa-col" viewBox="${data.viewBox}" style="max-height:${o.altoMax || 620}px">`;
      s += `<rect x="6" y="18" width="72" height="150" rx="6" fill="none" stroke="#2c3e60" stroke-dasharray="3 3"/><text x="42" y="180" text-anchor="middle" style="fill:var(--tenue);font-size:9px">San Andrés</text>`;
      const pids = new Set();
      for (const [id, g] of Object.entries(data.deptos)) {
        const d = E.deptos[id];
        const inf = capa.info(E, d) || { fill: '#1b2840', txt: 'Sin datos' };
        if (inf.pid) pids.add(inf.pid);
        const sel = o.seleccion === id;
        const tt = `<div class="tt-t">${esc(d.nombre)}</div><div class="tt-f"><span>${esc(capa.n)}</span><b>${esc(inf.txt)}</b></div><div class="tt-f"><span>Población</span><b>${U.n(d.poblacion * 1000)}</b></div><div class="tt-f"><span>Capital</span><b>${esc(d.capital)}</b></div>`;
        s += `<path class="depto${sel ? ' sel' : ''}" data-depto="${id}" d="${g.d}" fill="${inf.fill}" fill-opacity="${U.clamp(inf.op || 1, 0.35, 1)}"${C.UI.tt(tt)}/>`;
      }
      if (o.etiquetas) for (const [id, g] of Object.entries(data.deptos)) if (E.deptos[id].poblacion > 700 || id === 'SAP') s += `<text x="${g.cx}" y="${g.cy}" text-anchor="middle" class="etq-mapa">${id}</text>`;
      if (o.marcador) { const g = data.deptos[o.marcador]; if (g) s += `<g class="pin"><circle cx="${g.cx}" cy="${g.cy}" r="7" fill="var(--oro)" stroke="#0A111D" stroke-width="2"/><circle cx="${g.cx}" cy="${g.cy}" r="14" fill="none" stroke="var(--oro)" stroke-width="1.5" class="pulso"/></g>`; }
      s += '</svg>';
      return { svg: s, leyenda: M.leyenda(E, o.capa || 'senado', pids) };
    },
    leyenda(E, capaId, pids) {
      const capa = CAPAS[capaId];
      if (capa.leyenda) {
        const l = capa.leyenda();
        if (l.tipo === 'seq') return `<div class="leyenda-mapa"><span>${l.min}</span><i style="background:linear-gradient(90deg,${SEQ[0]},${SEQ[1]})"></i><span>${l.max}</span>${l.desc ? `<em>${esc(l.desc)}</em>` : ''}</div>`;
        return `<div class="leyenda-mapa"><span>${l.min}</span><i style="background:linear-gradient(90deg,#E8812A,#6B7589,#26B59A)"></i><span>${l.max}</span><em>centro: ${l.mid}</em></div>`;
      }
      return `<div class="leyenda">${[...(pids || [])].map(p => `<span><i style="background:${colorPartido(E, p)}"></i>${esc(nombrePartido(E, p))}</span>`).join('')}</div>`;
    },
    /* Conecta clics sobre departamentos */
    enlazar(el, fn) { el.addEventListener('click', e => { const p = e.target.closest('[data-depto]'); if (p) fn(p.dataset.depto); }); },
    selectorCapas(actual, grupos) {
      const g = U.agrupar(Object.entries(CAPAS).filter(([k, c]) => !grupos || grupos.includes(c.grupo)), ([k, c]) => c.grupo);
      return `<select class="sel-capa">${Object.entries(g).map(([gr, arr]) => `<optgroup label="${gr}">${arr.map(([k, c]) => `<option value="${k}" ${k === actual ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</optgroup>`).join('')}</select>`;
    }
  };
  C.Mapa = M;
})(window.CURUL);

/* Mapa de mosaicos de Europa: cada país es una ficha en su posición aproximada. Sin dependencias geográficas. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const TW = 66, TH = 52, GAP = 5;

  const COL = {
    ue: '#2E5BBF', euro: '#1B3F94', exue: '#7A5D6B', candidato: '#C99A2B', jugador: '#FFF3C4'
  };
  const escala = (v, a, b) => { const t = U.clamp((v - a) / (b - a), 0, 1); const m = (x, y) => Math.round(x + (y - x) * t); return `rgb(${m(190, 63)},${m(70, 175)},${m(70, 110)})`; };

  const Mo = {
    capas: [['estado', 'Estatus'], ['gobierno', 'Gobierno'], ['aprobacion', 'Aprobación'], ['economia', 'Crecimiento'], ['consejo', 'Voto en el Consejo']],

    color(E, id, capa, extra) {
      const P = E.paises[id];
      if (capa === 'estado') return P.estado === 'ue' ? (P.euro === true || P.euro === 'uni' ? COL.euro : COL.ue) : COL[P.estado];
      if (capa === 'gobierno') return P.gob ? E.partidos[P.gob.partido].color : '#555';
      if (capa === 'aprobacion') return escala(P.gob ? P.gob.aprob : 40, 25, 60);
      if (capa === 'economia') return escala(P.ec.crec, -1, 4);
      if (capa === 'consejo') {
        if (P.estado !== 'ue' || !extra) return '#2a3347';
        const v = extra[id]; return v === 'si' ? 'var(--si)' : v === 'no' ? 'var(--no)' : 'var(--abs)';
      }
      return '#444';
    },

    svg(E, capa, o = {}) {
      const mos = C.DATA.mosaico, cols = 12, filas = 10;
      const W = (cols - 1) * (TW + GAP), Ht = filas * (TH + GAP);
      let s = `<svg class="graf mosaico" viewBox="0 0 ${W} ${Ht}" style="max-height:${o.altoMax || 520}px">`;
      for (const id in mos) {
        if (!E.paises[id]) continue;
        const [c, f] = mos[id], x = (c - 1) * (TW + GAP), y = f * (TH + GAP), d = C.DATA.paises[id], P = E.paises[id];
        const col = Mo.color(E, id, capa, o.votos);
        const propio = E.jugador && E.jugador.pais === id;
        const g = P.gob;
        const tt = `<div class="tt-t">${d.bandera} ${esc(d.nombre)}</div><div class="tt-f"><span>Gobierno</span><b>${g ? esc(E.partidos[g.partido].sigla) + (g.coalicion.length > 1 ? ' +' + (g.coalicion.length - 1) : '') : '—'}</b></div><div class="tt-f"><span>Aprobación</span><b>${g ? U.n(g.aprob) + ' %' : '—'}</b></div><div class="tt-f"><span>Crecimiento</span><b>${U.d1(P.ec.crec)} %</b></div><div class="tt-f"><span>Estatus</span><b>${({ ue: 'Miembro UE', exue: 'Ex miembro', candidato: 'Candidato' })[P.estado]}</b></div>` + (o.votos && o.votos[id] ? `<div class="tt-f"><span>Voto</span><b>${({ si: 'A favor', no: 'En contra', abs: 'Abstención' })[o.votos[id]]}</b></div>` : '');
        s += `<g class="ficha" data-pais="${id}" data-tt="${esc(tt)}" style="cursor:pointer">
          <rect x="${x}" y="${y}" width="${TW}" height="${TH}" rx="9" fill="${col}" stroke="${propio ? COL.jugador : '#0A111D'}" stroke-width="${propio ? 3.2 : 1.2}"/>
          <text x="${x + TW / 2}" y="${y + 24}" text-anchor="middle" style="font-size:20px;fill:#fff">${d.bandera}</text>
          <text x="${x + TW / 2}" y="${y + 43}" text-anchor="middle" style="font-size:11px;fill:#fff;font-weight:700;letter-spacing:.06em">${id}</text></g>`;
      }
      return s + '</svg>';
    },

    leyenda(capa) {
      const it = {
        estado: [[COL.euro, 'UE · euro'], [COL.ue, 'UE · sin euro'], [COL.candidato, 'Candidato'], [COL.exue, 'Ex miembro']],
        gobierno: [['#E0533F', 'Socialdemocracia'], ['#3B6FD4', 'Conservadores'], ['#E8B923', 'Liberales'], ['#2B4C94', 'Nacionalistas'], ['#17A2A2', 'Populistas']],
        aprobacion: [['rgb(190,70,70)', 'Baja'], ['rgb(63,175,110)', 'Alta']], economia: [['rgb(190,70,70)', 'Estancado'], ['rgb(63,175,110)', 'Fuerte']],
        consejo: [['var(--si)', 'A favor'], ['var(--no)', 'En contra'], ['var(--abs)', 'Abstención']]
      }[capa] || [];
      return `<div class="leyenda">${it.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>`;
    },

    selector(capa, atr = 'data-capa') {
      return `<div class="seg">${Mo.capas.map(([k, n]) => `<button ${atr}="${k}" class="${k === capa ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
    },

    /* Selector de país para la creación de partida (marca los elegibles). */
    seleccion(seleccionado, filtro) {
      const mos = C.DATA.mosaico, cols = 12, filas = 10;
      const W = (cols - 1) * (TW + GAP), Ht = filas * (TH + GAP);
      let s = `<svg class="graf mosaico" viewBox="0 0 ${W} ${Ht}" style="max-height:540px">`;
      for (const id in mos) {
        const [c, f] = mos[id], x = (c - 1) * (TW + GAP), y = f * (TH + GAP), d = C.DATA.paises[id];
        const gris = filtro && filtro !== 'todos' && d.estado !== filtro;
        const col = d.estado === 'ue' ? (d.euro ? COL.euro : COL.ue) : COL[d.estado];
        const sel = seleccionado === id;
        s += `<g class="ficha" data-pais="${id}" style="cursor:pointer" opacity="${gris ? 0.28 : 1}">
          <rect x="${x}" y="${y}" width="${TW}" height="${TH}" rx="9" fill="${col}" stroke="${sel ? COL.jugador : '#0A111D'}" stroke-width="${sel ? 4 : 1.2}"/>
          <text x="${x + TW / 2}" y="${y + 24}" text-anchor="middle" style="font-size:20px;fill:#fff">${d.bandera}</text>
          <text x="${x + TW / 2}" y="${y + 43}" text-anchor="middle" style="font-size:10.5px;fill:#fff;font-weight:700">${id}</text></g>`;
      }
      return s + '</svg>';
    }
  };
  C.Mosaico = Mo;
})(window.EUROPA);

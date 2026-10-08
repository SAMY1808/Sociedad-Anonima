/* Mapa de mosaicos de Europa: cada país es una ficha en su posición aproximada. Sin dependencias geográficas. */
window.ESP = window.ESP || {};
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

    /* ── Mapa de mosaicos de España: una ficha por circunscripción ── */
    capasEs: [['voto', 'Generales'], ['autonomico', 'Gobierno autonómico'], ['relM', 'Relación con Moncloa'], ['indep', 'Independentismo'], ['aut', 'Autogobierno']],

    colorProv(E, id, capa) {
      const d = C.DATA.provincias[id], c = d[1], rc = E.esp.ccaa[c];
      if (capa === 'voto') { const pr = E.esp.prov[id]; return pr ? E.partidos[pr.ganador].color : '#444'; }
      if (capa === 'autonomico') return rc && rc.gob ? E.partidos[rc.gob.partido].color : '#444';
      if (capa === 'impl') return escala(C.Sede ? (C.Sede.asegurar(E).impl[id] || 0) : 0, 10, 80);
      if (capa === 'relM') return escala(rc.relM, 15, 80);
      if (capa === 'indep') { const t = U.clamp(rc.indep / 40, 0, 1), m = (x, y) => Math.round(x + (y - x) * t); return `rgb(${m(60, 232)},${m(90, 177)},${m(150, 0)})`; }
      if (capa === 'aut') return escala(rc.aut, 40, 90);
      return '#444';
    },

    provincias(E, capa, o = {}) {
      const P = C.DATA.provincias, cols = 11, filas = 10, tw = 58, th = 46, gap = 4;
      const W = cols * (tw + gap), Ht = filas * (th + gap);
      let s = `<svg class="graf mosaico" viewBox="0 0 ${W} ${Ht}" style="max-height:${o.altoMax || 520}px">`;
      for (const id in P) {
        const d = P[id], x = d[4] * (tw + gap), y = d[5] * (th + gap), rc = E.esp.ccaa[d[1]], pr = E.esp.prov[id];
        const oculta = o.visible && !o.visible.has(id), col = oculta ? '#1b2640' : Mo.colorProv(E, id, capa);
        const propio = E.jugador && (E.jugador.circ === id && E.jugador.nivel === 'nacional');
        const sel = o.region && o.region === d[1];
        let tt = `<div class="tt-t">${esc(d[0])} · ${esc(C.DATA.ccaa[d[1]].nombre)}</div><div class="tt-f"><span>Diputados</span><b>${d[2]}</b></div>`;
        if (pr && !oculta) { const top = Object.keys(pr.escanos).sort((a, b) => pr.escanos[b] - pr.escanos[a]).slice(0, 4); tt += top.map(k => `<div class="tt-f"><span><i class="pto" style="background:${E.partidos[k].color}"></i> ${E.partidos[k].sigla}</span><b>${pr.escanos[k]} · ${U.d1(pr.votos[k])} %</b></div>`).join(''); }
        tt += `<div class="tt-f"><span>Gobierno autonómico</span><b>${rc.gob ? E.partidos[rc.gob.partido].sigla : '—'}</b></div><div class="tt-f"><span>Relación con Moncloa</span><b>${Math.round(rc.relM)}</b></div><div class="tt-f"><span>Independentismo</span><b>${U.d1(rc.indep)} %</b></div>`;
        s += `<g class="ficha" data-ccaa="${d[1]}" data-prov="${id}" data-tt="${esc(tt)}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="8" fill="${col}" stroke="${propio ? COL.jugador : sel ? '#fff' : '#0A111D'}" stroke-width="${propio || sel ? 3.4 : 1.2}"/>
          <text x="${x + tw / 2}" y="${y + 20}" text-anchor="middle" style="font-size:12.5px;fill:#fff;font-weight:700;paint-order:stroke;stroke:rgba(0,0,0,.5);stroke-width:2px">${id}</text>
          <text x="${x + tw / 2}" y="${y + 36}" text-anchor="middle" style="font-size:11px;fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.5);stroke-width:2px">${d[2]}</text></g>`;
      }
      return s + '</svg>';
    },

    leyendaEs(E, capa) {
      if (capa === 'voto' || capa === 'autonomico') {
        const ps = E.paises.ES.partidos.filter(k => E.partidos[k].amb === 'nac' || E.partidos[k].lider).filter(k => Object.values(E.esp.prov).some(p => p.ganador === k) || E.esp.nacionales.includes(k) || Object.values(E.esp.ccaa).some(c => c.gob && c.gob.partido === k));
        return `<div class="leyenda">${ps.map(k => `<span><i style="background:${E.partidos[k].color}"></i>${E.partidos[k].sigla}</span>`).join('')}</div>`;
      }
      const t = { relM: [['rgb(190,70,70)', 'Tensa'], ['rgb(63,175,110)', 'Buena']], indep: [['rgb(60,90,150)', 'Bajo'], ['rgb(232,177,0)', 'Alto']], aut: [['rgb(190,70,70)', 'Menor'], ['rgb(63,175,110)', 'Mayor']] }[capa] || [];
      return `<div class="leyenda">${t.map(([c, x]) => `<span><i style="background:${c}"></i>${x}</span>`).join('')}</div>`;
    },

    selectorEs(capa, atr = 'data-capa') {
      return `<div class="seg">${Mo.capasEs.map(([k, n]) => `<button ${atr}="${k}" class="${k === capa ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
    }
  };
  C.Mosaico = Mo;
})(window.ESP);

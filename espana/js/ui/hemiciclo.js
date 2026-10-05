/* Hemiciclo SVG genérico: cada escaño es un círculo. Sirve para el parlamento nacional, el Parlamento Europeo y los resultados. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const VOTO = { si: 'var(--si)', no: 'var(--no)', abs: 'var(--abs)', aus: 'var(--aus)', pend: '#2a3a55' };

  const H = {
    VOTO,
    /* Posiciones de N escaños en filas concéntricas (semicírculo). */
    posiciones(N, filas, r0, r1) {
      const radios = Array.from({ length: filas }, (_, i) => r0 + (r1 - r0) * i / Math.max(1, filas - 1));
      const tot = U.suma(radios);
      const cant = radios.map(r => Math.round(N * r / tot));
      let dif = N - U.suma(cant);
      for (let i = filas - 1; dif !== 0; i = (i - 1 + filas) % filas) { cant[i] += Math.sign(dif); dif -= Math.sign(dif); }
      const pos = [];
      radios.forEach((r, i) => {
        const n = cant[i];
        for (let k = 0; k < n; k++) pos.push({ a: n === 1 ? Math.PI / 2 : Math.PI - Math.PI * k / (n - 1), r, fila: i });
      });
      return pos.sort((p, q) => q.a - p.a || p.r - q.r);
    },

    /* items: [{ color, tt, pol, stroke, op, id }]  (ya ordenados de izquierda a derecha). */
    svg(items, o = {}) {
      const N = items.length;
      const W = 600, Ht = 330, cx = W / 2, cy = 310;
      const filas = o.filas || (N > 500 ? 12 : N > 300 ? 10 : N > 170 ? 8 : N > 90 ? 6 : N > 40 ? 4 : N > 12 ? 3 : 2);
      const r1 = 280, r0 = N > 40 ? r1 * 0.40 : r1 * 0.55;
      const pos = H.posiciones(N, filas, r0, r1);
      const paso = (r1 - r0) / Math.max(1, filas - 1);
      const ult = pos.filter(p => p.fila === filas - 1).length || 1;
      const rs = Math.min(paso * 0.44, (r1 * Math.PI) / ult * 0.44, o.maxR || 14);
      let s = `<svg class="graf hemiciclo" viewBox="0 0 ${W} ${Ht}" style="max-height:${o.altoMax || 420}px">`;
      s += `<defs><radialGradient id="gHem" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="${o.fondo || '#1f3a78'}"/><stop offset="1" stop-color="#0a111d" stop-opacity="0"/></radialGradient></defs>`;
      s += `<path d="M${cx - r1 - 18},${cy}A${r1 + 18},${r1 + 18} 0 0 1 ${cx + r1 + 18},${cy}Z" fill="url(#gHem)" opacity=".5"/>`;
      pos.forEach((p, i) => {
        const it = items[i]; if (!it) return;
        const x = cx + p.r * Math.cos(p.a), y = cy - p.r * Math.sin(p.a);
        s += `<circle class="curul" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rs.toFixed(1)}" fill="${it.color}"${it.pol ? ` data-pol="${it.pol}"${it.voto ? ` data-voto="${it.voto}"` : ''}` : ''}${it.tt ? C.UI.tt(it.tt) : ''} ${it.stroke ? `stroke="${it.stroke}" stroke-width="3"` : 'stroke="#0A111D" stroke-width="1"'} opacity="${it.op != null ? it.op : 1}"/>`;
      });
      if (o.centro !== false) {
        const may = o.mayoria || Math.floor(N / 2) + 1;
        s += `<text x="${cx}" y="${cy - 52}" text-anchor="middle" style="fill:var(--texto);font-family:var(--display);font-size:38px">${o.centroTxt != null ? o.centroTxt : N}</text>
              <text x="${cx}" y="${cy - 32}" text-anchor="middle" style="fill:var(--tenue);font-size:11px;letter-spacing:.12em">${o.centroSub || ('ESCAÑOS · MAYORÍA ' + may)}</text>`;
      }
      return s + '</svg>';
    },

    /* Hemiciclo por bloques: bloques [{ etq, n, color, tt }] en el orden dado. */
    bloques(bloques, o = {}) {
      const items = [];
      bloques.forEach(b => { for (let i = 0; i < b.n; i++) items.push({ color: b.color, tt: b.tt }); });
      return H.svg(items, o);
    },

    /* Hemiciclo del parlamento del país del jugador (colores por partido, ideología o voto). */
    parlamento(E, o = {}) {
      const orden = H.ordenPartidos(E);
      const ms = E.parl.miembros.map(i => E.politicos[i]).filter(Boolean);
      const ix = m => { const i = orden.indexOf(m.p); return i < 0 ? 99 : i; };
      ms.sort((a, b) => ix(a) - ix(b) || a.eco - b.eco);
      const modo = o.modo || 'partido';
      const items = ms.map(m => {
        const pa = E.partidos[m.p];
        let color = pa ? pa.color : '#888';
        if (modo === 'postura') color = ({ gobierno: '#E0B54A', apoyo: '#C8A860', oposicion: '#5E8DF0' })[pa.postura] || '#8C96A3';
        else if (modo === 'voto') color = VOTO[(o.votos && o.votos[m.id]) || 'pend'];
        else if (modo === 'ideologia') { const v = m.eco / 100; color = v < 0 ? mezcla('#7D8799', '#C0504D', -v) : mezcla('#7D8799', '#4A7BE0', v); }
        return { color, pol: m.id, voto: o.votos && o.votos[m.id], stroke: m.id === 'J' ? '#FFF3C4' : null, id: m.id };
      });
      return H.svg(items, o);
    },

    ordenPartidos(E) {
      const P = E.paises[E.jugador.pais];
      return P.partidos.slice().sort((a, b) => {
        const A = E.partidos[a], B = E.partidos[b];
        return (A.eco + A.soc * 0.35) - (B.eco + B.soc * 0.35);
      });
    },

    /* Hemiciclo del Parlamento Europeo por grupos. */
    europeo(E, o = {}) {
      const pe = E.ue.pe, G = C.DATA.grupos;
      const bl = C.DATA.ordenGrupos.filter(g => pe.escanos[g]).map(g => ({ n: pe.escanos[g], color: G[g].color, tt: `<div class="tt-t">${C.U.esc(G[g].nombre)}</div><div class="tt-f"><span>Eurodiputados</span><b>${pe.escanos[g]}</b></div>` }));
      return H.bloques(bl, Object.assign({ centroSub: 'EURODIPUTADOS', mayoria: Math.floor(pe.total / 2) + 1 }, o));
    },

    leyendaPartidos(E, pid_n) {
      return `<div class="leyenda">${H.ordenPartidos(E).filter(k => pid_n[k]).map(k => `<span${C.UI.tt(C.U.esc(E.partidos[k].nombre))}><i style="background:${E.partidos[k].color}"></i>${C.U.esc(E.partidos[k].sigla)} <b class="num">${pid_n[k]}</b></span>`).join('')}</div>`;
    }
  };
  const mezcla = (a, b, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  C.Hemiciclo = H;
})(window.ESP);

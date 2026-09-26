/* Hemiciclo SVG: cada curul es un círculo con su congresista. El Senado se dibuja en semicírculo;
   la Cámara en herradura, para que cada corporación tenga su propia identidad visual. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const POSTURA = { gobierno: '#E0B54A', independiente: '#8C96A3', oposicion: '#5E8DF0' };
  const VOTO = { si: 'var(--si)', no: 'var(--no)', abs: 'var(--abs)', aus: 'var(--aus)', duda: '#3a4a66', pend: '#2a3a55' };
  const COMISION = ['#E0B54A', '#E04848', '#4A7BE0', '#26B59A', '#5DB85A', '#A15BD1', '#E8812A'];
  const mezcla = (a, b, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const divergente = (v, neg, pos) => v < 0 ? mezcla('#7D8799', neg, Math.min(1, -v)) : mezcla('#7D8799', pos, Math.min(1, v));

  const H = {
    POSTURA, VOTO, COMISION,
    /* Posiciones de N curules en filas concéntricas */
    posiciones(N, filas, a0, a1, r0, r1) {
      const radios = Array.from({ length: filas }, (_, i) => r0 + (r1 - r0) * i / Math.max(1, filas - 1));
      const tot = U.suma(radios);
      let cant = radios.map(r => Math.round(N * r / tot));
      let dif = N - U.suma(cant);
      for (let i = filas - 1; dif !== 0; i = (i - 1 + filas) % filas) { cant[i] += Math.sign(dif); dif -= Math.sign(dif); }
      const pos = [];
      radios.forEach((r, i) => {
        const n = cant[i];
        for (let k = 0; k < n; k++) {
          const a = n === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * k / (n - 1);
          pos.push({ a, r, fila: i });
        }
      });
      return pos.sort((p, q) => q.a - p.a || p.r - q.r);
    },
    colorDe(E, pol, modo, extra) {
      const pid = pol.id === 'J' ? (E.jugador.partido || 'IND') : (pol.partido || 'IND');
      const pa = E.partidos[pid];
      if (modo === 'postura') { const post = pol.id === 'J' ? (E.jugador.postura || (pa && pa.postura)) : (pa && pa.postura); return POSTURA[post || 'independiente']; }
      if (modo === 'ideologia') return divergente(pol.eco / 100, '#C0504D', '#4A7BE0');
      if (modo === 'relacion') return pol.id === 'J' ? '#FFFFFF' : divergente(pol.relJ / 60, '#E8812A', '#26B59A');
      if (modo === 'comision') { const n = pol.id === 'J' ? E.jugador.comision : pol.cargo && pol.cargo.comision; return COMISION[(n || 1) - 1]; }
      if (modo === 'voto') return VOTO[(extra && extra[pol.id]) || 'pend'];
      return pa ? pa.color : '#8C96A3';
    },
    /* Ordena a los miembros de izquierda a derecha por partido e ideología */
    ordenar(E, miembros) {
      const orden = C.Congreso.ordenPartidos(E);
      const ix = p => { const pid = p.id === 'J' ? (E.jugador.partido || 'IND') : (p.partido || 'IND'); const i = orden.indexOf(pid); return i < 0 ? 99 : i; };
      return miembros.slice().sort((a, b) => ix(a) - ix(b) || a.eco - b.eco);
    },
    /* Devuelve el SVG del hemiciclo */
    svg(E, cam, o = {}) {
      const miembros = H.ordenar(E, o.miembros || C.Congreso.miembros(E, cam));
      const N = miembros.length;
      const senado = cam === 'senado';
      const W = 600, Ht = senado ? 330 : 380, cx = W / 2, cy = senado ? 310 : 245;
      const filas = o.filas || (N > 150 ? 9 : N > 90 ? 7 : N > 40 ? 5 : 3);
      const r1 = senado ? 280 : 250, r0 = N > 40 ? r1 * 0.42 : r1 * 0.55;
      const a0 = senado ? Math.PI : Math.PI + 0.38, a1 = senado ? 0 : -0.38;
      const pos = H.posiciones(N, filas, a0, a1, r0, r1);
      const paso = (r1 - r0) / Math.max(1, filas - 1);
      const rs = Math.min(paso * 0.42, (r1 * Math.abs(a0 - a1)) / (pos.filter(p => p.fila === filas - 1).length || 1) * 0.42, 13);
      let s = `<svg class="graf hemiciclo ${senado ? 'h-senado' : 'h-camara'}" viewBox="0 0 ${W} ${Ht}" style="max-height:${o.altoMax || 460}px">`;
      // Fondo del recinto
      if (senado) s += `<path d="M${cx - r1 - 18},${cy}A${r1 + 18},${r1 + 18} 0 0 1 ${cx + r1 + 18},${cy}Z" fill="url(#gSen)" opacity=".5"/>`;
      else s += `<path d="M${cx + (r1 + 18) * Math.cos(a0)},${cy - (r1 + 18) * Math.sin(a0)}A${r1 + 18},${r1 + 18} 0 1 1 ${cx + (r1 + 18) * Math.cos(a1)},${cy - (r1 + 18) * Math.sin(a1)}L${cx},${cy + 30}Z" fill="url(#gCam)" opacity=".5"/>`;
      s += `<defs><radialGradient id="gSen" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#5a1f24"/><stop offset="1" stop-color="#1a0d12" stop-opacity="0"/></radialGradient>
        <radialGradient id="gCam" cx="50%" cy="70%" r="80%"><stop offset="0" stop-color="#15492f"/><stop offset="1" stop-color="#0b1a14" stop-opacity="0"/></radialGradient></defs>`;
      // Mesa directiva / estrado
      s += senado ? `<rect x="${cx - 46}" y="${cy - 26}" width="92" height="22" rx="4" fill="#2a1a20" stroke="#6b3a41"/><text x="${cx}" y="${cy - 11}" text-anchor="middle" style="fill:#e8c9cd;font-size:10px;letter-spacing:.14em">MESA</text>`
                  : `<rect x="${cx - 46}" y="${cy + 6}" width="92" height="22" rx="4" fill="#12301f" stroke="#2f6b49"/><text x="${cx}" y="${cy + 21}" text-anchor="middle" style="fill:#bfe6cf;font-size:10px;letter-spacing:.14em">MESA</text>`;
      const mesa = E.congreso[cam] && E.congreso[cam].mesa || {};
      pos.forEach((p, i) => {
        const pol = miembros[i]; if (!pol) return;
        const x = cx + p.r * Math.cos(p.a), y = cy - p.r * Math.sin(p.a);
        const col = H.colorDe(E, pol, o.modo || 'partido', o.votos);
        const esJ = pol.id === 'J';
        const res = o.resaltar ? o.resaltar.has(pol.id) : true;
        const dir = pol.id === mesa.presidente ? ' mesa' : '';
        s += `<circle id="seat-${pol.id}" class="curul${dir}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rs.toFixed(1)}" fill="${col}" data-pol="${pol.id}"${o.votos ? ` data-voto="${o.votos[pol.id] || ''}"` : ''} ${esJ ? 'stroke="#FFF3C4" stroke-width="3"' : dir ? 'stroke="#fff" stroke-width="1.5"' : 'stroke="#0A111D" stroke-width="1"'} opacity="${res ? 1 : 0.18}"/>`;
      });
      if (o.centro !== false) {
        const may = o.mayoria || Math.floor(N / 2) + 1;
        s += `<text class="h-centro" x="${cx}" y="${cy - (senado ? 70 : 24)}" text-anchor="middle" style="fill:var(--texto);font-family:var(--display);font-size:34px">${o.centroTxt || N}</text>
              <text x="${cx}" y="${cy - (senado ? 52 : 6)}" text-anchor="middle" style="fill:var(--tenue);font-size:11px;letter-spacing:.12em">${o.centroSub || (senado ? 'SENADORES' : 'REPRESENTANTES') + ' · MAYORÍA ' + may}</text>`;
      }
      return s + '</svg>';
    },
    /* Leyenda del modo de color */
    leyenda(E, cam, modo, miembros) {
      const esc = U.esc;
      if (modo === 'postura') return `<div class="leyenda">${Object.entries(POSTURA).map(([k, c]) => `<span><i style="background:${c}"></i>${{ gobierno: 'Gobierno', independiente: 'Independiente', oposicion: 'Oposición' }[k]}</span>`).join('')}</div>`;
      if (modo === 'ideologia') return `<div class="leyenda"><span><i style="background:#C0504D"></i>Izquierda</span><span><i style="background:#7D8799"></i>Centro</span><span><i style="background:#4A7BE0"></i>Derecha</span></div>`;
      if (modo === 'relacion') return `<div class="leyenda"><span><i style="background:#E8812A"></i>Hostil contigo</span><span><i style="background:#7D8799"></i>Neutral</span><span><i style="background:#26B59A"></i>Aliado tuyo</span></div>`;
      if (modo === 'comision') return `<div class="leyenda">${C.DATA.comisiones.map((c, i) => `<span><i style="background:${COMISION[i]}"></i>${c.nombre}</span>`).join('')}</div>`;
      if (modo === 'voto') return `<div class="leyenda"><span><i style="background:var(--si)"></i>A favor</span><span><i style="background:var(--no)"></i>En contra</span><span><i style="background:var(--abs)"></i>Abstención</span><span><i style="background:var(--aus)"></i>Ausente</span></div>`;
      const cnt = U.contar(miembros || C.Congreso.miembros(E, cam), p => p.id === 'J' ? (E.jugador.partido || 'IND') : (p.partido || 'IND'));
      return `<div class="leyenda">${C.Congreso.ordenPartidos(E).filter(p => cnt[p]).map(p => `<span${C.UI.tt(esc(E.partidos[p].nombre))}><i style="background:${E.partidos[p].color}"></i>${esc(E.partidos[p].sigla)} <b class="num">${cnt[p]}</b></span>`).join('')}</div>`;
    }
  };
  C.Hemiciclo = H;
})(window.CURUL);

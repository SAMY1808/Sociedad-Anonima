/* Gráficos SVG propios (sin dependencias): líneas, barras, donas, medidores, radar, apiladas.
   Todos devuelven cadenas SVG con zonas de hover (data-tt) que usa el tooltip global. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const tt = C.UI.tt;
  const niceTicks = (min, max, n = 4) => {
    const r = max - min || 1, paso0 = r / n, mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const paso = [1, 2, 2.5, 5, 10].map(m => m * mag).find(p => p >= paso0) || paso0;
    const out = []; for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso) out.push(+v.toFixed(6));
    return out;
  };

  const G = {
    /* Serie temporal. series: [{nombre, color, datos:[[t,v]]}] */
    linea(series, o = {}) {
      const W = o.ancho || 520, H = o.alto || 180, pl = o.padIzq || 36, pr = 12, pt = 10, pb = 22;
      const todos = series.flatMap(s => s.datos);
      if (!todos.length) return `<div class="vacio">Sin datos todavía</div>`;
      let min = o.min != null ? o.min : Math.min(...todos.map(d => d[1])), max = o.max != null ? o.max : Math.max(...todos.map(d => d[1]));
      if (max - min < 1e-6) { max += 1; min -= 1; }
      const pad = (max - min) * 0.08; if (o.min == null) min -= pad; if (o.max == null) max += pad;
      const t0 = Math.min(...todos.map(d => d[0])), t1 = Math.max(...todos.map(d => d[0])) || t0 + 1;
      const x = t => pl + (t - t0) / ((t1 - t0) || 1) * (W - pl - pr), y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
      const fy = o.fmt || (v => U.d1(v));
      let s = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${o.altoCss || H + 'px'}">`;
      for (const v of niceTicks(min, max, 4)) s += `<line class="rejilla" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${fy(v)}</text>`;
      if (o.ref != null && o.ref >= min && o.ref <= max) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(o.ref)}" y2="${y(o.ref)}" stroke="#5d6c85" stroke-dasharray="4 4"/>`;
      // Etiquetas de fecha (inicio, medio, fin)
      for (const t of [t0, Math.round((t0 + t1) / 2), t1]) s += `<text x="${x(t)}" y="${H - 6}" text-anchor="${t === t0 ? 'start' : t === t1 ? 'end' : 'middle'}">${U.fmtT(t)}</text>`;
      for (const se of series) {
        if (!se.datos.length) continue;
        const d = se.datos.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1)).join('');
        if (o.area && series.length === 1) s += `<path d="${d}L${x(se.datos[se.datos.length - 1][0])},${H - pb}L${x(se.datos[0][0])},${H - pb}Z" fill="${se.color}" opacity=".12"/>`;
        s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
        const u = se.datos[se.datos.length - 1];
        s += `<circle cx="${x(u[0])}" cy="${y(u[1])}" r="3.5" fill="${se.color}" stroke="#0A111D" stroke-width="2"/>`;
      }
      // Zonas de hover por columna de tiempo
      const ts = [...new Set(todos.map(d => d[0]))].sort((a, b) => a - b);
      const paso = Math.max(1, Math.ceil(ts.length / 90));
      for (let i = 0; i < ts.length; i += paso) {
        const t = ts[i], xa = x(t), wa = Math.max(3, (W - pl - pr) / ts.length * paso);
        const html = `<div class="tt-t">${U.fmtT(t)}</div>` + series.map(se => { const p = se.datos.find(d => d[0] === t); return p ? `<div class="tt-f"><span><i class="pto" style="background:${se.color}"></i> ${esc(se.nombre)}</span><b>${fy(p[1])}${o.unidad || ''}</b></div>` : ''; }).join('');
        s += `<rect x="${xa - wa / 2}" y="${pt}" width="${wa}" height="${H - pt - pb}" fill="transparent"${tt(html)}/>`;
      }
      s += '</svg>';
      if (series.length > 1 && o.leyenda !== false) s += `<div class="leyenda">${series.map(se => `<span><i style="background:${se.color}"></i>${esc(se.nombre)}</span>`).join('')}</div>`;
      return s;
    },
    sparkline(datos, color, W = 110, H = 30) {
      if (!datos || datos.length < 2) return '';
      const vs = datos.map(d => d[1]), min = Math.min(...vs), max = Math.max(...vs), r = max - min || 1;
      const d = datos.map((p, i) => (i ? 'L' : 'M') + (i / (datos.length - 1) * (W - 4) + 2).toFixed(1) + ',' + (H - 3 - (p[1] - min) / r * (H - 6)).toFixed(1)).join('');
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
    },
    /* Barras horizontales: items [{etq, v, color, tt, sub}] */
    barrasH(items, o = {}) {
      const max = o.max || Math.max(...items.map(i => i.v), 1);
      return `<div class="col" style="gap:7px">${items.map(i => `
        <div${i.tt ? tt(i.tt) : ''} style="display:grid;grid-template-columns:${o.anchoEtq || '92px'} 1fr ${o.anchoValor || '52px'};gap:8px;align-items:center;font-size:12.5px">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.etq}</span>
          <div class="barra-h" style="height:${o.grosor || 10}px"><i style="width:${Math.max(0, i.v) / max * 100}%;background:${i.color || 'var(--oro)'}"></i>${o.marca != null ? `<span style="position:absolute;left:${o.marca / max * 100}%;top:-2px;bottom:-2px;width:2px;background:#fff;opacity:.7"></span>` : ''}</div>
          <span class="num" style="text-align:right;color:var(--texto2)">${o.fmt ? o.fmt(i.v) : U.d1(i.v)}</span>
        </div>`).join('')}</div>`;
    },
    /* Barras verticales (con valores negativos) */
    barrasV(items, o = {}) {
      const W = o.ancho || 520, H = o.alto || 160, pb = 30, pt = 12;
      const vals = items.map(i => i.v), max = Math.max(0, ...vals), min = Math.min(0, ...vals), r = max - min || 1;
      const y = v => pt + (max - v) / r * (H - pt - pb);
      const bw = (W - 10) / items.length;
      let s = `<svg class="graf" viewBox="0 0 ${W} ${H}" style="height:${H}px"><line class="eje" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>`;
      items.forEach((i, k) => {
        const x = 5 + k * bw + bw * 0.18, w = bw * 0.64, y0 = y(Math.max(0, i.v)), h = Math.abs(y(i.v) - y(0));
        s += `<rect x="${x}" y="${y0}" width="${w}" height="${Math.max(1, h)}" rx="3" fill="${i.color || 'var(--oro)'}"${tt(i.tt || `<b>${esc(i.etq)}</b>: ${U.d1(i.v)}`)}/>`;
        s += `<text x="${x + w / 2}" y="${H - 12}" text-anchor="middle">${esc(i.etq)}</text>`;
        if (o.valores) s += `<text x="${x + w / 2}" y="${i.v >= 0 ? y0 - 4 : y0 + h + 11}" text-anchor="middle" style="fill:var(--texto2)">${o.fmt ? o.fmt(i.v) : U.d1(i.v)}</text>`;
      });
      return s + '</svg>';
    },
    /* Dona: items [{etq, v, color}] */
    dona(items, o = {}) {
      const S = o.tam || 150, r = S / 2 - 4, ri = r * (o.grosor || 0.62), cx = S / 2, cy = S / 2;
      const tot = U.suma(items.map(i => i.v)) || 1;
      let a = -Math.PI / 2, s = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`;
      for (const i of items) {
        if (i.v <= 0) continue;
        const a2 = a + i.v / tot * Math.PI * 2 - 0.012, g = a2 - a > Math.PI ? 1 : 0;
        const p = (ang, rr) => (cx + rr * Math.cos(ang)).toFixed(2) + ',' + (cy + rr * Math.sin(ang)).toFixed(2);
        s += `<path d="M${p(a, r)}A${r},${r} 0 ${g} 1 ${p(a2, r)}L${p(a2, ri)}A${ri},${ri} 0 ${g} 0 ${p(a, ri)}Z" fill="${i.color}"${tt(`<b>${esc(i.etq)}</b>: ${U.n(i.v)} (${U.d1(i.v / tot * 100)} %)`)}/>`;
        a = a2 + 0.012;
      }
      if (o.centro) s += `<text x="${cx}" y="${cy + 2}" text-anchor="middle" style="fill:var(--texto);font-family:var(--display);font-size:${S / 6}px">${o.centro}</text>`;
      if (o.sub) s += `<text x="${cx}" y="${cy + S / 8}" text-anchor="middle" style="fill:var(--tenue);font-size:10px">${o.sub}</text>`;
      return s + '</svg>';
    },
    /* Medidor semicircular 0-100 */
    medidor(v, o = {}) {
      const S = o.tam || 140, r = S / 2 - 8, cx = S / 2, cy = S / 2 + 4;
      const col = o.color || (v >= 55 ? 'var(--bien)' : v >= 40 ? 'var(--alerta)' : 'var(--mal)');
      const ang = Math.PI * (1 - U.clamp(v, 0, 100) / 100);
      const p = a => (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy - r * Math.sin(a)).toFixed(1);
      return `<div class="medidor"${o.tt ? tt(o.tt) : ''}><svg width="${S}" height="${S / 2 + 14}" viewBox="0 0 ${S} ${S / 2 + 14}">
        <path d="M${p(Math.PI)}A${r},${r} 0 0 1 ${p(0)}" fill="none" stroke="#1f2e4a" stroke-width="10" stroke-linecap="round"/>
        <path d="M${p(Math.PI)}A${r},${r} 0 0 1 ${p(ang)}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" style="fill:var(--texto);font-family:var(--display);font-size:${S / 5}px">${o.texto || Math.round(v) + '%'}</text>
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" style="fill:var(--tenue);font-size:9.5px;letter-spacing:.1em">${esc(o.etq || '')}</text></svg></div>`;
    },
    /* Radar de n ejes: items [{etq, v(0-100)}] */
    radar(items, o = {}) {
      const S = o.tam || 230, cx = S / 2, cy = S / 2, r = S / 2 - 34, n = items.length;
      const p = (i, f) => [cx + r * f * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), cy + r * f * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)];
      let s = `<svg class="graf" viewBox="0 0 ${S} ${S}" style="max-width:${S}px">`;
      for (const f of [0.25, 0.5, 0.75, 1]) s += `<polygon points="${items.map((_, i) => p(i, f).join(',')).join(' ')}" fill="none" class="rejilla"/>`;
      items.forEach((it, i) => { const [x, y] = p(i, 1.18); s += `<line class="rejilla" x1="${cx}" y1="${cy}" x2="${p(i, 1)[0]}" y2="${p(i, 1)[1]}"/><text x="${x}" y="${y + 3}" text-anchor="middle">${esc(it.etq)}</text>`; });
      s += `<polygon points="${items.map((it, i) => p(i, it.v / 100).join(',')).join(' ')}" fill="rgba(217,180,90,.22)" stroke="var(--oro)" stroke-width="2"/>`;
      items.forEach((it, i) => { const [x, y] = p(i, it.v / 100); s += `<circle cx="${x}" cy="${y}" r="4" fill="var(--oro)"${tt(`<b>${esc(it.etq)}</b>: ${Math.round(it.v)}/100`)}/>`; });
      return s + '</svg>';
    },
    /* Barra apilada 100 % con línea de mayoría: segs [{etq, v, color}] */
    apilada(segs, o = {}) {
      const tot = o.total || U.suma(segs.map(s => s.v)) || 1;
      let x = 0, s = `<div style="position:relative;height:${o.alto || 26}px;display:flex;border-radius:6px;overflow:hidden;gap:2px;background:var(--panel3)">`;
      for (const g of segs) {
        if (g.v <= 0) continue;
        s += `<div${tt(`<b>${esc(g.etq)}</b>: ${U.n(g.v)} (${U.d1(g.v / tot * 100)} %)`)} style="flex:0 0 calc(${g.v / tot * 100}% - 2px);background:${g.color};display:flex;align-items:center;justify-content:center;font-size:11px;color:#0A111D;font-weight:700;overflow:hidden;white-space:nowrap">${g.v / tot > 0.06 ? (o.etiquetas ? esc(g.etq) + ' ' : '') + U.n(g.v) : ''}</div>`;
        x += g.v;
      }
      s += '</div>';
      if (o.mayoria) s = `<div style="position:relative">${s}<div${tt('Mayoría: ' + o.mayoria)} style="position:absolute;top:-5px;bottom:-5px;left:${o.mayoria / tot * 100}%;width:2px;background:#fff;box-shadow:0 0 6px #fff"></div></div>`;
      return s;
    },
    /* Plano ideológico: puntos [{x(eco), y(soc), r, color, etq, tt}] */
    plano(puntos, o = {}) {
      const S = o.tam || 300, m = 22;
      const px = v => m + (v + 100) / 200 * (S - 2 * m), py = v => m + (v + 100) / 200 * (S - 2 * m);
      let s = `<svg class="graf" viewBox="0 0 ${S} ${S}" style="max-width:${o.maxAncho || S + 'px'}">
        <rect x="${m}" y="${m}" width="${S - 2 * m}" height="${S - 2 * m}" fill="#0f1828" stroke="#23334f"/>
        <line class="rejilla" x1="${S / 2}" x2="${S / 2}" y1="${m}" y2="${S - m}"/><line class="rejilla" y1="${S / 2}" y2="${S / 2}" x1="${m}" x2="${S - m}"/>
        <text x="${m + 2}" y="${S / 2 - 4}">Izquierda</text><text x="${S - m - 2}" y="${S / 2 - 4}" text-anchor="end">Derecha</text>
        <text x="${S / 2 + 4}" y="${m + 11}">Progresista</text><text x="${S / 2 + 4}" y="${S - m - 4}">Conservador</text>`;
      for (const p of puntos) s += `<circle cx="${px(p.x)}" cy="${py(p.y)}" r="${p.r || 6}" fill="${p.color}" fill-opacity="${p.op || .85}" stroke="${p.borde || '#0A111D'}" stroke-width="${p.bw || 2}"${p.tt ? tt(p.tt) : ''} ${p.attr || ''}/>` + (p.etq ? `<text x="${px(p.x)}" y="${py(p.y) - (p.r || 6) - 4}" text-anchor="middle" style="fill:var(--texto2);font-weight:600">${esc(p.etq)}</text>` : '');
      return s + '</svg>';
    }
  };
  C.Graf = G;
})(window.CURUL);

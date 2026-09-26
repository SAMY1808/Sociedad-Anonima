/* Partidos: panorama del sistema, fuerza parlamentaria y mapa interno de facciones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};

  const mapaInterno = (E, pa) => {
    const J = E.jugador;
    const puntos = pa.facciones.map(f => ({ x: f.eco, y: f.soc, r: 10 + Math.sqrt(f.peso) * 3.2, color: pa.color, op: .55, borde: '#fff', bw: 1.5, etq: f.nombre,
      tt: `<b>${esc(f.nombre)}</b><br>Peso interno: ${U.n(f.peso)}<br>Líder: ${esc(Comp.nombrePol(E, f.lider))}<br>Relación contigo: ${Math.round(f.relJ)}` }));
    puntos.push({ x: J.ideologia.eco, y: J.ideologia.soc, r: 7, color: '#FFF3C4', borde: '#D9B45A', bw: 3, tt: 'Tu posición' });
    // Zoom al entorno del partido
    return G.plano(puntos, { tam: 340 });
  };

  C.Pantallas.partidos = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      const sel = params.partido || E.ui.partidoSel || J.partido || C.Congreso.ordenPartidos(E).find(p => !E.partidos[p].especial);
      E.ui.partidoSel = sel;
      const cs = C.Congreso.composicion(E, 'senado').porPartido, cc = C.Congreso.composicion(E, 'camara').porPartido;
      const lista = Object.values(E.partidos).filter(p => !p.especial).sort((a, b) => b.popularidad - a.popularidad);
      const pa = E.partidos[sel];
      const miembros = C.Partidos.miembros(E, pa.id);
      const cong = miembros.filter(p => p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante'));
      const gobs = Object.values(E.deptos).filter(d => E.politicos[d.gobernador] && E.politicos[d.gobernador].partido === pa.id);
      const lider = E.politicos[pa.lider];
      const probAval = C.Partidos.probAval(E, pa.id, 'camara');
      // Fuerza territorial: cuota esperada por departamento
      const data = C.DATA.mapa;
      const cuotas = {}; for (const d of Object.values(E.deptos)) cuotas[d.id] = C.Elecciones.cuotas(E, d.id, false)[pa.id] * 100;
      const maxC = Math.max(...Object.values(cuotas));
      const mapa = `<svg class="mapa-col" viewBox="${data.viewBox}" style="max-height:300px">${Object.entries(data.deptos).map(([id, g]) => `<path d="${g.d}" class="depto" fill="${pa.color}" fill-opacity="${U.clamp(0.08 + cuotas[id] / maxC * 0.92, 0.08, 1)}"${UI.tt(`${esc(E.deptos[id].nombre)}: ${U.d1(cuotas[id])} % esperado`)}/>`).join('')}</svg>`;

      el.innerHTML = `<div class="cab"><div><h1>Partidos políticos</h1><div class="sub">Intención de voto, fuerza parlamentaria, facciones y relaciones.</div></div></div>
        <div class="grid g2">
          <div class="tarjeta"><h3>Sistema de partidos</h3>
            <table class="tabla clic-filas"><thead><tr><th>Partido</th><th>Intención</th><th>Tendencia</th><th>Senado</th><th>Cámara</th><th>Postura</th></tr></thead><tbody>
            ${lista.map(p => `<tr data-part="${p.id}" class="${p.id === sel ? 'sel' : ''}"><td><span class="sigla"><i class="pto" style="background:${p.color}"></i>${esc(p.nombre)}</span>${p.id === J.partido ? ' <span class="etq oro">Tu partido</span>' : ''}</td><td class="num">${U.d1(p.popularidad)}%</td><td>${G.sparkline((E.series['pop:' + p.id] || []).slice(-26), p.color, 70, 22)}</td><td class="num">${cs[p.id] || 0}</td><td class="num">${cc[p.id] || 0}</td><td>${Comp.postura(p.postura)}</td></tr>`).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Mapa ideológico</h3>
            <div style="display:flex;justify-content:center">${G.plano([...lista.map(p => ({ x: p.eco, y: p.soc, r: 5 + Math.sqrt((cs[p.id] || 0) + (cc[p.id] || 0)) * 1.6, color: p.color, op: .8, etq: p.sigla, tt: `<b>${esc(p.nombre)}</b><br>${(cs[p.id] || 0) + (cc[p.id] || 0)} congresistas · ${U.d1(p.popularidad)} %`, attr: `data-part="${p.id}" style="cursor:pointer"` })), { x: J.ideologia.eco, y: J.ideologia.soc, r: 7, color: '#FFF3C4', borde: '#D9B45A', bw: 3, tt: 'Tú' }], { tam: 380 })}</div>
            <div class="tenue" style="font-size:12px;text-align:center">Tamaño = congresistas. El punto dorado eres tú.</div></div>
        </div>

        <div class="tarjeta partido-ficha" style="margin-top:14px;border-top:4px solid ${pa.color}">
          <div class="fila" style="justify-content:space-between;align-items:flex-start">
            <div class="fila"><div class="logo-partido" style="background:${pa.color}">${esc(pa.sigla)}</div><div><h2 style="font-size:24px">${esc(pa.nombre)}</h2><div class="tenue">«${esc(pa.lema)}» · ${Comp.etiquetaIdeo(pa.eco)} · ${pa.soc > 25 ? 'conservador' : pa.soc < -25 ? 'progresista' : 'moderado'}</div></div></div>
            <div class="fila">${J.partido === pa.id ? '<span class="etq oro">Militas aquí</span>' : UI.botonAccion('afiliarse', { partido: pa.id }, 'Afiliarme')}</div></div>
          <div class="grid g4" style="margin-top:12px">${Comp.kpi('Intención de voto', U.d1(pa.popularidad) + '%', Comp.delta(E.series['pop:' + pa.id], 3))}${Comp.kpi('Congresistas', cong.length, `${cs[pa.id] || 0} senadores · ${cc[pa.id] || 0} representantes`)}${Comp.kpi('Gobernaciones', gobs.length)}${Comp.kpi('Militantes', U.n(pa.militantes))}</div>
          <div class="grid g3" style="margin-top:14px">
            <div><h3 class="sub-h">Mapa interno del partido</h3>${mapaInterno(E, pa)}</div>
            <div><h3 class="sub-h">Facciones</h3><div class="lista">${pa.facciones.map(f => `<div class="it accion-form"><div class="cuerpo"><b>${esc(f.nombre)}</b><span>Peso ${U.n(f.peso)} · líder ${esc(Comp.nombrePol(E, f.lider))}</span><div class="barra-h" style="margin-top:4px"><i style="width:${f.peso / U.suma(pa.facciones.map(x => x.peso)) * 100}%;background:${pa.color}"></i></div></div><div style="text-align:right">${Comp.relacion(f.relJ)}${J.partido === pa.id ? '<br>' + UI.botonAccion('reunionPartido', { faccion: f.id }, 'Reunión', 'chico') : ''}</div></div>`).join('')}</div>
              <h3 class="sub-h" style="margin-top:12px">Dirección</h3>${lider ? `<div class="lista"><div class="it clic" data-ficha="${lider.id}">${Comp.avatar(E, lider, 36)}<div class="cuerpo"><b>${esc(lider.nombre)}</b><span>Director nacional · ${esc(C.Politicos.etiquetaCargo(E, lider))}</span></div></div></div>` : ''}
              <div class="tt-f" style="margin-top:8px"><span class="tenue">Cohesión de bancada</span><b>${pa.cohesion}/100</b></div>
              <div class="tt-f"><span class="tenue">Maquinaria territorial</span><b>${Math.round(pa.estructura * 100)}/100</b></div>
              <div class="tt-f"><span class="tenue">Finanzas</span><b>${U.cop(pa.finanzas)}</b></div>
              <div class="tt-f"><span class="tenue">Relación contigo</span>${Comp.relacion(pa.relJ)}</div>
              <div class="tt-f"><span class="tenue">Probabilidad de aval (Cámara)</span><b>${Math.round(probAval * 100)}%</b></div></div>
            <div><h3 class="sub-h">Fuerza territorial</h3>${mapa}<div class="tenue" style="font-size:12px">Intensidad = votación esperada al Congreso por departamento.</div></div>
          </div>
          <h3 class="sub-h" style="margin-top:14px">Bancada en el Congreso</h3>
          <div class="curules-mini grande">${C.Hemiciclo.ordenar(E, cong).map(p => `<span class="curul-mini" data-pol="${p.id}" style="background:${pa.color};${p.cargo.tipo === 'senador' ? 'border-radius:3px' : ''}${p.id === 'J' ? ';outline:2px solid #FFF3C4' : ''}"></span>`).join('')}</div>
          <div class="tenue" style="font-size:11.5px">Cuadrados: senadores · círculos: representantes</div>
        </div>`;
      el.onclick = e => {
        const r = e.target.closest('[data-part]'); if (r) return C.App.ir('partidos', { partido: r.dataset.part });
        const f = e.target.closest('[data-ficha],.curul-mini'); if (f) return Comp.fichaPolitico(E, f.dataset.ficha || f.dataset.pol);
      };
    }
  };
})(window.CURUL);

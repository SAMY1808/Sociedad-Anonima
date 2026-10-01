/* Ficha de cualquier país (se abre desde el mapa). */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const SIS = { prop: 'proporcional', mayor: 'mayoritario', mixto: 'mixto' };

  C.Pantallas.pais = {
    render(el) { C.App.ir('dashboard'); },
    abrir(id) {
      const E = C.E, P = E.paises[id], d = D().paises[id], g = P.gob, e = P.ec;
      const pm = E.politicos[g.pm];
      const orden = P.partidos.slice().filter(k => P.escanos[k]).sort((a, b) => (E.partidos[a].eco + E.partidos[a].soc * 0.35) - (E.partidos[b].eco + E.partidos[b].soc * 0.35));
      const bloques = orden.map(k => ({ n: P.escanos[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${P.escanos[k]}</b></div>` }));
      const maj = Math.floor(d.esc / 2) + 1;
      const miembro = P.estado === 'ue', ue = E.ue;
      const sist = Object.assign({}, d, P.sist || {});
      const cuerpo = `<div class="chips" style="margin-bottom:10px">${Comp.etqEstado(P)}${P.euro === true ? '<span class="etq verde">Euro</span>' : P.euro === 'uni' ? '<span class="etq verde">Euro (unilateral)</span>' : '<span class="etq">Moneda propia</span>'}<span class="etq">${U.mill(d.pob)} hab.</span><span class="etq">PIB ${U.eur(e.pib)}</span>${E.jugador.pais === id ? '<span class="etq oro">Tu país</span>' : ''}</div>
        <p style="margin:0 0 10px;font-size:13px;color:var(--texto2)">${esc(d.rasgo)}</p>
        <div class="grid g4" style="margin-bottom:10px"><div class="tarjeta">${Comp.kpi('Crecimiento', U.signo(e.crec) + ' %')}</div><div class="tarjeta">${Comp.kpi('Paro', U.d1(e.paro) + ' %')}</div><div class="tarjeta">${Comp.kpi('Inflación', U.d1(e.infl) + ' %')}</div><div class="tarjeta">${Comp.kpi('Deuda', U.n(e.deuda) + ' %', `<span class="tenue">déficit ${U.d1(e.deficit)} %</span>`)}</div></div>
        <div class="grid g2" style="align-items:start"><div class="tarjeta"><h3>${esc(d.cam)} · ${d.esc} escaños</h3>${H.bloques(bloques, { altoMax: 240, mayoria: maj, centroSub: 'MAYORÍA ' + maj })}
          <div class="tenue" style="font-size:12px;margin-top:4px">Sistema ${SIS[sist.sis]}${sist.um ? ' · umbral ' + U.d1(sist.um) + ' %' : ''} · próximas elecciones ${U.fmtT(P.elec.proxT, true)}</div></div>
          <div class="tarjeta"><h3>Gobierno</h3><div class="fila" style="gap:10px">${Comp.avatar(E, pm, 44)}<div><b>${esc(pm ? pm.n : '—')}</b><div class="tenue" style="font-size:12.5px">${esc(d.jefe)} · ${Comp.partido(E, g.partido, true)}</div></div></div>
            <div class="lista" style="margin-top:8px;font-size:13px"><div class="it"><span class="tenue" style="width:120px">Coalición</span><span>${g.coalicion.map(k => Comp.partido(E, k)).join(' ')}</span></div>${P.pres ? `<div class="it"><span class="tenue" style="width:120px">Presidente</span><b>${esc((E.politicos[P.pres.pol] || {}).n || '—')} (${esc(E.partidos[P.pres.partido].sigla)})</b></div>` : ''}<div class="it"><span class="tenue" style="width:120px">Aprobación</span><b>${U.n(g.aprob)} %</b></div><div class="it"><span class="tenue" style="width:120px">Estabilidad</span><b>${U.n(g.estab)} %</b></div>
              ${miembro ? `<div class="it"><span class="tenue" style="width:120px">En Europa</span><b>${P.meps} eurodiputados · ${U.d1(d.pob / C.UE.poblacionUE(E) * 100)} % de la población</b></div>` : P.estado === 'candidato' ? `<div class="it"><span class="tenue" style="width:120px">Adhesión</span><b>${U.n(P.ue.progreso)} %${P.ue.congelada ? ' · congelada' : ''}</b></div>` : `<div class="it"><span class="tenue" style="width:120px">Relación con la UE</span><b>${U.n(P.ue.rel)} / 100</b></div>`}</div></div></div>
        <div class="tarjeta" style="margin-top:12px"><h3>Partidos</h3><table class="tabla"><thead><tr><th>Partido</th><th>Familia</th><th class="num">Apoyo</th><th class="num">Escaños</th><th>Posición</th></tr></thead><tbody>${P.partidos.slice().sort((a, b) => E.partidos[b].pop - E.partidos[a].pop).map(k => { const p = E.partidos[k]; return `<tr><td>${Comp.partido(E, k, true)}</td><td class="tenue" style="font-size:12px">${esc(D().arquetipos[p.arq].nombre)}</td><td class="num">${U.d1(p.pop)} %</td><td class="num"><b>${P.escanos[k] || 0}</b></td><td>${Comp.postura(p.postura)}</td></tr>`; }).join('')}</tbody></table></div>`;
      UI.modal({ titulo: `${d.bandera} ${d.nombre}`, cuerpo, clase: 'ancho' });
    }
  };
})(window.EUROPA);

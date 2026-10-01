/* Europa: mapa, Consejo, Parlamento Europeo, Comisión, cumbres y ampliación. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const VT = { si: 'A favor', no: 'En contra', abs: 'Abstención' };
  const TIPO = { directiva: 'Directiva', reglamento: 'Reglamento', decision: 'Decisión', cumbre: 'Consejo Europeo' };

  const regla = e => e.may === 'unan' ? '<span class="etq rojo">Unanimidad</span>' : '<span class="etq">Mayoría cualificada</span>';

  const qmvBarra = (E, e, cu) => {
    const nM = C.UE.miembros(E).length;
    return `<div class="barra-qmv"><div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">Estados a favor</span><b>${cu.si}${e.may === 'unan' ? '' : ' / ' + cu.req}</b></div>${e.may === 'unan' ? `<div class="gauge"><i style="width:${cu.no ? 0 : 100}%;background:${cu.no ? 'var(--no)' : 'var(--si)'}"></i></div>` : `<div class="gauge"><i style="width:${Math.min(100, cu.si / nM * 100)}%;background:var(--si)"></i><b style="left:${cu.req / nM * 100}%"></b></div>`}
      ${e.may === 'unan' ? '' : `<div class="fila" style="justify-content:space-between;font-size:12px"><span class="tenue">Población a favor</span><b>${U.d1(cu.pobSi)} % / 65 %</b></div><div class="gauge"><i style="width:${cu.pobSi}%;background:var(--si)"></i><b style="left:65%"></b></div>`}
      <div class="tenue" style="font-size:12px;margin-top:2px">${esc(cu.nota)}</div></div>`;
  };

  const Eu = C.Pantallas.europa = {
    render(el, params) {
      const E = C.E, J = E.jugador, ue = E.ue, P = E.paises[J.pais];
      const tab = (params && params.tab) || E.ui.tabEu || 'mapa';
      E.ui.tabEu = tab;
      const tabs = [['mapa', 'Mapa'], ['consejo', 'Consejo y Comisión'], ['pe', 'Parlamento Europeo'], ['comision', 'Comisión'], ['cumbres', 'Cumbres'], ['ampliacion', 'Ampliación']];
      let cuerpo = '';
      if (tab === 'mapa') cuerpo = Eu.mapa(E);
      else if (tab === 'consejo') cuerpo = Eu.consejo(E);
      else if (tab === 'pe') cuerpo = Eu.pe(E);
      else if (tab === 'comision') cuerpo = Eu.comision(E);
      else if (tab === 'cumbres') cuerpo = Eu.cumbres(E);
      else cuerpo = Eu.ampliacion(E);
      el.innerHTML = `<div class="cab"><div><h1>🇪🇺 Europa</h1><div class="sub">${C.UE.miembros(E).length} Estados miembros · ${ue.pe.total} eurodiputados · próximo Consejo Europeo en ${Comp.semanasA(E, ue.proxCumbre)} · elecciones europeas en ${Comp.semanasA(E, ue.proxPE)}</div></div>
        ${E.ue.pendiente.length ? `<button class="btn prim" id="e-votar">🗳 Votar ahora (${E.ue.pendiente.length})</button>` : ''}</div>
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('europa', { tab: b.dataset.tab }));
      const vb = UI.$('#e-votar', el); if (vb) vb.onclick = () => Eu.modalVoto(0);
      UI.$$('[data-capa]', el).forEach(b => b.onclick = () => { E.ui.capaMapa = b.dataset.capa; C.App.refrescar(); });
      UI.$$('[data-pais]', el).forEach(g => g.onclick = () => C.Pantallas.pais.abrir(g.dataset.pais));
      UI.$$('[data-exp]', el).forEach(b => b.onclick = e => { if (e.target.closest('[data-accion]')) return; Eu.verExp(b.dataset.exp); });
      const se = UI.$('#e-exp', el); if (se) se.onchange = () => { E.ui.expMapa = se.value; C.App.refrescar(); };
      UI.$$('[data-modal]', el).forEach(b => b.onclick = () => C.Pantallas.agenda.abrir(b.dataset.modal));
    },

    mapa(E) {
      const capa = E.ui.capaMapa || 'estado';
      const abiertos = C.UE.abiertos(E);
      let votos = null, extra = '';
      if (capa === 'consejo') {
        const e = E.ue.expedientes[E.ui.expMapa] && E.ue.expedientes[E.ui.expMapa].estado === 'negociacion' ? E.ue.expedientes[E.ui.expMapa] : abiertos[0];
        if (e) { const pr = C.UE.previsionConsejo(E, e, null); votos = pr.votos; extra = `<div class="fila" style="margin:8px 0"><select id="e-exp">${abiertos.map(x => `<option value="${x.id}" ${x.id === e.id ? 'selected' : ''}>${esc(x.t)}</option>`).join('')}</select>${regla(e)}</div>${qmvBarra(E, e, pr.cuenta)}`; }
        else extra = '<div class="vacio">No hay expedientes abiertos.</div>';
      }
      return `<div class="c-dos amplio"><div class="tarjeta"><div class="t-cab"><h3>Mapa de mosaicos</h3>${C.Mosaico.selector(capa)}</div>${C.Mosaico.svg(E, capa, { votos })}${C.Mosaico.leyenda(capa)}</div>
        <div class="col"><div class="tarjeta"><h3>${capa === 'consejo' ? 'Posición del Consejo' : 'Clave'}</h3>${capa === 'consejo' ? extra : '<p style="margin:0;font-size:13px;color:var(--texto2)">Cada ficha es un país en su posición aproximada. Pulsa sobre cualquiera para ver su parlamento, gobierno y economía.</p>'}</div>
        <div class="tarjeta"><h3>Estado de la Unión</h3><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:160px">Presidencia de la Comisión</span><b>${esc(E.ue.comision.presidente.n)}</b></div><div class="it"><span class="tenue" style="width:160px">Gobiernos por familia</span><span>${Eu.familias(E)}</span></div><div class="it"><span class="tenue" style="width:160px">Zona euro</span><b>${Object.values(E.paises).filter(p => p.estado === 'ue' && p.euro === true).length} países</b></div><div class="it"><span class="tenue" style="width:160px">Tratados</span><b>${E.ue.sinVeto ? 'Sin unanimidad en la mayoría de políticas' : 'Unanimidad en fiscalidad y exteriores'}</b></div></div></div></div></div>`;
    },
    familias(E) {
      const m = {}; C.UE.miembros(E).forEach(c => { const g = E.paises[c].gob; const f = D().grupos[E.partidos[g.partido].grupo].sigla; m[f] = (m[f] || 0) + 1; });
      return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="etq" style="background:${D().grupos[k].color}33">${k} ${n}</span>`).join(' ');
    },

    consejo(E) {
      const ab = C.UE.abiertos(E);
      const miembro = E.paises[E.jugador.pais].estado === 'ue';
      const card = e => {
        const pr = C.UE.previsionConsejo(E, e, null), pe = C.UE.votoPE(E, e, null);
        return `<div class="tarjeta clic" data-exp="${e.id}"><div class="fila" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap;gap:8px"><div style="min-width:0"><b style="font-size:15px">${esc(e.t)}</b><div class="tenue" style="font-size:12.5px">${TIPO[e.tipo]} · ${esc(D().sectores[e.s].nombre)} · votación en ${Comp.semanasA(E, e.tVoto)}</div></div>${regla(e)}</div>
          <div class="grid g2" style="margin-top:8px;gap:12px"><div><div class="tenue" style="font-size:11.5px;letter-spacing:.08em;text-transform:uppercase">Consejo (proyección)</div>${qmvBarra(E, e, pr.cuenta)}</div>
          <div><div class="tenue" style="font-size:11.5px;letter-spacing:.08em;text-transform:uppercase">Parlamento (proyección)</div>${G.apilada([{ etq: 'A favor', v: pe.si, color: 'var(--si)' }, { etq: 'Abst.', v: pe.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pe.no, color: 'var(--no)' }], { total: pe.total, mayoria: Math.floor(pe.total / 2) + 1, alto: 16 })}<div class="tenue" style="font-size:12px;margin-top:4px">${pe.si} sí · ${pe.no} no ${pe.ok ? '· <b class="bien">pasaría</b>' : '· <b class="mal">no pasaría</b>'}</div></div></div></div>`;
      };
      const hist = E.ue.historico.slice(0, 14);
      return `<div class="fila" style="margin-bottom:10px;gap:8px"><button class="btn" data-modal="cabildear_exp">🔀 Cabildear un expediente</button>${E.jugador.cargo === 'mep' ? '<button class="btn" data-modal="ponencia">📑 Ponencia</button>' : ''}${E.jugador.cargo === 'comisario' ? '<button class="btn" data-modal="proponer_exp">🇪🇺 Proponer texto</button>' : ''}${UI.botonAccion('viajar_bruselas', {}, '✈️ Viajar a Bruselas', '')}</div>
        <div class="col">${ab.length ? ab.map(card).join('') : '<div class="vacio">No hay expedientes abiertos ahora mismo.</div>'}</div>
        <div class="tarjeta" style="margin-top:14px"><h3>Decididos recientemente</h3><div class="lista" style="font-size:13px">${hist.map(h => { const e = E.ue.expedientes[h.id]; return `<div class="it ${e ? 'clic' : ''}" ${e ? `data-exp="${e.id}"` : ''}><span>${h.ok ? '🟢' : '🔴'}</span><div class="cuerpo"><b style="white-space:normal">${esc(e ? e.t : h.tpl)}</b><span>${U.fmtT(h.t, true)} · ${esc(e ? e.resultado || '' : '')}</span></div></div>`; }).join('') || '<div class="vacio">Aún no hay decisiones.</div>'}</div></div>`;
    },

    verExp(id) {
      const E = C.E, e = E.ue.expedientes[id]; if (!e) return;
      const miembro = E.paises[E.jugador.pais].estado === 'ue';
      const votos = e.cons ? e.cons.votos : C.UE.previsionConsejo(E, e, null).votos;
      const cuenta = e.cons ? C.UE.cuentaConsejo(E, e, e.cons.votos) : C.UE.previsionConsejo(E, e, null).cuenta;
      const pe = e.pe || C.UE.votoPE(E, e, null);
      const grid = C.UE.miembros(E).sort((a, b) => D().paises[b].pob - D().paises[a].pob).map(c => `<div class="cp ${votos[c] || ''}"${UI.tt(Eu.factoresTT(E, c, e))}>${D().paises[c].bandera} ${c}${c === E.jugador.pais ? ' ★' : ''}</div>`).join('');
      const cuerpo = `<p style="margin:0 0 8px;font-size:14px">${esc(e.d)}</p><div class="chips" style="margin-bottom:10px"><span class="etq">${TIPO[e.tipo]}</span>${regla(e)}<span class="etq">Posición: ${Comp.ideoTxt(e)}</span><span class="etq ${e.estado === 'adoptado' ? 'verde' : e.estado === 'rechazado' ? 'rojo' : 'oro'}">${e.estado === 'negociacion' ? 'En negociación' : e.estado === 'adoptado' ? 'Adoptado' : e.estado === 'rechazado' ? 'Rechazado' : e.estado}</span></div>
        <h3 style="font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase;margin:8px 0">${e.cons ? 'Voto en el Consejo' : 'Posición de los Gobiernos (proyección)'}</h3><div class="consejo-grid">${grid}</div>${qmvBarra(E, e, cuenta)}
        ${e.tipo !== 'cumbre' ? `<h3 style="font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase;margin:12px 0 8px">Parlamento Europeo${e.pe ? '' : ' (proyección)'}</h3>${G.apilada([{ etq: 'A favor', v: pe.si, color: 'var(--si)' }, { etq: 'Abst.', v: pe.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pe.no, color: 'var(--no)' }], { total: pe.total || E.ue.pe.total, mayoria: Math.floor((pe.total || E.ue.pe.total) / 2) + 1, alto: 20 })}
        <div class="leyenda">${Object.entries(pe.porGrupo || {}).map(([g, v]) => `<span><i style="background:${D().grupos[g].color}"></i>${g}: ${v.si}↑ ${v.no}↓ ${v.abs}·</span>`).join('')}</div>` : ''}
        ${e.resultado ? `<div class="nota" style="margin-top:10px"><b>Resultado:</b> ${esc(e.resultado)}</div>` : ''}
        <div class="lista" style="margin-top:10px;font-size:12.5px">${e.hist.map(h => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('')}</div>`;
      UI.modal({ titulo: e.t, icono: '🇪🇺', cuerpo, clase: 'medio', pie: e.estado === 'negociacion' ? `<div class="fila">${UI.botonAccion('cabildear_exp', { exp: e.id, lado: 'si' }, '👍 Cabildear a favor', '')}${UI.botonAccion('cabildear_exp', { exp: e.id, lado: 'no' }, '👎 Cabildear en contra', '')}</div>` : null });
    },
    factoresTT(E, c, e) {
      const d = D().paises[c];
      const ps = C.UE.posicion(E, c, e);
      return `<div class="tt-t">${d.bandera} ${esc(d.nombre)}</div>` + ps.factores.map(f => `<div class="tt-f"><span>${esc(f[0])}</span><b class="${f[1] >= 0 ? 'bien' : 'mal'}">${U.signo(f[1], 2)}</b></div>`).join('') + `<div class="tt-f"><span>Voto previsto</span><b>${VT[ps.voto]}</b></div>`;
    },

    pe(E) {
      const pe = E.ue.pe, G_ = D().grupos, J = E.jugador, P = E.paises[J.pais];
      const del = pe.porPais[J.pais] || {};
      return `<div class="grid g-dash"><div class="tarjeta"><h3>Parlamento Europeo · ${pe.total} escaños</h3>${H.europeo(E, { altoMax: 360 })}</div>
        <div class="col"><div class="tarjeta"><h3>Grupos</h3><table class="tabla"><tbody>${D().ordenGrupos.filter(k => pe.escanos[k]).map(k => `<tr><td><i class="pto" style="background:${G_[k].color}"></i> <b>${k}</b> <span class="tenue" style="font-size:12px">${esc(G_[k].nombre)}</span></td><td class="num"><b>${pe.escanos[k]}</b></td><td class="num tenue">${U.d1(pe.escanos[k] / pe.total * 100)} %</td></tr>`).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Delegación de ${esc(D().paises[J.pais].nombre)}</h3>${P.estado === 'ue' ? `<div class="lista" style="font-size:13px">${Object.entries(del).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="it">${Comp.partido(E, k, true)}<span class="tenue" style="margin-left:auto">${n} · ${D().grupos[E.partidos[k].grupo].sigla}</span></div>`).join('')}</div>${J.candidatoPE ? '<div class="nota" style="margin-top:8px">🗳 Eres candidato/a en la lista de tu partido.</div>' : ''}${UI.botonAccion('candidatura_pe', {}, '🗳 Pedir puesto en la lista', 'chico')}` : '<div class="vacio" style="padding:8px">Tu país no tiene representación en la Eurocámara.</div>'}</div></div></div>`;
    },

    comision(E) {
      const c = E.ue.comision, J = E.jugador;
      return `<div class="tarjeta" style="margin-bottom:14px"><div class="fila" style="gap:14px">${Comp.avatar(E, { n: c.presidente.n, p: null }, 56)}<div><div style="font-size:21px;font-family:var(--display)">${esc(c.presidente.n)}${c.presidente.jugador ? ' <span class="etq oro">Tú</span>' : ''}</div><div class="tenue">Presidencia de la Comisión Europea · ${D().paises[c.presidente.pais].bandera} ${esc(D().paises[c.presidente.pais].nombre)} · ${esc(D().grupos[c.presidente.grupo].sigla)} · desde ${U.fmtT(c.t0)}</div></div></div>
        <div class="tenue" style="font-size:12.5px;margin-top:8px">Agenda de la Comisión: ${Comp.ideoTxt(c.centro)}</div></div>
        <div class="tarjeta"><table class="tabla"><thead><tr><th>País</th><th>Comisario/a</th><th>Cartera</th><th>Partido</th></tr></thead><tbody>${Object.values(c.comisarios).sort((a, b) => D().paises[b.pais].pob - D().paises[a.pais].pob).map(k => `<tr${k.jugador ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${D().paises[k.pais].bandera} ${esc(D().paises[k.pais].nombre)}</td><td>${esc(k.n)}${k.jugador ? ' <span class="etq oro">Tú</span>' : ''}</td><td>${esc((D().carteras[k.cartera] || ['—'])[0])}</td><td>${E.partidos[k.partido] ? Comp.partido(E, k.partido) : ''}</td></tr>`).join('')}</tbody></table></div>`;
    },

    cumbres(E) {
      const ue = E.ue;
      return `<div class="tarjeta" style="margin-bottom:14px"><h3>Próximo Consejo Europeo</h3><div class="kpi-fila">${Comp.kpi('Fecha', U.fmtT(ue.proxCumbre), `<span class="tenue">en ${Comp.semanasA(E, ue.proxCumbre)}</span>`)}</div><p class="tenue" style="font-size:12.5px;margin:6px 0 0">Los jefes de Estado y de Gobierno deciden por consenso: cualquier líder puede vetar. Sólo el jefe de Gobierno de un Estado miembro participa activamente.</p></div>
        ${ue.cumbres.length ? ue.cumbres.map(cu => `<div class="tarjeta" style="margin-bottom:10px"><h3>Cumbre · ${U.fmtT(cu.t)}</h3><div class="lista" style="font-size:13px">${cu.expedientes.map(id => { const e = ue.expedientes[id]; return e ? `<div class="it clic" data-exp="${e.id}"><span>${e.estado === 'adoptado' ? '🟢' : e.estado === 'rechazado' ? '🔴' : '⏳'}</span><div class="cuerpo"><b style="white-space:normal">${esc(e.t)}</b><span>${esc(e.resultado || 'Pendiente')}</span></div></div>` : ''; }).join('')}</div></div>`).join('') : '<div class="vacio">Todavía no se ha celebrado ninguna cumbre.</div>'}`;
    },

    ampliacion(E) {
      const cands = Object.keys(E.paises).filter(c => E.paises[c].estado === 'candidato').sort((a, b) => E.paises[b].ue.progreso - E.paises[a].ue.progreso);
      const uk = E.paises.UK;
      return `<div class="grid g2"><div class="tarjeta"><h3>Candidatos a la adhesión</h3>${cands.map(c => { const P = E.paises[c], d = D().paises[c]; return `<div style="margin-bottom:12px" ${c === E.jugador.pais ? 'class="nota"' : ''}><div class="fila" style="justify-content:space-between"><span>${d.bandera} <b>${esc(d.nombre)}</b> ${P.ue.congelada ? '<span class="etq rojo">Congelada</span>' : ''}</span><b class="num">${U.n(P.ue.progreso)} %</b></div>${Comp.barraRango(P.ue.progreso, P.ue.congelada ? '#7A5D6B' : 'var(--oro)')}<div class="tenue" style="font-size:11.5px;margin-top:2px">${P.ue.clusters} de 6 grupos abiertos · Gobierno ${esc(E.partidos[P.gob.partido].sigla)}</div></div>`; }).join('') || '<div class="vacio">No quedan candidatos.</div>'}</div>
        <div class="col"><div class="tarjeta"><h3>Reino Unido y la UE</h3>${uk.estado === 'exue' ? `<div class="kpi-fila">${Comp.kpi('Relación', U.n(uk.ue.rel) + ' / 100', '')}</div>${Comp.barraRango(uk.ue.rel, '#7A5D6B')}<p class="tenue" style="font-size:12.5px;margin:6px 0 0">Cuanto mayor es la relación, más posible es un acuerdo de reintegración parcial o un referéndum de regreso.</p>` : `<div class="nota">El Reino Unido ya es ${uk.estado === 'ue' ? 'miembro de la UE' : 'candidato a reincorporarse'}.</div>`}</div>
          <div class="tarjeta"><h3>Cómo se adhiere un país</h3><ol style="margin:0;padding-left:18px;font-size:13px;color:var(--texto2);line-height:1.6"><li>Los Gobiernos de los candidatos aprueban reformas (leyes de armonización y Estado de derecho).</li><li>El Consejo Europeo decide por <b>unanimidad</b> abrir grupos de capítulos.</li><li>Al completar el 100 %, el país se une a la UE: escaños en el Parlamento Europeo, voto en el Consejo y un comisario.</li><li>Un Gobierno euroescéptico puede congelar el proceso.</li></ol>${E.paises[E.jugador.pais].estado !== 'ue' ? '<div style="margin-top:10px">' + UI.botonAccion('dialogo_ue', {}, '🤝 Diálogo con Bruselas', '') + '</div>' : ''}</div></div></div>`;
    },

    /* Resultado de las elecciones europeas. */
    nochePE(n) {
      const E = C.E, G_ = D().grupos, pe = E.ue.pe;
      const antes = C.DATA.ordenGrupos.map(k => ({ etq: k, v: n.antes[k] || 0, color: G_[k].color }));
      const filas = C.DATA.ordenGrupos.filter(k => (n.despues[k] || 0) || (n.antes[k] || 0)).map(k => { const d = (n.despues[k] || 0) - (n.antes[k] || 0); return `<tr><td><i class="pto" style="background:${G_[k].color}"></i> <b>${k}</b> <span class="tenue" style="font-size:12px">${esc(G_[k].nombre)}</span></td><td class="num"><b>${n.despues[k] || 0}</b></td><td class="num ${d > 0 ? 'bien' : d < 0 ? 'mal' : 'tenue'}">${U.signo(d, 0)}</td></tr>`; }).join('');
      const del = n.deleg ? Object.entries(n.deleg).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${Comp.partido(E, k)} <b>${v}</b>`).join(' · ') : '';
      const cuerpo = `<div class="grid g2" style="align-items:start"><div>${H.europeo(E, { altoMax: 280 })}</div><div><table class="tabla"><thead><tr><th>Grupo</th><th class="num">Escaños</th><th class="num">Cambio</th></tr></thead><tbody>${filas}</tbody></table></div></div>
        ${del ? `<div class="nota" style="margin-top:10px"><b>Tu país:</b> ${del}</div>` : ''}<div class="nota" style="margin-top:10px"><b>Nueva Comisión:</b> presidida por ${esc(n.presidente)}. Los Gobiernos nominan a sus comisarios en las próximas semanas.</div>`;
      const m = UI.modal({ titulo: '🇪🇺 Elecciones europeas', cuerpo, clase: 'medio', sinCerrar: true, pie: '<button class="btn prim" id="pe-ok">Continuar</button>' });
      UI.$('#pe-ok', m.el).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    },

    /* Decisión del jugador en el Consejo / Parlamento Europeo / cumbre. */
    modalVoto(idx) {
      const E = C.E, it = E.ue.pendiente[idx]; if (!it) return C.App.revisarPendientes();
      const e = E.ue.expedientes[it.exp];
      if (!e) { E.ue.pendiente.splice(idx, 1); return C.App.revisarPendientes(); }
      const J = E.jugador;
      const opciones = ['si', 'abs', 'no'];
      let prev;
      const lineas = opciones.map(v => {
        if (it.rol === 'pe') { const r = C.UE.votoPE(E, e, v); return { v, ok: r.ok, txt: `${r.si} sí · ${r.no} no`, extra: '' }; }
        const r = C.UE.previsionConsejo(E, e, v); return { v, ok: r.cuenta.ok, txt: r.cuenta.nota, extra: '' };
      });
      const base = it.rol === 'pe' ? null : C.UE.previsionConsejo(E, e, null);
      const mi = it.rol === 'pe' ? null : C.UE.posicion(E, J.pais, e);
      const grid = it.rol === 'pe' ? '' : `<div class="consejo-grid">${C.UE.miembros(E).sort((a, b) => D().paises[b].pob - D().paises[a].pob).map(c => `<div class="cp ${base.votos[c]}"${UI.tt(Eu.factoresTT(E, c, e))}>${D().paises[c].bandera} ${c}${c === J.pais ? ' ★' : ''}</div>`).join('')}</div>`;
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${TIPO[e.tipo]} · ${it.rol === 'pe' ? 'Parlamento Europeo' : it.rol === 'cumbre' ? 'Consejo Europeo' : 'Consejo de la UE'} · ${regla(e)}</div><p style="margin:6px 0 10px;font-size:14.5px">${esc(e.d)}</p>
        <div class="chips" style="margin-bottom:10px"><span class="etq">Posición: ${Comp.ideoTxt(e)}</span>${mi ? `<span class="etq">Línea de tu Gobierno: ${VT[mi.voto]}</span>` : ''}</div>${grid}
        <div class="voto-btns">${lineas.map(l => `<button class="btn ${l.v} ${mi && mi.voto === l.v ? 'linea' : ''}" data-v="${l.v}"><b>${VT[l.v]}</b><span style="font-size:11px;color:${l.ok ? 'var(--si)' : 'var(--no)'}">${l.ok ? '✔ Se aprobaría' : '✘ No se aprobaría'}</span><span class="tenue" style="font-size:10.5px;white-space:normal">${esc(l.txt)}</span></button>`).join('')}</div>`;
      const m = UI.modal({ titulo: (it.rol === 'pe' ? 'Eurocámara · ' : 'Consejo · ') + e.t, icono: '🇪🇺', cuerpo, clase: 'medio', sinCerrar: true });
      m.cuerpo.addEventListener('click', ev => {
        const b = ev.target.closest('[data-v]'); if (!b) return;
        const r = C.UE.decidir(E, E.ue.pendiente.indexOf(it), b.dataset.v);
        m.cerrar(); C.App.refrescar();
        UI.toast(r ? `${r.estado === 'adoptado' ? '✔ Adoptado' : '✘ Rechazado'}: ${esc(r.t)}` : 'Hecho', r && r.estado === 'adoptado' ? 'bien' : 'mal');
        C.App.revisarPendientes();
      });
    }
  };
})(window.EUROPA);

/* Territorio: mapa de provincias, comunidades autónomas, procés e independentismo, estatutos, financiación y municipios. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const FASE = { distension: ['Distensión', 'verde'], tension: ['Tensión', 'amar'], unilateral: ['Desafío unilateral', 'rojo'], dui: ['Declaración unilateral', 'rojo'], '155': ['Artículo 155', 'rojo'] };

  const bloquesReg = (E, esc_) => Object.keys(esc_).filter(k => esc_[k] && E.partidos[k]).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).map(k => ({ n: esc_[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${esc_[k]}</b></div>` }));

  const T = C.Pantallas.territorio = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      const tab = (params && params.tab) || E.ui.tabTer || 'mapa';
      E.ui.tabTer = tab;
      let cuerpo = '';
      if (tab === 'mapa') cuerpo = T.mapa(E);
      else if (tab === 'ccaa') cuerpo = T.tabla(E);
      else if (tab === 'competencias') cuerpo = T.competencias(E);
      else if (tab === 'proces') cuerpo = T.proces(E);
      else if (tab === 'estatutos') cuerpo = T.estatutos(E);
      else if (tab === 'financiacion') cuerpo = T.financiacion(E);
      else if (tab === 'presupuesto') cuerpo = T.presupuesto(E);
      else cuerpo = T.municipios(E);
      el.innerHTML = `<div class="cab"><div><h1>🗺 Territorio</h1><div class="sub">17 comunidades y 2 ciudades autónomas · 52 circunscripciones · 67 grandes ayuntamientos · relación media con Moncloa ${Math.round(U.prom(C.Territorio.ids().map(c => E.esp.ccaa[c].relM)))}</div></div></div>
        <div class="tabs">${[['mapa', 'Mapa'], ['ccaa', 'Comunidades'], ['competencias', 'Competencias'], ['proces', 'Independentismo'], ['estatutos', 'Estatutos'], ['financiacion', 'Financiación'], ['presupuesto', 'Presupuesto autonómico'], ['munis', 'Municipios']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('territorio', { tab: b.dataset.tab }));
      UI.$$('[data-capa]', el).forEach(b => b.onclick = () => { E.ui.capaEs = b.dataset.capa; C.App.refrescar(); });
      UI.$$('[data-ccaa]', el).forEach(b => b.onclick = e => { if (e.target.closest('[data-accion]')) return; T.verCcaa(b.dataset.ccaa); });
      UI.$$('[data-comp]', el).forEach(b => b.onclick = () => T.verComp(b.dataset.c, b.dataset.comp));
      UI.$$('[data-r]', el).forEach(b => b.onclick = () => C.Pantallas.leyes.ver(b.dataset.r));
      UI.$$('[data-muni]', el).forEach(b => b.onclick = () => T.verMuni(b.dataset.muni));
      const sel = UI.$('#t-orden', el); if (sel) sel.onchange = () => { E.ui.ordenCcaa = sel.value; C.App.refrescar(); };
      C.Pantallas.presupuestos.enlazarRegional(el, E.ui.regPres && E.esp.ccaa[E.ui.regPres] ? E.ui.regPres : (E.jugador.region || 'MAD'));
      const pr = UI.$('#t-pres', el); if (pr) pr.onchange = () => { E.ui.regPres = pr.value; C.App.refrescar(); };
      const fm = UI.$('#t-fm', el); if (fm) fm.onchange = () => { E.ui.filtroMuni = fm.value; C.App.refrescar(); };
    },

    mapa(E) {
      const capa = E.ui.capaEs || 'autonomico';
      const ids = C.Territorio.ids();
      const gob = {}; ids.forEach(c => { const g = E.esp.ccaa[c].gob; if (g) gob[g.partido] = (gob[g.partido] || 0) + 1; });
      return `<div class="c-dos amplio"><div class="tarjeta"><div class="t-cab"><h3>Mapa de mosaicos de España</h3>${C.Mosaico.selectorEs(capa)}</div>${C.Mosaico.provincias(E, capa, { region: E.jugador.region })}${C.Mosaico.leyendaEs(E, capa)}<div class="tenue" style="font-size:12px;margin-top:6px">Cada ficha es una circunscripción del Congreso (diputados que elige). Pulsa una para abrir su comunidad.</div></div>
        <div class="col"><div class="tarjeta"><h3>Presidencias autonómicas</h3>${G.barrasH(Object.keys(gob).sort((a, b) => gob[b] - gob[a]).map(k => ({ etq: Comp.partido(E, k), v: gob[k], color: E.partidos[k].color })), { max: 19, fmt: v => v + ' / 19', anchoEtq: '70px' })}</div>
        <div class="tarjeta"><h3>Alcaldías</h3>${(() => { const a = C.Municipios.alcaldias(E); const t = U.suma(Object.values(a)) || 1; return G.barrasH(Object.keys(a).sort((x, y) => a[y] - a[x]).slice(0, 7).map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: a[k], color: k === 'IND' ? '#7D8799' : E.partidos[k].color })), { max: Math.max(...Object.values(a)) * 1.05, fmt: v => U.n(v), anchoEtq: '70px' }); })()}<div class="tenue" style="font-size:12px;margin-top:6px">${U.n(E.esp.muni.resumen.total)} ayuntamientos · próximas municipales ${U.fmtT(E.esp.muni.proxT, true)}</div></div></div></div>`;
    },

    tabla(E) {
      const orden = E.ui.ordenCcaa || 'poblacion';
      const ids = C.Territorio.ids().sort((a, b) => ({ poblacion: D().ccaa[b].pob - D().ccaa[a].pob, relM: E.esp.ccaa[a].relM - E.esp.ccaa[b].relM, indep: E.esp.ccaa[b].indep - E.esp.ccaa[a].indep, elecciones: E.esp.ccaa[a].parl.proxT - E.esp.ccaa[b].parl.proxT, aut: E.esp.ccaa[b].aut - E.esp.ccaa[a].aut })[orden]);
      return `<div class="fila" style="margin-bottom:8px"><label class="tenue" style="font-size:12px">Ordenar por <select id="t-orden">${[['poblacion', 'Población'], ['relM', 'Peor relación con Moncloa'], ['indep', 'Independentismo'], ['elecciones', 'Próximas elecciones'], ['aut', 'Autogobierno']].map(([k, n]) => `<option value="${k}" ${orden === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <div class="tarjeta"><table class="tabla apila"><thead><tr><th>Comunidad</th><th>Gobierno</th><th>Presidente/a</th><th class="num">Relación</th><th class="num">Indep.</th><th class="num">Autogob.</th><th class="num">Deuda</th><th>Próx. elecciones</th></tr></thead><tbody>${ids.map(c => { const rc = E.esp.ccaa[c], d = D().ccaa[c], pr = rc.gob && E.politicos[rc.gob.pres]; return `<tr class="clic" data-ccaa="${c}"${E.jugador.region === c ? ' style="background:rgba(217,180,90,.08)"' : ''}><td><b>${esc(d.nombre)}</b></td><td>${rc.gob ? Comp.partido(E, rc.gob.partido) + (rc.gob.coalicion.length > 1 ? ' <span class="tenue">+' + (rc.gob.coalicion.length - 1) + '</span>' : '') : '—'}</td><td>${pr ? esc(pr.n) : '—'}</td><td class="num ${rc.relM < 30 ? 'mal' : rc.relM > 60 ? 'bien' : ''}">${Math.round(rc.relM)}</td><td class="num ${rc.indep > 25 ? 'alerta' : ''}">${U.d1(rc.indep)} %</td><td class="num">${Math.round(rc.aut)}</td><td class="num">${Math.round(rc.deuda)} %</td><td class="tenue">${U.fmtT(rc.parl.proxT, true)}${rc.suspendida ? ' · <span class="mal">155</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    },

    proces(E) {
      const ids = Object.keys(D().procesos).sort((a, b) => E.esp.ccaa[b].indep - E.esp.ccaa[a].indep);
      const tarjeta = c => { const conf = D().procesos[c], pr = E.esp.procesos[c], rc = E.esp.ccaa[c], f = FASE[pr.fase], gobSov = rc.gob && rc.gob.coalicion.some(k => E.partidos[k].indep >= conf.indepMin);
        return `<div class="tarjeta"><div class="t-cab"><h3>${esc(D().ccaa[c].nombre)} · ${esc(conf.nombre)}</h3><span class="etq ${f[1]}">${f[0]}</span></div>
          <div class="fila" style="gap:16px;flex-wrap:nowrap;align-items:center">${G.medidor(Math.min(100, rc.indep / conf.umbral * 60), { tam: 110, etq: 'APOYO', texto: U.d1(rc.indep) + ' %', tt: 'Apoyo social: ' + U.d1(rc.indep) + ' % · se activa el desafío con ' + conf.umbral + ' %+' })}
            <div style="font-size:12.5px;flex:1"><div>Relación con Moncloa <b class="num">${Math.round(rc.relM)}</b></div><div>Gobierno ${gobSov ? '<b class="alerta">soberanista</b>' : 'no soberanista'} · umbral de desafío ${conf.umbral} %</div>${rc.suspendida ? '<div class="mal">⚠ Intervenida por el 155</div>' : ''}<div class="tenue" style="margin-top:4px">${pr.historia[0] ? U.fmtT(pr.historia[0].t, true) + ': ' + esc(pr.historia[0].txt) : 'Sin episodios.'}</div></div></div></div>`; };
      const part = ['RCU', 'FUC', 'CPC', 'UVN', 'EHU', 'FGA', 'ACI', 'IPL', 'VUN'].map(s => 'ES_' + s).filter(k => E.partidos[k]);
      return `<div class="grid g-dash"><div class="col">${ids.map(tarjeta).join('')}</div>
        <div class="col"><div class="tarjeta"><h3>Soberanismo por comunidad</h3>${G.barrasH(ids.map(c => ({ etq: esc(D().ccaa[c].nombre), v: E.esp.ccaa[c].indep, color: c === 'CAT' ? '#E8B100' : c === 'PVA' ? '#2E8B3E' : c === 'GAL' ? '#5DADE2' : '#7D8799', tt: `Relación con Moncloa: ${Math.round(E.esp.ccaa[c].relM)}` })), { max: 50, fmt: v => U.d1(v) + ' %', anchoEtq: '120px' })}</div>
          <div class="tarjeta"><h3>Partidos soberanistas y regionalistas</h3><table class="tabla"><thead><tr><th>Partido</th><th>Región</th><th class="num">Apoyo</th><th class="num">Congreso</th></tr></thead><tbody>${part.map(k => { const p = E.partidos[k]; return `<tr><td>${Comp.partido(E, k)}</td><td>${esc(D().ccaa[p.region].nombre)}</td><td class="num">${U.d1(p.rp[p.region])} %</td><td class="num">${E.paises.ES.escanos[k] || 0}</td></tr>`; }).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Palancas del Estado</h3><div class="lista" style="font-size:12.5px"><div class="it"><span>🕊️</span><span>${E.esp.flags.amnistia ? '✔ <b>Amnistía</b> aprobada. ' : '<b>Amnistía</b>, '}<b>indultos</b> y <b>financiación singular</b> bajan el soberanismo catalán y mejoran la relación.</span></div><div class="it"><span>🏛</span><span>Cada <b>competencia</b> transferida y cada <b>estatuto</b> reducen el agravio; los <b>fallos del Estado</b> en lo que no se cede lo alimentan.</span></div><div class="it"><span>⚖️</span><span><b>Tribunal Constitucional</b>: ${E.esp.tc.recursos.length} recursos pendientes.</span></div><div class="it"><span>🚨</span><span>Ante un desafío unilateral: <b>artículo 155</b> (Senado), <b>diálogo</b> o no hacer nada.</span></div></div></div></div></div>`;
    },

    /* Matriz de competencias por comunidad. */
    competencias(E) {
      const ids = C.Territorio.ids(), cp = D().competencias, col = ['#3a465f', '#C99A2B', '#2FA36B'], txt = ['—', '½', '✔'];
      return `<div class="tarjeta"><h3>Competencias transferidas a cada comunidad</h3><p class="tenue" style="font-size:12.5px;margin:0 0 8px">✔ transferida (gestión plena) · ½ compartida o delegada · — del Estado. Pulsa una celda para ver la negociación. <b>Autogobierno</b> = media ponderada de las competencias.</p>
        <div style="overflow:auto"><table class="tabla" style="font-size:12px"><thead><tr><th>Competencia</th>${ids.map(c => `<th class="num" title="${esc(D().ccaa[c].nombre)}">${c}</th>`).join('')}</tr></thead><tbody>${Object.keys(cp).map(k => `<tr><td>${cp[k].icono} ${esc(cp[k].nombre)}${cp[k].ley ? ' <span class="tenue" title="Exige ley orgánica">⚖</span>' : ''}</td>${ids.map(c => { const n = E.esp.ccaa[c].comp[k]; return `<td class="num clic" data-comp="${k}" data-c="${c}" style="background:${col[n]}33;color:${n === 2 ? '#7be0b0' : n === 1 ? '#E0B54A' : '#6b7894'};font-weight:700;cursor:pointer">${txt[n]}</td>`; }).join('')}</tr>`).join('')}
          <tr><td><b>Autogobierno</b></td>${ids.map(c => `<td class="num"><b>${E.esp.ccaa[c].aut}</b></td>`).join('')}</tr></tbody></table></div></div>`;
    },

    verComp(c, k) {
      const E = C.E, rc = E.esp.ccaa[c], cp = D().competencias[k], d = D().ccaa[c], J = E.jugador, Tr = C.Territorio;
      const p = Tr.probComp(E, c, k), propia = J.region === c && ['presauto', 'consejero'].includes(J.cargo);
      const cuerpo = `<p style="margin:0 0 8px;font-size:13px;color:var(--texto2)">${cp.nombre} · ${esc(d.nombre)}</p>
        <div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:170px">Nivel actual</span><b>${Tr.NIV[rc.comp[k]]}</b></div><div class="it"><span class="tenue" style="width:170px">Vía de traspaso</span><b>${cp.ley ? 'Ley orgánica (176 votos + Senado)' : 'Comisión mixta + real decreto'}</b></div><div class="it"><span class="tenue" style="width:170px">Dificultad</span><b>${Math.round(cp.dif * 100)} %</b></div><div class="it"><span class="tenue" style="width:170px">Gestión en esta área</span><b>${Math.round(rc.gestion[cp.area])} / 100</b></div>
        ${rc.comp[k] < 2 ? `<div class="it"><span class="tenue" style="width:170px">Probabilidad de acuerdo</span><b class="${p > 0.5 ? 'bien' : p > 0.28 ? 'alerta' : 'mal'}">${Math.round(p * 100)} %</b></div>` : ''}</div>`;
      const pie = rc.comp[k] >= 2 ? '' : (propia ? UI.botonAccion('reclamar_competencia', { comp: k }, '🏛 Reclamarla', 'prim') : '') + (J.cargo === 'pm' ? UI.botonAccion('ofrecer_comp', { region: c, comp: k }, '🤲 Ofrecer el traspaso', 'prim') : '');
      UI.modal({ titulo: cp.icono + ' ' + cp.nombre, cuerpo, clase: 'medio', pie: pie || null });
    },

    estatutos(E) {
      const ids = C.Territorio.ids();
      const enCortes = C.Congreso.abiertos(E).filter(p => (C.Congreso.plantilla(p.tpl) || {}).efecto === 'estatuto');
      return `<div class="grid g-dash"><div class="tarjeta"><h3>Estatutos de autonomía</h3><table class="tabla apila"><thead><tr><th>Comunidad</th><th class="num">Vigente desde</th><th class="num">Autogobierno</th><th>Reforma</th></tr></thead><tbody>${ids.map(c => { const rc = E.esp.ccaa[c], pr = rc.estatuto.proceso; return `<tr class="clic" data-ccaa="${c}"><td><b>${esc(D().ccaa[c].nombre)}</b></td><td class="num">${rc.estatuto.ano}</td><td class="num">${Math.round(rc.aut)}</td><td>${pr ? `<span class="etq amar">${pr.fase === 'cortes' ? 'En las Cortes' : 'Referéndum autonómico'}</span>` : rc.estatuto.rechazos ? `<span class="etq rojo">Rechazada ×${rc.estatuto.rechazos}</span>` : '<span class="tenue">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="col"><div class="tarjeta"><h3>Cómo se reforma un estatuto</h3><ol style="margin:0;padding-left:18px;font-size:13px;color:var(--texto2);line-height:1.6"><li>El Parlamento autonómico aprueba la propuesta por <b>tres quintos</b>.</li><li>Las Cortes la tramitan como <b>ley orgánica</b> (176 votos en el Congreso; el Senado puede vetarla).</li><li>La comunidad la ratifica en <b>referéndum</b>.</li><li>Si prospera, sube el autogobierno y mejora la relación con Moncloa; si falla, queda como derrota política.</li></ol></div>
          <div class="tarjeta"><h3>En trámite en las Cortes</h3>${enCortes.length ? `<div class="lista" style="font-size:13px">${enCortes.map(p => `<div class="it clic" data-r="${p.id}"><span>📖</span><div class="cuerpo"><b>${esc(p.t)}</b><span>${Comp.etapa(p.etapa)}</span></div></div>`).join('')}</div>` : '<div class="vacio">Ninguna reforma estatutaria en las Cortes.</div>'}</div></div></div>`;
    },

    /* Presupuesto autonómico de una comunidad: estado, reparto por consejerías y crédito disponible. */
    presupuesto(E) {
      const J = E.jugador, c = E.ui.regPres && E.esp.ccaa[E.ui.regPres] ? E.ui.regPres : (J.region || 'MAD');
      if (!E.esp.ccaa[c].gob) return '<div class="vacio">Sin gobierno autonómico.</div>';
      return C.Pantallas.presupuestos.regional(E, c);
    },

    financiacion(E) {
      const ids = C.Territorio.ids().filter(c => !['CEU', 'MEL'].includes(c)), cu = E.esp.cupo;
      const rg = k => ids.filter(c => E.esp.ccaa[c].fin.regimen === k).length;
      const items = ids.slice().sort((a, b) => E.esp.ccaa[b].fin.nivel - E.esp.ccaa[a].fin.nivel).map(c => ({ etq: esc(D().ccaa[c].nombre), v: E.esp.ccaa[c].fin.nivel, color: { foral: '#2E8B3E', canario: '#5DADE2', singular: '#E8B100', comun: '#7D8799' }[E.esp.ccaa[c].fin.regimen], tt: `${esc(D().regimenes[E.esp.ccaa[c].fin.regimen].nombre)} · cesión ${E.esp.ccaa[c].fin.cesion} % · deuda ${Math.round(E.esp.ccaa[c].deuda)} %` }));
      return `<div class="grid g2"><div class="tarjeta"><h3>Financiación por habitante (media = 100)</h3>${G.barrasH(items, { max: 150, fmt: v => Math.round(v), anchoEtq: '130px' })}<div class="leyenda"><span><i style="background:#2E8B3E"></i>Foral</span><span><i style="background:#5DADE2"></i>Canario</span><span><i style="background:#E8B100"></i>Singular</span><span><i style="background:#7D8799"></i>Común</span></div></div>
        <div class="col"><div class="tarjeta"><h3>Regímenes</h3><div class="lista" style="font-size:13px">${Object.keys(D().regimenes).map(k => `<div class="it" style="align-items:flex-start"><div class="cuerpo"><b>${esc(D().regimenes[k].nombre)} <span class="etq">${rg(k)}</span></b><span style="white-space:normal">${esc(D().regimenes[k].desc)}</span></div></div>`).join('')}</div></div>
          <div class="tarjeta"><h3>Concierto y Convenio</h3><p style="margin:0;font-size:13px;color:var(--texto2)">País Vasco (Concierto) y Navarra (Convenio) recaudan casi todos sus impuestos y pagan un <b>cupo</b> al Estado, que se renegocia cada cinco años en el Consejo de Ministros. Próxima renovación: <b>${U.fmtT(cu.proxT)}</b> (${Comp.semanasA(E, cu.proxT)}). Un cupo alto favorece al Estado; uno bajo al gobierno foral, con agravio en el resto.</p></div>
          <div class="tarjeta"><h3>Cómo se negocia</h3><ul style="margin:0;padding-left:18px;font-size:13px;color:var(--texto2);line-height:1.6"><li><b>Más cesión</b> de impuestos o <b>fondo de nivelación</b>: acuerdos con Hacienda según tu relación con Moncloa.</li><li><b>Financiación singular</b>: ley orgánica con 176 votos; difícil y con un gran agravio comparativo.</li><li>El <b>Consejo de Política Fiscal y Financiera</b> (anual) fija el reparto general.</li><li>Deuda y aprobación regional dependen de tu nivel de financiación.</li></ul></div></div></div>`;
    },

    municipios(E) {
      const f = E.ui.filtroMuni || 'todas';
      const lista = Object.values(E.esp.muni.m).filter(m => f === 'todas' || m.ccaa === f).sort((a, b) => b.pob - a.pob);
      const res = E.esp.muni.resumen;
      return `<div class="grid g-dash"><div class="tarjeta"><div class="t-cab"><h3>Grandes ayuntamientos</h3><select id="t-fm"><option value="todas">Todas las comunidades</option>${C.Territorio.ids().map(c => `<option value="${c}" ${f === c ? 'selected' : ''}>${esc(D().ccaa[c].nombre)}</option>`).join('')}</select></div>
        <table class="tabla apila"><thead><tr><th>Ciudad</th><th class="num">Pobl. (miles)</th><th>Alcaldía</th><th>Alcalde/sa</th><th class="num">Aprob.</th></tr></thead><tbody>${lista.map(m => `<tr class="clic" data-muni="${m.id}"${E.jugador.muni === m.id ? ' style="background:rgba(217,180,90,.08)"' : ''}><td><b>${esc(m.nombre)}</b></td><td class="num">${U.n(m.pob)}</td><td>${Comp.partido(E, m.alcalde)}${m.coal.length > 1 ? ' <span class="tenue">pacto</span>' : ''}</td><td>${E.politicos[m.pm] ? esc(E.politicos[m.pm].n) + (m.pm === 'J' ? ' (tú)' : '') : '—'}</td><td class="num ${m.aprob < 40 ? 'mal' : m.aprob > 58 ? 'bien' : ''}">${Math.round(m.aprob)}</td></tr>`).join('')}</tbody></table></div>
        <div class="col"><div class="tarjeta"><h3>Alcaldías de España</h3>${G.barrasH(Object.keys(res.alcRes).sort((a, b) => res.alcRes[b] - res.alcRes[a]).slice(0, 8).map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: res.alcRes[k], color: k === 'IND' ? '#7D8799' : E.partidos[k].color })), { max: Math.max(...Object.values(res.alcRes)) * 1.05, fmt: v => U.n(v), anchoEtq: '70px' })}</div>
          <div class="tarjeta"><h3>Concejales en las 67 ciudades</h3>${G.barrasH(Object.keys(res.conc).sort((a, b) => res.conc[b] - res.conc[a]).slice(0, 8).map(k => ({ etq: Comp.partido(E, k), v: res.conc[k], color: E.partidos[k].color })), { max: Math.max(...Object.values(res.conc)) * 1.05, fmt: v => U.n(v), anchoEtq: '70px' })}<p class="tenue" style="font-size:12px;margin:8px 0 0">Municipales: ${U.fmtT(E.esp.muni.proxT)} (${Comp.semanasA(E, E.esp.muni.proxT)}). Umbral del 5 %; si nadie logra mayoría absoluta, los pactos deciden la alcaldía.</p></div></div></div>`;
    },

    /* Ficha de una comunidad. */
    verCcaa(c) {
      const E = C.E, rc = E.esp.ccaa[c], d = D().ccaa[c], J = E.jugador;
      const g = rc.gob, pr = g && E.politicos[g.pres];
      const tot = U.suma(Object.values(rc.parl.escanos)), may = Math.floor(tot / 2) + 1;
      const cuerpo = `<p style="margin:0 0 8px;font-size:13px;color:var(--texto2)">${esc(d.rasgo)}</p>
        <div class="grid g2" style="gap:14px;align-items:start"><div>${H.bloques(bloquesReg(E, rc.parl.escanos), { altoMax: 240, mayoria: may, centroSub: 'ESCAÑOS · MAYORÍA ' + may })}${H.leyendaPartidos(E, rc.parl.escanos)}</div>
          <div><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:150px">Presidente/a</span><b>${pr ? esc(pr.n) + (pr.id === 'J' ? ' (tú)' : '') : '—'}</b></div><div class="it"><span class="tenue" style="width:150px">Gobierno</span><b>${g ? g.coalicion.map(k => Comp.partido(E, k)).join(' ') : '—'}</b></div><div class="it"><span class="tenue" style="width:150px">Aprobación</span><b>${g ? Math.round(g.aprob) : '—'} %</b></div>
            <div class="it"><span class="tenue" style="width:150px">Próximas elecciones</span><b>${U.fmtT(rc.parl.proxT)} (${Comp.semanasA(E, rc.parl.proxT)})</b></div><div class="it"><span class="tenue" style="width:150px">Régimen</span><b>${esc(d.regimen)}</b></div><div class="it"><span class="tenue" style="width:150px">Senadores designados</span><b>${d.sen}</b></div><div class="it"><span class="tenue" style="width:150px">Estatuto</span><b>${rc.estatuto.ano}${d.policia ? ' · policía propia' : ''}${d.lengua ? ' · lengua: ' + esc(d.lengua) : ''}</b></div></div></div></div>
        <div class="grid g4" style="margin-top:12px">${[['Relación con Moncloa', rc.relM, rc.relM > 55 ? 'var(--bien)' : rc.relM > 30 ? 'var(--alerta)' : 'var(--mal)'], ['Independentismo', rc.indep * 1.6, '#E8B100'], ['Autogobierno', rc.aut, '#6CC4F5'], ['Deuda', rc.deuda * 2, '#9AA7C0']].map(([n, v, col], i) => `<div><div class="tenue" style="font-size:11.5px">${n}</div><div style="font-size:19px" class="num">${i === 1 ? U.d1(rc.indep) + ' %' : i === 3 ? Math.round(rc.deuda) + ' %' : Math.round(i === 0 ? rc.relM : rc.aut)}</div>${Comp.barraRango(v, col)}</div>`).join('')}</div>
        ${rc.suspendida ? '<div class="nota" style="margin-top:10px;border-color:var(--no)">⚠ Autogobierno intervenido por el artículo 155.</div>' : ''}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Competencias</h3>
        <div class="chips">${Object.keys(D().competencias).map(k => `<span class="etq ${rc.comp[k] === 2 ? 'verde' : rc.comp[k] === 1 ? 'amar' : ''}" ${UI.tt(D().competencias[k].nombre + ': ' + C.Territorio.NIV[rc.comp[k]])}>${D().competencias[k].icono} ${rc.comp[k] === 2 ? '✔' : rc.comp[k] === 1 ? '½' : '—'}</span>`).join('')}</div>
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Consejerías y financiación</h3>
        <div class="fila" style="font-size:12.5px;margin-bottom:6px;gap:14px"><span>Régimen: <b>${esc(D().regimenes[rc.fin.regimen].nombre)}</b></span><span>Financiación por habitante: <b class="num">${Math.round(rc.fin.nivel)}</b></span><span>Cesión: <b class="num">${rc.fin.cesion} %</b></span></div>
        ${g && g.consej ? `<table class="tabla" style="font-size:12.5px"><tbody>${C.Territorio.grupos(E, c).map(gr => { const h = g.consej[gr.id]; return `<tr><td>${gr.icono} ${esc(gr.nombre)}</td><td>${h === 'J' ? esc(J.nombre) + ' <span class="etq oro">Tú</span>' : h ? esc(h.n) : '—'}</td><td>${h && h !== 'J' ? Comp.partido(E, h.p) : h === 'J' ? Comp.partido(E, J.partido) : ''}</td><td class="num tenue">gestión ${Math.round(U.prom(gr.atoms.map(a => rc.gestion[a] || 50)))}</td></tr>`; }).join('')}</tbody></table><div class="tenue" style="font-size:12px;margin-top:4px">${g.estr ? g.estr.length : ''} consejerías${(rc.obras || []).filter(o => !o.fin).length ? ' · En construcción: ' + (rc.obras || []).filter(o => !o.fin).map(o => esc(o.nombre)).join(', ') : ''}</div>` : ''}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Ayuntamientos principales</h3>
        <div class="chips">${C.Municipios.porCcaa(E, c).map(m => `<span class="etq">${esc(m.nombre)} · ${Comp.partido(E, m.alcalde)}</span>`).join('') || '<span class="tenue">Sin grandes ayuntamientos en la muestra.</span>'}</div>`;
      const pie = (['pm', 'ministro'].includes(J.cargo) ? UI.botonAccion('visita_ccaa', { region: c }, '🚄 Visitar', '') : '') + (J.cargo === 'presauto' && J.region === c ? UI.botonAccion('pedir_moncloa', {}, '📞 Negociar con Moncloa', '') : '');
      UI.modal({ titulo: d.nombre, icono: '🗺', cuerpo, clase: 'medio', pie: pie || null });
    },

    verMuni(id) {
      const E = C.E, m = E.esp.muni.m[id], tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1;
      const bl = Object.keys(m.esc).filter(k => m.esc[k]).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).map(k => ({ n: m.esc[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Concejales</span><b>${m.esc[k]}</b></div><div class="tt-f"><span>Voto</span><b>${U.d1(m.votos[k])} %</b></div>` }));
      const cuerpo = `<div class="grid g2" style="gap:14px;align-items:start"><div>${H.bloques(bl, { altoMax: 240, mayoria: may, centroSub: 'CONCEJALES · MAYORÍA ' + may })}${H.leyendaPartidos(E, m.esc)}</div>
        <div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:130px">Alcalde/sa</span><b>${E.politicos[m.pm] ? esc(E.politicos[m.pm].n) + (m.pm === 'J' ? ' (tú)' : '') : '—'}</b></div><div class="it"><span class="tenue" style="width:130px">Gobierno municipal</span><b>${m.coal.map(k => Comp.partido(E, k)).join(' ')}</b></div><div class="it"><span class="tenue" style="width:130px">Aprobación</span><b>${Math.round(m.aprob)} %</b></div><div class="it"><span class="tenue" style="width:130px">Población</span><b>${U.n(m.pob)} mil · ${esc(D().ccaa[m.ccaa].nombre)}</b></div><div class="it"><span class="tenue" style="width:130px">Deuda municipal</span><b>${Math.round(m.deuda)} %</b></div><div class="it"><span class="tenue" style="width:130px">Tensión social</span><b>${Math.round(m.tension)}</b></div></div></div>
        <h3 style="margin:12px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Estado de la ciudad</h3>${m.ind ? G.barrasH(C.Municipios.indicesTxt(E, m).map(i => ({ etq: esc(i.nombre), v: i.v, color: i.v >= 62 ? 'var(--bien)' : i.v >= 42 ? 'var(--alerta)' : 'var(--mal)' })), { max: 100, fmt: v => Math.round(v), anchoEtq: '150px' }) : ''}`;
      UI.modal({ titulo: m.nombre, icono: '🏙', cuerpo, clase: 'medio' });
    }
  };
})(window.ESP);

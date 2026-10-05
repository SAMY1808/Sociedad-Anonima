/* Consejo de Ministros: orden del día, ministros y coalición, economía y Presupuestos, iniciativas del presidente. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const TIPO = { ley: ['📜', 'Proyecto de ley'], rdl: ['⚡', 'Real decreto-ley'], rd: ['📋', 'Real decreto'], territorial: ['🗺', 'Petición territorial'], pge: ['💶', 'Presupuestos'], proces: ['🚨', 'Crisis territorial'] };

  const Cn = C.Pantallas.consejo = {
    render(el, params) {
      const E = C.E, J = E.jugador, P = E.paises.ES, g = P.gob, cs = E.esp.consejo;
      const tab = (params && params.tab) || E.ui.tabCons || 'consejo';
      E.ui.tabCons = tab;
      const pm = E.politicos[g.pm], esPM = C.Consejo.pmEsJ(E);
      let cuerpo = '';
      if (tab === 'consejo') cuerpo = Cn.orden(E, esPM);
      else if (tab === 'ministros') cuerpo = Cn.ministros(E);
      else if (tab === 'economia') cuerpo = Cn.economia(E);
      else if (tab === 'iniciativas') cuerpo = Cn.iniciativas(E, esPM);
      else cuerpo = Cn.historial(E);
      el.innerHTML = `<div class="cab"><div><h1>🦅 Consejo de Ministros</h1><div class="sub">${esc(pm ? pm.n : '—')} (${esc(E.partidos[g.partido].sigla)}) · ${g.tipo === 'mayoria' ? 'mayoría' : g.tipo === 'mono' ? 'gobierno en solitario' : 'minoría'} · aprobación ${Math.round(g.aprob)} % · estabilidad ${Math.round(g.estab)} % · ${E.esp.cortes.estado !== 'activa' ? '<span class="alerta">Gobierno en funciones</span>' : 'tensión de coalición ' + Math.round(cs.tension) + ' %'}</div></div>
        <div class="fila">${esPM ? UI.botonAccion('remodelar', {}, '🔄 Remodelar', '') + UI.botonAccion('conferencia', {}, '🏛 Conferencia de Presidentes', '') + UI.botonAccion('cuestion_confianza', {}, '🤞 Confianza', '') : ''}</div></div>
        <div class="tabs">${[['consejo', 'Orden del día' + (cs.agenda.length ? ' (' + cs.agenda.length + ')' : '')], ['iniciativas', 'Iniciativas'], ['ministros', 'Ministros y socios'], ['economia', 'Economía y Presupuestos'], ['historial', 'Acuerdos']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('consejo', { tab: b.dataset.tab }));
      UI.$$('[data-res]', el).forEach(b => b.onclick = () => { const r = C.Consejo.resolver(E, b.dataset.id, b.dataset.res); UI.toast(esc(r || 'Hecho'), 'bien'); C.App.refrescar(); });
      UI.$$('[data-ini]', el).forEach(b => b.onclick = () => { const r = C.Consejo.iniciativaPM(E, b.dataset.ini, b.dataset.via); if (r === true) { C.Personaje.cambiar(E, { prestigio: 1 }); UI.toast('Iniciativa aprobada en el Consejo de Ministros', 'bien'); } else UI.toast(esc(r), 'mal'); C.App.refrescar(); });
      UI.$$('[data-ver-ley]', el).forEach(b => b.onclick = () => Cn.verIniciativa(b.dataset.verLey));
    },

    itemHTML(E, it, esPM) {
      const t = TIPO[it.tipo] || ['📄', ''], ops = C.Consejo.opciones(E, it), q = it.quien || {};
      const tpl = it.tpl ? C.Congreso.plantilla(it.tpl) : null;
      let proj = '';
      if (tpl && esPM) {
        const g = E.paises.ES.gob;
        const pr = C.Congreso.proyectar(E, { may: tpl.may || 'simple', autor: { tipo: 'gobierno', pid: g.partido }, pop: tpl.pop, t: tpl.t, eco: tpl.eco, soc: tpl.soc, eu: tpl.eu, ter: tpl.ter, costo: tpl.costo, apoyo: {}, region: tpl.region });
        proj = `<div class="fila" style="margin-top:6px;font-size:12px;gap:10px"><span class="tenue">Proyección en el Congreso</span><span class="bien">${pr.si} sí</span><span class="mal">${pr.no} no</span><span class="${pr.dist >= 0 ? 'bien' : 'mal'}" style="margin-left:auto">${pr.dist >= 0 ? 'Margen +' + pr.dist : 'Faltan ' + Math.abs(pr.dist)}</span></div>`;
      }
      const quien = q.tipo === 'ministro' && q.min ? `${esc(Comp.nombreMin(q.min))} · ${esc(q.nombre || '')}` : q.tipo === 'socio' ? `Socio: ${Comp.partido(E, q.pid)}` : q.tipo === 'ccaa' ? `Gobierno de ${esc(q.nombre)}` : esc(q.nombre || 'Presidencia');
      return `<div class="tarjeta" style="${it.urgente ? 'border-color:var(--alerta)' : ''}"><div class="fila" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap;gap:10px"><div style="min-width:0"><div class="fila" style="gap:6px"><span style="font-size:18px">${t[0]}</span><b style="font-size:15px">${esc(it.titulo)}</b></div><div class="tenue" style="font-size:12.5px;margin-top:2px">${t[1]} · propone: ${quien} · ${it.urgente ? '<span class="alerta">urgente</span>' : 'hasta ' + U.fmtT(it.limite, true)}</div></div>${tpl ? `<span class="etq">${Comp.mayoriaTxt(tpl.may)}</span>` : ''}</div>
        <p style="margin:8px 0 4px;font-size:13px;color:var(--texto2)">${esc(it.desc || '')}</p>${proj}
        ${esPM ? `<div class="fila" style="margin-top:10px;gap:6px">${ops.map(o => `<button class="btn chico ${o.k === 'enviar' || o.k === 'rdl' || o.k === 'conceder' || o.k === 'aprobar' || o.k === 'presentar' ? 'prim' : ''}" data-id="${it.id}" data-res="${o.k}"${UI.tt(esc(o.d))}>${esc(o.t)}</button>`).join('')}</div>` : ''}</div>`;
    },

    orden(E, esPM) {
      const cs = E.esp.consejo, g = E.paises.ES.gob, pg = E.esp.pge;
      const en = E.esp.cortes.estado !== 'activa';
      return `<div class="grid g-dash"><div class="col">
        ${en ? '<div class="nota">El Gobierno está <b>en funciones</b>: sólo despacha asuntos ordinarios hasta que se forme un nuevo Ejecutivo.</div>' : ''}
        ${cs.agenda.length ? cs.agenda.map(it => Cn.itemHTML(E, it, esPM)).join('') : `<div class="tarjeta"><div class="vacio">${esPM ? 'El orden del día está vacío esta semana. Puedes llevar tus propias iniciativas en la pestaña <b>Iniciativas</b>.' : 'El presidente despacha cada martes el orden del día. Lee los acuerdos recientes en la pestaña <b>Acuerdos</b>.'}</div></div>`}
        ${!esPM ? '<div class="tarjeta"><p class="tenue" style="margin:0;font-size:13px">No presides el Consejo: tus puntos de agenda te permiten <b>proponer iniciativas</b> (como ministro/a), <b>presionar a tu socio</b> o <b>engrasar la coalición</b>.</p></div>' : ''}</div>
        <div class="col"><div class="tarjeta"><h3>Estado del Gobierno</h3>${G.medidor(g.aprob, { tam: 150, etq: 'APROBACIÓN' })}
          <div class="lista" style="font-size:13px;margin-top:6px"><div class="it"><span class="tenue" style="width:150px">Presupuestos</span><b>${pg.estado === 'aprobado' ? 'Aprobados' : 'Prorrogados'}${pg.tramite ? ' · en trámite' : ''}</b></div><div class="it"><span class="tenue" style="width:150px">Autoridad del presidente</span><b>${Math.round(cs.autoridad)}</b></div><div class="it"><span class="tenue" style="width:150px">Tensión en la coalición</span><b class="${cs.tension > 50 ? 'mal' : cs.tension > 30 ? 'alerta' : 'bien'}">${Math.round(cs.tension)} %</b></div></div></div>
          <div class="tarjeta"><h3>Procés</h3><div class="tenue" style="font-size:13px">${({ distension: 'Distensión: sin desafío abierto.', tension: 'Tensión: la Generalitat prepara una hoja de ruta soberanista.', unilateral: 'Desafío unilateral en marcha: el Estado debe responder.', dui: 'Declaración unilateral: crisis constitucional.', '155': 'Artículo 155 en aplicación.' })[E.esp.proces.fase]}</div>
            <div class="fila" style="margin-top:6px;gap:12px;font-size:12.5px"><span>Apoyo independentista <b class="num">${U.d1(E.esp.ccaa.CAT.indep)} %</b></span><span>Relación <b class="num">${Math.round(E.esp.ccaa.CAT.relM)}</b></span></div></div></div></div>`;
    },

    modalUrgente(it) {
      const E = C.E;
      const m = UI.modal({ titulo: '🚨 Decisión del Consejo de Ministros', cuerpo: Cn.itemHTML(E, it, true), clase: 'medio', sinCerrar: true });
      UI.$$('[data-res]', m.el).forEach(b => b.onclick = () => { const r = C.Consejo.resolver(E, b.dataset.id, b.dataset.res); m.cerrar(); UI.toast(esc(r || 'Hecho'), 'bien'); C.App.refrescar(); C.App.revisarPendientes(); });
    },

    ministros(E) {
      const P = E.paises.ES, g = P.gob, cs = E.esp.consejo, pm = E.politicos[g.pm];
      const filas = D().ministerios.map(m => { const id = g.ministros[m.id], q = id ? E.politicos[id] : null; return `<tr${id === 'J' ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${m.icono} ${esc(m.nombre)}${m.vp ? ` <span class="etq oro">VP ${m.vp}</span>` : ''}</td><td>${q ? `<span data-pol="${q.id}">${esc(q.n)}${q.id === 'J' ? ' (tú)' : ''}</span>` : '—'}</td><td>${q ? Comp.partido(E, q.p) : ''}</td><td class="tenue" style="font-size:12px">${q ? Comp.ideoTxt(q) : ''}</td></tr>`; }).join('');
      const socios = g.coalicion.concat(g.apoyoExterno || []);
      return `<div class="grid g-dash"><div class="tarjeta"><div class="fila" style="gap:12px;margin-bottom:8px">${Comp.avatar(E, pm, 44)}<div><b style="font-size:16px">${esc(pm ? pm.n : '—')}</b> ${g.pm === 'J' ? '<span class="etq oro">Tú</span>' : ''}<div class="tenue" style="font-size:12.5px">Presidente/a del Gobierno · ${Comp.partido(E, g.partido, true)}</div></div></div>
        <table class="tabla"><thead><tr><th>Ministerio</th><th>Titular</th><th>Partido</th><th>Perfil</th></tr></thead><tbody>${filas}</tbody></table></div>
        <div class="col"><div class="tarjeta"><h3>Socios y satisfacción</h3>${socios.length ? G.barrasH(socios.map(k => ({ etq: Comp.partido(E, k), v: cs.sat[k] != null ? cs.sat[k] : 55, color: (cs.sat[k] || 55) > 55 ? 'var(--bien)' : (cs.sat[k] || 55) > 30 ? 'var(--alerta)' : 'var(--mal)', tt: g.coalicion.includes(k) ? 'En el Gobierno' : 'Apoyo externo' })), { max: 100, fmt: v => Math.round(v), anchoEtq: '70px' }) : '<div class="vacio">Sin socios.</div>'}<p class="tenue" style="font-size:12px;margin:8px 0 0">Coalición: ${g.coalicion.map(k => Comp.partido(E, k)).join(' ')}. Apoyo externo: ${(g.apoyoExterno || []).map(k => Comp.partido(E, k)).join(' ') || 'ninguno'}.</p></div>
          <div class="tarjeta"><h3>Representación por cartera</h3>${G.barrasH(g.coalicion.map(k => ({ etq: Comp.partido(E, k), v: Object.values(g.ministros).filter(id => E.politicos[id] && E.politicos[id].p === k).length, color: E.partidos[k].color })), { max: 23, fmt: v => v + ' / 23', anchoEtq: '70px' })}</div></div></div>`;
    },

    economia(E) {
      const P = E.paises.ES, ec = P.ec, S = E.series, pg = E.esp.pge;
      const mini = (k, nom, col, fmt) => `<div class="tarjeta"><h3>${nom}</h3>${G.linea([{ nombre: nom, color: col, datos: (S[k] || []).slice(-130) }], { alto: 150, area: true, fmt, unidad: ' %' })}</div>`;
      return `<div class="grid g4" style="margin-bottom:14px">${[['Crecimiento', U.signo(ec.crec) + ' %', ec.crec], ['Paro', U.d1(ec.paro) + ' %', ec.paro], ['Inflación', U.d1(ec.infl) + ' %', ec.infl], ['Déficit', U.d1(ec.deficit) + ' % PIB', ec.deficit]].map(([n, v]) => `<div class="tarjeta">${Comp.kpi(n, v, '')}</div>`).join('')}</div>
        <div class="grid g2">${mini('crec', 'Crecimiento del PIB', '#6CC4F5')}${mini('paro', 'Paro', '#E0B54A')}${mini('infl', 'Inflación', '#E0533F')}${mini('deuda', 'Deuda pública', '#9AA7C0', v => Math.round(v))}</div>
        <div class="grid g2" style="margin-top:14px"><div class="tarjeta"><h3>Presupuestos Generales del Estado</h3><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:170px">Estado</span><b>${pg.estado === 'aprobado' ? '✔ Aprobados' : '↺ Prorrogados'}${pg.tramite ? ' · nuevo proyecto en tramitación' : ''}</b></div><div class="it"><span class="tenue" style="width:170px">Último ejercicio</span><b>${pg.ano}</b></div><div class="it"><span class="tenue" style="width:170px">PIB</span><b>${U.eur(ec.pib)}</b></div></div>
          <p class="tenue" style="font-size:12.5px;margin:8px 0 0">Cada octubre el Gobierno decide presentar Presupuestos o prorrogarlos. Con un Congreso fragmentado, aprobarlos exige negociar con los socios.</p></div>
          <div class="tarjeta"><h3>Reglas fiscales europeas</h3>${ec.pde ? '<div class="nota" style="border-color:var(--no)">⚠ Bruselas ha abierto un <b>procedimiento de déficit excesivo</b>: déficit superior al 3 % y deuda superior al 60 %.</div>' : '<div class="nota">Sin procedimiento abierto. Límites: déficit 3 % del PIB y deuda 60 % (con trayectorias de reducción).</div>'}
            <div class="fila" style="margin-top:8px;gap:14px;font-size:13px"><span>Déficit <b class="num">${U.d1(ec.deficit)} %</b></span><span>Deuda <b class="num">${U.n(ec.deuda)} %</b></span><span>Fondos europeos <b class="num">${E.ue.fondosTotal || 0}</b> tramos</span></div></div></div>`;
    },

    iniciativas(E, esPM) {
      if (!esPM) return '<div class="vacio">Sólo el presidente del Gobierno lleva iniciativas propias al Consejo de Ministros. Como ministro/a puedes proponerlas desde la <b>Agenda</b>.</div>';
      const cat = C.Consejo.catalogo(E);
      const J = E.jugador;
      const sorted = cat.sort((a, b) => b.pr.dist - a.pr.dist);
      return `<p class="tenue" style="margin-top:0">Como presidente/a decides qué lleva el Gobierno al Congreso. Los decretos-ley entran en vigor ya, pero deben ser convalidados en 30 días; sólo sirven para materias que no sean orgánicas ni constitucionales.</p>
        <div class="sel-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${sorted.map(({ tpl: l, pr }) => `<div class="tarjeta"><div class="fila" style="gap:6px"><span>${(D().sectores[l.s] || {}).icono || '📄'}</span><b>${esc(l.t)}</b></div><div class="tenue" style="font-size:12.5px;margin:6px 0">${esc(l.d)}</div>
          <div class="fila" style="gap:6px;margin-bottom:6px"><span class="etq">${Comp.mayoriaTxt(l.may)}</span><span class="etq">Apoyo ${l.pop} %</span>${l.costo ? `<span class="etq ${l.costo > 0 ? 'rojo' : 'verde'}">${l.costo > 0 ? 'Cuesta' : 'Ingresa'} ${U.d1(Math.abs(l.costo))} % PIB</span>` : ''}</div>
          <div class="fila" style="font-size:12px;gap:10px;margin-bottom:8px"><span class="bien">${pr.si} sí</span><span class="mal">${pr.no} no</span><span class="${pr.dist >= 0 ? 'bien' : 'mal'}" style="margin-left:auto">${pr.dist >= 0 ? 'Margen +' + pr.dist : 'Faltan ' + Math.abs(pr.dist)}</span></div>
          <div class="fila" style="gap:6px"><button class="btn chico prim" data-ini="${l.id}" data-via="ley" ${E.esp.cortes.estado !== 'activa' ? 'disabled' : ''}>📜 Proyecto de ley</button>${l.rdl || l.rdlSolo ? `<button class="btn chico" data-ini="${l.id}" data-via="rdl" ${E.esp.cortes.estado !== 'activa' ? 'disabled' : ''}>⚡ Decreto-ley</button>` : ''}</div></div>`).join('')}</div>`;
    },

    historial(E) {
      const h = E.esp.consejo.hist;
      return `<div class="tarjeta"><h3>Acuerdos recientes del Consejo de Ministros</h3>${h.length ? `<div class="lista" style="font-size:13px">${h.map(x => `<div class="it"><span style="font-size:18px">${(TIPO[x.tipo] || ['📄'])[0]}</span><div class="cuerpo"><b style="white-space:normal">${esc(x.titulo)}</b><span>${U.fmtT(x.t, true)} · ${esc(x.txt || '')}</span></div></div>`).join('')}</div>` : '<div class="vacio">Todavía no hay acuerdos.</div>'}</div>`;
    }
  };
})(window.ESP);

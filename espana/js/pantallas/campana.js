/* Campaña (generales y autonómicas): panel con el asesor de la semana, presupuesto, provincias, encuestas, debate, coaliciones y sucesos. También el aporte a las noches electorales. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const pct = x => x >= 9 ? '—' : x * 100 < 1 ? 'menos de 1 %' : Math.round(x * 100) + ' %';

  const Cp = C.Pantallas.campana = {
    /* Selector de ámbito cuando hay varias campañas a la vez. */
    selector(E, camps, cur) {
      if (camps.length < 2) return '';
      return `<div class="seg" style="margin-bottom:12px">${camps.map(x => `<button data-camp-scope="${x.key}" class="${x.camp === cur ? 'activo' : ''}">${x.key === 'gen' ? '🇪🇸 Generales' : '🗺 ' + esc(D().ccaa[x.key].nombre)}</button>`).join('')}</div>`;
    },

    render(E) {
      const Ca = C.Campana, camps = Ca.camps(E), camp = Ca.cur(E);
      if (!camp) return Cp.fuera(E);
      const J = E.jugador, pid = J.partido, gen = camp.ambito === 'gen', pr = camp.presup, libre = Ca.libre(camp), topeAv = pr.gastado > camp.tope;
      const sem = Ca.semanasHasta(E, camp), peso = Ca.peso(E, camp), cis = Ca.ultimaEncuesta(E, null, camp);
      const ords = Object.keys((cis || { votos: {} }).votos).sort((a, b) => cis.votos[b] - cis.votos[a]).slice(0, 8);
      const serie = ords.slice(0, 5).map(k => ({ nombre: E.partidos[k].sigla, color: E.partidos[k].color, datos: camp.enc.filter(x => x.tipo === 'cis').slice().reverse().map(x => [x.t, x.votos[k]]) }));
      const cons = Ca.consejos(E, camp);
      const asesor = `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>🧭 Tu semana de campaña</h3><span class="etq oro">${sem} semanas · ◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
        <div class="lista">${cons.map((c, i) => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${c.icono}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal;font-weight:500">${esc(c.txt)}</b></div>${c.accion ? UI.botonAccion(c.accion, c.args, c.label, 'chico' + (i === 0 ? ' prim' : '')) : ''}</div>`).join('') || '<div class="vacio" style="padding:10px">Todo en marcha: no hay nada urgente.</div>'}</div>
        ${peso ? `<div class="fila" style="margin-top:10px;gap:6px">${UI.botonAccion('campana_auto', {}, '⚡ Campaña automática (reparte el presupuesto)', 'chico')}</div>` : ''}</div>`;
      const presup = `<div class="tarjeta"><div class="t-cab"><h3>💶 Presupuesto de campaña</h3><span class="etq ${topeAv ? 'rojo' : ''}">Tope legal ${camp.tope} M€</span></div>
        <div class="barra-h" style="height:10px;margin:6px 0"><i style="width:${Math.min(100, pr.gastado / Math.max(1, pr.total + pr.credito) * 100)}%;background:${topeAv ? 'var(--no)' : 'var(--oro)'}"></i></div>
        <div class="fila" style="gap:10px;font-size:12.5px"><span>Gastado <b>${U.d1(pr.gastado)}</b> M€</span><span>Disponible <b>${U.d1(libre)}</b> M€</span>${pr.credito ? `<span class="tenue">crédito ${pr.credito} M€</span>` : ''}</div>
        ${topeAv ? '<div class="nota" style="margin-top:8px;border-color:var(--no)">⚠ Has superado el tope legal: te caerá una multa del Tribunal de Cuentas.</div>' : ''}
        <div class="fila" style="gap:6px;margin-top:10px;flex-wrap:wrap">${peso ? UI.botonAccion('credito_campana', {}, '🏦 Crédito', 'chico') + UI.botonAccion('movilizar_votantes', {}, '🗳️ Movilizar', 'chico') : ''}${UI.botonAccion('apelar_voto_util', {}, '🎯 Voto útil', 'chico')}</div></div>`;
      const encu = `<div class="tarjeta"><h3>📊 Encuestas${gen ? '' : ' · ' + esc(D().ccaa[camp.c].nombre)}</h3>${serie[0] && serie[0].datos.length > 1 ? G.linea(serie, { alto: 150, unidad: ' %' }) : ''}
        <table class="tabla" style="margin-top:6px"><thead><tr><th>Partido</th><th class="num">CIS</th><th class="num">Propia</th><th class="num">Prensa</th></tr></thead><tbody>${ords.map(k => { const f = t => { const e = Ca.ultimaEncuesta(E, t, camp); return e && e.votos[k] != null ? U.d1(e.votos[k]) + ' %' : '—'; }; return `<tr${k === pid ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${Comp.partido(E, k)}</td><td class="num">${f('cis')}</td><td class="num">${f('propia')}</td><td class="num">${f('prensa')}</td></tr>`; }).join('')}</tbody></table>
        <div class="fila" style="gap:6px;margin-top:8px">${peso ? UI.botonAccion('encargar_encuesta', { tipo: 'propia' }, '📊 Encuesta propia', 'chico') : ''}${UI.botonAccion('encargar_encuesta', { tipo: 'prensa' }, '📰 Sondeo de un medio', 'chico')}</div>
        <div class="tenue" style="font-size:12px;margin-top:6px">Cada encuesta tiene margen de error: la propia es la más precisa y mejora tu información por provincias.</div></div>`;
      const debate = camp.debate.hecho ? `<div class="nota">Debate celebrado: ${camp.debate.res.map((k, i) => `${i + 1}º ${esc(E.partidos[k].sigla)}`).join(' · ')}</div>` : `<div class="nota">📺 Debate decisivo en ${Math.max(0, camp.debate.t - E.fecha.t)} semana(s) (${U.fmtT(camp.debate.t, true)}). ${Ca.debateJugador(E, camp) ? 'Como candidato/a, tú participas.' : 'Los candidatos de los primeros partidos se enfrentan.'}</div>`;
      const sucesos = `<div class="tarjeta"><h3>🗞 Sucesos de campaña</h3><div class="lista" style="font-size:12.5px">${camp.sucesos.slice(0, 8).map(s => `<div class="it"><span class="tenue" style="width:80px">${U.fmtT(s.t, true)}</span><span>${esc(s.txt)}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Sin sucesos todavía.</div>'}</div></div>`;
      // Territorio
      let terr;
      if (gen) {
        const provs = Ca.provincias(E).sort((a, b) => a.disputa - b.disputa).slice(0, 14);
        const filas = provs.map(p => `<tr><td><b>${esc(p.nombre)}</b><br><span class="tenue" style="font-size:11.5px">${p.n} esc.${p.esfuerzo ? ' · esfuerzo ' + U.d1(p.esfuerzo) : ''}</span></td><td class="num">${p.esc}</td><td>${p.ganar < 0.12 ? `<span class="etq verde">Escaño más con ${p.ganar * 100 < 1 ? 'menos de 1 %' : '+' + pct(p.ganar)} de voto</span>` : p.ganar < 0.3 ? `<span class="etq amar">+${pct(p.ganar)} → otro escaño</span>` : '<span class="tenue" style="font-size:12px">Lejos del siguiente</span>'}${p.perder != null && p.perder < 0.12 ? ` <span class="etq rojo">Riesgo: −${pct(p.perder)} y pierdes uno</span>` : ''}</td><td style="text-align:right;white-space:nowrap">${UI.botonAccion('mitin_prov', { prov: p.id }, '📣', 'chico')} ${peso ? `<button class="btn chico" data-gastar-prov="${p.id}">💶</button>` : ''}</td></tr>`).join('');
        terr = `<div class="tarjeta"><div class="t-cab"><h3>🗺 Provincias en disputa</h3></div><div class="tenue" style="font-size:12.5px;margin-bottom:6px">Donde un pequeño empujón te da o te quita un escaño (D'Hondt). Margen de error de tu estimación: ±${Ca.propiaReciente(E, camp) ? 3 : 7} %.</div><table class="tabla apila"><thead><tr><th>Provincia</th><th class="num">Tus esc.</th><th>Situación</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`;
      } else {
        const ri = Ca.regInfo(E, camp.c), ts = Ca.territoriosAut(E, camp.c);
        const filas = ts.map(t => `<tr><td><b>${esc(t.nombre)}</b><br><span class="tenue" style="font-size:11.5px">${Math.round(t.peso * 100)} % del voto${t.esfuerzo ? ' · esfuerzo ' + U.d1(t.esfuerzo) : ''}</span></td><td style="text-align:right;white-space:nowrap">${UI.botonAccion('mitin_prov', { prov: t.id }, '📣', 'chico')} ${peso ? `<button class="btn chico" data-gastar-prov="${t.id}">💶</button>` : ''}</td></tr>`).join('');
        terr = `<div class="tarjeta"><div class="t-cab"><h3>🗺 ${esc(D().ccaa[camp.c].nombre)}: dónde se juega</h3><span class="etq">Mayoría ${ri.may} de ${ri.n}</span></div>
          <div class="nota" style="margin-bottom:8px">Tu partido: <b>${ri.esc}</b> escaños previstos (${U.d1(ri.voto)} %). ${ri.ganar < 0.15 ? `<span class="bien">${ri.ganar * 100 < 1 ? 'Con menos de un 1 % más de voto' : 'Con un ' + pct(ri.ganar) + ' más de voto'} ganas un escaño.</span>` : `Necesitas un ${pct(ri.ganar)} más de voto para sumar otro.`} ${ri.perder != null && ri.perder < 0.15 ? `<span class="mal">Riesgo: con un ${pct(ri.perder)} menos pierdes uno.</span>` : ''}</div>
          <table class="tabla apila"><thead><tr><th>Provincia</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`;
      }
      const canales = Object.keys(Ca.CANALES).filter(k => !Ca.CANALES[k].prov).map(k => { const c = Ca.CANALES[k]; return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${c.icono}</span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(c.n)}</b><span>${esc(c.d)}</span></div><span class="etq">${Ca.coste(camp, k)} M€</span>${peso ? UI.botonAccion('gasto_campana', { canal: k }, 'Contratar', 'chico') : ''}</div>`; }).join('');
      const gasto = `<div class="tarjeta"><h3>📢 Gasto de campaña</h3><div class="lista">${canales}</div>${peso ? '' : '<p class="tenue" style="font-size:12.5px;margin:8px 0 0">Sólo la dirección gestiona el presupuesto. Tú puedes dar mítines en provincias.</p>'}</div>`;
      const socios = camp.coal ? `<div class="nota">🤝 Coalición pactada con <b>${esc(E.partidos[camp.coal.b].sigla)}</b>.</div>` : (Ca.listasAbiertas(E, camp) && peso ? `<div class="lista">${Ca.socios(E, camp).map(s => `<div class="it"><span class="pto" style="background:${E.partidos[s.k].color}"></span><div class="cuerpo" style="flex:1"><b>${esc(E.partidos[s.k].sigla)}</b><span>Afinidad ${Math.round(s.a * 100)} %</span></div><span class="etq ${s.p >= 0.5 ? 'verde' : s.p >= 0.3 ? 'amar' : 'rojo'}">${Math.round(s.p * 100)} %</span>${UI.botonAccion('coalicion_pre', { pid: s.k }, 'Proponer', 'chico')}</div>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">No puedes pactar coaliciones ahora (las listas están cerradas o no diriges el partido).</div>');
      const coal = `<div class="tarjeta"><h3>🤝 Coalición preelectoral</h3>${socios}</div>`;
      return `${Cp.selector(E, camps, camp)}<div class="titulo-camp" style="margin-bottom:10px"><b>Campaña de ${esc(Ca.nombre(E, camp))}</b> <span class="tenue">· elecciones el ${U.fmtT(camp.tVoto, true)}</span></div>
        <div class="grid g-dash"><div class="col">${asesor}${presup}${encu}${debate}${sucesos}</div><div class="col">${terr}${gasto}${coal}</div></div>`;
    },

    fuera(E) {
      const Ca = C.Campana, cs = E.esp.cortes, encs = E.esp.encs || [], cis = encs[0], J = E.jugador;
      const sem = cs.estado === 'disueltas' ? cs.proxT - E.fecha.t : Math.max(0, cs.finMax - E.fecha.t - 8);
      const ords = cis ? Object.keys(cis.votos).sort((a, b) => cis.votos[b] - cis.votos[a]).slice(0, 8) : [];
      const serie = ords.slice(0, 5).map(k => ({ nombre: E.partidos[k].sigla, color: E.partidos[k].color, datos: encs.filter(x => x.tipo === 'cis').slice().reverse().map(x => [x.t, x.votos[k]]) }));
      const prox = J.region && E.esp.ccaa[J.region] ? E.esp.ccaa[J.region].parl.proxT : null;
      return `<div class="grid g2"><div class="tarjeta"><h3>📣 La campaña se abre al convocarse las elecciones</h3><p class="tenue" style="font-size:13px;margin-top:0">Hoy no hay campaña en marcha. Se abre <b>ocho semanas antes</b> de las autonómicas${prox ? ' de tu comunidad (' + U.fmtT(prox, true) + ')' : ''} y al disolverse las Cortes en las generales${cs.estado === 'activa' ? ' (como tarde, unas ' + sem + ' semanas antes del fin de legislatura)' : ''}.</p>
        <div class="lista" style="font-size:13px"><div class="it">🧭 <span>Un asesor te propone cada semana lo que más conviene, con un clic</span></div><div class="it">⚡ <span>Campaña automática: reparte el presupuesto por ti</span></div><div class="it">💶 <span>Presupuesto con tope legal y crédito si te quedas corto</span></div><div class="it">🗺 <span>Esfuerzo por provincias: el último escaño decide el resultado</span></div><div class="it">📊 <span>Encuestas con margen de error: CIS, prensa, propias y pie de urna</span></div><div class="it">📺 <span>Debate decisivo, voto útil, movilización y coaliciones preelectorales</span></div><div class="it">🗳️ <span>Primarias para encabezar la lista de tu provincia</span></div></div>
        <div class="fila" style="margin-top:10px">${UI.botonAccion('primarias_lista', {}, '🗳️ Disputar la cabeza de lista', 'chico')}</div></div>
        <div class="tarjeta"><h3>📊 Barómetro</h3>${serie[0] && serie[0].datos.length > 1 ? G.linea(serie, { alto: 170, unidad: ' %' }) : '<div class="vacio">Aún no hay barómetros.</div>'}${cis ? `<table class="tabla" style="margin-top:6px"><tbody>${ords.map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${U.d1(cis.votos[k])} %</td><td class="num tenue">${cis.esc[k]} esc.</td></tr>`).join('')}</tbody></table>` : ''}</div></div>`;
    },

    enlazar(el) {
      UI.$$('[data-gastar-prov]', el).forEach(b => b.onclick = () => Cp.modalGastoProv(b.dataset.gastarProv));
      UI.$$('[data-camp-scope]', el).forEach(b => b.onclick = () => { C.E.ui.campScope = b.dataset.campScope; C.App.refrescar(); });
    },

    modalGastoProv(id) {
      const E = C.E, Ca = C.Campana, camp = Ca.cur(E), c = Ca.CANALES.territorio, d = D().provincias[id];
      UI.modal({ titulo: 'Aparato local · ' + d[0], icono: '🏘️', clase: 'medio', cuerpo: `<p class="tenue" style="margin-top:0;font-size:13px">${esc(c.d)} Cada inversión suma esfuerzo en ${esc(d[0])}. Esfuerzo actual: ${U.d1((camp.focus[id]) || 0)}.</p><div class="it"><span style="font-size:20px">${c.icono}</span><div class="cuerpo" style="flex:1"><b>${esc(c.n)}</b></div><span class="etq">${Ca.coste(camp, 'territorio')} M€</span>${UI.botonAccion('gasto_campana', { canal: 'territorio', prov: id }, 'Invertir', 'chico')}</div>` });
    },

    /* Resumen para el Centro de mando. */
    resumen(E) {
      const Ca = C.Campana, camp = Ca.cur(E); if (!camp) return '';
      const c = Ca.consejos(E, camp)[0];
      return `<div class="it clic" data-ir="elecciones"><span>📣</span><div class="cuerpo"><b>Campaña de ${esc(Ca.nombre(E, camp))}: ${Ca.semanasHasta(E, camp)} semanas</b><span>${c ? esc(c.txt) : 'Abre el panel de campaña'}</span></div></div>`;
    },

    /* Decisión del jugador en el debate decisivo. */
    modalDebate() {
      const E = C.E, Ca = C.Campana; if (!E.esp.pendienteDebate) return C.App.revisarPendientes();
      const camp = Ca.camps(E).map(x => x.camp).find(x => !x.debate.hecho && E.fecha.t >= x.debate.t && Ca.debateJugador(E, x)) || Ca.cur(E);
      const ps = Ca.participantes(E, camp), J = E.jugador;
      const op = [['propuestas', '📋 Centrarte en propuestas', 'Resultado estable que mejora con tu oratoria.'], ['ataque', '⚔️ Atacar a tus rivales', 'Alto riesgo: puede ser tu noche… o un desastre.'], ['prudente', '🛡 Jugar sobre seguro', 'Sin sobresaltos: casi nunca ganas, casi nunca pierdes.']];
      const m = UI.modal({ titulo: '📺 Debate decisivo' + (camp.ambito === 'aut' ? ' · ' + D().ccaa[camp.c].nombre : ''), icono: '🎙', clase: 'medio', sinCerrar: true, cuerpo: `<p style="margin-top:0;font-size:13.5px">Los candidatos de ${ps.map(k => esc(E.partidos[k].sigla)).join(', ')} se enfrentan cara a cara ante millones de espectadores. ¿Cuál es tu estrategia?</p><div class="lista">${op.map(([k, n, d]) => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:180px"><b>${n}</b><span>${d}</span></div><button class="btn prim chico" data-deb="${k}">Elegir</button></div>`).join('')}</div>` });
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-deb]'); if (!b) return; m.cerrar(); const orden = Ca.celebrarDebate(E, b.dataset.deb, camp); const pos = orden.indexOf(J.partido); UI.toast(pos >= 0 ? `Debate: terminas en ${pos + 1}ª posición.` : 'Debate celebrado.', pos <= 1 ? 'bien' : 'mal'); C.App.refrescar(); C.App.revisarPendientes(); });
    },

    /* Datos de campaña en la noche electoral: pie de urna frente al resultado, escaños al límite y cuentas. */
    nocheHTML(E, n, votos, escanos) {
      const c = n.camp; if (!c || !c.sondeo) return '';
      votos = votos || n.votos; escanos = escanos || n.escanos;
      const ord = Object.keys(votos).sort((a, b) => votos[b] - votos[a]).slice(0, 6);
      const filas = ord.map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${c.ultimaCIS && c.ultimaCIS[k] != null ? U.d1(c.ultimaCIS[k]) + ' %' : '—'}</td><td class="num">${U.d1(c.sondeo.votos[k] || 0)} % <span class="tenue">· ${c.sondeo.esc[k] || 0} esc.</span></td><td class="num"><b>${U.d1(votos[k])} %</b> <span class="tenue">· ${escanos[k] || 0} esc.</span></td></tr>`).join('');
      const aj = c.ajustados && c.ajustados.length ? `<h3 style="margin:12px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Escaños al límite (tu partido)</h3><div class="lista" style="font-size:12.5px">${c.ajustados.map(a => `<div class="it"><span class="${a.gana ? 'bien' : 'mal'}">${a.gana ? '✔' : '✘'}</span><span><b>${esc(a.nombre)}</b>: ${a.gana ? 'te quedas el último escaño por solo un ' + U.d1(Math.abs(a.pct)) + ' % de ventaja frente a ' + esc(E.partidos[a.rival].sigla) : 'pierdes el último escaño por un ' + U.d1(Math.abs(a.pct)) + ' % frente a ' + esc(E.partidos[a.rival].sigla)}</span></div>`).join('')}</div>` : '';
      return `<div class="tarjeta" style="margin-top:10px"><h3>🎙 Sondeo a pie de urna y campaña</h3><table class="tabla"><thead><tr><th>Partido</th><th class="num">Último CIS</th><th class="num">Pie de urna</th><th class="num">Resultado</th></tr></thead><tbody>${filas}</tbody></table>${aj}
        <div class="tenue" style="font-size:12.5px;margin-top:8px">Gasto de campaña de tu partido: <b>${U.d1(c.gasto)} M€</b> (tope ${c.tope} M€)${c.multa ? ' · <span class="mal">multa por superar el tope</span>' : ''}.</div></div>`;
    }
  };
})(window.ESP);

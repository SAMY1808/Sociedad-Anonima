/* Mayorías y rivales: mayorías alternativas (nacional / autonómica), rivales con estilo y ofertas de pacto. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['mayorias', '🧮 Mayorías'], ['rivales', '🎭 Rivales'], ['pactos', '🤝 Ofertas']];
  const M_ = C.Pantallas.mayorias = {
    render(el) {
      const E = C.E, M = C.Mayorias, m = M.asegurar(E), J = E.jugador, P = E.paises.ES, g = P.gob, tab = E.ui.tabMay || 'mayorias';
      let h = `<div class="cab"><div><h1>🧮 Mayorías y rivales</h1><div class="sub">¿Quién puede derribar a quién? Estabilidad del Gobierno: <b>${Math.round(g.estab)}</b></div></div></div><div class="tabs" style="margin-bottom:12px">${TABS.map(([k, n]) => `<button data-tm="${k}" class="${tab === k ? 'activo' : ''}">${n}${k === 'pactos' && m.ofertas.length ? ` <span class="badge">${m.ofertas.length}</span>` : ''}</button>`).join('')}</div>`;
      if (tab === 'mayorias') {
        if (C.Presion && J.pais === 'ES') h += M_.presionHTML(E);
        const alt = M.alternativas(E), sondeado = m.sonda && E.fecha.t - m.sonda.t < 8;
        h += `<div class="tarjeta"><div class="t-cab"><h3>Moción de censura (Congreso)</h3><span class="etq ${g.estab < 48 ? 'rojo' : ''}">Gobierno: ${g.coalicion.map(k => E.partidos[k].sigla).join(' + ')}</span></div>
          <div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${UI.botonAccion('sondear_mayoria', {}, '📡 Sondear a los grupos', 'chico')}${J.rol === 'lider' && !g.coalicion.includes(J.partido) ? UI.botonAccion('mocion_censura', {}, '⚡ Presentar moción', 'chico') : ''}</div>
          <div class="lista">${alt.map(a => `<div class="it" style="flex-direction:column;align-items:stretch"><div class="fila" style="gap:8px;flex-wrap:wrap"><b>${Comp.partido(E, a.cand)}</b><span class="tenue" style="font-size:12px">bloque: ${a.bloque.map(k => E.partidos[k].sigla).join(' + ')}</span><span class="etq ${a.exito ? 'verde' : 'rojo'}" style="margin-left:auto">${a.si} a favor ${a.exito ? '· prosperaría' : '· faltan ' + a.falta}</span></div>
            <div class="barra-h" style="height:8px;margin:6px 0"><i style="width:${Math.min(100, a.si / 350 * 100)}%;background:${a.exito ? 'var(--si)' : 'var(--no)'}"></i></div>${sondeado ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${Object.keys(a.est).filter(k => (P.escanos[k] || 0) >= 3).map(k => `<span class="etq ${a.est[k] === 'si' ? 'verde' : a.est[k] === 'abs' ? 'amar' : 'rojo'}" ${UI.tt(esc(E.partidos[k].nombre))}>${E.partidos[k].sigla} ${a.est[k] === 'si' ? 'sí' : a.est[k] === 'abs' ? 'abst.' : 'no'}</span>`).join('')}</div>` : '<div class="tenue" style="font-size:11.5px">Sondea a los grupos para ver sus posturas.</div>'}${a.vetos.length ? `<div class="tenue" style="font-size:11.5px;margin-top:4px">Vetos: ${a.vetos.map(k => E.partidos[k].sigla).join(', ')}</div>` : ''}</div>`).join('') || '<div class="vacio" style="padding:10px">No hay oposición con fuerza suficiente.</div>'}</div></div>`;
        if (J.region && E.esp.ccaa[J.region] && E.esp.ccaa[J.region].gob) { const aa = M.alternativasAut(E, J.region); h += `<div class="tarjeta"><div class="t-cab"><h3>Moción de censura en ${esc(D().ccaa[J.region].nombre)}</h3><span class="etq">Estabilidad ${Math.round(E.esp.ccaa[J.region].gob.estab)}</span></div><div class="lista">${aa.map(a => `<div class="it"><b>${Comp.partido(E, a.cand)}</b><span class="tenue" style="font-size:12px;flex:1;margin-left:8px">${a.bloque.map(k => E.partidos[k].sigla).join(' + ')}</span><span class="etq ${a.exito ? 'verde' : 'rojo'}">${a.si}/${a.may}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Sin alternativas.</div>'}</div></div>`; }
      } else if (tab === 'rivales') {
        const ks = P.partidos.filter(k => k !== J.partido && (P.escanos[k] || 0) >= 4).sort((a, b) => P.escanos[b] - P.escanos[a]);
        h += C.Nemesis ? C.Pantallas.mayorias.nemesisHTML(E) : '';
        h += C.Intriga ? M_.vetosHTML(E, ks) : '';
        h += `<div class="tarjeta"><div class="t-cab"><h3>Los rivales</h3></div><div class="lista">${ks.map(k => { const p = E.partidos[k], e = M.ESTILOS[m.estilo[k]], l = E.politicos[p.lider], r = Math.round(m.rel[k]); return `<div class="it" style="flex-direction:column;align-items:stretch"><div class="fila" style="gap:8px;flex-wrap:wrap"><b>${Comp.partido(E, k)}</b><span class="tenue" style="font-size:12px">${l ? esc(l.n) : ''} · ${P.escanos[k]} esc.</span><span class="etq">${e[1]} ${e[0]}</span><span class="etq ${r > 20 ? 'verde' : r < -20 ? 'rojo' : ''}" style="margin-left:auto">Relación ${r > 0 ? '+' : ''}${r}</span></div><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(e[2])}</div>
          ${C.Rivales ? (() => { const L = C.Rivales.linea(E, k); return `<div class="tenue" style="font-size:11.5px;margin-top:4px">💶 Caja ${L.caja} M€${L.crisis ? ' · <b class="mal">crisis de tesorería</b>' : ''}${L.giro ? ' · ↪ ' + esc(L.giro.txt) : ''}</div>`; })() : ''}
          <div class="fila" style="gap:6px;margin-top:6px">${UI.botonAccion('reunirse_rival', { pid: k }, '☕ Reunirte', 'chico')}${UI.botonAccion('atacar_rival', { pid: k }, '🗡️ Atacar', 'chico')}</div></div>`; }).join('')}</div></div>`;
      } else {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Ofertas de pacto</h3></div><div class="lista">${m.ofertas.map(o => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px"><b>${Comp.partido(E, o.pid)} propone ${esc(o.tema)}</b><div class="tenue" style="font-size:11px">Caduca en ${Math.max(0, 8 - Math.round(E.fecha.t - o.t))} semanas</div></div><button class="btn chico prim" data-of="${o.id}" data-k="a">Aceptar</button><button class="btn chico" data-of="${o.id}" data-k="r">Rechazar</button></div>`).join('') || '<div class="vacio" style="padding:10px">Ninguna oferta por ahora. Sólo llegan si presides el Gobierno y hay rivales pactistas.</div>'}</div></div>
          <div class="tarjeta"><h3>Historial de pactos</h3><div class="lista">${m.hist.slice(0, 8).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no has cerrado ningún pacto.</div>'}</div></div>`;
      }
      el.innerHTML = h;
      UI.$$('[data-tm]', el).forEach(b => b.onclick = () => { E.ui.tabMay = b.dataset.tm; C.App.refrescar(); });
      UI.$$('[data-of]', el).forEach(b => b.onclick = () => { const r = b.dataset.k === 'a' ? M.aceptarOferta(E, b.dataset.of) : M.rechazarOferta(E, b.dataset.of); UI.toast(esc(r.msg), r.ok ? 'bien' : 'mal'); C.App.refrescar(); });
    },
    presionHTML(E) {
      const Pr = C.Presion, s = Pr.asegurar(E), n = Math.round(s.nivel), g = E.paises.ES.gob, c = E.esp.cortes, J = E.jugador, pm = Pr.esPM(E), col = n >= 65 ? 'var(--no,#d9534f)' : n >= 40 ? 'var(--oro)' : 'var(--si,#3bb273)';
      const desde = Math.max(0, (c.ultDisolucion || 0) + 52 - E.fecha.t), fin = Math.max(0, c.finMax - E.fecha.t), fac = Pr.factores(E);
      const socios = g.coalicion.filter(k => k !== g.partido);
      const botones = pm ? `${UI.botonAccion('dar_la_cara', {}, '🛡️ Dar la cara', 'chico')}` : `${UI.botonAccion('exigir_elecciones', {}, '📣 Exigir elecciones ya', 'chico')}${UI.botonAccion('movilizar_elecciones', {}, '🪧 Movilización', 'chico')}${UI.botonAccion('bloquear_gobierno', {}, '🚧 Obstruir', 'chico')}${socios.map(k => UI.botonAccion('presionar_socio_gobierno', { pid: k }, '🔨 Presionar a ' + esc(E.partidos[k].sigla), 'chico')).join('')}`;
      return `<div class="tarjeta" style="border-left:3px solid ${col}"><div class="t-cab"><h3>📣 Presión para adelantar las elecciones</h3><span class="etq">${n} / 100</span></div>
        <div class="barra-h" style="height:10px"><i style="width:${n}%;background:${col}"></i></div>
        <div class="tenue" style="font-size:12px;margin:6px 0">${pm ? 'La oposición aprieta para que convoques elecciones: si pasa de 65 te llegará un dilema.' : 'Cuanta más presión, más probable es que el presidente convoque elecciones (a partir de 55) o que caiga su mayoría.'} ${desde > 0 ? `Aún no pueden disolverse las Cortes (faltan ${desde} sem.).` : `Fin de legislatura en ${fin} sem.`}</div>
        ${fac.length ? `<div class="lista" style="font-size:12.5px">${fac.map(f => `<div class="it"><span>${f[0]}</span><span style="margin-left:8px">${esc(f[1])}</span></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12px">El Gobierno no atraviesa ninguna crisis de fondo.</div>'}
        <div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${botones}</div>
        ${s.hist.length ? `<div class="tenue" style="font-size:11.5px;margin-top:8px">${s.hist.slice(0, 3).map(x => U.fmtT(x.t, true) + ': ' + esc(x.txt)).join(' · ')}</div>` : ''}</div>`;
    },
    vetosHTML(E, ks) {
      const In = C.Intriga, J = E.jugador, vs = In.asegurar(E).vetos, mios = vs.filter(v => v.a === J.partido).map(v => v.b), otros = vs.filter(v => v.a !== J.partido && v.b !== J.partido);
      const aMi = vs.filter(v => v.b === J.partido).map(v => v.a);
      const libres = ks.filter(k => !mios.includes(k));
      return `<div class="tarjeta"><div class="t-cab"><h3>⛔ Vetos</h3><span class="etq">${vs.length}</span></div>
        <div class="tenue" style="font-size:12px;margin-bottom:6px">Un veto impide que dos partidos gobiernen juntos. Se declaran en campaña y caducan tras las elecciones.</div>
        ${aMi.length ? `<div class="nota" style="margin-bottom:6px">Te vetan: ${aMi.map(k => Comp.partido(E, k)).join(' · ')}</div>` : ''}
        ${mios.length ? `<div class="lista">${mios.map(k => `<div class="it"><span style="flex:1">Tú vetas a ${Comp.partido(E, k)}</span>${UI.botonAccion('levantar_veto', { pid: k }, '🔓 Levantar', 'chico')}</div>`).join('')}</div>` : ''}
        ${otros.length ? `<div class="tenue" style="font-size:12px;margin-top:6px">Entre otros: ${otros.slice(0, 6).map(v => esc(E.partidos[v.a].sigla) + ' ⛔ ' + esc(E.partidos[v.b].sigla)).join(' · ')}</div>` : ''}
        <div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${libres.slice(0, 6).map(k => UI.botonAccion('vetar_partido', { pid: k }, '⛔ Vetar a ' + esc(E.partidos[k].sigla), 'chico')).join('')}</div></div>`;
    },
    nemesisHTML(E) {
      const N = C.Nemesis, s = N.elegir(E); if (!s.pid) return '';
      const r = E.partidos[s.pid], l = E.politicos[s.id], J = E.jugador, ganas = s.enfr.filter(x => x.gana).length;
      return `<div class="tarjeta" style="border-left:3px solid var(--no,#d9534f)"><div class="t-cab"><h3>🥊 Tu némesis: ${esc(l.n)}</h3><span class="etq">${Comp.partido(E, s.pid)}</span></div>
        <div class="fila" style="gap:10px;align-items:center"><span class="tenue" style="font-size:12px;width:90px">Animadversión</span><div class="barra-h" style="height:8px;flex:1"><i style="width:${s.odio}%;background:var(--no,#d9534f)"></i></div><b>${Math.round(s.odio)}</b></div>
        ${s.enfr.length ? `<div class="tenue" style="font-size:12px;margin-top:6px">Cara a cara en las urnas: ${ganas} victorias – ${s.enfr.length - ganas} derrotas · último: ${esc(J.partidoSigla || E.partidos[J.partido].sigla)} ${s.enfr[0].tu} frente a ${s.enfr[0].el}</div>` : ''}
        <div class="fila" style="gap:6px;margin:8px 0">${UI.botonAccion('tender_mano_nemesis', {}, '🕊️ Tender la mano', 'chico')}${UI.botonAccion('provocar_nemesis', {}, '🔥 Provocar', 'chico')}${UI.botonAccion('desafiar_nemesis', {}, '🥊 Cara a cara', 'chico')}</div>
        <div class="lista" style="font-size:12.5px">${s.hist.slice(0, 5).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal">${esc(x.txt)}</div></div>`).join('')}</div></div>`;
    },
  };
})(window.ESP);

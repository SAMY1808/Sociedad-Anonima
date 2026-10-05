/* Consejo de Gobierno de una comunidad autónoma: orden del día del presidente, mi consejería (programas), miembros, presupuesto y acuerdos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const TIPO = { obra: ['🏗️ Obra', 'amar'], ley: ['📜 Ley autonómica', 'oro'], accion: ['⚡ Plan', 'verde'] };
  const coste = p => Math.max(0.05, Math.round(Math.abs(p.deuda) * 80) / 100);

  const CG = C.Pantallas.consejoGob = {
    render(el, params) {
      const E = C.E, J = E.jugador, c = J.region, T = C.Territorio, rc = E.esp.ccaa[c], g = rc.gob;
      T.asegurarAut(E, c); T.presInit(E, c);
      const presJ = J.cargo === 'presauto', consJ = J.cargo === 'consejero';
      const tab = (params && params.tab) || E.ui.tabCG || (presJ ? 'orden' : consJ ? 'mia' : 'miembros');
      E.ui.tabCG = tab;
      const pres = E.politicos[g.pres], rol = presJ ? 'Presides el Consejo de Gobierno' : consJ ? 'Eres consejero/a: participas en el Consejo' : 'Sólo recibes información: no formas parte del Consejo de Gobierno';
      const tabs = [['orden', 'Orden del día' + (presJ && rc.agenda.length ? ' (' + rc.agenda.length + ')' : '')], ['mia', presJ ? 'Consejerías' : 'Mi consejería'], ['miembros', 'Miembros'], ['presupuesto', 'Presupuesto'], ['acuerdos', 'Acuerdos']];
      let cuerpo = '';
      if (tab === 'orden') cuerpo = CG.orden(E, c, presJ);
      else if (tab === 'mia') cuerpo = CG.mia(E, c, presJ, consJ);
      else if (tab === 'miembros') cuerpo = CG.miembros(E, c);
      else if (tab === 'presupuesto') { E.ui.regPres = c; cuerpo = C.Pantallas.territorio.presupuesto(E); }
      else cuerpo = CG.acuerdos(E, c);
      el.innerHTML = `<div class="cab"><div><h1>🏛 Consejo de Gobierno · ${esc(D().ccaa[c].nombre)}</h1><div class="sub">${esc(pres ? pres.n : '—')} (${esc(E.partidos[g.partido].sigla)}) · aprobación ${Math.round(g.aprob)} % · estabilidad ${Math.round(g.estab)} % · ${esc(rol)}</div></div>
        <div class="fila">${presJ ? UI.botonAccion('reorganizar_gobierno', {}, '🧩 Reorganizar', '') + UI.botonAccion('presupuesto_aut', {}, '💶 Presupuestos', '') : ''}${consJ ? UI.botonAccion('reclamar_fondos', {}, '💰 Reclamar fondos', '') : ''}</div></div>
        ${!presJ && !consJ ? '<div class="nota" style="margin-bottom:12px">ℹ️ El Gobierno de tu comunidad te notifica sus acuerdos, pero como diputado/a autonómico/a no participas en el Consejo de Gobierno. Entra en el Gobierno como consejero/a para gestionar una área.</div>' : ''}
        <div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('consejo', { tab: b.dataset.tab }));
      UI.$$('[data-gob-res]', el).forEach(b => b.onclick = () => { const r = T.resolverItemGob(E, c, b.dataset.id, b.dataset.gobRes); UI.toast(esc(r.msg || 'Hecho'), r.ok === false ? 'mal' : 'bien'); C.App.refrescar(); });
      UI.$$('[data-gab]', el).forEach(b => b.onclick = () => C.App.ir('gabinete', { key: 'aut:' + c }));
    },

    progFila(E, c, p) {
      const rc = E.esp.ccaa[c], t = TIPO[p.tipo], enMarcha = rc.pend.some(x => x.tipo === 'prog' && x.prog === p.id);
      return `<div class="it" style="align-items:flex-start;flex-wrap:wrap"><div class="cuerpo" style="min-width:220px"><b style="white-space:normal">${esc(p.n)}</b><span>${esc(p.d)}</span><div class="chips" style="margin-top:4px"><span class="etq ${t[1]}">${t[0]}${p.sem ? ' · ' + (p.sem >= 52 ? U.d1(p.sem / 52) + ' años' : p.sem + ' sem') : ''}</span><span class="etq">Coste ${U.d1(coste(p))} mil M€</span><span class="etq verde">Gestión +${p.gest}</span></div></div>${enMarcha ? '<span class="etq amar">En marcha</span>' : UI.botonAccion('programa_consejeria', { prog: p.id }, C.E.jugador.cargo === 'consejero' ? 'Llevar al Consejo' : 'Aprobar', 'chico')}</div>`;
    },

    orden(E, c, presJ) {
      const T = C.Territorio, rc = E.esp.ccaa[c];
      if (!presJ) return `<div class="tarjeta"><h3>Orden del día</h3><div class="vacio">El presidente despacha el orden del día cada semana. ${E.jugador.cargo === 'consejero' ? 'Como consejero/a, lleva tus propuestas desde <b>Mi consejería</b>.' : 'Consulta los acuerdos en la pestaña <b>Acuerdos</b>.'}</div></div>`;
      const it = rc.agenda.map(i => { const p = T.programa(i.prog), t = TIPO[p.tipo], ci = T.infoGrupo(E, c, i.area); return `<div class="tarjeta"><div class="fila" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap;gap:10px"><div><div class="fila" style="gap:6px"><span style="font-size:18px">${ci.icono}</span><b style="font-size:15px">${esc(p.n)}</b></div><div class="tenue" style="font-size:12.5px;margin-top:2px">${esc(ci.nombre)} · propone: ${esc(i.quien)} · hasta ${U.fmtT(i.t + 4, true)}</div></div><span class="etq ${t[1]}">${t[0]}</span></div><p style="margin:8px 0 4px;font-size:13px;color:var(--texto2)">${esc(p.d)}</p><div class="chips"><span class="etq">Coste ${U.d1(coste(p))} mil M€</span><span class="etq">Crédito de la consejería ${U.d1(rc.pres.cred[i.area] || 0)}</span></div>
        <div class="fila" style="margin-top:10px;gap:6px"><button class="btn chico prim" data-id="${i.id}" data-gob-res="aprobar">Aprobar</button><button class="btn chico" data-id="${i.id}" data-gob-res="aplazar">Aplazar</button><button class="btn chico" data-id="${i.id}" data-gob-res="rechazar">Rechazar</button></div></div>`; }).join('');
      return `<div class="col">${it || '<div class="tarjeta"><div class="vacio">El orden del día está vacío esta semana. Puedes impulsar tú mismo programas en la pestaña <b>Consejerías</b>.</div></div>'}</div>`;
    },

    mia(E, c, presJ, consJ) {
      const T = C.Territorio, rc = E.esp.ccaa[c], J = E.jugador;
      const grupos = presJ ? T.grupos(E, c) : consJ && J.area ? [T.infoGrupo(E, c, J.area)] : [];
      if (!grupos.length) return '<div class="tarjeta"><div class="vacio">No gestionas ninguna consejería.</div></div>';
      const marcha = rc.obras.filter(o => !o.fin);
      return `${marcha.length ? `<div class="nota" style="margin-bottom:10px">En construcción: ${marcha.map(o => esc(o.nombre) + ' (' + U.fmtT(o.t1, true) + ')').join(' · ')}</div>` : ''}
        ${grupos.map(gr => { const niv = T.nivelGrupo(E, c, gr.id), gest = U.prom(gr.atoms.map(a => rc.gestion[a] || 50)), cred = rc.pres.cred[gr.id] || 0;
          return `<div class="tarjeta" style="margin-bottom:12px"><div class="t-cab"><h3>${gr.icono} ${esc(gr.nombre)}</h3><span class="etq">Gestión ${Math.round(gest)}</span></div>
          <div class="fila" style="gap:8px;font-size:12.5px;margin-bottom:6px"><span class="etq ${niv >= 1.5 ? 'verde' : niv >= 0.7 ? 'amar' : 'rojo'}">Competencias ${niv >= 1.5 ? 'amplias' : niv >= 0.7 ? 'medias' : 'escasas'}</span><span class="etq">Presupuesto ${U.d1(rc.pres.alloc[gr.id] || 0)} % · crédito ${U.d1(cred)} mil M€</span></div>
          <div class="lista">${T.programasDe(E, c, gr.id).map(p => CG.progFila(E, c, p)).join('')}</div></div>`; }).join('')}
        <p class="tenue" style="font-size:12.5px">Los programas se pagan con el crédito de la consejería. ${consJ ? 'Como consejero/a los llevas al Consejo de Gobierno y el presidente decide si los aprueba.' : 'Como presidente/a los apruebas directamente.'}</p>`;
    },

    miembros(E, c) {
      const T = C.Territorio, rc = E.esp.ccaa[c], g = rc.gob, J = E.jugador;
      const filas = T.grupos(E, c).map(gr => { const h = g.consej[gr.id]; return `<tr><td>${gr.icono} ${esc(gr.nombre)}</td><td>${h === 'J' ? esc(J.nombre) + ' <span class="etq oro">Tú</span>' : h ? esc(h.n) : '—'}</td><td>${h && h !== 'J' ? Comp.partido(E, h.p) : h === 'J' ? Comp.partido(E, J.partido) : ''}</td><td class="num">${Math.round(U.prom(gr.atoms.map(a => rc.gestion[a] || 50)))}</td></tr>`; }).join('');
      return `<div class="tarjeta"><table class="tabla apila"><thead><tr><th>Consejería</th><th>Titular</th><th>Partido</th><th class="num">Gestión</th></tr></thead><tbody>${filas}</tbody></table><div class="fila" style="margin-top:8px"><button class="btn chico" data-gab="1">🧑‍💼 Ver el equipo en Gabinete</button></div></div>`;
    },

    acuerdos(E, c) {
      const h = E.esp.ccaa[c].hist || [];
      return `<div class="tarjeta"><h3>Acuerdos recientes del Consejo de Gobierno</h3>${h.length ? `<div class="lista" style="font-size:13px">${h.map(x => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(x.t, true)}</span><span>${esc(x.txt)}</span></div>`).join('')}</div>` : '<div class="vacio">Todavía no hay acuerdos.</div>'}</div>`;
    }
  };
})(window.ESP);

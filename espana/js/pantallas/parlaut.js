/* Parlamento autonómico: composición, leyes, decretos-ley, Diputación Permanente y votaciones de cualquier comunidad (la tuya por defecto). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['pleno', '🏛 Pleno'], ['leyes', '📜 Leyes'], ['decretos', '📑 Decretos-ley'], ['dp', '🛡 Diputación Permanente'], ['votos', '🗳 Votaciones']];
  const VT = { si: 'A favor', abs: 'Abstención', no: 'En contra' }, VTC = { si: 'verde', abs: 'amar', no: 'rojo' };
  const bloques = (E, e) => Object.keys(e).filter(k => e[k] && E.partidos[k]).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).map(k => ({ n: e[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${e[k]}</b></div>` }));
  const ETQ = { tramite: ['En tramitación', 'amar'], aprobada: ['Aprobada', 'verde'], rechazada: ['Rechazada / caducada', 'rojo'] };

  const PA = C.Pantallas.parlaut = {
    region(E) { const J = E.jugador, T = C.Territorio; const r = E.ui.regPA || (J.region && E.esp.ccaa[J.region] ? J.region : T.ids()[0]); return E.esp.ccaa[r] ? r : T.ids()[0]; },
    render(el, params) {
      const E = C.E, T = C.Territorio, J = E.jugador; if (params && params.reg) E.ui.regPA = params.reg;
      const c = PA.region(E), rc = E.esp.ccaa[c], tab = (params && params.tab) || E.ui.tabPA || 'pleno'; E.ui.tabPA = tab;
      T.asegurarAut(E, c); const pa = T.paAsegurar(E, c), dis = T.disuelto(E, c), tot = U.suma(Object.values(rc.parl.escanos)), may = Math.floor(tot / 2) + 1, g = rc.gob;
      const sg = g ? U.suma(g.coalicion.map(k => rc.parl.escanos[k] || 0)) : 0, sa = g ? U.suma((g.apoyoExterno || []).map(k => rc.parl.escanos[k] || 0)) : 0;
      let h = `<div class="cab"><div><h1>${C.Banderas.svg(c, { h: 26 }) || '🗺'} Parlamento de ${esc(D().ccaa[c].nombre)}</h1><div class="sub">${dis ? '<b style="color:var(--no)">Parlamento disuelto</b> · elecciones el ' + U.fmtT(rc.parl.proxT, true) + ' · funciona la Diputación Permanente' : 'En sesiones · próximas elecciones el ' + U.fmtT(rc.parl.proxT, true)}</div></div>
        <select id="pa-reg" class="btn" style="max-width:190px">${T.ids().map(x => `<option value="${x}" ${x === c ? 'selected' : ''}>${esc(D().ccaa[x].nombre)}</option>`).join('')}</select></div>
        <div class="tabs" style="margin-bottom:12px">${TABS.map(([k, n]) => `<button data-tab-pa="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      if (E.esp.pendienteConvAut) h += `<div class="nota" style="border-color:var(--oro);margin-bottom:12px">Tienes una convalidación pendiente. <button class="btn chico prim" id="pa-conv">Votar</button></div>`;
      if (tab === 'pleno') {
        h += `<div class="grid g2" style="gap:14px;align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Composición del Pleno</h3><span class="etq">${tot} escaños</span></div>${H.bloques(bloques(E, rc.parl.escanos), { altoMax: 240, mayoria: may, centroSub: 'ESCAÑOS · MAYORÍA ' + may })}${H.leyendaPartidos(E, rc.parl.escanos)}</div>
          <div class="col"><div class="tarjeta"><h3>Mayoría de gobierno</h3>${g ? G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyo externo', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: tot - sg - sa, color: '#5E8DF0' }], { total: tot, mayoria: may, alto: 20 }) : ''}<div class="tenue" style="font-size:12.5px;margin-top:6px">${g ? (sg >= may ? 'El Gobierno tiene mayoría absoluta.' : sg + sa >= may ? 'Mayoría con apoyos externos.' : `Gobierno en minoría: le faltan ${may - sg - sa}.`) : 'Sin gobierno formado.'}</div></div>
          <div class="tarjeta"><h3>Estado de las sesiones</h3><div class="lista"><div class="it"><span>🏛</span><div class="cuerpo" style="flex:1"><b>${dis ? 'Parlamento disuelto' : 'Periodo de sesiones'}</b><div class="tenue" style="font-size:12px;white-space:normal">${dis ? 'No se tramitan leyes; el Gobierno puede dictar decretos-ley que convalida la Diputación Permanente.' : 'El Pleno vota leyes y convalida decretos-ley del Gobierno.'}</div></div></div>
            <div class="it"><span>📜</span><div class="cuerpo" style="flex:1"><b>${(rc.leyes || []).filter(l => l.estado === 'tramite').length} leyes en trámite</b></div></div><div class="it"><span>📑</span><div class="cuerpo" style="flex:1"><b>${pa.rdl.filter(d => d.estado === 'vigor').length} decretos-ley pendientes de convalidar</b></div></div></div></div></div></div>`;
      } else if (tab === 'leyes') {
        const ls = (rc.leyes || []).filter(l => !l.pres).slice().reverse().slice(0, 14), mia = J.region === c;
        h += `<div class="tarjeta"><div class="t-cab"><h3>Leyes y proposiciones</h3>${mia ? `<button class="btn chico prim" id="pa-leyes">Ir a Leyes</button>` : ''}</div>${dis ? '<div class="nota" style="margin-bottom:8px">Con el Parlamento disuelto no pueden registrarse leyes: caducan las que estaban en trámite.</div>' : ''}<div class="lista">${ls.map(b => { const p = C.Territorio.programa(b.prog), e = ETQ[b.estado] || ['—', '']; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(p ? p.n : b.prog)}</b><div class="tenue" style="font-size:11px">${esc(b.quien)}${b.etapa && b.estado === 'tramite' ? ' · ' + esc(({ registro: 'Registro', comision: 'Comisión', pleno: 'Pleno' })[b.etapa] || '') : ''}</div></div><span class="etq ${e[1]}">${e[0]}</span></div>`; }).join('') || '<div class="vacio" style="padding:10px">No hay leyes registradas.</div>'}</div></div>`;
      } else if (tab === 'decretos') {
        const pres = g && g.pres === 'J' && J.region === c, disp = pres ? T.leyesDisponibles(E, c).filter(p => !pa.rdl.some(d => d.prog === p.id && d.estado === 'vigor')) : [];
        h += `<div class="tarjeta"><div class="t-cab"><h3>Decretos-ley del Consejo de Gobierno</h3></div><div class="lista">${pa.rdl.map(d => { const p = T.programa(d.prog), vig = d.estado === 'vigor', e = vig ? ['En vigor · convalida en ' + Math.max(0, Math.round(d.tVoto - E.fecha.t)) + ' sem', 'amar'] : d.estado === 'convalidado' ? ['Convalidado', 'verde'] : ['Derogado', 'rojo'];
          return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(p ? p.n : d.prog)}</b><div class="tenue" style="font-size:11px">${esc(d.quien)} · ${U.fmtT(d.t, true)}${d.v ? ` · ${d.v.organo === 'dp' ? 'Diputación Permanente' : 'Pleno'} ${d.v.si}–${d.v.no}` : ''}</div></div><span class="etq ${e[1]}">${e[0]}</span></div>`; }).join('') || '<div class="vacio" style="padding:10px">Todavía no hay decretos-ley.</div>'}</div></div>`;
        if (pres) h += `<div class="tarjeta"><div class="t-cab"><h3>📑 Aprobar un decreto-ley</h3></div><div class="tenue" style="font-size:12.5px;margin-bottom:8px">Entra en vigor al instante y debe convalidarse en 4 semanas${dis ? ' en la Diputación Permanente' : ' en el Pleno'}. Si no tienes apoyos, se deroga y pagas el precio.</div><div class="lista">${disp.slice(0, 12).map(p => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(p.n)}</b><div class="tenue" style="font-size:11px;white-space:normal">${esc(p.d)}</div></div>${UI.botonAccion('decreto_ley_aut', { prog: p.id }, 'Decretar', 'chico')}</div>`).join('')}</div></div>`;
      } else if (tab === 'dp') {
        const dp = T.dp(E, c), ks = Object.keys(dp.seats).filter(k => dp.seats[k]).sort((a, b) => dp.seats[b] - dp.seats[a]);
        h += `<div class="grid g2" style="gap:14px;align-items:start"><div class="tarjeta"><div class="t-cab"><h3>Diputación Permanente</h3><span class="etq ${dis ? 'rojo' : ''}">${dis ? 'En funciones' : 'En reposo'}</span></div>${H.bloques(bloques(E, dp.seats), { altoMax: 200, mayoria: dp.may, centroSub: 'DIPUTACIÓN PERMANENTE · MAYORÍA ' + dp.may })}
          <div class="tenue" style="font-size:12.5px;margin-top:6px">Órgano reducido (${dp.n} miembros) que, con el Parlamento disuelto, vigila al Gobierno y convalida o deroga sus decretos-ley.${g ? ` El bloque de gobierno suma ${dp.gob} de ${dp.n}.` : ''}${T.jugadorEnDP(E, c) ? ' <b>Tú formas parte.</b>' : ''}</div></div>
          <div class="tarjeta"><h3>Reparto</h3><table class="tabla"><thead><tr><th>Partido</th><th class="num">Pleno</th><th class="num">DP</th></tr></thead><tbody>${ks.map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${rc.parl.escanos[k] || 0}</td><td class="num">${dp.seats[k]}</td></tr>`).join('')}</tbody></table></div></div>
          <div class="tarjeta" style="margin-top:12px"><h3>Pendientes de convalidación</h3><div class="lista">${pa.rdl.filter(d => d.estado === 'vigor').map(d => { const p = T.programa(d.prog); return `<div class="it"><div class="cuerpo" style="flex:1"><b style="white-space:normal">${esc(p.n)}</b><div class="tenue" style="font-size:11px">Se vota en ${Math.max(0, Math.round(d.tVoto - E.fecha.t))} semanas en ${dis ? 'la Diputación Permanente' : 'el Pleno'}</div></div></div>`; }).join('') || '<div class="vacio" style="padding:10px">Nada pendiente.</div>'}</div></div>`;
      } else {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Votaciones recientes</h3></div>${pa.hist.length || (rc.leyes || []).some(l => l.v && l.v.t != null) ? `<table class="tabla"><thead><tr><th>Fecha</th><th>Asunto</th><th>Órgano</th><th class="num">Sí</th><th class="num">No</th><th class="num">Abs.</th><th></th></tr></thead><tbody>${
          pa.hist.map(x => ({ t: x.t, n: 'Decreto-ley: ' + ((T.programa(x.prog) || {}).n || x.prog), o: x.organo === 'dp' ? 'Dip. Permanente' : 'Pleno', si: x.si, no: x.no, abs: x.abs, ok: x.ok })).concat((rc.leyes || []).filter(l => l.v && l.v.t != null && l.v.si != null && !l.pres).map(l => ({ t: l.v.t, n: 'Ley: ' + ((T.programa(l.prog) || {}).n || l.prog), o: 'Pleno', si: l.v.si, no: l.v.no, abs: l.v.abs, ok: l.v.ok }))).sort((a, b) => b.t - a.t).slice(0, 20).map(x => `<tr><td>${U.fmtT(x.t, true)}</td><td>${esc(x.n)}</td><td>${x.o}</td><td class="num">${x.si}</td><td class="num">${x.no}</td><td class="num">${x.abs}</td><td><span class="etq ${x.ok ? 'verde' : 'rojo'}">${x.ok ? 'Aprobado' : 'Rechazado'}</span></td></tr>`).join('')}</tbody></table>` : '<div class="vacio" style="padding:10px">Todavía no hay votaciones.</div>'}</div>`;
      }
      el.innerHTML = h;
      UI.$$('[data-tab-pa]', el).forEach(b => b.onclick = () => C.App.ir('parlaut', { tab: b.dataset.tabPa }));
      const sel = UI.$('#pa-reg', el); if (sel) sel.onchange = () => { E.ui.regPA = sel.value; C.App.refrescar(); };
      const cv = UI.$('#pa-conv', el); if (cv) cv.onclick = () => PA.modalConv();
      const lb = UI.$('#pa-leyes', el); if (lb) lb.onclick = () => C.App.ir('leyes', { amb: 'aut' });
    },

    modalConv() {
      const E = C.E, pv = E.esp.pendienteConvAut, T = C.Territorio; if (!pv) return C.App.revisarPendientes();
      const d = T.rdlAut(E, pv.c, pv.id); if (!d || d.estado !== 'vigor') { E.esp.pendienteConvAut = null; return C.App.revisarPendientes(); }
      const J = E.jugador, prog = T.programa(d.prog), rc = E.esp.ccaa[pv.c], dp = T.organo(E, pv.c) === 'dp', base = dp ? T.dp(E, pv.c).seats : rc.parl.escanos, tot = U.suma(Object.values(base));
      const b = { pid: d.pid, cab: {}, neg: {}, ruido: d.ruido, interv: 0, decreto: true }, pos = {}; let si = 0, no = 0, abs = 0;
      for (const k in base) { if (!base[k]) continue; const ps = T.posturaAut(E, pv.c, b, k), v = ps.voto === 'no' && rc.gob && rc.gob.coalicion.includes(k) ? 'si' : ps.voto; pos[k] = v; if (v === 'si') si += base[k]; else if (v === 'no') no += base[k]; else abs += base[k]; }
      const linea = pos[J.partido] || 'abs', may = Math.floor(tot / 2) + 1;
      const filas = Object.keys(pos).sort((a, b2) => base[b2] - base[a]).map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${base[k]}</td><td><span class="etq ${VTC[pos[k]]}">${VT[pos[k]]}</span></td></tr>`).join('');
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${esc(d.quien)} · ${dp ? 'Diputación Permanente (Parlamento disuelto)' : 'Pleno'} de ${esc(D().ccaa[pv.c].nombre)}</div><p style="margin:6px 0 10px;font-size:14.5px">Convalidación del decreto-ley: ${esc(prog.d)}</p>
        ${G.apilada([{ etq: 'A favor', v: si, color: 'var(--si)' }, { etq: 'Abstención', v: abs, color: 'var(--abs)' }, { etq: 'En contra', v: no, color: 'var(--no)' }], { total: tot, mayoria: may, alto: 18 })}
        <div class="tenue" style="font-size:12px;margin:4px 0 10px">Proyección: ${si} sí · ${no} no · ${abs} abst. ${si > no ? '<b class="bien">Se convalidaría</b>' : '<b class="mal">Se derogaría</b>'}</div><table class="tabla"><tbody>${filas}</tbody></table>
        <div class="voto-btns">${['si', 'abs', 'no'].map(v => `<button class="btn ${v} ${v === linea ? 'linea' : ''}" data-v="${v}"><b>${VT[v]}</b><span class="tenue" style="font-size:11px">${v === linea ? 'Línea de tu partido' : ''}</span></button>`).join('')}</div>`;
      const m = UI.modal({ titulo: 'Convalidación · ' + prog.n, icono: '📑', cuerpo, clase: 'medio', sinCerrar: true });
      m.cuerpo.addEventListener('click', e => { const bt = e.target.closest('[data-v]'); if (!bt) return; m.cerrar(); T.convalidar(E, pv.c, d, bt.dataset.v); C.App.refrescar(); });
    }
  };
})(window.ESP);

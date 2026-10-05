/* Leyes según el nivel: ámbito Congreso, Parlamento autonómico y pleno municipal. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const ETQ = { tramite: ['En tramitación', 'amar'], aprobada: ['Aprobada', 'verde'], rechazada: ['Rechazada', 'rojo'] };

  const LN = C.Pantallas.leyesNiv = {
    /* Ámbitos disponibles según tu situación. */
    ambitos(E) {
      const J = E.jugador, out = [['congreso', '🏛 Congreso']];
      if (J.region && E.esp.ccaa[J.region]) out.push(['aut', '🗺 ' + D().ccaa[J.region].nombre]);
      if (J.muni && E.esp.muni.m[J.muni]) out.push(['muni', '🏘 ' + E.esp.muni.m[J.muni].nombre]);
      return out;
    },
    defecto(E) {
      const J = E.jugador, ok = LN.ambitos(E).map(a => a[0]);
      const p = ['dipauto', 'consejero', 'presauto'].includes(J.cargo) ? 'aut' : ['concejal', 'alcalde'].includes(J.cargo) ? 'muni' : 'congreso';
      return ok.includes(p) ? p : 'congreso';
    },
    barra(E, amb) {
      const a = LN.ambitos(E); if (a.length < 2) return '';
      return `<div class="seg" style="margin-bottom:12px">${a.map(([k, n]) => `<button data-amb="${k}" class="${amb === k ? 'activo' : ''}">${esc(n)}</button>`).join('')}</div>`;
    },
    enlazar(el) { UI.$$('[data-amb]', el).forEach(b => b.onclick = () => C.App.ir('leyes', { amb: b.dataset.amb, tab: C.E.ui.tabLeyes })); },
    /* ¿Participas en las votaciones del Congreso? Si no, las sigues como observador. */
    observador(E) { const J = E.jugador; return !J.electo && !['pm', 'ministro', 'diputado'].includes(J.cargo); },

    pagina(E, amb) {
      const J = E.jugador;
      const cab = amb === 'aut' ? `Parlamento de ${esc(D().ccaa[J.region].nombre)}` : `Pleno de ${esc(E.esp.muni.m[J.muni].nombre)}`;
      return `<div class="cab"><div><h1>Leyes</h1><div class="sub">${cab}</div></div></div>${LN.barra(E, amb)}${amb === 'aut' ? LN.autonomico(E) : LN.municipal(E)}`;
    },

    autonomico(E) {
      const J = E.jugador, c = J.region, rc = E.esp.ccaa[c], T = C.Territorio; T.asegurarAut(E, c);
      const tot = U.suma(Object.values(rc.parl.escanos)), may = Math.floor(tot / 2) + 1, puede = C.Acciones.puede('proponer_ley_aut', {}), razon = C.Acciones.razon('proponer_ley_aut', {});
      const esc0 = rc.parl.escanos, partidos = Object.keys(esc0).sort((a, b) => esc0[b] - esc0[a]);
      const ley = l => { const e = ETQ[l.estado]; const pr = l.v && l.v.p != null ? Math.round(l.v.p * 100) : null; const prog = T.programa(l.prog); return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${l.jugador ? '⭐ ' : ''}${esc(prog ? prog.n : l.prog)}</b><span>${esc(l.quien)} (${esc(E.partidos[l.pid].sigla)}) · ${U.fmtT(l.t0, true)}${pr != null && l.estado === 'tramite' ? ' · prob. ≈ ' + pr + ' %' : ''}</span></div><span class="etq ${e[1]}">${e[0]}</span></div>`; };
      const tr = (rc.leyes || []).filter(l => l.estado === 'tramite'), hist = (rc.leyes || []).filter(l => l.estado !== 'tramite');
      const lista = T.leyesDisponibles(E, c);
      const grid = lista.map(p => { const v = T.votoLeyAut(E, c, p, J.partido), en = (rc.leyes || []).some(l => l.prog === p.id && l.estado === 'tramite'), ci = D().consejerias[p.area]; return `<div class="tarjeta"><div class="fila" style="gap:6px"><span>${ci ? ci.icono : '📜'}</span><b>${esc(p.n)}</b></div><div class="tenue" style="font-size:12.5px;margin:6px 0">${esc(p.d)}</div><div class="fila" style="gap:6px;margin-bottom:8px"><span class="etq ${v.p >= 0.6 ? 'verde' : v.p >= 0.4 ? 'amar' : 'rojo'}">Apoyo previsto ${Math.round(v.p * 100)} %</span><span class="etq">${v.si} sí · ${v.no} no · mayoría ${v.may}</span></div>${en ? '<span class="etq amar">En tramitación</span>' : puede === true ? UI.botonAccion('proponer_ley_aut', { prog: p.id }, '📜 Presentar proposición', 'chico') : '<span class="tenue" style="font-size:12px">' + esc(String(puede)) + '</span>'}</div>`; }).join('');
      return `<div class="grid g-dash"><div class="col"><div class="tarjeta"><h3>Composición del Parlamento · mayoría ${may} de ${tot}</h3><div class="chips">${partidos.map(k => `<span class="etq">${Comp.partido(E, k, true)} ${esc0[k]}</span>`).join('')}</div><p class="tenue" style="font-size:12.5px;margin:8px 0 0">${razon === true ? 'Como diputado/a autonómico/a puedes presentar proposiciones de ley. Se votan a las tres semanas.' : esc(String(razon))}</p></div>
        <div class="tarjeta"><h3>En tramitación (${tr.length})</h3><div class="lista">${tr.map(ley).join('') || '<div class="vacio" style="padding:10px">No hay leyes en el Parlamento ahora mismo.</div>'}</div></div>
        <div class="tarjeta"><h3>Historial</h3><div class="lista">${hist.map(ley).join('') || '<div class="vacio" style="padding:10px">Aún no se ha votado ninguna ley en esta legislatura.</div>'}</div></div></div>
        <div class="col"><h3 class="imp-sec" style="margin:0 0 6px">Leyes que puedes presentar</h3><div class="sel-grid" style="grid-template-columns:1fr">${grid || '<div class="vacio">Tu comunidad no tiene competencias para legislar en estas áreas.</div>'}</div></div></div>`;
    },

    municipal(E) {
      const J = E.jugador, id = J.muni, m = E.esp.muni.m[id], Mu = C.Municipios, alc = J.cargo === 'alcalde', conc = J.cargo === 'concejal';
      const tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1, esc0 = m.esc;
      const pr = Mu.probMocion(E, id, J.partido);
      const accion = mo => alc ? (mo.tipo === 'gasto' ? UI.botonAccion('politica_gasto', { area: mo.area, nivel: mo.nivel }, 'Llevar al pleno', 'chico') : mo.tipo === 'ibi' ? UI.botonAccion('politica_ibi', { dir: mo.dir > 0 ? 'subir' : 'bajar' }, 'Llevar al pleno', 'chico') : UI.botonAccion('proyecto_urbano', { proy: mo.proy }, 'Llevar al pleno', 'chico'))
        : conc ? UI.botonAccion('mocion_pleno', { k: mo.k }, '🏘️ Presentar moción', 'chico') : '<span class="tenue" style="font-size:12px">Necesitas ser concejal/a</span>';
      const grid = Mu.mocionesDisponibles(E, id).map(mo => `<div class="tarjeta"><div class="fila" style="gap:6px"><span>${mo.icono}</span><b>${esc(mo.n)}</b></div><div class="tenue" style="font-size:12.5px;margin:6px 0">${esc(mo.d)}</div>${conc ? `<div class="fila" style="gap:6px;margin-bottom:8px"><span class="etq ${pr.p >= 0.6 ? 'verde' : pr.p >= 0.4 ? 'amar' : 'rojo'}">Apoyo previsto ${Math.round(pr.p * 100)} %</span></div>` : ''}${accion(mo)}</div>`).join('');
      const hist = (m.pleno || []).map(x => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1"><b style="white-space:normal;font-size:13px">${esc(x.asunto)}</b><span>${esc(x.txt)}</span></div><span class="etq ${x.ok ? 'verde' : 'rojo'}">${x.ok ? 'Aprobado' : 'Rechazado'}</span></div>`).join('');
      return `<div class="grid g-dash"><div class="col"><div class="tarjeta"><h3>Pleno · mayoría ${may} de ${tot} concejales</h3><div class="chips">${Object.keys(esc0).sort((a, b) => esc0[b] - esc0[a]).map(k => `<span class="etq ${m.coal.includes(k) ? 'oro' : ''}">${E.partidos[k] ? Comp.partido(E, k, true) : esc(k)} ${esc0[k]}</span>`).join('')}</div><p class="tenue" style="font-size:12.5px;margin:8px 0 0">Gobierna ${m.coal.map(k => E.partidos[k] ? esc(E.partidos[k].sigla) : esc(k)).join(' + ')}. ${alc ? 'Como alcalde/sa llevas acuerdos al pleno.' : conc ? 'Como concejal/a presentas mociones; si prosperan, el gobierno municipal las aplica.' : ''}</p></div>
        <div class="tarjeta"><h3>Acuerdos recientes del pleno</h3><div class="lista">${hist || '<div class="vacio" style="padding:10px">Todavía no hay acuerdos.</div>'}</div></div></div>
        <div class="col"><h3 class="imp-sec" style="margin:0 0 6px">${alc ? 'Acuerdos que puedes llevar al pleno' : 'Mociones que puedes presentar'}</h3><div class="sel-grid" style="grid-template-columns:1fr">${grid}</div></div></div>`;
    }
  };
})(window.ESP);

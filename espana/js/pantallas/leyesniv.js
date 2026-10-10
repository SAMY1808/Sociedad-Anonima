/* Leyes según el nivel: ámbito Congreso, Parlamento autonómico y pleno municipal. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const ETQ = { tramite: ['En tramitación', 'amar'], aprobada: ['Aprobada', 'verde'], rechazada: ['Rechazada', 'rojo'] };

  const LN = C.Pantallas.leyesNiv = {
    /* Ámbitos disponibles según tu situación. */
    ambitos(E) {
      const J = E.jugador, out = [['congreso', '🏛 Congreso']];
      if (J.region && E.esp.ccaa[J.region]) out.push(['aut', '🗺 ' + D().ccaa[J.region].nombre]);
      if (J.muni && E.esp.muni.m[J.muni]) out.push(['muni', '🏘 ' + E.esp.muni.m[J.muni].nombre]);
      const lim = C.Foco && C.Foco.ambitosLey(E); const f = lim ? out.filter(a => lim.includes(a[0])) : out; return f.length ? f : out;
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
    enlazar(el) {
      UI.$$('[data-ley-aut]', el).forEach(f => f.onclick = () => LN.verLeyAut(f.dataset.leyAut));
      UI.$$('[data-tab-aut]', el).forEach(b => b.onclick = () => { C.E.ui.tabAut = b.dataset.tabAut; C.App.refrescar(); });
      const vb = UI.$('#la-votar', el); if (vb) vb.onclick = () => LN.modalVotoAut();
      UI.$$('[data-amb]', el).forEach(b => b.onclick = () => C.App.ir('leyes', { amb: b.dataset.amb, tab: C.E.ui.tabLeyes })); },
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
      const tab = C.E.ui.tabAut || 'tramite';
      const tr = (rc.leyes || []).filter(l => l.estado === 'tramite'), hist = (rc.leyes || []).filter(l => l.estado !== 'tramite');
      const ley = l => {
        const e = ETQ[l.estado], prog = T.programa(l.prog), act = l.etapa && l.estado === 'tramite';
        let pr = null; if (act) pr = T.proyectarAut(E, c, l);
        const stage = act ? T.ETAPAS_AUT.map(([k, n]) => `<span class="etq ${k === l.etapa ? 'oro' : T.ETAPAS_AUT.findIndex(x => x[0] === k) < T.ETAPAS_AUT.findIndex(x => x[0] === l.etapa) ? 'verde' : ''}">${n}</span>`).join(' ') : '';
        return `<div class="tarjeta clic" data-ley-aut="${l.id}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start;gap:12px"><div style="min-width:0"><b style="font-size:15px;white-space:normal">${l.jugador ? '⭐ ' : ''}${esc(prog ? prog.n : l.prog)}</b><div class="tenue" style="font-size:12.5px;margin-top:2px">${esc(l.quien)} (${esc(E.partidos[l.pid].sigla)}) · ${U.fmtT(l.t0, true)}</div></div><span class="etq ${e[1]}">${e[0]}</span></div>
          ${act ? `<div class="fila" style="gap:4px;margin-top:8px">${stage}</div><div class="fila" style="margin-top:8px;font-size:12px;gap:10px"><span class="tenue">Proyección</span><span class="bien">${pr.si} sí</span><span class="mal">${pr.no} no</span><span class="tenue">${pr.abs} abst.</span><span class="${pr.dist > 0 ? 'bien' : 'mal'}" style="margin-left:auto">${pr.dist > 0 ? 'Saldría adelante' : 'Decaería'}</span></div>` : l.v ? `<div class="fila" style="margin-top:8px;font-size:12px;gap:10px"><span class="bien">${l.v.si} sí</span><span class="mal">${l.v.no} no</span><span class="tenue">${l.v.abs} abst.</span></div>` : ''}</div>`;
      };
      const grid = T.leyesDisponibles(E, c).map(p => { const v = T.votoLeyAut(E, c, p, J.partido), en = (rc.leyes || []).some(l => l.prog === p.id && l.estado === 'tramite'), ci = D().consejerias[p.area]; return `<div class="tarjeta"><div class="fila" style="gap:6px"><span>${ci ? ci.icono : '📜'}</span><b>${esc(p.n)}</b></div><div class="tenue" style="font-size:12.5px;margin:6px 0">${esc(p.d)}</div><div class="fila" style="gap:6px;margin-bottom:8px"><span class="etq ${v.dist > 0 ? 'verde' : 'rojo'}">Apoyo inicial ${v.si} sí · ${v.no} no</span><span class="etq">mayoría simple</span></div>${en ? '<span class="etq amar">En tramitación</span>' : puede === true ? UI.botonAccion('proponer_ley_aut', { prog: p.id }, '📜 Presentar proposición', 'chico') : '<span class="tenue" style="font-size:12px">' + esc(String(puede)) + '</span>'}</div>`; }).join('');
      let cuerpo;
      if (tab === 'presentar') cuerpo = `<div class="sel-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${grid || '<div class="vacio">Tu comunidad no tiene competencias para legislar en estas áreas.</div>'}</div>`;
      else if (tab === 'historial') cuerpo = hist.length ? `<div class="col">${hist.map(ley).join('')}</div>` : '<div class="vacio">Aún no se ha votado ninguna ley en esta legislatura.</div>';
      else cuerpo = tr.length ? `<div class="col">${tr.map(ley).join('')}</div>` : '<div class="vacio">No hay leyes en el Parlamento ahora mismo. Presenta una proposición o espera a que el Gobierno o la oposición registren las suyas.</div>';
      const aviso = E.esp.pendienteVotoAut ? `<div class="nota" style="border-color:var(--oro);margin-bottom:12px">🗳 Tienes una votación en el pleno. <button class="btn chico prim" id="la-votar">Votar ahora</button></div>` : '';
      return `${aviso}<div class="tarjeta" style="margin-bottom:12px"><h3>Composición del Parlamento · mayoría simple (más síes que noes)</h3><div class="chips">${partidos.map(k => `<span class="etq">${Comp.partido(E, k, true)} ${esc0[k]}</span>`).join('')}</div><p class="tenue" style="font-size:12.5px;margin:8px 0 0">${razon === true ? 'Como diputado/a autonómico/a presentas proposiciones, cabildeas con cada grupo, intervienes en el debate, negocias en bloque y votas. Cada ley pasa por registro, comisión y pleno.' : esc(String(razon))}</p></div>
        <div class="tabs"><button data-tab-aut="tramite" class="${tab === 'tramite' ? 'activo' : ''}">En trámite (${tr.length})</button><button data-tab-aut="presentar" class="${tab === 'presentar' ? 'activo' : ''}">Presentar proposición</button><button data-tab-aut="historial" class="${tab === 'historial' ? 'activo' : ''}">Historial (${hist.length})</button></div>${cuerpo}`;
    },

    /* Ficha de una ley autonómica: proyección, grupos, cabildeo, intervención y negociación en bloque. */
    verLeyAut(id) {
      const E = C.E, J = E.jugador, c = J.region, T = C.Territorio, rc = E.esp.ccaa[c], b = T.leyAut(E, c, id); if (!b) return;
      const prog = T.programa(b.prog), act = T.activa(b), enP = T.jugadorEnParl(E, c), esc0 = rc.parl.escanos;
      const pr = act ? T.proyectarAut(E, c, b) : null, VT = { si: 'A favor', abs: 'Abstención', no: 'En contra' }, VTC = { si: 'verde', abs: 'amar', no: 'rojo' };
      const partidos = Object.keys(esc0).sort((a, b2) => esc0[b2] - esc0[a]);
      const filas = partidos.map(k => {
        const ps = act ? pr.pos[k] : null, v = act ? ps.voto : (b.v && b.v.det[k] ? b.v.det[k].linea : 'abs');
        const det = ps ? ps.factores.map(x => `<div class="tt-f"><span>${esc(x[0])}</span><b class="${x[1] >= 0 ? 'bien' : 'mal'}">${U.signo(x[1], 2)}</b></div>`).join('') : '';
        const rs = !act && b.v && b.v.det[k] ? `${b.v.det[k].si} sí · ${b.v.det[k].no} no · ${b.v.det[k].abs} abst.` : '';
        return `<tr><td>${Comp.partido(E, k)}</td><td class="num">${esc0[k]}</td><td><span class="etq ${VTC[v]}"${det ? UI.tt(det) : ''}>${VT[v]}</span></td><td class="tenue" style="font-size:12px">${rs || (b.cab[k] ? 'Cabildeo ' + U.signo(b.cab[k], 2) : '')}${b.neg[k] ? ' · Pacto ' + U.signo(b.neg[k], 2) : ''}</td>
          <td style="text-align:right">${act && enP ? UI.botonAccion('cabildear_ley_aut', { ley: b.id, pid: k, lado: 'si' }, '👍', 'chico') + ' ' + UI.botonAccion('cabildear_ley_aut', { ley: b.id, pid: k, lado: 'no' }, '👎', 'chico') : ''}</td></tr>`;
      }).join('');
      const acc = act && enP ? `<div class="fila" style="gap:8px;margin:12px 0">${['comision', 'pleno'].includes(b.etapa) && !b.intervEtapa ? UI.botonAccion('intervenir_ley_aut', { ley: b.id }, '🎤 Intervenir en el debate', 'chico') : ''}<button class="btn chico prim" id="la-neg">🧩 Negociar en bloque…</button></div>` : act ? '<div class="nota" style="margin:10px 0">Sólo los diputados autonómicos pueden cabildear, intervenir y negociar.</div>' : '';
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${esc(b.quien)} (${esc(E.partidos[b.pid].sigla)}) · ${esc(D().consejerias[prog.area] ? D().consejerias[prog.area].nombre : '')}</div><p style="margin:6px 0 10px;font-size:14px">${esc(prog.d)}</p>
        <div class="fila" style="gap:4px;margin-bottom:10px">${T.ETAPAS_AUT.map(([k, n]) => `<span class="etq ${k === b.etapa ? 'oro' : T.ETAPAS_AUT.findIndex(x => x[0] === k) < T.ETAPAS_AUT.findIndex(x => x[0] === b.etapa) ? 'verde' : ''}">${n}</span>`).join(' ')}${b.enm ? `<span class="etq amar">${b.enm} enmienda(s) aceptada(s)</span>` : ''}</div>
        ${pr ? `${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.tot, mayoria: pr.may, alto: 18 })}<div class="tenue" style="font-size:12px;margin-top:4px">Proyección: ${pr.si} sí · ${pr.no} no · ${pr.abs} abstenciones. ${pr.dist > 0 ? '<b class="bien">Saldría adelante</b>' : '<b class="mal">Decaería</b>'} (mayoría simple).</div>` : b.v ? `<div style="text-align:center;margin:6px 0"><span class="sello ${b.v.ok ? 'ok' : 'ko'}">${b.v.ok ? 'Aprobada' : 'Rechazada'}</span></div>${G.apilada([{ etq: 'A favor', v: b.v.si, color: 'var(--si)' }, { etq: 'Abstención', v: b.v.abs, color: 'var(--abs)' }, { etq: 'En contra', v: b.v.no, color: 'var(--no)' }], { total: pr ? pr.tot : b.v.si + b.v.no + b.v.abs, alto: 18 })}` : ''}
        ${acc}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Posición de los grupos</h3>
        <table class="tabla apila"><thead><tr><th>Grupo</th><th class="num">Esc.</th><th>Postura</th><th>Detalle</th><th></th></tr></thead><tbody>${filas}</tbody></table>
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Historial</h3>
        <div class="lista" style="font-size:12.5px">${b.hist.map(h => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('')}</div>`;
      UI.modal({ titulo: prog.n, icono: '📜', cuerpo, clase: 'medio' }, null);
      const nb = UI.$('#la-neg'); if (nb) nb.onclick = () => LN.negociar(id);
    },

    /* Constructor de bloque: elige grupos y contrapartidas, y ve cómo cambia la proyección. */
    negociar(id) {
      const E = C.E, J = E.jugador, c = J.region, T = C.Territorio, rc = E.esp.ccaa[c], b = T.leyAut(E, c, id); if (!T.activa(b)) return;
      const esc0 = rc.parl.escanos, partidos = Object.keys(esc0).filter(k => k !== J.partido).sort((a, b2) => esc0[b2] - esc0[a]);
      const sel = {}, ofs = T.OFERTAS_AUT;
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">Ofrece una contrapartida a cada grupo que quieras sumar. Cada acuerdo se negocia por separado: los grupos lejanos a tu bloque piden más y pueden vetar.</p>
        <div class="fila" style="margin-bottom:6px"><b>Voto previsto:</b> <span id="nb-res" class="num"></span></div><div id="nb-barra"></div><div id="nb-sum" class="tenue" style="font-size:12px;margin:4px 0 8px"></div>
        <div class="lista">${partidos.map(k => { const p = E.partidos[k]; return `<div class="it" style="flex-wrap:wrap"><span class="pto" style="background:${p.color}"></span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(p.sigla)}</b><span>${esc0[k]} escaños · <span id="nb-e-${k}"></span></span></div><select data-of="${k}"><option value="">Sin oferta</option>${Object.keys(ofs).map(o => `<option value="${o}">${ofs[o].icono} ${esc(ofs[o].n)}</option>`).join('')}</select></div>`; }).join('')}</div>`;
      const m = UI.modal({ titulo: '🧩 Negociar en bloque', icono: '🤝', clase: 'medio', cuerpo, pie: '<button class="btn" id="nb-no">Cancelar</button><button class="btn prim" id="nb-ok">Cerrar el acuerdo (2 ◆)</button>' });
      const VT = { si: ['A favor', 'verde'], abs: ['Abstención', 'amar'], no: ['En contra', 'rojo'] };
      const act = () => {
        const sim = Object.assign({}, b, { neg: Object.assign({}, b.neg) });
        for (const k in sel) if (sel[k]) sim.neg[k] = (sim.neg[k] || 0) + ofs[sel[k]].v * 0.8;
        const pr = T.proyectarAut(E, c, sim);
        UI.$('#nb-res', m.el).textContent = `${pr.si} a favor · ${pr.no} en contra · ${pr.abs} abstenciones`;
        UI.$('#nb-barra', m.el).innerHTML = G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.tot, mayoria: pr.may, alto: 18 });
        UI.$('#nb-sum', m.el).innerHTML = pr.dist > 0 ? '<b class="bien">✔ Con estas contrapartidas saldría adelante.</b>' : `<b class="mal">✘ Aún no hay mayoría (faltan ${1 - pr.dist} votos de diferencia).</b>`;
        partidos.forEach(k => { const e = UI.$('#nb-e-' + k, m.el), v = pr.pos[k].voto; e.innerHTML = `<span class="etq ${VT[v][1]}">${VT[v][0]}</span>`; });
      };
      UI.$$('[data-of]', m.el).forEach(s => s.onchange = () => { sel[s.dataset.of] = s.value; act(); });
      act();
      UI.$('#nb-no', m.el).onclick = () => m.cerrar();
      UI.$('#nb-ok', m.el).onclick = () => { const of = {}; for (const k in sel) if (sel[k]) of[k] = sel[k]; if (!Object.keys(of).length) return UI.toast('Elige al menos una contrapartida.', 'mal'); m.cerrar(); UI.accion('negociar_bloque_aut', { ley: id, ofertas: of }, {}); setTimeout(() => LN.verLeyAut(id), 60); };
    },

    /* Votación del jugador en el pleno del Parlamento autonómico. */
    modalVotoAut() {
      const E = C.E, pv = E.esp.pendienteVotoAut, T = C.Territorio; if (!pv) return C.App.revisarPendientes();
      const b = T.leyAut(E, pv.c, pv.id); if (!b || b.estado !== 'tramite') { E.esp.pendienteVotoAut = null; return C.App.revisarPendientes(); }
      const J = E.jugador, prog = T.programa(b.prog), pr = T.proyectarAut(E, pv.c, b), linea = pr.pos[J.partido] ? pr.pos[J.partido].voto : 'abs';
      const VT = { si: 'A favor', abs: 'Abstención', no: 'En contra' }, VTC = { si: 'verde', abs: 'amar', no: 'rojo' }, esc0 = E.esp.ccaa[pv.c].parl.escanos;
      const filas = Object.keys(esc0).sort((a, b2) => esc0[b2] - esc0[a]).map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${esc0[k]}</td><td><span class="etq ${VTC[pr.pos[k].voto]}">${VT[pr.pos[k].voto]}</span></td></tr>`).join('');
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${esc(b.quien)} (${esc(E.partidos[b.pid].sigla)}) · Parlamento de ${esc(D().ccaa[pv.c].nombre)}</div><p style="margin:6px 0 10px;font-size:14.5px">${esc(prog.d)}</p>
        ${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.tot, mayoria: pr.may, alto: 18 })}
        <div class="tenue" style="font-size:12px;margin:4px 0 10px">Proyección: ${pr.si} sí · ${pr.no} no · ${pr.abs} abst. ${pr.dist > 0 ? '<b class="bien">Saldría adelante</b>' : '<b class="mal">Decaería</b>'}</div>
        <table class="tabla"><tbody>${filas}</tbody></table>
        <div class="voto-btns">${['si', 'abs', 'no'].map(v => `<button class="btn ${v} ${v === linea ? 'linea' : ''}" data-v="${v}"><b>${VT[v]}</b><span class="tenue" style="font-size:11px">${v === linea ? 'Línea de tu partido' : ''}</span></button>`).join('')}</div>`;
      const m = UI.modal({ titulo: 'Votación en el Parlamento · ' + prog.n, icono: '🗳', cuerpo, clase: 'medio', sinCerrar: true });
      m.cuerpo.addEventListener('click', e => { const bt = e.target.closest('[data-v]'); if (!bt) return; m.cerrar(); T.votarLey(E, pv.c, b, bt.dataset.v); C.App.refrescar(); LN.verLeyAut(b.id); });
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

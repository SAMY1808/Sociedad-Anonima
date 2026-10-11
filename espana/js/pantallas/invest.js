/* Investidura: calendario de los procedimientos (Cortes y parlamentos autonómicos) y decisiones del jugador
   (proponer candidato como presidente de la Cámara, presentarse como candidato y negociar el bloque). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const ICO = { hecho: '✔', actual: '●', pendiente: '○' };
  const COL = { hecho: 'var(--si)', actual: 'var(--oro)', pendiente: 'var(--tenue)' };

  const pasos = (E, cal) => `<div class="lista">${cal.pasos.map(p => `<div class="it" style="align-items:flex-start;${p.e === 'actual' ? 'background:var(--oro-tenue);border-radius:6px' : ''}"><span style="width:18px;color:${COL[p.e]};font-weight:700">${ICO[p.e]}</span><div class="cuerpo" style="flex:1"><b style="white-space:normal;font-size:13.5px;${p.limite ? 'color:var(--texto2)' : ''}">${esc(p.n)}</b>${p.nota ? `<span>${esc(p.nota)}</span>` : ''}</div><span class="tenue" style="font-size:12px;text-align:right;white-space:nowrap">${p.t != null ? U.fmtT(p.t, true) + (p.e !== 'hecho' ? '<br>' + Comp.semanasA(E, p.t) : '') : ''}</span></div>`).join('')}</div>`;

  const Inv = C.Pantallas.invest = {
    calendario(E) {
      const T = C.Territorio, J = E.jugador, ids = T.ids().slice().sort((a, b) => D().ccaa[a].nombre.localeCompare(D().ccaa[b].nombre));
      const reg = E.ui.regInv || J.region || ids[0], rc = E.esp.ccaa[reg], cs = E.esp.cortes;
      const calC = T.calendarioCentral(E), calA = T.calendarioAut(E, reg), v = rc.inv;
      const acciones = [];
      if (T.puedePresentarme(E, reg)) acciones.push(`<button class="btn prim chico" data-inv-pres="${reg}">🗣 Presentar mi candidatura a la presidencia</button>`);
      if (v && v.voluntario && (v.estado === 'constitucion' || v.estado === 'consultas') && T.jugadorEnParl(E, reg)) acciones.push('<span class="etq verde">Has anunciado tu candidatura</span>');
      if (E.esp.pendienteInvAut) acciones.push('<button class="btn prim chico" data-inv-abrir="1">⚖️ Tienes una decisión pendiente</button>');
      const rolC = cs.mesa && cs.mesa.presidente === 'J' && ['consultas', 'nominaJ', 'investidura'].includes(cs.estado) ? '<span class="etq oro">Presides el Congreso</span>' : '';
      const rolA = v && v.mesa && v.mesa.pres === 'J' ? '<span class="etq oro">Presides el Parlamento</span>' : '';
      return `<div class="grid g2"><div class="tarjeta"><div class="t-cab"><h3>🏛 Investidura del Presidente del Gobierno</h3>${rolC}</div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:8px">${calC.activo ? 'Procedimiento en curso.' : cs.estado === 'disueltas' ? 'Cortes disueltas: la campaña termina con las elecciones generales.' : 'Gobierno formado. Así será el procedimiento tras las próximas generales: constitución de las Cortes a las 4 semanas, consultas del Rey, debate (176 votos en primera votación, mayoría simple en la segunda) y disolución si pasan dos meses sin presidente.'}</div>${pasos(E, calC)}</div>
        <div class="tarjeta"><div class="t-cab"><h3>🏛 Investidura autonómica</h3><select id="inv-reg">${ids.map(c => `<option value="${c}" ${c === reg ? 'selected' : ''}>${esc(D().ccaa[c].nombre)}</option>`).join('')}</select></div>
        <div class="fila" style="margin-bottom:8px;gap:6px">${rolA}${acciones.join('')}</div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:8px">${calA.activo ? 'Procedimiento en curso en el Parlamento de ' + esc(D().ccaa[reg].nombre) + '. El Gobierno saliente sigue en funciones.' : 'Sin procedimiento abierto. Tras unas elecciones: sesión constitutiva a las 4 semanas, consultas de la Presidencia del Parlamento, debate (mayoría absoluta; después simple) y plazo máximo de dos meses.'}</div>${pasos(E, calA)}</div></div>${C.Pantallas.gobaut ? C.Pantallas.gobaut.panel(E) : ''}`;
    },

    enlazar(el) {
      const E = C.E, T = C.Territorio;
      const sr = UI.$('#inv-reg', el); if (sr) sr.onchange = () => { E.ui.regInv = sr.value; C.App.refrescar(); };
      UI.$$('[data-inv-pres]', el).forEach(b => b.onclick = () => { if (T.presentarme(E, b.dataset.invPres)) UI.toast('Has anunciado tu candidatura: si la Presidencia del Parlamento te propone, negociarás tu bloque.', 'bien'); C.App.refrescar(); });
      UI.$$('[data-inv-abrir]', el).forEach(b => b.onclick = () => Inv.modal());
    },

    modal() {
      const E = C.E, pa = E.esp.pendienteInvAut; if (!pa) return C.App.revisarPendientes();
      if (pa.tipo === 'nominar') return pa.c === 'ES' ? Inv.nominarCentral() : Inv.nominarAut(pa.c);
      return Inv.candidatoAut(pa.c);
    },

    /* El jugador preside el Congreso: propone el candidato al Rey. */
    nominarCentral() {
      const E = C.E, Ej = C.Ejecutivo, ops = Ej.candidatosInv(E);
      const filas = ops.map(o => { const ev = o.plan.ev, l = E.politicos[E.partidos[o.p].lider]; return `<div class="it" style="flex-wrap:wrap"><span class="pto" style="background:${E.partidos[o.p].color}"></span><div class="cuerpo" style="flex:1;min-width:180px"><b>${esc(l ? l.n : '')} · ${esc(E.partidos[o.p].sigla)}</b><span>${E.paises.ES.escanos[o.p]} escaños · bloque previsto: ${ev.si} sí · ${ev.no} no · ${ev.abs} abst.</span></div><span class="etq ${ev.exito1 ? 'verde' : ev.exito2 ? 'amar' : 'rojo'}">${ev.exito1 ? 'Mayoría absoluta' : ev.exito2 ? 'Mayoría simple' : 'Sin apoyos'}</span><button class="btn chico prim" data-nom="${o.p}">Proponer</button></div>`; }).join('');
      const m = UI.modal({ titulo: '🏛 Propón al candidato a la Presidencia del Gobierno', icono: '👑', clase: 'medio', sinCerrar: true, cuerpo: `<p style="margin-top:0;font-size:13.5px">Como presidente/a del Congreso, tras la ronda de consultas con los grupos, propones al Rey el candidato a la investidura. Si fracasa se abrirá una nueva ronda; a los dos meses de la primera votación sin presidente, se disuelven las Cortes.</p><div class="lista">${filas}</div>` });
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-nom]'); if (!b) return; m.cerrar(); Ej.nominarJugador(E, b.dataset.nom); C.App.refrescar(); C.App.revisarPendientes(); });
    },

    /* El jugador preside el Parlamento autonómico: propone candidato. */
    nominarAut(c) {
      const E = C.E, T = C.Territorio, ops = T.invOpciones(E, c), may = ops.length ? ops[0].b.may : 0;
      const filas = ops.map(o => { const b = o.b; return `<div class="it" style="flex-wrap:wrap"><span class="pto" style="background:${E.partidos[o.p].color}"></span><div class="cuerpo" style="flex:1;min-width:180px"><b>${esc(o.cab.n)}${o.jug ? ' (tú)' : ''} · ${esc(E.partidos[o.p].sigla)}</b><span>${E.esp.ccaa[c].parl.escanos[o.p]} escaños · bloque ${b.bloque.map(k => E.partidos[k].sigla).join('+')}: ${b.si} sí · ${b.no} no (mayoría ${b.may})</span></div><span class="etq ${b.si >= b.may ? 'verde' : b.si > b.no ? 'amar' : 'rojo'}">${b.si >= b.may ? 'Mayoría absoluta' : b.si > b.no ? 'Mayoría simple' : 'Sin apoyos'}</span><button class="btn chico prim" data-nom="${o.p}">Proponer</button></div>`; }).join('');
      const m = UI.modal({ titulo: `🏛 Parlamento de ${D().ccaa[c].nombre}: propón candidato/a`, icono: '🏛', clase: 'medio', sinCerrar: true, cuerpo: `<p style="margin-top:0;font-size:13.5px">Como presidente/a del Parlamento, tras las consultas con los portavoces propones un candidato a la presidencia de la comunidad (mayoría absoluta de ${may} en primera votación; simple en la segunda). Si el candidato fracasa y pasan dos meses desde la primera votación, se disuelve el Parlamento.</p><div class="lista">${filas}</div>` });
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-nom]'); if (!b) return; m.cerrar(); C.Territorio.invNominarJugador(E, c, b.dataset.nom); C.App.refrescar(); C.App.revisarPendientes(); });
    },

    /* El jugador es el candidato: negocia su bloque en el Parlamento autonómico. */
    candidatoAut(c) {
      const E = C.E, T = C.Territorio, Ej = C.Ejecutivo, rc = E.esp.ccaa[c], v = rc.inv; if (!v || !v.cand) { E.esp.pendienteInvAut = null; return C.App.revisarPendientes(); }
      const cand = v.cand, esc0 = rc.parl.escanos, may = Math.floor(U.suma(Object.values(esc0)) / 2) + 1;
      const partes = Object.keys(esc0).filter(k => k !== cand && esc0[k] > 0).sort((a, b) => esc0[b] - esc0[a]);
      const sel = new Set(T.bloque(E, c, cand).bloque);
      const Ga = C.GobAut, incompat = k => Ga.en(c, () => [...sel].some(q => q !== k && (Ej.vetaA(E, k, q) || Ej.vetaA(E, q, k))) || Ej.afinidad(E, cand, k) < 0.3);
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">Se te propone como candidato/a a presidir <b>${esc(D().ccaa[c].nombre)}</b>. Tu partido tiene ${esc0[cand]} de ${U.suma(Object.values(esc0))} escaños: necesitas <b>${may}</b> votos en primera votación (mayoría absoluta) o más síes que noes en la segunda. Negocia tu bloque: cada partido solo apoya si no veta a tus socios y la afinidad lo permite.</p>
        <div class="fila" style="margin-bottom:6px"><b>Voto previsto:</b> <span id="ci-res" class="num"></span></div><div id="ci-barra"></div><div id="ci-sum" class="tenue" style="font-size:12px;margin:4px 0 8px"></div>
        <div class="tarjeta" id="ci-neg" style="margin:6px 0 10px"><div class="t-cab"><h4 style="margin:0">🤝 Negociación</h4><span class="tenue" style="font-size:11.5px" id="ci-pts"></span></div><div class="fila" style="gap:6px;flex-wrap:wrap"><select id="ci-neg-p" style="max-width:150px">${partes.map(k => `<option value="${k}">${esc(E.partidos[k].sigla)}</option>`).join('')}</select><button class="btn chico" data-neg="cab">🤝 Cabildear</button><button class="btn chico" data-neg="programa">${Ga.CONTRA.programa.ic} Programa</button><button class="btn chico" data-neg="cargos">${Ga.CONTRA.cargos.ic} Cargos</button></div><div class="tenue" style="font-size:11.5px;margin-top:4px" id="ci-negs"></div></div>
        <div class="lista">${partes.map(k => { const p = E.partidos[k]; return `<label class="it" style="cursor:pointer;flex-wrap:wrap"><input type="checkbox" data-incl="${k}" style="width:auto;flex:none"><span class="pto" style="background:${p.color}"></span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(p.nombre)}</b><span>${esc0[k]} escaños · ${Comp.ideoTxt(p)}</span></div><span class="etq" id="ci-e-${k}"></span></label>`; }).join('')}</div>`;
      const m = UI.modal({ titulo: '🗳 Investidura: forma tu bloque', icono: '🤝', clase: 'medio', sinCerrar: true, cuerpo, pie: '<button class="btn" id="ci-no">Renunciar</button><button class="btn prim" id="ci-ok">Someterme a la votación</button>' });
      const act = () => {
        const b = T.evalBloque(E, c, cand, [...sel]);
        UI.$('#ci-res', m.el).textContent = `${b.si} a favor · ${b.no} en contra · ${U.suma(Object.values(esc0)) - b.si - b.no} abstenciones`;
        UI.$('#ci-barra', m.el).innerHTML = G.apilada([{ etq: 'A favor', v: b.si, color: 'var(--si)' }, { etq: 'Abstención', v: U.suma(Object.values(esc0)) - b.si - b.no, color: 'var(--abs)' }, { etq: 'En contra', v: b.no, color: 'var(--no)' }], { total: U.suma(Object.values(esc0)), mayoria: may, alto: 18 });
        UI.$('#ci-sum', m.el).innerHTML = b.si >= may ? '<b class="bien">✔ Mayoría absoluta: prosperaría en primera votación.</b>' : b.si > b.no ? '<b class="alerta">✔ Mayoría simple: prosperaría en segunda votación.</b>' : `<b class="mal">✘ Sin apoyos suficientes (faltan ${may - b.si} para la absoluta).</b>`;
        partes.forEach(k => { const cb = UI.$(`[data-incl="${k}"]`, m.el), e = UI.$('#ci-e-' + k, m.el), en = sel.has(k), bad = !en && incompat(k); cb.checked = en; cb.disabled = bad;
          const st = en ? ['En el bloque', 'verde'] : bad ? ['Veto / lejano', 'rojo'] : Ej.afinidad(E, cand, k) >= 0.6 ? ['Apoyo externo', 'amar'] : ['No apoya', '']; e.className = 'etq ' + st[1]; e.textContent = st[0]; });
      };
      UI.$$('[data-incl]', m.el).forEach(cb => cb.onchange = () => { if (cb.checked) sel.add(cb.dataset.incl); else sel.delete(cb.dataset.incl); act(); });
      const negAct = () => { const n = Ga.neg(E, c); UI.$('#ci-pts', m.el).textContent = '◆ ' + E.jugador.agenda.puntos; UI.$('#ci-negs', m.el).innerHTML = partes.map(k => { const b = n ? Ga.bono(n, k) : 0; return b ? esc(E.partidos[k].sigla) + ' +' + Math.round(b * 100) : ''; }).filter(Boolean).join(' · ') || 'Aún no has negociado con nadie.'; };
      UI.$$('[data-neg]', m.el).forEach(b => b.onclick = () => {
        const k = UI.$('#ci-neg-p', m.el).value, id = b.dataset.neg === 'cab' ? 'cabildear_investidura' : 'contrapartida_investidura', r = C.Acciones.ejecutar(id, { c, pid: k, tipo: b.dataset.neg });
        UI.toast(r.msg || 'No disponible', r.ok === false ? 'mal' : r.exito === false ? 'alerta' : 'bien');
        if (r.ok !== false && !incompat(k)) sel.add(k); act(); negAct();
      });
      act(); negAct();
      UI.$('#ci-no', m.el).onclick = () => { m.cerrar(); T.invRenunciaJugador(E, c); C.App.refrescar(); C.App.revisarPendientes(); };
      UI.$('#ci-ok', m.el).onclick = () => { m.cerrar(); T.invCandidatoJugador(E, c, [...sel]); UI.toast('Te someterás a la votación de investidura la próxima semana.', 'bien'); C.App.refrescar(); C.App.revisarPendientes(); };
    }
  };
})(window.ESP);

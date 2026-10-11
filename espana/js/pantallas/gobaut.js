/* Gobiernos autonómicos más vivos: panel de «Investidura» (Elecciones) con los gobiernos en funciones, bloqueos y repeticiones electorales,
   la negociación de tu investidura (cabildeo y contrapartidas) y el cordón sanitario. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const bn = c => C.Banderas ? C.Banderas.mini(c, 13) : '';
  const EST = { constitucion: 'Constitución del Parlamento', consultas: 'Consultas', nominaJ: 'Propuesta de candidato', candidatoJ: 'Candidatura', debate: 'Debate de investidura' };
  const POS = { si: ['A favor', 'verde'], abs: ['Se abstiene', 'amar'], no: ['En contra', 'rojo'], veto: ['Veto', 'rojo'] };
  const barra = (v, max, col) => `<div class="barra-h" style="height:6px;width:60px;display:inline-block;vertical-align:middle"><i style="width:${Math.min(100, v / max * 100)}%;background:${col}"></i></div>`;
  const sg = (E, k) => esc(E.partidos[k] ? E.partidos[k].sigla : k);

  C.Pantallas.gobaut = {
    /* Tabla de la negociación de la investidura del jugador. */
    negociacion(E, c) {
      const Ga = C.GobAut, J = E.jugador, rc = E.esp.ccaa[c], p = Ga.puedeNegociar(E, c);
      if (p !== true) return `<div class="tenue" style="font-size:12.5px">${esc(p)}.</div>`;
      const n = Ga.neg(E, c), esc0 = rc.parl.escanos, tot = U.suma(Object.values(esc0)), may = Math.floor(tot / 2) + 1;
      const filas = Object.keys(esc0).filter(k => k !== J.partido && esc0[k] > 0).sort((a, b) => esc0[b] - esc0[a]).map(k => {
        const pos = Ga.postura(E, c, J.partido, k), P = POS[pos], cab = n ? n.cab[k] || 0 : 0, con = n && n.con[k] ? Ga.CONTRA[n.con[k]] : null;
        const bot = pos === 'veto' ? '<span class="tenue" style="font-size:11px">Veto: rompe el cordón (abajo)</span>'
          : `${UI.botonAccion('cabildear_investidura', { c, pid: k }, '🤝', 'chico')} ${con ? '' : UI.botonAccion('contrapartida_investidura', { c, pid: k, tipo: 'programa' }, Ga.CONTRA.programa.ic, 'chico') + ' ' + UI.botonAccion('contrapartida_investidura', { c, pid: k, tipo: 'cargos' }, Ga.CONTRA.cargos.ic, 'chico')}`;
        return `<tr><td>${Comp.partido(E, k)}</td><td class="num">${esc0[k]}</td><td><span class="etq ${P[1]}">${P[0]}</span></td><td>${barra(cab, Ga.MAXCAB, 'var(--oro)')}${con ? ` <span class="etq oro" title="${esc(con.d)}">${con.ic} ${esc(con.n)}</span>` : ''}</td><td style="white-space:nowrap">${bot}</td></tr>`;
      }).join('');
      return `<div class="tenue" style="font-size:12.5px;margin-bottom:6px">Tu partido tiene <b>${esc0[J.partido] || 0}</b> de ${tot} escaños y necesitas <b>${may}</b>. Cada grupo acepta o no según su afinidad contigo; el cabildeo y las contrapartidas la mejoran, pero un veto sólo se levanta rompiendo el cordón.</div>
        <div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Grupo</th><th class="num">Esc.</th><th>Postura</th><th>Negociación</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>
        <div class="tenue" style="font-size:11.5px;margin-top:6px">🤝 Cabildear (◆ 1, una vez por semana y grupo) · ${Object.keys(Ga.CONTRA).map(k => Ga.CONTRA[k].ic + ' ' + esc(Ga.CONTRA[k].n) + ' (◆ 2, +' + Math.round(Ga.CONTRA[k].x * 100) + ')').join(' · ')}. Las contrapartidas se pagan después con estabilidad.</div>`;
    },

    panel(E) {
      const Ga = C.GobAut; if (!Ga) return '';
      const J = E.jugador, T = C.Territorio, res = Ga.resumen(E), reg = E.ui.regInv || J.region, yo = J.partido && E.partidos[J.partido];
      const filas = res.map(x => {
        const v = x.v, top = Object.keys(x.culpa).sort((a, b) => x.culpa[b] - x.culpa[a]).slice(0, 3);
        const mia = J.region === x.c && x.rep;
        return `<tr><td>${bn(x.c)}<b>${esc(D().ccaa[x.c].nombre)}</b></td><td>${v ? `<span class="etq amar" title="El Gobierno saliente sólo despacha asuntos ordinarios">En funciones</span> <span class="tenue" style="font-size:11.5px">${esc(EST[v.estado] || v.estado)} · ${x.sem} sem.</span>` : '<span class="etq rojo">Elecciones repetidas</span>'}</td>
          <td>${x.lim != null ? `<span class="${x.lim <= 2 ? 'mal' : ''}">${x.lim} sem. para la disolución</span>` : '<span class="tenue" style="font-size:11.5px">Plazo desde la 1.ª votación</span>'}${x.fallidos.length ? `<div class="tenue" style="font-size:11px">Fracasaron: ${x.fallidos.map(k => sg(E, k)).join(', ')}</div>` : ''}</td>
          <td>${x.rep ? `<b>${x.rep}</b> repetición${x.rep > 1 ? 'es' : ''}<div class="tenue" style="font-size:11px">Culpa: ${top.map(k => sg(E, k)).join(', ') || '—'}</div>` : '<span class="tenue">—</span>'}${mia ? `<div class="fila accion-form" style="gap:4px;margin-top:4px"><select data-arg="pid">${E.paises.ES.partidos.filter(k => k !== J.partido && (E.esp.ccaa[x.c].parl.escanos[k] || 0) > 0).map(k => `<option value="${k}">${sg(E, k)}</option>`).join('')}</select>${UI.botonAccion('culpar_bloqueo', { c: x.c }, '👉 Culpar', 'chico')}</div>` : ''}</td></tr>`;
      }).join('');
      const bloqueos = `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>⏳ Gobiernos en funciones y bloqueos</h3><span class="etq">${res.length ? res.length + ' comunidad' + (res.length > 1 ? 'es' : '') : 'Ninguno'}</span></div>
        ${res.length ? `<div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Comunidad</th><th>Situación</th><th>Plazo</th><th>Repetición</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<div class="tenue" style="font-size:12.5px">Ninguna comunidad tiene hoy un Gobierno en funciones ni un bloqueo.</div>'}
        <div class="tenue" style="font-size:11.5px;margin-top:6px">Tras unas elecciones, el Gobierno saliente queda <b>en funciones</b>: no presenta leyes ni presupuestos, no abre reformas ni reclama competencias. Si en dos meses desde la primera votación nadie es investido, se <b>repiten las elecciones</b>: baja la participación y los partidos culpados pierden voto.</div></div>`;
      const rcg = reg && E.esp.ccaa[reg], neg = rcg && rcg.inv && J.pais === 'ES' ? `<div class="tarjeta" style="margin-top:12px;border-color:var(--oro)"><div class="t-cab"><h3>🤝 Negociar mi investidura · ${bn(reg)}${esc(D().ccaa[reg].nombre)}</h3><span class="etq oro">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>${C.Pantallas.gobaut.negociacion(E, reg)}</div>` : '';
      const pv = reg && J.pais === 'ES' ? Ga.puedeVotar(E, reg) : null, vj = pv === true ? rcg.inv.votoJ : null;
      const voto = pv === true ? `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🗳 Tu grupo ante la investidura · ${bn(reg)}${esc(D().ccaa[reg].nombre)}</h3><span class="etq ${vj === 'no' ? 'rojo' : vj ? 'verde' : ''}">${vj ? { si: 'Apoyas', abs: 'Facilitas (abstención)', no: 'Bloqueas' }[vj] : 'Sin fijar'}</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px">Encabezas un grupo con <b>${rcg.parl.escanos[J.partido]}</b> escaños que no es el del candidato: decide si apoyas, facilitas con tu abstención o bloqueas. Si bloqueas y nadie logra la investidura, se repiten las elecciones y la opinión te culpará.</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('voto_investidura_aut', { c: reg, voto: 'si' }, '✔ Apoyar', 'chico')}${UI.botonAccion('voto_investidura_aut', { c: reg, voto: 'abs' }, '🤲 Facilitar', 'chico')}${UI.botonAccion('voto_investidura_aut', { c: reg, voto: 'no' }, '✖ Bloquear', 'chico')}</div></div>` : '';
      const cords = Ga.cordones(E).slice(0, 4), rotos = Ga.rotos(E);
      const cf = cords.map(x => { const mio = yo && x.pid === J.partido, rot = yo && Ga.roto(E, J.partido, x.pid), veto = yo && !mio && Ga.hayVeto(E, J.partido, x.pid);
        return `<tr><td>${Comp.partido(E, x.pid)}</td><td><b>${x.por.length}</b> partidos le vetan<div class="tenue" style="font-size:11px">${x.por.slice(0, 7).map(k => sg(E, k)).join(', ')}${x.por.length > 7 ? '…' : ''}</div></td><td style="white-space:nowrap">${mio ? '<span class="etq rojo">Tu partido</span>' : rot ? `<span class="etq verde">Veto roto contigo</span> ${UI.botonAccion('restaurar_cordon', { pid: x.pid }, '🔒 Restablecer', 'chico')}` : veto ? UI.botonAccion('romper_cordon', { pid: x.pid }, '🔓 Pactar con ellos', 'chico') : '<span class="tenue" style="font-size:11.5px">Sin veto contigo</span>'}</td></tr>`; }).join('');
      const cordon = `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🚧 Cordón sanitario</h3><span class="etq">${rotos.length ? rotos.length + ' ruptura' + (rotos.length > 1 ? 's' : '') : 'Intacto'}</span></div>
        <div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Partido aislado</th><th>Vetos</th><th></th></tr></thead><tbody>${cf}</tbody></table></div>
        ${rotos.length ? `<div class="lista" style="font-size:12.5px;margin-top:6px">${rotos.slice(-5).reverse().map(r => `<div class="it"><span class="etq">${U.fmtT(r.t, true)}</span><span>${sg(E, r.a)} ↔ ${sg(E, r.b)} ${r.c ? '· ' + esc(D().ccaa[r.c].nombre) : '· en todo el país'} <span class="tenue">(${r.por === 'jugador' ? 'tú' : 'la IA'})</span></span></div>`).join('')}</div>` : ''}
        <div class="tenue" style="font-size:11.5px;margin-top:6px">Los partidos se vetan entre sí: ningún bloque de investidura o de alcaldía los incluye. Pactar con un partido vetado es difícil (depende de la afinidad y de tu negociación) y cuesta prestigio y cohesión; la IA también rompe el cordón cuando un candidato se queda sin mayoría.</div></div>`;
      return bloqueos + neg + voto + cordon;
    }
  };
})(window.ESP);

/* Oposición y pactos: gobierno en la sombra, contraprogramación de las leyes del Gobierno y pactos de Estado. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const barra = (v, max, col, w) => `<div class="barra-h" style="height:6px;width:${w || 70}px;display:inline-block;vertical-align:middle"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%;background:${col}"></i></div>`;
  const TABS = [['sombra', '🎭 Gobierno en la sombra'], ['contra', '📣 Contraprogramación'], ['pactos', '🤝 Pactos de Estado']];
  const sg = (E, k) => esc(E.partidos[k] ? E.partidos[k].sigla : k);

  const Po = C.Pantallas.oposicion = {
    sombra(E) {
      const Op = C.Oposicion, Gab = C.Gabinete, razon = Op.razonOpo(E), s = Op.som(E), J = E.jugador;
      if (razon !== true) return `<div class="tarjeta"><div class="t-cab"><h3>🎭 Gobierno en la sombra</h3></div><div class="tenue" style="font-size:13px">${esc(razon)}. El gobierno en la sombra es el equipo con el que la oposición replica al Ejecutivo y se prepara para gobernar: cada ministro/a en la sombra rebate al titular de su cartera y, si llegas a La Moncloa, será la primera opción para ocupar ese ministerio.</div></div>`;
      const cob = Op.cobertura(E), n = Object.keys(s.gab).length;
      const filas = Op.cargos(E).map(c => {
        const x = s.gab[c.id], tit = Gab.persona(E, 'central', c.id), rm = Gab.rendDe(E, 'central', c.id), pool = Op.candidatos(E, c.id);
        const opts = pool.map((p, i) => `<option value="${i}" ${x && x.per === p ? 'selected' : ''}>${esc(p.n)} · ${esc(Gab.NOM_ESP[(p.esp || [])[0]] || '—')} · ${Gab.rend(E, c, p)}</option>`).join('');
        return `<tr><td><span style="font-size:16px">${c.icono}</span> <b>${esc(c.nombre)}</b></td><td>${tit ? esc(tit.n) + ` <span class="tenue">(${rm})</span>` : '<span class="tenue">—</span>'}</td>
          <td>${x ? `<b>${esc(x.per.n)}</b> <span class="tenue">(${Op.rendSombra(E, c.id)}) · ${Op.semanas(E, c.id)} sem.</span>` : '<span class="tenue">Sin nombrar</span>'}</td>
          <td class="accion-form" style="white-space:nowrap"><select data-arg="k" style="max-width:170px">${opts}</select> ${UI.botonAccion('nombrar_sombra', { min: c.id }, x ? 'Cambiar' : 'Nombrar', 'chico')}${x ? ' ' + UI.botonAccion('replica_sombra', { min: c.id }, '🎤 Réplica', 'chico') + ' ' + UI.botonAccion('cesar_sombra', { min: c.id }, '🚪', 'chico') : ''}</td></tr>`;
      }).join('');
      const hist = s.hist.length ? `<div class="lista" style="font-size:12.5px;margin-top:8px">${s.hist.slice(0, 5).map(h => `<div class="it"><span class="etq">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('')}</div>` : '';
      return `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>🎭 Gobierno en la sombra · ${sg(E, J.partido)}</h3><span class="etq oro">${n} de ${Op.cargos(E).length} carteras · ◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
        <div class="fila" style="gap:14px;flex-wrap:wrap;font-size:12.5px;margin-bottom:6px"><span>Credibilidad como alternativa <b>${Math.round(s.cred)}</b>/100 ${barra(s.cred, 100, 'var(--oro)', 90)}</span><span>Cobertura <b>${Math.round(cob * 100)} %</b></span></div>
        <div class="tenue" style="font-size:12.5px">Cada ministro/a en la sombra puede <b>replicar</b> al titular de su cartera (cada tres semanas): si rinde más, el Gobierno pierde apoyo y sube tu credibilidad. Con más cobertura y mejores nombres, tu partido gana opinión poco a poco; también mejoran tus <b>contraprogramaciones</b> en su sector. Si llegas al Gobierno, tu equipo será la primera opción de cada ministerio (con experiencia previa).</div>${hist}</div>
        <div class="tarjeta" style="margin-top:12px"><div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Cartera</th><th>Ministro/a del Gobierno</th><th>En la sombra</th><th></th></tr></thead><tbody>${filas}</tbody></table></div></div>`;
    },

    contra(E) {
      const Op = C.Oposicion, razon = Op.razonOpo(E), ls = Op.leyesGobierno(E), cp = Op.asegurar(E).cp;
      const modos = id => Object.keys(Op.MODOS).map(k => UI.botonAccion('contraprogramar', { id, modo: k }, Op.MODOS[k].ic + ' ' + Op.MODOS[k].n, 'chico')).join('');
      const filas = ls.map(p => { const c = cp[p.id], sh = Op.sombraDe(E, p), ext = c ? c.dano : 0;
        return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:230px"><b style="white-space:normal">${esc(p.t)}</b><span class="tenue" style="white-space:normal">${esc(Comp.etapa(p.etapa))} · apoyo popular <b>${Math.round(p.pop)}</b> ${barra(p.pop, 100, p.pop > 55 ? 'var(--si)' : 'var(--oro)', 60)}${c ? ` · contraprogramada ${c.n}× (−${U.d1(ext)})` : ''}${sh ? ` · ${esc(D().ministerios.find(m => m.id === sh.min).nombre)}: tu ministro/a en la sombra refuerza (${sh.rend})` : ''}</span></div>${razon === true ? `<div class="fila" style="gap:4px;flex-wrap:wrap">${modos(p.id)}</div>` : ''}</div>`; }).join('');
      return `<div class="tarjeta"><div class="t-cab"><h3>📣 Contraprogramación</h3><span class="etq">${ls.length} ley${ls.length === 1 ? '' : 'es'} del Gobierno en trámite</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:8px">Cuando el Gobierno presenta una ley, la oposición pelea el relato: <b>denunciar</b> sus defectos (efecto grande, pero si la ley es popular suena a oposición por oposición), <b>presentar una alternativa</b> o <b>cambiar el foco</b>. Todo ello resta <b>apoyo popular</b> a la ley (hasta 14 puntos), lo que cambia cómo la votan los grupos; si la ley cae, ganas prestigio; si prospera, sale herida.${razon !== true ? ' <b>' + esc(razon) + '.</b>' : ''}</div>
        <div class="lista">${filas || '<div class="vacio" style="padding:10px">El Gobierno no tiene ahora leyes en trámite.</div>'}</div></div>`;
    },

    pactos(E) {
      const Op = C.Oposicion, pe = Op.pe(E), lado = Op.lado(E), k = Op.socio(E), J = E.jugador;
      const cab = `<div class="tarjeta"><div class="t-cab"><h3>🤝 Pactos de Estado</h3><span class="etq ${lado ? 'oro' : ''}">${lado === 'oposicion' ? 'Lideras la oposición' : lado === 'gobierno' ? 'Presides el Gobierno' : 'Sin interlocución'}</span></div>
        <div class="tenue" style="font-size:12.5px">${lado ? `Tu interlocutor es <b>${sg(E, k)}</b> (relación ${Math.round((C.Mayorias.asegurar(E).rel[k]) || 0)}). Un pacto de Estado se negocia por <b>rondas</b>: ceder avanza mucho pero tu partido lo nota; la fórmula equilibrada suele avanzar; la línea dura puede cerrarlo o romperlo. Al firmarse <b>entra en vigor la ley</b> del asunto, ganas imagen de estadista y mejora la relación con el otro lado.` : 'Sólo quien lidera la oposición o preside el Gobierno negocia pactos de Estado; el resto de cargos los ve pasar en las noticias.'}</div></div>`;
      const ofertas = pe.ofertas.length ? `<div class="tarjeta" style="margin-top:12px;border-color:var(--oro)"><div class="t-cab"><h3>📨 Ofertas recibidas</h3></div><div class="lista">${pe.ofertas.map(o => { const T0 = Op.TEMAS[o.tema]; return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${T0.ic}</span><div class="cuerpo" style="flex:1;min-width:200px"><b>${esc(T0.n)}</b><span class="tenue" style="white-space:normal">${sg(E, o.socio)} te propone negociarlo · caduca en ${Math.max(0, 6 - (E.fecha.t - o.t0))} sem.</span></div>${UI.botonAccion('responder_pacto_estado', { id: o.id, ok: '1' }, '✅ Aceptar negociar', 'chico prim')}${UI.botonAccion('responder_pacto_estado', { id: o.id, ok: '0' }, '❌ Rechazar', 'chico')}</div>`; }).join('')}</div></div>` : '';
      const act = pe.act.length ? `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🗣 Negociaciones abiertas</h3></div><div class="lista">${pe.act.map(a => { const T0 = Op.TEMAS[a.tema];
        return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${T0.ic}</span><div class="cuerpo" style="flex:1;min-width:210px"><b>${esc(T0.n)}</b><span class="tenue" style="white-space:normal">con ${sg(E, a.socio)} · progreso <b>${Math.min(99, Math.round(a.prog))} %</b> ${barra(a.prog, 100, 'var(--si)', 80)} · enfriamiento ${a.rup}/3${a.hist[0] ? ` · ${esc(a.hist[0].txt)}` : ''}</span></div>
          <div class="fila" style="gap:4px;flex-wrap:wrap">${Object.keys(Op.LINEAS).map(l => UI.botonAccion('negociar_pacto_estado', { id: a.id, linea: l }, Op.LINEAS[l].ic + ' ' + Op.LINEAS[l].n, 'chico')).join('')}${UI.botonAccion('abandonar_pacto_estado', { id: a.id }, '🚪', 'chico')}</div></div>`; }).join('')}</div></div>` : '';
      const temas = `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>📚 Asuntos de Estado</h3></div><div class="lista">${Object.keys(Op.TEMAS).map(t => { const T0 = Op.TEMAS[t], vig = Op.vigente(E, t), neg = pe.act.some(a => a.tema === t);
        return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${T0.ic}</span><div class="cuerpo" style="flex:1;min-width:210px"><b>${esc(T0.n)}</b><span class="tenue" style="white-space:normal">${esc(T0.d)}</span></div>${vig ? '<span class="etq verde">Ley vigente</span>' : neg ? '<span class="etq amar">En negociación</span>' : UI.botonAccion('proponer_pacto_estado', { tema: t }, 'Proponer', 'chico')}</div>`; }).join('')}</div></div>`;
      const fir = pe.firmados.length ? `<div class="tarjeta" style="margin-top:12px"><div class="t-cab"><h3>🖋 Pactos firmados</h3></div><div class="lista" style="font-size:12.5px">${pe.firmados.slice(0, 6).map(f => `<div class="it"><span class="etq">${U.fmtT(f.t, true)}</span><span>${Op.TEMAS[f.tema].ic} ${esc(Op.TEMAS[f.tema].n)} · con ${sg(E, f.socio)}${f.con ? ` · cediste ${f.con} vez${f.con > 1 ? 'es' : ''}` : ''}</span></div>`).join('')}</div></div>` : '';
      return cab + ofertas + act + temas + fir + '<div style="height:12px"></div>';
    },

    render(el, params) {
      const E = C.E; let tab = (params && params.tab) || E.ui.tabOpo || (C.Oposicion.lado(E) === 'gobierno' ? 'pactos' : 'sombra'); if (!TABS.some(t => t[0] === tab)) tab = 'sombra'; E.ui.tabOpo = tab;
      const cuerpo = tab === 'sombra' ? Po.sombra(E) : tab === 'contra' ? Po.contra(E) : Po.pactos(E);
      el.innerHTML = `<div class="cab"><div><h1>🎭 Oposición y pactos</h1><div class="sub">El gobierno en la sombra, la guerra del relato contra las leyes del Gobierno y los grandes pactos de Estado</div></div></div>
        <div class="tabs">${TABS.map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('oposicion', { tab: b.dataset.tab }));
    }
  };
})(window.ESP);

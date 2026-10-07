/* Leyes: proyectos en trámite, presentación de iniciativas, votaciones en el pleno y «¿qué pasó?». */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const ETAPAS = [['registro', 'Registro'], ['ponencia', 'Comisión'], ['pleno', 'Congreso'], ['senado', 'Senado'], ['fin', 'Resultado']];
  const VT = { si: 'A favor', no: 'En contra', abs: 'Abstención', aus: 'Ausente' };
  const VTC = { si: 'verde', no: 'rojo', abs: 'amar', aus: '' };
  const ACTIVAS = C.Congreso.ABIERTAS;

  const tramite = p => {
    const mal = p.etapa === 'rechazada' || p.etapa === 'archivada';
    if (p.rdl) {
      const idx = { convalidacion: 1, convalidacion_pend: 1, sancionada: 2, rechazada: 2, archivada: 2 }[p.etapa];
      const T = [['rdl', 'Decreto-ley en vigor'], ['conv', 'Convalidación (30 días)'], ['fin', 'Resultado']];
      return `<div class="tramite">${T.map(([k, n], i) => `<div class="paso ${i < idx ? 'hecha' : ''} ${i === idx ? (i === 2 ? (mal ? 'mal' : 'hecha') : 'actual') : ''}">${i === 2 ? (p.etapa === 'sancionada' ? 'Convalidado ✔' : mal ? 'Derogado' : 'Resultado') : n}</div>`).join('')}</div>`;
    }
    const idx = { registro: 0, ponencia: 1, pleno: 2, pleno_pend: 2, senado: 3, vuelta: 3, vuelta_pend: 3, sancionada: 4, rechazada: 4, archivada: 4 }[p.etapa];
    return `<div class="tramite">${ETAPAS.map(([k, n], i) => `<div class="paso ${i < idx ? 'hecha' : ''} ${i === idx ? (i === 4 ? (mal ? 'mal' : 'hecha') : 'actual') : ''}">${i === 4 ? (p.etapa === 'sancionada' ? 'Ley ✔' : mal ? (p.etapa === 'archivada' ? 'Archivada' : 'Rechazada') : 'Resultado') : (i === 3 && p.etapa.startsWith('vuelta') ? (p.veto ? 'Veto: vuelta' : 'Enmiendas') : n)}</div>`).join('')}</div>`;
  };
  const autorTxt = (E, p) => p.autor.tipo === 'territorio' ? 'Parlamento autonómico' : p.autor.tipo === 'gobierno' ? (p.rdl ? 'Real decreto-ley del Gobierno' : 'Gobierno') : p.autor.tipo === 'ue' ? 'Obligación europea' : p.autor.tipo === 'jugador' ? '<b class="oro">Tu proyecto</b>' : (p.autor.pid && E.partidos[p.autor.pid] ? E.partidos[p.autor.pid].sigla : 'Diputados');
  const sec = s => D().sectores[s] || { nombre: s, icono: '📄' };

  const L = C.Pantallas.leyes = {
    render(el, params) {
      const E = C.E, LN = C.Pantallas.leyesNiv;
      const amb = (params && params.amb) || E.ui.ambLeyes || LN.defecto(E);
      E.ui.ambLeyes = LN.ambitos(E).some(a => a[0] === amb) ? amb : 'congreso';
      if (E.ui.ambLeyes !== 'congreso') { el.innerHTML = LN.pagina(E, E.ui.ambLeyes); LN.enlazar(el); UI.$$('[data-proy]', el).forEach(f => f.onclick = () => L.ver(f.dataset.proy)); return; }
      const tab = (params && params.tab) || E.ui.tabLeyes || 'tramite';
      E.ui.tabLeyes = tab;
      const tr = Object.values(E.proyectos).filter(p => ACTIVAS.includes(p.etapa)).sort((a, b) => (b.autor.tipo === 'jugador') - (a.autor.tipo === 'jugador') || b.t0 - a.t0);
      const hist = Object.values(E.proyectos).filter(p => !ACTIVAS.includes(p.etapa)).sort((a, b) => b.tEtapa - a.tEtapa).slice(0, 40);
      el.innerHTML = `<div class="cab"><div><h1>Leyes</h1><div class="sub">Congreso de los Diputados · 350 escaños · ${E.esp.cortes.estado !== 'activa' ? '<span class="alerta">Cortes sin actividad legislativa ordinaria</span>' : C.Congreso.enRecesion(E) ? '<span class="tenue">receso parlamentario</span>' : '<span class="bien">en sesiones</span>'}</div></div>
        <div class="fila"><label class="tenue" style="font-size:12px"><input type="checkbox" id="l-auto" ${E.parl.auto ? 'checked' : ''}> Votar automáticamente con mi grupo</label></div></div>
        ${LN.barra(E, 'congreso')}${LN.observador(E) ? '<div class="nota" style="margin-bottom:12px">👀 No eres diputado/a: sigues el trabajo del Congreso como observador/a. Ves cada proyecto, su proyección y cada votación, pero sólo los diputados votan.</div>' : ''}
        ${E.parl.pendienteVoto.length ? `<div class="nota" style="border-color:var(--oro);margin-bottom:12px">🗳 Tienes <b>${E.parl.pendienteVoto.length}</b> votación(es) pendientes. <button class="btn chico prim" id="l-votar">Votar ahora</button></div>` : ''}
        <div class="tabs"><button data-tab="tramite" class="${tab === 'tramite' ? 'activo' : ''}">En trámite (${tr.length})</button><button data-tab="proponer" class="${tab === 'proponer' ? 'activo' : ''}">Presentar proyecto</button><button data-tab="vigor" class="${tab === 'vigor' ? 'activo' : ''}">En vigor (${C.Impacto.enVigor(E).length})</button><button data-tab="pais" class="${tab === 'pais' ? 'activo' : ''}">Impacto en el país</button><button data-tab="historial" class="${tab === 'historial' ? 'activo' : ''}">Historial</button></div>
        <div id="l-cuerpo"></div>`;
      const cu = UI.$('#l-cuerpo', el);
      if (tab === 'tramite') cu.innerHTML = tr.length ? `<div class="col">${tr.map(L.fila).join('')}</div>` : '<div class="vacio">No hay proyectos en trámite.</div>';
      else if (tab === 'historial') cu.innerHTML = hist.length ? `<div class="col">${hist.map(L.fila).join('')}</div>` : '<div class="vacio">Todavía no hay historial.</div>';
      else if (tab === 'vigor') cu.innerHTML = C.Pantallas.impacto.vigorTab(E);
      else if (tab === 'pais') cu.innerHTML = C.Pantallas.impacto.paisTab(E);
      else cu.innerHTML = L.proponer(E);
      LN.enlazar(el);
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('leyes', { tab: b.dataset.tab }));
      UI.$('#l-auto', el).onchange = e => { E.parl.auto = e.target.checked; };
      const v = UI.$('#l-votar', el); if (v) v.onclick = () => L.modalVoto(E.parl.pendienteVoto[0]);
      UI.$$('[data-proy]', el).forEach(f => f.onclick = () => L.ver(f.dataset.proy));
      UI.$$('[data-tpl]', el).forEach(b => b.onclick = e => { e.stopPropagation(); L.disenarPropia(b.dataset.tpl); });
      UI.$$('[data-vig]', el).forEach(b => b.onclick = () => C.Pantallas.impacto.accionVigor(b.dataset.vig, b.dataset.op));
    },

    fila(p) {
      const E = C.E, pr = ACTIVAS.includes(p.etapa) ? C.Congreso.proyectar(E, p) : null;
      return `<div class="tarjeta clic" data-proy="${p.id}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start;gap:12px">
        <div style="min-width:0"><div class="fila" style="gap:6px"><span>${sec(p.s).icono}</span><b style="font-size:15px">${esc(p.t)}</b></div><div class="tenue" style="font-size:12.5px;margin-top:2px">${autorTxt(E, p)} · ${esc(sec(p.s).nombre)} · ${Comp.mayoriaTxt(p.may)}${p.region ? ' · ' + esc(Comp.ccaa(p.region)) : ''}</div></div>
        <span class="etq ${Comp.tonoEtapa(p.etapa)}">${Comp.etapa(p.etapa)}</span></div>
        <div style="margin-top:10px">${tramite(p)}</div>
        ${pr ? `<div class="fila" style="margin-top:8px;font-size:12px;gap:10px"><span class="tenue">Proyección</span><span class="bien">${pr.si} sí</span><span class="mal">${pr.no} no</span><span class="tenue">${pr.abs} abst.</span><span class="${pr.dist >= 0 ? 'bien' : 'mal'}" style="margin-left:auto">${pr.dist >= 0 ? 'Margen +' + pr.dist : 'Faltan ' + Math.abs(pr.dist)}</span></div>` : ''}</div>`;
    },

    proponer(E) {
      const J = E.jugador, vig = C.Impacto.vigentes(E);
      const lista = D().leyes.filter(l => !l.manual && !l.rdlSolo).map(l => ({ l, d: U.distIdeo(J, l) })).sort((a, b) => a.d - b.d);
      const abiertos = C.Congreso.abiertos(E).map(p => p.tpl);
      const puede = C.Acciones.puede('proponer_ley', {});
      const chips = l => { const im = D().impactos[l.id] || { ind: {} }; return Object.keys(im.ind || {}).sort((a, b) => Math.abs(im.ind[b]) - Math.abs(im.ind[a])).slice(0, 3).map(k => `<span class="etq ${im.ind[k] >= 0 ? 'verde' : 'rojo'}"${UI.tt(esc(D().indicadores[k].nombre))}>${D().indicadores[k].icono} ${U.signo(im.ind[k], 0)}</span>`).join(''); };
      return `<p class="tenue" style="margin-top:0">${puede === true ? 'Elige una iniciativa, <b>diséñala</b> (alcance, enfoque, financiación, calendario), mira su informe de impacto y regístrala (cuesta 2 puntos de agenda). Se adapta algo a tu ideología.' : '<span class="mal">' + esc(puede) + '</span>'}</p>
        <div class="sel-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${lista.map(({ l, d }) => `<div class="tarjeta"><div class="fila" style="gap:6px"><span>${sec(l.s).icono}</span><b>${esc(l.t)}</b></div><div class="tenue" style="font-size:12.5px;margin:6px 0">${esc(l.d)}</div>
          <div class="fila" style="gap:6px;margin-bottom:8px"><span class="etq ${d < 0.28 ? 'verde' : d < 0.5 ? 'amar' : 'rojo'}">Afinidad ${Math.round((1 - d) * 100)} %</span><span class="etq">Apoyo ${l.pop} %</span>${l.costo ? `<span class="etq ${l.costo > 0 ? 'rojo' : 'verde'}">${l.costo > 0 ? 'Cuesta' : 'Ingresa'} ${U.d1(Math.abs(l.costo))} % PIB</span>` : ''}${chips(l)}</div>
          <button class="btn chico prim" data-tpl="${l.id}" ${puede !== true || abiertos.includes(l.id) || vig.has(l.id) ? 'disabled' : ''}>${vig.has(l.id) ? '✔ Ya está en vigor' : '📐 Diseñar y registrar'}</button></div>`).join('')}</div>`;
    },

    /* El jugador (diputado) diseña y registra su propia proposición. */
    disenarPropia(tplId) {
      const E = C.E, tpl = C.Congreso.plantilla(tplId), J = E.jugador;
      C.Pantallas.impacto.disenar({ tplId, titulo: tpl.t, autor: { tipo: 'jugador', pid: J.partido }, ajuste: C.Personaje.ajusteLey(E, tpl), btn: '📜 Registrar la proposición (2 ◆)', onOk: dis => UI.accion('proponer_ley', { tpl: tplId, dis }, {}) });
    },

    /* Ficha de un proyecto: estado, proyección por partido y cabildeo. */
    ver(id) {
      const E = C.E, p = E.proyectos[id]; if (!p) return;
      const P = E.paises[E.jugador.pais];
      const activo = ACTIVAS.includes(p.etapa);
      const pr = activo ? C.Congreso.proyectar(E, p) : null;
      const filas = P.partidos.filter(k => (P.escanos[k] || 0) > 0).sort((a, b) => P.escanos[b] - P.escanos[a]).map(k => {
        const ps = C.Congreso.postura(E, k, p), top = ps.factores.slice().sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        const det = ps.factores.map(f => `<div class="tt-f"><span>${esc(f[0])}</span><b class="${f[1] >= 0 ? 'bien' : 'mal'}">${U.signo(f[1], 2)}</b></div>`).join('');
        return `<tr><td>${Comp.partido(E, k)}</td><td class="num">${P.escanos[k]}</td><td><span class="etq ${VTC[ps.voto]}"${UI.tt(det)}>${VT[ps.voto]}</span></td><td class="tenue" style="font-size:12px">${esc(top ? top[0] : '')}</td>
          <td style="text-align:right">${activo ? UI.botonAccion('cabildear_ley', { proy: p.id, pid: k, lado: 'si' }, '👍', 'chico') + ' ' + UI.botonAccion('cabildear_ley', { proy: p.id, pid: k, lado: 'no' }, '👎', 'chico') : ''}</td></tr>`;
      }).join('');
      const v = p.votacion ? E.votaciones.find(x => x.id === p.votacion) : null;
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${autorTxt(E, p)} · ${esc(sec(p.s).nombre)}</div><p style="margin:6px 0 10px;font-size:14px">${esc(p.d || '')}</p>
        <div class="fila" style="gap:6px;margin-bottom:10px"><span class="etq">Posición: ${Comp.ideoTxt(p)}, ${Comp.terTxt(p.ter || 0)}</span><span class="etq">Apoyo ciudadano ${p.pop} %</span>${p.costo ? `<span class="etq ${p.costo > 0 ? 'rojo' : 'verde'}">${p.costo > 0 ? 'Coste' : 'Ingreso'} ${U.d1(Math.abs(p.costo))} % PIB</span>` : ''}<span class="etq oro">${Comp.mayoriaTxt(p.may)}</span></div>
        <div class="fila" style="gap:6px;margin-bottom:10px">${C.Pantallas.impacto.disTxt(C.Congreso.plantilla(p.tpl) || {}, p.dis)}</div>
        ${tramite(p)}
        ${pr ? `<div style="margin:14px 0 4px">${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 18 })}<div class="tenue" style="font-size:12px;margin-top:4px">Proyección: ${pr.si} a favor, ${pr.no} en contra · se necesitan ${pr.need}. ${pr.dist >= 0 ? '<b class="bien">Margen de ' + pr.dist + '</b>' : '<b class="mal">Faltan ' + Math.abs(pr.dist) + '</b>'}</div></div>` : ''}
        ${activo && !p.rdl ? (() => { const sn = C.Congreso.votoSenado(E, p); return `<div class="nota" style="margin-top:10px">🏛 <b>Senado</b> (proyección): ${sn.si} sí · ${sn.no} no · ${sn.abs} abst. ${sn.veto ? '<b class="mal">· Veto probable (mayoría absoluta en contra)</b>' : sn.no > sn.si ? '· Podría introducir enmiendas' : '· Sin veto previsto'}</div>`; })() : ''}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Posición de los grupos</h3>
        <table class="tabla apila"><thead><tr><th>Grupo</th><th class="num">Esc.</th><th>Postura</th><th>Factor principal</th><th></th></tr></thead><tbody>${filas}</tbody></table>
        ${C.Pantallas.impacto.enmiendasHTML(E, p)}
        ${(() => { const tp = C.Congreso.plantilla(p.tpl); if (!tp || p.deroga) return ''; const inf = C.Impacto.informe(E, p.tpl, p.dis, p.ajuste); return `<details class="imp-det"><summary>📊 Informe de impacto de la ley</summary>${C.Pantallas.impacto.informeHTML(E, inf, null)}</details>`; })()}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Historial</h3>
        <div class="lista" style="font-size:12.5px">${p.hist.map(h => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('')}</div>`;
      UI.modal({ titulo: p.t, icono: sec(p.s).icono, cuerpo, clase: 'medio', pie: v ? `<button class="btn" id="v-ver">Ver votación</button>` : null }, null);
      const b = UI.$('#v-ver'); if (b) b.onclick = () => L.verVotacion(v.id);
    },

    /* Votación individual del jugador. */
    modalVoto(id) {
      const E = C.E, p = E.proyectos[id];
      if (!p) { E.parl.pendienteVoto = E.parl.pendienteVoto.filter(x => x !== id); return C.App.revisarPendientes(); }
      const J = E.jugador, P = E.paises[J.pais];
      const linea = C.Congreso.postura(E, J.partido, p).voto;
      const pr = C.Congreso.proyectar(E, p);
      const filas = P.partidos.filter(k => (P.escanos[k] || 0) > 0).sort((a, b) => P.escanos[b] - P.escanos[a]).map(k => { const ps = C.Congreso.postura(E, k, p); return `<tr><td>${Comp.partido(E, k)}</td><td class="num">${P.escanos[k]}</td><td><span class="etq ${VTC[ps.voto]}">${VT[ps.voto]}</span></td></tr>`; }).join('');
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${autorTxt(E, p)} · ${esc(sec(p.s).nombre)} · ${Comp.mayoriaTxt(p.may)}</div><p style="margin:6px 0 10px;font-size:14.5px">${esc(p.d || '')}</p>
        <div class="fila" style="gap:6px;margin-bottom:10px"><span class="etq">Posición: ${Comp.ideoTxt(p)}, ${Comp.terTxt(p.ter || 0)}</span><span class="etq">Apoyo ciudadano ${p.pop} %</span><span class="etq">Tu perfil: ${U.d1((1 - U.distIdeo(J, p)) * 100)} % de afinidad</span></div>
        ${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 18 })}
        <div class="tenue" style="font-size:12px;margin:4px 0 10px">Proyección: ${pr.si} sí · ${pr.no} no · mayoría necesaria ${pr.need}. ${pr.dist >= 0 ? '<b class="bien">Margen +' + pr.dist + '</b>' : '<b class="mal">Faltan ' + Math.abs(pr.dist) + '</b>'}</div>
        <table class="tabla"><tbody>${filas}</tbody></table>
        <div class="voto-btns">${['si', 'abs', 'no'].map(v => `<button class="btn ${v} ${v === linea ? 'linea' : ''}" data-v="${v}"><b>${VT[v]}</b><span class="tenue" style="font-size:11px">${v === linea ? 'Línea de tu partido' : ''}</span></button>`).join('')}</div>
        <div class="tenue" style="font-size:12px;margin-top:10px">Votar contra la línea del partido erosiona tu prestigio interno y la cohesión del grupo.</div>`;
      const decisivo = Math.abs(pr.dist) <= 3 && C.Dilemas;
      const LL = { direccion: ['📞', 'Llamada de la dirección', 'Te piden votar con el partido: cohesión si cedes.'], rival: ['🤝', 'Llamada del rival', 'Te ofrecen un favor futuro a cambio de tu voto.'], conciencia: ['🕯', 'Voto de conciencia', 'Decides por convicción, caiga quien caiga.'] };
      const banner = decisivo ? `<div class="nota" style="border-left:3px solid var(--no,#d9534f);margin-bottom:10px"><b>⚡ Voto decisivo</b> — la ley pende de un hilo (${pr.si} sí · ${pr.no} no; margen ${pr.dist >= 0 ? '+' : ''}${pr.dist}). Tu voto puede cambiarlo todo.<div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${Object.keys(LL).map(k => `<button class="btn chico" data-ll="${k}" title="${esc(LL[k][2])}">${LL[k][0]} ${LL[k][1]}</button>`).join('')}</div><div id="ll-res" class="tenue" style="font-size:12px;margin-top:6px"></div></div>` : '';
      const m = UI.modal({ titulo: 'Votación en el pleno · ' + p.t, icono: '🗳', cuerpo: banner + cuerpo, clase: 'medio', sinCerrar: true });
      m.cuerpo.addEventListener('click', e => {
        const ll = e.target.closest('[data-ll]');
        if (ll) {
          const k = ll.dataset.ll, pa = E.partidos[J.partido], rv = C.Nemesis && C.Nemesis.elegir(E).pid; let txt = '';
          if (k === 'direccion') { pa.cohesion = Math.min(99, pa.cohesion + 1.5); txt = 'La dirección agradece tu lealtad (+cohesión), pero te recordarán que te presionaron.'; }
          else if (k === 'rival') { if (rv && C.Mayorias) C.Mayorias.cambiarRel(E, rv, 5); C.Dilemas.asegurar(E).memoria.unshift({ id: U.id('mm'), t: E.fecha.t, tipo: 'favor', txt: `aceptaste una llamada de ${E.partidos[rv].sigla} antes de votar «${p.t}»`, pid: rv, cobrado: false }); txt = 'Aceptas el favor: un rival te deberá… y tú a él.'; }
          else { C.Personaje.cambiar(E, { prestigio: 1.1 }); txt = 'Tu conciencia te marca el camino: prestigio personal.'; }
          m.cuerpo.querySelectorAll('[data-ll]').forEach(b => b.disabled = true); const r = m.cuerpo.querySelector('#ll-res'); if (r) r.textContent = txt; return;
        }
        const b = e.target.closest('[data-v]'); if (!b) return;
        const ix = E.parl.pendienteVoto.indexOf(id); if (ix >= 0) E.parl.pendienteVoto.splice(ix, 1);
        const v = C.Congreso.resolver(E, p, b.dataset.v);
        m.cerrar(); C.App.refrescar(); L.verVotacion(v.id, true);
      });
    },

    verVotacion(vid, alCerrarSigue) {
      const E = C.E, v = E.votaciones.find(x => x.id === vid); if (!v) return;
      const p = E.proyectos[v.proy]; const P = E.paises[E.jugador.pais];
      const hemi = v.votos ? C.Hemiciclo.parlamento(E, { modo: 'voto', votos: v.votos, centroTxt: v.si + '–' + v.no, centroSub: v.ok ? 'APROBADO' : 'RECHAZADO', altoMax: 300 }) : '';
      const desert = v.detalle || [];
      const cuerpo = `<div style="text-align:center;margin-bottom:6px"><span class="sello ${v.ok ? 'ok' : 'ko'}">${v.ok ? 'Aprobado' : 'Rechazado'}</span></div>
        ${hemi}<div class="leyenda" style="justify-content:center"><span><i style="background:var(--si)"></i>A favor ${v.si}</span><span><i style="background:var(--no)"></i>En contra ${v.no}</span><span><i style="background:var(--abs)"></i>Abstención ${v.abs}</span><span><i style="background:var(--aus)"></i>Ausentes ${v.aus}</span></div>
        ${v.miVoto ? `<div class="nota" style="margin-top:10px">Tu voto: <b>${VT[v.miVoto]}</b>${v.miVoto !== v.linea ? ` <span class="mal">(contra la línea de tu partido: ${VT[v.linea]})</span>` : ' <span class="bien">(con tu partido)</span>'}</div>` : ''}
        <h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">¿Qué pasó? · ${v.desertores} diputados rompieron la disciplina</h3>
        <table class="tabla"><thead><tr><th>Grupo</th><th>Línea</th></tr></thead><tbody>${P.partidos.filter(k => v.posturas[k]).sort((a, b) => P.escanos[b] - P.escanos[a]).map(k => `<tr><td>${Comp.partido(E, k)} <span class="tenue">· ${P.escanos[k]}</span></td><td><span class="etq ${VTC[v.posturas[k]]}">${VT[v.posturas[k]]}</span></td></tr>`).join('')}</tbody></table>
        ${desert.length ? `<div class="lista" style="margin-top:8px;font-size:12.5px">${desert.map(d => { const m = E.politicos[d.pol]; return m ? `<div class="it"><span data-pol="${m.id}">${Comp.avatar(E, m, 26)}</span><div class="cuerpo"><b>${esc(m.n)} <span class="tenue">· ${esc(E.partidos[m.p] ? E.partidos[m.p].sigla : '')}</span></b><span>Votó ${VT[d.voto].toLowerCase()} contra su grupo (${VT[d.linea].toLowerCase()}). ${esc(d.razon)}.</span></div></div>` : ''; }).join('')}</div>` : ''}`;
      UI.modal({ titulo: p ? p.t : 'Votación', icono: v.ok ? '✅' : '❌', cuerpo, clase: 'medio', alCerrar: () => { if (alCerrarSigue) C.App.revisarPendientes(); } });
    }
  };
})(window.ESP);

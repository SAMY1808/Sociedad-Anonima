/* Aplicación: armazón visual, navegación, control del tiempo y modales de decisión (eventos, votos, Consejo). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  /* [id, icono, nombre, nombre corto (barra inferior del móvil), en la barra inferior] */
  const NAV = [
    ['dashboard', '🧭', 'Centro de mando', 'Inicio', 1], ['agenda', '🎯', 'Agenda', 'Agenda', 1], ['guia', '🧭', 'Guía y asesor', 'Guía'],
    ['#', 'Parlamento y gobierno'], ['cortes', '🏛', 'Cortes Generales', 'Cortes', 1], ['leyes', '📜', 'Leyes', 'Leyes'], ['consejo', '🦅', 'Consejo de Ministros', 'Consejo', 1], ['gabinete', '🧑‍💼', 'Gabinete', 'Gabinete'], ['jefe', '🧑‍💼', 'Jefe de gabinete', 'Jefe'], ['coaliciones', '📝', 'Acuerdos de gobierno', 'Pactos'], ['mayorias', '🧮', 'Mayorías y rivales', 'Mayorías'], ['oposicion', '🎭', 'Oposición y pactos', 'Oposición'],
    ['#', 'Territorio'], ['territorio', '🗺', 'Territorio', 'Territorio', 1], ['autogob', '🏛', 'Autogobierno', 'Autogob.'], ['parlaut', '🗺', 'Parlamento autonómico', 'Parl. aut.'], ['ayuntamiento', '🏘', 'Ayuntamiento', 'Ayto.'], ['local2', '🏘', 'Poder local', 'Local'], ['lenguas', '🗣', 'Lenguas y símbolos', 'Lenguas'],
    ['#', 'Poder e instituciones'], ['justicia', '⚖️', 'Justicia', 'Justicia'], ['corrupcion', '🕵️', 'Corrupción y control', 'Control'], ['organismos', '🏢', 'Organismos y altos cargos', 'Organismos'], ['corona', '👑', 'La Corona', 'Corona'], ['referendos', '🗳️', 'Referendos y consultas', 'Consultas'], ['medios', '📰', 'Medios y opinión', 'Medios'],
    ['#', 'País y mundo'], ['estructural', '🗺', 'Problemas de país', 'País'], ['social', '🤝', 'Diálogo social', 'Social'], ['crisis', '🚨', 'Crisis', 'Crisis'], ['europa', '🇪🇺', 'Europa', 'Europa'], ['exterior', '🌍', 'Mundo', 'Mundo'], ['elecciones', '🗳', 'Elecciones', 'Elecciones'],
    ['#', 'Partido y personas'], ['sede', '🏢', 'Sede del partido', 'Sede'], ['partido', '🎗', 'Mi partido', 'Partido'], ['personas', '🧑‍💼', 'Políticos', 'Políticos'],
    ['#', 'Mi carrera'], ['dilemas', '⏳', 'Dilemas', 'Dilemas'], ['personaje', '👤', 'Mi carrera', 'Carrera'], ['legado', '🏆', 'Legado', 'Legado'], ['ajustes', '⚙️', 'Ajustes y compartir', 'Ajustes'], null, ['partidas', '💾', 'Partidas', 'Partidas']
  ];

  const App = {
    iniciar() {
      UI.initTooltip(); UI.initAcciones(); App.observar();
      document.addEventListener('keydown', e => {
        if (!C.E || !C.E.jugador || e.target.matches('input,textarea,select') || UI.pila.length) return;
        if (e.key === 'n' || e.key === 'N') App.avanzar(1);
      });
      C.Bus.on('votacion', d => {
        const E = C.E; if (!E || !E.jugador) return;
        const p = E.proyectos[d.proyecto]; if (!p || p.autor.tipo !== 'jugador') return;
        UI.toast(`Tu proyecto «${esc(p.t)}» ha sido ${p.etapa === 'sancionada' ? '<b>aprobado</b> 🎉' : '<b>rechazado</b>'}.`, p.etapa === 'sancionada' ? 'bien' : 'mal');
      });
      C.Pantallas.inicio.render(document.getElementById('app'));
    },

    /* Arranca la vista de juego con el estado cargado en C.E */
    comenzar() {
      UI.cerrarModales();
      const E = C.E; E.ui = E.ui || {};
      document.getElementById('app').innerHTML = `<div class="shell">
        <header class="barra" id="barra"></header><nav class="nav" id="nav"></nav><main class="vista" id="vista"></main><div class="ticker" id="ticker"></div></div>`;
      App.ir(E.ui.pantalla || 'dashboard', E.ui.params);
      App.revisarPendientes();
    },

    /* Reajusta tablas y pestañas cada vez que cambia el DOM (pantallas y modales). */
    observar() {
      if (App._obs) return;
      let pendiente = false;
      const reaj = () => { pendiente = false; App.ajustarMovil(document.body); };
      App._obs = new MutationObserver(() => { if (!pendiente) { pendiente = true; requestAnimationFrame(reaj); } });
      App._obs.observe(document.body, { childList: true, subtree: true });
      addEventListener('resize', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(reaj); } });
    },

    ir(pantalla, params) {
      const E = C.E;
      if (!C.Pantallas[pantalla]) pantalla = 'dashboard';
      const igual = E.ui.pantalla === pantalla;
      E.ui.pantalla = pantalla; E.ui.params = params || null; (E.ui.vis = E.ui.vis || {})[pantalla] = 1;
      App.refrescar(!igual);
    },

    refrescar(nuevo) {
      const E = C.E; if (!E || !document.getElementById('vista')) return;
      App.barra(); App.nav(); App.ticker();
      const v = document.getElementById('vista'), scroll = v.scrollTop;
      try { C.Pantallas[E.ui.pantalla].render(v, E.ui.params || {}); }
      catch (e) { console.error(e); v.innerHTML = `<div class="tarjeta"><h3>Error de interfaz</h3><pre class="mono" style="white-space:pre-wrap">${esc(e.stack || e.message)}</pre></div>`; }
      v.scrollTop = nuevo ? 0 : scroll;
      // Los ajustes posteriores (tablas, pestañas) pueden cambiar la altura: se recoloca el desplazamiento para que la página no salte
      if (!nuevo) requestAnimationFrame(() => requestAnimationFrame(() => { if (Math.abs(v.scrollTop - scroll) > 2) v.scrollTop = scroll; }));
    },

    barra() {
      const E = C.E, J = E.jugador, cs = E.esp.cortes;
      const enSesion = !C.Congreso.enRecesion(E) && cs.estado === 'activa';
      const pips = Array.from({ length: J.agenda.max }, (_, i) => `<span class="pip ${i < J.agenda.puntos ? 'lleno' : ''}"></span>`).join('');
      const estado = { activa: enSesion ? '<span class="bien">● Cortes en sesiones</span>' : '<span class="tenue">○ Receso parlamentario</span>', disueltas: '<span class="alerta">● Campaña electoral</span>', constitucion: '<span class="alerta">● Constitución de las Cortes</span>', consultas: '<span class="alerta">● Consultas del Rey</span>', investidura: '<span class="alerta">● Investidura</span>' }[cs.estado];
      const sig = cs.estado === 'disueltas' ? 'Generales el ' + U.fmtT(cs.proxT, true) : 'Generales (como tarde) ' + Comp().semanasA(E, cs.finMax);
      document.getElementById('barra').innerHTML = `
        <div class="logo">CURUL <small>España</small></div>
        <div class="fecha"><b>${U.fmtFecha(U.hoy())}</b><span>${estado} · ${sig}</span></div>
        <div class="espacio"></div>
        ${E.meta.vistaPartido && J.pais === 'ES' ? `<div class="chip-cargo" data-ir="sede" style="cursor:pointer"><span class="bandera">🏢</span><div class="txt"><b>${esc(E.partidos[J.partido].nombre)}</b><span>Dirección de ${esc(J.nombre)} · ${esc(E.partidos[J.partido].sigla)}</span></div></div>` : `<div class="chip-cargo" data-ir="personaje" style="cursor:pointer"><span class="bandera">${['presauto', 'dipauto', 'consejero'].includes(J.cargo) && J.region && C.Banderas.tiene(J.region) ? C.Banderas.svg(J.region, { h: 24 }) : '🇪🇸'}</span><div class="txt"><b>${esc(J.nombre)}</b><span>${esc(C.Personaje.cargoTxt(E))} · ${esc(E.partidos[J.partido].sigla)}</span></div></div>`}
        <div class="pips"${UI.tt('<b>' + (E.meta.vistaPartido ? 'Puntos de dirección' : 'Puntos de agenda') + '</b><br>Cada acción importante consume puntos. Se renuevan cada semana.')}>${pips}<span class="pips-n" data-ir="agenda">◆ ${J.agenda.puntos}/${J.agenda.max}</span></div>
        <div class="tiempo">
          <button class="btn prim" id="b-sem"${UI.tt('Avanzar una semana (tecla N)')}>▶ <span>Semana</span></button>
          <button class="btn" id="b-mes"${UI.tt('Avanzar cuatro semanas (se detiene ante decisiones y votaciones)')}>▶▶ <span>Mes</span></button>
          <button class="btn" id="b-tri"${UI.tt('Avanzar trece semanas')}>⏩ <span class="largo">Trimestre</span><span class="corto">Trim.</span></button>
          <button class="btn fant" id="b-ayuda"${UI.tt('Cómo se juega')}>?</button>
        </div>`;
      document.getElementById('b-sem').onclick = () => App.avanzar(1);
      document.getElementById('b-mes').onclick = () => App.avanzar(4);
      document.getElementById('b-tri').onclick = () => App.avanzar(13);
      document.getElementById('b-ayuda').onclick = () => App.ayuda();
      UI.$$('[data-ir]', document.getElementById('barra')).forEach(b => b.onclick = () => App.ir(b.dataset.ir));
    },

    nav() {
      const E = C.E;
      const mios = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && C.Congreso.ABIERTAS.includes(p.etapa)).length;
      const badges = App.badges(E, mios);
      const items = App.navItems(E);
      const enBarra = items.some(n => n && n[4] && n[0] === E.ui.pantalla);
      const masN = items.reduce((a, n) => a + (n && !n[4] ? (+badges[n[0]] || 0) : 0), 0);
      const col = E.ui.navCol = E.ui.navCol || {}; let oculto = false, hdr = null, cnt = {}; items.forEach(n => { if (n && n[0] === '#') hdr = n[1]; else if (n && hdr) cnt[hdr] = (cnt[hdr] || 0) + (+badges[n[0]] || 0); });
      document.getElementById('nav').innerHTML = items.map(n => { if (!n) return '<div class="sep"></div>'; if (n[0] === '#') { oculto = !!col[n[1]]; return `<div class="nav-h" data-h="${n[1]}"><span>${oculto ? '▸' : '▾'} ${n[1]}</span>${oculto && cnt[n[1]] ? `<span class="badge">${cnt[n[1]]}</span>` : ''}</div>`; }
        return `<button data-p="${n[0]}" class="${E.ui.pantalla === n[0] ? 'activo' : ''}${n[4] ? ' princ' : ''}${oculto && E.ui.pantalla !== n[0] ? ' plegado' : ''}"><span class="ic">${n[1]}</span><span class="largo">${n[2]}</span><span class="corto">${n[3]}</span>${badges[n[0]] ? `<span class="badge">${badges[n[0]]}</span>` : ''}</button>`; }).join('')
        + `<button class="mas ${enBarra ? '' : 'activo'}" id="nav-mas" aria-label="Más secciones"><span class="ic">☰</span><span class="corto">Más</span>${masN ? `<span class="badge">${masN}</span>` : ''}</button>`;
      UI.$$('#nav button[data-p]').forEach(b => b.onclick = () => App.ir(b.dataset.p));
      UI.$$('#nav .nav-h').forEach(h => h.onclick = () => { E.ui.navCol[h.dataset.h] = !E.ui.navCol[h.dataset.h]; App.nav(); });
      document.getElementById('nav-mas').onclick = () => App.mas();
    },

    /* Elementos del menú según tu cargo: el foco oculta lo que pertenece a otros niveles y deja una barra inferior propia. */
    navItems(E) {
      const J = E.jugador, F = C.Foco, foco = !!(F && F.activo(E)), am = foco ? F.ambito(E) : null;
      const aut = foco ? am === 'aut' : J.nivel === 'autonomico' && J.region && E.esp.ccaa[J.region].gob, local = foco ? am === 'local' : J.nivel === 'local';
      const vp = E.meta.vistaPartido && J.pais === 'ES';
      const pr = F ? F.principales(E) : [];
      let items = NAV.filter(n => !(vp && n && n[0] === 'personaje')).filter(n => !n || n[0] === '#' || n[0] !== 'ayuntamiento' || (J.muni && E.esp.muni.m[J.muni]));
      if (foco) items = items.filter(n => !n || n[0] === '#' || F.pantalla(E, n[0]));
      // fuera las cabeceras que se quedan sin secciones
      items = items.filter((n, i, a) => !(n && n[0] === '#') || (a[i + 1] && a[i + 1][0] !== '#'));
      return items.map(n => n && n[0] !== '#' && foco ? Object.assign(n.slice(), { 4: pr.includes(n[0]) ? 1 : 0 }) : n)
        .map(n => vp && n && n[0] === 'agenda' ? ['agenda', '🎯', 'Puntos de dirección', 'Agenda', n[4]] : n)
        .map(n => n && n[0] === 'consejo' && aut ? ['consejo', '🏛', 'Consejo de Gobierno', 'Gobierno', n[4]] : n && n[0] === 'ayuntamiento' && local ? ['ayuntamiento', '🏘', 'Consejo municipal', 'Ayto.', n[4]] : n);
    },

    badges(E, mios) {
      return { dilemas: (C.Dilemas && E.jugador.pais === 'ES' && C.Dilemas.asegurar(E).act.length) || '', leyes: E.parl.pendienteVoto.length || (mios || ''), europa: E.ue.pendiente.length || '', agenda: E.jugador.agenda.puntos || '', elecciones: C.Campana.activa(E) ? '📣' : '', consejo: C.Consejo.pmEsJ(E) ? (E.esp.consejo.agenda.length || '') : '', jefe: E.esp.jefe && E.esp.jefe.prop.length || '', crisis: C.Crisis ? (C.Crisis.asegurar(E).activas.filter(c => c.fase !== 'cerrada' && (C.Crisis.jugadorEstado(E) ? c.usadas.length < 2 : C.Crisis.jugadorRegion(E, c) && !c.usadasReg.length)).length || '') : '', medios: C.Medios ? (C.Medios.bulosJ(E).length || '') : '', oposicion: C.Oposicion && E.jugador.pais === 'ES' ? (C.Oposicion.asegurar(E).pe.ofertas.length || '') : '' };
    },

    /* Hoja «Más» del móvil: el resto de secciones del juego. */
    mas() {
      const E = C.E, mios = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && C.Congreso.ABIERTAS.includes(p.etapa)).length;
      const badges = App.badges(E, mios);
      const items = App.navItems(E).filter(n => n && !n[4]);
      const cuerpo = `<div class="mas-grid">${items.map(n => n[0] === '#' ? `<div class="mas-h">${n[1]}</div>` : `<button class="mas-it ${E.ui.pantalla === n[0] ? 'activo' : ''}" data-p="${n[0]}"><span class="ic">${n[1]}</span><span>${n[2]}</span>${badges[n[0]] ? `<span class="badge">${badges[n[0]]}</span>` : ''}</button>`).join('')}<button class="mas-it" data-ayuda="1"><span class="ic">❓</span><span>Cómo se juega</span></button></div>`;
      const m = UI.modal({ titulo: 'Más secciones', icono: '☰', cuerpo, clase: 'hoja' });
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        m.cerrar();
        if (b.dataset.ayuda) App.ayuda(); else App.ir(b.dataset.p);
      });
    },

    /* Ajustes de interfaz tras pintar: tablas con desplazamiento horizontal y pistas de scroll en pestañas. */
    ajustarMovil(raiz) {
      UI.$$('table.tabla.apila:not([data-ap])', raiz).forEach(t => {
        const th = Array.from(t.querySelectorAll('thead th')).map(x => x.textContent.trim());
        t.querySelectorAll('tbody tr').forEach(tr => Array.from(tr.children).forEach((td, i) => { if (i && th[i]) td.dataset.l = th[i]; }));
        t.dataset.ap = '1';
      });
      UI.$$('table.tabla', raiz).forEach(t => {
        let w = t.parentElement;
        if (!w.classList.contains('tscroll')) { w = document.createElement('div'); w.className = 'tscroll'; t.parentNode.insertBefore(w, t); w.appendChild(t); }
        w.classList.toggle('desborda', w.scrollWidth > w.clientWidth + 2);
      });
      UI.$$('.tabs,.seg,.tscroll', raiz).forEach(el => {
        if (el.dataset.ps) { App.pista(el); return; }
        el.dataset.ps = '1';
        el.addEventListener('scroll', () => App.pista(el), { passive: true });
        if (!el.classList.contains('tscroll')) { const a = el.querySelector('.activo'); if (a) el.scrollLeft = Math.max(0, a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2); }
        App.pista(el);
      });
    },
    pista(el) {
      el.classList.toggle('pista-izq', el.scrollLeft > 4);
      el.classList.toggle('pista-der', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    },

    ticker() {
      const E = C.E;
      const ns = E.noticias.filter(n => !C.Foco || C.Foco.noticia(E, n)).slice(0, 14);
      document.getElementById('ticker').innerHTML = `<span class="rotulo">ÚLTIMA HORA</span><div style="overflow:hidden;flex:1"><div class="cinta">${ns.map(n => `<span><b>${n.reg && C.Banderas.tiene(n.reg) ? C.Banderas.svg(n.reg, { h: 13 }) : n.pais === 'ES' ? '🇪🇸' : n.pais ? (D().paises[n.pais] || { bandera: '🌍' }).bandera : '🌍'}</b>${esc(n.texto)}</span>`).join('') || '<span>Sin noticias</span>'}</div></div>`;
    },

    /* ── Tiempo ── */
    avanzar(n) {
      const E = C.E;
      if (C.Tiempo.bloqueo()) { App.revisarPendientes(); return; }
      for (let i = 0; i < n; i++) { if (!C.Tiempo.avanzar()) break; if (C.Tiempo.bloqueo()) break; }
      App.refrescar();
      App.revisarPendientes();
    },

    revisarPendientes() {
      const E = C.E; if (!E) return;
      if (UI.pila.length) return;
      if (C.Disolucion && C.Disolucion.pendiente(E) && C.Pantallas.declaracion) { C.Pantallas.declaracion.modal(E); return; }
      if (E.esp.pendienteGabinete) { C.Pantallas.gabinete.formacion(E.esp.pendienteGabinete); return; }
      if (E.esp.gab && E.esp.gab.escandalo) { C.Pantallas.gabinete.escandalo(E.esp.gab.escandalo); return; }
      if (E.esp.pendienteSocio) { C.Pantallas.elecciones.socio(); return; }
      if (E.esp.pendienteDebate) { C.Pantallas.campana.modalDebate(); return; }
      if (E.esp.pendienteVotoAut) { C.Pantallas.leyesNiv.modalVotoAut(); return; }
      if (E.esp.pendienteConvAut) { C.Pantallas.parlaut.modalConv(); return; }
      if (E.esp.pendienteInvAut) { C.Pantallas.invest.modal(); return; }
      if (E.esp.pendienteInvestidura) { C.Pantallas.elecciones.investidura(); return; }
      if (E.elecciones.nochePendiente) { const n = E.elecciones.nochePendiente; E.elecciones.nochePendiente = null; if (n.tipo === 'locales') C.Pantallas.elecciones.nocheLocales(n); else C.Pantallas.elecciones.noche(n); return; }
      if (C.Consejo.pendientesJugador(E).length) { C.Pantallas.consejo.modalUrgente(C.Consejo.pendientesJugador(E)[0]); return; }
      if (E.elecciones.pePendiente) { const n = E.elecciones.pePendiente; E.elecciones.pePendiente = null; C.Pantallas.europa.nochePE(n); return; }
      if (E.elecciones.presPendiente) { const n = E.elecciones.presPendiente; E.elecciones.presPendiente = null; C.Pantallas.elecciones.nochePres(n); return; }
      if (E.esp.pendienteSesion && C.Pantallas.sesion) { C.Pantallas.sesion.modal(); return; }
      if (E.esp.pendienteCongreso && C.Pantallas.congresopartido) { C.Pantallas.congresopartido.modal(); return; }
      if (E.esp.pendienteCrisisV && C.Pantallas.crisis2) { C.Pantallas.crisis2.modal(E.esp.pendienteCrisisV); return; }
      if (E.eventos.pendientes.length) { App.modalEvento(E.eventos.pendientes[0]); return; }
      if (E.parl.pendienteVoto.length) { C.Pantallas.leyes.modalVoto(E.parl.pendienteVoto[0]); return; }
      if (E.ue.pendiente.length) { C.Pantallas.europa.modalVoto(0); return; }
    },

    ayuda() {
      const cuerpo = `<div class="col" style="gap:12px;font-size:13.5px;color:var(--texto2);line-height:1.55">
        <div><b style="color:var(--texto)">🎯 Objetivo.</b> Construye una carrera política en España: de concejal/a o diputado/a autonómico/a a presidente/a del Gobierno, pasando por las comunidades, las Cortes, el Consejo de Ministros… o Bruselas. No hay un final único.</div>
        <div><b style="color:var(--texto)">◆ Agenda.</b> Cada semana tienes 5–7 puntos de agenda para gastar en la pestaña <i>Agenda</i>. Repetir la misma acción rinde cada vez menos.</div>
        <div><b style="color:var(--texto)">🏛 Cortes.</b> Congreso (350 diputados por circunscripción, D'Hondt con umbral del 3 %) y Senado (veto por mayoría absoluta). Las leyes orgánicas necesitan 176 votos y las reformas constitucionales tres quintos.</div>
        <div><b style="color:var(--texto)">🦅 Consejo de Ministros.</b> Aprueba proyectos de ley, decretos-ley (el Congreso debe convalidarlos en 30 días), reales decretos, Presupuestos y respuestas a las comunidades. Si eres presidente/a, decides tú; si no, influyes como ministro/a o socio.</div>
        <div><b style="color:var(--texto)">🗺 Territorio.</b> 17 comunidades y 2 ciudades autónomas con su parlamento, su gobierno y su relación con Moncloa. Negocia financiación, traspasos y estatutos; gestiona el independentismo, el 155 y el Tribunal Constitucional. 67 grandes ayuntamientos con elecciones municipales.</div>
        <div><b style="color:var(--texto)">🗳 Elecciones y gobiernos.</b> Tras las generales se constituyen las Cortes, el Rey consulta y se vota la investidura: 176 en primera votación o mayoría simple en la segunda; sin presidente en dos meses, nuevas elecciones. Puede haber mociones de censura, cuestiones de confianza y adelantos electorales.</div>
        <div><b style="color:var(--texto)">📊 Leyes e impacto.</b> Cada ley se <i>diseña</i> (alcance, enfoque, financiación, calendario) y trae un <i>informe de impacto</i>: cómo moverá 14 indicadores del país, a 11 colectivos sociales, la economía y el presupuesto, con riesgos de efectos no deseados. Las leyes entran en vigor poco a poco, se evalúan al año y se pueden reformar o derogar (pestañas <i>En vigor</i> e <i>Impacto en el país</i> en Leyes). Los grupos piden enmiendas a cambio de su voto; los colectivos descontentos castigan al Gobierno.</div>
        <div><b style="color:var(--texto)">🪜 Ascender.</b> Desde el ayuntamiento, el Congreso o la oposición puedes lanzar tu <i>candidatura autonómica</i> (en la Agenda): elige comunidad, pide un puesto en la lista o disputa la cabeza de lista para presidir la comunidad. También puedes pedir un puesto en la lista a las Cortes.</div>
        <div><b style="color:var(--texto)">🇪🇺 Europa.</b> Expedientes de la Comisión, Consejo y Parlamento Europeo; las directivas llegan al Congreso para su transposición.</div>
        <div><b style="color:var(--texto)">💾 Guardado.</b> Se autoguarda cada cuatro semanas; usa <i>Partidas</i> para exportar un archivo. Atajo: <b>N</b> avanza una semana.</div></div>`;
      UI.modal({ titulo: 'Cómo se juega', icono: '❓', cuerpo, clase: 'medio' });
    },

    modalEvento(ev) {
      const E = C.E, def = ev.key ? C.Eventos.def(ev.key) : null;
      const ops = ev.opciones;
      const cuerpo = `${ev.escena && C.Escenas ? C.Escenas.html(E, ev.escena, { compacta: true }) : ''}<div class="evento-cab"><div class="evento-icono">${ev.icono || '📰'}</div><div><p style="font-size:15px;margin:.2em 0 0">${esc(ev.texto)}</p></div></div>
        <h3 style="margin:14px 0 8px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">${ops.length > 1 ? '¿Cómo respondes?' : ''}</h3>
        <div class="col">${ops.map((o, i) => `<button class="btn opcion" data-op="${i}" style="justify-content:flex-start;text-align:left;white-space:normal;padding:12px 14px">${esc(o)}</button>`).join('')}</div>`;
      const m = UI.modal({ titulo: ev.titulo, cuerpo, sinCerrar: true, clase: 'evento' });
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('[data-op]'); if (!b) return;
        const idx = E.eventos.pendientes.indexOf(ev);
        const txt = C.Eventos.resolver(E, idx, +b.dataset.op);
        m.cerrar();
        if (txt) UI.toast(esc(txt), 'bien');
        App.refrescar();
        App.revisarPendientes();
      });
    }
  };
  const Comp = () => C.Comp;
  C.App = App;
  document.addEventListener('DOMContentLoaded', App.iniciar);
})(window.ESP);

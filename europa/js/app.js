/* Aplicación: armazón visual, navegación, control del tiempo y modales de decisión (eventos, votos, Consejo). */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  const NAV = [
    ['dashboard', '🧭', 'Centro de mando'], ['agenda', '🎯', 'Agenda'], ['parlamento', '🏛', 'Parlamento'], ['leyes', '📜', 'Leyes'],
    ['gobierno', '🦅', 'Gobierno'], ['partido', '🎗', 'Mi partido'], ['europa', '🇪🇺', 'Europa'], ['elecciones', '🗳', 'Elecciones'],
    ['personaje', '👤', 'Mi carrera'], null, ['partidas', '💾', 'Partidas']
  ];

  const App = {
    iniciar() {
      UI.initTooltip(); UI.initAcciones();
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

    ir(pantalla, params) {
      const E = C.E;
      if (!C.Pantallas[pantalla]) pantalla = 'dashboard';
      E.ui.pantalla = pantalla; E.ui.params = params || null;
      App.refrescar(true);
    },

    refrescar(nuevo) {
      const E = C.E; if (!E || !document.getElementById('vista')) return;
      App.barra(); App.nav(); App.ticker();
      const v = document.getElementById('vista'), scroll = v.scrollTop;
      try { C.Pantallas[E.ui.pantalla].render(v, E.ui.params || {}); }
      catch (e) { console.error(e); v.innerHTML = `<div class="tarjeta"><h3>Error de interfaz</h3><pre class="mono" style="white-space:pre-wrap">${esc(e.stack || e.message)}</pre></div>`; }
      v.scrollTop = nuevo ? 0 : scroll;
    },

    barra() {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais];
      const enSesion = !C.Parlamento.enRecesion(E);
      const pips = Array.from({ length: J.agenda.max }, (_, i) => `<span class="pip ${i < J.agenda.puntos ? 'lleno' : ''}"></span>`).join('');
      const sem = C.Elecciones.semanasHasta(E, J.pais);
      document.getElementById('barra').innerHTML = `
        <div class="logo">CURUL <small>Europa</small></div>
        <div class="fecha"><b>${U.fmtFecha(U.hoy())}</b><span>${enSesion ? '<span class="bien">● Parlamento en sesiones</span>' : '<span class="tenue">○ Receso</span>'} · ${P.flags.leyMarcial ? 'Ley marcial' : 'Elecciones en ' + Comp().semanasA(E, P.elec.proxT)}</span></div>
        <div class="espacio"></div>
        <div class="chip-cargo" data-ir="personaje" style="cursor:pointer"><span style="font-size:26px;line-height:1;padding-left:4px">${d.bandera}</span><div class="txt"><b>${esc(J.nombre)}</b><span>${esc(C.Personaje.cargoTxt(E))} · ${esc(E.partidos[J.partido].sigla)}</span></div></div>
        <div class="pips"${UI.tt('<b>Puntos de agenda</b><br>Cada acción importante consume puntos. Se renuevan cada semana.')}>${pips}</div>
        <div class="tiempo">
          <button class="btn prim" id="b-sem"${UI.tt('Avanzar una semana (tecla N)')}>▶ Semana</button>
          <button class="btn" id="b-mes"${UI.tt('Avanzar cuatro semanas (se detiene ante decisiones y votaciones)')}>▶▶ Mes</button>
          <button class="btn" id="b-tri"${UI.tt('Avanzar trece semanas')}>⏩ Trimestre</button>
        </div>`;
      document.getElementById('b-sem').onclick = () => App.avanzar(1);
      document.getElementById('b-mes').onclick = () => App.avanzar(4);
      document.getElementById('b-tri').onclick = () => App.avanzar(13);
      UI.$$('[data-ir]', document.getElementById('barra')).forEach(b => b.onclick = () => App.ir(b.dataset.ir));
    },

    nav() {
      const E = C.E;
      const mios = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && ['registro', 'comision', 'pleno', 'pleno_pend'].includes(p.etapa)).length;
      const badges = { leyes: E.parl.pendienteVoto.length || (mios || ''), europa: E.ue.pendiente.length || '', agenda: E.jugador.agenda.puntos || '' };
      document.getElementById('nav').innerHTML = NAV.map(n => n ? `<button data-p="${n[0]}" class="${E.ui.pantalla === n[0] ? 'activo' : ''}"><span class="ic">${n[1]}</span><span>${n[2]}</span>${badges[n[0]] ? `<span class="badge">${badges[n[0]]}</span>` : ''}</button>` : '<div class="sep"></div>').join('');
      UI.$$('#nav button').forEach(b => b.onclick = () => App.ir(b.dataset.p));
    },

    ticker() {
      const E = C.E;
      const ns = E.noticias.slice(0, 14);
      document.getElementById('ticker').innerHTML = `<span class="rotulo">ÚLTIMA HORA</span><div style="overflow:hidden;flex:1"><div class="cinta">${ns.map(n => `<span><b>${n.pais ? D().paises[n.pais].bandera : '🌍'}</b>${esc(n.texto)}</span>`).join('') || '<span>Sin noticias</span>'}</div></div>`;
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
      if (E.elecciones.nochePendiente) { const n = E.elecciones.nochePendiente; E.elecciones.nochePendiente = null; C.Pantallas.elecciones.noche(n); return; }
      if (E.eventos.pendientes.length) { App.modalEvento(E.eventos.pendientes[0]); return; }
      if (E.parl.pendienteVoto.length) { C.Pantallas.leyes.modalVoto(E.parl.pendienteVoto[0]); return; }
      if (E.ue.pendiente.length) { C.Pantallas.europa.modalVoto(0); return; }
    },

    modalEvento(ev) {
      const E = C.E, def = ev.key ? C.Eventos.def(ev.key) : null;
      const ops = ev.opciones;
      const cuerpo = `<div class="evento-cab"><div class="evento-icono">${ev.icono || '📰'}</div><div><p style="font-size:15px;margin:.2em 0 0">${esc(ev.texto)}</p></div></div>
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
})(window.EUROPA);

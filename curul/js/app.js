/* Aplicación: armazón visual, navegación entre pantallas, control del tiempo y avisos de turno. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const NAV = [
    ['dashboard', '🧭', 'Centro de mando'], ['mapa', '🗺', 'Mapa'], ['congreso', '🏛', 'Congreso'], ['proyectos', '📜', 'Proyectos'],
    ['elecciones', '🗳', 'Elecciones'], ['partidos', '🎗', 'Partidos'], ['gobierno', '🦅', 'Gobierno y oposición'],
    ['medios', '📰', 'Medios'], ['personaje', '👤', 'Mi carrera'], null, ['partidas', '💾', 'Partidas']
  ];

  const App = {
    iniciar() {
      UI.initTooltip(); UI.initAcciones();
      document.addEventListener('keydown', e => {
        if (!C.E || !C.E.jugador || e.target.matches('input,textarea,select') || UI.pila.length) return;
        if (e.key === 'n' || e.key === 'N') App.avanzar(1);
      });
      C.Pantallas.inicio.render(document.getElementById('app'));
    },
    /* Arranca la vista de juego con el estado cargado en C.E */
    comenzar() {
      UI.cerrarModales();
      const E = C.E;
      E.ui = E.ui || {};
      document.getElementById('app').innerHTML = `<div class="shell">
        <header class="barra" id="barra"></header>
        <nav class="nav" id="nav"></nav>
        <main class="vista" id="vista"></main>
        <div class="ticker" id="ticker"></div></div>`;
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
      v.onclick = null; v.onchange = null;
      try { C.Pantallas[E.ui.pantalla].render(v, E.ui.params || {}); }
      catch (e) { console.error(e); v.innerHTML = `<div class="tarjeta"><h3>Error de interfaz</h3><pre class="mono" style="white-space:pre-wrap">${esc(e.stack || e.message)}</pre></div>`; }
      if (!nuevo) v.scrollTop = scroll; else v.scrollTop = 0;
    },
    barra() {
      const E = C.E, J = E.jugador;
      const enSesion = C.Congreso.enSesion(E);
      const prox = C.Elecciones.proxima(E);
      const pips = Array.from({ length: J.agenda.max }, (_, i) => `<span class="pip ${i < J.agenda.puntos ? 'lleno' : ''}"></span>`).join('');
      const cargo = C.DATA.cargos[J.cargo].nombre + (J.cargoInfo && J.cargoInfo.circ && E.deptos[J.cargoInfo.circ] ? ' · ' + E.deptos[J.cargoInfo.circ].nombre : '');
      document.getElementById('barra').innerHTML = `
        <div class="logo">CURUL <small>Colombia</small></div>
        <div class="fecha"><b>${U.fmtFecha(U.hoy())}</b><span>Semana ${E.fecha.t} · ${enSesion ? '<span class="bien">● Congreso en sesiones</span>' : '<span class="tenue">○ Receso legislativo</span>'}${prox ? ' · ' + esc(prox.nombre) + ' en ' + C.Elecciones.semanasPara(E, prox) + ' sem.' : ''}</span></div>
        <div class="espacio"></div>
        <div class="chip-cargo" data-ir="personaje" style="cursor:pointer">${C.Comp.avatar(E, E.politicos.J, 34)}<div class="txt"><b>${esc(J.nombre)}</b><span>${esc(cargo)}</span></div></div>
        <div class="pips"${UI.tt('<b>Puntos de agenda</b><br>Cada acción importante consume puntos. Se renuevan cada semana.')}>${pips}</div>
        <div class="tiempo">
          <button class="btn prim" id="b-sem"${UI.tt('Avanzar una semana (tecla N)')}>▶ Semana</button>
          <button class="btn" id="b-mes"${UI.tt('Avanzar cuatro semanas (se detiene ante decisiones o elecciones)')}>▶▶ Mes</button>
        </div>`;
      document.getElementById('b-sem').onclick = () => App.avanzar(1);
      document.getElementById('b-mes').onclick = () => App.avanzar(4);
      UI.$$('[data-ir]', document.getElementById('barra')).forEach(b => b.onclick = () => App.ir(b.dataset.ir));
    },
    nav() {
      const E = C.E;
      const badges = { proyectos: C.Legislacion.activos(E).filter(p => p.autor === 'J').length || '', elecciones: E.elecciones.campana ? '●' : '' };
      document.getElementById('nav').innerHTML = NAV.map(n => n ? `<button data-p="${n[0]}" class="${E.ui.pantalla === n[0] ? 'activo' : ''}"><span class="ic">${n[1]}</span><span>${n[2]}</span>${badges[n[0]] ? `<span class="badge">${badges[n[0]]}</span>` : ''}</button>` : '<div class="sep"></div>').join('');
      UI.$$('#nav button').forEach(b => b.onclick = () => App.ir(b.dataset.p));
    },
    ticker() {
      const E = C.E;
      const ns = E.medios.noticias.slice(0, 12);
      document.getElementById('ticker').innerHTML = `<span class="rotulo">ÚLTIMA HORA</span><div style="overflow:hidden;flex:1"><div class="cinta">${ns.map(n => `<span><b>${esc(C.Medios.medio(E, n.medio).nombre)}</b>${esc(n.titular)}</span>`).join('')}</div></div>`;
    },

    /* ── Tiempo ── */
    avanzar(n) {
      const E = C.E;
      const b = C.Tiempo.bloqueo();
      if (b) { App.revisarPendientes(); return; }
      if (E.jugador.agenda.puntos > 0 && n === 1 && !E.ui.avisoPuntos) {
        E.ui.avisoPuntos = true;
        UI.toast('Aún tienes puntos de agenda sin usar. Pulsa de nuevo para avanzar.', '');
        return;
      }
      E.ui.avisoPuntos = false;
      E.ui.votosNuevos = [];
      const t0 = E.fecha.t;
      for (let i = 0; i < n; i++) {
        if (!C.Tiempo.avanzar()) break;
        if (C.Tiempo.bloqueo()) break;
      }
      App.refrescar();
      App.informe(t0);
      App.revisarPendientes();
    },
    /* Informe semanal: votaciones que importan al jugador */
    informe(t0) {
      const E = C.E;
      const ids = (E.ui.votosNuevos || []).slice(-8);
      if (!ids.length || C.Tiempo.bloqueo()) return;
      const vs = ids.map(id => E.votaciones.find(v => v.id === id)).filter(Boolean);
      const propios = vs.filter(v => { const p = E.proyectos[v.proyecto]; return p && (p.autor === 'J' || p.coautores.includes('J')); });
      if (propios.length === 1 && vs.length === 1) { C.Pantallas.votacion.abrir(propios[0].id); return; }
      const cuerpo = `<p class="tenue" style="margin-top:0">Votaciones de interés entre el ${U.fmtT(t0 + 1)} y el ${U.fmtT(E.fecha.t)}.</p><div class="lista">${vs.map(v => {
        const p = E.proyectos[v.proyecto], r = v.resultado;
        return `<div class="it clic" data-voto-ver="${v.id}"><span style="font-size:20px">${r.aprobado ? '🟢' : '🔴'}</span><div class="cuerpo"><b>${esc(p.titulo)}</b><span>${v.instancia === 'comision' ? 'Comisión ' + C.DATA.comisiones[p.comision - 1].nombre + ' · ' : 'Plenaria · '}${C.Congreso.nombreCamara(v.camara)} · ${r.si}–${r.no}${p.autor === 'J' ? ' · <b class="bien">tu proyecto</b>' : p.gobierno ? ' · proyecto del Gobierno' : ''}</span></div><span class="etq ${r.aprobado ? 'verde' : 'rojo'}">${r.aprobado ? 'Aprobado' : 'Negado'}</span></div>`;
      }).join('')}</div>`;
      const m = UI.modal({ titulo: 'Informe legislativo', icono: '🏛', cuerpo });
      m.cuerpo.addEventListener('click', e => { const it = e.target.closest('[data-voto-ver]'); if (it) C.Pantallas.votacion.abrir(it.dataset.votoVer); });
    },
    revisarPendientes() {
      const E = C.E;
      if (E.eventos.pendientes.length) { App.modalEvento(E.eventos.pendientes[0]); return; }
      if (E.elecciones.nochePendiente) { const id = E.elecciones.nochePendiente; E.elecciones.nochePendiente = null; C.Pantallas.elecciones.noche(id); return; }
      if ((E.ui.sancionesPendientes || []).length) C.Pantallas.proyectos.sancion(E.ui.sancionesPendientes[0]);
    },
    modalEvento(ev) {
      const E = C.E, pl = C.Eventos.plantilla(ev.plantilla);
      const cuerpo = `<div class="evento-cab"><div class="evento-icono">${ev.icono}</div><div><div class="etq">${esc(ev.tipo)}</div><p style="font-size:15px;margin:.5em 0 0">${esc(ev.texto)}</p></div></div>
        ${ev.ctx.depto ? `<div class="evento-mapa">${C.Mapa.svg(E, { capa: 'poblacion', marcador: ev.ctx.depto, altoMax: 180 }).svg}</div>` : ''}
        <h3 style="margin:14px 0 8px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">¿Cómo respondes?</h3>
        <div class="col">${pl.opciones.map((o, i) => `<button class="btn opcion" data-op="${i}" style="justify-content:flex-start;text-align:left;white-space:normal;padding:12px 14px">${esc(o.t)}</button>`).join('')}</div>`;
      const m = UI.modal({ titulo: ev.titulo, cuerpo, sinCerrar: true, clase: 'evento' });
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('[data-op]'); if (!b) return;
        const r = C.Eventos.resolver(E, ev.id, +b.dataset.op);
        m.cerrar();
        const nombres = { popularidad: 'Popularidad', reconocimiento: 'Reconocimiento', credibilidad: 'Credibilidad', patrimonio: 'Patrimonio', relGob: 'Relación con el Gobierno', partido: 'Relación con tu partido', honestidad: 'Honestidad', transparencia: 'Transparencia', cercania: 'Cercanía', liderazgo: 'Liderazgo', competencia: 'Competencia', director: 'Dirección del partido' };
        const txt = r.cambios.map(([k, v]) => `${nombres[k] || (k.startsWith('seg:') ? 'Imagen en ' + k.slice(4) : k.startsWith('dep:') ? 'Imagen en ' + E.deptos[k.slice(4)].nombre : k)} ${v > 0 ? '+' : ''}${U.d1(v)}`).join(' · ');
        UI.toast('<b>Decisión tomada.</b> ' + (txt || 'Sin efectos inmediatos'), 'bien');
        App.refrescar();
        App.revisarPendientes();
      });
    }
  };
  C.App = App;
  document.addEventListener('DOMContentLoaded', App.iniciar);
})(window.CURUL);

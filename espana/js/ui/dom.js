/* Utilidades de interfaz: modales, toasts, tooltips, ejecución de acciones y refresco de pantalla. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const UI = {
    $: (s, r) => (r || document).querySelector(s),
    $$: (s, r) => Array.from((r || document).querySelectorAll(s)),
    esc: U.esc,
    /* Atributo de tooltip seguro */
    tt: html => ' data-tt="' + U.esc(html) + '"',

    /* ── Tooltip global (delegado en cualquier elemento con data-tt o data-pol) ── */
    initTooltip() {
      const tip = UI.$('#tooltip');
      let actual = null, tOcultar = null;
      const tactil = () => matchMedia('(hover: none)').matches;
      const ocultar = () => { tip.classList.remove('on'); actual = null; };
      const mostrar = (html, x, y) => {
        tip.innerHTML = html; tip.classList.add('on');
        const w = tip.offsetWidth, h = tip.offsetHeight;
        let lx = x + 14, ly = y + 14;
        if (lx + w > innerWidth - 8) lx = x - w - 14;
        if (ly + h > innerHeight - 8) ly = y - h - 14;
        tip.style.left = Math.max(6, Math.min(lx, innerWidth - w - 6)) + 'px'; tip.style.top = Math.max(6, ly) + 'px';
      };
      document.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-tt],[data-pol]');
        if (!el) { if (actual && !tactil()) ocultar(); return; }   // en táctil se oculta con touchstart o por tiempo
        // En pantallas táctiles el aviso sólo sale al tocar datos, no botones de acción
        if (tactil() && el.closest('button,.btn,[data-accion],[data-ir],a')) { ocultar(); return; }
        actual = el;
        const html = el.dataset.tt || (el.dataset.pol && C.E ? C.Comp.tarjetaPolitico(C.E, el.dataset.pol, el.dataset.voto) : '');
        if (html) { mostrar(html, e.clientX, e.clientY); if (tactil()) { clearTimeout(tOcultar); tOcultar = setTimeout(ocultar, 4500); } }
      });
      document.addEventListener('mousemove', e => { if (actual && !tactil() && tip.classList.contains('on')) mostrar(tip.innerHTML, e.clientX, e.clientY); });
      document.addEventListener('touchstart', e => { if (!e.target.closest('[data-tt],[data-pol]')) ocultar(); }, { passive: true });
      document.addEventListener('scroll', () => tip.classList.remove('on'), true);
    },

    /* ── Modales ── */
    pila: [],
    modal({ titulo, icono, cuerpo, pie, clase, alCerrar, sinCerrar }) {
      const raiz = UI.$('#modal-raiz');
      const fondo = document.createElement('div');
      fondo.className = 'modal-fondo';
      fondo.innerHTML = `<div class="modal ${clase || ''}" role="dialog" aria-modal="true">
        <div class="m-cab">${icono ? `<span style="font-size:22px">${icono}</span>` : ''}<h2>${titulo || ''}</h2>${sinCerrar ? '' : '<button class="cerrar" aria-label="Cerrar">×</button>'}</div>
        <div class="m-cuerpo"></div>${pie ? '<div class="m-pie"></div>' : ''}</div>`;
      raiz.appendChild(fondo);
      const m = { el: fondo, cuerpo: fondo.querySelector('.m-cuerpo'), pie: fondo.querySelector('.m-pie') };
      if (typeof cuerpo === 'string') m.cuerpo.innerHTML = cuerpo; else if (cuerpo) m.cuerpo.appendChild(cuerpo);
      if (pie && m.pie) { if (typeof pie === 'string') m.pie.innerHTML = pie; else m.pie.appendChild(pie); }
      m.cerrar = () => { fondo.remove(); UI.pila = UI.pila.filter(x => x !== m); if (alCerrar) alCerrar(); };
      if (!sinCerrar) {
        fondo.querySelector('.cerrar').onclick = m.cerrar;
        fondo.addEventListener('mousedown', e => { if (e.target === fondo) m.cerrar(); });
      }
      UI.pila.push(m);
      return m;
    },
    /* Al tocar un botón desactivado se explica por qué (en pantallas táctiles no hay «hover»). */
    avisoDesact(b) { if (b.dataset.tt) UI.toast('🔒 ' + b.dataset.tt, 'mal'); },
    cerrarModales() { UI.pila.slice().forEach(m => m.cerrar()); },

    toast(msg, tipo) {
      const t = document.createElement('div');
      t.className = 'toast ' + (tipo || '');
      t.innerHTML = msg;
      UI.$('#toasts').appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3800);
      setTimeout(() => t.remove(), 4200);
    },

    /* ── Ejecuta una acción del jugador y refresca la interfaz ── */
    accion(id, args, opts = {}) {
      // Disolver las Cortes o el Parlamento: antes se elige cómo se anuncia (sorpresa o anunciada)
      const Dc = C.Pantallas && C.Pantallas.declaracion; if (Dc && Dc.interceptar(id, args || {})) return { ok: false, msg: '', pendiente: true };
      const r = C.Acciones.ejecutar(id, args);
      const dd = C.E && C.E.jugador && C.E.jugador._d; if (C.E && C.E.jugador) C.E.jugador._d = null;
      const nom = { prestigio: 'prestigio', pop: 'popularidad', capEU: 'capital europeo' };
      const cambios = dd ? Object.keys(dd).filter(k => Math.abs(dd[k]) >= 0.005).map(k => `${nom[k]} ${dd[k] > 0 ? '+' : '−'}${Math.abs(dd[k]) < 0.1 ? '<0,1' : U.d1(Math.abs(dd[k]))}`).join(' · ') : '';
      if (!opts.silencio) UI.toast((r.ok === false ? '⚠ ' : '') + U.esc(r.msg || 'Hecho') + (cambios && r.ok !== false ? `<div class="tenue" style="font-size:11.5px;margin-top:2px">${cambios}</div>` : ''), r.ok === false ? 'mal' : r.exito === false ? '' : 'bien');
      if (!opts.sinRefresco) C.App.refrescar();
      if (C.E && C.E.ui && C.E.ui.abrir) { const a = C.E.ui.abrir; C.E.ui.abrir = null; setTimeout(() => a.tipo === 'gabinete' ? C.App.ir('gabinete', { key: a.key }) : C.Pantallas.elecciones.consultas(a.modo), 50); }
      return r;
    },
    /* Botón de acción con su costo y disponibilidad */
    botonAccion(id, args, texto, clase) {
      const a = C.Acciones.get(id); if (!a) return '';
      const E = C.E;
      const costo = typeof a.costo === 'function' ? a.costo(E, args) : a.costo;
      const puede = C.Acciones.puede(id, args);
      const tt = puede === true ? '' : UI.tt(puede);
      return `<button class="btn ${clase || ''}${puede === true ? '' : ' desact'}" data-accion="${id}" data-args='${U.esc(JSON.stringify(args || {}))}' ${puede === true ? '' : 'aria-disabled="true"'}${tt}>${texto ? '' : (a.icono || '')} ${texto || a.nombre}${costo ? ` <span class="coste">${costo} ◆</span>` : ''}</button>`;
    },
    /* Delegación global para [data-accion] */
    initAcciones() {
      document.addEventListener('click', e => {
        const b = e.target.closest('[data-accion]');
        if (!b) return;
        if (b.disabled || b.classList.contains('desact')) { UI.avisoDesact(b); return; }
        let args = {}; try { args = JSON.parse(b.dataset.args || '{}'); } catch (x) {}
        // Campos asociados (selects dentro del mismo contenedor .accion-form)
        const form = b.closest('.accion-form');
        if (form) UI.$$('[data-arg]', form).forEach(inp => { args[inp.dataset.arg] = inp.type === 'number' ? +inp.value : inp.value; });
        const r = UI.accion(b.dataset.accion, args);
        if (r && r.pendiente) return;   // se abrió un selector (p. ej. cómo anunciar una disolución): la acción aún no se ha ejecutado
        if (b.dataset.cierra && r.ok !== false) UI.cerrarModales();
        C.Bus.emit('ui:accion', { id: b.dataset.accion, args, r });
      });
    }
  };
  C.UI = UI;
})(window.ESP);

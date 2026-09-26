/* Utilidades de interfaz: modales, toasts, tooltips, ejecución de acciones y refresco de pantalla. */
window.CURUL = window.CURUL || {};
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
      let actual = null;
      const mostrar = (html, x, y) => {
        tip.innerHTML = html; tip.classList.add('on');
        const w = tip.offsetWidth, h = tip.offsetHeight;
        let lx = x + 14, ly = y + 14;
        if (lx + w > innerWidth - 8) lx = x - w - 14;
        if (ly + h > innerHeight - 8) ly = y - h - 14;
        tip.style.left = Math.max(6, lx) + 'px'; tip.style.top = Math.max(6, ly) + 'px';
      };
      document.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-tt],[data-pol]');
        if (!el) { if (actual) { tip.classList.remove('on'); actual = null; } return; }
        actual = el;
        const html = el.dataset.tt || (el.dataset.pol && C.E ? C.Comp.tarjetaPolitico(C.E, el.dataset.pol, el.dataset.voto) : '');
        if (html) mostrar(html, e.clientX, e.clientY);
      });
      document.addEventListener('mousemove', e => { if (actual && tip.classList.contains('on')) mostrar(tip.innerHTML, e.clientX, e.clientY); });
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
      const r = C.Acciones.ejecutar(id, args);
      if (!opts.silencio) UI.toast((r.ok === false ? '⚠ ' : '') + U.esc(r.msg || 'Hecho'), r.ok === false ? 'mal' : r.exito === false ? '' : 'bien');
      if (!opts.sinRefresco) C.App.refrescar();
      return r;
    },
    /* Botón de acción con su costo y disponibilidad */
    botonAccion(id, args, texto, clase) {
      const a = C.Acciones.get(id); if (!a) return '';
      const E = C.E;
      const costo = typeof a.costo === 'function' ? a.costo(E, args) : a.costo;
      const puede = C.Acciones.puede(id, args);
      const tt = puede === true ? '' : UI.tt(puede);
      return `<button class="btn ${clase || ''}" data-accion="${id}" data-args='${U.esc(JSON.stringify(args || {}))}' ${puede === true ? '' : 'disabled'}${tt}>${a.icono || ''} ${texto || a.nombre}${costo ? ` <span class="coste">${costo} ◆</span>` : ''}</button>`;
    },
    /* Delegación global para [data-accion] */
    initAcciones() {
      document.addEventListener('click', e => {
        const b = e.target.closest('[data-accion]');
        if (!b || b.disabled) return;
        let args = {}; try { args = JSON.parse(b.dataset.args || '{}'); } catch (x) {}
        // Campos asociados (selects dentro del mismo contenedor .accion-form)
        const form = b.closest('.accion-form');
        if (form) UI.$$('[data-arg]', form).forEach(inp => { args[inp.dataset.arg] = inp.type === 'number' ? +inp.value : inp.value; });
        const r = UI.accion(b.dataset.accion, args);
        if (b.dataset.cierra && r.ok !== false) UI.cerrarModales();
        C.Bus.emit('ui:accion', { id: b.dataset.accion, args, r });
      });
    }
  };
  C.UI = UI;
})(window.CURUL);

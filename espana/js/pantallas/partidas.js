/* Partidas guardadas: guardar, cargar, exportar, importar y borrar. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};

  const fila = (p, actual) => `<div class="it" style="gap:12px"><span style="font-size:22px">${p.bandera || '🇪🇸'}</span><div class="cuerpo"><b>${esc(p.nombre || p.jugador)} ${actual ? '<span class="etq oro">Actual</span>' : ''}</b><span>${esc(p.jugador)} · ${esc(p.cargo)} · ${esc(p.fecha)} · guardada ${new Date(p.guardado).toLocaleString('es-ES')}</span></div>
    <button class="btn chico" data-cargar="${p.id}">Cargar</button><button class="btn chico peligro" data-borrar="${p.id}">🗑</button></div>`;

  const P_ = C.Pantallas.partidas = {
    render(el) {
      const E = C.E, lista = C.Guardado.listar();
      el.innerHTML = `<div class="cab"><div><h1>Partidas</h1><div class="sub">Se guardan en este navegador cada cuatro semanas. Exporta un archivo para llevarla contigo.</div></div></div>
        <div class="fila" style="margin-bottom:14px;gap:8px"><button class="btn prim" id="g-guardar">💾 Guardar ahora</button><button class="btn" id="g-nueva">📄 Guardar como…</button><button class="btn" id="g-exp">⬇ Exportar (.json)</button><label class="btn">⬆ Importar<input type="file" id="g-imp" accept=".json,application/json" hidden></label><button class="btn" id="g-menu">🏠 Menú principal</button></div>
        <div class="tarjeta"><h3>Partidas guardadas</h3><div class="lista">${lista.map(p => fila(p, p.id === E.meta.slot)).join('') || '<div class="vacio">Aún no hay partidas.</div>'}</div></div>`;
      P_.enlazar(el);
    },
    enlazar(el) {
      const E = C.E;
      UI.$('#g-guardar', el).onclick = () => C.Guardado.guardar(E.meta.slot || null).then(r => { UI.toast(esc(r.msg), r.ok ? 'bien' : 'mal'); C.App.refrescar(); });
      UI.$('#g-nueva', el).onclick = () => { const n = prompt('Nombre de la nueva partida', E.meta.nombrePartida || ''); if (n) { E.meta.slot = null; E.meta.nombrePartida = n; C.Guardado.guardar(null, n).then(r => { UI.toast(esc(r.msg), 'bien'); C.App.refrescar(); }); } };
      UI.$('#g-exp', el).onclick = () => C.Guardado.exportar();
      UI.$('#g-imp', el).onchange = e => { const f = e.target.files[0]; if (f) C.Guardado.importar(f).then(r => { if (r.ok) C.App.comenzar(); else UI.toast(esc(r.msg), 'mal'); }); };
      UI.$('#g-menu', el).onclick = () => C.Guardado.guardar(E.meta.slot || null).then(() => { C.E = null; C.Pantallas.inicio.render(document.getElementById('app')); });
      UI.$$('[data-cargar]', el).forEach(b => b.onclick = () => C.Guardado.cargar(b.dataset.cargar).then(r => r.ok ? C.App.comenzar() : UI.toast(esc(r.msg), 'mal')));
      UI.$$('[data-borrar]', el).forEach(b => b.onclick = () => { if (confirm('¿Borrar esta partida?')) C.Guardado.borrar(b.dataset.borrar).then(() => C.App.refrescar()); });
    },
    modalCargar() {
      const lista = C.Guardado.listar();
      const m = UI.modal({ titulo: 'Cargar partida', icono: '📂', cuerpo: `<div class="lista">${lista.map(p => fila(p, false)).join('')}</div>` });
      UI.$$('[data-cargar]', m.el).forEach(b => b.onclick = () => C.Guardado.cargar(b.dataset.cargar).then(r => { if (r.ok) { m.cerrar(); C.App.comenzar(); } else UI.toast(esc(r.msg), 'mal'); }));
      UI.$$('[data-borrar]', m.el).forEach(b => b.onclick = () => { if (confirm('¿Borrar esta partida?')) C.Guardado.borrar(b.dataset.borrar).then(() => { m.cerrar(); C.Pantallas.partidas.modalCargar(); }); });
    }
  };
})(window.ESP);

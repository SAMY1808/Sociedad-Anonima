/* Partidas: guardar, cargar, borrar, exportar e importar. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};

  const filas = (lista, actual) => lista.map(p => `<div class="it partida ${p.id === actual ? 'actual' : ''}"><span style="font-size:22px">🏛</span><div class="cuerpo"><b>${esc(p.nombre)}</b><span>${esc(p.jugador)} · ${esc(p.cargo)} · ${esc(p.fecha)} · guardada ${new Date(p.guardado).toLocaleString('es-CO')}</span></div>
    <button class="btn chico" data-cargar="${p.id}">Cargar</button><button class="btn chico peligro" data-borrar="${p.id}">Borrar</button></div>`).join('') || '<div class="vacio">No hay partidas guardadas.</div>';

  const enlazar = (raiz, alCambiar) => {
    raiz.addEventListener('click', e => {
      const c = e.target.closest('[data-cargar]');
      if (c) C.Guardado.cargar(c.dataset.cargar).then(r => { if (r.ok) { UI.cerrarModales(); C.App.comenzar(); UI.toast('Partida cargada', 'bien'); } else UI.toast(r.msg, 'mal'); });
      const b = e.target.closest('[data-borrar]');
      if (b && confirm('¿Borrar esta partida? No se puede deshacer.')) C.Guardado.borrar(b.dataset.borrar).then(alCambiar);
    });
  };

  C.Pantallas.partidas = {
    render(el) {
      const E = C.E;
      el.innerHTML = `<div class="cab"><div><h1>Partidas</h1><div class="sub">El juego se guarda solo cada cuatro semanas. Aquí puedes guardar, cargar, exportar e importar.</div></div></div>
        <div class="grid g2">
          <div class="tarjeta"><h3>Partida actual</h3>
            <div class="campo"><label>Nombre de la partida</label><input id="g-nombre" value="${esc((C.Guardado.listar().find(x => x.id === E.meta.slot) || {}).nombre || E.meta.nombrePartida)}"></div>
            <div class="fila"><button class="btn prim" id="g-guardar">💾 Guardar</button><button class="btn" id="g-nueva">💾 Guardar como nueva</button><button class="btn" id="g-exp">⬇ Exportar .json</button>
              <label class="btn">⬆ Importar<input type="file" id="g-imp" accept=".json,application/json" hidden></label></div>
            <div class="tenue" style="font-size:12px;margin-top:10px">Semilla del mundo: <span class="mono">${E.meta.semilla}</span> · versión ${esc(E.meta.version)} · esquema ${E.meta.esquema}</div>
            <div style="margin-top:14px"><button class="btn peligro" id="g-salir">⏏ Salir al menú principal</button></div></div>
          <div class="tarjeta"><h3>Partidas guardadas</h3><div class="lista" id="g-lista">${filas(C.Guardado.listar(), E.meta.slot)}</div></div>
        </div>`;
      const $ = s => UI.$(s, el);
      $('#g-guardar').onclick = () => C.Guardado.guardar(E.meta.slot, $('#g-nombre').value).then(r => { UI.toast(r.msg, r.ok ? 'bien' : 'mal'); C.App.refrescar(); });
      $('#g-nueva').onclick = () => { E.meta.slot = null; C.Guardado.guardar(null, $('#g-nombre').value + ' (copia)').then(r => { UI.toast(r.msg, r.ok ? 'bien' : 'mal'); C.App.refrescar(); }); };
      $('#g-exp').onclick = () => C.Guardado.exportar();
      $('#g-imp').onchange = e => { const f = e.target.files[0]; if (f) C.Guardado.importar(f).then(r => { if (r.ok) { C.App.comenzar(); UI.toast('Partida importada', 'bien'); } else UI.toast(r.msg, 'mal'); }); };
      $('#g-salir').onclick = () => C.Guardado.guardar(E.meta.slot).then(() => { C.E = null; C.Pantallas.inicio.render(document.getElementById('app')); });
      enlazar($('#g-lista'), () => C.App.refrescar());
    },
    modalCargar() {
      const m = UI.modal({ titulo: 'Cargar partida', icono: '📂', cuerpo: `<div class="lista">${filas(C.Guardado.listar())}</div>` });
      enlazar(m.cuerpo, () => { m.cerrar(); C.Pantallas.partidas.modalCargar(); });
    }
  };
})(window.CURUL);

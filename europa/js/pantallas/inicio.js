/* Pantalla de título: nueva partida, continuar, cargar e importar. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.inicio = {
    render(el) {
      const partidas = C.Guardado.listar();
      el.innerHTML = `<div class="inicio">
        <div class="inicio-fondo" style="inset:auto 0 0 0;opacity:.34;align-items:flex-end">${C.Mosaico.seleccion(null)}</div>
        <div class="inicio-caja">
          <div class="inicio-escudo">★</div>
          <h1 style="font-size:54px">CURUL</h1>
          <p class="inicio-lema" style="font-size:15px;letter-spacing:.5em;color:var(--oro2)">E U R O P A</p>
          <p class="inicio-lema">Simulador de estrategia política</p>
          <div class="franja" style="background:linear-gradient(90deg,var(--azul) 70%,var(--amarillo) 70%)"></div>
          <div class="col" style="gap:10px;margin-top:22px;width:min(360px,100%)">
            ${partidas.length ? `<button class="btn prim" id="i-cont" style="padding:12px">▶ Continuar: ${esc(partidas[0].jugador)} ${partidas[0].bandera || ''} <span class="tenue" style="color:#3a2c07">· ${esc(partidas[0].fecha)}</span></button>` : ''}
            <button class="btn ${partidas.length ? '' : 'prim'}" id="i-nueva" style="padding:12px">✦ Nueva carrera política</button>
            ${partidas.length ? `<button class="btn" id="i-cargar" style="padding:12px">📂 Cargar partida (${partidas.length})</button>` : ''}
            <label class="btn" style="padding:12px">⬆ Importar partida (.json)<input type="file" accept=".json,application/json" id="i-imp" hidden></label>
          </div>
          <p class="tenue" style="font-size:11.5px;margin-top:26px;max-width:520px;text-align:center">Juega con un partido de cualquiera de los 27 Estados de la UE, el Reino Unido o los 9 candidatos a la adhesión. Entra en el parlamento nacional, forma gobiernos, vota leyes y decide en el Consejo, el Parlamento Europeo y la Comisión. Partidos y personas son ficticios. <span class="mono">v${C.VERSION}</span></p>
        </div></div>`;
      const cont = UI.$('#i-cont', el);
      if (cont) cont.onclick = () => C.Guardado.cargar(partidas[0].id).then(r => r.ok ? C.App.comenzar() : UI.toast(r.msg, 'mal'));
      UI.$('#i-nueva', el).onclick = () => C.Pantallas.creacion.render(el);
      const car = UI.$('#i-cargar', el);
      if (car) car.onclick = () => C.Pantallas.partidas.modalCargar();
      UI.$('#i-imp', el).onchange = e => { const f = e.target.files[0]; if (f) C.Guardado.importar(f).then(r => r.ok ? C.App.comenzar() : UI.toast(r.msg, 'mal')); };
    }
  };
})(window.EUROPA);

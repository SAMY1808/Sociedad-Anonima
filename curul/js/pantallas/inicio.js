/* Pantalla de título: nueva partida, continuar, cargar e importar. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};

  /* Hemiciclo decorativo animado para la portada */
  const portada = () => {
    let s = '<svg viewBox="0 0 600 320" class="portada-hemi">';
    const cols = ['#A15BD1', '#E04848', '#5DB85A', '#D1A824', '#E8812A', '#26B59A', '#4A7BE0', '#6CC4F5', '#5FD0E0'];
    let k = 0;
    for (let f = 0; f < 7; f++) {
      const r = 120 + f * 26, n = Math.round(16 + f * 3.6);
      for (let i = 0; i < n; i++) {
        const a = Math.PI - Math.PI * i / (n - 1);
        const c = cols[Math.min(cols.length - 1, Math.floor(i / n * cols.length))];
        s += `<circle cx="${300 + r * Math.cos(a)}" cy="${305 - r * Math.sin(a)}" r="8" fill="${c}" style="animation-delay:${(k++ % 97) * 23}ms"/>`;
      }
    }
    return s + '</svg>';
  };

  C.Pantallas.inicio = {
    render(el) {
      const partidas = C.Guardado.listar();
      el.innerHTML = `<div class="inicio">
        <div class="inicio-fondo">${portada()}</div>
        <div class="inicio-caja">
          <div class="inicio-escudo">★</div>
          <h1>CURUL</h1>
          <p class="inicio-lema">Simulador de estrategia política · República de Colombia</p>
          <div class="franja"><i></i><i></i><i></i></div>
          <div class="col" style="gap:10px;margin-top:22px;width:min(340px,100%)">
            ${partidas.length ? `<button class="btn prim" id="i-cont" style="padding:12px">▶ Continuar: ${esc(partidas[0].jugador)} <span class="tenue" style="color:#3a2c07">· ${esc(partidas[0].fecha)}</span></button>` : ''}
            <button class="btn ${partidas.length ? '' : 'prim'}" id="i-nueva" style="padding:12px">✦ Nueva carrera política</button>
            ${partidas.length ? `<button class="btn" id="i-cargar" style="padding:12px">📂 Cargar partida (${partidas.length})</button>` : ''}
            <label class="btn" style="padding:12px">⬆ Importar partida (.json)<input type="file" accept=".json,application/json" id="i-imp" hidden></label>
          </div>
          <p class="tenue" style="font-size:11.5px;margin-top:26px;max-width:460px;text-align:center">Una Colombia ficticia, institucionalmente inspirada en la real: Constitución de 1991, cifra repartidora, voto preferente, comisiones constitucionales y Estatuto de la Oposición. Partidos, medios y personajes son inventados. <span class="mono">v${C.VERSION}</span></p>
        </div></div>`;
      const cont = UI.$('#i-cont', el);
      if (cont) cont.onclick = () => C.Guardado.cargar(partidas[0].id).then(r => r.ok ? C.App.comenzar() : UI.toast(r.msg, 'mal'));
      UI.$('#i-nueva', el).onclick = () => C.Pantallas.creacion.render(el);
      const car = UI.$('#i-cargar', el);
      if (car) car.onclick = () => C.Pantallas.partidas.modalCargar();
      UI.$('#i-imp', el).onchange = e => { const f = e.target.files[0]; if (f) C.Guardado.importar(f).then(r => r.ok ? C.App.comenzar() : UI.toast(r.msg, 'mal')); };
    }
  };
})(window.CURUL);

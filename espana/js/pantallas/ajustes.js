/* Ajustes: dificultad y ritmo, y compartir la partida con un código. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const b64 = async (txt) => { const cs = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip')); const buf = new Uint8Array(await new Response(cs).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192)); return btoa(s); };
  const deb64 = async (cod) => { const bin = atob(cod), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip')); return await new Response(ds).text(); };
  const AjP = C.Pantallas.ajustes = {
    codigo: b64, decodificar: deb64,
    render(el) {
      const E = C.E, Aj = C.Ajustes, a = Aj.get(E), seg = (k, op, v) => `<div class="seg">${op.map(([x, n]) => `<button data-aj="${k}" data-v="${x}" class="${String(v) === String(x) ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      el.innerHTML = `<div class="cab"><div><h1>⚙️ Ajustes</h1><div class="sub">Dificultad, ritmo del juego y compartir tu partida</div></div></div>
        <div class="tarjeta"><div class="t-cab"><h3>🎚 Dificultad</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Fácil: +1 punto de agenda y menos casos de corrupción. Difícil: −1 punto y más casos.</div>${seg('dif', Object.keys(Aj.DIF).map(k => [k, Aj.DIF[k].n]), a.dif)}</div>
        <div class="tarjeta"><div class="t-cab"><h3>📨 Frecuencia de sucesos</h3></div>${seg('eventos', [[0.5, 'Pocos'], [1, 'Normal'], [1.5, 'Muchos']], a.eventos)}</div>
        ${E.jugador.pais === 'ES' ? `<div class="tarjeta"><div class="t-cab"><h3>🏢 Vista del juego</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Persona: tu carrera, tu salud y tus metas. Partido: dirección del partido como organización (sin carrera personal, estrés ni metas).</div>${seg('vista', [['persona', '👤 Persona'], ['partido', '🏢 Partido']], E.meta.vistaPartido ? 'partido' : 'persona')}</div>` : ''}
        ${E.jugador.pais === 'ES' ? `<div class="tarjeta"><div class="t-cab"><h3>🎯 Enfoque del juego</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px"><b>Por cargo</b>: el juego gira en torno a tu cargo (Gobierno de España, tu comunidad o tu ayuntamiento); lo demás sigue por su cuenta y sólo te llega como noticia. <b>Panorámico</b>: decides en los tres niveles a la vez.</div>${seg('foco', [['cargo', 'Por cargo'], ['todo', 'Panorámico']], C.Foco ? C.Foco.modo(E) : 'cargo')}${C.Foco && C.Foco.info(E) ? `<div class="nota" style="margin-top:8px;font-size:12.5px"><b>${esc(C.Foco.info(E).titulo)}</b> · ${esc(C.Foco.info(E).texto)}</div>` : ''}</div>` : ''}
        <div class="tarjeta"><div class="t-cab"><h3>🚨 Frecuencia de crisis</h3></div>${seg('crisis', [[0.5, 'Pocas'], [1, 'Normal'], [1.5, 'Muchas']], a.crisis)}</div>
        <div class="tarjeta"><div class="t-cab"><h3>🥊 Agresividad de tu némesis</h3></div>${seg('rival', [[0.5, 'Suave'], [1, 'Normal'], [1.5, 'Feroz']], a.rival)}</div>
        <div class="tarjeta"><div class="t-cab"><h3>🧑‍💼 Ayuda del jefe de gabinete</h3></div>${seg('jefe', [[0.5, 'Poca'], [1, 'Normal'], [1.5, 'Mucha']], a.jefe)}</div>
        <div class="tarjeta"><div class="t-cab"><h3>🧪 Informe de partida</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Un resumen <b>anónimo</b> (sin nombres ni datos personales) de cómo va tu partida: ritmo, qué usas, qué decides y cómo van el país y el partido. Pégalo en un mensaje para ayudar a ajustar el equilibrio del juego.</div>
          <div class="fila" style="gap:6px;flex-wrap:wrap"><button class="btn chico prim" id="aj-inf">Generar informe</button><button class="btn chico" id="aj-inf-cp" disabled>Copiar texto</button><button class="btn chico" id="aj-inf-js" disabled>Copiar datos (JSON)</button></div><textarea id="aj-inf-t" rows="9" style="width:100%;margin-top:8px;font-size:11px" readonly placeholder="Pulsa «Generar informe»."></textarea></div>
        <div class="tarjeta"><div class="t-cab"><h3>📤 Compartir la partida</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Genera un código comprimido para pasar tu partida a otra persona u otro dispositivo (no hay servidor: el código contiene toda la partida). También puedes descargar el archivo desde Partidas.</div>
          <div class="fila" style="gap:6px;flex-wrap:wrap"><button class="btn chico prim" id="aj-gen">Generar código</button><button class="btn chico" id="aj-copiar" disabled>Copiar</button></div><textarea id="aj-cod" rows="3" style="width:100%;margin-top:8px;font-size:11px" readonly placeholder="El código aparecerá aquí"></textarea><div class="tenue" id="aj-tam" style="font-size:11.5px"></div>
          <div class="campo" style="margin-top:12px"><label>Cargar una partida desde un código</label><textarea id="aj-in" rows="3" style="width:100%;font-size:11px" placeholder="Pega aquí el código (CURUL1:…)"></textarea></div><button class="btn chico" id="aj-cargar">Cargar partida</button></div>`;
      UI.$$('[data-aj]', el).forEach(b => b.onclick = () => { Aj.fijar(E, b.dataset.aj, b.dataset.v); C.App.refrescar(); });
      { const ib = UI.$('#aj-inf', el), it = UI.$('#aj-inf-t', el), c1 = UI.$('#aj-inf-cp', el), c2 = UI.$('#aj-inf-js', el), copiar = txt => { try { navigator.clipboard.writeText(txt); UI.toast('Copiado.', 'bien'); } catch (e) { it.value = txt; it.select(); document.execCommand('copy'); } };
        ib.onclick = () => { try { it.value = C.Informe.texto(E); c1.disabled = c2.disabled = false; } catch (e) { it.value = 'No se pudo generar el informe: ' + e.message; } };
        c1.onclick = () => copiar(C.Informe.texto(E)); c2.onclick = () => copiar(C.Informe.json(E)); }
      const gen = UI.$('#aj-gen', el), cod = UI.$('#aj-cod', el), cp = UI.$('#aj-copiar', el);
      gen.onclick = async () => { try { const txt = await b64(JSON.stringify(E)); cod.value = 'CURUL1:' + txt; UI.$('#aj-tam', el).textContent = Math.round(cod.value.length / 1024) + ' KB'; cp.disabled = false; } catch (e) { UI.toast('Tu navegador no permite comprimir la partida.', 'mal'); } };
      cp.onclick = () => { cod.select(); try { navigator.clipboard.writeText(cod.value); UI.toast('Código copiado.', 'bien'); } catch (e) { document.execCommand('copy'); } };
      UI.$('#aj-cargar', el).onclick = async () => { const v = UI.$('#aj-in', el).value.trim(); if (!v.startsWith('CURUL1:')) return UI.toast('El código debe empezar por CURUL1:', 'mal'); try { const json = await deb64(v.slice(7)); const r = C.Guardado.desdeTexto(json, null); if (!r.ok) return UI.toast(esc(r.msg), 'mal'); C.App.comenzar(); UI.toast('Partida cargada desde el código.', 'bien'); } catch (e) { UI.toast('Código no válido.', 'mal'); } };
    }
  };
})(window.ESP);

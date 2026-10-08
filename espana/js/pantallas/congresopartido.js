/* Congreso del partido en directo: discurso, pasillos y votación de delegados en tiempo real. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, clamp = U.clamp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.congresopartido = {
    modal() {
      const E = C.E, Pi = C.PartidoInt, J = E.jugador, pa = E.partidos[J.partido], p = Pi.asegurar(E), c = p.cong, esL = pa.lider === 'J', ret = c.retador, vieja = !esL && E.politicos[pa.lider];
      const ora = J.atrib.oratoria / 10, car = J.atrib.carisma / 10, neg = J.atrib.negociacion / 10; let bonus = 0, paso = 0; const log = [];
      const m = UI.modal({ titulo: `🎗 Congreso federal de ${pa.sigla}`, icono: '🏛', clase: 'medio', sinCerrar: true, cuerpo: '' });
      const rival = esL ? (ret ? `${esc(ret.n)} (retador/a)` : 'Nadie se presenta frente a ti, pero la sala puede castigarte') : `${esc(vieja ? vieja.n : 'la dirección')} (líder actual)`;
      const cab = () => `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="etq">${esL ? '🎗 Defiendes el liderazgo' : '🏁 Eres candidato/a al liderazgo'}</span><span class="etq">Frente a: ${rival}</span></div><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:6px;font-size:12px;margin-bottom:8px">${Object.keys(Pi.FAC).map(k => `<div><b>${Pi.FAC[k][1]} ${Pi.FAC[k][0]}</b><div class="barra-h" style="height:6px"><i style="width:${Math.round(p.fac[k])}%;background:var(--oro)"></i></div>${Math.round(p.fac[k])} %</div>`).join('')}</div>`;
      const hist = () => `<div class="lista" style="font-size:12.5px;margin-bottom:8px">${log.map(l => `<div class="it"><span class="etq">${esc(l[0])}</span><div class="cuerpo" style="flex:1;white-space:normal;margin-left:8px">${esc(l[1])}</div></div>`).join('')}</div>`;
      const pasos = [
        { t: '🎤 Tu discurso ante los delegados', q: 'Seiscientos delegados esperan tu intervención. El tono marcará la sala.', ops: [
          ['Un discurso ilusionante', 'Más carisma que fondo.', () => { const b = 1 + car * 4 + U.gauss(0, 1.5); bonus += b; return b > 3.5 ? 'La sala se pone en pie. Ovación larga.' : 'Buen discurso, aunque la sala se queda a medias.'; }],
          ['Un discurso de unidad', 'Cierra heridas con los críticos.', () => { bonus += 3 + ora * 1.5; p.fac.critico = clamp(p.fac.critico - 2, 5, 60); return 'Tiendes la mano a todos: los críticos te escuchan.'; }],
          ['Un discurso combativo', 'Arriesgado: o enardece o divide.', () => { const b = 2 + U.gauss(0, 5) + ora * 2; bonus += b; return b > 3 ? 'Enardeces a los delegados.' : 'Tu tono crispa a media sala.'; }]] },
        { t: '🚪 Los pasillos del congreso', q: 'La noche antes de la votación se decide en los pasillos. ¿A quién te dedicas?', ops: [
          ['Atar a los barones', 'Su peso decide: +apoyo, a cambio de promesas.', () => { bonus += 2 + neg * 3 + p.fac.barones / 15; C.Personaje.cambiar(E, { prestigio: -0.3 }, true); return 'Los barones te garantizan sus delegaciones a cambio de compromisos.'; }],
          ['Pactar con los críticos', 'Les ofreces puestos en la ejecutiva.', () => { bonus += 1.5 + neg * 2; p.fac.critico = clamp(p.fac.critico - 4, 5, 60); pa.cohesion = clamp(pa.cohesion + 1.5, 15, 99); return 'Los críticos se avienen a un pacto de integración.'; }],
          ['Ir delegación por delegación', 'Lento pero seguro.', () => { bonus += 2.5 + car * 1.5; return 'Hablas con las delegaciones una a una.'; }]] }
      ];
      const pinta = () => {
        if (paso >= pasos.length) return votar();
        const s = pasos[paso]; m.cuerpo.innerHTML = `${cab()}${hist()}<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>${s.t}</h3><span class="etq">${paso + 1}/${pasos.length + 1}</span></div><p style="margin:4px 0 8px;font-size:14px">${esc(s.q)}</p><div class="lista">${s.ops.map((o, i) => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px;white-space:normal"><b>${esc(o[0])}</b><div class="tenue" style="font-size:11.5px">${esc(o[1])}</div></div><button class="btn chico" data-o="${i}">Elegir</button></div>`).join('')}</div></div>`;
        UI.$$('[data-o]', m.cuerpo).forEach(b => b.onclick = () => { const o = s.ops[+b.dataset.o]; log.push([s.t.replace(/^\S+\s/, ''), o[2]()]); paso++; pinta(); });
      };
      const votar = () => {
        const ex = { bonus }; Pi.congreso(E, ex); const pct = ex.pct != null ? ex.pct : 50, N = 640; let lote = 0; const LOTES = 6;
        m.cuerpo.innerHTML = `${cab()}${hist()}<div class="tarjeta"><div class="t-cab"><h3>🗳 Votación de delegados</h3><span class="etq" id="cp-lote">Abriendo urnas…</span></div><div class="fila" style="gap:8px;align-items:center"><b id="cp-si">0</b><div class="barra-h" style="height:14px;flex:1"><i id="cp-bar" style="width:50%;background:var(--oro)"></i></div><b id="cp-no">0</b></div><div class="tenue" style="font-size:12px;margin-top:6px" id="cp-pct"></div></div><div id="cp-fin"></div>`;
        const pinta2 = () => { lote++; const f = lote / LOTES, ruido = U.gauss(0, 6) * (1 - f), parcial = clamp(f === 1 ? pct : pct + ruido, 5, 95), esc_ = Math.round(N * f), si = Math.round(esc_ * parcial / 100); UI.$('#cp-si', m.cuerpo).textContent = si; UI.$('#cp-no', m.cuerpo).textContent = esc_ - si; UI.$('#cp-bar', m.cuerpo).style.width = parcial + '%'; UI.$('#cp-pct', m.cuerpo).textContent = `${Math.round(parcial)} % a favor · ${esc_} de ${N} delegados escrutados`; UI.$('#cp-lote', m.cuerpo).textContent = `Delegaciones ${lote}/${LOTES}`; if (lote < LOTES) setTimeout(pinta2, 1100); else fin(); };
        const fin = () => { const ok = /gana|revalida/.test(ex.res || ''); UI.$('#cp-fin', m.cuerpo).innerHTML = `<div class="nota" style="margin-top:10px;border-left:3px solid ${ok ? 'var(--si,#3bb273)' : 'var(--no,#d9534f)'}"><b>${ok ? '🏆 Resultado' : '💔 Resultado'}</b><div style="margin-top:4px;font-size:13px">${esc(ex.res || '')}</div></div><div class="fila" style="margin-top:10px;justify-content:flex-end"><button class="btn prim" id="cp-ok">Continuar</button></div>`; UI.$('#cp-ok', m.cuerpo).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); }; };
        setTimeout(pinta2, 700);
      };
      pinta();
    }
  };
})(window.ESP);

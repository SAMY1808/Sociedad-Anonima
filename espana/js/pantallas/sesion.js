/* Sesión de investidura / moción de censura en directo. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, clamp = U.clamp, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.sesion = {
    modal() {
      const E = C.E, ps = E.esp.pendienteSesion; if (!ps) return C.App.revisarPendientes();
      const J = E.jugador, Se = C.Sesion, rol = Se.rol(E, ps), mocion = ps.tipo === 'mocion', cand = ps.cand, P = E.paises.ES, ora = J.atrib.oratoria / 10, car = J.atrib.carisma / 10, neg = J.atrib.negociacion / 10;
      const lid = E.politicos[E.partidos[cand].lider], nom = lid ? lid.n : E.partidos[cand].sigla; let swing = 0, paso = 0; const log = [];
      const titulo = mocion ? '⚡ Moción de censura' : '🏛 Debate de investidura';
      const m = UI.modal({ titulo, icono: '🏛', clase: 'medio', sinCerrar: true, cuerpo: '' });
      const intro = rol === 'candidato' ? (mocion ? 'Defiendes tu moción de censura desde la tribuna.' : 'Defiendes tu investidura desde la tribuna.') : rol === 'defensor' ? `Debes defender a tu Gobierno de la moción de censura de ${esc(nom)}.` : `Replicas desde la bancada a ${esc(nom)}.`;
      const cab = () => `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="etq">${mocion ? 'Moción de censura de' : 'Candidato/a:'} ${esc(nom)} (${esc(E.partidos[cand].sigla)})</span><span class="etq">Mayoría absoluta: 176</span></div><p style="margin:0 0 8px;font-size:13.5px">${intro}</p>`;
      const hist = () => `<div class="lista" style="font-size:12.5px;margin-bottom:8px">${log.map(l => `<div class="it"><span class="etq">${esc(l[0])}</span><div class="cuerpo" style="flex:1;white-space:normal;margin-left:8px">${esc(l[1])}</div></div>`).join('')}</div>`;
      const R = rol === 'oposicion' ? 'tu réplica' : 'tu intervención';
      const pasos = [
        { t: `🎤 ${rol === 'oposicion' ? 'Tu réplica' : 'Tu discurso'}`, q: `Primer turno: ${R} ante el pleno.`, ops: [
          ['Defender un programa', 'Sólido, premia la oratoria.', () => { const s = ora * 0.9 - 0.25 + U.gauss(0, 0.15); swing += s; return s > 0.4 ? 'Un discurso trabajado que gana respeto en toda la Cámara.' : 'Un discurso correcto, sin fuegos artificiales.'; }],
          ['Atacar sin piedad al adversario', 'Brillante o contraproducente.', () => { const s = car * 0.6 - 0.2 + U.gauss(0, 0.45); swing += s; return s > 0.35 ? 'Tu dureza enardece a tus filas y descoloca al adversario.' : 'El tono agresivo incomoda a los grupos que querías seducir.'; }],
          ['Ofrecer diálogo y un gran pacto', 'Atrae a los dudosos.', () => { const s = neg * 0.8 - 0.15 + U.gauss(0, 0.12); swing += s; return 'Tiendes la mano a los grupos que aún dudan.'; }]] },
        { t: '🚪 Antes de la votación', q: 'El presidente del Congreso suspende cinco minutos. ¿Cómo los aprovechas?', ops: [
          ['Hablar con los grupos indecisos', 'Basado en tu negociación.', () => { const s = neg * 0.7 - 0.1 + U.gauss(0, 0.15); swing += s; return 'Cruzas pasillos y dejas un par de compromisos verbales.'; }],
          ['Reiterar tus compromisos públicamente', 'Seguro y discreto.', () => { swing += 0.2; return 'Reafirmas tus compromisos ante las cámaras.'; }],
          ['Un gesto de última hora', 'Concesión que cuesta cohesión.', () => { swing += 0.45; E.partidos[J.partido].cohesion = clamp(E.partidos[J.partido].cohesion - 1.5, 15, 99); return 'Aceptas un gesto sorpresa: algunos dudosos cambian de postura.'; }]] }
      ];
      const pinta = () => {
        if (paso >= pasos.length) return votar();
        const s = pasos[paso]; m.cuerpo.innerHTML = `${cab()}${hist()}<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>${s.t}</h3><span class="etq">${paso + 1}/${pasos.length + 1}</span></div><p style="margin:4px 0 8px;font-size:14px">${esc(s.q)}</p><div class="lista">${s.ops.map((o, i) => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px;white-space:normal"><b>${esc(o[0])}</b><div class="tenue" style="font-size:11.5px">${esc(o[1])}</div></div><button class="btn chico" data-o="${i}">Elegir</button></div>`).join('')}</div></div>`;
        UI.$$('[data-o]', m.cuerpo).forEach(b => b.onclick = () => { const o = s.ops[+b.dataset.o]; log.push([s.t.replace(/^\S+\s/, ''), o[2]()]); paso++; pinta(); });
      };
      const votar = () => {
        const peso = rol === 'oposicion' ? 0 : 1; E.esp.pendienteSesion = null; E.esp.sesionHecha = true; E.esp.sesionSwing = clamp(swing / 2, -1, 1) * peso;
        if (mocion) C.Ejecutivo.votarMocion(E); else C.Ejecutivo.votar(E);
        const uv = E.esp.ultVot || { est: {}, si: 0, no: 0, abs: 0 }, grupos = Object.keys(uv.est).sort((a, b) => (P.escanos[b] || 0) - (P.escanos[a] || 0)); let i = 0, si = 0, no = 0, abs = 0;
        m.cuerpo.innerHTML = `${cab()}${hist()}<div class="tarjeta"><div class="t-cab"><h3>🗳 Votación nominal</h3><span class="etq" id="se-n">Llamamiento…</span></div><div id="se-bar"></div><div class="tenue" style="font-size:12.5px;margin-top:6px" id="se-t"></div><div class="lista" id="se-g" style="font-size:12.5px;margin-top:8px"></div></div><div id="se-fin"></div>`;
        const tick = () => { if (i < grupos.length) { const k = grupos[i++], n = P.escanos[k] || 0, v = uv.est[k]; if (v === 'si') si += n; else if (v === 'no') no += n; else abs += n; UI.$('#se-g', m.cuerpo).insertAdjacentHTML('afterbegin', `<div class="it">${Comp.partido(E, k)}<span class="tenue" style="margin-left:6px">${n} escaños</span><span class="etq ${v === 'si' ? 'verde' : v === 'no' ? 'rojo' : ''}" style="margin-left:auto">${v === 'si' ? 'Sí' : v === 'no' ? 'No' : 'Abstención'}</span></div>`); UI.$('#se-bar', m.cuerpo).innerHTML = G.apilada([{ etq: 'A favor', v: si, color: 'var(--si)' }, { etq: 'Abstención', v: abs, color: 'var(--abs)' }, { etq: 'En contra', v: no, color: 'var(--no)' }], { total: 350, mayoria: 176, alto: 18 }); UI.$('#se-t', m.cuerpo).textContent = `${si} a favor · ${no} en contra · ${abs} abstenciones`; UI.$('#se-n', m.cuerpo).textContent = `Grupo ${i}/${grupos.length}`; setTimeout(tick, 650); } else fin(); };
        const fin = () => { const c = E.esp.cortes, ok = mocion ? uv.si >= 176 : c.estado === 'activa', txt = mocion ? (ok ? 'La moción prospera: cambia el Gobierno.' : 'La moción de censura fracasa.') : (ok ? 'El candidato es investido presidente.' : (uv.si > uv.no ? 'Mayoría simple: se abre el cómputo para la investidura.' : 'La investidura fracasa.')); UI.$('#se-fin', m.cuerpo).innerHTML = `<div class="nota" style="margin-top:10px;border-left:3px solid ${ok ? 'var(--si,#3bb273)' : 'var(--no,#d9534f)'}"><b>${esc(txt)}</b><div style="margin-top:4px;font-size:13px">${uv.si} votos a favor, ${uv.no} en contra y ${uv.abs} abstenciones.</div></div><div class="fila" style="margin-top:10px;justify-content:flex-end"><button class="btn prim" id="se-ok">Continuar</button></div>`; UI.$('#se-ok', m.cuerpo).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); }; };
        setTimeout(tick, 600);
      };
      pinta();
    }
  };
})(window.ESP);

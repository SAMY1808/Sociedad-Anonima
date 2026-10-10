/* Debate televisado en directo (sustituye a Campana.modalDebate): cuatro temas y un alegato final con tono a elegir. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas.campana.modalDebate = function () {
    const E = C.E, Ca = C.Campana, Db = C.Debate; if (!E.esp.pendienteDebate) return C.App.revisarPendientes();
    const camp = Ca.mias(E).map(x => x.camp).find(x => !x.debate.hecho && E.fecha.t >= x.debate.t && Ca.debateJugador(E, x)) || Ca.cur(E), J = E.jugador, st = Db.preparar(E, camp);
    const m = UI.modal({ titulo: '📺 Debate decisivo' + (camp.ambito === 'aut' ? ' · ' + D().ccaa[camp.c].nombre : ''), icono: '🎙', clase: 'medio', sinCerrar: true, cuerpo: '' });
    const barra = () => { const tot = (st.sj + st.sr) || 1, p = Math.round(st.sj / tot * 100); return `${C.Escenas ? C.Escenas.html(E, 'debate_tv', { pid: J.partido, pid2: Db._rival, compacta: true, leyenda: 'Debate electoral' }) : ''}<div class="fila" style="gap:8px;align-items:center;font-size:12.5px;margin-bottom:8px"><b>Tú</b><div class="barra-h" style="height:10px;flex:1"><i style="width:${p}%;background:var(--oro)"></i></div><b>${esc(st.rivalNombre)} (${esc(E.partidos[st.rival].sigla)})</b></div><div class="tenue" style="font-size:11.5px;margin-bottom:6px">Percepción de la audiencia · ${p} % a tu favor</div>`; };
    const hist = () => `<div class="lista" style="font-size:12.5px;margin-bottom:8px">${st.log.map(x => `<div class="it"><span class="etq ${x.res === 'gana' ? 'verde' : x.res === 'pierde' ? 'rojo' : ''}">${esc(x.r.titulo.replace(/^\S+\s/, ''))}</span><div class="cuerpo" style="flex:1;white-space:normal;margin-left:8px">${esc(x.texto)}</div></div>`).join('')}</div>`;
    const pinta = () => {
      if (st.i >= st.rondas.length) return final();
      const r = st.rondas[st.i], ventaja = r.tema === 'cierre' ? '' : `<div class="tenue" style="font-size:12px;margin-bottom:6px">Terreno: ${r.v > 0.25 ? '<b class="bien">te favorece</b>' : r.v < -0.25 ? '<b class="mal">te es adverso</b>' : 'equilibrado'}</div>`;
      m.cuerpo.innerHTML = `${barra()}${hist()}<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>${esc(r.titulo)}</h3><span class="etq">${st.i + 1}/${st.rondas.length}</span></div><p style="margin:4px 0 8px;font-size:14px">${esc(r.q)}</p>${ventaja}<div class="lista">${Object.keys(Db.TONOS).map(k => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:190px;white-space:normal"><b>${Db.TONOS[k][0]} ${Db.TONOS[k][1]}</b><div class="tenue" style="font-size:11.5px">${esc(Db.TONOS[k][2])}</div></div><button class="btn chico" data-t="${k}">Responder</button></div>`).join('')}</div></div>`;
      UI.$$('[data-t]', m.cuerpo).forEach(b => b.onclick = () => { Db.ronda(E, st, b.dataset.t); pinta(); });
    };
    const final = () => {
      const r = Db.fin(E, st, camp), nombres = r.orden.map(k => `${Ca.lideres(E, camp, k) ? esc(Ca.lideres(E, camp, k).n) : esc(E.partidos[k].sigla)} (${esc(E.partidos[k].sigla)})`);
      m.cuerpo.innerHTML = `${barra()}${hist()}<div class="nota" style="border-left:3px solid ${r.pos <= 1 ? 'var(--si,#3bb273)' : 'var(--no,#d9534f)'}"><b>${r.pos === 0 ? '🏆 Ganas el debate' : r.pos === 1 ? '👏 Buen debate' : '😬 Debate decepcionante'}</b><div style="margin-top:4px;font-size:13px">Rondas ganadas: ${r.gan} de ${r.n}. Clasificación: ${nombres.map((n, i) => `${i + 1}º ${n}`).join(' · ')}</div></div><div class="fila" style="margin-top:10px;justify-content:flex-end"><button class="btn prim" id="db-ok">Continuar</button></div>`;
      UI.$('#db-ok', m.cuerpo).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    };
    pinta();
  };
})(window.ESP);

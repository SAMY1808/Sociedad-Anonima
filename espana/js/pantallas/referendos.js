/* Referendos y consultas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.referendos = {
    render(el) {
      const E = C.E, Rf = C.Referendos, s = Rf.asegurar(E), J = E.jugador;
      const act = s.act.filter(x => x.estado === 'campana'), tn = Object.keys(Rf.TEMAS);
      el.innerHTML = `<div class="cab"><div><h1>🗳️ Referendos y consultas</h1><div class="sub">Consultas nacionales, autonómicas y municipales</div></div></div>
        <div class="tarjeta"><div class="t-cab"><h3>En campaña</h3><span class="etq oro">${act.length}</span></div><div class="lista">${act.map(r => { const T = Rf.TEMAS[r.tema], op = Math.round(Rf.opinion(E, r.tema, r.c) * 100); return `<div class="it" style="flex-direction:column;align-items:stretch"><div class="fila" style="gap:8px;flex-wrap:wrap"><span style="font-size:20px">${T.ic}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal">${esc(T.q)}</b><div class="tenue" style="font-size:11.5px">${r.c ? esc(r.ambito === 'ccaa' ? D().ccaa[r.c].nombre : E.esp.muni.m[r.c].nombre) + ' · ' : ''}votación en ${Math.max(0, Math.round(r.tVoto - E.fecha.t))} semanas${r.unilateral ? ' · <b style="color:var(--no)">unilateral</b>' : ''}</div></div><span class="etq">Opinión: ${op} % sí</span></div>
          <div class="fila" style="gap:8px;margin-top:6px"><div class="barra-h" style="height:8px;flex:1"><i style="width:${op}%;background:var(--si)"></i></div></div>
          <div class="fila" style="gap:6px;margin-top:8px;flex-wrap:wrap">${UI.botonAccion('campana_referendo', { id: r.id, lado: 'si' }, '👍 Campaña por el sí (' + U.d1(r.camp.si) + ')', 'chico')}${UI.botonAccion('campana_referendo', { id: r.id, lado: 'no' }, '👎 Campaña por el no (' + U.d1(r.camp.no) + ')', 'chico')}</div></div>`; }).join('') || '<div class="vacio" style="padding:10px">Ninguna consulta en campaña.</div>'}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Convocar una consulta</h3></div><div class="lista">${tn.map(k => { const T = Rf.TEMAS[k], p = Rf.puedeProponer(E, k); const c = T.amb === 'ccaa' ? J.region : T.amb === 'muni' ? J.muni : null; return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${T.ic}</span><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal">${esc(T.n)}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(T.desc)}${p === true ? ' · opinión pública: ' + Math.round(Rf.opinion(E, k, c) * 100) + ' % sí' : ''}</div></div>${UI.botonAccion('proponer_referendo', { tema: k }, '🗳️ Convocar', 'chico')}</div>`; }).join('')}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>Historial</h3></div><div class="lista">${s.hist.slice(0, 10).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no se ha celebrado ninguna consulta.</div>'}</div></div>`;
    }
  };
})(window.ESP);

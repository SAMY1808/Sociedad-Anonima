/* Mi carrera: atributos, ideología, escalera de cargos y bitácora. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const ESCALERA = ['activista', 'diputado', 'ministro', 'pm', 'mep', 'comisario', 'presCE', 'presCom'];

  C.Pantallas.personaje = {
    render(el) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais], pa = E.partidos[J.partido];
      const leyes = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && p.etapa === 'sancionada').length;
      const votos = E.votaciones.filter(v => v.miVoto).length;
      const anios = (E.fecha.t / 52).toFixed(1);
      const nivel = D().cargos[J.cargo].nivel;
      const puntos = C.Personaje.puntuacion(E);
      const atrib = Object.entries(J.atrib).map(([k, v]) => ({ etq: k[0].toUpperCase() + k.slice(1), v: v * 10 }));
      const pts = [{ x: pa.eco, y: pa.soc, r: 10, color: pa.color, etq: pa.sigla, op: .6, tt: '<b>' + esc(pa.nombre) + '</b>' }, { x: J.eco, y: J.soc, r: 6, color: '#fff', etq: 'Tú', tt: '<b>Tu posición</b>' }];
      el.innerHTML = `<div class="cab"><div><h1>${esc(J.nombre)}</h1><div class="sub">${esc(C.Personaje.cargoTxt(E))} · ${J.edad} años · ${d.bandera} ${esc(d.nombre)} · ${Comp.partido(E, J.partido, true)}</div></div><div class="kpi" style="text-align:right"><span class="v">${puntos}</span><span class="l">Puntos de carrera</span></div></div>
        <div class="grid g3"><div class="tarjeta"><h3>Atributos</h3>${G.radar(atrib, { tam: 250 })}</div>
          <div class="tarjeta"><h3>Posición ideológica</h3>${G.plano(pts, { tam: 280 })}<div class="tenue" style="font-size:12.5px;margin-top:4px">${Comp.ideoTxt(J)}</div></div>
          <div class="tarjeta"><h3>Capital político</h3>${[['Prestigio interno', J.prestigio, 'var(--oro)'], ['Popularidad', J.pop, '#6CC4F5'], ['Capital europeo', J.capEU, '#5E8DF0']].map(([n, v, c]) => `<div style="margin-bottom:10px"><div class="fila" style="justify-content:space-between"><span>${n}</span><b class="num">${Math.round(v)}/100</b></div>${Comp.barraRango(v, c)}</div>`).join('')}
            <div class="lista" style="margin-top:10px;font-size:13px"><div class="it"><span class="tenue" style="width:150px">Años en la partida</span><b>${anios}</b></div><div class="it"><span class="tenue" style="width:150px">Leyes propias aprobadas</span><b>${leyes}</b></div><div class="it"><span class="tenue" style="width:150px">Votaciones emitidas</span><b>${votos}</b></div><div class="it"><span class="tenue" style="width:150px">Posición en el partido</span><b>${esc(D().rolesPartido[J.rol].nombre)}</b></div></div></div></div>
        <div class="tarjeta" style="margin-top:14px"><h3>Escalera de cargos</h3><div class="logros">${ESCALERA.map(k => `<div class="logro ${J.hitos[k] !== undefined || J.cargo === k ? 'on' : ''}">${D().cargos[k].icono} ${esc(D().cargos[k].nombre)}${J.cargo === k ? ' ← estás aquí' : J.hitos[k] !== undefined ? ' · ' + U.fmtT(J.hitos[k], true) : ''}</div>`).join('')}</div>
          <p class="tenue" style="font-size:12.5px;margin:8px 0 0">Pistas: para ser ministro necesitas prestigio ≥ 42 en un partido de Gobierno; para liderar, gana el congreso del partido; para Bruselas, acumula capital europeo (≥ 38 para comisario, ≥ 68 y prestigio ≥ 78 para presidir la Comisión).</p></div>
        <div class="tarjeta" style="margin-top:14px"><h3>Bitácora</h3><div class="lista" style="font-size:13px">${J.historial.map(h => `<div class="it"><span class="tenue" style="width:96px">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('') || '<div class="vacio">Sin entradas.</div>'}</div></div>`;
    }
  };
})(window.EUROPA);

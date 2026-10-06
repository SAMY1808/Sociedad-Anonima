/* Conferencia de Presidentes (pestaña de Cortes). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const VT = { si: ['A favor', 'verde'], abs: ['Abstención', 'amar'], no: ['En contra', 'rojo'] };
  C.Pantallas.conferencia = {
    cuerpo(E) {
      const Cf = C.Conferencia, cf = Cf.asegurar(E), a = cf.abierta, J = E.jugador, pm = E.paises.ES.gob.pm === 'J', pres = J.cargo === 'presauto';
      let h = '';
      if (a) {
        const v = Object.values(a.votos), si = v.filter(x => x === 'si').length, no = v.filter(x => x === 'no').length;
        h += `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>${Cf.TEMAS[a.tema][1]} ${esc(Cf.TEMAS[a.tema][0])}</h3><span class="etq oro">${si} a favor · ${no} en contra</span></div><div class="tenue" style="font-size:12.5px;margin-bottom:8px">${esc(Cf.TEMAS[a.tema][2])} Se cierra en ${Math.max(0, 3 - Math.round(E.fecha.t - a.t))} semanas.</div>
          <div class="lista">${Object.keys(a.votos).map(c => `<div class="it" style="flex-wrap:wrap"><b style="min-width:130px">${esc(D().ccaa[c].nombre)}</b>${Comp.partido(E, E.esp.ccaa[c].gob.partido)}<span class="etq ${VT[a.votos[c]][1]}" style="margin-left:auto">${VT[a.votos[c]][0]}</span>${pm && a.votos[c] !== 'si' ? UI.botonAccion('persuadir_comunidad', { c }, '🤝', 'chico') : ''}</div>`).join('')}</div>
          <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px">${pm ? UI.botonAccion('cerrar_conferencia', {}, '✅ Cerrar y votar', 'chico prim') : ''}${pres ? ['si', 'abs', 'no'].map(x => UI.botonAccion('votar_conferencia', { voto: x }, VT[x][0], 'chico')).join('') : ''}</div></div>`;
      } else h += `<div class="tarjeta"><div class="t-cab"><h3>🏛 Conferencia de Presidentes</h3></div><div class="tenue" style="font-size:12.5px;margin-bottom:8px">No hay ninguna conferencia en marcha${pm ? '. Como presidente del Gobierno puedes convocarla:' : '. La convoca el presidente del Gobierno; si presides una comunidad votarás tu postura.'}</div>${pm ? `<div class="lista">${Object.keys(Cf.TEMAS).map(k => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${Cf.TEMAS[k][1]}</span><div class="cuerpo" style="flex:1;min-width:190px"><b>${esc(Cf.TEMAS[k][0])}</b><div class="tenue" style="font-size:11px;white-space:normal">${esc(Cf.TEMAS[k][2])}</div></div>${UI.botonAccion('convocar_conferencia', { tema: k }, 'Convocar', 'chico')}</div>`).join('')}</div>` : ''}</div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Conferencias anteriores</h3></div><div class="lista">${cf.hist.map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1"><b style="font-weight:500">${esc(Cf.TEMAS[x.tema][0])}</b></div><span class="etq ${x.ok ? 'verde' : 'rojo'}">${x.ok ? 'Acuerdo' : 'Sin acuerdo'} ${x.si}–${x.no}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Todavía no se ha reunido.</div>'}</div></div>`;
      return h;
    }
  };
})(window.ESP);

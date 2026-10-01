/* Parlamento nacional: hemiciclo, grupos, diputados y votaciones recientes. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};

  C.Pantallas.parlamento = {
    render(el, params) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais];
      const tab = (params && params.tab) || E.ui.tabParl || 'hemiciclo';
      E.ui.tabParl = tab;
      const modo = E.ui.modoHemi || 'partido';
      const total = E.parl.miembros.length, maj = Math.floor(total / 2) + 1;
      const g = P.gob;
      const sg = U.suma(g.coalicion.map(k => P.escanos[k] || 0)), sa = U.suma((g.apoyoExterno || []).map(k => P.escanos[k] || 0));
      let cuerpo = '';
      if (tab === 'hemiciclo') {
        const cnt = P.escanos;
        cuerpo = `<div class="grid g-dash"><div class="tarjeta"><div class="t-cab"><h3>${esc(d.cam)}</h3><div class="seg">${[['partido', 'Partidos'], ['postura', 'Gobierno/oposición'], ['ideologia', 'Ideología']].map(([k, n]) => `<button data-modo="${k}" class="${modo === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>
          ${H.parlamento(E, { modo, mayoria: maj, centroSub: 'ESCAÑOS · MAYORÍA ' + maj })}
          ${modo === 'partido' ? H.leyendaPartidos(E, cnt) : modo === 'postura' ? '<div class="leyenda"><span><i style="background:#E0B54A"></i>Gobierno</span><span><i style="background:#C8A860"></i>Apoyo externo</span><span><i style="background:#5E8DF0"></i>Oposición</span></div>' : '<div class="leyenda"><span><i style="background:#C0504D"></i>Izquierda</span><span><i style="background:#7D8799"></i>Centro</span><span><i style="background:#4A7BE0"></i>Derecha</span></div>'}</div>
          <div class="col"><div class="tarjeta"><h3>Mayorías</h3>${G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyo externo', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: total - sg - sa, color: '#5E8DF0' }], { total, mayoria: maj, alto: 22 })}
            <div class="lista" style="margin-top:10px;font-size:13px"><div class="it"><span class="tenue" style="width:140px">Gobierno</span><b>${sg} escaños</b></div><div class="it"><span class="tenue" style="width:140px">Mayoría absoluta</span><b>${maj}</b></div><div class="it"><span class="tenue" style="width:140px">Tipo</span><b>${({ mono: 'Un solo partido', mayoria: 'Coalición mayoritaria', minoria: 'Gobierno en minoría' })[g.tipo]}</b></div><div class="it"><span class="tenue" style="width:140px">Estabilidad</span><b class="${g.estab > 60 ? 'bien' : g.estab > 35 ? 'alerta' : 'mal'}">${Math.round(g.estab)} %</b></div></div></div>
          <div class="tarjeta"><h3>Tu escaño</h3>${C.Personaje.enParlamento(E) ? `<div class="fila">${Comp.avatar(E, E.politicos.J, 40)}<div><b>${esc(J.nombre)}</b><div class="tenue" style="font-size:12.5px">${Comp.partido(E, J.partido, true)} · ${esc(D().rolesPartido[J.rol].nombre)}</div></div></div>` : `<div class="vacio" style="padding:8px">No tienes escaño. ${J.cargo === 'activista' ? 'Gana uno en las próximas elecciones.' : ''}</div>`}</div></div></div>`;
      } else if (tab === 'grupos') {
        const ult = P.elec.ultima;
        cuerpo = `<div class="tarjeta"><table class="tabla"><thead><tr><th>Grupo</th><th class="num">Escaños</th><th class="num">% voto</th><th>Posición</th><th>Cohesión</th><th>Líder</th></tr></thead><tbody>${P.partidos.slice().sort((a, b) => (P.escanos[b] || 0) - (P.escanos[a] || 0) || E.partidos[b].pop - E.partidos[a].pop).map(k => { const p = E.partidos[k]; return `<tr><td>${Comp.partido(E, k, true)}</td><td class="num"><b>${P.escanos[k] || 0}</b></td><td class="num">${U.d1(ult && ult.votos[k] != null ? ult.votos[k] : p.pop)}</td><td>${Comp.postura(p.postura)}</td><td style="width:120px">${Comp.barraRango(p.cohesion, p.cohesion > 65 ? 'var(--bien)' : 'var(--alerta)')}</td><td>${esc((E.politicos[p.lider] || {}).n || '—')}</td></tr>`; }).join('')}</tbody></table></div>`;
      } else if (tab === 'diputados') {
        const f = E.ui.filtroDip || '';
        const lista = E.parl.miembros.map(i => E.politicos[i]).filter(m => m && m.id !== 'J' && (!f || m.p === f)).sort((a, b) => b.rel - a.rel || b.a - a.a).slice(0, 70);
        cuerpo = `<div class="fila" style="margin-bottom:10px"><select id="p-filtro"><option value="">Todos los grupos</option>${P.partidos.filter(k => P.escanos[k]).map(k => `<option value="${k}" ${f === k ? 'selected' : ''}>${esc(E.partidos[k].sigla)} (${P.escanos[k]})</option>`).join('')}</select><span class="tenue" style="font-size:12px">Se muestran los 70 con mejor relación contigo.</span></div>
          <div class="tarjeta"><table class="tabla"><thead><tr><th>Diputado/a</th><th>Grupo</th><th>Perfil</th><th class="num">Disc.</th><th class="num">Relación</th></tr></thead><tbody>${lista.map(m => `<tr data-pol="${m.id}"><td><span class="fila" style="gap:8px">${Comp.avatar(E, m, 26)}${esc(m.n)}</span></td><td>${Comp.partido(E, m.p)}</td><td class="tenue" style="font-size:12px">${Comp.ideoTxt(m)}</td><td class="num">${m.d}</td><td class="num ${m.rel > 5 ? 'bien' : m.rel < -5 ? 'mal' : ''}">${U.signo(m.rel, 0)}</td></tr>`).join('')}</tbody></table></div>`;
      } else {
        cuerpo = `<div class="tarjeta">${E.votaciones.length ? `<div class="lista">${E.votaciones.slice(0, 25).map(v => { const p = E.proyectos[v.proy]; return `<div class="it clic" data-vot="${v.id}"><span style="font-size:20px">${v.ok ? '🟢' : '🔴'}</span><div class="cuerpo"><b>${esc(p ? p.t : 'Votación')}</b><span>${U.fmtT(v.t, true)} · ${v.si}–${v.no}–${v.abs} · ${v.desertores} rebeldes${v.miVoto ? ' · tu voto: ' + ({ si: 'sí', no: 'no', abs: 'abst.' })[v.miVoto] : ''}</span></div><span class="etq ${v.ok ? 'verde' : 'rojo'}">${v.ok ? 'Aprobada' : 'Rechazada'}</span></div>`; }).join('')}</div>` : '<div class="vacio">Aún no se ha votado nada.</div>'}</div>`;
      }
      el.innerHTML = `<div class="cab"><div><h1>Parlamento</h1><div class="sub">${d.bandera} ${esc(d.cam)} · ${total} escaños · ${esc(D().paises[J.pais].jefe)}: ${esc((E.politicos[g.pm] || {}).n || '—')}</div></div></div>
        <div class="tabs">${[['hemiciclo', 'Hemiciclo'], ['grupos', 'Grupos'], ['diputados', 'Diputados'], ['votaciones', 'Votaciones']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('parlamento', { tab: b.dataset.tab }));
      UI.$$('[data-modo]', el).forEach(b => b.onclick = () => { E.ui.modoHemi = b.dataset.modo; C.App.refrescar(); });
      const fl = UI.$('#p-filtro', el); if (fl) fl.onchange = () => { E.ui.filtroDip = fl.value; C.App.refrescar(); };
      UI.$$('[data-vot]', el).forEach(i => i.onclick = () => C.Pantallas.leyes.verVotacion(i.dataset.vot));
    }
  };
})(window.EUROPA);

/* Cortes Generales: Congreso, Senado, pactos de legislatura y votaciones recientes. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};

  const ESTADO = { activa: ['Legislatura en curso', 'verde'], disueltas: ['Cortes disueltas · campaña', 'amar'], constitucion: ['Constitución de las Cortes', 'amar'], consultas: ['Ronda de consultas del Rey', 'amar'], investidura: ['Debate de investidura', 'amar'] };

  C.Pantallas.cortes = {
    render(el, params) {
      const E = C.E, J = E.jugador, P = E.paises.ES, cs = E.esp.cortes, S = E.esp.senado, g = P.gob;
      const tab = (params && params.tab) || E.ui.tabCortes || 'congreso';
      E.ui.tabCortes = tab;
      const modo = E.ui.modoHemi || 'partido';
      const total = E.parl.miembros.length;
      const sg = U.suma(g.coalicion.map(k => P.escanos[k] || 0)), sa = U.suma((g.apoyoExterno || []).map(k => P.escanos[k] || 0));
      let cuerpo = '';
      if (tab === 'congreso') {
        cuerpo = `<div class="grid g-dash"><div class="tarjeta"><div class="t-cab"><h3>Congreso de los Diputados</h3><div class="seg">${[['partido', 'Partidos'], ['postura', 'Gobierno/oposición'], ['ideologia', 'Ideología']].map(([k, n]) => `<button data-modo="${k}" class="${modo === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>
          ${H.parlamento(E, { modo, mayoria: 176, centroSub: 'DIPUTADOS · MAYORÍA 176' })}
          ${modo === 'partido' ? H.leyendaPartidos(E, P.escanos) : modo === 'postura' ? '<div class="leyenda"><span><i style="background:#E0B54A"></i>Gobierno</span><span><i style="background:#C8A860"></i>Apoyo externo</span><span><i style="background:#5E8DF0"></i>Oposición</span></div>' : '<div class="leyenda"><span><i style="background:#C0504D"></i>Izquierda</span><span><i style="background:#7D8799"></i>Centro</span><span><i style="background:#4A7BE0"></i>Derecha</span></div>'}</div>
          <div class="col">
            <div class="tarjeta"><h3>Mayoría de gobierno</h3>${G.apilada([{ etq: 'Gobierno', v: sg, color: '#E0B54A' }, { etq: 'Apoyo externo', v: sa, color: '#C8A860' }, { etq: 'Oposición', v: total - sg - sa, color: '#5E8DF0' }], { total, mayoria: 176, alto: 20 })}
              <div class="tenue" style="font-size:12.5px;margin-top:6px">${sg >= 176 ? 'El Gobierno tiene mayoría absoluta por sí solo.' : sg + sa >= 176 ? 'Mayoría de 176 sólo con apoyos externos.' : `Gobierno en minoría: le faltan ${176 - sg - sa} votos para la mayoría absoluta.`} Para una ley orgánica son necesarios <b>176</b> «síes»; para reformar la Constitución, <b>210</b> (3/5).</div></div>
            <div class="tarjeta"><h3>Grupos parlamentarios</h3><table class="tabla"><thead><tr><th>Grupo</th><th class="num">Esc.</th><th>Posición</th><th class="num">Cohesión</th></tr></thead><tbody>${P.partidos.filter(k => P.escanos[k]).sort((a, b) => P.escanos[b] - P.escanos[a]).map(k => `<tr${k === J.partido ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${Comp.partido(E, k)}</td><td class="num">${P.escanos[k]}</td><td>${Comp.postura(E.partidos[k].postura)}</td><td class="num">${E.partidos[k].cohesion}</td></tr>`).join('')}</tbody></table></div></div></div>`;
      } else if (tab === 'senado') {
        const orden = H.ordenPartidos(E).filter(k => S.escanos[k]);
        const bl = orden.map(k => ({ n: S.escanos[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Elegidos</span><b>${S.elegidos[k] || 0}</b></div><div class="tt-f"><span>Designados por parlamentos</span><b>${S.designados[k] || 0}</b></div>` }));
        const mayor = orden.slice().sort((a, b) => S.escanos[b] - S.escanos[a])[0];
        cuerpo = `<div class="grid g-dash"><div class="tarjeta"><h3>Senado · ${S.total} senadores</h3>${H.bloques(bl, { altoMax: 340, mayoria: S.mayoria, centroSub: 'SENADORES · MAYORÍA ' + S.mayoria })}${H.leyendaPartidos(E, S.escanos)}</div>
          <div class="col"><div class="tarjeta"><h3>Poder del Senado</h3><p style="margin:0 0 8px;font-size:13px;color:var(--texto2)">${S.escanos[mayor] >= S.mayoria ? `<b>${esc(E.partidos[mayor].sigla)}</b> tiene mayoría absoluta en el Senado y puede <b>vetar</b> cualquier ley. El Congreso sólo puede levantar el veto con 176 votos, o por mayoría simple pasados dos meses.` : 'Nadie tiene mayoría absoluta en el Senado: no hay veto asegurado.'}</p>
            <div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:170px">Elegidos por provincia</span><b>${U.suma(Object.values(S.elegidos))}</b></div><div class="it"><span class="tenue" style="width:170px">Designados por comunidades</span><b>${U.suma(Object.values(S.designados))}</b></div><div class="it"><span class="tenue" style="width:170px">Mayoría absoluta</span><b>${S.mayoria}</b></div></div></div>
            <div class="tarjeta"><h3>Reparto</h3><table class="tabla"><thead><tr><th>Partido</th><th class="num">Elegidos</th><th class="num">Designados</th><th class="num">Total</th></tr></thead><tbody>${orden.sort((a, b) => S.escanos[b] - S.escanos[a]).map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${S.elegidos[k] || 0}</td><td class="num">${S.designados[k] || 0}</td><td class="num"><b>${S.escanos[k]}</b></td></tr>`).join('')}</tbody></table></div></div></div>`;
      } else if (tab === 'pactos') {
        const sat = E.esp.consejo.sat;
        cuerpo = `<div class="grid g2"><div class="tarjeta"><h3>Pactos de investidura y legislatura</h3>${E.esp.pactos.length ? `<div class="lista" style="font-size:13px">${E.esp.pactos.slice().reverse().map(pa => { const d = D().demandas[pa.dem]; return `<div class="it"><span style="font-size:20px">${d.icono}</span><div class="cuerpo"><b style="white-space:normal">${esc(d.nombre)}</b><span>${Comp.partido(E, pa.pid)} · plazo ${U.fmtT(pa.limite, true)}</span></div><span class="etq ${pa.estado === 'cumplida' ? 'verde' : pa.estado === 'incumplida' ? 'rojo' : 'amar'}">${pa.estado === 'cumplida' ? 'Cumplido' : pa.estado === 'incumplida' ? 'Incumplido' : 'Pendiente'}</span></div>`; }).join('')}</div>` : '<div class="vacio">El Gobierno no ha firmado contrapartidas.</div>'}</div>
          <div class="tarjeta"><h3>Satisfacción de los socios</h3>${Object.keys(sat).length ? G.barrasH(Object.keys(sat).map(k => ({ etq: Comp.partido(E, k), v: sat[k], color: sat[k] > 55 ? 'var(--bien)' : sat[k] > 30 ? 'var(--alerta)' : 'var(--mal)' })), { max: 100, fmt: v => Math.round(v), anchoEtq: '70px' }) : '<div class="vacio">Sin socios</div>'}
            <p class="tenue" style="font-size:12.5px;margin:8px 0 0">Si un socio queda por debajo de 15 puntos puede abandonar el Gobierno. Cumple los pactos y aprueba sus propuestas en el Consejo de Ministros.</p></div></div>`;
      } else {
        cuerpo = `<div class="tarjeta"><h3>Votaciones recientes</h3>${E.votaciones.length ? `<table class="tabla"><thead><tr><th>Fecha</th><th>Asunto</th><th class="num">Sí</th><th class="num">No</th><th class="num">Abst.</th><th>Resultado</th></tr></thead><tbody>${E.votaciones.slice(0, 25).map(v => { const p = E.proyectos[v.proy]; return `<tr class="clic" data-vot="${v.id}"><td>${U.fmtT(v.t, true)}</td><td>${esc(p ? p.t : '—')}</td><td class="num">${v.si}</td><td class="num">${v.no}</td><td class="num">${v.abs}</td><td><span class="etq ${v.ok ? 'verde' : 'rojo'}">${v.ok ? 'Aprobado' : 'Rechazado'}</span></td></tr>`; }).join('')}</tbody></table>` : '<div class="vacio">Aún no se han producido votaciones.</div>'}</div>`;
      }
      const est = ESTADO[cs.estado];
      el.innerHTML = `<div class="cab"><div><h1>🏛 Cortes Generales</h1><div class="sub">Legislatura ${cs.legislatura} · <span class="etq ${est[1]}">${est[0]}</span> · fin máximo de la legislatura: ${U.fmtT(cs.finMax)}${cs.mocion ? ' · <span class="alerta">moción de censura en trámite</span>' : ''}</div></div>
        <div class="fila">${C.Consejo.pmEsJ(E) ? UI.botonAccion('disolver_cortes', {}, '🗳 Disolver las Cortes', '') + UI.botonAccion('cuestion_confianza', {}, '🤞 Cuestión de confianza', '') : ''}${UI.botonAccion('mocion_censura', {}, '⚡ Moción de censura', '')}</div></div>
        <div class="tabs">${[['congreso', 'Congreso'], ['senado', 'Senado'], ['pactos', 'Pactos y socios'], ['votaciones', 'Votaciones']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('cortes', { tab: b.dataset.tab }));
      UI.$$('[data-modo]', el).forEach(b => b.onclick = () => { E.ui.modoHemi = b.dataset.modo; C.App.refrescar(); });
      UI.$$('[data-vot]', el).forEach(b => b.onclick = () => C.Pantallas.leyes.verVotacion(b.dataset.vot));
    }
  };
})(window.ESP);

/* Medios, redes y opinión: relación con cada medio, portadas de la semana y bulos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const PM = C.Pantallas.medios = {
    tertulias(el, E, h) {
      const Md = C.Medios, tn = Md.tendencias(E), te = Md.tertulias(E), md = Md.asegurar(E), pr = md.priv, P = E.paises.ES;
      h += `<div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>🔥 Tendencias en redes</h3></div><div class="lista">${tn.map(t => `<div class="it"><b style="min-width:130px">${esc(t.tag)}</b><div class="barra-h" style="height:8px;flex:1;margin:0 8px"><i style="width:${t.f}%;background:${t.sg > 0 ? 'var(--si)' : t.sg < 0 ? 'var(--no)' : 'var(--oro)'}"></i></div></div><div class="tenue" style="font-size:11.5px;margin:-4px 0 6px">${esc(t.txt)}</div>`).join('') || '<div class="vacio" style="padding:10px">Semana tranquila en las redes.</div>'}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>📊 Sondeo privado</h3>${UI.botonAccion('encuesta_privada', {}, 'Encargar', 'chico')}</div>${pr ? `<div class="tenue" style="font-size:11.5px;margin-bottom:6px">Realizado el ${U.fmtT(pr.t, true)}</div><table class="tabla"><tbody>${Object.keys(pr.votos).sort((a, b) => pr.votos[b] - pr.votos[a]).slice(0, 8).map(k => `<tr><td>${C.Comp.partido(E, k)}</td><td class="num">${U.d1(pr.votos[k])} %</td></tr>`).join('')}</tbody></table>` : '<div class="vacio" style="padding:10px">Encarga un sondeo para ver la intención de voto sin el sesgo del CIS.</div>'}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>🎙 Lo que se dice en las tertulias</h3></div><div class="lista">${te.map(x => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${x.ic}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="font-weight:500">${esc(x.nom)}</b> <span class="tenue" style="font-size:11px">sobre ${esc(x.tag)}</span><div style="white-space:normal;font-size:12.5px">«${esc(x.frase)}»</div></div><span class="etq ${x.tono > 0.4 ? 'verde' : x.tono < -0.3 ? 'rojo' : ''}">${x.tono > 0.4 ? 'a favor' : x.tono < -0.3 ? 'en contra' : 'neutral'}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Sin tertulias.</div>'}</div></div>`;
      el.innerHTML = h; UI.$$('[data-tmed]', el).forEach(b => b.onclick = () => { E.ui.tabMed = b.dataset.tmed; C.App.refrescar(); });
    },
    render(el) {
      const E = C.E, Md = C.Medios, md = Md.asegurar(E), J = E.jugador, pa = E.partidos[J.partido];
      const rivales = E.paises.ES.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac').sort((a, b) => (E.paises.ES.escanos[b] || 0) - (E.paises.ES.escanos[a] || 0)).slice(0, 4);
      const bulos = Md.bulosJ(E), tn = Math.round(md.tono);
      const tab = E.ui.tabMed || 'prensa';
      let h = `<div class="cab"><div><h1>📰 Medios y opinión</h1><div class="sub">Cómo te trata la prensa, qué dicen las portadas y qué bulos circulan</div></div></div><div class="tabs" style="margin-bottom:12px">${[['prensa', '📰 Prensa'], ['tertulias', '🎙 Tertulias y tendencias']].map(([k, n]) => `<button data-tmed="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      if (tab === 'tertulias') return PM.tertulias(el, E, h);
      h += `<div class="tarjeta"><div class="t-cab"><h3>🎤 Tu estrategia de comunicación</h3><span class="etq ${tn > 3 ? 'verde' : tn < -3 ? 'rojo' : ''}">Tono general ${tn > 0 ? '+' : ''}${tn}</span></div>
        <div class="fila" style="gap:6px;flex-wrap:wrap">${UI.botonAccion('rueda_prensa', {}, '🎤 Rueda de prensa', 'chico prim')}</div></div>`;
      if (bulos.length) h += `<div class="tarjeta" style="border-color:var(--no)"><div class="t-cab"><h3>🧨 Bulos contra tu partido</h3><span class="etq rojo">${bulos.length}</span></div><div class="lista">${bulos.map(b => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px"><b style="white-space:normal;font-weight:500">${esc(b.txt)}</b><div class="tenue" style="font-size:11px">Virulencia ${Math.round(b.fuerza * 100)} %</div></div>${UI.botonAccion('desmentir_bulo', { id: b.id }, '🛡️ Desmentir', 'chico')}</div>`).join('')}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Relación con cada medio</h3></div><div class="lista">${Md.MEDIOS.map(m => { const r = Math.round(md.rel[m.id]), c = r > 15 ? 'var(--si)' : r < -15 ? 'var(--no)' : 'var(--oro)';
        return `<div class="it" style="flex-wrap:wrap"><span style="font-size:20px">${m.ic}</span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(m.n)}</b><div class="tenue" style="font-size:11px">${m.tipo} · alcance ${'●'.repeat(m.alc)}</div></div>
          <div style="width:110px"><div class="barra-h" style="height:8px"><i style="width:${(r + 80) / 160 * 100}%;background:${c}"></i></div><div style="font-size:11px;text-align:right;color:${c}">${r > 0 ? '+' : ''}${r}</div></div>
          ${UI.botonAccion('entrevista_medio', { medio: m.id }, '🎙️', 'chico')}</div>`; }).join('')}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>🕵️ Filtrar información a un medio afín</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Sólo funciona con medios que confían en ti (relación 15+). Si se descubre, pagas el precio.</div>
        ${rivales.map(k => `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:6px"><b style="min-width:70px;color:${E.partidos[k].color}">${esc(E.partidos[k].sigla)}</b>${Md.MEDIOS.filter(m => md.rel[m.id] >= 15).slice(0, 4).map(m => UI.botonAccion('filtrar_medio', { medio: m.id, pid: k }, m.ic + ' ' + esc(m.n.split(' ').slice(-1)[0]), 'chico')).join('') || '<span class="tenue" style="font-size:12px">Ningún medio te es afín todavía.</span>'}</div>`).join('')}</div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>🗞 Portadas recientes</h3></div><div class="lista">${md.portadas.slice(0, 15).map(p => `<div class="it"><span class="etq ${p.tono > 0.2 ? 'verde' : p.tono < -0.2 ? 'rojo' : ''}" style="min-width:48px;justify-content:center">${U.fmtT(p.t, true)}</span><div class="cuerpo" style="flex:1"><div style="white-space:normal;font-size:12.5px">${esc(p.titular)}</div></div></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no hay portadas.</div>'}</div></div>`;
      el.innerHTML = h; UI.$$('[data-tmed]', el).forEach(b => b.onclick = () => { E.ui.tabMed = b.dataset.tmed; C.App.refrescar(); });
    }
  };
})(window.ESP);

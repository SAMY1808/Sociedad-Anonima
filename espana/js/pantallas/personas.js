/* Políticos: fichas con biografía, fichajes y escisiones, expresidentes. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const TABS = [['fichas', '🧑‍💼 Fichas'], ['fichajes', '🧲 Fichajes y escisiones'], ['expres', '🕰 Expresidentes']];
  const PS = C.Pantallas.personas = {
    ficha(id) {
      const E = C.E, Pe = C.Personas, p = E.politicos[id]; if (!p) return; const b = Pe.bio(E, id), nom = x => x && E.politicos[x] ? E.politicos[x].n : '—';
      const cuerpo = `<div class="tenue" style="font-size:12.5px">${esc(Pe.cargoTxt(E, id))} · ${Comp.partido(E, p.p)}</div><p style="margin:8px 0;font-size:14px;line-height:1.55">${esc(b.edad)} años. Antes de la política fue ${esc(b.prof)}; después fue ${esc(b.hito)}, con ${b.anos} años de vida pública.</p>
        <div class="chips" style="margin-bottom:8px">${Pe.rasgos(p).map(r => `<span class="etq">${esc(r)}</span>`).join('')}</div>
        <div class="lista"><div class="it"><span>🤝</span><div class="cuerpo" style="flex:1"><b>Aliado/a</b> · ${esc(nom(b.ami))}</div></div><div class="it"><span>⚔️</span><div class="cuerpo" style="flex:1"><b>Enemistado/a con</b> · ${esc(nom(b.ene))}</div></div>
        <div class="it"><span>🗂</span><div class="cuerpo" style="flex:1;white-space:normal"><b>Pasado</b> · ${b.pasado ? esc(b.pasado) + (b.resurgido ? ' (ya ha salido a la luz)' : ' (aún no ha salido a la luz)') : 'Sin sombras conocidas.'}</div></div></div>
        <div class="grid g2" style="margin-top:10px;font-size:12.5px;gap:6px"><div>Ambición <b>${p.a}</b></div><div>Carisma <b>${p.c}</b></div><div>Integridad <b>${p.i}</b></div><div>Disciplina <b>${p.d}</b></div></div>`;
      UI.modal({ titulo: p.n, icono: '🧑‍💼', cuerpo, clase: 'medio' });
    },
    render(el) {
      const E = C.E, Pe = C.Personas, pe = Pe.asegurar(E), J = E.jugador, P = E.paises.ES, tab = E.ui.tabPers || 'fichas'; const filtro = E.ui.persF || 'todos';
      let h = `<div class="cab"><div><h1>🧑‍💼 Políticos</h1><div class="sub">Quién es quién: biografías, lealtades, fichajes y tránsfugas</div></div></div><div class="tabs" style="margin-bottom:12px">${TABS.map(([k, n]) => `<button data-tp="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
      if (tab === 'fichas') {
        const g = P.gob; let ids = Pe.relevantes(E); if (filtro === 'gobierno') ids = ids.filter(i => i === g.pm || Object.values(g.ministros).includes(i)); else if (filtro === 'lideres') ids = ids.filter(i => P.partidos.some(k => E.partidos[k].lider === i)); else if (filtro === 'regiones') ids = ids.filter(i => C.Territorio.ids().some(c => E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.pres === i));
        h += `<div class="seg" style="margin-bottom:10px">${[['todos', 'Todos'], ['gobierno', 'Gobierno'], ['lideres', 'Líderes'], ['regiones', 'Presidentes autonómicos']].map(([k, n]) => `<button data-pf="${k}" class="${filtro === k ? 'activo' : ''}">${n}</button>`).join('')}</div>
          <div class="tarjeta"><div class="lista">${ids.map(i => { const p = E.politicos[i]; return `<div class="it clic" data-ficha="${i}" style="cursor:pointer"><div class="cuerpo" style="flex:1"><b>${esc(p.n)}</b><div class="tenue" style="font-size:11.5px">${esc(Pe.cargoTxt(E, i))}</div></div>${Comp.partido(E, p.p)}</div>`; }).join('')}</div></div>`;
      } else if (tab === 'fichajes') {
        const cand = E.parl.miembros.filter(id => E.politicos[id] && E.politicos[id].p !== J.partido && id !== 'J').sort((a, b) => E.politicos[a].d - E.politicos[b].d).slice(0, 10);
        h += `<div class="tarjeta"><div class="t-cab"><h3>Fichajes posibles</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Los diputados menos disciplinados son los más fáciles de captar. Necesitas peso en la dirección de tu partido.</div><div class="lista">${cand.map(i => { const p = E.politicos[i]; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:170px"><b>${esc(p.n)}</b><div class="tenue" style="font-size:11px">Disciplina ${p.d} · ambición ${p.a}</div></div>${Comp.partido(E, p.p)}${UI.botonAccion('fichar_diputado', { id: i }, '🧲 Fichar', 'chico')}</div>`; }).join('')}</div></div>
          <div class="tarjeta"><h3>Movimientos recientes</h3><div class="lista">${pe.hist.slice(0, 12).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(x.txt)}</div></div>`).join('') || '<div class="vacio" style="padding:10px">Ningún tránsfuga ni escisión por ahora.</div>'}</div></div>`;
      } else {
        h += `<div class="tarjeta"><div class="t-cab"><h3>Expresidentes de partido</h3></div><div class="tenue" style="font-size:12px;margin-bottom:8px">Los líderes salientes siguen opinando: pueden apuntalar o torpedear a la dirección.</div><div class="lista">${Object.keys(pe.exlider).map(k => { const x = pe.exlider[k], p = E.politicos[x.id]; return p ? `<div class="it clic" data-ficha="${x.id}" style="cursor:pointer"><div class="cuerpo" style="flex:1"><b>${esc(p.n)}</b><div class="tenue" style="font-size:11px">Dejó el liderazgo hace ${Math.round((E.fecha.t - x.t) / 52 * 10) / 10} años</div></div>${Comp.partido(E, k)}</div>` : ''; }).join('') || '<div class="vacio" style="padding:10px">Aún no ha cambiado ningún liderazgo.</div>'}</div></div>`;
      }
      el.innerHTML = h;
      UI.$$('[data-tp]', el).forEach(b => b.onclick = () => { E.ui.tabPers = b.dataset.tp; C.App.refrescar(); });
      UI.$$('[data-pf]', el).forEach(b => b.onclick = () => { E.ui.persF = b.dataset.pf; C.App.refrescar(); });
      UI.$$('[data-ficha]', el).forEach(b => b.onclick = () => PS.ficha(b.dataset.ficha));
    }
  };
})(window.ESP);

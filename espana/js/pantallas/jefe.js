/* Jefe de gabinete: nombramiento, reparto de áreas (manual / asesor / delegado), propuestas y registro de decisiones. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const MODOS = [['manual', '✋ Yo'], ['asesor', '💡 Asesor'], ['delegado', '⚙️ Delegado']];
  const barra = (v, c) => `<div class="barra-h" style="height:6px;width:80px;display:inline-block;vertical-align:middle"><i style="width:${v * 10}%;background:${c || 'var(--oro)'}"></i></div>`;

  C.Pantallas.jefe = {
    render(el) {
      const E = C.E, Jf = C.Jefe, j = Jf.asegurar(E), puede = Jf.puede(E);
      let h = `<div class="cab"><div><h1>🧑‍💼 Jefe de gabinete</h1><div class="sub">Tu mano derecha: lleva áreas enteras del juego para que no tengas que hacerlo todo tú</div></div></div>`;
      if (!j.jefe) {
        h += `<div class="nota">${puede === true ? 'No tienes jefe/a de gabinete. Elige a una persona de confianza: podrá <b>asesorarte</b> (te propone decisiones) o <b>decidir por ti</b> en las áreas que le delegues.' : '🔒 ' + esc(puede)}</div>`;
        if (puede === true) {
          const cand = j.cand.length ? j.cand : [];
          h += `<div class="fila" style="margin:10px 0"><button class="btn prim" id="jf-buscar">🔎 ${cand.length ? 'Buscar otros candidatos' : 'Buscar candidatos'}</button></div>`;
          h += `<div class="cuadricula-2">${cand.map(c => { const p = Jf.PERFILES[c.perfil]; return `<div class="tarjeta"><div class="t-cab"><h3>${p[1]} ${esc(c.n)}</h3><span class="etq oro">${p[0]}</span></div><div class="tenue" style="font-size:12px;margin-bottom:6px">${esc(p[2])}</div>
            <div style="font-size:12.5px;line-height:1.9">Gestión ${barra(c.gestion)} ${c.gestion}<br>Lealtad ${barra(c.lealtad)} ${c.lealtad}<br>Discreción ${barra(c.discrecion)} ${c.discrecion}<br>Ambición ${barra(c.ambicion, 'var(--no)')} ${c.ambicion}</div>
            <button class="btn prim chico" data-nombrar="${c.id}" style="margin-top:8px">Nombrar</button></div>`; }).join('')}</div>`;
        }
        el.innerHTML = h; return Jf_enlazar(el);
      }
      const jf = j.jefe, p = Jf.PERFILES[jf.perfil];
      h += `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>${p[1]} ${esc(jf.n)}</h3><span class="etq oro">${p[0]}</span></div>
        <div style="font-size:12.5px;line-height:1.9">Gestión ${barra(jf.gestion)} ${jf.gestion} · Lealtad ${barra(jf.lealtad)} ${jf.lealtad} · Discreción ${barra(jf.discrecion)} ${jf.discrecion} · Ambición ${barra(jf.ambicion, 'var(--no)')} ${jf.ambicion}</div>
        <div class="tenue" style="font-size:12px;margin-top:6px">Gasta hasta <b>${Jf.capacidad(E)}</b> puntos de agenda propios por semana (sus acciones rinden un 80 % de las tuyas). Una persona ambiciosa o poco leal puede acabar filtrando o marchándose.</div>
        <div class="fila" style="margin-top:8px;gap:6px"><button class="btn chico" id="jf-todo-d">⚙️ Delegar todo</button><button class="btn chico" id="jf-todo-a">💡 Todo asesor</button><button class="btn chico" id="jf-todo-m">✋ Todo yo</button><button class="btn chico" id="jf-cesar" style="margin-left:auto">Cesar</button></div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Reparto de áreas</h3></div><div class="lista">${Object.keys(Jf.AREAS).map(a => { const A = Jf.AREAS[a], m = Jf.modo(E, a);
        return `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${A[0]}</span><div class="cuerpo" style="flex:1;min-width:200px"><b>${esc(A[1])}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(A[2])}</div></div>
        <div class="seg">${MODOS.map(([k, n]) => `<button data-area="${a}" data-modo="${k}" class="${m === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>`; }).join('')}</div></div>`;
      if (j.prop.length) h += `<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>💡 Propuestas de tu jefe/a</h3><span class="etq oro">${j.prop.length}</span></div><div class="lista">${j.prop.map(x => `<div class="it" style="flex-wrap:wrap"><span>${Jf.AREAS[x.area][0]}</span><div class="cuerpo" style="flex:1;min-width:190px"><b style="white-space:normal;font-weight:500">${esc(x.txt)}</b></div><button class="btn chico prim" data-aprobar="${x.id}">${x.accion ? 'Aprobar' : 'Enterado'}</button><button class="btn chico" data-descartar="${x.id}">✕</button></div>`).join('')}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>📓 Decisiones tomadas por tu equipo</h3></div><div class="lista">${j.log.slice(0, 25).map(l => `<div class="it"><span>${Jf.AREAS[l.area] ? Jf.AREAS[l.area][0] : '•'}</span><div class="cuerpo" style="flex:1"><span class="tenue" style="font-size:11px">${U.fmtT(l.t, true)}</span><div style="white-space:normal;font-size:12.5px">${esc(l.txt)}</div></div></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no ha tomado decisiones: delega alguna área.</div>'}</div></div>`;
      el.innerHTML = h; Jf_enlazar(el);
    }
  };
  function Jf_enlazar(el) {
    const E = C.E, Jf = C.Jefe, ref = () => C.App.refrescar();
    const b = UI.$('#jf-buscar', el); if (b) b.onclick = () => { Jf.candidatos(E); ref(); };
    UI.$$('[data-nombrar]', el).forEach(x => x.onclick = () => { const r = Jf.nombrar(E, x.dataset.nombrar); UI.toast(esc(r.msg), r.ok ? 'bien' : 'mal'); ref(); });
    UI.$$('[data-modo]', el).forEach(x => x.onclick = () => { Jf.fijar(E, x.dataset.area, x.dataset.modo); ref(); });
    const todos = (id, m) => { const x = UI.$(id, el); if (x) x.onclick = () => { Object.keys(Jf.AREAS).forEach(a => Jf.fijar(E, a, m)); ref(); }; };
    todos('#jf-todo-d', 'delegado'); todos('#jf-todo-a', 'asesor'); todos('#jf-todo-m', 'manual');
    const ce = UI.$('#jf-cesar', el); if (ce) ce.onclick = () => { const r = Jf.cesar(E); UI.toast(esc(r.msg), 'bien'); ref(); };
    UI.$$('[data-aprobar]', el).forEach(x => x.onclick = () => { const r = Jf.aprobar(E, x.dataset.aprobar); UI.toast(esc(r.msg || 'Hecho'), r.ok === false ? 'mal' : 'bien'); ref(); });
    UI.$$('[data-descartar]', el).forEach(x => x.onclick = () => { Jf.descartar(E, x.dataset.descartar); ref(); });
  }
})(window.ESP);

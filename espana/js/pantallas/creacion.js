/* Creación de carrera: dónde empiezas (local, autonómico o nacional) → partido → personaje → resumen. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const ATRIB = [['carisma', 'Carisma', 'Capta atención y simpatías'], ['oratoria', 'Oratoria', 'Discursos, debates y entrevistas'], ['gestion', 'Gestión', 'Organización y administración'], ['negociacion', 'Negociación', 'Pactos y cabildeo'], ['integridad', 'Integridad', 'Credibilidad y ética pública']];
  const NIVELES = [
    { id: 'local', icono: '🏘️', nombre: 'Política local', desc: 'Concejal/a o alcaldable de uno de los 67 grandes ayuntamientos. Camino largo: ayuntamiento → comunidad → Cortes.' },
    { id: 'autonomico', icono: '🏛️', nombre: 'Política autonómica', desc: 'Diputado/a de un parlamento regional. Negocias con Moncloa financiación, traspasos y estatutos; puedes llegar a presidente/a autonómico/a.' },
    { id: 'nacional', icono: '🇪🇸', nombre: 'Política nacional', desc: 'Diputado/a del Congreso por una circunscripción. Cortes, Consejo de Ministros, investiduras y Bruselas.' }
  ];
  let S = null, preview = null;

  const nuevoEstado = () => ({
    paso: 1, semilla: (Math.random() * 2 ** 31) | 0, nivel: 'nacional', prov: 'MAD', region: 'MAD', muni: 'm_mad', partido: 'ES_ASD',
    nuevo: { nombre: 'Movimiento Cívico', sigla: 'MCI', eco: 0, soc: -10, eu: 40, ter: 0, color: '#8E44AD', logo: '⭐', fin: 'media', implant: [] }, escenario: 'normal',
    nombre: '', genero: 'f', edad: 38, trayectoria: 'concejal', atrib: { carisma: 3, oratoria: 3, gestion: 3, negociacion: 3, integridad: 3 }, libres: 5,
    eco: null, soc: null, eu: null, ter: null, rol: 'base', nombrePartida: ''
  });

  const mundoPrevio = () => {
    if (preview && preview.semilla === S.semilla) return preview.E;
    const E = C.Mundo.nueva({ semilla: S.semilla, pais: 'ES', partido: 'ES_ASD', nivel: 'nacional', nombre: 'Previa', trayectoria: 'concejal', atrib: {}, rol: 'base' });
    preview = { semilla: S.semilla, E };
    return E;
  };
  const partidosElegibles = E => E.paises.ES.partidos.filter(k => !E.partidos[k].nuevo);
  const apoyoAqui = (E, k) => { const a = E.esp.aggReg[S.region] || {}; return a[k] || 0; };
  const provDe = id => { const m = D().municipios.find(x => x[0] === id); return m ? m[2] : S.prov; };

  const paso1 = () => {
    const E = mundoPrevio();
    const dc = D().ccaa[S.region], mun = Object.values(E.esp.muni.m).filter(m => m.ccaa === S.region);
    return `<h1>¿Dónde empieza tu carrera?</h1>
    <p class="tenue" style="margin-top:-8px">Elige el nivel y el territorio. Pulsa una provincia del mapa para elegir tu circunscripción o comunidad.</p>
    <div class="sel-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-bottom:12px">${NIVELES.map(n => `<div class="fila-sel ${S.nivel === n.id ? 'sel' : ''}" data-nivel="${n.id}" style="flex-direction:column;align-items:flex-start;gap:3px"><b>${n.icono} ${n.nombre}</b><span class="tenue" style="font-size:12.5px">${n.desc}</span></div>`).join('')}</div>
    <div class="c-dos">
      <div class="tarjeta" id="c-mapa">${C.Mosaico.provincias(E, 'voto', { region: S.region })}${C.Mosaico.leyendaEs(E, 'voto')}</div>
      <div class="tarjeta"><div class="fila" style="gap:12px"><span class="rotulo-pais">📍</span><div><h2 style="font-size:23px">${esc(dc.nombre)}</h2><div class="tenue">${esc(dc.capital)} · ${U.d1(dc.pob)} M hab. · ${esc(dc.regimen)}</div></div></div>
        <p style="margin:8px 0;font-size:13px;color:var(--texto2)">${esc(dc.rasgo)}</p>
        <div class="lista" style="font-size:13px">
          <div class="it"><span class="tenue" style="width:140px">Parlamento regional</span><b>${dc.esc} escaños · umbral ${dc.um} %</b></div>
          <div class="it"><span class="tenue" style="width:140px">Gobierno actual</span><b>${E.esp.ccaa[S.region].gob ? C.Comp.partido(E, E.esp.ccaa[S.region].gob.partido, true) : '—'}</b></div>
          <div class="it"><span class="tenue" style="width:140px">Relación con Moncloa</span><b>${Math.round(E.esp.ccaa[S.region].relM)} / 100</b></div>
          <div class="it"><span class="tenue" style="width:140px">Independentismo</span><b>${U.d1(E.esp.ccaa[S.region].indep)} %</b></div>
          ${S.nivel === 'nacional' ? `<div class="it"><span class="tenue" style="width:140px">Circunscripción</span><b>${esc(D().provincias[S.prov][0])} · ${D().provincias[S.prov][2]} diputados</b></div>` : ''}
          ${S.nivel === 'local' ? `<div class="it" style="align-items:center"><span class="tenue" style="width:140px">Ayuntamiento</span><select id="c-muni">${mun.map(m => `<option value="${m.id}" ${m.id === S.muni ? 'selected' : ''}>${esc(m.nombre)} · ${U.n(m.pob)} mil hab.</option>`).join('') || '<option>—</option>'}</select></div>` : ''}
        </div></div></div>`;
  };

  const paso2 = () => {
    const E = mundoPrevio(), lista = partidosElegibles(E);
    const nuevoSel = S.partido === 'nuevo';
    const filas = lista.map(k => {
      const p = E.partidos[k], esc_ = E.paises.ES.escanos[k] || 0, aq = apoyoAqui(E, k), g = E.paises.ES.gob.coalicion.includes(k);
      const rg = E.esp.ccaa[S.region].gob;
      const noPresente = p.amb === 'reg' && !(p.rp && p.rp[S.region]) && S.nivel !== 'nacional';
      return `<div class="fila-sel ${S.partido === k ? 'sel' : ''}" data-partido="${k}" style="${noPresente ? 'opacity:.55' : ''}"><i class="pto" style="background:${p.color};width:14px;height:14px"></i>
        <div style="flex:1;min-width:0"><b>${esc(p.nombre)}</b> <span class="tenue">· ${esc(p.sigla)}</span><div class="tenue" style="font-size:12px">${p.amb === 'reg' ? 'Partido regional (' + esc(D().ccaa[p.region].nombre) + ')' : 'Partido de ámbito estatal'} · ${esc(D().grupos[p.grupo].sigla)} en Europa${rg && rg.coalicion.includes(k) ? ' · <span class="oro">gobierna ' + esc(D().ccaa[S.region].nombre) + '</span>' : ''}</div></div>
        <div style="text-align:right"><b class="num">${U.d1(S.nivel === 'nacional' ? p.popN : aq)} %</b><div class="tenue" style="font-size:12px">${esc_} escaños${g ? ' · <span class="oro">Gobierno</span>' : ''}${noPresente ? ' · no se presenta aquí' : ''}</div></div></div>`;
    }).join('');
    const pts = lista.map(k => ({ x: E.partidos[k].eco, y: E.partidos[k].soc, r: 4 + Math.sqrt(E.partidos[k].popN || E.partidos[k].pop) * 2, color: E.partidos[k].color, etq: E.partidos[k].sigla, tt: `<b>${esc(E.partidos[k].nombre)}</b><br>${U.d1(E.partidos[k].popN)} %`, bw: S.partido === k ? 4 : 2, borde: S.partido === k ? '#FFF3C4' : '#0A111D' }));
    if (nuevoSel) pts.push({ x: S.nuevo.eco, y: S.nuevo.soc, r: 7, color: S.nuevo.color, etq: S.nuevo.sigla, borde: '#FFF3C4', bw: 4 });
    const sel = nuevoSel ? null : E.partidos[S.partido];
    const gb = E.paises.ES.gob;
    return `<h1>Elige tu partido</h1>
    <p class="tenue" style="margin-top:-8px">Gobierna ${C.Comp.partido(E, gb.partido, true)}${gb.coalicion.length > 1 ? ' con ' + gb.coalicion.filter(k => k !== gb.partido).map(k => E.partidos[k].sigla).join(', ') : ''}${gb.apoyoExterno.length ? ' y el apoyo de ' + gb.apoyoExterno.map(k => E.partidos[k].sigla).join(', ') : ''}. Todos los partidos y personas son ficticios, inspirados en la política real.</p>
    <div class="c-dos">
      <div class="col">${filas}
        <div class="fila-sel ${nuevoSel ? 'sel' : ''}" data-partido="nuevo"><span style="font-size:22px">✦</span><div style="flex:1"><b>Fundar un partido nuevo</b><div class="tenue" style="font-size:12px">Nivel difícil: empiezas con ~1,2 % de apoyo y como líder.</div></div></div>
        ${nuevoSel ? `<div class="tarjeta"><div class="campo"><label>Nombre</label><input id="n-nombre" value="${esc(S.nuevo.nombre)}" maxlength="42"></div><div class="campo"><label>Siglas</label><input id="n-sigla" value="${esc(S.nuevo.sigla)}" maxlength="6" style="max-width:120px"></div>
          ${[['eco', 'Economía (− izq / + der)'], ['soc', 'Social (− prog / + cons)'], ['eu', 'Europa (− escépt. / + fed.)'], ['ter', 'Territorial (− centralista / + soberanista)']].map(([k, t]) => `<div class="slider-fila"><span>${t}</span><input type="range" min="-100" max="100" value="${S.nuevo[k]}" data-nuevo="${k}"><span>${S.nuevo[k]}</span></div>`).join('')}
          <div class="campo"><label>Color</label><input type="color" id="n-color" value="${S.nuevo.color}" style="width:60px;padding:2px"></div>
          <div class="campo"><label>Logotipo</label><div class="seg" style="flex-wrap:wrap">${['⭐', '🌿', '🔥', '🕊️', '🦅', '⚙️', '🌊', '🛡️', '🌻', '🚀', '🏛️', '✊'].map(x => `<button data-logo="${x}" class="${S.nuevo.logo === x ? 'activo' : ''}">${x}</button>`).join('')}</div></div>
          <div class="campo"><label>Financiación y militancia</label><div class="seg">${[['austera', '🪙 Austera'], ['media', '💶 Media'], ['potente', '🏦 Potente']].map(([k, n]) => `<button data-fin="${k}" class="${S.nuevo.fin === k ? 'activo' : ''}">${n}</button>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Más recursos permiten campañas más fuertes, pero un partido nuevo con tanto dinero arranca con menos credibilidad.</div></div>
          <div class="campo"><label>Estructura territorial (dónde eres fuerte)</label><div class="seg" style="flex-wrap:wrap">${Object.keys(D().ccaa).filter(c => !['CEU', 'MEL'].includes(c)).map(c => `<button data-impl="${c}" class="${S.nuevo.implant.includes(c) ? 'activo' : ''}">${esc(D().ccaa[c].nombre)}</button>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Con implantación concentrada tienes más voto en esas comunidades y menos en el resto.</div></div></div>` : ''}</div>
      <div class="col"><div class="tarjeta"><h3>Mapa ideológico (economía / valores)</h3>${G.plano(pts, { tam: 340 })}<div class="tenue" style="font-size:11.5px;margin-top:4px">El tamaño del círculo refleja el apoyo electoral.</div></div>
        ${sel ? `<div class="tarjeta"><h3>${esc(sel.nombre)}</h3><p style="margin:0 0 6px;font-size:13px">Perfil: ${C.Comp.ideoTxt(sel)}${sel.ter != null ? ' · ' + C.Comp.terTxt(sel.ter) : ''}.</p><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:120px">Líder</span><b>${esc(E.politicos[sel.lider].n)}</b></div><div class="it"><span class="tenue" style="width:120px">Cohesión</span><b>${sel.cohesion}</b></div><div class="it"><span class="tenue" style="width:120px">Escaños</span><b>${E.paises.ES.escanos[sel.id] || 0} de 350</b></div></div>
        ${(E.paises.ES.escanos[sel.id] || 0) === 0 ? '<p class="mal" style="font-size:12.5px">No tiene escaños en el Congreso.</p>' : ''}</div>` : ''}</div></div>`;
  };

  const paso3 = () => {
    const E = mundoPrevio();
    const pa = S.partido === 'nuevo' ? { eco: S.nuevo.eco, soc: S.nuevo.soc, eu: S.nuevo.eu, ter: S.nuevo.ter, pop: 1.2 } : E.partidos[S.partido];
    if (S.eco === null) { S.eco = pa.eco; S.soc = pa.soc; S.eu = pa.eu; S.ter = pa.ter; }
    const base = D().trayectorias.find(t => t.id === S.trayectoria);
    const nuevo = S.partido === 'nuevo';
    const roles = [['base', 'Militante de base', 'Todo por demostrar: tu puesto en las listas depende de tu prestigio.'], ['direccion', 'Dirección del partido', 'Más peso interno y mejores puestos en las listas.'], ['lider', S.nivel === 'nacional' ? 'Líder del partido' : 'Líder en tu territorio', S.nivel === 'nacional' ? 'Eres el candidato/a: más puntos de agenda y presión. Si tu partido gobierna, serás presidente/a del Gobierno.' : 'Cabeza de lista y presidente/a regional del partido.']];
    return `<h1>Tu personaje</h1>
    <div class="c-dos par">
      <div class="col">
        <div class="tarjeta"><div class="fila"><div class="campo" style="flex:1;margin:0"><label>Nombre</label><input id="p-nombre" value="${esc(S.nombre)}" maxlength="40" placeholder="Nombre y apellidos"></div><button class="btn" id="p-azar" style="margin-top:18px">🎲</button></div>
          <div class="fila" style="margin-top:10px"><div class="seg" id="p-gen"><button data-g="f" class="${S.genero === 'f' ? 'activo' : ''}">Mujer</button><button data-g="m" class="${S.genero === 'm' ? 'activo' : ''}">Hombre</button></div>
          <label class="tenue" style="font-size:12px">Edad <b class="num">${S.edad}</b></label><input type="range" min="26" max="62" value="${S.edad}" id="p-edad" style="flex:1;min-width:120px"></div></div>
        <div class="tarjeta"><h3>Trayectoria</h3><div class="sel-grid" style="grid-template-columns:1fr 1fr">${D().trayectorias.map(t => `<div class="fila-sel ${S.trayectoria === t.id ? 'sel' : ''}" data-tr="${t.id}" style="flex-direction:column;align-items:flex-start;gap:2px"><b>${esc(t.nombre)}</b><span class="tenue" style="font-size:12px">${esc(t.desc)}</span></div>`).join('')}</div></div></div>
      <div class="col">
        <div class="tarjeta"><div class="t-cab"><h3>Atributos</h3><span class="etq oro">${S.libres} puntos libres</span></div>
          ${ATRIB.map(([k, n, d]) => { const b = base.atrib[k] || 0; const v = S.atrib[k] + b; return `<div class="atrib-fila"><span title="${esc(d)}">${n}</span><button class="btn chico" data-menos="${k}">−</button><div class="barra-h"><i style="width:${v * 10}%"></i></div><b class="num">${v}</b><button class="btn chico" data-mas="${k}">+</button></div>`; }).join('')}
          <div class="tenue" style="font-size:12px">La trayectoria suma bonos a algunos atributos (máximo 10).</div></div>
        <div class="tarjeta"><h3>Tu ideología</h3>
          ${[['eco', 'Economía (− izq / + der)'], ['soc', 'Social (− prog / + cons)'], ['eu', 'Europa (− escépt. / + fed.)'], ['ter', 'Territorial (− centralista / + soberanista)']].map(([k, t]) => `<div class="slider-fila"><span>${t}</span><input type="range" min="-100" max="100" value="${S[k]}" data-ideo="${k}"><span>${S[k]}</span></div>`).join('')}
          <div class="tenue" style="font-size:12px">Parte de la posición de tu partido; alejarte de ella te da perfil propio pero erosiona tu disciplina.</div></div>
        <div class="tarjeta"><h3>Posición de partida</h3><div class="col">${roles.map(([k, n, d]) => `<div class="fila-sel ${(nuevo ? 'lider' : S.rol) === k ? 'sel' : ''}" data-rol="${k}" ${nuevo && k !== 'lider' ? 'style="opacity:.4;pointer-events:none"' : ''}><div><b>${n}</b><div class="tenue" style="font-size:12px">${d}</div></div></div>`).join('')}</div></div>
      </div></div>`;
  };

  const paso4 = () => {
    const E = mundoPrevio();
    const pa = S.partido === 'nuevo' ? { nombre: S.nuevo.nombre, sigla: S.nuevo.sigla, color: S.nuevo.color } : E.partidos[S.partido];
    const tr = D().trayectorias.find(t => t.id === S.trayectoria);
    const lugar = S.nivel === 'local' ? (E.esp.muni.m[S.muni] || {}).nombre : S.nivel === 'autonomico' ? D().ccaa[S.region].nombre : D().provincias[S.prov][0];
    const rol = S.partido === 'nuevo' ? 'lider' : S.rol;
    return `<h1>Listo para empezar</h1>
    <div class="grid g2"><div class="tarjeta"><h3>Resumen</h3><div class="lista" style="font-size:14px">
      <div class="it"><span class="tenue" style="width:110px">Personaje</span><b>${esc(S.nombre || 'Sin nombre')}</b><span class="tenue">${S.genero === 'f' ? 'Mujer' : 'Hombre'} · ${S.edad} años</span></div>
      <div class="it"><span class="tenue" style="width:110px">Nivel</span><b>${NIVELES.find(n => n.id === S.nivel).icono} ${NIVELES.find(n => n.id === S.nivel).nombre} · ${esc(lugar)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Partido</span><b><i class="pto" style="background:${pa.color}"></i> ${esc(pa.nombre)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Trayectoria</span><b>${esc(tr.nombre)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Posición</span><b>${({ base: 'Militante de base', direccion: 'Dirección del partido', lider: 'Líder' })[rol]}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Ideología</span><b>${C.Comp.ideoTxt({ eco: S.eco, soc: S.soc, eu: S.eu })} · ${C.Comp.terTxt(S.ter)}</b></div></div></div>
    <div class="tarjeta"><h3>Cómo se juega</h3><ul style="margin:0;padding-left:18px;color:var(--texto2);font-size:13.5px;line-height:1.6">
      <li>Cada semana tienes <b>puntos de agenda</b> para actuar: discursos, leyes, cabildeo, partido, medios y campaña.</li>
      <li>Sube de peldaño: <b>concejal → alcalde/sa → diputado/a autonómico/a → presidente/a autonómico/a → diputado/a → ministro/a → presidente/a del Gobierno</b>… o salta a Bruselas.</li>
      <li>Las <b>generales anticipadas</b>, las investiduras con pactos, las mociones de censura y el Consejo de Ministros marcan el ritmo.</li>
      <li>Gestiona el <b>territorio</b>: estatutos, financiación, independentismo, 155, Tribunal Constitucional y municipios.</li>
      <li>No hay un final único: puedes cerrar tu carrera en el ayuntamiento o presidiendo el Gobierno.</li></ul></div></div>
    <div class="tarjeta" style="margin-top:12px"><h3>🎬 Escenario de inicio</h3><div class="lista">${C.Escenarios.LISTA.map(([k, n, d]) => `<div class="it clic" data-esc="${k}" style="cursor:pointer;${S.escenario === k ? 'background:rgba(227,192,106,.12)' : ''}"><span>${S.escenario === k ? '◉' : '○'}</span><div class="cuerpo" style="flex:1"><b>${esc(n)}</b><div class="tenue" style="font-size:11.5px;white-space:normal">${esc(d)}</div></div></div>`).join('')}</div></div>
    <div class="campo" style="max-width:360px;margin-top:12px"><label>Nombre de la partida</label><input id="r-partida" value="${esc(S.nombrePartida || (S.nombre ? S.nombre.split(' ')[0] + ' · ' + lugar : lugar))}"></div>`;
  };

  const C_ = C.Pantallas.creacion = {
    render(el) {
      if (!S) S = nuevoEstado();
      const pasos = ['Dónde', 'Partido', 'Personaje', 'Comenzar'];
      const cuerpo = [paso1, paso2, paso3, paso4][S.paso - 1]();
      el.innerHTML = `<div class="creacion"><div class="crea-cab"><div class="logo">CURUL <small>España</small></div><div class="pasos">${pasos.map((p, i) => `<span class="${S.paso === i + 1 ? 'act' : S.paso > i + 1 ? 'ok' : ''}">${i + 1}. ${p}</span>`).join('')}</div><div style="flex:1"></div><button class="btn fant" id="c-salir">✕ Salir</button></div>
        <div class="crea-cuerpo">${cuerpo}</div>
        <div class="crea-pie"><button class="btn" id="c-atras" ${S.paso === 1 ? 'disabled' : ''}>← Atrás</button><div style="flex:1"></div>
        ${S.paso < 4 ? '<button class="btn prim" id="c-sig">Siguiente →</button>' : '<button class="btn prim" id="c-ok" style="padding:10px 22px">✦ Comenzar la carrera</button>'}</div></div>`;
      C_.enlazar(el);
    },

    enlazar(el) {
      const $ = (s) => UI.$(s, el), re = () => C_.render(el);
      $('#c-salir').onclick = () => { S = null; preview = null; C.Pantallas.inicio.render(el); };
      $('#c-atras').onclick = () => { if (S.paso > 1) { S.paso--; re(); } };
      const sig = $('#c-sig'); if (sig) sig.onclick = () => {
        if (S.paso === 2) { S.eco = null; if (!S.nombre) { C.E = mundoPrevio(); S.nombre = C.Mundo.persona(S.region || 'ES', S.genero).n; } }
        S.paso++; re();
      };
      const ok = $('#c-ok'); if (ok) ok.onclick = () => C_.comenzar();
      UI.$$('[data-esc]', el).forEach(r => r.onclick = () => { S.escenario = r.dataset.esc; re(); });
      if (S.paso === 1) {
        UI.$$('[data-nivel]', el).forEach(b => b.onclick = () => { S.nivel = b.dataset.nivel; re(); });
        UI.$$('[data-prov]', el).forEach(g => g.onclick = () => {
          S.prov = g.dataset.prov; S.region = D().provincias[S.prov][1];
          const E = mundoPrevio(); const ms = Object.values(E.esp.muni.m).filter(m => m.prov === S.prov); const rm = Object.values(E.esp.muni.m).filter(m => m.ccaa === S.region);
          S.muni = (ms[0] || rm[0] || { id: S.muni }).id; re();
        });
        const sm = $('#c-muni'); if (sm) sm.onchange = e => { S.muni = e.target.value; S.prov = provDe(S.muni); re(); };
      } else if (S.paso === 2) {
        UI.$$('[data-partido]', el).forEach(f => f.onclick = () => { S.partido = f.dataset.partido; S.eco = null; if (S.partido === 'nuevo') S.rol = 'lider'; re(); });
        const nn = $('#n-nombre'); if (nn) { nn.oninput = () => S.nuevo.nombre = nn.value; $('#n-sigla').oninput = e => S.nuevo.sigla = e.target.value.toUpperCase().slice(0, 6); $('#n-color').oninput = e => { S.nuevo.color = e.target.value; }; $('#n-color').onchange = re; }
        UI.$$('[data-logo]', el).forEach(r => r.onclick = () => { S.nuevo.logo = r.dataset.logo; re(); });
        UI.$$('[data-fin]', el).forEach(r => r.onclick = () => { S.nuevo.fin = r.dataset.fin; re(); });
        UI.$$('[data-impl]', el).forEach(r => r.onclick = () => { const i = S.nuevo.implant.indexOf(r.dataset.impl); if (i >= 0) S.nuevo.implant.splice(i, 1); else if (S.nuevo.implant.length < 4) S.nuevo.implant.push(r.dataset.impl); re(); });
        UI.$$('[data-nuevo]', el).forEach(r => { r.oninput = () => { S.nuevo[r.dataset.nuevo] = +r.value; r.nextElementSibling.textContent = r.value; }; r.onchange = re; });
      } else if (S.paso === 3) {
        $('#p-nombre').oninput = e => S.nombre = e.target.value;
        $('#p-azar').onclick = () => { C.E = mundoPrevio(); S.nombre = C.Mundo.persona(S.region || 'ES', S.genero).n; re(); };
        UI.$$('#p-gen button', el).forEach(b => b.onclick = () => { S.genero = b.dataset.g; re(); });
        $('#p-edad').oninput = e => { S.edad = +e.target.value; e.target.previousElementSibling.querySelector('b').textContent = S.edad; };
        UI.$$('[data-tr]', el).forEach(f => f.onclick = () => { S.trayectoria = f.dataset.tr; re(); });
        UI.$$('[data-mas]', el).forEach(b => b.onclick = () => { const k = b.dataset.mas, base = D().trayectorias.find(t => t.id === S.trayectoria).atrib[k] || 0; if (S.libres > 0 && S.atrib[k] + base < 10) { S.atrib[k]++; S.libres--; re(); } });
        UI.$$('[data-menos]', el).forEach(b => b.onclick = () => { const k = b.dataset.menos; if (S.atrib[k] > 1) { S.atrib[k]--; S.libres++; re(); } });
        UI.$$('[data-ideo]', el).forEach(r => { r.oninput = () => { S[r.dataset.ideo] = +r.value; r.nextElementSibling.textContent = r.value; }; });
        UI.$$('[data-rol]', el).forEach(f => f.onclick = () => { S.rol = f.dataset.rol; re(); });
      } else if (S.paso === 4) {
        $('#r-partida').oninput = e => S.nombrePartida = e.target.value;
      }
    },

    comenzar() {
      const el = document.getElementById('app');
      const opts = {
        semilla: S.semilla, pais: 'ES', nivel: S.nivel, region: S.region, circ: S.nivel === 'nacional' ? S.prov : null, muni: S.nivel === 'local' ? S.muni : null,
        nombre: S.nombre || 'Alex Navarro', genero: S.genero, edad: S.edad, trayectoria: S.trayectoria, atrib: S.atrib,
        eco: S.eco, soc: S.soc, eu: S.eu, ter: S.ter, rol: S.partido === 'nuevo' ? 'lider' : S.rol, nombrePartida: S.nombrePartida || 'España'
      };
      opts.escenario = S.escenario || 'normal';
      if (S.partido === 'nuevo') opts.nuevo = { logo: S.nuevo.logo, fin: S.nuevo.fin, implant: S.nuevo.implant.slice(), nombre: S.nuevo.nombre || 'Partido nuevo', sigla: (S.nuevo.sigla || 'PN').toUpperCase(), eco: S.nuevo.eco, soc: S.nuevo.soc, eu: S.nuevo.eu, ter: S.nuevo.ter, color: S.nuevo.color, arq: C_.arqCercano(S.nuevo) };
      else opts.partido = S.partido;
      el.innerHTML = '<div class="inicio"><div class="cargando" style="font-size:18px;color:var(--oro2)">Generando España: 52 circunscripciones, 19 comunidades, 67 ayuntamientos y la Unión Europea…</div></div>';
      setTimeout(() => {
        const E = C.Mundo.nueva(opts);
        E.meta.nombrePartida = opts.nombrePartida; if (opts.escenario && C.Escenarios) C.Escenarios.aplicar(E, opts.escenario);
        S = null; preview = null;
        C.Guardado.guardar(null, opts.nombrePartida).then(() => C.App.comenzar());
      }, 30);
    },

    arqCercano(n) {
      let mejor = 'cen', md = 9;
      for (const k in D().arquetipos) { const a = D().arquetipos[k]; const d = U.distIdeo(a, n); if (d < md) { md = d; mejor = k; } }
      return mejor;
    }
  };
})(window.ESP);

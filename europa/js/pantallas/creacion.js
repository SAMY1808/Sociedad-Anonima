/* Creación de carrera: país → partido → personaje → resumen. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf;
  C.Pantallas = C.Pantallas || {};
  const ATRIB = [['carisma', 'Carisma', 'Capta atención y simpatías'], ['oratoria', 'Oratoria', 'Discursos, debates y entrevistas'], ['gestion', 'Gestión', 'Organización y administración'], ['negociacion', 'Negociación', 'Pactos y cabildeo'], ['integridad', 'Integridad', 'Credibilidad y ética pública']];
  const SIS = { prop: 'proporcional', mayor: 'mayoritario', mixto: 'mixto' };
  const REG = { parl: 'parlamentaria', semi: 'semipresidencial', pres: 'presidencialista' };
  let S = null, preview = null;

  const nuevoEstado = () => ({
    paso: 1, pais: 'ES', filtro: 'todos', semilla: (Math.random() * 2 ** 31) | 0, partido: 1, nuevo: { nombre: 'Movimiento Cívico Europeo', sigla: 'MCE', eco: 0, soc: -10, eu: 40, color: '#8E44AD' },
    nombre: '', genero: 'f', edad: 38, trayectoria: 'concejal', atrib: { carisma: 3, oratoria: 3, gestion: 3, negociacion: 3, integridad: 3 }, libres: 5,
    eco: null, soc: null, eu: null, rol: 'base', nombrePartida: ''
  });

  /* Mundo de vista previa: mismo país y semilla que se usarán en la partida. */
  const mundoPrevio = () => {
    if (preview && preview.pais === S.pais && preview.semilla === S.semilla) return preview.E;
    const E = C.Mundo.nueva({ semilla: S.semilla, pais: S.pais, partido: S.pais + '_0', nombre: 'Previa', trayectoria: 'concejal', atrib: {}, rol: 'base' });
    preview = { pais: S.pais, semilla: S.semilla, E };
    return E;
  };

  const paso1 = () => {
    const d = D().paises[S.pais];
    const filtros = [['todos', 'Todos'], ['ue', 'Unión Europea'], ['exue', 'Reino Unido'], ['candidato', 'Candidatos']];
    const n = D().partidos[S.pais].length;
    return `<h1>Elige tu país</h1>
    <p class="tenue" style="margin-top:-8px">27 Estados miembros de la UE, el Reino Unido y los 9 candidatos oficiales a la adhesión.</p>
    <div class="seg" style="margin-bottom:10px">${filtros.map(f => `<button data-filtro="${f[0]}" class="${S.filtro === f[0] ? 'activo' : ''}">${f[1]}</button>`).join('')}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start">
      <div class="tarjeta" id="c-mapa">${C.Mosaico.seleccion(S.pais, S.filtro)}</div>
      <div class="tarjeta">
        <div class="fila" style="gap:12px"><span class="rotulo-pais">${d.bandera}</span><div><h2 style="font-size:24px">${esc(d.nombre)}</h2><div class="tenue">${esc(d.cap)} · ${U.mill(d.pob)} hab. · PIB ${U.eur(d.pib)}</div></div></div>
        <div class="chips" style="margin:10px 0">${d.estado === 'ue' ? '<span class="etq">Miembro de la UE</span>' : d.estado === 'exue' ? '<span class="etq rojo">Fuera de la UE desde 2020</span>' : '<span class="etq amar">Candidato a la adhesión</span>'}${d.euro === true ? '<span class="etq verde">Euro</span>' : d.euro === 'uni' ? '<span class="etq verde">Euro (unilateral)</span>' : '<span class="etq">Moneda propia</span>'}<span class="etq">${n} partidos</span></div>
        <p style="margin:6px 0 10px;font-size:13px;color:var(--texto2)">${esc(d.rasgo)}</p>
        <div class="lista" style="font-size:13px">
          <div class="it"><span class="tenue" style="width:130px">Parlamento</span><b>${esc(d.cam)} · ${d.esc} escaños</b></div>
          <div class="it"><span class="tenue" style="width:130px">Sistema</span><b>${SIS[d.sis]}${d.um ? ' · umbral ' + U.d1(d.um) + ' %' : ''}</b></div>
          <div class="it"><span class="tenue" style="width:130px">Régimen</span><b>${REG[d.reg]} · ${esc(d.jefe)}</b></div>
          <div class="it"><span class="tenue" style="width:130px">Legislatura</span><b>${d.mand} años · próximas elecciones ${d.prox[1]}/${d.prox[0]}</b></div>
          ${d.estado === 'ue' ? `<div class="it"><span class="tenue" style="width:130px">Peso europeo</span><b>${d.meps} eurodiputados · ${U.d1(d.pob / 450 * 100)} % de la población UE</b></div>` : ''}
        </div></div></div>`;
  };

  const paso2 = () => {
    const E = mundoPrevio(), P = E.paises[S.pais], d = D().paises[S.pais];
    const lista = P.partidos.filter(k => !E.partidos[k].nuevo);
    const g = P.gob;
    const filas = lista.map((k, i) => {
      const p = E.partidos[k], esc_ = P.escanos[k] || 0;
      return `<div class="fila-sel ${S.partido === i ? 'sel' : ''}" data-partido="${i}"><i class="pto" style="background:${p.color};width:14px;height:14px"></i>
        <div style="flex:1;min-width:0"><b>${esc(p.nombre)}</b> <span class="tenue">· ${esc(p.sigla)}</span><div class="tenue" style="font-size:12px">${esc(D().arquetipos[p.arq].nombre)} · ${esc(D().grupos[p.grupo].sigla)} en Europa</div></div>
        <div style="text-align:right"><b class="num">${U.d1(p.pop)} %</b><div class="tenue" style="font-size:12px">${esc_} escaños${g.coalicion.includes(k) ? ' · <span class="oro">Gobierno</span>' : ''}</div></div></div>`;
    }).join('');
    const nuevoSel = S.partido === 'nuevo';
    const pts = lista.map((k, i) => ({ x: E.partidos[k].eco, y: E.partidos[k].soc, r: 4 + Math.sqrt(E.partidos[k].pop) * 2, color: E.partidos[k].color, etq: E.partidos[k].sigla, tt: `<b>${esc(E.partidos[k].nombre)}</b><br>${U.d1(E.partidos[k].pop)} %`, bw: S.partido === i ? 4 : 2, borde: S.partido === i ? '#FFF3C4' : '#0A111D' }));
    if (nuevoSel) pts.push({ x: S.nuevo.eco, y: S.nuevo.soc, r: 7, color: S.nuevo.color, etq: S.nuevo.sigla, borde: '#FFF3C4', bw: 4 });
    const sel = nuevoSel ? null : E.partidos[lista[S.partido]];
    return `<h1>Elige tu partido</h1>
    <p class="tenue" style="margin-top:-8px">${d.bandera} ${esc(d.nombre)} · ${esc(d.cam)} · ${d.esc} escaños. Gobierna ${C.Comp.partido(E, g.partido, true)}${g.coalicion.length > 1 ? ' con ' + g.coalicion.filter(k => k !== g.partido).map(k => E.partidos[k].sigla).join(', ') : ''}.</p>
    <div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start">
      <div class="col">${filas}
        <div class="fila-sel ${nuevoSel ? 'sel' : ''}" data-partido="nuevo"><span style="font-size:22px">✦</span><div style="flex:1"><b>Fundar un partido nuevo</b><div class="tenue" style="font-size:12px">Nivel difícil: empiezas con ~2 % de apoyo y como líder.</div></div></div>
        ${nuevoSel ? `<div class="tarjeta"><div class="campo"><label>Nombre</label><input id="n-nombre" value="${esc(S.nuevo.nombre)}" maxlength="42"></div><div class="campo"><label>Siglas</label><input id="n-sigla" value="${esc(S.nuevo.sigla)}" maxlength="6" style="max-width:120px"></div>
          ${[['eco', 'Economía (− izq / + der)'], ['soc', 'Social (− prog / + cons)'], ['eu', 'Europa (− escépt. / + fed.)']].map(([k, t]) => `<div class="slider-fila"><span>${t}</span><input type="range" min="-100" max="100" value="${S.nuevo[k]}" data-nuevo="${k}"><span>${S.nuevo[k]}</span></div>`).join('')}
          <div class="campo"><label>Color</label><input type="color" id="n-color" value="${S.nuevo.color}" style="width:60px;padding:2px"></div></div>` : ''}</div>
      <div class="col"><div class="tarjeta"><h3>Mapa ideológico</h3>${G.plano(pts, { tam: 340 })}<div class="tenue" style="font-size:11.5px;margin-top:4px">El tamaño del círculo refleja el apoyo electoral.</div></div>
        ${sel ? `<div class="tarjeta"><h3>${esc(sel.nombre)}</h3><p style="margin:0 0 6px;font-size:13px">Perfil: ${C.Comp.ideoTxt(sel)}.</p><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:120px">Líder</span><b>${esc(E.politicos[sel.lider].n)}</b></div><div class="it"><span class="tenue" style="width:120px">Cohesión</span><b>${sel.cohesion}</b></div><div class="it"><span class="tenue" style="width:120px">Escaños</span><b>${P.escanos[sel.id] || 0} de ${d.esc}</b></div></div>
        ${(P.escanos[sel.id] || 0) === 0 ? '<p class="mal" style="font-size:12.5px">No tiene escaños: empezarás fuera del parlamento.</p>' : ''}</div>` : ''}</div></div>`;
  };

  const paso3 = () => {
    const E = mundoPrevio();
    const pa = S.partido === 'nuevo' ? { eco: S.nuevo.eco, soc: S.nuevo.soc, eu: S.nuevo.eu, pop: 2.2, id: null } : E.partidos[E.paises[S.pais].partidos.filter(k => !E.partidos[k].nuevo)[S.partido]];
    if (S.eco === null) { S.eco = pa.eco; S.soc = pa.soc; S.eu = pa.eu; }
    const base = D().trayectorias.find(t => t.id === S.trayectoria);
    const nuevo = S.partido === 'nuevo';
    const peque = pa.pop < 12;
    return `<h1>Tu personaje</h1>
    <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">
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
          ${[['eco', 'Economía (− izq / + der)'], ['soc', 'Social (− prog / + cons)'], ['eu', 'Europa (− escépt. / + fed.)']].map(([k, t]) => `<div class="slider-fila"><span>${t}</span><input type="range" min="-100" max="100" value="${S[k]}" data-ideo="${k}"><span>${S[k]}</span></div>`).join('')}
          <div class="tenue" style="font-size:12px">Parte de la posición de tu partido; alejarte de ella mejora tu perfil propio pero erosiona tu disciplina.</div></div>
        <div class="tarjeta"><h3>Posición de partida</h3><div class="col">
          <div class="fila-sel ${S.rol === 'base' && !nuevo ? 'sel' : ''}" data-rol="base" ${nuevo ? 'style="opacity:.4;pointer-events:none"' : ''}><div><b>Diputado/a de base</b><div class="tenue" style="font-size:12px">Tienes escaño (si tu partido lo tiene) y todo por demostrar.</div></div></div>
          <div class="fila-sel ${S.rol === 'lider' || nuevo ? 'sel' : ''}" data-rol="lider" ${!peque && !nuevo ? 'style="opacity:.4;pointer-events:none"' : ''}><div><b>Líder del partido</b><div class="tenue" style="font-size:12px">${peque || nuevo ? 'Diriges un partido pequeño: más puntos de agenda y visibilidad, pero mucha presión.' : 'Sólo disponible en partidos pequeños (&lt; 12 %).'}</div></div></div></div></div>
      </div></div>`;
  };

  const paso4 = () => {
    const E = mundoPrevio(), d = D().paises[S.pais];
    const pid = S.partido === 'nuevo' ? null : E.paises[S.pais].partidos.filter(k => !E.partidos[k].nuevo)[S.partido];
    const pa = pid ? E.partidos[pid] : { nombre: S.nuevo.nombre, sigla: S.nuevo.sigla, color: S.nuevo.color };
    const tr = D().trayectorias.find(t => t.id === S.trayectoria);
    return `<h1>Listo para empezar</h1>
    <div class="grid g2"><div class="tarjeta"><h3>Resumen</h3><div class="lista" style="font-size:14px">
      <div class="it"><span class="tenue" style="width:110px">Personaje</span><b>${esc(S.nombre || 'Sin nombre')}</b><span class="tenue">${S.genero === 'f' ? 'Mujer' : 'Hombre'} · ${S.edad} años</span></div>
      <div class="it"><span class="tenue" style="width:110px">País</span><b>${d.bandera} ${esc(d.nombre)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Partido</span><b><i class="pto" style="background:${pa.color}"></i> ${esc(pa.nombre)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Trayectoria</span><b>${esc(tr.nombre)}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Posición</span><b>${S.partido === 'nuevo' || S.rol === 'lider' ? 'Líder del partido' : 'Diputado/a de base'}</b></div>
      <div class="it"><span class="tenue" style="width:110px">Ideología</span><b>${C.Comp.ideoTxt({ eco: S.eco, soc: S.soc, eu: S.eu })}</b></div></div></div>
    <div class="tarjeta"><h3>Cómo se juega</h3><ul style="margin:0;padding-left:18px;color:var(--texto2);font-size:13.5px;line-height:1.6">
      <li>Cada semana tienes <b>puntos de agenda</b> para actuar: discursos, leyes, cabildeo, partido, medios y Europa.</li>
      <li>Vota en el pleno, presenta tus proyectos y trabaja para ascender: portavoz, ministro/a, jefe/a de Gobierno.</li>
      <li>Los gobiernos se forman por <b>coaliciones</b> y pueden caer. Las elecciones llegan con noche electoral.</li>
      <li>En Europa: vota en el Consejo (mayoría cualificada), llega al Parlamento Europeo o a la Comisión.</li>
      <li>Sin partida «perfecta»: puedes terminar presidiendo la Comisión o llevando a tu país al euro… o a la salida de la UE.</li></ul></div></div>
    <div class="campo" style="max-width:360px;margin-top:12px"><label>Nombre de la partida</label><input id="r-partida" value="${esc(S.nombrePartida || (S.nombre ? S.nombre.split(' ')[0] + ' · ' + d.nombre : d.nombre))}"></div>`;
  };

  const C_ = C.Pantallas.creacion = {
    render(el) {
      if (!S) S = nuevoEstado();
      if (!S.nombre) { C.E = C.E || null; }
      const pasos = ['País', 'Partido', 'Personaje', 'Comenzar'];
      const cuerpo = [paso1, paso2, paso3, paso4][S.paso - 1]();
      el.innerHTML = `<div class="creacion"><div class="crea-cab"><div class="logo">CURUL <small>Europa</small></div><div class="pasos">${pasos.map((p, i) => `<span class="${S.paso === i + 1 ? 'act' : S.paso > i + 1 ? 'ok' : ''}">${i + 1}. ${p}</span>`).join('')}</div><div style="flex:1"></div><button class="btn fant" id="c-salir">✕ Salir</button></div>
        <div class="crea-cuerpo">${cuerpo}</div>
        <div class="crea-pie"><button class="btn" id="c-atras" ${S.paso === 1 ? 'disabled' : ''}>← Atrás</button><div style="flex:1"></div>
        ${S.paso < 4 ? '<button class="btn prim" id="c-sig">Siguiente →</button>' : '<button class="btn prim" id="c-ok" style="padding:10px 22px">✦ Comenzar la carrera</button>'}</div></div>`;
      C_.enlazar(el);
    },

    enlazar(el) {
      const $ = (s) => UI.$(s, el), re = () => C_.render(el);
      $('#c-salir').onclick = () => { S = null; preview = null; C.Pantallas.inicio.render(el); };
      $('#c-atras').onclick = () => { if (S.paso > 1) { S.paso--; re(); } };
      const sig = $('#c-sig'); if (sig) sig.onclick = () => { if (S.paso === 2 && S.partido === 'nuevo') { S.nuevo.nombre = ($('#n-nombre') || { value: S.nuevo.nombre }).value || S.nuevo.nombre; } if (S.paso === 2) { S.eco = null; if (!S.nombre) { C.E = mundoPrevio(); S.nombre = C.Mundo.persona(S.pais, S.genero).n; } } S.paso++; re(); };
      const ok = $('#c-ok'); if (ok) ok.onclick = () => C_.comenzar();
      if (S.paso === 1) {
        UI.$$('[data-filtro]', el).forEach(b => b.onclick = () => { S.filtro = b.dataset.filtro; re(); });
        UI.$$('[data-pais]', el).forEach(g => g.onclick = () => { S.pais = g.dataset.pais; S.partido = 1; S.eco = null; S.nombre = ''; re(); });
      } else if (S.paso === 2) {
        UI.$$('[data-partido]', el).forEach(f => f.onclick = () => { S.partido = f.dataset.partido === 'nuevo' ? 'nuevo' : +f.dataset.partido; S.eco = null; re(); });
        const nn = $('#n-nombre'); if (nn) { nn.oninput = () => S.nuevo.nombre = nn.value; $('#n-sigla').oninput = e => S.nuevo.sigla = e.target.value.toUpperCase().slice(0, 6); $('#n-color').oninput = e => { S.nuevo.color = e.target.value; }; $('#n-color').onchange = re; }
        UI.$$('[data-nuevo]', el).forEach(r => { r.oninput = () => { S.nuevo[r.dataset.nuevo] = +r.value; r.nextElementSibling.textContent = r.value; }; r.onchange = re; });
      } else if (S.paso === 3) {
        $('#p-nombre').oninput = e => S.nombre = e.target.value;
        $('#p-azar').onclick = () => { C.E = mundoPrevio(); S.nombre = C.Mundo.persona(S.pais, S.genero).n; re(); };
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
      const E0 = mundoPrevio(), P = E0.paises[S.pais];
      const lista = P.partidos.filter(k => !E0.partidos[k].nuevo);
      const opts = {
        semilla: S.semilla, pais: S.pais, nombre: S.nombre || 'Alex Navarro', genero: S.genero, edad: S.edad, trayectoria: S.trayectoria, atrib: S.atrib,
        eco: S.eco, soc: S.soc, eu: S.eu, rol: S.rol, nombrePartida: S.nombrePartida || S.pais
      };
      if (S.partido === 'nuevo') opts.nuevo = { nombre: S.nuevo.nombre || 'Partido nuevo', sigla: (S.nuevo.sigla || 'PN').toUpperCase(), eco: S.nuevo.eco, soc: S.nuevo.soc, eu: S.nuevo.eu, color: S.nuevo.color, arq: C_.arqCercano(S.nuevo), apoyo: 2.2 };
      else opts.partido = lista[S.partido];
      el.innerHTML = '<div class="inicio"><div class="cargando" style="font-size:18px;color:var(--oro2)">Generando 37 países, sus parlamentos y gobiernos…</div></div>';
      setTimeout(() => {
        const E = C.Mundo.nueva(opts);
        E.meta.nombrePartida = opts.nombrePartida;
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
})(window.EUROPA);

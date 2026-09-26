/* Creación del personaje: identidad, formación, ideología, trayectoria inicial y escenario. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const PASOS = ['Identidad', 'Formación', 'Ideología', 'Trayectoria', 'Escenario'];
  const PUNTOS = 30;

  const nombreAleatorio = g => {
    const N = C.DATA.nombres;
    return (g === 'f' ? N.m : N.h)[Math.floor(Math.random() * 50)] + ' ' + N.a[Math.floor(Math.random() * N.a.length)] + ' ' + N.a[Math.floor(Math.random() * N.a.length)];
  };

  C.Pantallas.creacion = {
    render(el) {
      const cfg = {
        nombre: nombreAleatorio('f'), genero: 'f', edad: 36, nacimiento: 'BOY', residencia: 'BOG',
        educacion: 'Profesional', profesion: 'Politólogo', atributos: { carisma: 45, oratoria: 45, gestion: 45, negociacion: 45, integridad: 55 },
        intereses: ['educacion', 'salud'], eco: -10, soc: -10, origen: 'activista', partido: 'NC', comision: null,
        pareja: '', hijos: 0, escenario: 'legislatura', semilla: ''
      };
      let paso = 0;
      const deptOpts = sel => C.DATA.departamentos.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(d => `<option value="${d.id}" ${d.id === sel ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('');
      const gastados = () => U.suma(Object.values(cfg.atributos)) - (45 * 4 + 55);

      const pintar = () => {
        let cuerpo = '';
        if (paso === 0) cuerpo = `
          <div class="grid g2">
            <div>
              <div class="campo"><label>Nombre completo</label><div class="fila"><input id="c-nombre" value="${esc(cfg.nombre)}" style="flex:1"><button class="btn" id="c-azar">🎲</button></div></div>
              <div class="campo"><label>Género</label><div class="seg" id="c-gen">${[['f', 'Mujer'], ['m', 'Hombre'], ['x', 'No binario']].map(([k, n]) => `<button data-g="${k}" class="${cfg.genero === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>
              <div class="campo"><label>Edad: <b id="c-edad-v">${cfg.edad}</b> años</label><input type="range" min="22" max="68" value="${cfg.edad}" id="c-edad"></div>
              <div class="campo"><label>Ciudad / departamento de nacimiento</label><select id="c-nac">${deptOpts(cfg.nacimiento)}</select></div>
              <div class="campo"><label>Residencia (tu base electoral)</label><select id="c-res">${deptOpts(cfg.residencia)}</select></div>
            </div>
            <div class="tarjeta" style="display:flex;flex-direction:column;align-items:center;gap:10px;justify-content:center">
              <div id="c-mapa" style="width:100%;max-width:300px"></div>
              <div class="tenue" style="font-size:12px;text-align:center">Tu región de residencia define tu base electoral y tu circunscripción a la Cámara.</div>
            </div>
          </div>`;
        if (paso === 1) cuerpo = `
          <div class="grid g2">
            <div>
              <div class="campo"><label>Nivel educativo</label><select id="c-edu">${C.Personaje.EDUCACION.map(e => `<option ${e === cfg.educacion ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
              <div class="campo"><label>Profesión</label><select id="c-prof">${C.DATA.profesiones.map(e => `<option ${e === cfg.profesion ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
              <div class="campo"><label>Temas de interés (elige 2)</label><div class="fila" id="c-int">${Object.entries(C.DATA.sectores).map(([k, s]) => `<button class="btn chico ${cfg.intereses.includes(k) ? 'prim' : ''}" data-s="${k}">${s.icono} ${s.nombre}</button>`).join('')}</div></div>
            </div>
            <div class="tarjeta"><h3>Atributos · puntos libres: <b id="c-pts" style="color:var(--oro2)">${PUNTOS - gastados()}</b></h3>
              ${Object.entries({ carisma: 'Carisma', oratoria: 'Oratoria', gestion: 'Gestión', negociacion: 'Negociación', integridad: 'Integridad' }).map(([k, n]) => `
                <div class="atrib"><span>${n}</span><button class="btn chico" data-at="${k}" data-d="-5">−</button><div class="barra-h" style="flex:1"><i style="width:${cfg.atributos[k]}%;background:var(--oro)"></i></div><b class="num">${cfg.atributos[k]}</b><button class="btn chico" data-at="${k}" data-d="5">+</button></div>`).join('')}
              <p class="tenue" style="font-size:12px">Carisma: campañas y eventos · Oratoria: debates, entrevistas e intervenciones · Gestión: cargos ejecutivos · Negociación: cabildeo y acuerdos · Integridad: honestidad percibida.</p>
            </div>
          </div>`;
        if (paso === 2) {
          const cercanos = Object.values(C.DATA.partidos).filter(p => !p.especial).map(p => ({ p, d: U.distIdeo({ eco: cfg.eco, soc: cfg.soc }, p) })).sort((a, b) => a.d - b.d).slice(0, 4);
          cuerpo = `<div class="grid g2">
            <div class="tarjeta" style="display:flex;justify-content:center"><div id="c-plano" style="width:100%;max-width:360px;cursor:crosshair">${C.Graf.plano([
              ...C.DATA.partidos.filter(p => !p.especial).map(p => ({ x: p.eco, y: p.soc, color: p.color, r: 5, op: .5, etq: p.sigla, tt: esc(p.nombre) })),
              { x: cfg.eco, y: cfg.soc, color: '#FFF3C4', r: 9, borde: '#D9B45A', bw: 3, tt: 'Tú' }], { tam: 360 })}</div></div>
            <div>
              <div class="campo"><label>Eje económico: <b>${C.Comp.etiquetaIdeo(cfg.eco)}</b> (${cfg.eco})</label><input type="range" min="-100" max="100" value="${cfg.eco}" id="c-eco"></div>
              <div class="campo"><label>Eje social: <b>${cfg.soc > 25 ? 'Conservador' : cfg.soc < -25 ? 'Progresista' : 'Moderado'}</b> (${cfg.soc})</label><input type="range" min="-100" max="100" value="${cfg.soc}" id="c-soc"></div>
              <div class="tarjeta"><h3>Partidos más cercanos</h3><div class="lista">${cercanos.map(({ p, d }) => `<div class="it"><i class="pto" style="background:${p.color}"></i><div class="cuerpo"><b>${esc(p.nombre)}</b><span>«${esc(p.lema)}»</span></div><span class="etq">${Math.round((1 - d) * 100)} % afín</span></div>`).join('')}</div></div>
              <p class="tenue" style="font-size:12px">Haz clic en el plano para ubicarte. Tu ideología define con quién votan tus instintos, qué regiones te prefieren y qué aliados naturales tendrás.</p>
            </div></div>`;
        }
        if (paso === 3) {
          const o = C.Personaje.ORIGENES;
          const req = o[cfg.origen].requierePartido;
          cuerpo = `<h3 class="sub-h">¿Desde dónde empiezas?</h3>
            <div class="grid g4 origenes">${Object.entries(o).map(([k, x]) => `<div class="tarjeta clic origen ${cfg.origen === k ? 'sel' : ''}" data-o="${k}"><div style="font-size:24px">${x.icono}</div><b>${x.n}</b><div class="tenue" style="font-size:12px">${x.desc}</div><div class="fila" style="margin-top:6px"><span class="etq">Rec. ${x.rec}</span><span class="etq">${U.cop(x.patrimonio)}</span></div></div>`).join('')}</div>
            <h3 class="sub-h">Partido ${req ? '<span class="etq amar">obligatorio para tu cargo</span>' : ''}</h3>
            <div class="fila" id="c-part">${req ? '' : `<button class="btn chico ${!cfg.partido ? 'prim' : ''}" data-p="">Sin partido</button>`}${C.DATA.partidos.filter(p => !p.especial).map(p => `<button class="btn chico ${cfg.partido === p.id ? 'prim' : ''}" data-p="${p.id}"><i class="pto" style="background:${p.color}"></i> ${esc(p.sigla)}</button>`).join('')}</div>
            ${cfg.partido ? `<p class="tenue" style="font-size:12px;margin:6px 0 0">${esc(C.DATA.partidos.find(p => p.id === cfg.partido).nombre)} · afinidad ideológica ${Math.round((1 - U.distIdeo({ eco: cfg.eco, soc: cfg.soc }, C.DATA.partidos.find(p => p.id === cfg.partido))) * 100)} %</p>` : ''}
            <div class="grid g2" style="margin-top:14px">
              ${req ? `<div class="campo"><label>Comisión constitucional preferida</label><select id="c-com"><option value="">Según mis intereses</option>${C.DATA.comisiones.map(c => `<option value="${c.n}" ${cfg.comision == c.n ? 'selected' : ''}>Comisión ${c.nombre} · ${esc(c.tema)}</option>`).join('')}</select></div>` : '<div></div>'}
              <div class="fila" style="align-items:flex-end"><div class="campo" style="flex:1"><label>Pareja (opcional)</label><input id="c-pareja" value="${esc(cfg.pareja)}" placeholder="Nombre"></div><div class="campo"><label>Hijos</label><select id="c-hijos">${[0, 1, 2, 3, 4].map(n => `<option ${cfg.hijos === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
            </div>`;
        }
        if (paso === 4) {
          const o = C.Personaje.ORIGENES[cfg.origen];
          cuerpo = `<div class="grid g2">${Object.entries(C.Mundo.ESCENARIOS).map(([k, e]) => `<div class="tarjeta clic origen ${cfg.escenario === k ? 'sel' : ''}" data-e="${k}"><b style="font-size:16px">${esc(e.n)}</b><p class="tenue">${esc(e.desc)}</p></div>`).join('')}</div>
            <div class="grid g2" style="margin-top:14px">
              <div class="tarjeta"><h3>Resumen</h3>
                <div class="tt-f"><span class="tenue">Nombre</span><b>${esc(cfg.nombre)}</b></div>
                <div class="tt-f"><span class="tenue">Edad</span><b>${cfg.edad} años</b></div>
                <div class="tt-f"><span class="tenue">Base</span><b>${esc(C.DATA.departamentos.find(d => d.id === cfg.residencia).nombre)}</b></div>
                <div class="tt-f"><span class="tenue">Inicio</span><b>${o.n}</b></div>
                <div class="tt-f"><span class="tenue">Partido</span><b>${cfg.partido ? esc(C.DATA.partidos.find(p => p.id === cfg.partido).nombre) : 'Independiente'}</b></div>
                <div class="tt-f"><span class="tenue">Ideología</span><b>${C.Comp.etiquetaIdeo(cfg.eco)} · ${cfg.soc > 25 ? 'conservador' : cfg.soc < -25 ? 'progresista' : 'moderado'}</b></div>
              </div>
              <div class="campo"><label>Semilla del mundo (opcional)</label><input id="c-seed" value="${esc(cfg.semilla)}" placeholder="Aleatoria"><span class="tenue" style="font-size:12px">La misma semilla genera el mismo país, los mismos políticos y las mismas elecciones de 2026.</span></div>
            </div>`;
        }
        el.innerHTML = `<div class="creacion"><div class="crea-cab"><div class="logo">CURUL</div>
          <div class="pasos">${PASOS.map((p, i) => `<span class="${i === paso ? 'act' : i < paso ? 'ok' : ''}">${i + 1}. ${p}</span>`).join('')}</div></div>
          <div class="crea-cuerpo"><h1>${PASOS[paso]}</h1>${cuerpo}</div>
          <div class="crea-pie"><button class="btn" id="c-atras">${paso ? '← Atrás' : 'Cancelar'}</button><div class="espacio" style="flex:1"></div><button class="btn prim" id="c-sig">${paso === PASOS.length - 1 ? '🏛 Comenzar carrera' : 'Siguiente →'}</button></div></div>`;
        enlazar();
      };

      const enlazar = () => {
        const $ = s => UI.$(s, el);
        $('#c-atras').onclick = () => { if (!paso) C.Pantallas.inicio.render(el); else { paso--; pintar(); } };
        $('#c-sig').onclick = () => {
          if (paso === 3 && C.Personaje.ORIGENES[cfg.origen].requierePartido && !cfg.partido) return UI.toast('Para empezar como congresista necesitas un partido', 'mal');
          if (paso === 1 && cfg.intereses.length !== 2) return UI.toast('Elige exactamente dos temas de interés', 'mal');
          if (paso < PASOS.length - 1) { paso++; pintar(); } else comenzar();
        };
        if (paso === 0) {
          $('#c-nombre').oninput = e => cfg.nombre = e.target.value;
          $('#c-azar').onclick = () => { cfg.nombre = nombreAleatorio(cfg.genero); pintar(); };
          UI.$$('#c-gen button', el).forEach(b => b.onclick = () => { cfg.genero = b.dataset.g; pintar(); });
          $('#c-edad').oninput = e => { cfg.edad = +e.target.value; $('#c-edad-v').textContent = cfg.edad; };
          $('#c-nac').onchange = e => cfg.nacimiento = e.target.value;
          $('#c-res').onchange = e => { cfg.residencia = e.target.value; mini(); };
          const mini = () => {
            const svg = C.DATA.mapa, cont = $('#c-mapa');
            cont.innerHTML = `<svg viewBox="${svg.viewBox}" class="mapa-col">${Object.entries(svg.deptos).map(([id, g]) => `<path d="${g.d}" data-depto="${id}" class="depto" fill="${id === cfg.residencia ? '#D9B45A' : id === cfg.nacimiento ? '#6f86b3' : '#1E2C47'}"${UI.tt(esc(C.DATA.departamentos.find(d => d.id === id).nombre))}/>`).join('')}</svg>`;
          };
          mini();
          C.Mapa.enlazar($('#c-mapa'), id => { cfg.residencia = id; $('#c-res').value = id; mini(); });
        }
        if (paso === 1) {
          $('#c-edu').onchange = e => cfg.educacion = e.target.value;
          $('#c-prof').onchange = e => cfg.profesion = e.target.value;
          UI.$$('#c-int button', el).forEach(b => b.onclick = () => {
            const s = b.dataset.s;
            if (cfg.intereses.includes(s)) cfg.intereses = cfg.intereses.filter(x => x !== s);
            else { cfg.intereses.push(s); if (cfg.intereses.length > 2) cfg.intereses.shift(); }
            pintar();
          });
          UI.$$('[data-at]', el).forEach(b => b.onclick = () => {
            const k = b.dataset.at, d = +b.dataset.d, v = cfg.atributos[k] + d;
            if (v < 25 || v > 85) return;
            if (d > 0 && gastados() + d > PUNTOS) return UI.toast('No te quedan puntos', 'mal');
            cfg.atributos[k] = v; pintar();
          });
        }
        if (paso === 2) {
          $('#c-eco').onchange = e => { cfg.eco = +e.target.value; pintar(); };
          $('#c-soc').onchange = e => { cfg.soc = +e.target.value; pintar(); };
          $('#c-plano svg').addEventListener('click', e => {
            const r = e.currentTarget.getBoundingClientRect(), S = 360, m = 22;
            const x = (e.clientX - r.left) / r.width * S, y = (e.clientY - r.top) / r.height * S;
            cfg.eco = Math.round(U.clamp((x - m) / (S - 2 * m) * 200 - 100, -100, 100));
            cfg.soc = Math.round(U.clamp((y - m) / (S - 2 * m) * 200 - 100, -100, 100));
            pintar();
          });
        }
        if (paso === 3) {
          UI.$$('[data-o]', el).forEach(b => b.onclick = () => { cfg.origen = b.dataset.o; if (C.Personaje.ORIGENES[cfg.origen].requierePartido && !cfg.partido) cfg.partido = 'NC'; pintar(); });
          UI.$$('#c-part button', el).forEach(b => b.onclick = () => { cfg.partido = b.dataset.p || null; pintar(); });
          const com = $('#c-com'); if (com) com.onchange = e => cfg.comision = e.target.value ? +e.target.value : null;
          $('#c-pareja').oninput = e => cfg.pareja = e.target.value;
          $('#c-hijos').onchange = e => cfg.hijos = +e.target.value;
        }
        if (paso === 4) {
          UI.$$('[data-e]', el).forEach(b => b.onclick = () => { cfg.escenario = b.dataset.e; pintar(); });
          $('#c-seed').oninput = e => cfg.semilla = e.target.value;
        }
      };

      const comenzar = () => {
        el.innerHTML = `<div class="inicio"><div class="inicio-caja"><div class="cargando"></div><h2>Generando la República…</h2><p class="tenue">Elecciones de 2026, instalación del Congreso y posesión presidencial.</p></div></div>`;
        setTimeout(() => {
          const semilla = cfg.semilla ? Math.abs([...cfg.semilla].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) : undefined;
          const jug = Object.assign({}, cfg, { genero: cfg.genero === 'x' ? (Math.random() < 0.5 ? 'f' : 'm') : cfg.genero });
          C.Mundo.generar({ escenario: cfg.escenario, semilla, jugador: jug });
          C.E.meta.slot = null;
          C.Guardado.guardar(null, cfg.nombre);
          C.App.comenzar();
        }, 60);
      };
      pintar();
    }
  };
})(window.CURUL);

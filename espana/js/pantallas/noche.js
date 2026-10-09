/* Noche electoral en directo (generales): jornada con participación, sondeo a las 20:00, escrutinio por tramos con proyección de escaños,
   comentarios en tiempo real, llamadas y decisiones, discurso desde el balcón y resultado final. Sustituye a Elecciones.noche. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo, clamp = U.clamp;
  C.Pantallas = C.Pantallas || {};
  const HORAS = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:15'];
  const TRAMOS = [0, 0.1, 0.24, 0.4, 0.56, 0.7, 0.82, 0.93, 1];

  const blq = (E, escanos, sinDecl) => { const b = H.ordenPartidos(E).filter(k => escanos[k]).map(k => ({ n: escanos[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${escanos[k]}</b></div>` })); if (sinDecl > 0) b.push({ n: sinDecl, color: '#26354f', tt: '<div class="tt-t">Sin escrutar</div>' }); return b; };

  /* Estado del escrutinio en un instante (0..1 = fracción de provincias escrutadas, de menor a mayor población con algo de azar). */
  const Noche = C.NocheEnVivo = {
    preparar(E, n) {
      const ids = Object.keys(D().provincias).sort((a, b) => D().provincias[a][3] * (0.7 + Math.random() * 0.6) - D().provincias[b][3] * (0.7 + Math.random() * 0.6));
      const pesos = ids.map(id => D().provincias[id][2]), tot = U.suma(pesos); let ac = 0; const orden = ids.map((id, i) => { ac += pesos[i]; return { id, ac: ac / tot }; });
      const pr = E.esp.prov, sond = n.camp && n.camp.sondeo, hist = E.elecciones.historico.filter(h => h.tipo === 'generales'), partPrev = hist[1] ? hist[1].part : n.part - U.rf(-2, 2);
      return { orden, sond, partPrev, pr };
    },
    /* Datos parciales cuando se ha escrutado la fracción f de los escaños (por provincias completas). */
    parcial(E, n, st, f) {
      const vis = new Set(), decl = {}, vot = {}; let pesoV = 0, escDecl = 0;
      for (const o of st.orden) { if (o.ac - 1e-9 > f && f < 1) break; vis.add(o.id); const pr = st.pr[o.id], pob = D().provincias[o.id][3]; pesoV += pob; for (const k in pr.votos) vot[k] = (vot[k] || 0) + pr.votos[k] * pob; for (const k in pr.escanos) { decl[k] = (decl[k] || 0) + pr.escanos[k]; escDecl += pr.escanos[k]; } }
      const share = {}; let s = 0; for (const k in vot) { share[k] = vot[k] / (pesoV || 1); s += share[k]; } for (const k in share) share[k] = share[k] * 100 / (s || 1);
      const R = 350 - escDecl, proy = Object.assign({}, decl), sd = st.sond ? st.sond.esc : n.escanos, sdT = U.suma(Object.values(sd)) || 1, dT = escDecl || 1;
      const w = Math.min(1, f * 1.1);
      for (const k of E.paises.ES.partidos) { const base = (decl[k] || 0) / dT, ex = (sd[k] || 0) / sdT, ref = w * base + (1 - w) * ex; if (R > 0) proy[k] = (decl[k] || 0) + R * ref; }
      const pr2 = {}; let tp = 0; for (const k in proy) { pr2[k] = Math.round(proy[k]); tp += pr2[k]; } const dif = 350 - tp; if (dif) { const mx = Object.keys(pr2).sort((a, b) => pr2[b] - pr2[a])[0]; if (mx) pr2[mx] += dif; }
      return { vis, decl, escDecl, share, proy: pr2, pct: Math.round(f * 100) };
    },
    /* Bloques del Gobierno saliente y de la oposición, con los escaños de una distribución. */
    bloques(E, esc_) {
      const g = E.paises.ES.gob, gob = g ? g.coalicion.concat(g.apoyoExterno || []) : [], A = U.suma(Object.keys(esc_).filter(k => gob.includes(k)).map(k => esc_[k])), B = U.suma(Object.keys(esc_).filter(k => !gob.includes(k)).map(k => esc_[k]));
      return { gob, A, B };
    }
  };

  C.Pantallas.elecciones.noche = function (n) {
    const E = C.E, P = E.paises.ES, J = E.jugador, pj = J && J.pais === 'ES' && E.partidos[J.partido] ? J.partido : null;
    const st = Noche.preparar(E, n), orden = P.partidos.slice().sort((a, b) => n.votos[b] - n.votos[a]).filter(k => n.votos[k] > 0.15);
    const lider = orden[0], dec = n.decisiones = n.decisiones || {};
    const cuerpo = `<div class="boletin"><span id="n-hora">🕗 Jornada electoral</span><span id="n-bol">Participación…</span></div><div class="barra-h" style="height:6px;margin-bottom:10px"><i id="n-prog" style="width:0;background:var(--oro)"></i></div>
      <div id="n-fase"></div><div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:12px"><div id="n-barras"></div><div id="n-hemi"></div></div>
      <div id="n-proy" class="tenue" style="font-size:12.5px;margin:8px 0"></div><div id="n-tele" style="margin-top:4px"></div><div id="n-mapa" style="margin-top:8px"></div><div id="n-dec"></div><div id="n-final"></div>`;
    const m = UI.modal({ titulo: '🗳 Noche electoral · Elecciones generales', cuerpo, clase: 'noche', sinCerrar: true, pie: '<button class="btn" id="n-pausa">⏸ Pausar</button><button class="btn" id="n-saltar">Saltar escrutinio ⏭</button><button class="btn prim" id="n-cerrar" disabled>Continuar</button>' });
    const $ = s => UI.$(s, m.el); const tele = []; const pushT = (txt, tipo) => { tele.unshift({ txt, tipo }); if (tele.length > 7) tele.length = 7; $('#n-tele').innerHTML = `<div class="lista" style="font-size:12.5px">${tele.map((x, i) => `<div class="it" style="${i === 0 ? 'background:rgba(227,192,106,.1)' : ''}"><span>${x.tipo === 'alerta' ? '🚨' : x.tipo === 'ok' ? '✅' : '📺'}</span><div class="cuerpo" style="flex:1;white-space:normal">${esc(x.txt)}</div></div>`).join('')}</div>`; };
    const sg = k => E.partidos[k].sigla;
    let paso = -1, timer = null, pausa = false, ultLider = null, mayoriaAnunciada = {}, fin = false, esperando = false;
    const aplica = (fn) => { try { fn(); } catch (e) { console.error(e); } };

    /* ── Decisiones ── */
    const decision = (id, titulo, texto, opciones, cont, escena) => { esperando = true; clearInterval(timer); $('#n-dec').innerHTML = `<div class="tarjeta" style="border-color:var(--oro);margin-top:10px">${escena || ''}<h3>${titulo}</h3><p style="margin:4px 0 8px;font-size:13.5px">${texto}</p><div class="col" style="gap:6px">${opciones.map((o, i) => `<button class="btn" data-op="${i}" style="text-align:left;white-space:normal"><b>${esc(o.t)}</b><br><span class="tenue" style="font-size:11.5px">${esc(o.d)}</span></button>`).join('')}</div></div>`;
      UI.$$('[data-op]', m.el).forEach(b => b.onclick = () => { const o = opciones[+b.dataset.op]; dec[id] = o.k; aplica(() => o.ef()); $('#n-dec').innerHTML = ''; esperando = false; pushT(o.msg, 'ok'); if (cont) cont(); }); };
    const efecto = (d) => { const pa = E.partidos[pj]; if (d.coh) pa.cohesion = clamp(pa.cohesion + d.coh, 15, 99); C.Personaje.cambiar(E, { prestigio: d.pr || 0, pop: d.pop || 0 }, true); if (d.rel && C.Mayorias) for (const k in d.rel) C.Mayorias.cambiarRel(E, k, d.rel[k]); };

    const dibuja = (f) => {
      const p = Noche.parcial(E, n, st, f), hora = HORAS[Math.min(paso, HORAS.length - 1)];
      $('#n-hora').textContent = '🕗 ' + hora; $('#n-bol').textContent = `Escrutinio · ${p.pct} % de los escaños declarados · participación ${n.part} %`; $('#n-prog').style.width = p.pct + '%';
      const ord = orden.slice(0, 9), vs = p.pct ? p.share : (st.sond ? st.sond.votos : n.votos);
      $('#n-barras').innerHTML = `<h3 style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase" class="tenue">${p.pct ? 'Voto escrutado' : 'Sondeo a pie de urna'}</h3>` + G.barrasH(ord.map(k => ({ etq: Comp.partido(E, k), v: vs[k] || 0, color: E.partidos[k].color })), { max: Math.max(...ord.map(k => n.votos[k])) * 1.2, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      const mostrar = p.pct ? p.decl : (st.sond ? st.sond.esc : {}); const sinDecl = p.pct ? 350 - p.escDecl : 0;
      $('#n-hemi').innerHTML = `<h3 style="margin:0;font-size:12px;letter-spacing:.1em;text-transform:uppercase" class="tenue">${p.pct ? 'Escaños declarados' : 'Proyección del sondeo'}</h3>` + H.bloques(blq(E, mostrar, sinDecl), { altoMax: 230, mayoria: 176, centroSub: p.pct ? p.escDecl + ' / 350' : 'SONDEO · MAYORÍA 176' });
      const pr = Object.keys(p.proy).filter(k => p.proy[k] > 0).sort((a, b) => p.proy[b] - p.proy[a]).slice(0, 6), bl = Noche.bloques(E, p.proy);
      $('#n-proy').innerHTML = `<b>Proyección final:</b> ${pr.map(k => `${sg(k)} <b>${p.proy[k]}</b>`).join(' · ')} &nbsp;|&nbsp; Bloque del Gobierno saliente <b>${bl.A}</b> · resto <b>${bl.B}</b> (mayoría 176)`;
      $('#n-mapa').innerHTML = p.pct ? C.Mosaico.provincias(E, 'voto', { altoMax: 230, visible: p.vis }) : '';
      return p;
    };

    const comenta = (p, pasoActual) => {
      const k1 = Object.keys(p.proy).sort((a, b) => p.proy[b] - p.proy[a]);
      const lid = k1[0], seg = k1[1], dif = p.proy[lid] - p.proy[seg];
      if (pasoActual === 1) pushT(`Primeros datos con el ${p.pct} % escrutado: ${sg(lid)} lidera con ${U.d1(p.share[lid])} % del voto. Llegan antes los pueblos y las provincias pequeñas.`);
      if (ultLider && lid !== ultLider) pushT(`¡Cambio de liderazgo! ${sg(lid)} supera a ${sg(ultLider)} en la proyección de escaños.`, 'alerta');
      ultLider = lid;
      const bl = Noche.bloques(E, p.proy), g = P.gob;
      if (bl.A >= 176 && !mayoriaAnunciada.A && g && g.coalicion.length) { mayoriaAnunciada.A = 1; pushT(`El bloque del Gobierno saliente alcanzaría la mayoría absoluta: ${bl.A} escaños proyectados.`, 'alerta'); }
      if (bl.B >= 176 && !mayoriaAnunciada.B) { mayoriaAnunciada.B = 1; pushT(`Los partidos de la oposición sumarían ${bl.B} escaños: mayoría absoluta para cambiar el Gobierno.`, 'alerta'); }
      if (p.proy[lid] >= 176 && !mayoriaAnunciada[lid]) { mayoriaAnunciada[lid] = 1; pushT(`¡${sg(lid)} logra la mayoría absoluta en solitario!`, 'alerta'); }
      if (pasoActual >= 3 && dif <= 5) pushT(`Resultado al límite: ${sg(lid)} y ${sg(seg)} están a sólo ${dif} escaños.`, 'alerta');
      // Grandes provincias
      const grandes = ['MAD', 'BCN', 'VLC', 'SEV', 'BIZ'].filter(id => p.vis.has(id) && !(mayoriaAnunciada['p' + id]));
      grandes.slice(0, 1).forEach(id => { mayoriaAnunciada['p' + id] = 1; const pr = E.esp.prov[id]; pushT(`${D().provincias[id][0]}: gana ${sg(pr.ganador)} con ${U.d1(pr.votos[pr.ganador])} % de los votos.`); });
      if (pj && pasoActual >= 2 && U.chance(0.45)) { const antes = n.antes[pj] || 0; const d = p.proy[pj] - antes; pushT(`${sg(pj)} ${d >= 0 ? 'mejora' : 'empeora'}: proyección de ${p.proy[pj]} escaños (${d >= 0 ? '+' : ''}${d} respecto a 2023).`); }
    };

    /* ── Flujo ── */
    const finNoche = () => {
      fin = true; clearInterval(timer); $('#n-fase').innerHTML = ''; $('#n-dec').innerHTML = ''; esperando = false; paso = HORAS.length - 1;
      const p = dibuja(1);
      $('#n-hora').textContent = '🕛 Escrutinio al 100 %'; $('#n-proy').innerHTML = '';
      $('#n-barras').innerHTML = G.barrasH(orden.slice(0, 9).map(k => ({ etq: Comp.partido(E, k), v: n.votos[k], color: E.partidos[k].color, tt: `<b>${esc(E.partidos[k].nombre)}</b><br>${U.d1(n.votos[k])} % · ${n.escanos[k] || 0} escaños${n.previo ? ' · antes ' + U.d1(n.previo[k] || 0) + ' %' : ''}` })), { max: Math.max(...orden.map(k => n.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      $('#n-hemi').innerHTML = H.bloques(blq(E, n.escanos, 0), { altoMax: 250, mayoria: 176, centroSub: 'ESCAÑOS · MAYORÍA 176' }) + H.leyendaPartidos(E, n.escanos);
      Noche.cierre(E, n, m, $, pj, dec, aplica, efecto, decision, pushT, () => { $('#n-cerrar').disabled = false; });
    };
    const avanza = () => {
      if (pausa || esperando || fin) return; paso++; if (paso >= TRAMOS.length - 1) { finNoche(); return; }
      const f = TRAMOS[paso], p = dibuja(f); if (paso === 0) return; comenta(p, paso);
      if (paso === 4 && pj && !dec.llamada) llamada(p);
    };
    const llamada = (p) => {
      const g = P.gob, ps = Object.keys(p.proy).filter(k => k !== pj && E.partidos[k].amb && p.proy[k] >= 8), k = ps.sort((a, b) => C.Ejecutivo.afinidad(E, pj, b) - C.Ejecutivo.afinidad(E, pj, a))[0]; if (!k) return;
      const tu = p.proy[pj], falta = 176 - tu, lidera = Object.keys(p.proy).sort((a, b) => p.proy[b] - p.proy[a])[0] === pj;
      if (lidera && falta > 0 && falta < 70) decision('llamada', `📞 Llama ${esc(E.partidos[k].sigla)}`, `El líder de ${esc(E.partidos[k].nombre)} te llama con el ${p.pct} % escrutado: «Si confirmas los resultados, hablamos mañana». Te faltan unos ${falta} escaños para la mayoría.`, [
        { k: 'abrir', t: 'Abrir la puerta a un acuerdo', d: 'Mejora vuestra relación, pero compromete tu discurso.', msg: `Abres la puerta a ${sg(k)}.`, ef: () => efecto({ rel: { [k]: 8 }, pr: 0.5 }) },
        { k: 'esperar', t: 'Esperar al resultado definitivo', d: 'No te comprometes con nadie esta noche.', msg: 'Pides esperar al recuento definitivo.', ef: () => efecto({ rel: { [k]: 2 } }) },
        { k: 'cerrar', t: 'Descartar el pacto', d: 'Muestras fuerza ante tu electorado, pero cierras una vía.', msg: `Descartas cualquier pacto con ${sg(k)}.`, ef: () => efecto({ rel: { [k]: -8 }, coh: 1.5, pop: 0.4 }) }], () => { timer = setInterval(avanza, VEL); });
      else if (!lidera && p.proy[pj] < (n.antes[pj] || 0) - 10) decision('llamada', '📞 Un barón te llama', `Con el ${p.pct} % escrutado, tu partido proyecta ${p.proy[pj]} escaños, ${((n.antes[pj] || 0) - p.proy[pj])} menos que antes. Un barón territorial te llama furioso: «Esto hay que explicarlo».`, [
        { k: 'asumir', t: 'Asumir la responsabilidad', d: 'Frena la tormenta interna a costa de prestigio.', msg: 'Asumes la responsabilidad del resultado.', ef: () => efecto({ coh: 3, pr: -1 }) },
        { k: 'culpar', t: 'Culpar a las circunstancias', d: 'Evitas el golpe ahora pero alimentas críticas.', msg: 'Culpas a las circunstancias.', ef: () => efecto({ coh: -3, pr: 0.2 }) },
        { k: 'colgar', t: 'No coger el teléfono', d: 'Ganas tiempo; el barón se lo guardará.', msg: 'No coges la llamada.', ef: () => efecto({ coh: -1.5 }) }], () => { timer = setInterval(avanza, VEL); });
    };
    const VEL = 1700;
    const inicio = () => {
      // 1) Jornada: participación
      const pp = st.partPrev, pa14 = n.part * 0.5 + U.gauss(0, 1.2), pa18 = n.part * 0.8 + U.gauss(0, 1.2);
      $('#n-barras').innerHTML = ''; $('#n-hemi').innerHTML = ''; $('#n-proy').innerHTML = '';
      $('#n-fase').innerHTML = `<div class="tarjeta"><h3>🕑 La jornada electoral</h3><div class="lista"><div class="it"><span>🕑</span><div class="cuerpo" style="flex:1"><b>14:00</b> · participación del ${U.d1(pa14)} % (${pa14 >= pp * 0.5 ? '+' : ''}${U.d1(pa14 - pp * 0.5)} puntos que en las anteriores a la misma hora)</div></div><div class="it"><span>🕕</span><div class="cuerpo" style="flex:1"><b>18:00</b> · participación del ${U.d1(pa18)} %</div></div><div class="it"><span>🕗</span><div class="cuerpo" style="flex:1"><b>20:00</b> · cierran los colegios electorales</div></div></div></div>`;
      $('#n-bol').textContent = `Participación final prevista ${n.part} %`;
      const pasa20 = () => { $('#n-fase').innerHTML = ''; paso = 0; const p0 = dibuja(0); const sond = st.sond ? st.sond : null; const k1 = Object.keys(sond ? sond.esc : n.escanos).sort((a, b) => (sond ? sond.esc : n.escanos)[b] - (sond ? sond.esc : n.escanos)[a]);
        pushT(`Sondeo a pie de urna: ${sg(k1[0])} ganaría con ${(sond ? sond.esc : n.escanos)[k1[0]]} escaños, por delante de ${sg(k1[1])} (${(sond ? sond.esc : n.escanos)[k1[1]]}).`, 'alerta');
        if (pj) { const ps = sond ? sond.esc[pj] : n.escanos[pj]; decision('decl20', '🎙 Declaración a las 20:00', `El sondeo a pie de urna da a tu partido ${ps} escaños. Los medios esperan tu primera valoración.`, [
          { k: 'prudente', t: 'Pedir prudencia y esperar al escrutinio', d: 'Sin riesgos: +prestigio institucional.', msg: 'Pides prudencia hasta ver los datos.', ef: () => efecto({ pr: 0.5 }) },
          { k: 'ganador', t: 'Proclamar la victoria', d: 'Si el resultado acompaña, sumas; si no, pagas la factura.', msg: 'Te declaras ganador de la noche.', ef: () => { dec.ganador = true; } },
          { k: 'critica', t: 'Atacar al Gobierno', d: 'Movilizas a los tuyos pero crispas.', msg: 'Lanzas un mensaje duro contra el Gobierno.', ef: () => efecto({ coh: 1, pop: 0.3 }) }], () => { timer = setInterval(avanza, VEL); }); } else timer = setInterval(avanza, VEL); };
      if (pj) decision('jornada', '🗳 Tu voto', 'Es la mañana de las elecciones. ¿Cómo quieres vivir la jornada?', [
        { k: 'foto', t: 'Votar ante las cámaras', d: 'La foto clásica: llamamiento a la participación.', msg: 'Votas ante las cámaras y llamas a la participación.', ef: () => efecto({ pop: 0.3, pr: 0.2 }) },
        { k: 'discreto', t: 'Votar en la intimidad', d: 'Sin ruido: respeto a la jornada de reflexión.', msg: 'Votas con discreción.', ef: () => efecto({ pr: 0.4 }) },
        { k: 'llamada', t: 'Pedir a los tuyos que no se queden en casa', d: 'Movilización de última hora.', msg: 'Pides movilización hasta el último minuto.', ef: () => efecto({ coh: 0.8, pop: 0.2 }) }], pasa20);
      else setTimeout(pasa20, 1600);
    };
    $('#n-pausa').onclick = () => { pausa = !pausa; $('#n-pausa').textContent = pausa ? '▶ Seguir' : '⏸ Pausar'; };
    $('#n-saltar').onclick = () => { if (!fin) { esperando = false; $('#n-dec').innerHTML = ''; finNoche(); } };
    $('#n-cerrar').onclick = () => { clearInterval(timer); m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    inicio();
  };

  /* Cierre de la noche: titular, balcón, resultado personal y mapa. */
  C.NocheEnVivo.cierre = function (E, n, m, $, pj, dec, aplica, efecto, decision, pushT, listo) {
    const P = E.paises.ES, pers = n.personal, lid = Object.keys(n.escanos).sort((a, b) => n.escanos[b] - n.escanos[a])[0], sg = k => E.partidos[k].sigla, bl = C.NocheEnVivo.bloques(E, n.escanos);
    const abs = n.escanos[lid] >= 176, sond = n.camp && n.camp.sondeo, errS = sond ? Math.abs((sond.esc[lid] || 0) - n.escanos[lid]) : null;
    const tit = abs ? `${sg(lid)} logra la mayoría absoluta` : bl.B >= 176 && bl.A < 176 ? 'La oposición suma mayoría para desalojar al Gobierno' : bl.A >= 176 ? 'El bloque del Gobierno revalida la mayoría' : `${sg(lid)} gana sin mayoría: manda la aritmética de los pactos`;
    pushT(tit + '.', 'alerta'); if (C.Nemesis && pj) { C.Nemesis.registrarElecciones(E, n); const ne = C.Nemesis.asegurar(E); if (ne.pid) pushT(`Cara a cara con ${C.Nemesis.nombre(E)}: ${sg(pj)} ${n.escanos[pj] || 0} escaños frente a ${sg(ne.pid)} ${n.escanos[ne.pid] || 0}.`); } if (errS != null) pushT(errS <= 4 ? `El sondeo a pie de urna acertó el resultado de ${sg(lid)} con un error de ${errS} escaños.` : `El sondeo a pie de urna falló por ${errS} escaños en ${sg(lid)}.`);
    const cierre = () => {
      const bloque = `<div class="grid g2" style="margin-top:14px"><div class="nota"><b>Tu resultado</b><br>${!pers ? 'Tu escaño no estaba en juego en estas elecciones.' : pers.ue ? 'Estás en la política europea; tu escaño nacional no está en juego.' : pers.electo ? `<span class="bien">✔ Diputado/a</span> con el puesto ${pers.pos} en tu circunscripción (${pers.circ} escaños de tu partido ahí, ${pers.escanos} en total).` : `<span class="mal">✘ Sin escaño</span>: puesto ${pers.pos} y ${pers.circ} escaños de tu partido en la circunscripción.`}</div>
        <div class="nota"><b>Y ahora…</b><br>Se constituyen las Cortes, el Rey inicia las consultas y se abre el plazo de investidura. Si pasan <b>dos meses</b> desde la primera votación sin presidente, se disuelven de nuevo las Cortes.</div></div>
        <div class="tarjeta" style="margin-top:10px"><h3>${esc(tit)}</h3>${C.Pantallas.campana.nocheHTML ? '' : ''}<div class="tenue" style="font-size:12.5px">${U.fmtT(n.t, true)} · participación ${n.part} % · bloque del Gobierno saliente ${bl.A} · oposición ${bl.B}</div>${C.Mosaico.provincias(E, 'voto', { altoMax: 280 })}${C.Mosaico.leyendaEs(E, 'voto')}</div>${C.Pantallas.campana.nocheHTML(E, n)}`;
      $('#n-final').innerHTML = bloque; $('#n-mapa').innerHTML = ''; listo();
    };
    if (pj && !dec.balcon) {
      const ganas = n.escanos[pj] >= (n.antes[pj] || 0), prim = pj === lid;
      decision('balcon', prim ? '🎤 Discurso desde el balcón de la sede' : '🎤 Comparecencia ante la militancia', prim ? `Tu partido es la lista más votada con ${n.escanos[pj]} escaños. La militancia espera en la calle.` : `Tu partido queda con ${n.escanos[pj]} escaños (${n.escanos[pj] - (n.antes[pj] || 0) >= 0 ? '+' : ''}${n.escanos[pj] - (n.antes[pj] || 0)}). Toca hablar.`, [
        { k: 'triunfal', t: prim ? 'Un discurso triunfal' : 'Un discurso desafiante', d: prim ? 'Euforia y presión para pactar desde la fortaleza.' : 'Cierras filas, pero parece que no asumes el resultado.', msg: 'Hablas con contundencia ante la militancia.', ef: () => efecto(prim ? { coh: 2, pop: 0.8, pr: 0.5 } : { coh: 1, pop: -0.3, pr: -0.6 }) },
        { k: 'humilde', t: 'Un discurso prudente e institucional', d: 'Tendiendo la mano a todos: tranquiliza a los socios potenciales.', msg: 'Pides responsabilidad y diálogo a todos los partidos.', ef: () => efecto({ pr: 1.1, coh: 0.5, rel: Object.fromEntries(Object.keys(n.escanos).filter(k => k !== pj).map(k => [k, 1.5])) }) },
        { k: 'critico', t: 'Un discurso beligerante contra los rivales', d: 'Reaviva a los tuyos y endurece el ambiente.', msg: 'Cargas contra los rivales.', ef: () => efecto({ coh: 1.5, pop: 0.5, rel: Object.fromEntries(Object.keys(n.escanos).filter(k => k !== pj).map(k => [k, -2.5])) }) }], cierre, C.Escenas ? C.Escenas.html(E, prim || ganas ? 'noche_victoria' : 'noche_derrota', { pid: pj, compacta: true, leyenda: prim ? 'Discurso desde la sede' : 'Comparecencia ante la militancia' }) : '');
    } else cierre();
  };
})(window.ESP);

/* Noche autonómica en directo para la comunidad del jugador: sondeo, escrutinio por tramos, comentarios y discurso. Después se muestra el resumen clásico. */
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo, clamp = U.clamp;
  const orig = C.Pantallas.elecciones.nocheLocales;
  const HORAS = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:15'], TR = [0, 0.12, 0.3, 0.5, 0.7, 0.88, 1];
  C.Pantallas.elecciones.nocheLocales = function (n) {
    const E = C.E, J = E.jugador, a = J && J.pais === 'ES' && J.region && (n.aut || []).find(x => x.c === J.region);
    if (!a) return orig.call(this, n);
    const cc = D().ccaa[a.c], tot = U.suma(Object.values(a.escanos)), may = Math.floor(tot / 2) + 1, pj = J.partido, sg = k => E.partidos[k].sigla;
    const ord = Object.keys(a.votos).sort((x, y) => a.votos[y] - a.votos[x]).filter(k => a.votos[k] > 0.2), ruido = {}; ord.forEach(k => ruido[k] = U.gauss(0, 1));
    const sond = {}; ord.forEach(k => sond[k] = Math.max(0, (a.escanos[k] || 0) + Math.round(U.gauss(0, 1.5))));
    const cuerpo = `<div class="boletin"><span id="na-hora">🕗 Cierre de urnas</span><span id="na-bol"></span></div><div class="barra-h" style="height:6px;margin-bottom:10px"><i id="na-prog" style="width:0;background:var(--oro)"></i></div><div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start"><div id="na-barras"></div><div id="na-hemi"></div></div><div id="na-proy" class="tenue" style="font-size:12.5px;margin:8px 0"></div><div id="na-tele"></div><div id="na-dec"></div><div id="na-final"></div>`;
    const m = UI.modal({ titulo: '🗳 Noche electoral · ' + cc.nombre, cuerpo, clase: 'noche', sinCerrar: true, pie: '<button class="btn" id="na-saltar">Saltar escrutinio ⏭</button><button class="btn prim" id="na-ok" disabled>Continuar</button>' });
    const $ = s => UI.$(s, m.el), tele = [], pushT = (t, tipo) => { tele.unshift({ t, tipo }); if (tele.length > 6) tele.length = 6; $('#na-tele').innerHTML = `<div class="lista" style="font-size:12.5px">${tele.map((x, i) => `<div class="it" style="${i === 0 ? 'background:rgba(227,192,106,.1)' : ''}"><span>${x.tipo === 'alerta' ? '🚨' : x.tipo === 'ok' ? '✅' : '📺'}</span><div class="cuerpo" style="flex:1;white-space:normal">${esc(x.t)}</div></div>`).join('')}</div>`; };
    let paso = 0, timer = null, esperando = false, fin = false;
    const blq = esc_ => H.ordenPartidos(E).filter(k => esc_[k]).map(k => ({ n: esc_[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${esc_[k]}</b></div>` }));
    const dibuja = f => {
      const pct = Math.round(f * 100), vs = {}; let t = 0; ord.forEach(k => { vs[k] = Math.max(0.05, a.votos[k] * (1 + ruido[k] * 0.14 * (1 - f))); t += vs[k]; }); ord.forEach(k => vs[k] = vs[k] * 100 / t);
      $('#na-hora').textContent = '🕗 ' + HORAS[paso]; $('#na-bol').textContent = f ? `Escrutinio ${pct} % · participación ${a.part} %` : `Participación ${a.part} %`; $('#na-prog').style.width = pct + '%';
      $('#na-barras').innerHTML = G.barrasH(ord.slice(0, 7).map(k => ({ etq: Comp.partido(E, k), v: f ? vs[k] : a.votos[k] + ruido[k] * 0.8, color: E.partidos[k].color })), { max: Math.max(...ord.map(k => a.votos[k])) * 1.2, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      const pr = {}; let s = 0; ord.forEach(k => { pr[k] = f ? (a.escanos[k] || 0) * f + (sond[k] || 0) * (1 - f) : sond[k]; s += pr[k]; }); const r = {}; let ss = 0; ord.forEach(k => { r[k] = Math.round(pr[k] * tot / (s || 1)); ss += r[k]; }); const dif = tot - ss; if (dif) r[ord[0]] += dif;
      $('#na-hemi').innerHTML = H.bloques(blq(r), { altoMax: 210, mayoria: may, centroSub: (f ? 'PROYECCIÓN' : 'SONDEO') + ' · MAYORÍA ' + may });
      const top = ord.slice(0, 4).sort((x, y) => r[y] - r[x]); $('#na-proy').innerHTML = top.map(k => `${sg(k)} <b>${r[k]}</b>`).join(' · ') + ` &nbsp;|&nbsp; mayoría absoluta en ${may}`;
      return r;
    };
    const decision = (titulo, texto, ops, cont, escena) => { esperando = true; clearInterval(timer); $('#na-dec').innerHTML = `<div class="tarjeta" style="border-color:var(--oro);margin-top:10px">${escena || ''}<h3>${titulo}</h3><p style="margin:4px 0 8px;font-size:13.5px">${texto}</p><div class="col" style="gap:6px">${ops.map((o, i) => `<button class="btn" data-op="${i}" style="text-align:left;white-space:normal"><b>${esc(o.t)}</b><br><span class="tenue" style="font-size:11.5px">${esc(o.d)}</span></button>`).join('')}</div></div>`;
      UI.$$('[data-op]', m.el).forEach(b => b.onclick = () => { const o = ops[+b.dataset.op]; try { o.ef(); } catch (e) { } $('#na-dec').innerHTML = ''; esperando = false; pushT(o.msg, 'ok'); cont(); }); };
    const ef = (d) => { const pa = E.partidos[pj]; if (d.coh) pa.cohesion = clamp(pa.cohesion + d.coh, 15, 99); C.Personaje.cambiar(E, { prestigio: d.pr || 0, pop: d.pop || 0 }, true); };
    const finNoche = () => {
      fin = true; clearInterval(timer); $('#na-dec').innerHTML = ''; paso = HORAS.length - 1; $('#na-hora').textContent = '🕛 Escrutinio al 100 %'; $('#na-proy').innerHTML = '';
      $('#na-barras').innerHTML = G.barrasH(ord.slice(0, 7).map(k => ({ etq: Comp.partido(E, k), v: a.votos[k], color: E.partidos[k].color })), { max: Math.max(...ord.map(k => a.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      $('#na-hemi').innerHTML = H.bloques(blq(a.escanos), { altoMax: 230, mayoria: may, centroSub: 'ESCAÑOS · MAYORÍA ' + may }) + H.leyendaPartidos(E, a.escanos);
      const lid = ord[0], abs = (a.escanos[lid] || 0) >= may; pushT(abs ? `${sg(lid)} logra la mayoría absoluta en ${cc.nombre}.` : `${sg(lid)} gana en ${cc.nombre} sin mayoría absoluta: toca pactar.`, 'alerta');
      const cierre = () => { $('#na-final').innerHTML = a.personal ? `<div class="nota" style="margin-top:10px"><b>Tu resultado</b><br>${a.personal.electo ? `<span class="bien">✔ Diputado/a autonómico/a</span> (puesto ${a.personal.pos || '—'})` : '<span class="mal">✘ Sin escaño autonómico</span>'}</div>` : ''; $('#na-ok').disabled = false; };
      if (a.escanos[pj] != null || (a.personal && a.personal.cabeza)) { const prim = pj === lid; decision(prim ? '🎤 Discurso desde la sede' : '🎤 Comparecencia ante la militancia', prim ? `Tu partido es la lista más votada en ${cc.nombre} con ${a.escanos[pj]} escaños.` : `Tu partido queda con ${a.escanos[pj] || 0} escaños.`, [
        { t: 'Un discurso ilusionante', d: 'Cierra filas y mejora tu imagen.', msg: 'Hablas con ilusión ante la militancia.', ef: () => ef({ coh: 1.5, pop: 0.6, pr: 0.4 }) },
        { t: 'Un discurso sobrio y responsable', d: 'Tiende la mano a posibles socios.', msg: 'Pides responsabilidad y diálogo.', ef: () => ef({ pr: 0.9, coh: 0.4 }) },
        { t: 'Un discurso duro contra el Gobierno', d: 'Aviva a los tuyos y endurece el clima.', msg: 'Cargas contra el Gobierno autonómico.', ef: () => ef({ coh: 1.2, pop: 0.4 }) }], cierre, C.Escenas ? C.Escenas.html(E, prim ? 'noche_victoria' : 'noche_derrota', { pid: pj, compacta: true, leyenda: prim ? 'Discurso desde la sede' : 'Comparecencia ante la militancia' }) : ''); } else cierre();
    };
    const avanza = () => { if (esperando || fin) return; paso++; if (paso >= TR.length - 1) return finNoche(); const r = dibuja(TR[paso]); const k1 = Object.keys(r).sort((x, y) => r[y] - r[x]); if (paso === 1) pushT(`Primeros datos (${Math.round(TR[paso] * 100)} %): ${sg(k1[0])} lidera la proyección con ${r[k1[0]]} escaños.`); if (r[k1[0]] >= may && paso >= 2) { if (!fin && !tele.some(x => /mayoría absoluta/.test(x.t))) pushT(`${sg(k1[0])} alcanzaría la mayoría absoluta (${r[k1[0]]} escaños).`, 'alerta'); } if (paso === 3 && (r[k1[0]] - r[k1[1]]) <= 3) pushT(`Resultado muy ajustado entre ${sg(k1[0])} y ${sg(k1[1])}.`, 'alerta'); };
    dibuja(0); const k0 = Object.keys(sond).sort((x, y) => sond[y] - sond[x]); pushT(`Sondeo a pie de urna en ${cc.nombre}: ${sg(k0[0])} ganaría con ${sond[k0[0]]} escaños.`, 'alerta');
    const arranca = () => { timer = setInterval(avanza, 1500); };
    decision('🎙 Declaración a las 20:00', `El sondeo da a tu partido ${sond[pj] != null ? sond[pj] : 0} escaños en ${cc.nombre}. Los medios esperan tu primera valoración.`, [
      { t: 'Pedir prudencia', d: 'Sin riesgos.', msg: 'Pides esperar al escrutinio.', ef: () => ef({ pr: 0.4 }) },
      { t: 'Proclamar la victoria', d: 'Si el resultado acompaña, sumas.', msg: 'Te declaras ganador de la noche.', ef: () => ef({ pop: 0.2 }) },
      { t: 'Atacar al Gobierno autonómico', d: 'Movilizas a los tuyos.', msg: 'Lanzas un mensaje duro.', ef: () => ef({ coh: 0.8 }) }], arranca);
    $('#na-saltar').onclick = () => { if (!fin) { esperando = false; finNoche(); } };
    $('#na-ok').onclick = () => { clearInterval(timer); m.cerrar(); orig.call(C.Pantallas.elecciones, n); };
  };
})(window.ESP);

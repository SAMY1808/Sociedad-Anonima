/* Elecciones: generales, autonómicas, municipales y europeas; noches electorales; investidura, apoyo a un candidato y moción de censura. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const VOTO = { si: ['A favor', 'verde'], abs: ['Abstención', 'amar'], no: ['En contra', 'rojo'] };

  const bloquesPartidos = (E, escanos) => H.ordenPartidos(E).filter(k => escanos[k]).map(k => ({ n: escanos[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${escanos[k]}</b></div>` }));

  const El = C.Pantallas.elecciones = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      const tab = (params && params.tab) || E.ui.tabEl || 'generales';
      E.ui.tabEl = tab;
      let cuerpo = '';
      if (tab === 'generales') cuerpo = El.generales(E);
      else if (tab === 'autonomicas') cuerpo = El.autonomicas(E);
      else if (tab === 'campana') cuerpo = C.Pantallas.campana.render(E);
      else if (tab === 'investidura') cuerpo = C.Pantallas.invest.calendario(E);
      else if (tab === 'municipales') cuerpo = El.municipales(E);
      else cuerpo = El.europeas(E);
      el.innerHTML = `<div class="cab"><div><h1>🗳 Elecciones</h1><div class="sub">Generales ${E.esp.cortes.estado === 'disueltas' ? '<span class="alerta">convocadas el ' + U.fmtT(E.esp.cortes.proxT) + '</span>' : 'como tarde el ' + U.fmtT(E.esp.cortes.finMax)} · municipales ${U.fmtT(E.esp.muni.proxT, true)} · europeas ${U.fmtT(E.ue.proxPE, true)}</div></div></div>
        ${J.campania ? `<div class="tarjeta" style="border-color:var(--oro);margin-bottom:14px"><div class="t-cab"><h3>📣 Campaña en marcha ${J.campania.tipo === 'aut' ? '(autonómicas)' : J.campania.tipo === 'mun' ? '(municipales)' : '(generales)'}</h3><span class="etq oro">${Math.round(J.campania.pts)} puntos de campaña · ${J.campania.mitines} mítines</span></div><p class="tenue" style="margin:0 0 10px;font-size:13px">Cada punto de campaña suma votos a tu partido y mejora tu puesto en la lista.</p><div class="fila">${UI.botonAccion('mitin', {}, '📣 Mitin de campaña', 'prim')}${UI.botonAccion('entrevista', {}, '📺 Entrevista', '')}${UI.botonAccion('redes', {}, '📱 Redes', '')}</div></div>` : ''}
        <div class="tabs">${[['generales', 'Generales'], ['campana', 'Campaña'], ['autonomicas', 'Autonómicas'], ['investidura', 'Investidura'], ['municipales', 'Municipales'], ['europeas', 'Europeas']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'activo' : ''}">${n}</button>`).join('')}</div>${cuerpo}`;
      UI.$$('[data-tab]', el).forEach(b => b.onclick = () => C.App.ir('elecciones', { tab: b.dataset.tab }));
      const sr = UI.$('#el-reg', el); if (sr) sr.onchange = () => { E.ui.regEl = sr.value; C.App.refrescar(); };
      C.Pantallas.invest.enlazar(el); C.Pantallas.campana.enlazar(el);
      UI.$$('[data-ccaa]', el).forEach(b => b.onclick = () => C.Pantallas.territorio.verCcaa(b.dataset.ccaa));
    },

    generales(E) {
      const J = E.jugador, P = E.paises.ES, cs = E.esp.cortes, S = E.series;
      const enc = C.Generales.encuesta(E, 0.5), proy = C.Generales.proyeccion(E), ult = P.elec.ultima;
      const top = P.partidos.slice().sort((a, b) => enc[b] - enc[a]);
      const series = top.slice(0, 6).map(k => ({ nombre: E.partidos[k].sigla, color: E.partidos[k].color, datos: (S['pop:' + k] || []).slice(-110) }));
      const sem = C.Generales.semanasHasta(E);
      const dis = C.Generales.puedeDisolver(E);
      return `<div class="grid g-dash"><div class="col"><div class="tarjeta"><h3>Evolución de las encuestas (% voto)</h3>${G.linea(series, { alto: 210, unidad: ' %' })}</div>
          <div class="tarjeta"><h3>Última elección${ult ? ' · ' + U.fmtT(ult.t, true) : ''}</h3>${ult ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">Participación ${ult.part} %</div>${G.barrasH(P.partidos.slice().sort((a, b) => ult.votos[b] - ult.votos[a]).slice(0, 10).map(k => ({ etq: Comp.partido(E, k), v: ult.votos[k], color: E.partidos[k].color })), { max: Math.max(...Object.values(ult.votos)) * 1.1, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' })}` : '<div class="vacio">Sin datos</div>'}</div></div>
        <div class="col"><div class="tarjeta"><h3>Proyección de escaños (encuesta de hoy)</h3>${H.bloques(bloquesPartidos(E, proy), { altoMax: 260, mayoria: 176, centroSub: 'ESCAÑOS · MAYORÍA 176' })}
          <table class="tabla" style="margin-top:6px"><thead><tr><th>Partido</th><th class="num">Voto</th><th class="num">Escaños</th><th class="num">Hoy</th></tr></thead><tbody>${top.slice(0, 12).map(k => `<tr${k === J.partido ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${Comp.partido(E, k)}</td><td class="num">${U.d1(enc[k])} %</td><td class="num"><b>${proy[k] || 0}</b></td><td class="num ${(proy[k] || 0) - (P.escanos[k] || 0) > 0 ? 'bien' : (proy[k] || 0) - (P.escanos[k] || 0) < 0 ? 'mal' : 'tenue'}">${U.signo((proy[k] || 0) - (P.escanos[k] || 0), 0)}</td></tr>`).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Sistema electoral</h3><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:140px">Circunscripciones</span><b>52 (50 provincias, Ceuta y Melilla)</b></div><div class="it"><span class="tenue" style="width:140px">Fórmula</span><b>D'Hondt · umbral ${E.esp.um != null ? E.esp.um : 3} % por circunscripción</b></div><div class="it"><span class="tenue" style="width:140px">Legislatura</span><b>4 años · fin ${U.fmtT(cs.finMax)}</b></div><div class="it"><span class="tenue" style="width:140px">Adelanto electoral</span><b>${dis === true ? '<span class="bien">posible</span>' : '<span class="tenue">' + esc(dis) + '</span>'}</b></div></div>
            ${J.cargo === 'pm' ? `<div class="fila" style="margin-top:8px">${UI.botonAccion('disolver_cortes', {}, '🗳 Disolver las Cortes', 'chico')}</div>` : ''}</div></div></div>
        <div class="tarjeta" style="margin-top:14px"><h3>Mapa de provincias (última elección)</h3>${C.Mosaico.provincias(E, 'voto', { altoMax: 400 })}${C.Mosaico.leyendaEs(E, 'voto')}</div>
        ${E.elecciones.historico.filter(h => h.tipo === 'generales').length ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial de generales en tu partida</h3><div class="lista" style="font-size:13px">${E.elecciones.historico.filter(h => h.tipo === 'generales').map(h => `<div class="it"><span class="tenue" style="width:96px">${U.fmtT(h.t, true)}</span><div class="cuerpo"><b>${P.partidos.slice().sort((a, b) => h.votos[b] - h.votos[a]).slice(0, 4).map(k => E.partidos[k].sigla + ' ' + U.d1(h.votos[k]) + ' %').join(' · ')}</b><span>Participación ${h.part} %</span></div></div>`).join('')}</div></div>` : ''}`;
    },

    autonomicas(E) {
      const ids = C.Territorio.ids().sort((a, b) => E.esp.ccaa[a].parl.proxT - E.esp.ccaa[b].parl.proxT);
      const reg = E.ui.regEl || E.jugador.region || ids[0], rc = E.esp.ccaa[reg], d = D().ccaa[reg];
      const v = C.Territorio.votosReg(E, reg, 0), proy = C.Territorio.simular(E, reg, { ruido: 0 });
      const tot = U.suma(Object.values(rc.parl.escanos)), may = Math.floor(tot / 2) + 1;
      return `<div class="grid g-dash"><div class="tarjeta"><div class="t-cab"><h3>Calendario autonómico</h3></div><table class="tabla apila"><thead><tr><th>Comunidad</th><th>Fecha</th><th>Gobierno</th></tr></thead><tbody>${ids.map(c => { const r = E.esp.ccaa[c]; return `<tr class="clic" data-ccaa="${c}"><td><b>${esc(D().ccaa[c].nombre)}</b></td><td>${U.fmtT(r.parl.proxT, true)} <span class="tenue">(${Comp.semanasA(E, r.parl.proxT)})</span></td><td>${r.gob ? Comp.partido(E, r.gob.partido) : '—'}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="tarjeta"><div class="t-cab"><h3>Encuesta · ${esc(d.nombre)}</h3><select id="el-reg">${ids.map(c => `<option value="${c}" ${c === reg ? 'selected' : ''}>${esc(D().ccaa[c].nombre)}</option>`).join('')}</select></div>
          ${H.bloques(Object.keys(proy.escanos).filter(k => proy.escanos[k]).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).map(k => ({ n: proy.escanos[k], color: E.partidos[k].color, tt: esc(E.partidos[k].nombre) })), { altoMax: 240, mayoria: may, centroSub: 'ESCAÑOS · MAYORÍA ' + may })}
          <table class="tabla" style="margin-top:6px"><thead><tr><th>Partido</th><th class="num">Voto</th><th class="num">Escaños</th><th class="num">Hoy</th></tr></thead><tbody>${Object.keys(v).sort((a, b) => v[b] - v[a]).slice(0, 8).map(k => `<tr><td>${Comp.partido(E, k)}</td><td class="num">${U.d1(v[k])} %</td><td class="num"><b>${proy.escanos[k] || 0}</b></td><td class="num ${(proy.escanos[k] || 0) - (rc.parl.escanos[k] || 0) > 0 ? 'bien' : (proy.escanos[k] || 0) - (rc.parl.escanos[k] || 0) < 0 ? 'mal' : 'tenue'}">${U.signo((proy.escanos[k] || 0) - (rc.parl.escanos[k] || 0), 0)}</td></tr>`).join('')}</tbody></table>
          <div class="tenue" style="font-size:12px;margin-top:6px">Umbral ${d.um} % · elecciones ${U.fmtT(rc.parl.proxT)}</div></div></div>`;
    },

    municipales(E) {
      const res = E.esp.muni.resumen, mm = E.esp.muni;
      const ciudades = Object.values(mm.m).filter(m => m.pob >= 300).sort((a, b) => b.pob - a.pob);
      return `<div class="grid g-dash"><div class="tarjeta"><h3>Grandes ciudades</h3><table class="tabla apila"><thead><tr><th>Ciudad</th><th>Alcaldía</th><th>Aprob.</th><th>Voto previsto</th></tr></thead><tbody>${ciudades.map(m => { const v = C.Municipios.votos(E, m.id, 0), top = Object.keys(v).sort((a, b) => v[b] - v[a]).slice(0, 2); return `<tr><td><b>${esc(m.nombre)}</b></td><td>${Comp.partido(E, m.alcalde)}</td><td class="num">${Math.round(m.aprob)}</td><td>${top.map(k => Comp.partido(E, k) + ' ' + U.d1(v[k]) + ' %').join(' · ')}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="col"><div class="tarjeta"><h3>Última cita municipal</h3><div class="tenue" style="font-size:12.5px;margin-bottom:6px">${U.fmtT(mm.ult, true)} · próximas ${U.fmtT(mm.proxT)} (${Comp.semanasA(E, mm.proxT)})</div>${G.barrasH(Object.keys(res.alcRes).sort((a, b) => res.alcRes[b] - res.alcRes[a]).slice(0, 8).map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: res.alcRes[k], color: k === 'IND' ? '#7D8799' : E.partidos[k].color })), { max: Math.max(...Object.values(res.alcRes)) * 1.05, fmt: v => U.n(v) + ' alc.', anchoEtq: '70px', anchoValor: '70px' })}</div></div></div>`;
    },

    europeas(E) {
      const ue = E.ue, del = ue.pe.porPais.ES || {}, J = E.jugador;
      return `<div class="grid g2"><div class="tarjeta"><h3>Parlamento Europeo · próxima cita ${U.fmtT(ue.proxPE)}</h3>${H.europeo(E, { altoMax: 280 })}</div>
        <div class="tarjeta"><h3>Delegación española (${U.suma(Object.values(del))} eurodiputados)</h3><div class="lista" style="font-size:13px">${Object.entries(del).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="it">${Comp.partido(E, k, true)}<span class="tenue" style="margin-left:auto">${n} · ${D().grupos[E.partidos[k].grupo].sigla}</span></div>`).join('')}</div>
          <p class="tenue" style="font-size:12.5px;margin:8px 0 0">España es una circunscripción única sin umbral. ${UI.botonAccion('candidatura_pe', {}, '🗳 Pedir un puesto en la lista europea', 'chico')}</p></div></div>`;
    },

    /* ── Noche electoral de las generales ── */
    noche(n) {
      const E = C.E, P = E.paises.ES, J = E.jugador;
      const orden = P.partidos.slice().sort((a, b) => n.votos[b] - n.votos[a]).filter(k => n.votos[k] > 0.15);
      const ruido = {}; orden.forEach(k => ruido[k] = U.gauss(0, 1));
      const cuerpo = `<div class="boletin"><span id="n-bol">Escrutinio · mesas informadas 0 %</span><span>Participación ${n.part} %</span></div><div class="barra-h" style="height:6px;margin-bottom:12px"><i id="n-prog" style="width:0;background:var(--oro)"></i></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start"><div id="n-barras"></div><div id="n-hemi" style="opacity:.25">${H.bloques([{ n: 350, color: '#26354f' }], { altoMax: 260, centroSub: 'ESCAÑOS' })}</div></div><div id="n-final"></div>`;
      const m = UI.modal({ titulo: '🗳 Noche electoral · Elecciones generales', cuerpo, clase: 'noche', sinCerrar: true, pie: '<button class="btn" id="n-saltar">Saltar escrutinio ⏭</button><button class="btn prim" id="n-cerrar" disabled>Continuar</button>' });
      const $ = s => UI.$(s, m.el);
      let paso = 0; const N = 26;
      const pintar = (f) => {
        const mi = Math.round(f * 100);
        $('#n-bol').textContent = `Escrutinio · mesas informadas ${mi} %`; $('#n-prog').style.width = mi + '%';
        const vs = {}; let t = 0;
        orden.forEach(k => { vs[k] = Math.max(0.05, n.votos[k] * (1 + ruido[k] * 0.12 * (1 - f))); t += vs[k]; });
        orden.forEach(k => vs[k] = vs[k] * 100 / t);
        $('#n-barras').innerHTML = G.barrasH(orden.slice(0, 9).map(k => ({ etq: Comp.partido(E, k), v: vs[k], color: E.partidos[k].color })), { max: Math.max(...orden.map(k => n.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      };
      const h = setInterval(() => { paso++; if (paso >= N) fin(); else pintar(paso / N); }, 170);
      const fin = () => {
        clearInterval(h); pintar(1);
        $('#n-bol').textContent = 'Escrutinio · 100 % de las mesas'; $('#n-prog').style.width = '100%';
        $('#n-barras').innerHTML = G.barrasH(orden.slice(0, 9).map(k => ({ etq: Comp.partido(E, k), v: n.votos[k], color: E.partidos[k].color, tt: `<b>${esc(E.partidos[k].nombre)}</b><br>${U.d1(n.votos[k])} % · ${n.escanos[k] || 0} escaños${n.previo ? ' · antes ' + U.d1(n.previo[k] || 0) + ' %' : ''}` })), { max: Math.max(...orden.map(k => n.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
        $('#n-hemi').style.opacity = 1; $('#n-hemi').innerHTML = H.bloques(bloquesPartidos(E, n.escanos), { altoMax: 270, mayoria: 176, centroSub: 'ESCAÑOS · MAYORÍA 176' }) + H.leyendaPartidos(E, n.escanos);
        const pers = n.personal;
        const bl = U.suma(Object.keys(n.escanos).filter(k => E.partidos[k].ter != null && E.partidos[k].postura === 'gobierno').map(k => n.escanos[k]));
        $('#n-final').innerHTML = `<div class="grid g2" style="margin-top:14px"><div class="nota"><b>Tu resultado</b><br>${!pers ? 'Tu escaño no estaba en juego en estas elecciones.' : pers.ue ? 'Estás en la política europea; tu escaño nacional no está en juego.' : pers.electo ? `<span class="bien">✔ Diputado/a</span> con el puesto ${pers.pos} en tu circunscripción (${pers.circ} escaños de tu partido ahí, ${pers.escanos} en total).` : `<span class="mal">✘ Sin escaño</span>: puesto ${pers.pos} y ${pers.circ} escaños de tu partido en la circunscripción.`}</div>
          <div class="nota"><b>Y ahora…</b><br>Se constituyen las Cortes, el Rey inicia las consultas y se abre el plazo de investidura. Si pasan <b>dos meses</b> desde la primera votación sin presidente, se disuelven de nuevo las Cortes.</div></div>
          <div class="tarjeta" style="margin-top:10px"><h3>Mapa de provincias</h3>${C.Mosaico.provincias(E, 'voto', { altoMax: 300 })}${C.Mosaico.leyendaEs(E, 'voto')}</div>${C.Pantallas.campana.nocheHTML(E, n)}`;
        $('#n-cerrar').disabled = false; $('#n-saltar').disabled = true;
      };
      $('#n-saltar').onclick = fin;
      $('#n-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
      pintar(0);
    },

    /* ── Noche autonómica y municipal ── */
    nocheLocales(n) {
      const E = C.E, J = E.jugador;
      const aut = n.aut || [];
      const tarjetaAut = a => { const d = D().ccaa[a.c], tot = U.suma(Object.values(a.escanos)), may = Math.floor(tot / 2) + 1; const gan = Object.keys(a.votos).sort((x, y) => a.votos[y] - a.votos[x])[0]; return `<div class="tarjeta"><div class="t-cab"><h3>${esc(d.nombre)}</h3><span class="etq">Participación ${a.part} %</span></div>${H.bloques(Object.keys(a.escanos).filter(k => a.escanos[k]).sort((x, y) => E.partidos[x].eco - E.partidos[y].eco).map(k => ({ n: a.escanos[k], color: E.partidos[k].color, tt: esc(E.partidos[k].nombre) })), { altoMax: 170, mayoria: may, centroSub: 'MAYORÍA ' + may })}
        <div class="tenue" style="font-size:12px;margin-top:4px">Más votado: ${Comp.partido(E, gan)} (${U.d1(a.votos[gan])} %) · favorito/a a la investidura: ${Comp.partido(E, a.gob.partido)}${a.gob.coalicion.length > 1 ? ' con ' + a.gob.coalicion.filter(k => k !== a.gob.partido).map(k => Comp.partido(E, k)).join(' ') : ''}</div>${a.personal ? `<div class="nota" style="margin-top:6px">${a.personal.electo ? `<span class="bien">✔ ${a.personal.presidente ? 'Presidente/a de la comunidad' : 'Escaño autonómico'}</span> · puesto ${a.personal.pos}` : `<span class="mal">✘ Sin escaño</span> · puesto ${a.personal.pos}`}</div>` : ''}</div>`; };
      const mun = n.mun;
      const cuerpo = `${mun ? `<div class="tarjeta" style="margin-bottom:12px"><h3>Elecciones municipales</h3>${G.barrasH(Object.keys(mun.alcRes || mun.alc).sort((a, b) => (mun.alcRes || mun.alc)[b] - (mun.alcRes || mun.alc)[a]).slice(0, 7).map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: (mun.alcRes || mun.alc)[k], color: k === 'IND' ? '#7D8799' : E.partidos[k].color })), { max: Math.max(...Object.values(mun.alcRes || mun.alc)) * 1.05, fmt: v => U.n(v) + ' alc.', anchoEtq: '70px', anchoValor: '80px' })}
          <div class="lista" style="font-size:12.5px;margin-top:6px">${(mun.ciudades || []).slice(0, 8).map(c => `<div class="it"><b style="width:150px">${esc(c.nombre)}</b>${Comp.partido(E, c.alcalde)}<span class="tenue" style="margin-left:6px">${c.coal.length > 1 ? 'con pacto' : 'mayoría simple/absoluta'}</span></div>`).join('')}</div>
          ${mun.personal ? `<div class="nota" style="margin-top:8px"><b>Tu resultado municipal</b><br>${mun.personal.alcalde ? '<span class="bien">🎉 Eres investido/a alcalde/sa</span>' : mun.personal.electo ? `<span class="bien">✔ Concejal/a</span> (${mun.personal.escanos} ediles de tu partido)` : '<span class="mal">✘ Sin acta de concejal/a</span>'}</div>` : ''}</div>` : ''}
        <div class="grid g2" style="gap:12px">${aut.map(tarjetaAut).join('')}</div>`;
      const m = UI.modal({ titulo: '🗳 Jornada electoral · autonómicas y municipales', cuerpo, clase: 'noche', sinCerrar: true, pie: '<button class="btn prim" id="nl-ok">Continuar</button>' });
      UI.$('#nl-ok', m.el).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    },

    /* ── Constructor de bloques (investidura y moción de censura) ── */
    bloqueModal(modo) {
      const E = C.E, J = E.jugador, P = E.paises.ES, Ej = C.Ejecutivo, cand = J.partido, censura = modo === 'censura';
      const sel = new Set([cand]), acept = {};
      const partes = P.partidos.filter(k => k !== cand && (P.escanos[k] || 0) > 0).sort((a, b) => P.escanos[b] - P.escanos[a]);
      const plan = () => ({ cand, bloque: [...sel], aceptadas: acept, coste: 0 });
      const demandasDe = k => { const perf = D().perfilSocios[E.partidos[k].sigla] || { req: [], extra: [] }; return { req: perf.req, extra: perf.extra.concat(perf.req.includes('ministerios') ? [] : ['ministerios']) }; };
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">${censura ? `Moción de censura <b>constructiva</b>: necesitas <b>176 votos a favor</b>; si prospera, el Gobierno cae y tú te conviertes en presidente/a.` : 'El Rey te propone como candidato. Negocia tu bloque: cada socio exige contrapartidas; algunos son tabú para tu perfil y otros vetan a determinados socios.'}</p>
        <div class="fila" style="margin-bottom:6px"><b>Voto previsto:</b> <span id="b-res" class="num"></span></div><div id="b-barra"></div><div id="b-sumario" class="tenue" style="font-size:12px;margin:4px 0 8px"></div>
        <div class="lista" id="b-lista">${partes.map(k => { const p = E.partidos[k], dm = demandasDe(k), perfReq = dm.req; const row = d => { const dd = D().demandas[d], tabu = dd.tabu(E.partidos[cand]); return `<label style="display:inline-flex;gap:4px;align-items:center;font-size:12px;margin:2px 8px 2px 0;${tabu ? 'opacity:.45' : ''}"${tabu ? UI.tt('Tu partido no puede aceptarlo') : UI.tt('Coste político ' + dd.coste)}><input type="checkbox" data-k="${k}" data-d="${d}" ${tabu ? 'disabled' : ''}> ${dd.icono} ${esc(dd.nombre)}${perfReq.includes(d) ? ' <b class="oro">★</b>' : ''}</label>`; }; return `<div class="it" style="flex-direction:column;align-items:stretch;gap:4px" data-fila="${k}"><div class="fila" style="gap:8px;flex-wrap:nowrap"><label style="display:flex;gap:8px;align-items:center;cursor:pointer;flex:1"><input type="checkbox" data-incl="${k}"><span class="pto" style="background:${p.color}"></span><div class="cuerpo"><b>${esc(p.nombre)}</b><span>${P.escanos[k]} escaños · ${Comp.ideoTxt(p)}, ${Comp.terTxt(p.ter)}</span></div></label><span class="etq" id="b-e-${k}"></span></div><div style="padding-left:30px">${dm.req.map(row).join('')}${dm.extra.map(row).join('')}</div></div>`; }).join('')}</div>
        <div id="b-aviso" class="nota" style="margin-top:10px;display:none"></div>`;
      const m = UI.modal({ titulo: censura ? '⚡ Moción de censura' : '🤝 Investidura: forma tu bloque', cuerpo, clase: 'medio', pie: `<button class="btn" id="b-no">${censura ? 'Retirar la moción' : 'Renunciar a la investidura'}</button><button class="btn prim" id="b-ok">${censura ? 'Presentar la moción' : 'Someterme a la votación'}</button>` });
      const calc = () => {
        const pl = plan(); pl.coste = U.suma(Object.values(acept).flat().map(d => D().demandas[d].coste));
        const ev = Ej.evaluar(E, cand, pl); pl.ev = ev; return { pl, ev };
      };
      const act = () => {
        const { pl, ev } = calc();
        UI.$('#b-res', m.el).textContent = `${ev.si} a favor · ${ev.no} en contra · ${ev.abs} abstenciones`;
        UI.$('#b-barra', m.el).innerHTML = G.apilada([{ etq: 'A favor', v: ev.si, color: 'var(--si)' }, { etq: 'Abstención', v: ev.abs, color: 'var(--abs)' }, { etq: 'En contra', v: ev.no, color: 'var(--no)' }], { total: 350, mayoria: 176, alto: 20 });
        UI.$('#b-sumario', m.el).innerHTML = (ev.exito1 ? '<b class="bien">✔ Mayoría absoluta (176): prosperaría en primera votación.</b>' : ev.exito2 && !censura ? '<b class="alerta">✔ Mayoría simple: prosperaría en segunda votación (48 h después).</b>' : `<b class="mal">✘ No hay mayoría suficiente (faltan ${176 - ev.si} para 176).</b>`) + ` · Coste político de las contrapartidas: <b>${pl.coste}</b>`;
        partes.forEach(k => { const e = UI.$('#b-e-' + k, m.el), s = ev.est[k]; if (e) { e.className = 'etq ' + VOTO[s][1]; e.textContent = VOTO[s][0]; } });
      };
      UI.$$('[data-incl]', m.el).forEach(c => c.onchange = () => { if (c.checked) sel.add(c.dataset.incl); else sel.delete(c.dataset.incl); act(); });
      UI.$$('[data-d]', m.el).forEach(c => c.onchange = () => { const k = c.dataset.k; acept[k] = acept[k] || []; if (c.checked) { if (!acept[k].includes(c.dataset.d)) acept[k].push(c.dataset.d); const ic = UI.$(`[data-incl="${k}"]`, m.el); if (!ic.checked) { ic.checked = true; sel.add(k); } } else acept[k] = acept[k].filter(x => x !== c.dataset.d); act(); });
      // Marca automática del mejor plan conocido
      const auto = censura ? Ej.mejorPlan(E, cand) : (E.esp.cortes.investidura && E.esp.cortes.investidura.plan) || Ej.mejorPlan(E, cand);
      auto.bloque.forEach(k => { if (k === cand) return; sel.add(k); const ic = UI.$(`[data-incl="${k}"]`, m.el); if (ic) ic.checked = true; });
      for (const k in auto.aceptadas) { acept[k] = auto.aceptadas[k].slice(); auto.aceptadas[k].forEach(d => { const cb = UI.$(`[data-k="${k}"][data-d="${d}"]`, m.el); if (cb) cb.checked = true; }); }
      act();
      UI.$('#b-no', m.el).onclick = () => { m.cerrar(); if (!censura) Ej.renunciarInvestidura(E); C.App.refrescar(); C.App.revisarPendientes(); };
      UI.$('#b-ok', m.el).onclick = () => {
        const { pl, ev } = calc();
        const av = UI.$('#b-aviso', m.el);
        if (censura) {
          if (!ev.exito1) { av.style.display = 'block'; av.innerHTML = '<b class="mal">Sin 176 votos la moción decaería y perderías prestigio.</b> Pulsa de nuevo para presentarla igualmente.'; if (!m._forzar) { m._forzar = true; return; } }
          m.cerrar(); Ej.presentarMocion(E, pl); C.Personaje.cambiar(E, { prestigio: 2, pop: 1 }, true); UI.toast('Has registrado una moción de censura: se votará la próxima semana.', 'bien');
        } else { m.cerrar(); Ej.investidurJugador(E, pl); }
        C.App.refrescar(); C.App.revisarPendientes();
      };
    },

    investidura() { C.Pantallas.elecciones.bloqueModal('investidura'); },
    consultas(modo) { C.Pantallas.elecciones.bloqueModal(modo || 'investidura'); },

    /* Líder de un partido bisagra: decide el voto de su grupo y puede exigir contrapartidas. */
    socio() {
      const E = C.E, J = E.jugador, inv = E.esp.cortes.investidura; if (!inv) { E.esp.pendienteSocio = false; return C.App.revisarPendientes(); }
      const P = E.paises.ES, cand = inv.cand, lid = E.politicos[E.partidos[cand].lider];
      const perf = D().perfilSocios[E.partidos[J.partido].sigla] || { req: [], extra: [] };
      const dems = perf.req.concat(perf.extra).filter((v, i, a) => a.indexOf(v) === i && v !== 'ministerios');
      const ev = C.Ejecutivo.evaluar(E, cand, inv.plan);
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">${esc(lid ? lid.n : '')} (${esc(E.partidos[cand].sigla)}) se presenta a la investidura. Tu grupo (${P.escanos[J.partido]} diputados) puede decidir el resultado.</p>
        ${G.apilada([{ etq: 'A favor', v: ev.si, color: 'var(--si)' }, { etq: 'Abstención', v: ev.abs, color: 'var(--abs)' }, { etq: 'En contra', v: ev.no, color: 'var(--no)' }], { total: 350, mayoria: 176, alto: 18 })}<div class="tenue" style="font-size:12px;margin:4px 0 10px">Sin tu apoyo: ${ev.si} sí · ${ev.no} no · ${ev.abs} abstenciones.</div>
        <h3 style="font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase;margin:0 0 6px">Contrapartidas que exiges</h3>
        <div class="col" style="gap:4px">${dems.map(d => { const dd = D().demandas[d], tabu = dd.tabu(E.partidos[cand]); return `<label style="display:flex;gap:6px;align-items:center;${tabu ? 'opacity:.45' : ''}"><input type="checkbox" data-d="${d}" ${tabu ? 'disabled' : ''}> ${dd.icono} <b>${esc(dd.nombre)}</b> <span class="tenue">· ${tabu ? 'tabú para el candidato' : 'coste ' + dd.coste}</span></label>`; }).join('')}</div>
        <div class="voto-btns" style="margin-top:12px"><button class="btn si" data-v="si"><b>Votar a favor</b><span class="tenue" style="font-size:11px">con las contrapartidas marcadas</span></button><button class="btn abs" data-v="abs"><b>Abstenerme</b></button><button class="btn no" data-v="no"><b>Votar en contra</b></button></div>`;
      const m = UI.modal({ titulo: '🗳 Investidura: tu voto', icono: '🤝', cuerpo, clase: 'medio', sinCerrar: true });
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('[data-v]'); if (!b) return;
        const ds = UI.$$('[data-d]:checked', m.el).map(c => c.dataset.d);
        m.cerrar();
        C.Ejecutivo.socioJugador(E, b.dataset.v, ds);
        UI.toast(b.dataset.v === 'si' ? (ds.length ? 'Apoyarás al candidato a cambio de tus contrapartidas.' : 'Apoyarás al candidato.') : b.dataset.v === 'abs' ? 'Tu grupo se abstendrá.' : 'Votarás en contra.', 'bien');
        C.App.refrescar(); C.App.revisarPendientes();
      });
    }
  };
})(window.ESP);

/* Elecciones: encuestas, proyección de escaños, resultados y noche electoral. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const SIS = { prop: 'Sistema proporcional', mayor: 'Sistema mayoritario (circunscripciones uninominales)', mixto: 'Sistema mixto' };

  const bloquesPartidos = (E, escanos) => {
    const P = E.paises[E.jugador.pais];
    const orden = H.ordenPartidos(E).filter(k => escanos[k]);
    return orden.map(k => ({ n: escanos[k], color: E.partidos[k].color, tt: `<div class="tt-t">${esc(E.partidos[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${escanos[k]}</b></div>` }));
  };

  const El = C.Pantallas.elecciones = {
    render(el) {
      const E = C.E, J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais];
      const enc = C.Opinion.encuesta(E, J.pais, 0.5);
      const proy = C.Elecciones.reparto(E, J.pais, enc, d.esc);
      const ult = P.elec.ultima, S = E.series;
      const top = P.partidos.slice().sort((a, b) => enc[b] - enc[a]);
      const series = top.slice(0, 6).map(k => ({ nombre: E.partidos[k].sigla, color: E.partidos[k].color, datos: (S['pop:' + k] || []).slice(-110) }));
      const sist = Object.assign({}, d, P.sist || {});
      const sem = C.Elecciones.semanasHasta(E, J.pais);
      const maj = Math.floor(d.esc / 2) + 1;
      el.innerHTML = `<div class="cab"><div><h1>Elecciones</h1><div class="sub">${d.bandera} ${esc(d.nombre)} · ${P.flags.leyMarcial ? 'aplazadas por la ley marcial' : 'próxima cita el ' + U.fmtT(P.elec.proxT) + ' (' + Comp.semanasA(E, P.elec.proxT) + ')'}${P.flags.anticipada ? ' · <span class="alerta">anticipadas</span>' : ''}${P.pres ? ' · presidenciales ' + Comp.semanasA(E, P.pres.proxT) : ''}</div></div></div>
        ${J.campania ? `<div class="tarjeta" style="border-color:var(--oro);margin-bottom:14px"><div class="t-cab"><h3>📣 Campaña en marcha</h3><span class="etq oro">${Math.round(J.campania.pts)} puntos de campaña · ${J.campania.mitines} mítines</span></div><p class="tenue" style="margin:0 0 10px;font-size:13px">Cada punto de campaña suma votos a tu partido y mejora tu puesto en la lista. Faltan ${sem} semanas.</p><div class="fila">${UI.botonAccion('mitin', {}, '📣 Mitin de campaña', 'prim')}${UI.botonAccion('entrevista', {}, '📺 Entrevista', '')}${UI.botonAccion('redes', {}, '📱 Redes', '')}</div></div>` : ''}
        <div class="grid g-dash"><div class="col"><div class="tarjeta"><h3>Evolución de las encuestas (%)</h3>${G.linea(series, { alto: 210, unidad: ' %' })}</div>
          <div class="tarjeta"><h3>Última elección${ult ? ' · ' + U.fmtT(ult.t, true) : ''}</h3>${ult ? `<div class="tenue" style="font-size:12px;margin-bottom:6px">Participación ${ult.part} %</div>${G.barrasH(P.partidos.slice().sort((a, b) => ult.votos[b] - ult.votos[a]).map(k => ({ etq: Comp.partido(E, k), v: ult.votos[k], color: E.partidos[k].color, sub: ult.escanos[k] })), { max: Math.max(...Object.values(ult.votos)) * 1.1, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' })}` : '<div class="vacio">Sin datos</div>'}</div></div>
        <div class="col"><div class="tarjeta"><h3>Proyección de escaños (encuesta de hoy)</h3>${H.bloques(bloquesPartidos(E, proy), { altoMax: 260, mayoria: maj, centroSub: 'ESCAÑOS · MAYORÍA ' + maj })}
          <table class="tabla" style="margin-top:6px"><thead><tr><th>Partido</th><th class="num">Encuesta</th><th class="num">Escaños</th><th class="num">Hoy</th></tr></thead><tbody>${top.map(k => `<tr${k === J.partido ? ' style="background:rgba(217,180,90,.1)"' : ''}><td>${Comp.partido(E, k)}</td><td class="num">${U.d1(enc[k])} %</td><td class="num"><b>${proy[k] || 0}</b></td><td class="num ${(proy[k] || 0) - (P.escanos[k] || 0) > 0 ? 'bien' : (proy[k] || 0) - (P.escanos[k] || 0) < 0 ? 'mal' : 'tenue'}">${U.signo((proy[k] || 0) - (P.escanos[k] || 0), 0)}</td></tr>`).join('')}</tbody></table></div>
          <div class="tarjeta"><h3>Sistema electoral</h3><div class="lista" style="font-size:13px"><div class="it"><span class="tenue" style="width:130px">Tipo</span><b>${SIS[sist.sis]}</b></div><div class="it"><span class="tenue" style="width:130px">Umbral</span><b>${sist.um ? U.d1(sist.um) + ' %' : 'Sin umbral'}</b></div><div class="it"><span class="tenue" style="width:130px">Fórmula</span><b>${sist.form === 'sl' ? 'Sainte-Laguë' : "D'Hondt"}${sist.k > 1.05 ? ' · circunscripciones pequeñas (favorece a los grandes)' : ''}</b></div><div class="it"><span class="tenue" style="width:130px">Legislatura</span><b>${d.mand} años</b></div></div>
          <p class="tenue" style="font-size:12px;margin:8px 0 0">${J.cargo === 'pm' ? 'Como jefe/a de Gobierno puedes convocar elecciones anticipadas:' : ''}</p>${J.cargo === 'pm' ? UI.botonAccion('elecciones_anticipadas', {}, '🗳 Convocar elecciones', 'chico') : ''}</div></div></div>
        ${E.elecciones.historico.length ? `<div class="tarjeta" style="margin-top:14px"><h3>Historial de elecciones en tu partida</h3><div class="lista" style="font-size:13px">${E.elecciones.historico.map(h => `<div class="it"><span class="tenue" style="width:96px">${U.fmtT(h.t, true)}</span><div class="cuerpo"><b>${P.partidos.slice().sort((a, b) => h.votos[b] - h.votos[a]).slice(0, 3).map(k => E.partidos[k].sigla + ' ' + U.d1(h.votos[k]) + ' %').join(' · ')}</b><span>Participación ${h.part} %</span></div></div>`).join('')}</div></div>` : ''}`;
    },

    /* Resultado de unas elecciones presidenciales. */
    nochePres(n) {
      const E = C.E, d = D().paises[n.pais], res = n.res;
      const nombre = k => esc((n.nombres && n.nombres[k]) || E.partidos[k].sigla) + ' <span class="tenue">(' + esc(E.partidos[k].sigla) + ')</span>';
      const barras = (lista, ganadorPid) => G.barrasH(lista.map(c => ({ etq: nombre(c.pid), v: c.v, color: E.partidos[c.pid].color, tt: `<b>${esc(E.partidos[c.pid].nombre)}</b><br>${U.d1(c.v)} %` })), { max: 100, fmt: v => U.d1(v) + ' %', anchoEtq: '190px' });
      const gan = E.partidos[n.ganador], gl = E.politicos[n.pol];
      const cuerpo = `<h3 style="font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase;margin:0 0 8px">Primera vuelta</h3>${barras(res.r1)}
        ${res.r2 ? `<h3 style="font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase;margin:16px 0 8px">Segunda vuelta</h3>${barras(res.r2)}` : ''}
        <div class="nota" style="margin-top:14px"><b>${n.propio ? '🎉 ¡Has ganado la Presidencia!' : 'Nuevo presidente: ' + (gl ? esc(gl.n) : '')}</b><br>${esc(gan.nombre)}${n.propio ? '' : ' · ' + C.Comp.ideoTxt(gan)}.${D().paises[n.pais].reg === 'pres' ? ' El presidente encabeza también el Gobierno.' : (E.paises[n.pais].flags.cohab ? ' <span class="alerta">Cohabitación:</span> el presidente y el Gobierno son de signo distinto.' : '')}</div>`;
      const m = UI.modal({ titulo: `Elecciones presidenciales · ${d.bandera} ${d.nombre}`, icono: '🎖️', cuerpo, clase: 'medio', sinCerrar: true, pie: '<button class="btn prim" id="np-ok">Continuar</button>' });
      UI.$('#np-ok', m.el).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
    },

    /* El presidente (jugador) elige qué fuerza encabeza el Gobierno tras las elecciones (regímenes semipresidenciales). */
    designarPM() {
      const E = C.E, J = E.jugador, id = J.pais, P = E.paises[id];
      const op = C.Gobierno.opciones(E, id, {});
      const lista = op.resultados.filter(r => r.coalicion.length);
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">Como presidente/a designas quién encabeza el Gobierno. Las coaliciones muestran el apoyo parlamentario que obtendrían.</p><div class="lista">${lista.map((r, i) => { const pa = E.partidos[r.formateur], l = E.politicos[pa.lider]; return `<div class="it clic" data-o="${i}"><span class="pto" style="background:${pa.color}"></span><div class="cuerpo"><b>${esc(l ? l.n : pa.sigla)} (${esc(pa.sigla)})</b><span>${r.coalicion.map(k => esc(E.partidos[k].sigla)).join(' + ')} · ${r.escanos} de ${op.total} escaños · ${r.tipo === 'minoria' ? 'minoría' : 'mayoría'}</span></div><span class="etq ${r.tipo === 'minoria' ? 'rojo' : 'verde'}">${r.tipo === 'minoria' ? 'Inestable' : 'Estable'}</span></div>`; }).join('')}</div>`;
      const m = UI.modal({ titulo: '🎖️ Designación del Gobierno', cuerpo, clase: 'medio', pie: '<button class="btn" id="d-no">Mantener el resultado actual</button>' });
      UI.$$('[data-o]', m.el).forEach(it => it.onclick = () => { const r = lista[+it.dataset.o]; C.Gobierno.formar(E, id, { coalicion: r.coalicion, apoyoExterno: r.apoyoExterno }); C.Personaje.sincronizar(E); m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); });
      UI.$('#d-no', m.el).onclick = () => { m.cerrar(); C.App.revisarPendientes(); };
    },

    /* Ronda de consultas (tras las elecciones) o moción de censura: el jugador elige socios. */
    consultas(modo) {
      const E = C.E, J = E.jugador, id = J.pais, P = E.paises[id], d = D().paises[id], censura = modo === 'censura';
      const total = d.esc, mayoria = Math.floor(total / 2) + 1;
      const candidatos = P.partidos.filter(k => k !== J.partido && (P.escanos[k] || 0) > 0 && !C.Gobierno.vetado(E, id, k)).sort((a, b) => C.U.distIdeo(E.partidos[J.partido], E.partidos[a]) - C.U.distIdeo(E.partidos[J.partido], E.partidos[b]));
      const sel = new Set();
      const cuerpo = `<p style="margin-top:0;font-size:13.5px">${censura ? `Para derribar a ${esc((E.politicos[P.gob.pm] || {}).n || 'el jefe de Gobierno')} necesitas <b>${mayoria}</b> escaños y un candidato alternativo: tú.` : 'Como líder de tu partido encabezas la ronda de consultas. Elige con quién intentar formar Gobierno.'}</p>
        <div class="fila" style="margin-bottom:8px"><b>Tu bloque:</b> <span id="c-suma" class="num"></span></div><div class="gauge" style="margin-bottom:12px"><i id="c-barra" style="background:var(--oro)"></i><b style="left:${mayoria / total * 100}%"></b></div>
        <div class="lista">${candidatos.map(k => { const p = E.partidos[k], pr = C.Gobierno.disposicion(E, id, k); return `<label class="it" style="cursor:pointer"><input type="checkbox" data-k="${k}"><span class="pto" style="background:${p.color}"></span><div class="cuerpo"><b>${esc(p.nombre)}</b><span>${P.escanos[k]} escaños · ${C.Comp.ideoTxt(p)} · ${P.gob.coalicion.includes(k) ? 'en el Gobierno actual' : 'oposición'}</span></div><span class="etq ${pr > 0.6 ? 'verde' : pr > 0.35 ? 'amar' : 'rojo'}">Disposición ${Math.round(pr * 100)} %</span></label>`; }).join('') || '<div class="vacio">No hay socios posibles.</div>'}</div>
        <div id="c-res" style="margin-top:10px"></div>`;
      const m = UI.modal({ titulo: censura ? '⚡ Moción de censura' : '🤝 Ronda de consultas', cuerpo, clase: 'medio', pie: `<button class="btn" id="c-no">${censura ? 'Retirar la moción' : 'Aceptar el resultado actual'}</button><button class="btn prim" id="c-ok">${censura ? 'Presentar la moción' : 'Proponer un pacto'}</button>` });
      const act = () => { const s = C.U.suma([...sel].map(k => P.escanos[k])) + (P.escanos[J.partido] || 0); UI.$('#c-suma', m.el).textContent = s + ' de ' + total + ' escaños' + (s >= mayoria ? ' · mayoría ✔' : ''); UI.$('#c-barra', m.el).style.width = Math.min(100, s / total * 100) + '%'; };
      UI.$$('[data-k]', m.el).forEach(c => c.onchange = () => { if (c.checked) sel.add(c.dataset.k); else sel.delete(c.dataset.k); act(); });
      act();
      UI.$('#c-no', m.el).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
      UI.$('#c-ok', m.el).onclick = () => {
        if (!sel.size && !(P.escanos[J.partido] >= mayoria)) { UI.toast('Elige al menos un socio', 'mal'); return; }
        const r = C.Gobierno.intentarCoalicion(E, id, [...sel], censura);
        const rep = (r.aceptan.length ? `<div class="bien">✔ Aceptan: ${r.aceptan.map(k => esc(E.partidos[k].sigla)).join(', ')}</div>` : '') + (r.rechazan.length ? `<div class="mal">✘ Rechazan: ${r.rechazan.map(k => esc(E.partidos[k].sigla)).join(', ')}</div>` : '');
        UI.$('#c-res', m.el).innerHTML = `<div class="nota">${rep}<div style="margin-top:6px"><b>${r.ok ? (r.tipo === 'mayoria' ? '¡Logras una mayoría! Formas Gobierno.' : 'Logras gobernar en minoría.') : 'No logras los apoyos suficientes' + (censura ? ': la moción decae.' : '.')}</b> (${r.suma} de ${total} escaños)</div></div>`;
        if (censura && !r.ok) { C.Personaje.cambiar(E, { prestigio: -4, pop: -1 }, true); }
        if (r.ok) { C.Personaje.sincronizar(E); C.Personaje.log(E, censura ? 'Tu moción de censura prospera.' : 'Formas Gobierno tras la ronda de consultas.'); }
        UI.$('#c-ok', m.el).disabled = true; UI.$('#c-no', m.el).textContent = 'Cerrar'; sel.clear();
      };
    },

    /* Noche electoral: escrutinio animado, hemiciclo, resultado personal y nuevo Gobierno. */
    noche(n) {
      const E = C.E, P = E.paises[n.pais], d = D().paises[n.pais], J = E.jugador;
      const orden = P.partidos.slice().sort((a, b) => n.votos[b] - n.votos[a]);
      const ruido = {}; orden.forEach(k => ruido[k] = U.gauss(0, 1));
      const cuerpo = `<div class="boletin"><span id="n-bol">Escrutinio · mesas informadas 0 %</span><span>Participación ${n.part} %</span></div><div class="barra-h" style="height:6px;margin-bottom:12px"><i id="n-prog" style="width:0;background:var(--oro)"></i></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start"><div id="n-barras"></div><div id="n-hemi" style="opacity:.25">${H.bloques([{ n: d.esc, color: '#26354f' }], { altoMax: 260, centroSub: 'ESCAÑOS' })}</div></div><div id="n-final"></div>`;
      const m = UI.modal({ titulo: `Noche electoral · ${d.bandera} ${d.nombre}`, icono: '🗳', cuerpo, clase: 'noche', sinCerrar: true, pie: '<button class="btn" id="n-saltar">Saltar escrutinio ⏭</button><button class="btn prim" id="n-cerrar" disabled>Continuar</button>' });
      const $ = s => UI.$(s, m.el);
      let paso = 0; const N = 26;
      const pintar = (f) => {
        const mi = Math.round(f * 100);
        $('#n-bol').textContent = `Escrutinio · mesas informadas ${mi} %`; $('#n-prog').style.width = mi + '%';
        const vs = {}; let t = 0;
        orden.forEach(k => { vs[k] = Math.max(0.05, n.votos[k] * (1 + ruido[k] * 0.12 * (1 - f))); t += vs[k]; });
        orden.forEach(k => vs[k] = vs[k] * 100 / t);
        $('#n-barras').innerHTML = G.barrasH(orden.map(k => ({ etq: Comp.partido(E, k), v: vs[k], color: E.partidos[k].color })), { max: Math.max(...orden.map(k => n.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
      };
      const fin = () => {
        clearInterval(h); pintar(1);
        $('#n-bol').textContent = 'Escrutinio · 100 % de las mesas';
        $('#n-prog').style.width = '100%';
        $('#n-barras').innerHTML = G.barrasH(orden.map(k => ({ etq: Comp.partido(E, k), v: n.votos[k], color: E.partidos[k].color, tt: `<b>${esc(E.partidos[k].nombre)}</b><br>${U.d1(n.votos[k])} % · ${n.escanos[k] || 0} escaños` })), { max: Math.max(...orden.map(k => n.votos[k])) * 1.15, fmt: v => U.d1(v) + ' %', anchoEtq: '70px' });
        const maj = Math.floor(d.esc / 2) + 1;
        $('#n-hemi').style.opacity = 1; $('#n-hemi').innerHTML = H.bloques(bloquesPartidos(E, n.escanos), { altoMax: 270, mayoria: maj, centroSub: 'ESCAÑOS · MAYORÍA ' + maj }) + H.leyendaPartidos(E, n.escanos);
        const g = P.gob, pm = E.politicos[g.pm], pers = n.personal;
        $('#n-final').innerHTML = `<div class="grid g2" style="margin-top:14px"><div class="nota"><b>Tu resultado</b><br>${pers.ue ? 'Estás en la política europea; tu escaño nacional no está en juego.' : pers.electo ? `<span class="bien">✔ Reelegido/a</span> con el puesto ${pers.pos} de la lista (${pers.escanos} escaños para tu partido).` : `<span class="mal">✘ Sin escaño</span>: puesto ${pers.pos} en la lista y ${pers.escanos} escaños para tu partido.`}</div>
          <div class="nota"><b>Nuevo Gobierno</b><br>${esc(pm ? pm.n : '—')} (${esc(E.partidos[g.partido].sigla)}) ${g.coalicion.length > 1 ? 'con ' + g.coalicion.filter(k => k !== g.partido).map(k => esc(E.partidos[k].sigla)).join(', ') : g.tipo === 'minoria' ? 'en minoría' : 'en solitario'} · ${g.coalicion.includes(J.partido) ? '<span class="oro">tu partido gobierna</span>' : g.apoyoExterno.includes(J.partido) ? 'tu partido da apoyo externo' : 'tu partido está en la oposición'}.</div></div>`;
        $('#n-cerrar').disabled = false; $('#n-saltar').disabled = true;
      };
      const h = setInterval(() => { paso++; if (paso >= N) fin(); else pintar(paso / N); }, 170);
      $('#n-saltar').onclick = fin;
      $('#n-cerrar').onclick = () => { m.cerrar(); C.App.refrescar(); if (J.cargo === 'presidente' && d.reg === 'semi') El.designarPM(); else if (J.rol === 'lider' && !C.Personaje.esUE(E) && (P.escanos[J.partido] || 0) > 0 && P.gob.pm !== 'J') El.consultas('post'); else C.App.revisarPendientes(); };
      pintar(0);
    }
  };
})(window.EUROPA);

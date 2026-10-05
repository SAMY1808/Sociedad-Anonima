/* Interfaz del sistema de leyes e impacto: diseño de una ley con informe de impacto, leyes en vigor y panorama del país. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const sg = (x, d = 1) => U.signo(x, d);
  const sec = s => D().sectores[s] || { nombre: s, icono: '📄' };

  /* Barra divergente centrada en cero */
  const barra = (d, max) => `<div class="imp-pista"><i class="${d >= 0 ? 'pos' : 'neg'}" style="width:${Math.min(50, Math.abs(d) / max * 50)}%"></i></div>`;
  const colorSat = v => v >= 58 ? 'var(--bien)' : v >= 42 ? 'var(--alerta)' : 'var(--mal)';
  const colorInd = (v, b) => v - b >= 3 ? 'var(--bien)' : v - b <= -3 ? 'var(--mal)' : 'var(--oro)';

  const Imp = C.Pantallas.impacto = {
    /* Texto del diseño de una ley (alcance, enfoque, financiación, calendario). */
    disTxt(tpl, dis) {
      const d = C.Impacto.norm(tpl, dis), imp = D().impactos[tpl.id] || {}, v = d.enf ? (imp.enf || []).find(x => x.id === d.enf) : null;
      const ch = [`<span class="etq ${d.alc === 2 ? 'rojo' : d.alc === 0 ? 'verde' : ''}">Alcance ${D().alcances[d.alc].n.toLowerCase()}</span>`];
      if (v) ch.push(`<span class="etq oro">${esc(v.n)}</span>`);
      if (tpl.costo > 0.04 && d.fin !== 'deficit') ch.push(`<span class="etq">${esc(D().financiaciones.find(x => x.id === d.fin).n)}</span>`);
      if (d.grad) ch.push('<span class="etq">Gradual</span>');
      return ch.join('');
    },

    /* Panel presupuestario (como en Geopolitical Simulator): coste, déficit hoy y previsto frente al límite europeo. */
    fiscalHTML(E, inf) {
      const ec = E.paises.ES.ec, par = inf.par, dd = inf.ec.deficit || 0, hoy = ec.deficit, prev = hoy + dd, lim = 3, max = 6;
      const w = v => Math.max(0, Math.min(100, v / max * 100));
      const lo = Math.min(hoy, prev), hi = Math.max(hoy, prev), peor = dd > 0.005, mejor = dd < -0.005;
      const costoTxt = par.costoTotal > 0.005 ? `Cuesta ${U.d1(par.costoTotal)} % del PIB (≈ ${U.n(inf.anual)} mil millones al año)` : par.costoTotal < -0.005 ? `Ingresa ${U.d1(-par.costoTotal)} % del PIB (≈ ${U.n(-inf.anual)} mil millones al año)` : 'Sin impacto presupuestario directo';
      const deuda = par.costo * 1; // % PIB/año que se suma a la deuda (sólo si se paga con deuda)
      return `<div class="imp-fiscal"><div class="fila" style="justify-content:space-between"><b>💶 Presupuesto</b><span class="etq ${peor ? 'rojo' : mejor ? 'verde' : ''}">${peor ? 'Empeora el déficit' : mejor ? 'Mejora el déficit' : 'Déficit sin cambios'}</span></div>
        <div class="tenue" style="font-size:12.5px;margin:4px 0 6px">${costoTxt}${par.dis.fin !== 'deficit' && par.costoTotal > 0.04 ? ' · compensado ' + (par.dis.fin === 'impuestos' ? 'con impuestos' : 'con recortes') : ''}.</div>
        <div class="fis-barra"><i class="base" style="width:${w(lo)}%"></i><i class="${peor ? 'mal' : 'bien'}" style="left:${w(lo)}%;width:${w(hi) - w(lo)}%"></i><b class="lim" style="left:${w(lim)}%"${UI.tt('Límite europeo del 3 % del PIB')}></b></div>
        <div class="fila" style="justify-content:space-between;font-size:12px;margin-top:4px"><span>Déficit hoy <b class="num">${U.d1(hoy)} %</b></span><span>Previsto <b class="num ${prev > lim ? 'mal' : ''}">${U.d1(prev)} %</b></span><span class="tenue">Límite UE 3 %</span></div>
        ${prev > lim && hoy <= lim ? '<div class="nota" style="margin-top:6px;border-color:var(--no);font-size:12.5px">⚠ Superarías el 3 %: Bruselas podría abrir un procedimiento de déficit excesivo.</div>' : ''}
        ${deuda > 0.01 ? `<div class="tenue" style="font-size:12px;margin-top:4px">Deuda: +${U.d1(deuda)} puntos de PIB al año mientras esté en vigor (hoy ${U.n(ec.deuda)} %).</div>` : ''}</div>`;
    },

    /* Resumen en palabras de los efectos (mejora / empeora). */
    resumenHTML(E, inf) {
      const L = [];
      const dd = inf.ec.deficit || 0; if (Math.abs(dd) >= 0.03) L.push([dd < 0, '💶 Déficit público', dd < 0 ? 'mejora' : 'empeora']);
      for (const k of ['crec', 'paro', 'infl']) { const x = inf.ec[k] || 0; if (Math.abs(x) >= 0.04) { const bien = k === 'crec' ? x > 0 : x < 0; L.push([bien, ({ crec: '📈 Crecimiento', paro: '👷 Paro', infl: '🛒 Inflación' })[k], (k === 'crec' ? x > 0 : x < 0) ? 'mejora' : 'empeora']); } }
      inf.ind.filter(x => Math.abs(x.d) >= 0.8).slice(0, 6).forEach(x => { const dat = D().indicadores[x.k]; L.push([x.d > 0, dat.icono + ' ' + dat.nombre, x.d > 0 ? 'mejora' : 'empeora']); });
      if (!L.length) return '';
      return `<div class="imp-resumen">${L.map(([b, n, v]) => `<span class="${b ? 'bien' : 'mal'}">${b ? '▲' : '▼'} ${n}: <b>${v}</b></span>`).join('')}</div>`;
    },

    /* Informe de impacto: indicadores, colectivos, economía, riesgos y votos. */
    informeHTML(E, inf, pr) {
      const par = inf.par, ec = inf.ec, D_ = D();
      const filasI = inf.ind.map(x => { const dat = D_.indicadores[x.k]; return `<div class="imp-fila"${UI.tt(`<div class="tt-t">${dat.icono} ${esc(dat.nombre)}</div><div class="tt-f"><span>Hoy</span><b>${Math.round(x.actual)}/100</b></div><div class="tt-f"><span>Efecto previsto</span><b>${sg(x.d)}</b></div><div class="tenue" style="margin-top:4px">${esc(dat.d)}</div>`)}><span class="nom">${dat.icono} ${esc(dat.nombre)}</span>${barra(x.d, 8)}<span class="imp-val ${x.d >= 0 ? 'bien' : 'mal'}">${sg(x.d)}</span></div>`; }).join('') || '<div class="tenue" style="font-size:12.5px">Sin efectos relevantes sobre los indicadores del país.</div>';
      const filasG = inf.gr.map(x => { const g = D_.colectivos[x.k]; return `<div class="imp-fila"><span class="nom">${g.icono} ${esc(g.nombre)}</span>${barra(x.d, 10)}<span class="imp-val ${x.d >= 0 ? 'bien' : 'mal'}">${sg(x.d)}</span></div>`; }).join('') || '<div class="tenue" style="font-size:12.5px">No cambia de forma apreciable la satisfacción de ningún colectivo.</div>';
      const ecs = [['crec', 'Crecimiento'], ['paro', 'Paro'], ['infl', 'Inflación'], ['deficit', 'Déficit']].filter(([k]) => Math.abs(ec[k] || 0) >= 0.02).map(([k, n]) => { const malo = k === 'crec' ? ec[k] < 0 : ec[k] > 0; return `<span class="etq ${malo ? 'rojo' : 'verde'}">${n} ${sg(ec[k], 2)} pp</span>`; }).join('');
      const fiscal = inf.anual ? `<div class="etq ${inf.anual > 0 ? 'rojo' : 'verde'}">${inf.anual > 0 ? 'Coste bruto' : 'Ingreso'} ${U.d1(Math.abs(par.costoTotal))} % del PIB · ≈ ${U.n(Math.abs(inf.anual))} mil millones al año</div>` : '';
      const riesgos = inf.riesgos.length ? `<div class="chips" style="margin-top:6px">${inf.riesgos.map(r => `<span class="etq ${r.nivel === 'probable' ? 'rojo' : r.nivel === 'posible' ? 'amar' : ''}"${UI.tt(`Riesgo ${r.nivel}`)}>⚠ ${esc(r.t)}</span>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px;margin-top:6px">Sin riesgos identificados.</div>';
      const votos = pr ? `<div style="margin-top:10px">${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 16 })}<div class="tenue" style="font-size:12px;margin-top:4px">Proyección en el Congreso: ${pr.si} a favor, ${pr.no} en contra · se necesitan ${pr.need}. ${pr.dist >= 0 ? '<b class="bien">Margen +' + pr.dist + '</b>' : '<b class="mal">Faltan ' + Math.abs(pr.dist) + '</b>'}</div></div>` : '';
      const fisc = Imp.fiscalHTML(E, inf), resumen = Imp.resumenHTML(E, inf);
      return `${resumen}${fisc}<div class="fila" style="gap:6px;margin-bottom:8px"><span class="etq">Apoyo ciudadano ${par.pop} %</span><span class="etq">Plena eficacia en ${par.r >= 52 ? U.d1(par.r / 52) + ' años' : par.r + ' semanas'}</span><span class="etq"${UI.tt('El informe del Gobierno puede equivocarse: el efecto real será el previsto multiplicado por un factor que depende de la incertidumbre, de la ejecución del ministerio y del azar.')}>Incertidumbre ±${Math.round(inf.u * 100)} %</span>${fiscal}</div>
        <h4 class="imp-h">Indicadores del país <span class="tenue">(puntos sobre 100)</span></h4>${filasI}
        <h4 class="imp-h">Colectivos sociales <span class="tenue">(satisfacción)</span></h4>${filasG}
        ${ecs ? `<h4 class="imp-h">Economía</h4><div class="chips">${ecs}</div>` : ''}
        <h4 class="imp-h">Riesgos de efectos no deseados</h4>${riesgos}${votos}`;
    },

    /* Modal de diseño de una ley con informe de impacto en vivo. o = { tplId, titulo, autor, ajuste, dis, via, btn, vias, onOk(dis, via) } */
    disenar(o) {
      const E = C.E, tpl = C.Congreso.plantilla(o.tplId); if (!tpl) return;
      const imp = D().impactos[tpl.id] || {};
      const st = { dis: C.Impacto.norm(tpl, o.dis), via: o.via || 'ley' };
      const m = UI.modal({ titulo: o.titulo || tpl.t, icono: sec(tpl.s).icono, cuerpo: '<div id="dis-c"></div>', clase: 'medio ancho-dis', pie: `<button class="btn" id="dis-no">Cancelar</button>${(o.vias || []).map(v => `<button class="btn ${st.via === v[0] ? '' : ''}" data-via="${v[0]}">${v[1]}</button>`).join('')}<button class="btn prim" id="dis-ok">${esc(o.btn || 'Aprobar')}</button>` });
      const cont = m.cuerpo.querySelector('#dis-c');
      const pintar = () => {
        const d = st.dis, inf = C.Impacto.informe(E, tpl.id, d, o.ajuste), pseudo = C.Congreso.pseudo(E, tpl, o.autor || { tipo: 'jugador', pid: E.jugador.partido }, d, o.ajuste), pr = C.Congreso.proyectar(E, pseudo);
        const seg = (k, vals) => `<div class="seg">${vals.map(([v, n]) => `<button data-k="${k}" data-v="${v}" class="${String(d[k]) === String(v) ? 'activo' : ''}">${n}</button>`).join('')}</div>`;
        const enfoques = [{ id: '', n: 'Estándar', d: 'El texto tal y como está pensado.' }].concat(imp.enf || []);
        cont.innerHTML = `<p style="margin:0 0 10px;font-size:13.5px;color:var(--texto2)">${esc(tpl.d)}</p>
          <div class="dis-bloque"><h4 class="imp-h">Alcance</h4>${seg('alc', D().alcances.map(a => [a.id, a.n]))}<div class="tenue dis-nota">${esc(D().alcances[d.alc].d)}</div></div>
          ${enfoques.length > 1 ? `<div class="dis-bloque"><h4 class="imp-h">Enfoque</h4><div class="col" style="gap:6px">${enfoques.map(v => `<div class="fila-sel ${(d.enf || '') === v.id ? 'sel' : ''}" data-k="enf" data-v="${v.id}"><div style="flex:1"><b>${esc(v.n)}</b><div class="tenue" style="font-size:12px">${esc(v.d)}</div></div></div>`).join('')}</div></div>` : ''}
          ${tpl.costo > 0.04 ? `<div class="dis-bloque"><h4 class="imp-h">Financiación</h4>${seg('fin', D().financiaciones.map(f => [f.id, f.n]))}<div class="tenue dis-nota">${esc(D().financiaciones.find(f => f.id === d.fin).d)}</div></div>` : ''}
          <div class="dis-bloque"><h4 class="imp-h">Entrada en vigor</h4>${seg('grad', [[false, 'Inmediata'], [true, 'Gradual']])}<div class="tenue dis-nota">${d.grad ? 'Se implanta en el doble de tiempo: menos choque y menos riesgos, pero tarda más en dar frutos.' : 'Los efectos empiezan a notarse enseguida.'}</div></div>
          <div class="dis-informe"><div class="fila" style="justify-content:space-between"><h3 style="margin:0">📊 Informe de impacto</h3><span class="tenue" style="font-size:12px">${Imp.disTxt(tpl, d)}</span></div>${Imp.informeHTML(E, inf, pr)}</div>`;
      };
      m.cuerpo.addEventListener('click', e => {
        const b = e.target.closest('[data-k]'); if (!b) return;
        const k = b.dataset.k; let v = b.dataset.v;
        if (k === 'alc') v = +v; else if (k === 'grad') v = v === 'true'; else if (k === 'enf') v = v || null;
        st.dis = C.Impacto.norm(tpl, Object.assign({}, st.dis, { [k]: v })); pintar();
      });
      m.pie.addEventListener('click', e => {
        if (e.target.id === 'dis-no') { m.cerrar(); return; }
        const via = e.target.closest('[data-via]'); if (via) { st.via = via.dataset.via; o.onOk(st.dis, st.via); m.cerrar(); return; }
        if (e.target.id === 'dis-ok') { o.onOk(st.dis, st.via); if (UI.pila.includes(m)) m.cerrar(); }
      });
      pintar();
    },

    /* ── Pestaña «En vigor» ── */
    vigorTab(E) {
      const Im = C.Impacto, lista = Im.enVigor(E), der = E.esp.vigor.filter(v => v.estado === 'derogada').slice(0, 6), t = E.fecha.t;
      const efectos = v => { const f = Im.factor(v, t); return Object.keys(v.prev.ind).map(k => ({ k, e: v.prev.ind[k] * v.real * f })).filter(x => Math.abs(x.e) >= 0.1).sort((a, b) => Math.abs(b.e) - Math.abs(a.e)).slice(0, 4).map(x => `<span class="etq ${x.e >= 0 ? 'verde' : 'rojo'}"${UI.tt(esc(D().indicadores[x.k].nombre))}>${D().indicadores[x.k].icono} ${sg(x.e)}</span>`).join(''); };
      const tarjeta = v => {
        const tpl = C.Congreso.plantilla(v.tpl), f = Im.factor(v, t), impl = Math.round(Im.rampa(v, t) * 100), sec_ = v.secs.filter(s => s.apT != null);
        const aut = v.autor && v.autor.tipo === 'jugador' ? '<span class="etq oro">Tu ley</span>' : v.autor && v.autor.pid && E.partidos[v.autor.pid] ? Comp.partido(E, v.autor.pid) : '';
        return `<div class="tarjeta"><div class="fila" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap;gap:10px"><div style="min-width:0"><div class="fila" style="gap:6px"><span>${sec(tpl.s).icono}</span><b style="font-size:15px">${esc(v.t)}</b></div><div class="tenue" style="font-size:12.5px;margin-top:2px">En vigor desde ${U.fmtT(v.t0, true)}${v.rdl ? ' · decreto-ley' : ''} ${aut ? '· ' : ''}${aut}</div></div>${v.eval ? `<span class="etq ${v.eval.r === 'mejor' ? 'verde' : v.eval.r === 'previsto' ? 'oro' : 'rojo'}">${esc(v.eval.txt)}</span>` : '<span class="etq">Sin evaluar</span>'}</div>
          <div class="fila" style="gap:6px;margin:8px 0">${Imp.disTxt(tpl, v.dis)}${efectos(v)}</div>
          <div class="fila" style="gap:8px;font-size:12px"><span class="tenue" style="width:86px">Implantación</span><div style="flex:1">${Comp.barraRango(impl, 'var(--oro)')}</div><b class="num">${impl} %</b></div>
          ${sec_.length ? `<div class="chips" style="margin-top:8px">${sec_.map(s => `<span class="etq rojo">⚠ ${esc(s.t)}</span>`).join('')}</div>` : ''}
          <div class="fila" style="gap:6px;margin-top:10px"><button class="btn chico" data-vig="${v.id}" data-op="info">📋 Informe</button><button class="btn chico" data-vig="${v.id}" data-op="reformar">♻️ Reformar</button><button class="btn chico peligro" data-vig="${v.id}" data-op="derogar">🗑 Derogar</button></div></div>`;
      };
      return `<p class="tenue" style="margin-top:0">Las leyes aprobadas entran en vigor de forma gradual, mueven los indicadores del país y la satisfacción de los colectivos, y se evalúan al cabo de un año. Puedes <b>reformarlas</b> (cambiar su diseño) o <b>derogarlas</b>.</p>
        ${lista.length ? `<div class="col">${lista.map(tarjeta).join('')}</div>` : '<div class="vacio">Todavía no hay leyes en vigor de esta legislatura.</div>'}
        ${der.length ? `<h3 style="margin:16px 0 6px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Derogadas o sustituidas</h3><div class="lista" style="font-size:12.5px">${der.map(v => `<div class="it"><span class="tenue" style="width:86px">${U.fmtT(v.tFin, true)}</span><span>${esc(v.t)} <span class="tenue">· ${esc(v.motivo || 'derogada')}</span></span></div>`).join('')}</div>` : ''}`;
    },

    /* Informe de una ley en vigor: previsto frente a observado. */
    verVigor(id) {
      const E = C.E, Im = C.Impacto, v = E.esp.vigor.find(x => x.id === id); if (!v) return;
      const tpl = C.Congreso.plantilla(v.tpl), t = E.fecha.t, f = Im.factor(v, t);
      const filas = Object.keys(v.prev.ind).filter(k => Math.abs(v.prev.ind[k]) >= 0.15).sort((a, b) => Math.abs(v.prev.ind[b]) - Math.abs(v.prev.ind[a])).map(k => { const dat = D().indicadores[k], prev = v.prev.ind[k], obs = prev * v.real * f; return `<tr><td>${dat.icono} ${esc(dat.nombre)}</td><td class="num ${prev >= 0 ? 'bien' : 'mal'}">${sg(prev)}</td><td class="num ${obs >= 0 ? 'bien' : 'mal'}">${sg(obs)}</td></tr>`; }).join('');
      const filasG = Object.keys(v.prev.gr).filter(k => Math.abs(v.prev.gr[k]) >= 0.4).sort((a, b) => Math.abs(v.prev.gr[b]) - Math.abs(v.prev.gr[a])).map(k => { const g = D().colectivos[k], prev = v.prev.gr[k], obs = prev * v.real * f; return `<tr><td>${g.icono} ${esc(g.nombre)}</td><td class="num ${prev >= 0 ? 'bien' : 'mal'}">${sg(prev)}</td><td class="num ${obs >= 0 ? 'bien' : 'mal'}">${sg(obs)}</td></tr>`; }).join('');
      const cuerpo = `<div class="fila" style="gap:6px;margin-bottom:8px">${Imp.disTxt(tpl, v.dis)}<span class="etq">En vigor desde ${U.fmtT(v.t0, true)}</span><span class="etq">Implantación ${Math.round(Im.rampa(v, t) * 100)} %</span>${v.eval ? `<span class="etq ${v.eval.r === 'mejor' ? 'verde' : v.eval.r === 'previsto' ? 'oro' : 'rojo'}">Balance: ${esc(v.eval.txt)}</span>` : `<span class="etq">Balance dentro de ${Math.max(0, Math.max(52, v.r + 13) - (t - v.t0))} semanas</span>`}</div>
        <p style="font-size:13.5px;color:var(--texto2);margin:6px 0 10px">${esc(tpl.d)}</p>
        <h4 class="imp-h">Indicadores: previsto frente a observado</h4><table class="tabla"><thead><tr><th>Indicador</th><th class="num">Previsto</th><th class="num">Observado hoy</th></tr></thead><tbody>${filas || '<tr><td colspan="3" class="tenue">Sin efectos.</td></tr>'}</tbody></table>
        <h4 class="imp-h">Colectivos sociales</h4><table class="tabla"><thead><tr><th>Colectivo</th><th class="num">Previsto</th><th class="num">Observado hoy</th></tr></thead><tbody>${filasG || '<tr><td colspan="3" class="tenue">Sin efectos.</td></tr>'}</tbody></table>
        ${v.secs.length ? `<h4 class="imp-h">Efectos no deseados</h4><div class="lista" style="font-size:12.5px">${v.secs.map(s => `<div class="it"><span class="etq ${s.apT != null ? 'rojo' : ''}">${s.apT != null ? 'Ocurrido' : 'Previsto ' + U.fmtT(s.due, true)}</span><span>${esc(s.t)}</span></div>`).join('')}</div>` : ''}
        <p class="tenue" style="font-size:12px;margin-top:10px">El efecto real de la ley fue ${v.real >= 1.05 ? 'mejor' : v.real <= 0.95 ? 'peor' : 'parecido'} al previsto por el informe (×${U.d1(v.real).replace(',', ',')}). Cuanto mayor es la incertidumbre del informe, más puede desviarse.</p>`;
      UI.modal({ titulo: v.t, icono: sec(tpl.s).icono, cuerpo, clase: 'medio' });
    },

    /* Acciones sobre una ley en vigor: reformar o derogar. */
    accionVigor(id, op) {
      const E = C.E, v = E.esp.vigor.find(x => x.id === id); if (!v) return;
      if (op === 'info') return Imp.verVigor(id);
      const esPM = C.Consejo.pmEsJ(E), tpl = C.Congreso.plantilla(v.tpl);
      const enviar = (tipo, dis) => {
        if (esPM) { const r = C.Consejo.iniciativaCambio(E, id, tipo, dis); if (r === true) { C.Personaje.cambiar(E, { prestigio: 1 }); UI.toast('Iniciativa aprobada en el Consejo de Ministros', 'bien'); } else UI.toast(esc(r), 'mal'); C.App.refrescar(); }
        else UI.accion('proponer_cambio_ley', { vigor: id, tipo, dis });
      };
      if (op === 'derogar') {
        const m = UI.modal({ titulo: 'Derogar «' + esc(v.t) + '»', icono: '🗑', clase: 'medio', cuerpo: `<p style="margin-top:0">Se tramitará una ley que deroga el texto. Sus efectos (${Object.keys(v.prev.ind).filter(k => Math.abs(v.prev.ind[k]) >= 0.4).map(k => D().indicadores[k].icono + ' ' + D().indicadores[k].nombre).join(', ') || 'ninguno relevante'}) se irán deshaciendo durante unos seis meses. Los colectivos que se beneficiaban lo notarán.</p><div class="fila" style="gap:6px">${Imp.disTxt(tpl, v.dis)}</div>`, pie: `<button class="btn" id="d-no">Cancelar</button><button class="btn prim" id="d-ok">${esPM ? 'Llevar al Consejo de Ministros' : 'Registrar la proposición (2 ◆)'}</button>` });
        m.pie.addEventListener('click', e => { if (e.target.id === 'd-no') m.cerrar(); if (e.target.id === 'd-ok') { m.cerrar(); enviar('derogar'); } });
        return;
      }
      Imp.disenar({ tplId: v.tpl, titulo: 'Reformar «' + v.t + '»', dis: v.dis, autor: esPM ? { tipo: 'gobierno', pid: E.paises.ES.gob.partido } : { tipo: 'jugador', pid: E.jugador.partido }, ajuste: v.autor && v.autor.tipo === 'jugador' ? null : null, btn: esPM ? 'Aprobar la reforma en el Consejo' : 'Registrar la reforma (2 ◆)', onOk: dis => enviar('reformar', dis) });
    },

    /* ── Pestaña «País»: indicadores y colectivos ── */
    paisTab(E) {
      const Im = C.Impacto, S = E.esp.soc, ind = Im.indicadores(E), gr = Im.grupos(E), P = E.paises.ES, ser = E.series;
      const spark = (k, col) => G.sparkline((ser['ind:' + k] || []).slice(-60), col, 96, 26);
      const tt = x => `<div class="tt-t">${x.icono} ${esc(x.nombre)}</div><div class="tenue" style="max-width:240px">${esc(x.d)}</div>${x.leyes.length ? '<div style="margin-top:6px"><b>Leyes que más pesan</b></div>' + x.leyes.map(l => `<div class="tt-f"><span>${esc(l.v.t)}</span><b class="${l.e >= 0 ? 'bien' : 'mal'}">${sg(l.e)}</b></div>`).join('') : '<div class="tenue" style="margin-top:6px">Ninguna ley lo mueve ahora.</div>'}`;
      const tarjInd = x => `<div class="tarjeta imp-ind"${UI.tt(tt(x))}><div class="fila" style="justify-content:space-between"><span class="nom">${x.icono} ${esc(x.nombre)}</span><b class="num" style="font-size:18px">${Math.round(x.v)}</b></div><div style="margin:6px 0 4px">${Comp.barraRango(x.v, colorInd(x.v, x.base))}</div><div class="fila" style="justify-content:space-between;font-size:11.5px"><span class="${x.dif >= 0.5 ? 'bien' : x.dif <= -0.5 ? 'mal' : 'tenue'}">${x.dif >= 0.5 ? '▲' : x.dif <= -0.5 ? '▼' : '='} ${sg(x.dif)} desde el inicio</span>${spark(x.k, colorInd(x.v, x.base))}</div></div>`;
      const idxP = k => { const P_ = E.esp.nacionales; return P_.slice().sort((a, b) => Im.afinidad(E, k, b) - Im.afinidad(E, k, a))[0]; };
      const filaG = x => { const cerca = idxP(x.k); return `<div class="imp-grupo"${UI.tt(`<div class="tt-t">${x.icono} ${esc(x.nombre)}</div><div class="tt-f"><span>Peso electoral</span><b>${x.peso}</b></div>${x.leyes.length ? '<div style="margin-top:6px"><b>Leyes que más les afectan</b></div>' + x.leyes.map(l => `<div class="tt-f"><span>${esc(l.v.t)}</span><b class="${l.e >= 0 ? 'bien' : 'mal'}">${sg(l.e)}</b></div>`).join('') : ''}`)}><span class="nom">${x.icono} ${esc(x.nombre)}</span><div class="imp-sat">${Comp.barraRango(x.v, colorSat(x.v))}</div><b class="num" style="color:${colorSat(x.v)}">${Math.round(x.v)}</b><span class="tenue" style="font-size:11.5px">${cerca ? 'Más cerca de ' + esc(E.partidos[cerca].sigla) : ''}</span></div>`; };
      const clima = S.clima, serie = (ser.clima || []).slice(-100);
      return `<div class="grid g3" style="margin-bottom:14px"><div class="tarjeta">${Comp.kpi('Clima social', sg(clima, 1), clima >= 5 ? 'Los colectivos están, en conjunto, satisfechos' : clima <= -5 ? 'Malestar generalizado' : 'Equilibrado')}</div>
          <div class="tarjeta">${Comp.kpi('Aprobación del Gobierno', Math.round(P.gob.aprob) + ' %', 'Sube y baja con la economía y el clima social')}</div>
          <div class="tarjeta">${Comp.kpi('Leyes en vigor', C.Impacto.enVigor(E).length, 'Cada una mueve indicadores y colectivos')}</div></div>
        <h3 class="imp-sec">Estado del país</h3><div class="imp-grid">${ind.map(tarjInd).join('')}</div>
        <div class="grid g-dash" style="margin-top:16px"><div class="tarjeta"><h3>Satisfacción de los colectivos con el Gobierno</h3><div class="imp-grupos">${gr.sort((a, b) => b.peso - a.peso).map(filaG).join('')}</div><p class="tenue" style="font-size:12px;margin:8px 0 0">Los colectivos descontentos castigan al Gobierno y se acercan a los partidos más próximos a ellos. El peso indica su influencia electoral.</p></div>
          <div class="tarjeta"><h3>Evolución del clima social</h3>${serie.length > 2 ? G.linea([{ nombre: 'Clima social', color: '#E0B54A', datos: serie }], { alto: 170, area: true, fmt: v => Math.round(v) }) : '<div class="vacio">Aún no hay datos.</div>'}<p class="tenue" style="font-size:12px;margin:6px 0 0">Media de la satisfacción de los colectivos (ponderada por su peso electoral) sobre 50.</p></div></div>`;
    },

    /* Enmiendas que piden los grupos a un proyecto en comisión (si el jugador es su autor). */
    enmiendasHTML(E, p) {
      if (!['registro', 'ponencia'].includes(p.etapa)) return '';
      const edit = p.autor.tipo === 'jugador' || (p.autor.tipo === 'gobierno' && C.Consejo.pmEsJ(E));
      if (!edit) return '';
      const en = C.Impacto.enmiendas(E, p);
      return `<h3 class="imp-sec" style="margin-top:14px">✍️ Enmiendas · lo que piden los grupos</h3>${en.length ? `<div class="lista" style="font-size:13px">${en.map(x => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="min-width:200px"><b>${Comp.partido(E, x.pid)} <span class="tenue">· ${x.esc} escaños</span></b><span>Apoyaría el texto si aceptas ${esc(x.texto)} (margen ${x.gana >= 0 ? '+' : ''}${x.gana} votos).</span></div>${UI.botonAccion('aceptar_enmienda', { proy: p.id, k: x.cambio.k, v: x.cambio.v, pid: x.pid }, 'Aceptar', 'chico')}</div>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">Ningún grupo pide cambios que le hagan apoyar el texto.</div>'}<div class="tenue" style="font-size:12px;margin-top:4px">Enmiendas aceptadas: ${p.enm || 0}/3.</div>`;
    }
  };
})(window.ESP);

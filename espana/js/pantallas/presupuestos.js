/* Presupuestos: panel de los Presupuestos Generales del Estado (cuentas, diseño, negociación, ejecución) y de los presupuestos autonómicos (ingresos, intereses, regla fiscal). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const mm = (E, pct) => U.d1(pct / 100 * E.paises.ES.ec.pib);          // % PIB → mil millones de euros
  const sg = (x, d) => (x > 0.0001 ? '+' : '') + U.d1(x * (d || 1));

  const Pp = C.Pantallas.presupuestos = {
    /* ── Nacional ── */
    nacional(E) {
      const Pr = C.Presupuesto, pg = Pr.asegurar(E), J = E.jugador, g = E.paises.ES.gob, ec = E.paises.ES.ec;
      const lev = pg.borrador ? pg.borrador.lev : pg.lev, cu = Pr.cuentas(E, lev), cuV = Pr.cuentas(E, pg.lev), b = Pr.base(E);
      const puede = Pr.puedeNegociar(E), tr = pg.tramite && E.proyectos[pg.tramite];
      const est = tr ? ['En las Cortes', 'amar'] : pg.estado === 'aprobado' ? ['Aprobados', 'verde'] : ['Prorrogados', 'rojo'];
      const pr = tr ? C.Congreso.proyectar(E, tr) : null;
      const pm = E.politicos[g.pm];
      const filasI = Object.keys(Pr.ING).map(k => { const a = cu.ing[k], v = b.ing[k]; return `<tr><td>${Pr.ING[k][1]} ${esc(Pr.ING[k][0])}</td><td class="num">${U.d1(a)} %</td><td class="num">${mm(E, a)}</td><td class="num ${a - v > 0.03 ? 'bien' : a - v < -0.03 ? 'mal' : 'tenue'}">${(lev.ing[k] || 0) ? sg(lev.ing[k]) + ' %' : '—'}</td></tr>`; }).join('') + (cu.ing.gran ? `<tr><td>💎 Grandes patrimonios y banca</td><td class="num">${U.d1(cu.ing.gran)} %</td><td class="num">${mm(E, cu.ing.gran)}</td><td class="num bien">${lev.gran} pts</td></tr>` : '');
      const filasG = Object.keys(Pr.GAS).map(k => { const a = cu.gas[k], l = lev.gas[k] || 0, ind = Pr.GAS[k][3]; return `<tr><td>${Pr.GAS[k][1]} ${esc(Pr.GAS[k][0])}</td><td class="num" style="white-space:nowrap">${U.d1(a)} %</td><td class="num">${mm(E, a)}</td><td class="num ${l > 0 ? 'bien' : l < 0 ? 'mal' : 'tenue'}">${l ? sg(l) + ' %' : '—'}</td><td class="tenue" style="font-size:12px">${ind ? esc(D().indicadores[ind].nombre) : ''}</td></tr>`; }).join('') + `<tr><td>💳 Intereses de la deuda</td><td class="num">${U.d1(cu.gas.int)} %</td><td class="num">${mm(E, cu.gas.int)}</td><td class="num tenue">auto</td><td></td></tr>`;
      const tot = U.suma(C.Territorio.ids().map(c => D().ccaa[c].pob));
      const inv = C.Territorio.ids().map(c => ({ c, v: (pg.borrador ? pg.borrador.inv : pg.inv)[c] || 0 })).filter(x => x.v).sort((a, b2) => b2.v - a.v).slice(0, 6);
      const pactos = Object.keys(pg.pactos || {}).map(k => { const d = Pr.demandas(E, k).find(x => x.k === pg.pactos[k].k); return `<div class="it"><span class="pto" style="background:${E.partidos[k].color}"></span><div class="cuerpo"><b>${esc(E.partidos[k].sigla)}</b><span>${esc(d ? d.n : pg.pactos[k].k)}</span></div></div>`; }).join('');
      const hist = (pg.hist || []).map(h => `<tr><td>${h.ano}</td><td class="num">${U.d1(h.prev)} %</td><td class="num">${U.d1(h.real)} %</td><td class="num ${h.gap > 0.4 ? 'mal' : h.gap < -0.4 ? 'bien' : 'tenue'}">${sg(h.gap)} pp</td></tr>`).join('');
      const dev = pg.desviacion ? `<div class="nota" style="border-color:var(--no);margin-bottom:12px">⚠ El déficit se ha desviado ${sg(pg.desviacion.gap)} pp de lo presupuestado. <button class="btn chico" id="pp-desv">Responder</button></div>` : '';
      return `${dev}<div class="grid g-dash"><div class="col">
        <div class="tarjeta"><div class="t-cab"><h3>🏛 Presupuestos Generales del Estado</h3><span class="etq ${est[1]}">${est[0]}</span></div>
          <div class="grid g3" style="margin:6px 0 10px"><div>${Comp.kpi('Déficit previsto', U.d1(cu.deficit) + ' %', 'del PIB')}</div><div>${Comp.kpi('Gasto', U.d1(cu.totG) + ' %', mm(E, cu.totG) + ' mil M€')}</div><div>${Comp.kpi('Deuda a 3 años', U.n(cu.deuda3) + ' %', 'hoy ' + U.n(ec.deuda) + ' %')}</div></div>
          <div class="nota" style="border-color:${cu.ue.ok ? 'var(--borde)' : 'var(--no)'}">${cu.ue.ok ? '✔' : '⚠'} ${esc(cu.ue.aviso)} · impulso fiscal ${sg(cu.impulso)} pp${pg.borrador ? ' · <b>borrador sin aprobar</b>' : ''}</div>
          ${pr ? `<div style="margin-top:10px">${G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 18 })}<div class="tenue" style="font-size:12px;margin-top:4px">Votación en el Congreso: ${pr.si} sí · ${pr.no} no · ${pr.dist >= 0 ? '<b class="bien">saldría adelante</b>' : '<b class="mal">decaería (faltan ' + Math.abs(pr.dist) + ')</b>'}. <a href="#" id="pp-ver">Ver tramitación</a></div></div>` : ''}
          <div class="fila" style="margin-top:10px;gap:6px;flex-wrap:wrap">${puede ? `<button class="btn prim chico" id="pp-diseno">📐 Elaborar los presupuestos</button><button class="btn chico" id="pp-neg">🤝 Negociar con los grupos</button>` : ''}${!puede ? '<span class="tenue" style="font-size:12.5px">Sólo el presidente y el ministro de Hacienda elaboran los Presupuestos; los demás los cabildean desde Leyes.</span>' : ''}</div>
          ${pactos ? `<h3 style="margin:12px 0 4px;font-size:12px;letter-spacing:.12em;color:var(--tenue);text-transform:uppercase">Pactos cerrados</h3><div class="lista">${pactos}</div>` : ''}</div>
        <div class="tarjeta"><h3>💶 Ingresos (% del PIB · mil M€)</h3><table class="tabla"><thead><tr><th>Concepto</th><th class="num">% PIB</th><th class="num">Mil M€</th><th class="num">Palanca</th></tr></thead><tbody>${filasI}<tr><td><b>Total</b></td><td class="num"><b>${U.d1(cu.totI)} %</b></td><td class="num"><b>${mm(E, cu.totI)}</b></td><td></td></tr></tbody></table></div>
        <div class="tarjeta"><h3>📈 Ejecución y cierre de ejercicios</h3>${pg.ejec ? `<div class="fila" style="gap:14px;font-size:13px;margin-bottom:8px"><span>Déficit previsto <b>${U.d1(pg.ejec.deficitPrev)} %</b></span><span>Déficit real <b class="${ec.deficit > pg.ejec.deficitPrev + 0.4 ? 'mal' : 'bien'}">${U.d1(ec.deficit)} %</b></span></div>` : '<div class="tenue" style="font-size:12.5px;margin-bottom:8px">Con presupuestos prorrogados no hay ejecución nueva: las partidas se congelan y la inflación las erosiona.</div>'}
          <table class="tabla"><thead><tr><th>Ejercicio</th><th class="num">Previsto</th><th class="num">Real</th><th class="num">Desvío</th></tr></thead><tbody>${hist || '<tr><td colspan="4" class="tenue">Aún no hay cierres de ejercicio.</td></tr>'}</tbody></table></div>
      </div><div class="col">
        <div class="tarjeta"><h3>🧾 Gasto por políticas</h3><table class="tabla"><thead><tr><th>Política</th><th class="num">% PIB</th><th class="num">Mil M€</th><th class="num">Palanca</th><th>Efecto en</th></tr></thead><tbody>${filasG}<tr><td><b>Total</b></td><td class="num"><b>${U.d1(cu.totG)} %</b></td><td class="num"><b>${mm(E, cu.totG)}</b></td><td></td><td></td></tr></tbody></table>
          <p class="tenue" style="font-size:12.5px;margin:8px 0 0">Subir el gasto en una política mejora poco a poco su indicador (Leyes → País), sube el déficit y da impulso al crecimiento. Subir impuestos hace lo contrario y resta popularidad.</p></div>
        <div class="tarjeta"><h3>🗺 Inversión territorial pactada</h3>${inv.length ? `<div class="lista">${inv.map(x => `<div class="it"><b style="width:140px">${esc(D().ccaa[x.c].nombre)}</b><span class="etq verde">+${x.v} % de inversión</span></div>`).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">Sin inversiones extraordinarias. Los partidos regionales piden inversión en su comunidad a cambio de su voto.</div>'}</div>
      </div></div>`;
    },

    enlazarNacional(el) {
      const E = C.E, pg = C.Presupuesto.asegurar(E);
      const d = UI.$('#pp-diseno', el); if (d) d.onclick = () => Pp.disenar();
      const n = UI.$('#pp-neg', el); if (n) n.onclick = () => Pp.negociar();
      const v = UI.$('#pp-ver', el); if (v) v.onclick = e => { e.preventDefault(); C.Pantallas.leyes.ver(pg.tramite); };
      const ds = UI.$('#pp-desv', el); if (ds) ds.onclick = () => Pp.desviacion();
    },

    /* Diseño de los Presupuestos: impuestos y gasto con la proyección en vivo. */
    disenar() {
      const E = C.E, Pr = C.Presupuesto, pg = Pr.asegurar(E), J = E.jugador, g = E.paises.ES.gob;
      if (!pg.borrador) pg.borrador = { lev: Pr.copia(pg.lev && (pg.lev.gas && Object.keys(pg.lev.gas).length) ? pg.lev : Pr.porDefecto(E)), inv: Object.assign({}, pg.inv) };
      const lev = pg.borrador.lev;
      const slider = (tipo, k, nom, ic, min, max, step, val) => `<div class="fila" style="gap:8px;flex-wrap:nowrap;margin:2px 0"><span style="width:210px;font-size:12.5px">${ic} ${esc(nom)}</span><input type="range" data-${tipo}="${k}" min="${min}" max="${max}" step="${step}" value="${val}" style="flex:1"><b class="num" style="width:54px;text-align:right" data-v="${tipo}-${k}"></b></div>`;
      const cuerpo = `<p class="tenue" style="margin-top:0;font-size:13px">Cada palanca se mide frente al presupuesto de partida (0 = igual). Mira cómo cambian el déficit, la deuda y los votos que necesitas en el Congreso.</p>
        <div id="pd-kpi" class="grid g3" style="margin-bottom:8px"></div><div id="pd-aviso" class="nota" style="margin-bottom:8px"></div><div id="pd-barra"></div><div id="pd-voto" class="tenue" style="font-size:12px;margin:4px 0 10px"></div>
        <h3 class="imp-sec">Ingresos</h3>${Object.keys(Pr.ING).filter(k => k !== 'otros').map(k => slider('i', k, Pr.ING[k][0], Pr.ING[k][1], -15, 15, 1, lev.ing[k] || 0)).join('')}${slider('i', 'gran', 'Grandes patrimonios y banca', '💎', 0, 100, 5, lev.gran || 0)}
        <h3 class="imp-sec" style="margin-top:12px">Gasto por políticas</h3>${Object.keys(Pr.GAS).filter(k => !Pr.FIJAS.includes(k)).map(k => slider('g', k, Pr.GAS[k][0], Pr.GAS[k][1], -25, 30, 1, lev.gas[k] || 0)).join('')}`;
      const m = UI.modal({ titulo: '📐 Elaborar los Presupuestos Generales', icono: '🏛', clase: 'medio', cuerpo, pie: '<button class="btn" id="pd-g">Guardar borrador</button><button class="btn prim" id="pd-p">Presentar en el Congreso</button>' });
      const pintar = () => {
        UI.$$('[data-i]', m.el).forEach(i => { const k = i.dataset.i; if (k === 'gran') lev.gran = +i.value; else lev.ing[k] = +i.value; UI.$(`[data-v="i-${k}"]`, m.el).textContent = k === 'gran' ? i.value + ' pts' : sg(+i.value) + ' %'; });
        UI.$$('[data-g]', m.el).forEach(i => { lev.gas[i.dataset.g] = +i.value; UI.$(`[data-v="g-${i.dataset.g}"]`, m.el).textContent = sg(+i.value) + ' %'; });
        const cu = Pr.cuentas(E, lev), ec = E.paises.ES.ec;
        UI.$('#pd-kpi', m.el).innerHTML = `<div>${Comp.kpi('Déficit', U.d1(cu.deficit) + ' %', 'del PIB')}</div><div>${Comp.kpi('Gasto', U.d1(cu.totG) + ' %', mm(E, cu.totG) + ' mil M€')}</div><div>${Comp.kpi('Deuda a 3 años', U.n(cu.deuda3) + ' %', 'hoy ' + U.n(ec.deuda) + ' %')}</div>`;
        const av = UI.$('#pd-aviso', m.el); av.style.borderColor = cu.ue.ok ? '' : 'var(--no)'; av.innerHTML = `${cu.ue.ok ? '✔' : '⚠'} ${esc(cu.ue.aviso)} · impulso fiscal ${sg(cu.impulso)} pp`;
        const sim = Object.assign({}, g, {});
        // Proyección aproximada del voto con el ajuste ideológico del borrador
        const pm = E.politicos[g.pm] || E.politicos.J, tilt = U.suma(['pens', 'sal', 'edu', 'prot', 'viv'].map(a => lev.gas[a] || 0)) / 5 - ((lev.ing.irpf || 0) + (lev.ing.soc || 0)) / 4;
        const pr = C.Congreso.proyectar(E, { may: 'simple', autor: { tipo: 'gobierno', pid: g.partido }, pop: 50, eco: U.clamp(pm.eco - tilt * 1.5, -100, 100), soc: pm.soc, eu: pm.eu, ter: pm.ter, costo: U.clamp(cu.deficit - 2.8, -2, 3), apoyo: Object.keys(pg.pactos || {}).reduce((o, k) => (o[k] = pg.pactos[k].v, o), {}), t: 'PGE' });
        UI.$('#pd-barra', m.el).innerHTML = G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 16 });
        UI.$('#pd-voto', m.el).innerHTML = `Proyección en el Congreso: ${pr.si} sí · ${pr.no} no · ${pr.dist >= 0 ? '<b class="bien">saldría adelante</b>' : '<b class="mal">decaería (faltan ' + Math.abs(pr.dist) + ')</b>'}`;
      };
      m.el.addEventListener('input', pintar); pintar();
      UI.$('#pd-g', m.el).onclick = () => { m.cerrar(); UI.toast('Borrador guardado: puedes negociarlo con los grupos antes de presentarlo.', 'bien'); C.App.refrescar(); };
      UI.$('#pd-p', m.el).onclick = () => { m.cerrar(); const p = Pr.presentar(E, lev); if (p) { const it = E.esp.consejo.agenda.find(i => i.tipo === 'pge'); if (it) E.esp.consejo.agenda.splice(E.esp.consejo.agenda.indexOf(it), 1); UI.toast('Presupuestos presentados en el Congreso.', 'bien'); } else UI.toast('Ya hay un proyecto en tramitación.', 'mal'); C.App.refrescar(); C.App.revisarPendientes(); };
    },

    /* Negociación: cada grupo con su demanda y cómo cambia la votación. */
    negociar() {
      const E = C.E, Pr = C.Presupuesto, pg = Pr.asegurar(E), P = E.paises.ES, g = P.gob;
      const grupos = P.partidos.filter(k => (P.escanos[k] || 0) >= 3 && k !== g.partido).sort((a, b) => P.escanos[b] - P.escanos[a]).slice(0, 12);
      const tr = pg.tramite && E.proyectos[pg.tramite];
      const cuerpo = `<p class="tenue" style="margin-top:0;font-size:13px">Cada grupo pide algo a cambio de sus votos. Aceptar una demanda cuesta ${'1 ◆'} y modifica el presupuesto (más gasto, menos impuestos o más inversión en su territorio).</p>
        <div id="ng-barra"></div><div id="ng-sum" class="tenue" style="font-size:12px;margin:4px 0 8px"></div>
        <div class="lista">${grupos.map(k => { const ds = Pr.demandas(E, k), pc = pg.pactos[k]; return `<div class="it" style="flex-wrap:wrap"><span class="pto" style="background:${E.partidos[k].color}"></span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(E.partidos[k].sigla)}</b><span>${P.escanos[k]} escaños ${g.coalicion.includes(k) ? '· Gobierno' : (g.apoyoExterno || []).includes(k) ? '· apoyo externo' : ''}</span></div>${pc ? `<span class="etq verde">✔ ${esc((ds.find(d => d.k === pc.k) || {}).n || pc.k)}</span>` : `<select data-ng="${k}">${ds.map(d => `<option value="${d.k}">${esc(d.n)}</option>`).join('')}</select><button class="btn chico prim" data-ng-ok="${k}">Aceptar (1 ◆)</button>`}</div>`; }).join('')}</div>`;
      const m = UI.modal({ titulo: '🤝 Negociar los Presupuestos', icono: '🏛', clase: 'medio', cuerpo });
      const pintar = () => { const t = pg.tramite && E.proyectos[pg.tramite]; const pr = t ? C.Congreso.proyectar(E, t) : C.Consejo.proyeccionPGE(E); UI.$('#ng-barra', m.el).innerHTML = G.apilada([{ etq: 'A favor', v: pr.si, color: 'var(--si)' }, { etq: 'Abstención', v: pr.abs, color: 'var(--abs)' }, { etq: 'En contra', v: pr.no, color: 'var(--no)' }], { total: pr.total, mayoria: pr.need, alto: 16 }); UI.$('#ng-sum', m.el).innerHTML = `${pr.si} sí · ${pr.no} no · ${pr.dist >= 0 ? '<b class="bien">saldría adelante</b>' : '<b class="mal">decaería (faltan ' + Math.abs(pr.dist) + ')</b>'}`; };
      pintar();
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-ng-ok]'); if (!b) return; const pid = b.dataset.ngOk, sel = UI.$(`[data-ng="${pid}"]`, m.el); m.cerrar(); UI.accion('negociar_pge', { pid, k: sel ? sel.value : null }, {}); setTimeout(() => Pp.negociar(), 80); });
    },

    desviacion() {
      const E = C.E, pg = E.esp.pge;
      const m = UI.modal({ titulo: '⚠ Desviación del déficit', icono: '📉', clase: 'medio', sinCerrar: true, cuerpo: `<p style="margin-top:0;font-size:13.5px">El déficit real supera lo presupuestado en ${sg(pg.desviacion.gap)} pp. Bruselas y los mercados vigilan. ¿Cómo respondes?</p><div class="lista">${[['recorte', '✂️ Plan de ajuste del gasto', 'Baja el déficit; resta crecimiento y popularidad.'], ['impuestos', '🧾 Subida extraordinaria de impuestos', 'Cubre el agujero; impopular.'], ['aceptar', '🤷 Aceptar la desviación', 'No haces nada: pierdes credibilidad.']].map(([k, n, d]) => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:180px"><b>${n}</b><span>${d}</span></div><button class="btn chico prim" data-aj="${k}">Elegir</button></div>`).join('')}</div>` });
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-aj]'); if (!b) return; m.cerrar(); UI.toast(esc(C.Presupuesto.ajustar(E, b.dataset.aj)), 'bien'); C.App.refrescar(); });
    },

    /* ── Autonómico ── */
    regional(E, c) {
      const T = C.Territorio, J = E.jugador, rc = E.esp.ccaa[c], d = D().ccaa[c]; T.asegurarAut(E, c);
      const p = T.presInit(E, c), gr = T.grupos(E, c), def = T.presDefault(E, c), g = rc.gob;
      const inter = T.presIntereses(E, c), pool = T.presPool(E, c, p.total), fis = rc.fisc || {};
      const bill = p.tramite && p.tramite.bill ? T.leyAut(E, c, p.tramite.bill) : null;
      const est = p.tramite ? ['En el Parlamento', 'amar'] : p.estado === 'prorrogado' ? ['Prorrogado', 'rojo'] : ['Aprobado', 'verde'];
      const regla = rc.fla ? ['Tutelada por el Estado (fondo de liquidez)', 'rojo'] : rc.pef ? ['Plan económico-financiero', 'amar'] : ['Cumple la regla fiscal', 'verde'];
      const filas = gr.map(x => { const a = p.alloc[x.id] || 0, eur = a / 100 * pool, cred = p.cred[x.id] || 0, dd = a - (def[x.id] || a); return `<tr><td>${x.icono} ${esc(x.nombre)}</td><td class="num">${U.d1(a)} %</td><td class="num">${U.d1(eur)}</td><td class="num ${dd > 0.4 ? 'bien' : dd < -0.4 ? 'mal' : 'tenue'}">${dd >= 0 ? '+' : ''}${U.d1(dd)}</td><td class="num">${U.d1(cred)}</td></tr>`; }).join('');
      const impuestos = [['irpf', '🧾', 'Tramo autonómico del IRPF'], ['patr', '💎', 'Impuesto de patrimonio'], ['suc', '🏡', 'Sucesiones y donaciones'], ['tasas', '📑', 'Tasas y precios públicos']].map(([k, ic, n]) => `<div class="it"><span style="width:22px">${ic}</span><div class="cuerpo"><b>${n}</b></div><span class="etq ${(fis[k] || 0) > 0 ? 'rojo' : (fis[k] || 0) < 0 ? 'verde' : ''}">${fis[k] ? sg(fis[k]) + ' pts' : 'sin cambios'}</span></div>`).join('');
      const hist = (p.hist || []).map(h => `<tr><td>${h.ano}</td><td class="num">${U.d1(h.total)}</td><td class="num">${h.def ? ['', 'moderado', 'alto'][h.def] : '—'}</td><td class="num">${U.d1(h.deuda)} %</td><td class="num">${Math.round((h.ejec || 0) * 100)} %</td></tr>`).join('');
      const esMia = J.region === c, puedeElab = esMia && J.cargo === 'presauto' && p.pendiente, puedeRec = esMia && J.cargo === 'consejero';
      return `<div class="fila" style="margin-bottom:10px;gap:10px"><label class="tenue">Comunidad <select id="t-pres">${T.ids().map(x => `<option value="${x}" ${x === c ? 'selected' : ''}>${esc(D().ccaa[x].nombre)}</option>`).join('')}</select></label></div>
        <div class="grid g3" style="margin-bottom:14px"><div class="tarjeta">${Comp.kpi('Presupuesto', U.d1(p.total) + ' mil M€', 'Ejercicio ' + (p.ano + 1))}</div><div class="tarjeta">${Comp.kpi('Estado', `<span class="etq ${est[1]}" style="font-size:15px">${est[0]}</span>`, p.def ? 'Déficit autorizado ' + (p.def === 2 ? 'alto' : 'moderado') : 'Equilibrado')}</div><div class="tarjeta">${Comp.kpi('Deuda', U.d1(rc.deuda) + ' % PIB', 'Intereses ' + U.d1(inter) + ' mil M€/año')}</div></div>
        <div class="nota" style="margin-bottom:12px;border-color:${rc.fla ? 'var(--no)' : 'var(--borde)'}"><b>Regla fiscal:</b> <span class="etq ${regla[1]}">${regla[0]}</span> · La deuda por encima del 42 % obliga a un plan económico-financiero (sin déficit); por encima del 58 % hace falta el fondo de liquidez del Estado.</div>
        ${bill ? `<div class="nota" style="margin-bottom:12px;border-color:var(--oro)">📜 Los presupuestos se tramitan en el Parlamento (${esc(bill.etapa)}). <a href="#" id="pr-ley">Ver votación, cabildear y negociar en Leyes</a></div>` : ''}
        <div class="grid g-dash"><div class="tarjeta"><h3>Reparto por consejerías</h3><table class="tabla"><thead><tr><th>Consejería</th><th class="num">Peso</th><th class="num">Mil M€</th><th class="num">vs. media</th><th class="num">Crédito para programas</th></tr></thead><tbody>${filas}</tbody></table>
          <p class="tenue" style="font-size:12.5px;margin:8px 0 0">Del total se descuentan los <b>intereses de la deuda</b> (${U.d1(inter)} mil M€). Más presupuesto que la media mejora la gestión de esa consejería; menos, la empeora. El <b>crédito</b> es el 22 % de cada partida: con él se pagan obras, planes y leyes. Cada octubre el Gobierno presenta los presupuestos y el Parlamento los vota.</p>
          <div class="fila" style="margin-top:8px;gap:8px">${puedeElab ? UI.botonAccion('presupuesto_aut', {}, '💶 Elaborar los presupuestos', 'prim') : ''}${puedeRec ? UI.botonAccion('reclamar_fondos', {}, '💰 Reclamar más fondos', '') : ''}</div></div>
          <div class="col"><div class="tarjeta"><h3>Impuestos propios</h3><div class="lista" style="font-size:13px">${impuestos}</div><p class="tenue" style="font-size:12.5px;margin:8px 0 0">Ingresos propios ${sg(T.fiscDelta(rc) * 100)} % sobre la financiación. Bajarlos gusta, pero recorta recursos; subirlos da dinero y resta apoyo.</p></div>
          <div class="tarjeta"><h3>Ejercicios anteriores</h3><table class="tabla"><thead><tr><th>Año</th><th class="num">Mil M€</th><th class="num">Déficit</th><th class="num">Deuda</th><th class="num">Ejecución</th></tr></thead><tbody>${hist || '<tr><td colspan="5" class="tenue">Sin cierres todavía.</td></tr>'}</tbody></table></div></div></div>`;
    },

    enlazarRegional(el, c) {
      const E = C.E, T = C.Territorio, p = E.esp.ccaa[c].pres, l = UI.$('#pr-ley', el);
      if (l) l.onclick = e => { e.preventDefault(); E.ui.ambLeyes = 'aut'; C.App.ir('leyes', { amb: 'aut' }); setTimeout(() => C.Pantallas.leyesNiv.verLeyAut(p.tramite.bill), 80); };
    }
  };
})(window.ESP);

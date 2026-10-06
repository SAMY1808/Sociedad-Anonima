/* Autonomía: competencias negociables, consejerías con titulares, financiación (común, foral, canaria, singular),
   cupo vasco y navarro, adelantos electorales y mociones de censura autonómicas. Amplía C.Territorio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio;
  const NIV = ['Estado', 'Compartida', 'Transferida'];

  Object.assign(T, {
    NIV,

    /* Proyección de unas elecciones autonómicas con la opinión de hoy (sin ruido): escaños previstos y bloque de gobierno. */
    proyectar(E, c) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c], v = T.votosReg(E, c, 0), g = rc.gob;
      const w = {}; for (const k in v) if (v[k] >= d.um) w[k] = v[k];
      const e = C.Elecciones.divisores(Object.keys(w).length ? w : v, d.esc, false);
      const escanos = {}; for (const k in e) if (e[k]) escanos[k] = e[k];
      const may = Math.floor(d.esc / 2) + 1;
      return { votos: v, escanos, may, bloque: g ? U.suma(g.coalicion.map(k => escanos[k] || 0)) : 0, ahora: g ? U.suma(g.coalicion.map(k => rc.parl.escanos[k] || 0)) : 0 };
    },

    initAut(E) {
      for (const c of T.ids()) {
        const rc = E.esp.ccaa[c], d = D().ccaa[c];
        rc.comp = {};
        for (const k in D().competencias) { const esp = D().compEspecial[c]; rc.comp[k] = esp && esp[k] != null ? esp[k] : D().compBase[k]; }
        rc.fin = { regimen: d.foral ? 'foral' : c === 'CAN' ? 'canario' : (c === 'CEU' || c === 'MEL') ? 'ciudad' : 'comun', cesion: d.foral ? 100 : 50, nivel: D().finNivel[c] || 100, pedidos: 0 };
        rc.gestion = {}; for (const a in D().consejerias) rc.gestion[a] = U.clamp(U.gauss(50, 9), 28, 74);
        rc.reclama = (D().compReclama[c] || []).slice();
        rc.presion = {};
        T.calcAut(E, c); rc.aut0 = rc.aut;
        if (!rc.gob.consej || !Object.keys(rc.gob.consej).length) T.repartirConsejerias(E, c);
      }
      E.esp.cupo = { proxT: U.ri(30, 60), ultimo: -208 };
      E.esp.cpff = { proxT: U.ri(20, 50) };
    },

    /* ── Competencias ── */
    calcAut(E, c) {
      const rc = E.esp.ccaa[c], cp = D().competencias; let num = 0, den = 0;
      for (const k in cp) { num += cp[k].peso * rc.comp[k] / 2; den += cp[k].peso; }
      rc.aut = Math.round(U.clamp(22 + 72 * num / den + (rc.fin && rc.fin.regimen === 'foral' ? 6 : 0), 20, 98));
      return rc.aut;
    },

    nivelArea(E, c, area) {      // media (0-2) de las competencias de una consejería
      const rc = E.esp.ccaa[c], ks = Object.keys(D().competencias).filter(k => D().competencias[k].area === area);
      if (!ks.length) return 1;
      let n = 0, w = 0; ks.forEach(k => { n += rc.comp[k] * D().competencias[k].peso; w += D().competencias[k].peso; });
      return n / w;
    },

    /* Probabilidad (0-1) de que el Estado acceda a ceder un escalón de una competencia. */
    probComp(E, c, k) {
      const rc = E.esp.ccaa[c], cp = D().competencias[k], g = E.paises.ES.gob, pm = E.politicos[g.pm]; if (!rc.gob || !pm) return 0.2;
      const pr = rc.gob.partido;
      let p = 0.56 - cp.dif * 0.62 + (rc.relM - 50) / 190 + (pm.ter || 0) / 260 + (rc.presion[k] || 0) - (cp.ley ? 0.1 : 0) - (rc.comp[k] === 1 ? 0.07 : 0);
      p += g.coalicion.includes(pr) ? 0.2 : (g.apoyoExterno || []).includes(pr) ? 0.14 : 0;
      return U.clamp(p, 0.03, 0.93);
    },

    /* Una comunidad pide una competencia: llega al orden del día del Consejo de Ministros. */
    pedirComp(E, c, k, quien) {
      const rc = E.esp.ccaa[c], cp = D().competencias[k], d = D().ccaa[c];
      if (rc.comp[k] >= 2) return 'Ya la tiene transferida';
      const cs = E.esp.consejo;
      if (cs.agenda.some(i => i.tipo === 'competencia' && i.region === c && i.comp === k)) return 'Ya está en el orden del día del Consejo';
      if ((rc.pend || []).some(p => p.tipo === 'traspaso' && p.comp === k)) return 'Ya hay un traspaso en marcha';
      if (C.Congreso.abiertos(E).some(p => p.comp === k && p.region === c)) return 'Ya hay una ley de transferencia en las Cortes';
      C.Consejo.nuevo(E, { tipo: 'competencia', titulo: `${d.nombre} reclama: ${cp.nombre}`, desc: `${rc.gob ? D().procesos[c] ? D().procesos[c].gobierno : 'El Gobierno de ' + d.nombre : 'La comunidad'} pide pasar de «${NIV[rc.comp[k]]}» a «${NIV[rc.comp[k] + 1]}» en ${cp.nombre.toLowerCase()}.${cp.ley ? ' Exige una ley orgánica de transferencia (art. 150.2 de la Constitución).' : ' Se articula mediante la Comisión Mixta de Transferencias y un real decreto.'}`, region: c, comp: k, sector: 'ter', quien: quien || { tipo: 'ccaa', nombre: d.nombre, pid: rc.gob && rc.gob.partido } });
      return true;
    },

    /* El Estado cede un escalón (por decreto tras comisión mixta, o por ley orgánica). */
    concederComp(E, c, k, directa) {
      const rc = E.esp.ccaa[c], cp = D().competencias[k], d = D().ccaa[c];
      if (cp.ley && !directa) {
        const prop = C.Congreso.proponer(E, 'transferencia_comp', { tipo: 'gobierno', pid: E.paises.ES.gob.partido }, { region: c, comp: k, t: `Ley orgánica de transferencia: ${cp.nombre} (${d.nombre})` });
        return prop ? 'ley' : 'error';
      }
      if (directa) { T.aplicarTraspaso(E, c, k); return 'hecho'; }
      rc.pend.push({ tipo: 'traspaso', t: E.fecha.t + U.ri(6, 10), comp: k });
      return 'traspaso';
    },

    aplicarTraspaso(E, c, k) {
      const rc = E.esp.ccaa[c], cp = D().competencias[k], d = D().ccaa[c];
      if (rc.comp[k] >= 2) return;
      rc.comp[k]++; rc.presion[k] = 0;
      rc.relM = Math.min(100, rc.relM + 4); T.calcAut(E, c);
      rc.gestion[cp.area] = Math.max(25, rc.gestion[cp.area] - 4);            // puesta en marcha
      if (D().ccaa[c].indep0 > 3) rc.concesiones.push({ t: E.fecha.t, v: -cp.peso * 0.3, d: cp.nombre });
      for (const x of T.ids()) if (x !== c && E.esp.ccaa[x].comp[k] < rc.comp[k]) E.esp.ccaa[x].agravio += 0.3 * cp.peso / 3;
      C.Noticias.poner(E, 'politica', `${d.nombre} asume ${rc.comp[k] === 2 ? 'la gestión plena' : 'la gestión compartida'} de ${cp.nombre.toLowerCase()}.`, 'ES');
      const J = E.jugador;
      if (J && J.pais === 'ES' && J.region === c) C.Personaje.log(E, `${d.nombre} recibe ${rc.comp[k] === 2 ? 'la transferencia' : 'la delegación'} de ${cp.nombre.toLowerCase()}.`);
      if (cp.dif >= 0.6) { for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop += 0.08; } C.Opinion.normalizarES(E); }
    },

    /* Recentralización: el Estado recupera competencias. */
    recentralizarComp(E) {
      for (const c of T.ids()) { const rc = E.esp.ccaa[c]; for (const k of ['edu', 'sal', 'len', 'uni']) if (rc.comp[k] === 2 && U.chance(0.5)) rc.comp[k] = 1; T.calcAut(E, c); }
    },

    /* ── Estructura del Gobierno: de 7 a 15 consejerías, agrupando áreas ── */
    estructura(n) {
      n = U.clamp(Math.round(n), D().nConsMin, D().nConsMax);
      const head = {}; Object.keys(D().consejerias).forEach(a => head[a] = a);
      const res = a => { while (head[a] !== a) a = head[a]; return a; };
      for (const [x, y] of D().fusiones.slice(0, D().nConsMax - n)) head[res(x)] = res(y);
      const gr = {};
      Object.keys(D().consejerias).forEach(a => { const h = res(a); (gr[h] = gr[h] || []).push(a); });
      return Object.keys(gr).map(h => { const atoms = [h].concat(gr[h].filter(a => a !== h)), nom = atoms.length === 1 ? D().consejerias[h].nombre : atoms.map(a => D().consejerias[a].corto).reduce((s, x, i, l) => s + (i === 0 ? '' : i === l.length - 1 ? ' y ' : ', ') + x, '');
        return { id: h, atoms, nombre: nom, icono: D().consejerias[h].icono, peso: U.suma(atoms.map(a => D().consejerias[a].peso)) }; });
    },
    grupos(E, c) { const g = E.esp.ccaa[c].gob; return g && g.estr ? g.estr : T.estructura(D().nCons[c] || 10); },
    infoGrupo(E, c, id) { return T.grupos(E, c).find(x => x.id === id) || (D().consejerias[id] ? { id, atoms: [id], nombre: D().consejerias[id].nombre, icono: D().consejerias[id].icono, peso: D().consejerias[id].peso } : { id, atoms: [id], nombre: id, icono: '💼', peso: 1 }); },
    cabezaDe(E, c, atom) { const g = T.grupos(E, c).find(x => x.atoms.includes(atom)); return g ? g.id : atom; },
    nivelGrupo(E, c, id) { const gr = T.infoGrupo(E, c, id); let n = 0, w = 0; gr.atoms.forEach(a => { const p = D().consejerias[a].peso; n += T.nivelArea(E, c, a) * p; w += p; }); return w ? n / w : 1; },

    /* Rellena lo que falte en partidas antiguas (competencias, gestión y estructura nuevas). */
    asegurarAut(E, c) {
      const rc = E.esp.ccaa[c]; if (!rc.comp) return;
      for (const k in D().competencias) if (rc.comp[k] == null) rc.comp[k] = (D().compEspecial[c] && D().compEspecial[c][k] != null) ? D().compEspecial[c][k] : D().compBase[k];
      rc.gestion = rc.gestion || {}; for (const a in D().consejerias) if (rc.gestion[a] == null) rc.gestion[a] = U.clamp(U.gauss(50, 9), 28, 74);
      rc.obras = rc.obras || []; rc.agenda = rc.agenda || []; rc.hist = rc.hist || []; if (rc.gob && !rc.pres && rc.gob.estr) T.presInit(E, c);
      if (rc.gob && !rc.gob.estr) T.repartirConsejerias(E, c);
    },

    /* ── Presupuesto autonómico: se aprueba cada año y se asigna a cada consejería ── */
    presTotal(E, c) { const d = D().ccaa[c], rc = E.esp.ccaa[c]; return d.pob * d.pibpc * 0.14 * (rc.fin.nivel / 100) * (1 + T.fiscDelta(rc)); },
    /* Impuestos propios y tramos autonómicos (−10…+10): efecto en los ingresos. */
    fiscDelta(rc, f) { f = f || rc.fisc || {}; return (f.irpf || 0) * 0.006 + (f.patr || 0) * 0.002 + (f.suc || 0) * 0.002 + (f.tasas || 0) * 0.003; },
    presIntereses(E, c) { const d = D().ccaa[c], rc = E.esp.ccaa[c]; return d.pob * d.pibpc * rc.deuda / 100 * 0.022; },
    presPool(E, c, total) { return Math.max(0.1, total - T.presIntereses(E, c)); },
    presDefault(E, c) { const gr = T.grupos(E, c), tp = U.suma(gr.map(g => g.peso)), a = {}; gr.forEach(g => a[g.id] = Math.round(g.peso / tp * 1000) / 10); return a; },
    presNormal(alloc, ids) { const a = {}; let s = 0; ids.forEach(k => { a[k] = Math.max(1, +alloc[k] || 1); s += a[k]; }); ids.forEach(k => a[k] = Math.round(a[k] / s * 1000) / 10); return a; },
    presInit(E, c) {
      const rc = E.esp.ccaa[c]; if (rc.pres) return rc.pres;
      const alloc = T.presDefault(E, c), total = T.presTotal(E, c), cred = {}, gastado = {};
      Object.keys(alloc).forEach(k => { cred[k] = alloc[k] / 100 * T.presPool(E, c, total) * 0.22; gastado[k] = 0; });
      rc.fisc = rc.fisc || { irpf: 0, patr: 0, suc: 0, tasas: 0 };
      return rc.pres = { ano: U.anio(), estado: 'aprobado', total, alloc, def: 0, cred, gastado, tramite: null, pendiente: false, off: {}, hist: [], defAnt: 0 };
    },
    /* Si cambia la estructura del Gobierno, reparte el presupuesto entre las nuevas consejerías. */
    presAjustar(E, c) {
      const p = T.presInit(E, c), ids = T.grupos(E, c).map(g => g.id), ok = ids.length === Object.keys(p.alloc).length && ids.every(k => p.alloc[k] != null);
      if (ok) return;
      const nuevo = {}, cred = {}, gastado = {}; T.grupos(E, c).forEach(g => { nuevo[g.id] = U.suma(Object.keys(p.alloc).filter(k => g.atoms.includes(k) || k === g.id).map(k => p.alloc[k])) || T.presDefault(E, c)[g.id]; });
      p.alloc = T.presNormal(nuevo, ids); ids.forEach(k => { cred[k] = p.alloc[k] / 100 * T.presPool(E, c, p.total) * 0.22; gastado[k] = 0; }); p.cred = cred; p.gastado = gastado;
    },
    /* Se presenta el proyecto de presupuesto: lo vota el Parlamento autonómico. */
    presPresentar(E, c, alloc, def, ia, fisc) {
      const rc = E.esp.ccaa[c], p = T.presInit(E, c), g = rc.gob; if (!g || p.tramite) return false;
      const ids = T.grupos(E, c).map(x => x.id);
      if (rc.pef) def = 0;   // plan económico-financiero: sin déficit autorizado
      p.tramite = { alloc: T.presNormal(alloc || T.presDefault(E, c), ids), def: def || 0, fisc: Object.assign({ irpf: 0, patr: 0, suc: 0, tasas: 0 }, fisc || rc.fisc || {}), t: E.fecha.t + 5 };
      if (T.nuevaLeyAut && T.presLey) { const b = T.nuevaLeyAut(E, c, { prog: '__pres', pid: g.partido, quien: 'Gobierno autonómico', jugador: false, eff: 1 }); b.pres = true; p.tramite.bill = b.id; p.tramite.t = E.fecha.t + 99; }
      p.pendiente = false;
      C.Noticias.poner(E, 'politica', `El Gobierno de ${D().ccaa[c].nombre} presenta el proyecto de presupuestos${p.tramite.def ? ' con déficit' : ''}.`, 'ES');
      return true;
    },
    presVotar(E, c) {
      const rc = E.esp.ccaa[c], p = rc.pres, g = rc.gob, tr = p.tramite; p.tramite = null; if (!g || !tr) return;
      const seats = U.suma(g.coalicion.map(k => rc.parl.escanos[k] || 0)), ext = U.suma((g.apoyoExterno || []).map(k => rc.parl.escanos[k] || 0)), may = Math.floor(D().ccaa[c].esc / 2) + 1;
      T.presResultado(E, c, U.chance(seats >= may ? 0.93 : seats + ext >= may ? 0.8 : 0.55), tr);
    },
    /* Resultado de la votación de los presupuestos autonómicos (por probabilidad o por el pleno). */
    presResultado(E, c, ok, tr) {
      const rc = E.esp.ccaa[c], p = rc.pres, g = rc.gob, J = E.jugador; p.tramite = null; if (!g || !tr) return;
      const nom = D().ccaa[c].nombre, suyo = J && J.region === c && ['presauto', 'consejero'].includes(J.cargo);
      p.ano = U.anio();
      if (ok) {
        const fiscAnt = Object.assign({}, rc.fisc || {}); rc.fisc = Object.assign({ irpf: 0, patr: 0, suc: 0, tasas: 0 }, tr.fisc || {});
        p.estado = 'aprobado'; p.alloc = tr.alloc; p.def = tr.def; p.total = T.presTotal(E, c) * (1 + 0.04 * tr.def); p.intereses = T.presIntereses(E, c);
        const def = T.presDefault(E, c); p.off = {};
        Object.keys(p.alloc).forEach(k => { p.cred[k] = p.alloc[k] / 100 * T.presPool(E, c, p.total) * 0.22; p.gastado[k] = 0; p.off[k] = U.clamp((p.alloc[k] / (def[k] || 1) - 1) * 12 + tr.def * 1.5, -10, 12); });
        const dF = (rc.fisc.irpf - (fiscAnt.irpf || 0)) * 0.06 + (rc.fisc.tasas - (fiscAnt.tasas || 0)) * 0.04 - ((rc.fisc.patr - (fiscAnt.patr || 0)) + (rc.fisc.suc - (fiscAnt.suc || 0))) * 0.015;
        g.aprob = U.clamp(g.aprob - dF, 5, 90); g.estab = U.clamp(g.estab + 4, 0, 100);
        p.defPrev = p.defAnt; p.defAnt = tr.def;
        T.acuerdo(E, c, `Se aprueban los presupuestos de ${p.ano + 1}.`);
        C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} aprueba los presupuestos de ${p.ano + 1} (${U.d1(p.total)} mil millones${tr.def ? ', con déficit autorizado' : ''}).`, 'ES');
        if (suyo) C.Personaje.log(E, `Se aprueban los presupuestos autonómicos de ${nom} (${U.d1(p.total)} mil millones).`);
      } else {
        p.estado = 'prorrogado'; Object.keys(p.cred).forEach(k => { p.cred[k] = p.alloc[k] / 100 * T.presPool(E, c, p.total) * 0.22 * 0.8; p.gastado[k] = 0; }); Object.keys(p.off).forEach(k => p.off[k] = (p.off[k] || 0) - 3);
        g.estab = U.clamp(g.estab - 4, 0, 100); g.aprob = U.clamp(g.aprob - 1, 5, 90);
        C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} rechaza los presupuestos: se prorrogan los anteriores.`, 'ES');
        if (suyo) C.Personaje.log(E, `Los presupuestos de ${nom} fracasan en el Parlamento: se prorrogan.`);
      }
    },
    /* Regla de gasto y estabilidad: un plan económico-financiero si la deuda se dispara; rescate del Estado si se desboca. */
    reglaFiscal(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, p = rc.pres, nom = D().ccaa[c].nombre; if (!g) return;
      if (!rc.pef && (rc.deuda > 42 || (p.defAnt === 2 && p.defPrev === 2))) { rc.pef = true; g.aprob = U.clamp(g.aprob - 1.5, 5, 90); C.Noticias.poner(E, 'politica', `Hacienda exige a ${nom} un plan económico-financiero por incumplir la estabilidad presupuestaria: no podrá autorizar déficit.`, 'ES'); }
      else if (rc.pef && rc.deuda < 37) { rc.pef = false; C.Noticias.poner(E, 'politica', `${nom} cumple la regla fiscal: se levanta el plan económico-financiero.`, 'ES'); }
      if (rc.deuda > 58 && !rc.fla) { rc.fla = true; rc.relM = U.clamp(rc.relM - 10, 0, 100); g.estab = U.clamp(g.estab - 6, 0, 100); C.Noticias.poner(E, 'politica', `${nom} recurre al fondo de liquidez del Estado con condiciones: el Gobierno tutela sus cuentas.`, 'ES'); }
      else if (rc.fla && rc.deuda < 50) { rc.fla = false; C.Noticias.poner(E, 'politica', `${nom} deja de depender del fondo de liquidez.`, 'ES'); }
    },
    /* Cierre del ejercicio: lo no gastado reduce la deuda. */
    presCierre(E, c) {
      const rc = E.esp.ccaa[c], p = rc.pres, d = D().ccaa[c]; if (!p || !p.cred) return;
      const libre = U.suma(Object.values(p.cred)), gast = U.suma(Object.values(p.gastado)), tot = libre + gast;
      rc.deuda = U.clamp(rc.deuda - libre / Math.max(1, d.pob * d.pibpc) * 100 * 0.35, 3, 120);
      p.hist = p.hist || []; p.hist.unshift({ ano: p.ano + 1, total: p.total, def: p.def, deuda: rc.deuda, ejec: tot ? gast / tot : 0, estado: p.estado }); if (p.hist.length > 10) p.hist.length = 10;
      T.reglaFiscal(E, c);
    },
    presTurno(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, f = U.hoy(), J = E.jugador; if (!g || rc.suspendida) return;
      const p = T.presInit(E, c); T.presAjustar(E, c);
      const presJ = J && J.region === c && J.cargo === 'presauto';
      if (f.getUTCMonth() === 9 && f.getUTCDate() <= 7 && p.ano < f.getUTCFullYear() && !p.tramite && !p.pendiente) {
        if (presJ) { p.pendiente = E.fecha.t + 5; C.Eventos.info(E, '💶 Presupuestos autonómicos', `Es el momento de elaborar los presupuestos de ${D().ccaa[c].nombre}: reparte el dinero entre las consejerías (Agenda → Elaborar los presupuestos). Si no lo haces, se presentará el reparto por defecto.`); }
        else T.presPresentar(E, c, null, g.aprob > 50 ? 1 : 0, true);
      }
      if (p.pendiente && E.fecha.t >= p.pendiente) T.presPresentar(E, c, null, 0, true);
      if (p.tramite && !p.tramite.bill && E.fecha.t >= p.tramite.t) T.presVotar(E, c);
      if (f.getUTCMonth() === 11 && f.getUTCDate() <= 7 && p.cierre !== f.getUTCFullYear()) { p.cierre = f.getUTCFullYear(); T.presCierre(E, c); }
      // Déficit autorizado: la deuda autonómica sube o baja
      if (p.def) rc.deuda = U.clamp(rc.deuda + p.def * 0.012, 3, 120);
    },

    /* ── Consejo de Gobierno autonómico ── */
    acuerdo(E, c, txt) { const rc = E.esp.ccaa[c]; rc.hist = rc.hist || []; rc.hist.unshift({ t: E.fecha.t, txt }); if (rc.hist.length > 40) rc.hist.length = 40; },
    consejoGenerar(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, J = E.jugador; if (!g || !J || J.region !== c || J.cargo !== 'presauto') return;
      rc.agenda = (rc.agenda || []).filter(i => E.fecha.t - i.t <= 4);
      if (rc.agenda.length >= 4 || !U.chance(0.22)) return;
      const gr = U.pesado(T.grupos(E, c).filter(x => x.id !== 'pre'), x => x.peso), pr = U.pick(T.programasDe(E, c, gr.id)), h = g.consej && g.consej[gr.id];
      if (!pr || rc.agenda.some(i => i.prog === pr.id) || rc.pend.some(p => p.tipo === 'prog' && p.prog === pr.id)) return;
      rc.agenda.push({ id: U.id('cg'), t: E.fecha.t, prog: pr.id, area: gr.id, quien: h && h !== 'J' ? h.n : 'La consejería' });
    },
    resolverItemGob(E, c, id, k) {
      const rc = E.esp.ccaa[c], i = (rc.agenda || []).findIndex(x => x.id === id); if (i < 0) return { ok: false, msg: 'El punto ya no está en el orden del día' };
      const it = rc.agenda.splice(i, 1)[0], pr = T.programa(it.prog);
      if (k === 'rechazar') { T.acuerdo(E, c, `Se rechaza «${pr.n}».`); return { ok: true, msg: 'Rechazado' }; }
      if (k === 'aplazar') return { ok: true, msg: 'Aplazado' };
      const r = T.iniciarPrograma(E, c, it.prog, false); if (!r.ok) T.acuerdo(E, c, `No se puede aprobar «${pr.n}»: ${r.msg}`); return r;
    },
    /* Un consejero (jugador) lleva un programa al Consejo de Gobierno: el presidente decide. */
    llevarAlConsejo(E, c, progId, endeudar) {
      const J = E.jugador, g = E.esp.ccaa[c].gob, pr = T.programa(progId);
      const p = U.clamp(0.62 + (J.prestigio - 40) / 200 + (J.partido === g.partido ? 0.12 : -0.05) + (pr.tipo === 'accion' ? 0.1 : 0), 0.3, 0.93);
      if (!U.chance(p)) { T.acuerdo(E, c, `El presidente aplaza «${pr.n}», propuesta de ${J.nombre}.`); return { ok: true, exito: false, msg: `El Consejo de Gobierno aplaza «${pr.n}»: el presidente prefiere esperar.` }; }
      return T.iniciarPrograma(E, c, progId, false, endeudar);
    },

    /* ── Programas de consejería: obras, leyes autonómicas y planes ── */
    programa(id) { if (id === '__pres') return { id: '__pres', area: 'eco', tipo: 'ley', n: 'Presupuestos de la comunidad', d: 'Reparto del dinero entre las consejerías, impuestos propios y déficit autorizado del próximo ejercicio.', pts: 0, sem: 0, gest: 0, aprob: 0, deuda: 0 }; for (const a in D().programas) { const p = D().programas[a].find(x => x.id === id); if (p) return p; } return null; },
    programasDe(E, c, head) { return T.infoGrupo(E, c, head).atoms.flatMap(a => D().programas[a] || []); },
    /* Coste de un programa en mil millones: proporcional al tamaño del presupuesto de la comunidad (un hospital en La Rioja no cuesta lo que en Madrid). */
    progCoste(E, c, prog) { const tot = T.presInit(E, c).total; return Math.max(0.03, Math.round(Math.abs(prog.deuda) * 0.02 * tot * 1000) / 1000); },
    iniciarPrograma(E, c, id, ia, endeudar) {
      const rc = E.esp.ccaa[c], g = rc.gob, prog = T.programa(id); if (!prog || !g) return { ok: false, msg: 'Programa desconocido' };
      T.asegurarAut(E, c);
      const niv = T.nivelArea(E, c, prog.area);
      if (niv < 0.45 && !['pre', 'eco'].includes(prog.area)) return { ok: false, msg: `Tu comunidad apenas tiene competencias en ${D().consejerias[prog.area].corto.toLowerCase()}: reclama el traspaso al Estado.` };
      if (rc.obras.filter(o => o.area === prog.area && !o.fin).length >= 2) return { ok: false, msg: 'Ya hay dos proyectos en marcha en esta área.' };
      if (rc.pend.some(p => p.tipo === 'prog' && p.prog === id)) return { ok: false, msg: 'Ese programa ya está en marcha.' };
      const eff = 0.5 + 0.5 * Math.min(1, niv / 1.5);
      const pres = T.presInit(E, c), head = T.cabezaDe(E, c, prog.area), coste = T.progCoste(E, c, prog), cred = pres.cred[head] || 0;
      if (cred < coste) {
        const falta = coste - cred;
        if (!endeudar) return { ok: false, msg: `Sin crédito: tu consejería tiene ${U.d2(cred)} mil millones y el programa cuesta ${U.d2(coste)}. Puedes financiar lo que falta con deuda, pedir más presupuesto o esperar al próximo ejercicio.`, deuda: true };
        if (rc.pef || rc.fla) return { ok: false, msg: 'Estás bajo un plan económico-financiero: no puedes endeudarte para pagar programas.' };
        const d = D().ccaa[c]; rc.deuda = U.clamp(rc.deuda + falta / Math.max(1, d.pob * d.pibpc) * 100, 3, 120);
        pres.cred[head] = 0; pres.gastado[head] = (pres.gastado[head] || 0) + cred + falta;
        T.acuerdo(E, c, `Se financian con deuda ${U.d2(falta)} mil millones de «${prog.n}».`);
      } else { pres.cred[head] -= coste; pres.gastado[head] = (pres.gastado[head] || 0) + coste; }
      T.acuerdo(E, c, `Se pone en marcha «${prog.n}».`);
      if (prog.tipo === 'accion') { T.aplicarPrograma(E, c, prog, eff, ia); return { ok: true, msg: `${prog.n}: aplicado.` }; }
      if (prog.tipo === 'obra') { rc.deuda = U.clamp(rc.deuda + prog.deuda * 0.22, 3, 120); rc.pend.push({ t: E.fecha.t + prog.sem, tipo: 'prog', prog: id, res: 'obra', eff }); rc.obras.push({ id, area: prog.area, nombre: prog.n, t0: E.fecha.t, t1: E.fecha.t + prog.sem, fin: false }); return { ok: true, msg: `Arranca el proyecto «${prog.n}» (${prog.sem >= 52 ? U.d1(prog.sem / 52) + ' años' : prog.sem + ' semanas'}).` }; }
      const seats = U.suma(g.coalicion.map(k => rc.parl.escanos[k] || 0)), ext = U.suma((g.apoyoExterno || []).map(k => rc.parl.escanos[k] || 0)), may = Math.floor(D().ccaa[c].esc / 2) + 1;
      if (T.nuevaLeyAut) { const b = T.nuevaLeyAut(E, c, { prog: id, pid: g.partido, quien: 'Gobierno autonómico', jugador: false, eff }), v = T.proyectarAut(E, c, b); return { ok: true, msg: `Remites al Parlamento el proyecto «${prog.n}»: pasará por comisión y pleno (apoyo previsto ${v.si} sí · ${v.no} no). Puedes cabildear desde Leyes.`, p: v.p }; }
      const p = seats >= may ? 0.88 : seats + ext >= may ? 0.7 : 0.35;
      rc.pend.push({ t: E.fecha.t + prog.sem, tipo: 'prog', prog: id, res: 'ley', ok: U.chance(p), eff, p });
      T.registrarLey(E, c, { id: 'G' + E.fecha.t + id, prog: id, pid: g.partido, quien: 'Gobierno autonómico', jugador: false, estado: 'tramite', t0: E.fecha.t, v: { p } });
      return { ok: true, msg: `Remites al Parlamento el proyecto «${prog.n}» (probabilidad de aprobación ≈ ${Math.round(p * 100)} %).`, p };
    },
    aplicarPrograma(E, c, prog, eff, ia) {
      const rc = E.esp.ccaa[c], g = rc.gob, IND = { sal: 'sal', edu: 'edu', uni: 'edu', soc: 'prot', int: 'seg', ter: 'viv', mov: 'rur', amb: 'amb', agr: 'rur', emp: 'igual', cul: 'lib', pre: 'inst', jus: 'inst', eco: 'comp', ind: 'comp' };
      rc.gestion[prog.area] = U.clamp(rc.gestion[prog.area] + prog.gest * eff, 5, 98);
      if (g) g.aprob = U.clamp(g.aprob + prog.aprob * eff, 5, 90);
      rc.deuda = U.clamp(rc.deuda + (prog.tipo === 'obra' ? prog.deuda * 0.22 : prog.deuda * 0.3), 3, 120);
      const S = C.Impacto && C.Impacto.asegurar(E); if (S && IND[prog.area]) S.off[IND[prog.area]] = (S.off[IND[prog.area]] || 0) + prog.gest * eff * 0.05;
    },
    resolverPrograma(E, c, p) {
      const rc = E.esp.ccaa[c], prog = T.programa(p.prog), J = E.jugador; if (!prog) return;
      const nom = D().ccaa[c].nombre, suyo = J && J.region === c && ['consejero', 'presauto'].includes(J.cargo);
      if (p.res === 'obra') { const o = rc.obras.find(x => x.id === p.prog && !x.fin); if (o) o.fin = true; T.aplicarPrograma(E, c, prog, p.eff); C.Noticias.poner(E, 'politica', `${nom}: se inaugura «${prog.n}».`, 'ES'); if (suyo) { C.Personaje.log(E, `Se inaugura «${prog.n}».`); C.Personaje.cambiar(E, { prestigio: 2.5, pop: 1.5 }, true); } return; }
      T.cerrarLeyProg(E, c, p.prog, p.ok);
      if (p.ok) { T.aplicarPrograma(E, c, prog, p.eff); C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} aprueba: ${prog.n}.`, 'ES'); if (suyo) { C.Personaje.log(E, `Aprobada: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: 2, pop: 1 }, true); } }
      else { if (rc.gob) rc.gob.estab = U.clamp(rc.gob.estab - 2, 0, 100); C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} rechaza el proyecto: ${prog.n}.`, 'ES'); if (suyo) { C.Personaje.log(E, `El Parlamento rechaza: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: -1.5 }, true); } }
    },

    /* ── Consejerías ── */
    repartirConsejerias(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, J = E.jugador; if (!g) return;
      g.n = U.clamp(g.n || D().nCons[c] || 10, D().nConsMin, D().nConsMax); g.estr = T.estructura(g.n); if (rc.pres) T.presAjustar(E, c);
      const keep = J && J.consejeria === c && J.area && g.consej && g.consej[J.area] === 'J' ? T.cabezaDe(E, c, J.area) : null;
      const coal = g.coalicion, P = rc.parl.escanos;
      const peso = {}, cuota = {}; let tp = 0; coal.forEach(k => { peso[k] = Math.pow(P[k] || 1, 0.75); tp += peso[k]; });
      const areas = g.estr.map(x => x.id).sort((a, b) => T.infoGrupo(E, c, b).peso - T.infoGrupo(E, c, a).peso), N = areas.length;
      coal.forEach(k => cuota[k] = peso[k] / tp * N);
      g.consej = {};
      areas.forEach(a => {
        const k = coal.slice().sort((x, y) => cuota[y] - cuota[x])[0]; cuota[k] -= 1;
        // El presidente se queda la Presidencia
        g.consej[a] = C.Gabinete.nueva(E, { region: c, partido: k, esp: C.Gabinete.cargos(E, 'aut:' + c).find(x => x.id === a).esp });
      });
      g.consej.pre = Object.assign(C.Gabinete.nueva(E, { region: c, partido: g.partido, esp: 'ins', perfil: 'politico' }), { n: (E.politicos[g.pres] || {}).n || '—', g: (E.politicos[g.pres] || {}).g || 'm', pres: true });
      if (E.jugador && g.pres === 'J' && !E.meta.presim) E.esp.pendienteGabinete = { key: 'aut:' + c, formacion: true };
      if (keep && coal.includes(J.partido)) { g.consej[keep] = 'J'; J.area = keep; }
      else if (J && J.consejeria === c) { J.consejeria = null; J.area = null; }
    },
    consejeroNombre(E, c, a) { const h = E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.consej && E.esp.ccaa[c].gob.consej[a]; return h === 'J' ? E.jugador.nombre : h ? h.n : '—'; },
    consejeroPartido(E, c, a) { const h = E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.consej && E.esp.ccaa[c].gob.consej[a]; return h === 'J' ? E.jugador.partido : h ? h.p : null; },
    /* Áreas que corresponden al partido del jugador en el gobierno de su comunidad. */
    areasDe(E, c, pid) { const g = E.esp.ccaa[c].gob; if (!g || !g.consej) return []; return Object.keys(g.consej).filter(a => { const h = g.consej[a]; return h !== 'J' && h && h.p === pid && !h.pres; }); },
    tomarConsejeria(E, c, area) {
      const J = E.jugador, g = E.esp.ccaa[c].gob; if (!g || !g.consej) return false;
      if (J.consejeria === c && J.area && g.consej[J.area] === 'J') { g.consej[J.area] = C.Gabinete.nueva(E, { region: c, partido: J.partido, esp: C.Gabinete.cargos(E, 'aut:' + c).find(x => x.id === J.area).esp }); }
      g.consej[area] = 'J'; J.consejeria = c; J.area = area; return true;
    },

    /* ── Financiación ── */
    pedirFin(E, c, tipo) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, pm = E.politicos[g.pm], d = D().ccaa[c], pr = rc.gob && rc.gob.partido;
      if (rc.fin.regimen === 'foral') return { ok: false, msg: 'Tu financiación se negocia en la Comisión Mixta del Concierto/Convenio: cada cinco años (cupo)' };
      let p = 0.38 + (rc.relM - 50) / 200 + ((pm && pm.ter) || 0) / 400 - rc.fin.pedidos * 0.05 + (g.coalicion.includes(pr) ? 0.2 : (g.apoyoExterno || []).includes(pr) ? 0.12 : 0);
      if (tipo === 'singular') {
        if (rc.fin.regimen === 'singular') return { ok: false, msg: 'Ya tienes financiación singular' };
        if (C.Congreso.abiertos(E).some(x => x.tpl === 'financiacion_singular' && x.region === c)) return { ok: false, msg: 'Ya hay una ley de financiación singular en las Cortes' };
        C.Congreso.proponer(E, 'financiacion_singular', { tipo: 'territorio', region: c }, { region: c, t: `Financiación singular de ${d.nombre}` });
        C.Noticias.poner(E, 'politica', `${d.nombre} registra en las Cortes su propuesta de financiación singular.`, 'ES');
        return { ok: true, msg: 'La propuesta de financiación singular llega a las Cortes: necesitará 176 votos.' };
      }
      rc.fin.pedidos++;
      p = U.clamp(p, 0.05, 0.9);
      if (U.chance(p)) {
        if (tipo === 'cesion') { rc.fin.cesion = Math.min(100, rc.fin.cesion + 10); rc.fin.nivel += 2.5; } else { rc.fin.nivel += 3.2; }
        rc.relM = Math.min(100, rc.relM + 3);
        for (const x of T.ids()) if (x !== c) E.esp.ccaa[x].agravio += 0.25;
        E.paises.ES.ec.pol.deficit += 0.02;
        C.Noticias.poner(E, 'politica', tipo === 'cesion' ? `El Gobierno acuerda con ${d.nombre} una mayor cesión de impuestos.` : `El Gobierno aprueba un refuerzo de la financiación de ${d.nombre}.`, 'ES');
        return { ok: true, msg: tipo === 'cesion' ? 'Hacienda acepta ampliar la cesión de impuestos.' : 'Hacienda acepta un refuerzo de tu financiación.' };
      }
      rc.relM = Math.max(0, rc.relM - 2);
      return { ok: true, exito: false, msg: 'Hacienda rechaza tu petición por ahora.', prob: p };
    },
    probFin(E, c, tipo) { const rc = E.esp.ccaa[c], g = E.paises.ES.gob, pm = E.politicos[g.pm], pr = rc.gob && rc.gob.partido; return U.clamp(0.38 + (rc.relM - 50) / 200 + ((pm && pm.ter) || 0) / 400 - rc.fin.pedidos * 0.05 + (g.coalicion.includes(pr) ? 0.2 : (g.apoyoExterno || []).includes(pr) ? 0.12 : 0), 0.05, 0.9); },

    aplicarFinSingular(E, c) {
      const rc = E.esp.ccaa[c]; rc.fin.regimen = 'singular'; rc.fin.nivel += 8; rc.fin.cesion = 100; rc.fiscal += 2;
      for (const x of T.ids()) if (x !== c) E.esp.ccaa[x].agravio += x === 'MAD' || x === 'AND' || x === 'VAL' ? 6 : 3;
    },

    /* Cupo vasco y navarro: se renegocia cada cinco años. */
    cupoItem(E, c) {
      const d = D().ccaa[c];
      C.Consejo.nuevo(E, { tipo: 'cupo', titulo: `Renovación del ${c === 'PVA' ? 'Concierto Económico (cupo)' : 'Convenio Económico'} de ${d.nombre}`, desc: 'Cada cinco años el Estado y la comunidad foral fijan la cuota que ésta paga por las competencias que el Estado mantiene (defensa, deuda, servicios comunes). Un cupo alto mejora las cuentas del Estado; uno bajo contenta al gobierno foral y agravia al resto.', region: c, sector: 'eco', limite: E.fecha.t + 4, quien: { tipo: 'ccaa', nombre: d.nombre, pid: E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.partido } });
    },
    aplicarCupo(E, c, k) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, d = D().ccaa[c];
      const msg = (() => {
      if (k === 'subir') { rc.relM = Math.max(0, rc.relM - 9); rc.fin.nivel -= 4; E.paises.ES.ec.pol.deficit -= 0.08; rc.concesiones.push({ t: E.fecha.t, v: 1.2, d: 'Cupo alto' }); return `Cupo al alza para ${d.nombre}: más ingresos para el Estado`; }
      if (k === 'bajar') { rc.relM = Math.min(100, rc.relM + 9); rc.fin.nivel += 4; E.paises.ES.ec.pol.deficit += 0.08; for (const x of T.ids()) if (x !== c) E.esp.ccaa[x].agravio += 1.2; g.aprob -= 0.4; return `Cupo a la baja para ${d.nombre}: el resto de comunidades protesta`; }
      rc.relM = Math.min(100, rc.relM + 3); return `Cupo pactado con ${d.nombre}`;
    })();
      C.Noticias.poner(E, 'economia', msg + '.', 'ES');
      return msg;
    },

    /* Consejo de Política Fiscal y Financiera. */
    cpffItem(E) {
      C.Consejo.nuevo(E, { tipo: 'cpff', titulo: 'Consejo de Política Fiscal y Financiera', desc: 'Hacienda convoca a las comunidades para fijar el techo de déficit y el reparto de recursos del año. Las comunidades de régimen común piden más financiación; el Estado, disciplina fiscal.', sector: 'eco', limite: E.fecha.t + 3, quien: { tipo: 'ministro', nombre: 'Hacienda' } });
    },
    aplicarCpff(E, k) {
      const ec = E.paises.ES.ec;
      for (const c of T.ids()) { const rc = E.esp.ccaa[c]; if (rc.fin.regimen === 'foral') continue;
        if (k === 'mas') { rc.fin.nivel += 1.8; rc.relM = Math.min(100, rc.relM + 2.5); } else if (k === 'recortar') { rc.fin.nivel -= 1.8; rc.relM = Math.max(0, rc.relM - 3.5); } }
      const m = k === 'mas' ? 'Más recursos para las comunidades de régimen común' : k === 'recortar' ? 'Ajuste de financiación autonómica' : 'Se mantiene el modelo de financiación';
      if (k === 'mas') ec.pol.deficit += 0.12; if (k === 'recortar') ec.pol.deficit -= 0.1;
      C.Noticias.poner(E, 'economia', 'Consejo de Política Fiscal y Financiera: ' + m + '.', 'ES');
      return m;
    },

    /* ── Dinámica semanal ── */
    turnoAut(E) {
      const t = E.fecha.t, cs = E.esp.consejo;
      for (const c of T.ids()) {
        const rc = E.esp.ccaa[c], d = D().ccaa[c], g = rc.gob; if (!g || !rc.comp) continue;
        T.asegurarAut(E, c); T.presTurno(E, c); T.consejoGenerar(E, c);
        // Los gobiernos de la IA impulsan de vez en cuando obras, leyes y planes
        if (U.chance(0.012) && !(E.jugador && E.jugador.region === c && ['consejero', 'presauto'].includes(E.jugador.cargo))) { const gr = U.pesado(T.grupos(E, c), x => x.peso), pr = U.pick(T.programasDe(E, c, gr.id)); if (pr) T.iniciarPrograma(E, c, pr.id, true); }
        // Gestión de cada consejería y su efecto en la aprobación
        let perf = 0, w = 0;
        for (const a in D().consejerias) {
          const mj = rc.gestion[a], niv = T.nivelArea(E, c, a);
          rc.gestion[a] = U.clamp(mj + (50 + ((rc.pres && rc.pres.off && rc.pres.off[T.cabezaDe(E, c, a)]) || 0) - mj) * 0.015 + U.gauss(0, 0.8) + (rc.fin.nivel - 100) * 0.004, 10, 95);
          perf += (rc.gestion[a] - 50) * niv * D().consejerias[a].peso; w += 2 * D().consejerias[a].peso;
        }
        g.aprob = U.clamp(g.aprob + perf / w * 0.05, 8, 88);
        g.aprob = U.clamp(g.aprob + (rc.fin.nivel - 100) * 0.0012, 8, 88);
        rc.deuda = U.clamp(rc.deuda + (100 - rc.fin.nivel) * 0.0015, 3, 120);
        rc.fin.nivel += (D().finNivel[c] - rc.fin.nivel) * 0.001;
        // Lo que no gestiona se achaca al Estado: incidentes en competencias no transferidas
        if (U.chance(0.0015)) {
          const k = U.pick(Object.keys(D().competencias).filter(x => rc.comp[x] === 0 && ['cer', 'pue', 'agu', 'pol', 'tra', 'pri'].includes(x)).concat('x'));
          if (k !== 'x') { const cp = D().competencias[k]; rc.relM = Math.max(0, rc.relM - 3); if (d.indep0 > 3) rc.concesiones.push({ t, v: 0.5, d: 'Incidente en competencia estatal' }); C.Noticias.poner(E, 'politica', `${d.nombre}: nuevo fallo en ${cp.nombre.toLowerCase()}. El Gobierno autonómico culpa al Estado y reclama la competencia.`, 'ES'); if (!rc.reclama.includes(k)) rc.reclama.unshift(k); rc.presion[k] = Math.min(0.25, (rc.presion[k] || 0) + 0.06); }
        }
        // Reclamaciones de la propia comunidad (si el presidente no es el jugador)
        if (cs && U.chance(0.004) && !(E.jugador && E.jugador.cargo === 'presauto' && E.jugador.region === c)) { const k = rc.reclama.find(x => rc.comp[x] < 2); if (k && C.Consejo.pmEsJ(E)) T.pedirComp(E, c, k); }
        // Elecciones anticipadas por conveniencia
        const esJ = E.jugador && E.jugador.cargo === 'presauto' && E.jugador.region === c;
        if (!esJ && !rc.inv && !rc.suspendida && t - rc.parl.ult > 78 && rc.parl.proxT - t > 26 && g.aprob >= 57 && g.estab > 55 && U.chance(0.0035)) T.adelantar(E, c, 'por conveniencia electoral');
        // Moción de censura autonómica
        if (!esJ && !rc.inv && g.estab < 42 && !rc.suspendida && t - (rc.ultMocion || -99) > 52 && U.chance(0.012)) T.mocionIA(E, c);
      }
      // Cupo y Consejo de Política Fiscal
      const cu = E.esp.cupo;
      if (t >= cu.proxT && E.esp.cortes.estado === 'activa') {
        for (const c of ['PVA', 'NAV']) if (!cs.agenda.some(i => i.tipo === 'cupo' && i.region === c)) T.cupoItem(E, c);
        cu.proxT = t + 260; cu.ultimo = t;
      }
      if (t >= E.esp.cpff.proxT && E.esp.cortes.estado === 'activa') { T.cpffItem(E); E.esp.cpff.proxT = t + 52; }
    },

    /* Registro de leyes autonómicas en tramitación o resueltas (las del Gobierno y las del jugador). */
    registrarLey(E, c, l) { const rc = E.esp.ccaa[c]; rc.leyes = rc.leyes || []; rc.leyes.unshift(l); if (rc.leyes.length > 30) rc.leyes.length = 30; },
    cerrarLey(E, c, id, ok) { const l = (E.esp.ccaa[c].leyes || []).find(x => x.id === id); if (l) { l.estado = ok ? 'aprobada' : 'rechazada'; l.t1 = E.fecha.t; } },
    cerrarLeyProg(E, c, progId, ok) { const l = (E.esp.ccaa[c].leyes || []).find(x => x.prog === progId && x.estado === 'tramite' && !x.jugador); if (l) { l.estado = ok ? 'aprobada' : 'rechazada'; l.t1 = E.fecha.t; } },

    mocionIA(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob; rc.ultMocion = E.fecha.t;
      const esc = rc.parl.escanos, opo = Object.keys(esc).filter(k => k !== g.partido && !g.coalicion.includes(k)).sort((a, b) => esc[b] - esc[a]).slice(0, 3);
      for (const cand of opo) {
        const b = T.bloque(E, c, cand);
        if (b.s >= b.may && !b.bloque.every(k => g.coalicion.includes(k))) { T.cambiarGobierno(E, c, b, 'triunfa la moción de censura y es investido/a'); return true; }
      }
      return false;
    },

    cambiarGobierno(E, c, b, motivo) {
      const rc = E.esp.ccaa[c], J = E.jugador;
      const esJ = J && J.cargo === 'presauto' && J.region === c;
      T.instalar(E, c, b, false, motivo);
      rc.relM = T.relObjetivo(E, c);
      if (esJ && rc.gob.pres !== 'J') { C.Eventos.info(E, '⚠️ Pierdes la presidencia', `Una moción de censura en el Parlamento de ${D().ccaa[c].nombre} desaloja a tu Gobierno.`); C.Personaje.sincronizar(E); }
      else if (J && J.pais === 'ES') C.Personaje.sincronizar(E);
      if (J && J.pais === 'ES' && J.region === c && C.Personaje.ofertaConsejeria) C.Personaje.ofertaConsejeria(E, c, null);
    },

    /* El jugador, líder de la oposición regional, presenta una moción de censura. */
    mocionJugador(E, c) {
      const J = E.jugador, rc = E.esp.ccaa[c], b = T.bloque(E, c, J.partido); rc.ultMocion = E.fecha.t;
      if (b.s >= b.may) { rc.cab[J.partido] = 'J'; J.lidReg = J.lidReg || c; T.cambiarGobierno(E, c, b, 'triunfa la moción de censura y es investido/a'); rc.gob.pres = 'J'; C.Personaje.sincronizar(E); return true; }
      return false;
    }
  });
})(window.ESP);

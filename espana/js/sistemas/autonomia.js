/* Autonomía: competencias negociables, consejerías con titulares, financiación (común, foral, canaria, singular),
   cupo vasco y navarro, adelantos electorales y mociones de censura autonómicas. Amplía C.Territorio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio;
  const NIV = ['Estado', 'Compartida', 'Transferida'];

  Object.assign(T, {
    NIV,

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

    /* ── Consejerías ── */
    repartirConsejerias(E, c) {
      const rc = E.esp.ccaa[c], g = rc.gob, J = E.jugador; if (!g) return;
      const keep = J && J.consejeria === c && J.area ? J.area : null;
      const coal = g.coalicion, P = rc.parl.escanos;
      const peso = {}, cuota = {}; let tp = 0; coal.forEach(k => { peso[k] = Math.pow(P[k] || 1, 0.75); tp += peso[k]; });
      const areas = Object.keys(D().consejerias).sort((a, b) => D().consejerias[b].peso - D().consejerias[a].peso), N = areas.length;
      coal.forEach(k => cuota[k] = peso[k] / tp * N);
      g.consej = {};
      areas.forEach(a => {
        const k = coal.slice().sort((x, y) => cuota[y] - cuota[x])[0]; cuota[k] -= 1;
        // El presidente se queda la Presidencia
        g.consej[a] = C.Gabinete.nueva(E, { region: c, partido: k, esp: C.Gabinete.cargos(E, 'aut:' + c).find(x => x.id === a).esp });
      });
      g.consej.pre = Object.assign(C.Gabinete.nueva(E, { region: c, partido: g.partido, esp: 'ins', perfil: 'politico' }), { n: (E.politicos[g.pres] || {}).n || '—', g: (E.politicos[g.pres] || {}).g || 'm', pres: true });
      if (E.jugador && g.pres === 'J' && !E.meta.presim) E.esp.pendienteGabinete = { key: 'aut:' + c, formacion: true };
      if (keep && coal.includes(J.partido)) g.consej[keep] = 'J';
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
        // Gestión de cada consejería y su efecto en la aprobación
        let perf = 0, w = 0;
        for (const a in D().consejerias) {
          const mj = rc.gestion[a], niv = T.nivelArea(E, c, a);
          rc.gestion[a] = U.clamp(mj + (50 - mj) * 0.015 + U.gauss(0, 0.8) + (rc.fin.nivel - 100) * 0.004, 10, 95);
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
        if (!esJ && !rc.suspendida && t - rc.parl.ult > 78 && rc.parl.proxT - t > 26 && g.aprob >= 57 && g.estab > 55 && U.chance(0.0035)) T.adelantar(E, c, 'por conveniencia electoral');
        // Moción de censura autonómica
        if (!esJ && g.estab < 42 && !rc.suspendida && t - (rc.ultMocion || -99) > 52 && U.chance(0.012)) T.mocionIA(E, c);
      }
      // Cupo y Consejo de Política Fiscal
      const cu = E.esp.cupo;
      if (t >= cu.proxT && E.esp.cortes.estado === 'activa') {
        for (const c of ['PVA', 'NAV']) if (!cs.agenda.some(i => i.tipo === 'cupo' && i.region === c)) T.cupoItem(E, c);
        cu.proxT = t + 260; cu.ultimo = t;
      }
      if (t >= E.esp.cpff.proxT && E.esp.cortes.estado === 'activa') { T.cpffItem(E); E.esp.cpff.proxT = t + 52; }
    },

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
    },

    /* El jugador, líder de la oposición regional, presenta una moción de censura. */
    mocionJugador(E, c) {
      const J = E.jugador, rc = E.esp.ccaa[c], b = T.bloque(E, c, J.partido); rc.ultMocion = E.fecha.t;
      if (b.s >= b.may) { rc.cab[J.partido] = 'J'; J.lidReg = J.lidReg || c; T.cambiarGobierno(E, c, b, 'triunfa la moción de censura y es investido/a'); rc.gob.pres = 'J'; C.Personaje.sincronizar(E); return true; }
      return false;
    }
  });
})(window.ESP);

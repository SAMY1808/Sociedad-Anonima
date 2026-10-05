/* Comunidades autónomas: parlamentos y gobiernos regionales, elecciones autonómicas, relación con Moncloa, independentismo,
   financiación, estatutos de autonomía, procés (artículo 155), Tribunal Constitucional y Conferencia de Presidentes. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const SEM_LEG = 208;                       // 4 años

  const dia = (y, m) => new Date(Date.UTC(y, m - 1, m === 5 ? 23 : 18));

  const T = {
    ids: () => Object.keys(D().ccaa),

    /* ── Inicio ── */
    init(E) {
      const tc = E.esp;
      tc.um = null; tc.proces = { fase: 'distension', t: 0, historia: [] };
      tc.tc = { sesgo: 0.25, recursos: [] };
      tc.jornada = {}; tc.confPres = { ultima: U.turnoDe(new Date(Date.UTC(2026, 5, 1))) };
      tc.flags = tc.flags || {};
      for (const c of T.ids()) {
        const d = D().ccaa[c];
        const rc = tc.ccaa[c] = {
          id: c, relM: 55, indep: d.indep, indep0: d.indep, aut: d.aut, aut0: d.aut,
          deuda: Math.round(U.clamp(U.gauss(22 + (d.pibpc < 25 ? 8 : 0), 5), 8, 45)), fiscal: 0, agravio: 0, concesiones: [],
          estatuto: { ano: d.foral ? 1979 : (c === 'CAT' ? 2006 : c === 'AND' || c === 'VAL' || c === 'ARA' ? 2007 : 1983), proceso: null, rechazos: 0 },
          parl: { escanos: {}, votos: {}, ult: 0, proxT: 0, part: 0 }, gob: null, cab: {}, suspendida: null, pend: []
        };
        rc.fiscal = Math.round((d.pibpc - 25) * 0.55 * 10) / 10;           // saldo fiscal aproximado (% PIB regional)
      }
      for (const c of T.ids()) {
        const rc = tc.ccaa[c], d = D().ccaa[c];
        const res = T.simular(E, c, { ruido: 0.03 });
        rc.parl.escanos = res.escanos; rc.parl.votos = res.votos; rc.parl.part = res.part;
        const prox = dia(d.prox[0], d.prox[1]);
        rc.parl.proxT = U.turnoDe(prox); rc.parl.ult = rc.parl.proxT - SEM_LEG;
        T.formarGobierno(E, c, true);
        rc.relM = T.relObjetivo(E, c);
        rc.gob.aprob = U.clamp(46 + U.gauss(0, 7), 25, 70);
      }
      C.Generales.senado(E);
    },

    /* ── Parlamentos autonómicos ── */
    votosReg(E, c, ruido) {
      const agg = E.esp.aggReg[c] || {}, rc = E.esp.ccaa[c], P = E.paises.ES, v = {};
      for (const pid of P.partidos) {
        let x = agg[pid] || 0; if (!x) continue;
        const p = E.partidos[pid];
        if (p.amb === 'reg') x *= 1.1; else if (p.amb === 'nac' && E.esp.regionales.some(k => E.partidos[k].rp && E.partidos[k].rp[c])) x *= 0.97;
        if (rc && rc.gob && rc.gob.coalicion.includes(pid)) x *= 1 + (rc.gob.aprob - 48) / 220;
        if (rc && rc.bonus && rc.bonus[pid]) x *= 1 + rc.bonus[pid];
        v[pid] = x * (ruido ? Math.exp(U.gauss(0, ruido)) : 1);
      }
      const s = U.suma(Object.values(v)) || 1; for (const k in v) v[k] = v[k] * 100 / s;
      return v;
    },

    simular(E, c, o = {}) {
      const d = D().ccaa[c], v = T.votosReg(E, c, o.ruido != null ? o.ruido : 0.05);
      const um = d.um;
      const w = {}; for (const k in v) if (v[k] >= um) w[k] = v[k];
      const e = C.Elecciones.divisores(Object.keys(w).length ? w : v, d.esc, false);
      const escanos = {}; for (const k in e) if (e[k]) escanos[k] = e[k];
      return { votos: v, escanos, part: Math.round(U.clamp(64 + U.gauss(0, 4), 50, 78)) };
    },

    cabeza(E, c, pid) {
      const rc = E.esp.ccaa[c], p = E.partidos[pid];
      if (p.amb === 'reg') return E.politicos[p.lider];
      let id = rc.cab[pid];
      if (!id || !E.politicos[id]) {
        const pol = C.Mundo.politico(E, { pais: 'ES', partido: pid, eco: p.eco + U.gauss(0, 8), soc: p.soc + U.gauss(0, 8), eu: p.eu + U.gauss(0, 8), ter: p.ter + U.gauss(0, 8), a: 80, c: U.gauss(58, 14),
          n: null, region: c });
        const pers = C.Mundo.persona(c); pol.n = pers.n; pol.g = pers.g; pol.reg = c; pol.ter = Math.round(p.ter + U.gauss(0, 8));
        rc.cab[pid] = id = pol.id;
      }
      return E.politicos[id];
    },

    /* Formación del gobierno autonómico tras unas elecciones o una crisis. */
    formarGobierno(E, c, inicial) {
      const rc = E.esp.ccaa[c], esc = rc.parl.escanos, Ej = C.Ejecutivo;
      const tot = U.suma(Object.values(esc)), may = Math.floor(tot / 2) + 1;
      const partidos = Object.keys(esc).sort((a, b) => esc[b] - esc[a]);
      let mejor = null;
      for (const cand of partidos.slice(0, 3)) {
        const bloque = [cand]; let s = esc[cand];
        const otros = partidos.filter(p => p !== cand).map(p => ({ p, aff: Ej.afinidad(E, cand, p) })).sort((a, b) => b.aff - a.aff);
        for (const x of otros) {
          if (s >= may) break;
          if (bloque.some(q => Ej.vetaA(E, x.p, q) || Ej.vetaA(E, q, x.p))) continue;
          if (x.aff < 0.3) continue;
          bloque.push(x.p); s += esc[x.p];
        }
        // Apoyos y abstenciones
        let si = s, no = 0;
        for (const p of partidos) { if (bloque.includes(p)) continue; const aff = Ej.afinidad(E, cand, p), veta = bloque.some(q => Ej.vetaA(E, p, q)); if (!veta && aff >= 0.6) si += esc[p]; else if (!veta && aff >= 0.3) { /* abstención */ } else no += esc[p]; }
        const exito = s >= may || si > no;
        const score = (exito ? 1000 : 0) + (s >= may ? 200 : 0) - bloque.length * 10 + esc[cand] * 0.3;
        if (!mejor || score > mejor.score) mejor = { cand, bloque, s, si, no, exito, score };
      }
      if (!mejor) return null;
      const cab = T.cabeza(E, c, mejor.cand);
      const ext = partidos.filter(p => !mejor.bloque.includes(p) && Ej.afinidad(E, mejor.cand, p) >= 0.6 && !mejor.bloque.some(q => Ej.vetaA(E, p, q)));
      rc.gob = { pres: cab.id, partido: mejor.cand, coalicion: mejor.bloque, apoyoExterno: s2(mejor.s >= may ? [] : ext), formado: E.fecha.t, aprob: U.clamp(48 + U.gauss(0, 5), 30, 65), estab: U.clamp(78 - (mejor.bloque.length - 1) * 4 - (mejor.s < may ? 14 : 0) + U.gauss(0, 5), 25, 92), tipo: mejor.s >= may ? 'mayoria' : 'minoria' };
      cab.cargo = 'presauto'; cab.reg = c;
      if (!inicial) C.Noticias.poner(E, 'politica', `${cab.n} (${E.partidos[mejor.cand].sigla}) es investido/a presidente/a de ${D().ccaa[c].nombre}${mejor.bloque.length > 1 ? ' con ' + mejor.bloque.filter(k => k !== mejor.cand).map(k => E.partidos[k].sigla).join(', ') : ''}.`, 'ES');
      return rc.gob;
      function s2(a) { return a; }
    },

    /* ── Relación con Moncloa y estado de ánimo territorial ── */
    relObjetivo(E, c) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob; if (!rc.gob || !g) return 55;
      const pr = rc.gob.partido, en = g.coalicion.includes(pr) ? 26 : (g.apoyoExterno || []).includes(pr) ? 16 : 0;
      const mis = rc.gob.coalicion.some(k => g.coalicion.includes(k)) ? 8 : 0;
      const d = U.distIdeo(E.partidos[pr], E.partidos[g.partido]);
      return U.clamp(72 + en + mis - d * 75 - rc.agravio, 4, 96);
    },

    turno(E) {
      for (const c of T.ids()) T.turnoRegion(E, c);
      T.procesTurno(E);
      if (E.fecha.t % 2 === 0) U.serie('indepCat', E.esp.ccaa.CAT.indep, 300);
      T.tcTurno(E);
      if (E.fecha.t - E.esp.confPres.ultima >= 52 && U.chance(0.1)) T.conferenciaPresidentes(E);
      T.cerrarJornada(E);
    },

    turnoRegion(E, c) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c], g = E.paises.ES.gob, t = E.fecha.t;
      if (rc.suspendida) {
        if (t >= rc.suspendida.hasta) { rc.suspendida = null; rc.relM = Math.max(rc.relM, 18); C.Noticias.poner(E, 'politica', `Termina la intervención del Estado en ${d.nombre}.`, 'ES'); }
        rc.indep += (rc.indep0 + 6 - rc.indep) * 0.01;
      }
      // Relación con Moncloa
      rc.relM += (T.relObjetivo(E, c) - rc.relM) * 0.03 + U.gauss(0, 0.5);
      rc.relM = U.clamp(rc.relM, 0, 100);
      rc.agravio *= 0.998;
      // Independentismo: sube con el mal trato, baja con concesiones
      const hist = rc.concesiones.reduce((s, x) => s + x.v * Math.pow(0.9985, t - x.t), 0);
      const gobIndep = rc.gob && rc.gob.coalicion.some(k => E.partidos[k].indep >= 0.5) ? 1.5 : 0;
      const obj = rc.indep0 + (50 - rc.relM) * 0.16 * Math.min(2, rc.indep0 / 14) + gobIndep + hist;
      rc.indep += (obj - rc.indep) * 0.012 + U.gauss(0, 0.12);
      rc.indep = U.clamp(rc.indep, 0.5, 70);
      rc.aut += (rc.aut0 - rc.aut) * 0.0 + 0;
      if (rc.gob) {
        const clima = C.Economia.clima(E, 'ES');
        rc.gob.aprob += (46 + 4 * clima + (rc.relM - 50) * 0.04 - rc.gob.aprob) * 0.03 + U.gauss(0, 0.5);
        rc.gob.aprob = U.clamp(rc.gob.aprob, 10, 85);
        rc.gob.estab += (U.gauss(0, 0.6) + (rc.gob.aprob - 40) * 0.01 - (rc.gob.tipo === 'minoria' ? 0.08 : 0));
        rc.gob.estab = U.clamp(rc.gob.estab, 0, 100);
      }
      // Pendientes (referéndums de estatuto…)
      rc.pend = rc.pend.filter(p => {
        if (t < p.t) return true;
        if (p.tipo === 'refer_estatuto') T.referendumEstatuto(E, c, p);
        return false;
      });
      // Elecciones
      if (t >= rc.parl.proxT && !rc.suspendida) T.celebrar(E, c);
      else if (rc.suspendida && t >= rc.parl.proxT) T.celebrar(E, c, true);
      else if (rc.gob && rc.gob.estab < 12 && t - rc.parl.ult > 52 && rc.parl.proxT - t > 12 && U.chance(0.01) && !(E.jugador && E.jugador.region === c && E.jugador.cargo === 'presauto')) T.adelantar(E, c, 'por falta de apoyos');
    },

    adelantar(E, c, motivo) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c];
      rc.parl.proxT = E.fecha.t + 7;
      C.Noticias.poner(E, 'politica', `${d.nombre}: se disuelve el Parlamento ${motivo || ''} y se convocan elecciones autonómicas anticipadas.`, 'ES');
    },

    celebrar(E, c, extra) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c], t = E.fecha.t;
      const previo = { votos: rc.parl.votos, escanos: rc.parl.escanos, gob: rc.gob };
      const res = T.simular(E, c, {});
      rc.parl.votos = res.votos; rc.parl.escanos = res.escanos; rc.parl.part = res.part; rc.parl.ult = t; rc.parl.proxT = t + SEM_LEG;
      if (extra) { rc.suspendida = null; rc.relM = Math.max(rc.relM, 20); }
      // La opinión regional se acerca al resultado
      for (const k of E.esp.regionales) { const p = E.partidos[k]; if (p.rp && p.rp[c] && res.votos[k] != null) p.rp[c] = U.clamp(p.rp[c] * 0.5 + res.votos[k] * 0.5, 0.3, 60); }
      C.Es.agregar(E);
      T.formarGobierno(E, c);
      C.Generales.senado(E);
      const g = rc.gob;
      const gan = Object.keys(res.votos).sort((a, b) => res.votos[b] - res.votos[a])[0];
      C.Noticias.poner(E, 'elecciones', `Elecciones en ${d.nombre}: ${E.partidos[gan].sigla} gana con el ${U.d1(res.votos[gan])} %; gobierna ${E.partidos[g.partido].sigla}${g.coalicion.length > 1 ? ' en coalición' : ''}.`, 'ES');
      const J = E.jugador;
      const personal = J && J.pais === 'ES' && C.Personaje.tras_autonomicas ? C.Personaje.tras_autonomicas(E, c, previo, res) : null;
      const jo = E.esp.jornada[t] = E.esp.jornada[t] || { t, aut: [], mun: null };
      jo.aut.push({ c, votos: res.votos, escanos: res.escanos, previo: previo.votos, escPrevio: previo.escanos, part: res.part, gob: { partido: g.partido, coalicion: g.coalicion }, personal });
      E.elecciones.historico.unshift({ t, tipo: 'autonomicas', region: c, votos: res.votos, escanos: res.escanos });
      C.Bus.emit('elecciones', { tipo: 'autonomicas', region: c });
    },

    /* Al terminar el turno se empaqueta la jornada electoral (autonómicas + municipales) en una noche electoral. */
    cerrarJornada(E) {
      const jo = E.esp.jornada[E.fecha.t]; if (!jo || jo.cerrada) return;
      jo.cerrada = true;
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      if (E.elecciones.nochePendiente) return;
      E.elecciones.nochePendiente = { tipo: 'locales', pais: 'ES', t: E.fecha.t, aut: jo.aut, mun: jo.mun };
    },

    /* ── Gobierno central → comunidades ── */
    efectoLey(E, efecto, p) {
      const cc = E.esp.ccaa, t = E.fecha.t, g = E.paises.ES.gob;
      const add = (c, v, d) => cc[c].concesiones.push({ t, v, d });
      const regP = p.region ? [p.region] : T.ids().filter(c => cc[c].gob && cc[c].gob.coalicion.some(k => E.partidos[k].amb === 'reg'));
      switch (efecto) {
        case 'amnistia': {
          E.esp.flags.amnistia = t;
          cc.CAT.relM = Math.min(100, cc.CAT.relM + 12); add('CAT', -3.5, 'Amnistía'); cc.PVA.relM = Math.min(100, cc.PVA.relM + 3);
          T.marea(E, 'amnistia');
          T.recurso(E, p, 'amnistia');
          if (E.esp.proces.fase !== 'distension') T.procesFase(E, 'distension', 'La amnistía abre una etapa de distensión');
          break;
        }
        case 'indultos': E.esp.flags.indultos = t; cc.CAT.relM = Math.min(100, cc.CAT.relM + 6); add('CAT', -1.5, 'Indultos'); T.marea(E, 'indultos'); break;
        case 'financiacion_singular': {
          cc.CAT.fiscal += 2.2; cc.CAT.relM = Math.min(100, cc.CAT.relM + 12); add('CAT', -3, 'Financiación singular');
          for (const c of T.ids()) if (c !== 'CAT') { cc[c].agravio += c === 'MAD' || c === 'AND' || c === 'VAL' ? 7 : 3; cc[c].fiscal -= 0.15; }
          T.marea(E, 'financiacion');
          T.recurso(E, p, 'financiacion_singular');
          break;
        }
        case 'financiacion': for (const c of T.ids()) { cc[c].relM = Math.min(100, cc[c].relM + 3); cc[c].fiscal += (25 - D().ccaa[c].pibpc) * 0.03; } break;
        case 'transferencias': regP.forEach(c => { cc[c].aut = Math.min(100, cc[c].aut + 4); cc[c].relM = Math.min(100, cc[c].relM + 5); add(c, -1.2, 'Traspasos'); }); break;
        case 'quita_deuda': for (const c of T.ids()) { cc[c].deuda = Math.max(4, cc[c].deuda * 0.78); cc[c].relM = Math.min(100, cc[c].relM + 3); } E.paises.ES.ec.pol.deuda += 1.8; add('CAT', -1, 'Quita de deuda'); T.marea(E, 'deuda'); break;
        case 'escudo_social': break;
        case 'estatuto': {
          const c = p.region; if (!c || !cc[c]) break;
          cc[c].estatuto.proceso = { fase: 'referendum', t: t + 8 };
          cc[c].pend.push({ tipo: 'refer_estatuto', t: t + 8, aut: Math.max(4, Math.round(p.ter / 10)), tpl: p.tpl, t0: t });
          C.Noticias.poner(E, 'politica', `Las Cortes aprueban la reforma del Estatuto de ${D().ccaa[c].nombre}: referéndum autonómico en ocho semanas.`, 'ES');
          break;
        }
        case 'recentralizar': for (const c of T.ids()) { cc[c].aut = Math.max(20, cc[c].aut - 5); if (cc[c].indep0 > 5) add(c, 2.2, 'Recentralización'); cc[c].relM = Math.max(0, cc[c].relM - (cc[c].gob && cc[c].gob.coalicion.some(k => E.partidos[k].amb === 'reg') ? 10 : 2)); } T.marea(E, 'recentralizacion'); T.recurso(E, p, 'recentralizar'); break;
        case 'reforma_electoral': {
          const a = E.partidos[p.autor.pid || (E.jugador && E.jugador.partido)];
          E.esp.um = a && a.ter < -10 ? 5 : 1;
          C.Noticias.poner(E, 'politica', `Reforma electoral: el umbral en cada circunscripción pasa a ser del ${E.esp.um} %.`, 'ES'); break;
        }
        case 'referendum': E.esp.flags.refPactado = t; C.Noticias.poner(E, 'politica', 'La Constitución reconoce ya los referéndums de autodeterminación pactados.', 'ES'); break;
      }
    },

    /* Reacción de la opinión nacional ante concesiones o dureza territorial. */
    marea(E, tipo) {
      const ef = { amnistia: { UPC: 0.9, VAP: 1.1, ASD: -0.35, PPI: 0 }, indultos: { UPC: 0.4, VAP: 0.5, ASD: -0.15 }, financiacion: { UPC: 0.6, VAP: 0.7, ASD: -0.25 }, deuda: { UPC: 0.3, VAP: 0.4, ASD: -0.1 }, recentralizacion: { UPC: 0.2, VAP: 0.3, ASD: -0.2, PPI: -0.4 } }[tipo]; if (!ef) return;
      for (const sg in ef) { const pid = 'ES_' + sg; if (E.partidos[pid]) { E.partidos[pid].pop = Math.max(0.2, E.partidos[pid].pop + ef[sg]); } }
      C.Opinion.normalizarES(E);
    },

    /* Referéndum autonómico sobre una reforma estatutaria. */
    referendumEstatuto(E, c, pend) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c];
      const apoyo = U.clamp(52 + (rc.relM - 50) * 0.2 + (rc.gob && rc.gob.aprob - 45) * 0.15 + U.gauss(0, 9), 20, 90), part = U.clamp(55 + U.gauss(0, 6), 35, 75);
      rc.estatuto.proceso = null;
      if (apoyo >= 50) {
        rc.aut = Math.min(100, rc.aut + pend.aut); rc.aut0 = Math.max(rc.aut0, rc.aut); rc.estatuto.ano = U.anio();
        rc.relM = Math.min(100, rc.relM + 4);
        rc.concesiones.push({ t: E.fecha.t, v: -1.5, d: 'Nuevo estatuto' });
        C.Noticias.poner(E, 'politica', `El nuevo Estatuto de ${d.nombre} es ratificado en referéndum con un ${U.d1(apoyo)} % de síes (participación ${U.d1(part)} %).`, 'ES');
        if (E.jugador && E.jugador.pais === 'ES' && E.jugador.region === c) C.Personaje.log(E, `El nuevo Estatuto de ${d.nombre} se ratifica en referéndum (${U.d1(apoyo)} % de síes).`);
      } else {
        rc.estatuto.rechazos++; rc.relM = Math.max(0, rc.relM - 5);
        C.Noticias.poner(E, 'politica', `El referéndum rechaza la reforma del Estatuto de ${d.nombre} (${U.d1(apoyo)} % de síes).`, 'ES');
      }
    },

    /* Un partido o gobierno autonómico propone reformar su estatuto. Devuelve texto de resultado o true. */
    proponerEstatuto(E, c, autor) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c];
      if (rc.estatuto.proceso) return 'Ya hay una reforma estatutaria en marcha';
      if (C.Congreso.abiertos(E).some(p => p.region === c && (p.efecto || (C.Congreso.plantilla(p.tpl) || {}).efecto === 'estatuto'))) return 'Ya hay una reforma en las Cortes';
      // Aprobación en el parlamento autonómico: 3/5
      let si = 0; const tot = U.suma(Object.values(rc.parl.escanos));
      for (const k in rc.parl.escanos) { const p = E.partidos[k]; if (p.ter > 10 || p.amb === 'reg' || (rc.gob && rc.gob.coalicion.includes(k))) si += rc.parl.escanos[k]; }
      if (si < Math.ceil(tot * 0.6)) return `El Parlamento de ${d.nombre} no reúne los tres quintos (${si}/${tot})`;
      const tplId = C.Congreso.plantilla('estatuto_' + c.toLowerCase()) ? 'estatuto_' + c.toLowerCase() : 'estatuto_gen';
      const prop = C.Congreso.proponer(E, tplId, autor || { tipo: 'territorio', region: c }, { region: c, t: `Reforma del Estatuto de Autonomía de ${d.nombre}` });
      rc.estatuto.proceso = { fase: 'cortes', id: prop.id, t: E.fecha.t };
      C.Noticias.poner(E, 'politica', `El Parlamento de ${d.nombre} aprueba la propuesta de reforma de su Estatuto y la remite a las Cortes.`, 'ES');
      return true;
    },

    /* ── Procés y artículo 155 ── */
    procesFase(E, fase, txt) {
      const pr = E.esp.proces; pr.fase = fase; pr.t = E.fecha.t; pr.historia.unshift({ t: E.fecha.t, fase, txt });
      if (txt) C.Noticias.poner(E, 'politica', txt, 'ES');
    },

    procesTurno(E) {
      const pr = E.esp.proces, rc = E.esp.ccaa.CAT, g = E.paises.ES.gob, J = E.jugador, t = E.fecha.t; if (!rc || !g) return;
      const indepGob = rc.gob && rc.gob.coalicion.some(k => E.partidos[k].indep >= 0.8);
      if (pr.fase === 'distension' && indepGob && rc.indep >= 40 && rc.relM < 28 && !rc.suspendida && t - pr.t > 26 && U.chance(0.012)) T.procesFase(E, 'tension', 'La Generalitat anuncia una hoja de ruta hacia la autodeterminación: crece la tensión con Moncloa.');
      else if (pr.fase === 'tension') {
        if (rc.relM > 45) T.procesFase(E, 'distension', 'La Generalitat y el Gobierno retoman el diálogo: baja la tensión.');
        else if (indepGob && U.chance(0.04) && t - pr.t > 8) {
          if (E.esp.flags.refPactado) T.procesFase(E, 'distension', 'Se pacta una vía legal para la consulta.');
          else { T.procesFase(E, 'unilateral', 'El Parlament aprueba convocar un referéndum unilateral de independencia.'); pr.limite = t + 6; pr.decidir = true; }
        }
      } else if (pr.fase === 'unilateral') {
        if (pr.decidir && g.pm === (J && J.cargo === 'pm' ? 'J' : null)) { E.esp.consejo = E.esp.consejo || {}; }   // el jugador decide en el Consejo
        if (pr.decidir && t >= pr.limite) T.procesResolver(E, null);
      } else if (pr.fase === '155' && !rc.suspendida) T.procesFase(E, 'distension', 'Tras la intervención se abre una etapa de reconstrucción institucional.');
    },

    /* Respuesta del Gobierno a un desafío unilateral: '155' | 'dialogo' | 'nada'. */
    procesResolver(E, resp) {
      const pr = E.esp.proces, rc = E.esp.ccaa.CAT, g = E.paises.ES.gob;
      pr.decidir = false;
      if (!resp) { const pm = E.politicos[g.pm]; resp = pm && pm.ter < -20 ? '155' : pm && pm.ter > 5 ? 'dialogo' : (U.chance(0.55) ? '155' : 'nada'); }
      if (resp === 'dialogo') { rc.relM = Math.min(100, rc.relM + 15); rc.concesiones.push({ t: E.fecha.t, v: -2, d: 'Mesa de diálogo' }); T.procesFase(E, 'distension', 'El Gobierno abre una mesa de diálogo y el Parlament suspende el referéndum.'); g.aprob -= 1; return 'dialogo'; }
      if (resp === 'nada') {
        rc.indep += 4; T.procesFase(E, 'dui', 'La Generalitat celebra el referéndum y proclama la independencia: crisis constitucional.');
        const r = T.aplicar155(E, true); return r.ok ? '155' : 'nada';
      }
      return T.aplicar155(E).ok ? '155' : 'nada';
    },

    senado155(E) {
      const S = E.esp.senado; let si = 0;
      for (const pid in S.escanos) {
        const p = E.partidos[pid]; if (!p) continue;
        const g = E.paises.ES.gob;
        const yes = g.coalicion.includes(pid) ? p.ter < 15 : (p.ter < -15 && p.indep < 0.2);
        if (yes) si += S.escanos[pid];
      }
      return { si, mayoria: S.mayoria, ok: si >= S.mayoria };
    },

    aplicar155(E, forzado) {
      const rc = E.esp.ccaa.CAT, d = D().ccaa.CAT, g = E.paises.ES.gob;
      const s = T.senado155(E);
      if (!s.ok && !forzado) return { ok: false, si: s.si, mayoria: s.mayoria };
      if (!s.ok) return { ok: false, si: s.si, mayoria: s.mayoria };
      rc.suspendida = { t: E.fecha.t, hasta: E.fecha.t + 26 }; rc.parl.proxT = E.fecha.t + 6; rc.relM = 4;
      rc.concesiones.push({ t: E.fecha.t, v: 5, d: 'Artículo 155' });
      T.procesFase(E, '155', `El Senado autoriza el artículo 155: el Gobierno interviene ${d.nombre}, disuelve el Parlament y convoca elecciones.`);
      g.aprob += 1.5; g.estab += 4;
      for (const k of ['ES_UPC', 'ES_VAP']) E.partidos[k].pop += 0.25; C.Opinion.normalizarES(E);
      return { ok: true, si: s.si, mayoria: s.mayoria };
    },

    /* Un referéndum pactado, si la Constitución lo permite. Devuelve el resultado. */
    referendumIndep(E, c) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c];
      const si = U.clamp(rc.indep + U.gauss(2, 3) + (rc.relM < 25 ? 3 : 0), 5, 80), part = U.clamp(72 + U.gauss(0, 4), 50, 90);
      const ok = si >= 50;
      C.Noticias.poner(E, 'politica', `Referéndum pactado en ${d.nombre}: ${U.d1(si)} % por la independencia (participación ${U.d1(part)} %).`, 'ES');
      if (ok) { E.esp.flags.secesion = { region: c, t: E.fecha.t }; E.paises.ES.gob.estab -= 30; E.paises.ES.gob.aprob -= 8; }
      else { rc.indep = Math.max(rc.indep0 - 4, rc.indep - 6); rc.relM = Math.min(100, rc.relM + 5); }
      return { si, part, ok };
    },

    /* ── Tribunal Constitucional ── */
    recurso(E, p, cual) {
      const tpl = C.Congreso.plantilla(p.tpl);
      E.esp.tc.recursos.push({ id: U.id('R'), cual, t: E.fecha.t, fallo: E.fecha.t + U.ri(26, 60), titulo: p.t, ter: tpl ? tpl.ter : 0, region: p.region || null, tpl: p.tpl });
      C.Noticias.poner(E, 'justicia', `PP/Vox y varias comunidades recurren ante el Tribunal Constitucional «${p.t}».`, 'ES');
    },
    tcTurno(E) {
      const tc = E.esp.tc;
      if (E.fecha.t % 26 === 0) tc.sesgo = U.clamp(tc.sesgo + U.gauss(0, 0.06), -0.8, 0.8);
      tc.recursos = tc.recursos.filter(r => {
        if (E.fecha.t < r.fallo) return true;
        const pAnula = U.clamp(0.42 + Math.abs(r.ter) / 260 - tc.sesgo * 0.38, 0.05, 0.85);
        const anula = U.chance(pAnula);
        if (anula) {
          C.Noticias.poner(E, 'justicia', `El Tribunal Constitucional anula parcialmente «${r.titulo}».`, 'ES');
          if (r.cual !== 'recentralizar') { const c = r.region || 'CAT'; const rc = E.esp.ccaa[c]; if (rc) { rc.relM = Math.max(0, rc.relM - 8); rc.concesiones.push({ t: E.fecha.t, v: 2.5, d: 'Sentencia del TC' }); } }
          E.paises.ES.gob.estab -= 2;
        } else C.Noticias.poner(E, 'justicia', `El Tribunal Constitucional avala «${r.titulo}».`, 'ES');
        return false;
      });
    },

    /* ── Conferencia de Presidentes ── */
    conferenciaPresidentes(E) {
      E.esp.confPres.ultima = E.fecha.t;
      const g = E.paises.ES.gob; let mejora = 0;
      for (const c of T.ids()) { const rc = E.esp.ccaa[c]; const x = U.gauss(1.5, 2) + (rc.gob && g.coalicion.includes(rc.gob.partido) ? 1 : 0); rc.relM = U.clamp(rc.relM + x, 0, 100); mejora += x; }
      g.aprob += 0.3;
      C.Noticias.poner(E, 'politica', 'Conferencia de Presidentes en Madrid: choque por la financiación, pero acuerdo en un fondo de vivienda.', 'ES');
    },

    /* ── Consultas para las pantallas ── */
    aggPartido(E, pid) { let n = 0; for (const c of T.ids()) n += E.esp.ccaa[c].parl.escanos[pid] || 0; return n; },
    presidentes(E) { return T.ids().map(c => ({ c, rc: E.esp.ccaa[c], pres: E.esp.ccaa[c].gob && E.politicos[E.esp.ccaa[c].gob.pres] })); },
    nPresidentes(E, pid) { return T.ids().filter(c => { const g = E.esp.ccaa[c].gob; return g && g.partido === pid; }).length; },
    escanosTotales(E) { return U.suma(T.ids().map(c => U.suma(Object.values(E.esp.ccaa[c].parl.escanos)))); }
  };

  C.Territorio = T;
  C.Tiempo.registrar('territorio', { init: T.init }, 10);
  C.Tiempo.registrar('territorio_turno', { turno: T.turno }, 36);
})(window.ESP);

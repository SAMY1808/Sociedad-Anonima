/* Elecciones generales: 52 circunscripciones (D'Hondt con umbral del 3 %), Senado (elegidos + designados),
   disolución anticipada, calendario y noche electoral. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const SEMANAS_CAMPANA = 8;            // 54 días entre el decreto de disolución y las urnas

  const Gen = {
    init(E) {
      const tUlt = U.turnoDe(new Date(Date.UTC(2023, 6, 23)));
      const tMax = U.turnoDe(new Date(Date.UTC(2027, 6, 25)));
      E.esp.cortes = { estado: 'activa', legislatura: 15, ultElec: tUlt, proxT: tMax, finMax: tMax, ultDisolucion: tUlt - 8, constituida: tUlt + 4, enFunciones: false, investidura: null, mocion: null };
      const P = E.paises.ES;
      P.elec = { ultima: null, proxT: tMax };
      // Arranque a imagen de 2023: la derecha gana en escaños pero sólo el bloque de izquierda y regionalistas suma 176
      const izq = ['PPI', 'APU', 'ASD', 'RCU', 'FUC', 'CPC', 'EHU', 'UVN', 'FGA', 'VUN', 'IPL', 'UAP'].map(s => 'ES_' + s), der = ['UPC', 'VAP', 'UFN', 'CPR', 'TVE', 'ACI', 'CLD'].map(s => 'ES_' + s);
      let res = null;
      for (let i = 0; i < 40; i++) {
        res = Gen.simular(E, { ruido: 0.03, ruidoN: 0.02 });
        const si = U.suma(izq.map(k => res.esc[k] || 0)), sd = U.suma(der.map(k => res.esc[k] || 0));
        if (si >= 178 && sd <= 172 && (res.esc.ES_UPC || 0) > (res.esc.ES_ASD || 0)) break;
      }
      Gen.aplicar(E, res, E.esp.cortes.ultElec);
    },

    /* ── Reparto ── */
    repartoProv(v, n, um) {
      const ids = Object.keys(v);
      if (n === 1) { const g = ids.sort((a, b) => v[b] - v[a])[0]; return { [g]: 1 }; }
      const tot = U.suma(Object.values(v));
      const eleg = ids.filter(k => v[k] / tot * 100 >= (um == null ? 3 : um));
      const w = {}; (eleg.length ? eleg : [ids.sort((a, b) => v[b] - v[a])[0]]).forEach(k => w[k] = v[k]);
      const esc = C.Elecciones.divisores(w, n, false);
      const r = {}; for (const k in esc) if (esc[k]) r[k] = esc[k];
      return r;
    },

    /* Simula unas elecciones generales con la opinión actual. */
    simular(E, o = {}) {
      const P = E.paises.ES, J = E.jugador;
      const prov = {}, nat = {}, esc = {};
      P.partidos.forEach(k => { nat[k] = 0; esc[k] = 0; });
      const swing = {};
      P.partidos.forEach(k => swing[k] = Math.exp(U.gauss(0, o.ruidoN != null ? o.ruidoN : 0.045)));
      if (J && J.campania && o.campania !== false) {
        const bonus = Math.min(2.5, (J.campania.pts || 0) * 0.02), pa = E.partidos[J.partido];
        swing[J.partido] *= 1 + bonus / Math.max(4, pa.popN || pa.pop);
      }
      let pobTot = 0;
      for (const id in D().provincias) {
        const d = D().provincias[id];
        let v = C.Es.votosProv(E, id, o.ruido != null ? o.ruido : 0.05);
        for (const k in v) v[k] *= swing[k];
        if (C.Campana && o.campana !== false) v = C.Campana.ajustarProv(E, id, v);
        const s = U.suma(Object.values(v)); for (const k in v) v[k] = v[k] * 100 / s;
        const vf = Object.assign({}, v), fus = C.Campana && o.campana !== false ? C.Campana.fusionar(E, vf, E.esp.camp) : null;
        const e = Gen.repartoProv(vf, d[2], E.esp.um);
        if (fus) C.Campana.desfusionar(e, fus);
        const ganador = Object.keys(v).sort((a, b) => v[b] - v[a])[0];
        prov[id] = { votos: v, escanos: e, ganador };
        pobTot += d[3];
        for (const k in v) nat[k] += v[k] * d[3];
        for (const k in e) esc[k] += e[k];
      }
      for (const k in nat) nat[k] /= pobTot;
      const part = Math.round(U.clamp(70 + U.gauss(0, 3), 60, 80));
      return { prov, nat, esc, part };
    },

    /* Aplica un resultado: escaños, Senado y estado de las Cortes. */
    aplicar(E, res, t) {
      const P = E.paises.ES;
      E.esp.prov = res.prov;
      const esc = {}; for (const k in res.esc) if (res.esc[k]) esc[k] = res.esc[k];
      P.escanos = esc;
      P.elec.ultima = { t, votos: res.nat, escanos: esc, part: res.part };
      Gen.senado(E);
    },

    /* ── Senado ── */
    senadoElegidos(E) {
      const r = {};
      for (const id in D().provincias) {
        const pr = E.esp.prov[id]; if (!pr) continue;
        const n = D().senadoProv[id] != null ? D().senadoProv[id] : 4;
        const orden = Object.keys(pr.votos).sort((a, b) => pr.votos[b] - pr.votos[a]);
        let nw = Math.floor(n * 0.66 + 0.5);
        if (n <= 2 && pr.votos[orden[0]] >= 55) nw = n;
        nw = Math.max(1, Math.min(n, nw));
        r[orden[0]] = (r[orden[0]] || 0) + nw;
        if (n - nw > 0) r[orden[1]] = (r[orden[1]] || 0) + (n - nw);
      }
      return r;
    },

    senadoDesignados(E) {
      const r = {};
      for (const c in D().ccaa) {
        const n = D().ccaa[c].sen; if (!n) continue;
        const rc = E.esp.ccaa && E.esp.ccaa[c];
        let w = rc && rc.parl && rc.parl.escanos ? rc.parl.escanos : null;
        if (!w || !Object.keys(w).length) w = E.esp.aggReg && E.esp.aggReg[c] ? Object.assign({}, E.esp.aggReg[c]) : {};
        const e = C.Elecciones.divisores(w, n, false);
        for (const k in e) if (e[k]) r[k] = (r[k] || 0) + e[k];
      }
      return r;
    },

    senado(E) {
      const el = Gen.senadoElegidos(E), de = Gen.senadoDesignados(E), t = {};
      for (const k in el) t[k] = (t[k] || 0) + el[k];
      for (const k in de) t[k] = (t[k] || 0) + de[k];
      E.esp.senado = { escanos: t, elegidos: el, designados: de, total: U.suma(Object.values(t)), mayoria: Math.floor(U.suma(Object.values(t)) / 2) + 1 };
    },

    /* ── Calendario ── */
    puedeDisolver(E) {
      const c = E.esp.cortes;
      if (c.estado !== 'activa') return 'Las Cortes no están en su etapa ordinaria';
      if (c.mocion) return 'Hay una moción de censura en trámite';
      if (E.fecha.t - c.ultDisolucion < 52) return 'No puede disolverse antes de un año desde la última disolución';
      if (E.esp.flags.excepcion) return 'No se pueden disolver las Cortes con un estado de excepción vigente';
      return true;
    },

    disolver(E, motivo, auto) {
      const c = E.esp.cortes, P = E.paises.ES;
      if (!auto) { const p = Gen.puedeDisolver(E); if (p !== true) return p; }
      E.esp.pendienteSocio = false; E.esp.pendienteInvestidura = false; if (E.esp.pendienteInvAut && E.esp.pendienteInvAut.c === 'ES') E.esp.pendienteInvAut = null; E.esp.votoJ = null;
      c.estado = 'disueltas'; c.ultDisolucion = E.fecha.t; c.proxT = E.fecha.t + SEMANAS_CAMPANA; c.mocion = null; c.investidura = null;
      P.elec.proxT = c.proxT;
      C.Noticias.poner(E, 'politica', `Real decreto de disolución de las Cortes: elecciones generales el ${U.fmtT(c.proxT)}${motivo ? ' (' + motivo + ')' : ''}.`, 'ES');
      const J = E.jugador;
      if (J && J.pais === 'ES') { J.campania = { pts: 0, mitines: 0 }; P.flags.campana = true; }
      if (C.Campana) C.Campana.iniciar(E);
      C.Bus.emit('disolucion', {});
      return true;
    },

    semanasHasta(E) { return Math.max(0, E.esp.cortes.proxT - E.fecha.t); },

    turno(E) {
      const c = E.esp.cortes;
      if (c.estado === 'activa' && E.fecha.t >= c.finMax - SEMANAS_CAMPANA) Gen.disolver(E, 'fin de la legislatura', true);
      if (c.estado === 'disueltas' && E.fecha.t >= c.proxT) Gen.celebrar(E);
    },

    celebrar(E) {
      const P = E.paises.ES, J = E.jugador, c = E.esp.cortes;
      const previo = P.elec.ultima;
      const antes = Object.assign({}, P.escanos);
      const res = Gen.simular(E, {});
      const cierre = C.Campana ? C.Campana.cierre(E, res, previo) : null;
      Gen.aplicar(E, res, E.fecha.t);
      c.legislatura++; c.ultElec = E.fecha.t; c.estado = 'constitucion'; c.tConst = E.fecha.t + 4; c.proxT = E.fecha.t + 4 * 52; c.finMax = c.proxT; c.enFunciones = true; c.investidura = null;
      P.elec.proxT = c.proxT; P.flags.campana = false;
      // La opinión se acerca al resultado
      for (const k of E.esp.nacionales) { const p = E.partidos[k]; const f = Math.pow(Math.max(0.05, res.nat[k]) / Math.max(0.05, p.popN || p.pop), 0.55); p.pop *= f; p.base = p.base * 0.7 + p.pop * 0.3; }
      C.Opinion.normalizarES(E);
      C.Es.agregar(E);
      // Liderazgos: los grandes perdedores cambian de líder (menos el jugador)
      P.partidos.forEach(pid => {
        const p = E.partidos[pid]; if (p.amb !== 'nac' || p.lider === 'J') return;
        const dv = res.nat[pid] - (previo && previo.votos[pid] || 0);
        if (dv < -3.5 && U.chance(0.5)) C.Ejecutivo.nuevoLider(E, pid, 'tras el mal resultado electoral');
      });
      const personal = J && J.pais === 'ES' ? C.Personaje.tras_generales(E, previo, res) : null;
      C.Congreso.recomponer(E, antes);
      E.elecciones.historico.unshift({ t: E.fecha.t, tipo: 'generales', votos: res.nat, escanos: P.escanos, part: res.part });
      if (!C.Foco || C.Foco.noche(E, 'generales')) E.elecciones.nochePendiente = { tipo: 'generales', pais: 'ES', t: E.fecha.t, votos: res.nat, escanos: Object.assign({}, P.escanos), antes, part: res.part, previo: previo ? previo.votos : null, personal, prov: res.prov, camp: cierre };
      C.Bus.emit('elecciones', { tipo: 'generales' });
      return res;
    },

    /* Estimación publicada: voto agregado con error de muestreo + proyección de escaños sin ruido. */
    encuesta(E, error) {
      const P = E.paises.ES, agg = C.Es.agregar(E), r = {};
      P.partidos.forEach(k => r[k] = Math.max(0, agg[k] + U.gauss(0, (error || 0.5) * Math.sqrt(Math.max(0.3, agg[k]) / 15))));
      const s = U.suma(Object.values(r)); for (const k in r) r[k] = r[k] * 100 / s;
      return r;
    },
    proyeccion(E) {
      const esc = {}; E.paises.ES.partidos.forEach(k => esc[k] = 0);
      for (const id in D().provincias) {
        const v = C.Es.votosProv(E, id, 0);
        const e = Gen.repartoProv(v, D().provincias[id][2], E.esp.um);
        for (const k in e) esc[k] += e[k];
      }
      const r = {}; for (const k in esc) if (esc[k]) r[k] = esc[k];
      return r;
    }
  };

  C.Generales = Gen;
  C.Tiempo.registrar('generales', Gen, 8);
})(window.ESP);

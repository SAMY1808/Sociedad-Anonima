/* España: partidos nacionales y regionales, voto por circunscripción, calibrado y agregados.
   Los datos territoriales viven en E.esp (ver data/territorio.js). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;

  const COLOR = { UPC: '#2A7DE1', ASD: '#E2402F', VAP: '#5BA33A', PPI: '#C0408F', APU: '#7B3FA0', CLD: '#F58220',
                  RCU: '#E8B100', FUC: '#1BA896', CPC: '#F2D400', UVN: '#2E8B3E', EHU: '#8BC34A', FGA: '#5DADE2', ACI: '#F7C948',
                  UFN: '#3558A8', VUN: '#E2733A', IPL: '#4FB3A9', UAP: '#C0392B', TVE: '#8E6B3E', CPR: '#9ACD32' };

  const Es = {
    COLOR,

    /* Crea los partidos de España (id «ES_SIGLA») y sus líderes nacionales. */
    init(E) {
      const op = E.meta.opts || {};
      const P = E.paises.ES;
      E.esp = { prov: {}, pn: {}, ccaa: {}, muni: {}, senado: { escanos: {}, total: 265 }, agg: {}, cortes: {}, consejo: {}, pge: {}, flags: {}, historial: [] };
      for (const def of D().partidosES) {
        const arq = D().arquetipos[def.arq];
        const pid = 'ES_' + def.sigla;
        const pa = {
          id: pid, pais: 'ES', nombre: def.nombre, sigla: def.sigla, arq: def.arq, color: COLOR[def.sigla] || arq.color,
          eco: def.eco != null ? def.eco : Math.round(arq.eco + U.gauss(0, 4)), soc: def.soc != null ? def.soc : Math.round(arq.soc + U.gauss(0, 4)), eu: def.eu != null ? def.eu : Math.round(arq.eu + U.gauss(0, 4)),
          ter: def.ter, indep: def.indep || 0, grupo: def.grupo, amb: def.amb, region: def.region || null,
          pop: def.amb === 'nac' ? def.nac : def.base, base: def.amb === 'nac' ? def.nac : def.base, popN: 0,
          cohesion: Math.round(U.clamp(U.gauss(74, 8), 50, 92)), finanzas: Math.round(U.rf(40, 85)), militantes: 0, lider: null, nuevo: false
        };
        if (def.amb === 'reg') { pa.rp = {}; pa.rp[def.region] = def.base; if (def.extra) for (const r in def.extra) pa.rp[r] = def.extra[r]; pa.rp0 = Object.assign({}, pa.rp); }
        pa.militantes = def.amb === 'nac' ? Math.round(U.rf(60, 280) * def.nac) * 100 : Math.round(U.rf(8, 40) * def.base) * 100;
        E.partidos[pid] = pa; P.partidos.push(pid);
        const ld = C.Mundo.politico(E, { pais: def.region || 'ES', partido: pid, eco: pa.eco, soc: pa.soc, eu: pa.eu, e: U.ri(42, 66), c: U.gauss(62, 14), a: 90 });
        ld.pais = 'ES'; pa.lider = ld.id;
      }
      // Partido nuevo del jugador (opcional)
      if (op.pais === 'ES' && op.nuevo) {
        const nu = op.nuevo, pid = 'ES_' + nu.sigla;
        const pa = { id: pid, pais: 'ES', nombre: nu.nombre, sigla: nu.sigla, arq: nu.arq || 'cen', color: nu.color || '#8E44AD', eco: nu.eco, soc: nu.soc, eu: nu.eu, ter: nu.ter != null ? nu.ter : 0, indep: 0, grupo: D().arquetipos[nu.arq || 'cen'].grupo, amb: 'nac', region: null,
          pop: 1.2, base: 1.2, popN: 0, cohesion: 80, finanzas: 40, militantes: 5000, lider: null, nuevo: true };
        E.partidos[pid] = pa; P.partidos.push(pid);
      }
      E.esp.nacionales = P.partidos.filter(k => E.partidos[k].amb === 'nac');
      E.esp.regionales = P.partidos.filter(k => E.partidos[k].amb === 'reg');
      for (const prov in D().provincias) { E.esp.pn[prov] = {}; P.partidos.forEach(k => E.esp.pn[prov][k] = Math.exp(U.gauss(0, 0.07))); }
      Es.calibrar(E);
    },


    /* ── Voto por circunscripción ── */
    /* Reparte el voto de una provincia entre los partidos: nacionales (con su multiplicador regional) y regionales. */
    votosProv(E, prov, ruido) {
      const d = D().provincias[prov], ccaa = d[1], P = E.paises.ES;
      const reg = {}, nac = {};
      let regSum = 0;
      for (const pid of P.partidos) {
        const p = E.partidos[pid];
        const pn = E.esp.pn[prov][pid] * (ruido ? Math.exp(U.gauss(0, ruido)) : 1);
        if (p.amb === 'nac') {
          const def = D().partidosES.find(x => x.sigla === p.sigla);
          const m = def && def.m ? (def.m[ccaa] != null ? def.m[ccaa] : 1) : 1;
          nac[pid] = p.pop * m * pn;
        } else {
          const base = p.rp && p.rp[ccaa] ? p.rp[ccaa] : 0; if (!base) continue;
          const def = D().partidosES.find(x => x.sigla === p.sigla);
          const adj = def && def.padj && def.padj[prov] != null ? def.padj[prov] : 1;
          reg[pid] = base * adj * pn; regSum += reg[pid];
        }
      }
      regSum = Math.min(regSum, 88);
      const nsum = U.suma(Object.values(nac)) || 1, k = (100 - regSum) / nsum;
      const rsum = U.suma(Object.values(reg)) || 1, kr = rsum > 88 ? 88 / rsum : 1;
      const v = {};
      for (const pid in nac) v[pid] = nac[pid] * k;
      for (const pid in reg) v[pid] = reg[pid] * kr;
      return v;
    },

    /* Agregado nacional y regional de voto con la opinión actual. */
    agregar(E) {
      const P = E.paises.ES, tot = {}, reg = {}, popTot = {}, popReg = {};
      P.partidos.forEach(k => tot[k] = 0);
      for (const prov in D().provincias) {
        const d = D().provincias[prov], w = d[3], c = d[1];
        const v = Es.votosProv(E, prov, 0);
        popTot.n = (popTot.n || 0) + w; popReg[c] = (popReg[c] || 0) + w;
        reg[c] = reg[c] || {};
        for (const pid in v) { tot[pid] += v[pid] * w; reg[c][pid] = (reg[c][pid] || 0) + v[pid] * w; }
      }
      for (const pid in tot) { tot[pid] /= popTot.n; E.partidos[pid].popN = tot[pid]; }
      for (const c in reg) for (const pid in reg[c]) reg[c][pid] /= popReg[c];
      E.esp.agg = tot; E.esp.aggReg = reg;
      return tot;
    },

    /* Ajuste proporcional iterativo: que el resultado nacional coincida con los objetivos de partida. */
    calibrar(E) {
      const P = E.paises.ES;
      for (let it = 0; it < 14; it++) {
        const agg = Es.agregar(E);
        const regNat = U.suma(E.esp.regionales.map(k => agg[k]));
        const objetivos = {}; let tObj = 0;
        E.esp.nacionales.forEach(k => { const def = D().partidosES.find(x => x.sigla === E.partidos[k].sigla); objetivos[k] = def ? def.nac : 1.2; tObj += objetivos[k]; });
        const escala = (100 - regNat) / tObj;
        E.esp.nacionales.forEach(k => { const o = objetivos[k] * escala; E.partidos[k].pop *= Math.pow(o / Math.max(0.05, agg[k]), 0.9); });
      }
      E.esp.nacionales.forEach(k => { E.partidos[k].base = E.partidos[k].pop; });
      Es.agregar(E);
    },

    /* Población nacional equivalente de un partido (para el Parlamento Europeo y los gráficos). */
    popN(E, pid) { return E.partidos[pid].popN || E.partidos[pid].pop; },

    /* Provincia con su comunidad autónoma. */
    ccaaDe(prov) { return D().provincias[prov][1]; },
    provinciasDe(ccaa) { return Object.keys(D().provincias).filter(k => D().provincias[k][1] === ccaa); }
  };

  C.Es = Es;
  C.Tiempo.registrar('espana', Es, 2);
})(window.ESP);

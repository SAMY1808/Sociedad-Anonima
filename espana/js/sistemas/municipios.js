/* Municipios: 66 ciudades principales con concejales (D'Hondt, umbral del 5 %), alcaldes e investidura municipal.
   El resto de ayuntamientos (unos 8.000) se agrega por comunidad para dar el mapa de alcaldías. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const SEM_LEG = 208;
  const IND = 'IND';                       // agrupaciones locales e independientes

  const concejales = pob => {              // pob en miles
    if (pob >= 1000) return Math.min(57, 41 + Math.floor((pob - 1000) / 100));
    if (pob >= 500) return 37; if (pob >= 300) return 33; if (pob >= 250) return 31; if (pob >= 200) return 29; if (pob >= 100) return 27; if (pob >= 50) return 25;
    return 21;
  };

  const Mu = {
    ids: () => D().municipios.map(m => m[0]),
    def(id) { const m = D().municipios.find(x => x[0] === id); return m ? { id: m[0], nombre: m[1], prov: m[2], pob: m[3], ccaa: D().provincias[m[2]][1] } : null; },

    init(E) {
      E.esp.muni = { m: {}, ult: 0, proxT: U.turnoDe(new Date(Date.UTC(2027, 4, 23))), resumen: null };
      E.esp.muni.ult = E.esp.muni.proxT - SEM_LEG;
      for (const id of Mu.ids()) {
        const d = Mu.def(id);
        const loc = {}; E.paises.ES.partidos.forEach(k => loc[k] = Math.exp(U.gauss(0, 0.16)));
        E.esp.muni.m[id] = { id, nombre: d.nombre, prov: d.prov, ccaa: d.ccaa, pob: d.pob, n: concejales(d.pob), loc, esc: {}, votos: {}, alcalde: null, pm: null, coal: [], aprob: U.clamp(50 + U.gauss(0, 8), 25, 75), deuda: Math.round(U.rf(15, 70)), tension: U.rf(20, 60) };
      }
      Mu.elecciones(E, true);
      if (Mu.initAyto) Mu.initAyto(E);
    },

    votos(E, id, ruido) {
      const m = E.esp.muni.m[id], v = C.Es.votosProv(E, m.prov, 0), r = {};
      for (const k in v) {
        const p = E.partidos[k];
        let x = v[k] * m.loc[k] * (ruido ? Math.exp(U.gauss(0, ruido)) : 1);
        if (p.amb === 'reg') x *= 1.08;
        if (m.coal && m.coal.includes(k)) x *= 1 + (m.aprob - 50) / 180;
        r[k] = x;
      }
      const s = U.suma(Object.values(r)) || 1; for (const k in r) r[k] = r[k] * 100 / s;
      return r;
    },

    elecciones(E, inicial) {
      const t = E.fecha.t, res = { alc: {}, conc: {}, ciudades: [] };
      for (const id of Mu.ids()) {
        const m = E.esp.muni.m[id];
        const v = Mu.votos(E, id, 0.04);
        const w = {}; for (const k in v) if (v[k] >= 5) w[k] = v[k];
        const e = C.Elecciones.divisores(w, m.n, false); const esc = {}; for (const k in e) if (e[k]) esc[k] = e[k];
        m.votos = v; m.esc = esc;
        Mu.elegirAlcalde(E, id, inicial);
        if (!inicial && Mu.repartirConc) Mu.repartirConc(E, id);
        for (const k in esc) res.conc[k] = (res.conc[k] || 0) + esc[k];
        res.alc[m.alcalde] = (res.alc[m.alcalde] || 0) + 1;
        if (!inicial && m.pob >= 190) res.ciudades.push({ id, nombre: m.nombre, votos: v, esc, alcalde: m.alcalde, coal: m.coal });
      }
      Mu.resto(E, res);
      E.esp.muni.resumen = res; if (!inicial) { E.esp.muni.ult = t; E.esp.muni.proxT = t + SEM_LEG; }
      if (!inicial) {
        const jo = E.esp.jornada[t] = E.esp.jornada[t] || { t, aut: [], mun: null };
        jo.mun = { alc: res.alc, conc: res.conc, ciudades: res.ciudades, alcRes: res.alcRes, total: res.total, personal: C.Personaje.tras_municipales ? C.Personaje.tras_municipales(E, res) : null };
        E.elecciones.historico.unshift({ t, tipo: 'municipales', alc: res.alcRes });
        C.Noticias.poner(E, 'elecciones', `Elecciones municipales: ${Mu.liderAlcaldias(E, res)}.`, 'ES');
        C.Bus.emit('elecciones', { tipo: 'municipales' });
      }
    },

    liderAlcaldias(E, res) {
      const o = Object.keys(res.alcRes).filter(k => k !== IND).sort((a, b) => res.alcRes[b] - res.alcRes[a]).slice(0, 3);
      return o.map(k => `${E.partidos[k].sigla} ${U.n(res.alcRes[k])} alcaldías`).join(', ');
    },

    /* Elección del alcalde: lista más votada, salvo pacto de mayoría alternativa. */
    elegirAlcalde(E, id, inicial) {
      const m = E.esp.muni.m[id], esc = m.esc, Ej = C.Ejecutivo, tot = U.suma(Object.values(esc)), may = Math.floor(tot / 2) + 1;
      const ps = Object.keys(esc).sort((a, b) => esc[b] - esc[a]);
      if (!ps.length) return;
      if (esc[ps[0]] >= may) { m.alcalde = ps[0]; m.coal = [ps[0]]; }
      else {
        let mejor = null;
        for (const cand of ps.slice(0, 3)) {
          const bloque = [cand]; let s = esc[cand];
          const otros = ps.filter(p => p !== cand).map(p => ({ p, aff: Ej.afinidad(E, cand, p) })).sort((a, b) => b.aff - a.aff);
          for (const x of otros) { if (s >= may) break; if (bloque.some(q => Ej.vetaA(E, x.p, q) || Ej.vetaA(E, q, x.p))) continue; if (x.aff < 0.3) continue; bloque.push(x.p); s += esc[x.p]; }
          const score = (s >= may ? 100 : 0) + esc[cand] - bloque.length * 3 + (cand === ps[0] ? 3 : 0);
          if (!mejor || score > mejor.score) mejor = { cand, bloque, s, score };
        }
        m.alcalde = mejor.cand; m.coal = mejor.bloque;
      }
      if (m.pm === 'J' && E.politicos.J && E.politicos.J.p !== m.alcalde) m.pm = null;
      {
        const pa = E.partidos[m.alcalde];
        if (!m.pm || !E.politicos[m.pm] || E.politicos[m.pm].p !== m.alcalde) {
          if (m.pm && E.politicos[m.pm] && m.pm !== 'J') delete E.politicos[m.pm];
          if (m.pm !== 'J') {
            const pol = C.Mundo.politico(E, { pais: 'ES', partido: m.alcalde, eco: pa.eco + U.gauss(0, 8), soc: pa.soc + U.gauss(0, 8), eu: pa.eu + U.gauss(0, 8), a: 70 });
            const pers = C.Mundo.persona(m.ccaa); pol.n = pers.n; pol.g = pers.g; pol.ter = Math.round(pa.ter + U.gauss(0, 8)); pol.cargo = 'alcalde'; pol.muni = id;
            m.pm = pol.id;
          }
        }
      }
      m.aprob = U.clamp(m.aprob + (inicial ? 0 : U.gauss(3, 4)), 25, 80);
    },

    /* Resumen nacional: alcaldías de las 66 ciudades más el resto estimado por comunidad. */
    resto(E, res) {
      const alc = Object.assign({}, res.alc); let total = U.suma(Object.values(res.alc));
      const principal = {}; Mu.ids().forEach(id => { principal[E.esp.muni.m[id].ccaa] = (principal[E.esp.muni.m[id].ccaa] || 0) + 1; });
      for (const c in D().ccaa) {
        const resto = Math.max(0, D().ccaa[c].munis - (principal[c] || 0)); if (!resto) continue;
        const v = E.esp.aggReg[c] || {}, w = {};
        for (const k in v) { const p = E.partidos[k]; w[k] = v[k] * (p.amb === 'reg' ? 1.45 : p.sigla === 'UPC' ? 1.25 : p.sigla === 'ASD' ? 1.0 : p.sigla === 'VAP' ? 0.55 : p.sigla === 'PPI' ? 0.2 : p.sigla === 'APU' ? 0.15 : 0.6); }
        w[IND] = D().ccaa[c].munis > 200 ? 14 : 4;
        const s = U.suma(Object.values(w)); let asig = 0;
        const keys = Object.keys(w).sort((a, b) => w[b] - w[a]);
        keys.forEach((k, i) => { const n = i === keys.length - 1 ? resto - asig : Math.round(resto * w[k] / s); const nn = Math.max(0, Math.min(resto - asig, n)); asig += nn; if (nn) alc[k] = (alc[k] || 0) + nn; });
        total += resto;
      }
      res.alcRes = alc; res.total = total;
    },

    turno(E) {
      const mm = E.esp.muni, t = E.fecha.t, g = E.paises.ES.gob;
      for (const id of Mu.ids()) {
        const m = mm.m[id], clima = C.Economia.clima(E, 'ES');
        Mu.dinamica(E, m);
      }
      if (t >= mm.proxT) Mu.elecciones(E, false);
    },

    de(E, id) { return E.esp.muni.m[id]; },
    delJugador(E) { const J = E.jugador; return J && J.muni ? E.esp.muni.m[J.muni] : null; },
    porCcaa(E, c) { return Mu.ids().map(id => E.esp.muni.m[id]).filter(m => m.ccaa === c); },
    alcaldias(E) { return E.esp.muni.resumen ? E.esp.muni.resumen.alcRes : {}; },
    concejalesTotales(E) { return E.esp.muni.resumen ? E.esp.muni.resumen.conc : {}; }
  };

  C.Municipios = Mu;
  C.Tiempo.registrar('municipios', { init: Mu.init }, 12);
  C.Tiempo.registrar('municipios_turno', { turno: Mu.turno }, 37);
})(window.ESP);

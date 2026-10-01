/* Gobierno: formación de coaliciones, reparto de ministerios, estabilidad y caída de gobiernos. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const ORDEN_MIN = ['eco', 'int', 'ext', 'def', 'jus', 'eur', 'sal', 'edu', 'tra', 'amb', 'agr', 'ter'];

  const G = {
    init(E) { for (const id in E.paises) G.formar(E, id, { inicial: true }); },

    /* Partidos que no pueden entrar en el Gobierno (cordón sanitario). */
    vetado(E, id, pid) {
      if (!D().paises[id].cordon || E.partidos[pid].arq !== 'ext') return false;
      const P = E.paises[id], total = U.suma(Object.values(P.escanos));
      return (P.escanos[pid] || 0) <= total / 2;      // el cordón se rompe si el partido tiene mayoría absoluta
    },

    /* Calcula posibles coaliciones y devuelve la mejor (o la elegida por el jugador). */
    opciones(E, id, opts = {}) {
      const P = E.paises[id];
      const esc = P.escanos;
      const total = U.suma(Object.values(esc)), mayoria = Math.floor(total / 2) + 1;
      const con = Object.keys(esc).filter(k => esc[k] > 0).sort((a, b) => esc[b] - esc[a]);
      const posibles = con.filter(k => !G.vetado(E, id, k) && !(opts.excluir && opts.excluir.includes(k)));
      const resultados = [];
      const formateurs = opts.formateur ? [opts.formateur] : posibles.slice(0, 3);
      for (const f of formateurs) {
        const coal = [f]; let suma = esc[f];
        const centro = () => C.Mundo.centroide(E, coal, esc);
        while (suma < mayoria) {
          let best = null, bs = -1;
          const cen = centro();
          for (const k of posibles) {
            if (coal.includes(k)) continue;
            const dist = U.distIdeo(cen, E.partidos[k]);
            if (dist > 0.6) continue;
            const s = Math.pow(esc[k], 0.5) * (1 - dist * 1.35) + (opts.fuerza && opts.fuerza[k] || 0);
            if (s > bs) { bs = s; best = k; }
          }
          if (!best) break;
          coal.push(best); suma += esc[best];
        }
        let spread = 0;
        for (let i = 0; i < coal.length; i++) for (let j = i + 1; j < coal.length; j++) spread = Math.max(spread, U.distIdeo(E.partidos[coal[i]], E.partidos[coal[j]]));
        let tipo = suma >= mayoria ? (coal.length === 1 ? 'mono' : 'mayoria') : 'minoria', ext = [];
        if (tipo === 'minoria') {
          // Busca apoyo externo para sumar mayoría
          const cen = centro();
          const fuera = posibles.filter(k => !coal.includes(k)).sort((a, b) => U.distIdeo(cen, E.partidos[a]) - U.distIdeo(cen, E.partidos[b]));
          let s2 = suma;
          for (const k of fuera) { if (s2 >= mayoria) break; if (U.distIdeo(cen, E.partidos[k]) < 0.72) { ext.push(k); s2 += esc[k]; } }
          if (s2 < mayoria) ext = ext.slice(0, 1);
        }
        const score = (tipo !== 'minoria' ? 100 : 40) + (esc[f] / total) * 45 - spread * 70 - (coal.length - 1) * 4;
        resultados.push({ formateur: f, coalicion: coal, apoyoExterno: ext, tipo, escanos: suma, mayoria, spread, score });
      }
      resultados.sort((a, b) => b.score - a.score);
      return { resultados, mayoria, total };
    },

    /* Forma Gobierno en un país. Si se indica `coalicion`, usa esa (negociación del jugador). */
    formar(E, id, opts = {}) {
      const P = E.paises[id], d = D().paises[id];
      let r;
      if (opts.coalicion) {
        const esc = P.escanos, coal = opts.coalicion, suma = U.suma(coal.map(k => esc[k] || 0)), total = U.suma(Object.values(esc));
        r = { formateur: coal[0], coalicion: coal, apoyoExterno: opts.apoyoExterno || [], tipo: suma > total / 2 ? (coal.length === 1 ? 'mono' : 'mayoria') : 'minoria', escanos: suma, spread: 0 };
        for (let i = 0; i < coal.length; i++) for (let j = i + 1; j < coal.length; j++) r.spread = Math.max(r.spread, U.distIdeo(E.partidos[coal[i]], E.partidos[coal[j]]));
      } else {
        const op = G.opciones(E, id, { excluir: opts.evitar ? [opts.evitar] : null });
        let lista = op.resultados;
        // El más puntuado gana casi siempre; a veces la segunda opción por maniobras de última hora
        r = (lista.length > 1 && U.chance(0.16) && lista[1].score > 70) ? lista[1] : lista[0];
        if (!r) { const f = Object.keys(P.escanos).sort((a, b) => P.escanos[b] - P.escanos[a])[0]; r = { formateur: f, coalicion: [f], apoyoExterno: [], tipo: 'minoria', escanos: P.escanos[f], spread: 0 }; }
      }
      const lider = E.politicos[E.partidos[r.formateur].lider];
      const g = {
        pm: lider ? lider.id : null, partido: r.formateur, coalicion: r.coalicion, apoyoExterno: r.apoyoExterno || [], tipo: r.tipo,
        aprob: opts.inicial ? U.clamp(40 + U.gauss(0, 8), 26, 60) : 47 + U.gauss(0, 5), formado: opts.inicial ? P.elec.ultima.t : E.fecha.t,
        estab: U.clamp(80 - r.spread * 55 - (r.coalicion.length - 1) * 4 - (r.tipo === 'minoria' ? 14 : 0) + U.gauss(0, 7), 22, 95), ministros: {}, agenda: []
      };
      P.gob = g;
      E.partidos && P.partidos.forEach(pid => {
        const p = E.partidos[pid];
        p.postura = g.coalicion.includes(pid) ? 'gobierno' : (g.apoyoExterno.includes(pid) ? 'apoyo' : 'oposicion');
      });
      if (E.jugador && E.jugador.pais === id && E.parl.miembros.length) {
        G.repartirMinisterios(E);
        C.Personaje.sincronizar(E);
        if (!opts.inicial) {
          const j = E.politicos[g.pm];
          C.Noticias.poner(E, 'politica', `${j ? j.n : 'Nuevo líder'} (${E.partidos[g.partido].sigla}) forma gobierno ${g.coalicion.length > 1 ? 'de coalición' : g.tipo === 'minoria' ? 'en minoría' : 'en solitario'} en ${d.nombre}.`, id);
        }
      }
      return g;
    },

    /* Probabilidad de que un partido acepte pactar con el del jugador. */
    disposicion(E, id, k) {
      const J = E.jugador;
      if (G.vetado(E, id, k)) return 0;
      const dist = U.distIdeo(E.partidos[J.partido], E.partidos[k]);
      const enGob = E.paises[id].gob.coalicion.includes(k) ? -0.06 : 0.04;
      return U.clamp(1.05 - dist * 1.9 + J.atrib.negociacion * 0.03 + (J.prestigio - 40) / 400 + enGob, 0.03, 0.95);
    },

    /* Intenta formar (o derribar) un gobierno con los socios elegidos por el jugador. */
    intentarCoalicion(E, id, socios, censura) {
      const P = E.paises[id], J = E.jugador;
      const aceptan = [], rechazan = [];
      socios.forEach(k => (U.chance(G.disposicion(E, id, k)) ? aceptan : rechazan).push(k));
      const coal = [J.partido].concat(aceptan);
      const suma = U.suma(coal.map(k => P.escanos[k] || 0)), total = U.suma(Object.values(P.escanos)), mayoria = Math.floor(total / 2) + 1;
      const r = { aceptan, rechazan, suma, mayoria, ok: false, tipo: null };
      if (suma >= mayoria) { r.ok = true; r.tipo = 'mayoria'; }
      else if (!censura && suma >= total * 0.3) { r.ok = U.chance(0.5 + (suma / total - 0.3)); r.tipo = 'minoria'; }
      if (r.ok) G.formar(E, id, { coalicion: coal, tras: !censura, censura });
      return r;
    },

    /* Reparte los ministerios entre los partidos de la coalición. */
    repartirMinisterios(E) {
      const J = E.jugador, P = E.paises[J.pais], g = P.gob;
      const antes = Object.values(g.ministros);
      antes.forEach(pid => { const p = E.politicos[pid]; if (p && p.cargo && p.cargo.startsWith('min:')) p.cargo = null; });
      g.ministros = {};
      const pm = E.politicos[g.pm]; if (pm) pm.cargo = 'pm';
      const coal = g.coalicion, esc = P.escanos;
      const tot = U.suma(coal.map(k => esc[k]));
      const cuota = {}; coal.forEach(k => cuota[k] = esc[k] / tot * ORDEN_MIN.length);
      // Si el jugador ya era ministro y su partido sigue en el gobierno, conserva cartera
      const usados = new Set([g.pm]);
      ORDEN_MIN.forEach(mid => {
        const k = coal.slice().sort((a, b) => cuota[b] - cuota[a])[0];
        cuota[k] -= 1;
        const miembros = E.parl.miembros.map(i => E.politicos[i]).filter(p => p && p.p === k && !usados.has(p.id) && p.id !== 'J');
        let ele = null;
        if (J.ministerio === mid && J.partido === k && C.Personaje.enParlamento(E)) ele = E.politicos['J'];
        if (!ele) ele = miembros.sort((a, b) => ((b.a + b.c + b.i) / 3 + U.gauss(0, 12)) - ((a.a + a.c + a.i) / 3 + U.gauss(0, 12)))[0];
        if (!ele) { const lid = E.politicos[E.partidos[k].lider]; if (lid && !usados.has(lid.id)) ele = lid; }
        if (ele) { g.ministros[mid] = ele.id; usados.add(ele.id); if (ele.id !== 'J') ele.cargo = 'min:' + mid; }
      });
      if (J.ministerio && !Object.values(g.ministros).includes('J')) { J.ministerio = null; }
    },

    /* Rellena carteras vacías con diputados del mismo partido. */
    cubrirVacantes(E) {
      const J = E.jugador, g = E.paises[J.pais].gob;
      const usados = new Set(Object.values(g.ministros).filter(Boolean).concat([g.pm]));
      for (const k of ORDEN_MIN) {
        if (g.ministros[k]) continue;
        const partido = U.pick(g.coalicion);
        const c = E.parl.miembros.map(i => E.politicos[i]).filter(p => p && p.p === partido && !usados.has(p.id) && p.id !== 'J').sort((a, b) => b.a - a.a)[0];
        if (c) { g.ministros[k] = c.id; c.cargo = 'min:' + k; usados.add(c.id); }
      }
    },

    nuevoLider(E, pid, motivo) {
      const p = E.partidos[pid], viejo = E.politicos[p.lider];
      const n = C.Mundo.politico(E, { pais: p.pais, partido: pid, eco: p.eco + U.gauss(0, 6), soc: p.soc + U.gauss(0, 6), eu: p.eu + U.gauss(0, 6), e: U.ri(40, 58), c: U.gauss(62, 14), a: 85 });
      p.lider = n.id;
      const P = E.paises[p.pais];
      if (P.gob && P.gob.partido === pid && !(E.jugador && E.jugador.pais === p.pais)) P.gob.pm = n.id;
      if (E.jugador && E.jugador.pais === p.pais) C.Noticias.poner(E, 'partido', `${p.sigla}: ${n.n} sustituye a ${viejo ? viejo.n : 'su anterior líder'} ${motivo || ''}.`, p.pais);
      return n;
    },

    turno(E) {
      for (const id in E.paises) {
        const P = E.paises[id], g = P.gob; if (!g) continue;
        const prop = E.jugador && E.jugador.pais === id;
        g.estab += U.gauss(0, 0.55) + (g.aprob - 38) * 0.008 + (g.tipo === 'minoria' ? -0.12 : 0.03) + (P.ec.pde ? -0.05 : 0);
        g.estab = U.clamp(g.estab, 0, 100);
        if (P.flags.leyMarcial && g.estab < 30) g.estab = 30;
        if (g.estab < 14 && U.chance(0.1 + (14 - g.estab) * 0.01) && !P.flags.anticipada && P.elec.proxT - E.fecha.t > 12) G.caida(E, id);
      }
    },

    /* Cae el Gobierno: elecciones anticipadas o nuevo gobierno sin urnas. */
    caida(E, id, motivo) {
      const P = E.paises[id], d = D().paises[id], g = P.gob, prop = E.jugador && E.jugador.pais === id;
      const viejo = E.politicos[g.pm];
      const txt = `Cae el gobierno de ${d.nombre}${motivo ? ': ' + motivo : ' por la ruptura de la coalición'}. ${viejo ? viejo.n + ' dimite.' : ''}`;
      C.Noticias.poner(E, 'politica', txt, id);
      if (U.chance(0.5)) {
        C.Elecciones.adelantar(E, id, U.ri(8, 12));
        if (prop) C.Eventos.info(E, '🗳️ Cae el Gobierno', `${txt} Se convocan elecciones anticipadas para el ${U.fmtT(P.elec.proxT)}.`);
      } else {
        G.formar(E, id, { evitar: g.partido });
        const nuevo = P.gob;
        if (prop) C.Eventos.info(E, '🏛️ Nuevo gobierno sin elecciones', `${txt} Sin urnas, ${E.partidos[nuevo.partido].nombre} forma un nuevo Ejecutivo ${nuevo.coalicion.length > 1 ? 'con ' + nuevo.coalicion.filter(k => k !== nuevo.partido).map(k => E.partidos[k].sigla).join(', ') : 'en solitario'}.`);
      }
    }
  };

  C.Gobierno = G;
  C.Tiempo.registrar('gobierno', G, 25);
})(window.EUROPA);

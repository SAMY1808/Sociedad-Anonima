/* Ayuntamientos: indicadores urbanos, presupuesto (gasto por área, IBI, deuda), pleno, proyectos, mociones de censura
   locales, gobierno municipal con concejalías y relación con la comunidad, el Estado y la UE. Amplía C.Municipios. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, Mu = C.Municipios, clamp = U.clamp;
  const AREAS = ['urb', 'mov', 'seg', 'ser', 'soc', 'cul'];
  const IND = { urb: 'vivienda', mov: 'movilidad', seg: 'seguridad', ser: 'limpieza', soc: 'empleo', cul: 'cultura' };
  const NOM_G = ['Mínimo', 'Normal', 'Alto'];

  /* Proyectos urbanos que puede lanzar un alcalde: coste (deuda en puntos), semanas, efecto y apoyo político. */
  const PROYECTOS = {
    vivienda: { nombre: 'Plan de vivienda pública', icono: '🏠', area: 'urb', ind: 'vivienda', ef: 14, coste: 9, sem: 26, desc: 'Promociones municipales de vivienda asequible.', ter: -25 },
    peatonal: { nombre: 'Peatonalización y carriles bici', icono: '🚲', area: 'mov', ind: 'movilidad', ef: 9, coste: 4, sem: 14, desc: 'Reordena el tráfico del centro; protestas iniciales del comercio.', molestia: 2.5, eco: -15 },
    tranvia: { nombre: 'Tranvía / nuevas líneas de autobús', icono: '🚋', area: 'mov', ind: 'movilidad', ef: 15, coste: 11, sem: 40, desc: 'Gran obra de transporte público.' },
    policia: { nombre: 'Refuerzo de la Policía Local', icono: '🚓', area: 'seg', ind: 'seguridad', ef: 11, coste: 5, sem: 12, desc: 'Más agentes y comisarías de barrio.', soc: 20 },
    limpieza: { nombre: 'Plan de limpieza y alumbrado', icono: '🧹', area: 'ser', ind: 'limpieza', ef: 12, coste: 4, sem: 10, desc: 'Contratas de limpieza, alumbrado LED y mantenimiento.' },
    empleo: { nombre: 'Plan de empleo local y polígonos', icono: '🧰', area: 'soc', ind: 'empleo', ef: 12, coste: 6, sem: 20, desc: 'Formación, ayudas a pymes y suelo industrial.', eco: -10 },
    congresos: { nombre: 'Palacio de congresos y gran evento', icono: '🎪', area: 'cul', ind: 'cultura', ef: 14, coste: 10, sem: 36, desc: 'Atrae turismo y prestigio, pero endeuda.' },
    ecotasa: { nombre: 'Ecotasa turística y límite de pisos turísticos', icono: '🧳', area: 'urb', ind: 'vivienda', ef: 8, coste: -3, sem: 8, desc: 'Ingresa dinero y alivia la presión sobre la vivienda; enfada al sector.', eco: -25, molestia: 1.5 }
  };

  Object.assign(Mu, {
    AREAS, IND, NOM_G, PROYECTOS,

    initAyto(E) {
      const M = E.esp.muni.m;
      for (const id in M) {
        const m = M[id], grande = m.pob > 600;
        m.ind = { vivienda: clamp(U.gauss(grande ? 40 : 52, 9), 15, 85), movilidad: clamp(U.gauss(grande ? 55 : 48, 10), 15, 85), seguridad: clamp(U.gauss(grande ? 45 : 55, 9), 15, 85), limpieza: clamp(U.gauss(50, 10), 15, 85), empleo: clamp(U.gauss(50, 10), 15, 85), cultura: clamp(U.gauss(grande ? 62 : 50, 10), 15, 90) };
        m.gasto = {}; AREAS.forEach(a => m.gasto[a] = 1);
        m.ibi = 0; m.proyectos = []; m.shock = {}; m.pleno = []; m.fondos = 0;
        m.conc = {}; Mu.repartirConc(E, id);
      }
    },

    /* Reparte las concejalías de gobierno entre los partidos del gobierno municipal. */
    repartirConc(E, id) {
      const m = E.esp.muni.m[id], J = E.jugador, keep = J && J.muni === id && J.areaMuni;
      m.conc = {};
      const coal = m.coal.length ? m.coal : [m.alcalde], esc = m.esc;
      const peso = {}, cuota = {}; let tp = 0; coal.forEach(k => { peso[k] = Math.pow(esc[k] || 1, 0.75); tp += peso[k]; });
      const areas = Object.keys(D().concejalias).sort((a, b) => D().concejalias[b].peso - D().concejalias[a].peso);
      coal.forEach(k => cuota[k] = peso[k] / tp * areas.length);
      areas.forEach(a => {
        // El alcalde se queda con Hacienda y Presidencia si gobierna en solitario
        const k = a === 'hac' ? m.alcalde : coal.slice().sort((x, y) => cuota[y] - cuota[x])[0]; cuota[k] -= 1;
        m.conc[a] = C.Gabinete.nueva(E, { region: m.ccaa, partido: k, esp: C.Gabinete.cargos(E, 'muni:' + id).find(x => x.id === a).esp });
      });
      if (keep && m.conc[keep] && coal.includes(J.partido)) m.conc[keep] = 'J';
    },

    /* Votación del pleno: ¿sale adelante una propuesta del alcalde? */
    pleno(E, id, asunto, ideo) {
      const m = E.esp.muni.m[id], tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1;
      const gob = U.suma(m.coal.map(k => m.esc[k] || 0));
      let ok, txt;
      if (gob >= may) { ok = U.chance(0.94); txt = ok ? 'El pleno aprueba con la mayoría del gobierno.' : 'Un sector del gobierno se rebela y el pleno la tumba.'; }
      else {
        let apoyo = gob;
        for (const k of Object.keys(m.esc)) { if (m.coal.includes(k)) continue; const pa = E.partidos[k], aff = 1 - U.distIdeo(E.partidos[m.alcalde], pa); if (U.chance(aff * 0.8)) apoyo += m.esc[k]; }
        ok = apoyo >= may; txt = ok ? 'La oposición permite que salga adelante.' : 'No logra mayoría en el pleno.';
      }
      m.pleno.unshift({ t: E.fecha.t, asunto, ok, txt }); if (m.pleno.length > 12) m.pleno.length = 12;
      if (!ok) { m.aprob = clamp(m.aprob - 0.8, 10, 90); }
      return { ok, txt };
    },

    setGasto(E, id, area, nivel) {
      const m = E.esp.muni.m[id]; if (!AREAS.includes(area)) return { ok: false, msg: 'Área desconocida' };
      if (m.gasto[area] === nivel) return { ok: false, msg: 'Ya está en ese nivel' };
      const r = Mu.pleno(E, id, `Presupuesto: gasto ${NOM_G[nivel].toLowerCase()} en ${D().concejalias[area].nombre}`);
      if (!r.ok) return { ok: true, exito: false, msg: r.txt };
      m.gasto[area] = nivel; return { ok: true, msg: `Presupuesto aprobado: gasto ${NOM_G[nivel].toLowerCase()} en ${D().concejalias[area].nombre}.` };
    },
    setIbi(E, id, d) {
      const m = E.esp.muni.m[id], nuevo = clamp(m.ibi + d, -2, 2); if (nuevo === m.ibi) return { ok: false, msg: 'Ya estás en el límite' };
      const r = Mu.pleno(E, id, d > 0 ? 'Subida del IBI y tasas' : 'Rebaja del IBI y tasas');
      if (!r.ok) return { ok: true, exito: false, msg: r.txt };
      m.ibi = nuevo; return { ok: true, msg: d > 0 ? 'El pleno aprueba subir el IBI y las tasas.' : 'El pleno aprueba rebajar el IBI.' };
    },
    lanzarProyecto(E, id, pid) {
      const m = E.esp.muni.m[id], pr = PROYECTOS[pid]; if (!pr) return { ok: false, msg: 'Proyecto desconocido' };
      if (m.proyectos.some(x => x.id === pid)) return { ok: false, msg: 'Ya está en marcha' };
      if (m.proyectos.length >= 2) return { ok: false, msg: 'Ya hay dos grandes obras en marcha' };
      const r = Mu.pleno(E, id, pr.nombre); if (!r.ok) return { ok: true, exito: false, msg: r.txt };
      m.proyectos.push({ id: pid, t0: E.fecha.t, fin: E.fecha.t + pr.sem });
      m.deuda = clamp(m.deuda + pr.coste * (m.fondos > 0 ? 0.6 : 1), 3, 170); if (pr.molestia) m.aprob = clamp(m.aprob - pr.molestia, 10, 90);
      m.fondos = Math.max(0, m.fondos - 1);
      C.Noticias.poner(E, 'local', `${m.nombre}: arranca «${pr.nombre}».`, 'ES');
      return { ok: true, msg: `Arranca «${pr.nombre}» (${pr.sem} semanas).` };
    },
    /* El alcalde pide fondos a la comunidad, al Estado o a la UE. */
    pedirFondos(E, id, quien) {
      const m = E.esp.muni.m[id], g = E.paises.ES.gob, rc = E.esp.ccaa[m.ccaa], pa = m.alcalde;
      let afin = 0;
      if (quien === 'ccaa') afin = rc.gob ? (rc.gob.coalicion.includes(pa) ? 0.28 : 0.12 - U.distIdeo(E.partidos[pa], E.partidos[rc.gob.partido]) * 0.3) : 0;
      else if (quien === 'estado') afin = g.coalicion.includes(pa) ? 0.28 : (g.apoyoExterno || []).includes(pa) ? 0.15 : 0.02 - U.distIdeo(E.partidos[pa], E.partidos[g.partido]) * 0.2;
      else afin = 0.06 + (E.jugador ? E.jugador.capEU / 400 : 0);
      const p = clamp(0.28 + afin + (m.aprob - 50) / 300, 0.06, 0.85);
      if (U.chance(p)) { m.fondos += 1; m.deuda = clamp(m.deuda - 3, 3, 170); return { ok: true, msg: quien === 'ccaa' ? 'La comunidad concede una subvención.' : quien === 'estado' ? 'El Estado destina fondos a tu ciudad.' : 'Bruselas aprueba fondos urbanos.', p }; }
      return { ok: true, exito: false, msg: 'La petición de fondos queda sin respuesta.', p };
    },
    probFondos(E, id, quien) { return null; },

    /* Dinámica semanal de una ciudad. */
    dinamica(E, m) {
      const clima = C.Economia.clima(E, 'ES');
      // Indicadores: tienden a un objetivo según gasto, concejal competente y shocks
      let suma = 0;
      for (const a of AREAS) {
        const ind = IND[a], per = m.conc && C.Gabinete.persona(E, 'muni:' + m.id, a), cargo = C.Gabinete.cargos(E, 'muni:' + m.id).find(x => x.id === a);
        const r = per ? C.Gabinete.rend(E, cargo, per) : 50;
        const obj = 50 + (m.gasto[a] - 1) * 13 + (r - 50) * 0.3 + (m.shock[ind] || 0) + (ind === 'empleo' ? 3 * clima : 0) + (ind === 'vivienda' ? -m.pob / 400 : 0);
        m.ind[ind] = clamp(m.ind[ind] + (obj - m.ind[ind]) * 0.03 + U.gauss(0, 0.35), 5, 98); suma += m.ind[ind] - 50;
        if (m.shock[ind]) m.shock[ind] *= 0.97;
      }
      // Presupuesto y deuda
      const gastoTotal = U.suma(AREAS.map(a => m.gasto[a] - 1));
      const hac = m.conc && C.Gabinete.persona(E, 'muni:' + m.id, 'hac'), rh = hac ? C.Gabinete.rend(E, C.Gabinete.cargos(E, 'muni:' + m.id).find(x => x.id === 'hac'), hac) : 50;
      m.deuda = clamp(m.deuda + gastoTotal * 0.012 - m.ibi * 0.03 - (rh - 50) * 0.0015 + 0.002 * (m.deuda > 90 ? 1 : -0.5), 3, 170);
      // Proyectos en marcha
      m.proyectos = m.proyectos.filter(p => {
        if (E.fecha.t < p.fin) return true;
        const pr = PROYECTOS[p.id]; m.shock[pr.ind] = (m.shock[pr.ind] || 0) + pr.ef; m.aprob = clamp(m.aprob + 1.8, 10, 90);
        C.Noticias.poner(E, 'local', `${m.nombre}: concluye «${pr.nombre}».`, 'ES');
        if (E.jugador && E.jugador.muni === m.id) C.Personaje.log(E, `Se inaugura «${pr.nombre}» en ${m.nombre}.`);
        return false;
      });
      // Aprobación
      const ajuste = U.suma(Object.values(m.pleno).slice(0, 3).map(x => x.ok ? 0 : -1)) * 0.0;
      const obj = 50 + suma / AREAS.length * 0.5 - m.ibi * 2.4 - Math.max(0, m.deuda - 85) * 0.15 + 3 * clima + ajuste;
      m.aprob = clamp(m.aprob + (obj - m.aprob) * 0.025 + U.gauss(0, 0.3), 10, 90);
      m.tension = clamp(m.tension + U.gauss(0, 0.8) + (m.ind.vivienda < 40 ? 0.1 : -0.05) + (m.ind.seguridad < 40 ? 0.1 : -0.05), 0, 100);
      // Choques locales aleatorios
      if (U.chance(0.0012)) { const k = U.pick(AREAS), d = U.pick([-10, -7, 6, 8]); m.shock[IND[k]] = (m.shock[IND[k]] || 0) + d; if (m.pob >= 190) C.Noticias.poner(E, 'local', `${m.nombre}: ${d < 0 ? 'problemas en ' : 'mejora en '}${D().concejalias[k].nombre.toLowerCase()}.`, 'ES'); }
      // Moción de censura local (coaliciones frágiles)
      if (m.pm !== 'J' && m.coal.length > 1 && m.aprob < 44 && U.chance(0.003) && E.fecha.t - (m.ultMocion || -99) > 60) Mu.mocionIA(E, m.id);
    },

    mocionIA(E, id) {
      const m = E.esp.muni.m[id]; m.ultMocion = E.fecha.t;
      const tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1, Ej = C.Ejecutivo;
      const ps = Object.keys(m.esc).sort((a, b) => m.esc[b] - m.esc[a]);
      for (const cand of ps.slice(0, 3)) {
        if (cand === m.alcalde) continue;
        const bloque = [cand]; let s = m.esc[cand];
        for (const x of ps.filter(p => p !== cand).map(p => ({ p, aff: Ej.afinidad(E, cand, p) })).sort((a, b) => b.aff - a.aff)) { if (s >= may) break; if (bloque.some(q => Ej.vetaA(E, x.p, q) || Ej.vetaA(E, q, x.p)) || x.aff < 0.3) continue; bloque.push(x.p); s += m.esc[x.p]; }
        if (s >= may && !bloque.every(k => m.coal.includes(k))) {
          if (m.pm === 'J') return false;
          if (m.pm && E.politicos[m.pm]) delete E.politicos[m.pm];
          m.alcalde = cand; m.coal = bloque; m.pm = null; Mu.elegirAlcalde(E, id, true);   // reutiliza la creación del alcalde
          m.alcalde = cand; m.coal = bloque; Mu.repartirConc(E, id);
          C.Noticias.poner(E, 'local', `${m.nombre}: prospera una moción de censura y ${E.partidos[cand].sigla} se hace con la alcaldía.`, 'ES');
          return true;
        }
      }
      return false;
    },

    /* Moción de censura del jugador (líder de la oposición local). */
    mocionJugador(E, id) {
      const m = E.esp.muni.m[id], J = E.jugador, tot = U.suma(Object.values(m.esc)), may = Math.floor(tot / 2) + 1, Ej = C.Ejecutivo; m.ultMocion = E.fecha.t;
      const cand = J.partido, ps = Object.keys(m.esc), bloque = [cand]; let s = m.esc[cand] || 0;
      for (const x of ps.filter(p => p !== cand).map(p => ({ p, aff: Ej.afinidad(E, cand, p) })).sort((a, b) => b.aff - a.aff)) { if (s >= may) break; if (bloque.some(q => Ej.vetaA(E, x.p, q) || Ej.vetaA(E, q, x.p)) || x.aff < 0.3) continue; bloque.push(x.p); s += m.esc[x.p]; }
      if (s < may) return { ok: false, s, may };
      if (m.pm && m.pm !== 'J' && E.politicos[m.pm]) delete E.politicos[m.pm];
      m.alcalde = cand; m.coal = bloque; m.pm = 'J'; E.politicos.J.cargo = 'alcalde';
      Mu.repartirConc(E, id); J.concejal = true; C.Personaje.sincronizar(E);
      C.Noticias.poner(E, 'local', `${m.nombre}: ${J.nombre} (${E.partidos[cand].sigla}) logra la alcaldía con una moción de censura.`, 'ES');
      return { ok: true, s, may };
    },

    indicesTxt(E, m) { return Object.keys(D().indicadoresUrbanos).map(k => ({ k, nombre: D().indicadoresUrbanos[k], v: m.ind[k] })); }
  });

  /* El turno municipal usa la dinámica nueva y el gabinete local */
  C.Gabinete.turnoMuni = function (E) {};
})(window.ESP);

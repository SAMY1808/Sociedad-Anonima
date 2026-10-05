/* Leyes según tu nivel: proposiciones de ley en el Parlamento autonómico (diputado/a autonómico/a) y mociones al pleno municipal (concejal/a).
   Amplía C.Territorio y C.Municipios y registra las acciones correspondientes. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio, Mu = C.Municipios, clamp = U.clamp;
  const afin = (E, a, b) => 1 - U.distIdeo(E.partidos[a], E.partidos[b]);

  Object.assign(T, {
    /* Leyes autonómicas que se pueden presentar: los programas de tipo «ley» de las áreas con competencias. */
    leyesDisponibles(E, c) {
      const out = [];
      for (const a in D().programas) for (const p of D().programas[a]) if (p.tipo === 'ley') out.push(p);
      return out.filter(p => T.nivelArea(E, c, p.area) >= 0.45 || ['pre', 'eco'].includes(p.area));
    },

    /* Proyección del voto en el Parlamento autonómico para una ley presentada por un partido. */
    votoLeyAut(E, c, prog, pid) {
      const rc = E.esp.ccaa[c], esc = rc.parl.escanos, g = rc.gob;
      const tot = U.suma(Object.values(esc)), may = Math.floor(tot / 2) + 1;
      let si = 0, no = 0, abs = 0;
      for (const k in esc) {
        const a = k === pid ? 1 : afin(E, pid, k), gob = g && g.coalicion.includes(k);
        const ap = clamp(a * 1.15 - 0.12 + (gob ? 0.08 : 0) + (prog.aprob > 0.5 ? 0.04 : 0), 0, 1);
        if (ap >= 0.62) si += esc[k]; else if (ap >= 0.4) abs += esc[k]; else no += esc[k];
      }
      const p = clamp(0.3 + (si - no) / tot * 1.5 + (si >= may ? 0.2 : 0) + (g && g.coalicion.includes(pid) ? 0.1 : 0), 0.04, 0.95);
      return { si, no, abs, tot, may, p };
    },

    /* El jugador, diputado/a autonómico/a, registra una proposición de ley en el Parlamento de su comunidad. */
    proponerLeyAut(E, c, progId) {
      const rc = E.esp.ccaa[c], J = E.jugador, prog = T.programa(progId);
      if (!prog || prog.tipo !== 'ley') return { ok: false, msg: 'Ley desconocida' };
      T.asegurarAut(E, c);
      if (rc.pend.some(p => p.tipo === 'leyJ' && p.prog === progId) || rc.pend.some(p => p.tipo === 'prog' && p.prog === progId)) return { ok: false, msg: 'Esa ley ya está en tramitación.' };
      const v = T.votoLeyAut(E, c, prog, J.partido), id = 'L' + E.fecha.t + progId;
      rc.pend.push({ t: E.fecha.t + 3, tipo: 'leyJ', prog: progId, ok: U.chance(v.p), eff: 0.5 + 0.35 * Math.min(1, T.nivelArea(E, c, prog.area) / 1.5), id });
      T.registrarLey(E, c, { id, prog: progId, pid: J.partido, quien: J.nombre, jugador: true, estado: 'tramite', t0: E.fecha.t, v });
      return { ok: true, msg: `Registras la proposición «${prog.n}» (probabilidad de aprobación ≈ ${Math.round(v.p * 100)} %). Se votará en tres semanas.`, p: v.p };
    },
    resolverLeyJ(E, c, p) {
      const rc = E.esp.ccaa[c], prog = T.programa(p.prog), J = E.jugador, nom = D().ccaa[c].nombre;
      if (!prog) return;
      const ok = p.ok; T.cerrarLey(E, c, p.id, ok);
      if (ok) { T.aplicarPrograma(E, c, prog, p.eff * 0.8); C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} aprueba la proposición de ley de ${J.nombre} (${E.partidos[J.partido].sigla}): ${prog.n}.`, 'ES'); C.Personaje.log(E, `El Parlamento de ${nom} aprueba tu proposición: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: 3, pop: 1.5 }, true); }
      else { C.Noticias.poner(E, 'politica', `El Parlamento de ${nom} rechaza la proposición de ley de ${E.partidos[J.partido].sigla}: ${prog.n}.`, 'ES'); C.Personaje.log(E, `El Parlamento de ${nom} rechaza tu proposición: ${prog.n}.`); C.Personaje.cambiar(E, { prestigio: -1 }, true); }
    }
  });

  Object.assign(Mu, {
    /* Mociones que puede llevar un concejal al pleno: gasto, IBI o grandes proyectos. */
    mocionesDisponibles(E, id) {
      const m = E.esp.muni.m[id], out = [];
      for (const a of Mu.AREAS) if (m.gasto[a] < 2) out.push({ k: 'gasto+' + a, tipo: 'gasto', area: a, nivel: m.gasto[a] + 1, n: `Aumentar el gasto en ${D().concejalias[a].nombre}`, d: `De «${Mu.NOM_G[m.gasto[a]].toLowerCase()}» a «${Mu.NOM_G[m.gasto[a] + 1].toLowerCase()}». Mejora el indicador y sube la deuda.`, icono: D().concejalias[a].icono });
      if (m.ibi > -2) out.push({ k: 'ibi-', tipo: 'ibi', dir: -1, n: 'Rebajar el IBI y las tasas', d: 'Más aprobación a corto plazo; menos ingresos.', icono: '🧾' });
      if (m.ibi < 2) out.push({ k: 'ibi+', tipo: 'ibi', dir: 1, n: 'Subir el IBI y las tasas', d: 'Más recaudación y menos deuda; impopular.', icono: '🧾' });
      for (const k in Mu.PROYECTOS) { const p = Mu.PROYECTOS[k]; if (!m.proyectos.some(x => x.id === k)) out.push({ k: 'proy+' + k, tipo: 'proy', proy: k, n: p.nombre, d: p.desc, icono: p.icono }); }
      return out;
    },

    /* Probabilidad de que una moción prospere en el pleno según quién la presente. */
    probMocion(E, id, pid) {
      const m = E.esp.muni.m[id], esc = m.esc, tot = U.suma(Object.values(esc));
      let apoyo = 0;
      for (const k in esc) { const gob = m.coal.includes(k); const a = k === pid ? 1 : afin(E, pid, k); apoyo += esc[k] * clamp(a * 1.1 - 0.1 + (gob ? 0.06 : 0), 0, 1); }
      const p = clamp(0.4 + (apoyo / tot - 0.5) * 2.4 + (m.coal.includes(pid) ? 0.15 : 0), 0.05, 0.95);
      return { p, apoyo: Math.round(apoyo), tot };
    },

    /* El concejal (jugador) presenta una moción al pleno; si prospera, el gobierno municipal la aplica. */
    mocionConcejal(E, id, k) {
      const m = E.esp.muni.m[id], J = E.jugador, mo = Mu.mocionesDisponibles(E, id).find(x => x.k === k); if (!mo) return { ok: false, msg: 'Moción no disponible' };
      const pr = Mu.probMocion(E, id, J.partido), ok = U.chance(pr.p);
      m.pleno.unshift({ t: E.fecha.t, asunto: mo.n + ' (moción de ' + J.nombre + ')', ok, txt: ok ? 'El pleno la aprueba.' : 'El pleno la rechaza.' }); if (m.pleno.length > 12) m.pleno.length = 12;
      if (!ok) return { ok: true, exito: false, msg: `El pleno de ${m.nombre} rechaza tu moción «${mo.n}» (probabilidad ≈ ${Math.round(pr.p * 100)} %).` };
      if (mo.tipo === 'gasto') m.gasto[mo.area] = mo.nivel;
      else if (mo.tipo === 'ibi') m.ibi = clamp(m.ibi + mo.dir, -2, 2);
      else { const p = Mu.PROYECTOS[mo.proy]; m.proyectos.push({ id: mo.proy, t0: E.fecha.t, fin: E.fecha.t + p.sem }); m.deuda = clamp(m.deuda + p.coste * (m.fondos > 0 ? 0.6 : 1), 3, 170); if (p.molestia) m.aprob = clamp(m.aprob - p.molestia, 10, 90); m.fondos = Math.max(0, m.fondos - 1); C.Noticias.poner(E, 'local', `${m.nombre}: arranca «${p.nombre}», a propuesta de ${J.nombre}.`, 'ES'); }
      return { ok: true, msg: `El pleno de ${m.nombre} aprueba tu moción: ${mo.n}.` };
    }
  });

  const Pj = C.Personaje, A = (id, o) => C.Acciones.registrar(Object.assign({ id, costo: 1 }, o));
  A('proponer_ley_aut', {
    nombre: 'Proposición de ley autonómica', icono: '📜', costo: 2, grupo: 'autonomico',
    desc: 'Diputado/a autonómico/a: registra una ley para el Parlamento de tu comunidad. Prospera según el apoyo de los demás grupos.',
    disponible(E) { const J = E.jugador; if (!['dipauto', 'consejero', 'presauto'].includes(J.cargo)) return 'Sólo diputados/as autonómicos/as'; if (J.cargo === 'presauto') return 'Como presidente/a lleva las leyes al Parlamento desde tus programas'; if (J.cargo === 'consejero') return 'Como consejero/a lleva tus leyes al Consejo de Gobierno'; return true; },
    ejecutar(E, a) { const r = T.proponerLeyAut(E, E.jugador.region, a.prog); if (r.ok) Pj.cambiar(E, { prestigio: 0.6, pop: 0.3 }); return r; }
  });
  A('mocion_pleno', {
    nombre: 'Moción al pleno municipal', icono: '🏘️', costo: 1, grupo: 'local',
    desc: 'Concejal/a: presenta una moción (gasto, IBI o una gran obra) al pleno. Si prospera, el gobierno municipal la aplica.',
    disponible(E) { const J = E.jugador; if (J.cargo === 'alcalde') return 'Como alcalde/sa usa las acciones de gobierno municipal'; return J.cargo === 'concejal' && J.muni ? true : 'Necesitas ser concejal/a'; },
    ejecutar(E, a) { const r = Mu.mocionConcejal(E, E.jugador.muni, a.k); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 0.8, pop: 0.8 }); else if (r.exito === false) Pj.cambiar(E, { pop: -0.1 }); return r; }
  });
})(window.ESP);

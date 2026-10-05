/* Leyes según tu nivel: proposiciones de ley en el Parlamento autonómico (diputado/a autonómico/a) y mociones al pleno municipal (concejal/a).
   Amplía C.Territorio y C.Municipios y registra las acciones correspondientes. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio, Mu = C.Municipios, clamp = U.clamp;
  const afin = (E, a, b) => 1 - U.distIdeo(E.partidos[a], E.partidos[b]);

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
  const enParlAut = E => { const J = E.jugador; return J.region && T.jugadorEnParl(E, J.region) ? true : 'Necesitas ser diputado/a del Parlamento autonómico'; };
  A('cabildear_ley_aut', {
    nombre: 'Cabildear una ley autonómica', icono: '🤝', costo: 1, grupo: 'autonomico', desc: 'Negocia con un grupo del Parlamento autonómico para ganar o perder sus votos en una ley en trámite.',
    disponible: enParlAut,
    ejecutar(E, a) { const r = T.cabildearAut(E, E.jugador.region, a.ley, a.pid, a.lado); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 0.4 }); return r; }
  });
  A('intervenir_ley_aut', {
    nombre: 'Intervenir en el debate de una ley', icono: '🎤', costo: 1, grupo: 'autonomico', desc: 'Defiende o ataca una ley en la comisión o en el pleno: inclina el debate y te da notoriedad.',
    disponible: enParlAut,
    ejecutar(E, a) { return T.intervenirAut(E, E.jugador.region, a.ley); }
  });
  A('negociar_bloque_aut', {
    nombre: 'Negociar en bloque una ley', icono: '🧩', costo: 2, grupo: 'autonomico', desc: 'Ofrece contrapartidas (enmiendas, inversiones, cargos, favores) a varios grupos a la vez a cambio de sus votos.',
    disponible: enParlAut,
    ejecutar(E, a) { return T.negociarAut(E, E.jugador.region, a.ley, a.ofertas); }
  });
  A('mocion_pleno', {
    nombre: 'Moción al pleno municipal', icono: '🏘️', costo: 1, grupo: 'local',
    desc: 'Concejal/a: presenta una moción (gasto, IBI o una gran obra) al pleno. Si prospera, el gobierno municipal la aplica.',
    disponible(E) { const J = E.jugador; if (J.cargo === 'alcalde') return 'Como alcalde/sa usa las acciones de gobierno municipal'; return J.cargo === 'concejal' && J.muni ? true : 'Necesitas ser concejal/a'; },
    ejecutar(E, a) { const r = Mu.mocionConcejal(E, E.jugador.muni, a.k); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 0.8, pop: 0.8 }); else if (r.exito === false) Pj.cambiar(E, { pop: -0.1 }); return r; }
  });
})(window.ESP);

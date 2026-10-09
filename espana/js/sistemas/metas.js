/* Metas personales (elegibles, con bonus de prestigio) y crónica semanal estilo periódico.
   Estado: E.esp.metas = { id, t0, hechas:{id:t}, fallo }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const META = {
    pm: ['🏛', 'Llegar a La Moncloa', 'Presidir el Gobierno de España.', E => !!E.jugador.hitos.pm, 10],
    absoluta: ['🧮', 'Mayoría absoluta', 'Que tu partido tenga 176 escaños o más.', E => (E.paises.ES.escanos[E.jugador.partido] || 0) >= 176, 8],
    limpio: ['🧼', 'Manos limpias', 'Dos años seguidos sin un solo caso abierto contra tu partido.', E => E.esp.metas.limpioDesde != null && E.fecha.t - E.esp.metas.limpioDesde >= 104, 6],
    veterano: ['🏅', 'Veterano/a', 'Diez años en política.', E => E.fecha.t >= 520, 5],
    cgpj: ['⚖️', 'Renovar el CGPJ', 'Desbloquea la renovación del Consejo General del Poder Judicial.', E => !!(E.esp.just && E.esp.just.hitoCgpj), 6],
    nemesis: ['🥊', 'Vencer a tu némesis', 'Quedar por delante de tu gran rival en dos elecciones seguidas.', E => { const s = E.esp.nem; return !!(s && s.enfr.length >= 2 && s.enfr[0].gana && s.enfr[1].gana); }, 8],
    popular: ['❤️', 'El favorito del pueblo', 'Alcanzar 80 de popularidad personal.', E => E.jugador.pop >= 80, 6],
    leyes: ['📚', 'Legislador/a incansable', 'Cinco leyes tuyas aprobadas.', E => !!(E.esp.leg && E.esp.leg.logros.cinco_leyes), 5],
    respetado: ['⭐', 'Estadista', 'Alcanzar 90 de prestigio.', E => E.jugador.prestigio >= 90, 7]
  };
  const Mt = C.Metas = {
    META,
    asegurar(E) { if (!E.esp.metas) E.esp.metas = { id: null, t0: 0, hechas: {}, limpioDesde: null }; return E.esp.metas; },
    elegir(E, id) { const m = Mt.asegurar(E); if (!META[id] || m.hechas[id]) return { ok: false, msg: 'Meta no válida' }; m.id = id; m.t0 = E.fecha.t; return { ok: true, msg: 'Nueva meta: ' + META[id][1] }; },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim || E.meta.vistaPartido) return; const m = Mt.asegurar(E);
      const abiertos = C.Corrupcion ? C.Corrupcion.asegurar(E).casos.filter(c => c.pid === J.partido && c.fase !== 'cerrado').length : 0;
      if (abiertos) m.limpioDesde = null; else if (m.limpioDesde == null) m.limpioDesde = E.fecha.t;
      for (const k in META) if (!m.hechas[k]) { let ok = false; try { ok = !!META[k][3](E); } catch (e) { } if (ok) { m.hechas[k] = E.fecha.t; if (k === m.id || !m.id) { C.Personaje.cambiar(E, { prestigio: META[k][4] }); C.Personaje.log(E, `🎯 Meta cumplida: ${META[k][1]} (+${META[k][4]} prestigio).`); C.Noticias.poner(E, 'politica', `${J.nombre} cumple su meta personal: ${META[k][1].toLowerCase()}.`, 'ES'); if (k === m.id) m.id = null; } } }
    },
    progreso(E, id) {
      const J = E.jugador, P = E.paises.ES, m = Mt.asegurar(E), r = (v, a) => clamp(v / a, 0, 1);
      switch (id) { case 'absoluta': return r(P.escanos[J.partido] || 0, 176); case 'veterano': return r(E.fecha.t, 520); case 'popular': return r(J.pop, 80); case 'respetado': return r(J.prestigio, 90); case 'limpio': return m.limpioDesde == null ? 0 : r(E.fecha.t - m.limpioDesde, 104); case 'nemesis': { const s = E.esp.nem; return s ? s.enfr.slice(0, 2).filter(x => x.gana).length / 2 : 0; } default: return META[id][3](E) ? 1 : 0; }
    }
  };
  /* Crónica semanal: portada con los hechos de las últimas semanas. */
  const Cr = C.Cronica = {
    edicion(E) {
      const J = E.jugador, t = E.fecha.t, ns = E.noticias.filter(n => (!n.pais || n.pais === 'ES' || n.tipo === 'europa')).slice(0, 12);
      const yo = ns.find(n => n.texto && n.texto.includes(J.nombre)), titular = yo || ns[0];
      const tn = C.Medios ? C.Medios.tendencias(E).slice(0, 3) : [];
      const gob = E.paises.ES.gob, pa = E.partidos[J.partido], dl = C.Dilemas ? C.Dilemas.asegurar(E) : null, nem = E.esp.nem && E.esp.nem.id ? E.politicos[E.esp.nem.id] : null;
      const tono = J.prestigio > 70 ? 'La figura de ' + J.nombre + ' se consolida como referencia incontestable.' : J.prestigio < 35 ? 'Crecen las dudas sobre el liderazgo de ' + J.nombre + '.' : J.nombre + ' mantiene el pulso sin grandes sobresaltos.';
      const extra = dl && dl.act.length ? ` Pendiente de una decisión delicada: «${C.Dilemas.CAT[dl.act[0].id].n.toLowerCase()}».` : '';
      const rival = nem ? ` En la oposición, ${nem.n} no da tregua.` : '';
      return { fecha: U.fmtT(t, true), titular: titular ? titular.texto : 'Semana sin grandes titulares.', resto: ns.filter(n => n !== titular).slice(0, 6), tendencias: tn, editorial: `${tono}${extra}${rival} El Gobierno (${E.partidos[gob.partido].sigla}) ${gob.estab < 45 ? 'cuenta con una estabilidad frágil' : 'resiste con relativa comodidad'}.` };
    }
  };
  C.Tiempo.registrar('metas', { turno: Mt.turno }, 82);
})(window.ESP);

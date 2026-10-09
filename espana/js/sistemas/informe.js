/* Informe de partida: resumen anónimo (sin nombres ni datos personales) pensado para compartir y ajustar el equilibrio del juego.
   Cuenta qué acciones, dilemas y crisis ocurren de verdad y en qué opciones se decide el jugador. Estado: E.meta.cnt = { acc, dil, op, cv, elec }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const sum = o => Object.values(o || {}).reduce((a, x) => a + x, 0);
  const top = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
  const redo = (x, d) => Math.round(x * Math.pow(10, d || 1)) / Math.pow(10, d || 1);
  const If = C.Informe = {
    cnt(E) { const m = E.meta; if (!m.cnt) m.cnt = { acc: {}, dil: {}, op: {}, cv: {}, elec: {} }; return m.cnt; },
    contar(E, grupo, clave) { if (!E || !E.jugador || E.meta.presim) return; const c = If.cnt(E)[grupo]; c[clave] = (c[clave] || 0) + 1; },
    /* Informe en forma de objeto: sólo números y códigos del juego. */
    generar(E) {
      const J = E.jugador, P = E.paises[J.pais], cn = If.cnt(E), t = E.fecha.t, anios = Math.max(0.1, t / 52), Aj = C.Ajustes ? C.Ajustes.get(E) : {};
      const r = { v: 1, semanas: t, anios: redo(anios), pais: J.pais, rol: J.rol || null, cargo: J.cargo || null, retirado: !!J.retirado, modo: E.meta.modoPartido ? 'partido' : E.meta.vistaPartido ? 'vista-partido' : 'carrera', escenario: E.meta.escenario || 'normal', ajustes: { dif: Aj.dif, eventos: Aj.eventos, crisis: Aj.crisis, rival: Aj.rival, jefe: Aj.jefe } };
      r.hitos = Object.keys(J.hitos || {});
      r.carrera = { puntos: C.Personaje.puntuacion ? C.Personaje.puntuacion(E) : null, prestigio: redo(J.prestigio), popularidad: redo(J.pop) };
      if (P && P.ec) r.economia = { paro: redo(P.ec.paro), crec: redo(P.ec.crec), infl: redo(P.ec.infl), deficit: redo(P.ec.deficit), deuda: redo(P.ec.deuda) };
      if (P && P.gob) r.gobierno = { aprob: Math.round(P.gob.aprob), estab: Math.round(P.gob.estab), propio: P.gob.partido === J.partido || (P.gob.coalicion || []).includes(J.partido), pm: P.gob.pm === 'J' };
      const pa = E.partidos[J.partido];
      if (pa && J.pais === 'ES') {
        r.partido = { id: /^ES_[A-Z0-9]+$/.test(J.partido) ? J.partido : 'propio', amb: pa.amb, apoyo: redo(pa.popN || pa.pop), escanos: P.escanos[J.partido] || 0, cohesion: Math.round(pa.cohesion), militantes: pa.militantes, finanzas: Math.round(pa.finanzas), lider: pa.lider === 'J' };
        if (C.Sede && C.Sede.activo(E)) { const s = C.Sede.asegurar(E), fb = C.Sede.fiabilidad(E), cv = C.Sede.coherenciaVoto(E); r.partido.programa = Object.keys(s.prog).length; r.partido.implantacion = Math.round(C.Sede.implMedia(E)); r.partido.deuda = Math.round(s.deuda); r.partido.fiabilidad = fb == null ? null : redo(fb, 2); r.partido.coherenciaVoto = cv == null ? null : redo(cv, 2); r.partido.equipo = Object.values(s.equipo).filter(Boolean).length; }
        if (C.Satelites) r.organizaciones = Object.fromEntries(Object.keys(C.Satelites.ORGS).map(k => [k, C.Satelites.nivel(E, k)]));
        if (C.Objetivos) { const o = C.Objetivos.asegurar(E), pp = C.Objetivos.puntuacion(E); r.objetivos = { cumplidos: Object.keys(o.hechos), fallidos: Object.keys(o.falladas), enCurso: o.act.map(x => x.id), puntosPartido: pp.pts, nota: pp.nota, semanasGobierno: o.semGob, picoEscanos: o.pico }; }
        if (C.Fusion) r.fusiones = C.Fusion.asegurar(E).hist.map(h => h.tipo + (h.jugador ? '*' : ''));
        if (C.PartidoInt) { const pi = C.PartidoInt.asegurar(E); r.congreso = { censo: pi.cong.censo || 'cerrado', presion: Math.round(pi.cong.presion || 0) }; }
      }
      r.saldoDilemas = C.Dilemas ? redo(C.Dilemas.libro(E).reduce((a, x) => a + x.score, 0)) : null;
      r.metas = C.Metas ? Object.keys(C.Metas.asegurar(E).hechas) : [];
      r.vida = C.Vida ? (v => ({ estres: Math.round(v.estres) }))(C.Vida.asegurar(E)) : null;
      r.acciones = { total: sum(cn.acc), porSemana: redo(sum(cn.acc) / Math.max(1, t), 2), top: Object.fromEntries(top(cn.acc, 12)) };
      r.dilemas = { total: sum(cn.dil), porAnio: redo(sum(cn.dil) / anios), tipos: cn.dil, opciones: cn.op };
      r.crisis = { total: sum(cn.cv), porAnio: redo(sum(cn.cv) / anios), ambitos: cn.cv };
      r.elecciones = cn.elec;
      r.diagnostico = If.diagnostico(r);
      return r;
    },
    /* Lecturas automáticas sobre el ritmo de la partida: pistas para ajustar el equilibrio, no verdades absolutas. */
    diagnostico(r) {
      const d = []; if (r.semanas < 40) { d.push('Partida muy corta (menos de un año): las cifras de ritmo aún no son representativas.'); return d; }
      if (r.acciones.porSemana < 0.5) d.push('Se usan pocas acciones por semana: quizá sobren puntos de agenda o falte algo atractivo que hacer.'); else if (r.acciones.porSemana > 3.5) d.push('Se gastan todos los puntos de agenda cada semana: quizá la agenda sea generosa.');
      if (r.dilemas.porAnio > 7) d.push('Muchos dilemas por año (' + r.dilemas.porAnio + '): puede resultar agobiante; considera bajar la «frecuencia de sucesos».'); else if (r.dilemas.porAnio < 1.2) d.push('Muy pocos dilemas (' + r.dilemas.porAnio + ' por año).');
      if (r.crisis.porAnio > 6) d.push('Muchas crisis en directo (' + r.crisis.porAnio + ' por año).'); else if (r.crisis.porAnio < 1) d.push('Pocas crisis en directo (' + r.crisis.porAnio + ' por año).');
      const ops = {}; for (const k in r.dilemas.opciones) { const [id] = k.split('/'); (ops[id] = ops[id] || []).push(r.dilemas.opciones[k]); }
      const rep = Object.keys(ops).filter(id => { const a = ops[id], n = sum(a); return n >= 4 && Math.max.apply(null, a) / n >= 0.85; }); if (rep.length) d.push('En estos dilemas casi siempre se elige la misma opción (señal de opción dominante): ' + rep.join(', ') + '.');
      if (r.partido) { if (r.partido.finanzas < 6) d.push('La caja del partido está en mínimos: las finanzas podrían estar muy ajustadas.'); else if (r.partido.finanzas > 90) d.push('La caja del partido está saturada: sobra dinero.'); if (r.partido.cohesion < 30) d.push('Cohesión del partido muy baja.'); if (r.partido.militantes < 3000) d.push('Militancia casi extinguida.'); }
      if (r.objetivos && r.objetivos.fallidos.length > r.objetivos.cumplidos.length + 1) d.push('Se fallan más objetivos de partido de los que se cumplen: quizá los plazos sean cortos.');
      if (r.carrera.puntos != null && r.carrera.puntos < 0) d.push('Puntuación de carrera negativa.');
      if (!d.length) d.push('Ritmo equilibrado: nada llama la atención.'); return d;
    },
    /* Texto legible para pegar en un mensaje. */
    texto(E) {
      const r = If.generar(E), L = [];
      L.push(`INFORME DE PARTIDA · Curul España · ${r.anios} años (${r.semanas} semanas)`);
      L.push(`Modo: ${r.modo} · rol ${r.rol || '—'} · cargo ${r.cargo || '—'} · escenario ${r.escenario}${r.retirado ? ' · carrera terminada' : ''}`);
      L.push(`Ajustes: dificultad ${r.ajustes.dif}, sucesos ×${r.ajustes.eventos}, crisis ×${r.ajustes.crisis}, némesis ×${r.ajustes.rival}, jefe ×${r.ajustes.jefe}`);
      L.push(`Carrera: ${r.carrera.puntos} pts · prestigio ${r.carrera.prestigio} · popularidad ${r.carrera.popularidad} · saldo de decisiones ${r.saldoDilemas}${r.hitos.length ? ' · hitos: ' + r.hitos.join(', ') : ''}`);
      if (r.economia) L.push(`Economía: paro ${r.economia.paro} % · crecimiento ${r.economia.crec} % · inflación ${r.economia.infl} % · déficit ${r.economia.deficit} % · deuda ${r.economia.deuda} %`);
      if (r.gobierno) L.push(`Gobierno: aprobación ${r.gobierno.aprob} · estabilidad ${r.gobierno.estab}${r.gobierno.propio ? ' · tu partido gobierna' : ''}${r.gobierno.pm ? ' · eres presidente/a' : ''}`);
      if (r.partido) L.push(`Partido (${r.partido.id}): apoyo ${r.partido.apoyo} % · ${r.partido.escanos} escaños · cohesión ${r.partido.cohesion} · ${r.partido.militantes} militantes · caja ${r.partido.finanzas}${r.partido.implantacion != null ? ' · implantación ' + r.partido.implantacion + ' · programa ' + r.partido.programa + '/' + C.DATA.programa.length + ' · fiabilidad ' + (r.partido.fiabilidad == null ? '—' : Math.round(r.partido.fiabilidad * 100) + ' %') : ''}`);
      if (r.objetivos) L.push(`Objetivos: ${r.objetivos.cumplidos.length} cumplidos, ${r.objetivos.fallidos.length} fallidos, ${r.objetivos.enCurso.length} en curso · puntuación de partido ${r.objetivos.puntosPartido} (nota ${r.objetivos.nota}) · ${redo(r.objetivos.semanasGobierno / 52)} años de gobierno · pico ${r.objetivos.picoEscanos} escaños`);
      if (r.organizaciones) L.push('Organizaciones: ' + Object.entries(r.organizaciones).map(([k, n]) => k + ' ' + n).join(' · '));
      L.push(`Acciones: ${r.acciones.total} (${r.acciones.porSemana}/semana). Más usadas: ${Object.entries(r.acciones.top).slice(0, 8).map(([k, n]) => k + ' ×' + n).join(', ') || '—'}`);
      L.push(`Dilemas: ${r.dilemas.total} (${r.dilemas.porAnio}/año) · Crisis en directo: ${r.crisis.total} (${r.crisis.porAnio}/año) · Elecciones: ${Object.entries(r.elecciones).map(([k, n]) => k + ' ×' + n).join(', ') || 'ninguna'}`);
      L.push('Lecturas: ' + r.diagnostico.join(' | '));
      return L.join('\n');
    },
    /* Código compacto (JSON) del informe, para pegarlo o guardarlo. */
    json(E) { return JSON.stringify(If.generar(E)); }
  };
  // Contadores: acciones (bus), decisiones de dilema, crisis en directo y elecciones.
  C.Bus.on('accion', d => { const E = C.E; if (E && d && d.id) If.contar(E, 'acc', d.id); });
  C.Bus.on('elecciones', d => { const E = C.E; if (E && d && (!d.pais || d.pais === 'ES')) If.contar(E, 'elec', d.tipo || (d.pais ? 'nacionales-' + d.pais : 'otras')); });
  if (C.Dilemas) {
    const d0 = C.Dilemas.decidir; C.Dilemas.decidir = function (E, uid, k) {
      const x = C.Dilemas.asegurar(E).act.find(y => y.uid === uid), r = d0.apply(this, arguments); try { if (x && r && r.ok) { If.contar(E, 'dil', x.id); If.contar(E, 'op', x.id + '/' + k); } } catch (e) { } return r;
    };
  }
  if (C.CrisisDirecto) { const c0 = C.CrisisDirecto.cerrar; C.CrisisDirecto.cerrar = function (E, cr) { const r = c0.apply(this, arguments); try { If.contar(E, 'cv', (cr.a || 'x') + (cr.jug ? '*' : '')); } catch (e) { } return r; }; }
})(window.ESP);

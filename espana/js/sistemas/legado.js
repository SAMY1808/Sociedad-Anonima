/* Legado: resumen semanal de lo que ha cambiado, estadísticas de la carrera, logros y epílogo. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA;
  const cuenta = E => Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && p.etapa === 'sancionada').length;
  const LOGROS = {
    primera_ley: ['📜', 'Legislador/a', 'Consigue que se apruebe una ley tuya.', E => cuenta(E) >= 1],
    cinco_leyes: ['📚', 'Hiperactivo/a legislativo/a', 'Cinco leyes tuyas aprobadas.', E => cuenta(E) >= 5],
    alcalde: ['🏘', 'Alcaldía', 'Llega a la alcaldía de un municipio.', E => E.jugador.hitos.alcalde],
    presauto: ['🗺', 'Barón/esa territorial', 'Preside una comunidad autónoma.', E => E.jugador.hitos.presauto],
    ministro: ['🦅', 'Ministro/a', 'Entra en el Consejo de Ministros.', E => E.jugador.hitos.ministro],
    pm: ['🏛', 'La Moncloa', 'Preside el Gobierno de España.', E => E.jugador.hitos.pm],
    lider: ['🎗', 'Líder', 'Toma las riendas de un partido.', E => E.jugador.hitos.lider],
    jefe: ['🧑‍💼', 'Mano derecha', 'Nombra un jefe de gabinete.', E => !!(E.esp.jefe && (E.esp.jefe.jefe || E.esp.jefe.log.length))],
    delegar: ['⚙️', 'Delegar para gobernar', 'Tu jefe de gabinete toma 25 decisiones.', E => E.esp.jefe && E.esp.jefe.log.length >= 25],
    pacto_social: ['🤝', 'Pacto social', 'Cierra tres acuerdos con sindicatos y patronal.', E => E.esp.social && E.esp.social.acuerdos.filter(a => a.tipo === 'acuerdo').length >= 3],
    crisis: ['🚨', 'Gestión de crisis', 'Cierra una crisis con buena nota.', E => E.esp.crisis && E.esp.crisis.hist.some(c => c.score < 0.35)],
    cgpj: ['⚖️', 'Reforma pendiente', 'Consigue renovar el CGPJ.', E => E.esp.just && E.esp.just.hitoCgpj],
    cuatro_anios: ['⏳', 'Superviviente', 'Cuatro años en política.', E => E.fecha.t >= 208],
    diez_anios: ['🏅', 'Veterano/a', 'Diez años en política.', E => E.fecha.t >= 520],
    prestigio: ['⭐', 'Figura respetada', 'Alcanza 80 de prestigio.', E => E.jugador.prestigio >= 80],
    popular: ['❤️', 'Popular', 'Alcanza 75 de popularidad.', E => E.jugador.pop >= 75]
  };
  const Lg = C.Legado = {
    LOGROS,
    asegurar(E) { if (!E.esp.leg) E.esp.leg = { snap: null, resumen: [], logros: {}, ser: [] }; const l = E.esp.leg; if (!E.jugador.hitos) E.jugador.hitos = {}; return l; },
    snap(E) { const J = E.jugador, P = E.paises.ES, pa = E.partidos[J.partido], ec = P.ec; return { pres: J.prestigio, pop: J.pop, pPop: pa.popN || pa.pop, esc: P.escanos[J.partido] || 0, aprob: P.gob ? P.gob.aprob : 0, paro: ec.paro, crec: ec.crec, deficit: ec.deficit, coh: pa.cohesion }; },
    hitos(E) { const J = E.jugador, h = J.hitos; for (const k of ['alcalde', 'presauto', 'ministro', 'pm']) if (J.cargo === k) h[k] = true; if (J.rol === 'lider') h.lider = true; },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const l = Lg.asegurar(E), n = Lg.snap(E), a = l.snap; Lg.hitos(E);
      if (E.esp.just && !E.esp.just.cgpj.caducado && E.esp.just.cgpj.desde > 0 && E.fecha.t - E.esp.just.cgpj.desde < 3) E.esp.just.hitoCgpj = true;
      if (a) {
        const L = [], d = (x, y) => n[x] - a[y || x], fl = (v, t = 0.3) => Math.abs(v) >= t;
        if (fl(d('pres'), 0.8)) L.push([d('pres') > 0 ? '⭐' : '📉', `Tu prestigio ${d('pres') > 0 ? 'sube' : 'baja'} ${U.d1(Math.abs(d('pres')))} puntos.`]);
        if (fl(d('pop'), 0.8)) L.push([d('pop') > 0 ? '❤️' : '💔', `Tu popularidad ${d('pop') > 0 ? 'sube' : 'baja'} ${U.d1(Math.abs(d('pop')))} puntos.`]);
        if (fl(d('pPop'), 0.25)) L.push(['🗳', `Tu partido ${d('pPop') > 0 ? 'gana' : 'pierde'} ${U.d1(Math.abs(d('pPop')))} puntos en intención de voto.`]);
        if (fl(d('aprob'), 0.8)) L.push(['🏛', `La aprobación del Gobierno ${d('aprob') > 0 ? 'mejora' : 'empeora'} ${U.d1(Math.abs(d('aprob')))} puntos.`]);
        if (fl(d('paro'), 0.1)) L.push(['👷', `El paro ${d('paro') > 0 ? 'sube' : 'baja'} a ${U.d1(n.paro)} %.`]);
        if (fl(d('coh'), 1)) L.push(['🎗', `La cohesión de tu partido ${d('coh') > 0 ? 'mejora' : 'se resiente'} (${Math.round(n.coh)}).`]);
        const hecho = J.agenda.hechas ? J.agenda.hechas.length : 0; if (hecho) L.push(['🎯', `Esta semana usaste ${hecho} acción(es) de agenda.`]);
        const jf = E.esp.jefe; if (jf && jf.log.length) { const rec = jf.log.filter(x => E.fecha.t - x.t <= 1); if (rec.length) L.push(['🧑‍💼', `Tu jefe/a de gabinete tomó ${rec.length} decisión(es).`]); }
        const cr = E.esp.crisis && E.esp.crisis.activas.filter(c => c.fase !== 'cerrada'); if (cr && cr.length) L.push(['🚨', `${cr.length} crisis activa(s).`]);
        l.resumen.unshift({ t: E.fecha.t, lineas: L }); if (l.resumen.length > 12) l.resumen.length = 12;
      }
      l.snap = n; if (E.fecha.t % 4 === 0) { l.ser.push([E.fecha.t, n.pres, n.pop, n.pPop]); if (l.ser.length > 400) l.ser.shift(); }
      for (const k in LOGROS) if (!l.logros[k]) { let ok = false; try { ok = !!LOGROS[k][3](E); } catch (e) { } if (ok) { l.logros[k] = E.fecha.t; if (!E.meta.presim) { C.Noticias.poner(E, 'politica', `Logro desbloqueado por ${J.nombre}: ${LOGROS[k][1]}.`, 'ES'); C.Personaje.log(E, `🏆 Logro: ${LOGROS[k][1]}`); } } }
    },
    stats(E) {
      const J = E.jugador, cs = E.esp.crisis ? E.esp.crisis.hist.length : 0;
      return [['Años en política', U.d1(E.fecha.t / 52)], ['Leyes aprobadas', cuenta(E)], ['Votaciones emitidas', E.votaciones.filter(v => v.miVoto).length], ['Decisiones de tu jefe/a', E.esp.jefe ? E.esp.jefe.log.length : 0], ['Acuerdos sociales', E.esp.social ? E.esp.social.acuerdos.filter(a => a.tipo === 'acuerdo').length : 0], ['Crisis vividas', cs], ['Causas judiciales', E.esp.just ? E.esp.just.causas.filter(c => c.quien === 'J').length : 0], ['Logros', Object.keys(Lg.asegurar(E).logros).length + ' / ' + Object.keys(LOGROS).length], ['Puntuación', C.Personaje.puntuacion(E)]];
    },
    epilogo(E) {
      const J = E.jugador, hit = J.hitos || {}, anios = E.fecha.t / 52, pa = E.partidos[J.partido], pts = C.Personaje.puntuacion(E);
      const cima = hit.pm ? 'llegó a presidir el Gobierno de España' : hit.presauto ? 'presidió una comunidad autónoma' : hit.ministro ? 'fue ministro/a' : hit.lider ? 'lideró su partido' : hit.alcalde ? 'fue alcalde/sa' : 'hizo carrera desde la base';
      const tono = pts > 600 ? 'Los manuales de historia política le dedicarán un capítulo.' : pts > 250 ? 'Dejará una huella reconocible en su partido y en las instituciones.' : 'Su paso por la política será recordado, sobre todo, por quienes trabajaron a su lado.';
      return `${J.nombre} lleva ${U.d1(anios)} años en política con ${pa.nombre}: ${cima}. ${tono} Puntuación actual: ${pts} puntos.`;
    }
  };
  C.Tiempo.registrar('legado', { turno: Lg.turno }, 80);
})(window.ESP);

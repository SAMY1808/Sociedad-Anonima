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
    nemesis_vence: ['🥊', 'Némesis derrotado', 'Supera a tu gran rival en dos elecciones seguidas.', E => { const s = E.esp.nem; return !!(s && s.enfr.length >= 2 && s.enfr[0].gana && s.enfr[1].gana); }],
    debate_estrella: ['📺', 'Estrella del debate', 'Gana con claridad un debate televisado.', E => !!(E.esp.dil && E.esp.dil.hist.some(h => h.tipo === 'debate' && h.score >= 3))],
    crisis_heroe: ['🦺', 'Sangre fría', 'Gestiona una crisis en directo con una valoración sobresaliente.', E => !!(E.esp.cv && E.esp.cv.hist.some(h => h.jug && h.V > 0.6))],
    crisis_tres: ['🚨', 'Bombero/a político/a', 'Gestiona tres crisis en directo.', E => !!(E.esp.cv && E.esp.cv.hist.filter(h => h.jug).length >= 3)],
    congreso_ganado: ['🎗', 'Dueño/a del partido', 'Gana un congreso de tu partido.', E => !!(E.esp.dil && E.esp.dil.hist.some(h => h.tipo === 'congreso' && h.score > 0))],
    saldo_20: ['📈', 'Buen olfato', 'Acumula un saldo de decisiones de +20.', E => !!(C.Dilemas && C.Dilemas.libro(E).reduce((a, x) => a + x.score, 0) >= 20)],
    baron_reconciliado: ['🕊️', 'Hijo pródigo', 'Reconcilia a un barón escindido.', E => !!(E.esp.bar && E.esp.bar.esc.some(x => x.cerrada))],
    presion_exito: ['📣', 'Elecciones ya', 'Consigue que el presidente convoque elecciones ante tu presión.', E => !!(E.esp.pres && E.esp.pres.exitos >= 1)],
    popular: ['❤️', 'Popular', 'Alcanza 75 de popularidad.', E => E.jugador.pop >= 75]
  };
  const Lg = C.Legado = {
    LOGROS,
    asegurar(E) { if (!E.esp.leg) E.esp.leg = { snap: null, resumen: [], logros: {}, ser: [] }; const l = E.esp.leg; if (!E.jugador.hitos) E.jugador.hitos = {}; return l; },
    snap(E) { const J = E.jugador, P = E.paises.ES, pa = E.partidos[J.partido], ec = P.ec; return { pres: J.prestigio, pop: J.pop, pPop: pa.popN || pa.pop, esc: P.escanos[J.partido] || 0, aprob: P.gob ? P.gob.aprob : 0, paro: ec.paro, crec: ec.crec, deficit: ec.deficit, coh: pa.cohesion }; },
    hitos(E) { const J = E.jugador, h = J.hitos; for (const k of ['alcalde', 'presauto', 'ministro', 'pm']) if (J.cargo === k) h[k] = true; if (J.rol === 'lider') h.lider = true; },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const l = Lg.asegurar(E), n = Lg.snap(E), a = l.snap; Lg.hitos(E); if (!l.leg || l.leg.n !== E.esp.cortes.legislatura) { if (l.leg) { l.legs = l.legs || []; const b = Lg.balance(E); l.legs.unshift({ n: l.leg.n, t1: E.fecha.t, nota: b.nota, pts: b.pts, ok: b.ok, tot: b.prom.length }); if (l.legs.length > 6) l.legs.length = 6; } Lg.nuevaLegislatura(E); }
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
    /* Promesas de legislatura: se fijan al empezar cada legislatura según tu ideología y se comprueban en vivo. */
    valor(E, k) {
      const P = E.paises.ES, ec = P.ec, J = E.jugador; if (k === 'paro') return ec.paro; if (k === 'deficit') return ec.deficit; if (k === 'aprob') return P.gob ? P.gob.aprob : 0; if (k === 'esc') return P.escanos[J.partido] || 0;
      if (k === 'cohesion') return E.partidos[J.partido].cohesion; if (C.Estructural) { const s = C.Estructural.asegurar(E); if (k === 'alquiler') return C.Estructural.esfuerzo(E); if (k === 'prima') return s.fin.prima; if (k === 'tension') return s.inm.tension; if (k === 'energia') return s.ener.precio; } return 0;
    },
    PROM: {
      paro: ['Bajar el paro por debajo del %V %', -1.6, 'bajo', 'paro'], deficit: ['Reducir el déficit al %V %', -1.0, 'bajo', 'deficit'], aprob: ['Mantener la aprobación del Gobierno sobre el %V %', 0, 'alto', 'aprob'], esc: ['Tener al menos %V escaños', 6, 'alto', 'esc'],
      cohesion: ['Cerrar las filas del partido (cohesión %V)', 6, 'alto', 'cohesion'], alquiler: ['Rebajar el esfuerzo del alquiler al %V %', -4, 'bajo', 'alquiler'], prima: ['Bajar la prima de riesgo de %V pb', -35, 'bajo', 'prima'], tension: ['Calmar la tensión migratoria (%V)', -8, 'bajo', 'tension'], energia: ['Abaratar la energía (%V)', -10, 'bajo', 'energia']
    },
    nuevaLegislatura(E) {
      const l = Lg.asegurar(E), J = E.jugador, pa = E.partidos[J.partido], izq = pa.eco < 0; const ks = izq ? ['alquiler', 'paro', 'aprob', 'tension', 'cohesion'] : ['deficit', 'paro', 'prima', 'esc', 'aprob']; const pick = ks.slice(0, 4);
      const snap = {}; Object.keys(Lg.PROM).forEach(k => snap[k] = Lg.valor(E, k));
      const pr = pick.map(k => { const d = Lg.PROM[k], v = snap[k]; let meta = Math.round((v + d[1]) * 10) / 10; if (k === 'aprob') meta = Math.max(45, Math.round(v)); return { k, txt: d[0].replace('%V', k === 'aprob' ? meta : U.d1(meta)), meta, ini: v, dir: d[2] }; });
      l.leg = { n: E.esp.cortes.legislatura, t0: E.fecha.t, snap, promesas: pr }; l.legs = l.legs || []; return l.leg;
    },
    cumplida(E, p) { const v = Lg.valor(E, p.k); return p.dir === 'bajo' ? v <= p.meta : v >= p.meta; },
    /* Balance: valores iniciales, actuales y efecto de tu política frente a lo que habría pasado sin ella. */
    balance(E) {
      const l = Lg.asegurar(E), lg = l.leg || Lg.nuevaLegislatura(E), ec = E.paises.ES.ec, rows = [];
      const fila = (k, n, ini, act, base, bien) => rows.push({ k, n, ini, act, base, bien: bien === 'bajo' ? act <= ini : act >= ini, efecto: base == null ? null : act - base, mejor: bien });
      fila('paro', 'Paro (%)', lg.snap.paro, ec.paro, ec.base ? ec.base.paro : null, 'bajo'); fila('deficit', 'Déficit (% PIB)', lg.snap.deficit, ec.deficit, ec.base ? ec.base.deficit : null, 'bajo'); fila('aprob', 'Aprobación del Gobierno', lg.snap.aprob, Lg.valor(E, 'aprob'), null, 'alto'); fila('esc', 'Escaños de tu partido', lg.snap.esc, Lg.valor(E, 'esc'), null, 'alto');
      if (C.Estructural) { fila('alquiler', 'Esfuerzo del alquiler (%)', lg.snap.alquiler, Lg.valor(E, 'alquiler'), null, 'bajo'); fila('prima', 'Prima de riesgo (pb)', lg.snap.prima, Lg.valor(E, 'prima'), null, 'bajo'); }
      const prom = lg.promesas, ok = prom.filter(p => Lg.cumplida(E, p)).length, mejoras = rows.filter(r => r.bien).length, pts = ok / Math.max(1, prom.length) * 60 + mejoras / Math.max(1, rows.length) * 40, nota = pts >= 85 ? 'Sobresaliente' : pts >= 65 ? 'Notable' : pts >= 45 ? 'Aprobado' : pts >= 25 ? 'Suspenso' : 'Desastre';
      return { rows, prom, ok, nota, pts: Math.round(pts), lg };
    },
    stats(E) {
      const J = E.jugador, cs = E.esp.crisis ? E.esp.crisis.hist.length : 0;
      return [['Años en política', U.d1(E.fecha.t / 52)], ['Leyes aprobadas', cuenta(E)], ['Votaciones emitidas', E.votaciones.filter(v => v.miVoto).length], ['Decisiones de tu jefe/a', E.esp.jefe ? E.esp.jefe.log.length : 0], ['Acuerdos sociales', E.esp.social ? E.esp.social.acuerdos.filter(a => a.tipo === 'acuerdo').length : 0], ['Crisis vividas', cs], ['Causas judiciales', E.esp.just ? E.esp.just.causas.filter(c => c.quien === 'J').length : 0], ['Logros', Object.keys(Lg.asegurar(E).logros).length + ' / ' + Object.keys(LOGROS).length], ['Puntuación', C.Personaje.puntuacion(E)]];
    },
    epilogo(E) {
      const J = E.jugador, hit = J.hitos || {}, anios = E.fecha.t / 52, pa = E.partidos[J.partido], pts = C.Personaje.puntuacion(E);
      const cima = hit.pm ? 'llegó a presidir el Gobierno de España' : hit.presauto ? 'presidió una comunidad autónoma' : hit.ministro ? 'fue ministro/a' : hit.lider ? 'lideró su partido' : hit.alcalde ? 'fue alcalde/sa' : 'hizo carrera desde la base';
      const tono = pts > 600 ? 'Los manuales de historia política le dedicarán un capítulo.' : pts > 250 ? 'Dejará una huella reconocible en su partido y en las instituciones.' : 'Su paso por la política será recordado, sobre todo, por quienes trabajaron a su lado.';
      return `${J.nombre} lleva ${U.d1(anios)} años en política con ${pa.nombre}: ${cima}. ${tono} Puntuación actual: ${pts} puntos.${(() => { const m = C.Metas && C.Metas.asegurar(E), h = m ? Object.keys(m.hechas) : []; return h.length ? ' Metas cumplidas: ' + h.map(k => C.Metas.META[k][1]).join(', ') + '.' : ''; })()}`;
    }
  };
  C.Tiempo.registrar('legado', { turno: Lg.turno }, 80);
})(window.ESP);

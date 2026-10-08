/* Guía y asesor de carrera: sugerencias contextuales según tu situación y progreso de exploración. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const MAPA = [['agenda', '🎯', 'Agenda', 'Gasta tus puntos semanales en acciones.'], ['cortes', '🏛', 'Cortes Generales', 'Congreso, Senado, pactos y conferencia de presidentes.'], ['leyes', '📜', 'Leyes', 'Propón, tramita y reforma leyes.'], ['partido', '🎗', 'Mi partido', 'Cohesión, facciones y primarias.'], ['territorio', '🗺', 'Territorio', 'Comunidades, financiación y competencias.'], ['autogob', '🏛', 'Autogobierno', 'Competencias y reforma del Estatuto.'], ['parlaut', '🗺', 'Parlamento autonómico', 'Leyes y decretos-ley regionales.'], ['jefe', '🧑‍💼', 'Jefe de gabinete', 'Delega áreas para descongestionar la partida.'], ['medios', '📰', 'Medios y opinión', 'Prensa, bulos, tertulias y sondeos.'], ['justicia', '⚖️', 'Justicia', 'CGPJ, TC, Fiscal y causas.'], ['corrupcion', '🕵️', 'Corrupción y control', 'Casos, comisiones y reprobaciones.'], ['mayorias', '🧮', 'Mayorías y rivales', 'Quién puede derribar a quién.'], ['coaliciones', '📝', 'Acuerdos de gobierno', 'Cláusulas pendientes con los socios.'], ['estructural', '🗺', 'Problemas de país', 'Vivienda, finanzas, energía e inmigración.'], ['exterior', '🌍', 'Mundo', 'Relaciones exteriores y Europa por dentro.'], ['legado', '🏆', 'Legado', 'Resumen semanal, logros y balance.']];
  const Gd = C.Guia = {
    MAPA,
    progreso(E) { const v = E.ui.vis || {}; return { n: MAPA.filter(m => v[m[0]]).length, tot: MAPA.length, vistas: v }; },
    /* Sugerencias ordenadas por urgencia. Cada una: {ic, txt, ir:{pantalla, params}} */
    sugerencias(E) {
      const J = E.jugador, P = E.paises.ES, g = P.gob, out = [], add = (p, ic, txt, pantalla, params) => out.push({ p, ic, txt, ir: pantalla ? { pantalla, params } : null });
      if (J.pais !== 'ES') return out;
      if (J.agenda.puntos >= 3) add(5, '🎯', `Te quedan ${J.agenda.puntos} puntos de agenda esta semana: úsalos antes de avanzar.`, 'agenda');
      if (C.Jefe && C.Jefe.puede(E) === true && !C.Jefe.asegurar(E).jefe) add(3, '🧑‍💼', 'Puedes nombrar un jefe de gabinete que te descongestione la agenda.', 'jefe');
      if (C.Jefe && C.Jefe.asegurar(E).prop.length) add(6, '💡', `Tu jefe/a te propone ${C.Jefe.asegurar(E).prop.length} decisión(es).`, 'jefe');
      if (g.pm === 'J' && g.estab < 45) add(8, '⚠️', `Tu Gobierno es frágil (estabilidad ${Math.round(g.estab)}): reúne la comisión de seguimiento y cumple pactos.`, 'coaliciones');
      if (C.Coaliciones && g.pm === 'J' && E.esp.pactos.some(p => p.estado === 'pendiente' && p.limite - E.fecha.t < 10)) add(7, '📝', 'Hay cláusulas de pactos a punto de vencer.', 'coaliciones');
      if (C.Corrupcion && C.Corrupcion.suyos(E).length) add(9, '🕵️', 'Hay un caso judicial abierto en tu partido: decide cómo responder.', 'corrupcion');
      if (C.Crisis && C.Crisis.asegurar(E).activas.some(c => c.fase !== 'cerrada') && (g.pm === 'J' || J.cargo === 'presauto')) add(9, '🚨', 'Hay una crisis activa pendiente de tu respuesta.', 'crisis');
      if (C.Sede && C.Sede.activo(E) && C.Sede.peso(E) === true) { const sd = C.Sede.asegurar(E), np = Object.keys(sd.prog).length; if (np < 6) add(6, '📜', `Tu programa tiene sólo ${np}/${C.DATA.programa.length} áreas definidas: complétalo en la Sede.`, 'sede', { tab: 'programa' }); if (!Object.values(sd.equipo).some(Boolean)) add(5, '🧑‍💼', 'Tu partido no tiene equipo de dirección: ficha organización, campaña y comunicación.', 'sede', { tab: 'equipo' }); if (E.partidos[J.partido].finanzas < 15) add(8, '💶', 'La caja del partido está baja: microdonaciones o crédito.', 'sede', { tab: 'finanzas' }); }
      if (C.Dilemas && C.Dilemas.asegurar(E).act.length) add(9, '⏳', `Tienes ${C.Dilemas.asegurar(E).act.length} dilema(s) con plazo: decide antes de que caduquen.`, 'dilemas');
      if (C.Vida && C.Vida.asegurar(E).estres > 70) add(7, '❤️', 'Estás al límite de estrés: cuídate o te pasará factura.', 'dilemas');
      if (C.Presion && C.Presion.asegurar(E).nivel > 55 && g.pm !== 'J') add(6, '📣', 'La presión sobre el Gobierno es alta: es buen momento para apretar.', 'mayorias');
      if (C.Presion && C.Presion.asegurar(E).nivel > 55 && g.pm === 'J') add(8, '📣', 'La oposición presiona para adelantar elecciones.', 'mayorias');
      if (C.Campana && C.Campana.activa(E)) add(8, '📣', 'Estás en campaña electoral: revisa el tablero.', 'elecciones', { tab: 'campana' });
      if (C.Organismos && g.pm === 'J') { const o = C.Organismos.asegurar(E); const v = Object.keys(o.o).find(k => E.fecha.t - o.o[k].t0 >= C.Organismos.ORGS[k].mandato); if (v) add(4, '🏢', `Ha vencido el mandato en ${C.Organismos.ORGS[v].n}.`, 'organismos'); }
      if (C.Estructural) { const s = C.Estructural.asegurar(E); if (s.fin.crisis && g.pm === 'J') add(9, '🏦', `${s.fin.crisis.entidad} está en crisis.`, 'estructural', { tab: 'fin' }); if (s.fin.prima > 350) add(7, '📉', 'La prima de riesgo está disparada.', 'estructural'); }
      if (C.PartidoInt) { const c = C.PartidoInt.asegurar(E).cong; if (c.fase === 'precongreso' && J.rol !== 'base') add(6, '🏁', 'Se ha convocado el congreso de tu partido.', 'partido'); }
      if (J.cargo === 'presauto' && E.esp.ccaa[J.region] && C.Territorio.disuelto(E, J.region)) add(5, '🗺', 'El Parlamento de tu comunidad está disuelto: sólo puedes gobernar por decreto-ley.', 'parlaut', { tab: 'decretos' });
      if (E.esp.pendienteConvAut) add(10, '📑', 'Tienes una convalidación pendiente de voto.', 'parlaut');
      if (C.Referendos && C.Referendos.asegurar(E).act.some(r => r.estado === 'campana')) add(6, '🗳️', 'Hay una consulta en campaña.', 'referendos');
      const vis = E.ui.vis || {}; const nov = MAPA.filter(m => !vis[m[0]]); if (nov.length) add(1, '🧭', `Aún no has visitado ${nov.length} pestañas: empieza por «${nov[0][2]}».`, nov[0][0]);
      return out.sort((a, b) => b.p - a.p).slice(0, 8);
    }
  };
})(window.ESP);

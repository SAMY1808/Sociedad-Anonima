/* Motor de turnos: cada sistema registrado avanza en orden de prioridad. */
window.ESP = window.ESP || {};
(function (C) {
  const sistemas = [];
  C.Tiempo = {
    registrar(nombre, sistema, prioridad) {
      sistemas.push({ nombre, sistema, prioridad });
      sistemas.sort((a, b) => a.prioridad - b.prioridad);
    },
    sistemas: () => sistemas.map(s => s.nombre),
    /* Inicializa todos los sistemas sobre un estado nuevo (generación del mundo). */
    iniciarMundo(E) {
      for (const s of sistemas) if (s.sistema.init) s.sistema.init(E);
      for (const s of sistemas) if (s.sistema.postInit) s.sistema.postInit(E);
    },
    /* Avanza una semana. Devuelve false si algo bloquea (decisión pendiente, noche electoral…). */
    avanzar() {
      const E = C.E;
      if (C.Tiempo.bloqueo()) return false;
      E.fecha.t += 1;
      for (const s of sistemas) {
        if (!s.sistema.turno) continue;
        try { s.sistema.turno(E); } catch (e) { console.error('[Tiempo] fallo en', s.nombre, e); }
      }
      C.Bus.emit('turno', E.fecha.t);
      return true;
    },
    /* Un evento que exige decisión del jugador, o una noche electoral, detiene el avance múltiple. */
    bloqueo() {
      const E = C.E;
      if (E.eventos.pendientes.length) return 'evento';
      if (E.parl && E.parl.pendienteVoto && E.parl.pendienteVoto.length) return 'voto';
      if (E.esp && (E.esp.pendienteVotoAut || E.esp.pendienteConvAut)) return 'voto';
      if (E.esp && E.esp.pendienteDebate) return 'evento';
      if (E.esp && E.esp.pendienteCrisisV) return 'evento';
      if (E.esp && E.esp.pendienteCongreso) return 'evento';
      if (E.esp && E.esp.pendienteSesion) return 'investidura';
      if (E.ue && E.ue.pendiente && E.ue.pendiente.length) return 'ue';
      if (E.esp && (E.esp.pendienteInvestidura || E.esp.pendienteSocio || E.esp.pendienteInvAut)) return 'investidura';
      if (E.esp && E.esp.pendienteGabinete) return 'gabinete';
      if (E.esp && E.esp.gab && E.esp.gab.escandalo) return 'escandalo';
      if (E.esp && E.esp.consejo && E.jugador && E.paises.ES.gob && E.paises.ES.gob.pm === 'J' && E.esp.consejo.agenda.some(i => i.urgente)) return 'consejo';
      if (E.elecciones.nochePendiente) return 'noche';
      if (E.elecciones.presPendiente) return 'noche';
      if (E.elecciones.pePendiente) return 'noche';
      return null;
    }
  };
})(window.ESP);

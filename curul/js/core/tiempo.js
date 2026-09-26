/* Motor de turnos: cada sistema registrado avanza en orden de prioridad. */
window.CURUL = window.CURUL || {};
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
      if (E.elecciones.nochePendiente) return 'noche';
      return null;
    }
  };
})(window.CURUL);

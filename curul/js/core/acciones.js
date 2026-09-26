/* Registro de acciones del jugador. Cada sistema registra las suyas; la interfaz las lista.
   accion = { id, nombre, icono, costo (puntos de agenda), grupo, disponible(E, args) → true|'motivo',
              ejecutar(E, args) → { ok, msg } } */
window.CURUL = window.CURUL || {};
(function (C) {
  const reg = {};
  C.Acciones = {
    registrar(a) { reg[a.id] = a; },
    get: id => reg[id],
    lista: grupo => Object.values(reg).filter(a => !grupo || a.grupo === grupo),
    puede(id, args) {
      const a = reg[id], E = C.E; if (!a) return 'Acción desconocida';
      const costo = typeof a.costo === 'function' ? a.costo(E, args) : (a.costo || 0);
      if (E.jugador.agenda.puntos < costo) return 'Sin puntos de agenda esta semana';
      if (a.disponible) { const r = a.disponible(E, args || {}); if (r !== true) return r || 'No disponible'; }
      return true;
    },
    ejecutar(id, args) {
      const E = C.E, a = reg[id];
      const p = C.Acciones.puede(id, args);
      if (p !== true) return { ok: false, msg: p };
      const costo = typeof a.costo === 'function' ? a.costo(E, args) : (a.costo || 0);
      const r = a.ejecutar(E, args || {}) || { ok: true };
      if (r.ok !== false) {
        E.jugador.agenda.puntos -= costo;
        E.jugador.agenda.hechas.push({ t: E.fecha.t, id, txt: r.msg || a.nombre });
        C.Bus.emit('accion', { id, args, r });
      }
      return r;
    }
  };
})(window.CURUL);

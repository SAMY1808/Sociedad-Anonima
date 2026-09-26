/* Estado del mundo: creación vacía, versión de esquema y migraciones de partidas antiguas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const ESQUEMA = 1;
  C.VERSION = '0.1.0';

  C.Estado = {
    ESQUEMA,
    vacio(semilla, inicioISO) {
      return {
        meta: { esquema: ESQUEMA, version: C.VERSION, semilla, rng: semilla >>> 0, sigId: 0,
                inicio: inicioISO, creado: Date.now(), nombrePartida: '', dificultad: 'normal' },
        fecha: { t: 0 },
        jugador: null,
        politicos: {},
        partidos: {},
        deptos: {},
        congreso: {},
        proyectos: {},
        votaciones: [],
        gobierno: {},
        economia: {},
        presupuesto: {},
        opinion: {},
        elecciones: { historico: [], campana: null, proxima: null },
        medios: { lista: [], noticias: [] },
        eventos: { pendientes: [], historial: [] },
        agendaMundo: [],          // actividad del Congreso y del mundo (bitácora)
        series: {},
        ui: {}
      };
    },
    /* Añade campos que falten en partidas guardadas con esquemas anteriores. */
    migrar(E) {
      if (!E.meta) throw new Error('Partida inválida');
      const base = C.Estado.vacio(E.meta.semilla || 1, E.meta.inicio);
      for (const k of Object.keys(base)) if (E[k] === undefined) E[k] = base[k];
      // Partidas de la Fase 1 no traían presupuesto por sectores: se inicializa sobre la economía ya existente.
      if (C.Presupuesto && (!E.presupuesto || !E.presupuesto.vigente)) { const prev = C.E; C.E = E; C.Presupuesto.init(E); C.E = prev; }
      // Futuras migraciones: if (E.meta.esquema < 2) { … }
      E.meta.esquema = ESQUEMA;
      E.meta.version = C.VERSION;
      return E;
    }
  };
})(window.CURUL);

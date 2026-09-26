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
      // Futuras migraciones: if (E.meta.esquema < 2) { … }
      E.meta.esquema = ESQUEMA;
      E.meta.version = C.VERSION;
      return E;
    }
  };
})(window.CURUL);

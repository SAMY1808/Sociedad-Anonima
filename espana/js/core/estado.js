/* Estado del mundo: creación vacía, versión de esquema y migraciones de partidas antiguas. */
window.ESP = window.ESP || {};
(function (C) {
  const ESQUEMA = 2;
  C.VERSION = '0.1.0';

  C.Estado = {
    ESQUEMA,
    vacio(semilla, inicioISO) {
      return {
        meta: { esquema: ESQUEMA, version: C.VERSION, semilla, rng: semilla >>> 0, sigId: 0,
                inicio: inicioISO, creado: Date.now(), nombrePartida: '', dificultad: 'normal' },
        fecha: { t: 0 },
        jugador: null,
        paises: {},            // [id] → país: gobierno, economía, parlamento (escaños), próxima elección
        partidos: {},          // [id] → partido (de todos los países)
        politicos: {},         // diputados del país del jugador y líderes de todos los partidos
        parl: { miembros: [], mesa: {}, sesion: {} },   // parlamento detallado (país del jugador)
        proyectos: {},         // leyes nacionales
        votaciones: [],
        ue: { grupos: {}, pe: { escanos: {}, presidente: null }, comision: {}, consejo: {}, expedientes: {}, cumbres: [],
              presupuesto: {}, historico: [], mundo: {} },
        elecciones: { historico: [], nochePendiente: null },
        eventos: { pendientes: [], historial: [] },
        noticias: [],
        series: {},
        esp: {},               // España: provincias, comunidades, municipios, Cortes, Consejo de Ministros, pactos
        ui: {}
      };
    },
    migrar(E) {
      if (!E.meta) throw new Error('Partida inválida');
      const base = C.Estado.vacio(E.meta.semilla || 1, E.meta.inicio);
      for (const k of Object.keys(base)) if (E[k] === undefined) E[k] = base[k];
      E.meta.esquema = ESQUEMA;
      E.meta.version = C.VERSION;
      return E;
    }
  };
})(window.ESP);

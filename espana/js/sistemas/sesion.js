/* Sesión parlamentaria en directo: investidura y moción de censura con discursos, réplica y votación grupo a grupo.
   Si el jugador lidera un partido, Ejecutivo.votar / votarMocion se aplazan (E.esp.pendienteSesion) hasta que decida cómo afrontar la sesión. */
window.ESP = window.ESP || {};
(function (C) {
  const Se = C.Sesion = {
    involucra(E, cand, tipo) { const J = E.jugador; if (C.Tutor) C.Tutor.una(E, 'sesion'); return !!(J && J.pais === 'ES' && J.rol === 'lider' && J.electo !== false); },
    rol(E, ps) { const J = E.jugador; if (J.partido === ps.cand) return 'candidato'; if (ps.tipo === 'mocion' && E.paises.ES.gob.pm === 'J') return 'defensor'; return 'oposicion'; },
    /* Para pruebas y delegaciones: resuelve la sesión sin interacción. */
    resolverAuto(E, swing) { const ps = E.esp.pendienteSesion; if (!ps) return false; E.esp.pendienteSesion = null; E.esp.sesionHecha = true; E.esp.sesionSwing = swing || 0; if (ps.tipo === 'mocion') C.Ejecutivo.votarMocion(E); else C.Ejecutivo.votar(E); return true; }
  };
})(window.ESP);

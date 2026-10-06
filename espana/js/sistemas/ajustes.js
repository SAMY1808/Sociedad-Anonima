/* Ajustes de dificultad y ritmo: puntos de agenda, frecuencia de sucesos, ayuda del jefe de gabinete y casos de corrupción. Estado: E.meta.ajustes. */
window.ESP = window.ESP || {};
(function (C) {
  const DIF = { facil: { n: 'Fácil', azar: 0.7, bono: 1 }, normal: { n: 'Normal', azar: 1, bono: 0 }, dificil: { n: 'Difícil', azar: 1.4, bono: -1 } };
  const Aj = C.Ajustes = {
    DIF,
    get(E) { const m = E.meta; if (!m.ajustes) m.ajustes = { dif: 'normal', eventos: 1, jefe: 1, azar: 1 }; const a = m.ajustes; a.azar = DIF[a.dif] ? DIF[a.dif].azar : 1; return a; },
    bonoAgenda(E) { const a = Aj.get(E); return DIF[a.dif] ? DIF[a.dif].bono : 0; },
    fijar(E, k, v) {
      const a = Aj.get(E); if (k === 'dif' && DIF[v]) { a.dif = v; const J = E.jugador; if (J && C.Personaje.maxAgenda) { const mx = C.Personaje.maxAgenda(E); J.agenda.max = mx; J.agenda.puntos = Math.min(J.agenda.puntos, mx); } return true; }
      if (['eventos', 'jefe'].includes(k) && [0.5, 1, 1.5].includes(+v)) { a[k] = +v; return true; } return false;
    }
  };
})(window.ESP);

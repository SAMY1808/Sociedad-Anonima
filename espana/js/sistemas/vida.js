/* Vida personal: salud y estrés del jugador, bajas médicas, descanso y escándalos familiares.
   Estado: E.esp.vida = { salud, estres, baja, ult, hist[] }. El estrés recorta los puntos de agenda y empeora los debates. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const Vd = C.Vida = {
    asegurar(E) { if (!E.esp.vida) E.esp.vida = { salud: 88, estres: 25, baja: 0, ult: -99, cd: {}, hist: [] }; return E.esp.vida; },
    nota(E, txt) { const v = Vd.asegurar(E); v.hist.unshift({ t: E.fecha.t, txt }); if (v.hist.length > 15) v.hist.length = 15; },
    carga(E) {
      const J = E.jugador, c = ['pm'].includes(J.cargo) ? 0.2 : ['ministro', 'presauto', 'vicepres'].includes(J.cargo) ? 0.1 : 0; let x = 0.12 + c + (J.rol === 'lider' ? 0.06 : 0);
      if (C.Campana && C.Campana.activa(E)) x += 0.2; if (E.esp.crisis) x += E.esp.crisis.activas.filter(k => k.fase !== 'cerrada').length * 0.08; if (E.esp.cv) x += E.esp.cv.act.length * 0.15; if (C.Presion && C.Presion.esPM(E)) x += C.Presion.asegurar(E).nivel / 100 * 0.15; return x;
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim || J.retirado || E.meta.vistaPartido) return; const v = Vd.asegurar(E), t = E.fecha.t, aj = C.Ajustes ? C.Ajustes.get(E) : { eventos: 1 };
      if (v.estres > 60 && C.Tutor) C.Tutor.una(E, 'vida'); v.estres = clamp(v.estres + Vd.carga(E) - 0.24 - (v.baja > 0 ? 1.2 : 0), 0, 100);
      if (v.estres > 70) v.salud = clamp(v.salud - (v.estres - 70) / 100 * 0.7, 0, 100); else v.salud = clamp(v.salud + 0.09 + (v.baja > 0 ? 0.5 : 0), 0, 96);
      if (v.baja > 0) v.baja--;
      const Dl = C.Dilemas && C.Dilemas.asegurar(E); if (!Dl || Dl.act.length >= 2) return;
      if (v.estres > 62 && t - v.ult > 18 && !Dl.act.some(x => x.id === 'salud') && U.chance(0.018 * aj.eventos * (1 + (v.estres - 62) / 40))) { if (C.Dilemas.nuevo(E, 'salud')) v.ult = t; }
      else if (U.chance(0.004 * aj.eventos) && !Dl.act.some(x => x.id === 'familia')) C.Dilemas.nuevo(E, 'familia');
      else if (v.salud < 30 && t - v.ult > 10 && U.chance(0.05)) { v.ult = t; v.baja = 3; Vd.nota(E, 'Un ingreso hospitalario te obliga a parar tres semanas.'); C.Noticias.poner(E, 'politica', `${J.nombre} ingresa en el hospital por agotamiento.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.8 }, true); v.estres = clamp(v.estres - 25, 0, 100); v.salud = clamp(v.salud + 15, 0, 100); }
    },
    descansar(E) { const v = Vd.asegurar(E), crit = (C.Campana && C.Campana.activa(E)) || (E.esp.cv && E.esp.cv.act.length); v.estres = clamp(v.estres - 25, 0, 100); v.salud = clamp(v.salud + 6, 0, 100); v.cd.descansar = E.fecha.t; if (crit) { C.Personaje.cambiar(E, { prestigio: -1.5, pop: -0.6 }, true); Vd.nota(E, 'Te tomas unos días de descanso en plena crisis/campaña: te lo reprochan.'); return { ok: true, msg: 'Descansas, pero en mal momento: te lo echan en cara.' }; } Vd.nota(E, 'Unos días de descanso bien aprovechados.'); return { ok: true, msg: 'Descansas unos días: bajan el estrés y se recupera tu salud.' }; },
    cuidarte(E) { const v = Vd.asegurar(E); v.estres = clamp(v.estres - 8, 0, 100); v.salud = clamp(v.salud + 2, 0, 100); v.cd.cuidarte = E.fecha.t; return { ok: true, msg: 'Reservas un hueco para ti: algo menos de estrés.' }; },
    parar(E, sem) { const v = Vd.asegurar(E); v.baja = Math.max(v.baja, sem); v.estres = clamp(v.estres - 30, 0, 100); v.salud = clamp(v.salud + 12, 0, 100); }
  };
  // Con estrés alto o de baja, tienes menos puntos de agenda
  const m0 = C.Personaje.maxAgenda; C.Personaje.maxAgenda = function (E) { const base = m0.apply(this, arguments), v = E.esp && E.esp.vida; if (!v || E.jugador.pais !== 'ES') return base; return Math.max(2, base - (v.baja > 0 ? 2 : v.estres > 85 ? 1 : 0)); };
  const R = (id, nombre, icono, desc, costo, cd, f) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo: 'carrera', disponible: E => { if (E.jugador.pais !== 'ES') return 'Sólo en España'; const v = Vd.asegurar(E); return v.cd[id] != null && E.fecha.t - v.cd[id] < cd ? `Espera ${cd - (E.fecha.t - v.cd[id])} semana(s)` : true; }, ejecutar: f });
  R('descansar', 'Tomarte unas vacaciones', '🏖️', 'Bajas el estrés y recuperas salud, pero en plena crisis o campaña te lo reprochan.', 3, 10, E => Vd.descansar(E));
  R('cuidarte', 'Cuidarte esta semana', '🧘', 'Un hueco para ti: algo menos de estrés.', 1, 2, E => Vd.cuidarte(E));
  C.Tiempo.registrar('vida', { turno: Vd.turno }, 60);
})(window.ESP);

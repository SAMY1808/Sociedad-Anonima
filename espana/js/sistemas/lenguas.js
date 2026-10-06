/* Lenguas y símbolos: normalización lingüística, televisión autonómica y símbolos propios; reacción de las bases y del Estado.
   Estado: E.esp.len = { c:{uso, pres, tv, simb:{}} , hist }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = C.Territorio;
  const BASE = { CAT: [52, 60], VAL: [38, 42], BAL: [42, 48], PVA: [36, 52], GAL: [58, 50], NAV: [24, 30], ARA: [8, 12], AST: [14, 14], CAN: [0, 0] };
  const SIMBOLOS = { himno: ['Himno propio', '🎼'], bandera: ['Bandera en edificios públicos', '🚩'], fiesta: ['Día nacional de la comunidad', '🎉'], seleccion: ['Selecciones deportivas oficiales', '⚽'] };
  const Ln = C.Lenguas = {
    SIMBOLOS,
    ids() { return T.ids().filter(c => D().ccaa[c].lengua); },
    asegurar(E) {
      if (E.esp.len) return E.esp.len; const o = { r: {}, hist: [] };
      for (const c of Ln.ids()) { const b = BASE[c] || [22, 25]; o.r[c] = { uso: b[0] + U.ri(-3, 3), pres: b[1] + U.ri(-3, 3), tv: 30 + U.ri(0, 20), simb: {} }; }
      return E.esp.len = o;
    },
    nota(E, txt) { const l = Ln.asegurar(E); l.hist.unshift({ t: E.fecha.t, txt }); if (l.hist.length > 20) l.hist.length = 20; },
    gestor(E) { const J = E.jugador; return J.pais === 'ES' && ['presauto', 'consejero'].includes(J.cargo) && J.region && D().ccaa[J.region].lengua; },
    reaccion(E, c, f) { const rc = E.esp.ccaa[c]; for (const k of E.paises.ES.partidos) { const p = E.partidos[k]; if (p.amb === 'nac' && p.ter < -30) C.Opinion.empujeES(E, k, 0.004 * f); } rc.relM = clamp(rc.relM - 0.8 * f, 0, 100); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const l = Ln.asegurar(E), t = E.fecha.t;
      for (const c of Ln.ids()) { const x = l.r[c], rc = E.esp.ccaa[c]; x.uso = clamp(x.uso + (x.pres - x.uso) * 0.003 + (x.tv - 40) * 0.0004 + U.gauss(0, 0.04), 0, 100); x.tv = clamp(x.tv - 0.01, 0, 100);
        if (rc) rc.indep = clamp(rc.indep + (x.uso - 50) * 0.0003, 0, 100);
        if (!E.meta.presim && U.chance(0.002) && x.pres > 45) { const tc = E.esp.tc ? E.esp.tc.sesgo : 0; if (U.chance(0.45 - tc * 0.3)) { x.pres = clamp(x.pres - 4, 0, 100); rc.relM = clamp(rc.relM - 1.5, 0, 100); const m = `Los tribunales anulan parte de las cuotas lingüísticas en la escuela de ${D().ccaa[c].nombre}.`; C.Noticias.poner(E, 'justicia', m, 'ES'); Ln.nota(E, m); } } }
    },
    accion(E, k, a) {
      const c = E.jugador.region, l = Ln.asegurar(E), x = l.r[c], rc = E.esp.ccaa[c], J = E.jugador; if (!Ln.gestor(E) || !x) return { ok: false, msg: 'Sólo en una comunidad con lengua propia y un cargo de gobierno' };
      const o = (J.atrib.gestion + J.atrib.carisma) / 20;
      if (k === 'inmersion') { x.pres = clamp(x.pres + 5 + o * 3, 0, 100); x.uso = clamp(x.uso + 1.8, 0, 100); Ln.reaccion(E, c, 1.2); if (U.chance(0.25)) { x.pres = clamp(x.pres - 3, 0, 100); C.Noticias.poner(E, 'justicia', `Un tribunal recorta el modelo de inmersión de ${D().ccaa[c].nombre}.`, 'ES'); return { ok: true, exito: false, msg: 'Un tribunal recorta el modelo en cuanto lo aprueba tu Gobierno.' }; } Ln.nota(E, 'Refuerzas la lengua en la escuela.'); return { ok: true, msg: 'Refuerzas la presencia de la lengua propia en la escuela.' }; }
      if (k === 'ley') { const esc = rc.parl.escanos, tot = U.suma(Object.values(esc)), si = U.suma(Object.keys(esc).filter(p => rc.gob && rc.gob.coalicion.includes(p) || E.partidos[p].amb === 'reg').map(p => esc[p])); if (si < tot / 2) return { ok: true, exito: false, msg: 'La ley de normalización no reúne mayoría en el Parlamento.' }; x.uso = clamp(x.uso + 3, 0, 100); x.pres = clamp(x.pres + 4, 0, 100); Ln.reaccion(E, c, 1.5); Ln.nota(E, 'Ley de normalización lingüística aprobada.'); C.Noticias.poner(E, 'politica', `El Parlamento de ${D().ccaa[c].nombre} aprueba una ley de normalización lingüística.`, 'ES'); return { ok: true, msg: 'Ley de normalización aprobada.' }; }
      if (k === 'tv') { x.tv = clamp(x.tv + 12, 0, 100); rc.deuda = clamp(rc.deuda + 0.5, 3, 120); if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 0.6, 5, 90); Ln.nota(E, 'Inversión en la televisión autonómica.'); return { ok: true, msg: 'Inviertes en la televisión autonómica: más audiencia y más deuda.' }; }
      if (k === 'simbolo') { const s = SIMBOLOS[a.s]; if (!s) return { ok: false, msg: 'Elige un símbolo' }; if (x.simb[a.s]) return { ok: false, msg: 'Ya está adoptado' }; x.simb[a.s] = true; rc.indep = clamp(rc.indep + 0.4, 0, 100); Ln.reaccion(E, c, 1.8); C.Personaje.cambiar(E, { pop: 0.5 }); Ln.nota(E, `Adoptas: ${s[0]}.`); return { ok: true, msg: `${s[0]}: aplauden tus bases y protesta la oposición nacional.` }; }
      return { ok: false, msg: 'Medida desconocida' };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'autonomico', disponible: E => Ln.gestor(E) ? true : 'Sólo en una comunidad con lengua propia (presidente o consejero)' }, o));
  R({ id: 'inmersion_linguistica', nombre: 'Reforzar la lengua en la escuela', icono: '🏫', desc: 'Más horas y presencia de la lengua propia en la enseñanza; riesgo de recurso judicial.', ejecutar: E => Ln.accion(E, 'inmersion') });
  R({ id: 'ley_normalizacion', nombre: 'Ley de normalización lingüística', icono: '📖', costo: 2, desc: 'Una ley autonómica que blinda el uso de la lengua propia; necesita mayoría.', ejecutar: E => Ln.accion(E, 'ley') });
  R({ id: 'tv_autonomica', nombre: 'Invertir en la televisión autonómica', icono: '📺', desc: 'Sube la audiencia de la televisión pública autonómica a costa de deuda.', ejecutar: E => Ln.accion(E, 'tv') });
  R({ id: 'simbolo_regional', nombre: 'Adoptar un símbolo propio', icono: '🚩', desc: 'Himno, bandera, día nacional o selecciones: refuerzan la identidad y crispan a la oposición nacional.', ejecutar: (E, a) => Ln.accion(E, 'simbolo', a) });
  C.Tiempo.registrar('lenguas', { turno: Ln.turno }, 52);
})(window.ESP);

/* Poder local: socios del gobierno municipal, fondos europeos para ciudades y peso de los alcaldes en su partido.
   Estado: E.esp.pl = { conv:[], sat:{ muniId:{pid:n} }, ult }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, Ej = () => C.Ejecutivo;
  const CONV = [['Ciudades inteligentes y sensores', 4, 0.3], ['Rehabilitación energética de barrios', 8, 0.45], ['Movilidad sostenible y carriles bici', 6, 0.35], ['Regeneración urbana de un barrio vulnerable', 10, 0.55], ['Digitalización de los servicios municipales', 3, 0.2], ['Plan de agua y economía circular', 5, 0.4]];
  const Pl = C.PoderLocal = {
    asegurar(E) { if (!E.esp.pl) E.esp.pl = { conv: [], sat: {}, ult: -99 }; return E.esp.pl; },
    muni(E) { const J = E.jugador; return J && J.muni && E.esp.muni.m[J.muni] ? E.esp.muni.m[J.muni] : null; },
    alcaldes(E, pid) { return Object.values(E.esp.muni.m).filter(m => m.alcalde === pid).length; },
    sat(E, m, pid) { const s = Pl.asegurar(E); s.sat[m.id] = s.sat[m.id] || {}; if (s.sat[m.id][pid] == null) s.sat[m.id][pid] = Math.round(clamp(U.gauss(62, 10), 35, 85)); return s.sat[m.id][pid]; },
    cambiarSat(E, m, pid, d) { Pl.sat(E, m, pid); const s = Pl.asegurar(E); s.sat[m.id][pid] = clamp(s.sat[m.id][pid] + d, 0, 100); },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const s = Pl.asegurar(E), t = E.fecha.t, m = Pl.muni(E);
      s.conv = s.conv.filter(c => c.cierre > t && !c.resuelta);
      if (t - s.ult >= 26 || !s.conv.length && t - s.ult >= 8) { s.ult = t; const n = U.ri(2, 3); for (let i = 0; i < n; i++) { const d = U.pick(CONV); if (!s.conv.some(c => c.n === d[0])) s.conv.push({ id: U.id('fc'), n: d[0], importe: d[1], dif: d[2], cierre: t + 20, resuelta: false }); } }
      if (m && m.coal && m.coal.length > 1) for (const k of m.coal) if (k !== m.alcalde) { Pl.cambiarSat(E, m, k, (m.aprob - 50) * 0.004 + U.gauss(0, 0.15) - 0.03); if (Pl.sat(E, m, k) < 25 && m.pm === 'J' && U.chance(0.01) && m.coal.includes(k)) { m.aprob = clamp(m.aprob - 1, 10, 90); C.Noticias.poner(E, 'local', `${E.partidos[k].sigla} amenaza con romper el gobierno municipal de ${m.nombre}.`, 'ES'); } }
      if (m && m.pm === 'J' && m.aprob > 62 && C.PartidoInt) { const pi = C.PartidoInt.asegurar(E); pi.fac.barones = clamp(pi.fac.barones + 0.01, 8, 40); }
    },
    pacto(E, pid) {
      const m = Pl.muni(E), J = E.jugador; if (!m || m.pm !== 'J') return { ok: false, msg: 'Sólo el alcalde pacta el gobierno municipal' }; if (!m.esc[pid] || m.coal.includes(pid)) return { ok: false, msg: 'Ese partido no puede incorporarse' };
      const aff = Ej().afinidad(E, m.alcalde, pid); if (!U.chance(clamp(aff * 0.8 + J.atrib.negociacion / 30, 0.1, 0.85))) { C.Personaje.cambiar(E, { prestigio: -0.4 }); return { ok: true, exito: false, msg: `${E.partidos[pid].sigla} rechaza entrar en tu gobierno.` }; }
      m.coal.push(pid); m.aprob = clamp(m.aprob + 0.5, 10, 90); Pl.sat(E, m, pid); C.Personaje.cambiar(E, { prestigio: 0.8 }); C.Noticias.poner(E, 'local', `${E.partidos[pid].sigla} entra en el gobierno municipal de ${m.nombre}.`, 'ES'); return { ok: true, msg: `${E.partidos[pid].sigla} se une al gobierno de ${m.nombre}.` };
    },
    reunirSocios(E) {
      const m = Pl.muni(E); if (!m || m.pm !== 'J') return { ok: false, msg: 'Sólo el alcalde' }; let n = 0; for (const k of m.coal) if (k !== m.alcalde) { Pl.cambiarSat(E, m, k, 8 + E.jugador.atrib.negociacion / 4); n++; } C.Personaje.cambiar(E, { prestigio: 0.2 }); return n ? { ok: true, msg: 'Reunión con los socios: suben su satisfacción.' } : { ok: false, msg: 'Gobiernas en solitario: no hay socios.' };
    },
    ceder(E, pid) {
      const m = Pl.muni(E); if (!m || m.pm !== 'J' || !m.coal.includes(pid) || pid === m.alcalde) return { ok: false, msg: 'Ese partido no es socio tuyo' }; Pl.cambiarSat(E, m, pid, 15); C.Personaje.cambiar(E, { prestigio: -0.4 }); m.aprob = clamp(m.aprob - 0.4, 10, 90); return { ok: true, msg: `Cedes una concejalía de peso a ${E.partidos[pid].sigla}: queda satisfecho.` };
    },
    solicitar(E, id) {
      const m = Pl.muni(E), J = E.jugador, s = Pl.asegurar(E), c = s.conv.find(x => x.id === id); if (!m || m.pm !== 'J') return { ok: false, msg: 'Sólo el alcalde solicita fondos' }; if (!c || c.resuelta) return { ok: false, msg: 'La convocatoria ya no está abierta' };
      c.resuelta = true; const p = clamp(0.3 + J.atrib.gestion / 22 + J.prestigio / 350 - c.dif * 0.6 + (m.deuda < 60 ? 0.05 : 0), 0.08, 0.85);
      if (U.chance(p)) { m.fondos += 2 + Math.round(c.importe / 4); m.deuda = clamp(m.deuda - c.importe * 0.3, 3, 170); m.aprob = clamp(m.aprob + 1.5, 10, 90); C.Personaje.cambiar(E, { prestigio: 1.2 + c.importe / 10 }); C.Noticias.poner(E, 'local', `${m.nombre} logra ${c.importe} M€ de fondos europeos: «${c.n}».`, 'ES'); return { ok: true, msg: `¡Concedidos! ${c.importe} M€ para «${c.n}».` }; }
      return { ok: true, exito: false, msg: 'Tu proyecto no entra en la lista de financiados.' };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'local', disponible: E => { const m = Pl.muni(E); return E.jugador.pais === 'ES' && m && m.pm === 'J' ? true : 'Sólo el alcalde'; } }, o));
  R({ id: 'pacto_local', nombre: 'Incorporar un socio al gobierno municipal', icono: '🤝', costo: 2, desc: 'Alcalde: negocia que otro partido entre en tu gobierno.', ejecutar: (E, a) => Pl.pacto(E, a.pid) });
  R({ id: 'reunir_socios_local', nombre: 'Reunir a los socios municipales', icono: '☕', desc: 'Alcalde: mejora la satisfacción de tus socios y reduce el riesgo de moción.', ejecutar: E => Pl.reunirSocios(E) });
  R({ id: 'ceder_concejalia', nombre: 'Ceder una concejalía a un socio', icono: '🪑', desc: 'Alcalde: calma a un socio descontento a cambio de poder.', ejecutar: (E, a) => Pl.ceder(E, a.pid) });
  R({ id: 'solicitar_fondos_ue', nombre: 'Solicitar fondos europeos', icono: '🇪🇺', costo: 2, desc: 'Alcalde: presenta un proyecto a una convocatoria europea para la ciudad.', ejecutar: (E, a) => Pl.solicitar(E, a.id) });
  C.Tiempo.registrar('local2', { turno: Pl.turno }, 53);
})(window.ESP);

/* Presión para adelantar las elecciones generales: la oposición (tú, si lo eres) fuerza al presidente a convocar urnas.
   Estado: E.esp.pres = { nivel 0-100, cd:{accion:t}, hist[], ult }. El presidente de la IA disuelve con más probabilidad cuanta más presión hay;
   si el presidente eres tú, te llega el dilema «La oposición exige elecciones». */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const Pr = C.Presion = {
    asegurar(E) { if (!E.esp.pres) E.esp.pres = { nivel: 10, cd: {}, hist: [], ult: -99 }; return E.esp.pres; },
    nota(E, txt) { const s = Pr.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 15) s.hist.length = 15; },
    esPM(E) { return E.paises.ES.gob.pm === 'J'; },
    /* Factores que alimentan la presión de fondo (para mostrarlos). */
    factores(E) {
      const P = E.paises.ES, g = P.gob, out = [];
      if (g.aprob < 45) out.push(['📉', `Aprobación del Gobierno baja (${Math.round(g.aprob)} %)`, (45 - g.aprob) * 0.9]);
      if (g.estab < 55) out.push(['🧱', `Mayoría parlamentaria frágil (estabilidad ${Math.round(g.estab)})`, (55 - g.estab) * 0.8]);
      const casos = C.Corrupcion ? C.Corrupcion.asegurar(E).casos.filter(c => c.pid === g.partido && c.fase !== 'cerrado').length : 0;
      if (casos) out.push(['⚖️', `${casos} caso(s) de corrupción abiertos`, casos * 7]);
      if (P.ec.paro > 14) out.push(['💼', `Paro alto (${U.d1(P.ec.paro)} %)`, (P.ec.paro - 14) * 2.5]);
      return out;
    },
    objetivo(E) { return clamp(U.suma(Pr.factores(E).map(f => f[2])), 0, 70); },
    empujar(E, d, txt) { const s = Pr.asegurar(E), a = s.nivel; s.nivel = clamp(s.nivel + d, 0, 100); if (txt) Pr.nota(E, txt); if (s.nivel >= 40 && C.Tutor) C.Tutor.una(E, 'presion'); if (a < 60 && s.nivel >= 60) C.Noticias.poner(E, 'politica', 'Crece el clamor por un adelanto electoral: la presión sobre el Gobierno alcanza máximos.', 'ES'); },
    puede(E, id, sem) { const s = Pr.asegurar(E), t = E.fecha.t; if (s.cd[id] != null && t - s.cd[id] < sem) return `Espera ${sem - (t - s.cd[id])} semana(s) para repetirlo`; return true; },
    disponible(E) { if (E.jugador.pais !== 'ES') return 'Sólo en España'; if (Pr.esPM(E)) return 'Eres el presidente: te presionan a ti'; if (E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en su etapa ordinaria'; return true; },
    /* Probabilidad semanal de que la IA convoque elecciones por la presión. */
    probDisolucion(E, ventaja) { const n = Pr.asegurar(E).nivel; if (n < 55) return 0; let p = (n - 55) / 45 * 0.04; if (ventaja < -4) p *= 0.4; return p; },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim || E.esp.cortes.estado !== 'activa') return; const s = Pr.asegurar(E), g = E.paises.ES.gob;
      s.nivel = clamp(s.nivel + (Pr.objetivo(E) - s.nivel) * 0.05 - 0.4, 0, 100);
      if (s.nivel > 45) { const d = (s.nivel - 45) / 55; g.estab = clamp(g.estab - d * 0.35, 0, 100); g.aprob = clamp(g.aprob - d * 0.08, 10, 90); }
      if (Pr.esPM(E) && s.nivel >= 65 && E.fecha.t - s.ult > 14 && C.Dilemas && !C.Dilemas.asegurar(E).act.some(x => x.id === 'presion')) { if (C.Dilemas.nuevo(E, 'presion')) s.ult = E.fecha.t; }
    },
    exigir(E) { const J = E.jugador, a = J.atrib; const d = 3 + (a.oratoria + a.carisma) / 4; Pr.empujar(E, d, 'Exiges elecciones ya.'); Pr.asegurar(E).cd.exigir_elecciones = E.fecha.t; E.paises.ES.gob.aprob -= 0.1; C.Personaje.cambiar(E, { pop: 0.15 }); return { ok: true, msg: `Exiges elecciones ya: la presión sube a ${Math.round(Pr.asegurar(E).nivel)}.` }; },
    movilizar(E) {
      const J = E.jugador, a = J.atrib, pa = E.partidos[J.partido], fuerza = clamp((pa.popN || pa.pop) / 25, 0.3, 1.3), calle = (a.carisma + a.oratoria) / 10 * fuerza + U.gauss(0, 0.25);
      pa.finanzas = Math.max(0, pa.finanzas - 3); Pr.asegurar(E).cd.movilizar_elecciones = E.fecha.t;
      if (calle < 0.45) { Pr.empujar(E, 2, 'La manifestación por elecciones es un fracaso.'); C.Personaje.cambiar(E, { prestigio: -0.8 }); return { ok: true, exito: false, msg: 'La movilización pasa casi desapercibida: poca gente en la calle.' }; }
      const d = 6 + calle * 8; Pr.empujar(E, d, 'Gran movilización «Elecciones ya».'); C.Personaje.cambiar(E, { prestigio: 0.6, pop: 0.3 }); C.Noticias.poner(E, 'politica', `Miles de personas se manifiestan convocadas por ${J.nombre} para exigir elecciones anticipadas.`, 'ES'); return { ok: true, msg: `Las calles se llenan: la presión sube a ${Math.round(Pr.asegurar(E).nivel)}.` };
    },
    socio(E, pid) {
      const g = E.paises.ES.gob, J = E.jugador; if (!pid || !g.coalicion.includes(pid) || pid === g.partido) return { ok: false, msg: 'Elige a un socio del Gobierno' };
      const rel = C.Mayorias ? C.Mayorias.asegurar(E).rel[pid] || 0 : 0, a = J.atrib, p = clamp(0.2 + (a.negociacion + a.carisma) / 40 + rel / 250, 0.1, 0.8); Pr.asegurar(E).cd['presionar_socio_gobierno'] = E.fecha.t;
      if (U.chance(p)) { g.estab = clamp(g.estab - 5, 0, 100); Pr.empujar(E, 9, `${E.partidos[pid].sigla} se aleja del Gobierno por tu presión.`); if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, 4); C.Noticias.poner(E, 'politica', `${E.partidos[pid].sigla} duda de seguir apoyando al Gobierno.`, 'ES'); return { ok: true, msg: `${E.partidos[pid].sigla} se tambalea: el Gobierno pierde estabilidad.` }; }
      if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, -5); C.Personaje.cambiar(E, { prestigio: -0.4 }); return { ok: true, exito: false, msg: `${E.partidos[pid].sigla} rechaza tu presión y lo hace público.` };
    },
    bloquear(E) { const g = E.paises.ES.gob; g.estab = clamp(g.estab - 2.5, 0, 100); Pr.empujar(E, 5, 'Bloqueo parlamentario a la acción del Gobierno.'); Pr.asegurar(E).cd.bloquear_gobierno = E.fecha.t; C.Personaje.cambiar(E, { pop: -0.2, prestigio: -0.2 }); return { ok: true, msg: 'Obstruyes la agenda del Gobierno: pierde estabilidad (y tú, algo de imagen).' }; },
    darCara(E) { Pr.empujar(E, -9, 'Das la cara ante la presión.'); Pr.asegurar(E).cd.dar_la_cara = E.fecha.t; C.Personaje.cambiar(E, { prestigio: 0.3 }); E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab + 1, 0, 100); return { ok: true, msg: 'Das la cara en una comparecencia: la presión baja un poco.' }; }
  };
  const R = (id, nombre, icono, desc, costo, cd, ejecutar, extra) => C.Acciones.registrar(Object.assign({ id, nombre, icono, desc, costo, grupo: 'nacional', disponible: E => Pr.disponible(E) === true ? (Pr.puede(E, id, cd) === true ? true : Pr.puede(E, id, cd)) : Pr.disponible(E), ejecutar }, extra || {}));
  R('exigir_elecciones', 'Exigir elecciones ya', '📣', 'Declaración y rueda de prensa pidiendo elecciones anticipadas.', 1, 3, E => Pr.exigir(E));
  R('movilizar_elecciones', 'Convocar una movilización «Elecciones ya»', '🪧', 'Una gran manifestación contra el Gobierno: funciona si tu partido tiene tirón.', 3, 6, E => Pr.movilizar(E));
  R('presionar_socio_gobierno', 'Presionar a un socio del Gobierno', '🔨', 'Intenta que un socio retire apoyo o amenace con hacerlo.', 2, 4, (E, a) => Pr.socio(E, a && a.pid));
  R('bloquear_gobierno', 'Obstruir la agenda del Gobierno', '🚧', 'Bloqueo parlamentario: desgasta al Gobierno y a ti.', 2, 4, E => Pr.bloquear(E));
  C.Acciones.registrar({ id: 'dar_la_cara', nombre: 'Dar la cara ante la presión', icono: '🛡️', desc: 'Comparecer y calmar el clamor por un adelanto electoral.', costo: 2, grupo: 'nacional', disponible: E => E.jugador.pais === 'ES' ? (Pr.esPM(E) ? (Pr.puede(E, 'dar_la_cara', 3) === true ? true : Pr.puede(E, 'dar_la_cara', 3)) : 'Sólo el presidente del Gobierno') : 'Sólo en España', ejecutar: E => Pr.darCara(E) });
  C.Tiempo.registrar('presion', { turno: Pr.turno }, 58);
})(window.ESP);

/* Objetivos de partido y puntuación final del partido: la ejecutiva fija hasta tres objetivos con plazo; cumplirlos da prestigio, cohesión y militancia,
   fallarlos cuesta. La puntuación de partido resume la partida (poder, fuerza, organización, objetivos) y alimenta el ranking de partidos del Salón de la fama.
   Estado: E.esp.obj = { pid, act[{id,t0,fin}], hechos{id:t}, falladas{id:t}, semGob, pico, racha{primera,unidad}, cache }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const sede = E => C.Sede && C.Sede.activo(E);
  const esc = E => E.paises.ES.escanos[E.jugador.partido] || 0;
  const gobierna = E => { const g = E.paises.ES.gob, p = E.jugador.partido; return g.partido === p || (g.coalicion || []).includes(p); };
  const r = (v, a) => clamp(v / a, 0, 1);
  const presAut = E => { let n = 0; for (const c in E.esp.ccaa) { const gb = E.esp.ccaa[c].gob; if (gb && (gb.partido === E.jugador.partido || (gb.coalicion || []).includes(E.jugador.partido))) n++; } return n; };
  const orgs = E => C.Satelites ? Object.values(C.Satelites.asegurar(E).org).reduce((a, o) => a + o.n, 0) : 0;
  const primera = E => { const P = E.paises.ES, me = E.jugador.partido, v = E.partidos[me].popN || E.partidos[me].pop; return P.partidos.every(k => k === me || (E.partidos[k].popN || E.partidos[k].pop || 0) <= v); };
  // id: [icono, nombre, descripción, cumplido(E), progreso(E), premio{pres,coh,mil,caja}, plazo en semanas]
  const OBJ = {
    gobierno: ['🏛', 'Entrar en el Gobierno', 'Que tu partido gobierne, solo o en coalición.', E => gobierna(E), E => gobierna(E) ? 1 : r(esc(E), 176) * 0.6, { pres: 3, coh: 4, mil: 0.03, caja: 6 }, 156],
    escanos50: ['🪑', 'Llegar a 50 escaños', 'Una bancada con peso propio en el Congreso.', E => esc(E) >= 50, E => r(esc(E), 50), { pres: 2, coh: 3, mil: 0.02, caja: 4 }, 104],
    escanos100: ['🪑', 'Llegar a 100 escaños', 'Primer escalón hacia la mayoría.', E => esc(E) >= 100, E => r(esc(E), 100), { pres: 3, coh: 3, mil: 0.03, caja: 5 }, 156],
    absoluta: ['🧮', 'Mayoría absoluta', '176 escaños o más.', E => esc(E) >= 176, E => r(esc(E), 176), { pres: 6, coh: 6, mil: 0.06, caja: 8 }, 260],
    primera: ['🥇', 'Primera fuerza durante seis meses', 'Liderar las encuestas 26 semanas seguidas.', E => (C.Objetivos.asegurar(E).racha.primera || 0) >= 26, E => r(C.Objetivos.asegurar(E).racha.primera || 0, 26), { pres: 3, coh: 3, mil: 0.03, caja: 4 }, 156],
    implantacion: ['🗺', 'Implantación 60', 'Implantación media de 60 en todo el territorio.', E => C.Sede.implMedia(E) >= 60, E => r(C.Sede.implMedia(E), 60), { pres: 2, coh: 3, mil: 0.03, caja: 4 }, 156],
    militancia: ['🤝', 'Militancia +50 %', 'Que el partido crezca un 50 % en afiliados desde que fijaste el objetivo.', E => { const o = C.Objetivos.asegurar(E).act.find(x => x.id === 'militancia'); return !!o && E.partidos[E.jugador.partido].militantes >= o.m0 * 1.5; }, E => { const o = C.Objetivos.asegurar(E).act.find(x => x.id === 'militancia'); return o ? r(E.partidos[E.jugador.partido].militantes - o.m0, o.m0 * 0.5) : 0; }, { pres: 2, coh: 2, mil: 0, caja: 6 }, 156],
    fiabilidad: ['📜', 'Palabra cumplida', 'Fiabilidad del programa del 70 % con, al menos, cinco decisiones registradas.', E => { const c = C.Sede.cumplimiento(E), n = Object.values(c).reduce((a, x) => a + x.ok + x.ko, 0), f = C.Sede.fiabilidad(E); return n >= 5 && f != null && f >= 0.7; }, E => { const f = C.Sede.fiabilidad(E); return f == null ? 0 : r(f, 0.7); }, { pres: 4, coh: 3, mil: 0.02, caja: 3 }, 208],
    coherencia: ['🗳', 'Coherencia en las votaciones', 'Votar según tu programa en el 80 % de los casos (mínimo seis votos).', E => { const v = C.Sede.asegurar(E).votos; return !!v && v.coh + v.inc >= 6 && v.coh / (v.coh + v.inc) >= 0.8; }, E => { const v = C.Sede.coherenciaVoto(E); return v == null ? 0 : r(v, 0.8); }, { pres: 2, coh: 2, mil: 0.01, caja: 2 }, 156],
    cuentas: ['💶', 'Cuentas sanas', 'Caja de, al menos, 45 puntos y sin deuda.', E => E.partidos[E.jugador.partido].finanzas >= 45 && C.Sede.asegurar(E).deuda <= 0.5, E => r(E.partidos[E.jugador.partido].finanzas, 45) * (C.Sede.asegurar(E).deuda <= 0.5 ? 1 : 0.7), { pres: 2, coh: 2, mil: 0.01, caja: 0 }, 104],
    unidad: ['🧩', 'Partido unido', 'Cohesión interna de 75 o más durante 26 semanas.', E => (C.Objetivos.asegurar(E).racha.unidad || 0) >= 26, E => r(C.Objetivos.asegurar(E).racha.unidad || 0, 26), { pres: 3, coh: 5, mil: 0.02, caja: 3 }, 156],
    fusion: ['🧬', 'Crecer por absorción', 'Fusionarte con otro partido o absorberlo.', E => !!(C.Fusion && C.Fusion.asegurar(E).hist.some(x => x.jugador)), E => C.Fusion && C.Fusion.asegurar(E).hist.some(x => x.jugador) ? 1 : 0, { pres: 3, coh: 0, mil: 0.05, caja: 3 }, 208],
    presidencias: ['🏴', 'Tres presidencias autonómicas', 'Que tu partido presida (o comparta) tres gobiernos autonómicos.', E => presAut(E) >= 3, E => r(presAut(E), 3), { pres: 4, coh: 4, mil: 0.04, caja: 5 }, 260],
    organizaciones: ['🏢', 'Red de organizaciones', 'Sumar seis niveles entre juventudes, fundación, sindicato y medios.', E => orgs(E) >= 6, E => r(orgs(E), 6), { pres: 2, coh: 3, mil: 0.03, caja: 0 }, 156]
  };
  const Ob = C.Objetivos = {
    OBJ,
    asegurar(E) { let s = E.esp.obj; if (s && s.pid === E.jugador.partido) return s; return E.esp.obj = { pid: E.jugador.partido, act: [], hechos: {}, falladas: {}, semGob: 0, pico: 0, racha: { primera: 0, unidad: 0 } }; },
    cumple(E, id) { try { return !!OBJ[id][3](E); } catch (e) { return false; } },
    progreso(E, id) { try { return clamp(OBJ[id][4](E), 0, 1); } catch (e) { return 0; } },
    elegir(E, id) {
      const s = Ob.asegurar(E), o = OBJ[id]; if (!o) return { ok: false, msg: 'Objetivo desconocido' };
      if (s.act.some(x => x.id === id)) return { ok: false, msg: 'Ya es uno de tus objetivos' }; if (s.act.length >= 3) return { ok: false, msg: 'La ejecutiva sólo asume tres objetivos a la vez' };
      if (s.hechos[id] != null) return { ok: false, msg: 'Ya lo cumpliste' }; if (s.falladas[id] != null && E.fecha.t - s.falladas[id] < 26) return { ok: false, msg: 'Fallaste este objetivo hace poco: espera ' + (26 - (E.fecha.t - s.falladas[id])) + ' semana(s)' };
      if (Ob.cumple(E, id)) return { ok: false, msg: 'Ese objetivo ya lo cumples: elige uno más ambicioso' };
      s.act.push({ id, t0: E.fecha.t, fin: E.fecha.t + o[6], m0: E.partidos[E.jugador.partido].militantes });
      return { ok: true, msg: `Objetivo fijado: ${o[1]} (plazo ${Math.round(o[6] / 52 * 10) / 10} años).` };
    },
    abandonar(E, id) {
      const s = Ob.asegurar(E), i = s.act.findIndex(x => x.id === id); if (i < 0) return { ok: false, msg: 'No es uno de tus objetivos' };
      s.act.splice(i, 1); C.Personaje.cambiar(E, { prestigio: -0.8 }, true); E.partidos[E.jugador.partido].cohesion = clamp(E.partidos[E.jugador.partido].cohesion - 1, 15, 99);
      return { ok: true, msg: 'Renuncias al objetivo: el partido lo nota (−0,8 de prestigio).' };
    },
    premiar(E, id) {
      const pa = E.partidos[E.jugador.partido], o = OBJ[id], pr = o[5];
      C.Personaje.cambiar(E, { prestigio: pr.pres }, true); pa.cohesion = clamp(pa.cohesion + pr.coh, 15, 99); pa.militantes = Math.round(pa.militantes * (1 + pr.mil)); const sd = C.Sede.asegurar(E); if (sd.m0) sd.m0 = Math.round(sd.m0 * (1 + pr.mil)); pa.finanzas = clamp(pa.finanzas + pr.caja, 0, 99);
      C.Personaje.log(E, `🎯 Objetivo del partido cumplido: ${o[1]} (+${pr.pres} prestigio).`); C.Noticias.poner(E, 'partido', `${pa.sigla} cumple su objetivo estratégico: ${o[1].toLowerCase()}.`, 'ES'); if (C.Dilemas) C.Dilemas.registrar(E, 'objetivo', 'Objetivo de partido: ' + o[1], 2);
    },
    penalizar(E, id) {
      const pa = E.partidos[E.jugador.partido], o = OBJ[id]; C.Personaje.cambiar(E, { prestigio: -2 }, true); pa.cohesion = clamp(pa.cohesion - 3, 15, 99);
      C.Personaje.log(E, `🎯 Objetivo del partido fallido: ${o[1]} (−2 prestigio).`); C.Noticias.poner(E, 'partido', `${pa.sigla} no logra su objetivo: ${o[1].toLowerCase()}. La dirección, en el punto de mira.`, 'ES'); if (C.Dilemas) C.Dilemas.registrar(E, 'objetivo', 'Objetivo de partido fallido: ' + o[1], -2);
    },
    /* Puntuación del partido: poder (gobierno), fuerza (escaños), organización y objetivos. */
    puntuacion(E) {
      if (!E.jugador || !sede(E)) return { pts: 0, desglose: [], nota: '—' };
      const s = Ob.asegurar(E), pa = E.partidos[E.jugador.partido], Sd = C.Sede, fb = Sd.fiabilidad(E);
      const d = [
        ['Poder: años en el Gobierno', Math.min(30, s.semGob / 52 * 5)],
        ['Fuerza: pico de escaños', Math.min(30, s.pico / 176 * 30)],
        ['Implantación territorial', Sd.implMedia(E) / 100 * 10],
        ['Cohesión interna', pa.cohesion / 100 * 5],
        ['Palabra cumplida (fiabilidad)', fb == null ? 0 : fb * 8],
        ['Cuentas del partido', (pa.finanzas >= 20 ? 3 : 0) + (Sd.asegurar(E).deuda <= 0.5 ? 2 : 0)],
        ['Objetivos cumplidos', Math.min(20, Object.keys(s.hechos).length * 4)],
        ['Objetivos fallidos', -Math.min(10, Object.keys(s.falladas).length * 2)]
      ].map(x => [x[0], Math.round(x[1] * 10) / 10]);
      const pts = Math.max(0, Math.round(d.reduce((a, x) => a + x[1], 0)));
      return { pts, desglose: d, nota: pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : pts >= 25 ? 'D' : 'E' };
    },
    turno(E) {
      const J = E.jugador; if (!J || !sede(E) || E.meta.presim) return; const s = Ob.asegurar(E), t = E.fecha.t, pa = E.partidos[J.partido];
      if (C.Tutor && E.meta.modoPartido && t >= 8) C.Tutor.una(E, 'objetivos');
      if (gobierna(E)) s.semGob++; s.pico = Math.max(s.pico, esc(E)); s.racha.primera = primera(E) ? (s.racha.primera || 0) + 1 : 0; s.racha.unidad = pa.cohesion >= 75 ? (s.racha.unidad || 0) + 1 : 0;
      for (const o of s.act.slice()) {
        if (Ob.cumple(E, o.id)) { s.hechos[o.id] = t; s.act.splice(s.act.indexOf(o), 1); Ob.premiar(E, o.id); }
        else if (t >= o.fin) { s.falladas[o.id] = t; s.act.splice(s.act.indexOf(o), 1); Ob.penalizar(E, o.id); }
      }
    }
  };
  const dir = E => C.Sede.peso(E);
  C.Acciones.registrar({ id: 'fijar_objetivo', nombre: 'Fijar un objetivo de partido', icono: '🎯', costo: 1, grupo: 'partido', desc: 'La ejecutiva asume un objetivo con plazo: cumplirlo da prestigio y militancia; fallarlo, desgaste.', disponible: E => !sede(E) ? 'Sólo con un partido nacional en España' : dir(E), ejecutar: (E, a) => Ob.elegir(E, a && a.id) });
  C.Acciones.registrar({ id: 'abandonar_objetivo', nombre: 'Renunciar a un objetivo de partido', icono: '↩️', costo: 0, grupo: 'partido', desc: 'Retiras un objetivo en curso a cambio de un pequeño coste.', disponible: E => !sede(E) ? 'Sólo con un partido nacional en España' : dir(E), ejecutar: (E, a) => Ob.abandonar(E, a && a.id) });
  C.Tiempo.registrar('objetivos', { turno: Ob.turno }, 84);
})(window.ESP);

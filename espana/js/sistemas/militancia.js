/* Militancia y congreso: afiliados frente a simpatizantes, censo de las primarias (cerrado o abierto) y ponencias al programa en el congreso. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const Ml = C.Militancia = {
    simpatizantes(E) { const pa = E.partidos[E.jugador.partido]; return Math.round(35000000 * (pa.popN || pa.pop || 0) / 100 * 0.22); },
    censo(E) { const c = C.PartidoInt.asegurar(E).cong; return c.censo || 'cerrado'; },
    fijarCenso(E, tipo) {
      const J = E.jugador, c = C.PartidoInt.asegurar(E).cong; if (!['cerrado', 'abierto'].includes(tipo)) return { ok: false, msg: 'Censo desconocido' }; if (E.partidos[J.partido].lider !== 'J') return { ok: false, msg: 'Sólo el líder del partido decide el censo' };
      c.censo = tipo; return { ok: true, msg: tipo === 'abierto' ? 'Abres las primarias a simpatizantes: gana quien tenga más tirón popular.' : 'Primarias cerradas: sólo vota la militancia, con peso de la estructura.' };
    },
    /* Ajuste de apoyo en el congreso según el censo, el tirón del candidato y el peso de la estructura. */
    ajusteCenso(E) {
      const J = E.jugador, pi = C.PartidoInt.asegurar(E), esL = E.partidos[J.partido].lider === 'J', abierto = Ml.censo(E) === 'abierto';
      const tiron = (J.pop - 40) / 10, aparato = pi.fac.oficial * 0.03 + pi.fac.barones * 0.02;
      return abierto ? (esL ? tiron - aparato * 0.5 : tiron + 1.5) : (esL ? aparato : -aparato * 0.7);
    },
    /* Ponencias que puede defender el jugador en el congreso: cambios al programa. */
    ponencias(E) {
      if (!C.Sede || !C.Sede.activo(E)) return []; const s = C.Sede.asegurar(E), out = [], areas = C.DATA.programa.slice().sort(() => U.rf(-1, 1)); const gen = (a, k) => out.push({ area: a.id, k, txt: `${a.n}: «${a.ops.find(o => o.k === k).t}»` });
      for (const a of areas) { if (out.length >= 3) break; const cur = s.prog[a.id], alt = a.ops.filter(o => o.k !== cur); if (alt.length) gen(a, U.pick(alt).k); } return out;
    },
    defender(E, pon, neg) {
      const pi = C.PartidoInt.asegurar(E), esL = E.partidos[E.jugador.partido].lider === 'J'; const p = clamp(0.4 + neg * 0.25 + (pi.fac.critico - 25) / 150 + (esL ? 0.1 : 0), 0.15, 0.85);
      if (U.chance(p)) { const s = C.Sede.asegurar(E); delete s.cd['p_' + pon.area]; const r = C.Sede.fijarPrograma(E, pon.area, pon.k); return { ok: true, pasa: true, txt: 'La ponencia sale adelante: ' + r.msg, bono: 1 }; }
      C.Personaje.cambiar(E, { prestigio: -0.4 }, true); return { ok: true, pasa: false, txt: 'La ponencia decae en la votación de delegados.', bono: -0.5 };
    }
  };
  /* Campaña de afiliación masiva (la básica es PartidoInt.afiliacion): sube la militancia de forma duradera (también el nivel al que tiende la militancia). */
  Ml.afiliacion = function (E) {
    const Sd = C.Sede, s = Sd.asegurar(E), pa = E.partidos[E.jugador.partido], c = Sd.puede(E, 'afil', 12); if (c !== true) return { ok: false, msg: c }; if (!Sd.cost(E, 2)) return { ok: false, msg: 'No hay caja (2 puntos de finanzas)' };
    const org = s.equipo.org ? 1 + s.equipo.org.comp / 20 : 1, jov = 1 + 0.08 * (C.Satelites ? C.Satelites.nivel(E, 'juv') : 0), g = clamp(0.03 * org * jov * (0.7 + (pa.popN || pa.pop || 0) / 40) + U.rf(0, 0.01), 0.015, 0.09);
    const n = Math.round(pa.militantes * g); pa.militantes += n; if (s.m0) s.m0 = Math.round(s.m0 * (1 + g)); s.cd.afil = E.fecha.t; Sd.nota(E, `Campaña de afiliación: +${n.toLocaleString('es-ES')} militantes.`);
    return { ok: true, msg: `La campaña de afiliación suma ${n.toLocaleString('es-ES')} militantes (+${U.d1(g * 100)} %).` };
  };
  C.Acciones.registrar({ id: 'afiliacion_masiva', nombre: 'Campaña de afiliación masiva', icono: '🤝', costo: 1, grupo: 'partido', desc: 'Inversión fuerte (2 puntos de finanzas) para atraer muchos afiliados: más cuanto mejor sea tu organización y tus juventudes. Es más grande y duradera que la campaña de afiliación básica.', disponible: E => !C.Sede || !C.Sede.activo(E) ? 'Sólo con un partido nacional en España' : C.Sede.peso(E) === true ? (C.Sede.puede(E, 'afil', 12)) : 'Necesitas peso en la dirección', ejecutar: E => Ml.afiliacion(E) });
  C.Acciones.registrar({ id: 'fijar_censo', nombre: 'Fijar el censo de las primarias', icono: '🗳️', costo: 1, grupo: 'partido', desc: 'Cerrado (sólo militantes, favorece al aparato) o abierto (también simpatizantes, favorece el tirón popular).', disponible: E => E.jugador.pais !== 'ES' ? 'Sólo en España' : (E.partidos[E.jugador.partido].lider === 'J' ? true : 'Sólo el líder del partido'), ejecutar: (E, a) => Ml.fijarCenso(E, a && a.tipo) });
})(window.ESP);

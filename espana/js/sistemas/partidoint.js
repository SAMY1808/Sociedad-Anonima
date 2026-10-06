/* Tu partido por dentro: facciones (oficialistas, críticos y barones), congreso del partido con elección de líder, militancia y finanzas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const FAC = { oficial: ['Oficialistas', '🟦', 'Leales a la dirección'], critico: ['Críticos', '🟥', 'Sector que cuestiona al líder'], barones: ['Barones territoriales', '🟨', 'Presidentes y líderes regionales'] };

  const Pi = C.PartidoInt = {
    FAC,
    asegurar(E) {
      if (E.esp.pint) return E.esp.pint;
      return E.esp.pint = { fac: { oficial: 62, critico: 22, barones: 16 }, cong: { prox: E.fecha.t + U.ri(50, 190), fase: null, cand: null, ult: null }, hist: [] };
    },
    apoyoLider(E) { const p = Pi.asegurar(E), J = E.jugador; return clamp(p.fac.oficial + p.fac.barones * 0.6 + (J && E.partidos[J.partido].lider === 'J' ? (J.prestigio - 50) / 4 : 0), 0, 100); },

    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const p = Pi.asegurar(E), pa = E.partidos[J.partido], t = E.fecha.t, c = p.cong;
      const barones = clamp(10 + C.Territorio.nPresidentes(E, pa.id) * 1.8 + (C.PoderLocal ? C.PoderLocal.alcaldes(E, pa.id) * 0.08 : 0), 8, 40), crit = clamp(58 - pa.cohesion * 0.55 + (pa.postura === 'oposicion' ? 4 : 0), 8, 55);
      p.fac.barones += (barones - p.fac.barones) * 0.04; p.fac.critico += (crit - p.fac.critico) * 0.04; p.fac.oficial = 100 - p.fac.barones - p.fac.critico;
      pa.cohesion = clamp(pa.cohesion + (66 - p.fac.critico * 0.8 - pa.cohesion) * 0.01, 15, 99);
      if (!c.fase && c.prox - t <= 6 && c.prox > t) { c.fase = 'precongreso'; C.Noticias.poner(E, 'partido', `${pa.sigla} convoca su congreso federal para el ${U.fmtT(c.prox, true)}.`, 'ES'); if (!E.meta.presim) C.Eventos.info(E, '🎗 Congreso del partido', `${pa.nombre} celebrará su congreso el ${U.fmtT(c.prox, true)}. Es el momento de amarrar apoyos${E.jugador.rol !== 'lider' && ['direccion', 'portavoz'].includes(E.jugador.rol) ? ' o de presentar tu candidatura al liderazgo' : ''} desde Mi partido → Congreso y facciones.`); }
      if (t >= c.prox) Pi.congreso(E);
    },
    congreso(E) {
      const J = E.jugador, pa = E.partidos[J.partido], p = Pi.asegurar(E), c = p.cong, esL = pa.lider === 'J';
      c.ult = E.fecha.t; c.prox = E.fecha.t + U.ri(180, 230); const cand = c.cand; c.fase = null; c.cand = null; const campUsada = c.camp; c.camp = null;
      let res;
      if (cand === 'J' && !esL) {
        const cp = campUsada || { avales: 0, debate: 0, bases: 0 }; const ap = clamp(35 + (J.prestigio - 40) / 2 + p.fac.critico * 0.7 + (J.rol === 'direccion' ? 6 : 0) - p.fac.oficial * 0.25 + cp.avales * 0.8 + cp.debate * 1.0 + cp.bases * 0.8 + U.gauss(0, 7), 5, 95);
        if (ap > 50) { C.Ejecutivo.nuevoLider(E, J.partido, 'tras la victoria de ' + J.nombre + ' en el congreso'); const viejo = pa.lider; pa.lider = 'J'; J.rol = 'lider'; C.Personaje.cambiar(E, { prestigio: 8, pop: 3 }, true); pa.cohesion -= 4; res = `${J.nombre} gana el congreso con el ${Math.round(ap)} % y se hace con el liderazgo.`; C.Personaje.sincronizar(E); }
        else { C.Personaje.cambiar(E, { prestigio: -3 }, true); res = `${J.nombre} pierde el congreso (${Math.round(ap)} %).`; }
      } else if (esL) {
        const ap = Pi.apoyoLider(E) + U.gauss(0, 6);
        if (ap >= 48) { C.Personaje.cambiar(E, { prestigio: 4 }, true); pa.cohesion += 3; res = `${J.nombre} revalida el liderazgo en el congreso con el ${Math.round(clamp(ap, 50, 96))} %.`; }
        else { C.Ejecutivo.nuevoLider(E, J.partido, 'tras el congreso del partido'); J.rol = 'direccion'; C.Personaje.cambiar(E, { prestigio: -8, pop: -3 }, true); res = `${J.nombre} pierde el congreso y deja el liderazgo.`; C.Personaje.sincronizar(E); }
      } else {
        const d = pa.cohesion < 50 && U.chance(0.4) || p.fac.critico > 38 && U.chance(0.35);
        if (d) { C.Ejecutivo.nuevoLider(E, J.partido, 'tras el congreso del partido'); res = `${pa.sigla} elige a un nuevo líder.`; } else res = `${pa.sigla} ratifica a su líder.`;
      }
      p.hist.unshift({ t: E.fecha.t, txt: res }); if (p.hist.length > 10) p.hist.length = 10;
      C.Noticias.poner(E, 'partido', 'Congreso de ' + pa.sigla + ': ' + res, 'ES'); C.Personaje.log(E, 'Congreso del partido: ' + res);
      p.fac.critico = clamp(p.fac.critico * 0.7, 8, 55); p.fac.oficial = 100 - p.fac.barones - p.fac.critico;
    },
    amarrar(E) { const p = Pi.asegurar(E); p.fac.oficial += 4; p.fac.critico = clamp(p.fac.critico - 2.5, 5, 60); p.fac.oficial = 100 - p.fac.barones - p.fac.critico; C.Personaje.cambiar(E, { prestigio: 0.4 }); return { ok: true, msg: 'Amarras apoyos entre los delegados: cae el peso del sector crítico.' }; },
    pactarCriticos(E) { const p = Pi.asegurar(E), pa = E.partidos[E.jugador.partido]; p.fac.critico = clamp(p.fac.critico - 6, 5, 60); p.fac.oficial = 100 - p.fac.barones - p.fac.critico; pa.cohesion = clamp(pa.cohesion + 3, 15, 99); C.Personaje.cambiar(E, { prestigio: -0.6 }); return { ok: true, msg: 'Pactas con los críticos: les ofreces puestos y presencia en la ejecutiva.' }; },
    candidatura(E) { const p = Pi.asegurar(E), c = p.cong; if (c.fase !== 'precongreso') return { ok: false, msg: 'Sólo puedes presentar candidatura cuando se convoca el congreso' }; c.cand = 'J'; C.Noticias.poner(E, 'partido', `${E.jugador.nombre} presenta su candidatura al liderazgo de ${E.partidos[E.jugador.partido].sigla}.`, 'ES'); return { ok: true, msg: 'Presentas tu candidatura al liderazgo: se votará en el congreso.' }; },
    afiliacion(E) { const pa = E.partidos[E.jugador.partido]; const o = E.jugador.atrib.carisma / 10; pa.militantes += Math.round(pa.militantes * (0.01 + o * 0.015)); pa.finanzas = clamp(pa.finanzas + 1.5, 5, 99); return { ok: true, msg: 'Campaña de afiliación: más militantes y más cuotas.' }; }
  };
  C.Tiempo.registrar('partidoint', { turno: Pi.turno, postInit: E => { if (E.jugador && E.jugador.pais === 'ES') Pi.asegurar(E); } }, 40);

  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'partido' }, o));
  const dir = E => ['direccion', 'lider'].includes(E.jugador.rol) ? true : 'Necesitas un puesto en la dirección del partido';
  R({ id: 'amarrar_apoyos', nombre: 'Amarrar apoyos internos', icono: '🤝', desc: 'Habla con delegados y barones: refuerza a los oficialistas frente a los críticos.', disponible: dir, ejecutar: E => Pi.amarrar(E) });
  R({ id: 'pactar_criticos', nombre: 'Pactar con los críticos', icono: '🕊️', costo: 2, desc: 'Ofrece puestos y presencia al sector crítico: baja la tensión interna.', disponible: dir, ejecutar: E => Pi.pactarCriticos(E) });
  /* Primarias: campaña interna por el liderazgo (avales, debate, bases). */
  const prim = E => { const J = E.jugador; if (J.pais !== 'ES') return 'Sólo en España'; const c = Pi.asegurar(E).cong; return c.fase === 'precongreso' && c.cand === 'J' ? true : 'Sólo si eres candidato/a al liderazgo en un congreso convocado'; };
  const camp = (E, k, txt, f) => { const c = Pi.asegurar(E).cong; c.camp = c.camp || { avales: 0, debate: 0, bases: 0 }; if (c.camp[k] >= 10) return { ok: false, msg: 'Ya has agotado esa vía' }; const x = f(E.jugador); c.camp[k] = clamp(c.camp[k] + x, 0, 10); return { ok: true, msg: `${txt} (+${U.d1(x)}).` }; };
  R({ id: 'recoger_avales', nombre: 'Recoger avales de delegados', icono: '✍️', desc: 'Primarias: firmas de delegados y cargos para tu candidatura.', disponible: prim, ejecutar: E => camp(E, 'avales', 'Recoges avales de delegados y barones', J => 1.2 + J.atrib.negociacion / 8) });
  R({ id: 'debate_interno', nombre: 'Debate entre candidatos', icono: '🎙️', desc: 'Primarias: un debate interno ante los medios y la militancia.', disponible: prim, ejecutar: E => camp(E, 'debate', 'Ganas presencia en el debate interno', J => 1 + J.atrib.oratoria / 7) });
  R({ id: 'campana_interna', nombre: 'Gira por las agrupaciones', icono: '🚌', desc: 'Primarias: recorres agrupaciones locales para ganarte a la militancia.', disponible: prim, ejecutar: E => camp(E, 'bases', 'Recorres las agrupaciones del partido', J => 1.1 + J.atrib.carisma / 8) });
  R({ id: 'candidatura_liderazgo', nombre: 'Presentarte al liderazgo', icono: '🏁', costo: 2, desc: 'Cuando el partido convoca congreso, presenta tu candidatura frente al líder.', disponible: E => { const J = E.jugador, pa = E.partidos[J.partido]; if (pa.lider === 'J') return 'Ya eres el líder'; if (!['direccion', 'portavoz'].includes(J.rol)) return 'Necesitas puesto en la dirección o ser portavoz'; return C.PartidoInt.asegurar(E).cong.fase === 'precongreso' ? true : 'El partido aún no ha convocado congreso'; }, ejecutar: E => Pi.candidatura(E) });
  R({ id: 'campana_afiliacion', nombre: 'Campaña de afiliación', icono: '📋', desc: 'Capta militantes y cuotas: sube la militancia y las finanzas.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: E => Pi.afiliacion(E) });
  if (C.Jefe) C.Jefe.registrar('partido', {
    propone(E) { const pa = E.partidos[E.jugador.partido], p = Pi.asegurar(E), o = []; if (pa.cohesion < 55) o.push({ txt: 'Mediar en las tensiones del partido.', accion: 'mediar_partido', args: {} }); if (p.fac.critico > 30) o.push({ txt: 'Amarrar apoyos frente a los críticos.', accion: 'amarrar_apoyos', args: {} }); return o; },
    hace(E) { const out = [], pa = E.partidos[E.jugador.partido], p = Pi.asegurar(E), pl = []; if (pa.cohesion < 55) pl.push({ accion: 'mediar_partido', args: {}, txt: 'media' }); if (p.fac.critico > 30) pl.push({ accion: 'amarrar_apoyos', args: {}, txt: 'amarra apoyos' }); const r = C.Jefe.gastarAgenda(E, pl, C.Jefe.capacidad(E)); if (r.length) out.push('Partido: ' + r.join(' · ')); return out; }
  });
})(window.ESP);

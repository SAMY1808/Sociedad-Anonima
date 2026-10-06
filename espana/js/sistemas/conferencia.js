/* Conferencia de Presidentes: el presidente del Gobierno reúne a los presidentes autonómicos; temas, votación por comunidad y consecuencias.
   Estado: E.esp.conf = { ult, prox, abierta:{tema, votos, t}|null, hist[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = C.Territorio;
  const TEMAS = {
    financiacion: ['Financiación autonómica', '💶', 'Un nuevo reparto de fondos: sube la relación con las comunidades.'],
    agua: ['Pacto nacional del agua', '💧', 'Reparto de recursos hídricos: baja el estrés por sequía.'],
    acogida: ['Reparto de la acogida de migrantes', '🧭', 'Cupos entre comunidades: baja la tensión social.'],
    vivienda: ['Plan de vivienda entre administraciones', '🏠', 'Más oferta pública coordinada.'],
    sanidad: ['Pacto por la sanidad pública', '🏥', 'Refuerzo coordinado de la atención sanitaria.']
  };
  const Cf = C.Conferencia = {
    TEMAS,
    asegurar(E) { if (!E.esp.conf) E.esp.conf = { ult: -26, prox: 30, abierta: null, hist: [] }; return E.esp.conf; },
    presidentes(E) { return T.ids().filter(c => E.esp.ccaa[c].gob).map(c => ({ c, pres: E.esp.ccaa[c].gob.pres, pid: E.esp.ccaa[c].gob.partido })); },
    /* Voto por defecto de una comunidad: afinidad con el Gobierno, relación con Moncloa y ventaja del tema. */
    postura(E, c, tema) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, afin = C.Ejecutivo.afinidad(E, g.partido, rc.gob.partido), reg = E.partidos[rc.gob.partido].amb === 'reg';
      let s = afin * 0.9 + (rc.relM - 50) / 120 - (reg && tema === 'acogida' ? 0.15 : 0) + (tema === 'financiacion' && D().ccaa[c].pibpc < 24 ? 0.2 : 0) + (tema === 'agua' && E.esp.ccaa[c].deuda > 30 ? 0.05 : 0);
      if (g.coalicion.includes(rc.gob.partido)) s += 0.25; return s > 0.52 ? 'si' : s > 0.3 ? 'abs' : 'no';
    },
    abrir(E, tema, porJ) {
      const cf = Cf.asegurar(E); if (cf.abierta) return { ok: false, msg: 'Ya hay una conferencia en marcha' }; if (!TEMAS[tema]) return { ok: false, msg: 'Elige un tema' };
      if (E.fecha.t - cf.ult < 13) return { ok: false, msg: 'Acabáis de reuniros: espera unas semanas' };
      cf.abierta = { tema, t: E.fecha.t, porJ: !!porJ, votos: Object.fromEntries(Cf.presidentes(E).map(x => [x.c, Cf.postura(E, x.c, tema)])) };
      C.Noticias.poner(E, 'politica', `El presidente del Gobierno convoca la Conferencia de Presidentes: ${TEMAS[tema][0].toLowerCase()}.`, 'ES'); return { ok: true, msg: 'Conferencia convocada. Negocia con los presidentes antes del cierre.' };
    },
    /* Negociar con una comunidad concreta (el presidente del Gobierno) o aliarse con otras (presidente autonómico). */
    persuadir(E, c) {
      const cf = Cf.asegurar(E), a = cf.abierta, J = E.jugador; if (!a || !a.votos[c]) return { ok: false, msg: 'No hay conferencia o comunidad no válida' };
      const g = E.paises.ES.gob, rc = E.esp.ccaa[c]; if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno negocia en la conferencia' }; if (a.votos[c] === 'si') return { ok: false, msg: 'Esa comunidad ya está a favor' };
      if (U.chance(clamp(0.3 + J.atrib.negociacion / 22 + (rc.relM - 50) / 200, 0.1, 0.85))) { a.votos[c] = a.votos[c] === 'no' ? 'abs' : 'si'; rc.relM = clamp(rc.relM + 1, 0, 100); return { ok: true, msg: `${D().ccaa[c].nombre} suaviza su posición.` }; }
      return { ok: true, exito: false, msg: `${D().ccaa[c].nombre} no cede.` };
    },
    cerrar(E) {
      const cf = Cf.asegurar(E), a = cf.abierta; if (!a) return; const v = Object.values(a.votos), si = v.filter(x => x === 'si').length, no = v.filter(x => x === 'no').length, ok = si >= Math.ceil(v.length / 2) && si > no;
      cf.abierta = null; cf.ult = E.fecha.t; cf.prox = E.fecha.t + 26; const tn = TEMAS[a.tema][0];
      if (ok) {
        const ids = T.ids(); if (a.tema === 'financiacion') ids.forEach(c => { E.esp.ccaa[c].relM = clamp(E.esp.ccaa[c].relM + 3, 0, 100); }); else if (a.tema === 'sanidad') ids.forEach(c => { const rc = E.esp.ccaa[c]; if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 0.5, 5, 90); rc.gestion.sal = clamp(rc.gestion.sal + 3, 5, 98); });
        else if (C.Estructural) { const s = C.Estructural.asegurar(E); if (a.tema === 'agua') { s.ener.sequia = clamp(s.ener.sequia - 8, 0, 100); } else if (a.tema === 'acogida') { s.inm.reparto = clamp(s.inm.reparto + 15, 0, 100); } else if (a.tema === 'vivienda') { s.viv.oferta = clamp(s.viv.oferta + 5, 0, 100); } }
        E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob + 0.8, 5, 90); C.Noticias.poner(E, 'politica', `La Conferencia de Presidentes aprueba el acuerdo sobre ${tn.toLowerCase()} (${si} a favor, ${no} en contra).`, 'ES');
      } else { for (const c of T.ids()) { const x = a.votos[c]; if (x === 'no') E.esp.ccaa[c].relM = clamp(E.esp.ccaa[c].relM - 1.5, 0, 100); } E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab - 1.2, 0, 100); C.Noticias.poner(E, 'politica', `La Conferencia de Presidentes termina sin acuerdo sobre ${tn.toLowerCase()} (${si} a favor, ${no} en contra).`, 'ES'); }
      cf.hist.unshift({ t: E.fecha.t, tema: a.tema, ok, si, no }); if (cf.hist.length > 12) cf.hist.length = 12;
      const J = E.jugador; if (J && J.pais === 'ES' && E.paises.ES.gob.pm === 'J') C.Personaje.cambiar(E, { prestigio: ok ? 2 : -0.5 }); return { ok: true, msg: ok ? 'Acuerdo aprobado.' : 'Sin acuerdo.' };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const cf = Cf.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob;
      if (cf.abierta && t - cf.abierta.t >= 3) Cf.cerrar(E);
      if (!cf.abierta && g.pm !== 'J' && t >= cf.prox && U.chance(0.1) && !E.meta.presim) { Cf.abrir(E, U.pick(Object.keys(TEMAS)), false); cf.abierta.t = t - 2; }
    },
    miVoto(E, voto) { const J = E.jugador, cf = Cf.asegurar(E), a = cf.abierta; if (!a) return { ok: false, msg: 'No hay conferencia abierta' }; if (J.cargo !== 'presauto') return { ok: false, msg: 'Sólo los presidentes autonómicos votan' }; if (!['si', 'abs', 'no'].includes(voto)) return { ok: false, msg: 'Voto no válido' }; a.votos[J.region] = voto; return { ok: true, msg: 'Tu comunidad vota: ' + { si: 'a favor', abs: 'abstención', no: 'en contra' }[voto] + '.' }; }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const pm = E => E.jugador.pais === 'ES' && E.paises.ES.gob.pm === 'J' ? true : 'Sólo el presidente del Gobierno';
  R({ id: 'convocar_conferencia', nombre: 'Convocar la Conferencia de Presidentes', icono: '🏛', costo: 2, desc: 'Presidente del Gobierno: reúne a los presidentes autonómicos para pactar un asunto.', disponible: pm, ejecutar: (E, a) => Cf.abrir(E, a.tema, true) });
  R({ id: 'persuadir_comunidad', nombre: 'Negociar con una comunidad', icono: '🤝', desc: 'Intenta que un presidente autonómico apoye el acuerdo.', disponible: pm, ejecutar: (E, a) => Cf.persuadir(E, a.c) });
  R({ id: 'cerrar_conferencia', nombre: 'Cerrar la conferencia y votar', icono: '✅', costo: 0, desc: 'Se cuentan los votos de las comunidades.', disponible: pm, ejecutar: E => Cf.cerrar(E) || { ok: false, msg: 'No hay conferencia' } });
  R({ id: 'votar_conferencia', nombre: 'Votar en la Conferencia de Presidentes', icono: '🗳', costo: 0, desc: 'Presidente autonómico: fija el voto de tu comunidad.', disponible: E => E.jugador.cargo === 'presauto' ? true : 'Sólo los presidentes autonómicos', ejecutar: (E, a) => Cf.miVoto(E, a.voto) });
  C.Tiempo.registrar('conferencia', { turno: Cf.turno }, 54);
})(window.ESP);

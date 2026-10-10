/* Crisis en directo: nacionales, autonómicas y municipales con decisiones por horas.
   Catálogo en data/crisis-directo.js. Si eres quien decide (presidente del Gobierno, presidente autonómico o alcalde/sa) se abre un modal paso a paso;
   si no, la gestión la resuelve la IA y se refleja en la aprobación del gobierno correspondiente.
   Estado: E.esp.cv = { act[], hist[], ult:{ambito:t}, cd:{id:t} }; E.esp.pendienteCrisisV = uid. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const ARQ = { firme: ['🛡️', 'Firmeza'], dialogo: ['🤝', 'Diálogo'], tecnico: ['🔧', 'Técnicos'], popular: ['📣', 'Gesto popular'], esquivar: ['🙈', 'Esquivar'] };
  const MORT = new Set(['cv_atentado', 'cv_tren', 'cv_terremoto', 'cv_alimentaria', 'cv_quimica', 'cv_derrumbe', 'cv_fiestas', 'cv_legionela', 'cv_incendio_ac']);
  const SEV = [0.7, 1, 1.3];
  const Cv = C.CrisisDirecto = {
    ARQ,
    asegurar(E) { if (!E.esp.cv) E.esp.cv = { act: [], hist: [], ult: {}, cd: {} }; return E.esp.cv; },
    cat(id) { return D().crisisDirecto.find(x => x.id === id); },
    /* Ministerio (nacionales) o consejería (autonómicas) al que le toca cada crisis: su titular la gestiona en lugar del presidente/a. */
    SECTOR: { cv_atentado: ['int'], cv_ciber: ['int', 'dig'], cv_tren: ['tpt'], cv_vertido: ['amb'], cv_espionaje: ['def'], cv_huelgatrans: ['tra', 'tpt'], cv_alimentaria: ['sal'], cv_rehenes: ['ext'], cv_terremoto: ['int'], cv_deepfake: ['dig', 'pre'], cv_datos: ['dig'], cv_frontera: ['def'], cv_temporal: ['int'], cv_sentencia: ['jus'], cv_estafa: ['eco', 'hac'], cv_porcina: ['agr'], cv_incendios_multi: ['amb', 'int'], cv_accidente_aereo: ['tpt'],
      cv_incendio_ac: ['amb'], cv_puente: ['mov'], cv_tractorada: ['agr'], cv_urgencias: ['sal'], cv_contratos: ['pre'], cv_legionela: ['sal'], cv_referendo: ['pre'], cv_sequia_ac: ['amb', 'agr'], cv_informatica: ['sal'], cv_colegios: ['edu'], cv_turismofobia: ['emp'], cv_quimica: ['ind', 'int'], cv_pesca: ['agr'], cv_nevada_ac: ['int'], cv_plaga: ['agr'], cv_policia: ['int'], cv_vertedero: ['amb'], cv_minas: ['ind'], cv_universidad: ['uni'] },
    /* ¿Decide el jugador en este ámbito? Presidente/a (nacional), presidente/a autonómico/a, alcalde/sa, y ministros/as y consejeros/as en las crisis de su ramo. */
    decide(E, a, lugar, id) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return false; const sc = id && Cv.SECTOR[id];
      if (a === 'nac') return E.paises.ES.gob.pm === 'J' || !!(sc && J.cargo === 'ministro' && sc.includes(J.ministerio));
      if (a === 'aut') return (J.cargo === 'presauto' && (!lugar || J.region === lugar)) || !!(sc && J.cargo === 'consejero' && lugar && J.region === lugar && sc.includes(J.area));
      if (a === 'mun') { const m = J.muni && E.esp.muni.m[J.muni]; return !!(m && m.pm === 'J' && (!lugar || J.muni === lugar)); }
      return false;
    },
    nombreLugar(E, a, lugar) { return a === 'nac' ? (lugar ? D().ccaa[lugar].nombre : 'España') : a === 'aut' ? D().ccaa[lugar].nombre : E.esp.muni.m[lugar].nombre; },
    elegirLugar(E, s, a) {
      const J = E.jugador;
      if (a === 'nac') { if (s.rg) { const ok = s.rg.filter(x => D().ccaa[x]); return ok.length ? U.pick(ok) : null; } return null; }
      if (a === 'aut') {
        if (J && ['presauto', 'consejero'].includes(J.cargo) && U.chance(0.5) && (!s.rg || s.rg.includes(J.region))) return J.region;
        const rs = (s.rg || C.Territorio.ids()).filter(x => D().ccaa[x] && E.esp.ccaa[x] && E.esp.ccaa[x].gob); return rs.length ? U.pick(rs) : null;
      }
      const mi = J && J.muni && E.esp.muni.m[J.muni]; if (mi && mi.pm === 'J' && U.chance(0.55)) return J.muni;
      const ids = Object.keys(E.esp.muni.m); return ids.length ? U.pick(ids) : null;
    },
    nueva(E, a) {
      const cv = Cv.asegurar(E), t = E.fecha.t, mes = U.hoy().getUTCMonth();
      const pos = D().crisisDirecto.filter(s => s.a === a && (!s.m || s.m.includes(mes)) && t - (cv.cd[s.id] || -99) > 40 && !cv.act.some(x => x.id === s.id));
      if (!pos.length) return null;
      const s = U.pesado(pos, x => x.w), lugar = Cv.elegirLugar(E, s, a); if (a !== 'nac' && !lugar) return null;
      const sev = U.chance(0.15) ? 3 : U.chance(0.45) ? 2 : 1, cr = { uid: U.id('cv'), id: s.id, a, lugar, sev, t0: t, paso: 0, elec: [], log: [], jug: Cv.decide(E, a, lugar, s.id) };
      cv.cd[s.id] = t; cv.ult[a] = t; cv.act.push(cr);
      const nom = Cv.nombreLugar(E, a, lugar), cabeza = s.pasos[0][1].replace('{lugar}', nom);
      C.Noticias.poner(E, 'politica', `${s.n}${a === 'nac' ? '' : ' en ' + nom}: ${cabeza.split('. ')[0]}.`, 'ES', a === 'nac' ? 'central' : a === 'aut' ? 'aut' : 'local');
      if (cr.jug && C.Tutor) C.Tutor.una(E, 'crisis'); if (cr.jug && !E.meta.presim) E.esp.pendienteCrisisV = cr.uid; else Cv.ia(E, cr);
      return cr;
    },
    /* Elige una opción: devuelve la clase del resultado (b = acierto, x = fallo, m = mixto). */
    elegir(E, cr, k) {
      const s = Cv.cat(cr.id), p = s.pasos[cr.paso], op = p[4].find(o => o[0] === k); if (!op) return null;
      const cls = k === p[2] ? 'b' : k === p[3] ? 'x' : 'm', linea = cls === 'b' ? p[5] : cls === 'x' ? p[6] : 'La medida surte un efecto parcial: algunas cosas mejoran y otras no.';
      cr.elec.push({ k, cls }); cr.log.push({ h: p[0], opc: op[1], cls, txt: linea }); cr.paso++;
      return { cls, linea, fin: cr.paso >= s.pasos.length };
    },
    puntua(cr) { let v = 0; for (const e of cr.elec) v += e.cls === 'b' ? 1 : e.cls === 'x' ? -1 : 0.2; return clamp(v / Math.max(1, cr.elec.length) + U.gauss(0, 0.12), -1, 1); },
    /* Resolución automática (IA o delegada). acierto = probabilidad de elegir la mejor opción. */
    ia(E, cr, acierto) {
      const s = Cv.cat(cr.id), pa = acierto != null ? acierto : 0.45; while (cr.paso < s.pasos.length) { const p = s.pasos[cr.paso], r = U.rf(0, 1); const k = r < pa ? p[2] : r < pa + (1 - pa) * 0.45 ? p[3] : p[4].find(o => o[0] !== p[2] && o[0] !== p[3])[0]; Cv.elegir(E, cr, k); }
      return Cv.cerrar(E, cr);
    },
    cerrar(E, cr) {
      const cv = Cv.asegurar(E), s = Cv.cat(cr.id), V = Cv.puntua(cr), m = SEV[cr.sev - 1], J = E.jugador, g = E.paises.ES.gob, nom = Cv.nombreLugar(E, cr.a, cr.lugar);
      cr.V = V; cr.cerrada = true; const bien = V > 0.3, mal = V < -0.1;
      const vict = MORT.has(cr.id) ? Math.max(0, Math.round(cr.sev * U.ri(0, 9) * (0.9 - V * 0.8))) : 0, dano = Math.round(cr.sev * U.ri(20, 300) * (1.1 - V * 0.8)); cr.vict = vict; cr.dano = dano;
      if (cr.a === 'nac') { g.aprob = clamp(g.aprob + V * 4 * m, 5, 90); g.estab = clamp(g.estab + V * 2 * m, 0, 100); if (cr.jug) C.Personaje.cambiar(E, { prestigio: V * 4 * m, pop: V * 3 * m }, true); if (cr.lugar && E.esp.ccaa[cr.lugar]) { const rc = E.esp.ccaa[cr.lugar]; rc.relM = clamp(rc.relM + V * 3, 0, 100); } }
      else if (cr.a === 'aut') { const rc = E.esp.ccaa[cr.lugar]; if (rc && rc.gob) { rc.gob.aprob = clamp(rc.gob.aprob + V * 5 * m, 5, 90); rc.gob.estab = clamp(rc.gob.estab + V * 3 * m, 0, 100); } if (cr.jug) C.Personaje.cambiar(E, { prestigio: V * 3 * m, pop: V * 2.5 * m }, true); }
      else { const mu = E.esp.muni.m[cr.lugar]; if (mu) mu.aprob = clamp(mu.aprob + V * 6 * m, 20, 85); if (cr.jug) C.Personaje.cambiar(E, { prestigio: V * 2.5 * m, pop: V * 2 * m }, true); }
      const juicio = bien ? 'La gestión es elogiada' : mal ? 'La gestión se considera un fracaso' : 'La gestión recibe valoraciones dispares';
      C.Noticias.poner(E, 'politica', `Fin de «${s.n.toLowerCase()}»${cr.a === 'nac' ? '' : ' en ' + nom}: ${vict ? vict + ' víctimas y ' : ''}${dano} millones en daños. ${juicio}.`, 'ES', cr.a === 'nac' ? 'central' : cr.a === 'aut' ? 'aut' : 'local');
      if (cr.jug && C.Dilemas) { C.Dilemas.registrar(E, 'crisis', `${s.n}: ${juicio.toLowerCase()}`, Math.round(V * 4 * 10) / 10); C.Dilemas.asegurar(E).memoria.unshift({ id: U.id('mm'), t: E.fecha.t, tipo: 'crisis', txt: `gestionaste «${s.n.toLowerCase()}» ${bien ? 'con acierto' : 'con torpeza'}`, bien, cobrado: false }); }
      cv.hist.unshift({ uid: cr.uid, id: cr.id, n: s.n, ic: s.ic, a: cr.a, lugar: nom, t: E.fecha.t, V, vict, dano, jug: cr.jug, log: cr.log }); if (cv.hist.length > 30) cv.hist.length = 30;
      cv.act = cv.act.filter(x => x !== cr); if (E.esp.pendienteCrisisV === cr.uid) E.esp.pendienteCrisisV = null;
      return { V, vict, dano, juicio };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const cv = Cv.asegurar(E), t = E.fecha.t, aj = C.Ajustes ? C.Ajustes.get(E) : { eventos: 1 };
      if (E.esp.pendienteCrisisV && !cv.act.some(x => x.uid === E.esp.pendienteCrisisV)) E.esp.pendienteCrisisV = null;
      if (E.esp.pendienteCrisisV) return;
      const prob = { nac: 0.011, aut: Cv.decide(E, 'aut') ? 0.022 : 0.013, mun: Cv.decide(E, 'mun') ? 0.022 : 0.013 };
      for (const a of ['nac', 'aut', 'mun']) { if (t - (cv.ult[a] || -99) < 6) continue; if (U.chance(prob[a] * aj.eventos * (aj.crisis || 1))) { const cr = Cv.nueva(E, a); if (cr && E.esp.pendienteCrisisV) break; } }
      // Postura ante las crisis nacionales cuando no gobiernas
      if (C.Dilemas && cv.hist[0] && cv.hist[0].a === 'nac' && !cv.hist[0].jug && !cv.hist[0].postura && t - cv.hist[0].t <= 1 && J.rol && U.chance(0.4)) { cv.hist[0].postura = true; const Dl = C.Dilemas.asegurar(E); if (Dl.act.length < 2 && !Dl.act.some(x => x.id === 'crisisPostura')) { const x = C.Dilemas.nuevo(E, 'crisisPostura'); if (x) x.nom = cv.hist[0].n; } }
    }
  };
  C.Tiempo.registrar('crisisDirecto', { turno: Cv.turno }, 43);
  // Acción de la agenda: abrir una crisis pendiente si se cerró el modal
  C.Acciones.registrar({ id: 'delegar_crisis', nombre: 'Delegar la crisis en tu jefe de gabinete', icono: '🧑‍💼', costo: 0, grupo: 'nacional', desc: 'Tu jefe de gabinete resuelve la crisis en directo: acierta más si tiene buenas competencias.', disponible: E => E.esp.pendienteCrisisV ? true : 'No hay ninguna crisis en directo pendiente', ejecutar: E => { const cv = Cv.asegurar(E), cr = cv.act.find(x => x.uid === E.esp.pendienteCrisisV); if (!cr) return { ok: false, msg: 'No hay crisis pendiente' }; const j = C.Jefe && C.Jefe.asegurar(E).jefe; const pa = clamp(0.4 + (j ? (j.gestion || 5) / 25 : 0), 0.35, 0.8); const r = Cv.ia(E, cr, pa); return { ok: true, msg: `Tu equipo gestiona la crisis: ${r.juicio.toLowerCase()}.` }; } });
})(window.ESP);

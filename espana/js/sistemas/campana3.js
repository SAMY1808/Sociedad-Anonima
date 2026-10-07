/* Campaña viva: fases con sucesos, indecisos que se decantan, dosieres (investigar y publicar), mitin de cierre y ataques del rival.
   Estado dentro de cada campaña: camp.v3 = { dossier:{pid:0-10}, indecisos, cierre, fase, rivalAt }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, Ca = C.Campana;
  const FASES = [['arranque', '🖼️ Arranque', 7], ['carrera', '🏃 Carrera', 4], ['debate', '🎙 Debate y sondeos', 2], ['recta', '🏁 Recta final', 1]];
  const LUGARES = { gran_ciudad: ['Gran ciudad', '🏙️', 4, 1.4, 0.8], plaza: ['Plaza de toros / pabellón', '🏟️', 6, 1.7, 1.2], pueblo: ['Pueblo emblemático', '🏘️', 1.5, 0.9, 0.3], online: ['Cierre digital', '💻', 1, 0.6, 0.1] };   // nombre, icono, coste M€, momentum, riesgo
  const V3 = C.Campana3 = {
    FASES, LUGARES,
    v3(camp) { if (!camp.v3) camp.v3 = { dossier: {}, indecisos: camp.ambito === 'gen' ? 24 : 20, cierre: false, fase: null, rivalAt: 0, hitos: {} }; return camp.v3; },
    fase(E, camp) { const sem = camp.tVoto - E.fecha.t; const f = FASES.find(x => sem >= x[2]); return f ? f[0] : 'recta'; },
    faseInfo(E, camp) { const k = V3.fase(E, camp); return FASES.find(x => x[0] === k) || FASES[3]; },
    rival(E) { const P = E.paises.ES, J = E.jugador; return P.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac').sort((a, b) => (E.partidos[b].popN || 0) - (E.partidos[a].popN || 0))[0]; },
    /* Turno semanal de la campaña (se engancha a Campana.turnoCamp). */
    turno(E, camp) {
      const v = V3.v3(camp), J = E.jugador, t = E.fecha.t, sem = camp.tVoto - t, tot = Math.max(3, camp.tVoto - camp.t0), gen = camp.ambito === 'gen';
      // Los indecisos se van decantando
      const antes = v.indecisos; v.indecisos = clamp(v.indecisos - (tot > 0 ? (gen ? 24 : 20) * 0.85 / tot : 3) * U.rf(0.7, 1.3), 3, 40);
      // Cambio de fase
      const f = V3.fase(E, camp); if (v.fase !== f) { v.fase = f; const info = FASES.find(x => x[0] === f); camp.sucesos.unshift({ t, txt: `Entramos en ${info[1].replace(/^\S+\s/, '').toLowerCase()}.` }); if (J && J.pais === 'ES' && gen && !E.meta.presim) V3.eventoFase(E, f); }
      // El rival te ataca (IA)
      if (J && J.pais === 'ES' && gen && !E.meta.presim && v.dossier && U.chance(0.1) && sem >= 1 && E.eventos.pendientes.length === 0) { const def = C.Eventos.def('camp3_ataque'); if (def && !C.Eventos.enfriado(E, def)) C.Eventos.disparar(E, def); }
      // La IA gasta en dosieres
      for (const k of E.paises.ES.partidos) if (E.partidos[k].amb === 'nac' && (!J || k !== J.partido)) { v.dossier[k] = Math.min(10, (v.dossier[k] || 0) + (U.chance(0.2) ? 1 : 0) * 0); }
      // Sucesos interactivos aleatorios durante toda la campaña (se suman a los clásicos)
      if (J && J.pais === 'ES' && gen && !E.meta.presim && sem >= 1 && E.eventos.pendientes.length === 0 && U.chance(0.34)) {
        const cand = C.DATA.eventos.filter(d => /^camp3_/.test(d.id) && d.peso > 0 && !C.Eventos.enfriado(E, d) && (() => { try { return d.req(E, J, E.paises.ES); } catch (e) { return false; } })());
        const def = U.pesado(cand, d => d.peso); if (def) C.Eventos.disparar(E, def);
      }
    },
    eventoFase(E, f) {
      const k = { arranque: 'camp3_arranque', debate: null, recta: 'camp3_recta' }[f]; const t = E.fecha.t, camp = Ca.cur(E);
      if (k && camp) { const def = C.Eventos.def(k); if (def && !C.Eventos.enfriado(E, def)) C.Eventos.disparar(E, def); }
      if (camp && camp.tVoto - t === 1) { const def = C.Eventos.def('camp3_reflexion'); if (def && !C.Eventos.enfriado(E, def)) C.Eventos.disparar(E, def); }
    },
    /* ── Acciones ── */
    investigar(E, pid) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp || camp.ambito !== 'gen') return { ok: false, msg: 'Sólo en la campaña de las generales' }; if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige un rival' };
      const v = V3.v3(camp); if (v.dossier[pid] >= 10) return { ok: false, msg: 'Ya tienes todo el material posible' }; const x = 1.2 + (J.atrib.gestion + J.atrib.negociacion) / 10;
      v.dossier[pid] = clamp((v.dossier[pid] || 0) + x, 0, 10); return { ok: true, msg: `Tu equipo avanza en el dosier sobre ${E.partidos[pid].sigla}: ${U.d1(v.dossier[pid])}/10.` };
    },
    publicar(E, pid) {
      const camp = Ca.cur(E), J = E.jugador; if (!camp || camp.ambito !== 'gen') return { ok: false, msg: 'Sólo en la campaña de las generales' }; if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige un rival' };
      const v = V3.v3(camp), p = v.dossier[pid] || 0, sem = camp.tVoto - E.fecha.t; if (p < 2) return { ok: false, msg: 'Aún no tienes material suficiente: sigue investigando' };
      const bono = sem <= 1 ? 1.3 : sem <= 3 ? 1.1 : 0.9, dv = (0.35 + p * 0.17) * bono, back = clamp(0.2 - J.atrib.integridad / 45 + (p < 4 ? 0.35 : 0) + (sem <= 1 ? 0.08 : 0), 0.04, 0.6);
      v.dossier[pid] = 0;
      if (U.chance(back)) { Ca.mover(E, J.partido, -1.1, `${E.partidos[J.partido].sigla} acusado de lanzar un montaje contra ${E.partidos[pid].sigla}.`); C.Personaje.cambiar(E, { prestigio: -2 }, true); return { ok: true, exito: false, msg: 'El dosier se desinfla: dicen que es un montaje y se te vuelve en contra.' }; }
      Ca.mover(E, pid, -dv, `Un dosier sacude a ${E.partidos[pid].sigla}.`); Ca.mover(E, J.partido, 0.12 * p / 5); C.Noticias.poner(E, 'politica', `Un dosier sobre ${E.partidos[pid].sigla} copa la campaña.`, 'ES');
      return { ok: true, msg: `Publicas el dosier: ${E.partidos[pid].sigla} pierde ${U.d1(dv)} puntos de impulso.` };
    },
    mitinCierre(E, lugar) {
      const camp = Ca.cur(E), J = E.jugador, L = LUGARES[lugar]; if (!camp || camp.ambito !== 'gen') return { ok: false, msg: 'Sólo en la campaña de las generales' }; if (!L) return { ok: false, msg: 'Elige un lugar' };
      const v = V3.v3(camp), sem = camp.tVoto - E.fecha.t; if (v.cierre) return { ok: false, msg: 'Ya has hecho el mitin de cierre' }; if (sem > 2) return { ok: false, msg: 'El mitin de cierre se hace en las dos últimas semanas' };
      const coste = L[2] * camp.escala; if (Ca.libre(camp) < coste) return { ok: false, msg: `No te queda presupuesto (${L[2]} M€)` };
      camp.presup.gastado += coste; v.cierre = true; const o = (J.atrib.oratoria + J.atrib.carisma) / 20, dv = L[3] * (0.7 + o * 0.7), riesgo = L[4] * 0.3;
      if (U.chance(riesgo * 0.6)) { Ca.mover(E, J.partido, dv * 0.2, `${E.partidos[J.partido].sigla} cierra la campaña con un acto deslucido.`); return { ok: true, exito: false, msg: 'El mitin sale flojo: poca asistencia y mala imagen.' }; }
      Ca.mover(E, J.partido, dv, `${E.partidos[J.partido].sigla} cierra la campaña con un gran acto en ${L[0].toLowerCase()}.`); camp.movil[J.partido] = clamp((camp.movil[J.partido] || 0) + 0.35, 0, 2); v.indecisos = Math.max(3, v.indecisos - 2);
      return { ok: true, msg: `Gran mitin de cierre (${L[0].toLowerCase()}): +${U.d1(dv)} de impulso y más movilización.` };
    }
  };
  // Engancha el turno de la campaña y los consejos del asesor
  const tc = Ca.turnoCamp; Ca.turnoCamp = function (E, camp) { const r = tc.apply(this, arguments); try { V3.turno(E, camp); } catch (e) { console.error('[campaña viva]', e); } return r; };
  const cs = Ca.consejos; Ca.consejos = function (E, camp) {
    const out = cs.apply(this, arguments); camp = camp || Ca.cur(E); if (!camp || camp.ambito !== 'gen') return out; const v = V3.v3(camp), sem = camp.tVoto - E.fecha.t, r = V3.rival(E);
    if (r && (v.dossier[r] || 0) >= 4) out.unshift({ icono: '🗂️', txt: `Tu dosier sobre ${E.partidos[r].sigla} está en ${U.d1(v.dossier[r])}/10: publícalo en la recta final.`, accion: 'publicar_dossier', args: { pid: r }, label: 'Publicar', prio: 1 });
    else if (r && sem > 2 && (v.dossier[r] || 0) < 4) out.push({ icono: '🔎', txt: `Investiga a ${E.partidos[r].sigla}: un dosier a tiempo puede cambiar la campaña.`, accion: 'investigar_rival', args: { pid: r }, label: 'Investigar', prio: 5 });
    if (!v.cierre && sem <= 2) out.unshift({ icono: '🎤', txt: 'Planifica el mitin de cierre: es el último gran golpe de efecto de la campaña.', accion: 'mitin_cierre', args: { lugar: 'gran_ciudad' }, label: 'Gran ciudad', prio: 0 });
    return out.sort((a, b) => a.prio - b.prio).slice(0, 8);
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'campana', disponible: E => E.jugador.pais === 'ES' && Ca.cur(E) && Ca.cur(E).ambito === 'gen' ? true : 'Sólo durante la campaña de las generales' }, o));
  R({ id: 'investigar_rival', nombre: 'Investigar a un rival', icono: '🔎', desc: 'Tu equipo recopila material sobre un rival para un dosier de campaña.', ejecutar: (E, a) => V3.investigar(E, a.pid) });
  R({ id: 'publicar_dossier', nombre: 'Publicar un dosier', icono: '🗂️', costo: 2, desc: 'Lanzas el dosier: más efecto cuanto mejor material y cuanto más tarde, pero riesgo de que parezca un montaje.', ejecutar: (E, a) => V3.publicar(E, a.pid) });
  R({ id: 'mitin_cierre', nombre: 'Mitin de cierre de campaña', icono: '🎤', costo: 2, desc: 'El gran acto final de las dos últimas semanas: impulso, movilización y menos indecisos.', ejecutar: (E, a) => V3.mitinCierre(E, a.lugar || 'gran_ciudad') });
})(window.ESP);

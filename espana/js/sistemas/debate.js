/* Debate televisado en directo: cuatro temas más un cierre, con tono a elegir (propuesta, ataque, ironía, datos) frente al rival principal.
   El resultado alimenta Campana.celebrarDebate (orden final y efecto en la campaña). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const TONOS = { propuesta: ['📋', 'Propuesta', 'Seguro, mejora con tu oratoria.'], ataque: ['⚔️', 'Ataque', 'Brilla si el rival es débil en el tema; si no, rebota.'], ironia: ['😏', 'Ironía', 'Depende de tu carisma: gran golpe o gran desastre.'], datos: ['📊', 'Datos', 'Poco riesgo, apoya en tu gestión.'] };
  const Db = C.Debate = {
    TONOS,
    /* Ventaja del jugador en un tema, entre −1 y 1. */
    ventaja(E, tema) {
      const J = E.jugador, P = E.paises.ES, g = P.gob, gob = g.partido === J.partido, ec = P.ec; let v = 0;
      if (tema === 'eco') v = clamp((ec.crec - 1.8) / 2 - (ec.paro - 11) / 10, -1, 1) * (gob ? 1 : -1);
      else if (tema === 'vivienda') v = clamp(-((C.Estructural ? C.Estructural.esfuerzo(E) : 30) - 30) / 30, -1, 1) * (gob ? 1 : -1);
      else if (tema === 'corrupcion') { const cs = C.Corrupcion ? C.Corrupcion.asegurar(E).casos.filter(c => c.fase !== 'cerrado') : []; const n = k => cs.filter(c => c.pid === k).length; v = clamp((n(Db._rival) - n(J.partido)) * 0.45, -1, 1); }
      else if (tema === 'territorio') v = clamp((g.estab - 50) / 50, -1, 1) * (gob ? 1 : -1);
      else v = clamp((E.partidos[J.partido].eu - E.partidos[Db._rival].eu) / 120, -0.5, 0.5);
      return Math.round(v * 100) / 100;
    },
    preparar(E, camp) {
      const J = E.jugador, Ca = C.Campana, ps = Ca.participantes(E, camp).filter(k => k !== J.partido);
      let rival = C.Nemesis && C.Nemesis.asegurar(E).pid && ps.includes(C.Nemesis.asegurar(E).pid) ? C.Nemesis.asegurar(E).pid : ps.slice().sort((a, b) => (E.partidos[b].popN || E.partidos[b].pop) - (E.partidos[a].popN || E.partidos[a].pop))[0] || ps[0];
      if (C.Tutor) C.Tutor.una(E, 'debate'); Db._rival = rival; const lid = Ca.lideres(E, camp, rival);
      const temas = [['eco', '💶 Economía y empleo', 'La moderadora abre con el paro y el coste de la vida: «¿Qué ha hecho —o hará— usted por las familias?»'], ['vivienda', '🏠 Vivienda', '«El alquiler devora los sueldos. ¿Qué propone?»'], ['corrupcion', '⚖️ Corrupción e instituciones', '«Los casos judiciales erosionan la confianza. ¿Qué responsabilidad asume su partido?»'], Ca && camp.ambito === 'aut' ? ['territorio', '🗺 Autogobierno y financiación', '«¿Cuál es su modelo de financiación y de relación con Madrid?»'] : ['territorio', '🏛 Territorio y estabilidad', '«¿Cómo garantizará un Gobierno estable y la convivencia territorial?»']];
      const rondas = temas.map(t => ({ tema: t[0], titulo: t[1], q: t[2], v: Db.ventaja(E, t[0]) })); rondas.push({ tema: 'cierre', titulo: '🎤 Alegato final', q: 'Un minuto para convencer a los indecisos.', v: 0 });
      return { rival, rivalNombre: lid ? lid.n : E.partidos[rival].sigla, rondas, i: 0, log: [], sj: 0, sr: 0 };
    },
    ronda(E, st, tono) {
      const J = E.jugador, a = J.atrib, r = st.rondas[st.i], rv = E.politicos[E.partidos[st.rival].lider], ruido = s => U.gauss(0, s); let pj;
      const v = r.tema === 'cierre' ? clamp((st.sj - st.sr) / 3, -0.4, 0.4) : r.v;
      if (tono === 'propuesta') pj = 0.5 + v * 0.3 + a.oratoria / 10 * 0.25 + ruido(0.12);
      else if (tono === 'ataque') pj = 0.32 + v * 0.55 + a.carisma / 10 * 0.15 + ruido(0.32);
      else if (tono === 'ironia') pj = 0.32 + a.carisma / 10 * 0.35 + ruido(0.4);
      else pj = 0.45 + (a.gestion || 3) / 10 * 0.25 + v * 0.15 + ruido(0.08);
      const pr = 0.42 - v * 0.25 + ((rv ? rv.c : 55) / 100) * 0.15 + ruido(0.18);
      if (C.Vida) pj -= Math.max(0, (C.Vida.asegurar(E).estres - 70) / 150);
      pj = clamp(pj, 0, 1.2); const d = pj - pr, res = d > 0.07 ? 'gana' : d < -0.07 ? 'pierde' : 'empate', momento = d > 0.35 ? 'estrella' : d < -0.35 ? 'pifia' : null;
      st.sj += pj; st.sr += pr; const nom = st.rivalNombre;
      const T = { gana: { propuesta: 'Tu propuesta convence al plató y a la audiencia.', ataque: `Tu ataque deja a ${nom} sin respuesta.`, ironia: 'La ironía funciona: risas y aplausos.', datos: `Tus datos desmontan el relato de ${nom}.` }, pierde: { propuesta: `${nom} desmonta tu propuesta con un solo dato.`, ataque: `${nom} esquiva el golpe y te lo devuelve con intereses.`, ironia: 'La ironía suena fuera de tono y se vuelve contra ti.', datos: `${nom} te acusa de esconderte tras las cifras.` }, empate: { propuesta: 'Un intercambio correcto, sin vencedor claro.', ataque: 'Cruce de reproches sin resultado.', ironia: 'Ironía y contraironía: nadie se impone.', datos: 'Cifras contra cifras: tablas.' } };
      const out = { r, tono, pj, pr, res, momento, texto: T[res][tono] + (momento === 'estrella' ? ' ¡Momento estrella de la noche!' : momento === 'pifia' ? ' Es el momento más comentado… y no para bien.' : '') }; st.log.push(out); st.i++; return out;
    },
    fin(E, st, camp) {
      const J = E.jugador, n = st.rondas.length, avg = st.sj / n, score = 0.3 + avg * 0.75 + (st.log.filter(x => x.momento === 'estrella').length - st.log.filter(x => x.momento === 'pifia').length) * 0.05;
      const orden = C.Campana.celebrarDebate(E, 'propuestas', camp, score), pos = orden.indexOf(J.partido), gan = st.log.filter(x => x.res === 'gana').length;
      if (C.Dilemas) C.Dilemas.registrar(E, 'debate', `Debate televisado (${gan}/${n} rondas ganadas): quedas ${pos + 1}º`, [3, 1, -1.5, -3][Math.min(pos, 3)]);
      if (C.Nemesis && st.rival === C.Nemesis.asegurar(E).pid) { C.Nemesis.nota(E, `Debate televisado con ${st.rivalNombre}: ${st.sj > st.sr ? 'te impones' : 'pierdes el cara a cara'}.`); C.Nemesis.subir(E, st.sj > st.sr ? 4 : 2); }
      return { orden, pos, gan, n, score };
    }
  };
})(window.ESP);

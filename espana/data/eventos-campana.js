/* Sucesos interactivos de campaña electoral: tropiezos, encuestas, ataques, entrevistas, pegada de carteles, recta final y jornada de reflexión.
   Se añaden a ESP.DATA.eventos; los de fase (camp3_arranque, camp3_recta, camp3_reflexion) los dispara la campaña. */
window.ESP = window.ESP || {};
(function (C) {
  const U = () => C.U, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Pj = () => C.Personaje, pa = E => E.partidos[E.jugador.partido];
  const enCamp = (E, J) => { const cp = J.pais === 'ES' && C.Campana.cur(E); return !!cp && cp.tVoto - E.fecha.t >= 1; };
  const mover = (E, J, dv, txt) => C.Campana.mover(E, J.partido, dv, txt);
  const rival = (E, J) => { const P = E.paises.ES; return P.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac').sort((a, b) => (E.partidos[b].popN || 0) - (E.partidos[a].popN || 0))[0]; };
  const sig = (E, k) => E.partidos[k].sigla;
  /* La campaña puede haber terminado cuando se resuelve el suceso: un respaldo inocuo evita errores. */
  const cc = E => C.Campana.cur(E) || { util: {}, movil: {}, v3: null, presup: { gastado: 0 }, escala: 1 };
  const libre = E => { const c = C.Campana.cur(E); return c ? C.Campana.libre(c) : 0; };
  const gasta = (E, M) => { const c = C.Campana.cur(E); if (c) c.presup.gastado += M * c.escala; };
  const ev = o => C.DATA.eventos.push(Object.assign({ peso: 1, cd: 14, req: enCamp }, o));

  ev({ id: 'camp3_gaffe', titulo: 'Un tropiezo del candidato', icono: '🎤', peso: 1.8,
    texto: (E, J) => `En un acto, una frase tuya se hace viral y la oposición la recorta en vídeo. Los medios te piden una rectificación. Quedan ${C.Campana.cur(E).tVoto - E.fecha.t} semanas.`,
    opciones: [
      { t: 'Pedir disculpas sin matices', ef: (E, J) => { mover(E, J, -0.2, `${pa(E).sigla} rectifica tras un tropiezo.`); Pj().cambiar(E, { prestigio: 1.2 }); return 'El asunto se enfría rápido y ganas en credibilidad.'; } },
      { t: 'Decir que se ha sacado de contexto', ef: (E, J) => { if (U().chance(0.5)) { mover(E, J, 0.1); return 'La defensa funciona: el vídeo completo te favorece.'; } mover(E, J, -0.8, `${pa(E).sigla} tarda en rectificar y el tropiezo crece.`); return 'No cuela: el tropiezo se agranda.'; } },
      { t: 'Contraatacar al rival con otro vídeo', ef: (E, J) => { const r = rival(E, J); if (U().chance(0.45)) { mover(E, J, 0.3); C.Campana.mover(E, r, -0.7, `${sig(E, r)} responde a un vídeo viral.`); return 'La guerra de vídeos te sale bien.'; } mover(E, J, -0.6); Pj().cambiar(E, { prestigio: -1 }); return 'Se percibe como barro y te penaliza.'; } }] });
  ev({ id: 'camp3_encuesta_bomba', titulo: 'Una encuesta lo cambia todo', icono: '📊', peso: 1.7,
    texto: (E, J) => `Un sondeo sorprendente publicado esta mañana ${U().chance(0.5) ? 'da la victoria a tu rival por un margen inesperado' : 'te sitúa en una posición mucho mejor de la prevista'}; los analistas hablan de «vuelco».`,
    opciones: [
      { t: 'Movilizar: «las encuestas no votan»', ef: (E, J) => { mover(E, J, 0.4, `${pa(E).sigla} llama a movilizarse ante la encuesta.`); const c = C.Campana.cur(E); c.movil[J.partido] = clamp((c.movil[J.partido] || 0) + 0.3, 0, 2); return 'Tu electorado se moviliza.'; } },
      { t: 'Restar importancia con calma', ef: (E, J) => { Pj().cambiar(E, { prestigio: 0.8 }); mover(E, J, 0.05); return 'Mantienes la compostura; el efecto es pequeño.'; } },
      { t: 'Apelar al voto útil', ef: (E, J) => { const c = cc(E); c.util[J.partido] = clamp((c.util[J.partido] || 0) + 0.4, 0, 2); mover(E, J, 0.3, `${pa(E).sigla} apela al voto útil.`); return 'Absorbes voto de partidos pequeños.'; } }] });
  ev({ id: 'camp3_incidente', titulo: 'Incidente en un mitin', icono: '🚨', peso: 1.3,
    texto: (E, J) => `En pleno acto, un grupo de manifestantes irrumpe y hay empujones. Las cámaras lo retransmiten en directo.`,
    opciones: [
      { t: 'Seguir con el discurso y pedir calma', ef: (E, J) => { if (U().chance(0.6)) { mover(E, J, 0.7, `${pa(E).sigla} mantiene la serenidad en un incidente.`); return 'Tu temple es muy comentado: sumas.'; } mover(E, J, -0.2); return 'Pasa sin pena ni gloria.'; } },
      { t: 'Suspender el acto', ef: (E, J) => { mover(E, J, -0.1); Pj().cambiar(E, { prestigio: 0.4 }); return 'Se ve prudente, pero pierdes el foco del día.'; } },
      { t: 'Culpar a un rival de provocación', ef: (E, J) => { const r = rival(E, J); if (U().chance(0.4)) { C.Campana.mover(E, r, -0.8, `${sig(E, r)} acusado de provocar un incidente.`); mover(E, J, 0.3); return 'Cuela a medias y el rival se pone a la defensiva.'; } mover(E, J, -0.5); return 'La acusación se vuelve en tu contra.'; } }] });
  ev({ id: 'camp3_ataque', titulo: 'Tu rival saca un dosier', icono: '🗂️', peso: 2.0,
    texto: (E, J) => `${sig(E, rival(E, J))} publica un dosier con tus contradicciones: votos y declaraciones de hace años. Los medios lo repiten durante todo el día.`,
    opciones: [
      { t: 'Responder con datos, punto por punto', ef: (E, J) => { if (U().chance(0.55 + J.atrib.oratoria * 0.02)) { mover(E, J, 0.2); return 'Desmontas el dosier y sales reforzado.'; } mover(E, J, -0.6, `${pa(E).sigla} no logra desmontar un dosier.`); return 'Se te acumulan las preguntas.'; } },
      { t: 'Ignorarlo', ef: (E, J) => { mover(E, J, -0.45); return 'El ataque se queda sin respuesta unos días.'; } },
      { t: 'Contraatacar con tu propio dosier', ef: (E, J) => { const r = rival(E, J); const c = cc(E); const v3 = c.v3; const p = v3 && v3.dossier[r] || 0; if (p >= 3) { C.Campana.mover(E, r, -0.6 - p * 0.1, `${sig(E, r)} recibe un dosier como respuesta.`); mover(E, J, 0.1); return 'Tu dosier estaba listo: el intercambio os iguala.'; } mover(E, J, -0.4); return 'No tenías suficiente material: queda en una escaramuza.'; } }] });
  ev({ id: 'camp3_prime', titulo: 'Entrevista en prime time', icono: '📺', peso: 1.5,
    texto: (E, J) => `Una gran cadena te ofrece una entrevista de una hora en horario de máxima audiencia, pero con un entrevistador duro. Es una oportunidad… y un riesgo.`,
    opciones: [
      { t: 'Aceptar y prepararte a fondo', ef: (E, J) => { const x = (J.atrib.oratoria + J.atrib.carisma) / 20; if (U().chance(0.35 + x * 0.5)) { mover(E, J, 1.0, `${pa(E).sigla} brilla en una entrevista de máxima audiencia.`); return 'Una gran actuación: miles de indecisos te escuchan.'; } mover(E, J, -0.9, `${pa(E).sigla} naufraga en una entrevista de máxima audiencia.`); return 'La entrevista sale mal y se recorta sin parar.'; } },
      { t: 'Enviar a un portavoz', ef: (E, J) => { mover(E, J, 0.1); return 'Sin riesgos, sin premio.'; } },
      { t: 'Rechazarla y hacer un acto con la militancia', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 20, 99); mover(E, J, 0.15); return 'Reafirmas a los tuyos; los indecisos no te ven.'; } }] });
  ev({ id: 'camp3_baron', titulo: 'Un barón exige protagonismo', icono: '🧑‍💼', peso: 1.1,
    texto: (E, J) => `Un presidente autonómico de tu partido amenaza con quitarse del acto central si no tiene un lugar destacado en el cartel.`,
    opciones: [
      { t: 'Darle el protagonismo que pide', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 2, 20, 99); mover(E, J, 0.2); return 'Se calma y arrastra voto de su territorio.'; } },
      { t: 'Mantener el cartel como estaba', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion - 3, 20, 99); mover(E, J, -0.3, `${pa(E).sigla} sufre una grieta interna en plena campaña.`); return 'Se rompe la foto de unidad.'; } }] });
  ev({ id: 'camp3_cartel', titulo: 'Polémica por un cartel', icono: '🖼️', peso: 0.9,
    texto: (E, J) => `El cartel electoral de tu partido genera una polémica inesperada en redes: unos lo celebran y otros lo ridiculizan.`,
    opciones: [
      { t: 'Abrazar la polémica y viralizarla', ef: (E, J) => { if (U().chance(0.55)) { mover(E, J, 0.6, `El cartel de ${pa(E).sigla} se vuelve viral.`); return 'La broma funciona: sales en todas partes.'; } mover(E, J, -0.3); return 'La broma se agota pronto.'; } },
      { t: 'Retirarlo y sustituirlo (cuesta dinero)', ef: (E, J) => { gasta(E, 3); mover(E, J, 0.1); return 'Cortas la polémica con un coste de campaña.'; } }] });
  ev({ id: 'camp3_calle', titulo: 'Una ola en la calle', icono: '📢', peso: 1.0,
    texto: (E, J) => `Una gran manifestación convocada por organizaciones sociales coincide con la campaña y se alinea con un tema que has defendido.`,
    opciones: [
      { t: 'Sumarte públicamente', ef: (E, J) => { mover(E, J, 0.7, `${pa(E).sigla} se suma a una gran movilización social.`); return 'Ganas la calle, pero te alejas de otros votantes.'; } },
      { t: 'Mostrar respeto sin sumarte', ef: (E, J) => { mover(E, J, 0.2); Pj().cambiar(E, { prestigio: 0.4 }); return 'Una postura equilibrada.'; } }] });
  ev({ id: 'camp3_arranque', titulo: 'Arranca la campaña: pegada de carteles', icono: '🖼️', peso: 0, cd: 60, auto: false, req: () => false,
    texto: (E, J) => `Medianoche: arranca oficialmente la campaña. Es la tradicional pegada de carteles. Quedan ${C.Campana.cur(E).tVoto - E.fecha.t} semanas hasta las urnas.`,
    opciones: [
      { t: 'Acto multitudinario de arranque (cuesta dinero)', ef: (E, J) => { gasta(E, 4); mover(E, J, 0.6, `${pa(E).sigla} arranca la campaña con un gran acto.`); return 'Un arranque potente y mucha foto en los medios.'; } },
      { t: 'Pegada de carteles con la militancia', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 20, 99); mover(E, J, 0.25); return 'Cierras filas con una tradición barata.'; } },
      { t: 'Arranque discreto en redes', ef: (E, J) => { mover(E, J, 0.1); return 'Ahorras fondos; sin grandes titulares.'; } }] });
  ev({ id: 'camp3_recta', titulo: 'Recta final: ¿qué mensaje?', icono: '🏁', peso: 0, cd: 60, auto: false, req: () => false,
    texto: (E, J) => `Faltan sólo dos semanas. Tu estratega te pide fijar el mensaje con el que quieres que te recuerde el elector.`,
    opciones: [
      { t: 'Esperanza: un proyecto de país', ef: (E, J) => { mover(E, J, 0.4); const c = cc(E); c.movil[J.partido] = clamp((c.movil[J.partido] || 0) + 0.25, 0, 2); return 'Movilizas a tu base con ilusión.'; } },
      { t: 'Miedo: «o nosotros o el desastre»', ef: (E, J) => { const c = cc(E); c.util[J.partido] = clamp((c.util[J.partido] || 0) + 0.45, 0, 2); mover(E, J, 0.25); Pj().cambiar(E, { prestigio: -0.6 }); return 'Aprietas el voto útil a costa de crispar.'; } },
      { t: 'Gestión: «los datos lo avalan»', ef: (E, J) => { mover(E, J, 0.25); Pj().cambiar(E, { prestigio: 0.8 }); return 'Un cierre sobrio que transmite solvencia.'; } }] });
  ev({ id: 'camp3_reflexion', titulo: 'Jornada de reflexión', icono: '🤫', peso: 0, cd: 60, auto: false, req: () => false,
    texto: (E, J) => `Es sábado, jornada de reflexión: no se pueden hacer actos ni publicar encuestas. Hay una filtración jugosa contra tu rival que podrías lanzar «por error» en redes.`,
    opciones: [
      { t: 'Respetar la jornada de reflexión', ef: (E, J) => { Pj().cambiar(E, { prestigio: 0.8 }); return 'Pasas el día en silencio; tu imagen institucional sube.'; } },
      { t: 'Lanzar la filtración «anónima»', ef: (E, J) => { const r = rival(E, J); if (U().chance(0.45)) { C.Campana.mover(E, r, -0.9, `Una filtración sacude a ${sig(E, r)} en la jornada de reflexión.`); return 'Funciona: llega justo el sábado.'; } mover(E, J, -0.8, `${pa(E).sigla} acusado de saltarse la jornada de reflexión.`); Pj().cambiar(E, { prestigio: -1.5 }); return 'La Junta Electoral te investiga y se te vuelve en contra.'; } },
      { t: 'Mensaje de movilización en redes', ef: (E, J) => { const c = cc(E); c.movil[J.partido] = clamp((c.movil[J.partido] || 0) + 0.2, 0, 2); return 'Un mensaje cálido a los tuyos, sin saltarte las normas.'; } }] });
  /* Némesis: duelo televisado propuesto por el rival. */
  ev({ id: 'nem_debate', titulo: 'Tu némesis te reta a un cara a cara', icono: '🥊', peso: 0, cd: 40, req: () => false,
    texto: (E, J) => `${C.Nemesis.nombre(E)} te emplaza públicamente a un debate a dos, sin moderadores, en una gran cadena. Los medios ya lo llaman «el duelo del año».`,
    opciones: [
      { t: 'Aceptar y prepararte a fondo', ef: (E, J) => { const o = (J.atrib.oratoria + J.atrib.carisma) / 20; C.Nemesis.subir(E, 5); if (U().chance(clamp(0.38 + o * 0.45, 0.2, 0.85))) { C.Opinion.empujeES(E, C.Nemesis.asegurar(E).pid, -0.05); C.Opinion.empuje(E, J.partido, 0.05, 0.3); Pj().cambiar(E, { prestigio: 2, pop: 1.2 }); return 'Brillas en el duelo y los medios te dan la victoria.'; } C.Opinion.empuje(E, J.partido, -0.03, 0.3); Pj().cambiar(E, { prestigio: -1.5, pop: -0.8 }); return 'El duelo no sale como esperabas: tu rival se lleva el titular.'; } },
      { t: 'Rechazarlo: «no hago el juego a nadie»', ef: (E, J) => { Pj().cambiar(E, { prestigio: -0.4 }); C.Nemesis.subir(E, 2); return 'Te acusan de huir del debate, pero evitas el riesgo.'; } },
      { t: 'Proponer un debate con todos los candidatos', ef: (E, J) => { Pj().cambiar(E, { prestigio: 0.4 }); return 'Contraproposición hábil: el asunto se enfría.'; } }] });
})(window.ESP);
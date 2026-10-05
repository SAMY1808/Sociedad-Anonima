/* Eventos procedurales con decisiones. Cada evento: { id, titulo, icono, peso, cd (semanas de enfriamiento), auto (se dispara al cumplirse req),
   req(E,J,P), ctx(E,J,P) → datos serializables, texto(E,J,P,x), opciones:[{ t, ef(E,J,P,x) → texto de resultado, req? }] } */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};
(function (C) {
  const U = () => C.U, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Pj = () => C.Personaje;
  const pa = E => E.partidos[E.jugador.partido];
  const enGob = (E, J, P) => P.gob.coalicion.includes(J.partido);
  const nom = (E, id) => (E.politicos[id] ? E.politicos[id].n : 'el líder');
  const aprob = (P, d) => { P.gob.aprob = clamp(P.gob.aprob + d, 5, 90); };
  const sectores = { diplomatico: ['ext', 'ter'], abogado: ['jus', 'int'], empresa: ['eco', 'ter'], academico: ['edu', 'sal'], sindical: ['tra', 'sal'], periodista: ['edu', 'cul'], concejal: ['ter', 'int'], activista: ['amb', 'sal'] };
  const eventos = [];
  const ev = o => eventos.push(Object.assign({ peso: 1, cd: 40, req: () => true }, o));

  /* ── Sucesos de campaña electoral (generales) ── */
  const enCamp = (E, J) => J.pais === 'ES' && !!(E.esp.camp && E.esp.camp.activa) && E.esp.camp.tVoto - E.fecha.t >= 1;
  const mover = (E, J, dv, txt) => C.Campana.mover(E, J.partido, dv, txt);
  ev({
    id: 'camp_filtracion', titulo: 'Filtración en plena campaña', icono: '📰', peso: 2.2, cd: 10, req: enCamp,
    texto: (E, J) => `Un medio publica documentos internos sobre la financiación de ${pa(E).sigla}. Faltan ${E.esp.camp.tVoto - E.fecha.t} semanas para las urnas.`,
    opciones: [
      { t: 'Negarlo todo y denunciar una campaña sucia', ef: (E, J) => { if (U().chance(0.55)) { mover(E, J, 0.3, `${pa(E).sigla} desmonta la filtración.`); return 'La estrategia funciona: la filtración se diluye.'; } mover(E, J, -1.4, `${pa(E).sigla} sufre por la filtración.`); Pj().cambiar(E, { prestigio: -2 }); return 'La documentación aparece completa y tu negativa se vuelve en tu contra.'; } },
      { t: 'Pedir perdón y abrir una auditoría', ef: (E, J) => { mover(E, J, -0.5, `${pa(E).sigla} abre una auditoría interna.`); Pj().cambiar(E, { prestigio: 2, pop: 0.5 }); return 'Pierdes algo de ritmo, pero ganas credibilidad.'; } },
      { t: 'Contraatacar con otra filtración', ef: (E, J, P) => { const r = U().pick(P.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac')); if (U().chance(0.5)) { mover(E, J, 0.2); C.Campana.mover(E, r, -1, `${E.partidos[r].sigla} responde a una filtración cruzada.`); return 'La guerra de filtraciones empata la noticia.'; } mover(E, J, -1, `${pa(E).sigla} entra en una guerra de filtraciones.`); return 'Se os vuelve en contra: dos días de portadas desastrosas.'; } }
    ]
  });
  ev({
    id: 'camp_apoyo', titulo: 'Un apoyo inesperado', icono: '🌟', peso: 1.6, cd: 12, req: enCamp,
    texto: (E, J) => `Una figura muy popular y de prestigio ofrece apoyar públicamente a ${pa(E).sigla} en un acto de campaña, aunque su apoyo incomoda a algunos de los tuyos.`,
    opciones: [
      { t: 'Aceptar y exhibirlo en un acto', ef: (E, J) => { mover(E, J, 0.9, `${pa(E).sigla} recibe un apoyo de campaña.`); pa(E).cohesion = clamp(pa(E).cohesion - 2, 20, 99); return 'Sumas puntos con el votante indeciso; en el partido hay quejas.'; } },
      { t: 'Agradecerlo, pero sin foto', ef: (E, J) => { mover(E, J, 0.35); return 'Un respaldo discreto: poco ruido y algo de ayuda.'; } },
      { t: 'Declinar la oferta', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 2, 20, 99); return 'El partido respira tranquilo; la oportunidad pasa de largo.'; } }
    ]
  });
  ev({
    id: 'camp_encuesta_mala', titulo: 'Una encuesta demoledora', icono: '📉', peso: 1.8, cd: 12, req: (E, J) => enCamp(E, J) && C.Campana.ultimaEncuesta(E, 'cis') && C.Campana.ultimaEncuesta(E, 'cis').votos[J.partido] < (E.partidos[J.partido].popN || 0) - 0.5,
    texto: (E, J) => `La última encuesta te da ${U().d1(C.Campana.ultimaEncuesta(E, 'cis').votos[J.partido])} %, por debajo de tu media. La militancia se desmoviliza.`,
    opciones: [
      { t: 'Llamar a la movilización (lanzar un acto de partido)', ef: (E, J) => { C.Campana.movilizar(E); mover(E, J, 0.2); return 'Reúnes a la militancia: el ánimo remonta.'; } },
      { t: 'Cuestionar la encuesta', ef: (E, J) => { if (U().chance(0.4)) { mover(E, J, 0.3); return 'Logras sembrar dudas sobre el sondeo.'; } mover(E, J, -0.4); return 'Nadie te cree: quedas como alguien que no acepta la realidad.'; } },
      { t: 'Cambiar el mensaje de campaña', ef: (E, J) => { mover(E, J, 0.5 * (U().chance(0.55) ? 1 : -1)); return 'Un golpe de timón: puede salir bien o mal.'; } }
    ]
  });
  ev({
    id: 'camp_bulo', titulo: 'Un bulo viral contra tu candidatura', icono: '🤖', peso: 1.2, cd: 14, req: enCamp,
    texto: (E, J) => 'Circula un vídeo manipulado contra tu partido; se comparte miles de veces en una noche.',
    opciones: [
      { t: 'Denunciarlo ante la Junta Electoral', ef: (E, J) => { mover(E, J, -0.2); Pj().cambiar(E, { prestigio: 1.5 }); return 'El bulo se frena, aunque el daño ya está hecho.'; } },
      { t: 'Responder en redes con humor', ef: (E, J) => { if (U().chance(0.5)) { mover(E, J, 0.8, `${pa(E).sigla} gana la batalla de las redes.`); return 'Tu respuesta se hace viral: ganas el relato.'; } mover(E, J, -0.8); return 'La respuesta cae mal: se interpreta como frivolidad.'; } },
      { t: 'Ignorarlo', ef: (E, J) => { mover(E, J, -0.4); return 'El bulo se instala entre indecisos.'; } }
    ]
  });
  ev({
    id: 'camp_oferta_pacto', titulo: 'Ofrecen una coalición de última hora', icono: '🤝', peso: 1.0, cd: 20,
    req: (E, J) => enCamp(E, J) && C.Campana.listasAbiertas(E) && !E.esp.camp.coal && C.Campana.peso(E) && C.Campana.socios(E).some(x => x.p > 0.45),
    ctx: (E, J) => { const s = C.Campana.socios(E).filter(x => x.p > 0.45)[0]; return { k: s ? s.k : null }; },
    texto: (E, J, P, x) => x.k ? `${E.partidos[x.k].nombre} propone concurrir en coalición contigo. Sumaríais votos, con una fuga del 7 %, y los escaños se repartirían según el voto de cada uno.` : 'Nadie ofrece una coalición.',
    opciones: [
      { t: 'Aceptar la coalición', req: (E, J, P, x) => !!x.k, ef: (E, J, P, x) => { const r = C.Campana.pactarCoalicion(E, x.k); return r.msg; } },
      { t: 'Rechazarla', ef: () => 'Decides concurrir en solitario.' }
    ]
  });

  /* ── Políticos y del partido ── */
  ev({
    id: 'escandalo_aliado', titulo: 'Un compañero, imputado', icono: '⚖️', peso: 1.2,
    req: (E, J) => J.cargo !== 'activista' || E.paises[J.pais].escanos[J.partido] > 0,
    ctx: (E, J) => { const m = U().pick(E.parl.miembros.map(i => E.politicos[i]).filter(p => p && p.p === J.partido && p.id !== 'J')); return { n: m ? m.n : 'Un dirigente' }; },
    texto: (E, J, P, x) => `${x.n}, compañero/a de ${pa(E).sigla}, es imputado/a en una investigación por presunta corrupción. Los medios te piden posición.`,
    opciones: [
      { t: 'Exigir su dimisión inmediata', ef: (E, J) => { Pj().cambiar(E, { prestigio: 2, pop: 1.5 }); pa(E).cohesion = clamp(pa(E).cohesion - 2, 20, 99); return 'Tu firmeza gana puntos ante la opinión pública, aunque tensa al partido.'; } },
      { t: 'Defender su presunción de inocencia', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1, pop: -2 }); C.Opinion.empuje(E, J.partido, -0.25); return 'Te acusan de cerrar filas. El partido lo agradece; los votantes, menos.'; } },
      { t: 'Evitar pronunciarte', ef: (E, J) => { Pj().cambiar(E, { prestigio: -1 }); return 'Tu silencio pasa casi inadvertido.'; } }
    ]
  });
  ev({
    id: 'oferta_ministerio', titulo: 'Una llamada del jefe de Gobierno', icono: '📞', peso: 0, auto: true, cd: 80,
    req: (E, J, P) => J.cargo === 'diputado' && enGob(E, J, P) && J.prestigio >= 42 && P.gob.pm !== 'J' && E.fecha.t - P.gob.formado > 6,
    ctx: (E, J, P) => { const pref = sectores[J.trayectoria] || ['eco']; const cand = Object.keys(P.gob.ministros).filter(k => E.politicos[P.gob.ministros[k]] && E.politicos[P.gob.ministros[k]].p === J.partido); const k = cand.find(m => pref.includes(m)) || U().pick(cand.length ? cand : Object.keys(P.gob.ministros)); return { min: k }; },
    texto: (E, J, P, x) => `${nom(E, P.gob.pm)} te propone dirigir el ministerio de ${C.DATA.ministerios.find(m => m.id === x.min).nombre} en una remodelación del Ejecutivo.`,
    opciones: [
      { t: 'Aceptar la cartera', ef: (E, J, P, x) => { const g = P.gob; const viejo = g.ministros[x.min]; if (viejo && viejo !== 'J' && E.politicos[viejo]) E.politicos[viejo].cargo = null; g.ministros[x.min] = 'J'; Pj().sincronizar(E); Pj().cambiar(E, { prestigio: 6, pop: 3 }, true); return 'Juras el cargo como ministro/a. Ahora tienes departamento propio.'; } },
      { t: 'Declinar y seguir en el Parlamento', ef: (E) => { Pj().cambiar(E, { prestigio: -1 }); return 'Declinas la oferta. El jefe de Gobierno toma nota.'; } }
    ]
  });
  ev({
    id: 'crisis_coalicion', titulo: 'Un socio amenaza con romper', icono: '💥', peso: 1.0,
    req: (E, J, P) => P.gob.coalicion.length > 1 && enGob(E, J, P),
    ctx: (E, J, P) => ({ socio: U().pick(P.gob.coalicion.filter(k => k !== J.partido).concat(P.gob.coalicion)) }),
    texto: (E, J, P, x) => `${E.partidos[x.socio].nombre} amenaza con abandonar la coalición si no se atienden sus exigencias en la próxima ley de presupuestos.`,
    opciones: [
      { t: 'Ceder en parte', ef: (E, J, P) => { P.gob.estab = clamp(P.gob.estab + 9, 0, 100); aprob(P, -0.8); Pj().cambiar(E, { prestigio: 1 }); return 'La coalición se estabiliza a cambio de un coste político.'; } },
      { t: 'Negociar con paciencia', ef: (E, J, P) => { const ok = U().chance(0.35 + J.atrib.negociacion * 0.06); P.gob.estab = clamp(P.gob.estab + (ok ? 7 : -5), 0, 100); Pj().cambiar(E, { prestigio: ok ? 2 : -1 }); return ok ? 'Tu mediación salva la legislatura.' : 'La negociación se tuerce y la coalición queda tocada.'; } },
      { t: 'Plantarte: «aquí no se chantajea»', ef: (E, J, P) => { P.gob.estab = clamp(P.gob.estab - 8, 0, 100); Pj().cambiar(E, { pop: 1.5 }); return 'Marcas perfil, pero el Gobierno queda al borde del abismo.'; } }
    ]
  });
  ev({
    id: 'vacante_escano', titulo: 'Queda libre un escaño', icono: '🪑', peso: 0, auto: true, cd: 60,
    req: (E, J, P) => J.cargo === 'activista' && !C.Personaje.esUE(E) && (P.escanos[J.partido] || 0) > 0 && J.prestigio >= 18 && E.fecha.t % 3 === 0,
    texto: (E, J) => `Un diputado de ${pa(E).sigla} renuncia a su acta por motivos personales. Como siguiente en la lista, el escaño es tuyo si lo quieres.`,
    opciones: [
      { t: 'Tomar posesión del escaño', ef: (E, J, P) => { const propios = E.parl.miembros.filter(i => E.politicos[i] && E.politicos[i].p === J.partido && i !== E.partidos[J.partido].lider); const q = propios[propios.length - 1]; const ix = E.parl.miembros.indexOf(q); if (ix >= 0) { E.parl.miembros[ix] = 'J'; if (q !== 'J') delete E.politicos[q]; } else E.parl.miembros.push('J'); J.electo = true; Pj().sincronizar(E); Pj().cambiar(E, { prestigio: 5 }, true); Pj().log(E, 'Accedes al escaño por la renuncia de un compañero.'); return 'Entras en el hemiciclo por la puerta de atrás, pero ya eres diputado/a.'; } },
      { t: 'Rechazarlo', ef: () => 'Dejas pasar la oportunidad.' }
    ]
  });
  ev({
    id: 'congreso_partido', titulo: 'Congreso del partido', icono: '🏟️', peso: 0.8,
    req: (E, J) => J.rol !== 'base' && J.rol !== 'lider',
    texto: (E, J) => `${pa(E).nombre} convoca su congreso y los delegados se dividen entre sectores. Se te pide que apoyes una ponencia política.`,
    opciones: [
      { t: 'Respaldar la línea oficial', ef: (E, J) => { Pj().cambiar(E, { prestigio: 2 }); pa(E).cohesion = clamp(pa(E).cohesion + 3, 20, 99); return 'Sales fortalecido/a ante la dirección.'; } },
      { t: 'Defender una enmienda crítica', ef: (E, J) => { const ok = U().chance(0.3 + J.atrib.oratoria * 0.05); Pj().cambiar(E, { prestigio: ok ? 4 : -2, pop: ok ? 1.5 : 0 }); pa(E).cohesion = clamp(pa(E).cohesion - 1.5, 20, 99); return ok ? 'Tu enmienda gana y te conviertes en referente de un sector.' : 'Tu enmienda cae y quedas señalado.'; } }
    ]
  });
  ev({
    id: 'encuesta_catastrofica', titulo: 'Un sondeo desastroso', icono: '📉', peso: 0.8,
    req: (E, J) => pa(E).pop < pa(E).base - 1.8,
    texto: (E, J) => `Un sondeo coloca a ${pa(E).sigla} ${C.U.d1(pa(E).base - pa(E).pop)} puntos por debajo de su resultado anterior. Cunde el nerviosismo.`,
    opciones: [
      { t: 'Llamar a la calma y a la unidad', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 2, 20, 99); Pj().cambiar(E, { prestigio: 1 }); return 'El partido cierra filas por ahora.'; } },
      { t: 'Pedir un cambio de rumbo', ef: (E, J) => { C.Opinion.empuje(E, J.partido, 0.25); pa(E).cohesion = clamp(pa(E).cohesion - 2.5, 20, 99); Pj().cambiar(E, { prestigio: -1, pop: 1 }); return 'Tu llamada abre un debate interno. Las encuestas respiran.'; } }
    ]
  });
  ev({
    id: 'filtracion_audio', titulo: 'Un audio privado se filtra', icono: '🎙️', peso: 0.7, cd: 80,
    req: (E, J) => J.cargo !== 'activista',
    texto: () => 'Un medio publica una conversación privada en la que haces comentarios poco afortunados sobre colegas y sobre tu propio partido.',
    opciones: [
      { t: 'Pedir disculpas públicas', ef: (E, J) => { Pj().cambiar(E, { pop: -1, prestigio: -1 }); return 'Las disculpas apagan el incendio rápidamente.'; } },
      { t: 'Negarlo todo', ef: (E, J) => { const ok = U().chance(0.3 + J.atrib.carisma * 0.04); Pj().cambiar(E, { pop: ok ? 0 : -4, prestigio: ok ? 0 : -4 }); return ok ? 'La polémica se desvanece.' : 'La negación empeora todo: el audio parece auténtico.'; } },
      { t: 'Contraatacar al medio', ef: (E, J) => { Pj().cambiar(E, { pop: 0.5, prestigio: -2 }); C.Opinion.empuje(E, J.partido, -0.05); return 'Marcas el terreno, pero la prensa no te lo perdonará pronto.'; } }
    ]
  });
  ev({
    id: 'donacion_sospechosa', titulo: 'Una donación incómoda', icono: '💶', peso: 0.6,
    req: (E, J) => J.rol !== 'base',
    texto: (E, J) => `El tesorero de ${pa(E).sigla} te informa de una gran donación de un empresario con intereses pendientes ante la administración.`,
    opciones: [
      { t: 'Rechazar el dinero', ef: (E, J) => { pa(E).finanzas = clamp(pa(E).finanzas - 6, 0, 100); Pj().cambiar(E, { prestigio: 2 }); return 'Tu integridad se refuerza; las arcas, menos.'; } },
      { t: 'Aceptarlo con cautela', ef: (E, J) => { pa(E).finanzas = clamp(pa(E).finanzas + 10, 0, 100); if (U().chance(0.25)) { Pj().cambiar(E, { prestigio: -5, pop: -3 }); return 'La donación sale en prensa y el partido paga el coste reputacional.'; } return 'El dinero entra sin sobresaltos... de momento.'; } }
    ]
  });
  ev({
    id: 'fusion_partidos', titulo: 'Propuesta de fusión', icono: '🔗', peso: 0.7,
    req: (E, J, P) => pa(E).pop < 9 && P.partidos.length > 4 && J.rol === 'lider',
    ctx: (E, J, P) => { const c = P.partidos.filter(k => k !== J.partido).sort((a, b) => C.U.distIdeo(E.partidos[a], pa(E)) - C.U.distIdeo(E.partidos[b], pa(E)))[0]; return { otro: c }; },
    texto: (E, J, P, x) => `${E.partidos[x.otro].nombre}, un partido de ideología cercana, propone una candidatura conjunta para superar el umbral y ganar peso.`,
    opciones: [
      { t: 'Aceptar la coalición electoral', ef: (E, J, P, x) => { const o = E.partidos[x.otro]; C.Opinion.empuje(E, J.partido, 0.8); pa(E).cohesion = clamp(pa(E).cohesion - 3, 20, 99); Pj().cambiar(E, { prestigio: 2 }); return `Pactas con ${o.sigla}: tu partido gana tracción y capital negociador.`; } },
      { t: 'Seguir en solitario', ef: (E) => { Pj().cambiar(E, { prestigio: 0.5 }); return 'Mantienes tu independencia.'; } }
    ]
  });

  /* ── Del país ── */
  ev({
    id: 'huelga_general', titulo: 'Huelga general', icono: '✊', peso: 0.9,
    req: (E, J, P) => P.ec.paro > 6 || P.ec.infl > 4.5,
    texto: (E, J, P) => `Los sindicatos convocan una huelga general contra el coste de la vida (paro ${C.U.d1(P.ec.paro)} %, inflación ${C.U.d1(P.ec.infl)} %).`,
    opciones: [
      { t: 'Apoyar a los huelguistas', ef: (E, J, P) => { const gob = enGob(E, J, P); Pj().cambiar(E, { pop: gob ? -2 : 2, prestigio: gob ? -2 : 1 }); aprob(P, -1); return gob ? 'Tu apoyo desconcierta a tus socios de Gobierno.' : 'Te alineas con la calle y ganas simpatías.'; } },
      { t: 'Pedir diálogo y servicios mínimos', ef: (E, J, P) => { Pj().cambiar(E, { prestigio: 1 }); return 'Tu llamada a la serenidad es bien recibida por los medios.'; } },
      { t: 'Criticar la huelga', ef: (E, J, P) => { const gob = enGob(E, J, P); Pj().cambiar(E, { pop: gob ? 1 : -1.5, prestigio: gob ? 1 : 0 }); return 'Tu postura divide a la opinión.'; } }
    ]
  });
  ev({
    id: 'tractorada', titulo: 'Tractores en la capital', icono: '🚜', peso: 0.8,
    req: (E, J, P) => (C.DATA.paises[J.pais].int || []).includes('agr'),
    texto: () => 'Miles de agricultores bloquean las carreteras contra la burocracia europea y los acuerdos comerciales.',
    opciones: [
      { t: 'Apoyar al campo contra Bruselas', ef: (E, J) => { Pj().cambiar(E, { pop: 2, capEU: -2 }); return 'Ganas aplausos en el mundo rural y enojas a los europeístas.'; } },
      { t: 'Mediar entre el campo y el Gobierno', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1.5, pop: 0.5 }); return 'Tu papel moderador es reconocido.'; } },
      { t: 'Defender las reformas europeas', ef: (E, J) => { Pj().cambiar(E, { capEU: 2, pop: -1.5 }); return 'Reafirmas tu compromiso europeo a costa de perder al campo.'; } }
    ]
  });
  ev({
    id: 'oleada_migratoria', titulo: 'Presión migratoria', icono: '⛴️', peso: 0.8,
    req: (E, J, P) => (C.DATA.paises[J.pais].int || []).includes('mig'),
    texto: () => 'La llegada de miles de migrantes desborda los centros de acogida y abre un debate nacional sobre el control de fronteras.',
    opciones: [
      { t: 'Reclamar solidaridad europea', ef: (E, J) => { Pj().cambiar(E, { capEU: 2, pop: 0.5 }); return 'Elevas la cuestión a escala europea; Bruselas escucha.'; } },
      { t: 'Exigir controles y retornos', ef: (E, J) => { Pj().cambiar(E, { pop: 1.5 }); C.Opinion.empuje(E, J.partido, J.soc > 20 ? 0.12 : -0.05); return 'Tu discurso firme conecta con parte del electorado.'; } },
      { t: 'Pedir una acogida humanitaria', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1, pop: J.soc < -10 ? 1 : -1.5 }); return 'Tu llamada divide al país.'; } }
    ]
  });
  ev({
    id: 'incendios', titulo: 'Incendios e inundaciones', icono: '🔥', peso: 0.8,
    req: () => true,
    texto: (E, J, P) => `Una catástrofe climática golpea varias regiones de ${C.DATA.paises[J.pais].nombre}. Hay evacuaciones y un debate encendido sobre la emergencia climática.`,
    opciones: [
      { t: 'Visitar la zona y coordinar ayuda', ef: (E, J, P) => { Pj().cambiar(E, { pop: 2, prestigio: 1 }); return 'Tu presencia tranquiliza a los afectados.'; } },
      { t: 'Reclamar un plan climático', ef: (E, J, P) => { Pj().cambiar(E, { prestigio: 1.5, capEU: 1 }); if (J.eco > 30) { Pj().cambiar(E, { pop: -0.5 }); } return 'Aprovechas el momento para exigir medidas.'; } },
      { t: 'Evitar el protagonismo', ef: () => 'Dejas el foco a los servicios de emergencia.' }
    ]
  });
  ev({
    id: 'ciberataque', titulo: 'Ciberataque a infraestructuras', icono: '🖥️', peso: 0.6,
    req: () => true,
    texto: (E, J, P) => `Un ciberataque atribuido a actores extranjeros paraliza hospitales y administraciones en ${C.DATA.paises[J.pais].nombre}.`,
    opciones: [
      { t: 'Pedir cooperación europea en ciberdefensa', ef: (E, J) => { Pj().cambiar(E, { capEU: 2, prestigio: 1 }); return 'Tu propuesta gana apoyos en Bruselas.'; } },
      { t: 'Exigir responsabilidades al Gobierno', ef: (E, J, P) => { aprob(P, -0.8); Pj().cambiar(E, { pop: enGob(E, J, P) ? -1 : 1.5 }); return 'La polémica sacude al Ejecutivo.'; } }
    ]
  });
  ev({
    id: 'escandalo_gobierno', titulo: 'Escándalo en el Gobierno', icono: '🔥', peso: 0.9,
    req: (E, J, P) => P.gob.aprob > 20,
    ctx: (E, J, P) => { const m = Object.keys(P.gob.ministros); const k = U().pick(m); const id = P.gob.ministros[k]; return { min: k, n: id === 'J' ? 'otro ministro' : nom(E, id) }; },
    texto: (E, J, P, x) => `${x.n}, ministro/a de ${C.DATA.ministerios.find(m => m.id === x.min).nombre}, aparece en una polémica por gastos y favores a empresas amigas.`,
    opciones: [
      { t: 'Pedir su cese', ef: (E, J, P) => { const gob = enGob(E, J, P); if (gob) { Pj().cambiar(E, { pop: 1, prestigio: -1 }); P.gob.estab -= 2; return 'Tu crítica interna sorprende, y no gusta a la dirección.'; } aprob(P, -2.5); Pj().cambiar(E, { pop: 2, prestigio: 1 }); P.gob.estab -= 2; return 'Tu ataque pasa factura al Ejecutivo.'; } },
      { t: 'Respaldar al ministro', ef: (E, J, P) => { const gob = enGob(E, J, P); Pj().cambiar(E, { prestigio: gob ? 1.5 : -0.5, pop: gob ? -0.5 : -1 }); return 'Cierras filas con el Gobierno.'; } },
      { t: 'Pedir una comisión de investigación', ef: (E, J, P) => { aprob(P, -1.2); Pj().cambiar(E, { prestigio: 1.2 }); return 'La comisión se abre con fuerte repercusión mediática.'; } }
    ]
  });

  /* ── Europeos y de carrera ── */
  ev({
    id: 'think_tank', titulo: 'Invitación a un foro europeo', icono: '🏛️', peso: 0.8,
    req: () => true,
    texto: () => 'Un think tank con sede en Bruselas te invita a participar en un foro sobre el futuro de la Unión Europea.',
    opciones: [
      { t: 'Asistir y presentar tu visión', ef: (E, J) => { Pj().cambiar(E, { capEU: 4, prestigio: 1 }, true); return 'Estableces contactos valiosos en la capital europea.'; } },
      { t: 'Declinar la invitación', ef: () => 'Prefieres centrarte en lo nacional.' }
    ]
  });
  ev({
    id: 'visita_oficial', titulo: 'Visita de un líder europeo', icono: '🤝', peso: 0.6,
    req: (E, J) => J.cargo === 'pm' || J.cargo === 'presauto' || J.cargo === 'ministro' || J.rol === 'lider',
    ctx: (E, J, P) => { const c = U().pick(Object.keys(E.paises).filter(x => x !== J.pais)); return { c }; },
    texto: (E, J, P, x) => `El gobierno de ${C.DATA.paises[x.c].nombre} propone una reunión bilateral para coordinar posiciones.`,
    opciones: [
      { t: 'Acordar una posición común', ef: (E, J, P, x) => { E.paises[x.c].ue.rel = clamp(E.paises[x.c].ue.rel + 2, 0, 100); Pj().cambiar(E, { capEU: 3, prestigio: 1 }); return 'Sale una declaración conjunta con buena acogida.'; } },
      { t: 'Mantener las distancias', ef: () => 'La reunión es cortés pero fría.' }
    ]
  });
  ev({
    id: 'candidatura_europea', titulo: 'La lista para Bruselas', icono: '🇪🇺', peso: 0, auto: true, cd: 200,
    req: (E, J, P) => P.estado === 'ue' && J.cargo === 'diputado' && !J.candidatoPE && J.prestigio >= 38 && E.ue.proxPE - E.fecha.t < 40 && E.ue.proxPE - E.fecha.t > 6,
    texto: (E, J) => `La dirección de ${pa(E).sigla} te ofrece un puesto de salida en su lista para las elecciones europeas. Si resultas elegido/a, dejarías tu escaño nacional.`,
    opciones: [
      { t: 'Aceptar la candidatura', ef: (E, J) => { J.candidatoPE = true; Pj().log(E, 'Aceptas ser candidato/a a las elecciones europeas.'); return 'Eres candidato/a al Parlamento Europeo.'; } },
      { t: 'Seguir en la política nacional', ef: () => 'Te quedas en casa.' }
    ]
  });
  ev({
    id: 'nominacion_comisario', titulo: 'Un puesto en la Comisión', icono: '🇪🇺', peso: 0, auto: true, cd: 200,
    req: (E, J, P) => P.estado === 'ue' && E.ue.comision && E.fecha.t - E.ue.comision.t0 <= 4 && E.fecha.t > 20 && ['diputado', 'ministro', 'pm'].includes(J.cargo) && enGob(E, J, P) && J.prestigio >= 45 && J.capEU >= 38 && J.cargo !== 'pm',
    texto: (E, J, P) => `Tu Gobierno te propone como comisario/a europeo/a. Tendrías cartera propia en la nueva Comisión y tendrías que dejar tu escaño nacional.`,
    opciones: [
      { t: 'Aceptar la nominación', ef: (E, J, P) => { const c = E.ue.comision.comisarios[J.pais]; Pj().alUE(E, 'comisario'); J.cartera = c ? c.cartera : 0; if (c) { c.n = J.nombre; c.g = J.g; c.jugador = true; } Pj().cambiar(E, { prestigio: 8, capEU: 8 }, true); Pj().log(E, 'Eres nombrado/a comisario/a europeo/a.'); return 'Superas la audiencia en la Eurocámara y asumes la cartera de ' + C.DATA.carteras[J.cartera][0] + '.'; } },
      { t: 'Declinar', ef: () => 'Prefieres seguir en la política nacional.' }
    ]
  });
  ev({
    id: 'presidencia_comision', titulo: 'Presidencia de la Comisión', icono: '👑', peso: 0, auto: true, cd: 300,
    req: (E, J) => ['comisario', 'pm', 'ministro'].includes(J.cargo) && J.prestigio >= 78 && J.capEU >= 68 && E.ue.comision && E.fecha.t - E.ue.comision.t0 <= 2 && E.fecha.t > 20,
    texto: () => 'El Consejo Europeo baraja tu nombre para presidir la Comisión Europea. Sólo necesitas aceptar y superar el voto de la Eurocámara.',
    opciones: [
      { t: 'Aceptar la propuesta', ef: (E, J, P) => { const ok = C.U.chance(0.7); if (!ok) { Pj().cambiar(E, { prestigio: -3 }, true); return 'La candidatura naufraga en el Parlamento Europeo.'; } Pj().alUE(E, 'presCom'); E.ue.comision.presidente = { n: J.nombre, g: J.g, pais: J.pais, grupo: E.partidos[J.partido].grupo, jugador: true }; Pj().cambiar(E, { prestigio: 15 }, true); Pj().log(E, 'Eres elegido/a presidente/a de la Comisión Europea.'); return '¡Presides la Comisión Europea!'; } },
      { t: 'Declinar', ef: () => 'Dejas pasar la ocasión.' }
    ]
  });


  /* ── De España ── */
  const rcJ = E => E.esp.ccaa[E.jugador.region], mJ = E => E.esp.muni.m[E.jugador.muni];
  const regNom = c => C.DATA.ccaa[c].nombre;
  ev({
    id: 'dana', titulo: 'Gota fría e inundaciones', icono: '🌊', peso: 0.9, cd: 100,
    ctx: (E, J) => ({ c: U().pick(['VAL', 'AND', 'MUR', 'CAT', 'CLM', 'BAL']) }),
    texto: (E, J, P, x) => `Una DANA devastadora anega ${regNom(x.c)}: hay víctimas, miles de evacuados y una polémica sobre la gestión de la emergencia y el reparto de responsabilidades entre Estado y comunidad.`,
    opciones: [
      { t: 'Viajar a la zona y coordinar la ayuda', ef: (E, J, P, x) => { Pj().cambiar(E, { pop: 2, prestigio: 1.5 }); E.esp.ccaa[x.c].relM = clamp(E.esp.ccaa[x.c].relM + 2, 0, 100); return 'Tu presencia sobre el terreno es valorada.'; } },
      { t: 'Exigir responsabilidades políticas', ef: (E, J, P, x) => { const rc = E.esp.ccaa[x.c]; if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob - 2.5, 5, 90); aprob(P, -0.5); Pj().cambiar(E, { pop: J.partido === (rc.gob && rc.gob.partido) ? -2 : 1.5 }); return 'La batalla política se recrudece.'; } },
      { t: 'Pedir un plan de reconstrucción europeo', ef: (E, J) => { Pj().cambiar(E, { capEU: 2.5, prestigio: 1 }); return 'Bruselas se compromete a movilizar fondos de solidaridad.'; } }
    ]
  });
  ev({
    id: 'cayucos', titulo: 'Crisis migratoria en Canarias y el Estrecho', icono: '⛴️', peso: 0.9, cd: 90,
    texto: () => 'Cientos de embarcaciones llegan a Canarias y a las costas del Sur. Los centros de acogida de menores están desbordados y se discute el reparto entre comunidades.',
    opciones: [
      { t: 'Defender el reparto obligatorio de menores', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1, pop: J.soc < 0 ? 1.5 : -1.5 }); if (E.esp.ccaa.CAN) E.esp.ccaa.CAN.relM = clamp(E.esp.ccaa.CAN.relM + 2, 0, 100); return 'Tu postura marca el debate.'; } },
      { t: 'Exigir control de fronteras y cooperación con Marruecos', ef: (E, J) => { Pj().cambiar(E, { pop: J.soc > 10 ? 2 : -0.5, capEU: 1 }); C.Opinion.empujeES && C.Opinion.empujeES(E, 'ES_VAP', 0.04); return 'Sitúas la seguridad fronteriza en el centro.'; } },
      { t: 'Reclamar solidaridad europea', ef: (E, J) => { Pj().cambiar(E, { capEU: 3, prestigio: 1 }); return 'La Comisión ofrece apoyo a Frontex y a Canarias.'; } }
    ]
  });
  ev({
    id: 'apagon', titulo: 'Gran apagón eléctrico', icono: '🔌', peso: 0.6, cd: 160,
    texto: () => 'Un cero eléctrico paraliza la península durante horas. Se multiplican las acusaciones cruzadas entre el Gobierno, las eléctricas y las comunidades.',
    opciones: [
      { t: 'Exigir una auditoría independiente', ef: (E, J, P) => { Pj().cambiar(E, { prestigio: 1.5, pop: 1 }); aprob(P, -0.8); return 'La auditoría pública te da razón.'; } },
      { t: 'Culpar a las eléctricas', ef: (E, J) => { Pj().cambiar(E, { pop: 1.5 }); return 'Aciertas con el sentir popular.'; } },
      { t: 'Apelar a la calma y la unidad', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1 }); return 'Tu tono sereno es bien recibido.'; } }
    ]
  });
  ev({
    id: 'corrupcion_partido', titulo: 'Un caso de corrupción salpica al partido', icono: '⚖️', peso: 0.8, cd: 100,
    req: (E, J) => J.rol !== 'base' || J.cargo !== 'activista',
    texto: (E, J) => `La Unidad de Delitos Económicos investiga una trama de contratos en una administración gobernada por ${pa(E).sigla}. Los medios piden explicaciones a la dirección.`,
    opciones: [
      { t: 'Pedir la suspensión de militancia de los implicados', ef: (E, J) => { Pj().cambiar(E, { prestigio: 2, pop: 1 }); pa(E).cohesion = clamp(pa(E).cohesion - 2, 20, 99); return 'Marcas distancias con los corruptos; tensión interna.'; } },
      { t: 'Defender la honorabilidad del partido', ef: (E, J) => { Pj().cambiar(E, { pop: -2, prestigio: -1 }); C.Opinion.empuje(E, J.partido, -0.15); return 'La imagen del partido se resiente.'; } },
      { t: 'Esperar a las decisiones judiciales', ef: (E, J) => { Pj().cambiar(E, { prestigio: 0.2 }); return 'Mantienes un perfil bajo.'; } }
    ]
  });
  ev({
    id: 'protesta_vivienda', titulo: 'Manifestación por la vivienda', icono: '🏠', peso: 1.0, cd: 80,
    texto: () => 'Miles de personas se manifiestan en las grandes ciudades contra los precios del alquiler y la compra de vivienda.',
    opciones: [
      { t: 'Apoyar la regulación del alquiler', ef: (E, J, P) => { Pj().cambiar(E, { pop: J.eco < 20 ? 2 : -1, prestigio: 0.8 }); return 'Tu apoyo gana adeptos entre los jóvenes.'; } },
      { t: 'Defender más oferta y menos trabas', ef: (E, J) => { Pj().cambiar(E, { pop: J.eco > 10 ? 1.5 : -1.5, prestigio: 0.5 }); return 'Propones liberar suelo y acelerar licencias.'; } },
      { t: 'Proponer un pacto de Estado por la vivienda', ef: (E, J) => { Pj().cambiar(E, { prestigio: 2 }); return 'Tu propuesta abre un debate transversal.'; } }
    ]
  });
  ev({
    id: 'consejeria_lista', titulo: 'El presidente cuenta contigo', icono: '💼', peso: 0, cd: 0,
    req: () => false,
    texto: (E, J, P, x) => `${x.pos ? `Entras en el Parlamento de ${regNom(x.c)} en el puesto ${x.pos} de la lista de ${pa(E).sigla}. ` : ''}Con el nuevo Gobierno de ${regNom(x.c)} en marcha, el presidente te propone entrar en el Consejo de Gobierno como titular de ${C.Territorio.infoGrupo(E, x.c, x.area).nombre}. ${C.DATA.consejerias[x.area].desc || ''}`,
    opciones: [
      { t: (E, J, P, x) => `Aceptar ${C.Territorio.infoGrupo(E, x.c, x.area).icono} ${C.Territorio.infoGrupo(E, x.c, x.area).nombre}`, ef: (E, J, P, x) => { Pj().tomarOferta(E, x.c, x.area); return 'Tomas posesión como consejero/a.'; } },
      { t: (E, J, P, x) => x.area2 ? `Pedir una cartera de más peso: ${C.Territorio.infoGrupo(E, x.c, x.area2).icono} ${C.Territorio.infoGrupo(E, x.c, x.area2).nombre}` : 'Pedir una cartera de más peso', ef: (E, J, P, x) => {
          if (!x.area2) { Pj().tomarOferta(E, x.c, x.area); return 'No hay una cartera mejor: aceptas la propuesta.'; }
          const p = C.U.clamp(0.28 + (J.prestigio - 35) / 100 + (x.pos && x.pos <= 3 ? 0.2 : 0), 0.12, 0.8);
          if (C.U.chance(p)) { Pj().tomarOferta(E, x.c, x.area2); Pj().cambiar(E, { prestigio: 2 }, true); return 'El presidente cede: te quedas con ' + C.Territorio.infoGrupo(E, x.c, x.area2).nombre + '.'; }
          Pj().cambiar(E, { prestigio: -1.5 }, true); Pj().tomarOferta(E, x.c, x.area); return 'El presidente se molesta por la presión, pero mantiene su oferta inicial.';
        } },
      { t: 'Seguir en el Parlamento', ef: () => 'Prefieres el escaño y la libertad de la bancada.' }
    ]
  });
  ev({
    id: 'oferta_consejeria', titulo: 'Una consejería en el gobierno autonómico', icono: '💼', peso: 0, auto: true, cd: 100,
    req: (E, J) => J.nivel !== 'nacional' && !!J.region && J.cargo !== 'presauto' && J.cargo !== 'consejero' && !!E.esp.ccaa[J.region].gob && E.esp.ccaa[J.region].gob.coalicion.includes(J.partido) && C.Territorio.areasDe(E, J.region, J.partido).length > 0 && J.prestigio >= 34 && J.rol !== 'base' && E.fecha.t % 3 === 0,
    texto: (E, J) => `El presidente de ${regNom(J.region)} te ofrece entrar en su Gobierno como consejero/a. Tendrías competencias y presupuesto propios.`,
    opciones: [
      { t: 'Aceptar la consejería', ef: (E, J) => { const libres = C.Territorio.areasDe(E, J.region, J.partido); const area = libres.sort((a, b) => C.Territorio.nivelArea(E, J.region, b) - C.Territorio.nivelArea(E, J.region, a))[0]; if (area) C.Territorio.tomarConsejeria(E, J.region, area); else J.consejeria = J.region; if (J.nivel === 'local') { Pj().dejar(E, 'local'); J.nivel = 'autonomico'; } Pj().cambiar(E, { prestigio: 5, pop: 2 }, true); Pj().sincronizar(E); return 'Tomas posesión como consejero/a.'; } },
      { t: 'Seguir donde estás', ef: () => 'Declinas la oferta.' }
    ]
  });
  ev({
    id: 'oferta_lista', titulo: 'Un puesto en las listas', icono: '🪜', peso: 0, auto: true, cd: 120,
    req: (E, J) => J.nivel !== 'nacional' && J.nivel !== 'europeo' && J.cargo !== 'presauto' && !J.aspira && J.prestigio >= (J.nivel === 'local' ? 30 : 42) && J.rol !== 'base' && E.fecha.t % 4 === 0,
    ctx: (E, J) => ({ a: J.nivel === 'local' ? 'autonomico' : 'nacional' }),
    texto: (E, J, P, x) => x.a === 'autonomico' ? `La dirección regional de ${pa(E).sigla} te propone ir en la lista al Parlamento de ${regNom(J.region)} en las próximas autonómicas.` : `La dirección nacional de ${pa(E).sigla} te ofrece un puesto en la lista al Congreso por ${C.DATA.provincias[J.circ || Pj().mejorProvincia(E, J.partido, J.region)][0]}.`,
    opciones: [
      { t: 'Aceptar el puesto', ef: (E, J, P, x) => { J.aspira = { nivel: x.a, t: E.fecha.t }; if (x.a === 'nacional') J.circ = J.circ || Pj().mejorProvincia(E, J.partido, J.region); Pj().log(E, 'Aceptas ir en las listas del siguiente nivel.'); return 'Figurarás en la lista en las próximas elecciones.'; } },
      { t: 'Seguir en tu cargo', ef: () => 'Te quedas donde estás.' }
    ]
  });
  ev({
    id: 'candidato_autonomico', titulo: 'Buscan candidato/a autonómico/a', icono: '🗳️', peso: 0, auto: true, cd: 160,
    req: (E, J) => {
      if (J.aspira || J.cargo === 'pm' || J.cargo === 'presauto' || Pj().esUE(E) || J.prestigio < 52 || (J.rol !== 'portavoz' && J.rol !== 'direccion')) return false;
      if (E.partidos[J.partido].amb !== 'nac' || (J.rol === 'lider' && J.nivel === 'nacional') || E.fecha.t % 4 !== 1) return false;
      return Pj().opcionesLista(E).some(o => o.cabeza && o.sem >= 8 && o.sem <= 60 && o.esc >= 6);
    },
    ctx: (E, J) => { const o = Pj().opcionesLista(E).filter(o => o.cabeza && o.sem >= 8 && o.sem <= 60 && o.esc >= 6).sort((a, b) => b.esc - a.esc)[0]; return { c: o.c, t: o.t }; },
    texto: (E, J, P, x) => `La dirección de ${pa(E).sigla} no tiene candidato/a claro para las autonómicas de ${regNom(x.c)} (${C.U.fmtT(x.t)}). Varias voces piden que seas tú quien encabece la lista.`,
    opciones: [
      { t: 'Presentarme como cabeza de lista', ef: (E, J, P, x) => { const ok = C.U.chance(Pj().probLista(E, x.c, true) + 0.2); if (!ok) { Pj().cambiar(E, { prestigio: -2 }, true); return 'Los barones regionales imponen a otro/a candidato/a.'; } J.aspira = { nivel: 'autonomico', region: x.c, cabeza: true, t: E.fecha.t }; Pj().log(E, `Serás candidato/a a la presidencia de ${regNom(x.c)}.`); return `Serás el/la candidato/a de ${pa(E).sigla} en ${regNom(x.c)}.`; } },
      { t: 'Ir en la lista, sin encabezarla', ef: (E, J, P, x) => { J.aspira = { nivel: 'autonomico', region: x.c, cabeza: false, t: E.fecha.t }; Pj().log(E, `Irás en la lista autonómica de ${regNom(x.c)}.`); return 'Figurarás en la lista.'; } },
      { t: 'Declinar', ef: () => 'Te quedas donde estás.' }
    ]
  });
  /* ── La Corona ── */
  const cor = E => (E.esp.corona = E.esp.corona || { apoyo: 58 });
  const corona = (E, d, o = {}) => {
    const c = cor(E); c.apoyo = clamp(c.apoyo + d, 15, 90);
    const S = C.Impacto && C.Impacto.asegurar(E); if (!S) return;
    S.sat.trad = clamp(S.sat.trad + d * 0.25, 3, 97); S.sat.prog = clamp(S.sat.prog - d * 0.2, 3, 97);
    S.off.rep = (S.off.rep || 0) + (o.rep || 0); S.off.inst = (S.off.inst || 0) + (o.inst || 0);
  };
  const mes = () => C.U.hoy().getUTCMonth();
  const republica = E => cor(E).apoyo < 45;
  ev({
    id: 'mensaje_navidad', titulo: 'El Mensaje de Navidad del Rey', icono: '👑', peso: 0, auto: true, cd: 50,
    req: (E, J) => mes() === 11 && C.U.hoy().getUTCDate() >= 22 && C.U.hoy().getUTCDate() <= 28,
    texto: (E, J, P) => `En su discurso de Nochebuena, el Rey apela a la unidad, a la Constitución y a la convivencia en un año de ${P.ec.paro > 9 ? 'dificultades económicas' : 'incertidumbre política'}. Los medios te piden valoración.`,
    opciones: [
      { t: 'Elogiar el discurso', ef: (E, J) => { corona(E, 1.5); Pj().cambiar(E, { pop: J.soc > 10 ? 1.2 : -0.6, prestigio: 0.4 }); return 'Tu respaldo agrada a los sectores institucionales.'; } },
      { t: 'Reprochar que no hable de los problemas reales', ef: (E, J) => { corona(E, -0.5); Pj().cambiar(E, { pop: J.soc < -10 ? 1.2 : -0.8 }); return 'Tu crítica gusta a unos y irrita a otros.'; } },
      { t: 'No comentarlo', ef: () => 'Pasas de puntillas.' }
    ]
  });
  ev({
    id: 'corona_patrimonio', titulo: 'Polémica por el patrimonio de la Corona', icono: '🏰', peso: 1.0, cd: 120,
    texto: () => 'Un reportaje revela gastos y regalos poco claros en torno a la Casa Real. La oposición pide explicaciones y los partidos republicanos exigen una auditoría.',
    opciones: [
      { t: 'Exigir transparencia total y una auditoría', ef: (E, J) => { corona(E, -2, { rep: 0.4 }); Pj().cambiar(E, { prestigio: 1.5, pop: J.soc < 0 ? 1.5 : -0.5 }); return 'La Zarzuela anuncia más transparencia.'; } },
      { t: 'Defender a la institución', ef: (E, J) => { corona(E, 0.5); Pj().cambiar(E, { prestigio: 0.5, pop: J.soc > 0 ? 1 : -1.5 }); return 'Cierras filas con la Corona.'; } },
      { t: 'Proponer una reforma de la financiación de la Casa Real', ef: (E, J) => { corona(E, 0.5, { rep: 0.4 }); Pj().cambiar(E, { prestigio: 2 }); return 'Tu propuesta abre un debate transversal.'; } }
    ]
  });
  ev({
    id: 'corona_emerito', titulo: 'El Rey emérito vuelve a ser noticia', icono: '🛬', peso: 0.8, cd: 150,
    texto: () => 'El padre del Rey regresa a España tras una larga estancia en el extranjero. Sus asuntos fiscales y sus cacerías reabren el debate sobre la inviolabilidad.',
    opciones: [
      { t: 'Pedir que explique su patrimonio en el Parlamento', ef: (E, J, P) => { corona(E, -2.5, { rep: 0.3 }); Pj().cambiar(E, { pop: J.soc < 10 ? 1.5 : -1, prestigio: 1 }); return 'La petición abre un pulso institucional.'; } },
      { t: 'Reclamar discreción y respeto a la Corona', ef: (E, J) => { corona(E, 0.5); Pj().cambiar(E, { pop: J.soc > 10 ? 1 : -1.5 }); return 'Tu llamada a la prudencia divide a la opinión.'; } },
      { t: 'Impulsar la reforma de la inviolabilidad', ef: (E, J) => { corona(E, -1, { rep: 0.5 }); Pj().cambiar(E, { prestigio: 1.5, pop: J.soc < 0 ? 2 : -1.5 }); return 'Tu propuesta gana apoyos a la izquierda.'; } }
    ]
  });
  ev({
    id: 'corona_territorial', titulo: 'El Rey ante la crisis territorial', icono: '🇪🇸', peso: 1.0, cd: 100,
    req: (E) => ['CAT', 'PVA'].some(c => E.esp.ccaa[c].indep > 14),
    texto: (E) => `El Rey dirige un mensaje a los españoles sobre la situación en ${E.esp.ccaa.CAT.indep >= E.esp.ccaa.PVA.indep ? 'Cataluña' : 'el País Vasco'}: llama al cumplimiento de la ley y al diálogo. Los partidos soberanistas lo rechazan.`,
    opciones: [
      { t: 'Respaldar el mensaje', ef: (E, J) => { corona(E, 1, { inst: 0.3 }); const c = E.esp.ccaa.CAT; c.indep = clamp(c.indep + 0.3, 0, 70); Pj().cambiar(E, { pop: J.ter < 0 ? 1.5 : -1 }); return 'Los sectores constitucionalistas te lo agradecen.'; } },
      { t: 'Pedir que la Corona no intervenga en política', ef: (E, J) => { corona(E, -1); Pj().cambiar(E, { pop: J.ter > 20 ? 1.5 : -0.8 }); return 'Marcas distancias con la Corona.'; } },
      { t: 'Aprovechar para proponer una mesa de diálogo', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1.5 }); const c = E.esp.ccaa.CAT; c.relM = clamp(c.relM + 1.5, 0, 100); return 'Tu propuesta de diálogo recibe atención.'; } }
    ]
  });
  ev({
    id: 'corona_sancion', titulo: 'El Rey y una ley polémica', icono: '✍️', peso: 0.8, cd: 120,
    req: (E) => C.Congreso.abiertos(E).some(p => p.etapa === 'senado' || p.etapa === 'vuelta') || E.proyectos && Object.values(E.proyectos).some(p => p.etapa === 'sancionada' && E.fecha.t - p.tEtapa < 6 && p.pop < 40),
    texto: () => 'Una ley muy discutida llega a la sanción real. Colectivos de ambos lados piden al Rey que la firme —o que no lo haga—, aunque la Constitución le obliga a sancionarla.',
    opciones: [
      { t: 'Recordar que el Rey debe sancionar toda ley aprobada', ef: (E, J) => { corona(E, 0.8, { inst: 0.2 }); Pj().cambiar(E, { prestigio: 1 }); return 'Tu explicación zanja el asunto.'; } },
      { t: 'Pedir al Rey que no la firme', ef: (E, J) => { corona(E, -1.2, { inst: -0.4 }); Pj().cambiar(E, { pop: J.soc > 20 ? 1.5 : -2, prestigio: -1 }); return 'Se te acusa de querer politizar la Corona.'; } },
      { t: 'Abstenerte de implicar a la Corona', ef: () => 'Dejas el asunto en manos de las Cortes.' }
    ]
  });
  ev({
    id: 'corona_familia', titulo: 'Un escándalo en la Familia Real', icono: '📸', peso: 0.8, cd: 140,
    texto: () => 'Un miembro de la Familia Real se ve envuelto en una polémica por sus negocios y viajes. La Casa del Rey publica un comunicado de distanciamiento.',
    opciones: [
      { t: 'Pedir que se depuren responsabilidades', ef: (E, J) => { corona(E, -1); Pj().cambiar(E, { prestigio: 1.2, pop: 0.5 }); return 'Tu exigencia es bien recibida.'; } },
      { t: 'Pedir respeto a la vida privada', ef: (E, J) => { corona(E, 0.3); Pj().cambiar(E, { pop: J.soc > 10 ? 0.8 : -1 }); return 'Tu defensa irrita a los republicanos.'; } }
    ]
  });
  ev({
    id: 'corona_encuesta', titulo: 'Encuesta: monarquía o república', icono: '📊', peso: 0.9, cd: 90,
    texto: (E) => `Una encuesta del CIS mide el apoyo a la Corona: el ${Math.round(cor(E).apoyo)} % de los españoles se declara partidario de la monarquía parlamentaria, y la cifra cae entre los jóvenes.`,
    opciones: [
      { t: 'Reivindicar la monarquía parlamentaria', ef: (E, J) => { corona(E, 1); Pj().cambiar(E, { pop: J.soc > 0 ? 1 : -1 }); return 'Los monárquicos celebran tus palabras.'; } },
      { t: 'Abrir el debate sobre un referéndum', ef: (E, J) => { corona(E, -1.5, { rep: 0.4 }); Pj().cambiar(E, { pop: J.soc < -15 ? 2 : -2, prestigio: 0.5 }); C.Noticias.poner(E, 'politica', `${J.nombre} propone abrir el debate sobre el modelo de Estado.`, 'ES'); return 'Tu propuesta incendia el debate.'; } },
      { t: 'Eludir la cuestión', ef: () => 'Prefieres no mojarte.' }
    ]
  });
  ev({
    id: 'corona_fiesta', titulo: 'Recepción del 12 de octubre', icono: '🎖️', peso: 0, auto: true, cd: 50,
    req: (E, J) => mes() === 9 && C.U.hoy().getUTCDate() >= 8 && C.U.hoy().getUTCDate() <= 14 && J.cargo !== 'activista',
    texto: () => 'El Rey ofrece la tradicional recepción de la Fiesta Nacional en el Palacio Real. Varios partidos republicanos e independentistas anuncian su ausencia.',
    opciones: [
      { t: 'Asistir con tu pareja', ef: (E, J) => { corona(E, 0.5); Pj().cambiar(E, { prestigio: 0.8, pop: J.soc > 0 ? 0.8 : -0.4 }); return 'Cumples con el protocolo.'; } },
      { t: 'Sumarte al plante', ef: (E, J) => { corona(E, -0.5); Pj().cambiar(E, { pop: J.soc < -10 || J.ter > 30 ? 1.5 : -1.5, prestigio: -0.5 }); return 'Tu ausencia no pasa inadvertida.'; } }
    ]
  });
  ev({
    id: 'corona_visita', titulo: 'El Rey visita tu comunidad', icono: '🤝', peso: 0.9, cd: 120,
    req: (E, J) => !!J.region && J.nivel !== 'nacional' && J.nivel !== 'europeo',
    texto: (E, J) => `El Rey visita ${regNom(J.region)} para inaugurar unas instalaciones y se reúne con las autoridades. Hay quien prepara una protesta.`,
    opciones: [
      { t: 'Recibirlo con todos los honores', ef: (E, J) => { corona(E, 0.8); Pj().cambiar(E, { prestigio: 1, pop: J.ter > 25 ? -1.5 : 1 }); return 'La visita transcurre con normalidad.'; } },
      { t: 'Aprovechar para pedirle apoyo a un proyecto regional', ef: (E, J) => { E.esp.ccaa[J.region].relM = clamp(E.esp.ccaa[J.region].relM + 1.5, 0, 100); Pj().cambiar(E, { prestigio: 1 }); return 'El Rey toma nota de tu petición.'; } },
      { t: 'Ausentarte por motivos de agenda', ef: (E, J) => { corona(E, -0.3); Pj().cambiar(E, { pop: J.ter > 25 ? 1.2 : -1 }); return 'Tu ausencia genera titulares.'; } }
    ]
  });
  ev({
    id: 'corona_abdicacion', titulo: 'Rumores de abdicación', icono: '👑', peso: 0.6, cd: 200, req: (E) => cor(E).apoyo < 52,
    texto: () => 'Se multiplican los rumores sobre una posible abdicación del Rey en favor de su heredera, para relanzar la imagen de la institución.',
    opciones: [
      { t: 'Apoyar una sucesión ordenada', ef: (E, J) => { corona(E, 2, { inst: 0.3 }); Pj().cambiar(E, { prestigio: 1.2 }); return 'La idea gana adeptos entre los constitucionalistas.'; } },
      { t: 'Reclamar un referéndum sobre el modelo de Estado', ef: (E, J) => { corona(E, -2, { rep: 0.5 }); Pj().cambiar(E, { pop: J.soc < -15 ? 2.5 : -2 }); return 'Tu demanda abre un frente.'; } },
      { t: 'Negarte a comentar rumores', ef: () => 'Prefieres esperar.' }
    ]
  });
  ev({
    id: 'corona_catastrofe', titulo: 'El Rey en la zona de la catástrofe', icono: '🌧️', peso: 0.8, cd: 150,
    texto: () => 'Tras unas graves inundaciones, el Rey visita a los afectados y recibe tanto abrazos como reproches por la lentitud de las ayudas.',
    opciones: [
      { t: 'Acompañar al Rey y pedir unidad', ef: (E, J, P) => { corona(E, 0.5); Pj().cambiar(E, { prestigio: 1.2 }); return 'Tu presencia se interpreta como responsabilidad institucional.'; } },
      { t: 'Centrar las críticas en la administración', ef: (E, J) => { Pj().cambiar(E, { pop: 1, prestigio: 0.5 }); return 'Diriges la crítica donde corresponde.'; } }
    ]
  });
  ev({
    id: 'temporal_municipal', titulo: 'Un temporal golpea la ciudad', icono: '🌧️', peso: 1.0, cd: 80,
    req: (E, J) => J.cargo === 'alcalde',
    texto: (E, J) => `Un temporal deja calles anegadas y apagones en ${mJ(E).nombre}. Los vecinos exigen respuestas al ayuntamiento.`,
    opciones: [
      { t: 'Movilizar a los servicios municipales y dar la cara', ef: (E, J) => { const m = mJ(E); m.aprob = clamp(m.aprob + 2, 10, 90); Pj().cambiar(E, { pop: 2, prestigio: 1 }); return 'Los vecinos reconocen tu gestión.'; } },
      { t: 'Pedir ayuda a la comunidad y al Estado', ef: (E, J) => { const m = mJ(E); m.aprob = clamp(m.aprob + 0.5, 10, 90); E.esp.ccaa[J.region].relM += 0.5; Pj().cambiar(E, { prestigio: 0.8 }); return 'Llegan ayudas, aunque tarde.'; } },
      { t: 'Culpar a la falta de inversión autonómica', ef: (E, J) => { const m = mJ(E); m.aprob = clamp(m.aprob - 1, 10, 90); Pj().cambiar(E, { pop: 0.5 }); return 'Mueves el foco, pero los vecinos quieren soluciones.'; } }
    ]
  });
  ev({
    id: 'turismo_masivo', titulo: 'Protestas contra el turismo masivo', icono: '🧳', peso: 0.9, cd: 90,
    req: (E, J) => J.cargo === 'alcalde' || J.cargo === 'concejal',
    texto: (E, J) => `Vecinos de ${mJ(E).nombre} se manifiestan contra la masificación turística, los pisos turísticos y la subida de precios.`,
    opciones: [
      { t: 'Limitar los pisos turísticos y la ecotasa', ef: (E, J) => { mJ(E).aprob = clamp(mJ(E).aprob + 1.2, 10, 90); Pj().cambiar(E, { pop: J.eco < 25 ? 2 : -0.5, prestigio: 1 }); return 'Los vecinos aplauden; el sector turístico protesta.'; } },
      { t: 'Defender el modelo turístico', ef: (E, J) => { mJ(E).aprob = clamp(mJ(E).aprob - 1, 10, 90); Pj().cambiar(E, { pop: J.eco > 20 ? 1 : -2 }); return 'El empresariado respira; la calle se enfada.'; } }
    ]
  });
  ev({
    id: 'mocion_local', titulo: 'Moción de censura en el ayuntamiento', icono: '🏘️', peso: 0.5, cd: 120,
    req: (E, J) => J.cargo === 'alcalde' && mJ(E).coal.length > 1,
    texto: (E, J) => `Tus socios de gobierno y la oposición se plantean una moción de censura contra ti en ${mJ(E).nombre}.`,
    opciones: [
      { t: 'Negociar con los socios', ef: (E, J) => { const ok = U().chance(0.35 + J.atrib.negociacion * 0.06); if (ok) { mJ(E).aprob += 1; Pj().cambiar(E, { prestigio: 2 }); return 'Frenas la moción con un nuevo acuerdo.'; } mJ(E).pm = null; mJ(E).alcalde = mJ(E).coal[1]; Pj().dejar(E, 'local'); J.concejal = true; Pj().sincronizar(E); return 'Pierdes la alcaldía.'; } },
      { t: 'Resistir y plantar cara', ef: (E, J) => { const ok = U().chance(0.3); if (ok) { Pj().cambiar(E, { prestigio: 3, pop: 2 }); return 'La moción fracasa.'; } mJ(E).pm = null; mJ(E).alcalde = mJ(E).coal[1] || mJ(E).alcalde; Pj().dejar(E, 'local'); J.concejal = true; Pj().sincronizar(E); return 'La moción prospera y pierdes la alcaldía.'; } }
    ]
  });
  ev({
    id: 'reclamacion_financiacion', titulo: 'Financiación autonómica', icono: '💶', peso: 1.0, cd: 100,
    req: (E, J) => J.cargo === 'presauto',
    texto: (E, J) => `El Ministerio de Hacienda convoca el Consejo de Política Fiscal y Financiera. ${regNom(J.region)} aporta más de lo que recibe y las comunidades se enfrentan por el reparto.`,
    opciones: [
      { t: 'Reclamar un trato singular', ef: (E, J) => { const rc = rcJ(E); rc.relM = clamp(rc.relM - 3, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob + 2, 5, 90); Pj().cambiar(E, { pop: 2.5 }); return 'Tu discurso reivindicativo conecta con tu electorado.'; } },
      { t: 'Pactar con el Estado un modelo común', ef: (E, J) => { const rc = rcJ(E); rc.relM = clamp(rc.relM + 4, 0, 100); Pj().cambiar(E, { prestigio: 2 }); return 'Cierras un acuerdo moderado.'; } },
      { t: 'Abandonar el Consejo (silla vacía)', ef: (E, J) => { const rc = rcJ(E); rc.relM = clamp(rc.relM - 6, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob + 1, 5, 90); Pj().cambiar(E, { pop: 1.5, prestigio: -1 }); return 'Teatro político con coste institucional.'; } }
    ]
  });
  ev({
    id: 'diada', titulo: 'Diada y manifestaciones soberanistas', icono: '🟡', peso: 0.8, cd: 52,
    req: (E, J) => E.esp.ccaa.CAT.indep > 25 && (J.region === 'CAT' || J.cargo === 'pm' || J.rol === 'lider'),
    texto: () => 'Cientos de miles de personas llenan las calles de Barcelona en la Diada. La reclamación de un referéndum vuelve al centro del debate.',
    opciones: [
      { t: 'Proponer diálogo y un nuevo encaje territorial', ef: (E, J) => { E.esp.ccaa.CAT.relM = clamp(E.esp.ccaa.CAT.relM + 3, 0, 100); Pj().cambiar(E, { prestigio: 1.5 }); return 'Tu oferta de diálogo recibe una respuesta cautelosa.'; } },
      { t: 'Defender la unidad de España', ef: (E, J) => { Pj().cambiar(E, { pop: J.ter < -20 ? 2 : -1 }); E.esp.ccaa.CAT.relM = clamp(E.esp.ccaa.CAT.relM - 2, 0, 100); return 'Tu mensaje firme divide a la opinión.'; } },
      { t: 'Pedir un referéndum pactado', ef: (E, J) => { Pj().cambiar(E, { pop: J.ter > 40 ? 2.5 : -2, prestigio: 0.5 }); return 'Tu propuesta marca la agenda.'; } }
    ]
  });
  ev({
    id: 'fondos_nextgen', titulo: 'Fondos Next Generation', icono: '🇪🇺', peso: 0.8, cd: 100,
    texto: () => 'Bruselas desbloquea un nuevo tramo de fondos europeos. Las comunidades y los ayuntamientos pugnan por su reparto.',
    opciones: [
      { t: 'Reclamar un reparto transparente y equitativo', ef: (E, J) => { Pj().cambiar(E, { capEU: 2, prestigio: 1 }); return 'Tu propuesta gana apoyos en las instituciones.'; } },
      { t: 'Pelear por más fondos para tu territorio', ef: (E, J) => { Pj().cambiar(E, { pop: 1.5 }); return 'Tu territorio recibe una parte mayor.'; } }
    ]
  });
  ev({
    id: 'juicio_politico', titulo: 'Juicio a un dirigente político', icono: '⚖️', peso: 0.7, cd: 100,
    texto: () => 'El Tribunal Supremo juzga a un destacado dirigente político por malversación. La polarización se dispara.',
    opciones: [
      { t: 'Respetar la independencia judicial', ef: (E, J) => { Pj().cambiar(E, { prestigio: 1.5 }); return 'Tu posición institucional es bien valorada.'; } },
      { t: 'Hablar de «lawfare» y persecución', ef: (E, J) => { Pj().cambiar(E, { pop: 1, prestigio: -1.5 }); pa(E).cohesion = clamp(pa(E).cohesion + 1, 20, 99); return 'Tu base se moviliza.'; } }
    ]
  });

  /* ── Gobierno autonómico: consejerías con competencias ── */
  const area = (a) => (E, J) => ['consejero', 'presauto'].includes(J.cargo) && (J.cargo === 'presauto' || (!!J.area && J.region && C.Territorio.infoGrupo(E, J.region, J.area).atoms.includes(a))) && !!J.region;
  const gestion = (E, J, a, d) => { const rc = E.esp.ccaa[J.region]; rc.gestion[a] = clamp(rc.gestion[a] + d, 5, 98); rc.gob.aprob = clamp(rc.gob.aprob + d * 0.12, 5, 90); };
  ev({
    id: 'crisis_sanitaria', titulo: 'Colapso en la sanidad autonómica', icono: '🏥', peso: 1.0, cd: 90, req: (E, J, P) => area('sal')(E, J) && E.esp.ccaa[J.region].comp.sal >= 1,
    texto: (E, J) => `Las urgencias de ${regNom(J.region)} se desbordan y los sanitarios amenazan con movilizaciones por las listas de espera.`,
    opciones: [
      { t: 'Plan de choque con más contrataciones', ef: (E, J) => { gestion(E, J, 'sal', 7); E.esp.ccaa[J.region].deuda += 0.8; Pj().cambiar(E, { prestigio: 2, pop: 1.5 }); return 'Las listas de espera bajan, la deuda sube.'; } },
      { t: 'Derivar pacientes a la sanidad privada', ef: (E, J) => { gestion(E, J, 'sal', 2); Pj().cambiar(E, { pop: J.eco > 15 ? 1 : -2 }); return 'Alivias la presión pero el modelo se discute.'; } },
      { t: 'Pedir fondos extraordinarios al Estado', ef: (E, J) => { E.esp.ccaa[J.region].relM = clamp(E.esp.ccaa[J.region].relM - 1, 0, 100); E.esp.ccaa[J.region].fin.nivel += 0.6; Pj().cambiar(E, { prestigio: 0.8 }); return 'Hacienda aporta una parte; la polémica política sigue.'; } }
    ]
  });
  ev({
    id: 'huelga_docentes', titulo: 'Huelga de docentes', icono: '📚', peso: 0.9, cd: 90, req: (E, J, P) => area('edu')(E, J) && E.esp.ccaa[J.region].comp.edu >= 1,
    texto: (E, J) => `Los sindicatos educativos convocan huelga en ${regNom(J.region)} por ratios, salarios y la nueva ley educativa.`,
    opciones: [
      { t: 'Negociar un acuerdo salarial', ef: (E, J) => { gestion(E, J, 'edu', 6); E.esp.ccaa[J.region].deuda += 0.5; Pj().cambiar(E, { prestigio: 1.5 }); return 'Acuerdo con los sindicatos: fin de la huelga.'; } },
      { t: 'Mantener el plan y garantizar servicios mínimos', ef: (E, J) => { gestion(E, J, 'edu', -3); Pj().cambiar(E, { pop: J.eco > 20 ? 1 : -1.5 }); return 'La huelga sigue varias semanas.'; } }
    ]
  });
  ev({
    id: 'incendio_forestal', titulo: 'Grandes incendios forestales', icono: '🔥', peso: 0.9, cd: 100, req: (E, J, P) => area('amb')(E, J),
    texto: (E, J) => `Varios incendios arrasan miles de hectáreas en ${regNom(J.region)}. Se discuten los medios de extinción y el reparto de responsabilidades con el Estado.`,
    opciones: [
      { t: 'Movilizar todos los medios autonómicos', ef: (E, J) => { gestion(E, J, 'amb', 5); Pj().cambiar(E, { pop: 2, prestigio: 1 }); return 'La emergencia se controla y se te reconoce.'; } },
      { t: 'Pedir la UME y fondos europeos', ef: (E, J) => { E.esp.ccaa[J.region].relM = clamp(E.esp.ccaa[J.region].relM + 1, 0, 100); Pj().cambiar(E, { capEU: 2, prestigio: 1 }); return 'Llega ayuda estatal y europea.'; } }
    ]
  });
  ev({
    id: 'tension_competencias', titulo: 'Conflicto de competencias con el Estado', icono: '⚖️', peso: 0.8, cd: 100, req: (E, J, P) => ['presauto', 'consejero'].includes(J.cargo) && !!J.region,
    ctx: (E, J) => { const rc = E.esp.ccaa[J.region]; return { k: U().pick(Object.keys(C.DATA.competencias).filter(x => rc.comp[x] >= 1).concat(['edu'])) }; },
    texto: (E, J, P, x) => `El Gobierno central aprueba una norma que, según tu comunidad, invade su competencia de ${C.DATA.competencias[x.k].nombre.toLowerCase()}.`,
    opciones: [
      { t: 'Plantear un conflicto de competencia ante el Tribunal Constitucional', ef: (E, J) => { const rc = E.esp.ccaa[J.region]; rc.relM = clamp(rc.relM - 3, 0, 100); Pj().cambiar(E, { prestigio: 1.5, pop: 1 }); return 'Llevas el caso al TC: se espera sentencia.'; } },
      { t: 'Negociar en la comisión bilateral', ef: (E, J) => { const rc = E.esp.ccaa[J.region]; rc.relM = clamp(rc.relM + 2, 0, 100); Pj().cambiar(E, { prestigio: 1 }); return 'Se desbloquea con un acuerdo.'; } },
      { t: 'Aceptar la norma', ef: (E, J) => { Pj().cambiar(E, { prestigio: -1.5, pop: -1 }); return 'Cedes terreno; tus socios no lo entienden.'; } }
    ]
  });

  /* ── Alcaldía ── */
  const alc = (E, J) => J.cargo === 'alcalde' && !!E.esp.muni.m[J.muni];
  const sh = (m, k, d) => { m.shock[k] = (m.shock[k] || 0) + d; };
  ev({
    id: 'okupacion_barrio', titulo: 'Conflicto por una vivienda ocupada', icono: '🏚️', peso: 0.9, cd: 80, req: alc,
    texto: (E, J) => `Vecinos de un barrio de ${mJ(E).nombre} reclaman al ayuntamiento que actúe contra una ocupación que ha degenerado en peleas y denuncias.`,
    opciones: [
      { t: 'Reforzar la policía local y coordinarte con la judicial', ef: (E, J) => { sh(mJ(E), 'seguridad', 6); mJ(E).tension = clamp(mJ(E).tension - 4, 0, 100); Pj().cambiar(E, { pop: J.soc > 10 ? 2 : -0.5 }); return 'La situación se encauza.'; } },
      { t: 'Mediación social y realojo', ef: (E, J) => { sh(mJ(E), 'empleo', 2); sh(mJ(E), 'vivienda', 3); mJ(E).deuda += 0.8; Pj().cambiar(E, { pop: J.soc < 0 ? 2 : -0.5, prestigio: 1 }); return 'Se logra un acuerdo, a un coste.'; } },
      { t: 'Dejarlo en manos de los juzgados', ef: (E, J) => { mJ(E).tension = clamp(mJ(E).tension + 5, 0, 100); mJ(E).aprob = clamp(mJ(E).aprob - 1.2, 10, 90); return 'Los vecinos se sienten abandonados.'; } }
    ]
  });
  ev({
    id: 'obras_caoticas', titulo: 'Obras caóticas en el centro', icono: '🚧', peso: 0.9, cd: 90, req: alc,
    texto: (E, J) => `Las obras de un gran proyecto en ${mJ(E).nombre} se retrasan y los comerciantes, hartos, anuncian movilizaciones.`,
    opciones: [
      { t: 'Compensar a los comercios afectados', ef: (E, J) => { mJ(E).deuda += 1; mJ(E).aprob = clamp(mJ(E).aprob + 0.8, 10, 90); Pj().cambiar(E, { prestigio: 1 }); return 'Calmas los ánimos.'; } },
      { t: 'Acelerar las obras con turnos de noche', ef: (E, J) => { mJ(E).deuda += 0.6; sh(mJ(E), 'movilidad', 3); return 'Terminan antes de lo previsto.'; } },
      { t: 'Culpar a la contrata', ef: (E, J) => { mJ(E).aprob = clamp(mJ(E).aprob - 0.6, 10, 90); Pj().cambiar(E, { prestigio: -0.5 }); return 'Tu explicación convence a pocos.'; } }
    ]
  });
  ev({
    id: 'macroevento', titulo: 'Oportunidad de un gran evento', icono: '🎡', peso: 0.7, cd: 120, req: alc,
    texto: (E, J) => `Una federación internacional propone a ${mJ(E).nombre} acoger un gran evento deportivo-cultural. Atraería turismo y prestigio, pero exigiría inversiones.`,
    opciones: [
      { t: 'Presentar la candidatura', ef: (E, J) => { const m = mJ(E), ok = U().chance(0.4 + J.atrib.negociacion * 0.04); if (ok) { sh(m, 'cultura', 14); sh(m, 'empleo', 5); m.deuda += 6; m.aprob = clamp(m.aprob + 3, 10, 90); Pj().cambiar(E, { prestigio: 4, pop: 3 }); return '¡Ganas la candidatura! La ciudad entra en el mapa.'; } m.deuda += 1.5; Pj().cambiar(E, { prestigio: -1 }); return 'Pierdes la candidatura y el gasto de la propuesta.'; } },
      { t: 'Declinar y centrarte en los servicios', ef: (E, J) => { sh(mJ(E), 'limpieza', 3); Pj().cambiar(E, { prestigio: 0.5 }); return 'Prefieres no endeudarte.'; } }
    ]
  });
  ev({
    id: 'inseguridad_barrio', titulo: 'Oleada de robos', icono: '🚨', peso: 0.8, cd: 90, req: alc,
    texto: (E, J) => `Una oleada de robos en varios barrios de ${mJ(E).nombre} dispara la alarma y la oposición pide medidas.`,
    opciones: [
      { t: 'Más patrullas y cámaras', ef: (E, J) => { const m = mJ(E); sh(m, 'seguridad', 7); m.deuda += 0.6; Pj().cambiar(E, { pop: J.soc > 0 ? 2 : 0 }); return 'Los robos bajan.'; } },
      { t: 'Prevención y trabajo social en los barrios', ef: (E, J) => { const m = mJ(E); sh(m, 'seguridad', 3); sh(m, 'empleo', 3); Pj().cambiar(E, { pop: J.soc < 0 ? 2 : -0.5, prestigio: 1 }); return 'La respuesta tarda más, pero cala.'; } },
      { t: 'Pedir más efectivos a la Delegación del Gobierno', ef: (E, J) => { const m = mJ(E), g = E.paises.ES.gob; if (g.coalicion.includes(J.partido) || U().chance(0.4)) { sh(m, 'seguridad', 5); return 'Llegan refuerzos de la Policía Nacional.'; } m.aprob = clamp(m.aprob - 0.5, 10, 90); return 'Madrid no responde.'; } }
    ]
  });

  ev({
    id: 'jubilacion', titulo: '¿Es hora de retirarse?', icono: '🏁', peso: 0, auto: true, cd: 150,
    req: (E, J) => J.edad >= 68 && !J.retirado,
    texto: (E, J) => `Con ${J.edad} años y una larga trayectoria a tus espaldas, tu entorno te pregunta si ha llegado el momento de dejar paso a una nueva generación.`,
    opciones: [
      { t: 'Retirarme de la política', ef: (E, J) => { Pj().retirar(E); return 'Cierras tu carrera política.'; } },
      { t: 'Seguir unos años más', ef: () => 'Decides continuar en primera línea.' }
    ]
  });

  /* ── Choques globales (informativos) ── */
  ev({ id: 'recesion_global', titulo: 'Recesión global', icono: '📉', peso: 0.5, cd: 150, global: true, req: () => true,
    texto: () => 'Los mercados se desploman y la economía mundial entra en recesión. Europa sufre una caída de la demanda.',
    efecto: E => C.Economia.choque(E, -1.7, -0.2), opciones: [{ t: 'Entendido', ef: () => '' }] });
  ev({ id: 'crisis_energetica', titulo: 'Crisis energética', icono: '⚡', peso: 0.5, cd: 150, global: true, req: () => true,
    texto: () => 'Un nuevo shock en los mercados de gas y petróleo dispara los precios de la energía en toda Europa.',
    efecto: E => C.Economia.choque(E, -0.6, 1.6), opciones: [{ t: 'Entendido', ef: () => '' }] });
  ev({ id: 'auge_global', titulo: 'Ciclo expansivo', icono: '📈', peso: 0.4, cd: 150, global: true, req: () => true,
    texto: () => 'Un repunte del comercio mundial y de la inversión empuja la economía europea hacia arriba.',
    efecto: E => C.Economia.choque(E, 0.9, -0.2), opciones: [{ t: 'Entendido', ef: () => '' }] });
  ev({ id: 'guerra_comercial', titulo: 'Guerra de aranceles', icono: '🚢', peso: 0.5, cd: 120, global: true, req: () => true,
    texto: () => 'Estados Unidos y otras potencias imponen nuevos aranceles a productos europeos. Se resienten la industria y las exportaciones.',
    efecto: E => C.Economia.choque(E, -0.7, 0.5), opciones: [{ t: 'Entendido', ef: () => '' }] });
  ev({ id: 'avance_ia', titulo: 'Salto tecnológico', icono: '🤖', peso: 0.3, cd: 150, global: true, req: () => true,
    texto: () => 'Un avance en inteligencia artificial acelera la productividad pero reabre el debate sobre empleo y regulación.',
    efecto: E => C.Economia.choque(E, 0.5, -0.1), opciones: [{ t: 'Entendido', ef: () => '' }] });

  C.DATA.eventos = eventos;
})(window.ESP);

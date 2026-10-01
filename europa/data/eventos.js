/* Eventos procedurales con decisiones. Cada evento: { id, titulo, icono, peso, cd (semanas de enfriamiento), auto (se dispara al cumplirse req),
   req(E,J,P), ctx(E,J,P) → datos serializables, texto(E,J,P,x), opciones:[{ t, ef(E,J,P,x) → texto de resultado, req? }] } */
window.EUROPA = window.EUROPA || {};
EUROPA.DATA = EUROPA.DATA || {};
(function (C) {
  const U = () => C.U, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Pj = () => C.Personaje;
  const pa = E => E.partidos[E.jugador.partido];
  const enGob = (E, J, P) => P.gob.coalicion.includes(J.partido);
  const nom = (E, id) => (E.politicos[id] ? E.politicos[id].n : 'el líder');
  const aprob = (P, d) => { P.gob.aprob = clamp(P.gob.aprob + d, 5, 90); };
  const sectores = { diplomatico: ['ext', 'eur'], abogado: ['jus', 'int'], empresa: ['eco', 'ter'], academico: ['edu', 'sal'], sindical: ['tra', 'sal'], periodista: ['edu', 'eur'], concejal: ['ter', 'int'], activista: ['amb', 'sal'] };
  const eventos = [];
  const ev = o => eventos.push(Object.assign({ peso: 1, cd: 40 }, o));

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
  ev({
    id: 'referendum_pedido', titulo: 'Presión por un referéndum europeo', icono: '🗳️', peso: 0.5, cd: 100,
    req: (E, J, P) => P.estado !== 'candidato' && E.partidos[P.partidos.slice().sort((a, b) => E.partidos[b].pop - E.partidos[a].pop).find(k => E.partidos[k].eu < -35) || J.partido].eu < -35,
    texto: (E, J, P) => P.estado === 'ue' ? 'Los partidos euroescépticos reclaman un referéndum sobre la permanencia en la Unión Europea.' : 'Crece la presión para votar sobre la relación del país con la Unión Europea.',
    opciones: [
      { t: 'Respaldar la consulta', ef: (E, J) => { Pj().cambiar(E, { pop: J.eu < 0 ? 2 : -1, capEU: J.eu < 0 ? 0 : -3 }); return 'Tu apoyo alimenta el debate.'; } },
      { t: 'Oponerte con firmeza', ef: (E, J) => { Pj().cambiar(E, { capEU: 2, prestigio: 1, pop: J.eu < 0 ? -1.5 : 0.5 }); return 'Te alineas con el consenso institucional.'; } }
    ]
  });
  ev({
    id: 'fin_ley_marcial_ua', titulo: 'Alto el fuego y fin de la ley marcial', icono: '🕊️', peso: 0, auto: true, cd: 2000,
    req: (E, J, P) => J.pais === 'UA' && P.flags.leyMarcial && E.fecha.t > 100 && U().chance(0.01),
    texto: () => 'Tras años de guerra, un alto el fuego estable abre la puerta a levantar la ley marcial y convocar elecciones.',
    opciones: [
      { t: 'Convocar elecciones', ef: (E, J, P) => { P.flags.leyMarcial = false; C.Elecciones.adelantar(E, 'UA', 22); return 'La ley marcial se levanta. Habrá elecciones.'; } },
      { t: 'Aplazarlas un poco más', ef: (E, J, P) => { Pj().cambiar(E, { pop: -1 }); return 'La ley marcial continúa, de momento.'; } }
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
    req: (E, J) => J.cargo === 'pm' || J.cargo === 'ministro' || J.rol === 'lider',
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
})(window.EUROPA);

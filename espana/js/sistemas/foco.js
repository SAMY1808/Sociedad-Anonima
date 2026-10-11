/* Foco por cargo: el juego gira alrededor de tu cargo. Un/a presidente/a del Gobierno decide en el ámbito central; un/a diputado/a o consejero/a
   autonómico/a, en su comunidad; un/a alcalde/sa o concejal/a, en su municipio. Lo demás sigue funcionando por su cuenta (lo gestiona la IA)
   y sólo te llega como noticia. Se puede desactivar en Ajustes («Panorámico»). Estado: E.meta.ajustes.foco = 'cargo' | 'todo'. */
window.ESP = window.ESP || {};
(function (C) {
  const CARGO_AMB = { pm: 'central', vicepres: 'central', ministro: 'central', diputado: 'central', senador: 'central', activista: 'central', mep: 'central', comisario: 'central', presCE: 'central', presCom: 'central', presPE: 'central', presauto: 'aut', consejero: 'aut', dipauto: 'aut', alcalde: 'local', concejal: 'local' };
  const EJEC = ['pm', 'vicepres', 'ministro', 'presauto', 'consejero', 'alcalde'];
  const COMUN = ['dashboard', 'agenda', 'guia', 'leyes', 'corrupcion', 'medios', 'crisis', 'elecciones', 'sede', 'partido', 'personas', 'dilemas', 'personaje', 'legado', 'ajustes', 'partidas'];
  const PANTALLAS = {
    central: COMUN.concat(['cortes', 'coaliciones', 'mayorias', 'territorio', 'autogob', 'lenguas', 'justicia', 'organismos', 'corona', 'referendos', 'estructural', 'social', 'europa', 'exterior']),
    aut: COMUN.concat(['territorio', 'autogob', 'parlaut', 'lenguas']),
    local: COMUN.concat(['ayuntamiento', 'local2'])
  };
  const SOLO_EJEC = ['consejo', 'gabinete', 'jefe'];   // sólo con cargo de gobierno (central o autonómico)
  const TABS_TERR = { central: ['mapa', 'ccaa', 'competencias', 'proces', 'estatutos', 'financiacion', 'art155', 'constitucion', 'cooperacion'], aut: ['ccaa', 'competencias', 'estatutos', 'financiacion', 'presupuesto', 'proces', 'art155', 'constitucion', 'cooperacion'], local: ['munis'] };
  const TABS_ELEC = { central: ['generales', 'campana', 'investidura', 'europeas'], aut: ['autonomicas', 'investidura', 'campana'], local: ['municipales', 'campana'] };
  // Acciones de la agenda por grupo y por identificador
  const GRUPO_AMB = { parlamento: ['central'], nacional: ['central'], autonomico: ['aut'], local: ['local'], europa: ['central'] };
  const ACC_AMB = { audiencia_rey: ['central'], cuestionar_corona: ['central'], defender_corona: ['central'], mediar_corona: ['central'], proponer_referendo: ['central'], campana_referendo: ['central'], campana_mun: ['local'], mitin_local: ['local'], gasto_local: ['local'], candidato_estrella: ['local'], encuesta_local: ['local'], campana_mun_auto: ['local'], visita_emergencia: ['central', 'aut'], campana_auto: ['aut'], campana_eu: ['central'], votar_conferencia: ['aut'] };
  // Palancas de gobierno: sólo con cargo ejecutivo central (los demás cargos centrales tienen la oposición y el Parlamento)
  const ACC_GOB = ['acuerdo_marruecos', 'calmar_conflicto', 'cerrar_conferencia', 'comparecer_congreso', 'compromiso_otan', 'convocar_conferencia', 'cuestion_confianza', 'cumbre_bilateral', 'cupo_reparto', 'dar_la_cara', 'delegar_crisis', 'disolver_cortes', 'endurecer_fronteras', 'gestionar_crisis', 'gestionar_fondos', 'imponer_decreto_social', 'limitar_turismo', 'mesa_dialogo', 'nombrar_fiscal', 'nombrar_organismo', 'ofrecer_comp', 'pacto_agua', 'persuadir_comunidad', 'plan_fiscal', 'plan_integracion', 'plan_ministerio', 'plan_renovables', 'plan_vivienda', 'prorrogar_nucleares', 'propuesta_consejo', 'reforma_banca', 'remodelar', 'resolver_crisis_bancaria', 'subsidio_energia', 'tope_alquiler', 'visita_ccaa', 'requerir_155', 'negociar_senado_155', 'autorizacion_155', 'medidas_155', 'levantar_155', 'retirar_155', 'conferencia_sectorial', 'abrir_reforma_financiacion', 'ajustar_financiacion', 'cabildear_ccaa_fin', 'contrapartida_ccaa_fin', 'convocar_cpff_reforma', 'retirar_reforma_financiacion', 'fondos_emergencia', 'culpar_comunidad', 'responder_peticion_crisis', 'resolver_zona_catastrofica', 'abrir_reforma_constitucional', 'modelo_constitucional', 'articulo_constitucional', 'cabildear_constit', 'contrapartida_constit', 'retirar_articulo_constit', 'remitir_reforma_constitucional', 'campana_constit', 'retirar_reforma_constitucional'];
  // Sucesos y dilemas por ámbito (los que no figuran valen para todos)
  const EV_AMB = {
    huelga_general: ['central'], tractorada: ['central'], oleada_migratoria: ['central'], incendios: ['central'], ciberataque: ['central'], dana: ['central'], cayucos: ['central'], apagon: ['central'], protesta_vivienda: ['central'], escandalo_gobierno: ['central'], visita_oficial: ['central', 'aut'], think_tank: ['central'], fondos_nextgen: ['central', 'aut'],
    recesion_global: ['central'], crisis_energetica: ['central'], auge_global: ['central'], guerra_comercial: ['central'], avance_ia: ['central'], crisis_coalicion: ['central'], oferta_ministerio: ['central'], candidatura_europea: ['central'], nominacion_comisario: ['central'], presidencia_comision: ['central'],
    corona_patrimonio: ['central'], corona_emerito: ['central'], corona_territorial: ['central'], corona_sancion: ['central'], corona_familia: ['central'], corona_encuesta: ['central'], corona_fiesta: ['central', 'aut'], corona_abdicacion: ['central'], corona_catastrofe: ['central'], mensaje_navidad: ['central', 'aut'], corona_visita: ['aut', 'local'],
    crisis_sanitaria: ['aut'], huelga_docentes: ['aut'], incendio_forestal: ['aut'], tension_competencias: ['aut'], reclamacion_financiacion: ['aut'], consejeria_lista: ['aut'], diada: ['aut', 'central'],
    a155_protesta: ['central'], a155_resistencia: ['aut'], tc_anula_ley_aut: ['aut'], requerimiento_hacienda: ['aut'], disputa_agua_ccaa: ['aut'], fuga_empresa: ['aut'], crisis_policial_aut: ['aut'], alarma_despoblacion: ['aut'],
    temporal_municipal: ['local'], turismo_masivo: ['local'], mocion_local: ['local'], okupacion_barrio: ['local'], obras_caoticas: ['local'], macroevento: ['local'], inseguridad_barrio: ['local']
  };
  const DL_AMB = { baron: ['central'], escision: ['central'], criticosEscision: ['central'], congresoExtra: ['central'], socio: ['central'], presion: ['central'], pactoEstado: ['central'], pactoPrograma: ['central'], rey: ['central'], extranjero: ['central'], crisisPostura: ['central'], huelga: ['central'] };

  const TEXTO = {
    central: {
      exec: ['Presidencia del Gobierno', 'Diriges el Consejo de Ministros, sacas leyes adelante en las Cortes, negocias con tus socios y gestionas las crisis nacionales y Europa.'],
      parl: ['Las Cortes Generales', 'Tu juego es el Congreso: votas, presentas leyes, controlas al Gobierno, negocias pactos y mueves tu partido.']
    },
    aut: {
      exec: ['Tu comunidad autónoma', 'Gobiernas tu comunidad: parlamento autonómico, competencias, financiación y relación con Moncloa y con los ayuntamientos.'],
      parl: ['El parlamento de tu comunidad', 'Tu juego es el parlamento autonómico: votas leyes, controlas al Ejecutivo regional y negocias bloques.']
    },
    local: {
      exec: ['Tu ayuntamiento', 'Gobiernas tu municipio: plenos, presupuesto, proyectos y las crisis de tu ciudad.'],
      parl: ['El pleno de tu ayuntamiento', 'Tu juego es el pleno municipal: mociones, pactos locales y la oposición al gobierno de tu ciudad.']
    }
  };
  const AUTO = { central: 'Las comunidades y los ayuntamientos funcionan por su cuenta: sólo te llegan sus noticias.', aut: 'El Gobierno de España y los ayuntamientos siguen su curso: sólo te llegan sus noticias y sus consecuencias.', local: 'La comunidad y el Estado siguen su curso: sólo te llegan sus noticias y sus consecuencias.' };

  const Fc = C.Foco = {
    CARGO_AMB, EJEC, PANTALLAS, TABS_TERR, TABS_ELEC,
    modo(E) { const a = E && E.meta && E.meta.ajustes; return a && a.foco === 'todo' ? 'todo' : 'cargo'; },
    activo(E) { const J = E && E.jugador; return !!(J && J.pais === 'ES' && Fc.modo(E) === 'cargo'); },
    ambito(E) { if (!Fc.activo(E)) return 'todo'; const J = E.jugador; return J.cargo === 'activista' ? ({ autonomico: 'aut', local: 'local' }[J.nivel] || 'central') : (CARGO_AMB[J.cargo] || 'central'); },
    ejecutivo(E) { return !!(E && E.jugador && EJEC.includes(E.jugador.cargo)); },
    /* ¿Se muestra esta pantalla en el menú? (los enlaces directos siguen funcionando) */
    pantalla(E, id) {
      if (!Fc.activo(E)) return true; const am = Fc.ambito(E);
      if (SOLO_EJEC.includes(id)) return Fc.ejecutivo(E) && am !== 'local';
      return (PANTALLAS[am] || PANTALLAS.central).includes(id);
    },
    /* Pantallas fijas en la barra inferior del móvil. */
    principales(E) {
      if (!Fc.activo(E)) return ['dashboard', 'agenda', 'cortes', 'consejo', 'territorio'];
      const am = Fc.ambito(E), ej = Fc.ejecutivo(E);
      if (am === 'aut') return ['dashboard', 'agenda', 'parlaut', ej ? 'consejo' : 'leyes', 'territorio'];
      if (am === 'local') return ['dashboard', 'agenda', 'ayuntamiento', 'local2', 'elecciones'];
      return ['dashboard', 'agenda', 'cortes', ej ? 'consejo' : 'leyes', 'territorio'];
    },
    /* ¿Se muestra esta acción en la agenda? */
    accion(E, a) {
      if (!Fc.activo(E)) return true; const am = Fc.ambito(E), id = a.id, g = a.grupo;
      const lim = ACC_AMB[id] || GRUPO_AMB[g]; if (lim && !lim.includes(am)) return false;
      if (am === 'central' && g === 'nacional' && ACC_GOB.includes(id) && !Fc.ejecutivo(E)) return false;
      return true;
    },
    /* Grupo de la agenda en el que se muestra una acción (la votación de la Conferencia de Presidentes cuenta como autonómica). */
    grupoDe(E, a) { const l = ACC_AMB[a.id]; return Fc.activo(E) && a.grupo === 'nacional' && l && l.length === 1 && l[0] === 'aut' ? 'autonomico' : a.grupo; },
    evento(E, id) { if (!Fc.activo(E)) return true; const l = EV_AMB[id]; return !l || l.includes(Fc.ambito(E)); },
    dilema(E, id) { if (!Fc.activo(E)) return true; const l = DL_AMB[id]; return !l || l.includes(Fc.ambito(E)); },
    /* ¿Te corresponde esta noche electoral? tipo: generales | locales | europeas; datos: { aut: [{c}], mun } para las jornadas locales. */
    noche(E, tipo, datos) {
      if (!Fc.activo(E)) return true; const am = Fc.ambito(E), J = E.jugador;
      if (tipo === 'generales' || tipo === 'europeas') return am === 'central';
      if (tipo === 'locales') { if (am === 'aut') return !!(datos && (datos.aut || []).some(x => x.c === J.region)); if (am === 'local') return !!(datos && datos.mun); return false; }
      return true;
    },
    /* ¿Es tuya esta campaña? key: 'gen' o el código de la comunidad. */
    campana(E, key) { if (!Fc.activo(E)) return true; const am = Fc.ambito(E); return am === 'central' ? key === 'gen' : am === 'aut' ? key === E.jugador.region : false; },
    ambitosLey(E) { const am = Fc.ambito(E); return am === 'todo' ? null : am === 'central' ? ['congreso'] : am === 'aut' ? ['aut'] : ['muni']; },
    tabsTerritorio(E) { const am = Fc.ambito(E); return am === 'todo' ? null : TABS_TERR[am]; },
    tabsElecciones(E) { const am = Fc.ambito(E); return am === 'todo' ? null : TABS_ELEC[am]; },
    /* ¿Se te muestra este titular? Lo de otros niveles (y de otras comunidades o municipios) se queda fuera. */
    noticia(E, n) {
      if (!Fc.activo(E) || !n.amb) return true; const J = E.jugador, am = Fc.ambito(E), m = n.muni && E.esp.muni && E.esp.muni.m[n.muni];
      if (am === 'central') return false;
      if (am === 'aut') return n.amb === 'aut' ? (!n.reg || n.reg === J.region) : !!(m && m.ccaa === J.region);
      return n.amb === 'local' ? (!n.muni || n.muni === J.muni) : (!n.reg || n.reg === J.region);
    },
    /* Resumen de tu foco para el Centro de mando y Ajustes. */
    info(E) {
      const am = Fc.ambito(E); if (am === 'todo') return null; const ej = Fc.ejecutivo(E);
      const t = TEXTO[am][ej ? 'exec' : 'parl'];
      return { ambito: am, ejecutivo: ej, titulo: t[0], texto: t[1], auto: AUTO[am], cargo: C.Personaje ? C.Personaje.cargoTxt(E) : E.jugador.cargo };
    }
  };
})(window.ESP);

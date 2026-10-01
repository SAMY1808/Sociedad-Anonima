/* Expedientes europeos.
   t: título · tipo: directiva | reglamento | decision | cumbre · s: sector · eco/soc/eu: posición del texto
   may: 'QMV' (mayoría cualificada: 55 % de Estados que sumen el 65 % de la población, + mayoría del Parlamento)
        'unan' (unanimidad en el Consejo; veto de cualquier Estado) · cumbre: lo decide el Consejo Europeo por consenso
   afecta: {interés sectorial → +1 beneficia / −1 perjudica} · ef: efectos al aprobarse en los Estados miembros
   cand: afecta a un candidato (se llena en ejecución)                                                         */
window.EUROPA = window.EUROPA || {};
EUROPA.DATA = EUROPA.DATA || {};
EUROPA.DATA.expedientes = [
  { id: 'clima2040', t: 'Objetivo climático del 90 % de reducción de emisiones para 2040', tipo: 'reglamento', s: 'amb', eco: -30, soc: -55, eu: 40, may: 'QMV', afecta: { ind: -0.4, agr: -0.5, ene: -0.3, nuc: 0.2 }, ef: { crec: -0.1, infl: 0.1 }, d: 'Fija la senda de descarbonización con créditos internacionales limitados.' },
  { id: 'pacto_migracion', t: 'Pacto de migración y asilo: reparto de solidaridad', tipo: 'reglamento', s: 'seg', eco: 5, soc: 30, eu: 25, may: 'QMV', afecta: { mig: 0.9 }, ef: {}, d: 'Reparto obligatorio de solicitantes de asilo o contribución financiera.' },
  { id: 'defensa_comun', t: 'Programa europeo de defensa y compras conjuntas', tipo: 'reglamento', s: 'ext', eco: 15, soc: 20, eu: 40, may: 'QMV', afecta: { def: 0.6, ind: 0.3, neu: -0.7 }, ef: { deficit: 0.2 }, d: 'Fondo de 150 000 M€ en préstamos para industria militar europea.' },
  { id: 'eurobonos', t: 'Emisión de deuda común para inversión estratégica', tipo: 'reglamento', s: 'eco', eco: -35, soc: -10, eu: 70, may: 'unan', afecta: { fin: -0.3 }, ef: { crec: 0.15 }, d: 'Un nuevo instrumento de deuda conjunta para financiar la competitividad.' },
  { id: 'reglas_fiscales_ue', t: 'Revisión del Pacto de Estabilidad y Crecimiento', tipo: 'reglamento', s: 'eco', eco: 30, soc: 5, eu: 30, may: 'QMV', afecta: {}, ef: { deficit: -0.2 }, d: 'Trayectorias de ajuste por país y sanciones más automáticas.' },
  { id: 'ia_reglamento', t: 'Reglamento de inteligencia artificial de segunda generación', tipo: 'reglamento', s: 'dig', eco: -15, soc: -10, eu: 35, may: 'QMV', afecta: { pyme: -0.3 }, ef: {}, d: 'Obligaciones para sistemas de alto riesgo y modelos fundacionales.' },
  { id: 'union_ahorros', t: 'Unión de Ahorros e Inversiones (mercado de capitales)', tipo: 'directiva', s: 'eco', eco: 55, soc: 0, eu: 45, may: 'QMV', afecta: { fin: 0.7 }, ef: { crec: 0.15 }, d: 'Armoniza supervisión y fiscalidad para integrar los mercados de capitales.' },
  { id: 'salario_minimo_ue', t: 'Directiva de salarios mínimos adecuados', tipo: 'directiva', s: 'soc', eco: -55, soc: -15, eu: 30, may: 'QMV', afecta: { pyme: -0.4 }, ef: { paro: 0.1 }, d: 'Referencias comunes para fijar salarios mínimos justos.' },
  { id: 'impuesto_digital', t: 'Impuesto digital europeo', tipo: 'directiva', s: 'dig', eco: -45, soc: -5, eu: 40, may: 'unan', afecta: { fin: -0.4 }, ef: { deficit: -0.1 }, d: 'Fiscalidad común de las grandes plataformas digitales. Requiere unanimidad.' },
  { id: 'aranceles_acero', t: 'Aranceles y cuotas al acero y los coches eléctricos importados', tipo: 'reglamento', s: 'eco', eco: -15, soc: 20, eu: 10, may: 'QMV', afecta: { ind: 0.6, tur: -0.1 }, ef: { infl: 0.1 }, d: 'Protección comercial frente a la competencia subvencionada.' },
  { id: 'pac_reforma', t: 'Reforma de la Política Agrícola Común 2028-2034', tipo: 'reglamento', s: 'agr', eco: -10, soc: 25, eu: 15, may: 'QMV', afecta: { agr: 0.8 }, ef: { deficit: 0.1 }, d: 'Ayudas más simples y condicionalidad verde atenuada.' },
  { id: 'mercosur', t: 'Acuerdo de libre comercio UE-Mercosur', tipo: 'decision', s: 'eco', eco: 50, soc: 0, eu: 30, may: 'QMV', afecta: { agr: -0.8, ind: 0.5 }, ef: { crec: 0.1 }, d: 'Libre comercio con gran apertura de mercados agrícolas.' },
  { id: 'estado_derecho_ue', t: 'Condicionalidad de fondos al Estado de derecho', tipo: 'reglamento', s: 'ins', eco: 0, soc: -20, eu: 50, may: 'QMV', afecta: {}, ef: {}, d: 'Suspensión de fondos a quienes vulneren la independencia judicial o la prensa.' },
  { id: 'libertad_prensa', t: 'Ley europea de libertad de los medios', tipo: 'reglamento', s: 'ins', eco: -10, soc: -25, eu: 35, may: 'QMV', afecta: {}, ef: {}, d: 'Protección de periodistas y transparencia de la propiedad mediática.' },
  { id: 'schengen', t: 'Reforma de Schengen: controles fronterizos coordinados', tipo: 'reglamento', s: 'seg', eco: 5, soc: 35, eu: 20, may: 'QMV', afecta: { mig: -0.3, tur: -0.2 }, ef: {}, d: 'Normas comunes para reintroducir controles internos temporales.' },
  { id: 'taxonomia_nuclear', t: 'Etiquetado de la energía nuclear como inversión verde', tipo: 'decision', s: 'amb', eco: 20, soc: 10, eu: 10, may: 'QMV', afecta: { nuc: 0.9, ene: 0.2 }, ef: { infl: -0.1 }, d: 'Acceso a financiación sostenible para nuevos reactores.' },
  { id: 'coches_2035', t: 'Revisión del veto de los motores de combustión en 2035', tipo: 'reglamento', s: 'amb', eco: 40, soc: 10, eu: 0, may: 'QMV', afecta: { ind: 0.7 }, ef: { crec: 0.05 }, d: 'Flexibiliza el calendario con combustibles sintéticos y biocombustibles.' },
  { id: 'materias_criticas', t: 'Ley de materias primas críticas y reciclaje', tipo: 'reglamento', s: 'eco', eco: 0, soc: -5, eu: 40, may: 'QMV', afecta: { ind: 0.4 }, ef: { crec: 0.1 }, d: 'Objetivos de producción y reciclado de litio, tierras raras y cobre.' },
  { id: 'plataformas', t: 'Directiva sobre trabajadores de plataformas digitales', tipo: 'directiva', s: 'soc', eco: -45, soc: -15, eu: 25, may: 'QMV', afecta: { pyme: -0.2 }, ef: { paro: 0.05 }, d: 'Presunción de relación laboral para repartidores y conductores.' },
  { id: 'vivienda_ue', t: 'Plan europeo de vivienda asequible', tipo: 'decision', s: 'ter', eco: -30, soc: -10, eu: 35, may: 'QMV', afecta: { tur: -0.2 }, ef: { deficit: 0.1 }, d: 'Flexibiliza ayudas de Estado y crea un fondo de inversión.' },
  { id: 'mercado_electrico', t: 'Reforma del mercado eléctrico y precios de la energía', tipo: 'reglamento', s: 'amb', eco: -20, soc: -10, eu: 30, may: 'QMV', afecta: { ene: 0.5, ind: 0.3 }, ef: { infl: -0.15 }, d: 'Contratos a largo plazo y desacople del precio del gas.' },
  { id: 'erasmus', t: 'Ampliación de Erasmus+ y ciudadanía europea', tipo: 'decision', s: 'edu', eco: -15, soc: -40, eu: 55, may: 'QMV', afecta: {}, ef: {}, d: 'Triple de presupuesto y pase juvenil europeo.' },
  { id: 'competitividad', t: 'Brújula de competitividad: simplificación normativa', tipo: 'reglamento', s: 'eco', eco: 50, soc: 0, eu: 30, may: 'QMV', afecta: { pyme: 0.5, ind: 0.3 }, ef: { crec: 0.15 }, d: 'Reduce cargas administrativas un 25 % y aplaza obligaciones de sostenibilidad.' },
  { id: 'datos_salud', t: 'Espacio europeo de datos de salud', tipo: 'reglamento', s: 'sal', eco: -5, soc: -15, eu: 40, may: 'QMV', afecta: {}, ef: {}, d: 'Historias clínicas interoperables y uso secundario de datos.' },
  { id: 'cierre_fronteras', t: 'Directiva sobre retorno y centros de procesamiento externos', tipo: 'directiva', s: 'seg', eco: 5, soc: 55, eu: 10, may: 'QMV', afecta: { mig: 0.4 }, ef: {}, d: 'Acuerdos con terceros países y plazos de detención más largos.' },
  { id: 'fondos_cohesion', t: 'Reforma de la política de cohesión', tipo: 'reglamento', s: 'ter', eco: -20, soc: 0, eu: 30, may: 'QMV', afecta: {}, ef: {}, d: 'Fondos más condicionados y planes nacionales de reforma.' },
  { id: 'pesca', t: 'Reglamento de recursos pesqueros y áreas marinas protegidas', tipo: 'reglamento', s: 'agr', eco: -10, soc: -15, eu: 15, may: 'QMV', afecta: { pes: -0.7 }, ef: {}, d: 'Prohíbe el arrastre de fondo en áreas protegidas.' },
  { id: 'ciberseguridad', t: 'Acta de ciberresiliencia y seguridad de redes', tipo: 'directiva', s: 'dig', eco: 10, soc: 10, eu: 30, may: 'QMV', afecta: { pyme: -0.2 }, ef: {}, d: 'Requisitos de seguridad en productos y proveedores críticos.' },
  /* Dosieres de cumbre: decide el Consejo Europeo por consenso (cualquier líder puede vetar) */
  { id: 'mff', t: 'Marco financiero plurianual 2028-2034', tipo: 'cumbre', s: 'eco', eco: -10, soc: 0, eu: 45, may: 'unan', afecta: { agr: 0.3 }, ef: { crec: 0.1 }, d: 'El presupuesto europeo de siete años: tamaño, recursos propios y reparto.' },
  { id: 'sanciones_rusia', t: 'Renovación de las sanciones a Rusia', tipo: 'cumbre', s: 'ext', eco: 10, soc: 10, eu: 30, may: 'unan', afecta: { ene: -0.3, def: 0.4 }, ef: { infl: 0.05 }, d: 'Renovación semestral que exige unanimidad: nadie puede vetarla sin coste.' },
  { id: 'ampliacion', t: 'Apertura de un nuevo grupo de capítulos de adhesión', tipo: 'cumbre', s: 'ext', eco: 0, soc: -5, eu: 50, may: 'unan', afecta: { agr: -0.4, mig: -0.2 }, ef: {}, d: 'Decide si un candidato avanza en sus negociaciones.' },
  { id: 'reforma_tratados', t: 'Convención para la reforma de los tratados', tipo: 'cumbre', s: 'ins', eco: 0, soc: -10, eu: 75, may: 'unan', afecta: {}, ef: {}, d: 'Fin de la unanimidad en política exterior y más poderes para el Parlamento.' },
  { id: 'crisis_energia', t: 'Respuesta común a la crisis energética', tipo: 'cumbre', s: 'amb', eco: -20, soc: 0, eu: 35, may: 'unan', afecta: { ene: 0.3, nuc: 0.2 }, ef: { infl: -0.2 }, d: 'Compras comunes de gas, topes de precio y solidaridad entre Estados.' },
  { id: 'seguridad_colectiva', t: 'Pilar europeo de defensa y garantías de seguridad', tipo: 'cumbre', s: 'ext', eco: 10, soc: 20, eu: 55, may: 'unan', afecta: { def: 0.6, neu: -0.9 }, ef: { deficit: 0.15 }, d: 'Cláusula de defensa mutua reforzada fuera de la estructura de la OTAN.' }
];

/* Cumbres por año: meses en que se celebran los Consejos Europeos ordinarios. */
EUROPA.DATA.cumbresMeses = [3, 6, 10, 12];

/* Candidatos: capítulos (clusters) de negociación. */
EUROPA.DATA.clusters = ['Fundamentos (Estado de derecho, justicia)', 'Mercado interior', 'Competitividad y crecimiento inclusivo', 'Agenda verde y conectividad', 'Recursos, agricultura y cohesión', 'Relaciones exteriores'];

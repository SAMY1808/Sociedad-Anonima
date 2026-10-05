/* Competencias, consejerías y regímenes de financiación de las comunidades autónomas.
   Niveles de cada competencia: 0 = del Estado · 1 = compartida / delegada / adscrita · 2 = transferida (gestión plena). */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

/* dif: dificultad de que el Estado la ceda (0-1) · ley: exige ley orgánica (art. 150.2) · area: consejería que la gestiona · peso: importancia política */
ESP.DATA.competencias = {
  edu: { nombre: 'Educación', icono: '🎓', area: 'edu', dif: 0.15, ley: false, peso: 3 },
  uni: { nombre: 'Universidades', icono: '🏫', area: 'uni', dif: 0.15, ley: false, peso: 1.5 },
  sal: { nombre: 'Sanidad', icono: '🏥', area: 'sal', dif: 0.15, ley: false, peso: 3 },
  soc: { nombre: 'Servicios sociales y dependencia', icono: '🧓', area: 'soc', dif: 0.1, ley: false, peso: 1.5 },
  pol: { nombre: 'Policía autonómica', icono: '🚓', area: 'int', dif: 0.7, ley: true, peso: 2.5 },
  tra: { nombre: 'Tráfico y seguridad vial', icono: '🚦', area: 'int', dif: 0.5, ley: false, peso: 1 },
  pri: { nombre: 'Prisiones', icono: '⛓️', area: 'int', dif: 0.65, ley: true, peso: 1.5 },
  jus: { nombre: 'Medios de la Administración de Justicia', icono: '⚖️', area: 'jus', dif: 0.45, ley: false, peso: 1.5 },
  cer: { nombre: 'Cercanías y ferrocarril', icono: '🚆', area: 'mov', dif: 0.5, ley: false, peso: 2 },
  pue: { nombre: 'Puertos y aeropuertos', icono: '⚓', area: 'mov', dif: 0.8, ley: true, peso: 2 },
  cos: { nombre: 'Costas y litoral', icono: '🏖️', area: 'amb', dif: 0.4, ley: false, peso: 1 },
  agu: { nombre: 'Agua y cuencas', icono: '💧', area: 'amb', dif: 0.65, ley: false, peso: 2 },
  emp: { nombre: 'Políticas activas de empleo', icono: '🧰', area: 'emp', dif: 0.3, ley: false, peso: 1.5 },
  ss: { nombre: 'Gestión de la Seguridad Social', icono: '🏛️', area: 'emp', dif: 0.9, ley: true, peso: 3 },
  tri: { nombre: 'Gestión tributaria propia', icono: '💶', area: 'eco', dif: 0.75, ley: true, peso: 3 },
  viv: { nombre: 'Vivienda y urbanismo', icono: '🏠', area: 'ter', dif: 0.05, ley: false, peso: 2 },
  agr: { nombre: 'Agricultura, ganadería y pesca', icono: '🌾', area: 'agr', dif: 0.1, ley: false, peso: 2 },
  ind: { nombre: 'Industria, comercio y turismo', icono: '🏭', area: 'ind', dif: 0.1, ley: false, peso: 2 },
  len: { nombre: 'Lengua, cultura y medios públicos', icono: '🗣️', area: 'cul', dif: 0.2, ley: false, peso: 1.5 }
};

/* Consejerías de un gobierno autonómico */
ESP.DATA.consejerias = {
  pre: { nombre: 'Presidencia', corto: 'Presidencia', icono: '🏛️', peso: 5 },
  jus: { nombre: 'Justicia y Administraciones Públicas', corto: 'Justicia', icono: '⚖️', peso: 3 },
  eco: { nombre: 'Economía y Hacienda', corto: 'Economía', icono: '💶', peso: 7 },
  ind: { nombre: 'Industria, Comercio y Turismo', corto: 'Industria', icono: '🏭', peso: 4 },
  edu: { nombre: 'Educación', corto: 'Educación', icono: '🎓', peso: 7 },
  uni: { nombre: 'Universidades e Investigación', corto: 'Universidades', icono: '🏫', peso: 3 },
  sal: { nombre: 'Sanidad', corto: 'Sanidad', icono: '🏥', peso: 9 },
  soc: { nombre: 'Servicios Sociales y Familia', corto: 'Servicios Sociales', icono: '🧓', peso: 4 },
  int: { nombre: 'Interior y Seguridad', corto: 'Interior', icono: '🚓', peso: 6 },
  ter: { nombre: 'Territorio y Vivienda', corto: 'Territorio', icono: '🏗️', peso: 4 },
  mov: { nombre: 'Movilidad e Infraestructuras', corto: 'Movilidad', icono: '🚆', peso: 4 },
  amb: { nombre: 'Medio Ambiente y Agua', corto: 'Medio Ambiente', icono: '🌿', peso: 4 },
  agr: { nombre: 'Agricultura y Desarrollo Rural', corto: 'Agricultura', icono: '🌾', peso: 3 },
  emp: { nombre: 'Empleo y Seguridad Social', corto: 'Empleo', icono: '🧰', peso: 4 },
  cul: { nombre: 'Cultura y Política Lingüística', corto: 'Cultura', icono: '🎭', peso: 2 }
};

/* Estructura del Gobierno: entre 7 consejerías (La Rioja) y 15 (Cataluña). Cada fusión absorbe un área en otra. */
ESP.DATA.fusiones = [['uni', 'edu'], ['jus', 'pre'], ['soc', 'sal'], ['cul', 'edu'], ['mov', 'ter'], ['agr', 'amb'], ['ind', 'eco'], ['emp', 'eco']];
ESP.DATA.nCons = { CAT: 15, AND: 13, VAL: 13, MAD: 12, GAL: 12, CAN: 12, PVA: 12, ARA: 11, BAL: 11, NAV: 11, CYL: 10, CLM: 10, AST: 9, MUR: 9, EXT: 9, CNT: 8, RIO: 7, CEU: 7, MEL: 7 };
ESP.DATA.nConsMin = 7; ESP.DATA.nConsMax = 15;

/* Programas que puede impulsar un consejero (o el presidente) en cada área.
   obra: proyecto que se construye en `sem` semanas · ley: ley autonómica que debe aprobar el Parlamento regional · accion: efecto inmediato.
   pts: puntos de agenda · gest: mejora de la gestión del área · aprob: aprobación del Gobierno · deuda: coste en deuda autonómica (puntos). */
ESP.DATA.programas = {};
(function () {
  const P = (a, l) => { ESP.DATA.programas[a] = l.map(([id, tipo, n, d, pts, sem, gest, aprob, deuda]) => ({ id: a + '_' + id, area: a, tipo, n, d, pts, sem, gest, aprob, deuda })); };
  P('pre', [['modern', 'obra', 'Plan de modernización y administración electrónica', 'Ventanilla única y trámites digitales para toda la comunidad.', 2, 40, 8, 0.8, 0.4], ['transp', 'ley', 'Ley autonómica de transparencia y buen gobierno', 'Obliga a publicar contratos, agendas y patrimonio de los altos cargos.', 2, 8, 6, 0.6, 0], ['reorg', 'accion', 'Reorganizar y racionalizar la administración', 'Menos duplicidades y mejor coordinación entre consejerías.', 1, 0, 4, 0, -0.2]]);
  P('jus', [['tribunales', 'obra', 'Plan de oficinas y juzgados', 'Nuevas sedes judiciales y refuerzo de plantillas.', 2, 52, 9, 0.6, 0.5], ['gratuita', 'ley', 'Ley autonómica de justicia gratuita y mediación', 'Amplía la asistencia jurídica y la mediación.', 2, 8, 6, 0.5, 0.1]]);
  P('eco', [['equilibrio', 'accion', 'Plan de equilibrio presupuestario', 'Recorta gasto superfluo y baja la deuda.', 1, 0, 3, -0.3, -0.5], ['presup', 'ley', 'Ley de presupuestos expansivos', 'Más inversión pública y ayudas.', 2, 8, 5, 0.8, 0.6], ['fondos', 'accion', 'Captar fondos europeos', 'Prepara proyectos para los fondos de cohesión.', 1, 0, 4, 0.2, -0.2]]);
  P('ind', [['polos', 'obra', 'Polos industriales y suelo logístico', 'Parques empresariales y atracción de inversión.', 2, 60, 8, 0.8, 0.5], ['turismo', 'ley', 'Ley de turismo sostenible', 'Ordena la oferta turística y protege a los residentes.', 2, 8, 5, 0.4, 0], ['promo', 'accion', 'Campaña de promoción exterior', 'Impulsa el turismo y las exportaciones.', 1, 0, 4, 0.3, 0.1]]);
  P('edu', [['colegios', 'obra', 'Construir colegios e institutos', 'Elimina barracones y abre nuevos centros.', 2, 52, 10, 1, 0.7], ['ley', 'ley', 'Ley autonómica de educación', 'Cambia el currículo, la FP y la organización de los centros.', 2, 8, 6, 0.5, 0.1], ['ratios', 'accion', 'Reducir ratios y reforzar plantillas', 'Más profesores por aula.', 1, 0, 5, 0.5, 0.3]]);
  P('uni', [['campus', 'obra', 'Nuevos campus y laboratorios', 'Infraestructura de investigación y residencias.', 2, 60, 9, 0.6, 0.5], ['ley', 'ley', 'Ley autonómica de universidades y ciencia', 'Financiación estable y carrera investigadora.', 2, 8, 6, 0.4, 0.1], ['becas', 'accion', 'Plan de becas y matrícula reducida', 'Ayudas a estudiantes de rentas bajas.', 1, 0, 4, 0.5, 0.3]]);
  P('sal', [['hospital', 'obra', 'Construir un hospital', 'Nuevo hospital comarcal con urgencias y especialidades.', 3, 78, 12, 1.4, 1.0], ['primaria', 'accion', 'Reforzar la red de atención primaria', 'Más médicos y centros de salud abiertos por la tarde.', 2, 0, 6, 0.7, 0.4], ['ley', 'ley', 'Ley autonómica de salud pública', 'Blinda la sanidad pública y regula la colaboración con lo privado.', 2, 8, 7, 0.6, 0.1], ['esperas', 'accion', 'Plan de choque contra las listas de espera', 'Operaciones extra y concertación temporal.', 2, 0, 5, 0.8, 0.5]]);
  P('soc', [['residencias', 'obra', 'Plan de residencias y centros de día', 'Plazas públicas para mayores y dependientes.', 2, 56, 10, 0.9, 0.6], ['ley', 'ley', 'Ley autonómica de servicios sociales', 'Garantiza prestaciones y coordina ayuntamientos y comunidad.', 2, 8, 6, 0.5, 0.1], ['renta', 'accion', 'Renta garantizada de ciudadanía', 'Prestación para hogares sin ingresos.', 2, 0, 4, 0.6, 0.4]]);
  P('int', [['comisarias', 'obra', 'Nuevas comisarías y centros de emergencias', 'Mejora la respuesta ante emergencias.', 2, 44, 9, 0.7, 0.5], ['ley', 'ley', 'Ley autonómica de emergencias y protección civil', 'Coordina bomberos, sanitarios y policía.', 2, 8, 6, 0.5, 0.1], ['vial', 'accion', 'Campaña de seguridad vial', 'Reduce la siniestralidad en carretera.', 1, 0, 4, 0.2, 0.1]]);
  P('ter', [['vivienda', 'obra', 'Plan de vivienda pública y alquiler asequible', 'Promociones de vivienda protegida.', 3, 80, 11, 1.2, 0.8], ['ley', 'ley', 'Ley autonómica de vivienda', 'Regula el alquiler y los pisos vacíos.', 2, 8, 6, 0.8, 0], ['suelo', 'accion', 'Liberar suelo público', 'Agiliza licencias y suelo para vivienda.', 1, 0, 4, 0.3, 0.1]]);
  P('mov', [['metro', 'obra', 'Nueva línea de metro o cercanías', 'Gran obra de transporte público.', 3, 104, 12, 1.2, 1.2], ['carreteras', 'obra', 'Plan de carreteras y conservación', 'Arreglo de la red autonómica.', 2, 40, 8, 0.7, 0.6], ['ley', 'ley', 'Ley autonómica de movilidad sostenible', 'Prioriza el transporte público y la intermodalidad.', 2, 8, 6, 0.4, 0]]);
  P('amb', [['depuradoras', 'obra', 'Depuradoras y gestión del agua', 'Evita sanciones europeas y mejora el suministro.', 2, 56, 10, 0.8, 0.7], ['ley', 'ley', 'Ley autonómica de cambio climático', 'Objetivos de emisiones y renovables propios.', 2, 8, 6, 0.4, 0], ['incendios', 'accion', 'Plan de prevención de incendios', 'Brigadas y limpieza de montes.', 2, 0, 5, 0.6, 0.3]]);
  P('agr', [['regadios', 'obra', 'Modernización de regadíos', 'Ahorro de agua y más producción.', 2, 52, 9, 0.8, 0.6], ['ley', 'ley', 'Ley agraria autonómica', 'Apoyo a los jóvenes agricultores y a la cadena de valor.', 2, 8, 6, 0.5, 0.1], ['ayudas', 'accion', 'Ayudas extraordinarias al campo', 'Compensa costes de producción.', 1, 0, 4, 0.5, 0.3]]);
  P('emp', [['juvenil', 'accion', 'Plan de empleo juvenil', 'Contratos y formación para menores de 30 años.', 2, 0, 5, 0.6, 0.3], ['fp', 'ley', 'Ley autonómica de formación profesional', 'Conecta la FP con las empresas de la región.', 2, 8, 6, 0.5, 0.1], ['escuelas', 'obra', 'Escuelas taller y centros de empleo', 'Redes de formación para parados.', 2, 36, 8, 0.6, 0.4]]);
  P('cul', [['teatro', 'obra', 'Biblioteca, museo o gran teatro', 'Equipamiento cultural emblemático.', 2, 60, 8, 0.5, 0.6], ['ley', 'ley', 'Ley autonómica de lenguas y cultura', 'Protege la lengua propia y la creación.', 2, 8, 6, 0.4, 0], ['festival', 'accion', 'Gran festival y año cultural', 'Proyección cultural de la comunidad.', 1, 0, 4, 0.4, 0.2]]);
})();


/* Niveles de partida (el resto de comunidades de régimen común parte del nivel base). */
ESP.DATA.compBase = { edu: 2, uni: 2, sal: 2, soc: 2, pol: 0, tra: 0, pri: 0, jus: 1, cer: 0, pue: 0, cos: 1, agu: 1, emp: 2, ss: 0, tri: 0, len: 1, viv: 2, agr: 2, ind: 2 };
ESP.DATA.compEspecial = {
  CAT: { pol: 2, tra: 2, pri: 2, jus: 2, cos: 1, tri: 1, len: 2, cer: 0 },
  PVA: { pol: 2, tra: 2, pri: 2, jus: 1, cer: 1, cos: 2, agu: 2, tri: 2, len: 2 },
  NAV: { pol: 2, tra: 2, jus: 1, cos: 0, agu: 2, tri: 2, len: 1 },
  GAL: { pol: 1, cos: 2, pue: 1, len: 2 },
  AND: { pol: 1, cos: 2, agu: 2, len: 0 },
  VAL: { pol: 1, cos: 2, len: 2 },
  CAN: { pol: 1, cos: 2, agu: 2, pue: 1, len: 0 },
  BAL: { cos: 2, len: 2 },
  ARA: { agu: 1, len: 1 },
  CEU: { edu: 0, uni: 0, sal: 0, soc: 1, emp: 1, jus: 0, cos: 0, agu: 0, len: 0, agr: 1, ind: 1, viv: 1 },
  MEL: { edu: 0, uni: 0, sal: 0, soc: 1, emp: 1, jus: 0, cos: 0, agu: 0, len: 0, agr: 1, ind: 1, viv: 1 }
};

/* Qué reclama cada comunidad primero (prioridad). */
ESP.DATA.compReclama = {
  CAT: ['cer', 'ss', 'pue', 'tri', 'agu'], PVA: ['ss', 'pue', 'cer', 'jus'], NAV: ['pri', 'ss', 'cos'], GAL: ['pol', 'pue', 'tra', 'jus'],
  AND: ['pol', 'agu', 'tra', 'pue'], VAL: ['pol', 'cer', 'agu', 'pue'], CAN: ['pue', 'pol', 'tra'], BAL: ['pue', 'cer', 'pol'], ARA: ['agu', 'cer', 'tra'],
  MAD: ['cer', 'tri', 'jus', 'pol'], MUR: ['agu', 'pue', 'tra'], CLM: ['agu', 'cer'], CYL: ['agu', 'cer', 'pue'], EXT: ['cer', 'agu', 'pue'], AST: ['pue', 'cer', 'cos'], CNT: ['pue', 'tra', 'cer'], RIO: ['agu', 'tra'], CEU: ['edu', 'sal'], MEL: ['edu', 'sal']
};

/* Regímenes de financiación */
ESP.DATA.regimenes = {
  comun: { nombre: 'Régimen común (LOFCA)', desc: 'Los tributos cedidos y la participación en los ingresos del Estado financian a la comunidad; el Estado nivela entre territorios.' },
  foral: { nombre: 'Régimen foral (Concierto / Convenio)', desc: 'La comunidad recauda casi todos los impuestos y paga al Estado un cupo por las competencias que éste mantiene.' },
  canario: { nombre: 'Régimen económico y fiscal canario (REF)', desc: 'Régimen fiscal especial por la lejanía: IGIC en lugar de IVA, Zona Especial y bonificaciones.' },
  ciudad: { nombre: 'Ciudad autónoma', desc: 'Ciudad financiada en buena parte por transferencias del Estado.' },
  singular: { nombre: 'Financiación singular (concierto solidario)', desc: 'La comunidad gestiona sus impuestos y aporta una cuota de solidaridad al Estado.' }
};

/* Procesos soberanistas por comunidad: umbral de apoyo social, partido soberanista mínimo en el gobierno y nombre del episodio. */
ESP.DATA.procesos = {
  CAT: { umbral: 40, indepMin: 0.8, nombre: 'procés catalán', organo: 'Parlament', gobierno: 'Generalitat', lema: 'referéndum de independencia' },
  PVA: { umbral: 33, indepMin: 0.45, nombre: 'plan soberanista vasco', organo: 'Parlamento Vasco', gobierno: 'Gobierno Vasco', lema: 'consulta sobre el derecho a decidir' },
  GAL: { umbral: 26, indepMin: 0.3, nombre: 'proceso soberanista gallego', organo: 'Parlamento de Galicia', gobierno: 'Xunta', lema: 'consulta sobre la soberanía' },
  NAV: { umbral: 28, indepMin: 0.7, nombre: 'proceso de unidad vasco-navarra', organo: 'Parlamento de Navarra', gobierno: 'Gobierno de Navarra', lema: 'consulta sobre la integración con Euskadi' },
  CAN: { umbral: 22, indepMin: 0.1, nombre: 'proceso soberanista canario', organo: 'Parlamento de Canarias', gobierno: 'Gobierno de Canarias', lema: 'consulta sobre el estatus de las islas' },
  BAL: { umbral: 22, indepMin: 0.15, nombre: 'proceso soberanista balear', organo: 'Parlament de les Illes Balears', gobierno: 'Govern', lema: 'consulta sobre el autogobierno' },
  VAL: { umbral: 24, indepMin: 0.1, nombre: 'proceso soberanista valenciano', organo: 'Corts Valencianes', gobierno: 'Generalitat Valenciana', lema: 'consulta sobre la soberanía' }
};

/* Índice de financiación por habitante (100 = media) */
ESP.DATA.finNivel = { AND: 93, ARA: 104, AST: 105, BAL: 90, CAN: 104, CNT: 108, CLM: 98, CYL: 105, CAT: 97, VAL: 88, EXT: 106, GAL: 104, MAD: 94, MUR: 89, NAV: 140, PVA: 135, RIO: 108, CEU: 100, MEL: 100 };

/* Concejalías de un ayuntamiento y el indicador urbano que mueve cada una */
ESP.DATA.concejalias = {
  urb: { nombre: 'Urbanismo y Vivienda', icono: '🏗️', peso: 9, ind: 'vivienda' },
  mov: { nombre: 'Movilidad y Transporte', icono: '🚌', peso: 7, ind: 'movilidad' },
  seg: { nombre: 'Seguridad Ciudadana', icono: '🚓', peso: 7, ind: 'seguridad' },
  ser: { nombre: 'Servicios Urbanos y Limpieza', icono: '🧹', peso: 6, ind: 'limpieza' },
  soc: { nombre: 'Servicios Sociales y Empleo', icono: '🤝', peso: 7, ind: 'empleo' },
  cul: { nombre: 'Cultura, Turismo y Fiestas', icono: '🎭', peso: 4, ind: 'cultura' },
  hac: { nombre: 'Hacienda y Presidencia', icono: '💶', peso: 8, ind: 'deuda' }
};
ESP.DATA.indicadoresUrbanos = {
  vivienda: 'Vivienda asequible', movilidad: 'Movilidad', seguridad: 'Seguridad', limpieza: 'Limpieza y servicios', empleo: 'Empleo local', cultura: 'Cultura y turismo'
};

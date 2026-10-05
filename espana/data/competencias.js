/* Competencias, consejerías y regímenes de financiación de las comunidades autónomas.
   Niveles de cada competencia: 0 = del Estado · 1 = compartida / delegada / adscrita · 2 = transferida (gestión plena). */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

/* dif: dificultad de que el Estado la ceda (0-1) · ley: exige ley orgánica (art. 150.2) · area: consejería que la gestiona · peso: importancia política */
ESP.DATA.competencias = {
  edu: { nombre: 'Educación', icono: '🎓', area: 'edu', dif: 0.15, ley: false, peso: 3 },
  uni: { nombre: 'Universidades', icono: '🏫', area: 'edu', dif: 0.15, ley: false, peso: 1.5 },
  sal: { nombre: 'Sanidad', icono: '🏥', area: 'sal', dif: 0.15, ley: false, peso: 3 },
  soc: { nombre: 'Servicios sociales y dependencia', icono: '🧓', area: 'sal', dif: 0.1, ley: false, peso: 1.5 },
  pol: { nombre: 'Policía autonómica', icono: '🚓', area: 'int', dif: 0.7, ley: true, peso: 2.5 },
  tra: { nombre: 'Tráfico y seguridad vial', icono: '🚦', area: 'int', dif: 0.5, ley: false, peso: 1 },
  pri: { nombre: 'Prisiones', icono: '⛓️', area: 'int', dif: 0.65, ley: true, peso: 1.5 },
  jus: { nombre: 'Medios de la Administración de Justicia', icono: '⚖️', area: 'pre', dif: 0.45, ley: false, peso: 1.5 },
  cer: { nombre: 'Cercanías y ferrocarril', icono: '🚆', area: 'ter', dif: 0.5, ley: false, peso: 2 },
  pue: { nombre: 'Puertos y aeropuertos', icono: '⚓', area: 'ter', dif: 0.8, ley: true, peso: 2 },
  cos: { nombre: 'Costas y litoral', icono: '🏖️', area: 'amb', dif: 0.4, ley: false, peso: 1 },
  agu: { nombre: 'Agua y cuencas', icono: '💧', area: 'amb', dif: 0.65, ley: false, peso: 2 },
  emp: { nombre: 'Políticas activas de empleo', icono: '🧰', area: 'emp', dif: 0.3, ley: false, peso: 1.5 },
  ss: { nombre: 'Gestión de la Seguridad Social', icono: '🏛️', area: 'emp', dif: 0.9, ley: true, peso: 3 },
  tri: { nombre: 'Gestión tributaria propia', icono: '💶', area: 'eco', dif: 0.75, ley: true, peso: 3 },
  len: { nombre: 'Lengua, cultura y medios públicos', icono: '🗣️', area: 'cul', dif: 0.2, ley: false, peso: 1.5 }
};

/* Consejerías de un gobierno autonómico */
ESP.DATA.consejerias = {
  pre: { nombre: 'Presidencia y Justicia', icono: '🏛️', peso: 5 },
  eco: { nombre: 'Economía y Hacienda', icono: '💶', peso: 7 },
  edu: { nombre: 'Educación y Universidades', icono: '🎓', peso: 9 },
  sal: { nombre: 'Sanidad y Servicios Sociales', icono: '🏥', peso: 10 },
  int: { nombre: 'Interior y Seguridad', icono: '🚓', peso: 6 },
  ter: { nombre: 'Territorio, Vivienda y Transportes', icono: '🚆', peso: 6 },
  amb: { nombre: 'Medio Ambiente y Agua', icono: '🌿', peso: 4 },
  emp: { nombre: 'Empleo y Seguridad Social', icono: '🧰', peso: 4 },
  cul: { nombre: 'Cultura y Política Lingüística', icono: '🎭', peso: 2 }
};

/* Niveles de partida (el resto de comunidades de régimen común parte del nivel base). */
ESP.DATA.compBase = { edu: 2, uni: 2, sal: 2, soc: 2, pol: 0, tra: 0, pri: 0, jus: 1, cer: 0, pue: 0, cos: 1, agu: 1, emp: 2, ss: 0, tri: 0, len: 1 };
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
  CEU: { edu: 0, uni: 0, sal: 0, soc: 1, emp: 1, jus: 0, cos: 0, agu: 0, len: 0 },
  MEL: { edu: 0, uni: 0, sal: 0, soc: 1, emp: 1, jus: 0, cos: 0, agu: 0, len: 0 }
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

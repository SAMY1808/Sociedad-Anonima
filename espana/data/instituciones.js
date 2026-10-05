/* Instituciones: grupos del Parlamento Europeo (ficticios), ministerios, carteras de la Comisión, cargos y sectores. */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};
Object.assign(ESP.DATA, {
  grupos: {
    DCE: { nombre: 'Demócratas Cristianos y Conservadores Europeos', sigla: 'DCE', color: '#3B6FD4', eco: 44, soc: 28, eu: 54 },
    SPE: { nombre: 'Socialdemócratas y Progresistas Europeos', sigla: 'SPE', color: '#E0533F', eco: -42, soc: -32, eu: 48 },
    LRE: { nombre: 'Liberales y Renovadores de Europa', sigla: 'LRE', color: '#E8B923', eco: 24, soc: -28, eu: 58 },
    VEA: { nombre: 'Verdes y Alianza Libre Europea', sigla: 'VEA', color: '#3FA85C', eco: -35, soc: -65, eu: 52 },
    IZE: { nombre: 'Izquierda Unitaria Europea', sigla: 'IZE', color: '#B02A2A', eco: -78, soc: -50, eu: -5 },
    CNE: { nombre: 'Conservadores y Nacionalistas Europeos', sigla: 'CNE', color: '#2B4C94', eco: 34, soc: 60, eu: -28 },
    PAT: { nombre: 'Patriotas por la Soberanía', sigla: 'PAT', color: '#17A2A2', eco: -6, soc: 48, eu: -42 },
    ANR: { nombre: 'Alianza Nacionalista Radical', sigla: 'ANR', color: '#6B4630', eco: 26, soc: 86, eu: -80 },
    NI:  { nombre: 'No inscritos', sigla: 'NI', color: '#8C96A3', eco: 0, soc: 10, eu: 10 }
  },
  ordenGrupos: ['IZE', 'VEA', 'SPE', 'LRE', 'DCE', 'CNE', 'PAT', 'ANR', 'NI'],

  sectores: {
    eco: { nombre: 'Economía y fiscalidad', icono: '💶' },
    soc: { nombre: 'Política social y trabajo', icono: '🤝' },
    seg: { nombre: 'Interior y justicia', icono: '⚖️' },
    ext: { nombre: 'Exteriores y defensa', icono: '🛡️' },
    amb: { nombre: 'Energía y clima', icono: '🌍' },
    agr: { nombre: 'Agricultura y pesca', icono: '🌾' },
    sal: { nombre: 'Sanidad', icono: '🏥' },
    edu: { nombre: 'Educación y cultura', icono: '🎓' },
    ter: { nombre: 'Vivienda, territorio y transportes', icono: '🏗️' },
    ins: { nombre: 'Instituciones y derechos', icono: '🏛️' },
    dig: { nombre: 'Digital e innovación', icono: '💻' }
  },

  ministerios: [
    { id: 'pre', nombre: 'Presidencia, Justicia y Relaciones con las Cortes', sector: 'ins', icono: '🏛️', peso: 9 },
    { id: 'hac', nombre: 'Hacienda y Función Pública', sector: 'eco', icono: '💶', peso: 10, vp: 1 },
    { id: 'eco', nombre: 'Economía, Comercio y Empresa', sector: 'eco', icono: '📈', peso: 9 },
    { id: 'ext', nombre: 'Asuntos Exteriores, UE y Cooperación', sector: 'ext', icono: '🌐', peso: 9 },
    { id: 'int', nombre: 'Interior', sector: 'seg', icono: '🚔', peso: 8 },
    { id: 'ter', nombre: 'Política Territorial y Memoria Democrática', sector: 'ter', icono: '🗺️', peso: 8 },
    { id: 'tra', nombre: 'Trabajo y Economía Social', sector: 'soc', icono: '🤝', peso: 8, vp: 2 },
    { id: 'amb', nombre: 'Transición Ecológica y Reto Demográfico', sector: 'amb', icono: '🌍', peso: 8, vp: 3 },
    { id: 'def', nombre: 'Defensa', sector: 'ext', icono: '🛡️', peso: 7 },
    { id: 'jus', nombre: 'Justicia', sector: 'seg', icono: '⚖️', peso: 7 },
    { id: 'sal', nombre: 'Sanidad', sector: 'sal', icono: '🏥', peso: 6 },
    { id: 'edu', nombre: 'Educación, FP y Deportes', sector: 'edu', icono: '🎓', peso: 6 },
    { id: 'tpt', nombre: 'Transportes y Movilidad Sostenible', sector: 'ter', icono: '🚆', peso: 6 },
    { id: 'ind', nombre: 'Industria y Turismo', sector: 'eco', icono: '🏭', peso: 5 },
    { id: 'agr', nombre: 'Agricultura, Pesca y Alimentación', sector: 'agr', icono: '🌾', peso: 5 },
    { id: 'viv', nombre: 'Vivienda y Agenda Urbana', sector: 'ter', icono: '🏠', peso: 5 },
    { id: 'inc', nombre: 'Inclusión, Seguridad Social y Migraciones', sector: 'soc', icono: '🛟', peso: 5 },
    { id: 'dso', nombre: 'Derechos Sociales, Consumo y Agenda 2030', sector: 'soc', icono: '🧩', peso: 4 },
    { id: 'cie', nombre: 'Ciencia, Innovación y Universidades', sector: 'dig', icono: '🔬', peso: 3 },
    { id: 'dig', nombre: 'Transformación Digital', sector: 'dig', icono: '💻', peso: 3 },
    { id: 'igu', nombre: 'Igualdad', sector: 'ins', icono: '⚧️', peso: 3 },
    { id: 'cul', nombre: 'Cultura', sector: 'edu', icono: '🎭', peso: 2 },
    { id: 'jov', nombre: 'Juventud e Infancia', sector: 'soc', icono: '🧒', peso: 1 }
  ],

  /* Cartera de la Comisión Europea (una por Estado miembro). [nombre, sector] */
  carteras: [
    ['Economía y Euro', 'eco'], ['Presupuesto y Administración', 'eco'], ['Servicios Financieros y Unión de Ahorros', 'eco'], ['Mercado Interior', 'eco'],
    ['Competencia', 'eco'], ['Comercio y Seguridad Económica', 'eco'], ['Acción por el Clima y Pacto Verde', 'amb'], ['Energía', 'amb'],
    ['Agricultura y Alimentación', 'agr'], ['Pesca y Océanos', 'agr'], ['Migración e Interior', 'seg'], ['Justicia y Estado de Derecho', 'seg'],
    ['Defensa y Espacio', 'ext'], ['Alta Representación y Exteriores', 'ext'], ['Ampliación', 'ext'], ['Asociaciones Internacionales', 'ext'],
    ['Digital y Tecnología', 'dig'], ['Investigación e Innovación', 'dig'], ['Transporte y Turismo', 'ter'], ['Cohesión y Reformas', 'ter'],
    ['Vivienda Asequible', 'ter'], ['Empleo y Derechos Sociales', 'soc'], ['Salud y Bienestar Animal', 'sal'], ['Educación y Cultura', 'edu'],
    ['Protección del Consumidor', 'soc'], ['Gestión de Crisis y Preparación', 'seg'], ['Democracia y Equidad', 'ins']
  ],

  /* Cargos de carrera. nivel: peso de prestigio para decisiones y puntuación. */
  cargos: {
    activista:  { nombre: 'Dirigente sin cargo electo', icono: '📣', nivel: 1 },
    concejal:   { nombre: 'Concejal/a', icono: '🏘️', nivel: 2 },
    alcalde:    { nombre: 'Alcalde/sa', icono: '🏙️', nivel: 3 },
    dipauto:    { nombre: 'Diputado/a autonómico/a', icono: '🏛️', nivel: 3 },
    consejero:  { nombre: 'Consejero/a autonómico/a', icono: '💼', nivel: 4 },
    presauto:   { nombre: 'Presidente/a autonómico/a', icono: '🎖️', nivel: 5 },
    diputado:   { nombre: 'Diputado/a del Congreso', icono: '🪑', nivel: 4 },
    senador:    { nombre: 'Senador/a', icono: '🏛️', nivel: 3 },
    ministro:   { nombre: 'Ministro/a', icono: '💼', nivel: 6 },
    vicepres:   { nombre: 'Vicepresidente/a del Gobierno', icono: '💼', nivel: 7 },
    pm:         { nombre: 'Presidente/a del Gobierno', icono: '🇪🇸', nivel: 9 },
    mep:        { nombre: 'Eurodiputado/a', icono: '🇪🇺', nivel: 4 },
    comisario:  { nombre: 'Comisario/a europeo/a', icono: '🇪🇺', nivel: 7 },
    presCE:     { nombre: 'Presidente/a del Consejo Europeo', icono: '🇪🇺', nivel: 9 },
    presCom:    { nombre: 'Presidente/a de la Comisión Europea', icono: '🇪🇺', nivel: 9 },
    presPE:     { nombre: 'Presidente/a del Parlamento Europeo', icono: '🇪🇺', nivel: 7 }
  },
  rolesPartido: {
    base:      { nombre: 'Militante', peso: 0 },
    portavoz:  { nombre: 'Portavoz parlamentario', peso: 1 },
    direccion: { nombre: 'Dirección del partido', peso: 2 },
    lider:     { nombre: 'Líder del partido', peso: 3 }
  },
  trayectorias: [
    { id: 'concejal',  nombre: 'Concejal/a veterano/a',     desc: 'Años de gestión local y buen contacto con las bases.', atrib: { carisma: 1, gestion: 2, negociacion: 1 }, prestigio: 30, pop: 22, capEU: 5 },
    { id: 'sindical',  nombre: 'Sindicalista',               desc: 'Negociador curtido en mesas y huelgas.', atrib: { negociacion: 3, oratoria: 1 }, prestigio: 28, pop: 25, capEU: 4 },
    { id: 'academico', nombre: 'Académico/a y analista',     desc: 'Prestigio intelectual y contactos en think tanks.', atrib: { gestion: 1, oratoria: 1, integridad: 1 }, prestigio: 26, pop: 15, capEU: 22 },
    { id: 'periodista',nombre: 'Periodista político',        desc: 'Conoce a todos, domina el relato y las cámaras.', atrib: { carisma: 2, oratoria: 2 }, prestigio: 22, pop: 30, capEU: 8 },
    { id: 'empresa',   nombre: 'Empresario/a',               desc: 'Recursos y red de contactos económica.', atrib: { gestion: 2, negociacion: 1 }, prestigio: 24, pop: 14, capEU: 10 },
    { id: 'abogado',   nombre: 'Jurista / abogado/a',        desc: 'Perfil técnico, maneja los reglamentos.', atrib: { oratoria: 2, integridad: 1 }, prestigio: 28, pop: 16, capEU: 12 },
    { id: 'diplomatico',nombre: 'Diplomático/a',             desc: 'Experiencia en Bruselas y las cancillerías.', atrib: { negociacion: 2, gestion: 1 }, prestigio: 24, pop: 12, capEU: 38 },
    { id: 'activista', nombre: 'Activista cívico/a',         desc: 'Movimientos sociales y mucha movilización.', atrib: { carisma: 2, oratoria: 1 }, prestigio: 18, pop: 28, capEU: 6 }
  ]
});

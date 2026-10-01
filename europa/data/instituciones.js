/* Instituciones: grupos del Parlamento Europeo (ficticios), ministerios, carteras de la Comisión, cargos y sectores. */
window.EUROPA = window.EUROPA || {};
EUROPA.DATA = EUROPA.DATA || {};
Object.assign(EUROPA.DATA, {
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
    { id: 'eco', nombre: 'Economía y Hacienda', sector: 'eco', icono: '💶' },
    { id: 'int', nombre: 'Interior', sector: 'seg', icono: '🚔' },
    { id: 'ext', nombre: 'Asuntos Exteriores', sector: 'ext', icono: '🌐' },
    { id: 'def', nombre: 'Defensa', sector: 'ext', icono: '🛡️' },
    { id: 'jus', nombre: 'Justicia', sector: 'seg', icono: '⚖️' },
    { id: 'sal', nombre: 'Sanidad', sector: 'sal', icono: '🏥' },
    { id: 'edu', nombre: 'Educación y Cultura', sector: 'edu', icono: '🎓' },
    { id: 'tra', nombre: 'Trabajo y Pensiones', sector: 'soc', icono: '🤝' },
    { id: 'amb', nombre: 'Energía y Transición Ecológica', sector: 'amb', icono: '🌍' },
    { id: 'agr', nombre: 'Agricultura y Pesca', sector: 'agr', icono: '🌾' },
    { id: 'ter', nombre: 'Vivienda y Transportes', sector: 'ter', icono: '🏗️' },
    { id: 'eur', nombre: 'Asuntos Europeos', sector: 'ins', icono: '🇪🇺' }
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
    activista:  { nombre: 'Dirigente extraparlamentario', icono: '📣', nivel: 1 },
    diputado:   { nombre: 'Diputado/a nacional', icono: '🪑', nivel: 2 },
    ministro:   { nombre: 'Ministro/a', icono: '💼', nivel: 4 },
    pm:         { nombre: 'Jefe/a de Gobierno', icono: '🏛️', nivel: 6 },
    presidente: { nombre: 'Presidente/a de la República', icono: '🎖️', nivel: 7 },
    mep:        { nombre: 'Eurodiputado/a', icono: '🇪🇺', nivel: 3 },
    presPE:     { nombre: 'Presidente/a del Parlamento Europeo', icono: '🇪🇺', nivel: 5 },
    comisario:  { nombre: 'Comisario/a europeo/a', icono: '🇪🇺', nivel: 5 },
    presCE:     { nombre: 'Presidente/a del Consejo Europeo', icono: '🇪🇺', nivel: 7 },
    presCom:    { nombre: 'Presidente/a de la Comisión Europea', icono: '🇪🇺', nivel: 7 }
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

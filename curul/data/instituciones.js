/* Reglas institucionales (inspiradas en la Constitución de 1991 y la Ley 5ª de 1992). */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};

CURUL.DATA.sectores = {
  educacion:      { nombre:'Educación',          icono:'🎓', comision:6 },
  salud:          { nombre:'Salud',              icono:'⚕',  comision:7 },
  empleo:         { nombre:'Trabajo y empleo',   icono:'⚒',  comision:7 },
  seguridad:      { nombre:'Seguridad y defensa',icono:'🛡',  comision:2 },
  justicia:       { nombre:'Justicia',           icono:'⚖',  comision:1 },
  politica:       { nombre:'Reforma política',   icono:'🗳',  comision:1 },
  paz:            { nombre:'Paz y víctimas',     icono:'🕊',  comision:1 },
  hacienda:       { nombre:'Hacienda y tributos',icono:'💰', comision:3 },
  presupuesto:    { nombre:'Presupuesto',        icono:'📊', comision:4 },
  agricultura:    { nombre:'Agro y tierras',     icono:'🌾', comision:5 },
  ambiente:       { nombre:'Ambiente',           icono:'🌳', comision:5 },
  energia:        { nombre:'Minas y energía',    icono:'⚡', comision:5 },
  infraestructura:{ nombre:'Infraestructura y transporte', icono:'🛣', comision:6 },
  tecnologia:     { nombre:'TIC y ciencia',      icono:'💡', comision:6 },
  vivienda:       { nombre:'Vivienda',           icono:'🏠', comision:7 },
  comercio:       { nombre:'Comercio e industria',icono:'🏭', comision:3 },
  exteriores:     { nombre:'Relaciones exteriores',icono:'🌎', comision:2 },
  cultura:        { nombre:'Cultura y deporte',  icono:'🎭', comision:6 }
};

CURUL.DATA.comisiones = [
  { n:1, nombre:'Primera', tema:'Constitucional: reformas, justicia, orden territorial, derechos', senado:21, camara:38 },
  { n:2, nombre:'Segunda', tema:'Relaciones exteriores, defensa, fuerza pública, comercio exterior', senado:12, camara:20 },
  { n:3, nombre:'Tercera', tema:'Hacienda y crédito público, impuestos, banca', senado:16, camara:29 },
  { n:4, nombre:'Cuarta',  tema:'Presupuesto, control fiscal, bienes nacionales', senado:15, camara:27 },
  { n:5, nombre:'Quinta',  tema:'Agro, ambiente, minas y energía, recursos naturales', senado:13, camara:22 },
  { n:6, nombre:'Sexta',   tema:'Transporte, comunicaciones, educación, cultura, ciencia', senado:13, camara:24 },
  { n:7, nombre:'Séptima', tema:'Salud, trabajo, seguridad social, vivienda, mujer y familia', senado:13, camara:23 }
];

CURUL.DATA.ministerios = [
  ['interior','Interior','politica'], ['exteriores','Relaciones Exteriores','exteriores'],
  ['hacienda','Hacienda y Crédito Público','hacienda'], ['justicia','Justicia y del Derecho','justicia'],
  ['defensa','Defensa Nacional','seguridad'], ['agricultura','Agricultura y Desarrollo Rural','agricultura'],
  ['salud','Salud y Protección Social','salud'], ['trabajo','Trabajo','empleo'],
  ['minas','Minas y Energía','energia'], ['comercio','Comercio, Industria y Turismo','comercio'],
  ['educacion','Educación Nacional','educacion'], ['ambiente','Ambiente y Desarrollo Sostenible','ambiente'],
  ['vivienda','Vivienda, Ciudad y Territorio','vivienda'], ['tic','Tecnologías de la Información','tecnologia'],
  ['transporte','Transporte','infraestructura'], ['cultura','Culturas, Artes y Saberes','cultura'],
  ['deporte','Deporte','cultura'], ['ciencia','Ciencia, Tecnología e Innovación','tecnologia'],
  ['igualdad','Igualdad y Equidad','paz']
].map(m => ({ id:m[0], nombre:m[1], sector:m[2] }));

/* Composición de cada cámara. `vigencia`: último año de elección en que existe esa circunscripción. */
CURUL.DATA.camaras = {
  senado: {
    nombre:'Senado de la República', umbral:0.03, nacional:100,
    especiales:[
      { id:'IND-SEN', nombre:'Circunscripción indígena', curules:2, partidos:['MIS'] },
      { id:'OPO-SEN', nombre:'Estatuto de Oposición (2º presidencial)', curules:1, oposicion:true }
    ]
  },
  camara: {
    nombre:'Cámara de Representantes', umbralMayor:0.5, umbralMenor:0.3,
    especiales:[
      { id:'AFRO', nombre:'Comunidades afrodescendientes', curules:2, partidos:['IND','PLR','FAP'] },
      { id:'INDG', nombre:'Comunidades indígenas', curules:1, partidos:['MIS'] },
      { id:'RAIZ', nombre:'Comunidad raizal', curules:1, partidos:['IND','PLR'] },
      { id:'EXT',  nombre:'Colombianos en el exterior', curules:1, partidos:null },
      { id:'CITREP', nombre:'Circunscripciones Transitorias Especiales de Paz', curules:16, partidos:['IND'], vigencia:2026 },
      { id:'OPO-CAM', nombre:'Estatuto de Oposición (fórmula vicepresidencial)', curules:1, oposicion:true }
    ]
  }
};

/* Trámite legislativo. Cada etapa: id, nombre, tipo de instancia. */
CURUL.DATA.tramite = {
  ordinaria: ['radicacion','comision1','plenaria1','comision2','plenaria2','conciliacion','sancion'],
  acto:      ['radicacion','comision1','plenaria1','comision2','plenaria2','conciliacion',
              'comision3','plenaria3','comision4','plenaria4','promulgacion'],
  etapas: {
    radicacion:  { nombre:'Radicación', icono:'📥' },
    comision1:   { nombre:'Primer debate · Comisión', icono:'👥', instancia:'comision', camara:'origen' },
    plenaria1:   { nombre:'Segundo debate · Plenaria', icono:'🏛', instancia:'plenaria', camara:'origen' },
    comision2:   { nombre:'Tercer debate · Comisión', icono:'👥', instancia:'comision', camara:'otra' },
    plenaria2:   { nombre:'Cuarto debate · Plenaria', icono:'🏛', instancia:'plenaria', camara:'otra' },
    conciliacion:{ nombre:'Conciliación', icono:'🤝' },
    comision3:   { nombre:'2ª vuelta · Comisión (origen)', icono:'👥', instancia:'comision', camara:'origen' },
    plenaria3:   { nombre:'2ª vuelta · Plenaria (origen)', icono:'🏛', instancia:'plenaria', camara:'origen' },
    comision4:   { nombre:'2ª vuelta · Comisión (otra)', icono:'👥', instancia:'comision', camara:'otra' },
    plenaria4:   { nombre:'2ª vuelta · Plenaria (otra)', icono:'🏛', instancia:'plenaria', camara:'otra' },
    sancion:     { nombre:'Sanción presidencial', icono:'✒' },
    promulgacion:{ nombre:'Promulgación', icono:'📜' },
    objecion:    { nombre:'Objeciones presidenciales', icono:'⛔' }
  },
  tipos: {
    ordinaria:  { nombre:'Ley ordinaria', mayoria:'simple' },
    organica:   { nombre:'Ley orgánica', mayoria:'absoluta' },
    estatutaria:{ nombre:'Ley estatutaria', mayoria:'absoluta' },
    acto:       { nombre:'Acto legislativo', mayoria:'absoluta' }
  }
};

CURUL.DATA.cargos = {
  ciudadano:   { nombre:'Ciudadano', nivel:0 },
  lider:       { nombre:'Líder comunitario', nivel:0 },
  activista:   { nombre:'Activista', nivel:0 },
  asesor:      { nombre:'Asesor político', nivel:1 },
  academico:   { nombre:'Académico', nivel:1 },
  periodista:  { nombre:'Periodista', nivel:1 },
  empresario:  { nombre:'Empresario', nivel:1 },
  ong:         { nombre:'Director de ONG', nivel:1 },
  sindicalista:{ nombre:'Líder sindical', nivel:1 },
  concejal:    { nombre:'Concejal', nivel:2, electo:true },
  diputado:    { nombre:'Diputado departamental', nivel:2, electo:true },
  alcalde:     { nombre:'Alcalde', nivel:3, electo:true },
  representante:{ nombre:'Representante a la Cámara', nivel:3, electo:true, camara:'camara' },
  senador:     { nombre:'Senador de la República', nivel:4, electo:true, camara:'senado' },
  gobernador:  { nombre:'Gobernador', nivel:4, electo:true },
  ministro:    { nombre:'Ministro', nivel:4 },
  presidente:  { nombre:'Presidente de la República', nivel:5, electo:true }
};

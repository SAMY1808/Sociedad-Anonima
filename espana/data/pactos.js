/* Pactos de investidura y de legislatura: demandas de los socios, vetos y cuánto cuestan políticamente.
   tabu(c): el candidato c ({ter, eco, soc}) no puede aceptar la demanda. coste: desgaste político (0-10). */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

ESP.DATA.demandas = {
  amnistia:       { nombre: 'Amnistía a los encausados por el procés', icono: '🕊️', tabu: c => c.ter < -25, coste: 8, ef: { indep: -3, rel: 8 }, ley: 'amnistia', sector: 'ins' },
  referendum:     { nombre: 'Referéndum de autodeterminación pactado', icono: '🗳️', tabu: c => c.ter < 55, coste: 10, ef: { indep: -1, rel: 12 }, ley: null, sector: 'ter' },
  financiacion:   { nombre: 'Financiación singular / cupo', icono: '💶', tabu: c => c.ter < -42, coste: 6, ef: { rel: 8 }, ley: 'financiacion_singular', sector: 'eco' },
  transferencias: { nombre: 'Traspaso de competencias (tráfico, costas, cercanías)', icono: '🏛️', tabu: c => c.ter < -55, coste: 3, ef: { aut: 4, rel: 5 }, ley: 'transferencias', sector: 'ter' },
  lengua:         { nombre: 'Oficialidad de las lenguas en el Congreso y la UE', icono: '🗣️', tabu: c => c.ter < -40, coste: 3, ef: { rel: 3 }, ley: null, sector: 'edu' },
  presos:         { nombre: 'Acercamiento de presos y fin de la dispersión', icono: '⛓️', tabu: c => c.ter < -30, coste: 6, ef: { rel: 4 }, ley: null, sector: 'seg' },
  deuda:          { nombre: 'Quita de la deuda autonómica', icono: '🧾', tabu: c => c.eco > 32, coste: 5, ef: { rel: 4 }, ley: 'quita_deuda', sector: 'eco' },
  infraestructuras: { nombre: 'Plan de infraestructuras y agua', icono: '🚆', tabu: () => false, coste: 2, ef: { rel: 3 }, ley: null, sector: 'ter' },
  canarias:       { nombre: 'Fondos para Canarias y menores migrantes', icono: '🌴', tabu: () => false, coste: 2, ef: { rel: 3 }, ley: null, sector: 'soc' },
  social:         { nombre: 'Escudo social y vivienda', icono: '🏠', tabu: c => c.eco > 36, coste: 3, ef: {}, ley: 'escudo_social', sector: 'soc' },
  ministerios:    { nombre: 'Entrar en el Gobierno (ministerios)', icono: '💼', tabu: () => false, coste: 2, ef: {}, ley: null, sector: 'ins' },
  presidencia:    { nombre: 'Presidencia del Congreso o del Senado', icono: '🪑', tabu: () => false, coste: 1, ef: {}, ley: null, sector: 'ins' }
};

/* Lo que exige cada partido para apoyar: req = demandas imprescindibles; extra = secundarias. */
ESP.DATA.perfilSocios = {
  RCU: { req: ['amnistia', 'financiacion'], extra: ['transferencias', 'lengua'] },
  FUC: { req: ['amnistia', 'referendum'], extra: ['financiacion', 'lengua'] },
  CPC: { req: ['amnistia', 'referendum'], extra: ['presos'] },
  UVN: { req: ['transferencias'], extra: ['financiacion', 'infraestructuras'] },
  EHU: { req: ['presos', 'transferencias'], extra: ['social', 'lengua'] },
  FGA: { req: ['infraestructuras'], extra: ['lengua', 'social'] },
  ACI: { req: ['canarias'], extra: ['infraestructuras'] },
  UFN: { req: [], extra: ['infraestructuras'] },
  VUN: { req: ['infraestructuras'], extra: ['social', 'deuda'] },
  IPL: { req: ['infraestructuras'], extra: ['social'] },
  UAP: { req: ['infraestructuras'], extra: ['social'] },
  TVE: { req: ['infraestructuras'], extra: [] },
  CPR: { req: ['infraestructuras'], extra: [] },
  PPI: { req: ['ministerios', 'social'], extra: ['presidencia'] },
  APU: { req: ['social'], extra: ['ministerios'] },
  VAP: { req: ['ministerios'], extra: [] },
  CLD: { req: [], extra: ['infraestructuras'] },
  UPC: { req: [], extra: [] },
  ASD: { req: [], extra: [] }
};

/* Cada partido se niega a apoyar un bloque que incluya a estos. */
ESP.DATA.vetos = {
  VAP: ['ASD', 'PPI', 'APU', 'RCU', 'FUC', 'CPC', 'EHU', 'UVN', 'FGA', 'VUN', 'IPL', 'UAP'],
  UPC: ['PPI', 'APU', 'RCU', 'FUC', 'CPC', 'EHU', 'FGA'],
  ASD: ['VAP'],
  PPI: ['VAP', 'UPC'], APU: ['VAP', 'UPC'],
  RCU: ['VAP', 'UPC'], FUC: ['VAP', 'UPC'], CPC: ['VAP', 'UPC', 'ASD'], EHU: ['VAP', 'UPC'],
  UVN: ['VAP'], FGA: ['VAP', 'UPC'], VUN: ['VAP', 'UPC'], IPL: ['VAP'], UAP: ['VAP'],
  ACI: [], CPR: [], TVE: [],
  UFN: ['ASD', 'PPI', 'APU', 'RCU', 'FUC', 'CPC', 'EHU'],
  CLD: ['PPI', 'APU', 'RCU', 'FUC', 'CPC', 'EHU']
};

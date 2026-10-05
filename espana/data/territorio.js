/* Territorio de España: 17 comunidades autónomas, 2 ciudades autónomas, 50 provincias + Ceuta y Melilla
   (52 circunscripciones del Congreso) y 67 municipios principales.
   Datos aproximados (población 2023). Las posiciones `pos` sirven para el mapa de mosaicos por provincias. */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

ESP.DATA.ccaa = {
  AND: { nombre: 'Andalucía', capital: 'Sevilla', pob: 8.6, pibpc: 21, esc: 109, um: 3, prox: [2030, 6], foral: false, policia: false, lengua: null, indep: 2, aut: 62, sen: 9, munis: 785, regimen: 'común',
         rasgo: 'La región más poblada; sin partidos regionalistas fuertes, es el gran granero de votos y de escaños.' },
  ARA: { nombre: 'Aragón', capital: 'Zaragoza', pob: 1.35, pibpc: 31, esc: 67, um: 3, prox: [2027, 5], foral: false, policia: false, lengua: 'aragonés', indep: 3, aut: 55, sen: 2, munis: 731, regimen: 'común',
         rasgo: 'Territorio despoblado donde «Teruel Vive» demuestra que la España vaciada también vota.' },
  AST: { nombre: 'Asturias', capital: 'Oviedo', pob: 1.0, pibpc: 24, esc: 45, um: 3, prox: [2027, 5], foral: false, policia: false, lengua: 'asturiano', indep: 2, aut: 55, sen: 2, munis: 78, regimen: 'común',
         rasgo: 'Región industrial y minera, con tradición de izquierdas y envejecimiento acusado.' },
  BAL: { nombre: 'Illes Balears', capital: 'Palma', pob: 1.2, pibpc: 30, esc: 59, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: 'catalán', indep: 5, aut: 58, sen: 2, munis: 67, regimen: 'común',
         rasgo: 'Turismo, vivienda inasequible y una financiación que la deja entre las regiones que más aportan.' },
  CAN: { nombre: 'Canarias', capital: 'Las Palmas / Santa Cruz', pob: 2.2, pibpc: 22, esc: 70, um: 4, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 8, aut: 66, sen: 3, munis: 88, regimen: 'común (REF)',
         rasgo: 'Régimen económico propio, inmigración atlántica y una agrupación regionalista decisiva.' },
  CNT: { nombre: 'Cantabria', capital: 'Santander', pob: 0.59, pibpc: 26, esc: 35, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 2, aut: 52, sen: 1, munis: 102, regimen: 'común',
         rasgo: 'Uniprovincial, con un regionalismo moderado que hace y deshace gobiernos.' },
  CLM: { nombre: 'Castilla-La Mancha', capital: 'Toledo', pob: 2.1, pibpc: 21, esc: 33, um: 3, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 1, aut: 50, sen: 2, munis: 919, regimen: 'común',
         rasgo: 'Bastión socialista rural; el agua y el trasvase marcan su política.' },
  CYL: { nombre: 'Castilla y León', capital: 'Valladolid', pob: 2.4, pibpc: 25, esc: 81, um: 3, prox: [2030, 3], foral: false, policia: false, lengua: 'leonés', indep: 2, aut: 52, sen: 3, munis: 2248, regimen: 'común',
         rasgo: 'La región con más municipios de España y una despoblación crítica.' },
  CAT: { nombre: 'Cataluña', capital: 'Barcelona', pob: 8.0, pibpc: 34, esc: 135, um: 3, prox: [2028, 5], foral: false, policia: true, lengua: 'catalán', indep: 38, aut: 78, sen: 8, munis: 947, regimen: 'común (financiación singular en debate)',
         rasgo: 'Policía propia, lengua cooficial y el movimiento independentista más importante de Europa occidental.' },
  VAL: { nombre: 'Comunitat Valenciana', capital: 'Valencia', pob: 5.2, pibpc: 24, esc: 99, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: 'valenciano', indep: 3, aut: 58, sen: 5, munis: 542, regimen: 'común',
         rasgo: 'Infrafinanciada, con la DANA y la lengua como asuntos de primer orden.' },
  EXT: { nombre: 'Extremadura', capital: 'Mérida', pob: 1.05, pibpc: 19.5, esc: 65, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 1, aut: 48, sen: 2, munis: 388, regimen: 'común',
         rasgo: 'La renta más baja del país y reivindicación ferroviaria permanente.' },
  GAL: { nombre: 'Galicia', capital: 'Santiago de Compostela', pob: 2.7, pibpc: 24, esc: 75, um: 5, prox: [2028, 2], foral: false, policia: false, lengua: 'gallego', indep: 8, aut: 66, sen: 4, munis: 313, regimen: 'común',
         rasgo: 'Feudo conservador con un nacionalismo gallego de izquierdas como segunda fuerza.' },
  MAD: { nombre: 'Comunidad de Madrid', capital: 'Madrid', pob: 7.0, pibpc: 38, esc: 135, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 1, aut: 56, sen: 7, munis: 179, regimen: 'común',
         rasgo: 'Capital y mayor PIB: baja fiscalidad, enfrentamiento con el Gobierno central y una política muy polarizada.' },
  MUR: { nombre: 'Región de Murcia', capital: 'Murcia', pob: 1.55, pibpc: 22, esc: 45, um: 3, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 1, aut: 50, sen: 2, munis: 45, regimen: 'común',
         rasgo: 'Agricultura intensiva, agua escasa y un voto conservador muy sólido.' },
  NAV: { nombre: 'Navarra', capital: 'Pamplona', pob: 0.67, pibpc: 36, esc: 50, um: 3, prox: [2027, 5], foral: true, policia: true, lengua: 'euskera', indep: 5, aut: 80, sen: 1, munis: 272, regimen: 'foral (Convenio Económico)',
         rasgo: 'Régimen foral propio y una política dividida entre foralismo conservador y soberanismo vasco.' },
  PVA: { nombre: 'País Vasco', capital: 'Vitoria-Gasteiz', pob: 2.2, pibpc: 37, esc: 75, um: 3, prox: [2028, 4], foral: true, policia: true, lengua: 'euskera', indep: 22, aut: 85, sen: 3, munis: 251, regimen: 'foral (Concierto Económico)',
         rasgo: 'Concierto Económico, policía propia y un nacionalismo que condiciona a cualquier Gobierno.' },
  RIO: { nombre: 'La Rioja', capital: 'Logroño', pob: 0.32, pibpc: 30, esc: 33, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 1, aut: 50, sen: 1, munis: 174, regimen: 'común',
         rasgo: 'La comunidad más pequeña: vino, bipartidismo y mucha influencia en el Senado.' },
  CEU: { nombre: 'Ceuta', capital: 'Ceuta', pob: 0.085, pibpc: 20, esc: 25, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 0, aut: 40, sen: 0, munis: 1, regimen: 'ciudad autónoma',
         rasgo: 'Ciudad autónoma en la frontera con Marruecos; la política migratoria y fronteriza lo condiciona todo.' },
  MEL: { nombre: 'Melilla', capital: 'Melilla', pob: 0.085, pibpc: 19, esc: 25, um: 5, prox: [2027, 5], foral: false, policia: false, lengua: null, indep: 0, aut: 40, sen: 0, munis: 1, regimen: 'ciudad autónoma',
         rasgo: 'Ciudad autónoma fronteriza, con un voto conservador y un fuerte componente de seguridad.' }
};

/* Circunscripciones del Congreso: [nombre, CCAA, diputados, población (miles), col, fila] */
ESP.DATA.provincias = {
  ACO: ['A Coruña', 'GAL', 8, 1120, 0, 0], LUG: ['Lugo', 'GAL', 4, 330, 1, 0], OUR: ['Ourense', 'GAL', 4, 305, 1, 1], PON: ['Pontevedra', 'GAL', 7, 945, 0, 1],
  AST: ['Asturias', 'AST', 7, 1005, 2, 0], CNT: ['Cantabria', 'CNT', 5, 590, 3, 0],
  BIZ: ['Bizkaia', 'PVA', 8, 1150, 4, 0], GIP: ['Gipuzkoa', 'PVA', 6, 725, 5, 0], ALA: ['Álava', 'PVA', 4, 335, 5, 1],
  NAV: ['Navarra', 'NAV', 5, 665, 6, 0], RIO: ['La Rioja', 'RIO', 4, 320, 6, 1],
  HUE: ['Huesca', 'ARA', 3, 225, 7, 0], ZAR: ['Zaragoza', 'ARA', 7, 975, 7, 1], TER: ['Teruel', 'ARA', 3, 135, 7, 2],
  LLE: ['Lleida', 'CAT', 4, 440, 8, 0], GIR: ['Girona', 'CAT', 6, 790, 9, 0], BCN: ['Barcelona', 'CAT', 32, 5700, 9, 1], TAR: ['Tarragona', 'CAT', 6, 830, 8, 1],
  LEO: ['León', 'CYL', 4, 455, 2, 1], PAL: ['Palencia', 'CYL', 3, 160, 3, 1], BUR: ['Burgos', 'CYL', 4, 355, 4, 1], ZAM: ['Zamora', 'CYL', 3, 165, 1, 2],
  VLL: ['Valladolid', 'CYL', 5, 520, 2, 2], SEG: ['Segovia', 'CYL', 3, 155, 3, 2], SOR: ['Soria', 'CYL', 2, 90, 5, 2], AVI: ['Ávila', 'CYL', 3, 160, 2, 3], SAL: ['Salamanca', 'CYL', 4, 330, 1, 3],
  MAD: ['Madrid', 'MAD', 37, 6900, 3, 3],
  GUA: ['Guadalajara', 'CLM', 3, 270, 4, 2], CUE: ['Cuenca', 'CLM', 3, 200, 5, 3], TOL: ['Toledo', 'CLM', 6, 740, 3, 4], CRE: ['Ciudad Real', 'CLM', 5, 495, 4, 4], ALB: ['Albacete', 'CLM', 4, 390, 6, 4],
  CAC: ['Cáceres', 'EXT', 4, 390, 1, 4], BAD: ['Badajoz', 'EXT', 5, 670, 1, 5],
  CAS: ['Castellón', 'VAL', 5, 600, 8, 2], VLC: ['Valencia', 'VAL', 16, 2650, 8, 3], ALI: ['Alicante', 'VAL', 12, 1900, 8, 4],
  MUR: ['Murcia', 'MUR', 10, 1550, 7, 5],
  HUV: ['Huelva', 'AND', 5, 530, 1, 6], SEV: ['Sevilla', 'AND', 12, 1960, 2, 6], COR: ['Córdoba', 'AND', 6, 780, 3, 5], JAE: ['Jaén', 'AND', 5, 625, 4, 5],
  GRA: ['Granada', 'AND', 7, 930, 5, 6], ALM: ['Almería', 'AND', 6, 735, 6, 6], MAL: ['Málaga', 'AND', 11, 1750, 4, 7], CAD: ['Cádiz', 'AND', 9, 1250, 2, 7],
  BAL: ['Illes Balears', 'BAL', 8, 1210, 10, 3],
  LPA: ['Las Palmas', 'CAN', 8, 1130, 0, 9], TFE: ['S. C. de Tenerife', 'CAN', 7, 1090, 1, 9],
  CEU: ['Ceuta', 'CEU', 1, 85, 3, 8], MEL: ['Melilla', 'MEL', 1, 85, 5, 8]
};

/* Municipios principales: [id, nombre, provincia, población (miles)]. Las capitales de provincia van primero. */
ESP.DATA.municipios = [
  ['m_aco', 'A Coruña', 'ACO', 249], ['m_lug', 'Lugo', 'LUG', 99], ['m_our', 'Ourense', 'OUR', 105], ['m_pon', 'Pontevedra', 'PON', 83], ['m_vig', 'Vigo', 'PON', 295],
  ['m_ovi', 'Oviedo', 'AST', 220], ['m_gij', 'Gijón', 'AST', 270], ['m_snt', 'Santander', 'CNT', 173],
  ['m_bil', 'Bilbao', 'BIZ', 345], ['m_ssb', 'San Sebastián', 'GIP', 187], ['m_vit', 'Vitoria-Gasteiz', 'ALA', 255], ['m_pam', 'Pamplona', 'NAV', 204], ['m_log', 'Logroño', 'RIO', 152],
  ['m_hue', 'Huesca', 'HUE', 53], ['m_zar', 'Zaragoza', 'ZAR', 681], ['m_ter', 'Teruel', 'TER', 36],
  ['m_lle', 'Lleida', 'LLE', 140], ['m_gir', 'Girona', 'GIR', 103], ['m_bcn', 'Barcelona', 'BCN', 1660], ['m_tar', 'Tarragona', 'TAR', 136],
  ['m_hos', "L'Hospitalet de Llobregat", 'BCN', 275], ['m_bad', 'Badalona', 'BCN', 225], ['m_ter2', 'Terrassa', 'BCN', 225], ['m_sab', 'Sabadell', 'BCN', 215],
  ['m_leo', 'León', 'LEO', 124], ['m_pal', 'Palencia', 'PAL', 78], ['m_bur', 'Burgos', 'BUR', 175], ['m_zam', 'Zamora', 'ZAM', 62], ['m_vll', 'Valladolid', 'VLL', 299],
  ['m_seg', 'Segovia', 'SEG', 52], ['m_sor', 'Soria', 'SOR', 40], ['m_avi', 'Ávila', 'AVI', 58], ['m_sal', 'Salamanca', 'SAL', 144],
  ['m_mad', 'Madrid', 'MAD', 3360], ['m_mos', 'Móstoles', 'MAD', 210], ['m_alc', 'Alcalá de Henares', 'MAD', 195], ['m_fue', 'Fuenlabrada', 'MAD', 195], ['m_leg', 'Leganés', 'MAD', 190], ['m_get', 'Getafe', 'MAD', 185],
  ['m_gua', 'Guadalajara', 'GUA', 88], ['m_cue', 'Cuenca', 'CUE', 55], ['m_tol', 'Toledo', 'TOL', 87], ['m_cre', 'Ciudad Real', 'CRE', 75], ['m_alb', 'Albacete', 'ALB', 175],
  ['m_cac', 'Cáceres', 'CAC', 96], ['m_bda', 'Badajoz', 'BAD', 150],
  ['m_cas', 'Castelló de la Plana', 'CAS', 174], ['m_vlc', 'Valencia', 'VLC', 800], ['m_ali', 'Alicante', 'ALI', 355], ['m_elc', 'Elche', 'ALI', 240],
  ['m_mur', 'Murcia', 'MUR', 470], ['m_car', 'Cartagena', 'MUR', 218],
  ['m_huv', 'Huelva', 'HUV', 143], ['m_sev', 'Sevilla', 'SEV', 685], ['m_cor', 'Córdoba', 'COR', 322], ['m_jae', 'Jaén', 'JAE', 113], ['m_gra', 'Granada', 'GRA', 230],
  ['m_alm', 'Almería', 'ALM', 200], ['m_mal', 'Málaga', 'MAL', 580], ['m_cad', 'Cádiz', 'CAD', 114], ['m_jer', 'Jerez de la Frontera', 'CAD', 213],
  ['m_pal2', 'Palma', 'BAL', 420],
  ['m_lpa', 'Las Palmas de Gran Canaria', 'LPA', 380], ['m_tfe', 'Santa Cruz de Tenerife', 'TFE', 210],
  ['m_ceu', 'Ceuta', 'CEU', 85], ['m_mel', 'Melilla', 'MEL', 85]
];

/* Escaños del Senado elegidos por circunscripción (provincias con 4; islas y ciudades autónomas aparte) */
ESP.DATA.senadoProv = { BAL: 5, LPA: 5, TFE: 6, CEU: 2, MEL: 2 };

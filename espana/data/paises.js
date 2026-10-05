/* Países jugables: 27 Estados miembros de la UE, Reino Unido y 9 candidatos oficiales a la adhesión.
   Datos aproximados e institucionalmente inspirados en la realidad (población en millones, PIB en miles de
   millones de €). Los partidos y las personas son ficticios (ver partidos.js).
   Campos:
   pob, pib · estado: ue | exue | candidato · euro: true|false|'uni' (unilateral)
   reg: parl | semi | pres · jefe: título del jefe de Gobierno · cam/esc: cámara y escaños
   sis: prop | mayor | mixto · um: umbral % · k: desproporción (1 = proporcional puro; >1 favorece a los grandes)
   fm: fracción de escaños por mayoría (sólo 'mixto') · form: dhondt | sl · mand: años de legislatura
   prox: [año, mes] de la próxima elección legislativa · meps: eurodiputados (sólo miembros)
   cordon: los partidos de extrema derecha ('ext') son excluidos de coaliciones
   elec: centro de gravedad del electorado {eco, soc, eu} (−100…+100)
   int: intereses sectoriales (agr, ind, fin, ene, def, mig, tur, pes, neu, nuc, pyme)
   ec: [crecimiento %, inflación %, paro %, deuda % PIB, déficit % PIB] */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};
ESP.DATA.paises = {
  /* ───────────── Estados miembros ───────────── */
  DE: { nombre: 'Alemania', cap: 'Berlín', bandera: '🇩🇪', pob: 84.5, pib: 4400, estado: 'ue', euro: true, reg: 'parl', jefe: 'Canciller', cam: 'Bundestag', esc: 630, sis: 'prop', um: 5, k: 1.0, form: 'sl', mand: 4, prox: [2029, 2], meps: 96, cordon: true,
        elec: { eco: 8, soc: -5, eu: 35 }, int: ['ind', 'fin', 'ene'], ec: [0.4, 2.2, 3.7, 64, 2.8], rasgo: 'Motor industrial de Europa; coaliciones largas y un cordón sanitario firme contra la extrema derecha.' },
  FR: { nombre: 'Francia', cap: 'París', bandera: '🇫🇷', pob: 68.4, pib: 2900, estado: 'ue', euro: true, reg: 'semi', jefe: 'Primer ministro', cam: 'Asamblea Nacional', esc: 577, sis: 'mayor', um: 0, k: 2.0, mand: 5, prox: [2027, 6], meps: 81, pres: { mand: 5, prox: [2027, 4], eu: true, lim: 2, titulo: 'Presidente de la República' }, cordon: true,
        elec: { eco: -5, soc: 5, eu: 10 }, int: ['agr', 'nuc', 'def', 'ind'], ec: [0.8, 1.4, 7.6, 114, 5.4], rasgo: 'República semipresidencial con deuda alta, bloques fragmentados y una calle muy movilizada.' },
  IT: { nombre: 'Italia', cap: 'Roma', bandera: '🇮🇹', pob: 59, pib: 2200, estado: 'ue', euro: true, reg: 'parl', jefe: 'Presidente del Consejo', cam: 'Cámara de Diputados', esc: 400, sis: 'mixto', um: 3, k: 1.0, fm: 0.37, form: 'dhondt', mand: 5, prox: [2027, 9], meps: 76, cordon: false,
        elec: { eco: 10, soc: 15, eu: 5 }, int: ['mig', 'tur', 'pyme', 'agr'], ec: [0.6, 1.6, 6.2, 135, 3.3], rasgo: 'Gobiernos que duran poco, frontera sur del Mediterráneo y una deuda enorme.' },
  ES: { nombre: 'España', cap: 'Madrid', bandera: '🇪🇸', pob: 48.6, pib: 1600, estado: 'ue', euro: true, reg: 'parl', jefe: 'Presidente del Gobierno', cam: 'Congreso de los Diputados', esc: 350, sis: 'prop', um: 3, k: 1.12, form: 'dhondt', mand: 4, prox: [2027, 7], meps: 61, cordon: true,
        elec: { eco: -8, soc: -8, eu: 40 }, int: ['tur', 'agr', 'ene', 'mig'], ec: [2.5, 2.3, 10.5, 101, 2.8], rasgo: 'Bloques enfrentados, nacionalismos periféricos decisivos y un mercado laboral que no baja del 10 %.' },
  PL: { nombre: 'Polonia', cap: 'Varsovia', bandera: '🇵🇱', pob: 36.6, pib: 810, estado: 'ue', euro: false, reg: 'semi', jefe: 'Primer ministro', cam: 'Sejm', esc: 460, sis: 'prop', um: 5, k: 1.08, form: 'dhondt', mand: 4, prox: [2027, 10], meps: 53, pres: { mand: 5, prox: [2030, 5], eu: false, lim: 2, titulo: 'Presidente de la República' }, cordon: false,
        elec: { eco: 5, soc: 25, eu: 15 }, int: ['def', 'agr', 'ind', 'ene'], ec: [3.2, 3.6, 3.0, 57, 6.5], rasgo: 'Potencia emergente y frontera oriental; presidente y Gobierno suelen disputarse el poder.' },
  RO: { nombre: 'Rumanía', cap: 'Bucarest', bandera: '🇷🇴', pob: 19, pib: 350, estado: 'ue', euro: false, reg: 'semi', jefe: 'Primer ministro', cam: 'Cámara de Diputados', esc: 331, sis: 'prop', um: 5, k: 1.05, form: 'dhondt', mand: 4, prox: [2028, 12], meps: 33, pres: { mand: 5, prox: [2029, 11], eu: true, lim: 2, titulo: 'Presidente de Rumanía' }, cordon: false,
        elec: { eco: 0, soc: 30, eu: 20 }, int: ['agr', 'def', 'ene'], ec: [1.0, 6.0, 5.8, 55, 8.5], rasgo: 'Mayor déficit de la UE, polarización fuerte y un papel clave en el flanco del Mar Negro.' },
  NL: { nombre: 'Países Bajos', cap: 'Ámsterdam', bandera: '🇳🇱', pob: 17.9, pib: 1100, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Cámara de Representantes', esc: 150, sis: 'prop', um: 0.67, k: 1.0, form: 'dhondt', mand: 4, prox: [2029, 10], meps: 31, cordon: true,
        elec: { eco: 12, soc: -15, eu: 20 }, int: ['fin', 'agr', 'ind'], ec: [1.4, 3.0, 3.9, 44, 1.8], rasgo: 'Proporcionalidad casi pura: quince partidos en el Parlamento y coaliciones laboriosas.' },
  BE: { nombre: 'Bélgica', cap: 'Bruselas', bandera: '🇧🇪', pob: 11.8, pib: 600, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Cámara de Representantes', esc: 150, sis: 'prop', um: 5, k: 1.04, form: 'dhondt', mand: 5, prox: [2029, 6], meps: 22, cordon: true,
        elec: { eco: 0, soc: -5, eu: 45 }, int: ['fin', 'ind'], ec: [1.0, 2.5, 6.0, 105, 4.5], rasgo: 'Sede de las instituciones europeas y sistema de partidos partido en dos comunidades lingüísticas.' },
  EL: { nombre: 'Grecia', cap: 'Atenas', bandera: '🇬🇷', pob: 10.4, pib: 240, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Parlamento Helénico', esc: 300, sis: 'prop', um: 3, k: 1.15, form: 'dhondt', mand: 4, prox: [2027, 6], meps: 21, cordon: false,
        elec: { eco: 0, soc: 25, eu: 15 }, int: ['tur', 'mig', 'def'], ec: [2.2, 2.8, 9.0, 150, 0.5], rasgo: 'Recuperada de la crisis de deuda, con tensión permanente en el Egeo y en la ruta migratoria.' },
  CZ: { nombre: 'Chequia', cap: 'Praga', bandera: '🇨🇿', pob: 10.9, pib: 330, estado: 'ue', euro: false, reg: 'parl', jefe: 'Primer ministro', cam: 'Cámara de Diputados', esc: 200, sis: 'prop', um: 5, k: 1.08, form: 'dhondt', mand: 4, prox: [2029, 10], meps: 21, cordon: false,
        elec: { eco: 10, soc: 15, eu: -5 }, int: ['ind', 'ene'], ec: [1.8, 2.5, 2.8, 45, 2.5], rasgo: 'Industria exportadora y un electorado euroescéptico que premia a los outsiders.' },
  SE: { nombre: 'Suecia', cap: 'Estocolmo', bandera: '🇸🇪', pob: 10.5, pib: 560, estado: 'ue', euro: false, reg: 'parl', jefe: 'Primer ministro', cam: 'Riksdag', esc: 349, sis: 'prop', um: 4, k: 1.0, form: 'sl', mand: 4, prox: [2030, 9], meps: 21, cordon: true,
        elec: { eco: -5, soc: -35, eu: 25 }, int: ['ind', 'def', 'ene'], ec: [1.2, 2.0, 8.5, 34, 0.8], rasgo: 'Modelo nórdico con bloques estables y debate abierto sobre seguridad y migración.' },
  PT: { nombre: 'Portugal', cap: 'Lisboa', bandera: '🇵🇹', pob: 10.6, pib: 285, estado: 'ue', euro: true, reg: 'semi', jefe: 'Primer ministro', cam: 'Asamblea de la República', esc: 230, sis: 'prop', um: 0, k: 1.1, form: 'dhondt', mand: 4, prox: [2029, 5], meps: 21, pres: { mand: 5, prox: [2031, 1], eu: false, lim: 2, titulo: 'Presidente de la República' }, cordon: true,
        elec: { eco: -5, soc: -5, eu: 45 }, int: ['tur', 'pes', 'agr'], ec: [1.9, 2.3, 6.3, 92, 0.3], rasgo: 'Estabilidad presupuestaria reciente y una extrema derecha que ya es tercera fuerza.' },
  HU: { nombre: 'Hungría', cap: 'Budapest', bandera: '🇭🇺', pob: 9.6, pib: 205, estado: 'ue', euro: false, reg: 'parl', jefe: 'Primer ministro', cam: 'Asamblea Nacional', esc: 199, sis: 'mixto', um: 5, k: 1.0, fm: 0.53, form: 'dhondt', mand: 4, prox: [2030, 4], meps: 21, cordon: false,
        elec: { eco: 0, soc: 35, eu: -10 }, int: ['agr', 'ind', 'ene'], ec: [0.6, 4.5, 4.4, 74, 5.0], rasgo: 'Sistema mixto muy favorable al partido dominante; frecuentes vetos en el Consejo.' },
  AT: { nombre: 'Austria', cap: 'Viena', bandera: '🇦🇹', pob: 9.1, pib: 480, estado: 'ue', euro: true, reg: 'parl', jefe: 'Canciller', cam: 'Consejo Nacional', esc: 183, sis: 'prop', um: 4, k: 1.0, form: 'dhondt', mand: 5, prox: [2029, 9], meps: 20, cordon: false,
        elec: { eco: 5, soc: 10, eu: 10 }, int: ['tur', 'neu', 'ind'], ec: [0.0, 3.0, 5.5, 82, 4.0], rasgo: 'País neutral con la extrema derecha como primera fuerza y gobiernos de gran coalición.' },
  BG: { nombre: 'Bulgaria', cap: 'Sofía', bandera: '🇧🇬', pob: 6.4, pib: 105, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Asamblea Nacional', esc: 240, sis: 'prop', um: 4, k: 1.03, form: 'dhondt', mand: 4, prox: [2028, 10], meps: 17, cordon: false,
        elec: { eco: 5, soc: 30, eu: 10 }, int: ['agr', 'ene', 'def'], ec: [3.0, 3.5, 3.5, 25, 3.0], rasgo: 'Último en entrar en el euro; elecciones repetidas y un sistema de partidos muy inestable.' },
  DK: { nombre: 'Dinamarca', cap: 'Copenhague', bandera: '🇩🇰', pob: 5.9, pib: 400, estado: 'ue', euro: false, reg: 'parl', jefe: 'Primer ministro', cam: 'Folketing', esc: 179, sis: 'prop', um: 2, k: 1.0, form: 'sl', mand: 4, prox: [2027, 1], meps: 15, cordon: true,
        elec: { eco: -10, soc: -20, eu: 25 }, int: ['agr', 'ene', 'pes'], ec: [2.5, 1.5, 6.0, 30, -1.0], rasgo: 'Excepciones (opt-outs) en defensa y moneda, y socialdemocracia con política migratoria dura.' },
  FI: { nombre: 'Finlandia', cap: 'Helsinki', bandera: '🇫🇮', pob: 5.6, pib: 275, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Eduskunta', esc: 200, sis: 'prop', um: 0, k: 1.0, form: 'dhondt', mand: 4, prox: [2027, 4], meps: 15, cordon: false,
        elec: { eco: 5, soc: -15, eu: 25 }, int: ['def', 'ind', 'ene'], ec: [0.5, 1.8, 9.0, 83, 3.0], rasgo: 'Nuevo miembro de la OTAN, mil trescientos kilómetros de frontera con Rusia y gobiernos de cuatro o cinco partidos.' },
  SK: { nombre: 'Eslovaquia', cap: 'Bratislava', bandera: '🇸🇰', pob: 5.4, pib: 125, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Consejo Nacional', esc: 150, sis: 'prop', um: 5, k: 1.04, form: 'dhondt', mand: 4, prox: [2027, 9], meps: 15, cordon: false,
        elec: { eco: -5, soc: 30, eu: 0 }, int: ['ind', 'ene'], ec: [1.0, 4.0, 5.5, 60, 5.5], rasgo: 'Polarización agria entre un bloque nacional-populista y una oposición liberal-progresista.' },
  IE: { nombre: 'Irlanda', cap: 'Dublín', bandera: '🇮🇪', pob: 5.3, pib: 540, estado: 'ue', euro: true, reg: 'parl', jefe: 'Taoiseach', cam: 'Dáil Éireann', esc: 174, sis: 'prop', um: 0, k: 1.12, form: 'dhondt', mand: 5, prox: [2029, 11], meps: 14, cordon: true,
        elec: { eco: 0, soc: -10, eu: 40 }, int: ['fin', 'agr', 'neu'], ec: [3.0, 2.0, 4.5, 34, -1.5], rasgo: 'Voto único transferible, neutralidad militar y una economía dependiente de las multinacionales.' },
  HR: { nombre: 'Croacia', cap: 'Zagreb', bandera: '🇭🇷', pob: 3.9, pib: 85, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Sabor', esc: 151, sis: 'prop', um: 5, k: 1.06, form: 'dhondt', mand: 4, prox: [2028, 4], meps: 12, cordon: false,
        elec: { eco: 5, soc: 30, eu: 20 }, int: ['tur', 'mig', 'pes'], ec: [3.0, 3.5, 4.5, 56, 2.5], rasgo: 'Turismo y frontera exterior de Schengen; dominada por dos grandes bloques con un tercero regionalista.' },
  LT: { nombre: 'Lituania', cap: 'Vilna', bandera: '🇱🇹', pob: 2.9, pib: 80, estado: 'ue', euro: true, reg: 'semi', jefe: 'Primer ministro', cam: 'Seimas', esc: 141, sis: 'mixto', um: 5, k: 1.0, fm: 0.5, form: 'dhondt', mand: 4, prox: [2028, 10], meps: 11, pres: { mand: 5, prox: [2029, 5], eu: true, lim: 2, titulo: 'Presidente de la República' }, cordon: false,
        elec: { eco: 0, soc: 10, eu: 30 }, int: ['def', 'ene', 'agr'], ec: [2.5, 3.0, 6.5, 40, 2.0], rasgo: 'Primera línea frente a Rusia y Bielorrusia; defensa como prioridad nacional.' },
  SI: { nombre: 'Eslovenia', cap: 'Liubliana', bandera: '🇸🇮', pob: 2.1, pib: 70, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Asamblea Nacional', esc: 90, sis: 'prop', um: 4, k: 1.02, form: 'dhondt', mand: 4, prox: [2030, 3], meps: 9, cordon: false,
        elec: { eco: -5, soc: 5, eu: 30 }, int: ['ind', 'tur'], ec: [1.8, 2.5, 3.5, 67, 2.5], rasgo: 'Pequeña y ordenada, con coaliciones de cuatro partidos y mucha volatilidad electoral.' },
  LV: { nombre: 'Letonia', cap: 'Riga', bandera: '🇱🇻', pob: 1.9, pib: 42, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Saeima', esc: 100, sis: 'prop', um: 5, k: 1.03, form: 'sl', mand: 4, prox: [2030, 10], meps: 9, cordon: false,
        elec: { eco: 5, soc: 10, eu: 20 }, int: ['def', 'ene'], ec: [1.0, 3.0, 6.5, 46, 2.5], rasgo: 'Gran minoría rusófona, sistema de partidos fragmentado y frontera oriental de la OTAN.' },
  EE: { nombre: 'Estonia', cap: 'Tallin', bandera: '🇪🇪', pob: 1.4, pib: 40, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Riigikogu', esc: 101, sis: 'prop', um: 5, k: 1.04, form: 'dhondt', mand: 4, prox: [2027, 3], meps: 7, cordon: false,
        elec: { eco: 15, soc: -5, eu: 35 }, int: ['def', 'ene'], ec: [1.0, 4.0, 7.0, 24, 3.0], rasgo: 'Estado digital pionero con una factura de defensa enorme y un voto electrónico generalizado.' },
  CY: { nombre: 'Chipre', cap: 'Nicosia', bandera: '🇨🇾', pob: 0.92, pib: 33, estado: 'ue', euro: true, reg: 'pres', jefe: 'Presidente', cam: 'Cámara de Representantes', esc: 56, sis: 'prop', um: 3.6, k: 1.05, form: 'dhondt', mand: 5, prox: [2031, 5], meps: 6, pres: { mand: 5, prox: [2028, 2], eu: true, lim: 0, titulo: 'Presidente de la República' }, cordon: false,
        elec: { eco: 5, soc: 15, eu: 15 }, int: ['fin', 'tur', 'def'], ec: [3.0, 2.0, 4.5, 60, -1.0], rasgo: 'Isla dividida: el presidente gobierna sin responsabilidad ante el Parlamento.' },
  LU: { nombre: 'Luxemburgo', cap: 'Luxemburgo', bandera: '🇱🇺', pob: 0.67, pib: 85, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Cámara de Diputados', esc: 60, sis: 'prop', um: 0, k: 1.0, form: 'dhondt', mand: 5, prox: [2028, 10], meps: 6, cordon: true,
        elec: { eco: 5, soc: -10, eu: 55 }, int: ['fin'], ec: [1.0, 2.0, 6.5, 26, 0.0], rasgo: 'Centro financiero y sede judicial de la UE; coaliciones de tres partidos.' },
  MT: { nombre: 'Malta', cap: 'La Valeta', bandera: '🇲🇹', pob: 0.57, pib: 24, estado: 'ue', euro: true, reg: 'parl', jefe: 'Primer ministro', cam: 'Cámara de Representantes', esc: 79, sis: 'prop', um: 0, k: 1.7, form: 'dhondt', mand: 5, prox: [2027, 5], meps: 6, cordon: false,
        elec: { eco: -5, soc: 5, eu: 30 }, int: ['tur', 'fin', 'neu'], ec: [4.0, 2.5, 3.0, 47, 3.0], rasgo: 'Casi un bipartidismo perfecto: dos partidos se reparten el 98 % de los votos.' },
  
  
};

/* Posición en la cuadrícula del mapa de mosaicos de Europa (col, fila). Cada mosaico es un país. */
ESP.DATA.mosaico = {
  IE: [1, 3], PT: [1, 7], ES: [2, 7], FR: [3, 5], BE: [3, 4], NL: [4, 3], LU: [4, 4], DE: [5, 4],
  DK: [5, 2], SE: [6, 1], FI: [7, 0], EE: [7, 2], LV: [7, 3], LT: [7, 4], PL: [6, 4], CZ: [5, 5], SK: [6, 5],
  AT: [5, 6], HU: [7, 5], SI: [4, 6], HR: [4, 7], RO: [8, 5], BG: [8, 6], IT: [3, 6], MT: [4, 9], EL: [7, 7],
  CY: [9, 9], };


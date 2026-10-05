/* Sistema de partidos de España (ficticio, inspirado en el real).
   amb: 'nac' (presenta listas en toda España) | 'reg' (sólo en su territorio)
   nac: apoyo nacional objetivo (%) · base: apoyo regional (%) para los regionales
   m: multiplicador por comunidad del apoyo nacional (1 = media nacional)
   ter: eje territorial (−100 centralista … +100 secesionista) · indep: partido independentista/soberanista (0-1)       */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

ESP.DATA.partidosES = [
  { sigla: 'UPC', nombre: 'Unión Popular Cristiana', arq: 'dem', amb: 'nac', nac: 33.0, ter: -50, indep: 0, grupo: 'DCE',
    m: { AND: 1.15, ARA: 1.05, AST: 0.95, BAL: 1.1, CAN: 0.8, CNT: 0.9, CLM: 1.1, CYL: 1.3, CAT: 0.45, VAL: 1.15, EXT: 1.1, GAL: 1.35, MAD: 1.25, MUR: 1.25, NAV: 0.55, PVA: 0.4, RIO: 1.35, CEU: 1.3, MEL: 1.2 } },
  { sigla: 'ASD', nombre: 'Alianza Socialdemócrata', arq: 'soc', amb: 'nac', nac: 31.5, ter: -15, indep: 0, grupo: 'SPE',
    m: { AND: 1.1, ARA: 1.0, AST: 1.2, BAL: 0.9, CAN: 1.05, CNT: 0.9, CLM: 1.25, CYL: 0.85, CAT: 0.95, VAL: 1.0, EXT: 1.3, GAL: 0.75, MAD: 0.85, MUR: 0.8, NAV: 1.0, PVA: 0.75, RIO: 0.9, CEU: 0.7, MEL: 0.9 } },
  { sigla: 'VAP', nombre: 'Vanguardia Patriota', arq: 'ext', amb: 'nac', nac: 12.4, ter: -90, indep: 0, grupo: 'CNE',
    m: { AND: 1.0, ARA: 0.9, AST: 0.8, BAL: 1.0, CAN: 0.7, CNT: 0.8, CLM: 1.1, CYL: 0.9, CAT: 0.8, VAL: 1.15, EXT: 0.9, GAL: 0.5, MAD: 1.1, MUR: 1.5, NAV: 0.4, PVA: 0.3, RIO: 0.9, CEU: 1.8, MEL: 1.5 } },
  { sigla: 'PPI', nombre: 'Plataforma Plural de Izquierdas', arq: 'izq', amb: 'nac', nac: 11.0, ter: 30, indep: 0, grupo: 'IZE',
    m: { AND: 0.85, ARA: 0.9, AST: 1.2, BAL: 1.1, CAN: 1.0, CNT: 0.8, CLM: 0.8, CYL: 0.7, CAT: 1.3, VAL: 1.0, EXT: 0.7, GAL: 1.0, MAD: 1.1, MUR: 0.6, NAV: 1.0, PVA: 1.3, RIO: 0.8, CEU: 0.5, MEL: 0.6 } },
  { sigla: 'APU', nombre: 'Ahora Pueblo', arq: 'izq', amb: 'nac', nac: 1.3, ter: 40, indep: 0, grupo: 'IZE', eco: -85, soc: -45, eu: -10,
    m: { AND: 1.0, ARA: 1.0, AST: 1.0, BAL: 1.1, CAN: 1.3, CNT: 0.9, CLM: 0.9, CYL: 0.8, CAT: 0.9, VAL: 1.0, EXT: 0.9, GAL: 0.9, MAD: 1.2, MUR: 0.8, NAV: 1.2, PVA: 0.8, RIO: 0.9, CEU: 0.5, MEL: 0.5 } },
  { sigla: 'CLD', nombre: 'Centro Liberal Democrático', arq: 'lib', amb: 'nac', nac: 1.0, ter: -70, indep: 0, grupo: 'LRE',
    m: { MUR: 1.4, MAD: 1.2, BAL: 1.2, CAT: 1.2, VAL: 1.2, CEU: 1.0, MEL: 1.0, AND: 1.0 } },
  /* — regionales — */
  { sigla: 'RCU', nombre: 'República Catalana Unida', arq: 'reg', amb: 'reg', region: 'CAT', base: 12.5, ter: 90, indep: 1, grupo: 'VEA', eco: -45, soc: -35, eu: 45, padj: { GIR: 1.3, LLE: 1.3, TAR: 1.1, BCN: 0.9 } },
  { sigla: 'FUC', nombre: 'Futur Català', arq: 'reg', amb: 'reg', region: 'CAT', base: 11, ter: 95, indep: 1, grupo: 'NI', eco: 25, soc: -10, eu: 40, padj: { GIR: 1.4, LLE: 1.2, TAR: 1.0, BCN: 0.9 } },
  { sigla: 'CPC', nombre: 'Candidatura Popular Catalana', arq: 'reg', amb: 'reg', region: 'CAT', base: 3.5, ter: 100, indep: 1, grupo: 'NI', eco: -85, soc: -55, eu: 0, padj: { GIR: 1.3 } },
  { sigla: 'UVN', nombre: 'Unión Vasca Nacionalista', arq: 'reg', amb: 'reg', region: 'PVA', base: 27, ter: 55, indep: 0.45, grupo: 'LRE', eco: 20, soc: 5, eu: 50, padj: { BIZ: 1.1, GIP: 0.95, ALA: 0.85 } },
  { sigla: 'EHU', nombre: 'Euskal Herria Unida', arq: 'reg', amb: 'reg', region: 'PVA', base: 22, ter: 80, indep: 0.8, grupo: 'IZE', eco: -60, soc: -30, eu: 20, padj: { GIP: 1.25, BIZ: 0.95, ALA: 0.8 }, extra: { NAV: 12 } },
  { sigla: 'FGA', nombre: 'Frente Galego', arq: 'reg', amb: 'reg', region: 'GAL', base: 15, ter: 60, indep: 0.3, grupo: 'VEA', eco: -55, soc: -30, eu: 30, padj: { PON: 1.15, ACO: 1.1, LUG: 0.8, OUR: 0.7 } },
  { sigla: 'ACI', nombre: 'Agrupación Canaria Independiente', arq: 'reg', amb: 'reg', region: 'CAN', base: 15, ter: 25, indep: 0.1, grupo: 'LRE', eco: 5, soc: 5, eu: 35, padj: { TFE: 1.2, LPA: 0.8 } },
  { sigla: 'UFN', nombre: 'Unión Foral Navarra', arq: 'reg', amb: 'reg', region: 'NAV', base: 25, ter: -40, indep: 0, grupo: 'DCE', eco: 35, soc: 45, eu: 45 },
  { sigla: 'VUN', nombre: 'Valencians Units', arq: 'reg', amb: 'reg', region: 'VAL', base: 10, ter: 30, indep: 0.1, grupo: 'VEA', eco: -50, soc: -45, eu: 45, padj: { VLC: 1.2, ALI: 0.8, CAS: 0.9 } },
  { sigla: 'IPL', nombre: 'Illes Plurals', arq: 'reg', amb: 'reg', region: 'BAL', base: 9, ter: 35, indep: 0.15, grupo: 'VEA', eco: -40, soc: -45, eu: 45 },
  { sigla: 'UAP', nombre: 'Unión Aragonesa Progresista', arq: 'reg', amb: 'reg', region: 'ARA', base: 5, ter: 35, indep: 0, grupo: 'VEA', eco: -45, soc: -40, eu: 50, padj: { HUE: 1.4, ZAR: 1.0, TER: 0.5 } },
  { sigla: 'TVE', nombre: 'Teruel Vive', arq: 'reg', amb: 'reg', region: 'ARA', base: 4, ter: 0, indep: 0, grupo: 'NI', eco: 0, soc: 15, eu: 30, padj: { TER: 7.0, HUE: 0.3, ZAR: 0.1 } },
  { sigla: 'CPR', nombre: 'Cantabria Propia', arq: 'reg', amb: 'reg', region: 'CNT', base: 17, ter: 10, indep: 0, grupo: 'LRE', eco: 5, soc: 5, eu: 40 }
];

/* Votante medio de España */
ESP.DATA.electorES = { eco: -8, soc: -8, eu: 40 };

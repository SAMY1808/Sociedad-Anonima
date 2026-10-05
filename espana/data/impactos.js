/* Impacto de las leyes (estilo Lawgivers II / Geopolitical Simulator 6).
   · indicadores: la «salud» del país en 12 dimensiones (0-100, más es mejor)
   · colectivos: 11 colectivos sociales con su ideología, lo que les importa y su satisfacción con el Gobierno
   · impactos[ley]: efecto de cada ley a pleno rendimiento (puntos de indicador, puntos de satisfacción de cada grupo),
     enfoques alternativos (variantes de diseño), riesgos de efectos no deseados, años de implantación (r) e incertidumbre (u).
   El alcance (limitado/estándar/ambicioso), la financiación y la entrada en vigor son comunes a todas las leyes. */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};

ESP.DATA.indicadores = {
  igual: { nombre: 'Igualdad', icono: '⚖️', base: 48, d: 'Reparto de la renta y la riqueza; pobreza y exclusión.' },
  viv:   { nombre: 'Vivienda', icono: '🏠', base: 34, d: 'Acceso a una vivienda asequible, sobre todo para jóvenes.' },
  sal:   { nombre: 'Sanidad', icono: '🏥', base: 58, d: 'Calidad y rapidez de la atención sanitaria.' },
  edu:   { nombre: 'Educación', icono: '🎓', base: 54, d: 'Resultados, equidad y acceso a la educación.' },
  seg:   { nombre: 'Seguridad', icono: '🛡️', base: 62, d: 'Seguridad ciudadana y control de las fronteras.' },
  amb:   { nombre: 'Medio ambiente', icono: '🌿', base: 50, d: 'Emisiones, agua, biodiversidad y litoral.' },
  ener:  { nombre: 'Energía', icono: '⚡', base: 55, d: 'Precio, suministro y autonomía energética.' },
  coh:   { nombre: 'Cohesión territorial', icono: '🧩', base: 52, d: 'Convivencia entre territorios y satisfacción con el autogobierno.' },
  lib:   { nombre: 'Libertades', icono: '🕊️', base: 64, d: 'Derechos civiles, pluralismo y calidad democrática.' },
  comp:  { nombre: 'Competitividad', icono: '🏭', base: 52, d: 'Productividad, innovación y clima de negocios.' },
  prot:  { nombre: 'Protección social', icono: '🤝', base: 55, d: 'Pensiones, desempleo y servicios sociales.' },
  rep:   { nombre: 'Representación democrática', icono: '🗳️', base: 60, d: 'Qué tan bien se refleja la voluntad de los ciudadanos y los territorios en las instituciones.' },
  inst:  { nombre: 'Capacidad institucional', icono: '🏛️', base: 54, d: 'Eficacia, independencia y coordinación de las administraciones y la justicia.' },
  rur:   { nombre: 'España rural', icono: '🌾', base: 40, d: 'Servicios, empleo y población en el mundo rural.' }
};

/* Acoplamiento de los indicadores con la economía (desviación respecto a la base del país). */
ESP.DATA.acoplamiento = {
  igual: { paro: -1.1 }, comp: { crec: 2.2 }, viv: { infl: -0.9 }, ener: { infl: -1.1 }, prot: { deficit: -0.8 }, rur: { crec: 0.6 }, sal: { deficit: -0.4 }, edu: { deficit: -0.3 }
};

/* peso: influencia electoral del grupo · eco/soc/eu/ter: ideología · w: lo que le importa de cada indicador · ec: lo que le importa de la economía */
ESP.DATA.colectivos = {
  obr:  { nombre: 'Trabajadores y precarios', icono: '👷', peso: 24, eco: -38, soc: -5, eu: 0, ter: 0, w: { igual: 0.9, prot: 0.7, viv: 0.5, sal: 0.5, edu: 0.3 }, ec: { paro: -1.0, infl: -0.8 } },
  med:  { nombre: 'Clase media urbana', icono: '🏙️', peso: 20, eco: 5, soc: -10, eu: 15, ter: -5, w: { viv: 0.7, sal: 0.6, edu: 0.6, comp: 0.4, seg: 0.4 }, ec: { crec: 0.7, infl: -0.6 } },
  aut:  { nombre: 'Autónomos y pymes', icono: '🧰', peso: 9, eco: 38, soc: 10, eu: 0, ter: -5, w: { comp: 0.9, ener: 0.4, igual: -0.1 }, ec: { crec: 0.8, infl: -0.5 } },
  emp:  { nombre: 'Gran empresa y finanzas', icono: '🏦', peso: 5, eco: 72, soc: 20, eu: 25, ter: -10, w: { comp: 1.0, ener: 0.4, lib: 0.2 }, ec: { crec: 0.8, deficit: -0.4 } },
  pen:  { nombre: 'Pensionistas', icono: '👵', peso: 20, eco: -15, soc: 25, eu: 0, ter: -5, w: { prot: 1.0, sal: 0.9, seg: 0.4 }, ec: { infl: -1.0 } },
  jov:  { nombre: 'Jóvenes', icono: '🧑‍🎓', peso: 15, eco: -22, soc: -45, eu: 20, ter: 5, w: { viv: 1.0, edu: 0.7, amb: 0.5, lib: 0.5, comp: 0.3 }, ec: { paro: -0.9 } },
  fun:  { nombre: 'Empleados públicos', icono: '🏛️', peso: 7, eco: -30, soc: 0, eu: 10, ter: -5, w: { sal: 0.5, edu: 0.5, prot: 0.4 }, ec: { deficit: -0.3 } },
  rur:  { nombre: 'Mundo rural y agrario', icono: '🚜', peso: 8, eco: 10, soc: 45, eu: -15, ter: -15, w: { rur: 1.0, ener: 0.4, seg: 0.3 }, ec: { infl: -0.5 } },
  mig:  { nombre: 'Inmigrantes y minorías', icono: '🌍', peso: 7, eco: -30, soc: -60, eu: 10, ter: 0, w: { lib: 0.8, igual: 0.6, viv: 0.4 }, ec: { paro: -0.6 } },
  trad: { nombre: 'Votantes tradicionales', icono: '⛪', peso: 12, eco: 15, soc: 70, eu: -10, ter: -35, w: { seg: 0.8, coh: 0.6 }, ec: { infl: -0.3 } },
  prog: { nombre: 'Progresistas urbanos', icono: '🌈', peso: 10, eco: -25, soc: -65, eu: 25, ter: 10, w: { amb: 0.8, lib: 0.9, igual: 0.5, edu: 0.4 }, ec: {} }
};

/* ── Impactos por ley ─────────────────────────────────────────────────────
   ind: puntos de indicador a pleno rendimiento · gr: puntos de satisfacción del grupo
   sec: efectos no deseados { p: probabilidad base, w: semanas hasta que aparece, t: titular, ind, gr, ec }
   enf: enfoques alternativos { id, n, d, pos:[eco,soc,eu,ter], pop, costo, ind, gr, ec }  (diferencias respecto al enfoque estándar)
   r: semanas hasta el pleno efecto · u: incertidumbre del informe (0,15 muy seguro … 0,5 muy incierto) */
ESP.DATA.impactos = {
  /* — Economía y fiscalidad — */
  recorte_irpf: { ind: { comp: 2, igual: -3, prot: -1 }, gr: { med: 5, aut: 4, emp: 3, obr: 1 }, r: 16, u: 0.25,
    sec: [{ p: 0.3, w: 26, t: 'Menos recursos para los servicios públicos', ind: { sal: -1.5, edu: -1 }, gr: { fun: -2 } }],
    enf: [{ id: 'progresiva', n: 'Sólo rentas bajas y medias', d: 'Más justa y más barata, pero llega a menos contribuyentes.', pos: [-25, 0, 0, 0], pop: 4, costo: -0.25, ind: { igual: 3, comp: -1 }, gr: { obr: 4, emp: -4, aut: -2 } },
          { id: 'general', n: 'Rebaja general y deducciones', d: 'Beneficia sobre todo a las rentas altas.', pos: [12, 0, 0, 0], pop: -5, costo: 0.25, ind: { igual: -2, comp: 1 }, gr: { emp: 4, obr: -2 } }] },
  impuesto_fortunas: { ind: { igual: 4, comp: -1.5 }, gr: { emp: -8, med: -1, obr: 2, prog: 2 }, r: 12, u: 0.4,
    sec: [{ p: 0.45, w: 20, t: 'Fuga de patrimonios y cambios de residencia fiscal', ind: { comp: -2 }, gr: { emp: -2 }, ec: { crec: -0.08 } }],
    enf: [{ id: 'umbral_alto', n: 'Umbral alto (más de 10 millones)', d: 'Menos fuga, pero recauda menos.', pos: [15, 0, 0, 0], pop: 6, costo: 0.3, ind: { igual: -1.5, comp: 1 }, gr: { emp: 4 } }] },
  impuestos_banca: { ind: { igual: 2, comp: -1.5 }, gr: { emp: -6, obr: 2, med: 1 }, r: 10, u: 0.35,
    sec: [{ p: 0.5, w: 16, t: 'La banca repercute el impuesto en comisiones', gr: { med: -2, aut: -1.5 } }] },
  iva_alimentos: { ind: { igual: 2, prot: 1 }, gr: { obr: 5, pen: 4, med: 2 }, r: 6, u: 0.2,
    sec: [{ p: 0.35, w: 14, t: 'Parte del ahorro no llega al consumidor', gr: { obr: -1.5, pen: -1 } }] },
  reforma_fiscal: { ind: { igual: 2, comp: -0.5, coh: 0.5, inst: 2.5 }, gr: { emp: -3, aut: -3, med: -1, obr: 2 }, r: 40, u: 0.35,
    sec: [{ p: 0.3, w: 30, t: 'Choque con las haciendas autonómicas', ind: { coh: -2 } }] },
  rebaja_sociedades: { ind: { comp: 3, igual: -1.5 }, gr: { emp: 7, aut: 5, obr: -1 }, r: 20, u: 0.35,
    enf: [{ id: 'pymes', n: 'Sólo pymes y autónomos', d: 'Ayuda al tejido empresarial pequeño; menos coste.', pos: [-20, 0, 0, 0], pop: 8, costo: -0.2, ind: { comp: -1, igual: 1 }, gr: { aut: 3, emp: -5 } }] },
  unidad_mercado: { ind: { comp: 3, coh: -3, inst: 1.5, rep: -1.5 }, gr: { emp: 5, aut: 4 }, r: 30, u: 0.4,
    sec: [{ p: 0.5, w: 20, t: 'Las comunidades recurren ante el Tribunal Constitucional', ind: { coh: -1.5 } }] },
  financiacion_reforma: { ind: { coh: 3, inst: 1.5 }, gr: {}, r: 40, u: 0.35, sec: [{ p: 0.3, w: 30, t: 'Las comunidades «perdedoras» se rebelan', ind: { coh: -2 } }] },
  /* — Empleo y pensiones — */
  subida_pensiones: { ind: { prot: 5, igual: 2 }, gr: { pen: 9, jov: -3, obr: 1 }, r: 8, u: 0.2,
    sec: [{ p: 0.5, w: 40, t: 'Presión creciente sobre las cuentas de la Seguridad Social', ind: { prot: -1 }, ec: { deficit: 0.15 } }],
    enf: [{ id: 'tope', n: 'IPC con tope del 3 %', d: 'Más sostenible, pero los pensionistas pueden perder poder adquisitivo.', pos: [25, 0, 0, 0], pop: -10, costo: -0.2, ind: { prot: -2 }, gr: { pen: -4 } }] },
  reforma_pensiones: { ind: { prot: -4, comp: 1.5, igual: -2 }, gr: { pen: -8, jov: 1, emp: 2 }, r: 30, u: 0.3,
    enf: [{ id: 'flexible', n: 'Jubilación flexible e incentivada', d: 'Retrasar voluntariamente la jubilación con premios.', pos: [-20, 0, 0, 0], pop: 12, costo: 0.3, ind: { prot: 2.5, igual: 1 }, gr: { pen: 5 } }] },
  salario_minimo: { ind: { igual: 4, prot: 1.5, comp: -1 }, gr: { obr: 8, aut: -4, emp: -2, med: 1 }, r: 12, u: 0.3,
    sec: [{ p: 0.4, w: 20, t: 'Despidos y economía sumergida en sectores frágiles', ind: { igual: -1 }, gr: { aut: -1, obr: -1.5 }, ec: { paro: 0.12 } }],
    enf: [{ id: 'bonificado', n: 'Con bonificaciones para pymes', d: 'El Estado compensa parte del coste a las empresas pequeñas.', pos: [8, 0, 0, 0], pop: 3, costo: 0.2, ind: { comp: 0.5 }, gr: { aut: 4, obr: -1 } }] },
  reforma_laboral: { ind: { comp: 3, igual: -4, prot: -2 }, gr: { emp: 6, aut: 4, obr: -9, fun: -1 }, r: 26, u: 0.35,
    sec: [{ p: 0.55, w: 26, t: 'Más rotación y temporalidad', ind: { igual: -1.5 }, gr: { jov: -3 } }],
    enf: [{ id: 'mochila', n: 'Mochila austriaca', d: 'Un fondo individual de indemnización que acompaña al trabajador.', pos: [-20, 0, 5, 0], pop: 8, costo: 0.1, ind: { comp: 0.5, igual: 1.5 }, gr: { obr: 4, jov: 2, emp: -2 } }] },
  derogar_reforma: { ind: { igual: 4, prot: 2, comp: -2 }, gr: { obr: 7, emp: -6, aut: -4 }, r: 20, u: 0.3,
    sec: [{ p: 0.4, w: 30, t: 'Rigidez en la contratación y menos empleo juvenil', gr: { aut: -2, jov: -2 }, ec: { paro: 0.12 } }] },
  semana_37h: { ind: { igual: 1.5, comp: -1.5, sal: 0.5 }, gr: { obr: 6, jov: 3, aut: -5, emp: -3 }, r: 30, u: 0.4,
    sec: [{ p: 0.5, w: 26, t: 'Mayor carga para pymes y sector servicios', gr: { aut: -2 }, ec: { crec: -0.05 } }] },
  escudo_social: { ind: { igual: 3, prot: 3, viv: 1 }, gr: { obr: 5, pen: 3, jov: 2, emp: -1 }, r: 6, u: 0.3,
    sec: [{ p: 0.35, w: 30, t: 'Cae la oferta de alquiler', ind: { viv: -1.5 }, gr: { jov: -1.5 } }] },
  ingreso_vital: { ind: { igual: 3.5, prot: 3 }, gr: { obr: 6, mig: 4, pen: 1, aut: -1 }, r: 20, u: 0.35,
    sec: [{ p: 0.45, w: 16, t: 'Trabas burocráticas: no llega a quien lo necesita', ind: { igual: -1.2, prot: -1.2 } }] },
  /* — Vivienda — */
  control_alquileres: { ind: { viv: 4, igual: 1.5 }, gr: { jov: 8, obr: 4, med: 2, emp: -3, aut: -2 }, r: 12, u: 0.45,
    sec: [{ p: 0.6, w: 26, t: 'Cae la oferta de alquiler y suben los precios de compra', ind: { viv: -3.5 }, gr: { jov: -3 } }],
    enf: [{ id: 'incentivos', n: 'Tope con incentivos fiscales', d: 'Bonificaciones a los propietarios que bajen el precio.', pos: [20, 0, 0, 0], pop: 4, costo: 0.2, ind: { viv: 1 }, gr: { emp: 2, aut: 2, jov: -1 } }] },
  plan_vivienda: { ind: { viv: 5, igual: 1, comp: 0.5 }, gr: { jov: 8, obr: 4, med: 3 }, r: 130, u: 0.4,
    sec: [{ p: 0.5, w: 60, t: 'Retrasos y sobrecostes en las obras', gr: { jov: -2 }, ec: { deficit: 0.08 } }] },
  ley_suelo: { ind: { viv: 3, amb: -3, comp: 1.5, coh: -0.5 }, gr: { emp: 4, aut: 3, prog: -5, jov: 2 }, r: 60, u: 0.4,
    sec: [{ p: 0.35, w: 40, t: 'Pelotazos urbanísticos y escándalos de recalificación', ind: { lib: -1 }, gr: { med: -2, prog: -3 } }] },
  turismo_pisos: { ind: { viv: 2.5, comp: -1 }, gr: { jov: 4, med: 2, aut: -3 }, r: 20, u: 0.4,
    sec: [{ p: 0.3, w: 26, t: 'Cae el empleo turístico local', gr: { obr: -1.5, aut: -1.5 } }] },
  /* — Migración, seguridad, justicia — */
  cuotas_migracion: { ind: { seg: 3, lib: -3, igual: -1, comp: -1 }, gr: { trad: 8, rur: 3, mig: -9, prog: -6, aut: -1 }, r: 20, u: 0.4,
    sec: [{ p: 0.5, w: 30, t: 'Escasez de mano de obra en el campo y la hostelería', gr: { rur: -2, aut: -2 }, ec: { crec: -0.08 } }] },
  regularizacion: { ind: { igual: 2, lib: 2, comp: 1.5, seg: -1 }, gr: { mig: 9, prog: 4, trad: -7, rur: -1 }, r: 16, u: 0.35,
    sec: [{ p: 0.4, w: 20, t: 'Se percibe un «efecto llamada»', ind: { seg: -1.5 }, gr: { trad: -3 } }] },
  menores_canarias: { ind: { coh: 1.5, igual: 0.5 }, gr: { mig: 2, trad: -3, prog: 1 }, r: 12, u: 0.3,
    sec: [{ p: 0.5, w: 16, t: 'Tensión con las comunidades receptoras', ind: { coh: -2 } }] },
  ley_mordaza: { ind: { lib: 4, seg: -1.5, rep: 1 }, gr: { prog: 6, jov: 3, trad: -4, mig: 2 }, r: 8, u: 0.25 },
  ley_okupas: { ind: { seg: 2.5, viv: 0.5, lib: -1.5, inst: 1 }, gr: { trad: 5, med: 3, rur: 2, prog: -4, jov: -2 }, r: 8, u: 0.3 },
  reforma_cgpj: { ind: { lib: 2.5, inst: 3, rep: 1 }, gr: { prog: 3, trad: -2 }, r: 30, u: 0.4, sec: [{ p: 0.4, w: 40, t: 'Bloqueo institucional prolongado', ind: { lib: -1.5 } }] },
  amnistia: { ind: { coh: 5, lib: -1, rep: 1, inst: -1 }, gr: { prog: 2, trad: -9, rur: -3, med: -2 }, r: 26, u: 0.45,
    sec: [{ p: 0.6, w: 30, t: 'Recursos judiciales y cuestiones prejudiciales ante Europa', ind: { lib: -1.5, coh: -1 } }] },
  indultos: { ind: { coh: 3 }, gr: { trad: -6, prog: 1, med: -1 }, r: 8, u: 0.3 },
  ley_prensa: { ind: { lib: 3.5, rep: 2, inst: 1 }, gr: { prog: 4, med: 2, trad: -1 }, r: 20, u: 0.3 },
  eutanasia: { ind: { lib: 3, sal: 1, prot: 0.5 }, gr: { prog: 5, pen: 2, trad: -6 }, r: 20, u: 0.25 },
  aborto_constitucion: { ind: { lib: 4 }, gr: { prog: 6, jov: 3, trad: -9 }, r: 8, u: 0.2 },
  /* — Territorio e independentismo — */
  financiacion_singular: { ind: { coh: 2, igual: -1 }, gr: { trad: -6, med: -1 }, r: 40, u: 0.5, sec: [{ p: 0.6, w: 24, t: 'Agravio comparativo en el resto de comunidades', ind: { coh: -3 } }] },
  transferencias: { ind: { coh: 3, rep: 1.5, inst: -1 }, gr: { trad: -2 }, r: 40, u: 0.3, sec: [{ p: 0.3, w: 40, t: 'Duplicidades y descoordinación entre administraciones', ind: { sal: -0.5, edu: -0.5 } }] },
  quita_deuda: { ind: { coh: 2, comp: -0.5 }, gr: { med: -1, trad: -3 }, r: 10, u: 0.3, sec: [{ p: 0.5, w: 20, t: 'Agravio en las comunidades cumplidoras', ind: { coh: -2 } }] },
  lenguas: { ind: { coh: 2.5, lib: 1, rep: 1.5 }, gr: { trad: -4, prog: 2 }, r: 26, u: 0.25 },
  estatuto_cat: { ind: { coh: 3 }, gr: { trad: -4 }, r: 40, u: 0.4 },
  estatuto_pva: { ind: { coh: 3 }, gr: { trad: -4 }, r: 40, u: 0.4 },
  estatuto_gal: { ind: { coh: 2.5 }, gr: { trad: -2 }, r: 40, u: 0.3 },
  estatuto_and: { ind: { coh: 2.5 }, gr: {}, r: 40, u: 0.3 },
  estatuto_val: { ind: { coh: 2.5 }, gr: {}, r: 40, u: 0.3 },
  estatuto_can: { ind: { coh: 2.5 }, gr: {}, r: 40, u: 0.3 },
  estatuto_bal: { ind: { coh: 2 }, gr: {}, r: 40, u: 0.3 },
  estatuto_gen: { ind: { coh: 3, rep: 1.5 }, gr: { trad: -2 }, r: 40, u: 0.35 },
  transferencia_comp: { ind: { coh: 2.5, rep: 1.5 }, gr: {}, r: 40, u: 0.3 },
  ley_recentralizar: { ind: { coh: -5, rep: -3, inst: 1 }, gr: { trad: 5, prog: -4 }, r: 26, u: 0.4, sec: [{ p: 0.5, w: 20, t: 'Conflicto institucional con las comunidades', ind: { coh: -2 } }] },
  reforma_electoral: { ind: { lib: 1.5, rep: 3 }, gr: { prog: 1 }, r: 10, u: 0.4 },
  senado_territorial: { ind: { coh: 3, rep: 3, inst: 1 }, gr: {}, r: 40, u: 0.3 },
  referendum_pactado: { ind: { coh: 2, lib: 1.5, rep: 3, inst: -1 }, gr: { trad: -10, prog: 2 }, r: 20, u: 0.5 },
  monarquia: { ind: { lib: 2.5, rep: 2 }, gr: { prog: 5, trad: -6, jov: 2 }, r: 10, u: 0.3 },
  techo_gasto: { ind: { comp: 1.5, prot: -1.5, sal: -0.5, edu: -0.5, inst: 1 }, gr: { emp: 3, fun: -3 }, r: 30, u: 0.35 },
  pge: { ind: { prot: 0.5 }, gr: {}, r: 12, u: 0.2 },
  /* — Energía, medio ambiente, agricultura — */
  cierre_nuclear: { ind: { amb: 3, ener: -3 }, gr: { prog: 4, emp: -3, rur: -2 }, r: 60, u: 0.4, sec: [{ p: 0.5, w: 40, t: 'Mayor dependencia del gas importado', ind: { ener: -2 }, ec: { infl: 0.08 } }] },
  nuevas_nucleares: { ind: { ener: 3, amb: -1.5 }, gr: { emp: 4, prog: -4 }, r: 40, u: 0.3 },
  ley_clima: { ind: { amb: 5, ener: 1, comp: -1 }, gr: { prog: 6, jov: 3, rur: -5, emp: -3 }, r: 80, u: 0.4, sec: [{ p: 0.35, w: 50, t: 'Deslocalización de industria intensiva en energía', ind: { comp: -2 }, gr: { obr: -2 } }] },
  renovables: { ind: { ener: 4, amb: 3, rur: 1, comp: 1 }, gr: { prog: 4, rur: 2, emp: 2 }, r: 60, u: 0.35, sec: [{ p: 0.45, w: 30, t: 'Rechazo vecinal a las macroplantas', ind: { rur: -1 }, gr: { rur: -2.5 } }] },
  plan_hidrologico: { ind: { rur: 3, amb: -3, coh: -2 }, gr: { rur: 7, prog: -5 }, r: 100, u: 0.45, sec: [{ p: 0.6, w: 40, t: 'Conflicto entre cuencas y comunidades', ind: { coh: -2 } }] },
  subsidio_agro: { ind: { rur: 3 }, gr: { rur: 9, prog: -1 }, r: 8, u: 0.2 },
  ley_costas: { ind: { comp: 1, amb: -3 }, gr: { emp: 3, prog: -4 }, r: 26, u: 0.3 },
  ley_mar: { ind: { amb: 3, rur: -1 }, gr: { prog: 4, rur: -3 }, r: 26, u: 0.3 },
  /* — Sanidad, educación, cultura — */
  sanidad_publica: { ind: { sal: 6, igual: 1.5, inst: 0.5 }, gr: { pen: 7, obr: 4, fun: 5, med: 3 }, r: 78, u: 0.35, sec: [{ p: 0.5, w: 50, t: 'Dificultad para cubrir las plazas (falta de profesionales)', ind: { sal: -1.5 } }] },
  copago_sanitario: { ind: { sal: -3, igual: -2, prot: -1 }, gr: { pen: -7, obr: -5, emp: 2 }, r: 12, u: 0.3 },
  ley_educativa: { ind: { edu: 3, inst: 1 }, gr: { fun: -2, prog: 1 }, r: 104, u: 0.45, sec: [{ p: 0.5, w: 30, t: 'Rechazo del profesorado y de varias comunidades', ind: { coh: -1.5 }, gr: { fun: -3 } }] },
  castellano_escuela: { ind: { coh: -5, rep: -1.5 }, gr: { trad: 4, prog: -1 }, r: 30, u: 0.35 },
  universidades: { ind: { edu: 3, igual: 2 }, gr: { jov: 8, obr: 3, med: 2 }, r: 26, u: 0.25 },
  ley_cine: { ind: { comp: 0.5 }, gr: { prog: 2 }, r: 20, u: 0.2 },
  /* — Exteriores, defensa, digital, UE — */
  gasto_defensa: { ind: { seg: 1.5, comp: 0.5, prot: -1.5, edu: -0.5 }, gr: { trad: 3, jov: -3, prog: -4, emp: 2 }, r: 60, u: 0.3 },
  reconocer_palestina: { ind: { lib: 0.5 }, gr: { prog: 5, jov: 3, trad: -3, emp: -2 }, r: 4, u: 0.3 },
  ley_ia: { ind: { comp: -1, lib: 2, inst: 2 }, gr: { prog: 3, emp: -3, aut: -1 }, r: 40, u: 0.4 },
  tasa_digital: { ind: { igual: 1, comp: -1.5 }, gr: { emp: -4, prog: 2, med: -1 }, r: 14, u: 0.35, sec: [{ p: 0.4, w: 24, t: 'Represalias comerciales de Estados Unidos', ec: { crec: -0.08 } }] },
  ley_telecos: { ind: { rur: 4, comp: 1.5, coh: 1, inst: 1 }, gr: { rur: 6, aut: 2 }, r: 70, u: 0.3 },
  transposicion_pacto: { ind: { seg: 1.5, lib: -1.5 }, gr: { trad: 3, mig: -4 }, r: 20, u: 0.3 },
  transposicion_energia: { ind: { ener: 2, amb: 2 }, gr: { prog: 2, aut: -2, emp: -1 }, r: 40, u: 0.3 }
};

/* Alcance común a todas las leyes: multiplica efectos, coste y radicalidad. */
ESP.DATA.alcances = [
  { id: 0, n: 'Limitado', d: 'Un primer paso prudente: menos efecto, menos coste y menos oposición.', mult: 0.6, cost: 0.65 },
  { id: 1, n: 'Estándar', d: 'El texto tal y como está pensado.', mult: 1, cost: 1 },
  { id: 2, n: 'Ambicioso', d: 'Va a fondo: más efecto y más coste, pero más polarizador y con más riesgo de efectos no deseados.', mult: 1.5, cost: 1.45 }
];
ESP.DATA.financiaciones = [
  { id: 'deficit', n: 'Con deuda', d: 'Se paga con déficit: sin pérdidas inmediatas, pero la deuda crece.' },
  { id: 'impuestos', n: 'Con impuestos', d: 'Una subida compensa el coste: no pesa en el déficit, pero resta crecimiento y enfada a clase media y empresas.' },
  { id: 'recorte', n: 'Con recortes', d: 'Se compensa recortando otros servicios: daña la protección social y a los empleados públicos.' }
];

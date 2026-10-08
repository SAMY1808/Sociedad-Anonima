/* Programa electoral del modo Partido: 12 áreas con tres opciones cada una.
   v = desplazamiento ideológico del partido (eco: izquierda− / derecha+, soc: progresista− / conservador+, eu: euroescéptico− / europeísta+, ter: centralista− / descentralizador+)
   w = a qué colectivos «habla» la medida (claves: igual prot viv sal edu comp seg ener lib amb rur coh; valores −1…1). */
window.ESP = window.ESP || {};
(function (C) {
  const O = (k, t, d, v, w) => ({ k, t, d, v, w });
  C.DATA = C.DATA || {};
  C.DATA.programa = [
    { id: 'fisc', ic: '💶', n: 'Fiscalidad', ops: [
      O('bajar', 'Bajar impuestos a familias y empresas', 'Menos carga fiscal, más competitividad.', { eco: 10, soc: 2, eu: 0, ter: 0 }, { comp: 0.9, igual: -0.4, prot: -0.3 }),
      O('progresiva', 'Reforma fiscal progresiva', 'Quien más tiene más aporta.', { eco: -9, soc: -3, eu: 0, ter: 0 }, { igual: 0.9, prot: 0.4, comp: -0.4 }),
      O('estable', 'Estabilidad fiscal y déficit cero', 'Disciplina presupuestaria.', { eco: 5, soc: 3, eu: 5, ter: -2 }, { comp: 0.4, seg: 0.2, prot: -0.2 })] },
    { id: 'pens', ic: '👵', n: 'Pensiones', ops: [
      O('blindar', 'Blindar las pensiones con el IPC', 'Garantía constitucional de revalorización.', { eco: -7, soc: 4, eu: 0, ter: 0 }, { prot: 1, igual: 0.3 }),
      O('sostenible', 'Reformar para la sostenibilidad', 'Ajustes y mayor edad efectiva.', { eco: 5, soc: 0, eu: 4, ter: 0 }, { prot: -0.4, comp: 0.3 }),
      O('mixto', 'Sistema mixto con planes privados', 'Complemento privado de ahorro.', { eco: 9, soc: 1, eu: 0, ter: 0 }, { comp: 0.6, prot: -0.5 })] },
    { id: 'viv', ic: '🏠', n: 'Vivienda', ops: [
      O('publico', 'Parque público de vivienda y tope al alquiler', 'Intervención del mercado.', { eco: -10, soc: -4, eu: 0, ter: 2 }, { viv: 1, igual: 0.4, comp: -0.5 }),
      O('suelo', 'Liberar suelo y agilizar licencias', 'Más oferta, menos burocracia.', { eco: 8, soc: 0, eu: 0, ter: 0 }, { viv: 0.6, comp: 0.6, igual: -0.2 }),
      O('ayudas', 'Ayudas directas a jóvenes y familias', 'Bono alquiler y avales.', { eco: -2, soc: -2, eu: 0, ter: 0 }, { viv: 0.7, igual: 0.3 })] },
    { id: 'sal', ic: '🏥', n: 'Sanidad', ops: [
      O('publica', 'Refuerzo de la sanidad pública', 'Más personal y menos listas de espera.', { eco: -7, soc: -2, eu: 0, ter: 0 }, { sal: 1, igual: 0.3, prot: 0.3 }),
      O('colabora', 'Colaboración público-privada', 'Concertar con la privada.', { eco: 7, soc: 1, eu: 0, ter: 0 }, { sal: 0.2, comp: 0.4 }),
      O('prevencion', 'Prevención y salud digital', 'Eficiencia y atención primaria.', { eco: 0, soc: -1, eu: 3, ter: 0 }, { sal: 0.6 })] },
    { id: 'edu', ic: '🎓', n: 'Educación', ops: [
      O('publica', 'Escuela pública y becas', 'Gratuidad y refuerzo.', { eco: -6, soc: -4, eu: 0, ter: 0 }, { edu: 1, igual: 0.4 }),
      O('libertad', 'Libertad de elección de centro', 'Concertada y cheque escolar.', { eco: 6, soc: 6, eu: 0, ter: 0 }, { edu: 0.3, lib: 0.2 }),
      O('fp', 'Gran pacto por la FP y la universidad', 'Empleabilidad y excelencia.', { eco: 0, soc: -1, eu: 4, ter: 0 }, { edu: 0.7, comp: 0.3 })] },
    { id: 'terr', ic: '🗺', n: 'Modelo territorial', ops: [
      O('federal', 'Reforma federal y más autogobierno', 'Estado de las autonomías reforzado.', { eco: 0, soc: -3, eu: 2, ter: 14 }, { coh: 0.2, rur: 0.2 }),
      O('central', 'Recentralizar competencias', 'Unidad de mercado y de servicios.', { eco: 2, soc: 6, eu: 0, ter: -14 }, { coh: 0.4 }),
      O('statu', 'Mantener el statu quo y dialogar', 'Evitar tensiones.', { eco: 0, soc: 0, eu: 0, ter: 0 }, { coh: 0.2 })] },
    { id: 'inm', ic: '🧭', n: 'Inmigración', ops: [
      O('regular', 'Regularización y vías legales', 'Integración y arraigo.', { eco: -2, soc: -12, eu: 3, ter: 0 }, { lib: 0.7, coh: 0.2, seg: -0.3 }),
      O('control', 'Control estricto de fronteras', 'Menos entradas y más devoluciones.', { eco: 1, soc: 14, eu: -4, ter: -2 }, { seg: 0.9, lib: -0.7 }),
      O('pacto', 'Pacto europeo de migración', 'Reparto y cooperación.', { eco: 0, soc: -2, eu: 8, ter: 0 }, { seg: 0.3, lib: 0.2 })] },
    { id: 'ener', ic: '🌍', n: 'Energía y clima', ops: [
      O('transicion', 'Transición ecológica acelerada', 'Renovables y descarbonización.', { eco: -4, soc: -8, eu: 5, ter: 0 }, { amb: 1, ener: 0.3, comp: -0.3 }),
      O('mix', 'Mix pragmático con nuclear', 'Precio estable y seguridad de suministro.', { eco: 3, soc: 4, eu: 0, ter: 0 }, { ener: 0.8, comp: 0.3, amb: -0.3 }),
      O('precio', 'Rebajar la factura a toda costa', 'Subsidios y topes de precio.', { eco: -3, soc: 0, eu: -2, ter: 0 }, { ener: 0.7, igual: 0.2 })] },
    { id: 'eu', ic: '🇪🇺', n: 'Europa', ops: [
      O('integra', 'Más integración europea', 'Fiscalidad y defensa comunes.', { eco: 0, soc: -2, eu: 14, ter: 0 }, { comp: 0.2, coh: 0.1 }),
      O('soberano', 'Soberanía nacional primero', 'Devolver competencias.', { eco: 2, soc: 8, eu: -14, ter: -3 }, { coh: 0.3, comp: -0.1 }),
      O('realista', 'Europeísmo exigente', 'Defender el interés nacional en Bruselas.', { eco: 0, soc: 1, eu: 4, ter: 0 }, { comp: 0.2 })] },
    { id: 'just', ic: '⚖️', n: 'Justicia y seguridad', ops: [
      O('garantias', 'Garantías y reinserción', 'Menos prisión, más prevención.', { eco: -2, soc: -8, eu: 0, ter: 0 }, { lib: 0.6, seg: -0.3 }),
      O('dura', 'Mano dura y penas más altas', 'Endurecer el Código Penal.', { eco: 1, soc: 11, eu: 0, ter: 0 }, { seg: 0.9, lib: -0.5 }),
      O('independencia', 'Despolitizar la Justicia', 'CGPJ y fiscalía independientes.', { eco: 0, soc: -1, eu: 3, ter: 0 }, { seg: 0.3, coh: 0.2 })] },
    { id: 'trab', ic: '👷', n: 'Trabajo y salarios', ops: [
      O('smi', 'Subir el SMI y reducir la jornada', 'Más salario y más tiempo.', { eco: -10, soc: -3, eu: 0, ter: 0 }, { igual: 0.8, prot: 0.3, comp: -0.6 }),
      O('flex', 'Flexibilizar el mercado laboral', 'Contratación más sencilla.', { eco: 9, soc: 3, eu: 0, ter: 0 }, { comp: 0.8, igual: -0.5 }),
      O('formacion', 'Pacto de rentas y formación', 'Diálogo social y recualificación.', { eco: -1, soc: -1, eu: 3, ter: 0 }, { igual: 0.3, comp: 0.3 })] },
    { id: 'val', ic: '🏳️', n: 'Derechos y valores', ops: [
      O('amplia', 'Ampliar derechos civiles', 'Igualdad, eutanasia, libertad.', { eco: -1, soc: -12, eu: 2, ter: 0 }, { lib: 0.9, igual: 0.2 }),
      O('tradicion', 'Defender la familia y la tradición', 'Valores tradicionales.', { eco: 1, soc: 12, eu: 0, ter: -1 }, { coh: 0.4, lib: -0.5 }),
      O('consenso', 'Consenso y neutralidad', 'No abrir debates.', { eco: 0, soc: 0, eu: 0, ter: 0 }, { coh: 0.1 })] },
    { id: 'rural', ic: '🌾', n: 'Mundo rural', ops: [
      O('plan', 'Plan de choque contra la despoblación', 'Servicios, banda ancha y fiscalidad.', { eco: -2, soc: 1, eu: 0, ter: 2 }, { rur: 1, coh: 0.3 }),
      O('pac', 'Defender la PAC y a los agricultores', 'Ayudas y precios justos.', { eco: 1, soc: 3, eu: 0, ter: 0 }, { rur: 0.8, amb: -0.2 }),
      O('verde', 'Rural sostenible y renovables', 'Energía y empleo verde.', { eco: -2, soc: -4, eu: 3, ter: 0 }, { rur: 0.4, amb: 0.5 })] }
  ];
})(window.ESP);

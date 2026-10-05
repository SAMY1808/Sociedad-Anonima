/* Plantillas de proyectos de ley y decretos de España.
   eco: − intervención ↔ + liberalización · soc: − progresista ↔ + conservador · eu: − soberanista ↔ + integración · ter: − centralista ↔ + descentralizador
   costo: impacto fiscal anual (% PIB, + gasto) · pop: apoyo ciudadano 0-100 · ef: efectos económicos a medio plazo
   may: simple | organica (176) | cons (3/5)  ·  rdl: puede aprobarse por decreto-ley  ·  rdlSolo: sólo existe como decreto-ley
   region: ley que beneficia a un territorio (id de CCAA)  ·  efecto: efecto especial (ver territorio.js / consejo.js) */
window.ESP = window.ESP || {};
ESP.DATA = ESP.DATA || {};
ESP.DATA.leyes = [
  /* — Economía y fiscalidad — */
  { id: 'recorte_irpf', t: 'Rebaja del IRPF', s: 'eco', eco: 70, soc: 20, eu: 0, ter: -5, costo: 0.8, pop: 62, rdl: true, ef: { crec: 0.2, deficit: 0.7 }, d: 'Reduce los tramos intermedios del impuesto sobre la renta.' },
  { id: 'impuesto_fortunas', t: 'Impuesto a las grandes fortunas', s: 'eco', eco: -75, soc: -20, eu: 0, ter: 10, costo: -0.5, pop: 58, rdl: true, ef: { deficit: -0.4, crec: -0.1 }, d: 'Gravamen sobre patrimonios superiores a tres millones de euros.' },
  { id: 'impuestos_banca', t: 'Impuesto extraordinario a banca y energéticas', s: 'eco', eco: -70, soc: -15, eu: -5, ter: 0, costo: -0.4, pop: 64, rdl: true, ef: { deficit: -0.4 }, d: 'Gravamen temporal sobre los beneficios extraordinarios de bancos y eléctricas.' },
  { id: 'iva_alimentos', t: 'IVA cero en alimentos básicos', s: 'eco', eco: -35, soc: 0, eu: 0, ter: 0, costo: 0.35, pop: 74, rdl: true, ef: { infl: -0.3, deficit: 0.35 }, d: 'Suprime el IVA de los productos de la cesta básica.' },
  { id: 'reforma_fiscal', t: 'Reforma fiscal y lucha contra el fraude', s: 'eco', eco: -25, soc: -5, eu: 15, ter: -5, costo: -0.6, pop: 55, ef: { deficit: -0.6 }, d: 'Refuerza la Agencia Tributaria y armoniza impuestos autonómicos.' },
  { id: 'rebaja_sociedades', t: 'Rebaja del impuesto de sociedades', s: 'eco', eco: 75, soc: 15, eu: 0, ter: -5, costo: 0.4, pop: 40, ef: { crec: 0.25, deficit: 0.4 }, d: 'Baja el tipo general para empresas y autónomos.' },
  { id: 'unidad_mercado', t: 'Ley de Unidad de Mercado', s: 'eco', eco: 55, soc: 10, eu: 15, ter: -60, costo: 0, pop: 42, ef: { crec: 0.2 }, d: 'Evita la fragmentación normativa autonómica en el mercado interior.' },
  { id: 'financiacion_reforma', t: 'Nuevo modelo de financiación autonómica', s: 'ter', eco: -5, soc: 0, eu: 0, ter: 20, costo: 0.3, pop: 45, may: 'organica', efecto: 'financiacion', ef: { deficit: 0.3 }, d: 'Reforma la LOFCA y el reparto de recursos entre comunidades.' },
  /* — Empleo y pensiones — */
  { id: 'subida_pensiones', t: 'Revalorización de pensiones con el IPC', s: 'soc', eco: -55, soc: 5, eu: -5, ter: 0, costo: 0.5, pop: 78, rdl: true, ef: { deficit: 0.5, aprob: 3 }, d: 'Garantiza por ley que las pensiones suban al menos lo que el IPC.' },
  { id: 'reforma_pensiones', t: 'Reforma de las pensiones', s: 'soc', eco: 40, soc: 15, eu: 25, ter: -10, costo: -0.6, pop: 28, ef: { deficit: -0.6, aprob: -4 }, d: 'Retrasa la edad de jubilación y liga la cuantía a la esperanza de vida.' },
  { id: 'salario_minimo', t: 'Subida del salario mínimo', s: 'soc', eco: -55, soc: -10, eu: 15, ter: 0, costo: 0.1, pop: 70, rdl: true, ef: { paro: 0.2, aprob: 2, infl: 0.2 }, d: 'Aumenta el SMI un 12 %.' },
  { id: 'reforma_laboral', t: 'Flexibilización del mercado laboral', s: 'soc', eco: 65, soc: 10, eu: 10, ter: -5, costo: 0, pop: 33, ef: { paro: -0.5, crec: 0.2, aprob: -3 }, d: 'Facilita la contratación y abarata el despido.' },
  { id: 'derogar_reforma', t: 'Derogación de la reforma laboral', s: 'soc', eco: -75, soc: -20, eu: -5, ter: 0, costo: 0.1, pop: 50, ef: { paro: 0.4, aprob: 1 }, d: 'Recupera la ultraactividad y la prevalencia de los convenios sectoriales.' },
  { id: 'semana_37h', t: 'Reducción de la jornada a 37,5 horas', s: 'soc', eco: -60, soc: -35, eu: 0, ter: 0, costo: 0.2, pop: 64, ef: { paro: -0.3, crec: -0.2 }, d: 'Reduce la jornada máxima sin merma salarial.' },
  { id: 'escudo_social', t: 'Escudo social: prórroga y ampliación', s: 'soc', eco: -60, soc: -30, eu: 0, ter: 0, costo: 0.35, pop: 69, rdl: true, efecto: 'escudo_social', ef: { deficit: 0.35, aprob: 2 }, d: 'Prohíbe desahucios a familias vulnerables y limita las subidas de suministros.' },
  { id: 'ingreso_vital', t: 'Ampliación del Ingreso Mínimo Vital', s: 'soc', eco: -55, soc: -20, eu: 5, ter: -5, costo: 0.4, pop: 60, ef: { deficit: 0.4 }, d: 'Aumenta la cuantía y simplifica el acceso a la prestación.' },
  /* — Vivienda — */
  { id: 'control_alquileres', t: 'Tope a los alquileres', s: 'ter', eco: -70, soc: -25, eu: 0, ter: -15, costo: 0.1, pop: 66, rdl: true, ef: { crec: -0.1 }, d: 'Limita las subidas del alquiler en zonas tensionadas.' },
  { id: 'plan_vivienda', t: 'Plan estatal de vivienda pública', s: 'ter', eco: -50, soc: -15, eu: 10, ter: -10, costo: 0.5, pop: 73, ef: { crec: 0.2, deficit: 0.5 }, d: 'Construcción de 200.000 viviendas asequibles en una década.' },
  { id: 'ley_suelo', t: 'Ley del Suelo: más edificabilidad', s: 'ter', eco: 65, soc: 10, eu: 5, ter: 5, costo: 0, pop: 48, ef: { crec: 0.3 }, d: 'Libera suelo y agiliza licencias para aumentar la oferta de vivienda.' },
  { id: 'turismo_pisos', t: 'Regulación de pisos turísticos', s: 'ter', eco: -30, soc: -10, eu: 0, ter: 20, costo: 0, pop: 62, ef: { crec: -0.05 }, d: 'Da a municipios y comunidades herramientas para limitar los pisos turísticos.' },
  /* — Migración, seguridad, justicia — */
  { id: 'cuotas_migracion', t: 'Límites y cuotas de inmigración', s: 'seg', eco: 10, soc: 70, eu: -30, ter: -40, costo: 0.1, pop: 54, ef: { crec: -0.1 }, d: 'Fija cupos de entrada y endurece la reagrupación familiar.' },
  { id: 'regularizacion', t: 'Regularización extraordinaria de migrantes', s: 'seg', eco: -10, soc: -70, eu: 15, ter: 0, costo: 0, pop: 41, ef: { crec: 0.2 }, d: 'Regulariza a quienes llevan dos años trabajando sin papeles.' },
  { id: 'menores_canarias', t: 'Reparto obligatorio de menores migrantes', s: 'seg', eco: -10, soc: -30, eu: 10, ter: -20, costo: 0.1, pop: 52, rdl: true, ef: {}, d: 'Distribuye a los menores no acompañados entre todas las comunidades.' },
  { id: 'ley_mordaza', t: 'Reforma de la ley de seguridad ciudadana', s: 'seg', eco: 0, soc: -50, eu: 5, ter: 0, costo: 0, pop: 48, ef: {}, d: 'Suaviza las sanciones por manifestaciones y los registros sin orden.' },
  { id: 'ley_okupas', t: 'Desalojo exprés de viviendas ocupadas', s: 'seg', eco: 35, soc: 55, eu: 0, ter: -10, costo: 0, pop: 68, ef: {}, d: 'Permite desalojar en 48 horas las viviendas ocupadas ilegalmente.' },
  { id: 'reforma_cgpj', t: 'Reforma del Consejo General del Poder Judicial', s: 'seg', eco: 0, soc: -15, eu: 20, ter: 0, costo: 0, pop: 40, may: 'organica', ef: {}, d: 'Cambia el sistema de elección de los vocales del CGPJ.' },
  { id: 'amnistia', t: 'Ley de amnistía del procés', s: 'ins', eco: 0, soc: -30, eu: 10, ter: 80, costo: 0, pop: 28, may: 'organica', efecto: 'amnistia', ef: {}, d: 'Extingue la responsabilidad penal y administrativa de los encausados por el procés.' },
  { id: 'indultos', t: 'Indulto a los condenados por el procés', s: 'ins', eco: 0, soc: -20, eu: 10, ter: 55, costo: 0, pop: 30, rdlSolo: true, efecto: 'indultos', ef: {}, d: 'Concede el indulto parcial a los condenados por sedición y malversación.' },
  { id: 'ley_prensa', t: 'Ley de transparencia y secretos oficiales', s: 'ins', eco: 0, soc: -10, eu: 10, ter: 0, costo: 0, pop: 50, ef: {}, d: 'Regula los secretos oficiales y refuerza el acceso a la información pública.' },
  { id: 'eutanasia', t: 'Ampliación de la eutanasia y cuidados paliativos', s: 'ins', eco: 0, soc: -60, eu: 0, ter: 0, costo: 0.05, pop: 60, ef: {}, d: 'Amplía las garantías y la red de cuidados paliativos.' },
  { id: 'aborto_constitucion', t: 'Blindaje del aborto en la Constitución', s: 'ins', eco: 0, soc: -80, eu: 5, ter: 0, costo: 0, pop: 52, may: 'cons', ef: {}, d: 'Reforma el artículo 43 para garantizar la interrupción voluntaria del embarazo.' },
  /* — Territorio e independentismo — */
  { id: 'financiacion_singular', t: 'Financiación singular para Cataluña', s: 'ter', eco: -5, soc: 0, eu: 0, ter: 85, costo: 0.35, pop: 25, may: 'organica', region: 'CAT', efecto: 'financiacion_singular', ef: { deficit: 0.3 }, d: 'Concierto solidario: Cataluña recauda y gestiona sus impuestos y aporta a la solidaridad.' },
  { id: 'transferencias', t: 'Traspaso de competencias (Rodalies, tráfico, costas)', s: 'ter', eco: 0, soc: 0, eu: 0, ter: 75, costo: 0.05, pop: 40, may: 'organica', efecto: 'transferencias', ef: {}, d: 'Transfiere a las comunidades la gestión de competencias pendientes.' },
  { id: 'quita_deuda', t: 'Quita de la deuda autonómica con el Estado', s: 'ter', eco: -30, soc: 0, eu: -10, ter: 45, costo: 0.45, pop: 28, efecto: 'quita_deuda', ef: { deficit: 0.4 }, d: 'Condona parte de la deuda de las comunidades con el Fondo de Liquidez.' },
  { id: 'lenguas', t: 'Oficialidad de las lenguas cooficiales en las Cortes y la UE', s: 'ins', eco: 0, soc: -25, eu: 10, ter: 65, costo: 0.02, pop: 35, ef: {}, d: 'Impulsa el uso del catalán, euskera y gallego en el Congreso y las instituciones europeas.' },
  { id: 'estatuto_cat', t: 'Reforma del Estatuto de Autonomía de Cataluña', s: 'ter', eco: 0, soc: -10, eu: 5, ter: 85, costo: 0.05, pop: 30, may: 'organica', region: 'CAT', efecto: 'estatuto', ef: {}, d: 'Amplía competencias, reconoce la nación catalana y blinda la financiación.' },
  { id: 'estatuto_pva', t: 'Nuevo estatuto político del País Vasco', s: 'ter', eco: 5, soc: 0, eu: 10, ter: 85, costo: 0.03, pop: 30, may: 'organica', region: 'PVA', efecto: 'estatuto', ef: {}, d: 'Reconoce a Euskadi como nación y amplía el autogobierno.' },
  { id: 'estatuto_gal', t: 'Reforma del Estatuto de Galicia', s: 'ter', eco: 0, soc: -5, eu: 5, ter: 60, costo: 0.03, pop: 35, may: 'organica', region: 'GAL', efecto: 'estatuto', ef: {}, d: 'Actualiza las competencias y la financiación gallegas.' },
  { id: 'estatuto_and', t: 'Reforma del Estatuto de Andalucía', s: 'ter', eco: 0, soc: 0, eu: 5, ter: 40, costo: 0.03, pop: 38, may: 'organica', region: 'AND', efecto: 'estatuto', ef: {}, d: 'Actualiza el autogobierno andaluz y su financiación.' },
  { id: 'estatuto_val', t: 'Reforma del Estatuto de la Comunidad Valenciana', s: 'ter', eco: 0, soc: 0, eu: 5, ter: 45, costo: 0.03, pop: 36, may: 'organica', region: 'VAL', efecto: 'estatuto', ef: {}, d: 'Aborda la infrafinanciación y las competencias valencianas.' },
  { id: 'estatuto_can', t: 'Reforma del Estatuto de Canarias', s: 'ter', eco: 0, soc: 0, eu: 10, ter: 45, costo: 0.04, pop: 36, may: 'organica', region: 'CAN', efecto: 'estatuto', ef: {}, d: 'Refuerza el hecho insular, el régimen económico y la lejanía.' },
  { id: 'estatuto_bal', t: 'Reforma del Estatuto de Baleares', s: 'ter', eco: 0, soc: 0, eu: 5, ter: 35, costo: 0.02, pop: 34, may: 'organica', region: 'BAL', efecto: 'estatuto', ef: {}, d: 'Insularidad y financiación para las Islas Baleares.' },
  { id: 'ley_recentralizar', t: 'Recentralización de competencias educativas y sanitarias', s: 'ter', eco: 5, soc: 30, eu: -10, ter: -85, costo: 0.05, pop: 40, may: 'organica', efecto: 'recentralizar', ef: {}, d: 'El Estado recupera la coordinación y el control de la educación y la sanidad.' },
  { id: 'reforma_electoral', t: 'Reforma de la ley electoral (LOREG)', s: 'ins', eco: 0, soc: -10, eu: 5, ter: -5, costo: 0, pop: 40, may: 'organica', efecto: 'reforma_electoral', ef: {}, d: 'Modifica el sistema de reparto de escaños y el umbral electoral.' },
  { id: 'senado_territorial', t: 'Reforma constitucional del Senado', s: 'ins', eco: 0, soc: 0, eu: 5, ter: 55, costo: 0, pop: 38, may: 'cons', ef: {}, d: 'Convierte el Senado en una auténtica cámara de representación territorial.' },
  { id: 'referendum_pactado', t: 'Reforma constitucional: referéndum de autodeterminación', s: 'ter', eco: 0, soc: -20, eu: 10, ter: 100, costo: 0, pop: 18, may: 'cons', efecto: 'referendum', ef: {}, d: 'Reconoce el derecho de una comunidad a convocar un referéndum pactado sobre su futuro.' },
  { id: 'monarquia', t: 'Reforma constitucional: fin de la inviolabilidad del Rey', s: 'ins', eco: 0, soc: -50, eu: 5, ter: 10, costo: 0, pop: 42, may: 'cons', ef: {}, d: 'Limita la inviolabilidad del Jefe del Estado y regula su patrimonio.' },
  { id: 'techo_gasto', t: 'Reforma del artículo 135 (techo de deuda)', s: 'eco', eco: 50, soc: 0, eu: 30, ter: -20, costo: -0.2, pop: 38, may: 'cons', ef: { deficit: -0.3 }, d: 'Eleva el techo de déficit estructural y de deuda permitido a las administraciones.' },
  /* — Energía, medio ambiente, agricultura — */
  { id: 'cierre_nuclear', t: 'Calendario de cierre de las nucleares', s: 'amb', eco: -25, soc: -50, eu: 5, ter: 0, costo: 0.2, pop: 45, ef: { infl: 0.2 }, d: 'Fija el cierre de las centrales nucleares hacia 2035.' },
  { id: 'nuevas_nucleares', t: 'Prórroga de la vida útil de las nucleares', s: 'amb', eco: 35, soc: 20, eu: 5, ter: 0, costo: 0.1, pop: 52, ef: { infl: -0.2, crec: 0.1 }, d: 'Autoriza alargar el funcionamiento de las centrales hasta 2045.' },
  { id: 'ley_clima', t: 'Ley de neutralidad climática 2045', s: 'amb', eco: -35, soc: -60, eu: 30, ter: 0, costo: 0.4, pop: 56, ef: { crec: -0.1, infl: 0.1 }, d: 'Objetivos vinculantes de reducción de emisiones.' },
  { id: 'renovables', t: 'Aceleración de renovables y redes', s: 'amb', eco: -10, soc: -30, eu: 20, ter: 5, costo: 0.4, pop: 64, ef: { crec: 0.2, infl: -0.2 }, d: 'Simplifica permisos y subvenciona almacenamiento e interconexiones.' },
  { id: 'plan_hidrologico', t: 'Plan Hidrológico Nacional y trasvases', s: 'agr', eco: 20, soc: 20, eu: -5, ter: -50, costo: 0.3, pop: 45, ef: { crec: 0.1 }, d: 'Interconecta cuencas hidrográficas y garantiza el suministro.' },
  { id: 'subsidio_agro', t: 'Ayudas extraordinarias al campo', s: 'agr', eco: -20, soc: 30, eu: -15, ter: 0, costo: 0.2, pop: 62, rdl: true, ef: { deficit: 0.2 }, d: 'Compensa la subida de costes de combustible y fertilizantes.' },
  { id: 'ley_costas', t: 'Reforma de la Ley de Costas', s: 'amb', eco: 25, soc: 10, eu: 0, ter: 10, costo: 0, pop: 40, ef: {}, d: 'Flexibiliza las concesiones en el litoral.' },
  { id: 'ley_mar', t: 'Ley de protección de espacios marinos', s: 'amb', eco: -15, soc: -35, eu: 10, ter: 0, costo: 0.05, pop: 55, ef: {}, d: 'Protege el 30 % de las aguas y regula la pesca de arrastre.' },
  /* — Sanidad, educación, cultura — */
  { id: 'sanidad_publica', t: 'Refuerzo de la sanidad pública', s: 'sal', eco: -55, soc: -10, eu: 5, ter: -5, costo: 0.6, pop: 80, ef: { deficit: 0.6, aprob: 2 }, d: 'Más plantillas, menos listas de espera y atención primaria reforzada.' },
  { id: 'copago_sanitario', t: 'Copago sanitario y deducciones por seguros privados', s: 'sal', eco: 60, soc: 15, eu: 0, ter: 5, costo: -0.3, pop: 25, ef: { deficit: -0.3, aprob: -3 }, d: 'Introduce un copago por consulta.' },
  { id: 'ley_educativa', t: 'Nueva ley educativa', s: 'edu', eco: -20, soc: -30, eu: 5, ter: -20, costo: 0.2, pop: 48, may: 'organica', ef: {}, d: 'Cambia el currículo y la evaluación en todas las etapas.' },
  { id: 'castellano_escuela', t: 'Castellano como lengua vehicular garantizada', s: 'edu', eco: 5, soc: 30, eu: 0, ter: -75, costo: 0, pop: 52, may: 'organica', efecto: 'recentralizar', ef: {}, d: 'Obliga a un mínimo de horas lectivas en castellano en toda España.' },
  { id: 'universidades', t: 'Becas universitarias y matrícula gratuita', s: 'edu', eco: -40, soc: -15, eu: 5, ter: 0, costo: 0.2, pop: 66, ef: { deficit: 0.2 }, d: 'Gratuidad de la primera matrícula y ampliación de becas.' },
  { id: 'ley_cine', t: 'Estatuto del artista y ley de mecenazgo', s: 'edu', eco: -10, soc: -20, eu: 5, ter: 0, costo: 0.03, pop: 52, ef: {}, d: 'Mejora la fiscalidad y las cotizaciones de los profesionales de la cultura.' },
  /* — Exteriores, defensa, digital, UE — */
  { id: 'gasto_defensa', t: 'Gasto en defensa del 2,5 % del PIB', s: 'ext', eco: 20, soc: 35, eu: 20, ter: -20, costo: 0.8, pop: 45, ef: { deficit: 0.8, crec: 0.1 }, d: 'Plan plurianual para elevar el gasto militar.' },
  { id: 'reconocer_palestina', t: 'Nueva política exterior en Oriente Próximo', s: 'ext', eco: -10, soc: -30, eu: -5, ter: 0, costo: 0, pop: 55, ef: {}, d: 'Cambia la posición exterior de España en Oriente Próximo.' },
  { id: 'ley_ia', t: 'Ley de inteligencia artificial y plataformas', s: 'dig', eco: -15, soc: -10, eu: 25, ter: 0, costo: 0.05, pop: 55, ef: {}, d: 'Aplica el reglamento europeo de IA y crea la agencia de supervisión.' },
  { id: 'tasa_digital', t: 'Tasa a los grandes servicios digitales', s: 'dig', eco: -45, soc: -10, eu: -10, ter: 0, costo: -0.2, pop: 60, ef: { deficit: -0.2 }, d: 'Un 3 % sobre los ingresos de las grandes plataformas.' },
  { id: 'ley_telecos', t: 'Plan de conectividad en la España vaciada', s: 'dig', eco: -10, soc: 0, eu: 15, ter: -5, costo: 0.2, pop: 63, ef: { crec: 0.1 }, d: 'Fibra y 5G en municipios pequeños con fondos europeos.' },
  { id: 'transposicion_pacto', t: 'Transposición del Pacto de Migración y Asilo', s: 'seg', eco: 0, soc: 25, eu: 40, ter: -20, costo: 0.05, pop: 44, ef: {}, d: 'Adapta la normativa española al Pacto europeo de migración.', ue: true },
  { id: 'transposicion_energia', t: 'Transposición de la directiva de eficiencia energética', s: 'amb', eco: -10, soc: -20, eu: 40, ter: 0, costo: 0.1, pop: 54, ef: {}, d: 'Aplica la directiva europea en edificios y empresas.', ue: true }
];

ESP.DATA.leyes.push({ id: 'estatuto_gen', t: 'Reforma del Estatuto de Autonomía', s: 'ter', eco: 0, soc: 0, eu: 5, ter: 50, costo: 0.03, pop: 36, may: 'organica', efecto: 'estatuto', manual: true, ef: {}, d: 'Reforma estatutaria aprobada por el Parlamento autonómico y remitida a las Cortes.' });

ESP.DATA.leyes.push({ id: 'pge', t: 'Presupuestos Generales del Estado', s: 'eco', eco: 0, soc: 0, eu: 10, ter: 0, costo: 0.2, pop: 50, may: 'simple', manual: true, ef: {}, d: 'Cuentas públicas del año: ingresos, gasto y financiación autonómica.' });

ESP.DATA.leyes.push({ id: 'transferencia_comp', t: 'Ley orgánica de transferencia de competencias', s: 'ter', eco: 0, soc: 0, eu: 0, ter: 60, costo: 0.05, pop: 38, may: 'organica', manual: true, efecto: 'transfer_comp', ef: {}, d: 'Transfiere o delega a una comunidad una competencia exclusiva del Estado (art. 150.2 de la Constitución).' });

/* Decretos y acuerdos del Consejo de Ministros que no pasan por las Cortes. */
ESP.DATA.decretos = [
  { id: 'rd_fondos_europeos', t: 'Distribución de fondos europeos', sector: 'eco', ter: 15, eco: -10, soc: -5, pop: 62, texto: 'Reparto de una nueva tranche de fondos Next Generation entre comunidades.' },
  { id: 'rd_conferencia', t: 'Convocatoria de la Conferencia de Presidentes', sector: 'ter', ter: 25, eco: 0, soc: 0, pop: 48, texto: 'Reunión del presidente del Gobierno con los presidentes autonómicos.' },
  { id: 'rd_seguridad_nacional', t: 'Plan de seguridad nacional', sector: 'seg', ter: -25, eco: 5, soc: 30, pop: 50, texto: 'Refuerzo de ciberseguridad e infraestructuras críticas.' },
  { id: 'rd_nombramientos', t: 'Nombramientos de altos cargos', sector: 'ins', ter: 0, eco: 0, soc: 0, pop: 50, texto: 'Cambios en la cúpula de empresas públicas y organismos reguladores.' }
];

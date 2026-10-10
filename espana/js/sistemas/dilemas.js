/* Dilemas con reloj, capital político, asesores enfrentados y hemeroteca.
   Decisiones difíciles que caducan en pocas semanas, cuestan capital político y dejan una marca que vuelve más tarde.
   Estado: E.esp.dil = { act[], hist[], memoria[], capital, asesor:{jefe,portavoz,estratega}, ult }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const sg = (E, k) => E.partidos[k].sigla;
  const pa = E => E.partidos[E.jugador.partido];
  const rival = E => { const s = C.Nemesis && C.Nemesis.elegir(E); return s && s.pid ? s.pid : C.Mayorias.oposicion(E)[0]; };
  const lz = (E, x, d) => { if (x && x.pol && E.politicos[x.pol]) C.Intriga.sumarLazo(E, x.pol, d); };
  const rel = (E, k, d) => { if (C.Mayorias && k) C.Mayorias.cambiarRel(E, k, d); };
  /* Catálogo: texto, opciones {k,t,d,cap,ef→msg,mem?}, consejo por asesor, plazo (semanas) y defecto (índice). */
  const CAT = {
    filtracion: { ic: '📰', n: 'Una filtración que cae en tus manos', req: E => true, plazo: 3, defecto: 1,
      txt: E => `Un colaborador te entrega, a escondidas, documentos que dejan en muy mal lugar a ${sg(E, rival(E))}. Publicarlos ahora podría cambiar el pulso político.`,
      op: [
        { k: 'publicar', t: 'Publicarlos a través de un medio afín', d: 'Daña al rival, con riesgo de que se descubra el origen.', ef: (E, J) => { const r = rival(E); if (U.chance(0.6)) { C.Opinion.empujeES(E, r, -0.06); rel(E, r, -8); return `La filtración golpea a ${sg(E, r)}.`; } C.Personaje.cambiar(E, { prestigio: -2.5 }, true); return 'Se descubre el origen: escándalo en tu entorno.'; }, mem: { tipo: 'filtracion', txt: 'filtraste documentos contra un rival' } },
        { k: 'guardar', t: 'Guardarlos para un momento mejor', d: 'Sin riesgo ahora, pero otros pueden acabar sabiéndolo.', ef: (E, J) => { return 'Los guardas bajo llave: sin ruido por ahora.'; }, mem: { tipo: 'filtracion', txt: 'guardaste documentos comprometedores' } },
        { k: 'destruir', t: 'Destruirlos y avisar al rival', d: 'Un gesto limpio que le obliga a deberte una.', cap: 8, ef: (E, J) => { const r = rival(E); rel(E, r, 10); C.Personaje.cambiar(E, { prestigio: 1.5 }); return `${sg(E, r)} te debe un favor.`; }, mem: { tipo: 'favor', txt: 'le perdonaste una filtración a tu rival', pid: 'r' } }],
      as: { jefe: 'guardar', portavoz: 'publicar', estratega: 'destruir' } },
    socio: { ic: '🤝', n: 'Un socio aprieta', req: E => E.paises.ES.gob.pm === 'J' && (E.paises.ES.gob.apoyoExterno || []).length > 0, plazo: 3, defecto: 1,
      txt: E => { const g = E.paises.ES.gob, k = (g.apoyoExterno || [])[0]; return `${sg(E, k)} advierte de que dejará de apoyarte si no cedes en un asunto que considera «innegociable».`; },
      op: [
        { k: 'ceder', t: 'Ceder y cerrar el acuerdo', d: 'Aseguras el apoyo, a costa de imagen.', ef: (E, J) => { const g = E.paises.ES.gob; g.estab = clamp(g.estab + 4, 0, 100); g.aprob = clamp(g.aprob - 1.2, 5, 90); return 'Cedes: tu mayoría respira.'; }, mem: { tipo: 'cesion', txt: 'cediste ante un socio' } },
        { k: 'plantar', t: 'Plantarte: «no hay trato»', d: 'Muestras firmeza, pero te arriesgas a perder la mayoría.', cap: 15, ef: (E, J) => { const g = E.paises.ES.gob; if (U.chance(0.5)) { g.estab = clamp(g.estab + 1, 0, 100); C.Personaje.cambiar(E, { prestigio: 1.5 }); return 'El socio traga: ganas autoridad.'; } g.estab = clamp(g.estab - 7, 0, 100); return 'El socio rompe: tu mayoría se tambalea.'; } },
        { k: 'aplazar', t: 'Aplazar con una comisión de seguimiento', d: 'Ganas semanas sin resolver el fondo.', ef: (E, J) => { const g = E.paises.ES.gob; g.estab = clamp(g.estab + 0.5, 0, 100); return 'Compras tiempo con una comisión.'; } }],
      as: { jefe: 'aplazar', portavoz: 'plantar', estratega: 'ceder' } },
    baron: { ic: '🧑‍💼', n: 'Un barón se rebela', req: E => E.partidos[E.jugador.partido].amb === 'nac', plazo: 3, defecto: 2,
      txt: E => `Un barón territorial de tu partido critica públicamente tu liderazgo y amenaza con un congreso extraordinario.`,
      op: [
        { k: 'pactar', t: 'Pactar con él: dar peso a su territorio', d: 'Compras su silencio y refuerzas la unidad.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 3, 15, 99); return 'El barón se calma: más unidad.'; }, mem: { tipo: 'cesion', txt: 'pactaste con un barón rebelde' } },
        { k: 'castigar', t: 'Castigarle: apartarle de la dirección', d: 'Muestras autoridad, con riesgo de guerra interna.', cap: 18, ef: (E, J) => { if (U.chance(0.55)) { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 15, 99); C.Personaje.cambiar(E, { prestigio: 1.5 }); return 'La dirección cierra filas contigo.'; } pa(E).cohesion = clamp(pa(E).cohesion - 7, 15, 99); return 'El barón arrastra a otros: guerra civil en el partido.'; } },
        { k: 'ignorar', t: 'Ignorarle', d: 'No haces nada y esperas que se enfríe.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion - 2.5, 15, 99); return 'Lo ignoras y la crítica crece.'; } }],
      as: { jefe: 'pactar', portavoz: 'ignorar', estratega: 'castigar' } },
    amigo: { ic: '🫂', n: 'Un compañero, en problemas', req: E => true, plazo: 3, defecto: 2,
      txt: E => `Un viejo compañero tuyo aparece en un informe judicial por un asunto turbio. Los medios piden que te pronuncies.`,
      op: [
        { k: 'defender', t: 'Defender su inocencia', d: 'Lealtad: si se confirma, tu imagen se resiente.', ef: (E, J) => { if (U.chance(0.5)) { C.Personaje.cambiar(E, { prestigio: 1 }); return 'Se aclara: quedas como un amigo leal.'; } C.Personaje.cambiar(E, { prestigio: -3 }, true); return 'Se confirma lo peor: te salpica.'; }, mem: { tipo: 'promesa', txt: 'dijiste que tu compañero era inocente', k: 'corr' } },
        { k: 'apartar', t: 'Apartarle de inmediato', d: 'Ejemplaridad, con enfado entre los tuyos.', cap: 9, ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion - 2, 15, 99); C.Personaje.cambiar(E, { prestigio: 2 }); return 'Das ejemplo, pero hay malestar interno.'; } },
        { k: 'callar', t: 'Guardar silencio', d: 'Esperas que pase la tormenta.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: -1 }); return 'El silencio se interpreta como complicidad.'; } }],
      as: { jefe: 'apartar', portavoz: 'defender', estratega: 'callar' } },
    encuesta: { ic: '📊', n: 'Una encuesta incómoda', req: E => true, plazo: 2, defecto: 0,
      txt: E => `Tu sondeo interno es pésimo y alguien ya ha filtrado partes. Hay que decidir cómo gestionarlo.`,
      op: [
        { k: 'ocultar', t: 'Negar su existencia', d: 'Si sale a la luz, parecerás un mentiroso.', ef: (E, J) => { if (U.chance(0.45)) { C.Personaje.cambiar(E, { prestigio: -2.5 }); return 'Se publica entero: te acusan de ocultar datos.'; } return 'Logras que se olvide.'; }, mem: { tipo: 'promesa', txt: 'negaste una encuesta interna', k: 'aprob' } },
        { k: 'publicar', t: 'Publicarla y pedir la remontada', d: 'Transparencia que moviliza a los tuyos.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 15, 99); C.Personaje.cambiar(E, { prestigio: 1 }); return 'Tu franqueza gusta: los tuyos se movilizan.'; } },
        { k: 'relativizar', t: 'Relativizarla: «una foto, no la película»', d: 'Neutro, sin ganar ni perder.', ef: (E, J) => 'Pasa sin más.' }],
      as: { jefe: 'publicar', portavoz: 'relativizar', estratega: 'publicar' } },
    huelga: { ic: '✊', n: 'Huelga general convocada', req: E => true, plazo: 3, defecto: 2,
      txt: E => `Los sindicatos convocan una huelga general. Te piden que fijes posición esta misma semana.`,
      op: [
        { k: 'apoyar', t: 'Apoyar la huelga', d: 'Sintonizas con la calle, enfadas a los empresarios.', ef: (E, J) => { C.Personaje.cambiar(E, { pop: 1.2, prestigio: pa(E).eco > 0 ? -1 : 0.6 }); return 'Respaldas a los trabajadores.'; }, mem: { tipo: 'ataque', txt: 'apoyaste una huelga general' } },
        { k: 'condenar', t: 'Condenarla', d: 'Gusta a los empresarios, pero te distancia de la calle.', ef: (E, J) => { C.Personaje.cambiar(E, { pop: -0.8, prestigio: pa(E).eco > 0 ? 0.8 : -1.2 }); return 'Condenas la huelga.'; } },
        { k: 'mediar', t: 'Proponer una mediación', d: 'Equilibrio: pocos aplausos, pocos riesgos.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 0.6 }); return 'Ofreces mediar: nadie queda del todo contento.'; } }],
      as: { jefe: 'mediar', portavoz: 'apoyar', estratega: 'condenar' } },
    promesa: { ic: '🎙', n: 'Una promesa imposible', req: E => true, plazo: 2, defecto: 1,
      txt: E => `En plena entrevista te piden que prometas bajar el alquiler de forma tajante. La audiencia es enorme y el entrevistador no suelta el tema.`,
      op: [
        { k: 'prometer', t: 'Prometerlo sin matices', d: 'Aplauso hoy; hemeroteca mañana.', ef: (E, J) => { C.Personaje.cambiar(E, { pop: 1.5 }); C.Opinion.empuje(E, J.partido, 0.03, 0.3); return 'Arrasas en la entrevista con una promesa rotunda.'; }, mem: { tipo: 'promesa', txt: 'prometiste bajar el alquiler', k: 'alquiler' } },
        { k: 'matizar', t: 'Matizar con datos y plazos', d: 'Menos titulares, más credibilidad.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 0.8 }); return 'Una respuesta sobria que no hace ruido.'; } },
        { k: 'eludir', t: 'Eludir la pregunta', d: 'Se nota y se recorta.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: -0.8, pop: -0.3 }); return 'Eludir te cuesta un recorte viral.'; } }],
      as: { jefe: 'matizar', portavoz: 'prometer', estratega: 'prometer' } },
    escision: { ic: '💥', n: 'Un barón amenaza con irse', req: E => false, plazo: 3, defecto: 2,
      txt: (E, x) => { const b = x && x.reg && C.Barones.asegurar(E).b[x.reg], p = b && E.politicos[b.id]; return `${p ? p.n : 'Un barón'}, presidente/a de ${x && x.reg ? C.DATA.ccaa[x.reg].nombre : 'su comunidad'}, se siente maltratado/a y estudia abandonar el partido para fundar uno propio.`; },
      op: [
        { k: 'ceder', t: 'Ceder: financiación y peso en la dirección', d: 'Compras su lealtad; otros barones protestarán por el agravio.', cap: 12, ef: (E, J, x) => { const B = C.Barones, s = B.asegurar(E), b = s.b[x.reg]; if (!b) return 'El barón ya no está en tu partido.'; if (b) b.leal = clamp(b.leal + 38, 0, 100); for (const o of B.lista(E)) if (o.c !== x.reg) o.b.leal = clamp(o.b.leal - 4, 0, 100); pa(E).cohesion = clamp(pa(E).cohesion + 1, 15, 99); return 'El barón se queda… por ahora. Otros miran con envidia.'; }, mem: { tipo: 'cesion', txt: 'cediste ante el chantaje de un barón' } },
        { k: 'expulsar', t: 'Plantarle cara: expulsarlo/a', d: 'Muestras autoridad, pero se va y funda su partido con parte de la estructura.', cap: 9, ef: (E, J, x) => { if (!C.Barones.fundar(E, x.reg, 0.55)) return 'El barón ya no está en tu partido.'; C.Personaje.cambiar(E, { prestigio: 1.0 }); return 'Lo expulsas: nace un nuevo partido regional.'; } },
        { k: 'dejar', t: 'No hacer nada', d: 'Quizá se calme… o quizá se vaya con todo.', ef: (E, J, x) => { if (U.chance(0.5) && C.Barones.fundar(E, x.reg, 1)) { return 'Tu pasividad lo empuja a la ruptura: funda su partido.'; } const b = C.Barones.asegurar(E).b[x.reg]; if (b) b.leal = 40; return 'La tormenta amaina, pero la herida sigue abierta.'; } }],
      as: { jefe: 'ceder', portavoz: 'expulsar', estratega: 'ceder' } },
    presion: { ic: '📣', n: 'La oposición exige elecciones', req: E => false, plazo: 3, defecto: 0,
      txt: E => `La presión en la calle y en el Congreso para que convoques elecciones anticipadas es máxima (${Math.round(C.Presion.asegurar(E).nivel)} de 100).`,
      op: [
        { k: 'resistir', t: 'Resistir: «agotaré la legislatura»', d: 'Bajas la presión, pero pierdes algo de apoyo parlamentario.', cap: 8, ef: (E, J) => { C.Presion.empujar(E, -14, 'Resistes la presión.'); E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab - 1.5, 0, 100); C.Personaje.cambiar(E, { prestigio: -0.4 }); return 'Resistes el chaparrón: la presión baja.'; } },
        { k: 'convocar', t: 'Convocar elecciones', d: 'Tomas la iniciativa y disuelves las Cortes.', ef: (E, J) => { const r = C.Generales.disolver(E, 'ante la presión de la oposición', false); if (r !== true) { C.Presion.empujar(E, -8); return 'No puedes disolver ahora (' + r + '): ganas tiempo.'; } C.Personaje.cambiar(E, { pop: 0.5, prestigio: 0.5 }); return 'Convocas elecciones: tomas la iniciativa.'; } },
        { k: 'confianza', t: 'Plantear una cuestión de confianza', d: 'Si la ganas, quedas fortalecido; si la pierdes, caen las Cortes.', ef: (E, J) => { const g = E.paises.ES.gob, p = clamp(0.22 + g.estab / 140 + (g.coalicion.length - 1) * 0.04, 0.15, 0.85); if (U.chance(p)) { C.Presion.empujar(E, -32, 'Ganas la cuestión de confianza.'); g.estab = clamp(g.estab + 8, 0, 100); C.Personaje.cambiar(E, { prestigio: 2 }); return 'Superas la cuestión de confianza: sales reforzado.'; } C.Generales.disolver(E, 'tras perder la cuestión de confianza', true); C.Personaje.cambiar(E, { prestigio: -2 }); return 'Pierdes la cuestión de confianza: se disuelven las Cortes.'; } }],
      as: { jefe: 'resistir', portavoz: 'confianza', estratega: 'convocar' } },
    favorAmigo: { ic: '🤝', n: 'Un viejo amigo pide un favor', req: E => false, plazo: 4, defecto: 2,
      txt: (E, x) => { const p = x && E.politicos[x.pol]; return `${p ? p.n : 'Un viejo amigo'} (${p ? E.partidos[p.p].sigla : ''}) te pide un favor delicado: que suavices tu postura en un asunto que le afecta.`; },
      op: [
        { k: 'conceder', t: 'Concederle el favor', d: 'Refuerzas la amistad; te lo pueden echar en cara.', cap: 6, ef: (E, J, x) => { lz(E, x, 25); const p = E.politicos[x.pol]; if (p) rel(E, p.p, 6); C.Personaje.cambiar(E, { prestigio: -0.3 }); return 'Le haces el favor: ganas un aliado personal.'; }, mem: { tipo: 'favor', txt: 'concediste un favor a un viejo amigo político', pid: 'r' } },
        { k: 'condicionar', t: 'Condicionarlo a algo a cambio', d: 'Transaccional: ni amigo ni enemigo.', ef: (E, J, x) => { lz(E, x, 4); C.Personaje.cambiar(E, { prestigio: 0.3 }); return 'Pides contrapartidas: la relación se enfría un poco.'; } },
        { k: 'negar', t: 'Negárselo con elegancia', d: 'Mantienes la coherencia a costa de la amistad.', ef: (E, J, x) => { lz(E, x, -12); C.Personaje.cambiar(E, { prestigio: 0.6 }); return 'Se lo niegas: su afecto se resiente.'; } }],
      as: { jefe: 'condicionar', portavoz: 'negar', estratega: 'conceder' } },
    traicion: { ic: '🗡️', n: 'Un enemigo te filtra a la prensa', req: E => false, plazo: 3, defecto: 1,
      txt: (E, x) => { const p = x && E.politicos[x.pol]; return `${p ? p.n : 'Un adversario'} (${p ? E.partidos[p.p].sigla : ''}) prepara una filtración contra ti. Te enteras antes de que salga.`; },
      op: [
        { k: 'adelantarte', t: 'Adelantarte: contar tu versión', d: 'Reduces el daño pero das pábulo.', ef: (E, J, x) => { C.Personaje.cambiar(E, { prestigio: -0.4 }); lz(E, x, -5); return 'Cuentas tu versión antes: el golpe pierde fuerza.'; } },
        { k: 'dejar', t: 'Dejar que salga', d: 'Pierdes apoyos si es grave.', ef: (E, J, x) => { C.Personaje.cambiar(E, { prestigio: -1.4, pop: -0.4 }); lz(E, x, -8); return 'La filtración sale y te hace daño.'; } },
        { k: 'pactar', t: 'Buscar un acuerdo con él', d: 'Rebajas el enfrentamiento personal.', cap: 8, ef: (E, J, x) => { lz(E, x, 30); return 'Pactáis una tregua: la filtración no llega a salir.'; } }],
      as: { jefe: 'pactar', portavoz: 'adelantarte', estratega: 'adelantarte' } },
    reportaje: { ic: '📰', n: 'Un reportaje de investigación te señala', req: E => false, plazo: 3, defecto: 2,
      txt: E => { const m = C.Dilemas.asegurar(E).memoria.find(x => !x.cobrado); return m ? `Un medio publica un reportaje que recuerda que ${m.txt}.` : `Un medio prepara un reportaje sobre tu gestión y tu entorno. Te dan 24 horas para responder.`; },
      op: [
        { k: 'desmentir', t: 'Desmentirlo con contundencia', d: 'Puede salir bien o mal según tu integridad.', ef: (E, J) => { const p = clamp(0.35 + (J.atrib.integridad || 3) / 20, 0.2, 0.8); if (U.chance(p)) { C.Personaje.cambiar(E, { prestigio: 0.8 }); return 'Tu desmentido convence: el reportaje se desinfla.'; } C.Personaje.cambiar(E, { prestigio: -1.8 }); return 'Tu desmentido se desmonta: peor que si hubieras callado.'; } },
        { k: 'demandar', t: 'Anunciar una demanda contra el medio', d: 'Intimida, pero te enemista con la prensa.', cap: 9, ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: -0.6, pop: -0.3 }); if (C.Medios && C.Medios.asegurar) { const m = C.Medios.asegurar(E); if (m && m.rel) for (const k in m.rel) m.rel[k] = clamp(m.rel[k] - 2, -100, 100); } return 'Anuncias acciones legales: sale el titular, pero te ganas enemigos.'; } },
        { k: 'asumir', t: 'Asumirlo y pedir disculpas', d: 'Duele ahora, pero te hace creíble.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: -0.6, pop: 0.1 }); const m = C.Dilemas.asegurar(E).memoria.find(x => !x.cobrado); if (m) m.cobrado = true; return 'Pides disculpas: el asunto se cierra rápido.'; } }],
      as: { jefe: 'asumir', portavoz: 'desmentir', estratega: 'demandar' } },
    rey: { ic: '👑', n: 'Palabras del Rey que te interpelan', req: E => false, plazo: 2, defecto: 1,
      txt: E => `El discurso del Rey ha dejado frases que la prensa interpreta como un mensaje para ti. Te piden una reacción.`,
      op: [
        { k: 'acoger', t: 'Acoger sus palabras y comprometerte', d: 'Imagen institucional.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 1.0 }); if (C.Corona) C.Corona.cambiar(E, 0.4); return 'Valoras el discurso y te comprometes: buena imagen.'; } },
        { k: 'silencio', t: 'Mantener silencio', d: 'No ganas ni pierdes.', ef: () => 'Dejas pasar el asunto.' },
        { k: 'critica', t: 'Marcar distancia con la Corona', d: 'Agrada a tu base más crítica.', ef: (E, J) => { C.Personaje.cambiar(E, { pop: 0.2, prestigio: -0.7 }); if (C.Corona) C.Corona.cambiar(E, -0.4); pa(E).cohesion = clamp(pa(E).cohesion + 0.5, 15, 99); return 'Te desmarcas: ruido institucional.'; } }],
      as: { jefe: 'acoger', portavoz: 'silencio', estratega: 'acoger' } },
    extranjero: { ic: '🌍', n: 'Una victoria electoral en el extranjero', req: E => false, plazo: 3, defecto: 1,
      txt: (E, x) => `${x && x.sg ? x.sg : 'Un partido'} gana las elecciones en ${x && x.nom ? x.nom : 'otro país'} (${x && x.gr ? x.gr : ''}). Te piden que te posiciones.`,
      op: [
        { k: 'felicitar', t: 'Felicitar públicamente', d: 'Sube la relación, pero te asocian con él.', ef: (E, J, x) => { const Ex = C.Exterior; if (Ex) { const m = { FR: 'francia', DE: 'alemania', PT: 'portugal' }[x.ext]; if (m) { const e = Ex.asegurar(E); e.rel[m] = clamp(e.rel[m] + 2, 0, 100); } } C.Personaje.cambiar(E, { prestigio: ['ANR', 'PAT'].includes(x.gr) ? -1.2 : 0.4 }); return 'Felicitas al ganador.'; } },
        { k: 'neutral', t: 'Respeto a la voluntad popular', d: 'Neutral, sin sobresaltos.', ef: () => 'Respetas el resultado sin comentarlo.' },
        { k: 'distancia', t: 'Marcar distancia', d: 'Útil si el ganador es incómodo.', ef: (E, J, x) => { const ex = ['ANR', 'PAT'].includes(x.gr); C.Personaje.cambiar(E, { prestigio: ex ? 0.8 : -0.3 }); return ex ? 'Marcas distancia con la extrema derecha: aplauso en tu base.' : 'Te distancias sin mucho eco.'; } }],
      as: { jefe: 'neutral', portavoz: 'distancia', estratega: 'felicitar' } },
    crisisPostura: { ic: '🎙', n: 'Cómo te posicionas ante la crisis', req: E => false, plazo: 2, defecto: 2,
      txt: (E, x) => `El país está pendiente de «${x && x.nom ? x.nom.toLowerCase() : 'la crisis'}». Todos esperan tu posición.`,
      op: [
        { k: 'hombro', t: 'Arrimar el hombro y ofrecer apoyo', d: 'Imagen de Estado.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 0.9 }); return 'Ofreces tu apoyo sin condiciones: buena imagen.'; } },
        { k: 'criticar', t: 'Criticar la gestión del Gobierno', d: 'Rentable si sale mal; arriesgado si sale bien.', ef: (E, J) => { C.Personaje.cambiar(E, { pop: 0.3, prestigio: -0.2 }); if (C.Nemesis) C.Nemesis.subir(E, 2); return 'Cargas contra el Gobierno: tus bases aplauden.'; } },
        { k: 'callar', t: 'Mantener un perfil bajo', d: 'No ganas ni pierdes.', ef: () => 'Dejas que pase la crisis.' }],
      as: { jefe: 'hombro', portavoz: 'criticar', estratega: 'hombro' } },
    salud: { ic: '🩺', n: 'Tu cuerpo dice basta', req: E => false, plazo: 3, defecto: 1,
      txt: E => `El ritmo te pasa factura: cansancio, insomnio y un aviso del médico (salud ${Math.round(C.Vida.asegurar(E).salud)}, estrés ${Math.round(C.Vida.asegurar(E).estres)}).`,
      op: [
        { k: 'parar', t: 'Parar unas semanas', d: 'Recuperas salud; pierdes puntos de agenda y algo de tracción.', ef: (E, J) => { C.Vida.parar(E, 3); C.Vida.nota(E, 'Paras tres semanas por prescripción médica.'); C.Personaje.cambiar(E, { prestigio: 0.3, pop: -0.3 }, true); return 'Paras tres semanas: te recuperas.'; } },
        { k: 'aguantar', t: 'Aguantar como puedas', d: 'Riesgo de colapso, pero mantienes el ritmo.', ef: (E, J) => { const v = C.Vida.asegurar(E); if (U.chance(0.4)) { v.salud = clamp(v.salud - 15, 0, 100); C.Vida.parar(E, 2); C.Noticias.poner(E, 'politica', `${J.nombre} sufre un desvanecimiento y es atendido en el hospital.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.8 }, true); return 'Te desvaneces en un acto público: ingreso hospitalario.'; } C.Personaje.cambiar(E, { prestigio: 0.5 }, true); v.estres = clamp(v.estres - 5, 0, 100); return 'Aguantas y la imagen de fortaleza te favorece.'; } },
        { k: 'excedencia', t: 'Pedir una excedencia de seis semanas', d: 'Un parón largo y visible: costoso pero curativo.', cap: 5, ef: (E, J) => { C.Vida.parar(E, 6); C.Vida.asegurar(E).estres = 15; C.Personaje.cambiar(E, { prestigio: -1.5, pop: -0.5 }, true); C.Vida.nota(E, 'Excedencia de seis semanas.'); return 'Te tomas seis semanas: vuelves como nuevo/a.'; } },
        { k: 'ocultar', t: 'Ocultarlo y descansar discretamente', d: 'Descansas poco; si se sabe, es un problema.', ef: (E, J) => { C.Vida.parar(E, 1); C.Vida.asegurar(E).estres = clamp(C.Vida.asegurar(E).estres - 12, 0, 100); return 'Descansas a escondidas.'; }, mem: { tipo: 'filtracion', txt: 'ocultaste un problema de salud' } }],
      as: { jefe: 'parar', portavoz: 'aguantar', estratega: 'ocultar' } },
    familia: { ic: '👪', n: 'Un escándalo familiar te salpica', req: E => false, plazo: 3, defecto: 2,
      txt: E => `La prensa publica que un familiar cercano tiene negocios con la Administración. Todos esperan tu reacción.`,
      op: [
        { k: 'defender', t: 'Defender a tu familiar', d: 'Lealtad personal; coste político.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: -0.7, pop: -0.3 }, true); C.Vida.asegurar(E).estres = clamp(C.Vida.asegurar(E).estres - 4, 0, 100); return 'Defiendes a tu familiar: tu entorno te lo agradece, la prensa no.'; } },
        { k: 'distanciarte', t: 'Distanciarte públicamente', d: 'Ejemplaridad; dolor personal.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 0.4 }, true); C.Vida.asegurar(E).estres = clamp(C.Vida.asegurar(E).estres + 6, 0, 100); return 'Marcas distancia con tu familiar: ganas ejemplaridad.'; } },
        { k: 'explicar', t: 'Comparecer y explicar los hechos', d: 'Si cuela, sales reforzado/a.', cap: 6, ef: (E, J) => { if (U.chance(clamp(0.4 + (J.atrib.integridad || 3) / 20, 0.25, 0.85))) { C.Personaje.cambiar(E, { prestigio: 0.9 }, true); return 'Tu explicación convence.'; } C.Personaje.cambiar(E, { prestigio: -1.6, pop: -0.5 }, true); return 'Tu explicación no convence y empeora las cosas.'; }, mem: { tipo: 'filtracion', txt: 'un familiar tuyo tenía contratos con la Administración' } }],
      as: { jefe: 'explicar', portavoz: 'distanciarte', estratega: 'defender' } },
    congresoExtra: { ic: '🏁', n: 'Piden un congreso extraordinario', req: E => false, plazo: 3, defecto: 1,
      txt: E => `El sector crítico de tu partido reclama un congreso extraordinario y la presión interna es alta (${Math.round(C.PartidoInt.asegurar(E).cong.presion)} de 100).`,
      op: [
        { k: 'convocar', t: 'Adelantar el congreso y someterte a votación', d: 'Legitimidad si ganas; riesgo si pierdes.', ef: (E, J) => { const c = C.PartidoInt.asegurar(E).cong; c.prox = E.fecha.t + 7; c.presion = 25; C.Personaje.cambiar(E, { prestigio: 0.8 }, true); return 'Adelantas el congreso: te la juegas ante los delegados.'; } },
        { k: 'resistir', t: 'Resistir y amarrar apoyos', d: 'Cuesta capital; baja la presión por ahora.', cap: 6, ef: (E, J) => { const c = C.PartidoInt.asegurar(E).cong; c.presion = Math.max(0, c.presion - 25); C.PartidoInt.amarrar(E); return 'Resistes: amarras a los barones y la presión baja.'; } },
        { k: 'purgar', t: 'Purgar a los críticos', d: 'Fuerza bruta: puede provocar una escisión.', cap: 8, ef: (E, J) => { const c = C.PartidoInt.asegurar(E).cong; c.presion = Math.max(0, c.presion - 35); if (U.chance(0.5)) { const r = C.Escision.fundarNacional(E, { old: J.partido, fuerza: U.rf(0.4, 0.9), lider: null, motivo: 'expulsión de críticos' }); if (r) return 'Expulsas a los críticos: forman un partido propio.'; } pa(E).cohesion = clamp(pa(E).cohesion - 3, 15, 99); return 'Purgas a los críticos: el partido queda en silencio, pero herido.'; } }],
      as: { jefe: 'resistir', portavoz: 'convocar', estratega: 'convocar' } },
    criticosEscision: { ic: '🚪', n: 'Los críticos amenazan con irse', req: E => false, plazo: 3, defecto: 2,
      txt: E => 'Un grupo de diputados y dirigentes críticos estudia abandonar el partido para fundar una formación propia.',
      op: [
        { k: 'integrar', t: 'Integrarlos: puestos y una ejecutiva plural', d: 'Compras la paz a cambio de poder interno.', cap: 7, ef: (E, J) => { const p = C.PartidoInt.asegurar(E); p.fac.critico = clamp(p.fac.critico - 8, 5, 60); p.fac.oficial = 100 - p.fac.barones - p.fac.critico; pa(E).cohesion = clamp(pa(E).cohesion + 3, 15, 99); return 'Pactas la integración de los críticos.'; } },
        { k: 'expulsar', t: 'Plantarles cara y expulsarlos', d: 'Se van y fundan su partido con parte de la estructura.', cap: 5, ef: (E, J) => { const r = C.Escision.fundarNacional(E, { old: J.partido, fuerza: U.rf(0.4, 0.8), lider: null, motivo: 'expulsión de críticos' }); C.Personaje.cambiar(E, { prestigio: 0.8 }, true); return r ? 'Los críticos se van y fundan un partido propio.' : 'No llegan a irse.'; } },
        { k: 'dejar', t: 'No hacer nada', d: 'Quizá se queden… o se vayan con todo.', ef: (E, J) => { if (U.chance(0.45)) { const r = C.Escision.fundarNacional(E, { old: J.partido, fuerza: U.rf(0.6, 1), lider: null, motivo: 'crisis interna' }); if (r) return 'Se van con estrépito y fundan su partido.'; } return 'La amenaza se enfría, pero el malestar sigue.'; } }],
      as: { jefe: 'integrar', portavoz: 'expulsar', estratega: 'integrar' } },
    donativo: { ic: '💼', n: 'Un empresario ofrece una donación', req: E => false, plazo: 3, defecto: 1,
      txt: E => `Un empresario influyente ofrece una importante donación a ${pa(E).sigla} a cambio de «sensibilidad» con su sector. Las arcas del partido (${C.Sede ? C.Sede.millones(pa(E)) : Math.round(pa(E).finanzas)} M€) lo agradecerían.`,
      op: [
        { k: 'aceptar', t: 'Aceptar la donación sin preguntas', d: 'Mucha caja, pero puede acabar en los tribunales.', ef: (E, J) => { pa(E).finanzas = clamp(pa(E).finanzas + 14, 0, 99); if (C.Corrupcion && U.chance(0.35)) { C.Corrupcion.nuevo(E, J.partido, { gravedad: U.rf(0.25, 0.5), tipo: 'financiacion' }); return 'Aceptas el dinero… y a las semanas aparece una investigación por financiación irregular.'; } return 'Aceptas la donación: las arcas respiran.'; }, mem: { tipo: 'filtracion', txt: 'aceptaste una donación polémica para el partido' } },
        { k: 'rechazar', t: 'Rechazarla públicamente', d: 'Ganas imagen; sigues escaso de caja.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 0.9 }, true); pa(E).cohesion = clamp(pa(E).cohesion + 0.5, 15, 99); return 'Rechazas la donación: ganas credibilidad.'; } },
        { k: 'condicionar', t: 'Aceptar sólo como donación transparente y limitada', d: 'Menos dinero, sin riesgo.', ef: (E, J) => { pa(E).finanzas = clamp(pa(E).finanzas + 5, 0, 99); return 'Aceptas una donación legal, pública y limitada.'; } }],
      as: { jefe: 'condicionar', portavoz: 'rechazar', estratega: 'aceptar' } },
    pactoPrograma: { ic: '📑', n: 'Tus socios exigen cambiar tu programa', req: E => false, plazo: 5, defecto: 2,
      txt: (E, x) => { if (!x || !x.pid || !x.area) return 'Un socio exige cambios en tu programa.'; const a = C.DATA.programa.find(y => y.id === x.area), s = C.Sede.asegurar(E), act = a.ops.find(o => o.k === s.prog[x.area]), alt = a.ops.find(o => o.k === x.alt); return `${sg(E, x.pid)} condiciona su apoyo a que cambies tu postura en ${a.n.toLowerCase()}: quiere «${alt.t}» en lugar de «${act ? act.t : 'tu postura actual'}».`; },
      op: [
        { k: 'ceder', t: 'Ceder: adoptar su postura', d: 'Mejora la relación y la estabilidad; cuesta cohesión interna.', ef: (E, J, x) => { if (!x || !x.pid) return 'Sin efecto.'; return C.PactosPrograma.ceder(E, x); }, mem: { tipo: 'cesion', txt: 'cediste en tu programa para cerrar un pacto' } },
        { k: 'compromiso', t: 'Negociar una fórmula intermedia', d: 'Puede cuajar o no.', cap: 6, ef: (E, J, x) => { if (!x || !x.pid) return 'Sin efecto.'; if (U.chance(0.5 + (J.atrib.negociacion || 3) / 25)) { rel(E, x.pid, 3); E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab + 1, 0, 100); return 'Pactáis una fórmula intermedia y el socio se da por satisfecho.'; } rel(E, x.pid, -3); return 'La fórmula intermedia no convence y el socio se molesta.'; } },
        { k: 'mantener', t: 'Mantener tu programa', d: 'Coherencia a costa del socio.', ef: (E, J, x) => { if (!x || !x.pid) return 'Sin efecto.'; rel(E, x.pid, -7); const g = E.paises.ES.gob; g.estab = clamp(g.estab - 3, 0, 100); if (g.coalicion.includes(x.pid) && x.pid !== g.partido && U.chance(0.12) && C.Consejo && C.Consejo.rompe) { C.Consejo.rompe(E, x.pid); return 'Mantienes tu programa y el socio abandona el Gobierno.'; } C.Personaje.cambiar(E, { prestigio: 0.4 }, true); return 'Mantienes tu programa: ganas coherencia, el socio protesta.'; } }],
      as: { jefe: 'compromiso', portavoz: 'mantener', estratega: 'ceder' } },
    pactoEstado: { ic: '🏛', n: 'Una oferta de pacto de Estado', req: E => true, plazo: 3, defecto: 1,
      txt: E => `${sg(E, rival(E))} te ofrece un pacto de Estado, pero te exige un gesto que irritará a tus bases.`,
      op: [
        { k: 'aceptar', t: 'Aceptar el pacto', d: 'Sube tu imagen de estadista; tus bases lo sufren.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 2.2 }); pa(E).cohesion = clamp(pa(E).cohesion - 2.5, 15, 99); rel(E, rival(E), 9); return 'Cierras el pacto: imagen de Estado, ruido interno.'; }, mem: { tipo: 'cesion', txt: 'pactaste con tu rival contra el criterio de tus bases' } },
        { k: 'rechazar', t: 'Rechazarlo', d: 'Cierras filas con los tuyos.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 15, 99); rel(E, rival(E), -4); return 'Rechazas el pacto: tu base aplaude.'; } },
        { k: 'contra', t: 'Contraoferta: tus condiciones', d: 'Arriesgado: puede cuajar o romperse.', cap: 9, ef: (E, J) => { if (U.chance(0.45)) { C.Personaje.cambiar(E, { prestigio: 2.5 }); rel(E, rival(E), 6); return 'Aceptan tu contraoferta: gran golpe de efecto.'; } rel(E, rival(E), -6); return 'Rechazan tu contraoferta: sin pacto.'; } }],
      as: { jefe: 'contra', portavoz: 'rechazar', estratega: 'aceptar' } }
  };
  const Dl = C.Dilemas = {
    CAT,
    asegurar(E) {
      if (E.esp.dil) return E.esp.dil; const nm = () => { const p = C.Mundo.persona('ES'); return p.n; };
      return E.esp.dil = { act: [], hist: [], memoria: [], capital: 50, asesor: { jefe: { n: 'Tu jefe/a de gabinete', conf: 60 }, portavoz: { n: nm(), conf: 60 }, estratega: { n: nm(), conf: 60 } }, ult: -99 };
    },
    asesores(E) { const d = Dl.asegurar(E), j = C.Jefe && C.Jefe.asegurar(E).jefe; if (j) d.asesor.jefe.n = j.n; return d.asesor; },
    nuevo(E, id, multi) {
      const d = Dl.asegurar(E), def = CAT[id]; if (!def || (!multi && d.act.some(x => x.id === id)) || (C.Foco && !C.Foco.dilema(E, id))) return null; const t = E.fecha.t;
      const x = { uid: U.id('dl'), id, t0: t, limite: t + def.plazo, rival: rival(E) }; d.act.push(x); d.ult = t; if (C.Tutor) C.Tutor.una(E, 'dilema');
      C.Noticias.poner(E, 'politica', `${E.jugador.nombre} afronta una decisión delicada: ${def.n.toLowerCase()}.`, 'ES'); return x;
    },
    /* Valora un cambio: prestigio y popularidad personales, cohesión del partido y apoyo del partido. */
    puntua(dd) { return Math.round((dd.pr * 1 + dd.pop * 1.2 + dd.coh * 0.35 + (dd.ap || 0) * 6) * 10) / 10; },
    registrar(E, tipo, txt, score) { const d = Dl.asegurar(E); d.hist.unshift({ t: E.fecha.t, txt, res: '', score, tipo }); if (d.hist.length > 60) d.hist.length = 60; },
    libro(E) { return Dl.asegurar(E).hist.filter(h => h.score != null).slice().reverse(); },
    coste(o) { return o.cap || 0; },
    decidir(E, uid, k) {
      const d = Dl.asegurar(E), i = d.act.findIndex(x => x.uid === uid); if (i < 0) return { ok: false, msg: 'Ese dilema ya se ha resuelto' }; const x = d.act[i], def = CAT[x.id], o = def.op.find(y => y.k === k), J = E.jugador; if (!o) return { ok: false, msg: 'Opción no válida' };
      if ((o.cap || 0) > d.capital) return { ok: false, msg: `Necesitas ${o.cap} de capital político (tienes ${Math.round(d.capital)})` };
      const pa0 = pa(E), s0 = { pr: J.prestigio, pop: J.pop, coh: pa0.cohesion, ap: pa0.popN || pa0.pop }; d.act.splice(i, 1); d.capital = clamp(d.capital - (o.cap || 0), 0, 100); let msg = ''; try { msg = o.ef(E, J, x) || ''; } catch (e) { console.error('[dilema]', x.id, e); }
      // Asesores: el que aconsejó esa opción gana confianza; los demás pierden un poco
      for (const a in def.as) { const c = d.asesor[a]; if (def.as[a] === k) c.conf = clamp(c.conf + 4, 0, 100); else c.conf = clamp(c.conf - 1.5, 0, 100); }
      if (o.mem) { d.memoria.unshift({ id: U.id('mm'), t: E.fecha.t, tipo: o.mem.tipo, txt: o.mem.txt, k: o.mem.k || null, pid: o.mem.pid === 'r' ? x.rival : null, ini: o.mem.k ? C.Legado.valor(E, o.mem.k === 'corr' ? 'aprob' : o.mem.k) : null, cobrado: false }); if (d.memoria.length > 40) d.memoria.length = 40; }
      const pa1 = pa(E), dd = { pr: J.prestigio - s0.pr, pop: J.pop - s0.pop, coh: pa1.cohesion - s0.coh, ap: (pa1.popN || pa1.pop) - s0.ap }; d.hist.unshift({ t: E.fecha.t, txt: `${def.n}: ${o.t}`, res: msg, score: Dl.puntua(dd), tipo: 'dilema' }); if (d.hist.length > 60) d.hist.length = 60; C.Personaje.log(E, `${def.n}: ${o.t}. ${msg}`); return { ok: true, msg };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const d = Dl.asegurar(E), t = E.fecha.t, aj = C.Ajustes ? C.Ajustes.get(E) : { eventos: 1 };
      d.capital = clamp(d.capital + 0.15, 0, 100); Dl.asesores(E);
      // Caducan los dilemas sin decidir: se aplica la opción por defecto
      for (const x of d.act.slice()) if (t >= x.limite) { const def = CAT[x.id], o = def.op[def.defecto]; const cap = o.cap; if (cap) o.cap = 0; const r = Dl.decidir(E, x.uid, o.k); if (cap) o.cap = cap; C.Noticias.poner(E, 'politica', `${J.nombre} deja pasar el plazo en «${def.n.toLowerCase()}» y se impone la inercia.`, 'ES'); d.hist[0] && (d.hist[0].txt += ' (por inacción)'); }
      // Aparece un dilema nuevo
      if (d.act.length < 2 && t - d.ult >= 6 && U.chance(0.07 * aj.eventos)) { const pos = Object.keys(CAT).filter(k => (!C.Foco || C.Foco.dilema(E, k)) && !d.act.some(x => x.id === k) && !d.hist.slice(0, 5).some(h => h.txt.startsWith(CAT[k].n)) && CAT[k].req(E)); const k = U.pick(pos); if (k) Dl.nuevo(E, k); }
      // Hemeroteca: lo que dijiste y lo que hiciste vuelve
      if (U.chance(0.035)) Dl.hemeroteca(E);
      // Asesores quemados filtran
      for (const a in d.asesor) { const c = d.asesor[a]; if (c.conf < 25 && U.chance(0.012)) { c.conf = 35; C.Personaje.cambiar(E, { prestigio: -1.5 }, true); C.Noticias.poner(E, 'politica', `Un asesor descontento de ${J.nombre} filtra discrepancias internas.`, 'ES'); d.hist.unshift({ t, txt: `${c.n} filtra discrepancias`, res: 'Pierdes prestigio.' }); } }
    },
    hemeroteca(E) {
      const d = Dl.asegurar(E), t = E.fecha.t, J = E.jugador, cand = d.memoria.filter(m => !m.cobrado && t - m.t >= 14); if (!cand.length) return null; const m = U.pick(cand); m.cobrado = true; const p = pa(E);
      let txt = '';
      if (m.tipo === 'promesa' && m.ini != null) { const v = C.Legado.valor(E, m.k === 'corr' ? 'aprob' : m.k), bajo = ['alquiler', 'corr'].includes(m.k) ? true : false, cumple = m.k === 'corr' ? v >= m.ini : bajo ? v < m.ini - 1 : v > m.ini + 1; txt = cumple ? `La hemeroteca te sonríe: ${m.txt} y los hechos te dan la razón.` : `Te recuerdan que ${m.txt}: los datos no acompañan.`; C.Personaje.cambiar(E, { prestigio: cumple ? 1.5 : -2.2, pop: cumple ? 0.5 : -0.8 }, true); if (!cumple) C.Opinion.empuje(E, J.partido, -0.03, 0.3); }
      else if (m.tipo === 'crisis') { if (m.bien) { C.Personaje.cambiar(E, { prestigio: 0.8 }); txt = `Se recuerda que ${m.txt}: tu gestión sigue siendo un activo.`; } else { C.Personaje.cambiar(E, { prestigio: -1.0 }); if (C.Nemesis) C.Nemesis.subir(E, 2); txt = `Te echan en cara que ${m.txt}.`; } }
      else if (m.tipo === 'filtracion') { txt = `Sale a la luz que ${m.txt}.`; C.Personaje.cambiar(E, { prestigio: -2 }, true); if (m.pid) rel(E, m.pid, -6); }
      else if (m.tipo === 'favor' && m.pid) { rel(E, m.pid, 6); txt = `${sg(E, m.pid)} te devuelve el favor: ${m.txt}.`; C.Personaje.cambiar(E, { prestigio: 0.8 }); }
      else if (m.tipo === 'cesion') { txt = `Te echan en cara que ${m.txt}.`; p.cohesion = clamp(p.cohesion - 1.5, 15, 99); C.Personaje.cambiar(E, { prestigio: -0.6 }); }
      else { txt = `Un rival rescata que ${m.txt}.`; C.Personaje.cambiar(E, { prestigio: -0.8 }); if (C.Nemesis) C.Nemesis.subir(E, 3); }
      C.Noticias.poner(E, 'politica', `Hemeroteca: ${txt}`, 'ES'); d.hist.unshift({ t, txt: 'Hemeroteca', res: txt }); return txt;
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 0, grupo: 'carrera', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España' }, o));
  R({ id: 'resolver_dilema', nombre: 'Resolver un dilema', icono: '⏳', desc: 'Decide una cuestión delicada antes de que caduque.', ejecutar: (E, a) => Dl.decidir(E, a.uid, a.k) });
  C.Tiempo.registrar('dilemas', { turno: Dl.turno }, 56);
})(window.ESP);

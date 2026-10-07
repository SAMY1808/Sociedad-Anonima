/* Dilemas con reloj, capital político, asesores enfrentados y hemeroteca.
   Decisiones difíciles que caducan en pocas semanas, cuestan capital político y dejan una marca que vuelve más tarde.
   Estado: E.esp.dil = { act[], hist[], memoria[], capital, asesor:{jefe,portavoz,estratega}, ult }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const sg = (E, k) => E.partidos[k].sigla;
  const pa = E => E.partidos[E.jugador.partido];
  const rival = E => { const s = C.Nemesis && C.Nemesis.elegir(E); return s && s.pid ? s.pid : C.Mayorias.oposicion(E)[0]; };
  const rel = (E, k, d) => { if (C.Mayorias && k) C.Mayorias.cambiarRel(E, k, d); };
  /* Catálogo: texto, opciones {k,t,d,cap,ef→msg,mem?}, consejo por asesor, plazo (semanas) y defecto (índice). */
  const CAT = {
    filtracion: { ic: '📰', n: 'Una filtración que cae en tus manos', req: E => true, plazo: 3, defecto: 1,
      txt: E => `Un colaborador te entrega, a escondidas, documentos que dejan en muy mal lugar a ${sg(E, rival(E))}. Publicarlos ahora podría cambiar el pulso político.`,
      op: [
        { k: 'publicar', t: 'Publicarlos a través de un medio afín', d: 'Daña al rival, con riesgo de que se descubra el origen.', ef: (E, J) => { const r = rival(E); if (U.chance(0.6)) { C.Opinion.empujeES(E, r, -0.06); rel(E, r, -8); return `La filtración golpea a ${sg(E, r)}.`; } C.Personaje.cambiar(E, { prestigio: -2.5 }, true); return 'Se descubre el origen: escándalo en tu entorno.'; }, mem: { tipo: 'filtracion', txt: 'filtraste documentos contra un rival' } },
        { k: 'guardar', t: 'Guardarlos para un momento mejor', d: 'Sin riesgo ahora, pero otros pueden acabar sabiéndolo.', ef: (E, J) => { return 'Los guardas bajo llave: sin ruido por ahora.'; }, mem: { tipo: 'filtracion', txt: 'guardaste documentos comprometedores' } },
        { k: 'destruir', t: 'Destruirlos y avisar al rival', d: 'Un gesto limpio que le obliga a deberte una.', cap: 5, ef: (E, J) => { const r = rival(E); rel(E, r, 10); C.Personaje.cambiar(E, { prestigio: 1.5 }); return `${sg(E, r)} te debe un favor.`; }, mem: { tipo: 'favor', txt: 'le perdonaste una filtración a tu rival', pid: 'r' } }],
      as: { jefe: 'guardar', portavoz: 'publicar', estratega: 'destruir' } },
    socio: { ic: '🤝', n: 'Un socio aprieta', req: E => E.paises.ES.gob.pm === 'J' && (E.paises.ES.gob.apoyoExterno || []).length > 0, plazo: 3, defecto: 1,
      txt: E => { const g = E.paises.ES.gob, k = (g.apoyoExterno || [])[0]; return `${sg(E, k)} advierte de que dejará de apoyarte si no cedes en un asunto que considera «innegociable».`; },
      op: [
        { k: 'ceder', t: 'Ceder y cerrar el acuerdo', d: 'Aseguras el apoyo, a costa de imagen.', ef: (E, J) => { const g = E.paises.ES.gob; g.estab = clamp(g.estab + 4, 0, 100); g.aprob = clamp(g.aprob - 1.2, 5, 90); return 'Cedes: tu mayoría respira.'; }, mem: { tipo: 'cesion', txt: 'cediste ante un socio' } },
        { k: 'plantar', t: 'Plantarte: «no hay trato»', d: 'Muestras firmeza, pero te arriesgas a perder la mayoría.', cap: 10, ef: (E, J) => { const g = E.paises.ES.gob; if (U.chance(0.5)) { g.estab = clamp(g.estab + 1, 0, 100); C.Personaje.cambiar(E, { prestigio: 1.5 }); return 'El socio traga: ganas autoridad.'; } g.estab = clamp(g.estab - 7, 0, 100); return 'El socio rompe: tu mayoría se tambalea.'; } },
        { k: 'aplazar', t: 'Aplazar con una comisión de seguimiento', d: 'Ganas semanas sin resolver el fondo.', ef: (E, J) => { const g = E.paises.ES.gob; g.estab = clamp(g.estab + 0.5, 0, 100); return 'Compras tiempo con una comisión.'; } }],
      as: { jefe: 'aplazar', portavoz: 'plantar', estratega: 'ceder' } },
    baron: { ic: '🧑‍💼', n: 'Un barón se rebela', req: E => E.partidos[E.jugador.partido].amb === 'nac', plazo: 3, defecto: 2,
      txt: E => `Un barón territorial de tu partido critica públicamente tu liderazgo y amenaza con un congreso extraordinario.`,
      op: [
        { k: 'pactar', t: 'Pactar con él: dar peso a su territorio', d: 'Compras su silencio y refuerzas la unidad.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 3, 15, 99); return 'El barón se calma: más unidad.'; }, mem: { tipo: 'cesion', txt: 'pactaste con un barón rebelde' } },
        { k: 'castigar', t: 'Castigarle: apartarle de la dirección', d: 'Muestras autoridad, con riesgo de guerra interna.', cap: 12, ef: (E, J) => { if (U.chance(0.55)) { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 15, 99); C.Personaje.cambiar(E, { prestigio: 1.5 }); return 'La dirección cierra filas contigo.'; } pa(E).cohesion = clamp(pa(E).cohesion - 7, 15, 99); return 'El barón arrastra a otros: guerra civil en el partido.'; } },
        { k: 'ignorar', t: 'Ignorarle', d: 'No haces nada y esperas que se enfríe.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion - 2.5, 15, 99); return 'Lo ignoras y la crítica crece.'; } }],
      as: { jefe: 'pactar', portavoz: 'ignorar', estratega: 'castigar' } },
    amigo: { ic: '🫂', n: 'Un compañero, en problemas', req: E => true, plazo: 3, defecto: 2,
      txt: E => `Un viejo compañero tuyo aparece en un informe judicial por un asunto turbio. Los medios piden que te pronuncies.`,
      op: [
        { k: 'defender', t: 'Defender su inocencia', d: 'Lealtad: si se confirma, tu imagen se resiente.', ef: (E, J) => { if (U.chance(0.5)) { C.Personaje.cambiar(E, { prestigio: 1 }); return 'Se aclara: quedas como un amigo leal.'; } C.Personaje.cambiar(E, { prestigio: -3 }, true); return 'Se confirma lo peor: te salpica.'; }, mem: { tipo: 'promesa', txt: 'dijiste que tu compañero era inocente', k: 'corr' } },
        { k: 'apartar', t: 'Apartarle de inmediato', d: 'Ejemplaridad, con enfado entre los tuyos.', cap: 6, ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion - 2, 15, 99); C.Personaje.cambiar(E, { prestigio: 2 }); return 'Das ejemplo, pero hay malestar interno.'; } },
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
    pactoEstado: { ic: '🏛', n: 'Una oferta de pacto de Estado', req: E => true, plazo: 3, defecto: 1,
      txt: E => `${sg(E, rival(E))} te ofrece un pacto de Estado, pero te exige un gesto que irritará a tus bases.`,
      op: [
        { k: 'aceptar', t: 'Aceptar el pacto', d: 'Sube tu imagen de estadista; tus bases lo sufren.', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 2.2 }); pa(E).cohesion = clamp(pa(E).cohesion - 2.5, 15, 99); rel(E, rival(E), 9); return 'Cierras el pacto: imagen de Estado, ruido interno.'; }, mem: { tipo: 'cesion', txt: 'pactaste con tu rival contra el criterio de tus bases' } },
        { k: 'rechazar', t: 'Rechazarlo', d: 'Cierras filas con los tuyos.', ef: (E, J) => { pa(E).cohesion = clamp(pa(E).cohesion + 1.5, 15, 99); rel(E, rival(E), -4); return 'Rechazas el pacto: tu base aplaude.'; } },
        { k: 'contra', t: 'Contraoferta: tus condiciones', d: 'Arriesgado: puede cuajar o romperse.', cap: 6, ef: (E, J) => { if (U.chance(0.45)) { C.Personaje.cambiar(E, { prestigio: 2.5 }); rel(E, rival(E), 6); return 'Aceptan tu contraoferta: gran golpe de efecto.'; } rel(E, rival(E), -6); return 'Rechazan tu contraoferta: sin pacto.'; } }],
      as: { jefe: 'contra', portavoz: 'rechazar', estratega: 'aceptar' } }
  };
  const Dl = C.Dilemas = {
    CAT,
    asegurar(E) {
      if (E.esp.dil) return E.esp.dil; const nm = () => { const p = C.Mundo.persona('ES'); return p.n; };
      return E.esp.dil = { act: [], hist: [], memoria: [], capital: 50, asesor: { jefe: { n: 'Tu jefe/a de gabinete', conf: 60 }, portavoz: { n: nm(), conf: 60 }, estratega: { n: nm(), conf: 60 } }, ult: -99 };
    },
    asesores(E) { const d = Dl.asegurar(E), j = C.Jefe && C.Jefe.asegurar(E).jefe; if (j) d.asesor.jefe.n = j.n; return d.asesor; },
    nuevo(E, id) {
      const d = Dl.asegurar(E), def = CAT[id]; if (!def || d.act.some(x => x.id === id)) return null; const t = E.fecha.t;
      const x = { uid: U.id('dl'), id, t0: t, limite: t + def.plazo, rival: rival(E) }; d.act.push(x); d.ult = t;
      C.Noticias.poner(E, 'politica', `${E.jugador.nombre} afronta una decisión delicada: ${def.n.toLowerCase()}.`, 'ES'); return x;
    },
    coste(o) { return o.cap || 0; },
    decidir(E, uid, k) {
      const d = Dl.asegurar(E), i = d.act.findIndex(x => x.uid === uid); if (i < 0) return { ok: false, msg: 'Ese dilema ya se ha resuelto' }; const x = d.act[i], def = CAT[x.id], o = def.op.find(y => y.k === k), J = E.jugador; if (!o) return { ok: false, msg: 'Opción no válida' };
      if ((o.cap || 0) > d.capital) return { ok: false, msg: `Necesitas ${o.cap} de capital político (tienes ${Math.round(d.capital)})` };
      d.act.splice(i, 1); d.capital = clamp(d.capital - (o.cap || 0), 0, 100); let msg = ''; try { msg = o.ef(E, J) || ''; } catch (e) { console.error('[dilema]', x.id, e); }
      // Asesores: el que aconsejó esa opción gana confianza; los demás pierden un poco
      for (const a in def.as) { const c = d.asesor[a]; if (def.as[a] === k) c.conf = clamp(c.conf + 4, 0, 100); else c.conf = clamp(c.conf - 1.5, 0, 100); }
      if (o.mem) { d.memoria.unshift({ id: U.id('mm'), t: E.fecha.t, tipo: o.mem.tipo, txt: o.mem.txt, k: o.mem.k || null, pid: o.mem.pid === 'r' ? x.rival : null, ini: o.mem.k ? C.Legado.valor(E, o.mem.k === 'corr' ? 'aprob' : o.mem.k) : null, cobrado: false }); if (d.memoria.length > 40) d.memoria.length = 40; }
      d.hist.unshift({ t: E.fecha.t, txt: `${def.n}: ${o.t}`, res: msg }); if (d.hist.length > 25) d.hist.length = 25; C.Personaje.log(E, `${def.n}: ${o.t}. ${msg}`); return { ok: true, msg };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const d = Dl.asegurar(E), t = E.fecha.t, aj = C.Ajustes ? C.Ajustes.get(E) : { eventos: 1 };
      d.capital = clamp(d.capital + 0.4, 0, 100); Dl.asesores(E);
      // Caducan los dilemas sin decidir: se aplica la opción por defecto
      for (const x of d.act.slice()) if (t >= x.limite) { const def = CAT[x.id], o = def.op[def.defecto]; const cap = o.cap; if (cap) o.cap = 0; const r = Dl.decidir(E, x.uid, o.k); if (cap) o.cap = cap; C.Noticias.poner(E, 'politica', `${J.nombre} deja pasar el plazo en «${def.n.toLowerCase()}» y se impone la inercia.`, 'ES'); d.hist[0] && (d.hist[0].txt += ' (por inacción)'); }
      // Aparece un dilema nuevo
      if (d.act.length < 2 && t - d.ult >= 6 && U.chance(0.07 * aj.eventos)) { const pos = Object.keys(CAT).filter(k => !d.act.some(x => x.id === k) && !d.hist.slice(0, 5).some(h => h.txt.startsWith(CAT[k].n)) && CAT[k].req(E)); const k = U.pick(pos); if (k) Dl.nuevo(E, k); }
      // Hemeroteca: lo que dijiste y lo que hiciste vuelve
      if (U.chance(0.035)) Dl.hemeroteca(E);
      // Asesores quemados filtran
      for (const a in d.asesor) { const c = d.asesor[a]; if (c.conf < 25 && U.chance(0.012)) { c.conf = 35; C.Personaje.cambiar(E, { prestigio: -1.5 }, true); C.Noticias.poner(E, 'politica', `Un asesor descontento de ${J.nombre} filtra discrepancias internas.`, 'ES'); d.hist.unshift({ t, txt: `${c.n} filtra discrepancias`, res: 'Pierdes prestigio.' }); } }
    },
    hemeroteca(E) {
      const d = Dl.asegurar(E), t = E.fecha.t, J = E.jugador, cand = d.memoria.filter(m => !m.cobrado && t - m.t >= 14); if (!cand.length) return null; const m = U.pick(cand); m.cobrado = true; const p = pa(E);
      let txt = '';
      if (m.tipo === 'promesa' && m.ini != null) { const v = C.Legado.valor(E, m.k === 'corr' ? 'aprob' : m.k), bajo = ['alquiler', 'corr'].includes(m.k) ? true : false, cumple = m.k === 'corr' ? v >= m.ini : bajo ? v < m.ini - 1 : v > m.ini + 1; txt = cumple ? `La hemeroteca te sonríe: ${m.txt} y los hechos te dan la razón.` : `Te recuerdan que ${m.txt}: los datos no acompañan.`; C.Personaje.cambiar(E, { prestigio: cumple ? 1.5 : -2.2, pop: cumple ? 0.5 : -0.8 }, true); if (!cumple) C.Opinion.empuje(E, J.partido, -0.03, 0.3); }
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

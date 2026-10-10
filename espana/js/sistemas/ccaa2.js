/* El mundo de las comunidades autónomas, más a fondo: convenios y disputas entre comunidades, delegaciones en el exterior, planes para los municipios y
   la despoblación, impuestos propios (con riesgo ante el Tribunal Constitucional), el Fondo de Liquidez Autonómico, conferencias sectoriales con el Gobierno
   y sucesos propios de quien gobierna una comunidad. Estado: E.esp.cc2 = { conv[], disp[], rel:{par:n}, ext:{c:n}, fla:{c,t,hasta}|null, ult:{clave:t} }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = () => C.Territorio, A = () => C.Art155;
  const TIPOS_CONV = {
    agua: ['💧', 'Pacto del agua', 'Reparto de recursos hídricos y gestión conjunta de cuencas.', 'amb'],
    infra: ['🚄', 'Corredor de infraestructuras', 'Carretera, ferrocarril o puerto compartido.', 'mov'],
    turismo: ['🧳', 'Marca turística conjunta', 'Promoción y rutas compartidas.', 'emp'],
    sanidad: ['🏥', 'Cooperación sanitaria', 'Derivación de pacientes y compra conjunta.', 'sal']
  };
  const IMPUESTOS = { turismo: ['🧳', 'Tasa turística', 0.9], banca: ['🏦', 'Impuesto a los depósitos bancarios', 1.4], fortunas: ['💎', 'Impuesto a las grandes fortunas', 1.6] };
  const nombre = (E, c) => D().ccaa[c].nombre;
  const par = (a, b) => [a, b].sort().join('|');
  const presAut = E => { const J = E.jugador; return J.pais !== 'ES' ? 'Sólo en España' : ['presauto', 'consejero'].includes(J.cargo) && J.region ? true : 'Necesitas un cargo de gobierno autonómico'; };
  const soloPres = E => { const J = E.jugador; return J.pais !== 'ES' ? 'Sólo en España' : J.cargo === 'presauto' && J.region ? true : 'Sólo el presidente/a autonómico/a'; };
  const rcJ = E => E.esp.ccaa[E.jugador.region];
  const aprob = (E, c, d) => { const g = E.esp.ccaa[c].gob; if (g) g.aprob = clamp(g.aprob + d, 5, 90); };
  const gest = (E, c, area, d) => { const rc = E.esp.ccaa[c]; if (rc.gestion && rc.gestion[area] != null) rc.gestion[area] = clamp(rc.gestion[area] + d, 5, 99); };
  const noticia = (E, txt) => C.Noticias.poner(E, 'politica', txt, 'ES', 'aut');
  const Cc = C.Ccaa2 = {
    TIPOS_CONV, IMPUESTOS,
    asegurar(E) { if (!E.esp.cc2) E.esp.cc2 = { conv: [], disp: [], rel: {}, ext: {}, fla: null, ult: {} }; return E.esp.cc2; },
    rel(E, a, b) { const s = Cc.asegurar(E); return s.rel[par(a, b)] != null ? s.rel[par(a, b)] : 50; },
    mover(E, a, b, d) { const s = Cc.asegurar(E), k = par(a, b); s.rel[k] = clamp((s.rel[k] != null ? s.rel[k] : 50) + d, 0, 100); },
    fla(E) { const f = Cc.asegurar(E).fla; return f && E.fecha.t < f.hasta ? f : null; },
    cd(E, clave, sem) { const u = Cc.asegurar(E).ult[clave]; return u != null && E.fecha.t - u < sem ? `Espera ${sem - (E.fecha.t - u)} semana(s)` : true; },
    sello(E, clave) { Cc.asegurar(E).ult[clave] = E.fecha.t; },
    soberanista(E, c) { const rc = E.esp.ccaa[c], conf = D().procesos && D().procesos[c]; return !!(conf && rc.gob && rc.gob.coalicion.some(k => E.partidos[k].indep >= conf.indepMin)); },
    /* Convenio con otra comunidad. */
    convenio(E, c2, tipo) {
      const J = E.jugador, c = J.region, T0 = TIPOS_CONV[tipo]; if (!T0) return { ok: false, msg: 'Elige el tipo de convenio' }; if (!c2 || c2 === c || !E.esp.ccaa[c2] || !E.esp.ccaa[c2].gob) return { ok: false, msg: 'Elige otra comunidad' };
      if (E.esp.ccaa[c2].interv) return { ok: false, msg: 'Esa comunidad está intervenida por el Estado' }; const k = 'conv:' + par(c, c2), cd = Cc.cd(E, k, 52); if (cd !== true) return { ok: false, msg: 'Ya tenéis un convenio reciente: ' + cd };
      const s = Cc.asegurar(E), rc = rcJ(E), g2 = E.esp.ccaa[c2].gob, afin = g2.coalicion.some(x => rc.gob.coalicion.includes(x)), pr = clamp(0.5 + (Cc.rel(E, c, c2) - 50) / 120 + (afin ? 0.25 : 0) + J.atrib.negociacion * 0.03, 0.15, 0.95);
      Cc.sello(E, k); if (!U.chance(pr)) { Cc.mover(E, c, c2, -3); return { ok: true, msg: `${nombre(E, c2)} rechaza el convenio (${Math.round(pr * 100)} % de probabilidades de acuerdo).` }; }
      s.conv.unshift({ a: c, b: c2, tipo, t: E.fecha.t }); if (s.conv.length > 20) s.conv.length = 20; Cc.mover(E, c, c2, 12); aprob(E, c, 1.1); aprob(E, c2, 1.1); gest(E, c, T0[3], 4); gest(E, c2, T0[3], 4);
      if (Cc.soberanista(E, c) && Cc.soberanista(E, c2)) rc.relM = clamp(rc.relM - 2, 0, 100); else if (rc.gob.coalicion.includes(E.paises.ES.gob.partido)) rc.relM = clamp(rc.relM + 1, 0, 100);
      C.Personaje.cambiar(E, { prestigio: 0.8 }, true); noticia(E, `${nombre(E, c)} y ${nombre(E, c2)} firman un convenio: ${T0[1].toLowerCase()}.`);
      return { ok: true, msg: `${T0[1]} con ${nombre(E, c2)}: se aprueba (${Math.round(pr * 100)} % de probabilidades).` };
    },
    /* Bonificación fiscal para atraer empresas: gana la tuya, pierde la vecina. */
    atraer(E, c2) {
      const c = E.jugador.region; if (!c2 || c2 === c || !E.esp.ccaa[c2] || !E.esp.ccaa[c2].gob) return { ok: false, msg: 'Elige de qué comunidad quieres atraer empresas' }; const rc = rcJ(E);
      aprob(E, c, 1.4); aprob(E, c2, -0.8); rc.deuda = clamp(rc.deuda + 1.8, 0, 100); Cc.mover(E, c, c2, -9); C.Personaje.cambiar(E, { pop: 0.8 }, true); noticia(E, `${nombre(E, c)} lanza bonificaciones fiscales y se lleva empresas de ${nombre(E, c2)}.`);
      return { ok: true, msg: `Atraes empresas de ${nombre(E, c2)}: sube tu aprobación, baja la suya y se enfría la relación.` };
    },
    delegacion(E) {
      const J = E.jugador, c = J.region, s = Cc.asegurar(E), n = s.ext[c] || 0, rc = rcJ(E); if (n >= 3) return { ok: false, msg: 'Ya tienes una red completa de delegaciones' };
      s.ext[c] = n + 1; C.Personaje.cambiar(E, { capEU: 2, prestigio: 0.6 }, true); rc.aut = clamp(rc.aut + 0.8, 0, 100); aprob(E, c, 0.5); rc.deuda = clamp(rc.deuda + 0.6, 0, 100); if (Cc.soberanista(E, c)) rc.relM = clamp(rc.relM - 1.5, 0, 100);
      return { ok: true, msg: `Abres una delegación en el exterior (${s.ext[c]}/3): más peso en Bruselas y más proyección de tu comunidad.` };
    },
    municipios(E) {
      const c = E.jugador.region, rc = rcJ(E); let n = 0; for (const k in E.esp.muni.m) { const m = E.esp.muni.m[k]; if (m.ccaa !== c) continue; m.aprob = clamp(m.aprob + (rc.gob.coalicion.includes(m.alcalde) ? 1.4 : 0.5), 20, 85); n++; }
      aprob(E, c, 0.8); rc.deuda = clamp(rc.deuda + 1.5, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.4 }, true); return { ok: true, msg: `Fondo de cooperación local: ${n} ayuntamiento(s) de tu comunidad reciben ayuda (los de tu bloque, más).` };
    },
    despoblacion(E) { const c = E.jugador.region, rc = rcJ(E); aprob(E, c, 1.1); gest(E, c, 'agr', 3); gest(E, c, 'emp', 2); rc.deuda = clamp(rc.deuda + 1.2, 0, 100); C.Personaje.cambiar(E, { pop: 0.5 }, true); return { ok: true, msg: 'Plan contra la despoblación: bonificaciones, servicios y vivienda en el medio rural.' }; },
    pedirFLA(E) {
      const c = E.jugador.region, rc = rcJ(E); if (Cc.fla(E)) return { ok: false, msg: 'Ya estás en el Fondo de Liquidez Autonómico' }; if (rc.deuda < 20) return { ok: false, msg: 'Tu deuda no justifica pedir un rescate de liquidez' };
      Cc.asegurar(E).fla = { c, t: E.fecha.t, hasta: E.fecha.t + 104 }; rc.deuda = clamp(rc.deuda - 10, 0, 100); rc.aut = clamp(rc.aut - 4, 0, 100); rc.relM = clamp(rc.relM - 3, 0, 100); aprob(E, c, -1); C.Personaje.cambiar(E, { prestigio: -1.5 }, true);
      return { ok: true, msg: 'Entras en el Fondo de Liquidez: bajan los intereses y la deuda, pero Hacienda tutela tu política fiscal durante dos años.' };
    },
    impuesto(E, tipo) {
      const c = E.jugador.region, rc = rcJ(E), I = IMPUESTOS[tipo]; if (!I) return { ok: false, msg: 'Elige el impuesto' }; const cd = Cc.cd(E, 'imp:' + tipo, 52); if (cd !== true) return { ok: false, msg: cd };
      Cc.sello(E, 'imp:' + tipo); const izq = rc.gob.coalicion.some(k => E.partidos[k].eco < -10); aprob(E, c, izq ? 1.2 : -1.4); rc.deuda = clamp(rc.deuda - I[2] * 2, 0, 100); C.Personaje.cambiar(E, { pop: izq ? 0.6 : -0.5 }, true);
      E.esp.tc.recursos.push({ fallo: E.fecha.t + 20, titulo: I[1].toLowerCase() + ' de ' + nombre(E, c), cual: 'region', region: c, ter: 12, jugador: true });
      return { ok: true, msg: `Creas el ${I[1].toLowerCase()}: ingresos para tu comunidad; el Gobierno central lo recurrirá ante el Constitucional.` };
    },
    /* El Gobierno convoca una conferencia sectorial con las comunidades. */
    sectorial(E, area) {
      const g = E.paises.ES.gob; let n = 0, enf = 0; for (const c of T().ids()) { const rc = E.esp.ccaa[c]; if (!rc.gob || rc.interv) continue; const afin = rc.gob.coalicion.includes(g.partido); rc.relM = clamp(rc.relM + (afin ? 4 : 2), 0, 100); n++; }
      if (U.chance(0.25)) for (const c of T().ids()) { const rc = E.esp.ccaa[c]; if (rc.gob && !rc.gob.coalicion.includes(g.partido) && U.chance(0.45)) { rc.relM = clamp(rc.relM - 5, 0, 100); enf++; } }
      g.aprob = clamp(g.aprob + 0.2, 5, 90); C.Personaje.cambiar(E, { prestigio: 0.5 }, true); return { ok: true, msg: `Conferencia sectorial${area ? ' de ' + (D().consejerias[area] ? D().consejerias[area].corto.toLowerCase() : area) : ''}: mejora la relación con ${n} comunidades${enf ? `, pero ${enf} gobiernos de la oposición abandonan la mesa` : ''}.` };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const s = Cc.asegurar(E), t = E.fecha.t;
      for (const k in s.rel) { s.rel[k] += (50 - s.rel[k]) * 0.01; }
      if (s.fla && t >= s.fla.hasta) { C.Noticias.poner(E, 'politica', `${nombre(E, s.fla.c)} sale del Fondo de Liquidez Autonómico.`, 'ES', 'aut'); s.fla = null; }
      // La IA también firma convenios entre comunidades afines
      if (t % 26 === 0 && U.chance(0.3)) { const ids = T().ids().filter(c => E.esp.ccaa[c].gob && !E.esp.ccaa[c].interv && !(J.cargo === 'presauto' && c === J.region)), a = U.pick(ids), b = U.pick(ids.filter(x => x !== a)); if (a && b && E.esp.ccaa[a].gob.coalicion.some(k => E.esp.ccaa[b].gob.coalicion.includes(k))) { const tp = U.pick(Object.keys(TIPOS_CONV)); Cc.mover(E, a, b, 10); aprob(E, a, 0.6); aprob(E, b, 0.6); s.conv.unshift({ a, b, tipo: tp, t }); if (s.conv.length > 20) s.conv.length = 20; noticia(E, `${nombre(E, a)} y ${nombre(E, b)} firman un convenio: ${TIPOS_CONV[tp][1].toLowerCase()}.`); } }
    }
  };
  // ── Acciones ──
  const R = (id, nombre, icono, desc, costo, grupo, disp, ejecutar) => { const a = { id, nombre, icono, desc, costo, grupo, disponible: disp, ejecutar }; C.Acciones.registrar(a); if (grupo === 'autonomico') A().protege(a); };
  R('convenio_ccaa', 'Firmar un convenio con otra comunidad', '🤝', 'Agua, infraestructuras, turismo o sanidad: mejora la relación y la gestión de ambas comunidades.', 2, 'autonomico', presAut, (E, a) => Cc.convenio(E, a && a.c2, a && a.tipo));
  R('atraer_empresas', 'Atraer empresas de otra comunidad', '🏭', 'Bonificaciones fiscales para quitarle empresas a una vecina: ganas tú, pierde ella y se enfría la relación.', 1, 'autonomico', soloPres, (E, a) => Cc.atraer(E, a && a.c2));
  R('delegacion_exterior', 'Abrir una delegación en el exterior', '🌍', 'Más peso en Bruselas y proyección exterior de tu comunidad (hasta tres delegaciones).', 2, 'autonomico', soloPres, E => Cc.delegacion(E));
  R('plan_municipios', 'Fondo de cooperación local', '🏘', 'Ayuda a los ayuntamientos de tu comunidad: los de tu bloque ganan más.', 2, 'autonomico', presAut, E => { const c = Cc.cd(E, 'municipios', 26); if (c !== true) return { ok: false, msg: c }; const r = Cc.municipios(E); Cc.sello(E, 'municipios'); return r; });
  R('plan_despoblacion', 'Plan contra la despoblación', '🌾', 'Bonificaciones, servicios y vivienda en el medio rural.', 2, 'autonomico', presAut, E => { const c = Cc.cd(E, 'despob', 26); if (c !== true) return { ok: false, msg: c }; const r = Cc.despoblacion(E); Cc.sello(E, 'despob'); return r; });
  R('pedir_fla', 'Pedir el Fondo de Liquidez Autonómico', '🏦', 'Rescate de liquidez: bajan la deuda y los intereses, pero Hacienda tutela tu política fiscal dos años.', 2, 'autonomico', soloPres, E => Cc.pedirFLA(E));
  R('impuesto_propio', 'Crear un impuesto propio', '🧾', 'Turismo, banca o grandes fortunas: ingresos y apoyo de tu bloque, pero el Gobierno central lo recurrirá ante el Constitucional.', 2, 'autonomico', soloPres, (E, a) => Cc.impuesto(E, a && a.tipo));
  R('conferencia_sectorial', 'Convocar una conferencia sectorial', '🏛', 'Reúnes a los consejeros de todas las comunidades con tu ministro: mejora la relación general (con riesgo de plantón).', 2, 'nacional', E => E.jugador.pais !== 'ES' ? 'Sólo en España' : E.paises.ES.gob.pm === 'J' ? Cc.cd(E, 'sectorial', 13) : 'Sólo el presidente/a del Gobierno', (E, a) => { const r = Cc.sectorial(E, a && a.area); Cc.sello(E, 'sectorial'); return r; });
  // Mientras dura el Fondo de Liquidez, Hacienda tutela la política fiscal
  for (const id of ['politica_fiscal', 'presupuesto_aut', 'impuesto_propio']) { const a = C.Acciones.get(id); if (a && !a.__fla) { a.__fla = true; const d0 = a.disponible; a.disponible = function (E, args) { const f = Cc.fla(E); if (f && E.jugador.region === f.c) return 'Hacienda tutela tu política fiscal mientras estés en el Fondo de Liquidez'; return d0 ? d0.call(this, E, args) : true; }; } }
  // ── Sucesos propios de quien gobierna una comunidad ──
  const ev = o => C.DATA.eventos.push(Object.assign({ peso: 1, cd: 40, req: () => true }, o));
  const gob = (E, J) => ['presauto', 'consejero'].includes(J.cargo) && J.region && E.esp.ccaa[J.region] && E.esp.ccaa[J.region].gob && !E.esp.ccaa[J.region].interv;
  ev({ id: 'tc_anula_ley_aut', titulo: 'El Constitucional anula una ley de tu comunidad', icono: '⚖️', peso: 1.4, cd: 60, req: (E, J) => J.cargo === 'presauto' && gob(E, J),
    texto: (E, J) => `El Tribunal Constitucional anula una ley aprobada por el parlamento de ${nombre(E, J.region)}. Tu base te pide que no cedas; el Gobierno central exige que se cumpla la sentencia.`,
    opciones: [
      { t: 'Acatar la sentencia', ef: (E, J) => { const rc = rcJ(E); aprob(E, J.region, -1); rc.relM = clamp(rc.relM + 1.5, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.8, pop: -0.8 }, true); return 'Acatas el fallo: pierdes algo de tu base, ganas tranquilidad institucional.'; } },
      { t: 'Presentar un recurso de amparo', ef: (E, J) => { const rc = rcJ(E); C.Personaje.cambiar(E, { prestigio: 0.5 }, true); if (U.chance(0.25)) { aprob(E, J.region, 1); return 'El amparo prospera: la ley se salva.'; } rc.relM = clamp(rc.relM - 1, 0, 100); return 'El amparo se rechaza: ganas tiempo y poco más.'; } },
      { t: 'Desacatar: seguir aplicando la ley', ef: (E, J) => { const rc = rcJ(E); rc.desacato = E.fecha.t; C.Personaje.cambiar(E, { pop: 2.5, prestigio: 0.5 }, true); rc.relM = clamp(rc.relM - 4, 0, 100); rc.agravio += 2; return 'Desobedeces al Constitucional: el Gobierno estudia el artículo 155.'; } }] });
  ev({ id: 'requerimiento_hacienda', titulo: 'Hacienda te advierte por el déficit', icono: '💶', peso: 1.6, cd: 52, req: (E, J) => J.cargo === 'presauto' && gob(E, J) && rcJ(E).deuda >= 20,
    texto: (E, J) => `El Ministerio de Hacienda advierte a ${nombre(E, J.region)} de que incumple la regla de gasto y exige un plan de ajuste.`,
    opciones: [
      { t: 'Recortar el gasto', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda - 6, 0, 100); aprob(E, J.region, -2.2); C.Personaje.cambiar(E, { prestigio: 1, pop: -1 }, true); return 'Recortas: baja la deuda y baja tu aprobación.'; } },
      { t: 'Subir los impuestos propios', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda - 4, 0, 100); aprob(E, J.region, -1.5); return 'Subes impuestos: ingresas más y pagas el coste político.'; } },
      { t: 'Pedir el Fondo de Liquidez', ef: (E, J) => { const r = Cc.pedirFLA(E); return r.ok ? r.msg : 'No puedes acogerte al Fondo ahora: la advertencia queda sin respuesta.'; } },
      { t: 'Ignorar la advertencia', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda + 1, 0, 100); rc.relM = clamp(rc.relM - 3, 0, 100); return 'Ignoras a Hacienda: la deuda sigue creciendo y el Gobierno toma nota.'; } }] });
  ev({ id: 'disputa_agua_ccaa', titulo: 'Disputa por el agua con una comunidad vecina', icono: '💧', peso: 1.2, cd: 52, req: (E, J) => gob(E, J) && J.cargo === 'presauto',
    ctx: (E, J) => ({ c2: U.pick(T().ids().filter(c => c !== J.region && E.esp.ccaa[c].gob)) }),
    texto: (E, J, P, x) => `${nombre(E, x.c2)} reclama una parte mayor de los recursos hídricos que compartís. La opinión pública de tu comunidad está muy sensibilizada.`,
    opciones: [
      { t: 'Defender tus recursos con firmeza', ef: (E, J, P, x) => { aprob(E, J.region, 1.2); aprob(E, x.c2, -0.6); Cc.mover(E, J.region, x.c2, -10); return 'Defiendes lo tuyo: tu base aplaude y la vecina se enfada.'; } },
      { t: 'Ofrecer un pacto del agua', ef: (E, J, P, x) => { const r = Cc.convenio(E, x.c2, 'agua'); return r.msg; } },
      { t: 'Pedir el arbitraje de Moncloa', ef: (E, J, P, x) => { const rc = rcJ(E); rc.relM = clamp(rc.relM + 1, 0, 100); aprob(E, J.region, -0.4); return 'Pides arbitraje al Estado: pierdes algo de autonomía, ganas tiempo.'; } }] });
  ev({ id: 'fuga_empresa', titulo: 'Una gran empresa amenaza con marcharse', icono: '🏭', peso: 1.2, cd: 40, req: (E, J) => gob(E, J),
    texto: (E, J) => `La mayor empresa de ${nombre(E, J.region)} amenaza con trasladar su sede a otra comunidad si no obtiene ventajas.`,
    opciones: [
      { t: 'Ofrecer una subvención', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda + 2, 0, 100); aprob(E, J.region, 0.6); return 'La empresa se queda, a costa del erario.'; } },
      { t: 'Bonificación fiscal', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda + 1, 0, 100); aprob(E, J.region, 0.5); const c2 = U.pick(T().ids().filter(c => c !== J.region && E.esp.ccaa[c].gob)); if (c2) Cc.mover(E, J.region, c2, -4); return 'La empresa se queda con una rebaja fiscal.'; } },
      { t: 'Dejar que se marche', ef: (E, J) => { aprob(E, J.region, -1.8); C.Personaje.cambiar(E, { pop: -0.8 }, true); return 'La empresa se va: un golpe a tu imagen económica.'; } }] });
  ev({ id: 'crisis_policial_aut', titulo: 'Malestar en la policía autonómica', icono: '👮', peso: 1.1, cd: 52, req: (E, J) => gob(E, J) && J.cargo === 'presauto' && rcJ(E).comp.pol >= 1,
    texto: () => 'Los sindicatos de la policía autonómica denuncian falta de efectivos y amenazan con movilizaciones.',
    opciones: [
      { t: 'Ampliar la plantilla', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda + 1.5, 0, 100); aprob(E, J.region, 1); return 'Amplías la plantilla: se calma el malestar.'; } },
      { t: 'Negociar mejoras salariales', ef: (E, J) => { const rc = rcJ(E); rc.deuda = clamp(rc.deuda + 0.8, 0, 100); aprob(E, J.region, 0.4); return 'Cierras un acuerdo salarial.'; } },
      { t: 'Mantener la política actual', ef: (E, J) => { aprob(E, J.region, -1); return 'No cedes: crece el malestar.'; } }] });
  ev({ id: 'alarma_despoblacion', titulo: 'Alarma por la despoblación', icono: '🌾', peso: 1, cd: 52, req: (E, J) => gob(E, J) && J.cargo === 'presauto' && E.fecha.t > 20,
    texto: (E, J) => `Los últimos datos muestran que decenas de municipios de ${nombre(E, J.region)} pierden población y servicios.`,
    opciones: [
      { t: 'Lanzar un plan contra la despoblación', ef: (E, J) => Cc.despoblacion(E).msg },
      { t: 'Pedir fondos europeos al Gobierno', ef: (E, J) => { const rc = rcJ(E); rc.relM = clamp(rc.relM + 1, 0, 100); aprob(E, J.region, 0.4); return 'Reclamas fondos europeos: parte de la ayuda llegará.'; } },
      { t: 'Esperar a que pase el titular', ef: (E, J) => { aprob(E, J.region, -0.6); return 'El problema sigue ahí.'; } }] });
  C.Tiempo.registrar('ccaa2', { turno: Cc.turno }, 35);
})(window.ESP);

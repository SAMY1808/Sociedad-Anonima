/* Artículo 155 de la Constitución, contra cualquier comunidad autónoma: requerimiento al presidente autonómico → respuesta (atiende, prórroga, recurso ante el
   Tribunal Constitucional o desafío) → autorización del Senado por mayoría absoluta → medidas a elegir (control de funciones, cese y gestión directa o disolución
   del parlamento) → intervención con sus consecuencias → fin. Lo juega el Gobierno (presidente/a) y también el presidente/a autonómico/a requerido/a.
   Estado: E.esp.a155 = { p:{ c: proceso }, hist[], ult:{ c: t } } y rc.interv = { nivel, t, hasta, motivo } mientras dura la intervención. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = () => C.Territorio;
  const MOTIVOS = {
    proces: { ic: '🗳️', n: 'Desafío institucional: consulta o declaración unilateral', art: 'atentar gravemente contra el interés general de España' },
    desacato: { ic: '⚖️', n: 'Desacato a una sentencia del Tribunal Constitucional', art: 'incumplir las obligaciones que la Constitución y las leyes le imponen' },
    fiscal: { ic: '💶', n: 'Incumplimiento grave de la estabilidad presupuestaria', art: 'incumplir las obligaciones que las leyes le imponen' },
    corrupcion: { ic: '🕵️', n: 'Colapso institucional por corrupción', art: 'atentar gravemente contra el interés general de España' },
    emergencia: { ic: '🚨', n: 'Abandono de sus obligaciones en una emergencia', art: 'incumplir las obligaciones que las leyes le imponen' },
    interes: { ic: '🏴', n: 'Actuación contraria al interés general', art: 'atentar gravemente contra el interés general de España' }
  };
  const NIVELES = {
    suave: { ic: '🧾', n: 'Control de funciones', d: 'Hacienda y seguridad pasan a tutela del Estado; el Gobierno regional sigue en su puesto y no puede tocar la política fiscal.', sem: 26, rel: -10, ind: 1.2, agr: 2.5, apr: 0.8, estab: 1, cap: 30 },
    media: { ic: '🏛', n: 'Cese del Gobierno regional y gestión directa', d: 'El Estado cesa al presidente y a los consejeros y gestiona la comunidad; el parlamento sigue reunido y el Gobierno regional pierde todos sus poderes.', sem: 39, rel: -18, ind: 3.5, agr: 5, apr: 1.4, estab: 2, cap: 22 },
    dura: { ic: '⛔', n: 'Disolución del parlamento y elecciones', d: 'Se suspende la autonomía: se disuelve el parlamento autonómico y se convocan elecciones a las seis semanas.', sem: 26, rel: -25, ind: 5, agr: 7, apr: 1.5, estab: 4, cap: 15 }
  };
  const BLOQUEO_SUAVE = ['politica_fiscal', 'presupuesto_aut', 'reclamar_fondos', 'negociar_financiacion', 'pedir_fla', 'impuesto_propio'];
  const nombre = (E, c) => D().ccaa[c].nombre;
  const pm = E => E.paises.ES.gob.pm === 'J';
  const presNombre = (E, c) => { const g = E.esp.ccaa[c].gob, p = g && E.politicos[g.pres]; return g && g.pres === 'J' ? E.jugador.nombre : p ? p.n : 'el presidente autonómico'; };
  const esPresJ = (E, c) => { const J = E.jugador, g = E.esp.ccaa[c].gob; return !!(J && J.pais === 'ES' && J.cargo === 'presauto' && J.region === c && g && g.pres === 'J'); };
  const noticia = (E, txt) => C.Noticias.poner(E, 'politica', txt, 'ES', 'central');

  const A = C.Art155 = {
    MOTIVOS, NIVELES,
    asegurar(E) { if (!E.esp.a155) E.esp.a155 = { p: {}, hist: [], ult: {} }; return E.esp.a155; },
    proceso(E, c) { const p = A.asegurar(E).p[c]; return p && p.fase !== 'cerrada' ? p : null; },
    activos(E) { return Object.values(A.asegurar(E).p).filter(p => p.fase !== 'cerrada'); },
    nota(E, p, txt) { p.hist.unshift({ t: E.fecha.t, txt }); if (p.hist.length > 12) p.hist.length = 12; },
    /* Qué tan sólido es cada motivo en una comunidad (0-1): el Senado, la opinión y el Tribunal lo tienen en cuenta. */
    legit(E, c, motivo) {
      const rc = E.esp.ccaa[c], t = E.fecha.t;
      if (motivo === 'proces') { const pr = E.esp.procesos && E.esp.procesos[c]; return pr ? ({ unilateral: 0.95, dui: 1, tension: 0.5, '155': 0.8 }[pr.fase] || 0.1) : 0.05; }
      if (motivo === 'desacato') return rc.desacato != null && t - rc.desacato <= 52 ? 0.9 : 0.08;
      if (motivo === 'fiscal') return clamp((rc.deuda - 18) / 25, 0.05, 0.9);
      if (motivo === 'corrupcion') { const g = rc.gob; const n = C.Corrupcion && g ? C.Corrupcion.asegurar(E).casos.filter(x => g.coalicion.includes(x.pid) && x.fase !== 'cerrado').length : 0; return clamp(0.08 + 0.22 * n, 0.05, 0.8); }
      if (motivo === 'emergencia') { const cv = E.esp.cv && E.esp.cv.hist.find(h => h.a === 'aut' && h.lugar === nombre(E, c) && t - h.t <= 26 && h.V < -0.25); return cv ? 0.75 : 0.08; }
      return clamp(0.1 + (rc.relM < 20 ? 0.15 : 0) + (rc.indep > 25 ? 0.15 : 0), 0.05, 0.4);
    },
    mejorMotivo(E, c) { let m = null, v = -1; for (const k in MOTIVOS) { const l = A.legit(E, c, k); if (l > v) { v = l; m = k; } } return { motivo: m, legit: v }; },
    /* Reparto del Senado: quién votaría a favor, en contra o duda. */
    senado(E, c, p) {
      const S = E.esp.senado, g = E.paises.ES.gob, rc = E.esp.ccaa[c], L = p ? p.legit : A.mejorMotivo(E, c).legit, out = []; let si = 0, no = 0;
      for (const pid in S.escanos) {
        const n = S.escanos[pid], q = E.partidos[pid]; if (!q || !n) continue; const socio = g.coalicion.includes(pid) || (g.apoyoExterno || []).includes(pid), afectado = rc.gob && rc.gob.coalicion.includes(pid);
        let voto = afectado ? 'no' : socio ? (q.ter < 15 ? 'si' : 'no') : (q.ter < -15 && q.indep < 0.2 ? 'si' : q.ter < 5 && q.indep < 0.3 ? 'duda' : 'no');
        if (voto === 'duda') voto = L >= 0.6 ? 'si' : 'no'; if (p && p.neg && p.neg[pid] && !afectado) voto = 'si';
        if (voto === 'si') si += n; else no += n; out.push({ pid, n, voto });
      }
      return { si, no, mayoria: S.mayoria, ok: si >= S.mayoria, partidos: out.sort((a, b) => b.n - a.n) };
    },
    puede(E, c) {
      const rc = E.esp.ccaa[c]; if (!rc || !rc.gob) return 'Comunidad desconocida'; if (A.proceso(E, c)) return 'Ya hay un procedimiento abierto en esa comunidad'; if (rc.suspendida || rc.interv) return 'La comunidad ya está intervenida';
      if (E.esp.cortes.estado !== 'activa') return 'Con las Cortes disueltas no se puede tramitar el artículo 155'; const u = A.asegurar(E).ult[c]; if (u != null && E.fecha.t - u < 52) return 'Hace menos de un año que se cerró el último procedimiento en esa comunidad';
      if (A.activos(E).length >= 2) return 'No pueden tramitarse más de dos procedimientos a la vez'; return true;
    },
    /* 1. El Gobierno requiere al presidente autonómico. */
    requerir(E, c, motivo, jugador) {
      const r = A.puede(E, c); if (r !== true) return { ok: false, msg: r }; if (!MOTIVOS[motivo]) return { ok: false, msg: 'Elige un motivo' };
      const rc = E.esp.ccaa[c], a = A.asegurar(E), t = E.fecha.t, L = A.legit(E, c, motivo);
      const p = a.p[c] = { c, motivo, fase: 'requerimiento', t0: t, plazo: t + 4, resp: null, nivel: null, neg: {}, hist: [], legit: L, jugador: !!jugador };
      rc.relM = clamp(rc.relM - 8, 0, 100); rc.agravio += 2; A.nota(E, p, `Requerimiento formal por «${MOTIVOS[motivo].n.toLowerCase()}».`);
      noticia(E, `El Gobierno requiere formalmente a ${presNombre(E, c)} (artículo 155): ${MOTIVOS[motivo].n.toLowerCase()} en ${nombre(E, c)}.`);
      if (esPresJ(E, c) && C.Dilemas) { const x = C.Dilemas.nuevo(E, 'requerimiento155'); if (x) { x.c = c; x.limite = p.plazo; } }
      return { ok: true, msg: `Requieres a ${presNombre(E, c)}: tiene hasta el ${U.fmtT(p.plazo, true)} para atenderte. Solidez del motivo: ${Math.round(L * 100)} %.`, p };
    },
    respuestaIA(E, c, p) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, conf = D().procesos && D().procesos[c], indep = rc.gob.coalicion.some(k => E.partidos[k].indep >= (conf ? conf.indepMin : 0.5)), afin = rc.gob.coalicion.includes(g.partido);
      const pa = clamp(0.5 - (indep ? 0.4 : 0) + (rc.relM - 40) / 160 + p.legit * 0.25 + (afin ? 0.35 : 0), 0.04, 0.95), r = U.rf(0, 1);
      return r < pa ? 'atiende' : r < pa + (1 - pa) * 0.55 ? 'recurre' : 'desafia';
    },
    /* 2. Respuesta del presidente autonómico. */
    responder(E, c, resp) {
      const p = A.proceso(E, c); if (!p || p.fase !== 'requerimiento') return null; const rc = E.esp.ccaa[c], g = E.paises.ES.gob, t = E.fecha.t, who = presNombre(E, c); p.resp = resp;
      if (resp === 'negocia' && !p.prorroga) { p.prorroga = true; p.plazo += 3; p.resp = null; A.nota(E, p, `${who} pide una prórroga de tres semanas.`); return 'prorroga'; }
      if (resp === 'negocia') resp = 'desafia';
      if (resp === 'atiende') { A.cerrar(E, c, 'atendido', `${who} atiende el requerimiento: se cierra el procedimiento del artículo 155 en ${nombre(E, c)}.`); rc.relM = clamp(rc.relM + 4, 0, 100); g.aprob = clamp(g.aprob + 0.6, 5, 90); return 'atiende'; }
      if (resp === 'recurre') { p.fase = 'tc'; p.tcFallo = t + 8; A.nota(E, p, `${who} recurre ante el Tribunal Constitucional.`); noticia(E, `${who} recurre ante el Tribunal Constitucional el requerimiento del artículo 155.`); return 'recurre'; }
      p.fase = 'espera'; p.limite = t + 10; rc.indep = clamp(rc.indep + 0.8, 0, 100); A.nota(E, p, `${who} desafía el requerimiento.`); noticia(E, `${who} desoye el requerimiento del Gobierno: el artículo 155 queda a un paso.`);
      if (!pm(E)) p.ia = true; return 'desafia';
    },
    /* 3. El Gobierno pide la autorización del Senado. */
    negociarSenado(E, c, pid) {
      const p = A.proceso(E, c); if (!p || p.fase !== 'espera') return { ok: false, msg: 'No es el momento de negociar con el Senado' }; const q = E.partidos[pid]; if (!q) return { ok: false, msg: 'Elige un partido' };
      if (p.neg[pid] != null) return { ok: false, msg: 'Ya has hablado con ese grupo' }; const J = E.jugador, s = A.senado(E, c, p), v = s.partidos.find(x => x.pid === pid); if (!v) return { ok: false, msg: 'Ese partido no tiene senadores' }; if (E.esp.ccaa[c].gob.coalicion.includes(pid)) return { ok: false, msg: 'Ese grupo gobierna en la comunidad: no te va a apoyar' };
      if (v.voto === 'si') return { ok: false, msg: 'Ese grupo ya va a votar a favor' };
      const pr = clamp(0.3 + J.atrib.negociacion * 0.04 + p.legit * 0.25 - Math.max(0, q.ter + 10) / 120 - q.indep * 0.25, 0.05, 0.9);
      if (U.chance(pr)) { p.neg[pid] = true; if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, 4); A.nota(E, p, `${q.sigla} se compromete a votar a favor.`); return { ok: true, msg: `${q.sigla} votará a favor del 155 (probabilidad de acuerdo: ${Math.round(pr * 100)} %).` }; }
      p.neg[pid] = false; if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, -3); return { ok: true, msg: `${q.sigla} se niega: no apoyará el 155 (probabilidad de acuerdo: ${Math.round(pr * 100)} %).` };
    },
    autorizacion(E, c) {
      const p = A.proceso(E, c); if (!p || p.fase !== 'espera') return { ok: false, msg: 'Primero hay que requerir y esperar la respuesta' }; const g = E.paises.ES.gob, rc = E.esp.ccaa[c], s = A.senado(E, c, p); p.si = s.si;
      if (!s.ok) { A.cerrar(E, c, 'rechazado', `El Senado rechaza autorizar el artículo 155 en ${nombre(E, c)} (${s.si} votos a favor; hacían falta ${s.mayoria}).`); g.aprob = clamp(g.aprob - 2.5, 5, 90); g.estab = clamp(g.estab - 4, 0, 100); rc.relM = clamp(rc.relM + 5, 0, 100); rc.indep = clamp(rc.indep - 0.5, 0, 100); if (pm(E)) C.Personaje.cambiar(E, { prestigio: -3 }, true); return { ok: true, aprobado: false, msg: `El Senado no lo autoriza: ${s.si} votos de ${s.mayoria} necesarios. Fracaso político del Gobierno.`, s }; }
      p.fase = 'autorizada'; p.limiteMed = E.fecha.t + 4; A.nota(E, p, `El Senado autoriza el artículo 155 (${s.si} votos).`); noticia(E, `El Senado autoriza al Gobierno a aplicar el artículo 155 en ${nombre(E, c)} (${s.si} votos a favor).`);
      if (!pm(E)) A.aplicar(E, c, A.nivelIA(E));
      return { ok: true, aprobado: true, msg: `El Senado autoriza el 155 (${s.si} votos). Elige ahora las medidas.`, s };
    },
    nivelIA(E) { const m = E.politicos[E.paises.ES.gob.pm], ter = m ? m.ter : 0; return ter < -35 ? 'dura' : ter < -10 ? 'media' : 'suave'; },
    /* 4. Medidas. */
    aplicar(E, c, nivel) {
      const p = A.proceso(E, c), N = NIVELES[nivel]; if (!p || p.fase !== 'autorizada') return { ok: false, msg: 'Falta la autorización del Senado' }; if (!N) return { ok: false, msg: 'Elige las medidas' };
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, t = E.fecha.t, L = p.legit, conf = D().procesos && D().procesos[c], sob = conf || rc.indep > 8;
      rc.interv = { nivel, t, hasta: t + N.sem, motivo: p.motivo }; p.fase = 'intervenida'; p.nivel = nivel; p.hasta = t + N.sem;
      rc.relM = clamp(rc.relM + N.rel, 0, 100); rc.agravio += N.agr * (1.2 - L * 0.6); if (sob) rc.indep = clamp(rc.indep + N.ind * (1.3 - L * 0.6), 0, 100); rc.concesiones.push({ t, v: N.agr * 0.8, d: 'Artículo 155 (' + N.n.toLowerCase() + ')' });
      g.aprob = clamp(g.aprob + N.apr * (L * 2.2 - 0.5), 5, 90); g.estab = clamp(g.estab + N.estab * (L - 0.3) * 2, 0, 100);
      if (nivel === 'media' && rc.gob) rc.gob.estab = Math.max(5, rc.gob.estab - 15);
      if (nivel === 'dura') { rc.suspendida = { t, hasta: t + N.sem }; rc.parl.proxT = t + 6; for (const k of ['ES_UPC', 'ES_VAP']) if (E.partidos[k]) E.partidos[k].pop += 0.25; C.Opinion.normalizarES(E); if (E.esp.procesos && E.esp.procesos[c] && T().procesFase) T().procesFase(E, c, '155', 'Se abre una etapa de intervención del Estado.'); }
      A.nota(E, p, `Se aplican las medidas: ${N.n.toLowerCase()}.`); noticia(E, `El Gobierno aplica el artículo 155 en ${nombre(E, c)}: ${N.n.toLowerCase()}.`);
      if (esPresJ(E, c)) { C.Personaje.cambiar(E, { prestigio: -3, pop: nivel === 'suave' ? 0 : 2 }, true); C.Personaje.log(E, `El Estado interviene ${nombre(E, c)} (artículo 155): ${N.n.toLowerCase()}.`); }
      if (pm(E)) { C.Personaje.cambiar(E, { prestigio: (L - 0.45) * 4, pop: (L - 0.45) * 2 }, true); if (C.Dilemas) { C.Dilemas.registrar(E, '155', `Artículo 155 en ${nombre(E, c)}: ${N.n.toLowerCase()}`, Math.round((L - 0.45) * 9) / 2); C.Dilemas.asegurar(E).memoria.unshift({ id: U.id('mm'), t, tipo: 'crisis', txt: `aplicaste el artículo 155 en ${nombre(E, c)}`, bien: L >= 0.5, cobrado: false }); } }
      return { ok: true, msg: `Aplicas el 155 en ${nombre(E, c)}: ${N.n.toLowerCase()} durante ${N.sem} semanas.` };
    },
    /* Intervenciones que se aplicaron por la vía antigua (el Consejo de Ministros ante un desafío unilateral). */
    registrarExterna(E, c, nivel, motivo) {
      const a = A.asegurar(E), N = NIVELES[nivel], rc = E.esp.ccaa[c], t = E.fecha.t; const p = a.p[c] = { c, motivo, fase: 'intervenida', t0: t, plazo: t, resp: 'desafia', nivel, neg: {}, hist: [], legit: A.legit(E, c, motivo), jugador: pm(E), hasta: t + N.sem };
      rc.interv = { nivel, t, hasta: t + N.sem, motivo }; A.nota(E, p, `El Senado autoriza el artículo 155 y el Gobierno interviene la comunidad (${N.n.toLowerCase()}).`); return p;
    },
    cerrar(E, c, res, txt) {
      const a = A.asegurar(E), p = a.p[c]; if (!p) return; p.fase = 'cerrada'; p.res = res; p.fin = E.fecha.t; a.ult[c] = E.fecha.t; A.nota(E, p, txt || res); a.hist.unshift({ c, motivo: p.motivo, nivel: p.nivel || null, res, t0: p.t0, fin: E.fecha.t, legit: p.legit }); if (a.hist.length > 20) a.hist.length = 20;
      const rc = E.esp.ccaa[c]; if (rc && rc.interv) rc.interv = null; if (txt) noticia(E, txt);
    },
    finInterv(E, c) {
      const p = A.proceso(E, c), rc = E.esp.ccaa[c]; if (!p) return; rc.relM = Math.max(rc.relM, 18); A.cerrar(E, c, 'finalizada', `Termina la intervención del Estado en ${nombre(E, c)}: se recuperan las instituciones autonómicas.`);
    },
    levantar(E, c) {
      const p = A.proceso(E, c); if (!p || p.fase !== 'intervenida') return { ok: false, msg: 'No hay una intervención en esa comunidad' }; const rc = E.esp.ccaa[c], g = E.paises.ES.gob;
      if (rc.suspendida) rc.suspendida.hasta = E.fecha.t; rc.relM = clamp(rc.relM + 10, 0, 100); rc.indep = clamp(rc.indep - 0.6, 0, 100); g.aprob = clamp(g.aprob + (p.legit >= 0.5 ? -0.3 : 0.5), 5, 90);
      A.finInterv(E, c); return { ok: true, msg: `Levantas antes de plazo la intervención en ${nombre(E, c)}: se distiende la relación.` };
    },
    retirar(E, c) {
      const p = A.proceso(E, c); if (!p || !['requerimiento', 'tc', 'espera', 'autorizada'].includes(p.fase)) return { ok: false, msg: 'No hay nada que retirar' }; const rc = E.esp.ccaa[c];
      A.cerrar(E, c, 'retirado', `El Gobierno retira el procedimiento del artículo 155 en ${nombre(E, c)}.`); rc.relM = clamp(rc.relM + 5, 0, 100); E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob - 0.5, 5, 90); return { ok: true, msg: 'Retiras el procedimiento.' };
    },
    /* El presidente autonómico intervenido resiste. */
    resistir(E) {
      const J = E.jugador, c = J.region, rc = E.esp.ccaa[c], p = A.proceso(E, c); if (!p || p.fase !== 'intervenida') return { ok: false, msg: 'Tu comunidad no está intervenida' }; const s = p.resist = p.resist || { t: -99 }; if (E.fecha.t - s.t < 6) return { ok: false, msg: 'Espera unas semanas antes de volver a movilizar' };
      s.t = E.fecha.t; const sob = !!(D().procesos && D().procesos[c]) || rc.indep > 8; C.Personaje.cambiar(E, { pop: 2.2, prestigio: sob ? 1.5 : -1 }, true); rc.relM = clamp(rc.relM - 2, 0, 100); if (sob) rc.indep = clamp(rc.indep + 0.9, 0, 100); rc.agravio += 1.5;
      let extra = ''; if (U.chance(0.2)) { rc.desacato = E.fecha.t; C.Personaje.cambiar(E, { prestigio: -2.5 }, true); extra = ' La Fiscalía abre diligencias por desobediencia.'; }
      return { ok: true, msg: 'Movilizas a la calle y a las instituciones contra la intervención.' + extra };
    },
    bloqueoAccion(E, a) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || !['presauto', 'consejero'].includes(J.cargo) || !J.region) return null; const rc = E.esp.ccaa[J.region], iv = rc && rc.interv; if (!iv) return null;
      if (iv.nivel === 'suave') return BLOQUEO_SUAVE.includes(a.id) ? 'La política fiscal de tu comunidad está bajo tutela del Estado (artículo 155)' : null; return 'Tu comunidad está intervenida por el Estado (artículo 155): no tienes poderes';
    },
    protege(a) { if (!a || a.__155) return; const d0 = a.disponible; a.__155 = true; a.disponible = function (E, args) { const b = A.bloqueoAccion(E, a); if (b) return b; return d0 ? d0.call(this, E, args) : true; }; },
    /* Línea de estado para el Centro de mando. */
    resumen(E) {
      const act = A.activos(E); if (!act.length) return null; const p = act[0], FA = { requerimiento: 'requerimiento enviado', tc: 'recurso ante el TC', espera: 'a la espera del Senado', autorizada: 'autorizado por el Senado', intervenida: 'intervención en marcha' }[p.fase];
      return { c: p.c, txt: `Artículo 155 en ${nombre(E, p.c)}: ${FA}` };
    },
    /* ── Turno ── */
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const a = A.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob;
      for (const p of A.activos(E)) {
        const c = p.c, rc = E.esp.ccaa[c];
        if (p.fase === 'requerimiento' && t >= p.plazo) { if (!p.resp) { if (esPresJ(E, c) && C.Dilemas && C.Dilemas.asegurar(E).act.some(x => x.id === 'requerimiento155')) continue; A.responder(E, c, A.respuestaIA(E, c, p)); } }
        else if (p.fase === 'tc' && t >= p.tcFallo) {
          const pr = clamp(0.3 + p.legit * 0.55 + E.esp.tc.sesgo * 0.1, 0.05, 0.9);
          if (U.chance(pr)) { p.fase = 'espera'; p.limite = t + 10; A.nota(E, p, 'El Constitucional da la razón al Gobierno.'); noticia(E, `El Tribunal Constitucional avala el requerimiento del artículo 155 a ${nombre(E, c)}.`); }
          else { A.cerrar(E, c, 'anulado', `El Tribunal Constitucional da la razón a ${nombre(E, c)} frente al requerimiento del artículo 155.`); g.aprob = clamp(g.aprob - 2, 5, 90); g.estab = clamp(g.estab - 2, 0, 100); rc.relM = clamp(rc.relM + 4, 0, 100); }
        } else if (p.fase === 'espera') {
          if (!pm(E) && !p.iaDecidio) { p.iaDecidio = true; const m = E.politicos[g.pm], ter = m ? m.ter : 0; if (U.chance(clamp(0.25 + (-ter) / 150 + p.legit * 0.45, 0.05, 0.85))) A.autorizacion(E, c); else A.cerrar(E, c, 'archivado', `El Gobierno archiva el procedimiento del artículo 155 en ${nombre(E, c)}.`); }
          else if (t >= p.limite) A.cerrar(E, c, 'archivado', `Caduca el requerimiento del artículo 155 a ${nombre(E, c)}: el Gobierno no pidió la autorización del Senado.`);
        } else if (p.fase === 'autorizada' && t >= p.limiteMed) { A.aplicar(E, c, pm(E) ? 'suave' : A.nivelIA(E)); }
        else if (p.fase === 'intervenida') {
          const N = NIVELES[p.nivel] || NIVELES.dura; if (rc.interv) { rc.relM = Math.min(rc.relM, N.cap); const sob = (D().procesos && D().procesos[c]) || rc.indep > 8; if (sob) rc.indep = clamp(rc.indep + N.ind * 0.012, 0, 100); rc.agravio += 0.05; }
          if (t >= p.hasta || (p.nivel === 'dura' && !rc.suspendida)) A.finInterv(E, c);
        }
      }
      // El Gobierno de la IA puede abrir procedimientos por su cuenta cuando el motivo es muy sólido
      if (!pm(E) && t % 13 === 0 && A.activos(E).length === 0 && E.esp.cortes.estado === 'activa') { const m = E.politicos[g.pm], ter = m ? m.ter : 0;
        for (const c of T().ids()) { const rc = E.esp.ccaa[c]; if (!rc.gob || rc.gob.coalicion.includes(g.partido) || A.puede(E, c) !== true) continue; for (const k of ['desacato', 'fiscal', 'corrupcion', 'emergencia']) { if (A.legit(E, c, k) >= 0.7 && U.chance(0.25 + (-ter) / 250)) { A.requerir(E, c, k, false); break; } } if (A.activos(E).length) break; } }
    }
  };
  // La vía antigua (el Consejo de Ministros ante un desafío unilateral) queda reflejada en el mismo registro
  if (C.Territorio && C.Territorio.aplicar155) { const f0 = C.Territorio.aplicar155; C.Territorio.aplicar155 = function (E, c, forzado) { const r = f0.apply(this, arguments); if (r && r.ok) A.registrarExterna(E, c, 'dura', 'proces'); return r; }; }
  // Acciones del Gobierno y del presidente autonómico intervenido
  const R = (id, nombre, icono, desc, costo, grupo, disp, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo, disponible: disp, ejecutar });
  const soyPM = E => E.jugador.pais !== 'ES' ? 'Sólo en España' : pm(E) ? true : 'Sólo el presidente/a del Gobierno';
  R('requerir_155', 'Requerir a una comunidad (artículo 155)', '⚖️', 'Primer paso del 155: requieres formalmente al presidente autonómico. Si no te atiende, podrás pedir la autorización del Senado.', 2, 'nacional', soyPM, (E, a) => A.requerir(E, a && a.c, a && a.motivo, true));
  R('negociar_senado_155', 'Negociar el apoyo del Senado al 155', '🤝', 'Habla con un grupo del Senado para que vote a favor del artículo 155.', 1, 'nacional', soyPM, (E, a) => A.negociarSenado(E, a && a.c, a && a.pid));
  R('autorizacion_155', 'Pedir la autorización del Senado (155)', '🏛', 'Votación por mayoría absoluta. Si fracasa, el golpe político es serio.', 2, 'nacional', soyPM, (E, a) => A.autorizacion(E, a && a.c));
  R('medidas_155', 'Aplicar las medidas del 155', '⛔', 'Con la autorización del Senado: control de funciones, cese del Gobierno regional o disolución del parlamento.', 2, 'nacional', soyPM, (E, a) => A.aplicar(E, a && a.c, a && a.nivel));
  R('levantar_155', 'Levantar la intervención', '🕊', 'Pones fin a la intervención antes de plazo: se distiende la relación con la comunidad.', 1, 'nacional', soyPM, (E, a) => A.levantar(E, a && a.c));
  R('retirar_155', 'Retirar el procedimiento del 155', '↩️', 'Renuncias a seguir con el artículo 155 en esa comunidad.', 0, 'nacional', soyPM, (E, a) => A.retirar(E, a && a.c));
  R('resistir_155', 'Resistir la intervención', '✊', 'Movilizas la calle y las instituciones contra el 155: popularidad al alza, pero más tensión y riesgo judicial.', 2, 'autonomico', E => { const J = E.jugador; if (J.pais !== 'ES' || J.cargo !== 'presauto') return 'Sólo el presidente/a autonómico/a'; const p = J.region && A.proceso(E, J.region); return p && p.fase === 'intervenida' ? true : 'Tu comunidad no está intervenida'; }, E => A.resistir(E));
  // Protección de las acciones autonómicas ya registradas: no se pueden usar durante la intervención
  for (const a of C.Acciones.lista('autonomico')) if (a.id !== 'resistir_155') A.protege(a);
  // Dilema del presidente autonómico requerido
  C.Dilemas.CAT.requerimiento155 = {
    ic: '⚖️', n: 'El Gobierno te requiere por el artículo 155', req: () => false, plazo: 4, defecto: 3,
    txt: (E, x) => { const p = x.c && A.proceso(E, x.c); return `El Gobierno central te requiere formalmente por «${p ? MOTIVOS[p.motivo].n.toLowerCase() : 'incumplimiento'}». Si no lo atiendes, pedirá al Senado autorización para intervenir ${x.c ? nombre(E, x.c) : 'tu comunidad'}.`; },
    op: [
      { k: 'atender', t: 'Atender el requerimiento', d: 'Cierras el expediente; parte de tu base lo vive como una rendición.', ef: (E, J, x) => { A.responder(E, x.c, 'atiende'); C.Personaje.cambiar(E, { prestigio: 0.5, pop: -1.5 }, true); return 'Atiendes el requerimiento: se cierra el expediente.'; } },
      { k: 'negociar', t: 'Pedir una prórroga y negociar', d: 'Ganas tres semanas; si no cedes, el Gobierno seguirá adelante.', cap: 6, ef: (E, J, x) => { const r = A.responder(E, x.c, 'negocia'); if (r === 'prorroga') { const p = A.proceso(E, x.c); if (p && C.Dilemas) { const y = C.Dilemas.nuevo(E, 'requerimiento155'); if (y) { y.c = x.c; y.limite = p.plazo; } } } return 'Consigues una prórroga de tres semanas.'; } },
      { k: 'recurrir', t: 'Recurrir ante el Tribunal Constitucional', d: 'La vía legal: retrasa el 155, pero el Constitucional puede darte la razón o no.', cap: 4, ef: (E, J, x) => { A.responder(E, x.c, 'recurre'); C.Personaje.cambiar(E, { prestigio: 1 }, true); return 'Presentas un recurso ante el Tribunal Constitucional.'; } },
      { k: 'desafiar', t: 'Desafiar al Gobierno', d: 'Tu base aplaude, pero te expones a la intervención del Estado.', ef: (E, J, x) => { A.responder(E, x.c, 'desafia'); C.Personaje.cambiar(E, { pop: 2.5, prestigio: 1 }, true); return 'Desoyes el requerimiento: el Gobierno decidirá si va al Senado.'; }, mem: { tipo: 'cesion', txt: 'desafiaste el requerimiento del artículo 155' } }],
    as: { jefe: 'negociar', portavoz: 'desafiar', estratega: 'recurrir' }
  };
  // Sucesos de la intervención
  const ev = o => C.DATA.eventos.push(Object.assign({ peso: 1, cd: 40, req: () => true }, o));
  const enInterv = E => A.activos(E).filter(p => p.fase === 'intervenida');
  ev({ id: 'a155_protesta', titulo: 'Protestas multitudinarias contra el 155', icono: '📢', peso: 3, cd: 26, req: E => pm(E) && enInterv(E).length > 0,
    ctx: E => ({ c: enInterv(E)[0].c }), texto: (E, J, P, x) => `Cientos de miles de personas se manifiestan en ${nombre(E, x.c)} contra la intervención del Estado. Hay tensión en la calle y la oposición pide diálogo.`,
    opciones: [
      { t: 'Mantener la firmeza', ef: (E, J, P, x) => { const p = A.proceso(E, x.c), L = p ? p.legit : 0.4; E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob + (L - 0.45) * 2, 5, 90); E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab - 1, 0, 100); E.esp.ccaa[x.c].agravio += 1.5; return 'Mantienes el pulso: la calle sigue caliente.'; } },
      { t: 'Abrir una vía de diálogo', ef: (E, J, P, x) => { const p = A.proceso(E, x.c); if (p && p.hasta) p.hasta = Math.max(E.fecha.t + 2, p.hasta - 6); const rc = E.esp.ccaa[x.c]; if (rc.interv) rc.interv.hasta = p ? p.hasta : rc.interv.hasta; rc.relM = clamp(rc.relM + 6, 0, 100); C.Personaje.cambiar(E, { prestigio: 1 }, true); E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob - 0.5, 5, 90); return 'Abres el diálogo: la intervención se acortará.'; } },
      { t: 'Reforzar la presencia policial', ef: (E, J, P, x) => { const rc = E.esp.ccaa[x.c]; rc.indep = clamp(rc.indep + 1.5, 0, 100); rc.agravio += 2.5; E.paises.ES.gob.estab = clamp(E.paises.ES.gob.estab + 1, 0, 100); return 'Refuerzas la seguridad: se contiene la protesta, pero crece el agravio.'; } }] });
  ev({ id: 'a155_resistencia', titulo: 'Tu administración se resiste al 155', icono: '✊', peso: 3, cd: 26, req: (E, J) => J.cargo === 'presauto' && !!J.region && enInterv(E).some(p => p.c === J.region),
    texto: () => 'Funcionarios y altos cargos de tu comunidad se plantan ante las órdenes del Estado y esperan una señal tuya.',
    opciones: [
      { t: 'Animar a la desobediencia civil', ef: (E, J) => { const rc = E.esp.ccaa[J.region]; C.Personaje.cambiar(E, { pop: 2.5, prestigio: -1.5 }, true); rc.relM = clamp(rc.relM - 3, 0, 100); rc.desacato = E.fecha.t; return 'Alientas la desobediencia: ganas calle y cargas judiciales.'; } },
      { t: 'Acatar y esperar a las urnas', ef: (E, J) => { C.Personaje.cambiar(E, { prestigio: 1.5, pop: -0.8 }, true); const p = A.proceso(E, J.region); if (p && p.hasta) p.hasta = Math.max(E.fecha.t + 2, p.hasta - 3); return 'Pides calma: la intervención se acorta algo.'; } },
      { t: 'Buscar el apoyo de Bruselas', ef: (E, J) => { C.Personaje.cambiar(E, { capEU: 2, prestigio: 0.5 }, true); return 'Bruselas se muestra prudente: «es un asunto interno de España».'; } }] });
  C.Tiempo.registrar('art155', { turno: A.turno }, 34);
})(window.ESP);

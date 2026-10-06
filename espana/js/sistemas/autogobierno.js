/* Autogobierno: seguimiento y presión sobre las competencias, y reforma del Estatuto por artículos concretos
   (borrador → Parlamento autonómico (3/5) → negociación con el Estado → Cortes → referéndum → posible recurso ante el TC).
   Estado: rc.estatuto.reforma = { fase, items:[{id, estado, ins}], ronda, t, tFase, hist[] }; rc.estatuto.items = artículos vigentes; rc.vias = {comp: tSemana}. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp, T = C.Territorio;
  const nm = c => D().ccaa[c].nombre;
  const SEM_RONDA = 3, MAX_RONDAS = 3, MAX_ITEMS = 8, ENFRIA = 6;

  /* Artículos propios del Estatuto (además de transferir competencias). dif: dificultad política · tc: riesgo ante el Tribunal Constitucional. */
  const ARTICULOS = {
    nacionalidad: { n: 'Reconocimiento como nación / nacionalidad histórica', ic: '🏴', dif: 0.6, tc: 0.7, d: 'Preámbulo y artículo 1 con fuerte carga simbólica.' },
    bilateral: { n: 'Comisión bilateral Estado-Comunidad vinculante', ic: '🤝', dif: 0.5, tc: 0.5, d: 'Las decisiones que afectan a la comunidad se pactan de tú a tú.' },
    financ: { n: 'Financiación singular (cláusula de aportación)', ic: '💶', dif: 0.75, tc: 0.6, d: 'Sistema propio de financiación y recaudación.' },
    inversion: { n: 'Disposición adicional de inversiones del Estado', ic: '🏗️', dif: 0.3, tc: 0.2, d: 'Compromiso de inversión en infraestructuras proporcional a la población.' },
    lengua: { n: 'Lengua propia y cooficialidad reforzada', ic: '🗣️', dif: 0.35, tc: 0.35, d: 'Deber de conocer la lengua y preferencia en la Administración.' },
    justicia: { n: 'Consejo de Justicia autonómico', ic: '⚖️', dif: 0.6, tc: 0.6, d: 'Órgano de gobierno del poder judicial en la comunidad.' },
    seguridad: { n: 'Junta de Seguridad y policía integral', ic: '🚓', dif: 0.6, tc: 0.4, d: 'Coordinación y mando de la seguridad en el territorio.' },
    carta: { n: 'Carta de derechos sociales ampliada', ic: '📜', dif: 0.2, tc: 0.15, d: 'Nuevos derechos: vivienda, cuidados, renta garantizada.' },
    agencia: { n: 'Agencia Tributaria propia', ic: '🏛️', dif: 0.7, tc: 0.5, d: 'Gestión de los tributos cedidos por la propia comunidad.' },
    consulta: { n: 'Consulta popular autonómica', ic: '🗳️', dif: 0.9, tc: 0.95, d: 'Facultad de convocar consultas sobre el futuro político.' }
  };

  Object.assign(T, {
    ARTICULOS,
    /* Catálogo de artículos que puede incluir una reforma. */
    catalogoReforma(E, c) {
      const rc = E.esp.ccaa[c], out = [], vig = rc.estatuto.items || [];
      for (const k in D().competencias) if (rc.comp[k] < 2) { const cp = D().competencias[k]; out.push({ id: 'comp_' + k, n: 'Transferir: ' + cp.nombre, ic: cp.icono, dif: cp.dif, tc: cp.ley ? 0.35 : 0.1, d: rc.comp[k] === 0 ? 'Pasa de competencia estatal a compartida.' : 'Pasa de compartida a transferida (gestión plena).', comp: k }); }
      for (const k in ARTICULOS) if (!vig.includes(k)) out.push(Object.assign({ id: k }, ARTICULOS[k]));
      return out;
    },
    itemInfo(E, c, id) { return T.catalogoReforma(E, c).find(x => x.id === id) || (ARTICULOS[id] ? Object.assign({ id }, ARTICULOS[id]) : id.startsWith('comp_') ? { id, n: D().competencias[id.slice(5)].nombre, ic: D().competencias[id.slice(5)].icono, dif: D().competencias[id.slice(5)].dif, tc: 0.2, comp: id.slice(5) } : null); },

    /* Apoyo estimado en el Parlamento autonómico a un conjunto de artículos. */
    apoyoReforma(E, c, ids) {
      const rc = E.esp.ccaa[c], g = rc.gob, tot = U.suma(Object.values(rc.parl.escanos)); let si = 0; const por = {};
      const its = ids.map(i => T.itemInfo(E, c, i)).filter(Boolean), amb = its.length ? U.suma(its.map(x => x.dif * (1 + x.tc))) / its.length / 1.5 : 0;
      for (const k in rc.parl.escanos) {
        const p = E.partidos[k], gob = g && g.coalicion.includes(k), tol = 0.45 + (p.ter || 0) / 140, base = gob ? 0.88 : p.amb === 'reg' ? 0.85 : 0.55;
        const ap = clamp(base - Math.max(0, amb - tol) * 1.1 - (its.length ? 0 : 1), 0.02, 0.97); por[k] = ap; si += rc.parl.escanos[k] * ap;
      }
      return { si: Math.round(si), tot, req: Math.ceil(tot * 0.6), ok: si >= Math.ceil(tot * 0.6), por };
    },
    /* Probabilidad de que el Estado acepte un artículo (negociación en comisión). */
    probArticulo(E, c, it, bono) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, info = T.itemInfo(E, c, it.id); if (!info) return 0.3;
      const pr = rc.gob ? rc.gob.partido : null, al = pr && g.coalicion.includes(pr) ? 0.18 : pr && (g.apoyoExterno || []).includes(pr) ? 0.1 : 0;
      return clamp(0.62 - info.dif * 0.55 - info.tc * 0.2 + (rc.relM - 50) / 200 + al + (info.comp ? (rc.presion[info.comp] || 0) : 0) + (bono || 0), 0.03, 0.92);
    },

    reformaActiva(E, c) { const r = E.esp.ccaa[c].estatuto.reforma; return r && r.fase !== 'cerrada' ? r : null; },
    reformaNota(E, c, txt) { const r = E.esp.ccaa[c].estatuto.reforma; if (r) { r.hist.unshift({ t: E.fecha.t, txt }); if (r.hist.length > 30) r.hist.length = 30; } },

    /* El presidente abre un borrador. */
    abrirBorrador(E, c) {
      const rc = E.esp.ccaa[c]; if (T.reformaActiva(E, c) || rc.estatuto.proceso) return { ok: false, msg: 'Ya hay una reforma en marcha' };
      if (E.fecha.t - (rc.estatuto.ultReforma || -99) < 26) return { ok: false, msg: 'Debe pasar un tiempo desde la última reforma' };
      rc.estatuto.reforma = { fase: 'borrador', items: [], ronda: 0, t: E.fecha.t, tFase: E.fecha.t, hist: [], ultParl: -99 };
      T.reformaNota(E, c, 'Se abre el borrador de reforma estatutaria.'); return { ok: true, msg: 'Borrador abierto: elige los artículos.' };
    },
    /* Añade o quita un artículo del borrador. */
    marcarArticulo(E, c, id) {
      const r = T.reformaActiva(E, c); if (!r || r.fase !== 'borrador') return { ok: false, msg: 'No hay borrador abierto' };
      const i = r.items.findIndex(x => x.id === id);
      if (i >= 0) r.items.splice(i, 1); else { if (r.items.length >= MAX_ITEMS) return { ok: false, msg: `Máximo ${MAX_ITEMS} artículos` }; if (!T.itemInfo(E, c, id)) return { ok: false, msg: 'Artículo desconocido' }; r.items.push({ id, estado: 'pedido', ins: 0 }); }
      return { ok: true, msg: '' };
    },
    descartarBorrador(E, c) { const rc = E.esp.ccaa[c], r = rc.estatuto.reforma; if (!r || r.fase !== 'borrador') return { ok: false, msg: 'No hay borrador' }; rc.estatuto.reforma = null; return { ok: true, msg: 'Borrador descartado.' }; },

    /* Votación en el Parlamento autonómico (tres quintos). */
    votarParlamento(E, c) {
      const rc = E.esp.ccaa[c], r = T.reformaActiva(E, c); if (!r || r.fase !== 'borrador') return { ok: false, msg: 'No hay borrador que presentar' };
      if (r.items.length < 2) return { ok: false, msg: 'Un estatuto necesita al menos dos artículos' };
      if (E.fecha.t - r.ultParl < 4) return { ok: false, msg: 'Acaba de fallar la votación: espera unas semanas' };
      const a = T.apoyoReforma(E, c, r.items.map(x => x.id)), si = Math.round(a.si + U.gauss(0, a.tot * 0.02));
      r.ultParl = E.fecha.t;
      if (si < a.req) { T.reformaNota(E, c, `El Parlamento no reúne los tres quintos (${si}/${a.tot}).`); return { ok: false, msg: `Sin tres quintos en el Parlamento (${si} de ${a.tot}; hacen falta ${a.req}). Quita artículos polémicos o negocia con la oposición.` }; }
      r.fase = 'comision'; r.ronda = 1; r.tFase = E.fecha.t; T.estadoResponde(E, c, r);
      T.reformaNota(E, c, `El Parlamento aprueba la propuesta (${si}/${a.tot}) y se abre la comisión de negociación con el Estado.`);
      C.Noticias.poner(E, 'politica', `El Parlamento de ${nm(c)} aprueba por ${si} votos su propuesta de reforma estatutaria (${r.items.length} artículos).`, 'ES');
      return { ok: true, msg: `Propuesta aprobada (${si}/${a.tot}). Comienza la negociación con el Estado: responde ronda a ronda.` };
    },
    /* El Estado responde a cada artículo. */
    estadoResponde(E, c, r) {
      for (const it of r.items) {
        if (it.estado === 'cedido' || it.estado === 'rechazado' && it.ins >= 2) continue;
        if (it.estado === 'aceptado') continue;
        const p = T.probArticulo(E, c, it, it.ins * 0.15), u = Math.random();
        it.estado = u < p ? 'aceptado' : u < p + 0.25 ? 'recortado' : 'rechazado';
      }
    },
    /* Insistir en un artículo recortado o rechazado. */
    insistir(E, c, id) {
      const rc = E.esp.ccaa[c], r = T.reformaActiva(E, c); if (!r || r.fase !== 'comision') return { ok: false, msg: 'No estás negociando' };
      const it = r.items.find(x => x.id === id); if (!it || !['recortado', 'rechazado'].includes(it.estado)) return { ok: false, msg: 'Ese artículo no necesita insistencia' };
      if (it.ins >= 2) return { ok: false, msg: 'Ya has insistido todo lo posible en ese artículo' };
      it.ins++; rc.relM = clamp(rc.relM - 2, 0, 100);
      const J = E.jugador, bono = (J ? J.atrib.negociacion / 10 * 0.12 : 0) + it.ins * 0.12, p = T.probArticulo(E, c, it, bono), u = Math.random(), info = T.itemInfo(E, c, id);
      it.estado = u < p ? 'aceptado' : u < p + 0.2 ? 'recortado' : 'rechazado';
      T.reformaNota(E, c, `Insistes en «${info.n}»: el Estado ${it.estado === 'aceptado' ? 'cede' : it.estado === 'recortado' ? 'acepta una versión recortada' : 'mantiene su rechazo'}.`);
      return { ok: true, msg: `${info.n}: ${it.estado === 'aceptado' ? 'el Estado lo acepta' : it.estado === 'recortado' ? 'se acepta recortado' : 'sigue rechazado'}.` };
    },
    /* Renunciar a un artículo para facilitar el acuerdo (sube la buena voluntad). */
    ceder(E, c, id) {
      const rc = E.esp.ccaa[c], r = T.reformaActiva(E, c); if (!r || r.fase !== 'comision') return { ok: false, msg: 'No estás negociando' };
      const it = r.items.find(x => x.id === id); if (!it || it.estado === 'cedido') return { ok: false, msg: 'Artículo no válido' };
      it.estado = 'cedido'; rc.relM = clamp(rc.relM + 2, 0, 100); T.reformaNota(E, c, `Renuncias a «${T.itemInfo(E, c, id).n}» como gesto.`);
      return { ok: true, msg: 'Renuncias al artículo: mejora el clima con el Estado.' };
    },
    /* Cierra la negociación y remite el texto a las Cortes. */
    cerrarAcuerdo(E, c) {
      const rc = E.esp.ccaa[c], r = T.reformaActiva(E, c); if (!r || r.fase !== 'comision') return { ok: false, msg: 'No estás negociando' };
      const vivos = r.items.filter(x => ['aceptado', 'recortado'].includes(x.estado));
      if (!vivos.length) { r.fase = 'cerrada'; rc.estatuto.reforma = Object.assign(r, { fase: 'cerrada', res: 'sin acuerdo' }); rc.estatuto.ultReforma = E.fecha.t; rc.relM = clamp(rc.relM - 4, 0, 100); C.Noticias.poner(E, 'politica', `La negociación del Estatuto de ${nm(c)} termina sin acuerdo.`, 'ES'); return { ok: true, msg: 'Sin ningún artículo aceptado, la negociación se cierra sin acuerdo.' }; }
      const ter = clamp(10 + U.suma(vivos.map(x => T.itemInfo(E, c, x.id).dif * (x.estado === 'recortado' ? 0.5 : 1))) * 14, 10, 90);
      const tplId = C.Congreso.plantilla('estatuto_' + c.toLowerCase()) ? 'estatuto_' + c.toLowerCase() : 'estatuto_gen';
      const J = E.jugador, prop = C.Congreso.proponer(E, tplId, { tipo: 'jugador', pid: J.partido, region: c }, { region: c, t: `Reforma del Estatuto de Autonomía de ${nm(c)} (${vivos.length} artículos)`, ter, estIt: vivos.map(x => ({ id: x.id, recortado: x.estado === 'recortado' })) });
      r.fase = 'cortes'; r.tFase = E.fecha.t; r.propId = prop.id; rc.estatuto.proceso = { fase: 'cortes', id: prop.id, t: E.fecha.t };
      T.reformaNota(E, c, `Acuerdo cerrado: ${vivos.length} artículos pasan a las Cortes como ley orgánica.`);
      C.Noticias.poner(E, 'politica', `El texto pactado de reforma del Estatuto de ${nm(c)} llega a las Cortes Generales.`, 'ES');
      return { ok: true, msg: `Texto remitido a las Cortes (${vivos.length} artículos). Necesita mayoría absoluta del Congreso.` };
    },

    /* Aplica los artículos ratificados en referéndum. */
    aplicarReforma(E, c, items) {
      const rc = E.esp.ccaa[c]; rc.estatuto.items = (rc.estatuto.items || []).slice();
      for (const x of items) {
        const half = x.recortado ? 0.5 : 1;
        if (x.id.startsWith('comp_')) { const k = x.id.slice(5); if (rc.comp[k] < 2 && (!x.recortado || rc.comp[k] < 1)) T.aplicarTraspaso(E, c, k); continue; }
        rc.estatuto.items.push(x.id);
        if (x.id === 'nacionalidad') { rc.concesiones.push({ t: E.fecha.t, v: -1.2 * half, d: 'Reconocimiento nacional' }); rc.agravio = Math.max(0, rc.agravio - 1); }
        else if (x.id === 'bilateral') { rc.relM = clamp(rc.relM + 5 * half, 0, 100); for (const k in rc.presion) rc.presion[k] = Math.min(0.3, rc.presion[k] + 0.03); }
        else if (x.id === 'financ') { if (rc.fin) rc.fin.nivel = clamp((rc.fin.nivel || 50) + 6 * half, 0, 100); rc.fiscal += 0.6 * half; for (const o of T.ids()) if (o !== c) E.esp.ccaa[o].agravio += 0.4 * half; }
        else if (x.id === 'inversion') { rc.deuda = Math.max(3, rc.deuda - 1.2 * half); if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 1.2 * half, 5, 90); }
        else if (x.id === 'lengua') rc.gestion.cul = clamp(rc.gestion.cul + 5 * half, 5, 98);
        else if (x.id === 'justicia') rc.gestion.jus = clamp(rc.gestion.jus + 6 * half, 5, 98);
        else if (x.id === 'seguridad') rc.gestion.int = clamp(rc.gestion.int + 5 * half, 5, 98);
        else if (x.id === 'carta') { rc.gestion.soc = clamp(rc.gestion.soc + 4 * half, 5, 98); if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 2 * half, 5, 90); }
        else if (x.id === 'agencia') { rc.gestion.eco = clamp(rc.gestion.eco + 5 * half, 5, 98); rc.fiscal += 0.3 * half; }
        else if (x.id === 'consulta') rc.concesiones.push({ t: E.fecha.t, v: -2 * half, d: 'Consulta popular' });
      }
      T.calcAut(E, c);
    },
    /* Efecto inverso de un artículo anulado por el Tribunal Constitucional. */
    anularArticulo(E, c, x) {
      const rc = E.esp.ccaa[c];
      if (x.id.startsWith('comp_')) { const k = x.id.slice(5); if (rc.comp[k] > 0) rc.comp[k]--; T.calcAut(E, c); return; }
      rc.estatuto.items = (rc.estatuto.items || []).filter(i => i !== x.id);
      if (x.id === 'financ' && rc.fin) rc.fin.nivel = clamp(rc.fin.nivel - 6, 0, 100);
      else if (['lengua', 'justicia', 'seguridad', 'agencia', 'carta'].includes(x.id)) { const a = { lengua: 'cul', justicia: 'jus', seguridad: 'int', agencia: 'eco', carta: 'soc' }[x.id]; rc.gestion[a] = clamp(rc.gestion[a] - 4, 5, 98); }
      else if (x.id === 'bilateral') rc.relM = clamp(rc.relM - 3, 0, 100);
      T.calcAut(E, c);
    },

    /* Seguimiento semanal de la reforma: caducidades, resultado de las Cortes y recurso ante el TC. */
    estTurno(E, c) {
      const rc = E.esp.ccaa[c], r = rc.estatuto.reforma, t = E.fecha.t; if (!r) return;
      const J = E.jugador, suyo = J && J.region === c && J.cargo === 'presauto';
      if (r.fase === 'comision' && t - r.tFase >= SEM_RONDA) {
        r.ronda++; r.tFase = t;
        if (r.ronda > MAX_RONDAS) { T.reformaNota(E, c, 'Se agota el plazo de negociación: el texto se remite con lo pactado.'); if (suyo && !E.meta.presim) C.Personaje.log(E, 'Se agota la negociación estatutaria: pasa a las Cortes lo pactado.'); T.cerrarAcuerdo(E, c); }
        else T.reformaNota(E, c, `Comienza la ronda ${r.ronda} de negociación.`);
      }
      if (r.fase === 'cortes') {
        const p = E.proyectos[r.propId], ab = p && C.Congreso.ABIERTAS.includes(p.etapa), enRef = rc.estatuto.proceso && rc.estatuto.proceso.fase === 'referendum';
        if (rc.estatuto.ratif === r.propId) { r.fase = 'tc'; r.tFase = t; r.tTC = t + 10; T.reformaNota(E, c, 'Aprobada en Cortes y ratificada en referéndum. La oposición puede recurrirla ante el Tribunal Constitucional.'); }
        else if (enRef) { r.fase = 'referendum'; r.tFase = t; T.reformaNota(E, c, 'Las Cortes aprueban la reforma: referéndum en la comunidad.'); }
        else if (!p || (!ab && p.etapa !== 'sancionada')) { r.fase = 'cerrada'; r.res = 'rechazada en Cortes'; rc.estatuto.proceso = null; rc.estatuto.ultReforma = t; T.reformaNota(E, c, 'Las Cortes rechazan la reforma.'); }
        else if (p.etapa === 'sancionada' && !rc.estatuto.proceso && t - r.tFase > 14) { r.fase = 'cerrada'; r.res = 'rechazada en referéndum'; rc.estatuto.ultReforma = t; T.reformaNota(E, c, 'El referéndum no ratifica la reforma.'); }
      }
      if (r.fase === 'referendum' && !rc.estatuto.proceso) {
        if (rc.estatuto.ratif === r.propId) { r.fase = 'tc'; r.tFase = t; r.tTC = t + 10; T.reformaNota(E, c, 'Ratificada en referéndum. La oposición puede recurrirla ante el Tribunal Constitucional.'); }
        else { r.fase = 'cerrada'; r.res = 'rechazada en referéndum'; rc.estatuto.ultReforma = t; T.reformaNota(E, c, 'El referéndum no ratifica la reforma.'); }
      }
      if (r.fase === 'tc' && t >= r.tTC) {
        const vivos = (r.items || []).filter(x => ['aceptado', 'recortado'].includes(x.estado)), tcs = E.esp.tc ? E.esp.tc.sesgo : 0, opo = E.paises.ES.partidos.filter(k => !E.paises.ES.gob.coalicion.includes(k)), esc = U.suma(opo.map(k => E.paises.ES.escanos[k] || 0));
        const recurre = esc >= 50 && vivos.some(x => T.itemInfo(E, c, x.id) && T.itemInfo(E, c, x.id).tc >= 0.3) && U.chance(0.75);
        const anul = [];
        if (recurre) for (const x of vivos) { const info = T.itemInfo(E, c, x.id); if (info && U.chance(clamp(info.tc * (0.55 - tcs * 0.5), 0.02, 0.85))) anul.push(x); }
        r.fase = 'cerrada'; r.res = anul.length ? `el TC anula ${anul.length} artículo(s)` : 'ratificada'; rc.estatuto.ultReforma = t;
        if (anul.length) {
          anul.forEach(x => T.anularArticulo(E, c, x)); rc.relM = clamp(rc.relM - 4, 0, 100); rc.agravio += 0.8 * anul.length; r.anulados = anul.map(x => x.id);
          C.Noticias.poner(E, 'justicia', `El Tribunal Constitucional anula ${anul.length} artículo(s) del Estatuto de ${nm(c)}: ${anul.map(x => T.itemInfo(E, c, x.id) ? T.itemInfo(E, c, x.id).n.toLowerCase() : x.id).slice(0, 3).join(', ')}.`, 'ES');
          T.reformaNota(E, c, `El Tribunal Constitucional anula ${anul.length} artículo(s).`); if (suyo) C.Personaje.log(E, `El TC anula ${anul.length} artículo(s) de tu Estatuto.`);
        } else { T.reformaNota(E, c, recurre ? 'El TC avala el Estatuto íntegramente.' : 'Nadie recurre el Estatuto: entra en vigor sin cambios.'); C.Noticias.poner(E, 'politica', `El nuevo Estatuto de ${nm(c)} entra en vigor${recurre ? ' tras superar el control del Tribunal Constitucional' : ''}.`, 'ES'); }
        if (suyo) C.Personaje.cambiar(E, { prestigio: anul.length ? 2 : 6, pop: 2 }, true);
      }
    },

    /* ── Competencias: seguimiento y presión ── */
    estadoComp(E, c, k) {
      const rc = E.esp.ccaa[c], cs = E.esp.consejo;
      if (rc.comp[k] >= 2) return { f: 'hecho', txt: 'Transferida (gestión plena)' };
      const it = cs && cs.agenda.find(i => i.tipo === 'competencia' && i.region === c && i.comp === k); if (it) return { f: 'consejo', txt: 'En el orden del día del Consejo de Ministros' };
      const tr = (rc.pend || []).find(p => p.tipo === 'traspaso' && p.comp === k); if (tr) return { f: 'comision', txt: `Comisión mixta de transferencias: se hará efectiva en ~${Math.max(0, Math.round(tr.t - E.fecha.t))} semanas` };
      const pr = C.Congreso.abiertos(E).find(p => p.comp === k && p.region === c); if (pr) return { f: 'cortes', txt: 'Ley orgánica de transferencia en las Cortes (' + C.Comp.etapa(pr.etapa) + ')' };
      const rf = rc.estatuto.reforma; if (rf && rf.fase !== 'cerrada' && rf.items.some(x => x.id === 'comp_' + k)) return { f: 'estatuto', txt: 'Incluida en la reforma del Estatuto en curso' };
      return { f: 'libre', txt: rc.reclama.includes(k) ? 'Reclamada en el programa, sin solicitud formal' : 'Sin solicitud' };
    },
    /* Vías de presión sobre el Estado. */
    VIAS: {
      bilateral: { n: 'Comisión bilateral', ic: '🤝', d: 'Reunión formal con el Gobierno: mejora la relación y suma presión moderada.', costo: 1, pres: 0.05, rel: 3, prestigio: 0.4 },
      parlamento: { n: 'Resolución del Parlamento', ic: '🏛', d: 'El Parlamento autonómico reclama la competencia (exige apoyo de la cámara). Presión media.', costo: 1, pres: 0.08, rel: -1, prestigio: 0.8 },
      calle: { n: 'Movilización social', ic: '📢', d: 'Manifestación y campaña pública: mucha presión pero tensa la relación con Moncloa.', costo: 2, pres: 0.15, rel: -5, prestigio: 0.5 },
      pacto: { n: 'Pacto con el Gobierno', ic: '📞', d: 'Ofreces apoyo político a cambio de avanzar: presión alta, sólo si tu partido pesa en las Cortes o es afín.', costo: 2, pres: 0.12, rel: 2, prestigio: 0 }
    },
    presionarComp(E, c, k, via) {
      const rc = E.esp.ccaa[c], V = T.VIAS[via], cp = D().competencias[k], J = E.jugador; if (!V || !cp) return { ok: false, msg: 'Vía no válida' };
      if (rc.comp[k] >= 2) return { ok: false, msg: 'Ya la tiene transferida' };
      rc.vias = rc.vias || {}; const kk = k + '|' + via;
      if (E.fecha.t - (rc.vias[kk] != null ? rc.vias[kk] : -99) < ENFRIA) return { ok: false, msg: `Ya has usado esa vía hace poco (espera ${ENFRIA} semanas)` };
      const x = J.atrib.negociacion / 10 * 0.5 + J.atrib.carisma / 10 * 0.5, g = E.paises.ES.gob;
      if (via === 'parlamento') { const a = T.apoyoReforma(E, c, ['comp_' + k]); if (a.si < Math.ceil(a.tot / 2)) return { ok: false, msg: 'El Parlamento autonómico no respalda la resolución (sin mayoría)' }; }
      if (via === 'pacto') { const e = (E.paises.ES.escanos[J.partido] || 0), afin = rc.gob && (g.coalicion.includes(rc.gob.partido) || (g.apoyoExterno || []).includes(rc.gob.partido)); if (!afin && e < 12) return { ok: false, msg: 'Tu partido no pesa lo bastante en las Cortes para pactar' }; }
      rc.vias[kk] = E.fecha.t; rc.presion[k] = Math.min(0.3, (rc.presion[k] || 0) + V.pres * (0.7 + x * 0.6));
      rc.relM = clamp(rc.relM + V.rel, 0, 100); if (V.prestigio) C.Personaje.cambiar(E, { prestigio: V.prestigio, pop: via === 'calle' ? 1 : 0.3 });
      if (via === 'calle') { rc.agravio += 0.2; if (cp.dif >= 0.5) for (const sg of ['UPC', 'VAP']) { const p = E.partidos['ES_' + sg]; if (p) p.pop += 0.02; } }
      const p = T.probComp(E, c, k); C.Noticias.poner(E, 'politica', `${nm(c)} presiona al Estado por ${cp.nombre.toLowerCase()} (${V.n.toLowerCase()}).`, 'ES');
      return { ok: true, msg: `${V.n}: la probabilidad de acuerdo sube al ${Math.round(p * 100)} %.` };
    }
  });

  // La tramitación semanal de cada comunidad incluye el seguimiento de la reforma
  const f0 = T.leyesTurno; T.leyesTurno = function (E, c) { T.estTurno(E, c); return f0.apply(this, arguments); };
  // Al ratificar el referéndum se aplican los artículos pactados (y no los traspasos por defecto)
  const fr = T.referendumEstatuto; T.referendumEstatuto = function (E, c, pend) {
    const rc = E.esp.ccaa[c], r = rc.estatuto.reforma, its = pend && pend.estIt;
    if (!its || !r) return fr.apply(this, arguments);
    const apoyo = clamp(52 + (rc.relM - 50) * 0.2 + (rc.gob ? rc.gob.aprob - 45 : 0) * 0.15 + U.gauss(0, 9), 20, 90), part = clamp(55 + U.gauss(0, 6), 35, 75);
    rc.estatuto.proceso = null;
    if (apoyo >= 50) {
      T.aplicarReforma(E, c, its); rc.aut0 = Math.max(rc.aut0, rc.aut); rc.estatuto.ano = U.anio(); rc.estatuto.ratif = r.propId; rc.relM = clamp(rc.relM + 4, 0, 100);
      rc.concesiones.push({ t: E.fecha.t, v: -1.5, d: 'Nuevo estatuto' });
      C.Noticias.poner(E, 'politica', `El nuevo Estatuto de ${nm(c)} es ratificado en referéndum con un ${U.d1(apoyo)} % de síes (participación ${U.d1(part)} %).`, 'ES');
      if (E.jugador && E.jugador.pais === 'ES' && E.jugador.region === c) C.Personaje.log(E, `Tu reforma del Estatuto de ${nm(c)} se ratifica en referéndum (${U.d1(apoyo)} % de síes).`);
    } else { rc.estatuto.rechazos++; rc.relM = clamp(rc.relM - 5, 0, 100); C.Noticias.poner(E, 'politica', `El referéndum rechaza la reforma del Estatuto de ${nm(c)} (${U.d1(apoyo)} % de síes).`, 'ES'); }
  };

  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'autonomico' }, o));
  const pres = E => { const J = E.jugador; return J.pais === 'ES' && J.cargo === 'presauto' && J.region && E.esp.ccaa[J.region].gob && E.esp.ccaa[J.region].gob.pres === 'J' ? true : 'Sólo el presidente autonómico'; };
  const gob = E => { const J = E.jugador; return J.pais === 'ES' && ['presauto', 'consejero'].includes(J.cargo) ? true : 'Necesitas un cargo de gobierno autonómico'; };
  R({ id: 'presionar_competencia', nombre: 'Presionar al Estado por una competencia', icono: '📣', costo: 1, desc: 'Presidente o consejero autonómico: usa una vía (bilateral, Parlamento, calle o pacto) para subir la presión sobre una competencia.', disponible: gob, ejecutar: (E, a) => T.presionarComp(E, E.jugador.region, a.comp, a.via) });
  R({ id: 'abrir_reforma_estatuto', nombre: 'Abrir un borrador de reforma del Estatuto', icono: '📖', costo: 1, desc: 'Presidente autonómico: elige artículos concretos y negocia con el Estado.', disponible: pres, ejecutar: E => T.abrirBorrador(E, E.jugador.region) });
  R({ id: 'presentar_reforma_estatuto', nombre: 'Presentar el borrador al Parlamento', icono: '🏛', costo: 2, desc: 'Se vota en el Parlamento autonómico (tres quintos).', disponible: pres, ejecutar: E => T.votarParlamento(E, E.jugador.region) });
  R({ id: 'insistir_articulo', nombre: 'Insistir en un artículo', icono: '✊', costo: 1, desc: 'Vuelve a pedir un artículo recortado o rechazado (cuesta relación con el Estado).', disponible: pres, ejecutar: (E, a) => T.insistir(E, E.jugador.region, a.id) });
  R({ id: 'cerrar_acuerdo_estatuto', nombre: 'Cerrar el acuerdo y remitirlo a las Cortes', icono: '✅', costo: 1, desc: 'Da por terminada la negociación con lo pactado.', disponible: pres, ejecutar: E => T.cerrarAcuerdo(E, E.jugador.region) });
})(window.ESP);

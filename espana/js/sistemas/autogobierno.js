/* Autogobierno: seguimiento y presión sobre las competencias, y reforma del Estatuto por artículos concretos
   (borrador → Parlamento autonómico (3/5) → negociación con el Estado → Cortes → referéndum → posible recurso ante el TC).
   Estado: rc.estatuto.reforma = { fase, items:[{id, estado, ins}], ronda, t, tFase, hist[] }; rc.estatuto.items = artículos vigentes; rc.vias = {comp: tSemana}. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp, T = C.Territorio;
  const nm = c => D().ccaa[c].nombre;
  const SEM_RONDA = 3, MAX_RONDAS = 3, MAX_ITEMS = 8, ENFRIA = 6, CAB_MAX = 0.4, SUAV = 0.6;
  /* Semanas entre dos intentos con el mismo grupo: en el Parlamento autonómico no hay prisa; en las Cortes, el texto corre. */
  const ENF_CAB = { parl: 3, cortes: 1 };

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

    /* Versión de un artículo tal como figura en el borrador: si se ha suavizado, pesa menos para la oposición y el Tribunal Constitucional. */
    itemEf(E, c, x) {
      const info = T.itemInfo(E, c, x.id); if (!info) return null;
      return x.suav ? Object.assign({}, info, { dif: info.dif * SUAV, tc: info.tc * SUAV, suav: true }) : info;
    },
    /* Ambición de un artículo a ojos de un grupo: lo que supera su tolerancia es lo que le molesta. */
    toleranciaGrupo(E, pid) { return 0.45 + (E.partidos[pid].ter || 0) / 140; },
    ambicion(info) { return info.dif * (1 + info.tc) / 1.5; },
    /* Artículos que cada grupo del Parlamento autonómico (o de las Cortes, si se pasa su lista) rechaza, de mayor a menor. */
    objeciones(E, c, items, grupos) {
      const rc = E.esp.ccaa[c], out = {};
      for (const k of grupos || Object.keys(rc.parl.escanos)) {
        const tol = T.toleranciaGrupo(E, k), l = [];
        for (const x of items) { const i = T.itemEf(E, c, x); if (i && T.ambicion(i) > tol) l.push({ id: x.id, exceso: T.ambicion(i) - tol }); }
        out[k] = l.sort((a, b) => b.exceso - a.exceso);
      }
      return out;
    },

    /* Apoyo estimado en el Parlamento autonómico a un conjunto de artículos. Con borr, cuenta el cabildeo y los artículos suavizados del borrador. */
    apoyoReforma(E, c, ids, borr) {
      const rc = E.esp.ccaa[c], g = rc.gob, tot = U.suma(Object.values(rc.parl.escanos)), rf = borr ? T.reformaActiva(E, c) : null; let si = 0; const por = {};
      const its = ids.map(i => { const x = rf && rf.items.find(y => y.id === i); return x ? T.itemEf(E, c, x) : T.itemInfo(E, c, i); }).filter(Boolean), amb = its.length ? U.suma(its.map(x => x.dif * (1 + x.tc))) / its.length / 1.5 : 0;
      for (const k in rc.parl.escanos) {
        const p = E.partidos[k], gob = g && g.coalicion.includes(k), tol = T.toleranciaGrupo(E, k), base = gob ? 0.88 : p.amb === 'reg' ? 0.85 : 0.55, cab = rf && rf.cab ? (rf.cab[k] || 0) : 0;
        const ap = clamp(base - Math.max(0, amb - tol) * 1.1 - (its.length ? 0 : 1) + cab, 0.02, 0.97); por[k] = ap; si += rc.parl.escanos[k] * ap;
      }
      return { si: Math.round(si), tot, req: Math.ceil(tot * 0.6), ok: si >= Math.ceil(tot * 0.6), por };
    },
    /* Probabilidad de que el Estado acepte un artículo (negociación en comisión). */
    probArticulo(E, c, it, bono) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, info = T.itemEf(E, c, it); if (!info) return 0.3;
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
      const a = T.apoyoReforma(E, c, r.items.map(x => x.id), true), si = Math.round(a.si + U.gauss(0, a.tot * 0.02));
      r.ultParl = E.fecha.t;
      if (si < a.req) { r.fallos = (r.fallos || 0) + 1; T.reformaNota(E, c, `El Parlamento no reúne los tres quintos (${si}/${a.tot}).`); return { ok: false, msg: `Sin tres quintos en el Parlamento (${si} de ${a.tot}; hacen falta ${a.req}). Cabildea con los grupos, suaviza o quita los artículos que más rechazo provocan${r.fallos ? ', o pide la votación por artículos para que no caiga todo el texto' : ''}.` }; }
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
      const ter = clamp(10 + U.suma(vivos.map(x => T.itemEf(E, c, x).dif * (x.estado === 'recortado' ? 0.5 : 1))) * 14, 10, 90);
      const tplId = C.Congreso.plantilla('estatuto_' + c.toLowerCase()) ? 'estatuto_' + c.toLowerCase() : 'estatuto_gen';
      const J = E.jugador, prop = C.Congreso.proponer(E, tplId, { tipo: 'jugador', pid: J.partido, region: c }, { region: c, estReg: c, t: `Reforma del Estatuto de Autonomía de ${nm(c)} (${vivos.length} artículos)`, ter, estIt: vivos.map(x => ({ id: x.id, recortado: x.estado === 'recortado' || !!x.suav })) });
      r.fase = 'cortes'; r.tFase = E.fecha.t; r.propId = prop.id; rc.estatuto.proceso = { fase: 'cortes', id: prop.id, t: E.fecha.t };
      T.reformaNota(E, c, `Acuerdo cerrado: ${vivos.length} artículos pasan a las Cortes como ley orgánica.`);
      C.Noticias.poner(E, 'politica', `El texto pactado de reforma del Estatuto de ${nm(c)} llega a las Cortes Generales.`, 'ES');
      return { ok: true, msg: `Texto remitido a las Cortes (${vivos.length} artículos). Necesita mayoría absoluta del Congreso.` };
    },

    /* ── Cabildeo del Estatuto: grupos del Parlamento autonómico (borrador) o de las Cortes (texto remitido) ── */
    /* Dónde se está jugando el cabildeo: el borrador en el Parlamento autonómico o el texto remitido en el Congreso. */
    cabCtx(E, c) {
      const r = T.reformaActiva(E, c); if (!r) return null;
      if (r.fase === 'borrador') return { r, donde: 'parl' };
      const p = r.fase === 'cortes' && r.propId && E.proyectos[r.propId];
      if (p && C.Congreso.ABIERTAS.includes(p.etapa) && ['registro', 'ponencia', 'pleno', 'pleno_pend', 'senado', 'vuelta'].includes(p.etapa)) return { r, donde: 'cortes', p };
      return null;
    },
    /* Artículos vivos del texto (los que siguen en pie tras la negociación con el Estado). */
    itemsVivos(r) { return r.items.filter(x => ['aceptado', 'recortado'].includes(x.estado)); },
    /* Habla con un grupo para ganar su voto. Funciona igual en el Parlamento autonómico y en las Cortes. */
    cabildearEstatuto(E, c, pid, contra) {
      const rc = E.esp.ccaa[c], J = E.jugador, x = T.cabCtx(E, c);
      if (!x) return { ok: false, msg: 'Sólo se cabildea mientras el borrador está en el Parlamento autonómico o el texto en las Cortes' };
      const { r, donde } = x, k = pid, pa = E.partidos[k]; if (!pa) return { ok: false, msg: 'Elige un grupo' };
      if (donde === 'parl' && !rc.parl.escanos[k]) return { ok: false, msg: 'Ese grupo no tiene escaños en el Parlamento autonómico' };
      if (donde === 'cortes' && !(E.paises.ES.escanos[k] > 0)) return { ok: false, msg: 'Ese grupo no tiene escaños en el Congreso' };
      r.cab = r.cab || {}; r.cabT = r.cabT || {}; r.contra = r.contra || {};
      const key = donde + ':' + k, cur = donde === 'parl' ? (r.cab[k] || 0) : (x.p.apoyo[k] || 0), tope = donde === 'parl' ? (contra ? CAB_MAX + 0.1 : CAB_MAX) : (contra ? 1 : 0.9);
      if (cur >= tope - 0.01) return { ok: false, msg: `${pa.sigla} ya ha dado de sí todo lo que va a dar` };
      const xx = J.atrib.negociacion / 10 * 0.5 + J.atrib.carisma / 10 * 0.5;
      const poner = v => { if (donde === 'parl') r.cab[k] = clamp(cur + v, 0, tope); else { x.p.apoyo[k] = clamp(cur + v, -0.8, tope); E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.p === k && i !== 'J') m.rel = clamp(m.rel + 3, -100, 100); }); } };
      const dnd = donde === 'parl' ? 'en el Parlamento' : 'en las Cortes';
      if (contra) {
        if (r.contra[key]) return { ok: false, msg: `Ya has pactado una contrapartida con ${pa.sigla}` };
        // En las Cortes, un grupo grande puede cerrar un pacto de fondo (una vez por texto): su apoyo es casi seguro, pero sale caro
        const pacto = donde === 'cortes' && !x.p.pacto && E.paises.ES.escanos[k] >= 15;
        r.contra[key] = true; rc.deuda = clamp(rc.deuda + (pacto ? 1.2 : 0.6), 0, 99); C.Personaje.cambiar(E, { prestigio: pacto ? -1 : -0.4 }); poner(donde === 'parl' ? 0.3 : 0.45);
        if (pacto) { x.p.pacto = k; T.reformaNota(E, c, `Cierras un pacto de fondo con ${pa.sigla} para sacar el Estatuto adelante en las Cortes.`); return { ok: true, msg: `Pacto con ${pa.sigla}: votará a favor del Estatuto a cambio de concesiones (más deuda y un coste de prestigio).` }; }
        const reg = pa.amb === 'reg' || pa.region === c;
        T.reformaNota(E, c, `Pactas una contrapartida con ${pa.sigla} (${reg ? 'inversiones en su comarca' : 'un puesto en la comisión de seguimiento y fondos para sus alcaldías'}) a cambio de su voto ${dnd}.`);
        return { ok: true, msg: `${pa.sigla} acepta tu oferta (${reg ? 'inversiones en su territorio' : 'presencia en la comisión de seguimiento'}): su apoyo ${dnd} sube con claridad. Cuesta deuda y algo de prestigio.` };
      }
      if (E.fecha.t - (r.cabT[key] != null ? r.cabT[key] : -99) < ENF_CAB[donde]) return { ok: false, msg: `Acabas de hablar con ${pa.sigla}: espera ${ENF_CAB[donde]} semana${ENF_CAB[donde] > 1 ? 's' : ''}` };
      r.cabT[key] = E.fecha.t;
      const objs = donde === 'parl' ? (T.objeciones(E, c, r.items, [k])[k] || []).length : (T.objeciones(E, c, T.itemsVivos(r), [k])[k] || []).length;
      if (U.chance(clamp(0.42 + 0.5 * xx - 0.06 * Math.min(3, objs), 0.12, 0.92))) {
        poner(donde === 'parl' ? 0.13 + 0.14 * xx : 0.22 + 0.2 * xx); C.Personaje.cambiar(E, { prestigio: 0.3 });
        T.reformaNota(E, c, `Negocias con ${pa.sigla} ${dnd}: se muestran más receptivos.`);
        return { ok: true, msg: `${pa.sigla} se muestra más receptivo al Estatuto${objs ? ` (aún le disgustan ${objs} artículo${objs > 1 ? 's' : ''})` : ''}.` };
      }
      return { ok: true, exito: false, msg: `${pa.sigla} no se deja convencer por ahora.` };
    },
    /* Redacta una versión suavizada de un artículo del borrador: menos rechazo y menos riesgo, pero la mitad de efecto. */
    suavizarArticulo(E, c, id) {
      const r = T.reformaActiva(E, c); if (!r || r.fase !== 'borrador') return { ok: false, msg: 'Sólo se suaviza un artículo mientras es borrador' };
      const it = r.items.find(x => x.id === id); if (!it) return { ok: false, msg: 'Ese artículo no está en el borrador' };
      if (it.suav) return { ok: false, msg: 'Ese artículo ya está suavizado' };
      it.suav = true; const info = T.itemInfo(E, c, id);
      T.reformaNota(E, c, `Suavizas «${info.n}» para atraer a la oposición.`);
      return { ok: true, msg: `Redactas una versión suavizada de «${info.n}»: ${info.comp ? 'pasaría a compartirse con el Estado en vez de transferirse' : 'menos rechazo y menos riesgo ante el Tribunal Constitucional'}, pero con la mitad de efecto.` };
    },
    /* Cuando el paquete no alcanza los tres quintos, se vota artículo por artículo: cae sólo lo que no tiene apoyo. */
    votarArticulos(E, c) {
      const rc = E.esp.ccaa[c], r = T.reformaActiva(E, c); if (!r || r.fase !== 'borrador') return { ok: false, msg: 'No hay borrador que votar' };
      if (!(r.fallos > 0)) return { ok: false, msg: 'La votación por artículos sólo se pide después de que el paquete haya fallado' };
      if (r.items.length < 2) return { ok: false, msg: 'Un estatuto necesita al menos dos artículos' };
      r.fallos++; r.ultParl = E.fecha.t; const caen = [], quedan = [];
      for (const it of r.items.slice()) { const a = T.apoyoReforma(E, c, [it.id], true), si = Math.round(a.si + U.gauss(0, a.tot * 0.02)); (si >= a.req ? quedan : caen).push(it); }
      for (const it of caen) { r.items.splice(r.items.indexOf(it), 1); (r.caidos = r.caidos || []).push(it.id); }
      C.Personaje.cambiar(E, { prestigio: -0.4 });
      const nom = l => l.map(x => '«' + T.itemInfo(E, c, x.id).n + '»').join(', ');
      if (quedan.length < 2) { T.reformaNota(E, c, `Votación por artículos: ${quedan.length ? 'sólo sobrevive ' + nom(quedan) : 'no sobrevive ninguno'}. El borrador sigue abierto.`); return { ok: false, msg: `Votación por artículos: ${caen.length ? 'caen ' + nom(caen) : ''}${quedan.length ? '; sobrevive ' + nom(quedan) : ''}. Con menos de dos artículos no hay estatuto: cabildea y añade otros.` }; }
      r.fase = 'comision'; r.ronda = 1; r.tFase = E.fecha.t; T.estadoResponde(E, c, r);
      T.reformaNota(E, c, `Votación por artículos en el Parlamento: pasan ${quedan.length}${caen.length ? ' y caen ' + caen.length : ''}. Se abre la negociación con el Estado.`);
      C.Noticias.poner(E, 'politica', `El Parlamento de ${nm(c)} aprueba por separado ${quedan.length} artículos de su reforma estatutaria${caen.length ? ' y rechaza ' + caen.length : ''}.`, 'ES');
      return { ok: true, msg: `Pasan ${quedan.length} artículo${quedan.length > 1 ? 's' : ''}${caen.length ? ' (caen ' + nom(caen) + ')' : ''}. Comienza la negociación con el Estado.` };
    },
    /* En las Cortes, retira un artículo del texto para desbloquear la votación: baja el listón territorial y contenta a quien lo rechazaba. */
    retirarArticuloCortes(E, c, id) {
      const rc = E.esp.ccaa[c], x = T.cabCtx(E, c); if (!x || x.donde !== 'cortes') return { ok: false, msg: 'El texto no está ahora en las Cortes' };
      const { r, p } = x, i = (p.estIt || []).findIndex(y => y.id === id); if (i < 0) return { ok: false, msg: 'Ese artículo no está en el texto' };
      if (p.estIt.length <= 1) return { ok: false, msg: 'El texto quedaría vacío' };
      const itR = r.items.find(y => y.id === id), nac = E.paises.ES.partidos.filter(k => E.paises.ES.escanos[k] > 0), ob = itR ? T.objeciones(E, c, [itR], nac) : {}, quienes = nac.filter(k => (ob[k] || []).length);
      p.estIt.splice(i, 1);
      const it = r.items.find(y => y.id === id); if (it) { it.estado = 'cedido'; it.retirado = true; }
      p.ter = clamp(10 + U.suma(p.estIt.map(y => { const z = r.items.find(w => w.id === y.id); return (z ? T.itemEf(E, c, z).dif : 0.4) * (y.recortado ? 0.5 : 1); })) * 14, 10, 90);
      for (const k of quienes) p.apoyo[k] = clamp((p.apoyo[k] || 0) + 0.2, -0.8, 0.8);
      rc.relM = clamp(rc.relM + 1, 0, 100); C.Personaje.cambiar(E, { prestigio: -0.3 });
      const nmA = T.itemInfo(E, c, id).n;
      T.reformaNota(E, c, `Aceptas retirar «${nmA}» del texto en las Cortes para facilitar su aprobación.`);
      C.Noticias.poner(E, 'politica', `El Gobierno de ${nm(c)} acepta retirar «${nmA.toLowerCase()}» de su reforma estatutaria para salvar el resto del texto.`, 'ES');
      return { ok: true, msg: `Retiras «${nmA}» del texto: ${quienes.length ? quienes.map(k => E.partidos[k].sigla).slice(0, 4).join(', ') + ' se muestran más favorables' : 'baja el listón territorial'}.` };
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
        const recurre = esc >= 50 && vivos.some(x => T.itemEf(E, c, x) && T.itemEf(E, c, x).tc >= 0.3) && U.chance(0.75);
        const anul = [];
        if (recurre) for (const x of vivos) { const info = T.itemEf(E, c, x); if (info && U.chance(clamp(info.tc * (0.55 - tcs * 0.5) * (E.esp.cn && E.esp.cn.efectos.competencias ? 0.5 : 1), 0.02, 0.85))) anul.push(x); }
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
  const cabEst = E => { const r = pres(E); if (r !== true) return r; return T.cabCtx(E, E.jugador.region) ? true : 'El Estatuto no está ahora en el Parlamento autonómico ni en las Cortes'; };
  R({ id: 'cabildear_estatuto', nombre: 'Cabildear el Estatuto con un grupo', icono: '🤝', costo: 1, desc: 'Negocia con un grupo del Parlamento autonómico (si es borrador) o de las Cortes (si ya está remitido) para ganar su voto aunque algún artículo no le guste.', disponible: (E, a) => { const r = cabEst(E); if (r !== true) return r; const x = T.cabCtx(E, E.jugador.region), k = a && a.pid; if (k && x) { const t = (x.r.cabT || {})[x.donde + ':' + k]; if (t != null && E.fecha.t - t < ENF_CAB[x.donde]) return 'Acabas de hablar con ese grupo (espera unas semanas)'; } return true; }, ejecutar: (E, a) => T.cabildearEstatuto(E, E.jugador.region, a.pid, false) });
  R({ id: 'contrapartida_estatuto', nombre: 'Ofrecer una contrapartida por el Estatuto', icono: '🎁', costo: 2, desc: 'Compra el voto de un grupo con inversiones o presencia en la comisión de seguimiento: apoyo seguro pero cuesta deuda y prestigio. Una sola vez por grupo.', disponible: (E, a) => { const r = cabEst(E); if (r !== true) return r; const x = T.cabCtx(E, E.jugador.region), k = a && a.pid; if (k && x && (x.r.contra || {})[x.donde + ':' + k]) return 'Ya pactaste una contrapartida con ese grupo'; return true; }, ejecutar: (E, a) => T.cabildearEstatuto(E, E.jugador.region, a.pid, true) });
  R({ id: 'suavizar_articulo', nombre: 'Suavizar un artículo del borrador', icono: '✂️', costo: 1, desc: 'Redacta una versión más moderada: menos rechazo de la oposición y menos riesgo ante el TC, pero con la mitad de efecto.', disponible: E => { const r = pres(E); if (r !== true) return r; const f = T.reformaActiva(E, E.jugador.region); return f && f.fase === 'borrador' ? true : 'Sólo mientras el Estatuto es borrador'; }, ejecutar: (E, a) => T.suavizarArticulo(E, E.jugador.region, a.id) });
  R({ id: 'votar_articulos_estatuto', nombre: 'Pedir la votación por artículos', icono: '🗳', costo: 2, desc: 'Si el paquete no alcanza los tres quintos, el Parlamento vota cada artículo: cae sólo lo que no tiene apoyo y el resto sigue adelante.', disponible: E => { const r = pres(E); if (r !== true) return r; const f = T.reformaActiva(E, E.jugador.region); if (!f || f.fase !== 'borrador') return 'Sólo mientras el Estatuto es borrador'; return f.fallos > 0 ? true : 'Primero hay que intentar el voto del paquete completo'; }, ejecutar: E => T.votarArticulos(E, E.jugador.region) });
  R({ id: 'retirar_articulo_cortes', nombre: 'Retirar un artículo del texto en las Cortes', icono: '✖', costo: 1, desc: 'Cede un artículo conflictivo para que no se hunda todo el Estatuto: baja el listón territorial y contenta a quien lo rechazaba.', disponible: E => { const r = pres(E); if (r !== true) return r; const x = T.cabCtx(E, E.jugador.region); return x && x.donde === 'cortes' ? true : 'El texto no está ahora en las Cortes'; }, ejecutar: (E, a) => T.retirarArticuloCortes(E, E.jugador.region, a.id) });
  R({ id: 'cerrar_acuerdo_estatuto', nombre: 'Cerrar el acuerdo y remitirlo a las Cortes', icono: '✅', costo: 1, desc: 'Da por terminada la negociación con lo pactado.', disponible: pres, ejecutar: E => T.cerrarAcuerdo(E, E.jugador.region) });
})(window.ESP);

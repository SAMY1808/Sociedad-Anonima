/* Reforma constitucional territorial: un gran proyecto de legislatura que une Estatutos, artículo 155, financiación y Senado.
   El Gobierno elige los artículos del texto (o parte de un modelo: federal, autonómico reforzado, recentralizador) → cabildea a los grupos y les compra el voto
   → el Congreso (tres quintos, 210) y el Senado (tres quintos) → referéndum de ratificación → efectos permanentes sobre el resto del juego.
   Estado: E.esp.cn = { ref, hist[], ult, efectos:{artículo: semana} }; ref = { items[], fase:'borrador'|'cortes'|'referendum', cab, cabT, contra, fallos, propId, camp:{si,no}, tVoto }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = () => C.Territorio, Co = C.Congreso;
  const MAX_ITEMS = 7;
  /* Artículos del catálogo: ter = posición territorial (−100 centralista … +100 soberanista), pop = apoyo popular, dif = dificultad. */
  const ARTS = {
    senado_terr: { ic: '🏛', n: 'Senado de las comunidades', ter: 55, pop: 45, dif: 0.55, d: 'El Senado pasa a ser una cámara territorial: cuatro senadores por comunidad, elegidos según su gobierno autonómico.', ef: 'Cambia la composición del Senado: lo deciden los gobiernos autonómicos.' },
    federal: { ic: '🧩', n: 'Estado federal', ter: 65, pop: 40, dif: 0.7, d: 'La Constitución define España como Estado federal y fija el pacto federal.', ef: 'Autogobierno +6 y mejor relación en todas las comunidades; baja el independentismo.' },
    competencias: { ic: '📐', n: 'Lista cerrada de competencias', ter: 25, pop: 55, dif: 0.4, d: 'Se detallan las competencias exclusivas del Estado y de las comunidades.', ef: 'Los artículos de los Estatutos tienen la mitad de riesgo ante el Tribunal Constitucional.' },
    financiacion: { ic: '💶', n: 'Blindaje de la financiación', ter: 30, pop: 50, dif: 0.5, d: 'Se constitucionalizan la ordinalidad y la garantía: ninguna comunidad pierde posiciones.', ef: 'Toda reforma futura de la financiación llevará la garantía de que nadie pierde.' },
    art155: { ic: '⚖️', n: 'Garantías en el artículo 155', ter: 20, pop: 55, dif: 0.45, d: 'Aplicar el 155 exigirá tres quintos del Senado y el dictamen previo del Constitucional.', ef: 'El Senado necesita tres quintos para autorizar un 155.' },
    lenguas: { ic: '🗣', n: 'Lenguas y nacionalidades', ter: 50, pop: 40, dif: 0.55, d: 'Reconocimiento constitucional de las lenguas cooficiales y de las nacionalidades históricas.', ef: 'Mejora la relación y baja el agravio en las comunidades con lengua propia.' },
    referendum: { ic: '🗳️', n: 'Consulta territorial pactada', ter: 85, pop: 28, dif: 0.95, d: 'Una comunidad podrá convocar una consulta vinculante si el Estado la pacta.', ef: 'Las consultas de autodeterminación pactadas dejan de ser suspendidas.' },
    recentraliza: { ic: '🏢', n: 'Recentralización de competencias clave', ter: -70, pop: 40, dif: 0.6, d: 'El Estado recupera educación, sanidad y orden público.', ef: 'Las comunidades pierden competencias; sube el independentismo y la tensión.' },
    cooperacion: { ic: '🤝', n: 'Conferencia de Presidentes constitucional', ter: 20, pop: 58, dif: 0.25, d: 'La Conferencia de Presidentes se recoge en la Constitución con calendario y funciones.', ef: 'Mejora la relación con todas las comunidades.' }
  };
  const MODELOS = {
    federal: { ic: '🧩', n: 'Modelo federal', d: 'Estado federal, Senado territorial, competencias cerradas, financiación blindada, garantías en el 155, lenguas y Conferencia de Presidentes.', items: ['federal', 'senado_terr', 'competencias', 'financiacion', 'art155', 'lenguas', 'cooperacion'] },
    autonomico: { ic: '📐', n: 'Autonómico reforzado', d: 'Más seguridad jurídica sin cambiar el modelo: competencias cerradas, financiación blindada, garantías en el 155 y Conferencia constitucional.', items: ['competencias', 'financiacion', 'art155', 'cooperacion'] },
    recentralizador: { ic: '🏢', n: 'Recentralizador', d: 'El Estado recupera competencias clave y se cierra la lista de competencias.', items: ['recentraliza', 'competencias'] }
  };
  const nombre = c => D().ccaa[c].nombre;
  const pmJ = E => E.paises.ES.gob.pm === 'J' && E.jugador.pais === 'ES';
  const noticia = (E, txt) => C.Noticias.poner(E, 'politica', txt, 'ES', 'central');
  const xJ = E => { const J = E.jugador; return J.atrib.negociacion / 10 * 0.5 + J.atrib.carisma / 10 * 0.5; };

  const Cn = C.Constit = {
    ARTS, MODELOS, MAX_ITEMS,
    asegurar(E) { if (!E.esp.cn) E.esp.cn = { ref: null, hist: [], ult: -999, efectos: {} }; return E.esp.cn; },
    ref(E) { return Cn.asegurar(E).ref; },
    req(E) { return Math.ceil(E.parl.miembros.length * 3 / 5); },
    efecto(E, id) { return !!Cn.asegurar(E).efectos[id]; },
    /* Posición del texto: media de los artículos. */
    texto(ref) { const its = ref.items.map(i => ARTS[i]).filter(Boolean), n = its.length || 1; return { ter: U.suma(its.map(x => x.ter)) / n, pop: U.suma(its.map(x => x.pop)) / n, dif: U.suma(its.map(x => x.dif)) / n, n: its.length }; },
    /* Proyecto «de mentira» para calcular la postura de los grupos con la misma fórmula que el Congreso. */
    pseudo(E, ref) { const tx = Cn.texto(ref), G = E.paises.ES.gob; return { eco: 0, soc: 0, eu: 5, ter: tx.ter, pop: tx.pop, costo: 0, may: 'cons', apoyo: ref.cab, region: null, pacto: ref.pacto || null, autor: { tipo: 'gobierno', pid: G.partido } }; },
    /* Previsión de votos en el Congreso (tres quintos = 210). */
    proyeccion(E, ref) {
      const p = ref.propId && E.proyectos[ref.propId] ? E.proyectos[ref.propId] : Cn.pseudo(E, ref), P = E.paises.ES, cv = Co.calcular(E, p, null, true), req = Math.ceil(cv.total * 3 / 5);
      const por = P.partidos.filter(k => (P.escanos[k] || 0) > 0).map(k => { const po = Co.postura(E, k, p); return { pid: k, n: P.escanos[k], voto: po.voto, s: po.s }; }).sort((a, b) => b.n - a.n);
      return { si: cv.si, no: cv.no, abs: cv.abs, total: cv.total, req, ok: cv.si >= req, por };
    },
    puede(E) {
      const cn = Cn.asegurar(E), t = E.fecha.t;
      if (cn.ref) return 'Ya hay una reforma constitucional en marcha'; if (E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en su etapa ordinaria';
      if (t - cn.ult < 156) return 'Una reforma constitucional necesita una legislatura de por medio desde la última'; if (E.esp.flags.excepcion) return 'No se puede reformar la Constitución durante un estado de excepción';
      return true;
    },
    abrir(E, modelo) {
      const p = Cn.puede(E); if (p !== true) return { ok: false, msg: p }; const cn = Cn.asegurar(E), M = MODELOS[modelo];
      cn.ref = { items: M ? M.items.slice() : [], fase: 'borrador', cab: {}, cabT: {}, contra: {}, fallos: 0, propId: null, camp: { si: 0, no: 0 }, tVoto: null, t: E.fecha.t, pacto: null };
      noticia(E, `El Gobierno abre la reforma constitucional territorial${M ? ' con el ' + M.n.toLowerCase() : ''}.`);
      return { ok: true, msg: M ? `Abres la reforma con el «${M.n}». Ajusta los artículos y cabildea a los grupos: hacen falta ${Cn.req(E)} votos en el Congreso.` : 'Abres la reforma constitucional: elige los artículos.' };
    },
    borrador(E) { const r = Cn.ref(E); return r && r.fase === 'borrador' ? r : null; },
    articulo(E, id) {
      const ref = Cn.borrador(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' }; if (!ARTS[id]) return { ok: false, msg: 'Artículo desconocido' };
      const i = ref.items.indexOf(id); if (i >= 0) ref.items.splice(i, 1); else { if (ref.items.length >= MAX_ITEMS) return { ok: false, msg: `Máximo ${MAX_ITEMS} artículos` }; ref.items.push(id); }
      const pr = Cn.proyeccion(E, ref); return { ok: true, msg: `${i >= 0 ? 'Quitas' : 'Incluyes'} «${ARTS[id].n}»: ${pr.si} votos previstos en el Congreso (hacen falta ${pr.req}).` };
    },
    modelo(E, m) { const ref = Cn.borrador(E); if (!ref || !MODELOS[m]) return { ok: false, msg: 'No hay un borrador de reforma abierto' }; ref.items = MODELOS[m].items.slice(); const pr = Cn.proyeccion(E, ref); return { ok: true, msg: `Cargas el ${MODELOS[m].n}: ${pr.si} votos previstos en el Congreso (hacen falta ${pr.req}).` }; },

    /* Cabildeo: igual que con el Estatuto; en borrador suma al texto (ref.cab) y en las Cortes al proyecto (comparten objeto). */
    cabildear(E, pid, contra) {
      const ref = Cn.ref(E); if (!ref || !['borrador', 'cortes'].includes(ref.fase)) return { ok: false, msg: 'Sólo se cabildea mientras el texto está en borrador o en las Cortes' };
      const P = E.paises.ES, pa = E.partidos[pid]; if (!pa || !(P.escanos[pid] > 0)) return { ok: false, msg: 'Ese grupo no tiene escaños en el Congreso' };
      if (P.gob.coalicion.includes(pid) && !contra) return { ok: false, msg: `${pa.sigla} está en tu Gobierno: ya cuentas con su voto` };
      const cur = ref.cab[pid] || 0, tope = contra ? 1 : 0.9; if (cur >= tope - 0.01) return { ok: false, msg: `${pa.sigla} ya ha dado de sí todo lo que va a dar` }; const x = xJ(E);
      if (contra) {
        if (ref.contra[pid]) return { ok: false, msg: `Ya pactaste una contrapartida con ${pa.sigla}` }; ref.contra[pid] = true;
        const pacto = !ref.pacto && P.escanos[pid] >= 15; E.paises.ES.ec.pol.deficit += pacto ? 0.06 : 0.03; C.Personaje.cambiar(E, { prestigio: pacto ? -1 : -0.4 });
        if (pacto) { ref.pacto = pid; const p = ref.propId && E.proyectos[ref.propId]; if (p) p.pacto = pid; return { ok: true, msg: `Pacto de fondo con ${pa.sigla}: votará a favor de la reforma a cambio de concesiones (más déficit y un coste de prestigio).` }; }
        ref.cab[pid] = clamp(cur + 0.45, 0, tope); return { ok: true, msg: `${pa.sigla} acepta tu contrapartida: su apoyo sube con claridad (algo más de déficit y de coste de prestigio).` };
      }
      if (E.fecha.t - (ref.cabT[pid] != null ? ref.cabT[pid] : -99) < 1) return { ok: false, msg: `Acabas de hablar con ${pa.sigla}: espera una semana` };
      ref.cabT[pid] = E.fecha.t;
      if (U.chance(clamp(0.42 + 0.5 * x, 0.15, 0.92))) { ref.cab[pid] = clamp(cur + 0.22 + 0.2 * x, 0, tope); C.Personaje.cambiar(E, { prestigio: 0.3 }); return { ok: true, msg: `${pa.sigla} se muestra más receptivo a la reforma (cabildeo +${Math.round(ref.cab[pid] * 100)}).` }; }
      return { ok: true, exito: false, msg: `${pa.sigla} no se deja convencer por ahora.` };
    },
    /* Cede un artículo para salvar el texto (en borrador o ya en las Cortes). */
    retirarArticulo(E, id) {
      const ref = Cn.ref(E); if (!ref || !['borrador', 'cortes'].includes(ref.fase)) return { ok: false, msg: 'No hay un texto del que retirar artículos' };
      const i = ref.items.indexOf(id); if (i < 0) return { ok: false, msg: 'Ese artículo no está en el texto' }; if (ref.items.length <= 1) return { ok: false, msg: 'El texto quedaría vacío' };
      ref.items.splice(i, 1);
      if (ref.fase === 'cortes' && ref.propId && E.proyectos[ref.propId]) { const p = E.proyectos[ref.propId], tx = Cn.texto(ref); p.ter = tx.ter; p.pop = tx.pop; p.t = `Reforma constitucional territorial (${tx.n} artículos)`; C.Personaje.cambiar(E, { prestigio: -0.3 }); }
      return { ok: true, msg: `Retiras «${ARTS[id].n}» del texto${ref.fase === 'cortes' ? ' en las Cortes' : ''}.` };
    },
    remitir(E) {
      const ref = Cn.borrador(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' }; if (!ref.items.length) return { ok: false, msg: 'Elige al menos un artículo' };
      if (E.esp.cortes.estado !== 'activa') return { ok: false, msg: 'Las Cortes no están en su etapa ordinaria' };
      const tx = Cn.texto(ref), G = E.paises.ES.gob;
      const p = Co.proponer(E, 'reforma_const_terr', { tipo: 'gobierno', pid: G.partido }, { constTerr: true, ter: tx.ter, pop: tx.pop, t: `Reforma constitucional territorial (${tx.n} artículos)`, d: ref.items.map(i => ARTS[i].n).join(', '), apoyo: ref.cab, pacto: ref.pacto });
      ref.fase = 'cortes'; ref.propId = p.id; noticia(E, 'El Gobierno registra en el Congreso la reforma constitucional territorial.');
      return { ok: true, msg: `Remites la reforma (${tx.n} artículos) al Congreso: necesita ${Cn.req(E)} votos y, después, tres quintos del Senado.` };
    },
    retirar(E) {
      const cn = Cn.asegurar(E), ref = cn.ref; if (!ref || ref.fase === 'referendum') return { ok: false, msg: ref ? 'Ya está convocado el referéndum' : 'No hay reforma en marcha' };
      if (ref.propId && E.proyectos[ref.propId] && Co.ABIERTAS.includes(E.proyectos[ref.propId].etapa)) { const p = E.proyectos[ref.propId]; p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'El Gobierno retira la reforma constitucional' }); }
      cn.hist.unshift({ t: E.fecha.t, n: ref.items.length, res: 'retirada' }); cn.ref = null; return { ok: true, msg: 'Retiras la reforma constitucional.' };
    },

    /* Las Cortes aprueban el texto: referéndum de ratificación en ocho semanas. */
    alAprobarCortes(E, p) {
      const ref = Cn.ref(E); if (!ref || ref.propId !== p.id) return; ref.fase = 'referendum'; ref.tVoto = E.fecha.t + 8; ref.camp = { si: 0, no: 0 };
      noticia(E, 'El Congreso y el Senado aprueban la reforma constitucional territorial: referéndum de ratificación en ocho semanas.');
    },
    rechazada(E, p) {
      const cn = Cn.asegurar(E), ref = cn.ref; if (!ref || ref.propId !== p.id) return;
      cn.hist.unshift({ t: E.fecha.t, n: ref.items.length, res: 'rechazada en las Cortes' }); cn.ref = null; cn.ult = E.fecha.t - 52; noticia(E, 'Las Cortes rechazan la reforma constitucional territorial.');
      if (pmJ(E)) C.Personaje.cambiar(E, { prestigio: -2 }, true);
    },
    vigilar(E) {
      const ref = Cn.ref(E); if (!ref || ref.fase !== 'cortes') return; const p = E.proyectos[ref.propId];
      if (p && (Co.ABIERTAS.includes(p.etapa) || p.etapa === 'sancionada')) return; Cn.rechazada(E, p || { id: ref.propId });
    },
    /* Opinión pública sobre el «sí» (0–1): cada partido apoya más cuanto más cerca está su posición territorial de la del texto. */
    opinion(E, ref) {
      const tx = Cn.texto(ref), P = E.paises.ES; let num = 0, den = 0;
      for (const k of P.partidos) { const w = E.partidos[k].popN || E.partidos[k].pop || 0; if (!w) continue; const d = Math.abs((E.partidos[k].ter || 0) - tx.ter) / 100, ap = clamp(0.85 - 0.6 * d + (tx.pop - 50) / 200, 0.1, 0.95); num += w * ap; den += w; }
      return den ? num / den : 0.5;
    },
    campana(E, lado) {
      const ref = Cn.ref(E); if (!ref || ref.fase !== 'referendum') return { ok: false, msg: 'No hay un referéndum constitucional convocado' }; if (!['si', 'no'].includes(lado)) return { ok: false, msg: 'Elige el sí o el no' };
      if (ref.camp[lado] >= 10) return { ok: false, msg: 'Has agotado la campaña por esa opción' }; const J = E.jugador, x = 1 + (J.atrib.oratoria + J.atrib.carisma) / 14; ref.camp[lado] = Math.min(10, ref.camp[lado] + x); C.Personaje.cambiar(E, { pop: 0.3 });
      return { ok: true, msg: `Haces campaña por el ${lado === 'si' ? 'sí' : 'no'} (+${U.d1(x)}).` };
    },
    votar(E) {
      const cn = Cn.asegurar(E), ref = cn.ref; if (!ref || ref.fase !== 'referendum') return;
      const si = clamp(Cn.opinion(E, ref) * 100 + (ref.camp.si - ref.camp.no) * 0.9 + U.gauss(0, 4), 5, 95), part = clamp(62 + U.gauss(0, 6), 30, 85), gana = si > 50;
      noticia(E, `Referéndum de la reforma constitucional territorial: ${U.d1(si)} % de síes (participación ${U.d1(part)} %). ${gana ? 'Se ratifica la reforma.' : 'La ciudadanía la rechaza.'}`);
      const n = ref.items.length; cn.hist.unshift({ t: E.fecha.t, n, res: gana ? 'ratificada' : 'rechazada en referéndum', si: Math.round(si * 10) / 10 }); if (cn.hist.length > 8) cn.hist.length = 8; cn.ult = E.fecha.t;
      if (gana) Cn.aplicar(E, ref.items.slice()); else if (pmJ(E)) C.Personaje.cambiar(E, { prestigio: -3, pop: -1.5 }, true);
      if (gana && pmJ(E)) C.Personaje.cambiar(E, { prestigio: 8, pop: 2 }, true);
      cn.ref = null;
    },

    /* Efectos permanentes de los artículos ratificados (efectos[id] = semana + 1, para que valga también en la semana 0). */
    aplicar(E, items) {
      const cn = Cn.asegurar(E), cc = E.esp.ccaa, t = E.fecha.t, ids = T().ids();
      for (const id of items) {
        cn.efectos[id] = t + 1;
        switch (id) {
          case 'federal': for (const c of ids) { const rc = cc[c]; rc.relM = clamp(rc.relM + 4, 0, 100); if (rc.indep > 5) rc.indep = Math.max(0, rc.indep - 3); rc.agravio = Math.max(0, rc.agravio - 0.5); } break;   // el autogobierno +6 lo suma calcAut
          case 'senado_terr': Cn.senadoTerritorial(E); break;
          case 'lenguas': for (const c of ids) { if (D().ccaa[c].lengua) { cc[c].relM = clamp(cc[c].relM + 3, 0, 100); cc[c].agravio = Math.max(0, cc[c].agravio - 0.5); } } break;
          case 'referendum': { E.esp.flags.refPactado = t + 1; for (const c of ids) { if (cc[c].indep > 10) cc[c].relM = clamp(cc[c].relM + 5, 0, 100); } const vap = E.partidos.ES_VAP; if (vap) vap.pop += 0.3; if (C.Opinion) C.Opinion.normalizarES(E); break; }
          case 'recentraliza': for (const c of ids) { const rc = cc[c]; for (const k of ['edu', 'sal', 'len', 'uni']) { if (rc.comp[k] === 2) rc.comp[k] = 1; } rc.relM = Math.max(0, rc.relM - (rc.indep > 10 ? 10 : 3)); if ((rc.indep0 || 0) > 5) rc.indep = clamp(rc.indep + 2.2, 0, 100); } break;
          case 'cooperacion': for (const c of ids) cc[c].relM = clamp(cc[c].relM + 2, 0, 100); break;
          case 'financiacion': { const fa = C.Financia && C.Financia.asegurar(E); if (fa) fa.blindada = true; break; }
          default: break;
        }
      }
      if (T().calcAut) ids.forEach(c => T().calcAut(E, c));
    },
    /* Senado territorial: cuatro senadores por comunidad (dos por ciudad autónoma) según su gobierno autonómico. */
    senadoTerritorial(E) {
      const t = {}, ids = T().ids();
      for (const c of ids) {
        const rc = E.esp.ccaa[c], co = rc.gob ? rc.gob.coalicion : [], n = ['CEU', 'MEL'].includes(c) ? 2 : 4; if (!co.length) continue;
        const pesos = {}; co.forEach((k, i) => { pesos[k] = (rc.parl.escanos[k] || 1) * (i === 0 ? 1.4 : 1); }); const e = C.Elecciones.divisores(pesos, n, false);
        for (const k in e) if (e[k]) t[k] = (t[k] || 0) + e[k];
      }
      const total = U.suma(Object.values(t)); E.esp.senado = { escanos: t, elegidos: {}, designados: t, total, mayoria: Math.floor(total / 2) + 1, territorial: true };
    },
    turno(E) { Cn.vigilar(E); const cn = Cn.asegurar(E), ref = cn.ref; if (ref && ref.fase === 'referendum' && E.fecha.t >= ref.tVoto) Cn.votar(E); }
  };

  /* ── Ganchos ── */
  const Tr = C.Territorio, Gen = C.Generales, A = C.Art155;
  if (Tr && Tr.efectoLey) { const f = Tr.efectoLey; Tr.efectoLey = function (E, efecto, p) { if (p && p.constTerr) return Cn.alAprobarCortes(E, p); return f.apply(this, arguments); }; }
  if (Co && Co.alFinalizar) { const f = Co.alFinalizar; Co.alFinalizar = function (E, p, ok) { const r = f.apply(this, arguments); if (p && p.constTerr && !ok) Cn.rechazada(E, p); return r; }; }
  if (Gen && Gen.senado) { const f = Gen.senado; Gen.senado = function (E) { const r = f.apply(this, arguments); if (E.esp.cn && E.esp.cn.efectos.senado_terr) Cn.senadoTerritorial(E); return r; }; }
  if (A && A.senado) { const f = A.senado; A.senado = function (E, c, p) { const r = f.apply(this, arguments); if (E.esp.cn && E.esp.cn.efectos.art155) { const S = E.esp.senado, req = Math.ceil((S.total || U.suma(Object.values(S.escanos))) * 3 / 5); r.mayoria = req; r.ok = r.si >= req; } return r; }; }
  C.Tiempo.registrar('constit', { turno: E => Cn.turno(E) }, 37);

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const PM = E => pmJ(E) ? true : 'Sólo el presidente/a del Gobierno';
  const conRef = fases => E => { const r = PM(E); if (r !== true) return r; const ref = Cn.ref(E); return ref && fases.includes(ref.fase) ? true : 'No hay una reforma constitucional en esa fase'; };
  R({ id: 'abrir_reforma_constitucional', nombre: 'Abrir la reforma constitucional territorial', icono: '📜', costo: 2, desc: 'Presidente/a del Gobierno: abre un gran proyecto de legislatura (federal, autonómico reforzado o recentralizador) que une Estatutos, 155, financiación y Senado.', disponible: E => { const r = PM(E); return r !== true ? r : Cn.puede(E); }, ejecutar: (E, a) => Cn.abrir(E, a.modelo) });
  R({ id: 'modelo_constitucional', nombre: 'Cargar un modelo de reforma', icono: '🧩', costo: 0, desc: 'Sustituye los artículos del borrador por los de un modelo.', disponible: conRef(['borrador']), ejecutar: (E, a) => Cn.modelo(E, a.modelo) });
  R({ id: 'articulo_constitucional', nombre: 'Incluir o quitar un artículo', icono: '➕', costo: 0, desc: 'Añade o quita un artículo del borrador de reforma constitucional.', disponible: conRef(['borrador']), ejecutar: (E, a) => Cn.articulo(E, a.id) });
  R({ id: 'cabildear_constit', nombre: 'Cabildear la reforma constitucional con un grupo', icono: '🤝', desc: 'Negocia con un grupo del Congreso para ganar su voto en la reforma (tres quintos).', disponible: conRef(['borrador', 'cortes']), ejecutar: (E, a) => Cn.cabildear(E, a.pid, false) });
  R({ id: 'contrapartida_constit', nombre: 'Ofrecer una contrapartida por la reforma constitucional', icono: '🎁', costo: 2, desc: 'Compra el voto de un grupo con concesiones (déficit y prestigio). Un grupo grande puede cerrar un pacto de fondo, una vez por texto.', disponible: conRef(['borrador', 'cortes']), ejecutar: (E, a) => Cn.cabildear(E, a.pid, true) });
  R({ id: 'retirar_articulo_constit', nombre: 'Retirar un artículo de la reforma constitucional', icono: '✖', desc: 'Cede un artículo conflictivo para que no se hunda todo el texto.', disponible: conRef(['borrador', 'cortes']), ejecutar: (E, a) => Cn.retirarArticulo(E, a.id) });
  R({ id: 'remitir_reforma_constitucional', nombre: 'Remitir la reforma constitucional al Congreso', icono: '🏛', costo: 2, desc: 'Registra el texto en el Congreso: necesita 210 votos y tres quintos del Senado; después, referéndum.', disponible: conRef(['borrador']), ejecutar: E => Cn.remitir(E) });
  R({ id: 'campana_constit', nombre: 'Hacer campaña en el referéndum constitucional', icono: '📢', desc: 'Pide el sí o el no en el referéndum de ratificación.', disponible: conRef(['referendum']), ejecutar: (E, a) => Cn.campana(E, a.lado) });
  R({ id: 'retirar_reforma_constitucional', nombre: 'Retirar la reforma constitucional', icono: '↩', costo: 0, desc: 'Abandonas la reforma (antes del referéndum).', disponible: conRef(['borrador', 'cortes']), ejecutar: E => Cn.retirar(E) });
})(window.ESP);

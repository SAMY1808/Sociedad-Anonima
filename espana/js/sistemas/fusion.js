/* Fusiones, absorciones y alianzas electorales entre partidos nacionales.
   Estado: E.esp.fus = { hist[], alianzas[{a,b,t0}] }. El partido que conserva su identidad (A) se queda con el id; el otro (B) deja de existir como partido activo. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const TIPOS = { fusion: ['🧬', 'Fusión', 'Nace un partido nuevo con los dos: pierde algo de voto por la mezcla, pero suma estructura y diputados.', 0.34], absorcion: ['🍽', 'Absorción', 'El pequeño se integra en el grande: tu identidad no cambia, pero hay tensiones.', 0.46], alianza: ['🤝', 'Alianza electoral', 'Listas conjuntas hasta las próximas generales: ambos ganan impulso, ambos siguen vivos.', 0.5] };
  const Fu = C.Fusion = {
    TIPOS,
    asegurar(E) { if (!E.esp.fus) E.esp.fus = { hist: [], alianzas: [] }; return E.esp.fus; },
    bloqueado(E) { return E.esp.cortes.estado !== 'activa' || (C.Campana && C.Campana.activa(E)) ? 'No es momento: hay campaña o las Cortes están disueltas' : null; },
    /* ¿Puede A proponer a B esa operación? Devuelve {ok, msg, p}. */
    compat(E, a, b, tipo) {
      const A = E.partidos[a], B = E.partidos[b], P = E.paises.ES; if (!A || !B || a === b || A.amb !== 'nac' || B.amb !== 'nac') return { ok: false, msg: 'Sólo entre partidos nacionales' };
      if (!P.partidos.includes(a) || !P.partidos.includes(b)) return { ok: false, msg: 'Ese partido ya no está activo' }; const bl = Fu.bloqueado(E); if (bl) return { ok: false, msg: bl };
      const dist = U.distIdeo(A, B), maxd = TIPOS[tipo][3], pa = A.popN || A.pop, pb = B.popN || B.pop;
      if (dist > maxd) return { ok: false, msg: `Demasiado distintos ideológicamente (${Math.round(dist * 100)} %, máximo ${Math.round(maxd * 100)} %)` };
      if (Fu.asegurar(E).alianzas.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a))) return { ok: false, msg: 'Ya hay una alianza entre ambos' };
      if (tipo === 'absorcion' && pb > pa * 0.55) return { ok: false, msg: 'Sólo puedes absorber a un partido bastante más pequeño' };
      if (tipo === 'fusion' && Math.min(pa, pb) < Math.max(pa, pb) * 0.25) return { ok: false, msg: 'Para una fusión los tamaños deben ser parecidos: mejor una absorción' };
      const rel = C.Mayorias ? C.Mayorias.asegurar(E).rel[b] || 0 : 0; if (rel < -25) return { ok: false, msg: 'La relación está demasiado rota' };
      const p = clamp(0.2 + (1 - dist / maxd) * 0.4 + rel / 250 + (E.jugador && E.jugador.atrib ? (E.jugador.atrib.negociacion - 3) * 0.03 : 0) + (tipo === 'absorcion' ? 0.1 : 0) + (Fu.asegurar(E).alianzas.some(x => x.hist) ? 0.1 : 0), 0.1, 0.85);
      return { ok: true, p, dist };
    },
    fusionar(E, a, b, tipo, motivo) {
      const P = E.paises.ES, A = E.partidos[a], B = E.partidos[b], J = E.jugador, f = Fu.asegurar(E); if (!A || !B || !P.partidos.includes(b)) return null;
      const pa = A.popN || A.pop, pb = B.popN || B.pop, wa = A.pop / (A.pop + B.pop || 1);
      const k = tipo === 'fusion' ? 0.88 : 0.68;
      // voto por provincia (ponderado) y estructura de la sede
      for (const prov in D().provincias) { const pn = E.esp.pn[prov]; pn[a] = pn[a] * wa + (pn[b] || 1) * (1 - wa); if (E.esp.sede && E.esp.sede.pid === a && E.esp.sede.pn0[prov] != null) E.esp.sede.pn0[prov] = E.esp.sede.pn0[prov] * wa + (E.esp.sede.pn0[prov]) * (1 - wa); }
      const sumaA = A.pop; A.pop = (A.pop + B.pop * (tipo === 'fusion' ? 1 : 0.74)) * (tipo === 'fusion' ? 0.9 : 1); A.base = A.base + B.base * (tipo === 'fusion' ? 0.9 : 0.55);
      if (tipo === 'fusion') { for (const ax of ['eco', 'soc', 'eu', 'ter']) A[ax] = Math.round(A[ax] * wa + B[ax] * (1 - wa)); const sg = (A.sigla[0] + B.sigla[0] + (A.sigla[1] || '')).toUpperCase(); let n = sg, i = 1; while (P.partidos.some(x => E.partidos[x].sigla === n && x !== a)) n = sg.slice(0, 2) + i++; A.nombre = `Unión ${A.nombre.split(/\s+/).slice(-1)[0]}–${B.nombre.split(/\s+/).slice(-1)[0]}`; A.sigla = n; if (E.esp.sede && E.esp.sede.pid === a) { const s = E.esp.sede; for (const ax of ['eco', 'soc', 'eu', 'ter']) s.base[ax] = Math.round(s.base[ax] * wa + B[ax] * (1 - wa)); } }
      A.militantes = Math.round(A.militantes + B.militantes * (tipo === 'fusion' ? 0.9 : 0.7)); A.finanzas = clamp((A.finanzas + B.finanzas) / 2 + 4, 5, 99);
      A.cohesion = clamp(Math.min(A.cohesion, B.cohesion) - (tipo === 'fusion' ? 8 : 4), 15, 99);
      if (C.PartidoInt && J && J.partido === a) { const pi = C.PartidoInt.asegurar(E); pi.fac.critico = clamp(pi.fac.critico + (tipo === 'fusion' ? 8 : 4), 5, 60); pi.fac.oficial = 100 - pi.fac.barones - pi.fac.critico; }
      // diputados
      let dip = 0; if (C.Personas) for (const id of E.parl.miembros.slice()) { const m = E.politicos[id]; if (m && m.p === b && id !== 'J' && C.Personas.mover(E, id, a, tipo === 'fusion' ? 'fusión' : 'absorción')) dip++; }
      // gobierno y bloques
      const g = P.gob; if (g) { if (g.partido === b) g.partido = a; g.coalicion = (g.coalicion || []).map(x => x === b ? a : x).filter((x, i, ar) => ar.indexOf(x) === i); g.apoyoExterno = (g.apoyoExterno || []).map(x => x === b ? a : x).filter((x, i, ar) => ar.indexOf(x) === i && !g.coalicion.includes(x)); }
      // B deja de existir
      B.fusionado = a; B.pop = 0.01; B.base = 0.01; P.partidos = P.partidos.filter(x => x !== b); E.esp.nacionales = E.esp.nacionales.filter(x => x !== b); delete P.escanos[b]; P.partidos.forEach(x => { if (E.partidos[x].postura === undefined) E.partidos[x].postura = 'oposicion'; });
      const lb = E.politicos[B.lider]; if (lb && B.lider !== 'J') { lb.p = a; if (C.Intriga) C.Intriga.sumarLazo(E, B.lider, 25); }
      f.alianzas = f.alianzas.filter(x => x.a !== b && x.b !== b); f.hist.unshift({ t: E.fecha.t, tipo, a: A.sigla, b: B.sigla, nombre: A.nombre, jugador: !!(J && J.partido === a), dip, motivo: motivo || '' }); if (f.hist.length > 12) f.hist.length = 12;
      C.Noticias.poner(E, 'partido', tipo === 'fusion' ? `FUSIÓN: ${B.sigla} y ${A.sigla} se unen en «${A.nombre}» (${A.sigla}).` : `${A.sigla} absorbe a ${B.sigla}${dip ? ` y suma ${dip} diputado(s)` : ''}.`, 'ES');
      C.Opinion.normalizarES(E); if (C.Es && C.Es.agregar) C.Es.agregar(E);
      return { dip, nombre: A.nombre, sigla: A.sigla };
    },
    alianza(E, a, b) { const f = Fu.asegurar(E); f.alianzas.push({ a, b, t0: E.fecha.t }); if (C.Mayorias) { C.Mayorias.cambiarRel(E, b, 10); C.Mayorias.cambiarRel(E, a, 10); } if (C.Intriga) { const s = C.Intriga.asegurar(E); s.vetos = s.vetos.filter(v => !((v.a === a && v.b === b) || (v.a === b && v.b === a))); } C.Noticias.poner(E, 'partido', `${E.partidos[a].sigla} y ${E.partidos[b].sigla} anuncian una alianza electoral.`, 'ES'); return true; },
    proponer(E, tipo, b) {
      const J = E.jugador, a = J.partido; if (J.rol !== 'lider') return { ok: false, msg: 'Sólo el líder del partido puede proponer una operación así' };
      const c = Fu.compat(E, a, b, tipo); if (!c.ok) return c; if (!TIPOS[tipo]) return { ok: false, msg: 'Operación desconocida' };
      if (!U.chance(c.p)) { if (C.Mayorias) C.Mayorias.cambiarRel(E, b, -5); C.Personaje.cambiar(E, { prestigio: -0.6 }, true); return { ok: true, exito: false, msg: `${E.partidos[b].sigla} rechaza tu propuesta de ${TIPOS[tipo][1].toLowerCase()} y la hace pública.` }; }
      if (tipo === 'alianza') { Fu.alianza(E, a, b); if (C.Dilemas) C.Dilemas.registrar(E, 'fusion', `Alianza electoral con ${E.partidos[b].sigla}`, 1.5); return { ok: true, msg: `Cerráis una alianza electoral con ${E.partidos[b].sigla}.` }; }
      const r = Fu.fusionar(E, a, b, tipo); if (!r) return { ok: false, msg: 'La operación no se pudo completar' }; C.Personaje.cambiar(E, { prestigio: tipo === 'fusion' ? 2 : 1.5, pop: 0.5 }, true); if (C.Dilemas) C.Dilemas.registrar(E, 'fusion', `${TIPOS[tipo][1]} con ${E.partidos[b].sigla}`, tipo === 'fusion' ? 2.5 : 2);
      return { ok: true, msg: tipo === 'fusion' ? `Nace «${r.nombre}»: ${r.dip} diputado(s) se suman.` : `Absorbes a ${E.partidos[b].sigla}: ${r.dip} diputado(s) se suman.` };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const f = Fu.asegurar(E), P = E.paises.ES;
      // las alianzas empujan en campaña
      if (f.alianzas.length && C.Campana && C.Campana.activa(E)) for (const x of f.alianzas) { C.Campana.mover(E, x.a, 0.05); C.Campana.mover(E, x.b, 0.05); }
      // fusiones y absorciones entre partidos de la IA (raras)
      if (!Fu.bloqueado(E) && U.chance(0.0012)) {
        const ps = P.partidos.filter(k => E.partidos[k].amb === 'nac' && k !== J.partido && E.partidos[k].lider !== 'J' && (E.partidos[k].popN || E.partidos[k].pop) < 12); const a = U.pick(ps), b = U.pick(ps.filter(k => k !== a));
        if (a && b && E.partidos[a].pop >= E.partidos[b].pop) { const c = Fu.compat(E, a, b, 'absorcion'); if (c.ok && U.chance(0.5)) Fu.fusionar(E, a, b, 'absorcion', 'operación de la IA'); else { const c2 = Fu.compat(E, a, b, 'fusion'); if (c2.ok) Fu.fusionar(E, a, b, 'fusion', 'operación de la IA'); } }
      }
    }
  };
  // Las alianzas se deshacen tras las generales (y dejan buena memoria para una fusión posterior)
  C.Bus.on('elecciones', d => { const E = C.E; if (E && d && d.tipo === 'generales' && E.esp.fus) { for (const x of E.esp.fus.alianzas) x.hist = true; E.esp.fus.pasadas = (E.esp.fus.pasadas || []).concat(E.esp.fus.alianzas); E.esp.fus.alianzas = []; } });
  const R = (id, nombre, icono, desc, costo, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo: 'partido', disponible: E => E.jugador.pais !== 'ES' ? 'Sólo en España' : (E.jugador.rol === 'lider' ? true : 'Sólo el líder del partido'), ejecutar });
  R('proponer_fusion', 'Proponer fusión, absorción o alianza', '🧬', 'Propón a otro partido nacional unir fuerzas (fusión, absorción o alianza electoral).', 2, (E, a) => Fu.proponer(E, a && a.tipo, a && a.pid));
  C.Tiempo.registrar('fusion', { turno: Fu.turno }, 38);
})(window.ESP);

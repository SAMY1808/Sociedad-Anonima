/* Gobiernos autonómicos más vivos: gobierno en funciones, cordón sanitario (vetos que se rompen), bloqueo y repetición de elecciones
   y pactos postelectorales (cabildeo y contrapartidas del candidato). Amplía invaut.js y territorio.js envolviendo sus funciones.
   Estado: E.esp.gau = { roto:{clave:{a,b,c,t,por}}, rep:{c:{n,t,culpa:{pid:peso}}}, hist[] }; durante una investidura rc.inv.neg = { cand, cab, cabT, con }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = C.Territorio, Ej = C.Ejecutivo;
  if (!T || !Ej) return;
  const nom = c => D().ccaa[c].nombre;
  const CONTRA = {
    programa: { ic: '📋', n: 'Parte de su programa', x: 0.28, d: 'Asumes medidas de su programa: su voto cuesta menos, pero tus bases lo notan (prestigio y cohesión del partido).' },
    cargos: { ic: '🪑', n: 'Cargos y consejerías', x: 0.35, d: 'Les ofreces puestos en el Gobierno y en los organismos: es la contrapartida más eficaz, pero el prestigio se resiente.' }
  };
  const MAXCAB = 0.25, PLAZO_FUNC = 8, AFIN_ROTO = 0.42;   // afinidad mínima entre dos partidos que han roto el cordón (equivale a una abstención)
  // Decisiones de gobierno que un Ejecutivo autonómico en funciones no puede tomar (el decreto-ley por urgencia sí)
  const FUNC = ['proponer_ley_aut', 'presupuesto_aut', 'reorganizar_gobierno', 'reclamar_competencia', 'negociar_financiacion', 'politica_fiscal', 'impuesto_propio', 'convenio_ccaa', 'atraer_empresas', 'programa_consejeria', 'reforma_estatuto', 'abrir_reforma_estatuto', 'presentar_reforma_estatuto', 'pedir_fla', 'delegacion_ccaa'];

  const Ga = C.GobAut = {
    CONTRA, MAXCAB, PLAZO_FUNC, AFIN_ROTO, FUNC, _c: null,
    asegurar(E) { if (!E.esp.gau) E.esp.gau = { roto: {}, nroto: 0, rep: {}, hist: [] }; return E.esp.gau; },
    nota(E, txt) { const g = Ga.asegurar(E); g.hist.unshift({ t: E.fecha.t, txt }); if (g.hist.length > 20) g.hist.length = 20; },
    sg: (E, k) => E.partidos[k] ? E.partidos[k].sigla : k,
    /* Ejecuta f con la comunidad c como contexto (los vetos y la afinidad dependen de la región durante una investidura). */
    en(c, f) { const a = Ga._c; Ga._c = c; try { return f(); } finally { Ga._c = a; } },

    /* ── Gobierno en funciones ── */
    enFunciones(E, c) { const rc = E.esp.ccaa[c]; return !!(rc && rc.inv); },
    semFunciones(E, c) { const rc = E.esp.ccaa[c]; return rc && rc.inv ? Math.max(0, E.fecha.t - rc.inv.t0) : 0; },
    limite(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || !['presauto', 'consejero'].includes(J.cargo) || !J.region) return true;
      return Ga.enFunciones(E, J.region) ? 'Tu Gobierno está en funciones: sólo despacha asuntos ordinarios hasta que el Parlamento invista a un presidente/a' : true;
    },

    /* ── Cordón sanitario ── */
    clave(a, b, c) { return (a < b ? a + '|' + b : b + '|' + a) + (c ? '@' + c : ''); },
    roto(E, a, b, c) { const g = E.esp.gau; if (!g || !g.nroto) return false; return !!(g.roto[Ga.clave(a, b)] || (c && g.roto[Ga.clave(a, b, c)])); },
    /* ¿Hay un veto vigente entre dos partidos (en cualquier sentido), contando las rupturas del cordón? */
    hayVeto(E, a, b, c) { return Ga.en(c || null, () => Ej.vetaA(E, a, b) || Ej.vetaA(E, b, a)); },
    /* Partidos a los que veta una parte importante del arco parlamentario (los «apestados»). */
    cordones(E, min) {
      const cnt = {}, v = D().vetos; for (const s in v) for (const t of v[s]) { const a = Ej.id(E, s), b = Ej.id(E, t); if (E.partidos[a] && E.partidos[b]) (cnt[b] = cnt[b] || []).push(a); }
      return Object.keys(cnt).filter(k => cnt[k].length >= (min || 4)).sort((a, b) => cnt[b].length - cnt[a].length).map(k => ({ pid: k, por: cnt[k] }));
    },
    romper(E, a, b, c, por) {
      const g = Ga.asegurar(E), k = Ga.clave(a, b, c); if (g.roto[k]) return false;
      g.roto[k] = { a, b, c: c || null, t: E.fecha.t, por: por || 'IA' }; g.nroto = Object.keys(g.roto).length;
      if (C.Intriga) { C.Intriga.levantar(E, a, b); C.Intriga.levantar(E, b, a); }
      Ga.nota(E, `${Ga.sg(E, a)} y ${Ga.sg(E, b)} rompen el cordón sanitario${c ? ' en ' + nom(c) : ''}.`); return true;
    },
    restaurar(E, a, b, c) { const g = Ga.asegurar(E), k = Ga.clave(a, b, c), r = !!g.roto[k]; delete g.roto[k]; g.nroto = Object.keys(g.roto).length; return r; },
    rotos(E) { const g = E.esp.gau; return g ? Object.values(g.roto) : []; },
    xJ(E) { const J = E.jugador; return J.atrib.negociacion / 10 * 0.6 + J.atrib.carisma / 10 * 0.4; },
    /* El jugador intenta pactar con un partido vetado: si lo logra se rompe el veto entre ambos en todo el país. */
    pactarVetado(E, pid) {
      const J = E.jugador, mio = J.partido, pa = E.partidos[pid]; if (!pa || pid === mio) return { ok: false, msg: 'Elige otro partido' };
      if (Ga.roto(E, mio, pid)) return { ok: false, msg: 'El veto ya está roto' };
      if (!Ga.hayVeto(E, mio, pid)) return { ok: false, msg: `No hay ningún veto entre ${Ga.sg(E, mio)} y ${pa.sigla}` };
      const aff = Ej.afinidad(E, mio, pid), p = clamp(0.05 + 0.75 * aff + 0.2 * Ga.xJ(E), 0.03, 0.85);
      C.Personaje.cambiar(E, { prestigio: -0.4 });
      if (!U.chance(p)) return { ok: true, exito: false, msg: `${pa.sigla} rechaza sentarse a negociar con vosotros (${Math.round(p * 100)} % de probabilidad).` };
      Ga.romper(E, mio, pid, null, 'jugador'); C.Personaje.cambiar(E, { prestigio: -1.2, pop: -0.3 }, true);
      const pm = E.partidos[mio]; pm.cohesion = clamp((pm.cohesion || 60) - 2, 5, 100);
      const v = D().vetos, otros = Object.keys(v).filter(s => v[s].includes(pa.sigla)).map(s => Ej.id(E, s)).filter(k => E.partidos[k] && k !== mio && k !== pid);
      if (C.Mayorias && C.Mayorias.cambiarRel) for (const k of otros.slice(0, 6)) C.Mayorias.cambiarRel(E, k, -1.2);
      if (C.Opinion && C.Opinion.empujeES) C.Opinion.empujeES(E, pid, 0.12);
      C.Noticias.poner(E, 'politica', `${pm.sigla} y ${pa.sigla} rompen el cordón sanitario: ${E.jugador.nombre} abre la puerta a pactar con ${pa.sigla}. Los demás partidos protestan.`, 'ES');
      return { ok: true, msg: `Rompes el veto con ${pa.sigla}: ya podéis pactar investiduras y alcaldías. Tus bases y los demás partidos lo notan.` };
    },
    restaurarVeto(E, pid) {
      const J = E.jugador; if (!Ga.restaurar(E, J.partido, pid)) return { ok: false, msg: 'No habías roto ningún veto con ese partido' };
      C.Personaje.cambiar(E, { prestigio: 0.4 }); return { ok: true, msg: `Restableces el cordón sanitario con ${Ga.sg(E, pid)}.` };
    },

    /* ── Pactos postelectorales: cabildeo y contrapartidas del candidato ── */
    neg(E, c, crear) { const rc = E.esp.ccaa[c], v = rc && rc.inv; if (!v) return null; if (!v.neg && crear) v.neg = { cand: E.jugador.partido, cab: {}, cabT: {}, con: {} }; return v.neg || null; },
    bono(n, p) { return n ? (n.cab[p] || 0) + (n.con[p] ? CONTRA[n.con[p]].x : 0) : 0; },
    puedeNegociar(E, c) {
      const J = E.jugador, rc = E.esp.ccaa[c], v = rc && rc.inv;
      if (!J || J.pais !== 'ES' || !v) return 'No hay una investidura abierta en esa comunidad';
      if (!T.jugadorEnParl(E, c) || !T.esCabezaJ(E, c, J.partido)) return 'Sólo negocia su investidura quien encabeza la lista de su partido en el Parlamento';
      if (!['constitucion', 'consultas', 'nominaJ', 'candidatoJ'].includes(v.estado)) return 'La negociación sólo es posible antes de la votación de investidura';
      if (v.fallidos.includes(J.partido)) return 'Tu partido ya fracasó en esta investidura';
      return true;
    },
    /* Postura prevista de un grupo ante el candidato (veto / no / abstención / sí), incluido lo ya negociado. */
    postura(E, c, cand, k) {
      return Ga.en(c, () => { if (Ej.vetaA(E, k, cand) || Ej.vetaA(E, cand, k)) return 'veto'; const a = Ej.afinidad(E, cand, k); return a >= 0.6 ? 'si' : a >= 0.3 ? 'abs' : 'no'; });
    },
    grupo(E, c, pid) {
      const J = E.jugador, rc = E.esp.ccaa[c], pa = E.partidos[pid];
      if (!pa || !(rc.parl.escanos[pid] > 0) || pid === J.partido) return { ok: false, msg: 'Elige otro grupo del Parlamento' };
      if (Ga.hayVeto(E, J.partido, pid, c)) return { ok: false, msg: `${pa.sigla} y tu partido se vetan: antes hay que romper el veto (Partido → «Pactar con un partido vetado»)` };
      return { ok: true, pa };
    },
    cabildear(E, c, pid) {
      const p = Ga.puedeNegociar(E, c); if (p !== true) return { ok: false, msg: p };
      const g = Ga.grupo(E, c, pid); if (!g.ok) return g;
      const n = Ga.neg(E, c, true), cur = n.cab[pid] || 0, sg = g.pa.sigla;
      if (cur >= MAXCAB - 0.005) return { ok: false, msg: `${sg} ya ha dado de sí todo lo que va a dar` };
      if (E.fecha.t - (n.cabT[pid] != null ? n.cabT[pid] : -99) < 1) return { ok: false, msg: `Acabas de hablar con ${sg}: espera una semana` };
      n.cabT[pid] = E.fecha.t; const x = Ga.xJ(E);
      if (U.chance(clamp(0.40 + 0.45 * x, 0.15, 0.9))) { n.cab[pid] = Math.min(MAXCAB, cur + 0.09 + 0.07 * x); C.Personaje.cambiar(E, { prestigio: 0.2 }); return { ok: true, msg: `${sg} se muestra más receptivo/a a apoyarte (cabildeo +${Math.round(n.cab[pid] * 100)}).` }; }
      return { ok: true, exito: false, msg: `${sg} no se deja convencer por ahora.` };
    },
    contrapartida(E, c, pid, tipo) {
      const p = Ga.puedeNegociar(E, c); if (p !== true) return { ok: false, msg: p };
      const g = Ga.grupo(E, c, pid); if (!g.ok) return g; const K = CONTRA[tipo]; if (!K) return { ok: false, msg: 'Elige una contrapartida' };
      const n = Ga.neg(E, c, true), sg = g.pa.sigla; if (n.con[pid]) return { ok: false, msg: `Ya pactaste una contrapartida con ${sg}` };
      n.con[pid] = tipo; const J = E.jugador, pm = E.partidos[J.partido];
      if (tipo === 'programa') { C.Personaje.cambiar(E, { prestigio: -0.5 }); pm.cohesion = clamp((pm.cohesion || 60) - 1.5, 5, 100); }
      else C.Personaje.cambiar(E, { prestigio: -0.8 });
      return { ok: true, msg: `${sg} acepta tu oferta (${K.n.toLowerCase()}): su apoyo sube con claridad (+${Math.round(K.x * 100)}).` };
    },
    /* Las contrapartidas se pagan: un Gobierno que debe su investidura a pactos es más inestable. */
    factura(E, c, neg) {
      const rc = E.esp.ccaa[c], J = E.jugador, n = neg ? Object.keys(neg.con).length : 0; if (!n || !rc.gob || rc.gob.partido !== J.partido) return;
      rc.gob.estab = clamp(rc.gob.estab - 1.5 * n, 20, 95);
      Ga.nota(E, `${J.nombre} paga ${n} contrapartida${n > 1 ? 's' : ''} para ser investido/a en ${nom(c)}.`);
    },

    /* ── Cordón y bloqueo con la IA ── */
    /* Un candidato de la IA cuya votación fracasaría puede romper el cordón sanitario con el grupo que decide la mayoría. */
    intentarRuptura(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, esc = rc.parl.escanos; if (!v || !v.cand || !v.bloq) return false;
      const cand = v.cand, b = v.bloq;
      const fuera = Object.keys(esc).filter(k => esc[k] > 0 && !b.bloque.includes(k) && Ga.hayVeto(E, cand, k, c) && b.s + esc[k] >= b.may);
      if (!fuera.length) return false;
      // El socio que decide la mayoría y más cerca está ideológicamente
      const dist = k => U.distIdeo(E.partidos[cand], E.partidos[k]); fuera.sort((a, z) => dist(a) - dist(z)); const k = fuera[0];
      const rep = (E.esp.gau && E.esp.gau.rep[c] || {}).n || 0, p = clamp((0.12 + 0.2 * v.fallidos.length + 0.15 * rep + 0.1 * (v.vuelta - 1)) * clamp(1.2 - dist(k), 0.25, 1), 0.03, 0.75);
      if (!U.chance(p)) return false;
      Ga.romper(E, cand, k, c, 'IA'); const nb = T.bloque(E, c, cand);
      if (!nb.bloque.includes(k)) { Ga.restaurar(E, cand, k, c); return false; }
      v.bloq = nb;
      C.Noticias.poner(E, 'politica', `${Ga.sg(E, cand)} rompe el cordón sanitario con ${Ga.sg(E, k)} en ${nom(c)} para reunir la mayoría de la investidura.`, 'ES', 'aut');
      if (C.Opinion && C.Opinion.empujeES) { C.Opinion.empujeES(E, cand, -0.12); C.Opinion.empujeES(E, k, 0.1); }
      return true;
    },
    /* Reparto de la culpa del bloqueo: los candidatos que fracasaron y el mayor grupo que no los apoyó. */
    culpa(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, esc = rc.parl.escanos, tot = U.suma(Object.values(esc)), r = {};
      const fall = v ? v.fallidos.slice() : []; if (v && v.cand) fall.push(v.cand); for (const k of fall) r[k] = 1;
      const mayor = Object.keys(esc).filter(k => !fall.includes(k)).sort((a, b) => esc[b] - esc[a])[0];
      if (mayor && esc[mayor] / tot >= 0.2) r[mayor] = Math.max(r[mayor] || 0, 0.5);
      const J = E.jugador; if (v && v.votoJ === 'no' && J && J.pais === 'ES' && J.partido && T.jugadorEnParl(E, c)) r[J.partido] = Math.max(r[J.partido] || 0, 1);   // bloqueó a propósito
      return r;
    },
    culpar(E, c, pid) {
      const J = E.jugador, g = Ga.asegurar(E), r = g.rep[c]; if (!r) return { ok: false, msg: 'No hay bloqueo ni repetición electoral en esa comunidad' };
      if (!E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige otro partido' }; if (r.culpa[pid] >= 1.5) return { ok: false, msg: 'Ya cargan con toda la culpa' };
      const x = J.atrib.oratoria / 10 * 0.6 + J.atrib.carisma / 10 * 0.4;
      if (!U.chance(clamp(0.45 + 0.4 * x, 0.2, 0.9))) { C.Personaje.cambiar(E, { prestigio: -0.3 }); return { ok: true, exito: false, msg: 'Tu relato no cuaja: nadie se lo cree.' }; }
      r.culpa[pid] = Math.min(1.5, (r.culpa[pid] || 0) + 0.4); if (r.culpa[J.partido]) r.culpa[J.partido] = Math.max(0, r.culpa[J.partido] - 0.3);
      C.Personaje.cambiar(E, { pop: 0.3 }); return { ok: true, msg: `Consigues que la opinión culpe del bloqueo a ${Ga.sg(E, pid)}.` };
    },

    /* Postura del grupo del jugador ante la investidura de otro candidato: facilitar, apoyar o bloquear. */
    puedeVotar(E, c) {
      const J = E.jugador, rc = E.esp.ccaa[c], v = rc && rc.inv;
      if (!J || J.pais !== 'ES' || !v) return 'No hay una investidura abierta en esa comunidad';
      if (!T.jugadorEnParl(E, c) || !T.esCabezaJ(E, c, J.partido)) return 'Sólo fija el voto de su grupo quien lo encabeza en el Parlamento';
      if (v.cand === J.partido || (v.voluntario && ['candidatoJ'].includes(v.estado))) return 'Eres el candidato/a: negocias tu bloque, no tu abstención';
      return true;
    },
    votar(E, c, voto) {
      const p = Ga.puedeVotar(E, c); if (p !== true) return { ok: false, msg: p }; if (!['si', 'abs', 'no'].includes(voto)) return { ok: false, msg: 'Elige apoyar, abstenerte o bloquear' };
      const v = E.esp.ccaa[c].inv, J = E.jugador, pm = E.partidos[J.partido]; if (v.votoJ === voto) return { ok: false, msg: 'Ya habías fijado esa postura' };
      v.votoJ = voto; Ga.sinJ(E, c); pm.cohesion = clamp((pm.cohesion || 60) + (voto === 'no' ? 1 : voto === 'abs' ? -1 : -1.5), 5, 100);
      const b = v.cand && v.bloq ? T.evalBloque(E, c, v.cand, v.bloq.bloque) : null, txt = { si: 'apoyará', abs: 'se abstendrá en', no: 'votará en contra de' }[voto];
      return { ok: true, msg: `Tu grupo ${txt} la investidura${b ? ` (previsión del candidato: ${b.si} a favor, ${b.no} en contra, hacen falta ${b.may} o más síes que noes)` : ''}.` };
    },

    /* Si el jugador fija el voto de su grupo, la IA ya no le cuenta como socio del bloque: apoya, se abstiene o bloquea desde fuera. */
    sinJ(E, c) {
      const rc = E.esp.ccaa[c], v = rc && rc.inv, J = E.jugador; if (!v || !v.votoJ || !v.cand || !v.bloq || v.cand === J.partido || !v.bloq.bloque.includes(J.partido)) return;
      v.bloq = T.evalBloque(E, c, v.cand, v.bloq.bloque.filter(k => k !== J.partido));
    },

    /* Resumen para la pantalla: comunidades con investidura abierta o bloqueo. */
    resumen(E) {
      const g = Ga.asegurar(E), ids = T.ids().filter(c => E.esp.ccaa[c].inv || g.rep[c]);
      return ids.map(c => { const rc = E.esp.ccaa[c], v = rc.inv, r = g.rep[c]; return { c, v, rep: r ? r.n : 0, culpa: r ? r.culpa : {}, func: !!v, sem: Ga.semFunciones(E, c), lim: v && v.t1 != null ? Math.max(0, Math.round(v.t1 + (T.PLAZO || 9) - E.fecha.t)) : null, fallidos: v ? v.fallidos.slice() : [] }; });
    },

    turno(E) {
      for (const c of T.ids()) {
        const rc = E.esp.ccaa[c]; if (!rc.inv || !rc.gob) continue;
        if (Ga.semFunciones(E, c) > PLAZO_FUNC) rc.gob.aprob = clamp(rc.gob.aprob - 0.05, 8, 88);
      }
    }
  };

  /* ── Ganchos ── */
  const env = (nombre, f) => { const o = T[nombre]; if (typeof o === 'function') T[nombre] = f(o); };
  // Vetos: una ruptura del cordón anula el veto fijo, pero no los que el jugador se ha impuesto (los lleva Intriga)
  const vOrig = Ej.vetaA;
  Ej.vetaA = function (E, p, q) { const v = vOrig.apply(this, arguments); return v && (!Ga.roto(E, p, q, Ga._c) || !!(C.Intriga && C.Intriga.vetaDin(E, p, q))); };
  // Afinidad: tras romper el cordón hay un suelo; lo negociado por el jugador suma mientras dura su investidura
  const aOrig = Ej.afinidad;
  Ej.afinidad = function (E, cand, p) {
    let r = aOrig.apply(this, arguments); const c = Ga._c;
    if (r < AFIN_ROTO && Ga.roto(E, cand, p, c)) r = AFIN_ROTO;   // pacto abierto: ya no son enemigos irreconciliables
    if (!c) return r; const rc = E.esp.ccaa[c], n = rc && rc.inv && rc.inv.neg;
    return n && n.cand === cand ? clamp(r + Ga.bono(n, p), 0, 1) : r;
  };
  // La comunidad se conoce durante el cálculo del bloque
  for (const f of ['bloque', 'evalBloque', 'mejorBloque']) env(f, o => function (E, c) { const a = Ga._c; Ga._c = c; try { return o.apply(this, arguments); } finally { Ga._c = a; } });
  // Con el voto fijado, el grupo del jugador no entra en los bloques de la IA
  env('bloque', bl => function (E, c, cand) {
    const b = bl.apply(this, arguments), rc = E.esp.ccaa[c], v = rc && rc.inv, J = E.jugador;
    if (v && v.votoJ && J && cand !== J.partido && b.bloque.includes(J.partido)) return T.evalBloque(E, c, cand, b.bloque.filter(k => k !== J.partido));
    return b;
  });
  // El voto que fija el jugador para su grupo sustituye al que le saldría por afinidad
  env('evalBloque', ev => function (E, c, cand, bloque) {
    const b = ev.apply(this, arguments), rc = E.esp.ccaa[c], v = rc && rc.inv, J = E.jugador;
    if (!v || !v.votoJ || !J || J.partido === cand || (bloque || []).includes(J.partido) || !T.jugadorEnParl(E, c) || !T.esCabezaJ(E, c, J.partido)) return b;
    const esc = rc.parl.escanos[J.partido] || 0; if (!esc) return b;
    const nat = Ga.en(c, () => { const aff = Ej.afinidad(E, cand, J.partido), veta = bloque.some(q => Ej.vetaA(E, J.partido, q)); return !veta && aff >= 0.6 ? 'si' : !veta && aff >= 0.3 ? 'abs' : 'no'; });
    if (nat === v.votoJ) return b;
    if (nat === 'si') b.si -= esc; if (nat === 'no') b.no -= esc; if (v.votoJ === 'si') b.si += esc; if (v.votoJ === 'no') b.no += esc;
    b.exito = b.s >= b.may || b.si > b.no; if (b.s >= b.may) b.ext = []; return b;
  });
  // Votación: la IA puede romper el cordón antes de fracasar
  env('invVotar', iv => function (E, c) {
    const rc = E.esp.ccaa[c], v = rc.inv; Ga.sinJ(E, c);
    if (v && v.cand && v.bloq && !T.esCabezaJ(E, c, v.cand)) { const b = T.evalBloque(E, c, v.cand, v.bloq.bloque); if (b.si < b.may && !(b.si > b.no)) Ga.intentarRuptura(E, c); }
    return iv.apply(this, arguments);
  });
  // Investidura lograda: se pagan las contrapartidas y termina el bloqueo
  env('invInstalar', ii => function (E, c) {
    const rc = E.esp.ccaa[c], v = rc.inv, neg = v && v.neg, voto = v && v.votoJ; const r = ii.apply(this, arguments); Ga.factura(E, c, neg);
    const J = E.jugador; if (voto && ['abs', 'si'].includes(voto) && J && rc.gob && rc.gob.partido !== J.partido) { C.Personaje.cambiar(E, { prestigio: 0.5 }); Ga.nota(E, `${J.nombre} facilita la investidura en ${nom(c)}.`); }
    return r;
  });
  env('instalar', ins => function (E, c, b, inicial) {
    const r = ins.apply(this, arguments), g = E.esp.gau, rep = g && g.rep[c];
    if (rep && !inicial) { C.Noticias.poner(E, 'politica', `Termina el bloqueo en ${nom(c)} tras ${rep.n} repetición${rep.n > 1 ? 'es' : ''} electoral${rep.n > 1 ? 'es' : ''}.`, 'ES', 'aut'); delete g.rep[c]; }
    return r;
  });
  // Sin investidura en dos meses: repetición electoral y reparto de culpas
  env('invDisolver', id0 => function (E, c) {
    const g = Ga.asegurar(E), r = g.rep[c] || { n: 0, t: E.fecha.t, culpa: {} }, J = E.jugador;
    r.n++; r.t = E.fecha.t; r.culpa = Ga.culpa(E, c); g.rep[c] = r;
    const top = Object.keys(r.culpa).sort((a, b) => r.culpa[b] - r.culpa[a]).slice(0, 3).map(k => Ga.sg(E, k)).join(', ');
    C.Noticias.poner(E, 'politica', `REPETICIÓN ELECTORAL en ${nom(c)}${r.n > 1 ? ' (la ' + r.n + '.ª seguida)' : ''}: ningún candidato logra la investidura. La opinión culpa a ${top || 'los partidos'}.`, 'ES', 'aut');
    Ga.nota(E, `Repetición electoral en ${nom(c)} (${r.n}).`);
    if (J && J.pais === 'ES' && J.region === c && C.Eventos && C.Eventos.info) C.Eventos.info(E, '🗳 Repetición electoral', `El Parlamento de ${nom(c)} no logra investir a nadie y se convocan nuevas elecciones. La opinión culpa sobre todo a ${top || 'los partidos'}; la participación bajará. Desde Elecciones → Investidura puedes intentar volcar la culpa en otro partido.`);
    return id0.apply(this, arguments);
  });
  // En las elecciones repetidas se castiga a los culpables y baja la participación
  env('votosReg', vr => function (E, c) {
    const v = vr.apply(this, arguments), r = E.esp.gau && E.esp.gau.rep[c]; if (!r || !r.n) return v;
    const s0 = U.suma(Object.values(v)), f = Math.min(2, r.n); for (const k in r.culpa) if (v[k]) v[k] *= 1 - 0.07 * r.culpa[k] * f;
    const s1 = U.suma(Object.values(v)); if (s1 > 0) for (const k in v) v[k] *= s0 / s1; return v;
  });
  env('simular', sm => function (E, c) { const r = sm.apply(this, arguments), rp = E.esp.gau && E.esp.gau.rep[c]; if (rp && rp.n) r.part = Math.max(40, r.part - 4 * Math.min(2, rp.n)); return r; });
  // El Ejecutivo autonómico de la IA en funciones no lanza programas nuevos
  env('iniciarPrograma', ip => function (E, c, id, ia) { if (ia && Ga.enFunciones(E, c)) return { ok: false, msg: 'Gobierno en funciones' }; return ip.apply(this, arguments); });
  // Las decisiones de gobierno del jugador se bloquean mientras está en funciones
  for (const id of FUNC) { const a = C.Acciones.get(id); if (!a) continue; const d0 = a.disponible; a.disponible = function (E, args) { const r = Ga.limite(E); return r !== true ? r : (d0 ? d0.apply(this, arguments) : true); }; }
  C.Tiempo.registrar('gobaut', { turno: E => Ga.turno(E) }, 36);

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'autonomico' }, o));
  R({ id: 'cabildear_investidura', nombre: 'Cabildear a un grupo para tu investidura', icono: '🤝', desc: 'Candidato/a autonómico/a: negocia con un grupo del Parlamento para acercar su postura (una vez por semana y grupo; no sirve con quien te veta).', disponible: (E, a) => Ga.puedeNegociar(E, (a && a.c) || E.jugador.region), ejecutar: (E, a) => Ga.cabildear(E, a.c || E.jugador.region, a.pid) });
  R({ id: 'contrapartida_investidura', nombre: 'Ofrecer una contrapartida por tu investidura', icono: '🎁', costo: 2, desc: 'Candidato/a autonómico/a: compra el apoyo de un grupo con parte de tu programa o con cargos (una vez por grupo). Tras la investidura se paga con estabilidad.', disponible: (E, a) => Ga.puedeNegociar(E, (a && a.c) || E.jugador.region), ejecutar: (E, a) => Ga.contrapartida(E, a.c || E.jugador.region, a.pid, a.tipo) });
  R({ id: 'voto_investidura_aut', nombre: 'Fijar el voto de tu grupo en la investidura', icono: '🗳', desc: 'Líder de un grupo del Parlamento autonómico: apoya, facilita (abstención) o bloquea la investidura de otro candidato. Bloquear puede llevar a la repetición de elecciones, y la opinión te culparía.', disponible: (E, a) => Ga.puedeVotar(E, (a && a.c) || E.jugador.region), ejecutar: (E, a) => Ga.votar(E, a.c || E.jugador.region, a.voto) });
  R({ id: 'culpar_bloqueo', nombre: 'Culpar a un partido del bloqueo', icono: '👉', desc: 'Tras un bloqueo de la investidura, vuelca la responsabilidad en otro partido: baja su voto en las elecciones repetidas.', disponible: (E, a) => { const c = (a && a.c) || E.jugador.region; return c && E.jugador.pais === 'ES' && E.esp.gau && E.esp.gau.rep[c] ? true : 'No hay una repetición electoral en tu comunidad'; }, ejecutar: (E, a) => Ga.culpar(E, a.c || E.jugador.region, a.pid) });
  R({ id: 'romper_cordon', nombre: 'Pactar con un partido vetado (romper el cordón)', icono: '🔓', costo: 2, grupo: 'partido', desc: 'Intenta romper el veto mutuo con otro partido: si acepta, podéis pactar investiduras y alcaldías; tus bases y los demás partidos reaccionan.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: (E, a) => Ga.pactarVetado(E, a.pid) });
  R({ id: 'restaurar_cordon', nombre: 'Restablecer el cordón sanitario', icono: '🔒', grupo: 'partido', desc: 'Vuelves a vetar a un partido con el que habías roto el veto.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: (E, a) => Ga.restaurarVeto(E, a.pid) });
})(window.ESP);

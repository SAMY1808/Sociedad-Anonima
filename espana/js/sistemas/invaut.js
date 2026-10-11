/* Investidura autonómica por etapas: sesión constitutiva del Parlamento, elección del Presidente de la Cámara, propuesta de candidato,
   debate y votaciones (mayoría absoluta y después simple) y plazo de dos meses antes de la disolución automática.
   El jugador puede presentarse como candidato o, si preside el Parlamento, proponer al candidato. Amplía C.Territorio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, T = C.Territorio;
  const SEM_CONST = 4, SEM_CONSULTA = 2, PLAZO = 9;
  const nom = (E, c) => D().ccaa[c].nombre;
  const sig = (E, k) => E.partidos[k].sigla;

  Object.assign(T, {
    SEM_CONST, SEM_CONSULTA, PLAZO,

    /* Tras unas elecciones: el gobierno anterior sigue en funciones hasta que un candidato sea investido. Devuelve el bloque favorito. */
    abrirInvestidura(E, c) {
      const rc = E.esp.ccaa[c], t = E.fecha.t;
      rc.inv = { estado: 'constitucion', t0: t, tConst: t + SEM_CONST, tNom: null, tVoto: null, fallidos: [], t1: null, cand: null, bloq: null, mesa: null, vuelta: 0, voluntario: false };
      T.limpiarPend(E, c);
      let mejor = T.mejorBloque(E, c);
      if (!mejor) { const k = Object.keys(rc.parl.escanos)[0]; mejor = T.bloque(E, c, k); }
      return mejor;
    },

    limpiarPend(E, c) { const pa = E.esp.pendienteInvAut; if (pa && pa.c === c) E.esp.pendienteInvAut = null; },

    /* ¿Es el jugador la cabeza de lista de este partido en la comunidad? */
    esCabezaJ(E, c, k) {
      const rc = E.esp.ccaa[c], J = E.jugador, p = E.partidos[k]; if (!J) return false;
      return rc.cab[k] === 'J' || (p.amb === 'reg' && p.lider === 'J' && p.region === c);
    },
    /* El jugador está en el Parlamento de la comunidad (elegido en las últimas elecciones). */
    jugadorEnParl(E, c) { const J = E.jugador; return !!(J && J.pais === 'ES' && J.region === c && J.escReg && (E.esp.ccaa[c].parl.escanos[J.partido] || 0) > 0); },

    invTurno(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, t = E.fecha.t; if (!v) return;
      if (v.estado === 'constitucion') { if (t >= v.tConst) T.invConstituir(E, c); }
      else if (v.estado === 'consultas') { if (t >= v.tNom) T.invNominar(E, c); }
      else if (v.estado === 'debate') { if (t >= v.tVoto) T.invVotar(E, c); }
    },

    invConstituir(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, J = E.jugador, esc = rc.parl.escanos;
      const mb = T.mejorBloque(E, c);
      let partido = mb && mb.bloque.length > 1 ? mb.bloque[1] : mb ? mb.cand : Object.keys(esc)[0];
      if (!esc[partido]) partido = Object.keys(esc).sort((a, b) => esc[b] - esc[a])[0];
      let pres = null;
      const cualificado = J && (['lider', 'direccion', 'portavoz'].includes(J.rol) || J.prestigio >= 50);
      if (T.jugadorEnParl(E, c) && partido === J.partido && !T.esCabezaJ(E, c, J.partido) && cualificado) pres = 'J';
      const n = pres === 'J' ? J.nombre : C.Mundo.persona(c).n;
      v.mesa = { partido, pres, n };
      v.estado = 'consultas'; v.tNom = E.fecha.t + SEM_CONSULTA;
      C.Noticias.poner(E, 'politica', `Se constituye el Parlamento de ${nom(E, c)}: ${n} (${sig(E, partido)}) preside la Cámara. Ronda de consultas hasta el ${U.fmtT(v.tNom, true)}.`, 'ES');
      if (pres === 'J') C.Eventos.info(E, '🏛 Presides el Parlamento', `La Cámara te elige presidente/a del Parlamento de ${nom(E, c)}. Tras la ronda de consultas (hasta el ${U.fmtT(v.tNom, true)}) propondrás el candidato a la presidencia de la comunidad.`);
      else if (T.puedePresentarme(E, c)) C.Eventos.info(E, '🏛 Parlamento constituido', `Se constituye el Parlamento de ${nom(E, c)}. Hasta el ${U.fmtT(v.tNom, true)} puedes anunciar tu candidatura a la presidencia desde Elecciones → Investidura.`);
    },

    /* Candidatos posibles, con su mejor bloque, ordenados por posibilidades. */
    invOpciones(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, esc = rc.parl.escanos;
      return Object.keys(esc).filter(k => esc[k] > 0 && !(v ? v.fallidos : []).includes(k)).sort((a, b) => esc[b] - esc[a]).slice(0, 6).map(k => ({ p: k, b: T.bloque(E, c, k), cab: T.cabeza(E, c, k), jug: T.esCabezaJ(E, c, k) }));
    },

    puedePresentarme(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, J = E.jugador;
      return !!(v && (v.estado === 'constitucion' || v.estado === 'consultas') && !v.voluntario && T.jugadorEnParl(E, c) && T.esCabezaJ(E, c, J.partido) && !v.fallidos.includes(J.partido) && !(v.mesa && v.mesa.pres === 'J'));
    },
    presentarme(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv; if (!T.puedePresentarme(E, c)) return false;
      v.voluntario = true;
      C.Noticias.poner(E, 'politica', `${E.jugador.nombre} (${sig(E, E.jugador.partido)}) anuncia que se presentará a la investidura como presidente/a de ${nom(E, c)}.`, 'ES');
      return true;
    },

    /* La Presidencia del Parlamento propone un candidato tras las consultas. */
    invNominar(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, J = E.jugador, t = E.fecha.t;
      if (v.t1 != null && t > v.t1 + PLAZO) return T.invDisolver(E, c, 'por no haber sido investido ningún candidato en dos meses');
      const ops = T.invOpciones(E, c);
      if (!ops.length) return T.invDisolver(E, c, 'por no haber candidatos a la investidura');
      if (v.mesa && v.mesa.pres === 'J' && T.jugadorEnParl(E, c)) { v.estado = 'nominaJ'; E.esp.pendienteInvAut = { c, tipo: 'nominar' }; return; }
      let cand;
      if (v.voluntario && T.jugadorEnParl(E, c) && !v.fallidos.includes(J.partido)) cand = J.partido;
      else { const m = T.mejorBloque(E, c, v.fallidos); cand = m ? m.cand : ops[0].p; }
      T.invProponer(E, c, cand);
    },

    invProponer(E, c, cand, porJ) {
      const rc = E.esp.ccaa[c], v = rc.inv, t = E.fecha.t, lid = T.cabeza(E, c, cand);
      v.cand = cand; v.nomJ = !!porJ; T.limpiarPend(E, c);
      const quien = v.mesa ? (v.mesa.pres === 'J' ? 'El/la presidente/a del Parlamento (tú)' : 'El presidente del Parlamento') : 'La Presidencia del Parlamento';
      if (T.esCabezaJ(E, c, cand) && T.jugadorEnParl(E, c)) {
        v.estado = 'candidatoJ'; E.esp.pendienteInvAut = { c, tipo: 'candidato' };
        C.Noticias.poner(E, 'politica', `${quien.replace(' (tú)', '')} propone a ${lid.n} (${sig(E, cand)}) como candidato/a a la presidencia de ${nom(E, c)}.`, 'ES');
        return;
      }
      v.bloq = T.bloque(E, c, cand); v.estado = 'debate'; v.vuelta = 1; v.tVoto = t + 1;
      C.Noticias.poner(E, 'politica', `${quien.replace(' (tú)', '')} propone a ${lid.n} (${sig(E, cand)}) como candidato/a a la presidencia de ${nom(E, c)}. Debate de investidura el ${U.fmtT(v.tVoto, true)}.`, 'ES');
    },

    invVotar(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, t = E.fecha.t, J = E.jugador;
      const b = T.evalBloque(E, c, v.cand, v.bloq.bloque), lid = T.cabeza(E, c, v.cand), jug = T.esCabezaJ(E, c, v.cand);
      const cand = v.cand;
      if (v.t1 == null) v.t1 = t;
      if (b.si >= b.may) return T.invInstalar(E, c, b, v.vuelta === 1 ? 'es investido/a en primera votación' : 'es investido/a por mayoría simple');
      if (b.si > b.no && v.vuelta === 1) {
        v.vuelta = 2; v.tVoto = t + 1;
        C.Noticias.poner(E, 'politica', `${lid.n} no alcanza la mayoría absoluta (${b.si} de ${b.may}) en la primera votación en ${nom(E, c)}; segunda votación el ${U.fmtT(v.tVoto, true)}.`, 'ES');
        return;
      }
      if (b.si > b.no) return T.invInstalar(E, c, b, 'es investido/a por mayoría simple');
      // Pactos de última hora: los grupos que vetaban acaban absteniéndose (más probable cuantos más candidatos han fracasado). Al jugador no se le regala.
      if (!jug && v.votoJ !== 'no' && U.chance(U.clamp(0.2 + 0.25 * v.fallidos.length + 0.5 * b.si / Math.max(1, b.si + b.no), 0.1, 0.9))) return T.invInstalar(E, c, b, 'es investido/a con la abstención de los grupos que lo vetaban');
      v.fallidos.push(v.cand); v.estado = 'consultas'; v.tNom = t + 1; v.bloq = null; v.cand = null; v.vuelta = 0;
      C.Noticias.poner(E, 'politica', `Fracasa la investidura de ${lid.n} (${sig(E, cand)}) en ${nom(E, c)}: ${b.si} votos a favor y ${b.no} en contra.`, 'ES');
      if (jug) C.Eventos.info(E, '🗳️ Investidura fallida', `Tu investidura como presidente/a de ${nom(E, c)} fracasa (${b.si} votos a favor, ${b.no} en contra). La Presidencia del Parlamento abre nueva ronda; el plazo de dos meses desde la primera votación vence el ${U.fmtT(v.t1 + PLAZO, true)}.`);
    },

    invInstalar(E, c, b, motivo) {
      const rc = E.esp.ccaa[c], v = rc.inv, J = E.jugador;
      const nomJ = v && v.nomJ;
      rc.inv = null; T.limpiarPend(E, c);
      T.instalar(E, c, b, false, motivo);
      rc.relM = T.relObjetivo(E, c);
      if (J && J.pais === 'ES') {
        if (C.Personaje.tras_investidura) C.Personaje.tras_investidura(E, c);
        if (nomJ) C.Personaje.cambiar(E, { prestigio: 2, pop: 1 }, true);
      }
    },

    invDisolver(E, c, motivo) {
      const rc = E.esp.ccaa[c]; rc.inv = null; T.limpiarPend(E, c);
      T.adelantar(E, c, motivo);
    },

    /* ── Decisiones del jugador ── */
    invNominarJugador(E, c, partido) {
      const v = E.esp.ccaa[c].inv; if (!v || v.estado !== 'nominaJ') return false;
      T.invProponer(E, c, partido, true); return true;
    },
    invCandidatoJugador(E, c, bloque) {
      const v = E.esp.ccaa[c].inv; if (!v || v.estado !== 'candidatoJ') return false;
      v.bloq = T.evalBloque(E, c, v.cand, bloque); v.estado = 'debate'; v.vuelta = 1; v.tVoto = E.fecha.t + 1; E.esp.pendienteInvAut = null;
      C.Noticias.poner(E, 'politica', `${E.jugador.nombre} negocia su investidura en ${nom(E, c)}${bloque.length > 1 ? ' con ' + bloque.filter(k => k !== v.cand).map(k => sig(E, k)).join(', ') : ''}. Debate el ${U.fmtT(v.tVoto, true)}.`, 'ES');
      return true;
    },
    invRenunciaJugador(E, c) {
      const v = E.esp.ccaa[c].inv; if (!v || v.estado !== 'candidatoJ') return false;
      v.fallidos.push(v.cand); v.estado = 'consultas'; v.tNom = E.fecha.t + 1; v.cand = null; v.bloq = null; E.esp.pendienteInvAut = null;
      if (v.t1 == null) v.t1 = E.fecha.t;
      C.Noticias.poner(E, 'politica', `${E.jugador.nombre} renuncia a someterse a la investidura en ${nom(E, c)}.`, 'ES');
      return true;
    },

    /* ── Calendario (para la pantalla de Elecciones) ── */
    calendarioAut(E, c) {
      const rc = E.esp.ccaa[c], v = rc.inv, t = E.fecha.t, st = (f, act) => f ? 'hecho' : act ? 'actual' : 'pendiente';
      if (!v) return { c, activo: false, pasos: [
        { n: 'Elecciones autonómicas', t: rc.parl.ult, e: 'hecho' },
        { n: 'Investidura y toma de posesión', t: rc.gob ? rc.gob.formado : null, e: 'hecho', nota: rc.gob ? 'Gobierno de ' + sig(E, rc.gob.partido) + (rc.gob.coalicion.length > 1 ? ' en coalición' : '') : '' },
        { n: 'Próximas elecciones autonómicas', t: rc.parl.proxT, e: 'pendiente' }] };
      const fv = v.vuelta === 2 ? v.tVoto - 1 : v.tVoto != null ? v.tVoto : (v.tNom != null ? v.tNom : v.tConst + SEM_CONSULTA) + 1;
      const pasos = [
        { n: 'Elecciones autonómicas', t: v.t0, e: 'hecho' },
        { n: 'Sesión constitutiva del Parlamento · elección de la Mesa', t: v.tConst, e: st(!!v.mesa, v.estado === 'constitucion'), nota: v.mesa ? 'Preside: ' + v.mesa.n + ' (' + sig(E, v.mesa.partido) + ')' : 'El Gobierno saliente sigue en funciones' },
        { n: 'Consultas y propuesta de candidato', t: v.tNom != null ? v.tNom : v.tConst + SEM_CONSULTA, e: st(v.cand != null || ['debate', 'candidatoJ'].includes(v.estado), ['consultas', 'nominaJ'].includes(v.estado)), nota: v.cand ? 'Candidato: ' + T.cabeza(E, c, v.cand).n + ' (' + sig(E, v.cand) + ')' : v.fallidos.length ? 'Han fracasado: ' + v.fallidos.map(k => sig(E, k)).join(', ') : '' },
        { n: 'Debate y primera votación · mayoría absoluta', t: fv, e: st(v.vuelta === 2, v.estado === 'debate' && v.vuelta === 1 || v.estado === 'candidatoJ') },
        { n: 'Segunda votación · mayoría simple', t: v.vuelta === 2 ? v.tVoto : fv + 1, e: st(false, v.estado === 'debate' && v.vuelta === 2) },
        { n: 'Plazo de dos meses desde la primera votación: si nadie es investido, disolución y nuevas elecciones', t: (v.t1 != null ? v.t1 : fv) + PLAZO, e: 'pendiente', limite: true }];
      return { c, activo: true, v, pasos };
    },

    calendarioCentral(E) {
      const cs = E.esp.cortes, t = E.fecha.t, inv = cs.investidura, Ej = C.Ejecutivo;
      const orden = ['constitucion', 'consultas', 'investidura', 'nominaJ'];
      const idx = Math.max(0, orden.indexOf(cs.estado === 'nominaJ' ? 'consultas' : cs.estado));
      const abierto = orden.includes(cs.estado);
      const lim = (cs.t1 != null ? cs.t1 : (inv ? inv.tVoto : cs.tConsulta != null ? cs.tConsulta + 1 : null)) ;
      if (!abierto) return { activo: false, pasos: cs.estado === 'disueltas' ? [{ n: 'Elecciones generales convocadas', t: cs.proxT, e: 'actual' }, { n: 'Sesión constitutiva de las Cortes', t: cs.proxT + SEM_CONST, e: 'pendiente' }] : [{ n: 'Elecciones generales', t: cs.ultElec, e: 'hecho' }, { n: 'Investidura y Gobierno formados', t: null, e: 'hecho' }, { n: 'Límite de la legislatura / elecciones', t: cs.finMax, e: 'pendiente' }] };
      const pasos = [
        { n: 'Elecciones generales', t: cs.ultElec, e: 'hecho' },
        { n: 'Sesión constitutiva de las Cortes · elección de la Mesa', t: cs.tConst, e: idx > 0 ? 'hecho' : 'actual', nota: cs.mesa ? 'Preside el Congreso: ' + (cs.mesa.presidente === 'J' ? E.jugador.nombre : (E.politicos[cs.mesa.presidente] || {}).n || '—') + ' (' + Ej.sig(E, cs.mesa.partido) + ')' : 'El Gobierno saliente sigue en funciones' },
        { n: 'Ronda de consultas del Rey y propuesta de candidato', t: cs.tConsulta != null ? cs.tConsulta : cs.tConst + 1, e: idx > 1 ? 'hecho' : idx === 1 ? 'actual' : 'pendiente', nota: inv ? 'Candidato: ' + ((E.politicos[E.partidos[inv.cand].lider] || {}).n || Ej.sig(E, inv.cand)) + ' (' + Ej.sig(E, inv.cand) + ')' : (cs.fallidos && cs.fallidos.length ? 'Han fracasado: ' + cs.fallidos.map(k => Ej.sig(E, k)).join(', ') : '') },
        { n: 'Debate y votación de investidura · 176 votos o mayoría simple en segunda votación', t: inv ? inv.tVoto : (cs.tConsulta != null ? cs.tConsulta : cs.tConst) + 1, e: idx === 2 ? 'actual' : 'pendiente' },
        { n: 'Plazo de dos meses desde la primera votación: si nadie es investido, disolución y nuevas elecciones', t: (lim != null ? lim : t) + PLAZO, e: 'pendiente', limite: true }];
      return { activo: true, pasos };
    }
  });
})(window.ESP);

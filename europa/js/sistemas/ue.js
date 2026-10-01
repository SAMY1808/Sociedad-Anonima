/* Unión Europea: Parlamento Europeo, Comisión, Consejo (mayoría cualificada y unanimidad), Consejo Europeo,
   transposición de directivas, ampliación, salida de miembros y relación del Reino Unido. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const clamp = U.clamp;
  const GRUPOS_PRIN = ['IZE', 'VEA', 'SPE', 'LRE', 'DCE', 'CNE', 'PAT', 'ANR'];

  const UE = {
    miembros(E) { return Object.keys(E.paises).filter(id => E.paises[id].estado === 'ue'); },
    esMiembro(E, id) { return E.paises[id].estado === 'ue'; },
    poblacionUE(E) { return U.suma(UE.miembros(E).map(id => D().paises[id].pob)); },

    init(E) {
      E.ue = { pe: null, comision: null, expedientes: {}, pendiente: [], cumbres: [], historico: [], sinVeto: false, eurobonos: false, proxPE: 0, proxCumbre: 0, resumen: null };
      // Los agrarios y regionalistas se afilian al grupo más cercano
      for (const pid in E.partidos) {
        const pa = E.partidos[pid];
        if (pa.arq === 'ext') pa.grupo = ([...pa.id].reduce((h, ch) => h + ch.charCodeAt(0), 0) % 3 === 0) ? 'ANR' : 'PAT';
        else if (pa.arq === 'pop') pa.grupo = pa.eu < -42 ? 'PAT' : 'NI';
        else if (pa.arq === 'agr' || pa.arq === 'reg') {
          let mejor = 'NI', md = 0.46;
          GRUPOS_PRIN.forEach(g => { const d = U.distIdeo(pa, D().grupos[g]); if (d < md) { md = d; mejor = g; } });
          pa.grupo = mejor;
        }
      }
      E.ue.proxPE = U.turnoDe(U.domingo(2029, 5, 2));
      UE.elecPE(E, true);
      UE.nuevaComision(E, true);
      UE.proximaCumbre(E);
      for (let i = 0; i < 4; i++) UE.proponer(E, null, true);
    },

    /* ── Parlamento Europeo ── */
    elecPE(E, inicial) {
      const porPais = {}, grupos = {}, J = E.jugador;
      GRUPOS_PRIN.concat(['NI']).forEach(g => grupos[g] = 0);
      for (const c of UE.miembros(E)) {
        const P = E.paises[c], d = D().paises[c], n = P.meps;
        const crudo = {};
        P.partidos.forEach(pid => {
          const p = E.partidos[pid];
          const gob = P.gob && P.gob.coalicion.includes(pid);
          const prot = ['pop', 'ext', 'nac'].includes(p.arq) ? 1.04 : 1;
          crudo[pid] = p.pop * Math.exp(U.gauss(0, 0.11)) * (gob ? 0.9 : 1) * prot;
        });
        const tot = U.suma(Object.values(crudo)), v = {};
        for (const k in crudo) v[k] = crudo[k] * 100 / tot;
        const elegibles = Object.keys(v).filter(k => v[k] >= Math.min(d.um, 4));
        const w = {}; (elegibles.length ? elegibles : Object.keys(v)).forEach(k => w[k] = v[k]);
        const esc = C.Elecciones.divisores(w, n, false);
        porPais[c] = {};
        for (const pid in esc) if (esc[pid]) { porPais[c][pid] = esc[pid]; grupos[E.partidos[pid].grupo] += esc[pid]; }
      }
      const total = U.suma(Object.values(grupos));
      E.ue.pe = { t: E.fecha.t, escanos: grupos, porPais, total };
      return E.ue.pe;
    },

    /* ── Comisión Europea ── */
    nuevaComision(E, inicial) {
      const pe = E.ue.pe, miembros = UE.miembros(E);
      const g3 = ['DCE', 'SPE', 'LRE'];
      const gp = U.pesado(g3, g => pe.escanos[g] + 1);
      const candidatos = miembros.filter(c => { const gb = E.paises[c].gob; return gb && E.partidos[gb.partido].grupo === gp; });
      const pais = U.pick(candidatos.length ? candidatos : miembros);
      const pers = C.Mundo.persona(pais);
      const centro = { eco: 0, soc: 0, eu: 0 }; let w = 0;
      g3.forEach(g => { const gr = D().grupos[g], x = pe.escanos[g]; centro.eco += gr.eco * x; centro.soc += gr.soc * x; centro.eu += gr.eu * x; w += x; });
      centro.eco /= w; centro.soc /= w; centro.eu /= w;
      const orden = miembros.slice().sort((a, b) => D().paises[b].pob - D().paises[a].pob);
      const carteras = D().carteras.slice(0, 26).map((c, i) => i);
      const barajadas = U.barajar(carteras);
      const comisarios = {};
      orden.forEach((c, i) => {
        const P = E.paises[c], gb = P.gob;
        const pid = gb ? U.pick(gb.coalicion) : P.partidos[0];
        const pr = C.Mundo.persona(c);
        comisarios[c] = { n: pr.n, g: pr.g, pais: c, partido: pid, cartera: barajadas[i % barajadas.length] };
      });
      E.ue.comision = { presidente: { n: pers.n, g: pers.g, pais, grupo: gp }, comisarios, t0: E.fecha.t, centro, agenda: null };
      if (!inicial) C.Noticias.poner(E, 'europa', `Nueva Comisión Europea presidida por ${pers.n} (${D().paises[pais].nombre}, ${D().grupos[gp].sigla}).`);
      if (E.jugador && E.jugador.cargoUE === 'comisario' && comisarios[E.jugador.pais]) { /* se rellena en el evento de nominación */ }
      return E.ue.comision;
    },

    /* ── Expedientes ── */
    abiertos(E) { return Object.values(E.ue.expedientes).filter(x => x.estado === 'negociacion'); },

    proponer(E, tplId, inicial, extra) {
      const hechos = E.ue.historico.filter(h => E.fecha.t - h.t < 100).map(h => h.tpl);
      const abiertos = UE.abiertos(E).map(x => x.tpl);
      let tpl = tplId ? D().expedientes.find(x => x.id === tplId) : null;
      if (!tpl) {
        const cen = E.ue.comision.centro;
        const cand = D().expedientes.filter(x => x.tipo !== 'cumbre' && !abiertos.includes(x.id) && !hechos.includes(x.id));
        tpl = U.pesado(cand, x => Math.exp(-2.8 * U.distIdeo(cen, x)));
      }
      if (!tpl) return null;
      const e = Object.assign({
        id: U.id('X'), tpl: tpl.id, t: tpl.t, tipo: tpl.tipo, s: tpl.s, eco: tpl.eco, soc: tpl.soc, eu: tpl.eu, may: tpl.may, afecta: tpl.afecta, ef: tpl.ef, d: tpl.d,
        estado: 'negociacion', t0: E.fecha.t, tVoto: E.fecha.t + U.ri(inicial ? 3 : 8, inicial ? 12 : 22), lobby: {}, hist: [{ t: E.fecha.t, txt: 'La Comisión presenta la propuesta' }], cons: null, pe: null, resultado: null
      }, extra || {});
      if (E.ue.sinVeto && e.may === 'unan' && e.tipo !== 'cumbre') e.may = 'QMV';
      E.ue.expedientes[e.id] = e;
      if (!inicial) C.Noticias.poner(E, 'europa', `La Comisión propone: ${e.t}.`);
      return e;
    },

    /* Posición del Gobierno de un Estado miembro ante un expediente. */
    posicion(E, c, e) {
      const P = E.paises[c], d = D().paises[c], g = P.gob;
      const cen = C.Mundo.centroide(E, g.coalicion, P.escanos);
      const f = [];
      let s = 0.75 - 2.7 * U.distIdeo(cen, e); f.push(['Afinidad ideológica del Gobierno', s]);
      let inter = 0; (d.int || []).forEach(t => { if (e.afecta && e.afecta[t]) inter += e.afecta[t] * 1.15; });
      if (inter) { s += inter; f.push(['Intereses nacionales', inter]); }
      const eu = (cen.eu / 100) * 0.5 + (e.eu / 100) * (cen.eu > 0 ? 0.3 : -0.1); s += eu; f.push(['Actitud ante la integración', eu]);
      if (e.ef && e.ef.deficit > 0 && P.ec.deuda > 90 && cen.eco > 20) { s -= 0.3; f.push(['Gasto adicional con deuda alta', -0.3]); }
      if (e.ef && e.ef.deficit > 0 && P.ec.deuda < 55 && cen.eco > 25) { s -= 0.25; f.push(['Países frugales', -0.25]); }
      const lb = (e.lobby[c] || 0); if (lb) { s += lb; f.push(['Presión y negociación', lb]); }
      const voto = s > 0.28 ? 'si' : s < -0.12 ? 'no' : 'abs';
      return { s, voto, factores: f };
    },

    cuentaConsejo(E, e, votos) {
      const m = UE.miembros(E), pobTot = UE.poblacionUE(E);
      let si = 0, no = 0, abs = 0, pobSi = 0, pobNo = 0;
      m.forEach(c => { const v = votos[c], pob = D().paises[c].pob; if (v === 'si') { si++; pobSi += pob; } else if (v === 'no') { no++; pobNo += pob; } else abs++; });
      let ok, nota = '';
      if (e.may === 'unan') { ok = no === 0; nota = ok ? 'Unanimidad (sin votos en contra)' : 'Veto de ' + m.filter(c => votos[c] === 'no').map(c => D().paises[c].nombre).slice(0, 4).join(', '); }
      else {
        const reqEst = Math.ceil(m.length * 0.55);
        ok = si >= reqEst && pobSi >= 0.65 * pobTot;
        nota = ok ? 'Mayoría cualificada alcanzada' : (si < reqEst ? 'Faltan Estados (' + si + '/' + reqEst + ')' : 'Falta población (' + U.d1(pobSi / pobTot * 100) + ' % de 65 %)');
        // minoría de bloqueo: 4 Estados que sumen más del 35 %
        if (ok === false && no >= 4 && pobNo > 0.35 * pobTot) nota = 'Minoría de bloqueo';
      }
      return { ok, si, no, abs, pobSi: pobSi / pobTot * 100, pobNo: pobNo / pobTot * 100, nota, req: Math.ceil(m.length * 0.55) };
    },

    votosConsejo(E, e, votoJ) {
      const votos = {}, J = E.jugador;
      UE.miembros(E).forEach(c => { votos[c] = UE.posicion(E, c, e).voto; });
      if (votoJ && J && UE.esMiembro(E, J.pais)) votos[J.pais] = votoJ;
      // En unanimidad: los reticentes a veces ceden a cambio de compensaciones
      if (e.may === 'unan') {
        for (const c in votos) if (votos[c] === 'no' && !(votoJ && J && c === J.pais) && U.chance(e.tipo === 'cumbre' ? 0.7 : 0.5)) { votos[c] = 'abs'; }
      }
      return votos;
    },

    /* Previsión determinista del Consejo (sin concesiones aleatorias), con el voto que daría el jugador. */
    previsionConsejo(E, e, votoJ) {
      const votos = {}, J = E.jugador;
      UE.miembros(E).forEach(c => { votos[c] = UE.posicion(E, c, e).voto; });
      if (votoJ && J && UE.esMiembro(E, J.pais)) votos[J.pais] = votoJ;
      return { votos, cuenta: UE.cuentaConsejo(E, e, votos) };
    },

    votoPE(E, e, votoJ) {
      const pe = E.ue.pe, J = E.jugador;
      let si = 0, no = 0, abs = 0; const porGrupo = {};
      // Línea de cada grupo
      const linea = {};
      GRUPOS_PRIN.concat(['NI']).forEach(g => { const gr = D().grupos[g]; let s = 0.6 - 2.4 * U.distIdeo(gr, e) + ((e.lobby[g] || 0)); if (e.tipo === 'cumbre') s = 0; linea[g] = s; });
      for (const c in pe.porPais) {
        for (const pid in pe.porPais[c]) {
          const n = pe.porPais[c][pid], pa = E.partidos[pid];
          let s = 0.6 - 2.4 * U.distIdeo(pa, e) + linea[pa.grupo] * 0.6 + (E.ue.comision.centro && U.distIdeo(E.ue.comision.centro, e) < 0.25 ? 0.2 : 0);
          // Defensa de los intereses nacionales
          const d = D().paises[c]; (d.int || []).forEach(t => { if (e.afecta && e.afecta[t]) s += e.afecta[t] * 0.45; });
          const v = s > 0.25 ? 'si' : s < -0.1 ? 'no' : 'abs';
          const k = pa.grupo; porGrupo[k] = porGrupo[k] || { si: 0, no: 0, abs: 0 }; porGrupo[k][v] += n;
          if (v === 'si') si += n; else if (v === 'no') no += n; else abs += n;
        }
      }
      if (votoJ && J && J.meps) { if (votoJ === 'si') si++; else if (votoJ === 'no') no++; else abs++; }
      const ok = si > no && si > pe.total * 0.3;
      return { si, no, abs, ok, porGrupo, total: pe.total };
    },

    /* Decide el expediente completo (Consejo + Parlamento) */
    resolver(E, e, votoCons, votoPE) {
      const vc = UE.votosConsejo(E, e, votoCons), cc = UE.cuentaConsejo(E, e, vc);
      e.cons = { votos: vc, ok: cc.ok, si: cc.si, no: cc.no, abs: cc.abs, pobSi: cc.pobSi, nota: cc.nota };
      const pv = UE.votoPE(E, e, votoPE);
      e.pe = { si: pv.si, no: pv.no, abs: pv.abs, ok: pv.ok, porGrupo: pv.porGrupo };
      const ok = cc.ok && pv.ok;
      e.estado = ok ? 'adoptado' : 'rechazado';
      e.resultado = ok ? 'Adoptado' : (!cc.ok ? 'Bloqueado en el Consejo: ' + cc.nota : 'Rechazado por el Parlamento Europeo');
      e.hist.push({ t: E.fecha.t, txt: e.resultado });
      E.ue.historico.unshift({ t: E.fecha.t, tpl: e.tpl, id: e.id, ok });
      if (E.ue.historico.length > 60) E.ue.historico.length = 60;
      if (ok) UE.adoptar(E, e);
      else C.Noticias.poner(E, 'europa', `UE: «${e.t}» no sale adelante. ${e.resultado}.`);
      return e;
    },

    adoptar(E, e) {
      UE.miembros(E).forEach(c => { if (e.ef && Object.keys(e.ef).length) C.Economia.aplicar(E, c, e.ef); });
      C.Noticias.poner(E, 'europa', `UE: se adopta «${e.t}».`);
      const J = E.jugador;
      if (e.tipo === 'directiva' && J && UE.esMiembro(E, J.pais)) UE.crearTransposicion(E, e);
      if (J && J.cargo === 'comisario' && J.cartera !== undefined && D().carteras[J.cartera] && D().carteras[J.cartera][1] === e.s) { C.Personaje.cambiar(E, { prestigio: 4 }, true); }
      if (e.tpl === 'eurobonos') E.ue.eurobonos = true;
      if (e.tpl === 'reforma_tratados') { E.ue.sinVeto = true; C.Noticias.poner(E, 'europa', 'Reforma de los tratados: desaparece la unanimidad en la mayoría de políticas.'); }
      if (e.tpl === 'crisis_energia') C.Economia.choque(E, 0, -0.5);
    },

    /* Directiva adoptada → proyecto de ley de transposición en el país del jugador */
    crearTransposicion(E, e) {
      const J = E.jugador, P = E.paises[J.pais];
      const p = {
        id: U.id('L'), tpl: 'ue:' + e.tpl, t: 'Transposición: ' + e.t, s: e.s, eco: e.eco, soc: e.soc, eu: e.eu, costo: (e.ef && e.ef.deficit) || 0, pop: 48, may: 'simple',
        d: 'Traslada a la legislación nacional la directiva europea «' + e.t + '». Plazo: un año.', autor: { tipo: 'ue', pid: P.gob.partido }, etapa: 'registro', t0: E.fecha.t, tEtapa: E.fecha.t, apoyo: {},
        hist: [{ t: E.fecha.t, txt: 'Registrado: obligación de transposición' }], dur: 0, ue: e.id
      };
      E.proyectos[p.id] = p;
    },
    transposicion(E, p, ok) {
      const J = E.jugador, P = E.paises[J.pais];
      if (ok) { P.ue.rel = clamp(P.ue.rel + 0.8, 0, 100); return; }
      P.ue.rel = clamp(P.ue.rel - 2, 0, 100); P.gob.aprob -= 0.3; P.ec.pol.deficit += 0.04; C.Personaje.cambiar(E, { capEU: -1.5 });
      C.Noticias.poner(E, 'europa', `Bruselas abre un procedimiento de infracción contra ${D().paises[J.pais].nombre} por no transponer una directiva.`, J.pais);
    },

    /* ── Consejo Europeo ── */
    proximaCumbre(E) {
      const y0 = U.hoy().getUTCFullYear(); let t = null;
      for (let y = y0; y <= y0 + 2 && t === null; y++) for (const m of D().cumbresMeses) { const tt = U.turnoDe(U.domingo(y, m - 1, 3)); if (tt > E.fecha.t) { t = tt; break; } }
      E.ue.proxCumbre = t || E.fecha.t + 13;
    },

    cumbre(E) {
      const J = E.jugador, miembros = UE.miembros(E);
      const cands = D().expedientes.filter(x => x.tipo === 'cumbre' && !E.ue.historico.slice(0, 4).some(h => h.tpl === x.id));
      const elegidos = [];
      for (let i = 0; i < 2 && cands.length; i++) { const x = U.pesado(cands.filter(c => !elegidos.includes(c)), c => 1); if (x) elegidos.push(x); }
      const lista = [];
      elegidos.forEach(tpl => {
        const extra = {};
        if (tpl.id === 'ampliacion') {
          const cs = Object.keys(E.paises).filter(c => E.paises[c].estado === 'candidato' && E.paises[c].ue.progreso < 100 && !E.paises[c].ue.congelada);
          const cand = U.pesado(cs, c => (E.paises[c].ue.progreso + 10) * (J && J.pais === c ? 1.6 : 1));
          if (!cand) return;
          extra.candidato = cand; extra.t = 'Avance en la adhesión de ' + D().paises[cand].nombre;
          extra.eco = 0; extra.soc = 0; extra.eu = 50;
        }
        const e = UE.proponer(E, tpl.id, true, Object.assign({ tVoto: E.fecha.t, estado: 'cumbre', cumbre: true }, extra));
        if (e) lista.push(e);
      });
      E.ue.cumbres.unshift({ t: E.fecha.t, expedientes: lista.map(e => e.id) });
      if (E.ue.cumbres.length > 12) E.ue.cumbres.length = 12;
      C.Noticias.poner(E, 'europa', `Cumbre del Consejo Europeo en Bruselas: ${lista.map(e => e.t).join('; ') || 'sin dosieres'}.`);
      lista.forEach(e => {
        const juega = J && C.Personaje.representaEnUE(E) && UE.esMiembro(E, J.pais);
        if (juega) E.ue.pendiente.push({ exp: e.id, rol: 'cumbre' }); else UE.cerrarCumbre(E, e, null);
      });
      UE.proximaCumbre(E);
    },

    cerrarCumbre(E, e, votoJ) {
      const vc = UE.votosConsejo(E, e, votoJ), cc = UE.cuentaConsejo(E, e, vc);
      e.cons = { votos: vc, ok: cc.ok, si: cc.si, no: cc.no, abs: cc.abs, pobSi: cc.pobSi, nota: cc.nota };
      e.estado = cc.ok ? 'adoptado' : 'rechazado';
      e.resultado = cc.ok ? 'Acordado por consenso' : cc.nota;
      e.hist.push({ t: E.fecha.t, txt: e.resultado });
      E.ue.historico.unshift({ t: E.fecha.t, tpl: e.tpl, id: e.id, ok: cc.ok });
      if (cc.ok) {
        UE.adoptar(E, e);
        if (e.tpl === 'ampliacion' && e.candidato) UE.avanzarCandidato(E, e.candidato, true);
      } else C.Noticias.poner(E, 'europa', `Consejo Europeo: sin acuerdo sobre «${e.t}» (${e.resultado}).`);
      return e;
    },

    /* ── Ampliación ── */
    avanzarCandidato(E, id, cumbre) {
      const P = E.paises[id], u = P.ue;
      u.progreso = Math.min(100, u.progreso + 9); u.clusters = Math.min(6, u.clusters + 1); u.rel = clamp(u.rel + 5, 0, 100);
      C.Noticias.poner(E, 'europa', `${D().paises[id].nombre} abre un nuevo grupo de capítulos de negociación (${U.n(u.progreso)} % del camino).`, id);
      if (u.progreso >= 100) UE.adherir(E, id);
    },

    adherir(E, id) {
      const P = E.paises[id], d = D().paises[id];
      P.estado = 'ue'; P.meps = d.meps || Math.round(clamp(d.pob * 1.1, 5, 40)); P.ue.progreso = 100;
      C.Noticias.poner(E, 'europa', `🎉 ${d.nombre} se convierte en el Estado miembro número ${UE.miembros(E).length} de la Unión Europea.`, id);
      UE.elecPE(E, true);
      const c = E.ue.comision; const pr = C.Mundo.persona(id);
      c.comisarios[id] = { n: pr.n, g: pr.g, pais: id, partido: P.gob ? P.gob.partido : P.partidos[0], cartera: 26 };
      if (E.jugador && E.jugador.pais === id) { C.Eventos.info(E, '🇪🇺 ¡Adhesión!', `${d.nombre} ingresa en la Unión Europea. Tu país tiene ya asiento en el Consejo, en el Parlamento Europeo y en la Comisión.`); C.Personaje.log(E, `${d.nombre} se une a la UE.`); }
      C.Economia.aplicar(E, id, { crec: 0.4 });
    },

    salir(E, id) {
      const P = E.paises[id], d = D().paises[id];
      P.estado = 'exue'; P.meps = 0; P.ue.rel = 35; P.ue.progreso = 0;
      delete E.ue.comision.comisarios[id];
      UE.elecPE(E, true);
      C.Economia.aplicar(E, id, { crec: -0.5, paro: 0.3 }); C.Economia.choque(E, -0.2, 0);
      C.Noticias.poner(E, 'europa', `💥 ${d.nombre} abandona la Unión Europea tras un referéndum.`, id);
      const J = E.jugador;
      if (J && J.pais === id) { C.Eventos.info(E, '💥 Salida de la UE', `${d.nombre} deja de ser miembro. Pierdes tu voz en el Consejo y los diputados europeos de tu país abandonan la Eurocámara.`); if (['comisario', 'mep'].includes(J.cargo)) { J.cargo = 'activista'; J.cargoUE = null; J.meps = null; } C.Personaje.sincronizar(E); }
    },

    /* Referéndum europeo en un país: permanecer (miembros) o integrarse (no miembros). */
    referendum(E, id) {
      const P = E.paises[id], d = D().paises[id], g = P.gob;
      const cen = C.Mundo.centroide(E, g.coalicion, P.escanos);
      const miembro = P.estado === 'ue';
      const apoyo = 50 + d.elec.eu * 0.26 + (cen.eu - d.elec.eu) * 0.08 + (P.ue.rel - 50) * 0.12 + U.gauss(0, 6) + (miembro ? 0 : -2) + (P.ec.crec - P.ec.base.crec) * 1.2;
      const si = apoyo >= 50;
      const txt = miembro ? (si ? `${U.d1(apoyo)} % vota permanecer en la Unión Europea.` : `${U.d1(100 - apoyo)} % vota abandonar la Unión Europea.`)
                          : (si ? `${U.d1(apoyo)} % vota a favor de la integración europea.` : `${U.d1(100 - apoyo)} % rechaza la integración europea.`);
      C.Noticias.poner(E, 'europa', `Referéndum en ${d.nombre}: ${txt}`, id);
      if (miembro && !si) UE.salir(E, id);
      else if (!miembro && si) { P.ue.rel = 85; if (P.estado === 'exue') { P.estado = 'candidato'; P.ue.progreso = 78; P.ue.ritmo = 0.45; P.ue.congelada = false; } else P.ue.progreso = Math.min(100, P.ue.progreso + 15); }
      else if (!miembro && !si) P.ue.rel = clamp(P.ue.rel - 20, 0, 100);
      if (E.jugador && E.jugador.pais === id) C.Eventos.info(E, '🗳️ Resultado del referéndum europeo', txt + (miembro ? (si ? ' El país seguirá siendo miembro.' : ' El país abandona la Unión.') : (si ? ' Se abre el camino a la adhesión.' : ' Se aleja la adhesión.')));
    },

    /* ── Ciclo semanal ── */
    turno(E) {
      const J = E.jugador, ue = E.ue;
      // Propuestas
      if (UE.abiertos(E).length < 5 && U.chance(0.14)) UE.proponer(E);
      // Votaciones de expedientes
      UE.abiertos(E).forEach(e => {
        if (E.fecha.t < e.tVoto) return;
        const juegaCons = J && UE.esMiembro(E, J.pais) && (C.Personaje.representaEnUE(E) || (J.cargo === 'ministro' && UE.ministroDelSector(E, e)));
        const juegaPE = J && J.cargo === 'mep';
        if (juegaCons || juegaPE) { if (!ue.pendiente.some(x => x.exp === e.id)) { ue.pendiente.push({ exp: e.id, rol: juegaPE ? 'pe' : 'consejo' }); e.estado = 'pendiente'; } }
        else UE.resolver(E, e, null, null);
      });
      // Cumbre
      if (E.fecha.t >= ue.proxCumbre) UE.cumbre(E);
      // Elecciones europeas
      if (E.fecha.t >= ue.proxPE) UE.celebrarPE(E);
      // Candidatos y antiguos miembros
      for (const id in E.paises) {
        const P = E.paises[id], u = P.ue;
        if (P.estado === 'candidato') {
          const cen = C.Mundo.centroide(E, P.gob.coalicion, P.escanos);
          if (E.fecha.t % 26 === 0) {
            if (u.congelada && cen.eu > 28) { u.congelada = false; C.Noticias.poner(E, 'europa', `${D().paises[id].nombre} descongela su proceso de adhesión tras el cambio de rumbo de su Gobierno.`, id); }
            else if (!u.congelada && cen.eu < -10 && U.chance(0.25)) { u.congelada = true; C.Noticias.poner(E, 'europa', `${D().paises[id].nombre} vuelve a congelar su adhesión.`, id); }
          }
          if (!u.congelada) u.progreso = Math.min(99.5, u.progreso + u.ritmo * 6 / 52 * (0.4 + Math.max(0, cen.eu + 20) / 80));
        } else if (P.estado === 'exue') {
          const cen = C.Mundo.centroide(E, P.gob.coalicion, P.escanos);
          u.rel = clamp(u.rel + cen.eu / 4000 + U.gauss(0, 0.05), 0, 100);
        }
      }
      // Revisión de directivas pendientes y archivo de expedientes antiguos
      for (const id in ue.expedientes) { const e = ue.expedientes[id]; if (e.estado !== 'negociacion' && e.estado !== 'pendiente' && E.fecha.t - e.t0 > 130) delete ue.expedientes[id]; }
    },

    ministroDelSector(E, e) {
      const J = E.jugador; if (J.cargo !== 'ministro') return false;
      const m = D().ministerios.find(x => x.id === J.ministerio); return !!m && (m.sector === e.s || m.id === 'eur');
    },

    celebrarPE(E) {
      const J = E.jugador;
      const anterior = E.ue.pe ? JSON.parse(JSON.stringify(E.ue.pe.escanos)) : {};
      const pe = UE.elecPE(E, false);
      E.ue.proxPE = E.fecha.t + 260;
      const g = Object.entries(pe.escanos).sort((a, b) => b[1] - a[1]);
      C.Noticias.poner(E, 'europa', `Elecciones europeas: ${g.slice(0, 3).map(([k, n]) => D().grupos[k].sigla + ' ' + n).join(', ')}.`);
      UE.nuevaComision(E, false);
      // Resultado personal del jugador candidato
      if (J && J.candidatoPE) {
        const p = E.partidos[J.partido], n = (pe.porPais[J.pais] && pe.porPais[J.pais][J.partido]) || 0;
        const pos = 1 + Math.floor((1 - clamp(J.prestigio * 0.6 + J.capEU * 0.4, 0, 100) / 100) * (n + 4));
        J.candidatoPE = false;
        if (pos <= n) UE.hacerseMEP(E, p.grupo);
        else C.Eventos.info(E, '🇪🇺 Elecciones europeas', `Tu partido obtiene ${n} escaños, pero tu puesto en la lista (${pos}) no llega. Sigues en la política nacional.`);
      } else if (J && J.cargo === 'mep') {
        // Reelección de un eurodiputado en activo
        const p = E.partidos[J.partido], n = (pe.porPais[J.pais] && pe.porPais[J.pais][J.partido]) || 0;
        const pos = 1 + Math.floor((1 - clamp(J.prestigio * 0.6 + J.capEU * 0.4, 0, 100) / 100) * (n + 4));
        if (pos > n) { J.cargo = 'activista'; J.cargoUE = null; J.meps = null; C.Personaje.log(E, 'Pierdes tu escaño en el Parlamento Europeo.'); C.Personaje.sincronizar(E); C.Eventos.info(E, '🇪🇺 Pierdes tu escaño europeo', 'No logras reelección en la Eurocámara. Regresas a la política nacional.'); }
        else { J.meps = { grupo: p.grupo, pais: J.pais }; C.Personaje.log(E, 'Eres reelegido/a eurodiputado/a.'); }
      }
      if (J) E.elecciones.pePendiente = { t: E.fecha.t, antes: anterior, despues: JSON.parse(JSON.stringify(pe.escanos)), deleg: J && pe.porPais[J.pais] ? JSON.parse(JSON.stringify(pe.porPais[J.pais])) : null, presidente: E.ue.comision.presidente.n, pais: J.pais };
      C.Bus.emit('elecciones-europeas', {});
    },

    hacerseMEP(E, grupo) {
      const J = E.jugador;
      C.Personaje.alUE(E, 'mep'); J.meps = { grupo, pais: J.pais };
      C.Personaje.log(E, `Eres elegido/a eurodiputado/a por ${D().paises[J.pais].nombre} y te integras en ${D().grupos[grupo].sigla}.`);
      C.Noticias.poner(E, 'europa', `${J.nombre} (${E.partidos[J.partido].sigla}) llega a la Eurocámara.`, J.pais);
      C.Eventos.info(E, '🇪🇺 Eurodiputado/a', `Eres elegido/a para el Parlamento Europeo y te unes al grupo ${D().grupos[grupo].nombre}. Podrás votar los expedientes y ser ponente.`);
    },

    /* El jugador decide su voto en un expediente pendiente. */
    decidir(E, idx, voto) {
      const it = E.ue.pendiente[idx]; if (!it) return null;
      const e = E.ue.expedientes[it.exp];
      E.ue.pendiente.splice(idx, 1);
      if (!e) return null;
      if (it.rol === 'cumbre') UE.cerrarCumbre(E, e, voto);
      else if (it.rol === 'consejo') UE.resolver(E, e, voto, null);
      else UE.resolver(E, e, null, voto);
      // Efectos políticos del voto del jugador
      const J = E.jugador;
      if (it.rol !== 'pe') {
        const P = E.paises[J.pais], cen = C.Mundo.centroide(E, P.gob.coalicion, P.escanos);
        const afin = (voto === 'si') === (U.distIdeo(cen, e) < 0.4);
        P.gob.aprob = clamp(P.gob.aprob + (voto === 'no' ? 0.2 : 0), 5, 90);
        if (voto === 'no' && e.eu > 20) { C.Personaje.cambiar(E, { capEU: -1.5 }); } else if (voto === 'si' && e.eu > 20) C.Personaje.cambiar(E, { capEU: 1 });
        // Cada Estado afectado reacciona
        if (e.afecta) (D().paises[J.pais].int || []).forEach(t => { if (e.afecta[t] && ((e.afecta[t] > 0) !== (voto === 'si')) && Math.abs(e.afecta[t]) > 0.4) { P.gob.aprob -= 0.6; } });
        void afin;
      }
      C.Personaje.cambiar(E, { prestigio: 0.8, capEU: 0.5 });
      return e;
    }
  };

  /* ── Acciones relacionadas con Europa ── */
  const A = (id, o) => C.Acciones.registrar(Object.assign({ id, costo: 1 }, o));
  const f = (E, ...ks) => U.suma(ks.map(k => E.jugador.atrib[k])) / (10 * ks.length);

  A('viajar_bruselas', {
    nombre: 'Viajar a Bruselas', icono: '✈️', costo: 2, grupo: 'europa', desc: 'Reuniones con comisarios, eurodiputados y diplomáticos: gana capital europeo.',
    ejecutar(E) {
      const x = f(E, 'negociacion', 'carisma');
      C.Personaje.cambiar(E, { capEU: 3 + 4 * x, prestigio: 0.5 });
      return { ok: true, msg: 'Una semana de contactos en Bruselas amplía tu red.' };
    }
  });
  A('cabildear_exp', {
    nombre: 'Cabildear un expediente europeo', icono: '🔀', costo: 2, grupo: 'europa', desc: 'Presiona a gobiernos y grupos parlamentarios europeos para apoyar o frenar un texto.',
    disponible(E) { return E.jugador.capEU >= 12 ? true : 'Necesitas capital europeo 12+ (viaja a Bruselas)'; },
    ejecutar(E, a) {
      const e = E.ue.expedientes[a.exp]; if (!e || e.estado !== 'negociacion') return { ok: false, msg: 'Elige un expediente abierto' };
      const J = E.jugador, x = f(E, 'negociacion', 'oratoria'), signo = a.lado === 'no' ? -1 : 1;
      const miembro = UE.esMiembro(E, J.pais);
      const p = clamp(0.3 + 0.4 * x + J.capEU / 250 - (miembro ? 0 : 0.1), 0.15, 0.88);
      if (U.chance(p)) {
        const objetivos = U.barajar(UE.miembros(E)).slice(0, 5);
        if (miembro && !objetivos.includes(J.pais)) objetivos.push(J.pais);
        objetivos.forEach(c => { e.lobby[c] = (e.lobby[c] || 0) + signo * (0.14 + 0.16 * x) * (c === J.pais ? 1.6 : 1); });
        GRUPOS_PRIN.forEach(g => { if (U.chance(0.4)) e.lobby[g] = (e.lobby[g] || 0) + signo * 0.1 * (0.5 + x); });
        C.Personaje.cambiar(E, { capEU: 1, prestigio: 0.8 });
        return { ok: true, msg: `Tu campaña de presión ${signo > 0 ? 'refuerza' : 'debilita'} «${e.t}».` };
      }
      C.Personaje.cambiar(E, { capEU: 0.2 }); return { ok: true, exito: false, msg: 'Las capitales apenas te escuchan esta vez.' };
    }
  });
  A('ponencia', {
    nombre: 'Redactar una ponencia en la Eurocámara', icono: '📑', costo: 2, grupo: 'europa', desc: 'Sólo eurodiputados: dirige el informe y mueve a los grupos.',
    disponible(E) { return E.jugador.cargo === 'mep' ? true : 'Sólo para eurodiputados'; },
    ejecutar(E, a) {
      const e = E.ue.expedientes[a.exp]; if (!e || e.estado !== 'negociacion') return { ok: false, msg: 'Elige un expediente abierto' };
      const J = E.jugador, x = f(E, 'gestion', 'negociacion'), signo = a.lado === 'no' ? -1 : 1;
      GRUPOS_PRIN.forEach(g => { e.lobby[g] = (e.lobby[g] || 0) + signo * (0.1 + 0.2 * x) * (g === J.meps.grupo ? 1.4 : 0.8); });
      C.Personaje.cambiar(E, { prestigio: 2 + 2 * x, capEU: 1.5 });
      return { ok: true, msg: `Tu ponencia mueve a la Eurocámara ${signo > 0 ? 'a favor' : 'en contra'} de «${e.t}».` };
    }
  });
  A('dialogo_ue', {
    nombre: 'Diálogo con Bruselas', icono: '🤝', costo: 2, grupo: 'europa', desc: 'Para países fuera de la UE: mejora la relación y el avance hacia la adhesión.',
    disponible(E) { const s = E.paises[E.jugador.pais].estado; return s === 'ue' ? 'Tu país ya es miembro' : (E.jugador.cargo === 'activista' ? 'Necesitas un cargo' : true); },
    ejecutar(E) {
      const P = E.paises[E.jugador.pais], x = f(E, 'negociacion', 'gestion');
      const fat = E.jugador.fatiga || 1;
      P.ue.rel = clamp(P.ue.rel + (0.5 + 0.5 * x) * fat, 0, 100);
      if (P.estado === 'candidato') P.ue.progreso = Math.min(99, P.ue.progreso + (0.06 + 0.06 * x) * fat);
      C.Personaje.cambiar(E, { capEU: 3, prestigio: 1 });
      return { ok: true, msg: 'Las conversaciones con la Comisión avanzan.' };
    }
  });
  A('proponer_exp', {
    nombre: 'Proponer un texto a la Comisión', icono: '🇪🇺', costo: 2, grupo: 'europa', desc: 'Sólo comisarios: impulsa un expediente de tu cartera.',
    disponible(E) { return E.jugador.cargo === 'comisario' ? true : 'Sólo comisarios/as'; },
    ejecutar(E, a) {
      const J = E.jugador, tpl = D().expedientes.find(x => x.id === a.tpl && x.tipo !== 'cumbre'); if (!tpl) return { ok: false, msg: 'Elige un texto' };
      if (UE.abiertos(E).some(x => x.tpl === tpl.id)) return { ok: false, msg: 'Ya está en trámite' };
      const e = UE.proponer(E, tpl.id, false); if (e) { e.lobby[J.pais] = 0.2; e.autorJ = true; }
      C.Personaje.cambiar(E, { prestigio: 2, capEU: 1 });
      return { ok: true, msg: `La Comisión presenta tu iniciativa: «${tpl.t}».` };
    }
  });
  A('candidatura_pe', {
    nombre: 'Pedir un puesto en la lista europea', icono: '🗳️', costo: 2, grupo: 'europa', desc: 'Aspira a una plaza en las próximas elecciones europeas (sólo Estados miembros).',
    disponible(E) {
      const J = E.jugador;
      if (!UE.esMiembro(E, J.pais)) return 'Tu país no es miembro de la UE';
      if (J.cargo === 'mep' || J.candidatoPE) return J.candidatoPE ? 'Ya eres candidato/a' : 'Ya eres eurodiputado/a';
      if (E.ue.proxPE - E.fecha.t > 104) return 'Faltan más de dos años para las europeas';
      return J.prestigio >= 30 ? true : 'Necesitas prestigio 30+';
    },
    ejecutar(E) {
      const J = E.jugador, x = f(E, 'negociacion', 'carisma');
      if (U.chance(clamp(0.35 + (J.prestigio - 30) / 100 + x * 0.3, 0.2, 0.9))) { J.candidatoPE = true; C.Personaje.log(E, 'Tu partido te incluye en su lista para las elecciones europeas.'); return { ok: true, msg: 'Figurarás en la lista europea del partido.' }; }
      return { ok: true, exito: false, msg: 'La dirección te pide esperar.' };
    }
  });
  A('volver_nacional', {
    nombre: 'Volver a la política nacional', icono: '↩️', costo: 1, grupo: 'europa', desc: 'Renuncia a tu cargo europeo y regresa a tu país.',
    disponible(E) { return ['mep', 'comisario'].includes(E.jugador.cargo) ? true : 'No ocupas un cargo europeo'; },
    ejecutar(E) { const J = E.jugador; J.cargo = 'activista'; J.cargoUE = null; J.meps = null; J.cartera = undefined; C.Personaje.log(E, 'Regresas a la política nacional.'); C.Personaje.sincronizar(E); return { ok: true, msg: 'Vuelves a casa.' }; }
  });

  C.UE = UE;
  C.Tiempo.registrar('ue', UE, 40);
})(window.EUROPA);

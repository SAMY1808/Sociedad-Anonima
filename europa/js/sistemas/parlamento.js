/* Parlamento del país del jugador: diputados individuales, proyectos de ley, votaciones con factores trazables. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const ABIERTAS = ['registro', 'comision', 'pleno', 'pleno_pend'];
  const MAX_VOTOS_SEMANA = 2;

  const Pa = {
    init(E) {
      const op = E.meta.opts; if (!op) return;
      const id = op.pais, P = E.paises[id];
      E.parl = { miembros: [], mesa: {}, pendienteVoto: [], auto: false, anuales: {} };
      for (const pid of P.partidos) {
        const n = P.escanos[pid] || 0, p = E.partidos[pid];
        const lid = E.politicos[p.lider];
        for (let i = 0; i < n; i++) {
          const mp = (i === 0 && lid) ? lid : Pa.nuevoDiputado(E, pid);
          E.parl.miembros.push(mp.id);
        }
      }
    },

    /* Proyectos ya en marcha al comenzar la partida. */
    sembrar(E) {
      const J = E.jugador, P = E.paises[J.pais], g = P.gob;
      const cen = C.Mundo.centroide(E, g.coalicion, P.escanos);
      for (let i = 0; i < 3; i++) {
        const tpl = Pa.elegirPlantilla(E, i < 2 ? cen : E.partidos[U.pick(P.partidos.filter(k => (P.escanos[k] || 0) > 0))]);
        if (!tpl) continue;
        const p = Pa.proponer(E, tpl.id, i < 2 ? { tipo: 'gobierno', pid: g.partido } : { tipo: 'partido', pid: U.pick(P.partidos.filter(k => !g.coalicion.includes(k) && (P.escanos[k] || 0) > 0)) });
        p.etapa = 'comision'; p.dur = U.ri(1, 3); p.tEtapa = 0; p.hist.push({ t: 0, txt: 'Pasa a la comisión' });
      }
    },

    nuevoDiputado(E, pid) {
      const p = E.partidos[pid];
      return C.Mundo.politico(E, { pais: p.pais, partido: pid, eco: p.eco + U.gauss(0, 14), soc: p.soc + U.gauss(0, 14), eu: p.eu + U.gauss(0, 14),
        d: U.gauss(78 + (p.cohesion - 70) * 0.3, 11) });
    },

    /* Reajusta los escaños de cada partido tras unas elecciones (conserva a los diputados existentes). */
    recomponer(E, antes) {
      const J = E.jugador, id = J.pais, P = E.paises[id];
      const nuevos = [];
      for (const pid of P.partidos) {
        const n = P.escanos[pid] || 0;
        const actuales = E.parl.miembros.filter(i => E.politicos[i] && E.politicos[i].p === pid && i !== 'J');
        // Prioridad: líder, ministros, mayor ambición
        actuales.sort((a, b) => (b === E.partidos[pid].lider ? 1e3 : 0) + E.politicos[b].a - ((a === E.partidos[pid].lider ? 1e3 : 0) + E.politicos[a].a));
        const jEn = (pid === J.partido && J.electo);
        const cupo = n - (jEn ? 1 : 0);
        let mant = actuales.slice(0, Math.max(0, cupo));
        // Los que no repiten se retiran del mapa
        actuales.slice(Math.max(0, cupo)).forEach(i => { const q = E.politicos[i]; if (q && E.partidos[pid].lider !== i) delete E.politicos[i]; else mant.push(i); });
        while (mant.length < cupo) mant.push(Pa.nuevoDiputado(E, pid).id);
        // El líder siempre ocupa escaño
        const lid = E.partidos[pid].lider;
        if (n > 0 && lid !== 'J' && E.politicos[lid] && !mant.includes(lid) && !(jEn && lid === 'J')) { mant.pop(); mant.unshift(lid); }
        nuevos.push(...mant);
        if (jEn) nuevos.push('J');
      }
      E.parl.miembros = nuevos.filter((v, i, a) => a.indexOf(v) === i);
      E.parl.pendienteVoto = [];
      Object.values(E.proyectos).forEach(p => { if (ABIERTAS.includes(p.etapa) && p.autor.tipo !== 'jugador') { p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'Decae por fin de la legislatura' }); } else if (ABIERTAS.includes(p.etapa)) { p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'Decae por fin de la legislatura' }); } });
    },

    /* Colocación inicial del jugador en el hemiciclo. */
    colocarJugador(E) {
      const J = E.jugador, P = E.paises[J.pais], n = P.escanos[J.partido] || 0;
      E.politicos.J = { id: 'J', n: J.nombre, g: J.g, e: J.edad, pais: J.pais, p: J.partido, eco: J.eco, soc: J.soc, eu: J.eu, d: 60, a: 80, pr: 50, c: 50 + J.atrib.carisma * 3, i: 40 + J.atrib.integridad * 5, rel: 0 };
      if (n > 0 && J.cargo !== 'activista') {
        J.electo = true;
        const propios = E.parl.miembros.filter(i => E.politicos[i] && E.politicos[i].p === J.partido && i !== E.partidos[J.partido].lider);
        const quitar = J.rol === 'lider' ? E.partidos[J.partido].lider : (propios[propios.length - 1] || E.partidos[J.partido].lider);
        const ix = E.parl.miembros.indexOf(quitar);
        if (ix >= 0) E.parl.miembros[ix] = 'J'; else E.parl.miembros.push('J');
        if (J.rol === 'lider') { const old = E.partidos[J.partido].lider; if (old !== 'J' && E.politicos[old]) delete E.politicos[old]; }
      } else { J.electo = false; }
      if (J.rol === 'lider') E.partidos[J.partido].lider = 'J';
    },

    miembros(E) { return E.parl.miembros.map(i => E.politicos[i]).filter(Boolean); },
    escanosDe(E, pid) { return E.paises[E.jugador.pais].escanos[pid] || 0; },

    /* ── Proyectos ── */
    reqOK(E, tpl, id) {
      const P = E.paises[id || E.jugador.pais];
      switch (tpl.req) {
        case undefined: return true;
        case 'ue': return P.estado === 'ue';
        case 'euro': return P.euro === true;
        case 'ue_noeuro': return P.estado === 'ue' && P.euro === false;
        case 'candidato': return P.estado === 'candidato';
        case 'uk': return P.estado === 'exue';
        default: return true;
      }
    },

    abiertos(E) { return Object.values(E.proyectos).filter(p => ABIERTAS.includes(p.etapa)); },

    proponer(E, tplId, autor, extra) {
      const tpl = D().leyes.find(l => l.id === tplId); if (!tpl) return null;
      const p = {
        id: U.id('L'), tpl: tplId, t: tpl.t, s: tpl.s, eco: tpl.eco, soc: tpl.soc, eu: tpl.eu, costo: tpl.costo, pop: tpl.pop, may: tpl.may || 'simple', d: tpl.d,
        autor, etapa: 'registro', t0: E.fecha.t, tEtapa: E.fecha.t, apoyo: {}, hist: [{ t: E.fecha.t, txt: 'Registrado en la Cámara' }], dur: 0
      };
      Object.assign(p, extra || {});
      E.proyectos[p.id] = p;
      return p;
    },

    /* Elige una plantilla acorde con una ideología (para el Gobierno y la oposición). */
    elegirPlantilla(E, centro, preferirSector) {
      const id = E.jugador.pais, P = E.paises[id];
      const hechas = P.flags.leyes || (P.flags.leyes = {});
      const abiertos = Pa.abiertos(E).map(p => p.tpl);
      const cand = D().leyes.filter(l => Pa.reqOK(E, l) && !abiertos.includes(l.id) && !(hechas[l.id] && E.fecha.t - hechas[l.id] < 120));
      return U.pesado(cand, l => Math.exp(-3.4 * U.distIdeo(centro, l)) * (preferirSector && l.s === preferirSector ? 2 : 1));
    },

    /* Postura de un partido ante un proyecto: devuelve {s, voto, factores} */
    postura(E, pid, p) {
      const J = E.jugador, P = E.paises[J.pais], pa = E.partidos[pid], g = P.gob;
      const f = [];
      const dist = U.distIdeo(pa, p);
      let s = 0.8 - 2.5 * dist; f.push(['Afinidad ideológica', s]);
      const enGob = g.coalicion.includes(pid), ext = g.apoyoExterno.includes(pid);
      const a = p.autor;
      let x = 0;
      if (a.tipo === 'gobierno') x = enGob ? 0.9 : ext ? 0.35 : -0.35;
      else if (a.tipo === 'ue') x = enGob ? 0.5 : 0;
      else if (a.tipo === 'partido' || a.tipo === 'jugador') {
        const ap = a.tipo === 'jugador' ? J.partido : a.pid;
        x = pid === ap ? 1.5 : (enGob ? (ap && g.coalicion.includes(ap) ? 0.5 : -0.4) : (ap && g.coalicion.includes(ap) ? -0.1 : 0.15));
      }
      if (x) { s += x; f.push([a.tipo === 'gobierno' ? (enGob ? 'Proyecto del Gobierno' : 'Proyecto del Gobierno (oposición)') : a.tipo === 'ue' ? 'Obligación europea' : 'Autoría del proyecto', x]); }
      const pp = (p.pop - 50) / 100 * (enGob ? 0.7 : 1.0); s += pp; f.push(['Opinión pública', pp]);
      const fis = -Math.max(0, p.costo) * (pa.eco / 100) * 0.45; if (Math.abs(fis) > 0.01) { s += fis; f.push(['Coste fiscal', fis]); }
      const lb = p.apoyo[pid] || 0; if (lb) { s += lb; f.push(['Cabildeo', lb]); }
      const voto = s > 0.35 ? 'si' : s < -0.05 ? 'no' : 'abs';
      return { s, voto, factores: f };
    },

    /* Probabilidad de que un diputado siga la línea de su partido (≈ 93 % de media). */
    fidelidad(m, pa) { return U.clamp(0.93 + (m.d - 75) / 300 + (pa.cohesion - 70) / 400, 0.6, 0.995); },

    /* Calcula una votación completa. votoJ: voto del jugador (o null para seguir la línea del partido). */
    calcular(E, p, votoJ, sinRuido) {
      const J = E.jugador, P = E.paises[J.pais];
      const posturas = {};
      P.partidos.forEach(pid => { if ((P.escanos[pid] || 0) > 0) posturas[pid] = Pa.postura(E, pid, p); });
      const votos = {}, desertores = [];
      let si = 0, no = 0, abs = 0, aus = 0;
      const total = E.parl.miembros.length;
      for (const mid of E.parl.miembros) {
        const m = E.politicos[mid]; if (!m) continue;
        const pos = posturas[m.p]; if (!pos) { votos[mid] = 'abs'; abs++; continue; }
        const pa = E.partidos[m.p];
        let v;
        if (mid === 'J') {
          v = votoJ || pos.voto;
        } else {
          const ausente = !sinRuido && U.chance(0.03);
          if (ausente) { v = 'aus'; }
          else {
            const sigue = Pa.fidelidad(m, pa) + (P.gob.coalicion.includes(m.p) ? 0.03 * (P.gob.estab - 50) / 50 : 0);
            if (sinRuido ? true : U.chance(sigue)) v = pos.voto;
            else {
              const dist = U.distIdeo(m, p);
              let u = 0.8 - 2.5 * dist + (p.autor.tipo === 'jugador' ? m.rel / 100 * 0.9 : 0) + (p.pop - 50) / 100 * 0.6 + (p.apoyo[m.p] || 0) * 0.3;
              v = u > 0.3 ? 'si' : u < -0.05 ? 'no' : 'abs';
              if (v !== pos.voto) desertores.push({ pol: mid, voto: v, linea: pos.voto, razon: Math.abs(m.eco - pa.eco) + Math.abs(m.soc - pa.soc) > 45 ? 'Su ideología está lejos de la del partido' : 'Prioriza su criterio' });
            }
          }
        }
        votos[mid] = v;
        if (v === 'si') si++; else if (v === 'no') no++; else if (v === 'abs') abs++; else aus++;
      }
      let ok;
      if (p.may === 'calificada') ok = si >= Math.ceil(total * 2 / 3);
      else if (p.may === 'absoluta') ok = si > total / 2;
      else ok = si > no;
      return { posturas, votos, desertores, si, no, abs, aus, total, ok };
    },

    /* Proyección determinista (sin ruido) para mostrar la «distancia de mayoría». */
    proyectar(E, p) {
      const total = E.parl.miembros.length;
      const P = E.paises[E.jugador.pais];
      let si = 0, no = 0, abs = 0;
      P.partidos.forEach(pid => {
        const n = P.escanos[pid] || 0; if (!n) return;
        const ps = Pa.postura(E, pid, p), pa = E.partidos[pid];
        const miembrosP = E.parl.miembros.filter(i => E.politicos[i] && E.politicos[i].p === pid);
        const f = U.suma(miembrosP.map(i => Pa.fidelidad(E.politicos[i], pa))) / Math.max(1, miembrosP.length);
        const sigue = n * f;
        const pr = ps.voto;
        if (pr === 'si') { si += sigue; no += (n - sigue) * 0.4; abs += (n - sigue) * 0.6; } else if (pr === 'no') { no += sigue; si += (n - sigue) * 0.4; abs += (n - sigue) * 0.6; } else { abs += sigue; si += (n - sigue) * 0.5; no += (n - sigue) * 0.5; }
      });
      const need = p.may === 'calificada' ? Math.ceil(total * 2 / 3) : p.may === 'absoluta' ? Math.floor(total / 2) + 1 : Math.floor((si + no) / 2) + 1;
      return { si: Math.round(si), no: Math.round(no), abs: Math.round(abs), total, need, dist: Math.round(si - need) };
    },

    enRecesion(E) {
      const m = U.hoy().getUTCMonth(), d = U.hoy().getUTCDate();
      return m === 7 || (m === 11 && d > 20) || (m === 0 && d < 7);
    },

    turno(E) {
      const J = E.jugador; if (!J) return;
      const P = E.paises[J.pais], g = P.gob;
      const ab = Pa.abiertos(E);
      if (E.fecha.t % 52 === 0) {
        for (const id in E.proyectos) { const p = E.proyectos[id]; if (!ABIERTAS.includes(p.etapa) && E.fecha.t - p.tEtapa > 208) delete E.proyectos[id]; }
        for (const id in E.proyectos) { const p = E.proyectos[id]; if (!p.votacion) continue; if (!E.votaciones.some(v => v.id === p.votacion)) p.votacion = null; }
      }
      // Iniciativas del Gobierno
      const delGob = ab.filter(p => p.autor.tipo === 'gobierno').length;
      if (delGob < 3 && U.chance(0.2) && ab.length < 14 && !Pa.enRecesion(E)) {
        const cen = C.Mundo.centroide(E, g.coalicion, P.escanos);
        let tpl = null;
        for (let k = 0; k < 6 && !tpl; k++) {
          const c = Pa.elegirPlantilla(E, cen); if (!c) break;
          const prueba = { eco: c.eco, soc: c.soc, eu: c.eu, costo: c.costo, pop: c.pop, may: c.may || 'simple', autor: { tipo: 'gobierno', pid: g.partido }, apoyo: {} };
          if (Pa.proyectar(E, prueba).dist >= E.parl.miembros.length * 0.03 || U.chance(0.08)) tpl = c;      // el Gobierno no suele registrar leyes que sabe perdidas
        }
        if (tpl) {
          const p = Pa.proponer(E, tpl.id, { tipo: 'gobierno', pid: g.partido });
          if (P.partidos.length) C.Noticias.poner(E, 'parlamento', `El Gobierno registra «${p.t}».`, J.pais);
        }
      }
      // Iniciativas de otros partidos
      if (U.chance(0.07) && ab.length < 14 && !Pa.enRecesion(E)) {
        const pid = U.pesado(P.partidos.filter(k => (P.escanos[k] || 0) > 0), k => P.escanos[k] * (g.coalicion.includes(k) ? 0.4 : 1));
        if (pid) { const tpl = Pa.elegirPlantilla(E, E.partidos[pid]); if (tpl) { const p = Pa.proponer(E, tpl.id, { tipo: 'partido', pid }); C.Noticias.poner(E, 'parlamento', `${E.partidos[pid].sigla} registra «${p.t}».`, J.pais); } }
      }
      // Avance de los proyectos
      let votosSemana = 0;
      Pa.abiertos(E).forEach(p => {
        const dt = E.fecha.t - p.tEtapa;
        if (p.etapa === 'registro' && dt >= 1) { p.etapa = 'comision'; p.tEtapa = E.fecha.t; p.dur = U.ri(2, 5); p.hist.push({ t: E.fecha.t, txt: 'Pasa a la comisión' }); }
        else if (p.etapa === 'comision' && dt >= p.dur) {
          if (p.autor.tipo !== 'gobierno' && p.autor.tipo !== 'ue') {
            const pr = Pa.proyectar(E, p);
            if (pr.si < (pr.si + pr.no) * 0.38 && U.chance(0.6)) { p.etapa = 'rechazada'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'Rechazado en comisión: sin apoyos suficientes' }); Pa.alFinalizar(E, p, false); return; }
          }
          p.etapa = 'pleno'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'Dictamen de la comisión: pasa al pleno' });
        }
        else if (p.etapa === 'pleno' && !Pa.enRecesion(E) && votosSemana < MAX_VOTOS_SEMANA) {
          if (p.autor.tipo === 'gobierno' && !p.retirable) {
            p.retirable = true;
            const pr = Pa.proyectar(E, p);
            if (pr.dist < -E.parl.miembros.length * 0.02 && U.chance(0.65)) { p.etapa = 'archivada'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'El Gobierno retira el proyecto ante la falta de apoyos' }); P.gob.estab -= 0.8; C.Noticias.poner(E, 'parlamento', `El Gobierno retira «${p.t}» por falta de apoyos.`, J.pais); return; }
          }
          votosSemana++;
          if (Pa.jugadorVota(E) && !E.parl.auto) { p.etapa = 'pleno_pend'; E.parl.pendienteVoto.push(p.id); }
          else Pa.resolver(E, p, null);
        }
        if (E.fecha.t - p.t0 > 78 && ABIERTAS.includes(p.etapa) && p.etapa !== 'pleno_pend') { p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'Archivado por falta de tramitación' }); Pa.alFinalizar(E, p, false); }
      });
    },

    jugadorVota(E) { return E.jugador && E.parl.miembros.includes('J'); },

    /* Resuelve el pleno. votoJ: 'si' | 'no' | 'abs' | null (línea del partido) */
    resolver(E, p, votoJ) {
      const J = E.jugador;
      const r = Pa.calcular(E, p, votoJ);
      const linea = r.posturas[J.partido] ? r.posturas[J.partido].voto : 'abs';
      const miVoto = r.votos.J || null;
      const v = { id: U.id('V'), proy: p.id, t: E.fecha.t, si: r.si, no: r.no, abs: r.abs, aus: r.aus, ok: r.ok, posturas: {}, votos: r.votos, desertores: r.desertores.length,
                  detalle: r.desertores.slice(0, 12), miVoto, linea };
      for (const k in r.posturas) v.posturas[k] = r.posturas[k].voto;
      E.votaciones.unshift(v); if (E.votaciones.length > 30) { E.votaciones.length = 30; }
      // Se guardan los votos individuales sólo de las últimas 6 votaciones (para el hemiciclo)
      E.votaciones.slice(6).forEach(x => { x.votos = null; });
      p.votacion = v.id; p.tEtapa = E.fecha.t;
      p.etapa = r.ok ? 'sancionada' : 'rechazada';
      p.hist.push({ t: E.fecha.t, txt: (r.ok ? 'Aprobado en el pleno ' : 'Rechazado en el pleno ') + `(${r.si} a favor, ${r.no} en contra, ${r.abs} abstenciones)` });
      // Disciplina del jugador
      if (miVoto && miVoto !== linea && J.rol !== 'lider') { E.partidos[J.partido].cohesion = U.clamp(E.partidos[J.partido].cohesion - 0.8, 20, 99); C.Personaje.cambiar(E, { prestigio: -1.5 }); }
      if (miVoto && miVoto === linea) C.Personaje.cambiar(E, { prestigio: 0.15 });
      Pa.alFinalizar(E, p, r.ok);
      C.Bus.emit('votacion', { proyecto: p.id, voto: v.id });
      return v;
    },

    alFinalizar(E, p, ok) {
      const J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais], tpl = D().leyes.find(l => l.id === p.tpl);
      if (p.ue) C.UE.transposicion(E, p, ok);
      if (!ok) {
        if (p.autor.tipo === 'jugador') { C.Personaje.cambiar(E, { prestigio: -2 }); C.Noticias.poner(E, 'parlamento', `${J.nombre} ve rechazado su proyecto «${p.t}».`, J.pais); }
        else if (p.autor.tipo === 'gobierno') { P.gob.estab -= 3; P.gob.aprob -= 0.6; C.Noticias.poner(E, 'parlamento', `Derrota parlamentaria del Gobierno: «${p.t}» no sale adelante.`, J.pais); }
        return;
      }
      P.flags.leyes = P.flags.leyes || {}; P.flags.leyes[p.tpl] = E.fecha.t;
      if (tpl) {
        const ef = {}; for (const k in tpl.ef) ef[k] = k === 'aprob' ? tpl.ef[k] : tpl.ef[k] * 0.5;
        ef.aprob = (tpl.ef.aprob || 0) + (p.pop - 50) / 100 * 1.6;
        C.Economia.aplicar(E, J.pais, ef);
        if (tpl.costo) P.ec.pol.deficit += tpl.costo * 0.4;
        if (tpl.efecto) Pa.efectoEspecial(E, tpl.efecto, p);
      }
      const ap = p.autor.tipo === 'jugador' ? J.partido : p.autor.pid;
      if (ap) C.Opinion.empuje(E, ap, (p.pop - 50) / 100 * 0.5);
      if (p.autor.tipo === 'jugador') { C.Personaje.cambiar(E, { prestigio: 6, pop: 2.5, capEU: p.eu > 20 ? 1 : 0 }, true); C.Personaje.log(E, `Tu proyecto «${p.t}» se convierte en ley.`); }
      C.Noticias.poner(E, 'parlamento', `Aprobada la ley «${p.t}» en ${d.nombre}.`, J.pais);
      if (p.autor.tipo === 'gobierno') P.gob.estab = Math.min(100, P.gob.estab + 1);
    },

    efectoEspecial(E, efecto, p) {
      const J = E.jugador, P = E.paises[J.pais];
      if (efecto === 'sistema') {
        const d = Object.assign({}, D().paises[J.pais], P.sist || {});
        const ap = p.autor.tipo === 'jugador' ? J.partido : p.autor.pid, pa = E.partidos[ap];
        const pequeno = pa && pa.pop < 15;
        P.sist = { um: pequeno ? Math.max(0, (d.um || 0) - 1.5) : Math.min(8, (d.um || 0) + 1), k: pequeno ? Math.max(1, (d.k || 1) - 0.12) : Math.min(2.6, (d.k || 1) + 0.15) };
        C.Noticias.poner(E, 'parlamento', `Reforma electoral en ${D().paises[J.pais].nombre}: umbral ${U.d1(P.sist.um)} %, ${pequeno ? 'más' : 'menos'} proporcionalidad.`, J.pais);
      } else if (efecto === 'referendum') C.UE.referendum(E, J.pais);
      else if (efecto === 'acervo') { P.ue.progreso = Math.min(100, P.ue.progreso + 3); P.ue.rel = Math.min(100, P.ue.rel + 3); }
      else if (efecto === 'acuerdoUK') { P.ue.rel = Math.min(100, P.ue.rel + 8); C.Noticias.poner(E, 'europa', 'Londres y Bruselas cierran un acuerdo para reintegrar parcialmente el Reino Unido en el mercado único.', J.pais); }
    }
  };

  C.Parlamento = Pa;
  C.Tiempo.registrar('parlamento', Pa, 30);
})(window.EUROPA);

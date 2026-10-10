/* Cortes Generales: Congreso de los Diputados (350 individuos por circunscripción), Senado (por bloques),
   proyectos de ley, leyes orgánicas (176), decretos-ley con convalidación, veto del Senado y Presupuestos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const clamp100 = x => Math.max(5, Math.min(95, x));
  const ABIERTAS = ['registro', 'ponencia', 'pleno', 'pleno_pend', 'senado', 'vuelta', 'vuelta_pend', 'convalidacion', 'convalidacion_pend'];
  const PENDIENTES = ['pleno_pend', 'vuelta_pend', 'convalidacion_pend'];
  const MAX_VOTOS_SEMANA = 2;

  const Co = {
    ABIERTAS,

    init(E) {
      const P = E.paises.ES;
      E.parl = { miembros: [], mesa: {}, pendienteVoto: [], auto: false, anuales: {} };
      Co.poblar(E);
    },

    /* Crea un diputado de un partido y una circunscripción. */
    nuevoDiputado(E, pid, prov) {
      const p = E.partidos[pid], ccaa = prov ? D().provincias[prov][1] : null;
      const region = ccaa && D().idiomaNombres[ccaa] ? ccaa : 'ES';
      const pers = C.Mundo.persona(region);
      return C.Mundo.politico(E, { pais: 'ES', partido: pid, n: pers.n, g: pers.g, eco: p.eco + U.gauss(0, 12), soc: p.soc + U.gauss(0, 12), eu: p.eu + U.gauss(0, 12), ter: p.ter + U.gauss(0, 10), prov,
        d: U.gauss(88 + (p.cohesion - 70) * 0.2, 7) });
    },

    poblar(E) {
      const P = E.paises.ES; const lista = [];
      for (const prov in E.esp.prov) for (const pid in E.esp.prov[prov].escanos) for (let i = 0; i < E.esp.prov[prov].escanos[pid]; i++) lista.push({ prov, pid });
      for (const x of lista) E.parl.miembros.push(Co.nuevoDiputado(E, x.pid, x.prov).id);
      Co.colocarLideres(E);
    },

    /* Los líderes de los partidos ocupan escaño en su circunscripción más fuerte. */
    colocarLideres(E) {
      const P = E.paises.ES;
      for (const pid of P.partidos) {
        const p = E.partidos[pid]; if ((P.escanos[pid] || 0) === 0) continue;
        const lid = p.lider; if (!lid || lid === 'J') continue;
        if (E.parl.miembros.includes(lid)) continue;
        // provincia con más escaños de ese partido (o la de su región)
        let mejor = null, mx = -1;
        for (const prov in E.esp.prov) { const n = E.esp.prov[prov].escanos[pid] || 0; if (n > mx) { mx = n; mejor = prov; } }
        const hueco = E.parl.miembros.map(i => E.politicos[i]).filter(m => m && m.p === pid && m.prov === mejor && m.id !== p.lider && m.id !== 'J').sort((a, b) => a.a - b.a)[0];
        if (hueco) { const ix = E.parl.miembros.indexOf(hueco.id); E.parl.miembros[ix] = lid; delete E.politicos[hueco.id]; E.politicos[lid].prov = mejor; }
      }
    },

    /* Tras unas generales: ajusta los escaños de cada provincia conservando a los diputados que repiten. */
    recomponer(E, antes) {
      const J = E.jugador, nuevos = [];
      const mias = {};
      E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.id !== 'J') (mias[m.prov + '|' + m.p] = mias[m.prov + '|' + m.p] || []).push(m.id); });
      const jEn = J && J.pais === 'ES' && J.electo;
      for (const prov in E.esp.prov) for (const pid in E.esp.prov[prov].escanos) {
        let n = E.esp.prov[prov].escanos[pid];
        if (jEn && J.partido === pid && J.circ === prov) n--;
        const actuales = (mias[prov + '|' + pid] || []).slice().sort((a, b) => ((E.partidos[pid].lider === b ? 1e3 : 0) + E.politicos[b].a) - ((E.partidos[pid].lider === a ? 1e3 : 0) + E.politicos[a].a));
        const mant = actuales.slice(0, Math.max(0, n));
        actuales.slice(Math.max(0, n)).forEach(i => { if (E.partidos[pid].lider !== i && E.politicos[i]) delete E.politicos[i]; else if (E.politicos[i]) mant.push(i); });
        while (mant.length < n) mant.push(Co.nuevoDiputado(E, pid, prov).id);
        nuevos.push(...mant);
        if (jEn && J.partido === pid && J.circ === prov) nuevos.push('J');
        delete mias[prov + '|' + pid];
      }
      // Líderes sin escaño: se recolocan
      Object.keys(mias).forEach(k => mias[k].forEach(i => { if (E.politicos[i] && !E.partidos[E.politicos[i].p].lider !== i && E.partidos[E.politicos[i].p].lider !== i) delete E.politicos[i]; }));
      E.parl.miembros = nuevos.filter((v, i, a) => a.indexOf(v) === i);
      E.parl.pendienteVoto = [];
      Co.colocarLideres(E);
      // Los proyectos pendientes decaen con la legislatura
      Object.values(E.proyectos).forEach(p => { if (ABIERTAS.includes(p.etapa)) { p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'Decae por disolución de las Cortes' }); } });
    },

    colocarJugador(E) {
      const J = E.jugador, P = E.paises.ES;
      E.politicos.J = { id: 'J', n: J.nombre, g: J.g, e: J.edad, pais: 'ES', p: J.partido, eco: J.eco, soc: J.soc, eu: J.eu, ter: J.ter, d: 70, a: 80, pr: 50, c: 50 + J.atrib.carisma * 3, i: 40 + J.atrib.integridad * 5, rel: 0, prov: J.circ };
      if (J.nivel !== 'nacional') { J.electo = false; return; }
      const pid = J.partido, n = P.escanos[pid] || 0;
      // Circunscripción: la indicada o la mejor del partido
      if (!J.circ) { let mx = -1; for (const prov in E.esp.prov) { const k = E.esp.prov[prov].escanos[pid] || 0; if (k > mx) { mx = k; J.circ = prov; } } }
      E.politicos.J.prov = J.circ;
      const enProv = E.parl.miembros.map(i => E.politicos[i]).filter(m => m && m.p === pid && m.prov === J.circ && m.id !== E.partidos[pid].lider);
      if (enProv.length || (J.rol === 'lider' && n > 0)) {
        J.electo = true;
        const quitar = J.rol === 'lider' ? (E.parl.miembros.map(i => E.politicos[i]).find(m => m && m.id === E.partidos[pid].lider) || enProv[enProv.length - 1]) : enProv[enProv.length - 1];
        if (quitar) { const ix = E.parl.miembros.indexOf(quitar.id); E.parl.miembros[ix] = 'J'; if (quitar.id !== E.partidos[pid].lider || J.rol === 'lider') delete E.politicos[quitar.id]; }
        else E.parl.miembros.push('J');
      } else J.electo = false;
      if (J.rol === 'lider') E.partidos[pid].lider = 'J';
    },

    miembros(E) { return E.parl.miembros.map(i => E.politicos[i]).filter(Boolean); },
    escanosDe(E, pid) { return E.paises.ES.escanos[pid] || 0; },

    /* ── Proyectos ── */
    abiertos(E) { return Object.values(E.proyectos).filter(p => ABIERTAS.includes(p.etapa)); },

    plantilla(id) { return D().leyes.find(l => l.id === id); },

    proponer(E, tplId, autor, extra) {
      const tpl = Co.plantilla(tplId); if (!tpl) return null;
      const p = {
        id: U.id('L'), tpl: tplId, t: tpl.t, s: tpl.s, eco: tpl.eco, soc: tpl.soc, eu: tpl.eu || 0, ter: tpl.ter || 0, costo: tpl.costo || 0, pop: tpl.pop, may: tpl.may || 'simple', d: tpl.d,
        autor, etapa: 'registro', t0: E.fecha.t, tEtapa: E.fecha.t, apoyo: {}, hist: [{ t: E.fecha.t, txt: autor.tipo === 'gobierno' ? 'El Consejo de Ministros aprueba el proyecto y lo remite a las Cortes' : 'Registrado en el Congreso' }], dur: 0, region: tpl.region || null
      };
      // Diseño de la ley: alcance, enfoque, financiación y calendario determinan su posición, su coste y sus efectos
      const Im = C.Impacto;
      if (Im) { const dis = Im.norm(tpl, (extra && extra.dis) || Im.disDefecto(E, tpl, autor)); p.dis = dis; Object.assign(p, Im.campos(tpl, dis, extra && extra.ajuste)); }
      Object.assign(p, extra || {});
      if (Im && p.dis) p.dis = Im.norm(tpl, p.dis);
      E.proyectos[p.id] = p;
      return p;
    },

    /* Proyecto «de mentira» con un diseño dado (para proyectar votos antes de registrarlo). */
    pseudo(E, tpl, autor, dis, ajuste) { return C.Impacto.pseudo(E, tpl, autor, dis, ajuste); },

    /* Reforma o derogación de una ley en vigor. */
    proponerCambio(E, vigorId, tipo, autor, dis) {
      const v = (E.esp.vigor || []).find(x => x.id === vigorId && x.estado === 'activa'), tpl = v && Co.plantilla(v.tpl); if (!tpl) return null;
      if (Co.abiertos(E).some(p => p.reforma === vigorId || p.deroga === vigorId)) return null;
      if (tipo === 'derogar') {
        const p = Co.proponer(E, tpl.id, autor, { deroga: vigorId, dis: v.dis, t: `Derogación de «${v.t}»`, d: `Deroga la ley y revierte progresivamente sus efectos.` });
        Object.assign(p, { eco: -tpl.eco, soc: -tpl.soc, eu: -(tpl.eu || 0), ter: -(tpl.ter || 0), pop: clamp100(100 - tpl.pop), costo: -(tpl.costo || 0) });
        return p;
      }
      return Co.proponer(E, tpl.id, autor, { reforma: vigorId, dis: dis || v.dis, t: `Reforma de «${v.t}»`, d: `Modifica el diseño de la ley vigente (${tpl.d}).` });
    },

    /* Real decreto-ley: entra en vigor ya, y el Congreso debe convalidarlo en 30 días. */
    registrarRDL(E, tplId, autor, extra) {
      const p = Co.proponer(E, tplId, autor || { tipo: 'gobierno', pid: E.paises.ES.gob.partido }, Object.assign({ etapa: 'convalidacion', rdl: true, tVoto: E.fecha.t + 3 }, extra || {}));
      if (!p) return null;
      p.hist = [{ t: E.fecha.t, txt: 'Real decreto-ley aprobado por el Consejo de Ministros: entra en vigor y se somete a convalidación' }];
      C.Impacto.promulgar(E, p);
      return p;
    },

    elegirPlantilla(E, centro, sector, solo) {
      const P = E.paises.ES, hechas = P.flags.leyes || (P.flags.leyes = {});
      const abiertos = Co.abiertos(E).map(p => p.tpl), vig = C.Impacto ? C.Impacto.vigentes(E) : new Set();
      const cand = D().leyes.filter(l => !l.rdlSolo && !l.manual && !abiertos.includes(l.id) && !vig.has(l.id) && !(hechas[l.id] && E.fecha.t - hechas[l.id] < 130) && (!solo || solo(l)));
      return U.pesado(cand, l => Math.exp(-3.2 * U.distIdeo(centro, l)) * (sector && l.s === sector ? 2 : 1));
    },

    /* ── Votaciones ── */
    postura(E, pid, p, cam) {
      const P = E.paises.ES, pa = E.partidos[pid], g = P.gob, f = [];
      const dist = U.distIdeo(pa, p);
      let s = 0.8 - 2.5 * dist; f.push(['Afinidad ideológica y territorial', s]);
      const enGob = g.coalicion.includes(pid), ext = (g.apoyoExterno || []).includes(pid);
      const a = p.autor; let x = 0;
      if (a.tipo === 'gobierno') x = enGob ? 0.95 : ext ? 0.55 : -0.4;
      else if (a.tipo === 'ue') x = enGob ? 0.5 : 0.1;
      else if (a.tipo === 'partido' || a.tipo === 'jugador') {
        const ap = a.tipo === 'jugador' ? E.jugador.partido : a.pid;
        x = pid === ap ? 1.5 : (enGob ? (ap && g.coalicion.includes(ap) ? 0.5 : -0.4) : (ap && g.coalicion.includes(ap) ? -0.1 : 0.15));
      }
      if (x) { s += x; f.push([a.tipo === 'gobierno' ? (enGob ? 'Proyecto del Gobierno' : ext ? 'Proyecto del Gobierno (socio externo)' : 'Proyecto del Gobierno (oposición)') : a.tipo === 'ue' ? 'Obligación europea' : 'Autoría', x]); }
      // Pacto de investidura: el socio que lo firmó lo apoya con fuerza
      if (p.pacto === pid) { s += 1.2; f.push(['Contrapartida de su pacto', 1.2]); }
      // Intereses territoriales
      if (p.region) {
        if (pa.region === p.region) { s += 0.9; f.push(['Beneficia a su territorio', 0.9]); }
        else if (pa.amb === 'reg') { s -= 0.25; f.push(['Agravio comparativo', -0.25]); }
        else if (pa.amb === 'nac' && E.esp.ccaa[p.region] && g.coalicion.includes(pid) === false && pa.ter < -20) { s -= 0.3; f.push(['Trato privilegiado a un territorio', -0.3]); }
      }
      const pp = (p.pop - 50) / 100 * (enGob ? 0.7 : 1); s += pp; f.push(['Opinión pública', pp]);
      const fis = -Math.max(0, p.costo) * (pa.eco / 100) * 0.45; if (Math.abs(fis) > 0.01) { s += fis; f.push(['Coste fiscal', fis]); }
      const lb = p.apoyo[pid] || 0; if (lb) { s += lb; f.push(['Cabildeo', lb]); }
      const sensible = (p.may === 'organica' || p.may === 'cons') ? 0.05 : 0;
      const voto = s > 0.35 + sensible ? 'si' : s < -0.05 ? 'no' : 'abs';
      return { s, voto, factores: f };
    },

    fidelidad(m, pa) { return U.clamp(0.965 + (m.d - 85) / 400 + (pa.cohesion - 74) / 600, 0.7, 0.998); },

    /* Mayoría exigida: ordinaria (más sí que no), orgánica (176 sí) o reforma constitucional (3/5 = 210). */
    ok(p, si, no, total) {
      if (p.may === 'cons') return si >= Math.ceil(total * 3 / 5);
      if (p.may === 'organica' || p.may === 'absoluta') return si > total / 2;
      return si > no;
    },

    calcular(E, p, votoJ, sinRuido, estapa) {
      const J = E.jugador, P = E.paises.ES;
      const posturas = {};
      P.partidos.forEach(pid => { if ((P.escanos[pid] || 0) > 0) posturas[pid] = Co.postura(E, pid, p); });
      const votos = {}, desertores = [];
      let si = 0, no = 0, abs = 0, aus = 0; const total = E.parl.miembros.length;
      for (const mid of E.parl.miembros) {
        const m = E.politicos[mid]; if (!m) continue;
        const pos = posturas[m.p]; if (!pos) { votos[mid] = 'abs'; abs++; continue; }
        const pa = E.partidos[m.p]; let v;
        if (mid === 'J') v = votoJ || pos.voto;
        else if (!sinRuido && U.chance(0.015)) v = 'aus';
        else {
          const sigue = Co.fidelidad(m, pa);
          if (sinRuido || U.chance(sigue)) v = pos.voto;
          else {
            const dist = U.distIdeo(m, p);
            const u = 0.8 - 2.5 * dist + (p.autor.tipo === 'jugador' ? m.rel / 100 * 0.9 : 0) + (p.pop - 50) / 100 * 0.6;
            v = u > 0.3 ? 'si' : u < -0.05 ? 'no' : 'abs';
            if (v !== pos.voto) desertores.push({ pol: mid, voto: v, linea: pos.voto, razon: 'Prioriza su criterio o el de su territorio' });
          }
        }
        votos[mid] = v;
        if (v === 'si') si++; else if (v === 'no') no++; else if (v === 'abs') abs++; else aus++;
      }
      return { posturas, votos, desertores, si, no, abs, aus, total, ok: Co.ok(p, si, no, total) };
    },

    proyectar(E, p) {
      const P = E.paises.ES, total = E.parl.miembros.length;
      let si = 0, no = 0, abs = 0;
      P.partidos.forEach(pid => {
        const n = P.escanos[pid] || 0; if (!n) return;
        const ps = Co.postura(E, pid, p), pa = E.partidos[pid];
        const mias = E.parl.miembros.map(i => E.politicos[i]).filter(m => m && m.p === pid);
        const f = U.suma(mias.map(m => Co.fidelidad(m, pa))) / Math.max(1, mias.length), sigue = n * f;
        if (ps.voto === 'si') { si += sigue; no += (n - sigue) * 0.4; abs += (n - sigue) * 0.6; }
        else if (ps.voto === 'no') { no += sigue; si += (n - sigue) * 0.4; abs += (n - sigue) * 0.6; }
        else { abs += sigue; si += (n - sigue) * 0.5; no += (n - sigue) * 0.5; }
      });
      const need = p.may === 'cons' ? Math.ceil(total * 3 / 5) : (p.may === 'organica' || p.may === 'absoluta') ? 176 : Math.floor((si + no) / 2) + 1;
      return { si: Math.round(si), no: Math.round(no), abs: Math.round(abs), total, need, dist: Math.round(si - need) };
    },

    /* Senado: el bloque que lo domina puede vetar o enmendar. */
    votoSenado(E, p) {
      const S = E.esp.senado, P = E.paises.ES; let si = 0, no = 0, abs = 0;
      for (const pid in S.escanos) {
        if (!E.partidos[pid]) continue;
        const v = Co.postura(E, pid, p).voto, n = S.escanos[pid];
        if (v === 'si') si += n; else if (v === 'no') no += n; else abs += n;
      }
      return { si, no, abs, total: S.total, veto: no >= S.mayoria, enmiendas: no > si && no < S.mayoria && U.chance(0.45) };
    },

    enRecesion(E) {
      const m = U.hoy().getUTCMonth(), d = U.hoy().getUTCDate();
      return m === 7 || (m === 11 && d > 20) || (m === 0 && d < 7);
    },

    jugadorVota(E) { return E.jugador && E.parl.miembros.includes('J'); },

    /* ── Semana parlamentaria ── */
    turno(E) {
      const P = E.paises.ES, g = P.gob, c = E.esp.cortes, J = E.jugador; if (!g) return;
      if (c.estado === 'disueltas') return;
      const ab = Co.abiertos(E);
      if (E.fecha.t % 52 === 0) for (const id in E.proyectos) { const p = E.proyectos[id]; if (!ABIERTAS.includes(p.etapa) && E.fecha.t - p.tEtapa > 208) delete E.proyectos[id]; }
      // Iniciativas de otros partidos
      if (c.estado === 'activa' && U.chance(0.07) && ab.length < 16 && !Co.enRecesion(E)) {
        const pid = U.pesado(P.partidos.filter(k => (P.escanos[k] || 0) > 0 && !g.coalicion.includes(k)), k => P.escanos[k] + (E.partidos[k].amb === 'reg' ? 8 : 0));
        if (pid) {
          const pa = E.partidos[pid];
          const tpl = Co.elegirPlantilla(E, pa, pa.amb === 'reg' ? 'ter' : null);
          if (tpl) { const p = Co.proponer(E, tpl.id, { tipo: 'partido', pid }); if (pa.amb === 'reg' && tpl.region == null) p.region = pa.region; C.Noticias.poner(E, 'parlamento', `${pa.sigla} registra «${p.t}».`, 'ES'); }
        }
      }
      let votosSemana = 0;
      Co.abiertos(E).forEach(p => {
        const dt = E.fecha.t - p.tEtapa;
        if (p.etapa === 'registro' && dt >= 1) { p.etapa = 'ponencia'; p.tEtapa = E.fecha.t; p.dur = U.ri(2, 5); p.hist.push({ t: E.fecha.t, txt: 'Ponencia y Comisión' }); }
        else if (p.etapa === 'ponencia' && dt >= p.dur) {
          if (p.autor.tipo !== 'gobierno' && p.autor.tipo !== 'ue') {
            const pr = Co.proyectar(E, p);
            // Un estatuto remitido por una comunidad abre un plazo de enmiendas de cuatro semanas: es el momento de cabildear a los grupos
            if (p.estReg && !p.plazoEnm) { p.plazoEnm = true; p.dur = dt + 4; p.hist.push({ t: E.fecha.t, txt: 'La Comisión abre un plazo de enmiendas de cuatro semanas para buscar apoyos al texto' }); if (E.jugador && E.jugador.region === p.estReg && E.jugador.cargo === 'presauto' && !E.meta.presim) C.Personaje.log(E, `Plazo de enmiendas al Estatuto de ${D().ccaa[p.estReg].nombre} en las Cortes: cuatro semanas para cabildear a los grupos.`); return; }
            if (pr.si < (pr.si + pr.no) * 0.4 && U.chance(0.6)) { p.etapa = 'rechazada'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'La Mesa y la Comisión la bloquean: sin apoyos suficientes' }); Co.alFinalizar(E, p, false); return; }
          }
          p.etapa = 'pleno'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'Dictamen: pasa al Pleno' });
        }
        else if ((p.etapa === 'pleno' || p.etapa === 'vuelta' || p.etapa === 'convalidacion') && !Co.enRecesion(E) && votosSemana < MAX_VOTOS_SEMANA) {
          if (p.etapa === 'convalidacion' && E.fecha.t < p.tVoto) return;
          if (p.etapa === 'vuelta' && E.fecha.t < (p.tVuelta || 0)) return;
          if (p.autor.tipo === 'gobierno' && p.etapa === 'pleno' && !p.retirable) {
            p.retirable = true;
            const pr = Co.proyectar(E, p);
            if (pr.dist < -E.parl.miembros.length * 0.02 && U.chance(0.6)) { p.etapa = 'archivada'; p.tEtapa = E.fecha.t; p.hist.push({ t: E.fecha.t, txt: 'El Gobierno retira el proyecto ante la falta de apoyos' }); g.estab -= 0.8; C.Noticias.poner(E, 'parlamento', `El Gobierno retira «${p.t}» por falta de apoyos.`, 'ES'); return; }
          }
          votosSemana++;
          if (Co.jugadorVota(E) && !E.parl.auto) { p.etapa = p.etapa + '_pend'; E.parl.pendienteVoto.push(p.id); }
          else Co.resolver(E, p, null);
        }
        else if (p.etapa === 'senado' && dt >= p.dur) Co.pasarSenado(E, p);
        if (E.fecha.t - p.t0 > 90 && ABIERTAS.includes(p.etapa) && !PENDIENTES.includes(p.etapa)) { p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'Archivado por falta de tramitación' }); Co.alFinalizar(E, p, false); }
      });
    },

    /* Resuelve la votación del Congreso (pleno, vuelta o convalidación). */
    resolver(E, p, votoJ) {
      const J = E.jugador, base = p.etapa.replace('_pend', '');
      const r = Co.calcular(E, p, votoJ);
      const linea = r.posturas[J && J.partido] ? r.posturas[J.partido].voto : 'abs', miVoto = r.votos.J || null;
      let ok = r.ok;
      // En la vuelta tras un veto hace falta mayoría absoluta (176) mientras no hayan pasado dos meses
      if (base === 'vuelta' && p.veto && !p.vetoLevantable) ok = r.si >= 176;
      const v = { id: U.id('V'), proy: p.id, t: E.fecha.t, si: r.si, no: r.no, abs: r.abs, aus: r.aus, ok, posturas: {}, votos: r.votos, desertores: r.desertores.length, detalle: r.desertores.slice(0, 12), miVoto, linea, fase: base };
      for (const k in r.posturas) v.posturas[k] = r.posturas[k].voto;
      E.votaciones.unshift(v); if (E.votaciones.length > 30) E.votaciones.length = 30;
      E.votaciones.slice(6).forEach(x => { x.votos = null; });
      p.votacion = v.id; p.tEtapa = E.fecha.t;
      const txt = `(${r.si} a favor, ${r.no} en contra, ${r.abs} abstenciones)`;
      if (J && miVoto && miVoto !== linea && J.rol !== 'lider') { E.partidos[J.partido].cohesion = U.clamp(E.partidos[J.partido].cohesion - 0.8, 20, 99); C.Personaje.cambiar(E, { prestigio: -1.5 }); }
      if (J && miVoto && miVoto === linea) C.Personaje.cambiar(E, { prestigio: 0.15 });
      if (base === 'convalidacion') {
        p.etapa = ok ? 'sancionada' : 'rechazada'; p.hist.push({ t: E.fecha.t, txt: (ok ? 'Convalidado ' : 'Derogado ') + txt });
        if (!ok) C.Impacto.derogarPorProyecto(E, p);
        Co.alFinalizar(E, p, ok, true);
      } else if (base === 'pleno') {
        if (ok) { p.etapa = 'senado'; p.dur = U.ri(2, 4); p.hist.push({ t: E.fecha.t, txt: 'Aprobado en el Congreso ' + txt + '. Pasa al Senado' }); p.tEtapa = E.fecha.t; }
        else { p.etapa = 'rechazada'; p.hist.push({ t: E.fecha.t, txt: 'Rechazado en el Congreso ' + txt }); Co.alFinalizar(E, p, false); }
      } else { // vuelta
        if (ok) { p.etapa = 'sancionada'; p.hist.push({ t: E.fecha.t, txt: 'El Congreso levanta el veto / acepta las enmiendas ' + txt }); Co.alFinalizar(E, p, true); }
        else if (p.veto && !p.vetoLevantable) { p.vetoLevantable = true; p.etapa = 'vuelta'; p.tVuelta = E.fecha.t + 6; p.hist.push({ t: E.fecha.t, txt: 'No logra los 176 votos para levantar el veto. Podrá volver a votarse por mayoría simple tras dos meses' }); }
        else { p.etapa = 'rechazada'; p.hist.push({ t: E.fecha.t, txt: 'No supera la votación final ' + txt }); Co.alFinalizar(E, p, false); }
      }
      C.Bus.emit('votacion', { proyecto: p.id, voto: v.id });
      return v;
    },

    pasarSenado(E, p) {
      const s = Co.votoSenado(E, p);
      if (p.may === 'cons') { p.etapa = s.si >= Math.ceil(s.total * 3 / 5) ? 'sancionada' : 'rechazada'; p.hist.push({ t: E.fecha.t, txt: 'Senado: ' + (p.etapa === 'sancionada' ? 'aprobada la reforma constitucional' : 'no alcanza los tres quintos') }); Co.alFinalizar(E, p, p.etapa === 'sancionada'); return; }
      if (s.veto) {
        p.etapa = 'vuelta'; p.veto = true; p.vetoLevantable = false; p.tVuelta = E.fecha.t + 1;
        p.hist.push({ t: E.fecha.t, txt: `El Senado veta el texto con ${s.no} votos en contra (mayoría absoluta). Vuelve al Congreso` });
        C.Noticias.poner(E, 'parlamento', `El Senado veta «${p.t}».`, 'ES');
        if (p.autor.tipo === 'gobierno') E.paises.ES.gob.estab = Math.max(0, E.paises.ES.gob.estab - 1);
      } else if (s.enmiendas) {
        p.etapa = 'vuelta'; p.veto = false; p.tVuelta = E.fecha.t + 1;
        p.hist.push({ t: E.fecha.t, txt: 'El Senado introduce enmiendas. Vuelven al Congreso' });
      } else { p.etapa = 'sancionada'; p.hist.push({ t: E.fecha.t, txt: `Aprobada por el Senado (${s.si} votos a favor). Pasa a sanción real` }); Co.alFinalizar(E, p, true); }
    },

    /* ── Efectos de las leyes: ver impacto.js (entrada en vigor gradual, grupos sociales, evaluación) ── */

    alFinalizar(E, p, ok, convalidacion) {
      const J = E.jugador, P = E.paises.ES, tpl = Co.plantilla(p.tpl);
      if (p.pge && C.Consejo) C.Consejo.alFinalizar(E, p, ok);
      if (p.ue && C.UE && C.UE.transposicion) C.UE.transposicion(E, p, ok);
      if (!ok) {
        if (J && p.autor.tipo === 'jugador') { C.Personaje.cambiar(E, { prestigio: -2 }); C.Noticias.poner(E, 'parlamento', `${J.nombre} ve rechazado su proyecto «${p.t}».`, 'ES'); }
        else if (p.autor.tipo === 'gobierno') { P.gob.estab = Math.max(0, P.gob.estab - (p.rdl ? 3 : 1.5)); P.gob.aprob -= 0.6; C.Noticias.poner(E, 'parlamento', p.rdl ? `El Congreso derroga el decreto-ley «${p.t}».` : `Derrota parlamentaria del Gobierno: «${p.t}» no sale adelante.`, 'ES'); }
        return;
      }
      P.flags.leyes = P.flags.leyes || {}; P.flags.leyes[p.tpl] = E.fecha.t;
      if (C.Justicia && ok && !convalidacion) C.Justicia.alAprobar(E, p);
      if (!convalidacion && !p.rdl && tpl) {
        if (p.deroga) C.Impacto.derogar(E, p.deroga, 'derogada por ley');
        else { if (p.reforma) C.Impacto.derogar(E, p.reforma, 'reformada'); C.Impacto.promulgar(E, p); }
        P.gob.aprob = U.clamp(P.gob.aprob + (p.pop - 50) / 100 * 1.6, 5, 90);
      }
      if (tpl && tpl.efecto && !p.deroga && !p.reforma) Co.efectoEspecial(E, tpl.efecto, p);
      const ap = p.autor.tipo === 'jugador' ? J.partido : p.autor.pid;
      if (ap && E.partidos[ap].amb === 'nac') C.Opinion.empujeES && C.Opinion.empujeES(E, ap, (p.pop - 50) / 100 * 0.3);
      if (J && p.autor.tipo === 'jugador') { C.Personaje.cambiar(E, { prestigio: 6, pop: 2.5 }, true); C.Personaje.log(E, `Tu proyecto «${p.t}» se convierte en ley.`); }
      // Cumple un pacto
      if (p.pacto) { const pa = E.esp.pactos.find(x => x.pid === p.pacto && x.dem === p.demPacto && x.estado === 'pendiente'); if (pa) pa.estado = 'cumplida'; }
      C.Noticias.poner(E, 'parlamento', p.rdl ? `El Congreso convalida el decreto-ley «${p.t}».` : `Aprobada la ley «${p.t}».`, 'ES');
      if (p.autor.tipo === 'gobierno') P.gob.estab = Math.min(100, P.gob.estab + 1);
    },

    efectoEspecial(E, efecto, p) {
      const T = C.Territorio; if (!T) return;
      const ef = T.efectoLey ? T.efectoLey(E, efecto, p) : null;
      void ef;
    }
  };

  C.Congreso = Co;
  C.Tiempo.registrar('congreso', Co, 20);
  /* El turno del Congreso se ejecuta tras el del Ejecutivo y el Consejo */
  C.Tiempo.registrar('congreso_turno', { turno: Co.turno }, 32);
})(window.ESP);

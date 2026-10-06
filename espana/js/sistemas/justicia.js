/* Justicia y contrapesos: Tribunal Constitucional (recursos y renovación), CGPJ (mandato caducado y bloqueo), Fiscal General y causas judiciales contra políticos. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const DELITOS = ['corrupción', 'prevaricación', 'financiación ilegal', 'malversación', 'cohecho', 'tráfico de influencias'];
  const FASES = ['denuncia', 'instruccion', 'juicio', 'sentencia'];
  const FASE_TXT = { denuncia: 'Denuncia', instruccion: 'Instrucción', juicio: 'Juicio oral', sentencia: 'Sentencia', cerrada: 'Cerrada' };

  const Jx = C.Justicia = {
    FASES, FASE_TXT,
    asegurar(E) {
      if (E.esp.just) return E.esp.just;
      const g = E.paises.ES.gob, fn = C.Mundo.persona('ES');
      return E.esp.just = {
        cgpj: { caducado: U.chance(0.5), desde: E.fecha.t - U.ri(20, 120), bloqueo: 0, prog: 10, cons: 10, ultimoIntento: -99 },
        tcRenov: E.fecha.t + U.ri(40, 150), fiscal: { n: fn.n, g: fn.g, pid: g ? g.partido : null, indep: 55, t: E.fecha.t },
        causas: [], hist: [], indep: 60
      };
    },
    /* Composición del Tribunal Constitucional según su sesgo (positivo = más progresista). */
    tc(E) { const s = E.esp.tc.sesgo, prog = clamp(Math.round(6 + s * 5), 2, 10); return { prog, cons: 12 - prog, sesgo: s }; },

    /* Una ley recién aprobada puede ser recurrida ante el TC (50 diputados bastan). */
    alAprobar(E, p) {
      const P = E.paises.ES, tpl = C.Congreso.plantilla(p.tpl); if (!tpl || p.rdl || p.pge || p.deroga || p.ue) return;
      const g = P.gob, opo = P.partidos.filter(k => !g.coalicion.includes(k) && !(g.apoyoExterno || []).includes(k)), esc = U.suma(opo.map(k => P.escanos[k] || 0));
      if (esc < 50) return;
      const polem = (Math.abs(tpl.eco) + Math.abs(tpl.soc) + Math.abs(tpl.ter || 0)) / 3;
      if (!U.chance(clamp(0.03 + polem / 160, 0.03, 0.4))) return;
      E.esp.tc.recursos.push({ id: U.id('R'), cual: 'ley', t: E.fecha.t, fallo: E.fecha.t + U.ri(30, 70), titulo: p.t, ter: polem, region: p.region || null, tpl: p.tpl });
      C.Noticias.poner(E, 'justicia', `La oposición recurre ante el Tribunal Constitucional «${p.t}».`, 'ES');
    },
    recurrir(E, vigorId) {
      const J = E.jugador, P = E.paises.ES, g = P.gob, v = (E.esp.vigor || []).find(x => x.id === vigorId && x.estado === 'activa'); if (!v) return { ok: false, msg: 'Esa ley ya no está en vigor' };
      if (g.coalicion.includes(J.partido)) return { ok: false, msg: 'Tu partido está en el Gobierno: no recurre sus propias leyes' };
      if ((P.escanos[J.partido] || 0) < 50 && J.rol !== 'lider') return { ok: false, msg: 'Necesitas 50 diputados (o liderar un partido con grupo propio)' };
      if (E.esp.tc.recursos.some(r => r.tpl === v.tpl)) return { ok: false, msg: 'Ya hay un recurso contra esa ley' };
      const tpl = C.Congreso.plantilla(v.tpl), polem = tpl ? (Math.abs(tpl.eco) + Math.abs(tpl.soc) + Math.abs(tpl.ter || 0)) / 3 : 10;
      E.esp.tc.recursos.push({ id: U.id('R'), cual: 'ley', t: E.fecha.t, fallo: E.fecha.t + U.ri(30, 70), titulo: v.t, ter: polem, region: null, tpl: v.tpl, jugador: true });
      C.Noticias.poner(E, 'justicia', `${E.partidos[J.partido].sigla} recurre ante el Tribunal Constitucional «${v.t}».`, 'ES');
      return { ok: true, msg: `Presentas un recurso de inconstitucionalidad contra «${v.t}».` };
    },

    /* ── CGPJ ── */
    negociarCgpj(E) {
      const jt = Jx.asegurar(E), J = E.jugador, P = E.paises.ES, g = P.gob; if (!jt.cgpj.caducado) return { ok: false, msg: 'El CGPJ está renovado' };
      if (E.fecha.t - jt.cgpj.ultimoIntento < 4) return { ok: false, msg: 'Acabáis de reunir a los negociadores: esperad unas semanas' };
      const opo = P.partidos.filter(k => !g.coalicion.includes(k)).sort((a, b) => (P.escanos[b] || 0) - (P.escanos[a] || 0))[0];
      jt.cgpj.ultimoIntento = E.fecha.t;
      const pm = g.pm === 'J', afin = 1 - U.distIdeo(E.partidos[g.partido], E.partidos[opo]), esAct = pm || J.partido === opo;
      const p = clamp(0.15 + afin * 0.35 + J.atrib.negociacion / 30 + jt.cgpj.bloqueo * 0.0008, 0.05, 0.7);
      if (U.chance(p)) { Jx.renovarCgpj(E, pm ? 'gob' : 'opo'); return { ok: true, msg: 'Acuerdo histórico: se renueva el Consejo General del Poder Judicial.' }; }
      C.Personaje.cambiar(E, { prestigio: -0.5 }); return { ok: true, exito: false, msg: 'La negociación del CGPJ vuelve a embarrancar: el otro bloque exige demasiado.' };
    },
    renovarCgpj(E, favorece) {
      const jt = Jx.asegurar(E), c = jt.cgpj; c.caducado = false; c.desde = E.fecha.t; c.bloqueo = 0;
      const sesgo = favorece === 'gob' ? 1 : favorece === 'opo' ? -1 : 0, prog = clamp(10 + Math.round(sesgo * U.ri(0, 2) * (E.paises.ES.gob && E.partidos[E.paises.ES.gob.partido].eco < 0 ? 1 : -1)), 6, 14);
      c.prog = prog; c.cons = 20 - prog; jt.indep = clamp(jt.indep + 10, 0, 100);
      C.Noticias.poner(E, 'justicia', `Se renueva el CGPJ tras ${Math.round((E.fecha.t - 0) / 52 * 0 + 1)} legislatura(s) de bloqueo: ${prog} vocales progresistas y ${20 - prog} conservadores.`, 'ES');
    },
    /* ── Fiscal General ── */
    nombrarFiscal(E, perfil) {
      const jt = Jx.asegurar(E), g = E.paises.ES.gob; if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno propone al Fiscal General' };
      const p = C.Mundo.persona('ES'), f = jt.fiscal; f.n = p.n; f.g = p.g; f.pid = perfil === 'afin' ? g.partido : null; f.indep = perfil === 'afin' ? 25 : 80; f.t = E.fecha.t;
      jt.indep = clamp(jt.indep + (perfil === 'afin' ? -6 : 5), 0, 100);
      if (perfil === 'afin') C.Opinion.empuje(E, g.partido, -0.04, 0.3);
      C.Noticias.poner(E, 'justicia', `El Gobierno nombra Fiscal General a ${p.n}${perfil === 'afin' ? ', criticado por la oposición por su cercanía al Ejecutivo' : ', con amplio respaldo de la carrera fiscal'}.`, 'ES');
      return { ok: true, msg: `Nuevo Fiscal General: ${p.n} (${perfil === 'afin' ? 'afín al Gobierno' : 'independiente'}).` };
    },

    /* ── Causas judiciales ── */
    nueva(E, pid, quien, gravedad) {
      const jt = Jx.asegurar(E), pol = quien === 'J' ? null : E.politicos[quien];
      const c = { id: U.id('c'), quien, pid, nombre: quien === 'J' ? E.jugador.nombre : (pol ? pol.n : 'Un dirigente'), delito: U.pick(DELITOS), fase: 'denuncia', t0: E.fecha.t, tFase: E.fecha.t, dur: U.ri(6, 14), gravedad: gravedad || U.rf(0.3, 0.9), resultado: null, pend: null, colabora: false };
      jt.causas.unshift(c); if (jt.causas.length > 30) jt.causas.length = 30; return c;
    },
    causaPend(E, fase) { const jt = E.esp.just; return jt && jt.causas.find(c => c.quien === 'J' && c.pend === fase) || null; },
    responder(E, id, k) {
      const jt = Jx.asegurar(E), c = jt.causas.find(x => x.id === id); if (!c) return 'La causa ya no está abierta.';
      c.pend = null;
      if (c.fase === 'instruccion') {
        if (k === 'colaborar') { c.colabora = true; c.gravedad *= 0.85; C.Personaje.cambiar(E, { prestigio: 1 }); return 'Aportas documentación y te pones a disposición del juez.'; }
        if (k === 'recusar') { c.dur += 12; c.gravedad *= 0.95; C.Personaje.cambiar(E, { pop: -1 }); return 'Recusas al juez: ganas meses, pero parece que huyes del proceso.'; }
        c.gravedad = Math.min(1, c.gravedad * 1.1); C.Opinion.empuje(E, E.jugador.partido, 0.03, 0.3); C.Personaje.cambiar(E, { pop: 0.5 }); return 'Acusas a la Fiscalía de persecución política: tu partido cierra filas.';
      }
      if (c.fase === 'sentencia' && c.resultado === 'condena') {
        if (k === 'dimitir') { const op = C.Personaje.cargosRenunciables(E)[0]; if (op) C.Personaje.renunciarCargo(E, op.k); return 'Dimites de tu cargo y aceptas la sentencia.'; }
        C.Personaje.cambiar(E, { prestigio: -6, pop: -5 }, true); C.Opinion.empuje(E, E.jugador.partido, -0.18, 0.3); return 'Recurres y te mantienes en el cargo: los medios piden tu cabeza.';
      }
      return 'Celebras la absolución.';
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const jt = Jx.asegurar(E), P = E.paises.ES, g = P.gob, t = E.fecha.t, S = C.Impacto && C.Impacto.asegurar(E);
      // CGPJ
      const c = jt.cgpj;
      if (!c.caducado && t - c.desde > 5 * 52) { c.caducado = true; C.Noticias.poner(E, 'justicia', 'Caduca el mandato del CGPJ: se abre un nuevo periodo de interinidad.', 'ES'); }
      if (c.caducado) { c.bloqueo++; if (S) S.off.inst = (S.off.inst || 0) - 0.006; jt.indep = clamp(jt.indep - 0.02, 0, 100); if (U.chance(0.004) && g.pm !== 'J' && !(E.partidos[J.partido].lider === 'J' && U.chance(0.5))) Jx.renovarCgpj(E, 'pacto'); }
      // Tribunal Constitucional: renovación por tercios cada tres años
      if (t >= jt.tcRenov) { jt.tcRenov = t + 156; const e = E.esp.tc; const antes = Jx.tc(E).prog; e.sesgo = clamp(e.sesgo + (g.pm && E.partidos[g.partido].eco < 0 ? 0.12 : -0.12) * U.rf(0.5, 1.3), -0.8, 0.8); C.Noticias.poner(E, 'justicia', `Renovación parcial del Tribunal Constitucional: ${Jx.tc(E).prog} magistrados progresistas y ${Jx.tc(E).cons} conservadores.`, 'ES'); }
      // Fiscal General: lo nombra el Gobierno de turno
      if (g && jt.fiscal.pid && jt.fiscal.pid !== g.partido && !g.enFunciones) { const p = C.Mundo.persona('ES'); jt.fiscal = { n: p.n, g: p.g, pid: g.partido, indep: 40, t }; C.Noticias.poner(E, 'justicia', `El nuevo Gobierno nombra Fiscal General a ${p.n}.`, 'ES'); }
      // Nuevas causas
      for (const k of P.partidos) {
        const pa = E.partidos[k]; if (pa.amb !== 'nac' && U.chance(0.7)) continue;
        const gobierno = g.coalicion.includes(k), protegido = jt.fiscal.pid === k;
        const pr = 0.0022 * (1 + (60 - pa.finanzas) / 90) * (gobierno ? 1.2 : 1) * (protegido ? 0.5 : jt.fiscal.pid && jt.fiscal.pid !== k ? 1.2 : 1) * (1.2 - jt.indep / 250);
        if (U.chance(pr)) {
          const pols = Object.values(E.politicos).filter(x => x.p === k && x.id !== 'J'), q = pols.length ? U.pick(pols) : null;
          if (q) { const cs = Jx.nueva(E, k, q.id); C.Noticias.poner(E, 'justicia', `Una denuncia por ${cs.delito} salpica a ${q.n} (${pa.sigla}).`, 'ES'); }
        }
      }
      // Causa contra el jugador
      if (J.cargo !== 'activista' && !jt.causas.some(x => x.quien === 'J' && x.fase !== 'cerrada') && !E.meta.presim) {
        const nivel = D().cargos[J.cargo].nivel, pj = 0.0012 * (11 - J.atrib.integridad) / 6 * (1 + nivel / 6) * (jt.fiscal.pid && jt.fiscal.pid !== J.partido ? 1.3 : 1);
        if (U.chance(pj)) { const cs = Jx.nueva(E, J.partido, 'J'); C.Noticias.poner(E, 'justicia', `Una denuncia por ${cs.delito} apunta a ${J.nombre}.`, 'ES'); C.Personaje.log(E, `Una denuncia por ${cs.delito} apunta a ti.`); C.Personaje.cambiar(E, { pop: -1 }, true); }
      }
      // Avance de las causas
      for (const cs of jt.causas) {
        if (cs.fase === 'cerrada' || cs.pend) continue;
        if (t - cs.tFase < cs.dur) continue;
        const i = FASES.indexOf(cs.fase), nueva = FASES[i + 1];
        if (cs.fase === 'sentencia') { cs.fase = 'cerrada'; continue; }
        cs.fase = nueva; cs.tFase = t; cs.dur = nueva === 'juicio' ? U.ri(16, 36) : nueva === 'sentencia' ? U.ri(4, 9) : U.ri(8, 20);
        const archivo = nueva === 'instruccion' && U.chance(0.22 * (jt.fiscal.pid === cs.pid ? 1.5 : 1));
        if (archivo) { cs.fase = 'cerrada'; cs.resultado = 'archivo'; C.Noticias.poner(E, 'justicia', `Se archiva la causa contra ${cs.nombre}.`, 'ES'); if (cs.quien === 'J') C.Personaje.log(E, 'Se archiva la causa contra ti.'); continue; }
        if (nueva === 'sentencia') cs.resultado = U.chance(clamp(cs.gravedad * 0.75 - (cs.colabora ? 0.1 : 0), 0.1, 0.85)) ? 'condena' : 'absolucion';
        if (cs.quien === 'J') { if (nueva === 'instruccion' || nueva === 'sentencia') cs.pend = nueva; C.Personaje.cambiar(E, { pop: -0.8 }, true); continue; }
        // IA: cobertura y consecuencias
        if (nueva === 'instruccion') C.Opinion.empuje(E, cs.pid, -0.04 * cs.gravedad, 0.3);
        if (nueva === 'sentencia') {
          const pa = E.partidos[cs.pid];
          if (cs.resultado === 'condena') { C.Noticias.poner(E, 'justicia', `Condenan a ${cs.nombre} (${pa.sigla}) por ${cs.delito}.`, 'ES'); C.Opinion.empuje(E, cs.pid, -0.12 * cs.gravedad, 0.3); if (E.partidos[cs.pid].lider === cs.quien && E.partidos[cs.pid].lider !== 'J' && U.chance(0.55)) C.Ejecutivo.nuevoLider(E, cs.pid, 'tras la condena de su líder'); }
          else { C.Noticias.poner(E, 'justicia', `Absuelven a ${cs.nombre} (${pa.sigla}).`, 'ES'); C.Opinion.empuje(E, cs.pid, 0.03, 0.3); }
        }
      }
    }
  };
  C.Tiempo.registrar('justicia', { turno: Jx.turno, postInit: E => { if (E.jugador && E.jugador.pais === 'ES') Jx.asegurar(E); } }, 39);

  const R = o => C.Acciones.registrar(Object.assign({ costo: 2, grupo: 'nacional' }, o));
  R({ id: 'negociar_cgpj', nombre: 'Negociar la renovación del CGPJ', icono: '⚖️', desc: 'Presidente o líder de la oposición: intenta cerrar el pacto que desbloquea el Consejo General del Poder Judicial.', disponible: E => { const jt = Jx.asegurar(E), g = E.paises.ES.gob; return jt.cgpj.caducado ? (g.pm === 'J' || E.partidos[E.jugador.partido].lider === 'J' ? true : 'Sólo el presidente o los líderes de partido negocian el CGPJ') : 'El CGPJ está renovado'; }, ejecutar: E => Jx.negociarCgpj(E) });
  R({ id: 'nombrar_fiscal', nombre: 'Nombrar al Fiscal General', icono: '🏛️', desc: 'Presidente del Gobierno: propón un fiscal independiente (sube la confianza en la Justicia) o afín (protege a los tuyos y cabrea a la oposición).', disponible: E => E.paises.ES.gob.pm === 'J' ? true : 'Sólo el presidente del Gobierno', ejecutar: (E, a) => Jx.nombrarFiscal(E, a.perfil || 'independiente') });
  R({ id: 'recurrir_ley', nombre: 'Recurrir una ley ante el TC', icono: '📜', desc: 'Oposición con grupo propio (50 diputados): presenta un recurso de inconstitucionalidad contra una ley en vigor.', disponible: E => { const g = E.paises.ES.gob; return g.coalicion.includes(E.jugador.partido) ? 'Tu partido está en el Gobierno' : ((E.paises.ES.escanos[E.jugador.partido] || 0) >= 50 || E.jugador.rol === 'lider') ? true : 'Necesitas 50 diputados'; }, ejecutar: (E, a) => Jx.recurrir(E, a.vigor) });
})(window.ESP);

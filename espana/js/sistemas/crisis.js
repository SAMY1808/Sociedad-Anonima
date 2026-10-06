/* Crisis y emergencias nacionales: DANA, incendios, olas de calor, brotes epidémicos, atentados, crisis migratoria y apagones.
   El Estado y las comunidades afectadas deciden cómo responder; la gestión pesa en la aprobación y en la relación territorial. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  /* meses 0–11; reg = comunidades posibles; nac = afecta al conjunto */
  const TIPOS = {
    dana: { n: 'DANA e inundaciones', ic: '🌊', meses: [8, 9, 10, 11], reg: ['VAL', 'MUR', 'AND', 'CAT', 'BAL', 'ARA'], dur: [8, 14], ind: { viv: -0.6, rur: -0.3 }, w: 1.2 },
    incendios: { n: 'Incendios forestales', ic: '🔥', meses: [5, 6, 7, 8], reg: ['GAL', 'CYL', 'EXT', 'AND', 'ARA', 'MAD'], dur: [4, 9], ind: { amb: -0.7, rur: -0.4 }, w: 1.2 },
    calor: { n: 'Ola de calor y sequía', ic: '☀️', meses: [5, 6, 7], reg: ['AND', 'EXT', 'MUR', 'CLM', 'VAL', 'ARA'], dur: [5, 10], ind: { amb: -0.4, rur: -0.5 }, w: 0.8 },
    pandemia: { n: 'Brote epidémico', ic: '🦠', meses: [0, 1, 2, 9, 10, 11], reg: null, dur: [10, 20], ind: { sal: -0.8 }, w: 0.5 },
    atentado: { n: 'Atentado terrorista', ic: '⚠️', meses: null, reg: ['MAD', 'CAT', 'AND', 'VAL'], dur: [3, 5], ind: { seg: -0.6, lib: -0.2 }, w: 0.35 },
    migracion: { n: 'Crisis migratoria', ic: '🚤', meses: [3, 4, 5, 6, 7, 8, 9], reg: ['CAN', 'CEU', 'MEL', 'AND'], dur: [8, 16], ind: { coh: -0.5, seg: -0.2 }, w: 0.8 },
    apagon: { n: 'Gran apagón eléctrico', ic: '⚡', meses: null, reg: null, dur: [2, 4], ind: { ener: -0.8 }, w: 0.4 }
  };
  /* Decisiones: estatales (pm) y autonómicas (presidente de una comunidad afectada) */
  const OPC_ESTADO = {
    ume: ['Desplegar la UME', 'Eficacia +30 %. Cuesta algo de déficit.', 0.30, { deficit: 0.04 }],
    emergencia: ['Declarar emergencia de interés nacional', 'El Estado asume el mando: eficacia +35 %, pero enfada a las comunidades.', 0.35, {}],
    ayudas: ['Aprobar ayudas extraordinarias', 'Eficacia +15 % y mejor recuperación. Sube el déficit.', 0.15, { deficit: 0.09 }],
    coordinar: ['Convocar la comisión de coordinación con las comunidades', 'Eficacia +15 % y mejora la relación con las comunidades.', 0.15, {}],
    minimizar: ['Quitar hierro al asunto', 'No haces nada: la gestión depende de lo que hagan los demás.', 0, {}]
  };
  const OPC_REG = {
    emergencia_autonomica: ['Activar el plan de emergencias autonómico', 'Eficacia +25 % en tu comunidad. Gasta crédito de tus consejerías.', 0.25],
    pedir_ayuda: ['Pedir la ayuda del Estado', 'Si el Gobierno te escucha, eficacia +30 %. Si no, se tensa la relación.', 0.3],
    culpar_estado: ['Culpar al Estado de la falta de medios', 'Más apoyo propio, peor relación con Moncloa y ninguna mejora de la respuesta.', 0]
  };

  const Cr = C.Crisis = {
    TIPOS, OPC_ESTADO, OPC_REG,
    asegurar(E) { if (!E.esp.crisis) E.esp.crisis = { activas: [], hist: [], ult: 0 }; return E.esp.crisis; },
    jugadorEstado(E) { const J = E.jugador; return !!(J && J.pais === 'ES' && E.paises.ES.gob.pm === 'J'); },
    jugadorRegion(E, cr) { const J = E.jugador; return !!(J && J.pais === 'ES' && J.cargo === 'presauto' && cr.regs.includes(J.region)); },

    nueva(E) {
      const cs = Cr.asegurar(E), mes = U.hoy().getUTCMonth();
      const pos = Object.keys(TIPOS).filter(k => !TIPOS[k].meses || TIPOS[k].meses.includes(mes)).filter(k => !cs.activas.some(c => c.tipo === k));
      if (!pos.length) return null;
      const k = U.pesado(pos, x => TIPOS[x].w), T = TIPOS[k], sev = U.chance(0.15) ? 3 : U.chance(0.45) ? 2 : 1;
      let regs = T.reg ? [U.pick(T.reg.filter(x => D().ccaa[x]))] : C.Territorio.ids();
      if (T.reg && (k === 'calor' || k === 'incendios') && U.chance(0.5)) { const o = U.pick(T.reg.filter(x => x !== regs[0])); if (o) regs.push(o); }
      if (!regs.length) regs = [U.pick(T.reg || C.Territorio.ids())];
      const efic = {}; regs.forEach(c => { const rc = E.esp.ccaa[c]; efic[c] = clamp(0.2 + (rc && rc.gob ? rc.gob.estab / 100 * 0.2 : 0.1) + U.gauss(0, 0.05), 0.05, 0.6); });
      const cr = { id: U.id('cr'), tipo: k, regs, sev, t0: E.fecha.t, dur: U.ri(T.dur[0], T.dur[1]) + sev, fase: 'emergencia', efic, dano: Object.fromEntries(regs.map(c => [c, 0])), usadas: [], usadasReg: [], pend: true };
      cs.activas.push(cr);
      const lugar = k === 'apagon' || k === 'pandemia' ? 'toda España' : regs.map(c => D().ccaa[c].nombre).join(' y ');
      C.Noticias.poner(E, 'politica', `${T.n} en ${lugar}${sev === 3 ? ': la situación es gravísima' : sev === 2 ? ': situación grave' : ''}.`, 'ES');
      if (!E.meta.presim && (Cr.jugadorEstado(E) || regs.some(c => E.jugador && E.jugador.region === c && E.jugador.cargo === 'presauto'))) C.Eventos.info(E, `${T.ic} ${T.n}`, `${T.n} en ${lugar} (gravedad ${sev}/3). Decide cómo responder en la pestaña Crisis: cada medida que tomes mejora la eficacia de la respuesta.`);
      return cr;
    },

    decidir(E, id, k, ambito) {
      const cs = Cr.asegurar(E), cr = cs.activas.find(x => x.id === id), J = E.jugador, T = cr && TIPOS[cr.tipo]; if (!cr || cr.fase === 'cerrada') return { ok: false, msg: 'La crisis ya no está activa' };
      if (ambito === 'estado') {
        if (!Cr.jugadorEstado(E)) return { ok: false, msg: 'Sólo el presidente del Gobierno decide la respuesta del Estado' };
        const o = OPC_ESTADO[k]; if (!o) return { ok: false, msg: 'Medida desconocida' }; if (cr.usadas.includes(k)) return { ok: false, msg: 'Ya has tomado esa medida' };
        cr.usadas.push(k); cr.regs.forEach(c => { cr.efic[c] = clamp(cr.efic[c] + o[2], 0.05, 1.2); });
        if (Object.keys(o[3]).length) C.Economia.aplicar(E, 'ES', { deficit: (o[3].deficit || 0) * cr.sev });
        if (k === 'emergencia') cr.regs.forEach(c => { const rc = E.esp.ccaa[c], g = E.paises.ES.gob; if (rc && rc.gob && !g.coalicion.includes(rc.gob.partido)) { rc.relM = clamp(rc.relM - 5, 0, 100); rc.agravio += 1; } });
        if (k === 'coordinar') cr.regs.forEach(c => { const rc = E.esp.ccaa[c]; if (rc) rc.relM = clamp(rc.relM + 4, 0, 100); });
        C.Personaje.cambiar(E, { prestigio: 0.4 }); return { ok: true, msg: `${o[0]}: eficacia de la respuesta +${Math.round(o[2] * 100)} %.` };
      }
      const o = OPC_REG[k]; if (!o) return { ok: false, msg: 'Medida desconocida' };
      if (!Cr.jugadorRegion(E, cr)) return { ok: false, msg: 'Sólo el presidente de una comunidad afectada decide su respuesta' };
      if (cr.usadasReg.includes(k)) return { ok: false, msg: 'Ya has tomado esa medida' }; cr.usadasReg.push(k);
      const c = J.region, rc = E.esp.ccaa[c], g = E.paises.ES.gob;
      if (k === 'emergencia_autonomica') { cr.efic[c] = clamp(cr.efic[c] + o[2], 0.05, 1.2); if (rc.pres) { const ids = Object.keys(rc.pres.cred); ids.forEach(x => { rc.pres.cred[x] = Math.max(0, rc.pres.cred[x] * 0.92); }); } return { ok: true, msg: 'Activas el plan autonómico de emergencias: eficacia +25 % (gasta algo de crédito).' }; }
      if (k === 'pedir_ayuda') { const afin = 1 - U.distIdeo(E.partidos[rc.gob.partido], E.partidos[g.partido]), p = clamp(0.35 + afin * 0.5 + (g.coalicion.includes(rc.gob.partido) ? 0.2 : 0), 0.15, 0.95); if (U.chance(p)) { cr.efic[c] = clamp(cr.efic[c] + o[2], 0.05, 1.2); rc.relM = clamp(rc.relM + 2, 0, 100); return { ok: true, msg: 'El Estado envía medios: eficacia +30 % en tu comunidad.' }; } rc.relM = clamp(rc.relM - 3, 0, 100); rc.agravio += 1; return { ok: true, exito: false, msg: 'Moncloa tarda en responder: se tensa la relación.' }; }
      rc.relM = clamp(rc.relM - 3, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob + 1.2, 5, 90); return { ok: true, msg: 'Culpas al Estado: ganas apoyo, pero la respuesta no mejora.' };
    },

    turno(E) {
      const cs = Cr.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob; if (E.meta.presim) return;
      const base = 0.011 * (E.esp.cortes.estado === 'activa' ? 1 : 0.5);
      if (cs.activas.filter(c => c.fase !== 'cerrada').length < 2 && t - cs.ult > 10 && U.chance(base)) { if (Cr.nueva(E)) cs.ult = t; }
      for (const cr of cs.activas) {
        if (cr.fase === 'cerrada') continue;
        const T = TIPOS[cr.tipo], edad = t - cr.t0;
        // La IA decide cuando el jugador no gestiona la crisis
        if (!Cr.jugadorEstado(E) && edad === 1) { const ks = Object.keys(OPC_ESTADO).filter(k => U.chance(g.estab / 130)); ks.forEach(k => cr.regs.forEach(c => { cr.efic[c] = clamp(cr.efic[c] + OPC_ESTADO[k][2] * 0.7, 0.05, 1.2); })); }
        for (const c of cr.regs) { const rc = E.esp.ccaa[c]; if (rc && rc.gob && edad === 1 && !(E.jugador && E.jugador.region === c && E.jugador.cargo === 'presauto') && U.chance(0.6)) cr.efic[c] = clamp(cr.efic[c] + 0.2, 0.05, 1.2); }
        for (const c of cr.regs) cr.dano[c] += cr.sev * (0.55 - 0.45 * Math.min(1, cr.efic[c]));
        if (edad >= cr.dur) Cr.cerrar(E, cr);
      }
      cs.activas = cs.activas.filter(c => c.fase !== 'cerrada' || t - c.t0 < 4);
    },
    cerrar(E, cr) {
      const cs = Cr.asegurar(E), T = TIPOS[cr.tipo], g = E.paises.ES.gob, S = C.Impacto && C.Impacto.asegurar(E);
      cr.fase = 'cerrada'; cr.pend = false;
      let tot = 0;
      for (const c of cr.regs) {
        const sc = clamp(cr.dano[c] / Math.max(1, cr.sev * cr.dur * 0.55), 0, 1.2), rc = E.esp.ccaa[c]; tot += sc; cr.dano[c] = sc;
        if (rc && rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + (0.5 - sc) * 6, 5, 90);
      }
      const media = tot / cr.regs.length; cr.score = media;
      const victimas = cr.tipo === 'apagon' ? 0 : Math.round(cr.sev * U.ri(2, 14) * (0.4 + media)), danos = Math.round(cr.sev * U.ri(150, 800) * (0.5 + media));
      cr.victimas = victimas; cr.danos = danos;
      g.aprob = clamp(g.aprob + (0.5 - media) * 4 * (cr.regs.length > 3 ? 1 : 0.6), 5, 90);
      if (S) for (const k in T.ind) S.off[k] = (S.off[k] || 0) + T.ind[k] * media * cr.sev * 0.5;
      cs.hist.unshift({ id: cr.id, tipo: cr.tipo, t0: cr.t0, t1: E.fecha.t, regs: cr.regs, sev: cr.sev, score: media, victimas, danos });
      if (cs.hist.length > 20) cs.hist.length = 20;
      const juicio = media < 0.35 ? 'La respuesta es elogiada' : media < 0.6 ? 'La gestión recibe críticas moderadas' : 'La gestión se considera un desastre';
      C.Noticias.poner(E, 'politica', `Fin de ${T.n.toLowerCase()}: ${victimas ? victimas + ' víctimas y ' : ''}${danos} millones de euros en daños. ${juicio}.`, 'ES');
      if (Cr.jugadorEstado(E) || (E.jugador && E.jugador.cargo === 'presauto' && cr.regs.includes(E.jugador.region))) { C.Personaje.log(E, `${T.n}: ${juicio.toLowerCase()}.`); C.Personaje.cambiar(E, { prestigio: (0.5 - media) * 6, pop: (0.5 - media) * 4 }, true); }
    }
  };
  C.Tiempo.registrar('crisis', { turno: Cr.turno, postInit: E => Cr.asegurar(E) }, 42);

  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  R({ id: 'gestionar_crisis', nombre: 'Gestionar una crisis', icono: '🚨', desc: 'Toma una medida de respuesta ante una crisis activa (Estado o comunidad afectada).', disponible: E => { const cs = Cr.asegurar(E).activas.filter(c => c.fase !== 'cerrada'); return cs.length ? (Cr.jugadorEstado(E) || cs.some(c => Cr.jugadorRegion(E, c)) ? true : 'No te corresponde la respuesta a ninguna crisis activa') : 'No hay crisis activas'; }, ejecutar: (E, a) => Cr.decidir(E, a.id, a.k, a.ambito) });
  if (C.Jefe) C.Jefe.registrar('crisis', {
    propone(E) { const out = []; Cr.asegurar(E).activas.filter(c => c.fase !== 'cerrada').forEach(c => { if (Cr.jugadorEstado(E)) { const k = ['ume', 'coordinar', 'ayudas', 'emergencia'].find(x => !c.usadas.includes(x)); if (k) out.push({ txt: `${TIPOS[c.tipo].n}: ${OPC_ESTADO[k][0]}.`, accion: 'gestionar_crisis', args: { id: c.id, k, ambito: 'estado' } }); } else if (Cr.jugadorRegion(E, c)) { const k = ['emergencia_autonomica', 'pedir_ayuda'].find(x => !c.usadasReg.includes(x)); if (k) out.push({ txt: `${TIPOS[c.tipo].n}: ${OPC_REG[k][0]}.`, accion: 'gestionar_crisis', args: { id: c.id, k, ambito: 'region' } }); } }); return out; },
    hace(E) { const out = []; Cr.asegurar(E).activas.filter(c => c.fase !== 'cerrada').forEach(c => { const ks = Cr.jugadorEstado(E) ? ['ume', 'coordinar', 'ayudas'] : Cr.jugadorRegion(E, c) ? ['emergencia_autonomica', 'pedir_ayuda'] : []; ks.forEach(k => { if ((Cr.jugadorEstado(E) ? c.usadas : c.usadasReg).includes(k)) return; const r = Cr.decidir(E, c.id, k, Cr.jugadorEstado(E) ? 'estado' : 'region'); if (r.ok) out.push(`${TIPOS[c.tipo].n}: ${r.msg}`); }); }); return out; }
  });
})(window.ESP);

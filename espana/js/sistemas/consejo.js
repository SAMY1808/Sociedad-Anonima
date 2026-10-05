/* Consejo de Ministros: agenda semanal de proyectos de ley, decretos-ley, reales decretos, peticiones territoriales y crisis.
   Si el jugador es presidente decide cada punto; si no, decide la IA. Fricción de coalición, Presupuestos, cuestión de confianza y remodelaciones. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const MAX_AGENDA = 6;

  const T_ = () => C.Territorio;

  const Cn = {
    init(E) {
      const P = E.paises.ES, g = P.gob;
      E.esp.consejo = { agenda: [], hist: [], tension: 0, autoridad: 62, sat: {}, ultimo: 0, remodelado: 0 };
      E.esp.pge = { ano: 2026, estado: U.chance(0.5) ? 'prorrogado' : 'aprobado', tramite: null, intentos: 0 };
      if (g) g.coalicion.concat(g.apoyoExterno || []).forEach(k => E.esp.consejo.sat[k] = U.clamp(U.gauss(62, 8), 40, 80));
    },

    pmEsJ(E) { const g = E.paises.ES.gob; return !!(E.jugador && g && g.pm === 'J'); },
    pm(E) { return E.politicos[E.paises.ES.gob.pm]; },
    enFunciones(E) { const c = E.esp.cortes; return c.estado !== 'activa'; },

    nuevo(E, o) {
      const it = Object.assign({ id: U.id('c'), t: E.fecha.t, limite: E.fecha.t + 2, urgente: false, quien: { tipo: 'ministro' } }, o);
      E.esp.consejo.agenda.push(it);
      return it;
    },

    /* ── Generación de puntos del orden del día ── */
    generar(E) {
      const P = E.paises.ES, g = P.gob, cs = E.esp.consejo, t = E.fecha.t;
      if (cs.agenda.length >= MAX_AGENDA) return;
      const r = U.r();
      if (r < 0.04) Cn.genDerogacion(E);
      else if (r < 0.46) Cn.genMinisterio(E);
      else if (r < 0.62) Cn.genSocio(E);
      else if (r < 0.76) Cn.genTerritorial(E);
      else if (r < 0.9) Cn.genDecreto(E);
    },

    genMinisterio(E) {
      const g = E.paises.ES.gob, mins = D().ministerios;
      const m = U.pesado(mins, x => x.peso), mid = g.ministros[m.id], pol = E.politicos[mid]; if (!pol) return;
      const tpl = C.Congreso.elegirPlantilla(E, pol, m.sector); if (!tpl) return;
      const rdl = tpl.rdl && U.chance(0.35);
      Cn.nuevo(E, { tipo: rdl ? 'rdl' : 'ley', titulo: tpl.t, desc: tpl.d, tpl: tpl.id, sector: tpl.s, quien: { tipo: 'ministro', min: m.id, pid: pol.p, nombre: pol.n } });
    },

    genSocio(E) {
      const g = E.paises.ES.gob, socios = g.coalicion.filter(k => k !== g.partido); if (!socios.length) return;
      const pid = U.pick(socios), pa = E.partidos[pid];
      const tpl = C.Congreso.elegirPlantilla(E, pa, null, l => !l.manual && l.ter != null && Math.abs(l.ter - pa.ter) < 90); if (!tpl) return;
      Cn.nuevo(E, { tipo: tpl.rdl && U.chance(0.3) ? 'rdl' : 'ley', titulo: tpl.t, desc: tpl.d, tpl: tpl.id, sector: tpl.s, quien: { tipo: 'socio', pid, nombre: pa.sigla } });
    },

    genTerritorial(E) {
      const T = C.Territorio, ids = T.ids().filter(c => { const rc = E.esp.ccaa[c]; return rc.relM < 50 || rc.indep > 10 || U.chance(0.2); });
      if (!ids.length) return;
      const c = U.pesado(ids, x => 60 - E.esp.ccaa[x].relM + E.esp.ccaa[x].indep), rc = E.esp.ccaa[c], d = D().ccaa[c];
      const tipos = [
        { k: 'fondos', t: `${d.nombre} reclama fondos y un plan de infraestructuras`, d: 'La comunidad pide al Gobierno un plan específico de inversiones y la ejecución de las obras pendientes.' },
        { k: 'bilat', t: `Comisión bilateral Estado–${d.nombre}`, d: 'El Gobierno autonómico solicita reunir la comisión bilateral para tratar financiación y competencias.' }
      ];
      if (rc.deuda > 28) tipos.push({ k: 'deuda', t: `${d.nombre} exige un alivio de su deuda`, d: 'Pide al Estado asumir parte de la deuda autonómica.' });
      if (c === 'CAT' || c === 'PVA') tipos.push({ k: 'estatus', t: `${d.nombre} reclama el reconocimiento de su singularidad`, d: 'Su Gobierno pide un nuevo marco político: financiación singular y reconocimiento nacional.' });
      const kc = rc.reclama && rc.reclama.find(k => rc.comp[k] < 2);
      if (kc && U.chance(0.55)) { T.pedirComp(E, c, kc); return; }
      const x = U.pick(tipos);
      Cn.nuevo(E, { tipo: 'territorial', titulo: x.t, desc: x.d, region: c, sub: x.k, sector: 'ter', quien: { tipo: 'ccaa', nombre: d.nombre, pid: rc.gob && rc.gob.partido } });
    },

    /* Un Gobierno de signo contrario quiere deshacer una ley en vigor (derogación). */
    genDerogacion(E) {
      const g = E.paises.ES.gob, pm = E.politicos[g.pm]; if (!pm || !E.esp.vigor) return;
      const cand = E.esp.vigor.filter(v => v.estado === 'activa' && !v.rdl && E.fecha.t - v.t0 > 52 && v.autor && v.autor.pid !== g.partido && !E.esp.consejo.agenda.some(i => i.dero === v.id) && !C.Congreso.abiertos(E).some(p => p.deroga === v.id || p.reforma === v.id));
      const v = U.pesado(cand.map(x => ({ x, d: U.distIdeo(pm, C.Congreso.plantilla(x.tpl)) })).filter(y => y.d > 0.4), y => y.d * y.d);
      if (!v) return;
      const tpl = C.Congreso.plantilla(v.x.tpl);
      Cn.nuevo(E, { tipo: 'ley', titulo: `Derogar «${v.x.t}»`, desc: 'El Gobierno estudia derogar esta ley, aprobada por otro signo político, y revertir sus efectos.', tpl: tpl.id, dero: v.x.id, sector: tpl.s, quien: { tipo: 'ministro', min: null, pid: g.partido, nombre: 'Consejo' } });
    },

    genDecreto(E) {
      const dec = U.pick(D().decretos.filter(x => x.id !== 'rd_conferencia' || E.fecha.t - E.esp.confPres.ultima > 52));
      if (E.esp.consejo.agenda.some(i => i.dec === dec.id)) return;
      Cn.nuevo(E, { tipo: 'rd', titulo: dec.t, desc: dec.texto, dec: dec.id, sector: dec.sector, quien: { tipo: 'ministro', nombre: 'Consejo' } });
    },

    /* ── Opciones disponibles de cada punto ── */
    opciones(E, it) {
      const o = [];
      if (it.tipo === 'ley') { o.push({ k: 'enviar', t: it.dero ? 'Aprobar la derogación y remitirla a las Cortes' : 'Aprobar y remitir a las Cortes', d: it.dero ? 'Proyecto de ley de derogación: sus efectos se revertirán poco a poco.' : 'Proyecto de ley: tramitación ordinaria (semanas o meses).' }); }
      if (it.tipo === 'rdl') { o.push({ k: 'rdl', t: 'Aprobar por decreto-ley', d: 'Entra en vigor ya; el Congreso debe convalidarlo en 30 días. Si cae, se deroga.' }); o.push({ k: 'enviar', t: 'Remitir como proyecto de ley', d: 'Tramitación ordinaria, sin urgencia.' }); }
      if (it.tipo === 'territorial') { o.push({ k: 'conceder', t: 'Acceder a la petición', d: 'Mejora la relación con la comunidad, pero genera agravio comparativo.' }); o.push({ k: 'negociar', t: 'Abrir una mesa de negociación', d: 'Gana tiempo y algo de confianza.' }); }
      if (it.tipo === 'competencia') { const cp = D().competencias[it.comp]; o.push({ k: 'conceder', t: cp.ley ? 'Proponer la ley orgánica de transferencia' : 'Acordar el traspaso (comisión mixta y real decreto)', d: cp.ley ? 'Necesita 176 votos en el Congreso y el paso por el Senado.' : 'Se hace efectivo en unas semanas.' }); o.push({ k: 'negociar', t: 'Abrir una negociación', d: 'Gana tiempo y sube la probabilidad de acuerdo futuro.' }); }
      if (it.tipo === 'cupo') { o.push({ k: 'subir', t: 'Cupo alto (favorable al Estado)', d: 'Más ingresos para el Estado; enfado en el gobierno foral.' }); o.push({ k: 'pactar', t: 'Cupo pactado', d: 'Un acuerdo equilibrado.' }); o.push({ k: 'bajar', t: 'Cupo bajo (favorable a la comunidad)', d: 'Contenta a la comunidad foral; agravio en el resto.' }); }
      if (it.tipo === 'cpff') { o.push({ k: 'mas', t: 'Más recursos para las comunidades', d: 'Sube la financiación y la relación; aumenta el déficit.' }); o.push({ k: 'mantener', t: 'Mantener el modelo', d: 'Sin cambios.' }); o.push({ k: 'recortar', t: 'Ajuste fiscal', d: 'Reduce el déficit; tensión con las comunidades.' }); }
      if (it.tipo === 'rd') o.push({ k: 'aprobar', t: 'Aprobar el real decreto', d: 'Se ejecuta de inmediato.' });
      if (it.tipo === 'pge') { o.push({ k: 'presentar', t: 'Presentar el proyecto de Presupuestos', d: 'Se tramita en las Cortes; si pierde la enmienda a la totalidad, se prorrogan.' }); o.push({ k: 'prorrogar', t: 'Prorrogar los Presupuestos', d: 'Evita el riesgo de una derrota, a costa de los socios.' }); }
      if (it.tipo === 'proces') { o.push({ k: '155', t: 'Pedir la aplicación del artículo 155', d: 'Requiere mayoría absoluta del Senado. Intervención de la Generalitat y elecciones.' }); o.push({ k: 'dialogo', t: 'Abrir un diálogo político', d: 'Evita la ruptura, pero te expone a la oposición.' }); o.push({ k: 'nada', t: 'No hacer nada', d: 'Dejar que los hechos se consuman.' }); }
      if (!['pge', 'proces', 'cupo', 'cpff'].includes(it.tipo)) { o.push({ k: 'aplazar', t: 'Aplazar', d: 'Lo retiras del orden del día.' }); o.push({ k: 'rechazar', t: 'Rechazar', d: 'Tensión con quien lo propone.' }); }
      return o;
    },

    /* Resolución de un punto (jugador o IA). */
    resolver(E, id, k, porIA) {
      const cs = E.esp.consejo, i = cs.agenda.findIndex(x => x.id === id); if (i < 0) return null;
      const it = cs.agenda[i]; cs.agenda.splice(i, 1);
      const txt = Cn.ejecutar(E, it, k);
      cs.hist.unshift({ t: E.fecha.t, titulo: it.titulo, k, quien: it.quien, tipo: it.tipo, txt });
      if (cs.hist.length > 60) cs.hist.length = 60;
      cs.ultimo = E.fecha.t;
      return txt;
    },

    sat(E, pid, d) { const cs = E.esp.consejo; if (pid == null || cs.sat[pid] == null) return; cs.sat[pid] = U.clamp(cs.sat[pid] + d, 0, 100); },

    ejecutar(E, it, k) {
      const P = E.paises.ES, g = P.gob, cs = E.esp.consejo;
      const aut = it.quien || {};
      const tpl = it.tpl ? C.Congreso.plantilla(it.tpl) : null;
      const satP = aut.pid && aut.pid !== g.partido ? aut.pid : null;
      if (k === 'aplazar') { Cn.sat(E, satP, -2.5); return 'Aplazado'; }
      if (k === 'rechazar') { Cn.sat(E, satP, -6); if (aut.tipo === 'ccaa') { const rc = E.esp.ccaa[it.region]; rc.relM = Math.max(0, rc.relM - 5); } return 'Rechazado'; }
      if (it.tipo === 'ley' || it.tipo === 'rdl') {
        const autor = { tipo: 'gobierno', pid: g.partido, ministerio: aut.min || null, socio: aut.tipo === 'socio' ? aut.pid : null };
        if (it.dero) {
          const p = C.Congreso.proponerCambio(E, it.dero, 'derogar', autor); if (!p) return 'Sin efecto';
          C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el proyecto de ley de ${p.t.charAt(0).toLowerCase() + p.t.slice(1)} y lo remite a las Cortes.`, 'ES');
          Cn.sat(E, satP, 5); return 'Proyecto de derogación remitido a las Cortes';
        }
        const dis = it.dis || C.Impacto.disDefecto(E, tpl, autor);
        if (k === 'rdl') {
          const pr = C.Congreso.proyectar(E, C.Congreso.pseudo(E, tpl, autor, dis));
          const p = C.Congreso.registrarRDL(E, tpl.id, autor, { pacto: null, dis });
          if (p) { C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el real decreto-ley «${tpl.t}».`, 'ES'); Cn.sat(E, satP, 6); if (pr.dist < 0) g.estab -= 0.6; return 'Decreto-ley aprobado (convalidación en el Congreso)'; }
        }
        const p = C.Congreso.proponer(E, tpl.id, autor, { dis }); if (!p) return 'Sin efecto';
        C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el proyecto de ley «${tpl.t}» y lo remite a las Cortes.`, 'ES');
        Cn.sat(E, satP, 5); if (aut.tipo === 'ministro') Cn.sat(E, g.partido, 0.5);
        return 'Proyecto remitido a las Cortes';
      }
      if (it.tipo === 'competencia') return Cn.competencia(E, it, k);
      if (it.tipo === 'cupo') return T_().aplicarCupo(E, it.region, k);
      if (it.tipo === 'cpff') return T_().aplicarCpff(E, k);
      if (it.tipo === 'territorial') return Cn.territorial(E, it, k);
      if (it.tipo === 'rd') return Cn.decreto(E, it);
      if (it.tipo === 'pge') return Cn.pge(E, it, k);
      if (it.tipo === 'proces') { const r = C.Territorio.procesResolver(E, it.region, k); return 'Respuesta al desafío: ' + r; }
      return '';
    },

    competencia(E, it, k) {
      const rc = E.esp.ccaa[it.region], cp = D().competencias[it.comp], d = D().ccaa[it.region];
      if (k === 'negociar') { rc.relM = Math.min(100, rc.relM + 3); rc.presion[it.comp] = Math.min(0.3, (rc.presion[it.comp] || 0) + 0.1); return `Negociación abierta con ${d.nombre} sobre ${cp.nombre.toLowerCase()}`; }
      if (k === 'conceder') { const r = T_().concederComp(E, it.region, it.comp); return r === 'ley' ? `Proyecto de ley orgánica de transferencia remitido a las Cortes (${cp.nombre})` : `Traspaso de ${cp.nombre.toLowerCase()} a ${d.nombre} en marcha`; }
      if (k === 'rechazar') { rc.relM = Math.max(0, rc.relM - 5); if (d.indep0 > 3) rc.concesiones.push({ t: E.fecha.t, v: 0.6, d: 'Competencia denegada' }); }
      if (E.jugador && E.jugador.region === it.region && ['presauto', 'consejero'].includes(E.jugador.cargo)) C.Personaje.log(E, `El Gobierno ${k === 'rechazar' ? 'rechaza' : 'aplaza'} tu petición sobre ${cp.nombre.toLowerCase()}.`);
      return k === 'rechazar' ? 'Competencia denegada' : 'Aplazado';
    },

    territorial(E, it, k) {
      const c = it.region, rc = E.esp.ccaa[c], d = D().ccaa[c], T = C.Territorio, g = E.paises.ES.gob;
      if (k === 'negociar') { rc.relM = Math.min(100, rc.relM + 3.5); return `Mesa de negociación con ${d.nombre}`; }
      if (k !== 'conceder') return '';
      const dem = { fondos: () => { rc.relM = Math.min(100, rc.relM + 6); g.aprob -= 0.1; C.Economia.aplicar(E, 'ES', { deficit: 0.05 }); }, transf: () => { rc.aut = Math.min(100, rc.aut + 3); rc.relM = Math.min(100, rc.relM + 7); }, bilat: () => { rc.relM = Math.min(100, rc.relM + 5); },
                    deuda: () => { rc.deuda = Math.max(3, rc.deuda * 0.85); rc.relM = Math.min(100, rc.relM + 6); C.Economia.aplicar(E, 'ES', { deficit: 0.05 }); }, estatus: () => { rc.relM = Math.min(100, rc.relM + 9); rc.concesiones.push({ t: E.fecha.t, v: -1, d: 'Reconocimiento' }); } }[it.sub];
      if (dem) dem();
      // Agravio comparativo en el resto
      for (const x of T.ids()) if (x !== c) E.esp.ccaa[x].agravio += (it.sub === 'estatus' ? 2 : 0.6) * (E.esp.ccaa[x].gob && !g.coalicion.includes(E.esp.ccaa[x].gob.partido) ? 1.4 : 1);
      if (it.sub === 'estatus') { const q = C.Territorio; q.marea(E, 'financiacion'); }
      Cn.sat(E, rc.gob && rc.gob.partido, 3);
      C.Noticias.poner(E, 'politica', `El Gobierno accede a la petición de ${d.nombre} («${it.titulo}»).`, 'ES');
      return `Concedido a ${d.nombre}`;
    },

    decreto(E, it) {
      const g = E.paises.ES.gob, T = C.Territorio;
      if (it.dec === 'rd_fondos_europeos') { for (const c of T.ids()) E.esp.ccaa[c].relM = Math.min(100, E.esp.ccaa[c].relM + 1.2); if (C.UE && C.UE.fondos) C.UE.fondos(E); g.aprob += 0.3; }
      else if (it.dec === 'rd_conferencia') T.conferenciaPresidentes(E);
      else if (it.dec === 'rd_seguridad_nacional') { g.aprob += 0.2; C.Economia.aplicar(E, 'ES', { deficit: 0.05 }); }
      else g.aprob += 0;
      C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba: ${it.titulo}.`, 'ES');
      return 'Real decreto aprobado';
    },

    /* ── IA: decide como presidente del Gobierno ── */
    decidirIA(E, it) {
      const g = E.paises.ES.gob, pm = E.politicos[g.pm]; if (!pm) return;
      let k = 'aplazar';
      if (it.tipo === 'ley' || it.tipo === 'rdl') {
        const tpl = C.Congreso.plantilla(it.tpl);
        if (it.dero) { const v = (E.esp.vigor || []).find(x => x.id === it.dero && x.estado === 'activa'); const pr0 = v ? C.Congreso.proyectar(E, Object.assign(C.Congreso.pseudo(E, tpl, { tipo: 'gobierno', pid: g.partido }, v.dis), { eco: -tpl.eco, soc: -tpl.soc, eu: -(tpl.eu || 0), ter: -(tpl.ter || 0), pop: 100 - tpl.pop })) : null; Cn.resolver(E, it.id, pr0 && pr0.dist >= -4 ? 'enviar' : 'aplazar', true); return; }
        const disIA = it.dis || (it.dis = C.Impacto.disDefecto(E, tpl, { tipo: 'gobierno', pid: g.partido }));
        const dist = U.distIdeo(pm, tpl), pr = C.Congreso.proyectar(E, C.Congreso.pseudo(E, tpl, { tipo: 'gobierno', pid: g.partido }, disIA));
        let s = 0.9 - 2.0 * dist + (it.quien.tipo === 'socio' ? 0.3 : 0) + pr.dist / 175 * 0.9;
        if (pr.dist < -20) s -= 0.6;
        if (pr.dist < -4 && (tpl.may === 'organica' || tpl.may === 'cons')) s = -0.1;
        if (pr.dist < -14) s = Math.min(s, -0.1);
        if (s > 0.15) k = it.tipo === 'rdl' && pr.dist > -8 ? 'rdl' : 'enviar'; else if (s < -0.35) k = 'rechazar';
      } else if (it.tipo === 'territorial') {
        const rc = E.esp.ccaa[it.region], afin = 0.4 - U.distIdeo(pm, E.partidos[rc.gob ? rc.gob.partido : g.partido]);
        const sos = (g.apoyoExterno || []).includes(rc.gob && rc.gob.partido) || (g.coalicion.includes(rc.gob && rc.gob.partido));
        const x = afin * 1.5 + (sos ? 0.5 : 0) + (pm.ter - (-20)) / 100;
        k = x > 0.45 ? 'conceder' : x > -0.1 ? 'negociar' : 'rechazar';
      } else if (it.tipo === 'competencia') {
        const pb = T_().probComp(E, it.region, it.comp); k = U.chance(pb) ? 'conceder' : U.chance(0.55) ? 'negociar' : 'rechazar';
      } else if (it.tipo === 'cupo') { k = pm.ter > 10 ? 'bajar' : pm.ter < -30 ? 'subir' : 'pactar';
      } else if (it.tipo === 'cpff') { const dd = E.paises.ES.ec.deficit; k = dd > 3.4 ? 'recortar' : pm.eco < -20 ? 'mas' : 'mantener';
      } else if (it.tipo === 'rd') k = 'aprobar';
      else if (it.tipo === 'pge') {
        const pr = Cn.proyeccionPGE(E);
        k = pr.dist >= -4 ? 'presentar' : 'prorrogar';
      }
      else if (it.tipo === 'proces') return;
      Cn.resolver(E, it.id, k, true);
    },

    proyeccionPGE(E) {
      const g = E.paises.ES.gob, pm = E.politicos[g.pm];
      return C.Congreso.proyectar(E, { may: 'simple', autor: { tipo: 'gobierno', pid: g.partido }, pop: 50, eco: pm.eco, soc: pm.soc, eu: pm.eu, ter: pm.ter, costo: 0.4, apoyo: {}, t: 'PGE' });
    },

    /* ── Presupuestos ── */
    pge(E, it, k) {
      const g = E.paises.ES.gob, pg = E.esp.pge;
      if (k === 'prorrogar') { pg.estado = 'prorrogado'; pg.ano = U.anio(); g.estab -= 1; for (const p of g.coalicion.concat(g.apoyoExterno || [])) Cn.sat(E, p, -3); C.Noticias.poner(E, 'economia', 'El Gobierno renuncia a presentar Presupuestos y los prorroga.', 'ES'); return 'Presupuestos prorrogados'; }
      const pm = E.politicos[g.pm];
      const p = C.Congreso.proponer(E, 'pge', { tipo: 'gobierno', pid: g.partido }, { eco: pm.eco, soc: pm.soc, eu: pm.eu, ter: pm.ter, pge: true });
      pg.tramite = p.id; pg.intentos++;
      C.Noticias.poner(E, 'economia', 'El Gobierno presenta el proyecto de Presupuestos Generales del Estado.', 'ES');
      return 'Presupuestos presentados en el Congreso';
    },

    alFinalizar(E, p, ok) {
      if (!p.pge) return;
      const g = E.paises.ES.gob, pg = E.esp.pge; pg.tramite = null;
      if (ok) { pg.estado = 'aprobado'; pg.ano = U.anio(); g.estab = Math.min(100, g.estab + 6); g.aprob += 0.5; C.Noticias.poner(E, 'economia', 'Las Cortes aprueban los Presupuestos Generales del Estado.', 'ES'); }
      else { pg.estado = 'prorrogado'; g.estab -= 4; C.Noticias.poner(E, 'economia', 'Los Presupuestos fracasan en las Cortes y se prorrogan.', 'ES'); }
    },

    /* ── Iniciativas del presidente y de los ministros ── */
    catalogo(E) {
      const g = E.paises.ES.gob, ab = C.Congreso.abiertos(E).map(p => p.tpl), vig = C.Impacto.vigentes(E);
      return D().leyes.filter(l => !l.manual && !l.rdlSolo || l.id === 'indultos').filter(l => !ab.includes(l.id) && !vig.has(l.id)).map(l => {
        const pr = C.Congreso.proyectar(E, C.Congreso.pseudo(E, l, { tipo: 'gobierno', pid: g.partido }, null));
        return { tpl: l, pr };
      });
    },

    /* El presidente del Gobierno lleva una iniciativa al Consejo. */
    iniciativaPM(E, tplId, via, dis) {
      const g = E.paises.ES.gob, tpl = C.Congreso.plantilla(tplId); if (!tpl) return 'No existe';
      if (Cn.enFunciones(E)) return 'El Gobierno está en funciones';
      const autor = { tipo: 'gobierno', pid: g.partido };
      if (via === 'rdl') {
        if (!tpl.rdl && !tpl.rdlSolo) return 'Esta materia no puede regularse por decreto-ley (ley orgánica o reforma constitucional)';
        const p = C.Congreso.registrarRDL(E, tplId, autor, { dis }); C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el real decreto-ley «${tpl.t}».`, 'ES'); return true;
      }
      if (tpl.rdlSolo) return 'Sólo puede aprobarse por decreto';
      C.Congreso.proponer(E, tplId, autor, { dis }); C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el proyecto de ley «${tpl.t}».`, 'ES'); return true;
    },

    /* El presidente lleva al Consejo la reforma o la derogación de una ley en vigor. */
    iniciativaCambio(E, vigorId, tipo, dis) {
      const g = E.paises.ES.gob; if (Cn.enFunciones(E)) return 'El Gobierno está en funciones';
      const p = C.Congreso.proponerCambio(E, vigorId, tipo, { tipo: 'gobierno', pid: g.partido }, dis);
      if (!p) return 'Esa ley ya tiene una reforma o derogación en trámite';
      C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba el proyecto de ley de ${p.t.charAt(0).toLowerCase() + p.t.slice(1)}.`, 'ES'); return true;
    },

    /* Un ministro (jugador) propone algo de su sector al presidente. */
    propuestaMinistro(E, tplId) {
      const J = E.jugador, g = E.paises.ES.gob, pm = E.politicos[g.pm], tpl = C.Congreso.plantilla(tplId);
      if (!tpl) return 'No existe';
      const dist = U.distIdeo(pm, tpl), pr = C.Congreso.proyectar(E, C.Congreso.pseudo(E, tpl, { tipo: 'gobierno', pid: g.partido }, null));
      const s = 0.85 - 2.0 * dist + pr.dist / 175 * 0.8 + (J.partido !== g.partido ? -0.1 : 0.15) + J.prestigio / 400;
      if (s > 0.1) { const autor = { tipo: 'gobierno', pid: g.partido, ministerio: J.ministerio, jugador: true }; C.Congreso.proponer(E, tplId, autor); C.Noticias.poner(E, 'gobierno', `El Consejo de Ministros aprueba «${tpl.t}», impulsado por ${J.nombre}.`, 'ES'); return true; }
      return s > -0.25 ? 'El presidente la deja «sobre la mesa»: faltan apoyos' : 'El presidente la veta: no encaja con la línea del Gobierno';
    },

    /* ── Turno ── */
    turno(E) {
      const P = E.paises.ES, g = P.gob, cs = E.esp.consejo, t = E.fecha.t, c = E.esp.cortes; if (!g) return;
      // Satisfacción de los socios
      for (const k of g.coalicion.concat(g.apoyoExterno || [])) {
        if (cs.sat[k] == null) cs.sat[k] = 60;
        cs.sat[k] = U.clamp(cs.sat[k] + (g.coalicion.includes(k) && k !== g.partido ? 0 : (60 - cs.sat[k]) * 0.012) + U.gauss(0, 0.5), 0, 100);
      }
      Object.keys(cs.sat).forEach(k => { if (!g.coalicion.includes(k) && !(g.apoyoExterno || []).includes(k)) delete cs.sat[k]; });
      const socios = g.coalicion.filter(k => k !== g.partido);
      cs.tension = socios.length ? U.clamp(100 - U.prom(socios.map(k => cs.sat[k] || 60)), 0, 100) : 0;
      cs.autoridad = U.clamp(cs.autoridad + (60 - cs.autoridad) * 0.01, 10, 100);
      if (cs.tension > 40) g.estab -= (cs.tension - 40) * 0.002;
      // Ruptura de socio
      for (const k of socios) if (cs.sat[k] < 14 && U.chance(0.04) && !(E.jugador && E.jugador.partido === k && E.jugador.rol === 'lider')) { Cn.rompe(E, k); break; }
      if (Cn.enFunciones(E)) {
        // Sólo despacho ordinario: se pueden aplicar fondos y poco más
        cs.agenda = cs.agenda.filter(i => i.urgente);
        return;
      }
      // Puntos del día
      Cn.generar(E);
      // Desafío soberanista: decisión del presidente
      for (const pc in E.esp.procesos) {
        const pr = E.esp.procesos[pc], conf = D().procesos[pc];
        if (pr.fase === 'unilateral' && pr.decidir && !cs.agenda.some(i => i.tipo === 'proces' && i.region === pc))
          Cn.nuevo(E, { tipo: 'proces', titulo: 'Desafío unilateral: ' + D().ccaa[pc].nombre, desc: `${conf.gobierno} ha convocado una ${conf.lema} sin acuerdo. El Consejo de Ministros debe decidir su respuesta.`, urgente: true, limite: pr.limite, region: pc, quien: { tipo: 'pm' } });
      }
      // Presupuestos: primera semana de octubre
      const f = U.hoy();
      if (f.getUTCMonth() === 9 && f.getUTCDate() <= 7 && E.esp.pge.ano < f.getUTCFullYear() && !E.esp.pge.tramite && !cs.agenda.some(i => i.tipo === 'pge') && c.estado === 'activa')
        Cn.nuevo(E, { tipo: 'pge', titulo: 'Presupuestos Generales del Estado', desc: `Plazo para presentar los Presupuestos de ${f.getUTCFullYear() + 1}. Los socios exigen compromisos.`, urgente: false, limite: t + 4, quien: { tipo: 'pm' } });
      // IA decide o caduca
      const pmJ = Cn.pmEsJ(E);
      for (const it of cs.agenda.slice()) {
        if (!pmJ) Cn.decidirIA(E, it);
        else if (t > it.limite) { if (it.tipo === 'proces') continue; cs.agenda.splice(cs.agenda.indexOf(it), 1); Cn.sat(E, it.quien.pid && it.quien.pid !== g.partido ? it.quien.pid : null, -3); }
      }
      if (!pmJ && U.chance(0.0015) && t - cs.remodelado > 52) Cn.remodelar(E);
      // Seguimiento de los Presupuestos en tramitación
      const pg = E.esp.pge;
      if (pg.tramite) { const p = E.proyectos[pg.tramite]; if (!p || p.etapa === 'archivada' || p.etapa === 'rechazada') Cn.alFinalizar(E, Object.assign({ pge: true }, p || {}), false); }
    },

    /* Un socio abandona el Gobierno. */
    rompe(E, pid) {
      const g = E.paises.ES.gob, cs = E.esp.consejo, J = E.jugador;
      g.coalicion = g.coalicion.filter(k => k !== pid);
      const sp = E.partidos[pid];
      if (U.chance(0.5)) { g.apoyoExterno = (g.apoyoExterno || []).concat(pid); cs.sat[pid] = 45; sp.postura = 'apoyo'; } else { delete cs.sat[pid]; sp.postura = 'oposicion'; }
      g.estab = Math.max(0, g.estab - 14); g.tipo = 'minoria';
      C.Ejecutivo.repartirMinisterios(E);
      C.Noticias.poner(E, 'politica', `${sp.sigla} abandona el Gobierno de coalición: los ministros dimiten y se reparten sus carteras.`, 'ES');
      if (J && J.pais === 'ES') C.Eventos.info(E, '💥 Crisis de Gobierno', `${sp.nombre} rompe la coalición. El Gobierno queda en minoría y la estabilidad cae.`);
    },

    /* Remodelación del Gobierno: el presidente (jugador) abre el Gabinete; la IA cambia a los peor valorados. */
    remodelar(E) {
      const g = E.paises.ES.gob, cs = E.esp.consejo;
      if (E.fecha.t - cs.remodelado < 26) return 'Acabas de remodelar el Gobierno';
      cs.remodelado = E.fecha.t;
      if (g.pm === 'J') { E.ui.abrir = { tipo: 'gabinete', key: 'central' }; return true; }
      const G = C.Gabinete, cargos = G.cargos(E, 'central');
      const peores = cargos.map(c => ({ c, r: G.rendDe(E, 'central', c.id) })).sort((a, b) => a.r - b.r).slice(0, 3);
      peores.forEach(x => G.sustituirIA(E, 'central', x.c.id));
      g.aprob += 1.2; cs.autoridad = Math.min(100, cs.autoridad + 4);
      C.Noticias.poner(E, 'gobierno', 'El presidente remodela el Gobierno y sustituye a tres ministros.', 'ES');
      return true;
    },

    /* Cuestión de confianza. */
    cuestionConfianza(E) {
      const g = E.paises.ES.gob, c = E.esp.cortes, Ej = C.Ejecutivo;
      if (c.estado !== 'activa') return 'No es posible ahora';
      const plan = { cand: g.partido, bloque: g.coalicion.concat(g.apoyoExterno || []), aceptadas: {} }, ev = Ej.evaluar(E, g.partido, plan);
      if (ev.si > ev.no) { g.estab = Math.min(100, g.estab + 10); C.Noticias.poner(E, 'politica', `El presidente supera la cuestión de confianza (${ev.si} votos a favor).`, 'ES'); return true; }
      C.Noticias.poner(E, 'politica', `El Congreso niega la confianza al Gobierno (${ev.si} a favor, ${ev.no} en contra).`, 'ES');
      c.estado = 'consultas'; c.tConsulta = E.fecha.t + 1; c.fallidos = []; c.t1 = null; c.investidura = null; g.enFunciones = true;
      return 'derrota';
    },

    pendientesJugador(E) { return Cn.pmEsJ(E) ? E.esp.consejo.agenda.filter(i => i.urgente) : []; }
  };

  C.Consejo = Cn;
  C.Tiempo.registrar('consejo', Cn, 30);
})(window.ESP);

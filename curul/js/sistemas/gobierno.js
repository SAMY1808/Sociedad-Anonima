/* Gobierno: presidente, coalición, gabinete, agenda legislativa, estabilidad de la coalición
   y control político (debates, mociones de censura). */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const G = {
    /* Posesión de un presidente (IA o jugador) */
    posesionar(E, electo, silencioso) {
      const g = E.gobierno;
      // El gabinete saliente vuelve a la vida privada
      for (const id of Object.values(g.gabinete || {})) { const m = E.politicos[id]; if (m && m.cargo && m.cargo.tipo === 'ministro') m.cargo = null; }
      if (g.presidente && E.politicos[g.presidente] && g.presidente !== 'J') { const pr = E.politicos[g.presidente]; pr.cargo = { tipo: 'expresidente' }; C.Politicos.anotar(pr, 'Termina su mandato presidencial'); }
      if (g.presidente === 'J') C.Personaje.dejarCargo(E, 'Termina el mandato presidencial');
      const partido = electo.partido === 'MOV' ? (E.jugador.partido || 'IND') : electo.partido;
      E.gobierno = {
        presidente: electo.pol, partido, vice: null, coalicion: [], gabinete: {}, desde: E.fecha.t,
        electo: null, agenda: [], ultimoProyecto: E.fecha.t, historialGabinete: [], estabilidadHist: []
      };
      const g2 = E.gobierno;
      if (electo.pol === 'J') C.Personaje.asumirCargo(E, 'presidente', {});
      else {
        const pr = E.politicos[electo.pol];
        if (pr.cargo && (pr.cargo.tipo === 'senador' || pr.cargo.tipo === 'representante')) G.vacante(E, pr);
        pr.cargo = { tipo: 'presidente' }; pr.aspiraOtro = null;
        C.Politicos.anotar(pr, 'Se posesiona como Presidente de la República');
      }
      const vice = C.Politicos.crear(E, { partido, depto: U.pick(Object.keys(E.deptos)), cargo: { tipo: 'vicepresidente' } });
      g2.vice = vice.id;
      G.formarCoalicion(E);
      G.nombrarGabinete(E);
      E.opinion.luna = 26;
      E.opinion.aprobacionPres = U.rf(52, 60);
      if (!silencioso) {
        const nom = electo.pol === 'J' ? E.jugador.nombre : E.politicos[electo.pol].nombre;
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${nom} se posesiona como Presidente de la República`, tono: 1, importante: true });
        C.Congreso.log(E, 'gobierno', `Posesión presidencial de ${nom}`);
      }
      C.Bus.emit('gobierno:posesion', g2);
    },
    /* Si un congresista asume otro cargo, su curul pasa al siguiente de la lista (aquí: un nuevo miembro del partido) */
    vacante(E, pol) {
      for (const cam of C.Congreso.CAMARAS) {
        const cur = E.congreso[cam] && E.congreso[cam].curules.find(c => c.pol === pol.id);
        if (!cur) continue;
        const sust = C.Politicos.crear(E, { partido: pol.partido, depto: pol.depto, cargo: { tipo: cam === 'senado' ? 'senador' : 'representante', camara: cam, circ: cur.circ, curul: cur.id, comision: pol.cargo.comision } });
        cur.pol = sust.id;
        for (const com of Object.values(E.congreso[cam].comisiones)) com.miembros = com.miembros.map(id => id === pol.id ? sust.id : id);
        C.Politicos.anotar(sust, 'Asume la curul de ' + pol.nombre);
        C.Congreso.log(E, 'curul', `${sust.nombre} asume la curul que deja ${pol.nombre}`);
      }
    },
    formarCoalicion(E) {
      const g = E.gobierno, pp = E.partidos[g.partido];
      const ideoPres = g.presidente === 'J' ? E.jugador.ideologia : (E.politicos[g.presidente] || pp);
      const comp = E.congreso.senado ? C.Congreso.composicion(E, 'senado').porPartido : {};
      const orden = Object.values(E.partidos).filter(p => !p.especial).sort((a, b) => U.distIdeo(a, ideoPres) - U.distIdeo(b, ideoPres));
      g.coalicion = [];
      let asientos = 0; const meta = E.congreso.senado ? C.Congreso.mayoria(E, 'senado') + 6 : 60;
      for (const pa of orden) {
        const d = U.distIdeo(pa, ideoPres);
        const entra = pa.id === g.partido || (asientos < meta && d < 0.42) || (d < 0.2);
        pa.postura = entra ? 'gobierno' : d > 0.36 ? 'oposicion' : 'independiente';
        if (entra) { g.coalicion.push(pa.id); asientos += comp[pa.id] || 0; }
      }
      if (E.jugador && E.jugador.partido && !E.partidos[E.jugador.partido]) E.jugador.postura = 'independiente';
    },
    nombrarGabinete(E) {
      const g = E.gobierno;
      const comp = E.congreso.senado ? C.Congreso.composicion(E, 'senado').porPartido : {};
      const cuotas = g.coalicion.map(pid => ({ pid, w: (comp[pid] || 1) * (pid === g.partido ? 2.2 : 1) }));
      for (const m of C.DATA.ministerios) {
        const tecnocrata = U.chance(0.22);
        const pid = tecnocrata ? null : U.pesado(cuotas, c => c.w).pid;
        G.designar(E, m.id, pid, true);
      }
    },
    designar(E, minId, pid, silencioso) {
      const g = E.gobierno;
      const ant = E.politicos[g.gabinete[minId]];
      if (ant) { ant.cargo = null; C.Politicos.anotar(ant, 'Sale del Ministerio'); }
      const m = C.Politicos.crear(E, { partido: pid || null, eco: pid ? undefined : (E.partidos[g.partido] ? E.partidos[g.partido].eco * 0.6 : 0), soc: pid ? undefined : 0, cargo: { tipo: 'ministro', ministerio: minId }, r: { exp: U.ri(45, 95) } });
      if (!pid) m.profesion = 'Tecnócrata';
      g.gabinete[minId] = m.id;
      m.aprob = U.ri(35, 60);
      C.Politicos.anotar(m, 'Designado ministro');
      if (!silencioso) {
        const min = C.DATA.ministerios.find(x => x.id === minId);
        C.Medios.noticia(E, { tipo: 'gobierno', titular: `${m.nombre} es el nuevo ministro de ${min.nombre}`, tono: 0 });
      }
      return m;
    },
    ministroDe(E, sector) {
      const min = C.DATA.ministerios.find(m => m.sector === sector) || C.DATA.ministerios[0];
      return E.politicos[E.gobierno.gabinete[min.id]];
    },
    /* Estabilidad de la coalición y sus factores */
    estabilidad(E) {
      const g = E.gobierno; if (!g.coalicion || !g.coalicion.length) return { total: 0, factores: [], porPartido: {} };
      const comp = C.Congreso.composicion(E, 'senado').porPartido;
      const ministros = U.contar(Object.values(g.gabinete).map(id => E.politicos[id]).filter(Boolean), m => m.partido || 'TEC');
      const totSeats = U.suma(g.coalicion.map(p => comp[p] || 0)) || 1;
      const nMin = C.DATA.ministerios.length;
      const ideoPres = g.presidente === 'J' ? E.jugador.ideologia : E.politicos[g.presidente];
      const aprob = E.opinion.aprobacionPres;
      const prox = C.Elecciones.proxima(E, 'congreso');
      const semanas = prox ? C.Elecciones.semanasPara(E, prox) : 200;
      const porPartido = {};
      let tot = 0, peso = 0;
      const agg = { burocracia: 0, ideologia: 0, aprobacion: 0, electoral: 0, agenda: 0 };
      for (const pid of g.coalicion) {
        const pa = E.partidos[pid]; if (!pa) continue;
        const cuotaMin = (ministros[pid] || 0) / nMin, cuotaSeat = (comp[pid] || 0) / totSeats;
        const f = {
          burocracia: pid === g.partido ? 10 : U.clamp((cuotaMin - cuotaSeat * 0.8) * 120, -20, 15),
          ideologia: -U.distIdeo(pa, ideoPres) * 55 + 10,
          aprobacion: (aprob - 45) * 0.5,
          electoral: semanas < 40 && pid !== g.partido ? -12 : 0,
          agenda: (g.leyesAprobadas || 0) * 0.6 - (g.leyesHundidas || 0) * 1.2
        };
        const s = U.clamp(62 + U.suma(Object.values(f)) + (pa.satisfaccion || 0), 0, 100);
        porPartido[pid] = { s, f };
        const w = comp[pid] || 1; tot += s * w; peso += w;
        for (const k of Object.keys(agg)) agg[k] += f[k] * w;
      }
      const factores = [
        { id: 'burocracia', n: 'Reparto de ministerios' }, { id: 'ideologia', n: 'Cercanía ideológica' },
        { id: 'aprobacion', n: 'Aprobación del presidente' }, { id: 'electoral', n: 'Cercanía de elecciones' }, { id: 'agenda', n: 'Éxitos y derrotas legislativas' }
      ].map(x => ({ ...x, v: agg[x.id] / (peso || 1) }));
      return { total: tot / (peso || 1), factores, porPartido };
    },
    /* Debate de control político */
    debateControl(E, citante, minId) {
      const g = E.gobierno;
      const ids = Object.keys(g.gabinete);
      minId = minId || U.pick(ids);
      const ministro = E.politicos[g.gabinete[minId]], min = C.DATA.ministerios.find(m => m.id === minId);
      if (!ministro) return null;
      const fuerzaC = citante.id === 'J' ? E.jugador.atributos.oratoria + E.jugador.reconocimiento * 0.3 : citante.r.car + citante.r.exp * 0.3;
      const fuerzaM = ministro.r.exp + ministro.r.car * 0.3 + (E.opinion.aprobacionPres - 45);
      const margen = fuerzaC - fuerzaM + U.gauss(0, 20);
      const resultado = margen > 15 ? 'contundente' : margen > -10 ? 'parejo' : 'favorable al ministro';
      if (margen > 15) { E.opinion.aprobacionPres -= 1.2; ministro.aprob = U.clamp((ministro.aprob || 50) - 8, 0, 100); }
      else if (margen < -10) ministro.aprob = U.clamp((ministro.aprob || 50) + 3, 0, 100);
      citante.stats && citante.stats.debates++;
      C.Congreso.log(E, 'control', `Debate de control político de ${citante.id === 'J' ? E.jugador.nombre : citante.nombre} al ministro de ${min.nombre}: resultado ${resultado}`);
      if (margen > 15 || citante.id === 'J') C.Medios.noticia(E, { tipo: 'control', titular: `Debate de control político: ${citante.id === 'J' ? E.jugador.nombre : citante.nombre} ${margen > 15 ? 'pone contra las cuerdas' : 'cuestiona'} al ministro de ${min.nombre}`, tono: margen > 15 ? -1 : 0, jugador: citante.id === 'J' });
      return { margen, resultado, ministro: ministro.id, ministerio: minId };
    },
    mocionCensura(E, minId) {
      const g = E.gobierno, ministro = E.politicos[g.gabinete[minId]];
      const res = {};
      let aprobada = true;
      for (const cam of C.Congreso.CAMARAS) {
        let si = 0, no = 0;
        for (const p of C.Congreso.miembros(E, cam)) {
          if (p.id === 'J') { si++; continue; }
          const pa = E.partidos[p.partido];
          let u = (pa && pa.postura === 'oposicion' ? 18 : pa && pa.postura === 'gobierno' ? -22 : 0) + (50 - (ministro.aprob || 50)) * 0.4 + p.relJ * 0.1 + (45 - E.opinion.aprobacionPres) * 0.3 + U.gauss(0, 6);
          if (U.chance(U.sig(u / 7))) si++; else no++;
        }
        const n = E.congreso[cam].curules.length, req = Math.floor(n / 2) + 1;
        res[cam] = { si, no, req, aprobada: si >= req };
        if (si < req) aprobada = false;
      }
      res.aprobada = aprobada;
      if (aprobada) { G.designar(E, minId, ministro.partido); E.opinion.aprobacionPres -= 3; }
      return res;
    },

    turno(E) {
      const g = E.gobierno, hoy = U.hoy();
      // Posesión el 7 de agosto
      if (g.electo && hoy.getUTCMonth() === 7 && hoy.getUTCDate() >= 7 && hoy.getUTCDate() < 14) G.posesionar(E, g.electo);
      if (!g.presidente) return;
      // Presupuesto General de la Nación: se radica en la semana del 20 de julio
      if (hoy.getUTCMonth() === 6 && hoy.getUTCDate() >= 20 && hoy.getUTCDate() < 27 && g.presidente !== 'J') {
        const m = E.politicos[g.gabinete.hacienda];
        const p = C.Legislacion.crear(E, { plantilla: 'presupuesto', autor: m ? m.id : null, gobierno: true, urgencia: true, origen: 'camara', titulo: 'Presupuesto General de la Nación ' + (U.anio() + 1) });
        g.agenda.push(p.id);
      }
      // Agenda legislativa del gobierno (IA)
      if (g.presidente !== 'J' && C.Congreso.enSesion(E) && E.fecha.t - g.ultimoProyecto > U.ri(5, 9)) {
        const pres = E.politicos[g.presidente];
        const activos = C.Legislacion.activos(E);
        const pl = U.pesado(C.DATA.plantillasProyectos.filter(x => !x.gobierno), x => Math.pow(1 - U.distIdeo(pres, x), 4) * (activos.some(a => a.plantilla === x.id) ? 0.1 : 1));
        if (pl) {
          const m = G.ministroDe(E, pl.sector);
          const p = C.Legislacion.crear(E, { plantilla: pl.id, autor: m ? m.id : null, gobierno: true, urgencia: U.chance(0.3), eco: pl.eco * 0.6 + pres.eco * 0.4, soc: pl.soc * 0.6 + pres.soc * 0.4 });
          g.agenda.push(p.id); g.ultimoProyecto = E.fecha.t;
          C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno radica «${p.titulo}»${p.urgencia ? ' con mensaje de urgencia' : ''}`, tono: 0, ref: { proyecto: p.id } });
        }
      }
      // Estabilidad de la coalición: partidos insatisfechos pueden salir
      if (E.fecha.t % 4 === 0) {
        const est = G.estabilidad(E);
        g.estabilidadHist.push([E.fecha.t, Math.round(est.total)]); if (g.estabilidadHist.length > 120) g.estabilidadHist.shift();
        U.serie('coalicion', est.total);
        for (const [pid, x] of Object.entries(est.porPartido)) {
          if (pid === g.partido) continue;
          if (x.s < 32 && U.chance(0.25)) {
            g.coalicion = g.coalicion.filter(p => p !== pid);
            E.partidos[pid].postura = x.s < 20 ? 'oposicion' : 'independiente';
            for (const [minId, polId] of Object.entries(g.gabinete)) if (E.politicos[polId] && E.politicos[polId].partido === pid) G.designar(E, minId, g.partido, true);
            C.Medios.noticia(E, { tipo: 'gobierno', titular: `El ${E.partidos[pid].nombre} rompe con el Gobierno y se declara ${E.partidos[pid].postura === 'oposicion' ? 'en oposición' : 'independiente'}`, tono: -1, importante: true });
            C.Congreso.log(E, 'coalicion', `El ${E.partidos[pid].sigla} sale de la coalición de gobierno`);
          }
        }
      }
    },

    registrarAcciones() {
      const A = C.Acciones;
      const esCongresista = E => E.jugador.cargo === 'senador' || E.jugador.cargo === 'representante';
      A.registrar({ id: 'controlPolitico', nombre: 'Citar a debate de control político', icono: '🔥', grupo: 'control', costo: 2,
        disponible: (E, a) => esCongresista(E) ? (E.gobierno.gabinete[a.ministerio] ? true : 'Elige un ministerio') : 'Debes ser congresista',
        ejecutar(E, a) {
          const r = G.debateControl(E, E.politicos.J, a.ministerio);
          const J = E.jugador;
          C.Opinion.subirRec(E, (r.margen > 15 ? 5 : 2));
          J.rep.liderazgo = U.clamp(J.rep.liderazgo + (r.margen > 15 ? 3 : 1), 0, 100);
          for (const pid of E.gobierno.coalicion) E.partidos[pid].relJ = U.clamp(E.partidos[pid].relJ - 2, -100, 100);
          (E.jugador.debates = E.jugador.debates || []).push({ t: E.fecha.t, ministerio: a.ministerio, resultado: r.resultado });
          return { ok: true, msg: `Debate ${r.resultado}. ${r.margen > 15 ? 'El ministro queda debilitado: podrías promover una moción de censura.' : ''}`, datos: r };
        } });
      A.registrar({ id: 'mocionCensura', nombre: 'Promover moción de censura', icono: '⚖', grupo: 'control', costo: 3,
        disponible: (E, a) => {
          if (!esCongresista(E)) return 'Debes ser congresista';
          const debates = (E.jugador.debates || []).filter(d => d.ministerio === a.ministerio && E.fecha.t - d.t < 12);
          if (!debates.length) return 'Primero debes citar al ministro a debate de control político (últimas 12 semanas)';
          return true;
        },
        ejecutar(E, a) {
          const r = G.mocionCensura(E, a.ministerio);
          const min = C.DATA.ministerios.find(m => m.id === a.ministerio);
          C.Medios.noticia(E, { tipo: 'control', titular: r.aprobada ? `¡Moción de censura aprobada! Cae el ministro de ${min.nombre}` : `Fracasa la moción de censura contra el ministro de ${min.nombre}`, tono: r.aprobada ? -1 : 1, importante: true, jugador: true });
          C.Opinion.subirRec(E, (r.aprobada ? 10 : 2));
          return { ok: true, msg: r.aprobada ? 'La moción de censura prosperó' : 'La moción de censura fue derrotada', datos: r };
        } });
      // Acciones del jugador presidente (base de la Fase 2)
      A.registrar({ id: 'cambiarMinistro', nombre: 'Cambiar ministro', icono: '🔄', grupo: 'gobierno', costo: 1,
        disponible: E => E.gobierno.presidente === 'J' || 'Sólo el Presidente',
        ejecutar(E, a) { const m = G.designar(E, a.ministerio, a.partido || null); return { ok: true, msg: m.nombre + ' asume el ministerio' }; } });
      A.registrar({ id: 'invitarCoalicion', nombre: 'Invitar partido a la coalición', icono: '🤝', grupo: 'gobierno', costo: 2,
        disponible: (E, a) => E.gobierno.presidente !== 'J' ? 'Sólo el Presidente' : E.gobierno.coalicion.includes(a.partido) ? 'Ya está en la coalición' : true,
        ejecutar(E, a) {
          const pa = E.partidos[a.partido];
          const p = U.clamp(0.6 - U.distIdeo(pa, E.jugador.ideologia) + E.opinion.aprobacionPres / 200, 0.05, 0.9);
          if (!U.chance(p)) return { ok: true, msg: `El ${pa.sigla} rechaza entrar al Gobierno` };
          E.gobierno.coalicion.push(pa.id); pa.postura = 'gobierno';
          const libre = Object.keys(E.gobierno.gabinete).find(k => { const m = E.politicos[E.gobierno.gabinete[k]]; return m && m.partido === E.gobierno.partido; });
          if (libre) G.designar(E, libre, pa.id);
          return { ok: true, msg: `El ${pa.sigla} entra a la coalición de gobierno` };
        } });
    }
  };

  C.Gobierno = G;
  C.Tiempo.registrar('gobierno', G, 50);
  G.registrarAcciones();
})(window.CURUL);

/* Balance legislativo del gobierno (alimenta la estabilidad de la coalición) */
CURUL.Bus.on('ley', p => { const E = CURUL.E; if (p.gobierno && E && !E.meta.presim) E.gobierno.leyesAprobadas = (E.gobierno.leyesAprobadas || 0) + 1; });
CURUL.Bus.on('proyecto:archivado', p => { const E = CURUL.E; if (p.gobierno && E && !E.meta.presim) E.gobierno.leyesHundidas = (E.gobierno.leyesHundidas || 0) + 1; });

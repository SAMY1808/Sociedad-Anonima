/* Jefe de gabinete: un colaborador de confianza al que delegas áreas enteras del juego (agenda, Consejo, presupuestos, campaña, sucesos, votaciones, medios, crisis…).
   Cada área puede estar en modo Manual (todo tuyo), Asesor (te propone qué hacer) o Delegado (decide él y te lo cuenta). Los demás sistemas registran sus gestiones con Jefe.registrar. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;

  const AREAS = {
    agenda: ['🎯', 'Agenda semanal', 'Gasta puntos de agenda por ti en lo más rentable: campaña, imagen pública y partido.'],
    consejo: ['🦅', 'Consejo de Ministros / Gobierno', 'Despacha el orden del día rutinario (menos los desafíos soberanistas).'],
    presupuestos: ['💶', 'Presupuestos', 'Presenta el borrador por defecto cuando se abre el plazo, nacional o autonómico.'],
    campana: ['📣', 'Campaña electoral', 'Ejecuta la campaña automática cada semana y elige estrategia en los debates.'],
    eventos: ['📨', 'Sucesos y avisos', 'Resuelve los eventos menores y descarta los avisos informativos.'],
    votos: ['🗳', 'Votaciones', 'Vota con la línea de tu grupo en el Congreso y en el Parlamento autonómico.'],
    medios: ['📰', 'Medios y bulos', 'Mantiene la relación con la prensa y desmiente los bulos.'],
    crisis: ['🚨', 'Crisis y emergencias', 'Aplica el protocolo recomendado en las crisis nacionales.'],
    partido: ['🎗', 'Partido', 'Media en las tensiones internas y cuida a la militancia.'],
    social: ['🤝', 'Diálogo social', 'Lleva las mesas con sindicatos y patronal.']
  };
  const PERFILES = {
    estratega: ['Estratega', '♟️', 'Piensa a largo plazo: mejor en campañas y en el partido.'],
    gestor: ['Gestor', '📋', 'Eficaz con la maquinaria: Consejo, presupuestos y crisis.'],
    comunicador: ['Comunicador', '🎙️', 'Domina los medios: portadas, bulos y debates.'],
    fontanero: ['Fontanero', '🔧', 'Resuelve problemas por la puerta de atrás: votos y pactos.']
  };
  const EVENTOS_PROPIOS = ['oferta_ministerio', 'camp_oferta_pacto'];
  const SEGURAS = ['discurso', 'entrevista', 'redes', 'recorrer_bases', 'pregunta_control', 'mediar_partido', 'pleno_municipal', 'sesion_autonomica'];

  const Jf = C.Jefe = {
    AREAS, PERFILES, handlers: {},
    registrar(area, h) { Jf.handlers[area] = h; },

    asegurar(E) { if (!E.esp.jefe) E.esp.jefe = { id: null, jefe: null, cand: [], deleg: {}, prop: [], log: [], buscado: -99 }; return E.esp.jefe; },
    puede(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return 'Sólo en la política española';
      return ['pm', 'ministro', 'presauto', 'consejero', 'alcalde'].includes(J.cargo) || J.rol === 'lider' || J.prestigio >= 45 ? true : 'Necesitas un cargo ejecutivo, liderar tu partido o prestigio 45+ para tener equipo propio';
    },
    modo(E, area) { const j = Jf.asegurar(E); return j.jefe ? (j.deleg[area] || 'manual') : 'manual'; },
    delegado(E, area) { return Jf.modo(E, area) === 'delegado'; },
    capacidad(E) { const j = Jf.asegurar(E); return j.jefe ? Math.max(1, Math.round((1 + j.jefe.gestion / 3) * (C.Ajustes ? C.Ajustes.get(E).jefe : 1))) : 0; },

    candidatos(E) {
      const j = Jf.asegurar(E); j.cand = [];
      for (let i = 0; i < 4; i++) {
        const p = C.Mundo.persona('ES'), perfil = U.pick(Object.keys(PERFILES));
        const at = k => clamp(Math.round(U.gauss(6, 1.7) + (k === 'gestion' && perfil === 'gestor' ? 1.5 : k === 'discrecion' && perfil === 'fontanero' ? 1.2 : k === 'ambicion' && perfil === 'estratega' ? 1.5 : 0)), 1, 10);
        j.cand.push({ id: U.id('jc'), n: p.n, g: p.g, perfil, gestion: at('gestion'), lealtad: at('lealtad'), discrecion: at('discrecion'), ambicion: at('ambicion') });
      }
      j.buscado = E.fecha.t; return j.cand;
    },
    nombrar(E, id) {
      const j = Jf.asegurar(E), c = j.cand.find(x => x.id === id), r = Jf.puede(E); if (r !== true) return { ok: false, msg: r }; if (!c) return { ok: false, msg: 'Candidato no válido' };
      j.jefe = Object.assign({ desde: E.fecha.t }, c); j.cand = []; j.deleg = {}; j.prop = [];
      C.Personaje.log(E, `Nombras a ${c.n} jefe/a de gabinete.`); C.Noticias.poner(E, 'politica', `${E.jugador.nombre} nombra a ${c.n} jefe/a de gabinete.`, 'ES');
      return { ok: true, msg: `${c.n} es tu nuevo/a jefe/a de gabinete.` };
    },
    cesar(E, motivo) {
      const j = Jf.asegurar(E); if (!j.jefe) return { ok: false, msg: 'No tienes jefe de gabinete' };
      const n = j.jefe.n; C.Personaje.log(E, `${motivo || 'Cesas'} a ${n} como jefe/a de gabinete.`); j.jefe = null; j.deleg = {}; j.prop = []; return { ok: true, msg: `${n} deja el gabinete.` };
    },
    fijar(E, area, modo) { const j = Jf.asegurar(E); if (!j.jefe || !AREAS[area] || !['manual', 'asesor', 'delegado'].includes(modo)) return false; j.deleg[area] = modo; return true; },
    anotar(E, area, txt) { const j = Jf.asegurar(E); j.log.unshift({ t: E.fecha.t, area, txt }); if (j.log.length > 60) j.log.length = 60; },

    /* ── Qué haría tu jefe con la agenda ── */
    planAgenda(E) {
      const J = E.jugador, out = [], Ac = C.Acciones, hechas = J.agenda.hechas || [];
      const add = (accion, args, txt) => { if (Ac.puede(accion, args || {}) === true) out.push({ accion, args: args || {}, txt }); };
      if (C.Campana && C.Campana.activa(E)) {
        const camp = C.Campana.cur(E);
        (C.Campana.consejos(E, camp) || []).filter(c => c.accion && ['mitin_prov', 'apelar_voto_util', 'movilizar_votantes', 'coalicion_pre'].includes(c.accion)).slice(0, 3).forEach(c => add(c.accion, c.args, c.txt));
      }
      const pa = E.partidos[J.partido];
      if (pa.cohesion < 55 && ['direccion', 'lider'].includes(J.rol)) add('mediar_partido', {}, 'Calmar las tensiones internas del partido.');
      const cuenta = id => hechas.filter(h => h.id === id).length;
      SEGURAS.slice().sort((a, b) => cuenta(a) - cuenta(b)).forEach(a => add(a, {}, C.Acciones.get(a) ? C.Acciones.get(a).nombre : a));
      return out;
    },
    /* Ejecuta acciones con los puntos propios del jefe (un poco menos efectivas que si las hicieras tú). */
    gastarAgenda(E, plan, pool) {
      const J = E.jugador, guarda = J.agenda.puntos, hechas = []; J.agenda.puntos = pool; E._delegado = 0.8;
      try { for (const p of plan) { if (J.agenda.puntos <= 0) break; const r = C.Acciones.ejecutar(p.accion, p.args); if (r && r.ok !== false) hechas.push(r.msg || p.txt); } }
      finally { E._delegado = 0; J.agenda.puntos = guarda; }
      return hechas;
    },

    /* ── Turno semanal ── */
    turno(E) {
      const j = E.esp.jefe; if (!j || !j.jefe || !E.jugador || E.jugador.pais !== 'ES' || E.meta.presim) return;
      const jf = j.jefe, J = E.jugador;
      // Vida del colaborador: filtraciones y ambición
      if (U.chance(0.004 * (1 - jf.lealtad / 10) * (1 - jf.discrecion / 12))) { C.Personaje.cambiar(E, { pop: -1.2, prestigio: -1 }, true); C.Noticias.poner(E, 'politica', `Una filtración desde el entorno de ${J.nombre} apunta a ${jf.n}.`, 'ES'); Jf.anotar(E, 'equipo', 'Se le acusa de una filtración al entorno.'); }
      if (U.chance(0.0015 * jf.ambicion / 10) && E.fecha.t - jf.desde > 26) { C.Noticias.poner(E, 'politica', `${jf.n} deja el gabinete de ${J.nombre} para fichar por otro proyecto.`, 'ES'); C.Personaje.log(E, `${jf.n} abandona tu gabinete.`); j.jefe = null; j.deleg = {}; j.prop = []; return; }
      j.prop = [];
      for (const area in AREAS) {
        const modo = j.deleg[area] || 'manual', h = Jf.handlers[area]; if (modo === 'manual' || !h) continue;
        try {
          if (modo === 'asesor' && h.propone) (h.propone(E) || []).slice(0, 3).forEach(p => j.prop.push({ id: U.id('pp'), area, txt: p.txt, accion: p.accion || null, args: p.args || {} }));
          else if (modo === 'delegado' && h.hace) (h.hace(E, jf) || []).forEach(t => Jf.anotar(E, area, t));
        } catch (e) { console.error('[Jefe]', area, e); }
      }
      j.prop = j.prop.slice(0, 8);
    },
    /* El jugador aprueba una propuesta del asesor (usa sus puntos de agenda). */
    aprobar(E, id) {
      const j = Jf.asegurar(E), i = j.prop.findIndex(p => p.id === id); if (i < 0) return { ok: false, msg: 'La propuesta ya no está' };
      const p = j.prop[i]; if (!p.accion) { j.prop.splice(i, 1); return { ok: true, msg: 'Anotado' }; }
      const r = C.Acciones.ejecutar(p.accion, p.args); if (r.ok !== false) j.prop.splice(i, 1); return r;
    },
    descartar(E, id) { const j = Jf.asegurar(E); j.prop = j.prop.filter(p => p.id !== id); }
  };

  /* ── Gestiones propias del jefe ── */
  Jf.registrar('agenda', {
    propone(E) { return Jf.planAgenda(E).slice(0, 3).map(p => ({ txt: p.txt, accion: p.accion, args: p.args })); },
    hace(E, jf) { const plan = Jf.planAgenda(E), r = Jf.gastarAgenda(E, plan, Jf.capacidad(E)); return r.length ? ['Dedica su semana a: ' + r.slice(0, 3).join(' · ')] : []; }
  });
  Jf.registrar('consejo', {
    propone(E) {
      const out = [], g = E.paises.ES.gob; if (C.Consejo.pmEsJ(E)) E.esp.consejo.agenda.filter(i => i.tipo !== 'proces').slice(0, 2).forEach(i => out.push({ txt: 'Despachar «' + i.titulo + '» como lo haría tu equipo.' }));
      return out;
    },
    hace(E) {
      const J = E.jugador, out = [];
      if (C.Consejo.pmEsJ(E)) for (const it of E.esp.consejo.agenda.slice()) { if (it.tipo === 'proces' || it.tipo === 'pge' && Jf.modo(E, 'presupuestos') !== 'delegado') continue; try { C.Consejo.decidirIA(E, it); out.push('Consejo de Ministros: despacha «' + it.titulo + '».'); } catch (e) { /* sigue */ } }
      const rc = J.region && E.esp.ccaa[J.region];
      if (rc && J.cargo === 'presauto') for (const it of (rc.agenda || []).slice()) { const T = C.Territorio, pr = T.programa(it.prog), head = T.cabezaDe(E, J.region, it.area), ok = (rc.pres && (rc.pres.cred[head] || 0) >= T.progCoste(E, J.region, pr)); const r = T.resolverItemGob(E, J.region, it.id, ok ? 'aprobar' : 'aplazar'); out.push(`Consejo de Gobierno: ${ok ? 'aprueba' : 'aplaza'} «${pr.n}».`); }
      return out;
    }
  });
  Jf.registrar('presupuestos', {
    propone(E) { const o = [], pg = E.esp.pge; if (E.esp.consejo.agenda.some(i => i.tipo === 'pge')) o.push({ txt: 'Presentar el borrador de Presupuestos Generales (por defecto).' }); return o; },
    hace(E) {
      const out = [], J = E.jugador;
      const it = E.esp.consejo.agenda.find(i => i.tipo === 'pge');
      if (it && C.Consejo.pmEsJ(E)) { const r = C.Consejo.resolver(E, it.id, 'presentar'); out.push('Presupuestos Generales: ' + r + '.'); }
      const rc = J.region && E.esp.ccaa[J.region];
      if (rc && J.cargo === 'presauto' && rc.pres && rc.pres.pendiente && C.Territorio.presPresentar(E, J.region, null, rc.gob.aprob > 55 ? 1 : 0, true)) out.push('Presupuestos autonómicos: presenta el borrador en el Parlamento.');
      return out;
    }
  });
  Jf.registrar('campana', {
    propone(E) { const c = C.Campana.cur(E); return c ? C.Campana.consejos(E, c).filter(x => x.accion).slice(0, 3).map(x => ({ txt: x.txt, accion: x.accion, args: x.args })) : []; },
    hace(E) {
      const out = [], c = C.Campana.cur(E); if (!c) return out;
      if (E.esp.pendienteDebate) { const camp = C.Campana.mias(E).map(x => x.camp).find(x => !x.debate.hecho && E.fecha.t >= x.debate.t && C.Campana.debateJugador(E, x)) || c; C.Campana.celebrarDebate(E, 'propuestas', camp); out.push('Prepara el debate con una estrategia de propuestas.'); }
      if (C.Campana.peso(E, c)) { const r = C.Campana.auto(E); if (r.ok) out.push(r.msg); }
      const hechos = Jf.gastarAgenda(E, C.Campana.consejos(E, c).filter(x => x.accion && ['mitin_prov', 'apelar_voto_util', 'coalicion_pre'].includes(x.accion)).slice(0, 3).map(x => ({ accion: x.accion, args: x.args, txt: x.txt })), Jf.capacidad(E));
      if (hechos.length) out.push('Campaña: ' + hechos.join(' · '));
      return out;
    }
  });
  Jf.registrar('eventos', {
    propone(E) { return E.eventos.pendientes.filter(e => e.key && !EVENTOS_PROPIOS.includes(e.key) && e.opciones.length > 1).slice(0, 2).map(e => ({ txt: `«${e.titulo}»: te recomienda la opción «${e.opciones[Jf.indice(E, e)]}».` })); },
    hace(E) {
      const out = [];
      for (let i = E.eventos.pendientes.length - 1; i >= 0; i--) {
        const ev = E.eventos.pendientes[i];
        if (!ev.key) { E.eventos.pendientes.splice(i, 1); out.push('Descarta el aviso «' + ev.titulo + '».'); continue; }
        if (EVENTOS_PROPIOS.includes(ev.key) || (ev.key.indexOf('causa_') === 0)) continue;
        const idx = Jf.indice(E, ev), txt = C.Eventos.resolver(E, i, idx); out.push(`«${ev.titulo}»: elige «${ev.opciones[idx]}»${txt ? ' → ' + txt : ''}`);
      }
      return out;
    }
  });
  Jf.registrar('votos', {
    propone() { return [{ txt: 'Votar con la línea de tu grupo en todas las votaciones.' }]; },
    hace(E) {
      const out = []; if (!E.parl.auto) { E.parl.auto = true; out.push('Activa el voto automático con tu grupo en el Congreso.'); }
      const pv = E.esp.pendienteVotoAut; if (pv && C.Territorio.leyAut) { const b = C.Territorio.leyAut(E, pv.c, pv.id); if (b) { const lin = C.Territorio.proyectarAut(E, pv.c, b).pos[E.jugador.partido]; C.Territorio.votarLey(E, pv.c, b, lin ? lin.voto : 'abs'); out.push('Vota en el Parlamento autonómico con la línea del grupo.'); } }
      const pc = E.esp.pendienteConvAut; if (pc && C.Territorio.rdlAut) { const d = C.Territorio.rdlAut(E, pc.c, pc.id); if (d) { const b = { pid: d.pid, cab: {}, neg: {}, ruido: d.ruido, interv: 0, decreto: true }, lin = C.Territorio.posturaAut(E, pc.c, b, E.jugador.partido); C.Territorio.convalidar(E, pc.c, d, lin.voto); out.push('Vota la convalidación de un decreto-ley autonómico con la línea de tu grupo.'); } else E.esp.pendienteConvAut = null; }
      return out;
    }
  });
  /* Opción que elegiría tu jefe según su perfil. */
  Jf.indice = (E, ev) => { const n = ev.opciones.length, p = (Jf.asegurar(E).jefe || {}).perfil; return n < 3 ? 0 : p === 'fontanero' ? n - 1 : p === 'estratega' ? 1 : 0; };

  C.Tiempo.registrar('jefe', { turno: Jf.turno }, 75);
})(window.ESP);

/* Personaje del jugador: creación, atributos, reputación, finanzas, familia, carrera y agenda semanal. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  /* Trayectorias iniciales: bonificaciones y cargo */
  const ORIGENES = {
    lider:        { n: 'Líder comunitario', icono: '🏘', desc: 'Conoces cada barrio. Poca fama, gran red de base.', rec: 4, redes: 6, patrimonio: 35, salario: 2.5, cargo: 'lider', bonus: { carisma: 6 } },
    activista:    { n: 'Activista', icono: '✊', desc: 'Movilizas causas. Los jóvenes te siguen.', rec: 8, redes: 5, patrimonio: 20, salario: 2, cargo: 'activista', bonus: { oratoria: 6 }, seg: { jovenes: 6, estudiantes: 6 } },
    academico:    { n: 'Académico', icono: '🎓', desc: 'Investigador respetado. Alta credibilidad.', rec: 6, redes: 3, patrimonio: 280, salario: 12, cargo: 'academico', bonus: { gestion: 8 }, cred: 12, seg: { universitarios: 6 } },
    periodista:   { n: 'Periodista', icono: '🎙', desc: 'Tu cara es conocida y dominas los medios.', rec: 18, redes: 4, patrimonio: 160, salario: 9, cargo: 'periodista', bonus: { oratoria: 10 }, medios: 12 },
    asesor:       { n: 'Asesor político', icono: '🧭', desc: 'Conoces el Congreso por dentro y a sus caciques.', rec: 5, redes: 5, patrimonio: 120, salario: 10, cargo: 'asesor', bonus: { negociacion: 10 }, partido: 15 },
    empresario:   { n: 'Empresario', icono: '💼', desc: 'Recursos propios y relación con gremios.', rec: 7, redes: 5, patrimonio: 1800, salario: 40, cargo: 'empresario', bonus: { gestion: 6 }, seg: { altos: 6 } },
    sindicalista: { n: 'Líder sindical', icono: '⚒', desc: 'Una central obrera respalda tu nombre.', rec: 9, redes: 7, patrimonio: 60, salario: 6, cargo: 'sindicalista', bonus: { negociacion: 5 }, seg: { formales: 6, bajos: 3 } },
    ong:          { n: 'Director de ONG', icono: '🌱', desc: 'Cooperación internacional y trabajo territorial.', rec: 6, redes: 5, patrimonio: 90, salario: 8, cargo: 'ong', bonus: { gestion: 4 }, cred: 6 },
    concejal:     { n: 'Concejal', icono: '🏛', desc: 'Ya ocupas una curul en el concejo de tu ciudad.', rec: 12, redes: 6, patrimonio: 140, salario: 12, cargo: 'concejal', electo: true },
    diputado:     { n: 'Diputado', icono: '🏛', desc: 'Miembro de la Asamblea de tu departamento.', rec: 14, redes: 6, patrimonio: 180, salario: 15, cargo: 'diputado', electo: true },
    representante:{ n: 'Representante a la Cámara', icono: '🟢', desc: 'Recién elegido por tu departamento para 2026-2030.', rec: 24, redes: 7, patrimonio: 420, salario: 48, cargo: 'representante', electo: true, requierePartido: true },
    senador:      { n: 'Senador', icono: '🔴', desc: 'Recién elegido en la lista nacional del Senado.', rec: 36, redes: 8, patrimonio: 700, salario: 48, cargo: 'senador', electo: true, requierePartido: true }
  };
  const SALARIOS = { senador: 48, representante: 48, presidente: 45, ministro: 38, gobernador: 30, alcalde: 28, diputado: 15, concejal: 12 };
  const EDUCACION = ['Bachiller', 'Técnico', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];

  const Pj = {
    ORIGENES, EDUCACION, SALARIOS,
    crear(E, cfg) {
      const o = ORIGENES[cfg.origen];
      const at = Object.assign({ carisma: 50, oratoria: 50, gestion: 50, negociacion: 50, integridad: 60 }, cfg.atributos || {});
      for (const [k, v] of Object.entries(o.bonus || {})) at[k] = U.clamp(at[k] + v, 0, 100);
      const edu = EDUCACION.indexOf(cfg.educacion);
      const J = {
        id: 'J', nombre: cfg.nombre, genero: cfg.genero, nac: U.anio() - cfg.edad,
        nacimiento: cfg.nacimiento, residencia: cfg.residencia, educacion: cfg.educacion, profesion: cfg.profesion,
        ideologia: { eco: cfg.eco, soc: cfg.soc }, atributos: at,
        rep: { honestidad: 55 + (at.integridad - 50) * 0.4, competencia: 40 + edu * 4, liderazgo: 35 + (at.carisma - 50) * 0.3, experiencia: o.electo ? 45 : 20, cercania: 50, transparencia: 55 },
        popularidad: 45, reconocimiento: o.rec, credibilidad: 50 + (o.cred || 0),
        patrimonio: o.patrimonio + (cfg.patrimonioExtra || 0), ingresos: o.salario, gastos: 3 + (cfg.hijos || 0) * 1.5 + (cfg.pareja ? 1 : 0),
        familia: [], redes: o.redes, bienestar: 65,
        origen: cfg.origen, cargo: o.cargo, cargoInfo: {}, oficio: o.electo ? (cfg.profesion || 'Abogado') : o.cargo,
        camara: null, comision: null, comisionPreferida: cfg.comision || null,
        partido: cfg.partido || null, postura: null, intereses: cfg.intereses || ['educacion', 'salud'],
        trayectoria: [], historialElectoral: [], historialLegislativo: [], escandalos: [], reconocimientos: [], debates: [],
        agenda: { puntos: 5, max: 5, hechas: [] }, votos: {}, ocupados: [o.cargo],
        imagen: { seg: Object.assign({}, o.seg || {}), dep: {}, rec: {} }
      };
      if (cfg.pareja) J.familia.push({ rol: 'Pareja', nombre: cfg.pareja, edad: cfg.edad + U.ri(-4, 4) });
      for (let i = 0; i < (cfg.hijos || 0); i++) J.familia.push({ rol: U.chance(0.5) ? 'Hija' : 'Hijo', nombre: U.pick(U.chance(0.5) ? C.DATA.nombres.h : C.DATA.nombres.m), edad: U.ri(1, Math.max(2, cfg.edad - 22)) });
      J.familia.push({ rol: 'Madre', nombre: U.pick(C.DATA.nombres.m), edad: cfg.edad + U.ri(22, 32) });
      E.jugador = J;
      if (o.partido && J.partido && E.partidos[J.partido]) E.partidos[J.partido].relJ = o.partido;
      if (o.medios) E.medios.lista.forEach(m => m.relJ = o.medios);
      Pj.anotar(E, `Inicia su trayectoria como ${o.n.toLowerCase()} en ${E.deptos[J.residencia].capital}`);
      Pj.sincronizar(E);
      return J;
    },
    anotar(E, txt) { E.jugador.trayectoria.push({ t: E.fecha.t, anio: U.anio(), txt }); },
    edad: E => U.anio() - E.jugador.nac,
    /* El jugador también existe como “político” para que el Congreso y las votaciones lo traten igual */
    sincronizar(E) {
      const J = E.jugador;
      const p = E.politicos.J || { id: 'J', stats: { radicados: 0, aprobados: 0, votos: 0, ausencias: 0, intervenciones: 0, debates: 0 }, tray: [], retrato: 7, activo: true, relJ: 100, asistencia: 1 };
      Object.assign(p, {
        nombre: J.nombre, genero: J.genero, nac: J.nac, depto: J.residencia, partido: J.partido === 'MOV' ? null : J.partido,
        eco: J.ideologia.eco, soc: J.ideologia.soc, esJugador: true, intereses: J.intereses,
        r: { amb: 90, dis: 50, pra: 50, car: J.atributos.carisma, int: J.atributos.integridad, exp: J.rep.experiencia },
        fuerza: Math.round(C.Elecciones ? 30 + J.reconocimiento * 0.5 : 40), profesion: J.profesion,
        cargo: J.cargo === 'senador' || J.cargo === 'representante' ? { tipo: J.cargo, camara: J.camara, circ: J.cargoInfo.circ, curul: J.cargoInfo.curul, comision: J.comision } : (J.cargo ? { tipo: J.cargo } : null)
      });
      E.politicos.J = p;
    },
    asumirCargo(E, tipo, info = {}) {
      const J = E.jugador;
      if (J.cargo && !C.DATA.cargos[J.cargo].electo) J.oficio = J.cargo;
      J.cargo = tipo; J.cargoInfo = info; J.cargoElecto = null;
      J.ocupados = J.ocupados || []; if (!J.ocupados.includes(tipo)) J.ocupados.push(tipo);
      J.camara = tipo === 'senador' ? 'senado' : tipo === 'representante' ? 'camara' : null;
      if (SALARIOS[tipo]) J.ingresos = SALARIOS[tipo];
      J.rep.experiencia = U.clamp(J.rep.experiencia + 6, 0, 100);
      Pj.anotar(E, 'Asume como ' + C.DATA.cargos[tipo].nombre + (info.depto ? ' (' + E.deptos[info.depto].nombre + ')' : ''));
      Pj.sincronizar(E);
      C.Bus.emit('jugador:cargo', tipo);
    },
    dejarCargo(E, motivo) {
      const J = E.jugador, antes = J.cargo;
      J.cargo = J.oficio && ORIGENES[J.oficio] ? J.oficio : 'ciudadano';
      J.camara = null; J.comision = null; J.cargoInfo = {};
      J.ingresos = ORIGENES[J.cargo] ? ORIGENES[J.cargo].salario : 4;
      Pj.anotar(E, motivo + ' (deja el cargo de ' + C.DATA.cargos[antes].nombre.toLowerCase() + ')');
      Pj.sincronizar(E);
    },
    puntosMax(E) {
      const J = E.jugador, cam = E.elecciones.campana;
      let m = 4 + (C.DATA.cargos[J.cargo].nivel >= 3 ? 1 : 0) + (cam && cam.equipo.gerente ? 1 : 0);
      if ((J.bienestar || 60) < 25) m -= 1;
      return m;
    },
    turno(E) {
      const J = E.jugador;
      J.agenda.max = Pj.puntosMax(E);
      J.agenda.puntos = J.agenda.max;
      J.agenda.hechas = J.agenda.hechas.filter(h => E.fecha.t - h.t < 8);
      // Finanzas semanales (millones COP)
      J.patrimonio += (J.ingresos - J.gastos) / 4.33 + J.patrimonio * 0.035 / 52;
      J.bienestar = U.clamp((J.bienestar || 60) + (C.DATA.cargos[J.cargo].nivel >= 3 ? -0.3 : 0.2), 0, 100);
      // Cumpleaños de la familia
      const hoy = U.hoy(); if (hoy.getUTCMonth() === 0 && hoy.getUTCDate() <= 7) J.familia.forEach(f => f.edad++);
      // La reputación converge lentamente
      J.rep.honestidad += ((50 + (J.atributos.integridad - 50) * 0.5) - J.rep.honestidad) * 0.005;
      Pj.sincronizar(E);
      U.serie('jug:patrimonio', J.patrimonio);
    },

    registrarAcciones() {
      const A = C.Acciones;
      const sinCargoElecto = E => !C.DATA.cargos[E.jugador.cargo].electo;
      A.registrar({ id: 'recorrer', nombre: 'Recorrer un departamento', icono: '🚌', grupo: 'territorio', costo: 1,
        disponible: (E, a) => E.deptos[a.depto] ? true : 'Elige un departamento',
        ejecutar(E, a) {
          const J = E.jugador, d = E.deptos[a.depto], cam = E.elecciones.campana;
          const f = cam && cam.equipo.estratega ? 1.3 : 1;
          C.Opinion.moverImagen(E, { rec: { [d.id]: 4 * f }, dep: { [d.id]: 2 * f } });
          C.Opinion.subirRec(E, 0.4);
          J.rep.cercania = U.clamp(J.rep.cercania + 1, 0, 100);
          if (cam) { cam.estructura = U.clamp(cam.estructura + 1.5 * f, 0, 100); cam.voluntarios += Math.round(20 * f); cam.actividades.push({ t: E.fecha.t, tipo: 'recorrido', depto: d.id }); }
          J.patrimonio -= 2;
          return { ok: true, msg: `Recorres ${d.nombre}: más reconocimiento y cercanía en la región` };
        } });
      A.registrar({ id: 'reunionLideres', nombre: 'Reunión con líderes regionales', icono: '🗣', grupo: 'territorio', costo: 1,
        disponible: (E, a) => E.deptos[a.depto] ? true : 'Elige un departamento',
        ejecutar(E, a) {
          const J = E.jugador, cam = E.elecciones.campana;
          J.redes = U.clamp(J.redes + 0.3, 0, 10);
          C.Opinion.moverImagen(E, { rec: { [a.depto]: 2 } });
          if (cam) { cam.estructura = U.clamp(cam.estructura + 3, 0, 100); cam.actividades.push({ t: E.fecha.t, tipo: 'lideres', depto: a.depto }); }
          return { ok: true, msg: 'Los líderes locales se suman a tu red' };
        } });
      A.registrar({ id: 'trabajar', nombre: 'Enfocarte en tu trabajo profesional', icono: '💼', grupo: 'carrera', costo: 1,
        disponible: E => sinCargoElecto(E) || 'Tu cargo público ocupa tu tiempo',
        ejecutar(E) {
          const J = E.jugador; J.patrimonio += J.ingresos * 0.3;
          J.rep.competencia = U.clamp(J.rep.competencia + 0.6, 0, 100);
          if (J.cargo === 'periodista') C.Opinion.subirRec(E, 1);
          if (J.cargo === 'academico') J.credibilidad = U.clamp(J.credibilidad + 0.8, 0, 100);
          if (J.cargo === 'activista' || J.cargo === 'lider') J.redes = U.clamp(J.redes + 0.2, 0, 10);
          return { ok: true, msg: 'Una semana productiva en tu oficio' };
        } });
      A.registrar({ id: 'cambiarOficio', nombre: 'Cambiar de trayectoria profesional', icono: '🔀', grupo: 'carrera', costo: 2,
        disponible: (E, a) => !sinCargoElecto(E) ? 'Debes dejar tu cargo público primero' : ORIGENES[a.oficio] && !ORIGENES[a.oficio].electo ? true : 'Trayectoria no válida',
        ejecutar(E, a) {
          const J = E.jugador, o = ORIGENES[a.oficio];
          J.cargo = a.oficio; J.oficio = a.oficio; J.ingresos = o.salario;
          J.ocupados = J.ocupados || []; if (!J.ocupados.includes(a.oficio)) J.ocupados.push(a.oficio);
          Pj.anotar(E, 'Cambia de trayectoria: ahora es ' + o.n.toLowerCase());
          return { ok: true, msg: 'Nueva etapa: ' + o.n };
        } });
      A.registrar({ id: 'afiliarse', nombre: 'Afiliarse a un partido', icono: '🎗', grupo: 'carrera', costo: 1,
        disponible: (E, a) => {
          const J = E.jugador;
          if (!E.partidos[a.partido] || E.partidos[a.partido].especial) return 'Partido no válido';
          if (J.partido === a.partido) return 'Ya perteneces a ese partido';
          if (J.cargo === 'senador' || J.cargo === 'representante' || J.cargo === 'presidente') return 'Prohibición de doble militancia: no puedes cambiar de partido durante tu periodo';
          return true;
        },
        ejecutar(E, a) {
          const J = E.jugador, pa = E.partidos[a.partido];
          if (J.partido && E.partidos[J.partido]) E.partidos[J.partido].relJ -= 15;
          J.partido = a.partido; pa.relJ = U.clamp(pa.relJ + 5, -100, 100);
          Pj.anotar(E, 'Se afilia al ' + pa.nombre);
          C.Medios.noticia(E, { tipo: 'partidos', titular: `${J.nombre} se afilia al ${pa.nombre}`, tono: 0, jugador: true });
          Pj.sincronizar(E);
          return { ok: true, msg: 'Ahora militas en el ' + pa.nombre };
        } });
      A.registrar({ id: 'reunionPartido', nombre: 'Reunirte con una facción del partido', icono: '👥', grupo: 'carrera', costo: 1,
        disponible: E => E.partidos[E.jugador.partido] ? true : 'No perteneces a un partido',
        ejecutar(E, a) {
          const pa = E.partidos[E.jugador.partido];
          const f = pa.facciones.find(x => x.id === a.faccion) || C.Partidos.dominante(pa);
          const afin = 1 - U.distIdeo(E.jugador.ideologia, f);
          const d = Math.round(2 + afin * 6 + E.jugador.atributos.negociacion / 25);
          f.relJ = U.clamp(f.relJ + d, -100, 100); pa.relJ = U.clamp(pa.relJ + d / 3, -100, 100);
          return { ok: true, msg: `La facción «${f.nombre}» valora el encuentro (+${d})` };
        } });
      A.registrar({ id: 'descansar', nombre: 'Tiempo con la familia', icono: '🏡', grupo: 'carrera', costo: 1,
        ejecutar(E) { const J = E.jugador; J.bienestar = U.clamp((J.bienestar || 60) + 12, 0, 100); J.rep.cercania = U.clamp(J.rep.cercania + 0.5, 0, 100); return { ok: true, msg: 'Recargas energías con tu familia' }; } });
      A.registrar({ id: 'estudiar', nombre: 'Cursar un posgrado', icono: '📚', grupo: 'carrera', costo: 2,
        disponible: E => E.jugador.patrimonio >= 60 ? (EDUCACION.indexOf(E.jugador.educacion) < EDUCACION.length - 1 ? true : 'Ya tienes el máximo nivel') : 'Necesitas $60 millones',
        ejecutar(E) {
          const J = E.jugador; J.patrimonio -= 60;
          J.educacion = EDUCACION[EDUCACION.indexOf(J.educacion) + 1];
          J.atributos.gestion = U.clamp(J.atributos.gestion + 4, 0, 100); J.rep.competencia = U.clamp(J.rep.competencia + 4, 0, 100);
          Pj.anotar(E, 'Obtiene el título de ' + J.educacion.toLowerCase());
          return { ok: true, msg: 'Nuevo título: ' + J.educacion };
        } });
    }
  };

  C.Personaje = Pj;
  C.Tiempo.registrar('personaje', Pj, 5);
  Pj.registrarAcciones();
})(window.CURUL);

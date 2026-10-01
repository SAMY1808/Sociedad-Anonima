/* Personaje del jugador: creación, carrera, atributos, agenda semanal y acciones. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const clamp = U.clamp;
  const UE_CARGOS = ['mep', 'comisario', 'presCom', 'presCE', 'presPE'];

  const Pj = {
    init(E) {
      const op = E.meta.opts; if (!op) return;
      const P = E.paises[op.pais];
      let pid = op.partido;                                     // id del partido elegido
      if (op.nuevo) pid = op.pais + '_' + (D().partidos[op.pais].length);
      const pa = E.partidos[pid];
      const tr = D().trayectorias.find(t => t.id === op.trayectoria) || D().trayectorias[0];
      const atrib = { carisma: 3, oratoria: 3, gestion: 3, negociacion: 3, integridad: 3 };
      Object.keys(op.atrib || {}).forEach(k => atrib[k] = op.atrib[k]);
      for (const k in tr.atrib) atrib[k] = Math.min(10, atrib[k] + tr.atrib[k]);
      const seats = P.escanos[pid] || 0;
      let rol = op.rol || 'base';
      if (op.nuevo) rol = 'lider';
      if (seats === 0 && rol !== 'lider') rol = 'base';
      const J = E.jugador = {
        nombre: op.nombre || 'Alex Navarro', g: op.genero || 'm', edad: op.edad || 38, pais: op.pais, partido: pid,
        cargo: 'diputado', rol, ministerio: null, trayectoria: tr.id,
        eco: Math.round(clamp(op.eco != null ? op.eco : pa.eco, -100, 100)), soc: Math.round(clamp(op.soc != null ? op.soc : pa.soc, -100, 100)), eu: Math.round(clamp(op.eu != null ? op.eu : pa.eu, -100, 100)),
        atrib, prestigio: tr.prestigio + (rol === 'lider' ? 25 : rol === 'portavoz' ? 12 : 0), pop: tr.pop + (rol === 'lider' ? 8 : 0), capEU: tr.capEU,
        agenda: { puntos: 5, max: 5, hechas: [] }, historial: [], campania: null, electo: false, cumple: E.meta.inicio.slice(5), hitos: {}
      };
      if (op.nuevo) pa.lider = 'J';
      C.Parlamento.colocarJugador(E);
      if (!J.electo) J.cargo = 'activista';
      J.agenda.puntos = Pj.maxAgenda(E);
      Pj.log(E, `Comienza tu carrera política como ${Pj.cargoTxt(E)} de ${pa.nombre} (${D().paises[J.pais].nombre}).`);
      C.Gobierno.repartirMinisterios(E);
      Pj.sincronizar(E);
      C.Parlamento.sembrar(E);
      const g = P.gob, pm = E.politicos[g.pm], d = D().paises[J.pais];
      C.Noticias.poner(E, 'politica', `${pm ? pm.n : 'El Ejecutivo'} (${E.partidos[g.partido].sigla}) gobierna ${d.nombre} ${g.coalicion.length > 1 ? 'en coalición con ' + g.coalicion.filter(k => k !== g.partido).map(k => E.partidos[k].sigla).join(', ') : g.tipo === 'minoria' ? 'en minoría' : 'en solitario'}.`, J.pais);
      C.Noticias.poner(E, 'europa', `Presidencia de la Comisión Europea: ${E.ue.comision.presidente.n}. El Parlamento Europeo cuenta con ${E.ue.pe.total} escaños.`);
    },

    maxAgenda(E) {
      const J = E.jugador;
      return 5 + (['ministro', 'pm', 'presidente', 'comisario', 'presCom', 'presCE', 'presPE'].includes(J.cargo) ? 1 : 0) + (J.rol === 'lider' ? 1 : 0);
    },

    cargoTxt(E) {
      const J = E.jugador; if (!J) return '—';
      const d = D().paises[J.pais];
      if (J.cargo === 'presidente') return d.pres ? d.pres.titulo : 'Presidente/a';
      if (J.cargo === 'pm') return d.jefe + ' de ' + d.nombre;
      if (J.cargo === 'ministro') { const m = D().ministerios.find(x => x.id === J.ministerio); return 'Ministro/a de ' + (m ? m.nombre : 'Gobierno'); }
      if (J.cargo === 'mep' && J.meps) return 'Eurodiputado/a (' + (D().grupos[J.meps.grupo] || {}).sigla + ')';
      return D().cargos[J.cargo].nombre;
    },

    /* Registra el primer momento en que el jugador alcanza cada cargo. */
    hito(E) { const J = E.jugador; if (J.cargo && J.hitos[J.cargo] === undefined) J.hitos[J.cargo] = E.fecha.t; },

    nivelMax(E) { const J = E.jugador; return Math.max(D().cargos[J.cargo].nivel, ...Object.keys(J.hitos).map(k => (D().cargos[k] || { nivel: 0 }).nivel)); },

    puntuacion(E) {
      const J = E.jugador, leyes = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && p.etapa === 'sancionada').length + (J.leyesPropias || 0);
      return Math.round(Pj.nivelMax(E) * 120 + J.prestigio + J.capEU * 0.6 + leyes * 15 + E.fecha.t / 52 * 5);
    },

    /* Retirada de la política: epílogo con el balance de la carrera. */
    retirar(E) {
      const J = E.jugador; J.retirado = true;
      const nom = Object.keys(J.hitos).sort((a, b) => J.hitos[a] - J.hitos[b]).map(k => `${D().cargos[k].nombre} (${U.fmtT(J.hitos[k], true)})`);
      C.Personaje.log(E, 'Te retiras de la política.');
      C.Eventos.info(E, '🏁 Fin de una carrera', `${J.nombre} se retira tras ${U.d1(E.fecha.t / 52)} años en política. Cargos: ${nom.join(' → ')}. Puntuación final: ${Pj.puntuacion(E)} puntos. Puedes seguir observando cómo evoluciona Europa o iniciar una nueva carrera desde el menú.`);
    },

    enParlamento(E) { return !!(E.jugador && E.parl.miembros.includes('J')); },
    esUE(E) { return UE_CARGOS.includes(E.jugador.cargo); },

    /* Ajusta el cargo según el escaño y el Gobierno actuales. */
    sincronizar(E) {
      const J = E.jugador; if (!J) return;
      const P = E.paises[J.pais], g = P.gob;
      if (Pj.esUE(E)) { Pj.hito(E); Pj.syncPol(E); return; }
      const seat = E.parl.miembros.includes('J');
      if (P.pres && P.pres.pol === 'J') { J.cargo = 'presidente'; J.ministerio = null; Pj.hito(E); Pj.syncPol(E); return; }
      let cargo = seat ? 'diputado' : 'activista', min = null;
      if (g) {
        if (g.pm === 'J') cargo = 'pm';
        else { for (const k in g.ministros) if (g.ministros[k] === 'J') { cargo = 'ministro'; min = k; } }
      }
      if (cargo !== J.cargo) {
        const sube = D().cargos[cargo].nivel > D().cargos[J.cargo].nivel;
        J.cargo = cargo; J.ministerio = min;
        if (sube) Pj.log(E, `Asciendes a ${Pj.cargoTxt(E)}.`);
      } else J.ministerio = min;
      Pj.hito(E);
      Pj.syncPol(E);
    },
    syncPol(E) {
      const J = E.jugador, p = E.politicos.J; if (!p) return;
      p.p = J.partido; p.eco = J.eco; p.soc = J.soc; p.eu = J.eu; p.e = J.edad; p.n = J.nombre;
      p.cargo = J.cargo === 'pm' ? 'pm' : J.cargo === 'ministro' ? 'min:' + J.ministerio : null;
    },

    /* Gana la presidencia del país: deja el escaño y (en sistemas semipresidenciales) el liderazgo del partido. */
    alPresidente(E) {
      const J = E.jugador, P = E.paises[J.pais], d = D().paises[J.pais];
      E.parl.miembros = E.parl.miembros.filter(i => i !== 'J');
      E.parl.miembros.push(C.Parlamento.nuevoDiputado(E, J.partido).id);
      J.electo = false;
      if (P.gob) for (const k in P.gob.ministros) if (P.gob.ministros[k] === 'J') P.gob.ministros[k] = null;
      P.pres.pol = 'J';
      if (d.reg === 'semi' && E.partidos[J.partido].lider === 'J') { C.Gobierno.nuevoLider(E, J.partido, 'tras la elección de ' + J.nombre + ' como presidente'); J.rol = 'direccion'; }
      J.cargo = 'presidente'; J.ministerio = null; Pj.hito(E);
      if (P.gob) C.Gobierno.cubrirVacantes(E);
      Pj.log(E, 'Eres elegido/a ' + (d.pres ? d.pres.titulo : 'presidente/a') + '.');
      Pj.cambiar(E, { prestigio: 15, pop: 10 }, true);
    },

    /* Representante del país en el Consejo Europeo: presidente (si lo decide el sistema) o jefe de Gobierno. */
    representaEnUE(E) {
      const J = E.jugador, d = D().paises[J.pais];
      return d.pres && d.pres.eu ? J.cargo === 'presidente' : (J.cargo === 'pm' || (J.cargo === 'presidente' && d.reg === 'pres'));
    },

    /* Paso a un cargo europeo: deja el escaño, la cartera y el liderazgo del partido si los tuviera. */
    alUE(E, cargo) {
      const J = E.jugador, P = E.paises[J.pais];
      E.parl.miembros = E.parl.miembros.filter(i => i !== 'J');
      E.parl.miembros.push(C.Parlamento.nuevoDiputado(E, J.partido).id);
      J.electo = false;
      if (P.gob) for (const k in P.gob.ministros) if (P.gob.ministros[k] === 'J') P.gob.ministros[k] = null;
      if (J.rol === 'lider' && E.partidos[J.partido].lider === 'J') { C.Gobierno.nuevoLider(E, J.partido, 'tras la marcha de ' + J.nombre + ' a Bruselas'); J.rol = 'direccion'; }
      J.cargo = cargo; J.cargoUE = cargo; J.ministerio = null; Pj.hito(E);
      if (P.gob) C.Gobierno.cubrirVacantes(E);
    },

    /* Ajusta capital político. Las ganancias por acciones corrientes son pequeñas y decrecientes;
       los hitos (ascensos, leyes propias) usan fijo = true. */
    cambiar(E, d, fijo) {
      const J = E.jugador; if (!J) return;
      const K = { prestigio: 0.09, pop: 0.12, capEU: 0.07 };
      ['prestigio', 'pop', 'capEU'].forEach(k => {
        if (!d[k]) return;
        const v = J[k];
        const delta = fijo ? d[k] : (d[k] > 0 ? d[k] * K[k] * (1 - v / 115) * (J.fatiga || 1) : d[k] * 0.6);
        J[k] = clamp(v + delta, 0, 100);
        J._d = J._d || {}; J._d[k] = (J._d[k] || 0) + (J[k] - v);
      });
    },
    log(E, txt) { E.jugador.historial.unshift({ t: E.fecha.t, txt }); if (E.jugador.historial.length > 80) E.jugador.historial.length = 80; },

    /* Resultado personal de unas elecciones: ¿repites escaño? */
    tras_elecciones(E, previo, res) {
      const J = E.jugador, P = E.paises[J.pais];
      if (Pj.esUE(E)) { J.electo = false; return { electo: false, pos: 0, escanos: 0, ue: true }; }
      const nuevos = P.escanos[J.partido] || 0, antes = previo ? (previo.escanos[J.partido] || 0) : 0;
      let pos, eff = 0;
      if (J.rol === 'lider') pos = 1;
      else {
        eff = J.prestigio * 0.7 + J.pop * 0.3 + ({ base: 0, portavoz: 8, direccion: 16 }[J.rol] || 0) + (J.campania ? J.campania.pts * 0.25 : 0);
        pos = 1 + Math.floor((1 - clamp(eff, 0, 100) / 100) * (Math.max(antes, nuevos) + 3));
      }
      J.electo = pos <= nuevos;
      const r = { electo: J.electo, pos, escanos: nuevos, antes };
      if (!J.electo) { Pj.log(E, `No logras escaño en las elecciones (puesto ${pos} de lista; ${nuevos} escaños para tu partido).`); }
      else Pj.log(E, `Eres reelegido/a: puesto ${pos} de la lista, ${nuevos} escaños para tu partido.`);
      J.campania = null;
      // Los ministros sin escaño pierden la cartera con el nuevo gobierno (se recalcula tras formar gobierno)
      return r;
    },

    turno(E) {
      const J = E.jugador; if (!J) return;
      J.agenda.max = J.retirado ? 0 : Pj.maxAgenda(E); J.agenda.puntos = J.agenda.max; J.agenda.hechas = [];
      // Cumpleaños
      const d = U.hoy(), mmdd = String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
      const ult = U.fechaDe(E.fecha.t - 1), mmdd0 = String(ult.getUTCMonth() + 1).padStart(2, '0') + '-' + String(ult.getUTCDate()).padStart(2, '0');
      if (mmdd !== mmdd0 && mmdd >= J.cumple && mmdd0 < J.cumple) { J.edad++; }
      // Decaimiento natural
      J.pop = clamp(J.pop + (J.cargo === 'activista' ? -0.12 : -0.05) + (J.pop < 20 ? 0.03 : 0), 0, 100);
      J.capEU = clamp(J.capEU - 0.03, 0, 100);
      J.prestigio = clamp(J.prestigio + (12 + 8 * D().cargos[J.cargo].nivel + (J.rol === 'lider' ? 10 : 0) - J.prestigio) * 0.002, 0, 100);
      Pj.syncPol(E);
      // Relación con diputados: se enfría lentamente
      if (E.fecha.t % 4 === 0) E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.rel) m.rel *= 0.985; });
    }
  };

  /* ── Acciones del jugador ── */
  const A = (id, o) => C.Acciones.registrar(Object.assign({ id, costo: 1 }, o));
  const enParl = E => Pj.enParlamento(E) || 'Necesitas un escaño en el parlamento';
  const f = (E, ...ks) => U.suma(ks.map(k => E.jugador.atrib[k])) / (10 * ks.length);   // 0..1
  const pa = E => E.partidos[E.jugador.partido];
  const enGob = E => E.paises[E.jugador.pais].gob.coalicion.includes(E.jugador.partido);

  A('discurso', {
    nombre: 'Discurso en el pleno', icono: '🎤', grupo: 'parlamento', desc: 'Una intervención en la tribuna: gana notoriedad y prestigio si te sale bien.',
    disponible: enParl,
    ejecutar(E) {
      const x = f(E, 'oratoria', 'carisma');
      if (U.chance(0.4 + 0.55 * x)) { Pj.cambiar(E, { pop: 1.1 + 2 * x, prestigio: 0.8 + 1.2 * x }); C.Opinion.empujeJ(E, 0.03 + x * 0.05); return { ok: true, msg: 'Tu discurso en el pleno es citado por los medios.' }; }
      Pj.cambiar(E, { pop: -0.3 }); return { ok: true, exito: false, msg: 'Un discurso correcto pero que pasa sin pena ni gloria.' };
    }
  });
  A('pregunta_control', {
    nombre: 'Sesión de control al Gobierno', icono: '❓', grupo: 'parlamento', desc: 'Interpela al Ejecutivo. Si estás en la oposición, puede desgastarlo.',
    disponible(E) { if (!Pj.enParlamento(E)) return 'Necesitas un escaño en el parlamento'; if (enGob(E)) return 'Tu partido está en el Gobierno'; return true; },
    ejecutar(E) {
      const x = f(E, 'oratoria', 'integridad'), g = E.paises[E.jugador.pais].gob;
      const ok = U.chance(0.35 + 0.5 * x);
      if (ok) { g.aprob = Math.max(5, g.aprob - (0.4 + x * 0.8)); g.estab -= 0.4; Pj.cambiar(E, { pop: 1.0, prestigio: 1 }); return { ok: true, msg: 'Tu pregunta incomoda al Gobierno y abre telediarios.' }; }
      Pj.cambiar(E, { prestigio: -0.3 }); return { ok: true, exito: false, msg: 'El Gobierno esquiva tu pregunta sin consecuencias.' };
    }
  });
  A('proponer_ley', {
    nombre: 'Presentar un proyecto de ley', icono: '📜', costo: 2, grupo: 'parlamento', desc: 'Registra tu propia iniciativa legislativa.',
    disponible(E) { const r = enParl(E); if (r !== true) return r; if (C.Parlamento.abiertos(E).filter(p => p.autor.tipo === 'jugador').length >= 2) return 'Ya tienes dos proyectos en trámite'; return true; },
    ejecutar(E, a) {
      const tpl = D().leyes.find(l => l.id === a.tpl); if (!tpl) return { ok: false, msg: 'Elige un proyecto' };
      if (!C.Parlamento.reqOK(E, tpl)) return { ok: false, msg: 'No aplicable en tu país' };
      if (C.Parlamento.abiertos(E).some(p => p.tpl === tpl.id)) return { ok: false, msg: 'Ya hay un proyecto igual en trámite' };
      const p = C.Parlamento.proponer(E, tpl.id, { tipo: 'jugador', pid: E.jugador.partido });
      // La posición del jugador desplaza el proyecto hacia su ideología (enmienda de autor)
      p.eco = Math.round((p.eco * 2 + E.jugador.eco) / 3); p.soc = Math.round((p.soc * 2 + E.jugador.soc) / 3); p.eu = Math.round((p.eu * 2 + E.jugador.eu) / 3);
      pa(E).pop = pa(E).pop;
      Pj.cambiar(E, { prestigio: 0.8, pop: 0.3 });
      C.Noticias.poner(E, 'parlamento', `${E.jugador.nombre} (${pa(E).sigla}) registra «${p.t}».`, E.jugador.pais);
      return { ok: true, msg: `Registras «${p.t}».` };
    }
  });
  A('cabildear_ley', {
    nombre: 'Cabildear un proyecto', icono: '🤝', grupo: 'parlamento', desc: 'Negocia con un grupo parlamentario para ganar sus votos.',
    disponible: enParl,
    ejecutar(E, a) {
      const p = E.proyectos[a.proy]; if (!p || !['registro', 'comision', 'pleno', 'pleno_pend'].includes(p.etapa)) return { ok: false, msg: 'Elige un proyecto en trámite' };
      const k = a.pid; if (!k || !E.partidos[k]) return { ok: false, msg: 'Elige un grupo' };
      const x = f(E, 'negociacion', 'carisma');
      const gana = a.lado === 'no' ? -1 : 1;
      if (U.chance(0.45 + 0.5 * x)) {
        p.apoyo[k] = (p.apoyo[k] || 0) + gana * (0.22 + 0.2 * x);
        E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.p === k && i !== 'J') m.rel = clamp(m.rel + 4, -100, 100); });
        Pj.cambiar(E, { prestigio: 0.4 }); return { ok: true, msg: `${E.partidos[k].sigla} acepta moverse ${gana > 0 ? 'a favor' : 'en contra'} de «${p.t}».` };
      }
      return { ok: true, exito: false, msg: `${E.partidos[k].sigla} no se deja convencer.` };
    }
  });
  A('recorrer_bases', {
    nombre: 'Recorrer las agrupaciones locales', icono: '🚌', grupo: 'partido', desc: 'Visitas a militantes y sedes: prestigio interno, cohesión y militancia.',
    ejecutar(E) {
      const x = f(E, 'carisma', 'gestion'), p = pa(E);
      Pj.cambiar(E, { prestigio: 1.0 + 1.5 * x, pop: 0.4 }); p.cohesion = clamp(p.cohesion + 0.5, 20, 99); p.militantes += U.ri(80, 400); C.Opinion.empujeJ(E, 0.03);
      return { ok: true, msg: 'Las bases te reciben con entusiasmo.' };
    }
  });
  A('mediar_partido', {
    nombre: 'Mediar entre sectores del partido', icono: '🕊️', grupo: 'partido', desc: 'Calma las tensiones internas y refuerza la disciplina.',
    ejecutar(E) {
      const x = f(E, 'negociacion', 'integridad'), p = pa(E);
      if (U.chance(0.4 + 0.5 * x)) { p.cohesion = clamp(p.cohesion + 2 + 3 * x, 20, 99); Pj.cambiar(E, { prestigio: 1.2 }); return { ok: true, msg: 'Logras desactivar una pugna interna.' }; }
      return { ok: true, exito: false, msg: 'La mediación no cuaja; las tensiones siguen.' };
    }
  });
  A('ascender', {
    nombre: 'Ascender en la estructura del partido', icono: '📈', costo: 2, grupo: 'partido', desc: 'Aspira a portavoz o a la dirección del partido.',
    disponible(E) { const r = E.jugador.rol; if (r === 'lider') return 'Ya diriges el partido'; if (r === 'direccion') return 'Para liderar, desafía al líder'; const req = r === 'base' ? 32 : 52; return E.jugador.prestigio >= req ? true : `Necesitas prestigio ${req}+`; },
    ejecutar(E) {
      const J = E.jugador, r = J.rol, req = r === 'base' ? 32 : 52, x = f(E, 'negociacion', 'carisma');
      const p = clamp((J.prestigio - req) / 40 + 0.35 + x * 0.25, 0.15, 0.9);
      if (U.chance(p)) { J.rol = r === 'base' ? 'portavoz' : 'direccion'; Pj.log(E, `Eres nombrado/a ${D().rolesPartido[J.rol].nombre}.`); Pj.cambiar(E, { prestigio: 3 }, true); return { ok: true, msg: `Ahora eres ${D().rolesPartido[J.rol].nombre}.` }; }
      Pj.cambiar(E, { prestigio: -1 }); return { ok: true, exito: false, msg: 'La ejecutiva prefiere otro nombre por ahora.' };
    }
  });
  A('desafiar_lider', {
    nombre: 'Desafiar al líder del partido', icono: '⚔️', costo: 3, grupo: 'partido', desc: 'Primarias o congreso: si ganas, diriges el partido (y quizá el Gobierno).',
    disponible(E) { const J = E.jugador; if (Pj.esUE(E)) return 'Vuelve primero a la política nacional'; if (J.rol === 'lider') return 'Ya eres el líder'; if (J.rol !== 'direccion' && !(J.rol === 'portavoz' && J.prestigio > 65)) return 'Necesitas estar en la dirección del partido'; if (J.prestigio < 55) return 'Necesitas prestigio 55+'; return true; },
    ejecutar(E) {
      const J = E.jugador, p = pa(E), P = E.paises[J.pais], g = P.gob, viejo = E.politicos[p.lider];
      const debilidad = (p.cohesion < 60 ? 0.12 : 0) + (p.pop < p.base ? 0.1 : 0) + (g.partido === p.id && g.aprob < 35 ? 0.1 : 0);
      const pr = clamp(0.12 + (J.prestigio - 55) / 100 + f(E, 'carisma', 'negociacion') * 0.25 + debilidad - (viejo ? viejo.a / 600 : 0), 0.05, 0.85);
      if (U.chance(pr)) {
        if (viejo && viejo.id !== 'J') { E.parl.miembros = E.parl.miembros.filter(i => i !== viejo.id); delete E.politicos[viejo.id]; E.parl.miembros.push(C.Parlamento.nuevoDiputado(E, p.id).id); }
        p.lider = 'J'; J.rol = 'lider'; if (g.partido === p.id) g.pm = 'J';
        Pj.cambiar(E, { prestigio: 8, pop: 3 }, true); Pj.sincronizar(E);
        C.Noticias.poner(E, 'partido', `${J.nombre} gana el liderazgo de ${p.nombre}.`, J.pais);
        Pj.log(E, `Ganas el congreso y te conviertes en líder de ${p.nombre}.`);
        if (g.partido === p.id) { C.Gobierno.repartirMinisterios(E); Pj.sincronizar(E); }
        return { ok: true, msg: '¡Ganas el liderazgo del partido!' };
      }
      p.cohesion = clamp(p.cohesion - 5, 20, 99); Pj.cambiar(E, { prestigio: -8, pop: -1 }, true); J.rol = 'portavoz' === J.rol ? 'base' : (J.rol === 'direccion' && U.chance(0.4) ? 'portavoz' : J.rol);
      return { ok: true, exito: false, msg: 'Pierdes el congreso; tu posición interna queda dañada.' };
    }
  });
  A('entrevista', {
    nombre: 'Conceder una entrevista', icono: '📺', grupo: 'medios', desc: 'Notoriedad a cambio de riesgo de titulares incómodos.',
    ejecutar(E) {
      const x = f(E, 'carisma', 'oratoria');
      if (U.chance(0.12 + (1 - x) * 0.18)) { Pj.cambiar(E, { pop: -1.5, prestigio: -1 }); return { ok: true, exito: false, msg: 'Un desliz en directo se hace viral.' }; }
      Pj.cambiar(E, { pop: 1.2 + 2 * x, prestigio: 0.3 }); C.Opinion.empujeJ(E, 0.02 + x * 0.04);
      return { ok: true, msg: 'La entrevista refuerza tu perfil público.' };
    }
  });
  A('redes', {
    nombre: 'Campaña en redes sociales', icono: '📱', grupo: 'medios', desc: 'Mensajes y vídeos: alcance a bajo coste.',
    ejecutar(E) {
      const x = f(E, 'carisma', 'gestion');
      Pj.cambiar(E, { pop: 0.7 + 1.3 * x }); if (U.chance(0.15)) { pa(E).cohesion = clamp(pa(E).cohesion - 0.8, 20, 99); return { ok: true, msg: 'Tu hilo se hace viral, pero a tus compañeros no les gusta el tono.' }; }
      return { ok: true, msg: 'Tu mensaje gana tracción en redes.' };
    }
  });
  A('mitin', {
    nombre: 'Mitin de campaña', icono: '📣', costo: 2, grupo: 'campana', desc: 'Sólo en campaña: mueve votos hacia tu partido.',
    disponible(E) { return E.jugador.campania ? true : 'Sólo disponible en las ocho semanas previas a las elecciones'; },
    ejecutar(E) {
      const J = E.jugador, x = f(E, 'carisma', 'oratoria');
      J.campania.pts += 3 + 4 * x; J.campania.mitines++; Pj.cambiar(E, { pop: 0.8 });
      C.Opinion.empujeJ(E, 0.05 + x * 0.08, 0.1);
      return { ok: true, msg: 'El mitin llena el pabellón.' };
    }
  });
  A('negociar_coalicion', {
    nombre: 'Engrasar la coalición de gobierno', icono: '⚙️', grupo: 'gobierno', desc: 'Calma a los socios y refuerza la estabilidad del Ejecutivo.',
    disponible(E) { return enGob(E) ? true : 'Tu partido no está en el Gobierno'; },
    ejecutar(E) {
      const x = f(E, 'negociacion', 'gestion'), g = E.paises[E.jugador.pais].gob;
      const mult = E.jugador.rol === 'lider' || E.jugador.cargo === 'pm' || E.jugador.cargo === 'presidente' ? 1.6 : E.jugador.cargo === 'ministro' ? 1.2 : 0.6;
      g.estab = clamp(g.estab + (1.5 + 3 * x) * mult, 0, 100); Pj.cambiar(E, { prestigio: 0.7 });
      return { ok: true, msg: 'Las aguas se calman en el Consejo de Ministros.' };
    }
  });
  A('plan_ministerio', {
    nombre: 'Impulsar un plan de tu ministerio', icono: '🗂️', costo: 2, grupo: 'gobierno', desc: 'Sólo ministros: mejora un indicador de tu sector.',
    disponible(E) { return ['ministro', 'pm', 'presidente'].includes(E.jugador.cargo) ? true : 'Debes ser ministro/a, jefe/a de Gobierno o presidente/a'; },
    ejecutar(E) {
      const J = E.jugador, P = E.paises[J.pais], x = f(E, 'gestion', 'negociacion');
      const m = J.cargo === 'pm' || J.cargo === 'presidente' ? null : D().ministerios.find(k => k.id === J.ministerio);
      const efs = { eco: { deficit: -0.15 }, tra: { paro: -0.15 }, amb: { infl: -0.1, crec: 0.05 }, sal: { aprob: 1.5 }, edu: { crec: 0.05, aprob: 1 }, agr: { aprob: 1 }, ter: { crec: 0.06 }, int: { aprob: 1 }, jus: { aprob: 0.8 }, ext: { aprob: 0.6 }, def: { aprob: 0.6 }, eur: { aprob: 0.5 } };
      const ef = !m ? { crec: 0.05, aprob: 1.2 } : (efs[m.id] || { aprob: 0.8 });
      const k = 0.6 + x;
      const e2 = {}; for (const kk in ef) e2[kk] = ef[kk] * k;
      C.Economia.aplicar(E, J.pais, e2);
      Pj.cambiar(E, { prestigio: 1.5 + x * 1.5, pop: 0.8 }); if (m && m.id === 'eur') Pj.cambiar(E, { capEU: 2 });
      return { ok: true, msg: 'Tu plan arranca con buena acogida.' };
    }
  });
  A('mocion_censura', {
    nombre: 'Presentar una moción de censura', icono: '⚡', costo: 3, grupo: 'partido', desc: 'Sólo líderes de la oposición: intenta derribar al Gobierno con una mayoría alternativa.',
    disponible(E) { const J = E.jugador, P = E.paises[J.pais]; if (J.rol !== 'lider') return 'Sólo el líder de un partido puede presentarla'; if (!Pj.enParlamento(E)) return 'Necesitas escaño'; if (P.gob.coalicion.includes(J.partido)) return 'Tu partido está en el Gobierno'; if (P.flags.leyMarcial) return 'No es posible bajo ley marcial'; return true; },
    ejecutar(E) { E.ui.abrir = { tipo: 'consultas', modo: 'censura' }; return { ok: true, msg: 'Preparas una moción de censura: negocia con los grupos.' }; }
  });
  A('elecciones_anticipadas', {
    nombre: 'Convocar elecciones anticipadas', icono: '🗳️', costo: 2, grupo: 'gobierno', desc: 'Jefe/a de Gobierno o presidente/a: disuelve el parlamento.',
    disponible(E) { const P = E.paises[E.jugador.pais], d = D().paises[E.jugador.pais]; if (!(E.jugador.cargo === 'pm' || (E.jugador.cargo === 'presidente' && d.reg === 'semi'))) return 'Sólo el jefe/a de Gobierno (o el presidente/a en regímenes semipresidenciales) puede hacerlo'; if (P.flags.anticipada || P.flags.leyMarcial) return 'No es posible ahora'; if (C.Elecciones.semanasHasta(E, E.jugador.pais) < 14) return 'Las elecciones están ya muy cerca'; return true; },
    ejecutar(E) { C.Elecciones.adelantar(E, E.jugador.pais, 7); return { ok: true, msg: 'Disuelves la cámara: elecciones en siete semanas.' }; }
  });

  C.Personaje = Pj;
  C.Tiempo.registrar('personaje', { turno: Pj.turno }, 3);
  /* El personaje se crea al final de la generación del mundo (tras el parlamento). */
  C.Tiempo.registrar('personaje_init', { init: Pj.init }, 60);
})(window.EUROPA);

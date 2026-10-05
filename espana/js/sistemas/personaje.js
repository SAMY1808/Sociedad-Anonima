/* Personaje del jugador en España: creación, carrera (local → autonómica → nacional → europea), atributos,
   agenda semanal y acciones. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;
  const clamp = U.clamp;
  const UE_CARGOS = ['mep', 'comisario', 'presCom', 'presCE', 'presPE'];
  const NIVEL_DE = { activista: null, concejal: 'local', alcalde: 'local', dipauto: 'autonomico', consejero: 'autonomico', presauto: 'autonomico', diputado: 'nacional', senador: 'nacional', ministro: 'nacional', vicepres: 'nacional', pm: 'nacional', mep: 'europeo', comisario: 'europeo', presCom: 'europeo', presCE: 'europeo', presPE: 'europeo' };

  const Pj = {
    init(E) {
      const op = E.meta.opts; if (!op || !op.partido && !op.nuevo) return;
      const P = E.paises.ES;
      let pid = op.partido;
      if (op.nuevo) pid = 'ES_' + op.nuevo.sigla;
      const pa = E.partidos[pid];
      const tr = D().trayectorias.find(t => t.id === op.trayectoria) || D().trayectorias[0];
      const atrib = { carisma: 3, oratoria: 3, gestion: 3, negociacion: 3, integridad: 3 };
      Object.keys(op.atrib || {}).forEach(k => atrib[k] = op.atrib[k]);
      for (const k in tr.atrib) atrib[k] = Math.min(10, atrib[k] + tr.atrib[k]);
      let rol = op.rol || 'base';
      if (op.nuevo) rol = 'lider';
      const nivel = op.nivel || 'nacional';
      const J = E.jugador = {
        nombre: op.nombre || 'Alex Navarro', g: op.genero || 'm', edad: op.edad || 38, pais: 'ES', partido: pid, nivel,
        cargo: 'activista', rol, ministerio: null, trayectoria: tr.id,
        eco: Math.round(clamp(op.eco != null ? op.eco : pa.eco, -100, 100)), soc: Math.round(clamp(op.soc != null ? op.soc : pa.soc, -100, 100)), eu: Math.round(clamp(op.eu != null ? op.eu : pa.eu, -100, 100)), ter: Math.round(clamp(op.ter != null ? op.ter : pa.ter, -100, 100)),
        atrib, prestigio: tr.prestigio + (rol === 'lider' ? 25 : rol === 'portavoz' ? 12 : rol === 'direccion' ? 6 : 0), pop: tr.pop + (rol === 'lider' ? 8 : 0), capEU: tr.capEU,
        agenda: { puntos: 5, max: 5, hechas: [] }, historial: [], campania: null, electo: false, escReg: false, concejal: false, lidReg: null, aspira: null, consejeria: null,
        cumple: E.meta.inicio.slice(5), hitos: {}, region: op.region || null, muni: op.muni || null, circ: op.circ || null
      };
      if (op.nuevo) pa.lider = 'J';
      // En lo local o autonómico, «líder» de un partido estatal es cabeza de lista, no líder nacional
      if (nivel !== 'nacional' && pa.amb === 'nac' && !op.nuevo && rol === 'lider') { J.rol = 'direccion'; J.cabeza = true; }
      // Territorio de partida
      if (nivel === 'local') {
        if (!J.muni) J.muni = 'm_mad';
        J.region = E.esp.muni.m[J.muni].ccaa; J.circ = E.esp.muni.m[J.muni].prov;
      } else if (nivel === 'autonomico') {
        if (!J.region) J.region = pa.region || 'MAD';
        if (!J.circ) J.circ = C.Es.provinciasDe(J.region)[0];
      } else {
        if (pa.amb === 'reg' && pa.region && (!J.circ || D().provincias[J.circ][1] !== pa.region)) J.circ = Pj.mejorProvincia(E, pid, pa.region);   // un partido regional sólo se presenta en su territorio
        if (!J.circ) J.circ = Pj.mejorProvincia(E, pid, op.region);
        J.region = D().provincias[J.circ][1];
      }
      C.Congreso.colocarJugador(E);
      if (nivel === 'nacional' && !J.electo && rol !== 'lider') J.cargo = 'activista';
      // Presidente del Gobierno: líder del partido que gobierna
      const g = P.gob;
      if (J.rol === 'lider' && P.gob && P.gob.partido === pid) { g.pm = 'J'; }
      if (nivel === 'autonomico') Pj.colocarAutonomico(E);
      if (nivel === 'local') Pj.colocarLocal(E);
      if (rol === 'lider' && pa.amb === 'nac' && nivel !== 'nacional' && !J.lidReg && J.region) { E.esp.ccaa[J.region].cab[pid] = 'J'; J.lidReg = J.region; }
      J.agenda.max = J.agenda.puntos = Pj.maxAgenda(E);
      C.Ejecutivo.repartirMinisterios(E);
      Pj.ministroSiProcede(E);
      Pj.sincronizar(E);
      Pj.log(E, `Comienza tu carrera política como ${Pj.cargoTxt(E)} (${pa.nombre}).`);
      const pm = E.politicos[g.pm];
      C.Noticias.poner(E, 'politica', `${pm ? pm.n : 'El Ejecutivo'} (${E.partidos[g.partido].sigla}) gobierna España ${g.coalicion.length > 1 ? 'en coalición con ' + g.coalicion.filter(k => k !== g.partido).map(k => E.partidos[k].sigla).join(', ') : g.tipo === 'minoria' ? 'en minoría' : 'en solitario'}.`, 'ES');
      C.Noticias.poner(E, 'europa', `Presidencia de la Comisión Europea: ${E.ue.comision.presidente.n}. El Parlamento Europeo cuenta con ${E.ue.pe.total} escaños.`);
    },

    /* Provincias donde tu partido tiene escaños, con su peso y la probabilidad de que la dirección acepte el cambio. */
    opcionesProvincia(E) {
      const J = E.jugador, pa = E.partidos[J.partido], actual = J.circNueva || J.circ || Pj.mejorProvincia(E, J.partido, J.region);
      const rolB = ({ direccion: 0.12, portavoz: 0.06, lider: 0.25 })[J.rol] || 0, ccAct = D().provincias[actual][1];
      return Object.keys(D().provincias).filter(k => pa.amb !== 'reg' || pa.region === D().provincias[k][1]).map(k => {
        const d = D().provincias[k], esc = E.esp.prov[k].escanos[J.partido] || 0, total = U.suma(Object.values(E.esp.prov[k].escanos));
        const p = clamp(0.32 + (J.prestigio - 35) / 110 + rolB + f(E, 'negociacion', 'carisma') * 0.2 + (d[1] === ccAct ? 0.1 : -0.14) + (esc >= 3 ? -0.08 : 0.04), 0.08, 0.9);
        return { prov: k, nombre: d[0], ccaa: d[1], esc, total, p, actual: k === actual };
      }).filter(o => o.esc > 0).sort((a, b) => b.esc - a.esc);
    },

    mejorProvincia(E, pid, region) {
      let mx = -1, mj = null;
      const provs = region ? C.Es.provinciasDe(region) : Object.keys(E.esp.prov);
      for (const prov of provs) { const k = E.esp.prov[prov].escanos[pid] || 0; if (k > mx) { mx = k; mj = prov; } }
      return mj || provs[0];
    },

    colocarAutonomico(E) {
      const J = E.jugador, rc = E.esp.ccaa[J.region], n = rc.parl.escanos[J.partido] || 0;
      if (J.rol === 'lider' && E.partidos[J.partido].amb === 'reg' && E.partidos[J.partido].region !== J.region) J.region = E.partidos[J.partido].region;
      J.escReg = n > 0 && (J.rol !== 'base' || U.chance(0.7));
      if ((J.rol === 'lider' || J.cabeza) && n > 0) { J.escReg = true; if (E.partidos[J.partido].amb === 'nac') { rc.cab[J.partido] = 'J'; J.lidReg = J.region; } if (rc.gob && rc.gob.partido === J.partido) rc.gob.pres = 'J'; }
      if (J.rol === 'lider' && E.partidos[J.partido].amb === 'reg' && rc.gob && rc.gob.partido === J.partido) rc.gob.pres = 'J';
    },

    colocarLocal(E) {
      const J = E.jugador, m = E.esp.muni.m[J.muni], n = m.esc[J.partido] || 0;
      if ((J.rol === 'lider' || J.cabeza) && m.alcalde === J.partido) { if (m.pm && m.pm !== 'J') delete E.politicos[m.pm]; m.pm = 'J'; E.politicos.J.cargo = 'alcalde'; J.concejal = true; }
      else J.concejal = n > 0 && (J.rol === 'lider' || J.cabeza || J.rol !== 'base' || U.chance(0.75));
    },

    /* Si el partido del jugador está en la coalición, le toca una cartera. */
    ministroSiProcede(E) {
      const J = E.jugador, g = E.paises.ES.gob; if (!g || g.pm === 'J' || !g.coalicion.includes(J.partido)) return;
      if (J.rol !== 'lider' && J.rol !== 'direccion') return;
      if (J.nivel !== 'nacional' || J.cabeza) return;
      if (Object.values(g.ministros).includes('J')) return;
      const mine = Object.keys(g.ministros).filter(m => { const q = E.politicos[g.ministros[m]]; return q && q.p === J.partido; });
      if (!mine.length) return;
      const pref = J.ministerio && mine.includes(J.ministerio) ? J.ministerio : mine.sort((a, b) => D().ministerios.find(x => x.id === b).peso - D().ministerios.find(x => x.id === a).peso)[0];
      const old = E.politicos[g.ministros[pref]]; if (old && old.id !== 'J') old.cargo = null;
      g.ministros[pref] = 'J'; J.ministerio = pref;
    },

    maxAgenda(E) {
      const J = E.jugador;
      return 5 + (['ministro', 'pm', 'presauto', 'vicepres', 'comisario', 'presCom', 'presCE', 'presPE'].includes(J.cargo) ? 1 : 0) + (J.rol === 'lider' ? 1 : 0);
    },

    cargoTxt(E) {
      const J = E.jugador; if (!J) return '—';
      const rc = J.region && E.esp.ccaa[J.region], m = J.muni && E.esp.muni.m[J.muni];
      switch (J.cargo) {
        case 'pm': return 'Presidente/a del Gobierno de España';
        case 'ministro': { const mi = D().ministerios.find(x => x.id === J.ministerio); return 'Ministro/a de ' + (mi ? mi.nombre : 'Gobierno'); }
        case 'presauto': return 'Presidente/a de ' + (rc ? D().ccaa[J.region].nombre : 'la comunidad');
        case 'consejero': return 'Consejero/a de ' + (J.area && rc ? C.Territorio.infoGrupo(E, J.region, J.area).nombre : 'Gobierno') + ' (' + (rc ? D().ccaa[J.region].nombre : '') + ')';
        case 'dipauto': return 'Diputado/a autonómico/a (' + (rc ? D().ccaa[J.region].nombre : '') + ')';
        case 'alcalde': return 'Alcalde/sa de ' + (m ? m.nombre : '');
        case 'concejal': return 'Concejal/a' + (J.areaMuni && D().concejalias[J.areaMuni] ? ' de ' + D().concejalias[J.areaMuni].nombre : '') + ' (' + (m ? m.nombre : '') + ')';
        case 'diputado': return 'Diputado/a por ' + (J.circ ? D().provincias[J.circ][0] : 'España');
        case 'mep': return 'Eurodiputado/a' + (J.meps && D().grupos[J.meps.grupo] ? ' (' + D().grupos[J.meps.grupo].sigla + ')' : '');
        default: return D().cargos[J.cargo].nombre;
      }
    },

    hito(E) { const J = E.jugador; if (J.cargo && J.hitos[J.cargo] === undefined) J.hitos[J.cargo] = E.fecha.t; },
    nivelMax(E) { const J = E.jugador; return Math.max(D().cargos[J.cargo].nivel, ...Object.keys(J.hitos).map(k => (D().cargos[k] || { nivel: 0 }).nivel)); },

    puntuacion(E) {
      const J = E.jugador, leyes = Object.values(E.proyectos).filter(p => p.autor.tipo === 'jugador' && p.etapa === 'sancionada').length + (J.leyesPropias || 0);
      return Math.round(Pj.nivelMax(E) * 120 + J.prestigio + J.capEU * 0.6 + leyes * 15 + E.fecha.t / 52 * 5);
    },

    retirar(E) {
      const J = E.jugador; J.retirado = true;
      const nom = Object.keys(J.hitos).sort((a, b) => J.hitos[a] - J.hitos[b]).map(k => `${D().cargos[k].nombre} (${U.fmtT(J.hitos[k], true)})`);
      Pj.log(E, 'Te retiras de la política.');
      C.Eventos.info(E, '🏁 Fin de una carrera', `${J.nombre} se retira tras ${U.d1(E.fecha.t / 52)} años en política. Cargos: ${nom.join(' → ')}. Puntuación final: ${Pj.puntuacion(E)} puntos. Puedes seguir observando cómo evoluciona España o iniciar una nueva carrera desde el menú.`);
    },

    enParlamento(E) { return !!(E.jugador && E.jugador.electo); },
    esUE(E) { return UE_CARGOS.includes(E.jugador.cargo); },

    /* Recalcula el cargo más alto que ocupa el jugador. */
    sincronizar(E) {
      const J = E.jugador; if (!J) return;
      if (Pj.esUE(E)) { Pj.hito(E); Pj.syncPol(E); return; }
      const g = E.paises.ES.gob, rc = J.region && E.esp.ccaa[J.region], m = J.muni && E.esp.muni.m[J.muni];
      let cargo = 'activista', min = null;
      const alza = c => { if (D().cargos[c].nivel >= D().cargos[cargo].nivel) cargo = c; };
      if (m && m.pm === 'J') alza('alcalde'); else if (J.concejal) alza('concejal');
      if (rc) {
        if (rc.gob && rc.gob.pres === 'J') alza('presauto');
        else if (J.consejeria === J.region && rc.gob && rc.gob.coalicion.includes(J.partido)) alza('consejero');
        else if (J.escReg) alza('dipauto');
      }
      if (J.electo) alza('diputado');
      if (g) {
        if (g.pm === 'J') cargo = 'pm';
        else for (const k in g.ministros) if (g.ministros[k] === 'J') { alza('ministro'); if (cargo === 'ministro') min = k; }
      }
      if (cargo !== J.cargo) {
        const sube = D().cargos[cargo].nivel > D().cargos[J.cargo].nivel;
        J.cargo = cargo; J.ministerio = min;
        if (sube) Pj.log(E, `Asciendes a ${Pj.cargoTxt(E)}.`);
      } else J.ministerio = min;
      if (NIVEL_DE[cargo]) J.nivel = NIVEL_DE[cargo];
      Pj.hito(E); Pj.syncPol(E);
    },
    syncPol(E) {
      const J = E.jugador, p = E.politicos.J; if (!p) return;
      p.p = J.partido; p.eco = J.eco; p.soc = J.soc; p.eu = J.eu; p.ter = J.ter; p.e = J.edad; p.n = J.nombre; p.reg = J.region;
      p.cargo = J.cargo === 'pm' ? 'pm' : J.cargo === 'ministro' ? 'min:' + J.ministerio : null;
    },

    /* Deja los cargos de un nivel inferior al ascender. */
    dejar(E, nivel) {
      const J = E.jugador;
      if (nivel === 'local') {
        const m = J.muni && E.esp.muni.m[J.muni];
        if (m && m.pm === 'J') { m.pm = null; C.Municipios.elegirAlcalde(E, J.muni, false); }
        J.concejal = false; J.areaMuni = null;
      }
      if (nivel === 'autonomico') {
        const rc = J.region && E.esp.ccaa[J.region];
        if (rc && rc.gob && rc.gob.pres === 'J') { rc.cab[rc.gob.partido] = null; if (E.partidos[rc.gob.partido].amb === 'nac') rc.gob.pres = C.Territorio.cabeza(E, J.region, rc.gob.partido).id; else rc.gob.pres = E.partidos[rc.gob.partido].lider; }
        J.escReg = false; J.consejeria = null; if (J.lidReg) { E.esp.ccaa[J.lidReg].cab[J.partido] = null; J.lidReg = null; }
      }
    },

    representaEnUE(E) { return E.jugador.cargo === 'pm'; },

    /* Renuncia al escaño del Congreso y a la cartera (para pasar a Bruselas o a un parlamento autonómico). */
    dejarNacional(E, motivo, conserva) {
      const J = E.jugador, g = E.paises.ES.gob;
      E.parl.miembros = E.parl.miembros.filter(i => i !== 'J');
      if (J.electo) E.parl.miembros.push(C.Congreso.nuevoDiputado(E, J.partido, J.circ).id);
      J.electo = false;
      let cartera = false;
      if (g) for (const k in g.ministros) if (g.ministros[k] === 'J') { g.ministros[k] = null; cartera = true; }
      if (!conserva && J.rol === 'lider' && E.partidos[J.partido].lider === 'J') { C.Ejecutivo.nuevoLider(E, J.partido, 'tras la marcha de ' + J.nombre + ' ' + (motivo || '')); J.rol = 'direccion'; }
      J.ministerio = null;
      if (g && cartera) C.Ejecutivo.cubrirVacantes(E);
    },

    alUE(E, cargo) {
      const J = E.jugador;
      Pj.dejarNacional(E, 'a Bruselas'); Pj.dejar(E, 'local'); Pj.dejar(E, 'autonomico');
      J.cargo = cargo; J.cargoUE = cargo; J.ministerio = null; J.nivel = 'europeo'; Pj.hito(E);
    },

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

    /* Empuje de la acción de campaña/gestión en el nivel donde juega el jugador. */
    empuje(E, x, base, campana) {
      const J = E.jugador, pid = J.partido;
      // En campaña autonómica por otra comunidad (o desde otro nivel) el empuje va a esa comunidad
      if (campana && J.campania && J.campania.tipo === 'aut' && J.campania.region) { const rcc = E.esp.ccaa[J.campania.region]; rcc.bonus = rcc.bonus || {}; rcc.bonus[pid] = Math.min(0.12, (rcc.bonus[pid] || 0) + x * 0.5); return x; }
      if (J.nivel === 'nacional' || J.nivel === 'europeo') return C.Opinion.empujeJ(E, x, base);
      if (J.nivel === 'autonomico' && J.region) { const rc = E.esp.ccaa[J.region]; rc.bonus = rc.bonus || {}; rc.bonus[pid] = Math.min(0.12, (rc.bonus[pid] || 0) + x * 0.5); return x; }
      if (J.nivel === 'local' && J.muni) { const m = E.esp.muni.m[J.muni]; if (m.loc[pid]) m.loc[pid] = Math.min(1.7, m.loc[pid] * (1 + x * 0.35)); return x; }
      return 0;
    },

    /* Posición en la lista y resultado personal. */
    posicion(E, J, antes, nuevos, extra) {
      if (J.rol === 'lider') return 1;
      const eff = J.prestigio * 0.7 + J.pop * 0.3 + ({ base: 0, portavoz: 8, direccion: 16 }[J.rol] || 0) + (J.campania ? J.campania.pts * 0.25 : 0) + (extra || 0);
      return 1 + Math.floor((1 - clamp(eff, 0, 100) / 100) * (Math.max(antes, nuevos) + 3));
    },

    /* Ajuste de la posición de una ley a la ideología del jugador que la presenta (un tercio de la diferencia). */
    ajusteLey(E, tpl) { const J = E.jugador; return { eco: Math.round((J.eco - tpl.eco) / 3), soc: Math.round((J.soc - tpl.soc) / 3), eu: Math.round((J.eu - (tpl.eu || 0)) / 3), ter: Math.round((J.ter - (tpl.ter || 0)) / 3) }; },

    /* ── Consejerías ofrecidas tras unas elecciones o un cambio de gobierno ── */
    /* Si el partido del jugador entra en el Gobierno autonómico y él no preside, puede recibir una consejería
       (más probable cuanto mejor puesto en la lista, prestigio y peso en la dirección). */
    ofertaConsejeria(E, c, pos) {
      const J = E.jugador, T = C.Territorio, rc = E.esp.ccaa[c], gob = rc && rc.gob;
      if (!J || !gob || J.region !== c || J.ofertaT === E.fecha.t) return false;
      if (!J.escReg || gob.pres === 'J' || !gob.coalicion.includes(J.partido) || J.consejeria === c || J.cargo === 'consejero') return false;
      const libres = T.areasDe(E, c, J.partido); if (!libres.length) return false;
      J.ofertaT = E.fecha.t;
      const bono = ({ direccion: 0.12, portavoz: 0.06, lider: 0.25 })[J.rol] || 0;
      const pr = clamp(0.28 + (J.prestigio - 30) / 100 + (pos && pos <= 3 ? 0.3 : pos && pos <= 8 ? 0.12 : 0) + bono + f(E, 'negociacion', 'gestion') * 0.22, 0.1, 0.95);
      if (!U.chance(pr)) { Pj.log(E, `El presidente de ${D().ccaa[c].nombre} no cuenta contigo para el Consejo de Gobierno.`); return false; }
      const por = libres.slice().sort((a, b) => T.infoGrupo(E, c, b).peso - T.infoGrupo(E, c, a).peso);
      const area = por[Math.min(por.length - 1, Math.floor(por.length / 2))], area2 = por[0] !== area ? por[0] : null;
      C.Eventos.disparar(E, C.Eventos.def('consejeria_lista'), { c, area, area2, pos: pos || null });
      return true;
    },
    tomarOferta(E, c, area) {
      const J = E.jugador;
      C.Territorio.tomarConsejeria(E, c, area);
      if (J.nivel === 'local') { Pj.dejar(E, 'local'); J.nivel = 'autonomico'; }
      Pj.cambiar(E, { prestigio: 5, pop: 2 }, true); Pj.sincronizar(E);
      Pj.log(E, `Tomas posesión como consejero/a de ${C.Territorio.infoGrupo(E, c, area).nombre} en ${D().ccaa[c].nombre}.`);
    },

    /* ── Candidaturas a las listas autonómicas ── */
    /* Descripción de la candidatura pendiente del jugador (o null). */
    aspiraTxt(E) {
      const J = E.jugador, a = J.aspira; if (!a) return null;
      if (a.nivel === 'nacional') return 'Lista al Congreso por ' + D().provincias[J.circ || Pj.mejorProvincia(E, J.partido, J.region)][0];
      if (a.nivel === 'autonomico') { const c = a.region || J.region; return (a.cabeza ? 'Candidato/a a presidir ' : 'Lista autonómica de ') + D().ccaa[c].nombre + ' · elecciones el ' + U.fmtT(E.esp.ccaa[c].parl.proxT, true); }
      return 'Lista municipal';
    },

    /* Comunidad por la que el jugador concurre a unas autonómicas: la de su candidatura o la suya. */
    regionLista(E) { const J = E.jugador; return J.aspira && J.aspira.nivel === 'autonomico' && J.aspira.region ? J.aspira.region : J.region; },

    /* Probabilidad de que la dirección regional acepte tu puesto en la lista o te elija cabeza de lista. */
    probLista(E, c, cabeza) {
      const J = E.jugador, rc = E.esp.ccaa[c], pid = J.partido, p = E.partidos[pid];
      if (cabeza && p.amb === 'reg' && p.lider === 'J') return 0.97;
      const x = f(E, 'negociacion', 'carisma'), fuera = c !== J.region, bonoRol = ({ direccion: 0.15, portavoz: 0.07 })[J.rol] || 0;
      let pr;
      if (!cabeza) pr = 0.35 + (J.prestigio - 30) / 120 + x * 0.3 + bonoRol - (fuera ? 0.14 : 0);
      else {
        const gob = rc.gob, inc = gob && gob.partido === pid && gob.pres !== 'J' ? 0.22 : 0;   // un presidente en ejercicio de tu partido es difícil de desbancar
        pr = 0.12 + (J.prestigio - 45) / 100 + (J.pop - 35) / 220 + x * 0.25 + bonoRol * 0.7 - inc - (fuera ? 0.12 : 0) + (p.cohesion < 45 ? 0.05 : 0);
      }
      return clamp(pr, cabeza ? 0.06 : 0.12, cabeza ? 0.8 : 0.9);
    },

    /* Una fila por comunidad donde tu partido puede presentarte: fecha de elecciones, escaños y qué puedes pedir. */
    opcionesLista(E) {
      const J = E.jugador, T = C.Territorio, p = E.partidos[J.partido], t = E.fecha.t;
      const libreCab = J.prestigio >= 45 && (J.rol !== 'base' || J.prestigio >= 58);
      const cabAuto = p.amb === 'reg' && p.lider === 'J';
      return T.ids().filter(c => p.amb !== 'reg' || p.region === c).map(c => {
        const rc = E.esp.ccaa[c], esc = rc.parl.escanos[J.partido] || 0, sem = rc.parl.proxT - t, propia = c === J.region;
        const o = { c, nombre: D().ccaa[c].nombre, t: rc.parl.proxT, sem, esc, propia, puesto: true, cabeza: true, mp: null, mc: null };
        const cierra = rc.suspendida ? 'Autonomía suspendida por el 155' : sem < 3 ? 'Listas ya cerradas' : !esc ? 'Tu partido no tiene escaños allí' : null;
        if (cierra) { o.puesto = o.cabeza = false; o.mp = o.mc = cierra; return o; }
        if (propia && J.nivel === 'autonomico') { o.puesto = false; o.mp = 'Ya tienes escaño: repites en la lista'; }
        else if (!propia && J.prestigio < 40) { o.puesto = false; o.mp = 'Necesitas prestigio 40+ para ir por otra comunidad'; }
        else if (J.prestigio < (J.nivel === 'local' && propia ? 28 : 36)) { o.puesto = false; o.mp = `Necesitas prestigio ${J.nivel === 'local' && propia ? 28 : 36}+`; }
        if (J.lidReg === c || (cabAuto && propia && J.nivel === 'autonomico')) { o.cabeza = false; o.mc = 'Ya eres la cabeza de lista'; }
        else if (p.amb === 'reg' && !cabAuto) { o.cabeza = false; o.mc = 'Tu partido tiene candidato fijo: su líder'; }
        else if (!cabAuto && !libreCab) { o.cabeza = false; o.mc = 'Necesitas prestigio 45+ y un puesto en la dirección (o 58+)'; }
        if (o.puesto) o.pp = Pj.probLista(E, c, false);
        if (o.cabeza) o.pc = Pj.probLista(E, c, true);
        return o;
      }).sort((a, b) => (b.propia - a.propia) || (a.t - b.t));
    },

    /* Cargos que ocupa el jugador y a los que puede renunciar, del más alto al más bajo. */
    cargosRenunciables(E) {
      const J = E.jugador, g = E.paises.ES.gob, rc = J.region && E.esp.ccaa[J.region], m = J.muni && E.esp.muni.m[J.muni], T = C.Territorio, out = [];
      if (g && g.pm === 'J') out.push({ k: 'pm', icono: '🦅', n: 'Presidente/a del Gobierno', d: 'Dimites: tu partido elige a otro líder y el Gobierno continúa con él. Conservas tu escaño.', pr: 6 });
      if (g && J.ministerio && g.ministros[J.ministerio] === 'J') out.push({ k: 'ministro', icono: '🏛', n: 'Ministro/a', d: 'Dejas la cartera; el presidente nombra a otra persona.', pr: 2 });
      if (rc && rc.gob && rc.gob.pres === 'J') out.push({ k: 'presauto', icono: '🗺', n: 'Presidente/a de ' + D().ccaa[J.region].nombre, d: 'Cedes la presidencia a otra persona de tu partido. Conservas tu escaño en el Parlamento.', pr: 4 });
      if (rc && rc.gob && J.consejeria === J.region && J.area && rc.gob.consej && rc.gob.consej[J.area] === 'J') out.push({ k: 'consejero', icono: '💼', n: 'Consejero/a de ' + T.infoGrupo(E, J.region, J.area).nombre, d: 'Dejas la consejería; sigues en el Parlamento autonómico.', pr: 1.5 });
      if (m && m.pm === 'J') out.push({ k: 'alcalde', icono: '🏛', n: 'Alcalde/sa de ' + m.nombre, d: 'El pleno elige a otro alcalde. Sigues como concejal/a.', pr: 4 });
      if (J.electo) out.push({ k: 'diputado', icono: '🏛', n: 'Escaño en el Congreso', d: 'Dejas el Congreso (y la cartera, si la tienes): entra el siguiente de tu lista.', pr: 3 });
      if (J.escReg) out.push({ k: 'dipauto', icono: '🗺', n: 'Escaño en el Parlamento autonómico', d: 'Dejas el Parlamento de tu comunidad (y la consejería o presidencia, si las tienes).', pr: 2.5 });
      if (J.concejal) out.push({ k: 'concejal', icono: '🏘', n: 'Acta de concejal/a', d: 'Dejas el ayuntamiento (y la alcaldía, si la tienes).', pr: 1.5 });
      return out;
    },
    renunciarCargo(E, k) {
      const J = E.jugador, g = E.paises.ES.gob, T = C.Territorio, rc = J.region && E.esp.ccaa[J.region], m = J.muni && E.esp.muni.m[J.muni];
      const op = Pj.cargosRenunciables(E).find(x => x.k === k); if (!op) return { ok: false, msg: 'No ocupas ese cargo' };
      const pa = E.partidos[J.partido];
      if (k === 'pm') { g.pm = null; C.Ejecutivo.nuevoLider(E, J.partido, 'tras la dimisión de ' + J.nombre); J.rol = 'direccion'; }
      else if (k === 'ministro') { g.ministros[J.ministerio] = null; J.ministerio = null; C.Ejecutivo.cubrirVacantes(E); }
      else if (k === 'presauto') { rc.cab[rc.gob.partido] = null; rc.gob.pres = pa.amb === 'nac' ? T.cabeza(E, J.region, rc.gob.partido).id : pa.lider; if (J.lidReg === J.region) J.lidReg = null; if (pa.lider === 'J' && pa.amb === 'reg') { C.Ejecutivo.nuevoLider(E, J.partido, 'tras la dimisión de ' + J.nombre); J.rol = 'direccion'; rc.gob.pres = E.partidos[J.partido].lider; } }
      else if (k === 'consejero') { const a = J.area; rc.gob.consej[a] = C.Gabinete.nueva(E, { region: J.region, partido: J.partido, esp: C.Gabinete.cargos(E, 'aut:' + J.region).find(x => x.id === a).esp }); J.consejeria = null; J.area = null; }
      else if (k === 'alcalde') { m.pm = null; C.Municipios.elegirAlcalde(E, J.muni, false); }
      else if (k === 'diputado') Pj.dejarNacional(E, 'tras su renuncia al escaño', true);
      else if (k === 'dipauto') Pj.dejar(E, 'autonomico');
      else if (k === 'concejal') Pj.dejar(E, 'local');
      Pj.cambiar(E, { prestigio: -op.pr, pop: -op.pr * 0.4 }, true);
      Pj.log(E, `Renuncias a tu cargo: ${op.n}.`);
      C.Noticias.poner(E, 'politica', `${J.nombre} (${pa.sigla}) renuncia a su cargo: ${op.n}.`, 'ES');
      Pj.sincronizar(E);
      return { ok: true, msg: `Has renunciado: ${op.n}.` };
    },

    /* Hasta que cambie el territorio: cambia de comunidad al ser elegido/a por otra. */
    mudarRegion(E, c, conservaEscano) {
      const J = E.jugador;
      if (J.region && J.region !== c) { Pj.dejar(E, 'local'); Pj.dejar(E, 'autonomico'); J.muni = null; J.areaMuni = null; }
      if (!conservaEscano && (J.nivel === 'nacional' || J.electo)) Pj.dejarNacional(E, 'a la política autonómica', true);
      J.region = c; J.consejeria = null;
      if (conservaEscano) J.circNueva = Pj.mejorProvincia(E, J.partido, c); else { J.circ = Pj.mejorProvincia(E, J.partido, c); J.circNueva = null; }
    },

    /* Comunidades donde tu partido está presente, con la probabilidad de que la dirección acepte tu traslado. */
    opcionesComunidad(E) {
      const J = E.jugador, T = C.Territorio, rolB = ({ direccion: 0.12, portavoz: 0.06, lider: 0.25 })[J.rol] || 0;
      return T.ids().filter(c => c !== J.region).map(c => {
        const rc = E.esp.ccaa[c], esc = rc.parl.escanos[J.partido] || 0, total = U.suma(Object.values(rc.parl.escanos));
        const p = clamp(0.28 + (J.prestigio - 35) / 110 + rolB + f(E, 'negociacion', 'carisma') * 0.2 + (esc >= 10 ? 0.08 : 0), 0.08, 0.85);
        return { c, nombre: D().ccaa[c].nombre, esc, total, p, t: rc.parl.proxT, gob: rc.gob ? rc.gob.partido : null };
      }).filter(o => o.esc > 0 && !rc0(E, o.c)).sort((a, b) => b.esc - a.esc);
    },

    /* Antes de formar gobierno tras unas autonómicas: la cabeza de lista del jugador es quien se presenta a la investidura. */
    antes_autonomicas(E, c) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const asp = J.aspira && J.aspira.nivel === 'autonomico' && J.aspira.region === c && J.aspira.cabeza ? J.aspira : null;
      if (asp) E.esp.ccaa[c].cab[J.partido] = 'J';
    },

    tras_generales(E, previo, res) {
      const J = E.jugador;
      if (J && J.circNueva) { J.circ = J.circNueva; J.circNueva = null; }
      if (Pj.esUE(E)) { J.electo = false; return { electo: false, ue: true }; }
      const aspira = J.aspira && J.aspira.nivel === 'nacional';
      if (J.nivel !== 'nacional' && !aspira) { J.campania = null; return null; }
      const nuevos = E.paises.ES.escanos[J.partido] || 0, antes = previo ? (previo.escanos[J.partido] || 0) : 0;
      const circ = J.circ, nProv = (res.prov[circ] && res.prov[circ].escanos[J.partido]) || 0;
      let pos = Pj.posicion(E, J, antes, nuevos, aspira ? -6 : 0);
      // En su circunscripción: la posición se compara con los escaños de su partido ahí
      const posProv = J.rol === 'lider' || J.cabezaLista === circ ? 1 : 1 + Math.floor((1 - clamp(J.prestigio * 0.6 + J.pop * 0.4 + ({ base: 0, portavoz: 8, direccion: 16 }[J.rol] || 0), 0, 100) / 100) * (nProv + 2));
      const electo = nProv > 0 && posProv <= nProv || (J.rol === 'lider' && nuevos > 0);
      const r = { electo, pos: posProv, escanos: nuevos, antes, circ: nProv };
      J.campania = null; J.aspira = null; J.cabezaLista = null;
      if (electo) {
        if (J.nivel !== 'nacional') { Pj.dejar(E, 'local'); Pj.dejar(E, 'autonomico'); J.nivel = 'nacional'; }
        J.electo = true; Pj.log(E, `${aspira ? 'Das el salto al Congreso: ' : 'Eres reelegido/a: '}puesto ${posProv} en ${D().provincias[circ][0]} (${nProv} escaños de tu partido ahí, ${nuevos} en total).`);
      } else { J.electo = false; Pj.log(E, `No logras escaño en las generales (puesto ${posProv} en ${D().provincias[circ][0]}; tu partido logra ${nProv} ahí).`); }
      Pj.sincronizar(E);
      return r;
    },

    tras_autonomicas(E, c, previo, res) {
      const J = E.jugador; if (!J) return null;
      const asp = J.aspira && J.aspira.nivel === 'autonomico' && (J.aspira.region || J.region) === c ? J.aspira : null;
      const propia = J.region === c && (J.nivel === 'autonomico' || J.lidReg === c);
      const rc = E.esp.ccaa[c], pa = E.partidos[J.partido];
      if (!asp && !propia) { if (rc.cab[J.partido] === 'J' && J.lidReg !== c) rc.cab[J.partido] = null; return null; }
      const cabeza = !!(asp && asp.cabeza) || J.lidReg === c || (J.cabeza && J.region === c) || (pa.amb === 'reg' && pa.lider === 'J' && pa.region === c);
      const fuera = !!asp && c !== J.region;
      const nuevos = res.escanos[J.partido] || 0, antes = previo.escanos[J.partido] || 0;
      const pos = cabeza ? 1 : Pj.posicion(E, J, antes, nuevos, asp ? (fuera ? -10 : -6) : 8);
      const electo = pos <= nuevos;
      const r = { electo, pos, escanos: nuevos, antes, cabeza };
      J.campania = null;
      const nom = D().ccaa[c].nombre;
      if (electo) {
        if (fuera) Pj.mudarRegion(E, c);
        else if (J.nivel === 'local') { Pj.dejar(E, 'local'); J.nivel = 'autonomico'; }
        else if (asp && (J.nivel === 'nacional' || J.electo)) Pj.dejarNacional(E, 'a la política autonómica', true);
        J.escReg = true;
        if (cabeza && pa.amb === 'nac') { rc.cab[J.partido] = 'J'; J.lidReg = c; }
        Pj.log(E, asp ? `${cabeza ? 'Encabezas la lista' : 'Entras en el Parlamento'} de ${nom}${fuera ? ' (das el salto desde otra comunidad)' : ''}: ${nuevos} escaños para tu partido${cabeza ? '' : ', puesto ' + pos}.` : `Repites escaño autonómico: puesto ${pos}, ${nuevos} escaños para tu partido.`);
      } else {
        if (propia) J.escReg = false;
        if (cabeza && rc.cab[J.partido] === 'J' && J.lidReg !== c) rc.cab[J.partido] = null;
        Pj.log(E, `No logras escaño en el Parlamento de ${nom} (puesto ${pos}; ${nuevos} escaños).`);
      }
      if (asp) J.aspira = null;
      // Presidente del Gobierno autonómico si su partido forma gobierno y encabeza la lista
      if (rc.inv) { J.posReg = pos; J.cabezaReg = cabeza && electo; Pj.sincronizar(E); r.invPendiente = true; return r; }   // el gobierno se decide en la investidura
      const gob = rc.gob;
      if (electo && gob && gob.partido === J.partido && cabeza) { gob.pres = 'J'; r.presidente = true; }
      else if (J.consejeria === c && !(gob && gob.coalicion.includes(J.partido))) J.consejeria = null;
      Pj.sincronizar(E);
      if (electo && !cabeza && J.region === c) r.oferta = Pj.ofertaConsejeria(E, c, pos);
      return r;
    },

    /* Tras la investidura autonómica: el jugador puede quedar como presidente, recibir una consejería o pasar a la oposición. */
    tras_investidura(E, c) {
      const J = E.jugador, rc = E.esp.ccaa[c], gob = rc.gob; if (!J || J.pais !== 'ES' || !gob) return;
      const cabeza = !!J.cabezaReg && rc.cab[J.partido] === 'J' && J.region === c;
      if (J.region === c && J.escReg && gob.partido === J.partido && cabeza) { gob.pres = 'J'; Pj.log(E, `Eres investido/a presidente/a de ${D().ccaa[c].nombre}.`); }
      else if (J.consejeria === c && !gob.coalicion.includes(J.partido)) { J.consejeria = null; J.area = null; }
      Pj.sincronizar(E);
      if (J.region === c && J.escReg && !cabeza && gob.pres !== 'J') Pj.ofertaConsejeria(E, c, J.posReg || null);
    },

    tras_municipales(E, res) {
      const J = E.jugador; if (!J || !J.muni) return null;
      const aspira = J.aspira && J.aspira.nivel === 'local';
      if (J.nivel !== 'local' && !aspira) { return null; }
      const m = E.esp.muni.m[J.muni], n = m.esc[J.partido] || 0;
      const pos = J.rol === 'lider' || J.cabeza ? 1 : Pj.posicion(E, J, n, n, 4);
      const electo = n > 0 && pos <= n, r = { electo, pos, escanos: n, muni: J.muni, alcalde: false };
      J.campania = null;
      if (m.pm === 'J' && m.alcalde !== J.partido) m.pm = null;
      if (electo && (J.rol === 'lider' || J.cabeza) && m.alcalde === J.partido) { if (m.pm && m.pm !== 'J') delete E.politicos[m.pm]; m.pm = 'J'; r.alcalde = true; Pj.log(E, `Eres investido/a alcalde/sa de ${m.nombre}.`); }
      else if (electo) { J.concejal = true; Pj.log(E, `Eres ${J.rol === 'lider' ? 'cabeza de lista y ' : ''}concejal/a en ${m.nombre} (${n} ediles de tu partido).`); }
      else { J.concejal = false; J.areaMuni = null; if (m.pm === 'J') m.pm = null; Pj.log(E, `No logras acta de concejal/a en ${m.nombre}.`); }
      J.aspira = aspira ? null : J.aspira;
      Pj.sincronizar(E);
      return r;
    },

    turno(E) {
      const J = E.jugador; if (!J) return;
      J.agenda.max = J.retirado ? 0 : Pj.maxAgenda(E); J.agenda.puntos = J.agenda.max; J.agenda.hechas = [];
      const d = U.hoy(), mmdd = String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
      const ult = U.fechaDe(E.fecha.t - 1), mmdd0 = String(ult.getUTCMonth() + 1).padStart(2, '0') + '-' + String(ult.getUTCDate()).padStart(2, '0');
      if (mmdd !== mmdd0 && mmdd >= J.cumple && mmdd0 < J.cumple) J.edad++;
      J.pop = clamp(J.pop + (J.cargo === 'activista' ? -0.12 : -0.05) + (J.pop < 20 ? 0.03 : 0), 0, 100);
      J.capEU = clamp(J.capEU - 0.03, 0, 100);
      J.prestigio = clamp(J.prestigio + (12 + 8 * D().cargos[J.cargo].nivel + (J.rol === 'lider' ? 10 : 0) - J.prestigio) * 0.002, 0, 100);
      // Campañas autonómicas y municipales
      if (!J.campania) {
        const regC = J.aspira && J.aspira.nivel === 'autonomico' ? J.aspira.region || J.region : J.nivel === 'autonomico' ? J.region : null;
        const rc = regC && E.esp.ccaa[regC], mm = E.esp.muni;
        if (rc && rc.parl.proxT > E.fecha.t && rc.parl.proxT - E.fecha.t <= 6) J.campania = { pts: 0, mitines: 0, tipo: 'aut', region: regC };
        else if (J.muni && (J.nivel === 'local' || (J.aspira && J.aspira.nivel === 'local')) && mm.proxT > E.fecha.t && mm.proxT - E.fecha.t <= 6) J.campania = { pts: 0, mitines: 0, tipo: 'mun' };
      }
      // Equilibrio del bono de campaña regional
      for (const c in E.esp.ccaa) { const b = E.esp.ccaa[c].bonus; if (b) for (const k in b) b[k] *= 0.985; }
      Pj.syncPol(E);
      if (E.fecha.t % 4 === 0) E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.rel) m.rel *= 0.985; });
    }
  };

  /* ── Acciones del jugador ── */
  const rc0 = (E, c) => !!E.esp.ccaa[c].suspendida;
  const A = (id, o) => C.Acciones.registrar(Object.assign({ id, costo: 1 }, o));
  const enParl = E => Pj.enParlamento(E) || 'Necesitas un escaño en el Congreso';
  const f = (E, ...ks) => U.suma(ks.map(k => E.jugador.atrib[k])) / (10 * ks.length);   // 0..1
  const pa = E => E.partidos[E.jugador.partido];
  const gob = E => E.paises.ES.gob;
  const enGob = E => gob(E).coalicion.includes(E.jugador.partido);
  const esPM = E => E.jugador.cargo === 'pm';
  const rcJ = E => E.esp.ccaa[E.jugador.region];
  const muJ = E => E.esp.muni.m[E.jugador.muni];
  const presAut = E => E.jugador.cargo === 'presauto' ? true : 'Sólo el presidente/a autonómico/a';
  const alcalde = E => E.jugador.cargo === 'alcalde' ? true : 'Sólo el alcalde/sa';
  const nivelAut = E => ['dipauto', 'consejero', 'presauto'].includes(E.jugador.cargo) ? true : 'Necesitas un escaño o cargo autonómico';
  const nivelLoc = E => ['concejal', 'alcalde'].includes(E.jugador.cargo) ? true : 'Necesitas un cargo municipal';

  /* — Congreso — */
  A('discurso', {
    nombre: 'Discurso en el pleno', icono: '🎤', grupo: 'parlamento', desc: 'Una intervención en la tribuna del Congreso: gana notoriedad y prestigio si te sale bien.',
    disponible: enParl,
    ejecutar(E) {
      const x = f(E, 'oratoria', 'carisma');
      if (U.chance(0.4 + 0.55 * x)) { Pj.cambiar(E, { pop: 1.1 + 2 * x, prestigio: 0.8 + 1.2 * x }); C.Opinion.empujeJ(E, 0.03 + x * 0.05); return { ok: true, msg: 'Tu discurso en el pleno es citado por los medios.' }; }
      Pj.cambiar(E, { pop: -0.3 }); return { ok: true, exito: false, msg: 'Un discurso correcto pero que pasa sin pena ni gloria.' };
    }
  });
  A('pregunta_control', {
    nombre: 'Sesión de control al Gobierno', icono: '❓', grupo: 'parlamento', desc: 'Pregunta a los ministros en la sesión de control de los miércoles. Si estás en la oposición, puede desgastar al Gobierno.',
    disponible(E) { if (!Pj.enParlamento(E)) return 'Necesitas un escaño en el Congreso'; if (enGob(E)) return 'Tu partido está en el Gobierno'; return true; },
    ejecutar(E) {
      const x = f(E, 'oratoria', 'integridad'), g = gob(E);
      if (U.chance(0.35 + 0.5 * x)) { g.aprob = Math.max(5, g.aprob - (0.4 + x * 0.8)); g.estab -= 0.4; Pj.cambiar(E, { pop: 1.0, prestigio: 1 }); return { ok: true, msg: 'Tu pregunta incomoda al Gobierno y abre telediarios.' }; }
      Pj.cambiar(E, { prestigio: -0.3 }); return { ok: true, exito: false, msg: 'El Gobierno esquiva tu pregunta sin consecuencias.' };
    }
  });
  A('proponer_ley', {
    nombre: 'Registrar una proposición de ley', icono: '📜', costo: 2, grupo: 'parlamento', desc: 'Diseña y registra tu propia iniciativa legislativa en el Congreso (alcance, enfoque, financiación y calendario).',
    disponible(E) { const r = enParl(E); if (r !== true) return r; if (C.Congreso.abiertos(E).filter(p => p.autor.tipo === 'jugador').length >= 2) return 'Ya tienes dos proyectos en trámite'; if (C.Generales.puedeDisolver && E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en periodo ordinario'; return true; },
    ejecutar(E, a) {
      const tpl = D().leyes.find(l => l.id === a.tpl); if (!tpl || tpl.manual || tpl.rdlSolo) return { ok: false, msg: 'Elige un proyecto' };
      if (C.Congreso.abiertos(E).some(p => p.tpl === tpl.id)) return { ok: false, msg: 'Ya hay un proyecto igual en trámite' };
      const J = E.jugador;
      const p = C.Congreso.proponer(E, tpl.id, { tipo: 'jugador', pid: J.partido }, { dis: a.dis || null, ajuste: Pj.ajusteLey(E, tpl) });
      Pj.cambiar(E, { prestigio: 0.8, pop: 0.3 });
      C.Noticias.poner(E, 'parlamento', `${J.nombre} (${pa(E).sigla}) registra «${p.t}».`, 'ES');
      return { ok: true, msg: `Registras «${p.t}».` };
    }
  });
  A('proponer_cambio_ley', {
    nombre: 'Reformar o derogar una ley en vigor', icono: '♻️', costo: 2, grupo: 'parlamento', desc: 'Registra una proposición para modificar el diseño de una ley vigente o derogarla.',
    disponible(E) { const r = enParl(E); if (r !== true) return r; if (C.Congreso.abiertos(E).filter(p => p.autor.tipo === 'jugador').length >= 2) return 'Ya tienes dos proyectos en trámite'; return E.esp.vigor && E.esp.vigor.some(v => v.estado === 'activa') ? true : 'No hay leyes en vigor'; },
    ejecutar(E, a) {
      const J = E.jugador, p = C.Congreso.proponerCambio(E, a.vigor, a.tipo === 'derogar' ? 'derogar' : 'reformar', { tipo: 'jugador', pid: J.partido }, a.dis);
      if (!p) return { ok: false, msg: 'Esa ley ya tiene una reforma o derogación en trámite' };
      Pj.cambiar(E, { prestigio: 0.8, pop: 0.3 });
      C.Noticias.poner(E, 'parlamento', `${J.nombre} (${pa(E).sigla}) registra «${p.t}».`, 'ES');
      return { ok: true, msg: `Registras «${p.t}».` };
    }
  });
  A('aceptar_enmienda', {
    nombre: 'Negociar una enmienda', icono: '✍️', costo: 1, grupo: 'parlamento', desc: 'Cambia el diseño de tu proyecto (o del proyecto de tu Gobierno) para atraer los votos de otro grupo.',
    disponible(E, a) {
      const p = a && a.proy && E.proyectos[a.proy];
      if (!p) return C.Congreso.abiertos(E).some(q => ['registro', 'ponencia'].includes(q.etapa) && (q.autor.tipo === 'jugador' || (q.autor.tipo === 'gobierno' && C.Consejo.pmEsJ(E)))) ? true : 'Necesitas un proyecto propio en registro o en comisión';
      if (!['registro', 'ponencia'].includes(p.etapa)) return 'Sólo se puede enmendar en el registro o la comisión';
      if (!(p.autor.tipo === 'jugador' || (p.autor.tipo === 'gobierno' && C.Consejo.pmEsJ(E)))) return 'Sólo el autor del texto puede aceptar enmiendas';
      return (p.enm || 0) >= 3 ? 'Ya se han aceptado tres enmiendas' : true;
    },
    ejecutar(E, a) {
      const p = E.proyectos[a.proy]; if (!p) return { ok: false, msg: 'Elige un proyecto' };
      C.Impacto.aplicarEnmienda(E, p, { k: a.k, v: a.v });
      if (a.pid && E.partidos[a.pid]) { p.apoyo[a.pid] = (p.apoyo[a.pid] || 0) + 0.25; E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.p === a.pid && i !== 'J') m.rel = clamp(m.rel + 3, -100, 100); }); }
      Pj.cambiar(E, { prestigio: 0.5 });
      return { ok: true, msg: `Aceptas la enmienda${a.pid ? ' de ' + E.partidos[a.pid].sigla : ''}: «${p.t}» queda más cerca de su posición.` };
    }
  });
  A('cabildear_ley', {
    nombre: 'Cabildear un proyecto', icono: '🤝', grupo: 'parlamento', desc: 'Negocia con un grupo parlamentario para ganar o perder sus votos.',
    disponible: enParl,
    ejecutar(E, a) {
      const p = E.proyectos[a.proy]; if (!p || !['registro', 'ponencia', 'pleno', 'pleno_pend', 'senado', 'vuelta'].includes(p.etapa)) return { ok: false, msg: 'Elige un proyecto en trámite' };
      const k = a.pid; if (!k || !E.partidos[k]) return { ok: false, msg: 'Elige un grupo' };
      const x = f(E, 'negociacion', 'carisma'), gana = a.lado === 'no' ? -1 : 1;
      if (U.chance(0.45 + 0.5 * x)) {
        p.apoyo[k] = (p.apoyo[k] || 0) + gana * (0.22 + 0.2 * x);
        E.parl.miembros.forEach(i => { const m = E.politicos[i]; if (m && m.p === k && i !== 'J') m.rel = clamp(m.rel + 4, -100, 100); });
        Pj.cambiar(E, { prestigio: 0.4 }); return { ok: true, msg: `${E.partidos[k].sigla} acepta moverse ${gana > 0 ? 'a favor' : 'en contra'} de «${p.t}».` };
      }
      return { ok: true, exito: false, msg: `${E.partidos[k].sigla} no se deja convencer.` };
    }
  });
  A('mocion_censura', {
    nombre: 'Presentar una moción de censura', icono: '⚡', costo: 3, grupo: 'nacional', desc: 'Sólo líderes de la oposición: la moción es constructiva, necesita 176 votos y propone un candidato alternativo.',
    disponible(E) { const J = E.jugador; if (J.rol !== 'lider') return 'Sólo el líder de un partido puede presentarla'; if (!Pj.enParlamento(E)) return 'Necesitas escaño en el Congreso'; if (enGob(E)) return 'Tu partido está en el Gobierno'; if (E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en periodo ordinario'; if (E.esp.cortes.mocion) return 'Ya hay una moción en trámite'; if (E.fecha.t - (E.esp.cortes.ultMocion || -99) < 26) return 'Ya se votó otra moción hace poco'; return true; },
    ejecutar(E) { E.ui.abrir = { tipo: 'consultas', modo: 'censura' }; return { ok: true, msg: 'Preparas una moción de censura: negocia con los grupos.' }; }
  });
  /* — Presidente del Gobierno y Consejo de Ministros — */
  A('disolver_cortes', {
    nombre: 'Disolver las Cortes (adelanto electoral)', icono: '🗳️', costo: 2, grupo: 'nacional', desc: 'Sólo el presidente del Gobierno: convoca elecciones generales anticipadas (campaña de ocho semanas).',
    disponible(E) { if (!esPM(E)) return 'Sólo el presidente/a del Gobierno'; return C.Generales.puedeDisolver(E); },
    ejecutar(E) { const r = C.Generales.disolver(E, 'a petición del presidente', false); if (r !== true) return { ok: false, msg: r }; return { ok: true, msg: 'Disuelves las Cortes: elecciones generales en ocho semanas.' }; }
  });
  A('cuestion_confianza', {
    nombre: 'Plantear la cuestión de confianza', icono: '🤞', costo: 2, grupo: 'nacional', desc: 'Pides al Congreso que renueve su confianza. Si la ganas, tu estabilidad sube; si la pierdes, el Gobierno cae.',
    disponible(E) { return esPM(E) ? (E.esp.cortes.estado === 'activa' ? true : 'No es posible ahora') : 'Sólo el presidente/a del Gobierno'; },
    ejecutar(E) { const r = C.Consejo.cuestionConfianza(E); if (r === true) { Pj.cambiar(E, { prestigio: 3 }, true); return { ok: true, msg: 'Superas la cuestión de confianza.' }; } if (r === 'derrota') { Pj.cambiar(E, { prestigio: -8 }, true); return { ok: true, exito: false, msg: 'El Congreso te niega la confianza.' }; } return { ok: false, msg: r }; }
  });
  A('remodelar', {
    nombre: 'Remodelar el Gobierno', icono: '🔄', costo: 2, grupo: 'nacional', desc: 'Cambia varias carteras: refresca la imagen del Ejecutivo.',
    disponible(E) { return esPM(E) ? true : 'Sólo el presidente/a del Gobierno'; },
    ejecutar(E) { const r = C.Consejo.remodelar(E); return r === true ? { ok: true, msg: 'Remodelas el Gobierno.' } : { ok: false, msg: r }; }
  });
  A('conferencia', {
    nombre: 'Convocar la Conferencia de Presidentes', icono: '🏛️', costo: 2, grupo: 'nacional', desc: 'Reúnes a los presidentes autonómicos: mejora la relación con las comunidades.',
    disponible(E) { return esPM(E) ? (E.fecha.t - E.esp.confPres.ultima > 26 ? true : 'Se celebró hace menos de seis meses') : 'Sólo el presidente/a del Gobierno'; },
    ejecutar(E) { C.Territorio.conferenciaPresidentes(E); Pj.cambiar(E, { prestigio: 1.5 }); return { ok: true, msg: 'La Conferencia de Presidentes termina con un comunicado conjunto.' }; }
  });
  A('visita_ccaa', {
    nombre: 'Visitar una comunidad autónoma', icono: '🚄', grupo: 'nacional', desc: 'Presidente/a o ministro/a: mejora la relación con una comunidad y gana notoriedad allí.',
    disponible(E) { return ['pm', 'ministro'].includes(E.jugador.cargo) ? true : 'Sólo presidente/a del Gobierno o ministros'; },
    ejecutar(E, a) {
      const c = a.region; if (!c || !E.esp.ccaa[c]) return { ok: false, msg: 'Elige una comunidad' };
      const x = f(E, 'carisma', 'negociacion'); E.esp.ccaa[c].relM = clamp(E.esp.ccaa[c].relM + 2 + 3 * x, 0, 100);
      Pj.cambiar(E, { prestigio: 0.6, pop: 0.6 }); return { ok: true, msg: `Tu visita a ${D().ccaa[c].nombre} mejora el clima con su Gobierno.` };
    }
  });
  A('plan_ministerio', {
    nombre: 'Impulsar un plan de tu ministerio', icono: '🗂️', costo: 2, grupo: 'nacional', desc: 'Ministros y presidente: mejora un indicador de tu sector.',
    disponible(E) { return ['ministro', 'pm'].includes(E.jugador.cargo) ? true : 'Debes ser ministro/a o presidente/a del Gobierno'; },
    ejecutar(E) {
      const J = E.jugador, x = f(E, 'gestion', 'negociacion');
      const m = J.cargo === 'pm' ? null : D().ministerios.find(k => k.id === J.ministerio);
      const efs = { hac: { deficit: -0.15 }, eco: { crec: 0.06 }, tra: { paro: -0.15 }, amb: { infl: -0.1, crec: 0.05 }, sal: { aprob: 1.5 }, edu: { crec: 0.05, aprob: 1 }, agr: { aprob: 1 }, ter: { crec: 0.04 }, tpt: { crec: 0.06 }, viv: { aprob: 1.2 }, int: { aprob: 1 }, jus: { aprob: 0.8 }, ext: { aprob: 0.6 }, def: { aprob: 0.6 }, ind: { crec: 0.07 }, inc: { aprob: 1 }, dig: { crec: 0.05 }, cie: { crec: 0.04 } };
      const ef = !m ? { crec: 0.05, aprob: 1.2 } : (efs[m.id] || { aprob: 0.8 });
      const k = 0.6 + x, e2 = {}; for (const kk in ef) e2[kk] = ef[kk] * k;
      C.Economia.aplicar(E, 'ES', e2);
      Pj.cambiar(E, { prestigio: 1.5 + x * 1.5, pop: 0.8 }); if (m && m.id === 'ext') Pj.cambiar(E, { capEU: 2 });
      return { ok: true, msg: 'Tu plan arranca con buena acogida.' };
    }
  });
  A('propuesta_consejo', {
    nombre: 'Proponer una iniciativa al Consejo de Ministros', icono: '📨', costo: 2, grupo: 'nacional', desc: 'Ministros: lleva al presidente una ley o decreto de tu área.',
    disponible(E) { return E.jugador.cargo === 'ministro' ? true : 'Sólo ministros/as'; },
    ejecutar(E, a) {
      const r = C.Consejo.propuestaMinistro(E, a.tpl);
      if (r === true) { Pj.cambiar(E, { prestigio: 2 }); return { ok: true, msg: 'El Consejo de Ministros hace suya tu iniciativa.' }; }
      return { ok: true, exito: false, msg: r };
    }
  });
  A('ultimatum', {
    nombre: 'Presionar a tu socio de Gobierno', icono: '⚔️', costo: 2, grupo: 'nacional', desc: 'Líder de un socio de coalición: exiges una contrapartida al presidente. Si no cede, aumenta la tensión.',
    disponible(E) { const J = E.jugador; if (J.rol !== 'lider') return 'Sólo el líder del partido'; if (!enGob(E) || esPM(E) || gob(E).partido === J.partido) return 'Sólo si diriges un socio de coalición'; return true; },
    ejecutar(E) {
      const cs = E.esp.consejo, g = gob(E), J = E.jugador, x = f(E, 'negociacion', 'carisma');
      if (U.chance(0.35 + 0.4 * x)) { cs.sat[J.partido] = clamp((cs.sat[J.partido] || 50) + 10, 0, 100); const tpl = C.Congreso.elegirPlantilla(E, pa(E), null, l => !l.manual && !l.rdlSolo); if (tpl) { C.Congreso.proponer(E, tpl.id, { tipo: 'gobierno', pid: g.partido, socio: J.partido }); C.Noticias.poner(E, 'gobierno', `${pa(E).sigla} arranca al Gobierno un compromiso: «${tpl.t}».`, 'ES'); } Pj.cambiar(E, { prestigio: 2 }); return { ok: true, msg: 'El presidente cede y asume tu propuesta.' }; }
      cs.sat[J.partido] = clamp((cs.sat[J.partido] || 50) - 6, 0, 100); g.estab -= 2; Pj.cambiar(E, { prestigio: -1 });
      return { ok: true, exito: false, msg: 'El presidente se planta: la coalición se resiente.' };
    }
  });
  A('negociar_coalicion', {
    nombre: 'Engrasar la coalición de gobierno', icono: '⚙️', grupo: 'nacional', desc: 'Calma a los socios y refuerza la estabilidad del Ejecutivo.',
    disponible(E) { return enGob(E) ? true : 'Tu partido no está en el Gobierno'; },
    ejecutar(E) {
      const x = f(E, 'negociacion', 'gestion'), g = gob(E), J = E.jugador;
      const mult = J.rol === 'lider' || J.cargo === 'pm' ? 1.6 : J.cargo === 'ministro' ? 1.2 : 0.6;
      g.estab = clamp(g.estab + (1.5 + 3 * x) * mult, 0, 100); E.esp.consejo.sat[J.partido] = clamp((E.esp.consejo.sat[J.partido] || 55) + 2 * mult, 0, 100); Pj.cambiar(E, { prestigio: 0.7 });
      return { ok: true, msg: 'Las aguas se calman en el Consejo de Ministros.' };
    }
  });
  /* — Comunidad autónoma — */
  A('sesion_autonomica', {
    nombre: 'Intervenir en el Parlamento autonómico', icono: '🏛️', grupo: 'autonomico', desc: 'Una intervención en la cámara de tu comunidad: gana notoriedad regional.',
    disponible: nivelAut,
    ejecutar(E) {
      const x = f(E, 'oratoria', 'carisma');
      if (U.chance(0.45 + 0.5 * x)) { Pj.cambiar(E, { pop: 1.3 + 2 * x, prestigio: 0.9 + 1.2 * x }); Pj.empuje(E, 0.04 + x * 0.05); return { ok: true, msg: 'Tu intervención es portada de la prensa regional.' }; }
      Pj.cambiar(E, { pop: -0.2 }); return { ok: true, exito: false, msg: 'La sesión pasa sin pena ni gloria.' };
    }
  });
  A('pedir_moncloa', {
    nombre: 'Negociar con Moncloa', icono: '📞', costo: 2, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: pide fondos, competencias o financiación al Gobierno central.',
    disponible: presAut,
    ejecutar(E) {
      const rc = rcJ(E), g = gob(E), x = f(E, 'negociacion', 'carisma');
      const afin = (g.coalicion.includes(rc.gob.partido) ? 0.25 : 0) + ((g.apoyoExterno || []).includes(rc.gob.partido) ? 0.15 : 0) + (rc.gob.partido === g.partido ? 0.15 : 0);
      if (U.chance(clamp(0.3 + 0.4 * x + afin + (rc.relM - 50) / 300, 0.1, 0.9))) {
        rc.relM = clamp(rc.relM + 4, 0, 100); rc.fiscal += 0.15; rc.aut = clamp(rc.aut + 1, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob + 1.2, 5, 90);
        Pj.cambiar(E, { prestigio: 1.5, pop: 1 }); return { ok: true, msg: `Moncloa accede a parte de lo que reclamas para ${D().ccaa[rc.id].nombre}.` };
      }
      rc.relM = clamp(rc.relM - 1, 0, 100); return { ok: true, exito: false, msg: 'El Gobierno central da largas.' };
    }
  });
  A('agravio', {
    nombre: 'Denunciar el trato del Gobierno central', icono: '📢', grupo: 'autonomico', desc: 'Confrontación pública con Madrid: calienta tu electorado, enfría la relación y alimenta el soberanismo.',
    disponible: presAut,
    ejecutar(E) {
      const rc = rcJ(E), J = E.jugador;
      rc.relM = clamp(rc.relM - 5, 0, 100); rc.gob.aprob = clamp(rc.gob.aprob + 1.5, 5, 90); Pj.empuje(E, 0.05);
      if (D().ccaa[rc.id].indep0 > 5) rc.concesiones.push({ t: E.fecha.t, v: 0.6, d: 'Discurso de agravio' });
      Pj.cambiar(E, { pop: 1.5, prestigio: 0.4 }); return { ok: true, msg: 'Tu discurso reivindicativo arrastra a tu electorado.' };
    }
  });
  A('plan_regional', {
    nombre: 'Aprobar un plan regional', icono: '🗂️', costo: 2, grupo: 'autonomico', desc: 'Presidente/a o consejero/a: sanidad, vivienda o empleo en tu comunidad. Sube tu aprobación.',
    disponible(E) { return ['presauto', 'consejero'].includes(E.jugador.cargo) ? true : 'Necesitas un cargo de gobierno autonómico'; },
    ejecutar(E) {
      const rc = rcJ(E), x = f(E, 'gestion', 'negociacion');
      rc.gob.aprob = clamp(rc.gob.aprob + 0.8 + 1.4 * x, 5, 90); rc.deuda = clamp(rc.deuda + 0.4, 3, 90); Pj.empuje(E, 0.03 + x * 0.04);
      Pj.cambiar(E, { prestigio: 1.2 + x * 1.2, pop: 1 }); return { ok: true, msg: 'Tu plan regional arranca con buena acogida.' };
    }
  });
  A('reforma_estatuto', {
    nombre: 'Impulsar la reforma del Estatuto', icono: '📖', costo: 3, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: tramita en el Parlamento regional una reforma estatutaria y la remite a las Cortes.',
    disponible(E) { const r = presAut(E); if (r !== true) return r; return rcJ(E).estatuto.proceso ? 'Ya hay un proceso en marcha' : true; },
    ejecutar(E) {
      const r = C.Territorio.proponerEstatuto(E, E.jugador.region, { tipo: 'jugador', pid: E.jugador.partido, region: E.jugador.region });
      if (r === true) { Pj.cambiar(E, { prestigio: 2, pop: 1 }); return { ok: true, msg: 'La reforma estatutaria parte hacia las Cortes Generales.' }; }
      return { ok: false, msg: r };
    }
  });
  A('adelanto_autonomico', {
    nombre: 'Disolver el Parlamento autonómico', icono: '🗳️', costo: 2, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: disuelve el Parlamento y convoca elecciones anticipadas (siete semanas). Ves antes la proyección de escaños.',
    disponible(E) {
      const r = presAut(E); if (r !== true) return r; const rc = rcJ(E);
      if (rc.suspendida) return 'La autonomía está suspendida por el artículo 155';
      if (rc.parl.proxT - E.fecha.t < 14) return 'Las elecciones ya están convocadas o muy cerca';
      if (E.fecha.t - rc.parl.ult < 52) return 'No puedes disolver hasta un año después de las últimas elecciones';
      return true;
    },
    ejecutar(E) {
      const J = E.jugador, c = J.region, rc = rcJ(E), T = C.Territorio, pr = T.proyectar(E, c);
      const gana = pr.bloque >= pr.may, mejora = pr.bloque - pr.ahora;
      T.adelantar(E, c, `a petición de ${J.nombre}`);
      // Los socios temen perder escaños; el electorado premia o castiga el cálculo
      if (rc.gob) rc.gob.estab = Math.max(5, rc.gob.estab - (mejora < 0 ? 4 : 1));
      Pj.cambiar(E, { prestigio: gana ? 1.5 : -2.5, pop: mejora >= 0 ? 0.6 : -0.8 }, true);
      Pj.log(E, `Disuelves el Parlamento de ${D().ccaa[c].nombre}: elecciones el ${U.fmtT(rc.parl.proxT)}. Proyección: ${pr.bloque} escaños para tu bloque (mayoría ${pr.may}).`);
      return { ok: true, msg: `Disuelves el Parlamento: elecciones autonómicas el ${U.fmtT(rc.parl.proxT, true)}.` };
    }
  });
  A('consulta', {
    nombre: 'Convocar una consulta de autodeterminación', icono: '🗳️', costo: 3, grupo: 'autonomico', desc: 'Con un Gobierno soberanista y apoyo social suficiente (varía por comunidad): desafío unilateral al Estado.',
    disponible(E) { const r = presAut(E); if (r !== true) return r; const rc = rcJ(E), conf = D().procesos[rc.id]; if (!conf) return 'Tu comunidad no tiene un movimiento soberanista relevante'; if (!rc.gob.coalicion.some(k => E.partidos[k].indep >= conf.indepMin)) return 'Tu Gobierno no es soberanista'; if (rc.indep < conf.umbral) return `Apoyo social insuficiente (${conf.umbral} %+)`; const pr = E.esp.procesos[rc.id]; if (pr.fase !== 'distension' && pr.fase !== 'tension') return 'Ya hay un proceso en curso'; return true; },
    ejecutar(E) { const c = E.jugador.region, conf = D().procesos[c]; C.Territorio.procesFase(E, c, 'unilateral', `El ${conf.organo} aprueba convocar unilateralmente una ${conf.lema}.`); const pr = E.esp.procesos[c]; pr.limite = E.fecha.t + 6; pr.decidir = true; Pj.cambiar(E, { pop: 3, prestigio: 2 }, true); return { ok: true, msg: 'Lanzas el desafío: el Estado deberá responder.' }; }
  });
  A('reclamar_competencia', {
    nombre: 'Reclamar una competencia al Estado', icono: '🏛️', costo: 2, grupo: 'autonomico', desc: 'Presidente/a o consejero/a: pide un escalón más de autogobierno (educación, policía, cercanías, puertos…). El Consejo de Ministros decide.',
    disponible(E) { const J = E.jugador; if (!['presauto', 'consejero'].includes(J.cargo)) return 'Necesitas un cargo de gobierno autonómico'; return true; },
    ejecutar(E, a) {
      const J = E.jugador, rc = rcJ(E), k = a.comp; if (!k || !D().competencias[k]) return { ok: false, msg: 'Elige una competencia' };
      const x = f(E, 'negociacion', 'carisma');
      const r = C.Territorio.pedirComp(E, J.region, k, { tipo: 'ccaa', nombre: D().ccaa[J.region].nombre, pid: J.partido, jugador: true });
      if (r !== true) return { ok: false, msg: r };
      rc.presion[k] = Math.min(0.3, (rc.presion[k] || 0) + 0.05 + 0.08 * x);
      Pj.cambiar(E, { prestigio: 1.2, pop: 0.8 });
      return { ok: true, msg: 'Tu petición llega al orden del día del Consejo de Ministros.' };
    }
  });
  A('ofrecer_comp', {
    nombre: 'Ofrecer un traspaso a una comunidad', icono: '🤲', costo: 2, grupo: 'nacional', desc: 'Presidente/a del Gobierno: cedes una competencia a una comunidad (decreto o ley orgánica) a cambio de apoyos y paz territorial.',
    disponible(E) { return esPM(E) ? true : 'Sólo el presidente/a del Gobierno'; },
    ejecutar(E, a) {
      const c = a.region, k = a.comp; if (!c || !k) return { ok: false, msg: 'Elige comunidad y competencia' };
      const rc = E.esp.ccaa[c]; if (rc.comp[k] >= 2) return { ok: false, msg: 'Ya la tiene transferida' };
      const r = C.Territorio.concederComp(E, c, k);
      Pj.cambiar(E, { prestigio: 1 });
      return { ok: true, msg: r === 'ley' ? 'Remites a las Cortes la ley orgánica de transferencia.' : 'La comisión mixta preparará el traspaso.' };
    }
  });
  A('negociar_financiacion', {
    nombre: 'Negociar la financiación autonómica', icono: '💶', costo: 2, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: pide más cesión de impuestos, un fondo de nivelación o una financiación singular. En régimen foral se negocia el cupo cada cinco años.',
    disponible: presAut,
    ejecutar(E, a) {
      const r = C.Territorio.pedirFin(E, E.jugador.region, a.tipo || 'cesion');
      if (r.ok) { Pj.cambiar(E, { prestigio: r.exito === false ? 0.2 : 1.6, pop: r.exito === false ? 0 : 1 }); }
      return r;
    }
  });
  A('politica_fiscal', {
    nombre: 'Política fiscal propia', icono: '🧾', costo: 1, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: baja o sube tus impuestos. Bajarlos agrada a los votantes pero resta recursos y genera quejas por dumping fiscal.',
    disponible: presAut,
    ejecutar(E, a) {
      const rc = rcJ(E), baja = a.dir !== 'subir';
      if (baja) { rc.gob.aprob = clamp(rc.gob.aprob + 2.2, 5, 90); rc.fin.nivel -= 1.2; rc.relM = clamp(rc.relM - 1, 0, 100); for (const x of Object.keys(E.esp.ccaa)) if (x !== rc.id) E.esp.ccaa[x].agravio += 0.1; Pj.cambiar(E, { pop: 1.5 }); return { ok: true, msg: 'Bajas impuestos: los votantes lo notan, la caja también.' }; }
      rc.gob.aprob = clamp(rc.gob.aprob - 1.6, 5, 90); rc.fin.nivel += 1.6; rc.relM = clamp(rc.relM + 1, 0, 100); Pj.cambiar(E, { prestigio: 0.5 });
      return { ok: true, msg: 'Subes impuestos para financiar tus servicios: protestas, pero más recursos.' };
    }
  });
  A('presupuesto_aut', {
    nombre: 'Elaborar los presupuestos autonómicos', icono: '💶', costo: 2, grupo: 'autonomico', desc: 'Presidente/a: reparte el presupuesto entre las consejerías y decide el déficit. Lo vota el Parlamento regional.',
    disponible(E) { const r = presAut(E); if (r !== true) return r; const p = C.Territorio.presInit(E, E.jugador.region); return p.pendiente ? true : p.tramite ? 'Los presupuestos ya están en el Parlamento' : 'Sólo en octubre, cuando se abre el plazo de presupuestos'; },
    ejecutar(E, a) { const ok = C.Territorio.presPresentar(E, E.jugador.region, a.alloc, +a.def || 0, false); if (!ok) return { ok: false, msg: 'No se pudo presentar' }; Pj.cambiar(E, { prestigio: 1 }); return { ok: true, msg: 'Presentas los presupuestos en el Parlamento autonómico.' }; }
  });
  A('reclamar_fondos', {
    nombre: 'Reclamar más presupuesto para tu consejería', icono: '💰', costo: 2, grupo: 'autonomico', desc: 'Consejero/a: pide al presidente más dinero para tu área (a costa de las demás). Depende de tu prestigio y del peso de tu partido.',
    disponible(E) { const J = E.jugador; if (J.cargo !== 'consejero' || !J.area) return 'Sólo consejeros/as autonómicos/as'; const p = C.Territorio.presInit(E, J.region); return E.fecha.t - ((p.reclamo || {})[J.area] || -99) < 52 ? 'Ya reclamaste fondos este año' : true; },
    ejecutar(E) {
      const J = E.jugador, T = C.Territorio, p = T.presInit(E, J.region), rc = rcJ(E), k = J.area;
      p.reclamo = p.reclamo || {}; p.reclamo[k] = E.fecha.t;
      const peso = (rc.parl.escanos[J.partido] || 0) / D().ccaa[J.region].esc;
      if (U.chance(clamp(0.2 + (J.prestigio - 30) / 150 + peso * 0.5 + f(E, 'negociacion', 'carisma') * 0.2, 0.1, 0.8))) {
        const d = Math.min(3, 1.5 + f(E, 'negociacion', 'carisma') * 2), otros = Object.keys(p.alloc).filter(x => x !== k);
        p.alloc[k] += d; otros.forEach(x => p.alloc[x] -= d / otros.length);
        p.cred[k] += d / 100 * p.total * 0.22; p.off[k] = (p.off[k] || 0) + d * 0.8;
        Pj.cambiar(E, { prestigio: 1.5 }); return { ok: true, msg: `El presidente te concede ${U.d1(d)} puntos más del presupuesto.` };
      }
      Pj.cambiar(E, { prestigio: -0.8 }); return { ok: true, exito: false, msg: 'El presidente no cede: las cuentas están ajustadas.' };
    }
  });
  A('programa_consejeria', {
    nombre: 'Llevar un programa al Consejo de Gobierno', icono: '🏗️', costo: (E, a) => { const pr = a && a.prog && C.Territorio.programa(a.prog); return pr ? pr.pts : 2; }, grupo: 'autonomico',
    desc: 'Construye un hospital o un colegio, refuerza un servicio o propón una ley autonómica de tu área. Necesitas competencias transferidas.',
    disponible(E, a) {
      const J = E.jugador; if (!['consejero', 'presauto'].includes(J.cargo)) return 'Sólo consejeros/as y presidentes/as autonómicos/as';
      if (!(a && a.prog)) return true;
      const pr = C.Territorio.programa(a.prog); if (!pr) return 'Programa desconocido';
      if (J.cargo === 'consejero' && !C.Territorio.infoGrupo(E, J.region, J.area).atoms.includes(pr.area)) return 'Ese programa no es de tu consejería';
      return true;
    },
    ejecutar(E, a) { const J = E.jugador, r = J.cargo === 'consejero' ? C.Territorio.llevarAlConsejo(E, J.region, a.prog) : C.Territorio.iniciarPrograma(E, J.region, a.prog, false); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 0.8, pop: 0.4 }); return r; }
  });
  A('reorganizar_gobierno', {
    nombre: 'Reorganizar el Gobierno (número de consejerías)', icono: '🧩', costo: 2, grupo: 'autonomico', desc: 'Presidente/a: decide cuántas consejerías tiene tu Gobierno (de 7 a 15) y cómo se agrupan las competencias. Tendrás que volver a repartir las carteras.',
    disponible(E) { const r = presAut(E); if (r !== true) return r; const rc = rcJ(E); return E.fecha.t - (rc.reorg || -99) < 52 ? 'Ya reorganizaste el Gobierno hace menos de un año' : true; },
    ejecutar(E, a) { const rc = rcJ(E), n = clamp(Math.round(+a.n || 10), 7, 15); rc.gob.n = n; rc.reorg = E.fecha.t; C.Territorio.repartirConsejerias(E, E.jugador.region); Pj.log(E, `Reorganizas el Gobierno de ${D().ccaa[E.jugador.region].nombre}: ${n} consejerías.`); return { ok: true, msg: `Tu Gobierno pasa a tener ${n} consejerías.` }; }
  });
  A('gestion_consejeria', {
    nombre: 'Gestionar tu consejería', icono: '💼', costo: 2, grupo: 'autonomico', desc: 'Consejero/a: impulsa tu departamento. Cuanto más competencias haya transferido tu área, más margen tienes.',
    disponible(E) { const J = E.jugador; return J.cargo === 'consejero' && J.area ? true : 'Sólo consejeros/as autonómicos/as'; },
    ejecutar(E) {
      const J = E.jugador, rc = rcJ(E), x = f(E, 'gestion', 'negociacion'), niv = C.Territorio.nivelGrupo(E, J.region, J.area);
      const mult = 0.25 + 0.4 * niv;
      C.Territorio.infoGrupo(E, J.region, J.area).atoms.forEach(a => { rc.gestion[a] = clamp(rc.gestion[a] + (4 + 7 * x) * mult, 5, 98); }); rc.gob.aprob = clamp(rc.gob.aprob + 0.25 * mult, 5, 90);
      Pj.cambiar(E, { prestigio: 0.8 + 1.4 * x * mult, pop: 0.6 });
      return { ok: true, msg: niv < 0.6 ? 'Tu consejería tiene pocas competencias: apenas puedes hacer más que coordinar. Reclama traspasos.' : 'Tu departamento mejora y el Gobierno autonómico lo nota.' };
    }
  });
  A('estabilizar_aut', {
    nombre: 'Atar la mayoría del gobierno autonómico', icono: '🧩', costo: 1, grupo: 'autonomico', desc: 'Presidente/a o consejero/a: negocia con tus socios del Gobierno regional y evita una moción de censura.',
    disponible(E) { return ['presauto', 'consejero'].includes(E.jugador.cargo) ? true : 'Necesitas un cargo de gobierno autonómico'; },
    ejecutar(E) { const rc = rcJ(E), x = f(E, 'negociacion', 'carisma'); rc.gob.estab = clamp(rc.gob.estab + 3 + 5 * x, 0, 100); Pj.cambiar(E, { prestigio: 0.6 }); return { ok: true, msg: 'La mayoría del Gobierno regional queda más sólida.' }; }
  });
  A('mocion_aut', {
    nombre: 'Moción de censura en tu comunidad', icono: '⚡', costo: 3, grupo: 'autonomico', desc: 'Líder de la oposición regional: intenta derribar al gobierno autonómico con una mayoría alternativa (constructiva).',
    disponible(E) { const J = E.jugador; if (!J.region || !(J.escReg || J.lidReg === J.region)) return 'Necesitas escaño en el parlamento autonómico'; if (J.rol !== 'lider' && J.lidReg !== J.region && !(E.partidos[J.partido].amb === 'reg' && E.partidos[J.partido].lider === 'J')) return 'Sólo el líder del partido en la comunidad'; const rc = rcJ(E); if (rc.gob.coalicion.includes(J.partido)) return 'Tu partido gobierna'; if (rc.suspendida) return 'La comunidad está intervenida'; if (E.fecha.t - (rc.ultMocion || -99) < 52) return 'Ya hubo una moción reciente'; return true; },
    ejecutar(E) { const J = E.jugador, c = J.region, b = C.Territorio.bloque(E, c, J.partido); const ok = C.Territorio.mocionJugador(E, c); if (ok) { Pj.cambiar(E, { prestigio: 10, pop: 5 }, true); return { ok: true, msg: `¡La moción prospera! Eres presidente/a de ${D().ccaa[c].nombre}.` }; } Pj.cambiar(E, { prestigio: -5, pop: -1 }, true); return { ok: true, exito: false, msg: `La moción fracasa: sólo reúnes ${b.s} de ${b.may} escaños.` }; }
  });
  /* — Ayuntamiento — */
  A('pleno_municipal', {
    nombre: 'Intervenir en el pleno municipal', icono: '🏘️', grupo: 'local', desc: 'Una intervención en el ayuntamiento: gana notoriedad local.',
    disponible: nivelLoc,
    ejecutar(E) {
      const x = f(E, 'oratoria', 'carisma');
      if (U.chance(0.45 + 0.5 * x)) { Pj.cambiar(E, { pop: 1.2 + 1.8 * x, prestigio: 0.7 + 1 * x }); Pj.empuje(E, 0.04); return { ok: true, msg: 'La prensa local recoge tu intervención.' }; }
      Pj.cambiar(E, { pop: -0.2 }); return { ok: true, exito: false, msg: 'Pasa desapercibida.' };
    }
  });
  A('proyecto_urbano', {
    nombre: 'Lanzar un proyecto urbano', icono: '🏗️', costo: 2, grupo: 'local', desc: 'Alcalde/sa: vivienda pública, peatonalización, tranvía, policía local, congresos… Exige pleno, cuesta deuda y tarda semanas en dar frutos.',
    disponible: alcalde,
    ejecutar(E, a) { const r = C.Municipios.lanzarProyecto(E, E.jugador.muni, a.proy); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 1.2, pop: 1 }); return r; }
  });
  A('politica_gasto', {
    nombre: 'Fijar el presupuesto de un área', icono: '📊', costo: 1, grupo: 'local', desc: 'Alcalde/sa: gasto mínimo, normal o alto en una concejalía. Más gasto mejora el indicador y sube la deuda.',
    disponible: alcalde,
    ejecutar(E, a) { const r = C.Municipios.setGasto(E, E.jugador.muni, a.area, +a.nivel); if (r.ok && r.exito !== false) Pj.cambiar(E, { prestigio: 0.4 }); return r; }
  });
  A('politica_ibi', {
    nombre: 'Subir o bajar el IBI y las tasas', icono: '🧾', costo: 1, grupo: 'local', desc: 'Alcalde/sa: más recaudación y menos deuda, o más aprobación a corto plazo.',
    disponible: alcalde,
    ejecutar(E, a) { const r = C.Municipios.setIbi(E, E.jugador.muni, a.dir === 'subir' ? 1 : -1); if (r.ok && r.exito !== false) Pj.cambiar(E, { pop: a.dir === 'subir' ? -0.8 : 1 }); return r; }
  });
  A('fondos_municipales', {
    nombre: 'Pedir fondos a otra administración', icono: '🤲', costo: 2, grupo: 'local', desc: 'Alcalde/sa: pide una subvención a la comunidad, al Estado o a la UE. Depende de si gobierna tu partido allí.',
    disponible: alcalde,
    ejecutar(E, a) { const r = C.Municipios.pedirFondos(E, E.jugador.muni, a.quien || 'ccaa'); if (r.ok && r.exito !== false) { Pj.cambiar(E, { prestigio: 1 }); if (a.quien === 'ue') Pj.cambiar(E, { capEU: 1.5 }); } return r; }
  });
  A('mocion_local', {
    nombre: 'Moción de censura en el ayuntamiento', icono: '⚡', costo: 3, grupo: 'local', desc: 'Cabeza de lista de la oposición: intenta quitar la alcaldía con una mayoría alternativa de concejales.',
    disponible(E) { const J = E.jugador, m = J.muni && E.esp.muni.m[J.muni]; if (!m) return 'Sin ayuntamiento'; if (J.cargo !== 'concejal') return 'Necesitas ser concejal/a en la oposición'; if (J.rol !== 'lider' && !J.cabeza) return 'Sólo el cabeza de lista'; if (m.coal.includes(J.partido)) return 'Tu partido gobierna'; if (E.fecha.t - (m.ultMocion || -99) < 60) return 'Ya hubo una moción reciente'; return true; },
    ejecutar(E) { const r = C.Municipios.mocionJugador(E, E.jugador.muni); if (r.ok) { Pj.cambiar(E, { prestigio: 8, pop: 4 }, true); return { ok: true, msg: '¡Eres el nuevo alcalde/sa!' }; } Pj.cambiar(E, { prestigio: -4 }, true); return { ok: true, exito: false, msg: `La moción fracasa: reúnes ${r.s} de ${r.may} concejales.` }; }
  });
  A('concejalia', {
    nombre: 'Pedir una concejalía de gobierno', icono: '💼', costo: 2, grupo: 'carrera', desc: 'Si tu partido gobierna tu ayuntamiento, pide una concejalía (urbanismo, movilidad, seguridad…) para gestionar con peso.',
    disponible(E) { const J = E.jugador, m = J.muni && E.esp.muni.m[J.muni]; if (!m) return 'Sin ayuntamiento'; if (J.cargo !== 'concejal') return 'Necesitas ser concejal/a'; if (!m.coal.includes(J.partido)) return 'Tu partido no gobierna aquí'; if (J.areaMuni) return 'Ya tienes concejalía'; return true; },
    ejecutar(E, a) {
      const J = E.jugador, m = muJ(E), libres = Object.keys(m.conc).filter(k => m.conc[k] && m.conc[k] !== 'J' && m.conc[k].p === J.partido && k !== 'hac');
      const area = a.area && libres.includes(a.area) ? a.area : libres[0]; if (!area) return { ok: false, msg: 'Tu partido no tiene concejalías libres' };
      if (U.chance(0.5 + f(E, 'negociacion', 'gestion') * 0.3 + J.prestigio / 400)) { m.conc[area] = 'J'; J.areaMuni = area; Pj.log(E, `Eres nombrado/a concejal/a de ${D().concejalias[area].nombre}.`); return { ok: true, msg: `Gestionas ${D().concejalias[area].nombre}.` }; }
      return { ok: true, exito: false, msg: 'El alcalde prefiere otro nombre.' };
    }
  });
  A('gestion_concejalia', {
    nombre: 'Gestionar tu concejalía', icono: '🛠️', costo: 2, grupo: 'local', desc: 'Concejal/a con cartera: mueve el indicador de tu área de la ciudad.',
    disponible(E) { return E.jugador.areaMuni && muJ(E) && muJ(E).conc[E.jugador.areaMuni] === 'J' ? true : 'Necesitas una concejalía de gobierno'; },
    ejecutar(E) { const J = E.jugador, m = muJ(E), x = f(E, 'gestion', 'negociacion'), ind = D().concejalias[J.areaMuni].ind; if (ind !== 'deuda') m.shock[ind] = (m.shock[ind] || 0) + 2 + 3 * x; m.aprob = clamp(m.aprob + 0.3 + 0.5 * x, 10, 90); Pj.cambiar(E, { prestigio: 1 + x, pop: 0.8 }); return { ok: true, msg: 'Tu departamento saca adelante un buen paquete de medidas.' }; }
  });
  A('pacto_municipal', {
    nombre: 'Atar el pacto de gobierno municipal', icono: '🤝', grupo: 'local', desc: 'Alcalde/sa o cabeza de lista: aprueba presupuestos con tus socios y evita una moción.',
    disponible: nivelLoc,
    ejecutar(E) { const m = muJ(E), x = f(E, 'negociacion', 'carisma'); m.aprob = clamp(m.aprob + 0.6 + x, 10, 90); Pj.cambiar(E, { prestigio: 0.8 }); return { ok: true, msg: 'Los presupuestos municipales salen adelante.' }; }
  });
  /* — Ascenso entre niveles — */
  A('cambiar_comunidad', {
    nombre: 'Cambiar de comunidad', icono: '🚚', costo: 3, grupo: 'carrera',
    desc: 'Traslada tu carrera a otra comunidad autónoma donde tu partido tenga presencia. Dejas tus cargos locales o autonómicos actuales; si eres diputado/a conservas el escaño hasta las próximas generales.',
    disponible(E) {
      const J = E.jugador, pa = E.partidos[J.partido];
      if (Pj.esUE(E)) return 'Vuelve primero a la política española';
      if (pa.amb === 'reg') return 'Tu partido sólo se presenta en ' + D().ccaa[pa.region].nombre;
      if (['pm', 'ministro', 'presauto', 'alcalde'].includes(J.cargo)) return 'Debes dejar tu cargo ejecutivo antes de trasladarte';
      if (J.regT != null && E.fecha.t - J.regT < 52) return 'Te trasladaste hace poco: espera unos meses';
      if (J.prestigio < 35) return 'Necesitas prestigio 35+';
      return true;
    },
    ejecutar(E, a) {
      const J = E.jugador, c = a.c, d = D().ccaa[c]; if (!d || c === J.region) return { ok: false, msg: 'Comunidad no válida' };
      const o = Pj.opcionesComunidad(E).find(x => x.c === c); if (!o) return { ok: false, msg: 'Tu partido no tiene presencia allí' };
      J.regT = E.fecha.t;
      if (!U.chance(o.p)) { Pj.cambiar(E, { prestigio: -2 }, true); Pj.log(E, `La dirección regional de ${d.nombre} no te quiere en sus filas.`); return { ok: true, exito: false, msg: 'La dirección de ' + d.nombre + ' rechaza tu llegada.' }; }
      const sentado = J.nivel === 'nacional' && J.electo;
      Pj.mudarRegion(E, c, sentado);
      if (J.aspira && J.aspira.nivel !== 'nacional') J.aspira = null;
      Pj.sincronizar(E);
      Pj.log(E, `Te trasladas a ${d.nombre}${sentado ? ': conservas tu escaño en el Congreso y en las próximas generales irás por ' + D().provincias[J.circNueva][0] : ''}.`);
      return { ok: true, msg: 'Ahora tu carrera está en ' + d.nombre + '.' };
    }
  });
  A('cambiar_provincia', {
    nombre: 'Cambiar de provincia', icono: '🧭', costo: 2, grupo: 'carrera',
    desc: 'Pide a tu partido ir en la lista de otra provincia: más escaños, un feudo más seguro o dar el salto a otra comunidad. Si ya eres diputado/a, el cambio vale desde las próximas generales.',
    disponible(E) {
      const J = E.jugador;
      if (Pj.esUE(E)) return 'Vuelve primero a la política española';
      if (J.prestigio < 30) return 'Necesitas prestigio 30+';
      if (J.circT != null && E.fecha.t - J.circT < 26) return 'Acabas de pedir un cambio de provincia: espera unas semanas';
      return true;
    },
    ejecutar(E, a) {
      const J = E.jugador, prov = a.prov, d = D().provincias[prov]; if (!d) return { ok: false, msg: 'Provincia desconocida' };
      const pa = E.partidos[J.partido];
      if (pa.amb === 'reg' && pa.region !== d[1]) return { ok: false, msg: 'Tu partido sólo se presenta en ' + D().ccaa[pa.region].nombre };
      if ((J.circNueva || J.circ) === prov) return { ok: false, msg: 'Ya vas por esa provincia' };
      const o = Pj.opcionesProvincia(E).find(x => x.prov === prov); if (!o) return { ok: false, msg: 'Tu partido no tiene escaños allí' };
      J.circT = E.fecha.t;
      if (!U.chance(o.p)) { Pj.cambiar(E, { prestigio: -1 }, true); Pj.log(E, `La dirección rechaza que cambies a la lista de ${d[0]}.`); return { ok: true, exito: false, msg: 'La dirección del partido prefiere dejarte donde estás.' }; }
      const sentado = J.electo && J.nivel === 'nacional';
      if (sentado) { J.circNueva = prov; Pj.log(E, `Tu partido acepta que encabeces o integres la lista por ${d[0]} en las próximas generales.`); return { ok: true, msg: `Irás en la lista por ${d[0]} en las próximas generales (conservas tu escaño actual).` }; }
      J.circ = prov; J.circNueva = null; if (J.aspira && J.aspira.nivel === 'nacional') J.aspira.circ = prov;
      Pj.log(E, `Pasas a la lista de ${d[0]}.`); return { ok: true, msg: `Ahora vas por ${d[0]}.` };
    }
  });
  A('aspirar_lista', {
    nombre: 'Pedir un puesto en las listas', icono: '🪜', costo: 2, grupo: 'carrera', desc: 'Aspira a dar el salto a las Cortes: un puesto en la lista de tu partido por una provincia (para la lista autonómica usa «Candidatura autonómica»).',
    disponible(E) {
      const J = E.jugador;
      if (Pj.esUE(E)) return 'Vuelve primero a la política española';
      if (J.aspira) return 'Ya has pedido un puesto';
      if (J.nivel === 'nacional') return 'Ya estás en el nivel nacional';
      if (J.cargo === 'presauto') return 'Presides una comunidad: no puedes dejarla por una lista al Congreso';
      return J.prestigio >= (J.nivel === 'local' ? 28 : 40) ? true : `Necesitas prestigio ${J.nivel === 'local' ? 28 : 40}+`;
    },
    ejecutar(E, a) {
      const J = E.jugador;
      if (a.nivel === 'autonomico') return C.Acciones.get('candidatura_aut').ejecutar(E, { region: J.region, cabeza: false });
      J.circ = a.circ || J.circ || Pj.mejorProvincia(E, J.partido, J.region);
      const x = f(E, 'negociacion', 'carisma');
      if (U.chance(clamp(0.35 + (J.prestigio - 30) / 120 + x * 0.3 + (J.rol === 'direccion' ? 0.15 : 0), 0.2, 0.9))) { J.aspira = { nivel: 'nacional', t: E.fecha.t }; Pj.log(E, `Tu partido te incluirá en la lista a las Cortes por ${D().provincias[J.circ][0]}.`); return { ok: true, msg: 'Figurarás en la lista del partido.' }; }
      return { ok: true, exito: false, msg: 'La dirección te pide esperar.' };
    }
  });
  A('candidatura_aut', {
    nombre: 'Candidatura autonómica', icono: '🗳️', costo: (E, a) => a && a.cabeza ? 3 : 2, grupo: 'carrera',
    desc: 'Lanza tu candidatura a las listas de unas elecciones autonómicas: pide un puesto o disputa la cabeza de lista (candidato/a a la presidencia). Puedes ir por tu comunidad o dar el salto a otra.',
    disponible(E, a) {
      const J = E.jugador;
      if (Pj.esUE(E)) return 'Vuelve primero a la política española';
      if (J.cargo === 'pm') return 'Presides el Gobierno de España';
      if (J.cargo === 'presauto') return 'Ya presides una comunidad';
      if (J.aspira) return 'Ya has pedido un puesto en unas listas';
      if (J.rol === 'lider' && pa(E).amb === 'nac' && J.nivel === 'nacional' && !J.cabeza) return 'Lideras tu partido en toda España: tu sitio es el Congreso';
      if (a && a.region) {
        const o = Pj.opcionesLista(E).find(x => x.c === a.region);
        if (!o) return 'Tu partido no se presenta en esa comunidad';
        if (a.cabeza ? !o.cabeza : !o.puesto) return (a.cabeza ? o.mc : o.mp) || 'No disponible';
        return true;
      }
      return Pj.opcionesLista(E).some(o => o.puesto || o.cabeza) ? true : 'Ahora mismo no hay listas autonómicas abiertas para ti';
    },
    ejecutar(E, a) {
      const J = E.jugador, c = a.region || J.region, cabeza = !!a.cabeza, nom = D().ccaa[c].nombre, rc = E.esp.ccaa[c];
      const when = U.fmtT(rc.parl.proxT);
      if (U.chance(Pj.probLista(E, c, cabeza))) {
        J.aspira = { nivel: 'autonomico', region: c, cabeza, t: E.fecha.t };
        Pj.cambiar(E, { prestigio: cabeza ? 2.5 : 1 }, true);
        Pj.log(E, cabeza ? `Tu partido te elige candidato/a a la presidencia de ${nom} (elecciones el ${when}).` : `Irás en la lista autonómica de ${nom} (elecciones el ${when}).`);
        C.Noticias.poner(E, 'politica', `${J.nombre} (${pa(E).sigla}) será ${cabeza ? 'el/la candidato/a' : 'número de la lista'} por ${nom}.`, 'ES');
        return { ok: true, msg: cabeza ? `Eres el/la candidato/a de ${pa(E).sigla} en ${nom}.` : `Figurarás en la lista de ${nom}.` };
      }
      if (cabeza) { Pj.cambiar(E, { prestigio: -2.5 }, true); return { ok: true, exito: false, msg: `La dirección regional prefiere a otro/a candidato/a en ${nom}.` }; }
      return { ok: true, exito: false, msg: 'La dirección regional te pide esperar.' };
    }
  });
  A('renunciar_cargo', {
    nombre: 'Renunciar a un cargo', icono: '🚪', costo: 0, grupo: 'carrera',
    desc: 'Dimite de un cargo (presidencia, cartera, consejería, alcaldía o escaño). Cuesta prestigio y popularidad, pero te libera para dar otro paso.',
    disponible(E) { return Pj.esUE(E) ? 'Vuelve primero a la política española' : Pj.cargosRenunciables(E).length ? true : 'No ocupas ningún cargo al que renunciar'; },
    ejecutar(E, a) { return Pj.renunciarCargo(E, a.k); }
  });
  A('renunciar_lista', {
    nombre: 'Renunciar a la candidatura', icono: '🚪', costo: 0, grupo: 'carrera', desc: 'Retira tu nombre de las listas por las que has pedido concurrir.',
    disponible(E) { return E.jugador.aspira ? true : 'No has pedido ningún puesto en listas'; },
    ejecutar(E) { const J = E.jugador, a = J.aspira; J.aspira = null; if (a && a.cabeza) Pj.cambiar(E, { prestigio: -1.5 }, true); Pj.log(E, 'Renuncias a figurar en las listas.'); return { ok: true, msg: 'Retiras tu candidatura.' }; }
  });
  A('consejeria', {
    nombre: 'Aspirar a una consejería autonómica', icono: '💼', costo: 2, grupo: 'carrera', desc: 'Si tu partido está en el Gobierno de tu comunidad, puedes entrar como consejero/a de un área (sanidad, educación, interior…). Su peso depende de las competencias transferidas.',
    disponible(E) { const J = E.jugador, rc = J.region && E.esp.ccaa[J.region]; if (!rc || !rc.gob) return 'Sin gobierno autonómico'; if (!rc.gob.coalicion.includes(J.partido)) return 'Tu partido no está en el Gobierno autonómico'; if (J.nivel === 'nacional') return 'Ya estás en el nivel nacional'; if (!C.Territorio.areasDe(E, J.region, J.partido).length && J.consejeria !== J.region) return 'Tu partido no tiene consejerías libres'; return J.prestigio >= 35 ? true : 'Necesitas prestigio 35+'; },
    ejecutar(E, a) {
      const J = E.jugador, T = C.Territorio, libres = T.areasDe(E, J.region, J.partido), area = a.area || libres[0];
      if (!area || !D().consejerias[area]) return { ok: false, msg: 'Elige una consejería' };
      if (!libres.includes(area) && !(J.consejeria === J.region && J.area !== area)) return { ok: false, msg: 'Esa consejería no es de tu partido' };
      if (U.chance(0.5 + f(E, 'negociacion', 'gestion') * 0.3 + (area === 'pre' ? -0.3 : 0))) { T.tomarConsejeria(E, J.region, area); if (J.nivel === 'local') { Pj.dejar(E, 'local'); J.nivel = 'autonomico'; } Pj.sincronizar(E); return { ok: true, msg: `Entras en el Gobierno autonómico como consejero/a de ${D().consejerias[area].nombre}.` }; }
      return { ok: true, exito: false, msg: 'El presidente prefiere otro nombre.' };
    }
  });
  /* — Partido — */
  A('recorrer_bases', {
    nombre: 'Recorrer las agrupaciones locales', icono: '🚌', grupo: 'partido', desc: 'Visitas a militantes y sedes: prestigio interno, cohesión y militancia.',
    ejecutar(E) {
      const x = f(E, 'carisma', 'gestion'), p = pa(E);
      Pj.cambiar(E, { prestigio: 1.0 + 1.5 * x, pop: 0.4 }); p.cohesion = clamp(p.cohesion + 0.5, 20, 99); p.militantes += U.ri(80, 400); Pj.empuje(E, 0.03);
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
      if (U.chance(p)) { J.rol = r === 'base' ? 'portavoz' : 'direccion'; Pj.log(E, `Eres nombrado/a ${D().rolesPartido[J.rol].nombre}.`); Pj.cambiar(E, { prestigio: 3 }, true); Pj.ministroSiProcede(E); Pj.sincronizar(E); return { ok: true, msg: `Ahora eres ${D().rolesPartido[J.rol].nombre}.` }; }
      Pj.cambiar(E, { prestigio: -1 }); return { ok: true, exito: false, msg: 'La ejecutiva prefiere otro nombre por ahora.' };
    }
  });
  A('desafiar_lider', {
    nombre: 'Desafiar al líder del partido', icono: '⚔️', costo: 3, grupo: 'partido', desc: 'Primarias o congreso federal: si ganas, diriges el partido (y quizá el Gobierno).',
    disponible(E) { const J = E.jugador; if (Pj.esUE(E)) return 'Vuelve primero a la política española'; if (J.rol === 'lider') return 'Ya eres el líder'; if (J.rol !== 'direccion' && !(J.rol === 'portavoz' && J.prestigio > 65)) return 'Necesitas estar en la dirección del partido'; if (J.prestigio < 55) return 'Necesitas prestigio 55+'; return true; },
    ejecutar(E) {
      const J = E.jugador, p = pa(E), g = gob(E), viejo = E.politicos[p.lider];
      const debilidad = (p.cohesion < 60 ? 0.12 : 0) + ((p.popN || p.pop) < p.base * 0.95 ? 0.1 : 0) + (g.partido === p.id && g.aprob < 35 ? 0.1 : 0);
      const pr = clamp(0.12 + (J.prestigio - 55) / 100 + f(E, 'carisma', 'negociacion') * 0.25 + debilidad - (viejo ? viejo.a / 600 : 0), 0.05, 0.85);
      if (U.chance(pr)) {
        if (viejo && viejo.id !== 'J') { const ix = E.parl.miembros.indexOf(viejo.id); if (ix >= 0) E.parl.miembros[ix] = E.parl.miembros.includes('J') ? C.Congreso.nuevoDiputado(E, p.id, viejo.prov).id : E.parl.miembros[ix]; if (ix < 0 || E.parl.miembros[ix] !== viejo.id) delete E.politicos[viejo.id]; }
        p.lider = 'J'; J.rol = 'lider'; if (g.partido === p.id) g.pm = 'J';
        Pj.cambiar(E, { prestigio: 8, pop: 3 }, true);
        C.Noticias.poner(E, 'partido', `${J.nombre} gana el liderazgo de ${p.nombre}.`, 'ES');
        Pj.log(E, `Ganas el congreso y te conviertes en líder de ${p.nombre}.`);
        if (g.partido === p.id) C.Ejecutivo.repartirMinisterios(E); else Pj.ministroSiProcede(E);
        Pj.sincronizar(E);
        return { ok: true, msg: '¡Ganas el liderazgo del partido!' };
      }
      p.cohesion = clamp(p.cohesion - 5, 20, 99); Pj.cambiar(E, { prestigio: -8, pop: -1 }, true); J.rol = J.rol === 'portavoz' ? 'base' : (J.rol === 'direccion' && U.chance(0.4) ? 'portavoz' : J.rol);
      return { ok: true, exito: false, msg: 'Pierdes el congreso; tu posición interna queda dañada.' };
    }
  });
  A('liderar_region', {
    nombre: 'Liderar el partido en tu comunidad', icono: '📍', costo: 2, grupo: 'partido', desc: 'Conviértete en cabeza de lista y presidente/a regional del partido en tu comunidad.',
    disponible(E) { const J = E.jugador; if (E.partidos[J.partido].amb !== 'nac') return 'Tu partido es regional: lo lidera su líder'; if (!J.region) return 'Sin comunidad'; if (J.lidReg === J.region) return 'Ya lideras el partido allí'; if (J.rol === 'lider') return 'Ya lideras el partido a nivel nacional'; return J.prestigio >= 38 ? true : 'Necesitas prestigio 38+'; },
    ejecutar(E) {
      const J = E.jugador, rc = rcJ(E);
      if (U.chance(clamp(0.3 + (J.prestigio - 38) / 100 + f(E, 'carisma', 'negociacion') * 0.3, 0.15, 0.85))) {
        rc.cab[J.partido] = 'J'; J.lidReg = J.region; if (rc.gob && rc.gob.partido === J.partido) rc.gob.pres = 'J';
        Pj.cambiar(E, { prestigio: 5 }, true); Pj.sincronizar(E); Pj.log(E, `Eres elegido/a presidente/a regional de tu partido en ${D().ccaa[J.region].nombre}.`);
        return { ok: true, msg: 'Lideras el partido en tu comunidad.' };
      }
      Pj.cambiar(E, { prestigio: -3 }, true); return { ok: true, exito: false, msg: 'Pierdes el congreso regional.' };
    }
  });
  /* — Medios y campaña — */
  A('entrevista', {
    nombre: 'Conceder una entrevista', icono: '📺', grupo: 'medios', desc: 'Notoriedad a cambio de riesgo de titulares incómodos.',
    ejecutar(E) {
      const x = f(E, 'carisma', 'oratoria');
      if (U.chance(0.12 + (1 - x) * 0.18)) { Pj.cambiar(E, { pop: -1.5, prestigio: -1 }); return { ok: true, exito: false, msg: 'Un desliz en directo se hace viral.' }; }
      Pj.cambiar(E, { pop: 1.2 + 2 * x, prestigio: 0.3 }); Pj.empuje(E, 0.02 + x * 0.04);
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
  /* ── Campaña de las generales ── */
  const enCamp = E => { const J = E.jugador; if (Pj.esUE(E)) return 'Vuelve primero a la política española'; return C.Campana.activa(E) ? true : 'Sólo durante la campaña de unas generales'; };
  A('mitin_prov', {
    nombre: 'Mitin en una provincia', icono: '📣', costo: 1, grupo: 'campana', desc: 'Campaña de las generales: un acto en una provincia concreta. Funciona mejor donde se juega el último escaño.',
    disponible: enCamp,
    ejecutar(E, a) { const r = C.Campana.mitinProv(E, a.prov); if (r.ok) Pj.empuje(E, 0.03, 0.1, true); return r; }
  });
  A('gasto_campana', {
    nombre: 'Gastar en campaña', icono: '💶', costo: 1, grupo: 'campana', desc: 'Campaña de las generales: televisión, redes, carteles o aparato local con el presupuesto del partido (tope legal de 90 M€).',
    disponible: enCamp,
    ejecutar(E, a) { return C.Campana.gastar(E, a.canal, a.prov); }
  });
  A('encargar_encuesta', {
    nombre: 'Encargar una encuesta', icono: '📊', costo: 1, grupo: 'campana', desc: 'Una encuesta propia (la más fiable, con detalle por provincias) o el sondeo de un medio.',
    disponible: enCamp,
    ejecutar(E, a) { return C.Campana.encargar(E, a.tipo); }
  });
  A('movilizar_votantes', {
    nombre: 'Campaña de movilización', icono: '🗳️', costo: 1, grupo: 'campana', desc: 'Gasta 4 M€ en que tus votantes acudan a votar (más participación de los tuyos).',
    disponible: enCamp,
    ejecutar(E) { return C.Campana.movilizar(E); }
  });
  A('apelar_voto_util', {
    nombre: 'Apelar al voto útil', icono: '🎯', costo: 1, grupo: 'campana', desc: 'Pide a los votantes de partidos pequeños que concentren el voto en ti. Sólo rinde si eres de los dos primeros.',
    disponible: enCamp,
    ejecutar(E) { return C.Campana.votoUtil(E); }
  });
  A('coalicion_pre', {
    nombre: 'Coalición preelectoral', icono: '🤝', costo: 2, grupo: 'campana', desc: 'Concurrir juntos con otro partido (listas conjuntas): se suman votos con una fuga del 7 %. Hay que cerrarla antes de que se cierren las listas.',
    disponible(E) { const r = enCamp(E); if (r !== true) return r; return C.Campana.listasAbiertas(E) ? true : 'Las listas ya están cerradas'; },
    ejecutar(E, a) { return C.Campana.pactarCoalicion(E, a.pid); }
  });
  A('credito_campana', {
    nombre: 'Pedir un crédito de campaña', icono: '🏦', costo: 0, grupo: 'campana', desc: 'Suma 30 M€ al presupuesto; lo pagarás con las finanzas del partido.',
    disponible: enCamp,
    ejecutar(E) { return C.Campana.credito(E); }
  });
  A('primarias_lista', {
    nombre: 'Primarias: disputar la cabeza de lista', icono: '🗳️', costo: 2, grupo: 'carrera', desc: 'Compite en las primarias de tu partido por encabezar la lista de tu provincia en las próximas generales.',
    disponible(E) {
      const J = E.jugador; if (Pj.esUE(E)) return 'Vuelve primero a la política española';
      if (J.rol === 'lider') return 'Ya eres el cabeza de lista nacional';
      if (!C.Campana.listasAbiertas(E)) return 'Las listas ya están cerradas';
      if (J.prestigio < 35) return 'Necesitas prestigio 35+';
      if (J.primT != null && E.fecha.t - J.primT < 40) return 'Ya concurriste a unas primarias hace poco';
      if (E.partidos[J.partido].amb === 'reg' && D().provincias[J.circ || Pj.mejorProvincia(E, J.partido, J.region)][1] !== E.partidos[J.partido].region) return 'Tu partido sólo presenta listas en su territorio';
      return true;
    },
    ejecutar(E) {
      const J = E.jugador, circ = J.circ || Pj.mejorProvincia(E, J.partido, J.region), pa = E.partidos[J.partido];
      const p = clamp(0.2 + (J.prestigio - 35) / 120 + f(E, 'carisma', 'negociacion') * 0.3 + (({ direccion: 0.15, portavoz: 0.08 })[J.rol] || 0), 0.07, 0.8) - (pa.cohesion < 45 ? 0 : 0.03);
      J.primT = E.fecha.t;
      if (U.chance(p)) { J.cabezaLista = circ; Pj.cambiar(E, { prestigio: 3, pop: 1.5 }, true); Pj.log(E, `Ganas las primarias: serás cabeza de lista por ${D().provincias[circ][0]}.`); return { ok: true, msg: `Ganas las primarias: encabezarás la lista por ${D().provincias[circ][0]}.` }; }
      Pj.cambiar(E, { prestigio: -2 }, true); Pj.log(E, 'Pierdes las primarias de tu provincia.'); return { ok: true, exito: false, msg: 'Pierdes las primarias: la militancia prefiere a otro candidato.' };
    }
  });
  A('mitin', {
    nombre: 'Mitin de campaña', icono: '📣', costo: 2, grupo: 'campana', desc: 'Sólo en campaña (generales, autonómicas o municipales): mueve votos hacia tu partido.',
    disponible(E) { return E.jugador.campania ? true : 'Sólo disponible en las semanas previas a unas elecciones de tu nivel'; },
    ejecutar(E) {
      const J = E.jugador, x = f(E, 'carisma', 'oratoria');
      J.campania.pts += 3 + 4 * x; J.campania.mitines++; Pj.cambiar(E, { pop: 0.8 });
      Pj.empuje(E, 0.05 + x * 0.08, 0.1, true);
      return { ok: true, msg: 'El mitin llena el pabellón.' };
    }
  });
  A('pactar_listas', {
    nombre: 'Tantear pactos postelectorales', icono: '🧩', grupo: 'campana', desc: 'Sondea con otros partidos la formación de gobierno: mejora tus opciones de pacto y tu imagen de moderación.',
    disponible(E) { return E.jugador.rol === 'lider' || E.jugador.rol === 'direccion' ? true : 'Sólo líderes o dirección'; },
    ejecutar(E) { const x = f(E, 'negociacion', 'carisma'); Pj.cambiar(E, { prestigio: 0.8 + x }); pa(E).cohesion = clamp(pa(E).cohesion + 0.3, 20, 99); return { ok: true, msg: 'Los contactos discretos allanan un posible pacto.' }; }
  });

  C.Personaje = Pj;
  C.Tiempo.registrar('personaje', { turno: Pj.turno }, 3);
  C.Tiempo.registrar('personaje_init', { init: Pj.init }, 60);
})(window.ESP);

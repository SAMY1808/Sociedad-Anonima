/* Políticos: biografías (pasado, rasgos, amistades y enemistades), fichajes y tránsfugas, escisiones y expresidentes con influencia.
   Estado: E.esp.pers = { ult, hist[], exlider:{pid:{id, t}} }; cada político guarda su bio en E.politicos[id].bio. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const PROFES = ['abogado/a del Estado', 'profesor/a universitario/a', 'economista', 'periodista', 'médico/a', 'sindicalista', 'ingeniero/a', 'empresario/a', 'inspector/a de Hacienda', 'funcionario/a de carrera', 'notario/a', 'trabajador/a social', 'militar retirado/a', 'diplomático/a'];
  const HITOS = ['alcalde/sa de un pueblo de montaña', 'concejal/a durante doce años', 'asesor/a de un ministro', 'portavoz en el Parlamento regional', 'jefe/a de gabinete de un presidente autonómico', 'secretario/a de organización', 'número dos en la lista autonómica', 'eurodiputado/a', 'senador/a por designación', 'director/a general de un organismo'];
  const PASADOS = [['una investigación archivada por un contrato de su etapa municipal', 0.5], ['una polémica por declaraciones antiguas en redes sociales', 0.3], ['un conflicto laboral con su antiguo equipo', 0.25], ['una sociedad familiar que reaparece en los medios', 0.45], ['un pleito por unos terrenos heredados', 0.35], ['un expediente disciplinario de su etapa profesional', 0.4], [null, 0], [null, 0], [null, 0]];
  const hash = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const Pe = C.Personas = {
    asegurar(E) { if (!E.esp.pers) E.esp.pers = { ult: -99, hist: [], exlider: {} }; return E.esp.pers; },
    rasgos(p) { const r = []; if (p.a > 72) r.push('ambicioso/a'); if (p.a < 30) r.push('poco ambicioso/a'); if (p.c > 68) r.push('carismático/a'); if (p.c < 32) r.push('gris'); if (p.i > 75) r.push('íntegro/a'); if (p.i < 38) r.push('de moral flexible'); if (p.pr > 70) r.push('pragmático/a'); if (p.pr < 30) r.push('ideológico/a'); if (p.d > 82) r.push('disciplinado/a'); if (p.d < 45) r.push('díscolo/a'); return r.slice(0, 4); },
    bio(E, id) {
      const p = E.politicos[id]; if (!p) return null; if (p.bio) return p.bio;
      const r = rng(hash(id + E.meta.semilla)), pick = a => a[Math.floor(r() * a.length)], ids = Object.keys(E.politicos).filter(x => x !== id && E.politicos[x].pais === p.pais);
      const ami = ids.length ? pick(ids) : null, ene = ids.length ? pick(ids.filter(x => x !== ami)) : null, pas = pick(PASADOS);
      return p.bio = { edad: p.e, prof: pick(PROFES), hito: pick(HITOS), ami, ene, pasado: pas[0], gravPasado: pas[1], resurgido: false, anos: Math.round(2 + r() * 22) };
    },
    /* Políticos relevantes que se pueden consultar. */
    relevantes(E) {
      const P = E.paises.ES, g = P.gob, out = []; const add = id => { if (id && id !== 'J' && E.politicos[id] && !out.includes(id)) out.push(id); };
      add(g.pm); Object.values(g.ministros).forEach(add); P.partidos.forEach(k => add(E.partidos[k].lider));
      for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.gob) add(rc.gob.pres); }
      return out;
    },
    cargoTxt(E, id) {
      const g = E.paises.ES.gob, p = E.politicos[id]; if (g.pm === id) return 'Presidente/a del Gobierno'; for (const m in g.ministros) if (g.ministros[m] === id) return 'Ministro/a de ' + (((C.DATA.ministerios || []).find(x => x.id === m) || {}).nombre || m);
      for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.gob && rc.gob.pres === id) return 'Presidente/a de ' + C.DATA.ccaa[c].nombre; }
      if (E.partidos[p.p] && E.partidos[p.p].lider === id) return 'Líder de ' + E.partidos[p.p].sigla; return p.cargo || 'Político/a';
    },
    mover(E, id, pid, motivo) {
      const P = E.paises.ES, p = E.politicos[id]; if (!p || !E.partidos[pid] || p.p === pid) return false; const viejo = p.p;
      P.escanos[viejo] = Math.max(0, (P.escanos[viejo] || 0) - 1); P.escanos[pid] = (P.escanos[pid] || 0) + 1; p.p = pid;
      C.Noticias.poner(E, 'politica', `${p.n} abandona ${E.partidos[viejo].sigla} y se incorpora a ${E.partidos[pid].sigla}${motivo ? ' (' + motivo + ')' : ''}.`, 'ES');
      const pe = Pe.asegurar(E); pe.hist.unshift({ t: E.fecha.t, txt: `${p.n}: ${E.partidos[viejo].sigla} → ${E.partidos[pid].sigla}` }); if (pe.hist.length > 20) pe.hist.length = 20; pe.ult = E.fecha.t; return true;
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const pe = Pe.asegurar(E), P = E.paises.ES, g = P.gob, t = E.fecha.t;
      // Un pasado que reaparece
      if (U.chance(0.012)) { const id = U.pick(Pe.relevantes(E)), b = id && Pe.bio(E, id); if (b && b.pasado && !b.resurgido) { b.resurgido = true; const p = E.politicos[id], pa = E.partidos[p.p]; C.Noticias.poner(E, 'politica', `Reaparece ${b.pasado} de ${p.n} (${pa.sigla}).`, 'ES'); if (C.Corrupcion) C.Corrupcion.sube(E, p.p, 4 + b.gravPasado * 12); if (p.p === g.partido) g.aprob = clamp(g.aprob - b.gravPasado * 1.2, 5, 90); pe.hist.unshift({ t, txt: `Pasado de ${p.n}: ${b.pasado}.` }); } }
      // Tránsfugas y escisiones
      if (t - pe.ult > 26 && U.chance(0.006)) {
        const orig = P.partidos.filter(k => E.partidos[k].amb === 'nac' && (P.escanos[k] || 0) > 12 && E.partidos[k].cohesion < 60 && k !== J.partido).sort((a, b) => E.partidos[a].cohesion - E.partidos[b].cohesion)[0];
        if (orig) {
          const dest = P.partidos.filter(k => k !== orig && k !== J.partido && (P.escanos[k] || 0) > 5).sort((a, b) => C.Ejecutivo.afinidad(E, orig, b) - C.Ejecutivo.afinidad(E, orig, a))[0];
          const cand = E.parl.miembros.filter(id => E.politicos[id] && E.politicos[id].p === orig && id !== 'J');
          if (dest && cand.length > 3) { const n = E.partidos[orig].cohesion < 40 && U.chance(0.4) ? U.ri(2, 4) : 1; for (let i = 0; i < n; i++) Pe.mover(E, cand.splice(U.ri(0, cand.length - 1), 1)[0], dest, n > 1 ? 'escisión' : 'tránsfuga'); E.partidos[orig].cohesion = clamp(E.partidos[orig].cohesion - 3 * n, 15, 99); }
        }
      }
      // Expresidentes con influencia
      for (const k in pe.exlider) { const x = pe.exlider[k], pol = E.politicos[x.id]; if (!pol || !U.chance(0.015)) continue; const pa = E.partidos[k]; const amigo = pol.rel >= 0 && U.chance(0.5);
        if (amigo) { pa.cohesion = clamp(pa.cohesion + 1.5, 15, 99); C.Noticias.poner(E, 'politica', `${pol.n} respalda públicamente la dirección de ${pa.sigla}.`, 'ES'); } else { pa.cohesion = clamp(pa.cohesion - 2.5, 15, 99); C.Noticias.poner(E, 'politica', `${pol.n}, expresidente/a de ${pa.sigla}, critica a la dirección actual.`, 'ES'); } }
    },
    fichar(E, id) {
      const J = E.jugador, p = E.politicos[id]; if (!p || p.p === J.partido || !E.parl.miembros.includes(id)) return { ok: false, msg: 'Ese diputado no puede ser fichado' };
      if (J.rol !== 'lider' && J.rol !== 'direccion') return { ok: false, msg: 'Necesitas peso en la dirección de tu partido' };
      const o = (J.atrib.negociacion + J.atrib.carisma) / 20, pr = clamp(0.12 + o * 0.35 + (E.politicos[id].d < 50 ? 0.2 : 0) - (p.d > 80 ? 0.15 : 0) + (E.partidos[p.p].cohesion < 50 ? 0.1 : 0), 0.04, 0.8);
      if (U.chance(pr)) { Pe.mover(E, id, J.partido, 'fichaje'); C.Personaje.cambiar(E, { prestigio: 1.2 }); return { ok: true, msg: `${p.n} se une a tu partido.` }; }
      C.Personaje.cambiar(E, { prestigio: -0.5 }); E.partidos[p.p].cohesion = clamp(E.partidos[p.p].cohesion + 1, 15, 99); return { ok: true, exito: false, msg: `${p.n} rechaza el cambio y tu intento sale en prensa.` };
    }
  };
  // Memoria de los líderes salientes
  const nl = C.Ejecutivo.nuevoLider; C.Ejecutivo.nuevoLider = function (E, pid, motivo) { const pa = E.partidos[pid], viejo = pa && pa.lider; const r = nl.apply(this, arguments); if (viejo && viejo !== 'J' && E.politicos[viejo] && pa.lider !== viejo && E.esp) { Pe.asegurar(E).exlider[pid] = { id: viejo, t: E.fecha.t }; } return r; };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 2, grupo: 'partido' }, o));
  R({ id: 'fichar_diputado', nombre: 'Fichar a un diputado rival', icono: '🧲', desc: 'Intenta que un diputado de otro partido pase al tuyo: sube tu grupo y debilita al rival, o se te vuelve en contra.', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España', ejecutar: (E, a) => Pe.fichar(E, a.id) });
  C.Tiempo.registrar('personas', { turno: Pe.turno }, 47);
})(window.ESP);

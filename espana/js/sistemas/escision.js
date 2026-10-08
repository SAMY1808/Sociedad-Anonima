/* Presión por un congreso extraordinario y escisiones nacionales: críticos que rompen el partido, barones empujados a la ruptura
   y la posibilidad de liderar tú mismo una escisión. Estado: E.esp.pint.cong.presion (0-100) y E.esp.esn[] (escisiones nacionales). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const BLOQUEO = ['pm', 'ministro', 'vicepres', 'presauto', 'presCom', 'mep', 'comisario', 'presCE', 'presPE'];
  const Es = C.Escision = {
    asegurar(E) { const c = C.PartidoInt.asegurar(E).cong; if (c.presion == null) c.presion = 5; if (!E.esp.esn) E.esp.esn = []; return c; },
    esLider(E) { return E.partidos[E.jugador.partido].lider === 'J'; },
    /* Crea un partido nacional escindido del partido `old`. lider: 'J' | null (nuevo político). */
    fundarNacional(E, o) {
      const P = E.paises.ES, J = E.jugador, old = E.partidos[o.old]; if (!old || old.amb !== 'nac') return null; if ((E.esp.esn || []).some(x => x.de === o.old && E.fecha.t - x.t < 60)) return null; const f = clamp(o.fuerza || 0.5, 0.2, 1);
      const n = (E.esp.esn || (E.esp.esn = [])).length, ini = old.nombre.split(/\s+/).filter(w => w.length > 3).map(w => w[0].toUpperCase()).join('').slice(0, 2) || old.sigla[0];
      let sigla; for (let i = 0; i < 20; i++) { sigla = (ini + U.pick(['N', 'R', 'A', 'V', 'C', 'P'])).slice(0, 3) + (i > 3 ? i : ''); if (!P.partidos.some(k => E.partidos[k].sigla === sigla)) break; }
      const nombre = U.pick(['Nueva ' + old.nombre.split(/\s+/).slice(-1)[0], 'Plataforma Crítica', 'Alternativa Renovada', 'Unión por el Cambio', 'Movimiento Refundador']), pid = 'ES_SP' + sigla + n;
      const share = Math.min(old.pop * (0.1 + 0.25 * f), old.pop * 0.45);
      const pa = { id: pid, pais: 'ES', nombre, sigla, arq: old.arq, color: '#' + ((parseInt(String(old.color).slice(1), 16) ^ 0x2f4a63) & 0xffffff).toString(16).padStart(6, '0'), eco: clamp(old.eco + U.ri(-12, 12), -100, 100), soc: clamp(old.soc + U.ri(-12, 12), -100, 100), eu: clamp(old.eu + U.ri(-10, 10), -100, 100), ter: old.ter, indep: 0, grupo: old.grupo, amb: 'nac', region: null, pop: share, base: share, popN: 0, cohesion: 78, finanzas: 30, militantes: Math.round(old.militantes * 0.15 * f) + 800, lider: null, nuevo: true };
      E.partidos[pid] = pa; P.partidos.push(pid); E.esp.nacionales.push(pid); old.pop = Math.max(0.5, old.pop - share); old.base = Math.max(0.5, old.base - share * 0.8);
      if (C.Campana && C.Campana.registrar) C.Campana.registrar(E, pid);
      for (const prov in D().provincias) E.esp.pn[prov][pid] = 1;
      let lid; if (o.lider === 'J') { lid = E.politicos.J; pa.lider = 'J'; } else { lid = C.Mundo.politico(E, { pais: 'ES', partido: pid, eco: pa.eco, soc: pa.soc, eu: pa.eu, e: U.ri(44, 60), c: U.gauss(66, 12), a: 90 }); pa.lider = lid.id; }
      // diputados que se van
      const seats = P.escanos[o.old] || 0, cand = E.parl.miembros.filter(id => id !== 'J' && E.politicos[id] && E.politicos[id].p === o.old && id !== old.lider), nd = Math.min(cand.length, Math.round(seats * (0.08 + 0.3 * f))); let dip = 0;
      for (let i = 0; i < nd; i++) if (C.Personas.mover(E, cand.splice(U.ri(0, cand.length - 1), 1)[0], pid, 'escisión')) dip++;
      old.cohesion = clamp(old.cohesion - 7 * f, 15, 99); if (C.PartidoInt && o.old === J.partido) { const pi = C.PartidoInt.asegurar(E); pi.fac.critico = clamp(pi.fac.critico * 0.5, 5, 60); pi.fac.oficial = 100 - pi.fac.barones - pi.fac.critico; }
      if (C.Mayorias) C.Mayorias.cambiarRel(E, pid, o.lider === 'J' ? 0 : -30 - 0);
      E.esp.esn.unshift({ t: E.fecha.t, pid, de: o.old, lider: lid.n, dip, jugador: o.lider === 'J', motivo: o.motivo || '' }); if (E.esp.esn.length > 12) E.esp.esn.length = 12;
      C.Noticias.poner(E, 'partido', `ESCISIÓN en ${old.sigla}: ${lid.n} funda «${nombre}»${dip ? ` y se lleva a ${dip} diputado(s)` : ''}.`, 'ES');
      return { pid, dip, nombre, lid };
    },
    /* El jugador encabeza la escisión. */
    liderar(E) {
      const J = E.jugador, c = Es.asegurar(E), pa = E.partidos[J.partido], pi = C.PartidoInt.asegurar(E);
      if (J.pais !== 'ES') return { ok: false, msg: 'Sólo en España' }; if (Es.esLider(E)) return { ok: false, msg: 'Eres el líder: no puedes escindirte de ti mismo' };
      if (BLOQUEO.includes(J.cargo)) return { ok: false, msg: 'Debes dejar tu cargo institucional antes de romper con el partido' };
      if (pa.amb !== 'nac') return { ok: false, msg: 'Sólo puedes escindirte de un partido nacional' };
      if (E.esp.cortes.estado !== 'activa' || (C.Campana && C.Campana.activa(E))) return { ok: false, msg: 'No es momento: hay campaña o las Cortes están disueltas' };
      if ((E.esp.esn || []).some(x => x.de === J.partido && E.fecha.t - x.t < 60)) return { ok: false, msg: 'Tu partido ya ha sufrido una escisión reciente: espera a que se calmen las aguas' };
      if (pi.fac.critico < 20 && pa.cohesion > 60) return { ok: false, msg: 'Aún no hay malestar suficiente para arrastrar a una parte del partido' };
      const f = clamp(pi.fac.critico / 45 + (J.prestigio - 40) / 100 + (J.atrib.carisma - 3) * 0.04, 0.25, 1), old = J.partido;
      const r = Es.fundarNacional(E, { old, fuerza: f, lider: 'J', motivo: 'liderada por ' + J.nombre }); if (!r) return { ok: false, msg: 'No se pudo fundar el partido' };
      // El jugador cambia de partido
      const J2 = E.politicos.J; if (J2) { if (E.parl.miembros.includes('J')) { const P = E.paises.ES; P.escanos[old] = Math.max(0, (P.escanos[old] || 0) - 1); P.escanos[r.pid] = (P.escanos[r.pid] || 0) + 1; } J2.p = r.pid; }
      J.partido = r.pid; J.rol = 'lider'; J.hitos = J.hitos || {}; J.hitos.lider = true; J.ministerio = null;
      C.Personaje.cambiar(E, { prestigio: 3 * f - 2, pop: -1 + f }, true); C.Personaje.log(E, `Rompes con ${pa.sigla} y fundas «${r.nombre}».`); if (C.Barones) C.Barones.asegurar(E).b = {}; if (C.Nemesis) { const s = C.Nemesis.asegurar(E); s.pid = null; s.id = null; }
      if (C.Mayorias) { C.Mayorias.cambiarRel(E, old, -35); } const pi2 = C.PartidoInt.asegurar(E); pi2.cong.prox = E.fecha.t + U.ri(150, 220); pi2.cong.fase = null; pi2.cong.cand = null; pi2.cong.retador = null; pi2.cong.presion = 5; pi2.fac = { oficial: 70, critico: 14, barones: 16 };
      C.Personaje.sincronizar(E); if (C.Dilemas) C.Dilemas.registrar(E, 'escision', `Lideras la escisión de ${pa.sigla}: nace «${r.nombre}»`, Math.round((f * 4 - 1.5) * 10) / 10);
      return { ok: true, msg: `Fundas «${r.nombre}» con ${r.dip} diputado(s): ahora lideras tu propio partido.` };
    },
    /* Empuja a un barón de tu partido hacia la ruptura. */
    empujarBaron(E, c) {
      const J = E.jugador, B = C.Barones; if (!B) return { ok: false, msg: 'Sin barones' }; const lista = B.lista(E), x = lista.find(y => y.c === c); if (!x) return { ok: false, msg: 'Ese territorio no tiene un barón de tu partido' };
      if (Es.esLider(E)) return { ok: false, msg: 'Eres el líder: tú no empujas a la ruptura, la evitas' };
      const b = x.b, a = J.atrib; b.leal = clamp(b.leal - (14 + (a.carisma + a.negociacion) / 2 * 1.5), 0, 100); b.amb = clamp(b.amb + 6, 0, 100);
      if (b.leal < 25 && U.chance(clamp(0.3 + (25 - b.leal) / 50 + b.amb / 300, 0.25, 0.9))) { const r = B.fundar(E, c, U.rf(0.5, 1)); if (r) { C.Personaje.cambiar(E, { prestigio: -0.5 }, true); return { ok: true, msg: `${x.pol.n} rompe con el partido y funda una formación propia.` }; } }
      C.Personaje.cambiar(E, { prestigio: -0.4 }, true); E.partidos[J.partido].cohesion = clamp(E.partidos[J.partido].cohesion - 1.2, 15, 99); return { ok: true, msg: `Soplas sobre las brasas: la lealtad de ${x.pol.n} baja a ${Math.round(b.leal)}.` };
    },
    presionar(E, k) {
      const J = E.jugador, c = Es.asegurar(E), pi = C.PartidoInt.asegurar(E), pa = E.partidos[J.partido], a = J.atrib;
      if (Es.esLider(E)) return { ok: false, msg: 'Eres el líder del partido: tú no exiges un congreso' }; if (c.fase) return { ok: false, msg: 'El congreso ya está convocado' };
      let d = 0, msg = '';
      if (k === 'exigir') { d = 3 + (a.oratoria + a.carisma) / 4; msg = 'Exiges públicamente un congreso extraordinario.'; }
      else if (k === 'firmas') { d = 5 + (a.carisma + a.negociacion) / 4 + clamp(pa.militantes / 40000, 0, 3); pa.finanzas = Math.max(0, pa.finanzas - 2); msg = 'Reúnes firmas de militantes para pedir un congreso extraordinario.'; }
      else if (k === 'criticos') { d = 5; pi.fac.critico = clamp(pi.fac.critico + 3, 5, 60); pi.fac.oficial = 100 - pi.fac.barones - pi.fac.critico; msg = 'Te alías con el sector crítico: crece su peso y la presión.'; }
      else { d = 10; pa.cohesion = clamp(pa.cohesion - 2, 15, 99); C.Personaje.cambiar(E, { prestigio: -0.6 }, true); msg = 'Amenazas con una escisión si no se convoca el congreso: la presión se dispara… y la cohesión se resiente.'; }
      c.presion = clamp(c.presion + d, 0, 100); return { ok: true, msg: `${msg} (presión ${Math.round(c.presion)}).` };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const c = Es.asegurar(E), pi = C.PartidoInt.asegurar(E), pa = E.partidos[J.partido], t = E.fecha.t, lider = Es.esLider(E);
      const obj = clamp(pi.fac.critico * 0.8 + Math.max(0, 55 - pa.cohesion) * 0.7, 0, 70); c.presion = clamp(c.presion + (obj - c.presion) * 0.05 - 0.3, 0, 100);
      if (c.presion >= 75 && !c.fase && c.prox - t > 14 && pa.amb === 'nac') {
        if (!lider) { c.prox = t + 7; c.presion = 25; C.Noticias.poner(E, 'partido', `${pa.sigla} adelanta su congreso por la presión de los críticos.`, 'ES'); }
        else if (C.Dilemas && !C.Dilemas.asegurar(E).act.some(x => x.id === 'congresoExtra') && C.Dilemas.asegurar(E).act.length < 2) C.Dilemas.nuevo(E, 'congresoExtra');
      }
      if (lider && pa.amb === 'nac' && pi.fac.critico > 36 && pa.cohesion < 52 && C.Dilemas && C.Dilemas.asegurar(E).act.length < 2 && !C.Dilemas.asegurar(E).act.some(x => x.id === 'criticosEscision') && t - (c.ultEsc || -99) > 30 && U.chance(0.02)) { if (C.Dilemas.nuevo(E, 'criticosEscision')) c.ultEsc = t; }
      // Escisiones en otros partidos nacionales
      for (const k of E.esp.nacionales.slice()) { if (k === J.partido) continue; const p = E.partidos[k]; if (!p.lider || p.lider === 'J' || (E.esp.esn || []).some(x => x.de === k && t - x.t < 150)) continue; if (U.chance(0.00015 + Math.max(0, 48 - p.cohesion) * 0.00004)) Es.fundarNacional(E, { old: k, fuerza: U.rf(0.3, 0.8), lider: null, motivo: 'crisis interna' }); }
    }
  };
  const R = (id, nombre, icono, desc, costo, disp, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo: 'partido', disponible: E => E.jugador.pais !== 'ES' ? 'Sólo en España' : disp(E), ejecutar });
  const noLider = E => Es.esLider(E) ? 'Eres el líder del partido' : (Es.asegurar(E).fase ? 'El congreso ya está convocado' : true);
  R('exigir_congreso', 'Exigir un congreso extraordinario', '📣', 'Pides públicamente que el partido convoque un congreso.', 1, noLider, E => Es.presionar(E, 'exigir'));
  R('firmas_congreso', 'Recoger firmas para un congreso', '✍️', 'Reúnes firmas de militantes: presión fuerte, cuesta algo de caja.', 2, noLider, E => Es.presionar(E, 'firmas'));
  R('aliarse_criticos', 'Aliarte con el sector crítico', '🤝', 'Refuerzas a los críticos: más presión y más peso interno de ese sector.', 2, noLider, E => Es.presionar(E, 'criticos'));
  R('amenazar_escision', 'Amenazar con una escisión', '💣', 'Presión máxima, pero dañas la cohesión y tu imagen.', 2, noLider, E => Es.presionar(E, 'amenaza'));
  R('empujar_baron', 'Empujar a un barón a la ruptura', '🧨', 'Debilitas la lealtad de un barón de tu partido hasta que funde su propia formación.', 2, E => Es.esLider(E) ? 'Eres el líder del partido' : true, (E, a) => Es.empujarBaron(E, a && a.c));
  R('liderar_escision', 'Liderar una escisión', '🚪', 'Rompes con tu partido, te llevas a una parte de sus diputados y fundas uno nuevo. Decisión de no retorno.', 3, E => { const J = E.jugador; if (Es.esLider(E)) return 'Eres el líder del partido'; if (BLOQUEO.includes(J.cargo)) return 'Debes dejar antes tu cargo institucional'; return true; }, E => Es.liderar(E));
  C.Tiempo.registrar('escision', { turno: Es.turno }, 41);
})(window.ESP);

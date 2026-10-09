/* Organizaciones del partido: juventudes, fundación (think tank), sindicato afín y medios afines.
   Estado: E.esp.sat = { pid, org:{juv,fun,sin,med:{n 0-5, leal}}, hist[] }. Cada una cuesta mantenimiento semanal y da bonus (y riesgos). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const ORGS = {
    juv: ['🧑‍🎓', 'Juventudes del partido', 'Cantera y voz joven: sube tu apoyo con los jóvenes y te da candidatos (promesas) cada año.'],
    fun: ['🏛', 'Fundación / think tank', 'Ideas y formación: amortigua los giros del programa, mejora tus campañas dirigidas y refuerza la cohesión.'],
    sin: ['✊', 'Sindicato afín', 'Calle y movilización entre trabajadores y pensionistas; si incumples el programa social, protesta.'],
    med: ['📰', 'Medios afines', 'Narrativa propia: algo más de apoyo cada semana y escudo ante los escándalos; polariza.']
  };
  const Sa = C.Satelites = {
    ORGS,
    asegurar(E) { const J = E.jugador; let s = E.esp.sat; if (s && s.pid === J.partido) return s; return E.esp.sat = { pid: J.partido, org: { juv: { n: 0, leal: 65 }, fun: { n: 0, leal: 65 }, sin: { n: 0, leal: 60 }, med: { n: 0, leal: 65 } }, hist: [] }; },
    nivel(E, k) { return E.jugador && C.Sede && C.Sede.activo(E) ? Sa.asegurar(E).org[k].n : 0; },
    coste(E) { const s = Sa.asegurar(E); return Object.keys(s.org).reduce((a, k) => a + 0.008 * Math.pow(s.org[k].n, 1.3), 0); },
    nota(E, txt) { const s = Sa.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 15) s.hist.length = 15; },
    invertir(E, k) {
      const s = Sa.asegurar(E), o = s.org[k]; if (!o) return { ok: false, msg: 'Organización desconocida' }; if (o.n >= 5) return { ok: false, msg: 'Ya está al máximo' }; const c = 2 + 1.5 * o.n; if (!C.Sede.cost(E, c)) return { ok: false, msg: `No hay caja (${c} puntos de finanzas)` };
      o.n++; o.leal = clamp(o.leal + 4, 0, 100); Sa.nota(E, `${ORGS[k][1]}: nivel ${o.n}.`); return { ok: true, msg: `${ORGS[k][1]}: nivel ${o.n}/5 (mantenimiento ${U.d1(0.008 * Math.pow(o.n, 1.3) * 1.1)} M€/sem).` };
    },
    recortar(E, k) { const s = Sa.asegurar(E), o = s.org[k]; if (!o || o.n <= 0) return { ok: false, msg: 'No hay nada que recortar' }; o.n--; E.partidos[E.jugador.partido].finanzas = clamp(E.partidos[E.jugador.partido].finanzas + 1.2, 0, 99); o.leal = clamp(o.leal - 8, 0, 100); Sa.nota(E, `${ORGS[k][1]}: recorte a nivel ${o.n}.`); return { ok: true, msg: `Recortas ${ORGS[k][1].toLowerCase()}: nivel ${o.n}.` }; },
    /* Un incumplimiento del programa enfada al sindicato si afecta a lo social. */
    incumplimiento(E, area) { if (!['pens', 'trab', 'fisc', 'sal', 'edu', 'viv'].includes(area)) return; const s = Sa.asegurar(E); s.org.sin.leal = clamp(s.org.sin.leal - 12, 0, 100); },
    turno(E) {
      const J = E.jugador; if (!J || !C.Sede || !C.Sede.activo(E) || E.meta.presim) return; const s = Sa.asegurar(E), pa = E.partidos[J.partido], t = E.fecha.t, g = E.paises.ES.gob, Sd = C.Sede;
      for (const k in s.org) s.org[k].leal = clamp(s.org[k].leal + (62 - s.org[k].leal) * 0.01, 0, 100);
      const j = s.org.juv, f = s.org.fun, si = s.org.sin, m = s.org.med;
      if (j.n) { Sd.empujar(E, J.partido, 0.0018 * j.n); if (U.chance(0.0012 * j.n)) { C.Noticias.poner(E, 'partido', `Polémica en las juventudes de ${pa.sigla} por unas declaraciones desafortunadas.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.5 }, true); }
        if (t % 52 === 0) { const st = Sd.asegurar(E), libres = Sd.provs(E).filter(p => !st.cab[p] && ((E.esp.prov[p] && E.esp.prov[p].escanos[J.partido]) || 0) > 0); const p = U.pick(libres); if (p) { const per = C.Mundo.persona('ES'); st.cab[p] = { n: per.n, tipo: 'promesa', b: 0.008 + 0.002 * j.n, t0: t, auto: false }; Sa.nota(E, `Las juventudes aportan a ${per.n} como cabeza de lista en ${D().provincias[p][0]}.`); } } }
      if (f.n) pa.cohesion = clamp(pa.cohesion + Math.max(0, 80 - pa.cohesion) * 0.0015 * f.n, 15, 99);
      if (si.n) { if (si.leal > 35) Sd.empujar(E, J.partido, 0.0015 * si.n); else if (g && (g.partido === J.partido || g.coalicion.includes(J.partido)) && U.chance(0.01 * si.n)) { C.Noticias.poner(E, 'politica', `El sindicato afín a ${pa.sigla} convoca movilizaciones contra el Gobierno por incumplir su programa social.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -1 }, true); if (g.partido === J.partido) g.aprob = clamp(g.aprob - 1, 10, 90); si.leal += 6; } }
      if (m.n) Sd.empujar(E, J.partido, 0.0014 * m.n);
    }
  };
  // Los medios afines amortiguan los escándalos propios
  if (C.Corrupcion) { const n0 = C.Corrupcion.nuevo; C.Corrupcion.nuevo = function (E, pid) { const r = n0.apply(this, arguments); try { const J = E.jugador; if (r && J && pid === J.partido && C.Sede && C.Sede.activo(E)) { const n = Sa.nivel(E, 'med'); if (n) { C.Sede.empujar(E, pid, 0.07 * n); C.Personaje.cambiar(E, { prestigio: 0.25 * n }, true); } } } catch (e) { console.error('[sat]', e); } return r; }; }
  const R = (id, nombre, icono, desc, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo: 1, grupo: 'partido', disponible: E => !C.Sede || !C.Sede.activo(E) ? 'Sólo con un partido en España' : C.Sede.peso(E), ejecutar });
  R('invertir_organizacion', 'Reforzar una organización del partido', '🏢', 'Juventudes, fundación, sindicato afín o medios afines: sube un nivel (cuesta caja y mantenimiento).', (E, a) => Sa.invertir(E, a && a.org));
  R('recortar_organizacion', 'Recortar una organización del partido', '✂️', 'Bajas un nivel y recuperas algo de caja.', (E, a) => Sa.recortar(E, a && a.org));
  C.Tiempo.registrar('satelites', { turno: Sa.turno }, 37);
})(window.ESP);

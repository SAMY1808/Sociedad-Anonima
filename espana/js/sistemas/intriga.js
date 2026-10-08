/* Intriga política: candidatos que abandonan en plena campaña, vetos mutuos entre partidos, amistades y enemistades personales,
   reportajes de investigación, discurso del Rey y ecos de las elecciones extranjeras.
   Estado: E.esp.intr = { vetos[{a,b,t,por}], lazos:{polId:v}, rey:año, hist[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const In = C.Intriga = {
    asegurar(E) { if (!E.esp.intr) E.esp.intr = { vetos: [], lazos: {}, rey: 0, hist: [] }; return E.esp.intr; },
    nota(E, txt) { const s = In.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 20) s.hist.length = 20; },
    sg(E, k) { return E.partidos[k] ? E.partidos[k].sigla : k; },

    /* ── Vetos mutuos ── */
    vetaDin(E, a, b) { const s = E.esp.intr; return !!s && s.vetos.some(v => v.a === a && v.b === b); },
    vetar(E, a, b, por) { const s = In.asegurar(E); if (a === b || In.vetaDin(E, a, b)) return false; s.vetos.push({ a, b, t: E.fecha.t, por: por || '' }); In.nota(E, `${In.sg(E, a)} veta a ${In.sg(E, b)}${por ? ' (' + por + ')' : ''}.`); return true; },
    levantar(E, a, b) { const s = In.asegurar(E), n = s.vetos.length; s.vetos = s.vetos.filter(v => !(v.a === a && v.b === b)); return s.vetos.length < n; },
    /* Al arrancar una campaña los partidos se declaran los vetos habituales; a la vez se anulan los de la legislatura anterior. */
    generarVetos(E) {
      const s = In.asegurar(E), P = E.paises.ES, ps = P.partidos.filter(k => (P.escanos[k] || 0) >= 8 && E.partidos[k].lider !== 'J'); s.vetos = [];
      for (const a of ps) for (const b of ps) {
        if (a >= b || E.partidos[a].lider === 'J' || E.partidos[b].lider === 'J') continue;
        const dist = U.distIdeo(E.partidos[a], E.partidos[b]), p = dist > 0.38 ? 0.4 : dist > 0.28 ? 0.12 : 0.02;
        if (U.chance(p)) { const mut = U.chance(0.6); const x = U.chance(0.5) ? [a, b] : [b, a]; In.vetar(E, x[0], x[1], 'campaña'); if (mut) In.vetar(E, x[1], x[0], 'veto mutuo'); }
      }
      // vetos que el jugador ya se ha declarado se conservan
    },

    /* ── Candidatos que abandonan ── */
    abandonos(E) {
      const Ca = C.Campana, camp = Ca && Ca.cur(E); if (!camp || camp.ambito !== 'gen') return; const J = E.jugador, P = E.paises.ES;
      for (const k of P.partidos) {
        const p = E.partidos[k]; if (p.amb !== 'nac' || p.lider === 'J' || !E.politicos[p.lider]) continue; const lid = E.politicos[p.lider];
        const caso = C.Corrupcion && C.Corrupcion.asegurar(E).casos.some(c => c.pid === k && c.fase !== 'cerrado' && c.fase !== 'rumor');
        const pr = 0.004 + (caso ? 0.02 : 0) + Math.max(0, 55 - p.cohesion) * 0.0002 + (100 - lid.i) * 0.00002;
        if (!U.chance(pr)) continue;
        const nom = lid.n; const nuevo = C.Ejecutivo.nuevoLider(E, k, 'tras renunciar en plena campaña'); if (!nuevo) continue;
        C.Opinion.empujeES(E, k, -0.35); if (Ca.mover) Ca.mover(E, k, -0.8, `${nom} renuncia como candidato/a de ${p.sigla} en plena campaña: ${nuevo.n} le sustituye.`);
        C.Noticias.poner(E, 'politica', `SORPRESA: ${nom} abandona la candidatura de ${p.sigla} a pocas semanas de las urnas (${caso ? 'acosado/a por un caso judicial' : 'por motivos personales'}). ${nuevo.n} toma el relevo.`, 'ES');
        In.nota(E, `${nom} renuncia como candidato/a de ${p.sigla}.`); if (k === (J && J.partido)) C.Personaje.log(E, `El líder de tu partido renuncia en campaña.`);
        return;
      }
    },

    /* ── Lazos personales ── */
    lazo(E, polId) { const s = In.asegurar(E); if (s.lazos[polId] == null) s.lazos[polId] = Math.round(U.gauss(0, 8)); return s.lazos[polId]; },
    sumarLazo(E, polId, d) { const s = In.asegurar(E); s.lazos[polId] = clamp(In.lazo(E, polId) + d, -100, 100); },
    top(E) { const s = In.asegurar(E); return Object.keys(s.lazos).filter(id => E.politicos[id]).sort((a, b) => Math.abs(s.lazos[b]) - Math.abs(s.lazos[a])).slice(0, 6); },
    /* Elige a alguien con quien tiene sentido tener un lazo: líderes rivales, barones, ex-socios. */
    conocidos(E) {
      const J = E.jugador, P = E.paises.ES, ids = []; for (const k of P.partidos) { const l = E.partidos[k].lider; if (l && l !== 'J' && E.politicos[l] && k !== J.partido) ids.push(l); }
      if (C.Barones) for (const b of C.Barones.lista(E)) ids.push(b.b.id); return ids;
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; const s = In.asegurar(E), t = E.fecha.t, f = U.fechaDe(t);
      In.abandonos(E);
      // Lazos se enfrían hacia 0
      for (const id in s.lazos) s.lazos[id] *= 0.998;
      // Favores y traiciones personales
      const aj = C.Ajustes ? C.Ajustes.get(E) : { eventos: 1 }, Dl = C.Dilemas && C.Dilemas.asegurar(E);
      if (Dl && Dl.act.length < 2 && U.chance(0.012 * aj.eventos)) {
        const cs = In.conocidos(E); if (cs.length) {
          const id = U.pick(cs), v = In.lazo(E, id);
          if (v > 20 && !Dl.act.some(x => x.id === 'favorAmigo')) { const x = C.Dilemas.nuevo(E, 'favorAmigo'); if (x) x.pol = id; }
          else if (v < -30 && !Dl.act.some(x => x.id === 'traicion')) { const x = C.Dilemas.nuevo(E, 'traicion'); if (x) x.pol = id; }
        }
      }
      // Reportajes de investigación
      if (Dl && Dl.act.length < 2 && U.chance(0.01 * aj.eventos) && !Dl.act.some(x => x.id === 'reportaje')) C.Dilemas.nuevo(E, 'reportaje');
      if (U.chance(0.006) && C.Corrupcion) { const rs = E.paises.ES.partidos.filter(k => k !== J.partido && E.partidos[k].amb === 'nac'); const k = U.pick(rs); if (k) { C.Noticias.poner(E, 'politica', `Un reportaje de investigación destapa irregularidades en ${In.sg(E, k)}.`, 'ES'); if (U.chance(0.4)) C.Corrupcion.nuevo(E, k, { gravedad: U.rf(0.2, 0.5), por: 'prensa' }); C.Opinion.empujeES(E, k, -0.08); } }
      // Discurso de Nochebuena del Rey
      if (f.getUTCMonth() === 11 && f.getUTCDate() >= 24 && s.rey !== f.getUTCFullYear()) { s.rey = f.getUTCFullYear(); In.discursoRey(E); }
    },

    discursoRey(E) {
      const P = E.paises.ES, g = P.gob, co = C.Corona && C.Corona.asegurar(E), temas = [];
      if (P.ec.paro > 13) temas.push(['el paro y la precariedad', -0.5, g.partido]); if (C.Corrupcion && C.Corrupcion.asegurar(E).casos.some(c => c.fase !== 'cerrado')) temas.push(['la ejemplaridad de las instituciones', -0.3, g.partido]);
      if (C.Estructural && C.Estructural.esfuerzo && C.Estructural.esfuerzo(E) > 38) temas.push(['el acceso a la vivienda', -0.4, g.partido]);
      if (Object.values(E.esp.ccaa).some(r => r.indep > 45)) temas.push(['la convivencia y la unidad', 0.2, null]); if (g.estab < 45) temas.push(['la estabilidad y el diálogo entre fuerzas políticas', -0.3, g.partido]);
      if (!temas.length) temas.push(['el futuro de los jóvenes y la cohesión de España', 0.3, null]);
      const t = U.pick(temas); let pop = U.gauss(0.4, 0.8); if (co) { if (co.pop < 38) pop -= 0.8; C.Corona.cambiar(E, pop); }
      if (t[2] && E.partidos[t[2]]) { g.aprob = clamp(g.aprob + t[1], 10, 90); }
      C.Noticias.poner(E, 'politica', `Discurso de Nochebuena de Su Majestad el Rey: pide atención a ${t[0]}${t[1] < 0 && t[2] ? ' y sus palabras incomodan al Gobierno' : ''}.`, 'ES');
      In.nota(E, `Discurso del Rey: ${t[0]}.`);
      if (E.jugador.pais === 'ES' && C.Dilemas && C.Dilemas.asegurar(E).act.length < 2 && U.chance(0.45)) C.Dilemas.nuevo(E, 'rey');
    },

    /* ── Elecciones extranjeras ── */
    ecoExtranjero(E, d) {
      if (!d || !d.pais || d.pais === 'ES' || !E.paises[d.pais] || !E.paises[d.pais].gob || E.meta.presim) return; const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const gb = E.paises[d.pais].gob, p = E.partidos[gb.partido]; if (!p || !p.grupo) return; const gr = p.grupo, nombre = (D().paises[d.pais] && D().paises[d.pais].nombre) || d.pais, grande = ((D().paises[d.pais] && D().paises[d.pais].pob) || 0) > 14;
      for (const k of E.esp.nacionales) if (E.partidos[k].grupo === gr) C.Opinion.empujeES(E, k, 0.05);
      const mapa = { FR: 'francia', DE: 'alemania', PT: 'portugal' };
      if (mapa[d.pais] && C.Exterior) { const x = C.Exterior.asegurar(E), k = mapa[d.pais], afin = 1 - U.distIdeo(E.partidos[J.partido], p); x.rel[k] = clamp(x.rel[k] + (afin > 0.65 ? 3 : afin < 0.4 ? -2 : 0), 0, 100); }
      const camp = C.Campana && C.Campana.cur(E); if (camp && C.Campana.mover) for (const k of E.esp.nacionales) if (E.partidos[k].grupo === gr) C.Campana.mover(E, k, 0.25, `El triunfo de ${p.sigla} en ${nombre} da alas a ${E.partidos[k].sigla}.`);
      In.nota(E, `Elecciones en ${nombre}: gana ${p.sigla} (${gr}).`);
      const extrema = ['ANR', 'PAT'].includes(gr);
      if (grande && (extrema || gr === E.partidos[J.partido].grupo) && C.Dilemas && C.Dilemas.asegurar(E).act.length < 2 && !C.Dilemas.asegurar(E).act.some(x => x.id === 'extranjero')) { const x = C.Dilemas.nuevo(E, 'extranjero'); if (x) { x.ext = d.pais; x.nom = nombre; x.sg = p.sigla; x.gr = gr; } }
    }
  };
  // El veto dinámico se suma a los vetos fijos
  if (C.Ejecutivo) { const v0 = C.Ejecutivo.vetaA; C.Ejecutivo.vetaA = function (E, p, q) { return v0.apply(this, arguments) || In.vetaDin(E, p, q); }; }
  // Los lazos personales modulan las relaciones con los partidos
  if (C.Mayorias) { const c0 = C.Mayorias.cambiarRel; C.Mayorias.cambiarRel = function (E, pid, d) { const p = E.partidos[pid], l = p && p.lider; if (l && l !== 'J' && E.politicos[l] && E.esp.intr) { const v = In.lazo(E, l); if (d > 0 && v > 30) d *= 1.25; else if (d > 0 && v < -30) d *= 0.7; else if (d < 0 && v < -30) d *= 1.25; else if (d < 0 && v > 30) d *= 0.8; In.sumarLazo(E, l, d * 0.3); } return c0.call(this, E, pid, d); }; }
  C.Bus.on('disolucion', () => { const E = C.E; if (E && E.jugador && E.jugador.pais === 'ES') In.generarVetos(E); });
  C.Bus.on('elecciones', d => { const E = C.E; if (!E || !d) return; if (d.tipo === 'generales' && E.esp.intr) E.esp.intr.vetos = E.esp.intr.vetos.filter(v => v.por === 'jugador'); else if (d.pais && d.pais !== 'ES') In.ecoExtranjero(E, d); });
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'partido', disponible: E => E.jugador.pais === 'ES' ? true : 'Sólo en España' }, o));
  R({ id: 'vetar_partido', nombre: 'Declarar un veto: «con ellos no»', icono: '⛔', desc: 'Te comprometes públicamente a no pactar con un partido: tus bases lo agradecen, pero te limitas.', ejecutar: (E, a) => { const J = E.jugador, k = a && a.pid; if (!k || !E.partidos[k] || k === J.partido) return { ok: false, msg: 'Elige un partido' }; if (!In.vetar(E, J.partido, k, 'jugador')) return { ok: false, msg: 'Ya lo habías vetado' }; E.partidos[J.partido].cohesion = clamp(E.partidos[J.partido].cohesion + 1, 15, 99); C.Personaje.cambiar(E, { pop: 0.25 }); if (C.Mayorias) C.Mayorias.cambiarRel(E, k, -4); return { ok: true, msg: `Vetas a ${In.sg(E, k)}: cierras filas con los tuyos.` }; } });
  R({ id: 'levantar_veto', nombre: 'Levantar un veto', icono: '🔓', desc: 'Retiras un veto que te habías impuesto (cuesta credibilidad).', ejecutar: (E, a) => { const J = E.jugador, k = a && a.pid; if (!In.levantar(E, J.partido, k)) return { ok: false, msg: 'No tienes ese veto' }; C.Personaje.cambiar(E, { prestigio: -0.8 }); E.partidos[J.partido].cohesion = clamp(E.partidos[J.partido].cohesion - 0.8, 15, 99); return { ok: true, msg: `Levantas el veto a ${In.sg(E, k)}: te acusan de incoherencia.` }; } });
  C.Tiempo.registrar('intriga', { turno: In.turno }, 59);
})(window.ESP);

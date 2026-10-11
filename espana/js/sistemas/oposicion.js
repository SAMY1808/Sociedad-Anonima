/* Juego desde la oposición: gobierno en la sombra (ministros que replican al Gobierno y se preparan para gobernar), contraprogramación
   de las leyes del Gobierno y pactos de Estado (negociación por rondas con la ley real al firmar).
   Estado: E.esp.opo = { som:{gab:{min:{per,t}}, pool:{min:[per]}, cred, rep:{min:t}, gobierno, hist[]}, cp:{ley:{n,t,modos[]}}, pe:{act[], ofertas[], firmados[], ult} }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, Co = C.Congreso, Gab = C.Gabinete, Ej = C.Ejecutivo;
  if (!Co || !Gab || !Ej) return;
  const MODOS = {
    denuncia: { ic: '🗣', n: 'Denunciar sus defectos', d: 'La ofensiva más dura: quita mucho apoyo popular a la ley, pero si ya es popular puede volverse en tu contra.', f: 3.2 },
    alternativa: { ic: '📑', n: 'Presentar una alternativa', d: 'Propones tu propio texto: menos daño al Gobierno, pero ganas imagen de proyecto de país.', f: 2.0 },
    ruido: { ic: '📣', n: 'Cambiar el foco mediático', d: 'Llevas la conversación a otro asunto: efecto pequeño pero sin riesgo.', f: 1.3 }
  };
  const TEMAS = {
    educacion: { ic: '🎓', n: 'Pacto educativo', tpl: 'ley_educativa', d: 'Una ley educativa estable, fuera de la lucha partidista.' },
    justicia: { ic: '⚖️', n: 'Pacto por la Justicia', tpl: 'reforma_cgpj', d: 'Renovación pactada del gobierno de los jueces.' },
    pensiones: { ic: '👵', n: 'Pacto de Toledo', tpl: 'reforma_pensiones', d: 'Sostenibilidad de las pensiones con acuerdo de todos.' },
    energia: { ic: '⚡', n: 'Pacto de Estado del clima y la energía', tpl: 'ley_clima', d: 'Una senda energética que sobreviva a los cambios de Gobierno.' },
    vivienda: { ic: '🏠', n: 'Pacto de Estado por la vivienda', tpl: 'plan_vivienda', d: 'Un plan de vivienda con acuerdo entre las grandes fuerzas.' },
    sanidad: { ic: '🏥', n: 'Pacto por la sanidad pública', tpl: 'sanidad_publica', d: 'Financiación y listas de espera como política de Estado.' }
  };
  const LINEAS = {
    ceder: { ic: '🤲', n: 'Ceder', d: 'Aceptas buena parte de lo que pide el otro lado: avanza mucho, pero tu partido lo nota.' },
    equilibrada: { ic: '⚖️', n: 'Fórmula equilibrada', d: 'Buscas un punto medio: suele avanzar, y si falla se enfría la negociación.' },
    dura: { ic: '💪', n: 'Línea dura', d: 'Impones tus condiciones: puede cerrar el pacto de golpe o romperlo.' }
  };
  const COOL_PACTO = 8, COOL_REPLICA = 3;

  const Op = C.Oposicion = {
    MODOS, TEMAS, LINEAS,
    asegurar(E) {
      if (!E.esp.opo) E.esp.opo = { som: { gab: {}, pool: {}, cred: 0, rep: {}, gobierno: false, hist: [] }, cp: {}, pe: { act: [], ofertas: [], firmados: [], ult: -99 } };
      return E.esp.opo;
    },
    nota(E, txt) { const s = Op.asegurar(E).som; s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 12) s.hist.length = 12; },
    sg: (E, k) => E.partidos[k] ? E.partidos[k].sigla : k,
    xJ(E, a, b) { const J = E.jugador; return (J.atrib[a || 'negociacion'] / 10) * 0.6 + (J.atrib[b || 'carisma'] / 10) * 0.4; },

    /* ── Posición del jugador ── */
    lider(E) { const J = E.jugador; return !!(J && J.pais === 'ES' && J.rol === 'lider' && J.partido && E.partidos[J.partido] && E.partidos[J.partido].amb === 'nac'); },
    enOposicion(E) { const g = E.paises.ES.gob, J = E.jugador; return Op.lider(E) && g.pm !== 'J' && !g.coalicion.includes(J.partido); },
    /* 'oposicion' (lideras un partido fuera del Gobierno), 'gobierno' (eres Presidente/a) o null. */
    lado(E) { const g = E.paises.ES.gob; if (E.jugador.pais !== 'ES') return null; if (g.pm === 'J') return 'gobierno'; return Op.enOposicion(E) ? 'oposicion' : null; },
    razonOpo(E) { const J = E.jugador; if (J.pais !== 'ES') return 'Sólo en España'; if (!Op.lider(E)) return 'Sólo quien lidera un partido nacional monta un gobierno en la sombra'; if (!Op.enOposicion(E)) return 'Sólo desde la oposición: tu partido está en el Gobierno'; return true; },

    /* ── Gobierno en la sombra ── */
    som(E) { return Op.asegurar(E).som; },
    cargos(E) { return Gab.cargos(E, 'central'); },
    candidatos(E, min) {
      const s = Op.som(E); if (s.pool[min]) return s.pool[min]; const cargo = Op.cargos(E).find(x => x.id === min); if (!cargo) return [];
      const J = E.jugador, mk = perfil => Gab.nueva(E, { region: 'ES', partido: J.partido, esp: cargo.esp, perfil });
      return s.pool[min] = [mk('politico'), mk(U.pick(['joven', 'baron', 'politico'])), mk('tecnico')];
    },
    semanas(E, min) { const x = Op.som(E).gab[min]; return x ? Math.max(0, E.fecha.t - x.t) : 0; },
    rendSombra(E, min) { const x = Op.som(E).gab[min], cargo = Op.cargos(E).find(c => c.id === min); if (!x || !cargo) return 0; return Math.round(clamp(Gab.rend(E, cargo, x.per) + Math.min(8, Op.semanas(E, min) / 13), 5, 99)); },
    cobertura(E) { const cs = Op.cargos(E), s = Op.som(E), tot = U.suma(cs.map(c => c.peso)); return tot ? U.suma(cs.filter(c => s.gab[c.id]).map(c => c.peso)) / tot : 0; },
    nombrar(E, min, k) {
      const r = Op.razonOpo(E); if (r !== true) return { ok: false, msg: r }; const cargo = Op.cargos(E).find(c => c.id === min); if (!cargo) return { ok: false, msg: 'Elige un ministerio' };
      const pool = Op.candidatos(E, min), per = pool[k]; if (!per) return { ok: false, msg: 'Elige un candidato' };
      const s = Op.som(E), antes = s.gab[min]; if (antes && antes.per === per) return { ok: false, msg: 'Ya es tu ministro/a en la sombra' };
      s.gab[min] = { per, t: E.fecha.t }; Op.nota(E, `${per.n} es nombrado/a ministro/a de ${cargo.nombre} en la sombra.`);
      C.Noticias.poner(E, 'politica', `${Op.sg(E, E.jugador.partido)} presenta a ${per.n} como ministro/a de ${cargo.nombre} en su gobierno en la sombra.`, 'ES');
      return { ok: true, msg: `${per.n} será tu ministro/a de ${cargo.nombre} en la sombra (rendimiento previsto ${Op.rendSombra(E, min)}).` };
    },
    cesar(E, min) {
      const r = Op.razonOpo(E); if (r !== true) return { ok: false, msg: r }; const s = Op.som(E), x = s.gab[min]; if (!x) return { ok: false, msg: 'No hay ministro/a en la sombra en esa cartera' };
      delete s.gab[min]; Op.nota(E, `${x.per.n} deja el gobierno en la sombra.`); return { ok: true, msg: `Cesas a ${x.per.n} como ministro/a en la sombra.` };
    },
    /* Cara a cara del ministro/a en la sombra con el titular de la cartera. */
    replica(E, min) {
      const r = Op.razonOpo(E); if (r !== true) return { ok: false, msg: r }; const s = Op.som(E), x = s.gab[min], g = E.paises.ES.gob, J = E.jugador;
      if (!x) return { ok: false, msg: 'Nombra antes a un ministro/a en la sombra para esa cartera' };
      if (s.rep[min] != null && E.fecha.t - s.rep[min] < COOL_REPLICA) return { ok: false, msg: `${x.per.n} ya ha replicado hace poco: espera ${COOL_REPLICA - (E.fecha.t - s.rep[min])} semana(s)` };
      s.rep[min] = E.fecha.t; const rs = Op.rendSombra(E, min), tit = Gab.persona(E, 'central', min), rm = Gab.rendDe(E, 'central', min), d = (rs - rm) / 100, cargo = Op.cargos(E).find(c => c.id === min);
      if (d > 0) {
        g.aprob = clamp(g.aprob - (0.15 + 0.6 * d), 5, 90); C.Opinion.empujeES(E, J.partido, 0.05 + 0.15 * d); s.cred = clamp(s.cred + 2 + 8 * d, 0, 100);
        return { ok: true, msg: `${x.per.n} gana el cara a cara con ${tit ? tit.n : 'el ministro'} en ${cargo.nombre}: el Gobierno pierde apoyo y tu partido sube (+${Math.round((2 + 8 * d))} de credibilidad).` };
      }
      s.cred = clamp(s.cred - 2, 0, 100); C.Personaje.cambiar(E, { prestigio: -0.2 });
      return { ok: true, exito: false, msg: `${tit ? tit.n : 'El ministro'} sale airoso/a del cara a cara con ${x.per.n}: la réplica no cuaja.` };
    },
    turnoSombra(E) {
      const s = Op.som(E), g = E.paises.ES.gob, J = E.jugador;
      if (g.pm === 'J') { s.gobierno = true; return; }
      if (s.gobierno && Op.enOposicion(E)) { s.gab = {}; s.pool = {}; s.rep = {}; s.cred = 0; s.gobierno = false; }   // volver a la oposición empieza de cero
      if (!Op.enOposicion(E)) return;
      const ids = Object.keys(s.gab); let sum = 0; for (const id of ids) sum += Op.rendSombra(E, id);
      const objetivo = ids.length ? Op.cobertura(E) * 100 * (sum / ids.length) / 70 : 0; s.cred = clamp(s.cred + (clamp(objetivo, 0, 100) - s.cred) * 0.03, 0, 100);
      C.Opinion.empujeES(E, J.partido, (s.cred - 40) / 60 * 0.004);
      // Una polémica puede cobrarse un ministro/a en la sombra
      for (const id of ids) { const x = s.gab[id], integ = Gab.integ(x.per); if (U.chance(0.0025 * (1.4 - integ / 100))) { delete s.gab[id]; s.cred = clamp(s.cred - 6, 0, 100); Op.nota(E, `${x.per.n} dimite como ministro/a en la sombra.`); C.Noticias.poner(E, 'politica', `${x.per.n}, ministro/a en la sombra de ${Op.sg(E, J.partido)}, dimite tras una polémica.`, 'ES'); } }
    },

    /* ── Contraprogramación de las leyes del Gobierno ── */
    leyesGobierno(E) { return Object.values(E.proyectos).filter(p => p.autor && p.autor.tipo === 'gobierno' && Co.ABIERTAS.includes(p.etapa) && !p.rdl).sort((a, b) => a.t0 - b.t0); },
    sombraDe(E, p) { const m = D().ministerios.find(x => x.sector === p.s); return m && Op.som(E).gab[m.id] ? { min: m.id, rend: Op.rendSombra(E, m.id) } : null; },
    contraprogramar(E, id, modo) {
      const r = Op.razonOpo(E); if (r !== true) return { ok: false, msg: r }; const p = E.proyectos[id], M = MODOS[modo]; const cp = Op.asegurar(E).cp;
      if (!p || !Op.leyesGobierno(E).includes(p)) return { ok: false, msg: 'Sólo se contraprograman las leyes del Gobierno que siguen en trámite' }; if (!M) return { ok: false, msg: 'Elige cómo contraprogramar' };
      const c = cp[id] || (cp[id] = { n: 0, t: -99, modos: [], dano: 0 }); if (E.fecha.t - c.t < 1) return { ok: false, msg: 'Ya contraprogramaste esta ley esta semana' }; if (c.dano >= 14) return { ok: false, msg: 'Ya no puedes restarle más apoyo popular a esta ley' };
      const x = Op.xJ(E, 'oratoria', 'carisma'), sh = Op.sombraDe(E, p), bono = sh ? sh.rend / 200 : 0;
      c.t = E.fecha.t; c.n++; c.modos.push(modo); const J = E.jugador;
      if (modo === 'denuncia' && p.pop > 66 && U.chance(0.3)) { C.Personaje.cambiar(E, { prestigio: -0.5 }); return { ok: true, exito: false, msg: `La ley es popular: tu denuncia suena a oposición por oposición (−0,5 de prestigio).` }; }
      const d = Math.min(14 - c.dano, M.f * (0.6 + 0.8 * x) * (1 + bono)); p.pop = clamp(p.pop - d, 0, 100); c.dano += d; p.contra = { n: c.n, dano: c.dano };
      if (modo === 'alternativa') { C.Personaje.cambiar(E, { prestigio: 0.2 }); C.Opinion.empujeES(E, J.partido, 0.03); }
      p.hist.push({ t: E.fecha.t, txt: `${Op.sg(E, J.partido)} contraprograma la ley (${M.n.toLowerCase()})` });
      return { ok: true, msg: `${M.n}: la ley pierde ${U.d1(d)} puntos de apoyo popular${sh ? ' (con el respaldo de tu ministro/a en la sombra)' : ''}.` };
    },
    /* Resultado de la votación final de una ley contraprogramada. */
    alFinalizar(E, p, ok) {
      const c = Op.asegurar(E).cp[p.id]; if (!c || !p.autor || p.autor.tipo !== 'gobierno' || !Op.enOposicion(E)) return;
      const g = E.paises.ES.gob, J = E.jugador, n = Math.min(3, c.n);
      if (ok) { g.aprob = clamp(g.aprob - 0.1 * n, 5, 90); C.Opinion.empujeES(E, J.partido, 0.03 * n); }
      else { g.aprob = clamp(g.aprob - 0.3, 5, 90); C.Personaje.cambiar(E, { prestigio: 0.8 * Math.min(2, n) }, true); C.Noticias.poner(E, 'politica', `Derrota política del Gobierno: «${p.t}» cae tras la ofensiva de ${Op.sg(E, J.partido)}.`, 'ES'); }
      delete Op.asegurar(E).cp[p.id];
    },

    /* ── Pactos de Estado ── */
    socio(E) { const lado = Op.lado(E), g = E.paises.ES.gob; if (lado === 'oposicion') return g.partido; if (lado === 'gobierno') return Ej.oposicion(E)[0] || null; return null; },
    pe(E) { return Op.asegurar(E).pe; },
    vigente(E, tema) { const T0 = TEMAS[tema]; return !!(T0 && C.Impacto && C.Impacto.vigentes(E).has(T0.tpl)); },
    puedeProponer(E, tema) {
      const lado = Op.lado(E); if (!lado) return 'Sólo quien lidera la oposición o preside el Gobierno negocia pactos de Estado'; const pe = Op.pe(E);
      if (E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en su etapa ordinaria'; if (pe.act.length >= 2) return 'Ya negocias dos pactos a la vez';
      if (E.fecha.t - pe.ult < COOL_PACTO) return `Espera ${COOL_PACTO - (E.fecha.t - pe.ult)} semana(s) desde el último intento`;
      if (tema && !TEMAS[tema]) return 'Tema desconocido'; if (tema && pe.act.some(a => a.tema === tema)) return 'Ese pacto ya se está negociando'; if (tema && Op.vigente(E, tema)) return 'Ya hay una ley vigente sobre ese asunto'; if (!Op.socio(E)) return 'No hay interlocutor para pactar';
      return true;
    },
    /* Probabilidad de que el otro lado se siente a negociar. */
    probAcepta(E) {
      const k = Op.socio(E); if (!k) return 0; const m = C.Mayorias ? C.Mayorias.asegurar(E) : { rel: {}, estilo: {} }, g = E.paises.ES.gob, lado = Op.lado(E);
      let p = 0.28 + (m.rel[k] || 0) / 260 + 0.25 * Op.xJ(E);
      const e = m.estilo[k]; p += { pactista: 0.18, institucional: 0.1, oportunista: -0.02, populista: -0.12, bloqueo: -0.25 }[e] || 0;
      if (lado === 'oposicion' && g.aprob < 42) p += 0.1; if (lado === 'oposicion' && g.estab < 40) p += 0.08;
      return clamp(p, 0.05, 0.9);
    },
    proponer(E, tema) {
      const r = Op.puedeProponer(E, tema); if (r !== true) return { ok: false, msg: r }; const pe = Op.pe(E), k = Op.socio(E), T0 = TEMAS[tema], p = Op.probAcepta(E); pe.ult = E.fecha.t;
      if (!U.chance(p)) { if (C.Mayorias) C.Mayorias.cambiarRel(E, k, -2); return { ok: true, exito: false, msg: `${Op.sg(E, k)} rechaza sentarse a negociar «${T0.n}» (${Math.round(p * 100)} % de probabilidad).` }; }
      pe.act.push({ id: U.id('pe'), tema, socio: k, t0: E.fecha.t, tRonda: -99, prog: 20, rup: 0, con: 0, hist: [] });
      C.Noticias.poner(E, 'politica', `${Op.sg(E, k)} y ${Op.sg(E, E.jugador.partido)} abren negociaciones para un ${T0.n.toLowerCase()}.`, 'ES');
      return { ok: true, msg: `${Op.sg(E, k)} acepta negociar «${T0.n}»: la negociación avanza por rondas.` };
    },
    ronda(E, id, linea) {
      const pe = Op.pe(E), a = pe.act.find(x => x.id === id), L = LINEAS[linea]; if (!a) return { ok: false, msg: 'Esa negociación ya no está abierta' }; if (!L) return { ok: false, msg: 'Elige una línea de negociación' };
      if (!Op.lado(E)) return { ok: false, msg: 'Ya no puedes negociar este pacto' }; if (E.fecha.t - a.tRonda < 1) return { ok: false, msg: 'Ya hubo una ronda esta semana: la siguiente, la próxima' };
      a.tRonda = E.fecha.t; const x = Op.xJ(E), J = E.jugador, pa = E.partidos[J.partido], T0 = TEMAS[a.tema]; let txt;
      if (linea === 'ceder') { a.prog += 28; a.con++; pa.cohesion = clamp((pa.cohesion || 60) - 2.5, 5, 100); C.Personaje.cambiar(E, { prestigio: -0.2 }); txt = `Cedes en puntos importantes: la negociación avanza mucho (+28).`; }
      else if (linea === 'equilibrada') { if (U.chance(clamp(0.55 + 0.25 * x, 0.2, 0.9))) { a.prog += 18; txt = 'Encontráis un punto medio (+18).'; } else { a.rup++; txt = 'La fórmula no convence: se enfría la negociación.'; } }
      else { if (U.chance(clamp(0.30 + 0.3 * x, 0.1, 0.7))) { a.prog += 34; if (C.Mayorias) C.Mayorias.cambiarRel(E, a.socio, -3); txt = 'Impones tus condiciones y el otro lado traga (+34), con malestar.'; } else { a.prog = Math.max(0, a.prog - 8); a.rup += 2; txt = 'El otro lado se planta: retrocede la negociación.'; } }
      a.hist.unshift({ t: E.fecha.t, txt });
      if (a.prog >= 100) return Op.firmar(E, a, txt); if (a.rup >= 3) return Op.romper(E, a);
      return { ok: true, msg: `${L.n}: ${txt} (progreso ${Math.min(99, Math.round(a.prog))} %, enfriamiento ${a.rup}/3).` };
    },
    firmar(E, a, txt) {
      const pe = Op.pe(E), T0 = TEMAS[a.tema], J = E.jugador, g = E.paises.ES.gob; pe.act = pe.act.filter(x => x !== a);
      const autor = { tipo: 'gobierno', pid: g.partido }, antes = g.aprob; let ley = null;
      try { ley = Co.proponer(E, T0.tpl, autor, { t: 'Pacto de Estado: ' + T0.n }); if (ley) { ley.etapa = 'sancionada'; ley.tEtapa = E.fecha.t; ley.hist.push({ t: E.fecha.t, txt: 'Aprobada por pacto de Estado entre el Gobierno y la oposición' }); Co.alFinalizar(E, ley, true); } } catch (e) { ley = null; }
      if (g.aprob < antes) g.aprob = clamp(g.aprob + (antes - g.aprob) * 0.5, 5, 90);   // el consenso reparte el coste político de una ley impopular
      const pa = E.partidos[J.partido]; pa.cohesion = clamp((pa.cohesion || 60) - 0.8 * a.con, 5, 100);
      C.Personaje.cambiar(E, { prestigio: 2.5 - 0.3 * a.con, pop: 0.3 }, true); if (C.Mayorias) C.Mayorias.cambiarRel(E, a.socio, 8);
      g.estab = clamp(g.estab + 3, 0, 100); g.aprob = clamp(g.aprob + 0.5, 5, 90); C.Opinion.empujeES(E, J.partido, 0.06);
      pe.firmados.unshift({ tema: a.tema, t: E.fecha.t, socio: a.socio, con: a.con, ley: !!ley }); if (pe.firmados.length > 10) pe.firmados.length = 10;
      C.Noticias.poner(E, 'politica', `${Op.sg(E, g.partido)} y ${Op.sg(E, a.socio === g.partido ? J.partido : a.socio)} firman el ${T0.n.toLowerCase()}.`, 'ES');
      return { ok: true, msg: `¡Pacto firmado! ${T0.n}: ${txt || ''} La ley entra en vigor y ganas imagen de estadista.` };
    },
    romper(E, a) {
      const pe = Op.pe(E), T0 = TEMAS[a.tema]; pe.act = pe.act.filter(x => x !== a); if (C.Mayorias) C.Mayorias.cambiarRel(E, a.socio, -6);
      C.Noticias.poner(E, 'politica', `Se rompe la negociación del ${T0.n.toLowerCase()} entre ${Op.sg(E, E.paises.ES.gob.partido)} y ${Op.sg(E, a.socio === E.paises.ES.gob.partido ? E.jugador.partido : a.socio)}.`, 'ES');
      return { ok: true, exito: false, msg: `Se rompe la negociación del ${T0.n.toLowerCase()}: demasiados desencuentros.` };
    },
    abandonar(E, id) { const pe = Op.pe(E), a = pe.act.find(x => x.id === id); if (!a) return { ok: false, msg: 'Esa negociación ya no está abierta' }; pe.act = pe.act.filter(x => x !== a); return { ok: true, msg: `Abandonas la negociación del ${TEMAS[a.tema].n.toLowerCase()}.` }; },
    responder(E, id, si) {
      const pe = Op.pe(E), o = pe.ofertas.find(x => x.id === id); if (!o) return { ok: false, msg: 'La oferta ha caducado' }; pe.ofertas = pe.ofertas.filter(x => x !== o); const T0 = TEMAS[o.tema];
      if (!si) { if (C.Mayorias) C.Mayorias.cambiarRel(E, o.socio, -4); E.partidos[E.jugador.partido].cohesion = clamp((E.partidos[E.jugador.partido].cohesion || 60) + 1, 5, 100); return { ok: true, msg: `Rechazas el ${T0.n.toLowerCase()}: tu base aplaude.` }; }
      if (pe.act.length >= 2) return { ok: false, msg: 'Ya negocias dos pactos a la vez' }; pe.act.push({ id: U.id('pe'), tema: o.tema, socio: o.socio, t0: E.fecha.t, tRonda: -99, prog: 25, rup: 0, con: 0, hist: [] });
      return { ok: true, msg: `Aceptas negociar el ${T0.n.toLowerCase()} con ${Op.sg(E, o.socio)}.` };
    },
    /* Azar determinista por semana y partida: así las ofertas de la IA no alteran la secuencia aleatoria del resto del juego. */
    azar(E, clave) { let h = 2166136261; for (const ch of clave + '|' + (E.meta.semilla || 0) + '|' + E.fecha.t) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); let t = (h + 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    turnoPactos(E) {
      const pe = Op.pe(E), lado = Op.lado(E), t = E.fecha.t; pe.ofertas = pe.ofertas.filter(o => t - o.t0 < 6); pe.act = pe.act.filter(a => t - a.t0 < 26);
      if (!lado || E.meta.presim || E.esp.cortes.estado !== 'activa') return;
      const m = C.Mayorias ? C.Mayorias.asegurar(E) : { estilo: {} }, k = Op.socio(E); if (!k || pe.ofertas.length || pe.act.length >= 2 || t - pe.ult < COOL_PACTO) return;
      const e = m.estilo[k], p = { pactista: 0.012, institucional: 0.008, oportunista: 0.003, populista: 0.001, bloqueo: 0 }[e] || 0.003;
      if (Op.azar(E, 'oferta') < p) { const temas = Object.keys(TEMAS).filter(x => !pe.act.some(a => a.tema === x) && !Op.vigente(E, x)); if (!temas.length) return; const tema = temas[Math.floor(Op.azar(E, 'tema') * temas.length)]; pe.ofertas.push({ id: U.id('po'), tema, socio: k, t0: t }); C.Noticias.poner(E, 'politica', `${Op.sg(E, k)} propone un ${TEMAS[tema].n.toLowerCase()}.`, 'ES'); }
    },
    turno(E) { const J = E.jugador; if (!J || J.pais !== 'ES') return; Op.turnoSombra(E); Op.turnoPactos(E); }
  };

  /* ── Ganchos ── */
  const alf = Co.alFinalizar; Co.alFinalizar = function (E, p, ok) { const r = alf.apply(this, arguments); try { Op.alFinalizar(E, p, ok); } catch (e) { /* no debe romper la ley */ } return r; };
  // Al formar Gobierno, tu gabinete en la sombra se ofrece como primera opción en cada cartera
  const pool0 = Gab.pool;
  Gab.pool = function (E, key, cid, pp) {
    const r = pool0.apply(this, arguments), J = E.jugador, s = E.esp.opo && E.esp.opo.som; if (key !== 'central' || !s || !s.gab[cid] || !J || E.paises.ES.gob.pm !== 'J' || (pp && pp !== J.partido)) return r;
    const sm = s.gab[cid]; if (r.some(x => x.per === sm.per || x.pol === sm.per.id)) return r; r.unshift({ per: sm.per, actual: false, pol: null, sombra: true }); return r;
  };
  const nom0 = Gab.nombrar;
  Gab.nombrar = function (E, key, cid, cand) {
    const r = nom0.apply(this, arguments);
    if (key === 'central' && cand && cand.sombra && r && r.per) { r.per.expAnos = r.per.expAnos || {}; r.per.expAnos[cid] = Math.max(r.per.expAnos[cid] || 0, 2); const s = E.esp.opo && E.esp.opo.som; if (s) delete s.gab[cid]; }
    return r;
  };
  C.Tiempo.registrar('oposicion', { turno: E => Op.turno(E) }, 46);

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const opo = E => Op.razonOpo(E);
  R({ id: 'nombrar_sombra', nombre: 'Nombrar un ministro/a en la sombra', icono: '🎭', desc: 'Líder de la oposición: elige a quien replicará al ministro de una cartera y se preparará para gobernar contigo.', disponible: opo, ejecutar: (E, a) => Op.nombrar(E, a.min, +a.k) });
  R({ id: 'cesar_sombra', nombre: 'Cesar a un ministro/a en la sombra', icono: '🚪', costo: 0, desc: 'Retiras a quien llevaba una cartera en la sombra.', disponible: opo, ejecutar: (E, a) => Op.cesar(E, a.min) });
  R({ id: 'replica_sombra', nombre: 'Réplica del ministro/a en la sombra', icono: '🎤', desc: 'Tu ministro/a en la sombra se enfrenta al titular de la cartera: si es mejor, el Gobierno pierde apoyo y tu credibilidad sube (una vez cada tres semanas por cartera).', disponible: opo, ejecutar: (E, a) => Op.replica(E, a.min) });
  R({ id: 'contraprogramar', nombre: 'Contraprogramar una ley del Gobierno', icono: '📣', desc: 'Resta apoyo popular a una ley del Gobierno en trámite (denunciarla, presentar una alternativa o cambiar el foco): afecta a cómo la votan los grupos.', disponible: opo, ejecutar: (E, a) => Op.contraprogramar(E, a.id, a.modo) });
  R({ id: 'proponer_pacto_estado', nombre: 'Proponer un pacto de Estado', icono: '🤝', costo: 2, desc: 'Propones al otro lado (el Gobierno si lideras la oposición, la oposición si presides el Gobierno) negociar un gran pacto sobre un asunto de país. Al firmarse entra en vigor la ley.', disponible: E => Op.puedeProponer(E), ejecutar: (E, a) => Op.proponer(E, a.tema) });
  R({ id: 'negociar_pacto_estado', nombre: 'Una ronda de negociación del pacto de Estado', icono: '🗣', desc: 'Una ronda a la semana: ceder, buscar un punto medio o imponer condiciones.', disponible: E => Op.lado(E) ? true : 'Sólo quien lidera la oposición o preside el Gobierno', ejecutar: (E, a) => Op.ronda(E, a.id, a.linea) });
  R({ id: 'abandonar_pacto_estado', nombre: 'Abandonar una negociación de pacto de Estado', icono: '🚪', costo: 0, desc: 'Das por terminada una negociación abierta.', disponible: E => Op.lado(E) ? true : 'Sólo quien lidera la oposición o preside el Gobierno', ejecutar: (E, a) => Op.abandonar(E, a.id) });
  R({ id: 'responder_pacto_estado', nombre: 'Responder a una oferta de pacto de Estado', icono: '📨', costo: 0, desc: 'Aceptas negociar o rechazas la oferta del otro lado.', disponible: E => Op.lado(E) ? true : 'Sólo quien lidera la oposición o preside el Gobierno', ejecutar: (E, a) => Op.responder(E, a.id, a.ok === '1' || a.ok === 1 || a.ok === true) });
})(window.ESP);

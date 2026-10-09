/* Modo Partido (sede del partido): programa electoral, implantación territorial, finanzas, equipo de dirección, candidatos provinciales y campañas dirigidas.
   Estado: E.esp.sede = { pid, base, prog{area:k}, impl{prov}, pn0{prov}, equipo{org,camp,com}, pool{rol:[]}, cab{prov}, sat{g}, deuda, cd{}, hist[] }.
   Las finanzas del partido son pa.finanzas (1 punto ≈ 1,1 M€). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const ROLES = { org: ['🗂', 'Secretario/a de Organización', 'Hace crecer la implantación territorial y las cuotas.'], camp: ['📣', 'Director/a de campaña', 'Da impulso semanal en campaña.'], com: ['🎙', 'Jefe/a de comunicación', 'Mejora la imagen del partido semana a semana.'] };
  const TIPOS = { veterano: ['🧓', 'Veterano/a del partido', 'Sólido y sin riesgo.', 1, 0.015], promesa: ['🌱', 'Joven promesa', 'Poco al principio; crece con los años.', 1.5, 0.005], estrella: ['⭐', 'Fichaje estrella independiente', 'Gran tirón, pero arriesgado.', 8, 0.06] };
  const Sd = C.Sede = {
    ROLES, TIPOS,
    activo(E) { const J = E.jugador; return !!(J && J.pais === 'ES' && E.partidos[J.partido] && ['nac', 'reg'].includes(E.partidos[J.partido].amb)); },
    vista(E) { return !!E.meta.vistaPartido; },
    regional(E) { return E.partidos[E.jugador.partido].amb === 'reg'; },
    enRegion(E, prov) { const pa = E.partidos[E.jugador.partido]; return pa.amb !== 'reg' || !!(pa.rp && pa.rp[D().provincias[prov][1]]); },
    peso(E) { return ['lider', 'direccion'].includes(E.jugador.rol) ? true : 'Necesitas peso en la dirección del partido'; },
    provs(E) { const todas = Object.keys(D().provincias); if (!E || !Sd.regional(E)) return todas; return todas.filter(p => Sd.enRegion(E, p)); },
    asegurar(E) {
      const J = E.jugador; let s = E.esp.sede;
      if (s && s.pid === J.partido) return s;
      const pa = E.partidos[J.partido], agg = pa.popN || pa.pop || 1; s = E.esp.sede = { pid: J.partido, base: { eco: pa.eco, soc: pa.soc, eu: pa.eu, ter: pa.ter }, prog: {}, impl: {}, pn0: {}, equipo: { org: null, camp: null, com: null }, pool: {}, cab: {}, sat: {}, deuda: 0, cd: {}, hist: [] };
      for (const prov of Object.keys(D().provincias)) { if (!Sd.enRegion(E, prov)) { s.impl[prov] = 0; s.pn0[prov] = E.esp.pn[prov][J.partido] || 1; continue; } const v = (C.Es.votosProv(E, prov, 0)[J.partido]) || 0, r = Math.max(0.15, v / Math.max(0.5, agg)); const im = Math.round(clamp(25 + 25 * Math.log(Math.max(0.3, v) / 6), 3, 95)); s.impl[prov] = im; const pn = E.esp.pn[prov][J.partido] || 1; s.pn0[prov] = pn / (0.8 + 0.4 * im / 100); }
      return s;
    },
    nota(E, txt) { const s = Sd.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 20) s.hist.length = 20; },
    cost(E, pts) { const pa = E.partidos[E.jugador.partido]; if (pa.finanzas < pts) return false; pa.finanzas = Math.max(0, pa.finanzas - pts); return true; },
    millones(pa) { return Math.round(pa.finanzas * 1.1 * 10) / 10; },
    puede(E, id, sem) { const s = Sd.asegurar(E); return s.cd[id] != null && E.fecha.t - s.cd[id] < sem ? `Espera ${sem - (E.fecha.t - s.cd[id])} semana(s)` : true; },

    /* Empuja el apoyo del partido (nacional: puntos estatales; regional: puntos en sus comunidades). */
    empujar(E, pid, d) {
      const p = E.partidos[pid]; if (!p) return; if (p.amb !== 'reg') return C.Opinion.empujeES(E, pid, d);
      const k = 4; for (const r in p.rp) if (p.rp[r] > 0) { p.rp[r] = clamp(p.rp[r] + d * k, 0.3, 60); if (p.rp0) p.rp0[r] = clamp(p.rp0[r] + d * k * 0.3, 0.3, 60); }
    },

    /* ── Programa ── */
    ideologia(E) { const s = Sd.asegurar(E), sum = { eco: 0, soc: 0, eu: 0, ter: 0 }; for (const a of D().programa) { const k = s.prog[a.id], o = k && a.ops.find(x => x.k === k); if (o) for (const ax in sum) sum[ax] += o.v[ax]; } for (const ax in sum) sum[ax] = clamp(sum[ax], -35, 35); return sum; },
    enfasis(E) { const s = Sd.asegurar(E), e = {}; for (const a of D().programa) { const k = s.prog[a.id], o = k && a.ops.find(x => x.k === k); if (o) for (const w in o.w) e[w] = (e[w] || 0) + o.w[w]; } return e; },
    fijarPrograma(E, area, k) {
      const s = Sd.asegurar(E), a = D().programa.find(x => x.id === area), o = a && a.ops.find(x => x.k === k); if (!o) return { ok: false, msg: 'Medida desconocida' }; if (s.prog[area] === k) return { ok: false, msg: 'Ya es tu postura en esa área' };
      const ant = Sd.ideologia(E); s.prog[area] = k; const nue = Sd.ideologia(E), pa = E.partidos[E.jugador.partido], pi = C.PartidoInt.asegurar(E);
      for (const ax in nue) pa[ax] = clamp(s.base[ax] + nue[ax], -100, 100);
      const mov = Math.abs(nue.eco - ant.eco) + Math.abs(nue.soc - ant.soc) + Math.abs(nue.eu - ant.eu) + Math.abs(nue.ter - ant.ter);
      pa.cohesion = clamp(pa.cohesion - Math.min(6, mov / 14 * (1 + pi.fac.critico / 60)), 15, 99); pi.fac.critico = clamp(pi.fac.critico + mov / 20, 5, 60); pi.fac.oficial = 100 - pi.fac.barones - pi.fac.critico;
      s.cd['p_' + area] = E.fecha.t; Sd.nota(E, `Programa — ${a.n}: ${o.t}.`); C.Personaje.cambiar(E, { prestigio: 0.15 }, true);
      return { ok: true, msg: `Programa: «${o.t}». ${mov > 12 ? 'El giro ideológico inquieta a una parte del partido.' : 'Encaja con la línea del partido.'}` };
    },
    /* Efecto semanal del programa: los colectivos a los que «habla» te premian en apoyo. */
    efectoPrograma(E) {
      const s = Sd.asegurar(E), em = Sd.enfasis(E), GR = D().colectivos, sw = U.suma(Object.keys(GR).map(g => GR[g].peso)); let b = 0;
      for (const g in GR) { let x = 0; for (const k in em) x += (GR[g].w[k] || 0) * em[k]; b += GR[g].peso / sw * x * Math.max(0.2, C.Impacto.afinidad(E, g, E.jugador.partido)); }
      const n = Object.keys(s.prog).length; if (!n) return; Sd.empujar(E, E.jugador.partido, clamp(b * 0.007, -0.02, 0.018));
    },

    /* ── Promesas del programa: lo que se aprueba (gobernando) frente a lo que prometiste ── */
    cumplimiento(E) { const s = Sd.asegurar(E); s.cumpl = s.cumpl || {}; return s.cumpl; },
    fiabilidad(E) { const c = Sd.cumplimiento(E); let ok = 0, ko = 0; for (const a in c) { ok += c[a].ok; ko += c[a].ko; } return ok + ko ? ok / (ok + ko) : null; },
    evaluarLey(E, p) {
      const J = E.jugador; if (!J || !Sd.activo(E) || E.meta.presim) return null; const g = E.paises.ES.gob, mio = J.partido;
      const gobierna = g.partido === mio || (g.coalicion || []).includes(mio), autor = p.autor || {};
      if (!((gobierna && autor.tipo === 'gobierno') || autor.tipo === 'jugador')) return null;
      const s = Sd.asegurar(E), res = [];
      for (const a of D().programa) {
        const k = s.prog[a.id], o = k && a.ops.find(x => x.k === k); if (!o || !(a.sec || []).includes(p.s)) continue;
        let m = 0, n = 0; for (const ax of ['eco', 'soc', 'eu', 'ter']) { const v = o.v[ax] || 0, l = p[ax] || 0; if (!v) continue; n++; m += Math.sign(v) * Math.sign(l) * Math.min(Math.abs(v), 10) / 10 * Math.min(Math.abs(l), 60) / 60; }
        if (!n || Math.abs(m) < 0.12) continue; const c = Sd.cumplimiento(E); c[a.id] = c[a.id] || { ok: 0, ko: 0 };
        if (m > 0) { c[a.id].ok++; C.Personaje.cambiar(E, { prestigio: 0.5 }, true); Sd.empujar(E, mio, 0.05); res.push({ a, bien: true }); C.Noticias.poner(E, 'partido', `${E.partidos[mio].sigla} cumple su programa en ${a.n.toLowerCase()} con «${p.t}».`, 'ES'); }
        else { c[a.id].ko++; C.Personaje.cambiar(E, { prestigio: -1 }, true); E.partidos[mio].cohesion = clamp(E.partidos[mio].cohesion - 0.8, 15, 99); Sd.empujar(E, mio, -0.1); res.push({ a, bien: false }); C.Noticias.poner(E, 'partido', `«${p.t}» contradice el programa de ${E.partidos[mio].sigla} en ${a.n.toLowerCase()}: la oposición habla de promesa incumplida.`, 'ES'); }
        if (C.Dilemas) { C.Dilemas.asegurar(E).memoria.unshift({ id: U.id('mm'), t: E.fecha.t, tipo: 'crisis', txt: m > 0 ? `cumpliste tu programa en ${a.n.toLowerCase()}` : `aprobaste «${p.t}», contra tu programa de ${a.n.toLowerCase()}`, bien: m > 0, cobrado: false }); C.Dilemas.registrar(E, 'programa', (m > 0 ? 'Programa cumplido: ' : 'Programa incumplido: ') + a.n, m > 0 ? 1.5 : -2.5); }
        Sd.nota(E, (m > 0 ? '✔ ' : '✖ ') + `${a.n}: «${p.t}»`);
      }
      return res;
    },

    /* ── Encuestas por colectivo ── */
    estimarVoto(E, g) {
      const P = E.paises.ES, out = {}; let tot = 0;
      for (const k of P.partidos) { const p = E.partidos[k], sh = p.popN || p.pop || 0; if (sh < 0.3 || (p.amb === 'reg' && !p.popN)) continue; const w = sh * Math.pow(C.Impacto.afinidad(E, g, k), 2.2); out[k] = w; tot += w; }
      for (const k in out) out[k] = out[k] / (tot || 1) * 100; return out;
    },
    encuesta(E, tipo) {
      const s = Sd.asegurar(E), prop = tipo === 'propia'; if (prop && !Sd.cost(E, 2)) return { ok: false, msg: 'No hay caja (2 puntos de finanzas)' };
      const sd = prop ? 1.1 : 3, datos = {}; for (const g in D().colectivos) { const est = Sd.estimarVoto(E, g), r = {}; let t = 0; for (const k in est) { r[k] = Math.max(0.2, est[k] + U.gauss(0, sd)); t += r[k]; } for (const k in r) r[k] = r[k] / t * 100; datos[g] = r; }
      s.enc = { t: E.fecha.t, tipo, margen: prop ? 2 : 6, datos }; s.cd.enc = E.fecha.t; Sd.nota(E, prop ? 'Encuesta propia por colectivos.' : 'Barómetro por colectivos.'); return { ok: true, msg: prop ? 'Encargas una encuesta propia: margen de error ±2 puntos.' : 'Consultas el barómetro público: margen de error ±6 puntos.' };
    },

    /* ── Finanzas ── */
    balance(E) {
      const pa = E.partidos[E.jugador.partido], s = Sd.asegurar(E), sedes = Sd.provs(E).filter(p => s.impl[p] >= 30).length, sedeCoste = Sd.provs(E).reduce((a, p) => a + Math.max(0, s.impl[p] - 20) / 100 * 0.012, 0), eq = Object.values(s.equipo).filter(Boolean);
      const org = s.equipo.org ? 1 + s.equipo.org.comp / 20 : 1;
      const pop = pa.popN || pa.pop, cuotas = pa.militantes / 100000 * 0.08 * org, subv = pop / 100 * 0.6, don = 0;
      const base = 0.04 + 0.18 * clamp(pa.militantes / 200000, 0, 1) + 0.005 * pop, sed = sedeCoste, equ = eq.reduce((a, x) => a + 0.02 + x.comp * 0.006, 0), int = s.deuda * 0.004;
      return { cuotas, subv, don, base, sed, equ, int, sedes, ing: cuotas + subv + don, gas: base + sed + equ + int, neto: cuotas + subv + don - base - sed - equ - int };
    },
    credito(E) { const s = Sd.asegurar(E), pa = E.partidos[E.jugador.partido]; if (s.deuda >= 40) return { ok: false, msg: 'Los bancos no te dan más crédito' }; pa.finanzas = clamp(pa.finanzas + 15, 0, 99); s.deuda += 17; Sd.nota(E, 'Crédito bancario de 17 M€.'); return { ok: true, msg: 'Obtienes un crédito de 17 M€: caja al alza, pero pagarás intereses cada semana.' }; },
    amortizar(E) { const s = Sd.asegurar(E), pa = E.partidos[E.jugador.partido]; if (s.deuda <= 0) return { ok: false, msg: 'No tienes deuda' }; const x = Math.min(s.deuda, 8); if (pa.finanzas < x * 0.9 + 3) return { ok: false, msg: 'No hay caja para amortizar' }; pa.finanzas -= x * 0.9; s.deuda -= x; return { ok: true, msg: `Amortizas ${x} M€ de deuda.` }; },
    micro(E) { const pa = E.partidos[E.jugador.partido], a = E.jugador.atrib, g = 2.5 + a.carisma / 3 + U.gauss(0, 0.8); pa.finanzas = clamp(pa.finanzas + g, 0, 99); Sd.asegurar(E).cd.micro = E.fecha.t; pa.militantes += Math.round(pa.militantes * 0.004); return { ok: true, msg: `Una campaña de microdonaciones recauda ${Math.round(g * 1.1)} M€.` }; },

    /* ── Territorio ── */
    abrirSede(E, prov) {
      const s = Sd.asegurar(E), d = D().provincias[prov]; if (!d) return { ok: false, msg: 'Provincia desconocida' }; if (!Sd.cost(E, 2)) return { ok: false, msg: 'No hay caja (2 puntos de finanzas)' };
      const f = 1 + (s.equipo.org ? s.equipo.org.comp / 15 : 0); s.impl[prov] = clamp(s.impl[prov] + 9 * f, 0, 100); Sd.reaplicar(E); return { ok: true, msg: `Abres una sede en ${d[0]}: implantación ${Math.round(s.impl[prov])}.` };
    },
    planTerritorial(E, c) {
      const s = Sd.asegurar(E), ps = Sd.provs(E).filter(p => D().provincias[p][1] === c); if (!ps.length) return { ok: false, msg: 'Comunidad desconocida' }; if (!Sd.cost(E, 5)) return { ok: false, msg: 'No hay caja (5 puntos de finanzas)' };
      const f = 1 + (s.equipo.org ? s.equipo.org.comp / 15 : 0); ps.forEach(p => { s.impl[p] = clamp(s.impl[p] + 6 * f, 0, 100); }); Sd.reaplicar(E); return { ok: true, msg: `Plan territorial en ${D().ccaa[c].nombre}: refuerzas ${ps.length} provincia(s).` };
    },
    /* Convierte implantación y candidatos en el multiplicador de voto de cada provincia. */
    reaplicar(E) { const s = Sd.asegurar(E), pid = E.jugador.partido; for (const prov of Sd.provs(E)) { const cb = s.cab[prov] ? s.cab[prov].b : 0; E.esp.pn[prov][pid] = s.pn0[prov] * (0.8 + 0.4 * s.impl[prov] / 100) * (1 + cb); } },
    implMedia(E) { const s = Sd.asegurar(E), ps = Sd.provs(E); return U.suma(ps.map(p => s.impl[p] * D().provincias[p][3])) / U.suma(ps.map(p => D().provincias[p][3])); },

    /* ── Equipo ── */
    buscar(E, rol) {
      const s = Sd.asegurar(E), l = []; for (let i = 0; i < 3; i++) { const p = C.Mundo.persona('ES'); l.push({ n: p.n, g: p.g, comp: clamp(Math.round(U.gauss(6, 1.7)), 2, 10), leal: clamp(Math.round(U.gauss(6, 2)), 2, 10), amb: U.ri(1, 10) }); } s.pool[rol] = l; return l;
    },
    contratar(E, rol, idx) {
      const s = Sd.asegurar(E); if (!ROLES[rol]) return { ok: false, msg: 'Puesto desconocido' }; const c = (s.pool[rol] || [])[idx]; if (!c) return { ok: false, msg: 'Candidato no disponible' }; if (s.equipo[rol]) return { ok: false, msg: 'Ya tienes a alguien en ese puesto' };
      s.equipo[rol] = Object.assign({ desde: E.fecha.t }, c); s.pool[rol] = []; Sd.nota(E, `Fichas a ${c.n} como ${ROLES[rol][1].toLowerCase()}.`); return { ok: true, msg: `${c.n} se incorpora como ${ROLES[rol][1].toLowerCase()}.` };
    },
    despedir(E, rol) { const s = Sd.asegurar(E), x = s.equipo[rol]; if (!x) return { ok: false, msg: 'Puesto vacío' }; s.equipo[rol] = null; if (x.leal < 5 && U.chance(0.4)) { C.Noticias.poner(E, 'partido', `${x.n}, ex ${ROLES[rol][1].toLowerCase()} de ${E.partidos[E.jugador.partido].sigla}, carga contra la dirección.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.6 }, true); } return { ok: true, msg: `Cesas a ${x.n}.` }; },

    /* ── Candidatos ── */
    cabeza(E, prov) { const s = Sd.asegurar(E); if (s.cab[prov]) return s.cab[prov]; const pid = E.jugador.partido, m = E.parl.miembros.map(i => E.politicos[i]).filter(x => x && x.p === pid && x.prov === prov).sort((a, b) => b.c - a.c)[0]; return m ? { n: m.n, tipo: 'veterano', b: 0, auto: true } : null; },
    fichar(E, prov, tipo) {
      const s = Sd.asegurar(E), t = TIPOS[tipo], d = D().provincias[prov]; if (!t || !d) return { ok: false, msg: 'Opción no válida' }; if (!Sd.cost(E, t[3])) return { ok: false, msg: `No hay caja (${t[3]} puntos de finanzas)` };
      const p = C.Mundo.persona('ES'); s.cab[prov] = { n: p.n, tipo, b: t[4], t0: E.fecha.t, auto: false }; Sd.reaplicar(E); Sd.nota(E, `${p.n} será cabeza de lista por ${d[0]} (${t[1].toLowerCase()}).`); return { ok: true, msg: `${p.n} encabezará la lista por ${d[0]}: ${t[1].toLowerCase()}.` };
    },

    /* ── Estrategia: campaña dirigida a un colectivo ── */
    dirigida(E, g) {
      const s = Sd.asegurar(E), GR = D().colectivos, col = GR[g]; if (!col) return { ok: false, msg: 'Colectivo desconocido' }; if (!Sd.cost(E, 3)) return { ok: false, msg: 'No hay caja (3 puntos de finanzas)' };
      const sw = U.suma(Object.keys(GR).map(k => GR[k].peso)), af = C.Impacto.afinidad(E, g, E.jugador.partido), sat = s.sat[g] || 0, dc = s.equipo.camp ? 1 + s.equipo.camp.comp / 20 : 1, gan = 1.6 * col.peso / sw * af * dc * (1 - sat);
      s.sat[g] = clamp(sat + 0.35, 0, 0.9); s.cd['d_' + g] = E.fecha.t; Sd.empujar(E, E.jugador.partido, gan); Sd.nota(E, `Campaña dirigida a ${col.nombre.toLowerCase()}: +${U.d1(gan)} puntos.`);
      return { ok: true, msg: `Campaña dirigida a ${col.nombre.toLowerCase()}: ${gan > 0.08 ? '+' : '+'}${U.d1(gan)} puntos de apoyo${af < 0.35 ? ' (poca afinidad: rinde poco)' : ''}.` };
    },

    turno(E) {
      const J = E.jugador; if (!J || !Sd.activo(E) || E.meta.presim) return; const s = Sd.asegurar(E), pa = E.partidos[J.partido], t = E.fecha.t;
      Sd.efectoPrograma(E); { const fb = Sd.fiabilidad(E), g0 = E.paises.ES.gob; if (fb != null && (g0.partido === J.partido || (g0.coalicion || []).includes(J.partido))) Sd.empujar(E, J.partido, (fb - 0.5) * 0.004); } if (C.Tutor && E.meta.modoPartido) C.Tutor.una(E, 'sede');
      if (C.Dilemas && Sd.peso(E) === true && C.Dilemas.asegurar(E).act.length < 2 && !C.Dilemas.asegurar(E).act.some(x => x.id === 'donativo') && U.chance(0.004 + (pa.finanzas < 35 ? 0.008 : 0))) C.Dilemas.nuevo(E, 'donativo');
      const b = Sd.balance(E); pa.finanzas = clamp(pa.finanzas + b.neto, 0, 99);
      if (pa.finanzas < 6) { pa.cohesion = clamp(pa.cohesion - 0.12, 15, 99); if (t % 20 === 0) C.Noticias.poner(E, 'partido', `${pa.sigla} atraviesa dificultades de tesorería: impagos a proveedores y nóminas retrasadas.`, 'ES'); }
      if (s.deuda > 0) s.deuda = Math.max(0, s.deuda - 0.02);
      // Implantación y candidatos
      const og = s.equipo.org ? 0.025 * s.equipo.org.comp : 0; for (const p of Sd.provs(E)) { s.impl[p] = clamp(s.impl[p] + (s.impl[p] >= 25 ? og : 0) - 0.045, 2, 100); const cb = s.cab[p]; if (cb) { if (cb.tipo === 'promesa') cb.b = Math.min(0.03, cb.b + 0.0002); if (cb.tipo === 'estrella') { cb.b = Math.max(0.02, cb.b - 0.0004); if (U.chance(0.004)) { cb.b = -0.03; cb.tipo = 'polemico'; C.Noticias.poner(E, 'partido', `Polémica en ${D().provincias[p][0]}: el cabeza de lista de ${pa.sigla}, ${cb.n}, protagoniza un escándalo.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.5 }, true); } } } }
      Sd.reaplicar(E);
      // Equipo: comunicación, campaña, fugas
      if (s.equipo.com) Sd.empujar(E, J.partido, 0.0025 * s.equipo.com.comp);
      if (s.equipo.camp && C.Campana && C.Campana.activa(E)) C.Campana.mover(E, J.partido, 0.02 * s.equipo.camp.comp);
      for (const r in s.equipo) { const x = s.equipo[r]; if (x && U.chance(0.003 * (10 - x.leal) / 10 * (1 + x.amb / 10))) { s.equipo[r] = null; Sd.nota(E, `${x.n} abandona su puesto.`); C.Noticias.poner(E, 'partido', `${x.n} deja la dirección de ${pa.sigla} y se pasa al rival.`, 'ES'); C.Personaje.cambiar(E, { prestigio: -0.5 }, true); } }
      if (t % 26 === 0) for (const r in ROLES) if (!s.equipo[r]) Sd.buscar(E, r);
      for (const g in s.sat) s.sat[g] = Math.max(0, s.sat[g] - 0.012);
    }
  };
  const R = (id, nombre, icono, desc, costo, disp, ejecutar) => C.Acciones.registrar({ id, nombre, icono, desc, costo, grupo: 'partido', disponible: E => !Sd.activo(E) ? 'Sólo con un partido nacional en España' : disp(E), ejecutar });
  const dir = E => Sd.peso(E);
  R('fijar_programa', 'Fijar una postura del programa', '📜', 'Define la posición del partido en un área: mueve tu ideología y a qué colectivos hablas.', 1, E => dir(E), (E, a) => { const c = Sd.puede(E, 'p_' + (a && a.area), 26); if (c !== true) return { ok: false, msg: c }; return Sd.fijarPrograma(E, a && a.area, a && a.k); });
  R('abrir_sede', 'Abrir una sede provincial', '🏢', 'Refuerza la implantación del partido en una provincia (cuesta caja).', 1, E => dir(E), (E, a) => Sd.abrirSede(E, a && a.prov));
  R('plan_territorial', 'Plan territorial de una comunidad', '🗺', 'Refuerza todas las provincias de una comunidad.', 2, E => dir(E), (E, a) => Sd.planTerritorial(E, a && a.c));
  R('contratar_equipo', 'Fichar a un miembro del equipo', '🧑‍💼', 'Incorpora a un/a responsable de organización, campaña o comunicación.', 1, E => dir(E), (E, a) => Sd.contratar(E, a && a.rol, a && a.idx));
  R('despedir_equipo', 'Cesar a un miembro del equipo', '🚪', 'Libera el puesto (y ahorras su sueldo).', 0, E => dir(E), (E, a) => Sd.despedir(E, a && a.rol));
  R('buscar_equipo', 'Buscar nuevos perfiles', '🔎', 'Renueva los candidatos disponibles para un puesto.', 1, E => dir(E), (E, a) => { if (!ROLES[a && a.rol]) return { ok: false, msg: 'Puesto desconocido' }; Sd.buscar(E, a.rol); return { ok: true, msg: 'Nuevos perfiles disponibles.' }; });
  R('fichar_cabeza', 'Elegir cabeza de lista provincial', '🎯', 'Veterano, joven promesa o fichaje estrella: cada uno con su coste y riesgo.', 1, E => dir(E), (E, a) => Sd.fichar(E, a && a.prov, a && a.tipo));
  R('campana_dirigida', 'Campaña dirigida a un colectivo', '🎯', 'Mensaje y gasto para un colectivo social: rinde según tu afinidad con él.', 1, E => dir(E), (E, a) => { const c = Sd.puede(E, 'd_' + (a && a.g), 6); if (c !== true) return { ok: false, msg: c }; return Sd.dirigida(E, a && a.g); });
  R('encuesta_colectivos', 'Encuesta por colectivos', '📊', 'Barómetro público (gratis, ±6 puntos) o encuesta propia (2 puntos de finanzas, ±2): cómo vota cada colectivo.', 1, E => { const c = Sd.puede(E, 'enc', 4); return c !== true ? c : dir(E); }, (E, a) => Sd.encuesta(E, a && a.tipo === 'propia' ? 'propia' : 'barometro'));
  R('credito_partido', 'Pedir un crédito al banco', '🏦', 'Caja inmediata a cambio de deuda con intereses.', 1, E => dir(E), E => Sd.credito(E));
  R('amortizar_deuda', 'Amortizar deuda', '💳', 'Devuelves parte de la deuda con la caja del partido.', 1, E => dir(E), E => Sd.amortizar(E));
  R('microdonaciones', 'Campaña de microdonaciones', '🪙', 'Pides pequeñas aportaciones a militantes y simpatizantes.', 1, E => { const c = Sd.puede(E, 'micro', 8); return c !== true ? c : true; }, E => Sd.micro(E));
  if (C.Congreso) { const f0 = C.Congreso.alFinalizar; C.Congreso.alFinalizar = function (E, p, ok) { const r = f0.apply(this, arguments); if (ok) { try { Sd.evaluarLey(E, p); } catch (e) { console.error('[sede]', e); } } return r; }; }
  C.Tiempo.registrar('sede', { turno: Sd.turno, postInit: E => { if (E.jugador && E.meta.modoPartido && E.ui) E.ui.pantalla = 'sede'; } }, 39);
})(window.ESP);

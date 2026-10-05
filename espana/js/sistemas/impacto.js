/* Impacto de las leyes (estilo Lawgivers II / Geopolitical Simulator 6).
   Cada ley se diseña (alcance, enfoque, financiación, calendario), tiene un informe de impacto previo, entra en vigor
   de forma gradual, mueve 12 indicadores del país y la satisfacción de 11 grupos sociales, puede tener efectos no
   deseados y se evalúa al cabo de un año. Los grupos descontentos mueven la aprobación del Gobierno y el voto. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const MULT = [0.6, 1, 1.5], MCOST = [0.65, 1, 1.45];
  /* Qué indicadores empuja el rendimiento de cada ministerio (puntos de indicador por punto de rendimiento sobre 55). */
  const MIN_IND = { sal: ['sal'], edu: ['edu'], int: ['seg'], jus: ['lib', 'inst'], hac: ['inst'], viv: ['viv'], amb: ['amb', 'ener'], agr: ['rur'], tpt: ['rur'], tra: ['prot', 'igual'], inc: ['prot'], dso: ['igual'], cie: ['comp'], ind: ['comp'], eco: ['comp'], dig: ['comp'], ter: ['coh'], pre: ['lib', 'inst'], igu: ['lib'], def: ['seg'] };
  const NOMBRES_G = k => (D().colectivos[k] || { nombre: k }).nombre;

  const Im = {
    MULT, MCOST,

    /* ── Estado ── */
    asegurar(E) { if (!E.esp.soc || !E.esp.vigor) Im.init(E); return E.esp.soc; },
    init(E) {
      const ind = {}, base = {}, off = {}, sat = {};
      for (const k in D().indicadores) { base[k] = D().indicadores[k].base + U.gauss(0, 1.5); ind[k] = base[k]; off[k] = 0; }
      for (const g in D().colectivos) sat[g] = 50;
      E.esp.soc = { ind, base, off, sat, clima: 0, ult: 0 };
      E.esp.vigor = [];
      Im.recalcular(E, true);
    },
    postInit(E) { if (E.esp) Im.asegurar(E); },

    /* ── Diseño de una ley ── */
    norm(tpl, dis) {
      const imp = D().impactos[tpl.id] || {};
      const d = Object.assign({ alc: 1, enf: null, fin: 'deficit', grad: false }, dis || {});
      d.alc = clamp(Math.round(+d.alc), 0, 2);
      if (d.enf && !(imp.enf || []).some(x => x.id === d.enf)) d.enf = null;
      if (!(tpl.costo > 0.04)) d.fin = 'deficit';
      return d;
    },

    /* Parámetros que se derivan del diseño: posición ideológica, apoyo, coste, impactos, calendario y riesgos. */
    parametros(tpl, dis, ajuste) {
      dis = Im.norm(tpl, dis);
      const imp = D().impactos[tpl.id] || {}, a = dis.alc, m = MULT[a], mc = MCOST[a];
      const v = dis.enf ? (imp.enf || []).find(x => x.id === dis.enf) : null;
      const sum = (x, y) => { const r = Object.assign({}, x); for (const k in (y || {})) r[k] = (r[k] || 0) + y[k]; return r; };
      let ind = sum(imp.ind, v && v.ind), gr = sum(imp.gr, v && v.gr), ec = {};
      for (const k in (tpl.ef || {})) if (k !== 'aprob') ec[k] = tpl.ef[k] * 0.5;
      ec = sum(ec, v && v.ec);
      const costoBase = (tpl.costo || 0) + (v && v.costo || 0), costo = costoBase * mc;
      for (const k in ind) ind[k] *= m; for (const k in gr) gr[k] *= m; for (const k in ec) ec[k] *= m;
      ec.deficit = (ec.deficit || 0) + costo * 0.4;
      let pop = tpl.pop + (v && v.pop || 0);
      const pos = { eco: tpl.eco, soc: tpl.soc, eu: tpl.eu || 0, ter: tpl.ter || 0 };
      if (v && v.pos) { pos.eco += v.pos[0]; pos.soc += v.pos[1]; pos.eu += v.pos[2]; pos.ter += v.pos[3]; }
      if (ajuste) for (const k in ajuste) pos[k] = (pos[k] || 0) + ajuste[k];
      for (const k of ['eco', 'soc', 'eu', 'ter']) pos[k] = clamp(pos[k] * (1 + (a - 1) * 0.22) + Math.sign(pos[k]) * (a - 1) * 5, -100, 100);
      pop += (a - 1) * (pop >= 55 ? 2 : -4);
      let costoEf = costo;
      if (costo > 0.04) {
        if (dis.fin === 'impuestos') { ec.deficit -= costo * 0.4; ec.crec = (ec.crec || 0) - 0.3 * costo; gr.med = (gr.med || 0) - 2.5 * costo; gr.emp = (gr.emp || 0) - 3 * costo; gr.aut = (gr.aut || 0) - 2.5 * costo; pop -= 4; pos.eco -= 8; costoEf = 0; }
        else if (dis.fin === 'recorte') { ec.deficit -= costo * 0.4; ind.prot = (ind.prot || 0) - 2.5 * costo; ind.sal = (ind.sal || 0) - costo; gr.fun = (gr.fun || 0) - 4 * costo; gr.pen = (gr.pen || 0) - 1.5 * costo; pop -= 3; pos.eco += 8; costoEf = 0; }
      }
      if (dis.grad) pop += 2;
      const secs = (imp.sec || []).map(s => Object.assign({}, s, { p: clamp(s.p * [0.5, 1, 1.5][a] * (dis.grad ? 0.75 : 1) * (dis.fin === 'recorte' ? 1.1 : 1), 0, 0.95) }));
      return {
        eco: Math.round(pos.eco), soc: Math.round(pos.soc), eu: Math.round(pos.eu), ter: Math.round(pos.ter), pop: Math.round(clamp(pop, 5, 95)), costo: Math.round(costoEf * 1000) / 1000,
        costoTotal: costo, ind, gr, ec, r: Math.round((imp.r || 26) * (dis.grad ? 2 : 1)), u: (imp.u || 0.3) * (a === 2 ? 1.2 : a === 0 ? 0.8 : 1), secs, dis
      };
    },

    /* Campos de un proyecto de ley derivados de su diseño. */
    campos(tpl, dis, ajuste) { const p = Im.parametros(tpl, dis, ajuste); return { eco: p.eco, soc: p.soc, eu: p.eu, ter: p.ter, pop: p.pop, costo: p.costo }; },

    /* Proyecto «de mentira» con un diseño dado, para proyectar votos antes de registrarlo. */
    pseudo(E, tpl, autor, dis, ajuste) {
      const par = Im.parametros(tpl, dis, ajuste);
      return { tpl: tpl.id, t: tpl.t, s: tpl.s, eco: par.eco, soc: par.soc, eu: par.eu, ter: par.ter, pop: par.pop, costo: par.costo, may: tpl.may || 'simple', autor, apoyo: {}, region: tpl.region || null, dis: par.dis, ajuste: ajuste || null };
    },

    /* Diseño por defecto de las iniciativas de la IA, según su ideología y la situación fiscal. */
    disDefecto(E, tpl, autor) {
      const dis = { alc: 1, enf: null, fin: 'deficit', grad: false };
      if (!autor || autor.tipo === 'jugador' || tpl.manual) return dis;
      const g = E.paises.ES.gob, pa = autor.pid && E.partidos[autor.pid] ? E.partidos[autor.pid] : (g && E.politicos[g.pm]) || null;
      if (!pa) return dis;
      const d = U.distIdeo(pa, tpl), imp = D().impactos[tpl.id] || {};
      if (d < 0.22 && U.chance(0.4)) dis.alc = 2; else if (d > 0.5 && U.chance(0.5)) dis.alc = 0;
      if ((imp.enf || []).length && U.chance(0.55)) {
        let mejor = null, md = U.distIdeo(pa, tpl);
        for (const v of imp.enf) { const dd = U.distIdeo(pa, { eco: tpl.eco + v.pos[0], soc: tpl.soc + v.pos[1], eu: (tpl.eu || 0) + v.pos[2], ter: (tpl.ter || 0) + v.pos[3] }); if (dd < md - 0.03) { md = dd; mejor = v; } }
        if (mejor) dis.enf = mejor.id;
      }
      if (tpl.costo > 0.1) {
        const deficit = E.paises.ES.ec.deficit;
        if (deficit > 3.2 || pa.eco > 25) dis.fin = U.chance(0.6) ? 'recorte' : 'deficit';
        else if (pa.eco < -25 && U.chance(0.45)) dis.fin = 'impuestos';
        if (tpl.costo > 0.4 && U.chance(0.35)) dis.grad = true;
      }
      return Im.norm(tpl, dis);
    },

    /* ── Informe de impacto previo (lo que prevé el Gobierno antes de aprobar) ── */
    informe(E, tplId, dis, ajuste) {
      Im.asegurar(E);
      const tpl = C.Congreso.plantilla(tplId), par = Im.parametros(tpl, dis, ajuste), S = E.esp.soc, pib = E.paises.ES.ec.pib || 1600;
      const ind = Object.keys(par.ind).filter(k => Math.abs(par.ind[k]) >= 0.2).map(k => ({ k, d: par.ind[k], actual: S.ind[k] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      const gr = Object.keys(D().colectivos).map(g => ({ k: g, d: par.gr[g] || 0 })).filter(x => Math.abs(x.d) >= 0.4).sort((a, b) => b.d - a.d);
      const riesgos = par.secs.map(s => ({ t: s.t, p: s.p, nivel: s.p >= 0.5 ? 'probable' : s.p >= 0.25 ? 'posible' : 'improbable' })).sort((a, b) => b.p - a.p);
      return { par, ind, gr, ec: par.ec, riesgos, anual: par.costoTotal / 100 * pib, anualEf: par.costo / 100 * pib, pib, r: par.r, u: par.u };
    },

    /* ── Entrada en vigor, reforma y derogación ── */
    /* Promulga una ley (o un decreto-ley): empieza a producir efectos de forma gradual. */
    promulgar(E, p, o) {
      Im.asegurar(E);
      const tpl = C.Congreso.plantilla(p.tpl); if (!tpl || p.pge) return null;
      const par = Im.parametros(tpl, p.dis, p.ajuste), g = E.paises.ES.gob;
      // Un buen ministro del ramo mejora la ejecución; el azar y la incertidumbre del informe hacen el resto
      let sesgo = 0;
      try { const m = D().ministerios.find(x => x.sector === tpl.s); if (m && g && C.Gabinete) sesgo = (C.Gabinete.rendDe(E, 'central', m.id) - 55) / 250; } catch (e) { sesgo = 0; }
      const real = clamp(1 + sesgo + U.gauss(0, par.u * 0.6), 0.4, 1.8);
      const secs = par.secs.filter(s => U.chance(s.p)).map(s => ({ t: s.t, due: E.fecha.t + s.w, ind: s.ind || {}, gr: s.gr || {}, ec: s.ec || {}, apT: null }));
      // Una versión nueva de una ley ya vigente la sustituye (los efectos no se acumulan)
      const previa = E.esp.vigor.find(x => x.tpl === p.tpl && x.estado === 'activa' && (x.region || null) === (p.region || null));
      if (previa) Im.derogar(E, previa.id, 'sustituida');
      const v = { id: U.id('I'), tpl: p.tpl, t: p.t || tpl.t, t0: E.fecha.t, dis: par.dis, autor: p.autor, rdl: !!p.rdl, region: p.region || null,
        prev: { ind: par.ind, gr: par.gr, ec: par.ec, costo: par.costoTotal }, real, r: par.r, secs, ecAp: {}, estado: 'activa', tFin: null, eval: null, proy: p.id };
      E.esp.vigor.unshift(v);
      if (E.esp.vigor.length > 120) E.esp.vigor.length = 120;
      const ef = tpl.ef || {};
      if (ef.aprob && g) g.aprob = clamp(g.aprob + ef.aprob * (par.dis.alc === 2 ? 1.2 : par.dis.alc === 0 ? 0.6 : 1), 5, 90);
      Im.recalcular(E, false);
      return v;
    },

    /* Deroga una ley en vigor: sus efectos se disuelven poco a poco. */
    derogar(E, id, motivo) {
      Im.asegurar(E);
      const v = E.esp.vigor.find(x => x.id === id && x.estado === 'activa'); if (!v) return false;
      v.estado = 'derogada'; v.tFin = E.fecha.t; v.motivo = motivo || 'derogada';
      return true;
    },
    derogarPorProyecto(E, p) {   // al aprobarse un decreto-ley que cae o una derogación
      const v = (E.esp.vigor || []).find(x => x.proy === p.id && x.estado === 'activa'); if (v) Im.derogar(E, v.id, 'decreto-ley derogado');
    },
    /* Rampa de implantación 0..1 (suave). */
    rampa(v, t) { const x = clamp((t - v.t0) / Math.max(1, v.r), 0, 1); return x * x * (3 - 2 * x); },
    factor(v, t) { return v.estado === 'activa' ? Im.rampa(v, t) : Im.rampa(v, v.tFin) * (1 - clamp((t - v.tFin) / 26, 0, 1)); },
    /* Contribución de las leyes (y sus efectos secundarios) a un indicador o grupo. */
    suma(E, tipo, k, t) {
      let s = 0;
      for (const v of E.esp.vigor) {
        const f = Im.factor(v, t); if (f <= 0) continue;
        if (v.prev[tipo] && v.prev[tipo][k]) s += v.prev[tipo][k] * v.real * f;
        for (const x of v.secs) if (x.apT != null && x[tipo][k]) s += x[tipo][k] * clamp((t - x.apT) / 13, 0, 1) * (v.estado === 'activa' ? 1 : 1 - clamp((t - v.tFin) / 26, 0, 1));
      }
      return s;
    },
    /* Rendimientos decrecientes: acumular muchas leyes en el mismo sentido satura el efecto. */
    sat(x, K) { return K * Math.tanh(x / K); },
    /* Ministros del ramo: un titular brillante mejora el indicador de su sector. */
    ministros(E) {
      const r = {}, g = E.paises.ES.gob; if (!g || !C.Gabinete) return r;
      for (const m of D().ministerios) {
        const ks = MIN_IND[m.id]; if (!ks) continue;
        let rend = 55; try { rend = C.Gabinete.rendDe(E, 'central', m.id); } catch (e) { rend = 55; }
        for (const k of ks) r[k] = (r[k] || 0) + (rend - 55) * 0.05 * m.peso / 8 / ks.length * 1.5;
      }
      for (const k in r) r[k] = clamp(r[k], -5, 5);
      return r;
    },

    /* ── Cálculo semanal ── */
    recalcular(E, inicial) {
      const S = E.esp.soc, t = E.fecha.t, ec = E.paises.ES.ec, b = ec.base, g = E.paises.ES.gob;
      const dev = { crec: ec.crec - b.crec, paro: ec.paro - b.paro, infl: ec.infl - b.infl, deficit: ec.deficit - b.deficit };
      const mins = inicial ? {} : Im.ministros(E);
      for (const k in S.ind) {
        let acop = 0; const A = D().acoplamiento[k] || {}; for (const e in A) acop += A[e] * dev[e];
        const tgt = clamp(S.base[k] + S.off[k] + acop + (mins[k] || 0) + Im.sat(Im.suma(E, 'ind', k, t), 16), 2, 98);
        S.ind[k] = inicial ? tgt : S.ind[k] + (tgt - S.ind[k]) * 0.1;
        S.tgt = S.tgt || {}; S.tgt[k] = tgt;
      }
      const pm = g && E.politicos[g.pm];
      let tot = 0, sw = 0;
      for (const gk in D().colectivos) {
        const G = D().colectivos[gk];
        let x = 0; for (const k in G.w) x += G.w[k] * (S.ind[k] - S.base[k]) * 0.7;
        for (const e in G.ec) x += G.ec[e] * dev[e] * 2.5;
        x += Im.suma(E, 'gr', gk, t);
        x = Im.sat(x, 26);
        const align = pm ? clamp((0.3 - U.distIdeo(G, pm)) * 30, -9, 9) : 0;
        const tgt = clamp(50 + align + x, 3, 97);
        S.sat[gk] = inicial ? tgt : S.sat[gk] + (tgt - S.sat[gk]) * 0.08 + U.gauss(0, 0.2);
        tot += G.peso * (S.sat[gk] - 50); sw += G.peso;
      }
      S.clima = sw ? tot / sw : 0;
    },

    turno(E) {
      Im.asegurar(E);
      const S = E.esp.soc, t = E.fecha.t, ec = E.paises.ES.ec;
      for (const k in S.off) S.off[k] += U.gauss(0, 0.12) - S.off[k] * 0.02;
      if (E.esp.corona) E.esp.corona.apoyo += (58 - E.esp.corona.apoyo) * 0.004;
      // Economía: la parte económica de cada ley se incorpora a medida que se implanta
      for (const v of E.esp.vigor) {
        const f = Im.factor(v, t);
        const frac = v.estado === 'activa' ? f : f;   // al derogarse f baja y se revierte
        const dEc = {};
        for (const k in v.prev.ec) { const total = v.prev.ec[k] * v.real; const ya = v.ecAp[k] || 0, ahora = total * frac; if (Math.abs(ahora - ya) > 1e-6) { dEc[k] = ahora - ya; v.ecAp[k] = ahora; } }
        for (const x of v.secs) {
          if (x.apT == null && t >= x.due && v.estado === 'activa') { x.apT = t; Im.efectoSecundario(E, v, x); }
          if (x.apT != null && x.ec) for (const k in x.ec) { const fx = x.ec[k] * clamp((t - x.apT) / 13, 0, 1) * (v.estado === 'activa' ? 1 : 1 - clamp((t - v.tFin) / 26, 0, 1)); const key = 's:' + k + ':' + x.due; const ya = v.ecAp[key] || 0; if (Math.abs(fx - ya) > 1e-6) { dEc[k] = (dEc[k] || 0) + fx - ya; v.ecAp[key] = fx; } }
        }
        if (Object.keys(dEc).length) C.Economia.aplicar(E, 'ES', dEc);
        // Evaluación al año de la entrada en vigor
        if (!v.eval && v.estado === 'activa' && t - v.t0 >= Math.max(52, v.r + 13)) Im.evaluar(E, v);
      }
      Im.recalcular(E, false);
      // Un colectivo muy descontento sale a la calle
      for (const gk in S.sat) if (S.sat[gk] < 30 && U.chance(0.012) && (!S.ultProt || t - (S.ultProt[gk] || -99) > 26)) {
        S.ultProt = S.ultProt || {}; S.ultProt[gk] = t; const G = D().colectivos[gk], g = E.paises.ES.gob;
        C.Noticias.poner(E, 'politica', `Protestas de ${G.nombre.toLowerCase()} contra la política del Gobierno: ${U.pick(['manifestaciones en las principales ciudades', 'concentraciones frente al Congreso', 'una jornada de movilizaciones', 'cortes de carreteras y huelgas'])}.`, 'ES');
        if (g) g.aprob = clamp(g.aprob - 0.6, 5, 90);
      }
      if (t % 4 === 0) { for (const k in S.ind) U.serie('ind:' + k, S.ind[k], 260); for (const gk in S.sat) U.serie('sat:' + gk, S.sat[gk], 260); U.serie('clima', S.clima, 260); }
      // Las leyes derogadas hace tiempo salen de la lista de activas
      if (t % 26 === 0) E.esp.vigor = E.esp.vigor.filter(v => v.estado === 'activa' || t - v.tFin < 520);
    },

    efectoSecundario(E, v, x) {
      C.Noticias.poner(E, 'politica', `Efecto no deseado de «${v.t}»: ${x.t.toLowerCase()}.`, 'ES');
      const J = E.jugador;
      if (J && (J.cargo === 'pm' || (v.autor && v.autor.tipo === 'jugador'))) C.Eventos.info(E, '⚠️ Efecto no deseado', `«${v.t}» tiene una consecuencia imprevista: ${x.t}.`);
    },

    /* Balance de una ley un año después: ¿ha cumplido lo previsto? */
    evaluar(E, v) {
      const g = E.paises.ES.gob, rf = v.real, nSec = v.secs.filter(s => s.apT != null).length;
      const puntos = rf - nSec * 0.08;
      const res = puntos >= 1.15 ? ['mejor', 'Mejor de lo previsto'] : puntos >= 0.85 ? ['previsto', 'Según lo previsto'] : puntos >= 0.6 ? ['peor', 'Peor de lo previsto'] : ['fracaso', 'Un fracaso'];
      v.eval = { t: E.fecha.t, r: res[0], txt: res[1], puntos: Math.round(puntos * 100) / 100 };
      const ap = v.autor && v.autor.pid; const delta = (puntos - 1);
      if (g && v.autor && v.autor.tipo === 'gobierno') g.aprob = clamp(g.aprob + delta * 2.2, 5, 90);
      if (ap && E.partidos[ap] && E.partidos[ap].amb === 'nac' && C.Opinion.empujeES) C.Opinion.empujeES(E, ap, delta * 0.35);
      C.Noticias.poner(E, 'politica', `Balance de «${v.t}» a un año: ${res[1].toLowerCase()}.`, 'ES');
      const J = E.jugador;
      if (J && v.autor && v.autor.tipo === 'jugador') { C.Personaje.cambiar(E, { prestigio: delta * 6 }, true); C.Personaje.log(E, `Balance a un año de tu ley «${v.t}»: ${res[1].toLowerCase()}.`); }
    },

    /* ── Resúmenes para la interfaz ── */
    /* Valor actual y cambio desde el inicio de cada indicador, con las leyes que más lo mueven. */
    indicadores(E) {
      Im.asegurar(E);
      const S = E.esp.soc, t = E.fecha.t;
      return Object.keys(D().indicadores).map(k => {
        const dat = D().indicadores[k];
        const leyes = E.esp.vigor.map(v => ({ v, e: ((v.prev.ind[k] || 0) * v.real * Im.factor(v, t)) })).filter(x => Math.abs(x.e) >= 0.15).sort((a, b) => Math.abs(b.e) - Math.abs(a.e)).slice(0, 4);
        return { k, nombre: dat.nombre, icono: dat.icono, d: dat.d, v: S.ind[k], base: S.base[k], tgt: S.tgt ? S.tgt[k] : S.ind[k], dif: S.ind[k] - S.base[k], leyes };
      });
    },
    grupos(E) {
      Im.asegurar(E);
      const S = E.esp.soc, t = E.fecha.t;
      return Object.keys(D().colectivos).map(k => {
        const G = D().colectivos[k];
        const leyes = E.esp.vigor.map(v => ({ v, e: ((v.prev.gr[k] || 0) * v.real * Im.factor(v, t)) })).filter(x => Math.abs(x.e) >= 0.3).sort((a, b) => Math.abs(b.e) - Math.abs(a.e)).slice(0, 3);
        return { k, nombre: G.nombre, icono: G.icono, peso: G.peso, v: S.sat[k], leyes };
      });
    },
    /* Cercanía ideológica de un grupo a un partido (0..1). */
    afinidad(E, gk, pid) { const p = E.partidos[pid]; return p ? Math.exp(-3.2 * U.distIdeo(D().colectivos[gk], p)) : 0; },

    /* ── Enmiendas: lo que pide cada grupo parlamentario para apoyar el texto ── */
    candidatos(tpl, dis) {
      const imp = D().impactos[tpl.id] || {}, c = [], d = dis;
      if (d.alc < 2) c.push({ k: 'alc', v: d.alc + 1, n: 'ampliar el alcance' });
      if (d.alc > 0) c.push({ k: 'alc', v: d.alc - 1, n: 'rebajar el alcance' });
      for (const e of [null].concat((imp.enf || []).map(x => x.id))) if (e !== d.enf) c.push({ k: 'enf', v: e, n: e ? 'adoptar el enfoque «' + imp.enf.find(x => x.id === e).n + '»' : 'volver al enfoque estándar' });
      if (tpl.costo > 0.04) for (const f of ['deficit', 'impuestos', 'recorte']) if (f !== d.fin) c.push({ k: 'fin', v: f, n: 'financiarla ' + D().financiaciones.find(x => x.id === f).n.toLowerCase() });
      c.push({ k: 'grad', v: !d.grad, n: d.grad ? 'aplicarla de inmediato' : 'aplicarla de forma gradual' });
      return c;
    },
    enmiendas(E, p) {
      const tpl = C.Congreso.plantilla(p.tpl), P = E.paises.ES, Co = C.Congreso;
      if (!tpl || tpl.manual) return [];
      const dis = Im.norm(tpl, p.dis), cand = Im.candidatos(tpl, dis), res = [];
      const ap = p.autor.tipo === 'jugador' ? E.jugador.partido : p.autor.pid;
      const base = Co.proyectar(E, p);
      const proy = cd => { const nd = Object.assign({}, dis); nd[cd.k] = cd.v; return Im.pseudo(E, tpl, p.autor, nd, p.ajuste); };
      const pseudos = cand.map(cd => ({ cd, q: Object.assign(proy(cd), { apoyo: p.apoyo, pacto: p.pacto }) }));
      for (const pid of P.partidos) {
        if ((P.escanos[pid] || 0) < 3 || pid === ap) continue;
        const ya = Co.postura(E, pid, p); if (ya.voto === 'si') continue;
        let mejor = null;
        for (const x of pseudos) { const s = Co.postura(E, pid, x.q).s; const g = s - ya.s; if (g > 0.12 && (!mejor || g > mejor.g)) mejor = { x, g, s }; }
        if (!mejor) continue;
        const pr = Co.proyectar(E, Object.assign({}, p, { dis: mejor.x.q.dis, eco: mejor.x.q.eco, soc: mejor.x.q.soc, eu: mejor.x.q.eu, ter: mejor.x.q.ter, pop: mejor.x.q.pop, costo: mejor.x.q.costo }));
        res.push({ pid, cambio: { k: mejor.x.cd.k, v: mejor.x.cd.v }, texto: mejor.x.cd.n, gana: pr.dist - base.dist, nuevaDist: pr.dist, voto: Co.postura(E, pid, mejor.x.q).voto, esc: P.escanos[pid] });
      }
      return res.sort((a, b) => b.gana - a.gana).slice(0, 5);
    },
    aplicarEnmienda(E, p, cambio) {
      const tpl = C.Congreso.plantilla(p.tpl), dis = Im.norm(tpl, Object.assign({}, p.dis, { [cambio.k]: cambio.v }));
      Im.reparametrizar(E, p, dis);
      p.enm = (p.enm || 0) + 1;
    },
    reparametrizar(E, p, dis) {
      const tpl = C.Congreso.plantilla(p.tpl);
      p.dis = Im.norm(tpl, dis); Object.assign(p, Im.campos(tpl, p.dis, p.ajuste));
    },

    /* Plantillas con una ley vigente (no se vuelven a proponer: se reforman o se derogan). */
    vigentes(E) { Im.asegurar(E); return new Set(E.esp.vigor.filter(v => v.estado === 'activa').map(v => v.tpl)); },

    /* Lista de leyes en vigor para la interfaz. */
    enVigor(E) { Im.asegurar(E); return E.esp.vigor.filter(v => v.estado === 'activa'); }
  };

  C.Impacto = Im;
  C.Tiempo.registrar('impacto', Im, 12);
})(window.ESP);

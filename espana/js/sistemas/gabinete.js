/* Gabinete: ministros del Gobierno, consejeros autonómicos y concejales de gobierno como PERSONAS con atributos
   (gestión, carisma, integridad, lealtad, ambición, especialidad). Su rendimiento mueve la economía, la aprobación y la
   satisfacción de los socios; el presidente (o el jugador) los elige, los cesa y gestiona escándalos y cuotas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA;
  const clamp = U.clamp;

  /* Sector de cada cargo → especialidad universal */
  const ESP_CENTRAL = { ins: 'ins', eco: 'eco', ext: 'ext', seg: 'seg', ter: 'ter', soc: 'soc', amb: 'amb', agr: 'agr', sal: 'sal', edu: 'edu', dig: 'dig' };
  const ESP_AUT = { pre: 'ins', eco: 'eco', edu: 'edu', sal: 'sal', int: 'seg', ter: 'ter', amb: 'amb', emp: 'soc', cul: 'edu', uni: 'edu', soc: 'soc', jus: 'seg', ind: 'eco', agr: 'agr', mov: 'ter' };
  const ESP_MUNI = { urb: 'ter', mov: 'ter', seg: 'seg', ser: 'amb', soc: 'soc', cul: 'edu', hac: 'eco' };
  const TODAS = ['eco', 'soc', 'seg', 'ext', 'amb', 'agr', 'sal', 'edu', 'ter', 'ins', 'dig'];
  const NOM_ESP = { eco: 'Economía', soc: 'Social y empleo', seg: 'Seguridad y justicia', ext: 'Exteriores', amb: 'Medio ambiente y energía', agr: 'Agricultura', sal: 'Sanidad', edu: 'Educación y cultura', ter: 'Territorio y vivienda', ins: 'Instituciones', dig: 'Digital' };
  const PERFIL = { politico: 'Político de partido', tecnico: 'Técnico/a', baron: 'Barón/baronesa', independiente: 'Independiente', joven: 'Promesa' };

  /* Efecto semanal de un ministro con rendimiento 100 (vs 50) sobre el país, según su cartera. */
  const EF_MIN = {
    hac: { deficit: -1 }, eco: { crec: 1, aprob: 0.4 }, tra: { paro: -1, aprob: 0.3 }, amb: { infl: -0.6, crec: 0.3 }, ind: { crec: 0.8 }, agr: { aprob: 0.5 }, tpt: { crec: 0.4, aprob: 0.3 },
    sal: { aprob: 1 }, edu: { aprob: 0.8, crec: 0.2 }, int: { aprob: 0.7 }, jus: { aprob: 0.4 }, viv: { aprob: 0.8 }, inc: { aprob: 0.6, paro: -0.3 }, dso: { aprob: 0.5 }, cie: { crec: 0.5 }, dig: { crec: 0.5 }, igu: { aprob: 0.3 }, cul: { aprob: 0.2 }, jov: { aprob: 0.2 }, def: { aprob: 0.3 }
  };

  const Gab = {
    PERFIL, NOM_ESP, TODAS,

    /* ── Ámbitos: 'central' | 'aut:CAT' | 'muni:m_mad' ── */
    cargos(E, key) {
      if (key === 'central') return D().ministerios.map(m => ({ id: m.id, nombre: m.nombre, icono: m.icono, peso: m.peso, esp: ESP_CENTRAL[m.sector] || 'ins', vp: m.vp }));
      if (key.startsWith('aut:')) return C.Territorio.grupos(E, key.slice(4)).map(g => ({ id: g.id, nombre: g.nombre, icono: g.icono, peso: g.peso, esp: ESP_AUT[g.id], pres: g.id === 'pre', atoms: g.atoms }));
      return Object.keys(D().concejalias).map(a => ({ id: a, nombre: D().concejalias[a].nombre, icono: D().concejalias[a].icono, peso: D().concejalias[a].peso, esp: ESP_MUNI[a] }));
    },
    gobierno(E, key) {
      if (key === 'central') return E.paises.ES.gob;
      if (key.startsWith('aut:')) return E.esp.ccaa[key.slice(4)].gob;
      return E.esp.muni.m[key.slice(5)];
    },
    coalicion(E, key) {
      if (key === 'central') return E.paises.ES.gob.coalicion;
      if (key.startsWith('aut:')) return E.esp.ccaa[key.slice(4)].gob.coalicion;
      return E.esp.muni.m[key.slice(5)].coal;
    },
    escanos(E, key) {
      if (key === 'central') return E.paises.ES.escanos;
      if (key.startsWith('aut:')) return E.esp.ccaa[key.slice(4)].parl.escanos;
      return E.esp.muni.m[key.slice(5)].esc;
    },
    region(key) { return key.startsWith('aut:') ? key.slice(4) : null; },
    mapa(E, key) {      // objeto cargoId → titular
      if (key === 'central') return E.paises.ES.gob.ministros;
      if (key.startsWith('aut:')) { const g = E.esp.ccaa[key.slice(4)].gob; return g.consej || (g.consej = {}); }
      const m = E.esp.muni.m[key.slice(5)]; return m.conc || (m.conc = {});
    },

    /* Atributos garantizados en un político existente. */
    attr(E, pol) {
      if (!pol) return null;
      if (pol.gest == null) {
        pol.gest = Math.round(clamp(U.gauss(58, 15), 15, 95)); pol.lealt = Math.round(clamp(U.gauss(65, 16), 15, 98));
        pol.esp = [U.pick(TODAS)]; if (U.chance(0.35)) pol.esp.push(U.pick(TODAS));
        pol.perfil = pol.perfil || (pol.a > 75 ? 'joven' : pol.d > 85 ? 'politico' : U.chance(0.2) ? 'tecnico' : U.chance(0.15) ? 'baron' : 'politico'); pol.esc = 0; pol.desdeCargo = null;
      }
      return pol;
    },

    /* La persona de un cargo (el jugador se calcula a partir de sus atributos). */
    persona(E, key, cid) {
      const h = Gab.mapa(E, key)[cid]; if (!h) return null;
      if (h === 'J') { const J = E.jugador, p = E.politicos.J; return Object.assign(Gab.attr(E, p), { gest: J.atrib.gestion * 10, car: J.atrib.carisma * 10, integ: J.atrib.integridad * 10 + 10, lealt: 85, esp: [Gab.espDe(J)], perfil: 'politico', id: 'J', n: J.nombre, p: J.partido }); }
      if (typeof h === 'string') { const q = E.politicos[h]; return q ? Gab.attr(E, q) : null; }
      return h;
    },
    espDe(J) { const t = J.trayectoria; return { diplomatico: 'ext', abogado: 'seg', empresa: 'eco', academico: 'edu', sindical: 'soc', periodista: 'ins', concejal: 'ter', activista: 'amb' }[t] || 'ins'; },
    car(per) { return per.car != null ? per.car : (per.c != null ? per.c : 50); },
    integ(per) { return per.integ != null ? per.integ : (per.i != null ? per.i : 60); },

    /* Rendimiento 0-100 de una persona en un cargo. */
    rend(E, cargo, per) {
      if (!per) return 25;
      const esp = per.esp || [];
      const match = esp.includes(cargo.esp) ? 82 : 38;
      const exp = clamp(match + (per.expAnos && per.expAnos[cargo.id] ? Math.min(12, per.expAnos[cargo.id] * 3) : 0), 0, 98);
      return Math.round(clamp(0.42 * (per.gest != null ? per.gest : 55) + 0.14 * Gab.car(per) + 0.28 * exp + 0.16 * Gab.integ(per), 5, 98));
    },
    rendDe(E, key, cid) {
      const cargo = Gab.cargos(E, key).find(x => x.id === cid), per = Gab.persona(E, key, cid);
      return Gab.rend(E, cargo, per);
    },

    /* Crea una persona ligera (consejero, concejal, independiente) con atributos aleatorios. */
    nueva(E, o) {
      const reg = o.region || 'ES', pers = C.Mundo.persona(reg), pa = E.partidos[o.partido];
      const tecn = o.perfil === 'independiente' || o.perfil === 'tecnico';
      const esp = [o.esp || U.pick(TODAS)]; if (U.chance(0.25)) esp.push(U.pick(TODAS));
      return {
        id: U.id('q'), n: pers.n, g: pers.g, p: o.partido, region: reg, perfil: o.perfil || U.pick(['politico', 'politico', 'politico', 'baron', 'joven', 'tecnico']),
        gest: Math.round(clamp(U.gauss(tecn ? 74 : 58, tecn ? 9 : 14), 20, 96)), car: Math.round(clamp(U.gauss(tecn ? 45 : 58, 15), 15, 95)), integ: Math.round(clamp(U.gauss(tecn ? 72 : 60, 15), 15, 98)),
        lealt: Math.round(clamp(U.gauss(tecn ? 80 : 62, 14), 15, 98)), amb: Math.round(clamp(U.gauss(55, 20), 5, 98)), esp, esc: 0, desde: E.fecha.t,
        eco: Math.round(clamp((pa ? pa.eco : 0) + U.gauss(0, 12), -100, 100)), soc: Math.round(clamp((pa ? pa.soc : 0) + U.gauss(0, 12), -100, 100)), eu: Math.round(clamp((pa ? pa.eu : 0) + U.gauss(0, 12), -100, 100)), ter: Math.round(clamp((pa ? pa.ter || 0 : 0) + U.gauss(0, 12), -100, 100))
      };
    },

    /* ── Candidatos para un cargo ── */
    pool(E, key, cid, partidoPreferido, refrescar) {
      E.esp.gab = E.esp.gab || { pool: {} };
      const pk = key + '|' + cid + '|' + (partidoPreferido || '');
      if (E.esp.gab.pool[pk] && !refrescar) return E.esp.gab.pool[pk].map(x => Gab.resolverCand(E, x));
      const cargo = Gab.cargos(E, key).find(x => x.id === cid), coal = Gab.coalicion(E, key), esc = Gab.escanos(E, key), reg = Gab.region(key);
      const pid = partidoPreferido || (Gab.persona(E, key, cid) || {}).p || coal[0];
      const out = [];
      const prop = p => {
        const a = out.length;
        if (key === 'central') {
          const mps = E.parl.miembros.map(i => E.politicos[i]).filter(m => m && m.p === p && m.id !== 'J' && !Object.values(E.paises.ES.gob.ministros).includes(m.id) && m.id !== E.paises.ES.gob.pm);
          const m = mps.length ? U.pick(mps) : null;
          if (m) { Gab.attr(E, m); out.push({ pol: m.id }); return; }
        }
        out.push({ nueva: Gab.nueva(E, { region: reg || 'ES', partido: p, esp: cargo.esp, perfil: U.chance(0.5) ? 'politico' : U.pick(['baron', 'joven', 'tecnico']) }) });
      };
      prop(pid); prop(pid); prop(pid);
      const otros = coal.filter(k => k !== pid); if (otros.length) prop(U.pick(otros));
      out.push({ nueva: Gab.nueva(E, { region: reg || 'ES', partido: pid, esp: cargo.esp, perfil: 'independiente' }) });
      // el titular actual (si lo hay)
      const act = Gab.persona(E, key, cid); if (act && act.id !== 'J') out.unshift(act.id && E.politicos[act.id] ? { pol: act.id, actual: true } : { nueva: act, actual: true });
      E.esp.gab.pool[pk] = out;
      return out.map(x => Gab.resolverCand(E, x));
    },
    resolverCand(E, x) {
      const per = x.pol ? E.politicos[x.pol] : x.nueva;
      if (x.pol && per) Gab.attr(E, per);
      return { per, actual: !!x.actual, pol: x.pol || null };
    },
    limpiarPool(E) { if (E.esp.gab) E.esp.gab.pool = {}; },

    /* Encaje de un candidato con la cartera, explicado. */
    encaje(E, key, cid, per) {
      const cargo = Gab.cargos(E, key).find(x => x.id === cid), r = Gab.rend(E, cargo, per), f = [];
      const coin = (per.esp || []).includes(cargo.esp);
      f.push(['Especialidad', coin ? '✔ coincide con la cartera' : '✘ fuera de su campo']);
      f.push(['Gestión', per.gest]); f.push(['Integridad', Gab.integ(per)]); f.push(['Lealtad', per.lealt]);
      return { r, f, coin };
    },

    /* ── Nombrar y cesar ── */
    nombrar(E, key, cid, cand) {
      const mapa = Gab.mapa(E, key), cargo = Gab.cargos(E, key).find(x => x.id === cid), g = Gab.gobierno(E, key);
      const viejo = Gab.persona(E, key, cid);
      let per = cand.per;
      if (key === 'central') {
        if (!cand.pol) {
          const nu = per, pol = C.Mundo.politico(E, { pais: 'ES', partido: nu.p, n: nu.n, g: nu.g, eco: nu.eco, soc: nu.soc, eu: nu.eu, a: nu.amb, c: nu.car, i: nu.integ, d: 80 });
          Object.assign(pol, { gest: nu.gest, lealt: nu.lealt, esp: nu.esp, perfil: nu.perfil, esc: 0, ter: nu.ter, e: U.ri(40, 62) });
          cand.pol = pol.id; per = pol;
        }
        const viejoId = mapa[cid];
        if (viejoId && viejoId !== 'J' && E.politicos[viejoId]) E.politicos[viejoId].cargo = null;
        mapa[cid] = cand.pol; per.cargo = 'min:' + cid; per.desdeCargo = E.fecha.t;
        if (E.jugador && E.jugador.ministerio === cid && mapa[cid] !== 'J') E.jugador.ministerio = null;
      } else {
        per.desde = E.fecha.t; mapa[cid] = per;
      }
      per.expAnos = per.expAnos || {};
      // Tensión con el partido del cesado
      if (viejo && viejo.p && per.p !== viejo.p && key === 'central') Gab.satCambio(E, viejo.p, -4);
      if (per.p && key === 'central') Gab.satCambio(E, per.p, 2);
      return { ok: true, per };
    },
    satCambio(E, pid, d) { const cs = E.esp.consejo; if (cs && cs.sat[pid] != null) cs.sat[pid] = clamp(cs.sat[pid] + d, 0, 100); },

    /* Cesa y sustituye con el mejor candidato disponible (IA). */
    sustituirIA(E, key, cid, razon) {
      const cands = Gab.pool(E, key, cid, null, true).filter(c => !c.actual);
      const cargo = Gab.cargos(E, key).find(x => x.id === cid);
      cands.sort((a, b) => (Gab.rend(E, cargo, b.per) + b.per.lealt * 0.3) - (Gab.rend(E, cargo, a.per) + a.per.lealt * 0.3));
      const x = cands[0]; if (!x) return null;
      Gab.nombrar(E, key, cid, x);
      return x.per;
    },

    /* ── Cuotas de los socios (reparto del gabinete) ── */
    cuotas(E, key) {
      const coal = Gab.coalicion(E, key), esc = Gab.escanos(E, key), cargos = Gab.cargos(E, key), mapa = Gab.mapa(E, key);
      const peso = {}; let tp = 0; coal.forEach(k => { peso[k] = Math.pow(esc[k] || 1, 0.72); tp += peso[k]; });
      const tot = U.suma(cargos.map(c => c.peso * (c.vp ? 1.4 : 1)));
      const tiene = {}; coal.forEach(k => tiene[k] = 0);
      cargos.forEach(c => { const per = Gab.persona(E, key, c.id); const p = per && per.p; if (p && tiene[p] != null) tiene[p] += c.peso * (c.vp ? 1.4 : 1); });
      return coal.map(k => { const derecho = peso[k] / tp * tot; return { pid: k, escanos: esc[k] || 0, derecho, tiene: tiene[k], ratio: derecho ? tiene[k] / derecho : 1 }; });
    },
    objetivoSat(E, pid) {
      const q = Gab.cuotas(E, 'central').find(x => x.pid === pid); if (!q) return 60;
      return clamp(60 + (q.ratio - 1) * 55, 14, 90);
    },

    /* Media de rendimiento del gabinete ponderada por peso. */
    mediaRend(E, key) {
      const cargos = Gab.cargos(E, key); let s = 0, w = 0;
      cargos.forEach(c => { const per = Gab.persona(E, key, c.id); s += Gab.rend(E, c, per) * c.peso; w += c.peso; });
      return w ? s / w : 50;
    },

    /* ── Confirmación del gabinete (tras investidura o remodelación) ── */
    confirmar(E, key) {
      const J = E.jugador, res = { avisos: [], delta: {} };
      if (key === 'central') {
        const g = E.paises.ES.gob, cs = E.esp.consejo;
        Gab.cuotas(E, key).forEach(q => {
          if (q.pid === g.partido) return;
          const d = clamp((q.ratio - 1) * 22, -22, 12);
          if (cs.sat[q.pid] != null) cs.sat[q.pid] = clamp(cs.sat[q.pid] + d, 0, 100);
          res.delta[q.pid] = d;
          if (q.ratio < 0.6) res.avisos.push(`${E.partidos[q.pid].sigla} se siente maltratado: recibe el ${Math.round(q.ratio * 100)} % de lo que le corresponde.`);
          else if (q.ratio > 1.3) res.avisos.push(`${E.partidos[q.pid].sigla} queda muy satisfecho con su peso en el Gobierno.`);
        });
        // El gabinete competente da autoridad
        cs.autoridad = clamp(cs.autoridad + (Gab.mediaRend(E, key) - 55) * 0.2, 10, 100);
        C.Personaje.sincronizar(E);
      }
      if (key.startsWith('muni:') || key.startsWith('aut:')) { /* efectos vía turno */ }
      return res;
    },

    /* ── Turno ── */
    turno(E) {
      const t = E.fecha.t, g = E.paises.ES.gob, cs = E.esp.consejo; if (!g || !cs) return;
      const enFunc = E.esp.cortes.estado !== 'activa';
      // 1) Ministros: efectos económicos y de aprobación; experiencia; escándalos
      const cargos = Gab.cargos(E, 'central'); let aprobAcum = 0;
      for (const c of cargos) {
        const per = Gab.persona(E, 'central', c.id); if (!per) continue;
        const r = Gab.rend(E, c, per), k = (r - 50) / 50;
        per.expAnos = per.expAnos || {}; per.expAnos[c.id] = (per.expAnos[c.id] || 0) + 1 / 52;
        const ef = EF_MIN[c.id]; if (!ef) continue;
        const e = {}; for (const v in ef) { if (v === 'aprob') aprobAcum += k * ef[v] * c.peso / 80; else e[v] = ef[v] * k * 0.0011 * (c.peso / 6); }
        C.Economia.aplicar(E, 'ES', e);
      }
      g.aprob = clamp(g.aprob + aprobAcum * 0.018, 5, 90);
      // Política Territorial: mejora relación con las comunidades; Presidencia: autoridad; Exteriores: relación con la UE
      const rt = Gab.rendDe(E, 'central', 'ter'), rp = Gab.rendDe(E, 'central', 'pre'), re = Gab.rendDe(E, 'central', 'ext');
      for (const c of C.Territorio.ids()) E.esp.ccaa[c].relM = clamp(E.esp.ccaa[c].relM + (rt - 50) / 50 * 0.025, 0, 100);
      cs.autoridad = clamp(cs.autoridad + (rp - 50) / 50 * 0.03, 10, 100);
      E.paises.ES.ue.rel = clamp(E.paises.ES.ue.rel + (re - 50) / 50 * 0.03, 0, 100);
      g.estab = clamp(g.estab + (rp - 50) / 50 * 0.025, 0, 100);
      // Satisfacción de los socios según su peso en el gabinete
      for (const k of g.coalicion) { if (k === g.partido || cs.sat[k] == null) continue; cs.sat[k] = clamp(cs.sat[k] + (Gab.objetivoSat(E, k) - cs.sat[k]) * 0.012, 0, 100); }
      if (enFunc) return;
      // Escándalos, choques y dimisiones (un ministro a la vez)
      if (U.chance(0.05)) {
        const c = U.pesado(cargos, x => { const p = Gab.persona(E, 'central', x.id); return p && p.id !== 'J' ? (100 - Gab.integ(p)) * 0.012 + (p.perfil === 'baron' ? 0.4 : 0) + 0.15 : 0; });
        const per = c && Gab.persona(E, 'central', c.id);
        if (per && per.id !== 'J' && U.chance(0.22)) Gab.escandalo(E, c, per);
      }
      if (U.chance(0.012)) Gab.choque(E);
      if (U.chance(0.01)) {
        const c = U.pesado(cargos, x => { const p = Gab.persona(E, 'central', x.id); return p && p.id !== 'J' ? Math.max(0, p.a - 70) * Math.max(0, 70 - p.lealt) : 0; });
        const per = c && Gab.persona(E, 'central', c.id);
        if (per && per.id !== 'J' && U.chance(0.3)) Gab.dimision(E, c, per);
      }
      // Gabinetes autonómicos y municipales
      Gab.turnoAut(E); Gab.turnoMuni(E);
    },

    escandalo(E, c, per) {
      const g = E.paises.ES.gob, J = E.jugador;
      per.esc = (per.esc || 0) + 1;
      C.Noticias.poner(E, 'politica', `Escándalo: ${per.n}, ministro/a de ${c.nombre}, en el centro de una polémica por ${U.pick(['contratos a empresas afines', 'viajes y gastos', 'un informe filtrado', 'un conflicto de intereses', 'unas declaraciones desafortunadas'])}.`, 'ES');
      g.aprob = clamp(g.aprob - 0.9, 5, 90); g.estab = clamp(g.estab - 1.4, 0, 100);
      if (g.pm === 'J') { E.esp.gab = E.esp.gab || { pool: {} }; E.esp.gab.escandalo = { cid: c.id, id: per.id, t: E.fecha.t }; return; }
      if (U.chance(0.35 + (100 - Gab.integ(per)) / 200) || per.esc >= 2) { const nu = Gab.sustituirIA(E, 'central', c.id); C.Noticias.poner(E, 'politica', `${per.n} dimite o es cesado/a${nu ? ' y es sustituido/a por ' + nu.n : ''}.`, 'ES'); }
    },
    choque(E) {
      const g = E.paises.ES.gob, cs = E.esp.consejo, cargos = Gab.cargos(E, 'central');
      const ps = cargos.map(c => ({ c, p: Gab.persona(E, 'central', c.id) })).filter(x => x.p && x.p.id !== g.pm);
      const a = U.pick(ps), b = U.pick(ps.filter(x => x.p.p !== a.p.p && U.distIdeo(a.p, x.p) > 0.3));
      if (!b || a.p.lealt > 80) return;
      C.Noticias.poner(E, 'politica', `Choque en el Gobierno entre ${a.p.n} (${a.c.nombre}) y ${b.p.n} (${b.c.nombre}).`, 'ES');
      g.estab = clamp(g.estab - 1.5, 0, 100); cs.tension = clamp(cs.tension + 3, 0, 100);
      Gab.satCambio(E, a.p.p, -2); Gab.satCambio(E, b.p.p, -2);
    },
    dimision(E, c, per) {
      const g = E.paises.ES.gob;
      if (g.pm === 'J') { C.Eventos.info(E, '📄 Dimisión', `${per.n}, ministro/a de ${c.nombre}, presenta su dimisión por discrepancias con tu línea. Debes nombrar sustituto en el Gabinete.`); }
      const nu = Gab.sustituirIA(E, 'central', c.id);
      C.Noticias.poner(E, 'politica', `${per.n} abandona el Ministerio de ${c.nombre} por discrepancias. Lo sustituye ${nu ? nu.n : 'un nuevo titular'}.`, 'ES');
    },

    /* ── Autonómicos ── */
    turnoAut(E) {
      for (const c of C.Territorio.ids()) {
        const rc = E.esp.ccaa[c], g = rc.gob; if (!g || !g.consej || !rc.gestion) continue;
        const key = 'aut:' + c, cargos = Gab.cargos(E, key);
        for (const cg of cargos) {
          const per = g.consej[cg.id]; if (!per || cg.pres) continue;
          const pr = Gab.persona(E, key, cg.id); if (!pr) continue;
          const r = Gab.rend(E, cg, pr);
          (cg.atoms || [cg.id]).forEach(a => { rc.gestion[a] = clamp(rc.gestion[a] + (r - 50) * 0.0035, 5, 98); });
          if (pr.id !== 'J' && U.chance(0.00012 + (100 - Gab.integ(pr)) * 0.000004)) { pr.esc = (pr.esc || 0) + 1; g.aprob = clamp(g.aprob - 1.2, 5, 90); C.Noticias.poner(E, 'politica', `${D().ccaa[c].nombre}: polémica en torno a ${pr.n}, consejero/a de ${cg.nombre}.`, 'ES'); if (!(E.jugador && E.jugador.cargo === 'presauto' && E.jugador.region === c) && pr.esc >= 1 && U.chance(0.5)) Gab.sustituirIA(E, key, cg.id); }
        }
      }
    },

    /* ── Municipales ── */
    turnoMuni(E) { /* se implementa en ayuntamientos.js (indicadores urbanos) */ }
  };

  C.Gabinete = Gab;
  C.Tiempo.registrar('gabinete', Gab, 31);
})(window.ESP);

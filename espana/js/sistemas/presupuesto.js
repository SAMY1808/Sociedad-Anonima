/* Presupuestos Generales del Estado con contenido: ingresos por impuestos, gasto por políticas, déficit, deuda, regla fiscal europea, inversión territorial,
   negociación con los socios y ejecución. Y la capa financiera de las comunidades: impuestos propios, intereses de la deuda, regla fiscal y plan económico-financiero. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const f = (E, ...ks) => U.suma(ks.map(k => E.jugador.atrib[k])) / (10 * ks.length);

  /* [nombre, icono, cuota base (% PIB), elasticidad] */
  const ING = { irpf: ['IRPF', '🧾', 8.5, 0.7], iva: ['IVA', '🛒', 6.5, 0.8], soc: ['Impuesto de sociedades', '🏢', 2.5, 0.55], cot: ['Cotizaciones sociales', '👷', 13.0, 0.5], otros: ['Otros ingresos', '📦', 8.0, 0] };
  /* [nombre, icono, cuota base (% PIB), indicador, peso popular, límites] */
  const GAS = {
    pens: ['Pensiones', '🧓', 11.6, 'prot', 0.05], sal: ['Sanidad', '🏥', 6.4, 'sal', 0.04], edu: ['Educación', '🎓', 4.4, 'edu', 0.03], prot: ['Desempleo y servicios sociales', '🤝', 5.2, 'igual', 0.03],
    def: ['Defensa', '🪖', 1.4, 'seg', 0.005], infra: ['Infraestructuras y transporte', '🚆', 2.2, 'rur', 0.01], idi: ['I+D+i y empresa', '🔬', 1.2, 'comp', 0.008], viv: ['Vivienda', '🏠', 0.5, 'viv', 0.015],
    jus: ['Justicia e Interior', '⚖️', 2.3, 'inst', 0.006], cul: ['Cultura y deporte', '🎭', 0.4, 'lib', 0.004], ccaa: ['Transferencias a CCAA y entes locales', '🗺️', 3.0, 'coh', 0.01], admin: ['Administración y otros', '🏛️', 2.8, 'inst', 0.003], ue: ['Aportación a la UE', '🇪🇺', 0.9, null, 0]
  };
  const FIJAS = ['ue'];
  const TIPO_INT = 0.0235;

  const Pr = C.Presupuesto = {
    ING, GAS, FIJAS,

    asegurar(E) {
      const pg = E.esp.pge;
      if (!pg.lev) { pg.lev = { gas: {}, ing: {}, gran: 0 }; pg.inv = {}; pg.hist = []; pg.pactos = {}; pg.borrador = null; pg.prorrogas = 0; pg.ejec = null; pg.ultimo = null; }
      return pg;
    },

    /* Cuentas base (con las palancas a cero): ingresos y gasto en % del PIB. */
    base(E) {
      const e = E.paises.ES.ec, I0 = U.suma(Object.values(ING).map(x => x[2])), int0 = 100 * 0.0235 * 1.0, nonInt = I0 + e.base.deficit - int0;
      const sh = U.suma(Object.keys(GAS).map(k => GAS[k][2])), k = nonInt / sh, gas = {};
      Object.keys(GAS).forEach(a => gas[a] = GAS[a][2] * k);
      return { ing: Object.fromEntries(Object.keys(ING).map(x => [x, ING[x][2]])), gas };
    },
    vacio() { return { gas: {}, ing: {}, gran: 0 }; },
    copia(l) { return JSON.parse(JSON.stringify(l || Pr.vacio())); },

    /* Resultado de unas palancas: ingresos, gasto, saldo, deuda a tres años y regla fiscal. */
    cuentas(E, lev) {
      const e = E.paises.ES.ec, b = Pr.base(E); lev = lev || Pr.vacio();
      const ing = {}, gas = {};
      for (const k in ING) ing[k] = b.ing[k] * (1 + (lev.ing[k] || 0) / 100 * ING[k][3]);
      ing.gran = (lev.gran || 0) / 100 * 0.8;
      for (const a in GAS) gas[a] = b.gas[a] * (1 + (lev.gas[a] || 0) / 100);
      gas.int = e.deuda * TIPO_INT;
      const totI = U.suma(Object.values(ing)), totG = U.suma(Object.values(gas)), deficit = totG - totI;
      const neutro = Pr.neutro(E);
      let d = e.deuda; const crec = e.crec + e.infl; for (let i = 0; i < 3; i++) d = d + deficit - d * crec / 100;
      const prim = totG - gas.int, nomPIB = Math.max(1, e.crec + e.infl) / 100;
      const ue = { deficit, ok: deficit <= 3.0, aviso: deficit > 3.0 ? (e.pde ? 'Bruselas ya vigila tu déficit: superar el 3 % agrava el procedimiento.' : 'Superas el 3 % de déficit: Bruselas puede abrir un procedimiento.') : deficit > 2.6 ? 'Cerca del límite del 3 %.' : 'Dentro de las reglas fiscales.' };
      return { ing, gas, totI, totG, deficit, saldo: -deficit, deuda3: d, impulso: deficit - neutro.deficit, ue, prim, neutro: neutro.deficit };
    },
    neutro(E) {
      const e = E.paises.ES.ec, b = Pr.base(E), I = U.suma(Object.values(b.ing)), G = U.suma(Object.values(b.gas)) + e.deuda * TIPO_INT; return { deficit: G - I };
    },
    nombre(E) { return 'Presupuestos de ' + (new Date(U.hoy()).getUTCFullYear() + 1); },

    /* Borrador por defecto de un Gobierno: reacciona al déficit y a su ideología. */
    porDefecto(E) {
      const g = E.paises.ES.gob, pm = E.politicos[g.pm] || E.politicos.J || { eco: 0, soc: 0 }, e = E.paises.ES.ec, lev = Pr.vacio();
      const izq = clamp(-pm.eco / 40, -1, 1), exceso = e.deficit - 2.8;
      for (const a in GAS) { if (FIJAS.includes(a)) continue; lev.gas[a] = 0; }
      lev.gas.pens = Math.round(izq * 3 + 2); lev.gas.sal = Math.round(izq * 4 + 1); lev.gas.edu = Math.round(izq * 3 + 1); lev.gas.prot = Math.round(izq * 6); lev.gas.def = Math.round(-izq * 5); lev.gas.idi = Math.round(2 - izq);
      lev.ing.irpf = Math.round(izq * 4 - (1 - Math.abs(izq)) * 0); lev.ing.soc = Math.round(izq * 4 - 1); lev.ing.iva = 0; lev.gran = Math.round(Math.max(0, izq) * 40);
      if (exceso > 0.4) { for (const a of ['admin', 'infra', 'cul', 'jus', 'ccaa']) lev.gas[a] = Math.round(-exceso * 3); lev.ing.iva = Math.round(exceso * 2); lev.ing.irpf += Math.round(exceso * 2); }
      return lev;
    },

    /* ── Negociación: lo que pide cada grupo ── */
    demandas(E, pid) {
      const p = E.partidos[pid], out = [];
      if (p.amb === 'reg' && p.region) { const R = D().ccaa[p.region].nombre; out.push({ k: 'inv', n: `Inversión extra en ${R}`, d: `+30 % de inversión estatal regionalizada en ${R}.`, v: 0.4, ef: pr => { pr.inv[p.region] = (pr.inv[p.region] || 0) + 30; } }); }
      if (p.eco < -8) { out.push({ k: 'social', n: 'Más gasto social', d: 'Pensiones +3 %, desempleo y servicios sociales +5 %.', v: 0.38, ef: pr => { pr.lev.gas.pens = (pr.lev.gas.pens || 0) + 3; pr.lev.gas.prot = (pr.lev.gas.prot || 0) + 5; } }); out.push({ k: 'gran', n: 'Impuesto a grandes patrimonios y banca', d: 'Sube la intensidad de la tasa en 30 puntos.', v: 0.34, ef: pr => { pr.lev.gran = clamp((pr.lev.gran || 0) + 30, 0, 100); } }); }
      if (p.eco > 8) { out.push({ k: 'fisc', n: 'Rebaja fiscal', d: 'IRPF −3 % y sociedades −4 %.', v: 0.36, ef: pr => { pr.lev.ing.irpf = (pr.lev.ing.irpf || 0) - 3; pr.lev.ing.soc = (pr.lev.ing.soc || 0) - 4; } }); out.push({ k: 'def', n: 'Más gasto en Defensa y seguridad', d: 'Defensa +10 %, Justicia e Interior +4 %.', v: 0.3, ef: pr => { pr.lev.gas.def = (pr.lev.gas.def || 0) + 10; pr.lev.gas.jus = (pr.lev.gas.jus || 0) + 4; } }); }
      if (Math.abs(p.eco) <= 8 || out.length < 2) out.push({ k: 'idi', n: 'Plan de infraestructuras e I+D', d: 'Infraestructuras +6 %, I+D+i +10 %.', v: 0.32, ef: pr => { pr.lev.gas.infra = (pr.lev.gas.infra || 0) + 6; pr.lev.gas.idi = (pr.lev.gas.idi || 0) + 10; } });
      out.push({ k: 'ccaa', n: 'Más dinero para las comunidades', d: 'Transferencias a CCAA +5 %.', v: 0.28, ef: pr => { pr.lev.gas.ccaa = (pr.lev.gas.ccaa || 0) + 5; } });
      return out;
    },
    /* Concede una demanda al borrador y compra el apoyo del grupo. */
    conceder(E, pid, k) {
      const pg = Pr.asegurar(E), d = Pr.demandas(E, pid).find(x => x.k === k); if (!d) return { ok: false, msg: 'Demanda desconocida' };
      if (!pg.borrador) pg.borrador = { lev: Pr.copia(pg.lev), inv: Object.assign({}, pg.inv) };
      if ((pg.pactos[pid] || {}).k === k) return { ok: false, msg: 'Ya has aceptado esa demanda' };
      d.ef(pg.borrador);
      pg.pactos[pid] = { k, v: d.v };
      const g = E.paises.ES.gob; if (g && C.Consejo) C.Consejo.sat(E, pid, 6);
      const t = pg.tramite && E.proyectos[pg.tramite]; if (t) t.apoyo[pid] = (t.apoyo[pid] || 0) + d.v;
      return { ok: true, msg: `${E.partidos[pid].sigla}: aceptas «${d.n}» a cambio de su apoyo.` };
    },
    /* Negociación activa del jugador (presidente, ministro de Hacienda o diputado): intenta que un grupo se mueva. */
    puedeNegociar(E) { const J = E.jugador, g = E.paises.ES.gob; return !!(J && J.pais === 'ES' && (g.pm === 'J' || J.ministerio === 'hac')); },

    /* ── Presentación, aprobación y prórroga ── */
    presentar(E, lev) {
      const pg = Pr.asegurar(E), g = E.paises.ES.gob, pm = E.politicos[g.pm] || E.politicos.J;
      if (pg.tramite) return null;
      const borr = pg.borrador || { lev: lev || Pr.porDefecto(E), inv: Object.assign({}, pg.inv) };
      // La IA concede a sus socios una demanda razonable
      if (g.pm !== 'J') for (const k of g.coalicion.concat(g.apoyoExterno || [])) { if (k === g.partido || (pg.pactos[k] && pg.pactos[k].k)) continue; if (U.chance(0.55)) { const ds = Pr.demandas(E, k), d = U.pick(ds); if (d) { d.ef(borr); pg.pactos[k] = { k: d.k, v: d.v }; } } }
      pg.borrador = borr;
      const cu = Pr.cuentas(E, borr.lev);
      const tilt = U.suma(['pens', 'sal', 'edu', 'prot', 'viv'].map(a => borr.lev.gas[a] || 0)) / 5 - ((borr.lev.ing.irpf || 0) + (borr.lev.ing.soc || 0)) / 4;
      const p = C.Congreso.proponer(E, 'pge', { tipo: 'gobierno', pid: g.partido }, { eco: clamp(pm.eco - tilt * 1.5, -100, 100), soc: pm.soc, eu: pm.eu, ter: pm.ter, pge: true, costo: clamp(cu.deficit - 2.8, -2, 3) });
      for (const pid in pg.pactos) p.apoyo[pid] = (p.apoyo[pid] || 0) + pg.pactos[pid].v;
      pg.tramite = p.id; pg.intentos++;
      C.Noticias.poner(E, 'economia', `El Gobierno presenta los ${Pr.nombre(E)}: déficit del ${U.d1(cu.deficit)} % del PIB, gasto del ${U.d1(cu.totG)} % y deuda del ${U.n(cu.deuda3)} % a tres años.`, 'ES');
      return p;
    },
    aprobar(E) {
      const pg = Pr.asegurar(E), ec = E.paises.ES.ec, g = E.paises.ES.gob; const borr = pg.borrador || { lev: Pr.copia(pg.lev), inv: pg.inv };
      const antes = Pr.cuentas(E, pg.lev), cu = Pr.cuentas(E, borr.lev), dDef = cu.deficit - antes.deficit;
      // Efectos macro: el impulso fiscal sostiene el crecimiento y empeora el déficit
      C.Economia.aplicar(E, 'ES', { crec: dDef * 0.3, deficit: dDef * 0.85, paro: -dDef * 0.1, infl: dDef * 0.04, deuda: dDef * 0.5 });
      // Efectos sociales por política
      const S = C.Impacto && C.Impacto.asegurar(E), b = Pr.base(E); let aprob = 0;
      for (const a in GAS) { const lv = (borr.lev.gas[a] || 0) - (pg.lev.gas[a] || 0), ind = GAS[a][3]; if (S && ind) S.off[ind] = (S.off[ind] || 0) + lv * 0.045; aprob += lv * GAS[a][4] * 0.12; }
      for (const k in ING) aprob -= ((borr.lev.ing[k] || 0) - (pg.lev.ing[k] || 0)) * 0.1 * (k === 'iva' ? 1.3 : 1);
      aprob += ((borr.lev.gran || 0) - (pg.lev.gran || 0)) * 0.012;
      if (S && borr.lev.gran !== pg.lev.gran) S.off.comp = (S.off.comp || 0) - ((borr.lev.gran || 0) - (pg.lev.gran || 0)) * 0.015;
      g.aprob = clamp(g.aprob + clamp(aprob, -3, 3), 5, 90);
      // Inversión territorial
      const tot = U.suma(C.Territorio.ids().map(c => D().ccaa[c].pob));
      for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c], inv = (borr.inv[c] || 0) - (pg.inv[c] || 0); if (inv) { rc.relM = clamp(rc.relM + inv * 0.2, 0, 100); } if ((borr.inv[c] || 0) < -10) rc.agravio += 1; rc.fin.nivel = clamp(rc.fin.nivel + ((borr.lev.gas.ccaa || 0) - (pg.lev.gas.ccaa || 0)) * 0.12, 60, 160); }
      pg.lev = borr.lev; pg.inv = borr.inv; pg.estado = 'aprobado'; pg.ano = new Date(U.hoy()).getUTCFullYear(); pg.borrador = null; pg.pactos = {}; pg.prorrogas = 0;
      pg.ejec = { t0: E.fecha.t, deficitPrev: cu.deficit, crecPrev: ec.crec, ano: pg.ano };
      pg.ultimo = { ano: pg.ano + 1, deficit: cu.deficit, gasto: cu.totG, ingresos: cu.totI, deuda3: cu.deuda3 };
      g.estab = clamp(g.estab + 6, 0, 100); g.aprob = clamp(g.aprob + 0.5, 5, 90);
      C.Noticias.poner(E, 'economia', `Las Cortes aprueban los Presupuestos Generales del Estado: déficit previsto del ${U.d1(cu.deficit)} %.`, 'ES');
    },
    prorrogar(E, motivo) {
      const pg = Pr.asegurar(E), g = E.paises.ES.gob, S = C.Impacto && C.Impacto.asegurar(E);
      pg.estado = 'prorrogado'; pg.ano = new Date(U.hoy()).getUTCFullYear(); pg.prorrogas = (pg.prorrogas || 0) + 1; pg.borrador = null; pg.pactos = {}; pg.ejec = null;
      // Sin actualizar las partidas, la inflación erosiona servicios y prestaciones
      if (S) { S.off.sal = (S.off.sal || 0) - 0.4; S.off.edu = (S.off.edu || 0) - 0.3; S.off.prot = (S.off.prot || 0) - 0.3; }
      C.Economia.aplicar(E, 'ES', { crec: -0.04 * pg.prorrogas });
      C.Noticias.poner(E, 'economia', motivo || 'Se prorrogan los Presupuestos del año anterior.', 'ES');
    },

    /* ── Ejecución: el déficit real frente al previsto ── */
    turno(E) {
      const pg = E.esp.pge; if (!pg || !pg.ejec) return;
      const f = U.hoy(), ec = E.paises.ES.ec;
      if (f.getUTCMonth() === 11 && f.getUTCDate() <= 7 && pg.ejec.cerrado !== f.getUTCFullYear()) {
        pg.ejec.cerrado = f.getUTCFullYear();
        const real = ec.deficit, prev = pg.ejec.deficitPrev, gap = real - prev;
        pg.hist.unshift({ ano: pg.ano + 1, prev, real, gap, crec: ec.crec });
        if (pg.hist.length > 12) pg.hist.length = 12;
        C.Noticias.poner(E, 'economia', `Cierre del ejercicio: déficit del ${U.d1(real)} % frente al ${U.d1(prev)} % presupuestado${Math.abs(gap) > 0.5 ? ' (desviación de ' + U.signo(gap, 1) + ' pp)' : ''}.`, 'ES');
        const J = E.jugador; if (gap > 0.6 && !E.meta.presim) { if (J && Pr.puedeNegociar(E)) { pg.desviacion = { ano: pg.ano, gap }; C.Eventos.info(E, '📉 Desviación del déficit', `El ejercicio se cierra con un déficit del ${U.d1(real)} %, ${U.d1(gap)} pp por encima de lo presupuestado. Responde desde Consejo de Ministros → Presupuestos.`); } else if (U.chance(0.5)) C.Economia.aplicar(E, 'ES', { deficit: -0.25, crec: -0.08 }); }
      }
    },
    /* Respuesta del Gobierno a una desviación del déficit. */
    ajustar(E, modo) {
      const pg = Pr.asegurar(E); pg.desviacion = null; const g = E.paises.ES.gob;
      if (modo === 'recorte') { C.Economia.aplicar(E, 'ES', { deficit: -0.4, crec: -0.15, aprob: -1.2 }); return 'Aprueban un plan de ajuste: el déficit baja, pero se resiente el crecimiento.'; }
      if (modo === 'impuestos') { C.Economia.aplicar(E, 'ES', { deficit: -0.35, crec: -0.08, aprob: -1.5 }); return 'Subes impuestos de forma extraordinaria para cubrir el agujero.'; }
      C.Economia.aplicar(E, 'ES', { aprob: -0.3 }); g.estab = clamp(g.estab - 1, 0, 100); return 'Aceptas la desviación: el déficit se corregirá con el tiempo, pero Bruselas toma nota.';
    }
  };
  C.Tiempo.registrar('presupuesto', { turno: Pr.turno, postInit: E => Pr.asegurar(E) }, 36);
})(window.ESP);

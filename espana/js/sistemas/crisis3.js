/* Emergencias por comunidad: amplía las crisis nacionales (crisis.js) con el reparto de mando entre el Estado y la comunidad afectada.
   - Niveles de emergencia por comunidad (1 operativa · 2 grave · 3 desbordada) según el daño acumulado.
   - Peticiones de medios (UME): la comunidad las pide, el Estado las concede o las deniega (la IA o tú); si se deniegan hay reproches.
   - Reproches entre Gobierno y comunidad cuando gobiernan partidos distintos; visitas a la zona, fondos de emergencia y culpar a la comunidad.
   - Tras una gran catástrofe, la comunidad puede pedir la declaración de «zona afectada gravemente» (ayudas y reconstrucción).
   - Dilemas al inicio para el presidente autonómico afectado y para el presidente del Gobierno.
   Estado: cr.em = { mando, nivel:{c}, pet:[{c,tipo,estado,t,lim}], visitas, fondos, repr } en cada crisis regional y E.esp.cem = { zonas:[…] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, Cr = C.Crisis;
  const ESCENA = { dana: 'inundacion', incendios: 'incendio', apagon: 'apagon', atentado: 'emergencia' };
  const NIVELES = { 1: ['Nivel 1', 'verde', 'Operativa: la comunidad la gestiona con sus medios'], 2: ['Nivel 2', 'amar', 'Grave: se necesitan refuerzos'], 3: ['Nivel 3', 'rojo', 'Desbordada: puede hacer falta el Estado'] };
  const nombre = c => D().ccaa[c].nombre;
  const noticia = (E, txt) => C.Noticias.poner(E, 'politica', txt, 'ES');

  const Em = C.Emerg = {
    NIVELES, ESCENA,
    asegurar(E) { if (!E.esp.cem) E.esp.cem = { zonas: [] }; return E.esp.cem; },
    de(cr) { if (!cr.em) cr.em = { mando: 'aut', nivel: {}, pet: [], visitas: 0, fondos: 0, repr: 0, nac: cr.regs.length > 4 }; return cr.em; },
    regional(cr) { return cr.regs.length <= 4; },
    activas(E) { return Cr.asegurar(E).activas.filter(c => c.fase !== 'cerrada' && Em.regional(c)); },
    presJ(E, c) { const J = E.jugador, g = E.esp.ccaa[c] && E.esp.ccaa[c].gob; return !!(J && J.pais === 'ES' && J.cargo === 'presauto' && J.region === c && g && g.pres === 'J'); },
    pmJ(E) { return Cr.jugadorEstado(E); },
    /* Daño acumulado respecto al esperado (0–1,2) y nivel de la emergencia en una comunidad. */
    frac(cr, c) { return clamp((cr.dano[c] || 0) / Math.max(1, cr.sev * cr.dur * 0.55), 0, 1.2); },
    nivel(cr, c) { const f = Em.frac(cr, c); return f < 0.3 ? 1 : f < 0.65 ? 2 : 3; },
    /* Cuánto está dispuesto el Estado a ayudar a una comunidad (0,3–0,95). */
    apoyo(E, c) { const rc = E.esp.ccaa[c], afin = C.Financia ? C.Financia.afinidad(E, c) : 0; return clamp(0.72 + 0.35 * afin + (rc.relM - 50) / 300, 0.3, 0.95); },
    distinto(E, c) { const rc = E.esp.ccaa[c], g = E.paises.ES.gob; return !!(rc.gob && !g.coalicion.includes(rc.gob.partido)); },
    cr(E, id) { return Cr.asegurar(E).activas.find(x => x.id === id && x.fase !== 'cerrada'); },
    /* Riesgo de cada comunidad en el mes actual (comunidades listadas en los tipos de crisis de temporada). */
    riesgo(E) {
      const mes = U.hoy().getUTCMonth(), out = {};
      for (const k in Cr.TIPOS) { const T = Cr.TIPOS[k]; if (!T.reg || (T.meses && !T.meses.includes(mes)) || ['atentado', 'migracion'].includes(k)) continue; for (const c of T.reg) if (D().ccaa[c]) (out[c] = out[c] || []).push(k); }
      return out;
    },

    alCrear(E, cr) {
      const em = Em.de(cr); if (em.nac) return;
      for (const c of cr.regs) em.nivel[c] = Em.nivel(cr, c);
      if (E.meta.presim) return;
      const x = cr.sev >= 2 ? (cr.regs.some(c => Em.presJ(E, c)) ? C.Dilemas.nuevo(E, 'crisis_aut') : Em.pmJ(E) ? C.Dilemas.nuevo(E, 'crisis_estado') : null) : null;
      if (x) { x.cid = cr.id; x.c = cr.regs.find(c => Em.presJ(E, c)) || cr.regs[0]; }
    },

    /* Petición de medios del Estado por parte de una comunidad. */
    peticion(E, cr, c, tipo) {
      const em = Em.de(cr), rc = E.esp.ccaa[c]; if (em.pet.some(p => p.c === c && p.tipo === tipo)) return null;
      const p = { c, tipo, estado: 'pendiente', t: E.fecha.t, lim: E.fecha.t + 2 }; em.pet.push(p);
      noticia(E, `${nombre(c)} pide al Estado ${tipo === 'ume' ? 'el despliegue de la UME y más medios' : 'ayuda'} ante ${Cr.TIPOS[cr.tipo].n.toLowerCase()}.`);
      if (Em.pmJ(E)) { if (!E.meta.presim) C.Eventos.info(E, '🚨 Petición de medios', `${nombre(c)} solicita la UME y refuerzos por ${Cr.TIPOS[cr.tipo].n.toLowerCase()}. Decídelo en la pestaña Crisis (si no respondes en dos semanas se envían).`); }
      else Em.resolverPeticion(E, cr, p, U.chance(Em.apoyo(E, c)));
      return p;
    },
    resolverPeticion(E, cr, p, ok, porDefecto) {
      if (p.estado !== 'pendiente') return { ok: false, msg: 'La petición ya está resuelta' }; const rc = E.esp.ccaa[p.c], em = Em.de(cr), c = p.c;
      p.estado = ok ? 'concedida' : 'denegada'; p.t1 = E.fecha.t;
      if (ok) { cr.efic[c] = clamp(cr.efic[c] + 0.3, 0.05, 1.2); if (!cr.usadas.includes('ume')) cr.usadas.push('ume'); rc.relM = clamp(rc.relM + 2, 0, 100); noticia(E, `El Gobierno envía la UME y refuerzos a ${nombre(c)}${porDefecto ? ' tras no responder a tiempo' : ''}.`); if (porDefecto && Em.pmJ(E)) C.Personaje.cambiar(E, { prestigio: -0.5 }, true); return { ok: true, msg: `Envías la UME a ${nombre(c)}: eficacia de la respuesta +30 %.` }; }
      em.repr += 1; rc.relM = clamp(rc.relM - 3, 0, 100); if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 0.8, 5, 90);
      noticia(E, `El Gobierno rechaza enviar más medios a ${nombre(c)}${Em.distinto(E, c) ? ' y el gobierno autonómico denuncia abandono' : ''}.`);
      return { ok: true, msg: `Deniegas la petición de ${nombre(c)}: reproches y peor relación, pero ahorras medios.` };
    },

    /* Zona afectada gravemente: ayudas y reconstrucción tras una gran catástrofe. */
    zonaPedir(E, zid) {
      const z = Em.asegurar(E).zonas.find(x => x.id === zid); if (!z) return { ok: false, msg: 'Esa zona no existe' }; if (z.estado !== 'por_pedir') return { ok: false, msg: 'La solicitud ya está en marcha o resuelta' };
      z.estado = 'pendiente'; z.t1 = E.fecha.t; noticia(E, `${nombre(z.c)} solicita ser declarada zona afectada gravemente por una emergencia de protección civil (${z.danos} millones de euros en daños).`);
      if (!Em.pmJ(E)) Em.zonaResolver(E, z, U.chance(Em.apoyo(E, z.c)));
      return { ok: true, msg: `Solicitas la declaración de zona afectada gravemente para ${nombre(z.c)}${Em.pmJ(E) ? '' : ': ' + (z.estado === 'concedida' ? 'el Gobierno la concede' : 'el Gobierno la deniega')}.` };
    },
    zonaResolver(E, z, ok, porDefecto) {
      if (z.estado !== 'pendiente') return { ok: false, msg: 'La solicitud ya está resuelta' }; const rc = E.esp.ccaa[z.c], g = E.paises.ES.gob; z.estado = ok ? 'concedida' : 'denegada'; z.t2 = E.fecha.t;
      if (ok) { if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + 2.5, 5, 90); rc.deuda = Math.max(3, rc.deuda - z.danos / 300); rc.relM = clamp(rc.relM + 3, 0, 100); E.paises.ES.ec.pol.deficit += Math.min(0.12, z.danos / 6000); g.aprob = clamp(g.aprob + 0.3, 5, 90); noticia(E, `El Gobierno declara ${nombre(z.c)} zona afectada gravemente: ayudas para la reconstrucción.`); if (Em.pmJ(E)) C.Personaje.cambiar(E, { prestigio: porDefecto ? 0 : 0.6 }, true); return { ok: true, msg: `Declaras zona afectada gravemente a ${nombre(z.c)}: ayudas y reconstrucción (más déficit).` }; }
      if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob - 2, 5, 90); rc.relM = clamp(rc.relM - 4, 0, 100); rc.agravio += 0.6; noticia(E, `${nombre(z.c)} acusa al Gobierno de abandonar a los afectados tras denegarle la declaración de zona catastrófica.`);
      return { ok: true, msg: `Deniegas la declaración a ${nombre(z.c)}: ahorras déficit, pero el agravio crece.` };
    },
    alCerrar(E, cr) {
      const em = Em.de(cr); if (em.nac) return; const cem = Em.asegurar(E), tot = U.suma(cr.regs.map(c => Em.frac(cr, c))) || 1;
      if (em.repr > 0) { for (const c of cr.regs) { const rc = E.esp.ccaa[c]; rc.relM = clamp(rc.relM - Math.min(8, em.repr * 1.5), 0, 100); } E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob - Math.min(2, em.repr * 0.4), 5, 90); }
      if (em.mando === 'estado') { const bien = (cr.score || 0.5) < 0.5; E.paises.ES.gob.aprob = clamp(E.paises.ES.gob.aprob + (bien ? 1 : -1.5), 5, 90); }
      for (const c of cr.regs) { const d = Math.round((cr.danos || 0) * Em.frac(cr, c) / tot); if (d >= 600 && !E.meta.presim) cem.zonas.unshift({ id: U.id('zc'), cid: cr.id, tipo: cr.tipo, c, t: E.fecha.t, danos: d, estado: 'por_pedir', lim: E.fecha.t + 10 }); }
      if (cem.zonas.length > 12) cem.zonas.length = 12;
    },

    turno(E) {
      const t = E.fecha.t, cem = Em.asegurar(E); if (E.meta.presim) return;
      // Como los sucesos sueltos de incendio y DANA se han sustituido, las emergencias de temporada nacen aquí
      const cs = Cr.asegurar(E);
      if (Em.activas(E).length === 0 && t - cs.ult > 8 && U.chance(0.008 * ((C.Ajustes && C.Ajustes.get(E).crisis) || 1))) {
        const mes = U.hoy().getUTCMonth(), pos = ['dana', 'incendios', 'calor'].filter(k => !Cr.TIPOS[k].meses || Cr.TIPOS[k].meses.includes(mes)), k = U.pick(pos);
        if (k && Cr.nueva(E, { tipo: k })) cs.ult = t;
      }
      for (const cr of Em.activas(E)) {
        const em = Em.de(cr);
        for (const c of cr.regs) {
          const rc = E.esp.ccaa[c]; if (!rc || !rc.gob) continue; const n = Em.nivel(cr, c);
          if (n > (em.nivel[c] || 1)) { em.nivel[c] = n; noticia(E, `${Cr.TIPOS[cr.tipo].n} en ${nombre(c)}: la emergencia pasa a ${NIVELES[n][0].toLowerCase()}.`); }
          if (n >= 2 && Em.distinto(E, c)) em.repr = Math.min(6, em.repr + 0.2);
          if (!Em.presJ(E, c) && n >= 2 && !cr.usadas.includes('ume') && !em.pet.some(p => p.c === c) && U.chance(0.3 + 0.12 * (n - 2))) Em.peticion(E, cr, c, 'ume');
        }
        for (const p of em.pet) if (p.estado === 'pendiente' && Em.pmJ(E) && t >= p.lim) Em.resolverPeticion(E, cr, p, true, true);
        if (!Em.pmJ(E) && !cr.usadas.includes('ume') && cr.regs.some(c => Em.nivel(cr, c) >= 3 && !Em.distinto(E, c)) && U.chance(0.2)) { cr.usadas.push('ume'); cr.regs.forEach(c => { cr.efic[c] = clamp(cr.efic[c] + 0.3, 0.05, 1.2); }); noticia(E, `El Gobierno ofrece la UME a ${cr.regs.map(nombre).join(' y ')} sin esperar a que se la pidan.`); }
      }
      for (const z of cem.zonas) {
        if (z.estado === 'por_pedir') { if (t > z.lim) z.estado = 'caducada'; else if (!Em.presJ(E, z.c) && U.chance(0.6)) Em.zonaPedir(E, z.id); }
        else if (z.estado === 'pendiente' && Em.pmJ(E) && t >= z.t1 + 4) Em.zonaResolver(E, z, true, true);
      }
    },

    /* ── Acciones del jugador ── */
    visita(E, id, c) {
      const cr = Em.cr(E, id); if (!cr || !Em.regional(cr)) return { ok: false, msg: 'Esa emergencia ya no está activa' }; const em = Em.de(cr), J = E.jugador;
      const reg = c && cr.regs.includes(c) ? c : (cr.regs.find(x => Em.presJ(E, x)) || cr.regs[0]); if (em.visitas >= 2) return { ok: false, msg: 'Ya has visitado la zona dos veces' };
      em.visitas++; const mal = Em.frac(cr, reg) > 0.5 && U.chance(0.45), rc = E.esp.ccaa[reg];
      if (mal) { C.Personaje.cambiar(E, { prestigio: -1.2, pop: -1 }); return { ok: true, exito: false, msg: `Visitas ${nombre(reg)} y te reciben con abucheos: la gestión no convence.` }; }
      C.Personaje.cambiar(E, { prestigio: 0.8, pop: 1.2 }); if (Em.pmJ(E)) rc.relM = clamp(rc.relM + 1, 0, 100);
      return { ok: true, msg: `Visitas la zona afectada de ${nombre(reg)}: tu presencia tranquiliza a los vecinos.` };
    },
    fondos(E, id, nivel) {
      const cr = Em.cr(E, id); if (!cr || !Em.regional(cr)) return { ok: false, msg: 'Esa emergencia ya no está activa' }; const em = Em.de(cr), n = clamp(Math.round(+nivel || 1), 1, 3);
      if (em.fondos + n > 3) return { ok: false, msg: 'Ya has movilizado el máximo de fondos para esta emergencia' };
      em.fondos += n; C.Economia.aplicar(E, 'ES', { deficit: 0.04 * n }); cr.regs.forEach(c => { cr.efic[c] = clamp(cr.efic[c] + 0.08 * n, 0.05, 1.2); const rc = E.esp.ccaa[c]; rc.relM = clamp(rc.relM + 1.2 * n, 0, 100); });
      return { ok: true, msg: `Movilizas el fondo de contingencia (${n}): la respuesta mejora +${8 * n} % y sube el déficit.` };
    },
    culpar(E, id) {
      const cr = Em.cr(E, id); if (!cr || !Em.regional(cr)) return { ok: false, msg: 'Esa emergencia ya no está activa' }; const regs = cr.regs.filter(c => Em.distinto(E, c));
      if (!regs.length) return { ok: false, msg: 'Gobierna un partido afín en la comunidad afectada: no cuela' };
      for (const c of regs) { const rc = E.esp.ccaa[c]; rc.relM = clamp(rc.relM - 4, 0, 100); if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob - 1.2, 5, 90); } Em.de(cr).repr += 1; C.Personaje.cambiar(E, { pop: 1.5 });
      return { ok: true, msg: `Culpas a ${regs.map(nombre).join(' y ')} de la falta de previsión: ganas apoyo propio, pero la relación se resiente.` };
    }
  };

  /* ── Ganchos sobre crisis.js ── */
  if (Cr) {
    const nueva = Cr.nueva; Cr.nueva = function (E) { const cr = nueva.apply(this, arguments); if (cr) Em.alCrear(E, cr); return cr; };
    const cerrar = Cr.cerrar; Cr.cerrar = function (E, cr) { const r = cerrar.apply(this, arguments); Em.alCerrar(E, cr); return r; };
    const decidir = Cr.decidir;
    Cr.decidir = function (E, id, k, ambito) {
      const cr = Cr.asegurar(E).activas.find(x => x.id === id);
      // La petición de ayuda pasa por el sistema de peticiones (reproches si se deniega)
      if (cr && ambito !== 'estado' && k === 'pedir_ayuda' && Em.regional(cr) && Cr.jugadorRegion(E, cr) && !cr.usadasReg.includes(k) && cr.fase !== 'cerrada') {
        const c = E.jugador.region; cr.usadasReg.push(k); const p = Em.peticion(E, cr, c, 'ume');
        return p ? { ok: true, msg: p.estado === 'concedida' ? 'El Estado envía medios: eficacia +30 % en tu comunidad.' : p.estado === 'denegada' ? 'El Gobierno rechaza enviar más medios: tensión y reproches.' : 'Tu petición queda pendiente de respuesta del Gobierno.' } : { ok: false, msg: 'Ya has pedido ayuda' };
      }
      const r = decidir.apply(this, arguments);
      if (cr && r && r.ok && ambito === 'estado' && k === 'emergencia') Em.de(cr).mando = 'estado';
      return r;
    };
  }
  C.Tiempo.registrar('crisis3', { turno: E => Em.turno(E) }, 43);
  if (C.DATA && C.DATA.eventos) for (const e of C.DATA.eventos) if (['incendios', 'dana', 'incendio_forestal'].includes(e.id)) e.req = () => false;   // sustituidos por el sistema de crisis y emergencias

  /* ── Dilemas del inicio de una emergencia ── */
  const rcJ = E => E.esp.ccaa[E.jugador.region];
  C.Dilemas.CAT.crisis_aut = {
    ic: '🚨', n: 'Una emergencia golpea tu comunidad', req: () => false, plazo: 3, defecto: 0,
    txt: (E, x) => { const cr = x.cid && Em.cr(E, x.cid); return cr ? `${Cr.TIPOS[cr.tipo].n} en ${nombre(x.c)} (gravedad ${cr.sev}/3). Los medios autonómicos son los primeros en responder; la UME y los refuerzos del Estado dependen de que los pidas.` : 'Una emergencia golpea tu comunidad.'; },
    op: [
      { k: 'plan', t: 'Activar el plan autonómico con tus medios', d: 'Eficacia +25 %; gasta crédito de tus consejerías. Orgullo intacto, riesgo si se desborda.', ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'emergencia_autonomica', 'region'); return r && r.msg || 'Activas el plan autonómico.'; } },
      { k: 'ayuda', t: 'Pedir la UME y la ayuda del Estado', d: 'Eficacia +30 % si el Gobierno te escucha; si lo deniega, reproches y peor relación.', ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'pedir_ayuda', 'region'); return r && r.msg || 'Pides ayuda al Estado.'; } },
      { k: 'ambas', t: 'Plan autonómico y petición de ayuda a la vez', d: 'La respuesta más completa, pero cuesta capital político.', cap: 4, ef: (E, J, x) => { if (!x.cid) return ''; const a = Cr.decidir(E, x.cid, 'emergencia_autonomica', 'region'), b = Cr.decidir(E, x.cid, 'pedir_ayuda', 'region'); return `${a.msg} ${b.msg}`; } },
      { k: 'culpar', t: 'Culpar al Estado de la falta de medios', d: 'Más apoyo propio y peor relación con Moncloa; la respuesta no mejora.', ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'culpar_estado', 'region'); return r && r.msg || 'Culpas al Estado.'; }, mem: { tipo: 'cesion', txt: 'culpaste al Estado en plena emergencia' } }
    ],
    as: { jefe: 'plan', portavoz: 'culpar', estratega: 'ayuda' }
  };
  C.Dilemas.CAT.crisis_estado = {
    ic: '🚨', n: 'Una emergencia exige respuesta del Estado', req: () => false, plazo: 3, defecto: 1,
    txt: (E, x) => { const cr = x.cid && Em.cr(E, x.cid); return cr ? `${Cr.TIPOS[cr.tipo].n} en ${cr.regs.map(nombre).join(' y ')} (gravedad ${cr.sev}/3). Las comunidades gestionan al principio; tú decides cuánto Estado se despliega y a qué coste político.` : 'Una emergencia exige respuesta del Estado.'; },
    op: [
      { k: 'ume', t: 'Desplegar la UME y refuerzos', d: 'Eficacia +30 %; algo de déficit.', ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'ume', 'estado'); return r && r.msg || 'Despliegas la UME.'; } },
      { k: 'coordinar', t: 'Coordinar con las comunidades afectadas', d: 'Eficacia +15 % y mejor relación territorial.', ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'coordinar', 'estado'); return r && r.msg || 'Convocas la comisión de coordinación.'; } },
      { k: 'interes', t: 'Declarar emergencia de interés nacional', d: 'El Estado asume el mando: eficacia +35 % y la responsabilidad pasa a ti; enfada a las comunidades.', cap: 5, ef: (E, J, x) => { const r = x.cid && Cr.decidir(E, x.cid, 'emergencia', 'estado'); return r && r.msg || 'Declaras la emergencia de interés nacional.'; } },
      { k: 'esperar', t: 'Esperar a que la comunidad lo pida', d: 'Sin coste ahora; si se desborda, te culparán de llegar tarde.', ef: () => 'Dejas que la comunidad pida lo que necesite.' }
    ],
    as: { jefe: 'coordinar', portavoz: 'ume', estratega: 'esperar' }
  };

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const hay = E => Em.activas(E).length ? true : 'No hay ninguna emergencia regional en curso';
  const pm = E => Em.pmJ(E) ? hay(E) : 'Sólo el presidente/a del Gobierno';
  const ambos = E => { const a = hay(E); if (a !== true) return a; return Em.pmJ(E) || Em.activas(E).some(cr => cr.regs.some(c => Em.presJ(E, c))) ? true : 'No te corresponde atender ninguna emergencia'; };
  const idDe = (E, a) => a.id || (Em.activas(E).find(cr => cr.regs.some(c => Em.presJ(E, c))) || Em.activas(E)[0] || {}).id;
  R({ id: 'visita_emergencia', nombre: 'Visitar la zona de la emergencia', icono: '🦺', grupo: 'carrera', desc: 'Presidente/a del Gobierno o de la comunidad afectada: te presentas en la zona. Suma prestigio si la gestión va bien; con mala gestión te pueden abuchear. Máximo dos veces por emergencia.', disponible: ambos, ejecutar: (E, a) => Em.visita(E, idDe(E, a), a.c) });
  R({ id: 'fondos_emergencia', nombre: 'Movilizar el fondo de contingencia', icono: '💶', costo: 2, desc: 'Presidente/a del Gobierno: fondos para la emergencia (1 a 3 niveles en total): mejoran la respuesta y la relación con las comunidades; suben el déficit.', disponible: pm, ejecutar: (E, a) => Em.fondos(E, idDe(E, a), a.nivel) });
  R({ id: 'culpar_comunidad', nombre: 'Culpar a la comunidad de la emergencia', icono: '👉', desc: 'Presidente/a del Gobierno: si gobierna otro partido, le echas la culpa de la falta de previsión. Ganas apoyo propio y pierdes relación.', disponible: pm, ejecutar: (E, a) => Em.culpar(E, idDe(E, a)) });
  R({ id: 'responder_peticion_crisis', nombre: 'Responder a la petición de una comunidad', icono: '📨', costo: 0, desc: 'Presidente/a del Gobierno: concedes o deniegas la UME que pide una comunidad afectada.', disponible: pm, ejecutar: (E, a) => { const cr = Em.cr(E, a.id), p = cr && Em.de(cr).pet.find(x => x.c === a.c && x.estado === 'pendiente'); if (!p) return { ok: false, msg: 'No hay petición pendiente' }; return Em.resolverPeticion(E, cr, p, a.ok === true || a.ok === '1' || a.ok === 'si'); } });
  R({ id: 'pedir_zona_catastrofica', nombre: 'Pedir la declaración de zona afectada gravemente', icono: '🏚', grupo: 'autonomico', desc: 'Presidente/a autonómico/a: tras una gran catástrofe pides ayudas de reconstrucción al Estado.', disponible: E => Em.asegurar(E).zonas.some(z => z.estado === 'por_pedir' && Em.presJ(E, z.c)) ? true : 'No tienes ninguna solicitud posible', costo: 1, ejecutar: (E, a) => { const z = Em.asegurar(E).zonas.find(x => x.id === a.zid) || Em.asegurar(E).zonas.find(x => x.estado === 'por_pedir' && Em.presJ(E, x.c)); return z ? Em.zonaPedir(E, z.id) : { ok: false, msg: 'Esa zona no existe' }; } });
  R({ id: 'resolver_zona_catastrofica', nombre: 'Resolver una solicitud de zona catastrófica', icono: '🏛', costo: 0, desc: 'Presidente/a del Gobierno: concedes o deniegas las ayudas a una comunidad devastada.', disponible: E => Em.pmJ(E) ? (Em.asegurar(E).zonas.some(z => z.estado === 'pendiente') ? true : 'No hay solicitudes pendientes') : 'Sólo el presidente/a del Gobierno', ejecutar: (E, a) => { const z = Em.asegurar(E).zonas.find(x => x.id === a.zid); return z ? Em.zonaResolver(E, z, a.ok === true || a.ok === '1' || a.ok === 'si') : { ok: false, msg: 'Esa zona no existe' }; } });
})(window.ESP);

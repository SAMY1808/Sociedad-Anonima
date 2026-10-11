/* Reforma del sistema de financiación autonómica y renegociación del cupo (Concierto vasco y Convenio navarro).
   Reforma: el Gobierno elige un modelo de reparto (nivelación solidaria, población ajustada, ordinalidad o acuerdos bilaterales), con o sin garantía de que nadie pierda
   y con un fondo transitorio → cada comunidad de régimen común sale ganando o perdiendo → el Consejo de Política Fiscal y Financiera vota (mayoría de las comunidades)
   → ley orgánica en las Cortes → se aplica. Se puede cabildear a cada comunidad y pactarle una contrapartida, como en el Estatuto.
   Cupo: el Consejo de Ministros decide con cinco grados; el presidente foral presiona antes (negociar_cupo) y su postura pesa en el Gobierno de la IA.
   Estado: E.esp.fa = { ref, hist[], ult, ultInt, cupo:{PVA,NAV} }; ref = { modelo, garantia, fondo, fase, cab, cabT, contra, fallos, voto, propId, votoJ }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA, T = () => C.Territorio;
  /* Estimaciones propias para el modelo de reparto (0–1): dispersión de la población, envejecimiento e insularidad. */
  const DISP = { AND: 0.35, ARA: 0.8, AST: 0.6, BAL: 0.4, CAN: 0.4, CNT: 0.35, CLM: 0.7, CYL: 0.9, CAT: 0.3, VAL: 0.3, EXT: 0.75, GAL: 0.85, MAD: 0.1, MUR: 0.3, RIO: 0.45 };
  const ENVEJ = { AND: 0.45, ARA: 0.7, AST: 0.95, BAL: 0.3, CAN: 0.35, CNT: 0.6, CLM: 0.6, CYL: 0.9, CAT: 0.5, VAL: 0.5, EXT: 0.6, GAL: 0.85, MAD: 0.4, MUR: 0.35, RIO: 0.6 };
  const INSU = { BAL: 1, CAN: 1 };
  const nombre = c => D().ccaa[c].nombre;
  const pib = c => D().ccaa[c].pibpc, pob = c => D().ccaa[c].pob;
  const pmJ = E => E.paises.ES.gob.pm === 'J' && E.jugador.pais === 'ES';
  const noticia = (E, txt) => C.Noticias.poner(E, 'economia', txt, 'ES', 'central');
  const xJ = E => { const J = E.jugador; return J.atrib.negociacion / 10 * 0.5 + J.atrib.carisma / 10 * 0.5; };

  const MODELOS = {
    solidario: { ic: '🤝', n: 'Nivelación solidaria', max: 7, d: 'Más recursos para las comunidades con menos renta por habitante; pierden las más ricas.', f: (E, c, med) => (med - pib(c)) / med },
    poblacion: { ic: '👥', n: 'Población ajustada', max: 6, d: 'Se reparte por población corregida por dispersión, envejecimiento e insularidad: ganan Castilla y León, Galicia, Asturias, Aragón y los archipiélagos.', f: (E, c) => 1.4 * (DISP[c] || 0) + 1.1 * (ENVEJ[c] || 0) + 1.6 * (INSU[c] || 0) },
    capacidad: { ic: '📈', n: 'Ordinalidad: quien más aporta, más recibe', max: 7, d: 'Premia a las comunidades con más renta y recaudación; las menos ricas pierden recursos.', f: (E, c, med) => (pib(c) - med) / med },
    bilateral: { ic: '📞', n: 'Acuerdos bilaterales', max: 6, d: 'Cada comunidad pacta su reparto con Hacienda: ganan las que mejor se llevan con el Gobierno; el resto, agravio.', f: (E, c) => (E.esp.ccaa[c].relM - 50) / 40 + Fa.afinidad(E, c) }
  };
  const REF0 = (modelo, garantia, fondo) => ({ modelo, garantia: !!garantia, fondo: fondo || 0, fase: 'borrador', cab: {}, cabT: {}, contra: {}, fallos: 0, voto: null, propId: null, votoJ: null });

  const Fa = C.Financia = {
    MODELOS,
    asegurar(E) { if (!E.esp.fa) E.esp.fa = { ref: null, hist: [], ult: -999, ultInt: -999, cupo: { PVA: { stance: null, t: -99, hist: [] }, NAV: { stance: null, t: -99, hist: [] } } }; return E.esp.fa; },
    /* Comunidades que participan en el reparto (régimen común, canario y singular). */
    participantes(E) { return T().ids().filter(c => { const r = E.esp.ccaa[c].fin.regimen; return r === 'comun' || r === 'canario' || r === 'singular'; }); },
    /* Afinidad del gobierno autonómico con el Gobierno central (−0,6 … +0,55). */
    afinidad(E, c) {
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, pr = rc.gob && rc.gob.partido; if (!pr) return 0;
      if (g.coalicion.includes(pr)) return 0.55; if ((g.apoyoExterno || []).includes(pr)) return 0.3;
      return 0.35 - 1.4 * U.distIdeo(E.partidos[pr], E.partidos[g.partido]);
    },

    /* Cuánto gana o pierde cada comunidad (en puntos de financiación por habitante) y cuánto cuesta al Estado. */
    reparto(E, ref) {
      const ps = Fa.participantes(E), M = MODELOS[ref.modelo], tot = U.suma(ps.map(pob)), med = U.suma(ps.map(c => pob(c) * pib(c))) / tot, raw = {};
      for (const c of ps) raw[c] = M.f(E, c, med);
      const mean = U.suma(ps.map(c => pob(c) * raw[c])) / tot; let mx = 0.0001; for (const c of ps) { raw[c] -= mean; mx = Math.max(mx, Math.abs(raw[c])); }
      const delta = {}; for (const c of ps) delta[c] = raw[c] * M.max / mx;
      let coste = 0; if (ref.garantia || Fa.asegurar(E).blindada) for (const c of ps) if (delta[c] < 0) { coste += pob(c) * -delta[c]; delta[c] = 0; }
      coste = coste / tot * 0.06 + ref.fondo * 0.09;
      for (const c of ps) delta[c] += ref.fondo * 0.7;
      return { delta, coste };
    },
    /* Disposición de una comunidad a firmar (≈ −1,6 … +1,6). */
    dispo(E, c, ref, d) {
      const rc = E.esp.ccaa[c];
      return d * 0.28 + Fa.afinidad(E, c) + (rc.relM - 50) / 70 - rc.agravio / 14 + (ref.cab[c] || 0);
    },
    voto(s) { return s > 0.3 ? 'si' : s < -0.1 ? 'no' : 'abs'; },
    /* Proyección del voto del Consejo de Política Fiscal y Financiera. */
    proyeccion(E, ref) {
      const { delta, coste } = Fa.reparto(E, ref), ps = Fa.participantes(E), por = {}; let si = 0, no = 0, abs = 0;
      for (const c of ps) { const s = Fa.dispo(E, c, ref, delta[c]), v = Fa.voto(s); por[c] = { delta: delta[c], s, voto: v }; if (v === 'si') si++; else if (v === 'no') no++; else abs++; }
      const req = Math.floor(ps.length / 2) + 1;
      return { por, si, no, abs, req, n: ps.length, ok: si >= req, coste };
    },

    puede(E) {
      const fa = Fa.asegurar(E), t = E.fecha.t;
      if (fa.ref) return 'Ya hay una reforma de la financiación en marcha';
      if (E.esp.cortes.estado !== 'activa') return 'Las Cortes no están en su etapa ordinaria';
      if (t - fa.ult < 104) return 'Ha de pasar tiempo desde la última reforma del modelo';
      if (t - fa.ultInt < 26) return 'Acaba de fracasar un intento: espera unas semanas';
      return true;
    },
    abrir(E, modelo, garantia, fondo) {
      const p = Fa.puede(E); if (p !== true) return { ok: false, msg: p };
      if (!MODELOS[modelo]) return { ok: false, msg: 'Elige un modelo de reparto' };
      const fa = Fa.asegurar(E); fa.ref = REF0(modelo, garantia, clamp(Math.round(fondo || 0), 0, 3)); fa.ref.t = E.fecha.t;
      const pr = Fa.proyeccion(E, fa.ref);
      noticia(E, `El Gobierno abre la reforma de la financiación autonómica con un modelo de «${MODELOS[modelo].n.toLowerCase()}».`);
      return { ok: true, msg: `Abres la reforma con el modelo «${MODELOS[modelo].n}»: previsión de ${pr.si} comunidades a favor de ${pr.n} (hacen falta ${pr.req}).` };
    },
    ref(E) { const fa = Fa.asegurar(E); return fa.ref && fa.ref.fase === 'borrador' ? fa.ref : null; },
    ajustar(E, o) {
      const ref = Fa.ref(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' };
      if (o.modelo && MODELOS[o.modelo]) ref.modelo = o.modelo;
      if (o.garantia != null && o.garantia !== '') ref.garantia = o.garantia === true || o.garantia === 1 || o.garantia === '1' || o.garantia === 'si';
      if (o.fondo != null && o.fondo !== '') ref.fondo = clamp(Math.round(+o.fondo || 0), 0, 3);
      const pr = Fa.proyeccion(E, ref);
      return { ok: true, msg: `Modelo «${MODELOS[ref.modelo].n}»${ref.garantia ? ', con garantía de que nadie pierde' : ''}${ref.fondo ? `, fondo transitorio ${ref.fondo}` : ''}: ${pr.si} a favor de ${pr.n} (hacen falta ${pr.req}); coste fiscal +${pr.coste.toFixed(2)} pp de déficit.` };
    },
    cabildear(E, c) {
      const ref = Fa.ref(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' };
      if (!Fa.participantes(E).includes(c)) return { ok: false, msg: 'Esa comunidad no participa en el reparto' };
      if (E.fecha.t - (ref.cabT[c] != null ? ref.cabT[c] : -99) < 2) return { ok: false, msg: `Acabas de hablar con ${nombre(c)}: espera unas semanas` };
      const pr = Fa.proyeccion(E, ref); if (pr.por[c].voto === 'si' && pr.por[c].s > 0.8) return { ok: false, msg: `${nombre(c)} ya te apoya con claridad` };
      ref.cabT[c] = E.fecha.t; const x = xJ(E);
      if (U.chance(clamp(0.45 + 0.5 * x, 0.15, 0.93))) {
        ref.cab[c] = clamp((ref.cab[c] || 0) + 0.3 + 0.25 * x, 0, 1.2); C.Personaje.cambiar(E, { prestigio: 0.2 });
        return { ok: true, msg: `${nombre(c)} se muestra más receptiva a la reforma (cabildeo +${Math.round(ref.cab[c] * 100)}).` };
      }
      return { ok: true, exito: false, msg: `${nombre(c)} no se deja convencer por ahora.` };
    },
    contrapartida(E, c) {
      const ref = Fa.ref(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' };
      if (!Fa.participantes(E).includes(c)) return { ok: false, msg: 'Esa comunidad no participa en el reparto' };
      if (ref.contra[c]) return { ok: false, msg: `Ya pactaste una contrapartida con ${nombre(c)}` };
      ref.contra[c] = true; ref.cab[c] = clamp((ref.cab[c] || 0) + 0.6, 0, 1.4); E.paises.ES.ec.pol.deficit += 0.03; C.Personaje.cambiar(E, { prestigio: -0.3 });
      return { ok: true, msg: `${nombre(c)} acepta una contrapartida (inversiones y un fondo para su comunidad) a cambio de su voto: apoyo casi seguro, algo más de déficit.` };
    },
    /* El presidente autonómico del jugador fija el voto de su comunidad en el Consejo. */
    fijarVoto(E, voto) {
      const ref = Fa.ref(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' };
      if (!['si', 'no', 'abs'].includes(voto)) return { ok: false, msg: 'Voto no válido' };
      ref.votoJ = voto; return { ok: true, msg: `Tu comunidad votará «${{ si: 'a favor', no: 'en contra', abs: 'abstención' }[voto]}» en el Consejo de Política Fiscal y Financiera.` };
    },

    /* Votación del Consejo de Política Fiscal y Financiera. */
    convocar(E, ruido) {
      const ref = Fa.ref(E); if (!ref) return { ok: false, msg: 'No hay un borrador de reforma abierto' };
      const pr = Fa.proyeccion(E, ref), J = E.jugador, res = {}; let si = 0, no = 0, abs = 0;
      for (const c of Object.keys(pr.por)) {
        let v = Fa.voto(pr.por[c].s + U.gauss(0, ruido == null ? 0.12 : ruido));
        const g = E.esp.ccaa[c].gob; if (ref.votoJ && J && J.cargo === 'presauto' && J.region === c && g && g.pres === 'J') v = ref.votoJ;
        res[c] = v; if (v === 'si') si++; else if (v === 'no') no++; else abs++;
      }
      ref.voto = { t: E.fecha.t, si, no, abs, req: pr.req, por: res };
      if (si >= pr.req) { Fa.aCortes(E); return { ok: true, aprobada: true, msg: `El Consejo de Política Fiscal y Financiera aprueba el modelo (${si} a favor, ${no} en contra, ${abs} abstenciones). Pasa a las Cortes como ley orgánica.` }; }
      ref.fallos++; const g = E.paises.ES.gob; g.estab = Math.max(5, g.estab - 0.5);
      for (const c of Object.keys(res)) if (res[c] === 'no') E.esp.ccaa[c].relM = Math.max(0, E.esp.ccaa[c].relM - 1);
      if (pmJ(E)) C.Personaje.cambiar(E, { prestigio: -0.6 }, true);
      noticia(E, `El Consejo de Política Fiscal y Financiera rechaza el nuevo modelo de financiación (${si} a favor, ${no} en contra).`);
      return { ok: true, aprobada: false, msg: `El Consejo no aprueba el modelo: ${si} a favor, ${no} en contra y ${abs} abstenciones (hacían falta ${pr.req}). Cabildea, ajusta el modelo o añade garantía y fondo.` };
    },
    aCortes(E) {
      const fa = Fa.asegurar(E), ref = fa.ref, M = MODELOS[ref.modelo], G = E.paises.ES.gob, rp = Fa.reparto(E, ref);
      const prop = C.Congreso.proponer(E, 'financiacion_reforma', { tipo: 'gobierno', pid: G.partido }, { faRef: true, faModelo: ref.modelo, t: `Reforma de la financiación autonómica: ${M.n.toLowerCase()}`, d: M.d });
      // Los partidos que gobiernan las comunidades que votaron a favor (o en contra) arrastran a sus grupos en el Congreso
      if (prop && ref.voto) for (const c of Object.keys(ref.voto.por)) { const pr = E.esp.ccaa[c].gob && E.esp.ccaa[c].gob.partido; if (!pr) continue; const v = ref.voto.por[c]; if (v === 'si') prop.apoyo[pr] = clamp((prop.apoyo[pr] || 0) + 0.3, -0.5, 0.9); else if (v === 'no') prop.apoyo[pr] = clamp((prop.apoyo[pr] || 0) - 0.2, -0.5, 0.9); }
      ref.fase = 'cortes'; ref.propId = prop ? prop.id : null; ref.delta = rp.delta; ref.coste = rp.coste;
      noticia(E, 'El Consejo de Política Fiscal y Financiera respalda la reforma: llega a las Cortes como ley orgánica.');
    },
    retirar(E) {
      const fa = Fa.asegurar(E), ref = fa.ref; if (!ref) return { ok: false, msg: 'No hay reforma en marcha' };
      if (ref.propId && E.proyectos[ref.propId] && C.Congreso.ABIERTAS.includes(E.proyectos[ref.propId].etapa)) { const p = E.proyectos[ref.propId]; p.etapa = 'archivada'; p.hist.push({ t: E.fecha.t, txt: 'El Gobierno retira la reforma de la financiación' }); }
      fa.hist.unshift({ t: E.fecha.t, modelo: ref.modelo, res: 'retirada' }); fa.ref = null; fa.ultInt = E.fecha.t; return { ok: true, msg: 'Retiras la reforma de la financiación.' };
    },

    /* Efecto de la ley aprobada (lo llama Territorio.efectoLey). */
    aplicar(E, p) {
      const fa = Fa.asegurar(E), ref = fa.ref, ps = Fa.participantes(E), t = E.fecha.t, delta = ref && ref.delta ? ref.delta : Fa.reparto(E, REF0(p.faModelo, false, 0)).delta, coste = ref && ref.coste != null ? ref.coste : 0;
      let ganan = 0, pierden = 0;
      for (const c of ps) {
        const rc = E.esp.ccaa[c], d = delta[c] || 0; rc.fin.nivel = clamp(rc.fin.nivel + d, 60, 170);
        rc.relM = clamp(rc.relM + clamp(d * 0.9, -8, 8), 0, 100); rc.agravio = Math.max(0, rc.agravio + (d < 0 ? -d * 0.5 : -d * 0.2));
        if (rc.gob) rc.gob.aprob = clamp(rc.gob.aprob + d * 0.25, 5, 90);
        if (d > 0.5) ganan++; else if (d < -0.5) pierden++;
      }
      if (p.faModelo === 'bilateral') for (const c of ps) if ((delta[c] || 0) < 0) E.esp.ccaa[c].agravio += 1.2;
      E.paises.ES.ec.pol.deficit += coste;
      fa.hist.unshift({ t, modelo: p.faModelo, res: 'aprobada', ganan, pierden }); if (fa.hist.length > 10) fa.hist.length = 10;
      fa.ult = t; fa.ultInt = t; fa.ref = null;
      noticia(E, `Entra en vigor el nuevo modelo de financiación autonómica («${MODELOS[p.faModelo].n.toLowerCase()}»): ${ganan} comunidades ganan y ${pierden} pierden recursos.`);
      if (pmJ(E)) C.Personaje.cambiar(E, { prestigio: 4, pop: 1 }, true);
    },
    rechazada(E, p) {
      const fa = Fa.asegurar(E); if (!fa.ref || fa.ref.propId !== p.id) return;
      fa.hist.unshift({ t: E.fecha.t, modelo: fa.ref.modelo, res: 'rechazada en las Cortes' }); fa.ref = null; fa.ultInt = E.fecha.t;
      noticia(E, 'Las Cortes rechazan la reforma de la financiación autonómica.');
    },

    /* El Gobierno de la IA abre la reforma de vez en cuando, elige el modelo con más apoyos y cabildea a las comunidades. */
    iaAbre(E) {
      const g = E.paises.ES.gob, pm = E.politicos[g.pm], mejores = [];
      for (const modelo of Object.keys(MODELOS)) for (const garantia of [false, true]) for (const fondo of [0, 1]) {
        const ref = REF0(modelo, garantia, fondo), pr = Fa.proyeccion(E, ref);
        const pref = pm ? (modelo === 'solidario' ? -pm.eco / 100 : modelo === 'capacidad' ? pm.eco / 100 : modelo === 'bilateral' ? (pm.ter || 0) / 150 : 0.1) : 0;
        mejores.push({ ref, sc: pr.si + pref * 3 - pr.coste * 6 + U.gauss(0, 0.7) });
      }
      mejores.sort((a, b) => b.sc - a.sc); const fa = Fa.asegurar(E); fa.ref = mejores[0].ref; fa.ref.t = E.fecha.t;
      noticia(E, `El Gobierno abre la reforma de la financiación autonómica con un modelo de «${MODELOS[fa.ref.modelo].n.toLowerCase()}».`);
      for (let i = 0; i < 3; i++) { const pr = Fa.proyeccion(E, fa.ref); for (const c of Object.keys(pr.por)) if (pr.por[c].voto !== 'si' && U.chance(0.45)) fa.ref.cab[c] = clamp((fa.ref.cab[c] || 0) + 0.35, 0, 1.2); }
      const r = Fa.convocar(E, 0.18); if (!r.aprobada) { const fa2 = Fa.asegurar(E); fa2.hist.unshift({ t: E.fecha.t, modelo: fa2.ref.modelo, res: 'rechazada en el Consejo' }); fa2.ref = null; fa2.ultInt = E.fecha.t; }
    },
    /* Si el proyecto muere en las Cortes sin votarse (retirado, archivado, decaído por disolución), la reforma se cierra. */
    vigilar(E) {
      const fa = Fa.asegurar(E), ref = fa.ref; if (!ref || ref.fase !== 'cortes') return;
      const p = E.proyectos[ref.propId]; if (p && (C.Congreso.ABIERTAS.includes(p.etapa) || p.etapa === 'sancionada')) return;
      Fa.rechazada(E, p || { id: ref.propId });
    },
    turno(E) {
      Fa.vigilar(E);
      const fa = Fa.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob;
      if (!fa.ref && g.pm !== 'J' && E.esp.cortes.estado === 'activa' && t > 30 && t - fa.ult > 312 && t - fa.ultInt > 104 && g.estab > 35 && U.chance(0.004)) Fa.iaAbre(E);
    },

    /* ── Concierto vasco y Convenio navarro ── */
    /* El presidente foral expone su postura antes de que el Consejo de Ministros fije el cupo. */
    negociarCupo(E, c, stance) {
      const fa = Fa.asegurar(E), cu = fa.cupo[c]; if (!cu) return { ok: false, msg: 'Sólo el País Vasco y Navarra tienen Concierto o Convenio' };
      if (!['bajar', 'mantener'].includes(stance)) return { ok: false, msg: 'Elige una postura' };
      const prox = E.esp.cupo.proxT, enAgenda = E.esp.consejo && E.esp.consejo.agenda.some(i => i.tipo === 'cupo' && i.region === c);
      if (!enAgenda && prox - E.fecha.t > 16) return { ok: false, msg: `La Comisión Mixta se abre unas semanas antes de la renovación (${U.fmtT(prox)})` };
      if (E.fecha.t - cu.t < 8) return { ok: false, msg: 'Ya has expuesto tu postura hace poco' };
      cu.stance = stance; cu.t = E.fecha.t; const rc = E.esp.ccaa[c];
      if (stance === 'bajar') { rc.relM = Math.max(0, rc.relM - 1.5); C.Personaje.cambiar(E, { prestigio: 0.4, pop: 0.5 }); }
      return { ok: true, msg: stance === 'bajar' ? `Exiges una rebaja del cupo: ${E.esp.consejo ? 'el Gobierno tendrá en cuenta tu presión' : 'tensión con Moncloa'}.` : 'Propones renovar el cupo sin cambios: el Gobierno lo agradece.' };
    },
    /* Decisión del Gobierno de la IA sobre el cupo; null deja la decisión por defecto. */
    decideCupo(E, c, pm) {
      const fa = Fa.asegurar(E), cu = fa.cupo[c]; if (!cu || !cu.stance) return null;
      const rc = E.esp.ccaa[c], g = E.paises.ES.gob, pr = rc.gob && rc.gob.partido, socio = !!pr && (g.coalicion.includes(pr) || (g.apoyoExterno || []).includes(pr));
      if (cu.stance === 'bajar') return socio ? (U.chance(0.6) ? 'bajar' : 'bajar_poco') : (U.chance(0.3) ? 'bajar_poco' : 'pactar');
      return socio ? 'pactar' : ((pm && pm.ter < -30) ? 'subir_poco' : 'pactar');
    },
    aplicarCupoSuave(E, c, k) {
      const rc = E.esp.ccaa[c], d = nombre(c);
      if (k === 'subir_poco') { rc.relM = Math.max(0, rc.relM - 4); rc.fin.nivel -= 2; E.paises.ES.ec.pol.deficit -= 0.04; const m = `Cupo algo más alto para ${d}: pequeño ingreso extra para el Estado`; noticia(E, m + '.'); return m; }
      rc.relM = Math.min(100, rc.relM + 5); rc.fin.nivel += 2; E.paises.ES.ec.pol.deficit += 0.04; for (const x of T().ids()) if (x !== c) E.esp.ccaa[x].agravio += 0.5;
      const m = `Cupo algo más bajo para ${d}: contenta al gobierno foral y roza al resto`; noticia(E, m + '.'); return m;
    }
  };

  /* ── Ganchos ── */
  const Co = C.Congreso, Tr = C.Territorio;
  if (Tr && Tr.efectoLey) { const f = Tr.efectoLey; Tr.efectoLey = function (E, efecto, p) { if (p && p.faRef) return Fa.aplicar(E, p); return f.apply(this, arguments); }; }
  if (Co && Co.alFinalizar) { const f = Co.alFinalizar; Co.alFinalizar = function (E, p, ok) { const r = f.apply(this, arguments); if (p && p.faRef && !ok) Fa.rechazada(E, p); return r; }; }
  if (Tr && Tr.aplicarCupo) {
    const f = Tr.aplicarCupo;
    Tr.aplicarCupo = function (E, c, k) {
      const r = (k === 'subir_poco' || k === 'bajar_poco') ? Fa.aplicarCupoSuave(E, c, k) : f.apply(this, arguments);
      const cu = Fa.asegurar(E).cupo[c]; if (cu) { cu.stance = null; cu.hist.unshift({ t: E.fecha.t, k }); if (cu.hist.length > 6) cu.hist.length = 6; }
      return r;
    };
  }

  /* ── Acciones ── */
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const PM = E => pmJ(E) ? true : 'Sólo el presidente/a del Gobierno';
  const conRef = E => { const r = PM(E); if (r !== true) return r; return Fa.ref(E) ? true : 'No hay un borrador de reforma abierto'; };
  const presForal = E => { const J = E.jugador; return J.pais === 'ES' && J.cargo === 'presauto' && ['PVA', 'NAV'].includes(J.region) && E.esp.ccaa[J.region].gob && E.esp.ccaa[J.region].gob.pres === 'J' ? true : 'Sólo el presidente/a del País Vasco o de Navarra'; };
  const presPart = E => { const J = E.jugador; return J.pais === 'ES' && J.cargo === 'presauto' && Fa.participantes(E).includes(J.region) && E.esp.ccaa[J.region].gob && E.esp.ccaa[J.region].gob.pres === 'J' ? true : 'Sólo el presidente/a de una comunidad de régimen común'; };
  R({ id: 'abrir_reforma_financiacion', nombre: 'Abrir la reforma de la financiación autonómica', icono: '💶', costo: 2, desc: 'Presidente/a del Gobierno: elige un modelo de reparto, con o sin garantía de que nadie pierda y con un fondo transitorio, y negócialo con las comunidades.', disponible: E => { const r = PM(E); return r !== true ? r : Fa.puede(E); }, ejecutar: (E, a) => Fa.abrir(E, a.modelo || 'poblacion', a.garantia === '1' || a.garantia === true || a.garantia === 'si', a.fondo) });
  R({ id: 'ajustar_financiacion', nombre: 'Ajustar el modelo de financiación', icono: '🎛', costo: 1, desc: 'Cambia el modelo, la garantía de que nadie pierde o el fondo transitorio del borrador.', disponible: conRef, ejecutar: (E, a) => Fa.ajustar(E, a) });
  R({ id: 'cabildear_ccaa_fin', nombre: 'Cabildear a una comunidad (financiación)', icono: '🤝', costo: 1, desc: 'Negocia con el gobierno de una comunidad para ganar su voto en el Consejo de Política Fiscal y Financiera.', disponible: conRef, ejecutar: (E, a) => Fa.cabildear(E, a.c) });
  R({ id: 'contrapartida_ccaa_fin', nombre: 'Pactar una contrapartida con una comunidad', icono: '🎁', costo: 2, desc: 'Compra el voto de una comunidad con inversiones: apoyo casi seguro a cambio de déficit y algo de prestigio. Una vez por comunidad.', disponible: conRef, ejecutar: (E, a) => Fa.contrapartida(E, a.c) });
  R({ id: 'convocar_cpff_reforma', nombre: 'Convocar el Consejo de Política Fiscal y Financiera', icono: '🏛', costo: 2, desc: 'Se vota el modelo: hace falta la mayoría de las comunidades participantes. Si sale, pasa a las Cortes como ley orgánica.', disponible: conRef, ejecutar: E => Fa.convocar(E) });
  R({ id: 'retirar_reforma_financiacion', nombre: 'Retirar la reforma de la financiación', icono: '↩', costo: 0, desc: 'Abandonas la reforma (también si ya está en las Cortes).', disponible: E => { const r = PM(E); return r !== true ? r : (Fa.asegurar(E).ref ? true : 'No hay reforma en marcha'); }, ejecutar: E => Fa.retirar(E) });
  R({ id: 'fijar_voto_cpff', nombre: 'Fijar el voto de tu comunidad en la reforma', icono: '🗳', costo: 0, grupo: 'autonomico', desc: 'Presidente/a autonómico/a: decides si tu comunidad vota a favor, en contra o se abstiene en el Consejo de Política Fiscal y Financiera.', disponible: E => { const r = presPart(E); return r !== true ? r : (Fa.ref(E) ? true : 'No hay un borrador de reforma abierto'); }, ejecutar: (E, a) => Fa.fijarVoto(E, a.voto) });
  R({ id: 'negociar_cupo', nombre: 'Negociar el cupo (Concierto o Convenio)', icono: '📜', costo: 2, grupo: 'autonomico', desc: 'Presidente/a vasco/a o navarro/a: expones tu postura antes de que el Consejo de Ministros fije el cupo. Pesa más si tu partido apoya al Gobierno.', disponible: presForal, ejecutar: (E, a) => Fa.negociarCupo(E, E.jugador.region, a.postura) });
  C.Tiempo.registrar('financia', { turno: E => Fa.turno(E) }, 36);
})(window.ESP);

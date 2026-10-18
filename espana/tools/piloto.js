/* Piloto automático: juega como lo haría un jugador al azar (resuelve las decisiones pendientes y ejecuta acciones con argumentos válidos).
   Lo usan tools/jugador-es.js, las pruebas de partidas largas y el generador de partidas de prueba. */
module.exports = function (C) {
  const U = C.U, acciones = C.Acciones.lista().map(a => a.id);
  const Pi = {
    /* Decisiones que el piloto no supo resolver y tuvo que dejar al desatasco: si salen, falta una rama aquí (o una ventana en el juego). */
    desatascos: [],
    /* Resuelve, al azar, las decisiones que detienen el tiempo. */
    resolver(E) {
      const P = E.paises.ES; let g = 0;
      while (C.Tiempo.bloqueo() && g++ < 20) {
        const b = C.Tiempo.bloqueo();
        if (E.esp.pendienteSesion) C.Sesion.resolverAuto(E, U.rf(-0.5, 0.8));
        else if (b === 'evento' && E.esp.pendienteCongreso) C.PartidoInt.congreso(E, { bonus: U.ri(0, 6) });
        else if (b === 'evento' && E.esp.pendienteCrisisV) { const cr = C.CrisisDirecto.asegurar(E).act.find(x => x.uid === E.esp.pendienteCrisisV); if (!cr) E.esp.pendienteCrisisV = null; else { const sc = C.CrisisDirecto.cat(cr.id); while (cr.paso < sc.pasos.length) C.CrisisDirecto.elegir(E, cr, U.pick(sc.pasos[cr.paso][4])[0]); C.CrisisDirecto.cerrar(E, cr); } }
        else if (b === 'evento' && E.esp.pendienteDebate) C.Campana.celebrarDebate(E, U.pick(['ataque', 'propuestas', 'prudente']));
        else if (b === 'evento') { const ev = E.eventos.pendientes[0]; C.Eventos.resolver(E, 0, U.ri(0, Math.max(0, ev.opciones.length - 1))); }
        else if (b === 'voto' && E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; C.Territorio.votarLey(E, pv.c, C.Territorio.leyAut(E, pv.c, pv.id), U.pick(['si', 'abs', 'no'])); }
        else if (b === 'voto' && E.esp.pendienteConvAut) { const pv = E.esp.pendienteConvAut, d = C.Territorio.rdlAut(E, pv.c, pv.id); if (!d || d.estado !== 'vigor') E.esp.pendienteConvAut = null; else C.Territorio.convalidar(E, pv.c, d, U.pick(['si', 'abs', 'no'])); }
    else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); const p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, U.pick(['si', 'no', 'abs'])); }
        else if (b === 'ue') { C.UE.decidir(E, 0, U.pick(['si', 'no', 'abs'])); }
        else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; }
        else if (b === 'investidura') { const pa = E.esp.pendienteInvAut; if (pa && pa.c === 'ES') { const cs = C.Ejecutivo.candidatosInv(E); C.Ejecutivo.nominarJugador(E, U.pick(cs).p); } else if (pa) { const T = C.Territorio, v = E.esp.ccaa[pa.c].inv; if (pa.tipo === 'nominar') T.invNominarJugador(E, pa.c, U.pick(T.invOpciones(E, pa.c)).p); else if (U.chance(0.2)) T.invRenunciaJugador(E, pa.c); else T.invCandidatoJugador(E, pa.c, T.bloque(E, pa.c, v.cand).bloque); } else if (E.esp.pendienteSocio) C.Ejecutivo.socioJugador(E, U.pick(['si', 'abs', 'no']), []); else { const inv = E.esp.cortes.investidura; if (inv) C.Ejecutivo.investidurJugador(E, inv.plan); else E.esp.pendienteInvestidura = false; } }
        else if (b === 'gabinete') { C.Gabinete.confirmar(E, E.esp.pendienteGabinete.key); E.esp.pendienteGabinete = null; }
        else if (b === 'escandalo') { E.esp.gab.escandalo = null; }
        else if (b === 'consejo') { const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, U.pick(ops).k); }
        else break;
      }
      if (C.Tiempo.bloqueo() && C.Desatasco) { const t = C.Desatasco.resolver(E); if (t) Pi.desatascos.push(U.fmtT(E.fecha.t) + ': ' + t + ' (' + C.Tiempo.bloqueo() + ')'); }
    },
    /* Ejecuta n acciones al azar; `hechas` cuenta las que salieron bien. */
    acciones(E, n, hechas) {
      const P = E.paises.ES; hechas = hechas || {};
      for (let k = 0; k < n; k++) {
    const id = U.pick(acciones); const a = C.Acciones.get(id); const args = {};
    if (id === 'proponer_ley' || id === 'propuesta_consejo') args.tpl = U.pick(C.DATA.leyes.filter(l => !l.manual && !l.rdlSolo)).id;
    if (id === 'cabildear_ley') { const ab = C.Congreso.abiertos(E); if (ab.length) { args.proy = U.pick(ab).id; args.pid = U.pick(P.partidos); } }
    if (id === 'reclamar_competencia') args.comp = U.pick(Object.keys(C.DATA.competencias));
    if (id === 'ofrecer_comp') { args.region = U.pick(C.Territorio.ids()); args.comp = U.pick(Object.keys(C.DATA.competencias)); }
    if (id === 'negociar_financiacion') args.tipo = U.pick(['cesion', 'nivelacion', 'singular']);
    if (id === 'politica_fiscal') args.dir = U.pick(['bajar', 'subir']);
    if (id === 'proyecto_urbano') args.proy = U.pick(Object.keys(C.Municipios.PROYECTOS));
    if (id === 'politica_gasto') { args.area = U.pick(C.Municipios.AREAS); args.nivel = U.ri(0, 2); }
    if (id === 'politica_ibi') args.dir = U.pick(['subir', 'bajar']);
    if (id === 'fondos_municipales') args.quien = U.pick(['ccaa', 'estado', 'ue']);
    if (id === 'visita_ccaa') args.region = U.pick(C.Territorio.ids());
    if (id === 'proponer_cambio_ley') { const v = (E.esp.vigor || []).filter(x => x.estado === 'activa'); if (v.length) { args.vigor = U.pick(v).id; args.tipo = U.pick(['derogar', 'reformar']); } }
    if (id === 'aceptar_enmienda') { const ps = C.Congreso.abiertos(E).filter(p => p.autor.tipo === 'jugador' || p.autor.tipo === 'gobierno'); if (ps.length) { const p = U.pick(ps), en = C.Impacto.enmiendas(E, p); if (en.length) { args.proy = p.id; args.k = en[0].cambio.k; args.v = en[0].cambio.v; args.pid = en[0].pid; } } }
    if (id === 'programa_consejeria') { const T = C.Territorio, Jx = E.jugador; if (Jx.region && E.esp.ccaa[Jx.region]) { const ps = Jx.cargo === 'presauto' ? Object.values(C.DATA.programas).flat() : (Jx.area ? T.programasDe(E, Jx.region, Jx.area) : []); if (ps.length) args.prog = U.pick(ps).id; } }
    if (id === 'reorganizar_gobierno') args.n = U.ri(7, 15);
    if (id === 'candidatura_aut') { const o = U.pick(C.Personaje.opcionesLista(E)); args.region = o.c; args.cabeza = U.chance(0.5); }
    if (id === 'ordenanza') args.tipo = U.pick(['vivienda', 'obras', 'turismo']);
    if (id === 'cabildear_exp') { const ab = C.UE.abiertos(E); if (ab.length) args.exp = U.pick(ab).id; }
    if (id === 'negociar_pge') { args.pid = U.pick(P.partidos); const ds = C.Presupuesto.demandas(E, args.pid); if (ds.length) args.k = U.pick(ds).k; }
      if (id === 'obra_lanzar' || id === 'obra_pedir') { const ob = C.Obras.aleatoria(E, id === 'obra_pedir' ? 'pedir' : 'lanzar'); if (ob) Object.assign(args, ob); }
    if (id === 'obra_cancelar' || id === 'obra_acelerar') { const mias = C.Obras.activas(E).filter(w => w.quien === 'jug'); if (mias.length) args.id = U.pick(mias).id; }
    if (id === 'proponer_exp') args.tpl = U.pick(C.DATA.expedientes.filter(x => x.tipo !== 'cumbre')).id;
    const r = C.Acciones.ejecutar(id, args); if (r.ok !== false) hechas[id] = (hechas[id] || 0) + 1;
  }
      return hechas;
    },
    /* Una semana completa: decisiones, acciones y paso del tiempo. Devuelve false si el tiempo no avanza. */
    semana(E, hechas) { Pi.resolver(E); Pi.acciones(E, 3, hechas); if (E.ui.abrir) E.ui.abrir = null; Pi.resolver(E); return C.Tiempo.avanzar(); }   // una acción puede abrir una decisión (como en el juego, donde su ventana sale al momento)
  };
  return Pi;
};

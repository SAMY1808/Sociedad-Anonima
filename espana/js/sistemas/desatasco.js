/* Desatasco: red de seguridad contra bloqueos. El tiempo se detiene mientras haya una decisión pendiente (un debate, una votación, un evento…);
   si esa decisión no se puede mostrar (un fallo en su ventana, un aviso heredado de una partida antigua…), el jugador no podría avanzar nunca.
   `resolver(E)` resuelve UNA decisión pendiente por el camino más neutro (abstenerse, la primera opción, el tono prudente…) y devuelve un texto
   que lo cuenta, o null si no había nada pendiente. Lo usa `App` cuando una ventana falla o no llega a abrirse. */
window.ESP = window.ESP || {};
(function (C) {
  const Ds = C.Desatasco = {
    resolver(E) {
      const b = C.Tiempo.bloqueo(); if (!b) return null;
      let que = 'una decisión pendiente';
      try {
        if (E.esp.pendienteSesion) { C.Sesion.resolverAuto(E, 0); que = 'la sesión en directo'; }
        else if (b === 'evento' && E.esp.pendienteCongreso) { C.PartidoInt.congreso(E, { bonus: 0 }); que = 'el congreso del partido'; }
        else if (b === 'evento' && E.esp.pendienteCrisisV) {
          const cr = C.CrisisDirecto.asegurar(E).act.find(x => x.uid === E.esp.pendienteCrisisV); que = 'una crisis';
          if (!cr) E.esp.pendienteCrisisV = null;
          else { const sc = C.CrisisDirecto.cat(cr.id); while (cr.paso < sc.pasos.length) C.CrisisDirecto.elegir(E, cr, sc.pasos[cr.paso][4][0][0]); C.CrisisDirecto.cerrar(E, cr); }
        }
        else if (b === 'evento' && E.esp.pendienteDebate) { C.Campana.resolverDebates(E, 'prudente'); que = 'un debate'; }
        else if (b === 'evento' && E.eventos.pendientes.length) { const ev = E.eventos.pendientes[0]; C.Eventos.resolver(E, 0, 0); que = 'un suceso («' + ev.titulo + '»)'; }
        else if (b === 'voto' && E.esp.pendienteVotoAut) { const pv = E.esp.pendienteVotoAut; C.Territorio.votarLey(E, pv.c, C.Territorio.leyAut(E, pv.c, pv.id), 'abs'); que = 'una votación autonómica'; }
        else if (b === 'voto' && E.esp.pendienteConvAut) { const pv = E.esp.pendienteConvAut, d = C.Territorio.rdlAut(E, pv.c, pv.id); if (!d || d.estado !== 'vigor') E.esp.pendienteConvAut = null; else C.Territorio.convalidar(E, pv.c, d, 'abs'); que = 'la convalidación de un decreto-ley autonómico'; }
        else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(), p = E.proyectos[id]; if (p) C.Congreso.resolver(E, p, 'abs'); que = 'una votación en el pleno'; }
        else if (b === 'ue') { C.UE.decidir(E, 0, 'abs'); que = 'un voto en el Consejo Europeo'; }
        else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; que = 'una noche electoral'; }
        else if (b === 'investidura') {
          que = 'una investidura'; const pa = E.esp.pendienteInvAut;
          if (pa && pa.c === 'ES') { const cs = C.Ejecutivo.candidatosInv(E); C.Ejecutivo.nominarJugador(E, cs[0].p); }
          else if (pa) { const T = C.Territorio, v = E.esp.ccaa[pa.c].inv; if (pa.tipo === 'nominar') T.invNominarJugador(E, pa.c, T.invOpciones(E, pa.c)[0].p); else T.invCandidatoJugador(E, pa.c, T.bloque(E, pa.c, v.cand).bloque); }
          else if (E.esp.pendienteSocio) C.Ejecutivo.socioJugador(E, 'abs', []);
          else { const inv = E.esp.cortes.investidura; if (inv) C.Ejecutivo.investidurJugador(E, inv.plan); else E.esp.pendienteInvestidura = false; }
        }
        else if (b === 'gabinete') { C.Gabinete.confirmar(E, E.esp.pendienteGabinete.key); E.esp.pendienteGabinete = null; que = 'el nombramiento de un ministro'; }
        else if (b === 'escandalo') { E.esp.gab.escandalo = null; que = 'un escándalo en el Gobierno'; }
        else if (b === 'consejo') { const it = E.esp.consejo.agenda.find(x => x.urgente); const ops = C.Consejo.opciones(E, it); C.Consejo.resolver(E, it.id, ops[0].k); que = 'un asunto urgente del Consejo de Ministros'; }
      } catch (e) { console.error('[Desatasco] no se pudo resolver', b, e); }
      /* Si lo anterior no bastó (o falló), se limpia el aviso: es preferible perder una decisión que quedarse sin poder avanzar. */
      if (C.Tiempo.bloqueo() === b) Ds.limpiar(E);
      return `Se resolvió automáticamente ${que} que no se podía mostrar.`;
    },
    /* Último recurso: borra los avisos pendientes que detienen el tiempo. */
    limpiar(E) {
      E.eventos.pendientes.length = 0; E.parl.pendienteVoto.length = 0; E.ue.pendiente.length = 0;
      for (const k of ['pendienteVotoAut', 'pendienteConvAut', 'pendienteCrisisV', 'pendienteSesion', 'pendienteInvAut', 'pendienteGabinete']) E.esp[k] = null;
      for (const k of ['pendienteDebate', 'pendienteCongreso', 'pendienteInvestidura', 'pendienteSocio']) E.esp[k] = false;
      if (E.esp.gab) E.esp.gab.escandalo = null;
      E.elecciones.nochePendiente = E.elecciones.presPendiente = E.elecciones.pePendiente = null;
      if (E.esp.consejo) for (const i of E.esp.consejo.agenda) i.urgente = false;
    }
  };
})(window.ESP);

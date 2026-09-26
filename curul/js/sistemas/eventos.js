/* Eventos procedurales: el mundo genera sucesos; algunos exigen una decisión del jugador. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const Ev = {
    plantilla: id => C.DATA.eventos.find(e => e.id === id),
    /* Rellena los textos con el contexto del evento */
    texto(E, s, ctx) {
      return String(s).replace(/\{(\w+)\}/g, (_, k) => {
        if (k === 'depto') return ctx.depto ? E.deptos[ctx.depto].nombre : 'el país';
        if (k === 'ministerio') return ctx.ministerio ? C.DATA.ministerios.find(m => m.id === ctx.ministerio).nombre : '';
        if (k === 'medio') return ctx.medio ? C.Medios.medio(E, ctx.medio).nombre : 'Un medio';
        if (k === 'partidoJug') return E.partidos[E.jugador.partido] ? E.partidos[E.jugador.partido].nombre : 'tu movimiento';
        return '';
      });
    },
    disparar(E, pl, ctx = {}) {
      if (pl.alcance === 'regional' && !ctx.depto) ctx.depto = U.pesado(Object.values(E.deptos), d => d.poblacion / 1000 + 1).id;
      if (pl.ctxFn) Object.assign(ctx, pl.ctxFn(E) || {});
      if (/\{ministerio\}/.test(pl.titulo + pl.texto) && !ctx.ministerio) ctx.ministerio = U.pick(C.DATA.ministerios).id;
      if (/\{medio\}/.test(pl.titulo + pl.texto) && !ctx.medio) ctx.medio = U.pick(E.medios.lista.filter(m => m.credibilidad > 55)).id;
      const ev = { id: U.id('ev'), plantilla: pl.id, t: E.fecha.t, ctx, titulo: Ev.texto(E, pl.titulo, ctx), texto: Ev.texto(E, pl.texto, ctx), tipo: pl.tipo, icono: pl.icono };
      Ev.aplicarEfecto(E, pl.efecto, ctx);
      E.eventos.historial.unshift(ev); if (E.eventos.historial.length > 120) E.eventos.historial.length = 120;
      C.Medios.noticia(E, { tipo: 'evento', titular: ev.titulo, tono: (pl.efecto && pl.efecto.aprob < 0) ? -1 : (pl.efecto && pl.efecto.aprob > 0 ? 1 : 0), ref: { evento: ev.id }, jugador: pl.alcance === 'jugador' });
      const J = E.jugador;
      const relevante = pl.alcance === 'jugador' || J.reconocimiento >= 10 || C.DATA.cargos[J.cargo].nivel >= 2;
      if (pl.opciones && relevante) E.eventos.pendientes.push(ev);
      C.Bus.emit('evento', ev);
      return ev;
    },
    aplicarEfecto(E, ef, ctx) {
      if (!ef) return;
      for (const [v, d] of Object.entries(ef.eco || {})) C.Economia.aplicarDelta(E, v, d);
      if (ef.aprob) E.opinion.aprobacionPres = U.clamp(E.opinion.aprobacionPres + ef.aprob, 3, 95);
      if (ef.depto && ctx.depto) for (const [k, d] of Object.entries(ef.depto)) { const dep = E.deptos[ctx.depto]; if (dep[k] != null) dep[k] = U.clamp(dep[k] + d, 1, 99); }
      if (ef.gobPop && E.partidos[E.gobierno.partido]) E.partidos[E.gobierno.partido].popularidad += ef.gobPop;
      if (ef.escandaloGob) E.opinion.escandalos += 1;
      if (ef.cambioMinistro && ctx.ministerio && E.gobierno.presidente !== 'J') {
        const actual = E.politicos[E.gobierno.gabinete[ctx.ministerio]];
        C.Gobierno.designar(E, ctx.ministerio, actual ? actual.partido : null);
      }
    },
    /* Aplica la opción elegida por el jugador */
    resolver(E, evId, i) {
      const k = E.eventos.pendientes.findIndex(e => e.id === evId); if (k < 0) return null;
      const ev = E.eventos.pendientes[k], pl = Ev.plantilla(ev.plantilla), op = pl.opciones[i], J = E.jugador;
      E.eventos.pendientes.splice(k, 1);
      ev.eleccion = i;
      const cambios = [];
      const jug = op.jug || {};
      for (const k2 of ['popularidad', 'reconocimiento', 'credibilidad', 'patrimonio']) if (jug[k2]) {
        if (k2 === 'popularidad') C.Opinion.moverImagen(E, { seg: Object.fromEntries(Object.values(C.Opinion.SEGMENTOS).flat().map(s => [s[0], jug[k2] * 0.7])) });
        else if (k2 === 'reconocimiento') C.Opinion.subirRec(E, jug[k2] * 0.7);
        else J[k2] = U.clamp(J[k2] + jug[k2], k2 === 'patrimonio' ? -1e9 : 0, k2 === 'patrimonio' ? 1e12 : 100);
        cambios.push([k2, jug[k2]]);
      }
      for (const [k2, v] of Object.entries(jug.rep || {})) { J.rep[k2] = U.clamp(J.rep[k2] + v, 0, 100); cambios.push([k2, v]); }
      if (op.segmento) { C.Opinion.moverImagen(E, { seg: op.segmento }); for (const [s, v] of Object.entries(op.segmento)) cambios.push(['seg:' + s, v]); }
      if (op.deptoAfin && ev.ctx.depto) { C.Opinion.moverImagen(E, { dep: { [ev.ctx.depto]: op.deptoAfin }, rec: { [ev.ctx.depto]: Math.max(0, op.deptoAfin) } }); cambios.push(['dep:' + ev.ctx.depto, op.deptoAfin]); }
      if (op.relGob) { for (const pid of E.gobierno.coalicion || []) E.partidos[pid].relJ = U.clamp(E.partidos[pid].relJ + op.relGob, -100, 100); const pr = E.politicos[E.gobierno.presidente]; if (pr) pr.relJ = U.clamp(pr.relJ + op.relGob * 1.5, -100, 100); cambios.push(['relGob', op.relGob]); }
      if (op.partidoRel && E.partidos[J.partido]) { const pa = E.partidos[J.partido]; pa.relJ = U.clamp(pa.relJ + op.partidoRel, -100, 100); C.Partidos.dominante(pa).relJ += op.partidoRel; cambios.push(['partido', op.partidoRel]); }
      if (op.faccionMinor && E.partidos[J.partido]) { const fs = E.partidos[J.partido].facciones.slice().sort((a, b) => a.peso - b.peso); fs[0].relJ += op.faccionMinor; }
      if (op.medioRel && ev.ctx.medio) { const m = C.Medios.medio(E, ev.ctx.medio); m.relJ += op.medioRel; }
      if (op.presupuestoEmergencia && ev.ctx.ministerio) { C.Presupuesto.reforzar(E, ev.ctx.ministerio, op.presupuestoEmergencia); cambios.push(['presupuesto:' + ev.ctx.ministerio, op.presupuestoEmergencia]); }
      if (op.costoAgenda) J.agenda.puntos = Math.max(0, J.agenda.puntos - op.costoAgenda);
      if (op.bienestar) J.bienestar = U.clamp((J.bienestar || 60) + op.bienestar, 0, 100);
      if (op.reconocimientoTxt) J.reconocimientos.push({ t: E.fecha.t, txt: op.reconocimientoTxt });
      if (op.polarizar) C.Opinion.moverImagen(E, { seg: { jovenes: J.ideologia.eco < 0 ? 3 : -3, altos: J.ideologia.eco > 0 ? 3 : -3, bajos: J.ideologia.eco < 0 ? 2 : -2 } });
      if (op.riesgoLider && E.partidos[J.partido]) {
        const gana = U.chance(0.15 + J.reconocimiento / 250 + J.atributos.carisma / 400);
        if (gana) { E.partidos[J.partido].liderJugador = true; J.reconocimientos.push({ t: E.fecha.t, txt: 'Elegido director del ' + E.partidos[J.partido].sigla }); cambios.push(['director', 1]); }
      }
      if (pl.tipo === 'escándalo' && pl.alcance === 'jugador') J.escandalos.push({ t: E.fecha.t, titulo: ev.titulo, respuesta: op.t });
      ev.cambios = cambios;
      C.Bus.emit('evento:resuelto', ev);
      return { ev, op, cambios };
    },
    turno(E) {
      // Evento del mundo (≈ 35 % de las semanas)
      if (U.chance(0.35)) {
        const pls = C.DATA.eventos.filter(e => e.alcance !== 'jugador' && (!e.req || e.req(E)));
        const pl = U.pesado(pls, e => e.peso);
        if (pl) Ev.disparar(E, pl);
      }
      // Evento personal (≈ 8 %)
      if (U.chance(0.08)) {
        const pls = C.DATA.eventos.filter(e => e.alcance === 'jugador' && (!e.req || e.req(E)) && !E.eventos.historial.slice(0, 6).some(h => h.plantilla === e.id));
        const pl = U.pesado(pls, e => e.peso);
        if (pl) Ev.disparar(E, pl);
      }
    }
  };

  C.Eventos = Ev;
  C.Tiempo.registrar('eventos', Ev, 80);
})(window.CURUL);

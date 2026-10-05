/* Eventos: choques globales, sucesos nacionales y decisiones de carrera del jugador. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;

  const Ev = {
    init(E) { E.eventos = { pendientes: [], historial: [] }; },

    /* Evento informativo sin decisión. */
    info(E, titulo, texto) {
      E.eventos.pendientes.push({ id: U.id('e'), key: null, titulo, texto, icono: '', opciones: ['Entendido'], t: E.fecha.t, ctx: {} });
    },

    def(key) { return C.DATA.eventos.find(e => e.id === key); },

    disparar(E, def, ctx) {
      const J = E.jugador, P = E.paises[J.pais];
      const x = ctx || (def.ctx ? def.ctx(E, J, P) : {});
      E.eventos.pendientes.push({ id: U.id('e'), key: def.id, titulo: def.titulo, icono: def.icono, texto: def.texto(E, J, P, x), opciones: def.opciones.map(o => typeof o.t === 'function' ? o.t(E, J, P, x) : o.t), t: E.fecha.t, ctx: x });
      E.eventos.historial.unshift({ key: def.id, t: E.fecha.t });
      if (E.eventos.historial.length > 80) E.eventos.historial.length = 80;
    },

    enfriado(E, def) { return E.eventos.historial.some(h => h.key === def.id && E.fecha.t - h.t < def.cd); },

    turno(E) {
      const J = E.jugador; if (!J) return;
      const P = E.paises[J.pais];
      if (E.eventos.pendientes.length > 2) return;
      // Eventos automáticos de carrera
      for (const def of C.DATA.eventos) {
        if (!def.auto || Ev.enfriado(E, def)) continue;
        let ok = false; try { ok = def.req(E, J, P); } catch (e) { ok = false; }
        if (ok) { Ev.disparar(E, def); return; }
      }
      // Choques globales
      if (U.chance(0.012)) {
        const g = C.DATA.eventos.filter(d => d.global && !Ev.enfriado(E, d));
        const def = U.pick(g);
        if (def) { def.efecto(E); E.eventos.historial.unshift({ key: def.id, t: E.fecha.t }); C.Noticias.poner(E, 'mundo', def.titulo + ': ' + def.texto(), null); Ev.disparar(E, def); return; }
      }
      // Eventos aleatorios
      if (!U.chance(0.09)) return;
      const cand = C.DATA.eventos.filter(d => !d.auto && !d.global && !Ev.enfriado(E, d) && (() => { try { return d.req(E, J, P); } catch (e) { return false; } })());
      const def = U.pesado(cand, d => d.peso);
      if (def) Ev.disparar(E, def);
    },

    /* Resuelve la decisión del jugador y devuelve el texto de resultado. */
    resolver(E, idx, opcion) {
      const ev = E.eventos.pendientes[idx]; if (!ev) return '';
      E.eventos.pendientes.splice(idx, 1);
      if (!ev.key) return '';
      const def = Ev.def(ev.key); if (!def) return '';
      const J = E.jugador, P = E.paises[J.pais];
      const o = def.opciones[opcion]; let txt = '';
      try { txt = o.ef(E, J, P, ev.ctx) || ''; } catch (e) { console.error('[evento]', ev.key, e); }
      if (txt) C.Personaje.log(E, ev.titulo + ' — ' + txt);
      return txt;
    }
  };

  C.Eventos = Ev;
  C.Tiempo.registrar('eventos', Ev, 70);
})(window.ESP);

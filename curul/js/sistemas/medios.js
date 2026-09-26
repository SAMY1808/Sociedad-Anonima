/* Medios de comunicación: ecosistema ficticio, flujo de noticias y acciones de comunicación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const M = {
    init(E) {
      E.medios = { lista: C.DATA.medios.map(m => ({ ...m, relJ: 0 })), noticias: [] };
    },
    /* Publica una noticia; el medio se elige según el tipo y la línea editorial */
    noticia(E, n) {
      if (!E.medios || !E.medios.lista) return;
      let medio = n.medio ? E.medios.lista.find(m => m.id === n.medio) : null;
      if (!medio) {
        const tipoPref = { encuesta: ['Prensa', 'Televisión'], legislativo: ['Portal digital', 'Prensa', 'Radio'], control: ['Televisión', 'Radio', 'Portal digital'], elecciones: ['Televisión'], campana: ['Radio', 'Regional', 'Redes sociales'], evento: ['Televisión', 'Radio', 'Regional'] }[n.tipo] || null;
        medio = U.pesado(E.medios.lista, m => m.audiencia * (tipoPref && tipoPref.includes(m.tipo) ? 2 : 1));
      }
      const item = { id: U.id('n'), t: E.fecha.t, medio: medio.id, titular: n.titular, tipo: n.tipo || 'general', tono: n.tono || 0, ref: n.ref || null, jugador: !!n.jugador, importante: !!n.importante };
      E.medios.noticias.unshift(item);
      if (E.medios.noticias.length > 220) E.medios.noticias.length = 220;
      C.Bus.emit('noticia', item);
      return item;
    },
    medio: (E, id) => E.medios.lista.find(m => m.id === id),
    turno(E) {
      for (const m of E.medios.lista) m.relJ *= 0.996;
    },
    registrarAcciones() {
      const A = C.Acciones;
      A.registrar({ id: 'entrevista', nombre: 'Conceder entrevista', icono: '🎙', grupo: 'medios', costo: 1,
        disponible: (E, a) => M.medio(E, a.medio) ? true : 'Elige un medio',
        ejecutar(E, a) {
          const m = M.medio(E, a.medio), J = E.jugador;
          const hostil = Math.abs(m.linea - J.ideologia.eco) / 200;       // 0 afín … 1 hostil
          const calidad = U.gauss(J.atributos.oratoria / 18 - hostil * 3, 1.6);
          const alcance = m.audiencia / 30;
          C.Opinion.subirRec(E, (1.5 + alcance * 2));
          J.credibilidad = U.clamp(J.credibilidad + U.clamp(calidad, -3, 4) * (m.credibilidad / 70), 0, 100);
          m.relJ = U.clamp(m.relJ + (calidad > 1 ? 4 : -2), -100, 100);
          if (m.region) { const deps = Object.values(E.deptos).filter(d => d.region === m.region).map(d => d.id); const rec = {}; deps.forEach(d => rec[d] = 3); C.Opinion.moverImagen(E, { rec }); }
          if (m.tipo === 'Redes sociales') C.Opinion.moverImagen(E, { seg: { jovenes: calidad > 0 ? 2 : -2, estudiantes: calidad > 0 ? 1.5 : -1.5 } });
          const tono = calidad > 2 ? 1 : calidad < -0.5 ? -1 : 0;
          M.noticia(E, { medio: m.id, tipo: 'entrevista', titular: tono > 0 ? `${J.nombre} brilla en entrevista con ${m.nombre}` : tono < 0 ? `Entrevista tensa: ${J.nombre} a la defensiva en ${m.nombre}` : `${J.nombre} habla con ${m.nombre} sobre la agenda nacional`, tono, jugador: true });
          return { ok: true, msg: tono > 0 ? 'Gran entrevista: ganas credibilidad y visibilidad' : tono < 0 ? 'La entrevista salió mal: el periodista te acorraló' : 'Entrevista correcta' };
        } });
      A.registrar({ id: 'comunicado', nombre: 'Publicar comunicado', icono: '📝', grupo: 'medios', costo: 1,
        ejecutar(E, a) {
          const J = E.jugador;
          C.Opinion.subirRec(E, 0.8);
          if (a.segmento) C.Opinion.moverImagen(E, { seg: { [a.segmento]: 1.5 } });
          M.noticia(E, { tipo: 'comunicado', titular: `${J.nombre}: «${a.texto || 'Seguiremos trabajando por el país'}»`, tono: 0, jugador: true });
          return { ok: true, msg: 'Comunicado publicado' };
        } });
      A.registrar({ id: 'ruedaPrensa', nombre: 'Rueda de prensa', icono: '📸', grupo: 'medios', costo: 2,
        disponible: E => E.jugador.reconocimiento >= 8 || 'Aún no tienes suficiente reconocimiento para convocar a la prensa',
        ejecutar(E) {
          const J = E.jugador, c = U.gauss(J.atributos.oratoria / 20, 1.4);
          C.Opinion.subirRec(E, 3);
          J.credibilidad = U.clamp(J.credibilidad + U.clamp(c, -3, 4), 0, 100);
          J.rep.liderazgo = U.clamp(J.rep.liderazgo + 1, 0, 100);
          M.noticia(E, { tipo: 'comunicado', titular: `${J.nombre} convoca rueda de prensa y marca agenda`, tono: c > 1 ? 1 : 0, jugador: true });
          return { ok: true, msg: 'Tu rueda de prensa marca la agenda del día' };
        } });
      A.registrar({ id: 'campanaComunicacion', nombre: 'Campaña de comunicación segmentada', icono: '🎯', grupo: 'medios', costo: 2,
        disponible: E => E.jugador.patrimonio >= 40 || 'Necesitas $40 millones',
        ejecutar(E, a) {
          const J = E.jugador; J.patrimonio -= 40;
          const seg = a.segmento || 'jovenes';
          C.Opinion.moverImagen(E, { seg: { [seg]: 4 } });
          C.Opinion.subirRec(E, 2);
          return { ok: true, msg: 'Campaña lanzada: mejora tu imagen en el segmento elegido' };
        } });
    }
  };

  C.Medios = M;
  C.Tiempo.registrar('medios', M, 90);
  M.registrarAcciones();
})(window.CURUL);

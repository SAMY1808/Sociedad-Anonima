/* Partidos: popularidad dinámica, facciones internas, disciplina, postura frente al gobierno, avales. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const ESTRUCTURA = { PLR: .85, PUS: .8, CN: .8, PCN: .75, AR: .55, FAP: .45, AVC: .3, NC: .3, LCI: .2, MFF: .6, CPP: .35, MIS: .6, IND: .2 };

  const Pa = {
    init(E) {
      for (const d of C.DATA.partidos) {
        E.partidos[d.id] = {
          id: d.id, nombre: d.nombre, sigla: d.sigla, color: d.color, lema: d.lema,
          eco: d.eco, soc: d.soc, popularidad: d.pop, popBase: d.pop, cohesion: d.cohesion,
          estructura: ESTRUCTURA[d.id] || .4, fuertes: d.fuertes, especial: !!d.especial,
          postura: 'independiente',            // gobierno | independiente | oposicion (Estatuto de Oposición)
          facciones: d.facciones.map((f, i) => ({ id: d.id + '-f' + i, nombre: f[0], eco: f[1], soc: f[2], peso: f[3], lider: null, relJ: 0 })),
          lider: null,
          militantes: Math.round((d.pop || 0.5) * U.rf(38000, 52000)),
          finanzas: Math.round((d.pop || 0.5) * U.rf(1800, 2600)),   // millones COP
          relJ: 0,
          hist: []
        };
      }
    },
    /* Tras generar a los políticos: líderes de partido y de facción */
    asignarLideres(E) {
      const pols = Object.values(E.politicos);
      for (const pa of Object.values(E.partidos)) {
        const miembros = pols.filter(p => p.partido === pa.id && p.activo && p.id !== 'J');
        if (!miembros.length) continue;
        const lider = miembros.slice().sort((a, b) => (b.r.car + b.r.exp + b.fuerza) - (a.r.car + a.r.exp + a.fuerza))[0];
        pa.lider = lider.id;
        for (const f of pa.facciones) {
          const mf = miembros.filter(p => p.faccion === f.id && p.id !== lider.id);
          const l = mf.sort((a, b) => (b.r.amb + b.r.car) - (a.r.amb + a.r.car))[0];
          f.lider = l ? l.id : lider.id;
        }
      }
    },
    miembros(E, pid, soloCongreso) {
      return Object.values(E.politicos).filter(p => p.partido === pid && p.activo && (!soloCongreso || (p.cargo && (p.cargo.tipo === 'senador' || p.cargo.tipo === 'representante'))));
    },
    /* Disciplina efectiva de un congresista frente a la línea de bancada (0..1) */
    disciplina(E, p) {
      const pa = E.partidos[p.partido]; if (!pa) return 0.2;
      return U.clamp((pa.cohesion / 100) * 0.6 + (p.r.dis / 100) * 0.5 - 0.1, 0.05, 1);
    },
    /* Facción dominante */
    dominante(pa) { return pa.facciones.slice().sort((a, b) => b.peso - a.peso)[0]; },
    /* Probabilidad de que el partido otorgue aval al jugador para un cargo */
    probAval(E, pid, cargo) {
      const pa = E.partidos[pid], J = E.jugador; if (!pa) return 0;
      const dom = Pa.dominante(pa);
      const afin = 1 - U.distIdeo(J.ideologia, pa);
      const nivel = { concejo: 0, asamblea: 0.05, alcaldia: 0.15, camara: 0.1, gobernacion: 0.25, senado: 0.2, presidencia: 0.45 }[cargo] || 0.1;
      let p = 0.25 + afin * 0.35 + (J.reconocimiento / 100) * 0.3 + (pa.relJ + dom.relJ) / 400 - nivel;
      if (J.partido === pid) p += 0.2;
      return U.clamp(p, 0.02, 0.97);
    },

    turno(E) {
      const gob = E.gobierno;
      const aprob = E.opinion.aprobacionPres || 45;
      for (const pa of Object.values(E.partidos)) {
        if (pa.especial) continue;
        // Reversión a su base histórica + efecto gobierno/oposición según aprobación
        let objetivo = pa.popBase;
        if (pa.id === gob.partido) objetivo += (aprob - 45) * 0.15;
        else if (pa.postura === 'gobierno') objetivo += (aprob - 45) * 0.05;
        else if (pa.postura === 'oposicion') objetivo -= (aprob - 45) * 0.08;
        pa.popularidad += (objetivo - pa.popularidad) * 0.02 + U.gauss(0, 0.08);
        pa.popularidad = U.clamp(pa.popularidad, 0.3, 45);
        // Las facciones ganan o pierden peso lentamente
        for (const f of pa.facciones) f.peso = U.clamp(f.peso + U.gauss(0, 0.3), 5, 90);
        if (pa.relJ) pa.relJ *= 0.997;
      }
      if (E.fecha.t % 4 === 0) for (const pa of Object.values(E.partidos)) if (!pa.especial) U.serie('pop:' + pa.id, pa.popularidad);
    }
  };

  C.Partidos = Pa;
  C.Tiempo.registrar('partidos', Pa, 30);
})(window.CURUL);

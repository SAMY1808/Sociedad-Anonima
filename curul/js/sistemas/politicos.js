/* IA política: creación de políticos con personalidad y comportamiento autónomo semanal. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  const P = {
    /* Crea un político. `o` puede fijar partido, depto, cargo, ideología, edad… */
    crear(E, o = {}) {
      const N = C.DATA.nombres;
      const genero = o.genero || (U.chance(0.36) ? 'f' : 'm');
      const partido = E.partidos[o.partido];
      const base = partido ? { eco: partido.eco, soc: partido.soc } : { eco: 0, soc: 0 };
      // Algunos políticos pertenecen a una facción concreta de su partido
      let faccion = null;
      if (partido && partido.facciones.length) {
        faccion = U.pesado(partido.facciones, f => f.peso);
        base.eco = faccion.eco; base.soc = faccion.soc;
      }
      const p = {
        id: o.id || U.id('p'),
        nombre: o.nombre || (U.pick(genero === 'f' ? N.m : N.h) + ' ' + U.pick(N.a) + (U.chance(0.55) ? ' ' + U.pick(N.a) : '')),
        genero,
        nac: o.nac || (U.anio() - (o.edad || U.ri(32, 68))),
        depto: o.depto || U.pesado(C.DATA.departamentos, d => d.poblacion).id,
        partido: o.partido || null,
        faccion: faccion ? faccion.id : null,
        eco: U.clamp(Math.round(o.eco != null ? o.eco : base.eco + U.gauss(0, 12)), -100, 100),
        soc: U.clamp(Math.round(o.soc != null ? o.soc : base.soc + U.gauss(0, 14)), -100, 100),
        r: {  // rasgos 0-100
          amb: U.ri(20, 95), dis: U.ri(25, 95), pra: U.ri(15, 95),
          car: U.ri(20, 95), int: U.ri(20, 95), exp: U.ri(10, 90)
        },
        profesion: U.pick(C.DATA.profesiones),
        intereses: U.barajar(Object.keys(C.DATA.sectores)).slice(0, 2),
        relJ: Math.round(U.gauss(0, 8)),          // relación con el jugador
        asistencia: U.rf(0.72, 0.98),
        fuerza: U.ri(25, 80),                      // arrastre electoral personal
        cargo: o.cargo || null,
        stats: { radicados: 0, aprobados: 0, votos: 0, ausencias: 0, intervenciones: 0, debates: 0 },
        tray: [],
        retrato: U.ri(1, 1e6),
        activo: true
      };
      if (o.r) Object.assign(p.r, o.r);
      E.politicos[p.id] = p;
      return p;
    },
    edad: (p) => U.anio() - p.nac,
    nombreCorto: p => { const s = p.nombre.split(' '); return s[0] + ' ' + (s[1] || ''); },
    anotar(p, txt) { p.tray.push({ t: C.E.fecha.t, txt }); if (p.tray.length > 12) p.tray.shift(); },
    /* Todos los congresistas activos de una cámara */
    deCamara(E, cam) { return E.congreso[cam].curules.map(c => E.politicos[c.pol]).filter(Boolean); },
    etiquetaCargo(E, p) {
      const c = p.cargo; if (!c) return 'Sin cargo';
      const def = C.DATA.cargos[c.tipo];
      let t = def ? def.nombre : c.tipo;
      if (c.tipo === 'representante' && c.circ) t += ' · ' + C.Congreso.nombreCirc(c.circ);
      if (c.tipo === 'ministro' && c.ministerio) t = 'Ministro de ' + C.DATA.ministerios.find(m => m.id === c.ministerio).nombre;
      if ((c.tipo === 'gobernador' || c.tipo === 'alcalde') && c.depto) t += ' · ' + (c.tipo === 'alcalde' ? E.deptos[c.depto].capital : E.deptos[c.depto].nombre);
      return t;
    },

    /* ── Comportamiento autónomo semanal ── */
    turno(E) {
      const U_ = U;
      const pols = Object.values(E.politicos);
      const anio = U.anio();
      const hoy = U.hoy();
      const nuevoAnio = U.fechaDe(E.fecha.t - 1).getUTCFullYear() !== anio;

      for (const p of pols) {
        if (!p.activo || p.id === 'J') continue;
        // La relación con el jugador vuelve lentamente a neutral
        if (p.relJ) p.relJ = Math.round(p.relJ * 0.995 * 100) / 100;
        // Retiro por edad (evaluado una vez al año, si no ocupa un cargo)
        if (nuevoAnio && !p.cargo && P.edad(p) > 72 && U_.chance(0.3)) { p.activo = false; P.anotar(p, 'Se retira de la vida pública'); }
      }

      // Congresistas presentan proyectos, hacen control político o declaraciones
      if (C.Congreso.enSesion(E)) {
        const congresistas = [...P.deCamara(E, 'senado'), ...P.deCamara(E, 'camara')].filter(p => p.id !== 'J');
        const nRad = U.ri(0, 2);
        for (let i = 0; i < nRad; i++) {
          const autor = U.pesado(congresistas, p => p.r.amb * (p.r.exp + 30));
          if (autor) C.Legislacion.radicarIA(E, autor);
        }
        // Debate de control político de la oposición
        if (U.chance(0.25)) {
          const opos = congresistas.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion');
          const citante = U.pesado(opos, p => p.r.amb);
          if (citante) C.Gobierno.debateControl(E, citante, null);
        }
      }

      // Transfuguismo: sólo en la ventana previa a la inscripción de listas al Congreso
      const prox = C.Elecciones.proxima(E, 'congreso');
      if (prox) {
        const semanasFalta = U.turnoDe(prox.fecha) - E.fecha.t;
        if (semanasFalta > 16 && semanasFalta < 30 && U.chance(0.15)) P.transfuguismo(E);
      }
      if (hoy.getUTCMonth() === 0 && hoy.getUTCDate() <= 7) for (const p of pols) if (p.cargo && p.cargo.tipo === 'aspirante') p.fuerza = U.clamp(p.fuerza + U.ri(-3, 3), 10, 90);
    },

    transfuguismo(E) {
      const cands = [...P.deCamara(E, 'senado'), ...P.deCamara(E, 'camara')].filter(p => p.id !== 'J' && p.partido && p.partido !== 'IND' && !p.proximoPartido);
      const p = U.pesado(cands, p => {
        const pa = E.partidos[p.partido];
        return U.distIdeo(p, pa) * (100 - p.r.dis) * (p.r.amb / 50);
      });
      if (!p) return;
      const origen = E.partidos[p.partido];
      const destinos = Object.values(E.partidos).filter(x => x.id !== p.partido && !x.especial);
      const dest = destinos.sort((a, b) => U.distIdeo(p, a) - U.distIdeo(p, b) - (b.popularidad - a.popularidad) * 0.01)[0];
      if (!dest || U.distIdeo(p, dest) > U.distIdeo(p, origen) - 0.05) return;
      if (p.proximoPartido) return;
      // Por la prohibición de doble militancia, el cambio se hace efectivo en la próxima inscripción de listas
      p.proximoPartido = dest.id;
      P.anotar(p, 'Anuncia que aspirará por el ' + dest.sigla + ' (deja el ' + origen.sigla + ')');
      C.Medios.noticia(E, { tipo: 'partidos', titular: `${p.nombre} anuncia que dejará el ${origen.sigla} y aspirará por el ${dest.nombre}`, tono: 0, ref: { pol: p.id } });
      C.Bus.emit('politico:transfuga', { pol: p.id, de: origen.id, a: dest.id });
    }
  };

  C.Politicos = P;
  C.Tiempo.registrar('politicos', P, 40);
})(window.CURUL);

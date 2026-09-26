/* Generación procedural del mundo político a partir de una semilla. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const ESCENARIOS = {
    legislatura: { n: 'Nueva legislatura 2026-2030', desc: 'El Congreso recién instalado y un presidente en luna de miel. Cuatro años por delante.', inicio: '2026-07-20T00:00:00Z', presim: 3 },
    electoral:   { n: 'Año preelectoral 2029', desc: 'Final de cuatrienio: el gobierno está desgastado y las elecciones de 2030 se acercan.', inicio: '2029-07-16T00:00:00Z', presim: 4, desgaste: true }
  };

  const Mundo = {
    ESCENARIOS,
    generar(cfg) {
      const esc = ESCENARIOS[cfg.escenario] || ESCENARIOS.legislatura;
      const semilla = cfg.semilla || Math.floor(Math.random() * 2 ** 31);
      const E = C.Estado.vacio(semilla, esc.inicio);
      C.E = E;
      E.meta.nombrePartida = cfg.jugador.nombre;
      E.meta.escenario = cfg.escenario;
      E.meta.presim = true;

      // 1. Territorio
      for (const d of C.DATA.departamentos) E.deptos[d.id] = Object.assign({}, d, { gobernador: null, alcalde: null, ajusteAprob: 0 });
      // 2. Instituciones y sistemas base
      C.Partidos.init(E); C.Economia.init(E); C.Opinion.init(E); C.Medios.init(E);
      // 3. Jugador
      C.Personaje.crear(E, cfg.jugador);
      const J = E.jugador;
      // 4. Gobernadores y alcaldes de capitales
      for (const d of Object.values(E.deptos)) {
        for (const tipo of ['gobernador', 'alcalde']) {
          const cuo = C.Elecciones.cuotas(E, d.id, true);
          const pid = U.pesado(Object.entries(cuo).filter(([p]) => p !== 'BLANCO'), x => x[1] * x[1])[0];
          const p = C.Politicos.crear(E, { partido: pid, depto: d.id, cargo: { tipo, depto: d.id } });
          d[tipo] = p.id;
        }
      }
      if (J.cargo === 'concejal' || J.cargo === 'diputado') J.cargoInfo = { depto: J.residencia };
      // 5. Elecciones de 2026 (historia inicial)
      const forzar = J.cargo === 'senador' ? 'senado' : J.cargo === 'representante' ? 'camara' : null;
      const resC = C.Elecciones.congreso(E, { anio: 2026, forzarJugador: forzar });
      resC.anio = 2026;
      let resP = C.Elecciones.presidencial(E, 1, C.Elecciones.candidatosPresidencia(E));
      resP.anio = 2026;
      const hist = [resC, resP];
      if (!resP.ganador) { const r2 = C.Elecciones.presidencial(E, 2, resP.segunda); r2.anio = 2026; r2.anterior = null; hist.push(r2); resP = r2; }
      hist.forEach(h => { h.t = 0; h.anterior = null; h.inicial = true; });
      E.elecciones.historico.push(...hist);
      E.gobierno.electo = { pol: resP.ganador, partido: resP.candidatos[0].partido, segundo: resP.candidatos[1] };
      // 6. Instalación del Congreso y posesión presidencial
      C.Congreso.instalar(E, resC);
      C.Gobierno.posesionar(E, E.gobierno.electo, true);
      C.Congreso.elegirMesas(E);
      E.congreso.legislatura = 1; E.congreso.sesionAnterior = true;
      C.Partidos.asignarLideres(E);
      if (forzar) J.historialElectoral.push({ anio: 2026, cargo: forzar === 'senado' ? 'senado' : 'camara', depto: forzar === 'camara' ? J.residencia : null, partido: J.partido, votos: (resC.senado.electos.concat(...Object.values(resC.camara.porDepto).map(x => x.electos)).find(e => e.pol === 'J') || {}).votos || 0, electo: true });
      // 7. Agenda inicial: presupuesto del año siguiente y proyectos de bandera del Gobierno
      C.Presupuesto.init(E);
      C.Presupuesto.radicar(E);
      const pres = E.politicos[E.gobierno.presidente];
      const pls = C.DATA.plantillasProyectos.filter(x => !x.gobierno).sort((a, b) => U.distIdeo(pres, a) - U.distIdeo(pres, b)).slice(0, 3);
      for (const pl of pls) { const m = C.Gobierno.ministroDe(E, pl.sector); E.gobierno.agenda.push(C.Legislacion.crear(E, { plantilla: pl.id, autor: m && m.id, gobierno: true, eco: pl.eco * 0.6 + pres.eco * 0.4, soc: pl.soc * 0.6 + pres.soc * 0.4 }).id); }
      const congresistas = [...C.Congreso.miembros(E, 'senado'), ...C.Congreso.miembros(E, 'camara')].filter(p => p.id !== 'J');
      for (let i = 0; i < 10; i++) C.Legislacion.radicarIA(E, U.pick(congresistas));
      // 8. Presimulación silenciosa (el mundo ya está en marcha cuando llega el jugador)
      for (let i = 0; i < esc.presim; i++) { C.Tiempo.avanzar(); E.eventos.pendientes = []; }
      if (esc.desgaste) {
        E.opinion.luna = 0; E.opinion.aprobacionPres = U.rf(34, 42);
        E.congreso.legislatura = 4;
        for (const p of Object.values(E.proyectos)) p.legRad = 4;
        E.economia.deuda += 3; E.economia.deficit += 0.4;
      }
      E.meta.presim = false;
      E.series = {};
      C.Economia.series(E); U.serie('aprobacion', E.opinion.aprobacionPres);
      C.Opinion.encuesta(E);
      E.eventos.pendientes = [];
      E.medios.noticias = E.medios.noticias.filter(n => !n.jugador);
      C.Medios.noticia(E, { tipo: 'general', titular: `Bienvenido a la política: ${J.nombre} empieza una nueva etapa como ${C.DATA.cargos[J.cargo].nombre.toLowerCase()}`, tono: 1, jugador: true, importante: true });
      C.Legislacion.calcularOrdenDelDia(E);
      E.jugador.agenda.puntos = C.Personaje.puntosMax(E);
      return E;
    }
  };
  C.Mundo = Mundo;
})(window.CURUL);

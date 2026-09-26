/* Legislación: proyectos de ley, trámite por etapas, orden del día, votaciones con factores
   trazables (“¿qué pasó?”), enmiendas, negociación y acciones legislativas del jugador. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const T = () => C.DATA.tramite;
  const FACTORES = {
    ideologia: 'Ideología', partido: 'Disciplina de bancada', gobierno: 'Gobierno / oposición', relacion: 'Relaciones',
    regional: 'Presión regional', opinion: 'Opinión pública', costo: 'Costo fiscal', negociacion: 'Negociación',
    interes: 'Intereses sectoriales', ponencia: 'Ponencia', electoral: 'Costo electoral', statuquo: 'Resistencia al cambio', ruido: 'Factores personales'
  };
  const INDICE_SECTOR = { educacion: 'educacion', salud: 'salud', seguridad: 'seguridad', paz: 'seguridad', justicia: 'seguridad',
    infraestructura: 'infraestructura', agricultura: 'infraestructura', vivienda: 'infraestructura', tecnologia: 'educacion', empleo: 'salud' };

  const FK = Object.keys(FACTORES);   // orden fijo para guardar los factores como arreglos compactos
  const L = {
    FACTORES, FK,
    /* Factores guardados en una votación → objeto {factor: valor} */
    factoresDe(v, polId) { const a = v.factores && v.factores[polId]; if (!a) return null; const o = {}; FK.forEach((k, i) => o[k] = a[i] || 0); return o; },
    /* ── Creación de proyectos ─────────────────────────────── */
    crear(E, o) {
      const pl = C.DATA.plantillasProyectos.find(x => x.id === o.plantilla);
      const autor = E.politicos[o.autor];
      const origen = o.origen || (autor && autor.cargo && autor.cargo.camara) || (U.chance(0.5) ? 'senado' : 'camara');
      const anio = U.anio();
      E.meta.numeracion = E.meta.numeracion || {};
      const clave = origen + anio; E.meta.numeracion[clave] = (E.meta.numeracion[clave] || 0) + 1;
      const tipo = pl.tipo;
      const p = {
        id: U.id('pl'), numero: String(E.meta.numeracion[clave]).padStart(3, '0') + '/' + anio + ' ' + (origen === 'senado' ? 'Senado' : 'Cámara'),
        titulo: o.titulo || pl.titulo, plantilla: pl.id, sector: pl.sector, tipo,
        autor: o.autor, coautores: [], partido: autor ? (autor.id === 'J' ? E.jugador.partido : autor.partido) : null,
        gobierno: !!o.gobierno, urgencia: !!o.urgencia,
        origen, etapas: tipo === 'acto' ? T().acto.slice() : T().ordinaria.slice(), etapa: 0, sub: 'radicado',
        comision: C.DATA.sectores[pl.sector].comision, ponentes: [], ponencia: null,
        eco: Math.round(o.eco != null ? o.eco : pl.eco), soc: Math.round(o.soc != null ? o.soc : pl.soc),
        costo: o.costo != null ? o.costo : pl.costo, efectos: JSON.parse(JSON.stringify(o.efectos || pl.efectos)),
        pop: o.pop != null ? o.pop : pl.pop, presion: 0, apoyan: pl.apoyan, opuestos: pl.opuestos,
        enmiendas: [], historial: [], votaciones: [], compromisos: {}, acuerdos: {}, bancadas: {},
        estado: 'tramite', radicado: E.fecha.t, legRad: E.congreso.legislatura || 1, esperaHasta: E.fecha.t + 1,
        modificado: false, persuasion: 0, regionalBonus: null
      };
      E.proyectos[p.id] = p;
      L.hist(E, p, `Radicado en la Secretaría ${origen === 'senado' ? 'del Senado' : 'de la Cámara'} por ${L.nombreAutor(E, p)}`, 'radicacion');
      if (autor) { autor.stats.radicados++; C.Politicos.anotar(autor, 'Radica el proyecto «' + p.titulo + '»'); }
      C.Congreso.log(E, 'radicacion', `Radicado el PL ${p.numero}: «${p.titulo}»`, { proyecto: p.id });
      C.Bus.emit('proyecto:radicado', p);
      return p;
    },
    nombreAutor(E, p) {
      if (p.gobierno && p.autor) { const m = E.politicos[p.autor]; return 'el Gobierno (' + (m ? m.nombre : 'MinInterior') + ')'; }
      if (p.autor === 'J') return E.jugador.nombre;
      return p.autor && E.politicos[p.autor] ? E.politicos[p.autor].nombre : 'Autor desconocido';
    },
    hist(E, p, txt, tipo) { p.historial.push({ t: E.fecha.t, txt, tipo: tipo || 'info' }); },
    etapaActual: p => p.etapas[p.etapa],
    infoEtapa: p => T().etapas[p.etapas[p.etapa]],
    camaraDeEtapa(p, etapaId) {
      const def = T().etapas[etapaId || p.etapas[p.etapa]];
      if (!def || !def.camara) return null;
      return def.camara === 'origen' ? p.origen : (p.origen === 'senado' ? 'camara' : 'senado');
    },
    activos: E => Object.values(E.proyectos).filter(p => p.estado === 'tramite'),

    /* La IA de un congresista elige qué radicar */
    radicarIA(E, autor) {
      const pls = C.DATA.plantillasProyectos.filter(x => !x.gobierno);
      const activos = L.activos(E);
      const pl = U.pesado(pls, x => {
        let w = Math.pow(1 - U.distIdeo(autor, x), 3) * (autor.intereses.includes(x.sector) ? 3 : 1);
        if (activos.some(a => a.plantilla === x.id)) w *= 0.15;
        return w;
      });
      if (!pl) return null;
      return L.crear(E, { plantilla: pl.id, autor: autor.id, eco: pl.eco * 0.7 + autor.eco * 0.3, soc: pl.soc * 0.7 + autor.soc * 0.3 });
    },

    /* ── Posiciones y decisiones de voto ─────────────────────── */
    distProy: (a, p) => U.distIdeo(a, p),
    proximidadElectoral(E) {
      const prox = C.Elecciones.proxima(E, 'congreso'); if (!prox) return 1;
      const sem = C.Elecciones.semanasPara(E, prox);
      return sem < 26 ? 1.6 : sem < 52 ? 1.25 : 1;
    },
    /* Postura de una bancada frente a un proyecto */
    posicionBancada(E, pid, p) {
      const pa = E.partidos[pid]; if (!pa || pa.especial) return 'libre';
      let u = (0.33 - U.distIdeo(pa, p)) * 70;
      if (p.gobierno) u += pa.postura === 'gobierno' ? 18 : pa.postura === 'oposicion' ? -16 : 0;
      if (p.partido === pid) u += 22;
      u += p.pop * 0.3 + (p.acuerdos[pid] || 0);
      if (p.autor === 'J') u += pa.relJ * 0.15;
      if (u > 9) return 'si';
      if (u < -9) return 'no';
      return 'libre';
    },
    /* Factores de decisión de un congresista (sin ruido) */
    factores(E, pol, p, cam) {
      const f = {};
      const pa = E.partidos[pol.partido];
      f.ideologia = (0.33 - U.distIdeo(pol, p)) * 70 * (1 - pol.r.pra / 250);
      const pos = p.bancadas[pol.partido] || L.posicionBancada(E, pol.partido, p);
      const disc = C.Partidos.disciplina(E, pol);
      f.partido = pos === 'si' ? 24 * disc : pos === 'no' ? -24 * disc : 0;
      f.gobierno = 0;
      if (pa) {
        if (p.gobierno) f.gobierno = pa.postura === 'gobierno' ? 13 : pa.postura === 'oposicion' ? -13 : 0;
        else if (E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion' && pa.postura === 'gobierno') f.gobierno = -4;
      }
      f.relacion = 0;
      if (p.autor === 'J' || p.coautores.includes('J')) f.relacion += pol.relJ * 0.22;
      if (p.autor !== 'J' && p.partido === pol.partido) f.relacion += 6;
      if (p.coautores.some(id => E.politicos[id] && E.politicos[id].partido === pol.partido)) f.relacion += 4;
      const d = E.deptos[pol.depto];
      const idx = INDICE_SECTOR[p.sector];
      f.regional = d && idx ? (58 - d[idx]) * 0.15 * Math.sign(p.costo || 1) : 0;
      if (p.regionalBonus && d && d.region === p.regionalBonus) f.regional += 8;
      f.opinion = (p.pop + p.presion) * 0.3;
      f.electoral = (p.pop + p.presion) * 0.15 * (L.proximidadElectoral(E) - 1) * 2;
      f.costo = -Math.max(0, p.costo) * Math.max(0, pol.eco) / 100 * 2.4;
      f.negociacion = (p.compromisos[pol.id] || 0) + (p.acuerdos[pol.partido] || 0) * 0.3 + p.persuasion;
      f.interes = pol.intereses.includes(p.sector) ? f.ideologia * 0.35 : 0;
      f.ponencia = p.ponencia === 'positiva' ? 3 : p.ponencia === 'negativa' ? -7 : 0;
      // Sesgo hacia el statu quo: cambiar la ley cuesta, salvo para la agenda del Gobierno
      f.statuquo = p.gobierno ? 0 : -6 - Math.max(0, p.costo) * 0.8;
      for (const k of Object.keys(f)) f[k] = Math.round(f[k] * 10) / 10;
      return f;
    },
    probSi(f) { return U.sig(U.suma(Object.values(f)) / 7); },
    /* Voto del jugador según su intención */
    votoJugador(E, p) {
      const it = (E.jugador.votos || {})[p.id] || 'bancada';
      if (it !== 'bancada') return it;
      const pos = p.bancadas[E.jugador.partido] || L.posicionBancada(E, E.jugador.partido, p);
      if (pos !== 'libre') return pos;
      return U.distIdeo(E.jugador.ideologia, p) < 0.3 ? 'si' : 'no';
    },
    miembrosInstancia(E, p, cam, instancia) {
      const K = E.congreso[cam];
      if (instancia === 'comision') return K.comisiones[p.comision].miembros.map(id => E.politicos[id]).filter(Boolean);
      return C.Congreso.miembros(E, cam);
    },
    mayoriaReq(p, etapaId) {
      const t = T().tipos[p.tipo];
      if (p.tipo === 'acto' && /3|4/.test(etapaId)) return 'absoluta';
      if (etapaId === 'objecion') return 'absoluta';
      return t.mayoria;
    },
    /* Proyección de una votación: votos esperados y distancia de mayoría */
    proyectar(E, p, cam, instancia) {
      cam = cam || L.camaraDeEtapa(p); instancia = instancia || (L.infoEtapa(p).instancia || 'plenaria');
      if (!cam) return null;
      const ms = L.miembrosInstancia(E, p, cam, instancia);
      let si = 0, no = 0, aus = 0, porPartido = {};
      const previo = {};
      for (const pol of ms) {
        let ps;
        if (pol.id === 'J') { const v = L.votoJugador(E, p); ps = v === 'si' ? 1 : v === 'no' ? 0 : 0.5; }
        else ps = L.probSi(L.factores(E, pol, p, cam));
        const pres = pol.id === 'J' ? 1 : pol.asistencia;
        si += ps * pres; no += (1 - ps) * pres; aus += 1 - pres;
        previo[pol.id] = ps > 0.6 ? 'si' : ps < 0.4 ? 'no' : 'duda';
        const pk = pol.partido || 'IND'; porPartido[pk] = porPartido[pk] || { si: 0, no: 0, n: 0 }; porPartido[pk].si += ps; porPartido[pk].no += 1 - ps; porPartido[pk].n++;
      }
      const req = L.mayoriaReq(p, L.etapaActual(p));
      const n = ms.length;
      const necesarios = req === 'absoluta' ? Math.floor(n / 2) + 1 : Math.floor((si + no) / 2) + 1;
      return { si: Math.round(si), no: Math.round(no), aus: Math.round(aus), n, necesarios, distancia: necesarios - Math.round(si), req, previo, porPartido, cam, instancia };
    },

    /* Ejecuta una votación nominal */
    votar(E, p, cam, instancia, etapaId) {
      const ms = L.miembrosInstancia(E, p, cam, instancia);
      // Posición de las bancadas antes de votar
      for (const pid of new Set(ms.map(m => m.partido))) if (pid) p.bancadas[pid] = L.posicionBancada(E, pid, p);
      const previa = L.proyectar(E, p, cam, instancia);
      const v = { id: U.id('v'), proyecto: p.id, camara: cam, instancia, etapa: etapaId, t: E.fecha.t, votos: {}, factores: {}, previo: previa.previo, bancadas: Object.assign({}, p.bancadas) };
      let si = 0, no = 0, abs = 0, aus = 0;
      for (const pol of ms) {
        let voto;
        if (pol.id === 'J') voto = L.votoJugador(E, p);
        else {
          const f = L.factores(E, pol, p, cam);
          f.ruido = Math.round(U.gauss(0, 5) * 10) / 10;
          const u = U.suma(Object.values(f));
          if (!U.chance(instancia === 'comision' ? Math.min(0.99, pol.asistencia + 0.05) : pol.asistencia)) voto = 'aus';
          else if (Math.abs(u) < 5 && U.chance(0.35)) voto = 'abs';
          else voto = U.chance(U.sig(u / 7)) ? 'si' : 'no';
          v.factores[pol.id] = FK.map(k => f[k] || 0);
          pol.stats.votos++;
          if (voto === 'aus') pol.stats.ausencias++;
        }
        v.votos[pol.id] = voto;
        if (voto === 'si') si++; else if (voto === 'no') no++; else if (voto === 'abs') abs++; else aus++;
      }
      const n = ms.length, req = L.mayoriaReq(p, etapaId);
      const quorum = si + no + abs >= Math.floor(n / 2) + 1;
      const aprobado = quorum && (req === 'absoluta' ? si >= Math.floor(n / 2) + 1 : si > no);
      v.resultado = { si, no, abs, aus, n, req, quorum, aprobado, necesarios: req === 'absoluta' ? Math.floor(n / 2) + 1 : Math.floor((si + no) / 2) + 1 };
      // Disciplina por bancada
      v.disciplina = {};
      for (const [pid, pos] of Object.entries(v.bancadas)) {
        if (pos === 'libre') continue;
        const mm = ms.filter(m => m.partido === pid && v.votos[m.id] !== 'aus');
        if (mm.length) v.disciplina[pid] = Math.round(mm.filter(m => v.votos[m.id] === pos).length / mm.length * 100);
      }
      v.porPartido = {};
      for (const pol of ms) { const pk = pol.id === 'J' ? (E.jugador.partido || 'IND') : (pol.partido || 'IND'); const x = v.porPartido[pk] = v.porPartido[pk] || { si: 0, no: 0, abs: 0, aus: 0 }; x[v.votos[pol.id]]++; }
      v.importante = p.autor === 'J' || p.coautores.includes('J') || p.gobierno || (E.jugador.camara === cam && (instancia === 'plenaria' || E.jugador.comision === p.comision));
      E.votaciones.push(v); p.votaciones.push(v.id);
      L.compactarVotos(E);
      const nombreInst = instancia === 'comision' ? `Comisión ${C.DATA.comisiones[p.comision - 1].nombre} ${C.Congreso.delCamara(cam)}` : `Plenaria ${C.Congreso.delCamara(cam)}`;
      L.hist(E, p, `${nombreInst}: ${aprobado ? 'APROBADO' : 'NEGADO'} (${si} sí · ${no} no · ${abs} abst. · ${aus} aus.)`, aprobado ? 'aprobado' : 'negado');
      C.Congreso.log(E, 'votacion', `${nombreInst} ${aprobado ? 'aprueba' : 'niega'} «${p.titulo}» ${si}-${no}`, { proyecto: p.id, votacion: v.id });
      C.Bus.emit('votacion', v);
      if (v.importante) (E.ui.votosNuevos = E.ui.votosNuevos || []).push(v.id);
      return v;
    },
    /* Las partidas no deben crecer sin límite: las votaciones antiguas conservan sólo su resumen */
    compactarVotos(E) {
      const V = E.votaciones;
      if (V.length > 500) V.splice(0, V.length - 500);
      const n = V.length;
      for (let i = 0; i < n; i++) {
        const edad = n - i;
        if (edad > 24 && V[i].factores) { delete V[i].factores; delete V[i].previo; }
        if (edad > 160 && V[i].votos && !V[i].importante) delete V[i].votos;
        if (edad > 320 && V[i].votos) delete V[i].votos;
      }
    },
    compactarProyectos(E) {
      for (const p of Object.values(E.proyectos)) {
        if (p.estado === 'tramite' || p.compacto) continue;
        const fin = p.sancionada || (p.historial.length ? p.historial[p.historial.length - 1].t : 0);
        if (E.fecha.t - fin < 60) continue;
        if (p.historial.length > 4) p.historial = [p.historial[0], ...p.historial.slice(-3)];
        p.compromisos = {}; p.acuerdos = {}; p.compacto = true;
      }
    },

    /* ── Orden del día y avance del trámite ─────────────────── */
    prioridad(E, p) {
      let s = p.pop * 0.5 + (p.urgencia ? 40 : 0) + (p.gobierno ? 18 : 0) + p.presion;
      const autor = E.politicos[p.autor];
      if (autor && autor.id !== 'J') s += autor.r.exp * 0.15 + (E.partidos[autor.partido] && E.partidos[autor.partido].postura === 'gobierno' ? 6 : 0);
      if (p.autor === 'J') s += 5 + E.jugador.rep.liderazgo * 0.1;
      s += (E.fecha.t - p.radicado) * 0.25;
      return s;
    },
    /* Calcula lo que se votará la próxima semana en cada instancia */
    calcularOrdenDelDia(E) {
      const od = { senado: { comisiones: {}, plenaria: [], conciliacion: [] }, camara: { comisiones: {}, plenaria: [], conciliacion: [] }, objeciones: [] };
      const listos = L.activos(E).filter(p => p.sub === 'agenda' && E.fecha.t + 1 >= p.esperaHasta);
      for (const p of listos.sort((a, b) => L.prioridad(E, b) - L.prioridad(E, a))) {
        const et = L.etapaActual(p), def = T().etapas[et];
        if (et === 'conciliacion') { od.senado.conciliacion.push(p.id); continue; }
        if (et === 'objecion') { od.objeciones.push(p.id); continue; }
        const cam = L.camaraDeEtapa(p);
        if (!cam || !def.instancia) continue;
        if (def.instancia === 'comision') {
          const arr = od[cam].comisiones[p.comision] = od[cam].comisiones[p.comision] || [];
          if (arr.length < (p.urgencia ? 2 : 1)) arr.push(p.id);
        } else if (od[cam].plenaria.length < 2) od[cam].plenaria.push(p.id);
      }
      E.congreso.ordenDia = od;
      return od;
    },
    avanzarEtapa(E, p) {
      p.etapa++;
      p.ponentes = []; p.ponencia = null; p.persuasion = 0; p.compromisos = {};
      const et = L.etapaActual(p);
      if (!et) return;
      const def = T().etapas[et];
      if (et === 'conciliacion') {
        if (!p.modificado) { L.hist(E, p, 'Textos idénticos en ambas cámaras: no requiere conciliación', 'info'); return L.avanzarEtapa(E, p); }
        p.sub = 'agenda'; p.esperaHasta = E.fecha.t + 1;
        L.hist(E, p, 'Se integra comisión accidental de conciliación', 'info');
        return;
      }
      if (et === 'sancion') return L.sancion(E, p);
      if (et === 'promulgacion') return L.convertirEnLey(E, p, true);
      if (def.instancia === 'comision') {
        const cam = L.camaraDeEtapa(p);
        const cambioCamara = et === 'comision2' || et === 'comision4';
        p.esperaHasta = E.fecha.t + (cambioCamara ? 2 : 1);
        L.asignarPonentes(E, p, cam);
      } else {
        p.sub = 'agenda'; p.esperaHasta = E.fecha.t + 2;  // 8 días entre comisión y plenaria
      }
    },
    asignarPonentes(E, p, cam) {
      const com = E.congreso[cam].comisiones[p.comision];
      const ms = com.miembros.filter(id => id !== 'J').map(id => E.politicos[id]);
      const n = p.urgencia ? 3 : U.ri(1, 3);
      const elegidos = U.barajar(ms).sort((a, b) => U.distIdeo(a, p) - U.distIdeo(b, p) + U.rf(-0.2, 0.2)).slice(0, n);
      p.ponentes = elegidos.map(x => x.id);
      p.sub = 'ponencia';
      p.ponenciaLista = E.fecha.t + (p.urgencia ? 2 : U.ri(3, 9));
      const coord = elegidos[0];
      if (coord) L.hist(E, p, `Designado ponente coordinador: ${coord.nombre} (${E.partidos[coord.partido] ? E.partidos[coord.partido].sigla : ''}) en la Comisión ${C.DATA.comisiones[p.comision - 1].nombre} ${C.Congreso.delCamara(cam)}`, 'ponencia');
    },
    sancion(E, p) {
      const gob = E.gobierno;
      p.sub = 'sancion';
      if (gob.presidente === 'J') { p.sub = 'decisionPresidente'; L.hist(E, p, 'Pasa al despacho presidencial: el Presidente debe decidir', 'info'); (E.ui.sancionesPendientes = E.ui.sancionesPendientes || []).push(p.id); return; }
      const pres = E.politicos[gob.presidente];
      const dist = pres ? U.distIdeo(pres, p) : 0.3;
      const objeta = !p.gobierno && (dist > 0.38 || (p.costo > 2.5 && E.economia.deficit > 5.5)) && U.chance(0.35 + dist * 0.6);
      if (objeta) {
        p.etapas.splice(p.etapa + 1, 0, 'objecion');
        L.hist(E, p, `El Presidente OBJETA el proyecto por ${p.costo > 2.5 ? 'inconveniencia fiscal' : 'razones de conveniencia'} y lo devuelve al Congreso`, 'negado');
        C.Medios.noticia(E, { tipo: 'legislativo', titular: `El presidente objeta la ley «${p.titulo}»`, tono: -1, ref: { proyecto: p.id } });
        p.etapa++; p.sub = 'agenda'; p.esperaHasta = E.fecha.t + 2;
        return;
      }
      L.convertirEnLey(E, p);
    },
    convertirEnLey(E, p, promulgacion) {
      E.meta.numLey = (E.meta.numLey || 2310) + 1;
      p.estado = 'ley'; p.ley = E.meta.numLey; p.sub = 'fin'; p.sancionada = E.fecha.t;
      L.hist(E, p, promulgacion ? `Promulgado como Acto Legislativo ${String(p.ley % 100).padStart(2, '0')} de ${U.anio()}` : `SANCIONADO: Ley ${p.ley} de ${U.anio()}`, 'ley');
      C.Economia.programar(E, p.efectos, p.id);
      if (p.costo) C.Economia.programar(E, [{ v: 'deficit', d: C.Economia.impactoFiscal(p.costo), p: 'm' }], p.id);
      const autor = E.politicos[p.autor]; if (autor) autor.stats.aprobados++;
      if (p.autor === 'J' || p.coautores.includes('J')) {
        E.jugador.historialLegislativo.push({ t: E.fecha.t, titulo: p.titulo, ley: p.ley, rol: p.autor === 'J' ? 'autor' : 'coautor', resultado: 'ley' });
        C.Opinion.subirRec(E, (p.autor === 'J' ? 8 : 3));
        E.jugador.rep.competencia = U.clamp(E.jugador.rep.competencia + 4, 0, 100);
        E.jugador.rep.experiencia = U.clamp(E.jugador.rep.experiencia + 2, 0, 100);
      }
      C.Medios.noticia(E, { tipo: 'legislativo', titular: `Es ley: «${p.titulo}»`, tono: 1, ref: { proyecto: p.id }, jugador: p.autor === 'J', importante: p.gobierno || p.autor === 'J' });
      C.Congreso.log(E, 'ley', `Sancionada la Ley ${p.ley}: «${p.titulo}»`, { proyecto: p.id });
      C.Bus.emit('ley', p);
    },
    archivar(E, p, motivo) {
      p.estado = 'archivado'; p.sub = 'fin'; p.motivoArchivo = motivo;
      L.hist(E, p, 'ARCHIVADO: ' + motivo, 'negado');
      if (p.autor === 'J' || p.coautores.includes('J')) E.jugador.historialLegislativo.push({ t: E.fecha.t, titulo: p.titulo, rol: p.autor === 'J' ? 'autor' : 'coautor', resultado: 'archivado', motivo });
      if (p.gobierno || p.autor === 'J') C.Medios.noticia(E, { tipo: 'legislativo', titular: `Se hunde «${p.titulo}»: ${motivo.toLowerCase()}`, tono: -1, ref: { proyecto: p.id }, jugador: p.autor === 'J' });
      C.Bus.emit('proyecto:archivado', p);
    },

    turno(E) {
      const enSesion = C.Congreso.enSesion(E);
      // Tránsito de legislatura: art. 162 — ningún proyecto puede considerarse en más de dos legislaturas
      for (const p of L.activos(E)) if ((E.congreso.legislatura || 1) - p.legRad >= 2 && p.sub !== 'decisionPresidente') L.archivar(E, p, 'Tránsito de legislatura (art. 162)');
      if (!enSesion) { E.congreso.ordenDia = null; return; }
      const od = E.congreso.ordenDia || L.calcularOrdenDelDia(E);

      // 1. Votaciones programadas
      const ejecutar = (id, cam, instancia) => {
        const p = E.proyectos[id]; if (!p || p.estado !== 'tramite' || p.sub !== 'agenda') return;
        const etapaId = L.etapaActual(p);
        const v = L.votar(E, p, cam, instancia, etapaId);
        if (v.resultado.aprobado) {
          if (etapaId === 'comision2' || etapaId === 'plenaria2' || etapaId === 'comision4' || etapaId === 'plenaria4') if (U.chance(0.45)) { p.modificado = true; L.hist(E, p, 'La cámara revisora introduce modificaciones al texto', 'info'); }
          L.avanzarEtapa(E, p);
        } else L.archivar(E, p, instancia === 'comision' ? 'Negado en primer debate de comisión' : 'Negado en plenaria');
      };
      for (const cam of C.Congreso.CAMARAS) {
        for (const [n, ids] of Object.entries(od[cam].comisiones)) for (const id of ids) ejecutar(id, cam, 'comision');
        for (const id of od[cam].plenaria) ejecutar(id, cam, 'plenaria');
      }
      for (const id of od.senado.conciliacion) {
        const p = E.proyectos[id]; if (!p || p.estado !== 'tramite') continue;
        const v1 = L.votar(E, p, 'senado', 'plenaria', 'conciliacion'), v2 = L.votar(E, p, 'camara', 'plenaria', 'conciliacion');
        if (v1.resultado.aprobado && v2.resultado.aprobado) L.avanzarEtapa(E, p); else L.archivar(E, p, 'Negado el informe de conciliación');
      }
      for (const id of od.objeciones) {
        const p = E.proyectos[id]; if (!p || p.estado !== 'tramite') continue;
        const v1 = L.votar(E, p, 'senado', 'plenaria', 'objecion'), v2 = L.votar(E, p, 'camara', 'plenaria', 'objecion');
        if (v1.resultado.aprobado && v2.resultado.aprobado) { L.hist(E, p, 'El Congreso declara infundadas las objeciones', 'aprobado'); L.convertirEnLey(E, p); }
        else L.archivar(E, p, 'El Congreso acoge las objeciones presidenciales');
      }

      // 2. Trámite administrativo: radicados → ponencia → agenda
      for (const p of L.activos(E)) {
        if (p.sub === 'radicado' && E.fecha.t >= p.esperaHasta) {
          p.sub = 'reparto';
          L.hist(E, p, `Repartido a la Comisión ${C.DATA.comisiones[p.comision - 1].nombre} Constitucional Permanente`, 'info');
          L.avanzarEtapa(E, p);
        } else if (p.sub === 'ponencia' && E.fecha.t >= p.ponenciaLista) {
          if (!p.ponencia) {
            const coord = E.politicos[p.ponentes[0]];
            const pos = coord ? L.probSi(L.factores(E, coord, p, L.camaraDeEtapa(p))) : 0.5;
            p.ponencia = pos > 0.45 ? 'positiva' : 'negativa';
          }
          L.hist(E, p, `Radicada ponencia ${p.ponencia} para ${L.infoEtapa(p).nombre.toLowerCase()}`, p.ponencia === 'positiva' ? 'ponencia' : 'negado');
          p.sub = 'agenda';
        }
        // La presión mediática se desvanece
        p.presion *= 0.93;
      }
      L.calcularOrdenDelDia(E);
      if (E.fecha.t % 13 === 0) L.compactarProyectos(E);
    },

    /* ── Acciones del jugador ──────────────────────────────── */
    registrarAcciones() {
      const A = C.Acciones;
      const esCongresista = E => E.jugador.cargo === 'senador' || E.jugador.cargo === 'representante';
      const esGobierno = E => E.gobierno.presidente === 'J' || E.jugador.cargo === 'ministro';
      const proyActivo = (E, a) => { const p = E.proyectos[a.proyecto]; return p && p.estado === 'tramite' ? p : null; };

      A.registrar({ id: 'radicar', nombre: 'Radicar proyecto de ley', icono: '📥', grupo: 'legislativo', costo: 2,
        disponible: E => esCongresista(E) || esGobierno(E) || 'Sólo congresistas o el Gobierno pueden radicar proyectos',
        ejecutar(E, a) {
          const pl = C.DATA.plantillasProyectos.find(x => x.id === a.plantilla);
          const amb = a.ambicion || 1;
          let costo = pl.costo * amb, eco = pl.eco, soc = pl.soc, pop = pl.pop;
          if (a.financiacion === 'impuesto' && costo > 0) { costo = 0; pop -= 5; eco -= 10; }
          if (a.financiacion === 'recorte' && costo > 0) { costo = costo * 0.2; pop -= 2; eco += 8; }
          eco += (a.giroEco || 0); soc += (a.giroSoc || 0);
          const ef = pl.efectos.map(e => ({ v: e.v, d: e.d * amb, p: e.p }));
          const p = L.crear(E, { plantilla: pl.id, autor: 'J', titulo: a.titulo || pl.titulo, eco, soc, costo, efectos: ef, pop: pop - (amb - 1) * 6,
            gobierno: esGobierno(E), origen: E.jugador.camara || a.origen || 'senado', urgencia: !!a.urgencia && esGobierno(E) });
          C.Opinion.subirRec(E, 1.5);
          C.Medios.noticia(E, { tipo: 'legislativo', titular: `${E.jugador.nombre} radica el proyecto «${p.titulo}»`, tono: 1, jugador: true, ref: { proyecto: p.id } });
          return { ok: true, msg: 'Proyecto radicado: ' + p.numero, proyecto: p.id };
        } });

      A.registrar({ id: 'coautor', nombre: 'Adherir como coautor', icono: '✍', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => { const p = proyActivo(E, a); if (!p) return 'Proyecto no disponible'; if (!esCongresista(E)) return 'Debes ser congresista'; if (p.autor === 'J' || p.coautores.includes('J')) return 'Ya eres autor'; return true; },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto]; p.coautores.push('J');
          const au = E.politicos[p.autor]; if (au && au.id !== 'J') au.relJ = U.clamp(au.relJ + 8, -100, 100);
          L.hist(E, p, `${E.jugador.nombre} se adhiere como coautor`, 'info');
          return { ok: true, msg: 'Ahora eres coautor de «' + p.titulo + '»' };
        } });

      A.registrar({ id: 'cabildear', nombre: 'Cabildear a un congresista', icono: '🤝', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => { if (!proyActivo(E, a)) return 'Proyecto no disponible'; if (!E.politicos[a.pol] || a.pol === 'J') return 'Elige un congresista'; return true; },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto], pol = E.politicos[a.pol], J = E.jugador;
          const favor = a.sentido === 'no' ? -1 : 1;
          const prob = U.clamp(0.35 + J.atributos.negociacion / 250 + pol.relJ / 200 + pol.r.pra / 400 - U.distIdeo(pol, p) * 0.4 * favor, 0.05, 0.92);
          if (U.chance(prob)) {
            const x = Math.round(U.rf(9, 17) * favor);
            p.compromisos[pol.id] = (p.compromisos[pol.id] || 0) + x;
            pol.relJ = U.clamp(pol.relJ + 3, -100, 100);
            return { ok: true, msg: `${pol.nombre} se compromete a ${favor > 0 ? 'apoyar' : 'rechazar'} el proyecto`, exito: true };
          }
          pol.relJ = U.clamp(pol.relJ - 2, -100, 100);
          return { ok: true, msg: `${pol.nombre} no se deja convencer`, exito: false };
        } });

      A.registrar({ id: 'negociarBancada', nombre: 'Negociar con una bancada', icono: '🏛', grupo: 'legislativo', costo: 2,
        disponible: (E, a) => { if (!proyActivo(E, a)) return 'Proyecto no disponible'; if (!E.partidos[a.partido]) return 'Elige una bancada'; if (!esCongresista(E) && !esGobierno(E)) return 'Debes ser congresista o del Gobierno'; return true; },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto], pa = E.partidos[a.partido], J = E.jugador;
          const prob = U.clamp(0.3 + J.atributos.negociacion / 200 + pa.relJ / 150 - U.distIdeo(pa, p) * 0.5 + (J.partido === pa.id ? 0.25 : 0), 0.05, 0.9);
          if (U.chance(prob)) {
            p.acuerdos[pa.id] = (p.acuerdos[pa.id] || 0) + 14;
            // La contraparte exige acercar el texto a su posición
            const ce = Math.round((pa.eco - p.eco) * 0.2), cs = Math.round((pa.soc - p.soc) * 0.2);
            p.eco += ce; p.soc += cs;
            p.enmiendas.push({ t: E.fecha.t, autor: 'J', txt: `Acuerdo con la bancada ${pa.sigla}: se acoge parte de sus propuestas`, deco: ce, dsoc: cs });
            L.hist(E, p, `Acuerdo político con la bancada ${pa.sigla}`, 'acuerdo');
            pa.relJ = U.clamp(pa.relJ + 4, -100, 100);
            return { ok: true, msg: `Acuerdo con la bancada ${pa.sigla}. El texto se ajusta a sus exigencias.`, exito: true };
          }
          pa.relJ = U.clamp(pa.relJ - 3, -100, 100);
          return { ok: true, msg: `La bancada ${pa.sigla} rechaza el acuerdo`, exito: false };
        } });

      A.registrar({ id: 'enmienda', nombre: 'Proponer enmienda', icono: '✏', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => { const p = proyActivo(E, a); if (!p) return 'Proyecto no disponible'; if (!esCongresista(E) && !esGobierno(E)) return 'Debes ser congresista'; return true; },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto];
          const tipos = {
            moderar:  { txt: 'Se moderan los alcances del proyecto', f: () => { p.eco = Math.round(p.eco * 0.7); p.soc = Math.round(p.soc * 0.7); p.costo *= 0.8; p.efectos.forEach(e => e.d *= 0.85); } },
            financiar:{ txt: 'Se incluye fuente de financiación', f: () => { p.costo = Math.min(p.costo, 0.2); p.pop -= 3; } },
            regional: { txt: 'Se incluyen beneficios para la región ' + (a.region || 'Caribe'), f: () => { p.regionalBonus = a.region || 'Caribe'; p.costo += 0.3; } },
            endurecer:{ txt: 'Se amplían los alcances del proyecto', f: () => { p.eco = Math.round(p.eco * 1.2); p.soc = Math.round(p.soc * 1.2); p.costo *= 1.2; p.efectos.forEach(e => e.d *= 1.15); p.pop += 2; } }
          };
          const t = tipos[a.tipo]; if (!t) return { ok: false, msg: 'Tipo de enmienda inválido' };
          const antes = { eco: p.eco, soc: p.soc, costo: p.costo };
          t.f();
          p.enmiendas.push({ t: E.fecha.t, autor: 'J', txt: t.txt, deco: p.eco - antes.eco, dsoc: p.soc - antes.soc, dcosto: p.costo - antes.costo });
          if (p.etapa >= 3) p.modificado = true;
          L.hist(E, p, `Enmienda de ${E.jugador.nombre}: ${t.txt}`, 'enmienda');
          return { ok: true, msg: t.txt };
        } });

      A.registrar({ id: 'presionMedios', nombre: 'Campaña mediática por el proyecto', icono: '📣', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => proyActivo(E, a) ? true : 'Proyecto no disponible',
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto], J = E.jugador;
          const x = (a.sentido === 'no' ? -1 : 1) * (3 + J.atributos.oratoria / 25 + J.reconocimiento / 25);
          p.presion += x; C.Opinion.subirRec(E, 1);
          C.Medios.noticia(E, { tipo: 'legislativo', titular: `${J.nombre} ${x > 0 ? 'defiende' : 'arremete contra'} «${p.titulo}» en medios`, tono: 0, jugador: true, ref: { proyecto: p.id } });
          return { ok: true, msg: 'La presión pública sobre el proyecto ' + (x > 0 ? 'aumenta' : 'se vuelve en su contra') };
        } });

      A.registrar({ id: 'ponencia', nombre: 'Solicitar ser ponente', icono: '📄', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => {
          const p = proyActivo(E, a); if (!p) return 'Proyecto no disponible';
          const cam = L.camaraDeEtapa(p);
          if (!esCongresista(E) || E.jugador.camara !== cam || E.jugador.comision !== p.comision) return 'Debes integrar la comisión que estudia el proyecto';
          if (p.sub !== 'ponencia') return 'El proyecto no está en etapa de ponencia';
          if (p.ponentes.includes('J')) return 'Ya eres ponente';
          return true;
        },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto];
          p.ponentes.unshift('J'); p.ponencia = a.sentido === 'negativa' ? 'negativa' : 'positiva';
          L.hist(E, p, `${E.jugador.nombre} es designado ponente coordinador (ponencia ${p.ponencia})`, 'ponencia');
          E.jugador.rep.experiencia = U.clamp(E.jugador.rep.experiencia + 1, 0, 100);
          return { ok: true, msg: 'Eres ponente coordinador: tu ponencia será ' + p.ponencia };
        } });

      A.registrar({ id: 'intervenir', nombre: 'Intervenir en el debate', icono: '🎤', grupo: 'legislativo', costo: 1,
        disponible: (E, a) => { const p = proyActivo(E, a); if (!p) return 'Proyecto no disponible'; if (!esCongresista(E)) return 'Debes ser congresista'; if (L.camaraDeEtapa(p) !== E.jugador.camara) return 'El proyecto no está en tu cámara'; return true; },
        ejecutar(E, a) {
          const p = E.proyectos[a.proyecto], J = E.jugador;
          const calidad = U.gauss(J.atributos.oratoria / 20, 1.5);
          const sentido = a.sentido === 'no' ? -1 : 1;
          p.persuasion += sentido * U.clamp(calidad, -2, 6);
          C.Opinion.subirRec(E, 0.8);
          E.politicos.J && E.politicos.J.stats.intervenciones++;
          return { ok: true, msg: calidad > 3 ? 'Intervención brillante: mueves a varios indecisos' : calidad > 1 ? 'Intervención sólida' : 'Intervención discreta, poco eco en el recinto' };
        } });
    }
  };

  C.Legislacion = L;
  C.Tiempo.registrar('legislacion', L, 65);
  L.registrarAcciones();
})(window.CURUL);

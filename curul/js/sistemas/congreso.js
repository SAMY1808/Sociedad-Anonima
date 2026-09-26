/* Congreso: Senado y Cámara, curules, bancadas, mesas directivas, comisiones y calendario de sesiones. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;
  const CAMARAS = ['senado', 'camara'];

  const Co = {
    CAMARAS,
    nombreCamara: c => c === 'senado' ? 'Senado' : 'Cámara',
    delCamara: c => c === 'senado' ? 'del Senado' : 'de la Cámara',
    nombreCirc(circ) {
      if (circ === 'NAC') return 'Nacional';
      const d = C.E.deptos[circ]; if (d) return d.nombre;
      const esp = [...C.DATA.camaras.senado.especiales, ...C.DATA.camaras.camara.especiales].find(e => e.id === circ);
      return esp ? esp.nombre : circ;
    },
    /* Periodos de sesiones ordinarias: 20 jul – 16 dic y 16 mar – 20 jun */
    enSesion(E) {
      const d = U.hoy(), m = d.getUTCMonth(), dia = d.getUTCDate();
      if (m === 6) return dia >= 20;
      if (m >= 7 && m <= 10) return true;
      if (m === 11) return dia <= 16;
      if (m === 2) return dia >= 16;
      if (m === 3 || m === 4) return true;
      if (m === 5) return dia <= 20;
      return false;
    },
    periodo(E) {
      const d = U.hoy(), a = d.getUTCFullYear();
      const ini = d.getUTCMonth() > 6 || (d.getUTCMonth() === 6 && d.getUTCDate() >= 20) ? a : a - 1;
      return { legislatura: ini + '-' + (ini + 1), cuatrienio: E.congreso.cuatrienio };
    },
    miembros(E, cam) { return E.congreso[cam].curules.map(c => E.politicos[c.pol]).filter(Boolean); },
    mayoria(E, cam) { return Math.floor(E.congreso[cam].curules.length / 2) + 1; },
    log(E, tipo, txt, ref) {
      E.agendaMundo.unshift({ t: E.fecha.t, tipo, txt, ref: ref || null });
      if (E.agendaMundo.length > 250) E.agendaMundo.length = 250;
    },

    /* ── Instalación de un nuevo Congreso a partir de resultados electorales ── */
    instalar(E, res) {
      const cuatrienio = res.anio + '-' + (res.anio + 4);
      // Los congresistas salientes vuelven a ser aspirantes (o se retiran)
      for (const cam of CAMARAS) for (const c of (E.congreso[cam] ? E.congreso[cam].curules : [])) {
        const p = E.politicos[c.pol]; if (!p) continue;
        if (p.id === 'J') continue;
        C.Politicos.anotar(p, 'Termina su periodo como ' + (cam === 'senado' ? 'senador' : 'representante'));
        p.cargo = { tipo: 'aspirante', aspira: cam };
      }
      const J = E.jugador;
      const eraJ = J.cargo === 'senador' || J.cargo === 'representante';
      if (eraJ) C.Personaje.dejarCargo(E, 'Termina el periodo legislativo');
      const armar = (cam, lista) => lista.map((e, i) => ({ id: (cam === 'senado' ? 'S' : 'C') + (i + 1), pol: e.pol, circ: e.circ, partido: e.partido, votos: e.votos }));
      const sen = [...res.senado.electos];
      const camL = [];
      for (const pd of Object.values(res.camara.porDepto)) camL.push(...pd.electos);
      camL.push(...res.camara.especiales);
      // Estatuto de Oposición: 2º en la presidencial y su fórmula
      const segundo = E.gobierno.electo && E.gobierno.electo.segundo;
      if (segundo) {
        sen.push({ pol: segundo.pol, circ: 'OPO-SEN', partido: segundo.partido, votos: segundo.votos });
        const formula = C.Politicos.crear(E, { partido: segundo.partido === 'MOV' ? (J.partido || 'IND') : segundo.partido, depto: 'BOG' });
        camL.push({ pol: formula.id, circ: 'OPO-CAM', partido: formula.partido, votos: segundo.votos });
      }
      E.congreso = Object.assign(E.congreso, {
        cuatrienio, electos: null,
        senado: { curules: armar('senado', sen), mesa: {}, comisiones: {}, bancadas: {} },
        camara: { curules: armar('camara', camL), mesa: {}, comisiones: {}, bancadas: {} }
      });
      for (const cam of CAMARAS) for (const c of E.congreso[cam].curules) {
        const p = E.politicos[c.pol]; if (!p) continue;
        if (p.id === 'J') { C.Personaje.asumirCargo(E, cam === 'senado' ? 'senador' : 'representante', { circ: c.circ, curul: c.id }); continue; }
        if (c.partido && c.partido !== 'MOV') p.partido = c.partido;
        const antes = p.cargo && p.cargo.tipo;
        p.cargo = { tipo: cam === 'senado' ? 'senador' : 'representante', camara: cam, circ: c.circ, curul: c.id };
        p.aspiraOtro = null;
        C.Politicos.anotar(p, 'Elegido ' + (cam === 'senado' ? 'senador' : 'representante') + ' ' + cuatrienio + (antes === p.cargo.tipo ? ' (reelegido)' : ''));
      }
      for (const cam of CAMARAS) { Co.organizarComisiones(E, cam); Co.bancadas(E, cam); }
      Co.elegirMesas(E);
      Co.log(E, 'instalacion', 'Se instala el Congreso ' + cuatrienio);
      C.Bus.emit('congreso:instalado', cuatrienio);
    },

    /* Reparte a los congresistas en las siete comisiones constitucionales */
    organizarComisiones(E, cam) {
      const K = E.congreso[cam];
      const cupos = {}; C.DATA.comisiones.forEach(c => cupos[c.n] = c[cam]);
      const totalCupos = U.suma(Object.values(cupos)), n = K.curules.length;
      // Ajusta los cupos al tamaño real de la cámara
      const factor = n / totalCupos;
      let asignados = 0; for (const k of Object.keys(cupos)) { cupos[k] = Math.max(3, Math.round(cupos[k] * factor)); asignados += cupos[k]; }
      cupos[1] += n - asignados;
      K.comisiones = {}; C.DATA.comisiones.forEach(c => K.comisiones[c.n] = { n: c.n, miembros: [], presidente: null, vice: null });
      const pols = U.barajar(Co.miembros(E, cam));
      const pref = p => {
        if (p.id === 'J' && E.jugador.comisionPreferida) return [E.jugador.comisionPreferida];
        return p.intereses.map(s => C.DATA.sectores[s].comision);
      };
      // Primero los de mayor experiencia eligen
      pols.sort((a, b) => b.r.exp - a.r.exp);
      const sin = [];
      for (const p of pols) {
        const opc = pref(p).find(n => K.comisiones[n].miembros.length < cupos[n]);
        if (opc) K.comisiones[opc].miembros.push(p.id); else sin.push(p);
      }
      for (const p of sin) {
        const n = Object.keys(cupos).find(k => K.comisiones[k].miembros.length < cupos[k]) || 1;
        K.comisiones[n].miembros.push(p.id);
      }
      for (const com of Object.values(K.comisiones)) for (const id of com.miembros) {
        const p = E.politicos[id];
        if (id === 'J') E.jugador.comision = com.n; else p.cargo.comision = com.n;
      }
    },
    /* Voceros de bancada */
    bancadas(E, cam) {
      const K = E.congreso[cam]; K.bancadas = {};
      const grupos = U.agrupar(Co.miembros(E, cam), p => p.partido || 'IND');
      for (const [pid, ms] of Object.entries(grupos)) {
        const vocero = ms.filter(p => p.id !== 'J').sort((a, b) => (b.r.exp + b.r.car) - (a.r.exp + a.r.car))[0];
        K.bancadas[pid] = { vocero: vocero ? vocero.id : null, n: ms.length };
      }
    },
    /* Mesas directivas (cada 20 de julio) y mesas de comisión */
    elegirMesas(E) {
      const coal = E.gobierno.coalicion || [];
      for (const cam of CAMARAS) {
        const K = E.congreso[cam];
        const ms = Co.miembros(E, cam).filter(p => p.id !== 'J');
        const gob = ms.filter(p => coal.includes(p.partido));
        const opo = ms.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura === 'oposicion');
        const mejor = arr => arr.slice().sort((a, b) => (b.r.exp + b.r.amb + U.ri(0, 40)) - (a.r.exp + a.r.amb + U.ri(0, 40)))[0];
        const pres = mejor(gob.length ? gob : ms);
        const vice1 = mejor(ms.filter(p => p !== pres && p.partido !== pres.partido));
        const vice2 = mejor(opo.length ? opo : ms.filter(p => p !== pres && p !== vice1));
        K.mesa = { presidente: pres && pres.id, vice1: vice1 && vice1.id, vice2: vice2 && vice2.id, desde: E.fecha.t };
        for (const com of Object.values(K.comisiones)) {
          const mm = com.miembros.map(id => E.politicos[id]).filter(p => p && p.id !== 'J');
          const g = mm.filter(p => coal.includes(p.partido));
          com.presidente = (mejor(g.length ? g : mm) || {}).id || null;
          const resto = mm.filter(p => p.id !== com.presidente);
          const o = resto.filter(p => E.partidos[p.partido] && E.partidos[p.partido].postura !== 'gobierno');
          com.vice = (mejor(o.length ? o : resto) || {}).id || null;
        }
        if (pres) Co.log(E, 'mesa', `${pres.nombre} (${E.partidos[pres.partido] ? E.partidos[pres.partido].sigla : ''}) es elegido presidente ${Co.delCamara(cam)}`);
      }
    },
    /* Composición agregada por partido y por postura */
    composicion(E, cam) {
      const porPartido = {}, porPostura = { gobierno: 0, independiente: 0, oposicion: 0 };
      for (const p of Co.miembros(E, cam)) {
        const pid = p.id === 'J' ? (E.jugador.partido || 'IND') : (p.partido || 'IND');
        porPartido[pid] = (porPartido[pid] || 0) + 1;
        const pa = E.partidos[pid];
        const post = p.id === 'J' ? E.jugador.postura || (pa ? pa.postura : 'independiente') : (pa ? pa.postura : 'independiente');
        porPostura[post] = (porPostura[post] || 0) + 1;
      }
      return { porPartido, porPostura, total: E.congreso[cam].curules.length, mayoria: Co.mayoria(E, cam) };
    },
    /* Orden ideológico de los partidos (izquierda→derecha) para el hemiciclo */
    ordenPartidos(E) {
      return Object.values(E.partidos).slice().sort((a, b) => (a.eco + a.soc * 0.3) - (b.eco + b.soc * 0.3)).map(p => p.id);
    },

    turno(E) {
      const d = U.hoy();
      const esJul20 = d.getUTCMonth() === 6 && d.getUTCDate() >= 20 && d.getUTCDate() < 27;
      if (esJul20) {
        if (E.congreso.electos) Co.instalar(E, E.congreso.electos);
        else Co.elegirMesas(E);
        E.congreso.legislatura = (E.congreso.legislatura || 0) + 1;
        Co.log(E, 'sesion', 'Se instala la legislatura ' + Co.periodo(E).legislatura);
        C.Bus.emit('congreso:legislatura');
      }
      const sesion = Co.enSesion(E);
      if (sesion !== E.congreso.sesionAnterior) {
        Co.log(E, 'sesion', sesion ? 'Inicia el periodo de sesiones ordinarias' : 'El Congreso entra en receso');
        E.congreso.sesionAnterior = sesion;
      }
      // Ausentismo semanal para las estadísticas
      if (sesion) for (const cam of CAMARAS) for (const p of Co.miembros(E, cam)) if (p.id !== 'J' && !U.chance(p.asistencia)) p.stats.ausencias++;
    }
  };

  C.Congreso = Co;
  C.Tiempo.registrar('congreso', Co, 60);
})(window.CURUL);

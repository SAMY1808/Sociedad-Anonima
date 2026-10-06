/* Acuerdos de gobierno: seguimiento real de los pactos con los socios (cumplimiento, comisión de seguimiento, renegociación) y factura política. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const Cl = C.Coaliciones = {
    pm(E) { const g = E.paises.ES.gob; return E.jugador.pais === 'ES' && g && g.pm === 'J'; },
    def(pa) { return D().demandas[pa.dem] || { nombre: pa.dem, icono: '•', coste: 2 }; },
    sat(E, pid) { const cs = E.esp.consejo; return cs && cs.sat[pid] != null ? cs.sat[pid] : 60; },
    progreso(E, pa) {
      if (pa.estado !== 'pendiente') return pa.estado;
      return C.Congreso.abiertos(E).some(p => p.pacto === pa.pid && p.demPacto === pa.dem) ? 'tramite' : 'nada';
    },
    /* Al vencer el plazo: ¿se rompe el pacto? Depende del trabajo hecho y de la satisfacción del socio. */
    retira(E, pa) {
      const pr = Cl.progreso(E, pa), s = Cl.sat(E, pa.pid);
      let p = pr === 'tramite' ? 0.1 : s < 45 ? 0.55 : s > 70 ? 0.15 : 0.3; p -= (pa.seg || 0) * 0.07;
      if (pr === 'nada' && E.paises.ES.gob.pm === 'J' && !Cl.def(pa).ley) p += 0.1;
      return U.chance(clamp(p, 0.03, 0.8));
    },
    /* Cumplir una cláusula: con ley (se registra en el Congreso) o con una medida directa. */
    cumplir(E, pid, dem) {
      const pa = E.esp.pactos.find(x => x.pid === pid && x.dem === dem && x.estado === 'pendiente'), g = E.paises.ES.gob; if (!pa) return { ok: false, msg: 'Esa cláusula ya no está pendiente' };
      if (!Cl.pm(E)) return { ok: false, msg: 'Sólo el presidente del Gobierno gestiona los pactos' };
      const def = Cl.def(pa); if (Cl.progreso(E, pa) === 'tramite') return { ok: false, msg: 'Ya está en tramitación' };
      if (def.ley && C.Congreso.plantilla(def.ley)) {
        const p = C.Congreso.proponer(E, def.ley, { tipo: 'gobierno', pid: g.partido }, { pacto: pid, demPacto: dem }); if (!p) return { ok: false, msg: 'No se puede tramitar ahora' };
        return { ok: true, msg: `El Gobierno remite a las Cortes la ley que cumple «${def.nombre}».` };
      }
      pa.estado = 'cumplida'; g.aprob = clamp(g.aprob - def.coste * 0.25, 5, 90); E.esp.consejo.sat[pid] = clamp(Cl.sat(E, pid) + 10, 0, 100);
      const ef = def.ef || {}; if (ef.rel) for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.gob && rc.gob.coalicion.includes(pid)) rc.relM = clamp(rc.relM + ef.rel * 0.5, 0, 100); }
      C.Noticias.poner(E, 'politica', `El Gobierno cumple con ${E.partidos[pid].sigla}: «${def.nombre}».`, 'ES'); return { ok: true, msg: `Cumples con ${E.partidos[pid].sigla}: ${def.nombre}.` };
    },
    seguimiento(E) {
      if (!Cl.pm(E)) return { ok: false, msg: 'Sólo el presidente del Gobierno convoca la comisión' }; let n = 0;
      for (const pa of E.esp.pactos) if (pa.estado === 'pendiente') { pa.seg = Math.min(3, (pa.seg || 0) + 1); n++; }
      const g = E.paises.ES.gob; for (const k of g.coalicion.concat(g.apoyoExterno || [])) if (k !== g.partido) E.esp.consejo.sat[k] = clamp(Cl.sat(E, k) + 3, 0, 100);
      g.estab = clamp(g.estab + 1.2, 0, 100); C.Personaje.cambiar(E, { prestigio: 0.3 }); return { ok: true, msg: `Comisión de seguimiento reunida: ${n} cláusula(s) revisadas y los socios, más tranquilos.` };
    },
    renegociar(E, pid, dem) {
      const pa = E.esp.pactos.find(x => x.pid === pid && x.dem === dem && x.estado === 'pendiente'); if (!pa) return { ok: false, msg: 'Cláusula no pendiente' }; if (!Cl.pm(E)) return { ok: false, msg: 'Sólo el presidente' };
      if (pa.reneg) return { ok: false, msg: 'Ya renegociaste esa cláusula una vez' };
      pa.reneg = true; pa.limite += 12; E.esp.consejo.sat[pid] = clamp(Cl.sat(E, pid) - 4, 0, 100); C.Personaje.cambiar(E, { prestigio: -0.8 }); return { ok: true, msg: `Ganas 12 semanas con ${E.partidos[pid].sigla}, a costa de su paciencia.` };
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  const pm = E => Cl.pm(E) ? true : 'Sólo el presidente del Gobierno';
  R({ id: 'cumplir_pacto', nombre: 'Cumplir una cláusula del pacto', icono: '📝', costo: 2, desc: 'Presidente: tramita la ley o aplica la medida que prometiste a un socio.', disponible: pm, ejecutar: (E, a) => Cl.cumplir(E, a.pid, a.dem) });
  R({ id: 'comision_seguimiento', nombre: 'Convocar la comisión de seguimiento', icono: '📋', desc: 'Revisas con los socios el cumplimiento del pacto: suben su satisfacción y la estabilidad.', disponible: pm, ejecutar: E => Cl.seguimiento(E) });
  R({ id: 'renegociar_pacto', nombre: 'Renegociar el plazo de una cláusula', icono: '⏳', desc: 'Pides más tiempo a un socio (sólo una vez por cláusula).', disponible: pm, ejecutar: (E, a) => Cl.renegociar(E, a.pid, a.dem) });
})(window.ESP);

/* Presupuesto General de la Nación: reparto del gasto público entre los 19 ministerios.
   El jugador-presidente puede formular su propia propuesta antes de que se radique cada
   20 de julio; si no es presidente, el Gobierno (IA) la formula según su ideología.
   La propuesta viaja como un proyecto de ley ordinario (comisión Cuarta) y se somete a las
   mismas reglas de trámite, cabildeo y objeción que cualquier otro. Si el Congreso no la
   aprueba a tiempo, rige la del Gobierno (art. 348 C.P.), como en la vida real. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U;

  /* Ministerio → {variable que mueve, intensidad por punto porcentual de participación, plazo} */
  const EFECTO = {
    educacion: { v: 'educacion', k: 0.55, p: 'l' },
    salud: { v: 'salud', k: 0.55, p: 'l' },
    defensa: { v: 'seguridad', k: 0.65, p: 'm' },
    transporte: { v: 'infraestructura', k: 0.55, p: 'l' },
    trabajo: { v: 'desempleo', k: -0.14, p: 'm' },
    vivienda: { v: 'pobreza', k: -0.16, p: 'm' },
    agricultura: { v: 'exportaciones', k: 0.08, p: 'm' },
    ambiente: { v: 'confianza', k: 0.12, p: 'm' },
    tic: { v: 'crecimiento', k: 0.02, p: 'l' },
    ciencia: { v: 'crecimiento', k: 0.02, p: 'l' }
  };
  /* Ministerios cuya línea es más ideológica (más peso con gobiernos de izquierda) o
     más disciplinaria (más peso con gobiernos de derecha), para la formulación automática. */
  const SOCIAL = new Set(['educacion', 'salud', 'trabajo', 'vivienda', 'igualdad', 'cultura', 'ambiente', 'agricultura']);
  const DISCIPLINA = new Set(['defensa', 'hacienda', 'justicia', 'interior']);

  const P = {
    EFECTO,
    init(E) {
      const base = {}; let tot = 0;
      for (const m of C.DATA.ministerios) tot += m.pesoBase;
      for (const m of C.DATA.ministerios) base[m.id] = m.pesoBase / tot * 100;
      const anio = U.anio() + 1;
      const shares = Object.assign({}, base);
      const porMinisterio = {}; for (const m of C.DATA.ministerios) porMinisterio[m.id] = { pct: shares[m.id], asignado: E.economia.pib * E.economia.gasto / 100 * shares[m.id] / 100 };
      E.presupuesto = {
        pesoBase: base, anio, gastoPct: E.economia.gasto,
        vigente: { anio: U.anio(), gastoPct: E.economia.gasto, shares, porMinisterio },
        propuesta: Object.assign({}, base), formuladoAnio: 0,
        enTramite: false, proyectoId: null, historial: []
      };
      P.formular(E);
    },
    ideoPresidente(E) {
      if (E.gobierno.presidente === 'J') return E.jugador.ideologia;
      const p = E.politicos[E.gobierno.presidente];
      return p ? { eco: p.eco, soc: p.soc } : { eco: 0, soc: 0 };
    },
    /* Genera (o regenera) la propuesta del Gobierno según la ideología presidencial. */
    formular(E) {
      const Pr = E.presupuesto, ideo = P.ideoPresidente(E);
      const shares = {};
      for (const m of C.DATA.ministerios) {
        let base = Pr.pesoBase[m.id];
        const linea = SOCIAL.has(m.id) ? 1 : DISCIPLINA.has(m.id) ? -1 : 0;
        const factor = U.clamp(1 + (-ideo.eco / 100) * 0.3 * linea, 0.6, 1.5);
        shares[m.id] = Math.max(0.4, base * factor * Math.exp(U.gauss(0, 0.06)));
      }
      const tot = U.suma(Object.values(shares));
      for (const k of Object.keys(shares)) shares[k] = shares[k] / tot * 100;
      Pr.propuesta = shares;
      Pr.gastoPct = U.clamp(Pr.vigente.gastoPct + (-ideo.eco / 100) * 1.4 + U.gauss(0, 0.25), 15, 29);
      Pr.formuladoAnio = Pr.anio;
    },
    /* El jugador ajusta la participación de un ministerio; el resto se reacomoda proporcionalmente. */
    setShare(E, minId, pct) {
      const Pr = E.presupuesto; if (!Pr || Pr.enTramite) return;
      pct = U.clamp(pct, 1, 40);
      const prop = Pr.propuesta, otros = Object.keys(prop).filter(k => k !== minId);
      const sumOtros = U.suma(otros.map(k => prop[k])), restante = 100 - pct;
      if (sumOtros <= 0.01) otros.forEach(k => prop[k] = restante / otros.length);
      else otros.forEach(k => prop[k] = Math.max(0.3, prop[k] / sumOtros * restante));
      prop[minId] = pct;
      const tot = U.suma(Object.values(prop));
      for (const k of Object.keys(prop)) prop[k] = prop[k] / tot * 100;
    },
    setGastoPct(E, pct) { const Pr = E.presupuesto; if (Pr && !Pr.enTramite) Pr.gastoPct = U.clamp(pct, 14, 32); },
    restablecer(E) {
      const Pr = E.presupuesto; if (!Pr || Pr.enTramite) return;
      Pr.propuesta = Object.assign({}, Pr.vigente.shares); Pr.gastoPct = Pr.vigente.gastoPct;
    },
    /* Ingresos y gasto proyectados con la propuesta actual, para la vista previa en pantalla. */
    proyeccion(E) {
      const Pr = E.presupuesto, pib = E.economia.pib;
      const gasto = pib * Pr.gastoPct / 100, ingresos = pib * E.economia.recaudo / 100;
      return { gasto, ingresos, deficitPct: Pr.gastoPct - E.economia.recaudo, gastoPct: Pr.gastoPct, pib };
    },
    underfunded(E, minId) {
      const Pr = E.presupuesto; if (!Pr || !Pr.vigente) return false;
      return Pr.vigente.shares[minId] < Pr.pesoBase[minId] * 0.75;
    },
    /* Refuerzo de emergencia a mitad de año: sube la participación vigente de un ministerio,
       recortando proporcionalmente al resto ('recorte') o financiándolo con más déficit ('credito'). */
    reforzar(E, minId, via) {
      const Pr = E.presupuesto; if (!Pr || !Pr.vigente.shares[minId]) return;
      const extra = Pr.pesoBase[minId] * 0.18;
      Pr.vigente.shares[minId] += extra;
      if (via === 'recorte') {
        const otros = Object.keys(Pr.vigente.shares).filter(k => k !== minId);
        const tot = U.suma(otros.map(k => Pr.vigente.shares[k]));
        for (const k of otros) Pr.vigente.shares[k] = Math.max(0.2, Pr.vigente.shares[k] - extra * Pr.vigente.shares[k] / tot);
      } else {
        C.Economia.aplicarDelta(E, 'deficit', extra * 0.05);
      }
      const pib = E.economia.pib;
      for (const k of Object.keys(Pr.vigente.shares)) Pr.vigente.porMinisterio[k] = { pct: Pr.vigente.shares[k], asignado: pib * Pr.vigente.gastoPct / 100 * Pr.vigente.shares[k] / 100 };
      const pol = E.politicos[E.gobierno.gabinete[minId]]; if (pol) pol.aprob = U.clamp((pol.aprob || 50) + 6, 0, 100);
    },
    /* Radica el proyecto de Presupuesto General de la Nación con la propuesta vigente. */
    radicar(E) {
      const Pr = E.presupuesto; if (!Pr || Pr.enTramite) return null;
      if (Pr.formuladoAnio !== Pr.anio) P.formular(E);
      const vig = Pr.vigente;
      const efectos = [{ v: 'confianza', d: 0.3, p: 'i' }];
      for (const m of C.DATA.ministerios) {
        const ef = EFECTO[m.id]; if (!ef) continue;
        const delta = Pr.propuesta[m.id] - vig.shares[m.id];
        if (Math.abs(delta) < 0.3) continue;
        efectos.push({ v: ef.v, d: delta * ef.k, p: ef.p });
      }
      const pib = E.economia.pib;
      const costo = pib * (Pr.gastoPct - vig.gastoPct) / 100;
      const anio = Pr.anio;
      const hac = E.politicos[E.gobierno.gabinete.hacienda];
      const p = C.Legislacion.crear(E, {
        plantilla: 'presupuesto', autor: hac ? hac.id : null, gobierno: true, urgencia: true, origen: 'camara',
        titulo: `Presupuesto General de la Nación ${anio}`, costo, efectos, eco: 0, soc: 0
      });
      p.presupuestoSnapshot = { anio, gastoPct: Pr.gastoPct, shares: Object.assign({}, Pr.propuesta) };
      Pr.enTramite = true; Pr.proyectoId = p.id;
      E.gobierno.agenda.push(p.id);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `El Gobierno radica el Presupuesto General de la Nación ${anio}`, tono: 0, ref: { proyecto: p.id }, importante: true });
      return p;
    },
    /* Deja vigente el presupuesto (aprobado por el Congreso, o por defecto constitucional si no lo aprobó a tiempo). */
    commit(E, snap, motivo) {
      const Pr = E.presupuesto; if (!Pr) return;
      const pib = E.economia.pib, shares = snap.shares;
      const porMinisterio = {};
      for (const m of C.DATA.ministerios) porMinisterio[m.id] = { pct: shares[m.id], asignado: pib * snap.gastoPct / 100 * shares[m.id] / 100 };
      Pr.vigente = { anio: snap.anio, gastoPct: snap.gastoPct, shares, porMinisterio };
      Pr.historial.push({ anio: snap.anio, gastoPct: snap.gastoPct, ingresosPct: E.economia.recaudo, pib });
      if (Pr.historial.length > 15) Pr.historial.shift();
      Pr.anio = snap.anio + 1; Pr.enTramite = false; Pr.proyectoId = null;
      P.formular(E);
      C.Medios.noticia(E, { tipo: 'gobierno', titular: `Entra en vigencia el Presupuesto General ${snap.anio}${motivo ? ' · ' + motivo : ''}`, tono: 0, importante: true });
      C.Bus.emit('presupuesto:vigente', Pr.vigente);
    },
    turno(E) {
      const Pr = E.presupuesto; if (!Pr) return;
      const hoy = U.hoy();
      if (hoy.getUTCMonth() === 5 && hoy.getUTCDate() <= 7 && Pr.formuladoAnio !== Pr.anio) P.formular(E);
      if (hoy.getUTCMonth() === 6 && hoy.getUTCDate() >= 20 && hoy.getUTCDate() < 27 && !Pr.enTramite) P.radicar(E);
      // La imagen de cada ministro reacciona lentamente a si su cartera está bien o mal financiada
      for (const m of C.DATA.ministerios) {
        const pol = E.politicos[E.gobierno.gabinete[m.id]]; if (!pol) continue;
        const pct = Pr.vigente.shares[m.id] || 0, base = Pr.pesoBase[m.id];
        const adecuacion = U.clamp((pct - base) / base, -0.5, 0.5);
        pol.aprob = U.clamp((pol.aprob || 50) + adecuacion * 0.15 + U.gauss(0, 0.25), 5, 95);
      }
      if (E.fecha.t % 4 === 0) U.serie('presupuesto:gastoPct', Pr.vigente.gastoPct);
    }
  };

  C.Presupuesto = P;
  C.Tiempo.registrar('presupuesto', P, 12);
  C.Bus.on('ley', pr => { const E = C.E; if (E && pr.plantilla === 'presupuesto' && pr.presupuestoSnapshot) P.commit(E, pr.presupuestoSnapshot, 'aprobado por el Congreso'); });
  C.Bus.on('proyecto:archivado', pr => { const E = C.E; if (E && pr.plantilla === 'presupuesto' && pr.presupuestoSnapshot) P.commit(E, pr.presupuestoSnapshot, 'rige la propuesta del Gobierno al no ser aprobado a tiempo (art. 348 C.P.)'); });
})(window.CURUL);

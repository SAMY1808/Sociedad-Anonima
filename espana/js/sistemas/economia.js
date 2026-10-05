/* Economía: indicadores macro por país con choques globales, efectos de políticas y reglas fiscales europeas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const D = () => C.DATA;

  const Ec = {
    init(E) {
      E.mundo = { shock: { crec: 0, infl: 0 }, ciclo: 0, historial: [] };
      for (const id in D().paises) {
        const d = D().paises[id], P = E.paises[id];
        const [crec, infl, paro, deuda, deficit] = d.ec;
        P.ec = {
          crec: crec + U.gauss(0, 0.15), infl: infl + U.gauss(0, 0.2), paro: paro + U.gauss(0, 0.2), deuda: deuda + U.gauss(0, 1), deficit: deficit + U.gauss(0, 0.2),
          pib: d.pib,
          base: { crec, infl, paro, deficit },
          pol: { crec: 0, infl: 0, paro: 0, deficit: 0, deuda: 0 },
          pde: false          // procedimiento de déficit excesivo abierto por la Comisión
        };
      }
    },

    turno(E) {
      const M = E.mundo;
      // Ciclo global lento + choques que decaen
      M.ciclo += (U.gauss(0, 0.05) - M.ciclo * 0.02);
      M.shock.crec *= 0.985; M.shock.infl *= 0.985;
      for (const id in E.paises) {
        const P = E.paises[id], e = P.ec, b = e.base, pol = e.pol, d = D().paises[id];
        const sensib = d.estado === 'candidato' ? 1.25 : 1;
        const tCrec = b.crec + pol.crec + (M.shock.crec + M.ciclo) * sensib;
        e.crec += (tCrec - e.crec) * 0.04 + U.gauss(0, 0.04);
        const tParo = b.paro - 0.35 * (e.crec - b.crec) + pol.paro;
        e.paro += (tParo - e.paro) * 0.03;
        const tInfl = b.infl + pol.infl + M.shock.infl * sensib;
        e.infl += (tInfl - e.infl) * 0.05 + U.gauss(0, 0.04);
        const tDef = b.deficit - 0.35 * (e.crec - b.crec) + pol.deficit;
        e.deficit += (tDef - e.deficit) * 0.04;
        e.deuda += ((e.deficit - e.deuda * (e.crec + e.infl) / 10000 * 100) / 52) + pol.deuda / 52;
        e.pib *= 1 + (e.crec + e.infl) / 100 / 52;
        // Reacción fiscal: los Gobiernos corrigen déficits muy superiores a lo habitual en el país
        const exceso = e.deficit - (b.deficit + 0.8);
        if (exceso > 0) { pol.deficit -= exceso * 0.012; pol.crec -= exceso * 0.0012; }
        else if (exceso < -1.5) { pol.deficit += 0.004; }
        // Los efectos de las políticas se diluyen con el tiempo (vida media de unos 3 años)
        for (const k in pol) pol[k] *= 0.9955;
        e.paro = U.clamp(e.paro, 1.5, 28); e.infl = U.clamp(e.infl, -1, 60); e.crec = U.clamp(e.crec, -9, 12); e.deuda = U.clamp(e.deuda, 5, 260);
      }
      if (E.fecha.t % 13 === 0) Ec.reglasFiscales(E);
      if (E.fecha.t % 4 === 0) {
        const J = E.jugador; if (J) { const e = E.paises[J.pais].ec, a = E.paises[J.pais].gob; const s = U.serie;
          s('crec', e.crec); s('infl', e.infl); s('paro', e.paro); s('deuda', e.deuda); s('deficit', e.deficit); if (a) s('aprob', a.aprob); }
      }
    },

    /* Pacto de Estabilidad: déficit > 3 % y deuda > 60 % abren un procedimiento de déficit excesivo (sólo miembros de la UE). */
    reglasFiscales(E) {
      for (const id in E.paises) {
        const d = D().paises[id]; if (E.paises[id].estado !== 'ue') continue;
        const e = E.paises[id].ec, antes = e.pde;
        e.pde = e.deficit > 3.2 && e.deuda > 60 ? true : (e.deficit < 2.8 || e.deuda < 58 ? false : e.pde);
        if (e.pde && !antes) C.Noticias.poner(E, 'economia', `Bruselas abre un procedimiento de déficit excesivo contra ${d.nombre} (déficit ${U.d1(e.deficit)} %, deuda ${U.n(e.deuda)} %).`, id);
        if (!e.pde && antes) C.Noticias.poner(E, 'economia', `La Comisión cierra el procedimiento de déficit excesivo de ${d.nombre}.`, id);
      }
    },

    /* Aplica los efectos estructurales de una política (pp). */
    aplicar(E, id, ef) {
      const pol = E.paises[id].ec.pol;
      for (const k in ef) if (k !== 'aprob' && pol[k] !== undefined) pol[k] += ef[k];
      if (ef.aprob && E.paises[id].gob) E.paises[id].gob.aprob = U.clamp(E.paises[id].gob.aprob + ef.aprob, 5, 90);
    },

    /* Choque global: recesión, crisis energética, auge. */
    choque(E, crec, infl) { E.mundo.shock.crec += crec; E.mundo.shock.infl += infl; },

    /* Puntuación económica −2…+2 de un país (para la aprobación del Gobierno). */
    clima(E, id) {
      const e = E.paises[id].ec, b = e.base;
      const s = 0.8 * (e.crec - b.crec) / 1.5 - 0.7 * (e.paro - b.paro) / 2 - 0.8 * (e.infl - Math.max(2, b.infl)) / 2.5;
      return U.clamp(s, -2.5, 2.5);
    }
  };

  /* Noticias: titulares del mundo (cinta inferior y bitácora). */
  C.Noticias = {
    poner(E, tipo, texto, pais) {
      E.noticias.unshift({ t: E.fecha.t, tipo, texto, pais: pais || null });
      if (E.noticias.length > 160) E.noticias.length = 160;
      C.Bus.emit('noticia', { tipo, texto, pais });
    }
  };

  C.Economia = Ec;
  C.Tiempo.registrar('economia', Ec, 5);
})(window.ESP);

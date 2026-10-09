/* Pactos de gobierno por programa: al formarse un Gobierno en el que participas, tus socios exigen cambios concretos en tu programa
   (línea roja por áreas). Ceder, negociar o mantener tiene consecuencias en la relación, la estabilidad y la cohesión. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, D = () => C.DATA;
  const Pc = C.PactosPrograma = {
    /* Áreas en las que otro partido preferiría una postura distinta a la tuya, de mayor a menor desacuerdo. */
    desacuerdos(E, pid) {
      const J = E.jugador, pa = E.partidos[J.partido], o = E.partidos[pid], s = C.Sede.asegurar(E), out = [];
      const d = { eco: (o.eco - pa.eco) / 100, soc: (o.soc - pa.soc) / 100, eu: (o.eu - pa.eu) / 100, ter: (o.ter - pa.ter) / 100 };
      const sc = op => ['eco', 'soc', 'eu', 'ter'].reduce((a, ax) => a + (op.v[ax] || 0) * d[ax], 0);
      for (const a of D().programa) { const k = s.prog[a.id]; if (!k) continue; const mio = a.ops.find(x => x.k === k), mejor = a.ops.slice().sort((x, y) => sc(y) - sc(x))[0]; if (mejor.k !== k && sc(mejor) - sc(mio) > 0.12) out.push({ pid, area: a.id, alt: mejor.k, gap: sc(mejor) - sc(mio) }); }
      return out.sort((x, y) => y.gap - x.gap);
    },
    /* Al formarse el Gobierno: hasta dos exigencias de los socios. */
    negociar(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || !C.Sede || !C.Sede.activo(E) || E.meta.presim || !C.Dilemas) return 0; const g = E.paises.ES.gob, mio = J.partido;
      const bloque = [g.partido].concat(g.coalicion || [], g.apoyoExterno || []).filter((k, i, a) => a.indexOf(k) === i && k !== mio); if (!bloque.length || !(g.partido === mio || g.coalicion.includes(mio) || (g.apoyoExterno || []).includes(mio))) return 0;
      if (Object.keys(C.Sede.asegurar(E).prog).length < 3) return 0;
      const todas = []; for (const k of bloque) todas.push(...Pc.desacuerdos(E, k)); todas.sort((x, y) => y.gap - x.gap); let n = 0; const vistos = new Set();
      for (const d of todas) { if (n >= 2 || vistos.has(d.area)) continue; if (C.Dilemas.asegurar(E).act.length >= 3) break; const x = C.Dilemas.nuevo(E, 'pactoPrograma', true); if (x) { Object.assign(x, { pid: d.pid, area: d.area, alt: d.alt }); x.limite = E.fecha.t + 5; vistos.add(d.area); n++; } }
      return n;
    },
    ceder(E, x) {
      const s = C.Sede.asegurar(E); delete s.cd['p_' + x.area]; const r = C.Sede.fijarPrograma(E, x.area, x.alt); if (!r.ok) return r.msg; const g = E.paises.ES.gob; if (C.Mayorias) C.Mayorias.cambiarRel(E, x.pid, 8); g.estab = clamp(g.estab + 4, 0, 100); return 'Cedes en tu programa: ' + r.msg;
    }
  };
  if (C.Ejecutivo) { const p0 = C.Ejecutivo.proclamar; C.Ejecutivo.proclamar = function (E, plan, o) { const r = p0.apply(this, arguments); try { if (!(o && o.inicial)) Pc.negociar(E); } catch (e) { console.error('[pactos2]', e); } return r; }; }
})(window.ESP);

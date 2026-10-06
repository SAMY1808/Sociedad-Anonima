/* Organismos y altos cargos: RTVE, CIS, Banco de España, CNMC, Tribunal de Cuentas, Defensor del Pueblo y SEPI.
   Cada uno tiene titular, afinidad política, independencia y mandato. Estado: E.esp.org = { o:{id:{titular, pid, indep, t0}}, hist[] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp;
  const ORGS = {
    rtve: { n: 'Corporación RTVE', ic: '📺', mandato: 312, desc: 'La televisión pública: su dirección marca el tono informativo.' },
    cis: { n: 'Centro de Investigaciones Sociológicas', ic: '📊', mandato: 260, desc: 'El CIS elabora los barómetros: un presidente afín tiende a sesgar la estimación.' },
    bde: { n: 'Banco de España', ic: '🏦', mandato: 312, desc: 'Su credibilidad condiciona la confianza de los mercados.' },
    cnmc: { n: 'CNMC (competencia y mercados)', ic: '⚖️', mandato: 312, desc: 'Regulador de los mercados: protege al consumidor o a los grandes operadores.' },
    tcu: { n: 'Tribunal de Cuentas', ic: '🧾', mandato: 468, desc: 'Fiscaliza las cuentas públicas y de los partidos.' },
    defensor: { n: 'Defensor del Pueblo', ic: '🛡️', mandato: 260, desc: 'Garante de derechos: su independencia da legitimidad al sistema.' },
    sepi: { n: 'SEPI y empresas públicas', ic: '🏭', mandato: 208, desc: 'Gestiona el sector público empresarial: premia a afines si se politiza.' }
  };
  const Og = C.Organismos = {
    ORGS,
    asegurar(E) {
      if (E.esp.org) return E.esp.org; const g = E.paises.ES.gob, t = E.fecha.t, o = {};
      for (const k in ORGS) { const p = C.Mundo.persona('ES'); const afin = U.chance(0.55); o[k] = { titular: { n: p.n, g: p.g }, pid: afin ? (U.chance(0.5) ? g.partido : U.pick(E.paises.ES.partidos.filter(x => E.partidos[x].amb === 'nac'))) : null, indep: afin ? U.ri(25, 55) : U.ri(60, 90), t0: t - U.ri(0, ORGS[k].mandato * 0.8) }; }
      return E.esp.org = { o, hist: [] };
    },
    sesgoCIS(E, k) { const o = Og.asegurar(E).o.cis; if (!o.pid || o.pid !== k) return 0; return 1.6 * (1 - o.indep / 100); },
    /* Índice de confianza institucional en los organismos económicos. */
    mercados(E) { const o = Og.asegurar(E).o; return clamp((o.bde.indep * 0.5 + o.cnmc.indep * 0.25 + o.tcu.indep * 0.25), 0, 100); },
    confianza(E) { const o = Og.asegurar(E).o; return U.suma(Object.values(o).map(x => x.indep)) / Object.keys(o).length; },
    nota(E, txt) { const s = Og.asegurar(E); s.hist.unshift({ t: E.fecha.t, txt }); if (s.hist.length > 20) s.hist.length = 20; },
    /* Nombramiento: afín (más lealtad), independiente (más credibilidad) o consensuado con la oposición. */
    nombrar(E, id, perfil) {
      const J = E.jugador, g = E.paises.ES.gob, s = Og.asegurar(E), o = s.o[id], O = ORGS[id]; if (!O) return { ok: false, msg: 'Organismo desconocido' };
      if (g.pm !== 'J') return { ok: false, msg: 'Sólo el presidente del Gobierno propone a los titulares' };
      const p = C.Mundo.persona('ES'), P = E.paises.ES;
      if (perfil === 'consenso') {
        const opo = C.Mayorias ? C.Mayorias.oposicion(E)[0] : null, rel = opo && C.Mayorias ? C.Mayorias.asegurar(E).rel[opo] : 0;
        if (!U.chance(clamp(0.3 + rel / 200 + J.atrib.negociacion / 25, 0.1, 0.8))) { C.Personaje.cambiar(E, { prestigio: -0.4 }); return { ok: true, exito: false, msg: 'La oposición bloquea el consenso: sigue el titular actual.' }; }
        Object.assign(o, { titular: { n: p.n, g: p.g }, pid: null, indep: U.ri(78, 95), t0: E.fecha.t }); C.Personaje.cambiar(E, { prestigio: 1.5 }); Og.nota(E, `${O.n}: nuevo titular consensuado (${p.n}).`); C.Noticias.poner(E, 'politica', `Pacto con la oposición para renovar ${O.n}: ${p.n}.`, 'ES'); return { ok: true, msg: `${O.n}: ${p.n}, consensuado.` };
      }
      const afin = perfil === 'afin'; Object.assign(o, { titular: { n: p.n, g: p.g }, pid: afin ? g.partido : null, indep: afin ? U.ri(15, 35) : U.ri(65, 85), t0: E.fecha.t });
      if (afin) { C.Opinion.empujeES(E, g.partido, -0.01); if (C.Mayorias) for (const k of C.Mayorias.oposicion(E)) C.Mayorias.cambiarRel(E, k, -3); } else C.Personaje.cambiar(E, { prestigio: 0.8 });
      Og.nota(E, `${O.n}: ${p.n} (${afin ? 'afín al Gobierno' : 'perfil técnico'}).`); C.Noticias.poner(E, 'politica', `El Gobierno nombra a ${p.n} al frente de ${O.n}${afin ? ', en medio de críticas de la oposición' : ''}.`, 'ES'); return { ok: true, msg: `${O.n}: ${p.n} (${afin ? 'afín' : 'técnico'}).` };
    },
    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return; const s = Og.asegurar(E), t = E.fecha.t, g = E.paises.ES.gob, md = C.Medios && C.Medios.asegurar(E);
      for (const k in s.o) { const o = s.o[k], O = ORGS[k];
        if (t - o.t0 >= O.mandato && g.pm !== 'J') { const p = C.Mundo.persona('ES'), afin = U.chance(0.5); Object.assign(o, { titular: { n: p.n, g: p.g }, pid: afin ? g.partido : null, indep: afin ? U.ri(20, 45) : U.ri(60, 88), t0: t }); Og.nota(E, `${O.n}: relevo en la presidencia (${p.n}).`); }
        else if (t - o.t0 >= O.mandato && !E.meta.presim && !o.aviso) { o.aviso = true; C.Eventos.info(E, `${O.ic} Mandato vencido: ${O.n}`, `El mandato del titular de ${O.n} ha vencido. Puedes nombrar un sucesor desde la pestaña Organismos.`); } }
      if (md && s.o.rtve.pid === g.partido) md.tono = clamp(md.tono + (1 - s.o.rtve.indep / 100) * 0.12, -60, 60);
      if (g.aprob && Og.confianza(E) < 40) g.aprob = clamp(g.aprob - 0.01, 5, 90);
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'nacional' }, o));
  R({ id: 'nombrar_organismo', nombre: 'Nombrar al titular de un organismo', icono: '🏢', costo: 2, desc: 'Presidente del Gobierno: elige un afín, un técnico o negocia un consenso con la oposición.', disponible: E => E.paises.ES.gob.pm === 'J' && E.jugador.pais === 'ES' ? true : 'Sólo el presidente del Gobierno', ejecutar: (E, a) => Og.nombrar(E, a.org, a.perfil) });
  C.Tiempo.registrar('organismos', { turno: Og.turno }, 48);
})(window.ESP);

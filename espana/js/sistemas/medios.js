/* Medios de comunicación: portadas semanales, relación con cada medio, entrevistas, filtraciones y bulos. La cobertura mueve la opinión y la campaña. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const MEDIOS = [
    { id: 'dnac', n: 'El Diario Nacional', ic: '📰', tipo: 'Prensa', eco: -12, soc: -15, alc: 3 },
    { id: 'gmod', n: 'La Gaceta Moderna', ic: '🗞️', tipo: 'Prensa', eco: 15, soc: 12, alc: 3 },
    { id: 'tele', n: 'Ibérica Televisión', ic: '📺', tipo: 'Televisión', eco: 0, soc: 0, alc: 4 },
    { id: 'c24h', n: 'Canal Noticias 24h', ic: '📡', tipo: 'Televisión', eco: -5, soc: -6, alc: 3 },
    { id: 'radi', n: 'Radio Ahora', ic: '📻', tipo: 'Radio', eco: 8, soc: 8, alc: 2 },
    { id: 'vpue', n: 'La Voz del Pueblo', ic: '💻', tipo: 'Digital', eco: -30, soc: -30, alc: 2 },
    { id: 'mlib', n: 'El Mundo Libre', ic: '🖥️', tipo: 'Digital', eco: 28, soc: 30, alc: 2 },
    { id: 'conf', n: 'El Confidencial Digital', ic: '🔎', tipo: 'Digital', eco: 5, soc: -5, alc: 2 }
  ];
  const POS = ['Elogia', 'Respalda', 'Destaca el éxito de'], NEG = ['Arremete contra', 'Cuestiona', 'Pone en duda'], NEU = ['Analiza', 'Examina', 'Repasa'];
  const COSAS = ['la gestión económica', 'el pulso con los socios', 'las cuentas públicas', 'la agenda territorial', 'el último pleno', 'la política de vivienda', 'el liderazgo del partido', 'las encuestas'];

  const Md = C.Medios = {
    MEDIOS,
    asegurar(E) {
      if (E.esp.medios) return E.esp.medios;
      const J = E.jugador, rel = {};
      MEDIOS.forEach(m => { const d = J ? U.distIdeo(J, m) : 0.5; rel[m.id] = Math.round(clamp(38 - d * 90 + U.gauss(0, 6), -70, 70)); });
      return E.esp.medios = { rel, portadas: [], bulos: [], tono: 0, ult: 0 };
    },
    medio(id) { return MEDIOS.find(m => m.id === id); },
    /* Cómo trata un medio a un partido: línea editorial + relación (si es el del jugador). */
    tono(E, m, pid) {
      const p = E.partidos[pid], md = Md.asegurar(E), J = E.jugador;
      const afin = 1 - U.distIdeo(p, m), r = J && pid === J.partido ? md.rel[m.id] / 100 : 0;
      return clamp((afin - 0.62) * 2.4 + r * 0.8 + U.gauss(0, 0.18), -1, 1);
    },

    turno(E) {
      const J = E.jugador; if (!J || J.pais !== 'ES') return;
      const md = Md.asegurar(E), t = E.fecha.t, pa = E.partidos[J.partido];
      // La relación se acerca a su nivel natural (afinidad ideológica)
      MEDIOS.forEach(m => { const nat = 38 - U.distIdeo(J, m) * 90; md.rel[m.id] = clamp(md.rel[m.id] + (nat - md.rel[m.id]) * 0.015 + U.gauss(0, 0.5), -80, 80); });
      // Portadas: cada semana tres medios dedican su portada al jugador o a su partido
      const g = E.paises.ES.gob, sujeto = U.chance(0.45) || J.cargo !== 'activista' ? J.partido : g.partido;
      const sel = []; while (sel.length < 3) { const m = U.pick(MEDIOS); if (!sel.includes(m)) sel.push(m); }
      let efecto = 0;
      for (const m of sel) {
        const tn = Md.tono(E, m, sujeto), cosa = U.pick(COSAS), verbo = U.pick(tn > 0.2 ? POS : tn < -0.2 ? NEG : NEU);
        md.portadas.unshift({ t, medio: m.id, titular: `${m.n}: ${verbo} ${cosa} de ${E.partidos[sujeto].sigla}`, tono: Math.round(tn * 100) / 100, sujeto });
        if (sujeto === J.partido) efecto += tn * m.alc * 0.0045;
      }
      if (md.portadas.length > 40) md.portadas.length = 40;
      if (efecto) { md.tono = md.tono * 0.7 + efecto * 100 * 0.3; if (efecto > 0) C.Opinion.empuje(E, J.partido, Math.min(0.04, efecto), 0.3); else C.Opinion.empuje(E, J.partido, Math.max(-0.04, efecto), 0.3); }
      // Bulos contra algún partido
      if (U.chance(0.03) && !E.meta.presim) {
        const k = U.chance(0.4) ? J.partido : U.pick(E.paises.ES.partidos.filter(x => E.partidos[x].amb === 'nac')), fuerza = U.rf(0.4, 1);
        const txt = U.pick(['un vídeo manipulado', 'una supuesta lista de gastos', 'un audio atribuido a un dirigente', 'una cadena de mensajes falsos', 'un pantallazo falso']);
        md.bulos.unshift({ id: U.id('b'), t, pid: k, txt: `Circula ${txt} contra ${E.partidos[k].sigla}.`, fuerza, activo: true });
        if (k === J.partido) C.Noticias.poner(E, 'politica', `Se viraliza un bulo contra ${pa.sigla}: ${md.bulos[0].txt}`, 'ES');
        if (md.bulos.length > 12) md.bulos.length = 12;
      }
      for (const b of md.bulos) {
        if (!b.activo) continue;
        b.fuerza *= 0.93; if (b.fuerza < 0.08) { b.activo = false; continue; }
        if (b.pid === J.partido) C.Opinion.empuje(E, b.pid, -0.012 * b.fuerza, 0.3);
        else if (U.chance(0.04)) b.fuerza *= 0.5;
      }
    },

    /* ── Acciones ── */
    entrevista(E, id) {
      const J = E.jugador, md = Md.asegurar(E), m = Md.medio(id); if (!m) return { ok: false, msg: 'Elige un medio' };
      const o = (J.atrib.oratoria + J.atrib.carisma) / 20, hostil = md.rel[id] < -10;
      const pe = clamp(0.45 + o * 0.45 - (hostil ? 0.25 : 0) + md.rel[id] / 300, 0.1, 0.92);
      if (U.chance(pe)) { md.rel[id] = clamp(md.rel[id] + 6 + o * 6, -80, 80); C.Personaje.cambiar(E, { pop: 0.6 + o * 1.4, prestigio: 0.4 }); C.Opinion.empuje(E, J.partido, 0.03 + o * 0.03, 0.3); return { ok: true, msg: `Buena entrevista en ${m.n}: sube tu relación con el medio.` }; }
      md.rel[id] = clamp(md.rel[id] - 7, -80, 80); C.Personaje.cambiar(E, { pop: -0.5 }); return { ok: true, exito: false, msg: `La entrevista en ${m.n} se te complica: titular incómodo.` };
    },
    rueda(E) {
      const J = E.jugador, md = Md.asegurar(E), o = J.atrib.oratoria / 10; MEDIOS.forEach(m => { md.rel[m.id] = clamp(md.rel[m.id] + 1.5 + o * 2, -80, 80); });
      const act = md.bulos.find(b => b.activo && b.pid === J.partido); if (act) act.fuerza *= 0.8;
      C.Personaje.cambiar(E, { pop: 0.3 }); return { ok: true, msg: 'Rueda de prensa: mejora tu relación con todos los medios.' };
    },
    filtrar(E, id, pid) {
      const J = E.jugador, md = Md.asegurar(E), m = Md.medio(id); if (!m || !E.partidos[pid] || pid === J.partido) return { ok: false, msg: 'Elige un medio y un rival' };
      if (md.rel[id] < 15) return { ok: false, msg: `${m.n} no se fía de ti lo bastante para publicar tu filtración` };
      const riesgo = clamp(0.35 - J.atrib.integridad / 40 - md.rel[id] / 400, 0.08, 0.5);
      if (U.chance(riesgo)) { C.Personaje.cambiar(E, { prestigio: -3, pop: -1.5 }, true); md.rel[id] = clamp(md.rel[id] - 12, -80, 80); return { ok: true, exito: false, msg: 'Se descubre que la filtración salió de tu equipo: escándalo.' }; }
      C.Opinion.empuje(E, pid, -0.06, 0.3); if (C.Campana && C.Campana.activa(E)) C.Campana.mover(E, pid, -0.5); md.rel[id] = clamp(md.rel[id] + 3, -80, 80);
      C.Noticias.poner(E, 'politica', `${m.n} publica una información que deja en mal lugar a ${E.partidos[pid].sigla}.`, 'ES'); return { ok: true, msg: `${m.n} publica tu filtración contra ${E.partidos[pid].sigla}.` };
    },
    desmentir(E, id) {
      const J = E.jugador, md = Md.asegurar(E), b = md.bulos.find(x => x.id === id && x.activo && x.pid === J.partido); if (!b) return { ok: false, msg: 'Ese bulo ya no afecta a tu partido' };
      const p = clamp(0.5 + J.atrib.oratoria / 25 + J.atrib.integridad / 40, 0.3, 0.9);
      if (U.chance(p)) { b.fuerza *= 0.3; if (b.fuerza < 0.1) b.activo = false; C.Personaje.cambiar(E, { prestigio: 0.8 }); return { ok: true, msg: 'Tu desmentido frena el bulo.' }; }
      b.fuerza *= 0.8; return { ok: true, exito: false, msg: 'El desmentido apenas llega: el bulo sigue circulando.' };
    },
    /* Temas del momento (tendencias en redes) según el estado del país. */
    tendencias(E) {
      const P = E.paises.ES, ec = P.ec, g = P.gob, out = [], add = (tag, f, txt, sg, sujeto) => out.push({ tag, f: clamp(Math.round(f), 5, 100), txt, sg, sujeto: sujeto || null });
      if (C.Corrupcion) { const k = C.Corrupcion.asegurar(E); k.casos.filter(c => c.fase !== 'cerrado').slice(0, 2).forEach(c => add('#Caso' + E.partidos[c.pid].sigla, 30 + c.gravedad * 60, `${C.Corrupcion.TIPOS[c.tipo][0]} en ${E.partidos[c.pid].sigla}`, -1, c.pid)); }
      if (C.Estructural) { const s = C.Estructural.asegurar(E); if (C.Estructural.esfuerzo(E) > 38) add('#AlquilerYa', (C.Estructural.esfuerzo(E) - 30) * 4, 'El alquiler se come el sueldo', -1, g.partido); if (s.ener.precio > 125) add('#LuzPorLasNubes', (s.ener.precio - 100) * 1.4, 'La factura de la luz se dispara', -1, g.partido); if (s.inm.tension > 55) add('#FronteraSur', s.inm.tension, 'Tensión migratoria en la frontera sur', -1, g.partido); if (s.fin.prima > 250) add('#PrimaDeRiesgo', s.fin.prima / 5, 'La prima de riesgo inquieta a los mercados', -1, g.partido); }
      if (ec.paro > 12) add('#Paro', ec.paro * 4, 'El paro vuelve a las portadas', -1, g.partido); if (ec.crec > 2.4) add('#EspañaVa', ec.crec * 18, 'El crecimiento sorprende al alza', 1, g.partido);
      if (C.Crisis) C.Crisis.asegurar(E).activas.filter(c => c.fase !== 'cerrada').slice(0, 2).forEach(c => add('#' + C.Crisis.TIPOS[c.tipo].n.split(' ')[0], 55 + c.sev * 12, C.Crisis.TIPOS[c.tipo].n, -1, g.partido));
      if (C.Corona) { const co = C.Corona.asegurar(E); if (co.pop < 42) add('#Corona', 70 - co.pop, 'Debate sobre la monarquía', -1); }
      if (C.Referendos) C.Referendos.asegurar(E).act.filter(r => r.estado === 'campana').forEach(r => add('#Consulta', 60, C.Referendos.TEMAS[r.tema].n, 0));
      if (g.aprob > 58) add('#Gobierno', g.aprob, 'El Gobierno goza de buena imagen', 1, g.partido);
      return out.sort((a, b) => b.f - a.f).slice(0, 7);
    },
    /* Tertulias: cada medio comenta un tema desde su línea editorial. */
    tertulias(E) {
      const g = E.paises.ES.gob, tn = Md.tendencias(E), r = ((E.fecha.t * 2654435761) >>> 0) % 997; if (!tn.length) return []; const afin = (m) => 1 - U.distIdeo(m, E.partidos[g.partido]) * 2; const out = [];
      MEDIOS.forEach((m, i) => { const t = tn[(i + r) % tn.length], pro = afin(m) > 0.1, tono = t.sg === 0 ? 0 : (t.sg < 0 ? (pro ? -0.3 : 1) : (pro ? 1 : -0.4));
        const frase = tono > 0.4 ? U.pick(['Una oportunidad que hay que aprovechar', 'El Gobierno acierta con el rumbo', 'Los datos hablan por sí solos']) : tono < -0.3 ? U.pick(['Una vergüenza que no puede seguir así', 'La oposición tiene razón: hay que rectificar', 'Lo del Gobierno ya no es gestión, es improvisación']) : U.pick(['Un asunto con muchos matices', 'Habrá que esperar a ver cómo evoluciona', 'Ni tan bien ni tan mal']);
        out.push({ medio: m.id, nom: m.n, ic: m.ic, tag: t.tag, frase, tono }); });
      return out;
    },
    encuestaPrivada(E) {
      const J = E.jugador; const res = C.Generales.simular(E, { ruido: 0, ruidoN: 0 }), md = Md.asegurar(E), votos = {}; let sum = 0;
      for (const k of E.paises.ES.partidos) { if (res.nat[k] == null) continue; votos[k] = Math.max(0, res.nat[k] + U.gauss(0, 0.7)); sum += votos[k]; } for (const k in votos) votos[k] = votos[k] * 100 / sum;
      md.priv = { t: E.fecha.t, votos }; C.Personaje.cambiar(E, { prestigio: 0.1 }); return { ok: true, msg: 'Tu equipo encarga un sondeo privado: ya tienes los datos.' };
    },
    bulosJ(E) { const J = E.jugador, md = Md.asegurar(E); return md.bulos.filter(b => b.activo && b.pid === J.partido); }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'medios' }, o));
  const esp = E => E.jugador.pais === 'ES' ? true : 'Sólo en la política española';
  R({ id: 'entrevista_medio', nombre: 'Entrevista en un medio', icono: '🎙️', desc: 'Concede una entrevista a un medio concreto: mejora la relación con él si sale bien.', disponible: esp, ejecutar: (E, a) => Md.entrevista(E, a.medio) });
  R({ id: 'rueda_prensa', nombre: 'Rueda de prensa', icono: '🎤', desc: 'Atiende a todos los medios: mejora la relación general y frena los bulos.', disponible: esp, ejecutar: E => Md.rueda(E) });
  R({ id: 'filtrar_medio', nombre: 'Filtrar a un medio afín', icono: '🕵️', costo: 2, desc: 'Pasa información a un medio amigo para dañar a un rival. Si se descubre, pagas el precio.', disponible: esp, ejecutar: (E, a) => Md.filtrar(E, a.medio, a.pid) });
  R({ id: 'encuesta_privada', nombre: 'Encargar un sondeo privado', icono: '📊', desc: 'Una encuesta propia, con menos ruido que el CIS, sobre la intención de voto actual.', disponible: esp, ejecutar: E => Md.encuestaPrivada(E) });
  R({ id: 'desmentir_bulo', nombre: 'Desmentir un bulo', icono: '🛡️', desc: 'Contrarresta un bulo que circula contra tu partido.', disponible: E => esp(E) === true ? (C.Medios.bulosJ(E).length ? true : 'No hay bulos contra tu partido') : esp(E), ejecutar: (E, a) => Md.desmentir(E, a.id || (Md.bulosJ(E)[0] || {}).id) });
  C.Tiempo.registrar('medios', { turno: Md.turno, postInit: E => { if (E.jugador && E.jugador.pais === 'ES') Md.asegurar(E); } }, 38);

  if (C.Jefe) C.Jefe.registrar('medios', {
    propone(E) { const o = Md.bulosJ(E).slice(0, 1).map(b => ({ txt: 'Desmentir: ' + b.txt, accion: 'desmentir_bulo', args: { id: b.id } })); const md = Md.asegurar(E), m = MEDIOS.slice().sort((a, b) => md.rel[a.id] - md.rel[b.id])[0]; o.push({ txt: `Mejorar la relación con ${m.n} (${Math.round(md.rel[m.id])}).`, accion: 'entrevista_medio', args: { medio: m.id } }); return o; },
    hace(E) {
      const out = [], md = Md.asegurar(E);
      Md.bulosJ(E).forEach(b => { const r = Md.desmentir(E, b.id); out.push('Desmiente un bulo: ' + r.msg); });
      const m = MEDIOS.slice().sort((a, b) => md.rel[a.id] - md.rel[b.id])[0]; if (md.rel[m.id] < 10 && U.chance(0.4)) { const r = Md.entrevista(E, m.id); out.push(r.msg); }
      return out;
    }
  });
})(window.ESP);

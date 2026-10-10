/* Disolución de las Cortes y de los parlamentos autonómicos: el anuncio puede ser una sorpresa o estar descontado.
   Envuelve Generales.disolver y Territorio.adelantar: registra el modo del anuncio, aplica sus efectos, escribe la noticia y deja una
   «declaración institucional» pendiente de mostrarse (con la escena del presidente ante el atril; ver pantallas/declaracion.js).
   Estado: E.esp.dis = { pend: [anuncio], hist: [anuncio] }. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, D = () => C.DATA, clamp = U.clamp;
  const MODOS = {
    sorpresa: { n: 'Por sorpresa', ic: '🤫', d: 'Compareces sin avisar a nadie. Tu partido gana impulso y la oposición llega descolocada, pero los socios se sienten ninguneados (estabilidad −1,5).' },
    anunciada: { n: 'Anunciada con antelación', ic: '📢', d: 'Lo consultas con los socios y dejas que se filtre con días de margen. Más estabilidad (+0,8) y ningún golpe de efecto.' },
    ordinaria: { n: 'Fin de legislatura', ic: '📅', d: 'Se agota el mandato: el decreto de disolución estaba descontado.' },
    forzada: { n: 'Por imperativo constitucional', ic: '⚖️', d: 'No hay investidura posible: las Cortes se disuelven automáticamente.' }
  };
  const nombreCcaa = c => (D().ccaa[c] || { nombre: c }).nombre;

  const Ds = C.Disolucion = {
    MODOS,
    asegurar(E) { if (!E.esp.dis) E.esp.dis = { pend: [], hist: [] }; return E.esp.dis; },

    /* Quién comparece: nombre y cargo. */
    hablante(E, ambito) {
      const J = E.jugador;
      if (ambito === 'ES') { const g = E.paises.ES.gob, p = E.politicos[g.pm]; return { nombre: g.pm === 'J' ? J.nombre : p ? p.n : 'la Presidencia del Gobierno', cargo: 'presidente/a del Gobierno', jugador: g.pm === 'J', pid: g.partido }; }
      const g = E.esp.ccaa[ambito].gob, p = g && E.politicos[g.pres];
      return { nombre: g && g.pres === 'J' ? J.nombre : p ? p.n : 'el presidente autonómico', cargo: 'presidente/a de ' + (D().ccaa[ambito] ? D().ccaa[ambito].nombre : ambito), jugador: !!g && g.pres === 'J', pid: g ? g.partido : null };
    },
    /* Modo del anuncio si el jugador no lo ha elegido. */
    modoPorDefecto(E, ambito, auto, motivo) {
      if (auto) return /legislatura|mandato/i.test(motivo || '') ? 'ordinaria' : 'forzada';
      if (/falta de apoyos|sin investidura|investidura/i.test(motivo || '')) return 'forzada';
      if (Ds.hablante(E, ambito).jugador) return 'anunciada';
      return U.chance(0.4) ? 'sorpresa' : 'anunciada';
    },

    /* Efectos del modo, sobre el Gobierno que disuelve. Devuelve un texto breve. */
    efectos(E, ambito, modo, quien) {
      const J = E.jugador, Pj = C.Personaje;
      if (ambito === 'ES') {
        const g = E.paises.ES.gob, Op = C.Opinion;
        if (modo === 'sorpresa') {
          if (Op && quien.pid && E.partidos[quien.pid] && E.partidos[quien.pid].amb === 'nac') Op.empujeES(E, quien.pid, 0.6);
          const rival = E.paises.ES.partidos.filter(k => k !== quien.pid && E.partidos[k].amb === 'nac').sort((a, b) => E.partidos[b].pop - E.partidos[a].pop)[0]; if (Op && rival) Op.empujeES(E, rival, -0.3);
          g.estab = Math.max(5, g.estab - 1.5); if (quien.jugador && Pj) Pj.cambiar(E, { prestigio: -0.4 }, true);
          return 'Efecto: el partido del Gobierno gana impulso y la oposición llega descolocada, pero los socios se sienten ninguneados (estabilidad −1,5).';
        }
        if (modo === 'anunciada') { g.estab = Math.min(100, g.estab + 0.8); if (quien.jugador && Pj) Pj.cambiar(E, { prestigio: 0.2 }, true); return 'Efecto: la disolución estaba descontada; los socios cierran filas (estabilidad +0,8).'; }
        return '';
      }
      const rc = E.esp.ccaa[ambito], g = rc.gob; if (!g) return '';
      if (modo === 'sorpresa') { g.aprob = clamp(g.aprob + 1.2, 5, 90); g.estab = Math.max(5, g.estab - 3); if (quien.jugador && Pj) Pj.cambiar(E, { prestigio: -0.3 }, true); return 'Efecto: el Gobierno autonómico gana protagonismo (aprobación +1,2) pero sus socios se sienten ninguneados (estabilidad −3).'; }
      if (modo === 'anunciada') { g.estab = Math.min(95, g.estab + 1.5); return 'Efecto: la convocatoria estaba descontada; el bloque cierra filas (estabilidad +1,5).'; }
      return '';
    },

    /* Se muestra al jugador si afecta a España entera o a su comunidad. */
    visible(E, ambito) { const J = E.jugador; return !!J && J.pais === 'ES' && (ambito === 'ES' || J.region === ambito); },

    registrar(E, ambito, modo, motivo) {
      const s = Ds.asegurar(E), quien = Ds.hablante(E, ambito), ES = ambito === 'ES', c = E.esp.cortes;
      const efecto = Ds.efectos(E, ambito, modo, quien), fechaVoto = ES ? c.proxT : E.esp.ccaa[ambito].parl.proxT;
      const d = { t: E.fecha.t, ambito, modo, motivo: motivo || '', nombre: quien.nombre, cargo: quien.cargo, jugador: quien.jugador, fechaVoto, efecto };
      s.hist.unshift(d); if (s.hist.length > 12) s.hist.length = 12;
      const deDonde = ES ? 'de las Cortes' : 'del Parlamento de ' + nombreCcaa(ambito);
      if (modo === 'sorpresa') C.Noticias.poner(E, 'politica', `Sorpresa: ${quien.nombre} anuncia sin previo aviso la disolución ${deDonde}${ES ? '' : ' y convoca elecciones'}.`, 'ES');
      else if (modo === 'anunciada') C.Noticias.poner(E, 'politica', `${quien.nombre} confirma en una declaración institucional la disolución ${deDonde}.`, 'ES');
      if (Ds.visible(E, ambito) && !E.meta.presim) s.pend.push(d);
      return d;
    },
    pendiente(E) { const s = Ds.asegurar(E); return s.pend.length ? s.pend[0] : null; },
    consumir(E) { const s = Ds.asegurar(E); return s.pend.shift() || null; },

    /* Titular y relato del anuncio (los usa la pantalla). */
    titular(d) {
      const ES = d.ambito === 'ES', n = nombreCcaa(d.ambito), se = ES ? 'se disuelven las Cortes' : `se disuelve el Parlamento de ${n}`;
      return { sorpresa: ES ? 'Sorpresa en La Moncloa: se disuelven las Cortes' : `Sorpresa en ${n}: se disuelve el Parlamento`, anunciada: `Declaración institucional: ${se}`, ordinaria: 'Fin de la legislatura: decreto de disolución', forzada: ES ? 'Las Cortes se disuelven por imperativo constitucional' : `Se disuelve el Parlamento de ${n}` }[d.modo] || 'Disolución';
    },
    relato(d) {
      const ES = d.ambito === 'ES', lugar = ES ? 'La Moncloa' : 'la sede del Gobierno de ' + nombreCcaa(d.ambito), deDonde = ES ? 'de las Cortes Generales' : 'del Parlamento de ' + nombreCcaa(d.ambito), elec = ES ? 'elecciones generales' : 'elecciones autonómicas', f = U.fmtT(d.fechaVoto), mt = d.motivo && !/^a petición/i.test(d.motivo) ? ` Motivo oficial: ${d.motivo}.` : '';
      if (d.modo === 'sorpresa') return `${d.nombre}, ${d.cargo}, ha comparecido esta mañana en ${lugar} sin previo aviso para anunciar la disolución ${deDonde} y la convocatoria de ${elec} el ${f}.${mt} La oposición critica la jugada y los socios no habían sido informados.`;
      if (d.modo === 'anunciada') return `Tras días de rumores y contactos con los socios, ${d.nombre}, ${d.cargo}, ha confirmado desde ${lugar} la disolución ${deDonde} y las ${elec} para el ${f}.${mt} La convocatoria estaba descontada.`;
      if (d.modo === 'ordinaria') return `Se agota el mandato: ${d.nombre} comparece en ${lugar} para dar por terminada la legislatura y fijar las ${elec} el ${f}.${mt}`;
      return `Sin investidura posible, ${ES ? 'quedan disueltas las Cortes Generales' : 'queda disuelto el Parlamento de ' + nombreCcaa(d.ambito)} y se convocan ${elec} el ${f}.${mt} ${d.nombre} comparece para dar cuenta de la situación.`;
    }
  };

  /* ── Ganchos ── */
  const Gen = C.Generales, T = C.Territorio;
  if (Gen && Gen.disolver) { const f = Gen.disolver; Gen.disolver = function (E, motivo, auto) { const r = f.apply(this, arguments); if (r === true && !E.meta.presim) Ds.registrar(E, 'ES', E._modoDisol || Ds.modoPorDefecto(E, 'ES', auto, motivo), motivo); return r; }; }
  if (T && T.adelantar) { const f = T.adelantar; T.adelantar = function (E, c, motivo) { const r = f.apply(this, arguments); if (!E.meta.presim) Ds.registrar(E, c, E._modoDisol || Ds.modoPorDefecto(E, c, false, motivo), motivo); return r; }; }
  // Las acciones del jugador aceptan el modo del anuncio (por defecto, anunciada)
  for (const id of ['disolver_cortes', 'adelanto_autonomico']) {
    const a = C.Acciones.get(id); if (!a) continue; const ej = a.ejecutar;
    a.ejecutar = function (E, args) { E._modoDisol = args && MODOS[args.modo] && ['sorpresa', 'anunciada'].includes(args.modo) ? args.modo : 'anunciada'; try { return ej.apply(this, arguments); } finally { delete E._modoDisol; } };
  }
})(window.ESP);

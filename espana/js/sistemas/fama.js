/* Salón de la fama (ranking de carreras entre partidas, en este navegador), epílogo largo y consejos de primera vez. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U;
  const KEY = 'curul-es-fama';
  const Fm = C.Fama = {
    leer() { try { const r = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; } },
    escribir(l) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 40))); return true; } catch (e) { return false; } },
    cima(E) { const h = E.jugador.hitos || {}; return h.pm ? 'Presidente/a del Gobierno' : h.presauto ? 'Presidente/a autonómico/a' : h.ministro ? 'Ministro/a' : h.lider ? 'Líder de partido' : h.alcalde ? 'Alcalde/sa' : 'Dirigente'; },
    guardar(E, fin) {
      const J = E.jugador; if (!J || J.pais !== 'ES' || E.meta.presim) return; if (!E.meta.famaId) E.meta.famaId = U.id('f');
      const sal = C.Dilemas ? C.Dilemas.libro(E).reduce((a, x) => a + x.score, 0) : 0, mt = C.Metas ? Object.keys(C.Metas.asegurar(E).hechas).length : 0, lg = E.esp.leg ? Object.keys(E.esp.leg.logros).length : 0;
      const e = { id: E.meta.famaId, nombre: J.nombre, partido: E.partidos[J.partido] ? E.partidos[J.partido].sigla : '', cima: Fm.cima(E), pts: C.Personaje.puntuacion(E), anios: Math.round(E.fecha.t / 52 * 10) / 10, metas: mt, logros: lg, saldo: Math.round(sal * 10) / 10, fin: !!fin || !!J.retirado, ts: Date.now() };
      const l = Fm.leer().filter(x => x.id !== e.id); l.push(e); l.sort((a, b) => b.pts - a.pts); Fm.escribir(l); return e;
    },
    ranking() { return Fm.leer().sort((a, b) => b.pts - a.pts); },
    /* Epílogo largo: párrafos con la historia de tu carrera. */
    epilogo(E) {
      const J = E.jugador, ps = [], anios = E.fecha.t / 52, pa = E.partidos[J.partido], h = J.hitos || {};
      ps.push(C.Legado ? C.Legado.epilogo(E) : '');
      if (C.Nemesis) { const n = C.Nemesis.asegurar(E); if (n.id && E.politicos[n.id]) { const g = n.enfr.filter(x => x.gana).length; ps.push(`Su gran adversario fue ${E.politicos[n.id].n} (${E.partidos[n.pid].sigla}): ${n.enfr.length ? `se midieron en las urnas ${n.enfr.length} vez/veces y ${J.nombre} ganó ${g}` : 'nunca llegaron a medirse en unas generales'}${n.odio > 65 ? ', y la enemistad fue legendaria' : ''}.`); } }
      if (E.esp.cv && E.esp.cv.hist.some(x => x.jug)) { const l = E.esp.cv.hist.filter(x => x.jug).sort((a, b) => b.V - a.V); const b = l[0], m = l[l.length - 1]; ps.push(`En las crisis, se recordará su gestión de «${b.n.toLowerCase()}» (${b.V > 0.3 ? 'elogiada' : 'discutida'})${l.length > 1 && m.V < -0.1 ? ` y el mal trago de «${m.n.toLowerCase()}»` : ''}.`); }
      if (C.Barones) { const s = C.Barones.asegurar(E), mi = s.esc.filter(x => !x.rival); if (mi.length) ps.push(`Su liderazgo conoció ${mi.length} escisión/escisiones territorial(es)${mi.some(x => x.cerrada) ? ', alguna reconciliada' : ''}.`); }
      if (C.Dilemas) { const lb = C.Dilemas.libro(E), sal = lb.reduce((a, x) => a + x.score, 0); if (lb.length > 3) ps.push(`De las ${lb.length} decisiones difíciles que tomó, su balance fue ${sal > 15 ? 'brillante' : sal > 0 ? 'positivo' : 'más bien desafortunado'} (${sal > 0 ? '+' : ''}${Math.round(sal)}).`); }
      if (C.Metas) { const m = C.Metas.asegurar(E), hh = Object.keys(m.hechas); if (hh.length) ps.push(`Cumplió ${hh.length} meta(s) personal(es): ${hh.map(k => C.Metas.META[k][1].toLowerCase()).join(', ')}.`); }
      if (C.Vida) { const v = C.Vida.asegurar(E); if (v.hist.some(x => /hospital|excedencia/i.test(x.txt))) ps.push('La política también le pasó factura personal: hubo paradas por salud en el camino.'); }
      return ps.filter(Boolean);
    }
  };
  // Se guarda cada medio año de partida y al retirarse
  C.Bus.on('turno', t => { const E = C.E; if (E && E.jugador && t % 26 === 0) Fm.guardar(E); });
  const r0 = C.Personaje.retirar; C.Personaje.retirar = function (E) { const r = r0.apply(this, arguments); Fm.guardar(E, true); return r; };
  /* Consejos de primera vez: un aviso corto la primera vez que aparece cada sistema. */
  C.Tutor = {
    TIPS: {
      dilema: ['⏳ Dilemas', 'Aparecen decisiones con plazo: cuestan capital político y los asesores opinan distinto. Mira la pestaña Dilemas.'],
      nemesis: ['🥊 Némesis', 'Tu gran rival te atacará, te retará y te acompañará en cada elección. Está en Mayorías → Rivales.'],
      presion: ['📣 Presión', 'La presión para adelantar elecciones sube cuando el Gobierno va mal. Puedes moverla desde Mayorías.'],
      crisis: ['🚨 Crisis en directo', 'Una crisis te exige decidir paso a paso. Fíjate en el arquetipo de cada opción: no hay una opción siempre buena.'],
      baron: ['🧑‍💼 Barones', 'Los presidentes autonómicos de tu partido tienen lealtad propia. Atiéndelos desde Mi partido → Interno.'],
      debate: ['📺 Debate', 'En cada tema, elige el tono: ataque brilla si el rival es débil, datos es seguro, ironía depende de tu carisma.'],
      vetos: ['⛔ Vetos', 'Los partidos se declaran vetos en campaña; los puedes ver y usar desde Mayorías → Rivales.'],
      vida: ['❤️ Vida personal', 'El estrés recorta tus puntos de agenda. Cuídate o te pasará factura (Dilemas → Vida personal).'],
      sesion: ['🏛 Sesión en directo', 'Tu discurso y tus pasillos pueden mover votos en la investidura y en la moción de censura.']
    },
    una(E, k) {
      if (!E || E.meta.presim || !E.jugador || E.jugador.pais !== 'ES') return false; const m = E.meta.tips = E.meta.tips || {}; if (m[k] || !C.Tutor.TIPS[k]) return false;
      m[k] = E.fecha.t; try { C.UI.toast('💡 ' + C.Tutor.TIPS[k][0] + ': ' + C.Tutor.TIPS[k][1], 'info'); } catch (e) { } return true;
    }
  };
})(window.ESP);

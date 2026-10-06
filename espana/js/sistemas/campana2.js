/* Campañas municipal y europea (ligeras): en las semanas previas a la cita, tus actos suman «impulso» que se convierte en un empujón de tu partido el día de la votación. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, clamp = U.clamp, esc = U.esc;
  const VENT = 14;
  const AMB = {
    mun: { n: 'municipales', ic: '🏘', tVoto: E => E.esp.muni && E.esp.muni.proxT, hecho: ['Recorres los barrios y mercados con los candidatos locales.', 'Mitin de cierre en la plaza mayor.', 'Reparto de buzoneo y puerta a puerta con la militancia.'] },
    eu: { n: 'europeas', ic: '🇪🇺', tVoto: E => E.ue && E.ue.proxPE, hecho: ['Acto con la lista europea de tu partido.', 'Entrevista sobre el futuro de Europa.', 'Encuentro con la familia política europea.'] }
  };
  const Cm = C.CampMini = {
    AMB,
    asegurar(E) { if (!E.esp.cm) E.esp.cm = { mun: { pts: 0, t: 0 }, eu: { pts: 0, t: 0 } }; return E.esp.cm; },
    semanas(E, k) { const t = AMB[k].tVoto(E); return t ? t - E.fecha.t : 99; },
    activa(E, k) { const s = Cm.semanas(E, k); return s > 0 && s <= VENT; },
    puntos(E, k) { return Cm.asegurar(E)[k].pts; },
    acto(E, k) {
      const J = E.jugador, c = Cm.asegurar(E)[k]; if (!Cm.activa(E, k)) return { ok: false, msg: 'Aún no ha empezado la campaña' };
      const o = (J.atrib.oratoria + J.atrib.carisma) / 20, g = (0.7 + o * 1.3) * (c.pts > 8 ? 0.6 : 1);
      c.pts = clamp(c.pts + g, 0, 14); C.Personaje.cambiar(E, { pop: 0.3 + o * 0.5 });
      return { ok: true, msg: U.pick(AMB[k].hecho) + ` Impulso +${U.d1(g)}.` };
    },
    /* El impulso se aplica al partido del jugador justo antes de contar los votos. */
    antes(E, k) { const J = E.jugador, c = Cm.asegurar(E)[k]; if (!J || J.pais !== 'ES' || !c.pts) return; const d = c.pts * 0.09; C.Opinion.empujeES(E, J.partido, d); c._d = d; },
    despues(E, k) { const c = Cm.asegurar(E)[k]; if (c._d) { C.Opinion.empujeES(E, E.jugador.partido, -c._d * 0.65); c._d = 0; } if (c.pts) C.Noticias.poner(E, 'elecciones', `${E.partidos[E.jugador.partido].sigla} cierra su campaña ${k === 'mun' ? 'municipal' : 'europea'} con ${U.d1(c.pts)} puntos de impulso.`, 'ES'); c.pts = 0; },
    panel(E, k) {
      const A = AMB[k], s = Cm.semanas(E, k), c = Cm.asegurar(E)[k], act = Cm.activa(E, k);
      return `<div class="tarjeta" style="border-color:${act ? 'var(--oro)' : 'var(--borde)'}"><div class="t-cab"><h3>${A.ic} Tu campaña de las ${A.n}</h3><span class="etq ${act ? 'oro' : ''}">${act ? s + ' semanas para votar' : s > VENT && s < 99 ? 'Empieza en ' + (s - VENT) + ' semanas' : 'Sin campaña'}</span></div>
        <div style="font-size:12.5px;margin-bottom:6px">Impulso acumulado <b>${U.d1(c.pts)}</b> / 14</div><div class="barra-h" style="height:8px"><i style="width:${c.pts / 14 * 100}%;background:var(--oro)"></i></div>
        <div class="tenue" style="font-size:12px;margin:8px 0">Cada acto suma impulso (más con buena oratoria y carisma); el día de la votación se convierte en un empujón para tu partido.</div>
        ${C.UI.botonAccion('campana_' + k, {}, '🎤 Acto de campaña', 'chico prim')}</div>`;
    }
  };
  const R = o => C.Acciones.registrar(Object.assign({ costo: 1, grupo: 'campana' }, o));
  const ES = E => E.jugador.pais === 'ES' ? true : 'Sólo en España';
  R({ id: 'campana_mun', nombre: 'Acto de campaña municipal', icono: '🏘', desc: 'Apoya a los candidatos locales de tu partido en las semanas previas a las municipales.', disponible: E => ES(E) === true ? (Cm.activa(E, 'mun') ? true : 'La campaña municipal aún no ha empezado') : ES(E), ejecutar: E => Cm.acto(E, 'mun') });
  R({ id: 'campana_eu', nombre: 'Acto de campaña europea', icono: '🇪🇺', desc: 'Apoya la lista de tu partido en las semanas previas a las europeas.', disponible: E => ES(E) === true ? (Cm.activa(E, 'eu') ? true : 'La campaña europea aún no ha empezado') : ES(E), ejecutar: E => Cm.acto(E, 'eu') });
  // Ganchos en el recuento de municipales y europeas
  const Mu = C.Municipios, UE = C.UE;
  if (Mu && Mu.elecciones) { const f = Mu.elecciones; Mu.elecciones = function (E, inicial) { if (!inicial) Cm.antes(E, 'mun'); const r = f.apply(this, arguments); if (!inicial) Cm.despues(E, 'mun'); return r; }; }
  if (UE && UE.celebrarPE) { const f = UE.celebrarPE; UE.celebrarPE = function (E) { Cm.antes(E, 'eu'); const r = f.apply(this, arguments); Cm.despues(E, 'eu'); return r; }; }
  C.Jefe && C.Jefe.registrar('campana', (() => { const h = C.Jefe.handlers.campana; return { propone: E => { const o = h && h.propone ? h.propone(E) : []; ['mun', 'eu'].forEach(k => { if (Cm.activa(E, k)) o.push({ txt: `Acto de campaña (${AMB[k].n}).`, accion: 'campana_' + k, args: {} }); }); return o; }, hace: E => { const o = h && h.hace ? h.hace(E) : []; ['mun', 'eu'].forEach(k => { if (Cm.activa(E, k) && C.Jefe.capacidad(E) > 0) { const r = C.Jefe.gastarAgenda(E, [{ accion: 'campana_' + k, args: {}, txt: 'hace campaña ' + AMB[k].n }], C.Jefe.capacidad(E)); o.push(...r); } }); return o; } }; })());
})(window.ESP);

/* Declaración institucional de la disolución: escena del presidente ante el atril (con la imagen de IA que haya en data/imagenes.js)
   y selector del modo del anuncio (sorpresa o anunciada) cuando eres tú quien disuelve. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const ID = { disolver_cortes: 'ES', adelanto_autonomico: 'REG' };
  const escena = (E, ambito, o = {}) => C.Escenas ? C.Escenas.html(E, ambito === 'ES' ? 'declaracion_pm' : 'declaracion_aut', Object.assign({ region: ambito === 'ES' ? null : ambito }, o)) : '';

  const Dc = C.Pantallas.declaracion = {
    /* Modal con el anuncio de una disolución (el primero pendiente). */
    modal(E) {
      const Ds = C.Disolucion, d = Ds && Ds.consumir(E); if (!d) return;
      const ES = d.ambito === 'ES', M = Ds.MODOS[d.modo] || { ic: '📺', n: '' }, sem = Math.max(0, Math.round(d.fechaVoto - E.fecha.t));
      const cuerpo = `${escena(E, d.ambito, { leyenda: 'Declaración institucional · ' + U.fmtT(d.t, true) })}
        <h3 style="margin:12px 0 4px;font-size:16px">${esc(Ds.titular(d))}</h3>
        <p style="margin:6px 0 10px;font-size:13.5px;line-height:1.55">${esc(Ds.relato(d))}</p>
        <div class="fila" style="gap:8px;flex-wrap:wrap;margin-bottom:6px"><span class="etq oro">${M.ic} ${esc(M.n)}</span><span class="etq">🗳 ${ES ? 'Generales' : 'Autonómicas'} el ${U.fmtT(d.fechaVoto, true)}</span><span class="etq">${sem} semanas de campaña</span></div>
        ${d.efecto ? `<div class="tenue" style="font-size:12.5px">${esc(d.efecto)}</div>` : ''}`;
      const m = UI.modal({ titulo: '📺 Declaración institucional', cuerpo, clase: 'medio', pie: `<button class="btn" id="dc-ok">Entendido</button><button class="btn prim" id="dc-camp">🎯 Ir a la campaña</button>`, alCerrar: () => setTimeout(() => C.App.revisarPendientes(), 30) });
      const $ = s => UI.$(s, m.el);
      $('#dc-ok').onclick = () => m.cerrar();
      $('#dc-camp').onclick = () => { m.cerrar(); C.App.ir('elecciones', { tab: 'campana' }); };
    },

    /* ¿Hay que preguntar cómo se anuncia? Se llama desde UI.accion antes de ejecutar la acción. */
    interceptar(id, args) {
      if (!ID[id] || (args && args.modo)) return false;
      const E = C.E; if (!E || C.Acciones.puede(id, args) !== true) return false;
      Dc.elegir(E, id, args || {});
      return true;
    },
    elegir(E, id, args) {
      const Ds = C.Disolucion, ES = ID[id] === 'ES', J = E.jugador, ambito = ES ? 'ES' : J.region;
      const op = k => { const M = Ds.MODOS[k]; return `<button class="btn opcion" data-modo="${k}" style="justify-content:flex-start;text-align:left;white-space:normal;padding:12px 14px;gap:12px;align-items:flex-start"><span style="font-size:22px">${M.ic}</span><span><b>${esc(M.n)}</b><br><span class="tenue" style="font-size:12.5px">${esc(M.d)}</span></span></button>`; };
      const cuerpo = `${escena(E, ambito, { leyenda: ES ? 'Vas a comparecer en La Moncloa' : 'Vas a comparecer en la sede del Gobierno' })}
        <p style="margin:10px 0;font-size:13.5px">${ES ? 'Disolver las Cortes abre una campaña de ocho semanas.' : 'Disolver el Parlamento abre una campaña de siete semanas.'} ¿Cómo lo anuncias?</p><div class="col">${op('sorpresa')}${op('anunciada')}</div>`;
      const m = UI.modal({ titulo: ES ? '🗳 Disolver las Cortes' : '🗳 Disolver el Parlamento', cuerpo, clase: 'medio', pie: '<button class="btn" id="dc-no">Mejor no</button>' });
      UI.$('#dc-no', m.el).onclick = () => m.cerrar();
      m.cuerpo.addEventListener('click', e => { const b = e.target.closest('[data-modo]'); if (!b) return; m.cerrar(); UI.cerrarModales(); UI.accion(id, Object.assign({}, args, { modo: b.dataset.modo })); setTimeout(() => C.App.revisarPendientes(), 30); });
    }
  };
})(window.ESP);

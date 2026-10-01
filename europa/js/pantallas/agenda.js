/* Agenda: todas las acciones disponibles, agrupadas, con su coste en puntos. */
window.EUROPA = window.EUROPA || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const GRUPOS = [['parlamento', '🏛', 'Parlamento'], ['partido', '🎗', 'Partido'], ['medios', '📺', 'Medios'], ['campana', '📣', 'Campaña'], ['gobierno', '🦅', 'Gobierno'], ['europa', '🇪🇺', 'Europa']];
  const MODAL = { proponer_ley: 'leyes', cabildear_ley: 'leyes', cabildear_exp: 'exp', ponencia: 'exp', proponer_exp: 'tpl' };

  const A = C.Pantallas.agenda = {
    render(el) {
      const E = C.E, J = E.jugador;
      const bloque = ([k, ic, nom]) => {
        const as = C.Acciones.lista(k).filter(a => !(a.id === 'mitin' && !J.campania));
        if (!as.length) return '';
        return `<div class="tarjeta"><h3>${ic} ${nom}</h3><div class="col" style="gap:8px">${as.map(a => {
          const costo = typeof a.costo === 'function' ? a.costo(E, {}) : a.costo;
          const pu = C.Acciones.puede(a.id, {});
          const boton = MODAL[a.id] ? `<button class="btn chico ${pu === true ? '' : ''}" data-modal="${a.id}" ${pu === true ? '' : 'disabled'}${pu === true ? '' : UI.tt(esc(pu))}>${a.icono} Elegir… <span class="coste">${costo} ◆</span></button>` : UI.botonAccion(a.id, {}, a.icono + ' ' + a.nombre, 'chico');
          return `<div class="fila" style="justify-content:space-between;flex-wrap:nowrap;gap:10px"><div style="min-width:0"><b style="font-size:13.5px">${a.icono} ${esc(a.nombre)}</b><div class="tenue" style="font-size:12px">${esc(a.desc || '')}</div></div>${MODAL[a.id] ? boton : UI.botonAccion(a.id, {}, 'Hacer', 'chico')}</div>`;
        }).join('')}</div></div>`;
      };
      el.innerHTML = `<div class="cab"><div><h1>Agenda</h1><div class="sub">Tienes <b>${J.agenda.puntos}</b> de ${J.agenda.max} puntos de agenda esta semana · se renuevan al avanzar</div></div><div class="pips">${Array.from({ length: J.agenda.max }, (_, i) => `<span class="pip ${i < J.agenda.puntos ? 'lleno' : ''}" style="width:16px;height:16px"></span>`).join('')}</div></div>
        <div class="grid g-dash"><div class="col">${GRUPOS.map(bloque).join('')}</div>
        <div class="col"><div class="tarjeta"><h3>Hecho esta semana</h3>${J.agenda.hechas.length ? `<div class="lista" style="font-size:13px">${J.agenda.hechas.map(h => `<div class="it"><span>✔</span><span>${esc(h.txt)}</span></div>`).join('')}</div>` : '<div class="vacio" style="padding:12px">Nada todavía.</div>'}</div>
          <div class="tarjeta"><h3>Bitácora de carrera</h3><div class="lista" style="font-size:12.5px">${J.historial.slice(0, 10).map(h => `<div class="it"><span class="tenue" style="width:78px">${U.fmtT(h.t, true)}</span><span>${esc(h.txt)}</span></div>`).join('') || '<div class="vacio">Sin eventos</div>'}</div></div></div></div>`;
      UI.$$('[data-modal]', el).forEach(b => b.onclick = () => A.abrir(b.dataset.modal));
    },

    abrir(id) {
      const E = C.E;
      const k = MODAL[id];
      if (k === 'leyes') return C.App.ir('leyes', { tab: id === 'proponer_ley' ? 'proponer' : 'tramite' }), id === 'cabildear_ley' && UI.toast('Abre un proyecto y usa 👍 / 👎 en el grupo que quieras convencer.', '');
      if (k === 'exp') {
        const abiertos = C.UE.abiertos(E);
        const cuerpo = abiertos.length ? `<div class="lista">${abiertos.map(e => `<div class="it" style="align-items:flex-start"><div class="cuerpo"><b style="white-space:normal">${esc(e.t)}</b><span>${esc(e.tipo)} · ${e.may === 'unan' ? 'unanimidad' : 'mayoría cualificada'} · votación en ${Comp.semanasA(E, e.tVoto)}</span></div><div class="fila" style="flex-wrap:nowrap">${UI.botonAccion(id, { exp: e.id, lado: 'si' }, '👍 Apoyar', 'chico')}${UI.botonAccion(id, { exp: e.id, lado: 'no' }, '👎 Frenar', 'chico')}</div></div>`).join('')}</div>` : '<div class="vacio">No hay expedientes abiertos.</div>';
        UI.modal({ titulo: id === 'ponencia' ? 'Ponencia en la Eurocámara' : 'Cabildear un expediente europeo', icono: '🇪🇺', cuerpo, clase: 'medio' });
      } else if (k === 'tpl') {
        const J = E.jugador, sec = D().carteras[J.cartera] ? D().carteras[J.cartera][1] : null;
        const ab = C.UE.abiertos(E).map(x => x.tpl);
        const lista = D().expedientes.filter(x => x.tipo !== 'cumbre' && !ab.includes(x.id)).sort((a, b) => (b.s === sec) - (a.s === sec));
        UI.modal({ titulo: 'Proponer un texto a la Comisión', icono: '🇪🇺', clase: 'medio', cuerpo: `<div class="lista">${lista.map(x => `<div class="it"><div class="cuerpo"><b style="white-space:normal">${esc(x.t)} ${x.s === sec ? '<span class="etq oro">Tu cartera</span>' : ''}</b><span>${esc(x.d)}</span></div>${UI.botonAccion('proponer_exp', { tpl: x.id }, 'Proponer', 'chico')}</div>`).join('')}</div>` });
      }
    }
  };
  C.Bus.on('ui:accion', () => { if (UI.pila.length) UI.cerrarModales(); });
})(window.EUROPA);

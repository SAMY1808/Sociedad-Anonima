/* Crisis en directo: modal paso a paso (cronología por horas) y registro en la pestaña de Crisis. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const AMB = { nac: '🇪🇸 Nacional', aut: '🗺 Autonómica', mun: '🏘 Municipal' };
  const Pa = C.Pantallas.crisis2 = {
    modal(uid) {
      const E = C.E, Cv = C.CrisisDirecto, cv = Cv.asegurar(E), cr = cv.act.find(x => x.uid === uid); if (!cr) { E.esp.pendienteCrisisV = null; return; }
      const s = Cv.cat(cr.id), nom = Cv.nombreLugar(E, cr.a, cr.lugar), m = UI.modal({ titulo: `${s.ic} ${s.n}`, icono: '🚨', cuerpo: '', clase: 'medio', sinCerrar: true });
      const cabecera = () => `<div class="fila" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="etq">${AMB[cr.a]}</span><span class="etq">📍 ${esc(nom)}</span><span class="etq ${cr.sev === 3 ? 'rojo' : 'amar'}">Gravedad ${cr.sev}/3</span>${cr.jug && ((cr.a === 'nac' && E.paises.ES.gob.pm !== 'J') || (cr.a === 'aut' && E.jugador.cargo === 'consejero')) ? '<span class="etq oro">Te corresponde por tu cartera</span>' : ''}</div>`;
      const linea = () => `<div class="lista" style="font-size:12.5px;margin-bottom:8px">${cr.log.map(l => `<div class="it"><span class="etq">${esc(l.h)}</span><div class="cuerpo" style="flex:1;white-space:normal"><b>${esc(l.opc)}</b><div class="${l.cls === 'b' ? 'bien' : l.cls === 'x' ? 'mal' : 'tenue'}" style="font-size:12px">${esc(l.txt)}</div></div></div>`).join('')}</div>`;
      const pinta = () => {
        if (cr.paso >= s.pasos.length) { const r = Cv.cerrar(E, cr); return final(r); }
        const p = s.pasos[cr.paso];
        const esn = C.Escenas ? C.Escenas.paraCrisis(cr, s, p) : null; m.cuerpo.innerHTML = `${esn ? C.Escenas.html(E, esn, { compacta: true, leyenda: s.n + ' · ' + p[0] }) : ''}${cabecera()}${linea()}<div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>⏱ ${esc(p[0])}</h3><span class="etq">Paso ${cr.paso + 1}/${s.pasos.length}</span></div><p style="margin:4px 0 10px;font-size:14px">${esc(p[1].replace('{lugar}', nom))}</p><div class="lista">${p[4].map(o => `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px;white-space:normal"><b>${esc(o[1])}</b><div class="tenue" style="font-size:11.5px">${Cv.ARQ[o[0]][0]} ${Cv.ARQ[o[0]][1]}</div></div><button class="btn chico" data-k="${o[0]}">Decidir</button></div>`).join('')}</div></div><div class="fila" style="margin-top:8px;justify-content:flex-end"><button class="btn chico" id="cv-del">🧑‍💼 Delegar en el jefe de gabinete</button></div>`;
        UI.$$('[data-k]', m.cuerpo).forEach(b => b.onclick = () => { Cv.elegir(E, cr, b.dataset.k); pinta(); });
        UI.$('#cv-del', m.cuerpo).onclick = () => { const j = C.Jefe && C.Jefe.asegurar(E).jefe, pa = Math.min(0.8, 0.4 + ((j && j.gestion) || 5) / 25); const r = Cv.ia(E, cr, pa); final(r); };
      };
      const final = r => {
        const bien = r.V > 0.3, mal = r.V < -0.1;
        m.cuerpo.innerHTML = `${cabecera()}${linea()}<div class="nota" style="border-left:3px solid ${bien ? 'var(--si,#3bb273)' : mal ? 'var(--no,#d9534f)' : 'var(--oro)'}"><b>${bien ? '✔ Gestión elogiada' : mal ? '✖ Gestión fallida' : '◐ Gestión discutida'}</b><div style="margin-top:4px;font-size:13px">${r.vict ? r.vict + ' víctimas · ' : ''}${r.dano} millones de euros en daños · valoración ${Math.round((r.V + 1) * 50)}/100</div></div><div class="fila" style="margin-top:10px;justify-content:flex-end"><button class="btn prim" id="cv-ok">Continuar</button></div>`;
        UI.$('#cv-ok', m.cuerpo).onclick = () => { m.cerrar(); C.App.refrescar(); C.App.revisarPendientes(); };
      };
      pinta();
    },
    historialHTML(E) {
      const h = C.CrisisDirecto.asegurar(E).hist.slice(0, 10);
      return `<div class="tarjeta"><div class="t-cab"><h3>🎞 Crisis en directo</h3><span class="etq">${C.DATA.crisisDirecto.length} escenarios posibles</span></div><div class="lista">${h.map(c => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${c.ic}</span><div class="cuerpo" style="flex:1;min-width:200px;white-space:normal"><b>${esc(c.n)}</b> <span class="tenue" style="font-size:12px">· ${AMB[c.a]} · ${esc(c.lugar)} · ${U.fmtT(c.t, true)}</span></div><span class="etq ${c.V > 0.3 ? 'verde' : c.V < -0.1 ? 'rojo' : ''}">${c.jug ? 'Tú' : 'IA'} · ${Math.round((c.V + 1) * 50)}/100</span></div>`).join('') || '<div class="vacio" style="padding:10px">Aún no ha habido ninguna: pueden surgir a nivel nacional, autonómico o municipal.</div>'}</div></div>`;
    }
  };
  const r0 = C.Pantallas.crisis.render; C.Pantallas.crisis.render = function (el) { r0.apply(this, arguments); el.insertAdjacentHTML('beforeend', Pa.historialHTML(C.E)); };
})(window.ESP);

/* Gabinete: ministros, consejeros autonómicos y concejales de gobierno. Elegir a las personas es el centro del Gobierno. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, Gb = () => C.Gabinete;
  C.Pantallas = C.Pantallas || {};

  const EFTXT = { hac: 'Reduce (o dispara) el déficit', eco: 'Crecimiento y confianza', tra: 'Paro y salarios', amb: 'Inflación energética', ind: 'Crecimiento industrial', agr: 'Aprobación en el campo', tpt: 'Obra pública y crecimiento', sal: 'Aprobación (sanidad)', edu: 'Aprobación y capital humano', int: 'Seguridad y orden público', jus: 'Imagen institucional', viv: 'Aprobación (vivienda)', inc: 'Pensiones y empleo', dso: 'Aprobación social', cie: 'Innovación', dig: 'Productividad', igu: 'Imagen', cul: 'Imagen cultural', jov: 'Imagen juvenil', def: 'Defensa', pre: 'Autoridad, estabilidad y relación con las Cortes', ext: 'Relación con la UE', ter: 'Relación con las comunidades y negociación de competencias', def2: '' };
  const barra = (v, col) => `<div class="barra-h" style="height:6px"><i style="width:${U.clamp(v, 0, 100)}%;background:${col}"></i></div>`;
  const colR = r => r >= 66 ? 'var(--bien)' : r >= 45 ? 'var(--alerta)' : 'var(--mal)';

  const titulo = (E, key) => key === 'central' ? 'Gobierno de España' : key.startsWith('aut:') ? 'Gobierno de ' + D().ccaa[key.slice(4)].nombre : 'Gobierno municipal de ' + E.esp.muni.m[key.slice(5)].nombre;

  /* ¿Puede el jugador cambiar este cargo? */
  const editable = (E, key, cid) => {
    const J = E.jugador;
    if (key === 'central') { const g = E.paises.ES.gob; if (g.pm === 'J') return true; if (J.rol === 'lider' && g.coalicion.includes(J.partido)) { const p = Gb().persona(E, key, cid); return !!p && p.p === J.partido; } return false; }
    if (key.startsWith('aut:')) { const rc = E.esp.ccaa[key.slice(4)]; return !!rc.gob && rc.gob.pres === 'J'; }
    const m = E.esp.muni.m[key.slice(5)]; return m.pm === 'J';
  };

  const fichaTT = (E, key, c, per) => {
    const r = Gb().rend(E, c, per);
    return `<div class="tt-t">${esc(per.n)}</div><div class="tt-f"><span>Perfil</span><b>${esc(Gb().PERFIL[per.perfil] || '—')}</b></div><div class="tt-f"><span>Especialidad</span><b>${esc((per.esp || []).map(x => Gb().NOM_ESP[x]).join(', '))}</b></div><div class="tt-f"><span>Gestión</span><b>${per.gest}</b></div><div class="tt-f"><span>Carisma</span><b>${Gb().car(per)}</b></div><div class="tt-f"><span>Integridad</span><b>${Gb().integ(per)}</b></div><div class="tt-f"><span>Lealtad al presidente</span><b>${per.lealt}</b></div><div class="tt-f"><span>Ambición</span><b>${per.amb != null ? per.amb : per.a}</b></div><div class="tt-f"><span>Rendimiento en el cargo</span><b>${r}</b></div>${per.esc ? `<div class="tt-f"><span>Escándalos</span><b class="mal">${per.esc}</b></div>` : ''}`;
  };

  const Gx = C.Pantallas.gabinete = {
    render(el, params) {
      const E = C.E, J = E.jugador;
      const keys = ['central']; if (J.region) keys.push('aut:' + J.region); if (J.muni) keys.push('muni:' + J.muni);
      let key = (params && params.key) || E.ui.keyGab || 'central'; E.ui.keyGab = key;
      const regs = C.Territorio.ids();
      const cargos = Gb().cargos(E, key), g = Gb().gobierno(E, key), coal = Gb().coalicion(E, key);
      const cuotas = Gb().cuotas(E, key), media = Gb().mediaRend(E, key);
      const puede = cargos.some(c => editable(E, key, c.id));
      const nombre = k => k === 'central' ? '🇪🇸 España' : k.startsWith('aut:') ? '🗺 ' + D().ccaa[k.slice(4)].nombre : '🏘 ' + E.esp.muni.m[k.slice(5)].nombre;
      const tarjeta = c => {
        const per = Gb().persona(E, key, c.id); const r = Gb().rend(E, c, per);
        const pa = per && E.partidos[per.p];
        const efx = key === 'central' ? EFTXT[c.id] : '';
        return `<div class="tarjeta" ${per ? UI.tt(fichaTT(E, key, c, per)) : ''} style="${per && per.id === 'J' ? 'border-color:var(--oro)' : ''}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap;gap:8px"><div style="min-width:0"><div class="tenue" style="font-size:11.5px">${c.icono} ${esc(c.nombre)}${c.vp ? ` <span class="etq oro">VP ${c.vp}</span>` : ''}</div>
          <b style="font-size:15px">${per ? esc(per.n) : '—'}${per && per.id === 'J' ? ' <span class="etq oro">Tú</span>' : ''}</b>
          <div class="tenue" style="font-size:12px">${pa ? `<i class="pto" style="background:${pa.color}"></i> ${esc(pa.sigla)}` : ''} · ${per ? esc(Gb().PERFIL[per.perfil] || '') : ''}${per && per.esc ? ` · <span class="mal">${per.esc} escándalo(s)</span>` : ''}</div></div>
          <div style="text-align:right;min-width:52px"><div class="num" style="font-size:22px;color:${colR(r)}">${r}</div><div class="tenue" style="font-size:10.5px">RENDIM.</div></div></div>
          ${per ? `<div style="margin-top:6px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:10.5px;color:var(--tenue)"><div>Gestión${barra(per.gest, '#6CC4F5')}</div><div>Carisma${barra(Gb().car(per), '#E0B54A')}</div><div>Integr.${barra(Gb().integ(per), '#3FAF6E')}</div><div>Lealtad${barra(per.lealt, '#B48CE0')}</div></div>` : ''}
          ${efx ? `<div class="tenue" style="font-size:11.5px;margin-top:6px">${esc(efx)}</div>` : ''}
          ${editable(E, key, c.id) ? `<div class="fila" style="margin-top:8px"><button class="btn chico" data-cambiar="${c.id}">🔁 Cambiar</button></div>` : ''}</div>`;
      };
      el.innerHTML = `<div class="cab"><div><h1>🧑‍💼 Gabinete</h1><div class="sub">${esc(titulo(E, key))} · rendimiento medio del equipo <b style="color:${colR(media)}">${Math.round(media)}</b>${puede ? ' · <span class="oro">tú eliges a los titulares</span>' : ''}</div></div></div>
        <div class="tabs">${keys.map(k => `<button data-key="${k}" class="${key === k ? 'activo' : ''}">${nombre(k)}</button>`).join('')}<select id="gx-otra" style="margin-left:auto"><option value="">Ver otra comunidad…</option>${regs.map(c => `<option value="aut:${c}" ${key === 'aut:' + c ? 'selected' : ''}>${esc(D().ccaa[c].nombre)}</option>`).join('')}</select></div>
        <div class="grid g-dash"><div class="sel-grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr));align-content:start">${cargos.map(tarjeta).join('')}</div>
          <div class="col"><div class="tarjeta"><h3>Reparto entre socios</h3>${coal.length > 1 || cuotas.length > 1 ? G.barrasH(cuotas.map(q => ({ etq: Comp.partido(E, q.pid), v: q.tiene, color: E.partidos[q.pid].color, tt: `Le corresponde ${U.d1(q.derecho)} puntos de peso; tiene ${U.d1(q.tiene)} (${Math.round(q.ratio * 100)} %)` })), { max: Math.max(...cuotas.map(q => Math.max(q.tiene, q.derecho))) * 1.1, fmt: v => U.d1(v), anchoEtq: '70px' }) + `<div class="lista" style="font-size:12.5px;margin-top:8px">${cuotas.map(q => `<div class="it">${Comp.partido(E, q.pid)}<span class="tenue" style="margin-left:auto">${q.escanos} esc. · <b class="${q.ratio < 0.6 ? 'mal' : q.ratio < 0.85 ? 'alerta' : 'bien'}">${Math.round(q.ratio * 100)} %</b> de su cuota</span></div>`).join('')}</div><p class="tenue" style="font-size:12px;margin:8px 0 0">El peso de cada cartera cuenta (Hacienda o Sanidad valen mucho más que Juventud). Un socio con menos de lo que le corresponde pierde satisfacción y puede romper.</p>` : '<div class="vacio">Gobierno de un solo partido.</div>'}</div>
          <div class="tarjeta"><h3>Cómo funciona</h3><ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--texto2);line-height:1.55"><li>Cada titular tiene <b>gestión, carisma, integridad, lealtad</b> y una <b>especialidad</b>; el rendimiento sube si encaja con la cartera.</li><li>Los ministros mueven la economía, la aprobación, la relación con las comunidades y la UE.</li><li>Los de baja integridad provocan <b>escándalos</b>; los ambiciosos y poco leales, <b>choques</b> y dimisiones.</li><li>Los consejeros mueven la gestión de cada área autonómica; los concejales, los indicadores de la ciudad.</li></ul></div></div></div>`;
      UI.$$('[data-key]', el).forEach(b => b.onclick = () => C.App.ir('gabinete', { key: b.dataset.key }));
      const so = UI.$('#gx-otra', el); if (so) so.onchange = () => { if (so.value) C.App.ir('gabinete', { key: so.value }); };
      UI.$$('[data-cambiar]', el).forEach(b => b.onclick = () => Gx.cambiar(key, b.dataset.cambiar, () => C.App.refrescar()));
    },

    /* Elegir sustituto de un cargo. */
    cambiar(key, cid, alTerminar, opciones = {}) {
      const E = C.E, cargo = Gb().cargos(E, key).find(x => x.id === cid), actual = Gb().persona(E, key, cid);
      const cands = Gb().pool(E, key, cid, opciones.partido, opciones.refrescar).filter(x => !(actual && x.per === actual && !x.actual));
      const rA = actual ? Gb().rend(E, cargo, actual) : 0;
      const J = E.jugador;
      const card = (x, i) => {
        const per = x.per, r = Gb().rend(E, cargo, per), coin = (per.esp || []).includes(cargo.esp), pa = E.partidos[per.p];
        const same = actual && per === actual;
        return `<div class="tarjeta" style="${same ? 'opacity:.8' : ''}"><div class="fila" style="justify-content:space-between;flex-wrap:nowrap"><div><b>${esc(per.n)}</b> ${same ? '<span class="etq">Actual</span>' : ''}<div class="tenue" style="font-size:12px">${pa ? `<i class="pto" style="background:${pa.color}"></i> ${esc(pa.sigla)}` : ''} · ${esc(Gb().PERFIL[per.perfil] || '')}${per.perfil === 'independiente' ? ' (cuota de ' + esc(pa ? pa.sigla : '') + ')' : ''}</div></div>
          <div style="text-align:right"><div class="num" style="font-size:22px;color:${colR(r)}">${r}</div><div class="tenue" style="font-size:10.5px">${actual && !same ? (r - rA >= 0 ? '+' : '') + (r - rA) + ' vs actual' : 'RENDIM.'}</div></div></div>
          <div class="chips" style="margin:6px 0">${(per.esp || []).map(s => `<span class="etq ${s === cargo.esp ? 'verde' : ''}">${esc(Gb().NOM_ESP[s])}</span>`).join('')}${coin ? '' : '<span class="etq rojo">Fuera de su campo</span>'}</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:10.5px;color:var(--tenue)"><div>Gestión${barra(per.gest, '#6CC4F5')}</div><div>Carisma${barra(Gb().car(per), '#E0B54A')}</div><div>Integr.${barra(Gb().integ(per), '#3FAF6E')}</div><div>Lealtad${barra(per.lealt, '#B48CE0')}</div></div>
          ${same ? '' : `<div class="fila" style="margin-top:8px"><button class="btn chico prim" data-nom="${i}">Nombrar</button></div>`}</div>`;
      };
      const cuerpo = `<p class="tenue" style="margin-top:0;font-size:13px">Cargo: <b>${cargo.icono} ${esc(cargo.nombre)}</b> · especialidad deseable: <b>${esc(Gb().NOM_ESP[cargo.esp])}</b>${key === 'central' ? ' · ' + esc(EFTXT[cargo.id] || '') : ''}. Si cambias a alguien de un socio por otro partido, su satisfacción cae.</p><div class="sel-grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr))">${cands.map(card).join('')}</div>`;
      const m = UI.modal({ titulo: `Nombrar · ${cargo.nombre}`, icono: cargo.icono, cuerpo, clase: 'medio', pie: '<button class="btn" id="gx-ref">🎲 Ver otros candidatos</button>' });
      UI.$$('[data-nom]', m.el).forEach(b => b.onclick = () => {
        const x = cands[+b.dataset.nom]; const res = Gb().nombrar(E, key, cid, x);
        if (key === 'central') { E.esp.consejo.autoridad = U.clamp(E.esp.consejo.autoridad - 1.5, 10, 100); }
        C.Noticias.poner(E, 'gobierno', `${res.per.n} es nombrado/a ${key === 'central' ? 'ministro/a de ' : key.startsWith('aut:') ? 'consejero/a de ' : 'concejal/a de '}${cargo.nombre}.`, 'ES');
        UI.toast(`${esc(res.per.n)} es nombrado/a ${esc(cargo.nombre)}`, 'bien'); m.cerrar(); if (alTerminar) alTerminar();
      });
      UI.$('#gx-ref', m.el).onclick = () => { m.cerrar(); Gx.cambiar(key, cid, alTerminar, Object.assign({}, opciones, { refrescar: true })); };
    },

    /* Formación del gabinete tras una investidura (bloquea el tiempo). */
    formacion(pend) {
      const E = C.E, key = pend.key, J = E.jugador, cargos = Gb().cargos(E, key);
      const cerrar = () => { Gb().confirmar(E, key); E.esp.pendienteGabinete = null; };
      const m = UI.modal({ titulo: '🧑‍💼 Forma tu Gobierno · ' + titulo(E, key), cuerpo: '', clase: 'medio', sinCerrar: true, pie: '<button class="btn prim" id="gf-ok">✔ Aceptar el Gobierno</button>' });
      const pintar = () => {
        const cuotas = Gb().cuotas(E, key), media = Gb().mediaRend(E, key);
        m.cuerpo.innerHTML = `<p style="margin-top:0;font-size:13.5px">${key === 'central' ? 'Has sido investido/a. ' : ''}Elige a quién nombras en cada cartera. ${pend.solo ? 'Como líder de un socio, sólo decides las carteras de <b>tu partido</b>.' : 'Reparte con cuidado: los socios pesan y exigen cuota.'} Equipo: rendimiento medio <b style="color:${colR(media)}">${Math.round(media)}</b>.</p>
          <div class="fila" style="gap:10px;margin-bottom:8px">${cuotas.map(q => `<span class="etq ${q.ratio < 0.6 ? 'rojo' : q.ratio < 0.85 ? 'amar' : 'verde'}">${esc(E.partidos[q.pid].sigla)} ${Math.round(q.ratio * 100)} % de su cuota</span>`).join('')}</div>
          <table class="tabla apila" style="font-size:12.5px"><thead><tr><th>Cartera</th><th>Titular</th><th>Partido</th><th class="num">Rend.</th><th></th></tr></thead><tbody>${cargos.map(c => { const per = Gb().persona(E, key, c.id), r = Gb().rend(E, c, per), pa = per && E.partidos[per.p], ed = editable(E, key, c.id); return `<tr><td>${c.icono} ${esc(c.nombre)}</td><td><span ${per ? UI.tt(fichaTT(E, key, c, per)) : ''}>${per ? esc(per.n) : '—'}${per && per.id === 'J' ? ' (tú)' : ''}</span></td><td>${pa ? Comp.partido(E, per.p) : ''}</td><td class="num" style="color:${colR(r)}"><b>${r}</b></td><td>${ed && !(per && per.id === 'J') ? `<button class="btn chico" data-c="${c.id}">Cambiar</button>` : ''}</td></tr>`; }).join('')}</tbody></table>`;
        UI.$$('[data-c]', m.cuerpo).forEach(b => b.onclick = () => Gx.cambiar(key, b.dataset.c, pintar));
      };
      pintar();
      UI.$('#gf-ok', m.el).onclick = () => {
        const res = Gb().confirmar(E, key); E.esp.pendienteGabinete = null; m.cerrar();
        res.avisos.forEach(a => UI.toast(esc(a), 'mal'));
        UI.toast('Gobierno constituido', 'bien'); C.App.refrescar(); C.App.revisarPendientes();
      };
    },

    /* Escándalo de un ministro (decide el presidente jugador). */
    escandalo(esc_) {
      const E = C.E, key = 'central', cargo = Gb().cargos(E, key).find(x => x.id === esc_.cid), per = Gb().persona(E, key, esc_.cid);
      if (!per || per.id === 'J') { E.esp.gab.escandalo = null; return C.App.revisarPendientes(); }
      const g = E.paises.ES.gob;
      const cuerpo = `<p style="margin-top:0;font-size:14px"><b>${esc(per.n)}</b> (${esc(E.partidos[per.p].sigla)}), ministro/a de ${esc(cargo.nombre)}, está en el centro de un escándalo. La oposición exige su cabeza y la prensa no le da tregua.</p>
        <div class="chips" style="margin-bottom:10px"><span class="etq">Integridad ${Gb().integ(per)}</span><span class="etq">Lealtad ${per.lealt}</span><span class="etq">Rendimiento ${Gb().rend(E, cargo, per)}</span><span class="etq ${per.esc >= 2 ? 'rojo' : 'amar'}">${per.esc} escándalo(s)</span></div>
        <div class="col"><button class="btn opcion" data-o="cesar" style="text-align:left;white-space:normal;padding:12px 14px"><b>Cesarlo/a y elegir sustituto</b><br><span class="tenue" style="font-size:12px">Atajas el daño (+aprobación) pero ${esc(E.partidos[per.p].sigla)} se resiente si es de un socio.</span></button>
        <button class="btn opcion" data-o="respaldar" style="text-align:left;white-space:normal;padding:12px 14px"><b>Respaldarlo/a</b><br><span class="tenue" style="font-size:12px">Gana lealtad y cierra filas, pero el desgaste del Gobierno aumenta.</span></button>
        <button class="btn opcion" data-o="esperar" style="text-align:left;white-space:normal;padding:12px 14px"><b>Esperar a que escampe</b><br><span class="tenue" style="font-size:12px">Puede pasar... o empeorar.</span></button></div>`;
      const m = UI.modal({ titulo: '🔥 Escándalo en el Gobierno', cuerpo, clase: 'medio', sinCerrar: true });
      UI.$$('[data-o]', m.el).forEach(b => b.onclick = () => {
        const o = b.dataset.o; E.esp.gab.escandalo = null; m.cerrar();
        if (o === 'cesar') { g.aprob = U.clamp(g.aprob + 1.2, 5, 90); if (g.coalicion.includes(per.p) && per.p !== g.partido) Gb().satCambio(E, per.p, -5); Gx.cambiar(key, esc_.cid, () => { C.App.refrescar(); C.App.revisarPendientes(); }); return; }
        if (o === 'respaldar') { per.lealt = Math.min(99, per.lealt + 10); g.aprob = U.clamp(g.aprob - 0.8, 5, 90); if (per.p !== g.partido) Gb().satCambio(E, per.p, 4); UI.toast('Respaldas a tu ministro/a', ''); }
        else { if (U.chance(0.5)) { g.aprob = U.clamp(g.aprob - 0.4, 5, 90); UI.toast('La polémica se apaga sola', 'bien'); } else { g.aprob = U.clamp(g.aprob - 1.6, 5, 90); g.estab = U.clamp(g.estab - 2, 0, 100); per.esc++; UI.toast('La polémica se agrava', 'mal'); } }
        C.App.refrescar(); C.App.revisarPendientes();
      });
    }
  };
})(window.ESP);

/* Noches electorales en directo (2): jornada autonómica y municipal (región a región y ciudad a ciudad) y noche europea (país a país).
   Envuelven Elecciones.nocheLocales y Europa.nochePE: al terminar la retransmisión se muestra el resumen clásico. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, G = C.Graf, Comp = C.Comp, H = C.Hemiciclo, clamp = U.clamp;
  C.Pantallas = C.Pantallas || {};
  const PASOS = 7, HORAS = ['20:00', '20:30', '21:00', '21:30', '22:00', '23:00', '00:00'];
  /* Motor común: pasos temporizados con ticker, decisión opcional y botón de saltar. */
  function retransmision(o) {
    const m = UI.modal({ titulo: o.titulo, cuerpo: `<div class="boletin"><span id="nv-hora">🕗 Cierre de urnas</span><span id="nv-bol"></span></div><div class="barra-h" style="height:6px;margin-bottom:10px"><i id="nv-prog" style="width:0;background:var(--oro)"></i></div>${o.cuerpo}<div id="nv-tele" style="margin-top:10px"></div><div id="nv-dec"></div>`, clase: 'noche', sinCerrar: true, pie: '<button class="btn" id="nv-saltar">Saltar ⏭</button><button class="btn prim" id="nv-ok" disabled>Continuar</button>' });
    const $ = s => UI.$(s, m.el), tele = []; let paso = 0, timer = null, esperando = false, fin = false;
    const push = (t, tipo) => { tele.unshift({ t, tipo }); if (tele.length > 5) tele.length = 5; $('#nv-tele').innerHTML = `<div class="lista" style="font-size:12.5px">${tele.map((x, i) => `<div class="it" style="${i === 0 ? 'font-weight:600' : 'opacity:.75'}"><span class="etq ${x.tipo === 'alerta' ? 'rojo' : x.tipo === 'ok' ? 'verde' : ''}">${x.tipo === 'ok' ? 'Tú' : 'En directo'}</span><span style="margin-left:8px;white-space:normal">${esc(x.t)}</span></div>`).join('')}</div>`; };
    const decision = (titulo, texto, ops, cont) => { esperando = true; clearInterval(timer); $('#nv-dec').innerHTML = `<div class="tarjeta" style="border-color:var(--oro);margin-top:10px"><h3>${titulo}</h3><p style="margin:4px 0 8px;font-size:13.5px">${texto}</p><div class="fila" style="gap:6px;flex-wrap:wrap">${ops.map((x, i) => `<button class="btn chico" data-op="${i}" title="${esc(x.d)}">${esc(x.t)}</button>`).join('')}</div></div>`; UI.$$('[data-op]', m.el).forEach(b => b.onclick = () => { const x = ops[+b.dataset.op]; try { x.ef(); } catch (e) { console.error(e); } $('#nv-dec').innerHTML = ''; esperando = false; push(x.msg, 'ok'); cont(); }); };
    const finalizar = () => { if (fin) return; fin = true; clearInterval(timer); $('#nv-dec').innerHTML = ''; $('#nv-hora').textContent = '🕛 Escrutinio al 100 %'; $('#nv-prog').style.width = '100%'; o.fin(push, $, decision, () => { $('#nv-ok').disabled = false; $('#nv-saltar').disabled = true; }); };
    const avanza = () => { if (esperando || fin) return; paso++; if (paso >= PASOS - 1) return finalizar(); $('#nv-hora').textContent = '🕗 ' + HORAS[paso]; $('#nv-prog').style.width = Math.round(paso / (PASOS - 1) * 100) + '%'; o.paso(paso / (PASOS - 1), paso, push, $, decision); if (!esperando) { clearInterval(timer); timer = setInterval(avanza, 1600); } };
    o.paso(0, 0, push, $, decision); push(o.apertura, 'alerta'); timer = setInterval(avanza, 1600);
    $('#nv-saltar').onclick = () => { if (!fin) { esperando = false; finalizar(); } };
    $('#nv-ok').onclick = () => { m.cerrar(); o.alCerrar(); };
    return m;
  }

  /* ── Jornada autonómica y municipal ── */
  const prevLocales = C.Pantallas.elecciones.nocheLocales;
  C.Pantallas.elecciones.nocheLocales = function (n) {
    const E = C.E, J = E.jugador, aut = (n.aut || []).slice().sort((a, b) => U.suma(Object.values(a.escanos)) - U.suma(Object.values(b.escanos))), mun = n.mun, ciud = (mun && mun.ciudades || []).slice(0, 10), self = this;
    if (!aut.length && !ciud.length) return prevLocales.call(this, n);
    const gan = a => Object.keys(a.votos).sort((x, y) => a.votos[y] - a.votos[x])[0], alc = mun ? (mun.alcRes || mun.alc || {}) : {}, claves = Object.keys(alc).sort((a, b) => alc[b] - alc[a]).slice(0, 7);
    const cuerpo = `<div class="grid g2" style="align-items:start"><div><h4 style="margin:0 0 6px">🗺 Comunidades</h4><div id="nv-reg" class="lista" style="font-size:12.5px"></div></div><div><h4 style="margin:0 0 6px">🏘 Alcaldías (proyección)</h4><div id="nv-alc"></div><h4 style="margin:10px 0 6px">🏙 Grandes ciudades</h4><div id="nv-ciu" class="lista" style="font-size:12.5px"></div></div></div>`;
    retransmision({
      titulo: '🗳 Noche electoral · autonómicas y municipales', cuerpo, apertura: `Se cierran las urnas en ${aut.length} comunidad(es)${mun ? ' y en toda España para las municipales' : ''}.`,
      paso(f, i, push, $, decision) {
        const nr = Math.ceil(aut.length * f), nc = Math.ceil(ciud.length * f);
        $('#nv-reg').innerHTML = aut.slice(0, nr).map(a => { const k = gan(a), tot = U.suma(Object.values(a.escanos)), may = Math.floor(tot / 2) + 1, ok = (a.escanos[k] || 0) >= may; return `<div class="it"><b style="width:130px">${esc(D().ccaa[a.c].nombre)}</b>${Comp.partido(E, k)}<span class="tenue" style="margin-left:6px">${U.d1(a.votos[k])} % · ${a.escanos[k] || 0} esc.${ok ? ' · absoluta' : ''}</span></div>`; }).join('') || '<div class="vacio" style="padding:8px">Primeros datos en breve…</div>';
        if (mun) $('#nv-alc').innerHTML = G.barrasH(claves.map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: (alc[k] || 0) * (f ? Math.min(1, f * 1.05) * (1 + Math.sin(i * 2 + k.length) * 0.05 * (1 - f)) : 0), color: k === 'IND' ? '#888' : E.partidos[k].color })), { max: Math.max(...claves.map(k => alc[k])) * 1.15, fmt: v => U.n(Math.round(v)), anchoEtq: '70px' });
        $('#nv-ciu').innerHTML = ciud.slice(0, nc).map(c => `<div class="it"><b style="width:130px">${esc(c.nombre)}</b>${Comp.partido(E, c.alcalde)}<span class="tenue" style="margin-left:6px">${c.coal && c.coal.length > 1 ? 'con pacto' : 'mayoría'}</span></div>`).join('');
        if (nr > 0 && nr !== (this._nr || 0)) { const a = aut[nr - 1], k = gan(a); push(`${D().ccaa[a.c].nombre}: ${E.partidos[k].sigla} gana con el ${U.d1(a.votos[k])} %.`, 'normal'); }
        this._nr = nr;
        if (i === 3 && J && J.pais === 'ES') decision('📺 Valoración de la noche', 'Los micrófonos te esperan para valorar los resultados de toda España.', [
          { t: 'Hablar de victoria', d: 'Cierras filas aunque no sea para tanto.', msg: 'Declaras que tu partido sale reforzado.', ef: () => { const pa = E.partidos[J.partido]; pa.cohesion = clamp(pa.cohesion + 1, 15, 99); C.Personaje.cambiar(E, { pop: 0.4 }, true); } },
          { t: 'Pedir cambio de ciclo', d: 'Subes el tono contra el Gobierno.', msg: 'Pides un cambio de ciclo político.', ef: () => { C.Personaje.cambiar(E, { prestigio: 0.4 }, true); if (C.Nemesis) C.Nemesis.subir(E, 2); } },
          { t: 'Pedir responsabilidad', d: 'Imagen institucional.', msg: 'Llamas a la responsabilidad y al diálogo.', ef: () => C.Personaje.cambiar(E, { prestigio: 0.8 }, true) }], () => { });
      },
      fin(push, $, decision, listo) {
        $('#nv-reg').innerHTML = aut.map(a => { const k = gan(a); return `<div class="it"><b style="width:130px">${esc(D().ccaa[a.c].nombre)}</b>${Comp.partido(E, k)}<span class="tenue" style="margin-left:6px">${U.d1(a.votos[k])} %</span></div>`; }).join('');
        if (mun) $('#nv-alc').innerHTML = G.barrasH(claves.map(k => ({ etq: k === 'IND' ? 'Indep.' : Comp.partido(E, k), v: alc[k] || 0, color: k === 'IND' ? '#888' : E.partidos[k].color })), { max: Math.max(...claves.map(k => alc[k])) * 1.15, fmt: v => U.n(Math.round(v)), anchoEtq: '70px' });
        $('#nv-ciu').innerHTML = ciud.map(c => `<div class="it"><b style="width:130px">${esc(c.nombre)}</b>${Comp.partido(E, c.alcalde)}</div>`).join('');
        push('Escrutinio terminado: estos son los resultados definitivos.', 'alerta'); listo();
      },
      alCerrar() { prevLocales.call(self, n); }
    });
  };

  /* ── Noche europea ── */
  const prevPE = C.Pantallas.europa.nochePE;
  C.Pantallas.europa.nochePE = function (n) {
    const E = C.E, pe = E.ue.pe, G_ = D().grupos, self = this;
    if (!pe || !pe.porPais) return prevPE.call(this, n);
    const paises = Object.keys(pe.porPais).sort((a, b) => (D().paises[a] ? D().paises[a].meps || 0 : 0) - (D().paises[b] ? D().paises[b].meps || 0 : 0));
    const sumaGrupos = lista => { const r = {}; lista.forEach(c => { for (const pid in pe.porPais[c]) { const g = E.partidos[pid] && E.partidos[pid].grupo; if (g) r[g] = (r[g] || 0) + pe.porPais[c][pid]; } }); return r; };
    const blq = esc_ => D().ordenGrupos.filter(k => esc_[k] > 0).map(k => ({ n: esc_[k], color: G_[k].color, tt: `<div class="tt-t">${esc(G_[k].nombre)}</div><div class="tt-f"><span>Escaños</span><b>${esc_[k]}</b></div>` }));
    const cuerpo = `<div class="grid g2" style="align-items:start"><div id="nv-hemi"></div><div><h4 style="margin:0 0 6px">🌍 Países escrutados</h4><div id="nv-pais" class="tenue" style="font-size:12.5px;line-height:1.6"></div><div id="nv-proy" style="margin-top:10px;font-size:13px"></div></div></div>`;
    const pinta = (f, final) => {
      const nr = final ? paises.length : Math.round(paises.length * f), rev = paises.slice(0, nr), s = sumaGrupos(rev), proy = {}, tot = U.suma(Object.values(n.despues || {})) || 720;
      D().ordenGrupos.forEach(k => { proy[k] = final ? (n.despues[k] || 0) : (s[k] || 0) + (n.antes[k] || 0) * (1 - nr / paises.length); });
      const r = {}; let t = 0; D().ordenGrupos.forEach(k => { r[k] = Math.round(proy[k]); t += r[k]; }); const mx = D().ordenGrupos.slice().sort((a, b) => r[b] - r[a])[0]; r[mx] += tot - t;
      return { nr, rev, r };
    };
    retransmision({
      titulo: '🇪🇺 Noche electoral europea', cuerpo, apertura: 'Cierran los colegios en los Veintisiete: las primeras proyecciones llegan desde los países pequeños.',
      paso(f, i, push, $, decision) {
        const { nr, rev, r } = pinta(f, false);
        $('#nv-pais').innerHTML = rev.map(c => `<span class="etq">${esc((D().paises[c] && D().paises[c].nombre) || c)}</span>`).join(' ') || 'Sin datos aún…';
        $('#nv-hemi').innerHTML = H.bloques(blq(r), { altoMax: 220, centroSub: i ? 'PROYECCIÓN' : 'SONDEO' });
        const top = D().ordenGrupos.slice().sort((a, b) => r[b] - r[a]).slice(0, 4); $('#nv-proy').innerHTML = top.map(k => `<b>${k}</b> ${r[k]}`).join(' · ');
        if (nr > (this._n || 0) && rev.length) { const c = rev[rev.length - 1], g = sumaGrupos([c]), k = Object.keys(g).sort((a, b) => g[b] - g[a])[0]; if (k) push(`${(D().paises[c] && D().paises[c].nombre) || c}: ${k} es la fuerza más votada.`, 'normal'); } this._n = nr;
        const J = E.jugador; if (i === 3 && J && J.pais !== 'ES' || (i === 3 && J)) decision('📺 Declaraciones', 'Te piden una valoración de la noche europea.', [
          { t: 'Defender el europeísmo', d: 'Imagen de Estado.', msg: 'Defiendes más Europa.', ef: () => C.Personaje.cambiar(E, { prestigio: 0.7 }, true) },
          { t: 'Pedir un giro en Bruselas', d: 'Mensaje para tus bases.', msg: 'Pides un cambio de rumbo en la UE.', ef: () => { const pa = E.partidos[J.partido]; if (pa) pa.cohesion = clamp(pa.cohesion + 0.8, 15, 99); } }], () => { });
      },
      fin(push, $, decision, listo) { const { r } = pinta(1, true); $('#nv-pais').innerHTML = paises.map(c => `<span class="etq">${esc((D().paises[c] && D().paises[c].nombre) || c)}</span>`).join(' '); $('#nv-hemi').innerHTML = H.bloques(blq(r), { altoMax: 240, centroSub: 'ESCAÑOS' }); $('#nv-proy').innerHTML = D().ordenGrupos.slice().sort((a, b) => r[b] - r[a]).slice(0, 4).map(k => `<b>${k}</b> ${r[k]}`).join(' · '); push('Escrutinio terminado en toda la Unión.', 'alerta'); listo(); },
      alCerrar() { prevPE.call(self, n); }
    });
  };
})(window.ESP);

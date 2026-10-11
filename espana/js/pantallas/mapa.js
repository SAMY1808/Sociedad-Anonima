/* Mapa: el mapa de España como centro del juego. Capas de datos, selección de comunidad, provincia o ciudad, panel con estadísticas y acciones sobre el territorio,
   zoom y desplazamiento. Pantalla «Mapa», pestaña Territorio → Mapa y tarjeta del Centro de mando. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, D = () => C.DATA, Comp = C.Comp;
  C.Pantallas = C.Pantallas || {};
  const CORTO = { AND: 'Andalucía', ARA: 'Aragón', AST: 'Asturias', BAL: 'Baleares', CAN: 'Canarias', CNT: 'Cantabria', CLM: 'Castilla-La Mancha', CYL: 'Castilla y León', CAT: 'Cataluña', VAL: 'C. Valenciana', EXT: 'Extremadura', GAL: 'Galicia', MAD: 'Madrid', MUR: 'Murcia', NAV: 'Navarra', PVA: 'País Vasco', RIO: 'La Rioja', CEU: 'Ceuta', MEL: 'Melilla' };
  const ESCONDE = /^Sólo|^Necesitas|^Debes|^Tu partido no|^Sin gobierno|^Ya |^No hay|^Eres |^Ese |^No puedes|^No se /;
  const ccaaDe = p => D().provincias[p][1];
  const bn = c => C.Banderas ? C.Banderas.mini(c, 14) : '';
  const hoy = E => E.fecha.t, f1 = n => Math.round(n * 10) / 10;
  let activo = null;   // controlador del mapa montado (no se guarda en E: E.ui se serializa)

  /* Estado del mapa guardado en E.ui para que sobreviva a los refrescos de pantalla. */
  const estado = E => { const u = E.ui = E.ui || {}; if (!u.mapa) u.mapa = { capa: null, sel: null, cam: null }; return u.mapa; };
  /* La cámara se guarda aparte para el mapa grande y para el compacto (Centro de mando, Territorio, Crisis): cada uno recuerda su encuadre. */
  const claveCam = o => o && o.compacto ? 'camC' : 'cam', claveIni = o => o && o.compacto ? 'inicialC' : 'inicial';
  const capaPorDefecto = E => { const am = C.Foco ? C.Foco.ambito(E) : 'todo'; return am === 'aut' ? 'autonomico' : am === 'local' ? 'alcaldias' : 'voto'; };
  const muniDe = (E, p) => Object.values(E.esp.muni.m).filter(m => m.prov === p).sort((a, b) => b.pob - a.pob);

  /* Acciones que se pueden lanzar desde el territorio seleccionado (sólo las que tienen sentido para tu cargo). */
  const accionesDe = (E, tipo, id) => {
    const lista = [];
    const add = (aid, args, etq, cls) => { const a = C.Acciones.get(aid); if (!a) return; if (C.Foco && !C.Foco.accion(E, a)) return; const r = C.Acciones.razon(aid, args); if (r !== true && ESCONDE.test(String(r))) return; lista.push(UI.botonAccion(aid, args, etq, cls || 'chico')); };
    if (tipo === 'ccaa') {
      add('visita_ccaa', { region: id }, '🧳 Visitar la comunidad'); add('persuadir_comunidad', { c: id }, '🤝 Negociar con la comunidad'); add('cabildear_ccaa_fin', { c: id }, '💶 Cabildear (financiación)'); add('contrapartida_ccaa_fin', { c: id }, '🎁 Contrapartida (financiación)');
      add('plan_territorial', { c: id }, '🗺 Plan territorial'); add('cortejar_baron', { c: id }, '☕ Atender al barón'); add('cambiar_comunidad', { c: id }, '📍 Mudarme aquí');
      if (C.Crisis) for (const cr of C.Crisis.asegurar(E).activas.filter(x => x.fase !== 'cerrada' && x.regs.includes(id)).slice(0, 2)) add('visita_emergencia', { id: cr.id }, '🦺 Visitar: ' + C.Crisis.TIPOS[cr.tipo].n);
    } else if (tipo === 'prov') {
      add('mitin_prov', { prov: id }, '🎤 Mitin'); add('gasto_campana', { prov: id }, '💶 Gasto de campaña'); add('abrir_sede', { prov: id }, '🏢 Abrir sede'); add('cambiar_provincia', { prov: id }, '📍 Mudarme aquí');
    } else if (tipo === 'muni') {
      add('mitin_local', { muni: id }, '🎤 Mitin en la ciudad'); add('candidato_estrella', { muni: id }, '⭐ Candidato/a estrella');
    }
    return lista;
  };

  const chipP = (E, k) => E.partidos[k] ? Comp.partido(E, k) : '—';
  const kpi = (l, v, tip) => `<div class="kpi"${tip ? UI.tt(tip) : ''}><span class="v">${v}</span><span class="l">${l}</span></div>`;
  const val = (v, bueno, malo) => `<span class="${v >= bueno ? 'bien' : v <= malo ? 'mal' : ''}">${Math.round(v)}</span>`;

  /* ── Paneles ── */
  const Panel = {
    nacion(E, capa) {
      const L = C.Mapa.capa(capa), P = E.paises.ES, g = P.gob, pm = E.politicos[g.pm], rk = C.Mapa.ranking(E, capa);
      let h = `<div class="tarjeta"><div class="t-cab"><h3>🇪🇸 España</h3><span class="etq">${U.fmtT(hoy(E), true)}</span></div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px">Gobierno ${chipP(E, g.partido)}${g.coalicion.length > 1 ? ' <span class="tenue">+' + (g.coalicion.length - 1) + '</span>' : ''} · ${esc(pm ? pm.n : '—')} · aprobación <b>${Math.round(g.aprob)}</b></div>
        <div class="tenue" style="font-size:12px;margin-top:4px">Generales como tarde el ${U.fmtT(E.esp.cortes.finMax)} · municipales ${U.fmtT(E.esp.muni.proxT, true)}</div></div>`;
      h += `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>${esc(L.n)}</h3></div>`;
      if (rk) {
        const fila = x => `<div class="it" data-msel="ccaa:${x.c}" style="cursor:pointer"><span>${bn(x.c)}${esc(CORTO[x.c])}</span><b style="margin-left:auto">${esc(rk.L.fmt ? rk.L.fmt(x.v) : Math.round(x.v))}</b></div>`;
        h += `<div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Valor más alto</div><div class="lista" style="font-size:12.5px">${rk.ids.slice(0, 4).map(fila).join('')}</div><div class="tenue" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-top:6px">Valor más bajo</div><div class="lista" style="font-size:12.5px">${rk.ids.slice(-4).reverse().map(fila).join('')}</div>`;
      } else if (capa === 'voto') {
        const es = P.escanos, ks = Object.keys(es).filter(k => es[k] > 0).sort((a, b) => es[b] - es[a]).slice(0, 7);
        h += `<div class="lista" style="font-size:12.5px">${ks.map(k => `<div class="it">${chipP(E, k)}<b style="margin-left:auto">${es[k]}</b></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Escaños en el Congreso (350). El mapa muestra el partido más votado por circunscripción.</div>`;
      } else if (capa === 'autonomico') {
        const n = {}; for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.gob) n[rc.gob.partido] = (n[rc.gob.partido] || 0) + 1; }
        h += `<div class="lista" style="font-size:12.5px">${Object.keys(n).sort((a, b) => n[b] - n[a]).map(k => `<div class="it">${chipP(E, k)}<b style="margin-left:auto">${n[k]} / 19</b></div>`).join('')}</div>`;
      } else if (capa === 'alcaldias') {
        const a = C.Municipios.alcaldias(E), ks = Object.keys(a).sort((x, y) => a[y] - a[x]).slice(0, 7);
        h += `<div class="lista" style="font-size:12.5px">${ks.map(k => `<div class="it">${k === 'IND' ? 'Indep.' : chipP(E, k)}<b style="margin-left:auto">${U.n(a[k])}</b></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:4px">Alcaldías de España (las 66 grandes ciudades y el resto estimado). Próximas municipales ${U.fmtT(E.esp.muni.proxT, true)}.</div>`;
      } else if (capa === 'emerg') {
        const cs = C.Crisis ? C.Crisis.asegurar(E).activas.filter(c => c.fase !== 'cerrada') : [];
        h += cs.length ? `<div class="lista" style="font-size:12.5px">${cs.map(cr => { const T = C.Crisis.TIPOS[cr.tipo]; return `<div class="it" data-msel="ccaa:${cr.regs[0]}" style="cursor:pointer"><span>${T.ic} ${esc(T.n)}</span><span class="tenue" style="margin-left:auto">${cr.regs.length > 4 ? 'toda España' : cr.regs.map(c => esc(CORTO[c])).join(', ')}</span></div>`; }).join('')}</div>` : '<div class="tenue" style="font-size:12.5px">Sin emergencias activas.</div>';
      }
      h += '</div>';
      // Avisos
      const av = [];
      if (C.GobAut) for (const x of C.GobAut.resumen(E).slice(0, 4)) av.push(`<div class="it" data-msel="ccaa:${x.c}" style="cursor:pointer"><span>${bn(x.c)}${esc(CORTO[x.c])}</span><span class="etq ${x.rep ? 'rojo' : 'amar'}" style="margin-left:auto">${x.rep ? 'Elecciones repetidas' : 'En funciones'}</span></div>`);
      for (const c of C.Territorio.ids()) { const rc = E.esp.ccaa[c]; if (rc.suspendida) av.push(`<div class="it" data-msel="ccaa:${c}" style="cursor:pointer"><span>${bn(c)}${esc(CORTO[c])}</span><span class="etq rojo" style="margin-left:auto">Art. 155</span></div>`); else if (!rc.inv && semanas(E, rc.parl.proxT) <= 12) av.push(`<div class="it" data-msel="ccaa:${c}" style="cursor:pointer"><span>${bn(c)}${esc(CORTO[c])}</span><span class="etq oro" style="margin-left:auto">Elecciones en ${semanas(E, rc.parl.proxT)} sem.</span></div>`); }
      if (av.length) h += `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>⚠ En el mapa</h3></div><div class="lista" style="font-size:12.5px">${av.slice(0, 8).join('')}</div></div>`;
      return h;
    },

    ccaa(E, c, capa) {
      const rc = E.esp.ccaa[c], d = D().ccaa[c], g = rc.gob, pres = g && E.politicos[g.pres], T = C.Territorio, M = C.Mapa.geo();
      const alertas = [];
      if (C.GobAut && C.GobAut.enFunciones(E, c)) alertas.push('<span class="etq amar">En funciones</span>');
      if (C.GobAut && E.esp.gau && E.esp.gau.rep[c]) alertas.push('<span class="etq rojo">Elecciones repetidas</span>');
      if (rc.suspendida) alertas.push('<span class="etq rojo">Intervenida (155)</span>');
      else if (E.esp.a155 && E.esp.a155.p && E.esp.a155.p[c]) alertas.push('<span class="etq rojo">Procedimiento del 155</span>');
      if (C.Crisis) for (const cr of C.Crisis.asegurar(E).activas.filter(x => x.fase !== 'cerrada' && x.regs.includes(c))) alertas.push(`<span class="etq rojo">${C.Crisis.TIPOS[cr.tipo].ic} ${esc(C.Crisis.TIPOS[cr.tipo].n)}</span>`);
      const sem = semanas(E, rc.parl.proxT); alertas.push(`<span class="etq ${sem <= 12 ? 'oro' : ''}">Elecciones ${U.fmtT(rc.parl.proxT, true)}</span>`);
      if (rc.indep > 25) alertas.push('<span class="etq amar">Independentismo alto</span>');
      const provs = (M.ccaa[c] || []).map(p => { const pr = E.esp.prov[p], dd = D().provincias[p]; return `<tr data-msel="prov:${p}" style="cursor:pointer"><td><b>${esc(dd[0])}</b></td><td class="num">${dd[2]}</td><td>${pr ? chipP(E, pr.ganador) : '—'}</td></tr>`; }).join('');
      const ms = Object.values(E.esp.muni.m).filter(m => m.ccaa === c).sort((a, b) => b.pob - a.pob).slice(0, 6).map(m => `<div class="it" data-msel="muni:${m.id}" style="cursor:pointer">${C.Escudos ? C.Escudos.mini(m.id, 14) : ''}<span>${esc(m.nombre)}</span><span style="margin-left:auto">${chipP(E, m.alcalde)}</span></div>`).join('');
      const acc = accionesDe(E, 'ccaa', c);
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${bn(c)}${esc(d.nombre)}</h3><span class="etq oro">${U.d1(d.pob)} M hab.</span></div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px;margin-bottom:6px">${g ? `Gobierno ${chipP(E, g.partido)}${g.coalicion.length > 1 ? ' <span class="tenue">+' + (g.coalicion.length - 1) + '</span>' : ''} · ${esc(pres ? pres.n : '—')}` : 'Sin gobierno'}</div>
        <div class="fila" style="gap:5px;flex-wrap:wrap;margin-bottom:8px">${alertas.join('')}</div>
        <div class="mapa-kpis">${kpi('Relación con Moncloa', val(rc.relM, 60, 30))}${kpi('Independentismo', U.d1(rc.indep) + ' %')}${kpi('Autogobierno', Math.round(rc.aut))}${kpi('Financiación', Math.round(rc.fin.nivel), 'Régimen ' + ({ comun: 'común', foral: 'foral', singular: 'singular', canario: 'canario' }[rc.fin.regimen] || rc.fin.regimen))}${kpi('Deuda', Math.round(rc.deuda) + ' %')}${g ? kpi('Aprobación', val(g.aprob, 55, 38)) + kpi('Estabilidad', val(g.estab, 65, 40)) : ''}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="ccaa:${c}">🔍 Acercar</button><button class="btn chico" data-mficha="${c}">📋 Ficha completa</button></div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}
        <div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Provincias</h3></div><div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Provincia</th><th class="num">Dip.</th><th>Más votado</th></tr></thead><tbody>${provs}</tbody></table></div></div>
        ${ms ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Grandes ciudades</h3></div><div class="lista" style="font-size:12.5px">${ms}</div></div>` : ''}`;
    },

    prov(E, p, capa) {
      const d = D().provincias[p], c = d[1], pr = E.esp.prov[p];
      const tabla = pr ? Object.keys(pr.votos).sort((a, b) => pr.votos[b] - pr.votos[a]).slice(0, 6).map(k => `<tr><td>${chipP(E, k)}</td><td class="num">${U.d1(pr.votos[k])} %</td><td class="num"><b>${pr.escanos[k] || 0}</b></td></tr>`).join('') : '';
      const acc = accionesDe(E, 'prov', p), ms = muniDe(E, p).slice(0, 5).map(m => `<div class="it" data-msel="muni:${m.id}" style="cursor:pointer">${C.Escudos ? C.Escudos.mini(m.id, 14) : ''}<span>${esc(m.nombre)}</span><span style="margin-left:auto">${chipP(E, m.alcalde)}</span></div>`).join('');
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${esc(d[0])}</h3><span class="etq oro">${d[2]} diputado${d[2] === 1 ? '' : 's'}</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px"><a href="#" data-msel="ccaa:${c}">${bn(c)}${esc(CORTO[c])}</a> · ${U.n(d[3])} mil hab.${C.Sede ? ' · implantación de tu partido ' + Math.round(C.Sede.asegurar(E).impl[p] || 0) + ' %' : ''}</div>
        ${tabla ? `<div class="tscroll"><table class="tabla" style="font-size:12.5px"><thead><tr><th>Partido</th><th class="num">Voto</th><th class="num">Esc.</th></tr></thead><tbody>${tabla}</tbody></table></div>` : ''}
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="prov:${p}">🔍 Acercar</button><button class="btn chico" data-msel="ccaa:${c}">↰ ${esc(CORTO[c])}</button></div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}
        ${ms ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Grandes ciudades</h3></div><div class="lista" style="font-size:12.5px">${ms}</div></div>` : ''}`;
    },

    muni(E, id, capa) {
      const m = E.esp.muni.m[id]; if (!m) return Panel.nacion(E, capa);
      const alc = E.politicos[m.pm], acc = accionesDe(E, 'muni', id), esAlc = m.pm === 'J', coal = (m.coal || []).filter(k => k !== m.alcalde);
      const cm = C.CampMun && C.CampMun.activa && C.CampMun.activa(E) ? C.CampMun.asegurar(E) : null, pyr = cm && C.CampMun.proyectar ? C.CampMun.proyectar(E, id, 0) : null;
      return `<div class="tarjeta mapa-ficha" style="border-color:var(--oro)"><div class="t-cab"><h3>${C.Escudos ? C.Escudos.svg(id, { h: 30 }) : ''} ${esc(m.nombre)}</h3><span class="etq oro">${U.n(m.pob)} mil hab.</span></div>
        <div class="tenue" style="font-size:12.5px;margin-bottom:6px"><a href="#" data-msel="ccaa:${m.ccaa}">${bn(m.ccaa)}${esc(CORTO[m.ccaa])}</a> · ${esc(D().provincias[m.prov][0])} · ${m.n} concejales</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;font-size:12.5px;margin-bottom:8px">Alcaldía ${chipP(E, m.alcalde)}${coal.length ? ' <span class="tenue">con</span> ' + coal.map(k => chipP(E, k)).join(' ') : ''} · ${esc(alc ? alc.n : '—')}${esAlc ? ' <span class="etq oro">Tú</span>' : ''}</div>
        <div class="mapa-kpis">${kpi('Aprobación', val(m.aprob, 58, 40))}${kpi('Deuda', Math.round(m.deuda) + ' %')}${pyr ? kpi('Tus concejales previstos', pyr.mias + '/' + pyr.n) : ''}</div>
        <div class="fila" style="gap:6px;flex-wrap:wrap;margin-top:10px"><button class="btn chico" data-mz="muni:${id}">🔍 Acercar</button>${E.jugador.muni === id ? '<button class="btn chico" data-ir="ayuntamiento">🏘 Mi ayuntamiento</button>' : ''}</div></div>
        ${acc.length ? `<div class="tarjeta" style="margin-top:10px"><div class="t-cab"><h3>Acciones aquí</h3><span class="etq">◆ ${E.jugador.agenda.puntos}/${E.jugador.agenda.max}</span></div><div class="fila" style="gap:6px;flex-wrap:wrap">${acc.join('')}</div></div>` : ''}`;
    }
  };
  const semanas = (E, t) => Math.max(0, Math.round(t - E.fecha.t));
  const panelHtml = (E, st) => { const s = st.sel, capa = st.capa; if (!s) return Panel.nacion(E, capa); if (s.t === 'ccaa') return Panel.ccaa(E, s.id, capa); if (s.t === 'prov') return Panel.prov(E, s.id, capa); return Panel.muni(E, s.id, capa); };

  /* Todas las comunidades, provincias y ciudades se pueden seleccionar; la caja de encuadre se calcula a partir de la geometría. */
  const cajaDe = (E, s) => { const Mp = C.Mapa; if (!s) return null; if (s.t === 'ccaa') return Mp.bbCcaa(s.id); if (s.t === 'prov') return Mp.bbProv(s.id); const m = E.esp.muni.m[s.id], c = Mp.geo().ciu[s.id]; if (!m || !c) return null; const r = 190; return [c[0] - r, c[1] - r, c[0] + r, c[1] + r]; };
  const provDeSel = (E, s) => !s ? null : s.t === 'prov' ? s.id : s.t === 'muni' && E.esp.muni.m[s.id] ? E.esp.muni.m[s.id].prov : null;
  const ccaaDeSel = (E, s) => !s ? null : s.t === 'ccaa' ? s.id : s.t === 'prov' ? ccaaDe(s.id) : s.t === 'muni' && E.esp.muni.m[s.id] ? E.esp.muni.m[s.id].ccaa : null;

  const Pa = C.Pantallas.mapa = {
    CORTO,
    /* HTML del mapa interactivo. o: { compacto (más bajo), suave (dentro de una página que se desplaza), cab (cabecera con enlace al mapa completo), capa + id (capa con la que se abre al entrar desde esa pantalla) } */
    html(E, o = {}) {
      const st = estado(E); if (o.capa && st.origen !== o.id && C.Mapa.CAPAS.some(c => c.id === o.capa)) { st.capa = o.capa; st.sel = null; st.camC = null; st.inicialC = true; } st.origen = o.id || null; if (!st.capa || !C.Mapa.CAPAS.some(c => c.id === st.capa)) st.capa = capaPorDefecto(E);
      const L = C.Mapa.capa(st.capa), grupos = C.Mapa.grupos();
      const tabs = grupos.map(g => `<button data-mgrupo="${esc(g.n)}" class="${g.n === L.g ? 'activo' : ''}">${esc(g.n)}</button>`).join('');
      const chips = grupos.map(g => g.capas.map(c => `<button data-mcapa="${c.id}" data-g="${esc(g.n)}" class="${c.id === st.capa ? 'activo' : ''}"${g.n === L.g ? '' : ' hidden'}>${esc(c.n)}</button>`).join('')).join('');
      return `<div class="mapa-w${o.compacto ? ' compacto' : ''}${o.suave ? ' suave' : ''}" id="mapa-w">${o.cab ? `<div class="t-cab"><h3>🗺 Mapa de España</h3><button class="btn chico fant" data-ir="mapa">Abrir el mapa →</button></div>` : ''}<select class="mapa-sel" id="mapa-capa" aria-label="Capa del mapa">${grupos.map(g => `<optgroup label="${esc(g.n)}">${g.capas.map(c => `<option value="${c.id}"${c.id === st.capa ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</optgroup>`).join('')}</select><div class="mapa-barra"><div class="mapa-tabs" role="group" aria-label="Familias de capas">${tabs}</div><div class="mapa-chips" role="group" aria-label="Capas">${chips}</div></div><div class="mapa-desc" id="mapa-desc"><b>${esc(L.n)}</b> · ${esc(L.d)}</div>
        <div class="mapa-cuerpo"><div class="mapa-lienzo" id="mapa-lienzo">${C.Mapa.svg(E, st.capa, { interactivo: true, region: ccaaDeSel(E, st.sel), etq: 'no' })}
          <div class="mapa-zoom"><button data-mzoom="in" aria-label="Acercar">+</button><button data-mzoom="out" aria-label="Alejar">−</button><button data-mzoom="todo" aria-label="Ver toda España" title="Ver toda España">⌂</button><button data-mzoom="yo" aria-label="Mi territorio" title="Mi territorio">📍</button></div>
          <div class="mapa-resumen" id="mapa-resumen"></div>
          <div class="mapa-leyenda" id="mapa-leyenda">${C.Mapa.leyenda(E, st.capa)}</div>${o.suave ? '<div class="mapa-pista" id="mapa-pista">Ctrl + rueda para acercar</div>' : ''}</div>
          <aside class="mapa-panel" id="mapa-panel">${panelHtml(E, st)}</aside></div></div>`;
    },

    /* Cablea el mapa: cámara, selección, capas, panel y capas dinámicas (etiquetas, ciudades, marcas). */
    enlazar(el, E, o = {}) {
      const w = UI.$('#mapa-w', el), svg = UI.$('svg.mapa-es', w), lienzo = UI.$('#mapa-lienzo', w), panel = UI.$('#mapa-panel', w), st = estado(E), M = C.Mapa.geo();
      if (!w || !svg) return null;
      let cam = null, pendiente = false;
      /* El panel se redibuja al seleccionar: sus filas pulsables también se alcanzan con el teclado. */
      const nombreSel = s_ => !s_ ? '' : s_.t === 'ccaa' ? CORTO[s_.id] : s_.t === 'prov' ? D().provincias[s_.id][0] : (E.esp.muni.m[s_.id] || {}).nombre || '';
      const ponerPanel = () => { const rs = UI.$('#mapa-resumen', w); rs.classList.toggle('ver', !!st.sel); rs.innerHTML = st.sel ? `<b>${esc(nombreSel(st.sel))}</b><button class="btn chico" data-mver>Ver ficha ↓</button>` : ''; panel.innerHTML = panelHtml(E, st); UI.$$('[data-msel]', panel).forEach(x => { if (!/^(A|BUTTON)$/.test(x.tagName)) { x.setAttribute('tabindex', '0'); x.setAttribute('role', 'button'); } }); };
      w.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-msel][role="button"]')) { e.preventDefault(); e.target.click(); } });
      const ciudades = Object.values(E.esp.muni.m).sort((a, b) => b.pob - a.pob);

      /* Capas dinámicas: dependen del zoom, así que se redibujan cuando la cámara se mueve. */
      const dinamico = () => {
        pendiente = false; if (!cam || !svg.isConnected) return; const z = cam.z(), v = cam.vista(), r = svg.getBoundingClientRect(), upp = v.w / Math.max(1, r.width), L = C.Mapa.capa(st.capa), propio = C.Mapa.propio(E);
        const px = n => f1(n * upp), fs = n => px(n);
        // Etiquetas (las grandes primero; las que chocan con otra ya colocada se omiten)
        let t = ''; const puestas = [], cajas = [];
        const txt = (x, y, s, tam, cl) => `<text class="${cl}" x="${f1(x)}" y="${f1(y)}" style="font-size:${fs(tam)}px;stroke-width:${px(tam * 0.34)}px">${esc(s)}</text>`;
        const libre = (x, y, s, tam) => { const w = s.length * tam * 0.62 * upp, h = tam * 1.15 * upp, r = [x - w / 2, y - h * 0.8, x + w / 2, y + h * 0.2]; if (puestas.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return false; puestas.push(r); return true; };
        const libreIzq = (x, y, s, tam) => { const w = s.length * tam * 0.58 * upp, h = tam * 1.15 * upp, r = [x, y - h * 0.8, x + w, y + h * 0.2]; if (puestas.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return false; puestas.push(r); return true; };
        const area = bb => (bb[2] - bb[0]) * (bb[3] - bb[1]);
        if (z < 2.6) { for (const c of Object.keys(M.ccCen).filter(c => c !== 'CEU' && c !== 'MEL').sort((a, b) => area(M.ccBb[b]) - area(M.ccBb[a]))) { if (libre(M.ccCen[c][0], M.ccCen[c][1], CORTO[c], 11)) t += txt(M.ccCen[c][0], M.ccCen[c][1], CORTO[c], 11, 'et-c'); } }
        else { for (const p of Object.keys(M.cen).filter(p => p !== 'CEU' && p !== 'MEL').sort((a, b) => area(M.bb[b]) - area(M.bb[a]))) { const bb = M.bb[p]; if ((bb[2] - bb[0]) / upp < 40) continue; const nom = D().provincias[p][0], rot = (bb[2] - bb[0]) / upp > nom.length * 7.4 ? nom : p; if (!libre(M.cen[p][0], M.cen[p][1] - px(3), rot, 10.5)) continue; t += txt(M.cen[p][0], M.cen[p][1] - px(3), rot, 10.5, 'et-p'); if (L.etq) { const e = L.etq(E, p); if (e != null) t += txt(M.cen[p][0], M.cen[p][1] + px(10), String(e), 10, 'et-v'); } } }
        if (z >= 1.5) for (const p of ['CEU', 'MEL']) t += txt(M.cen[p][0] + px(18), M.cen[p][1] + px(4), p, 10, 'et-p et-izq');
        // Ciudades (sus nombres van con el resto de etiquetas, por encima de los puntos)
        const cc = ccaaDeSel(E, st.sel), todas = L.ciudades === 'todas', n = z < 1.5 ? 10 : z < 2.5 ? 22 : z < 4 ? 40 : 99; let cs = '', lc = '';
        ciudades.forEach((m, i) => {
          const sel = st.sel && st.sel.t === 'muni' && st.sel.id === m.id, mia = propio.muni === m.id;
          if (!(i < n || todas || sel || mia || (cc && m.ccaa === cc && z >= 1.8))) return;
          const p = M.ciu[m.id]; if (!p) return; const rp = 3.4 + Math.sqrt(m.pob) / 15, col = todas ? ((E.partidos[m.alcalde] || {}).color || '#ccc') : '#f2eee0';
          const tip = C.Mapa.avisoCiudad(E, m);
          cs += `<circle class="ciu${sel ? ' sel' : ''}${mia ? ' mia' : ''}" data-muni="${m.id}" data-tt="${esc(tip)}" cx="${p[0]}" cy="${p[1]}" r="${px(sel ? rp + 2 : rp)}" fill="${col}" vector-effect="non-scaling-stroke"/>`;
          if ((z >= 3 || sel || (cc && m.ccaa === cc && z >= 2.2)) && (sel || mia ? (libreIzq(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5) || true) : libreIzq(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5))) lc += txt(p[0] + px(rp + 4), p[1] + px(3.5), m.nombre, 9.5, 'et-m');
        });
        UI.$('.m-ciu', svg).innerHTML = cs; UI.$('.m-etq', svg).innerHTML = t + lc;
        // Marcas (emergencias, 155)
        const marcas = C.Mapa.marcas(E, st.capa), usados = {}; let ms = '';
        for (const m of marcas) { const q = M.ccCen[m.c]; if (!q) continue; const k = usados[m.c] = (usados[m.c] || 0) + 1, x = q[0] + (k - 1) * px(26), y = q[1] - px(14), col = m.nivel >= 3 ? '#cf3c3a' : m.nivel === 2 ? '#e07a2f' : m.nivel === 1 ? '#d8b13f' : '#cf3c3a';
          ms += `<g class="marca" data-ccaa="${m.c}" data-tt="${esc(`<div class="tt-t">${esc(m.t)}</div>`)}"><circle class="pulso" cx="${f1(x)}" cy="${f1(y)}" r="${px(11)}" fill="${col}"/><text x="${f1(x)}" y="${f1(y + px(4.5))}" style="font-size:${px(13)}px" text-anchor="middle">${m.ic}</text></g>`; }
        UI.$('.m-marc', svg).innerHTML = ms;
        st[claveCam(o)] = { c: cam.centro(), z };
      };
      const pedir = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(dinamico); };

      /* Selección */
      const resalta = () => {
        const cc = ccaaDeSel(E, st.sel), g = UI.$('.m-res', svg), ps = cc && M.ccaa[cc] ? (st.sel.t === 'prov' ? [st.sel.id] : st.sel.t === 'ccaa' ? M.ccaa[cc] : []) : [];
        const base = ps.map(p => `<path class="m-sel" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join(''), pr = C.Mapa.propio(E);
        const propios = (pr.ccaa && M.ccaa[pr.ccaa] ? M.ccaa[pr.ccaa] : pr.prov ? [pr.prov] : []).map(p => `<path class="m-propio" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('');
        const cx = st.sel && st.sel.t === 'ccaa' ? M.ccaa[cc].map(p => `<path class="m-sel-c" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('') : '';
        g.innerHTML = propios + cx + base;
      };
      const seleccionar = (s, ir) => {
        st.sel = s; resalta(); ponerPanel(); pedir(); panel.scrollTop = 0;
        if (ir && s) cam.ajustarA(cajaDe(E, s), s.t === 'muni' ? 1 : 1.5, 460, s.t === 'muni' ? 9 : 8);
      };
      const clickEn = (e, el_) => {
        const t = el_ && el_.closest ? el_.closest('[data-muni],[data-prov],[data-ccaa]') : null; if (!t || !svg.contains(t)) { if (!(el_ && el_.closest && el_.closest('.mapa-zoom'))) seleccionar(null); return; }
        if (t.dataset.muni) return seleccionar({ t: 'muni', id: t.dataset.muni });
        const L = C.Mapa.capa(st.capa), p = t.dataset.prov, c = t.dataset.ccaa, actual = ccaaDeSel(E, st.sel);
        if (p && (L.nivel === 'prov' || actual === c)) return seleccionar({ t: 'prov', id: p });
        seleccionar({ t: 'ccaa', id: c });
      };

      /* Capas de datos */
      const pintarCapa = capa => {
        st.capa = capa; const L = C.Mapa.capa(capa); let haches = '', puntos = '';
        UI.$$('.ficha[data-prov]', svg).forEach(f => { const p = f.dataset.prov, s = L.color(E, p); f.setAttribute('fill', s.f); if (s.o != null) f.setAttribute('fill-opacity', String(Math.round(s.o * 10) / 10)); else f.removeAttribute('fill-opacity'); f.setAttribute('data-tt', L.tt(E, p)); });
        for (const p in M.prov) { const s = L.color(E, p); if (s.h) haches += `<path d="${M.prov[p]}" fill="url(#m-rayas)" pointer-events="none"/>`; if (s.p) puntos += `<path d="${M.prov[p]}" fill="url(#m-puntos)" pointer-events="none"/>`; }
        UI.$('.m-trama', svg).innerHTML = haches + puntos;
        UI.$('#mapa-leyenda', w).innerHTML = C.Mapa.leyenda(E, capa); UI.$('#mapa-desc', w).innerHTML = '<b>' + esc(L.n) + '</b> · ' + esc(L.d);
        (st.ultima = st.ultima || {})[L.g] = capa;
        UI.$$('[data-mgrupo]', w).forEach(b => b.classList.toggle('activo', b.dataset.mgrupo === L.g));
        UI.$$('[data-mcapa]', w).forEach(b => { b.hidden = b.dataset.g !== L.g; b.classList.toggle('activo', b.dataset.mcapa === capa); }); UI.$('#mapa-capa', w).value = capa;
        if (!st.sel) ponerPanel(); pedir();
      };
      UI.$$('[data-mcapa]', w).forEach(b => b.onclick = () => pintarCapa(b.dataset.mcapa));
      UI.$$('[data-mgrupo]', w).forEach(b => b.onclick = () => { const g = C.Mapa.grupos().find(x => x.n === b.dataset.mgrupo); if (g) pintarCapa((st.ultima && g.capas.some(c => c.id === st.ultima[g.n]) ? st.ultima[g.n] : g.capas[0].id)); });
      UI.$('#mapa-capa', w).onchange = e => pintarCapa(e.target.value);

      /* Cámara */
      const pistaEl = UI.$('#mapa-pista', w); let tPista = 0;
      const pista = pistaEl ? () => { pistaEl.classList.add('ver'); clearTimeout(tPista); tPista = setTimeout(() => pistaEl.classList.remove('ver'), 1500); } : null;
      cam = C.Mapa.camara(svg, lienzo, { click: clickEn, cambio: pedir, gestos: !(E.ui && E.ui.mapaSinGestos), suave: !!o.suave, pista });
      const aMiTerritorio = (ms, forzar) => {
        const pr = C.Mapa.propio(E), J = E.jugador, enc = (s, pad, zmax) => { cam.ajustarA(cajaDe(E, s), pad, ms, zmax); return s; };
        if (pr.muni && E.esp.muni.m[pr.muni]) return enc({ t: 'muni', id: pr.muni }, 1, 9);
        if (pr.ccaa && M.ccaa[pr.ccaa]) return enc({ t: 'ccaa', id: pr.ccaa }, 1.5, 8);
        if (forzar && pr.prov && M.prov[pr.prov]) return enc({ t: 'prov', id: pr.prov }, 1.5, 8);
        if (forzar && J.region && J.region !== 'ES' && M.ccaa[J.region]) return enc({ t: 'ccaa', id: J.region }, 1.5, 8);
        cam.reset(ms); return null;
      };
      w.addEventListener('click', e => {
        const z = e.target.closest('[data-mzoom]'); if (z) { const k = z.dataset.mzoom; if (k === 'in') cam.zoom(1.6); else if (k === 'out') cam.zoom(1 / 1.6); else if (k === 'todo') { cam.reset(420); seleccionar(null); } else { const s = aMiTerritorio(420, true); if (s) seleccionar(s); } return; }
        if (e.target.closest('[data-mver]')) { panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; }
        const s = e.target.closest('[data-msel]'); if (s) { e.preventDefault(); const [t, id] = s.dataset.msel.split(':'); seleccionar({ t, id }, true); return; }
        const q = e.target.closest('[data-mz]'); if (q) { const [t, id] = q.dataset.mz.split(':'); cam.ajustarA(cajaDe(E, { t, id }), t === 'muni' ? 1 : 1.5, 460, t === 'muni' ? 9 : 8); return; }
        const f = e.target.closest('[data-mficha]'); if (f) { C.Pantallas.territorio.verCcaa(f.dataset.mficha); return; }
        const ir = e.target.closest('[data-ir]'); if (ir) { e.preventDefault(); C.App.ir(ir.dataset.ir); }
      });
      svg.addEventListener('dblclick', e => { const t = e.target.closest('[data-prov],[data-ccaa]'); if (t && st.sel) cam.ajustarA(cajaDe(E, st.sel), 1.5, 460, 8); });

      // Estado inicial: cámara guardada o encuadre del cargo
      const kc = claveCam(o), ki = claveIni(o);
      if (st[kc] && st[kc].c) cam.fijar(st[kc].c[0], st[kc].c[1], st[kc].z);
      else if (!st[ki]) { st[ki] = true; const am = C.Foco ? C.Foco.ambito(E) : 'todo'; if (am === 'aut' || am === 'local') { const s = aMiTerritorio(0, false); if (s && !st.sel) { st.sel = s; ponerPanel(); } } }
      if (!(st[kc] && st[kc].c) && st.sel) { const bb = cajaDe(E, st.sel); if (bb) cam.ajustarA(bb, st.sel.t === 'muni' ? 1 : 1.5, 0, st.sel.t === 'muni' ? 9 : 8); }
      resalta(); pintarCapa(st.capa); ponerPanel(); dinamico();
      /* Al girar el móvil o cambiar el tamaño de la ventana, el encuadre se recalcula con el nuevo lienzo. */
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { if (svg.isConnected) cam.aplicar(); }) : null; if (ro) ro.observe(lienzo);
      return { cam, seleccionar, pintarCapa, destruir: () => { cam.destruir(); if (ro) ro.disconnect(); } };
    },

    /* Monta el mapa en el elemento y libera la cámara anterior. */
    montar(el, E, o) { if (activo) activo.destruir(); activo = Pa.enlazar(el, E, o); return activo; },

    /* Pantalla completa */
    render(el, params) {
      const E = C.E, st = estado(E), sel = params && params.sel; if (params && params.capa) st.capa = params.capa; if (sel) { st.sel = sel; st.cam = null; st.inicial = true; }
      el.innerHTML = `<div class="cab"><div><h1>🗺 Mapa de España</h1><div class="sub">Tu mesa de mando: elige una capa, pulsa una comunidad, provincia o ciudad y actúa desde ahí</div></div></div>${Pa.html(E)}`;
      const m = Pa.montar(el, E); if (sel) m.seleccionar(sel, true);
    }
  };
})(window.ESP);

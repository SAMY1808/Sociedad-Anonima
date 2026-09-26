/* Proyectos de ley: listado, expediente legislativo, negociación y radicación. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp, L = C.Legislacion;
  C.Pantallas = C.Pantallas || {};
  const PLAZO = { i: 'Inmediato', m: 'Mediano plazo', l: 'Largo plazo' };
  const VAR = { crecimiento: 'Crecimiento', inflacion: 'Inflación', desempleo: 'Desempleo', pobreza: 'Pobreza', deficit: 'Déficit fiscal', deuda: 'Deuda', inversion: 'Inversión', exportaciones: 'Exportaciones', educacion: 'Educación', salud: 'Salud', seguridad: 'Seguridad', infraestructura: 'Infraestructura', confianza: 'Confianza institucional', aprobacion: 'Aprobación del Gobierno' };
  const MALO = { inflacion: 1, desempleo: 1, pobreza: 1, deficit: 1, deuda: 1 };
  const apoyoCiudadano = p => U.clamp(50 + (p.pop + p.presion) * 1.4, 3, 97);

  const pseudo = (E, o) => Object.assign({ autor: 'J', coautores: [], partido: E.jugador.partido, bancadas: {}, acuerdos: {}, compromisos: {}, persuasion: 0, presion: 0, ponencia: null, regionalBonus: null, gobierno: E.gobierno.presidente === 'J', tipo: 'ordinaria', etapas: C.DATA.tramite.ordinaria, etapa: 1, comision: 1 }, o);

  const P = {
    render(el, params) {
      const E = C.E;
      const f = params.filtro || E.ui.filtroProy || 'tramite';
      E.ui.filtroProy = f;
      const todos = Object.values(E.proyectos).sort((a, b) => b.radicado - a.radicado);
      const filtros = { tramite: ['En trámite', p => p.estado === 'tramite'], mios: ['Míos', p => p.autor === 'J' || p.coautores.includes('J')], gobierno: ['Del Gobierno', p => p.gobierno], leyes: ['Leyes', p => p.estado === 'ley'], archivados: ['Archivados', p => p.estado === 'archivado'], todos: ['Todos', () => true] };
      const lista = todos.filter(filtros[f][1]);
      const act = L.activos(E);
      const etapasCount = {};
      for (const p of act) { const k = L.etapaActual(p); etapasCount[k] = (etapasCount[k] || 0) + 1; }
      const orden = ['radicacion', 'comision1', 'plenaria1', 'comision2', 'plenaria2', 'conciliacion', 'comision3', 'plenaria3', 'comision4', 'plenaria4', 'objecion', 'sancion'];
      const puedeRadicar = C.Acciones.puede('radicar', {}) === true;
      el.innerHTML = `<div class="cab"><div><h1>Proyectos de ley</h1><div class="sub">${act.length} en trámite · ${todos.filter(p => p.estado === 'ley').length} leyes sancionadas en el cuatrienio</div></div>
          <button class="btn prim" id="p-radicar" ${puedeRadicar ? '' : 'disabled'}${puedeRadicar ? '' : UI.tt(C.Acciones.puede('radicar', {}))}>📥 Radicar proyecto <span class="coste">2 ◆</span></button></div>
        <div class="tarjeta"><h3>Embudo legislativo</h3><div class="embudo">${orden.filter(k => etapasCount[k] || ['comision1', 'plenaria1', 'comision2', 'plenaria2'].includes(k)).map(k => `<div class="emb"${UI.tt(esc(C.DATA.tramite.etapas[k].nombre))}><b class="num">${etapasCount[k] || 0}</b><span>${C.DATA.tramite.etapas[k].icono} ${esc(C.DATA.tramite.etapas[k].nombre.split(' · ')[0])}</span><i style="height:${Math.min(100, (etapasCount[k] || 0) * 9)}%"></i></div>`).join('')}</div></div>
        <div class="fila" style="margin:14px 0"><div class="seg" id="p-filtro">${Object.entries(filtros).map(([k, [n, fn]]) => `<button data-f="${k}" class="${k === f ? 'activo' : ''}">${n} <span class="tenue">${todos.filter(fn).length}</span></button>`).join('')}</div></div>
        <div class="col">${lista.slice(0, 80).map(p => {
          const pr = p.estado === 'tramite' && L.camaraDeEtapa(p) && (L.infoEtapa(p) || {}).instancia ? L.proyectar(E, p) : null;
          return `<div class="tarjeta clic fila-proy" data-proy="${p.id}"><div class="fp-ic">${C.DATA.sectores[p.sector].icono}</div>
            <div class="fp-cuerpo"><div class="fila" style="gap:6px"><span class="tenue mono" style="font-size:11px">PL ${esc(p.numero)}</span>${p.gobierno ? '<span class="etq">Gobierno</span>' : ''}${p.urgencia ? '<span class="etq rojo">Urgencia</span>' : ''}${p.autor === 'J' ? '<span class="etq verde">Tuyo</span>' : ''}<span class="etq">${C.DATA.tramite.tipos[p.tipo].nombre}</span></div>
              <b>${esc(p.titulo)}</b><div class="tenue" style="font-size:12px">${esc(L.nombreAutor(E, p))} · ${Comp.partido(E, p.partido)} · Comisión ${C.DATA.comisiones[p.comision - 1].nombre}</div>
              ${Comp.tramite(E, p, true)}</div>
            <div class="fp-der">${Comp.estadoProyecto(p)}${pr ? `<span class="etq ${pr.distancia <= 0 ? 'verde' : 'rojo'}"${UI.tt('Distancia de mayoría en la próxima instancia')}>${pr.distancia <= 0 ? 'Pasa (+' + -pr.distancia + ')' : 'Faltan ' + pr.distancia}</span>` : ''}<span class="tenue" style="font-size:11.5px">Apoyo ciudadano ${U.n(apoyoCiudadano(p))}%</span></div></div>`;
        }).join('') || '<div class="tarjeta vacio">No hay proyectos en esta categoría.</div>'}</div>`;
      UI.$$('#p-filtro button', el).forEach(b => b.onclick = () => C.App.ir('proyectos', { filtro: b.dataset.f }));
      UI.$$('[data-proy]', el).forEach(b => b.onclick = () => P.expediente(b.dataset.proy));
      UI.$('#p-radicar', el).onclick = () => P.radicar();
    },

    /* ── Expediente legislativo ── */
    expediente(id, tabIni) {
      const E = C.E, p = E.proyectos[id]; if (!p) return;
      let tab = tabIni || (p.estado === 'tramite' ? 'negociacion' : 'resumen');
      const m = UI.modal({ titulo: 'Expediente legislativo', icono: '📜', clase: 'ancho', cuerpo: '' });
      const pintar = () => {
        const cam = L.camaraDeEtapa(p), inf = L.infoEtapa(p) || {};
        const T = C.DATA.tramite;
        const ponentes = p.ponentes.map(x => Comp.nombrePol(E, x)).join(', ') || '—';
        const cab = `<div class="expediente">
          <div class="exp-sello">★<span>CONGRESO DE LA<br>REPÚBLICA</span></div>
          <div class="exp-cab"><div class="mono exp-num">PROYECTO DE ${p.tipo === 'acto' ? 'ACTO LEGISLATIVO' : 'LEY'} N.º ${esc(p.numero)}</div>
            <h2>«${esc(p.titulo)}»</h2>
            <div class="exp-campos">
              <div><span>Autor</span><b>${esc(L.nombreAutor(E, p))}</b></div><div><span>Partido</span><b>${esc(E.partidos[p.partido] ? E.partidos[p.partido].nombre : '—')}</b></div>
              <div><span>Tipo</span><b>${T.tipos[p.tipo].nombre} · mayoría ${T.tipos[p.tipo].mayoria}</b></div><div><span>Cámara de origen</span><b>${C.Congreso.nombreCamara(p.origen)}</b></div>
              <div><span>Comisión</span><b>${C.DATA.comisiones[p.comision - 1].nombre} Constitucional</b></div><div><span>Radicado</span><b>${U.fmtT(p.radicado, false)}</b></div>
              <div><span>Ponentes</span><b>${esc(ponentes)}</b></div><div><span>Coautores</span><b>${p.coautores.length ? esc(p.coautores.map(x => Comp.nombrePol(E, x)).join(', ')) : '—'}</b></div>
            </div></div>
          <div class="exp-estado">${Comp.estadoProyecto(p)}${p.estado === 'tramite' ? `<div class="tenue" style="font-size:12px;margin-top:4px">${esc(inf.nombre || '')}${cam ? ' · ' + C.Congreso.nombreCamara(cam) : ''}</div>` : ''}</div>
        </div>
        ${Comp.tramite(E, p)}`;
        const tabs = [['negociacion', p.estado === 'tramite' ? '🤝 Votos y negociación' : null], ['resumen', 'Impacto'], ['votaciones', 'Votaciones (' + p.votaciones.length + ')'], ['enmiendas', 'Enmiendas (' + p.enmiendas.length + ')'], ['historial', 'Historial']].filter(t => t[1]);
        let cuerpo = '';
        if (tab === 'resumen') cuerpo = P.tabImpacto(E, p);
        if (tab === 'negociacion') cuerpo = P.tabNegociacion(E, p);
        if (tab === 'votaciones') cuerpo = `<div class="lista">${p.votaciones.map(vid => E.votaciones.find(v => v.id === vid)).filter(Boolean).map(v => `<div class="it clic" data-voto-ver="${v.id}"><span style="font-size:20px">${v.resultado.aprobado ? '🟢' : '🔴'}</span><div class="cuerpo"><b>${esc((T.etapas[v.etapa] || { nombre: v.etapa }).nombre)} · ${C.Congreso.nombreCamara(v.camara)}</b><span>${U.fmtT(v.t)} · ${v.resultado.si} sí · ${v.resultado.no} no · ${v.resultado.abs} abst. · ${v.resultado.aus} aus.</span></div><span class="etq ${v.resultado.aprobado ? 'verde' : 'rojo'}">${v.resultado.aprobado ? 'Aprobado' : 'Negado'}</span></div>`).join('') || '<div class="vacio">Aún no se ha votado.</div>'}</div>`;
        if (tab === 'enmiendas') cuerpo = `<div class="lista">${p.enmiendas.map(en => `<div class="it"><span>✏</span><div class="cuerpo"><b style="white-space:normal">${esc(en.txt)}</b><span>${U.fmtT(en.t)} · ${esc(Comp.nombrePol(E, en.autor))}${en.deco ? ' · giro económico ' + U.signo(en.deco, 0) : ''}${en.dcosto ? ' · costo ' + U.signo(en.dcosto) + ' billones' : ''}</span></div></div>`).join('') || '<div class="vacio">Sin enmiendas. El texto se mantiene como fue radicado.</div>'}</div>`;
        if (tab === 'historial') cuerpo = `<div class="timeline">${p.historial.map(h => `<div class="tl ${h.tipo}"><span class="tl-f">${U.fmtT(h.t)}</span><span class="tl-t">${esc(h.txt)}</span></div>`).join('')}</div>`;
        m.cuerpo.innerHTML = cab + `<div class="tabs" style="margin-top:14px">${tabs.map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'activo' : ''}">${n}</button>`).join('')}</div>` + cuerpo;
      };
      m.cuerpo.addEventListener('click', e => {
        const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; pintar(); return; }
        const v = e.target.closest('[data-voto-ver]'); if (v) { C.Pantallas.votacion.abrir(v.dataset.votoVer); return; }
        const f = e.target.closest('[data-ficha]'); if (f) { Comp.fichaPolitico(E, f.dataset.ficha); return; }
        const et = e.target.closest('.tramite [data-etapa]');
        if (et) { const i = +et.dataset.etapa; const etId = p.etapas[i]; const vs = p.votaciones.map(x => E.votaciones.find(v => v.id === x)).filter(v => v && v.etapa === etId); if (vs.length) C.Pantallas.votacion.abrir(vs[vs.length - 1].id); else UI.toast(esc(C.DATA.tramite.etapas[etId].nombre) + ': ' + (i < p.etapa ? 'etapa superada sin votación nominal' : 'etapa pendiente')); return; }
        const vs = e.target.closest('.voto-sel [data-v]'); if (vs) { E.jugador.votos[p.id] = vs.dataset.v; pintar(); return; }
      });
      C.Bus.on('ui:accion', function h() { if (!document.body.contains(m.el)) return C.Bus.off('ui:accion', h); pintar(); });
      pintar();
    },
    tabImpacto(E, p) {
      const deficit = C.Economia.impactoFiscal(p.costo);
      const grupos = U.agrupar(p.efectos, e => e.p);
      const pos = U.clamp(50 + (p.pop + p.presion) * 1.4, 3, 97);
      const bancadas = Object.values(E.partidos).filter(x => !x.especial).map(pa => ({ pa, pos: p.bancadas[pa.id] || L.posicionBancada(E, pa.id, p) }));
      return `<div class="grid g3">
        <div class="tarjeta"><h3>Costo fiscal</h3><div class="kpi"><span class="v">${p.costo >= 0 ? '' : '−'}$${U.d1(Math.abs(p.costo))} bill.</span><span class="l">${p.costo >= 0 ? 'gasto anual' : 'recaudo anual'}</span><span class="d ${deficit > 0 ? 'mal' : 'bien'}">${U.signo(deficit, 1)} pp de déficit (% del PIB)</span></div>
          <div style="margin-top:12px">${Comp.ideoBarra(p.eco, p.soc)}<div class="tenue" style="font-size:11.5px;margin-top:4px">Orientación: ${Comp.etiquetaIdeo(p.eco)} · ${p.soc > 25 ? 'conservador' : p.soc < -25 ? 'progresista' : 'moderado'} en lo social</div></div></div>
        <div class="tarjeta"><h3>Opinión pública</h3>${G.medidor(pos, { tam: 130, etq: 'APOYO CIUDADANO', color: pos > 55 ? 'var(--bien)' : pos > 45 ? 'var(--alerta)' : 'var(--mal)' })}
          <div class="fila" style="margin-top:6px">${p.apoyan.map(a => `<span class="etq verde">+ ${esc(a)}</span>`).join('')}${p.opuestos.map(a => `<span class="etq rojo">− ${esc(a)}</span>`).join('')}</div></div>
        <div class="tarjeta"><h3>Postura de las bancadas</h3><div class="lista">${bancadas.map(({ pa, pos }) => `<div class="it" style="padding:4px"><i class="pto" style="background:${pa.color}"></i><div class="cuerpo"><b style="font-size:12.5px">${esc(pa.sigla)}</b></div><span class="etq ${pos === 'si' ? 'verde' : pos === 'no' ? 'rojo' : ''}">${pos === 'si' ? 'A favor' : pos === 'no' ? 'En contra' : 'Libertad'}</span></div>`).join('')}</div></div>
      </div>
      <div class="tarjeta" style="margin-top:14px"><h3>Impacto esperado si se convierte en ley</h3>
        <div class="grid g3">${['i', 'm', 'l'].map(k => `<div><div class="plazo">${PLAZO[k]}<span class="tenue"> · ${{ i: '1-6 semanas', m: '6-12 meses', l: '2-4 años' }[k]}</span></div>${(grupos[k] || []).map(e => { const bueno = MALO[e.v] ? e.d < 0 : e.d > 0; return `<div class="efecto ${bueno ? 'bien' : 'mal'}"><span>${esc(VAR[e.v] || e.v)}</span><b>${U.signo(e.d, 1)}${['educacion', 'salud', 'seguridad', 'infraestructura', 'confianza', 'aprobacion'].includes(e.v) ? ' pts' : ' pp'}</b></div>`; }).join('') || '<div class="tenue" style="font-size:12px">—</div>'}</div>`).join('')}</div>
        ${p.costo > 0 ? `<div class="tenue" style="font-size:12px;margin-top:8px">⚠ Si no se financia, el gasto aumenta el déficit y, con él, la deuda y las tasas de interés.</div>` : ''}</div>`;
    },
    tabNegociacion(E, p) {
      let cam = L.camaraDeEtapa(p), inf = L.infoEtapa(p) || {};
      // Recién radicado: se proyecta el primer debate en comisión
      if (L.etapaActual(p) === 'radicacion') { cam = p.origen; inf = C.DATA.tramite.etapas.comision1; }
      if (!cam || !inf.instancia) return `<div class="vacio">El proyecto está en ${esc(inf.nombre || p.sub)}. No hay votación próxima.</div>`;
      const pr = L.proyectar(E, p, cam, inf.instancia);
      const ms = L.miembrosInstancia(E, p, cam, inf.instancia);
      const votos = {}; for (const pol of ms) votos[pol.id] = pr.previo[pol.id] === 'duda' ? 'duda' : pr.previo[pol.id];
      const indecisos = ms.filter(x => x.id !== 'J' && pr.previo[x.id] !== 'si').map(x => ({ x, ps: L.probSi(L.factores(E, x, p, cam)) })).sort((a, b) => b.ps - a.ps).slice(0, 8);
      const partidos = [...new Set(ms.map(x => x.partido).filter(x => x && E.partidos[x] && !E.partidos[x].especial))];
      const J = E.jugador, esVotante = ms.some(x => x.id === 'J');
      const miVoto = (J.votos || {})[p.id] || 'bancada';
      const lugar = inf.instancia === 'comision' ? `Comisión ${C.DATA.comisiones[p.comision - 1].nombre} ${C.Congreso.delCamara(cam)}` : `Plenaria ${C.Congreso.delCamara(cam)}`;
      return `<div class="grid g2">
        <div class="tarjeta"><div class="t-cab"><h3>Conteo de votos · ${esc(lugar)}</h3><span class="etq">${p.sub === 'agenda' ? 'En orden del día' : 'Ponencia en curso'}</span></div>
          ${C.Hemiciclo.svg(E, cam, { miembros: ms, modo: 'voto', votos, centroTxt: pr.si, centroSub: 'VOTOS PROBABLES A FAVOR', altoMax: 300 })}
          <div class="leyenda"><span><i style="background:var(--si)"></i>Probable sí</span><span><i style="background:var(--no)"></i>Probable no</span><span><i style="background:#3a4a66"></i>Indeciso</span></div>
          <div class="distancia ${pr.distancia <= 0 ? 'ok' : ''}"><div><span>DISTANCIA DE MAYORÍA</span><b>${pr.distancia <= 0 ? 'Mayoría asegurada (+' + (-pr.distancia) + ')' : 'Faltan ' + pr.distancia + ' ' + U.plural(pr.distancia, 'voto')}</b></div><div class="tenue" style="font-size:12px;text-align:right">Mayoría ${pr.req}: ${pr.necesarios} votos<br>Proyección: ${pr.si} sí · ${pr.no} no</div></div>
          ${esVotante ? `<div class="fila" style="margin-top:10px;justify-content:space-between"><b>Tu voto</b><div class="seg voto-sel">${[['bancada', 'Según bancada'], ['si', '🟢 Sí'], ['no', '🔴 No'], ['abs', '🟡'], ['aus', '⚪']].map(([k, n]) => `<button data-v="${k}" class="${miVoto === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>` : ''}
        </div>
        <div class="col">
          <div class="tarjeta"><h3>Congresistas por convencer</h3><div class="lista">${indecisos.map(({ x, ps }) => `<div class="it accion-form"><span data-ficha="${x.id}" style="cursor:pointer">${Comp.avatar(E, x, 30)}</span><div class="cuerpo"><b>${esc(x.nombre)}</b><span>${Comp.partido(E, x.partido)} · prob. sí ${Math.round(ps * 100)}% · ${Comp.relacion(x.relJ)}</span></div><input type="hidden" data-arg="sentido" value="si">${UI.botonAccion('cabildear', { proyecto: p.id, pol: x.id }, 'Cabildear', 'chico')}</div>`).join('') || '<div class="vacio">Nadie más por convencer.</div>'}</div></div>
          <div class="tarjeta"><h3>Negociar con bancadas</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Un acuerdo mueve a toda la bancada, pero acerca el texto a su posición.</div>
            <div class="fila">${partidos.map(pid => UI.botonAccion('negociarBancada', { proyecto: p.id, partido: pid }, `<i class="pto" style="background:${E.partidos[pid].color}"></i> ${esc(E.partidos[pid].sigla)} <span class="tenue">${p.bancadas[pid] || L.posicionBancada(E, pid, p) === 'si' ? '✔' : ''}</span>`, 'chico')).join('')}</div></div>
          <div class="tarjeta"><h3>Tus herramientas</h3>
            <div class="fila">${UI.botonAccion('coautor', { proyecto: p.id })}${UI.botonAccion('ponencia', { proyecto: p.id, sentido: 'positiva' }, 'Ser ponente (a favor)')}${UI.botonAccion('ponencia', { proyecto: p.id, sentido: 'negativa' }, 'Ponencia negativa')}</div>
            <div class="fila" style="margin-top:8px">${UI.botonAccion('intervenir', { proyecto: p.id, sentido: 'si' }, 'Intervenir a favor')}${UI.botonAccion('intervenir', { proyecto: p.id, sentido: 'no' }, 'Intervenir en contra')}${UI.botonAccion('presionMedios', { proyecto: p.id, sentido: 'si' }, 'Presión mediática')}</div>
            <div class="fila accion-form" style="margin-top:8px"><select data-arg="tipo"><option value="moderar">Enmienda: moderar alcances</option><option value="financiar">Enmienda: incluir financiación</option><option value="regional">Enmienda: beneficio regional</option><option value="endurecer">Enmienda: ampliar alcances</option></select>
              <select data-arg="region">${['Caribe', 'Andina', 'Pacífico', 'Orinoquía', 'Amazonía'].map(r => `<option>${r}</option>`).join('')}</select>${UI.botonAccion('enmienda', { proyecto: p.id })}</div>
          </div>
        </div></div>`;
    },

    /* ── Radicar un proyecto ── */
    radicar() {
      const E = C.E, J = E.jugador;
      const cfg = { plantilla: null, ambicion: 1, financiacion: 'sin', giroEco: 0, giroSoc: 0, titulo: '' };
      const m = UI.modal({ titulo: 'Radicar proyecto de ley', icono: '📥', clase: 'ancho', cuerpo: '' });
      const pintar = () => {
        if (!cfg.plantilla) {
          const pls = C.DATA.plantillasProyectos.filter(x => !x.gobierno || E.gobierno.presidente === 'J');
          const porSector = U.agrupar(pls, x => x.sector);
          m.cuerpo.innerHTML = `<p class="tenue" style="margin-top:0">Elige la iniciativa. Los temas que coinciden con tus intereses aparecen resaltados.</p>
            ${Object.entries(porSector).map(([s, arr]) => `<h3 class="sub-h">${C.DATA.sectores[s].icono} ${C.DATA.sectores[s].nombre} <span class="tenue">· Comisión ${C.DATA.comisiones[C.DATA.sectores[s].comision - 1].nombre}</span></h3>
              <div class="grid g3">${arr.map(x => `<div class="tarjeta clic plantilla ${J.intereses.includes(s) ? 'interes' : ''}" data-pl="${x.id}"><b>${esc(x.titulo)}</b>
                <div class="fila" style="margin-top:6px"><span class="etq">${C.DATA.tramite.tipos[x.tipo].nombre}</span><span class="etq ${x.pop > 10 ? 'verde' : x.pop < 0 ? 'rojo' : ''}">Popularidad ${x.pop > 0 ? '+' : ''}${x.pop}</span><span class="etq">${x.costo >= 0 ? 'Cuesta' : 'Recauda'} $${U.d1(Math.abs(x.costo))} bill.</span></div>
                <div style="margin-top:6px">${Comp.ideoBarra(x.eco)}</div></div>`).join('')}</div>`).join('')}`;
          return;
        }
        const pl = C.DATA.plantillasProyectos.find(x => x.id === cfg.plantilla);
        let costo = pl.costo * cfg.ambicion, eco = pl.eco + cfg.giroEco, soc = pl.soc + cfg.giroSoc, pop = pl.pop - (cfg.ambicion - 1) * 6;
        if (cfg.financiacion === 'impuesto' && costo > 0) { costo = 0; pop -= 5; eco -= 10; }
        if (cfg.financiacion === 'recorte' && costo > 0) { costo *= 0.2; pop -= 2; eco += 8; }
        const cam = J.camara || 'senado';
        const ps = pseudo(E, { eco, soc, costo, pop, sector: pl.sector, comision: C.DATA.sectores[pl.sector].comision });
        let si = 0; const ms = C.Congreso.miembros(E, cam);
        for (const pol of ms) si += pol.id === 'J' ? 1 : L.probSi(L.factores(E, pol, ps, cam));
        const may = C.Congreso.mayoria(E, cam);
        const afin = 1 - U.distIdeo(J.ideologia, { eco, soc });
        m.cuerpo.innerHTML = `<div class="grid g2">
          <div>
            <button class="btn chico fant" id="r-volver">← Cambiar iniciativa</button>
            <div class="campo" style="margin-top:8px"><label>Título del proyecto</label><input id="r-tit" value="${esc(cfg.titulo || pl.titulo)}"></div>
            <div class="campo"><label>Alcance: <b>${cfg.ambicion < 0.85 ? 'Modesto' : cfg.ambicion > 1.2 ? 'Ambicioso' : 'Estándar'}</b> (×${U.d1(cfg.ambicion)})</label><input type="range" id="r-amb" min="0.6" max="1.5" step="0.1" value="${cfg.ambicion}"><span class="tenue" style="font-size:12px">Más alcance = más efectos y más costo, pero más resistencia.</span></div>
            <div class="campo"><label>Financiación</label><div class="seg" id="r-fin">${[['sin', 'Sin fuente'], ['impuesto', 'Nuevo impuesto'], ['recorte', 'Recorte de gasto']].map(([k, n]) => `<button data-f="${k}" class="${cfg.financiacion === k ? 'activo' : ''}">${n}</button>`).join('')}</div></div>
            <div class="campo"><label>Matiz económico del articulado (${U.signo(cfg.giroEco, 0)})</label><input type="range" id="r-eco" min="-30" max="30" step="5" value="${cfg.giroEco}"></div>
            <div class="campo"><label>Matiz social del articulado (${U.signo(cfg.giroSoc, 0)})</label><input type="range" id="r-soc" min="-30" max="30" step="5" value="${cfg.giroSoc}"></div>
          </div>
          <div class="col">
            <div class="tarjeta"><h3>Vista previa</h3>
              <div class="grid g2">${Comp.kpi('Costo fiscal', (costo >= 0 ? '' : '−') + '$' + U.d1(Math.abs(costo)) + ' bill.', `<span class="${costo > 0 ? 'mal' : 'bien'}">${U.signo(C.Economia.impactoFiscal(costo))} pp déficit</span>`)}${Comp.kpi('Apoyo ciudadano', U.n(U.clamp(50 + pop * 1.4, 3, 97)) + '%')}</div>
              <div style="margin-top:10px">${Comp.ideoBarra(eco, soc)}</div>
              <div class="tenue" style="font-size:12px;margin-top:6px">Afinidad con tu ideología: <b>${Math.round(afin * 100)}%</b> ${afin < 0.6 ? '<span class="mal">(tu base podría no entenderlo)</span>' : ''}</div></div>
            <div class="tarjeta"><h3>Apoyo inicial estimado · Plenaria ${C.Congreso.delCamara(cam)}</h3>
              ${G.barrasH([{ etq: 'A favor', v: si, color: 'var(--si)' }], { max: ms.length, marca: may, fmt: v => U.n(v) + '/' + ms.length })}
              <div class="tenue" style="font-size:12px;margin-top:6px">${si >= may ? '✔ Parte con mayoría probable.' : `Necesitarás ${Math.ceil(may - si)} votos más: cabildeo, acuerdos con bancadas o presión pública.`}</div></div>
            <div class="tarjeta"><h3>Trámite</h3><div class="tenue" style="font-size:12.5px">${C.DATA.tramite.tipos[pl.tipo].nombre} · se radica en ${cam === "senado" ? "el Senado" : "la Cámara"} y va a la Comisión ${C.DATA.comisiones[C.DATA.sectores[pl.sector].comision - 1].nombre}. ${pl.tipo === 'acto' ? 'Requiere ocho debates en dos vueltas.' : 'Requiere cuatro debates y sanción presidencial.'} Debe aprobarse en máximo dos legislaturas.</div></div>
          </div></div>`;
      };
      m.pie = document.createElement('div'); m.pie.className = 'm-pie';
      m.el.querySelector('.modal').appendChild(m.pie);
      const pie = () => { m.pie.innerHTML = cfg.plantilla ? `<button class="btn" id="r-cancel">Cancelar</button><button class="btn prim" id="r-ok">📥 Radicar en la Secretaría <span class="coste">2 ◆</span></button>` : ''; };
      m.el.addEventListener('click', e => {
        const t = e.target.closest('[data-pl]'); if (t) { cfg.plantilla = t.dataset.pl; pintar(); pie(); return; }
        if (e.target.closest('#r-volver')) { cfg.plantilla = null; pintar(); pie(); return; }
        const f = e.target.closest('#r-fin [data-f]'); if (f) { cfg.financiacion = f.dataset.f; pintar(); return; }
        if (e.target.closest('#r-cancel')) return m.cerrar();
        if (e.target.closest('#r-ok')) {
          const r = UI.accion('radicar', { plantilla: cfg.plantilla, ambicion: cfg.ambicion, financiacion: cfg.financiacion, giroEco: cfg.giroEco, giroSoc: cfg.giroSoc, titulo: cfg.titulo || undefined });
          if (r.ok !== false) { m.cerrar(); P.expediente(r.proyecto); }
        }
      });
      m.el.addEventListener('change', e => {
        if (e.target.id === 'r-amb') { cfg.ambicion = +e.target.value; pintar(); }
        if (e.target.id === 'r-eco') { cfg.giroEco = +e.target.value; pintar(); }
        if (e.target.id === 'r-soc') { cfg.giroSoc = +e.target.value; pintar(); }
        if (e.target.id === 'r-tit') cfg.titulo = e.target.value;
      });
      pintar(); pie();
    },

    /* ── El jugador-presidente sanciona u objeta ── */
    sancion(id) {
      const E = C.E, p = E.proyectos[id];
      const quitar = () => { E.ui.sancionesPendientes = (E.ui.sancionesPendientes || []).filter(x => x !== id); };
      if (!p || p.sub !== 'decisionPresidente') { quitar(); return; }
      const m = UI.modal({ titulo: 'Despacho presidencial', icono: '✒', sinCerrar: true, cuerpo: `<p>El Congreso aprobó <b>«${esc(p.titulo)}»</b>. Como Presidente, puedes sancionarlo o devolverlo con objeciones.</p>${P.tabImpacto(E, p)}`,
        pie: `<button class="btn" data-d="objetar">⛔ Objetar</button><button class="btn prim" data-d="sancionar">✒ Sancionar como ley</button>` });
      m.el.addEventListener('click', e => {
        const b = e.target.closest('[data-d]'); if (!b) return;
        quitar();
        if (b.dataset.d === 'sancionar') L.convertirEnLey(E, p);
        else { p.etapas.splice(p.etapa + 1, 0, 'objecion'); p.etapa++; p.sub = 'agenda'; p.esperaHasta = E.fecha.t + 2; L.hist(E, p, 'El Presidente objeta el proyecto', 'negado'); }
        m.cerrar(); C.App.refrescar(); C.App.revisarPendientes();
      });
    }
  };
  C.Pantallas.proyectos = P;
})(window.CURUL);

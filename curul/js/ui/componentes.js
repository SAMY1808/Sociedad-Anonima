/* Componentes de interfaz: retratos, tarjetas de político, chips de partido, KPIs, rastreador de etapas. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, esc = U.esc, UI = C.UI;
  const PIEL = ['#F1C7A5', '#E0AC86', '#C68B62', '#A86F4B', '#8A5638', '#6B3F28'];
  const PELO = ['#1b1410', '#2e1f16', '#4a3222', '#6b4a2e', '#8c8c8c', '#cfcfcf', '#3a2415'];

  const Comp = {
    /* Retrato procedural (SVG) a partir de una semilla */
    avatar(E, pol, tam = 40) {
      if (!pol) return `<div class="avatar" style="width:${tam}px;height:${tam}px"></div>`;
      const s = pol.retrato || 1, r = k => ((s * 9301 + k * 49297) % 233280) / 233280;
      const piel = PIEL[Math.floor(r(1) * PIEL.length)], edad = U.anio() - pol.nac;
      const pelo = edad > 62 && r(2) > 0.4 ? PELO[4 + Math.floor(r(3) * 2)] : PELO[Math.floor(r(4) * 4)];
      const pid = pol.id === 'J' ? E.jugador.partido : pol.partido;
      const ropa = E.partidos[pid] ? E.partidos[pid].color : '#556070';
      const f = pol.genero === 'f';
      const pel = f ? `<path d="M14 30c-2-14 6-22 18-22s20 8 18 22c0 10-2 18-4 22h-6c3-8 3-16 1-24-5 3-12 4-18 3-2 7-2 14 1 21h-6c-3-5-5-12-4-22z" fill="${pelo}"/>`
                    : (r(5) > 0.8 && edad > 45 ? `<path d="M17 24c1-9 7-13 15-13s14 4 15 13c-3-4-6-6-15-6s-12 2-15 6z" fill="${pelo}"/>` : `<path d="M16 27c-1-12 6-18 16-18s17 6 16 18c-2-6-5-9-16-9s-14 3-16 9z" fill="${pelo}"/>`);
      return `<svg class="avatar" width="${tam}" height="${tam}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1b2840"/>
        <path d="M8 66c2-13 12-19 24-19s22 6 24 19z" fill="${ropa}"/><path d="M26 47l6 8 6-8" fill="#e9edf3"/>${f ? '' : `<path d="M31 51l1 9 1-9z" fill="#222"/>`}
        <rect x="27" y="38" width="10" height="10" rx="3" fill="${piel}"/><ellipse cx="32" cy="30" rx="12" ry="14" fill="${piel}"/>${pel}
        <circle cx="27.5" cy="30" r="1.5" fill="#1d1d1d"/><circle cx="36.5" cy="30" r="1.5" fill="#1d1d1d"/><path d="M28 37q4 2.5 8 0" stroke="#7a4a3a" stroke-width="1.4" fill="none"/>
        ${!f && r(6) > 0.65 ? `<path d="M25 38q7 6 14 0" stroke="${pelo}" stroke-width="3" fill="none"/>` : ''}${r(7) > 0.8 ? `<g stroke="#222" stroke-width="1.2" fill="none"><circle cx="27.5" cy="30" r="3.5"/><circle cx="36.5" cy="30" r="3.5"/><path d="M31 30h2"/></g>` : ''}</svg>`;
    },
    partido(E, pid, conNombre) {
      const pa = E.partidos[pid];
      if (!pa) return `<span class="sigla"><i class="pto" style="background:${pid === 'MOV' ? '#F0D48A' : '#8C96A3'}"></i>${pid === 'MOV' ? 'Movimiento propio' : 'Sin partido'}</span>`;
      return `<span class="sigla"${UI.tt(esc(pa.nombre))}><i class="pto" style="background:${pa.color}"></i>${esc(conNombre ? pa.nombre : pa.sigla)}</span>`;
    },
    postura(p) { return { gobierno: '<span class="etq oro">Gobierno</span>', oposicion: '<span class="etq" style="background:rgba(94,141,240,.16);color:#9dbcff">Oposición</span>', independiente: '<span class="etq">Independiente</span>' }[p] || ''; },
    ideoBarra(eco, soc) {
      const x = v => (v + 100) / 2;
      return `<div style="display:flex;flex-direction:column;gap:3px;min-width:120px">
        <div style="position:relative;height:6px;border-radius:3px;background:linear-gradient(90deg,#C0504D,#7D8799,#4A7BE0)"><b style="position:absolute;left:calc(${x(eco)}% - 5px);top:-3px;width:10px;height:12px;border-radius:3px;background:#fff;border:2px solid #0A111D"></b></div>
        ${soc != null ? `<div style="position:relative;height:6px;border-radius:3px;background:linear-gradient(90deg,#26B59A,#7D8799,#B07A45)"><b style="position:absolute;left:calc(${x(soc)}% - 5px);top:-3px;width:10px;height:12px;border-radius:3px;background:#fff;border:2px solid #0A111D"></b></div>` : ''}</div>`;
    },
    etiquetaIdeo(eco) { return eco < -45 ? 'Izquierda' : eco < -15 ? 'Centroizquierda' : eco <= 15 ? 'Centro' : eco <= 45 ? 'Centroderecha' : 'Derecha'; },
    rolesDe(E, pol) {
      const roles = [];
      for (const cam of C.Congreso.CAMARAS) {
        const K = E.congreso[cam]; if (!K || !K.mesa) continue;
        if (K.mesa.presidente === pol.id) roles.push('Presidente ' + C.Congreso.delCamara(cam));
        if (K.mesa.vice1 === pol.id || K.mesa.vice2 === pol.id) roles.push('Vicepresidente ' + C.Congreso.delCamara(cam));
        for (const [pid, b] of Object.entries(K.bancadas || {})) if (b.vocero === pol.id) roles.push('Vocero de bancada');
        for (const com of Object.values(K.comisiones || {})) { if (com.presidente === pol.id) roles.push('Pdte. Comisión ' + C.DATA.comisiones[com.n - 1].nombre); if (com.vice === pol.id) roles.push('Vice Comisión ' + C.DATA.comisiones[com.n - 1].nombre); }
      }
      for (const pa of Object.values(E.partidos)) if (pa.lider === pol.id) roles.push('Líder del ' + pa.sigla);
      return roles;
    },
    relacion(v) { return v > 25 ? `<b class="bien">Aliado (${Math.round(v)})</b>` : v < -25 ? `<b class="mal">Hostil (${Math.round(v)})</b>` : `<b>Neutral (${Math.round(v)})</b>`; },
    /* Tarjeta del tooltip de una curul */
    tarjetaPolitico(E, id, voto) {
      const pol = E.politicos[id]; if (!pol) return '';
      const J = id === 'J';
      const pid = J ? E.jugador.partido : pol.partido;
      const com = J ? E.jugador.comision : pol.cargo && pol.cargo.comision;
      const circ = pol.cargo && pol.cargo.circ ? C.Congreso.nombreCirc(pol.cargo.circ) : (E.deptos[pol.depto] || {}).nombre;
      const roles = Comp.rolesDe(E, pol);
      const votoTxt = voto ? { si: '🟢 A favor', no: '🔴 En contra', abs: '🟡 Abstención', aus: '⚪ Ausente' }[voto] : '';
      return `<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${Comp.avatar(E, pol, 44)}<div><div class="tt-t" style="margin:0">${esc(pol.nombre)}${J ? ' (tú)' : ''}</div>${Comp.partido(E, pid)} <span class="tenue">· ${U.anio() - pol.nac} años</span></div></div>
        ${votoTxt ? `<div class="tt-f"><span>Voto</span><b>${votoTxt}</b></div>` : ''}
        <div class="tt-f"><span>Circunscripción</span><b>${esc(circ || '—')}</b></div>
        ${com ? `<div class="tt-f"><span>Comisión</span><b>${C.DATA.comisiones[com - 1].nombre}</b></div>` : ''}
        <div class="tt-f"><span>Ideología</span><b>${Comp.etiquetaIdeo(pol.eco)}</b></div>
        ${J ? '' : `<div class="tt-f"><span>Disciplina</span><b>${pol.r.dis}/100</b></div><div class="tt-f"><span>Relación contigo</span>${Comp.relacion(pol.relJ)}</div>`}
        ${roles.length ? `<div style="margin-top:5px;color:var(--oro2);font-size:11.5px">★ ${roles.map(esc).join(' · ')}</div>` : ''}`;
    },
    /* Ficha completa de un político (modal) */
    fichaPolitico(E, id) {
      const pol = E.politicos[id]; if (!pol) return;
      if (id === 'J') { C.App.ir('personaje'); return; }
      const roles = Comp.rolesDe(E, pol);
      const cam = pol.cargo && pol.cargo.camara;
      const proyCam = C.Legislacion.activos(E).filter(p => C.Legislacion.camaraDeEtapa(p) === cam);
      const cuerpo = `<div class="grid g2">
        <div class="col">
          <div class="fila">${Comp.avatar(E, pol, 84)}<div><h2 style="font-size:22px">${esc(pol.nombre)}</h2>
            <div class="tenue">${esc(C.Politicos.etiquetaCargo(E, pol))}</div><div class="fila" style="margin-top:6px">${Comp.partido(E, pol.partido, true)} ${Comp.postura(E.partidos[pol.partido] && E.partidos[pol.partido].postura)}</div></div></div>
          ${roles.length ? `<div class="fila">${roles.map(r => `<span class="etq oro">★ ${esc(r)}</span>`).join('')}</div>` : ''}
          <div class="tarjeta"><h3>Perfil</h3>
            <div class="tt-f"><span class="tenue">Edad</span><b>${U.anio() - pol.nac} años</b></div>
            <div class="tt-f"><span class="tenue">Región</span><b>${esc((E.deptos[pol.depto] || {}).nombre || '—')}</b></div>
            <div class="tt-f"><span class="tenue">Profesión</span><b>${esc(pol.profesion)}</b></div>
            <div class="tt-f"><span class="tenue">Intereses</span><b>${pol.intereses.map(s => C.DATA.sectores[s].nombre).join(', ')}</b></div>
            <div style="margin-top:8px">${Comp.ideoBarra(pol.eco, pol.soc)}<div class="tenue" style="font-size:11px;margin-top:3px">Económico: ${Comp.etiquetaIdeo(pol.eco)} · Social: ${pol.soc > 25 ? 'conservador' : pol.soc < -25 ? 'progresista' : 'moderado'}</div></div>
          </div>
          <div class="tarjeta"><h3>Relación contigo</h3><div style="font-size:18px">${Comp.relacion(pol.relJ)}</div></div>
        </div>
        <div class="col">
          <div class="tarjeta"><h3>Personalidad</h3>${C.Graf.barrasH([
            { etq: 'Ambición', v: pol.r.amb }, { etq: 'Disciplina', v: pol.r.dis }, { etq: 'Pragmatismo', v: pol.r.pra },
            { etq: 'Carisma', v: pol.r.car }, { etq: 'Integridad', v: pol.r.int }, { etq: 'Experiencia', v: pol.r.exp }].map(x => ({ ...x, color: '#6f86b3' })), { max: 100, fmt: v => U.n(v), anchoEtq: '88px' })}</div>
          <div class="tarjeta"><h3>Actividad</h3><div class="grid g3">
            <div class="kpi"><span class="v">${pol.stats.radicados}</span><span class="l">Proyectos</span></div>
            <div class="kpi"><span class="v">${pol.stats.aprobados}</span><span class="l">Leyes</span></div>
            <div class="kpi"><span class="v">${pol.stats.votos ? Math.round((1 - pol.stats.ausencias / Math.max(1, pol.stats.votos + pol.stats.ausencias)) * 100) : Math.round(pol.asistencia * 100)}%</span><span class="l">Asistencia</span></div></div></div>
          <div class="tarjeta"><h3>Trayectoria</h3><div class="lista">${pol.tray.slice().reverse().slice(0, 6).map(t => `<div class="it"><span class="tenue num" style="width:84px;font-size:11.5px">${U.fmtT(t.t)}</span><div class="cuerpo" style="font-size:12.5px">${esc(t.txt)}</div></div>`).join('') || '<div class="vacio">Sin registros</div>'}</div></div>
          ${cam && proyCam.length ? `<div class="tarjeta accion-form"><h3>Cabildear</h3><div class="fila">
            <select data-arg="proyecto" style="flex:1;min-width:0">${proyCam.map(p => `<option value="${p.id}">${esc(p.titulo)}</option>`).join('')}</select>
            <select data-arg="sentido"><option value="si">a favor</option><option value="no">en contra</option></select></div>
            <div style="margin-top:8px">${UI.botonAccion('cabildear', { pol: id }, 'Buscar su voto', 'prim')}</div></div>` : ''}
        </div></div>`;
      UI.modal({ titulo: 'Ficha política', icono: '👤', cuerpo, clase: 'medio' });
    },
    /* Rastreador del trámite de un proyecto */
    tramite(E, p, compacto) {
      const T = C.DATA.tramite;
      return `<div class="tramite ${compacto ? 'compacto' : ''}">${p.etapas.map((et, i) => {
        const def = T.etapas[et] || { nombre: et, icono: '•' };
        const est = i < p.etapa || p.estado === 'ley' ? 'hecha' : i === p.etapa ? (p.estado === 'archivado' ? 'muerta' : 'actual') : 'pend';
        const cam = C.Legislacion.camaraDeEtapa(p, et);
        return `<div class="paso ${est}" data-etapa="${i}"${UI.tt(`<b>${esc(def.nombre)}</b>${cam ? '<br>' + C.Congreso.nombreCamara(cam) : ''}`)}><span class="ic">${est === 'muerta' ? '✖' : est === 'hecha' ? '✔' : def.icono}</span>${compacto ? '' : `<span class="n">${esc(def.nombre.replace(' · ', '\n'))}</span>`}</div>`;
      }).join('<i class="lin"></i>')}</div>`;
    },
    estadoProyecto(p) {
      if (p.estado === 'ley') return `<span class="etq verde">✔ Ley ${p.ley}</span>`;
      if (p.estado === 'archivado') return `<span class="etq rojo">✖ Archivado</span>`;
      const sub = { radicado: 'Radicado', reparto: 'En reparto', ponencia: 'Ponencia en elaboración', agenda: 'En orden del día', sancion: 'En sanción', decisionPresidente: 'Despacho presidencial' }[p.sub] || p.sub;
      return `<span class="etq amar">${esc(sub)}</span>`;
    },
    kpi(l, v, d, extra) { return `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span>${d ? `<span class="d">${d}</span>` : ''}${extra || ''}</div>`; },
    delta(serie, n = 4, invertir, fmt) {
      if (!serie || serie.length < 2) return '';
      const a = serie[Math.max(0, serie.length - 1 - n)][1], b = serie[serie.length - 1][1], d = b - a;
      if (Math.abs(d) < 0.05) return '<span class="tenue">= estable</span>';
      const bueno = invertir ? d < 0 : d > 0;
      return `<span class="${bueno ? 'bien' : 'mal'}">${d > 0 ? '▲' : '▼'} ${fmt ? fmt(Math.abs(d)) : U.d1(Math.abs(d))}</span>`;
    },
    nombrePol(E, id) { return id === 'J' ? E.jugador.nombre : E.politicos[id] ? E.politicos[id].nombre : 'Político retirado'; }
  };
  C.Comp = Comp;
})(window.CURUL);

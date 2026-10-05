/* Componentes visuales reutilizables. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  const D = () => C.DATA;

  const Comp = {
    bandera: id => D().paises[id].bandera,

    partido(E, pid, largo) {
      const p = E.partidos[pid]; if (!p) return '—';
      const tt = `<div class="tt-t">${esc(p.nombre)}</div><div class="tt-f"><span>Familia</span><b>${esc(D().arquetipos[p.arq].nombre)}</b></div><div class="tt-f"><span>Grupo europeo</span><b>${esc(D().grupos[p.grupo].sigla)}</b></div><div class="tt-f"><span>Apoyo</span><b>${U.d1(p.pop)} %</b></div><div class="tt-f"><span>Líder</span><b>${esc((E.politicos[p.lider] || {}).n || '—')}</b></div>`;
      return `<span class="sigla"${UI.tt(tt)}><i class="pto" style="background:${p.color}"></i>${esc(largo ? p.nombre : p.sigla)}</span>`;
    },
    terTxt(t) { return t < -65 ? 'centralista' : t < -25 ? 'unitario' : t <= 25 ? 'autonomista moderado' : t <= 60 ? 'federalista' : t <= 85 ? 'soberanista' : 'independentista'; },
    postura(p) { return p === 'gobierno' ? '<span class="etq oro">Gobierno</span>' : p === 'apoyo' ? '<span class="etq amar">Apoyo externo</span>' : '<span class="etq">Oposición</span>'; },
    kpi(l, v, d) { return `<div class="kpi"><span class="v">${v}</span><span class="l">${l}</span>${d ? `<span class="d">${d}</span>` : ''}</div>`; },
    delta(serie, n = 8) {
      if (!serie || serie.length < 2) return '';
      const a = serie[Math.max(0, serie.length - 1 - n)][1], b = serie[serie.length - 1][1], d = b - a;
      if (Math.abs(d) < 0.05) return '<span class="tenue">=</span>';
      return `<span class="${d > 0 ? 'bien' : 'mal'}">${d > 0 ? '▲' : '▼'} ${U.d1(Math.abs(d))}</span>`;
    },
    avatar(E, pol, size = 32) {
      if (!pol) return `<span class="avatar" style="width:${size}px;height:${size}px"></span>`;
      const pa = E.partidos[pol.p]; const col = pa ? pa.color : '#667';
      return `<span class="avatar" style="width:${size}px;height:${size}px;background:${col};display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.38)}px;color:#0A111D">${esc(U.iniciales(pol.n))}</span>`;
    },
    ideoTxt(o) {
      const eco = o.eco < -45 ? 'izquierda' : o.eco < -15 ? 'centro-izquierda' : o.eco <= 15 ? 'centro' : o.eco <= 45 ? 'centro-derecha' : 'derecha';
      const soc = o.soc < -30 ? 'progresista' : o.soc > 30 ? 'conservador' : 'moderado';
      const eu = o.eu < -40 ? 'euroescéptico' : o.eu < 10 ? 'euroreticente' : o.eu < 50 ? 'europeísta' : 'federalista';
      return `${eco}, ${soc}, ${eu}`;
    },
    tarjetaPolitico(E, id, voto) {
      const m = E.politicos[id]; if (!m) return '';
      const pa = E.partidos[m.p], J = E.jugador;
      const VT = { si: 'A favor', no: 'En contra', abs: 'Abstención', aus: 'Ausente' };
      const cargo = m.cargo === 'pm' ? 'Presidente/a del Gobierno' : (m.cargo || '').startsWith('min:') ? 'Ministro/a de ' + (D().ministerios.find(x => x.id === m.cargo.slice(4)) || {}).nombre : m.cargo === 'presauto' ? 'Presidente/a autonómico/a' : m.cargo === 'alcalde' ? 'Alcalde/sa' : m.prov ? 'Diputado/a por ' + (D().provincias[m.prov] || ['España'])[0] : 'Diputado/a';
      return `<div class="tt-t">${esc(m.n)}${id === 'J' ? ' (tú)' : ''}</div><div class="tt-f"><span>Partido</span><b>${pa ? esc(pa.sigla) : '—'}</b></div><div class="tt-f"><span>Cargo</span><b>${esc(cargo)}</b></div>
        <div class="tt-f"><span>Perfil</span><b>${Comp.ideoTxt(m)}${m.ter != null ? ', ' + Comp.terTxt(m.ter) : ''}</b></div><div class="tt-f"><span>Disciplina</span><b>${m.d}</b></div>${id !== 'J' ? `<div class="tt-f"><span>Relación contigo</span><b>${U.signo(m.rel, 0)}</b></div>` : ''}
        ${voto ? `<div class="tt-f"><span>Voto</span><b>${VT[voto] || voto}</b></div>` : ''}`;
    },
    barraRango(v, col) { return `<div class="barra-h"><i style="width:${U.clamp(v, 0, 100)}%;background:${col || 'var(--oro)'}"></i></div>`; },
    etqEstado(P) { return P.estado === 'ue' ? '<span class="etq">Miembro UE</span>' : P.estado === 'exue' ? '<span class="etq rojo">Ex miembro</span>' : '<span class="etq amar">Candidato</span>'; },
    semanasA(E, t) { const s = t - E.fecha.t; return s <= 0 ? 'ya' : s < 9 ? s + ' sem.' : s < 104 ? Math.round(s / 4.345) + ' meses' : U.d1(s / 52) + ' años'; },
    nombreMin(id) { const m = D().ministerios.find(x => x.id === id); return m ? m.nombre : id; },
    etapa(e) { return ({ registro: 'Registro', ponencia: 'Ponencia y Comisión', pleno: 'Pleno del Congreso', pleno_pend: 'Pleno · votación', senado: 'Senado', vuelta: 'Vuelta al Congreso', vuelta_pend: 'Vuelta · votación', convalidacion: 'Convalidación (RDL)', convalidacion_pend: 'Convalidación · votación', sancionada: 'Aprobada', rechazada: 'Rechazada', archivada: 'Archivada' })[e] || e; },
    mayoriaTxt(m) { return m === 'organica' ? 'Ley orgánica (176 votos)' : m === 'cons' ? 'Reforma constitucional (3/5)' : 'Mayoría simple'; },
    ccaa(id) { return (D().ccaa[id] || { nombre: id }).nombre; },
    tonoEtapa(e) { return e === 'sancionada' ? 'verde' : e === 'rechazada' ? 'rojo' : e === 'archivada' ? '' : 'oro'; }
  };
  C.Comp = Comp;
})(window.ESP);

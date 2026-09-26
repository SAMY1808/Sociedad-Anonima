/* Votación nominal: hemiciclo animado, resultado, disciplina de bancada y “¿Qué pasó?”. */
window.CURUL = window.CURUL || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc, G = C.Graf, Comp = C.Comp, L = C.Legislacion, H = C.Hemiciclo;
  C.Pantallas = C.Pantallas || {};
  const NOMBRE_VOTO = { si: 'A favor', no: 'En contra', abs: 'Abstención', aus: 'Ausente' };
  const COLOR_F = { ideologia: '#A15BD1', partido: '#4A7BE0', gobierno: '#E0B54A', relacion: '#26B59A', regional: '#E8812A', opinion: '#6CC4F5', costo: '#C0504D', negociacion: '#5DB85A', interes: '#B07A45', ponencia: '#8C96A3', electoral: '#E0559A', statuquo: '#5D6C85', ruido: '#3a4a66' };

  const V = {
    abrir(vid) {
      const E = C.E, v = E.votaciones.find(x => x.id === vid);
      if (!v) return UI.toast('Esta votación ya no está en el archivo detallado', 'mal');
      const p = E.proyectos[v.proyecto];
      const r = v.resultado;
      const detalle = !!v.votos;
      const ms = detalle ? Object.keys(v.votos).map(id => E.politicos[id]).filter(Boolean) : [];
      const lugar = v.instancia === 'comision' ? `Comisión ${C.DATA.comisiones[p.comision - 1].nombre} · ${C.Congreso.nombreCamara(v.camara)}` : `Plenaria ${C.Congreso.delCamara(v.camara)}`;
      let tab = 'resultado';
      const m = UI.modal({ titulo: esc(p.titulo), icono: '🗳', clase: 'ancho', cuerpo: '' });
      const pintar = (animar) => {
        const tabs = `<div class="tabs"><button data-t="resultado" class="${tab === 'resultado' ? 'activo' : ''}">Resultado</button><button data-t="partidos" class="${tab === 'partidos' ? 'activo' : ''}">Por bancada</button>${v.factores ? `<button data-t="que" class="${tab === 'que' ? 'activo' : ''}">¿Qué pasó?</button>` : ''}</div>`;
        let cuerpo = '';
        if (tab === 'resultado') {
          cuerpo = `<div class="grid votacion-grid">
            <div class="tarjeta ${v.camara === 'senado' ? 'recinto-senado' : 'recinto-camara'}">
              <div class="tenue" style="font-size:12px">${esc(lugar)} · ${esc((C.DATA.tramite.etapas[v.etapa] || { nombre: v.etapa }).nombre)} · ${U.fmtT(v.t, false)}</div>
              ${detalle ? H.svg(E, v.camara, { miembros: ms, modo: 'voto', votos: animar ? {} : v.votos, centroTxt: animar ? '0' : r.si, centroSub: 'VOTOS A FAVOR', altoMax: 380 }) : `<div class="vacio">El detalle nominal de esta votación antigua ya no se conserva. Resultado: ${r.si} sí · ${r.no} no.</div>`}
              ${H.leyenda(E, v.camara, 'voto')}
              <div class="sello-voto ${animar ? 'oculto' : ''} ${r.aprobado ? 'ok' : 'no'}">${r.aprobado ? 'APROBADO' : 'NEGADO'}</div>
            </div>
            <div class="col">
              <div class="marcador">
                <div class="m-si"><b class="num" data-cnt="si">${animar ? 0 : r.si}</b><span>A favor</span></div>
                <div class="m-no"><b class="num" data-cnt="no">${animar ? 0 : r.no}</b><span>En contra</span></div>
                <div class="m-abs"><b class="num" data-cnt="abs">${animar ? 0 : r.abs}</b><span>Abstención</span></div>
                <div class="m-aus"><b class="num" data-cnt="aus">${animar ? 0 : r.aus}</b><span>Ausentes</span></div>
              </div>
              <div class="tarjeta"><h3>Regla de decisión</h3>
                <div class="tt-f"><span class="tenue">Mayoría requerida</span><b>${r.req === 'absoluta' ? 'Absoluta' : 'Simple'} · ${r.necesarios} votos</b></div>
                <div class="tt-f"><span class="tenue">Quórum decisorio</span><b>${r.quorum ? '✔ Hubo quórum' : '✖ Sin quórum'}</b></div>
                <div class="tt-f"><span class="tenue">Miembros</span><b>${r.n}</b></div>
                ${G.barrasH([{ etq: 'A favor', v: r.si, color: 'var(--si)' }, { etq: 'En contra', v: r.no, color: 'var(--no)' }], { max: r.n, marca: r.necesarios, fmt: v => U.n(v) })}</div>
              ${detalle && v.votos.J ? `<div class="tarjeta"><h3>Tu voto</h3><b style="font-size:18px">${{ si: '🟢', no: '🔴', abs: '🟡', aus: '⚪' }[v.votos.J]} ${NOMBRE_VOTO[v.votos.J]}</b></div>` : ''}
              <button class="btn" data-exp="${p.id}">📜 Ver expediente</button>
            </div></div>`;
        }
        if (tab === 'partidos') {
          const pp = v.porPartido || {};
          cuerpo = `<table class="tabla"><thead><tr><th>Bancada</th><th>Línea</th><th>Sí</th><th>No</th><th>Abst.</th><th>Aus.</th><th>Disciplina</th><th style="width:34%">Distribución</th></tr></thead><tbody>
            ${Object.entries(pp).sort((a, b) => (b[1].si + b[1].no + b[1].abs + b[1].aus) - (a[1].si + a[1].no + a[1].abs + a[1].aus)).map(([pid, x]) => {
              const pos = v.bancadas[pid], tot = x.si + x.no + x.abs + x.aus;
              return `<tr><td>${Comp.partido(E, pid)}</td><td><span class="etq ${pos === 'si' ? 'verde' : pos === 'no' ? 'rojo' : ''}">${pos === 'si' ? 'Votar sí' : pos === 'no' ? 'Votar no' : 'Libertad'}</span></td><td class="num">${x.si}</td><td class="num">${x.no}</td><td class="num">${x.abs}</td><td class="num">${x.aus}</td>
                <td class="num">${v.disciplina && v.disciplina[pid] != null ? `<b class="${v.disciplina[pid] >= 80 ? 'bien' : v.disciplina[pid] >= 60 ? 'alerta' : 'mal'}">${v.disciplina[pid]}%</b>` : '—'}</td>
                <td>${G.apilada([{ etq: 'Sí', v: x.si, color: 'var(--si)' }, { etq: 'No', v: x.no, color: 'var(--no)' }, { etq: 'Abstención', v: x.abs, color: 'var(--abs)' }, { etq: 'Ausentes', v: x.aus, color: 'var(--aus)' }], { total: tot, alto: 14 })}</td></tr>`;
            }).join('')}</tbody></table>
            <p class="tenue" style="font-size:12px">La disciplina mide qué porcentaje de los presentes de cada bancada votó según la línea acordada por su vocero.</p>`;
        }
        if (tab === 'que') cuerpo = V.quePaso(E, v, ms);
        m.cuerpo.innerHTML = tabs + cuerpo;
        if (animar && detalle) V.animar(m.cuerpo, v, ms);
      };
      m.cuerpo.addEventListener('click', e => {
        const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; pintar(false); return; }
        const x = e.target.closest('[data-exp]'); if (x) { m.cerrar(); C.Pantallas.proyectos.expediente(x.dataset.exp); return; }
        const f = e.target.closest('[data-ficha]'); if (f) Comp.fichaPolitico(E, f.dataset.ficha);
      });
      pintar(true);
    },
    /* Las curules cambian de color una a una, como en un tablero electrónico */
    animar(raiz, v, ms) {
      const orden = ms.map(x => x.id).sort(() => Math.random() - 0.5);
      const cnt = { si: 0, no: 0, abs: 0, aus: 0 };
      const paso = Math.max(1, Math.round(orden.length / 45));
      let i = 0;
      const tick = () => {
        if (!document.body.contains(raiz)) return;
        for (let k = 0; k < paso && i < orden.length; k++, i++) {
          const id = orden[i], voto = v.votos[id];
          const c = raiz.querySelector('#seat-' + CSS.escape(id));
          if (c) { c.setAttribute('fill', H.VOTO[voto]); c.dataset.voto = voto; c.classList.add('pulso-voto'); }
          cnt[voto]++;
        }
        for (const k of Object.keys(cnt)) { const b = raiz.querySelector(`[data-cnt="${k}"]`); if (b) b.textContent = cnt[k]; }
        const centro = raiz.querySelector('.h-centro'); if (centro) centro.textContent = cnt.si;
        if (i < orden.length) setTimeout(tick, 28);
        else { const s = raiz.querySelector('.sello-voto'); if (s) s.classList.remove('oculto'); }
      };
      setTimeout(tick, 250);
    },
    /* Explicación de la votación */
    quePaso(E, v, ms) {
      const vivos = ms.filter(m => m.id !== 'J' && v.factores[m.id]);
      // Contribución neta de cada factor a la cámara
      const tot = {}; const abs = {};
      for (const m of vivos) { const f = L.factoresDe(v, m.id); for (const [k, x] of Object.entries(f)) { tot[k] = (tot[k] || 0) + x; abs[k] = (abs[k] || 0) + Math.abs(x); } }
      const n = vivos.length || 1;
      const imp = Object.keys(L.FACTORES).filter(k => abs[k] > 0.1).map(k => ({ k, neto: tot[k] / n, peso: abs[k] / n })).sort((a, b) => b.peso - a.peso);
      const maxPeso = Math.max(...imp.map(x => Math.abs(x.neto)), 1);
      // Quién cambió respecto al conteo previo
      const cambios = vivos.filter(m => {
        const pre = v.previo && v.previo[m.id], fin = v.votos[m.id];
        return pre && fin !== 'aus' && ((pre === 'si' && fin !== 'si') || (pre === 'no' && fin === 'si') || (pre === 'duda' && (fin === 'si' || fin === 'no')));
      });
      const rebeldes = vivos.filter(m => { const pos = v.bancadas[m.partido]; return pos && pos !== 'libre' && v.votos[m.id] !== 'aus' && v.votos[m.id] !== pos; });
      const razon = m => {
        const f = L.factoresDe(v, m.id), dir = v.votos[m.id] === 'si' ? 1 : -1;
        return Object.entries(f).filter(([k]) => k !== 'ruido').sort((a, b) => b[1] * dir - a[1] * dir).slice(0, 2).filter(([k, x]) => x * dir > 0.5).map(([k, x]) => `<span class="etq" style="background:${COLOR_F[k]}33;color:#dfe6f2">${esc(L.FACTORES[k])} ${U.signo(x)}</span>`).join(' ') || '<span class="tenue">decisión personal de último momento</span>';
      };
      const fila = m => `<div class="it"><span data-ficha="${m.id}" style="cursor:pointer">${Comp.avatar(E, m, 30)}</span><div class="cuerpo"><b>${esc(m.nombre)}</b><span>${Comp.partido(E, m.partido)} · ${v.previo ? { si: 'iba a votar sí', no: 'iba a votar no', duda: 'estaba indeciso' }[v.previo[m.id]] + ' → ' : ''}<b style="color:var(--texto)">${NOMBRE_VOTO[v.votos[m.id]]}</b></span><div style="margin-top:3px">${razon(m)}</div></div></div>`;
      return `<div class="grid g2">
        <div class="tarjeta"><h3>Qué pesó en la decisión</h3><div class="tenue" style="font-size:12px;margin-bottom:8px">Efecto neto promedio de cada factor (hacia el sí → derecha; hacia el no ← izquierda).</div>
          ${imp.map(x => `<div class="factor"${UI.tt(`<b>${esc(L.FACTORES[x.k])}</b><br>Efecto neto: ${U.signo(x.neto)}<br>Intensidad media: ${U.d1(x.peso)}`)}><span>${esc(L.FACTORES[x.k])}</span><div class="eje-div"><i style="${x.neto >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(x.neto) / maxPeso * 50}%;background:${COLOR_F[x.k]}"></i></div><b class="num">${U.signo(x.neto)}</b></div>`).join('')}</div>
        <div class="col">
          <div class="tarjeta"><h3>Cambiaron de posición (${cambios.length})</h3><div class="tenue" style="font-size:12px;margin-bottom:6px">Frente al conteo previo a la sesión.</div><div class="lista" style="max-height:300px;overflow:auto">${cambios.slice(0, 20).map(fila).join('') || '<div class="vacio">Nadie cambió: el conteo previo se cumplió.</div>'}</div></div>
          <div class="tarjeta"><h3>Se apartaron de su bancada (${rebeldes.length})</h3><div class="lista" style="max-height:260px;overflow:auto">${rebeldes.slice(0, 20).map(fila).join('') || '<div class="vacio">Disciplina total.</div>'}</div></div>
        </div></div>`;
    }
  };
  C.Pantallas.votacion = V;
})(window.CURUL);

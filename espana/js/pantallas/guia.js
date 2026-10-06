/* Guía y asesor de carrera. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  C.Pantallas.guia = {
    render(el) {
      const E = C.E, Gd = C.Guia, sug = Gd.sugerencias(E), pr = Gd.progreso(E), sem = Math.round(E.fecha.t);
      const tarea = (ok, txt, pantalla) => `<div class="it"><span style="font-size:16px">${ok ? '✅' : '⬜'}</span><div class="cuerpo" style="flex:1">${esc(txt)}</div>${!ok && pantalla ? `<button class="btn chico" data-go="${pantalla}">Ir</button>` : ''}</div>`;
      const v = pr.vistas;
      el.innerHTML = `<div class="cab"><div><h1>🧭 Guía y asesor</h1><div class="sub">Qué hacer ahora y cómo se juega: semana ${sem}</div></div></div>
        <div class="tarjeta" style="border-color:var(--oro)"><div class="t-cab"><h3>💬 Tu asesor te recomienda</h3></div><div class="lista">${sug.map(s => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${s.ic}</span><div class="cuerpo" style="flex:1;min-width:200px;white-space:normal">${esc(s.txt)}</div>${s.ir ? `<button class="btn chico prim" data-go="${s.ir.pantalla}" ${s.ir.params ? `data-tab="${s.ir.params.tab || ''}"` : ''}>Abrir</button>` : ''}</div>`).join('') || '<div class="vacio" style="padding:10px">Nada urgente: avanza una semana.</div>'}</div></div>
        <div class="cuadricula-2" style="align-items:start"><div class="tarjeta"><div class="t-cab"><h3>🎓 Primeros pasos</h3><span class="etq">${pr.n}/${pr.tot} pestañas</span></div><div class="barra-h" style="height:8px;margin-bottom:8px"><i style="width:${pr.n / pr.tot * 100}%;background:var(--oro)"></i></div><div class="lista">${tarea(!!v.agenda, 'Abre la Agenda y gasta tus puntos de la semana', 'agenda')}${tarea(!!v.leyes, 'Mira las leyes en trámite', 'leyes')}${tarea(!!v.partido, 'Revisa a tu partido por dentro', 'partido')}${tarea(!!v.jefe, 'Conoce al jefe de gabinete (y delega)', 'jefe')}${tarea(!!v.medios, 'Consulta la prensa y las tendencias', 'medios')}${tarea(!!v.legado, 'Lee tu resumen semanal en Legado', 'legado')}</div></div>
        <div class="tarjeta"><div class="t-cab"><h3>🗺 Mapa de pestañas</h3></div><div class="lista" style="max-height:420px;overflow:auto">${Gd.MAPA.map(m => `<div class="it" style="flex-wrap:wrap"><span style="font-size:18px">${m[1]}</span><div class="cuerpo" style="flex:1;min-width:150px"><b>${esc(m[2])}</b>${v[m[0]] ? ' <span class="etq verde">visitada</span>' : ''}<div class="tenue" style="font-size:11px;white-space:normal">${esc(m[3])}</div></div><button class="btn chico" data-go="${m[0]}">Ir</button></div>`).join('')}</div></div></div>`;
      UI.$$('[data-go]', el).forEach(b => b.onclick = () => C.App.ir(b.dataset.go, b.dataset.tab ? { tab: b.dataset.tab } : undefined));
    }
  };
})(window.ESP);

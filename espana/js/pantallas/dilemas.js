/* Dilemas: decisiones con reloj, capital político, asesores enfrentados y hemeroteca. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, UI = C.UI, esc = U.esc;
  C.Pantallas = C.Pantallas || {};
  const ASE = { jefe: ['🧑‍💼', 'Jefe/a de gabinete'], portavoz: ['🎙', 'Portavoz'], estratega: ['📊', 'Estratega'] };
  const col = v => v >= 60 ? 'var(--si,#3bb273)' : v >= 35 ? 'var(--oro)' : 'var(--no,#d9534f)';
  C.Pantallas.dilemas = {
    render(el) {
      const E = C.E; if (E.jugador.pais !== 'ES') { el.innerHTML = '<div class="cab"><div><h1>⏳ Dilemas</h1></div></div><div class="tarjeta"><div class="vacio" style="padding:12px">Los dilemas sólo existen en la política española.</div></div>'; return; }
      const D = C.Dilemas, d = D.asegurar(E), as = D.asesores(E), t = E.fecha.t;
      let h = `<div class="cab"><div><h1>⏳ Dilemas</h1><div class="sub">Decisiones que caducan, cuestan capital político y vuelven a la hemeroteca</div></div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>💰 Capital político</h3><span class="etq">${Math.round(d.capital)} / 100</span></div><div class="barra-h" style="height:10px"><i style="width:${d.capital}%;background:var(--oro)"></i></div><div class="tenue" style="font-size:12px;margin-top:6px">Se recupera poco a poco (+0,4 por semana). Las decisiones audaces lo gastan; no decidir a tiempo aplica la opción más cómoda.</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>🗣 Tus asesores</h3></div><div class="fila" style="gap:14px;flex-wrap:wrap">${Object.keys(ASE).map(k => `<div style="min-width:150px"><b>${ASE[k][0]} ${esc(as[k].n)}</b><div class="tenue" style="font-size:11.5px">${ASE[k][1]} · confianza ${Math.round(as[k].conf)}</div><div class="barra-h" style="height:6px"><i style="width:${as[k].conf}%;background:${col(as[k].conf)}"></i></div></div>`).join('')}</div><div class="tenue" style="font-size:11.5px;margin-top:6px">Si sigues su consejo gana confianza; si los desoyes siempre, acabarán filtrando discrepancias.</div></div>`;
      h += d.act.length ? d.act.map(x => { const def = D.CAT[x.id], dias = Math.max(0, x.limite - t); return `<div class="tarjeta" style="border-left:3px solid ${dias <= 1 ? 'var(--no,#d9534f)' : 'var(--oro)'}"><div class="t-cab"><h3>${def.ic} ${esc(def.n)}</h3><span class="etq ${dias <= 1 ? 'rojo' : ''}">⏱ ${dias} sem.</span></div><p style="margin:4px 0 10px">${esc(def.txt(E, x))}</p>
        <div class="lista">${def.op.map(o => { const consejo = Object.keys(def.as).filter(a => def.as[a] === o.k).map(a => ASE[a][0] + ' ' + ASE[a][1]); const caro = (o.cap || 0) > d.capital; return `<div class="it" style="flex-wrap:wrap"><div class="cuerpo" style="flex:1;min-width:200px;white-space:normal"><b>${esc(o.t)}</b>${o.cap ? ` <span class="etq">−${o.cap} capital</span>` : ''}<div class="tenue" style="font-size:12px">${esc(o.d)}</div>${consejo.length ? `<div style="font-size:11.5px;color:var(--oro)">Aconsejan: ${esc(consejo.join(', '))}</div>` : ''}</div>${UI.botonAccion('resolver_dilema', { uid: x.uid, k: o.k }, 'Decidir', 'chico', caro)}</div>`; }).join('')}</div>
        <div class="tenue" style="font-size:11.5px;margin-top:6px">Si no decides, se aplica: <b>${esc(def.op[def.defecto].t)}</b>.</div></div>`; }).join('') : `<div class="tarjeta"><div class="vacio" style="padding:12px">No hay ningún dilema abierto. Surgirán sin avisar: filtraciones, socios que aprietan, barones, amigos salpicados…</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>📰 Hemeroteca</h3><span class="etq">${d.memoria.filter(m => !m.cobrado).length} pendientes de cobrar</span></div><div class="lista">${d.memoria.slice(0, 8).map(m => `<div class="it"><span class="etq">${U.fmtT(m.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px">${esc(m.txt)}</div><span class="etq ${m.cobrado ? '' : 'rojo'}">${m.cobrado ? 'cobrada' : 'latente'}</span></div>`).join('') || '<div class="vacio" style="padding:10px">Nada que te persiga… todavía.</div>'}</div></div>`;
      h += `<div class="tarjeta"><div class="t-cab"><h3>Historial</h3></div><div class="lista">${d.hist.slice(0, 10).map(x => `<div class="it"><span class="etq">${U.fmtT(x.t, true)}</span><div class="cuerpo" style="flex:1;white-space:normal;font-size:12.5px"><b>${esc(x.txt)}</b><div class="tenue">${esc(x.res || '')}</div></div></div>`).join('') || '<div class="vacio" style="padding:10px">Sin decisiones aún.</div>'}</div></div>`;
      el.innerHTML = h;
    }
  };
})(window.ESP);

const { cargar } = require('./headless');
const C = cargar();
const res = {};
for (const pais of ['ES','DE','FR','IT','PL','UK','NL','HU','SE','RO']) {
  const E = C.Mundo.nueva({ semilla: 777, pais, partido: pais + '_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
  for (let w = 0; w < 52 * 8; w++) {
    for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
      if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') E.elecciones.nochePendiente = null; }
    C.Tiempo.avanzar();
  }
  const ps = Object.values(E.proyectos);
  const por = {};
  ps.forEach(p => { const k = p.autor.tipo; por[k] = por[k] || { ok: 0, ko: 0, otro: 0 }; if (p.etapa === 'sancionada') por[k].ok++; else if (p.etapa === 'rechazada') por[k].ko++; else por[k].otro++; });
  const g = E.paises[pais].gob;
  console.log(pais, JSON.stringify(por), 'gob', g.coalicion.length, g.tipo, 'estab', g.estab.toFixed(0), 'aprob', g.aprob.toFixed(0), 'elecs', E.elecciones.historico.length);
}

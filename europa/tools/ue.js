const { cargar } = require('./headless');
const C = cargar();
const E = C.Mundo.nueva({ semilla: 99, pais: 'ES', partido: 'ES_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
for (let w = 0; w < 52 * 10; w++) {
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; }
  C.Tiempo.avanzar();
}
const h = E.ue.historico;
console.log('hist', h.length, 'ok', h.filter(x => x.ok).length);
const ex = Object.values(E.ue.expedientes);
ex.slice(0, 40).forEach(e => console.log(e.estado, '|', e.t.slice(0, 50), '|', e.resultado, e.cons ? `C:${e.cons.si}/${e.cons.no}/${e.cons.abs}` : '', e.pe ? `PE:${e.pe.si}/${e.pe.no}` : ''));
console.log(E.noticias.filter(n => n.tipo === 'europa').slice(0, 15).map(n => C.U.fmtT(n.t, true) + ' ' + n.texto).join('\n'));
console.log('Miembros', C.UE.miembros(E).length, Object.keys(E.paises).filter(c => E.paises[c].estado === 'candidato').map(c => c + ':' + E.paises[c].ue.progreso.toFixed(0)).join(' '));

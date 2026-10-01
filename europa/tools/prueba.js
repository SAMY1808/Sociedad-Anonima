const { cargar } = require('./headless');
const C = cargar();
const pais = process.argv[2] || 'ES', anios = +(process.argv[3] || 6);
const t0 = Date.now();
const E = C.Mundo.nueva({ semilla: 12345, pais, partido: pais + '_0', nombre: 'Test Jugador', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {carisma:4,oratoria:4,gestion:3,negociacion:4,integridad:4}, rol: 'base' });
console.log('mundo generado en', Date.now() - t0, 'ms. Jugador:', E.jugador.cargo, E.jugador.rol, 'electo', E.jugador.electo);
const P = E.paises[pais];
console.log('Escaños:', JSON.stringify(P.escanos));
console.log('Gobierno:', P.gob.partido, P.gob.coalicion.join(','), P.gob.tipo, 'estab', P.gob.estab.toFixed(0), 'aprob', P.gob.aprob.toFixed(0));
console.log('PE:', JSON.stringify(E.ue.pe.escanos), 'total', E.ue.pe.total);
console.log('Comisión pres:', E.ue.comision.presidente);
console.log('Miembros UE:', C.UE.miembros(E).length);
let errores = 0;
for (let w = 0; w < 52 * anios; w++) {
  // resolver bloqueos automáticamente
  for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) {
    const b = C.Tiempo.bloqueo();
    if (b === 'evento') C.Eventos.resolver(E, 0, 0);
    else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); }
    else if (b === 'ue') C.UE.decidir(E, 0, 'si');
    else if (b === 'noche') E.elecciones.nochePendiente = null;
  }
  C.Tiempo.avanzar();
}
console.log('Fecha', C.U.fmtT(E.fecha.t), '| cargo', C.Personaje.cargoTxt(E), 'edad', E.jugador.edad, 'prest', E.jugador.prestigio.toFixed(0));
console.log('Gobierno:', E.paises[pais].gob.coalicion.join(','), E.paises[pais].gob.tipo, 'aprob', E.paises[pais].gob.aprob.toFixed(0));
console.log('Leyes aprobadas:', Object.values(E.proyectos).filter(p => p.etapa === 'sancionada').length, 'rechazadas:', Object.values(E.proyectos).filter(p => p.etapa === 'rechazada').length);
console.log('Exp UE históricos:', E.ue.historico.length, 'adoptados', E.ue.historico.filter(h => h.ok).length);
console.log('Noticias:', E.noticias.slice(0, 8).map(n => n.texto).join('\n  '));
console.log('JSON tamaño KB:', (JSON.stringify(E).length / 1024).toFixed(0));

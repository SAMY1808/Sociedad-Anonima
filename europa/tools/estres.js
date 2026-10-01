const { cargar } = require('./headless');
const C = cargar();
function avanzar(E, n) {
  for (let w = 0; w < n; w++) {
    for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
      if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; }
    C.Tiempo.avanzar();
  }
}
for (const pais of ['ES', 'UK', 'UA', 'DE', 'MT']) {
  const E = C.Mundo.nueva({ semilla: 31, pais, partido: pais + '_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: {}, rol: 'base' });
  avanzar(E, 60);
  // Salida de un país
  C.UE.salir(E, pais === 'DE' ? 'FR' : 'DE'); avanzar(E, 40);
  // Adhesión de un candidato
  C.UE.adherir(E, 'ME'); avanzar(E, 40);
  // referéndum en el país del jugador
  C.UE.referendum(E, pais); avanzar(E, 30);
  // Forzar jugador a PM
  const J = E.jugador, P = E.paises[pais];
  if (P.estado === 'ue') {
    E.partidos[J.partido].lider = 'J'; J.rol = 'lider'; P.gob.partido = J.partido; P.gob.coalicion = [J.partido]; P.gob.pm = 'J'; C.Gobierno.repartirMinisterios(E); C.Personaje.sincronizar(E);
    const pend0 = E.ue.pendiente.length; avanzar(E, 120);
    console.log(pais, 'PM?', J.cargo, 'votos UE decididos', E.ue.historico.length, 'miembros', C.UE.miembros(E).length);
  } else console.log(pais, 'estado', P.estado, 'miembros', C.UE.miembros(E).length);
  // Elecciones europeas y comisión
  C.UE.celebrarPE(E); avanzar(E, 20);
  // guardar/cargar roundtrip
  const txt = JSON.stringify(E); const E2 = JSON.parse(txt); C.Estado.migrar(E2); C.E = E2; avanzar(E2, 20);
  console.log('  ok', pais, C.U.fmtT(E2.fecha.t), 'KB', (txt.length / 1024).toFixed(0));
}

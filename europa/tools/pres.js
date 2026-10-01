const { cargar } = require('./headless');
const C = cargar();
for (const pais of ['FR', 'TR', 'CY', 'PL', 'UA']) {
  const E = C.Mundo.nueva({ semilla: 5, pais, partido: pais + '_1', nombre: 'T', trayectoria: 'concejal', genero: 'm', edad: 38, atrib: { carisma: 9, oratoria: 8, gestion: 5, negociacion: 5, integridad: 5 }, rol: 'base' });
  const P = E.paises[pais];
  console.log(pais, 'presidente inicial', (E.politicos[P.pres.pol] || {}).n, E.partidos[P.pres.partido].sigla, 'gob', P.gob.partido === P.pres.partido, 'cohab', P.flags.cohab, 'proxT', C.U.fmtT(P.pres.proxT));
  for (let w = 0; w < 52 * 12; w++) {
    for (let g = 0; g < 20 && C.Tiempo.bloqueo(); g++) { const b = C.Tiempo.bloqueo();
      if (b === 'evento') C.Eventos.resolver(E, 0, 0); else if (b === 'voto') { const id = E.parl.pendienteVoto.shift(); C.Parlamento.resolver(E, E.proyectos[id], null); } else if (b === 'ue') C.UE.decidir(E, 0, 'si'); else if (b === 'noche') { E.elecciones.nochePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; E.elecciones.presPendiente = null; E.elecciones.pePendiente = null; } }
    C.Tiempo.avanzar();
  }
  console.log('  tras 12 años:', (E.politicos[P.pres.pol] || {}).n, E.partidos[P.pres.partido].sigla, 'mandatos', P.pres.mandatos, 'cohab', P.flags.cohab);
  console.log('  ', E.noticias.filter(n => /presidencia/.test(n.texto) && n.pais === pais).slice(0, 3).map(n => n.texto).join(' | '));
}

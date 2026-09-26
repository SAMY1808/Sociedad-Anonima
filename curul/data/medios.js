/* Ecosistema de medios ficticio. linea: -100 izquierda … +100 derecha. */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
CURUL.DATA.medios = [
  { id:'tvc', nombre:'Telecóndor', tipo:'Televisión', audiencia:34, linea:35, credibilidad:58, region:null, icono:'📺' },
  { id:'cn1', nombre:'Canal Nacional Uno', tipo:'Televisión', audiencia:26, linea:5, credibilidad:62, region:null, icono:'📺' },
  { id:'rad', nombre:'Radio Andina', tipo:'Radio', audiencia:28, linea:15, credibilidad:66, region:null, icono:'📻' },
  { id:'onp', nombre:'Onda Popular', tipo:'Radio', audiencia:22, linea:-25, credibilidad:54, region:null, icono:'📻' },
  { id:'hnac', nombre:'El Heraldo Nacional', tipo:'Prensa', audiencia:16, linea:-5, credibilidad:72, region:null, icono:'📰' },
  { id:'gac', nombre:'La Gaceta Republicana', tipo:'Prensa', audiencia:11, linea:55, credibilidad:60, region:null, icono:'📰' },
  { id:'ctx', nombre:'Revista Contexto', tipo:'Prensa', audiencia:12, linea:45, credibilidad:55, region:null, icono:'📰' },
  { id:'exp', nombre:'Expediente Digital', tipo:'Portal digital', audiencia:14, linea:-20, credibilidad:74, region:null, icono:'💻' },
  { id:'lsp', nombre:'La Silla Pública', tipo:'Portal digital', audiencia:10, linea:-5, credibilidad:76, region:null, icono:'💻' },
  { id:'red', nombre:'Tendencias en redes', tipo:'Redes sociales', audiencia:48, linea:0, credibilidad:30, region:null, icono:'📱' },
  { id:'pcar', nombre:'Pulso Caribe', tipo:'Regional', audiencia:9, linea:0, credibilidad:60, region:'Caribe', icono:'📡' },
  { id:'vpac', nombre:'Voces del Pacífico', tipo:'Regional', audiencia:6, linea:-35, credibilidad:62, region:'Pacífico', icono:'📡' },
  { id:'dmon', nombre:'Diario de la Montaña', tipo:'Regional', audiencia:9, linea:40, credibilidad:63, region:'Andina', icono:'📡' },
  { id:'llan', nombre:'Llano Siete Días', tipo:'Regional', audiencia:4, linea:30, credibilidad:58, region:'Orinoquía', icono:'📡' }
];

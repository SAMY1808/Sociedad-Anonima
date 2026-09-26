/* Departamentos y Bogotá D.C. — datos base (población en miles, aproximados).
   pobreza: % pobreza monetaria · desempleo: % · educ/salud/seg/infra: índice 0-100
   incl: inclinación ideológica económica (-1 izquierda … +1 derecha)
   maq: peso de maquinarias clientelares (0-1) · camara: curules territoriales */
window.CURUL = window.CURUL || {};
CURUL.DATA = CURUL.DATA || {};
CURUL.DATA.departamentos = [
 // id,  nombre,                capital,          región,      pob,  pibPc, pobreza, desempl, educ, salud, seg, infra, incl,  maq, camara
 ['ANT','Antioquia','Medellín','Andina',6950,31,26,9.8,68,66,52,64,0.45,0.45,17],
 ['ATL','Atlántico','Barranquilla','Caribe',2820,22,33,10.5,62,60,50,62,0.05,0.70,7],
 ['BOG','Bogotá D.C.','Bogotá','Andina',7970,42,24,10.2,76,72,55,70,-0.20,0.25,18],
 ['BOL','Bolívar','Cartagena','Caribe',2260,24,43,10.9,55,54,48,50,-0.05,0.75,6],
 ['BOY','Boyacá','Tunja','Andina',1270,27,33,8.9,70,62,72,52,0.12,0.45,6],
 ['CAL','Caldas','Manizales','Andina',1030,22,29,11.8,68,64,62,58,0.25,0.50,5],
 ['CAQ','Caquetá','Florencia','Amazonía',420,14,44,11.0,52,50,40,34,0.30,0.55,2],
 ['CAU','Cauca','Popayán','Pacífico',1550,14,55,11.5,50,50,30,36,-0.50,0.50,4],
 ['CES','Cesar','Valledupar','Caribe',1350,19,49,13.2,52,52,48,44,0.10,0.70,4],
 ['COR','Córdoba','Montería','Caribe',1860,13,53,11.6,50,52,44,40,0.05,0.80,5],
 ['CUN','Cundinamarca','Bogotá','Andina',3450,28,22,9.0,70,64,64,62,0.15,0.50,7],
 ['CHO','Chocó','Quibdó','Pacífico',560,8,66,17.0,40,38,34,20,-0.40,0.65,2],
 ['HUI','Huila','Neiva','Andina',1150,17,45,10.8,58,56,52,46,0.25,0.55,4],
 ['LAG','La Guajira','Riohacha','Caribe',1030,11,64,13.5,40,40,44,30,-0.25,0.75,2],
 ['MAG','Magdalena','Santa Marta','Caribe',1470,12,51,10.9,50,50,46,38,-0.20,0.75,5],
 ['MET','Meta','Villavicencio','Orinoquía',1100,33,32,11.7,60,58,54,50,0.35,0.50,3],
 ['NAR','Nariño','Pasto','Pacífico',1650,12,46,9.8,56,56,40,38,-0.55,0.45,5],
 ['NSA','Norte de Santander','Cúcuta','Andina',1710,14,50,14.2,54,54,36,44,0.40,0.55,5],
 ['QUI','Quindío','Armenia','Andina',560,19,36,13.6,64,62,56,58,0.35,0.45,3],
 ['RIS','Risaralda','Pereira','Andina',970,21,26,10.4,66,62,54,60,0.25,0.45,4],
 ['SAN','Santander','Bucaramanga','Andina',2350,34,30,9.9,70,66,62,60,0.35,0.45,7],
 ['SUC','Sucre','Sincelejo','Caribe',970,12,55,11.2,50,52,50,40,-0.10,0.80,3],
 ['TOL','Tolima','Ibagué','Andina',1360,19,38,11.4,60,58,54,50,0.30,0.55,6],
 ['VAL','Valle del Cauca','Cali','Pacífico',4600,29,29,11.9,66,64,40,62,-0.15,0.40,13],
 ['ARA','Arauca','Arauca','Orinoquía',310,24,44,13.0,52,50,26,34,0.20,0.60,2],
 ['CAS','Casanare','Yopal','Orinoquía',450,40,35,11.0,58,56,58,44,0.50,0.55,2],
 ['PUT','Putumayo','Mocoa','Amazonía',370,13,45,12.4,50,48,34,30,-0.35,0.55,2],
 ['SAP','San Andrés y Providencia','San Andrés','Insular',64,24,22,8.0,64,58,66,52,0.10,0.55,2],
 ['AMA','Amazonas','Leticia','Amazonía',82,11,45,9.0,48,46,54,26,-0.10,0.55,2],
 ['GUA','Guainía','Inírida','Amazonía',53,9,60,10.0,42,40,48,20,-0.20,0.60,2],
 ['GUV','Guaviare','San José del Guaviare','Amazonía',90,11,44,11.0,48,46,36,24,0.10,0.60,2],
 ['VAU','Vaupés','Mitú','Amazonía',48,7,65,9.0,40,38,50,16,-0.30,0.60,2],
 ['VIC','Vichada','Puerto Carreño','Orinoquía',118,12,60,10.0,42,40,42,20,0.20,0.60,2]
].map(r => ({ id:r[0], nombre:r[1], capital:r[2], region:r[3], poblacion:r[4], pibPc:r[5],
  pobreza:r[6], desempleo:r[7], educacion:r[8], salud:r[9], seguridad:r[10], infraestructura:r[11],
  incl:r[12], maq:r[13], camara:r[14] }));

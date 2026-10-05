# CURUL ESPAÑA — Simulador político de España

Juegas una carrera política en **España**: empiezas de **concejal/a o alcaldable**, de **diputado/a autonómico/a**
o de **diputado/a del Congreso**, con uno de los 19 partidos (o fundando uno nuevo), y puedes llegar a presidir una
comunidad, a ser ministro/a o a presidir el Gobierno… o dar el salto a Bruselas. Los partidos, líderes y políticos
son **ficticios**, inspirados en el panorama político real; las instituciones (Cortes Generales, Consejo de
Ministros, comunidades autónomas, ayuntamientos, Unión Europea) funcionan con reglas parecidas a las reales.

**Jugar:** abre `index.html` (funciona desde el disco, en GitHub Pages o con cualquier servidor estático).
Es una PWA: se puede instalar y jugar sin conexión.

> La versión anterior, que cubría los 27 países de la UE, el Reino Unido y los candidatos, vive en la rama
> [`europa-v1`](https://github.com/SAMY1808/Curul-Europa/tree/europa-v1). Esta versión se concentra en España.

## Qué hay

- **Elecciones generales** por 52 circunscripciones (50 provincias + Ceuta y Melilla), D'Hondt con umbral del 3 %
  por circunscripción: el voto de cada provincia combina el apoyo nacional de cada partido con su fuerza regional
  (calibrado a las generales de 2023). **Generales anticipadas**: el presidente puede disolver las Cortes (una vez al año,
  sin moción de censura pendiente) y se abre una campaña de ocho semanas.
- **Cortes Generales**: Congreso de 350 diputados individuales (ideología, disciplina, circunscripción), y **Senado**
  (elegido por provincias + 57 senadores designados por los parlamentos autonómicos) con **veto por mayoría absoluta**
  que el Congreso supera con 176 votos o, pasados dos meses, por mayoría simple. Trámite: registro → ponencia →
  pleno → Senado → vuelta. **Leyes orgánicas** (176 «síes»), **reformas constitucionales** (3/5) y
  **decretos-ley** que deben convalidarse en 30 días.
- **Investidura y pactos**: constitución de las Cortes, **ronda de consultas del Rey**, primera votación (176) y
  segunda (mayoría simple); si pasan dos meses sin presidente, nuevas elecciones. Cada partido exige
  **contrapartidas** (amnistía, financiación singular, traspasos, quita de deuda, referéndum…), tiene **vetos** y
  tabúes del candidato. Si diriges un partido, **construyes tu bloque** a mano; si diriges un partido bisagra,
  decides tu voto y qué exiges. **Mociones de censura** constructivas, cuestiones de confianza y rupturas de coalición.
- **Consejo de Ministros** como centro del Gobierno: orden del día semanal (proyectos de ley, **decretos-ley**,
  reales decretos, peticiones de las comunidades, crisis territoriales), 23 ministerios con titulares individuales,
  **satisfacción de los socios** y tensión de coalición, **Presupuestos** (presentar o prorrogar), remodelaciones,
  Conferencia de Presidentes y catálogo de más de 60 iniciativas con proyección de votos. Si eres presidente/a decides tú;
  si no, influyes como ministro/a, socio o líder de la oposición.
- **El gabinete es central**: ministros (23), consejeros autonómicos (9 por comunidad) y concejales de gobierno son
  **personas con atributos** (gestión, carisma, integridad, lealtad, ambición y especialidad). Tras una investidura, si
  eres presidente/a **formas tu Gobierno cartera a cartera** eligiendo entre candidatos del partido, de los socios o
  independientes. El rendimiento de cada titular (y si encaja con la cartera) mueve la economía, la aprobación, la relación con
  las comunidades y la UE; los poco íntegros provocan **escándalos** que decides tú; los ambiciosos y desleales, **choques** y
  dimisiones. Los socios exigen **cuota** (con el peso real de cada cartera): si les das menos de lo que les corresponde,
  se enfadan y pueden romper. Remodelaciones, ceses y nombramientos en cualquier momento.
- **Ayuntamientos con profundidad**: seis indicadores urbanos (vivienda, movilidad, seguridad, limpieza, empleo,
  cultura), presupuesto por áreas, IBI y deuda, **pleno** con mayorías y pactos, **proyectos urbanos** (vivienda pública,
  tranvía, peatonalización, ecotasa, congresos…), petición de fondos a la comunidad, al Estado o a la UE, **mociones de
  censura locales** y un gobierno municipal con concejalías. Pantalla propia «Ayuntamiento» si juegas en lo local.
- **Comunidades autónomas** (17 + 2 ciudades autónomas): parlamento regional por D'Hondt con su umbral, gobierno
  y coaliciones, elecciones autonómicas con su calendario (mayo de 2027, Cataluña, País Vasco, Galicia…), **relación con
  Moncloa**, grado de autogobierno, deuda y balanza fiscal, régimen foral (País Vasco y Navarra).
- **Competencias que significan algo**: 16 competencias (educación, sanidad, policía, tráfico, prisiones, cercanías,
  puertos, agua, tributos, Seguridad Social, lengua…) con tres niveles (Estado / compartida / transferida) y una matriz por
  comunidad. Se **negocian**: la comunidad las reclama, el Consejo de Ministros decide (decreto tras comisión mixta o ley
  orgánica del art. 150.2) según la relación con Moncloa, la afinidad política y la presión. El autogobierno de cada
  comunidad sale de lo que gestiona; lo que no gestiona, se le achaca al Estado cuando falla.
- **Consejerías con peso**: cada gobierno autonómico reparte 9 consejerías entre sus socios; su peso depende de las
  competencias del área. Si te nombran consejero/a, gestionas tu departamento y puedes reclamar traspasos.
- **Financiación**: régimen común, foral (Concierto vasco y Convenio navarro, con **cupo** cada cinco años), canario y
  singular. Puedes negociar más cesión de impuestos, un fondo de nivelación o una financiación singular, y existe el
  Consejo de Política Fiscal y Financiera anual.
- **Dinámica autonómica**: adelantos electorales por conveniencia o por falta de apoyos, **mociones de censura
  autonómicas** (la IA o tú) y procesos soberanistas en **Cataluña, País Vasco, Galicia, Navarra, Canarias, Baleares y
  Valencia**, cada uno con su umbral y su respuesta del Estado (155, diálogo o nada).
- **Estatutos de autonomía**: propuesta del parlamento regional (3/5) → ley orgánica en las Cortes →
  **referéndum autonómico**.
- **Independentismo**: apoyo soberanista por comunidad que reacciona a concesiones (amnistía, indultos, financiación
  singular, traspasos) y a la dureza; **procés** por fases (distensión, tensión, desafío unilateral, declaración),
  **artículo 155** autorizado por el Senado, mesa de diálogo, referéndum pactado y **Tribunal Constitucional** que puede
  anular leyes territoriales.
- **Municipios**: 67 grandes ayuntamientos con concejales (D'Hondt, umbral del 5 %), pactos de alcaldía, aprobación
  municipal, y las ~8.100 alcaldías agregadas por comunidad; municipales en mayo de 2027.
- **Unión Europea**: Consejo (mayoría cualificada o unanimidad), Parlamento Europeo (España: circunscripción única),
  Comisión, cumbres, directivas que llegan al Congreso para su transposición, fondos europeos y reglas fiscales.
  Los otros 26 Estados miembros se simulan en segundo plano.
- **Personaje**: nivel de partida (local / autonómico / nacional), partido, trayectoria, atributos, ideología en
  **cuatro ejes** (economía, valores, Europa, territorio). Escalera: concejal → alcalde/sa → diputado/a autonómico/a →
  consejero/a → presidente/a autonómico/a → diputado/a → ministro/a → presidente/a del Gobierno → eurodiputado/a →
  comisario/a. Campañas autonómicas, municipales y generales; **noche electoral** animada.
- **Leyes con diseño e impacto** (inspirado en *Lawgivers II* y *Geopolitical Simulator 6*): cada ley se **diseña**
  (alcance limitado/estándar/ambicioso, enfoque alternativo, financiación con deuda/impuestos/recortes, entrada en
  vigor inmediata o gradual) y tiene un **informe de impacto** previo: efectos sobre **14 indicadores del país**
  (igualdad, vivienda, sanidad, educación, seguridad, medio ambiente, energía, cohesión territorial, libertades,
  competitividad, protección social, España rural), sobre la satisfacción de **11 colectivos sociales**, sobre la
  economía y sobre el presupuesto, con **riesgos de efectos no deseados** y una incertidumbre que hace que el efecto
  real se desvíe de lo previsto (mejor si el ministro del ramo es bueno). Las leyes entran en vigor de forma
  **gradual**, se **evalúan al año**, se pueden **reformar o derogar** (los Gobiernos de signo contrario las
  deshacen) y los colectivos descontentos castigan al Gobierno y se acercan a los partidos que sienten próximos.
  Los grupos del Congreso piden **enmiendas** (más o menos alcance, otro enfoque, otra financiación…) a cambio de su
  voto. Pestañas *En vigor* e *Impacto en el país* en **Leyes**, y tarjeta *Estado del país* en el Centro de mando.
- **Estructura del Gobierno autonómico**: cada comunidad tiene entre **7 consejerías** (como La Rioja) y **15** (como Cataluña); las competencias se agrupan según el tamaño (Sanidad y Servicios Sociales, Educación y Universidades…) y el presidente puede **reorganizar el Gobierno** eligiendo cuántas. Una consejería tiene **programas propios**: obras (hospitales, colegios, vivienda pública, metro…), planes de efecto inmediato y **leyes autonómicas** que debe aprobar el Parlamento regional; su efecto depende de las competencias transferidas.
- **Consejo según tu nivel**: como presidente/a o consejero/a autonómico/a, la sección *Consejo* pasa a ser el **Consejo de Gobierno** de tu comunidad (orden del día con las propuestas de las consejerías, tu consejería con sus planes, reformas y obras —que el consejero lleva al Consejo y el presidente aprueba—, miembros, presupuesto y acuerdos); si eres diputado/a nacional sin cartera sólo recibes información del Consejo de Ministros, y en lo local aparece el *Consejo municipal*.
- **Calendarios y procedimientos de investidura** (Elecciones → *Investidura*): tras unas generales o autonómicas el Gobierno saliente sigue en funciones y se recorre el procedimiento con fechas: **sesión constitutiva** (4 semanas después), elección de la Mesa, consultas, propuesta de candidato, debate y votaciones (mayoría absoluta; después simple) y **plazo de dos meses** desde la primera votación antes de la disolución automática. Si eres cabeza de lista y diputado/a autonómico/a puedes **presentar tu candidatura**; si propones y negocias tu bloque (qué partidos suman y cuáles vetan) te sometes a la votación. Si resultas **presidente/a del Parlamento** (o del Congreso) eres tú quien **propone al candidato** tras las consultas.
- **Presupuesto autonómico propio**: cada otoño el presidente reparte el presupuesto entre las consejerías (y decide el déficit), el Parlamento regional lo vota y, si fracasa, se prorrogan los anteriores. El reparto cambia la gestión de cada consejería y fija su **crédito**, con el que se pagan sus obras, planes y leyes; los consejeros pueden reclamar más fondos. Pestaña *Presupuesto autonómico* en Territorio.
- **Consejerías y disolución autonómica**: si entras en el Parlamento regional en la lista de un partido que
  gobierna (sin ser cabeza), el presidente puede ofrecerte una consejería (y puedes pedir otra de más peso); el
  presidente/a autonómico/a puede **disolver el Parlamento** tras ver la proyección de escaños.
- **Candidaturas autonómicas**: desde el ayuntamiento, el Congreso (incluso siendo ministro/a) o otro parlamento
  autonómico puedes **lanzar tu candidatura a las listas de cualquier comunidad** (Agenda → *Candidatura
  autonómica*): ves la fecha de las elecciones, los escaños de tu partido y tus opciones de **ir en la lista** o de
  **encabezarla** (candidato/a a la presidencia). Si te eligen y ganas escaño, dejas el cargo anterior y, si tu
  partido forma gobierno, presides la comunidad.
- **Móvil**: interfaz pensada para pantallas táctiles (cabecera compacta, barra inferior con «Más», modales como
  hojas inferiores, tablas con desplazamiento, avisos al tocar botones desactivados y fichas al tocar un escaño).
- **La Corona**: indicador de apoyo a la monarquía y eventos propios (Mensaje de Navidad, Fiesta Nacional, patrimonio de la Casa Real, el Rey emérito, el Rey ante la crisis territorial, sanción de leyes polémicas, encuestas monarquía/república, visitas a tu comunidad, rumores de abdicación…).
- **Eventos** con decisiones (DANA, crisis migratoria, apagón, corrupción, vivienda, turismo masivo, Diada,
  financiación, moción de censura municipal…) y choques globales.
- **Guardado** múltiple (IndexedDB), autoguardado, exportar/importar `.json`.

## Cómo se juega

Cada turno es una **semana**. Dispones de 5–7 **puntos de agenda**: discursos, leyes, cabildeo, partido, medios,
campaña, gestión del Consejo, de tu comunidad o de tu ayuntamiento… Avanza (`N`, o ▶ Semana / Mes / Trimestre); el
tiempo se detiene cuando hay una votación, una investidura, una decisión del Consejo de Ministros o una noche
electoral.

## Arquitectura

Mismo planteamiento que el Curul de Colombia (`../curul/`): estado único serializable (`ESP.E`), sistemas
registrados en un motor de turnos, sin compilación ni dependencias. Ver [`docs/DISENO.md`](docs/DISENO.md).

```
index.html · manifest.webmanifest · sw.js
css/        base · layout · componentes · pantallas · europa · movil
data/       territorio · partidos-es · pactos · leyes · impactos · instituciones · paises · partidos (UE) · nombres · ue · eventos
js/core/    util · bus · estado · tiempo · acciones
js/sistemas/ economia · opinion · impacto · mundo · elecciones · gobierno (resto de la UE) ·
            espana · generales · ejecutivo · congreso · consejo · gabinete · territorio · autonomia · municipios · ue · eventos · personaje · guardado
js/ui/      dom · graficos · hemiciclo · mosaico (mapa de provincias) · componentes
js/pantallas/ inicio · creacion · dashboard · agenda · cortes · leyes · consejo · territorio · partido · europa · elecciones · personaje · partidas · impacto
tools/      mini · prueba-es · jugador-es · ui-es · movil-es · leyes-es
```

## Pruebas (Node)

```
node tools/prueba-es.js 520 3        # 10 años de España con una semilla: gobiernos, disoluciones, investiduras
node tools/jugador-es.js 11 ES_ASD nacional base "" "" 260   # agente aleatorio: semilla partido nivel rol región municipio semanas
node tools/ui-es.js nacional ES_ASD lider 60                 # Playwright: crea partida, recorre pantallas y juega
node tools/invest-es.js 33 ES_ASD lider CAT                 # investidura autonómica y central: fases, decisiones del jugador, calendario
node tools/invest-ui.js [movil]                              # Playwright: calendario, proponer candidato y negociar el bloque
node tools/leyes-es.js [movil]                               # Playwright: diseñar, aprobar, reformar y derogar leyes, enmiendas, impacto
node tools/movil-es.js nacional ES_UPC direccion u           # Playwright en formato móvil 390×844: capturas /tmp/u-*.png y comprobaciones
```

## Simplificaciones conocidas

Los datos (población, escaños, umbrales) son aproximados. Los parlamentos autonómicos se reparten en una
circunscripción única; sólo 67 municipios se simulan individualmente. Los otros 26 países de la UE funcionan de forma
agregada. La partida arranca en octubre de 2026 con unas Cortes calibradas a 2023: derecha primera en escaños, pero
con un Gobierno de izquierdas apoyado por regionalistas.

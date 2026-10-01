# CURUL EUROPA — Simulador político de la UE

Juegas una carrera política desde **un país y un partido**: los 27 Estados miembros de la Unión Europea,
el **Reino Unido** o cualquiera de los **9 candidatos a la adhesión** (Albania, Bosnia y Herzegovina, Georgia,
Macedonia del Norte, Moldavia, Montenegro, Serbia, Turquía y Ucrania). Los partidos, líderes y políticos son
**ficticios**, inspirados en el paisaje político real de cada país; las instituciones (parlamentos, sistemas
electorales, Consejo, Parlamento Europeo, Comisión) funcionan con reglas parecidas a las reales.

**Jugar:** abre `europa/index.html` (funciona desde el disco, en GitHub Pages o con cualquier servidor estático).
Es una PWA: se puede instalar y jugar sin conexión.

## Qué hay en esta versión

- **37 países jugables**, cada uno con su parlamento (de 42 a 650 escaños), sistema electoral (proporcional con
  D'Hondt o Sainte-Laguë, mayoritario, mixto; umbrales y efecto de circunscripciones pequeñas), calendario
  electoral, economía (crecimiento, paro, inflación, deuda, déficit) y entre 4 y 9 partidos ficticios.
- **Personaje**: país → partido (o fundar uno nuevo) → trayectoria → atributos → ideología en tres ejes
  (economía, valores, Europa). Escalera de cargos: dirigente, diputado/a, portavoz, dirección, líder del
  partido, ministro/a, jefe/a de Gobierno, eurodiputado/a, comisario/a, presidente/a de la Comisión.
- **Parlamento nacional** con cada diputado como individuo (ideología, disciplina, relación contigo), hemiciclo
  interactivo, grupos, proyectos de ley (Gobierno, oposición, tuyos y transposiciones europeas), trámite
  (registro → comisión → pleno), votaciones con **factores trazables**, rebeldes y «¿qué pasó?».
- **Gobiernos de coalición**: formación por afinidad ideológica con cordón sanitario donde procede, gabinete de
  12 ministerios, estabilidad, caídas de Gobierno, elecciones anticipadas, **ronda de consultas** (si lideras un
  partido) y **moción de censura**.
- **Elecciones presidenciales** a dos vueltas en Francia, Rumanía, Polonia, Portugal, Lituania, Chipre, Turquía y Ucrania (con límite de mandatos, cohabitación y presidentes que encabezan el Gobierno en los regímenes presidencialistas); si ganas, designas Gobierno y representas al país en el Consejo Europeo cuando el sistema lo prevé.
- **Elecciones** con campaña, encuestas, proyección de escaños, **noche electoral animada** y puesto en la lista
  del jugador. Todos los países celebran sus propias elecciones y forman gobierno aunque no los juegues.
- **Unión Europea**:
  - **Consejo**: votación por **mayoría cualificada** (55 % de Estados y 65 % de la población, minoría de
    bloqueo) o **unanimidad con veto**, con la posición de cada Gobierno explicada por factores.
  - **Parlamento Europeo** (720 escaños, 9 grupos), **Comisión** (un comisario por Estado, presidencia), cumbres
    del Consejo Europeo, directivas que se transponen en tu parlamento y procedimientos de infracción.
  - **Ampliación**: progreso de cada candidato, congelaciones, adhesión; **Brexit** y el camino de vuelta del
    Reino Unido; referéndums de permanencia (¡un país puede salir de la UE!); reglas fiscales y procedimiento
    de déficit excesivo.
- **Mapa de mosaicos** de Europa por capas (estatus, gobierno, aprobación, crecimiento y voto en el Consejo).
- **Eventos** con decisiones (escándalos, huelgas, crisis migratorias, ofertas de carrera), sucesos propios de
  cada región (Irlanda del Norte, Cataluña, Egeo, Balcanes, Transnistria, Georgia, Ucrania, Báltico…) y choques
  globales (recesión, crisis energética, guerra de aranceles…).
- **Guardado** múltiple (IndexedDB), autoguardado, exportar/importar `.json`.

## Cómo se juega

Cada turno es una **semana**. Dispones de 5–7 **puntos de agenda**: discursos, proyectos de ley, cabildeo de
grupos o expedientes europeos, trabajo en el partido, medios, campaña, viajes a Bruselas, gobierno… Avanza
(`N`, o ▶ Semana / Mes / Trimestre); el tiempo se detiene cuando hay una votación, una decisión o una noche
electoral. Sube en tu partido, entra en el Gobierno, ve a Bruselas o lleva a tu país a la UE (o fuera de ella).

## Arquitectura

Mismo planteamiento que el Curul de Colombia (`../curul/`): estado único serializable, sistemas registrados
en un motor de turnos, sin compilación ni dependencias. Ver [`docs/DISENO.md`](docs/DISENO.md).

```
europa/
├── index.html · manifest.webmanifest · sw.js
├── css/        base · layout · componentes · pantallas · europa
├── data/       paises · partidos · nombres · instituciones · leyes · ue · eventos
├── js/core/    util · bus · estado · tiempo · acciones
├── js/sistemas/ economia · opinion · mundo · elecciones · gobierno · parlamento · ue · eventos · personaje · guardado
├── js/ui/      dom · graficos · hemiciclo · mosaico · componentes
├── js/pantallas/ inicio · creacion · dashboard · agenda · parlamento · leyes · gobierno · partido · europa · elecciones · pais · personaje · partidas
├── js/app.js
├── tools/      headless.js · prueba.js · stats.js · ue.js · jugador.js · nuevo.js (simulación sin DOM para calibrar)
└── docs/DISENO.md
```

## Pruebas de simulación (Node, sin navegador)

```
node tools/prueba.js ES 6      # 6 años en España: gobierno, leyes, UE, noticias
node tools/stats.js            # tasas de aprobación de leyes en 10 países
node tools/ue.js               # 10 años de expedientes europeos
node tools/jugador.js ES 1 20  # agente que juega 20 años para calibrar la carrera
node tools/nuevo.js NL 14      # crecimiento de un partido nuevo
```

## Simplificaciones conocidas

Los datos (población, PIB, escaños, umbrales) son aproximados y los resultados electorales se simulan a partir
de los apoyos nacionales sin circunscripciones. Los parlamentos son unicamerales y los niveles regional y local
no están modelados todavía (ver hoja de ruta en `docs/DISENO.md`).

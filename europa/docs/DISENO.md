# CURUL EUROPA — Documento de diseño (v0.1)

> 37 países, partidos y personas ficticios; instituciones inspiradas en las reales.
> Un turno = una semana. El estado del mundo es un único objeto serializable.

## A. Arquitectura

```
index.html ─ data/*.js (CURUL.DATA) ─ js/core ─ js/sistemas ─ js/ui ─ js/pantallas ─ js/app.js
```

1. **Estado único** (`C.E`): sin clases ni funciones, sólo ids. Guardar = `JSON.stringify(C.E)`.
2. **Sistemas registrados** (`C.Tiempo.registrar(nombre, sistema, prioridad)`), cada uno con `init(E)` (generación
   del mundo), `turno(E)` (una semana) y acciones públicas. Orden: personaje 3 → economía 5 → opinión 15 →
   elecciones 20 → gobierno 25 → parlamento 30 → UE 40 → personaje_init 60 → eventos 70 → guardado 99. Al crear
   el mundo se ejecutan los `init` en el orden de prioridad (mundo → … → personaje).
3. **Sin compilación**: scripts clásicos con espacio de nombres `window.EUROPA`; datos en `.js` para que funcione
   desde `file://`.
4. **RNG con semilla** guardada en el estado (mulberry32): una partida es reproducible.
5. **Interfaz**: gráficos propios en SVG (líneas, barras, apiladas, medidor, radar, plano ideológico, hemiciclo,
   mapa de mosaicos). `data-tt` y `data-pol` activan un tooltip global.
6. **Simulación sin DOM**: `tools/headless.js` carga datos, núcleo y sistemas en `vm` para calibrar.

## B. Modelo de datos (resumen)

```js
E = {
  meta, fecha:{t},
  jugador: { nombre, pais, partido, cargo, rol, ministerio, eco, soc, eu, atrib{…}, prestigio, pop, capEU,
             agenda:{puntos,max,hechas}, historial[], hitos{cargo:t}, campania, candidatoPE, meps, cartera },
  paises:  { [id]: { estado:'ue'|'exue'|'candidato', euro, meps, partidos[ids], ec:{crec,infl,paro,deuda,deficit,pib,base,pol,pde},
                     elec:{ultima:{t,votos,escanos,part}, proxT}, escanos:{pid:n},
                     gob:{pm,partido,coalicion[],apoyoExterno[],tipo,aprob,estab,formado,ministros{}},
                     ue:{rel,progreso,ritmo,congelada,clusters}, sist?, flags } },
  partidos:{ [id]: { pais, nombre, sigla, arq, color, eco, soc, eu, grupo, pop, base, cohesion, finanzas, lider, postura } },
  politicos:{ [id]: { n,g,e,p,eco,soc,eu,d(isciplina),a(mbición),pr,c,i,rel,cargo } },   // país del jugador + líderes
  parl:    { miembros[ids], pendienteVoto[ids], auto },
  proyectos:{ [id]: { tpl,t,s,eco,soc,eu,costo,pop,may,autor:{tipo,pid},etapa,apoyo{pid:x},hist[],votacion } },
  votaciones:[ {si,no,abs,aus,ok,posturas{pid},votos{id},detalle[],miVoto,linea} ],
  ue:      { pe:{escanos{grupo},porPais{pais:{pid:n}},total}, comision:{presidente,comisarios,centro,t0},
             expedientes{}, pendiente[], cumbres[], historico[], sinVeto, proxPE, proxCumbre },
  elecciones:{ historico[], nochePendiente }, eventos:{ pendientes[], historial[] }, noticias[], series{}
}
```

## C. Sistemas

| Sistema | Archivo | Responsabilidad |
|---|---|---|
| Economía | `economia.js` | Crecimiento, paro (ley de Okun), inflación, déficit y deuda por país; choques globales; efectos de leyes que se diluyen (vida media ≈ 3 años); reglas fiscales y procedimiento de déficit excesivo |
| Opinión | `opinion.js` | Aprobación de los gobiernos, popularidad de partidos con reversión a la media y desgaste del Gobierno; encuestas con error de muestreo; presupuesto semanal de empuje del jugador |
| Mundo | `mundo.js` | Genera los 37 países, partidos (arquetipo + desplazamiento del país + ruido) y líderes |
| Elecciones | `elecciones.js` | Reparto D'Hondt / Sainte-Laguë con umbral, mayoritario (apoyo^k) y mixto; campaña; noche electoral; calendario de cada país |
| Gobierno | `gobierno.js` | Formación de coaliciones por afinidad (con cordón sanitario), ministerios, estabilidad, caída, consultas y moción de censura |
| Parlamento | `parlamento.js` | Diputados, proyectos, comisión/pleno, votación con factores, proyección, efectos de las leyes |
| UE | `ue.js` | Parlamento Europeo, Comisión, expedientes, mayoría cualificada y unanimidad, cumbres, transposición, ampliación, salida/adhesión, referéndums |
| Eventos | `eventos.js` + `data/eventos.js` | Choques globales y decisiones del jugador |
| Personaje | `personaje.js` | Carrera, capital político, agenda y acciones |
| Guardado | `guardado.js` | IndexedDB con ranuras, autoguardado, exportar/importar |

## D. Reglas relevantes

### Elecciones
- Cada partido tiene `pop` (apoyo actual) y `base` (largo plazo). Los votos de una elección son `pop` con ruido
  log-normal (σ ≈ 0,09). Tras votar, `pop` y `base` se acercan al resultado.
- **Proporcional**: umbral nacional; pesos `votos^k` (k > 1 reproduce el sesgo de circunscripciones pequeñas) y
  divisores D'Hondt o Sainte-Laguë.
- **Mayoritario** (Reino Unido, Francia): pesos `votos^k` con k ≈ 2,0–2,6 y bonificación a los regionalistas
  (voto concentrado). **Mixto** (Italia, Hungría, Lituania): fracción mayoritaria (`fm`) + resto proporcional.
- Una reforma electoral aprobada cambia umbral y proporcionalidad (más proporcional si la impulsa un partido pequeño).
- **Puesto en la lista del jugador**: `pos = 1 + (1 − eficacia/100) · (escaños + 3)`, con eficacia =
  0,7·prestigio + 0,3·popularidad + bono de cargo + campaña. Resulta elegido si `pos ≤ escaños`.

### Gobiernos
- Para cada formateur candidato (los 3 primeros) se añaden socios por `√escaños·(1 − 1,35·distancia)` hasta
  alcanzar la mayoría; puntuación = mayoría + tamaño − dispersión ideológica − nº de partidos. Si no hay mayoría
  se busca apoyo externo o se gobierna en minoría. El **cordón sanitario** excluye a la extrema derecha en los
  países con `cordon: true`.
- Estabilidad: deriva con la aprobación y el tipo de Gobierno; por debajo de ≈ 14 el Gobierno puede caer
  (50 % elecciones anticipadas, 50 % nueva coalición sin urnas).

### Votaciones
- Un partido adopta postura por utilidad: `0,8 − 2,5·distancia + autoría + opinión + coste fiscal + cabildeo`.
- Cada diputado sigue a su partido con probabilidad `0,93 + (disciplina−75)/300 + (cohesión−70)/400`
  (≈ 93 %); si rompe la disciplina vota por su propia utilidad. Las desviaciones se listan en «¿qué pasó?».
- Mayorías: simple, absoluta o de dos tercios según el proyecto.

### Unión Europea
- **Posición de un Gobierno**: `0,75 − 2,7·distancia(centroide de la coalición, texto) + intereses sectoriales
  + actitud europeísta + restricciones fiscales + cabildeo`.
- **Mayoría cualificada**: ≥ 55 % de los Estados y ≥ 65 % de la población de los miembros a favor (las
  abstenciones no suman); minoría de bloqueo = 4 Estados con > 35 %. **Unanimidad**: un voto en contra veta;
  los reticentes ceden con cierta probabilidad (concesiones).
- **Parlamento Europeo**: cada delegación nacional vota según su ideología, la línea de su grupo y los intereses
  nacionales; mayoría simple de los votos emitidos.
- Un reglamento aprobado aplica efectos económicos a todos los miembros; una **directiva** crea un proyecto de
  transposición en el parlamento del jugador (si se rechaza: procedimiento de infracción).
- **Ampliación**: cada candidato acumula progreso por ritmo propio, reformas (leyes de armonización) y capítulos
  abiertos en cumbres (unanimidad). Al 100 % se une a la Unión. Un Gobierno euroescéptico congela el proceso.

### Presidencias
- Francia, Rumanía, Polonia, Portugal, Lituania, Ucrania (semipresidencialistas) y Chipre y Turquía (presidencialistas)
  celebran presidenciales cada cinco años. Candidatos: líderes de los partidos con ≥ 4,5 % (fuerza = apoyo · (0,75 + 0,5·carisma)
  · ruido). Si nadie supera el 50 %, balotaje con transferencia de votos por cercanía ideológica y 18 % de abstención.
- **Presidencialismo** (Chipre, Turquía): el presidente es también jefe de Gobierno; tras cada legislativa su partido
  es el formateur obligado. **Semipresidencialismo**: el presidente da prioridad a su partido en la formación del
  Gobierno (+14 de puntuación) y puede surgir **cohabitación** (35 % de probabilidad de disolución anticipada).
- Si el jugador gana, deja su escaño, designa al jefe de Gobierno (semipresidencialismo) y, en Francia, Rumanía, Lituania,
  Chipre y Ucrania, ocupa el asiento del Consejo Europeo.

### Carrera
- Las acciones corrientes dan ganancias **pequeñas y decrecientes** de prestigio, popularidad y capital europeo;
  los hitos (ascensos, leyes propias, cargos) usan incrementos fijos. El prestigio deriva hacia el nivel natural
  del cargo. Umbrales: ministro ≥ 42 (partido de Gobierno), portavoz ≥ 32, dirección ≥ 52, desafiar al líder ≥ 55,
  comisario ≥ 45 y capital europeo ≥ 38, presidir la Comisión ≥ 78 y ≥ 68.
- El empuje del jugador al apoyo de su partido tiene un **presupuesto semanal** (0,02 pts; 0,06 en campaña) para
  evitar crecimientos irreales.

## E. Flujo de una partida

```
Nueva carrera → país → partido (o nuevo) → personaje → mundo (semilla) → centro de mando
   Turno: gastar puntos de agenda → ▶ avanzar
          economía → opinión → elecciones → gobierno → parlamento → UE → eventos
          (pausa si hay votación, decisión europea, evento o noche electoral)
```

## F. Hoja de ruta

| Fase | Contenido | Estado |
|---|---|---|
| **1** | 37 países, parlamentos, coaliciones, leyes, elecciones, UE (Consejo, PE, Comisión, cumbres), ampliación, carrera hasta la Presidencia de la Comisión | **esta entrega** |
| 2 | Elecciones presidenciales a dos vueltas, cohabitación, presidente-jefe de Gobierno (hecho); segundas cámaras y vetos presidenciales sobre leyes (pendiente) | parcial |
| 3 | Circunscripciones regionales con mapas reales, niveles regional y local | pendiente |
| 4 | Presupuestos nacionales y europeos (MFF) con partidas, fondos Next Generation, deuda común | pendiente |
| 5 | Política exterior: OTAN, guerra de Ucrania, sanciones, comercio, migración con rutas | pendiente |
| 6 | Partidos que nacen y mueren, escisiones, líderes con biografía, medios y redes | pendiente |
| 7 | Eventos con mayor encadenamiento, logros y modo desafío | pendiente |

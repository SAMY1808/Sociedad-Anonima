# Diseño de Curul España

## Principios

- **Un solo estado serializable** (`ESP.E`): todo lo que importa vive ahí y se guarda con `JSON.stringify`.
  La interfaz sólo lee y llama a funciones de los sistemas.
- **Sistemas registrados** en `C.Tiempo.registrar(nombre, sistema, prioridad)`. Primero se ejecutan `init` (por
  prioridad), luego `postInit`; cada semana se ejecuta `turno` en el mismo orden.
- **Aleatoriedad con semilla** (`U.r`, mulberry32 en `E.meta.rng`): una partida es reproducible.
- **1 turno = 1 semana**, inicio el 5 de octubre de 2026.
- Sin compilación ni dependencias: `window.ESP` como espacio de nombres, scripts clásicos.

## Orden de los sistemas (prioridad)

| Prio | Sistema | Qué hace |
|---|---|---|
| 1 | `mundo` | crea los 27 Estados miembros, sus partidos y líderes (España la crea `espana`) |
| 2 | `espana` | partidos españoles, voto por circunscripción, calibrado (ajuste proporcional iterativo) |
| 3 | `personaje` (turno) | agenda semanal, campañas locales/autonómicas |
| 5 | `economia` | indicadores macro y reglas fiscales |
| 8 | `generales` | 52 circunscripciones, D'Hondt, Senado, disolución, calendario, noche electoral |
| 10 | `territorio` (init) | parlamentos y gobiernos autonómicos, relación con Moncloa, independentismo, TC |
| 12 | `municipios` (init) | 67 ayuntamientos, concejales, alcaldes |
| 15 | `opinion` | aprobación y popularidad (nacionales + regionales) |
| 20 | `congreso` | 350 diputados, trámite legislativo, Senado, decretos-ley |
| 25 | `ejecutivo` | investidura, pactos, vetos, mociones, ministerios, estabilidad |
| 30 | `consejo` | Consejo de Ministros, socios, Presupuestos, 155 |
| 32 | `congreso_turno` | semana parlamentaria |
| 36–37 | `territorio_turno`, `municipios_turno` | elecciones autonómicas y municipales, procés, TC |
| 40 | `ue` | Consejo, Parlamento Europeo, Comisión, directivas |
| 60 | `personaje_init` | crea al jugador (tras los parlamentos) |
| 70 | `eventos` | eventos con decisiones y choques globales |

## Modelo territorial

- **Partidos**: `amb = 'nac'` (estatal) o `'reg'` (sólo en su comunidad). Cada partido tiene `eco, soc, eu, ter`
  (el eje territorial va de −100 centralista a +100 secesionista) e `indep` (0–1).
- **Voto provincial**: `pop` nacional × multiplicador regional × ruido provincial para los estatales + `rp[ccaa]` ×
  ajuste provincial para los regionales. Un ajuste proporcional iterativo hace coincidir el agregado nacional con
  los objetivos de partida (generales de 2023).
- **Senado**: elegidos (limitado: el ganador provincial obtiene ≈ 66 %) + designados (D'Hondt sobre cada parlamento
  autonómico). El veto exige mayoría absoluta (133).
- **Comunidades** (`E.esp.ccaa[id]`): `parl` (escaños, votos, fechas), `gob` (presidente, coalición, estabilidad,
  aprobación), `relM` (relación con Moncloa), `indep`/`indep0`, `aut`, `deuda`, `fiscal`, `estatuto`, `concesiones`
  (cada concesión desplaza el independentismo y se desvanece con el tiempo).
- **Procés** (`E.esp.proces`): distensión → tensión → desafío unilateral → declaración/155. El Consejo de Ministros
  decide la respuesta (el jugador si es presidente).

## Investidura

Estados de las Cortes: `activa | disueltas | constitucion | consultas | investidura`. El Rey propone al candidato
de mayor peso con una mayoría posible; la IA arma el **bloque más barato** (aliados naturales → socios con
contrapartidas → completar). Cada partido evalúa: vetos del bloque, afinidad (≥ 0,62 sí; contrapartidas cumplidas → sí;
≥ 0,33 abstención). Primera votación 176; segunda mayoría simple; dos meses sin presidente disuelven las Cortes.

## Consejo de Ministros

`E.esp.consejo`: `agenda` de puntos (ley, rdl, rd, territorial, pge, proces), `sat` (satisfacción de cada socio),
`tension`, `autoridad`. Cada semana se generan puntos (ministerios, socios, comunidades, decretos); la IA decide si el
presidente no es el jugador. Los **decretos-ley** entran en vigor ya (`Co.registrarRDL`) y se convalidan en el
Congreso. Los socios con satisfacción < 15 pueden abandonar el Gobierno.

## Interfaz

`C.UI` (modales, tooltips, acciones), `C.Graf` (SVG propio), `C.Hemiciclo`, `C.Mosaico` (mapa de provincias).
Cada pantalla es `C.Pantallas.<nombre>.render(el, params)`. Las decisiones que detienen el tiempo se detectan en
`C.Tiempo.bloqueo()` y se muestran con `C.App.revisarPendientes()`.

## Hoja de ruta

Alcaldes y concejales como individuos para todos los municipios, circunscripciones provinciales en los parlamentos
regionales, mociones de censura autonómicas, financiación autonómica con fórmula explícita, Casa Real y justicia como
actores, y ampliar el catálogo de leyes y eventos regionales.

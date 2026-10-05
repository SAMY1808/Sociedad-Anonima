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
| 31 | `gabinete` | ministros, consejeros y concejales como personas: rendimiento, escándalos, choques, cuotas de los socios |
| 32 | `congreso_turno` | semana parlamentaria |
| 12 | `ayuntamientos` | indicadores urbanos, presupuesto, pleno, proyectos, mociones locales |
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
≥ 0,33 abstención). Primera votación 176; segunda mayoría simple; dos meses sin presidente disuelven las Cortes. Si el jugador preside el Congreso (`cortes.mesa.presidente==='J'`) el estado
`nominaJ` espera su propuesta (`pendienteInvAut`).

### Investidura autonómica (`sistemas/invaut.js`)

`Territorio.celebrar` abre `rc.inv` (`constitucion → consultas → debate`, más `nominaJ`/`candidatoJ` cuando decide el jugador) en vez de
formar gobierno al instante; `rc.gob` sigue en funciones. Sesión constitutiva a +4 semanas, consultas +2, votación +1
(absoluta, `evalBloque`), segunda +1 (simple), plazo `t1 + 9` y disolución con `T.adelantar`. Al instalar se llama a
`Personaje.tras_investidura` (presidencia/consejería del jugador). La IA tiene pactos de última hora (abstenciones); el jugador no.
Pantalla: `pantallas/invest.js` (calendario + modales). Bloqueo del tiempo: `E.esp.pendienteInvAut`.

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


## Candidaturas autonómicas

`Personaje.opcionesLista(E)` devuelve una fila por comunidad donde el partido del jugador se presenta (fecha de las
elecciones, escaños del partido, si puede pedir puesto o cabeza de lista y por qué no). La acción `candidatura_aut`
(`{region, cabeza}`) fija `J.aspira = {nivel:'autonomico', region, cabeza}` con probabilidad `Personaje.probLista`
(prestigio, popularidad, carisma/negociación, rol, presidente en ejercicio del propio partido y distancia territorial).
Al celebrarse las elecciones, `Territorio.celebrar` llama a `Personaje.antes_autonomicas` (la cabeza de lista del
jugador pasa a ser quien se presenta a la investidura) y a `Personaje.tras_autonomicas`, que resuelve la posición en
la lista, cambia de comunidad con `mudarRegion` y renuncia al escaño/cartera nacional con `dejarNacional` si procede.
El evento `candidato_autonomico` ofrece la cabeza de lista a dirigentes con prestigio.

## Interfaz móvil

`css/movil.css` (≤ 760 px y `pointer:coarse`): cabecera de dos filas (fecha + personaje / tiempo + puntos), barra
inferior con cinco secciones y «Más» (hoja con el resto, `App.mas`), modales como hojas inferiores, pestañas con
pista de desplazamiento, tablas dentro de `.tscroll` (con primera columna fija si desbordan) y tablas `.apila` que se
convierten en fichas. `App.ajustarMovil` (observador del DOM) envuelve tablas y etiqueta celdas. Los botones
desactivados usan `.desact` + `aria-disabled` (se pueden tocar y explican el motivo); los avisos `data-tt` salen al
tocar. `tools/movil-es.js` captura todas las pantallas a 390×844 y detecta desbordamiento horizontal.


## Leyes e impacto (impacto.js · data/impactos.js)

**Datos.** `DATA.indicadores` (14, 0-100, más es mejor), `DATA.colectivos` (11 grupos sociales con ideología, peso electoral
y lo que les importa), `DATA.impactos[ley]` (efecto a pleno rendimiento sobre indicadores `ind` y colectivos `gr`,
enfoques alternativos `enf`, efectos no deseados `sec`, implantación `r` e incertidumbre `u`), `DATA.alcances` y
`DATA.financiaciones` (comunes a todas las leyes).

**Diseño.** Un proyecto lleva `p.dis = {alc, enf, fin, grad}`. `Impacto.parametros(tpl, dis, ajuste)` deriva de él la posición
ideológica (más alcance = más radical), el apoyo ciudadano, el coste (la financiación con impuestos o recortes lo traslada
a crecimiento/colectivos/protección social), los impactos escalados y los riesgos. La votación (`Congreso.postura`) usa
esos campos, así que el diseño cambia los votos. `Impacto.informe` es el informe previo; `Impacto.disDefecto` diseña
las iniciativas de la IA según su ideología y la situación fiscal.

**Entrada en vigor.** Al sancionarse (o registrarse un decreto-ley) `Impacto.promulgar` crea una entrada en `E.esp.vigor`
con el efecto *real* = previsto × factor (1 + sesgo del ministro del ramo + ruido según la incertidumbre) y los efectos
secundarios que se materializarán. Cada semana `Impacto.turno` aplica la parte económica de forma incremental
(`Economia.aplicar`), acerca cada indicador a su objetivo (`base + deriva + acople con la economía + ministros + Σ leyes ×
rampa`, con rendimientos decrecientes `tanh`) y la satisfacción de cada colectivo (`50 + afinidad con el Gobierno +
indicadores + economía + leyes`). A las 52 semanas la ley se evalúa (mejor/según lo previsto/peor/fracaso).
Una versión nueva de una ley sustituye a la vigente; `derogar` deshace sus efectos en 26 semanas.

**Efectos políticos.** `E.esp.soc.clima` (media ponderada de la satisfacción − 50) mueve la aprobación del Gobierno
(`opinion.js`) y reparte el voto de los partidos nacionales según la afinidad ideológica de cada colectivo
(`Opinion.turnoES`). Los colectivos con satisfacción < 30 protestan.

**Enmiendas.** `Impacto.enmiendas(E, p)` busca, para cada grupo que no apoya el texto, el cambio de diseño que más mejora su
postura y calcula el margen de votos que ganaría el autor; la acción `aceptar_enmienda` lo aplica (máx. 3).

## Leyes autonómicas (`sistemas/leyesaut.js`)

`rc.leyes` guarda las leyes del Parlamento regional: `{etapa: registro|comision|pleno|fin, cab, neg, enm, interv, ruido, hist, v}`. `posturaAut` puntúa cada grupo
(afinidad con el autor, gobierno/oposición, cabildeo, negociación, debate, línea propia); `proyectarAut` suma escaños (mayoría simple). `leyesTurno` avanza
etapas (1+2+1 semanas) y abre `E.esp.pendienteVotoAut` si el jugador es diputado/a. Las leyes de los programas de consejería usan el mismo circuito.
Acciones: `cabildear_ley_aut`, `intervenir_ley_aut`, `negociar_bloque_aut`, `proponer_ley_aut`.

## Campaña electoral (`sistemas/campana.js`)

`E.esp.camp` (activa entre la disolución y las urnas): `presup`, `focus[prov]`, `nac`, `mom[pid]` (momentum en pp), `movil`, `util`, `coal`, `enc[]`, `debate`, `sucesos`.
`Generales.simular` llama a `Campana.ajustarProv` (momentum, movilización, finanzas, esfuerzo del jugador y voto útil) y fusiona/desfusiona la coalición antes y después del reparto D'Hondt.
`provInfo` calcula para tu partido cuánto voto falta para el siguiente escaño y cuánto puedes perder antes de perder uno (ruido ±7 %, ±3 % con encuesta propia).
`encuesta(tipo)` simula con la campaña y añade ruido (CIS 1,7 pp con sesgo hacia el Gobierno, prensa con sesgo del medio, propia 0,6). `cierre` genera el pie de urna, los escaños al límite y las cuentas (multa por superar 90 M€).

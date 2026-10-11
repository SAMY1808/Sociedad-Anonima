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
| 30 | `consejo` | Consejo de Ministros, socios, Presupuestos |
| 34–35 | `art155`, `ccaa2` | procedimientos del artículo 155 y mundo de las comunidades (convenios, FLA, impuestos propios) |
| — | `disolucion` | envuelve `Generales.disolver` y `Territorio.adelantar`: modo del anuncio y declaración institucional (sin turno propio) |
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

La campaña autonómica reutiliza el módulo: `E.esp.campA[ccaa]` (`ambito:'aut'`, tope y gasto escalados al tamaño de la comunidad). `Territorio.simular` llama a `ajustarReg` y fusiona coaliciones; los territorios son las provincias de la comunidad (esfuerzo ponderado por población) y el voto útil actúa por debajo de 2,2 veces el umbral. `Campana.cur(E)` devuelve la campaña activa (la elegida en el selector o la primera); `consejos` es el asesor y `auto` reparte el presupuesto.

## Presupuestos (`sistemas/presupuesto.js`)

`E.esp.pge` guarda `lev` (palancas acumuladas: `gas[área]` en %, `ing[impuesto]` en %, `gran` 0–100), `inv[ccaa]`, `borrador`, `pactos[pid]`, `ejec` e `hist`. `Presupuesto.cuentas(E, lev)` devuelve ingresos y gasto en % del PIB (a calibración: ingresos 38,5 %, gasto de base según `ec.base.deficit`), déficit, deuda a tres años, impulso fiscal y aviso de la regla del 3 %.
`presentar` crea el proyecto `pge` del Congreso (con apoyo por pactos); `aprobar` aplica el impulso a `ec.pol` (crecimiento, déficit, paro, inflación), a los indicadores por política (`Impacto.off`), a la popularidad por impuestos y a la relación con cada comunidad por inversión; `prorrogar` erosiona servicios. `turno` cierra el ejercicio en diciembre y abre una desviación si el déficit real supera al previsto en 0,6 pp.
Comunidades: `rc.fisc` (impuestos propios −10…+10), `presIntereses` y `presPool` (intereses descontados antes de repartir), `presLey` (el presupuesto es una ley `__pres` de `leyesaut`), `presResultado`, `reglaFiscal` (PEF y fondo de liquidez) y `presCierre`.

## Equipo y contrapesos (`jefe.js`, `medios.js`, `justicia.js`, `partidoint.js`, `social.js`, `crisis.js`, `campana2.js`, `legado.js`)

- **Jefe de gabinete**: `E.esp.jefe`. Cada sistema registra con `Jefe.registrar(area, {propone, hace})`; en modo *asesor* se llama a
  `propone` (propuestas aprobables en la pestaña) y en *delegado* a `hace`, que gasta los puntos propios del jefe (`capacidad`) con
  efecto reducido al 80 % (`E._delegado`). Puede filtrar, marcharse o ser cesado.
- **Medios**: `E.esp.medios` (relación por medio, portadas, bulos). **Justicia**: `E.esp.just` (CGPJ, TC, fiscal, causas por fases;
  `Justicia.alAprobar` lo llama Congreso para recursos de la oposición). **Partido**: `E.esp.pint` (facciones y congreso federal).
- **Diálogo social**: `E.esp.social`; `prob` calcula la aceptación de sindicatos y patronal. **Crisis**: `E.esp.crisis` con respuesta
  del Estado y de las comunidades.
- **Campañas municipal/europea**: `E.esp.cm` acumula impulso por actos; se aplica como empujón al partido justo antes del recuento
  (envoltorio de `Municipios.elecciones` y `UE.celebrarPE`).
- **Legado**: `E.esp.leg` guarda instantánea semanal, resumen, logros (funciones de condición en `Legado.LOGROS`) y serie de carrera.

## Parlamento autonómico (`sistemas/parlaut.js`)

`E.esp.ccaa[c].pa` = {dis, dp, rdl[], hist[]}. `T.disuelto` (elecciones convocadas o intervención) activa la caducidad de las leyes en trámite y
el uso de la Diputación Permanente (`T.dp`, D'Hondt). `T.decretar` aplica el programa al instante y fija la convalidación a 4 semanas;
`T.convalidar` vota con `posturaAut` (el bloque de gobierno apoya su decreto) en el Pleno o la DP. El jugador vota vía `E.esp.pendienteConvAut`
(bloqueo 'voto'); el jefe de gabinete puede votar por él. Acción `decreto_ley_aut` para el presidente autonómico.

## Autogobierno (`sistemas/autogobierno.js`)

`rc.estatuto.reforma` = {fase borrador|comision|cortes|referendum|tc|cerrada, items:[{id, estado, ins}], hist}. `T.catalogoReforma` mezcla competencias y
`ARTICULOS` (dif = dificultad, tc = riesgo ante el TC). `T.apoyoReforma` estima el apoyo parlamentario; `T.probArticulo` la aceptación del Estado.
Al cerrar el acuerdo se crea el proyecto en el Congreso con `estIt`; `referendumEstatuto` (envuelto) aplica `aplicarReforma` y `estTurno` programa el
recurso ante el TC (`anularArticulo` revierte efectos). `T.presionarComp` suma presión por cuatro vías con enfriamiento de 6 semanas.

## Segunda ola (mayorias, corrupcion, coaliciones, corona, personas, organismos, referendos, estructural, exterior, lenguas, local2, conferencia, guia, ajustes, escenarios)

Cada módulo guarda su estado en `E.esp.<clave>` y se registra con `Tiempo.registrar` (prioridades 44–54). Convenciones:
- Las acciones con argumentos validan siempre su entrada (la simulación de prueba las llama con `{}`) y la Agenda las enlaza a su pestaña con `MODAL = 'ir:pantalla'`.
- `Ejecutivo.mejorPlan` alimenta la calculadora de mayorías; los pactos usan `E.esp.pactos` y el plazo se resuelve con `Coaliciones.retira` (real, no aleatorio).
- `Organismos.sesgoCIS` sustituye al +0,8 fijo del CIS; `Organismos.mercados` entra en la prima de riesgo de `Estructural`.
- Las herramientas de prueba deben limpiar `pendienteConvAut` y `E.esp.gab.escandalo` además de los bloqueos clásicos.
- Nuevos módulos: `campana3` (82-… semanal, envuelve `Campana.turnoCamp`/`consejos`), `nemesis` (55), `dilemas` (56), `metas` (82). Estado en `E.esp.nem`, `E.esp.dil`, `E.esp.metas`. La noche electoral sustituye a `C.Pantallas.elecciones.noche`/`nocheLocales` desde `js/pantallas/noche.js` y delega en la versión clásica como respaldo.
- Más módulos: `presion` (58, `E.esp.pres`), `intriga` (59, `E.esp.intr`; envuelve `Ejecutivo.vetaA` y `Mayorias.cambiarRel`), `barones` (57). `js/pantallas/noche2.js` debe cargarse antes que `noche.js`: `nocheLocales` encadena jornada → noche autonómica en vivo → resumen clásico. `tools/equilibrio-es.js` mide frecuencias (dilemas/año, capital, escisiones, presión) para ajustar constantes.
- `crisis2` (43, `E.esp.cv`, catálogo en `data/crisis-directo.js`), `vida` (60), `debate`, `sesion` (aplaza `Ejecutivo.votar`/`votarMocion` con `E.esp.pendienteSesion`), `PartidoInt.congreso` aplaza con `E.esp.pendienteCongreso`, `fama` (Fama, Tutor). Los bucles de prueba deben limpiar `pendienteCrisisV`, `pendienteCongreso` y resolver `pendienteSesion` con `C.Sesion.resolverAuto`.


## Modo Partido (`sede`, `pactos2`, `fusion`, `satelites`, `militancia`, `rivales`, `objetivos`, `informe`)

Estado en `E.esp.sede`, `E.esp.fus`, `E.esp.sat`, `E.esp.riv`, `E.esp.obj` y contadores en `E.meta.cnt`. Prioridades de turno: `rivales` 36, `satelites` 37, `fusion` 38, `sede` 39, `objetivos` 84.
- **Finanzas del partido** = `pa.finanzas` (0–99; 1 punto ≈ 1,1 M€). La sede es dueña de la implantación y del multiplicador provincial del jugador: `E.esp.pn[prov][pid] = pn0 · (0,8 + 0,4·impl/100) · (1 + bonus del candidato)`. Cualquier código que escale `pn` del partido del jugador debe escalar también `E.esp.sede.pn0` (lo hacen `barones` y `escision`).
- **Programa como promesa** (`Sede.compat/evaluarLey/evaluarVoto`): cada ley (de tu Gobierno o tuya) y cada voto nominal del jugador se comparan con las posturas del programa por sector (`sec` de cada área). Salen *fiabilidad programática* y *coherencia de voto*, que mueven prestigio, apoyo y la hemeroteca (`Dilemas.memoria`).
- **Pactos por programa** (`PactosPrograma`, envuelve `Ejecutivo.proclamar`): los socios exigen medidas de su programa como dilemas `pactoPrograma` (ceder / compromiso / mantener) con plazo.
- **Fusiones** (`Fusion`): fusión, absorción y alianza electoral con compatibilidad por distancia ideológica y relación. Un partido fusionado sale de `P.partidos`/`nacionales` pero se queda en `E.partidos` con `fusionado`. Las alianzas se disuelven tras unas generales.
- **Organizaciones** (`Satelites`): juventudes, fundación, sindicato y medios afines (nivel 0–5, lealtad, mantenimiento en el balance). Envuelve `Corrupcion.nuevo` (los medios amortiguan escándalos).
- **Militancia** (`Militancia`): afiliados frente a simpatizantes, censo de primarias (cerrado/abierto), ponencias en el congreso y campaña de afiliación (sube también `sede.m0`, el nivel al que tiende la militancia).
- **Rivales con IA estratégica** (`Rivales`): tesorería de cada partido de la IA (crisis de caja, casos de financiación) y giros ideológicos anuales según vayan sus encuestas.
- **Objetivos y puntuación** (`Objetivos`): catálogo de 14 objetivos con plazo y premio/castigo, tope de tres; `puntuacion(E)` (poder, fuerza, organización, objetivos) alimenta `Fama.guardar` (`pp`) y el ranking de partidos del Salón de la fama.
- **Escenarios** nuevos (`transicion`, `irrupcion`, `hegemonia`, `pandemia`, `populismo`) usan `empujar`; `Crisis.nueva(E, {tipo, sev})` admite forzar una crisis.
- **Informe de partida** (`Informe`): contadores por `Bus 'accion'`, `Dilemas.decidir`, `CrisisDirecto.cerrar` y elecciones; `generar/texto/json` producen un resumen anónimo con lecturas automáticas de equilibrio (Ajustes → Informe de partida).
- Pruebas: `tools/emocion-es.js` (secciones «Sede…», «Militancia», «Rivales», «Objetivos», «Escenarios históricos», «Informe») y `tools/modopartido-ui.js`. Ojo con `fecha.t === 0`: guarda siempre `!= null` al comprobar marcas de tiempo.

## Escenas ilustradas (`js/ui/escenas.js`, `data/imagenes.js`)

`C.Escenas.html(E, id, {pid, pid2, compacta, leyenda})` devuelve un `<figure class="escena">` con una ilustración SVG procedimental (semilla estable por escena y partido; colores y sigla de `E.partidos[pid]`; el hemiciclo colorea 350 escaños con el reparto real). Si `C.IMAGENES[id]` apunta a un archivo, se superpone un `<img>` con `onerror="this.remove()"` (sólo se pide el archivo si está declarado, así no hay 404 en consola). Se enlaza en: `noche.js` (discurso, vía el parámetro `escena` de `decision`), `crisis2.js` (`Escenas.paraCrisis` elige por texto del paso), `sesion.js`, `debate.js`, `congresopartido.js`, `gabinete.js` (formación) y `Eventos.info(E, titulo, texto, escena)` (fin de carrera). Prueba: `tools/escenas-ui.js` (todas las escenas, integración y sustitución por imagen) más las aserciones de `noche-ui`, `nocheaut-ui`, `sesion-ui` y `congreso-ui`.

## Artículo 155 (`sistemas/art155.js`)

`C.Art155` generaliza el viejo 155 del procés (que sigue disponible: `Territorio.aplicar155` queda envuelto y registra su intervención con `registrarExterna`). Estado: `E.esp.a155 = {p, hist, ult}` (`p` = procedimientos abiertos, `hist` = cerrados) y `rc.interv = {nivel, hasta, ...}` en la comunidad. Fases: `requerimiento` (plazo +4 semanas) → `tc` (fallo +8, si recurre) / `espera` (límite +10) → `autorizada` (4 semanas para elegir medidas) → `intervenida` (26/39/26 semanas según nivel) → cierre. `legit(E,c,motivo)` mide la solidez del motivo (afecta al voto del Senado y al coste político); `senado(E,c,p)` da el voto previsto por grupo (los partidos pactados votan que sí). `puede` limita a un procedimiento por comunidad, enfriamiento de 52 semanas y un máximo de 2 simultáneos, y exige Cortes activas. El jugador puede ser el Gobierno (acciones `requerir_155`, `negociar_senado_155`, `autorizacion_155`, `medidas_155`, `levantar_155`, `retirar_155`) o la comunidad (dilema `requerimiento155`, acción `resistir_155`). Una intervención bloquea las acciones del presidente/a autonómico/a envolviendo `a.disponible` (`bloqueoAccion`/`protege`; el nivel suave sólo bloquea la política fiscal). Pantalla: `pantallas/art155.js` (pestaña *Art. 155* de Territorio).

## Financiación autonómica y cupo (`sistemas/financia.js`)

`E.esp.fa = {ref, hist, ult, ultInt, cupo:{PVA,NAV}}`. `ref` = `{modelo, garantia, fondo, fase:'borrador'|'cortes', cab, cabT, contra, fallos, voto, propId, votoJ}`. `Fa.reparto(E, ref)` reparte puntos de financiación por habitante entre las comunidades que participan (régimen común, canario y singular; no las forales ni las ciudades): cada modelo da una puntuación por comunidad, se centra en la media ponderada por población (suma cero) y se escala a un máximo; `garantia` recorta las pérdidas a cero y lo cobra en déficit; `fondo` suma 0,7 por nivel a todas. `Fa.dispo` convierte el reparto en disposición a firmar (Δ·0,28 + afinidad con el Gobierno + relación con Moncloa − agravio + cabildeo) y `Fa.proyeccion` cuenta los votos previstos (mayoría de las participantes). Al aprobar el Consejo, `aCortes` registra el proyecto `financiacion_reforma` (plantilla `manual`, con `faRef`/`faModelo`) y los partidos que gobiernan las comunidades que votaron sí suman `apoyo` en el Congreso. `Territorio.efectoLey` y `Congreso.alFinalizar` están envueltos para aplicar o cerrar la reforma, y `vigilar` la cierra si el proyecto muere sin votarse. Cupo: `negociar_cupo` fija `cupo[c].stance`; `decideCupo` lo usa en la decisión del Gobierno de la IA (`Consejo`), y `aplicarCupoSuave` implementa los grados «algo más alto/bajo». Pruebas: `tools/financia-es.js` y `tools/financia-ui.js`.

## Campaña municipal completa (`sistemas/campmun.js`)

`E.esp.cmun = {act, tVoto, presup, tope, esf, gasto, estrella, enc, suc, base, bal}`. Se abre sola a `VENT = 12` semanas de `E.esp.muni.proxT` (`turno`, prioridad 35) y se cierra en `Municipios.elecciones` (envuelta). `bono(E, id)` (esfuerzo × 0,016 + gasto × 0,0042 + 0,03 si hay candidato estrella; ×1,4 el esfuerzo en `J.muni`; tope 0,32) multiplica el voto del partido del jugador en `Municipios.votos` (envuelta), así que también lo ven las proyecciones. `proyectar(E, id, ruido)` calcula concejales (D'Hondt con umbral del 5 %), los puntos de voto que faltan para ganar o perder uno y si la alcaldía está en juego; con `ruido` imita una encuesta (sd 0,12 sin encuesta reciente, 0,04 con la propia y 0,10 con la de prensa). `base` guarda la previsión sin campaña para el balance. Acciones: `mitin_local`, `gasto_local`, `candidato_estrella`, `encuesta_local`, `campana_mun_auto` (sólo ámbito local en el foco). Hay 66 ciudades en los datos: el texto no debe fijar la cifra.

## Emergencias por comunidad (`sistemas/crisis3.js`)

Amplía `Crisis` (crisis.js) sin sustituirla: envuelve `nueva`, `cerrar` y `decidir`, y añade un turno propio (`crisis3`, prioridad 43; `Crisis.turno` se registró con su referencia, por eso no se envuelve). `cr.em = {mando, nivel:{c}, pet:[{c,tipo,estado,t,lim}], visitas, fondos, repr, nac}` (sólo en crisis con 4 comunidades o menos). `nivel` sale del daño acumulado respecto al esperado (`frac`: <0,3 → 1, <0,65 → 2, resto → 3). Las peticiones de medios (`peticion`/`resolverPeticion`) las resuelve la IA con `apoyo(E, c)` (0,72 + 0,35·afinidad + (relM−50)/300, acotado) o quedan pendientes del jugador-presidente (dos semanas; luego se conceden por defecto). `repr` (reproches) sube con comunidades de otro partido en nivel ≥ 2 o al denegar/culpar, y al cerrar baja `relM` y la aprobación del Gobierno. Una catástrofe con ≥ 600 M€ de daños en una comunidad abre `E.esp.cem.zonas` («zona afectada gravemente»). Como los sucesos sueltos `incendios`, `dana` e `incendio_forestal` se desactivan (`req = () => false`), las emergencias de temporada nacen en `Emerg.turno`. Dilemas `crisis_aut` y `crisis_estado` (en `DL_AMB`). Pantalla: `pantallas/crisis3.js` sustituye a `Pantallas.crisis.render`. Pruebas: `tools/emerg-es.js`, `tools/crisis3-ui.js`, `tools/campmun-es.js`, `tools/campmun-ui.js`.

## Banderas (`ui/banderas.js`) y disolución (`sistemas/disolucion.js`)

`C.Banderas` dibuja cada bandera en un lienzo SVG de 60 × 40 (`svg(id, {h})` en línea, `mini(id, h)` antepuesta a un texto, `nombre(E, id)` con el nombre, `dentro(id, x, y, w)` para anidarla en otra escena). Los escudos son esquemáticos; Ceuta y Melilla llevan un diseño genérico. Aviso de CSS: `.escena>svg` (hijo directo) es el que se estira al ancho de la figura; si fuera `.escena svg`, anularía el tamaño de las banderas anidadas.

`C.Disolucion` guarda `E.esp.dis = {pend, hist}`. `registrar(E, ambito, modo, motivo)` (ámbito `'ES'` o el id de la comunidad) se llama desde los envoltorios de `Generales.disolver` y `Territorio.adelantar`; el modo sale de `E._modoDisol` (lo fijan las acciones `disolver_cortes` y `adelanto_autonomico` con su argumento `modo`: `sorpresa` | `anunciada`, por defecto `anunciada`) o de `modoPorDefecto` (fin de legislatura → `ordinaria`, sin investidura o falta de apoyos → `forzada`, la IA → 40 % sorpresa). Los efectos van en `efectos` (sorpresa: +0,6 de popularidad al partido que disuelve, −0,3 a su principal rival, −1,5 de estabilidad; anunciada: +0,8). Si afecta al jugador (España o su comunidad) deja un anuncio en `pend`, que `App.revisarPendientes` abre con `Pantallas.declaracion.modal`. `UI.accion` consulta antes a `Pantallas.declaracion.interceptar`, que abre el selector «sorpresa / anunciada» y devuelve `{ok:false, pendiente:true}` (el delegado de clics no cierra modales ni emite `ui:accion` en ese caso). Escenas: `declaracion_pm` y `declaracion_aut` (esta dibuja la bandera de `o.region`; la imagen de IA puede ser por comunidad con la clave `declaracion_aut_<id>`). Pruebas: `tools/disolucion-es.js` y `tools/declaracion-ui.js`.

## Cabildeo del Estatuto (`sistemas/autogobierno.js`)

La reforma estatutaria (`rc.estatuto.reforma`) admite cabildeo en dos sitios, resueltos por `T.cabCtx(E, c)`: el **borrador** en el Parlamento autonómico (`donde: 'parl'`) y el **texto remitido** en el Congreso (`donde: 'cortes'`, proyecto con `estReg = c`). Estado: `r.cab[pid]` (bonus de apoyo por grupo), `r.cabT` (último intento), `r.contra` (contrapartidas pactadas), `r.fallos`, `r.caidos`, y por artículo `it.suav`. `T.itemEf` devuelve el artículo con dificultad y riesgo del TC multiplicados por `SUAV` (0,6) si está suavizado, y lo usan `apoyoReforma(E,c,ids,borr)`, `probArticulo`, `cerrarAcuerdo` y el recurso ante el TC. `T.objeciones` lista, por grupo, los artículos que superan su tolerancia (`0,45 + ter/140`). Acciones: `cabildear_estatuto`, `contrapartida_estatuto`, `suavizar_articulo`, `votar_articulos_estatuto` (sólo tras un voto fallido: vota cada artículo por separado y cae el que no llega a los tres quintos) y `retirar_articulo_cortes` (quita el artículo del proyecto, recalcula `p.ter` y da +0,2 a quien lo rechazaba). En el Congreso, `p.apoyo[pid]` suma a `Congreso.postura`; una contrapartida a un grupo de 15 o más escaños fija `p.pacto` (+1,2, una vez por texto). `Congreso.turno` abre un plazo de enmiendas de cuatro semanas (`p.plazoEnm`) antes del pleno de cualquier proyecto con `estReg`. Pruebas: `tools/estatuto-es.js` y `tools/estatuto-ui.js`.

## Mundo de las comunidades (`sistemas/ccaa2.js`)

`C.Ccaa2` (`E.esp.cc2 = {conv, disp, rel, ext, fla, ult}`) añade las decisiones de una comunidad más allá de las competencias: `convenio` (y su disputa), `atraer`, `delegacion` (máx. 3), `municipios`, `despoblacion`, `pedirFLA` (deuda ≥ 20; 104 semanas de tutela, que envuelve `politica_fiscal`, `presupuesto_aut` e `impuesto_propio`), `impuesto` (añade un recurso a `E.esp.tc.recursos` con `jugador: true`), `sectorial` (Presidente/a del Gobierno). `turno` (prioridad 35) mueve la relación entre comunidades y firma convenios de la IA. Todas las acciones autonómicas pasan por `A.protege` para respetar la intervención del 155. Pantalla: *Cooperación* (`C.Pantallas.cooperacion`). Los seis sucesos nuevos (`tc_anula_ley_aut`, `requerimiento_hacienda`, `disputa_agua_ccaa`, `fuga_empresa`, `crisis_policial_aut`, `alarma_despoblacion`) y los de `art155` están dados de alta en `Foco.EV_AMB`; las acciones, en `ACC_GOB`/`ACC_AMB`; las pestañas, en `TABS_TERR`. Pruebas: `tools/art155-es.js` y `tools/art155-ui.js`.

## Foco por cargo (`sistemas/foco.js`)

`C.Foco` deriva el ámbito del jugador del cargo (`CARGO_AMB`: central · aut · local; `activista` usa `J.nivel`) y lo aplica en todos los puntos donde el juego pide una decisión: `ambito/ejecutivo/pantalla/principales` (menú: `App.navItems`), `accion/grupoDe` (agenda), `evento/dilema` (tablas `EV_AMB`/`DL_AMB`: sin entrada vale para todos; `Eventos.turno` los filtra en las tres vías, `Dilemas.nuevo` devuelve `null`), `noche` (sólo se crea `nochePendiente` si te corresponde: generales/europeas → central; locales → tu comunidad o tu municipio), `campana` (`Campana.mias` filtra las campañas propias; `cur` y `activa` las usan, `camps` sigue siendo todo para la simulación), `ambitosLey`, `tabsTerritorio`, `tabsElecciones` e `info` (tarjeta del Centro de mando, que tiene variantes `renderAut` y `renderLocal`). Las crisis en directo ya decidían por cargo (`CrisisDirecto.decide`). `E.meta.ajustes.foco = 'todo'` (Ajustes → Panorámico) desactiva todo el filtrado. Pruebas: `tools/foco-es.js` (seis perfiles: ninguna decisión de otro nivel y todo suceso/dilema respeta el filtro) y `tools/foco-ui.js` (menú, agenda, Centro de mando, pestañas y Panorámico, en escritorio y móvil). Al añadir un suceso o dilema nuevo de un solo nivel, hay que darlo de alta en esas tablas.
- **Titulares por nivel**: `Noticias.poner(E, tipo, texto, pais, amb)` etiqueta cada titular con `amb` (`aut` | `local`; los generales no llevan etiqueta), `reg` y `muni`, deduciéndolos del texto con `Noticias.nivel` (patrones y nombres de comunidades y municipios) si quien escribe la noticia no los indica; `Foco.noticia` decide qué se ve (ticker, Centro de mando y crónica). Las crisis en directo los indican explícitamente.
- **Crisis por ramo**: `CrisisDirecto.SECTOR` asigna a cada crisis nacional y autonómica los ministerios o consejerías a los que corresponde; `decide(E, a, lugar, id)` hace que su titular la juegue. Al añadir una crisis, hay que darla de alta ahí (lo comprueba `tools/foco-es.js`).
- **Metas por cargo**: el sexto elemento de `Metas.META` es el ámbito en el que se ofrece (`AMB_META` para las existentes); `Metas.visibles` filtra la pestaña y `turno` sólo cumple las visibles.

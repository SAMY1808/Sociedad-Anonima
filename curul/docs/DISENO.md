# CURUL — Simulador político de Colombia
## Documento de diseño (v0.1 · Fase 1)

> Colombia ficticia, institucionalmente inspirada en la real (Constitución de 1991, Ley 5ª de 1992,
> Estatuto de la Oposición — Ley 1909 de 2018, cifra repartidora, voto preferente).
> Los partidos, políticos y medios son inventados.

---

## A. Arquitectura general

```
┌──────────────────────────── index.html (shell) ─────────────────────────────┐
│  data/*.js      →  CURUL.DATA   (datos estáticos: mapa, deptos, partidos…)   │
│  js/core/*      →  CURUL.U (utilidades, RNG con semilla), CURUL.Bus (eventos)│
│                    CURUL.Estado (esquema + migraciones), CURUL.Tiempo (turno)│
│  js/sistemas/*  →  motor de simulación. Cada sistema es un módulo con:      │
│                    · init(estado)      – crea su parte del mundo             │
│                    · turno(estado)     – avanza una semana                   │
│                    · acciones públicas – lo que el jugador/IA puede hacer    │
│  js/ui/*        →  componentes visuales reutilizables (gráficos SVG,         │
│                    hemiciclo, mapa, tarjetas, modales, tooltip)             │
│  js/pantallas/* →  una pantalla = un módulo  render(contenedor, estado)      │
│  js/app.js      →  router, barra superior, control de tiempo                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Principios:

1. **Estado único serializable.** Todo el mundo vive en un objeto `estado` plano (sin clases, sin
   funciones, sin referencias circulares: se usan `id`). Guardar = `JSON.stringify(estado)`.
2. **Sistemas desacoplados.** Los sistemas no se llaman entre sí para dibujar; se comunican por el
   `estado` y por el bus (`CURUL.Bus.emit('ley:sancionada', …)`). La UI escucha el bus.
3. **Registro de sistemas.** `CURUL.Tiempo.registrar(sistema, prioridad)`: el orden del turno es
   explícito (economía → opinión → IA política → Congreso → elecciones → eventos → medios).
   Añadir un sistema nuevo (p. ej. diplomacia) no toca los existentes.
4. **Sin compilación, sin servidor.** Scripts clásicos con espacio de nombres `window.CURUL`,
   para que el juego funcione abriendo `index.html` desde el disco, en GitHub Pages o como PWA.
   Los datos están en `.js` (no `.json`) por la misma razón (`fetch` no funciona en `file://`).
5. **Gráficos propios en SVG** (`js/ui/graficos.js`): líneas, barras, donas, hemiciclos,
   pirámides. Sin dependencias externas → funciona sin conexión.
6. **Aleatoriedad reproducible**: RNG con semilla guardada en el estado.
7. **Versión de esquema** (`estado.meta.esquema`) + `CURUL.Estado.migrar()` para mantener
   compatibilidad con partidas antiguas.

## B. Sistemas principales

| Sistema | Archivo | Responsabilidad |
|---|---|---|
| Personaje | `sistemas/personaje.js` | Creación, atributos, reputación, patrimonio, carrera, agenda (puntos de acción) |
| Mundo | `sistemas/mundo.js` | Generación procedural: políticos, gobierno, gobernadores, historia electoral |
| Partidos | `sistemas/partidos.js` | Popularidad, facciones, disciplina, avales, postura (gobierno/independiente/oposición) |
| IA política | `sistemas/politicos.js` | Personalidades, ambiciones, relaciones, decisiones autónomas |
| Elecciones | `sistemas/elecciones.js` | Calendario, modelo de voto, cifra repartidora, umbrales, 2ª vuelta, campaña |
| Congreso | `sistemas/congreso.js` | Senado, Cámara, curules, bancadas, mesas directivas, comisiones, sesiones |
| Legislación | `sistemas/legislacion.js` | Proyectos, trámite por etapas, ponencias, enmiendas, votaciones, “¿qué pasó?” |
| Economía | `sistemas/economia.js` | Indicadores macro, efectos rezagados (inmediato/mediano/largo plazo) |
| Opinión | `sistemas/opinion.js` | Aprobación presidencial, imagen del jugador por región y segmento, encuestas |
| Medios | `sistemas/medios.js` | Ecosistema de medios, noticias, entrevistas, tono |
| Gobierno | `sistemas/gobierno.js` | Presidente IA, gabinete, agenda legislativa, coalición |
| Eventos | `sistemas/eventos.js` | Eventos procedurales con decisiones y consecuencias |
| Guardado | `sistemas/guardado.js` | Ranuras múltiples, autoguardado, exportar/importar |

## C. Estructura de archivos

```
curul/
├── index.html
├── css/        base.css · layout.css · componentes.css · pantallas.css
├── data/       mapa-colombia.js · departamentos.js · partidos.js · instituciones.js
│               nombres.js · plantillas-proyectos.js · eventos.js · medios.js
├── js/
│   ├── core/       util.js · bus.js · estado.js · tiempo.js
│   ├── sistemas/   personaje · mundo · partidos · politicos · elecciones · congreso ·
│   │               legislacion · economia · opinion · medios · gobierno · eventos · guardado
│   ├── ui/         dom.js · graficos.js · hemiciclo.js · mapa.js · componentes.js
│   ├── pantallas/  inicio · creacion · dashboard · mapa · congreso · proyecto · votacion ·
│   │               partidos · campana · noche-electoral · personaje · medios · oposicion · partidas
│   └── app.js
├── assets/
└── docs/DISENO.md
```

## D. Modelo de datos (resumen)

```js
estado = {
  meta:     { esquema, version, semilla, rng, creado, nombrePartida },
  fecha:    { semana, anio, mes, dia, turno },        // 1 turno = 1 semana
  jugador:  { id, nombre, genero, edad, nacimiento, residencia, educacion, profesion,
              ideologia:{eco,soc}, atributos:{carisma,oratoria,gestion,negociacion,integridad},
              reputacion:{honestidad,competencia,liderazgo,experiencia,cercania,transparencia},
              popularidad, reconocimiento, credibilidad, patrimonio, ingresos, gastos,
              familia:[], cargo, partido, trayectoria:[], historialElectoral:[],
              historialLegislativo:[], escandalos:[], reconocimientos:[], agenda:{puntos,max} },
  politicos: { [id]: { id, nombre, genero, edad, depto, partido, ideologia:{eco,soc},
              rasgos:{ambicion,disciplina,pragmatismo,carisma,integridad,experiencia},
              intereses:[sector], relJugador, cargo:{tipo,camara,circ,comision,rol},
              stats:{asistencia,proyectos,aprobados,votos}, ambicionCargo, historial:[] } },
  partidos: { [id]: { id, nombre, sigla, color, ideologia, popularidad, postura, cohesion,
              facciones:[{id,nombre,peso,ideologia,lider,relJugador}], lider, finanzas,
              militantes, fuerzaRegional:{[depto]:factor} } },
  deptos:   { [id]: { id, nombre, capital, poblacion, electores, pib, pobreza, desempleo,
              educacion, salud, seguridad, infraestructura, inclinacion, gobernador,
              alcalde, aprobacionPres, curulesCamara } },
  congreso: { senado:{curules:[{id,politico,circ}], mesa:{}, comisiones:{}},
              camara:{…}, legislatura:{numero,periodo,enSesion} },
  proyectos: { [id]: { id, titulo, sector, tipo, autor, origen, etapa, etapas:[],
              ideologia, costoFiscal, efectos:[], popularidad, apoyos, opositores,
              enmiendas:[], historial:[], votaciones:[], vence } },
  votaciones: [ { id, proyecto, camara, instancia, fecha, votos:{[pol]:'si'|'no'|'abs'|'aus'},
              factores:{[pol]:{…}}, resultado } ],
  gobierno: { presidente, vice, partido, coalicion:[partido], gabinete:{[min]:pol},
              aprobacion, agenda:[proyecto] },
  economia: { pib, crecimiento, inflacion, desempleo, pobreza, deuda, deficit, tasa, …,
              efectosPendientes:[{turno,var,delta}] },
  opinion:  { historial:{aprobacionPres:[], jugador:[]}, segmentos:{…} },
  elecciones: { calendario:[], campana:null|{…}, historico:[] },
  medios:   { lista:[], noticias:[] },
  eventos:  { activos:[], historial:[] },
  series:   { [indicador]: [[turno, valor]] }       // alimenta todos los gráficos
}
```

## E. Flujo de una partida

```
Nueva partida → Crear personaje (origen, región, formación, ideología, cargo inicial)
      → Generación del mundo (semilla): 11 partidos, ~330 políticos, Congreso elegido en 2026
        con el modelo electoral real, presidente y coalición, gobernadores, medios, economía
      → Centro de mando (dashboard)
      ┌─ Turno (semana) ───────────────────────────────────────────────┐
      │ El jugador gasta PUNTOS DE AGENDA en acciones (proyectos,      │
      │ cabildeo, control político, medios, recorridos, campaña…)      │
      │ ► Avanzar: economía → opinión → IA política → Congreso         │
      │   (comisiones y plenarias votan) → gobierno → elecciones →     │
      │   eventos (decisiones) → medios (noticias) → series/guardado   │
      └────────────────────────────────────────────────────────────────┘
      → Elecciones periódicas (Congreso+Presidencia cada 4 años en marzo/mayo,
        regionales en octubre) → Noche electoral → nuevos cargos → …
```

## F. Sistema electoral

- **Calendario real**: Congreso (2º domingo de marzo), Presidencia (1ª vuelta mayo, 2ª junio),
  instalación del Congreso 20 de julio, posesión presidencial 7 de agosto, regionales en octubre.
- **Modelo de voto**: cada departamento tiene una inclinación ideológica y un peso de cada partido
  (`fuerzaRegional`). Votos de un partido en un depto = electores × participación × cuota,
  donde la cuota combina: base regional × popularidad nacional × afinidad ideológica ×
  maquinaria (gobernador/alcaldes del partido) × ruido.
- **Senado**: circunscripción nacional de 100 curules, **umbral 3 %**, **cifra repartidora
  (D'Hondt)**; + 2 indígenas, + 5 Comunes (Acuerdo de Paz, hasta 2026 en la realidad; aquí
  configurable), + 1 para el 2º en la presidencial (Estatuto de Oposición) = 108.
- **Cámara**: circunscripciones departamentales (161 curules, umbral 50 % del cociente, o 30 % en
  circunscripciones de ≤2 curules) + especiales (afro 2, indígena 1, raizal 1, exterior 1),
  CITREP 16, Comunes 5, fórmula vicepresidencial perdedora 1 = 188.
- **Voto preferente**: dentro de cada lista, las curules se asignan por votos personales. El
  jugador compite contra sus propios compañeros de lista.
- **Presidencia**: dos vueltas (50 %+1), mapa por departamento.
- **Campaña**: aval (partido o firmas), equipo, recaudo con **tope de gastos**, publicidad,
  eventos, recorridos, debates, encuestas; métricas visibles: reconocimiento, favorabilidad,
  intención de voto por departamento, estructura territorial, voluntarios.
- **Noche electoral**: boletines de la Registraduría (mesas informadas 0→100 %), mapa que se
  colorea, barras, curules en hemiciclo, participación y comparación con la elección anterior.

## G. Sistema parlamentario

- **Curules visibles**: hemiciclo SVG (Senado en semicírculo clásico; Cámara en herradura con
  vista alternativa de **mapa de circunscripciones**). Cada curul es un objeto con político.
- **Mesas directivas** anuales (20 de julio), **7 comisiones constitucionales permanentes**
  (1ª Constitucional … 7ª Salud y Trabajo), con presidente y vicepresidente.
- **Bancadas** con vocero, disciplina y postura (gobierno / independiente / oposición, según
  la declaración del Estatuto de Oposición).
- **Trámite** (ley ordinaria, 4 debates; acto legislativo, 8 debates en dos vueltas):
  Radicación → Comisión (ponencia, 1er debate) → Plenaria (2º) → otra cámara: Comisión (3º) →
  Plenaria (4º) → Conciliación → Presidencia (sanción u objeción). Un proyecto que no concluye en
  dos legislaturas se **archiva** (art. 162).
- **Votación**: cada congresista calcula una utilidad con factores trazables (ideología,
  disciplina de bancada, gobierno/oposición, relación con el autor/jugador, presión regional,
  opinión pública, cercanía de elecciones, negociaciones). El resultado se guarda con sus
  factores → pantalla **“¿Qué pasó?”** con quién cambió de posición respecto al conteo previo y por qué.
- **Distancia de mayoría**: votos a favor proyectados vs. mayoría requerida (simple, absoluta
  o calificada según el tipo de proyecto).
- **Acciones del congresista**: radicar, adherir, pedir ponencia, enmendar, cabildear
  (congresista, bancada, facción), citar a debate de control político, intervenir, votar.

## H. Sistema de partidos

- 11 partidos ficticios con ideología (económica y social), color, sigla, dirección y facciones
  (moderados, progresistas, conservadores, tecnócratas, regionalistas…).
- Popularidad nacional dinámica, fuerza regional, cohesión (→ disciplina de bancada),
  finanzas, militancia, postura frente al gobierno.
- **Mapa interno del partido**: facciones como burbujas proporcionales a su peso, posición
  ideológica y relación con el jugador. El aval depende de la facción dominante.
- Transfuguismo sólo en ventana preelectoral (prohibición de doble militancia).

## I. Sistema económico (base en F1, profundidad en F2)

Variables: PIB, crecimiento, inflación, desempleo, pobreza, deuda/PIB, déficit, recaudo, gasto,
inversión, exportaciones, importaciones, tasa de interés. Cada ley sancionada o decisión encola
**efectos rezagados** (`{enTurnos, variable, delta}`) en tres horizontes: inmediato (0-4
semanas), mediano (6-12 meses), largo (2-4 años). Un gasto no financiado sube el déficit →
deuda → tasa → crecimiento. Choques exógenos vía eventos.

## J. Sistema de gobierno

Presidente IA (o jugador en F2) con coalición, gabinete de 19 ministerios con ministros que
tienen partido, ideología y ambición; agenda legislativa (proyectos del gobierno con mensaje de
urgencia), relación con bancadas, aprobación mensual. Crisis ministeriales, remociones y
reorganización de prioridades presupuestales (F2).

## K. Sistema de eventos

Plantillas con condiciones (`requiere`), peso, alcance (nacional / regional / jugador),
opciones con consecuencias diferidas y texto variable. Tipos: económico, desastre, orden público,
escándalo (del gobierno o de otros; al jugador sólo ocasionalmente), éxito deportivo,
diplomático, movilización social, interna partidista, reconocimientos. Los eventos del mundo
ocurren sin el jugador; los que lo afectan abren un modal de decisión.

## L. Diseño de interfaz

Estética “sala de situación”: fondo azul noche, papel oficial marfil para expedientes,
acentos tricolor discretos. Barra superior con fecha, cargo, puntos de agenda y controles de
tiempo (▶ 1 semana, ▶▶ 4 semanas). Navegación lateral por iconos. Tarjetas con KPIs y
mini-gráficos, hemiciclos interactivos con tooltip, mapa por capas, modales de votación
animados, ticker de noticias. Adaptado a móvil (navegación inferior).

## M. Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Personaje, mapa, elecciones (Congreso + Presidencia + noche electoral), partidos, Congreso visual (Senado, Cámara, curules, comisiones), proyectos y votaciones con “¿qué pasó?”, dashboard, guardado múltiple | **en construcción (esta entrega)** |
| 2 | Jugador presidente, ministerios completos, presupuesto por sectores, economía profunda, opinión segmentada ampliada, medios con entrevistas, Centro de Oposición completo, coaliciones con estabilidad | base de datos y ganchos listos |
| 3 | Gobernaciones, alcaldías, asambleas, concejos, municipios en el mapa | |
| 4 | Diplomacia, mapa mundial, cumbres, crisis internacionales | |
| 5 | Cientos de políticos con carreras independientes, partidos que nacen y mueren, décadas | |

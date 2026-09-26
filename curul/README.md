# CURUL — Simulador político de Colombia

Simulador de estrategia política ambientado en una Colombia ficticia pero institucionalmente
inspirada en la real. Construyes una carrera desde lo local hasta la Presidencia y ves el sistema
funcionando: mapa por capas, hemiciclos con cada curul, votaciones nominales animadas, trámite
legislativo por etapas, noche electoral, partidos con facciones, gobierno, oposición y economía.

**Jugar:** abre `curul/index.html` (funciona desde el disco, en GitHub Pages o con cualquier servidor estático).

## Qué hay en esta versión (Fase 1 completa + Fase 2 en curso)

- **Personaje**: identidad, formación, atributos, ideología en dos ejes, 12 trayectorias iniciales
  (líder comunitario, activista, académico, periodista, asesor, empresario, sindicalista, ONG,
  concejal, diputado, representante, senador), familia, patrimonio, reputación y árbol de carrera.
- **Mundo procedural con semilla**: 12 partidos ficticios con facciones, ~650 políticos con
  personalidad, 33 departamentos con indicadores reales aproximados, gobernadores, alcaldes, medios.
- **Elecciones**: Congreso (Senado nacional con umbral del 3 %, Cámara por departamentos con
  umbral del 50 %/30 % del cociente, cifra repartidora, voto preferente, circunscripciones
  especiales y CITREP), Presidencia a dos vueltas, regionales. Campaña con aval o firmas, tope de
  gastos, equipo, eventos, pauta, debates, encuestas. **Noche electoral** animada por boletines.
- **Congreso visual**: Senado (semicírculo) y Cámara (herradura y mapa de circunscripciones),
  tarjeta de cada congresista al pasar el cursor, mesas directivas, bancadas, 7 comisiones
  constitucionales, composición gobierno/independientes/oposición, simulador de coaliciones,
  estabilidad de la coalición, orden del día y bitácora de actividad.
- **Legislación**: expediente de cada proyecto, trámite de 4 debates (8 para actos legislativos),
  ponencias, conciliación, sanción u objeción presidencial, archivo por tránsito de legislatura.
  Cabildeo, acuerdos con bancadas, enmiendas, presión mediática, **distancia de mayoría** y
  votaciones con **“¿Qué pasó?”** (quién cambió de posición y por qué).
- **Gobierno y oposición**: presidente IA, gabinete de 19 ministerios, agenda legislativa,
  debates de control político, mociones de censura, Consejo de Ministros, Centro de Oposición.
- **Presupuesto General de la Nación**: si eres presidente, formulas tú mismo el gasto público
  total y la participación de cada ministerio (con vista previa de déficit e indicadores); si no,
  lo formula el Gobierno según su ideología. Se radica cada 20 de julio como un proyecto de ley
  más (mismas herramientas de cabildeo y trámite); si el Congreso no lo aprueba a tiempo, rige la
  propuesta del Gobierno (art. 348 C.P.). Crisis sectoriales por subfinanciación con decisiones
  de emergencia (recortar otro sector o pedir crédito).
- **Economía y opinión**: indicadores macro con efectos rezagados (inmediatos, mediano y largo
  plazo), aprobación presidencial, imagen del jugador por región y segmento, encuestas.
- **Medios y eventos**: 14 medios ficticios, noticias, entrevistas; eventos procedurales con decisiones.
- **Guardado**: múltiples partidas (IndexedDB), autoguardado, exportar/importar `.json`,
  esquema versionado con migraciones.

## Arquitectura

Ver [`docs/DISENO.md`](docs/DISENO.md) (arquitectura, modelo de datos, sistemas y roadmap).

```
curul/
├── index.html          shell + orden de carga
├── css/                base · layout · componentes · pantallas
├── data/               datos estáticos (mapa, departamentos, partidos, instituciones…)
├── js/core/            utilidades, bus de eventos, estado, motor de turnos, acciones
├── js/sistemas/        simulación (un módulo por sistema, registrado en el motor de turnos)
├── js/ui/              gráficos SVG, hemiciclo, mapa, componentes
├── js/pantallas/       una pantalla por módulo
└── js/app.js           navegación y control del tiempo
```

Créditos: geometría de departamentos derivada de `@john-guerra/geo-colombia` (MIT), ver `data/LICENCIA-mapa.txt`.

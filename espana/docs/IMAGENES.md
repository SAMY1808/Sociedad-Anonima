# Imágenes de los momentos clave

El juego dibuja cada momento importante con una **ilustración integrada** (SVG que usa los colores y las siglas de tu partido). Puedes sustituir cualquiera por una **imagen generada con IA** u otra foto:

1. Genera la imagen con tu herramienta favorita (formato horizontal, mejor 20:9 o 16:9, unos 1600×720 px; WebP o JPG para que pese poco).
2. Guárdala en `img/eventos/`, por ejemplo `img/eventos/funeral_estado.webp`.
3. Asóciala en `data/imagenes.js`:

```js
C.IMAGENES = {
  funeral_estado: 'img/eventos/funeral_estado.webp',
  noche_victoria: 'img/eventos/noche_victoria.webp'
};
```

4. Recarga el juego (dos veces, por la caché). Si el archivo no existe o falla, se ve la ilustración integrada. La imagen se recorta al centro (`object-fit: cover`), así que deja lo importante en el medio y evita texto en los bordes.

> Consejo: pide «sin rostros reconocibles» y evita personas reales. Si quieres que aparezca el atril de **tu** partido, añade al prompt sus colores y siglas.

## Escenas disponibles

### `noche_victoria` — Noche electoral: victoria
- **Dónde sale:** Noche electoral (generales y autonómicas en directo): discurso desde la sede, si tu partido es el más votado o gana escaños.
- **Qué muestra la ilustración:** Atril del partido con el discurso desde la sede, confeti y militancia entusiasta.
- **Prompt sugerido (inglés):** cinematic photo of an election night victory speech in Spain, a leader at a podium with a large party-coloured backdrop and logo, confetti falling, cheering crowd waving flags, warm stage lights, dusk, shallow depth of field, photojournalism style, no real faces

### `noche_derrota` — Noche electoral: derrota
- **Dónde sale:** Noche electoral: comparecencia ante la militancia tras un mal resultado.
- **Qué muestra la ilustración:** Comparecencia ante una militancia abatida bajo una luz tenue.
- **Prompt sugerido (inglés):** cinematic photo of a disappointing election night in Spain, a leader speaking from a podium in front of a dim party backdrop, a few downcast supporters, rain, muted blue light, melancholic mood, photojournalism style, no real faces

### `funeral_estado` — Funeral de Estado
- **Dónde sale:** Crisis en directo con funeral de Estado (p. ej. el atentado, paso final).
- **Qué muestra la ilustración:** Catafalco con ataúd cubierto por la bandera, velas, guardia de honor y la nave de una catedral.
- **Prompt sugerido (inglés):** cinematic photo inside a Spanish cathedral during a state funeral, a coffin draped with the red and yellow flag on a catafalque, candles, honour guards in ceremonial uniform, mourners in black, golden light through stained glass, solemn atmosphere, no real faces

### `investidura` — Investidura en el hemiciclo
- **Dónde sale:** Debate de investidura en directo.
- **Qué muestra la ilustración:** El candidato defiende su programa desde la tribuna ante los escaños, coloreados según el reparto real.
- **Prompt sugerido (inglés):** cinematic photo of the Spanish Congress of Deputies chamber during an investiture debate, a speaker at the tribune facing the semicircle of red seats, the speaker's dais with the coat of arms behind, warm light, no real faces

### `mocion_censura` — Moción de censura
- **Dónde sale:** Moción de censura en directo.
- **Qué muestra la ilustración:** Tensión en el hemiciclo: un portavoz interpela al Gobierno bajo una luz roja.
- **Prompt sugerido (inglés):** cinematic photo of a no-confidence motion in the Spanish Congress of Deputies, a deputy speaking intensely from the tribune, tense faces on the benches, dramatic red-tinted lighting, no real faces

### `debate_tv` — Debate electoral en televisión
- **Dónde sale:** Debate electoral televisado en directo.
- **Qué muestra la ilustración:** Dos atriles, un moderador y un plató con luces de estudio.
- **Prompt sugerido (inglés):** cinematic wide photo of a televised election debate studio, two candidates at podiums in different party colours, a moderator desk in the centre, large LED screen backdrop, studio spotlights and cameras, no real faces

### `congreso_partido` — Congreso del partido
- **Dónde sale:** Congreso federal del partido en directo.
- **Qué muestra la ilustración:** Escenario con el lema del partido, delegados con sus papeletas y el atril del liderazgo.
- **Prompt sugerido (inglés):** cinematic photo of a political party congress in Spain, a big stage with a huge party-coloured banner and logo, a leader at the podium, hundreds of delegates seen from behind holding voting cards, warm stage lighting, no real faces

### `manifestacion` — Manifestación
- **Dónde sale:** Crisis en directo con huelgas, protestas o disturbios.
- **Qué muestra la ilustración:** Una multitud con pancartas y banderas en una plaza al atardecer.
- **Prompt sugerido (inglés):** cinematic documentary photo of a large street demonstration in a Spanish city at dusk, dense crowd with placards and flags, red flares and smoke, old city buildings in the background, no real faces

### `emergencia` — Emergencia en la calle
- **Dónde sale:** Crisis en directo con atentados, accidentes, ciberataques o rehenes.
- **Qué muestra la ilustración:** Ambulancias y policía con luces de emergencia, cinta de balizamiento y equipos de rescate.
- **Prompt sugerido (inglés):** cinematic night photo of an emergency scene in a Spanish city street, ambulance and police car with flashing blue and red lights, police tape, rescue workers in reflective vests, smoke in the air, wet asphalt, no real faces

### `incendio` — Incendio forestal
- **Dónde sale:** Crisis en directo con incendios.
- **Qué muestra la ilustración:** Una ladera en llamas bajo un cielo naranja, con un hidroavión descargando agua.
- **Prompt sugerido (inglés):** cinematic aerial-style photo of a wildfire in the Spanish countryside at dusk, flames on a hillside, thick smoke columns, orange sky, a firefighting seaplane dropping water, embers in the air

### `inundacion` — Inundación
- **Dónde sale:** Crisis en directo con inundaciones o temporales.
- **Qué muestra la ilustración:** Calles anegadas bajo la lluvia, tejados asomando y una barca de rescate.
- **Prompt sugerido (inglés):** cinematic photo of a flooded Spanish town after torrential rain, brown water up to the first floor of houses, rescue boat with emergency workers, grey stormy sky, heavy rain, no real faces

### `apagon` — Apagón
- **Dónde sale:** Crisis en directo con apagones.
- **Qué muestra la ilustración:** Una ciudad a oscuras bajo la luna, con solo unas pocas velas en las ventanas.
- **Prompt sugerido (inglés):** cinematic night photo of a Spanish city during a total blackout, skyline completely dark under a bright moon and stars, a few candles lit in windows, car headlights on a road, quiet eerie atmosphere

### `toma_posesion` — Promesa del cargo
- **Dónde sale:** Formación del Gobierno tras la investidura (promesa del cargo).
- **Qué muestra la ilustración:** Mano alzada sobre el texto constitucional ante las banderas, con cortinas de palacio y flashes.
- **Prompt sugerido (inglés):** cinematic photo of a government swearing-in ceremony in a Spanish palace hall, a person with a raised hand over an open constitution on a table, Spanish and EU flags behind, crimson curtains, camera flashes, formal lighting, no real faces

### `retirada` — Fin de una carrera
- **Dónde sale:** Fin de una carrera (retirada de la política).
- **Qué muestra la ilustración:** Un atril vacío contra un atardecer: se cierra una etapa política.
- **Prompt sugerido (inglés):** cinematic photo of an empty political podium with a single microphone at sunset in front of a Spanish government building, long shadows, warm golden light, quiet and reflective mood, no people


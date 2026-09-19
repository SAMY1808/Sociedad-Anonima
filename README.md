# Sociedad Anónima — v41

Simulador de vida corporativa y sucesión familiar en Colombia. Un solo archivo,
sin dependencias externas, jugable desde el navegador o instalable como app.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | El juego completo |
| `manifest.webmanifest` | PWA: nombre, colores, iconos |
| `sw.js` | Service worker v41 (red primero, caché de respaldo) |
| `icon-180.png` | Icono para iOS (`apple-touch-icon`) |
| `icon-192.png` · `icon-512.png` | Iconos para instalar en Android y escritorio |
| `icon-maskable-512.png` | Icono *maskable*, con zona segura para Android |

## Publicar en GitHub Pages

Subir los siete archivos a la raíz de la rama que sirve Pages. Nada más.
Al publicar una versión nueva, subir el número de `CACHE` en `sw.js`
(`sociedad-anonima-v41` → `v42`); si no, los navegadores siguen sirviendo la
copia vieja desde el caché.

## Qué se corrigió en v41

**La capa v40 no se estaba ejecutando.** `init40()` arrancaba con un
`setTimeout` al cargar la página y su primera llamada, `addAcciones40()`, leía
`S.emp` cuando todavía no existía partida. La excepción abortaba el arranque
completo, así que ninguna de las seis extensiones llegaba a instalarse: ni el
estado financiero visible, ni los préstamos del propietario, ni el apellido de
los nietos, ni los parches de gobierno familiar, paso de año y render. Medido
antes y después: 0 de 6 instaladas → 6 de 6.

- `addAcciones40()` instala su envoltorio siempre; la comprobación de empresa
  queda dentro, donde corresponde.
- Cada paso de `init40()` va protegido: si uno falla, los otros cinco siguen.
- Se añadió un reintento por si el orden de carga cambia.

**Herencia sin progresión.** Todo heredero arrancaba con reputación y contactos
en 100, heredara un apellido señorial o uno arruinado, porque partía de una base
fija de élite sumada al bono del legado. Ahora lo que recibe sale del prestigio
real de la casa: 95 de reputación heredando una casa de prestigio 85, y 17
heredando una de prestigio 4.

**Pareja sin oficio.** Las parejas venidas de ramas descendientes podían quedar
sin `rol` y la ficha mostraba «cónyuge, undefined, 56 años». Corregido en los
tres puntos donde se crean y en los dos donde se pinta.

**Cuatro funciones duplicadas.** `correrFundacion`, `valorFamilyOffice`,
`escenaFamilyOffice` y `correrFamilyOffice` estaban declaradas dos veces; la
segunda pisaba a la primera, dejando versiones viejas como código muerto que
invitaba a editar el sitio equivocado. Retiradas.

**PWA incompleta.** Faltaban los iconos de 192 y 512, sin los cuales Chrome no
ofrece instalar la aplicación, y el único que había estaba marcado como
*maskable* sin zona segura, así que Android lo recortaba. Se regeneraron los
iconos en alta resolución y se separó el *maskable*. El `start_url` y el `scope`
pasaron a `./`.

**Service worker.** Guardaba en caché cualquier respuesta, incluidos errores y
peticiones de otros orígenes. Ahora solo almacena respuestas correctas del mismo
origen, instala los archivos uno a uno (antes un solo fallo cancelaba toda la
instalación) y responde con `index.html` si no hay nada en caché.

## Cómo se verificó

- Sintaxis de los tres bloques de script.
- Búsqueda de funciones llamadas sin declarar y de declaraciones duplicadas.
- Barrido de las 81 escenas con la caja en cero: ninguna se queda sin salida.
- Partidas completas jugadas por clics (unos 150 años, 570 cartas, 980 escenas)
  detectando errores, cifras no finitas, textos rotos y pestañas vacías.
- Cuatro generaciones seguidas, comprobando que las referencias internas
  (compañía activa dentro del grupo, junta ligada a su compañía) sobreviven.
- Guardar, recargar y seguir jugando.

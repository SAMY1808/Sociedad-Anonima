# Sociedad Anónima — v42

Simulador de vida corporativa y sucesión familiar en Colombia. Un solo archivo,
sin dependencias externas, jugable en el navegador o instalable como app.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | El juego completo |
| `manifest.webmanifest` | PWA: nombre, colores, iconos |
| `sw.js` | Service worker v42 (red primero, caché de respaldo) |
| `icon-180.png` | Icono para iOS |
| `icon-192.png` · `icon-512.png` | Iconos para instalar en Android y escritorio |
| `icon-maskable-512.png` | Icono *maskable*, con zona segura |

## Publicar en GitHub Pages

Subir los siete archivos a la raíz de la rama que sirve Pages. **Al publicar una
versión nueva hay que subir el número de `CACHE` en `sw.js`** (`v42` → `v43`);
si no, los navegadores siguen sirviendo la copia vieja.

## Novedades de v42

**Pensiones.** El 16% de lo que ganas se cotiza cada año y suma semanas. Con
1.300 semanas y la edad cumplida (62 hombres, 57 mujeres) puedes pensionarte: la
mesada sale del promedio de lo cotizado, con una tasa de reemplazo que sube
mientras más semanas tengas, y se ajusta con la inflación todos los años. Puedes
estar en Colpensiones o en un fondo privado, donde la mesada depende del saldo
acumulado y su rendimiento; el traslado entre regímenes solo se permite hasta
diez años antes de la edad de pensión. Si llegas a la edad sin las semanas, te
queda la indemnización sustitutiva: te devuelven lo aportado y renuncias a la
mesada. Pensionarse no impide volver a trabajar.

**Sueldo del presidente.** Presidir tu propia compañía es un cargo, y ahora se
paga: el sueldo sale de la caja de la empresa, entra a tu bolsillo personal y
cotiza a pensión. Cinco niveles, de no cobrar nada a fijarlo a tu antojo.
Renunciar al sueldo sube la lealtad de la junta y la moral interna; cobrar por
encima del mercado la baja, y hacerlo con la compañía en pérdidas cuesta también
prestigio.

**Los cargos en el exterior obligan a mudarse.** Antes se podía aceptar una
vicepresidencia en Nueva York y seguir viviendo en Medellín. Ahora, al aceptar
un cargo fuera del país (las sillas de junta no cuentan, esas se atienden
viajando), se abre el desglose del traslado: tiquetes según cuántos son en la
casa, visados y trámites, trasteo de enseres, instalación en destino, depósito y
primer arriendo. Si tienes vivienda propia se vende para financiarlo, en destino
empiezas arrendando, y pierdes cerca del 45% de tus contactos. Si no tienes con
qué pagar el traslado, no puedes aceptar el cargo.

## Correcciones de v42

**`window.S` no existía.** Ocho puntos del código comprobaban `window.S` antes
de actuar, pero `S` está declarada con `let` y las variables `let` del ámbito
global no se cuelgan de `window`. La comprobación siempre fallaba, así que
salían por la puerta de atrás sin hacer nada: las migraciones de estado de las
capas v35 y v40, el paso anual de la capa narrativa y el bloque financiero en
pantalla. Corregido en los ocho sitios.

**Acción duplicada.** "Fundar una compañía desde cero" aparecía dos veces en la
mesa en cuanto tenías empresa: dos `A.push` distintos llamando a lo mismo, y el
segundo sin control de capital mínimo. Retirado el repetido.

**Ciudades que no existían.** Los generadores de ofertas proponían cargos en
Madrid, Washington y Montevideo, que no están en el catálogo del juego, y en
"Panamá" cuando la ciudad se llama "Ciudad de Panamá". Mientras nadie se mudaba
no se notaba; con el traslado obligatorio, el hogar habría quedado en una ciudad
fantasma. Sustituidas por destinos reales del juego, más una validación que no
exige mudanza si el destino no se reconoce.

## Cómo se verificó

- Sintaxis de los tres bloques de script y del service worker.
- Volcado de la lista de acciones en diez estados distintos de partida, buscando
  títulos repetidos y acciones diferentes que ejecuten lo mismo.
- Barrido de las 81 escenas con la caja en cero: ninguna se queda sin salida.
- Partidas completas jugadas por clics (unos 136 años, 450 cartas, 780 escenas)
  detectando errores, cifras no finitas, textos rotos y pestañas vacías.
- Pruebas dirigidas de lo nuevo: cotización, pensión por ambos regímenes,
  indemnización sustitutiva, sueldo del presidente y su efecto en la junta,
  traslado aceptado, traslado sin fondos y silla de junta sin mudanza.

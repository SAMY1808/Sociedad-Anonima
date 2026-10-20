# Calculadora Electoral — PWA

Simulador de sistemas electorales (métodos de reparto, escenarios de Colombia, Cauca y Antioquia, capas de gobierno). Funciona sin internet una vez abierta la primera vez.

## Qué trae esta carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | La calculadora completa (un solo archivo, sin dependencias externas) |
| `manifest.webmanifest` | Nombre, colores e íconos de la app |
| `sw.js` | Service worker: caché para que abra al instante y sin internet |
| `icons/` | Íconos (180 para iPhone, 192/512 y maskable) |

## Publicar en GitHub Pages

1. Crea un repositorio público nuevo, por ejemplo `calculadora-electoral` (uno aparte del de Sociedad Anónima).
2. Sube **el contenido** de esta carpeta a la raíz del repo (`index.html`, `manifest.webmanifest`, `sw.js` y la carpeta `icons/`), con *Add file → Upload files*.
3. En *Settings → Pages* elige *Deploy from a branch*, rama `main`, carpeta `/ (root)` y guarda.
4. Espera uno o dos minutos. La app queda en `https://TU-USUARIO.github.io/calculadora-electoral/`.

## Instalarla en el iPhone

1. Abre esa dirección en **Safari** (tiene que ser Safari; en otros navegadores el botón no aparece igual).
2. Toca **Compartir** → **Añadir a pantalla de inicio**.
3. Deja activado **Abrir como app web** y toca **Añadir**. El nombre sale como "Electoral"; puedes cambiarlo en ese mismo paso.
4. Ábrela desde el ícono nuevo. La primera vez necesita internet; después abre también sin conexión.

## Ojo con los datos

- Lo que guardes dentro de la app del iPhone (escenarios, autoguardado, tema) queda **solo en ese teléfono** y separado del de Safari y del de la app de Mac.
- Para pasar un escenario de un aparato a otro: **💾 Exportar** en uno y **📂 Importar** en el otro. En iPhone, Exportar abre la hoja de compartir del sistema; elige **Guardar en Archivos** (o AirDrop, Mensajes, correo).
- Si borras la app del iPhone, se borran también sus datos guardados. Exporta antes lo que quieras conservar.
- El código de `index.html` queda público en esa dirección (tus escenarios guardados no: esos viven en el teléfono).

## Actualizar la app después

1. Reemplaza `index.html` en el repo por la versión nueva.
2. Sube el número de `CACHE_VERSION` en `sw.js` (de `1` a `2`, etc.).
3. En el iPhone, ábrela una vez con internet; si no ves el cambio, ciérrala del todo (deslizar hacia arriba en el selector de apps) y vuelve a abrirla.

Sin el paso 2 también se actualiza, pero recién en la segunda apertura.

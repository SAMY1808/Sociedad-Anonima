# Sociedad Anónima — v42

Simulador de vida, patrimonio, empresa y dinastía familiar.

## Archivos

- `index.html` — juego completo.
- `manifest.webmanifest` — configuración PWA.
- `sw.js` — service worker v42.
- `icon-180.png` — icono PWA.

## Cambios de v42

- Las parejas de las ramas descendientes avanzan de edad correctamente.
- Al nacer un descendiente se puede escoger apellido de la rama, de la pareja o ambos linajes.
- Las propiedades cedidas a hijos conservan metadatos de patrimonio de rama.
- La insinuación testamentaria conserva una vigencia de 10 años para el efecto sucesorio.
- Se mantiene la arquitectura acumulada de v41: descendencia autónoma, embarazo escalonado, sucesión, empresas, cajas separadas, préstamos del propietario y PWA.

## GitHub Pages

Sube estos cuatro archivos al directorio raíz del repositorio y haz commit en `main`.
El service worker v42 invalida las cachés anteriores cuando se activa.

## Validación

El JavaScript embebido en `index.html` y `sw.js` fue validado con `node --check`.

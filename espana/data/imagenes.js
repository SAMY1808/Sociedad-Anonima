/* Imágenes propias para las escenas clave (por ejemplo, generadas con IA).
   Asocia el id de una escena con la ruta de un archivo (WebP, JPG o PNG, mejor en formato 20:9 o 16:9, ~1600×720) dentro de img/eventos/.
   Si una escena no aparece aquí, se usa su ilustración integrada. Los prompts sugeridos están en docs/IMAGENES.md.
   Ejemplo:
     C.IMAGENES = { funeral_estado: 'img/eventos/funeral_estado.webp', noche_victoria: 'img/eventos/noche_victoria.webp' }; */
window.ESP = window.ESP || {};
(function (C) {
  C.IMAGENES = C.IMAGENES || {};
})(window.ESP);

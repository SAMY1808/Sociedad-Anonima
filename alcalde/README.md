# ALCALDE — simulador de ciudad con política satírica

Un city builder isométrico en el navegador (sin dependencias), con dinámicas de alcalde: presupuesto, facciones,
concejo, decretos, corrupción, Fiscalía y elecciones cada cuatro años.

## Cómo jugar

Abre `index.html` (o sírvelo con cualquier servidor estático). Funciona en escritorio y móvil y se puede instalar como PWA.

1. Traza **calles** y pinta zonas **residencial, comercial e industrial** junto a ellas.
2. Construye una **planta de energía** y una **torre de agua**: sin ellas nada crece.
3. Vigila la **demanda** (barras de la cabecera) y añade servicios: policía, bomberos, clínica, colegio, parques.
4. Cuida a las cuatro **facciones** (vecinos, empresarios, ecologistas, funcionarios): su opinión decide la reelección.
5. Gasta **capital político** en decretos que el **concejo** debe votar.
6. Resiste (o no) las tentaciones: desviar caja, sobres, estatuas... La **sospecha** atrae a la Fiscalía.
   Tu **fortuna personal** es lo único que te llevas al final.

Controles: arrastrar para pintar o mover (herramienta ✋), rueda o pellizco para zoom, clic derecho para mover,
`Espacio` pausa, teclas `1`–`7` para las herramientas principales.

## Archivos

- `index.html`, `style.css` — interfaz.
- `game.js` — mapa, simulación, política, eventos y render isométrico en canvas.
- `manifest.webmanifest`, `sw.js` — PWA.

La partida se guarda sola cada año en `localStorage`.

#!/bin/bash
# Ejecuta todas las pruebas del proyecto y resume el resultado.
# Uso: tools/probar-todo.sh [todo|node|ui|rapido]
#   node   → todas las tools/*-es.js (6 en paralelo; ~10 min por ui-es.js)
#   ui     → todas las tools/*-ui.js de Playwright en 4 carriles (~20 min); las que comparten puerto con su versión móvil van en el mismo carril
#   rapido → como ui pero sin las partidas largas en el navegador (largas-ui)
#   todo   → node y después ui (por defecto)
# Los resultados quedan en ${TMPDIR:-/tmp}/curul-pruebas/ (un archivo por prueba).
cd "$(dirname "$0")/.." || exit 1
OUT="${TMPDIR:-/tmp}/curul-pruebas"; mkdir -p "$OUT"
MODO="${1:-todo}"

pruebas_node() {
  : > "$OUT/node.log"; rm -f "$OUT"/node-fallo-*.log
  correr() { local f="$1" out code; out=$(timeout 600 node "$f" 2>&1); code=$?; echo "$f exit=$code | $(echo "$out" | tail -1 | cut -c1-120)" >> "$OUT/node.log"; [ "$code" != "0" ] && echo "$out" > "$OUT/node-fallo-$(basename "$f").log"; }
  local n=0; for f in tools/*-es.js; do correr "$f" & n=$((n+1)); [ $((n % 6)) -eq 0 ] && wait; done; wait
  echo "NODE: $(wc -l < "$OUT/node.log") pruebas · ok $(grep -c 'exit=0' "$OUT/node.log") · fallan $(grep -vc 'exit=0' "$OUT/node.log")"; grep -v 'exit=0' "$OUT/node.log"
}

pruebas_ui() {
  rm -rf "$OUT/ui"; mkdir -p "$OUT/ui"
  carril() { for t in "$@"; do local n=${t%%:*} a=${t#*:}; [ "$a" = "$t" ] && a=""; timeout 295 node tools/$n-ui.js $a > "$OUT/ui/$n${a:+-$a}.txt" 2>&1; echo "$n${a:+ $a} exit $?" >> "$OUT/ui/_hechas"; done; }
  local L1="mapa mapa:movil pestanas pestanas:movil modopartido modopartido:movil escision crisis2 declaracion estatuto financia financia:movil constit constit:movil"
  local L2="nochepe autogob autogob:movil campana comunidad creacion equipo presupuesto declaracion:movil art155 campmun campmun:movil gobaut gobaut:movil"
  local L3="invest leyesniv noche nocheaut parlaut estatuto:movil art155:movil crisis3 crisis3:movil oposicion oposicion:movil desatasco desatasco:movil obras obras:movil"
  local L4="provincia renuncia escenas escenas:movil barometro foco foco:movil escudos escudos:movil congreso sesion"
  if [ "$MODO" != "rapido" ]; then L1="$L1 largas:aut"; L2="$L2 largas:nac"; L3="$L3 largas:loc largas:partido"; L4="$L4 largas:base largas:movil largas:carga"; fi
  carril $L1 & carril $L2 & carril $L3 & carril $L4 & wait
  echo "NAVEGADOR: $(wc -l < "$OUT/ui/_hechas") pruebas · ok $(grep -c 'exit 0' "$OUT/ui/_hechas") · fallan $(grep -vc 'exit 0' "$OUT/ui/_hechas")"; grep -v 'exit 0' "$OUT/ui/_hechas"
}

case "$MODO" in
  node) pruebas_node ;;
  ui|rapido) pruebas_ui ;;
  todo) pruebas_node; pruebas_ui ;;
  *) echo "Uso: $0 [todo|node|ui|rapido]"; exit 2 ;;
esac

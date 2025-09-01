#!/bin/bash
# Script para iniciar backend y frontend

# Iniciar backend PHP en segundo plano
cd "$(dirname "$0")/api"
php -S 127.0.0.1:8084 &
BACKEND_PID=$!
cd ..

# Iniciar frontend (solo abrir index.html en el navegador por defecto)
FRONTEND_FILE="$(pwd)/index.html"
if [ -f "$FRONTEND_FILE" ]; then
  open "$FRONTEND_FILE"
else
  echo "No se encontró index.html en la raíz del proyecto."
fi

# Mensaje de control
echo "Backend iniciado en http://127.0.0.1:8084 (PID $BACKEND_PID)"
echo "Frontend abierto en el navegador."

#!/bin/bash

# Script para iniciar CertGen Pro
echo "🚀 Iniciando CertGen Pro..."

# Detener cualquier servidor PHP en puerto 8085
pkill -f "php -S localhost:8085" 2>/dev/null

# Esperar un momento
sleep 1

# Cambiar al directorio correcto
cd "$(dirname "$0")"

# Verificar archivos principales
if [[ ! -f "index.html" ]]; then
    echo "❌ Error: index.html no encontrado"
    exit 1
fi

if [[ ! -f "api/index.php" ]]; then
    echo "❌ Error: api/index.php no encontrado"
    exit 1
fi

if [[ ! -f "router.php" ]]; then
    echo "❌ Error: router.php no encontrado"
    exit 1
fi

# Iniciar servidor PHP con router
echo "🌐 Iniciando servidor en http://localhost:8085"
echo "📁 Directorio: $(pwd)"
echo "⚡ Servidor PHP con router..."

# Crear archivo de log
LOG_FILE="server.log"
touch "$LOG_FILE"

php -S localhost:8085 -t . router.php > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

sleep 2

# Verificar que el servidor esté corriendo
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Servidor iniciado correctamente (PID: $SERVER_PID)"
    echo "🔗 Accede a: http://localhost:8085"
    echo "🔌 APIs disponibles en: http://localhost:8085/api/"
    echo ""
    echo "Para detener el servidor: kill $SERVER_PID"
    echo "O ejecuta: pkill -f 'php -S localhost:8085'"
else
    echo "❌ Error al iniciar el servidor"
    exit 1
fi

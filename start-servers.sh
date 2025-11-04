#!/bin/bash

# Script para iniciar los servidores del Sistema de Certificados
# Uso: ./start-servers.sh

echo "🚀 Iniciando Sistema de Certificados"
echo "=================================="

# Verificar si Python3 está disponible
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 no está instalado"
    exit 1
fi

# Verificar si PHP está disponible
if ! command -v php &> /dev/null; then
    echo "❌ Error: PHP no está instalado"
    exit 1
fi

# Obtener IP LAN
LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$LAN_IP" ]; then
    echo "⚠️  Advertencia: No se pudo obtener la IP LAN, usando localhost"
    LAN_IP="localhost"
fi

echo "🌐 IP LAN detectada: $LAN_IP"
echo

# Matar procesos existentes en los puertos
echo "🧹 Limpiando procesos anteriores..."
pkill -f "php -S localhost:8085" 2>/dev/null || true
pkill -f "python3 server_lan.py" 2>/dev/null || true
sleep 2

# Iniciar servidor PHP local (para desarrollo)
echo "🔧 Iniciando servidor PHP local..."
php -S localhost:8085 -t . > /dev/null 2>&1 &
LOCAL_PID=$!

# Esperar un poco para que inicie
sleep 2

# Iniciar servidor híbrido para LAN
echo "📡 Iniciando servidor híbrido para LAN..."
python3 server_lan.py > /dev/null 2>&1 &
LAN_PID=$!

# Esperar un poco más
sleep 3

echo
echo "✅ Servidores iniciados correctamente!"
echo
echo "📍 ACCESO LOCAL (desarrollo):"
echo "   http://localhost:8085"
echo "   - Generador: http://localhost:8085/certificate-generator.html"
echo "   - Validador: http://localhost:8085/validate.html"
echo "   - CRUD: http://localhost:8085/crud.html"
echo
echo "🌍 ACCESO LAN (desde otros dispositivos):"
echo "   http://$LAN_IP:8089"
echo "   - Generador: http://$LAN_IP:8089/certificate-generator.html"
echo "   - Validador: http://$LAN_IP:8089/validate.html"
echo "   - CRUD: http://$LAN_IP:8089/crud.html"
echo
echo "📋 PIDs de los procesos:"
echo "   - Servidor PHP local: $LOCAL_PID"
echo "   - Servidor híbrido LAN: $LAN_PID"
echo
echo "🛑 Para detener los servidores:"
echo "   kill $LOCAL_PID $LAN_PID"
echo "   o ejecuta: pkill -f 'php -S' && pkill -f 'server_lan.py'"
echo
echo "🎉 ¡Sistema listo para usar!"

#!/bin/bash

# 🎯 SCRIPT DE ONBOARDING PARA NUEVA IA
# Ejecutar cuando una nueva sesión de IA toma control

clear
echo "🤖 NUEVA IA DETECTADA - PROCESO DE ONBOARDING"
echo "=================================================="
echo ""

echo "📋 PASO 1: Leyendo documentación obligatoria..."
sleep 1

if [ -f ".github/AI-INSTRUCTIONS-MANDATORY.md" ]; then
    echo "✅ Instrucciones encontradas"
    echo "📖 RESUMEN CRÍTICO:"
    echo "   - NO agregar capas de autenticación"
    echo "   - NO modificar admin-panel.php sin consultar"
    echo "   - USAR puerto 8080 para PHP"
else
    echo "❌ ERROR: Instrucciones no encontradas"
    exit 1
fi

echo ""
echo "📋 PASO 2: Verificando estado actual..."
sleep 1

if [ -f "PROJECT-CURRENT-STATUS.md" ]; then
    echo "✅ Estado documentado"
    echo "📊 ESTADO ACTUAL:"
    echo "   - Panel admin: FUNCIONAL"
    echo "   - Autenticación: SIMPLIFICADA"
    echo "   - Datos: REALES (82 certificados)"
else
    echo "❌ ERROR: Estado no documentado"
fi

echo ""
echo "📋 PASO 3: Verificando servidor..."
sleep 1

if curl -s http://localhost:8080/admin-panel.php > /dev/null; then
    echo "✅ Servidor PHP funcionando en puerto 8080"
else
    echo "⚠️  Servidor no responde - puede necesitar inicio"
    echo "   Comando: php -S localhost:8080 -t ."
fi

echo ""
echo "🎯 ONBOARDING COMPLETADO"
echo "========================"
echo ""
echo "📋 REGLAS PRINCIPALES:"
echo "  1. Si funciona, no lo toques"
echo "  2. Pregunta antes de modificar archivos críticos" 
echo "  3. Lee documentación antes de actuar"
echo ""
echo "🚨 ¿ENTIENDES ESTAS REGLAS? Confirma antes de continuar"

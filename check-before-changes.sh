#!/bin/bash

# 🛡️ SCRIPT DE VERIFICACIÓN PRE-CAMBIOS
# Ejecutar antes de cualquier modificación importante

echo "🔍 VERIFICANDO ESTADO DEL PROYECTO..."

# Verificar archivos críticos
if [ ! -f "admin-panel.php" ]; then
    echo "❌ ERROR: admin-panel.php no encontrado"
    exit 1
fi

if [ ! -f "PROJECT-CURRENT-STATUS.md" ]; then
    echo "❌ ERROR: PROJECT-CURRENT-STATUS.md no encontrado"
    exit 1
fi

# Verificar servidor
if ! curl -s http://localhost:8080/admin-panel.php > /dev/null; then
    echo "⚠️  WARNING: Servidor no responde en puerto 8080"
    echo "   Ejecutar: php -S localhost:8080 -t ."
fi

# Verificar base de datos
php -r "
try {
    \$pdo = new PDO('mysql:host=localhost;dbname=certificados_db', 'root', '');
    echo '✅ Base de datos: CONECTADA\n';
} catch (Exception \$e) {
    echo '❌ Base de datos: ERROR - ' . \$e->getMessage() . '\n';
}
"

echo ""
echo "📋 CHECKLIST ANTES DE MODIFICAR:"
echo "  [ ] ¿He leído AI-INSTRUCTIONS-MANDATORY.md?"
echo "  [ ] ¿He revisado PROJECT-CURRENT-STATUS.md?"
echo "  [ ] ¿Entiendo el problema actual?"
echo "  [ ] ¿Mi cambio duplica funcionalidad existente?"
echo "  [ ] ¿He confirmado con el usuario?"
echo ""
echo "🚨 Si no has marcado TODAS las casillas, NO continues"

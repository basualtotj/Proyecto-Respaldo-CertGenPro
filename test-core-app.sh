#!/bin/bash
# VERIFICACIÓN SISTEMÁTICA DEL CORE DE LA APLICACIÓN
# Test de endpoints críticos del generador de certificados

echo "🔍 VERIFICANDO CORE DE LA APLICACIÓN - GENERADOR DE CERTIFICADOS"
echo "================================================================="

BASE_URL="http://localhost:8085"

echo -e "\n📋 1. ENDPOINTS CRÍTICOS:"
echo "------------------------"

echo -n "✓ Clientes: "
curl -s "$BASE_URL/api/clientes" | jq -r '.success // "ERROR"' 2>/dev/null || echo "ERROR"

echo -n "✓ Técnicos: "
curl -s "$BASE_URL/api/tecnicos" | jq -r '.success // "ERROR"' 2>/dev/null || echo "ERROR"

echo -n "✓ Instalaciones: "
curl -s "$BASE_URL/api/instalaciones" | jq -r '.success // "ERROR"' 2>/dev/null || echo "ERROR"

echo -n "✓ Empresa: "
curl -s "$BASE_URL/api/empresa" | jq -r '.success // "ERROR"' 2>/dev/null || echo "ERROR"

echo -n "✓ Configuración: "
curl -s "$BASE_URL/api/configuracion" | jq -r '.success // "ERROR"' 2>/dev/null || echo "ERROR"

echo -e "\n🎯 2. ARCHIVOS PRINCIPALES:"
echo "-------------------------"

echo -n "✓ Index.html: "
curl -s "$BASE_URL/" | grep -q "CertGen" && echo "OK" || echo "ERROR"

echo -n "✓ CRUD.html: "
curl -s "$BASE_URL/crud.html" | grep -q "CRUD" && echo "OK" || echo "ERROR"

echo -n "✓ Certificados.html: "
curl -s "$BASE_URL/certificados.html" | grep -q "certificado" && echo "OK" || echo "ERROR"

echo -e "\n📁 3. ARCHIVOS JAVASCRIPT CORE:"
echo "------------------------------"

FILES=(
    "js/data-service.js"
    "js/maintenance-system.js" 
    "js/crud-system.js"
    "js/pdf/cctv-pdf.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file: OK"
    else
        echo "❌ $file: MISSING"
    fi
done

echo -e "\n🔧 4. BASE DE DATOS:"
echo "------------------"

echo -n "✓ DB Health: "
curl -s "$BASE_URL/api/admin-simple.php?action=health" | jq -r '.data.checks.database // "ERROR"' 2>/dev/null || echo "ERROR"

echo -e "\n📊 RESUMEN:"
echo "----------"
curl -s "$BASE_URL/api/admin-simple.php?action=database_stats" | jq -r '.data.table_counts | to_entries[] | "✓ \(.key): \(.value) registros"' 2>/dev/null || echo "❌ No se pudo obtener estadísticas"

echo -e "\n================================================================="
echo "🎯 VERIFICACIÓN COMPLETA"

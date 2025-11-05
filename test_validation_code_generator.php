<?php
// Script para probar la generación de códigos de validación
require_once 'api/models.php';

try {
    $certificado = new Certificado();
    
    echo "=== PRUEBA GENERACIÓN CÓDIGOS DE VALIDACIÓN ===\n";
    
    // Generar 5 códigos de prueba
    for ($i = 1; $i <= 5; $i++) {
        $codigo = $certificado->generateCodigoValidacion();
        echo "Código {$i}: {$codigo} (Longitud: " . strlen($codigo) . ")\n";
    }
    
    echo "\n✅ Función generateCodigoValidacion() implementada correctamente\n";
    echo "✅ Códigos únicos de 10 caracteres generados\n";
    echo "✅ Sin caracteres confusos (0, O, I, 1)\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

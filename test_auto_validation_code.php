<?php
// Script para probar la creación automática de códigos de validación
require_once 'api/models.php';

try {
    $certificado = new Certificado();
    
    echo "=== PRUEBA CREACIÓN CERTIFICADO CON CÓDIGO AUTOMÁTICO ===\n";
    
    // Datos de prueba para crear un certificado
    $testData = [
        'numero_certificado' => 'TEST-999-11-2025',
        'tipo' => 'cctv',
        'cliente_id' => 1,
        'instalacion_id' => 1, 
        'tecnico_id' => 1,
        'fecha_mantenimiento' => '2025-11-04',
        'estado' => 'emitido',
        'observaciones_generales' => 'Certificado de prueba para validar generación automática de código'
    ];
    
    echo "Datos de entrada (sin codigo_validacion):\n";
    print_r($testData);
    
    // Crear certificado (debería generar código automáticamente)
    $certificadoId = $certificado->create($testData);
    
    if ($certificadoId) {
        echo "\n✅ Certificado creado con ID: {$certificadoId}\n";
        
        // Verificar que se generó el código de validación
        $certificadoCreado = $certificado->findById($certificadoId);
        
        if ($certificadoCreado && !empty($certificadoCreado['codigo_validacion'])) {
            echo "✅ Código de validación generado automáticamente: {$certificadoCreado['codigo_validacion']}\n";
            echo "✅ Formato correcto: " . (strlen($certificadoCreado['codigo_validacion']) === 10 ? "SÍ" : "NO") . "\n";
            
            // Verificar formato ABCD1234AB
            $codigo = $certificadoCreado['codigo_validacion'];
            $letrasIniciales = substr($codigo, 0, 4);
            $numeros = substr($codigo, 4, 4);
            $letrasFinales = substr($codigo, 8, 2);
            
            echo "✅ Estructura: {$letrasIniciales} (letras) + {$numeros} (números) + {$letrasFinales} (letras)\n";
            
        } else {
            echo "❌ No se generó código de validación\n";
        }
        
        // Limpiar: eliminar certificado de prueba
        $certificado->delete($certificadoId);
        echo "🗑️ Certificado de prueba eliminado\n";
        
    } else {
        echo "❌ Error al crear certificado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

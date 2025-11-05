<?php
// Script para probar la generación automática de códigos de validación con IDs válidos
require_once 'api/models.php';

try {
    $certificado = new Certificado();
    
    echo "=== OBTENER IDS VÁLIDOS ===\n";
    
    // Obtener un cliente válido
    $cliente = new Cliente();
    $clientes = $cliente->findAll();
    $clienteId = $clientes[0]['id'] ?? null;
    
    // Obtener una instalación válida
    $instalacion = new Instalacion();
    $instalaciones = $instalacion->findAll();
    $instalacionId = $instalaciones[0]['id'] ?? null;
    
    // Obtener un técnico válido
    $tecnico = new Tecnico();
    $tecnicos = $tecnico->findAll();
    $tecnicoId = $tecnicos[0]['id'] ?? null;
    
    if (!$clienteId || !$instalacionId || !$tecnicoId) {
        echo "❌ No se encontraron registros válidos para cliente, instalación o técnico\n";
        echo "Cliente ID: {$clienteId}, Instalación ID: {$instalacionId}, Técnico ID: {$tecnicoId}\n";
        exit;
    }
    
    echo "✅ IDs válidos encontrados - Cliente: {$clienteId}, Instalación: {$instalacionId}, Técnico: {$tecnicoId}\n";
    
    echo "\n=== PRUEBA CREACIÓN CERTIFICADO CON CÓDIGO AUTOMÁTICO ===\n";
    
    // Datos de prueba para crear un certificado
    $testData = [
        'numero_certificado' => 'TEST-999-11-2025',
        'tipo' => 'cctv',
        'cliente_id' => $clienteId,
        'instalacion_id' => $instalacionId, 
        'tecnico_id' => $tecnicoId,
        'fecha_mantenimiento' => '2025-11-04',
        'estado' => 'emitido',
        'observaciones_generales' => 'Certificado de prueba para validar generación automática de código'
    ];
    
    echo "Creando certificado (sin codigo_validacion en datos de entrada)...\n";
    
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
            if ($certificadoCreado) {
                echo "Certificado creado: " . print_r($certificadoCreado, true) . "\n";
            }
        }
        
        // Limpiar: eliminar certificado de prueba
        $certificado->delete($certificadoId);
        echo "🗑️ Certificado de prueba eliminado\n";
        
    } else {
        echo "❌ Error al crear certificado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

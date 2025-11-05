<?php
require_once 'api/models.php';

echo "=== PRUEBA DIRECTA DE CREACIÓN CON CÓDIGO AUTOMÁTICO ===\n";

try {
    // Obtener IDs válidos
    $pdo = Database::getInstance()->getConnection();
    
    $cliente = $pdo->query("SELECT id FROM clientes LIMIT 1")->fetch();
    $instalacion = $pdo->query("SELECT id FROM instalaciones LIMIT 1")->fetch();
    $tecnico = $pdo->query("SELECT id FROM tecnicos LIMIT 1")->fetch();
    
    echo "Cliente ID: {$cliente['id']}, Instalación ID: {$instalacion['id']}, Técnico ID: {$tecnico['id']}\n";
    
    // Crear certificado directamente con la clase Certificado
    $certificado = new Certificado();
    
    $data = [
        'tipo' => 'cctv',
        'numero_certificado' => 'CCTV-' . rand(10000, 99999) . '-11-2025', // Número aleatorio
        'cliente_id' => $cliente['id'],
        'instalacion_id' => $instalacion['id'],
        'tecnico_id' => $tecnico['id'],
        'fecha_mantenimiento' => date('Y-m-d'),
        'solicitudes_cliente' => 'Prueba código automático',
        'observaciones_generales' => 'Test directo desde terminal'
    ];
    
    echo "\n=== CREANDO CERTIFICADO ===\n";
    $result = $certificado->create($data);
    
    if ($result) {
        echo "✅ Certificado creado exitosamente\n";
        echo "ID: " . ($result['id'] ?? 'N/A') . "\n";
        echo "Número: " . ($result['numero_certificado'] ?? 'N/A') . "\n";
        echo "Código validación: " . ($result['codigo_validacion'] ?? 'N/A') . "\n";
        
        if (isset($result['codigo_validacion']) && !empty($result['codigo_validacion'])) {
            echo "✅ Código de validación generado correctamente: {$result['codigo_validacion']}\n";
        } else {
            echo "❌ Código de validación NO generado\n";
        }
    } else {
        echo "❌ Error al crear certificado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>

<?php
// Debug directo en el endpoint para identificar qué código se está ejecutando
echo "TIMESTAMP: " . date('Y-m-d H:i:s') . "\n";
echo "FILE: " . __FILE__ . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'NO_URI') . "\n";
echo "REQUEST_METHOD: " . ($_SERVER['REQUEST_METHOD'] ?? 'NO_METHOD') . "\n";

// Incluir el API y hacer una petición directa
require_once 'api/config.php';
require_once 'api/models.php';

echo "\nLlamando getCertificados con ID 82...\n";

// Simular la llamada exacta que haría el router
$params = ['id' => 82];

try {
    $certificado = new Certificado();
    $data = $certificado->getCompleto($params['id']);
    
    echo "\nResultado de getCompleto:\n";
    echo "- codigo_validacion: " . (isset($data['codigo_validacion']) ? $data['codigo_validacion'] : 'NOT_FOUND') . "\n";
    echo "- cliente_nombre: " . (isset($data['cliente_nombre']) ? $data['cliente_nombre'] : 'NOT_FOUND') . "\n";
    echo "- instalacion_direccion: " . (isset($data['instalacion_direccion']) ? $data['instalacion_direccion'] : 'NOT_FOUND') . "\n";
    echo "- instalacion_nombre: " . (isset($data['instalacion_nombre']) ? $data['instalacion_nombre'] : 'NOT_FOUND') . "\n";
    echo "- tecnico_especialidad: " . (isset($data['tecnico_especialidad']) ? $data['tecnico_especialidad'] : 'NOT_FOUND') . "\n";
    
    echo "\nTodos los campos disponibles:\n";
    if (is_array($data)) {
        echo implode(', ', array_keys($data)) . "\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== END DEBUG ===\n";
?>

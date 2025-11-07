<?php
header('Content-Type: application/json');
require_once 'api/config.php';
require_once 'api/models.php';

try {
    $certificado = new Certificado();
    $id = 82;
    
    echo json_encode([
        'debug' => 'Llamando getCompleto directamente',
        'id' => $id,
        'result' => $certificado->getCompleto($id)
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

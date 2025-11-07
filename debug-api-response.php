<?php
// Script de debug para comparar getCompleto vs API response
require_once 'api/config.php';
require_once 'api/models.php';

$id = 82;

echo "=== DEBUG: Comparación getCompleto vs API Response ===\n\n";

// 1. Test directo getCompleto
echo "1. Test directo getCompleto($id):\n";
$certificado = new Certificado();
$directResult = $certificado->getCompleto($id);
echo "   - Resultado directo:\n";
echo "   - codigo_validacion: " . (isset($directResult['codigo_validacion']) ? $directResult['codigo_validacion'] : 'NOT_FOUND') . "\n";
echo "   - Campos disponibles: " . (is_array($directResult) ? implode(', ', array_keys($directResult)) : 'NO_ARRAY') . "\n\n";

// 2. Simular el flujo de getCertificados
echo "2. Simulando flujo getCertificados:\n";
try {
    $params = ['id' => $id];
    $certificadoObj = new Certificado();
    $data = $certificadoObj->getCompleto($params['id']);
    
    echo "   - Datos después de getCompleto:\n";
    echo "   - codigo_validacion: " . (isset($data['codigo_validacion']) ? $data['codigo_validacion'] : 'NOT_FOUND') . "\n";
    
    // Simular la preparación de respuesta
    $responseData = [
        'success' => true,
        'message' => 'Certificados obtenidos correctamente',
        'data' => $data,
        'timestamp' => date('c')
    ];
    
    echo "   - Datos en response final:\n";
    echo "   - codigo_validacion: " . (isset($responseData['data']['codigo_validacion']) ? $responseData['data']['codigo_validacion'] : 'NOT_FOUND') . "\n";
    
} catch (Exception $e) {
    echo "   - ERROR: " . $e->getMessage() . "\n";
}

echo "\n3. Consultando API real:\n";
$apiUrl = "http://localhost:8080/api/certificados/$id";
$response = file_get_contents($apiUrl);
$apiData = json_decode($response, true);

echo "   - API Response estructura:\n";
echo "   - success: " . ($apiData['success'] ? 'true' : 'false') . "\n";
echo "   - message: " . $apiData['message'] . "\n";
echo "   - data.codigo_validacion: " . (isset($apiData['data']['codigo_validacion']) ? $apiData['data']['codigo_validacion'] : 'NOT_FOUND') . "\n";

if (isset($apiData['data']) && is_array($apiData['data'])) {
    echo "   - Campos en API data: " . implode(', ', array_keys($apiData['data'])) . "\n";
}

echo "\n=== FIN DEBUG ===\n";
?>

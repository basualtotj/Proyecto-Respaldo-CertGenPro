<?php
require_once 'api/config.php';
require_once 'api/models.php';

try {
    echo "🔍 DEBUG - Testando getCompleto() directamente\n\n";
    
    $certificado = new Certificado();
    $result = $certificado->getCompleto(82);
    
    echo "📋 Resultado de getCompleto(82):\n";
    if ($result) {
        echo "   Tipo de dato: " . gettype($result) . "\n";
        echo "   Campos encontrados:\n";
        foreach ($result as $campo => $valor) {
            echo "     - $campo: " . (is_null($valor) ? 'NULL' : $valor) . "\n";
        }
        
        echo "\n🎯 Campo codigo_validacion específicamente:\n";
        if (array_key_exists('codigo_validacion', $result)) {
            echo "   ✅ Campo existe con valor: '" . $result['codigo_validacion'] . "'\n";
        } else {
            echo "   ❌ Campo NO existe en el resultado\n";
        }
    } else {
        echo "   ❌ No se obtuvo resultado\n";
    }
    
    echo "\n🔍 Consulta SQL directa:\n";
    $database = Database::getInstance();
    $sql = "SELECT c.*, c.codigo_validacion 
            FROM certificados c 
            WHERE c.id = 82";
    $stmt = $database->query($sql);
    $directResult = $stmt->fetch();
    
    if ($directResult) {
        echo "   codigo_validacion directo: '" . ($directResult['codigo_validacion'] ?? 'NO_EXISTE') . "'\n";
        echo "   Todos los campos de c.*:\n";
        foreach ($directResult as $campo => $valor) {
            echo "     - $campo: " . (is_null($valor) ? 'NULL' : $valor) . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

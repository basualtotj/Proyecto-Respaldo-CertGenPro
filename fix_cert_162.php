<?php
require_once 'api/models.php';

echo "=== VERIFICAR CERTIFICADO CCTV-162-11-2025 ===\n";

try {
    $pdo = Database::getInstance()->getConnection();
    
    $stmt = $pdo->prepare("SELECT id, numero_certificado, codigo_validacion, created_at FROM certificados WHERE numero_certificado = ?");
    $stmt->execute(['CCTV-162-11-2025']);
    $cert = $stmt->fetch();
    
    if ($cert) {
        echo "✅ Certificado encontrado:\n";
        echo "ID: {$cert['id']}\n";
        echo "Número: {$cert['numero_certificado']}\n";
        echo "Código validación: " . ($cert['codigo_validacion'] ?: 'NO TIENE') . "\n";
        echo "Creado: {$cert['created_at']}\n";
        
        if (empty($cert['codigo_validacion'])) {
            echo "\n❌ PROBLEMA: El certificado NO tiene código de validación\n";
            echo "Vamos a agregárselo...\n";
            
            // Generar código para este certificado
            $certificado = new Certificado();
            $codigo = $certificado->generateCodigoValidacion();
            
            $updateStmt = $pdo->prepare("UPDATE certificados SET codigo_validacion = ? WHERE id = ?");
            $updateStmt->execute([$codigo, $cert['id']]);
            
            echo "✅ Código {$codigo} agregado al certificado {$cert['numero_certificado']}\n";
        } else {
            echo "✅ El certificado YA tiene código de validación\n";
        }
    } else {
        echo "❌ Certificado CCTV-162-11-2025 no encontrado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

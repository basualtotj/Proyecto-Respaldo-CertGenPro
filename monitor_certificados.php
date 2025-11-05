<?php
require_once 'api/models.php';

echo "=== MONITOR DE CREACIÓN DE CERTIFICADOS ===\n";
echo "Escuchando base de datos cada 2 segundos...\n";
echo "Presiona Ctrl+C para detener\n\n";

$lastCount = 0;
$pdo = Database::getInstance()->getConnection();

while (true) {
    try {
        // Contar certificados totales
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados");
        $currentCount = $stmt->fetch()['total'];
        
        if ($currentCount > $lastCount) {
            echo "🆕 NUEVO CERTIFICADO DETECTADO!\n";
            
            // Obtener el último certificado
            $stmt = $pdo->query("SELECT id, numero_certificado, codigo_validacion, created_at FROM certificados ORDER BY id DESC LIMIT 1");
            $cert = $stmt->fetch();
            
            echo "ID: {$cert['id']}\n";
            echo "Número: {$cert['numero_certificado']}\n";
            echo "Código validación: " . ($cert['codigo_validacion'] ?: '❌ NO TIENE') . "\n";
            echo "Creado: {$cert['created_at']}\n";
            
            if (empty($cert['codigo_validacion'])) {
                echo "🚨 PROBLEMA: Certificado sin código de validación!\n";
                echo "Investigando...\n";
                
                // Verificar si el método create() fue llamado
                echo "📊 Analizando flujo de creación...\n";
            } else {
                echo "✅ Certificado creado correctamente con código\n";
            }
            
            echo "\n" . str_repeat("-", 50) . "\n\n";
            $lastCount = $currentCount;
        }
        
        sleep(2);
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        sleep(5);
    }
}
?>

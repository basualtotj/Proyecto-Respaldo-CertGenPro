<?php
// ============================================
// GENERADOR DE CÓDIGOS DE VALIDACIÓN
// Genera códigos alfanuméricos únicos para validación pública
// ============================================

require_once 'config.php';

/**
 * Genera un código de validación alfanumérico único
 * Formato: ABCD1234EF (10 caracteres)
 */
function generateValidationCode() {
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    
    for ($i = 0; $i < 10; $i++) {
        $code .= $characters[random_int(0, strlen($characters) - 1)];
    }
    
    return $code;
}

/**
 * Verifica que el código de validación sea único
 */
function isValidationCodeUnique($code, $pdo) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM certificados WHERE codigo_validacion = ?");
    $stmt->execute([$code]);
    return $stmt->fetchColumn() == 0;
}

/**
 * Genera códigos de validación para certificados existentes que no los tienen
 */
function generateCodesForExistingCertificates() {
    try {
        $config = require 'config.php';
        $dbConfig = $config['database'];
        
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
        
        // Obtener certificados sin código de validación
        $stmt = $pdo->query("SELECT id, numero_certificado FROM certificados WHERE codigo_validacion IS NULL");
        $certificados = $stmt->fetchAll();
        
        $updated = 0;
        $updateStmt = $pdo->prepare("UPDATE certificados SET codigo_validacion = ? WHERE id = ?");
        
        foreach ($certificados as $cert) {
            $attempts = 0;
            do {
                $validationCode = generateValidationCode();
                $attempts++;
                
                if ($attempts > 100) {
                    throw new Exception("No se pudo generar código único para certificado ID: " . $cert['id']);
                }
            } while (!isValidationCodeUnique($validationCode, $pdo));
            
            $updateStmt->execute([$validationCode, $cert['id']]);
            $updated++;
            
            echo "✅ Certificado {$cert['numero_certificado']} -> Código: $validationCode\n";
        }
        
        echo "\n🎉 Total códigos generados: $updated\n";
        
        // Mostrar algunos ejemplos
        $stmt = $pdo->query("SELECT numero_certificado, codigo_validacion FROM certificados WHERE codigo_validacion IS NOT NULL LIMIT 5");
        $examples = $stmt->fetchAll();
        
        echo "\n📋 Ejemplos de códigos generados:\n";
        foreach ($examples as $example) {
            echo "   Certificado: {$example['numero_certificado']} | Validación: {$example['codigo_validacion']}\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
}

// Si se ejecuta directamente, generar códigos para certificados existentes
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    generateCodesForExistingCertificates();
}
?>

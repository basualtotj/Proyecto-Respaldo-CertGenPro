<?php
// Script para verificar certificados existentes y códigos de validación
try {
    $config = require 'api/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    echo "=== ÚLTIMOS 5 CERTIFICADOS ===\n";
    $stmt = $pdo->query("SELECT id, numero_certificado, codigo_validacion, tipo, fecha_emision FROM certificados ORDER BY id DESC LIMIT 5");
    $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach($certificates as $cert) {
        echo "ID: {$cert['id']} | N°: {$cert['numero_certificado']} | Validación: " . ($cert['codigo_validacion'] ?? 'NULL') . " | Tipo: {$cert['tipo']}\n";
    }
    
    // Contar cuántos tienen código de validación
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE codigo_validacion IS NOT NULL AND codigo_validacion != ''");
    $withCode = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE codigo_validacion IS NULL OR codigo_validacion = ''");
    $withoutCode = $stmt->fetch();
    
    echo "\n=== ESTADÍSTICAS ===\n";
    echo "Con código validación: {$withCode['total']}\n";
    echo "Sin código validación: {$withoutCode['total']}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

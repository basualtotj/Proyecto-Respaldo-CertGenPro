<?php
// Script para verificar estructura de tabla certificados en MySQL
try {
    $config = require 'api/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    echo "=== CONEXIÓN A MYSQL EXITOSA ===\n";
    echo "Base de datos: {$dbConfig['name']}\n\n";
    
    // Verificar si tabla certificados existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'certificados'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "=== ESTRUCTURA TABLA CERTIFICADOS ===\n";
        $stmt = $pdo->query("DESCRIBE certificados");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($columns as $col) {
            echo "{$col['Field']} - {$col['Type']} - NULL: {$col['Null']} - DEFAULT: {$col['Default']}\n";
        }
        
        // Contar certificados
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados");
        $count = $stmt->fetch();
        echo "\n=== TOTAL CERTIFICADOS: {$count['total']} ===\n";
        
        // Verificar si existe campo codigo_validacion
        $stmt = $pdo->query("SHOW COLUMNS FROM certificados LIKE 'codigo_validacion'");
        $hasValidationCode = $stmt->fetch();
        echo "\n¿Existe codigo_validacion? " . ($hasValidationCode ? "SÍ" : "NO") . "\n";
        
    } else {
        echo "❌ Tabla certificados NO existe\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

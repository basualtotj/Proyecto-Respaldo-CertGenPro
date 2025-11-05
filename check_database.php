<?php
// Script para verificar todas las tablas en la BD
try {
    $pdo = new PDO('sqlite:database.db');
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== TABLAS EN LA BASE DE DATOS ===\n";
    foreach($tables as $table) {
        echo $table['name'] . "\n";
    }
    
    // Ver estructura de certificados si existe
    echo "\n=== ESTRUCTURA TABLA CERTIFICADOS ===\n";
    $stmt = $pdo->query('PRAGMA table_info(certificados)');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($columns as $col) {
        echo $col['name'] . ' - ' . $col['type'] . " - DEFAULT: " . ($col['dflt_value'] ?? 'NULL') . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

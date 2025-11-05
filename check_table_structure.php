<?php
// Script para verificar estructura de tabla certificados
try {
    $pdo = new PDO('sqlite:database.db');
    $stmt = $pdo->query('PRAGMA table_info(certificados)');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== ESTRUCTURA TABLA CERTIFICADOS ===\n";
    foreach($columns as $col) {
        echo $col['name'] . ' - ' . $col['type'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

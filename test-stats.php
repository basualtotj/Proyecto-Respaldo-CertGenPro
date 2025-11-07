<?php
// Script de prueba para verificar estadísticas
$host = 'localhost';
$dbname = 'certificados_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== CONEXIÓN EXITOSA ===\n";
    
    // Probar consultas
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados");
    $total_certificados = $stmt->fetch()['total'];
    echo "Total certificados: $total_certificados\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM clientes WHERE activo = 1");
    $total_clientes = $stmt->fetch()['total'];
    echo "Total clientes: $total_clientes\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tecnicos WHERE activo = 1");
    $total_tecnicos = $stmt->fetch()['total'];
    echo "Total tecnicos: $total_tecnicos\n";
    
    // Verificar estructura de tablas
    echo "\n=== TABLAS DISPONIBLES ===\n";
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tableName = $row[0];
        $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$tableName`");
        $count = $countStmt->fetch()['count'];
        echo "$tableName: $count registros\n";
    }
    
} catch(PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

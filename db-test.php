<?php
// Diagnóstico simple de conexión DB
header('Content-Type: application/json');

try {
    // Conexión directa a MySQL
    $pdo = new PDO('mysql:host=localhost;dbname=certificados_db;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test básico
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM clientes");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Conexión DB exitosa',
        'total_clientes' => $result['total'],
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}
?>

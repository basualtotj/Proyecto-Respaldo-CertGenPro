<?php
// ============================================
// MANEJADOR DE LOGOUT
// ============================================

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $auth = new Auth();
    $auth->logout();
    
    echo json_encode([
        'success' => true,
        'message' => 'Sesión cerrada correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error cerrando sesión'
    ]);
}
?>

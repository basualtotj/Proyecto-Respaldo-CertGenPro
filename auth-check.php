<?php
// ============================================
// VERIFICADOR DE AUTENTICACIÓN
// ============================================

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if ($user) {
        echo json_encode([
            'authenticated' => true,
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'nombre' => $user['nombre'],
                'email' => $user['email'] ?? null,
                'rol' => $user['rol']
            ]
        ]);
    } else {
        echo json_encode([
            'authenticated' => false,
            'success' => false,
            'message' => 'No hay usuario autenticado'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'authenticated' => false,
        'success' => false,
        'message' => 'Error verificando autenticación'
    ]);
}
?>

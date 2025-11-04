<?php
// ============================================
// API DE VALIDACIÓN PÚBLICA DE CERTIFICADOS DE MANTENIMIENTO
// Usa códigos de validación alfanuméricos únicos
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$code = $_GET['code'] ?? '';

if (empty($code)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Código de validación requerido'
    ]);
    exit;
}

try {
    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    // Buscar certificado por código de validación
    $stmt = $pdo->prepare("
        SELECT 
            c.numero_certificado,
            c.codigo_validacion,
            c.tipo,
            c.fecha_mantenimiento,
            c.fecha_emision,
            c.estado,
            c.solicitudes_cliente,
            c.observaciones_generales,
            cl.nombre as cliente_nombre,
            cl.rut as cliente_rut,
            cl.direccion as cliente_direccion,
            cl.telefono as cliente_telefono,
            cl.email as cliente_email,
            i.nombre as instalacion_nombre,
            i.direccion as instalacion_direccion,
            t.nombre as tecnico_nombre,
            t.especialidad as tecnico_especialidad,
            e.nombre_empresa,
            e.rut_empresa as empresa_rut,
            e.direccion as empresa_direccion,
            e.telefono as empresa_telefono,
            e.email as empresa_email
        FROM certificados c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
        LEFT JOIN instalaciones i ON c.instalacion_id = i.id
        LEFT JOIN tecnicos t ON c.tecnico_id = t.id
        LEFT JOIN empresa e ON e.id = 1
        WHERE c.codigo_validacion = ? AND c.estado = 'emitido'
    ");
    ");
    
    $stmt->execute([$code]);
    $certificate = $stmt->fetch();
    
    if (!$certificate) {
        echo json_encode([
            'success' => false,
            'message' => 'Certificado no encontrado. Verifica que el código sea correcto.',
            'certificate' => null
        ]);
        exit;
    }
    
    // Validación adicional basada en estado
    $validationMessage = '';
    switch ($certificate['estado']) {
        case 'pending':
            $validationMessage = 'Este certificado está pendiente de aprobación por parte del administrador.';
            break;
        case 'approved':
            $validationMessage = 'Certificado válido y verificado.';
            break;
        case 'rejected':
            $validationMessage = 'Este certificado fue rechazado y no es válido.';
            break;
    }
    
    echo json_encode([
        'success' => true,
        'message' => $validationMessage,
        'certificate' => $certificate,
        'validation_timestamp' => date('c'),
        'is_valid' => $certificate['estado'] === 'approved'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}

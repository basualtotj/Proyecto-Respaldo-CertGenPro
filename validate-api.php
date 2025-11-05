<?php
// ============================================
// API DE VALIDACIÓN PÚBLICA DE CERTIFICADOS DE MANTENIMIENTO
// Usa códigos de validación alfanuméricos únicos
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Obtener código de validación desde GET o POST (JSON)
$code = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $code = $_GET['code'] ?? '';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = $input['codigo_validacion'] ?? $_POST['codigo_validacion'] ?? '';
}

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
            c.checklist_data,
            cl.nombre as cliente_nombre,
            cl.rut as cliente_rut,
            cl.contacto as cliente_contacto,
            cl.telefono as cliente_telefono,
            cl.email as cliente_email,
            '' as cliente_direccion, -- Los clientes no tienen dirección, solo las instalaciones
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
    
    $stmt->execute([$code]);
    $certificate = $stmt->fetch();
    
    if (!$certificate) {
        echo json_encode([
            'success' => false,
            'message' => 'Código de validación no encontrado. Verifica que el código sea correcto.',
            'certificate' => null
        ]);
        exit;
    }
    
    // Formatear tipo de mantenimiento
    $tiposMantenimiento = [
        'cctv' => 'Mantenimiento de Sistema CCTV',
        'hardware' => 'Mantenimiento de Hardware Computacional',
        'racks' => 'Mantenimiento de Racks de Comunicaciones'
    ];
    
    // Función auxiliar para limpiar strings
    function cleanString($value) {
        return $value ? trim($value) : '';
    }
    
    // Procesar checklist_data JSON
    $checklistData = [];
    if ($certificate['checklist_data']) {
        $decoded = json_decode($certificate['checklist_data'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $checklistData = $decoded;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Certificado válido y verificado',
        'certificate' => [
            'numero_certificado' => cleanString($certificate['numero_certificado']),
            'codigo_validacion' => cleanString($certificate['codigo_validacion']),
            'tipo_mantenimiento' => $tiposMantenimiento[cleanString($certificate['tipo'])] ?? ucfirst(cleanString($certificate['tipo'])),
            'tipo_codigo' => cleanString($certificate['tipo']),
            'fecha_mantenimiento' => $certificate['fecha_mantenimiento'],
            'fecha_emision' => $certificate['fecha_emision'],
            'estado' => cleanString($certificate['estado']),
            'cliente' => [
                'nombre' => cleanString($certificate['cliente_nombre']),
                'rut' => cleanString($certificate['cliente_rut']),
                'direccion' => cleanString($certificate['cliente_direccion']),
                'telefono' => cleanString($certificate['cliente_telefono']),
                'email' => cleanString($certificate['cliente_email'])
            ],
            'instalacion' => [
                'nombre' => cleanString($certificate['instalacion_nombre']),
                'direccion' => cleanString($certificate['instalacion_direccion'])
            ],
            'tecnico' => [
                'nombre' => cleanString($certificate['tecnico_nombre']),
                'especialidad' => cleanString($certificate['tecnico_especialidad'])
            ],
            'empresa' => [
                'nombre' => cleanString($certificate['nombre_empresa']),
                'rut' => cleanString($certificate['empresa_rut']),
                'direccion' => cleanString($certificate['empresa_direccion']),
                'telefono' => cleanString($certificate['empresa_telefono']),
                'email' => cleanString($certificate['empresa_email'])
            ],
            'detalles' => [
                'solicitudes_cliente' => cleanString($certificate['solicitudes_cliente']),
                'observaciones' => cleanString($certificate['observaciones_generales']),
                'checklist' => $checklistData['checklist'] ?? [],
                'equipos' => $checklistData['equipos'] ?? [],
                'evidencias' => $checklistData['evidencias'] ?? []
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos',
        'certificate' => null
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'certificate' => null
    ]);
}
?>

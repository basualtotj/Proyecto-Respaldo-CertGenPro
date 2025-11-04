<?php
// ============================================
// API PARA USUARIOS REGULARES
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/auth.php';

// Verificar autenticación para todas las acciones
$auth->requireAuth();

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'my_certificates':
            getMyCertificates();
            break;
            
        case 'create_certificate':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                createCertificateRequest();
            } else {
                apiError('Method not allowed', 405);
            }
            break;
            
        case 'certificate_details':
            $id = $_GET['id'] ?? '';
            if (!$id) {
                apiError('Certificate ID is required', 400);
            }
            getCertificateDetails($id);
            break;
            
        default:
            apiError('Invalid action', 400);
    }

} catch (Exception $e) {
    apiError('Internal server error: ' . $e->getMessage(), 500);
}

// ============================================
// FUNCIONES
// ============================================

function apiSuccess($data = null, $message = 'Success') {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ]);
    exit;
}

function apiError($message = 'Error', $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'timestamp' => date('c')
    ]);
    exit;
}

function getMyCertificates() {
    global $auth;
    
    $currentUser = $auth->getCurrentUser();
    
    try {
        $config = require __DIR__ . '/config.php';
        $dbConfig = $config['database'];
        
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
        
        // Buscar certificados del usuario actual
        $stmt = $pdo->prepare("
            SELECT id, nombre_curso, nombre_instructor, duracion_horas, fecha_emision, codigo_verificacion, 
                   estado, observaciones, created_at
            FROM certificados_cursos 
            WHERE nombre_completo = ? 
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$currentUser['nombre']]);
        $certificates = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'certificates' => $certificates
        ]);
        
    } catch (Exception $e) {
        apiError('Error loading certificates: ' . $e->getMessage(), 500);
    }
}

function createCertificateRequest() {
    global $auth;
    
    $currentUser = $auth->getCurrentUser();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        apiError('Invalid JSON data', 400);
    }
    
    // Validar campos requeridos
    $required = ['nombre_curso', 'nombre_instructor', 'duracion_horas', 'fecha_emision'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            apiError("Field {$field} is required", 400);
        }
    }
    
    try {
        $config = require __DIR__ . '/config.php';
        $dbConfig = $config['database'];
        
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
        
        // Generar código de verificación único
        $codigoVerificacion = strtoupper(substr(md5(uniqid()), 0, 10));
        
        // Verificar si el código ya existe
        $stmt = $pdo->prepare("SELECT id FROM certificados_cursos WHERE codigo_verificacion = ?");
        $stmt->execute([$codigoVerificacion]);
        while ($stmt->fetch()) {
            $codigoVerificacion = strtoupper(substr(md5(uniqid()), 0, 10));
            $stmt->execute([$codigoVerificacion]);
        }
        
        // Insertar certificado con estado pending
        $stmt = $pdo->prepare("
            INSERT INTO certificados_cursos (
                nombre_completo, 
                nombre_curso, 
                nombre_instructor, 
                duracion_horas, 
                fecha_emision, 
                codigo_verificacion,
                estado,
                observaciones,
                usuario_creador_id
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        ");
        
        $result = $stmt->execute([
            $currentUser['nombre'],
            $input['nombre_curso'],
            $input['nombre_instructor'],
            (int)$input['duracion_horas'],
            $input['fecha_emision'],
            $codigoVerificacion,
            $input['observaciones'] ?? '',
            $currentUser['id']
        ]);
        
        if ($result) {
            $certificateId = $pdo->lastInsertId();
            apiSuccess([
                'certificate_id' => $certificateId,
                'codigo_verificacion' => $codigoVerificacion
            ], 'Certificate request submitted successfully');
        } else {
            apiError('Failed to create certificate request', 500);
        }
        
    } catch (Exception $e) {
        apiError('Database error: ' . $e->getMessage(), 500);
    }
}

function getCertificateDetails($id) {
    global $auth;
    
    $currentUser = $auth->getCurrentUser();
    
    try {
        $config = require __DIR__ . '/config.php';
        $dbConfig = $config['database'];
        
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
        
        // Solo permitir ver certificados propios
        $stmt = $pdo->prepare("
            SELECT * FROM certificados_cursos 
            WHERE id = ? AND nombre_completo = ?
        ");
        $stmt->execute([$id, $currentUser['nombre']]);
        $certificate = $stmt->fetch();
        
        if (!$certificate) {
            apiError('Certificate not found or access denied', 404);
        }
        
        apiSuccess(['certificate' => $certificate]);
        
    } catch (Exception $e) {
        apiError('Error loading certificate: ' . $e->getMessage(), 500);
    }
}

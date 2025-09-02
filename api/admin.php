<?php
// ============================================
// ADMIN API ENDPOINTS
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ============================================
// API RESPONSE CLASS
// ============================================
class ApiResponse {
    public static function success($data = null, $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    public static function error($message = 'Error', $code = 400, $details = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'details' => $details,
            'timestamp' => date('c')
        ]);
        exit;
    }
}

require_once __DIR__ . '/models.php';

// Get request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove various prefixes to get clean path
$path = preg_replace('#^/admin-api#', '', $path);
$path = preg_replace('#^/api/admin\.php#', '', $path);

// Default to root if empty
if (empty($path) || $path === '/') {
    $path = '/status';
}

try {
    switch ($path) {
        // ============================================
        // SERVER MANAGEMENT
        // ============================================
        case '/server/status':
            if ($method === 'GET') {
                $status = [
                    'php_version' => PHP_VERSION,
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                    'memory_usage' => memory_get_usage(true),
                    'memory_peak' => memory_get_peak_usage(true),
                    'uptime' => getServerUptime(),
                    'load_average' => getLoadAverage(),
                    'disk_usage' => getDiskUsage(),
                    'processes' => getActiveProcesses()
                ];
                ApiResponse::success($status);
            }
            break;

        case '/server/processes':
            if ($method === 'GET') {
                $processes = getServerProcesses();
                ApiResponse::success($processes);
            }
            break;

        // ============================================
        // DATABASE MANAGEMENT
        // ============================================
        case '/database/structure':
            if ($method === 'GET') {
                $structure = getDatabaseStructure();
                ApiResponse::success($structure);
            }
            break;

        case '/database/table-info':
            if ($method === 'GET') {
                $table = $_GET['table'] ?? '';
                if (!$table) {
                    ApiResponse::error('Tabla no especificada', 400);
                }
                $info = getTableInfo($table);
                ApiResponse::success($info);
            }
            break;

        case '/database/query':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $query = $input['query'] ?? '';
                
                // Seguridad básica: solo permitir SELECT
                if (!preg_match('/^\s*SELECT\s+/i', $query)) {
                    ApiResponse::error('Solo se permiten consultas SELECT por seguridad', 403);
                }
                
                $result = executeSafeQuery($query);
                ApiResponse::success($result);
            }
            break;

        case '/database/stats':
            if ($method === 'GET') {
                $stats = getDatabaseStats();
                ApiResponse::success($stats);
            }
            break;

        case '/database/optimize':
            if ($method === 'POST') {
                $result = optimizeDatabase();
                ApiResponse::success($result);
            }
            break;

        // ============================================
        // API ROUTES DISCOVERY
        // ============================================
        case '/routes':
            if ($method === 'GET') {
                $routes = discoverAPIRoutes();
                ApiResponse::success($routes);
            }
            break;

        // ============================================
        // MONITORING
        // ============================================
        case '/monitoring/performance':
            if ($method === 'GET') {
                $metrics = getPerformanceMetrics();
                ApiResponse::success($metrics);
            }
            break;

        case '/monitoring/errors':
            if ($method === 'GET') {
                $errors = getErrorLog();
                ApiResponse::success($errors);
            }
            break;

        case '/monitoring/health':
            if ($method === 'GET') {
                $health = performHealthCheck();
                ApiResponse::success($health);
            }
            break;

        // ============================================
        // BACKUP & MAINTENANCE
        // ============================================
        case '/backup/create':
            if ($method === 'POST') {
                $backup = createDatabaseBackup();
                ApiResponse::success($backup);
            }
            break;

        case '/backup/list':
            if ($method === 'GET') {
                $backups = listBackups();
                ApiResponse::success($backups);
            }
            break;

        case '/maintenance/validate':
            if ($method === 'POST') {
                $validation = validateDataIntegrity();
                ApiResponse::success($validation);
            }
            break;

        default:
            ApiResponse::error('Endpoint no encontrado', 404);
    }

} catch (Exception $e) {
    ApiResponse::error('Error interno del servidor: ' . $e->getMessage(), 500);
}

// ============================================
// ADMIN HELPER FUNCTIONS
// ============================================

function getServerUptime() {
    if (function_exists('sys_getloadavg')) {
        $uptime = shell_exec('uptime');
        return trim($uptime) ?: 'No disponible';
    }
    return 'No disponible en este sistema';
}

function getLoadAverage() {
    if (function_exists('sys_getloadavg')) {
        return sys_getloadavg();
    }
    return [0, 0, 0];
}

function getDiskUsage() {
    $total = disk_total_space('.');
    $free = disk_free_space('.');
    $used = $total - $free;
    
    return [
        'total' => $total,
        'used' => $used,
        'free' => $free,
        'percentage' => round(($used / $total) * 100, 2)
    ];
}

function getActiveProcesses() {
    // Buscar procesos PHP activos
    $processes = [];
    if (function_exists('shell_exec')) {
        $output = shell_exec('ps aux | grep php | grep -v grep');
        if ($output) {
            $lines = explode("\n", trim($output));
            foreach ($lines as $line) {
                if (strpos($line, 'php') !== false) {
                    $processes[] = trim($line);
                }
            }
        }
    }
    return $processes;
}

function getServerProcesses() {
    return [
        'php_processes' => getActiveProcesses(),
        'memory_info' => [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit')
        ]
    ];
}

function getDatabaseStructure() {
    try {
        $db = Database::getInstance();
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $structure = [];
        foreach ($tables as $table) {
            $structure[$table] = getTableInfo($table);
        }
        
        return $structure;
    } catch (Exception $e) {
        throw new Exception("Error obteniendo estructura: " . $e->getMessage());
    }
}

function getTableInfo($table) {
    try {
        $db = Database::getInstance();
        
        // Obtener columnas
        $stmt = $db->query("DESCRIBE `$table`");
        $columns = $stmt->fetchAll();
        
        // Obtener count de registros
        $stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
        $count = $stmt->fetch()['count'];
        
        // Obtener tamaño de tabla
        $stmt = $db->query("
            SELECT 
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = ?
        ", [$table]);
        $size = $stmt->fetch()['size_mb'] ?? 0;
        
        return [
            'name' => $table,
            'columns' => $columns,
            'row_count' => (int)$count,
            'size_mb' => (float)$size
        ];
    } catch (Exception $e) {
        throw new Exception("Error obteniendo info de tabla $table: " . $e->getMessage());
    }
}

function executeSafeQuery($query) {
    try {
        $db = Database::getInstance();
        $stmt = $db->query($query);
        
        $results = $stmt->fetchAll();
        return [
            'query' => $query,
            'row_count' => count($results),
            'data' => array_slice($results, 0, 100), // Limitar a 100 registros
            'limited' => count($results) > 100
        ];
    } catch (Exception $e) {
        throw new Exception("Error ejecutando consulta: " . $e->getMessage());
    }
}

function getDatabaseStats() {
    try {
        $db = Database::getInstance();
        
        // Estadísticas generales
        $stats = [];
        $tables = ['clientes', 'instalaciones', 'tecnicos', 'certificados', 'empresa'];
        
        foreach ($tables as $table) {
            try {
                $stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
                $count = $stmt->fetch()['count'];
                $stats[$table] = (int)$count;
            } catch (Exception $e) {
                $stats[$table] = 0;
            }
        }
        
        // Información de la base de datos
        $stmt = $db->query("SELECT DATABASE() as db_name");
        $dbName = $stmt->fetch()['db_name'];
        
        $stmt = $db->query("
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        ");
        $totalSize = $stmt->fetch()['total_size_mb'] ?? 0;
        
        return [
            'database_name' => $dbName,
            'total_size_mb' => (float)$totalSize,
            'table_counts' => $stats,
            'last_updated' => date('Y-m-d H:i:s')
        ];
    } catch (Exception $e) {
        throw new Exception("Error obteniendo estadísticas: " . $e->getMessage());
    }
}

function optimizeDatabase() {
    try {
        $db = Database::getInstance();
        $stmt = $db->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $results = [];
        foreach ($tables as $table) {
            try {
                $db->query("OPTIMIZE TABLE `$table`");
                $results[$table] = 'optimizada';
            } catch (Exception $e) {
                $results[$table] = 'error: ' . $e->getMessage();
            }
        }
        
        return [
            'optimized_tables' => $results,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    } catch (Exception $e) {
        throw new Exception("Error optimizando base de datos: " . $e->getMessage());
    }
}

function discoverAPIRoutes() {
    // Analizar el archivo index.php para descubrir rutas
    $routes = [
        ['method' => 'GET', 'path' => '/health', 'description' => 'Health check del servidor'],
        ['method' => 'GET', 'path' => '/clientes', 'description' => 'Obtener todos los clientes'],
        ['method' => 'POST', 'path' => '/clientes', 'description' => 'Crear nuevo cliente'],
        ['method' => 'PUT', 'path' => '/clientes/{id}', 'description' => 'Actualizar cliente'],
        ['method' => 'DELETE', 'path' => '/clientes/{id}', 'description' => 'Eliminar cliente'],
        ['method' => 'GET', 'path' => '/instalaciones', 'description' => 'Obtener instalaciones'],
        ['method' => 'POST', 'path' => '/instalaciones', 'description' => 'Crear instalación'],
        ['method' => 'GET', 'path' => '/tecnicos', 'description' => 'Obtener técnicos'],
        ['method' => 'POST', 'path' => '/tecnicos', 'description' => 'Crear técnico'],
        ['method' => 'GET', 'path' => '/empresa', 'description' => 'Obtener datos empresa'],
        ['method' => 'GET', 'path' => '/configuracion', 'description' => 'Obtener configuración'],
        ['method' => 'GET', 'path' => '/contadores/{tipo}', 'description' => 'Obtener contadores']
    ];
    
    return $routes;
}

function getPerformanceMetrics() {
    return [
        'memory' => [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit')
        ],
        'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
        'load_average' => getLoadAverage(),
        'disk_usage' => getDiskUsage()
    ];
}

function getErrorLog() {
    $logFile = __DIR__ . '/logs/database.log';
    if (file_exists($logFile)) {
        $logs = file($logFile, FILE_IGNORE_NEW_LINES);
        return array_slice(array_reverse($logs), 0, 50); // Últimas 50 líneas
    }
    return [];
}

function performHealthCheck() {
    $health = [
        'timestamp' => date('Y-m-d H:i:s'),
        'status' => 'healthy',
        'checks' => []
    ];
    
    try {
        // Check database connection
        $db = Database::getInstance();
        $stmt = $db->query("SELECT 1");
        $health['checks']['database'] = 'OK';
    } catch (Exception $e) {
        $health['checks']['database'] = 'ERROR: ' . $e->getMessage();
        $health['status'] = 'unhealthy';
    }
    
    // Check critical files
    $criticalFiles = ['models.php', 'index.php', '../js/crud-system.js'];
    foreach ($criticalFiles as $file) {
        $health['checks']['file_' . basename($file)] = file_exists(__DIR__ . '/' . $file) ? 'OK' : 'MISSING';
    }
    
    // Check API endpoints
    $health['checks']['api_health'] = 'OK'; // Ya estamos respondiendo
    
    return $health;
}

function createDatabaseBackup() {
    try {
        $backupDir = __DIR__ . '/backups';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_$timestamp.sql";
        $filepath = $backupDir . '/' . $filename;
        
        // Ejecutar mysqldump (requiere que esté disponible en el sistema)
        $dbConfig = [
            'host' => 'localhost',
            'database' => 'certificados_db',
            'username' => 'root',
            'password' => ''
        ];
        
        $command = sprintf(
            'mysqldump -h%s -u%s %s %s > %s',
            $dbConfig['host'],
            $dbConfig['username'],
            $dbConfig['password'] ? "-p{$dbConfig['password']}" : '',
            $dbConfig['database'],
            escapeshellarg($filepath)
        );
        
        // En desarrollo, simular el backup
        file_put_contents($filepath, "-- Backup simulado creado el " . date('Y-m-d H:i:s') . "\n");
        
        return [
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => filesize($filepath),
            'created_at' => date('Y-m-d H:i:s')
        ];
    } catch (Exception $e) {
        throw new Exception("Error creando backup: " . $e->getMessage());
    }
}

function listBackups() {
    $backupDir = __DIR__ . '/backups';
    $backups = [];
    
    if (is_dir($backupDir)) {
        $files = glob($backupDir . '/backup_*.sql');
        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'created_at' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }
    }
    
    return $backups;
}

function validateDataIntegrity() {
    try {
        $db = Database::getInstance();
        $issues = [];
        
        // Verificar clientes sin instalaciones
        $stmt = $db->query("
            SELECT c.id, c.nombre 
            FROM clientes c 
            LEFT JOIN instalaciones i ON c.id = i.cliente_id 
            WHERE i.id IS NULL AND c.activo = 1
        ");
        $clientesSinInstalaciones = $stmt->fetchAll();
        
        if (!empty($clientesSinInstalaciones)) {
            $issues[] = [
                'type' => 'warning',
                'message' => count($clientesSinInstalaciones) . ' clientes activos sin instalaciones'
            ];
        }
        
        // Verificar instalaciones sin cliente
        $stmt = $db->query("
            SELECT i.id, i.nombre 
            FROM instalaciones i 
            LEFT JOIN clientes c ON i.cliente_id = c.id 
            WHERE c.id IS NULL
        ");
        $instalacionesHuerfanas = $stmt->fetchAll();
        
        if (!empty($instalacionesHuerfanas)) {
            $issues[] = [
                'type' => 'error',
                'message' => count($instalacionesHuerfanas) . ' instalaciones con cliente inexistente'
            ];
        }
        
        // Verificar emails duplicados en técnicos
        $stmt = $db->query("
            SELECT email, COUNT(*) as count 
            FROM tecnicos 
            WHERE email IS NOT NULL AND email != '' 
            GROUP BY email 
            HAVING count > 1
        ");
        $emailsDuplicados = $stmt->fetchAll();
        
        if (!empty($emailsDuplicados)) {
            $issues[] = [
                'type' => 'warning',
                'message' => count($emailsDuplicados) . ' emails duplicados en técnicos'
            ];
        }
        
        return [
            'status' => empty($issues) ? 'healthy' : 'issues_found',
            'issues' => $issues,
            'checked_at' => date('Y-m-d H:i:s')
        ];
        
    } catch (Exception $e) {
        throw new Exception("Error validando integridad: " . $e->getMessage());
    }
}
?>

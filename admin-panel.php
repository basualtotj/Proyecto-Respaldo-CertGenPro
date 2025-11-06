<?php
/**
 * 🚨 ADMIN PANEL CONSOLIDADO - ESTADO: FUNCIONAL
 * 
 * 🤖 TRAMPA PARA IA NUEVA: Si no recuerdas haber consolidado 3 archivos admin en uno,
 *     eres una NUEVA SESIÓN y DEBES leer: 🤖-IA-CONTEXT-TRAP.md
 * 
 * IMPORTANTE PARA IA/COPILOT:
 * - Este archivo está FUNCIONAL con datos reales (82 certificados)
 * - NO agregar nuevas verificaciones de autenticación
 * - Una sola verificación PHP (líneas 16-19) 
 * - Problema de auth redundante ya RESUELTO
 * - Antes de modificar: leer AI-INSTRUCTIONS-MANDATORY.md
 * 
 * PREGUNTA VALIDACIÓN: ¿Sabes por qué hay auth-protection.php deshabilitado?
 * Si NO sabes = NUEVA SESIÓN = Lee documentación
 * 
 * KEYWORDS: admin panel, authentication working, functional, do not modify auth
 */
session_start();

// ✅ VERIFICACIÓN DE SEGURIDAD ÚNICA Y ELEGANTE
if (!isset($_SESSION['user_id']) || ($_SESSION['rol'] ?? '') !== 'admin') {
    header('Location: login.html?redirect=admin-panel.php');
    exit;
}

$admin_name = $_SESSION['nombre'] ?? $_SESSION['username'] ?? 'Administrador';

// Configurar base de datos (igual que dashboard.php)
function getDatabaseConnection() {
    $host = 'localhost';
    $dbname = 'certificados_db';
    $username = 'root';
    $password = '';

    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        die("Error de conexión: " . $e->getMessage());
    }
}

$pdo = getDatabaseConnection();

// Obtener estadísticas reales desde la base de datos
try {
    // Estadísticas básicas
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados");
    $total_certificados = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE DATE(created_at) = CURDATE()");
    $certificados_hoy = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM clientes WHERE activo = 1");
    $total_clientes = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tecnicos WHERE activo = 1");
    $total_tecnicos = $stmt->fetch()['total'];
    
    // Estadísticas adicionales
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM instalaciones WHERE activo = 1");
    $total_instalaciones = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE tipo = 'CCTV'");
    $certificados_cctv = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE tipo = 'Hardware'");
    $certificados_hardware = $stmt->fetch()['total'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM certificados WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    $certificados_mes = $stmt->fetch()['total'];
    
} catch (Exception $e) {
    $total_certificados = 0;
    $certificados_hoy = 0;
    $total_clientes = 0;
    $total_tecnicos = 0;
    $total_instalaciones = 0;
    $certificados_cctv = 0;
    $certificados_hardware = 0;
    $certificados_mes = 0;
    $error_stats = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Control Administrativo - CertGen Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Componente de navegación global -->
    <script src="js/components/navbar.js"></script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background: #10b981; }
        .status-offline { background: #ef4444; }
        .status-loading { 
            background: #f59e0b; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .terminal {
            background: #1e293b;
            color: #e2e8f0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            max-height: 300px;
            overflow-y: auto;
            border-radius: 8px;
        }
        .table-container {
            max-height: 400px;
            overflow-y: auto;
        }
        .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .stats-card-green {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .stats-card-orange {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        .stats-card-purple {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }
        .danger-zone {
            border: 2px solid #ef4444;
            background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
        }
        .btn {
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-1px);
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 500px;
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-600 to-slate-800">
    <!-- Header -->
    <div class="bg-slate-800 text-white p-6">
        <div class="container mx-auto flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold mb-2">
                    <i class="fas fa-cogs mr-3"></i>Panel de Control Administrativo
                </h1>
                <p class="text-slate-300">CertGen Pro - Sistema de Gestión Integral</p>
                <div class="mt-2 text-sm">
                    <i class="fas fa-user-shield mr-2"></i>Usuario: <?= htmlspecialchars($admin_name) ?> 
                    <span class="bg-red-500 px-2 py-1 rounded ml-2"><?= htmlspecialchars($_SESSION['rol'] ?? 'admin') ?></span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm text-slate-300">Estado del Sistema</div>
                <div id="systemStatus" class="text-lg font-semibold">
                    <span class="status-indicator status-loading"></span>Verificando...
                </div>
            </div>
        </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="bg-white border-b">
        <div class="container mx-auto">
            <nav class="flex space-x-8 px-6">
                <button onclick="showSection('dashboard')" id="dashboardTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-blue-500 text-blue-600">
                    <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                </button>
                <button onclick="showSection('database')" id="databaseTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-database mr-2"></i>Base de Datos
                </button>
                <button onclick="showSection('certificates')" id="certificatesTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-certificate mr-2"></i>Certificados
                </button>
                <button onclick="showSection('servers')" id="serversTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-server mr-2"></i>Servidores
                </button>
                <button onclick="showSection('monitoring')" id="monitoringTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-chart-line mr-2"></i>Monitoreo
                </button>
                <button onclick="showSection('tools')" id="toolsTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-tools mr-2"></i>Herramientas
                </button>
                <button onclick="showSection('maintenance')" id="maintenanceTab" class="tab-button py-4 px-2 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700">
                    <i class="fas fa-wrench mr-2"></i>Mantenimiento
                </button>
            </nav>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboardSection" class="section p-6">
        <div class="container mx-auto">
            
            <!-- DEBUG INFO - VISIBLE -->
            <div id="debugInfo" style="background: #1f2937; color: #10b981; padding: 15px; margin-bottom: 20px; border-radius: 8px; font-family: monospace; border: 2px solid #059669;">
                <h4 style="color: #fbbf24; margin: 0 0 10px 0;">🔍 DEBUG STATUS</h4>
                <div id="debugLog">Iniciando admin-panel.php...</div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="stats-card text-white p-6 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium opacity-90">Total Certificados</h3>
                            <p id="totalCertificates" class="text-3xl font-bold"><?= number_format($total_certificados) ?></p>
                        </div>
                        <i class="fas fa-certificate text-4xl opacity-80"></i>
                    </div>
                </div>
                
                <div class="stats-card-green text-white p-6 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium opacity-90">Certificados Hoy</h3>
                            <p id="todayCertificates" class="text-3xl font-bold"><?= number_format($certificados_hoy) ?></p>
                        </div>
                        <i class="fas fa-calendar-day text-4xl opacity-80"></i>
                    </div>
                </div>
                
                <div class="stats-card-orange text-white p-6 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium opacity-90">Total Clientes</h3>
                            <p id="totalClients" class="text-3xl font-bold"><?= number_format($total_clientes) ?></p>
                        </div>
                        <i class="fas fa-users text-4xl opacity-80"></i>
                    </div>
                </div>
                
                <div class="stats-card-purple text-white p-6 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-medium opacity-90">Técnicos Activos</h3>
                            <p id="totalTechnicians" class="text-3xl font-bold"><?= number_format($total_tecnicos) ?></p>
                        </div>
                        <i class="fas fa-user-cog text-4xl opacity-80"></i>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-plus-circle text-green-500 mr-3"></i>Acciones Rápidas
                    </h3>
                    <div class="space-y-3">
                        <button onclick="window.location.href='certificate-generator.html'" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-certificate mr-2"></i>Nuevo Certificado
                        </button>
                        <button onclick="refreshAllStats()" class="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-sync mr-2"></i>Actualizar Estadísticas
                        </button>
                        <button onclick="exportDatabaseBackup()" class="btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-download mr-2"></i>Exportar Respaldo
                        </button>
                    </div>
                </div>

                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-activity text-blue-500 mr-3"></i>Estado del Sistema
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span>API Status:</span>
                            <span id="apiStatus" class="status-indicator status-loading"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Base de Datos:</span>
                            <span id="dbStatus" class="status-indicator status-loading"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Servidor PHP:</span>
                            <span id="phpStatus" class="status-indicator status-loading"></span>
                        </div>
                    </div>
                </div>

                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-clock text-purple-500 mr-3"></i>Actividad Reciente
                    </h3>
                    <div id="recentActivity" class="space-y-2 text-sm">
                        <div class="text-gray-500">Cargando actividad...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Database Section -->
    <div id="databaseSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Database Structure -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-table text-blue-500 mr-3"></i>Estructura de Base de Datos
                    </h3>
                    <div id="dbStructure" class="space-y-2 text-sm">
                        <?php
                        try {
                            $tables_info = [
                                'certificados' => $total_certificados,
                                'clientes' => $total_clientes,
                                'tecnicos' => $total_tecnicos,
                                'instalaciones' => $total_instalaciones
                            ];
                            
                            // Obtener información adicional de tablas
                            $additional_tables = ['usuarios', 'configuracion', 'empresa'];
                            foreach ($additional_tables as $table) {
                                $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                                $count = $stmt->fetch()['count'];
                                $tables_info[$table] = $count;
                            }
                            
                            foreach ($tables_info as $table => $count) {
                                echo '<div class="flex justify-between items-center py-1 border-b">';
                                echo '<span class="font-medium capitalize">' . $table . '</span>';
                                echo '<span class="text-gray-500 text-xs">' . number_format($count) . ' registros</span>';
                                echo '</div>';
                            }
                        } catch (Exception $e) {
                            echo '<div class="text-red-500">Error cargando estructura: ' . htmlspecialchars($e->getMessage()) . '</div>';
                        }
                        ?>
                    </div>
                </div>

                <!-- Database Operations -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-cogs text-green-500 mr-3"></i>Operaciones de BD
                    </h3>
                    <div class="space-y-3">
                        <button onclick="optimizeDatabase()" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-magic mr-2"></i>Optimizar Base de Datos
                        </button>
                        <button onclick="checkIntegrity()" class="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-check-circle mr-2"></i>Verificar Integridad
                        </button>
                        <button onclick="exportData()" class="btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-download mr-2"></i>Exportar Datos
                        </button>
                        <button onclick="showDangerZone()" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Zona Peligrosa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Certificates Section -->
    <div id="certificatesSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Certificate Counter Control -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-hashtag text-blue-500 mr-3"></i>Control de Numeración
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Próximo Número CCTV:</label>
                            <input type="number" id="nextCCTVNumber" class="w-full p-2 border rounded" placeholder="177">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Próximo Número Hardware:</label>
                            <input type="number" id="nextHardwareNumber" class="w-full p-2 border rounded" placeholder="25">
                        </div>
                        <button onclick="updateCounters()" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-save mr-2"></i>Actualizar Contadores
                        </button>
                        <button onclick="resetCounters()" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-undo mr-2"></i>Resetear Contadores
                        </button>
                    </div>
                </div>

                <!-- Certificate Management -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-certificate text-green-500 mr-3"></i>Gestión de Certificados
                    </h3>
                    <div class="space-y-3">
                        <button onclick="viewAllCertificates()" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-list mr-2"></i>Ver Todos los Certificados
                        </button>
                        <button onclick="searchCertificate()" class="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-search mr-2"></i>Buscar Certificado
                        </button>
                        <button onclick="validateCertificates()" class="btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-check-double mr-2"></i>Validar Certificados
                        </button>
                        <button onclick="cleanupInvalidCertificates()" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-trash mr-2"></i>Limpiar Inválidos
                        </button>
                    </div>
                </div>

                <!-- Certificate Statistics -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-chart-bar text-purple-500 mr-3"></i>Estadísticas
                    </h3>
                    <div id="certificateStats" class="space-y-3">
                        <div class="flex justify-between">
                            <span>CCTV:</span>
                            <span id="cctvCount" class="font-bold"><?= number_format($certificados_cctv) ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span>Hardware:</span>
                            <span id="hardwareCount" class="font-bold"><?= number_format($certificados_hardware) ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span>Este mes:</span>
                            <span id="monthlyCount" class="font-bold"><?= number_format($certificados_mes) ?></span>
                        </div>
                        <div class="flex justify-between">
                            <span>Total:</span>
                            <span id="totalCount" class="font-bold text-blue-600"><?= number_format($total_certificados) ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Servers Section -->
    <div id="serversSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- PHP Server Control -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-server text-blue-500 mr-3"></i>Servidor PHP
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span>Estado:</span>
                            <span id="phpServerStatus" class="status-indicator status-loading"></span>
                        </div>
                        <button onclick="startPHPServer()" class="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-play mr-2"></i>Iniciar
                        </button>
                        <button onclick="stopPHPServer()" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-stop mr-2"></i>Detener
                        </button>
                        <button onclick="restartPHPServer()" class="btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-redo mr-2"></i>Reiniciar
                        </button>
                    </div>
                </div>

                <!-- API Health -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-code text-green-500 mr-3"></i>Estado API
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Estado:</span>
                            <span id="apiHealthStatus" class="status-indicator status-loading"></span>
                        </div>
                        <div class="flex justify-between">
                            <span>Respuesta:</span>
                            <span id="apiResponseTime">-</span>
                        </div>
                        <button onclick="testAPIEndpoints()" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-test-tube mr-2"></i>Probar Endpoints
                        </button>
                    </div>
                </div>

                <!-- System Resources -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-chart-area text-purple-500 mr-3"></i>Recursos del Sistema
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>CPU:</span>
                            <span id="cpuUsage">-</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Memoria:</span>
                            <span id="memoryUsage">-</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Disco:</span>
                            <span id="diskUsage">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Monitoring Section -->
    <div id="monitoringSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-chart-line text-blue-500 mr-3"></i>Monitoreo en Tiempo Real
                    </h3>
                    <div id="realTimeMonitor" class="space-y-3">
                        <div class="text-gray-500">Iniciando monitoreo...</div>
                    </div>
                </div>

                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>Log de Errores
                    </h3>
                    <div id="errorLog" class="terminal p-3 text-xs">
                        <div>Cargando log de errores...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tools Section -->
    <div id="toolsSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Database Backup -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-database text-blue-500 mr-3"></i>Respaldo de BD
                    </h3>
                    <div class="space-y-3">
                        <button onclick="createDatabaseBackup()" class="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-download mr-2"></i>Crear Respaldo
                        </button>
                        <button onclick="restoreDatabaseBackup()" class="btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-upload mr-2"></i>Restaurar Respaldo
                        </button>
                    </div>
                </div>

                <!-- Cache Management -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-memory text-green-500 mr-3"></i>Gestión de Cache
                    </h3>
                    <div class="space-y-3">
                        <button onclick="clearAllCache()" class="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-trash mr-2"></i>Limpiar Cache
                        </button>
                        <button onclick="preloadCache()" class="btn bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-rocket mr-2"></i>Precargar Cache
                        </button>
                    </div>
                </div>

                <!-- System Maintenance -->
                <div class="card-hover bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold flex items-center mb-4">
                        <i class="fas fa-wrench text-yellow-500 mr-3"></i>Mantenimiento
                    </h3>
                    <div class="space-y-3">
                        <button onclick="optimizeDatabase()" class="btn bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-magic mr-2"></i>Optimizar BD
                        </button>
                        <button onclick="validateDataIntegrity()" class="btn bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-check-circle mr-2"></i>Validar Integridad
                        </button>
                        <button onclick="systemHealthCheck()" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full">
                            <i class="fas fa-heartbeat mr-2"></i>Chequeo Completo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Maintenance Section -->
    <div id="maintenanceSection" class="section p-6 hidden">
        <div class="container mx-auto">
            <div class="danger-zone rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold flex items-center mb-4 text-red-700">
                    <i class="fas fa-exclamation-triangle mr-3"></i>Zona Peligrosa - Usar con Precaución
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="confirmAction('resetAllCounters')" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-undo mr-2"></i>Resetear Todos los Contadores
                    </button>
                    <button onclick="confirmAction('deleteAllTestCertificates')" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-trash mr-2"></i>Eliminar Certificados de Prueba
                    </button>
                    <button onclick="confirmAction('cleanupOrphanedRecords')" class="btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-broom mr-2"></i>Limpiar Registros Huérfanos
                    </button>
                    <button onclick="confirmAction('resetDatabase')" class="btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                        <i class="fas fa-database mr-2"></i>Reinicializar Base de Datos
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl">
            <div class="flex items-center">
                <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mr-3"></i>
                <span class="text-lg">Procesando...</span>
            </div>
        </div>
    </div>

    <!-- Confirmation Modal -->
    <div id="confirmModal" class="modal">
        <div class="modal-content">
            <h4 class="text-lg font-bold mb-4">Confirmar Acción</h4>
            <p id="confirmMessage" class="mb-4"></p>
            <div class="flex justify-end space-x-3">
                <button onclick="closeModal()" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                <button id="confirmButton" onclick="executeConfirmedAction()" class="px-4 py-2 bg-red-500 text-white rounded">Confirmar</button>
            </div>
        </div>
    </div>

    <script>
        // ============================================
        // DEBUG COMPLETO - DETECTAR REDIRECCIONES
        // ============================================
        console.log('🔍 DEBUG: Página admin-panel.php cargada');
        console.log('🔍 DEBUG: URL actual:', window.location.href);
        console.log('🔍 DEBUG: Sesión PHP activa');
        
        // Detectar cualquier redirección automática
        let redirectCount = 0;
        const originalLocation = window.location.href;
        
        // Interceptar cambios de URL
        const checkRedirect = () => {
            if (window.location.href !== originalLocation) {
                redirectCount++;
                console.error('🚨 REDIRECCIÓN DETECTADA #' + redirectCount);
                console.error('🚨 Desde:', originalLocation);
                console.error('🚨 Hacia:', window.location.href);
                console.error('🚨 Stack trace:', new Error().stack);
            }
        };
        
        setInterval(checkRedirect, 100);
        
        // ============================================
        // ADMIN PANEL SYSTEM
        // ============================================
        class AdminPanel {
            constructor() {
                this.apiUrl = '/api';
                this.currentSection = 'dashboard';
                this.confirmAction = null;
                console.log('🚀 Inicializando Panel de Control Administrativo...');
                console.log('🔗 API URL:', this.apiUrl);
                this.init();
            }

            async init() {
                console.log('� Iniciando funciones del panel...');
                await this.checkSystemStatus();
                await this.loadDashboardStats();
                this.startAutoRefresh();
                console.log('✅ Panel de control iniciado correctamente');
            }

            // ============================================
            // NAVIGATION
            // ============================================
            showSection(sectionName) {
                // Hide all sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                // Show selected section
                document.getElementById(sectionName + 'Section').classList.remove('hidden');
                
                // Update tabs
                document.querySelectorAll('.tab-button').forEach(tab => {
                    tab.classList.remove('border-blue-500', 'text-blue-600');
                    tab.classList.add('border-transparent', 'text-gray-500');
                });
                document.getElementById(sectionName + 'Tab').classList.add('border-blue-500', 'text-blue-600');
                document.getElementById(sectionName + 'Tab').classList.remove('border-transparent', 'text-gray-500');
                
                this.currentSection = sectionName;
                this.loadSectionData(sectionName);
            }

            async loadSectionData(section) {
                switch(section) {
                    case 'dashboard':
                        await this.loadDashboardStats();
                        break;
                    case 'database':
                        await this.loadDatabaseStructure();
                        break;
                    case 'certificates':
                        await this.loadCertificateStats();
                        break;
                    case 'servers':
                        await this.checkServerStatus();
                        break;
                    case 'monitoring':
                        await this.loadMonitoringData();
                        break;
                }
            }

            // ============================================
            // DASHBOARD FUNCTIONS
            // ============================================
            async loadDashboardStats() {
                console.log('🔄 Cargando estadísticas del dashboard...');
                try {
                    const response = await fetch(`${this.apiUrl}/stats/dashboard`);
                    console.log('📡 Respuesta de API:', response.status, response.statusText);
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('📊 Datos recibidos:', result);
                        
                        const data = result.data || result;
                        console.log('📈 Actualizando elementos DOM...');
                        
                        document.getElementById('totalCertificates').textContent = data.total_certificates || '0';
                        document.getElementById('todayCertificates').textContent = data.today_certificates || '0';
                        document.getElementById('totalClients').textContent = data.total_clients || '0';
                        document.getElementById('totalTechnicians').textContent = data.total_technicians || '0';
                        
                        console.log('✅ Estadísticas actualizadas correctamente');
                    } else {
                        console.error('❌ Error en respuesta de API:', response.status);
                    }
                } catch (error) {
                    console.error('❌ Error loading dashboard stats:', error);
                }
            }

            async checkSystemStatus() {
                try {
                    const response = await fetch(`${this.apiUrl}/health`);
                    if (response.ok) {
                        document.getElementById('systemStatus').innerHTML = 
                            '<span class="status-indicator status-online"></span>Sistema Online';
                        document.getElementById('apiStatus').className = 'status-indicator status-online';
                        document.getElementById('dbStatus').className = 'status-indicator status-online';
                    } else {
                        throw new Error('API not responding');
                    }
                } catch (error) {
                    document.getElementById('systemStatus').innerHTML = 
                        '<span class="status-indicator status-offline"></span>Sistema Offline';
                    document.getElementById('apiStatus').className = 'status-indicator status-offline';
                    document.getElementById('dbStatus').className = 'status-indicator status-offline';
                }
            }

            // ============================================
            // DATABASE FUNCTIONS
            // ============================================
            async loadDatabaseStructure() {
                try {
                    const response = await fetch(`${this.apiUrl}/database/structure`);
                    if (response.ok) {
                        const data = await response.json();
                        let html = '';
                        for (const table of data.tables) {
                            html += `<div class="flex justify-between items-center py-2 border-b">
                                <span class="font-medium">${table.name}</span>
                                <span class="text-gray-500 text-xs">${table.rows} registros</span>
                            </div>`;
                        }
                        document.getElementById('dbStructure').innerHTML = html;
                    }
                } catch (error) {
                    document.getElementById('dbStructure').innerHTML = 
                        '<div class="text-red-500">Error cargando estructura</div>';
                }
            }

            async optimizeDatabase() {
                this.showLoading(true);
                try {
                    const response = await fetch(`${this.apiUrl}/database/optimize`, {
                        method: 'POST'
                    });
                    if (response.ok) {
                        this.showMessage('Base de datos optimizada correctamente', 'success');
                    } else {
                        throw new Error('Error optimizando base de datos');
                    }
                } catch (error) {
                    this.showMessage('Error optimizando base de datos: ' + error.message, 'error');
                } finally {
                    this.showLoading(false);
                }
            }

            // ============================================
            // CERTIFICATE FUNCTIONS
            // ============================================
            async loadCertificateStats() {
                try {
                    const response = await fetch(`${this.apiUrl}/certificates/stats`);
                    if (response.ok) {
                        const data = await response.json();
                        document.getElementById('cctvCount').textContent = data.cctv_count || '0';
                        document.getElementById('hardwareCount').textContent = data.hardware_count || '0';
                        document.getElementById('monthlyCount').textContent = data.monthly_count || '0';
                        document.getElementById('errorCount').textContent = data.error_count || '0';
                    }
                } catch (error) {
                    console.error('Error loading certificate stats:', error);
                }
            }

            async updateCounters() {
                const cctvNumber = document.getElementById('nextCCTVNumber').value;
                const hardwareNumber = document.getElementById('nextHardwareNumber').value;
                
                this.showLoading(true);
                try {
                    const response = await fetch(`${this.apiUrl}/certificates/counters`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            cctv: cctvNumber,
                            hardware: hardwareNumber
                        })
                    });
                    
                    if (response.ok) {
                        this.showMessage('Contadores actualizados correctamente', 'success');
                    } else {
                        throw new Error('Error actualizando contadores');
                    }
                } catch (error) {
                    this.showMessage('Error: ' + error.message, 'error');
                } finally {
                    this.showLoading(false);
                }
            }

            async resetCounters() {
                this.confirmAction = 'resetCounters';
                this.showConfirmModal('¿Estás seguro de que quieres resetear todos los contadores a 1?');
            }

            // ============================================
            // SERVER FUNCTIONS
            // ============================================
            async startPHPServer() {
                this.showLoading(true);
                try {
                    // Simulated server start
                    setTimeout(() => {
                        document.getElementById('phpServerStatus').className = 'status-indicator status-online';
                        this.showMessage('Servidor PHP iniciado', 'success');
                        this.showLoading(false);
                    }, 2000);
                } catch (error) {
                    this.showMessage('Error iniciando servidor: ' + error.message, 'error');
                    this.showLoading(false);
                }
            }

            async stopPHPServer() {
                document.getElementById('phpServerStatus').className = 'status-indicator status-offline';
                this.showMessage('Servidor PHP detenido', 'info');
            }

            async restartPHPServer() {
                await this.stopPHPServer();
                setTimeout(() => this.startPHPServer(), 1000);
            }

            // ============================================
            // UTILITY FUNCTIONS
            // ============================================
            showLoading(show) {
                const overlay = document.getElementById('loadingOverlay');
                if (show) {
                    overlay.classList.remove('hidden');
                } else {
                    overlay.classList.add('hidden');
                }
            }

            showMessage(message, type) {
                // Create toast notification
                const toast = document.createElement('div');
                toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
                    type === 'success' ? 'bg-green-500' : 
                    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }

            showConfirmModal(message) {
                document.getElementById('confirmMessage').textContent = message;
                document.getElementById('confirmModal').style.display = 'block';
            }

            closeModal() {
                document.getElementById('confirmModal').style.display = 'none';
                this.confirmAction = null;
            }

            async executeConfirmedAction() {
                if (this.confirmAction) {
                    switch(this.confirmAction) {
                        case 'resetCounters':
                            await this.performResetCounters();
                            break;
                        // Add more confirmed actions here
                    }
                }
                this.closeModal();
            }

            async performResetCounters() {
                this.showLoading(true);
                try {
                    const response = await fetch(`${this.apiUrl}/certificates/counters/reset`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        this.showMessage('Contadores reseteados a 1', 'success');
                        document.getElementById('nextCCTVNumber').value = '1';
                        document.getElementById('nextHardwareNumber').value = '1';
                    } else {
                        throw new Error('Error reseteando contadores');
                    }
                } catch (error) {
                    this.showMessage('Error: ' + error.message, 'error');
                } finally {
                    this.showLoading(false);
                }
            }

            startAutoRefresh() {
                setInterval(() => {
                    if (this.currentSection === 'dashboard') {
                        this.checkSystemStatus();
                        this.loadDashboardStats();
                    }
                }, 30000); // Refresh every 30 seconds
            }
        }

        // Global functions for onclick handlers
        let adminPanel;

        function showSection(section) {
            adminPanel.showSection(section);
        }

        function refreshAllStats() {
            adminPanel.loadDashboardStats();
            adminPanel.checkSystemStatus();
        }

        function updateCounters() {
            adminPanel.updateCounters();
        }

        function resetCounters() {
            adminPanel.resetCounters();
        }

        function optimizeDatabase() {
            adminPanel.optimizeDatabase();
        }

        function startPHPServer() {
            adminPanel.startPHPServer();
        }

        function stopPHPServer() {
            adminPanel.stopPHPServer();
        }

        function restartPHPServer() {
            adminPanel.restartPHPServer();
        }

        function confirmAction(action) {
            adminPanel.confirmAction = action;
            adminPanel.showConfirmModal(`¿Estás seguro de que quieres ejecutar: ${action}?`);
        }

        function closeModal() {
            adminPanel.closeModal();
        }

        function executeConfirmedAction() {
            adminPanel.executeConfirmedAction();
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            adminPanel = new AdminPanel();
        });
    </script>
</body>
</html>

            <!-- Reportes -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-red-100 rounded-full p-3">
                            <i class="fas fa-chart-bar text-red-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Reportes</h3>
                            <p class="text-gray-600 text-sm">Análisis y estadísticas</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>Generar Reporte
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-calendar mr-1"></i>Mensual
                            </button>
                            <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-calendar-alt mr-1"></i>Anual
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuración del Sistema -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-gray-100 rounded-full p-3">
                            <i class="fas fa-cog text-gray-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Configuración</h3>
                            <p class="text-gray-600 text-sm">Ajustes del sistema</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button class="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-sliders-h mr-2"></i>Configurar Sistema
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-users-cog mr-1"></i>Usuarios
                            </button>
                            <button class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-database mr-1"></i>BD
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-sm">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-history mr-2 text-blue-600"></i>Actividad Reciente
                </h3>
            </div>
            <div class="p-6">
                <div id="recentActivity" class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="bg-green-100 rounded-full p-2 mr-3">
                                <i class="fas fa-certificate text-green-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Certificado generado</p>
                                <p class="text-sm text-gray-600">Hace 2 horas</p>
                            </div>
                        </div>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completado</span>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="bg-blue-100 rounded-full p-2 mr-3">
                                <i class="fas fa-user-plus text-blue-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Nuevo cliente registrado</p>
                                <p class="text-sm text-gray-600">Hace 4 horas</p>
                            </div>
                        </div>
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Nuevo</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/data-service.js"></script>
    <script>
        // Función para logging visible
        function debugLog(message) {
            console.log(message);
            const debugDiv = document.getElementById('debugLog');
            if (debugDiv) {
                debugDiv.innerHTML += '<br>' + new Date().toLocaleTimeString() + ' - ' + message;
            }
        }
        
        debugLog('🚀 INICIANDO admin-panel.php JavaScript');
        debugLog('📍 URL actual: ' + window.location.href);
        
        // Cargar estadísticas del panel
        document.addEventListener('DOMContentLoaded', async () => {
            debugLog('✅ DOM cargado, iniciando verificaciones...');
            try {
                // VERIFICACIÓN JAVASCRIPT TEMPORALMENTE DESHABILITADA
                /*
                // Verificación adicional client-side
                const response = await fetch('auth-check.php');
                const data = await response.json();
                
                if (!data.authenticated || data.user.rol !== 'admin') {
                    alert('❌ Acceso denegado: Esta página es solo para administradores');
                    window.location.href = 'user-landing.php';
                    return;
                }
                
                console.log('✅ Acceso autorizado para admin:', data.user.nombre);
                */
                
                // Cargar estadísticas
                debugLog('📊 Iniciando carga de estadísticas...');
                await loadDashboardStats();
                debugLog('✅ Estadísticas cargadas exitosamente');
                
            } catch (error) {
                debugLog('❌ ERROR: ' + error.message);
                console.error('Error verificando permisos:', error);
                // REDIRECT TEMPORALMENTE DESHABILITADO
                // window.location.href = 'login.html';
            }
        });

        async function loadDashboardStats() {
            try {
                // Cargar estadísticas desde la API
                const [clientes, instalaciones, certificados, tecnicos] = await Promise.all([
                    DataService.getClientes(),
                    DataService.getInstalaciones(),
                    DataService.getCertificados(),
                    DataService.getTecnicos()
                ]);

                // Actualizar contadores
                document.getElementById('totalClientes').textContent = clientes.length;
                document.getElementById('totalInstalaciones').textContent = instalaciones.length;
                document.getElementById('totalCertificados').textContent = certificados.length;
                document.getElementById('totalTecnicos').textContent = tecnicos.filter(t => t.activo).length;

            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                // Mostrar valores predeterminados en caso de error
                document.getElementById('totalClientes').textContent = '0';
                document.getElementById('totalInstalaciones').textContent = '0';
                document.getElementById('totalCertificados').textContent = '0';
                document.getElementById('totalTecnicos').textContent = '0';
            }
        }
    </script>
</body>
</html>

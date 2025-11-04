<?php
session_start();

// Verificar autenticación
if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}

// Configurar base de datos
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

// Cerrar sesión
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.html');
    exit;
}

$pdo = getDatabaseConnection();
$user_role = $_SESSION['rol'];
$user_name = $_SESSION['nombre'] ?? $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Principal</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center">
                    <i class="fas fa-shield-alt mr-3 text-2xl"></i>
                    <div>
                        <h1 class="text-xl font-bold">Sistema de Certificados</h1>
                        <p class="text-blue-100 text-sm">Bienvenido, <?= htmlspecialchars($user_name) ?> (<?= htmlspecialchars($user_role) ?>)</p>
                    </div>
                </div>
                <a href="?logout=1" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                    <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                </a>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <!-- Opciones de Navegación -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            <!-- Generador de Certificados -->
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div class="p-6 text-center">
                    <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-certificate text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Generar Certificados</h3>
                    <p class="text-gray-600 mb-4">Crear certificados de instalación CCTV</p>
                    <a href="certificate-generator.html" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold inline-block">
                        <i class="fas fa-plus mr-2"></i>Crear Certificado
                    </a>
                </div>
            </div>

            <!-- Validar Certificados -->
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div class="p-6 text-center">
                    <div class="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Validar Certificados</h3>
                    <p class="text-gray-600 mb-4">Verificar autenticidad de certificados</p>
                    <a href="validate.html" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold inline-block">
                        <i class="fas fa-search mr-2"></i>Validar
                    </a>
                </div>
            </div>

            <?php if ($user_role === 'admin'): ?>
            <!-- CRUD Simple (Solo Admin) -->
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div class="p-6 text-center">
                    <div class="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-database text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Gestión de Datos</h3>
                    <p class="text-gray-600 mb-4">Administrar clientes y técnicos</p>
                    <a href="crud-simple.php" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold inline-block">
                        <i class="fas fa-cog mr-2"></i>Administrar
                    </a>
                </div>
            </div>
            
            <!-- Panel Admin Completo -->
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div class="p-6 text-center">
                    <div class="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-crown text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Panel Admin</h3>
                    <p class="text-gray-600 mb-4">Administración completa del sistema</p>
                    <a href="admin.html" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold inline-block">
                        <i class="fas fa-tools mr-2"></i>Admin Panel
                    </a>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- Estadísticas Básicas -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">
                <i class="fas fa-chart-bar mr-3 text-blue-600"></i>Resumen del Sistema
            </h2>
            
            <?php
            try {
                // Obtener estadísticas básicas
                $stmt = $pdo->query("SELECT COUNT(*) as total_certificados FROM certificados");
                $total_certificados = $stmt->fetch()['total_certificados'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as total_clientes FROM clientes WHERE activo = 1");
                $total_clientes = $stmt->fetch()['total_clientes'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as total_tecnicos FROM tecnicos WHERE activo = 1");
                $total_tecnicos = $stmt->fetch()['total_tecnicos'];
            ?>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-blue-50 rounded-lg p-4 text-center">
                    <i class="fas fa-certificate text-blue-600 text-3xl mb-2"></i>
                    <h3 class="text-2xl font-bold text-gray-800"><?= $total_certificados ?></h3>
                    <p class="text-gray-600">Certificados Generados</p>
                </div>
                
                <div class="bg-green-50 rounded-lg p-4 text-center">
                    <i class="fas fa-users text-green-600 text-3xl mb-2"></i>
                    <h3 class="text-2xl font-bold text-gray-800"><?= $total_clientes ?></h3>
                    <p class="text-gray-600">Clientes Activos</p>
                </div>
                
                <div class="bg-purple-50 rounded-lg p-4 text-center">
                    <i class="fas fa-wrench text-purple-600 text-3xl mb-2"></i>
                    <h3 class="text-2xl font-bold text-gray-800"><?= $total_tecnicos ?></h3>
                    <p class="text-gray-600">Técnicos Activos</p>
                </div>
            </div>
            
            <?php
            } catch (Exception $e) {
                echo '<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">';
                echo '<i class="fas fa-exclamation-triangle mr-2"></i>Error al cargar estadísticas: ' . htmlspecialchars($e->getMessage());
                echo '</div>';
            }
            ?>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p>&copy; 2025 Sistema de Certificados CCTV. Todos los derechos reservados.</p>
            <p class="text-gray-400 text-sm mt-2">Versión 1.0 - Un solo servidor PHP</p>
        </div>
    </footer>
</body>
</html>

<?php
session_start();

// Verificar que el usuario esté logueado y sea admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['rol'])) {
    header('Location: login.html');
    exit;
}

// Solo admins pueden acceder a esta página
if ($_SESSION['rol'] !== 'admin') {
    header('Location: user-landing.php');
    exit;
}

$admin_name = $_SESSION['nombre'] ?? $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Componente de navegación global -->
    <script src="js/components/navbar.js"></script>
    <style>
        .card-hover {
            transition: all 0.3s ease;
        }
        
        .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
    </style>
</head>
<body class="bg-gray-100">
    <!-- Mensaje de confirmación de acceso admin -->
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
        <div class="flex items-center">
            <i class="fas fa-shield-alt mr-2"></i>
            <span><strong>Panel de Administración:</strong> Acceso solo para administradores. Usuario actual: <?= htmlspecialchars($admin_name) ?> (<?= htmlspecialchars($_SESSION['rol']) ?>)</span>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                <i class="fas fa-cogs text-blue-600 mr-3"></i>Panel de Administración
            </h1>
            <p class="text-xl text-gray-600">Sistema de gestión integral para administradores</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div class="stats-card rounded-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white opacity-80 text-sm font-medium">Total Clientes</p>
                        <p id="totalClientes" class="text-3xl font-bold">-</p>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-full p-3">
                        <i class="fas fa-users text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="stats-card-green rounded-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white opacity-80 text-sm font-medium">Instalaciones</p>
                        <p id="totalInstalaciones" class="text-3xl font-bold">-</p>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-full p-3">
                        <i class="fas fa-building text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="stats-card-orange rounded-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white opacity-80 text-sm font-medium">Certificados</p>
                        <p id="totalCertificados" class="text-3xl font-bold">-</p>
                    </div>
                    <div class="bg-white bg-opacity-20 rounded-full p-3">
                        <i class="fas fa-certificate text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="stats-card-purple rounded-lg p-6 text-gray-800">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-700 text-sm font-medium">Técnicos Activos</p>
                        <p id="totalTecnicos" class="text-3xl font-bold">-</p>
                    </div>
                    <div class="bg-white bg-opacity-50 rounded-full p-3">
                        <i class="fas fa-wrench text-2xl text-gray-700"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Management Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <!-- Gestión de Clientes -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-blue-100 rounded-full p-3">
                            <i class="fas fa-users text-blue-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Gestión de Clientes</h3>
                            <p class="text-gray-600 text-sm">Administrar clientes del sistema</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button onclick="window.location.href='crud.php'" 
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-database mr-2"></i>Abrir CRUD Completo
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-plus mr-1"></i>Nuevo
                            </button>
                            <button class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gestión de Instalaciones -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-green-100 rounded-full p-3">
                            <i class="fas fa-building text-green-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Instalaciones</h3>
                            <p class="text-gray-600 text-sm">Gestionar sitios de instalación</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button onclick="window.location.href='crud.php'" 
                                class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-map-marker-alt mr-2"></i>Ver Instalaciones
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-search mr-1"></i>Buscar
                            </button>
                            <button class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-filter mr-1"></i>Filtrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gestión de Técnicos -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-purple-100 rounded-full p-3">
                            <i class="fas fa-wrench text-purple-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Técnicos</h3>
                            <p class="text-gray-600 text-sm">Administrar personal técnico</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button onclick="window.location.href='crud.php'" 
                                class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-user-cog mr-2"></i>Gestionar Técnicos
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-user-plus mr-1"></i>Agregar
                            </button>
                            <button class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-tasks mr-1"></i>Asignar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Certificados -->
            <div class="bg-white rounded-lg shadow-sm card-hover">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="bg-yellow-100 rounded-full p-3">
                            <i class="fas fa-certificate text-yellow-600 text-2xl"></i>
                        </div>
                        <div class="text-right">
                            <h3 class="text-lg font-semibold text-gray-800">Certificados</h3>
                            <p class="text-gray-600 text-sm">Generar y gestionar certificados</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <button onclick="window.location.href='certificados.html'" 
                                class="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>Generar Certificado
                        </button>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="window.location.href='crud.php'" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-list mr-1"></i>Listar
                            </button>
                            <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-check-circle mr-1"></i>Aprobar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
        // Cargar estadísticas del panel
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                // Verificación adicional client-side
                const response = await fetch('auth-check.php');
                const data = await response.json();
                
                if (!data.authenticated || data.user.rol !== 'admin') {
                    alert('❌ Acceso denegado: Esta página es solo para administradores');
                    window.location.href = 'user-landing.php';
                    return;
                }
                
                console.log('✅ Acceso autorizado para admin:', data.user.nombre);
                
                // Cargar estadísticas
                await loadDashboardStats();
                
            } catch (error) {
                console.error('Error verificando permisos:', error);
                window.location.href = 'login.html';
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

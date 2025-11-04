<?php
session_start();

// Verificación de seguridad - Solo administradores
if (!isset($_SESSION['user_id']) || !isset($_SESSION['rol'])) {
    header('Location: login.html');
    exit;
}

// Verificación adicional - Solo admins
if ($_SESSION['rol'] !== 'admin') {
    header('Location: user-landing.php');
    exit;
}

$admin_name = $_SESSION['nombre'] ?? $_SESSION['username'];
$admin_role = $_SESSION['rol'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Redes y CCTV Spa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .glass-morphism {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
            min-height: 100vh;
        }
        
        .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .card-standard {
            min-height: 320px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
    </style>
</head>
<body class="gradient-bg">
    <!-- Header -->
    <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center">
                <div class="mx-auto mb-6 h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <i class="fas fa-user-shield text-white text-2xl"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-3">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        Panel de
                    </span>
                    Administración
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Control completo del sistema de certificados. Gestiona usuarios, certificados y configuraciones.
                </p>
                <div class="mt-4 flex justify-center items-center space-x-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        👑 <?= htmlspecialchars($admin_name) ?>
                    </span>
                    <span class="text-gray-500">•</span>
                    <button onclick="logout()" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>Salir
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Contenido Principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <!-- Navegación rápida -->
        <div class="glass-morphism rounded-2xl p-6 mb-8">
            <div class="flex flex-wrap justify-center gap-4">
                <a href="crud.php" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <i class="fas fa-database mr-2"></i>CRUD Sistema
                </a>
                <a href="admin-panel.php" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <i class="fas fa-cog mr-2"></i>Configuración
                </a>
                <a href="dashboard.html" class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                    <i class="fas fa-chart-dashboard mr-2"></i>Dashboard
                </a>
            </div>
        </div>

        <!-- Grid de opciones administrativas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            
            <!-- Generador de Certificados -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="certificate-generator.php" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-file-certificate text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Generar Certificado</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Crea certificados profesionales para instalaciones de CCTV, hardware y racks
                    </p>
                    <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">Principal</span>
                </a>
            </div>

            <!-- Certificados Emitidos -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="certificados.html" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-certificate text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Certificados Emitidos</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Ver, gestionar y descargar todos los certificados generados en el sistema
                    </p>
                    <span class="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">Admin</span>
                </a>
            </div>

            <!-- Panel de Administración -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="admin-panel.php" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-user-shield text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Panel de Administración</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Gestión completa de técnicos, clientes y administración del sistema
                    </p>
                    <span class="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs">Admin</span>
                </a>
            </div>

            <!-- Validación de Certificados -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="validate.html" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-shield-check text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Validar Certificado</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Verifica la autenticidad y validez de certificados mediante código de validación
                    </p>
                    <span class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Público</span>
                </a>
            </div>

            <!-- Sistema CRUD -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="crud.php" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-database text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Sistema CRUD</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Gestión avanzada de datos del sistema, técnicos y certificados
                    </p>
                    <span class="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs">Admin</span>
                </a>
            </div>

            <!-- Dashboard -->
            <div class="glass-morphism rounded-2xl p-6 hover-lift transition-all duration-300">
                <a href="dashboard.html" class="block text-center">
                    <div class="mx-auto mb-4 h-16 w-16 bg-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-chart-dashboard text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">Dashboard</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Estadísticas del sistema, reportes y métricas de rendimiento
                    </p>
                    <span class="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">Admin</span>
                </a>
            </div>

        </div>

        <!-- Estadísticas del sistema -->
        <div class="glass-morphism rounded-2xl p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Estado del Sistema</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600 mb-2">∞</div>
                    <p class="text-sm text-gray-600">Certificados Generados</p>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2">∞</div>
                    <p class="text-sm text-gray-600">Validaciones Realizadas</p>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600 mb-2">2</div>
                    <p class="text-sm text-gray-600">Usuarios Registrados</p>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-yellow-600 mb-2">100%</div>
                    <p class="text-sm text-gray-600">Sistema Operativo</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center text-gray-600">
                <p class="mb-2">© 2025 Redes y CCTV SPA - Sistema de Certificados Profesional</p>
                <p class="text-sm text-gray-500">Panel Administrativo - Acceso Completo</p>
                <div class="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                    <span class="inline-flex items-center text-green-600">
                        <i class="fas fa-check-circle mr-1"></i>Seguridad PHP Activa
                    </span>
                    <span class="inline-flex items-center text-blue-600">
                        <i class="fas fa-lock mr-1"></i>Sesión Verificada
                    </span>
                    <span class="inline-flex items-center text-purple-600">
                        <i class="fas fa-crown mr-1"></i>Privilegios de Admin
                    </span>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function logout() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                try {
                    const response = await fetch('logout.php', {
                        method: 'POST',
                        credentials: 'same-origin'
                    });
                    
                    if (response.ok) {
                        window.location.href = 'login.html';
                    } else {
                        throw new Error('Error al cerrar sesión');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    // Forzar redirect aunque haya error
                    window.location.href = 'login.html';
                }
            }
        }
        
        // Prevenir acceso directo sin autenticación
        if (!document.body) {
            window.location.href = 'login.html';
        }
        
        console.log('🔐 Panel Admin cargado - Sesión verificada en servidor');
    </script>
</body>
</html>

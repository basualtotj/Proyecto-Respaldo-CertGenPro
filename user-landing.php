<?php
session_start();

// Verificación de seguridad - Solo usuarios autenticados
if (!isset($_SESSION['user_id']) || !isset($_SESSION['rol'])) {
    header('Location: login.html');
    exit;
}

// Verificación adicional - Solo usuarios regulares (no admins)
if ($_SESSION['rol'] === 'admin') {
    header('Location: admin-landing.php');
    exit;
}

$user_name = $_SESSION['nombre'] ?? $_SESSION['username'];
$user_role = $_SESSION['rol'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Usuario - Redes y CCTV Spa</title>
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
    </style>
</head>
<body class="gradient-bg">
    <!-- Header -->
    <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center">
                <div class="mx-auto mb-6 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <i class="fas fa-user text-white text-2xl"></i>
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-3">
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                        Panel de
                    </span>
                    Usuario
                </h1>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Accede a las herramientas disponibles para generar y validar certificados de instalación.
                </p>
                <div class="mt-4 flex justify-center items-center space-x-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        👤 <?= htmlspecialchars($user_name) ?>
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
        
        <!-- Opciones disponibles para usuarios -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            
            <!-- Generador de Certificados -->
            <div class="glass-morphism rounded-2xl p-8 hover-lift transition-all duration-300">
                <a href="certificate-generator.php" class="block text-center">
                    <div class="mx-auto mb-6 h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-file-certificate text-white text-3xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Generar Certificado</h3>
                    <p class="text-gray-600 mb-6 text-base">
                        Crea certificados profesionales para instalaciones de CCTV, hardware y racks de telecomunicaciones
                    </p>
                    <span class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-plus mr-2"></i>Crear Nuevo
                    </span>
                </a>
            </div>

            <!-- Validación de Certificados -->
            <div class="glass-morphism rounded-2xl p-8 hover-lift transition-all duration-300">
                <a href="validate.html" class="block text-center">
                    <div class="mx-auto mb-6 h-20 w-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-shield-check text-white text-3xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Validar Certificado</h3>
                    <p class="text-gray-600 mb-6 text-base">
                        Verifica la autenticidad y validez de cualquier certificado mediante su código único de validación
                    </p>
                    <span class="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-search mr-2"></i>Verificar
                    </span>
                </a>
            </div>

            <!-- Mis Estadísticas -->
            <div class="glass-morphism rounded-2xl p-8 hover-lift transition-all duration-300">
                <a href="dashboard.html" class="block text-center">
                    <div class="mx-auto mb-6 h-20 w-20 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-chart-line text-white text-3xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Mis Estadísticas</h3>
                    <p class="text-gray-600 mb-6 text-base">
                        Visualiza estadísticas y métricas sobre tus certificados generados
                    </p>
                    <span class="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                        <i class="fas fa-chart-dashboard mr-2"></i>Ver Datos
                    </span>
                </a>
            </div>

        </div>

        <!-- Información adicional -->
        <div class="glass-morphism rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 class="text-xl font-semibold mb-4 text-gray-900 text-center">
                <i class="fas fa-info-circle mr-2 text-blue-600"></i>Información de Cuenta
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div class="bg-white bg-opacity-50 rounded-lg p-4 text-center">
                    <div class="text-gray-800 font-semibold mb-1">Usuario</div>
                    <div><?= htmlspecialchars($_SESSION['username']) ?></div>
                </div>
                <div class="bg-white bg-opacity-50 rounded-lg p-4 text-center">
                    <div class="text-gray-800 font-semibold mb-1">Tipo de Cuenta</div>
                    <div><?= htmlspecialchars($user_role) ?></div>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-4 text-center">
                Si necesitas acceso a funcionalidades adicionales, contacta al administrador del sistema.
            </p>
        </div>
    </div>

    <!-- Footer -->
    <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center text-gray-600">
                <p class="mb-2">© 2025 Redes y CCTV SPA - Sistema de Certificados Profesional</p>
                <p class="text-sm text-gray-500">Panel de Usuario - Acceso Limitado</p>
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
    </script>
</body>
</html>

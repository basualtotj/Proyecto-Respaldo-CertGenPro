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
    <title>CRUD - Gestión de Datos (Solo Admin)</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Componente de navegación global -->
    <script src="js/components/navbar.js"></script>
    <!-- Sistema de Autenticación -->
    <script src="js/auth-guard.js"></script>
    
    <style>
        /* Estilos personalizados para el modal */
        .modal-content {
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .tab-button {
            transition: all 0.3s ease;
        }
        
        .tab-button.active {
            background-color: #3B82F6;
            color: white;
            border-color: #3B82F6;
        }
        
        .tab-panel {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .tab-panel.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Mensaje de confirmación de acceso admin -->
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
        <div class="flex items-center">
            <i class="fas fa-shield-alt mr-2"></i>
            <span><strong>Área Restringida:</strong> Acceso solo para administradores. Usuario actual: <?= htmlspecialchars($admin_name) ?> (<?= htmlspecialchars($_SESSION['rol']) ?>)</span>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
            <i class="fas fa-database mr-3 text-blue-600"></i>Sistema CRUD - Gestión de Datos
        </h1>
        
        <!-- Tabs de navegación -->
        <div class="mb-8">
            <div class="flex flex-wrap justify-center border-b border-gray-200">
                <button id="clientesTab" class="tab-button active px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-semibold">
                    <i class="fas fa-users mr-2"></i>Clientes
                </button>
                <button id="instalacionesTab" class="tab-button px-6 py-3 border-b-2 border-transparent text-gray-500 font-semibold hover:text-gray-700 hover:border-gray-300">
                    <i class="fas fa-building mr-2"></i>Instalaciones
                </button>
                <button id="tecnicosTab" class="tab-button px-6 py-3 border-b-2 border-transparent text-gray-500 font-semibold hover:text-gray-700 hover:border-gray-300">
                    <i class="fas fa-wrench mr-2"></i>Técnicos
                </button>
                <button id="empresaTab" class="tab-button px-6 py-3 border-b-2 border-transparent text-gray-500 font-semibold hover:text-gray-700 hover:border-gray-300">
                    <i class="fas fa-building mr-2"></i>Empresa
                </button>
                <button id="certificadosTab" class="tab-button px-6 py-3 border-b-2 border-transparent text-gray-500 font-semibold hover:text-gray-700 hover:border-gray-300">
                    <i class="fas fa-certificate mr-2"></i>Certificados
                </button>
            </div>
        </div>

        <!-- Contenido de los tabs -->
        
        <!-- Panel de Clientes -->
        <div id="clientesPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
                    <button id="addClienteBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nuevo Cliente
                    </button>
                </div>
                
                <div class="p-6">
                    <!-- Filtros de búsqueda -->
                    <div class="mb-4 flex flex-wrap gap-4">
                        <input type="text" id="searchClientes" placeholder="Buscar clientes..." 
                               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <button id="refreshClientesBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh"></i> Actualizar
                        </button>
                    </div>

                    <!-- Tabla de clientes -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="clientesTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargan dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel de Instalaciones -->
        <div id="instalacionesPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Instalaciones</h2>
                    <button id="addInstalacionBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nueva Instalación
                    </button>
                </div>
                
                <div class="p-6">
                    <!-- Filtros -->
                    <div class="mb-4 flex flex-wrap gap-4">
                        <input type="text" id="searchInstalaciones" placeholder="Buscar instalaciones..." 
                               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <select id="filterCliente" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Todos los clientes</option>
                        </select>
                        <button id="refreshInstalacionesBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh"></i> Actualizar
                        </button>
                    </div>

                    <!-- Tabla de instalaciones -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="instalacionesTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargan dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel de Técnicos -->
        <div id="tecnicosPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Técnicos</h2>
                    <button id="addTecnicoBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nuevo Técnico
                    </button>
                </div>
                
                <div class="p-6">
                    <!-- Filtros -->
                    <div class="mb-4 flex flex-wrap gap-4">
                        <input type="text" id="searchTecnicos" placeholder="Buscar técnicos..." 
                               class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <button id="refreshTecnicosBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh"></i> Actualizar
                        </button>
                    </div>

                    <!-- Tabla de técnicos -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tecnicosTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargan dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel de Empresa -->
        <div id="empresaPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Empresa</h2>
                    <div class="flex space-x-2">
                        <button id="addEmpresaBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                            <i class="fas fa-plus mr-2"></i>Añadir Datos
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table id="empresaTable" class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="empresaTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargan dinámicamente aquí -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel de Certificados -->
        <div id="certificadosPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Certificados</h2>
                    <div class="flex gap-2">
                        <select id="statusFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>
                        <button id="refreshCertificadosBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh"></i> Actualizar
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnico</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="certificadosTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargan dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para CRUD operations -->
    <div id="modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 id="modalTitle" class="text-lg font-semibold">Formulario</h3>
                <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="modalContent" class="space-y-4">
                <!-- El contenido se carga dinámicamente -->
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/data-service.js"></script>
    <script src="js/crud-system.js"></script>
    <script>
        // Verificación adicional client-side
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const response = await fetch('auth-check.php');
                const data = await response.json();
                
                if (!data.authenticated || data.user.rol !== 'admin') {
                    alert('❌ Acceso denegado: Esta página es solo para administradores');
                    window.location.href = 'user-landing.php';
                    return;
                }
                
                console.log('✅ Acceso autorizado para admin:', data.user.nombre);
            } catch (error) {
                console.error('Error verificando permisos:', error);
                window.location.href = 'login.html';
            }
        });
    </script>
</body>
</html>

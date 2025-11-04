<?php
session_start();

// Verificar que el usuario esté logueado y sea admin
if (!isset($_SESSION['user_id']) || $_SESSION['rol'] !== 'admin') {
    header('Location: login.html');
    exit;
}

require_once 'api/models.php';

// Manejar operaciones CRUD
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $action = $_POST['action'] ?? '';
    $type = $_POST['type'] ?? '';
    $id = $_POST['id'] ?? '';
    
    try {
        switch ($action) {
            case 'update':
                if ($type === 'cliente') {
                    $cliente = new Cliente();
                    $data = [
                        'nombre' => $_POST['nombre'] ?? '',
                        'rut' => $_POST['rut'] ?? '',
                        'contacto' => $_POST['contacto'] ?? '',
                        'telefono' => $_POST['telefono'] ?? '',
                        'email' => $_POST['email'] ?? ''
                    ];
                    $result = $cliente->update($id, $data);
                    echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente']);
                } elseif ($type === 'tecnico') {
                    $tecnico = new Tecnico();
                    $data = [
                        'nombre' => $_POST['nombre'] ?? '',
                        'especialidad' => $_POST['especialidad'] ?? '',
                        'telefono' => $_POST['telefono'] ?? '',
                        'email' => $_POST['email'] ?? ''
                    ];
                    $result = $tecnico->update($id, $data);
                    echo json_encode(['success' => true, 'message' => 'Técnico actualizado correctamente']);
                }
                break;
                
            case 'create':
                if ($type === 'cliente') {
                    $cliente = new Cliente();
                    $data = [
                        'nombre' => $_POST['nombre'] ?? '',
                        'rut' => $_POST['rut'] ?? '',
                        'contacto' => $_POST['contacto'] ?? '',
                        'telefono' => $_POST['telefono'] ?? '',
                        'email' => $_POST['email'] ?? '',
                        'activo' => 1
                    ];
                    $result = $cliente->create($data);
                    echo json_encode(['success' => true, 'message' => 'Cliente creado correctamente']);
                }
                break;
                
            case 'delete':
                if ($type === 'cliente') {
                    $cliente = new Cliente();
                    $result = $cliente->update($id, ['activo' => 0]);
                    echo json_encode(['success' => true, 'message' => 'Cliente eliminado correctamente']);
                }
                break;
                
            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// Obtener datos para mostrar
$cliente = new Cliente();
$tecnico = new Tecnico();

$clientes = $cliente->getAll();
$tecnicos = $tecnico->getAll();

$admin_name = $_SESSION['nombre'] ?? $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRUD Simple - Gestión de Datos</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
        <div class="flex items-center">
            <i class="fas fa-shield-alt mr-2"></i>
            <span><strong>Área Admin:</strong> <?= htmlspecialchars($admin_name) ?> (<?= htmlspecialchars($_SESSION['rol']) ?>)</span>
            <a href="logout.php" class="ml-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Salir</a>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
            <i class="fas fa-database mr-3 text-blue-600"></i>CRUD Simple - Gestión de Datos
        </h1>
        
        <!-- Tabs -->
        <div class="mb-8">
            <div class="flex justify-center border-b border-gray-200">
                <button onclick="showTab('clientes')" id="clientesTab" class="tab-button active px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-semibold">
                    <i class="fas fa-users mr-2"></i>Clientes
                </button>
                <button onclick="showTab('tecnicos')" id="tecnicosTab" class="tab-button px-6 py-3 border-b-2 border-transparent text-gray-500 font-semibold hover:text-gray-700">
                    <i class="fas fa-wrench mr-2"></i>Técnicos
                </button>
            </div>
        </div>

        <!-- Panel Clientes -->
        <div id="clientesPanel" class="tab-panel">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
                    <button onclick="showCreateForm('cliente')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                        <i class="fas fa-plus mr-2"></i>Nuevo Cliente
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <?php foreach ($clientes as $cliente): ?>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><?= htmlspecialchars($cliente['nombre']) ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($cliente['rut'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($cliente['contacto'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($cliente['telefono'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($cliente['email'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="editClient(<?= $cliente['id'] ?>, '<?= addslashes($cliente['nombre']) ?>', '<?= addslashes($cliente['rut'] ?? '') ?>', '<?= addslashes($cliente['contacto'] ?? '') ?>', '<?= addslashes($cliente['telefono'] ?? '') ?>', '<?= addslashes($cliente['email'] ?? '') ?>')" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button onclick="deleteItem('cliente', <?= $cliente['id'] ?>)" class="text-red-600 hover:text-red-900">
                                            <i class="fas fa-trash"></i> Eliminar
                                        </button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel Técnicos -->
        <div id="tecnicosPanel" class="tab-panel hidden">
            <div class="bg-white rounded-lg shadow-sm">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Técnicos</h2>
                    <button onclick="showCreateForm('tecnico')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">
                        <i class="fas fa-plus mr-2"></i>Nuevo Técnico
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-white">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <?php foreach ($tecnicos as $tecnico): ?>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><?= htmlspecialchars($tecnico['nombre']) ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($tecnico['especialidad'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($tecnico['telefono'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><?= htmlspecialchars($tecnico['email'] ?? '') ?></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="editTech(<?= $tecnico['id'] ?>, '<?= addslashes($tecnico['nombre']) ?>', '<?= addslashes($tecnico['especialidad'] ?? '') ?>', '<?= addslashes($tecnico['telefono'] ?? '') ?>', '<?= addslashes($tecnico['email'] ?? '') ?>')" class="text-blue-600 hover:text-blue-900 mr-3">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button onclick="deleteItem('tecnico', <?= $tecnico['id'] ?>)" class="text-red-600 hover:text-red-900">
                                            <i class="fas fa-trash"></i> Eliminar
                                        </button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div id="modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 id="modalTitle" class="text-lg font-medium">Formulario</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="crudForm" onsubmit="submitForm(event)">
                    <input type="hidden" id="itemId" name="id">
                    <input type="hidden" id="itemType" name="type">
                    <input type="hidden" id="formAction" name="action">
                    
                    <div id="formFields"></div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Funciones básicas del CRUD
        function showTab(tabName) {
            // Ocultar todos los paneles
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Mostrar panel activo
            document.getElementById(tabName + 'Panel').classList.remove('hidden');
            document.getElementById(tabName + 'Tab').classList.add('active', 'border-blue-500', 'text-blue-600');
            document.getElementById(tabName + 'Tab').classList.remove('border-transparent', 'text-gray-500');
        }

        function showCreateForm(type) {
            document.getElementById('modalTitle').textContent = 'Crear ' + (type === 'cliente' ? 'Cliente' : 'Técnico');
            document.getElementById('itemId').value = '';
            document.getElementById('itemType').value = type;
            document.getElementById('formAction').value = 'create';
            
            const fields = type === 'cliente' ? 
                `<div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" name="nombre" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                        <input type="text" name="rut" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                        <input type="text" name="contacto" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" name="telefono" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>` :
                `<div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" name="nombre" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                        <input type="text" name="especialidad" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" name="telefono" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>`;
            
            document.getElementById('formFields').innerHTML = fields;
            document.getElementById('modal').classList.remove('hidden');
            document.getElementById('modal').classList.add('flex');
        }

        function editClient(id, nombre, rut, contacto, telefono, email) {
            document.getElementById('modalTitle').textContent = 'Editar Cliente';
            document.getElementById('itemId').value = id;
            document.getElementById('itemType').value = 'cliente';
            document.getElementById('formAction').value = 'update';
            
            document.getElementById('formFields').innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" name="nombre" value="${nombre}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                        <input type="text" name="rut" value="${rut}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                        <input type="text" name="contacto" value="${contacto}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" name="telefono" value="${telefono}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value="${email}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>`;
            
            document.getElementById('modal').classList.remove('hidden');
            document.getElementById('modal').classList.add('flex');
        }

        function editTech(id, nombre, especialidad, telefono, email) {
            document.getElementById('modalTitle').textContent = 'Editar Técnico';
            document.getElementById('itemId').value = id;
            document.getElementById('itemType').value = 'tecnico';
            document.getElementById('formAction').value = 'update';
            
            document.getElementById('formFields').innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" name="nombre" value="${nombre}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                        <input type="text" name="especialidad" value="${especialidad}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" name="telefono" value="${telefono}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value="${email}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>`;
            
            document.getElementById('modal').classList.remove('hidden');
            document.getElementById('modal').classList.add('flex');
        }

        function closeModal() {
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('modal').classList.remove('flex');
        }

        async function submitForm(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            
            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(result.message);
                    window.location.reload();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error de conexión: ' + error.message);
            }
        }

        function deleteItem(type, id) {
            if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
                const formData = new FormData();
                formData.append('action', 'delete');
                formData.append('type', type);
                formData.append('id', id);
                
                fetch(window.location.href, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert(result.message);
                        window.location.reload();
                    } else {
                        alert('Error: ' + result.message);
                    }
                })
                .catch(error => {
                    alert('Error de conexión: ' + error.message);
                });
            }
        }
    </script>
</body>
</html>

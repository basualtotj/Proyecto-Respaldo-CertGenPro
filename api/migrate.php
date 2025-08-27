<?php
// ============================================
// SCRIPT DE MIGRACIÓN JSON → MySQL
// Ejecutar UNA SOLA VEZ al subir a producción
// ============================================

require_once 'models.php';

header('Content-Type: application/json; charset=utf-8');

// Solo permitir en desarrollo o con parámetro especial
$allowMigration = isset($_GET['migrate']) && $_GET['migrate'] === 'confirm';

if (!$allowMigration) {
    echo json_encode([
        'error' => 'Para ejecutar la migración, usa: ?migrate=confirm',
        'warning' => 'SOLO ejecutar UNA VEZ al subir a producción'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Verificar conexión a la BD
    $db = Database::getInstance();
    echo "✅ Conexión a BD establecida\n";
    
    // Leer archivo JSON
    $jsonPath = '../data/database.json';
    if (!file_exists($jsonPath)) {
        throw new Exception("Archivo database.json no encontrado");
    }
    
    $jsonData = json_decode(file_get_contents($jsonPath), true);
    if (!$jsonData) {
        throw new Exception("Error leyendo archivo JSON");
    }
    
    echo "✅ Archivo JSON leído correctamente\n";
    
    $results = [
        'clientes_migrados' => 0,
        'instalaciones_migradas' => 0,
        'tecnicos_migrados' => 0,
        'configuraciones_migradas' => 0,
        'checklists_migrados' => 0,
        'errores' => []
    ];
    
    // Iniciar transacción
    $db->beginTransaction();
    
    // ============================================
    // MIGRAR TÉCNICOS PRIMERO
    // ============================================
    echo "📋 Migrando técnicos...\n";
    $tecnicoModel = new Tecnico();
    
    if (isset($jsonData['tecnicos'])) {
        foreach ($jsonData['tecnicos'] as $tecnico) {
            try {
                // Verificar si ya existe (por nombre)
                $existing = $tecnicoModel->findAll(['nombre' => $tecnico['nombre']]);
                if (empty($existing)) {
                    $tecnicoModel->create([
                        'nombre' => $tecnico['nombre'],
                        'especialidad' => $tecnico['especialidad'],
                        'email' => $tecnico['email'] ?? null,
                        'telefono' => $tecnico['telefono'] ?? null,
                        'certificaciones' => isset($tecnico['certificaciones']) ? 
                            (is_array($tecnico['certificaciones']) ? 
                                implode(', ', $tecnico['certificaciones']) : 
                                $tecnico['certificaciones']) : null
                    ]);
                    $results['tecnicos_migrados']++;
                    echo "  ✓ Técnico: {$tecnico['nombre']}\n";
                } else {
                    echo "  - Técnico ya existe: {$tecnico['nombre']}\n";
                }
            } catch (Exception $e) {
                $results['errores'][] = "Error migrando técnico {$tecnico['nombre']}: " . $e->getMessage();
                echo "  ❌ Error: {$tecnico['nombre']} - {$e->getMessage()}\n";
            }
        }
    }
    
    // ============================================
    // MIGRAR CLIENTES E INSTALACIONES
    // ============================================
    echo "🏢 Migrando clientes e instalaciones...\n";
    $clienteModel = new Cliente();
    $instalacionModel = new Instalacion();
    
    if (isset($jsonData['clientes'])) {
        foreach ($jsonData['clientes'] as $cliente) {
            try {
                // Verificar si el cliente ya existe (por RUT)
                $existingCliente = $clienteModel->findByRut($cliente['rut']);
                
                $clienteId = null;
                if (!$existingCliente) {
                    // Crear cliente
                    $clienteId = $clienteModel->create([
                        'nombre' => $cliente['nombre'],
                        'rut' => $cliente['rut'],
                        'contacto' => $cliente['contacto'] ?? null,
                        'telefono' => $cliente['telefono'] ?? null,
                        'email' => $cliente['email'] ?? null,
                        'direccion' => $cliente['direccion'] ?? null
                    ]);
                    $results['clientes_migrados']++;
                    echo "  ✓ Cliente: {$cliente['nombre']}\n";
                } else {
                    $clienteId = $existingCliente['id'];
                    echo "  - Cliente ya existe: {$cliente['nombre']}\n";
                }
                
                // Migrar instalaciones del cliente
                if (isset($cliente['instalaciones']) && is_array($cliente['instalaciones'])) {
                    foreach ($cliente['instalaciones'] as $instalacion) {
                        try {
                            // Verificar si la instalación ya existe
                            $existingInstalacion = $instalacionModel->findAll([
                                'cliente_id' => $clienteId,
                                'nombre' => $instalacion['nombre']
                            ]);
                            
                            if (empty($existingInstalacion)) {
                                $instalacionModel->create([
                                    'cliente_id' => $clienteId,
                                    'nombre' => $instalacion['nombre'],
                                    'direccion' => $instalacion['direccion'],
                                    'contacto_local' => $instalacion['contacto_local'] ?? null,
                                    'telefono_local' => $instalacion['telefono_local'] ?? null,
                                    'tipo_sistema' => $instalacion['tipo_sistema'] ?? 'Mixto',
                                    'descripcion' => $instalacion['descripcion'] ?? null
                                ]);
                                $results['instalaciones_migradas']++;
                                echo "    ✓ Instalación: {$instalacion['nombre']}\n";
                            } else {
                                echo "    - Instalación ya existe: {$instalacion['nombre']}\n";
                            }
                        } catch (Exception $e) {
                            $results['errores'][] = "Error migrando instalación {$instalacion['nombre']}: " . $e->getMessage();
                            echo "    ❌ Error instalación: {$instalacion['nombre']} - {$e->getMessage()}\n";
                        }
                    }
                }
                
            } catch (Exception $e) {
                $results['errores'][] = "Error migrando cliente {$cliente['nombre']}: " . $e->getMessage();
                echo "  ❌ Error cliente: {$cliente['nombre']} - {$e->getMessage()}\n";
            }
        }
    }
    
    // ============================================
    // MIGRAR CONFIGURACIÓN
    // ============================================
    echo "⚙️ Migrando configuración...\n";
    $configModel = new Configuracion();
    
    if (isset($jsonData['configuracion'])) {
        foreach ($jsonData['configuracion'] as $clave => $valor) {
            try {
                // Determinar tipo de dato
                $tipo = 'string';
                if (is_numeric($valor)) {
                    $tipo = 'number';
                } elseif (is_bool($valor)) {
                    $tipo = 'boolean';
                } elseif (is_array($valor)) {
                    $tipo = 'json';
                }
                
                $configModel->setValue($clave, $valor, $tipo);
                $results['configuraciones_migradas']++;
                echo "  ✓ Config: {$clave}\n";
                
            } catch (Exception $e) {
                $results['errores'][] = "Error migrando configuración {$clave}: " . $e->getMessage();
                echo "  ❌ Error config: {$clave} - {$e->getMessage()}\n";
            }
        }
    }
    
    // ============================================
    // MIGRAR CHECKLISTS
    // ============================================
    echo "📋 Migrando checklists...\n";
    $checklistModel = new ChecklistTemplate();
    
    if (isset($jsonData['checklists'])) {
        foreach ($jsonData['checklists'] as $tipo => $checklist) {
            try {
                // Verificar si ya existe
                $existing = $checklistModel->findByTipo($tipo);
                
                if (empty($existing)) {
                    $checklistModel->create([
                        'tipo' => $tipo,
                        'nombre' => $checklist['nombre'],
                        'descripcion' => $checklist['descripcion'] ?? "Checklist para $tipo",
                        'items' => json_encode($checklist['items'])
                    ]);
                    $results['checklists_migrados']++;
                    echo "  ✓ Checklist: {$tipo}\n";
                } else {
                    echo "  - Checklist ya existe: {$tipo}\n";
                }
                
            } catch (Exception $e) {
                $results['errores'][] = "Error migrando checklist {$tipo}: " . $e->getMessage();
                echo "  ❌ Error checklist: {$tipo} - {$e->getMessage()}\n";
            }
        }
    }
    
    // ============================================
    // MIGRAR CONTADORES (si existen)
    // ============================================
    echo "🔢 Configurando contadores...\n";
    
    if (isset($jsonData['contadores'])) {
        foreach ($jsonData['contadores'] as $tipo => $contador) {
            try {
                $db->query(
                    "INSERT INTO contadores (tipo, prefijo, siguiente, formato) VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE siguiente = GREATEST(siguiente, ?)",
                    [
                        $tipo,
                        $contador['prefijo'],
                        $contador['siguiente'],
                        $contador['formato'] ?? '{PREFIJO}-{CONTADOR}-{MES}-{ANIO}',
                        $contador['siguiente']
                    ]
                );
                echo "  ✓ Contador: {$tipo}\n";
            } catch (Exception $e) {
                $results['errores'][] = "Error configurando contador {$tipo}: " . $e->getMessage();
                echo "  ❌ Error contador: {$tipo} - {$e->getMessage()}\n";
            }
        }
    }
    
    // Confirmar transacción
    $db->commit();
    
    echo "\n🎉 MIGRACIÓN COMPLETADA\n";
    echo "========================\n";
    echo "Clientes migrados: {$results['clientes_migrados']}\n";
    echo "Instalaciones migradas: {$results['instalaciones_migradas']}\n";
    echo "Técnicos migrados: {$results['tecnicos_migrados']}\n";
    echo "Configuraciones migradas: {$results['configuraciones_migradas']}\n";
    echo "Checklists migrados: {$results['checklists_migrados']}\n";
    echo "Errores: " . count($results['errores']) . "\n";
    
    if (!empty($results['errores'])) {
        echo "\n⚠️ ERRORES ENCONTRADOS:\n";
        foreach ($results['errores'] as $error) {
            echo "- $error\n";
        }
    }
    
    // Respuesta JSON para llamadas programáticas
    if (isset($_GET['format']) && $_GET['format'] === 'json') {
        header('Content-Type: application/json');
        echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollback();
    }
    
    echo "\n❌ ERROR CRÍTICO: " . $e->getMessage() . "\n";
    echo "La migración ha sido revertida.\n";
    
    if (isset($_GET['format']) && $_GET['format'] === 'json') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => $e->getMessage(),
            'message' => 'Migración fallida y revertida'
        ], JSON_UNESCAPED_UNICODE);
    }
}

// ============================================
// INSTRUCCIONES DE USO
// ============================================
/*

CÓMO USAR ESTE SCRIPT DE MIGRACIÓN:

1. ANTES DE SUBIR A PRODUCCIÓN:
   - Verificar que database.json tenga todos los datos
   - Hacer backup del archivo JSON

2. AL SUBIR A CPANEL:
   - Subir todos los archivos incluyendo este (migrate.php)
   - Configurar la base de datos MySQL
   - Importar el esquema (schema.sql)

3. EJECUTAR LA MIGRACIÓN:
   - URL: https://tudominio.com/api/migrate.php?migrate=confirm
   - O con formato JSON: ?migrate=confirm&format=json

4. VERIFICAR RESULTADOS:
   - Revisar que los datos se migraron correctamente
   - Probar la aplicación en modo API
   - Verificar que los certificados se generan bien

5. DESPUÉS DE LA MIGRACIÓN:
   - ELIMINAR este archivo migrate.php del servidor
   - Cambiar DataService a modo 'api'
   - Hacer pruebas finales

6. SOLUCIÓN DE PROBLEMAS:
   - Si algo falla, revisar los errores mostrados
   - La migración usa transacciones (se revierte si falla)
   - Puedes ejecutarla múltiples veces (evita duplicados)

IMPORTANTE:
- Solo ejecutar UNA VEZ por seguridad
- Eliminar el archivo después de usar
- Hacer backup antes de migrar

*/
?>

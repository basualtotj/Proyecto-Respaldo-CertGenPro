<?php
// ============================================
// API ENDPOINTS PARA SISTEMA DE CERTIFICADOS
// Archivo principal que maneja todas las rutas
// ============================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
// Evitar caché para respuestas JSON
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'models.php';

// Auto-ensure required schema bits exist (idempotent and safe)
try {
    $db = Database::getInstance();
    // Add instalaciones.meta_equipos if missing
    $db->ensureColumn('instalaciones', 'meta_equipos', 'JSON NULL AFTER tipo_sistema');
} catch (Exception $e) {
    // Non-fatal; continue serving API
}

// ============================================
// RESPONSE HELPER CLASS
// ============================================
class ApiResponse {
    public static function success($data = null, $message = 'Éxito', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    public static function error($message = 'Error', $code = 400, $details = null) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'details' => $details,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    public static function notFound($resource = 'Recurso') {
        self::error("$resource no encontrado", 404);
    }
    
    public static function validation($errors) {
        self::error('Errores de validación', 422, $errors);
    }
}

// ============================================
// INPUT VALIDATION HELPER
// ============================================
class Validator {
    public static function required($value, $field) {
        if (empty($value)) {
            return "El campo $field es requerido";
        }
        return null;
    }
    
    public static function email($value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "El email no es válido";
        }
        return null;
    }
    
    public static function rut($value) {
        // Validación básica de RUT chileno
        $rut = preg_replace('/[^0-9kK]/', '', $value);
        if (strlen($rut) < 8) {
            return "El RUT no es válido";
        }
        return null;
    }
    
    public static function date($value) {
        $d = DateTime::createFromFormat('Y-m-d', $value);
        if (!$d || $d->format('Y-m-d') !== $value) {
            return "La fecha debe estar en formato YYYY-MM-DD";
        }
        return null;
    }
    
    public static function validateInput($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            
            foreach ($fieldRules as $rule => $ruleValue) {
                if ($rule === 'required' && $ruleValue && empty($value)) {
                    $errors[$field] = "El campo $field es requerido";
                    break;
                } elseif (!empty($value)) {
                    switch ($rule) {
                        case 'email':
                            $error = self::email($value);
                            break;
                        case 'rut':
                            $error = self::rut($value);
                            break;
                        case 'date':
                            $error = self::date($value);
                            break;
                        case 'max_length':
                            if (strlen($value) > $ruleValue) {
                                $error = "El campo $field no puede tener más de $ruleValue caracteres";
                            }
                            break;
                        case 'min_length':
                            if (strlen($value) < $ruleValue) {
                                $error = "El campo $field debe tener al menos $ruleValue caracteres";
                            }
                            break;
                        default:
                            $error = null;
                    }
                    
                    if ($error) {
                        $errors[$field] = $error;
                        break;
                    }
                }
            }
        }
        
        return $errors;
    }
}

// ============================================
// ROUTER CLASS
// ============================================
class Router {
    private $routes = [];
    
    public function addRoute($method, $path, $handler) {
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'handler' => $handler
        ];
    }
    
    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }
    
    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }
    
    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }
    
    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    public function patch($path, $handler) {
        $this->addRoute('PATCH', $path, $handler);
    }
    
    public function dispatch($requestUri, $requestMethod) {
        $path = parse_url($requestUri, PHP_URL_PATH);
        $method = strtoupper($requestMethod);
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                $params = $this->extractParams($route['path'], $path);
                call_user_func($route['handler'], $params);
                return;
            }
        }
        
        ApiResponse::notFound('Endpoint');
    }
    
    private function matchPath($routePath, $requestPath) {
        $routePattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $routePattern = '#^' . $routePattern . '$#';
        return preg_match($routePattern, $requestPath);
    }
    
    private function extractParams($routePath, $requestPath) {
        preg_match_all('/\{([^}]+)\}/', $routePath, $matches);
        $paramNames = $matches[1];
        
        $routePattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $routePattern = '#^' . $routePattern . '$#';
        
        preg_match($routePattern, $requestPath, $paramValues);
        array_shift($paramValues); // Remove full match
        
        return array_combine($paramNames, $paramValues);
    }
}

// ============================================
// CONTROLADORES
// ============================================

// Helper para obtener input JSON
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// ============================================
// CLIENTES CONTROLLER
// ============================================
function getClientes($params) {
    try {
        $cliente = new Cliente();
        
        if (isset($params['id'])) {
            $data = $cliente->getWithInstalaciones($params['id']);
            if (!$data) {
                ApiResponse::notFound('Cliente');
            }
        } else {
            $data = $cliente->getWithInstalaciones();
        }
        
        ApiResponse::success($data, 'Clientes obtenidos correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener clientes: ' . $e->getMessage(), 500);
    }
}

function createCliente($params) {
    try {
        $data = getJsonInput();
        
        $rules = [
            'nombre' => ['required' => true, 'max_length' => 255],
            'rut' => ['required' => true, 'rut' => true, 'max_length' => 20],
            'contacto' => ['max_length' => 255],
            'telefono' => ['max_length' => 20],
            'email' => ['email' => true, 'max_length' => 255],
            'direccion' => ['max_length' => 500]
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            ApiResponse::validation($errors);
        }
        
        $cliente = new Cliente();
        
        // Verificar RUT único
        if ($cliente->findByRut($data['rut'])) {
            ApiResponse::error('Ya existe un cliente con ese RUT', 409);
        }
        
        $id = $cliente->create($data);
        $newCliente = $cliente->getWithInstalaciones($id);
        
        ApiResponse::success($newCliente, 'Cliente creado correctamente', 201);
    } catch (Exception $e) {
        ApiResponse::error('Error al crear cliente: ' . $e->getMessage(), 500);
    }
}

function updateCliente($params) {
    try {
        $id = $params['id'];
        $data = getJsonInput();
        
        $cliente = new Cliente();
        
        if (!$cliente->findById($id)) {
            ApiResponse::notFound('Cliente');
        }
        
        // Si se está cambiando el RUT, verificar que sea único
        if (isset($data['rut'])) {
            $existing = $cliente->findByRut($data['rut']);
            if ($existing && $existing['id'] != $id) {
                ApiResponse::error('Ya existe un cliente con ese RUT', 409);
            }
        }
        
        $cliente->update($id, $data);
        $updatedCliente = $cliente->getWithInstalaciones($id);
        
        ApiResponse::success($updatedCliente, 'Cliente actualizado correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al actualizar cliente: ' . $e->getMessage(), 500);
    }
}

function deleteCliente($params) {
    try {
        $id = $params['id'];
        $cliente = new Cliente();
        
        if (!$cliente->findById($id)) {
            ApiResponse::notFound('Cliente');
        }
        
        // Verificar si tiene instalaciones asociadas
        $instalacion = new Instalacion();
        $instalaciones = $instalacion->findByCliente($id);
        if (!empty($instalaciones)) {
            ApiResponse::error('No se puede eliminar el cliente porque tiene instalaciones asociadas', 409);
        }
        
        $cliente->delete($id);
        
        ApiResponse::success(null, 'Cliente eliminado correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al eliminar cliente: ' . $e->getMessage(), 500);
    }
}

// ============================================
// INSTALACIONES CONTROLLER  
// ============================================
function getInstalaciones($params) {
    try {
        $instalacion = new Instalacion();
        
        if (isset($params['cliente_id'])) {
            $data = $instalacion->findByCliente($params['cliente_id']);
        } else if (isset($params['id'])) {
            $data = $instalacion->findById($params['id']);
            if (!$data) {
                ApiResponse::notFound('Instalación');
            }
        } else {
            $data = $instalacion->findAll(['activo' => 1], 'nombre');
        }
        // Decodificar meta_equipos si existe como JSON
        if (is_array($data)) {
            foreach ($data as &$row) {
                if (isset($row['meta_equipos']) && is_string($row['meta_equipos']) && $row['meta_equipos'] !== '') {
                    $decoded = json_decode($row['meta_equipos'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $row['meta_equipos'] = $decoded;
                    }
                }
            }
            unset($row);
        } else if (is_array($data) && isset($data['meta_equipos'])) {
            if (is_string($data['meta_equipos']) && $data['meta_equipos'] !== '') {
                $decoded = json_decode($data['meta_equipos'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $data['meta_equipos'] = $decoded;
                }
            }
        }

        ApiResponse::success($data, 'Instalaciones obtenidas correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener instalaciones: ' . $e->getMessage(), 500);
    }
}

function createInstalacion($params) {
    try {
        $data = getJsonInput();
        
        $rules = [
            'cliente_id' => ['required' => true],
            'nombre' => ['required' => true, 'max_length' => 255],
            'direccion' => ['required' => true, 'max_length' => 500],
            'contacto_local' => ['max_length' => 255],
            'telefono_local' => ['max_length' => 20],
            'tipo_sistema' => ['max_length' => 20]
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            ApiResponse::validation($errors);
        }
        
        // Verificar que el cliente existe
        $cliente = new Cliente();
        if (!$cliente->findById($data['cliente_id'])) {
            ApiResponse::error('El cliente especificado no existe', 400);
        }
        
        // Construir meta_equipos desde campos planos si vienen
        $equipKeys = ['camaras_ip','camaras_analogicas','nvr','dvr','monitores','joystick'];
        $meta = [];
        foreach ($equipKeys as $k) {
            if (isset($data[$k]) && $data[$k] !== '') {
                $meta[$k] = $data[$k];
                unset($data[$k]); // evitar columna desconocida
            }
        }
        if (isset($data['meta_equipos'])) {
            // Permitir enviar meta_equipos como objeto/JSON string
            if (is_array($data['meta_equipos'])) {
                $meta = array_merge($meta, $data['meta_equipos']);
            } elseif (is_string($data['meta_equipos'])) {
                $decoded = json_decode($data['meta_equipos'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $meta = array_merge($meta, $decoded);
                }
            }
            unset($data['meta_equipos']);
        }

        // Si no hay datos de equipos, guardar como NULL o JSON vacío

        if (!empty($meta)) {
            $data['meta_equipos'] = json_encode($meta);
        } else {
            $data['meta_equipos'] = null; // o json_encode([]) si prefieres JSON vacío
        }

        // Eliminar todos los campos planos de equipos para evitar error de columnas inexistentes
        $equipKeys = ['camaras_ip','camaras_analogicas','nvr','dvr','monitores','joystick'];
        foreach ($equipKeys as $k) {
            if (isset($data[$k])) {
                unset($data[$k]);
            }
        }

        // Eliminar todos los campos planos de equipos para evitar error de columnas inexistentes
        $equipKeys = ['camaras_ip','camaras_analogicas','nvr','dvr','monitores','joystick'];
        foreach ($equipKeys as $k) {
            if (isset($data[$k])) {
                unset($data[$k]);
            }
        }

        $instalacion = new Instalacion();
        $id = $instalacion->create($data);
        $newInstalacion = $instalacion->findById($id);
        
        ApiResponse::success($newInstalacion, 'Instalación creada correctamente', 201);
    } catch (Exception $e) {
        ApiResponse::error('Error al crear instalación: ' . $e->getMessage(), 500);
    }
}

function updateInstalacion($params) {
    try {
        $id = $params['id'];
        $data = getJsonInput();
        
        $instalacion = new Instalacion();
        
        if (!$instalacion->findById($id)) {
            ApiResponse::notFound('Instalación');
        }
        
        // Verificar que el cliente existe si se está cambiando
        if (isset($data['cliente_id'])) {
            $cliente = new Cliente();
            if (!$cliente->findById($data['cliente_id'])) {
                ApiResponse::error('El cliente especificado no existe', 400);
            }
        }
        // Construir/actualizar meta_equipos desde campos planos
        $equipKeys = ['camaras_ip','camaras_analogicas','nvr','dvr','monitores','joystick'];
        $meta = [];
        foreach ($equipKeys as $k) {
            if (array_key_exists($k, $data)) {
                $meta[$k] = $data[$k];
                unset($data[$k]);
            }
        }
        if (isset($data['meta_equipos'])) {
            if (is_array($data['meta_equipos'])) {
                $meta = array_merge($meta, $data['meta_equipos']);
            } elseif (is_string($data['meta_equipos'])) {
                $decoded = json_decode($data['meta_equipos'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $meta = array_merge($meta, $decoded);
                }
            }
            unset($data['meta_equipos']);
        }
        if (!empty($meta)) {
            $data['meta_equipos'] = json_encode($meta);
        }

        $instalacion->update($id, $data);
        $updatedInstalacion = $instalacion->findById($id);
        
        ApiResponse::success($updatedInstalacion, 'Instalación actualizada correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al actualizar instalación: ' . $e->getMessage(), 500);
    }
}

function deleteInstalacion($params) {
    try {
        $id = $params['id'];
        $instalacion = new Instalacion();
        if (!$instalacion->findById($id)) {
            ApiResponse::notFound('Instalación');
        }
        // Eliminar certificados asociados antes de eliminar la instalación
        $certificado = new Certificado();
        $certificados = $certificado->findAll(['instalacion_id' => $id]);
        foreach ($certificados as $cert) {
            $certificado->delete($cert['id']);
        }
        $instalacion->delete($id);
        ApiResponse::success(null, 'Instalación eliminada correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al eliminar instalación: ' . $e->getMessage(), 500);
    }
}

// ============================================
// TÉCNICOS CONTROLLER
// ============================================
function getTecnicos($params) {
    try {
        $tecnico = new Tecnico();
        
        if (isset($params['id'])) {
            $data = $tecnico->findById($params['id']);
            if (!$data) {
                ApiResponse::notFound('Técnico');
            }
        } else {
            // Devolver TODOS los técnicos para que el CRUD muestre activos e inactivos
            $data = $tecnico->findAll();
        }
        
        ApiResponse::success($data, 'Técnicos obtenidos correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener técnicos: ' . $e->getMessage(), 500);
    }
}

function createTecnico() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            ApiResponse::error('Datos inválidos', 400);
        }
        
        $tecnico = new Tecnico();
        $id = $tecnico->create($data);
        if ($id) {
            $newTecnico = $tecnico->findById($id);
            ApiResponse::success($newTecnico, 'Técnico creado correctamente', 201);
        } else {
            ApiResponse::error('Error al crear técnico', 400);
        }
    } catch (Exception $e) {
        ApiResponse::error('Error al crear técnico: ' . $e->getMessage(), 500);
    }
}

function updateTecnico($params) {
    try {
        if (!isset($params['id'])) {
            ApiResponse::error('ID requerido', 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            ApiResponse::error('Datos inválidos', 400);
        }
        
        $tecnico = new Tecnico();
        $existing = $tecnico->findById($params['id']);
        if (!$existing) {
            ApiResponse::notFound('Técnico');
        }

        $result = $tecnico->update($params['id'], $data);

        $updated = $tecnico->findById($params['id']);
        ApiResponse::success($updated, $result > 0 ? 'Técnico actualizado correctamente' : 'Sin cambios, técnico ya estaba actualizado');
    } catch (Exception $e) {
        ApiResponse::error('Error al actualizar técnico: ' . $e->getMessage(), 500);
    }
}

function deleteTecnico($params) {
    try {
        if (!isset($params['id'])) {
            ApiResponse::error('ID requerido', 400);
        }
        
        $tecnico = new Tecnico();
        $result = $tecnico->delete($params['id']);
        
        if ($result) {
            ApiResponse::success(null, 'Técnico eliminado correctamente');
        } else {
            ApiResponse::error('Error al eliminar técnico', 400);
        }
    } catch (Exception $e) {
        ApiResponse::error('Error al eliminar técnico: ' . $e->getMessage(), 500);
    }
}

// ============================================
// EMPRESA CONTROLLER
// ============================================
function getEmpresa($params) {
    try {
        $empresa = new Empresa();
        
        if (isset($params['id'])) {
            $data = $empresa->findById($params['id']);
            if (!$data) {
                ApiResponse::notFound('Empresa');
            }
        } else {
            // Para empresa, obtenemos todos los registros ya que normalmente hay uno solo
            $data = $empresa->findAll();
        }
        
        ApiResponse::success($data, 'Datos de empresa obtenidos correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener datos de empresa: ' . $e->getMessage(), 500);
    }
}

function createEmpresa() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            ApiResponse::error('Datos inválidos', 400);
        }
        
        $empresa = new Empresa();
        $result = $empresa->create($data);
        
        if ($result) {
            ApiResponse::success($result, 'Datos de empresa creados correctamente', 201);
        } else {
            ApiResponse::error('Error al crear datos de empresa', 400);
        }
    } catch (Exception $e) {
        ApiResponse::error('Error al crear datos de empresa: ' . $e->getMessage(), 500);
    }
}

function updateEmpresa($params) {
    try {
        if (!isset($params['id'])) {
            ApiResponse::error('ID requerido', 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            ApiResponse::error('Datos inválidos', 400);
        }
        
        $empresa = new Empresa();
        // Verificar que exista
        $existing = $empresa->findById($params['id']);
        if (!$existing) {
            ApiResponse::notFound('Empresa');
        }

        $result = $empresa->update($params['id'], $data);

        // Para UPDATE, rowCount puede ser 0 si no hubo cambios; considerarlo éxito
        $updated = $empresa->findById($params['id']);
        ApiResponse::success($updated, $result > 0 ? 'Datos de empresa actualizados correctamente' : 'Sin cambios, datos de empresa ya estaban actualizados');
    } catch (Exception $e) {
        ApiResponse::error('Error al actualizar datos de empresa: ' . $e->getMessage(), 500);
    }
}

function deleteEmpresa($params) {
    try {
        if (!isset($params['id'])) {
            ApiResponse::error('ID requerido', 400);
        }
        
        $empresa = new Empresa();
        $result = $empresa->delete($params['id']);
        
        if ($result) {
            ApiResponse::success(null, 'Datos de empresa eliminados correctamente');
        } else {
            ApiResponse::error('Error al eliminar datos de empresa', 400);
        }
    } catch (Exception $e) {
        ApiResponse::error('Error al eliminar datos de empresa: ' . $e->getMessage(), 500);
    }
}

// ============================================
// CERTIFICADOS CONTROLLER
// ============================================
function getCertificados($params) {
    try {
        $certificado = new Certificado();
        
        if (isset($params['id'])) {
            $data = $certificado->getCompleto($params['id']);
            if (!$data) {
                ApiResponse::notFound('Certificado');
            }
        } else {
            $limit = $_GET['limit'] ?? 50;
            $offset = $_GET['offset'] ?? 0;
            $filtros = [
                'tipo' => $_GET['tipo'] ?? '',
                'cliente' => $_GET['cliente'] ?? '',
                'fecha_desde' => $_GET['fecha_desde'] ?? '',
                'fecha_hasta' => $_GET['fecha_hasta'] ?? ''
            ];
            
            $data = $certificado->getListaCompleta($limit, $offset, $filtros);
        }
        
        ApiResponse::success($data, 'Certificados obtenidos correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener certificados: ' . $e->getMessage(), 500);
    }
}

function getUltimoCertificado($params) {
    try {
        $clienteId = isset($_GET['cliente_id']) ? (int)$_GET['cliente_id'] : 0;
        $instalacionId = isset($_GET['instalacion_id']) ? (int)$_GET['instalacion_id'] : 0;
        $tipo = isset($_GET['tipo']) ? strtolower(trim($_GET['tipo'])) : '';

        if ($clienteId <= 0 || $instalacionId <= 0) {
            ApiResponse::validation(['cliente_id' => 'cliente_id requerido', 'instalacion_id' => 'instalacion_id requerido']);
        }

        $db = Database::getInstance();
        $conn = $db->getConnection();

        $baseSelect = "SELECT id, numero_certificado, tipo, cliente_id, instalacion_id, tecnico_id, fecha_mantenimiento, solicitudes_cliente, observaciones_generales, checklist_data, fecha_emision FROM certificados WHERE cliente_id = ? AND instalacion_id = ?";
    $orderClause = " ORDER BY COALESCE(fecha_emision, fecha_mantenimiento) DESC, id DESC LIMIT 1";

        // Primer intento: respetando tipo si viene válido
        $sql = $baseSelect;
        $paramsSql = [$clienteId, $instalacionId];
        $filterByTipo = in_array($tipo, ['cctv','hardware','racks']);
        if ($filterByTipo) {
            $sql .= " AND tipo = ?";
            $paramsSql[] = $tipo;
        }
        $sql .= $orderClause;

        $stmt = $conn->prepare($sql);
        $stmt->execute($paramsSql);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
            ApiResponse::notFound('Último certificado');
        }

        // Decodificar checklist_data si es JSON válido
        if (!empty($row['checklist_data'])) {
            $decoded = json_decode($row['checklist_data'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row['checklist_data'] = $decoded;
            }
        }

        ApiResponse::success($row, 'Último certificado obtenido');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener último certificado: ' . $e->getMessage(), 500);
    }
}

function createCertificado($params) {
    try {
    $data = getJsonInput();
        
        $rules = [
            'tipo' => ['required' => true],
            'cliente_id' => ['required' => true],
            'instalacion_id' => ['required' => true],
            'tecnico_id' => ['required' => true],
            'fecha_mantenimiento' => ['required' => true, 'date' => true]
        ];
        
        $errors = Validator::validateInput($data, $rules);
        if (!empty($errors)) {
            ApiResponse::validation($errors);
        }
        
        // Verificar que existen las entidades referenciadas
        $cliente = new Cliente();
        $instalacion = new Instalacion();
        $tecnico = new Tecnico();
        
        if (!$cliente->findById($data['cliente_id'])) {
            ApiResponse::error('El cliente especificado no existe', 400);
        }
        
        if (!$instalacion->findById($data['instalacion_id'])) {
            ApiResponse::error('La instalación especificada no existe', 400);
        }
        
        if (!$tecnico->findById($data['tecnico_id'])) {
            ApiResponse::error('El técnico especificado no existe', 400);
        }
        
        // Normalizar payload: mapear nombres y limpiar estructuras no soportadas
        // Observaciones
        if (isset($data['observaciones']) && !isset($data['observaciones_generales'])) {
            $data['observaciones_generales'] = $data['observaciones'];
            unset($data['observaciones']);
        }

        // Firmas: permitir que vengan anidadas en 'firmas'
        if (isset($data['firmas']) && is_array($data['firmas'])) {
            if (isset($data['firmas']['tecnico']) && is_string($data['firmas']['tecnico'])) {
                $data['firma_tecnico'] = $data['firmas']['tecnico'];
            }
            if (isset($data['firmas']['cliente']) && is_string($data['firmas']['cliente'])) {
                $data['firma_cliente'] = $data['firmas']['cliente'];
            }
            unset($data['firmas']);
        }

        // Convertir checklist_data a JSON si es array
        if (isset($data['checklist_data']) && is_array($data['checklist_data'])) {
            $data['checklist_data'] = json_encode($data['checklist_data']);
        }

        // Generar correlativo en el backend y persistir de forma atómica
        $db = Database::getInstance();
        $db->beginTransaction();
        try {
            $tipo = strtolower($data['tipo']);
            if (!in_array($tipo, ['cctv', 'hardware', 'racks'])) {
                throw new Exception('Tipo de certificado no válido');
            }

            // Prefijos por defecto
            $prefixMap = [
                'cctv' => 'CCTV',
                'hardware' => 'HW',
                'racks' => 'RK'
            ];
            $prefijo = $prefixMap[$tipo] ?? strtoupper($tipo);

            // Obtener contador actual desde Configuración (clave: contador_{tipo})
            $config = new Configuracion();
            $clave = "contador_{$tipo}";
            $contadorActual = (int)$config->getValue($clave, 100);
            // Formato: PREFIJO-<contador>-MM-YYYY
            $mes = date('m');
            $anio = date('Y');
            $numeroCert = $prefijo . '-' . $contadorActual . '-' . $mes . '-' . $anio;
            $data['numero_certificado'] = $numeroCert;

            // Insertar certificado
            $certificado = new Certificado();
            $id = $certificado->create($data);

            // Incrementar y guardar el siguiente correlativo
            $config->setValue($clave, $contadorActual + 1, 'number');

            $db->commit();

            // Devolver certificado completo
            $newCertificado = $certificado->getCompleto($id);
            if (is_array($newCertificado)) {
                // Asegurar que incluimos el numero si la vista no lo retorna
                $newCertificado['numero_certificado'] = $newCertificado['numero_certificado'] ?? $numeroCert;
                $newCertificado['id'] = $newCertificado['id'] ?? $id;
            }
            ApiResponse::success($newCertificado, 'Certificado creado correctamente', 201);
        } catch (Exception $inner) {
            $db->rollback();
            throw $inner;
        }
    } catch (Exception $e) {
        ApiResponse::error('Error al crear certificado: ' . $e->getMessage(), 500);
    }
}

// ============================================
// CONFIGURACIÓN CONTROLLER
// ============================================
function getConfiguracion($params) {
    try {
        $config = new Configuracion();
        
        if (isset($params['clave'])) {
            $data = $config->getValue($params['clave']);
            if ($data === null) {
                ApiResponse::notFound('Configuración');
            }
        } else {
            $data = $config->getAll();
        }
        
        ApiResponse::success($data, 'Configuración obtenida correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener configuración: ' . $e->getMessage(), 500);
    }
}

// ============================================
// CHECKLISTS CONTROLLER
// ============================================
function getChecklists($params) {
    try {
        $checklist = new ChecklistTemplate();
        
        if (isset($params['tipo'])) {
            $data = $checklist->findByTipo($params['tipo']);
        } else {
            $data = $checklist->findAll(['activo' => 1]);
            // Decodificar JSON
            foreach ($data as &$template) {
                $template['items'] = json_decode($template['items'], true) ?: [];
            }
        }
        
        ApiResponse::success($data, 'Checklists obtenidos correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener checklists: ' . $e->getMessage(), 500);
    }
}

// ============================================
// ESTADÍSTICAS CONTROLLER
// ============================================
function getEstadisticas($params) {
    try {
        $certificado = new Certificado();
        $data = $certificado->getEstadisticas();
        
        ApiResponse::success($data, 'Estadísticas obtenidas correctamente');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener estadísticas: ' . $e->getMessage(), 500);
    }
}

// ============================================
// CONTADORES CONTROLLER (Correlativos)
// ============================================
function getContador($params) {
    try {
        $tipo = strtolower($params['tipo'] ?? '');
        if (!in_array($tipo, ['cctv', 'hardware', 'racks'])) {
            ApiResponse::error('Tipo de contador no válido', 400);
        }
        $config = new Configuracion();
        $clave = "contador_{$tipo}";
        $valor = (int)$config->getValue($clave, 100);
        ApiResponse::success(['tipo' => $tipo, 'siguiente' => $valor], 'Contador obtenido');
    } catch (Exception $e) {
        ApiResponse::error('Error al obtener contador: ' . $e->getMessage(), 500);
    }
}

function incrementContador($params) {
    try {
        $tipo = strtolower($params['tipo'] ?? '');
        if (!in_array($tipo, ['cctv', 'hardware', 'racks'])) {
            ApiResponse::error('Tipo de contador no válido', 400);
        }
        $config = new Configuracion();
        $clave = "contador_{$tipo}";
        // Leer valor actual y sumar 1
        $actual = (int)$config->getValue($clave, 100);
        $siguiente = $actual + 1;
        $config->setValue($clave, $siguiente, 'number');
        ApiResponse::success(['tipo' => $tipo, 'siguiente' => $siguiente], 'Contador incrementado');
    } catch (Exception $e) {
        ApiResponse::error('Error al incrementar contador: ' . $e->getMessage(), 500);
    }
}

// ============================================
// ARCHIVOS PDF DE CERTIFICADOS
// ============================================
function getStorageDir() {
    $root = realpath(__DIR__ . '/..');
    $dir = $root . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'certificados';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir;
}

function uploadCertificadoPDF($params) {
    try {
        if (!isset($params['id'])) ApiResponse::error('ID requerido', 400);
        $id = (int)$params['id'];
        if ($id <= 0) ApiResponse::error('ID inválido', 400);

        $cert = new Certificado();
        $exists = $cert->findById($id);
        if (!$exists) ApiResponse::notFound('Certificado');

        $storage = getStorageDir();
        $filePath = $storage . DIRECTORY_SEPARATOR . $id . '.pdf';

        $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        $saved = false;
        if (isset($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
            $saved = move_uploaded_file($_FILES['file']['tmp_name'], $filePath);
        } else {
            // Leer cuerpo crudo (esperado application/pdf)
            $raw = file_get_contents('php://input');
            if ($raw !== false && strlen($raw) > 0) {
                $saved = (bool)file_put_contents($filePath, $raw);
            }
        }

        if (!$saved) ApiResponse::error('No se recibió archivo PDF', 400);

        ApiResponse::success(['id' => $id, 'stored' => true, 'path' => basename($filePath)], 'PDF almacenado');
    } catch (Exception $e) {
        ApiResponse::error('Error al subir PDF: ' . $e->getMessage(), 500);
    }
}

function downloadCertificadoPDF($params) {
    try {
        if (!isset($params['id'])) ApiResponse::error('ID requerido', 400);
        $id = (int)$params['id'];
        if ($id <= 0) ApiResponse::error('ID inválido', 400);

        $storage = getStorageDir();
        $filePath = $storage . DIRECTORY_SEPARATOR . $id . '.pdf';
        if (!is_file($filePath)) {
            ApiResponse::notFound('PDF de certificado');
        }

        // Obtener número de certificado para el nombre de archivo
        $cert = new Certificado();
        $row = $cert->findById($id);
        $filename = 'certificado.pdf';
        if ($row && !empty($row['numero_certificado'])) {
            $filename = $row['numero_certificado'] . '.pdf';
        }

        // Enviar PDF
        // Sobrescribir Content-Type JSON establecido arriba
        header_remove('Content-Type');
        header('Content-Type: application/pdf');
        header('Content-Length: ' . filesize($filePath));
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: private, max-age=3600');
        readfile($filePath);
        exit();
    } catch (Exception $e) {
        ApiResponse::error('Error al descargar PDF: ' . $e->getMessage(), 500);
    }
}

// ============================================
// RUTAS DE LA API
// ============================================

try {
    $router = new Router();
    
    // Clientes
    $router->get('/api/clientes', 'getClientes');
    $router->get('/api/clientes/{id}', 'getClientes');
    $router->post('/api/clientes', 'createCliente');
    $router->put('/api/clientes/{id}', 'updateCliente');
    $router->delete('/api/clientes/{id}', 'deleteCliente');
    
    // Instalaciones
    $router->get('/api/instalaciones', 'getInstalaciones');
    $router->get('/api/instalaciones/{id}', 'getInstalaciones');
    $router->get('/api/clientes/{cliente_id}/instalaciones', 'getInstalaciones');
    $router->post('/api/instalaciones', 'createInstalacion');
    $router->put('/api/instalaciones/{id}', 'updateInstalacion');
    $router->delete('/api/instalaciones/{id}', 'deleteInstalacion');
    
    // Técnicos
    $router->get('/api/tecnicos', 'getTecnicos');
    $router->get('/api/tecnicos/{id}', 'getTecnicos');
    $router->post('/api/tecnicos', 'createTecnico');
    $router->put('/api/tecnicos/{id}', 'updateTecnico');
    $router->delete('/api/tecnicos/{id}', 'deleteTecnico');
    
    // Empresa
    $router->get('/api/empresa', 'getEmpresa');
    $router->get('/api/empresa/{id}', 'getEmpresa');
    $router->post('/api/empresa', 'createEmpresa');
    $router->put('/api/empresa/{id}', 'updateEmpresa');
    $router->delete('/api/empresa/{id}', 'deleteEmpresa');
    
    // Certificados
    $router->get('/api/certificados', 'getCertificados');
    $router->get('/api/certificados/{id}', 'getCertificados');
    $router->post('/api/certificados', 'createCertificado');
    $router->get('/api/certificados/ultimo', 'getUltimoCertificado');
    // Certificados - PDFs
    $router->post('/api/certificados/{id}/pdf', 'uploadCertificadoPDF');
    $router->get('/api/certificados/{id}/pdf', 'downloadCertificadoPDF');
    
    // Configuración
    $router->get('/api/configuracion', 'getConfiguracion');
    $router->get('/api/configuracion/{clave}', 'getConfiguracion');
    
    // Checklists
    $router->get('/api/checklists', 'getChecklists');
    $router->get('/api/checklists/{tipo}', 'getChecklists');
    
    // Estadísticas
    $router->get('/api/estadisticas', 'getEstadisticas');

    // Contadores (correlativos de certificados)
    $router->get('/api/contadores/{tipo}', 'getContador');
    $router->patch('/api/contadores/{tipo}/increment', 'incrementContador');
    
    // Ruta de health check
    $router->get('/api/health', function($params) {
        ApiResponse::success([
            'status' => 'OK',
            'version' => '1.0.0',
            'database' => 'Connected',
            'server_time' => date('c')
        ], 'API funcionando correctamente');
    });
    
    // Procesar la petición
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    
    $router->dispatch($requestUri, $requestMethod);
    
} catch (Exception $e) {
    ApiResponse::error('Error interno del servidor: ' . $e->getMessage(), 500);
}
?>

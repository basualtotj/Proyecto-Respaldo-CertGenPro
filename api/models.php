<?php
// ============================================
// DATABASE CONNECTION CLASS
// Compatible con cPanel/MySQL
// ============================================

class Database {
    private static $instance = null;
    private $connection;
    
    // Configuración para cPanel (ajustar según tu configuración)
    private const DB_HOST = 'localhost';
    private const DB_NAME = 'certificados_db'; 
    private const DB_USER = 'root';
    private const DB_PASS = '';
    private const DB_CHARSET = 'utf8mb4';
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $dsn = "mysql:host=" . self::DB_HOST . ";dbname=" . self::DB_NAME . ";charset=" . self::DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . self::DB_CHARSET
            ];
            
            $this->connection = new PDO($dsn, self::DB_USER, self::DB_PASS, $options);
            
        } catch (PDOException $e) {
            $this->logError("Database connection failed: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }
    
    public function getConnection() {
        // Verificar si la conexión sigue activa
        if ($this->connection === null) {
            $this->connect();
        }
        
        try {
            $this->connection->query('SELECT 1');
        } catch (PDOException $e) {
            $this->connect(); // Reconectar si se perdió la conexión
        }
        
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw new Exception("Error en la consulta: " . $e->getMessage());
        }
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
    
    // Ensure a column exists; if missing, attempt to add it (fallback to TEXT if JSON unsupported)
    public function ensureColumn($table, $column, $definition) {
        try {
            $conn = $this->getConnection();
            $checkSql = "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";
            $stmt = $conn->prepare($checkSql);
            $stmt->execute([$table, $column]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ((int)($row['cnt'] ?? 0) > 0) {
                return false; // already exists
            }

            // Try with provided definition first
            $ddl = "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}";
            try {
                $conn->exec($ddl);
                return true;
            } catch (PDOException $e) {
                // If JSON not supported, fallback to TEXT
                if (stripos($definition, 'JSON') !== false) {
                    $fallbackDdl = "ALTER TABLE `{$table}` ADD COLUMN `{$column}` TEXT NULL";
                    $conn->exec($fallbackDdl);
                    return true;
                }
                throw $e;
            }
        } catch (PDOException $e) {
            $this->logError("ensureColumn failed for {$table}.{$column}: " . $e->getMessage());
            // Do not break app flow
            return false;
        }
    }
    
    private function logError($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        error_log($logMessage, 3, __DIR__ . '/logs/database.log');
    }
    
    // Prevenir clonación
    public function __clone() {
        throw new Exception("Cannot clone database instance");
    }
    
    // Prevenir deserialización
    public function __wakeup() {
        throw new Exception("Cannot unserialize database instance");
    }
}

// ============================================
// BASE MODEL CLASS
// ============================================

abstract class BaseModel {
    protected $db;
    protected $table;
    protected $primaryKey = 'id';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findAll($conditions = [], $orderBy = null, $limit = null) {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $field => $value) {
                if (is_array($value)) {
                    $placeholders = str_repeat('?,', count($value) - 1) . '?';
                    $whereClauses[] = "$field IN ($placeholders)";
                    $params = array_merge($params, $value);
                } else {
                    $whereClauses[] = "$field = ?";
                    $params[] = $value;
                }
            }
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }
        
        if ($orderBy) {
            $sql .= " ORDER BY $orderBy";
        }
        
        if ($limit) {
            $sql .= " LIMIT $limit";
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function findById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }
    
    public function create($data) {
        // Remover campos que no deben insertarse
        unset($data['id'], $data['created_at'], $data['updated_at']);
        
        $fields = array_keys($data);
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';
        
        $sql = "INSERT INTO {$this->table} (" . implode(',', $fields) . ") VALUES ($placeholders)";
        
        $this->db->query($sql, array_values($data));
        
        return $this->db->lastInsertId();
    }
    
    public function update($id, $data) {
        // Remover campos que no deben actualizarse
        unset($data['id'], $data['created_at'], $data['updated_at']);
        
        $fields = array_keys($data);
        $setClauses = array_map(function($field) { return "$field = ?"; }, $fields);
        
        $sql = "UPDATE {$this->table} SET " . implode(',', $setClauses) . " WHERE {$this->primaryKey} = ?";
        
        $params = array_values($data);
        $params[] = $id;
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->rowCount();
    }
    
    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->rowCount();
    }
    
    public function count($conditions = []) {
        $sql = "SELECT COUNT(*) as total FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $field => $value) {
                $whereClauses[] = "$field = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        return $result['total'];
    }
}

// ============================================
// MODELS
// ============================================

class Cliente extends BaseModel {
    protected $table = 'clientes';
    
    public function findByRut($rut) {
        $sql = "SELECT * FROM {$this->table} WHERE rut = ?";
        $stmt = $this->db->query($sql, [$rut]);
        return $stmt->fetch();
    }
    
    public function getWithInstalaciones($clienteId = null) {
        $sql = "SELECT 
                    c.id, c.nombre, c.rut, c.contacto, c.telefono, c.email,
                    GROUP_CONCAT(
                        CONCAT(i.id, ':', i.nombre, ':', i.direccion, ':', IFNULL(i.meta_equipos,''))
                        SEPARATOR '||'
                    ) as instalaciones
                FROM clientes c 
                LEFT JOIN instalaciones i ON c.id = i.cliente_id AND i.activo = 1
                WHERE c.activo = 1";
        
        $params = [];
        if ($clienteId) {
            $sql .= " AND c.id = ?";
            $params[] = $clienteId;
        }
        
        $sql .= " GROUP BY c.id ORDER BY c.nombre";
        
        $stmt = $this->db->query($sql, $params);
        $results = $stmt->fetchAll();
        
        // Procesar instalaciones
        foreach ($results as &$cliente) {
            $instalaciones = [];
            if ($cliente['instalaciones']) {
                $instData = explode('||', $cliente['instalaciones']);
                foreach ($instData as $inst) {
                    $parts = explode(':', $inst, 4);
                    $row = [
                        'id' => $parts[0] ?? null,
                        'nombre' => $parts[1] ?? '',
                        'direccion' => $parts[2] ?? ''
                    ];
                    if (isset($parts[3]) && $parts[3] !== '') {
                        $decoded = json_decode($parts[3], true);
                        if (json_last_error() === JSON_ERROR_NONE) {
                            $row['meta_equipos'] = $decoded;
                        }
                    }
                    $instalaciones[] = $row;
                }
            }
            $cliente['instalaciones'] = $instalaciones;
        }
        
        return $clienteId ? $results[0] ?? null : $results;
    }
}

class Instalacion extends BaseModel {
    protected $table = 'instalaciones';
    
    public function findByCliente($clienteId) {
    return $this->findAll(['cliente_id' => $clienteId, 'activo' => 1], 'nombre');
    }
}

class Tecnico extends BaseModel {
    protected $table = 'tecnicos';
    
    protected $fillable = [
        'nombre', 'especialidad', 'email', 'telefono', 
        'certificaciones', 'firma_digital', 'activo'
    ];
    
    protected $rules = [
        'nombre' => 'required|string|max:255',
        'especialidad' => 'required|string|max:255'
    ];
    
    public function findActivos() {
        return $this->findAll(['activo' => 1], 'nombre');
    }
    
    public function updateFirma($id, $firmaData) {
        return $this->update($id, ['firma_digital' => $firmaData]);
    }
}

class Certificado extends BaseModel {
    protected $table = 'certificados';
    
    public function generateNumero($tipo) {
        $sql = "CALL GenerarNumeroCertificado(?, @numero)";
        $this->db->query($sql, [$tipo]);
        
        $stmt = $this->db->query("SELECT @numero as numero");
        $result = $stmt->fetch();
        return $result['numero'];
    }
    
    public function getCompleto($id) {
        $sql = "SELECT * FROM certificados_completos WHERE id = ?";
        $stmt = $this->db->query($sql, [$id]);
        return $stmt->fetch();
    }
    
    public function getListaCompleta($limit = 50, $offset = 0, $filtros = []) {
        $sql = "SELECT * FROM certificados_completos";
        $params = [];
        
        $whereClauses = [];
        foreach ($filtros as $campo => $valor) {
            if ($valor !== '') {
                switch ($campo) {
                    case 'tipo':
                        $whereClauses[] = "tipo = ?";
                        $params[] = $valor;
                        break;
                    case 'cliente':
                        $whereClauses[] = "cliente_nombre LIKE ?";
                        $params[] = "%$valor%";
                        break;
                    case 'fecha_desde':
                        $whereClauses[] = "fecha_mantenimiento >= ?";
                        $params[] = $valor;
                        break;
                    case 'fecha_hasta':
                        $whereClauses[] = "fecha_mantenimiento <= ?";
                        $params[] = $valor;
                        break;
                }
            }
        }
        
        if (!empty($whereClauses)) {
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }
        
        $sql .= " ORDER BY fecha_emision DESC LIMIT $limit OFFSET $offset";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function getEstadisticas() {
        $sql = "SELECT * FROM estadisticas_certificados";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}

class Configuracion extends BaseModel {
    protected $table = 'configuracion';
    protected $primaryKey = 'clave';
    
    public function getValue($clave, $default = null) {
        $config = $this->findById($clave);
        if (!$config) return $default;
        
        switch ($config['tipo']) {
            case 'number':
                return (float)$config['valor'];
            case 'boolean':
                return filter_var($config['valor'], FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($config['valor'], true);
            default:
                return $config['valor'];
        }
    }
    
    public function setValue($clave, $valor, $tipo = 'string') {
        $data = [
            'clave' => $clave,
            'valor' => is_array($valor) ? json_encode($valor) : $valor,
            'tipo' => $tipo
        ];
        
        $existing = $this->findById($clave);
        if ($existing) {
            return $this->update($clave, $data);
        } else {
            return $this->create($data);
        }
    }
    
    public function getAll() {
        $configs = $this->findAll();
        $result = [];
        
        foreach ($configs as $config) {
            $result[$config['clave']] = $this->getValue($config['clave']);
        }
        
        return $result;
    }
}

class ChecklistTemplate extends BaseModel {
    protected $table = 'checklists_templates';
    
    public function findByTipo($tipo) {
        $templates = $this->findAll(['tipo' => $tipo, 'activo' => 1]);
        
        // Decodificar JSON de items
        foreach ($templates as &$template) {
            $template['items'] = json_decode($template['items'], true) ?: [];
        }
        
        return $templates;
    }
    
    public function getDefaultForType($tipo) {
        $templates = $this->findByTipo($tipo);
        return $templates[0] ?? null;
    }
}

// ============================================
// EMPRESA MODEL
// ============================================
class Empresa extends BaseModel {
    protected $table = 'empresa';
    
    protected $fillable = [
        'nombre_empresa', 'rut_empresa', 'direccion', 'telefono', 'email',
        'nombre_representante', 'cargo_representante', 'rut_representante',
        'firma_representante', 'logo_empresa', 'activo'
    ];
    
    protected $rules = [
        'nombre_empresa' => 'required|string|max:255',
        'rut_empresa' => 'required|string|max:20',
        'direccion' => 'required|string',
        'nombre_representante' => 'required|string|max:255'
    ];
    
    public function getActiva() {
        // Solo debería haber una empresa activa normalmente
        $result = $this->findOne(['activo' => 1]);
        return $result;
    }
    
    public function activar($id) {
        try {
            // Desactivar todas las demás empresas
            $sql = "UPDATE {$this->table} SET activo = 0";
            $stmt = $this->db->getConnection()->prepare($sql);
            $stmt->execute();
            
            // Activar la empresa seleccionada
            return $this->update($id, ['activo' => 1]);
        } catch (Exception $e) {
            $this->logError("Error activando empresa: " . $e->getMessage());
            throw $e;
        }
    }
}
?>

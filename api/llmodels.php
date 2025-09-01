<?php
// ============================================
// DATABASE CONNECTION + BASE MODEL (CLEAN)
// ============================================

class Database {
    private static $instance = null;
    private $pdo;

    // Ajusta a tu entorno local
    private const DB_HOST = 'localhost';
    private const DB_NAME = 'certificados_db';
    private const DB_USER = 'root';
    private const DB_PASS = '';

    private function __construct() {
        $dsn = 'mysql:host=' . self::DB_HOST . ';dbname=' . self::DB_NAME . ';charset=utf8mb4';
        $opts = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $this->pdo = new PDO($dsn, self::DB_USER, self::DB_PASS, $opts);
    }

    public static function getInstance(): self {
        if (!self::$instance) self::$instance = new self();
        return self::$instance;
    }

    public function pdo(): PDO { return $this->pdo; }

    public function query(string $sql, array $params = []): PDOStatement {
        // Normalizar parámetros para evitar "Array to string conversion"
        $norm = [];
        foreach ($params as $v) {
            if (is_array($v) || is_object($v)) {
                $norm[] = json_encode($v, JSON_UNESCAPED_UNICODE);
            } elseif ($v === '') {
                $norm[] = null;
            } else {
                $norm[] = $v;
            }
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($norm);
        return $stmt;
    }

    public function lastInsertId(): string {
        return $this->pdo->lastInsertId();
    }
}

// ============================================

abstract class BaseModel {
    protected Database $db;
    protected string $table;
    protected string $primaryKey = 'id';
    protected array $fillable = [];  // Debe definirse en cada subclase

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function findAll(array $conditions = [], ?string $orderBy = null, ?int $limit = null): array {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];

        if ($conditions) {
            $parts = [];
            foreach ($conditions as $k => $v) {
                $parts[] = "$k = ?";
                $params[] = $v;
            }
            $sql .= " WHERE " . implode(' AND ', $parts);
        }
        if ($orderBy) $sql .= " ORDER BY $orderBy";
        if ($limit)   $sql .= " LIMIT $limit";

        return $this->db->query($sql, $params)->fetchAll();
    }

    public function findById(int $id): ?array {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ? LIMIT 1";
        $row = $this->db->query($sql, [$id])->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        // whitelisting
        $payload = array_intersect_key($data, array_flip($this->fillable));
        if (isset($payload['activo'])) $payload['activo'] = (int)!!$payload['activo'];
        if (array_key_exists('meta_equipos', $payload)) {
            $v = $payload['meta_equipos'];
            if ($v === '' || $v === [] || $v === null) {
                $payload['meta_equipos'] = null;
            } elseif (is_array($v) || is_object($v)) {
                $payload['meta_equipos'] = json_encode($v, JSON_UNESCAPED_UNICODE);
            }
        }
        if (!$payload) throw new InvalidArgumentException('No hay campos válidos para insertar');

        $cols = array_keys($payload);
        $ph   = implode(',', array_fill(0, count($cols), '?'));
        $sql  = "INSERT INTO {$this->table} (" . implode(',', $cols) . ") VALUES ($ph)";
        $this->db->query($sql, array_values($payload));
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): int {
        $payload = array_intersect_key($data, array_flip($this->fillable));
        if (!$payload) return 0;
        if (isset($payload['activo'])) $payload['activo'] = (int)!!$payload['activo'];
        if (array_key_exists('meta_equipos', $payload)) {
            $v = $payload['meta_equipos'];
            if ($v === '' || $v === [] || $v === null) {
                $payload['meta_equipos'] = null;
            } elseif (is_array($v) || is_object($v)) {
                $payload['meta_equipos'] = json_encode($v, JSON_UNESCAPED_UNICODE);
            }
        }

        $sets = [];
        foreach (array_keys($payload) as $k) $sets[] = "$k = ?";
        $sql = "UPDATE {$this->table} SET " . implode(',', $sets) . " WHERE {$this->primaryKey} = ?";
        $params = array_values($payload);
        $params[] = $id;
        $stmt = $this->db->query($sql, $params);
        return $stmt->rowCount();
    }

    public function delete(int $id): int {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        return $this->db->query($sql, [$id])->rowCount();
    }
}

// ============================================
// MODELOS ESPECÍFICOS
// ============================================

class Cliente extends BaseModel {
    protected string $table = 'clientes';
    protected array $fillable = [
        'rut','nombre','direccion','telefono','email','contacto','activo'
    ];
}

class Instalacion extends BaseModel {
    protected string $table = 'instalaciones';
    protected array $fillable = [
        'cliente_id','nombre','direccion','contacto_local','telefono_local',
        'tipo_sistema','meta_equipos','descripcion','activo'
    ];

    public function findByCliente(int $clienteId): array {
        return $this->findAll(['cliente_id' => $clienteId, 'activo' => 1], 'nombre');
    }
}

class Tecnico extends BaseModel {
    protected string $table = 'tecnicos';
    protected array $fillable = [
        'nombre','especialidad','email','telefono','certificaciones','firma_digital','activo'
    ];
}

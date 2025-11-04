<?php
// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

session_start();

require_once __DIR__ . '/config.php';

class Auth {
    private $pdo;
    
    public function __construct() {
        try {
            $config = require __DIR__ . '/config.php';
            $dbConfig = $config['database'];
            
            $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
            $this->pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
        } catch (PDOException $e) {
            throw new Exception('Database connection failed: ' . $e->getMessage());
        }
    }
    
    public function login($identifier, $password) {
        try {
            // Buscar usuario por username o email
            $stmt = $this->pdo->prepare("
                SELECT id, username, email, password_hash, nombre, rol, activo 
                FROM usuarios 
                WHERE (username = ? OR email = ?) AND activo = 1
            ");
            $stmt->execute([$identifier, $identifier]);
            $user = $stmt->fetch();
            
            if (!$user) {
                return ['success' => false, 'message' => 'Usuario no encontrado o inactivo'];
            }
            
            if (!password_verify($password, $user['password_hash'])) {
                return ['success' => false, 'message' => 'Contraseña incorrecta'];
            }
            
            // Crear sesión
            $this->createSession($user);
            
            return [
                'success' => true, 
                'message' => 'Login exitoso',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'nombre' => $user['nombre'],
                    'rol' => $user['rol']
                ],
                'redirect' => 'dashboard.php'
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error interno del servidor'];
        }
    }
    
    public function createSession($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['nombre'] = $user['nombre'];
        $_SESSION['rol'] = $user['rol'];
        $_SESSION['login_time'] = time();
        
        // Tiempo de expiración basado en rol
        $expiration = $user['rol'] === 'admin' ? 8 * 3600 : 4 * 3600; // 8h admin, 4h usuarios
        $_SESSION['expires_at'] = time() + $expiration;
        
        // Regenerar ID de sesión para seguridad
        session_regenerate_id(true);
    }
    
    public function isAuthenticated() {
        if (!isset($_SESSION['user_id']) || !isset($_SESSION['expires_at'])) {
            return false;
        }
        
        // Verificar expiración
        if (time() > $_SESSION['expires_at']) {
            $this->logout();
            return false;
        }
        
        return true;
    }
    
    public function isAdmin() {
        return $this->isAuthenticated() && $_SESSION['rol'] === 'admin';
    }
    
    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'nombre' => $_SESSION['nombre'],
            'rol' => $_SESSION['rol']
        ];
    }
    
    public function logout() {
        session_destroy();
        session_start();
        session_regenerate_id(true);
    }
    
    public function requireAuth() {
        if (!$this->isAuthenticated()) {
            if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'No autenticado', 'redirect' => 'login.html']);
            } else {
                header('Location: login.html');
            }
            exit;
        }
    }
    
    public function requireAdmin() {
        $this->requireAuth();
        if (!$this->isAdmin()) {
            if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Acceso denegado - Se requieren permisos de administrador']);
            } else {
                header('HTTP/1.0 403 Forbidden');
                echo '<h1>403 Forbidden</h1><p>Se requieren permisos de administrador</p>';
            }
            exit;
        }
    }
    
    public function createUser($username, $email, $password, $nombre, $rol = 'tecnico') {
        try {
            // Verificar si el usuario ya existe
            $stmt = $this->pdo->prepare("SELECT id FROM usuarios WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'Usuario o email ya existe'];
            }
            
            // Crear usuario
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("
                INSERT INTO usuarios (username, email, password_hash, nombre, rol, activo) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
            $stmt->execute([$username, $email, $passwordHash, $nombre, $rol]);
            
            return ['success' => true, 'message' => 'Usuario creado exitosamente'];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error creando usuario: ' . $e->getMessage()];
        }
    }
}

// Crear instancia global
$auth = new Auth();

// Manejar requests AJAX
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    
    switch ($_GET['action']) {
        case 'check':
            if ($auth->isAuthenticated()) {
                $user = $auth->getCurrentUser();
                echo json_encode([
                    'authenticated' => true,
                    'user' => $user,
                    'username' => $user['username'],
                    'role' => $user['rol']
                ]);
            } else {
                echo json_encode(['authenticated' => false]);
            }
            break;
            
        case 'logout':
            $auth->logout();
            echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    exit;
}

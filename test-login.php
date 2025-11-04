<?php
// Test de login para debug
require_once 'auth.php';

echo "=== TEST DE LOGIN ===\n\n";

$auth = new Auth();

// Test con admin
echo "Probando login con admin:\n";
$result = $auth->login('admin', 'admin123');
echo "Resultado: " . json_encode($result, JSON_PRETTY_PRINT) . "\n\n";

// Test con usuario
echo "Probando login con usuario:\n";
$result = $auth->login('usuario', 'usuario123');
echo "Resultado: " . json_encode($result, JSON_PRETTY_PRINT) . "\n\n";

// Test verificar password hash
echo "=== VERIFICACIÓN DE PASSWORDS ===\n\n";

try {
    $pdo = new PDO("mysql:host=localhost;dbname=certificados_db;charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    $stmt = $pdo->prepare("SELECT username, password_hash FROM usuarios WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    
    if ($admin) {
        $isValid = password_verify('admin123', $admin['password_hash']);
        echo "Password 'admin123' para usuario 'admin': " . ($isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO") . "\n";
        echo "Hash almacenado: " . $admin['password_hash'] . "\n";
        echo "Hash de prueba: " . password_hash('admin123', PASSWORD_DEFAULT) . "\n\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

<?php
// Script para resetear passwords de usuarios
require_once 'config.php';

try {
    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    echo "=== RESETEANDO PASSWORDS ===\n\n";
    
    // Reset admin password
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE username = 'admin'");
    $stmt->execute([$adminHash]);
    echo "✅ Password de 'admin' reseteado a 'admin123'\n";
    
    // Reset usuario password
    $usuarioHash = password_hash('usuario123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE username = 'usuario'");
    if ($stmt->execute([$usuarioHash])) {
        echo "✅ Password de 'usuario' reseteado a 'usuario123'\n";
    }
    
    // Reset estudiante password
    $estudianteHash = password_hash('estudiante123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE username = 'estudiante'");
    if ($stmt->execute([$estudianteHash])) {
        echo "✅ Password de 'estudiante' reseteado a 'estudiante123'\n";
    }
    
    // Actualizar roles y emails
    $pdo->prepare("UPDATE usuarios SET rol = 'admin', email = 'admin@certificados.com' WHERE username = 'admin'")->execute();
    $pdo->prepare("UPDATE usuarios SET rol = 'cliente', email = 'usuario@certificados.com' WHERE username = 'usuario'")->execute();
    $pdo->prepare("UPDATE usuarios SET rol = 'cliente', email = 'estudiante@certificados.com' WHERE username = 'estudiante'")->execute();
    
    echo "✅ Roles y emails actualizados\n\n";
    
    echo "=== CREDENCIALES ACTUALIZADAS ===\n\n";
    echo "🔑 ADMINISTRADOR:\n";
    echo "   Usuario: admin\n";
    echo "   Password: admin123\n";
    echo "   Email: admin@certificados.com\n\n";
    
    echo "🎓 USUARIO REGULAR:\n";
    echo "   Usuario: usuario\n";
    echo "   Password: usuario123\n";
    echo "   Email: usuario@certificados.com\n\n";
    
    echo "📚 ESTUDIANTE:\n";
    echo "   Usuario: estudiante\n";
    echo "   Password: estudiante123\n";
    echo "   Email: estudiante@certificados.com\n\n";
    
    // Verificar que funcionan
    echo "=== VERIFICANDO PASSWORDS ===\n\n";
    
    $stmt = $pdo->prepare("SELECT username, password_hash FROM usuarios WHERE username IN ('admin', 'usuario', 'estudiante')");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        $testPassword = $user['username'] . '123';
        $isValid = password_verify($testPassword, $user['password_hash']);
        echo $user['username'] . " con password '$testPassword': " . ($isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO") . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

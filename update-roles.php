<?php
// Script para actualizar roles de "cliente" a "usuario"

$host = 'localhost';
$dbname = 'certificados_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Actualizar roles de "cliente" a "usuario"
    $stmt = $pdo->prepare("UPDATE usuarios SET rol = 'usuario' WHERE rol = 'cliente'");
    $result = $stmt->execute();
    
    echo "=== ACTUALIZACIÓN DE ROLES ===\n";
    echo "Registros actualizados: " . $stmt->rowCount() . "\n";
    
    // Verificar los roles actuales
    $stmt = $pdo->query("SELECT username, rol FROM usuarios");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n=== ROLES ACTUALES ===\n";
    foreach ($users as $user) {
        echo "Usuario: {$user['username']} - Rol: {$user['rol']}\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

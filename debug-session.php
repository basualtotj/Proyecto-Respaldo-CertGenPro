<?php
// Script para verificar la sesión directamente
session_start();

echo "=== VERIFICACIÓN DE SESIÓN ===\n";
echo "Session ID: " . session_id() . "\n";
echo "User ID: " . ($_SESSION['user_id'] ?? 'NO SET') . "\n";
echo "Username: " . ($_SESSION['username'] ?? 'NO SET') . "\n";
echo "Nombre: " . ($_SESSION['nombre'] ?? 'NO SET') . "\n";
echo "Rol: " . ($_SESSION['rol'] ?? 'NO SET') . "\n";
echo "\nSesión completa:\n";
print_r($_SESSION);

// Verificar si podemos hacer login manualmente
echo "\n=== INTENTANDO LOGIN DIRECTO ===\n";
require_once 'auth.php';

try {
    $auth = new Auth();
    $result = $auth->login('admin', 'admin123');
    echo "Resultado del login:\n";
    print_r($result);
} catch (Exception $e) {
    echo "Error en login: " . $e->getMessage() . "\n";
}
?>

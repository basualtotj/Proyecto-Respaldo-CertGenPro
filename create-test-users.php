<?php
// ============================================
// SCRIPT PARA CREAR USUARIOS DE PRUEBA
// ============================================

require_once __DIR__ . '/auth.php';

try {
    $auth = new Auth();
    
    echo "Creando usuarios de prueba...\n\n";
    
    // Crear administrador
    $result1 = $auth->createUser('admin', 'admin@certificados.com', 'admin123', 'Administrador Sistema', 'admin');
    echo "Admin: " . $result1['message'] . "\n";
    
    // Crear usuario regular  
    $result2 = $auth->createUser('usuario1', 'usuario@certificados.com', 'user123', 'Usuario de Prueba', 'cliente');
    echo "Usuario: " . $result2['message'] . "\n";
    
    // Crear otro usuario regular
    $result3 = $auth->createUser('juan', 'juan@certificados.com', 'juan123', 'Juan Pérez', 'cliente');
    echo "Juan: " . $result3['message'] . "\n";
    
    echo "\n=== CREDENCIALES DE PRUEBA ===\n";
    echo "ADMIN:\n";
    echo "  Usuario: admin\n";
    echo "  Email: admin@certificados.com\n";
    echo "  Contraseña: admin123\n\n";
    
    echo "USUARIOS:\n";
    echo "  Usuario: usuario1 / Contraseña: user123\n";
    echo "  Usuario: juan / Contraseña: juan123\n\n";
    
    echo "¡Usuarios creados exitosamente!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

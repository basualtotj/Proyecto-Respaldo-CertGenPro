<?php
// Script para crear usuarios de prueba
require_once 'auth.php';

try {
    $auth = new Auth();
    
    echo "=== CREANDO USUARIOS DE PRUEBA ===\n\n";
    
    // Crear usuario administrador
    try {
        $adminResult = $auth->createUser('admin', 'admin@certificados.com', 'admin123', 'Administrador', 'admin');
        if ($adminResult) {
            echo "✅ ADMIN creado exitosamente\n";
            echo "   Usuario: admin\n";
            echo "   Password: admin123\n";
            echo "   Rol: Administrador\n\n";
        }
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo "ℹ️  Usuario ADMIN ya existe\n\n";
        } else {
            echo "❌ Error creando admin: " . $e->getMessage() . "\n\n";
        }
    }
    
    // Crear usuario regular
    try {
        $userResult = $auth->createUser('usuario', 'usuario@certificados.com', 'usuario123', 'Usuario Regular', 'usuario');
        if ($userResult) {
            echo "✅ USUARIO creado exitosamente\n";
            echo "   Usuario: usuario\n";
            echo "   Password: usuario123\n";
            echo "   Rol: Usuario regular\n\n";
        }
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo "ℹ️  Usuario USUARIO ya existe\n\n";
        } else {
            echo "❌ Error creando usuario: " . $e->getMessage() . "\n\n";
        }
    }
    
    // Crear segundo usuario regular
    try {
        $user2Result = $auth->createUser('estudiante', 'estudiante123', 'estudiante@certificados.com', 'user');
        if ($user2Result) {
            echo "✅ ESTUDIANTE creado exitosamente\n";
            echo "   Usuario: estudiante\n";
            echo "   Password: estudiante123\n";
            echo "   Rol: Usuario regular\n\n";
        }
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo "ℹ️  Usuario ESTUDIANTE ya existe\n\n";
        } else {
            echo "❌ Error creando estudiante: " . $e->getMessage() . "\n\n";
        }
    }
    
    echo "=== RESUMEN DE CREDENCIALES ===\n\n";
    echo "🔑 ADMINISTRADOR:\n";
    echo "   Usuario: admin\n";
    echo "   Password: admin123\n";
    echo "   Acceso: Panel completo + aprobación de certificados\n\n";
    
    echo "🎓 USUARIO REGULAR 1:\n";
    echo "   Usuario: usuario\n";
    echo "   Password: usuario123\n";
    echo "   Acceso: Solo crear solicitudes de certificados\n\n";
    
    echo "📚 USUARIO REGULAR 2:\n";
    echo "   Usuario: estudiante\n";
    echo "   Password: estudiante123\n";
    echo "   Acceso: Solo crear solicitudes de certificados\n\n";
    
    echo "🌐 VALIDACIÓN PÚBLICA:\n";
    echo "   URL: http://localhost:8085/validate.html\n";
    echo "   Acceso: Sin login, para validar certificados\n\n";
    
    echo "=== INSTRUCCIONES DE PRUEBA ===\n\n";
    echo "1. Ir a: http://localhost:8085/login.html\n";
    echo "2. Usar cualquiera de las credenciales de arriba\n";
    echo "3. Usuarios regulares: Crear certificados (quedan pendientes)\n";
    echo "4. Admin: Aprobar certificados en dashboard\n";
    echo "5. Validar públicamente en: /validate.html\n\n";
    
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
}
?>

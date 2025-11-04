<?php
// Script para insertar certificados de ejemplo
require_once 'config.php';

try {
    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    echo "=== INSERTANDO CERTIFICADOS DE EJEMPLO ===\n\n";
    
    // Obtener ID de usuario regular
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = 'usuario' LIMIT 1");
    $stmt->execute();
    $usuario = $stmt->fetch();
    
    if (!$usuario) {
        throw new Exception("Usuario 'usuario' no encontrado");
    }
    
    $userId = $usuario['id'];
    
    // Certificado 1 - Aprobado
    $codigo1 = 'CERT' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $stmt = $pdo->prepare("
        INSERT INTO certificados_cursos 
        (usuario_creador_id, nombre_completo, nombre_curso, nombre_instructor, duracion_horas, fecha_emision, estado, codigo_verificacion, fecha_aprobacion) 
        VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, NOW())
    ");
    $stmt->execute([
        $userId,
        'Juan Carlos Pérez',
        'Desarrollo Web Full Stack con PHP y MySQL',
        'Dr. María González',
        120,
        '2025-08-15',
        $codigo1
    ]);
    
    echo "✅ Certificado APROBADO creado:\n";
    echo "   Código: $codigo1\n";
    echo "   Participante: Juan Carlos Pérez\n";
    echo "   Curso: Desarrollo Web Full Stack\n\n";
    
    // Certificado 2 - Aprobado
    $codigo2 = 'CERT' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $stmt->execute([
        $userId,
        'Ana María Torres',
        'Administración de Bases de Datos MySQL',
        'Ing. Roberto Silva',
        80,
        '2025-08-20',
        $codigo2
    ]);
    
    echo "✅ Certificado APROBADO creado:\n";
    echo "   Código: $codigo2\n";
    echo "   Participante: Ana María Torres\n";
    echo "   Curso: Administración de BD MySQL\n\n";
    
    // Certificado 3 - Pendiente
    $stmt = $pdo->prepare("
        INSERT INTO certificados_cursos 
        (usuario_creador_id, nombre_completo, nombre_curso, nombre_instructor, duracion_horas, fecha_emision, estado) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([
        $userId,
        'Carlos Eduardo Ruiz',
        'Seguridad Informática Avanzada',
        'Dr. Patricia López',
        100,
        '2025-09-01'
    ]);
    
    echo "🟡 Certificado PENDIENTE creado:\n";
    echo "   Participante: Carlos Eduardo Ruiz\n";
    echo "   Curso: Seguridad Informática\n";
    echo "   Estado: Esperando aprobación del admin\n\n";
    
    // Obtener ID de estudiante
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = 'estudiante' LIMIT 1");
    $stmt->execute();
    $estudiante = $stmt->fetch();
    
    if ($estudiante) {
        $estudianteId = $estudiante['id'];
        
        // Certificado 4 - Aprobado para estudiante
        $codigo4 = 'CERT' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare("
            INSERT INTO certificados_cursos 
            (usuario_creador_id, nombre_completo, nombre_curso, nombre_instructor, duracion_horas, fecha_emision, estado, codigo_verificacion, fecha_aprobacion) 
            VALUES (?, ?, ?, ?, ?, ?, 'approved', ?, NOW())
        ");
        $stmt->execute([
            $estudianteId,
            'Laura Sofía Mendoza',
            'Python para Data Science',
            'Dra. Carmen Vega',
            90,
            '2025-08-25',
            $codigo4
        ]);
        
        echo "✅ Certificado APROBADO creado:\n";
        echo "   Código: $codigo4\n";
        echo "   Participante: Laura Sofía Mendoza\n";
        echo "   Curso: Python para Data Science\n\n";
    }
    
    echo "=== CÓDIGOS PARA VALIDACIÓN PÚBLICA ===\n\n";
    echo "🔍 Puedes probar estos códigos en: http://localhost:8085/validate.html\n\n";
    echo "✅ $codigo1 - Desarrollo Web Full Stack\n";
    echo "✅ $codigo2 - Administración de BD MySQL\n";
    if (isset($codigo4)) {
        echo "✅ $codigo4 - Python para Data Science\n";
    }
    echo "\n";
    
    echo "📋 INSTRUCCIONES DE PRUEBA:\n\n";
    echo "1. 🔐 LOGIN COMO ADMIN:\n";
    echo "   - Usuario: admin / Password: admin123\n";
    echo "   - Verás certificados pendientes para aprobar\n";
    echo "   - Podrás descargar PDFs de cualquier certificado\n\n";
    
    echo "2. 🎓 LOGIN COMO USUARIO:\n";
    echo "   - Usuario: usuario / Password: usuario123\n";
    echo "   - Verás tus certificados (aprobados y pendientes)\n";
    echo "   - Podrás descargar PDFs solo de los aprobados\n\n";
    
    echo "3. 🌐 VALIDACIÓN PÚBLICA (sin login):\n";
    echo "   - Ir a: /validate.html\n";
    echo "   - Usar los códigos de arriba para validar\n";
    echo "   - Descargar PDFs directamente desde ahí\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

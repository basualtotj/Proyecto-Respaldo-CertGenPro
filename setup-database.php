<?php
// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================

try {
    // Conexión inicial sin especificar base de datos
    $pdo = new PDO("mysql:host=localhost;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Conexión a MySQL establecida\n";
    
    // Crear base de datos
    $pdo->exec("CREATE DATABASE IF NOT EXISTS gestion_certificados CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✅ Base de datos 'gestion_certificados' creada\n";
    
    // Seleccionar la base de datos
    $pdo->exec("USE gestion_certificados");
    echo "✅ Base de datos seleccionada\n";
    
    // Crear tabla usuarios
    $sql_usuarios = "
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        rol ENUM('admin', 'tecnico') NOT NULL DEFAULT 'tecnico',
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_conexion TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_usuarios);
    echo "✅ Tabla 'usuarios' creada\n";
    
    // Crear tabla clientes
    $sql_clientes = "
    CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        rut VARCHAR(12) UNIQUE,
        contacto VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_clientes);
    echo "✅ Tabla 'clientes' creada\n";
    
    // Crear tabla tecnicos
    $sql_tecnicos = "
    CREATE TABLE IF NOT EXISTS tecnicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        especialidad VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(100),
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_tecnicos);
    echo "✅ Tabla 'tecnicos' creada\n";
    
    // Crear tabla empresa
    $sql_empresa = "
    CREATE TABLE IF NOT EXISTS empresa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        rut VARCHAR(12),
        direccion TEXT,
        telefono VARCHAR(20),
        email VARCHAR(100),
        logo_url VARCHAR(255),
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_empresa);
    echo "✅ Tabla 'empresa' creada\n";
    
    // Crear tabla certificados
    $sql_certificados = "
    CREATE TABLE IF NOT EXISTS certificados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        numero_certificado VARCHAR(50) NOT NULL,
        cliente_id INT,
        tecnico_id INT,
        fecha_instalacion DATE,
        direccion_instalacion TEXT,
        tipo_sistema VARCHAR(100),
        descripcion_trabajo TEXT,
        evidencias JSON,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_certificados);
    echo "✅ Tabla 'certificados' creada\n";
    
    // Crear tabla instalaciones
    $sql_instalaciones = "
    CREATE TABLE IF NOT EXISTS instalaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        direccion VARCHAR(255) NOT NULL,
        tipo_sistema VARCHAR(100),
        fecha_instalacion DATE,
        descripcion TEXT,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql_instalaciones);
    echo "✅ Tabla 'instalaciones' creada\n";
    
    // Verificar si ya existen usuarios
    $stmt = $pdo->query("SELECT COUNT(*) FROM usuarios");
    $userCount = $stmt->fetchColumn();
    
    if ($userCount == 0) {
        // Insertar usuarios por defecto
        $usuarios_default = [
            [
                'username' => 'admin',
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'nombre' => 'Administrador',
                'email' => 'admin@sistema.com',
                'rol' => 'admin'
            ],
            [
                'username' => 'tecnico',
                'password' => password_hash('tecnico123', PASSWORD_DEFAULT),
                'nombre' => 'Técnico Principal',
                'email' => 'tecnico@sistema.com',
                'rol' => 'tecnico'
            ]
        ];
        
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, password, nombre, email, rol) VALUES (?, ?, ?, ?, ?)");
        
        foreach ($usuarios_default as $usuario) {
            $stmt->execute([
                $usuario['username'],
                $usuario['password'],
                $usuario['nombre'],
                $usuario['email'],
                $usuario['rol']
            ]);
        }
        
        echo "✅ Usuarios por defecto creados:\n";
        echo "   - admin / admin123 (rol: admin)\n";
        echo "   - tecnico / tecnico123 (rol: tecnico)\n";
    } else {
        echo "✅ Ya existen usuarios en el sistema\n";
    }
    
    // Verificar si ya existen datos de prueba
    $stmt = $pdo->query("SELECT COUNT(*) FROM clientes");
    $clienteCount = $stmt->fetchColumn();
    
    if ($clienteCount == 0) {
        // Insertar datos de prueba
        $clientes_prueba = [
            ['Juan Pérez', '12345678-9', 'Juan Pérez', '+56912345678', 'juan@email.com'],
            ['María González', '98765432-1', 'María González', '+56987654321', 'maria@email.com'],
            ['Empresa XYZ', '76543210-K', 'Carlos López', '+56976543210', 'carlos@empresa.com']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO clientes (nombre, rut, contacto, telefono, email) VALUES (?, ?, ?, ?, ?)");
        foreach ($clientes_prueba as $cliente) {
            $stmt->execute($cliente);
        }
        
        // Insertar técnicos de prueba
        $tecnicos_prueba = [
            ['Roberto Silva', 'CCTV y Alarmas', '+56911111111', 'roberto@tecnico.com'],
            ['Ana Martínez', 'Sistemas de Seguridad', '+56922222222', 'ana@tecnico.com']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO tecnicos (nombre, especialidad, telefono, email) VALUES (?, ?, ?, ?)");
        foreach ($tecnicos_prueba as $tecnico) {
            $stmt->execute($tecnico);
        }
        
        echo "✅ Datos de prueba insertados\n";
    } else {
        echo "✅ Ya existen datos en el sistema\n";
    }
    
    echo "\n🎉 ¡BASE DE DATOS CONFIGURADA EXITOSAMENTE!\n";
    echo "📍 Puedes acceder al sistema en: http://localhost:8085/login.html\n";
    echo "👤 Usuario admin: admin / admin123\n";
    echo "👤 Usuario técnico: tecnico / tecnico123\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    
    // Sugerencias según el tipo de error
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "\n💡 Sugerencias:\n";
        echo "1. Verifica que MySQL esté ejecutándose\n";
        echo "2. Verifica las credenciales de MySQL (usuario/contraseña)\n";
        echo "3. Intenta: mysql -u root -p\n";
    } elseif (strpos($e->getMessage(), 'Connection refused') !== false) {
        echo "\n💡 Sugerencias:\n";
        echo "1. Inicia MySQL: brew services start mysql (macOS)\n";
        echo "2. O intenta: sudo service mysql start (Linux)\n";
    }
}
?>

<?php
// ============================================
// CONFIGURACIÓN PARA CPANEL
// Archivo que debes personalizar según tu hosting
// ============================================

return [
    // ============================================
    // BASE DE DATOS - DESARROLLO LOCAL MYSQL
    // ============================================
    'database' => [
        'host' => 'localhost',
        'name' => 'certificados_db',
        'user' => 'root',
        'pass' => '',  // Sin password en desarrollo local
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]
    ],
    
    // ============================================
    // CONFIGURACIÓN DE LA API  
    // ============================================
    'api' => [
        'base_url' => 'http://localhost:8080/api/',  // URL local para desarrollo
        'version' => '1.0.0',
        'timeout' => 30,
        'max_results_per_page' => 100,
        'enable_cors' => true,
        'allowed_origins' => [
            'https://tudominio.com',
            'https://www.tudominio.com',
            'http://localhost:8000',  // Para desarrollo local
            'http://localhost:8002'   // Para desarrollo local
        ]
    ],
    
    // ============================================
    // CONFIGURACIÓN DE ARCHIVOS
    // ============================================
    'files' => [
        'upload_path' => './uploads/',
        'max_file_size' => 5242880, // 5MB
        'allowed_types' => ['jpg', 'jpeg', 'png', 'pdf'],
        'log_path' => './logs/',
        'temp_path' => './temp/'
    ],
    
    // ============================================
    // CONFIGURACIÓN DE SEGURIDAD
    // ============================================
    'security' => [
        'jwt_secret' => 'tu_jwt_secret_muy_seguro_aqui',
        'password_salt' => 'tu_salt_para_passwords',
        'session_timeout' => 3600, // 1 hora
        'max_login_attempts' => 5,
        'rate_limit_requests' => 100, // por minuto
        'enable_https_only' => true
    ],
    
    // ============================================
    // CONFIGURACIÓN DE EMAIL (para notificaciones)
    // ============================================
    'email' => [
        'smtp_host' => 'mail.tudominio.com',  // SMTP de cPanel
        'smtp_port' => 587,
        'smtp_user' => 'noreply@tudominio.com',
        'smtp_pass' => 'password_email',
        'from_name' => 'Sistema de Certificados',
        'from_email' => 'noreply@tudominio.com'
    ],
    
    // ============================================
    // CONFIGURACIÓN DE LA APLICACIÓN
    // ============================================
    'app' => [
        'name' => 'Sistema de Certificados de Mantenimiento',
        'version' => '1.0.0',
        'timezone' => 'America/Santiago',
        'locale' => 'es_CL',
        'debug' => false, // CAMBIAR A false EN PRODUCCIÓN
        'maintenance_mode' => false
    ],
    
    // ============================================
    // CONFIGURACIÓN DE LOGGING
    // ============================================
    'logging' => [
        'enabled' => true,
        'level' => 'error', // debug, info, warning, error
        'file' => 'app.log',
        'max_size' => 10485760, // 10MB
        'rotate' => true
    ]
];

// ============================================
// INSTRUCCIONES PARA CPANEL
// ============================================
/*

PASOS PARA CONFIGURAR EN CPANEL:

1. CREAR BASE DE DATOS:
   - Ir a "MySQL Databases" en cPanel
   - Crear nueva BD: certificados (se creará como usuario_certificados)
   - Crear nuevo usuario de BD
   - Asignar todos los privilegios al usuario

2. IMPORTAR ESQUEMA:
   - Ir a phpMyAdmin
   - Seleccionar la BD creada
   - Importar el archivo schema.sql

3. SUBIR ARCHIVOS:
   - Crear carpeta "api" en public_html
   - Subir models.php, index.php, config.php
   - Crear carpetas: uploads, logs, temp
   - Dar permisos 755 a las carpetas

4. CONFIGURAR DOMINIOS:
   - Actualizar los allowed_origins con tu dominio real
   - Actualizar base_url con la URL real de tu API

5. CREAR .htaccess EN /api/:
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php [QSA,L]

6. CONFIGURAR ARCHIVO PRINCIPAL:
   - Editar este config.php con tus datos reales
   - Cambiar debug a false en producción

7. PROBAR LA API:
   - https://tudominio.com/api/health
   - https://tudominio.com/api/clientes

*/
?>

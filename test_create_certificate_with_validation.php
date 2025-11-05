<?php
require_once 'api/models.php';

echo "=== CREAR CERTIFICADO CON CÓDIGO DE VALIDACIÓN ===\n";

try {
    // Obtener IDs válidos
    $pdo = Database::getInstance()->getConnection();
    
    $cliente = $pdo->query("SELECT id FROM clientes LIMIT 1")->fetch();
    $instalacion = $pdo->query("SELECT id FROM instalaciones LIMIT 1")->fetch();
    $tecnico = $pdo->query("SELECT id FROM tecnicos LIMIT 1")->fetch();
    
    if (!$cliente || !$instalacion || !$tecnico) {
        echo "❌ No hay datos válidos en la base de datos\n";
        exit(1);
    }
    
    echo "✅ IDs válidos encontrados - Cliente: {$cliente['id']}, Instalación: {$instalacion['id']}, Técnico: {$tecnico['id']}\n";
    
    // Crear certificado
    $certificado = new Certificado();
    $data = [
        'tipo' => 'cctv',
        'cliente_id' => $cliente['id'],
        'instalacion_id' => $instalacion['id'],
        'tecnico_id' => $tecnico['id'],
        'fecha_mantenimiento' => date('Y-m-d'),
        'solicitudes_cliente' => 'Prueba de validación automática',
        'observaciones' => 'Certificado de prueba para verificar código de validación'
    ];
    
    $created = $certificado->create($data);
    
    if ($created) {
        echo "✅ Certificado creado con ID: {$created['id']}\n";
        echo "✅ Número correlativo: {$created['numero_certificado']}\n";
        echo "✅ Código de validación: {$created['codigo_validacion']}\n";
        echo "✅ Formato correcto: " . (preg_match('/^[A-Z]{4}[0-9]{4}[A-Z]{2}$/', $created['codigo_validacion']) ? 'SÍ' : 'NO') . "\n";
        
        // Verificar en base de datos
        $verificacion = $pdo->prepare("SELECT numero_certificado, codigo_validacion FROM certificados WHERE id = ?");
        $verificacion->execute([$created['id']]);
        $cert_db = $verificacion->fetch();
        
        echo "\n=== VERIFICACIÓN EN BASE DE DATOS ===\n";
        echo "Número certificado: {$cert_db['numero_certificado']}\n";
        echo "Código validación: {$cert_db['codigo_validacion']}\n";
        
        echo "\n=== LISTO PARA PROBAR PDF ===\n";
        echo "Ahora puedes ir a certificate-generator.html y crear un certificado.\n";
        echo "El PDF debe mostrar:\n";
        echo "- Header: {$cert_db['numero_certificado']}\n";
        echo "- Footer: {$cert_db['codigo_validacion']}\n";
        
        // NO eliminar el certificado esta vez para poder probarlo
        echo "\n⚠️ CERTIFICADO MANTENIDO PARA PRUEBAS\n";
        
    } else {
        echo "❌ Error al crear certificado\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>

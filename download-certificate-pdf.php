<?php
// ============================================
// GENERADOR DE PDF REAL USANDO CCTV-PDF.JS
// ============================================

$numero = $_GET['numero'] ?? '';

if (empty($numero)) {
    http_response_code(400);
    die('Número de certificado requerido');
}

try {
    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    // Buscar certificado de mantenimiento con todos los datos necesarios
    $stmt = $pdo->prepare("
        SELECT 
            c.numero_certificado,
            c.codigo_validacion,
            c.tipo,
            c.fecha_mantenimiento,
            c.fecha_emision,
            c.estado,
            c.checklist_data,
            c.observaciones_generales,
            c.solicitudes_cliente,
            c.firma_tecnico,
            c.firma_cliente,
            cl.nombre as cliente_nombre,
            cl.rut as cliente_rut,
            cl.direccion as cliente_direccion,
            cl.telefono as cliente_telefono,
            cl.email as cliente_email,
            i.nombre as instalacion_nombre,
            i.direccion as instalacion_direccion,
            t.nombre as tecnico_nombre,
            t.especialidad as tecnico_especialidad,
            e.nombre_empresa,
            e.rut_empresa,
            e.direccion as empresa_direccion,
            e.telefono as empresa_telefono,
            e.email as empresa_email
        FROM certificados c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
        LEFT JOIN instalaciones i ON c.instalacion_id = i.id
        LEFT JOIN tecnicos t ON c.tecnico_id = t.id
        LEFT JOIN empresa e ON e.id = 1
        WHERE c.numero_certificado = ? AND c.estado = 'emitido'
    ");
    
    $stmt->execute([$numero]);
    $certificate = $stmt->fetch();
    
    if (!$certificate) {
        http_response_code(404);
        die('Certificado no encontrado o no emitido');
    }

    // Los equipos están en checklist_data, no en una tabla separada
    $checklistData = json_decode($certificate['checklist_data'], true) ?? [];
    $equipos = $checklistData['equipos'] ?? [];

    // Preparar datos en el formato que espera CCTVPdfGenerator
    $formData = [
        'mantenimientoPreventivo' => true,
        'mantenimientoCorrectivo' => false,
        'instalacion' => false,
        'tipoSistema' => $certificate['tipo'],
        'observaciones' => $certificate['observaciones_generales'] ?? '',
        'solicitudesCliente' => $certificate['solicitudes_cliente'] ?? '',
        'equipos' => $equipos,
        'evidencias' => [], // Las evidencias se pueden agregar después si es necesario
        'checklist' => json_decode($certificate['checklist_data'], true) ?? [],
        'firmas' => [
            'tecnico' => $certificate['firma_tecnico'] ?? '',
            'cliente' => $certificate['firma_cliente'] ?? ''
        ]
    ];

    $info = [
        'cliente' => [
            'nombre' => $certificate['cliente_nombre'],
            'rut' => $certificate['cliente_rut'],
            'direccion' => $certificate['cliente_direccion'] ?? '',
            'telefono' => $certificate['cliente_telefono'] ?? '',
            'email' => $certificate['cliente_email'] ?? ''
        ],
        'instalacion' => [
            'nombre' => $certificate['instalacion_nombre'] ?? 'Instalación Principal',
            'direccion' => $certificate['instalacion_direccion'] ?? ''
        ],
        'tecnico' => [
            'nombre' => $certificate['tecnico_nombre'],
            'especialidad' => $certificate['tecnico_especialidad'] ?? 'General'
        ]
    ];

    $empresa = [
        'nombre' => $certificate['nombre_empresa'],
        'rut' => $certificate['rut_empresa'],
        'direccion' => $certificate['empresa_direccion'],
        'telefono' => $certificate['empresa_telefono'],
        'email' => $certificate['empresa_email']
    ];

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generando Certificado <?php echo htmlspecialchars($certificate['numero_certificado']); ?></title>
    
    <!-- jsPDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- CCTVPdfGenerator -->
    <script src="/js/pdf/cctv-pdf.js"></script>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .success {
            color: #4CAF50;
            font-size: 1.2em;
            margin: 20px 0;
        }
        
        .error {
            color: #f44336;
            font-size: 1.2em;
            margin: 20px 0;
        }
        
        .btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Generando Certificado PDF</h2>
        <p>Certificado: <strong><?php echo htmlspecialchars($certificate['numero_certificado']); ?></strong></p>
        
        <div class="loader" id="loader"></div>
        <div id="status">Preparando generación del PDF...</div>
        
        <div id="result" style="display: none;">
            <div class="success" id="success" style="display: none;">
                ✅ PDF generado correctamente y descargado
            </div>
            <div class="error" id="error" style="display: none;">
                ❌ Error al generar el PDF
            </div>
            
            <button class="btn" onclick="window.close()">Cerrar Ventana</button>
            <a href="/validate.html" class="btn">Volver al Validador</a>
        </div>
    </div>

    <script>
        // Datos del certificado desde PHP
        const certificateData = {
            formData: <?php echo json_encode($formData, JSON_UNESCAPED_UNICODE); ?>,
            info: <?php echo json_encode($info, JSON_UNESCAPED_UNICODE); ?>,
            empresa: <?php echo json_encode($empresa, JSON_UNESCAPED_UNICODE); ?>,
            code: <?php echo json_encode($certificate['codigo_validacion']); ?>,
            certificateNumber: <?php echo json_encode($certificate['numero_certificado']); ?>,
            evidencias: []
        };
        
        // Función para actualizar el estado
        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }
        
        // Función para mostrar resultado
        function showResult(success, message = '') {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('status').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            
            if (success) {
                document.getElementById('success').style.display = 'block';
                if (message) document.getElementById('success').textContent = message;
            } else {
                document.getElementById('error').style.display = 'block';
                if (message) document.getElementById('error').textContent = message;
            }
        }
        
        // Generar PDF cuando se carga la página
        window.addEventListener('load', async function() {
            try {
                updateStatus('Iniciando generador de PDF...');
                
                // Verificar que CCTVPdfGenerator esté disponible
                if (!window.CCTVPdfGenerator) {
                    throw new Error('CCTVPdfGenerator no está disponible');
                }
                
                updateStatus('Configurando datos del certificado...');
                
                // Crear instancia del generador
                const generator = new window.CCTVPdfGenerator();
                
                updateStatus('Generando PDF...');
                
                // Generar PDF
                const result = await generator.generate({
                    formData: certificateData.formData,
                    info: certificateData.info,
                    empresa: certificateData.empresa,
                    code: certificateData.code,
                    certificateNumber: certificateData.certificateNumber,
                    evidencias: certificateData.evidencias,
                    autoSave: true // Esto debería activar la descarga automática
                });
                
                updateStatus('PDF generado correctamente');
                showResult(true, '✅ PDF descargado correctamente');
                
            } catch (error) {
                console.error('Error generando PDF:', error);
                showResult(false, `❌ Error: ${error.message}`);
            }
        });
    </script>
</body>
</html>

<?php
} catch (PDOException $e) {
    http_response_code(500);
    die('Error de base de datos: ' . $e->getMessage());
} catch (Exception $e) {
    http_response_code(500);
    die('Error interno del servidor: ' . $e->getMessage());
}
?>

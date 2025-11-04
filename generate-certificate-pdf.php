<?php
// ============================================
// GENERADOR DE PDF PARA CERTIFICADOS DE MANTENIMIENTO
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
    
    // Buscar certificado de mantenimiento
    $stmt = $pdo->prepare("
        SELECT 
            c.numero_certificado,
            c.codigo_validacion,
            c.tipo,
            c.fecha_mantenimiento,
            c.fecha_emision,
            c.estado,
            cl.nombre as cliente_nombre,
            cl.rut as cliente_rut,
            t.nombre as tecnico_nombre,
            t.especialidad as tecnico_especialidad,
            e.nombre_empresa,
            e.rut_empresa,
            e.direccion as empresa_direccion,
            e.telefono as empresa_telefono,
            e.email as empresa_email
        FROM certificados c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
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
    
    // Formatear tipo de mantenimiento
    $tiposMantenimiento = [
        'cctv' => 'Mantenimiento de Sistema CCTV',
        'hardware' => 'Mantenimiento de Hardware Computacional',
        'racks' => 'Mantenimiento de Racks de Comunicaciones'
    ];
    
    $tipoMantenimiento = $tiposMantenimiento[$certificate['tipo']] ?? ucfirst($certificate['tipo']);
    
    // Detectar si se solicita descarga directa
    $forceDownload = isset($_GET['download']) && $_GET['download'] === 'true';
    
    // Generar HTML para PDF
    if ($forceDownload) {
        // Para descarga: enviar cabeceras que fuercen la visualización en el navegador para PDF
        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: inline; filename="Certificado_' . $certificate['numero_certificado'] . '.html"');
    } else {
        // Para visualización normal
        header('Content-Type: text/html; charset=utf-8');
    }
    
    echo "<!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <title>Certificado de Mantenimiento - {$certificate['numero_certificado']}</title>
        <style>
            @page { 
                size: A4; 
                margin: 1.5cm; 
            }
            
            @media print {
                body { 
                    margin: 0; 
                    padding: 0;
                    background: white !important;
                }
                .certificate-container {
                    border: none !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    padding: 20px !important;
                    background: white !important;
                }
                /* Ocultar elementos flotantes al imprimir */
                div[style*="position: fixed"] {
                    display: none !important;
                }
            }
            
            body { 
                font-family: 'Arial', sans-serif; 
                margin: 0; 
                padding: 20px;
                background: #ffffff;
                color: #333;
                line-height: 1.6;
            }
            .certificate-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                border: 3px solid #2563eb;
                border-radius: 15px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
            }
            .company-logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .certificate-title {
                font-size: 28px;
                font-weight: bold;
                color: #1e40af;
                margin: 20px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .certificate-subtitle {
                font-size: 18px;
                color: #64748b;
                margin-bottom: 30px;
            }
            .content-section {
                margin: 30px 0;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
            }
            .info-block {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .info-title {
                font-size: 16px;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .info-item {
                margin: 8px 0;
                font-size: 14px;
            }
            .info-label {
                font-weight: bold;
                color: #475569;
                display: inline-block;
                width: 120px;
            }
            .info-value {
                color: #1e293b;
            }
            .certificate-number {
                font-size: 20px;
                font-weight: bold;
                color: #dc2626;
                text-align: center;
                margin: 30px 0;
                padding: 15px;
                background: #fef2f2;
                border: 2px solid #dc2626;
                border-radius: 8px;
            }
            .validation-code {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f0f9ff;
                border: 2px solid #0ea5e9;
                border-radius: 8px;
            }
            .validation-code .code {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #0c4a6e;
                letter-spacing: 3px;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                border-top: 2px solid #e2e8f0;
                padding-top: 20px;
                font-size: 12px;
                color: #64748b;
            }
            .signature-section {
                margin-top: 40px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 50px;
            }
            .signature-box {
                text-align: center;
                padding-top: 40px;
            }
            .signature-line {
                border-top: 2px solid #333;
                margin-bottom: 10px;
            }
            .signature-label {
                font-size: 12px;
                color: #64748b;
                font-weight: bold;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                background: #dcfce7;
                color: #166534;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
        </style>
    </head>
    <body>
        <div class='certificate-container'>
            <div class='header'>
                <div class='company-logo'>
                    <i class='fas fa-network-wired'></i> {$certificate['nombre_empresa']}
                </div>
                <div class='certificate-title'>Certificado de Mantenimiento</div>
                <div class='certificate-subtitle'>{$tipoMantenimiento}</div>
                <div class='status-badge'>✓ Certificado Emitido</div>
            </div>
            
            <div class='certificate-number'>
                Certificado N° {$certificate['numero_certificado']}
            </div>
            
            <div class='info-grid'>
                <div class='info-block'>
                    <div class='info-title'>Información del Cliente</div>
                    <div class='info-item'>
                        <span class='info-label'>Cliente:</span>
                        <span class='info-value'>{$certificate['cliente_nombre']}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>RUT:</span>
                        <span class='info-value'>{$certificate['cliente_rut']}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Fecha Emisión:</span>
                        <span class='info-value'>" . date('d/m/Y', strtotime($certificate['fecha_emision'])) . "</span>
                    </div>
                </div>
                
                <div class='info-block'>
                    <div class='info-title'>Técnico Responsable</div>
                    <div class='info-item'>
                        <span class='info-label'>Técnico:</span>
                        <span class='info-value'>{$certificate['tecnico_nombre']}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Especialidad:</span>
                        <span class='info-value'>{$certificate['tecnico_especialidad']}</span>
                    </div>
                    <div class='info-item'>
                        <span class='info-label'>Fecha Mantenim.:</span>
                        <span class='info-value'>" . date('d/m/Y', strtotime($certificate['fecha_mantenimiento'])) . "</span>
                    </div>
                </div>
            </div>
            
            <div class='validation-code'>
                <div style='font-size: 14px; color: #64748b; margin-bottom: 10px;'>
                    Código de Validación
                </div>
                <div class='code'>{$certificate['codigo_validacion']}</div>
                <div style='font-size: 12px; color: #64748b; margin-top: 10px;'>
                    Valide este certificado en: http://localhost:8085/validate.html
                </div>
            </div>
            
            <div class='signature-section'>
                <div class='signature-box'>
                    <div class='signature-line'></div>
                    <div class='signature-label'>Técnico Responsable</div>
                    <div style='font-size: 11px; margin-top: 5px;'>{$certificate['tecnico_nombre']}</div>
                </div>
                <div class='signature-box'>
                    <div class='signature-line'></div>
                    <div class='signature-label'>Empresa</div>
                    <div style='font-size: 11px; margin-top: 5px;'>{$certificate['nombre_empresa']}</div>
                </div>
            </div>
            
            <div class='footer'>
                <strong>{$certificate['nombre_empresa']}</strong><br>
                RUT: {$certificate['rut_empresa']} | {$certificate['empresa_direccion']}<br>
                Teléfono: {$certificate['empresa_telefono']} | Email: {$certificate['empresa_email']}<br>
                <br>
                Este certificado es válido y verificable mediante el código de validación.
            </div>
        </div>
        <script>
            // Auto-configurar para PDF cuando se carga desde el validador
            window.onload = function() {
                const isFromValidator = document.referrer.includes('validate.html') || 
                                      new URLSearchParams(window.location.search).get('download') === 'true';
                
                if (isFromValidator) {
                    // Configurar título para el PDF
                    document.title = 'Certificado_<?php echo $certificate['numero_certificado']; ?>';
                    
                    // Mostrar instrucciones después de cargar
                    setTimeout(() => {
                        const instructions = document.createElement('div');
                        instructions.innerHTML = `
                            <div style="position: fixed; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 15px; border-radius: 8px; z-index: 1000; font-family: Arial, sans-serif; font-size: 14px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                                <strong>💡 Para guardar como PDF:</strong><br>
                                • Presiona <kbd>Ctrl+P</kbd> (Windows) o <kbd>Cmd+P</kbd> (Mac)<br>
                                • Selecciona "Guardar como PDF"<br>
                                • Haz clic en "Guardar"
                                <br><br>
                                <button onclick="window.print()" style="background: white; color: #4CAF50; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir/Guardar</button>
                                <button onclick="this.parentElement.remove()" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">×</button>
                            </div>
                        `;
                        document.body.appendChild(instructions);
                        
                        // Remover automáticamente después de 10 segundos
                        setTimeout(() => {
                            if (instructions.parentElement) {
                                instructions.parentElement.removeChild(instructions);
                            }
                        }, 10000);
                    }, 1000);
                }
            };
            
            // Mejorar el estilo para impresión
            window.onbeforeprint = function() {
                // Ocultar instrucciones al imprimir
                const instructions = document.querySelector('div[style*="position: fixed"]');
                if (instructions) {
                    instructions.style.display = 'none';
                }
            };
            
            window.onafterprint = function() {
                // Mostrar instrucciones después de imprimir
                const instructions = document.querySelector('div[style*="position: fixed"]');
                if (instructions) {
                    instructions.style.display = 'block';
                }
            };
        </script>
    </body>
    </html>";
    
} catch (PDOException $e) {
    http_response_code(500);
    die('Error de base de datos');
} catch (Exception $e) {
    http_response_code(500);
    die('Error interno del servidor');
}
?>

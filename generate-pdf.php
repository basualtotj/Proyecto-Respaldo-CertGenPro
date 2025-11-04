<?php
// ============================================
// GENERADOR BÁSICO DE PDF PARA CERTIFICADOS
// ============================================

$code = $_GET['code'] ?? '';

if (empty($code)) {
    http_response_code(400);
    die('Código de verificación requerido');
}

try {
    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['database'];
    
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['name']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], $dbConfig['options']);
    
    // Buscar certificado
    $stmt = $pdo->prepare("
        SELECT * FROM certificados_cursos 
        WHERE codigo_verificacion = ? AND estado = 'approved'
    ");
    $stmt->execute([$code]);
    $certificate = $stmt->fetch();
    
    if (!$certificate) {
        http_response_code(404);
        die('Certificado no encontrado o no aprobado');
    }
    
    // Generar HTML para PDF (simulación)
    header('Content-Type: text/html; charset=utf-8');
    
    echo "<!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <title>Certificado - {$certificate['nombre_completo']}</title>
        <style>
            @page { 
                size: A4 landscape; 
                margin: 2cm; 
            }
            body { 
                font-family: 'Georgia', serif; 
                margin: 0; 
                padding: 20px;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            }
            .certificate {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                border: 8px solid #2c5282;
                border-radius: 20px;
                background: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                text-align: center;
                min-height: 500px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .header {
                border-bottom: 3px solid #2c5282;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .title {
                font-size: 36px;
                font-weight: bold;
                color: #2c5282;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .subtitle {
                font-size: 18px;
                color: #4a5568;
                font-style: italic;
            }
            .content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .recipient {
                font-size: 28px;
                font-weight: bold;
                color: #2d3748;
                margin: 20px 0;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 10px;
            }
            .course-info {
                font-size: 20px;
                color: #4a5568;
                margin: 15px 0;
                line-height: 1.6;
            }
            .details {
                margin: 30px 0;
                font-size: 16px;
                color: #718096;
            }
            .verification {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                font-size: 14px;
                color: #a0aec0;
            }
            .print-only {
                display: none;
            }
            @media print {
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                body { background: white; }
            }
        </style>
    </head>
    <body>
        <div class='certificate'>
            <div class='header'>
                <div class='title'>Certificado de Participación</div>
                <div class='subtitle'>Sistema de Certificados de Cursos</div>
            </div>
            
            <div class='content'>
                <div style='font-size: 18px; margin-bottom: 20px;'>Se certifica que</div>
                
                <div class='recipient'>{$certificate['nombre_completo']}</div>
                
                <div style='font-size: 18px; margin: 20px 0;'>ha completado satisfactoriamente el curso</div>
                
                <div class='course-info'>
                    <strong>\"{$certificate['nombre_curso']}\"</strong>
                </div>
                
                <div class='details'>
                    <div>Instructor: <strong>{$certificate['nombre_instructor']}</strong></div>
                    <div>Duración: <strong>{$certificate['duracion_horas']} horas académicas</strong></div>
                    <div>Fecha de finalización: <strong>" . date('d \d\e F \d\e Y', strtotime($certificate['fecha_emision'])) . "</strong></div>
                </div>
            </div>
            
            <div class='verification'>
                <div>Código de verificación: <strong>{$certificate['codigo_verificacion']}</strong></div>
                <div>Validar en: https://certificados.com/validate.html</div>
                <div>Emitido el: " . date('d/m/Y H:i', strtotime($certificate['fecha_aprobacion'] ?: $certificate['created_at'])) . "</div>
            </div>
        </div>
        
        <div class='no-print' style='text-align: center; margin-top: 20px;'>
            <button onclick='window.print()' style='background: #2c5282; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;'>
                <i class='fas fa-print'></i> Imprimir Certificado
            </button>
            <button onclick='window.close()' style='background: #718096; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;'>
                Cerrar
            </button>
        </div>
    </body>
    </html>";
    
} catch (Exception $e) {
    http_response_code(500);
    die('Error generando el certificado');
}

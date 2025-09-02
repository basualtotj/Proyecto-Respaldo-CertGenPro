<?php
// ============================================
// ENHANCED ROUTER FOR ADMIN AND API REQUESTS
// Router mejorado que maneja rutas de admin y API
// ============================================

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Log de requests para debugging
error_log("Router: $method $path");

// Static files (allow direct access)
$static_extensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf'];
$extension = pathinfo($path, PATHINFO_EXTENSION);

if (in_array(strtolower($extension), $static_extensions)) {
    return false; // Let the server handle static files
}

// Admin API routes
if (strpos($path, '/admin-api/') === 0 || strpos($path, '/api/admin.php/') !== false) {
    require_once __DIR__ . '/api/admin.php';
    exit();
}

// Regular API routes
if (strpos($path, '/api/') === 0) {
    // Remove /api prefix and route to main API
    $_SERVER['REQUEST_URI'] = substr($request_uri, 4);
    require_once __DIR__ . '/api/index.php';
    exit();
}

// Admin panel
if ($path === '/admin-panel.html' || $path === '/admin-panel') {
    require_once __DIR__ . '/admin-panel.html';
    exit();
}

// Main application routes
switch ($path) {
    case '/':
    case '/index.html':
        require_once __DIR__ . '/index.html';
        break;
        
    case '/admin':
    case '/admin.html':
        require_once __DIR__ . '/admin.html';
        break;
        
    case '/documentos':
    case '/documentos.html':
        require_once __DIR__ . '/documentos.html';
        break;
        
    case '/health':
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'healthy',
            'timestamp' => date('c'),
            'php_version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
        ]);
        break;
        
    default:
        // Check if file exists
        $file = __DIR__ . $path;
        if (file_exists($file) && is_file($file)) {
            return false; // Let server handle the file
        }
        
        // 404 - Not found
        http_response_code(404);
        if (strpos($path, '/api/') === 0) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Endpoint no encontrado',
                'path' => $path
            ]);
        } else {
            echo '<!DOCTYPE html>
<html>
<head>
    <title>404 - Página no encontrada</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
        .back-link { color: #3498db; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>404 - Página no encontrada</h1>
    <p>La página que buscas no existe.</p>
    <p><a href="/" class="back-link">Volver al inicio</a></p>
</body>
</html>';
        }
        break;
}
?>

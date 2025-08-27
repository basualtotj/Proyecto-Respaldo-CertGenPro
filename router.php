<?php
// Router para PHP Development Server
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Si es una petición a /api/*, redirigir al index.php de la API
if (strpos($path, '/api/') === 0) {
    $_SERVER['REQUEST_URI'] = $path;
    include 'api/index.php';
    exit;
}

// Para archivos estáticos, devolver false para que el servidor los maneje
if (file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false;
}

// Para rutas que no son API, servir index.html
if ($path === '/' || !file_exists(__DIR__ . $path)) {
    include 'index.html';
    exit;
}

return false;
?>

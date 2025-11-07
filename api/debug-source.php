<?php
// Debug para mostrar qué archivo está procesando el API
echo json_encode([
    'debug' => 'API Debug Info',
    'file' => __FILE__,
    'directory' => __DIR__,
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'NO_URI',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'NO_METHOD',
    'timestamp' => date('c'),
    'pwd' => getcwd()
], JSON_PRETTY_PRINT);
?>

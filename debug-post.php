<?php
// Test para debug del servidor Python
echo "PHP Debug Test\n";
echo "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'None') . "\n";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    echo "RAW INPUT: " . $input . "\n";
    $decoded = json_decode($input, true);
    echo "DECODED: " . print_r($decoded, true) . "\n";
}
?>

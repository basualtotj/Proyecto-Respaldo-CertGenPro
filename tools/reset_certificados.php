<?php
// Admin utility: delete all certificados and reset counters to 100
// Usage (CLI): php api/tools/reset_certificados.php

require_once __DIR__ . '/../models.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    // Intentar usar transacciones si el motor las soporta
    $supportsTx = true;
    try { $conn->beginTransaction(); } catch (Exception $e) { $supportsTx = false; }

    // Count existing certificados
    $stmt = $db->query("SELECT COUNT(*) AS c FROM certificados");
    $row = $stmt->fetch();
    $total = (int)($row['c'] ?? 0);

    // Delete certificados
    $db->query("DELETE FROM certificados");

    // Reset auto increment (best-effort)
    try { $db->query("ALTER TABLE certificados AUTO_INCREMENT = 1"); } catch (Exception $e) {}

    // Reset configuracion counters
    $config = new Configuracion();
    foreach (['cctv','hardware','racks'] as $tipo) {
        $config->setValue('contador_' . $tipo, 100, 'number');
    }

    // Reset contadores table if present
    try {
        $db->query("UPDATE contadores SET siguiente = 100 WHERE tipo IN ('cctv','hardware','racks')");
    } catch (Exception $e) {
        // ignore if table doesn't exist
    }

    if ($supportsTx && $conn->inTransaction()) { $conn->commit(); }

    echo "OK: certificados eliminados={$total}, contadores=100\n";
    exit(0);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) { try { $conn->rollBack(); } catch (Exception $e2) {} }
    fwrite(STDERR, 'ERROR: ' . $e->getMessage() . "\n");
    exit(1);
}

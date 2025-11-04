<?php
/**
 * Archivo de protección para páginas de administrador
 * Incluir al inicio de cualquier página que requiera permisos de admin
 */

session_start();

function requireAdminAuth($redirectOnFailure = true) {
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['rol'])) {
        if ($redirectOnFailure) {
            header('Location: login.html');
            exit;
        }
        return false;
    }
    
    // Verificar que sea administrador
    if ($_SESSION['rol'] !== 'admin') {
        if ($redirectOnFailure) {
            // Log del intento de acceso no autorizado
            error_log("SECURITY: Usuario {$_SESSION['username']} (rol: {$_SESSION['rol']}) intentó acceder a página de admin desde IP: " . $_SERVER['REMOTE_ADDR']);
            header('Location: user-landing.php');
            exit;
        }
        return false;
    }
    
    return true;
}

function requireUserAuth($redirectOnFailure = true) {
    // Verificar que el usuario esté logueado (cualquier rol)
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['rol'])) {
        if ($redirectOnFailure) {
            header('Location: login.html');
            exit;
        }
        return false;
    }
    
    return true;
}

function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'nombre' => $_SESSION['nombre'] ?? $_SESSION['username'],
        'rol' => $_SESSION['rol']
    ];
}

function isAdmin() {
    return isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin';
}

function isTecnico() {
    return isset($_SESSION['rol']) && $_SESSION['rol'] === 'tecnico';
}
?>

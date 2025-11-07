# Respaldo Completo - 2025-11-07

Este archivo documenta el snapshot completo del repositorio para recuperación ante desastres.

## Ramas/Tags de Respaldo
- Rama snapshot completa: `backup/full-2025-11-07-all`
- Rama parcial previa: `backup/full-2025-11-07`
- Tag de instrucciones: `backup-2025-11-07-instructions`

## Alcance del Snapshot
- Incluye todos los cambios sin commitear previos, nuevos archivos de depuración, vistas de prueba y ajustes PDF.
- Archivos destacados:
  - `.github/AI-INSTRUCTIONS-MANDATORY.md` y `.github/copilot-instructions.md` (actualizados)
  - `api/index.php`, `api/models.php` (flujo de certificados/codigo_validacion)
  - `js/data-service.js` (API-only, retry/timeout)
  - `js/pdf/cctv-pdf.js`, `js/pdf/hardware-pdf.js` (layout y evidencias)
  - `validate.php`, scripts de debug y pruebas

## Cómo Restaurar
- Usar la rama completa:
  - `git checkout backup/full-2025-11-07-all`
- O restaurar un archivo específico desde el tag:
  - `git checkout backup-2025-11-07-instructions -- .github/`

## Notas
- Puertos: Frontend 8080, API 8083 (`router.php`).
- DataService: API-only, no habilitar JSON.
- Validación: `codigo_validacion` generado en backend y usado en PDF/validación pública.

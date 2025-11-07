# Release v2025.11.07-backup-full

Snapshot completo del estado funcional del proyecto CertGen Pro.

## Contenido Principal
- Instrucciones IA actualizadas: `.github/AI-INSTRUCTIONS-MANDATORY.md`, `.github/copilot-instructions.md`.
- Generadores PDF: CCTV y Hardware alineados (“EQUIPOS ATENDIDOS”, evidencias multipágina orientación). 
- Backend API-only estable: `api/index.php`, `api/models.php`, `models.php` (Singleton DB + CRUD JSON arrays).
- Servicio datos: `js/data-service.js` (retry, timeout, sin fallback JSON).
- Flujo validación: generación y uso de `codigo_validacion` en creación, descarga y verificación pública.

## Puertos
- Frontend: 8080
- API PHP (router): 8083

## Recuperación Rápida
Clonar y checkout tag:
```bash
git clone https://github.com/basualtotj/Proyecto-Respaldo-CertGenPro.git
cd Proyecto-Respaldo-CertGenPro
git checkout v2025.11.07-backup-full
```

## Próximos Pasos Sugeridos
- Implementar generador PDF Racks reutilizando patrón.
- Unificar spacing evidencias Hardware vs CCTV si persisten diferencias mínimas.
- Añadir tests ligeros de endpoints críticos (health, creación certificado, validación código).

## Integridad
Verificado que no quedaron archivos sin commitear antes del tag.

---
Generado: 2025-11-07

<!-- Archivo de instrucciones específicas para agentes IA trabajando en este repositorio -->

# 🧭 Guía Rápida para Agentes IA (CertGen Pro)

## 0. Antes de tocar nada
Lee primero: `.github/AI-INSTRUCTIONS-MANDATORY.md`, `PROJECT-CURRENT-STATUS.md`, `ARCHITECTURE-DECISIONS.md`. Confirma con el usuario antes de cambios en archivos críticos (abajo listados). Todo en ESPAÑOL.

## 1. Propósito del Proyecto
Sistema web que genera certificados técnicos PDF (CCTV, Hardware, Racks) con datos de clientes, instalaciones y técnicos desde MySQL. El flujo clave: UI Formulario → Recolección datos → Generador PDF jsPDF → Persistencia en MySQL → Código de validación mostrado en footer.

## 2. Arquitectura Resumida
- Frontend plano (HTML + Vanilla JS + Tailwind puntual) servido estáticamente.
- Capa de datos única vía API PHP (`DataService` en `js/data-service.js`). Forzado a modo API (sin fallback JSON).
- Backend PHP modular: `models.php` (DB + modelos), endpoints agrupados en `api/`.*
- Generadores PDF específicos por tipo en `js/pdf/*-pdf.js` (ejemplo: `cctv-pdf.js`). Cada uno: header → página 1 (datos, checklist, firmas) → páginas evidencia.
- Logs: `logs/database.log` captura errores de DB.
 - Puertos: Frontend 8080, API PHP 8083 (`router.php`). No cambiar.

## 3. Patrones Clave
- Singleton DB: clase `Database` en `models.php` con reconexión transparente y logging `logError()`.
- BaseModel CRUD genérico (`findAll`, `findById`, `create`, `update`, `delete`, `count`). Arrays se serializan a JSON automáticamente.
- DataService: siempre `apiCall()` con retry (3 intentos, timeout 7s). NO habilitar modo JSON; métodos que intentan cambiarlo se fuerzan a API.
- PDF Layout: Gradiente horizontal manual (franjas), barra azul fina, títulos en Helvetica bold 9–10pt, reglas sutiles (`grayLight`), márgenes 15mm A4. Evidencias: páginas adicionales con header/footer repetido.
- Validación: Footer incluye `validationCode` recibido desde backend al guardar certificado.
- Checklist Hardware/Racks/CCTV: textos breves, distribución 4x2 o columnas adaptativas; evitar desbordes ajustando tamaños y anchos calculados (ver `drawFlexRow` en `cctv-pdf.js`).

## 4. Flujo de Guardado Certificado
1. Usuario completa formulario y selecciona evidencias (imágenes).
2. Frontend arma `certificateData` y llama `DataService.saveCertificate()`.
3. Backend genera correlativo + código validación → responde JSON.
4. Generador PDF usa `validationCode` en header/footer y descarga archivo.

## 5. Workflows / Comandos
- Servir frontend estático (ya corriendo): `python3 -m http.server 8080`.
- Servidor PHP alterno API: `php -S 127.0.0.1:8083 router.php` (no cambiar puerto principal 8080 del panel).
- Healthcheck rápido: GET `http://127.0.0.1:8083/api/health` (usado en `verifyApiConnection`).
- Logs DB: inspeccionar `logs/database.log` si hay errores en queries.
 - Ver último certificado + código: revisar `monitor_certificados.php`.

## 6. Convenciones
- Idioma: español en comentarios y documentación.
- Evitar introducir frameworks pesados; mantener Vanilla JS/PHP simple.
- No crear nuevas capas de auth; usar única verificación existente.
- Código que funciona: sólo optimizar si aporta valor claro (performance, legibilidad sin riesgo).
- Mantener nombres de campos actuales para compatibilidad (arrays → JSON en DB).

## 7. Archivos Críticos (modificar sólo con confirmación)
- `admin-panel.php` (panel principal y auth única)
- `api/models.php` (DB + modelos)
- `js/data-service.js` (servicio API)
- `js/pdf/cctv-pdf.js` y análogos si ya validados (referencia de layout)
 - `api/index.php` (creación certificados y generación `codigo_validacion`)
 - `validate-api.php` (verificación pública de códigos)

## 8. DO / DON'T
DO: mejorar CSS, reducir duplicación evidente, agregar logs debug, documentar cambios.
DON'T: cambiar puertos, agregar auth extra, duplicar lógica del panel, forzar modo JSON, romper layout PDF validado.
 DON'T extra: cambiar estructura de payload certificado sin alinear backend (`api/index.php`).

## 9. Ejemplos Rápidos
- Llamada API: `this.apiCall('/clientes')` dentro de `DataService.getClientes()`.
- Ajuste layout PDF: ver `_drawHorizontalGradient` y `sectionTitle` en `cctv-pdf.js` para replicar estilo.
- Serialización arrays antes de insert: en `BaseModel.create()` se convierte cada array a `json_encode`.
 - Generación código validación (flujo): envío POST `DataService.saveCertificate()` → backend añade `codigo_validacion` único → PDF lo inserta en header/footer.
 - Validación pública: POST `validate-api.php` con `{codigo_validacion}` devuelve certificado si estado = 'emitido'.

## 10. Cómo Extender (Seguro)
Checklist creación NUEVO tipo (ej. Racks):
1. Clonar archivo base `js/pdf/cctv-pdf.js` → `racks-pdf.js` manteniendo header/footer.
2. Ajustar textos sección (ej. `SISTEMA RACKS`) y título “EQUIPOS ATENDIDOS” si aplica.
3. Definir checklist 4x2 (nombres cortos) y mapear en formulario HTML (mantener names existentes estilo snake_case).
4. Reutilizar lógica evidencias (orientación, paginado) sin simplificar.
5. Asegurar que el payload `tipo` = 'racks' y se aceptará en backend (`api/index.php`).
6. Insertar `validationCode` en header/footer igual que otros tipos.
7. Probar creación y validar código vía `validate-api.php`.
NO reinventar `DataService`, ni duplicar conexión DB.

## 11. Regla de Oro
Si funciona, no lo toques. Si no entiendes el contexto, pregunta primero.

---
Última revisión: 7 nov 2025

# 🚨 INSTRUCCIONES OBLIGATORIAS PARA IA - LEER ANTES DE CUALQUIER CAMBIO

## ⚠️ STOP - LEE ESTO PRIMERO ⚠️

**ANTES de hacer CUALQUIER cambio en este proyecto:**

1. ✅ **LEE** completamente este archivo
2. ✅ **LEE** el archivo `PROJECT-CURRENT-STATUS.md`
3. ✅ **LEE** el archivo `ARCHITECTURE-DECISIONS.md`
4. ✅ **CONFIRMA** con el usuario antes de modificar archivos críticos
5. ✅ **MIRA LOGS** si algo falla: `logs/database.log` (errores DB)

---

## 🎯 REGLAS FUNDAMENTALES

### ❌ **NO HAGAS ESTO:**
- **NO agregues nuevas capas de autenticación** sin consultar
- **NO dupliques funcionalidad existente**
- **NO modifiques admin-panel.php** sin revisar el historial
- **NO crees** nuevos archivos `auth-*` sin justificación
- **NO cambies puertos**: Frontend 8080, API PHP 8083 (router.php)
- **NO habilites modo JSON** en `DataService` (la app es API-only)
- **TODO** en ESPAÑOL (comentarios, PRs, notas)
### ✅ **SÍ PUEDES HACER:**
- Corregir bugs evidentes
- Mejorar documentación
- Optimizar código existente sin romper flujos
- Agregar logs de debugging (consola/DB)

---

## 🏗️ Arquitectura crítica (resumen)
- Frontend estático (HTML + JS + Tailwind puntual) servido en 8080.
- Backend PHP (router.php) expone `/api/*` en 127.0.0.1:8083.
- `js/data-service.js` forzado a API (sin fallback JSON) con `verifyApiConnection()` y retry.
- DB MySQL vía `models.php` (Singleton `Database`, `BaseModel` CRUD; arrays → JSON al guardar).
- Generadores PDF por tipo en `js/pdf/*-pdf.js` (header/footer comunes, evidencias multipágina).

## 🗂️ Archivos CRÍTICOS (pedir confirmación antes de cambios)
- `admin-panel.php` (auth única y panel)
- `models.php` (DB Singleton, BaseModel)
- `api/index.php` y `api/models.php` (endpoints y lógica certificados)
- `js/data-service.js` (servicio API-only, timeouts/retry)
- `js/pdf/cctv-pdf.js`, `js/pdf/hardware-pdf.js` (referencia de layout PDF)

## 🔑 Código de validación (flujo)
- Se genera al crear certificado si falta `codigo_validacion`.
- Unicidad verificada en DB; expuesto en respuestas y usado en PDF.
- Referencias: `api/index.php` (create certificados), `api/models.php::generateCodigoValidacion()`, `validate-api.php` y `download-certificate-pdf.php`.

## 🔎 Qué revisar si cambias algo
- Cambios de payload/guardado: `js/data-service.js`, `api/index.php`, `api/models.php`, `models.php`.
- Cambios de diseño PDF: el generador correspondiente en `js/pdf/` y mantener header/footer idénticos.
- Validación/descarga: `download-certificate-pdf.php`, `validate-api.php`.
- Errores DB: `logs/database.log`.

---

## 🧠 MEMORIA DEL PROYECTO

### **PROBLEMA RESUELTO: AUTENTICACIÓN REDUNDANTE**
- **FECHA:** 6 nov 2025
- **PROBLEMA:** Múltiples capas de auth causando redirects infinitos
- **SOLUCIÓN:** Una sola verificación PHP en admin-panel.php línea 5-8
- **ARCHIVOS AFECTADOS:** admin-panel.php, auth-protection.php (deshabilitado)

### **ESTADO ACTUAL:**
- ✅ admin-panel.php consolidado con datos reales
- ✅ Estadísticas: 82 certificados, 4 clientes, 5 técnicos
- ✅ Una sola verificación de autenticación activa
- ✅ Frontend en :8080 y API PHP en :8083 (router.php)
- ✅ `DataService` en modo API-only (sin JSON)
- ✅ Generadores PDF (CCTV/Hardware) con “EQUIPOS ATENDIDOS” y evidencias multipágina

---

## 📋 CHECKLIST ANTES DE MODIFICAR

Antes de hacer cambios, pregúntate:

- [ ] ¿He leído toda la documentación?
- [ ] ¿Entiendo el problema actual?
- [ ] ¿Mi solución duplica funcionalidad existente?
- [ ] ¿He confirmado con el usuario?
- [ ] ¿He actualizado esta documentación?

---

## 🆘 CONTACTO DE EMERGENCIA

Si encuentras conflictos o problemas:
1. **DETENTE** inmediatamente
2. **PREGUNTA** al usuario sobre el contexto
3. **REVISA** los archivos de documentación
4. **NO ASUMAS** nada sobre implementaciones anteriores

---

## 📝 HISTORIAL DE CAMBIOS

### 2025-11-06: Consolidación Admin Panel
- Problema: Múltiples verificaciones auth causando redirects
- Solución: Simplificación a una sola verificación
- Estado: RESUELTO ✅

### 2025-11-07: Alineación Arquitectura y PDFs
- Decisión: App API-only (no JSON). `DataService` forzado a API con retry/timeout
- Puertos: Frontend 8080, API 8083 (router.php)
- PDF: Cambio “EQUIPOS INSTALADOS” → “EQUIPOS ATENDIDOS”. Evidencias Hardware clonadas de CCTV (orientación, paginado)
- Validación: Confirmado flujo `codigo_validacion` auto-generado y usado en header/footer y validación pública

### [Agregar nuevos cambios aquí]

---

**RECUERDA: Es mejor preguntar 5 veces que romper algo que funciona** 🛡️

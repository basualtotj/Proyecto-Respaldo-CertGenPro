# 🚀 **MANUAL DE INSTALACIÓN EN CPANEL**
## Sistema de Certificados de Mantenimiento - Versión MySQL

### 📋 **PRERREQUISITOS**
- Hosting con cPanel
- PHP 7.4 o superior  
- MySQL 5.7 o superior
- Acceso a phpMyAdmin
- Dominio configurado

---

## 🗄️ **PASO 1: CONFIGURAR BASE DE DATOS**

### 1.1 Crear Base de Datos
```bash
1. Ir a cPanel > MySQL Databases
2. Crear nueva base de datos: "certificados"
   (Se creará como: tuusuario_certificados)
3. Anotar el nombre completo generado
```

### 1.2 Crear Usuario de Base de Datos
```bash
1. En la misma página, crear nuevo usuario:
   - Usuario: certificados_user
   - Password: [generar password seguro]
2. Agregar usuario a la base de datos
3. Asignar TODOS los privilegios
```

### 1.3 Importar Esquema
```bash
1. Ir a cPanel > phpMyAdmin
2. Seleccionar la base de datos creada
3. Ir a pestaña "Importar"
4. Seleccionar archivo: database/schema.sql
5. Hacer clic en "Continuar"
6. Verificar que se crearon todas las tablas
```

---

## 📁 **PASO 2: SUBIR ARCHIVOS**

### 2.1 Estructura de Carpetas
```
public_html/
├── index.html                  (Aplicación principal)
├── .htaccess                   (Configuración Apache)
├── css/
│   └── styles.css
├── js/
│   ├── maintenance-system.js
│   ├── data-service.js         (Actualizado para MySQL)
│   └── signature-pad.min.js
├── data/
│   └── database.json           (Mantener para fallback)
├── api/                        (NUEVA CARPETA)
│   ├── index.php               (API principal)
│   ├── models.php              (Modelos de datos)
│   ├── config.php              (Configuración)
│   └── .htaccess               (Rewrite rules)
├── uploads/                    (Para archivos subidos)
├── logs/                       (Para logs de errores)
└── temp/                       (Para archivos temporales)
```

### 2.2 Permisos de Carpetas
```bash
# En cPanel > Administrador de archivos
uploads/    → 755
logs/       → 755  
temp/       → 755
api/        → 755
```

---

## ⚙️ **PASO 3: CONFIGURAR API**

### 3.1 Editar config.php
```php
// En /api/config.php - Actualizar con TUS datos:

'database' => [
    'host' => 'localhost',
    'name' => 'tuusuario_certificados',    // ← TU BASE DE DATOS
    'user' => 'tuusuario_certificados_user', // ← TU USUARIO
    'pass' => 'tu_password_real',          // ← TU PASSWORD
],

'api' => [
    'base_url' => 'https://tudominio.com/api/',  // ← TU DOMINIO
    'allowed_origins' => [
        'https://tudominio.com',           // ← TU DOMINIO
        'https://www.tudominio.com'        // ← CON WWW
    ]
],
```

### 3.2 Activar Modo API en DataService
```javascript
// En js/data-service.js - Cambiar línea 8:
this.mode = 'api'; // ← Cambiar de 'json' a 'api'
```

---

## 🔧 **PASO 4: VERIFICAR INSTALACIÓN**

### 4.1 Test de API
```bash
# Probar estos endpoints en el navegador:
https://tudominio.com/api/health
https://tudominio.com/api/clientes
https://tudominio.com/api/tecnicos
```

**Respuesta esperada de /health:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "data": {
    "status": "OK",
    "version": "1.0.0",
    "database": "Connected"
  }
}
```

### 4.2 Test de Aplicación
```bash
1. Abrir: https://tudominio.com
2. Verificar que cargan los clientes desde MySQL
3. Crear un certificado de prueba
4. Verificar en phpMyAdmin que se guardó
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### Error "Database connection failed"
```bash
✓ Verificar datos en config.php
✓ Verificar que el usuario tiene permisos
✓ Revisar logs en cPanel > Error Logs
```

### Error 404 en endpoints API
```bash
✓ Verificar que existe api/.htaccess
✓ Verificar mod_rewrite habilitado
✓ Revisar permisos de carpeta api/
```

### Aplicación no carga datos
```bash
✓ Abrir DevTools > Console
✓ Verificar errores de CORS
✓ Verificar que mode = 'api' en data-service.js
```

### CORS Errors
```bash
✓ Verificar allowed_origins en config.php
✓ Verificar headers en api/.htaccess
✓ Contactar soporte de hosting sobre mod_headers
```

---

## 🔒 **PASO 5: SEGURIDAD Y OPTIMIZACIÓN**

### 5.1 Configuraciones de Producción
```php
// En config.php:
'app' => [
    'debug' => false,           // ← IMPORTANTE: false en producción
],
'security' => [
    'enable_https_only' => true // ← Si tienes SSL
]
```

### 5.2 Backup Automático
```bash
1. cPanel > Cron Jobs
2. Agregar tarea diaria:
   0 2 * * * mysqldump -u usuario -p password base_datos > backup_$(date +\%Y\%m\%d).sql
```

### 5.3 Monitoreo
```bash
✓ Revisar logs regularmente: cPanel > Error Logs
✓ Monitorear uso de base de datos
✓ Verificar velocidad de respuesta API
```

---

## 🚀 **FUNCIONALIDADES LISTAS**

### ✅ **API Endpoints Disponibles**
- `GET /api/health` - Estado del sistema
- `GET /api/clientes` - Lista de clientes con instalaciones
- `GET /api/tecnicos` - Lista de técnicos activos  
- `GET /api/configuracion` - Configuración del sistema
- `GET /api/checklists/{tipo}` - Templates de checklists
- `POST /api/certificados` - Crear nuevo certificado
- `GET /api/certificados` - Lista de certificados (con filtros)
- `GET /api/estadisticas` - Estadísticas del sistema

### ✅ **Funciones de la Aplicación**
- ✅ Generación automática de números de certificado
- ✅ Guardado en MySQL con transacciones
- ✅ Fallback automático a JSON si API falla
- ✅ Cache inteligente para optimizar rendimiento
- ✅ Manejo robusto de errores y reintentos
- ✅ Interfaz responsive y profesional
- ✅ Generación de PDFs con firma digital
- ✅ Múltiples tipos de certificados (CCTV, Hardware, Racks)

### 🔄 **Modo Híbrido JSON/MySQL**
La aplicación puede funcionar en:
- **Desarrollo**: Modo JSON (sin necesidad de BD)
- **Producción**: Modo MySQL (datos persistentes)
- **Fallback automático**: Si MySQL falla, usa JSON

---

## 📞 **SOPORTE TÉCNICO**

### Comandos de Diagnóstico
```javascript
// En consola del navegador:
dataService.getStatus()           // Ver estado actual
dataService.testConnection()      // Test de conectividad
dataService.setMode('json')       // Cambiar a modo JSON
dataService.setMode('api')        // Cambiar a modo API
```

### Archivos de Log
```bash
- cPanel > Error Logs (errores de PHP)
- /logs/database.log (errores de BD)
- DevTools > Console (errores de JS)
- DevTools > Network (errores de API)
```

---

## ✨ **¡LISTO PARA PRODUCCIÓN!**

El sistema está preparado para:
- ⚡ **Alto rendimiento** con cache y optimizaciones
- 🔒 **Seguridad** con validaciones y sanitización  
- 📊 **Escalabilidad** con arquitectura API-first
- 🛡️ **Confiabilidad** con fallbacks y reintentos
- 📱 **Responsivo** para móviles y tablets
- 🎨 **Profesional** con interfaz moderna

**¡Tu aplicación está lista para manejar usuarios reales en producción!** 🎉

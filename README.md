# 🚨 DETECTOR DE IA NUEVA - CertGen Pro

## ⚠️ ¿ERES UNA IA NUEVA? RESPONDE ESTO:

**¿Recuerdas haber trabajado en la consolidación del admin panel?**
- **SÍ:** ✅ Continúa
- **NO:** 🚨 **NUEVA SESIÓN** - Lee 🤖-IA-CONTEXT-TRAP.md PRIMERO

---

# Sistema de Certificados de Mantenimiento - FUNCIONAL ✅

Sistema web profesional para generar certificados de mantenimiento técnico especializado.

**ESTADO ACTUAL (6 nov 2025):** 
- ✅ Panel admin consolidado con datos reales
- ✅ MySQL con 82 certificados, 4 clientes, 5 técnicos  
- ✅ Una sola verificación de autenticación
- ✅ Servidor PHP puerto 8080

## 🏗️ Arquitectura

### Base de Datos Externa
El sistema utiliza una arquitectura de base de datos JSON externa (`/data/database.json`) que contiene:

- **Clientes**: Información completa de empresas con RUT, contacto e instalaciones
- **Técnicos**: Personal especializado con áreas de expertise y contacto  
- **Configuración**: Numeración de certificados, prefijos y configuración empresarial
- **Checklists**: Listas de verificación específicas para cada tipo de mantenimiento

### Ventajas de la Arquitectura Separada
✅ **Mantenibilidad**: Fácil actualización de datos sin tocar código  
✅ **Escalabilidad**: Base de datos independiente, migratable a SQL  
✅ **Flexibilidad**: Adición de clientes/técnicos sin redeploy  
✅ **Backup**: Datos separados permiten respaldos independientes  

## 📊 Estructura de Datos

### database.json
```json
{
  "clientes": [
    {
      "id": 1,
      "nombre": "Corporación PF",
      "rut": "76.152.493-0", 
      "contacto": "contacto@corporacionpf.cl",
      "instalaciones": [
        {
          "id": 1,
          "nombre": "Casa Matriz - Las Condes",
          "direccion": "Av. Apoquindo 3721, Las Condes"
        }
      ]
    }
  ],
  "tecnicos": [...],
  "configuracion": {...},
  "checklists": {...}
}
```

## 🎯 Características Principales

### Tipos de Certificados
1. **CCTV** (Circuito Cerrado de Televisión)
   - Limpieza de cámaras y lentes
   - Verificación de conectividad
   - Pruebas de grabación y visualización remota
   
2. **Hardware Computacional**
   - Mantenimiento de equipos
   - Verificación de temperaturas
   - Actualización de software
   
3. **Racks de Comunicaciones**
   - Cableado estructurado
   - Sistemas de ventilación
   - Conectividad de red

### Sistema de Numeración Automática
- **CCTV**: `CCTV-101-08-2025`
- **Hardware**: `HW-201-08-2025` 
- **Racks**: `RK-301-08-2025`

Formato: `[PREFIJO]-[CONTADOR]-[MES]-[AÑO]`

### Funcionalidades Avanzadas
- 🔄 **Preview en tiempo real** con sincronización automática
- 📝 **Firmas digitales** por carga de imagen
- 📊 **Checklists específicos** por tipo de mantenimiento
- 🔍 **Zoom ajustable** en vista previa (50%-150%)
- 📄 **PDF profesional** con diseño corporativo
- 💾 **Persistencia de contadores** en localStorage como backup

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno
- Servidor HTTP local (Python, Node.js, etc.)

### Ejecutar
```bash
# Clonar o descargar el proyecto
cd sistema-certificados

# Servidor Python
python3 -m http.server 8002

# Servidor Node.js (alternativo)
npx http-server -p 8002
```

Abrir: `http://localhost:8002`

### Estructura del Proyecto
```
proyecto/
├── index.html              # Interfaz principal
├── js/
│   └── maintenance-system.js # Lógica de aplicación
├── data/
│   └── database.json       # Base de datos externa
└── README.md              # Documentación
```

## 🔧 Configuración

### Agregar Cliente
Editar `data/database.json`:
```json
{
  "clientes": [
    {
      "id": 4,
      "nombre": "Nueva Empresa SPA",
      "rut": "12.345.678-9",
      "contacto": "contacto@nueva.cl",
      "instalaciones": [...]
    }
  ]
}
```

### Agregar Técnico
```json
{
  "tecnicos": [
    {
      "id": 5,
      "nombre": "Nuevo Técnico",
      "especialidad": "CCTV y Hardware",
      "email": "tecnico@empresa.cl",
      "telefono": "+56 9 1234 5678"
    }
  ]
}
```

### Personalizar Numeración
```json
{
  "configuracion": {
    "certificados": {
      "numeracion": {
        "cctv": {
          "prefijo": "CCTV",
          "siguiente": 150
        }
      }
    }
  }
}
```

## 🎨 Tecnologías Utilizadas

- **Frontend**: HTML5, Tailwind CSS, JavaScript ES6+
- **PDF**: jsPDF + html2canvas
- **Iconos**: Font Awesome
- **Tipografía**: Inter (Google Fonts)
- **Datos**: JSON externo con fetch API

## 📈 Mantenimiento

### Respaldo de Contadores
Los contadores se guardan automáticamente en:
1. **Base de datos principal** (actualización inmediata)
2. **localStorage** (backup local del navegador)

### Logs y Depuración
El sistema incluye logging detallado:
- ✅ Carga exitosa de base de datos
- ⚠️ Advertencias de conectividad
- ❌ Errores de validación
- 📊 Actualizaciones de contadores

### Migración a Base de Datos Real
Para migrar a PostgreSQL/MySQL:
1. Mantener estructura JSON como esquema
2. Implementar API REST endpoints
3. Reemplazar `fetch('./data/database.json')` por llamadas API
4. Mantener localStorage como cache offline

## 📧 Soporte

Para consultas técnicas o mejoras, contactar al equipo de desarrollo.

---
**Versión**: 2.0 (Base de Datos Externa)  
**Fecha**: Agosto 2025  
**Compatibilidad**: Chrome 90+, Firefox 85+, Safari 14+

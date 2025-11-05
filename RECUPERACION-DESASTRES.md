# 🚨 INSTRUCCIONES DE RECUPERACIÓN ANTE DESASTRES
**CertGen Pro - Plan de Contingencia**

## 📦 Respaldos Disponibles

### 1. **Respaldo Local** 
- **Archivo:** `certgen-pro-backup-20251104-212446.tar.gz`
- **Ubicación:** `/Users/Fernandito/`
- **Tamaño:** ~66 MB
- **Uso:** Restauración rápida local

### 2. **Respaldo GitHub** 
- **Repositorio:** `basualtotj/Proyecto-Respaldo-CertGenPro`
- **Commit:** `6f4defd` - "🚀 RESPALDO COMPLETO - Sistema Funcional con Navbar Unificado"
- **Tag:** `v1.0-respaldo-navbar-unificado`
- **URL:** https://github.com/basualtotj/Proyecto-Respaldo-CertGenPro

## 🔄 Procedimientos de Recuperación

### Opción A: Restauración desde GitHub (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/basualtotj/Proyecto-Respaldo-CertGenPro.git
cd Proyecto-Respaldo-CertGenPro

# 2. Ir al tag de respaldo específico
git checkout v1.0-respaldo-navbar-unificado

# 3. Verificar que estás en el commit correcto
git log --oneline -1
# Debería mostrar: 6f4defd 🚀 RESPALDO COMPLETO - Sistema Funcional...

# 4. Iniciar el servidor
php -S localhost:8080 router.php
```

### Opción B: Restauración desde Archivo Local

```bash
# 1. Ir al directorio de destino
cd /Users/Fernandito/

# 2. Extraer el respaldo
tar -xzf certgen-pro-backup-20251104-212446.tar.gz

# 3. Renombrar si es necesario
mv VisualCode VisualCode-restored

# 4. Iniciar el servidor
cd VisualCode-restored
php -S localhost:8080 router.php
```

## ✅ Verificación Post-Restauración

1. **Acceso al Sistema:**
   - Ir a: http://localhost:8080
   - Verificar redirección a dashboard.php

2. **Login de Prueba:**
   - Usuario: admin
   - Password: admin123

3. **Funcionalidades a Verificar:**
   - ✅ Navbar uniforme en todas las páginas
   - ✅ certificate-generator.php funcional
   - ✅ certificados.php listando certificados
   - ✅ dashboard.php navegación correcta
   - ✅ crud.php gestión de datos
   - ✅ API respondiendo en `/api/`

## 🎯 Estado del Sistema Respaldado

### Archivos Críticos Incluidos:
- `api/models.php` - API corregida con consultas JOIN
- `certificados.php` - Versión corregida (copia de .html + auth)
- `dashboard.php` - Navbar unificado
- `crud.php` - Navbar unificado
- `js/components/navbar.js` - Navegación global
- `js/data-service.js` - Cliente API
- Base de datos SQLite con estructura completa

### Configuración Verificada:
- TailwindCSS CDN en todos los archivos
- FontAwesome 6.4.0 consistente
- Orden de carga de scripts correcto
- Autenticación PHP funcionando
- Router PHP configurado

## 🆘 Contacto de Emergencia

**En caso de problemas con la restauración:**
1. Verificar que PHP esté instalado y funcionando
2. Comprobar que el puerto 8080 esté libre
3. Validar permisos de archivos
4. Revisar logs de PHP en caso de errores

## 📝 Notas Importantes

- **Fecha del Respaldo:** 4 de Noviembre de 2025, 21:24
- **Última Funcionalidad:** Navbar unificado completamente funcional
- **Estado:** Sistema 100% operativo
- **Base de Datos:** Incluida en el respaldo (SQLite)
- **Certificados:** PDFs almacenados incluidos

---
**Creado por:** GitHub Copilot  
**Sistema:** CertGen Pro v1.0  
**Propósito:** Recuperación ante desastres IA

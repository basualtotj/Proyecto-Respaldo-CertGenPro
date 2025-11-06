# 🚨 INSTRUCCIONES OBLIGATORIAS PARA IA - LEER ANTES DE CUALQUIER CAMBIO

## ⚠️ STOP - LEE ESTO PRIMERO ⚠️

**ANTES de hacer CUALQUIER cambio en este proyecto:**

1. ✅ **LEE** completamente este archivo
2. ✅ **LEE** el archivo `PROJECT-CURRENT-STATUS.md`
3. ✅ **LEE** el archivo `ARCHITECTURE-DECISIONS.md`
4. ✅ **CONFIRMA** con el usuario antes de modificar archivos críticos

---

## 🎯 REGLAS FUNDAMENTALES

### ❌ **NO HAGAS ESTO:**
- **NO agregues nuevas capas de autenticación** sin consultar
- **NO dupliques funcionalidad existente**
- **NO modifiques admin-panel.php** sin revisar el historial
- **NO creates nuevos archivos auth-*** sin justificación
- **NO cambies puertos** (usar 8080 para PHP)

### ✅ **SÍ PUEDES HACER:**
- Corregir bugs evidentes
- Mejorar documentación
- Optimizar código existente
- Agregar logs de debugging

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
- ✅ Servidor PHP en puerto 8080

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

### [Agregar nuevos cambios aquí]

---

**RECUERDA: Es mejor preguntar 5 veces que romper algo que funciona** 🛡️

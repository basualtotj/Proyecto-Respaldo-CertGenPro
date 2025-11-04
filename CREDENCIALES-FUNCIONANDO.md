# 🔑 CREDENCIALES CORREGIDAS DEL SISTEMA

## ✅ **PROBLEMA RESUELTO**

Los usuarios ahora funcionan correctamente. El problema era que:
1. Los passwords estaban hasheados con valores diferentes
2. Los emails tenían conflictos de duplicados
3. Faltaba inicializar la clase Auth en login-handler.php

## 👥 **CREDENCIALES DE ACCESO**

### 🔐 **ADMINISTRADOR**
```
Usuario: admin
Password: admin123
Email: admin@certificados.com
Rol: admin
Acceso: Panel completo + aprobación de certificados
```

### 🎓 **USUARIO REGULAR 1**
```
Usuario: usuario
Password: usuario123
Email: usuario.test@certificados.com
Rol: cliente
Acceso: Solo crear solicitudes de certificados
```

### 📚 **USUARIO REGULAR 2**
```
Usuario: estudiante
Password: estudiante123
Email: estudiante.test@certificados.com
Rol: cliente
Acceso: Solo crear solicitudes de certificados
```

## 🌐 **URLS DEL SISTEMA**

- **Página Principal**: `http://localhost:8085/`
- **Login**: `http://localhost:8085/login.html`
- **Panel Admin**: `http://localhost:8085/dashboard.html`
- **Panel Usuario**: `http://localhost:8085/user-dashboard.html`
- **Validación Pública**: `http://localhost:8085/validate.html`

## 🔍 **CÓDIGOS PARA VALIDACIÓN PÚBLICA**

Certificados ya aprobados que puedes validar sin login:

- **CERT737185** - Desarrollo Web Full Stack
- **CERT684188** - Administración de BD MySQL
- **CERT969493** - Python para Data Science

## 📋 **INSTRUCCIONES DE PRUEBA**

### 1. **Login como Administrador**
1. Ir a: `http://localhost:8085/login.html`
2. Usuario: `admin` / Password: `admin123`
3. Te llevará al dashboard administrativo
4. Podrás ver certificados pendientes para aprobar
5. Podrás descargar PDFs de cualquier certificado

### 2. **Login como Usuario**
1. Ir a: `http://localhost:8085/login.html`
2. Usuario: `usuario` / Password: `usuario123`
3. Te llevará al panel de usuario
4. Podrás crear nuevas solicitudes de certificados
5. Solo podrás descargar PDFs de certificados aprobados

### 3. **Validación Pública (Sin Login)**
1. Ir a: `http://localhost:8085/validate.html`
2. Introducir cualquiera de los códigos de arriba
3. Ver información completa del certificado
4. Descargar PDF directamente

## 🚀 **SISTEMA FUNCIONAL**

- ✅ Autenticación funcionando
- ✅ Roles configurados correctamente  
- ✅ Passwords reseteados
- ✅ Emails únicos
- ✅ Servidor PHP corriendo
- ✅ Generación PDF operativa
- ✅ Validación pública activa

**¡El sistema está listo para usar!** 🎉

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 🚨 INSTRUCCIONES CRÍTICAS PARA IA/COPILOT

## ⚠️ ANTES DE CUALQUIER CAMBIO:
1. **LEE OBLIGATORIAMENTE:** `.github/AI-INSTRUCTIONS-MANDATORY.md`
2. **REVISA ESTADO ACTUAL:** `PROJECT-CURRENT-STATUS.md`
3. **CONSULTA DECISIONES:** `ARCHITECTURE-DECISIONS.md`
4. **CONFIRMA CON USUARIO** antes de modificar archivos críticos

## 🎯 PROYECTO: Aplicación web para generar certificados e informes automáticamente

## ✅ ESTADO ACTUAL (6 nov 2025):
- [x] Panel administrativo consolidado FUNCIONAL
- [x] Datos reales de MySQL mostrándose (82 certs, 4 clientes, 5 técnicos)  
- [x] Autenticación simplificada (UNA sola verificación PHP)
- [x] Servidor PHP puerto 8080 operativo
- [x] Sin redirects problemáticos

## ❌ NO HAGAS ESTO:
- **NO agregues nuevas capas de autenticación**
- **NO dupliques funcionalidad en admin-panel.php**
- **NO modifiques auth sin consultar**
- **NO cambies puertos (usar 8080)**

## ✅ PUEDES HACER:
- Mejorar estilos CSS
- Optimizar código existente  
- Agregar logs de debugging
- Documentar cambios

## 🛡️ ARCHIVOS CRÍTICOS - EXTREMA PRECAUCIÓN:
- admin-panel.php (panel principal)
- api/models.php (conexión DB)
- js/data-service.js (servicio datos)

**REGLA DE ORO: Si funciona, no lo toques. Si no entiendes el contexto, pregunta.**

# ✅ SISTEMA RESTAURADO - DUAL CODE/CERTIFICATE

## 🔧 FUNCIONALIDAD RESTAURADA:

### **Sistema Dual Correcto:**
- **`certificateNumber`**: Número correlativo para mostrar en el header del PDF
- **`code`**: Código de validación alfanumérico para el footer del PDF

### **Flujo Correcto:**
1. **Header del Certificado**: Muestra `certificateNumber` (ej: "001", "002", "003")
2. **Footer del Certificado**: Muestra `code` (ej: "ABC123XYZ")
3. **Nombre del Archivo**: Usa `certificateNumber` como nombre base

---

## 📋 CAMBIOS IMPLEMENTADOS:

### 1. **En `cctv-pdf.js`:**
```javascript
// ✅ CORRECTO: Función generate recibe ambos parámetros
async generate(opts) {
  const { code, certificateNumber, ... } = opts || {};

// ✅ CORRECTO: Header usa certificateNumber
this._drawHeader(doc, systemLabel, certificateNumber, fechaText, logoDataUrl);

// ✅ CORRECTO: Footer usa code
this._drawFooter(doc, code);

// ✅ CORRECTO: Evidencias reciben ambos parámetros
await this._drawEvidencePages(doc, evidencias, systemLabel, certificateNumber, code, fechaText, logoDataUrl);
```

### 2. **En `maintenance-system.js`:**
```javascript
// ✅ CORRECTO: Se pasan ambos parámetros
const { blob, filename } = await generator.generate({
    code: this.assignedValidationCode,     // Para footer/validación
    certificateNumber: this.assignedCertificateNumber, // Para header/filename
    ...
});
```

---

## 🎯 RESULTADO:

### **Certificado Final:**
- **Header**: "Certificado N°: 001" (número correlativo)
- **Footer**: "Código de Validación: ABC123XYZ" (alfanumérico)
- **Archivo**: "001.pdf" (nombre basado en número)

### **Validación:**
- El usuario puede validar usando el código alfanumérico "ABC123XYZ"
- El sistema identifica el certificado por su número correlativo "001"

---

## ✅ **PROBLEMA SOLUCIONADO:**
- ❌ Error: `certificateNumber is not defined` → ✅ **CORREGIDO**
- ❌ Parámetros mal pasados a evidencias → ✅ **CORREGIDO**  
- ❌ Sistema dual quebrado → ✅ **RESTAURADO**

**El sistema ahora genera certificados correctamente con evidencias fotográficas.**

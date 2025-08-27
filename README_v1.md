# 🎓 CertGen Pro - Generador Profesional de Certificados

[![Versión](https://img.shields.io/badge/versión-2.0-blue.svg)]()
[![Licencia](https://img.shields.io/badge/licencia-MIT-green.svg)]()
[![Compatibilidad](https://img.shields.io/badge/compatibilidad-WordPress%20|%20Apache%20|%20Nginx-orange.svg)]()

**CertGen Pro** es un generador profesional de certificados diseñado para ser **completamente compatible con cualquier servidor web**, incluyendo WordPress, Apache, Nginx y hosting compartido.

## ✨ Características Principales

### 🎨 **Diseño Profesional con Tailwind CSS**
- **5 plantillas profesionales** incluidas
- **Completamente responsive** - funciona en desktop, tablet y móvil
- **Efectos visuales modernos** - gradientes, sombras, animaciones
- **Tipografía elegante** con Google Fonts

### 🚀 **Máxima Compatibilidad**
- ✅ **Sin dependencias de build** - funciona directamente
- ✅ **Compatible con WordPress** - sube y funciona inmediatamente
- ✅ **Compatible con Apache/Nginx** - hosting compartido incluido
- ✅ **Librerías desde CDN** - no requiere instalación local
- ✅ **HTML5 + CSS3 + JavaScript puro** - estándares web modernos

### 📄 **Generación PDF de Alta Calidad**
- **Resolución de impresión** - 300 DPI para impresión profesional
- **Captura visual perfecta** - mantiene colores, fuentes y diseño
- **Tamaño A4 landscape** - formato estándar para certificados
- **Nombres automáticos** - descarga con nombre descriptivo

### 🎯 **Múltiples Plantillas**
1. **Clásica** - Diseño tradicional con bordes azules
2. **Moderna** - Gradientes morados y diseño contemporáneo
3. **Elegante** - Fondo oscuro con acentos dorados
4. **Lujo** - Diseño premium con detalles dorados
5. **Corporativa** - Estilo empresarial limpio

## 🛠️ Instalación

### Opción 1: WordPress
1. Sube todos los archivos a una carpeta en tu tema o plugin
2. Accede desde tu navegador
3. ¡Listo! - No requiere configuración adicional

### Opción 2: Servidor Web (Apache/Nginx)
1. Sube los archivos a tu directorio web
2. Asegúrate que el servidor puede servir archivos HTML
3. Accede a `index.html`

### Opción 3: Servidor Local
```bash
# Opción A: Python (recomendado)
python3 -m http.server 8000

# Opción B: Node.js
npx http-server

# Opción C: PHP
php -S localhost:8000
```

## 📁 Estructura del Proyecto

```
CertGen-Pro/
├── index.html          # Página principal
├── js/
│   └── app.js         # Lógica de la aplicación
├── README.md          # Documentación
└── .github/
    └── copilot-instructions.md
```

## 🎮 Uso

1. **Selecciona una plantilla** - Elige entre 5 diseños profesionales
2. **Completa el formulario** - Nombre, curso, organización, etc.
3. **Vista previa en tiempo real** - Ve los cambios instantáneamente
4. **Genera el PDF** - Descarga automáticamente en alta calidad

### Campos del Formulario:
- **Tipo de documento** - Certificado, Diploma, Reconocimiento, Constancia
- **Nombre del destinatario** ⭐ (requerido)
- **Curso/Evento** ⭐ (requerido)  
- **Duración** - Ej: "40 horas académicas"
- **Fecha** - Selección de calendario
- **Instructor/Director** - Persona que otorga el certificado
- **Organización** - Institución emisora
- **Descripción adicional** - Texto libre opcional

## 🎨 Personalización

### Cambiar Colores
Los colores están definidos en las clases CSS de cada plantilla:
```css
.template-classic {
    background: linear-gradient(45deg, #f8fafc 0%, #ffffff 100%);
    border: 8px solid #1e40af;
}
```

### Agregar Nueva Plantilla
1. Crea la clase CSS en el `<style>` del HTML
2. Agrega el botón en la sección de plantillas
3. Actualiza la función `applyTemplateStyles()` en `app.js`

### Modificar Campos
Edita el formulario en `index.html` y actualiza las funciones correspondientes en `app.js`.

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura semántica moderna
- **Tailwind CSS** - Framework CSS via CDN
- **JavaScript ES6+** - Lógica moderna sin frameworks
- **jsPDF** - Generación de documentos PDF
- **html2canvas** - Captura de elementos HTML
- **Font Awesome** - Iconografía profesional
- **Google Fonts** - Tipografías elegantes

## 📱 Responsive Design

Totalmente optimizado para:
- 📱 **Móviles** (320px+)
- 📱 **Tablets** (768px+)  
- 💻 **Desktop** (1024px+)
- 🖥️ **Pantallas grandes** (1440px+)

## 🐛 Solución de Problemas

### Error: "jsPDF is not defined"
- Verifica que tengas conexión a internet (usa CDN)
- Asegúrate que las librerías se carguen antes que `app.js`

### Error: "html2canvas is not defined"  
- Similar al anterior - verifica conexión a CDN
- En algunos servidores, cambiar `https://` por `//` puede ayudar

### PDF no se descarga
- Verifica que el navegador permite descargas automáticas
- Prueba en modo incógnito para descartar extensiones

### Vista previa no se actualiza
- Verifica la consola del navegador para errores JavaScript
- Asegúrate que todos los IDs del HTML coincidan con el JavaScript

## 🚀 Rendimiento

- **Carga rápida** - Librerías optimizadas desde CDN
- **Generación eficiente** - PDF creado en menos de 3 segundos
- **Memoria optimizada** - Limpieza automática de elementos temporales
- **Compatible con móviles** - Funciona en dispositivos de bajos recursos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o sugerencias:

- 🐛 [Reportar un bug](https://github.com/tu-usuario/certgen-pro/issues)
- 💡 [Sugerir una característica](https://github.com/tu-usuario/certgen-pro/issues)
- 📧 Contacto directo: [tu-email@ejemplo.com]

## 🎯 Roadmap

- [ ] **Más plantillas** - Diseños temáticos adicionales
- [ ] **Editor de colores** - Personalización visual avanzada
- [ ] **Certificados múltiples** - Generación por lotes
- [ ] **Firma digital** - Integración con servicios de firma
- [ ] **Códigos QR** - Validación automática de certificados
- [ ] **Base de datos** - Almacenamiento opcional de registros

---

⭐ **Si te gusta este proyecto, no olvides darle una estrella en GitHub!**

**Desarrollado con ❤️ para la comunidad**

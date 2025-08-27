/**
 * CertGen Pro - Generador Profesional de Certificados
 * Versión 2.0 - Completamente compatible con servidores web
 * 
 * Características:
 * - Tailwind CSS para diseño moderno
 * - Compatible con WordPress, Apache, cualquier servidor
 * - Sin dependencias de build o compilación
 * - Responsive y profesional
 * - Generación PDF de alta calidad
 */

class CertificateGenerator {
    constructor() {
        this.currentTemplate = 'classic';
        this.currentZoom = 0.8;
        this.formData = {};
        
        this.init();
    }

    /**
     * Inicializar la aplicación
     */
    init() {
        this.bindEvents();
        this.setCurrentDate();
        this.updatePreview();
        
        console.log('🚀 CertGen Pro v2.0 - Inicializado correctamente');
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario
        const form = document.getElementById('certificateForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Campos del formulario
        const formFields = [
            'documentType', 'recipientName', 'courseName', 'duration', 
            'date', 'instructor', 'organization', 'description'
        ];

        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.updatePreview());
                field.addEventListener('change', () => this.updatePreview());
            }
        });

        // Botones de plantilla
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTemplateChange(e));
        });

        // Controles de zoom
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
        if (zoomOut) zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    }

    /**
     * Establecer fecha actual por defecto
     */
    setCurrentDate() {
        const dateField = document.getElementById('date');
        if (dateField && !dateField.value) {
            const today = new Date().toISOString().split('T')[0];
            dateField.value = today;
        }
    }

    /**
     * Manejar cambio de plantilla
     */
    handleTemplateChange(e) {
        e.preventDefault();
        
        // Actualizar botones
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'bg-blue-50');
            btn.classList.add('border-gray-200');
        });
        
        e.currentTarget.classList.remove('border-gray-200');
        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
        
        // Actualizar plantilla actual
        this.currentTemplate = e.currentTarget.dataset.template;
        this.updatePreview();
    }

    /**
     * Ajustar zoom de la vista previa
     */
    adjustZoom(delta) {
        this.currentZoom = Math.max(0.5, Math.min(1.2, this.currentZoom + delta));
        const preview = document.getElementById('certificatePreview');
        if (preview) {
            preview.style.transform = `scale(${this.currentZoom})`;
        }
    }

    /**
     * Obtener datos del formulario
     */
    getFormData() {
        return {
            documentType: document.getElementById('documentType')?.value || 'certificado',
            recipientName: document.getElementById('recipientName')?.value || '',
            courseName: document.getElementById('courseName')?.value || '',
            duration: document.getElementById('duration')?.value || '',
            date: document.getElementById('date')?.value || '',
            instructor: document.getElementById('instructor')?.value || '',
            organization: document.getElementById('organization')?.value || '',
            description: document.getElementById('description')?.value || '',
            template: this.currentTemplate
        };
    }

    /**
     * Actualizar vista previa
     */
    updatePreview() {
        this.formData = this.getFormData();
        
        const preview = document.getElementById('certificatePreview');
        if (!preview) return;

        // Obtener el contenedor del certificado
        const certificateContainer = preview.querySelector('div');
        
        // Aplicar clase de plantilla
        certificateContainer.className = `template-${this.currentTemplate} w-full h-full p-12 flex flex-col justify-center items-center text-center relative`;
        
        // Actualizar contenido
        this.updatePreviewContent();
        
        // Aplicar estilos específicos de plantilla
        this.applyTemplateStyles(certificateContainer);
    }

    /**
     * Actualizar contenido de la vista previa
     */
    updatePreviewContent() {
        // Título del documento
        const titleElement = document.getElementById('previewTitle');
        if (titleElement) {
            const titles = {
                'certificado': 'CERTIFICADO',
                'diploma': 'DIPLOMA',
                'reconocimiento': 'RECONOCIMIENTO',
                'constancia': 'CONSTANCIA'
            };
            titleElement.textContent = titles[this.formData.documentType] || 'CERTIFICADO';
        }

        // Nombre del destinatario
        const recipientElement = document.getElementById('previewRecipient');
        if (recipientElement) {
            recipientElement.textContent = this.formData.recipientName || '[Nombre del Destinatario]';
        }

        // Nombre del curso
        const courseElement = document.getElementById('previewCourse');
        if (courseElement) {
            courseElement.textContent = this.formData.courseName || '[Nombre del Curso]';
        }

        // Duración
        const durationElement = document.getElementById('previewDuration');
        if (durationElement) {
            durationElement.textContent = this.formData.duration ? `con una duración de ${this.formData.duration}` : '';
        }

        // Descripción
        const descriptionElement = document.getElementById('previewDescription');
        if (descriptionElement) {
            descriptionElement.textContent = this.formData.description || '';
        }

        // Instructor
        const instructorElement = document.getElementById('previewInstructor');
        if (instructorElement) {
            instructorElement.textContent = this.formData.instructor || '[Instructor]';
        }

        // Organización
        const organizationElement = document.getElementById('previewOrganization');
        if (organizationElement) {
            organizationElement.textContent = this.formData.organization || '[Organización]';
        }

        // Fecha
        const dateElement = document.getElementById('previewDate');
        if (dateElement) {
            if (this.formData.date) {
                const date = new Date(this.formData.date);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dateElement.textContent = formattedDate;
            } else {
                dateElement.textContent = '[Fecha]';
            }
        }
    }

    /**
     * Aplicar estilos específicos de plantilla
     */
    applyTemplateStyles(container) {
        // Remover todas las clases de plantilla
        container.classList.remove(
            'template-classic', 'template-modern', 'template-elegant', 
            'template-luxury', 'template-corporate'
        );
        
        // Agregar clase de plantilla actual
        container.classList.add(`template-${this.currentTemplate}`);

        // Estilos específicos por plantilla
        const titleElement = document.getElementById('previewTitle');
        const recipientElement = document.getElementById('previewRecipient');
        
        if (titleElement && recipientElement) {
            switch (this.currentTemplate) {
                case 'modern':
                    titleElement.style.color = '#ffffff';
                    recipientElement.style.color = '#fbbf24';
                    recipientElement.style.borderColor = '#fbbf24';
                    break;
                    
                case 'elegant':
                    titleElement.style.color = '#f59e0b';
                    recipientElement.style.color = '#f9fafb';
                    recipientElement.style.borderColor = '#f59e0b';
                    break;
                    
                case 'luxury':
                    titleElement.style.color = '#fbbf24';
                    recipientElement.style.color = '#fbbf24';
                    recipientElement.style.borderColor = '#fbbf24';
                    break;
                    
                case 'corporate':
                    titleElement.style.color = '#059669';
                    recipientElement.style.color = '#059669';
                    recipientElement.style.borderColor = '#059669';
                    break;
                    
                default: // classic
                    titleElement.style.color = '#1e40af';
                    recipientElement.style.color = '#1d4ed8';
                    recipientElement.style.borderColor = '#bfdbfe';
                    break;
            }
        }
    }

    /**
     * Manejar envío del formulario
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar campos requeridos
        if (!this.validateForm()) {
            return;
        }

        await this.generatePDF();
    }

    /**
     * Validar formulario
     */
    validateForm() {
        const requiredFields = ['recipientName', 'courseName'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = field?.value?.trim();
            
            if (!value) {
                this.showError(`El campo "${field?.placeholder || fieldId}" es requerido`);
                field?.focus();
                isValid = false;
                return false;
            }
        });

        return isValid;
    }

    /**
     * Generar PDF profesional
     */
    async generatePDF() {
        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn?.innerHTML;
        
        try {
            // Actualizar botón
            if (generateBtn) {
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando PDF...';
                generateBtn.disabled = true;
            }

            // Actualizar datos
            this.formData = this.getFormData();
            this.updatePreview();

            // Esperar renderizado
            await this.delay(1000);

            // Crear elemento limpio para PDF
            const pdfElement = this.createPDFElement();
            
            // Agregar al DOM temporalmente
            pdfElement.style.position = 'absolute';
            pdfElement.style.left = '-9999px';
            pdfElement.style.top = '0';
            pdfElement.style.zIndex = '-1';
            document.body.appendChild(pdfElement);

            // Esperar renderizado
            await this.delay(500);

            // Capturar con html2canvas
            const canvas = await html2canvas(pdfElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: 1200,
                height: 900,
                removeContainer: true
            });

            // Limpiar DOM
            document.body.removeChild(pdfElement);

            // Crear PDF
            await this.createPDFFromCanvas(canvas);
            
            this.showSuccess('¡PDF generado exitosamente!');

        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showError(`Error al generar PDF: ${error.message}`);
        } finally {
            // Restaurar botón
            if (generateBtn && originalText) {
                setTimeout(() => {
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;
                }, 500);
            }
        }
    }

    /**
     * Crear elemento HTML limpio para PDF
     */
    createPDFElement() {
        const element = document.createElement('div');
        element.style.cssText = `
            width: 1200px;
            height: 900px;
            padding: 80px;
            background: white;
            font-family: 'Playfair Display', Georgia, serif;
            color: #374151;
            position: relative;
            box-sizing: border-box;
        `;

        // Aplicar estilos de plantilla
        this.applyPDFTemplateStyles(element);

        // Generar contenido
        element.innerHTML = this.generatePDFContent();

        return element;
    }

    /**
     * Aplicar estilos de plantilla al elemento PDF
     */
    applyPDFTemplateStyles(element) {
        switch (this.currentTemplate) {
            case 'classic':
                element.style.background = 'linear-gradient(45deg, #f8fafc 0%, #ffffff 100%)';
                element.style.border = '8px solid #1e40af';
                break;
                
            case 'modern':
                element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                element.style.color = '#ffffff';
                break;
                
            case 'elegant':
                element.style.background = '#1f2937';
                element.style.color = '#f9fafb';
                element.style.borderTop = '8px solid #f59e0b';
                break;
                
            case 'luxury':
                element.style.background = 'linear-gradient(45deg, #0f172a 0%, #1e293b 100%)';
                element.style.color = '#f1f5f9';
                element.style.border = '4px solid #fbbf24';
                break;
                
            case 'corporate':
                element.style.background = '#ffffff';
                element.style.borderLeft = '16px solid #059669';
                break;
        }
    }

    /**
     * Generar contenido HTML para PDF
     */
    generatePDFContent() {
        const titleColor = this.getTitleColor();
        const accentColor = this.getAccentColor();
        
        const title = {
            'certificado': 'CERTIFICADO',
            'diploma': 'DIPLOMA',
            'reconocimiento': 'RECONOCIMIENTO',
            'constancia': 'CONSTANCIA'
        }[this.formData.documentType] || 'CERTIFICADO';

        return `
            <!-- Decoración superior -->
            <div style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%);">
                <div style="width: 60px; height: 60px; background: ${accentColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                    <i class="fas fa-certificate"></i>
                </div>
            </div>

            <!-- Título principal -->
            <div style="text-align: center; margin-bottom: 60px; margin-top: 40px;">
                <h1 style="font-size: 56px; font-weight: bold; color: ${titleColor}; letter-spacing: 4px; margin: 0; text-transform: uppercase; font-family: 'Playfair Display', serif;">
                    ${title}
                </h1>
                <div style="width: 200px; height: 4px; background: ${accentColor}; margin: 20px auto;"></div>
            </div>

            <!-- Contenido principal -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center; line-height: 1.8; font-size: 20px;">
                <p style="margin-bottom: 30px; font-size: 22px;">Se certifica que</p>
                
                <div style="font-size: 42px; font-weight: bold; color: ${accentColor}; margin: 30px 0; padding: 20px 0; border-bottom: 3px solid ${this.getBorderColor()}; font-family: 'Playfair Display', serif;">
                    ${this.formData.recipientName || '[Nombre del Destinatario]'}
                </div>
                
                <p style="margin: 30px 0; font-size: 22px;">ha participado satisfactoriamente en</p>
                
                <div style="font-size: 28px; font-weight: 600; margin: 30px 0; color: ${this.getSecondaryColor()};">
                    ${this.formData.courseName || '[Nombre del Curso]'}
                </div>
                
                ${this.formData.duration ? `<p style="margin: 20px 0; font-size: 18px; color: ${this.getTextColor()};">con una duración de <strong>${this.formData.duration}</strong></p>` : ''}
                
                ${this.formData.description ? `<div style="margin: 40px 0; font-size: 16px; color: ${this.getTextColor()}; font-style: italic; line-height: 1.6;"><p>${this.formData.description}</p></div>` : ''}
            </div>

            <!-- Firmas -->
            <div style="position: absolute; bottom: 60px; width: calc(100% - 160px); display: flex; justify-content: space-between;">
                <div style="text-align: center;">
                    <div style="border-top: 2px solid ${this.getBorderColor()}; padding-top: 10px; min-width: 200px;">
                        <div style="font-size: 16px; color: ${this.getTextColor()};">
                            ${this.formData.date ? new Date(this.formData.date).toLocaleDateString('es-ES', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            }) : '[Fecha]'}
                        </div>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 2px solid ${this.getBorderColor()}; padding-top: 10px; min-width: 250px;">
                        <div style="font-size: 18px; font-weight: 600; color: ${this.getSecondaryColor()};">
                            ${this.formData.instructor || '[Instructor]'}
                        </div>
                        <div style="font-size: 14px; color: ${this.getTextColor()}; margin-top: 5px;">
                            ${this.formData.organization || '[Organización]'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener colores según plantilla
     */
    getTitleColor() {
        const colors = {
            'classic': '#1e40af',
            'modern': '#ffffff',
            'elegant': '#f59e0b',
            'luxury': '#fbbf24',
            'corporate': '#059669'
        };
        return colors[this.currentTemplate] || colors.classic;
    }

    getAccentColor() {
        const colors = {
            'classic': '#2563eb',
            'modern': '#fbbf24',
            'elegant': '#f59e0b',
            'luxury': '#fbbf24',
            'corporate': '#059669'
        };
        return colors[this.currentTemplate] || colors.classic;
    }

    getSecondaryColor() {
        const colors = {
            'classic': '#1d4ed8',
            'modern': '#ffffff',
            'elegant': '#f9fafb',
            'luxury': '#f1f5f9',
            'corporate': '#047857'
        };
        return colors[this.currentTemplate] || colors.classic;
    }

    getTextColor() {
        const colors = {
            'classic': '#4b5563',
            'modern': '#f3f4f6',
            'elegant': '#d1d5db',
            'luxury': '#e5e7eb',
            'corporate': '#374151'
        };
        return colors[this.currentTemplate] || colors.classic;
    }

    getBorderColor() {
        const colors = {
            'classic': '#bfdbfe',
            'modern': '#fbbf24',
            'elegant': '#f59e0b',
            'luxury': '#fbbf24',
            'corporate': '#a7f3d0'
        };
        return colors[this.currentTemplate] || colors.classic;
    }

    /**
     * Crear PDF desde canvas
     */
    async createPDFFromCanvas(canvas) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Calcular dimensiones
        const pdfWidth = 297; // A4 landscape width
        const pdfHeight = 210; // A4 landscape height
        const margin = 10;
        
        const maxWidth = pdfWidth - (margin * 2);
        const maxHeight = pdfHeight - (margin * 2);
        
        const canvasRatio = canvas.height / canvas.width;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth * canvasRatio;
        
        // Ajustar si es muy alto
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight / canvasRatio;
        }
        
        // Centrar
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        // Agregar imagen
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

        // Descargar
        const fileName = this.generateFileName();
        pdf.save(fileName);
    }

    /**
     * Generar nombre de archivo
     */
    generateFileName() {
        const type = this.formData.documentType || 'certificado';
        const name = (this.formData.recipientName || 'documento')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        
        const date = new Date().toISOString().split('T')[0];
        
        return `${type}_${name}_${date}.pdf`;
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Mostrar mensaje de error
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 z-50 max-w-sm w-full
            ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
            text-white px-6 py-4 rounded-lg shadow-lg
            transform translate-x-full opacity-0 transition-all duration-300 ease-in-out
        `;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span class="flex-1">${message}</span>
                <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Utilidad: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.certificateGenerator = new CertificateGenerator();
});

// También inicializar si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.certificateGenerator) {
            window.certificateGenerator = new CertificateGenerator();
        }
    });
} else {
    window.certificateGenerator = new CertificateGenerator();
}

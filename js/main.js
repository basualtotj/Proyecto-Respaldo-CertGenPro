// Aplicación principal para el Generador de Certificados
class DocumentGenerator {
    constructor() {
        this.currentDocumentType = 'certificate';
        this.formData = {};
        this.initializeEventListeners();
        this.setCurrentDate();
    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Botones de tipo de documento
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDocumentType(e.target.dataset.type);
            });
        });

        // Formulario - múltiples eventos para capturar todos los cambios
        const form = document.getElementById('documentForm');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFormData();
                this.updatePreview();
            });
            
            input.addEventListener('change', () => {
                this.updateFormData();
                this.updatePreview();
            });
            
            input.addEventListener('keyup', () => {
                this.updateFormData();
                this.updatePreview();
            });
        });

        // Botón de vista previa
        const previewBtn = document.getElementById('previewBtn');
        previewBtn.addEventListener('click', () => {
            this.updateFormData();
            this.updatePreview();
        });

        // Botón de generar PDF
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFormData();
            this.generatePDF();
        });

        // Doble clic en el botón para resetear en caso de emergencia
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.addEventListener('dblclick', () => {
            this.resetPDFButton();
            this.showSuccess('Botón reseteado. Puedes intentar generar el PDF nuevamente.');
        });
    }

    // Establecer fecha actual por defecto
    setCurrentDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        this.updateFormData();
    }

    // Seleccionar tipo de documento
    selectDocumentType(type) {
        this.currentDocumentType = type;
        
        // Actualizar botones activos
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Actualizar placeholders según el tipo
        this.updatePlaceholders();
        this.updatePreview();
    }

    // Actualizar placeholders del formulario según el tipo de documento
    updatePlaceholders() {
        const placeholders = {
            certificate: {
                title: 'Certificado de Participación',
                course: 'Curso de Programación Web',
                instructor: 'Dr. Juan Pérez',
                grade: 'Excelente'
            },
            report: {
                title: 'Informe de Actividades',
                course: 'Proyecto de Investigación',
                instructor: 'Supervisor del Proyecto',
                grade: 'Satisfactorio'
            },
            diploma: {
                title: 'Diploma de Graduación',
                course: 'Carrera de Ingeniería',
                instructor: 'Director Académico',
                grade: 'Cum Laude'
            },
            award: {
                title: 'Premio al Mejor Desempeño',
                course: 'Competencia Nacional',
                instructor: 'Comité de Evaluación',
                grade: 'Primer Lugar'
            }
        };

        // Si la plantilla es drone, usar placeholders específicos
        if (this.formData.template === 'drone') {
            const dronePlaceholders = {
                certificate: {
                    title: 'Certificación de Piloto de Drones',
                    course: 'Curso de Vuelo de UAV Nivel 1',
                    instructor: 'Capitán Miguel Rodríguez',
                    grade: 'Aprobado con Excelencia'
                },
                report: {
                    title: 'Informe de Vuelo de Drones',
                    course: 'Misión de Reconocimiento Aéreo',
                    instructor: 'Controlador de Vuelo',
                    grade: 'Misión Completada'
                },
                diploma: {
                    title: 'Diploma en Tecnología de Drones',
                    course: 'Especialización en UAV Comerciales',
                    instructor: 'Director de Aviación',
                    grade: 'Mención Honorífica'
                },
                award: {
                    title: 'Premio de Excelencia en Vuelo',
                    course: 'Campeonato de Drones FPV',
                    instructor: 'Jurado de Competencia',
                    grade: 'Primer Lugar'
                }
            };
            Object.assign(placeholders[this.currentDocumentType], dronePlaceholders[this.currentDocumentType]);
        }

        const currentPlaceholders = placeholders[this.currentDocumentType];
        
        Object.keys(currentPlaceholders).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.placeholder = `ej: ${currentPlaceholders[key]}`;
            }
        });
    }

    // Actualizar datos del formulario
    updateFormData() {
        const form = document.getElementById('documentForm');
        const formData = new FormData(form);
        
        this.formData = {};
        for (let [key, value] of formData.entries()) {
            this.formData[key] = value;
        }
        
        // Debug: mostrar datos capturados
        console.log('Datos del formulario:', this.formData);
    }

    // Actualizar vista previa
    updatePreview() {
        const previewContainer = document.getElementById('documentPreview');
        
        if (!this.formData.recipientName || !this.formData.organization || !this.formData.title) {
            previewContainer.innerHTML = '<p class="preview-placeholder">Completa los campos obligatorios para ver la vista previa</p>';
            return;
        }

        // Limpiar completamente el contenedor
        previewContainer.innerHTML = '';

        // Generar contenido del documento
        const content = window.DocumentTemplates.generateContent(this.formData, this.currentDocumentType);
        
        // Crear elemento de documento
        const documentElement = document.createElement('div');
        documentElement.className = `document-template template-${this.formData.template || 'classic'}`;
        documentElement.innerHTML = content;

        // Aplicar estilos
        window.DocumentTemplates.applyStyles(
            documentElement, 
            this.formData.template || 'classic',
            this.formData.color || '#2563eb'
        );

        // Asegurar que el elemento sea visible
        documentElement.style.display = 'block';
        documentElement.style.opacity = '1';
        documentElement.style.visibility = 'visible';

        // Forzar visibilidad de todos los elementos hijos
        const allElements = documentElement.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.style.display !== 'none') {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
            }
        });

        // Mostrar vista previa
        previewContainer.appendChild(documentElement);
        
        // Debug: verificar que el contenido sea visible
        console.log('Vista previa actualizada:', {
            elemento: documentElement,
            contenido: documentElement.innerHTML.length,
            visible: documentElement.offsetWidth > 0 && documentElement.offsetHeight > 0
        });
    }

    // Validar formulario
    validateForm() {
        const requiredFields = ['recipientName', 'organization', 'title', 'date'];
        const errors = [];

        requiredFields.forEach(field => {
            if (!this.formData[field] || this.formData[field].trim() === '') {
                errors.push(this.getFieldLabel(field));
            }
        });

        return errors;
    }

    // Obtener etiqueta del campo
    getFieldLabel(fieldName) {
        const labels = {
            recipientName: 'Nombre del Destinatario',
            organization: 'Organización/Institución',
            title: 'Título del Documento',
            date: 'Fecha'
        };
        return labels[fieldName] || fieldName;
    }

    // Mostrar mensaje de error
    showError(message) {
        // Crear elemento de error si no existe
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.style.cssText = `
                background: #fee2e2;
                color: #dc2626;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                border: 1px solid #fecaca;
            `;
            document.querySelector('.form-actions').insertBefore(errorElement, document.querySelector('.form-actions').firstChild);
        }
        
        errorElement.textContent = message;
        errorElement.scrollIntoView({ behavior: 'smooth' });
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }

    // Mostrar mensaje de éxito
    showSuccess(message) {
        let successElement = document.getElementById('success-message');
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.id = 'success-message';
            successElement.style.cssText = `
                background: #d1fae5;
                color: #065f46;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                border: 1px solid #a7f3d0;
            `;
            document.querySelector('.form-actions').insertBefore(successElement, document.querySelector('.form-actions').firstChild);
        }
        
        successElement.textContent = message;
        
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.parentNode.removeChild(successElement);
            }
        }, 3000);
    }

    // Generar PDF - VERSIÓN HÍBRIDA QUE RESPETA EL DISEÑO
    async generatePDF() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '⏳ Generando PDF...';
            submitBtn.disabled = true;

            // Forzar actualización de vista previa
            this.updateFormData();
            this.updatePreview();
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Crear un elemento limpio ESPECÍFICAMENTE para PDF
            const pdfElement = this.createCleanPDFElement();
            
            // Agregar temporalmente al DOM (invisible)
            pdfElement.style.position = 'absolute';
            pdfElement.style.left = '-9999px';
            pdfElement.style.top = '0';
            document.body.appendChild(pdfElement);
            
            // Esperar a que se renderice
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capturar con html2canvas
            const canvas = await html2canvas(pdfElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: 800,
                height: 600,
                removeContainer: true
            });

            // Eliminar elemento temporal
            document.body.removeChild(pdfElement);

            // Crear PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Calcular dimensiones para llenar la página
            const pdfWidth = 297;
            const pdfHeight = 210;
            const canvasRatio = canvas.height / canvas.width;
            
            let imgWidth = pdfWidth - 20; // Margen
            let imgHeight = imgWidth * canvasRatio;
            
            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight / canvasRatio;
            }
            
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            // Agregar imagen al PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

            // Descargar
            const fileName = this.generateFileName();
            pdf.save(fileName);
            
            this.showSuccess('¡PDF generado exitosamente!');

        } catch (error) {
            console.error('Error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 100);
        }
    }

    // Crear elemento limpio específicamente para PDF
    createCleanPDFElement() {
        const element = document.createElement('div');
        element.style.cssText = `
            width: 800px;
            height: 600px;
            padding: 60px;
            background: white;
            font-family: Georgia, serif;
            color: #333;
            position: relative;
        `;

        const template = this.formData.template || 'classic';
        const customColor = this.formData.color || '#2563eb';

        // Aplicar estilos según plantilla
        switch (template) {
            case 'classic':
                element.style.border = `8px solid ${customColor}`;
                element.style.background = 'linear-gradient(45deg, #f9fafb 0%, #ffffff 100%)';
                break;
            case 'modern':
                element.style.background = `linear-gradient(135deg, ${customColor} 0%, #764ba2 100%)`;
                element.style.color = '#ffffff';
                break;
            case 'elegant':
                element.style.background = '#1f2937';
                element.style.color = '#f9fafb';
                element.style.borderTop = `6px solid ${customColor}`;
                break;
            case 'corporate':
                element.style.borderLeft = `12px solid ${customColor}`;
                break;
            case 'drone':
                element.style.background = 'linear-gradient(45deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
                element.style.color = '#f1f5f9';
                element.style.border = `3px solid ${customColor}`;
                break;
        }

        // Generar HTML limpio
        const content = `
            <div style="text-align: center; font-size: 2.5rem; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; color: ${template === 'modern' || template === 'elegant' || template === 'drone' ? '#ffffff' : customColor};">
                ${this.formData.title || 'CERTIFICADO'}
            </div>
            <div style="text-align: center; line-height: 2; font-size: 1.1rem;">
                <p>Se certifica que</p>
                <div style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0; color: ${template === 'drone' ? '#fbbf24' : (template === 'modern' || template === 'elegant' ? '#ffffff' : customColor)};">
                    ${this.formData.recipientName || ''}
                </div>
                <p>ha participado satisfactoriamente en</p>
                <p><strong>${this.formData.course || ''}</strong></p>
                ${this.formData.duration ? `<p>con una duración de <strong>${this.formData.duration}</strong></p>` : ''}
                ${this.formData.description ? `<div style="margin: 1.5rem 0;"><p>${this.formData.description}</p></div>` : ''}
                ${this.formData.grade ? `<p>Obteniendo una calificación de: <strong>${this.formData.grade}</strong></p>` : ''}
                <div style="margin-top: 3rem; text-align: right;">
                    <p><strong>${this.formData.instructor || 'Director Académico'}</strong></p>
                    <p>${this.formData.organization || ''}</p>
                </div>
                <div style="margin-top: 2rem; text-align: center; font-style: italic;">
                    ${this.formData.date ? new Date(this.formData.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : ''}
                </div>
            </div>
        `;

        element.innerHTML = content;
        return element;
    }

    // Generar nombre del archivo
    generateFileName() {
        const type = this.currentDocumentType;
        const recipient = this.formData.recipientName || 'Documento';
        const date = new Date().toISOString().split('T')[0];
        
        const typeNames = {
            certificate: 'Certificado',
            report: 'Informe',
            diploma: 'Diploma',
            award: 'Premio'
        };

        return `${typeNames[type] || 'Documento'}_${recipient.replace(/\s+/g, '_')}_${date}.pdf`;
    }

    // Función de seguridad para resetear el botón si se queda colgado
    resetPDFButton() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '📥 Generar PDF';
            submitBtn.disabled = false;
        }
    }
}

// Inicializar aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    new DocumentGenerator();
    
    // Mostrar mensaje de bienvenida
    console.log('🎉 Generador de Certificados e Informes inicializado correctamente');
    console.log('📝 Completa el formulario y genera documentos profesionales en PDF');
});

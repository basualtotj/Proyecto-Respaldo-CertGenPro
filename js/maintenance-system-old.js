/**
 * Sistema de Certificados de Mantenimiento
 * Versión 1.0 - Especializado para CCTV, Hardware y Racks
 * 
 * Funcionalidades:
 * - 3 tipos de certificados específicos
 * - Base de datos de clientes e instalaciones
 * - Firmas digitales por imagen
 * - Códigos únicos de validación
 * - Generación PDF profesional
 */

class MaintenanceCertificateSystem {
    constructor() {
        this.currentCertificateType = null;
        this.currentZoom = 0.8;
        this.formData = {};
        this.signatures = {
            tecnico: null,
            cliente: null
        };
        
        // Sistema de numeración de certificados
        this.certificateCounters = {
            cctv: 100,
            hardware: 200,
            racks: 300
        };
        
        // Datos de clientes (temporalmente hardcodeados)
        this.clientes = [
            {
                id: 1,
                nombre: "GyV Arriendos",
                rut: "76.123.456-7",
                contacto: "Juan González",
                instalaciones: [
                    {
                        id: 1,
                        nombre: "Oficina Principal",
                        direccion: "Huasco 750 - Antofagasta",
                        tipo_sistema: "CCTV"
                    }
                ]
            },
            {
                id: 2,
                nombre: "Colegio Internacional Antofagasta",
                rut: "65.789.123-4",
                contacto: "María Rodríguez",
                instalaciones: [
                    {
                        id: 2,
                        nombre: "Campus Principal",
                        direccion: "Avenida Jaime Guzmán 04300 - Antofagasta",
                        tipo_sistema: "CCTV"
                    }
                ]
            },
            {
                id: 3,
                nombre: "Comercial y Servicios Seguel-Beyzaga Limitada",
                rut: "89.456.789-1",
                contacto: "Carlos Seguel",
                instalaciones: [
                    {
                        id: 3,
                        nombre: "Oficina Comercial",
                        direccion: "Teniente Merino 3333 - Tocopilla",
                        tipo_sistema: "CCTV"
                    }
                ]
            }
        ];

        // Técnicos disponibles
        this.tecnicos = [
            { id: 1, nombre: "Juan Carlos Méndez", especialidad: ["CCTV", "HARDWARE"] },
            { id: 2, nombre: "María Elena Rojas", especialidad: ["CCTV", "RACKS"] },
            { id: 3, nombre: "Pedro Antonio Silva", especialidad: ["HARDWARE", "RACKS"] },
            { id: 4, nombre: "Ana Sofía Torres", especialidad: ["CCTV", "HARDWARE", "RACKS"] }
        ];
        
        this.init();
    }

    /**
     * Inicializar la aplicación
     */
    init() {
        this.bindEvents();
        this.loadClientes();
        this.loadTecnicos();
        this.setCurrentDate();
        
        console.log('🚀 Sistema de Certificados de Mantenimiento - Inicializado');
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Botones de tipo de certificado
        const typeBtns = document.querySelectorAll('.certificate-type-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCertificateType(e));
        });

        // Selectors de cliente e instalación
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        
        if (clienteSelect) {
            clienteSelect.addEventListener('change', () => this.loadInstalaciones());
        }
        
        if (instalacionSelect) {
            instalacionSelect.addEventListener('change', () => this.updatePreview());
        }

        // Campos del formulario
        const formFields = [
            'fechaMantenimiento', 'clienteSelect', 'instalacionSelect', 'tecnicoSelect', 
            'solicitudesCliente', 'observaciones', 'camarasAnalogicas', 'camarasIP', 
            'monitores', 'dvr', 'nvr'
        ];

        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.updatePreview());
                field.addEventListener('change', () => this.updatePreview());
            }
        });

        // Checkboxes CCTV
        const checkboxes = document.querySelectorAll('input[name="cctvCheck"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePreview());
        });

        // Formulario
        const form = document.getElementById('certificateForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Firmas digitales
        this.bindSignatureEvents();

        // Controles de zoom
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
        if (zoomOut) zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    }

    /**
     * Vincular eventos de firmas
     */
    bindSignatureEvents() {
        const firmaTecnico = document.getElementById('firmaTecnico');
        const firmaCliente = document.getElementById('firmaCliente');

        if (firmaTecnico) {
            firmaTecnico.addEventListener('change', (e) => this.handleSignature(e, 'tecnico'));
        }

        if (firmaCliente) {
            firmaCliente.addEventListener('change', (e) => this.handleSignature(e, 'cliente'));
        }
    }

    /**
     * Manejar selección de tipo de certificado
     */
    selectCertificateType(e) {
        e.preventDefault();
        
        // Actualizar botones
        document.querySelectorAll('.certificate-type-btn').forEach(btn => {
            btn.classList.remove('bg-blue-50', 'border-blue-500', 'bg-green-50', 'border-green-500', 'bg-purple-50', 'border-purple-500');
            btn.classList.add('border-gray-200');
        });
        
        const type = e.currentTarget.dataset.type;
        this.currentCertificateType = type;
        
        // Aplicar estilo al botón seleccionado
        if (type === 'cctv') {
            e.currentTarget.classList.remove('border-gray-200');
            e.currentTarget.classList.add('bg-blue-50', 'border-blue-500');
        } else if (type === 'hardware') {
            e.currentTarget.classList.remove('border-gray-200');
            e.currentTarget.classList.add('bg-green-50', 'border-green-500');
        } else if (type === 'racks') {
            e.currentTarget.classList.remove('border-gray-200');
            e.currentTarget.classList.add('bg-purple-50', 'border-purple-500');
        }
        
        this.showForm();
        this.showSpecificForm();
        this.updateFormTitle();
        this.updatePreview();
    }

    /**
     * Mostrar formulario principal
     */
    showForm() {
        document.getElementById('selectTypeMessage').classList.add('hidden');
        document.getElementById('mainForm').classList.remove('hidden');
    }

    /**
     * Mostrar formulario específico según tipo
     */
    showSpecificForm() {
        // Ocultar todos los formularios específicos
        document.getElementById('cctvForm').classList.add('hidden');
        document.getElementById('hardwareForm').classList.add('hidden');
        document.getElementById('racksForm').classList.add('hidden');
        
        // Mostrar el formulario correspondiente
        if (this.currentCertificateType) {
            document.getElementById(`${this.currentCertificateType}Form`).classList.remove('hidden');
        }
    }

    /**
     * Actualizar título del formulario
     */
    updateFormTitle() {
        const titles = {
            'cctv': 'Certificado de Mantenimiento - Sistema CCTV',
            'hardware': 'Certificado de Mantenimiento - Hardware Computacional',
            'racks': 'Certificado de Mantenimiento - Racks de Comunicaciones'
        };
        
        const formTitle = document.getElementById('formTitle');
        if (formTitle && this.currentCertificateType) {
            formTitle.textContent = titles[this.currentCertificateType] || 'Certificado de Mantenimiento';
        }
    }

    /**
     * Cargar clientes en el selector
     */
    loadClientes() {
        const clienteSelect = document.getElementById('clienteSelect');
        if (!clienteSelect) return;

        // Limpiar opciones existentes (excepto la primera)
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente...</option>';
        
        this.clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            clienteSelect.appendChild(option);
        });
    }

    /**
     * Cargar instalaciones según cliente seleccionado
     */
    loadInstalaciones() {
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        
        if (!clienteSelect || !instalacionSelect) return;

        const clienteId = parseInt(clienteSelect.value);
        
        // Limpiar instalaciones
        instalacionSelect.innerHTML = '<option value="">Seleccionar instalación...</option>';
        instalacionSelect.disabled = !clienteId;

        if (clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            if (cliente && cliente.instalaciones) {
                cliente.instalaciones.forEach(instalacion => {
                    const option = document.createElement('option');
                    option.value = instalacion.id;
                    option.textContent = `${instalacion.nombre} - ${instalacion.direccion}`;
                    option.dataset.direccion = instalacion.direccion;
                    instalacionSelect.appendChild(option);
                });
                instalacionSelect.disabled = false;
            }
        }

        this.updatePreview();
    }

    /**
     * Cargar técnicos en el selector
     */
    loadTecnicos() {
        const tecnicoSelect = document.getElementById('tecnicoSelect');
        if (!tecnicoSelect) return;

        tecnicoSelect.innerHTML = '<option value="">Seleccionar técnico...</option>';
        
        this.tecnicos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = tecnico.nombre;
            tecnicoSelect.appendChild(option);
        });
    }

    /**
     * Establecer fecha actual
     */
    setCurrentDate() {
        const fechaField = document.getElementById('fechaMantenimiento');
        if (fechaField && !fechaField.value) {
            const today = new Date().toISOString().split('T')[0];
            fechaField.value = today;
        }
    }

    /**
     * Manejar carga de firma
     */
    handleSignature(e, tipo) {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showError('El archivo es demasiado grande. Máximo 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.signatures[tipo] = event.target.result;
            this.updateSignaturePreview(tipo, event.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Actualizar vista previa de firma
     */
    updateSignaturePreview(tipo, imageSrc) {
        const preview = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Preview`);
        const placeholder = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Placeholder`);
        const img = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Img`);

        if (preview && placeholder && img) {
            img.src = imageSrc;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        }

        // También actualizar el preview principal
        this.updateMainPreviewSignature(tipo, imageSrc);
    }

    /**
     * Actualizar firma en el preview principal
     */
    updateMainPreviewSignature(tipo, imageSrc) {
        let previewElement;
        if (tipo === 'tecnico') {
            previewElement = document.getElementById('previewFirmaTecnico');
        } else if (tipo === 'cliente') {
            previewElement = document.getElementById('previewFirmaCliente');
        }

        if (previewElement) {
            if (imageSrc) {
                previewElement.innerHTML = `<img src="${imageSrc}" style="max-height: 40px; max-width: 100%; object-fit: contain;" alt="Firma ${tipo}">`;
            } else {
                previewElement.innerHTML = ''; // Limpiar cuando se elimina la firma
            }
        }
    }

    /**
     * Remover firma
     */
    removeFirma(tipo) {
        this.signatures[tipo] = null;
        
        const preview = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Preview`);
        const placeholder = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Placeholder`);
        const input = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);

        if (preview && placeholder && input) {
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
            input.value = '';
        }

        // También limpiar el preview principal
        this.updateMainPreviewSignature(tipo, null);
    }

    /**
     * Ajustar zoom de vista previa
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
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        const tecnicoSelect = document.getElementById('tecnicoSelect');

        // Información básica
        const data = {
            tipo_certificado: this.currentCertificateType,
            cliente_id: clienteSelect?.value || '',
            instalacion_id: instalacionSelect?.value || '',
            tecnico_id: tecnicoSelect?.value || '',
            fecha_mantenimiento: document.getElementById('fechaMantenimiento')?.value || '',
            solicitudes_cliente: document.getElementById('solicitudesCliente')?.value || '',
            observaciones: document.getElementById('observaciones')?.value || '',
            firmas: this.signatures
        };

        // Datos específicos CCTV
        if (this.currentCertificateType === 'cctv') {
            data.cctv = {
                camaras_analogicas: document.getElementById('camarasAnalogicas')?.value || 0,
                camaras_ip: document.getElementById('camarasIP')?.value || 0,
                monitores: document.getElementById('monitores')?.value || 0,
                dvr: document.getElementById('dvr')?.value || '',
                nvr: document.getElementById('nvr')?.value || '',
                checklist: Array.from(document.querySelectorAll('input[name="cctvCheck"]:checked'))
                    .map(cb => cb.value)
            };
        }

        return data;
    }

    /**
     * Obtener información del cliente e instalación
     */
    getClienteInstalacionInfo() {
        const formData = this.getFormData();
        
        const cliente = this.clientes.find(c => c.id == formData.cliente_id);
        let instalacion = null;
        
        if (cliente) {
            instalacion = cliente.instalaciones.find(i => i.id == formData.instalacion_id);
        }

        const tecnico = this.tecnicos.find(t => t.id == formData.tecnico_id);

        return {
            cliente: cliente || {},
            instalacion: instalacion || {},
            tecnico: tecnico || {}
        };
    }

    /**
     * Actualizar vista previa
     */
    updatePreview() {
        if (!this.currentCertificateType) {
            this.showPlaceholderPreview();
            return;
        }

        const formData = this.getFormData();
        const info = this.getClienteInstalacionInfo();

        // Ocultar todos los previews
        document.getElementById('previewPlaceholder').classList.add('hidden');
        document.getElementById('cctvPreview').classList.add('hidden');
        document.getElementById('hardwarePreview').classList.add('hidden');
        document.getElementById('racksPreview').classList.add('hidden');

        // Mostrar preview específico
        if (this.currentCertificateType === 'cctv') {
            this.updateCCTVPreview(formData, info);
        } else {
            document.getElementById(`${this.currentCertificateType}Preview`).classList.remove('hidden');
        }
    }

    /**
     * Mostrar vista previa placeholder
     */
    showPlaceholderPreview() {
        document.getElementById('previewPlaceholder').classList.remove('hidden');
        document.getElementById('cctvPreview').classList.add('hidden');
        document.getElementById('hardwarePreview').classList.add('hidden');
        document.getElementById('racksPreview').classList.add('hidden');
    }

    /**
     * Actualizar vista previa CCTV
     */
    updateCCTVPreview(formData, info) {
        document.getElementById('cctvPreview').classList.remove('hidden');

        // Información básica
        document.getElementById('previewCliente').textContent = info.cliente.nombre || '-';
        document.getElementById('previewDireccion').textContent = info.instalacion.direccion || '-';
        document.getElementById('previewTecnico').textContent = info.tecnico.nombre || '-';
        
        // Técnico final (para la sección de firmas)
        const previewTecnicoFinalElement = document.getElementById('previewTecnicoFinal');
        if (previewTecnicoFinalElement) {
            previewTecnicoFinalElement.textContent = info.tecnico.nombre || '-';
        }
        
        // RUT del cliente (si existe el elemento)
        const previewRutElement = document.getElementById('previewRut');
        if (previewRutElement) {
            previewRutElement.textContent = info.cliente.rut || '-';
        }

        // Contacto del cliente
        const previewContactoElement = document.getElementById('previewContacto');
        if (previewContactoElement) {
            previewContactoElement.textContent = info.cliente.contacto || '-';
        }

        // Técnico (campo duplicado en información del cliente)
        const previewTecnico2Element = document.getElementById('previewTecnico2');
        if (previewTecnico2Element) {
            previewTecnico2Element.textContent = info.tecnico.nombre || '-';
        }
        
        // Fecha formateada
        if (formData.fecha_mantenimiento) {
            const fecha = new Date(formData.fecha_mantenimiento);
            document.getElementById('previewFecha').textContent = fecha.toLocaleDateString('es-ES');
        } else {
            document.getElementById('previewFecha').textContent = '-';
        }

        // Equipos
        if (formData.cctv) {
            document.getElementById('previewCamarasA').textContent = formData.cctv.camaras_analogicas || 0;
            document.getElementById('previewCamarasIP').textContent = formData.cctv.camaras_ip || 0;
            document.getElementById('previewMonitores').textContent = formData.cctv.monitores || 0;

            // NVR/DVR
            const nvrContainer = document.getElementById('previewNVRContainer');
            const dvrContainer = document.getElementById('previewDVRContainer');
            const previewNVR = document.getElementById('previewNVR');
            const previewDVR = document.getElementById('previewDVR');

            if (formData.cctv.nvr && formData.cctv.nvr.trim()) {
                nvrContainer.style.display = 'block';
                previewNVR.textContent = formData.cctv.nvr;
            } else {
                nvrContainer.style.display = 'none';
            }

            if (formData.cctv.dvr && formData.cctv.dvr.trim()) {
                dvrContainer.style.display = 'block';
                previewDVR.textContent = formData.cctv.dvr;
            } else {
                dvrContainer.style.display = 'none';
            }

            // Checklist
            this.updateChecklistPreview(formData.cctv.checklist);
        }

        // Solicitudes del cliente
        const solicitudesContainer = document.getElementById('previewSolicitudesContainer');
        const previewSolicitudes = document.getElementById('previewSolicitudes');
        if (formData.solicitudes_cliente && formData.solicitudes_cliente.trim()) {
            solicitudesContainer.style.display = 'block';
            previewSolicitudes.textContent = formData.solicitudes_cliente;
        } else {
            solicitudesContainer.style.display = 'none';
        }

        // Observaciones
        const observacionesContainer = document.getElementById('previewObservacionesContainer');
        const previewObservaciones = document.getElementById('previewObservaciones');
        if (formData.observaciones && formData.observaciones.trim()) {
            observacionesContainer.style.display = 'block';
            previewObservaciones.textContent = formData.observaciones;
        } else {
            observacionesContainer.style.display = 'none';
        }

        // Código único (temporal)
        document.getElementById('previewCodigo').textContent = this.generateTempCode();

        // Actualizar firmas si existen
        if (this.signatures.tecnico) {
            this.updateMainPreviewSignature('tecnico', this.signatures.tecnico);
        }
        if (this.signatures.cliente) {
            this.updateMainPreviewSignature('cliente', this.signatures.cliente);
        }
    }

    /**
     * Actualizar checklist en preview
     */
    updateChecklistPreview(checklist) {
        const previewChecklist = document.getElementById('previewChecklist');
        if (!previewChecklist) return;

        const labels = {
            'grabaciones': 'Grabaciones',
            'limpieza_camaras': 'Limpieza de cámaras',
            'fecha_hora': 'Fecha y hora',
            'enfoques': 'Enfoques',
            'configuraciones': 'Configuraciones',
            'filtros': 'Filtros',
            'revision_cables': 'Revisión de cables y conectores',
            'revision_almacenamiento': 'Revisión de almacenamiento'
        };

        if (checklist && checklist.length > 0) {
            const items = checklist.map(item => `✓ ${labels[item] || item}`).join('<br>');
            previewChecklist.innerHTML = items;
        } else {
            previewChecklist.innerHTML = 'No hay elementos seleccionados';
        }
    }

    /**
     * Generar número de certificado con formato: TIPO-100-08-2025
     */
    generateCertificateNumber() {
        const prefix = this.currentCertificateType?.toUpperCase() || 'CERT';
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        
        // Obtener y incrementar el contador
        const counter = this.certificateCounters[this.currentCertificateType] || 100;
        this.certificateCounters[this.currentCertificateType] = counter + 1;
        
        return `${prefix}-${counter}-${month}-${year}`;
    }

    /**
     * Generar código temporal (legacy - mantener compatibilidad)
     */
    generateTempCode() {
        return this.generateCertificateNumber();
    }

    /**
     * Manejar envío del formulario
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        await this.generatePDF();
    }

    /**
     * Validar formulario
     */
    validateForm() {
        const requiredFields = [
            { id: 'clienteSelect', name: 'Cliente' },
            { id: 'instalacionSelect', name: 'Instalación' },
            { id: 'tecnicoSelect', name: 'Técnico' },
            { id: 'fechaMantenimiento', name: 'Fecha de mantenimiento' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element?.value?.trim()) {
                this.showError(`El campo "${field.name}" es requerido`);
                element?.focus();
                return false;
            }
        }

        // Validar que haya al menos una firma
        if (!this.signatures.tecnico && !this.signatures.cliente) {
            this.showError('Se requiere al menos la firma del técnico');
            return false;
        }

        return true;
    }

    /**
     * Generar PDF del certificado
     */
    async generatePDF() {
        const generateBtn = document.getElementById('generateBtn');
        const originalText = generateBtn?.innerHTML;
        
        try {
            if (generateBtn) {
                generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando PDF...';
                generateBtn.disabled = true;
            }

            // Obtener datos actuales
            const formData = this.getFormData();
            const info = this.getClienteInstalacionInfo();

            // Esperar renderizado
            await this.delay(1000);

            // Crear elemento PDF
            const pdfElement = this.createPDFElement(formData, info);
            
            // Agregar al DOM temporalmente
            pdfElement.style.position = 'absolute';
            pdfElement.style.left = '-9999px';
            pdfElement.style.top = '0';
            pdfElement.style.zIndex = '-1';
            document.body.appendChild(pdfElement);

            await this.delay(500);

            // Capturar con html2canvas
            const canvas = await html2canvas(pdfElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: 1200,
                height: 1600,
                removeContainer: true
            });

            document.body.removeChild(pdfElement);

            // Crear PDF
            await this.createPDFFromCanvas(canvas, formData, info);
            
            this.showSuccess('¡Certificado generado exitosamente!');

        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showError(`Error al generar PDF: ${error.message}`);
        } finally {
            if (generateBtn && originalText) {
                setTimeout(() => {
                    generateBtn.innerHTML = originalText;
                    generateBtn.disabled = false;
                }, 500);
            }
        }
    }

    /**
     * Crear elemento HTML para PDF
     */
    createPDFElement(formData, info) {
        const element = document.createElement('div');
        element.style.cssText = `
            width: 1200px;
            height: 1600px;
            padding: 60px;
            background: white;
            font-family: 'Arial', sans-serif;
            color: #333;
            position: relative;
            box-sizing: border-box;
        `;

        if (this.currentCertificateType === 'cctv') {
            element.innerHTML = this.generateCCTVPDFContent(formData, info);
        } else {
            element.innerHTML = this.generateGenericPDFContent(formData, info);
        }

        return element;
    }

    /**
     * Generar contenido PDF para CCTV
     */
    generateCCTVPDFContent(formData, info) {
        const codigo = this.generateTempCode();
        const fecha = formData.fecha_mantenimiento ? 
            new Date(formData.fecha_mantenimiento).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            }) : '-';

        return `
            <!-- Header con barra azul lateral -->
            <div style="text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; position: relative;">
                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: linear-gradient(to bottom, #1e40af, #3b82f6); border-radius: 3px;"></div>
                <h1 style="font-size: 28px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0; text-transform: uppercase;">
                    CERTIFICADO DE MANTENIMIENTO
                </h1>
                <h2 style="font-size: 22px; color: #374151; margin: 0; font-weight: 600;">
                    SISTEMA CCTV
                </h2>
            </div>

            <!-- Información Esencial con fondo azul -->
            <div style="margin-bottom: 30px; background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px; border-radius: 10px; border-left: 6px solid #1e40af; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 16px;">
                    <div style="font-weight: 600; color: #1e40af;">
                        <span style="display: block; font-size: 14px; color: #6b7280;">Fecha:</span>
                        <span style="font-size: 18px; color: #1e40af;">${fecha}</span>
                    </div>
                    <div style="font-weight: 600; color: #1e40af; text-align: right;">
                        <span style="display: block; font-size: 14px; color: #6b7280;">Certificado N°:</span>
                        <span style="font-size: 18px; color: #1e40af;">${codigo}</span>
                    </div>
                </div>
            </div>

            <!-- Información del Cliente con barra azul -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    INFORMACIÓN DEL CLIENTE
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; padding: 0 20px;">
                    <div><strong>Cliente:</strong> ${info.cliente.nombre || '-'}</div>
                    <div><strong>RUT:</strong> ${info.cliente.rut || '-'}</div>
                    <div><strong>Contacto:</strong> ${info.cliente.contacto || '-'}</div>
                    <div><strong>Técnico:</strong> ${info.tecnico.nombre || '-'}</div>
                    <div style="grid-column: 1 / 3;"><strong>Dirección:</strong> ${info.instalacion.direccion || '-'}</div>
                </div>
            </div>

            <!-- Equipos Instalados con barra azul -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    EQUIPOS INSTALADOS
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 14px; padding: 0 20px;">
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <strong style="color: #475569;">Cámaras IP:</strong><br>
                        <span style="font-size: 24px; color: #1e40af; font-weight: bold;">${formData.cctv?.camaras_ip || 0}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <strong style="color: #475569;">Cámaras Analógicas:</strong><br>
                        <span style="font-size: 24px; color: #1e40af; font-weight: bold;">${formData.cctv?.camaras_analogicas || 0}</span>
                    </div>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                        <strong style="color: #475569;">Monitores:</strong><br>
                        <span style="font-size: 24px; color: #1e40af; font-weight: bold;">${formData.cctv?.monitores || 0}</span>
                    </div>
                </div>
                ${formData.cctv?.nvr || formData.cctv?.dvr ? `
                <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; padding: 0 20px;">
                    ${formData.cctv.nvr ? `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6;"><strong style="color: #1e40af;">NVR:</strong> ${formData.cctv.nvr}</div>` : ''}
                    ${formData.cctv.dvr ? `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6;"><strong style="color: #1e40af;">DVR:</strong> ${formData.cctv.dvr}</div>` : ''}
                </div>
                ` : ''}
            </div>

            <!-- Lista de Verificación con barra azul -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    VERIFICACIÓN REALIZADA
                </h3>
                <div style="font-size: 14px; line-height: 1.8; padding: 0 20px; background: #fefefe; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin: 0 20px;">
                    ${this.formatChecklistForPDF(formData.cctv?.checklist)}
                </div>
            </div>

            <!-- Solicitudes del Cliente con barra azul -->
            ${formData.solicitudes_cliente ? `
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #f59e0b; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #fef3c7, transparent); border-left: 4px solid #f59e0b;">
                    SOLICITUDES DEL CLIENTE
                </h3>
                <div style="font-size: 14px; line-height: 1.6; background: #fef3c7; padding: 20px; border-radius: 8px; margin: 0 20px; border: 1px solid #fde68a;">
                    ${formData.solicitudes_cliente.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}

            <!-- Observaciones con barra azul -->
            ${formData.observaciones ? `
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    OBSERVACIONES Y RECOMENDACIONES
                </h3>
                <div style="font-size: 14px; line-height: 1.6; background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 20px; border: 1px solid #e2e8f0;">
                    ${formData.observaciones.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}

            <!-- Firmas -->
            <div style="position: absolute; bottom: 80px; left: 60px; right: 60px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
                    <div style="text-align: center;">
                        <div style="height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            ${formData.firmas.tecnico ? `<img src="${formData.firmas.tecnico}" style="max-height: 70px; max-width: 200px;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                        </div>
                        <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                            <strong>Técnico Responsable</strong><br>
                            <span style="font-size: 12px;">${info.tecnico.nombre || 'N/A'}</span>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            ${formData.firmas.cliente ? `<img src="${formData.firmas.cliente}" style="max-height: 70px; max-width: 200px;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                        </div>
                        <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                            <strong>Conforme Cliente</strong><br>
                            <span style="font-size: 12px;">${info.cliente.contacto || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Código y Fecha -->
            <div style="position: absolute; bottom: 20px; left: 60px; right: 60px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <strong>Código de Validación:</strong> ${codigo} | 
                <strong>Generado el:</strong> ${new Date().toLocaleDateString('es-ES')}
            </div>
        `;
    }

    /**
     * Generar contenido PDF genérico
     */
    generateGenericPDFContent(formData, info) {
        const tipo = formData.tipo_certificado?.toUpperCase() || 'MANTENIMIENTO';
        return `
            <div style="text-align: center; padding: 100px 0;">
                <h1 style="font-size: 32px; color: #1e40af; margin-bottom: 50px;">
                    CERTIFICADO DE ${tipo}
                </h1>
                <p style="font-size: 18px; color: #666;">
                    Formulario en desarrollo
                </p>
            </div>
        `;
    }

    /**
     * Formatear checklist para PDF
     */
    formatChecklistForPDF(checklist) {
        const labels = {
            'grabaciones': 'Grabaciones',
            'limpieza_camaras': 'Limpieza de cámaras',
            'fecha_hora': 'Fecha y hora',
            'enfoques': 'Enfoques',
            'configuraciones': 'Configuraciones',
            'filtros': 'Filtros',
            'revision_cables': 'Revisión de cables y conectores',
            'revision_almacenamiento': 'Revisión de almacenamiento'
        };

        if (!checklist || checklist.length === 0) {
            return '<div style="color: #9ca3af; font-style: italic;">No hay elementos verificados</div>';
        }

        return checklist.map(item => 
            `<div style="margin: 8px 0;"><span style="color: #059669; font-weight: bold;">✓</span> ${labels[item] || item}</div>`
        ).join('');
    }

    /**
     * Crear PDF desde canvas
     */
    async createPDFFromCanvas(canvas, formData, info) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 10;
        
        const maxWidth = pdfWidth - (margin * 2);
        const maxHeight = pdfHeight - (margin * 2);
        
        const canvasRatio = canvas.height / canvas.width;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth * canvasRatio;
        
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight / canvasRatio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

        const fileName = this.generateFileName(formData, info);
        pdf.save(fileName);
    }

    /**
     * Generar nombre de archivo
     */
    generateFileName(formData, info) {
        const tipo = formData.tipo_certificado || 'mantenimiento';
        const cliente = info.cliente.nombre || 'cliente';
        const fecha = formData.fecha_mantenimiento || new Date().toISOString().split('T')[0];
        
        const clienteClean = cliente
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');
        
        return `certificado_${tipo}_${clienteClean}_${fecha}.pdf`;
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

        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

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

// Funciones globales para las firmas
window.removeFirma = function(tipo) {
    if (window.maintenanceSystem) {
        window.maintenanceSystem.removeFirma(tipo);
    }
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.maintenanceSystem = new MaintenanceCertificateSystem();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.maintenanceSystem) {
            window.maintenanceSystem = new MaintenanceCertificateSystem();
        }
    });
} else {
    window.maintenanceSystem = new MaintenanceCertificateSystem();
}

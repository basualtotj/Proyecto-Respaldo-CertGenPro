// Sistema de Certificados de Mantenimiento - Versión Optimizada
class MaintenanceCertificateSystem {
    constructor() {
        this.currentCertificateType = null;
        this.signatureData = {
            tecnico: null,
            cliente: null
        };
        
        // Base de datos de clientes
        this.clientes = [
            {
                id: 1,
                nombre: "Corporación PF",
                rut: "76.152.493-0",
                contacto: "contacto@corporacionpf.cl",
                instalaciones: [
                    { id: 1, nombre: "Casa Matriz - Las Condes", direccion: "Av. Apoquindo 3721, Las Condes" },
                    { id: 2, nombre: "Sucursal Providencia", direccion: "Av. Providencia 2653, Providencia" },
                    { id: 3, nombre: "Centro de Distribución", direccion: "Av. Dorsal 5468, Pudahuel" }
                ]
            },
            {
                id: 2,
                nombre: "Tecnologías Avanzadas SA",
                rut: "96.876.543-K",
                contacto: "soporte@tecavanzadas.cl",
                instalaciones: [
                    { id: 1, nombre: "Oficina Central", direccion: "Av. Vitacura 2939, Vitacura" },
                    { id: 2, nombre: "Data Center", direccion: "Camino a Melipilla 13450, Maipú" }
                ]
            },
            {
                id: 3,
                nombre: "Grupo Empresarial Norte",
                rut: "78.234.567-1",
                contacto: "admin@grupoempresnorte.cl",
                instalaciones: [
                    { id: 1, nombre: "Torre Corporativa", direccion: "Av. Nueva Providencia 2155, Providencia" },
                    { id: 2, nombre: "Planta Industrial", direccion: "Av. Presidente Eduardo Frei 8001, Quilicura" },
                    { id: 3, nombre: "Almacén Central", direccion: "Ruta 5 Norte Km 18, Lampa" }
                ]
            }
        ];
        
        // Base de datos de técnicos
        this.tecnicos = [
            { id: 1, nombre: "Juan Carlos Pérez", especialidad: "CCTV y Seguridad" },
            { id: 2, nombre: "María Elena González", especialidad: "Hardware y Redes" },
            { id: 3, nombre: "Roberto Silva Martínez", especialidad: "Infraestructura y Racks" },
            { id: 4, nombre: "Andrea López Castro", especialidad: "Sistemas Integrados" }
        ];

        this.currentScale = 0.75;
        this.init();
    }

    init() {
        this.loadClientes();
        this.loadTecnicos();
        this.setCurrentDate();
        this.bindEvents();
        this.bindSignatureEvents();
        console.log('Sistema de Certificados de Mantenimiento inicializado');
    }

    bindEvents() {
        // Botones de tipo de certificado
        const typeBtns = document.querySelectorAll('.certificate-type-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCertificateType(e));
        });

        // Selectores
        const clienteSelect = document.getElementById('clienteSelect');
        if (clienteSelect) {
            clienteSelect.addEventListener('change', () => this.loadInstalaciones());
        }

        const instalacionSelect = document.getElementById('instalacionSelect');
        if (instalacionSelect) {
            instalacionSelect.addEventListener('change', () => this.updatePreview());
        }

        // Campos del formulario
        const formFields = [
            'clienteSelect', 'instalacionSelect', 'fechaMantenimiento',
            'tecnicoSelect', 'solicitudesCliente', 'observacionesGenerales'
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
            form.addEventListener('submit', (e) => this.generatePDF(e));
        }

        // Controles de zoom
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        if (zoomIn) zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
        if (zoomOut) zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    }

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

    selectCertificateType(e) {
        // Limpiar selecciones previas
        const typeBtns = document.querySelectorAll('.certificate-type-btn');
        typeBtns.forEach(btn => {
            btn.classList.remove('bg-blue-50', 'border-blue-500', 'bg-green-50', 'border-green-500', 'bg-purple-50', 'border-purple-500');
            btn.classList.add('border-gray-200');
        });

        const type = e.currentTarget.dataset.type;
        this.currentCertificateType = type;

        // Aplicar estilos según el tipo
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

    showForm() {
        document.getElementById('selectTypeMessage').classList.add('hidden');
        document.getElementById('mainForm').classList.remove('hidden');
        document.getElementById('previewSection').classList.remove('hidden');
        document.getElementById('certificatePreview').classList.remove('hidden');
    }

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

    updateFormTitle() {
        const titles = {
            'cctv': 'Certificado de Mantenimiento CCTV',
            'hardware': 'Certificado de Mantenimiento Hardware Computacional', 
            'racks': 'Certificado de Mantenimiento Racks de Comunicaciones'
        };

        const formTitle = document.getElementById('formTitle');
        if (formTitle && this.currentCertificateType) {
            formTitle.textContent = titles[this.currentCertificateType];
        }
    }

    loadClientes() {
        const clienteSelect = document.getElementById('clienteSelect');
        clienteSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
        
        this.clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            clienteSelect.appendChild(option);
        });
    }

    loadInstalaciones() {
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        
        instalacionSelect.innerHTML = '<option value="">Seleccione una instalación</option>';
        
        const clienteId = parseInt(clienteSelect.value);
        
        if (clienteId) {
            const cliente = this.clientes.find(c => c.id === clienteId);
            if (cliente && cliente.instalaciones) {
                cliente.instalaciones.forEach(instalacion => {
                    const option = document.createElement('option');
                    option.value = instalacion.id;
                    option.textContent = `${instalacion.nombre} - ${instalacion.direccion}`;
                    instalacionSelect.appendChild(option);
                });
            }
        }
        
        this.updatePreview();
    }

    loadTecnicos() {
        const tecnicoSelect = document.getElementById('tecnicoSelect');
        tecnicoSelect.innerHTML = '<option value="">Seleccione un técnico</option>';
        
        this.tecnicos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = `${tecnico.nombre} - ${tecnico.especialidad}`;
            tecnicoSelect.appendChild(option);
        });
    }

    setCurrentDate() {
        const fechaField = document.getElementById('fechaMantenimiento');
        if (fechaField && !fechaField.value) {
            const today = new Date().toISOString().split('T')[0];
            fechaField.value = today;
        }
    }

    handleSignature(e, tipo) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor seleccione un archivo de imagen válido.');
            return;
        }
        
        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Máximo 2MB permitido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageSrc = event.target.result;
            this.signatureData[tipo] = imageSrc;
            this.updateSignaturePreview(tipo, imageSrc);
            this.updateMainPreviewSignature(tipo, imageSrc);
        };
        reader.readAsDataURL(file);
    }

    updateSignaturePreview(tipo, imageSrc) {
        const preview = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Preview`);
        const placeholder = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Placeholder`);
        const img = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Img`);

        if (preview && placeholder && img) {
            img.src = imageSrc;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        }
    }

    updateMainPreviewSignature(tipo, imageSrc) {
        let previewElement;
        if (tipo === 'tecnico') {
            previewElement = document.getElementById('previewFirmaTecnico');
        } else if (tipo === 'cliente') {
            previewElement = document.getElementById('previewFirmaCliente');
        }

        if (previewElement) {
            if (imageSrc) {
                previewElement.innerHTML = `<img src="${imageSrc}" alt="Firma ${tipo}" class="max-w-full h-16 object-contain">`;
            } else {
                previewElement.innerHTML = `<div class="text-gray-400 text-xs">Sin firma</div>`;
            }
        }
    }

    removeFirma(tipo) {
        const input = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        const preview = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Preview`);
        const placeholder = document.getElementById(`firma${tipo.charAt(0).toUpperCase() + tipo.slice(1)}Placeholder`);

        if (preview && placeholder && input) {
            input.value = '';
            this.signatureData[tipo] = null;
            preview.classList.add('hidden');
            placeholder.classList.remove('hidden');
            this.updateMainPreviewSignature(tipo, null);
        }
    }

    adjustZoom(delta) {
        const preview = document.getElementById('certificatePreview');
        if (preview) {
            this.currentScale = Math.max(0.5, Math.min(1.5, this.currentScale + delta));
            preview.style.transform = `scale(${this.currentScale})`;
        }
    }

    getFormData() {
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        const fechaMantenimiento = document.getElementById('fechaMantenimiento');
        const tecnicoSelect = document.getElementById('tecnicoSelect');
        const solicitudesCliente = document.getElementById('solicitudesCliente');
        const observacionesGenerales = document.getElementById('observacionesGenerales');

        const formData = {
            cliente: clienteSelect.value,
            instalacion: instalacionSelect.value,
            fechaMantenimiento: fechaMantenimiento.value,
            tecnico: tecnicoSelect.value,
            solicitudesCliente: solicitudesCliente.value,
            observacionesGenerales: observacionesGenerales.value,
            firmas: this.signatureData
        };

        // Agregar datos específicos de CCTV
        if (this.currentCertificateType === 'cctv') {
            const checkboxes = document.querySelectorAll('input[name="cctvCheck"]:checked');
            formData.cctvChecklist = Array.from(checkboxes).map(cb => cb.value);
        }

        return formData;
    }

    getClienteInstalacionInfo() {
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        
        const clienteId = parseInt(clienteSelect.value);
        const instalacionId = parseInt(instalacionSelect.value);
        
        const cliente = this.clientes.find(c => c.id === clienteId);
        let instalacion = null;
        
        if (cliente && instalacionId) {
            instalacion = cliente.instalaciones.find(i => i.id === instalacionId);
        }
        
        return {
            cliente,
            instalacion
        };
    }

    updatePreview() {
        if (!this.currentCertificateType) {
            this.showPlaceholderPreview();
            return;
        }

        const formData = this.getFormData();
        const info = this.getClienteInstalacionInfo();

        // Actualizar elementos básicos del preview
        document.getElementById('previewTipo').textContent = 
            this.currentCertificateType === 'cctv' ? 'CCTV' :
            this.currentCertificateType === 'hardware' ? 'Hardware Computacional' :
            'Racks de Comunicaciones';

        // Actualizar preview específico
        if (this.currentCertificateType === 'cctv') {
            this.updateCCTVPreview(formData, info);
        }
    }

    showPlaceholderPreview() {
        const previewContent = document.getElementById('certificatePreview');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-file-alt text-4xl mb-4"></i>
                    <p>Seleccione un tipo de certificado para ver el preview</p>
                </div>
            `;
        }
    }

    updateCCTVPreview(formData, info) {
        // Generar número de certificado
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const certificateNumber = `CCTV-100-${month}-${year}`;

        // Actualizar técnico final
        const previewTecnicoFinalElement = document.getElementById('previewTecnicoFinal');
        if (previewTecnicoFinalElement) {
            const tecnico = this.tecnicos.find(t => t.id === parseInt(formData.tecnico));
            previewTecnicoFinalElement.textContent = tecnico ? tecnico.nombre : 'No seleccionado';
        }

        // Actualizar RUT
        const previewRutElement = document.getElementById('previewRut');
        if (previewRutElement) {
            previewRutElement.textContent = info.cliente ? info.cliente.rut : 'No seleccionado';
        }

        // Actualizar contacto
        const previewContactoElement = document.getElementById('previewContacto');
        if (previewContactoElement) {
            previewContactoElement.textContent = info.cliente ? info.cliente.contacto : 'No seleccionado';
        }

        // Actualizar elementos principales
        this.updatePreviewElements(formData, info, certificateNumber);
        this.updateCCTVChecklist(formData);
    }

    updatePreviewElements(formData, info, certificateNumber) {
        const updates = {
            'previewNumero': certificateNumber,
            'previewCliente': info.cliente ? info.cliente.nombre : 'No seleccionado',
            'previewInstalacion': info.instalacion ? info.instalacion.nombre : 'No seleccionado',
            'previewDireccion': info.instalacion ? info.instalacion.direccion : 'No seleccionado',
            'previewFecha': formData.fechaMantenimiento || 'No seleccionado',
            'previewTecnico': (() => {
                const tecnico = this.tecnicos.find(t => t.id === parseInt(formData.tecnico));
                return tecnico ? tecnico.nombre : 'No seleccionado';
            })(),
            'previewSolicitudes': formData.solicitudesCliente || 'No especificado',
            'previewObservaciones': formData.observacionesGenerales || 'No especificado'
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateCCTVChecklist(formData) {
        // Limpiar lista previa
        const previewChecklist = document.getElementById('previewCCTVChecklist');
        if (!previewChecklist) return;
        
        previewChecklist.innerHTML = '';
        
        if (formData.cctvChecklist && formData.cctvChecklist.length > 0) {
            const checklistItems = [
                'Limpieza de cámaras y lentes',
                'Verificación de conectividad de red',
                'Revisión de grabaciones',
                'Prueba de visualización remota',
                'Verificación de detección de movimiento',
                'Revisión de almacenamiento',
                'Prueba de notificaciones',
                'Verificación de respaldos automáticos'
            ];

            formData.cctvChecklist.forEach(item => {
                const itemIndex = parseInt(item) - 1;
                if (itemIndex >= 0 && itemIndex < checklistItems.length) {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas fa-check text-green-600 mr-2"></i>${checklistItems[itemIndex]}`;
                    li.className = 'mb-1 text-sm';
                    previewChecklist.appendChild(li);
                }
            });
        } else {
            previewChecklist.innerHTML = '<li class="text-gray-500 text-sm">No hay elementos seleccionados</li>';
        }
    }

    async generatePDF(e) {
        e.preventDefault();
        
        if (!this.currentCertificateType) {
            alert('Por favor seleccione un tipo de certificado');
            return;
        }

        const formData = this.getFormData();
        
        // Validaciones básicas
        if (!formData.cliente || !formData.instalacion || !formData.tecnico) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            const pdf = await this.createPDF(formData);
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const filename = `Certificado_${this.currentCertificateType.toUpperCase()}_${timestamp}.pdf`;
            
            pdf.save(filename);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
        }
    }

    async createPDF(formData) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const info = this.getClienteInstalacionInfo();
        
        // Configuración inicial
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = 30;

        // Generar número de certificado
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const certificateNumber = `${this.currentCertificateType.toUpperCase()}-100-${month}-${year}`;

        // Encabezado con barra azul
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, pageWidth, 25, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        
        const titles = {
            'cctv': 'CERTIFICADO DE MANTENIMIENTO CCTV',
            'hardware': 'CERTIFICADO DE MANTENIMIENTO HARDWARE',
            'racks': 'CERTIFICADO DE MANTENIMIENTO RACKS'
        };
        
        const title = titles[this.currentCertificateType];
        const titleX = (pageWidth - pdf.getTextWidth(title)) / 2;
        pdf.text(title, titleX, 16);

        // Información del certificado
        yPosition = 45;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        
        pdf.text(`N° Certificado: ${certificateNumber}`, margin, yPosition);
        pdf.text(`Fecha: ${formData.fechaMantenimiento}`, pageWidth - 80, yPosition);

        // Sección Cliente con barra azul
        yPosition += 20;
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition - 8, pageWidth - 2 * margin, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INFORMACIÓN DEL CLIENTE', margin + 5, yPosition);

        // Datos del cliente
        yPosition += 20;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        const clienteData = [
            `Cliente: ${info.cliente ? info.cliente.nombre : 'No especificado'}`,
            `RUT: ${info.cliente ? info.cliente.rut : 'No especificado'}`,
            `Contacto: ${info.cliente ? info.cliente.contacto : 'No especificado'}`,
            `Instalación: ${info.instalacion ? info.instalacion.nombre : 'No especificado'}`,
            `Dirección: ${info.instalacion ? info.instalacion.direccion : 'No especificado'}`
        ];

        clienteData.forEach(line => {
            pdf.text(line, margin, yPosition);
            yPosition += 8;
        });

        // Sección Técnico
        yPosition += 10;
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition - 8, pageWidth - 2 * margin, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TÉCNICO RESPONSABLE', margin + 5, yPosition);

        yPosition += 20;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        const tecnico = this.tecnicos.find(t => t.id === parseInt(formData.tecnico));
        pdf.text(`Técnico: ${tecnico ? tecnico.nombre : 'No especificado'}`, margin, yPosition);

        // Trabajos realizados específicos
        yPosition += 20;
        if (this.currentCertificateType === 'cctv' && formData.cctvChecklist && formData.cctvChecklist.length > 0) {
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, yPosition - 8, pageWidth - 2 * margin, 15, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('TRABAJOS REALIZADOS', margin + 5, yPosition);

            yPosition += 20;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');

            const checklistItems = [
                'Limpieza de cámaras y lentes',
                'Verificación de conectividad de red', 
                'Revisión de grabaciones',
                'Prueba de visualización remota',
                'Verificación de detección de movimiento',
                'Revisión de almacenamiento',
                'Prueba de notificaciones',
                'Verificación de respaldos automáticos'
            ];

            formData.cctvChecklist.forEach(item => {
                const itemIndex = parseInt(item) - 1;
                if (itemIndex >= 0 && itemIndex < checklistItems.length) {
                    pdf.text(`✓ ${checklistItems[itemIndex]}`, margin + 5, yPosition);
                    yPosition += 8;
                }
            });
        }

        // Solicitudes del cliente
        if (formData.solicitudesCliente) {
            yPosition += 15;
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, yPosition - 8, pageWidth - 2 * margin, 15, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('SOLICITUDES DEL CLIENTE', margin + 5, yPosition);

            yPosition += 20;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            
            const solicitudesLines = pdf.splitTextToSize(formData.solicitudesCliente, pageWidth - 2 * margin);
            solicitudesLines.forEach(line => {
                pdf.text(line, margin, yPosition);
                yPosition += 6;
            });
        }

        // Observaciones
        if (formData.observacionesGenerales) {
            yPosition += 15;
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, yPosition - 8, pageWidth - 2 * margin, 15, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('OBSERVACIONES GENERALES', margin + 5, yPosition);

            yPosition += 20;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            
            const observacionesLines = pdf.splitTextToSize(formData.observacionesGenerales, pageWidth - 2 * margin);
            observacionesLines.forEach(line => {
                pdf.text(line, margin, yPosition);
                yPosition += 6;
            });
        }

        // Firmas
        yPosition += 30;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Firma Técnico:', margin, yPosition);
        pdf.text('Firma Cliente:', pageWidth / 2 + 20, yPosition);

        if (formData.firmas.tecnico) {
            try {
                pdf.addImage(formData.firmas.tecnico, 'JPEG', margin, yPosition + 5, 60, 30);
            } catch (error) {
                console.log('Error al agregar firma técnico:', error);
            }
        }

        if (formData.firmas.cliente) {
            try {
                pdf.addImage(formData.firmas.cliente, 'JPEG', pageWidth / 2 + 20, yPosition + 5, 60, 30);
            } catch (error) {
                console.log('Error al agregar firma cliente:', error);
            }
        }

        return pdf;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    new MaintenanceCertificateSystem();
});

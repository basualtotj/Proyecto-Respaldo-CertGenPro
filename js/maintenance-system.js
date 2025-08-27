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
        
        // Servicio de datos - Auto-detecta modo JSON/API según ambiente
        this.dataService = new DataService(); // Auto-detecta: JSON en desarrollo, API en producción
        
        // Datos que se cargarán dinámicamente
        this.clientes = [];
        this.tecnicos = [];
        this.configuracion = {};
        this.checklists = {};
        
        // Sistema de numeración de certificados (se cargará dinámicamente)
        this.certificateCounters = {};
        
    // Evidencias fotográficas y datos de empresa
    this.evidencias = [];
    this.empresa = null;
    this._empresaLogoDataUrl = null; // cache para logo embed en PDF
    // Detectar si existe la vista previa en el DOM (se eliminó del index por requerimiento)
    this.previewEnabled = !!document.getElementById('certificatePreview');
        
        this.init();
    }

    /**
     * Inicializar la aplicación
     */
    async init() {
        try {
            // Cargar datos usando DataService
            await this.loadAllData();
            
            // Configurar eventos y elementos
            this.bindEvents();
            this.populateClientes();
            this.populateTecnicos();
            // Configurar firma automática del técnico desde CRUD (sin carga manual)
            this.setupTechnicianSignatureAutoFill();
            // Configurar firma del representante de la empresa desde CRUD (auto)
            await this.setupCompanyRepresentativeSignature();
            // Preparar manejo de evidencias fotográficas
            this.setupEvidenceHandlers();
            this.setCurrentDate();

            // Si venimos desde el repositorio para descargar un PDF, procesarlo ahora
            await this.processIncomingDownloadRequest();
            
            console.log('🚀 Sistema de Certificados de Mantenimiento - Inicializado');
            console.log('📊 Datos cargados:', this.dataService.getStatus());
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.showError('Error al cargar los datos del sistema');
        }
    }

    /**
     * Procesar solicitud de descarga automática proveniente de certificados.html
     * Espera encontrar en localStorage la clave 'cert_to_download' con detalle del certificado
     */
    async processIncomingDownloadRequest() {
        try {
            if (location.hash !== '#download') return;
            const raw = window.localStorage.getItem('cert_to_download');
            if (!raw) return;
            const detail = JSON.parse(raw);

            // Quitar hash para evitar repetición si algo falla más adelante
            history.replaceState(null, '', location.pathname + location.search);

            // Mapear datos: tipo, selecciones, equipos, checklist, firmas si vinieran
            const tipo = (detail.tipo || '').toLowerCase();
            if (!tipo) return;

            // Seleccionar tipo visualmente y mostrar formulario
            const btn = document.querySelector(`.certificate-type-btn[data-type="${tipo}"]`);
            if (btn) {
                this.selectCertificateType({ preventDefault: () => {}, currentTarget: btn });
            } else {
                this.currentCertificateType = tipo;
                this.showForm();
                this.showSpecificForm();
                this.updateFormTitle();
            }

            // Asegurar que combos estén renderizados
            await this.delay(100);

            // Setear cliente/instalación/técnico si hay IDs en el detalle
            const setSelectValue = async (id, value) => {
                const el = document.getElementById(id);
                if (!el || !value) return;
                el.value = String(value);
                el.dispatchEvent(new Event('change'));
                // Si es cliente, esperar carga de instalaciones
                if (id === 'clienteSelect') await this.delay(150);
            };

            await setSelectValue('clienteSelect', detail.cliente_id || detail.cliente?.id);
            await setSelectValue('instalacionSelect', detail.instalacion_id || detail.instalacion?.id);
            await setSelectValue('tecnicoSelect', detail.tecnico_id || detail.tecnico?.id);

            // Fecha
            const fechaInput = document.getElementById('fechaMantenimiento');
            if (fechaInput && detail.fecha_mantenimiento) {
                fechaInput.value = detail.fecha_mantenimiento.substring(0, 10);
            }

            // Texto largo
            if (detail.solicitudes_cliente) {
                const el = document.getElementById('solicitudesCliente');
                if (el) el.value = detail.solicitudes_cliente;
            }
            if (detail.observaciones) {
                const el = document.getElementById('observaciones');
                if (el) el.value = detail.observaciones;
            }

            // Equipos/checklist (guardados dentro de checklist_data)
            const equipos = detail.checklist_data?.equipos || detail.equipos || {};
            const setVal = (id, val) => { const el = document.getElementById(id); if (el && (val !== undefined && val !== null)) el.value = String(val); };
            if (tipo === 'cctv') {
                setVal('camarasIP', equipos.camaras_ip ?? 0);
                setVal('camarasAnalogicas', equipos.camaras_analogicas ?? 0);
                setVal('monitores', equipos.monitores ?? 0);
                setVal('nvr', equipos.nvr ?? '');
                setVal('dvr', equipos.dvr ?? '');
                setVal('joystick', equipos.joystick ?? '');
                // Checklist
                const checklist = detail.checklist_data?.checklist || detail.cctv?.checklist || [];
                const checks = new Set(Array.isArray(checklist) ? checklist : []);
                document.querySelectorAll('input[name="cctvCheck"]').forEach(cb => {
                    cb.checked = checks.has(cb.value);
                });
            }

            // Firmas (si el backend guarda las imágenes, restáuralas)
            const firmas = detail.firmas || {};
            if (firmas.tecnico) this.signatures.tecnico = firmas.tecnico;
            if (firmas.cliente) this.signatures.cliente = firmas.cliente;

            // Asignar número de certificado ya existente para que aparezca en el PDF
            this.assignedCertificateNumber = detail.numero_certificado || detail.codigo || this.generateCertificateNumber();

            // Evidencias fotográficas si están almacenadas
            if (Array.isArray(detail.evidencias) && detail.evidencias.length) {
                this.evidencias = detail.evidencias.map(e => ({ src: e.src, orientation: e.orientation, w: e.w, h: e.h }));
            }

            // Actualizar vista previa interna (si existiera) y generar PDF
            this.updatePreview();
            await this.delay(200);
            await this.generatePDF();

            // Limpieza
            window.localStorage.removeItem('cert_to_download');
        } catch (err) {
            console.warn('No se pudo procesar descarga automática:', err?.message || err);
            // En caso de fallo, limpiar hash y storage para no bloquear UI
            history.replaceState(null, '', location.pathname + location.search);
            window.localStorage.removeItem('cert_to_download');
        }
    }

    /**
     * Cargar todos los datos necesarios
     */
    async loadAllData() {
        try {
            // Cargar datos en paralelo para mejor performance
            const [clientes, tecnicos, configuracion, checklists] = await Promise.all([
                this.dataService.getClientes(),
                this.dataService.getTecnicos(),
                this.dataService.getConfiguracion(),
                this.dataService.getChecklists()
            ]);

            this.clientes = clientes;
            this.tecnicos = tecnicos;
            this.configuracion = configuracion;
            this.checklists = checklists;

            // Cargar contadores actuales
            await this.loadCounters();
            
            console.log('✅ Todos los datos cargados exitosamente');
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            throw error;
        }
    }

    /**
     * Cargar contadores de certificados
     */
    async loadCounters() {
        try {
            const tipos = ['cctv', 'hardware', 'racks'];
            
            for (const tipo of tipos) {
                this.certificateCounters[tipo] = await this.dataService.getContador(tipo);
            }
            
            console.log('📊 Contadores cargados:', this.certificateCounters);
        } catch (error) {
            console.warn('⚠️ Error al cargar contadores, usando valores por defecto');
            this.certificateCounters = { cctv: 101, hardware: 201, racks: 301 };
        }
    }

    /**
     * Mostrar mensaje de error al usuario
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        errorDiv.innerHTML = `<strong>Atención:</strong> ${message}`;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(errorDiv, container.firstChild);
        
        // Remover después de 10 segundos
        setTimeout(() => {
            errorDiv.remove();
        }, 10000);
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
            clienteSelect.addEventListener('change', async () => {
                try {
                    await this.loadInstalaciones();
                } catch (error) {
                    console.error('Error al cargar instalaciones:', error);
                }
            });
        }
        
        if (instalacionSelect) {
            instalacionSelect.addEventListener('change', async () => {
                // Autocompletar equipos desde la instalación si existen metadatos
                this.autofillEquipmentFromInstallation();
                this.updatePreview();
            });
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

        // Botón "Cargar último" (debe existir un elemento con id loadLastBtn)
        const loadLastBtn = document.getElementById('loadLastBtn');
        if (loadLastBtn) {
            loadLastBtn.addEventListener('click', () => this.loadLastCertificateData());
        }

        // Botón "Marcar todos" para checklist (id markAllChecklistBtn)
        const markAllBtn = document.getElementById('markAllChecklistBtn');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllChecklist());
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
     * Autocompletar campos de equipos desde la instalación seleccionada
     */
    autofillEquipmentFromInstallation() {
        const formData = this.getFormData();
        const cliente = this.clientes.find(c => c.id == formData.cliente_id);
        if (!cliente) return;
        const instalacion = cliente.instalaciones.find(i => i.id == formData.instalacion_id);
        if (!instalacion) return;

        // Esperamos que el CRUD de instalaciones almacene metadatos de equipos, por ejemplo:
        // i.meta_equipos = { camaras_ip, camaras_analogicas, nvr, dvr, monitores, joystick }
        const meta = instalacion.meta_equipos || instalacion.equipos || null;
        if (!meta) return;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val ?? '').toString(); };
        setVal('camarasIP', meta.camaras_ip ?? '');
        setVal('camarasAnalogicas', meta.camaras_analogicas ?? '');
        setVal('nvr', meta.nvr ?? '');
        setVal('dvr', meta.dvr ?? '');
        setVal('monitores', meta.monitores ?? '');
        // Joystick si existe campo en formulario (opcional)
        const jsField = document.getElementById('joystick');
        if (jsField) jsField.value = meta.joystick ?? '';
    }

    /**
     * Cargar datos del último certificado del cliente+instalación actuales (omitiendo fecha)
     */
    async loadLastCertificateData() {
        const fd = this.getFormData();
        if (!fd.cliente_id || !fd.instalacion_id) {
            this.showError('Seleccione cliente e instalación primero');
            return;
        }
        try {
            // Mostrar estado de carga breve
            this.showSuccess('Buscando último certificado…');
            let fuente = 'api';
            let ultimo = await this.dataService.getUltimoCertificado(Number(fd.cliente_id), Number(fd.instalacion_id), this.currentCertificateType || '');
            if (!ultimo) {
                // Fallback de caché local por si el backend aún no refleja el último registro
                try {
                    const key = this.makeLastCacheKey(this.currentCertificateType || '', Number(fd.cliente_id), Number(fd.instalacion_id));
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        ultimo = JSON.parse(raw);
                        fuente = 'cache';
                        // Promover a API en segundo plano si tenemos id
                        if (ultimo && ultimo.id) {
                            (async () => {
                                try {
                                    const byId = await this.dataService.apiCall(`/certificados/${ultimo.id}`);
                                    if (byId && byId.id) {
                                        const btn = document.getElementById('loadLastBtn');
                                        if (btn) btn.title = 'Fuente: API';
                                    }
                                } catch {}
                            })();
                        }
                    }
                } catch {}
            }
            if (!ultimo) {
                this.showError('No hay certificados previos para esta instalación y tipo seleccionado');
                return;
            }
            // Rellenar campos (omitimos fecha)
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val ?? '').toString(); };
            setVal('solicitudesCliente', ultimo.solicitudes_cliente || '');
            setVal('observaciones', ultimo.observaciones_generales || '');
            // Checklist y equipos: soportar varias estructuras
            const cd = ultimo.checklist_data;
            // Posibles formas: array plano o objeto con { checklist: [...], items: [...], equipos: {...} }
            const list = Array.isArray(cd)
                ? cd
                : (Array.isArray(cd?.checklist)
                    ? cd.checklist
                    : (Array.isArray(cd?.items) ? cd.items : []));
            document.querySelectorAll('input[name="cctvCheck"]').forEach(cb => {
                cb.checked = list.includes(cb.value);
            });

            // Rellenar equipos si existen en checklist_data
            const equipos = cd && typeof cd === 'object' ? (cd.equipos || null) : null;
            if (equipos) {
                const fill = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = String(v); };
                fill('camarasIP', equipos.camaras_ip);
                fill('camarasAnalogicas', equipos.camaras_analogicas);
                fill('nvr', equipos.nvr);
                fill('dvr', equipos.dvr);
                fill('monitores', equipos.monitores);
                const jsField = document.getElementById('joystick');
                if (jsField && equipos.joystick != null) jsField.value = String(equipos.joystick);
            }

            this.updatePreview();
            const loadLastBtn = document.getElementById('loadLastBtn');
            if (loadLastBtn) loadLastBtn.title = `Fuente: ${fuente === 'api' ? 'API' : 'Caché local'}`;
            this.showSuccess(`Datos del último certificado cargados (${fuente === 'api' ? 'API' : 'Caché local'})`);
            console.info('[Certificados] Cargar último -> fuente:', fuente);
        } catch (e) {
            this.showError('Error al cargar el último certificado');
        }
    }

    /**
     * Marcar todas las casillas de checklist a la vez
     */
    markAllChecklist() {
        const boxes = document.querySelectorAll('input[name="cctvCheck"]');
        let anyUnchecked = false;
        boxes.forEach(cb => { if (!cb.checked) anyUnchecked = true; });
        boxes.forEach(cb => { cb.checked = anyUnchecked ? true : false; });
        this.updatePreview();
    }

    /**
     * Vincular eventos de firmas
     */
    bindSignatureEvents() {
        const firmaTecnico = document.getElementById('firmaTecnico');
        const firmaCliente = document.getElementById('firmaCliente');

        // Ya no permitimos carga manual de firma del técnico: se obtiene desde CRUD automáticamente
        if (firmaTecnico) {
            firmaTecnico.disabled = true;
            firmaTecnico.parentElement?.querySelector('#firmaTecnicoPlaceholder')?.classList.add('hidden');
        }

        // La firma del representante de la empresa se carga automáticamente desde CRUD
        if (firmaCliente) {
            firmaCliente.disabled = true;
            // El placeholder se oculta cuando carguemos la firma desde CRUD
        }
    }

    /**
     * Usar firma del representante (empresa) desde MySQL automáticamente y ocultar subida manual
     */
    async setupCompanyRepresentativeSignature() {
        try {
            const empresas = await this.dataService.getEmpresa();
            if (!Array.isArray(empresas) || empresas.length === 0) return;

            // Elegir empresa activa o la primera
            const activa = empresas.find(e => String(e.activo) === '1') || empresas[0];
            this.empresa = activa || null;

            const firma = (this.empresa && typeof this.empresa.firma_representante === 'string' && this.empresa.firma_representante.trim())
                ? this.empresa.firma_representante.trim()
                : null;

            // Guardar firma en estado y actualizar UI
            this.signatures.cliente = firma;

            // Nombre del representante en la vista previa
            const repNombre = document.getElementById('previewRepresentanteNombre');
            if (repNombre) {
                repNombre.textContent = this.empresa?.nombre_representante || 'Representante';
            }

            // UI de la sección de firma del representante (formulario)
            const placeholder = document.getElementById('firmaClientePlaceholder');
            const preview = document.getElementById('firmaClientePreview');
            const img = document.getElementById('firmaClienteImg');
            if (placeholder) placeholder.classList.toggle('hidden', !!firma);
            if (preview && img) {
                if (firma) {
                    img.src = firma;
                    preview.classList.remove('hidden');
                } else {
                    img.removeAttribute('src');
                    preview.classList.add('hidden');
                }
            }

            // Vista previa principal
            this.updateMainPreviewSignature('cliente', firma);
        } catch (err) {
            console.warn('No se pudo cargar firma de representante desde Empresa:', err?.message || err);
        }
    }

    /**
     * Configurar manejo de evidencias fotográficas
     */
    setupEvidenceHandlers() {
        const addBtn = document.getElementById('evidenciaAddBtn');
        const input = document.getElementById('evidenciaInput');
        const gallery = document.getElementById('evidenciaGallery');

        if (addBtn && input) {
            addBtn.addEventListener('click', () => input.click());
        }

        if (input) {
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                
                files.forEach(file => {
                    if (!file.type.startsWith('image/')) return;
                    if (file.size > 5 * 1024 * 1024) {
                        this.showError('Una de las imágenes supera 5MB y fue omitida.');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const src = ev.target.result;
                        const img = new Image();
                        img.onload = () => {
                            const w = img.naturalWidth || img.width;
                            const h = img.naturalHeight || img.height;
                            const meta = { src, w, h, orientation: (w >= h ? 'landscape' : 'portrait') };
                            this.evidencias.push(meta);
                            this.renderEvidenciaGallery();
                            this.updatePreview();
                        };
                        img.src = src;
                    };
                    reader.readAsDataURL(file);
                });

                // Limpiar input para poder re-subir las mismas imágenes si se desea
                input.value = '';
            });
        }

        // Render inicial (por si hay persistencia futura)
        if (gallery) this.renderEvidenciaGallery();
    }

    /**
     * Renderizar thumbnails en la galería del formulario
     */
    renderEvidenciaGallery() {
        const gallery = document.getElementById('evidenciaGallery');
        if (!gallery) return;
        if (!this.evidencias || this.evidencias.length === 0) {
            gallery.innerHTML = '';
            return;
        }
        gallery.innerHTML = this.evidencias.map((evd, idx) => `
            <div class="relative group border rounded overflow-hidden bg-white">
                <img src="${evd.src}" alt="Evidencia ${idx + 1}" class="w-full h-28 object-contain bg-white" />
                <div class="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">${evd.orientation === 'portrait' ? 'V' : 'H'}</div>
                <button type="button" data-idx="${idx}" class="absolute top-1 right-1 bg-red-600/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">X</button>
            </div>
        `).join('');

        // Bind para eliminar
        gallery.querySelectorAll('button[data-idx]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = parseInt(e.currentTarget.getAttribute('data-idx'));
                if (!isNaN(i)) {
                    this.evidencias.splice(i, 1);
                    this.renderEvidenciaGallery();
                    this.updatePreview();
                }
            });
        });
    }

    /**
     * Usar firma del técnico desde MySQL automáticamente y ocultar subida manual
     */
    setupTechnicianSignatureAutoFill() {
        const tecnicoSelect = document.getElementById('tecnicoSelect');
        if (!tecnicoSelect) return;

        const applySignatureFromTecnico = () => {
            const tecnicoId = tecnicoSelect.value;
            const tecnico = this.tecnicos.find(t => String(t.id) === String(tecnicoId));
            const firma = (tecnico && typeof tecnico.firma_digital === 'string' && tecnico.firma_digital.trim()) ? tecnico.firma_digital.trim() : null;

            // Actualizar estado interno y previews
            this.signatures.tecnico = firma;

            // Ocultar UI de subida manual y mostrar preview si hay firma
            const placeholder = document.getElementById('firmaTecnicoPlaceholder');
            const preview = document.getElementById('firmaTecnicoPreview');
            const img = document.getElementById('firmaTecnicoImg');
            if (placeholder) placeholder.classList.add('hidden');
            if (preview && img) {
                if (firma) {
                    img.src = firma;
                    preview.classList.remove('hidden');
                } else {
                    // Sin firma: limpiar preview
                    img.removeAttribute('src');
                    preview.classList.add('hidden');
                }
            }

            // También en la vista previa principal
            this.updateMainPreviewSignature('tecnico', firma);
        };

        // Aplicar al iniciar (por si hay selección) y en cambios de selección
        applySignatureFromTecnico();
        tecnicoSelect.addEventListener('change', applySignatureFromTecnico);

        // Ocultar botón de eliminar firma del técnico (solo lectura)
        const tecnicoPreview = document.getElementById('firmaTecnicoPreview');
        if (tecnicoPreview) {
            const deleteBtn = tecnicoPreview.querySelector('button');
            if (deleteBtn) deleteBtn.style.display = 'none';
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
     * Poblar selector de clientes
     */
    populateClientes() {
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
    async loadInstalaciones() {
        const clienteSelect = document.getElementById('clienteSelect');
        const instalacionSelect = document.getElementById('instalacionSelect');
        
        if (!clienteSelect || !instalacionSelect) return;

        const clienteId = parseInt(clienteSelect.value);
        
        // Limpiar instalaciones
        instalacionSelect.innerHTML = '<option value="">Seleccionar instalación...</option>';
        instalacionSelect.disabled = !clienteId;

        if (clienteId) {
            try {
                const instalaciones = await this.dataService.getInstalacionesByCliente(clienteId);
                
                instalaciones.forEach(instalacion => {
                    const option = document.createElement('option');
                    option.value = instalacion.id;
                    option.textContent = `${instalacion.nombre} - ${instalacion.direccion}`;
                    option.dataset.direccion = instalacion.direccion;
                    instalacionSelect.appendChild(option);
                });
                
                instalacionSelect.disabled = false;
            } catch (error) {
                console.error('Error al cargar instalaciones:', error);
                this.showError('Error al cargar instalaciones del cliente');
            }
        }

        this.updatePreview();
    }

    /**
     * Poblar selector de técnicos
     */
    populateTecnicos() {
        const tecnicoSelect = document.getElementById('tecnicoSelect');
        if (!tecnicoSelect) return;

        tecnicoSelect.innerHTML = '<option value="">Seleccionar técnico...</option>';
        
        this.tecnicos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = `${tecnico.nombre} - ${tecnico.especialidad}`;
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
        if (!this.previewEnabled) return;
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

        // Adjuntar evidencias actuales (si las hay) con metadatos
        data.evidencias = Array.isArray(this.evidencias)
            ? this.evidencias.map(e => ({ src: e.src, orientation: e.orientation, w: e.w, h: e.h }))
            : [];

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
    if (!this.previewEnabled) return;
        console.log('🔄 Actualizando vista previa...');
        
        if (!this.currentCertificateType) {
            this.showPlaceholderPreview();
            return;
        }

        const formData = this.getFormData();
        const info = this.getClienteInstalacionInfo();

        // Validar datos en tiempo real
        this.validateFormData(formData, info);

        // Ocultar todos los previews
        document.getElementById('previewPlaceholder')?.classList.add('hidden');
        document.getElementById('cctvPreview')?.classList.add('hidden');
        document.getElementById('hardwarePreview')?.classList.add('hidden');
        document.getElementById('racksPreview')?.classList.add('hidden');

        // Mostrar preview específico y actualizar con datos reales
        if (this.currentCertificateType === 'cctv') {
            this.updateCCTVPreview(formData, info);
            document.getElementById('cctvPreview')?.classList.remove('hidden');
        } else {
            // Para otros tipos, actualizar preview genérico
            this.updateGenericPreview(formData, info);
            const previewElement = document.getElementById(`${this.currentCertificateType}Preview`);
            if (previewElement) {
                previewElement.classList.remove('hidden');
            }
        }

        console.log('✅ Vista previa actualizada con datos:', { formData, info });
    }

    /**
     * Mostrar vista previa placeholder
     */
    showPlaceholderPreview() {
    if (!this.previewEnabled) return;
    document.getElementById('previewPlaceholder')?.classList.remove('hidden');
    document.getElementById('cctvPreview')?.classList.add('hidden');
    document.getElementById('hardwarePreview')?.classList.add('hidden');
    document.getElementById('racksPreview')?.classList.add('hidden');
    }

    /**
     * Actualizar vista previa CCTV
     */
    updateCCTVPreview(formData, info) {
        if (!this.previewEnabled) return;
        document.getElementById('cctvPreview')?.classList.remove('hidden');

        // Información básica
        const elCliente = document.getElementById('previewCliente'); if (elCliente) elCliente.textContent = info.cliente?.nombre || '-';
        const elDireccion = document.getElementById('previewDireccion'); if (elDireccion) elDireccion.textContent = info.instalacion?.direccion || '-';
        const elTecnico = document.getElementById('previewTecnico'); if (elTecnico) elTecnico.textContent = info.tecnico?.nombre || '-';
        
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
            const elFecha = document.getElementById('previewFecha'); if (elFecha) elFecha.textContent = fecha.toLocaleDateString('es-ES');
        } else {
            const elFecha = document.getElementById('previewFecha'); if (elFecha) elFecha.textContent = '-';
        }

        // Equipos
        if (formData.cctv) {
            const elCA = document.getElementById('previewCamarasA'); if (elCA) elCA.textContent = formData.cctv.camaras_analogicas || 0;
            const elCIP = document.getElementById('previewCamarasIP'); if (elCIP) elCIP.textContent = formData.cctv.camaras_ip || 0;
            const elMon = document.getElementById('previewMonitores'); if (elMon) elMon.textContent = formData.cctv.monitores || 0;

            // NVR/DVR
            const nvrContainer = document.getElementById('previewNVRContainer');
            const dvrContainer = document.getElementById('previewDVRContainer');
            const previewNVR = document.getElementById('previewNVR');
            const previewDVR = document.getElementById('previewDVR');

            if (formData.cctv.nvr && formData.cctv.nvr.trim()) {
                if (nvrContainer && previewNVR) { nvrContainer.style.display = 'block'; previewNVR.textContent = formData.cctv.nvr; }
            } else if (nvrContainer) {
                nvrContainer.style.display = 'none';
            }

            if (formData.cctv.dvr && formData.cctv.dvr.trim()) {
                if (dvrContainer && previewDVR) { dvrContainer.style.display = 'block'; previewDVR.textContent = formData.cctv.dvr; }
            } else if (dvrContainer) {
                dvrContainer.style.display = 'none';
            }

            // Checklist
            this.updateChecklistPreview(formData.cctv.checklist);
        }

        // Solicitudes del cliente
        const solicitudesContainer = document.getElementById('previewSolicitudesContainer');
        const previewSolicitudes = document.getElementById('previewSolicitudes');
        if (formData.solicitudes_cliente && formData.solicitudes_cliente.trim()) {
            if (solicitudesContainer && previewSolicitudes) { solicitudesContainer.style.display = 'block'; previewSolicitudes.textContent = formData.solicitudes_cliente; }
        } else if (solicitudesContainer) {
            solicitudesContainer.style.display = 'none';
        }

        // Observaciones
        const observacionesContainer = document.getElementById('previewObservacionesContainer');
        const previewObservaciones = document.getElementById('previewObservaciones');
        if (formData.observaciones && formData.observaciones.trim()) {
            if (observacionesContainer && previewObservaciones) { observacionesContainer.style.display = 'block'; previewObservaciones.textContent = formData.observaciones; }
        } else if (observacionesContainer) {
            observacionesContainer.style.display = 'none';
        }

        // Código único (temporal)
    const elCodigo = document.getElementById('previewCodigo'); if (elCodigo) elCodigo.textContent = this.generateTempCode();

        // Actualizar firmas si existen
        if (this.signatures.tecnico) {
            this.updateMainPreviewSignature('tecnico', this.signatures.tecnico);
        }
        if (this.signatures.cliente) {
            this.updateMainPreviewSignature('cliente', this.signatures.cliente);
        }

        // Nombre del representante en la vista previa
        const repNombre = document.getElementById('previewRepresentanteNombre');
        if (repNombre) {
            repNombre.textContent = this.empresa?.nombre_representante || 'Representante';
        }

        // Evidencias en la vista previa
        const prevEvidenciasContainer = document.getElementById('previewEvidenciasContainer');
        const prevEvidencias = document.getElementById('previewEvidencias');
        if (prevEvidenciasContainer && prevEvidencias) {
            if (this.evidencias && this.evidencias.length) {
                prevEvidenciasContainer.style.display = 'block';
                prevEvidencias.innerHTML = this.evidencias.slice(0, 6).map(evd => `
                    <div class="border rounded bg-white overflow-hidden">
                        <img src="${evd.src}" class="w-full h-20 object-contain bg-white"/>
                    </div>
                `).join('');
            } else {
                prevEvidenciasContainer.style.display = 'none';
                prevEvidencias.innerHTML = '';
            }
        }
    }

    /**
     * Actualizar checklist en preview
     */
    updateChecklistPreview(checklist) {
    if (!this.previewEnabled) return;
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
     * Formatear items del checklist para grilla (3 columnas) en PDF
     */
    formatChecklistItems(checklist) {
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
            return '<div style="color: #9ca3af; font-style: italic; grid-column: 1 / -1;">No hay elementos verificados</div>';
        }
        return checklist.map(item => `
            <div style="display:flex; align-items:center; gap:8px; min-height:22px;">
                <span style="display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border:2px solid #059669; border-radius:3px; background:#10b981; color:#fff; font-size:12px; font-weight:bold; line-height:1;">✓</span>
                <span style="line-height:1.2;">${labels[item] || item}</span>
            </div>
        `).join('');
    }

    /**
     * Validar datos del formulario en tiempo real
     */
    validateFormData(formData, info) {
        const errors = [];
        const warnings = [];

        // Validar información del cliente
        if (!info.cliente.nombre || info.cliente.nombre.trim() === '') {
            errors.push('Cliente no seleccionado');
        }

        if (!info.instalacion.direccion || info.instalacion.direccion.trim() === '') {
            errors.push('Instalación no seleccionada');
        }

        if (!info.tecnico.nombre || info.tecnico.nombre.trim() === '') {
            errors.push('Técnico no seleccionado');
        }

        // Validar fecha
        if (!formData.fecha_mantenimiento) {
            errors.push('Fecha de mantenimiento requerida');
        }

        // Validaciones específicas por tipo de certificado
        if (formData.tipo_certificado === 'cctv') {
            if (!formData.cctv) {
                errors.push('Datos de CCTV requeridos');
            } else {
                if (!formData.cctv.camaras_analogicas && !formData.cctv.camaras_ip) {
                    warnings.push('No se han especificado cámaras');
                }
                
                if (!formData.cctv.checklist || formData.cctv.checklist.length === 0) {
                    warnings.push('No se han seleccionado elementos del checklist');
                }
            }
        }

        // Mostrar errores y warnings
        this.updateValidationStatus(errors, warnings);

        return { errors, warnings, isValid: errors.length === 0 };
    }

    /**
     * Actualizar estado de validación en la interfaz
     */
    updateValidationStatus(errors, warnings) {
        // Crear o actualizar panel de validación
        let validationPanel = document.getElementById('validation-panel');
        if (!validationPanel) {
            validationPanel = document.createElement('div');
            validationPanel.id = 'validation-panel';
            validationPanel.className = 'fixed bottom-4 right-4 max-w-sm z-50';
            document.body.appendChild(validationPanel);
        }

        if (errors.length === 0 && warnings.length === 0) {
            validationPanel.innerHTML = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span>Formulario válido</span>
                    </div>
                </div>
            `;
        } else {
            let content = '';
            
            if (errors.length > 0) {
                content += `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg mb-2">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            <span class="font-semibold">Errores (${errors.length})</span>
                        </div>
                        <ul class="text-sm list-disc list-inside">
                            ${errors.map(error => `<li>${error}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (warnings.length > 0) {
                content += `
                    <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            <span class="font-semibold">Advertencias (${warnings.length})</span>
                        </div>
                        <ul class="text-sm list-disc list-inside">
                            ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            validationPanel.innerHTML = content;
        }

        // Auto-ocultar después de 5 segundos si todo está bien
        if (errors.length === 0 && warnings.length === 0) {
            setTimeout(() => {
                if (validationPanel.parentElement) {
                    validationPanel.style.opacity = '0';
                    setTimeout(() => {
                        if (validationPanel.parentElement) {
                            validationPanel.parentElement.removeChild(validationPanel);
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    /**
     * Actualizar vista previa genérica para otros tipos de certificado
     */
    updateGenericPreview(formData, info) {
    if (!this.previewEnabled) return;
        // Buscar si existe un preview específico para el tipo
        const previewElement = document.getElementById(`${this.currentCertificateType}Preview`);
        if (!previewElement) return;

        // Actualizar información básica si existen los elementos
        const elements = {
            'previewCliente': info.cliente.nombre || '-',
            'previewDireccion': info.instalacion.direccion || '-', 
            'previewTecnico': info.tecnico.nombre || '-',
            'previewFecha': formData.fecha_mantenimiento ? 
                new Date(formData.fecha_mantenimiento).toLocaleDateString('es-ES') : '-'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Generar número de certificado con formato: TIPO-100-08-2025
     */
    generateCertificateNumber() {
        if (!this.currentCertificateType) {
            return 'CERT-000-00-0000';
        }

        // Obtener prefijo de la configuración cargada
        let prefix = this.currentCertificateType.toUpperCase();
        if (this.configuracion?.certificados?.numeracion?.[this.currentCertificateType]?.prefijo) {
            prefix = this.configuracion.certificados.numeracion[this.currentCertificateType].prefijo;
        }

        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        
        // Obtener contador actual (sin incrementar aún)
        const counter = this.certificateCounters[this.currentCertificateType] || 100;
        
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
        // Guardar primero en backend para obtener correlativo asignado
        try {
            const payload = this.buildCertificatePayload();
            const saved = await this.dataService.saveCertificate(payload);
            this.assignedCertificateNumber = saved?.numero_certificado || this.generateCertificateNumber();
            this.assignedCertificateId = saved?.id || saved?.data?.id || null;
            // Cache local del último certificado por tipo/cliente/instalación
            try {
                const key = this.makeLastCacheKey(payload.tipo, payload.cliente_id, payload.instalacion_id);
                const cacheObj = {
                    tipo: payload.tipo,
                    cliente_id: payload.cliente_id,
                    instalacion_id: payload.instalacion_id,
                    tecnico_id: payload.tecnico_id,
                    fecha_mantenimiento: payload.fecha_mantenimiento,
                    solicitudes_cliente: payload.solicitudes_cliente,
                    observaciones_generales: payload.observaciones_generales || payload.observaciones || '',
                    checklist_data: typeof payload.checklist_data === 'object' ? payload.checklist_data : null,
                    numero_certificado: this.assignedCertificateNumber,
                    id: this.assignedCertificateId
                };
                localStorage.setItem(key, JSON.stringify(cacheObj));
            } catch {}
            // Señal para otras pestañas (certificados.html) para refrescar listado
            try { localStorage.setItem('cert_created', String(Date.now())); } catch {}
        } catch (err) {
            console.warn('Fallo al guardar antes del PDF, usando número local:', err?.message || err);
            this.assignedCertificateNumber = this.generateCertificateNumber();
            this.assignedCertificateId = null;
            this.showError('No se pudo guardar en la base de datos. Se generará el PDF sin registro.');
        }

        await this.generatePDF();

        // Limpiar formulario para crear uno nuevo del mismo tipo
        try {
            this.resetFormKeepType();
        } catch (_) {}
    }

    makeLastCacheKey(tipo, clienteId, instalacionId) {
        return `last_cert_${String(tipo||'').toLowerCase()}_${clienteId}_${instalacionId}`;
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
            // El contador ya está manejado en el backend al crear el certificado
            
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
     * Construir payload para el backend
     */
    buildCertificatePayload() {
        const fd = this.getFormData();
        return {
            tipo: this.currentCertificateType,
            cliente_id: Number(fd.cliente_id),
            instalacion_id: Number(fd.instalacion_id),
            tecnico_id: Number(fd.tecnico_id),
            fecha_mantenimiento: fd.fecha_mantenimiento,
            solicitudes_cliente: fd.solicitudes_cliente || '',
            observaciones: fd.observaciones || '',
            firmas: {
                tecnico: this.signatures.tecnico || null,
                cliente: this.signatures.cliente || null
            },
            // Guardar checklist y equipos dentro de checklist_data para poder restaurarlos luego
            checklist_data: {
                checklist: Array.isArray(fd.cctv?.checklist) ? fd.cctv.checklist : [],
                equipos: {
                    camaras_ip: (fd.cctv?.camaras_ip ?? document.getElementById('camarasIP')?.value) || '',
                    camaras_analogicas: (fd.cctv?.camaras_analogicas ?? document.getElementById('camarasAnalogicas')?.value) || '',
                    monitores: (fd.cctv?.monitores ?? document.getElementById('monitores')?.value) || '',
                    nvr: (fd.cctv?.nvr ?? document.getElementById('nvr')?.value) || '',
                    dvr: (fd.cctv?.dvr ?? document.getElementById('dvr')?.value) || '',
                    joystick: document.getElementById('joystick')?.value || ''
                }
            }
        };
    }

    /**
     * Generar contenido PDF para CCTV
     */
    generateCCTVPDFContent(formData, info) {
        const codigo = this.assignedCertificateNumber || this.generateTempCode();
        const fecha = formData.fecha_mantenimiento ? 
            new Date(formData.fecha_mantenimiento).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            }) : '-';

    const logoHtml = (this.empresa && typeof this.empresa.logo_empresa === 'string' && this.empresa.logo_empresa.trim())
        ? `<div class="tw-logo" style="position:absolute; right: 20px; top: 10px;">
            <img src="${this.empresa.logo_empresa}" alt="Logo Empresa" style="height: 72px; max-width: 260px; object-fit: contain;" />
           </div>`
        : '';

    return `
            <!-- Header con barra azul lateral -->
            <div style="text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; position: relative;">
                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: linear-gradient(to bottom, #1e40af, #3b82f6); border-radius: 3px;"></div>
        ${logoHtml}
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
                        <span style="font-size: 18px, color: #1e40af;">${codigo}</span>
                    </div>
                </div>
            </div>

            <!-- Información del Cliente con barra azul -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    INFORMACIÓN DEL CLIENTE
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 14px; padding: 0 20px; align-items: start;">
                    <div><strong>Cliente:</strong> ${info.cliente.nombre || '-'}</div>
                    <div><strong>RUT:</strong> ${info.cliente.rut || '-'}</div>
                    <div><strong>Técnico:</strong> ${info.tecnico.nombre || '-'}</div>
                    <div><strong>Contacto:</strong> ${info.cliente.contacto || '-'}</div>
                    <div><strong>Email:</strong> ${info.cliente.email || '-'}</div>
                    <div style="grid-column: 1 / 4;"><strong>Dirección:</strong> ${info.instalacion.direccion || '-'}</div>
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
                <div style="font-size: 14px; padding: 0 20px; background: #fefefe; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin: 0 20px;">
            <div style="display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; align-items:center;">
                        ${this.formatChecklistItems(formData.cctv?.checklist)}
                    </div>
                </div>
            </div>

            <!-- Solicitudes del Cliente con barra azul -->
            ${formData.solicitudes_cliente ? `
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                    SOLICITUDES DEL CLIENTE
                </h3>
                <div style="font-size: 14px; line-height: 1.6; background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 20px; border: 1px solid #e2e8f0;">
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

            ${''}

            <!-- Firmas -->
            <div style="position: absolute; bottom: 110px; left: 60px; right: 60px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
                    <div style="text-align: center;">
                        <div style="height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            ${formData.firmas.tecnico ? `<img src="${formData.firmas.tecnico}" style="max-height: 100px; max-width: 260px; object-fit: contain;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                        </div>
                        <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                            <strong>Técnico Responsable</strong><br>
                            <span style="font-size: 12px;">${info.tecnico.nombre || 'N/A'}</span>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            ${formData.firmas.cliente ? `<img src="${formData.firmas.cliente}" style="max-height: 100px; max-width: 260px; object-fit: contain;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                        </div>
                        <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                            <strong>Representante Empresa</strong><br>
                            <span style="font-size: 12px;">${this.empresa?.nombre_representante || 'Representante'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Código y Fecha -->
            <div style="position: absolute; bottom: 20px; left: 60px; right: 60px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <strong>Código de Validación:</strong> ${codigo} | 
                <strong>Generado el:</strong> ${new Date().toLocaleDateString('es-ES')}
                <div style="margin-top: 6px; font-size: 12px; color: #475569; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    🏢 Redes y CCTV &nbsp;•&nbsp; 📍 María Eugenia López 9726, Antofagasta &nbsp;•&nbsp; 🌐 www.redesycctv.cl &nbsp;•&nbsp; ☎ +56 9 630 671 69
                </div>
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

    // Comprimir la imagen principal para reducir el peso del PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.82);
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

        // Anexo - Evidencia Fotográfica: repetir encabezado (título, sistema, fecha, código) y pie de validación
        const evidencias = Array.isArray(formData.evidencias) ? formData.evidencias : [];
        if (evidencias.length > 0) {
            // Definir layout: 3 columnas x 3 filas por página (máx 9 por página)
            const perPage = 9;
            const code = this.assignedCertificateNumber || this.generateCertificateNumber();
            const fechaText = formData.fecha_mantenimiento ? new Date(formData.fecha_mantenimiento).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
            const systemLabel = (this.currentCertificateType || '').toLowerCase() === 'cctv' ? 'SISTEMA CCTV' : (this.currentCertificateType ? `SISTEMA ${this.currentCertificateType.toUpperCase()}` : 'SISTEMA');
            const todayText = new Date().toLocaleDateString('es-ES');
            // Preparar logo empresa en data URL (si es posible)
            const logoDataUrl = await this.getEmpresaLogoDataUrl();
            let logoDims = null;
            if (logoDataUrl) {
                try { logoDims = await this.getImageDimensions(logoDataUrl); } catch(_) { logoDims = null; }
            }
            // Empezar desde el índice 0 (todas van a anexos)
            for (let i = 0; i < evidencias.length; i += perPage) {
                pdf.addPage('a4', 'portrait');
                // Encabezado estilo hoja 1
                // Título (mismo tamaño de hoja 1)
                pdf.setFontSize(16);
                pdf.setTextColor(30, 64, 175); // azul
                pdf.text('CERTIFICADO DE MANTENIMIENTO', pdfWidth / 2, margin + 8, { align: 'center' });
                // Subtítulo (sistema)
                pdf.setFontSize(10);
                pdf.setTextColor(55, 65, 81); // gris oscuro
                pdf.text(systemLabel, pdfWidth / 2, margin + 14, { align: 'center' });
                // Línea divisoria
                pdf.setDrawColor(30, 64, 175);
                pdf.line(margin, margin + 16, pdfWidth - margin, margin + 16);
                // Barra vertical izquierda (estilo)
                pdf.setDrawColor(30, 64, 175);
                pdf.setFillColor(30, 64, 175);
        pdf.rect(margin - 1.2, margin + 2, 2.4, 16, 'F');
                // Logo empresa (si está disponible como data URL)
                try {
                    if (logoDataUrl) {
                        // Mantener proporción con base a dimensiones reales
                        const targetH = 8; // mm
                        let logoW = 22, logoH = targetH;
                        if (logoDims && logoDims.w && logoDims.h) {
                            const ratio = logoDims.w / logoDims.h;
                            logoW = Math.min(26, Math.max(16, targetH * ratio));
                            logoH = targetH;
                        }
                        const logoX = pdfWidth - margin - logoW;
                        const logoY = margin + 2;
                        const fmt = logoDataUrl.includes('png') ? 'PNG' : 'JPEG';
                        pdf.addImage(logoDataUrl, fmt, logoX, logoY, logoW, logoH, undefined, 'FAST');
                    }
                } catch (_) {}
                // Banda de fecha y código (rectángulo azul claro con textos)
        const bandY = margin + 18;
        const bandH = 10;
                pdf.setFillColor(219, 234, 254); // azul claro
                pdf.setDrawColor(226, 232, 240); // borde sutil
                pdf.rect(margin, bandY, pdfWidth - margin * 2, bandH, 'FD');
        pdf.setFontSize(10);
                // Fecha (izquierda)
                pdf.setTextColor(100, 116, 139);
                pdf.text('Fecha:', margin + 4, bandY + 8);
                pdf.setTextColor(30, 64, 175);
                pdf.text(fechaText, margin + 24, bandY + 8);
                // Código (derecha)
                pdf.setTextColor(100, 116, 139);
                const rightLabel = 'Certificado N°:';
                const rightTextWidth = pdf.getTextWidth(rightLabel);
                const rightValWidth = pdf.getTextWidth(code);
                const totalRight = rightTextWidth + 2 + rightValWidth;
                const rightStart = pdfWidth - margin - 2 - totalRight; // pequeño margen interno extra
                pdf.text(rightLabel, rightStart, bandY + 8);
                pdf.setTextColor(30, 64, 175);
                pdf.text(code, rightStart + rightTextWidth + 2, bandY + 8);

                const gridX = margin;
        const headerH = 33; // espacio ocupado por encabezado + banda
                const footerH = 14; // espacio reservado para pie
                const gridY = margin + headerH;
                const gridW = pdfWidth - margin * 2;
                const cols = 3;
                const rows = 3;
                const hGap = 6; // separación horizontal
                const vGap = 8; // separación vertical
                const cellW = (gridW - hGap * (cols - 1)) / cols;
                const availableH = pdfHeight - gridY - margin - footerH - (vGap * (rows - 1));
                const cellH = availableH / rows;

                const slice = evidencias.slice(i, i + perPage);
                slice.forEach((evd, idx) => {
                    const r = Math.floor(idx / cols);
                    const c = idx % cols;
                    const cx = gridX + c * (cellW + hGap);
                    const cy = gridY + r * (cellH + vGap);

                    // Calcular tamaño max para mantener proporción (contain)
                    const maxW = cellW;
                    const maxH = cellH;
                    // Estimar proporciones a partir de metadatos; fallback si no están
                    const w = evd.w || 1000;
                    const h = evd.h || 1000;
                    const ratio = w / h;
                    let drawW = maxW;
                    let drawH = drawW / ratio;
                    if (drawH > maxH) {
                        drawH = maxH;
                        drawW = drawH * ratio;
                    }
                    const ox = cx + (maxW - drawW) / 2;
                    const oy = cy + (maxH - drawH) / 2;

                    // Contenedor de celda: marco sutil con borde
                    pdf.setDrawColor(215, 219, 223);
                    pdf.setFillColor(255, 255, 255);
                    const frameX = cx;
                    const frameY = cy;
                    const frameW = maxW;
                    const frameH = maxH;
                    pdf.rect(frameX, frameY, frameW, frameH, 'S');

                    // Pre-redimensionar/comprimir en un canvas para reducir peso
                    try {
                        const resizedDataUrl = (() => {
                            const imgEl = document.createElement('img');
                            imgEl.src = evd.src;
                            // Nota: este uso síncrono puede no esperar onload; usamos aproximación por metadata si falla
                            const maxLongEdge = 1400; // ~para calidad y tamaño
                            const srcW = evd.w || 1200;
                            const srcH = evd.h || 800;
                            let targetW = srcW;
                            let targetH = srcH;
                            if (Math.max(srcW, srcH) > maxLongEdge) {
                                const scale = maxLongEdge / Math.max(srcW, srcH);
                                targetW = Math.round(srcW * scale);
                                targetH = Math.round(srcH * scale);
                            }
                            const off = document.createElement('canvas');
                            off.width = targetW;
                            off.height = targetH;
                            const ctx = off.getContext('2d');
                            // Fallback: drawImage con evd.src solo funciona tras carga; intentamos y en catch usamos original
                            try {
                                ctx.drawImage(imgEl, 0, 0, targetW, targetH);
                                return off.toDataURL('image/jpeg', 0.8);
                            } catch (e) {
                                return evd.src;
                            }
                        })();
                        const format = resizedDataUrl.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
                        pdf.addImage(resizedDataUrl, format, ox, oy, drawW, drawH, undefined, 'FAST');
                    } catch (e) {
                        // Intento de fallback directo
                        try {
                            pdf.addImage(evd.src, 'JPEG', ox, oy, drawW, drawH, undefined, 'FAST');
                        } catch (_) {}
                    }
                });

                // Pie con código de validación (mismo concepto que hoja 1)
                pdf.setDrawColor(229, 231, 235);
                const footerY = pdfHeight - margin - 6;
                pdf.line(margin, footerY, pdfWidth - margin, footerY);
                pdf.setFontSize(9);
                pdf.setTextColor(107, 114, 128);
                pdf.text(`Código de Validación: ${code} | Generado el: ${todayText} | Puede validar este certificado usando este código`, pdfWidth / 2, footerY + 5, { align: 'center' });
                // Línea de contacto debajo del código
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text('Redes y CCTV  •  María Eugenia López 9726, Antofagasta  •  www.redesycctv.cl  •  +56 9 630 671 69', pdfWidth / 2, footerY + 10, { align: 'center' });
            }
        }

        const fileName = this.generateFileName(formData, info);
        pdf.save(fileName);

        // Subir copia al backend para descargas futuras idénticas
        try {
            // Necesitamos el ID del certificado recién creado si está disponible
            // Se espera que el backend haya devuelto el nuevo certificado en saveCertificate
            // y que assignedCertificateId se haya establecido en handleFormSubmit (si aplicable)
            const certId = this.assignedCertificateId || formData?.id || null;
            if (certId) {
                const blob = pdf.output('blob');
                const res = await fetch(`${this.dataService.apiUrl}/certificados/${certId}/pdf`, {
                    method: 'POST',
                    headers: {
                        // No establecer Content-Type manualmente para permitir multipart/stream
                    },
                    body: blob
                });
                // Ignorar errores silenciosamente para no bloquear al usuario
                void res;
            }
        } catch (e) {
            console.warn('No se pudo almacenar PDF en backend:', e?.message || e);
        }

    // No bloquear: la limpieza ya fue gatillada post-generatePDF
    }

    /**
     * Generar nombre de archivo
     */
    generateFileName(formData, info) {
    // Usar el correlativo asignado por backend (p.ej. CCTV-108-08-2025)
    const code = this.assignedCertificateNumber || this.generateCertificateNumber();
    return `${code}.pdf`;
    }

    /**
     * Resetear el formulario manteniendo el tipo seleccionado
     */
    resetFormKeepType() {
        const type = this.currentCertificateType;
        // Limpiar inputs base
        const ids = [
            'clienteSelect','instalacionSelect','tecnicoSelect','fechaMantenimiento',
            'solicitudesCliente','observaciones','camarasAnalogicas','camarasIP',
            'monitores','dvr','nvr','joystick'
        ];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        // Desmarcar checklist
        document.querySelectorAll('input[name="cctvCheck"]').forEach(cb => cb.checked = false);
        // Limpiar firmas y previews
        this.removeFirma('tecnico');
        this.removeFirma('cliente');
        // Limpiar evidencias
        this.evidencias = [];
        // Mantener tipo y refrescar UI específica
        this.currentCertificateType = type;
        this.showSpecificForm();
        this.updateFormTitle();
        this.updatePreview();
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
     * Actualizar contador de certificados
     */
    async updateCertificateCounter() {
        if (!this.currentCertificateType) return;

        try {
            // Incrementar contador usando DataService
            const result = await this.dataService.incrementContador(this.currentCertificateType);
            
            // Actualizar contador local
            this.certificateCounters[this.currentCertificateType] = result.siguiente;
            
            console.log(`✅ Contador ${this.currentCertificateType} actualizado a: ${result.siguiente}`);
        } catch (error) {
            console.error('❌ Error al actualizar contador:', error);
            
            // Fallback: incrementar solo localmente
            if (this.certificateCounters[this.currentCertificateType]) {
                this.certificateCounters[this.currentCertificateType]++;
            }
        }
    }

    /**
     * Utilidad: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Convertir el logo de empresa a data URL para incrustarlo en jsPDF
     */
    async getEmpresaLogoDataUrl() {
        if (this._empresaLogoDataUrl) return this._empresaLogoDataUrl;
        try {
            const src = this.empresa && typeof this.empresa.logo_empresa === 'string' ? this.empresa.logo_empresa : null;
            if (!src) return null;
            if (/^data:image\//.test(src)) {
                this._empresaLogoDataUrl = src;
                return src;
            }
            const resp = await fetch(src, { mode: 'cors' });
            if (!resp.ok) return null;
            const blob = await resp.blob();
            const dataUrl = await new Promise((resolve) => {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.readAsDataURL(blob);
            });
            this._empresaLogoDataUrl = typeof dataUrl === 'string' ? dataUrl : null;
            return this._empresaLogoDataUrl;
        } catch (_) {
            return null;
        }
    }

    /** Obtener dimensiones de una imagen (data URL o URL) */
    getImageDimensions(src) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = reject;
                img.src = src;
            } catch (e) { reject(e); }
        });
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

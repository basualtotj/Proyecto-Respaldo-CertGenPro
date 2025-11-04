/**
 * Sistema CRUD para Gestión de Datos
 * Maneja clientes, instalaciones, técnicos y galería de imágenes
 */
class CRUDSystem {
    constructor() {
        this.dataService = null;
        this.currentTab = 'clientes';
        this.data = {
            clientes: [],
            instalaciones: [],
            tecnicos: [],
            empresa: []
        };
        
        this.init();
    }

    /**
     * Inicializar el sistema
     */
    async init() {
        console.log('🚀 Iniciando Sistema CRUD...');
        
        try {
            // Verificar que DataService esté disponible
            if (typeof DataService === 'undefined') {
                throw new Error('DataService no está disponible. Asegúrate de que data-service.js se haya cargado correctamente.');
            }
            
            // Crear DataService (sin init, funciona directamente)
            this.dataService = new DataService();
            
            // Cargar datos iniciales
            await this.loadAllData();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Mostrar tab inicial
            this.showTab('clientes');
            
            console.log('✅ Sistema CRUD inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar Sistema CRUD:', error);
            this.showError('Error al inicializar el sistema: ' + error.message);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Use currentTarget to avoid clicks on inner <i> or text nodes breaking the id lookup
                const btn = e.currentTarget;
                const tabId = (btn && btn.id) ? btn.id.replace('Tab', '') : 'clientes';
                this.showTab(tabId);
            });
        });

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.hideModal();
        });

        // Search functionality
        document.getElementById('searchClientes')?.addEventListener('input', (e) => {
            this.filterTable('clientes', e.target.value);
        });

        // Add buttons
        document.getElementById('addClienteBtn')?.addEventListener('click', () => this.showAddForm('cliente'));
        document.getElementById('addInstalacionBtn')?.addEventListener('click', () => this.showAddForm('instalacion'));
        document.getElementById('addTecnicoBtn')?.addEventListener('click', () => this.showAddForm('tecnico'));
        document.getElementById('addEmpresaBtn')?.addEventListener('click', () => this.showAddForm('empresa'));

        // Refresh buttons
        document.getElementById('refreshClientesBtn')?.addEventListener('click', () => this.refreshData('clientes'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideModal();
        });

        // Action buttons (edit/delete) usando event delegation
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.action-button');
            if (button) {
                e.preventDefault();
                const action = button.dataset.action;
                const type = button.dataset.type;
                const id = button.dataset.id;
                
                console.log('🎯 Action button clicked:', { action, type, id });
                
                if (action === 'edit') {
                    this.editItem(type, id);
                } else if (action === 'delete') {
                    this.deleteItem(type, id);
                } else if (action === 'view') {
                    this.viewDetails(type, id);
                } else if (action === 'toggle') {
                    this.toggleTecnicoStatus(id);
                }
            }
        });
    }

    /**
     * Mostrar tab específico
     */
    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-b-2', 'border-blue-500', 'text-blue-600');
            button.classList.add('text-gray-600');
        });
        
        const tabButtonEl = document.getElementById(`${tabName}Tab`);
        const panelEl = document.getElementById(`${tabName}Panel`);
        // Guard: if target tab doesn't exist, fallback to clientes
        const safeTabName = (tabButtonEl && panelEl) ? tabName : 'clientes';
        const safeTabButtonEl = document.getElementById(`${safeTabName}Tab`);
        const safePanelEl = document.getElementById(`${safeTabName}Panel`);

        safeTabButtonEl.classList.add('active', 'border-b-2', 'border-blue-500', 'text-blue-600');
        safeTabButtonEl.classList.remove('text-gray-600');

        // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        
    safePanelEl.classList.remove('hidden');
        
    this.currentTab = safeTabName;

        // Load data for current tab
        this.renderCurrentTab();
    }

    /**
     * Cargar todos los datos
     */
    async loadAllData() {
        this.showLoading(true);
        
        try {
            console.log('🔄 Cargando datos...');
            
            // Cargar clientes
            this.data.clientes = await this.dataService.getClientes();
            console.log('Clientes cargados:', this.data.clientes?.length);
            
            // Cargar técnicos
            this.data.tecnicos = await this.dataService.getTecnicos();
            console.log('Técnicos cargados:', this.data.tecnicos?.length);
            
            // Cargar empresa
            try {
                this.data.empresa = await this.dataService.getEmpresa();
                console.log('Empresa cargada:', this.data.empresa?.length);
            } catch (error) {
                console.warn('Error al cargar empresa:', error);
                this.data.empresa = [];
            }
            
            // Cargar instalaciones por cliente usando API (API-only)
            this.data.instalaciones = [];
            if (this.data.clientes && this.data.clientes.length > 0) {
                for (const cliente of this.data.clientes) {
                    try {
                        const instalacionesCliente = await this.dataService.getInstalacionesByCliente(cliente.id);
                        this.data.instalaciones.push(...instalacionesCliente);
                    } catch (error) {
                        console.warn(`Error al cargar instalaciones para cliente ${cliente.id}:`, error);
                    }
                }
            }
            
            console.log('✅ Datos cargados exitosamente:', {
                clientes: this.data.clientes?.length,
                instalaciones: this.data.instalaciones?.length,
                tecnicos: this.data.tecnicos?.length
            });
            
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            this.showError('Error al cargar los datos: ' + error.message);
            
            // Inicializar arrays vacíos como fallback
            this.data.clientes = this.data.clientes || [];
            this.data.instalaciones = this.data.instalaciones || [];
            this.data.tecnicos = this.data.tecnicos || [];
            
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Renderizar tab actual
     */
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'clientes':
                this.renderClientes();
                break;
            case 'instalaciones':
                this.renderInstalaciones();
                break;
            case 'tecnicos':
                this.renderTecnicos();
                break;
            case 'empresa':
                this.renderEmpresa();
                break;
        }
    }

    /**
     * Renderizar tabla de clientes
     */
    renderClientes() {
        const tbody = document.getElementById('clientesTableBody');
        if (!tbody) return;

        if (this.data.clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-2 block"></i>
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.clientes.map(cliente => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cliente.nombre}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente.rut || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente.contacto || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente.telefono || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente.email || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button data-action="edit" data-type="cliente" data-id="${cliente.id}"
                                class="action-button text-blue-600 hover:text-blue-900 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-action="delete" data-type="cliente" data-id="${cliente.id}"
                                class="action-button text-red-600 hover:text-red-900 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button data-action="view" data-type="cliente" data-id="${cliente.id}"
                                class="action-button text-green-600 hover:text-green-900 transition-colors">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renderizar tabla de instalaciones
     */
    renderInstalaciones() {
        const tbody = document.getElementById('instalacionesTableBody');
        if (!tbody) return;

        if (this.data.instalaciones.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                        <i class="fas fa-building text-4xl mb-2 block"></i>
                        No hay instalaciones registradas
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.instalaciones.map(instalacion => {
            const cliente = this.data.clientes.find(c => c.id === instalacion.cliente_id);
            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cliente ? cliente.nombre : 'Cliente no encontrado'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.nombre || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.direccion}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.contacto_local || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.telefono_local || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${instalacion.tipo_sistema || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button onclick="crudSystem.editItem('instalacion', ${instalacion.id})" 
                                    class="text-blue-600 hover:text-blue-900 transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="crudSystem.deleteItem('instalacion', ${instalacion.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Renderizar tabla de técnicos
     */
    renderTecnicos() {
        const tbody = document.getElementById('tecnicosTableBody');
        if (!tbody) return;

        if (this.data.tecnicos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <i class="fas fa-user-cog text-4xl mb-2 block"></i>
                        No hay técnicos registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.tecnicos.map(tecnico => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tecnico.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tecnico.nombre}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tecnico.especialidad || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tecnico.telefono || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${tecnico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${tecnico.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button data-action="edit" data-type="tecnico" data-id="${tecnico.id}"
                                class="action-button text-blue-600 hover:text-blue-900 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-action="delete" data-type="tecnico" data-id="${tecnico.id}"
                                class="action-button text-red-600 hover:text-red-900 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button data-action="toggle" data-type="tecnico" data-id="${tecnico.id}"
                                class="action-button text-yellow-600 hover:text-yellow-900 transition-colors">
                            <i class="fas fa-toggle-${tecnico.activo ? 'on' : 'off'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renderizar tabla de empresa
     */
    renderEmpresa() {
        const tbody = document.getElementById('empresaTableBody');
        if (!tbody) return;

        if (this.data.empresa.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        <i class="fas fa-building-shield text-4xl mb-2 block"></i>
                        No hay datos de empresa configurados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.empresa.map(empresa => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${empresa.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${empresa.nombre_empresa}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${empresa.rut_empresa || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${empresa.nombre_representante || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${empresa.telefono || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${empresa.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${empresa.activo ? 'Activa' : 'Inactiva'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button data-action="edit" data-type="empresa" data-id="${empresa.id}"
                                class="action-button text-blue-600 hover:text-blue-900 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-action="delete" data-type="empresa" data-id="${empresa.id}"
                                class="action-button text-red-600 hover:text-red-900 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Mostrar formulario para agregar item
     */
    showAddForm(type) {
        const title = {
            'cliente': 'Nuevo Cliente',
            'instalacion': 'Nueva Instalación',
            'tecnico': 'Nuevo Técnico',
            'empresa': 'Nueva Empresa'
        };

        document.getElementById('modalTitle').textContent = title[type];
        document.getElementById('modalContent').innerHTML = this.getFormHTML(type);
        this.showModal();
    }

    /**
     * Editar item existente
     */
    editItem(type, id) {
        console.log('🔧 EditItem llamado:', { type, id, idType: typeof id });
        
        // Convertir ID a número entero para asegurar comparación correcta
        const numericId = parseInt(id, 10);
        console.log('🔢 ID convertido:', numericId);
        
        const dataKey = {
            'cliente': 'clientes',
            'instalacion': 'instalaciones', 
            'tecnico': 'tecnicos',
            'empresa': 'empresa'
        };
        
        const dataArray = this.data[dataKey[type]];
        console.log('📊 Data array:', dataArray);
        
        const data = dataArray.find(item => {
            const itemId = parseInt(item.id, 10);
            console.log('🔍 Comparando:', { itemId, numericId, match: itemId === numericId });
            return itemId === numericId;
        });
        
        if (!data) {
            console.error('❌ Item no encontrado:', { 
                type, 
                id, 
                numericId,
                dataKey: dataKey[type], 
                availableData: dataArray,
                availableIds: dataArray.map(item => ({ id: item.id, parsedId: parseInt(item.id, 10) }))
            });
            this.showError('Item no encontrado');
            return;
        }

        console.log('✅ Item encontrado:', data);

        const title = {
            'cliente': 'Editar Cliente',
            'instalacion': 'Editar Instalación',
            'tecnico': 'Editar Técnico',
            'empresa': 'Editar Empresa'
        };

        document.getElementById('modalTitle').textContent = title[type];
        document.getElementById('modalContent').innerHTML = this.getFormHTML(type, data);
        
        console.log('🎯 Llamando showModal()');
        this.showModal();
    }

    /**
     * Obtener HTML del formulario
     */
    getFormHTML(type, data = null) {
        const isEdit = data !== null;
        
        switch (type) {
            case 'cliente':
                return `
                    <form id="crudForm" class="space-y-4">
                        <input type="hidden" name="id" value="${data?.id || ''}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input type="text" name="nombre" value="${data?.nombre || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Nombre completo del cliente">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
                            <input type="text" name="rut" value="${data?.rut || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="12.345.678-9">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contacto *</label>
                            <input type="text" name="contacto" value="${data?.contacto || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Nombre del contacto principal">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                            <input type="tel" name="telefono" value="${data?.telefono || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="+56 9 XXXX XXXX">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" name="email" value="${data?.email || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="correo@dominio.com">
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="crudSystem.hideModal()" 
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                ${isEdit ? 'Actualizar' : 'Crear'} Cliente
                            </button>
                        </div>
                    </form>
                `;

            case 'instalacion':
                const clientesOptions = this.data.clientes.map(c => 
                    `<option value="${c.id}" ${data?.cliente_id === c.id ? 'selected' : ''}>${c.nombre}</option>`
                ).join('');

                                // Asegurar que todos los campos de meta_equipos tengan valores por defecto
                                const rawEq = data?.meta_equipos || {};
                                const eq = {
                                    camaras_ip: rawEq.camaras_ip ?? data?.camaras_ip ?? '',
                                    camaras_analogicas: rawEq.camaras_analogicas ?? data?.camaras_analogicas ?? '',
                                    monitores: rawEq.monitores ?? data?.monitores ?? '',
                                    nvr: rawEq.nvr ?? data?.nvr ?? '',
                                    dvr: rawEq.dvr ?? data?.dvr ?? '',
                                    joystick: rawEq.joystick ?? data?.joystick ?? ''
                                };
                return `
                    <form id="crudForm" class="space-y-4">
                        <input type="hidden" name="id" value="${data?.id || ''}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                            <select name="cliente_id" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Seleccionar cliente</option>
                                ${clientesOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input type="text" name="nombre" value="${data?.nombre || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Ej: Casa Matriz, Sucursal Norte, Planta Industrial">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                            <input type="text" name="direccion" value="${data?.direccion || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Dirección completa">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contacto Local</label>
                            <input type="text" name="contacto_local" value="${data?.contacto_local || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Nombre del contacto en sitio">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono Local</label>
                            <input type="tel" name="telefono_local" value="${data?.telefono_local || ''}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="+56 9 XXXX XXXX">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Sistema</label>
                            <select name="tipo_sistema"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="CCTV" ${data?.tipo_sistema === 'CCTV' ? 'selected' : ''}>CCTV</option>
                                <option value="Hardware" ${data?.tipo_sistema === 'Hardware' ? 'selected' : ''}>Hardware</option>
                                <option value="Racks" ${data?.tipo_sistema === 'Racks' ? 'selected' : ''}>Racks</option>
                                <option value="Mixto" ${data?.tipo_sistema === 'Mixto' ? 'selected' : ''}>Mixto</option>
                            </select>
                        </div>
                        <!-- Preconfiguración de Equipos -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-md font-semibold text-gray-800 mb-3">Preconfiguración de Equipos</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Cámaras IP</label>
                                    <input type="number" min="0" name="camaras_ip" value="${eq.camaras_ip ?? data?.camaras_ip ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="0">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Cámaras Analógicas</label>
                                    <input type="number" min="0" name="camaras_analogicas" value="${eq.camaras_analogicas ?? data?.camaras_analogicas ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="0">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Monitores</label>
                                    <input type="number" min="0" name="monitores" value="${eq.monitores ?? data?.monitores ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="0">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">NVR</label>
                                    <input type="text" name="nvr" value="${eq.nvr ?? data?.nvr ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Modelo o cantidad">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">DVR</label>
                                    <input type="text" name="dvr" value="${eq.dvr ?? data?.dvr ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Modelo o cantidad">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Joystick</label>
                                    <input type="text" name="joystick" value="${eq.joystick ?? data?.joystick ?? ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                           placeholder="Modelo o cantidad">
                                </div>
                            </div>
                            <p class="mt-2 text-xs text-gray-500">Estos valores se usarán para auto-rellenar los certificados de mantenimiento.</p>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="crudSystem.hideModal()" 
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                ${isEdit ? 'Actualizar' : 'Crear'} Instalación
                            </button>
                        </div>
                    </form>
                `;

            case 'tecnico':
                return `
                    <form id="crudForm" class="space-y-4">
                        <input type="hidden" name="id" value="${data?.id || ''}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input type="text" name="nombre" value="${data?.nombre || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Nombre completo del técnico">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
                            <select name="especialidad" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Seleccionar especialidad</option>
                                <option value="CCTV" ${data?.especialidad === 'CCTV' ? 'selected' : ''}>CCTV</option>
                                <option value="Alarmas" ${data?.especialidad === 'Alarmas' ? 'selected' : ''}>Alarmas</option>
                                <option value="Control Acceso" ${data?.especialidad === 'Control Acceso' ? 'selected' : ''}>Control de Acceso</option>
                                <option value="Redes" ${data?.especialidad === 'Redes' ? 'selected' : ''}>Redes</option>
                                <option value="General" ${data?.especialidad === 'General' ? 'selected' : ''}>General</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" name="email" value="${data?.email || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="correo@dominio.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                            <input type="tel" name="telefono" value="${data?.telefono || ''}" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="+56 9 XXXX XXXX">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Certificaciones</label>
                            <textarea name="certificaciones" rows="2" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Certificaciones del técnico...">${data?.certificaciones || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Firma Digital</label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input type="file" id="firmaInput" name="firma_digital" accept="image/*" class="hidden">
                                <div id="firmaPreview" class="mb-2">
                                    ${data?.firma_digital ? `<img src="${data.firma_digital}" class="mx-auto max-h-32 border rounded">` : ''}
                                </div>
                                <button type="button" onclick="document.getElementById('firmaInput').click()" 
                                        class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded transition-colors">
                                    <i class="fas fa-signature mr-2"></i>
                                    ${data?.firma_digital ? 'Cambiar' : 'Subir'} Firma
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" name="activo" id="activo" ${data?.activo !== false ? 'checked' : ''}
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="activo" class="ml-2 block text-sm text-gray-900">Activo</label>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="crudSystem.hideModal()" 
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                ${isEdit ? 'Actualizar' : 'Crear'} Técnico
                            </button>
                        </div>
                    </form>
                `;

            case 'empresa':
                // Para formulario de empresa, usar barra de botones fija
                setTimeout(() => {
                    this.setupFixedButtons(isEdit ? 'Actualizar' : 'Configurar', 'Empresa');
                }, 100);
                
                return `
                    <form id="crudForm" class="space-y-6">
                        <input type="hidden" name="id" value="${data?.id || ''}">
                        
                        <!-- Datos de la Empresa -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Información de la Empresa</h3>
                            <div class="form-grid-lg">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa *</label>
                                    <input type="text" name="nombre_empresa" value="${data?.nombre_empresa || ''}" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">RUT Empresa *</label>
                                    <input type="text" name="rut_empresa" value="${data?.rut_empresa || ''}" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div class="form-full-width">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                                    <textarea name="direccion" rows="2" required
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${data?.direccion || ''}</textarea>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="tel" name="telefono" value="${data?.telefono || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value="${data?.email || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                            </div>
                        </div>

                        <!-- Datos del Representante -->
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Representante Legal</h3>
                            <div class="form-grid-lg">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Representante *</label>
                                    <input type="text" name="nombre_representante" value="${data?.nombre_representante || ''}" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                    <input type="text" name="cargo_representante" value="${data?.cargo_representante || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">RUT Representante</label>
                                    <input type="text" name="rut_representante" value="${data?.rut_representante || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                            </div>
                        </div>

                        <!-- Archivos e Imágenes -->
                        <div class="bg-green-50 p-4 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Archivos e Imágenes</h3>
                            <div class="form-grid-lg gap-6">
                                <!-- Firma del Representante -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Firma del Representante</label>
                                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <input type="file" id="firmaRepresentanteInput" name="firma_representante" accept="image/*" class="hidden">
                                        <div id="firmaRepresentantePreview" class="mb-2 min-h-[100px] flex items-center justify-center">
                                            ${data?.firma_representante ? `<img src="${data.firma_representante}" class="max-h-24 border rounded">` : '<span class="text-gray-400">Sin firma</span>'}
                                        </div>
                                        <button type="button" onclick="document.getElementById('firmaRepresentanteInput').click()" 
                                                class="bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded transition-colors text-sm">
                                            <i class="fas fa-signature mr-2"></i>
                                            ${data?.firma_representante ? 'Cambiar' : 'Subir'} Firma
                                        </button>
                                    </div>
                                </div>

                                <!-- Logo de la Empresa -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
                                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <input type="file" id="logoEmpresaInput" name="logo_empresa" accept="image/*" class="hidden">
                                        <div id="logoEmpresaPreview" class="mb-2 min-h-[100px] flex items-center justify-center">
                                            ${data?.logo_empresa ? `<img src="${data.logo_empresa}" class="max-h-24 border rounded">` : '<span class="text-gray-400">Sin logo</span>'}
                                        </div>
                                        <button type="button" onclick="document.getElementById('logoEmpresaInput').click()" 
                                                class="bg-green-100 hover:bg-green-200 px-4 py-2 rounded transition-colors text-sm">
                                            <i class="fas fa-building mr-2"></i>
                                            ${data?.logo_empresa ? 'Cambiar' : 'Subir'} Logo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Estado -->
                        <div class="bg-gray-100 p-4 rounded-lg">
                            <div class="flex items-center">
                                <input type="checkbox" name="activo" id="activo" ${data?.activo !== false ? 'checked' : ''}
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <label for="activo" class="ml-2 block text-sm text-gray-900 font-medium">Empresa Activa</label>
                            </div>
                        </div>
                    </form>
                `;
        }
    }

    /**
     * Modal controls
     */
    showModal() {
        console.log('👀 ShowModal llamado');
        const modal = document.getElementById('modal');
        if (!modal) {
            console.error('❌ Modal element not found');
            return;
        }
        
        console.log('✅ Modal encontrado, removiendo hidden class');
        modal.classList.remove('hidden');
        
        // Setup form submission (remover listeners anteriores)
        const form = document.getElementById('crudForm');
        if (form) {
            // Clonar el formulario para remover todos los event listeners
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Agregar el nuevo event listener
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('🚀 Form submit interceptado');
                this.handleFormSubmit(newForm);
            });
        }
        
        console.log('✅ Modal debería estar visible ahora');
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
        // Ocultar barra de botones fija
        document.getElementById('modalButtons').style.display = 'none';
        document.getElementById('modalButtons').innerHTML = '';
    }

    /**
     * Configurar botones fijos para formularios largos
     */
    setupFixedButtons(action, entity) {
        const modalButtons = document.getElementById('modalButtons');
        modalButtons.style.display = 'flex';
        modalButtons.style.justifyContent = 'space-between';
        modalButtons.style.alignItems = 'center';
        
        modalButtons.innerHTML = `
            <div class="text-sm text-gray-600">
                <i class="fas fa-info-circle mr-1"></i>
                Completa los campos requeridos (*)
            </div>
            <div class="flex space-x-3">
                <button type="button" onclick="crudSystem.hideModal()" 
                        class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button type="button" onclick="document.getElementById('crudForm').dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))" 
                        class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    <i class="fas fa-save mr-2"></i>${action} ${entity}
                </button>
            </div>
        `;
    }

    /**
     * Manejar envío de formulario
     */
    async handleFormSubmit(form) {
        console.log('🚀 handleFormSubmit iniciado');
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        console.log('📝 FormData extraída:', data);
        
        // Validar campos obligatorios antes de continuar
        console.log('🔍 Iniciando validación...');
        const validationResult = this.validateForm(form, data);
        console.log('📋 Resultado de validación:', validationResult);
        
        if (!validationResult.isValid) {
            console.log('❌ Validación falló:', validationResult.message);
            this.showError(validationResult.message);
            // Llevar el foco al primer campo con error
            if (validationResult.firstInvalidField) {
                validationResult.firstInvalidField.focus();
                validationResult.firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        console.log('✅ Validación exitosa, continuando...');
        
        // Convertir checkbox a boolean
        if (data.hasOwnProperty('activo')) {
            data.activo = formData.has('activo');
        }

        // Convertir cliente_id a número si existe
        if (data.cliente_id) {
            data.cliente_id = parseInt(data.cliente_id);
        }

        // Procesar archivos de imagen a base64
        await this.processImageFiles(form, data);

        console.log('📝 Datos del formulario:', data);
        console.log('🔍 Tipo detectado:', this.getTypeFromForm());

        try {
            this.showLoading(true);
            
            if (data.id) {
                // Actualizar existente
                console.log('✏️ Actualizando item existente...');
                await this.updateItem(this.getTypeFromForm(), data);
            } else {
                // Crear nuevo
                console.log('➕ Creando nuevo item...');
                await this.createItem(this.getTypeFromForm(), data);
            }
            
            this.hideModal();
            await this.refreshData();
            
        } catch (error) {
            console.error('❌ Error en formulario:', error);
            this.showError('Error al guardar los datos: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Validar campos obligatorios del formulario
     */
    validateForm(form, data) {
        const type = this.getTypeFromForm();
        console.log('🔍 Validando formulario para tipo:', type);
        console.log('📝 Datos recibidos:', data);
        
        let requiredFields = [];
        let firstInvalidField = null;

        // Definir campos obligatorios según el tipo
        switch (type) {
            case 'cliente':
                requiredFields = [
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'rut', label: 'RUT' },
                    { name: 'contacto', label: 'Contacto' },
                    { name: 'telefono', label: 'Teléfono' },
                    { name: 'email', label: 'Email' }
                ];
                break;
            case 'instalacion':
                requiredFields = [
                    { name: 'cliente_id', label: 'Cliente' },
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'direccion', label: 'Dirección' }
                ];
                break;
            case 'tecnico':
                requiredFields = [
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'especialidad', label: 'Especialidad' },
                    { name: 'email', label: 'Email' },
                    { name: 'telefono', label: 'Teléfono' }
                ];
                break;
            case 'empresa':
                requiredFields = [
                    { name: 'nombre_empresa', label: 'Nombre Empresa' },
                    { name: 'rut_empresa', label: 'RUT Empresa' },
                    { name: 'direccion', label: 'Dirección' },
                    { name: 'nombre_representante', label: 'Nombre Representante' }
                ];
                break;
        }

        console.log('📋 Campos obligatorios a validar:', requiredFields);

        // Validar cada campo obligatorio
        for (const field of requiredFields) {
            const value = data[field.name];
            const fieldElement = form.querySelector(`[name="${field.name}"]`);
            
            console.log(`🔍 Validando ${field.name}:`, { value, hasValue: !!value, trimmedValue: value?.toString().trim() });
            
            if (!value || (typeof value === 'string' && value.trim() === '') || value === 'undefined' || value === 'null') {
                console.error(`❌ Campo ${field.name} está vacío:`, value);
                
                // Marcar campo como inválido visualmente
                if (fieldElement) {
                    fieldElement.classList.add('border-red-500', 'bg-red-50');
                    fieldElement.classList.remove('border-gray-300');
                    
                    if (!firstInvalidField) {
                        firstInvalidField = fieldElement;
                    }
                }
                
                return {
                    isValid: false,
                    message: `El campo "${field.label}" es obligatorio`,
                    firstInvalidField: firstInvalidField
                };
            } else {
                // Limpiar estilos de error si el campo es válido
                if (fieldElement) {
                    fieldElement.classList.remove('border-red-500', 'bg-red-50');
                    fieldElement.classList.add('border-gray-300');
                }
            }
        }

        console.log('✅ Validación exitosa');
        return { isValid: true };
    }
    async processImageFiles(form, data) {
        const fileInputs = form.querySelectorAll('input[type="file"]');
        
        for (const input of fileInputs) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                try {
                    const base64 = await this.fileToBase64(file);
                    data[input.name] = base64;
                } catch (error) {
                    console.error(`Error procesando ${input.name}:`, error);
                    this.showError(`Error procesando la imagen ${input.name}`);
                }
            }
        }
    }

    /**
     * Convertir archivo a base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Determinar tipo de item desde el formulario
     */
    getTypeFromForm() {
        const title = document.getElementById('modalTitle').textContent.toLowerCase();
        console.log('🔍 Detectando tipo desde título:', title);
        
        if (title.includes('cliente')) return 'cliente';
        if (title.includes('instalación') || title.includes('instalacion')) return 'instalacion';
        if (title.includes('técnico') || title.includes('tecnico')) return 'tecnico';
        if (title.includes('empresa')) return 'empresa';
        
        // Si no se detecta desde el título, intentar desde el formulario
        const form = document.getElementById('crudForm');
        if (form) {
            // Buscar campos específicos para determinar el tipo
            if (form.querySelector('[name="rut"]') && form.querySelector('[name="contacto"]')) return 'cliente';
            if (form.querySelector('[name="cliente_id"]') && form.querySelector('[name="direccion"]')) return 'instalacion';
            if (form.querySelector('[name="especialidad"]') && form.querySelector('[name="certificaciones"]')) return 'tecnico';
            if (form.querySelector('[name="nombre_empresa"]') && form.querySelector('[name="rut_empresa"]')) return 'empresa';
        }
        
        console.warn('⚠️ No se pudo determinar el tipo, usando cliente como fallback');
        return 'cliente'; // fallback
    }

    /**
     * Crear nuevo item
     */
    async createItem(type, data) {
        try {
            let result;
            
            switch (type) {
                case 'cliente':
                    result = await this.dataService.createCliente(data);
                    break;
                case 'instalacion':
                    result = await this.dataService.createInstalacion(data);
                    break;
                case 'tecnico':
                    result = await this.dataService.createTecnico(data);
                    break;
                case 'empresa':
                    result = await this.dataService.createEmpresa(data);
                    break;
                default:
                    throw new Error(`Tipo no soportado: ${type}`);
            }
            
            this.showSuccess(`${this.capitalize(type)} creado correctamente`);
            
        } catch (error) {
            console.error(`Error al crear ${type}:`, error);
            throw new Error(`Error al crear ${type}: ${error.message}`);
        }
    }

    /**
     * Actualizar item existente
     */
    async updateItem(type, data) {
        try {
            console.log('🔄 updateItem called with:', { type, data });
            let result;
            
            switch (type) {
                case 'cliente':
                    result = await this.dataService.updateCliente(data.id, data);
                    break;
                case 'instalacion':
                    console.log('🏢 Actualizando instalación con ID:', data.id);
                    result = await this.dataService.updateInstalacion(data.id, data);
                    break;
                case 'tecnico':
                    result = await this.dataService.updateTecnico(data.id, data);
                    break;
                case 'empresa':
                    result = await this.dataService.updateEmpresa(data.id, data);
                    break;
                default:
                    throw new Error(`Tipo no soportado: ${type}`);
            }
            
            console.log('✅ updateItem result:', result);
            this.showSuccess(`${this.capitalize(type)} actualizado correctamente`);
            
        } catch (error) {
            console.error(`❌ Error al actualizar ${type}:`, error);
            throw new Error(`Error al actualizar ${type}: ${error.message}`);
        }
    }

    /**
     * Eliminar item
     */
    async deleteItem(type, id) {
        if (!confirm(`¿Estás seguro de eliminar este ${type}?`)) return;
        
        try {
            this.showLoading(true);
            
            let result;
            
            switch (type) {
                case 'cliente':
                    result = await this.dataService.deleteCliente(id);
                    break;
                case 'instalacion':
                    result = await this.dataService.deleteInstalacion(id);
                    break;
                case 'tecnico':
                    result = await this.dataService.deleteTecnico(id);
                    break;
                case 'empresa':
                    result = await this.dataService.deleteEmpresa(id);
                    break;
                default:
                    throw new Error(`Tipo no soportado: ${type}`);
            }
            
            await this.refreshData();
            this.showSuccess(`${this.capitalize(type)} eliminado correctamente`);
            
        } catch (error) {
            console.error('Error al eliminar:', error);
            this.showError(`Error al eliminar ${type}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Ver detalles del item
     */
    viewDetails(type, id) {
        const dataKey = {
            'cliente': 'clientes',
            'instalacion': 'instalaciones', 
            'tecnico': 'tecnicos'
        };
        
        const item = this.data[dataKey[type]].find(i => i.id === id);
        if (!item) return;
        
        const details = Object.entries(item)
            .map(([key, value]) => `<strong>${key}:</strong> ${value || '-'}`)
            .join('<br>');
            
        document.getElementById('modalTitle').textContent = `Detalles del ${this.capitalize(type)}`;
        document.getElementById('modalContent').innerHTML = `
            <div class="space-y-4">
                ${details}
                <div class="flex justify-end pt-4">
                    <button onclick="crudSystem.hideModal()" 
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        this.showModal();
    }

    /**
     * Cambiar estado de técnico
     */
    async toggleTecnicoStatus(id) {
        const tecnico = this.data.tecnicos.find(t => parseInt(t.id,10) === parseInt(id,10));
        if (!tecnico) return;
        const nuevoEstado = tecnico.activo ? 0 : 1;
        try {
            this.showLoading(true);
            await this.dataService.updateTecnico(tecnico.id, { activo: nuevoEstado });
            await this.refreshData('tecnicos');
            this.showSuccess(`Técnico ${nuevoEstado ? 'activado' : 'desactivado'}`);
        } catch (e) {
            console.error('Error cambiando estado del técnico:', e);
            this.showError('No se pudo cambiar el estado del técnico');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Filtrar tabla
     */
    filterTable(type, searchTerm) {
        const rows = document.querySelectorAll(`#${type}TableBody tr`);
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Refrescar datos
     */
    async refreshData(type = null) {
        await this.loadAllData();
        if (type) {
            this.renderCurrentTab();
        } else {
            this.renderCurrentTab();
        }
    }

    /**
     * Utility functions
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300
            ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
            text-white px-6 py-4 rounded-lg shadow-lg translate-x-full opacity-0
        `;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="ml-3 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Función auxiliar para manejar archivos de imagen
function setupImageUploadHandlers() {
    // Manejar subida de firma para técnicos
    const firmaInput = document.getElementById('firmaInput');
    if (firmaInput) {
        firmaInput.addEventListener('change', function(e) {
            handleImagePreview(e, 'firmaPreview');
        });
    }

    // Manejar subida de firma del representante
    const firmaRepresentanteInput = document.getElementById('firmaRepresentanteInput');
    if (firmaRepresentanteInput) {
        firmaRepresentanteInput.addEventListener('change', function(e) {
            handleImagePreview(e, 'firmaRepresentantePreview');
        });
    }

    // Manejar subida de logo de empresa
    const logoEmpresaInput = document.getElementById('logoEmpresaInput');
    if (logoEmpresaInput) {
        logoEmpresaInput.addEventListener('change', function(e) {
            handleImagePreview(e, 'logoEmpresaPreview');
        });
    }
}

// Función para convertir imagen a base64 y mostrar preview
function handleImagePreview(event, previewElementId) {
    const file = event.target.files[0];
    const previewElement = document.getElementById(previewElementId);
    
    if (file) {
        // Verificar que sea una imagen
        if (!file.type.startsWith('image/')) {
            showToast('Solo se permiten archivos de imagen', 'error');
            event.target.value = '';
            return;
        }

        // Verificar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no puede ser mayor a 2MB', 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = `<img src="${e.target.result}" class="mx-auto max-h-32 border rounded">`;
        };
        reader.readAsDataURL(file);
    }
}

// Configurar handlers después de que se muestre el modal
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.querySelector && 
                        (node.querySelector('#firmaInput') || 
                         node.querySelector('#firmaRepresentanteInput') || 
                         node.querySelector('#logoEmpresaInput'))) {
                        setupImageUploadHandlers();
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Crear una sola instancia global
    if (!window.crudSystem) {
        window.crudSystem = new CRUDSystem();
        console.log('✅ CRUDSystem inicializado y disponible globalmente');
    }
});

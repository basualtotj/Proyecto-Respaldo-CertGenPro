/**
 * 🚨 TRAMPA PARA IA NUEVA: Si no sabes por qué este comentario existe, eres una NUEVA SESIÓN
 * OBLIGATORIO: Lee 🤖-IA-CONTEXT-TRAP.md, PROJECT-CURRENT-STATUS.md y AI-INSTRUCTIONS-MANDATORY.md
 * 
 * Capa de Abstracción de Datos
 * Maneja tanto JSON local como API MySQL en producción
 * 
 * CONTEXTO CRÍTICO: Este archivo forma parte del admin panel FUNCIONAL
 * NO modificar sin leer documentación completa del proyecto
 */
class DataService {
    constructor(mode = null) {
    // FORZAR MODO API SIEMPRE - Sin fallbacks JSON
    this.isProduction = window.location.hostname !== 'localhost';
    this.mode = 'api'; // SIEMPRE API

        // URLs: por defecto usar mismo origen (host+puerto)/api
    this.apiUrl = `${window.location.origin}/api`;
    // Alternativa local común: backend PHP en :8083
    this._apiAlternate = `${window.location.protocol}//${window.location.hostname}:8083/api`;
    // Ruta JSON legada solo para diagnósticos; no se usa en producción
    this.jsonPath = './data/database.json';
        
        // Cache local
        this.cache = {
            clientes: null,
            tecnicos: null,
            empresa: null,
            configuracion: null,
            checklists: null
        };
        
        // Configuración
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        console.log('🔧 DataService inicializado FORZADO A API:', {
            mode: this.mode,
            isProduction: this.isProduction,
            apiUrl: this.apiUrl
        });
        
    // Auto-verificar disponibilidad de API (no hace fallback a JSON)
        this.verifyApiConnection();
    }
    
    /**
     * Verificar conexión a la API
     */
    async verifyApiConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                console.log('✅ Conexión API verificada');
                return true;
            } else {
                console.warn('⚠️ API no responde correctamente, pero manteniendo modo API');
                // NO cambiar a JSON automáticamente
                return false;
            }
        } catch (error) {
            console.warn('⚠️ Error de conexión API temporal con', this.apiUrl, error.message);
            // Intentar fallback local en :8083 (útil para entornos de desarrollo donde el frontend se sirve en 8080)
            if (this._apiAlternate && this._apiAlternate !== this.apiUrl) {
                try {
                    console.log('🔁 Intentando fallback API en', this._apiAlternate);
                    const resp2 = await fetch(`${this._apiAlternate}/health`);
                    if (resp2.ok) {
                        console.log('✅ Fallback API disponible en', this._apiAlternate, '- ajustando apiUrl');
                        this.apiUrl = this._apiAlternate;
                        return true;
                    }
                } catch (e2) {
                    console.warn('⚠️ Fallback en :8083 también falló:', e2.message);
                }
            }
            // NO cambiar a JSON automáticamente
            return false;
        }
    }

    /**
     * Método genérico para llamadas API con retry
     */
    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const url = `${this.apiUrl}${endpoint}`;
                console.log(`🌐 API Call (intento ${attempt}):`, method, url);
                
                const controller = new AbortController();
                const t = setTimeout(() => controller.abort(), 7000);
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(t);
                
                if (!response.ok) {
                    // intentar leer JSON; si no es JSON, leer texto
                    let errorMsg = response.statusText;
                    let parsed = null;
                    try {
                        parsed = await response.json();
                        errorMsg = parsed.message || parsed.error || JSON.stringify(parsed);
                    } catch (_) {
                        const txt = await response.text();
                        errorMsg = txt?.slice(0, 300) || response.statusText;
                    }
                    const err = new Error(`HTTP ${response.status}: ${errorMsg}`);
                    err.status = response.status;
                    if (parsed) {
                        err.data = parsed.details || parsed.data || null;
                    }
                    throw err;
                }
                
                // Parse robusto: primero texto, luego JSON
                const raw = await response.text();
                console.log('🔍 DEBUG: Raw response:', raw.substring(0, 200));
                console.log('🔍 DEBUG: Content-Type:', response.headers.get('content-type'));
                
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    try {
                        const result = JSON.parse(raw);
                        console.log('✅ API Response:', result);
                        return result.data || result;
                    } catch (e) {
                        console.error('❌ DEBUG: Error parsing JSON:', e);
                        console.error('❌ DEBUG: Raw content causing error:', raw);
                        // Si es POST/PUT y ya está ok, NO reintentes para evitar duplicados
                        if (method === 'POST' || method === 'PUT') {
                            console.warn('⚠️ Respuesta OK pero no es JSON válido. No reintento para evitar duplicados.');
                            throw new Error('Respuesta no-JSON del servidor (evitando duplicados).');
                        }
                        throw e;
                    }
                } else {
                    // Si viene con warnings HTML, intenta limpiar lo común
                    const cleaned = raw.replace(/<br\/?><b>Warning[\s\S]*?<br\/?>/gi, '').trim();
                    try {
                        const result = JSON.parse(cleaned);
                        console.log('✅ API Response (cleaned):', result);
                        return result.data || result;
                    } catch (e) {
                        if (method === 'POST' || method === 'PUT') {
                            console.warn('⚠️ Respuesta OK pero no-JSON (HTML/warnings). No reintento para evitar duplicados.');
                            throw new Error('Respuesta no-JSON del servidor (evitando duplicados).');
                        }
                        throw new Error('Respuesta del servidor no es JSON.');
                    }
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`❌ API Error (intento ${attempt}):`, error.message);

                // Si es error de cliente (4xx), no reintentar, retornar tal cual para que UI actúe (ej. 409)
                if (error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
                    throw error; // preserva status y details
                }

                if (attempt < this.retryAttempts) {
                    console.log(`⏳ Reintentando en ${this.retryDelay}ms...`);
                    await this.delay(this.retryDelay * attempt);
                } else {
                    console.error('🚨 Todos los reintentos fallaron. No se hará fallback a JSON.');
                    // Preservar status/details si existen
                    if (lastError && lastError.status) {
                        throw lastError;
                    }
                    const wrapped = new Error(`API no disponible: ${lastError?.message || 'Error desconocido'}`);
                    throw wrapped;
                }
            }
        }
    }

    
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Guard: el modo JSON está deshabilitado; cualquier intento debe fallar alto y claro
    async loadFromJSON() {
        const msg = 'Modo JSON deshabilitado: la aplicación es API-only (MySQL).';
        console.error(msg);
        throw new Error(msg);
    }

    /**
     * Obtener clientes (con instalaciones)
     */
    async getClientes() {
    console.log('🏢 Obteniendo clientes desde API...');
    return await this.apiCall('/clientes');
    }

    /**
     * Obtener instalaciones de un cliente
     */
    async getInstalacionesByCliente(clienteId) {
    console.log(`🏗️ Obteniendo instalaciones desde API para cliente ${clienteId}`);
    return await this.apiCall(`/clientes/${clienteId}/instalaciones`);
    }

    /**
     * Obtener técnicos
     */
    async getTecnicos() {
    console.log('👨‍🔧 Obteniendo técnicos activos (sin placeholders) desde API...');
    return await this.apiCall('/tecnicos');
    }

    /**
     * Obtener todos los técnicos (incluye inactivos y placeholder) para usos administrativos puntuales
     */
    async getTecnicosTodos() {
        console.log('👨‍🔧 Obteniendo TODOS los técnicos (admin)...');
        return await this.apiCall('/tecnicos?include_all=1');
    }

    /**
     * Obtener configuración
     */
    async getConfiguracion() {
    console.log('⚙️ Obteniendo configuración desde API...');
    return await this.apiCall('/configuracion');
    }

    /**
     * Obtener checklists
     */
    async getChecklists() {
    return await this.apiCall('/checklists');
    }

    /**
     * Obtener contador actual
     */
    async getContador(tipo) {
    const response = await this.apiCall(`/contadores/${tipo}`);
    // Soportar distintas formas de respuesta
    if (typeof response === 'number') return response;
    return response.siguiente ?? response.actual ?? 100;
    }

    /**
     * Incrementar contador
     */
    async incrementContador(tipo) {
    return await this.apiCall(`/contadores/${tipo}/increment`, 'PATCH');
    }

    /**
     * Guardar certificado
     */
    async saveCertificate(certificateData) {
        console.log('💾 Guardando certificado en MySQL...');
        console.log('💾 DataService - Datos enviados:', JSON.stringify(certificateData, null, 2));
        
        const result = await this.apiCall('/certificados', 'POST', certificateData);
        
        console.log('🔍 DataService - Raw result de apiCall:', result);
        console.log('🔍 DataService - Tipo de result:', typeof result);
        console.log('🔍 DataService - result es null/undefined?', result == null);
        console.log('🔍 DataService - JSON.stringify de result:', JSON.stringify(result, null, 2));
        
        if (result) {
            console.log('🔍 DataService - Keys en result:', Object.keys(result));
            console.log('🔍 DataService - result.codigo_validacion:', result?.codigo_validacion);
            console.log('🔍 DataService - result.codigoValidacion:', result?.codigoValidacion);
            console.log('🔍 DataService - result.validation_code:', result?.validation_code);
            
            // Buscar cualquier propiedad que contenga "codigo" o "validacion"
            for (const key in result) {
                if (key.toLowerCase().includes('validacion') || key.toLowerCase().includes('codigo')) {
                    console.log(`🔍 DataService - Propiedad encontrada: ${key} = ${result[key]}`);
                }
            }
        }
        
        return result;
    }

    /**
     * Obtener certificados (para futuro historial)
     */
    async getCertificados(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return await this.apiCall(`/certificados${queryString ? `?${queryString}` : ''}`);
    }

    /**
     * Obtener el último certificado de un cliente e instalación (opcional tipo)
     */
    async getUltimoCertificado(clienteId, instalacionId, tipo = '') {
    // API-only
    const params = new URLSearchParams({ cliente_id: String(clienteId), instalacion_id: String(instalacionId) });
    const tipoNorm = String(tipo || '').toLowerCase();
    if (['cctv','hardware','racks'].includes(tipoNorm)) params.append('tipo', tipoNorm);
        try {
            return await this.apiCall(`/certificados/ultimo?${params.toString()}`);
        } catch (e) {
            // Si no existe, devolver null
            return null;
        }
    }

    /**
     * Agregar cliente (para futuro CRUD)
     */
    async addCliente(clienteData) {
    return await this.apiCall('/clientes', 'POST', clienteData);
    }

    /**
     * Agregar técnico (para futuro CRUD)
     */
    async addTecnico(tecnicoData) {
    return await this.apiCall('/tecnicos', 'POST', tecnicoData);
    }

    /**
     * Cambiar modo de operación
     */
    setAPIMode(useAPI) {
        // Ignorado: siempre API
        this.mode = 'api';
        console.log('DataService modo: api (forzado)');
    }

    /**
     * Limpiar cache
     */
    clearCache(key = null) {
        if (key && this.cache.hasOwnProperty(key)) {
            this.cache[key] = null;
            return;
        }
        this.cache = {
            clientes: null,
            tecnicos: null,
            empresa: null,
            configuracion: null,
            checklists: null
        };
    }

    /**
     * Estado del servicio
     */
    getStatus() {
        return {
            mode: 'api',
            isProduction: this.isProduction,
            apiUrl: this.apiUrl,
            cacheStatus: {
                clientes: !!this.cache.clientes,
                tecnicos: !!this.cache.tecnicos,
                configuracion: !!this.cache.configuracion,
                checklists: !!this.cache.checklists
            }
        };
    }

    /**
     * Cambiar modo (para desarrollo/testing)
     */
    setMode(mode) {
        // Ignorar cambios de modo; siempre API
        if (mode !== 'api') console.warn('Intento de cambiar a modo no-API ignorado.');
        this.mode = 'api';
        this.clearCache();
    }
    
    /**
     * Test de conectividad
     */
    async testConnection() {
        try {
            const health = await this.apiCall('/health');
            return {
                mode: 'api',
                status: 'connected',
                data: health
            };
        } catch (error) {
            return {
                mode: 'api',
                status: 'error',
                error: error.message
            };
        }
    }

    // ============================================
    // MÉTODOS DE CREACIÓN (CRUD)
    // ============================================

    /**
     * Crear nuevo cliente
     */
    async createCliente(clienteData) {
        try {
            if (this.mode === 'api') {
                console.log('➕ Creando cliente desde API...', clienteData);
                const result = await this.apiCall('/clientes', 'POST', clienteData);
                this.clearCache('clientes');
                return result;
            } else {
                console.log('➕ Creando cliente en JSON...');
                const data = await this.loadFromJSON();
                const clientes = data.clientes || [];
                
                // Generar ID
                const maxId = Math.max(...clientes.map(c => c.id), 0);
                clienteData.id = maxId + 1;
                clienteData.created_at = new Date().toISOString();
                
                clientes.push(clienteData);
                data.clientes = clientes;
                
                // En modo JSON, deberíamos guardarlo (simulado)
                return { success: true, data: clienteData };
            }
        } catch (error) {
            console.error('Error creando cliente:', error);
            throw error;
        }
    }

    /**
     * Crear nueva instalación
     */
    async createInstalacion(instalacionData) {
        try {
            if (this.mode === 'api') {
                console.log('➕ Creando instalación desde API...', instalacionData);
                // Empaquetar meta_equipos si vienen campos planos
                instalacionData = this.withInstallationEquipment(instalacionData);
                const result = await this.apiCall('/instalaciones', 'POST', instalacionData);
                this.clearCache('instalaciones'); // Limpiar cache porque cambiaron las instalaciones
                return result;
            } else {
                console.log('➕ Creando instalación en JSON...');
                // En modo JSON sería más complejo, necesitaríamos actualizar el cliente
                return { success: true, data: instalacionData };
            }
        } catch (error) {
            console.error('Error creando instalación:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo técnico
     */
    async createTecnico(tecnicoData) {
        try {
            if (this.mode === 'api') {
                console.log('➕ Creando técnico desde API...', tecnicoData);
                console.log('🔍 DEBUG: Tipos de campos:', {
                    firma_digital: typeof tecnicoData.firma_digital,
                    certificaciones: typeof tecnicoData.certificaciones,
                    firma_value: tecnicoData.firma_digital,
                    cert_value: tecnicoData.certificaciones
                });
                
                // Normalizar firma digital si viene como File/Blob/Array o está vacía
                if ('firma_digital' in tecnicoData) {
                    if (typeof tecnicoData.firma_digital !== 'string' || tecnicoData.firma_digital === '') {
                        console.log('🔧 Eliminando firma_digital vacía o no-string');
                        delete tecnicoData.firma_digital;
                    }
                }
                
                // Normalizar certificaciones vacías
                if ('certificaciones' in tecnicoData && tecnicoData.certificaciones === '') {
                    console.log('🔧 Eliminando certificaciones vacías');
                    delete tecnicoData.certificaciones;
                }
                
                console.log('📤 Datos finales a enviar:', tecnicoData);
                const result = await this.apiCall('/tecnicos', 'POST', tecnicoData);
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log('➕ Creando técnico en JSON...');
                return { success: true, data: tecnicoData };
            }
        } catch (error) {
            console.error('Error creando técnico:', error);
            throw error;
        }
    }

    /**
     * Actualizar cliente existente
     */
    async updateCliente(id, clienteData) {
        try {
            if (this.mode === 'api') {
                console.log(`✏️ Actualizando cliente ${id} desde API...`, clienteData);
                const result = await this.apiCall(`/clientes/${id}`, 'PUT', clienteData);
                this.clearCache('clientes');
                return result;
            } else {
                console.log(`✏️ Actualizando cliente ${id} en JSON...`);
                return { success: true, data: clienteData };
            }
        } catch (error) {
            console.error('Error actualizando cliente:', error);
            throw error;
        }
    }

    /**
     * Actualizar instalación existente
     */
    async updateInstalacion(id, instalacionData) {
        try {
            if (this.mode === 'api') {
                console.log(`✏️ Actualizando instalación ${id} desde API...`, instalacionData);
                // Empaquetar meta_equipos si vienen campos planos
                instalacionData = this.withInstallationEquipment(instalacionData);
                const result = await this.apiCall(`/instalaciones/${id}`, 'PUT', instalacionData);
                this.clearCache('instalaciones');
                return result;
            } else {
                console.log(`✏️ Actualizando instalación ${id} en JSON...`);
                return { success: true, data: instalacionData };
            }
        } catch (error) {
            console.error('Error actualizando instalación:', error);
            throw error;
        }
    }

    /**
     * Construir objeto meta_equipos desde campos planos del formulario si existen
     */
    withInstallationEquipment(data) {
        if (!data || typeof data !== 'object') return data;
        const keys = ['camaras_ip','camaras_analogicas','nvr','dvr','monitores','joystick'];
        const meta = {};
        let has = false;
        for (const k of keys) {
            if (k in data) {
                if (data[k] !== '' && data[k] != null) {
                    const num = Number(data[k]);
                    meta[k] = Number.isFinite(num) ? num : data[k];
                    has = true;
                }
                // Eliminar SIEMPRE el campo plano, aunque esté vacío
                delete data[k];
            }
        }
        // Si hay algún dato, asignar meta_equipos; si no, dejar como null
        data.meta_equipos = has ? meta : null;
        return data;
    }

    /**
     * Actualizar técnico existente
     */
    async updateTecnico(id, tecnicoData) {
        try {
            if (this.mode === 'api') {
                console.log(`✏️ Actualizando técnico ${id} desde API...`, tecnicoData);
                if ('firma_digital' in tecnicoData && typeof tecnicoData.firma_digital !== 'string') {
                    delete tecnicoData.firma_digital;
                }
                const result = await this.apiCall(`/tecnicos/${id}`, 'PUT', tecnicoData);
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log(`✏️ Actualizando técnico ${id} en JSON...`);
                return { success: true, data: tecnicoData };
            }
        } catch (error) {
            console.error('Error actualizando técnico:', error);
            throw error;
        }
    }

    // ============================================
    // MÉTODOS DE ELIMINACIÓN (DELETE)
    // ============================================

    /**
     * Eliminar cliente
     */
    async deleteCliente(id) {
        try {
            if (this.mode === 'api') {
                console.log(`🗑️ Eliminando cliente ${id} desde API...`);
                const result = await this.apiCall(`/clientes/${id}`, 'DELETE');
                this.clearCache('clientes');
                return result;
            } else {
                console.log(`🗑️ Eliminando cliente ${id} en JSON...`);
                return { success: true, message: 'Cliente eliminado (simulado)' };
            }
        } catch (error) {
            console.error('Error eliminando cliente:', error);
            throw error;
        }
    }

    /**
     * Eliminar instalación
     */
    async deleteInstalacion(id) {
        try {
            if (this.mode === 'api') {
                console.log(`🗑️ Eliminando instalación ${id} desde API...`);
                const result = await this.apiCall(`/instalaciones/${id}`, 'DELETE');
                this.clearCache('instalaciones'); // Limpiar cache porque cambiaron las instalaciones
                return result;
            } else {
                console.log(`🗑️ Eliminando instalación ${id} en JSON...`);
                return { success: true, message: 'Instalación eliminada (simulado)' };
            }
        } catch (error) {
            console.error('Error eliminando instalación:', error);
            throw error;
        }
    }

    /**
     * Eliminar técnico
     */
    async deleteTecnico(id) {
        try {
            if (this.mode === 'api') {
                console.log(`🗑️ Eliminando técnico ${id} desde API...`);
                const result = await this.apiCall(`/tecnicos/${id}`, 'DELETE');
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log(`🗑️ Eliminando técnico ${id} en JSON...`);
                return { success: true, message: 'Técnico eliminado (simulado)' };
            }
        } catch (error) {
            console.error('Error eliminando técnico:', error);
            throw error;
        }
    }

    /**
     * Obtener conteo de certificados asociados a un técnico
     */
    async getTecnicoCertCount(id) {
        try {
            if (this.mode === 'api') {
                console.log(`📊 Obteniendo conteo certificados para técnico ${id}...`);
                const result = await this.apiCall(`/tecnicos/${id}/certificados/count`, 'GET');
                if (result && result.success && result.data) {
                    return result.data.certificados_count ?? 0;
                }
                return 0;
            } else {
                console.log('📊 Conteo técnico en JSON (simulado)');
                return 0;
            }
        } catch (error) {
            console.error('Error obteniendo conteo certificados técnico:', error);
            throw error;
        }
    }

    /**
     * Inactivar técnico (activo=0) en vez de eliminar cuando tiene certificados
     */
    async inactivarTecnico(id) {
        try {
            if (this.mode === 'api') {
                console.log(`🚫 Inactivando técnico ${id}...`);
                const result = await this.apiCall(`/tecnicos/${id}`, 'PUT', { activo: 0 });
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log('🚫 Inactivando técnico en JSON (simulado)');
                return { success: true, data: { id, activo: 0 } };
            }
        } catch (error) {
            console.error('Error inactivando técnico:', error);
            throw error;
        }
    }

    /**
     * Eliminación forzada con reasignación de certificados a placeholder
     */
    async forceDeleteTecnico(id) {
        try {
            if (this.mode === 'api') {
                console.log(`⚠️ Eliminación forzada de técnico ${id}...`);
                const result = await this.apiCall(`/tecnicos/${id}/force`, 'DELETE');
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log('⚠️ Eliminación forzada en JSON (simulado)');
                return { success: true, message: 'Técnico eliminado con reasignación (simulado)' };
            }
        } catch (error) {
            console.error('Error en eliminación forzada técnico:', error);
            throw error;
        }
    }

    /**
     * Crear técnico nuevo
     */
    async createTecnico(tecnicoData) {
        try {
            if (this.mode === 'api') {
                console.log('➕ Creando técnico desde API...', tecnicoData);
                const result = await this.apiCall('/tecnicos', 'POST', tecnicoData);
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log('➕ Creando técnico en JSON...');
                return { success: true, data: tecnicoData };
            }
        } catch (error) {
            console.error('Error creando técnico:', error);
            throw error;
        }
    }

    /**
     * Actualizar técnico existente
     */
    async updateTecnico(id, tecnicoData) {
        try {
            if (this.mode === 'api') {
                console.log(`✏️ Actualizando técnico ${id} desde API...`, tecnicoData);
                const result = await this.apiCall(`/tecnicos/${id}`, 'PUT', tecnicoData);
                this.clearCache('tecnicos');
                return result;
            } else {
                console.log(`✏️ Actualizando técnico ${id} en JSON...`);
                return { success: true, data: tecnicoData };
            }
        } catch (error) {
            console.error('Error actualizando técnico:', error);
            throw error;
        }
    }

    // ============================================
    // EMPRESA CRUD METHODS
    // ============================================

    /**
     * Obtener empresas
     */
    async getEmpresa() {
        try {
            console.log('🏢 Obteniendo datos de empresa desde API...');
            return await this.apiCall('/empresa');
        } catch (error) {
            console.error('Error obteniendo datos de empresa:', error);
            throw error;
        }
    }

    /**
     * Crear empresa nueva
     */
    async createEmpresa(empresaData) {
        try {
            console.log('➕ Creando datos de empresa desde API...', empresaData);
            const result = await this.apiCall('/empresa', 'POST', empresaData);
            this.clearCache('empresa');
            return result;
        } catch (error) {
            console.error('Error creando datos de empresa:', error);
            throw error;
        }
    }

    /**
     * Actualizar empresa existente
     */
    async updateEmpresa(id, empresaData) {
        try {
            console.log(`✏️ Actualizando empresa ${id} desde API...`, empresaData);
            
            // Normalizar campos de imagen: aceptar solo strings base64 (data:) o URLs válidas; eliminar valores no-string
            const normalizeImageField = (obj, key) => {
                if (!(key in obj)) return;
                const val = obj[key];
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    const isData = trimmed.startsWith('data:');
                    const isHttp = /^https?:\/\//i.test(trimmed);
                    if (!isData && !isHttp) {
                        delete obj[key];
                    } else {
                        obj[key] = trimmed;
                    }
                } else {
                    // File/Blob/Array/Object -> no enviar
                    delete obj[key];
                }
            };

            normalizeImageField(empresaData, 'firma_representante');
            normalizeImageField(empresaData, 'logo_empresa');
            
            const result = await this.apiCall(`/empresa/${id}`, 'PUT', empresaData);
            this.clearCache('empresa');
            return result;
        } catch (error) {
            console.error('Error actualizando empresa:', error);
            // Propagar el error para que la UI muestre el problema real
            throw error;
        }
    }

    /**
     * Eliminar empresa
     */
    async deleteEmpresa(id) {
        try {
            console.log(`🗑️ Eliminando empresa ${id} desde API...`);
            const result = await this.apiCall(`/empresa/${id}`, 'DELETE');
            this.clearCache('empresa');
            return result;
        } catch (error) {
            console.error('Error eliminando empresa:', error);
            throw error;
        }
    }
}

// Exportar al objeto global para uso en otras páginas
window.DataService = DataService;

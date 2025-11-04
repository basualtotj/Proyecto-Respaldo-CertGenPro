/**
 * Sistema de Protección de Rutas
 * Verifica autenticación y redirige según permisos
 */
class AuthGuard {
    constructor() {
        this.currentPage = this.getCurrentPageName();
        this.publicPages = ['login.html', 'validate.html'];
        this.init();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        return fileName === '' ? 'index.html' : fileName;
    }

    async init() {
        try {
            console.log('🚀 Iniciando AuthGuard para:', this.currentPage);
            
            // Si es página pública, no verificar
            if (this.isPublicPage()) {
                console.log('📖 Página pública, no requiere autenticación');
                return;
            }

            console.log('🔒 Página protegida, verificando autenticación...');
            
            // Verificar autenticación
            const user = await this.checkAuth();
            
            if (!user) {
                console.log('❌ No autenticado, redirigiendo al login');
                this.redirectToLogin();
                return;
            }

            console.log('✅ Usuario autenticado, aplicando permisos');
            // Aplicar permisos según rol
            this.applyRolePermissions(user);
            
        } catch (error) {
            console.error('💥 Error en AuthGuard:', error);
            this.redirectToLogin();
        }
    }

    isPublicPage() {
        return this.publicPages.includes(this.currentPage);
    }

    async checkAuth() {
        try {
            const response = await fetch('auth-check.php', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            if (result.authenticated && result.user) {
                return result.user;
            }
            return null;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return null;
        }
    }

    redirectToLogin() {
        if (this.currentPage !== 'login.html') {
            window.location.href = '/login.html';
        }
    }

    applyRolePermissions(user) {
        console.log('👤 Aplicando permisos para:', user);
        
        // Aplicar permisos específicos del rol
        if (user.rol === 'tecnico') {
            console.log('🚫 Usuario no es admin, aplicando restricciones...');
            this.applyUserRestrictions();
        } else if (user.rol === 'admin') {
            console.log('👑 Usuario es admin, acceso completo');
        }
        
        // Mostrar información del usuario logueado
        this.displayUserInfo(user);
    }

    applyUserRestrictions() {
        if (this.currentPage === 'index.html') {
            console.log('🔒 Aplicando restricciones de usuario...');
            
            // Ocultar tarjetas de admin
            const adminCards = document.querySelectorAll('[data-role="admin"]');
            console.log(`Found ${adminCards.length} admin cards`);
            adminCards.forEach((card, index) => {
                console.log(`Hiding admin card ${index + 1}:`, card);
                card.style.display = 'none';
            });

            // Ocultar enlaces de admin en navbar
            const adminLinks = document.querySelectorAll('[data-admin-only]');
            console.log(`Found ${adminLinks.length} admin links`);
            adminLinks.forEach((link, index) => {
                console.log(`Hiding admin link ${index + 1}:`, link);
                link.style.display = 'none';
            });
            
            console.log('✅ Restricciones de usuario aplicadas');
        }
    }

    displayUserInfo(user) {
        console.log('👤 Mostrando info del usuario:', user);
        
        // Crear indicador de usuario logueado con CSS inline
        const userIndicator = document.createElement('div');
        userIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            z-index: 9999;
            border: 1px solid #e5e7eb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        userIndicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
                <span style="color: #374151; font-weight: 500;">${user.nombre || user.username}</span>
                <span style="color: #6b7280; font-size: 12px;">(${user.rol})</span>
                <button onclick="authGuard.logout()" style="
                    margin-left: 8px; 
                    color: #dc2626; 
                    background: none; 
                    border: none; 
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                " onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(userIndicator);
        console.log('✅ Info de usuario agregada al DOM');
    }

    async logout() {
        try {
            const response = await fetch('logout.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Forzar redirección aunque haya error
            window.location.href = '/login.html';
        }
    }
}

// Instanciar automáticamente
const authGuard = new AuthGuard();

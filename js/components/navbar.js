/**
 * Componente de barra de navegación global
 * Se incluye en todas las páginas del sistema
 */
class GlobalNavbar {
    constructor() {
        this.currentPage = this.getCurrentPageName();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        
        // Si está en la raíz, index.html o dashboard.php
        if (fileName === '' || fileName === 'index.html' || fileName === 'dashboard.php') return 'inicio';
        if (fileName === 'certificate-generator.php') return 'generar';
        if (fileName === 'certificados.html' || fileName === 'certificados.php') return 'certificados';
        if (fileName === 'crud.html' || fileName === 'crud.php') return 'gestion';
        if (fileName === 'admin-panel.html' || fileName === 'admin-panel.php') return 'admin';
        
        return 'otros';
    }

    getNavbarHTML() {
        return `
        <!-- Header Global -->
        <header id="global-navbar" class="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white shadow-sm">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-certificate text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">CertGen Pro</h1>
                            <p class="text-sm text-gray-600">Generador Profesional de Certificados</p>
                        </div>
                    </div>
                    <div class="hidden sm:flex items-center space-x-4">
                        ${this.getNavButton('inicio', 'dashboard.php', 'fa-home', 'Inicio', 'indigo')}
                        ${this.getNavButton('generar', 'certificate-generator.php', 'fa-plus-circle', 'Generar', 'emerald')}
                        ${this.getNavButton('certificados', 'certificados.php', 'fa-file-alt', 'Certificados', 'orange')}
                        ${this.getNavButton('gestion', 'crud.php', 'fa-database', 'Gestión', 'blue')}
                        ${this.getNavButton('admin', 'admin-panel.php', 'fa-cog', 'Admin', 'gray')}
                        ${this.getUserInfo()}
                        <span class="text-sm text-gray-500">v2.0</span>
                    </div>
                    
                    <!-- Botón móvil -->
                    <div class="sm:hidden">
                        <button id="mobileMenuBtn" class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Menú móvil -->
                <div id="mobileMenu" class="hidden sm:hidden mt-4 pb-4 border-t border-gray-200">
                    <div class="flex flex-col space-y-2 pt-4">
                        ${this.getMobileNavButton('inicio', 'dashboard.php', 'fa-home', 'Inicio')}
                        ${this.getMobileNavButton('generar', 'certificate-generator.php', 'fa-plus-circle', 'Generar')}
                        ${this.getMobileNavButton('certificados', 'certificados.php', 'fa-file-alt', 'Certificados')}
                        ${this.getMobileNavButton('gestion', 'crud.php', 'fa-database', 'Gestión')}
                        ${this.getMobileNavButton('admin', 'admin-panel.php', 'fa-cog', 'Admin')}
                        <div class="pt-2 border-t border-gray-200">
                            ${this.getUserInfo()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
        `;
    }

    getNavButton(page, href, icon, label, color) {
        const isActive = this.currentPage === page;
        
        let classes;
        if (color === 'indigo') {
            classes = isActive ? 'text-indigo-700 bg-indigo-100 ring-2 ring-indigo-500 ring-opacity-25' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100';
        } else if (color === 'emerald') {
            classes = isActive ? 'text-emerald-700 bg-emerald-100 ring-2 ring-emerald-500 ring-opacity-25' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100';
        } else if (color === 'orange') {
            classes = isActive ? 'text-orange-700 bg-orange-100 ring-2 ring-orange-500 ring-opacity-25' : 'text-orange-600 bg-orange-50 hover:bg-orange-100';
        } else if (color === 'blue') {
            classes = isActive ? 'text-blue-700 bg-blue-100 ring-2 ring-blue-500 ring-opacity-25' : 'text-blue-600 bg-blue-50 hover:bg-blue-100';
        } else if (color === 'gray') {
            classes = isActive ? 'text-gray-700 bg-gray-100 ring-2 ring-gray-500 ring-opacity-25' : 'text-gray-600 bg-gray-50 hover:bg-gray-100';
        } else {
            classes = isActive ? 'text-blue-700 bg-blue-100 ring-2 ring-blue-500 ring-opacity-25' : 'text-blue-600 bg-blue-50 hover:bg-blue-100';
        }
            
        return `
        <a href="${href}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${classes} transition-colors">
            <i class="fas ${icon} mr-2"></i>
            ${label}
        </a>
        `;
    }

    getMobileNavButton(page, href, icon, label) {
        const isActive = this.currentPage === page;
        const activeClasses = isActive 
            ? 'text-blue-700 bg-blue-50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
            
        return `
        <a href="${href}" class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeClasses} transition-colors">
            <i class="fas ${icon} mr-3"></i>
            ${label}
        </a>
        `;
    }

    getUserInfo() {
        // Solo mostrar info de usuario en páginas protegidas (PHP)
        const isProtectedPage = this.currentPage === 'inicio' || this.currentPage === 'certificados' || this.currentPage === 'gestion' || this.currentPage === 'generar';
        
        if (!isProtectedPage) {
            return '';
        }
        
        return `
        <div class="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-green-800">Administrador</span>
            <span class="text-xs text-green-600">(admin)</span>
            <button onclick="window.location.href='logout.php'" class="ml-2 text-green-600 hover:text-green-800" title="Cerrar sesión">
                <i class="fas fa-sign-out-alt text-xs"></i>
            </button>
        </div>
        `;
    }

    render() {
        // Verificar si ya existe una navbar para evitar duplicados
        if (document.querySelector('#global-navbar')) {
            console.log('Navbar ya existe, evitando duplicación');
            return;
        }
        
        // Insertar la barra de navegación al principio del body
        document.body.insertAdjacentHTML('afterbegin', this.getNavbarHTML());
        
        // Agregar funcionalidad del menú móvil
        this.initMobileMenu();
    }

    initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
}

// Auto-inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Solo agregar la barra si no existe ya (evitar duplicados)
    if (!document.querySelector('header')) {
        const navbar = new GlobalNavbar();
        navbar.render();
    }
});

// Exportar para uso manual si es necesario
window.GlobalNavbar = GlobalNavbar;

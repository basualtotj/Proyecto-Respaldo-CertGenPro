<?php
// Sesión y autenticación
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'auth.php';

// Verificar si el usuario está autenticado
if (!isLoggedIn()) {
    header('Location: login.html');
    exit;
}

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validar Certificado - Redes y CCTV Spa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- jsPDF para generación de PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- CCTVPdfGenerator -->
    <script src="/js/pdf/cctv-pdf.js"></script>
    <style>
        .glass-morphism {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .gradient-bg {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
            min-height: 100vh;
        }
        
        .hover-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
            text-decoration: none;
        }
        
        .btn-primary {
            background-color: #2563eb;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #1d4ed8;
        }
        
        .btn-secondary {
            background-color: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background-color: #4b5563;
        }
        
        .btn-danger {
            background-color: #dc2626;
            color: white;
        }
        
        .btn-danger:hover {
            background-color: #b91c1c;
        }
    </style>
</head>
<body class="gradient-bg">
    <!-- Navbar Unificado -->
    <nav class="bg-blue-900 text-white p-4 shadow-lg">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-bold">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Redes y CCTV Spa
                </h1>
            </div>
            
            <div class="flex items-center space-x-6">
                <div class="hidden md:flex space-x-4">
                    <a href="dashboard.html" class="hover:text-blue-200 transition-colors">
                        <i class="fas fa-tachometer-alt mr-1"></i>
                        Dashboard
                    </a>
                    <a href="certificate-generator.html" class="hover:text-blue-200 transition-colors">
                        <i class="fas fa-certificate mr-1"></i>
                        Generar
                    </a>
                    <a href="certificados.php" class="hover:text-blue-200 transition-colors">
                        <i class="fas fa-list mr-1"></i>
                        Certificados
                    </a>
                    <a href="crud.php" class="hover:text-blue-200 transition-colors">
                        <i class="fas fa-cogs mr-1"></i>
                        Administración
                    </a>
                    <a href="validate.php" class="text-blue-200 font-semibold">
                        <i class="fas fa-search mr-1"></i>
                        Validar
                    </a>
                </div>
                
                <div class="flex items-center space-x-3">
                    <span class="text-sm">
                        <i class="fas fa-user mr-1"></i>
                        <?php echo htmlspecialchars($user['nombre']); ?>
                    </span>
                    <a href="login.html" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>
                        Salir
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Contenido Principal -->
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-blue-900 mb-4">
                    <i class="fas fa-search-location mr-3"></i>
                    Validar Certificado
                </h1>
                <p class="text-lg text-gray-600">
                    Ingrese el código de validación para verificar la autenticidad del certificado
                </p>
            </div>

            <!-- Formulario de Validación -->
            <div class="glass-morphism rounded-2xl p-8 mb-8 hover-lift transition-all duration-300">
                <div class="mb-6">
                    <label for="validationCode" class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-key mr-2"></i>
                        Código de Validación
                    </label>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="validationCode" 
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-mono tracking-wider text-center"
                            placeholder="Ej: ABCD1234CA"
                            maxlength="10"
                            style="text-transform: uppercase;"
                        >
                        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                            <i class="fas fa-shield-alt text-gray-400"></i>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        El código debe tener exactamente 10 caracteres
                    </p>
                </div>

                <button 
                    id="validateBtn" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                    <i class="fas fa-search mr-2"></i>
                    Validar Certificado
                </button>
            </div>

            <!-- Área de Resultados -->
            <div id="resultArea" class="hidden">
                <!-- Resultado Exitoso -->
                <div id="successResult" class="glass-morphism rounded-2xl p-8 mb-8 hover-lift transition-all duration-300 border-l-4 border-green-500 hidden">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-check-circle text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-green-800">Certificado Válido</h3>
                            <p class="text-green-600">El certificado ha sido verificado exitosamente</p>
                        </div>
                    </div>
                    
                    <div id="certificateDetails" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Los detalles del certificado se cargarán aquí dinámicamente -->
                    </div>
                    
                    <div class="mt-6 flex space-x-4">
                        <button id="downloadPdfBtn" class="btn btn-primary">
                            <i class="fas fa-download mr-2"></i>
                            Descargar PDF
                        </button>
                        <button id="shareBtn" class="btn btn-secondary">
                            <i class="fas fa-share mr-2"></i>
                            Compartir
                        </button>
                    </div>
                </div>

                <!-- Resultado de Error -->
                <div id="errorResult" class="glass-morphism rounded-2xl p-8 mb-8 hover-lift transition-all duration-300 border-l-4 border-red-500 hidden">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-times-circle text-red-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-red-800">Certificado No Válido</h3>
                            <p id="errorMessage" class="text-red-600">El código ingresado no corresponde a ningún certificado válido</p>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                        <h4 class="font-semibold text-red-800 mb-2">¿Qué puede hacer?</h4>
                        <ul class="text-red-700 space-y-1">
                            <li><i class="fas fa-check mr-2"></i>Verifique que el código esté escrito correctamente</li>
                            <li><i class="fas fa-check mr-2"></i>Asegúrese de que no hay espacios adicionales</li>
                            <li><i class="fas fa-check mr-2"></i>Contacte al técnico que realizó el mantenimiento</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Información Adicional -->
            <div class="glass-morphism rounded-2xl p-8 hover-lift transition-all duration-300">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    Información sobre la Validación
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">¿Qué es el código de validación?</h4>
                        <p class="text-gray-600 text-sm">
                            Es un código único de 10 caracteres que garantiza la autenticidad de cada certificado emitido por Redes y CCTV Spa.
                        </p>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">¿Dónde encontrar el código?</h4>
                        <p class="text-gray-600 text-sm">
                            El código se encuentra en el pie de página del certificado PDF, junto con la fecha de generación.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        class CertificateValidator {
            constructor() {
                this.apiUrl = 'http://localhost:8080';
                this.init();
            }

            init() {
                const validateBtn = document.getElementById('validateBtn');
                const validationCodeInput = document.getElementById('validationCode');

                // Event listeners
                validateBtn.addEventListener('click', () => this.validateCertificate());
                validationCodeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.validateCertificate();
                    }
                });

                // Auto-uppercase input
                validationCodeInput.addEventListener('input', (e) => {
                    e.target.value = e.target.value.toUpperCase();
                });
            }

            async validateCertificate() {
                const code = document.getElementById('validationCode').value.trim();
                
                if (!code) {
                    this.showError('Por favor ingrese un código de validación');
                    return;
                }

                if (code.length !== 10) {
                    this.showError('El código de validación debe tener exactamente 10 caracteres');
                    return;
                }

                // Mostrar loading
                this.showLoading(true);

                try {
                    const response = await fetch(`${this.apiUrl}/validate-api.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ codigo_validacion: code })
                    });

                    const result = await response.json();

                    if (result.success && result.certificado) {
                        this.showSuccess(result.certificado);
                    } else {
                        this.showError(result.message || 'Código de validación no válido');
                    }
                } catch (error) {
                    console.error('Error validating certificate:', error);
                    this.showError('Error al validar el certificado. Por favor intente nuevamente.');
                } finally {
                    this.showLoading(false);
                }
            }

            showLoading(show) {
                const btn = document.getElementById('validateBtn');
                if (show) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Validando...';
                } else {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-search mr-2"></i>Validar Certificado';
                }
            }

            showSuccess(certificado) {
                document.getElementById('resultArea').classList.remove('hidden');
                document.getElementById('successResult').classList.remove('hidden');
                document.getElementById('errorResult').classList.add('hidden');

                // Cargar detalles del certificado
                this.loadCertificateDetails(certificado);

                // Scroll to results
                document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
            }

            showError(message) {
                document.getElementById('resultArea').classList.remove('hidden');
                document.getElementById('errorResult').classList.remove('hidden');
                document.getElementById('successResult').classList.add('hidden');
                document.getElementById('errorMessage').textContent = message;

                // Scroll to results
                document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
            }

            loadCertificateDetails(certificado) {
                const detailsContainer = document.getElementById('certificateDetails');
                
                const details = `
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Número:</span>
                            <span class="text-gray-800">${certificado.numero_certificado || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Tipo:</span>
                            <span class="text-gray-800 uppercase">${certificado.tipo || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Cliente:</span>
                            <span class="text-gray-800">${certificado.cliente_nombre || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Fecha:</span>
                            <span class="text-gray-800">${this.formatDate(certificado.fecha_mantenimiento)}</span>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Instalación:</span>
                            <span class="text-gray-800">${certificado.instalacion_direccion || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Técnico:</span>
                            <span class="text-gray-800">${certificado.tecnico_nombre || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Estado:</span>
                            <span class="text-green-600 font-semibold">VÁLIDO</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-semibold text-gray-600">Código:</span>
                            <span class="text-gray-800 font-mono">${certificado.codigo_validacion}</span>
                        </div>
                    </div>
                `;
                
                detailsContainer.innerHTML = details;

                // Setup download button
                const downloadBtn = document.getElementById('downloadPdfBtn');
                downloadBtn.onclick = () => this.downloadCertificate(certificado);
            }

            async downloadCertificate(certificado) {
                try {
                    // Intentar descargar PDF existente primero
                    const pdfResponse = await fetch(`${this.apiUrl}/api/certificados/${certificado.id}/pdf`);
                    
                    if (pdfResponse.ok) {
                        const blob = await pdfResponse.blob();
                        this.downloadBlob(blob, `${certificado.numero_certificado}.pdf`);
                    } else {
                        // Si no existe PDF, mostrar mensaje
                        alert('No se encontró el archivo PDF para este certificado. Contacte al administrador.');
                    }
                } catch (error) {
                    console.error('Error downloading certificate:', error);
                    alert('Error al descargar el certificado. Por favor intente nuevamente.');
                }
            }

            downloadBlob(blob, filename) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            formatDate(dateString) {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        // Inicializar validador cuando se carga la página
        document.addEventListener('DOMContentLoaded', () => {
            new CertificateValidator();
        });
    </script>
</body>
</html>

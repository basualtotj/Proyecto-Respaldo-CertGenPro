// Plantillas para diferentes tipos de documentos
const documentTemplates = {
    certificate: {
        title: 'CERTIFICADO DE PARTICIPACIÓN',
        content: `
            <div class="doc-title">{title}</div>
            <div class="doc-content">
                <p>Se certifica que</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>ha participado satisfactoriamente en</p>
                <p><strong>{course}</strong></p>
                <p class="duration-text">con una duración de <strong>{duration}</strong></p>
                <div class="doc-details"><p>{description}</p></div>
                <p class="grade-text">Obteniendo una calificación de: <strong>{grade}</strong></p>
                <div class="doc-signature">
                    <p><strong>{instructor}</strong></p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">{date}</div>
            </div>
        `
    },
    
    report: {
        title: 'INFORME',
        content: `
            <div class="doc-title">{title}</div>
            <div class="doc-content">
                <p><strong>Destinatario:</strong> {recipientName}</p>
                <p><strong>Organización:</strong> {organization}</p>
                <p class="course-text"><strong>Proyecto/Actividad:</strong> {course}</p>
                <p class="duration-text"><strong>Período:</strong> {duration}</p>
                <div class="doc-details"><h4>Detalles:</h4><p>{description}</p></div>
                <p class="grade-text"><strong>Evaluación/Resultado:</strong> {grade}</p>
                <div class="doc-signature">
                    <p><strong>{instructor}</strong></p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">{date}</div>
            </div>
        `
    },
    
    diploma: {
        title: 'DIPLOMA',
        content: `
            <div class="doc-title">{title}</div>
            <div class="doc-content">
                <p>La <strong>{organization}</strong></p>
                <p>otorga el presente diploma a</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>en reconocimiento a su exitosa culminación de</p>
                <p><strong>{course}</strong></p>
                <p class="duration-text">Duración: <strong>{duration}</strong></p>
                <div class="doc-details"><p>{description}</p></div>
                <p class="grade-text">Calificación final: <strong>{grade}</strong></p>
                <div class="doc-signature">
                    <p><strong>{instructor}</strong></p>
                    <p>Autoridad Certificadora</p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">{date}</div>
            </div>
        `
    },
    
    award: {
        title: 'PREMIO Y RECONOCIMIENTO',
        content: `
            <div class="doc-title">{title}</div>
            <div class="doc-content">
                <p>🏆</p>
                <p>Se otorga el presente reconocimiento a</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>por su destacada participación en</p>
                <p><strong>{course}</strong></p>
                <div class="doc-details"><p>{description}</p></div>
                <p class="grade-text">Distinción obtenida: <strong>{grade}</strong></p>
                <p class="duration-text">Período: <strong>{duration}</strong></p>
                <div class="doc-signature">
                    <p><strong>{instructor}</strong></p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">{date}</div>
            </div>
        `
    },
    
    // Plantillas específicas para cuando se selecciona template="drone"
    certificate_drone: {
        title: 'CERTIFICACIÓN DE PILOTO DE DRONES',
        content: `
            <div class="doc-title">🚁 {title}</div>
            <div class="doc-content">
                <p>✈️ AERONAUTICAL CERTIFICATION ✈️</p>
                <p>Se certifica que</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>ha completado exitosamente el programa de</p>
                <p><strong>{course || 'Certificación de Piloto de Drones'}</strong></p>
                {duration ? '<p>📅 Duración del programa: <strong>' + duration + '</strong></p>' : ''}
                {description ? '<div class="doc-details"><p>🎯 ' + description + '</p></div>' : ''}
                {grade ? '<p>🏅 Calificación obtenida: <strong>' + grade + '</strong></p>' : ''}
                <p>🛡️ Cumpliendo con todas las regulaciones de aviación civil</p>
                <div class="doc-signature">
                    <p><strong>🧑‍✈️ {instructor || 'Instructor Certificado'}</strong></p>
                    <p>📋 Licencia de Vuelo Autorizada</p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">📅 {date}</div>
                <p style="font-size: 0.9rem; margin-top: 1rem;">🔒 Certificación válida según normativas UAV vigentes</p>
            </div>
        `
    },
    
    report_drone: {
        title: 'INFORME DE VUELO DE DRONES',
        content: `
            <div class="doc-title">🚁 {title}</div>
            <div class="doc-content">
                <p><strong>👨‍✈️ Piloto:</strong> {recipientName}</p>
                <p><strong>🏢 Organización:</strong> {organization}</p>
                {course ? '<p><strong>🎯 Misión/Operación:</strong> ' + course + '</p>' : ''}
                {duration ? '<p><strong>⏱️ Tiempo de vuelo:</strong> ' + duration + '</p>' : ''}
                {description ? '<div class="doc-details"><h4>📋 Detalles del vuelo:</h4><p>' + description + '</p></div>' : ''}
                {grade ? '<p><strong>✅ Estado de la misión:</strong> ' + grade + '</p>' : ''}
                <p>🛰️ Condiciones meteorológicas: Aptas para vuelo</p>
                <p>📡 Sistemas de navegación: GPS activo</p>
                <div class="doc-signature">
                    <p><strong>🧑‍✈️ {instructor || 'Controlador de Vuelo'}</strong></p>
                    <p>📋 Supervisor de Operaciones UAV</p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">📅 {date}</div>
            </div>
        `
    },
    
    diploma_drone: {
        title: 'DIPLOMA DE ESPECIALIZACIÓN EN DRONES',
        content: `
            <div class="doc-title">🚁 {title}</div>
            <div class="doc-content">
                <p>La <strong>{organization}</strong></p>
                <p>🎓 Otorga el presente diploma a</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>en reconocimiento a su graduación exitosa en</p>
                <p><strong>{course || 'Tecnología y Operación de Drones'}</strong></p>
                {duration ? '<p>📚 Programa académico: <strong>' + duration + '</strong></p>' : ''}
                {description ? '<div class="doc-details"><p>🎯 ' + description + '</p></div>' : ''}
                {grade ? '<p>🏅 Calificación final: <strong>' + grade + '</strong></p>' : ''}
                <p>✈️ Especialización en sistemas aéreos no tripulados</p>
                <p>🛡️ Certificado para operaciones comerciales</p>
                <div class="doc-signature">
                    <p><strong>🧑‍🎓 {instructor || 'Director Académico'}</strong></p>
                    <p>📋 Escuela de Aviación</p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">📅 {date}</div>
            </div>
        `
    },
    
    award_drone: {
        title: 'PREMIO DE EXCELENCIA EN DRONES',
        content: `
            <div class="doc-title">🚁 {title}</div>
            <div class="doc-content">
                <p>🏆 DRONE EXCELLENCE AWARD 🏆</p>
                <p>Se otorga el presente reconocimiento a</p>
                <div class="doc-recipient">{recipientName}</div>
                <p>por su destacado desempeño en</p>
                <p><strong>{course || 'Competencia de Drones'}</strong></p>
                {description ? '<div class="doc-details"><p>🎯 ' + description + '</p></div>' : ''}
                {grade ? '<p>🥇 Posición obtenida: <strong>' + grade + '</strong></p>' : ''}
                {duration ? '<p>⏱️ Evento: <strong>' + duration + '</strong></p>' : ''}
                <p>✈️ Demostración excepcional de habilidades de vuelo</p>
                <p>🎮 Excelencia técnica en maniobras aéreas</p>
                <div class="doc-signature">
                    <p><strong>🧑‍⚖️ {instructor || 'Jurado de Competencia'}</strong></p>
                    <p>📋 Comité de Evaluación UAV</p>
                    <p>{organization}</p>
                </div>
                <div class="doc-date">📅 {date}</div>
            </div>
        `
    }
};

// Estilos para cada plantilla
const templateStyles = {
    classic: {
        backgroundColor: '#ffffff',
        border: '8px solid',
        borderImage: 'linear-gradient(45deg, #2563eb, #10b981) 1',
        fontFamily: 'Georgia, serif'
    },
    
    modern: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    },
    
    elegant: {
        backgroundColor: '#1f2937',
        color: '#f9fafb',
        borderTop: '6px solid #10b981',
        fontFamily: 'Times New Roman, serif'
    },
    
    corporate: {
        backgroundColor: '#ffffff',
        borderLeft: '12px solid #2563eb',
        fontFamily: 'Helvetica, Arial, sans-serif'
    },
    
    drone: {
        background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: '#f1f5f9',
        border: '3px solid #06b6d4',
        fontFamily: 'Arial, sans-serif',
        position: 'relative'
    }
};

// Función para generar el contenido del documento
function generateDocumentContent(formData, documentType) {
    // Si se selecciona plantilla drone, usar plantillas específicas
    const templateKey = formData.template === 'drone' ? `${documentType}_drone` : documentType;
    const template = documentTemplates[templateKey] || documentTemplates[documentType];
    
    if (!template) return '';
    
    let content = template.content;
    
    // Reemplazar todos los placeholders con los datos del formulario
    content = content.replace(/{recipientName}/g, formData.recipientName || '');
    content = content.replace(/{organization}/g, formData.organization || '');
    content = content.replace(/{title}/g, formData.title || '');
    content = content.replace(/{course}/g, formData.course || '');
    content = content.replace(/{duration}/g, formData.duration || '');
    content = content.replace(/{instructor}/g, formData.instructor || 'Director Académico');
    content = content.replace(/{grade}/g, formData.grade || '');
    content = content.replace(/{description}/g, formData.description || '');
    
    // Formatear fecha
    if (formData.date) {
        const dateObj = new Date(formData.date);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        content = content.replace(/{date}/g, formattedDate);
    }
    
    // Crear elemento temporal para procesar
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Ocultar elementos vacíos usando CSS
    if (!formData.duration) {
        const durationElements = tempDiv.querySelectorAll('.duration-text');
        durationElements.forEach(el => el.style.display = 'none');
    }
    
    if (!formData.description) {
        const descElements = tempDiv.querySelectorAll('.doc-details');
        descElements.forEach(el => el.style.display = 'none');
    }
    
    if (!formData.grade) {
        const gradeElements = tempDiv.querySelectorAll('.grade-text');
        gradeElements.forEach(el => el.style.display = 'none');
    }
    
    if (!formData.course) {
        const courseElements = tempDiv.querySelectorAll('.course-text');
        courseElements.forEach(el => el.style.display = 'none');
    }
    
    return tempDiv.innerHTML;
}

// Función para aplicar estilos de plantilla
function applyTemplateStyles(element, templateName, customColor) {
    const styles = templateStyles[templateName];
    if (!styles) return;
    
    // Aplicar estilos base
    Object.keys(styles).forEach(property => {
        element.style[property] = styles[property];
    });
    
    // Aplicar color personalizado
    if (customColor) {
        switch (templateName) {
            case 'classic':
                element.style.borderColor = customColor;
                break;
            case 'modern':
                element.style.background = `linear-gradient(135deg, ${customColor} 0%, #764ba2 100%)`;
                break;
            case 'elegant':
                element.style.borderTopColor = customColor;
                break;
            case 'corporate':
                element.style.borderLeftColor = customColor;
                break;
            case 'drone':
                element.style.borderColor = customColor;
                // También actualizar el color del patrón de animación
                const style = document.createElement('style');
                style.textContent = `
                    .template-drone::before {
                        background: repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            ${customColor}15 10px,
                            ${customColor}15 20px
                        );
                    }
                    .template-drone .doc-title {
                        color: ${customColor};
                        text-shadow: 0 0 10px ${customColor}80;
                    }
                `;
                document.head.appendChild(style);
                break;
        }
        
        // Aplicar color a elementos específicos
        const recipientElements = element.querySelectorAll('.doc-recipient');
        recipientElements.forEach(el => {
            if (templateName !== 'modern' && templateName !== 'elegant') {
                el.style.color = customColor;
            }
        });
    }
}

// Exportar funciones para uso global
window.DocumentTemplates = {
    templates: documentTemplates,
    styles: templateStyles,
    generateContent: generateDocumentContent,
    applyStyles: applyTemplateStyles
};

/**
 * Generar contenido PDF para CCTV - VERSIÓN NUEVA SIN POSITION ABSOLUTE
 */
generateCCTVPDFContent_NEW(formData, info) {
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
        <div style="font-family: Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #111827;">
        
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
                    <span style="font-size: 18px; color: #1e40af;">${codigo}</span>
                </div>
            </div>
        </div>

        <!-- Información del Cliente -->
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

        <!-- Equipos Instalados -->
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

        <!-- Verificación Realizada -->
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

        <!-- Solicitudes del Cliente -->
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

        <!-- Observaciones -->
        ${formData.observaciones ? `
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding: 10px 0 10px 20px; background: linear-gradient(90deg, #eff6ff, transparent); border-left: 4px solid #1e40af;">
                OBSERVACIONES Y RECOMENDACIONES
            </h3>
            <div style="font-size: 14px; line-height: 1.6; background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 20px; border: 1px solid #e2e8f0;">
                ${formData.observaciones.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        <!-- FIRMAS - SIN POSITION ABSOLUTE -->
        <div style="margin: 40px 60px 20px 60px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
                <div style="text-align: center;">
                    <div style="height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border: 1px dashed #d1d5db;">
                        ${formData.firmas.tecnico ? `<img src="${formData.firmas.tecnico}" style="max-height: 90px; max-width: 200px; object-fit: contain;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                    </div>
                    <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                        <strong>Técnico Responsable</strong><br>
                        <span style="font-size: 12px;">${info.tecnico.nombre || 'N/A'}</span>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border: 1px dashed #d1d5db;">
                        ${formData.firmas.cliente ? `<img src="${formData.firmas.cliente}" style="max-height: 90px; max-width: 200px; object-fit: contain;" />` : '<div style="color: #9ca3af;">Sin firma</div>'}
                    </div>
                    <div style="border-top: 2px solid #374151; padding-top: 8px; font-size: 14px;">
                        <strong>Representante Empresa</strong><br>
                        <span style="font-size: 12px;">${this.empresa?.nombre_representante || 'Representante'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- FOOTER - SIN POSITION ABSOLUTE -->
        <div style="margin: 20px 40px; text-align: center; font-size: 12px; color: #374151; border-top: 2px solid #e5e7eb; padding-top: 15px;">
            <div style="margin-bottom: 8px;">
                <strong>Código de Validación:</strong> ${codigo} | 
                <strong>Generado el:</strong> ${new Date().toLocaleDateString('es-ES')}
            </div>
            <div style="font-size: 11px; color: #1f2937; line-height: 1.3;">
                🏢 Redes y CCTV &nbsp;•&nbsp; 📍 María Eugenia López 9726, Antofagasta &nbsp;•&nbsp; 🌐 www.redesycctv.cl &nbsp;•&nbsp; ☎ +56 9 630 671 69
            </div>
        </div>
        
        </div>
    `;
}

/**
 * HardwarePdfGenerator
 * Genera un PDF vectorial para certificados de mantenimiento de Hardware Computacional
 * Basado en CCTVPdfGenerator con adaptaciones específicas para hardware
 */
(function () {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    console.error('jsPDF no está disponible en window.jspdf');
    return;
  }

  class HardwarePdfGenerator {
    constructor() {
      this.unit = 'mm';
      this.format = 'a4';
      this.orientation = 'portrait';
      this.pdfWidth = 210;
      this.pdfHeight = 297;
      this.margin = 15;
      this.colors = {
        green: [34, 197, 94], // #22c55e
        greenLight: [220, 252, 231], // #dcfce7
        grayDark: [55, 65, 81],
        grayMid: [100, 116, 139],
        grayLight: [226, 232, 240],
        almostBlack: [31, 41, 55]
      };
    }

    /**
     * Generar PDF completo para Hardware Computacional
     */
    async generateHardwarePDF(certificateData) {
      try {
        const doc = new jsPDF(this.orientation, this.unit, this.format);
        
        // Página principal con datos del certificado
        await this.addMainPage(doc, certificateData);
        
        // Páginas adicionales de evidencias si existen
        if (certificateData.evidencias && certificateData.evidencias.length > 0) {
          await this.addEvidencePages(doc, certificateData);
        }
        
        return doc;
      } catch (error) {
        console.error('Error generando PDF de Hardware:', error);
        throw error;
      }
    }

    /**
     * Página principal del certificado
     */
    async addMainPage(doc, data) {
      // Header con logo y título
      await this.addHeader(doc, data);
      
      // Información del cliente e instalación
      this.addClientInfo(doc, data);
      
      // Equipos instalados (específico para Hardware)
      this.addHardwareEquipment(doc, data);
      
      // Checklist de verificación
      this.addHardwareChecklist(doc, data);
      
      // Observaciones
      this.addObservations(doc, data);
      
      // Firmas
      this.addSignatures(doc, data);
      
      // Footer
      this.addFooter(doc, data);
    }

    /**
     * Header del documento
     */
    async addHeader(doc, data) {
      let yPos = this.margin;
      
      // Logo empresa (si existe)
      if (data.empresa?.logo) {
        try {
          doc.addImage(data.empresa.logo, 'PNG', this.margin, yPos, 25, 15);
        } catch (error) {
          console.warn('Error agregando logo:', error);
        }
      }
      
      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO DE MANTENIMIENTO', this.pdfWidth / 2, yPos + 10, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.setTextColor(...this.colors.green);
      doc.text('HARDWARE COMPUTACIONAL', this.pdfWidth / 2, yPos + 18, { align: 'center' });
      
      // Línea separadora
      doc.setDrawColor(...this.colors.green);
      doc.setLineWidth(1);
      doc.line(this.margin, yPos + 25, this.pdfWidth - this.margin, yPos + 25);
      
      return yPos + 35;
    }

    /**
     * Información del cliente
     */
    addClientInfo(doc, data) {
      let yPos = 60;
      
      // Título sección
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CLIENTE', this.margin, yPos);
      yPos += 8;
      
      // Datos del cliente
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.colors.grayDark);
      
      const clienteInfo = [
        `Cliente: ${data.cliente?.nombre || 'No especificado'}`,
        `RUT: ${data.cliente?.rut || 'No especificado'}`,
        `Dirección: ${data.instalacion?.direccion || 'No especificada'}`,
        `Fecha: ${data.fecha || new Date().toLocaleDateString('es-CL')}`,
        `Técnico: ${data.tecnico?.nombre || 'No especificado'}`,
        `Código: ${data.codigoValidacion || 'No generado'}`
      ];
      
      clienteInfo.forEach(info => {
        doc.text(info, this.margin, yPos);
        yPos += 5;
      });
      
      return yPos + 5;
    }

    /**
     * Equipos de hardware instalados
     */
    addHardwareEquipment(doc, data) {
      let yPos = 105;
      
      // Título sección
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPOS INSTALADOS', this.margin, yPos);
      yPos += 10;
      
      // Datos de equipos
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.colors.grayDark);
      
      const equipos = [
        `PCs Escritorio: ${data.hardwarePCs || 0}`,
        `Notebooks: ${data.hardwareNotebooks || 0}`,
        `Servidores: ${data.hardwareServidores || 0}`,
        `UPS / Respaldo eléctrico: ${data.hardwareUPS || 0}`,
        `Área o dependencia: ${data.hardwareArea || 'No especificada'}`
      ];
      
      equipos.forEach(equipo => {
        doc.text(equipo, this.margin + 5, yPos);
        yPos += 5;
      });
      
      return yPos + 5;
    }

    /**
     * Checklist de verificación para hardware
     */
    addHardwareChecklist(doc, data) {
      let yPos = 150;
      
      // Título sección
      doc.setFontSize(14);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFICACIÓN REALIZADA', this.margin, yPos);
      yPos += 10;
      
      // Items del checklist
      const checklistItems = [
        'Limpieza interna general',
        'Revisión física de componentes',
        'Sustitución de pasta térmica en CPU/GPU',
        'Revisión de ventiladores en funcionamiento',
        'Revisión de fuentes de poder',
        'Revisión de fijaciones, soportes y bandejas',
        'Limpieza externa',
        'Revisión de UPS',
        'Comprobación de funcionamiento general'
      ];
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.colors.grayDark);
      
      checklistItems.forEach(item => {
        const isChecked = data.hardwareCheck && data.hardwareCheck.includes(item.toLowerCase().replace(/\s+/g, '_'));
        
        // Checkbox
        doc.setDrawColor(...this.colors.green);
        if (isChecked) {
          doc.setFillColor(...this.colors.green);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(this.margin + 2, yPos - 2, 3, 3, isChecked ? 'F' : 'S');
        
        // Checkmark si está marcado
        if (isChecked) {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('✓', this.margin + 3.5, yPos + 1, { align: 'center' });
        }
        
        // Texto del item
        doc.setTextColor(...this.colors.grayDark);
        doc.setFont('helvetica', 'normal');
        doc.text(item, this.margin + 8, yPos);
        yPos += 6;
      });
      
      return yPos + 5;
    }

    /**
     * Observaciones
     */
    addObservations(doc, data) {
      let yPos = 230;
      
      doc.setFontSize(12);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES:', this.margin, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.colors.grayDark);
      
      const observaciones = data.solicitudesCliente || 'Sin observaciones especiales.';
      const lines = doc.splitTextToSize(observaciones, this.pdfWidth - (this.margin * 2));
      doc.text(lines, this.margin, yPos);
      
      return yPos + (lines.length * 4) + 5;
    }

    /**
     * Firmas del técnico y cliente
     */
    addSignatures(doc, data) {
      const yPos = 250;
      const signatureWidth = 60;
      const signatureHeight = 20;
      
      // Firma técnico
      doc.setDrawColor(...this.colors.grayLight);
      doc.line(this.margin, yPos, this.margin + signatureWidth, yPos);
      doc.setFontSize(9);
      doc.setTextColor(...this.colors.grayDark);
      doc.text('Firma Técnico', this.margin, yPos + 5);
      doc.text(data.tecnico?.nombre || '', this.margin, yPos + 9);
      
      // Firma cliente
      const clienteX = this.pdfWidth - this.margin - signatureWidth;
      doc.line(clienteX, yPos, clienteX + signatureWidth, yPos);
      doc.text('Firma Cliente', clienteX, yPos + 5);
      doc.text(data.cliente?.contacto || '', clienteX, yPos + 9);
    }

    /**
     * Footer del documento
     */
    addFooter(doc, data) {
      const yPos = this.pdfHeight - 20;
      
      doc.setDrawColor(...this.colors.grayLight);
      doc.line(this.margin, yPos, this.pdfWidth - this.margin, yPos);
      
      doc.setFontSize(8);
      doc.setTextColor(...this.colors.grayMid);
      doc.text('Certificado generado por CertGen Pro', this.pdfWidth / 2, yPos + 5, { align: 'center' });
      doc.text(`Código de validación: ${data.codigoValidacion || 'No generado'}`, this.pdfWidth / 2, yPos + 10, { align: 'center' });
    }

    /**
     * Páginas de evidencias fotográficas
     */
    async addEvidencePages(doc, data) {
      if (!data.evidencias || data.evidencias.length === 0) return;
      
      const evidencesPerPage = 9; // 3x3 grid
      const pages = Math.ceil(data.evidencias.length / evidencesPerPage);
      
      for (let page = 0; page < pages; page++) {
        doc.addPage();
        
        // Header simplificado
        await this.addSimpleHeader(doc, `Evidencias Fotográficas - Página ${page + 1}`);
        
        // Grid de evidencias
        const startIndex = page * evidencesPerPage;
        const endIndex = Math.min(startIndex + evidencesPerPage, data.evidencias.length);
        const pageEvidences = data.evidencias.slice(startIndex, endIndex);
        
        await this.addEvidenceGrid(doc, pageEvidences);
        
        // Footer
        this.addFooter(doc, data);
      }
    }

    /**
     * Header simplificado para páginas de evidencias
     */
    async addSimpleHeader(doc, title) {
      doc.setFontSize(16);
      doc.setTextColor(...this.colors.almostBlack);
      doc.setFont('helvetica', 'bold');
      doc.text(title, this.pdfWidth / 2, this.margin + 10, { align: 'center' });
      
      doc.setDrawColor(...this.colors.green);
      doc.setLineWidth(0.5);
      doc.line(this.margin, this.margin + 15, this.pdfWidth - this.margin, this.margin + 15);
    }

    /**
     * Grid 3x3 de evidencias
     */
    async addEvidenceGrid(doc, evidences) {
      const gridCols = 3;
      const gridRows = 3;
      const imageSize = 50; // mm
      const spacing = 10; // mm
      
      const startX = (this.pdfWidth - (gridCols * imageSize + (gridCols - 1) * spacing)) / 2;
      const startY = 50;
      
      for (let i = 0; i < evidences.length && i < 9; i++) {
        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        
        const x = startX + col * (imageSize + spacing);
        const y = startY + row * (imageSize + spacing);
        
        try {
          // Añadir imagen
          doc.addImage(evidences[i].dataUrl, 'JPEG', x, y, imageSize, imageSize);
          
          // Descripción
          doc.setFontSize(8);
          doc.setTextColor(...this.colors.grayDark);
          doc.text(evidences[i].descripcion || `Evidencia ${i + 1}`, x + imageSize/2, y + imageSize + 4, { align: 'center' });
        } catch (error) {
          console.warn(`Error agregando evidencia ${i + 1}:`, error);
        }
      }
    }
  }

  // Exponer la clase globalmente
  window.HardwarePdfGenerator = HardwarePdfGenerator;
})();

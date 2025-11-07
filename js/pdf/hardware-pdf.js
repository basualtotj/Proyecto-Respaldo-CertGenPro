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
        blue: [67, 105, 231],
        blueLight: [229, 242, 255],
        grayDark: [55, 65, 81],
        grayMid: [100, 116, 139],
        grayLight: [226, 232, 240],
        almostBlack: [31, 41, 55]
      };
    }

    // Gradiente horizontal por franjas (similar CCTV)
    _drawHorizontalGradient(doc, x, y, w, h, fromRGB, toRGB, steps = 48) {
      const stepW = w / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(fromRGB[0] + (toRGB[0] - fromRGB[0]) * t);
        const g = Math.round(fromRGB[1] + (toRGB[1] - fromRGB[1]) * t);
        const b = Math.round(fromRGB[2] + (toRGB[2] - fromRGB[2]) * t);
        doc.setFillColor(r, g, b);
        doc.rect(x + i * stepW, y, stepW + 0.2, h, 'F');
      }
    }

    // Formatea fecha larga en español: 6 de noviembre de 2025
    _formatLongDate(input) {
      if (!input) {
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      }
      let d = new Date(input);
      if (isNaN(d)) {
        // intentar formato YYYY-MM-DD
        const m = String(input).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (m) {
          d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        }
      }
      if (isNaN(d)) d = new Date();
      return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
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
  const headerBottom = await this.addHeader(doc, data);
  let y = headerBottom + 2;

  // Información del cliente e instalación
  y = this.addClientInfo(doc, data, y);
      
  // Equipos instalados (específico para Hardware)
  y = this.addHardwareEquipment(doc, data, y + 2);
      
  // Checklist de verificación
  y = this.addHardwareChecklist(doc, data, y + 2);
      
  // Solicitudes del cliente
  y = this.addClientRequests(doc, data, y + 2);

      // Observaciones
      y = this.addObservations(doc, data, y + 2);

      // Firmas SIEMPRE en la primera hoja
  // Firmas siempre en la primera hoja (no mover contenido a otra página)
  doc.setPage(1);
  await this.addSignatures(doc, data);
  // Footer en la primera hoja
  this.addFooter(doc, data);
    }

    /**
     * Header del documento
     */
    async addHeader(doc, data) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
      const yPos = M - 2;

      // Logo (si disponible)
      const logo = data.empresa?.logo_empresa || data.empresa?.logo || null;
      if (logo) {
        try {
          const fmt = (typeof logo === 'string' && logo.startsWith('data:image')) ? (logo.includes('png') ? 'PNG' : 'JPEG') : 'PNG';
          doc.addImage(logo, fmt, M, yPos, 15, 12, undefined, 'FAST');
        } catch {}
      }

      // Título y subtítulo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 59);
      doc.text('CERTIFICADO DE MANTENIMIENTO', W / 2, M + 6, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(75, 85, 99);
      doc.text('SISTEMA HARDWARE COMPUTACIONAL', W / 2, M + 11.5, { align: 'center' });

      // Regla sutil
      doc.setDrawColor(...C.grayLight);
      doc.line(M, M + 15, W - M, M + 15);

      // Meta: Fecha y Certificado N°
      const metaY = M + 21;
  const fechaText = this._formatLongDate(data.fecha);
      doc.setFontSize(9);
      const leftLabel = 'Fecha Mantenimiento:';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.almostBlack);
      const leftW = doc.getTextWidth(leftLabel);
      doc.text(leftLabel, M, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(fechaText, M + leftW + 2, metaY);
      const rightLabel = 'Certificado N°:';
      doc.setFont('helvetica', 'bold');
      const rlW = doc.getTextWidth(rightLabel);
      doc.setFont('helvetica', 'normal');
      const rvW = doc.getTextWidth(data.numeroCertificado || '-');
      const total = rlW + 3 + rvW;
      const start = W - M - total;
      doc.setFont('helvetica', 'bold');
      doc.text(rightLabel, start, metaY);
      doc.setFont('helvetica', 'normal');
      doc.text(data.numeroCertificado || '-', start + rlW + 3, metaY);

      // Separador sección
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, metaY + 6, W - M, metaY + 6);

      return M + 38;
    }

    /**
     * Información del cliente
     */
    addClientInfo(doc, data, startY) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
      let y = Math.max(startY || (M + 38), M + 38);

      // Título con barra + gradiente
      const barH = 8;
      const barW = 1.1;
      const gradX = M + barW;
      const gradW = (W - M) - gradX;
      const gradY = y - (barH - 3);
      const gradH = barH;
      this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
      doc.setFillColor(...C.blue);
      doc.rect(M, y - (barH - 3), barW, barH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('INFORMACIÓN DEL CLIENTE', M + 5, y);
      y += 5.2;
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 7.5;

      // Misma lógica flexible que CCTV (3 columnas x 2 filas)
      const drawFlexRow = (items, widths, adaptive = false) => {
        const gap = 4.5;
        const innerW = W - M * 2;
        const usableW = innerW - gap * (items.length - 1);
        const xPositions = [];
        let accX = M;
        let wLocal = widths.slice();
        for (let i = 0; i < items.length; i++) {
          xPositions.push(accX);
          accX += wLocal[i] * usableW + gap;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        const lineH = 3.9;
        const computeWrapped = (wArr) => items.map((it, i) => {
          const labelText = `${it.label}: `;
          doc.setFont('helvetica', 'bold');
          const labelW = doc.getTextWidth(labelText);
          doc.setFont('helvetica', 'normal');
          const colW = wArr[i] * usableW;
          const valueMaxW = Math.max(10, colW - labelW - 2);
          const text = String((it.value === undefined || it.value === null) ? '-' : it.value);
          const wrappedVal = doc.splitTextToSize(text, valueMaxW);
          return { labelText, labelW, wrappedVal, colW };
        });
        let wrapped = computeWrapped(wLocal);
        if (adaptive && items.length === 3) {
          const minW = [0.28, 0.28, 0.36];
          const maxW = [0.46, 0.36, 0.56];
          let tries = 8;
          while (tries-- > 0) {
            const lines = wrapped.map(w => Math.max(1, w.wrappedVal.length));
            const needs0 = lines[0] > 1;
            const needs2 = lines[2] > 1;
            if (!needs0 && !needs2) break;
            if (needs0 && wLocal[0] < maxW[0]) {
              const takeFrom2 = lines[2] === 1 && wLocal[2] > minW[2] ? 0.015 : 0.006;
              const takeFrom1 = lines[1] === 1 && wLocal[1] > (minW[1] + 0.02) ? 0.004 : 0.002;
              const give = takeFrom1 + takeFrom2;
              wLocal[0] = Math.min(maxW[0], wLocal[0] + give);
              wLocal[1] = Math.max(minW[1], wLocal[1] - takeFrom1);
              wLocal[2] = Math.max(minW[2], wLocal[2] - takeFrom2);
            }
            if (needs2 && wLocal[2] < maxW[2]) {
              const takeFrom0 = lines[0] === 1 && wLocal[0] > minW[0] ? 0.012 : 0.006;
              const takeFrom1b = lines[1] === 1 && wLocal[1] > (minW[1] + 0.02) ? 0.004 : 0.002;
              const give2 = takeFrom0 + takeFrom1b;
              wLocal[2] = Math.min(maxW[2], wLocal[2] + give2);
              wLocal[0] = Math.max(minW[0], wLocal[0] - takeFrom0);
              wLocal[1] = Math.max(minW[1], wLocal[1] - takeFrom1b);
            }
            const sum = wLocal[0] + wLocal[1] + wLocal[2];
            wLocal = wLocal.map(w => w / sum);
            wrapped = computeWrapped(wLocal);
          }
          // Recalcular posiciones
          xPositions.length = 0; accX = M;
          for (let i = 0; i < items.length; i++) { xPositions.push(accX); accX += wLocal[i] * usableW + gap; }
        }
        const maxLines = Math.max(...wrapped.map(w => Math.max(1, w.wrappedVal.length)));
        items.forEach((it, i) => {
          const x = xPositions[i];
          const w = wrapped[i];
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(17, 24, 39);
          doc.text(w.labelText, x, y);
          doc.setTextColor(...C.almostBlack);
          doc.setFont('helvetica', 'normal');
          const firstVal = w.wrappedVal[0] || '-';
          const labelPad = 1.6;
          doc.text(firstVal, x + w.labelW + labelPad, y);
          for (let li = 1; li < w.wrappedVal.length; li++) {
            doc.text(w.wrappedVal[li], x, y + li * lineH);
          }
        });
        y += maxLines * lineH + 1.2;
        return wLocal;
      };

      // Fila 1 y 2 con mismos campos que CCTV
      const wAligned = drawFlexRow([
        { label: 'Cliente', value: data.cliente?.nombre },
        { label: 'RUT', value: data.cliente?.rut },
        { label: 'Dirección', value: data.instalacion?.direccion }
      ], [0.30, 0.30, 0.40], true);
      drawFlexRow([
        { label: 'Contacto', value: data.cliente?.contacto },
        { label: 'Email', value: data.cliente?.email },
        { label: 'Técnico', value: data.tecnico?.nombre }
      ], wAligned);
  y += 1.2; // reducir un poco más el espacio antes de "Equipos instalados"

      return y;
    }

    /**
     * Equipos de hardware instalados
     */
    addHardwareEquipment(doc, data, startY) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
  // Usar el startY entregado para evitar espacio vertical excesivo entre secciones
  let y = (startY === undefined || startY === null) ? (M + 85) : startY;

      // Título con barra + gradiente
      const barH = 8;
      const barW = 1.1;
      const gradX = M + barW;
      const gradW = (W - M) - gradX;
      const gradY = y - (barH - 3);
      const gradH = barH;
      this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
      doc.setFillColor(...C.blue);
      doc.rect(M, y - (barH - 3), barW, barH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
  doc.text('EQUIPOS ATENDIDOS', M + 5, y);
      y += 4.4; // título más cerca de las burbujas
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 3.8; // reducir distancia entre título y burbujas
      // Cinco tarjetas en una sola fila con el mismo formato (PCs, Notebooks, Servidores, UPS, Área)
      const gap = 4.0;
      const cols = 5;
      const cardW = (W - M * 2 - gap * (cols - 1)) / cols;
      const cardH = 12;
      const valOrDash = (v) => (v === undefined || v === null || v === '') ? '-' : String(v);
      const cardItems = [
        { label: 'PCs Escritorio:', value: (data.hardwarePCs === undefined || data.hardwarePCs === null) ? 0 : data.hardwarePCs },
        { label: 'Notebooks:', value: (data.hardwareNotebooks === undefined || data.hardwareNotebooks === null) ? 0 : data.hardwareNotebooks },
        { label: 'Servidores:', value: (data.hardwareServidores === undefined || data.hardwareServidores === null) ? 0 : data.hardwareServidores },
        { label: 'UPS:', value: valOrDash(data.hardwareUPS) },
        { label: 'Área:', value: valOrDash(data.hardwareArea) }
      ];
      cardItems.forEach((it, idx) => {
        const cx = M + idx * (cardW + gap);
        const cy = y;
        try { doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252); doc.roundedRect(cx, cy, cardW, cardH, 2.5, 2.5, 'FD'); }
        catch { doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252); doc.rect(cx, cy, cardW, cardH, 'FD'); }
        const labelText = it.label;
        const valueTextRaw = String(it.value);
        const isArea = /Área:/i.test(labelText);
        // Ajustar tipografía del valor de Área al mismo tamaño que la etiqueta
        const labelFontSize = 7.3;
        const valueFontSize = isArea ? 7.3 : 9.3;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(labelFontSize); doc.setTextColor(55,65,81);
        const labelW = doc.getTextWidth(labelText);
        const labelPad = 1.2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(valueFontSize); doc.setTextColor(...C.blue);
        let valueText = valueTextRaw;
        let valueW = doc.getTextWidth(valueText);
        const combinedW = labelW + labelPad + valueW;
        const tyBase = cy + 6.2; // ligeramente más arriba para permitir segunda línea
        if (isArea && combinedW > cardW - 4) {
          // Forzar salto de línea del valor debajo de la etiqueta
          // Reducir ancho disponible para envolver
          const wrapMax = cardW - 6;
          const wrapped = doc.splitTextToSize(valueTextRaw, wrapMax);
          // Dibuja etiqueta centrada en primera línea
          const labelX = cx + (cardW - labelW) / 2;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(labelFontSize); doc.setTextColor(55,65,81);
          doc.text(labelText, labelX, tyBase);
          // Dibuja líneas del valor debajo (máx 2 para mantener altura)
          doc.setFont('helvetica', 'bold'); doc.setFontSize(valueFontSize); doc.setTextColor(...C.blue);
          const shown = wrapped.slice(0,2);
          const lineH = 3.6;
          shown.forEach((ln, i) => {
            const vW = doc.getTextWidth(ln);
            const vx = cx + (cardW - vW) / 2;
            doc.text(ln, vx, tyBase + (i+1) * lineH);
          });
        } else {
          // Mantener en una sola línea centrada (etiqueta + valor)
          const startX = cx + (cardW - combinedW) / 2;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(labelFontSize); doc.setTextColor(55,65,81);
          doc.text(labelText, startX, tyBase + 0.8);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(valueFontSize); doc.setTextColor(...C.blue);
          doc.text(valueText, startX + labelW + labelPad, tyBase + 0.8);
        }
      });
  y += cardH + 6; // más espacio tras las burbujas para separar del checklist

      return y;
    }

    /**
     * Checklist de verificación para hardware
     */
    addHardwareChecklist(doc, data, startY) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
  // Empezar exactamente donde quedó la sección anterior (sin mínimo artificial)
  let y = (startY === undefined || startY === null) ? (M + 135) : startY;

      // Título con barra + gradiente
      const barH = 8;
      const barW = 1.1;
      const gradX = M + barW;
      const gradW = (W - M) - gradX;
      const gradY = y - (barH - 3);
      const gradH = barH;
      this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
      doc.setFillColor(...C.blue);
      doc.rect(M, y - (barH - 3), barW, barH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('VERIFICACIÓN REALIZADA', M + 5, y);
  y += 4.6; // acercar el listado
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
  y += 5.0; // reducir separación antes del checklist

      // Items del checklist (8 ítems, sin UPS) en una sola línea
      const checklistItems = [
        'Limpieza interna',
        'Revisión de componentes',
        'Pasta térmica CPU/GPU',
        'Ventiladores operativos',
        'Fuentes de poder',
        'Fijaciones/soportes/bandejas',
        'Limpieza externa',
        'Prueba de funcionamiento'
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.grayDark);

      // Utilidad: slugify tolerante (minúsculas, sin acentos, no alfanumérico => _)
      const slugify = (t) => t
        .toLowerCase()
        // Quitar acentos: usar rango de marcas combinantes para máxima compatibilidad
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      // Alias para compatibilidad con valores actuales del formulario
      const aliasMap = {
        limpieza_interna: ['limpieza_interna', 'limpieza_interna_general'],
        revision_de_componentes: ['revision_componentes', 'revision_fisica_de_componentes'],
        pasta_termica_cpu_gpu: ['pasta_termica', 'sustitucion_de_pasta_termica_en_cpu_gpu'],
        ventiladores_operativos: ['ventiladores', 'revision_de_ventiladores_en_funcionamiento'],
        fuentes_de_poder: ['fuentes_poder', 'revision_de_fuentes_de_poder'],
        fijaciones_soportes_bandejas: ['fijaciones_soportes', 'revision_de_fijaciones_soportes_y_bandejas'],
        limpieza_externa: ['limpieza_externa'],
        prueba_de_funcionamiento: ['funcionamiento_general', 'comprobacion_de_funcionamiento_general']
      };

      const checks = Array.isArray(data.hardwareCheck) ? data.hardwareCheck : [];

      const drawCheckbox = (x, yy, text, checked) => {
        const box = 3.6;
        const offY = yy - box + 1.3;
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.3);
        doc.rect(x, offY, box, box, 'S');
        if (checked) {
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.4);
          doc.line(x + 0.85, offY + 2.1, x + 1.45, offY + 2.8);
          doc.line(x + 1.45, offY + 2.8, x + 2.6, offY + 1.05);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...C.almostBlack);
        doc.text(text, x + box + 2.0, yy);
      };

      // 4 columnas x 2 filas, una sola línea por ítem (similar CCTV)
      const cols = 4;
      const perCol = 2;
      const gap4 = 10;
      const col4W = (W - M * 2 - gap4 * (cols - 1)) / cols;
      const colXs4 = new Array(cols).fill(0).map((_, i) => M + i * (col4W + gap4));
      const rowH = 5.8;
      const baseFont = 7.2;
      const box = 3.6;
      const maxTextW = (w) => Math.max(10, w - (box + 2.0));
      let maxRowsUsed = 0;
      for (let c = 0; c < cols; c++) {
        const base = c * perCol;
        let used = 0;
        for (let k = 0; k < perCol; k++) {
          const idx = base + k;
          const item = checklistItems[idx];
          if (!item) continue;
          // Resolver alias del ítem
          const key = slugify(item).replace(/_/g, ''); // clave flexible
          const accepted = (() => {
            // mapear al aliasMap por clave conocida
            if (item === 'Limpieza interna') return aliasMap.limpieza_interna;
            if (item === 'Revisión de componentes') return aliasMap.revision_de_componentes;
            if (item === 'Pasta térmica CPU/GPU') return aliasMap.pasta_termica_cpu_gpu;
            if (item === 'Ventiladores operativos') return aliasMap.ventiladores_operativos;
            if (item === 'Fuentes de poder') return aliasMap.fuentes_de_poder;
            if (item === 'Fijaciones/soportes/bandejas') return aliasMap.fijaciones_soportes_bandejas;
            if (item === 'Limpieza externa') return aliasMap.limpieza_externa;
            if (item === 'Prueba de funcionamiento') return aliasMap.prueba_de_funcionamiento;
            return [];
          })();
          const isChecked = checks.some(v => accepted.includes(v));
          // Calcular tamaño de fuente para caber en una línea
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(baseFont);
          let f = baseFont;
          let width = doc.getTextWidth(item);
          const allow = maxTextW(col4W);
          if (width > allow) {
            f = Math.max(6.5, baseFont * (allow / width));
          }
          const x = colXs4[c];
          const yy = y + used * rowH;
          const offY = yy - box + 1.3;
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.3);
          doc.rect(x, offY, box, box, 'S');
          if (isChecked) {
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.4);
            doc.line(x + 0.85, offY + 2.1, x + 1.45, offY + 2.8);
            doc.line(x + 1.45, offY + 2.8, x + 2.6, offY + 1.05);
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(f);
          doc.setTextColor(...C.almostBlack);
          doc.text(item, x + box + 2.0, yy);
          used++;
        }
        maxRowsUsed = Math.max(maxRowsUsed, used);
      }
      y += (maxRowsUsed > 0 ? maxRowsUsed * rowH : 0) + 6;
      return y;
    }

    /**
     * Observaciones
     */
  addObservations(doc, data, startY) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
      // Ubicar exactamente después de la sección previa (sin mínimo artificial)
      let y = (startY === undefined || startY === null) ? (M + 200) : startY;
      // Pre-gap adicional para que el gradiente del título no invada la tarjeta anterior
      y += 8;

      // Título con barra + gradiente
      const barH = 8;
      const barW = 1.1;
      const gradX = M + barW;
      const gradW = (W - M) - gradX;
  const gradY = y - (barH - 3);
      const gradH = barH;
      this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
      doc.setFillColor(...C.blue);
      doc.rect(M, y - (barH - 3), barW, barH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
  doc.text('OBSERVACIONES Y RECOMENDACIONES', M + 5, y);
  y += 3.6; // menos espacio bajo el título
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
  y += 3.6; // acercar la tarjeta

  // Caja con bordes redondeados
  const pad = 4;
  const boxW = W - M * 2;
  const text = data.observaciones || 'Sin observaciones especiales.';
  // Estilo igual a CCTV: tamaño más pequeño, normal, color casi negro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const content = doc.splitTextToSize(text, boxW - pad * 2);
  const boxH = content.length * 3.9 + pad * 2;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M, y + 1, boxW, boxH, 3, 3, 'FD');
  doc.setTextColor(...C.almostBlack);
  doc.text(content, M + pad, y + 1 + pad + 2);
      y += boxH + 18.0; // espacio extra para evitar que el gradiente del título siguiente se monte
      return y;
    }

    /**
     * Solicitudes del cliente (nueva sección)
     */
  addClientRequests(doc, data, startY) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
      // Ubicar exactamente después de la sección previa (sin mínimo artificial)
      let y = (startY === undefined || startY === null) ? (M + 180) : startY;

      // Título con barra + gradiente
      const barH = 8;
      const barW = 1.1;
      const gradX = M + barW;
      const gradW = (W - M) - gradX;
      const gradY = y - (barH - 3);
      const gradH = barH;
      this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
      doc.setFillColor(...C.blue);
      doc.rect(M, y - (barH - 3), barW, barH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
  doc.text('SOLICITUDES DEL CLIENTE', M + 5, y);
  y += 3.6; // menos espacio bajo el título
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
  y += 3.6; // acercar la tarjeta

  // Caja con bordes redondeados
  const pad = 4;
  const boxW = W - M * 2;
  const text = data.solicitudes_cliente || data.solicitudesCliente || 'Sin solicitudes registradas.';
  // Estilo igual a CCTV: más pequeño, normal y color casi negro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const content = doc.splitTextToSize(text, boxW - pad * 2);
  const boxH = content.length * 3.9 + pad * 2;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(M, y + 1, boxW, boxH, 3, 3, 'FD');
  doc.setTextColor(...C.almostBlack);
  doc.text(content, M + pad, y + 1 + pad + 2);
      y += boxH + 3.0;
      return y;
    }

    /**
     * Firmas del técnico y cliente
     */
    async addSignatures(doc, data) {
      const M = this.margin; const W = this.pdfWidth; const H = this.pdfHeight;
      const sigY = H - 68;
      const sigW = (W - M * 2 - 20) / 2;
      const sig1X = M, sig2X = M + sigW + 20;
      const drawSignature = async (x, baseY, title, imgDataUrl, name) => {
        const centerX = x + sigW / 2;
        if (imgDataUrl) {
          try {
            const fmt = imgDataUrl.includes('png') ? 'PNG' : 'JPEG';
            // obtener dimensiones reales para mantener la relación de aspecto
            const dim = await this._imageNaturalSize(imgDataUrl);
            const natW = dim.width || 350;
            const natH = dim.height || 120;
            const maxW = 35, maxH = 12;
            const scale = Math.max(0.01, Math.min(maxW / natW, maxH / natH));
            const imgW = natW * scale, imgH = natH * scale;
            const lineY = baseY + 22;
            const imgX = centerX - imgW / 2; const imgY = lineY - imgH - 2;
            doc.addImage(imgDataUrl, fmt, imgX, imgY, imgW, imgH, undefined, 'FAST');
          } catch {}
        }
        const lineW = sigW * 0.62; const lineX = centerX - lineW / 2; const lineY = baseY + 22;
        doc.setDrawColor(107, 114, 128); doc.setLineWidth(0.4); doc.line(lineX, lineY, lineX + lineW, lineY);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(17, 24, 39); doc.text(title, centerX, lineY + 5, { align: 'center' });
        if (name) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(31, 41, 55); doc.text(name, centerX, lineY + 9.2, { align: 'center' }); }
      };
      await drawSignature(sig1X, sigY, 'Técnico Responsable', data.firmas?.tecnico || null, data.tecnico?.nombre || '');
      const empresaRepName = (data.empresa && (
        data.empresa.representante_legal || data.empresa.representanteLegal || data.empresa.representante ||
        data.empresa.representante_nombre || data.empresa.nombre_representante ||
        data.empresa.responsable || data.empresa.contacto || data.empresa.nombre_contacto || data.empresa.nombre
      )) || '';
      // Solo fuentes válidas de firma del representante (nunca el logo, nunca la firma del cliente)
      const empresaRepFirma =
        (data.empresa && (data.empresa.firma_representante || data.empresa.firmaRepresentante || data.empresa.firma)) ||
        (data.firmas && (data.firmas.empresa || data.firmas.representante)) ||
        null;
      await drawSignature(sig2X, sigY, 'Representante Empresa', empresaRepFirma, empresaRepName);
    }

    _imageNaturalSize(dataUrl) {
      return new Promise((resolve) => {
        try {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || img.width || 0, height: img.naturalHeight || img.height || 0 });
          img.onerror = () => resolve({ width: 0, height: 0 });
          img.src = dataUrl;
        } catch {
          resolve({ width: 0, height: 0 });
        }
      });
    }

    /**
     * Footer del documento
     */
    addFooter(doc, data) {
      const M = this.margin;
      const W = this.pdfWidth;
      const C = this.colors;
      const y = this.pdfHeight - 20;
  doc.setDrawColor(...C.grayLight);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
      doc.setTextColor(57, 66, 83);
      const code = data.codigoValidacion || '—';
  const gen = this._formatLongDate(new Date());
      // Línea informativa similar CCTV
      doc.text(`Generado el: ${gen} | Puede validar este certificado en nuestra web usando este código: ${code}`, W / 2, y + 5, { align: 'center' });
      doc.text('Redes y CCTV  •  María Eugenia López 9726, Antofagasta  •  www.redesycctv.cl  •  +56 9 630 671 69', W / 2, y + 10, { align: 'center' });
    }

    /**
     * Páginas de evidencias fotográficas
     */
    async addEvidencePages(doc, data) {
      // Replicación exacta del comportamiento de CCTV: clasificación V/H y layout dinámico
      const evidencias = Array.isArray(data.evidencias) ? data.evidencias : [];
      if (!evidencias.length) return;

  const W = this.pdfWidth, H = this.pdfHeight, M = this.margin;
  const headerH = 38, footerH = 16; // mismos offsets usados en CCTV
  const gridX = M, gridW = W - M * 2;
  // topY se recalculará después de dibujar el header para reducir el gap
  let topY; // se define tras addHeader
      const bottomY = H - M - footerH; // límite antes de footer
      const vGapRow = 10, hGap = 10;

      // Helpers locales
      const measureImg = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ w: img.naturalWidth || img.width || 0, h: img.naturalHeight || img.height || 0 });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = src;
      });
      const addImageCentered = (ev, x, y, cellW, cellH) => {
        const w = ev.w || 1000, h = ev.h || 1000, ratio = w / h;
        let drawW = cellW, drawH = drawW / ratio;
        if (drawH > cellH) { drawH = cellH; drawW = drawH * ratio; }
        const ox = x + (cellW - drawW) / 2;
        const oy = y + (cellH - drawH) / 2;
        try {
          const fmt = (ev.src || '').includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(ev.src, fmt, ox, oy, drawW, drawH, undefined, 'FAST');
        } catch {}
      };
      const drawRow = (row, y) => {
        if (row.kind === 'V_REMAINS') {
          const cols = 4, vGap = 10;
          const vCellW = (gridW - vGap * (cols - 1)) / cols;
          const vCellH = vCellW * 1.35;
          const take = row.items.length;
          const startCol = Math.floor((cols - take) / 2);
          for (let idx = 0; idx < take; idx++) {
            const it = row.items[idx];
            const col = startCol + idx;
            const cx = gridX + col * (vCellW + vGap);
            doc.setDrawColor(229, 231, 235); doc.setFillColor(255, 255, 255);
            doc.rect(cx, y, vCellW, vCellH, 'S');
            addImageCentered(it.ev, cx, y, vCellW, vCellH);
          }
          return Math.min(vCellH, bottomY - y);
        }
        const spanTotal = row.items.reduce((s, it) => s + it.span, 0);
        const gaps = row.items.length - 1;
        const unitW = (gridW - hGap * gaps) / spanTotal;
        const heights = row.items.map(it => {
          const cellW = unitW * it.span;
          if (it.ev.orientation === 'vertical') return cellW * 1.35;
          if (it.ev.orientation === 'horizontal') return cellW * 0.62;
          return cellW * 0.8;
        });
        const rowH = Math.min(Math.max(...heights), bottomY - y);
        let cx = gridX;
        for (const it of row.items) {
          const cellW = unitW * it.span;
          doc.setDrawColor(229, 231, 235); doc.setFillColor(255, 255, 255);
          doc.rect(cx, y, cellW, rowH, 'S');
            addImageCentered(it.ev, cx, y, cellW, rowH);
          cx += cellW + hGap;
        }
        return rowH;
      };

      // Preproceso: medir y clasificar (resizing para performance)
      const processed = [];
      for (const ev of evidencias) {
        const src = ev.dataUrl || ev.src || null;
        if (!src) continue; // ignorar entradas inválidas
        try {
          const resized = await this._resizeImage(src, 1400, 0.82);
          const dims = await measureImg(resized);
          const orientation = (dims.h && dims.w) ? (dims.h >= dims.w ? 'vertical' : 'horizontal') : 'horizontal';
          processed.push({ ...ev, src: resized, w: dims.w, h: dims.h, orientation });
        } catch {
          processed.push({ ...ev, src, w: 0, h: 0, orientation: 'horizontal' });
        }
      }

      const V = processed.filter(e => e.orientation === 'vertical').slice();
      const Hh = processed.filter(e => e.orientation !== 'vertical').slice();
      const nextRow = () => {
        if (V.length >= 4) return { kind: '4V', items: V.splice(0,4).map(ev => ({ev, span:1})) };
        if (Hh.length >= 2) return { kind: '2H', items: Hh.splice(0,2).map(ev => ({ev, span:2})) };
        if (Hh.length >= 1 && V.length >= 2) return { kind: '1H2V', items: [{ev:Hh.shift(), span:2}, {ev:V.shift(), span:1}, {ev:V.shift(), span:1}] };
        if (Hh.length >= 1 && V.length >= 1) return { kind: 'MIX_REMAINS', items: [{ev:Hh.shift(), span:2}, {ev:V.shift(), span:1}] };
        if (V.length > 0) {
          const take = Math.min(3, V.length);
          return { kind: 'V_REMAINS', items: V.splice(0, take).map(ev => ({ ev, span: 1 })) };
        }
        if (Hh.length === 1) return { kind: '1H', items: [{ev:Hh.shift(), span:4}] };
        return null;
      };

      const drawSectionHeader = () => {
        let ty = topY;
        const barH = 8; const barW = 1.1;
        const gradX = M + barW; const gradW = (W - M) - gradX;
        const gradY = ty - (barH - 3); const gradH = barH;
        this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);
        doc.setFillColor(...this.colors.blue);
        doc.rect(M, ty - (barH - 3), barW, barH, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
        doc.text('EVIDENCIA FOTOGRÁFICA', M + 5, ty);
        // Reducir aire debajo del título
        ty += 4.4; doc.setDrawColor(...this.colors.grayLight); doc.setLineWidth(0.3); doc.line(M, ty, W - M, ty);
        return ty + 4.8; // antes 7.5 -> más compacto
      };

  // Primera página de evidencias
  doc.addPage('a4', 'portrait');
  const headerBottom = await this.addHeader(doc, data); // devuelve M+38
  // Reducir el espacio respecto al header (antes +10mm); ahora ~ +6mm
  topY = headerBottom - 38 + headerH + 6; // equivalente a M + 44
  let y = drawSectionHeader();

      while (true) {
        const row = nextRow();
        if (!row) break;
        // estimar altura
        const estRowH = (() => {
          if (row.kind === 'V_REMAINS') {
            const cols = 4, vGap=10; const vCellW = (gridW - vGap*(cols-1))/cols; return vCellW * 1.35;
          }
          const spanTotal = row.items.reduce((s, it) => s + it.span, 0);
          const unitW = (gridW - hGap * (row.items.length - 1)) / spanTotal;
          const heights = row.items.map(it => {
            const cellW = unitW * it.span;
            if (it.ev.orientation === 'vertical') return cellW * 1.35;
            if (it.ev.orientation === 'horizontal') return cellW * 0.62;
            return cellW * 0.8;
          });
          return Math.max(...heights);
        })();

        if (y + estRowH > bottomY) {
          this.addFooter(doc, data);
          doc.addPage('a4', 'portrait');
          const hb2 = await this.addHeader(doc, data);
          topY = hb2 - 38 + headerH + 6; // mantener mismo cálculo en páginas siguientes
          y = drawSectionHeader();
        }
        const rowH = drawRow(row, y);
        y += rowH + vGapRow;
      }
      this.addFooter(doc, data);
    }

    // Redimensionar imagen para reducir peso (mismo enfoque que CCTV)
    _resizeImage(dataUrl, maxLongEdge = 1400, quality = 0.82) {
      return new Promise((resolve, reject) => {
        try {
          const img = new Image();
          img.onload = () => {
            const sw = img.naturalWidth || img.width;
            const sh = img.naturalHeight || img.height;
            const scale = Math.min(1, maxLongEdge / Math.max(sw, sh));
            const tw = Math.max(1, Math.round(sw * scale));
            const th = Math.max(1, Math.round(sh * scale));
            const cv = document.createElement('canvas');
            cv.width = tw; cv.height = th;
            const ctx = cv.getContext('2d');
            ctx.drawImage(img, 0, 0, tw, th);
            try { const out = cv.toDataURL('image/jpeg', quality); resolve(out); }
            catch { resolve(dataUrl); }
          };
          img.onerror = reject;
          img.src = dataUrl;
        } catch (e) { reject(e); }
      });
    }
  }

  // Exponer la clase globalmente
  window.HardwarePdfGenerator = HardwarePdfGenerator;
})();

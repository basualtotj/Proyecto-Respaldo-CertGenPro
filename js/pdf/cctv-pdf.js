/**
 * CCTVPdfGenerator
 * Genera un PDF vectorial (texto y gráficos) de 1+ páginas usando jsPDF.
 * - Hoja 1: cabecera, datos cliente/instalación, equipos, checklist, textos, firmas.
 * - Hojas siguientes: galería de evidencias (3x3) con el mismo encabezado y pie.
 * - Texto vectorizado, imágenes comprimidas para tamaño liviano.
 */
(function () {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    console.error('jsPDF no está disponible en window.jspdf');
    return;
  }

  class CCTVPdfGenerator {
    constructor() {
      this.unit = 'mm';
      this.format = 'a4';
      this.orientation = 'portrait';
      this.pdfWidth = 210;
      this.pdfHeight = 297;
      this.margin = 15; // mm, más aire
      this.colors = {
  blue: [67, 105, 231], // #4369e7
        blueLight: [229, 242, 255], // más sutil
        grayDark: [55, 65, 81],
        grayMid: [100, 116, 139],
        grayLight: [226, 232, 240],
        almostBlack: [31, 41, 55]
      };
    }
    // Gradiente horizontal (vectorial por franjas) de left->right
    _drawHorizontalGradient(doc, x, y, w, h, fromRGB, toRGB, steps = 48) {
      const stepW = w / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(fromRGB[0] + (toRGB[0] - fromRGB[0]) * t);
        const g = Math.round(fromRGB[1] + (toRGB[1] - fromRGB[1]) * t);
        const b = Math.round(fromRGB[2] + (toRGB[2] - fromRGB[2]) * t);
        doc.setFillColor(r, g, b);
        // +0.2mm para evitar micro huecos por redondeo
        doc.rect(x + i * stepW, y, stepW + 0.2, h, 'F');
      }
    }


    async generate(opts) {
      const {
        formData, // getFormData()
        info,     // getClienteInstalacionInfo()
        empresa,  // datos de empresa (logo, representante)
        code,     // número correlativo asignado por backend
        evidencias = [], // [{src,w,h,orientation}]
        autoSave = true  // si true, descarga el archivo al final
      } = opts || {};

  const doc = new jsPDF({ orientation: this.orientation, unit: this.unit, format: this.format });
  doc.setFont('helvetica', 'normal');
      const fechaText = formData?.fecha_mantenimiento
        ? new Date(formData.fecha_mantenimiento).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : '-';
  const systemLabel = 'SISTEMA CCTV';
      const logoDataUrl = await this._getEmpresaLogoDataUrl(empresa).catch(() => null);

      // Página 1
      this._drawHeader(doc, systemLabel, code, fechaText, logoDataUrl);
  this._drawPage1(doc, formData, info);
      this._drawFooter(doc, code);

      // Evidencias (páginas 2+)
      if (Array.isArray(evidencias) && evidencias.length) {
        await this._drawEvidencePages(doc, evidencias, systemLabel, code, fechaText, logoDataUrl);
      }

      const filename = `${code || 'CERT'}.pdf`;
      const blob = doc.output('blob');
      if (autoSave) {
        doc.save(filename);
      }
      return { pdf: doc, blob, filename };
    }

    // Header reutilizable
    _drawHeader(doc, systemLabel, code, fechaText, logoDataUrl) {
      const { pdfWidth: W, margin: M, colors: C } = this;
      // Logo (izquierda) y título a la derecha/centro con composición sobria
      const topY = M - 2;
      if (logoDataUrl) {
        try {
          const logoH = 14; // mm
          const logoW = 28; // aprox
          const fmt = logoDataUrl.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(logoDataUrl, fmt, M, topY, logoW, logoH, undefined, 'FAST');
        } catch {}
      }
      // Título y subtítulo
  doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55); // gris oscuro elegante
      doc.text('CERTIFICADO DE MANTENIMIENTO', W / 2, M + 6, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
      doc.setTextColor(75, 85, 99);
      doc.text(systemLabel, W / 2, M + 11.5, { align: 'center' });
      // Regla sutil
      doc.setDrawColor(...C.grayLight);
      doc.line(M, M + 15, W - M, M + 15);

    // Meta (Fecha Mantenimiento y Código) en una línea sutil
  const metaY = M + 21;
    doc.setFontSize(9);
    // Izquierda: etiqueta en negrita y valor normal
    const leftLabel = 'Fecha Mantenimiento:';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.almostBlack);
    const leftW = doc.getTextWidth(leftLabel);
    doc.text(leftLabel, M, metaY);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaText, M + leftW + 2, metaY);
    // Derecha: etiqueta en negrita y valor normal
    const rightLabel = 'Certificado N°:';
    doc.setFont('helvetica', 'bold');
    const rlW = doc.getTextWidth(rightLabel);
    doc.setFont('helvetica', 'normal');
    const rvW = doc.getTextWidth(code || '-');
    const total = rlW + 3 + rvW;
    const start = W - M - total;
    // etiqueta
    doc.setFont('helvetica', 'bold');
    doc.text(rightLabel, start, metaY);
    // valor
    doc.setFont('helvetica', 'normal');
    doc.text(code || '-', start + rlW + 3, metaY);

  // Separador sutil debajo de la fecha para delimitar la primera sección
  doc.setDrawColor(...C.grayLight);
  doc.setLineWidth(0.3);
  doc.line(M, metaY + 6, W - M, metaY + 6);
    }

    _drawPage1(doc, formData, info) {
      const { pdfWidth: W, margin: M, colors: C, pdfHeight: H } = this;
  let y = M + 36; // más separación debajo del encabezado y separador

  const sectionTitle = (t) => {
  // Barra izquierda (azul corporativo)
  const barH = 8;
    // Fondo con degradado sutil (de #eff6ff a blanco) acotado al alto de la barra
    // Inicia inmediatamente al borde derecho de la barra (sin espacio entre ambas)
    const barW = 1.1;
    const gradX = M + barW; // sin gap entre barra y degradado
    const gradW = (W - M) - gradX;
    const gradY = y - (barH - 3);
    const gradH = barH;
    this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239, 246, 255], [255, 255, 255], 56);

  doc.setFillColor(...C.blue);
  doc.rect(M, y - (barH - 3), barW, barH, 'F');

        // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(t, M + 5, y);

        // Regla sutil y más aire antes del contenido
        y += 5.2;
        doc.setDrawColor(...C.grayLight);
        doc.setLineWidth(0.3);
        doc.line(M, y, W - M, y);
        y += 7.5; // más espacio tras el título
      };
      const twoColRow = (labelL, valueL, labelR, valueR) => {
        const colGap = 10;
        const colW = (W - M * 2 - colGap) / 2;
        // Left
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...C.grayMid);
        doc.text(`${labelL}:`, M, y);
        doc.setFontSize(9);
        doc.setTextColor(...C.almostBlack);
        const leftWrapped = doc.splitTextToSize(String(valueL || '-'), colW - 24);
        leftWrapped.slice(0, 2).forEach((line, idx) => doc.text(line, M + 22, y + idx * 4.5));
        // Right
        doc.setFontSize(8);
        doc.setTextColor(...C.grayMid);
        const rx = M + colW + colGap;
        doc.text(`${labelR}:`, rx, y);
        doc.setFontSize(9);
        doc.setTextColor(...C.almostBlack);
        const rightWrapped = doc.splitTextToSize(String(valueR || '-'), colW - 24);
        rightWrapped.slice(0, 2).forEach((line, idx) => doc.text(line, rx + 22, y + idx * 4.5));
        y += Math.max(leftWrapped.length, rightWrapped.length) * 4.5 + 3;
      };

      // Información del cliente (3 columnas x 2 filas) con anchos flexibles
      sectionTitle('INFORMACIÓN DEL CLIENTE');
      const drawFlexRow = (items, widths, adaptive = false) => {
        // items: [{label, value}, ...]; widths: [0..1, 0..1, 0..1] suma ~1
  const gap = 4.5; // reducir más el espacio entre columnas
        const innerW = W - M * 2;
        const usableW = innerW - gap * (items.length - 1);
        const xPositions = [];
        let accX = M;
        // trabajar con una copia local de widths para poder devolverla
        let wLocal = widths.slice();
        for (let i = 0; i < items.length; i++) {
          xPositions.push(accX);
          accX += wLocal[i] * usableW + gap;
        }
        doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2); // bajar 1 punto para evitar desbordes
        const lineH = 3.9;
        // Función para calcular wraps según widths actuales
        const computeWrapped = (wArr) => items.map((it, i) => {
          const labelText = `${it.label}: `;
          // medir etiqueta en negrita para que el valor no se pegue
          doc.setFont('helvetica', 'bold');
          const labelW = doc.getTextWidth(labelText);
          doc.setFont('helvetica', 'normal');
          const colW = wArr[i] * usableW;
          const valueMaxW = Math.max(10, colW - labelW - 2);
          const text = String(it.value ?? '-');
          const wrappedVal = doc.splitTextToSize(text, valueMaxW);
          return { labelText, labelW, wrappedVal, colW };
        });
        let wrapped = computeWrapped(wLocal);

        // Ajuste adaptativo para minimizar desbordes (pensado para fila 1)
        if (adaptive && items.length === 3) {
          // límites de ancho relativo
          const minW = [0.28, 0.28, 0.36]; // proteger ancho mínimo de la columna central
          const maxW = [0.46, 0.36, 0.56]; // permitir que crezca si es necesario
          let tries = 8;
          while (tries-- > 0) {
            const lines = wrapped.map(w => Math.max(1, w.wrappedVal.length));
            const needsCliente = lines[0] > 1;
            const needsDir = lines[2] > 1;
            if (!needsCliente && !needsDir) break;
            // Transferir porcentaje desde columnas con 1 línea hacia la que desborda
            if (needsCliente && wLocal[0] < maxW[0]) {
              const takeFrom2 = lines[2] === 1 && wLocal[2] > minW[2] ? 0.015 : 0.006;
              const takeFrom1 = lines[1] === 1 && wLocal[1] > (minW[1] + 0.02) ? 0.004 : 0.002; // quitar menos del centro
              const give = takeFrom1 + takeFrom2;
              wLocal[0] = Math.min(maxW[0], wLocal[0] + give);
              wLocal[1] = Math.max(minW[1], wLocal[1] - takeFrom1);
              wLocal[2] = Math.max(minW[2], wLocal[2] - takeFrom2);
            }
            if (needsDir && wLocal[2] < maxW[2]) {
              const takeFrom0 = lines[0] === 1 && wLocal[0] > minW[0] ? 0.012 : 0.006;
              const takeFrom1b = lines[1] === 1 && wLocal[1] > (minW[1] + 0.02) ? 0.004 : 0.002; // quitar menos del centro
              const give2 = takeFrom0 + takeFrom1b;
              wLocal[2] = Math.min(maxW[2], wLocal[2] + give2);
              wLocal[0] = Math.max(minW[0], wLocal[0] - takeFrom0);
              wLocal[1] = Math.max(minW[1], wLocal[1] - takeFrom1b);
            }
            // Normalizar a suma 1
            const sum = wLocal[0] + wLocal[1] + wLocal[2];
            wLocal = wLocal.map(w => w / sum);
            wrapped = computeWrapped(wLocal);
          }
          // Recalcular posiciones con widths finales
          xPositions.length = 0; accX = M;
          for (let i = 0; i < items.length; i++) {
            xPositions.push(accX);
            accX += wLocal[i] * usableW + gap;
          }
        }
        const maxLines = Math.max(...wrapped.map(w => Math.max(1, w.wrappedVal.length)));
        // Pintado por columna (label en negrita negra, valor normal)
        items.forEach((it, i) => {
          const x = xPositions[i];
          const w = wrapped[i];
          // Etiqueta en negro y negrita
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(17, 24, 39);
          doc.text(w.labelText, x, y);
          doc.setTextColor(...C.almostBlack);
          doc.setFont('helvetica', 'normal');
          const firstVal = w.wrappedVal[0] || '-';
          const labelPad = 1.6; // espacio visual entre etiqueta y valor
          doc.text(firstVal, x + w.labelW + labelPad, y);
          // Líneas adicionales si aplica
          for (let li = 1; li < w.wrappedVal.length; li++) {
            doc.text(w.wrappedVal[li], x, y + li * lineH);
          }
        });
        y += maxLines * lineH + 1.2; // aún menos separación vertical
        return wLocal; // devolver widths finales para alinear siguientes filas
      };
      // Fila 1: más espacio para Dirección
  const wAligned = drawFlexRow([
        { label: 'Cliente', value: info?.cliente?.nombre },
        { label: 'RUT', value: info?.cliente?.rut },
        { label: 'Dirección', value: info?.instalacion?.direccion }
  ], [0.30, 0.30, 0.40], true); // dar más ancho a la columna central para evitar quiebres de Email
  // Fila 2: email un poco más a la izquierda y técnico con buen ancho
  drawFlexRow([
        { label: 'Contacto', value: info?.cliente?.contacto },
        { label: 'Email', value: info?.cliente?.email },
        { label: 'Técnico', value: info?.tecnico?.nombre }
  ], wAligned);
  y += 6; // más espacio entre secciones

      // Equipos instalados: 3 casillas + 1 columna para NVR/DVR/JOYSTICK (vertical)
      sectionTitle('EQUIPOS INSTALADOS');
      const colGap4 = 6;
      const colW4 = (W - M * 2 - colGap4 * 3) / 4; // 4 columnas
      const cardsH = 12;
      const boxRadius = 2.5;
      const rowY = y;
      // Tres tarjetas
      const cardItems = [
        { label: 'Cámaras IP:', value: formData?.cctv?.camaras_ip ?? 0 },
        { label: 'Cámaras Analógicas:', value: formData?.cctv?.camaras_analogicas ?? 0 },
        { label: 'Monitores:', value: formData?.cctv?.monitores ?? 0 }
      ];
      cardItems.forEach((it, idx) => {
        const cx = M + idx * (colW4 + colGap4);
        const cy = rowY;
        try {
          doc.setDrawColor(...C.grayLight);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(cx, cy, colW4, cardsH, boxRadius, boxRadius, 'FD');
        } catch {
          doc.setDrawColor(...C.grayLight);
          doc.setFillColor(248, 250, 252);
          doc.rect(cx, cy, colW4, cardsH, 'FD');
        }
        // Contenido centrado: etiqueta + valor
        const ty = cy + 7;
        const labelText = it.label;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(55, 65, 81);
        const labelW = doc.getTextWidth(labelText);
        const labelPad = 1.2;
        const valueText = String(it.value);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
        const valueW = doc.getTextWidth(valueText);
        const totalW = labelW + labelPad + valueW;
        const startX = cx + (colW4 - totalW) / 2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(55,65,81);
        doc.text(labelText, startX, ty);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...C.blue);
        doc.text(valueText, startX + labelW + labelPad, ty);
      });
      // Columna 4: tags verticales si hay datos
      const nvr = (formData?.cctv?.nvr || '').trim();
      const dvr = (formData?.cctv?.dvr || '').trim();
      const joystick = (formData?.cctv?.joystick || '').trim();
      const items = [];
      if (nvr) items.push({ label: 'NVR', value: nvr });
      if (dvr) items.push({ label: 'DVR', value: dvr });
      if (joystick) items.push({ label: 'JOYSTICK', value: joystick });
      let tagsHeight = 0;
      if (items.length) {
        const x4 = M + 3 * (colW4 + colGap4);
        const tagH = 6.2; const vGap = 2.5; const padX = 2.8; const radius = 2.0; const barW = 0.9;
        let ty = rowY; // empezar arriba, vertical
        items.forEach((it) => {
          // Contenedor
          try {
            doc.setDrawColor(...C.grayLight);
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(x4, ty, colW4, tagH, radius, radius, 'FD');
          } catch {
            doc.setDrawColor(...C.grayLight);
            doc.setFillColor(241, 245, 249);
            doc.rect(x4, ty, colW4, tagH, 'FD');
          }
          // Barra izquierda
          doc.setFillColor(...C.blue);
          doc.rect(x4, ty, barW, tagH, 'F');
          // Texto
          const lbl = `${it.label}: `;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(17,24,39);
          const lblW = doc.getTextWidth(lbl);
          doc.text(lbl, x4 + barW + padX, ty + (tagH - 1.9));
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2);
          doc.text(String(it.value), x4 + barW + padX + lblW, ty + (tagH - 1.9));
          ty += tagH + vGap;
        });
        tagsHeight = items.length * tagH + (items.length - 1) * vGap;
      }
      // Altura usada por la fila (tarjetas vs columna tags)
      const usedH = Math.max(cardsH, tagsHeight);
      y = rowY + usedH + 8;

      // Checklist (ahora 4 columnas, 2 campos por columna)
      sectionTitle('VERIFICACIÓN REALIZADA');
      const checklist = Array.isArray(formData?.cctv?.checklist) ? formData.cctv.checklist : [];
      const labels = {
        grabaciones: 'Grabaciones',
        limpieza_camaras: 'Limpieza de cámaras',
        fecha_hora: 'Fecha y hora',
        enfoques: 'Enfoques',
        configuraciones: 'Configuraciones',
        filtros: 'Filtros',
        revision_cables: 'Revisión de cables y conectores',
        revision_almacenamiento: 'Revisión de almacenamiento'
      };
      const drawCheckbox = (x, yy, text) => {
        // Caja más pequeña y bordes finos
        const box = 3.6;
        const offY = yy - box + 1.3;
        doc.setDrawColor(16, 185, 129); // verde
        doc.setLineWidth(0.3);
        doc.rect(x, offY, box, box, 'S');
        // Check más pequeño y fino
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.4);
        doc.line(x + 0.85, offY + 2.1, x + 1.45, offY + 2.8);
        doc.line(x + 1.45, offY + 2.8, x + 2.6, offY + 1.05);
        // Texto al tamaño de sección cliente (7.2 pt)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...C.almostBlack);
        doc.text(text, x + box + 2.0, yy);
      };
      // 4 columnas, 2 ítems por columna
      const cols = 4;
      const perCol = 2;
      const gap4 = 10;
      const col4W = (W - M * 2 - gap4 * (cols - 1)) / cols;
      const colXs4 = new Array(cols).fill(0).map((_, i) => M + i * (col4W + gap4));
      const rowH = 5.8;
      let maxRowsUsed = 0;
      for (let c = 0; c < cols; c++) {
        const base = c * perCol;
        let used = 0;
        const a = checklist[base];
        if (a) { drawCheckbox(colXs4[c], y + used * rowH, labels[a] || a); used++; }
        const b = checklist[base + 1];
        if (b) { drawCheckbox(colXs4[c], y + used * rowH, labels[b] || b); used++; }
        maxRowsUsed = Math.max(maxRowsUsed, used);
      }
      y += (maxRowsUsed > 0 ? maxRowsUsed * rowH : 0) + 6; // espacio antes de siguiente sección

      // Solicitudes y Observaciones (contenedores con borde tipo "casilla")
      const drawParagraph = (title, text) => {
        sectionTitle(title);
        // Acercar la burbuja al título y ampliar espacio tras la burbuja
        const topTight = 4.0; // mm a recuperar desde el espacio general del título
        const yTop = y - topTight;
        const padX = 4, padY = 3; // padding compacto
        const maxW = W - M * 2 - padX * 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2); // igual que sección de cliente
        const wrapped = doc.splitTextToSize(String(text || ''), maxW);
        const lineH = 3.9; // consistente con cliente
        // Alto estrictamente según contenido (sin mínimo artificial)
        let contentH = wrapped.length * lineH;
        const boxH = contentH + padY * 2;
        // Caja (rounded)
        try {
          doc.setDrawColor(...C.grayLight);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(M, yTop, W - M * 2, boxH, 2, 2, 'FD');
        } catch {
          doc.setDrawColor(...C.grayLight);
          doc.setFillColor(248, 250, 252);
          doc.rect(M, yTop, W - M * 2, boxH, 'FD');
        }
        // Texto
        doc.setTextColor(...C.almostBlack);
        let ty = yTop + padY + 3.2;
        for (const line of wrapped) {
          if (ty > yTop + boxH - padY) break;
          doc.text(line, M + padX, ty);
          ty += lineH;
        }
  y = yTop + boxH + 10; // más aire antes del siguiente título
      };
      if (formData?.solicitudes_cliente?.trim()) drawParagraph('SOLICITUDES DEL CLIENTE', formData.solicitudes_cliente);
      if (formData?.observaciones?.trim()) drawParagraph('OBSERVACIONES Y RECOMENDACIONES', formData.observaciones);

      // Firmas (con imagen si existe)
      const sigY = H - 68;
      const sigW = (W - M * 2 - 20) / 2;
      const sig1X = M, sig2X = M + sigW + 20;
      const drawSignature = (x, baseY, title, imgDataUrl, name) => {
        // Centrar todo el bloque: imagen, línea, datos
        const blockW = sigW;
        const centerX = x + blockW / 2;
        // Imagen centrada
        if (imgDataUrl) {
          try {
            const fmt = imgDataUrl.includes('png') ? 'PNG' : 'JPEG';
            const h = 14; const w = 40;
            const imgX = centerX - w / 2;
            doc.addImage(imgDataUrl, fmt, imgX, baseY + 2, w, h, undefined, 'FAST');
          } catch {}
        }
        // Línea de firma más corta y centrada
        const lineW = sigW * 0.62;
        const lineX = centerX - lineW / 2;
        const lineY = baseY + 22;
        doc.setDrawColor(107, 114, 128);
        doc.setLineWidth(0.4);
        doc.line(lineX, lineY, lineX + lineW, lineY);
        // Centrar datos respecto a la línea
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(17, 24, 39);
        doc.text(title, centerX, lineY + 5, { align: 'center' });
        if (name) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.2); doc.setTextColor(31, 41, 55);
          doc.text(name, centerX, lineY + 9.2, { align: 'center' });
        }
      };
  drawSignature(sig1X, sigY, 'Técnico Responsable', formData?.firmas?.tecnico || null, info?.tecnico?.nombre || '');
  drawSignature(sig2X, sigY, 'Representante Empresa', formData?.firmas?.cliente || null, info?.tecnico?.nombre || '');
    }

    async _drawEvidencePages(doc, evidencias, systemLabel, code, fechaText, logoDataUrl) {
      const { pdfWidth: W, pdfHeight: H, margin: M } = this;
      // Diseño más elegante: 2 columnas x 3 filas (6 por página)
      const perPage = 6;
      const gridCols = 2, gridRows = 3;
      const hGap = 10, vGap = 10; // más aire
      const headerH = 28, footerH = 16;
      const gridX = M;
      const gridYBase = M + headerH + 10;
      const gridW = W - M * 2;
      const availableH = H - gridYBase - M - footerH - (vGap * (gridRows - 1));
      const cellW = (gridW - hGap * (gridCols - 1)) / gridCols;
      const cellH = availableH / gridRows;

      // Pre-comprimir imágenes (secuencial para evitar picos de memoria)
      const processed = [];
      for (const ev of evidencias) {
        try {
          const resized = await this._resizeImage(ev.src, 1400, 0.82);
          processed.push({ ...ev, src: resized || ev.src });
        } catch {
          processed.push(ev);
        }
      }

      for (let i = 0; i < processed.length; i += perPage) {
        doc.addPage('a4', 'portrait');
        // Encabezado
        this._drawHeader(doc, systemLabel, code, fechaText, logoDataUrl);
        // Título de sección igual que página 1
        // --- Section Title: Evidencia fotográfica ---
        let y = M + 32; // Separar del header
        const sectionTitleEvidence = (t) => {
          const { pdfWidth: W, margin: M, colors: C } = this;
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
          doc.text(t, M + 5, y);
          y += 5.2;
          doc.setDrawColor(...C.grayLight);
          doc.setLineWidth(0.3);
          doc.line(M, y, W - M, y);
          y += 7.5;
        };
        sectionTitleEvidence('Evidencia fotográfica');

        // Nueva lógica: verticales y horizontales agrupadas
        const gridYBase2 = y;
        // Separar verticales y horizontales
        const verticals = slice.filter(ev => ev.orientation === 'vertical');
        const horizontals = slice.filter(ev => ev.orientation !== 'vertical');
        let cy = gridYBase2;
        // Verticales: 4 por fila, auto-size
        if (verticals.length) {
          const vPerRow = 4;
          const vGap = 7;
          const vCellW = (gridW - vGap * (vPerRow - 1)) / vPerRow;
          const vCellH = vCellW * 1.35; // vertical ratio
          for (let vi = 0; vi < verticals.length; vi += vPerRow) {
            for (let c = 0; c < vPerRow && vi + c < verticals.length; c++) {
              const evd = verticals[vi + c];
              const cx = gridX + c * (vCellW + vGap);
              // Marco sutil
              doc.setDrawColor(229, 231, 235);
              doc.setFillColor(255, 255, 255);
              doc.rect(cx, cy, vCellW, vCellH, 'S');
              // Imagen centrada
              const w = evd.w || 1000, h = evd.h || 1000, ratio = w / h;
              let drawH = vCellH, drawW = drawH * ratio;
              if (drawW > vCellW) { drawW = vCellW; drawH = drawW / ratio; }
              const ox = cx + (vCellW - drawW) / 2;
              const oy = cy + (vCellH - drawH) / 2;
              try {
                const fmt = (evd.src || '').includes('image/png') ? 'PNG' : 'JPEG';
                doc.addImage(evd.src, fmt, ox, oy, drawW, drawH, undefined, 'FAST');
              } catch {}
            }
            cy += vCellH + vGap;
          }
        }
        // Horizontales: 2 por fila, half-width
        if (horizontals.length) {
          const hPerRow = 2;
          const hGap = 10;
          const hCellW = (gridW - hGap) / hPerRow;
          const hCellH = hCellW * 0.62; // horizontal ratio
          for (let hi = 0; hi < horizontals.length; hi += hPerRow) {
            for (let c = 0; c < hPerRow && hi + c < horizontals.length; c++) {
              const evd = horizontals[hi + c];
              const cx = gridX + c * (hCellW + hGap);
              // Marco sutil
              doc.setDrawColor(229, 231, 235);
              doc.setFillColor(255, 255, 255);
              doc.rect(cx, cy, hCellW, hCellH, 'S');
              // Imagen centrada
              const w = evd.w || 1000, h = evd.h || 1000, ratio = w / h;
              let drawW = hCellW, drawH = drawW / ratio;
              if (drawH > hCellH) { drawH = hCellH; drawW = drawH * ratio; }
              const ox = cx + (hCellW - drawW) / 2;
              const oy = cy + (hCellH - drawH) / 2;
              try {
                const fmt = (evd.src || '').includes('image/png') ? 'PNG' : 'JPEG';
                doc.addImage(evd.src, fmt, ox, oy, drawW, drawH, undefined, 'FAST');
              } catch {}
            }
            cy += hCellH + hGap;
          }
        }

        this._drawFooter(doc, code);
      }
    }

    _drawFooter(doc, code) {
      const { pdfWidth: W, pdfHeight: H, margin: M } = this;
      const footerY = H - M - 8;
      doc.setDrawColor(229, 231, 235);
      doc.line(M, footerY, W - M, footerY);
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
  const today = new Date().toLocaleDateString('es-ES');
  doc.text(`Generado el: ${today} | Puede validar este certificado en nuestra web usando este código: ${code || '-'}` , W / 2, footerY + 5, { align: 'center' });
      doc.setTextColor(51, 65, 85);
      doc.text('Redes y CCTV  •  María Eugenia López 9726, Antofagasta  •  www.redesycctv.cl  •  +56 9 630 671 69', W / 2, footerY + 10, { align: 'center' });
    }

    async _getEmpresaLogoDataUrl(empresa) {
      try {
        const src = empresa && typeof empresa.logo_empresa === 'string' ? empresa.logo_empresa : null;
        if (!src) return null;
        if (/^data:image\//.test(src)) return src;
        const resp = await fetch(src, { mode: 'cors' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return await new Promise((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    }

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
            try {
              const out = cv.toDataURL('image/jpeg', quality);
              resolve(out);
            } catch (e) {
              resolve(dataUrl);
            }
          };
          img.onerror = reject;
          img.src = dataUrl;
        } catch (e) { reject(e); }
      });
    }
  }

  window.CCTVPdfGenerator = CCTVPdfGenerator;
})();

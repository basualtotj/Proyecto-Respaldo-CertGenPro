/**
 * RacksPdfGenerator
 * Genera un PDF vectorial para certificados de mantenimiento de Racks de Comunicaciones
 * Basado en CCTVPdfGenerator con adaptaciones específicas para racks
 */
// Generador PDF Racks homogéneo con estilo del CCTV
(function () {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { console.error('jsPDF no disponible'); return; }

  class RacksPdfGenerator {
    constructor() {
      this.unit = 'mm'; this.format = 'a4'; this.orientation = 'portrait';
      this.pdfWidth = 210; this.pdfHeight = 297; this.margin = 15;
      this.colors = {
  blue: [67,105,231],
  blueLight: [229,242,255],
  grayDark: [55,65,81],
  grayLight: [226,232,240],
  almostBlack: [31,41,55],
  grayMid: [100,116,139]
      };
    }

    // Formato de fecha larga en español (6 de noviembre de 2025)
    _formatLongDate(input){
      if (!input) {
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      }
      let d = new Date(input);
      if (isNaN(d)) {
        const m = String(input).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (m) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      }
      if (isNaN(d)) d = new Date();
      return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    }

    async generate(opts) {
      const {
        formData, info, empresa, code, validationCode,
        evidencias = [], autoSave = false
      } = opts || {};
  const doc = new jsPDF({ orientation: this.orientation, unit: this.unit, format: this.format });
  doc.setFont('helvetica','normal');
  const fechaText = this._formatLongDate(formData?.fecha_mantenimiento);
      const systemLabel = 'RACKS DE COMUNICACIONES';
      const logoDataUrl = await this._getEmpresaLogoDataUrl(empresa).catch(()=>null);
  this._drawHeader(doc, systemLabel, code, fechaText, logoDataUrl, validationCode);
  await this._drawPage1(doc, formData, info, empresa);
  this._drawFooter(doc, validationCode);
      if (Array.isArray(evidencias) && evidencias.length) {
        await this._drawEvidencePages(doc, evidencias, systemLabel, code, fechaText, logoDataUrl, validationCode);
      }
      const filename = `${code || 'CERT-RACKS'}.pdf`;
      if (autoSave) {
        try { doc.save(filename); } catch {}
      }
      return { pdf: doc, filename };
    }

    // Mantener compatibilidad con generateRacksPDF(certificateData)
    async generateRacksPDF(certificateData) {
      const mapped = this._mapLegacyData(certificateData);
      const res = await this.generate(mapped);
      return res.pdf;
    }

    _mapLegacyData(data) {
      // Adaptar estructura simple (racks* campos planos) a formData similar al CCTV
      return {
        formData: {
          fecha_mantenimiento: data.fecha || new Date().toISOString().slice(0,10),
          racks: {
            racks: data.racksUnits || 0,
            switches: data.racksSwitches || 0,
            routers: data.racksRouters || 0,
            ups: data.racksUPS || 0,
            nvr: data.racksNVR || 0,
            central: data.racksCentral || 0,
            patch_panels: data.racksPatchPanels || 0,
            monitor: data.racksMonitor || 0,
            estabilizador: data.racksEstabilizador || 0,
            router_isp: data.racksRouterISP || 0,
            servidores: data.racksServidores || 0,
            area: data.racksArea || '' ,
            checklist: Array.isArray(data.racksCheck) ? data.racksCheck : []
          },
          solicitudes_cliente: (data.solicitudes_cliente || data.solicitudesCliente || ''),
          observaciones: data.observaciones || '',
          firmas: data.firmas || {}
        },
        info: {
          cliente: data.cliente || {},
          instalacion: data.instalacion || {},
          tecnico: data.tecnico || {}
        },
  empresa: data.empresa || {},
  // 'code' aquí representa el número correlativo del certificado (no el código de validación)
  code: data.numeroCertificado || data.numero_certificado || data.numero || data.codigo || '—',
  validationCode: data.codigoValidacion || data.validationCode || '-',
        evidencias: data.evidencias || []
      };
    }

    _drawHorizontalGradient(doc,x,y,w,h,from,to,steps=48){
      const stepW = w/steps; for(let i=0;i<steps;i++){const t=i/(steps-1);const r=Math.round(from[0]+(to[0]-from[0])*t);const g=Math.round(from[1]+(to[1]-from[1])*t);const b=Math.round(from[2]+(to[2]-from[2])*t);doc.setFillColor(r,g,b);doc.rect(x+i*stepW,y,stepW+0.2,h,'F');}
    }

    _drawHeader(doc, systemLabel, code, fechaText, logoDataUrl, validationCode){
      const { pdfWidth:W, margin:M, colors:C } = this; const topY = M-2;
      if (logoDataUrl){ try { doc.addImage(logoDataUrl, logoDataUrl.includes('png')?'PNG':'JPEG', M, topY, 15, 11.9, undefined,'FAST'); } catch {}
      }
      doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(31,41,55);
      doc.text('CERTIFICADO DE MANTENIMIENTO', W/2, M+6,{align:'center'});
      doc.setFontSize(10.5); doc.setTextColor(75,85,99); doc.text(systemLabel, W/2, M+11.5,{align:'center'});
      doc.setDrawColor(...C.grayLight); doc.line(M, M+15, W-M, M+15);
      const metaY = M+21; doc.setFontSize(9);
      const leftLabel='Fecha Mantenimiento:'; doc.setFont('helvetica','bold'); doc.setTextColor(...C.almostBlack);
      const leftW = doc.getTextWidth(leftLabel); doc.text(leftLabel, M, metaY); doc.setFont('helvetica','normal'); doc.text(fechaText, M+leftW+2, metaY);
  const rightLabel='Certificado N°:'; doc.setFont('helvetica','bold'); const rlW=doc.getTextWidth(rightLabel); doc.setFont('helvetica','normal'); const rvW=doc.getTextWidth(code||'-'); const total=rlW+3+rvW; const start=W-M-total; doc.setFont('helvetica','bold'); doc.text(rightLabel,start,metaY); doc.setFont('helvetica','normal'); doc.text(code||'-', start+rlW+3, metaY);
      doc.setDrawColor(...C.grayLight); doc.setLineWidth(0.3); doc.line(M, metaY+6, W-M, metaY+6);
    }

  async _drawPage1(doc, formData, info, empresa){
      const { pdfWidth:W, margin:M, colors:C, pdfHeight:H } = this; let y = M+38;
      const sectionTitle = (t)=>{ const barH=8, barW=1.1, gradX=M+barW, gradW=(W-M)-gradX, gradY=y-(barH-3), gradH=barH; this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239,246,255],[255,255,255],56); doc.setFillColor(...C.blue); doc.rect(M, y-(barH-3), barW, barH,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(30,41,59); doc.text(t, M+5, y); y+=5.2; doc.setDrawColor(...C.grayLight); doc.setLineWidth(0.3); doc.line(M,y,W-M,y); y+=7.5; };
      // CLIENTE
      sectionTitle('INFORMACIÓN DEL CLIENTE');
      const twoRows = [
        [ {label:'Cliente', value:info?.cliente?.nombre}, {label:'RUT', value:info?.cliente?.rut}, {label:'Dirección', value:info?.instalacion?.direccion} ],
        [ {label:'Contacto', value:info?.cliente?.contacto}, {label:'Email', value:info?.cliente?.email}, {label:'Técnico', value:info?.tecnico?.nombre} ]
      ];
      const gap=4.5; const innerW=W - M*2; const lineH=3.9;
      const drawFlexRow = (items)=>{ const usableW = innerW - gap*(items.length-1); let widths=[0.30,0.30,0.40]; const xPos=[]; let acc=M; widths.forEach(w=>{ xPos.push(acc); acc+=w*usableW+gap; });
        items.forEach((it,i)=>{ doc.setFont('helvetica','bold'); doc.setFontSize(7.2); doc.setTextColor(17,24,39); const label=`${it.label}: `; const labelW = doc.getTextWidth(label); doc.text(label,xPos[i],y); doc.setFont('helvetica','normal'); doc.setTextColor(...C.almostBlack); const val=(it.value||'-').toString(); const wrapped = doc.splitTextToSize(val, widths[i]*usableW - labelW - 2); doc.text(wrapped[0]||'-', xPos[i]+labelW+1.6, y); for(let li=1; li<wrapped.length; li++){ doc.text(wrapped[li], xPos[i], y+li*lineH); } });
        const maxLines = Math.max(...items.map(it=>{ const val=(it.value||'-').toString(); return doc.splitTextToSize(val, 40).length; })); y+=maxLines*lineH+1.2; };
      drawFlexRow(twoRows[0]); drawFlexRow(twoRows[1]); y+=3;
      // EQUIPOS (un solo tipo de tarjeta, replicando estilo de Hardware, más compacto)
      sectionTitle('EQUIPOS ATENDIDOS'); y -= 2;
  const racks = formData?.racks || {};
      const cardGap = 3.2; // más compactas
      const cardCols = 6;  // 6 por fila para orden visual
      const cardW = (W - M * 2 - cardGap * (cardCols - 1)) / cardCols;
      const cardH = 10;    // menor altura
      const valOrDash = (v) => (v === undefined || v === null || v === '') ? '-' : String(v);
      const items = [
        { label: 'Racks', value: racks.racks === undefined || racks.racks === null ? 0 : racks.racks },
        { label: 'Switches', value: racks.switches === undefined || racks.switches === null ? 0 : racks.switches },
        { label: 'Routers', value: racks.routers === undefined || racks.routers === null ? 0 : racks.routers },
        { label: 'UPS', value: valOrDash(racks.ups) },
        { label: 'NVR', value: valOrDash(racks.nvr) },
        { label: 'Central', value: valOrDash(racks.central) },
        { label: 'Patch Panels', value: valOrDash(racks.patch_panels) },
        { label: 'Monitor', value: valOrDash(racks.monitor) },
        { label: 'Servidores', value: valOrDash(racks.servidores) },
        { label: 'Router ISP', value: valOrDash(racks.router_isp) },
        { label: 'Estabilizador', value: valOrDash(racks.estabilizador) },
        { label: 'Área', value: valOrDash(racks.area) } // mover al final
      ];
      const totalRows = Math.ceil(items.length / cardCols);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const row = Math.floor(i / cardCols);
        const col = i % cardCols;
        const cx = M + col * (cardW + cardGap);
        const cy = y + row * (cardH + 6);
        try { doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252); doc.roundedRect(cx, cy, cardW, cardH, 2.5, 2.5, 'FD'); }
        catch { doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252); doc.rect(cx, cy, cardW, cardH, 'FD'); }
        const labelText = `${it.label}:`;
        const valueTextRaw = String(it.value);
        const labelFontSize = 6.6; // más pequeño
        const esArea = /área|area/i.test(it.label);
        let valueFontSize = esArea ? 7.2 : 8.6; // achicar específicamente Área
        doc.setFont('helvetica', 'bold'); doc.setFontSize(labelFontSize); doc.setTextColor(55, 65, 81);
        const labelW = doc.getTextWidth(labelText);
        const labelPad = 1.2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(valueFontSize); doc.setTextColor(...C.blue);
        let valueText = valueTextRaw;
        let combinedW = labelW + labelPad + doc.getTextWidth(valueText);
        // Ajuste automático si no cabe en la tarjeta
        while (combinedW > cardW - 3 && valueFontSize > 6.0) {
          valueFontSize -= 0.3;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(valueFontSize);
          combinedW = labelW + labelPad + doc.getTextWidth(valueText);
        }
        const tyBase = cy + 5.2; // ajustado a menor altura
        const startX = cx + (cardW - combinedW) / 2;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(labelFontSize); doc.setTextColor(55, 65, 81);
        doc.text(labelText, startX, tyBase + 0.6);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(valueFontSize); doc.setTextColor(...C.blue);
        doc.text(valueText, startX + labelW + labelPad, tyBase + 0.6);
      }
      y += totalRows * (cardH + 5) + 10; // mayor separación con la siguiente sección
      // CHECKLIST
      sectionTitle('VERIFICACIÓN REALIZADA'); const rawChecklist = Array.isArray(racks.checklist)? racks.checklist:[];
      // Valores actuales en el formulario (certificate-generator.php)
      // limpieza_rack, aspirado_polvo, orden_cableado, correccion_cableado, conexion_tierra, revision_ups, revision_patch_panels, revision_switches, ventilacion, fijaciones, seguridad_acceso, alimentacion_electrica
      const aliasMap = {
        limpieza_rack: ['limpieza_rack','limpieza_interna_externa','limpieza_interna','limpieza_interna_y_externa'],
        aspirado_polvo: ['aspirado_polvo','aspirado_de_polvo'],
        orden_cableado: ['orden_cableado','orden_y_canalizacion_cableado'],
        correccion_cableado: ['correccion_cableado','correccion_cableado_fuera_estandar'],
        conexion_tierra: ['conexion_tierra','revision_conexion_tierra'],
        revision_ups: ['revision_ups','revision_ups_autonomia'],
        revision_patch_panels: ['revision_patch_panels','revision_patch_panels_comprobacion'],
        revision_switches: ['revision_switches','verificacion_switches_routers','switches_routers'],
        ventilacion: ['ventilacion','ventilacion_general'],
        fijaciones: ['fijaciones','revision_fijaciones'],
        seguridad_acceso: ['seguridad_acceso','acceso_seguridad'],
        alimentacion_electrica: ['alimentacion_electrica','alimentacion_electrica_general']
      };
      const etiquetaLegible = {
        limpieza_rack: 'Limpieza rack/equipos',
        aspirado_polvo: 'Aspirado de polvo',
        orden_cableado: 'Orden de cableado',
        correccion_cableado: 'Corrección cableado',
        conexion_tierra: 'Conexión a tierra',
        revision_ups: 'Revisión UPS/autonomía',
        revision_patch_panels: 'Patch panels',
        revision_switches: 'Switches/routers',
        ventilacion: 'Ventilación general',
        fijaciones: 'Fijaciones',
        seguridad_acceso: 'Seguridad acceso',
        alimentacion_electrica: 'Alimentación eléctrica'
      };
      const normalizados = Object.keys(aliasMap).filter(k => {
        const targets = aliasMap[k];
        return rawChecklist.some(v => targets.includes(v));
      });
      const drawCheckbox=(x,yy,text)=>{ const box=3.6; const offY=yy-box+1.3; doc.setDrawColor(16,185,129); doc.setLineWidth(0.3); doc.rect(x,offY,box,box,'S'); doc.setDrawColor(16,185,129); doc.setLineWidth(0.4); doc.line(x+0.85, offY+2.1, x+1.45, offY+2.8); doc.line(x+1.45, offY+2.8, x+2.6, offY+1.05); doc.setFont('helvetica','normal'); doc.setFontSize(7.2); doc.setTextColor(...C.almostBlack); doc.text(text, x+box+2.0, yy); };
  const clCols=4, perCol=3, gapCols=10; const colWc=(W - M*2 - gapCols*(clCols-1))/clCols; const colXs=new Array(clCols).fill(0).map((_,i)=>M+i*(colWc+gapCols)); const rowH=5.8; let idx=0, maxRows=0;
  for(let c=0;c<clCols;c++){ let used=0; while(used<perCol && idx<normalizados.length){ const key=normalizados[idx++]; drawCheckbox(colXs[c], y+used*rowH, etiquetaLegible[key]); used++; } maxRows=Math.max(maxRows, used); }
      y += (maxRows>0? maxRows*rowH:0) + 6;
  // OBS / SOLICITUDES
  const drawParagraph=(titulo,texto)=>{ sectionTitle(titulo); const topTight=4.0; const yTop=y-topTight; const padX=4, padY=3; const maxW=W - M*2 - padX*2; doc.setFont('helvetica','normal'); doc.setFontSize(7.2); const wrapped=doc.splitTextToSize(String(texto||''), maxW); const lineH2=3.9; let contentH=wrapped.length*lineH2; const boxH=contentH + padY*2; try{ doc.setDrawColor(...C.grayLight); doc.setFillColor(248,250,252); doc.roundedRect(M,yTop,W - M*2, boxH,2,2,'FD'); }catch{ doc.setDrawColor(...C.grayLight); doc.setFillColor(248,250,252); doc.rect(M,yTop,W - M*2, boxH,'FD'); } doc.setTextColor(...C.almostBlack); let ty=yTop+padY+3.2; for(const line of wrapped){ if(ty>yTop+boxH-padY) break; doc.text(line, M+padX, ty); ty+=lineH2; } y=yTop+boxH+10; };
  // Mostrar siempre Solicitudes (acepta snake/camel); fallback si viene vacío
  const solicitudesTxt = (formData?.solicitudes_cliente || formData?.solicitudesCliente || '').trim();
  drawParagraph('SOLICITUDES DEL CLIENTE', solicitudesTxt || 'Sin solicitudes registradas.');
  // Observaciones (acepta snake/camel/alias comunes)
  const obsTxt = (formData?.observaciones || formData?.observaciones_generales || formData?.observacionesGenerales || '').trim();
  if (obsTxt) drawParagraph('OBSERVACIONES Y RECOMENDACIONES', obsTxt);
      // Firmas
      const sigY = H - 68; const sigW=(W - M*2 - 20)/2; const sig1X=M, sig2X=M+sigW+20;
      const drawSignature = async (x, baseY, title, imgDataUrl, name) => {
        const centerX = x + sigW / 2;
        if (imgDataUrl) {
          try {
            const fmt = imgDataUrl.includes('png') ? 'PNG' : 'JPEG';
            // Mantener relación de aspecto de la firma
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
        doc.setDrawColor(107,114,128); doc.setLineWidth(0.4); doc.line(lineX, lineY, lineX + lineW, lineY);
        doc.setFont('helvetica','bold'); doc.setFontSize(7.2); doc.setTextColor(17,24,39); doc.text(title, centerX, lineY + 5, { align: 'center' });
        if (name) { doc.setFont('helvetica','normal'); doc.setFontSize(7.2); doc.setTextColor(31,41,55); doc.text(name, centerX, lineY + 9.2, { align: 'center' }); }
      };
      await drawSignature(sig1X, sigY, 'Técnico Responsable', formData?.firmas?.tecnico||null, info?.tecnico?.nombre||'');
      // Solo Representante Empresa (igual que Hardware), sin firma de cliente
      // Nombre del representante: intentar empresa, luego info.empresa si existe
      const empresaCtx = empresa || (info && info.empresa) || null;
      const empresaRepName = (empresaCtx && (
        empresaCtx.representante_legal || empresaCtx.representanteLegal || empresaCtx.representante ||
        empresaCtx.responsable || empresaCtx.contacto || empresaCtx.nombre
      )) || '';
      const empresaRepFirma = (empresaCtx && (empresaCtx.firma_representante || empresaCtx.firmaRepresentante || empresaCtx.firma)) ||
        (formData?.firmas && (formData.firmas.empresa || formData.firmas.representante)) || null;
  await drawSignature(sig2X, sigY, 'Representante Empresa', empresaRepFirma, empresaRepName);
    }

    async _drawEvidencePages(doc, evidencias, systemLabel, code, fechaText, logoDataUrl, validationCode){
  const { pdfWidth:W, pdfHeight:H, margin:M } = this; const footerH=16; const gridX=M, gridW=W - M*2; let topY; const bottomY=H - M - footerH; const vGapRow=10, hGap=10;
      const measureImg=(src)=>new Promise(res=>{ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res({w:img.naturalWidth||img.width||0,h:img.naturalHeight||img.height||0}); img.onerror=()=>res({w:0,h:0}); img.src=src; });
      const addImageCentered=(ev,x,y,cellW,cellH)=>{ const w=ev.w||1000, h=ev.h||1000, ratio=w/h; let drawW=cellW, drawH=drawW/ratio; if(drawH>cellH){ drawH=cellH; drawW=drawH*ratio; } const ox=x+(cellW-drawW)/2; const oy=y+(cellH-drawH)/2; try{ const fmt=(ev.src||'').includes('image/png')?'PNG':'JPEG'; doc.addImage(ev.src, fmt, ox, oy, drawW, drawH, undefined,'FAST'); }catch{} };
      const drawRow=(row,y)=>{ if(row.kind==='V_REMAINS'){ const cols=4, vGap=10; const vCellW=(gridW - vGap*(cols-1))/cols; const vCellH=vCellW*1.35; const take=row.items.length; const startCol=Math.floor((cols - take)/2); for(let idx=0; idx<take; idx++){ const it=row.items[idx]; const col=startCol+idx; const cx=gridX + col*(vCellW + vGap); doc.setDrawColor(229,231,235); doc.setFillColor(255,255,255); doc.rect(cx,y,vCellW,vCellH,'S'); addImageCentered(it.ev,cx,y,vCellW,vCellH); } return Math.min(vCellH, bottomY - y); }
        const spanTotal=row.items.reduce((s,it)=>s+it.span,0); const gaps=row.items.length-1; const unitW=(gridW - hGap*gaps)/spanTotal; const heights=row.items.map(it=>{ const cellW=unitW*it.span; if(it.ev.orientation==='vertical') return cellW*1.35; if(it.ev.orientation==='horizontal') return cellW*0.62; return cellW*0.8; }); const rowH=Math.min(Math.max(...heights), bottomY - y); let cx=gridX; for(const it of row.items){ const cellW=unitW*it.span; doc.setDrawColor(229,231,235); doc.setFillColor(255,255,255); doc.rect(cx,y,cellW,rowH,'S'); addImageCentered(it.ev,cx,y,cellW,rowH); cx+=cellW + hGap; } return rowH; };
      // Preproceso
  const processed=[]; for(const ev of evidencias){ try{ const originalSrc=ev.dataUrl || ev.src; if(!originalSrc){ continue; } const resized=await this._resizeImage(originalSrc,1400,0.82); const dims=await measureImg(resized); const orientation=(dims.h && dims.w)? (dims.h>=dims.w?'vertical':'horizontal'):'horizontal'; processed.push({ ...ev, src:resized, w:dims.w, h:dims.h, orientation }); }catch{ processed.push(ev); } }
      const V=processed.filter(e=>e.orientation==='vertical').slice(); const Hh=processed.filter(e=>e.orientation!=='vertical').slice();
      const nextRow=()=>{ if(V.length>=4) return {kind:'4V', items:V.splice(0,4).map(ev=>({ev,span:1}))}; if(Hh.length>=2) return {kind:'2H', items:Hh.splice(0,2).map(ev=>({ev,span:2}))}; if(Hh.length>=1 && V.length>=2) return {kind:'1H2V',items:[{ev:Hh.shift(), span:2},{ev:V.shift(), span:1},{ev:V.shift(), span:1}]}; if(Hh.length>=1 && V.length>=1) return {kind:'MIX_REMAINS', items:[{ev:Hh.shift(), span:2},{ev:V.shift(), span:1}]}; if(V.length>0){ const take=Math.min(3,V.length); return {kind:'V_REMAINS', items:V.splice(0,take).map(ev=>({ev,span:1}))}; } if(Hh.length===1) return {kind:'1H', items:[{ev:Hh.shift(), span:4}]}; return null; };
      const drawSectionHeader=()=>{ let ty=topY; const barH=8, barW=1.1, gradX=M+barW, gradW=(W-M)-gradX, gradY=ty-(barH-3), gradH=barH; this._drawHorizontalGradient(doc, gradX, gradY, gradW, gradH, [239,246,255],[255,255,255],56); doc.setFillColor(67,105,231); doc.rect(M, ty-(barH-3), barW, barH,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(30,41,59); doc.text('EVIDENCIA FOTOGRÁFICA', M+5, ty); ty+=4.4; doc.setDrawColor(226,232,240); doc.setLineWidth(0.3); doc.line(M,ty,W-M,ty); return ty+4.8; };
  doc.addPage('a4','portrait'); this._drawHeader(doc, systemLabel, code, fechaText, logoDataUrl, validationCode); topY = (M + 38) + 2; let y = drawSectionHeader();
  while(true){ const row=nextRow(); if(!row) break; const estRowH=(()=>{ if(row.kind==='V_REMAINS'){ const cols=4, vGap=10; const vCellW=(gridW - vGap*(cols-1))/cols; return vCellW*1.35; } const spanTotal=row.items.reduce((s,it)=>s+it.span,0); const unitW=(gridW - hGap*(row.items.length-1))/spanTotal; const heights=row.items.map(it=>{ const cellW=unitW*it.span; if(it.ev.orientation==='vertical') return cellW*1.35; if(it.ev.orientation==='horizontal') return cellW*0.62; return cellW*0.8; }); return Math.max(...heights); })(); if(y + estRowH > bottomY){ this._drawFooter(doc, validationCode); doc.addPage('a4','portrait'); this._drawHeader(doc, systemLabel, code, fechaText, logoDataUrl, validationCode); topY = (M + 38) + 2; y = drawSectionHeader(); } const rowH = drawRow(row,y); y += rowH + vGapRow; }
      this._drawFooter(doc, validationCode);
    }

    _drawFooter(doc, validationCode){
      // Alinear con estilo de Hardware: línea sutil, tipografía y posición fija desde el borde inferior
      const W = this.pdfWidth; const M = this.margin; const C = this.colors;
      const y = this.pdfHeight - 20;
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.4);
      doc.line(M, y, W - M, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(57, 66, 83);
      const gen = this._formatLongDate(new Date());
      const codeText = validationCode || '—';
      doc.text(`Generado el: ${gen} | Puede validar este certificado en nuestra web usando este código: ${codeText}`, W / 2, y + 5, { align: 'center' });
      doc.setTextColor(51, 65, 85);
      doc.text('Redes y CCTV  •  María Eugenia López 9726, Antofagasta  •  www.redesycctv.cl  •  +56 9 630 671 69', W / 2, y + 10, { align: 'center' });
    }

    // Redimensiona imágenes para reducir peso del PDF
    _resizeImage(dataUrl, maxLongEdge=1400, quality=0.82){
      return new Promise((resolve,reject)=>{ try{ const img=new Image(); img.onload=()=>{ const sw=img.naturalWidth||img.width; const sh=img.naturalHeight||img.height; const scale=Math.min(1, maxLongEdge/Math.max(sw,sh)); const tw=Math.max(1,Math.round(sw*scale)); const th=Math.max(1,Math.round(sh*scale)); const cv=document.createElement('canvas'); cv.width=tw; cv.height=th; const ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,tw,th); try{ const out=cv.toDataURL('image/jpeg',quality); resolve(out); }catch{ resolve(dataUrl); } }; img.onerror=reject; img.src=dataUrl; }catch(e){ reject(e); } });
    }

    _imageNaturalSize(dataUrl){
      return new Promise((resolve)=>{
        try{
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || img.width || 0, height: img.naturalHeight || img.height || 0 });
          img.onerror = () => resolve({ width: 0, height: 0 });
          img.src = dataUrl;
        }catch{ resolve({ width: 0, height: 0 }); }
      });
    }

    async _getEmpresaLogoDataUrl(empresa){ try{ const src=empresa && (empresa.logo_empresa || empresa.logo); if(!src) return null; if(/^data:image\//.test(src)) return src; const resp=await fetch(src,{mode:'cors'}); if(!resp.ok) return null; const blob=await resp.blob(); return await new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(blob); }); }catch{ return null; } }
  }
  window.RacksPdfGenerator = RacksPdfGenerator;
})();

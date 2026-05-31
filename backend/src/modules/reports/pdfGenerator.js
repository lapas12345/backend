const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.templateDir = path.join(__dirname, 'templates');
  }

  async generateReport(data) {
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    const templatePath = path.join(this.templateDir, 'informe-tutorias.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    
    // Reemplazo de datos básicos
    html = html
      .replace(/{{OFICIO_NUM}}/g, data.oficioNumber || '')
      .replace(/{{FECHA}}/g, data.date || '')
      .replace(/{{DESTINATARIO}}/g, data.destinatario || '')
      .replace(/{{MEMO_REF}}/g, data.memoRef || '')
      .replace(/{{RESPONSABLE}}/g, data.responsibleName || '')
      .replace(/{{PERIODO}}/g, data.period || '');
    
    // Reemplazo de meses dinámicos en headers de tabla
    const months = data.months || [];
    months.forEach((m, idx) => {
      html = html.replace(new RegExp(`{{MES_${idx + 1}}}`, 'g'), m.short);
    });
    // Limpiar placeholders no usados (si el período tiene menos de 4 meses)
    for (let i = months.length + 1; i <= 6; i++) {
      html = html.replace(new RegExp(`{{MES_${i}}}`, 'g'), '');
    }
    
    // Construir tablas con datos dinámicos
    const tablesHTML = this.buildCareerTables(data.careers, months);
    html = html.replace('{{SUMMARY_TABLE}}', tablesHTML.summary);
    html = html.replace('{{CAREER_TABLES}}', tablesHTML.detail);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Logo HEADER (PNG)
    const logoHeaderPath = path.join(this.templateDir, 'logo-uleam.png');
    let logoHeaderHtml = '<div></div>';
    try {
      const buf = fs.readFileSync(logoHeaderPath);
      const b64 = buf.toString('base64');
      logoHeaderHtml = '<img src="data:image/png;base64,' + b64 + '" style="width:100%;height:auto;display:block;" />';
    } catch (e) {
      console.warn('Logo PNG no encontrado');
    }

    // Logo FOOTER (JPG)
    const logoFooterPath = path.join(this.templateDir, 'logo-uleam.jpg');
    let logoFooterHtml = '<div></div>';
    try {
      const buf = fs.readFileSync(logoFooterPath);
      const b64 = buf.toString('base64');
      logoFooterHtml = '<img src="data:image/jpeg;base64,' + b64 + '" style="width:100%;height:20px;display:block;object-fit:contain;" />';
    } catch (e) {
      console.warn('Logo JPG no encontrado');
    }

    // HEADER
    const headerTemplate = 
      '<div style="font-size:8px;width:100%;margin:0;padding:0;box-sizing:border-box;">' +
        '<div style="padding:0 1cm;">' +
          logoHeaderHtml +
        '</div>' +
      '</div>';

    // FOOTER
    const footerTemplate = 
      '<div style="font-size:8px;width:100%;margin:0;padding:0;box-sizing:border-box;">' +
        '<div style="padding:0 1cm;position:relative;">' +
          logoFooterHtml +
          '<div style="position:absolute;bottom:6px;left:1.5cm;color:white;font-size:10px;font-family:Arial,sans-serif;font-weight:bold;">' +
            '<span class="pageNumber" style="font-weight:bold;"></span>' +
          '</div>' +
        '</div>' +
      '</div>';

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '3.5cm',
        right: '2.48cm', 
        bottom: '2cm',
        left: '3cm'
      },
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate
    });
    
    await browser.close();
    return pdf;
  }

  buildCareerTables(careers, months) {
    const totalTeachers = (careers || []).reduce((sum, c) => sum + (parseInt(c.teacher_count) || 0), 0);
    const totalStudents = (careers || []).reduce((sum, c) => sum + (parseInt(c.student_count) || 0), 0);

    const summaryRows = (careers || []).map((c, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${c.name || ''}</td>
        <td class="center">${c.teacher_count || 0}</td>
        <td class="center">${c.student_count || 0}</td>
      </tr>
    `).join('');

    const summary = `
      <table class="tabla-resumen">
        <thead>
          <tr>
            <th style="width:8%">N°</th>
            <th style="width:52%">CARRERA</th>
            <th style="width:20%">Número de Docentes</th>
            <th style="width:20%">Total de Estudiantes Tutorados</th>
          </tr>
        </thead>
        <tbody>${summaryRows}</tbody>
        <tfoot>
          <tr class="fila-total">
            <td colspan="2" style="text-align:center; font-weight:bold;">TOTAL</td>
            <td class="center" style="font-weight:bold;">${totalTeachers}</td>
            <td class="center" style="font-weight:bold;">${totalStudents}</td>
          </tr>
        </tfoot>
      </table>
    `;

    // Generar headers de meses dinámicos
    const monthHeaders = months.map(m => `<th class="mes">${m.short}</th>`).join('');
    
    // Calcular ancho dinámico para columnas de meses
    const monthColWidth = months.length > 0 ? Math.floor(32 / months.length) : 8; // 32% distribuido entre meses
    
    const detail = (careers || []).map(career => {
      const modularNames = ['ELECTROMECÁNICA', 'DERECHO', 'ELECTROMECANICA'];
      const isModular = modularNames.some(m => (career.name || '').toUpperCase().includes(m));
      
      const modularNote = isModular ? 
        `<p class="nota-modular">Al ser modular no todos los docentes tienen módulos los ${months.length} meses por lo tanto solo se especifica el cumplimiento de los docentes a tiempo completo.</p>` : '';
      
      const rows = (career.teachers || []).map((t, i) => {
        // Generar celdas de meses dinámicos
        const monthCells = (t.monthCompliance || []).map(mc => 
          `<td class="mes">${mc.complied ? '✓' : ''}</td>`
        ).join('');
        
        return `
          <tr>
            <td class="numero">${i+1}</td>
            <td>${t.fullName || ''}</td>
            ${monthCells}
            <td class="observacion">${t.observation || ''}</td>
          </tr>
        `;
      }).join('');

      return `
        <div>
          <h3 class="titulo-carrera">${career.name || ''}</h3>
          ${modularNote}
          <table class="tabla-carrera">
            <thead>
              <tr>
                <th class="numero">N°</th>
                <th>Apellidos y nombres del profesor</th>
                ${monthHeaders}
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }).join('');

    return { summary, detail };
  }
}

module.exports = PDFGenerator;
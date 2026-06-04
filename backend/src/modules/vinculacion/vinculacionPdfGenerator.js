const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');
const chromiumPackage = require('@sparticuz/chromium');
const chromium = chromiumPackage.default || chromiumPackage;

/**
 * Generador PDF del modulo de vinculacion.
 * Recibe datos ya validados por el servicio y devuelve un Buffer PDF.
 */
class VinculacionPdfGenerator {
  constructor() {
    this.logoPath = path.join(__dirname, '..', 'reports', 'templates', 'logo-uleam.png');
  }

  async generate(data) {
    const chromiumArgs = Array.isArray(chromium.args) ? chromium.args : [];
    const executablePath = await this.resolveExecutablePath();
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vinculacion-pdf-'));

    const browser = await puppeteer.launch({
      args: [
        ...chromiumArgs,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--hide-scrollbars',
      ],
      executablePath,
      headless: 'new',
      ignoreHTTPSErrors: true,
      userDataDir,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(this.buildHtml(data), { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: this.buildHeaderTemplate(data),
        footerTemplate: '<div></div>',
        margin: { top: '58mm', right: '16mm', bottom: '16mm', left: '16mm' },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  }

  async resolveExecutablePath() {
    const candidates = [
      process.env.CHROME_EXECUTABLE_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }

    const sparticuzPath = typeof chromium.executablePath === 'function'
      ? await chromium.executablePath()
      : chromium.executablePath;

    if (sparticuzPath && fs.existsSync(sparticuzPath)) return sparticuzPath;

    throw new Error('No se encontro un ejecutable de Chrome/Edge. Configure CHROME_EXECUTABLE_PATH en .env.');
  }

  logoDataUrl() {
    try {
      const base64 = fs.readFileSync(this.logoPath).toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      return '';
    }
  }

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  buildEvidenceGrid(evidences = []) {
    if (!evidences.length) return '<p class="muted">Sin evidencias adjuntas.</p>';

    return `
      <div class="evidence-grid">
        ${evidences.map((file) => `
          <div class="evidence-card">
            <img src="${file.dataUrl}" alt="${this.escape(file.nombre)}" />
            <div class="evidence-caption">${this.escape(file.nombre)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  buildActivityItems(activities = []) {
    if (!activities.length) return '<p class="muted">Sin actividades registradas.</p>';

    return activities.map((activity, index) => `
      <div class="box activity-box">
        <span class="box-title">2.1.${index + 1} ${this.escape(activity.titulo || `Actividad ${index + 1}`)}</span>
        <div class="sub-title">Actividad</div>
        <div class="text-content">${this.escape(activity.descripcion || '')}</div>
        <div class="sub-title">Evidencia textual</div>
        <div class="text-content">${this.escape(activity.evidencia_textual || '')}</div>
      </div>
    `).join('');
  }

  linkedActivityTitle(activityId, activities = []) {
    const index = activities.findIndex((activity) => activity.id === activityId);
    if (index < 0) return '';
    return `Actividad ${index + 1}`;
  }

  documentTitle(data) {
    if (data.rolNombre === 'Supervisor' && data.tipoInforme.frecuencia === 'MENSUAL') {
      return 'INFORME MENSUAL SUPERVISOR DE PROYECTO DE VINCULACIÓN CON LA SOCIEDAD';
    }

    return data.tipoInforme.nombre;
  }

  buildHeaderTemplate(data) {
    const logo = this.logoDataUrl();
    const title = this.documentTitle(data);

    return `
      <div style="width:100%; padding:8mm 16mm 0 16mm; font-family:Arial, Helvetica, sans-serif; color:#000;">
        <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:11px; line-height:1.2;">
          <tr>
            <td rowspan="3" style="width:38mm; height:31mm; border:1px solid #000; text-align:center; vertical-align:middle; overflow:hidden; background:#fff;">
              ${logo ? `<img src="${logo}" style="width:95mm; max-width:none; height:auto; display:block; transform:translateX(1mm);" />` : '<strong>ULEAM</strong>'}
            </td>
            <td style="border:1px solid #000; padding:3px 7px; vertical-align:top;">
              <strong style="font-size:12px;">NOMBRE DEL DOCUMENTO:</strong><br />
              <span style="font-size:12px; text-transform:uppercase;">${this.escape(title)}</span>
            </td>
            <td style="width:42mm; border:1px solid #000; padding:3px 7px; vertical-align:top; text-align:center;">
              <strong style="font-size:12px;">CÓDIGO: ${this.escape(data.tipoInforme.codigo)}</strong>
            </td>
          </tr>
          <tr>
            <td rowspan="2" style="border:1px solid #000; padding:3px 7px; vertical-align:top;">
              <strong style="font-size:12px;">PROCEDIMIENTO:</strong><br />
              <span style="font-size:12px; text-transform:uppercase;">EJECUCIÓN Y MONITOREO DE PROYECTOS DE INTERVENCIÓN SOCIAL.</span>
            </td>
            <td style="border:1px solid #000; padding:3px 7px; text-align:center;">
              <strong style="font-size:12px;">VERSIÓN: 1</strong>
            </td>
          </tr>
          <tr>
            <td style="border:1px solid #000; padding:3px 7px; text-align:center; font-size:12px;">
              Página <span class="pageNumber"></span> de <span class="totalPages"></span>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  buildHtml(data) {
    const observations = data.observaciones || [];
    const title = this.documentTitle(data);

    return `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            font-size: 10.5px;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 2mm;
          }
          .info-table td {
            border: 1px solid #111;
            padding: 5px 6px;
            vertical-align: middle;
            word-break: break-word;
          }
          .label {
            width: 38mm;
            font-weight: bold;
            background: #f3f4f6;
          }
          .title {
            margin: 0 0 7mm;
            text-align: center;
            text-transform: uppercase;
            page-break-inside: avoid;
          }
          .title .campus,
          .title .career {
            font-size: 17px;
            line-height: 1.15;
            font-weight: bold;
          }
          .title h1 {
            margin: 2mm auto 6mm;
            max-width: 165mm;
            font-size: 17px;
            line-height: 1.15;
          }
          .title .period { font-size: 15px; font-weight: bold; }
          h2 {
            font-size: 12px;
            margin: 6mm 0 2mm;
            font-weight: bold;
            page-break-after: avoid;
          }
          .box {
            border: 1px solid #555;
            padding: 3mm;
            margin-bottom: 3mm;
            word-break: break-word;
          }
          .box-title {
            display: block;
            margin-bottom: 1.5mm;
            font-weight: bold;
          }
          .sub-title {
            margin-top: 2mm;
            margin-bottom: 0.8mm;
            font-weight: bold;
          }
          .text-content {
            min-height: 5mm;
            white-space: pre-wrap;
          }
          .two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
          }
          .activity-box { page-break-inside: avoid; }
          .evidence-box { min-height: 30mm; page-break-inside: avoid; }
          .observation-box { page-break-inside: avoid; }
          .muted {
            color: #4b5563;
            font-style: italic;
          }
          .evidence-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 3mm;
            margin-top: 2mm;
          }
          .evidence-card {
            border: 1px solid #d1d5db;
            padding: 2mm;
            page-break-inside: avoid;
          }
          .evidence-card img {
            width: 100%;
            height: 46mm;
            object-fit: contain;
            display: block;
            background: #fff;
          }
          .evidence-caption {
            margin-top: 2mm;
            font-size: 8px;
            color: #374151;
            word-break: break-word;
          }
          .signature {
            margin-top: 12mm;
            text-align: center;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 70mm;
            border-top: 1px solid #111827;
            margin: 0 auto 2mm;
          }
        </style>
      </head>
      <body>
        <section class="title">
          <div class="campus">EXTENSION EL CARMEN</div>
          <div class="career">CARRERA DE ${this.escape(data.carrera.nombre)}</div>
          <h1>${this.escape(title)}</h1>
          <div class="period">${this.escape(data.periodoTexto)}</div>
        </section>

        <h2>1. Informacion General:</h2>
        <table class="info-table">
          <tr><td class="label">Unidad Academica:</td><td>Extension El Carmen</td></tr>
          <tr><td class="label">Carrera:</td><td>${this.escape(data.carrera.nombre)}</td></tr>
          <tr><td class="label">Nombre del proyecto:</td><td>${this.escape(data.proyecto.nombre)}</td></tr>
          <tr><td class="label">Nombre del docente:</td><td>${this.escape(data.docente.nombreCompleto)}</td></tr>
          <tr><td class="label">Fecha emision:</td><td>${this.escape(data.fechaEmision)}</td></tr>
        </table>

        <h2>2. Actividades realizadas:</h2>
        ${this.buildActivityItems(data.actividades.items || [])}
        <div class="two-cols">
          <div class="box"><span class="box-title">Beneficiarios</span>${this.escape(data.actividades.beneficiarios)}</div>
          <div class="box"><span class="box-title">Zona donde hacen la vinculacion</span>${this.escape(data.actividades.zona)}</div>
        </div>

        <h2>3. Observaciones:</h2>
        ${observations.map((item, index) => `
          <div class="box observation-box">
            <span class="box-title">${index + 1}. ${this.escape(item.titulo)}</span>
            ${item.id_actividad ? `<div class="muted">${this.escape(this.linkedActivityTitle(item.id_actividad, data.actividades.items || []))}</div>` : ''}
            <div class="text-content">${this.escape(item.detalle || '')}</div>
            ${this.buildEvidenceGrid(item.evidencias || [])}
          </div>
        `).join('')}

        <div class="signature">
          <div class="signature-line"></div>
          <strong>${this.escape(data.docente.nombreCompleto)}</strong><br />
          ${this.escape(data.carrera.nombre)} (${this.escape(data.rolNombre)})
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = VinculacionPdfGenerator;

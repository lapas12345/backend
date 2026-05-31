const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(`
    <html>
      <body style="font-family:Arial;">
        <h1>Página 1</h1>
        <div style="page-break-after:always;"></div>
        <h1>Página 2</h1>
      </body>
    </html>
  `);
  
  const pdf = await page.pdf({
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:12px;width:100%;text-align:center;color:red;border-top:1px solid black;padding-top:5px;">TEST FOOTER - Pág. <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
    margin: { top: '2cm', bottom: '3cm', left: '2cm', right: '2cm' }
  });
  
  fs.writeFileSync('test-footer.pdf', pdf);
  console.log('✅ PDF de prueba generado: test-footer.pdf');
  await browser.close();
})();
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const os = require("os");

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

async function generatePDF(html, userId) {
  const filename = `portfolio_${userId}_${Date.now()}.pdf`;
  const filepath = path.join(os.tmpdir(), filename);

  const browser = await getBrowser();
  let page;

  try {
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: filepath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" }
    });

    return filepath;
  } catch (err) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (_) {}
    throw err;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

// Ensure the browser is closed when the process exits
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close().catch(() => {});
  }
});

module.exports = generatePDF;

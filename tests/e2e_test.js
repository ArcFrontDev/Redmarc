const puppeteer = require('puppeteer');
const path = require('path');

async function runE2E() {
  console.log('Starting E2E Browser Test...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Go to Login page
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    // 2. Login
    console.log('Logging in...');
    await page.type('#username', 'admin');
    await page.type('#password', 'vhN7PeReesuJu6P');
    await Promise.all([
      page.click('input[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // 3. Go to Redmarc
    console.log('Navigating to Redmarc...');
    await page.goto('http://localhost:3000/redmarc', { waitUntil: 'networkidle2' });

    // 4. Wait for Kanban Board to render
    console.log('Waiting for Kanban board to render...');
    try {
      await page.waitForSelector('.kanban-column', { timeout: 10000 });
      
      // Check if there are columns
      const columns = await page.$$('.kanban-column');
      console.log(`✅ Found ${columns.length} Kanban columns`);

      // 5. Take screenshot
      const screenshotPath = path.join('C:\\Users\\smipp\\.gemini\\antigravity\\brain\\effa325f-fd79-4c19-b622-11b513cf6f47\\', 'redmarc_e2e_screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ Screenshot saved to ${screenshotPath}`);

      console.log('🎉 E2E Browser Tests passed successfully!');
    } catch (err) {
      console.error('Timeout waiting for kanban-column. Taking error screenshot...');
      const screenshotPath = path.join('C:\\Users\\smipp\\.gemini\\antigravity\\brain\\effa325f-fd79-4c19-b622-11b513cf6f47\\', 'redmarc_e2e_error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      throw err;
    }
  } catch (err) {
    console.error('❌ E2E Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runE2E();

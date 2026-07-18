const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/signup', { waitUntil: 'networkidle0' });
  
  const html = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log('ROOT HTML:', html);
  
  await browser.close();
})();

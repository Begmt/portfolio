// Финальные кадры без движения: анимации отключены только в контексте захвата.
const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(__dirname,`final-hero-${width}.png`)});
  await page.screenshot({path:path.join(__dirname,`final-full-${width}.png`),fullPage:true});
  await page.locator('#ecosystem-map').screenshot({path:path.join(__dirname,`final-ecosystem-${width}.png`)});
  await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

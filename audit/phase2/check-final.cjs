const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[];
 try{
  const touch=await browser.newContext({viewport:{width:390,height:900},isMobile:true,hasTouch:true,reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
  const page=await touch.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  assert.equal(await page.evaluate(()=>matchMedia('(pointer:fine)').matches),false);await page.locator('[data-scenario=order]').tap();assert.match(await page.locator('#eco-terminal-body').innerText(),/inventory/);
  await page.locator('#cta-primary').tap();await page.locator('#wizard-next').tap();await page.locator('#wizard-next').tap();await page.locator('#calc-copy-btn').tap();assert.equal(await page.locator('#toast').evaluate(el=>el.matches(':popover-open')),true);assert.equal(await page.locator('#calculator-modal').evaluate(el=>el.open),true);
  await page.locator('#toast').screenshot({path:path.join(__dirname,'toast.png')});await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+k');assert.equal(await page.locator('#command-palette').isVisible(),true);await page.locator('#command-search').fill('несуществующее');assert.equal(await page.locator('#command-empty').isVisible(),true);await page.keyboard.press('Escape');
  await page.locator('#theme-toggle').tap();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await page.screenshot({path:path.join(__dirname,'final-light-390.png')});
  await page.locator('#theme-toggle').tap();await page.screenshot({path:path.join(__dirname,'final-dark-390.png')});
  const normal=await browser.newPage({viewport:{width:1440,height:900}});normal.on('pageerror',e=>errors.push(e.message));await normal.goto('http://127.0.0.1:8765/');await normal.waitForTimeout(1400);assert.equal(await normal.locator('#boot-status').isVisible(),false);assert.equal(await normal.evaluate(()=>sessionStorage.getItem('portfolio-boot')),'1');
  await normal.locator('#ecosystem-map').scrollIntoViewIfNeeded();await normal.locator('#eco-play').click();await normal.locator('[data-scenario=order]').click();await normal.waitForTimeout(1500);assert.equal(await normal.locator('[data-node="node-moysklad"] animateMotion').getAttribute('keyPoints'),'1;0');
  await normal.emulateMedia({reducedMotion:'reduce'});await normal.locator('#roi').screenshot({path:path.join(__dirname,'final-roi-dark.png')});await normal.locator('#theme-toggle').click();await normal.screenshot({path:path.join(__dirname,'final-light-1440.png')});
  assert.deepEqual(errors,[]);const result={touch:true,toastAboveDialog:true,metaK:true,themePersistence:true,bootOneSession:true,outgoingPackets:true,errors};fs.writeFileSync(path.join(__dirname,'final-results.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

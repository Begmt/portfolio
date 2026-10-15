const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results={widths:[],errors:[],requests:[]};
 try {
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
  for(const width of [360,390,768,1024,1440]){
   const page=await context.newPage();await page.setViewportSize({width,height:900});
   page.on('pageerror',e=>results.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)results.requests.push([r.url(),r.status()]);});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.deepEqual(results.errors,[],'Ошибки инициализации');
   const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,small:[...document.querySelectorAll('button,a[href],summary')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);}).map(el=>el.id||el.textContent)}));
   assert.equal(geometry.scrollWidth,width);assert.deepEqual(geometry.small,[]);
   await page.screenshot({path:path.join(__dirname,`hero-${width}.png`)});
   await page.locator('[data-scenario="order"]').click();assert.match(await page.locator('#eco-terminal-body').innerText(),/ДЕМО.*POST \/bitrix\/event/);
   await page.locator('[data-scenario="call"]').click();assert.match(await page.locator('#eco-terminal-body').innerText(),/telephony\/call/);
   await page.locator('[data-scenario="payment"]').click();assert.ok(await page.locator('#eco-terminal-body .console-log-entry').count()<=12);
   await page.locator('[data-filter="bitrix"]').click();assert.equal(await page.locator('.case-card:visible').count(),1);
   await page.locator('[data-filter="amo"]').click();assert.equal(await page.locator('.case-card:visible').count(),2);
   await page.locator('[data-filter="all"]').click();assert.equal(await page.locator('.case-card:visible').count(),3);
   await page.locator('#case-1 .case-toggle').click();assert.equal(await page.locator('#case-expand-1').getAttribute('aria-hidden'),'false');
   const size=await page.locator('#case-expand-1').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));assert.equal(size.height,size.scroll);
   await page.locator('#case-1').screenshot({path:path.join(__dirname,`case-${width}.png`)});
   await page.locator('#case-1 .screenshot-placeholder').click();assert.equal(await page.locator('#case-lightbox').isVisible(),true);await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>document.activeElement.className),'screenshot-placeholder');
   await page.locator('[data-process="auto"]').click();assert.equal(await page.locator('#process-time').innerText(),'2');assert.equal(await page.locator('.process-steps .done').count(),4);
   await page.locator('[data-process="manual"]').click();assert.equal(await page.locator('#process-time').innerText(),'15');
   await page.locator('#roi-people').fill('2');await page.locator('#roi-hours').fill('10');await page.locator('#roi-rate').fill('100');
   assert.equal(Number(await page.locator('#roi-year-hours').getAttribute('data-current')),1040);assert.equal(Number(await page.locator('#roi-year-money').getAttribute('data-current')),104000);
   await page.locator('#roi-hours').fill('169');assert.equal(await page.locator('#roi-year-hours').innerText(),'—');await page.locator('#roi-hours').fill('10');
   await page.locator('#cta-primary').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');
   assert.equal(await page.locator('[data-wizard-step="0"]').isVisible(),true);assert.equal(await page.locator('#calc-ms').isVisible(),false);
   await page.locator('input[name="calc-crm"][value="amo"]').check();await page.locator('#wizard-next').click();await page.locator('#calc-custom').check();
   assert.equal(await page.locator('#calc-connections').innerText(),'5 шт.');assert.equal(await page.locator('#calc-duration').innerText(),'21–25 дней');
   assert.match(await page.locator('#architecture-preview').innerText(),/amoCRM/);
   await page.locator('#wizard-next').click();await page.locator('#request-contact').fill('Тест <контакт>');assert.match(await page.locator('#request-text').inputValue(),/Тест <контакт>/);
   await page.screenshot({path:path.join(__dirname,`wizard-${width}.png`)});
   await page.locator('#calc-submit-btn').click();assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),await page.locator('#request-text').inputValue());
   await page.locator('#calc-copy-btn').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#calculator-modal').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'cta-primary');
   await page.keyboard.press('Control+k');assert.equal(await page.locator('#command-palette').isVisible(),true);await page.locator('#command-search').fill('ROI');await page.keyboard.press('Enter');await page.waitForURL('**/#roi');
   await page.locator('#terminal-command').fill('help');await page.locator('#terminal-command').press('Enter');assert.match(await page.locator('#terminal-output').innerText(),/cases/);
   await page.locator('#terminal-command').fill('stack');await page.locator('#terminal-command').press('Enter');assert.equal(new URL(page.url()).hash,'#ecosystem');
   await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await page.screenshot({path:path.join(__dirname,`light-${width}.png`)});await page.locator('#theme-toggle').click();
   await page.screenshot({path:path.join(__dirname,`full-${width}.png`),fullPage:true});
   results.widths.push({...geometry,scenarios:true,filters:true,lightbox:true,roi:true,wizard:true,clipboard:true,palette:true,terminal:true,theme:true});await page.close();
  }
  assert.deepEqual(results.errors,[]);assert.deepEqual(results.requests,[]);
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:900}});await nojs.goto('http://127.0.0.1:8765/');
  assert.deepEqual(await nojs.locator('.stat-number').allTextContents(),['150','99.9','7','50']);assert.equal(await nojs.locator('#case-expand-1').isVisible(),true);assert.equal(await nojs.locator('#roi').isVisible(),true);
  await nojs.screenshot({path:path.join(__dirname,'nojs-390.png'),fullPage:true});results.noJS=true;
  const normal=await browser.newPage({viewport:{width:1440,height:900}});await normal.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await normal.waitForTimeout(300);assert.equal(await normal.locator('#hero').getAttribute('data-motion-running'),'true');
  await normal.locator('#roi').scrollIntoViewIfNeeded();await normal.waitForTimeout(300);assert.equal(await normal.locator('#hero').getAttribute('data-motion-running'),'false');
  await normal.emulateMedia({reducedMotion:'reduce'});assert.equal(await normal.locator('.ticker-track').evaluate(el=>getComputedStyle(el).animationName),'none');results.motionLifecycle=true;
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

// Поведенческие проверки критичных исправлений фазы 1, без внешних отправок.
const {chromium} = require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results = {widths:[], errors:[], failedRequests:[]};
 for (const width of [360,390,768,1024,1440]) {
  const page = await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>results.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)results.failedRequests.push({url:r.url(),status:r.status()});});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(__dirname,`hero-${width}.png`)});
  const dimensions = await page.evaluate(()=>{
   const center=document.querySelector('.eco-center').getBoundingClientRect();
   const overlaps=[...document.querySelectorAll('.eco-satellite')].filter(el=>{const r=el.getBoundingClientRect();return r.left<center.right&&r.right>center.left&&r.top<center.bottom&&r.bottom>center.top;}).map(el=>el.id);
   const smallTargets=[...document.querySelectorAll('a,button,summary')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);}).map(el=>el.id||el.textContent.trim());
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overlaps,smallTargets};
  });
  assert.equal(dimensions.scrollWidth,width,'Горизонтальная прокрутка');assert.deepEqual(dimensions.overlaps,[],'Пересечение узлов');
  assert.deepEqual(dimensions.smallTargets,[],'Тап-зоны меньше 44px');
  if(width<=768){
   await page.locator('#mobile-menu-btn').click();assert.equal(await page.locator('#mobile-menu-btn').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-menu').isVisible(),false);
   await page.locator('#mobile-menu-btn').click();await page.locator('#mobile-menu a[href="#cases"]').click();
  } else await page.locator('.nav-link[href="#cases"]').click();
  assert.equal(new URL(page.url()).hash,'#cases');
  await page.locator('#case-1 .case-toggle').click();
  const caseSize=await page.locator('#case-expand-1').evaluate(el=>({height:el.clientHeight,content:el.scrollHeight}));
  assert.equal(caseSize.height,caseSize.content,'Обрезан кейс');
  await page.locator('#case-1').screenshot({path:path.join(__dirname,`case-${width}.png`)});
  await page.locator('#node-bitrix').click();assert.match(await page.locator('#eco-terminal-body').innerText(),/ДЕМО.*bitrix/);
  await page.locator('#tab-py').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#code-py').isVisible(),true);
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#code-php').isVisible(),true);
  await page.locator('#cta-primary').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'calc-submit-btn');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');
  assert.equal(await page.locator('#calc-duration').innerText(),'15–19 дней');
  await page.locator('#calc-custom').check();assert.equal(await page.locator('#calc-connections').innerText(),'5 шт.');
  assert.match(await page.locator('#request-text').inputValue(),/Кастомные интеграции/);
  await page.screenshot({path:path.join(__dirname,`modal-${width}.png`)});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#calculator-modal').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'cta-primary');
  await page.locator('#cta-primary').click();await page.locator('#modal-close-btn').click();assert.equal(await page.locator('#calculator-modal').isVisible(),false);
  await page.locator('#cta-primary').click();await page.mouse.click(2,2);assert.equal(await page.locator('#calculator-modal').isVisible(),false);
  for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(60);}
  await page.waitForTimeout(1100);
  assert.deepEqual(await page.locator('.stat-number').allTextContents(),['150','99.9','7','50']);
  await page.screenshot({path:path.join(__dirname,`full-${width}.png`),fullPage:true});
  results.widths.push({...dimensions,caseSize,keyboard:true,dialog:true,counterValues:true});await page.close();
 }
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();await page.goto('http://127.0.0.1:8765/');await page.locator('#cta-primary').click();await page.locator('#calc-submit-btn').click();
 assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),await page.locator('#request-text').inputValue());
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true}));
 await page.locator('#calc-submit-btn').click();assert.match(await page.locator('#copy-status').innerText(),/недоступно/);
 results.clipboard={success:true,deniedFallback:true};
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:900}});await nojs.goto('http://127.0.0.1:8765/');
 assert.deepEqual(await nojs.locator('.stat-number').allTextContents(),['150','99.9','7','50']);
 assert.equal(await nojs.locator('#case-expand-1').isVisible(),true);assert.equal(await nojs.locator('#contact').isVisible(),true);
 results.noJS=await nojs.evaluate(()=>({hiddenContent:[...document.querySelectorAll('.animate-on-scroll')].filter(el=>getComputedStyle(el).opacity==='0').length,stats:[...document.querySelectorAll('.stat-number')].map(el=>el.textContent)}));
 assert.equal(results.noJS.hiddenContent,0);await nojs.screenshot({path:path.join(__dirname,'nojs-390.png'),fullPage:true});
 const reduce=await browser.newPage({reducedMotion:'reduce'});await reduce.goto('http://127.0.0.1:8765/');
 results.reducedMotion=await reduce.evaluate(()=>({ticker:getComputedStyle(document.querySelector('.ticker-track')).animationName,canvas:getComputedStyle(document.querySelector('canvas')).display}));
 assert.deepEqual(results.reducedMotion,{ticker:'none',canvas:'none'});
 assert.deepEqual(results.errors,[]);assert.deepEqual(results.failedRequests,[]);
 fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});

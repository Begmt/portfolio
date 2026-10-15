const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],result={};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});await page.waitForTimeout(500);
  await page.mouse.move(4,800);await page.waitForFunction(()=>document.querySelector('.hero-visual').dataset.motionRunning==='true');
  const first=await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang');
  await page.waitForTimeout(7400);assert.notEqual(await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang'),first);
  await page.locator('.hero-visual').hover();assert.equal(await page.locator('.hero-visual').getAttribute('data-motion-running'),'false');
  const paused=await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang');await page.waitForTimeout(7400);assert.equal(await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang'),paused);
  await page.locator('#tab-js').focus();await page.mouse.move(2,700);assert.equal(await page.locator('.hero-visual').getAttribute('data-motion-running'),'false');
  await page.locator('#cta-primary').focus();await page.waitForFunction(()=>document.querySelector('.hero-visual').dataset.motionRunning==='true');
  result.code={autoplay:true,hoverPause:true,focusPause:true};
  await page.locator('#ecosystem-map').scrollIntoViewIfNeeded();await page.mouse.move(2,2);await page.waitForTimeout(2600);assert.match(await page.locator('#eco-terminal-body').innerText(),/ДЕМО/);
  await page.locator('#eco-play').click();await page.mouse.move(2,2);await page.waitForTimeout(150);assert.equal(await page.locator('#ecosystem').getAttribute('data-motion-running'),'false');
  await page.locator('[data-scenario=payment]').click();await page.waitForTimeout(2600);assert.match(await page.locator('#eco-terminal-body').innerText(),/200 OK/);assert.ok(await page.locator('.console-log-entry').count()<=12);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  const logs=await page.locator('#eco-terminal-body').innerText();await page.waitForTimeout(500);assert.equal(await page.locator('#eco-terminal-body').innerText(),logs);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});result.ecosystem={auto:true,manual:true,userPause:true,simulatedHiddenPause:true};
  await page.locator('#before-after').scrollIntoViewIfNeeded();assert.equal(await page.locator('#floating-contact').isVisible(),true);
  await page.locator('[data-process=auto]').click();await page.waitForTimeout(650);assert.equal(await page.locator('#process-time').innerText(),'2');
  await page.locator('#case-filters').scrollIntoViewIfNeeded();await page.locator('#case-1 .case-toggle').click();await page.waitForTimeout(650);
  assert.equal(await page.locator('#case-expand-1').getAttribute('aria-hidden'),'false');assert.equal(await page.locator('#case-1 .case-count[data-value="7"]').innerText(),'7');
  const openHeight=await page.locator('#case-expand-1').evaluate(el=>el.clientHeight);assert.ok(openHeight>0);
  await page.locator('#case-1 .case-toggle').click();await page.waitForTimeout(400);assert.equal(await page.locator('#case-expand-1').evaluate(el=>el.clientHeight),0);result.cases={animatedGrid:true,finalMetrics:true};
  await page.locator('#contact').scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal(await page.locator('#floating-contact').isVisible(),false);
  assert.ok(Number(await page.locator('#scroll-progress').evaluate(el=>getComputedStyle(el).transform.match(/matrix\(([^,]+)/)[1]))>0);
  result.floating=true;result.progress=true;
  const fixture=await browser.newContext({reducedMotion:'reduce'});await fixture.route('**/script.js',async route=>{const response=await route.fetch();const body=(await response.text()).replace("telegram: '[ВСТАВИТЬ TELEGRAM]'","telegram: 'https://t.me/TEST_CONTACT_PLACEHOLDER'").replace("whatsapp: '[ВСТАВИТЬ WHATSAPP]'","whatsapp: 'https://wa.me/10000000000'").replace('available: null, caseImages: {}',"available: true, caseImages: {1:{src:'social-card.png',alt:'Тестовый макет, не скриншот кейса'}}");await route.fulfill({response,body});});
  const send=await fixture.newPage();send.on('pageerror',e=>errors.push(e.message));await send.addInitScript(()=>{window.__opened=[];window.open=(url)=>{window.__opened.push(url);return null;};});await send.goto('http://127.0.0.1:8765/');
  assert.equal(await send.locator('#availability').innerText(),'Доступен для проектов');
  await send.locator('#cta-primary').click();await send.locator('#wizard-next').click();await send.locator('#wizard-next').click();await send.locator('#request-contact').fill('Тест + <>&');
  for(const channel of ['telegram','whatsapp']){await send.locator(`input[name=request-channel][value=${channel}]`).check();await send.locator('#calc-submit-btn').click();const url=new URL(await send.evaluate(()=>window.__opened.at(-1)));assert.equal(url.hostname,channel==='telegram'?'t.me':'wa.me');assert.equal(url.searchParams.get('text'),await send.locator('#request-text').inputValue());}
  await send.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true}));await send.locator('#calc-copy-btn').click();assert.match(await send.locator('#copy-status').innerText(),/недоступно/);await send.keyboard.press('Escape');
  await send.locator('#case-1 .case-toggle').click();await send.locator('#case-1 .screenshot-placeholder').click();await send.locator('#lightbox-content img').waitFor();assert.equal(await send.locator('#lightbox-content img').evaluate(el=>el.complete&&el.naturalWidth>0),true);await send.keyboard.press('Escape');
  result.send={telegram:true,whatsapp:true,encodedText:true,noExternalNavigation:true,clipboardDenied:true,configuredLightbox:true,availabilityConfig:true};
  const blocked=await browser.newContext({reducedMotion:'reduce'});await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}});Object.defineProperty(window,'sessionStorage',{get(){throw new Error('blocked')}});});const bp=await blocked.newPage();await bp.setViewportSize({width:1440,height:900});bp.on('pageerror',e=>errors.push(e.message));await bp.goto('http://127.0.0.1:8765/');await bp.locator('#theme-toggle').click();assert.equal(await bp.locator('html').getAttribute('data-theme'),'light');result.blockedStorage=true;
  await bp.screenshot({path:path.join(__dirname,'light-hero-1440.png')});await bp.locator('#roi').screenshot({path:path.join(__dirname,'roi-light.png')});
  assert.deepEqual(errors,[]);result.errors=errors;fs.writeFileSync(path.join(__dirname,'motion-results.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

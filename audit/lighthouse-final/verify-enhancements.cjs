const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',result={url:base,checks:[],errors:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
   await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   const label=await page.locator('#hero-typewriter').textContent();
   assert.equal(label,'// systems_architect_portfolio_2026');
   assert.equal(await page.locator('.eco-line-group').count(),0);
   assert.equal(await page.locator('.statement-ready').count(),0);
   assert.equal(await page.locator('.printed-code').count(),0);
   if(width<769)await page.locator('#mobile-menu-btn').click();
   await page.locator(width<769?'.mobile-link[href="#ecosystem"]':'.nav-link[href="#ecosystem"]').click();
   await page.waitForTimeout(2600);await page.waitForFunction(()=>document.querySelectorAll('.eco-line-group').length===4);
   await page.locator('.eco-stats').scrollIntoViewIfNeeded();await page.waitForTimeout(900);
   assert.equal(await page.locator('.stat-number[data-target]').evaluateAll(items=>items.every(e=>Math.abs(Number(e.dataset.current)-Number(e.dataset.target))<.001)),true);
   await page.locator('#design-statement').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.statement-ready .tagline-word'));
   await page.waitForTimeout(1000);
   assert.ok(await page.locator('.tagline-word.read').count()>0);
   await page.locator('.code-inspector>summary').click();await page.locator('.terminal-tabs').waitFor({state:'visible'});
   assert.equal(await page.locator('.printed-code').count(),3);
   await page.locator('#code-play').click();await page.locator('#tab-js').focus();await page.keyboard.press('End');
   assert.equal(await page.locator('#code-php').isVisible(),true);await page.keyboard.press('Home');
   assert.equal(await page.locator('#code-js').isVisible(),true);
   await page.locator('.code-inspector>summary').click();assert.equal(await page.locator('.code-inspector .terminal-window').isVisible(),false);
   await page.locator('.code-inspector>summary').click();await page.locator('.terminal-tabs').waitFor({state:'visible'});
   assert.equal(await page.locator('.printed-code').count(),3);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>!document.querySelector('.statement-ready')&&document.getElementById('code-play').disabled);
   assert.equal(await page.locator('#hero-typewriter').textContent(),label);
   assert.equal(await page.locator('.statement-ready').count(),0);
   assert.equal(await page.locator('#code-play').isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   result.checks.push({theme,width,lazySections:true,counters:true,statement:true,codeTabs:true,singleCodeInitialization:true,reduce:true});
   await context.close();
  }
  assert.deepEqual(result.errors,[]);
  fs.writeFileSync(`audit/lighthouse-final/${tag}-enhancement-checks.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',result={url:base,checks:[],errors:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   if(width<769)await page.locator('#mobile-menu-btn').click();await page.locator(width<769?'.mobile-link[href="#cases"]':'.nav-link[href="#cases"]').click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.case-card')].every(e=>e.checkVisibility({contentVisibilityAuto:true})));
   const boxes=await page.locator('.case-card').evaluateAll(items=>items.map(e=>e.getBoundingClientRect().toJSON()));assert.equal(boxes.length,3);
   if(width>1023){assert.ok(Math.max(...boxes.map(b=>b.y))-Math.min(...boxes.map(b=>b.y))<1);assert.ok(Math.max(...boxes.map(b=>b.height))-Math.min(...boxes.map(b=>b.height))<1);assert.ok(boxes[0].right<boxes[1].x&&boxes[1].right<boxes[2].x);}
   else for(let i=1;i<3;i++){assert.ok(Math.abs(boxes[i].x-boxes[0].x)<1);assert.ok(Math.abs(boxes[i].y-boxes[i-1].bottom-16)<1);}
   await page.locator('#cases').screenshot({path:`audit/lighthouse-final/${tag}-${theme}-${width}-compact-cases.png`});
   for(let id=1;id<=3;id++){
    await page.locator(`#case-${id} .case-toggle`).click();assert.equal(await page.locator(`#case-${id} .case-toggle`).getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator(`#case-expand-${id} .case-pipeline`).isVisible(),true);assert.ok(await page.locator(`#case-expand-${id}`).evaluate(e=>e.clientHeight>150&&e.clientHeight===e.scrollHeight));
    await page.locator(`#case-${id} .case-toggle`).click();assert.equal(await page.locator(`#case-${id} .case-toggle`).getAttribute('aria-expanded'),'false');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);result.checks.push({theme,width,threeCards:true,grid:true,equalDesktopHeights:true,allDetails:true,noOverflow:true});await context.close();
  }
  assert.deepEqual(result.errors,[]);fs.writeFileSync(`audit/lighthouse-final/${tag}-compact-case-checks.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

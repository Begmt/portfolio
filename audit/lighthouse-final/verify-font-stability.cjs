const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',result={url:base,fontDelayMs:1200,checks:[],errors:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [412,1440]){
   const context=await browser.newContext({viewport:{width,height:823},reducedMotion:'no-preference'});
   await context.addInitScript(theme=>{localStorage.setItem('portfolio-theme',theme);window.__fontShifts=[];new PerformanceObserver(list=>list.getEntries().forEach(entry=>{if(!entry.hadRecentInput)window.__fontShifts.push({value:entry.value,time:entry.startTime});})).observe({type:'layout-shift',buffered:true});},theme);
   await context.route('**/assets/fonts/*.woff2',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});
   const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForTimeout(350);
   assert.equal(await page.evaluate(()=>document.fonts.status),'loading');
   const before=await page.locator('.hero-cta-group').boundingBox();assert.ok(before&&before.height>0);
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350);
   const after=await page.locator('.hero-cta-group').boundingBox(),shifts=await page.evaluate(()=>window.__fontShifts),CLS=shifts.reduce((sum,item)=>sum+item.value,0);
   for(const key of ['x','y','width','height'])assert.ok(Math.abs(after[key]-before[key])<1,`${theme}:${width}: CTA ${key} changed`);
   assert.ok(CLS<.1,`${theme}:${width}: CLS ${CLS}`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   await page.screenshot({path:`audit/lighthouse-final/${tag}-${theme}-${width}-delayed-fonts.png`});result.checks.push({theme,width,CLS,before,after,shifts,noOverflow:true});await context.close();
  }
  assert.deepEqual(result.errors,[]);fs.writeFileSync(`audit/lighthouse-final/${tag}-font-stability.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});

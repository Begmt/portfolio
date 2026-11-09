const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',result={url:base,checks:[],errors:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [390,1440])for(const id of ['workflow','case-3']){
   const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
   await page.goto(base+'#'+id,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2600);
   const top=await page.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top);assert.ok(Math.abs(top-110)<2,`${theme}:${width}:${id} at ${top}`);
   await page.waitForTimeout(500);const stable=await page.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top);assert.ok(Math.abs(stable-top)<1);
   result.checks.push({theme,width,id,top,stable});await context.close();
  }
  assert.deepEqual(result.errors,[]);fs.writeFileSync(`audit/lighthouse-final/${tag}-deep-links.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

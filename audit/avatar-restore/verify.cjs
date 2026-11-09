const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',dir='audit/avatar-restore';
 const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),asset='assets/guide/avatar-384.webp',original=execFileSync('git',['show','392c614:'+asset]);
 assert.equal(digest(fs.readFileSync(asset)),digest(original));
 const result={url:base,originalCommit:'392c614',avatarSHA256:digest(original),checks:[],errors:[],httpErrors:[],unwantedRequests:[],violations:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [320,390,769,1440]){
   const height=width===320?600:1000,context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));page.on('response',response=>{if(response.status()>=400)result.httpErrors.push(response.status()+': '+response.url());});page.on('request',request=>{if(/avatar3d|three-r187/.test(request.url()))result.unwantedRequests.push(request.url());});
   await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>{prepareSection(document.getElementById('about'));document.getElementById('about').scrollIntoView({behavior:'instant'});});
   const image=page.locator('.guide-profile>img');await image.evaluate(image=>image.decode());
   assert.equal(await page.locator('#avatar-canvas,#avatar-wave,#avatar-listen').count(),0);assert.equal(await image.getAttribute('src'),asset);assert.equal(await image.evaluate(image=>image.naturalWidth),384);
   const response=await page.request.get(new URL(asset,base).href);assert.equal(response.status(),200);assert.equal(digest(await response.body()),digest(original));
   const copy=await page.locator('#about').innerText();assert.ok(!/Покрутите|Потяните|Слушаю вас|Помахать/.test(copy));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   await page.locator('.guide-profile-action').click();await page.waitForFunction(()=>document.getElementById('guide-progress').textContent.includes('9 из 10'));await page.keyboard.press('Escape');await page.locator('#portfolio-guide').waitFor({state:'hidden'});await page.mouse.move(width-4,120);await page.evaluate(()=>document.activeElement.blur());
   await page.addScriptTag({path:'audit/phase3/vendor/axe.min.js'});const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));result.violations.push(...axe.violations.map(item=>({theme,width,id:item.id})));
   if([390,1440].includes(width))await page.screenshot({path:`${dir}/${tag}-${theme}-${width}.png`});
   result.checks.push({theme,width,exactOriginal:true,noRejectedModel:true,guideWorks:true,noOverflow:true});await context.close();
  }
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.unwantedRequests,[]);assert.deepEqual(result.violations,[]);fs.writeFileSync(`${dir}/${tag}-checks.json`,JSON.stringify(result,null,2));console.log({checks:result.checks.length,exactOriginalSHA256:result.avatarSHA256,errors:[],httpErrors:[],unwantedRequests:[],violations:[]});
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

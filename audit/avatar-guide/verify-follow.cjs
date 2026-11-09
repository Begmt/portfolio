const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',dir='audit/avatar-guide';
 const result={url:base,checks:[],errors:[],httpErrors:[],violations:[]},ids=['hero','cases','projects','design-statement','ecosystem','before-after','roi','workflow','about','contact'];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [320,390,768,769,1440,1920]){
   const height=width===320?500:900,context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));page.on('response',response=>{if(response.status()>=400)result.httpErrors.push(response.status()+': '+response.url());});
   await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   const companion=page.locator('#scroll-guide'),note=page.locator('#guide-note');assert.equal(await note.isVisible(),false);
   assert.equal(await page.locator('.guide-walker').getAttribute('src'),null);
   await page.evaluate(()=>{document.querySelector('.nav-logo').focus({preventScroll:true});scrollTo({top:80,behavior:'instant'});});await page.waitForTimeout(220);
   assert.equal(await note.isVisible(),true);assert.equal(await companion.getAttribute('data-section'),'hero');assert.equal(await page.evaluate(()=>document.activeElement.className),'nav-logo');
   assert.equal(await page.locator('.guide-walker').evaluate(image=>image.complete&&image.naturalWidth===128),true);
   const texts=[];
   for(const id of ids){
    await page.evaluate(id=>{const section=document.getElementById(id);prepareSection(section);scrollTo({top:scrollY+section.getBoundingClientRect().top-120,behavior:'instant'});},id);await page.waitForTimeout(220);
    assert.equal(await companion.getAttribute('data-section'),id);assert.equal(await note.isVisible(),true);texts.push(await page.locator('#guide-note-copy').innerText());
    const rect=await companion.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1&&rect.y>=0&&rect.y+rect.height<=height,`${theme} ${width} ${id}: ${JSON.stringify(rect)}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   }
   assert.equal(new Set(texts).size,10);assert.equal(await companion.evaluate(element=>element.getAnimations({subtree:true}).length),0);
   await page.evaluate(()=>{const section=document.getElementById('cases');scrollTo({top:scrollY+section.getBoundingClientRect().top-120,behavior:'instant'});});await page.waitForTimeout(150);
   await page.locator('#guide-note [data-guide-open]').click();assert.ok((await page.locator('#guide-progress').innerText()).includes('2 из 10'));await companion.waitFor({state:'hidden'});await page.locator('.guide-close').click();await companion.waitFor({state:'visible'});
   if([390,1440].includes(width)){
    await page.addScriptTag({path:'audit/phase3/vendor/axe.min.js'});const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    result.violations.push(...axe.violations.map(item=>({theme,width,id:item.id,nodes:item.nodes.map(node=>node.target)})));
    await page.screenshot({path:`${dir}/${tag}-${theme}-${width}-following.png`});
   }
   await page.evaluate(()=>{const section=document.getElementById('roi');prepareSection(section);scrollTo({top:scrollY+section.getBoundingClientRect().top-120,behavior:'instant'});});await page.waitForTimeout(120);
   await page.locator('#roi-people').focus();await page.waitForTimeout(100);assert.equal(await companion.isVisible(),false);await page.locator('#roi-people').fill('3');await page.evaluate(()=>document.activeElement.blur());await page.waitForTimeout(100);assert.equal(await companion.isVisible(),true);
   await page.evaluate(()=>document.getElementById('cta-primary').click());assert.equal(await companion.isVisible(),false);await page.keyboard.press('Escape');await page.waitForTimeout(100);assert.equal(await companion.isVisible(),true);
   await page.locator('#guide-follow-dismiss').click();assert.equal(await companion.isVisible(),false);assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio-guide-hidden')),'1');
   await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>scrollTo({top:600,behavior:'instant'}));await page.waitForTimeout(100);assert.equal(await companion.isVisible(),false);
   await page.locator('.guide-invite').click();await page.locator('.guide-close').click();await page.waitForTimeout(150);assert.equal(await companion.isVisible(),true);
   result.checks.push({theme,width,height,blocks:10,uniqueExplanations:true,bounds:true,noFocusSteal:true,editing:true,dialog:true,dismissal:true,reopen:true,reducedMotion:true});await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>{prepareSection(document.getElementById('cases'));const section=document.getElementById('cases');scrollTo({top:scrollY+section.getBoundingClientRect().top-120,behavior:'instant'});});await page.waitForTimeout(300);
  const before=await page.locator('#scroll-guide').boundingBox();await page.evaluate(()=>scrollBy({top:150,behavior:'instant'}));
  await page.waitForFunction(()=>document.getElementById('scroll-guide').classList.contains('is-walking'),{},{polling:10});assert.ok(await page.locator('.guide-walker').evaluate(element=>element.getAnimations().some(animation=>animation.playState==='running')));
  await page.waitForTimeout(300);const after=await page.locator('#scroll-guide').boundingBox();assert.ok(Math.abs(before.x-after.x)>20);assert.equal(await page.locator('#scroll-guide').evaluate(element=>element.classList.contains('is-walking')),false);
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>scrollBy({top:30,behavior:'instant'}));await page.waitForTimeout(100);assert.equal(await page.locator('.guide-walker').evaluate(element=>element.getAnimations().length),0);assert.equal((await page.locator('#scroll-guide').boundingBox()).x,20);
  result.scrollMotion=true;result.motionStops=true;result.preferenceChange=true;await context.close();
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.violations,[]);fs.writeFileSync(`${dir}/${tag}-follow-checks.json`,JSON.stringify(result,null,2));console.log({checks:result.checks.length,blocksPerCheck:10,scrollMotion:true,motionStops:true,preferenceChange:true,errors:result.errors,httpErrors:result.httpErrors,violations:result.violations});
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

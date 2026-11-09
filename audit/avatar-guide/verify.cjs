const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',dir='audit/avatar-guide';
 const result={url:base,checks:[],errors:[],httpErrors:[],violations:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const theme of ['dark','light'])for(const width of [320,390,768,769,1440]){
   const height=width===320?500:900,context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));page.on('response',response=>{if(response.status()>=400)result.httpErrors.push(response.status()+': '+response.url());});
   await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   const panel=page.locator('#portfolio-guide'),launcher=page.locator(width<=768?'.guide-nav':'.guide-launcher');
   assert.equal(await panel.isVisible(),false);assert.equal(await page.locator('.guide-launcher').isVisible(),width>768);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   if([390,1440].includes(width))await page.screenshot({path:`${dir}/${tag}-${theme}-${width}-hero.png`});
   await launcher.click();await page.waitForFunction(()=>document.activeElement.classList.contains('guide-close'));
   assert.equal(await panel.isVisible(),true);assert.equal(await launcher.getAttribute('aria-expanded'),'true');
   assert.ok((await page.locator('#guide-progress').innerText()).includes('1 из 10'));
   const close=await page.locator('.guide-close').boundingBox();assert.ok(close.y>=0&&close.y+close.height<=height&&close.width>=44&&close.height>=44);
   assert.equal(await page.locator('#guide-back').isDisabled(),true);
   assert.equal(await panel.evaluate(element=>element.getAnimations({subtree:true}).length),0);
   if([390,1440].includes(width)){
    await page.addScriptTag({path:'audit/phase3/vendor/axe.min.js'});
    const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    result.violations.push(...axe.violations.map(item=>({theme,width,id:item.id,nodes:item.nodes.map(node=>node.target)})));
    await page.screenshot({path:`${dir}/${tag}-${theme}-${width}-open.png`});
   }
   for(const [offset,id]of ['cases','projects','design-statement','ecosystem','before-after','roi','workflow','about','contact'].entries()){
    await page.locator('#guide-next').click();await page.waitForTimeout(180);
    assert.equal(await page.evaluate(()=>location.hash),'#'+id);
    assert.ok((await page.locator('#guide-progress').innerText()).includes(`${offset+2} из 10`));
    const position=await page.locator('#'+id).evaluate(element=>element.getBoundingClientRect().top);assert.ok(Math.abs(position-110)<8||id==='contact',`${id}: ${position}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   }
   await page.locator('#guide-back').click();assert.equal(await page.evaluate(()=>location.hash),'#about');
   await page.keyboard.press('Escape');assert.equal(await panel.isVisible(),false);assert.equal(await launcher.getAttribute('aria-expanded'),'false');
   assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-guide-open]')),true);
   await launcher.click();assert.ok((await page.locator('#guide-progress').innerText()).includes('9 из 10'));
   await page.locator('.guide-close').click();await launcher.click();
   await page.locator('.guide-dismiss').click();assert.equal(await panel.isVisible(),false);assert.equal(await page.locator('.guide-launcher').isVisible(),false);
   await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.guide-launcher').isVisible(),false);
   const profile=page.locator('.guide-profile-action');await profile.scrollIntoViewIfNeeded();await profile.click();
   assert.ok((await page.locator('#guide-progress').innerText()).includes('9 из 10'));assert.equal(await page.evaluate(()=>localStorage.getItem('portfolio-guide-hidden')),null);
   if([390,1440].includes(width))await page.screenshot({path:`${dir}/${tag}-${theme}-${width}-profile.png`});
   await page.locator('#guide-next').click();await page.locator('#guide-next').click();assert.equal(await panel.isVisible(),false);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'btn-telegram');
   await launcher.click();await page.mouse.click(width-4,125);assert.equal(await panel.isVisible(),false);
   if(width<=768){
    await page.locator('#mobile-menu-btn').click();assert.equal(await page.locator('main').evaluate(element=>element.inert),true);
    await launcher.click();assert.equal(await panel.isVisible(),true);assert.equal(await page.locator('main').evaluate(element=>element.inert),false);
    await page.locator('#mobile-menu-btn').click();assert.equal(await panel.isVisible(),false);await page.keyboard.press('Escape');
   }
   await launcher.click();await page.evaluate(()=>document.getElementById('cta-primary').click());assert.equal(await panel.isVisible(),false);assert.equal(await page.locator('#calculator-modal').isVisible(),true);await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   result.checks.push({theme,width,height,tour:true,context:true,keyboard:true,escape:true,lightDismiss:true,dismissPersistence:true,menu:true,dialog:true,noOverflow:true});await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});await page.locator('.guide-nav').click();
  assert.ok(await page.locator('.guide-character').evaluate(element=>element.getAnimations().length>0));await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.guide-character').getAnimations().length===0,{},{polling:100});await context.close();
  const fallback=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await fallback.addInitScript(()=>{HTMLElement.prototype.showPopover=undefined;});
  const fp=await fallback.newPage();await fp.goto(base,{waitUntil:'networkidle'});await fp.locator('.guide-nav').click();assert.equal(await fp.locator('#portfolio-guide').isVisible(),true);await fp.keyboard.press('Escape');assert.equal(await fp.locator('#portfolio-guide').isVisible(),false);await fallback.close();
  const nojs=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false}),np=await nojs.newPage();await np.goto(base,{waitUntil:'networkidle'});
  assert.equal(await np.locator('[data-guide-open]:visible').count(),0);await np.locator('.guide-profile').scrollIntoViewIfNeeded();assert.equal(await np.locator('.guide-profile img').evaluate(element=>element.complete&&element.naturalWidth>0),true);await nojs.close();
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.violations,[]);
  result.reducedMotion=true;result.fallback=true;result.noJS=true;fs.writeFileSync(`${dir}/${tag}-checks.json`,JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

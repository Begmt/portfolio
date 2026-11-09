// Полный проход по темам/ширинам и критическим состояниям. Отправки не выполняются.
const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const result={axeVersion:null,cases:[],errors:[],httpErrors:[],violations:[]};
 try{
  for(const theme of ['dark','light'])for(const width of [360,390,768,1024,1440]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<769,permissions:['clipboard-read','clipboard-write']});
   await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)result.httpErrors.push(r.url());});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.addScriptTag({path:path.join(__dirname,'vendor/axe.min.js')});
   result.axeVersion=await page.evaluate(()=>axe.version);
   async function audit(state){
    const small=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],summary')].filter(el=>{
     if(el.closest('[inert]')||!el.checkVisibility({checkVisibilityCSS:true}))return false;
     const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);
    }).map(el=>({id:el.id||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
    assert.deepEqual(small,[],`${theme}/${width}/${state}: target size`);
    const a=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));result.violations.push(...a.violations.map(v=>({theme,width,state,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
   }
   function screenshot(name){return page.screenshot({path:path.join(__dirname,`${theme}-${width}-${name}.png`)});}
   const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cta:document.querySelector('#cta-primary').getBoundingClientRect().bottom,small:[...document.querySelectorAll('button,a[href],summary')].filter(el=>{if(el.closest('[inert]'))return false;const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);}).map(el=>el.id||el.textContent.trim())}));
   assert.equal(geometry.scroll,width);assert.deepEqual(geometry.small,[]);if(width<=390)assert.ok(geometry.cta<844);await audit('page');await screenshot('hero');
   if(width<=768){
    await page.locator('#mobile-menu-btn').click();assert.equal(await page.locator('main').evaluate(el=>el.inert),true);await audit('menu');
    await page.locator('#mobile-menu a').last().focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'mobile-menu-btn');
    await page.keyboard.press('Control+k');assert.equal(await page.locator('#mobile-menu').isVisible(),false);assert.equal(await page.locator('main').evaluate(el=>el.inert),false);assert.equal(await page.locator('#command-palette').isVisible(),true);await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'mobile-menu-btn');
   }
   await page.locator('.code-inspector>summary').click();await page.locator('#tab-js').focus();await page.keyboard.press('End');assert.equal(await page.locator('#code-php').isVisible(),true);await page.keyboard.press('Home');assert.equal(await page.locator('#code-js').isVisible(),true);await page.locator('.code-inspector>summary').click();
   await page.locator('[data-filter=bitrix]').click();assert.equal(await page.locator('.case-card:visible').count(),1);await page.locator('[data-filter=amo]').click();assert.equal(await page.locator('.case-card:visible').count(),2);await page.locator('[data-filter=all]').click();
   await page.locator('#case-1 .case-toggle').click();assert.equal(await page.locator('#case-expand-1').evaluate(el=>el.clientHeight===el.scrollHeight),true);
   await page.locator('#case-1 .screenshot-placeholder').click();await audit('lightbox');await page.keyboard.press('Escape');assert.equal(await page.locator('#case-1 .screenshot-placeholder').evaluate(el=>el===document.activeElement),true);
   await page.locator('[data-process=auto]').click();assert.equal(await page.locator('#process-time').innerText(),'2');assert.equal(await page.locator('.process-steps .done').count(),4);
   for(const [id,value] of [['roi-people','2'],['roi-hours','10'],['roi-rate','100']])await page.locator('#'+id).fill(value);
   assert.equal(await page.locator('#roi-year-money').getAttribute('data-current'),'104000');assert.equal(await page.locator('#roi-month-hours').getAttribute('data-current'),String(1040/12));
   await page.locator('#roi-hours').fill('169');assert.equal(await page.locator('.roi-results').isVisible(),false);await page.locator('#roi-hours').fill('10');
   await page.locator('#roi-people').fill('9007199254740992');assert.equal(await page.locator('.roi-results').isVisible(),false);await page.locator('#roi-people').fill('2');
   await page.locator('#cta-primary').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');await audit('wizard-crm');
   await page.locator('#wizard-next').click();await page.locator('#calc-custom').check();await page.locator('#wizard-next').click();await page.locator('#request-contact').fill('Тест + <контакт>');assert.equal(await page.locator('#calc-connections').innerText(),'5 шт.');await audit('wizard-contact');await screenshot('wizard');
   await page.locator('#calc-copy-btn').click();assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),await page.locator('#request-text').inputValue());
   await page.locator('#calc-copy-btn').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close-btn');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'cta-primary');
   await page.keyboard.press('Control+k');await page.locator('#command-search').fill('нет такого действия');await page.keyboard.press('Escape');assert.equal(await page.locator('#command-palette').isVisible(),false);
   await page.locator('#workflow').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollBy(0,300));await page.waitForTimeout(100);await audit('scrolled');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);assert.equal(overflow,width);
   result.cases.push({theme,...geometry,keyboard:true,dialogs:true,roi:true,clipboard:true});await context.close();
  }
  fs.writeFileSync(path.join(__dirname,'matrix-results.json'),JSON.stringify(result,null,2));
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.violations,[],JSON.stringify(result.violations,null,2));
  console.log({themes:2,widths:5,axeVersion:result.axeVersion,violations:result.violations.length,errors:result.errors});
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

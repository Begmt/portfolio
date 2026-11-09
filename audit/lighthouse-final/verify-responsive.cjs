const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const fs=require('fs'),assert=require('assert/strict');
(async()=>{const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',dir='audit/lighthouse-final';const result={url:base,checks:[],errors:[],httpErrors:[],violations:[]};
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
for(const theme of ['dark','light'])for(const width of [360,390,768,769,1023,1024,1280,1440,1920]){
const height=width<=768?844:1000,c=await b.newContext({viewport:{width,height},hasTouch:width<=768,reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
await c.addInitScript(theme=>{localStorage.setItem('portfolio-theme',theme);window.__draft=[];window.open=url=>{window.__draft.push(url);return null;};},theme);
const p=await c.newPage();p.on('pageerror',e=>result.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.httpErrors.push(r.status()+': '+r.url())});await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);assert.ok(!(await p.locator('body').innerText()).includes('ВСТАВИТЬ'));
if(width<=768){
 await p.locator('#mobile-menu-btn').click();assert.equal(await p.locator('main').evaluate(e=>e.inert),true);
 const bg=await p.locator('#mobile-menu').evaluate(e=>getComputedStyle(e).backgroundColor);assert.ok(!bg.includes('rgba')&&!bg.includes('/'));
 await p.locator('.nav-logo').click();assert.equal(await p.locator('#mobile-menu').isVisible(),false);assert.equal(await p.locator('main').evaluate(e=>e.inert),false);
}
await p.evaluate(()=>scrollTo({top:document.getElementById('workflow').offsetTop,behavior:'instant'}));await p.waitForTimeout(100);
assert.equal(await p.locator('#floating-contact').isVisible(),width>768);
const profile=await p.locator('.experience-list').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement,s=getComputedStyle(p);return {width:r.width,available:p.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),cols:getComputedStyle(e).gridTemplateColumns.split(' ').length};});
const avatarColumn=width>=1100?288:0;assert.ok(Math.abs(profile.width-(profile.available-avatarColumn))<1);assert.equal(profile.cols,width<=768?1:2);
await p.locator('[data-filter=amo]').click();assert.equal(await p.locator('.case-card:visible').count(),2);await p.locator('[data-filter=all]').click();
await p.locator('#case-1 .case-toggle').click();assert.equal(await p.locator('#case-expand-1').evaluate(e=>e.clientHeight>150&&e.clientHeight===e.scrollHeight),true);await p.locator('#case-1 .case-toggle').click();
for(const [id,value] of [['roi-people','2'],['roi-hours','10'],['roi-rate','100']])await p.locator('#'+id).fill(value);assert.equal(await p.locator('#roi-year-money').getAttribute('data-current'),'104000');
await p.locator('#cta-primary').click();assert.equal(await p.evaluate(()=>document.activeElement.id),'modal-close-btn');
await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.closest('dialog')?.id),'calculator-modal');await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'modal-close-btn');
await p.locator('#wizard-next').click();await p.locator('#calc-custom').check();await p.locator('#wizard-next').click();await p.locator('#request-contact').fill('Проверка '+theme+' '+width+' + & ё');await p.locator('input[name=request-channel][value=email]').check();
await p.locator('#calc-submit-btn').click();await p.waitForFunction(()=>document.getElementById('copy-status').textContent.includes('буфере'));
const request=await p.locator('#request-text').inputValue(),draft=new URL(await p.evaluate(()=>window.__draft.at(-1)));assert.equal(draft.protocol,'mailto:');assert.equal(draft.searchParams.get('body').replace(/\r\n/g,'\n'),request);assert.equal((await p.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),request);
await p.locator('#calc-copy-btn').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'modal-close-btn');
await p.locator('#calc-copy-btn').scrollIntoViewIfNeeded();const close=await p.locator('#modal-close-btn').boundingBox();assert.ok(close.y>=0&&close.y+close.height<=height&&close.width>=44&&close.height>=44);
assert.equal(await p.locator('#modal-close-btn').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;}),true);
if([390,1440].includes(width)){
 await p.addScriptTag({path:'audit/phase3/vendor/axe.min.js'});const a=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));result.violations.push(...a.violations.map(v=>({theme,width,state:'wizard-bottom',id:v.id})));await p.screenshot({path:dir+'/'+tag+'-'+theme+'-'+width+'-close.png'});
}
await p.locator('#modal-close-btn').click();assert.equal(await p.locator('#calculator-modal').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'cta-primary');
await p.locator('#cta-primary').click();await p.mouse.click(2,2);assert.equal(await p.locator('#calculator-modal').isVisible(),false);
if([390,1440].includes(width)){
 const a=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));result.violations.push(...a.violations.map(v=>({theme,width,state:'page',id:v.id})));
 await p.locator('#about').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.profile-card').checkVisibility({contentVisibilityAuto:true}));await p.evaluate(()=>document.activeElement.blur());await p.screenshot({path:dir+'/'+tag+'-'+theme+'-'+width+'-profile.png'});
 if(width<=768){await p.locator('#mobile-menu-btn').click();await p.screenshot({path:dir+'/'+tag+'-'+theme+'-'+width+'-menu.png'});await p.keyboard.press('Escape');}
}
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);result.checks.push({theme,width,noOverflow:true,menu:true,profile:true,cases:true,roi:true,emailDraft:true,clipboard:true,closeAtBottom:true,focus:true,backdrop:true});await c.close();
}
const p=await b.newPage({viewport:{width:390,height:500},reducedMotion:'reduce'});await p.goto(base,{waitUntil:'networkidle'});await p.locator('#cta-primary').click();await p.locator('#wizard-next').click();await p.locator('#wizard-next').click();await p.locator('#calc-copy-btn').scrollIntoViewIfNeeded();const r=await p.locator('#modal-close-btn').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=500);await p.locator('#modal-close-btn').click();result.shortViewport=true;
for(const width of [360,390,768,1024,1440]){const p=await b.newPage({viewport:{width,height:900},javaScriptEnabled:false});await p.goto(base,{waitUntil:'networkidle'});assert.ok(await p.locator('#case-expand-1').evaluate(e=>e.clientHeight>150));assert.ok(!(await p.locator('body').innerText()).includes('ВСТАВИТЬ'));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);assert.equal(await p.locator('#btn-email').getAttribute('href'),'mailto:begmatirmatov@gmail.com');await p.close();}
result.noJSWidths=5;assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.violations,[]);fs.writeFileSync(dir+'/'+tag+'-checks.json',JSON.stringify(result,null,2));console.log({url:base,checks:result.checks.length,shortViewport:true,noJSWidths:5,errors:result.errors,httpErrors:result.httpErrors,violations:result.violations});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});

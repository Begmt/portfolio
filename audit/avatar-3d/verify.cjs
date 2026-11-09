const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',dir='audit/avatar-3d',result={url:base,checks:[],errors:[],httpErrors:[],violations:[]};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 const about=async page=>{await page.evaluate(()=>{prepareSection(document.getElementById('about'));document.getElementById('about').scrollIntoView({behavior:'instant'});});await page.waitForFunction(()=>document.getElementById('profile-avatar').dataset.avatar==='ready',{},{timeout:30000});};
 try{
  for(const theme of ['dark','light'])for(const width of [320,390,769,1440]){
   const height=width===320?500:1000,context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('portfolio-theme',theme),theme);
   const page=await context.newPage(),heavy=[];page.on('pageerror',error=>result.errors.push(error.message));page.on('response',response=>{if(response.status()>=400)result.httpErrors.push(response.status()+': '+response.url());if(/avatar3d\.js|three-r187/.test(response.url()))heavy.push(response.url());});
   await page.goto(base,{waitUntil:'networkidle'});assert.equal(heavy.length,0);await about(page);assert.equal(heavy.length,2);
   await page.locator('#avatar-canvas').evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(150);
   const canvas=page.locator('#avatar-canvas');assert.equal(await page.locator('.avatar-poster').isVisible(),false);assert.equal(await page.locator('#avatar-wave').isEnabled(),true);
   assert.equal(await canvas.evaluate(element=>getComputedStyle(element).transform),'none');
   await canvas.focus();await page.keyboard.press('Home');await page.waitForTimeout(80);
   const front=await canvas.screenshot();for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>Number(document.getElementById('avatar-canvas').dataset.yaw)>1);
   const side=await canvas.screenshot(),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');assert.notEqual(hash(front),hash(side));
   await page.keyboard.press('Home');await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.yaw==='0.000');
   await page.locator('#avatar-wave').click();await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.wave==='true');
   await page.locator('#avatar-listen').click();await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.headset==='1.000');assert.equal(await page.locator('#avatar-status').innerText(),'Слушаю вас');
   await page.locator('#avatar-listen').click();await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.headset==='0.000');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
   if([390,1440].includes(width)){
    await page.addScriptTag({path:'audit/phase3/vendor/axe.min.js'});const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));result.violations.push(...axe.violations.map(item=>({theme,width,id:item.id,nodes:item.nodes.map(node=>node.target)})));
    await page.screenshot({path:`${dir}/${tag}-${theme}-${width}-portrait.png`});
   }
   result.checks.push({theme,width,lazy:true,realRenderedRotation:true,keyboard:true,wave:true,headphones:true,noOverflow:true});await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});await about(page);
  await page.mouse.move(1400,100);await page.waitForTimeout(2200);
  const canvas=page.locator('#avatar-canvas'),r=await canvas.boundingBox();await page.mouse.move(r.x+r.width*.5,r.y+r.height*.4);await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.headset==='1.000');
  assert.equal(await page.locator('#avatar-status').innerText(),'Слушаю вас');await page.mouse.down();await page.mouse.move(r.x+r.width*.9,r.y+r.height*.45,{steps:8});await page.mouse.up();await page.waitForFunction(()=>Math.abs(Number(document.getElementById('avatar-canvas').dataset.yaw))>.5);
  await page.mouse.move(1400,100);await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.headset==='0.000');
  await page.locator('#avatar-wave').click();await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.wave==='true');await page.waitForFunction(()=>document.getElementById('avatar-canvas').dataset.wave==='false');await page.waitForTimeout(400);const count=await canvas.getAttribute('data-renders');await page.waitForTimeout(200);assert.equal(await canvas.getAttribute('data-renders'),count);
  await page.evaluate(()=>{prepareSection(document.getElementById('hero'));scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(200);const offscreen=await canvas.getAttribute('data-renders');await page.waitForTimeout(200);assert.equal(await canvas.getAttribute('data-renders'),offscreen);
  await context.close();result.hover=true;result.drag=true;result.idleStops=true;result.offscreenStops=true;
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),tp=await touch.newPage();await tp.goto(base,{waitUntil:'networkidle'});await about(tp);await tp.locator('#avatar-canvas').evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));await tp.waitForTimeout(150);
  const rect=await tp.locator('#avatar-canvas').boundingBox(),cdp=await touch.newCDPSession(tp),x=rect.x+rect.width*.4,y=rect.y+rect.height*.5,initialY=await tp.evaluate(()=>scrollY);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tp.waitForFunction(()=>Number(document.getElementById('avatar-canvas').dataset.yaw)>.94);assert.ok(Math.abs(await tp.evaluate(()=>scrollY)-initialY)<2);
  const initialYaw=Number(await tp.locator('#avatar-canvas').getAttribute('data-yaw'));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y+50}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+50-i*10}]});await tp.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tp.waitForTimeout(200);assert.ok(await tp.evaluate(()=>scrollY)>initialY+30);assert.ok(Math.abs(Number(await tp.locator('#avatar-canvas').getAttribute('data-yaw'))-initialYaw)<.1);await touch.close();result.touchRotation=true;result.verticalScroll=true;
  const fallback=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
  const fp=await fallback.newPage();await fp.goto(base,{waitUntil:'networkidle'});await fp.evaluate(()=>{prepareSection(document.getElementById('about'));document.getElementById('about').scrollIntoView({behavior:'instant'});});await fp.waitForFunction(()=>document.getElementById('profile-avatar').dataset.avatar==='fallback');assert.equal(await fp.locator('.avatar-poster').isVisible(),true);assert.equal(await fp.locator('#avatar-wave').isDisabled(),true);await fallback.close();result.webglFallback=true;
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.httpErrors,[]);assert.deepEqual(result.violations,[]);fs.writeFileSync(`${dir}/${tag}-checks.json`,JSON.stringify(result,null,2));console.log({checks:result.checks.length,hover:true,drag:true,touchRotation:true,verticalScroll:true,idleStops:true,offscreenStops:true,webglFallback:true,errors:result.errors,httpErrors:result.httpErrors,violations:result.violations});
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

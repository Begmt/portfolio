const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],result={};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const raf=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),interval=setInterval.bind(window),clear=clearInterval.bind(window),rafs=new Set(),intervals=new Set();
   window.requestAnimationFrame=fn=>{const id=raf(time=>{rafs.delete(id);fn(time);});rafs.add(id);return id;};window.cancelAnimationFrame=id=>{rafs.delete(id);cancel(id);};
   window.setInterval=(fn,delay,...args)=>{const id=interval(fn,delay,...args);intervals.add(id);return id;};window.clearInterval=id=>{intervals.delete(id);clear(id);};
   window.__activity=()=>({raf:rafs.size,intervals:intervals.size});
  });
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1400);
  assert.equal(await page.locator('.hero-visual .terminal-window').getAttribute('data-motion-running'),'false');
  await page.locator('.code-inspector>summary').click();await page.locator('.terminal-window').first().scrollIntoViewIfNeeded();await page.locator('#cta-primary').focus();await page.mouse.move(2,2);
  await page.waitForFunction(()=>document.querySelector('.hero-visual .terminal-window').dataset.motionRunning==='true');
  const first=await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang');await page.waitForTimeout(7400);assert.notEqual(await page.locator('.terminal-tab[aria-selected=true]').getAttribute('data-lang'),first);
  await page.locator('#tab-js').focus();await page.keyboard.press('Enter');await page.locator('.code-inspector>summary').click();await page.waitForTimeout(50);
  const printed=await page.locator('#code-js .printed-code').textContent();assert.equal(printed,await page.locator('#code-js .sr-only').textContent());
  result.code={autoplay:true,closeStopsManualTyping:true};
  await page.locator('#case-1 .case-toggle').scrollIntoViewIfNeeded();const topBefore=await page.locator('#case-1').evaluate(el=>el.getBoundingClientRect().top);await page.locator('#case-1 .case-toggle').click();await page.waitForTimeout(400);
  const topAfter=await page.locator('#case-1').evaluate(el=>el.getBoundingClientRect().top);result.expansion={headerShift:topAfter-topBefore};
  const bad=await page.evaluate(()=>document.getAnimations().flatMap(a=>a.effect?.getKeyframes().flatMap(frame=>Object.keys(frame).filter(key=>!['offset','computedOffset','easing','composite','transform','opacity'].includes(key)))||[]));assert.deepEqual(bad,[]);result.animatedProperties=true;
  await page.locator('#before-after').scrollIntoViewIfNeeded();await page.locator('[data-process=manual]').click();await page.waitForTimeout(150);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.equal(await page.locator('.process-steps li[data-status=""]').count(),0);assert.equal(await page.locator('#process-time').innerText(),'15');assert.equal(await page.locator('#particles-canvas').evaluate(el=>getComputedStyle(el).display),'none');result.reduceCompletesSteps=true;
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#ecosystem-map').scrollIntoViewIfNeeded();await page.locator('[data-scenario=order]').click();await page.waitForTimeout(100);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(180);
  assert.deepEqual(await page.evaluate(()=>window.__activity()),{raf:0,intervals:0});assert.equal(await page.locator('#ecosystem-svg').evaluate(el=>el.animationsPaused()),true);
  const logs=await page.locator('#eco-terminal-body').textContent();await page.waitForTimeout(700);assert.equal(await page.locator('#eco-terminal-body').textContent(),logs);result.hidden={activity:await page.evaluate(()=>window.__activity()),logsStopped:true,svgPaused:true};
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.emulateMedia({reducedMotion:'reduce'});
  async function cycle(){await page.evaluate(()=>{
   const click=selector=>document.querySelector(selector).click();click('#cta-primary');click('#wizard-next');const input=document.getElementById('calc-custom');input.checked=!input.checked;input.dispatchEvent(new Event('change',{bubbles:true}));click('#wizard-next');click('#modal-close-btn');click('#open-command');const search=document.getElementById('command-search');search.value='ROI';search.dispatchEvent(new Event('input',{bubbles:true}));click('#command-palette .dialog-close');click('[data-filter=amo]');click('[data-filter=all]');click('#case-1 .case-toggle');click('#case-1 .case-toggle');click('[data-scenario=payment]');
  });await page.waitForTimeout(30);}
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');for(let i=0;i<5;i++)await cycle();await cdp.send('HeapProfiler.collectGarbage');
  async function metrics(){const response=await cdp.send('Performance.getMetrics');return Object.fromEntries(response.metrics.filter(m=>['JSHeapUsedSize','Nodes','Documents','JSEventListeners','LayoutCount'].includes(m.name)).map(m=>[m.name,m.value]));}
  const before=await metrics();for(let i=0;i<25;i++)await cycle();await page.waitForTimeout(500);await cdp.send('HeapProfiler.collectGarbage');const after=await metrics();
  const counts=await page.evaluate(()=>({groups:document.querySelectorAll('.eco-line-group').length,logs:document.querySelectorAll('.console-log-entry').length,dialogs:document.querySelectorAll('dialog').length,pending:pendingNumbers.size,activity:window.__activity()}));
  assert.equal(counts.groups,4);assert.ok(counts.logs<=12);assert.equal(counts.dialogs,3);assert.equal(counts.pending,0);assert.equal(before.JSEventListeners,after.JSEventListeners);assert.ok(after.Nodes-before.Nodes<100);
  result.stress={warmup:5,cycles:25,before,after,counts};
  const mobile=await browser.newPage({viewport:{width:320,height:640},hasTouch:true,reducedMotion:'reduce'});await mobile.goto('http://127.0.0.1:8765/');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth),320);result.reflow320=true;
  assert.deepEqual(errors,[]);result.errors=errors;fs.writeFileSync(path.join(__dirname,'lifecycle-results.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

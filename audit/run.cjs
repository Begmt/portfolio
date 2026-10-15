// Проверки исходной версии: код сайта не изменяется.
const { chromium } = require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const path = require('path');
(async () => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results = {date:'2026-10-15',errors:[], widths:[]};
 for (const width of [390,768,1440]) {
  const page = await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror', e => results.errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.waitForTimeout(2600);
  await page.screenshot({path:path.join(__dirname,`hero-${width}.png`)});
  for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=600){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(180);}
  await page.waitForTimeout(2500);
  await page.screenshot({path:path.join(__dirname,`full-${width}.png`),fullPage:true});
  const data = await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,stats:[...document.querySelectorAll('.stat-item')].map(x=>x.innerText),smallTargets:[...document.querySelectorAll('a,button')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)}).map(x=>({text:x.textContent.trim(),id:x.id,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height})),overlaps:[...document.querySelectorAll('.eco-satellite')].filter(x=>{const a=x.getBoundingClientRect(),b=document.querySelector('.eco-center').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}).map(x=>x.id)}));
  await page.locator('#case-1 .case-toggle').click();await page.waitForTimeout(700);
  data.case = await page.locator('#case-expand-1').evaluate(x=>({clientHeight:x.clientHeight,scrollHeight:x.scrollHeight}));
  await page.locator('#case-1').screenshot({path:path.join(__dirname,`case-${width}.png`)});
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(700);
  await page.locator('#cta-primary').click();await page.waitForTimeout(600);
  data.modalFocus=await page.evaluate(()=>document.activeElement.id);
  await page.keyboard.press('Escape');
  data.escapeCloses=await page.locator('#calculator-modal').evaluate(x=>!x.classList.contains('open'));
  data.submitHref=await page.locator('#calc-submit-btn').getAttribute('href');
  await page.screenshot({path:path.join(__dirname,`modal-${width}.png`)});
  results.widths.push(data);await page.close();
 }
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:900}});
 await nojs.goto('http://127.0.0.1:8765/');
 results.noJS=await nojs.evaluate(()=>({hiddenSections:[...document.querySelectorAll('.animate-on-scroll')].filter(x=>getComputedStyle(x).opacity==='0').length,counters:[...document.querySelectorAll('.stat-number')].map(x=>x.textContent)}));
 await nojs.screenshot({path:path.join(__dirname,'nojs-390.png'),fullPage:true});
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:8765/');
 results.reducedMotion=await reduced.evaluate(()=>({ticker:getComputedStyle(document.querySelector('.ticker-track')).animationName,orb:getComputedStyle(document.querySelector('.orb')).animationName}));
 fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2));
 await browser.close();console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});

// Проверка конечных файлов и маршрутов; заявки и внешние мессенджеры не открываются.
const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const url=process.argv[2]||'http://127.0.0.1:8765/',production=new URL(url).hostname!=='127.0.0.1';
 const name=production?'production':'local';
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const result={url,assets:[],themes:[],errors:[]};
 try{
  const request=await browser.newContext();
  for(const file of ['index.html','style.css','script.js','interactions.js','design.js','404.html','favicon.svg','social-card.png',...['manrope','geist-mono'].flatMap(font=>['latin','cyrillic'].map(subset=>`assets/fonts/${font}-${subset}.woff2`))]){
   const response=await request.request.get(new URL(file,url).href,{timeout:45000});assert.equal(response.status(),200,file);
   const actual=await response.body(),expected=fs.readFileSync(path.join(__dirname,'../..',file));
   if(/\.(html|css|js|svg)$/.test(file))assert.ok(actual.toString().replace(/\r\n/g,'\n')===expected.toString().replace(/\r\n/g,'\n'),`${file}: deployed source`);
   else assert.equal(actual.equals(expected),true,`${file}: deployed asset`);
   result.assets.push(file);
  }
  await request.close();
  for(const theme of ['dark','light']){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
   await context.addInitScript(theme=>{if(!localStorage.getItem('portfolio-theme'))localStorage.setItem('portfolio-theme',theme);},theme);
   const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
   await page.goto(url,{waitUntil:'networkidle',timeout:45000});await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   assert.equal(await page.evaluate(()=>document.styleSheets.length),1);
   assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash&&!document.getElementById(a.hash.slice(1))).map(a=>a.hash)),[]);
   await page.screenshot({path:path.join(__dirname,`${name}-${theme}-mobile.png`)});
   await page.locator('#theme-toggle').tap();await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme==='dark'?'light':'dark');
   await page.locator('#mobile-menu-btn').tap();await page.locator('#mobile-menu a[href="#workflow"]').tap();
   assert.equal(new URL(page.url()).hash,'#workflow');assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
   await page.locator('#cta-primary').tap();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'cta-primary');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
   result.themes.push({theme,persistence:true,touch:true,anchors:true,dialog:true});await context.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});
  if(!production)await page.route('**/portfolio/**',route=>route.continue({url:route.request().url().replace('/portfolio/','/')}));
  const response=await page.goto(new URL(production?'phase3-missing-page':'404.html',url).href,{waitUntil:'networkidle',timeout:45000});
  assert.equal(response.status(),production?404:200);assert.equal(await page.locator('h1').innerText(),'Такой страницы нет.');
  assert.equal(await page.locator('.btn-primary').getAttribute('href'),'/portfolio/');
  assert.equal(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily.includes('Manrope')),true);
  await page.screenshot({path:path.join(__dirname,`${name}-404.png`)});result.custom404=true;
  assert.deepEqual(result.errors,[]);fs.writeFileSync(path.join(__dirname,`${name}-release-results.json`),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

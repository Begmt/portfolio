// Финальная точечная проверка fallback-навигации, контактов и стилей.
const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:360,height:900}});
  await nojs.goto('http://127.0.0.1:8765/');
  const geometry=await nojs.evaluate(()=>({navBottom:document.querySelector('nav').getBoundingClientRect().bottom,heroTop:document.querySelector('.micro-label').getBoundingClientRect().top,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(geometry.heroTop>geometry.navBottom);assert.equal(geometry.scrollWidth,360);
  await nojs.screenshot({path:path.join(__dirname,'nojs-360.png'),fullPage:true});
  const context=await browser.newContext();
  await context.route('**/script.js',async route=>{
   const response=await route.fetch();
   // Только тестовые URL; переходы по ним не выполняются.
   const source=(await response.text()).replace("telegram: '[ВСТАВИТЬ TELEGRAM]'","telegram: 'https://t.me/TEST_CONTACT_PLACEHOLDER'").replace("whatsapp: '[ВСТАВИТЬ WHATSAPP]'","whatsapp: 'https://wa.me/10000000000'").replace("email: '[ВСТАВИТЬ EMAIL]'","email: 'test@example.invalid'");
   await route.fulfill({response,body:source});
  });
  const page=await context.newPage();await page.goto('http://127.0.0.1:8765/');
  assert.equal(await page.locator('#btn-telegram').getAttribute('href'),'https://t.me/TEST_CONTACT_PLACEHOLDER');
  assert.equal(await page.locator('#btn-whatsapp').getAttribute('href'),'https://wa.me/10000000000');
  assert.equal(await page.locator('[data-contact=email]').getAttribute('href'),'mailto:test@example.invalid');
  const old=await browser.newPage({viewport:{width:390,height:900}});await old.goto('http://127.0.0.1:8765/');
  for(const id of ['btn-telegram','btn-whatsapp']){assert.equal(await old.locator('#'+id).getAttribute('aria-disabled'),'true');assert.equal(await old.locator('#'+id).getAttribute('href'),'#contact-details');}
  const text=await old.locator('body').innerText();for(const phrase of ['Навсегда.','любой сложности','Разработка и Веб-кодинг'])assert.ok(text.includes(phrase));
  const result={noJSNavigation:geometry,configuredContacts:true,placeholderContacts:true,originalCopyPreserved:true};
  fs.writeFileSync(path.join(__dirname,'final-results.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

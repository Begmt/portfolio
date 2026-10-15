const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
 await context.route('**/script.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("telegram: '[ВСТАВИТЬ TELEGRAM]'","telegram: 'https://t.me/TEST_CONTACT_PLACEHOLDER'").replace("whatsapp: '[ВСТАВИТЬ WHATSAPP]'","whatsapp: 'https://wa.me/10000000000'")});});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.__opened=[];window.open=url=>{window.__opened.push(url);return null;};});await page.goto('http://127.0.0.1:8765/');
 await page.locator('#cta-primary').click();await page.locator('#wizard-next').click();await page.locator('#wizard-next').click();await page.locator('#request-contact').fill('Тест & + < >');
 for(const channel of ['telegram','whatsapp']){await page.locator(`input[name=request-channel][value=${channel}]`).check();await page.locator('#calc-submit-btn').click();await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.includes('уже в буфере'));const url=new URL(await page.evaluate(()=>window.__opened.at(-1)));assert.equal(url.searchParams.get('text'),await page.locator('#request-text').inputValue());assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),await page.locator('#request-text').inputValue());}
 assert.deepEqual(errors,[]);console.log('Telegram/WhatsApp: encoded text + automatic backup copy, no external navigation, passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

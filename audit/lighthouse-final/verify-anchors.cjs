const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('assert/strict'),fs=require('fs');
(async()=>{const base=process.env.PERF_ANCHOR_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',r={url:base,checks:[],errors:[]},b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
for(const js of [true,false])for(const width of [390,1440])for(const id of ['projects','ecosystem','workflow','contact']){
const p=await b.newPage({viewport:{width,height:width===390?844:1000},javaScriptEnabled:js});p.on('pageerror',e=>r.errors.push(e.message));
await p.goto(js?base:base+'#'+id,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
if(js){if(width===390)await p.locator('#mobile-menu-btn').click();await p.locator((width===390?'#mobile-menu':'#main-nav .nav-links')+' a[href="#'+id+'"]').click();}
await p.waitForTimeout(2600);
const top=await p.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top);const expected=await p.locator('#'+id).evaluate(e=>Math.max(110,innerHeight-(document.documentElement.scrollHeight-(e.getBoundingClientRect().top+scrollY))));assert.ok(Math.abs(top-expected)<20,id+' alignment '+top+' / '+expected);
await p.waitForTimeout(500);const stable=await p.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top);assert.ok(Math.abs(stable-top)<1,'stable anchor '+id);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);if(js&&id==='ecosystem'){await p.emulateMedia({reducedMotion:'reduce'});await p.locator('[data-scenario=order]').click();assert.equal(await p.locator('.eco-line-group').count(),4);assert.ok(await p.locator('.console-log-entry').count()>0);}r.checks.push({js,width,id,top,stable});await p.close();
}
assert.deepEqual(r.errors,[]);fs.writeFileSync('audit/lighthouse-final/'+tag+'-anchor-checks.json',JSON.stringify(r,null,2));console.log(r);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{
 const base=process.env.VISUAL_CHECK_URL||'http://127.0.0.1:8765/',tag=base.includes('127.0.0.1')?'local':'production',checks=[];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  for(const width of [769,1024,1440,1920]){
   const page=await browser.newPage({viewport:{width,height:900}});await page.goto(base,{waitUntil:'networkidle'});
   for(const fraction of [.2,.3,.4,.5,.7]){
    await page.evaluate(fraction=>{const section=document.getElementById('cases');prepareSection(section);const rect=section.getBoundingClientRect();scrollTo({top:scrollY+rect.top+rect.height*fraction-260,behavior:'instant'});},fraction);await page.waitForTimeout(320);
    checks.push(await page.evaluate(fraction=>{const guide=document.getElementById('scroll-guide').getBoundingClientRect(),cta=document.getElementById('floating-contact').getBoundingClientRect();return {width:innerWidth,fraction,ctaVisible:cta.width>0,intersects:cta.width>0&&guide.left<cta.right&&guide.right>cta.left&&guide.top<cta.bottom&&guide.bottom>cta.top,guide:{x:guide.x,y:guide.y,width:guide.width,height:guide.height},cta:{x:cta.x,y:cta.y,width:cta.width,height:cta.height}};},fraction));
   }
   await page.close();
  }
  fs.writeFileSync(`audit/avatar-guide/${tag}-cta-clearance.json`,JSON.stringify({url:base,checks},null,2));assert.ok(checks.some(check=>check.ctaVisible));assert.equal(checks.filter(check=>check.intersects).length,0);console.log({positions:checks.length,intersections:0});
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});

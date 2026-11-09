// Проверка нового CI runner без посещения приложения и загрузки его ресурсов.
const fs=require('fs'),path=require('path'),os=require('os'),{createRequire}=require('module'),{pathToFileURL}=require('url');
(async()=>{
 const entry=process.env.LIGHTHOUSE_ENTRY||'C:/Users/begma/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core/index.js';
 const requireLH=createRequire(entry),{launch}=await import(pathToFileURL(requireLH.resolve('chrome-launcher'))),puppeteer=await import(pathToFileURL(requireLH.resolve('puppeteer-core')));
 const dir=process.env.LIGHTHOUSE_REPORT_DIR||path.resolve('audit/lighthouse-final/local-platform');fs.mkdirSync(dir,{recursive:true});
 const profile=path.join(os.tmpdir(),`portfolio-platform-${Date.now()}`);fs.mkdirSync(profile,{recursive:true});
 const reservation=require('net').createServer();await new Promise((resolve,reject)=>{reservation.once('error',reject);reservation.listen(0,'127.0.0.1',resolve);});
 const debugPort=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const started=Date.now();let chrome;
 try{chrome=await launch({port:debugPort,chromePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--no-sandbox'],userDataDir:profile});}
 catch(error){const log=path.join(profile,'chrome-err.log');if(fs.existsSync(log))fs.copyFileSync(log,path.join(dir,'platform-chrome.stderr.txt'));throw error;}
 try{
  const browser=await puppeteer.connect({browserURL:`http://127.0.0.1:${chrome.port}`});
  try{
   const page=await browser.newPage(),requests=[];page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
   const html='<!doctype html><html lang="ru"><meta charset="utf-8"><title>Chromium readiness</title><body style="font:16px system-ui;padding:24px">Chromium readiness · Проверка браузера · 0123456789</body></html>';
   await page.goto('data:text/html,'+encodeURIComponent(html),{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(dir,'platform-startup.png')});
   if(requests.length)throw new Error('Offline control unexpectedly made HTTP requests');
   const result={offline:true,httpRequests:requests,applicationVisited:false,userAgent:await page.evaluate(()=>navigator.userAgent),elapsedMs:Date.now()-started,verifiedAt:new Date().toISOString()};
   fs.writeFileSync(path.join(dir,'platform-startup.json'),JSON.stringify(result,null,2));console.log('Offline Chromium readiness:',result);
  }finally{await browser.disconnect();}
 }finally{await chrome.kill();}
})().catch(error=>{console.error(error);process.exit(1)});

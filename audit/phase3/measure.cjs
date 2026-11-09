// Lighthouse в отдельном профиле: тема задаётся до навигационного измерения.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{createRequire}=require('module');
(async()=>{
 const theme=process.argv[2]||'dark',url=process.argv[3]||'http://127.0.0.1:8765/',prefix=process.argv[4]||`local-${theme}`;
 if(!/^[a-zA-Z0-9_-]+$/.test(prefix))throw new Error('Invalid report name');
 const entry=process.env.LIGHTHOUSE_ENTRY||'C:/Users/begma/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core/index.js';
 const requireLH=createRequire(entry);
 const {launch}=await import(pathToFileURL(requireLH.resolve('chrome-launcher')));
 const puppeteer=await import(pathToFileURL(requireLH.resolve('puppeteer-core')));
 const profile=path.join(require('os').tmpdir(),`portfolio-lighthouse-${prefix}-${Date.now()}`);
 fs.mkdirSync(profile,{recursive:true});
 const chrome=await launch({chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--no-sandbox'],userDataDir:profile});
 try{
  const browser=await puppeteer.connect({browserURL:`http://127.0.0.1:${chrome.port}`});
  const page=await browser.newPage();
  // Настройка origin без предварительной загрузки приложения и прогрева его кэша.
  await page.goto(new URL('favicon.svg',url).href,{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(theme=>localStorage.setItem('portfolio-theme',theme),theme);await page.close();await browser.disconnect();
  const {default:lighthouse}=await import(pathToFileURL(entry));
  const result=await lighthouse(url,{port:chrome.port,logLevel:'error',output:['html','json'],disableStorageReset:true,onlyCategories:['performance','accessibility','best-practices','seo'],maxWaitForLoad:45000});
  fs.writeFileSync(path.join(__dirname,`${prefix}.report.html`),result.report[0].replace(/[\t ]+$/gm,''));fs.writeFileSync(path.join(__dirname,`${prefix}.report.json`),result.report[1]);
  const summary={theme,url,version:result.lhr.lighthouseVersion,mode:result.lhr.configSettings.formFactor,scores:Object.fromEntries(Object.entries(result.lhr.categories).map(([key,c])=>[key,Math.round(c.score*100)])),LCP:result.lhr.audits['largest-contentful-paint'].numericValue,CLS:result.lhr.audits['cumulative-layout-shift'].numericValue,TBT:result.lhr.audits['total-blocking-time'].numericValue,runtimeError:result.lhr.runtimeError};
  fs.writeFileSync(path.join(__dirname,`${prefix}.summary.json`),JSON.stringify(summary,null,2));console.log(summary);
 }finally{await chrome.kill();}
})().catch(e=>{console.error(e.message);process.exit(1)});

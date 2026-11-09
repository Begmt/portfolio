const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const url='https://begmt.github.io/portfolio/',dir=process.env.LIGHTHOUSE_REPORT_DIR||path.resolve('audit/lighthouse-final/ci-results');
const files=['index.html','style.css','script.js','interactions.js','design.js','guide.js','avatar3d.js','assets/guide/avatar-renderer.js','assets/guide/avatar-animated.glb','assets/guide/3d-licenses.txt'];
const normalize=text=>text.replace(/\r\n/g,'\n');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const save=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2));
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const source=Object.fromEntries(files.map(file=>[file,file.endsWith('.glb')?fs.readFileSync(file):normalize(fs.readFileSync(file,'utf8'))]));
 const deadline=Date.now()+8*60*1000;let checks;
 do{
  checks=await Promise.all(files.map(async file=>{
   try{
    const response=await fetch(new URL(file,url),{signal:AbortSignal.timeout(15000),cache:'no-store'}),content=file.endsWith('.glb')?Buffer.from(await response.arrayBuffer()):normalize(await response.text());
    return {file,status:response.status,matches:response.ok&&sha(content)===sha(source[file]),expectedSHA256:sha(source[file]),publishedSHA256:sha(content)};
   }catch(error){return {file,matches:false,error:error.message};}
  }));
  if(checks.every(item=>item.matches))break;
  console.log('Waiting for Pages:',checks.filter(item=>!item.matches).map(item=>item.file).join(', '));
  await new Promise(resolve=>setTimeout(resolve,10000));
 }while(Date.now()<deadline);
 save('deployment.json',{url,sourceCommit:process.env.GITHUB_SHA,verifiedAt:new Date().toISOString(),checks});
 if(!checks.every(item=>item.matches))throw new Error('Published assets do not match this commit');
 const platform=spawnSync(process.execPath,['audit/lighthouse-final/platform.cjs'],{stdio:'inherit',env:{...process.env,LIGHTHOUSE_REPORT_DIR:dir}});
 if(platform.status!==0)throw new Error('Offline Chromium readiness check failed');
 const runs=[];
 for(let run=1;run<=5;run++)for(const theme of ['dark','light']){
  const prefix=`ci-mobile-${theme}-${run}`;
  const child=spawnSync(process.execPath,['audit/phase3/measure.cjs',theme,url,prefix],{stdio:'inherit',env:{...process.env,LIGHTHOUSE_REPORT_DIR:dir}});
  if(child.status!==0)throw new Error(`Lighthouse failed: ${prefix}`);
  const report=JSON.parse(fs.readFileSync(path.join(dir,`${prefix}.report.json`),'utf8'));
  const summary=JSON.parse(fs.readFileSync(path.join(dir,`${prefix}.summary.json`),'utf8'));
  const scores=Object.fromEntries(['performance','accessibility','best-practices','seo'].map(key=>[key,report.categories[key]?.score]));
  const CLS=report.audits['cumulative-layout-shift'].numericValue,config=report.configSettings;
  const standard=config.formFactor==='mobile'&&config.throttlingMethod==='simulate'&&config.throttling.cpuSlowdownMultiplier===4&&config.throttling.rttMs===150&&config.throttling.throughputKbps===1638.4;
  const passed=standard&&summary.actualTheme===theme&&!report.runtimeError&&Object.values(scores).every(score=>typeof score==='number'&&score>=.9)&&Number.isFinite(CLS)&&CLS<.1;
  runs.push({run,theme,actualTheme:summary.actualTheme,prefix,scores,CLS,LCP:report.audits['largest-contentful-paint'].numericValue,TBT:report.audits['total-blocking-time'].numericValue,passed,lighthouse:report.lighthouseVersion,userAgent:report.environment.hostUserAgent,benchmarkIndex:report.environment.benchmarkIndex,config});
 }
 const themes=Object.fromEntries(['dark','light'].map(theme=>{
  const sample=runs.filter(item=>item.theme===theme),performance=sample.map(item=>item.scores.performance*100);
  return [theme,{performance,minPerformance:Math.min(...performance),medianPerformance:median(performance),maxCLS:Math.max(...sample.map(item=>item.CLS)),minAccessibility:Math.min(...sample.map(item=>item.scores.accessibility*100)),minBestPractices:Math.min(...sample.map(item=>item.scores['best-practices']*100)),minSEO:Math.min(...sample.map(item=>item.scores.seo*100))}];
 }));
 const result={url,sourceCommit:process.env.GITHUB_SHA,verifiedAt:new Date().toISOString(),passed:runs.length===10&&runs.every(item=>item.passed),themes,runs};
 save('results.json',result);console.log(JSON.stringify(result,null,2));
 const lines=['# Published Lighthouse Mobile','',`Source: \`${result.sourceCommit}\`. Standard simulated Mobile, CPU ×4, RTT 150 ms. Five cold profiles per theme. Every run must score ≥90 in all four categories and CLS <0.1.`,'','| Theme | Performance samples | Minimum | Median | Accessibility min | Best Practices min | SEO min | CLS max |','|---|---|---:|---:|---:|---:|---:|---:|'];
 for(const [theme,item]of Object.entries(themes))lines.push(`| ${theme} | ${item.performance.join(', ')} | ${item.minPerformance} | ${item.medianPerformance} | ${item.minAccessibility} | ${item.minBestPractices} | ${item.minSEO} | ${item.maxCLS} |`);
 lines.push('',`All 10 runs passed: **${result.passed}**.`);
 lines.push('','<details><summary>Machine-readable threshold data</summary>','','```json',JSON.stringify(result,null,2),'```','','</details>');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
 if(!result.passed)throw new Error('Published Mobile thresholds were not met in every run');
})().catch(error=>{console.error(error);process.exit(1);});

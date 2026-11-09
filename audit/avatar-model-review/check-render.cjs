const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const checksum=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),source=path.resolve(__dirname,'../avatar-guide/sample_2026-11-09T202723.078.glb');
(async()=>{
 const initialSHA=checksum(fs.readFileSync(source));const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];
 try{
 for(const width of[1440,390]){
  const page=await browser.newPage({viewport:{width,height:1050},deviceScaleFactor:1});const errors=[];const requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('request',r=>requests.push(r.url()));
  await page.goto('http://127.0.0.1:8765/audit/avatar-model-review/viewer.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.modelReady==='true'||document.documentElement.dataset.modelError==='true',null,{timeout:90000});
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.modelReady),'true');
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  const stats=await page.evaluate(()=>{const r=window.modelReview,m=r.mesh;return {meshes:r.model.getObjectsByProperty('isMesh',true).length,vertices:m.geometry.attributes.position.count,triangles:m.geometry.index.count/3,isSkinned:!!m.isSkinnedMesh,animations:r.gltf.animations.length,textures:[m.material.map,m.material.metalnessMap].map(t=>({width:t.image.width,height:t.image.height})),renderTriangles:r.renderer.info.render.triangles,webglVersion:r.renderer.getContext().getParameter(r.renderer.getContext().VERSION)};});
  assert.equal(stats.triangles,280212);assert.equal(stats.meshes,1);assert.equal(stats.isSkinned,false);assert.equal(stats.animations,0);assert.ok(stats.renderTriangles>0);assert.ok(stats.textures.every(t=>t.width===2048&&t.height===2048));
  const canvas=page.locator('canvas'),front=await canvas.screenshot({path:path.join(__dirname,`front-${width}.png`)});await page.screenshot({path:path.join(__dirname,`comparison-dark-${width}.png`),fullPage:true});
  await page.locator('#side').click();const side=await canvas.screenshot({path:path.join(__dirname,`side-${width}.png`)});assert.notEqual(checksum(front),checksum(side));
  await page.locator('#back').click();const back=await canvas.screenshot({path:path.join(__dirname,`back-${width}.png`)});assert.notEqual(checksum(side),checksum(back));
  await page.locator('#front').click();await canvas.focus();const before=await page.evaluate(()=>window.modelReview.camera.position.toArray());await page.keyboard.press('ArrowRight');const after=await page.evaluate(()=>window.modelReview.camera.position.toArray());assert.notDeepEqual(before,after);await page.keyboard.press('Home');
  if(width===1440){const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5,{steps:8});await page.mouse.up();const moved=await page.evaluate(()=>window.modelReview.camera.position.toArray());assert.ok(Math.abs(moved[0])>.1);await page.locator('#front').click();}
  await page.locator('#parts').click();assert.equal(await page.evaluate(()=>window.modelReview.parts()),true);await canvas.screenshot({path:path.join(__dirname,`connected-front-${width}.png`)});await page.locator('#side').click();await canvas.screenshot({path:path.join(__dirname,`connected-side-${width}.png`)});await page.locator('#parts').click();await page.locator('#front').click();
  await page.locator('#theme').click();await page.screenshot({path:path.join(__dirname,`comparison-light-${width}.png`),fullPage:true});
  const externalRequests=requests.filter(url=>/^https?:/.test(url)&&new URL(url).origin!=='http://127.0.0.1:8765');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
  results.push({width,loaded:true,stats,rotationPixelsDiffer:true,keyboard:true,mouseDrag:width===1440,componentsMode:true,lightAndDark:true,overflow:false,errors,externalHTTPRequests:externalRequests,requestURLs:requests});await page.close();
 }
 assert.equal(checksum(fs.readFileSync(source)),initialSHA);
 fs.writeFileSync(path.join(__dirname,'render-checks.json'),JSON.stringify({sourceSHA256:initialSHA,sourceUnchanged:true,results},null,2));console.log(JSON.stringify({sourceUnchanged:true,results},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

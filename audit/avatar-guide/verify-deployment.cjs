const fs=require('fs'),crypto=require('crypto'),{execFileSync}=require('child_process');
(async()=>{
 const url='https://begmt.github.io/portfolio/',files=['index.html','style.css','script.js','interactions.js','design.js','guide.js','assets/guide/avatar-96.webp','assets/guide/avatar-384.webp','assets/guide/avatar-walking.webp'];
 const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 const checks=await Promise.all(files.map(async file=>{
  const normalize=bytes=>file.endsWith('.webp')?bytes:Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n'));
  try{
   const response=await fetch(new URL(file,url),{cache:'no-store',signal:AbortSignal.timeout(30000)}),bytes=normalize(Buffer.from(await response.arrayBuffer())),source=normalize(fs.readFileSync(file));
   return {file,status:response.status,matches:response.ok&&hash(bytes)===hash(source),expectedSHA256:hash(source),publishedSHA256:hash(bytes)};
  }catch(error){return {file,matches:false,error:error.message};}
 }));
 const result={url,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),verifiedAt:new Date().toISOString(),checks};
 fs.writeFileSync('audit/avatar-guide/walk-deployment.json',JSON.stringify(result,null,2));console.log(checks);
 if(!checks.every(check=>check.matches))process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1);});

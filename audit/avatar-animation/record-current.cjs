const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const model=path.join(__dirname,'avatar-animated.glb'),hash=()=>crypto.createHash('sha256').update(fs.readFileSync(model)).digest('hex'),before=hash();
const result=spawnSync(process.execPath,[path.join(__dirname,'record.cjs')],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
if(hash()!==before)throw new Error('Model changed during video capture');
const file=path.join(__dirname,'video-info.json'),info=JSON.parse(fs.readFileSync(file,'utf8'));info.modelSHA256=before;info.modelUnchangedDuringCapture=true;fs.writeFileSync(file,JSON.stringify(info,null,2));

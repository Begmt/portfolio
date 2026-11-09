const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const esbuild=require('../avatar-guide/runtime/node_modules/esbuild');
(async()=>{
 const root=path.resolve(__dirname,'../..'),model=fs.readFileSync(path.join(__dirname,'avatar-animated.glb'));
 const original=fs.readFileSync(path.join(root,'audit/avatar-guide/sample_2026-11-09T202723.078.glb'));
 const reference=fs.readFileSync(path.join(root,'assets/guide/avatar-384.webp'));
 const stats=JSON.parse(fs.readFileSync(path.join(__dirname,'build-stats.json')));
 let js=fs.readFileSync(path.join(__dirname,'preview.js'),'utf8');
 js=js.replace("loader.loadAsync('avatar-animated.glb')","loader.loadAsync(window.__avatarModel)").replace("loader.loadAsync('../avatar-guide/sample_2026-11-09T202723.078.glb')","loader.loadAsync(window.__avatarOriginal)").replace("const stats=await(await fetch('build-stats.json')).json();",'const stats='+JSON.stringify(stats)+';');
 const importEnd=js.indexOf('const $=');js=js.slice(0,importEnd)+'(async()=>{'+js.slice(importEnd)+'})();';
 const threeRoot=path.join(root,'audit/avatar-guide/runtime/node_modules/three');
 const result=await esbuild.build({stdin:{contents:js,resolveDir:__dirname,sourcefile:'preview.js'},bundle:true,write:false,format:'iife',target:'es2022',minify:true,legalComments:'inline',plugins:[{name:'explicit-local-sources',setup(build){
  build.onResolve({filter:/.*/},args=>{let resolved;if(args.path==='three')resolved=path.join(threeRoot,'build/three.module.js');else if(args.path.startsWith('three/addons/'))resolved=path.join(threeRoot,'examples/jsm',args.path.slice('three/addons/'.length));else if(args.path.startsWith('.'))resolved=path.resolve(args.resolveDir,args.path);else if(path.isAbsolute(args.path))resolved=args.path;else throw new Error('Unexpected module '+args.path);if(!resolved.startsWith(root+path.sep))throw new Error('Module outside portfolio');return{path:resolved,namespace:'local'};});
  build.onLoad({filter:/.*/,namespace:'local'},args=>({contents:fs.readFileSync(args.path,'utf8'),loader:'js',resolveDir:path.dirname(args.path)}));
 }}]});
 let html=fs.readFileSync(path.join(__dirname,'preview.html'),'utf8');html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace('../avatar-guide/generated-avatar.png','data:image/webp;base64,'+reference.toString('base64')).replace('href="avatar-animated.glb"','href="#"');
 const globals='window.__avatarModel="data:model/gltf-binary;base64,'+model.toString('base64')+'";window.__avatarOriginal="data:model/gltf-binary;base64,'+original.toString('base64')+'";';
 const code=globals+result.outputFiles[0].text+";document.querySelector('a.download').href=window.__avatarModel;";
 html=html.replace('<script type="module" src="preview.js"></script>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');
 const output=path.join(root,'audit/avatar-guide/runtime/reconstruction/preview-standalone.html');fs.writeFileSync(output,html);console.log(JSON.stringify({file:'audit/avatar-guide/runtime/reconstruction/preview-standalone.html',bytes:fs.statSync(output).size,modelSHA256:crypto.createHash('sha256').update(model).digest('hex'),networkDependencies:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});

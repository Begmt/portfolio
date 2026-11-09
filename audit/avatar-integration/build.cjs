const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),esbuild=require('../avatar-guide/runtime/node_modules/esbuild');
(async()=>{
 const three=path.join(root,'audit/avatar-guide/runtime/node_modules/three');
 const revision=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'audit/avatar-animation/avatar-animated.glb'))).digest('hex').slice(0,12);
 const result=await esbuild.build({entryPoints:[path.join(__dirname,'renderer.js')],define:{MODEL_REVISION:JSON.stringify(revision)},bundle:true,write:false,format:'esm',target:'es2022',minify:true,legalComments:'inline',plugins:[{name:'local-sources',setup(build){
  build.onResolve({filter:/.*/},args=>{let p;if(args.path==='three')p=path.join(three,'build/three.module.js');else if(args.path.startsWith('three/addons/'))p=path.join(three,'examples/jsm',args.path.slice(13));else if(args.path.startsWith('.'))p=path.resolve(args.resolveDir,args.path);else if(path.isAbsolute(args.path))p=args.path;else throw new Error('Unexpected module '+args.path);if(!p.startsWith(root+path.sep))throw new Error('Outside portfolio');return{path:p,namespace:'local'};});
  build.onLoad({filter:/.*/,namespace:'local'},args=>({contents:fs.readFileSync(args.path,'utf8'),loader:'js',resolveDir:path.dirname(args.path)}));
 }}]});
 const dest=path.join(root,'assets/guide');
 // Normalize insignificant whitespace in the bundled upstream GLSL templates.
 fs.writeFileSync(path.join(dest,'avatar-renderer.js'),result.outputFiles[0].text.replace(/[\t ]+$/gm,'').replace(/^ +(?=\t)/gm,''));
 fs.copyFileSync(path.join(root,'audit/avatar-animation/avatar-animated.glb'),path.join(dest,'avatar-animated.glb'));
 const licenses='Three.js 0.187.0\n\n'+fs.readFileSync(path.join(three,'LICENSE'),'utf8')+'\n\nMeshoptimizer 1.3.0\n\n'+fs.readFileSync(path.join(root,'audit/avatar-guide/runtime/reconstruction/model-tools/node_modules/meshoptimizer/LICENSE.md'),'utf8');
 fs.writeFileSync(path.join(dest,'3d-licenses.txt'),licenses);
 const files=['avatar3d.js','assets/guide/avatar-renderer.js','assets/guide/avatar-animated.glb','assets/guide/3d-licenses.txt'];
 const manifest={builtAt:new Date().toISOString(),libraries:{three:'0.187.0',meshoptimizer:'1.3.0',esbuild:'0.28.2'},files:files.map(file=>{const b=fs.readFileSync(path.join(root,file));return{file,bytes:b.length,SHA256:crypto.createHash('sha256').update(b).digest('hex')};})};
 fs.writeFileSync(path.join(__dirname,'build-manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest);
})().catch(error=>{console.error(error);process.exitCode=1;});

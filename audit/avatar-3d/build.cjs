const path=require('path'),fs=require('fs');
const runtime=path.resolve('audit/avatar-guide/runtime/node_modules'),esbuild=require(path.join(runtime,'esbuild'));
fs.mkdirSync('assets/vendor',{recursive:true});
esbuild.buildSync({absWorkingDir:process.cwd(),entryPoints:[path.resolve('audit/avatar-3d/three-entry.js')],nodePaths:[runtime],outfile:path.resolve('assets/vendor/three-r187.min.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
fs.copyFileSync(path.join(runtime,'three/LICENSE'),'assets/vendor/THREE-LICENSE.txt');
console.log({three:require(path.join(runtime,'three/package.json')).version,esbuild:require(path.join(runtime,'esbuild/package.json')).version,bytes:fs.statSync('assets/vendor/three-r187.min.js').size});

const http=require('http'),fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.glb':'model/gltf-binary','.wasm':'application/wasm','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon'};
http.createServer((request,response)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){response.writeHead(404);response.end();return;}response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(response);});
}).listen(8765,'127.0.0.1',()=>console.log('portfolio server 8765'));

const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sharp=require('C:/Users/begma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../..'),source=path.join(root,'audit/avatar-guide/sample_2026-11-09T202723.078.glb');
(async()=>{
 const bytes=fs.readFileSync(source);assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const chunks=[];for(let offset=12;offset<bytes.length;){const length=bytes.readUInt32LE(offset),type=bytes.readUInt32LE(offset+4);assert.equal(length%4,0);assert.ok(offset+8+length<=bytes.length);chunks.push({type,length,offset:offset+8});offset+=8+length;}
 assert.equal(chunks[0].type,0x4e4f534a);const gltf=JSON.parse(bytes.toString('utf8',chunks[0].offset,chunks[0].offset+chunks[0].length));const bin=chunks.find(c=>c.type===0x004e4942);assert.ok(bin);const binary=bytes.subarray(bin.offset,bin.offset+bin.length);
 fs.writeFileSync(path.join(__dirname,'gltf-structure.json'),JSON.stringify(gltf,null,2));
 const sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},types={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
 const accessor=(id)=>{const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView];assert.ok(v&&!a.sparse);assert.equal(v.buffer,0);const components=types[a.type],size=sizes[a.componentType],stride=v.byteStride||size*components,start=(v.byteOffset||0)+(a.byteOffset||0);const read={5120:'readInt8',5121:'readUInt8',5122:'readInt16LE',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];return {a,components,get:(i,k=0)=>binary[read](start+i*stride+k*size)};};
 const meshInfo=[];
 for(const [mi,mesh] of (gltf.meshes||[]).entries())for(const [pi,primitive] of mesh.primitives.entries()){
  const pos=accessor(primitive.attributes.POSITION),idx=primitive.indices!==undefined?accessor(primitive.indices):null,n=pos.a.count;
  const indices=idx?Array.from({length:idx.a.count},(_,i)=>idx.get(i)):Array.from({length:n},(_,i)=>i);const mode=primitive.mode??4;assert.equal(mode,4);assert.equal(indices.length%3,0);
  const parent=new Int32Array(n);for(let i=0;i<n;i++)parent[i]=i;const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};const union=(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)parent[rb]=ra;};
  let degenerate=0;for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3);assert.ok(a<n&&b<n&&c<n);union(a,b);union(a,c);if(a===b||a===c||b===c)degenerate++;}
  const groups=new Map();for(let i=0;i<n;i++){const id=find(i);if(!groups.has(id))groups.set(id,{vertices:0,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});const group=groups.get(id);group.vertices++;for(let k=0;k<3;k++){const value=pos.get(i,k);assert.ok(Number.isFinite(value));group.min[k]=Math.min(group.min[k],value);group.max[k]=Math.max(group.max[k],value);}}
  const normalInfo={nearZero:0,nonFinite:0,nonUnitAt1eMinus3:0,examples:[]};
  if(primitive.attributes.NORMAL!==undefined){const normals=accessor(primitive.attributes.NORMAL);for(let i=0;i<normals.a.count;i++){const length=Math.hypot(normals.get(i,0),normals.get(i,1),normals.get(i,2));if(!Number.isFinite(length))normalInfo.nonFinite++;if(length<1e-8)normalInfo.nearZero++;if(Math.abs(length-1)>1e-3){normalInfo.nonUnitAt1eMinus3++;if(normalInfo.examples.length<8)normalInfo.examples.push({vertex:i,length,position:[0,1,2].map(k=>pos.get(i,k))});}}}
  // Position welding is diagnostic only: it approximates physical connectivity across UV seams, not semantic parts or manifoldness.
  const welded=new Map();for(let i=0;i<n;i++){const key=[0,1,2].map(k=>Math.round(pos.get(i,k)*1e6)).join(',');if(welded.has(key))union(i,welded.get(key));else welded.set(key,i);}
  const weldedGroups=new Map();for(let i=0;i<n;i++){const id=find(i);if(!weldedGroups.has(id))weldedGroups.set(id,{vertices:0,min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});const g=weldedGroups.get(id);g.vertices++;for(let k=0;k<3;k++){g.min[k]=Math.min(g.min[k],pos.get(i,k));g.max[k]=Math.max(g.max[k],pos.get(i,k));}}
  const sortedEntries=[...weldedGroups.entries()].sort((a,b)=>b[1].vertices-a[1].vertices),sorted=sortedEntries.map(([,group])=>group);
  const rank=new Map(sortedEntries.map(([id],i)=>[id,i]));const componentIds=new Uint32Array(n);for(let i=0;i<n;i++)componentIds[i]=rank.get(find(i));
  const runtime=path.join(root,'audit/avatar-guide/runtime/reconstruction');fs.writeFileSync(path.join(runtime,`component-ranks-${mi}-${pi}.bin`),Buffer.from(componentIds.buffer));
  meshInfo.push({mesh:mi,primitive:pi,name:mesh.name||null,mode,vertices:n,triangles:indices.length/3,attributes:Object.keys(primitive.attributes),morphTargets:primitive.targets?.length||0,degenerateByIndex:degenerate,normals:normalInfo,indexComponents:groups.size,weldedComponentsAt1eMinus6:weldedGroups.size,largestWeldedComponents:sorted.slice(0,12),material:primitive.material});
 }
 const images=[];for(const [i,img]of(gltf.images||[]).entries()){
  if(img.uri){images.push({index:i,uri:img.uri});continue;}
  const v=gltf.bufferViews[img.bufferView];const data=binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);const metadata=await sharp(data).metadata();images.push({index:i,mimeType:img.mimeType,bytes:data.length,width:metadata.width,height:metadata.height,channels:metadata.channels});
 }
 const summary={source:path.relative(root,source).replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),asset:gltf.asset,glbChunks:chunks.map(({type,length})=>({type,length})),scene:gltf.scene,scenes:gltf.scenes,nodes:gltf.nodes,meshCount:gltf.meshes?.length||0,meshes:meshInfo,materials:gltf.materials,images,skins:gltf.skins||[],animations:gltf.animations||[],extensionsUsed:gltf.extensionsUsed||[],extensionsRequired:gltf.extensionsRequired||[],externalUris:[...(gltf.buffers||[]),...(gltf.images||[])].filter(x=>x.uri).map(x=>x.uri)};
 fs.writeFileSync(path.join(__dirname,'structure-check.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});

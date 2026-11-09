// Preserve the textured face and original neck. Join their actual cut contours.
module.exports = function repairHead(data, THREE, skinUV, rgb) {
 const plane=.095,bottom=-.04,top=.44,old=[...data.i],front=[],rim=[];
 const vertex=i=>({p:data.p.slice(i*3,i*3+3),n:data.n.slice(i*3,i*3+3),uv:data.uv.slice(i*2,i*2+2)});
 const lerp=(A,B,t)=>Object.fromEntries(['p','n','uv'].map(k=>[k,A[k].map((x,i)=>x+(B[k][i]-x)*t)]));
 function clip(poly,axis,value,greater){const output=[],edge=[];for(let k=0;k<poly.length;k++){const A=poly[k],B=poly[(k+1)%poly.length],inside=greater?A.p[axis]>=value:A.p[axis]<=value,next=greater?B.p[axis]>=value:B.p[axis]<=value;if(inside)output.push(A);if(inside!==next){const C=lerp(A,B,(value-A.p[axis])/(B.p[axis]-A.p[axis]));output.push(C);edge.push(C);}}return{poly:output,edge};}
 function add(A){const i=data.p.length/3;data.p.push(...A.p);data.n.push(...new THREE.Vector3(...A.n).normalize().toArray());data.uv.push(...A.uv);data.c.push(1,1,1);return i;}
 function emit(poly){if(poly.length<3)return;const ids=poly.map(add);for(let k=1;k<ids.length-1;k++)data.i.push(ids[0],ids[k],ids[k+1]);}
 data.i.length=0;
 for(let i=0;i<old.length;i+=3){const ids=old.slice(i,i+3),V=ids.map(vertex);if(V.every(A=>A.p[1]<=bottom)){data.i.push(...ids);continue;}
  const below=clip(V,1,bottom,false),above=clip(V,1,bottom,true);emit(below.poly);
  if(above.edge.length===2){let[A,B]=above.edge;if(A.p[2]<=plane||B.p[2]<=plane){if(A.p[2]>plane)A=lerp(A,B,(plane-A.p[2])/(B.p[2]-A.p[2]));if(B.p[2]>plane)B=lerp(B,A,(plane-B.p[2])/(A.p[2]-B.p[2]));rim.push([A,B]);}}
  const face=clip(above.poly,2,plane,true);emit(face.poly);if(face.edge.length===2)front.push(face.edge);
 }
 if(!rim.length||!front.length)throw new Error('Missing head repair contours');
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
 function bottomPoint(phi){const direction=[Math.cos(phi),-Math.sin(phi)];let furthest=0,result;
  for(const[A,B]of rim){const a=[A.p[0],A.p[2]-plane],segment=[B.p[0]-A.p[0],B.p[2]-A.p[2]],den=cross(direction,segment);if(Math.abs(den)<1e-10)continue;const t=cross(a,segment)/den,u=cross(a,direction)/den;if(t>furthest&&u>=-.00001&&u<=1.00001){furthest=t;result=lerp(A,B,Math.max(0,Math.min(1,u)));}}
  if(!result)throw new Error('Open source head/neck contour at '+phi);return result;
 }
 const rows=110,columns=192,base=data.p.length/3,baseRGB=rgb(...skinUV).map(linear),bottomPoints=Array.from({length:columns+1},(_,k)=>bottomPoint(k/columns*Math.PI));
 for(let j=0;j<=rows;j++){
  const y=bottom+(top-bottom)*j/rows,edgeSamples=[];
  for(const[A,B]of front)if(y>=Math.min(A.p[1],B.p[1])-.00001&&y<=Math.max(A.p[1],B.p[1])+.00001)edgeSamples.push(lerp(A,B,Math.max(0,Math.min(1,(y-A.p[1])/(B.p[1]-A.p[1]||1e-8)))));
  edgeSamples.sort((A,B)=>A.p[0]-B.p[0]);
  const ring=Math.sqrt(Math.max(.000001,1-((y-.18)/.26)**2)),rx=.213*ring,depth=.31*ring,join=smooth(bottom,bottom+.10,y);
  const left=edgeSamples[0]?.p[0]??-rx,right=edgeSamples.at(-1)?.p[0]??rx;
  for(let k=0;k<=columns;k++){
   const phi=k/columns*Math.PI,blend=smooth(0,.38,Math.sin(phi)),edge=(left+right)/2+(right-left)/2*Math.cos(phi),B=bottomPoints[k];
   const targetX=edge*(1-blend)+rx*Math.cos(phi)*blend,targetZ=plane-depth*Math.sin(phi),x=B.p[0]*(1-join)+targetX*join,z=B.p[2]*(1-join)+targetZ*join;
   const N=new THREE.Vector3(Math.cos(phi)/Math.max(rx,.001),(y-.18)/(.26*.26),-Math.sin(phi)/Math.max(depth,.001)).normalize();
   const hairline=.275-.15*(1-smooth(-.14,.035,z)),fade=smooth(hairline-.015,hairline+.015,y),tint=[1+(.017-1)*fade,1+(.05-1)*fade,1+(.09-1)*fade];
   const edgeSample=k<columns/2?edgeSamples.at(-1):edgeSamples[0];
   if(edgeSample){N.lerp(new THREE.Vector3(...edgeSample.n).normalize(),1-blend).normalize();const color=rgb(...edgeSample.uv).map((c,i)=>linear(c)/baseRGB[i]);for(let i=0;i<3;i++)tint[i]=tint[i]*blend+color[i]*(1-blend);}
   N.lerp(new THREE.Vector3(...B.n).normalize(),1-join).normalize();const color=rgb(...B.uv).map((c,i)=>linear(c)/baseRGB[i]);for(let i=0;i<3;i++)tint[i]=tint[i]*join+color[i]*(1-join);
   data.p.push(x,y,z);data.n.push(...N.toArray());data.uv.push(...skinUV);data.c.push(...tint);
  }
 }
 for(let j=0;j<rows;j++)for(let k=0;k<columns;k++){const a=base+j*(columns+1)+k,b=a+1,c=a+columns+1,d=c+1;data.i.push(a,b,c,b,d,c);}
 return {plane,bottom,top,frontSegments:front.length,neckSegments:rim.length};
};
function smooth(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x);}
function linear(c){c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}

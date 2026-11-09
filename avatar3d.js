import {Scene,Group,Mesh,SphereGeometry,CapsuleGeometry,BoxGeometry,TorusGeometry,TubeGeometry,CatmullRomCurve3,Vector3,Shape,ExtrudeGeometry,MeshPhongMaterial,HemisphereLight,DirectionalLight,OrthographicCamera,WebGLRenderer,SRGBColorSpace,ACESFilmicToneMapping} from './assets/vendor/three-r187.min.js';

function createCharacter(){
 const body=new Group(),head=new Group(),phones=new Group();body.add(head,phones);head.position.y=.65;phones.position.y=.65;
 const material=(color,shininess=20)=>new MeshPhongMaterial({color,shininess,specular:0x282828});
 const skin=material(0xd9a16c),skinLight=material(0xeab985),hair=material(0x191714),shirt=material(0x315f4e),cuff=material(0x417965),black=material(0x17191b),pad=material(0x282a2c),white=material(0xf7f1e9),iris=material(0x46301f),pupil=material(0x101010),accent=material(0x73d9e4),grey=material(0x85847e);
 const sphere=new SphereGeometry(1,32,24);
 function add(geometry,mat,parent,position=[0,0,0],scale=[1,1,1]){const mesh=new Mesh(geometry,mat);mesh.position.set(...position);mesh.scale.set(...scale);parent.add(mesh);return mesh;}
 const ball=(mat,parent,position,scale)=>add(sphere,mat,parent,position,scale);
 function tube(points,radius,mat,parent){return add(new TubeGeometry(new CatmullRomCurve3(points.map(point=>new Vector3(...point))),32,radius,8,false),mat,parent);}
 function roundedBox(w,h,d,r=.06){
  const s=new Shape();s.moveTo(r,0);s.lineTo(w-r,0);s.quadraticCurveTo(w,0,w,r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(r,h);s.quadraticCurveTo(0,h,0,h-r);s.lineTo(0,r);s.quadraticCurveTo(0,0,r,0);
  const geometry=new ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:6});geometry.translate(-w/2,-h/2,-d/2);return geometry;
 }
 ball(shirt,body,[0,-.99,-.03],[.68,.76,.38]);ball(skin,body,[0,-.29,0],[.235,.3,.23]);
 const collar=add(new TorusGeometry(.25,.04,8,32),cuff,body,[0,-.35,.03]);collar.rotation.x=Math.PI/2;
 ball(skinLight,head,[0,0,0],[.86,.96,.72]);
 for(const side of [-1,1]){ball(skin,head,[side*.84,-.02,-.02],[.16,.23,.14]);ball(skinLight,head,[side*.87,-.02,.055],[.09,.14,.06]);}
 const cap=new SphereGeometry(1,40,20,0,Math.PI*2,0,1.08);add(cap,hair,head,[0,.045,-.025],[.90,1.02,.76]);
 const back=new SphereGeometry(1,32,24,Math.PI,Math.PI,0,2.05);add(back,hair,head,[0,.02,-.02],[.895,1.0,.75]);
 for(let i=0;i<11;i++){const x=-.65+i*.13;const lock=ball(hair,head,[x,.61+.13*(1-Math.abs(x)),.55],[.19,.105,.10]);lock.rotation.z=-.38;}
 const eyePivots=[];
 for(const side of [-1,1]){
  ball(white,head,[side*.31,.015,.644],[.175,.212,.095]);
  const eye=new Group();eye.position.set(side*.31,.025,.729);head.add(eye);eyePivots.push(eye);
  ball(iris,eye,[0,0,0],[.125,.169,.044]);ball(pupil,eye,[0,.003,.034],[.075,.121,.024]);ball(white,eye,[-.033,.053,.052],[.030,.037,.016]);
  const brow=add(new CapsuleGeometry(.058,.20,4,12),hair,head,[side*.31,.367,.637]);brow.rotation.z=Math.PI/2+side*.08;
 }
 ball(skin,head,[0,-.21,.735],[.145,.16,.145]);
 tube([[-.27,-.415,.64],[-.14,-.49,.697],[0,-.51,.718],[.14,-.49,.697],[.27,-.415,.64]],.028,material(0x503322),head);
 tube([[-1.0,-.015,0],[-1.035,.58,-.02],[-.65,1.04,-.025],[0,1.16,-.025],[.65,1.04,-.025],[1.035,.58,-.02],[1.0,-.015,0]],.082,black,phones);
 for(const side of [-1,1]){
  ball(pad,phones,[side*.93,-.015,0],[.085,.29,.21]);ball(black,phones,[side*1.05,-.015,0],[.135,.33,.24]);
  const ring=add(new TorusGeometry(.19,.012,8,24),accent,phones,[side*1.16,-.015,0],[1,1.25,1]);ring.rotation.y=Math.PI/2;
 }
 function arm(side){
  const shoulder=new Group();shoulder.position.set(side*.63,-.54,0);body.add(shoulder);
  ball(shirt,shoulder,[0,-.14,0],[.21,.24,.23]);ball(cuff,shoulder,[0,-.29,0],[.17,.055,.19]);
  add(new CapsuleGeometry(.125,.12,4,16),skinLight,shoulder,[0,-.36,0]);
  const elbow=new Group();elbow.position.y=-.40;shoulder.add(elbow);add(new CapsuleGeometry(.104,.14,4,16),skinLight,elbow,[0,-.13,0]);
  const hand=new Group();hand.position.y=-.34;elbow.add(hand);ball(skinLight,hand,[0,-.04,0],[.13,.15,.067]);
  for(let i=0;i<4;i++)add(new CapsuleGeometry(.027,.095-(Math.abs(i-1.5)*.016),3,10),skinLight,hand,[(i-1.5)*.062,-.18-(i===1||i===2?.018:0),0]);
  const thumb=add(new CapsuleGeometry(.035,.09,3,10),skinLight,hand,[side*.145,-.015,.01]);thumb.rotation.z=side*.65;
  return {shoulder,elbow,hand};
 }
 const left=arm(-1),right=arm(1);
 const laptop=add(roundedBox(1.19,.62,.065,.065),grey,body,[-.10,-1.14,.51]);laptop.rotation.x=-.06;
 add(roundedBox(1.26,.055,.17,.025),pad,body,[-.10,-1.46,.54]);
 return {body,head,phones,left,right,eyePivots};
}

export function mountAvatar(host){
 const canvas=host.querySelector('canvas'),poster=host.querySelector('.avatar-poster'),status=host.querySelector('.avatar-status'),waveButton=host.querySelector('#avatar-wave'),listenButton=host.querySelector('#avatar-listen');
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 let renderer;
 try{const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});if(!context){host.dataset.avatar='fallback';return;}renderer=new WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{host.dataset.avatar='fallback';return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(256,256,false);renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x000000,0);
 const scene=new Scene(),camera=new OrthographicCamera(-1.85,1.85,1.85,-1.85,.1,20);camera.position.set(0,.12,6);camera.lookAt(0,.12,0);
 scene.add(new HemisphereLight(0xfff6e9,0x45545e,2.1));const key=new DirectionalLight(0xffe8d0,2.6);key.position.set(-3,4,5);scene.add(key);const rim=new DirectionalLight(0xc3e9ef,1.8);rim.position.set(3,2,-3);scene.add(rim);
 const rig=createCharacter();scene.add(rig.body);
 let yaw=0,pitch=0,headset=0,targetHeadset=0,transitionFrom=0,transitionStart=0,waveStart=-10000,staticWave=false,frame=0,inside=false,drag=null,pinnedListen=false,visible=true,modal=!!document.querySelector('dialog[open]'),leaveTimer,poseTimer,disposed=false;
 let lastFrame=0,renderCount=0,armReach=0,waveLift=0;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),smooth=value=>value*value*(3-2*value);
 const idleText='Здесь мой опыт. Покрутите меня ↔';
 const active=()=>visible&&!document.hidden&&!modal&&!disposed;
 function request(){if(!frame&&active())frame=requestAnimationFrame(draw);}
 function setListening(value){
  if(targetHeadset===Number(value))return;transitionFrom=headset;targetHeadset=Number(value);transitionStart=performance.now();
  if(motion.matches)headset=targetHeadset;
  listenButton.setAttribute('aria-pressed',String(value));status.textContent=value?'Слушаю вас':idleText;host.dataset.listening=String(value);request();
 }
 function wave(){
  clearTimeout(poseTimer);status.textContent='Привет! Рад знакомству.';
  if(motion.matches){staticWave=true;poseTimer=setTimeout(()=>{staticWave=false;status.textContent=targetHeadset?'Слушаю вас':idleText;request();},1400);}else waveStart=performance.now();request();
 }
 function draw(time){
  frame=0;if(!active())return;
  // Не больше 30 кадров/с; в покое цикл вообще не запущен.
  const delta=time-lastFrame;if(delta<30){request();return;}lastFrame=time;
  let transitioning=false;
  if(!motion.matches&&headset!==targetHeadset){const t=clamp((time-transitionStart)/750,0,1);headset=transitionFrom+(targetHeadset-transitionFrom)*smooth(t);if(t===1)headset=targetHeadset;else transitioning=true;}
  const reachGoal=transitioning?Math.sin(Math.PI*clamp((time-transitionStart)/750,0,1)):0;
  armReach=motion.matches?0:armReach+(reachGoal-armReach)*Math.min(1,delta/85);if(armReach<.005)armReach=0;const reach=armReach;
  rig.phones.position.set(0,.65-1.12*headset,.32*Math.sin(Math.PI*headset));rig.phones.rotation.x=-Math.PI*.46*headset;rig.head.rotation.x=.055*headset;
  if(waveStart>0&&time-waveStart>=1700){waveStart=-10000;status.textContent=targetHeadset?'Слушаю вас':idleText;}
  const phase=clamp((time-waveStart)/1700,0,1),waving=phase>0&&phase<1&&!motion.matches;
  const liftGoal=staticWave?1:waving?Math.sin(Math.PI*phase)**.35:0;
  waveLift=motion.matches?liftGoal:waveLift+(liftGoal-waveLift)*Math.min(1,delta/85);if(waveLift<.005)waveLift=0;const lift=waveLift;
  rig.left.shoulder.rotation.set(-.1,-.05,-.13-2.45*reach);rig.left.elbow.rotation.z=-.4*reach;
  rig.right.shoulder.rotation.set(-.1,.05,.13+Math.max(2.45*reach,2.28*lift));rig.right.elbow.rotation.z=Math.max(.4*reach,.6*lift);rig.right.hand.rotation.z=waving?Math.sin(phase*Math.PI*9)*.22*lift:0;
  rig.body.rotation.set(pitch,yaw,0);renderer.render(scene,camera);renderCount++;
  canvas.dataset.yaw=yaw.toFixed(3);canvas.dataset.headset=headset.toFixed(3);canvas.dataset.wave=String(waving||staticWave);canvas.dataset.renders=String(renderCount);
  if(waving||transitioning||!motion.matches&&(armReach>0||waveLift>0))request();
 }
 function reset(){yaw=0;pitch=0;waveStart=-10000;staticWave=false;pinnedListen=false;setListening(false);request();}
 canvas.addEventListener('pointerenter',event=>{inside=true;clearTimeout(leaveTimer);if(fine.matches&&event.pointerType!=='touch')setListening(true);});
 canvas.addEventListener('pointerleave',()=>{inside=false;if(!drag){leaveTimer=setTimeout(()=>{if(!inside&&!pinnedListen)setListening(false);},250);}});
 canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,locked:event.pointerType!=='touch'};if(drag.locked)canvas.setPointerCapture(event.pointerId);});
 canvas.addEventListener('pointermove',event=>{
  if(drag&&event.pointerId===drag.id){const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(!drag.locked){if(Math.abs(dy)>Math.abs(dx))return;if(Math.abs(dx)<6)return;drag.locked=true;canvas.setPointerCapture(event.pointerId);}
   event.preventDefault();yaw=drag.yaw+dx*.012;pitch=clamp(drag.pitch+(event.pointerType==='touch'?0:dy*.006),-.25,.25);request();
  }else if(fine.matches){const rect=canvas.getBoundingClientRect(),x=clamp(((event.clientX-rect.left)/rect.width-.5)*.065,-.04,.04),y=clamp((.5-(event.clientY-rect.top)/rect.height)*.045,-.03,.03);rig.eyePivots.forEach(eye=>{eye.position.z=.729;eye.children.forEach(part=>{part.position.x=(part.userData.baseX??=part.position.x)+x;part.position.y=(part.userData.baseY??=part.position.y)+y;});});request();}
 });
 function release(event){if(drag?.id!==event.pointerId)return;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);drag=null;if(!inside&&!pinnedListen)setListening(false);}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','Escape'].includes(event.key))return;event.preventDefault();if(event.key==='Home'||event.key==='Escape')reset();else{yaw+=event.key==='ArrowRight'?.24:event.key==='ArrowLeft'?-.24:0;pitch=clamp(pitch+(event.key==='ArrowDown'?.1:event.key==='ArrowUp'?-.1:0),-.25,.25);request();}});
 waveButton.addEventListener('click',wave);listenButton.addEventListener('click',()=>{pinnedListen=!targetHeadset;setListening(pinnedListen);});
 const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(frame);frame=0;}},{threshold:.05});visibility.observe(host);
 function suspend(){modal=!!document.querySelector('dialog[open]');if(!active()){cancelAnimationFrame(frame);frame=0;}else request();}
 document.addEventListener('visibilitychange',suspend);document.addEventListener('portfolio:dialog',suspend);
 const resize=new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width>0){renderer.setSize(width,width,false);request();}});resize.observe(canvas.parentElement);
 motion.addEventListener('change',()=>{if(motion.matches){headset=targetHeadset;waveStart=-10000;staticWave=false;armReach=waveLift=0;status.textContent=targetHeadset?'Слушаю вас':idleText;}request();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;canvas.hidden=true;poster.hidden=false;waveButton.disabled=listenButton.disabled=true;host.dataset.avatar='fallback';status.textContent='Бегмат · ваш проводник';});
 canvas.addEventListener('webglcontextrestored',()=>{canvas.hidden=false;poster.hidden=true;waveButton.disabled=listenButton.disabled=false;host.dataset.avatar='ready';request();});
 addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;clearTimeout(leaveTimer);clearTimeout(poseTimer);if(!event.persisted){disposed=true;visibility.disconnect();resize.disconnect();scene.traverse(object=>{object.geometry?.dispose();if(object.material)object.material.dispose();});renderer.dispose();}});
 addEventListener('pageshow',()=>{if(!disposed)request();});
 // Первый кадр рисуем до замены постера: размер карточки не меняется.
 renderer.render(scene,camera);canvas.hidden=false;poster.hidden=true;waveButton.disabled=listenButton.disabled=false;host.dataset.avatar='ready';host.dataset.listening='false';status.textContent=idleText;request();document.dispatchEvent(new Event('portfolio:avatar-ready'));
 if(!motion.matches)wave();
}

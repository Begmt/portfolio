// Общий жизненный цикл: ни один автоплей не работает вне экрана, в фоне или при reduce.
function motionLifecycle(element, start, stop) {
  let visible = false, running = false;
  element.dataset.motionRunning = 'false';
  const holds = new Set();
  function sync() {
    const next = visible && !document.hidden && !reducedMotion.matches && !holds.size && !document.querySelector('dialog[open]');
    if (next === running) return;
    running = next; element.dataset.motionRunning = String(next);
    if (next) start(); else stop();
  }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .12; sync(); },{threshold:[0,.12]}).observe(element);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('portfolio:dialog', sync);
  reducedMotion.addEventListener('change', sync);
  return {hold(key, value) { if (value) holds.add(key); else holds.delete(key); sync(); }};
}
const numberFrames = new WeakMap();
const pendingNumbers = new Map();
function finishNumber(element) {
  const finish=pendingNumbers.get(element);
  if(finish){cancelAnimationFrame(numberFrames.get(element));finish();}
}
function finishMotion() {
  document.documentElement.classList.toggle('page-hidden',document.hidden);
  if(!document.hidden&&!reducedMotion.matches)return;
  [...pendingNumbers.keys()].forEach(finishNumber);
  document.getAnimations().forEach(animation=>{if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();});
}
document.addEventListener('visibilitychange',finishMotion);
reducedMotion.addEventListener('change',finishMotion);
function animateNumber(element, value, decimals = 0, locale = false) {
  cancelAnimationFrame(numberFrames.get(element));
  pendingNumbers.delete(element);
  const from = Number(element.dataset.current || value), start = performance.now();
  const render = n => { element.textContent = locale ? n.toLocaleString('ru-RU', {maximumFractionDigits: decimals, minimumFractionDigits: decimals}) : n.toFixed(decimals); element.dataset.current = n; };
  if (from===value||reducedMotion.matches||document.hidden||element.closest('dialog:not([open])')) { render(value); return; }
  const finish=()=>{render(value);pendingNumbers.delete(element);};
  pendingNumbers.set(element,finish);
  function frame(now) {
    if(document.hidden||reducedMotion.matches){finish();return;}
    const progress = Math.min((now - start) / 550, 1);
    render(from + (value - from) * (1 - (1 - progress) ** 3));
    if (progress < 1) numberFrames.set(element, requestAnimationFrame(frame));
    else pendingNumbers.delete(element);
  }
  numberFrames.set(element, requestAnimationFrame(frame));
}
let toastTimer;
function toast(message) {
  const el = document.getElementById('toast');
  clearTimeout(toastTimer); el.hidden = false; el.textContent = message;
  if(el.showPopover&&!el.matches(':popover-open'))el.showPopover();
  toastTimer = setTimeout(() => { if(el.hidePopover&&el.matches(':popover-open'))el.hidePopover();el.hidden = true; el.textContent = ''; }, 4200);
}
// Все диалоги используют нативный inert/Esc и один алгоритм удержания/возврата фокуса.
function dialogController(dialog) {
  let opener, animation;
  const inner = dialog.firstElementChild;
  function open(from = document.activeElement) {
    if (dialog.open) return;
    document.dispatchEvent(new Event('portfolio:before-dialog'));
    opener = from; dialog.showModal(); document.body.style.overflow = 'hidden';
    document.dispatchEvent(new Event('portfolio:dialog'));
    if (!reducedMotion.matches) animation = inner.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}], {duration:240,easing:'cubic-bezier(.2,0,0,1)'});
    (dialog.querySelector('input:not([type=radio]):not([type=checkbox])') || dialog.querySelector('button'))?.focus();
  }
  function close() { if (!dialog.open) return; animation?.cancel(); dialog.close(); }
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  dialog.querySelectorAll('.dialog-close,#modal-close-btn').forEach(button => button.addEventListener('click', close));
  dialog.addEventListener('close', () => {
    animation?.cancel();
    [...pendingNumbers.keys()].filter(el=>dialog.contains(el)).forEach(finishNumber);
    dialog.getAnimations({subtree:true}).forEach(item=>{if(Number.isFinite(item.effect?.getComputedTiming().endTime))item.finish();});
    if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
    document.dispatchEvent(new Event('portfolio:dialog'));
    const visible=el=>el?.isConnected&&el.getClientRects().length&&!el.closest('[inert]');
    const fallback=document.getElementById('mobile-menu-btn');
    (visible(opener)?opener:visible(fallback)?fallback:document.querySelector('.nav-logo'))?.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', e => {
    // type=search может поглотить первый Esc для очистки поля.
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if (e.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('button,input,textarea,[href],select,[tabindex="0"]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && !(el.type === 'radio' && !el.checked));
    if (!items.length) return;
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
  });
  return {open,close};
}
function initScrollAnimations() {
  if (reducedMotion.matches) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {threshold:.08});
  // Наблюдаем внешние секции: измерение потомков не должно будить дальние поддеревья.
  const approaching=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    approaching.unobserve(entry.target);
    entry.target.querySelectorAll('.animate-on-scroll,.container > .section-label,.container > .section-heading,.container > .section-sub,.profile-card,.trust-grid,.formats-grid,.faq-list,.process-demo,.roi-card').forEach(el=>{
      el.classList.add('animate-on-scroll');
      const siblings=[...el.parentElement.children].filter(item=>item.matches('.animate-on-scroll'));
      el.style.setProperty('--reveal-delay',`${Math.min(siblings.indexOf(el),3)*90}ms`);
      observer.observe(el);el.classList.add('reveal-ready');
    });
  }),{rootMargin:'200px'});
  document.querySelectorAll('main > section:not(#hero):not([hidden])').forEach(section=>approaching.observe(section));
}
function initTerminalTabs() {
  const inspector=document.querySelector('.code-inspector');
  const enhance=()=>{
    if(!inspector.open)return;
    inspector.removeEventListener('toggle',enhance);enhanceTerminalTabs();
  };
  inspector.addEventListener('toggle',enhance);enhance();
}
function enhanceTerminalTabs() {
  const visual = document.querySelector('.hero-visual'), tabs = [...visual.querySelectorAll('.terminal-tab')];
  visual.classList.add('tabs-ready'); visual.querySelector('.terminal-tabs').hidden = false;
  const play = document.getElementById('code-play'), status = document.getElementById('code-run-status');
  play.hidden = false; let index = 0, frame, timer, controller;
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const sources = panels.map(panel => panel.querySelector('code').textContent);
  panels.forEach((panel,i) => {
    const code = panel.querySelector('code'); code.textContent = '';
    const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = sources[i];
    const printed = document.createElement('span'); printed.setAttribute('aria-hidden','true'); printed.className = 'printed-code'; printed.textContent = sources[i];
    code.append(accessible,printed);
  });
  function stopTyping() {
    cancelAnimationFrame(frame);
    panels[index].querySelector('.printed-code').textContent = sources[index];
  }
  function select(next, focus = false, type = false) {
    stopTyping(); index = next;
    tabs.forEach((tab,i) => {
      tab.hidden = false; tab.classList.toggle('active',i === index); tab.setAttribute('aria-selected',String(i === index)); tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index; panels[i].classList.toggle('active',i === index);
    });
    if (focus) tabs[index].focus();
    status.textContent = 'Учебный обработчик · демо-симуляция';
    if (!type || reducedMotion.matches) return;
    const text = sources[index], printed = panels[index].querySelector('.printed-code'), start = performance.now();let lastPrint=0;
    function print(now) {
      const progress = Math.min((now - start) / 2100,1);
      if(now-lastPrint<50&&progress<1){frame=requestAnimationFrame(print);return;}lastPrint=now;
      printed.textContent = text.slice(0,Math.ceil(text.length * progress));
      if (progress < 1) frame = requestAnimationFrame(print);
      else status.textContent = `✓ 200 OK · ${Math.round(now-start)} мс · демо-печать, не время ответа сервера`;
    }
    frame = requestAnimationFrame(print);
  }
  const terminal=visual.querySelector('.terminal-window'),inspector=visual.querySelector('.code-inspector');
  controller = motionLifecycle(terminal, () => { select(index,false,true); timer = setInterval(() => select((index+1)%tabs.length,false,true),7200); }, () => { clearInterval(timer); stopTyping(); });
  if(inspector){controller.hold('closed',!inspector.open);inspector.addEventListener('toggle',()=>{controller.hold('closed',!inspector.open);if(!inspector.open)stopTyping();});}
  visual.addEventListener('pointerenter', () => controller.hold('hover',true));
  visual.addEventListener('pointerleave', () => controller.hold('hover',false));
  visual.addEventListener('focusin', () => controller.hold('focus',true));
  visual.addEventListener('focusout', e => { if (!visual.contains(e.relatedTarget)) controller.hold('focus',false); });
  tabs.forEach((tab,i) => {
    tab.addEventListener('click', () => select(i,false,!reducedMotion.matches));
    tab.addEventListener('keydown', e => {
      const next = e.key==='Home'?0:e.key==='End'?tabs.length-1:e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:null;
      if (next !== null) { e.preventDefault(); select(next,true,false); }
    });
  });
  play.addEventListener('click', () => { const paused = play.getAttribute('aria-pressed') !== 'true'; play.setAttribute('aria-pressed',String(paused)); play.textContent = paused?'Продолжить демо':'Пауза демо'; controller.hold('user',paused); });
  const playLabel=()=>{play.disabled=reducedMotion.matches;play.textContent=reducedMotion.matches?'Автодемо отключено':play.getAttribute('aria-pressed')==='true'?'Продолжить демо':'Пауза демо';};playLabel();reducedMotion.addEventListener('change',playLabel);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stopTyping();}).observe(terminal);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTyping();});
  document.addEventListener('portfolio:dialog',()=>{if(document.querySelector('dialog[open]'))stopTyping();});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)stopTyping();});
  select(0);
}
function initHeroLabel() {
  const label = document.getElementById('hero-typewriter'), text = label.textContent;
  if (!reducedMotion.matches && !document.hidden) {
    // Полный текст сохраняет размеры и доступность; проявление не меняет DOM каждый кадр.
    const typing=label.animate([{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:text.length*28,easing:`steps(${text.length},end)`});
    const finish=()=>typing.finish();
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)finish();});document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  }
}
function initParticles() {
  const canvas = document.getElementById('particles-canvas'), hero = document.getElementById('hero'), ctx = canvas.getContext('2d');
  if (!ctx) return; hero.prepend(canvas);
  const compact=matchMedia('(max-width:768px)');
  let width,height,packets=[],frame,previous;
  function resize() {
    if(compact.matches)return;
    width=hero.clientWidth; height=hero.clientHeight; canvas.width=width;canvas.height=height;
    packets=Array.from({length:width<769?8:18},(_,i)=>({horizontal:i%2===0,lane:1+Math.floor(Math.random()*Math.max(1,Math.floor((i%2===0?height:width)/64)-1)),position:Math.random(),speed:20+Math.random()*15}));
  }
  function draw(now) {
    const dt=Math.min((now-(previous||now))/1000,.05);previous=now;
    ctx.clearRect(0,0,width,height);ctx.strokeStyle='#73d9e422';ctx.lineWidth=1;ctx.beginPath();
    for(let x=0;x<width;x+=64){ctx.moveTo(x,0);ctx.lineTo(x,height);}for(let y=0;y<height;y+=64){ctx.moveTo(0,y);ctx.lineTo(width,y);}ctx.stroke();
    ctx.fillStyle='#73d9e4';packets.forEach(p=>{p.position=(p.position+dt*p.speed/(p.horizontal?width:height))%1;ctx.fillRect(p.horizontal?p.position*width:p.lane*64,p.horizontal?p.lane*64:p.position*height,p.horizontal?9:3,p.horizontal?3:9);});
    frame=requestAnimationFrame(draw);
  }
  new ResizeObserver(resize).observe(hero);
  const controller=motionLifecycle(hero,()=>{resize();document.documentElement.classList.remove('motion-paused');previous=0;frame=requestAnimationFrame(draw);},()=>{document.documentElement.classList.add('motion-paused');cancelAnimationFrame(frame);ctx.clearRect(0,0,width||0,height||0);});
  // На узком экране декоративная сетка скрыта и не занимает кадры/память canvas.
  controller.hold('compact',compact.matches);
  compact.addEventListener('change',()=>controller.hold('compact',compact.matches));
}
function initEcosystem() {
  const map=document.getElementById('ecosystem-map'),svg=document.getElementById('ecosystem-svg'),log=document.getElementById('eco-terminal-body');
  const controls=document.querySelector('.scenario-controls'); controls.hidden=false;
  svg.pauseAnimations();
  let timers=[],autoTimer,controller,round=0,busyUntil=0;
  const scenarios={order:['node-bitrix','node-center','node-moysklad'],call:['node-telephony','node-center','node-amo'],payment:['node-amo','node-center','node-moysklad','node-bitrix']};
  const methods={'node-bitrix':'POST /bitrix/event','node-center':'POST /handler/verify','node-moysklad':'PUT /inventory/reserve','node-telephony':'POST /telephony/call','node-amo':'POST /amo/lead'};
  function element(tag,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function point(node){const a=node.getBoundingClientRect(),b=map.getBoundingClientRect();return [a.left-b.left+a.width/2,a.top-b.top+a.height/2];}
  function draw(){
    svg.querySelectorAll('.eco-line-group').forEach(el=>el.remove());svg.setAttribute('viewBox',`0 0 ${map.clientWidth} ${map.clientHeight}`);
    const b=point(document.getElementById('node-center'));
    map.querySelectorAll('.eco-satellite').forEach(node=>{
      const a=point(node),d=`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`,g=element('g',{class:'eco-line-group','data-node':node.id});
      g.append(element('path',{d,stroke:'currentColor','stroke-opacity':'.35','stroke-width':1.5,fill:'none'}));
      const dot=element('circle',{r:4,fill:'currentColor',class:'scenario-packet',opacity:0});dot.append(element('animateMotion',{path:d,dur:'.65s',begin:'indefinite',fill:'freeze'}));g.append(dot);svg.append(g);
    });
  }
  let mapVisible=false;
  new ResizeObserver(()=>{if(mapVisible)draw();}).observe(map);
  new IntersectionObserver(entries=>{mapVisible=entries[0].isIntersecting;if(mapVisible)draw();}).observe(map);
  function cancel(){timers.forEach(clearTimeout);timers=[];map.querySelectorAll('.node-active').forEach(el=>el.classList.remove('node-active'));svg.querySelectorAll('.scenario-packet').forEach(el=>el.setAttribute('opacity','0'));svg.pauseAnimations();}
  function step(nodeId,outgoing=false){
    map.querySelectorAll('.node-active').forEach(el=>el.classList.remove('node-active'));
    document.getElementById(nodeId).classList.add('node-active');
    const dot=svg.querySelector(`[data-node="${nodeId}"] .scenario-packet`);
    if(dot&&!reducedMotion.matches){svg.unpauseAnimations();dot.setAttribute('opacity','1');const motion=dot.firstElementChild;motion.setAttribute('keyPoints',outgoing?'1;0':'0;1');motion.setAttribute('keyTimes','0;1');motion.setAttribute('calcMode','linear');motion.beginElement();timers.push(setTimeout(()=>dot.setAttribute('opacity','0'),650));}
    log.querySelector('.console-placeholder')?.remove();
    const start=performance.now();
    const append=()=>{const entry=document.createElement('div');entry.className='console-log-entry';entry.textContent=`[${new Date().toLocaleTimeString('ru-RU')}] ДЕМО · ${methods[nodeId]} · 200 OK · ${Math.round(performance.now()-start)} мс (таймер симуляции)`;log.append(entry);while(log.children.length>12)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;};
    if(reducedMotion.matches)append();else timers.push(setTimeout(append,90));
  }
  function run(key){cancel();const nodes=scenarios[key];busyUntil=performance.now()+nodes.length*700+700;nodes.forEach((node,i)=>{const outgoing=i>nodes.indexOf('node-center');if(reducedMotion.matches)step(node,outgoing);else timers.push(setTimeout(()=>step(node,outgoing),i*700));});}
  controller=motionLifecycle(document.getElementById('ecosystem'),()=>{const next=()=>run(Object.keys(scenarios)[round++%3]);next();autoTimer=setInterval(()=>{if(performance.now()>=busyUntil)next();},6200);},()=>{clearInterval(autoTimer);cancel();});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)cancel();}).observe(map);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  document.addEventListener('portfolio:dialog',()=>{if(document.querySelector('dialog[open]'))cancel();});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)cancel();});
  controls.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>run(button.dataset.scenario)));
  const hover=matchMedia('(hover:hover) and (pointer:fine)');
  map.querySelectorAll('.eco-node').forEach(node=>{
    const select=()=>{cancel();step(node.id);};
    node.addEventListener('click',select);node.addEventListener('pointerenter',()=>{if(hover.matches){controller.hold('hover',true);select();}});node.addEventListener('pointerleave',()=>controller.hold('hover',false));
  });
  const play=document.getElementById('eco-play');play.addEventListener('click',()=>{const paused=play.getAttribute('aria-pressed')!=='true';play.setAttribute('aria-pressed',String(paused));play.textContent=paused?'Продолжить автодемо':'Пауза автодемо';controller.hold('user',paused);});
  const playLabel=()=>{play.disabled=reducedMotion.matches;play.textContent=reducedMotion.matches?'Автодемо отключено':play.getAttribute('aria-pressed')==='true'?'Продолжить автодемо':'Пауза автодемо';};playLabel();reducedMotion.addEventListener('change',playLabel);
}
function initCaseCards() {
  const grid=document.querySelector('.cases-grid'),cards=[...grid.querySelectorAll('.case-card')],filters=document.getElementById('case-filters');
  grid.classList.add('cases-ready');filters.hidden=false;
  const lightbox=document.getElementById('case-lightbox'),viewer=dialogController(lightbox);
  cards.forEach(card=>{
    motionLifecycle(card,()=>{},()=>{card.querySelectorAll('.case-count').forEach(el=>{finishNumber(el);el.textContent=el.dataset.value;});});
    const button=card.querySelector('.case-toggle'),content=card.querySelector('.case-expandable');button.hidden=false;content.inert=true;content.setAttribute('aria-hidden','true');
    button.addEventListener('click',()=>{
      const before=new Map(cards.filter(el=>!el.hidden).map(el=>[el,el.getBoundingClientRect()]));
      const anchor=card.getBoundingClientRect().top;
      const expanded=!card.classList.contains('expanded');card.classList.toggle('expanded',expanded);content.inert=!expanded;content.setAttribute('aria-hidden',String(!expanded));button.setAttribute('aria-expanded',String(expanded));button.querySelector('.toggle-text').textContent=expanded?'Свернуть':'Подробнее';
      // Геометрия переключается сразу; двигаются только transform/opacity.
      const shift=card.getBoundingClientRect().top-anchor;
      if(shift)window.scrollBy({top:shift,behavior:'instant'});
      if(!reducedMotion.matches){
        cards.filter(el=>!el.hidden&&el!==card).forEach(el=>{const old=before.get(el),now=el.getBoundingClientRect();if(old&&old.top!==now.top)el.animate([{transform:`translateY(${old.top-now.top}px)`},{transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});});
        if(expanded)content.firstElementChild.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
      }
      if(expanded)card.querySelectorAll('.case-count').forEach(el=>{el.dataset.current=0;animateNumber(el,Number(el.dataset.value));});
      else card.querySelectorAll('.case-count').forEach(finishNumber);
    });
    const preview=card.querySelector('.screenshot-placeholder'),image=SITE_CONFIG.caseImages[card.dataset.case];
    let imageURL;try{if(image?.src)imageURL=new URL(image.src,location.href);}catch{}
    // Кнопка появляется только для заданного HTTP(S)-изображения.
    preview.hidden=!imageURL||!['https:','http:'].includes(imageURL.protocol);
    preview.addEventListener('click',()=>{
      if(preview.hidden)return;
      const container=document.getElementById('lightbox-content');container.replaceChildren();
      document.getElementById('lightbox-title').textContent=`Скриншот кейса ${card.dataset.case}`;
      const img=document.createElement('img');img.src=imageURL.href;img.alt=image.alt||`Скриншот кейса ${card.dataset.case}`;
      img.addEventListener('error',()=>{container.textContent='Скриншот временно недоступен.';});container.append(img);
      viewer.open(preview);
    });
  });
  filters.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    const before=new Map(cards.map(card=>[card,card.getBoundingClientRect()]));
    filters.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    cards.forEach(card=>{card.hidden=button.dataset.filter!=='all'&&!card.dataset.systems.split(' ').includes(button.dataset.filter);card.classList.add('visible');});
    const visible=cards.filter(card=>!card.hidden);document.getElementById('case-filter-status').textContent=`Показано кейсов: ${visible.length}`;
    if(!reducedMotion.matches)visible.forEach(card=>{const a=before.get(card),b=card.getBoundingClientRect();card.getAnimations().forEach(a=>a.cancel());card.animate([{transform:`translate(${a.width?a.left-b.left:0}px,${a.width?a.top-b.top:10}px)`,opacity:.4},{transform:'translate(0,0)',opacity:1}],{duration:300,easing:'cubic-bezier(.2,0,0,1)'});});
  }));
}
function initCalculator() {
  const modal=document.getElementById('calculator-modal'),dialog=dialogController(modal),trigger=document.getElementById('cta-primary');
  const request=document.getElementById('request-text'),status=document.getElementById('copy-status'),contact=document.getElementById('request-contact');let step=0;
  const panels=[...modal.querySelectorAll('[data-wizard-step]')],back=document.getElementById('wizard-back'),next=document.getElementById('wizard-next');
  function showStep(value,focus=true){
    step=value;panels.forEach(panel=>panel.hidden=Number(panel.dataset.wizardStep)!==step);
    back.hidden=step===0;next.hidden=step===2;
    modal.querySelectorAll('.wizard-progress li').forEach((li,i)=>{if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');li.classList.toggle('complete',i<step);});
    document.querySelector('#wizard-meter span').style.transform=`scaleX(${(step+1)/3})`;
    document.getElementById('wizard-status').textContent=`Шаг ${step+1} из 3`;
    if(focus){const panel=panels.find(p=>!p.hidden);const heading=panel.querySelector('h3');heading.tabIndex=-1;heading.focus();heading.scrollIntoView({block:'nearest',behavior:'instant'});}
  }
  trigger.addEventListener('click',e=>{e.preventDefault();showStep(0,false);dialog.open(trigger);document.getElementById('modal-close-btn').focus();});
  back.addEventListener('click',()=>showStep(step-1));next.addEventListener('click',()=>showStep(step+1));
  function calculate(){
    const crm=modal.querySelector('input[name="calc-crm"]:checked').value==='bitrix'?'Битрикс24':'amoCRM';
    const modules=[],rules=[['calc-ms','МойСклад',1,4],['calc-tel','Телефония',1,3],['calc-custom','Кастомные интеграции',2,6]];let connections=1,days=8;
    rules.forEach(([id,label,count,duration])=>{if(document.getElementById(id).checked){modules.push(label);connections+=count;days+=duration;}});
    const complexity=connections>=4?'Сложная / Enterprise':connections>=2?'Средняя':'Простая';
    const complexityEl=document.getElementById('calc-complexity');complexityEl.textContent=complexity;
    if(!reducedMotion.matches)complexityEl.animate([{opacity:.4,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200});
    const duration=document.getElementById('calc-duration');
    if(!duration.children.length){duration.replaceChildren();const a=document.createElement('span'),b=document.createElement('span');a.dataset.current=days;b.dataset.current=days+4;duration.append(a,'–',b,' дней');}
    animateNumber(duration.children[0],days);animateNumber(duration.children[1],days+4);
    const count=document.getElementById('calc-connections');if(!count.children.length){const span=document.createElement('span');span.dataset.current=connections;count.replaceChildren(span,' шт.');}animateNumber(count.children[0],connections);
    request.value=`Привет! Хочу обсудить архитектуру проекта:\n- CRM: ${crm}\n- Модули: ${modules.join(', ')||'нет'}\n- Расчётная сложность: ${complexity}\n- Демо-оценка: ${days}–${days+4} дней (нужно уточнить)${contact.value.trim()?`\n- Контакт для ответа: ${contact.value.trim()}`:''}`;
    const architecture=document.getElementById('architecture-preview'),labels=[crm,...modules];
    // Узлы не пересоздаются при вводе контакта, чтобы избежать лишней анимации.
    if(architecture.dataset.labels!==labels.join('|')){architecture.replaceChildren();labels.forEach((label,i)=>{const node=document.createElement('span');node.className='architecture-node';node.textContent=label;node.style.setProperty('--node-delay',`${i*70}ms`);architecture.append(node);});architecture.dataset.labels=labels.join('|');}
    status.textContent='';
  }
  modal.querySelectorAll('input').forEach(input=>input.addEventListener(input.type==='text'?'input':'change',calculate));
  async function copy(){
    try{await navigator.clipboard.writeText(request.value);status.textContent='Конфигурация скопирована.';toast('Скопировано');return true;}
    catch{request.focus();request.select();status.textContent='Автокопирование недоступно. Текст выделен: Ctrl/Cmd+C или «Копировать».';toast('Скопируйте выделенный текст вручную');return false;}
  }
  document.getElementById('calc-copy-btn').addEventListener('click',copy);
  document.getElementById('calc-submit-btn').addEventListener('click',()=>{
    const channel=modal.querySelector('input[name="request-channel"]:checked').value,url=contactURL(channel);
    if(!url){status.textContent='Контакт специалиста ещё не заполнен. Копирую заявку.';copy();return;}
    // Для почты используются subject/body, для мессенджеров — UTF-8 draft text.
    let target;
    if(channel==='email')target=`${url}?subject=${encodeURIComponent('Заявка на CRM и интеграции')}&body=${encodeURIComponent(request.value.replace(/\r?\n/g,'\r\n'))}`;
    else{const draft=new URL(url);draft.searchParams.set('text',request.value);target=draft.href;}
    let opening=channel==='email'?'Открываю почту':channel==='telegram'?'Открываю Telegram':'Открываю WhatsApp';
    // noopener может вернуть null и при успехе; отказ открытия не мешает копированию.
    try{window.open(target,'_blank','noopener');}catch{opening='Не удалось открыть приложение';}
    // Копия создаётся независимо от неоднозначного return value window.open.
    copy().then(copied=>{toast(`${opening} · ${copied?'заявка скопирована':'доступно ручное копирование'}`);if(copied)status.textContent='Если переход заблокирован, текст заявки уже в буфере обмена.';});
  });
  showStep(0,false);calculate();
}
function initProcessDemo(){
  const section=document.getElementById('before-after'),buttons=[...section.querySelectorAll('[data-process]')],steps=[...section.querySelectorAll('.process-steps li')];let timers=[];
  section.querySelector('.segmented').hidden=false;
  document.getElementById('process-time').dataset.current=15;
  function clear(){timers.forEach(clearTimeout);timers=[];}
  function complete(){
    clear();finishNumber(document.getElementById('process-time'));
    const auto=buttons.find(el=>el.getAttribute('aria-pressed')==='true').dataset.process==='auto';
    steps.forEach((el,i)=>{el.classList.remove('done','waiting','issue');el.classList.add(auto?'done':i===2?'issue':'waiting');el.dataset.status=auto?'✓':i===2?'!':'◷';});
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    clear();const auto=button.dataset.process==='auto';buttons.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    const number=document.getElementById('process-time');animateNumber(number,auto?2:15);
    steps.forEach(el=>{el.classList.remove('done','waiting','issue');el.dataset.status='';});
    document.getElementById('process-status').textContent=auto?'С автоматизацией: 2 минуты на заказ (из кейса).':'Вручную: 15 минут на заказ (из кейса).';
    steps.forEach((el,i)=>{const update=()=>{el.classList.add(auto?'done':i===2?'issue':'waiting');el.dataset.status=auto?'✓':i===2?'!':'◷';};if(reducedMotion.matches)update();else timers.push(setTimeout(update,auto?i*90:i*650));});
  }));
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)complete();}).observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)complete();});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)complete();});
}
function initROI(){
  const form=document.getElementById('roi-form'),inputs=[...form.querySelectorAll('input')],outputs=[...form.querySelectorAll('output')],status=document.getElementById('roi-status');
  const results=form.querySelector('.roi-results');
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)outputs.forEach(finishNumber);}).observe(form);
  form.addEventListener('submit',e=>e.preventDefault());
  inputs.forEach(input=>input.addEventListener('input',()=>{
    const valid=inputs.every(el=>el.value!==''&&el.validity.valid&&Number.isFinite(el.valueAsNumber));
    const [people,hours,rate]=inputs.map(el=>el.valueAsNumber),yearHours=people*hours*52;
    if(!valid||!Number.isSafeInteger(people)||!Number.isFinite(yearHours*rate)||!Number.isSafeInteger(Math.trunc(yearHours*rate))){results.hidden=true;outputs.forEach(el=>{cancelAnimationFrame(numberFrames.get(el));pendingNumbers.delete(el);el.textContent='—';delete el.dataset.current;});status.textContent='Введите корректные неотрицательные данные: целое число сотрудников от 1, часы от 0 до 168 в неделю. Уменьшите значения, если результат слишком велик.';return;}
    results.hidden=false;
    [yearHours/12,yearHours*rate/12,yearHours,yearHours*rate].forEach((value,i)=>{outputs[i].dataset.current||=0;animateNumber(outputs[i],value,2,true);});
    status.textContent='Ориентировочный расчёт · 52 недели в году, 12 месяцев. Не гарантия фактической экономии.';
  }));
}
function initPhaseTwo(){
  initProcessDemo();initROI();initExtras();
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  document.querySelectorAll('.case-card,.profile-card,.placeholder-card').forEach(card=>{
    let frame;card.addEventListener('pointermove',e=>{if(!fine.matches||reducedMotion.matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${e.clientX-r.left}px`);card.style.setProperty('--my',`${e.clientY-r.top}px`);});});
  });
  document.querySelectorAll('#cta-primary,#calc-submit-btn').forEach(button=>{
    button.classList.add('magnetic');button.addEventListener('pointermove',e=>{if(!fine.matches||reducedMotion.matches)return;const r=button.getBoundingClientRect();button.style.setProperty('--bx',`${(e.clientX-r.left-r.width/2)*.05}px`);button.style.setProperty('--by',`${(e.clientY-r.top-r.height/2)*.08}px`);});
    button.addEventListener('pointerleave',()=>{button.style.setProperty('--bx','0px');button.style.setProperty('--by','0px');});
  });
  document.querySelectorAll('[data-contact]').forEach(link=>link.addEventListener('click',()=>{if(contactURL(link.dataset.contact))toast(`Открываю ${link.dataset.contact==='email'?'почту':link.dataset.contact==='telegram'?'Telegram':'WhatsApp'}`);}));
  const floating=document.getElementById('floating-contact'),compact=matchMedia('(max-width:768px)');let pastHero=false,contactVisible=false;
  // На телефоне фиксированный дубль CTA перекрывал текст и поля; связь доступна в меню.
  function updateFloating(){floating.hidden=compact.matches||!pastHero||contactVisible;}
  compact.addEventListener('change',updateFloating);
  new IntersectionObserver(entries=>{const e=entries[0];pastHero=!e.isIntersecting&&e.boundingClientRect.bottom<=0;updateFloating();}).observe(document.getElementById('hero'));
  new IntersectionObserver(entries=>{contactVisible=entries[0].isIntersecting;updateFloating();}).observe(document.getElementById('contact'));
  const available=document.getElementById('availability');available.hidden=typeof SITE_CONFIG.available!=='boolean';if(!available.hidden){available.textContent=SITE_CONFIG.available?'Доступен для проектов':'Сейчас не принимаю новые проекты';available.classList.toggle('is-available',SITE_CONFIG.available);}
  const theme=document.getElementById('theme-toggle');theme.hidden=false;
  function themeLabel(){theme.setAttribute('aria-label',document.documentElement.dataset.theme==='light'?'Включить тёмную тему':'Включить светлую тему');}
  themeLabel();theme.addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=value;try{localStorage.setItem('portfolio-theme',value);}catch{}themeLabel();});
  // Некритичный индикатор после первого paint, не закрывает контент и исчезает до 1 с.
  try{if(!sessionStorage.getItem('portfolio-boot')&&!reducedMotion.matches){sessionStorage.setItem('portfolio-boot','1');requestAnimationFrame(()=>{const boot=document.getElementById('boot-status');boot.hidden=false;const hide=()=>boot.hidden=true;boot.addEventListener('click',hide,{once:true});setTimeout(hide,650);});}}catch{}
}
function initExtras(){
  const palette=document.getElementById('command-palette'),controller=dialogController(palette),search=document.getElementById('command-search'),results=document.getElementById('command-results');
  const sections=[['Экосистема','#ecosystem'],['Кейсы','#cases'],['Проекты на GitHub','#projects'],['Было → Стало','#before-after'],['ROI-калькулятор','#roi'],['Процесс','#workflow'],['О специалисте','#about'],['Стоимость / FAQ','#formats'],['Контакт','#contact']];
  function navigate(hash){const target=document.querySelector(hash);prepareSection(target);location.hash=hash;target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});}
  function telegram(){const url=contactURL('telegram');if(url){window.open(url,'_blank','noopener');toast('Открываю Telegram');}else{navigate('#contact');toast('Telegram ещё не заполнен');}}
  const actions=[...sections.filter(([,hash])=>{const target=document.querySelector(hash);return target&&!target.hidden;}).map(([label,hash])=>({label,run:()=>navigate(hash)})),{label:'Открыть конфигуратор',run:()=>document.getElementById('cta-primary').click()},{label:'Написать в Telegram',run:telegram}];
  function render(){results.replaceChildren();const matches=actions.filter(a=>a.label.toLocaleLowerCase('ru').includes(search.value.toLocaleLowerCase('ru')));document.getElementById('command-empty').hidden=matches.length>0;matches.forEach(action=>{const button=document.createElement('button');button.type='button';button.textContent=action.label;button.addEventListener('click',()=>{controller.close();setTimeout(action.run,0);});results.append(button);});}
  function open(){if(document.querySelector('dialog[open]'))return;search.value='';render();controller.open();search.focus();}
  const trigger=document.getElementById('open-command');trigger.hidden=false;trigger.addEventListener('click',open);search.addEventListener('input',render);
  search.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('button')?.focus();}if(e.key==='Enter'){e.preventDefault();results.querySelector('button')?.click();}});
  results.addEventListener('keydown',e=>{const buttons=[...results.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(i+(e.key==='ArrowDown'?1:buttons.length-1))%buttons.length]?.focus();}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(palette.open)controller.close();else open();}});
  const terminal=document.getElementById('mini-terminal');terminal.hidden=false;
  terminal.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('terminal-command'),command=input.value.trim().toLowerCase(),output=document.getElementById('terminal-output');if(command==='help')output.textContent='help — команды; cases — кейсы; stack — экосистема; contact — контакты.';else if(['cases','stack','contact'].includes(command)){navigate({cases:'#cases',stack:'#ecosystem',contact:'#contact'}[command]);output.textContent=`Переход: ${command}`;}else output.textContent='Неизвестная команда. Введите help.';input.value='';});
}

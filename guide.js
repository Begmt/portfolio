// Небольшой проводник: стартует по нажатию, приложение и контакты работают независимо.
(()=>{
 const panel=document.getElementById('portfolio-guide');if(!panel)return;
 const triggers=[...document.querySelectorAll('[data-guide-open]')],native=typeof panel.showPopover==='function';
 if(!native)panel.removeAttribute('popover');
 const closeButton=panel.querySelector('.guide-close'),back=document.getElementById('guide-back'),next=document.getElementById('guide-next');
 const steps=[
  {id:'hero',title:'Привет! Покажу главное.',copy:'Выбирайте свой темп. Я помогу сориентироваться в кейсах, проектах и процессе работы.',next:'Показать кейсы'},
  {id:'cases',title:'Результаты в цифрах',copy:'Здесь три проекта с измеримыми результатами. «Подробнее» раскрывает задачу, решение и системы внутри каждого кейса.',next:'К проектам GitHub'},
  {id:'projects',title:'От идеи — к работающему коду',copy:'Эти карточки ведут к моим проектам на GitHub. Можно посмотреть, что сделано, и открыть репозитории.',next:'Как строится работа'},
  {id:'workflow',title:'Понятный путь к результату',copy:'От аудита и проектирования до интеграции и внедрения. В этом разделе — этапы работы и результат каждого шага.',next:'Познакомимся ближе'},
  {id:'about',title:'Кто стоит за системой',copy:'Я Бегмат. Занимаюсь CRM и интеграциями с 2023 года. Здесь собраны мой опыт и подход к управлению внедрением.',next:'Обсудить задачу'},
  {id:'contact',title:'Теперь — о вашей задаче',copy:'Выберите Telegram или email. А кнопка «Рассчитать архитектуру проекта» поможет собрать краткое описание задачи.',next:'Выбрать способ связи'}
 ];
 let index=0,open=false,opener,restore=false,highlight,entryAnimation,characterAnimation;
 const root=document.documentElement;
 try{if(localStorage.getItem('portfolio-guide-hidden')==='1')root.classList.add('guide-dismissed');}catch{}
 function setExpanded(value){triggers.forEach(button=>button.setAttribute('aria-expanded',String(value)));}
 function clearHighlight(){highlight?.classList.remove('guide-target');highlight=null;}
 function currentStep(){let found=0;steps.forEach((step,i)=>{if(document.getElementById(step.id).getBoundingClientRect().top<=200)found=i;});return found;}
 function render(){
  const step=steps[index];document.getElementById('guide-title').textContent=step.title;document.getElementById('guide-copy').textContent=step.copy;
  document.getElementById('guide-progress').textContent=`Шаг ${index+1} из ${steps.length}`;panel.querySelector('.guide-track span').style.transform=`scaleX(${(index+1)/steps.length})`;
  back.disabled=index===0;next.textContent=step.next+' →';
 }
 function navigate(){
  const target=document.getElementById(steps[index].id);prepareSection(target);clearHighlight();highlight=target.querySelector('.section-heading,.hero-heading,.contact-heading')||target;highlight.classList.add('guide-target');
  const url=new URL(location.href);url.hash=target.id;history.replaceState(history.state,'',url);target.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});
 }
 function cleanup(){
  open=false;setExpanded(false);clearHighlight();root.classList.remove('guide-active');entryAnimation?.cancel();characterAnimation?.cancel();panel.hidden=true;
  if(restore){restore=false;const visible=button=>button?.isConnected&&button.getClientRects().length&&!button.closest('[inert]');(visible(opener)?opener:document.querySelector('.nav-logo'))?.focus({preventScroll:true});}
 }
 function hide(returnFocus=false){restore=returnFocus;if(native&&panel.matches(':popover-open'))panel.hidePopover();cleanup();}
 function begin(button){
  if(document.querySelector('dialog[open]'))return false;
  opener=button;restore=false;const menu=document.getElementById('mobile-menu-btn');if(menu.getAttribute('aria-expanded')==='true')menu.click();
  const requested=steps.findIndex(step=>step.id===button.dataset.guideStep);index=requested>=0?requested:currentStep();
  render();panel.hidden=false;root.classList.remove('guide-dismissed');try{localStorage.removeItem('portfolio-guide-hidden');}catch{}return true;
 }
 function show(){
  open=true;setExpanded(true);root.classList.add('guide-active');closeButton.focus({preventScroll:true});
  if(!reducedMotion.matches){entryAnimation=panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,0,0,1)'});characterAnimation=panel.querySelector('.guide-character').animate([{transform:'rotate(-3deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0)'}],{duration:700,easing:'ease-out'});}
 }
 triggers.forEach(button=>button.addEventListener('click',event=>{
  if(open){if(!native){event.preventDefault();hide(true);}return;}
  if(!begin(button)){event.preventDefault();return;}
  if(!native){event.preventDefault();show();}
 }));
 panel.addEventListener('toggle',event=>{if(event.newState==='open')show();else cleanup();});
 closeButton.addEventListener('click',event=>{restore=true;if(!native){event.preventDefault();hide(true);}});
 back.addEventListener('click',()=>{if(index>0){index--;render();navigate();}});
 next.addEventListener('click',()=>{
  if(index<steps.length-1){index++;render();navigate();}
  else{hide(false);const target=document.getElementById('contact-details');prepareSection(target);target.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});document.getElementById('btn-telegram').focus({preventScroll:true});}
 });
 panel.querySelector('.guide-dismiss').addEventListener('click',()=>{root.classList.add('guide-dismissed');try{localStorage.setItem('portfolio-guide-hidden','1');}catch{}hide(true);});
 document.addEventListener('keydown',event=>{if(open&&event.key==='Escape'){event.preventDefault();hide(true);}});
 document.addEventListener('portfolio:before-dialog',()=>hide(false));
 reducedMotion.addEventListener('change',event=>{if(event.matches){entryAnimation?.cancel();characterAnimation?.cancel();}});
 document.getElementById('mobile-menu-btn').addEventListener('click',()=>{if(document.getElementById('mobile-menu-btn').getAttribute('aria-expanded')==='true')hide(false);});
 if(!native)document.addEventListener('pointerdown',event=>{if(open&&!panel.contains(event.target)&&!event.target.closest('[data-guide-open]'))hide(false);});
})();

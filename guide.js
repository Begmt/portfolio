// Проводник сопровождает прокрутку; подробный маршрут открывается по нажатию.
(()=>{
 const panel=document.getElementById('portfolio-guide');if(!panel)return;
 const triggers=[...document.querySelectorAll('[data-guide-open]')],native=typeof panel.showPopover==='function';
 if(!native)panel.removeAttribute('popover');
 const closeButton=panel.querySelector('.guide-close'),back=document.getElementById('guide-back'),next=document.getElementById('guide-next');
 const steps=[
  {id:'hero',name:'Главная',hint:'Я связываю CRM, склад и телефонию. Ниже покажу, как это работает.',title:'Привет! Покажу главное.',copy:'Прокручивайте страницу — я буду идти рядом и объяснять каждый блок. Здесь можно пройти весь маршрут в своём темпе.',next:'Показать кейсы'},
  {id:'cases',name:'Кейсы',hint:'Вот три кейса. В «Подробнее» — задача, решение и результат каждого проекта.',title:'Результаты в цифрах',copy:'Здесь три проекта с измеримыми результатами. «Подробнее» раскрывает задачу, решение и системы внутри каждого кейса.',next:'К проектам GitHub'},
  {id:'projects',name:'GitHub',hint:'Здесь мой код на GitHub. Карточки открывают репозитории с проектами.',title:'От идеи — к работающему коду',copy:'Эти карточки ведут к моим проектам на GitHub. Можно посмотреть, что сделано, и открыть репозитории.',next:'Мой подход'},
  {id:'design-statement',name:'Подход',hint:'Мой подход — связать процессы так, чтобы бизнес работал как единая система.',title:'Из хаоса — в систему',copy:'Автоматизация начинается со связей между процессами. Сначала разбираюсь, как работает бизнес, затем проектирую согласованную систему.',next:'К схеме интеграций'},
  {id:'ecosystem',name:'Интеграции',hint:'Выберите заказ, звонок или оплату: демо-схема покажет, как связаны системы.',title:'Как общаются системы',copy:'Выберите «Новый заказ», «Входящий звонок» или «Оплата получена». Схема покажет обмен между CRM, складом и телефонией. Это демонстрация, а не данные клиента.',next:'Сравнить процесс'},
  {id:'before-after',name:'Было → Стало',hint:'Переключите режимы и сравните путь заказа до автоматизации и после неё.',title:'Меньше ручных действий',copy:'Переключатель сравнивает обработку заказа вручную и с автоматизацией на основе первого кейса. Визуализация показывает, какие этапы меняются.',next:'Посчитать экономию'},
  {id:'roi',name:'Экономия',hint:'Введите данные команды: калькулятор оценит стоимость рутины и потенциал экономии.',title:'Во сколько обходится рутина',copy:'Укажите число сотрудников, часы рутины в неделю и стоимость часа. Расчёт покажет ориентировочный потенциал экономии по вашим данным.',next:'К этапам работы'},
  {id:'workflow',name:'Процесс',hint:'Так проходит внедрение: от аудита до запуска и поддержки системы.',title:'Понятный путь к результату',copy:'От аудита и проектирования до интеграции и внедрения. В этом разделе — этапы работы и результат каждого шага.',next:'Познакомимся ближе'},
  {id:'about',name:'Обо мне',hint:'Здесь мой опыт, роли в командах и подход к внедрению CRM с 2023 года.',title:'Кто стоит за системой',copy:'Я Бегмат. Занимаюсь CRM и интеграциями с 2023 года. Здесь собраны мой опыт и подход к управлению внедрением.',next:'Обсудить задачу'},
  {id:'contact',name:'Контакты',hint:'Обсудим вашу задачу? Здесь есть Telegram, email и краткая форма заявки.',title:'Теперь — о вашей задаче',copy:'Выберите Telegram или email. А кнопка «Рассчитать архитектуру проекта» поможет собрать краткое описание задачи.',next:'Выбрать способ связи'}
 ];
 let index=0,open=false,opener,restore=false,highlight,entryAnimation,characterAnimation;
 const root=document.documentElement;
 const companion=document.getElementById('scroll-guide'),note=document.getElementById('guide-note');
 const sections=steps.map(step=>document.getElementById(step.id));
 let hasScrolled=false,following=false,followIndex=-1,scrollFrame=0,walkTimer,lastY=scrollY,movingUntil=0,previousX=20;
 try{if(localStorage.getItem('portfolio-guide-hidden')==='1')root.classList.add('guide-dismissed');}catch{}
 function setExpanded(value){triggers.forEach(button=>button.setAttribute('aria-expanded',String(value)));}
 function clearHighlight(){highlight?.classList.remove('guide-target');highlight=null;}
 function sectionPosition(){
  const marker=Math.min(innerHeight*.35,260),bounds=sections.map(section=>section.getBoundingClientRect());let selected=0;
  bounds.forEach((rect,i)=>{if(rect.top<=marker)selected=i;});
  return {selected,progress:Math.max(0,Math.min(1,(marker-bounds[selected].top)/Math.max(1,bounds[selected].height)))};
 }
 function currentStep(){return sectionPosition().selected;}
 function stopWalking(){clearTimeout(walkTimer);companion?.classList.remove('is-walking');}
 function updateFollow(){
  if(!companion||!hasScrolled)return;
  const editing=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  const blocked=open||root.classList.contains('guide-dismissed')||document.hidden||editing||document.querySelector('dialog[open]')||document.getElementById('mobile-menu-btn').getAttribute('aria-expanded')==='true';
  if(blocked){companion.hidden=true;stopWalking();return;}
  // Читаем только внешние секции, не пробуждая дальние content-visibility поддеревья.
  const {selected,progress}=sectionPosition(),mobile=innerWidth<=768,width=mobile?innerWidth-64:Math.min(360,innerWidth-40);
  const travel=mobile?24:Math.max(0,innerWidth-width-40),phase=selected%2?1-progress:progress;
  const x=(mobile?16:20)+(reducedMotion.matches?0:travel*phase);
  const cta=document.getElementById('floating-contact').getBoundingClientRect(),edge=innerWidth-width-Math.max(260,cta.width+40);
  // Поднимаемся до зоны кнопки, включая момент, когда CTA только появляется.
  const lift=mobile||reducedMotion.matches?0:Math.max(72,cta.height+24)*Math.max(0,Math.min(1,(x-edge+64)/64));
  if(!following){
   following=true;companion.classList.add('following');note.hidden=false;
   const walker=companion.querySelector('.guide-walker');walker.src=walker.dataset.src;walker.hidden=false;
   companion.querySelector('.guide-portrait').hidden=true;companion.querySelector('.guide-launcher>span').hidden=true;
  }
  if(selected!==followIndex){
   followIndex=selected;const step=steps[selected];companion.dataset.section=step.id;
   document.getElementById('guide-note-label').textContent=`${selected+1} / ${steps.length} · ${step.name}`;
   document.getElementById('guide-note-copy').textContent=step.hint;
   companion.querySelectorAll('[data-guide-open]').forEach(button=>button.dataset.guideStep=step.id);
   companion.querySelector('.guide-launcher').setAttribute('aria-label','Объяснить блок: '+step.name);
  }
  if(Math.abs(x-previousX)>.5)companion.dataset.facing=x<previousX?'left':'right';previousX=x;
  companion.style.transform=`translate3d(${x.toFixed(1)}px,${(-lift).toFixed(1)}px,0)`;
  companion.hidden=false;
  if(!reducedMotion.matches&&performance.now()<movingUntil){companion.classList.add('is-walking');clearTimeout(walkTimer);walkTimer=setTimeout(stopWalking,Math.max(0,movingUntil-performance.now()));}
  else stopWalking();
 }
 function scheduleFollow(){if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateFollow();});}
 function dismissFollow(){
  root.classList.add('guide-dismissed');try{localStorage.setItem('portfolio-guide-hidden','1');}catch{}
  const needsFocus=companion?.contains(document.activeElement);if(companion)companion.hidden=true;stopWalking();
  if(needsFocus){const mobile=document.querySelector('.guide-nav');(mobile.getClientRects().length?mobile:document.querySelector('.nav-logo')).focus({preventScroll:true});}
 }
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
  open=false;setExpanded(false);clearHighlight();root.classList.remove('guide-active');entryAnimation?.cancel();characterAnimation?.cancel();panel.hidden=true;updateFollow();
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
  open=true;setExpanded(true);root.classList.add('guide-active');updateFollow();closeButton.focus({preventScroll:true});
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
 panel.querySelector('.guide-dismiss').addEventListener('click',()=>{dismissFollow();hide(true);});
 document.getElementById('guide-follow-dismiss')?.addEventListener('click',dismissFollow);
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.defaultPrevented)return;if(open){event.preventDefault();hide(true);}else if(following&&!companion.hidden&&!document.querySelector('dialog[open]')&&document.getElementById('mobile-menu-btn').getAttribute('aria-expanded')!=='true'){dismissFollow();}});
 document.addEventListener('portfolio:before-dialog',()=>{hide(false);if(companion)companion.hidden=true;stopWalking();});
 document.addEventListener('portfolio:dialog',scheduleFollow);
 reducedMotion.addEventListener('change',event=>{if(event.matches){entryAnimation?.cancel();characterAnimation?.cancel();stopWalking();}scheduleFollow();});
 document.getElementById('mobile-menu-btn').addEventListener('click',()=>queueMicrotask(()=>{if(document.getElementById('mobile-menu-btn').getAttribute('aria-expanded')==='true')hide(false);scheduleFollow();}));
 addEventListener('scroll',()=>{if(scrollY>40)hasScrolled=true;if(Math.abs(scrollY-lastY)>2)movingUntil=performance.now()+180;lastY=scrollY;scheduleFollow();},{passive:true});
 addEventListener('resize',scheduleFollow);addEventListener('pageshow',scheduleFollow);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopWalking();if(companion)companion.hidden=true;}else scheduleFollow();});
 document.addEventListener('focusin',scheduleFollow);document.addEventListener('focusout',scheduleFollow);
 addEventListener('pagehide',stopWalking);
 if(!native)document.addEventListener('pointerdown',event=>{if(open&&!panel.contains(event.target)&&!event.target.closest('[data-guide-open]'))hide(false);});
})();

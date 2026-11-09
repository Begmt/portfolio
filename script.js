// Контакты меняются только здесь. Неотредактированные заглушки не открывают чужие аккаунты.
const CONTACTS = Object.freeze({
  telegram: '[ВСТАВИТЬ TELEGRAM]', // https://t.me/username
  whatsapp: '[ВСТАВИТЬ WHATSAPP]', // https://wa.me/номер_с_кодом_страны
  email: '[ВСТАВИТЬ EMAIL]'
});
// Неизвестный статус и скриншоты остаются явными заглушками.
const SITE_CONFIG = Object.freeze({ available: null, caseImages: {} });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('DOMContentLoaded', async () => {
  initContacts(); initNavigation(); initCalculator(); initPhaseTwo();
  // Декоративные улучшения уступают поток вводу и отрисовке между шагами.
  for(const enhance of [initScrollAnimations,initCaseCards,initCounters,initTerminalTabs,initEcosystem,initTimelineProgress,initParticles]){
    if(globalThis.scheduler?.yield)await scheduler.yield();
    else await new Promise(resolve=>setTimeout(resolve,0));
    enhance();
  }
});

function contactURL(channel) {
  const value = CONTACTS[channel].trim();
  if (!value || value.includes('[ВСТАВИТЬ')) return null;
  if (channel === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
  try {
    const url = new URL(value), host = channel === 'telegram' ? 't.me' : 'wa.me';
    const validPath = channel === 'telegram' ? /^\/[A-Za-z0-9_]+\/?$/ : /^\/[1-9]\d{6,14}\/?$/;
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password && validPath.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
function initContacts() {
  document.querySelectorAll('[data-contact]').forEach(link => {
    const url = contactURL(link.dataset.contact);
    if (url) {
      link.href = url;
      if (link.dataset.contact !== 'email') { link.target = '_blank'; link.rel = 'noopener'; }
    } else {
      link.href = '#contact-details'; link.tabIndex = -1; link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', e => e.preventDefault());
    }
  });
  const channels = Object.keys(CONTACTS).filter(contactURL);
  document.getElementById('contact-note').textContent = channels.length ? 'Выберите удобный способ связи.' : 'Контакты пока не заполнены. Владелец сайта добавит адреса для связи.';
  document.querySelector('#contact-details .mono').textContent = Object.values(CONTACTS).join(' · ');
}
function initNavigation() {
  const nav = document.getElementById('main-nav'), button = document.getElementById('mobile-menu-btn'), menu = document.getElementById('mobile-menu');
  button.hidden = false; document.documentElement.classList.add('navigation-ready');
  function setMenu(open) {
    button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    button.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
    menu.hidden = !open; menu.classList.toggle('open', open);
    document.querySelectorAll('main,footer,#floating-contact').forEach(el=>el.inert=open);
    document.body.style.overflow=(open||document.querySelector('dialog[open]'))?'hidden':'';
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('portfolio:before-dialog',()=>setMenu(false));
  nav.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||button.getAttribute('aria-expanded')!=='true')return;
    const items=[button,...menu.querySelectorAll('a[href]')];
    if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { setMenu(false); button.focus(); }
  });
  matchMedia('(max-width: 768px)').addEventListener('change', () => setMenu(false));
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.id === 'cta-primary') return;
    link.addEventListener('click', () => {
      if (link.closest('#mobile-menu')) setMenu(false);
      const target = document.getElementById(link.hash.slice(1));
      if (target) { if (!target.hasAttribute('tabindex')) target.tabIndex = -1; target.focus({preventScroll: true}); }
      // Нативный переход сохраняет hash, историю и глубокие ссылки.
    });
  });
  const sections = [...document.querySelectorAll('main section[id]')]; let scheduled = false;
  function update() {
    scheduled = false; nav.classList.toggle('scrolled', scrollY > 60);
    const range = document.documentElement.scrollHeight - innerHeight;
    document.getElementById('scroll-progress').style.transform = `scaleX(${range > 0 ? scrollY / range : 0})`;
    const current = sections.filter(s => s.getBoundingClientRect().top <= 200).at(-1)?.id;
    document.querySelectorAll('.nav-link,.mobile-link').forEach(link => {
      const active = link.hash === `#${current}`; link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});
  new ResizeObserver(schedule).observe(document.querySelector('main'));
  schedule();
}
function initCounters() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target); // Считаем один раз, десятичную часть сохраняем.
    const el = entry.target, target = Number(el.dataset.target), decimals = Number(el.dataset.decimals || 0);
    el.dataset.current=0;
    animateNumber(el,target,decimals);
  }), {threshold: 0.5});
  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}
function initTimelineProgress() {
  const line = document.getElementById('timeline-progress'), timeline = document.querySelector('.workflow-timeline'); let scheduled = false;
  let visible=false;
  function update() {
    scheduled = false; const rect = timeline.getBoundingClientRect();
    const steps = [...timeline.querySelectorAll('.workflow-step')];
    const current = Math.max(0,steps.filter(step=>step.getBoundingClientRect().top<innerHeight*.65).length-1);
    line.style.transform = `scaleY(${Math.max(0, Math.min((innerHeight - rect.top) / rect.height, 1))})`;
    steps.forEach((step,i)=>{step.classList.toggle('active',i===current);step.classList.toggle('step-complete',i<current);});
  }
  function schedule(){if(visible&&!scheduled){scheduled=true;requestAnimationFrame(update);}}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();}).observe(document.getElementById('workflow'));
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
}

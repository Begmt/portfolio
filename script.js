// Контакты меняются только здесь. Неотредактированные заглушки не открывают чужие аккаунты.
const CONTACTS = Object.freeze({
  telegram: '[ВСТАВИТЬ TELEGRAM]', // https://t.me/username
  whatsapp: '[ВСТАВИТЬ WHATSAPP]', // https://wa.me/номер_с_кодом_страны
  email: '[ВСТАВИТЬ EMAIL]'
});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('DOMContentLoaded', () => {
  initContacts(); initNavigation(); initScrollAnimations(); initCaseCards();
  initCounters(); initTerminalTabs(); initEcosystem(); initTimelineProgress();
  initCalculator(); initParticles();
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
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
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
    const current = sections.filter(s => s.getBoundingClientRect().top <= 200).at(-1)?.id;
    document.querySelectorAll('.nav-link,.mobile-link').forEach(link => {
      const active = link.hash === `#${current}`; link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, {passive: true}); update();
}
function initScrollAnimations() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {threshold: 0.1});
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el); el.classList.add('reveal-ready'); // До подключения observer всё видно.
  });
}
function initCaseCards() {
  const cards = [...document.querySelectorAll('.case-card')];
  function expand(card, expanded) {
    card.classList.toggle('expanded', expanded); card.querySelector('.case-expandable').hidden = !expanded;
    const button = card.querySelector('.case-toggle'); button.setAttribute('aria-expanded', String(expanded));
    button.querySelector('.toggle-text').textContent = expanded ? 'Свернуть' : 'Подробнее';
  }
  cards.forEach(card => {
    const button = card.querySelector('.case-toggle'); expand(card, false); button.hidden = false;
    button.addEventListener('click', () => {
      const expanded = !card.classList.contains('expanded');
      cards.forEach(other => { if (other !== card) expand(other, false); }); expand(card, expanded);
    });
  });
}
function initCounters() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target); // Считаем один раз, десятичную часть сохраняем.
    const el = entry.target, target = Number(el.dataset.target), decimals = Number(el.dataset.decimals || 0), start = performance.now();
    function frame(now) {
      const progress = reducedMotion.matches ? 1 : Math.min((now - start) / 1000, 1);
      el.textContent = (target * (1 - (1 - progress) ** 3)).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }), {threshold: 0.5});
  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}
function initTerminalTabs() {
  const tabs = [...document.querySelectorAll('.terminal-tab')];
  document.querySelector('.terminal-tabs').hidden = false;
  document.querySelector('.hero-visual').classList.add('tabs-ready');
  tabs.forEach(tab => tab.hidden = false);
  function select(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab; item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected; panel.classList.toggle('active', selected);
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { e.preventDefault(); select(tabs[next], true); }
    });
  }); select(tabs[0]);
}
function initEcosystem() {
  const svg = document.getElementById('ecosystem-svg'), map = document.getElementById('ecosystem-map'), center = document.getElementById('node-center');
  const satellites = [...map.querySelectorAll('.eco-satellite')];
  function element(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value)); return el;
  }
  function point(node) {
    const box = node.getBoundingClientRect(), parent = map.getBoundingClientRect();
    return [box.left - parent.left + box.width / 2, box.top - parent.top + box.height / 2];
  }
  let inView = false;
  function syncMotion() {
    const paused = !inView || document.hidden || reducedMotion.matches;
    if (paused) svg.pauseAnimations(); else svg.unpauseAnimations();
    svg.querySelectorAll('circle').forEach(dot => dot.style.opacity = paused ? '0' : '1');
  }
  function draw() {
    svg.querySelectorAll('.eco-line-group').forEach(el => el.remove());
    svg.setAttribute('viewBox', `0 0 ${map.clientWidth} ${map.clientHeight}`);
    satellites.forEach(node => {
      const a = point(node), b = point(center), d = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
      const group = element('g', {class: 'eco-line-group', 'data-node': node.id});
      group.append(element('path', {d, stroke: '#73d9e4', 'stroke-opacity': '.4', 'stroke-width': 1.5, fill: 'none', 'stroke-dasharray': '5 5'}));
      const dot = element('circle', {r: 3, fill: '#73d9e4'});
      dot.append(element('animateMotion', {dur: '3s', repeatCount: 'indefinite', path: d})); group.append(dot); svg.append(group);
    }); syncMotion();
  }
  new ResizeObserver(draw).observe(map);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMotion(); }).observe(map);
  document.addEventListener('visibilitychange', syncMotion); reducedMotion.addEventListener('change', syncMotion);
  const log = document.getElementById('eco-terminal-body');
  const messages = {
    'node-bitrix': 'bitrix.deal.update → передача события в обработчик',
    'node-amo': 'amo.lead.create → передача события в обработчик',
    'node-moysklad': 'moysklad.stock.update → синхронизация остатков',
    'node-telephony': 'telephony.incoming.call → поиск карточки клиента',
    'node-center': 'handler.verify → проверка и маршрутизация события'
  };
  map.querySelectorAll('.eco-node').forEach(node => node.addEventListener('click', () => {
    log.querySelector('.console-placeholder')?.remove();
    const entry = document.createElement('div'); entry.className = 'console-log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString('ru-RU')}] ДЕМО · ${messages[node.id]}`; log.append(entry);
    while (log.children.length > 8) log.firstElementChild.remove(); log.scrollTop = log.scrollHeight;
  }));
}
function initTimelineProgress() {
  const line = document.getElementById('timeline-progress'), timeline = document.querySelector('.workflow-timeline'); let scheduled = false;
  function update() {
    scheduled = false; const rect = timeline.getBoundingClientRect();
    line.style.transform = `scaleY(${Math.max(0, Math.min((innerHeight - rect.top) / rect.height, 1))})`;
    timeline.querySelectorAll('.workflow-step').forEach(step => step.classList.toggle('active', step.getBoundingClientRect().top < innerHeight * .8));
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, {passive: true});
  addEventListener('resize', update); update();
}
function initCalculator() {
  const modal = document.getElementById('calculator-modal'), trigger = document.getElementById('cta-primary'), close = document.getElementById('modal-close-btn');
  const request = document.getElementById('request-text'), status = document.getElementById('copy-status'); let opener;
  trigger.addEventListener('click', e => { e.preventDefault(); opener = document.activeElement; modal.showModal(); document.body.style.overflow = 'hidden'; close.focus(); });
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus({preventScroll: true}); });
  // Нативный dialog блокирует фон и обрабатывает Esc; Tab удерживаем явно.
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button,input,textarea,[href]')].filter(el => !el.disabled && el.getClientRects().length && !(el.type === 'radio' && !el.checked));
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function calculate() {
    const crm = modal.querySelector('input[name="calc-crm"]:checked').value === 'bitrix' ? 'Битрикс24' : 'amoCRM';
    const modules = [], rules = [['calc-ms','МойСклад',1,4],['calc-tel','Телефония',1,3],['calc-custom','Кастомные интеграции',2,6]]; let connections = 1, days = 8;
    rules.forEach(([id,label,count,duration]) => { if (document.getElementById(id).checked) { modules.push(label); connections += count; days += duration; } });
    const complexity = connections >= 4 ? 'Сложная / Enterprise' : connections >= 2 ? 'Средняя' : 'Простая';
    document.getElementById('calc-complexity').textContent = complexity;
    document.getElementById('calc-duration').textContent = `${days}–${days + 4} дней`; document.getElementById('calc-connections').textContent = `${connections} шт.`;
    request.value = `Привет! Хочу обсудить архитектуру проекта:\n- CRM: ${crm}\n- Модули: ${modules.join(', ') || 'нет'}\n- Расчётная сложность: ${complexity}\n- Предварительная демо-оценка: ${days}–${days + 4} дней (нужно уточнить)`;
    status.textContent = '';
  }
  modal.querySelectorAll('input').forEach(input => input.addEventListener('change', calculate));
  document.getElementById('calc-submit-btn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(request.value); status.textContent = 'Конфигурация скопирована. Передайте её специалисту через заполненный канал связи.'; }
    catch { request.focus(); request.select(); status.textContent = 'Автокопирование недоступно. Текст выделен: нажмите Ctrl/Cmd+C или выберите «Копировать».'; }
  }); calculate();
}
function initParticles() {
  const canvas = document.getElementById('particles-canvas'), ctx = canvas.getContext('2d'); if (!ctx) return;
  let particles = [], frame = null, inView = false;
  function resize() {
    canvas.width = innerWidth; canvas.height = innerHeight;
    particles = Array.from({length: innerWidth < 769 ? 12 : 24}, () => ({x: Math.random()*canvas.width,y: Math.random()*canvas.height}));
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#73d9e4';
    particles.forEach(p => { p.x = (p.x+.12)%canvas.width; p.y = (p.y+.09)%canvas.height; ctx.fillRect(p.x,p.y,2,2); });
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame); frame = null;
    if (inView && !document.hidden && !reducedMotion.matches) draw(); else ctx.clearRect(0,0,canvas.width,canvas.height);
    document.documentElement.classList.toggle('motion-paused', !inView || document.hidden);
  }
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(document.getElementById('hero'));
  document.addEventListener('visibilitychange', sync); reducedMotion.addEventListener('change', sync);
  addEventListener('resize', resize); resize();
}

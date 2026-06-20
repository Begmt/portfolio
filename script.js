/* ═══════════════════════════════════════════════════════
   SYSTEMS ARCHITECT PORTFOLIO — Interactions & Animations
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavigation();
  initScrollAnimations();
  initEcosystemMap();
  initCaseCards();
  initCounters();
  initTimelineProgress();
  initTerminalTabs();
  initWebhookSimulator();
  initCalculator();
});

/* ══════════════════════════════════════
   1. PARTICLE CANVAS
   ══════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(Math.floor((w * h) / 18000), 80);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '0, 242, 254' : '112, 0, 255'
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.15;
          ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.o})`;
      ctx.fill();
    });

    animFrame = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      createParticles();
    }, 200);
  });
}

/* ══════════════════════════════════════
   2. NAVIGATION
   ══════════════════════════════════════ */
function initNavigation() {
  const nav = document.getElementById('main-nav');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const sections = document.querySelectorAll('section[id]');

  // Scroll state
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 60);

    // Active section highlight
    let currentSection = '';
    sections.forEach(section => {
      const top = section.offsetTop - 200;
      if (scrollY >= top) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === currentSection);
    });

    lastScroll = scrollY;
  }, { passive: true });

  // Mobile menu
  mobileBtn.addEventListener('click', () => {
    mobileBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    nav.classList.toggle('menu-open');
  });

  // Close mobile menu on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
      nav.classList.remove('menu-open');
    });
  });

  // Smooth scrolling for anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ══════════════════════════════════════
   3. SCROLL ANIMATIONS (IntersectionObserver)
   ══════════════════════════════════════ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════
   4. ECOSYSTEM MAP — SVG Lines & Data Flow
   ══════════════════════════════════════ */
function initEcosystemMap() {
  const svg = document.getElementById('ecosystem-svg');
  const map = document.getElementById('ecosystem-map');
  if (!svg || !map) return;

  const connections = [
    { from: 'node-bitrix', to: 'node-center', color: 'cyan' },
    { from: 'node-amo', to: 'node-center', color: 'purple' },
    { from: 'node-moysklad', to: 'node-center', color: 'cyan' },
    { from: 'node-telephony', to: 'node-center', color: 'purple' }
  ];

  function getNodeCenter(nodeId) {
    const node = document.getElementById(nodeId);
    const mapRect = map.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    return {
      x: ((nodeRect.left + nodeRect.width / 2 - mapRect.left) / mapRect.width) * 1000,
      y: ((nodeRect.top + nodeRect.height / 2 - mapRect.top) / mapRect.height) * 600
    };
  }

  function drawConnections() {
    // Clear existing lines
    const existingLines = svg.querySelectorAll('.eco-line-group');
    existingLines.forEach(l => l.remove());

    connections.forEach((conn, i) => {
      const from = getNodeCenter(conn.from);
      const to = getNodeCenter(conn.to);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.classList.add('eco-line-group');
      group.dataset.connection = i;

      // Curved path
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const offset = 30;
      const cx = midX + (dy > 0 ? offset : -offset) * (Math.abs(dx) < 100 ? 1 : 0);
      const cy = midY + (dx > 0 ? -offset : offset) * (Math.abs(dy) < 100 ? 1 : 0);

      const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

      // Background line
      const bgLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bgLine.setAttribute('d', pathD);
      bgLine.setAttribute('stroke', conn.color === 'cyan' ? 'rgba(0,242,254,0.15)' : 'rgba(112,0,255,0.15)');
      bgLine.setAttribute('stroke-width', '2');
      bgLine.setAttribute('fill', 'none');
      bgLine.setAttribute('stroke-dasharray', '6 4');
      group.appendChild(bgLine);

      // Active glow line
      const glowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glowLine.setAttribute('d', pathD);
      glowLine.setAttribute('stroke', conn.color === 'cyan' ? '#00F2FE' : '#7000FF');
      glowLine.setAttribute('stroke-width', '2');
      glowLine.setAttribute('fill', 'none');
      glowLine.setAttribute('filter', 'url(#glow-line)');
      glowLine.setAttribute('opacity', '0');
      glowLine.classList.add('glow-path');
      group.appendChild(glowLine);

      // Animated flow dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3.5');
      dot.setAttribute('fill', conn.color === 'cyan' ? '#00F2FE' : '#9B5DFF');
      dot.classList.add('flow-dot');

      const animMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      animMotion.setAttribute('dur', `${2.5 + i * 0.4}s`);
      animMotion.setAttribute('repeatCount', 'indefinite');
      animMotion.setAttribute('path', pathD);

      const animOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animOpacity.setAttribute('attributeName', 'opacity');
      animOpacity.setAttribute('values', '0;1;1;0');
      animOpacity.setAttribute('dur', `${2.5 + i * 0.4}s`);
      animOpacity.setAttribute('repeatCount', 'indefinite');

      dot.appendChild(animMotion);
      dot.appendChild(animOpacity);
      group.appendChild(dot);

      // Hover hitbox (wider invisible path)
      const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hitbox.setAttribute('d', pathD);
      hitbox.setAttribute('stroke', 'transparent');
      hitbox.setAttribute('stroke-width', '24');
      hitbox.setAttribute('fill', 'none');
      hitbox.style.cursor = 'pointer';

      hitbox.addEventListener('mouseenter', () => {
        glowLine.setAttribute('opacity', '0.8');
        bgLine.setAttribute('stroke-width', '3');
      });

      hitbox.addEventListener('mouseleave', () => {
        glowLine.setAttribute('opacity', '0');
        bgLine.setAttribute('stroke-width', '2');
      });

      group.appendChild(hitbox);
      svg.appendChild(group);
    });
  }

  // Node hover → illuminate connections
  const nodes = document.querySelectorAll('.eco-node');
  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      const nodeId = node.id;
      connections.forEach((conn, i) => {
        if (conn.from === nodeId || conn.to === nodeId) {
          const group = svg.querySelector(`[data-connection="${i}"]`);
          if (group) {
            const glow = group.querySelector('.glow-path');
            if (glow) glow.setAttribute('opacity', '0.8');
          }
        }
      });
    });

    node.addEventListener('mouseleave', () => {
      svg.querySelectorAll('.glow-path').forEach(p => p.setAttribute('opacity', '0'));
    });
  });

  // Initial draw + redraw on resize
  setTimeout(drawConnections, 100);

  let resizeTimer2;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer2);
    resizeTimer2 = setTimeout(drawConnections, 150);
  });
}

/* ══════════════════════════════════════
   5. CASE CARDS — Expand/Collapse
   ══════════════════════════════════════ */
function initCaseCards() {
  const toggles = document.querySelectorAll('.case-toggle');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.case-card');
      const isExpanded = card.classList.contains('expanded');

      // Close all
      document.querySelectorAll('.case-card.expanded').forEach(c => {
        c.classList.remove('expanded');
        c.querySelector('.case-toggle').setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isExpanded) {
        card.classList.add('expanded');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ══════════════════════════════════════
   6. ANIMATED COUNTERS
   ══════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el, target) {
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

/* ══════════════════════════════════════
   7. TIMELINE PROGRESS
   ══════════════════════════════════════ */
function initTimelineProgress() {
  const progressBar = document.getElementById('timeline-progress');
  const steps = document.querySelectorAll('.workflow-step');
  const timeline = document.querySelector('.workflow-timeline');

  if (!progressBar || !timeline) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.5 });

  steps.forEach(step => observer.observe(step));

  // Progress bar follows scroll
  window.addEventListener('scroll', () => {
    const rect = timeline.getBoundingClientRect();
    const windowH = window.innerHeight;

    if (rect.top < windowH && rect.bottom > 0) {
      const totalH = rect.height;
      const scrolled = windowH - rect.top;
      const progress = Math.max(0, Math.min(scrolled / totalH, 1));
      progressBar.style.height = `${progress * 100}%`;
    }
  }, { passive: true });
}

/* ══════════════════════════════════════
   8. TERMINAL TYPING EFFECT (hero)
   ══════════════════════════════════════ */
(function initTerminalEffect() {
  const lines = document.querySelectorAll('#terminal-code .code-line');
  if (!lines.length) return;

  lines.forEach((line, i) => {
    line.style.opacity = '0';
    line.style.transform = 'translateY(8px)';
    line.style.transition = `opacity 0.4s ${i * 0.12}s, transform 0.4s ${i * 0.12}s`;
  });

  setTimeout(() => {
    lines.forEach(line => {
      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';
    });
  }, 800);
})();

/* ══════════════════════════════════════
   9. SMOOTH PARALLAX on mouse (subtle)
   ══════════════════════════════════════ */
(function initParallax() {
  const orbs = document.querySelectorAll('.orb');
  let ticking = false;

  document.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      orbs.forEach((orb, i) => {
        const factor = (i + 1) * 8;
        orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });

      ticking = false;
    });
  }, { passive: true });
})();

/* ══════════════════════════════════════
   10. TERMINAL TABS SWITCHER (Hero)
   ══════════════════════════════════════ */
function initTerminalTabs() {
  const tabs = document.querySelectorAll('.terminal-tab');
  const blocks = document.querySelectorAll('.code-block');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      blocks.forEach(b => b.classList.remove('active'));

      tab.classList.add('active');
      const lang = tab.dataset.lang;
      const targetBlock = document.getElementById(`code-${lang}`);
      if (targetBlock) {
        targetBlock.classList.add('active');
        
        // Typing effect reset for target block
        const lines = targetBlock.querySelectorAll('.code-line');
        lines.forEach((line, i) => {
          line.style.opacity = '0';
          line.style.transform = 'translateY(6px)';
          line.style.transition = `opacity 0.3s ${i * 0.08}s, transform 0.3s ${i * 0.08}s`;
        });
        setTimeout(() => {
          lines.forEach(line => {
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
          });
        }, 50);
      }
    });
  });
}

/* ══════════════════════════════════════
   11. ECOSYSTEM WEBHOOK SIMULATOR
   ══════════════════════════════════════ */
function initWebhookSimulator() {
  const nodes = document.querySelectorAll('.eco-node');
  const consoleBody = document.getElementById('eco-terminal-body');
  if (!consoleBody) return;

  const logs = {
    'node-bitrix': [
      { event: 'bitrix.deal.update', desc: 'Сделка #2819 переведена на этап [Сборка]' },
      { event: 'bitrix.webhook.trigger', desc: 'Отправлен вебхук в МойСклад на резерв товаров' },
      { event: 'bitrix.user.notify', desc: 'Уведомление менеджеру: "Счет оплачен"' }
    ],
    'node-amo': [
      { event: 'amo.lead.create', desc: 'Создана сделка "Коттедж Рига" из формы Telegram' },
      { event: 'amo.routing.operator', desc: 'Звонок назначен на свободного оператора: Иван К.' },
      { event: 'amo.task.add', desc: 'Авто-задача: "Перезвонить клиенту по ночной заявке"' }
    ],
    'node-moysklad': [
      { event: 'moysklad.stock.reserve', desc: 'Товар "Арматура A500C" зарезервирован на Складе-Восток' },
      { event: 'moysklad.invoice.generate', desc: 'Сгенерирован счет PDF для клиента Nexus B2B' },
      { event: 'moysklad.api.callback', desc: 'Передан статус остатков [120 шт.] в Битрикс24' }
    ],
    'node-telephony': [
      { event: 'telephony.incoming.call', desc: 'Входящий звонок с номера +7 (999) ***-45-12' },
      { event: 'telephony.route.smart', desc: 'Маршрутизация звонка на персонального менеджера' },
      { event: 'telephony.card.popup', desc: 'Выведена карточка клиента [ООО СтройТех] в amoCRM' }
    ],
    'node-center': [
      { event: 'custom.handler.api', desc: 'Кастомный Node.js скрипт обработал webhook payload' },
      { event: 'custom.auth.success', desc: 'Авторизация OAuth 2.0 пройдена успешно' },
      { event: 'custom.stress.test', desc: 'Нагрузка API: 250 requests/sec | Response time: 48ms' }
    ]
  };

  function addLogEntry(nodeId) {
    const nodeLogs = logs[nodeId];
    if (!nodeLogs) return;

    // Remove placeholder
    const placeholder = consoleBody.querySelector('.console-placeholder');
    if (placeholder) placeholder.remove();

    // Pick random log from the set
    const log = nodeLogs[Math.floor(Math.random() * nodeLogs.length)];
    const time = new Date().toLocaleTimeString('ru-RU');

    const entry = document.createElement('div');
    entry.className = 'console-log-entry';
    entry.innerHTML = `
      <span class="log-time">[${time}]</span>
      <span class="log-event">${log.event}</span>: 
      <span class="log-payload">${log.desc}</span>
    `;

    consoleBody.appendChild(entry);
    
    // Auto-scroll to bottom
    consoleBody.scrollTop = consoleBody.scrollHeight;

    // Limit log count
    const entries = consoleBody.querySelectorAll('.console-log-entry');
    if (entries.length > 8) {
      entries[0].remove();
    }
  }

  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      addLogEntry(node.id);
      // Simulate subsequent logs with interval while hovering
      node.simInterval = setInterval(() => addLogEntry(node.id), 1200);
    });

    node.addEventListener('mouseleave', () => {
      clearInterval(node.simInterval);
    });
  });
}

/* ══════════════════════════════════════
   12. INTERACTIVE CALCULATOR
   ══════════════════════════════════════ */
function initCalculator() {
  const modal = document.getElementById('calculator-modal');
  const openBtns = [document.getElementById('cta-primary'), document.getElementById('cta-submit')];
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modal) return;

  // Open modal
  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Lock background scroll
      });
    }
  });

  // Close modal
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Calculation logic
  const crmRadios = document.querySelectorAll('input[name="calc-crm"]');
  const checkboxMs = document.getElementById('calc-ms');
  const checkboxTel = document.getElementById('calc-tel');
  const checkboxCustom = document.getElementById('calc-custom');

  const valComplexity = document.getElementById('calc-complexity');
  const valDuration = document.getElementById('calc-duration');
  const valConnections = document.getElementById('calc-connections');
  const submitBtn = document.getElementById('calc-submit-btn');

  function calculate() {
    let connections = 1; // Base CRM connection
    let baseDays = 8;
    let complexity = 'Простая';

    const isBitrix = Array.from(crmRadios).find(r => r.checked)?.value === 'bitrix';
    
    if (checkboxMs && checkboxMs.checked) {
      connections += 1;
      baseDays += 4;
    }
    if (checkboxTel && checkboxTel.checked) {
      connections += 1;
      baseDays += 3;
    }
    if (checkboxCustom && checkboxCustom.checked) {
      connections += 2;
      baseDays += 6;
    }

    if (connections >= 4) {
      complexity = 'Сложная / Enterprise';
    } else if (connections >= 2) {
      complexity = 'Средняя';
    }

    // Update UI
    if (valComplexity) {
      valComplexity.textContent = complexity;
      if (complexity.includes('Enterprise')) {
        valComplexity.style.background = 'none';
        valComplexity.style.color = 'var(--purple)';
        valComplexity.style.webkitTextFillColor = 'var(--purple)';
      } else if (complexity === 'Средняя') {
        valComplexity.style.background = 'var(--gradient-text)';
        valComplexity.style.webkitBackgroundClip = 'text';
        valComplexity.style.webkitTextFillColor = 'transparent';
      } else {
        valComplexity.style.background = 'none';
        valComplexity.style.color = 'var(--cyan)';
        valComplexity.style.webkitTextFillColor = 'var(--cyan)';
      }
    }

    if (valDuration) {
      valDuration.textContent = `${baseDays}-${baseDays + 4} дней`;
    }

    if (valConnections) {
      valConnections.textContent = `${connections} шт.`;
    }

    // Dynamic message for Telegram link
    if (submitBtn) {
      const crmName = isBitrix ? 'Битрикс24' : 'amoCRM';
      const modules = [];
      if (checkboxMs && checkboxMs.checked) modules.push('МойСклад');
      if (checkboxTel && checkboxTel.checked) modules.push('Телефония');
      if (checkboxCustom && checkboxCustom.checked) modules.push('Кастомные интеграции');

      const text = encodeURIComponent(
        `Привет! Хочу обсудить архитектуру проекта:\n` +
        `- CRM: ${crmName}\n` +
        `- Модули: ${modules.join(', ') || 'нет'}\n` +
        `- Расчетная сложность: ${complexity}`
      );
      submitBtn.href = `https://t.me/systems_architect_bot?text=${text}`; // Example target bot
    }
  }

  // Event listeners for recalculation
  crmRadios.forEach(r => r.addEventListener('change', calculate));
  [checkboxMs, checkboxTel, checkboxCustom].forEach(c => {
    if (c) c.addEventListener('change', calculate);
  });

  // Run initial calculation
  calculate();
}

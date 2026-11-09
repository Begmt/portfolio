// Пословное проявление слогана: без JS и при reduce текст полностью читаем.
document.addEventListener('DOMContentLoaded',()=>{
  const statement=document.querySelector('.statement-text');
  if(!statement||reducedMotion.matches)return;
  // Пословная разметка нужна лишь при приближении к слогану, а не при первом paint.
  const approaching=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting)return;
    approaching.disconnect();
    if(!reducedMotion.matches)enhanceStatement();
  },{rootMargin:'200px'});
  approaching.observe(document.getElementById('design-statement'));
  function enhanceStatement(){
  const copy=statement.cloneNode(true);copy.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
  const lines=copy.textContent.split('\n').map(line=>line.trim()).filter(Boolean),accessible=document.createElement('span');
  accessible.className='sr-only';accessible.textContent=lines.join(' ');statement.replaceChildren(accessible);
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('read');observer.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -15% 0px',threshold:.2});
  let index=0;
  lines.forEach((line,lineIndex)=>{
    if(lineIndex)statement.append(document.createElement('br'));
    line.split(/\s+/).forEach(word=>{
      const span=document.createElement('span');span.className='tagline-word';span.setAttribute('aria-hidden','true');span.textContent=word;
      span.style.setProperty('--word-delay',`${Math.min(index++*60,360)}ms`);statement.append(span,' ');observer.observe(span);
    });
  });
  statement.classList.add('statement-ready');
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){statement.classList.remove('statement-ready');observer.disconnect();}});
  }
});

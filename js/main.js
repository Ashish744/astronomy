 /* ============================================================
   STACKLY — main.js
   Shared behaviour across every page: preloader, starfield,
   cursor spotlight, nav, footer, and GSAP-driven components.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     0. GSAP setup
  --------------------------------------------------------- */
  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parseAnimatedNumberText(rawText) {
    const text = String(rawText).trim();
    if (!text) return null;
    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(text)) return null;
    const matches = text.match(/^([^0-9+-]*)([+-]?\d{1,3}(?:,[0-9]{3})*(?:\.\d+)?)(.*)$/);
    if (!matches) return null;
    const [, prefix, numberPart, suffix] = matches;
    const normalized = numberPart.replace(/,/g, '');
    const value = Number(normalized);
    if (Number.isNaN(value)) return null;
    const precision = (numberPart.split('.')[1] || '').length;
    const showPlus = numberPart.trim().startsWith('+');
    const useGrouping = numberPart.includes(',');
    return { prefix, suffix, value, precision, showPlus, useGrouping, original: text };
  }

  function formatAnimatedNumber(value, options) {
    const precision = options.precision || 0;
    let formatted;
    if (options.padLength && precision === 0) {
      formatted = String(Math.round(value)).padStart(options.padLength, '0');
    } else {
      const numeric = Number(value.toFixed(precision));
      if (options.useGrouping) {
        formatted = numeric.toLocaleString('en-US', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        });
      } else {
        formatted = numeric.toFixed(precision);
      }
    }
    if (precision === 0) {
      formatted = formatted.replace(/\.0+$/, '');
    }
    if (options.showPlus && value > 0 && !formatted.startsWith('+')) {
      formatted = `+${formatted}`;
    }
    return `${options.prefix || ''}${formatted}${options.suffix || ''}`;
  }

  function animateNumberElement(el) {
    const parsed = parseAnimatedNumberText(el.textContent);
    if (!parsed) return;
    const duration = Number(el.dataset.countDuration || 1.8);
    const padLength = el.dataset.countPad ? Number(el.dataset.countPad) : 0;
    const startValue = Number(el.dataset.countStart || 0);
    const endValue = parsed.value;
    const options = {
      prefix: parsed.prefix,
      suffix: parsed.suffix,
      precision: parsed.precision,
      showPlus: parsed.showPlus,
      useGrouping: parsed.useGrouping,
      padLength
    };
    if (!hasGSAP || reduceMotion) {
      el.textContent = formatAnimatedNumber(endValue, options);
      return;
    }
    gsap.to({ value: startValue }, {
      value: endValue,
      duration,
      ease: 'power3.out',
      onUpdate(obj) {
        el.textContent = formatAnimatedNumber(obj.value, options);
      }
    });
  }

  function initAnimatedNumbers() {
    document.querySelectorAll('[data-animate-number]').forEach(el => {
      const parsed = parseAnimatedNumberText(el.textContent);
      if (!parsed) return;
      if (!hasGSAP || !window.ScrollTrigger || reduceMotion) {
        el.textContent = formatAnimatedNumber(parsed.value, {
          prefix: parsed.prefix,
          suffix: parsed.suffix,
          precision: parsed.precision,
          showPlus: parsed.showPlus,
          useGrouping: parsed.useGrouping,
          padLength: el.dataset.countPad ? Number(el.dataset.countPad) : 0
        });
        return;
      }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter() {
          animateNumberElement(el);
        }
      });
    });
  }

  /* split hero title into words for stagger — must run before playHeroIn()
     is ever invoked, whether that happens synchronously (no preloader) or
     after the preloader timeline completes. */
  function splitHeroTitleWords(el){
    const fragment = document.createDocumentFragment();
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE){
        node.textContent.split(/(\s+)/).forEach(token => {
          if (!token) return;
          if (/\s+/.test(token)){
            fragment.appendChild(document.createTextNode(token));
          } else {
            const span = document.createElement('span');
            span.className = 'word';
            span.style.display = 'inline-block';
            span.textContent = token;
            fragment.appendChild(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE){
        const wrapper = document.createElement('span');
        wrapper.className = 'word';
        wrapper.style.display = 'inline-block';
        wrapper.appendChild(node.cloneNode(true));
        fragment.appendChild(wrapper);
        fragment.appendChild(document.createTextNode('\u00A0'));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });
    el.textContent = '';
    el.appendChild(fragment);
  }
  document.querySelectorAll('[data-hero-title]').forEach(splitHeroTitleWords);
  initHeroTextCycling();

  function initHeroTextCycling(){
    const animationVariants = [
      el => gsap.timeline().to(el, { opacity: 0, y: -12, rotationX: 20, duration: .32, ease: 'power3.in' })
        .call(() => { el.textContent = el.dataset.nextValue; })
        .to(el, { opacity: 1, y: 0, rotationX: 0, duration: .36, ease: 'power3.out' }),
      el => gsap.timeline().to(el, { opacity: 0, scale: .8, duration: .28, ease: 'power3.in' })
        .call(() => { el.textContent = el.dataset.nextValue; })
        .to(el, { opacity: 1, scale: 1, duration: .36, ease: 'power3.out' }),
      el => gsap.timeline().to(el, { opacity: 0, x: 16, skewX: 12, duration: .3, ease: 'power3.in' })
        .call(() => { el.textContent = el.dataset.nextValue; })
        .to(el, { opacity: 1, x: 0, skewX: 0, duration: .32, ease: 'power3.out' }),
      el => gsap.timeline().to(el, { opacity: 0, y: 8, rotation: 8, duration: .3, ease: 'power3.in' })
        .call(() => { el.textContent = el.dataset.nextValue; })
        .to(el, { opacity: 1, y: 0, rotation: 0, duration: .34, ease: 'power3.out' })
    ];

    document.querySelectorAll('[data-cycle-values]').forEach(el => {
      const values = (el.dataset.cycleValues || '').split(',').map(v => v.trim()).filter(Boolean);
      if (values.length < 2) return;
      let index = values.indexOf(el.textContent.trim());
      if (index < 0) index = 0;
      const delay = Number(el.dataset.cycleDelay || 2000);

      const cycle = () => {
        index = (index + 1) % values.length;
        const nextValue = values[index];
        el.dataset.nextValue = nextValue;

        if (hasGSAP && !reduceMotion){
          const variant = animationVariants[index % animationVariants.length];
          variant(el);
        } else {
          el.textContent = nextValue;
        }
      };

      setInterval(cycle, delay);
    });
  }

  /* ---------------------------------------------------------
     1. PRELOADER — bento grid reveal
  --------------------------------------------------------- */
  const preloader = document.getElementById('preloader');
  if (preloader){
    document.body.classList.add('lock-scroll');
    const cells = preloader.querySelectorAll('.bento-loader span');

    const finishLoad = () => {
      document.body.classList.remove('lock-scroll');
      preloader.remove();
      playHeroIn();
    };

    if (hasGSAP && !reduceMotion){
      const tl = gsap.timeline({ onComplete: () => {
        gsap.to(preloader, { opacity:0, duration:.6, ease:'power2.inOut', onComplete: finishLoad });
      }});
      tl.to(cells, { opacity:1, scale:1, duration:.5, stagger:{ each:.06, from:'random' }, ease:'back.out(2)' })
        .to(cells, { opacity:.25, scale:.85, duration:.4, stagger:{ each:.04, from:'random' }, ease:'power1.inOut' }, '+=.3')
        .to(cells, { opacity:1, scale:1, duration:.4, stagger:{ each:.03, from:'center' } }, '+=.05');
    } else {
      setTimeout(finishLoad, 500);
    }
  } else {
    playHeroIn();
  }

  function animateHeroFallback(hero){
    const eyebrow = hero.querySelector('[data-hero-eyebrow]');
    const titleWords = hero.querySelectorAll('[data-hero-title] .word');
    const sub = hero.querySelector('[data-hero-sub]');
    const ctaItems = hero.querySelectorAll('[data-hero-cta] > *');
    const stats = hero.querySelectorAll('[data-hero-stat]');

    const fadeIn = (el, delay = 0) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .65s ease-out, transform .65s ease-out';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    };

    if (eyebrow) fadeIn(eyebrow, 100);
    titleWords.forEach((word, idx) => {
      word.style.opacity = '0';
      word.style.transform = 'translateY(40px) rotateX(-40deg)';
      word.style.transformStyle = 'preserve-3d';
      word.style.transition = 'opacity .8s ease-out, transform .8s ease-out';
      setTimeout(() => {
        word.style.opacity = '1';
        word.style.transform = 'translateY(0) rotateX(0deg)';
      }, 160 + idx * 45);
    });
    if (sub) fadeIn(sub, 280);
    ctaItems.forEach((item, idx) => fadeIn(item, 340 + idx * 60));
    stats.forEach((stat, idx) => fadeIn(stat, 380 + idx * 60));
  }

  function playHeroIn(){
    const hero = document.querySelector('[data-hero-in]');
    if (!hero) return;
    if (!hasGSAP && !reduceMotion){
      animateHeroFallback(hero);
      return;
    }
    if (hasGSAP && reduceMotion){
      const words = hero.querySelectorAll('[data-hero-title] .word');
      words.forEach(word => {
        word.style.opacity = '1';
        word.style.transform = 'none';
      });
      return;
    }
    gsap.timeline({ delay:.1 })
      .from('[data-hero-eyebrow]', { opacity:0, y:16, filter:'blur(6px)', duration:.6, ease:'power3.out' })
      .from('[data-hero-title] .word', { opacity:0, y:40, rotateX:-40, stagger:.05, duration:.8, ease:'power3.out' }, '-=.35')
      .from('[data-hero-sub]', { opacity:0, y:16, filter:'blur(6px)', duration:.6 }, '-=.4')
      .from('[data-hero-cta] > *', { opacity:0, y:16, stagger:.08, duration:.5 }, '-=.4')
      .from('[data-hero-stat]', { opacity:0, y:16, stagger:.08, duration:.5 }, '-=.3');
  }

  const headingMotion = {
    hidden: { opacity:0, y:30, filter:'blur(6px)' },
    visible: { opacity:1, y:0, filter:'blur(0px)', duration:.72, ease:'power3.out' }
  };

  function revealChildren(selector, vars, triggerOptions = {}){
    gsap.utils.toArray(selector).forEach(el => {
      gsap.from(el.children, {
        opacity:0, y: vars.y ?? 24, duration: vars.duration ?? .7, stagger: vars.stagger ?? 0,
        ease: vars.ease || 'power3.out',
        scrollTrigger: { trigger: el, start: triggerOptions.start || 'top 88%', once: true }
      });
    });
  }

  function animateHeadings(){
    if (!hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    const heroHeadings = gsap.utils.toArray('[data-hero-in] h1,[data-hero-in] h2,[data-hero-in] h3,[data-hero-in] h4');
    const sectionHeadings = gsap.utils.toArray('.section-head h1,.section-head h2,.section-head h3,.section-head h4');
    const excluded = new Set([...heroHeadings, ...sectionHeadings]);
    const headings = gsap.utils.toArray('h1,h2,h3,h4').filter(el => !excluded.has(el));

    if (!headings.length) return;

    gsap.set(headings, headingMotion.hidden);
    ScrollTrigger.batch(headings, {
      interval:0.1,
      batchMax:6,
      start:'top 90%',
      once:true,
      onEnter: batch => {
        gsap.to(batch, { ...headingMotion.visible, stagger:.08 });
      }
    });
  }

  /* ---------------------------------------------------------
     2. STARFIELD CANVAS
  --------------------------------------------------------- */
  document.querySelectorAll('canvas.starfield').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize(){
      const parent = canvas.parentElement;
      w = canvas.width = parent.clientWidth;
      h = canvas.height = parent.clientHeight;
      const density = canvas.dataset.density ? parseInt(canvas.dataset.density) : 140;
      stars = Array.from({ length: density }, () => ({
        x: Math.random()*w, y: Math.random()*h,
        r: Math.random()*1.4 + .3,
        s: Math.random()*.5 + .15,
        tw: Math.random()*Math.PI*2
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(t){
      ctx.clearRect(0,0,w,h);
      stars.forEach(st => {
        const alpha = .35 + Math.sin(t/1000 + st.tw)*.35;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(alpha,.08)})`;
        ctx.fill();
        st.y -= st.s * .1;
        if (st.y < -5){ st.y = h+5; st.x = Math.random()*w; }
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  });

  /* ---------------------------------------------------------
     2a. GLOBAL CLICK EFFECTS
     NOTE: guarded on hasGSAP now — previously this ran on every
     single click regardless of whether GSAP was loaded, which
     threw "gsap is not defined" on any page (like the dashboards)
     that don't include the GSAP script. That error fired on every
     click across the whole page, including the sidebar hamburger.
  --------------------------------------------------------- */
  const clickOverlay = document.createElement('div');
  clickOverlay.id = 'click-effect-overlay';
  document.body.appendChild(clickOverlay);

  function initLetterRoll(){
    document.querySelectorAll('[data-letter-roll]').forEach((el) => {
      if (el.dataset.letterRollBuilt) return;
      const text = (el.dataset.letterRoll || '').trim();
      if (!text) return;
      el.textContent = '';
      el.dataset.letterRollBuilt = 'true';
      el.classList.add('letter-roll');
      const fragment = document.createDocumentFragment();
      let charIndex = 0;
      const words = text.split(/(\s+)/);
      words.forEach((word) => {
        if (/^\s+$/.test(word)) {
          fragment.appendChild(document.createTextNode(word));
          return;
        }
        const wordWrap = document.createElement('span');
        wordWrap.className = 'letter-roll-word';
        wordWrap.style.display = 'inline-flex';
        wordWrap.style.gap = '0.12em';
        wordWrap.style.whiteSpace = 'nowrap';
        word.split('').forEach((ch) => {
          const char = document.createElement('span');
          char.className = 'letter-roll-char';
          char.style.animationDelay = `${charIndex * 0.08}s`;
          ['front','top','bottom','back'].forEach((faceName) => {
            const face = document.createElement('span');
            face.className = `letter-face letter-${faceName}`;
            face.textContent = ch;
            char.appendChild(face);
          });
          wordWrap.appendChild(char);
          charIndex += 1;
        });
        fragment.appendChild(wordWrap);
      });
      el.appendChild(fragment);
      const probe = el.querySelector('.letter-roll-char');
      if (probe){
        const depth = probe.getBoundingClientRect().height / 2;
        el.style.setProperty('--letter-d', `${depth}px`);
      }
    });
  }

  initLetterRoll();
  window.addEventListener('resize', initLetterRoll);
  initAnimatedNumbers();
  animateHeadings();

  const createEffect = (x, y, mode = 'sniper') => {
    const size = 90;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size.toString());
    svg.setAttribute('height', size.toString());
    svg.style.position = 'absolute';
    svg.style.left = `${x - size / 2}px`;
    svg.style.top = `${y - size / 2}px`;
    svg.style.pointerEvents = 'none';
    svg.style.overflow = 'visible';
    svg.style.transform = 'translate3d(0,0,0)';
    svg.style.opacity = '1';

    const center = size / 2;
    const stroke = 2;
    const color = '#ffffff';

    if (mode === 'rings') {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center.toString());
      circle.setAttribute('cy', center.toString());
      circle.setAttribute('r', (size / 4).toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', stroke.toString());
      svg.appendChild(circle);
      gsap.timeline({ onComplete: () => svg.remove() })
        .fromTo(circle, { attr: { r: size / 6 }, opacity: 1 }, { attr: { r: size / 2 }, opacity: 0, duration: 0.4, ease: 'power3.out' });
    } else if (mode === 'burst') {
      [45, 80, 115, 150].forEach(angleDeg => {
        const angle = (angleDeg * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', center.toString());
        line.setAttribute('y1', center.toString());
        line.setAttribute('x2', center.toString());
        line.setAttribute('y2', center.toString());
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', stroke.toString());
        line.setAttribute('stroke-linecap', 'square');
        svg.appendChild(line);
        const dx = Math.cos(angle) * (size / 4);
        const dy = -Math.sin(angle) * (size / 4);
        gsap.timeline({ onComplete: () => svg.remove() })
          .to(line, { attr: { x2: center + dx, y2: center + dy }, duration: 0.35, ease: 'power3.out' })
          .to(line, { strokeWidth: 0, duration: 0.2, ease: 'linear' }, 0.2);
      });
    } else if (mode === 'particles') {
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.left = `${center - stroke / 2}px`;
        dot.style.top = `${center - stroke / 2}px`;
        dot.style.width = `${stroke}px`;
        dot.style.height = `${stroke}px`;
        dot.style.background = color;
        dot.style.borderRadius = '50%';
        dot.style.pointerEvents = 'none';
        svg.appendChild(dot);
        const dx = Math.cos(angle) * (size * 0.3);
        const dy = Math.sin(angle) * (size * 0.3);
        gsap.timeline({ onComplete: () => svg.remove() })
          .to(dot, { width: stroke, height: stroke, duration: 0.1, ease: 'power1.out' })
          .to(dot, { x: dx, y: dy, duration: 0.25, ease: 'power1.out' }, 0.1)
          .to(dot, { opacity: 0, duration: 0.2, ease: 'linear' }, 0.25);
      });
    } else if (mode === 'crosshair') {
      [0, 90, 180, 270].forEach(angleDeg => {
        const angle = (angleDeg * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', center.toString());
        line.setAttribute('y1', center.toString());
        line.setAttribute('x2', center.toString());
        line.setAttribute('y2', center.toString());
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', stroke.toString());
        line.setAttribute('stroke-linecap', 'square');
        svg.appendChild(line);
        const dx = Math.cos(angle) * (size * 0.3);
        const dy = -Math.sin(angle) * (size * 0.3);
        gsap.timeline({ onComplete: () => svg.remove() })
          .to(line, { attr: { x1: center + dx, y1: center + dy, x2: center + dx, y2: center + dy }, duration: 0.35, ease: 'power2.out' })
          .to(line, { strokeWidth: 0, duration: 0.25, ease: 'linear' }, 0.2);
      });
    } else if (mode === 'wavy') {
      [45, 90, 135, 180].forEach(angleDeg => {
        const angle = (angleDeg * Math.PI) / 180;
        const startRadius = size * 0.1;
        const endRadius = size * 0.5;
        const startX = center + Math.cos(angle) * startRadius;
        const startY = center - Math.sin(angle) * startRadius;
        const endX = center + Math.cos(angle) * endRadius;
        const endY = center - Math.sin(angle) * endRadius;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const waveOffset = size * 0.05;
        const control1X = midX + waveOffset * Math.cos(angle + Math.PI / 2);
        const control1Y = midY - waveOffset * Math.sin(angle + Math.PI / 2);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${startX} ${startY} Q ${control1X} ${control1Y} ${midX} ${midY} T ${endX} ${endY}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', stroke.toString());
        svg.appendChild(path);
        gsap.timeline({ onComplete: () => svg.remove() })
          .to(path, { strokeDasharray: '1, 300', strokeDashoffset: -300, duration: 0.4, ease: 'power1.out' })
          .to(path, { strokeWidth: 0, duration: 0.2, ease: 'linear' }, 0.25);
      });
    } else {
      [0, 90, 180, 270].forEach(angleDeg => {
        const angle = (angleDeg * Math.PI) / 180;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', center.toString());
        line.setAttribute('y1', center.toString());
        line.setAttribute('x2', center.toString());
        line.setAttribute('y2', center.toString());
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', stroke.toString());
        line.setAttribute('stroke-linecap', 'square');
        svg.appendChild(line);
        const dx = Math.cos(angle) * (size * 0.2);
        const dy = -Math.sin(angle) * (size * 0.2);
        gsap.timeline({ onComplete: () => svg.remove() })
          .to(line, { attr: { x1: center + dx, y1: center + dy, x2: center + dx, y2: center + dy }, duration: 0.35, ease: 'power2.out' })
          .to(line, { strokeWidth: 0, duration: 0.2, ease: 'linear' }, 0.2);
      });
    }

    clickOverlay.appendChild(svg);
  };

  if (hasGSAP){
    document.addEventListener('click', (event) => {
      const mode = 'sniper';
      createEffect(event.clientX, event.clientY, mode);
    });
  }

  /* ---------------------------------------------------------
     3. CURSOR SPOTLIGHT (telescope lens)
  --------------------------------------------------------- */
  const spotlight = document.getElementById('spotlight');
  if (spotlight && window.matchMedia('(hover:hover)').matches){
    let mx = window.innerWidth/2, my = window.innerHeight/2, cx = mx, cy = my;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function tick(){
      cx += (mx-cx)*.12; cy += (my-cy)*.12;
      spotlight.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(tick);
    })();
  }

  /* bento / card local spotlight (mouse position -> CSS vars) */
  document.querySelectorAll('.bento-item, .stat-card, .panel').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX-rect.left}px`);
      card.style.setProperty('--my', `${e.clientY-rect.top}px`);
    });
  });

  /* ---------------------------------------------------------
     4. NAV — scroll state + mobile toggle
  --------------------------------------------------------- */
  const nav = document.querySelector('.nav');
  if (nav){
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll(); window.addEventListener('scroll', onScroll, { passive:true });
  }
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks){
    const toggleNav = () => {
      const open = !navLinks.classList.contains('is-open');
      navToggle.classList.toggle('is-open', open);
      navLinks.classList.toggle('is-open', open);
      document.body.classList.toggle('lock-scroll', open);
    };

    navToggle.addEventListener('click', toggleNav);
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.classList.remove('is-open');
      navLinks.classList.remove('is-open');
      document.body.classList.remove('lock-scroll');
    }));
  }

  /* mark active nav link */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  /* ---------------------------------------------------------
     5. PROFILE DROPDOWN (dashboard nav)
  --------------------------------------------------------- */
  document.querySelectorAll('.profile-menu').forEach(menu => {
    const trigger = menu.querySelector('.profile-trigger');
    trigger?.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('is-open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.profile-menu.is-open').forEach(m => m.classList.remove('is-open'));
  });

  /* ---------------------------------------------------------
     5b. SIDEBAR TOGGLE (dashboard mobile)
     - toggles the sidebar + a backdrop together
     - keeps aria-expanded in sync for accessibility
     - closes on: backdrop click, Escape, or tapping a nav
       item inside the sidebar (so picking a section doesn't
       leave the panel covering the screen)
  --------------------------------------------------------- */
  const sideToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.dash-sidebar');

  if (sideToggle && sidebar){
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      sidebar.insertAdjacentElement('afterend', backdrop);
    }

    const openSidebar = () => {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
      sideToggle.classList.add('is-open');
      sideToggle.setAttribute('aria-expanded', 'true');
    };
    const closeSidebar = () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      sideToggle.classList.remove('is-open');
      sideToggle.setAttribute('aria-expanded', 'false');
    };
    const toggleSidebar = () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    };

    sideToggle.setAttribute('aria-expanded', 'false');
    sideToggle.addEventListener('click', e => {
      e.stopPropagation();
      toggleSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSidebar();
    });
    window.__dashboardSidebarToggle = true;
    sidebar.querySelectorAll('.side-link, a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width:900px)').matches) closeSidebar();
      });
    });
  }

  /* ---------------------------------------------------------
     6. BACK / HOME utility buttons
  --------------------------------------------------------- */
  document.querySelectorAll('[data-go-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (document.referrer && document.referrer.includes(location.host)) history.back();
      else location.href = 'index.html';
    });
  });

  /* ---------------------------------------------------------
     7. SCROLL REVEALS (generic)
  --------------------------------------------------------- */
  if (hasGSAP && window.ScrollTrigger){
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, {
        opacity:1, y:0, duration:.9, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 88%', once:true }
      });
    });

    gsap.utils.toArray('[data-stagger]').forEach(group => {
      const items = group.children;
      gsap.from(items, {
        opacity:0, y:36, duration:.7, stagger:.1, ease:'power3.out',
        scrollTrigger:{ trigger:group, start:'top 85%', once:true }
      });
    });

    /* section eyebrow / heading combo */
    gsap.utils.toArray('.section-head').forEach(head => {
      gsap.from(head.children, {
        opacity:0, y:24, duration:.7, stagger:.08, ease:'power3.out',
        scrollTrigger:{ trigger:head, start:'top 88%', once:true }
      });
    });

    gsap.utils.toArray('[data-scroll-move]').forEach(el => {
      gsap.fromTo(el,
        { x: -24, opacity: 0 },
        { x: 24, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            end: 'bottom 60%',
            scrub: 0.9
          }
        }
      );
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform='none'; });
  }

  /* ---------------------------------------------------------
     8. TIMELINE — activate dots on scroll
  --------------------------------------------------------- */
  if (hasGSAP && window.ScrollTrigger){
    gsap.utils.toArray('.timeline-item').forEach(item => {
      ScrollTrigger.create({
        trigger:item, start:'top 65%', end:'bottom 40%',
        onEnter:() => item.classList.add('is-active'),
        onEnterBack:() => item.classList.add('is-active'),
      });
      gsap.from(item, { opacity:0, x:-30, duration:.7, ease:'power3.out',
        scrollTrigger:{ trigger:item, start:'top 88%' } });
    });
  }

  /* ---------------------------------------------------------
     9. STICKY SCROLL STEPS
  --------------------------------------------------------- */
  if (hasGSAP && window.ScrollTrigger){
    document.querySelectorAll('.sticky-wrap').forEach(wrap => {
      const steps = wrap.querySelectorAll('.sticky-step');
      const visuals = wrap.querySelectorAll('[data-visual]');
      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger:step, start:'top 55%', end:'bottom 45%',
          onToggle: self => {
            if (self.isActive){
              steps.forEach(s => s.classList.remove('is-active'));
              step.classList.add('is-active');
              visuals.forEach(v => v.style.opacity = 0);
              if (visuals[i]) visuals[i].style.opacity = 1;
            }
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------
     10. HORIZONTAL SCROLL SECTION
  --------------------------------------------------------- */
  if (hasGSAP && window.ScrollTrigger){
    document.querySelectorAll('.hscroll-section').forEach(section => {
      const track = section.querySelector('.hscroll-track');
      const pin = section.querySelector('.hscroll-pin');
      if (!track || !pin) return;
      const getDistance = () => Math.max(track.scrollWidth - pin.clientWidth, 0);
      const duration = Math.max(getDistance() / 40, 24);
      const tl = gsap.timeline({ repeat:-1, yoyo:true, repeatDelay:1, paused:true })
        .to(track, { x: () => -getDistance(), duration, ease:'none' });

      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => tl.play(),
        onEnterBack: () => tl.play(),
        onLeave: () => tl.pause(),
        onLeaveBack: () => tl.pause(),
        invalidateOnRefresh: true
      });
    });
  }

  /* ---------------------------------------------------------
     11. LIVE STATS GRID
  --------------------------------------------------------- */

  /* ---------------------------------------------------------
     12. FLIP CARDS
  --------------------------------------------------------- */
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  });

  /* ---------------------------------------------------------
     13. EXPANDABLE CARDS (accordion)
  --------------------------------------------------------- */
  document.querySelectorAll('.expand-item').forEach(item => {
    const head = item.querySelector('.expand-head');
    const body = item.querySelector('.expand-body');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.closest('.expand-list').querySelectorAll('.expand-item').forEach(o => {
        o.classList.remove('is-open');
        o.querySelector('.expand-body').style.maxHeight = null;
      });
      if (!isOpen){
        item.classList.add('is-open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ---------------------------------------------------------
     14. MARQUEE — duplicate content for seamless loop
  --------------------------------------------------------- */
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });

  /* ---------------------------------------------------------
     15. FOOTER YEAR
  --------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------------------------------------------------------
     16. NEWSLETTER / FOOTER FORM (footer)
  --------------------------------------------------------- */
  document.querySelectorAll('.footer-newsletter').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input');
      const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRe.test(input.value.trim())){
        input.classList.add('invalid');
        input.placeholder = 'Enter a valid email e.g. name@gmail.com';
        input.value = '';
        return;
      }
      input.classList.remove('invalid');
      form.reset();
      window.location.href = '404error.html';
    });

    form.addEventListener('click', event => {
      const button = event.target.closest('.notify-button');
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const splash = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.4;
      splash.className = 'notify-button-splash';
      splash.style.width = `${size}px`;
      splash.style.height = `${size}px`;
      splash.style.left = `${event.clientX - rect.left - size / 2}px`;
      splash.style.top = `${event.clientY - rect.top - size / 2}px`;
      button.appendChild(splash);
      requestAnimationFrame(() => {
        splash.style.transform = 'scale(2.2)';
        splash.style.opacity = '0';
      });
      splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    });
  });

});
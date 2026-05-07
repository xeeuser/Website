/* ═══════════════════════════════════════════════════════════
   AUXANO STUDIO — APP.JS
   Full interactive experience: Three.js · Animations · UI
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── GLOBAL STATE ────────────────────────────────────────── */
const State = {
  loaderDone: false,
  threeReady: false,
  testiCurrent: 0,
  testiCount: 0,
  testiAuto: null,
  pricingMode: 'monthly', // 'monthly' | 'project'
  countersTriggered: false,
};

/* ══════════════════════════════════════════════════════════
   1. LOADER
══════════════════════════════════════════════════════════ */
function initLoader() {
  const loader    = document.getElementById('loader');
  const bar       = document.getElementById('loader-bar');
  const pct       = document.getElementById('loader-pct');
  if (!loader) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('done');
        State.loaderDone = true;
        document.body.classList.add('loaded');
      }, 350);
    }
    bar.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';
  }, 80);
}

/* ══════════════════════════════════════════════════════════
   2. CUSTOM CURSOR
══════════════════════════════════════════════════════════ */
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Smooth ring follow
  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Expand on interactive elements
  const hoverEls = document.querySelectorAll(
    'a, button, .pfilt, .faq-q, .svc-card, .port-card, .why-card, .team-card, .price-card, .testi-card'
  );

  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('expand');
      dot.style.transform = 'translate(-50%,-50%) scale(0.5)';
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('expand');
      dot.style.transform = 'translate(-50%,-50%) scale(1)';
    });
  });

  // Hide on leave
  document.addEventListener('mouseleave', () => {
    dot.classList.add('hide');
    ring.classList.add('hide');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('hide');
    ring.classList.remove('hide');
  });
}

/* ══════════════════════════════════════════════════════════
   3. THREE.JS HERO SCENE
══════════════════════════════════════════════════════════ */
function initHeroScene() {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded — skipping hero scene.');
    return;
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 380);

  /* ── Wireframe Icosphere ─── */
  const sphereGeo = new THREE.IcosahedronGeometry(110, 3);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x6bbaec,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(180, 0, 0);
  scene.add(sphere);

  /* ── Inner solid sphere (glow core) ─── */
  const innerGeo = new THREE.IcosahedronGeometry(80, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x2a6be8,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const innerSphere = new THREE.Mesh(innerGeo, innerMat);
  innerSphere.position.set(180, 0, 0);
  scene.add(innerSphere);

  /* ── Orbit rings ─── */
  const ringColors = [0x00d4ff, 0x2a6be8, 0x6bbaec];
  const rings = [];
  ringColors.forEach((col, i) => {
    const rGeo = new THREE.TorusGeometry(130 + i * 22, 0.5, 2, 120);
    const rMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25 - i * 0.06 });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.position.set(180, 0, 0);
    ring.rotation.x = Math.PI / (3 + i);
    ring.rotation.y = (Math.PI / 5) * i;
    scene.add(ring);
    rings.push(ring);
  });

  /* ── Floating particles ─── */
  const ptCount = 600;
  const ptPositions = new Float32Array(ptCount * 3);
  const ptSpeeds    = new Float32Array(ptCount);

  for (let i = 0; i < ptCount; i++) {
    ptPositions[i * 3]     = (Math.random() - 0.5) * 900;
    ptPositions[i * 3 + 1] = (Math.random() - 0.5) * 700;
    ptPositions[i * 3 + 2] = (Math.random() - 0.5) * 600 - 100;
    ptSpeeds[i] = Math.random() * 0.4 + 0.1;
  }

  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPositions, 3));
  const ptMat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 1.4, transparent: true, opacity: 0.55 });
  const particles = new THREE.Points(ptGeo, ptMat);
  scene.add(particles);

  /* ── Mouse parallax ─── */
  let targetMX = 0, targetMY = 0, currMX = 0, currMY = 0;

  document.addEventListener('mousemove', (e) => {
    targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Resize ─── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Animate ─── */
  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    clock += 0.008;

    // Mouse parallax smoothing
    currMX += (targetMX - currMX) * 0.05;
    currMY += (targetMY - currMY) * 0.05;

    // Sphere rotation
    sphere.rotation.y      += 0.0028;
    sphere.rotation.x      += 0.0009;
    innerSphere.rotation.y -= 0.004;
    innerSphere.rotation.z += 0.002;

    // Ring rotations
    rings.forEach((r, i) => {
      r.rotation.z += (i + 1) * 0.001;
      r.rotation.y += (i + 1) * 0.0005;
    });

    // Particle drift
    const pos = ptGeo.attributes.position;
    for (let i = 0; i < ptCount; i++) {
      pos.array[i * 3 + 1] += ptSpeeds[i] * 0.12;
      if (pos.array[i * 3 + 1] > 350) pos.array[i * 3 + 1] = -350;
    }
    pos.needsUpdate = true;

    // Parallax tilt on whole scene
    scene.rotation.y = currMX * 0.12;
    scene.rotation.x = currMY * 0.06;

    // Floating bob on sphere group
    sphere.position.y      = Math.sin(clock) * 12;
    innerSphere.position.y = Math.sin(clock + 0.5) * 10;

    renderer.render(scene, camera);
  }
  animate();
  State.threeReady = true;
}

/* ══════════════════════════════════════════════════════════
   4. NAVBAR
══════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  const navLinks  = document.querySelectorAll('.nav-link');
  if (!navbar) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
    toggleScrollTopBtn();
  }, { passive: true });

  // Mobile menu toggle
  hamburger && hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close mobile menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

function updateActiveLink() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';

  sections.forEach(sec => {
    const top = sec.getBoundingClientRect().top;
    if (top <= 100) current = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
  });
}

/* ══════════════════════════════════════════════════════════
   5. SMOOTH SCROLL
══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   6. TYPEWRITER EFFECT
══════════════════════════════════════════════════════════ */
function initTypewriter() {
  const el = document.getElementById('typewriter-target');
  if (!el) return;

  const words = ['Digital Excellence', 'Web Applications', 'Mobile Experiences', 'AI-Powered Products', 'Your Bold Vision'];
  let wordIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = words[wordIdx];

    if (deleting) {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(type, 400);
        return;
      }
    } else {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        setTimeout(() => { deleting = true; type(); }, 2200);
        return;
      }
    }

    const speed = deleting ? 55 : 90;
    setTimeout(type, speed);
  }

  // Start after loader + brief pause
  setTimeout(type, 1800);
}

/* ══════════════════════════════════════════════════════════
   7. REVEAL ANIMATIONS (IntersectionObserver)
══════════════════════════════════════════════════════════ */
function initReveal() {
  const elements = document.querySelectorAll('.reveal-fade, .reveal-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);

        // Trigger counters when stats band is visible
        const el = entry.target;
        if (el.closest('.stats-band') && !State.countersTriggered) {
          State.countersTriggered = true;
          setTimeout(animateCounters, 300);
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));

  // Also observe stat-item for counter trigger
  const statsEl = document.querySelector('.stats-band');
  if (statsEl) {
    const statsObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !State.countersTriggered) {
        State.countersTriggered = true;
        animateCounters();
        statsObs.disconnect();
      }
    }, { threshold: 0.3 });
    statsObs.observe(statsEl);
  }
}

/* ══════════════════════════════════════════════════════════
   8. COUNTER ANIMATIONS
══════════════════════════════════════════════════════════ */
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target, 10);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      counter.textContent = Math.floor(current);
      if (current < target) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

/* ══════════════════════════════════════════════════════════
   9. CARD TILT EFFECT (service & portfolio cards)
══════════════════════════════════════════════════════════ */
function initCardTilt() {
  const cards = document.querySelectorAll('.svc-card, .why-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ══════════════════════════════════════════════════════════
   10. PORTFOLIO FILTER
══════════════════════════════════════════════════════════ */
function initPortfolioFilter() {
  const filters   = document.querySelectorAll('.pfilt');
  const cards     = document.querySelectorAll('.port-card');
  if (!filters.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.cat === filter;
        if (match) {
          card.classList.remove('hidden');
          card.style.animationDelay = (i % 3) * 80 + 'ms';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   11. TESTIMONIALS SLIDER
══════════════════════════════════════════════════════════ */
function initTestimonials() {
  const track   = document.getElementById('testi-track');
  const dotsWrap = document.getElementById('testi-dots');
  const prevBtn  = document.getElementById('testi-prev');
  const nextBtn  = document.getElementById('testi-next');
  if (!track) return;

  const cards = track.querySelectorAll('.testi-card');
  State.testiCount = cards.length;

  // Determine visible cards based on viewport
  function getVisible() {
    if (window.innerWidth < 900) return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  }

  // Create dots
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const total = Math.ceil(State.testiCount / getVisible());
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.className = 't-dot' + (i === 0 ? ' active' : '');
      dot.dataset.idx = i;
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function goTo(idx) {
    const visible = getVisible();
    const maxIdx  = Math.ceil(State.testiCount / visible) - 1;
    State.testiCurrent = Math.max(0, Math.min(idx, maxIdx));

    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap       = 24; // 1.5rem
    const offset    = State.testiCurrent * (cardWidth + gap) * visible;
    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    document.querySelectorAll('.t-dot').forEach((d, i) => {
      d.classList.toggle('active', i === State.testiCurrent);
    });
  }

  prevBtn && prevBtn.addEventListener('click', () => {
    goTo(State.testiCurrent - 1);
    resetAuto();
  });

  nextBtn && nextBtn.addEventListener('click', () => {
    const total = Math.ceil(State.testiCount / getVisible());
    goTo((State.testiCurrent + 1) % total);
    resetAuto();
  });

  function resetAuto() {
    clearInterval(State.testiAuto);
    State.testiAuto = setInterval(() => {
      const total = Math.ceil(State.testiCount / getVisible());
      goTo((State.testiCurrent + 1) % total);
    }, 5000);
  }

  buildDots();
  resetAuto();

  window.addEventListener('resize', () => {
    buildDots();
    goTo(0);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   12. PRICING TOGGLE
══════════════════════════════════════════════════════════ */
function initPricingToggle() {
  const togSwitch  = document.getElementById('ptog-switch');
  const lblMonthly = document.getElementById('ptog-monthly');
  const lblProject = document.getElementById('ptog-project');
  if (!togSwitch) return;

  // Price data
  const prices = {
    monthly: {
      p1: { amt: '4,999',   per: '/month' },
      p2: { amt: '14,999',  per: '/month' },
    },
    project: {
      p1: { amt: '49,999',   per: '/project' },
      p2: { amt: '1,49,999', per: '/project' },
    }
  };

  function setPrices(mode) {
    const d = prices[mode];
    const p1Amt = document.getElementById('p1-amt');
    const p1Per = document.getElementById('p1-per');
    const p2Amt = document.getElementById('p2-amt');
    const p2Per = document.getElementById('p2-per');

    if (p1Amt) p1Amt.textContent = d.p1.amt;
    if (p1Per) p1Per.textContent = d.p1.per;
    if (p2Amt) p2Amt.textContent = d.p2.amt;
    if (p2Per) p2Per.textContent = d.p2.per;

    lblMonthly.dataset.active = mode === 'monthly' ? 'true' : 'false';
    lblProject.dataset.active = mode === 'project' ? 'true' : 'false';
    lblMonthly.style.color = mode === 'monthly' ? 'var(--c-white)' : 'var(--c-muted)';
    lblMonthly.style.fontWeight = mode === 'monthly' ? '600' : '400';
    lblProject.style.color = mode === 'project' ? 'var(--c-white)' : 'var(--c-muted)';
    lblProject.style.fontWeight = mode === 'project' ? '600' : '400';
  }

  const toggle = () => {
    State.pricingMode = State.pricingMode === 'monthly' ? 'project' : 'monthly';
    togSwitch.classList.toggle('on', State.pricingMode === 'project');
    togSwitch.setAttribute('aria-checked', String(State.pricingMode === 'project'));
    setPrices(State.pricingMode);
  };

  togSwitch.addEventListener('click', toggle);
  togSwitch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  lblMonthly.addEventListener('click', () => {
    if (State.pricingMode !== 'monthly') toggle();
  });
  lblProject.addEventListener('click', () => {
    if (State.pricingMode !== 'project') toggle();
  });
}

/* ══════════════════════════════════════════════════════════
   13. FAQ ACCORDION
══════════════════════════════════════════════════════════ */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    btn.addEventListener('click', () => {
      const open = item.classList.contains('open');

      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-a');
        if (a) a.style.maxHeight = '0';
        const b = i.querySelector('.faq-q');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if was closed)
      if (!open) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════
   14. CONTACT FORM
══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const submitBtn = document.getElementById('btn-submit');
  const success = document.getElementById('cf-success');
  if (!form) return;

  function showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById('err-' + fieldId.replace('cf-', ''));
    if (field) field.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('show'); }
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById('err-' + fieldId.replace('cf-', ''));
    if (field) field.classList.remove('error');
    if (err)   { err.textContent = ''; err.classList.remove('show'); }
  }

  // Live validation
  ['cf-name', 'cf-email', 'cf-service', 'cf-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(id));
  });

  function validate() {
    let valid = true;

    const name = document.getElementById('cf-name');
    if (!name || !name.value.trim()) {
      showError('cf-name', 'Please enter your name.');
      valid = false;
    }

    const email = document.getElementById('cf-email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.value.trim())) {
      showError('cf-email', 'Please enter a valid email address.');
      valid = false;
    }

    const service = document.getElementById('cf-service');
    if (!service || !service.value) {
      showError('cf-service', 'Please select a service.');
      valid = false;
    }

    const message = document.getElementById('cf-message');
    if (!message || message.value.trim().length < 20) {
      showError('cf-message', 'Please describe your project (at least 20 characters).');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Simulate sending
    const btnText    = submitBtn.querySelector('.bs-text');
    const btnLoading = submitBtn.querySelector('.bs-loading');
    const btnIcon    = submitBtn.querySelector('.bs-icon');

    submitBtn.disabled = true;
    if (btnText)    btnText.style.display    = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    if (btnIcon)    btnIcon.style.display    = 'none';

    setTimeout(() => {
      submitBtn.style.display = 'none';
      if (success) success.style.display = 'flex';
      form.reset();
    }, 1800);
  });
}

/* ══════════════════════════════════════════════════════════
   15. SCROLL-TO-TOP BUTTON
══════════════════════════════════════════════════════════ */
function toggleScrollTopBtn() {
  const btn = document.getElementById('scroll-top-btn');
  if (btn) btn.classList.toggle('show', window.scrollY > 500);
}

function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ══════════════════════════════════════════════════════════
   16. PROCESS LINE ANIMATION (draw on scroll)
══════════════════════════════════════════════════════════ */
function initProcessLine() {
  const line = document.querySelector('.process-line');
  if (!line) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      line.style.transform = 'scaleX(1)';
      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(line.parentElement);
}

/* ══════════════════════════════════════════════════════════
   17. SERVICE CARD NUMBER LABELS
══════════════════════════════════════════════════════════ */
function initServiceNumbers() {
  const cards = document.querySelectorAll('.svc-card');
  cards.forEach((card, i) => {
    const num = document.createElement('div');
    num.className = 'svc-num';
    num.textContent = String(i + 1).padStart(2, '0');
    num.style.cssText = `
      position:absolute;top:1.5rem;right:1.5rem;
      font-family:var(--font-mono);font-size:2.5rem;
      font-weight:700;color:rgba(255,255,255,.04);
      pointer-events:none;line-height:1;z-index:0;
    `;
    card.appendChild(num);
  });
}

/* ══════════════════════════════════════════════════════════
   18. PARALLAX SECTIONS (subtle background shift)
══════════════════════════════════════════════════════════ */
function initParallax() {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;

        // Hero content slight drift
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
          heroContent.style.transform = `translateY(${y * 0.12}px)`;
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   19. SECTION ENTRANCE GLOW (nav highlight on section enter)
══════════════════════════════════════════════════════════ */
function initSectionGlow() {
  const sections = document.querySelectorAll('.section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-in-view', 'true');
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(s => observer.observe(s));
}

/* ══════════════════════════════════════════════════════════
   20. FOOTER YEAR
══════════════════════════════════════════════════════════ */
function setFooterYear() {
  const yearEls = document.querySelectorAll('[data-year]');
  yearEls.forEach(el => el.textContent = new Date().getFullYear());
}

/* ══════════════════════════════════════════════════════════
   21. TEAM CARD SOCIAL HOVER — redirect to #contact placeholder
══════════════════════════════════════════════════════════ */
function initTeamSocials() {
  document.querySelectorAll('.ts-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.getAttribute('href') === '#') {
        e.preventDefault();
        // Smooth scroll to contact as placeholder action
        const contact = document.getElementById('contact');
        if (contact) {
          contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════
   22. MARQUEE PAUSE ON HOVER
══════════════════════════════════════════════════════════ */
function initMarquee() {
  const row = document.querySelector('.marquee-row');
  if (!row) return;

  row.addEventListener('mouseenter', () => { row.style.animationPlayState = 'paused'; });
  row.addEventListener('mouseleave', () => { row.style.animationPlayState = 'running'; });
}

/* ══════════════════════════════════════════════════════════
   23. PROCESS LINE STYLE FIX
══════════════════════════════════════════════════════════ */
function patchProcessLine() {
  const line = document.querySelector('.process-line');
  if (!line) return;
  Object.assign(line.style, {
    position:        'absolute',
    top:             '56px',
    left:            '10%',
    width:           '80%',
    height:          '2px',
    background:      'linear-gradient(90deg, transparent, #2a6be8, #00d4ff, #2a6be8, transparent)',
    zIndex:          '0',
    transform:       'scaleX(0)',
    transformOrigin: 'left',
    transition:      'transform 1.2s ease',
  });
}

/* ══════════════════════════════════════════════════════════
   24. PREVENT FLASH — ensure CSS loaded properly
══════════════════════════════════════════════════════════ */
function ensureStyles() {
  // Add a tiny style patch for elements that rely on JS
  const style = document.createElement('style');
  style.textContent = `
    .port-card.hidden { display:none!important; }
    .faq-a { max-height:0; transition:max-height .4s cubic-bezier(.4,0,.2,1); }
    .testi-track { will-change:transform; }
  `;
  document.head.appendChild(style);
}

/* ══════════════════════════════════════════════════════════
   BOOT — DOMContentLoaded
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  ensureStyles();
  initLoader();
  initCursor();
  initNavbar();
  initSmoothScroll();
  initTypewriter();
  initReveal();
  initPortfolioFilter();
  initTestimonials();
  initPricingToggle();
  initFAQ();
  initContactForm();
  initScrollTop();
  initServiceNumbers();
  initSectionGlow();
  initMarquee();
  initTeamSocials();
  patchProcessLine();
  initProcessLine();
  setFooterYear();

  // Three.js — slight delay to allow DOM paint first
  setTimeout(initHeroScene, 200);

  // Card tilt — after a little more time
  setTimeout(initCardTilt, 500);

  // Parallax — only on non-mobile
  if (window.matchMedia('(hover: hover)').matches) {
    initParallax();
  }

  console.log('%c◈ AUXANO STUDIO %c— Built with passion in Delhi, India', 
    'color:#00d4ff;font-family:monospace;font-size:14px;font-weight:bold;',
    'color:#6b8aad;font-family:monospace;font-size:12px;'
  );
});

/* ══════════════════════════════════════════════════════════
   WINDOW LOAD — final refinements
══════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  // Trigger initial active nav link
  updateActiveLink();
  toggleScrollTopBtn();

  // Animate hero badge immediately
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) {
    heroBadge.style.opacity = '1';
    heroBadge.style.transform = 'translateY(0)';
  }
});

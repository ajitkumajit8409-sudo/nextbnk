/* ==========================================================================
   NEXT BYTE BANK — Main JavaScript
   Preloader · Theme · Nav · Reveal · Counters · Ripple · EMI · Form
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. PRELOADER
     ------------------------------------------------------------------ */
  const preloader = $('#preloader');
  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add('hidden');
    document.body.classList.add('loaded');
    setTimeout(() => preloader.remove(), 700);
  };
  const minDelay = new Promise(res => setTimeout(res, reduceMotion ? 0 : 750));
  const pageLoad = new Promise(res => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  Promise.all([minDelay, pageLoad]).then(hidePreloader);
  setTimeout(hidePreloader, 5000); // safety net

  /* ------------------------------------------------------------------
     2. DARK / LIGHT THEME
     ------------------------------------------------------------------ */
  const root      = document.documentElement;
  const themeBtn  = $('#themeToggle');
  const themeIcon = $('#themeIcon');
  const stored    = localStorage.getItem('nbb-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (mode) => {
    root.setAttribute('data-theme', mode);
    localStorage.setItem('nbb-theme', mode);
    if (themeIcon) themeIcon.className = mode === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';
    if (themeBtn)  themeBtn.setAttribute('aria-label',
      mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#071120' : '#0D47A1');
  };

  applyTheme(stored || (prefersDark ? 'dark' : 'light'));
  if (themeBtn) themeBtn.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------------------------------------------
     3. STICKY NAVBAR + SCROLL STATE
     ------------------------------------------------------------------ */
  const navbar = $('#navbar');
  const onScroll = () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 30);
    const toTop = $('#toTop');
    if (toTop) toTop.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     4. ACTIVE NAV LINK (scroll spy)
     ------------------------------------------------------------------ */
  const navLinks = $$('.navbar .nav-link');
  const spied = ['home', 'services', 'features', 'loans', 'why', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window && spied.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        navLinks.forEach(a => {
          const href = a.getAttribute('href');
          a.classList.toggle('active', href === `#${id}`);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spied.forEach(s => spy.observe(s));
  }

  /* Close mobile menu after navigating */
  const mainNav = $('#mainNav');
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => {
    if (window.bootstrap && mainNav.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(mainNav).hide();
    }
  }));

  /* ------------------------------------------------------------------
     5. SEARCH BAR
     ------------------------------------------------------------------ */
  const searchBar = $('#searchBar');
  const openSearch  = () => { if (searchBar) { searchBar.hidden = false; $('#siteSearch')?.focus(); } };
  const closeSearch = () => { if (searchBar) searchBar.hidden = true; };
  $('#navSearchBtn')?.addEventListener('click', () => (searchBar?.hidden ? openSearch() : closeSearch()));
  $('#searchClose')?.addEventListener('click', closeSearch);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  });

  /* ------------------------------------------------------------------
     6. SCROLL REVEAL
     ------------------------------------------------------------------ */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
  } else {
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('visible'), i * 90);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => revealObs.observe(el));
  }

  /* ------------------------------------------------------------------
     7. ANIMATED COUNTERS
     ------------------------------------------------------------------ */
  const counters = $$('.counter');
  const runCounter = (el) => {
    const target   = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix   = el.dataset.suffix || '';
    const duration = reduceMotion ? 0 : 2000;
    const start    = performance.now();

    const tick = (now) => {
      const p = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const value = target * eased;
      el.textContent = formatNumber(value, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target, decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };

  function formatNumber(num, decimals) {
    const fixed = num.toFixed(decimals);
    const [int, dec] = fixed.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec ? `${grouped}.${dec}` : grouped;
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      const countObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(c => countObs.observe(c));
    }
  }

  /* ------------------------------------------------------------------
     8. BUTTON RIPPLE EFFECT
     ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ripple');
    if (!btn || reduceMotion) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink  = document.createElement('span');
    ink.className = 'ripple-ink';
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top  = `${e.clientY - rect.top  - size / 2}px`;
    btn.appendChild(ink);
    setTimeout(() => ink.remove(), 700);
  });

  /* ------------------------------------------------------------------
     9. BACK TO TOP
     ------------------------------------------------------------------ */
  $('#toTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ------------------------------------------------------------------
     10. EMI CALCULATOR
     ------------------------------------------------------------------ */
  const emiModal = $('#emiModal');
  if (emiModal) {
    const amountEl = $('#emiAmount');
    const tenureEl = $('#emiTenure');
    const rateEl   = $('#emiRate');

    const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    const calculate = () => {
      const P = +amountEl.value;
      const annual = +rateEl.value;
      const months = +tenureEl.value;
      const r = annual / 12 / 100;

      const emi = r === 0
        ? P / months
        : (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

      const total = emi * months;
      $('#emiAmountLabel').textContent = inr(P);
      $('#emiTenureLabel').textContent = `${months} months`;
      $('#emiRateLabel').textContent   = `${annual.toFixed(2)}%`;
      $('#emiOut').textContent      = inr(emi);
      $('#emiInterest').textContent = inr(total - P);
      $('#emiTotal').textContent    = inr(total);
    };

    [amountEl, tenureEl, rateEl].forEach(el => el?.addEventListener('input', calculate));

    emiModal.addEventListener('show.bs.modal', (e) => {
      const trigger = e.relatedTarget;
      if (trigger) {
        $('#emiLoanName').textContent = trigger.dataset.loan || 'Loan';
        amountEl.value = trigger.dataset.amount || 500000;
        tenureEl.value = trigger.dataset.tenure || 36;
        rateEl.value   = trigger.dataset.rate   || 10.25;
      }
      calculate();
    });

    calculate();
  }

  /* ------------------------------------------------------------------
     11. CONTACT FORM (client-side validation demo)
     ------------------------------------------------------------------ */
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = $('#formAlert');
      form.classList.add('was-validated');

      if (!form.checkValidity()) {
        alertBox.className = 'form-alert show err';
        alertBox.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Please complete the required fields correctly.';
        form.querySelector(':invalid')?.focus();
        return;
      }

      const name = $('#cfName').value.trim().split(' ')[0];
      alertBox.className = 'form-alert show ok';
      alertBox.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>Thank you, ${escapeHTML(name)}! Our relationship manager will contact you within 1 business day.`;
      form.reset();
      form.classList.remove('was-validated');
      alertBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /* ------------------------------------------------------------------
     12. MISC
     ------------------------------------------------------------------ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Smooth anchor offset for fixed header */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = (navbar?.offsetHeight || 76) + 14;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
})();

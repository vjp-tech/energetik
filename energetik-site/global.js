/* ═══════════════════════════════════════════════════════════
   global.js – Verena Johanna Polzhofer
   Gemeinsames JavaScript für alle Seiten
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────
     HILFSFUNKTION: HTML-Fragment laden und einfügen
     Verwendung im HTML:
       <div id="nav-placeholder" data-component="nav" data-page="home"></div>
       <div id="footer-placeholder" data-component="footer"></div>
  ──────────────────────────────────────────────────────── */
  async function loadComponent(placeholder) {
    const component       = placeholder.dataset.component; // "nav" oder "footer"
    const page            = placeholder.dataset.page || ''; // z. B. "home", "kurs", ...
    const placeholder_solid = placeholder.dataset.solid || '';

    try {
      const res  = await fetch(component + '.html');
      if (!res.ok) throw new Error('Datei nicht gefunden: ' + component + '.html');
      const html = await res.text();
      placeholder.outerHTML = html; // Placeholder durch echten HTML-Code ersetzen
    } catch (err) {
      console.warn('Komponente konnte nicht geladen werden:', err);
      return;
    }

    // Nach dem Laden: nav-solid Klasse setzen (für Seiten ohne transparenten Hero)
    if (component === 'nav') {
      const nav = document.getElementById('nav');
      if (nav && placeholder_solid === 'true') {
        nav.classList.add('nav-solid');
      }
      // Aktiven Nav-Link markieren
      if (page) {
        document.querySelectorAll('[data-nav]').forEach(a => {
          if (a.dataset.nav === page) a.classList.add('active');
        });
      }
    }

    // Nach dem Laden: alle abhängigen Scripts initialisieren
    initAll();
  }

  /* ────────────────────────────────────────────────────────
     ALLE PLACEHOLDERS LADEN
  ──────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-component]').forEach(loadComponent);

  /* ────────────────────────────────────────────────────────
     INITIALISIERUNG aller interaktiven Elemente
     Wird nach dem Laden jeder Komponente aufgerufen.
     Benutzt Guards damit nichts doppelt gebunden wird.
  ──────────────────────────────────────────────────────── */
  function initAll() {
    initNav();
    initBurger();
    initSmoothScroll();
    initScrollTop();
    initReveals();
    initForm();
    initCookieBanner();
    initTestimonialDots();
  }

  // Verhindert doppeltes Event-Binding
  function once(el, attr) {
    if (el.dataset[attr]) return false;
    el.dataset[attr] = '1';
    return true;
  }

  // ── NAV: Scroll-Effekt ──
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav || !once(nav, 'scrollInit')) return;
    const isSolid = nav.classList.contains('nav-solid');
    window.addEventListener('scroll', () => {
      if (!isSolid) {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }
      const scrollBtn = document.getElementById('scrollTop');
      if (scrollBtn) {
        scrollBtn.classList.toggle('show', window.scrollY > 400);
      }
    }, { passive: true });
  }

  // ── NAV: Burger-Menü ──
  function initBurger() {
    const burger     = document.getElementById('navBurger');
    const mobileMenu = document.getElementById('navMobile');
    if (!burger || !mobileMenu || !once(burger, 'burgerInit')) return;
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      });
    });
  }

  // ── SMOOTH SCROLL ──
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      if (a.dataset.smoothInit) return;
      a.dataset.smoothInit = '1';
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ── SCROLL TO TOP ──
  function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn || !once(btn, 'scrollTopInit')) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── REVEAL ANIMATIONEN ──
  function initReveals() {
    const reveals = document.querySelectorAll('.reveal:not([data-observed])');
    if (!reveals.length) return;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(el => {
        el.dataset.observed = '1';
        observer.observe(el);
      });
    } else {
      reveals.forEach(el => el.classList.add('visible'));
    }
  }

  // ── KONTAKT FORMULAR ──
  function initForm() {
    const form        = document.getElementById('kontaktForm');
    const formSuccess = document.getElementById('formSuccess');
    if (!form || !once(form, 'formInit')) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      btn.textContent = 'Wird gesendet…';
      btn.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.style.display = 'none';
          if (formSuccess) formSuccess.style.display = 'block';
        } else {
          btn.textContent = 'Fehler – bitte erneut versuchen';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Fehler – bitte erneut versuchen';
        btn.disabled = false;
      }
    });
  }

  // ── COOKIE BANNER ──
  function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (!banner || !once(banner, 'cookieInit')) return;
    const COOKIE_KEY = 'vjp_cookie_consent';
    if (!localStorage.getItem(COOKIE_KEY)) {
      setTimeout(() => banner.classList.add('show'), 800);
    }
    const acceptBtn  = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        banner.classList.remove('show');
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        localStorage.setItem(COOKIE_KEY, 'declined');
        banner.classList.remove('show');
      });
    }
  }

  // ── TESTIMONIAL DOTS (nur index.html) ──
  function initTestimonialDots() {
    const tGrid = document.getElementById('tGrid');
    const dots  = document.querySelectorAll('#tDots .t-dot');
    if (!tGrid || !dots.length || !once(tGrid, 'tDotsInit')) return;
    tGrid.addEventListener('scroll', () => {
      const index = Math.round(tGrid.scrollLeft / tGrid.offsetWidth);
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }, { passive: true });
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        tGrid.scrollTo({ left: i * tGrid.offsetWidth, behavior: 'smooth' });
      });
    });
  }

  // Beim ersten Laden auch direkt initialisieren
  // (für Elemente die schon im HTML stehen, nicht per Komponente geladen)
  initAll();

})();

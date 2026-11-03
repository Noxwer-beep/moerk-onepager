(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  const loader = document.querySelector('.loader');
  let loaderDone = false;

  const revealPage = () => {
    if (loaderDone) return;
    loaderDone = true;
    body.classList.add('is-loaded');
    if (loader) {
      loader.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => loader.classList.add('is-hidden'), 1000);
    }
  };

  window.addEventListener('load', () => window.setTimeout(revealPage, 420));
  window.setTimeout(revealPage, 2600);

  /* ---------- Header on scroll ---------- */
  const header = document.querySelector('.site-header');
  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---------- Scroll progress ---------- */
  const progressBar = document.getElementById('scroll-progress-bar');

  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* ---------- Live opening status (Berlin time) ---------- */
  const statusBox = document.getElementById('open-status');
  const statusText = document.getElementById('open-status-text');
  const openingHours = {
    0: [600, 1020],
    1: [450, 1140],
    2: [450, 1140],
    3: [450, 1140],
    4: [450, 1140],
    5: [450, 1140],
    6: [540, 1140],
  };

  const formatTime = (minutes) => {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const updateOpenStatus = () => {
    if (!statusBox || !statusText) return;

    let day = new Date().getDay();
    let minutes = new Date().getHours() * 60 + new Date().getMinutes();

    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Berlin',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date());
      const value = (type) => parts.find((part) => part.type === type)?.value;
      const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      day = days[value('weekday')] ?? day;
      minutes = Number(value('hour')) * 60 + Number(value('minute'));
    } catch (error) {
      /* Fall back to the local clock if the time zone is unavailable. */
    }

    const [opens, closes] = openingHours[day];
    let text;
    let isClosed = false;

    if (minutes >= opens && minutes < closes) {
      text = `Jetzt geöffnet · bis ${formatTime(closes)}`;
    } else if (minutes < opens) {
      text = `Öffnet um ${formatTime(opens)}`;
      isClosed = true;
    } else {
      const nextDay = (day + 1) % 7;
      const [nextOpens] = openingHours[nextDay];
      text = `Geschlossen · öffnet morgen um ${formatTime(nextOpens)}`;
      isClosed = true;
    }

    statusBox.classList.toggle('is-closed', isClosed);
    statusText.textContent = text;
  };

  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);

  /* ---------- Scroll reveal ---------- */
  const revealElements = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Scrollspy ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const spySections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && spySections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle(
              'is-active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    spySections.forEach((section) => spyObserver.observe(section));
  }

  /* ---------- Mobile navigation ---------- */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  const setNavigation = (open) => {
    body.classList.toggle('nav-open', open);
    if (!burger) return;

    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');

    if (open && mobileNav) {
      window.setTimeout(() => mobileNav.focus({ preventScroll: true }), 0);
    }
  };

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      setNavigation(!body.classList.contains('nav-open'));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavigation(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && body.classList.contains('nav-open')) {
        setNavigation(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && body.classList.contains('nav-open')) {
        setNavigation(false);
      }
    });
  }

  /* ---------- Menu tabs ---------- */
  const tabs = Array.from(document.querySelectorAll('.tab'));

  if (tabs.length) {
    const panels = tabs.map((tab) =>
      document.getElementById(tab.getAttribute('aria-controls'))
    );

    const activateTab = (index, moveFocus = false) => {
      tabs.forEach((tab, i) => {
        const isActive = i === index;
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;

        const panel = panels[i];
        if (!panel) return;
        panel.hidden = !isActive;
        panel.classList.toggle('is-active', isActive);
      });

      if (moveFocus) tabs[index].focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(index));

      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;

        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;

        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(nextIndex, true);
        }
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');

  if (cursor && cursorDot && finePointer && !reducedMotion) {
    root.classList.add('has-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let isActive = false;

    const showCursor = () => {
      if (isActive) return;
      isActive = true;
      cursor.classList.add('is-active');
      cursorDot.classList.add('is-active');
      ringX = mouseX;
      ringY = mouseY;
    };

    window.addEventListener(
      'mousemove',
      (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        showCursor();
        cursorDot.style.transform =
          `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      },
      { passive: true }
    );

    const animateCursor = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursor.style.transform =
        `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(animateCursor);
    };
    window.requestAnimationFrame(animateCursor);

    document.querySelectorAll('a, button, .dish, .gallery__item, .tab').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    document.addEventListener('mouseleave', () => {
      isActive = false;
      cursor.classList.remove('is-active');
      cursorDot.classList.remove('is-active');
    });
  }

  /* ---------- Dish hover preview ---------- */
  const dishPreview = document.querySelector('.dish-preview');

  if (dishPreview && finePointer && !reducedMotion) {
    const previewImage = dishPreview.querySelector('img');
    const previewSources = new Set();

    document.querySelectorAll('[data-preview]').forEach((list) => {
      previewSources.add(list.dataset.preview);
    });

    previewSources.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    window.addEventListener(
      'mousemove',
      (event) => {
        dishPreview.style.setProperty('--px', `${event.clientX}px`);
        dishPreview.style.setProperty('--py', `${event.clientY}px`);
      },
      { passive: true }
    );

    document.querySelectorAll('.dish').forEach((dish) => {
      dish.addEventListener('mouseenter', () => {
        const list = dish.closest('[data-preview]');
        if (!list) return;
        if (previewImage.getAttribute('src') !== list.dataset.preview) {
          previewImage.src = list.dataset.preview;
        }
        dishPreview.classList.add('is-visible');
      });

      dish.addEventListener('mouseleave', () => {
        dishPreview.classList.remove('is-visible');
      });
    });
  }

  /* ---------- Hero image parallax ---------- */
  const hero = document.querySelector('.hero');
  const heroFrame = document.querySelector('.hero__frame');

  if (hero && heroFrame && finePointer && !reducedMotion) {
    hero.addEventListener(
      'mousemove',
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        heroFrame.style.transform =
          `translate3d(${x * 14}px, ${y * 14}px, 0) rotate(${x * 1.3}deg)`;
      },
      { passive: true }
    );

    hero.addEventListener('mouseleave', () => {
      heroFrame.style.transform = '';
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCount = document.getElementById('lightbox-count');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxClose = document.getElementById('lightbox-close');
  const galleryButtons = Array.from(document.querySelectorAll('.gallery__open'));

  if (lightbox && lightboxImage && lightbox.showModal && galleryButtons.length) {
    let lightboxIndex = 0;

    const renderLightbox = (index) => {
      lightboxIndex = (index + galleryButtons.length) % galleryButtons.length;
      const button = galleryButtons[lightboxIndex];
      const figure = button.closest('.gallery__item');
      const image = figure.querySelector('img');

      lightboxImage.src = button.dataset.full || image.src;
      lightboxImage.alt = image.alt;
      if (lightboxCaption) lightboxCaption.textContent = button.dataset.caption || '';
      if (lightboxCount) {
        lightboxCount.textContent = `${lightboxIndex + 1} / ${galleryButtons.length}`;
      }
    };

    const openLightbox = (index) => {
      renderLightbox(index);
      lightbox.showModal();
      document.body.classList.add('lightbox-open');
    };

    const closeLightbox = () => {
      if (lightbox.open) lightbox.close();
      document.body.classList.remove('lightbox-open');
      lightboxImage.removeAttribute('src');
    };

    galleryButtons.forEach((button, index) => {
      button.addEventListener('click', () => openLightbox(index));
    });

    lightboxPrev?.addEventListener('click', () => renderLightbox(lightboxIndex - 1));
    lightboxNext?.addEventListener('click', () => renderLightbox(lightboxIndex + 1));
    lightboxClose?.addEventListener('click', closeLightbox);

    lightbox.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeLightbox();
    });

    lightbox.addEventListener('close', () => {
      document.body.classList.remove('lightbox-open');
      lightboxImage.removeAttribute('src');
    });

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        renderLightbox(lightboxIndex + 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        renderLightbox(lightboxIndex - 1);
      }
    });
  }

  /* ---------- Reservation form ---------- */
  const form = document.getElementById('reservation-form');
  const success = form ? form.querySelector('.form__success') : null;
  const dateInput = document.getElementById('date');

  if (dateInput) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    dateInput.min = new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  if (form && success) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const rawName = String(data.get('name') || '').trim();
      const firstName = rawName.split(/\s+/)[0] || 'du';
      const guests = String(data.get('guests') || '');
      const time = String(data.get('time') || '');
      const rawDate = String(data.get('date') || '');

      let formattedDate = '';
      if (rawDate) {
        const parsed = new Date(`${rawDate}T12:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          formattedDate = parsed.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
          });
        }
      }

      const guestLabel = guests === '1' ? '1 Person' : `${guests} Personen`;

      success.hidden = false;
      success.textContent =
        `Danke, ${firstName}! Deine Anfrage für ${guestLabel} am ${formattedDate} um ${time} Uhr ist bei uns. Wir bestätigen sie innerhalb von 24 Stunden per E-Mail.`;

      form.reset();
      success.focus?.({ preventScroll: true });
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelector('[data-year]');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const header = document.querySelector('.site-header');
  if (header) {
    const SCROLL_THRESHOLD = 40;
    const toggleHeaderState = () => {
      header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    };
    toggleHeaderState();
    window.addEventListener('scroll', toggleHeaderState, { passive: true });
  }

  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');
  if (navToggle && siteNav) {
    const closeMenu = () => {
      siteNav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Animación "impresión" de la HP Sprocket, sincronizada con el scroll desde el Hero.
  // El elemento ya arranca superpuesto sobre el Hero (overlap por diseño), así que
  // el progreso se ata directamente al scroll desde el tope de la página: 0 al
  // cargar (todavía sin imprimir) y 1 a los PRINT_SCROLL_DISTANCE px (mientras la
  // impresora sigue bien visible, antes de que se desplace fuera de pantalla).
  const printerShot = document.querySelector('.product-shot');
  const printerPhoto = printerShot ? printerShot.querySelector('img') : null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (printerShot && printerPhoto && !reducedMotion) {
    const PRINT_SCROLL_DISTANCE = 800;
    let ticking = false;
    const updatePrintProgress = () => {
      const progress = Math.min(Math.max(window.scrollY / PRINT_SCROLL_DISTANCE, 0), 1);
      printerPhoto.style.setProperty('--print-progress', progress.toFixed(3));
      ticking = false;
    };
    updatePrintProgress();
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(updatePrintProgress);
          ticking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', updatePrintProgress);
  }

  // Los íconos de ZINK / Bluetooth / Portátil aparecen uno por uno al entrar en pantalla.
  const featureRow = document.querySelector('.feature-row');
  if (featureRow) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      featureRow.classList.add('is-visible');
    } else {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              featureRow.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(featureRow);
    }
  }

  // Animaciones de entrada al hacer scroll: títulos, bajadas (.reveal) y cards (.reveal-group > .reveal-item).
  const revealEls = document.querySelectorAll('.reveal');
  const revealGroups = document.querySelectorAll('.reveal-group');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    revealGroups.forEach((group) => {
      group.querySelectorAll('.reveal-item').forEach((item) => item.classList.add('is-visible'));
    });
  } else {
    const REVEAL_THRESHOLD = 0.25;
    const STAGGER_STEP_MS = 90;
    const STAGGER_MAX_MS = 450;

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: REVEAL_THRESHOLD }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const groupObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.reveal-item');
            items.forEach((item, index) => {
              item.style.transitionDelay = `${Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS)}ms`;
              item.classList.add('is-visible');
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: REVEAL_THRESHOLD }
    );
    revealGroups.forEach((group) => groupObserver.observe(group));
  }

  // Carruseles de tarjetas apiladas (polaroids en "papel", vistas de la
  // impresora en "características"): al hacer click, la de adelante pasa al
  // fondo del mazo y la siguiente queda al frente. Sin autoplay: el usuario
  // controla el avance.
  document.querySelectorAll('.stack-carousel').forEach((stack) => {
    const cards = Array.from(stack.children);
    if (cards.length < 2) return;
    let order = cards.map((_, index) => index);

    const applyOrder = () => {
      order.forEach((cardIndex, pos) => {
        cards[cardIndex].dataset.pos = String(pos);
      });
    };
    applyOrder();

    stack.setAttribute('role', 'button');
    stack.setAttribute('tabindex', '0');
    stack.setAttribute('aria-label', 'Ver la siguiente foto');

    const advance = () => {
      order.push(order.shift());
      applyOrder();
    };
    stack.addEventListener('click', advance);
    stack.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advance();
      }
    });
  });
});

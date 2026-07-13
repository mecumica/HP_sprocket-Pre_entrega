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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: la foto de fondo hace un zoom progresivo (efecto "scale ligado al
  // scroll", como en caeli-energie.com) mientras el hero sigue visible.
  const heroBanner = document.querySelector('.hero-banner');
  const heroPhoto = heroBanner ? heroBanner.querySelector('img') : null;
  if (heroPhoto && !reducedMotion) {
    const HERO_ZOOM_DISTANCE = 700;
    const HERO_MAX_ZOOM = 1.15;
    let heroTicking = false;
    const updateHeroZoom = () => {
      const progress = Math.min(Math.max(window.scrollY / HERO_ZOOM_DISTANCE, 0), 1);
      const zoom = 1 + (HERO_MAX_ZOOM - 1) * progress;
      heroPhoto.style.setProperty('--hero-zoom', zoom.toFixed(3));
      heroTicking = false;
    };
    updateHeroZoom();
    window.addEventListener(
      'scroll',
      () => {
        if (!heroTicking) {
          requestAnimationFrame(updateHeroZoom);
          heroTicking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', updateHeroZoom);
  }

  // Secuencia de la impresora con scroll fijado, en fases:
  //   print → la impresora imprime la polaroid (clip-path progresivo)
  //   fly   → la polaroid vuela hasta el lugar de la 1ª del apilado y la
  //           impresora sube fuera de plano
  //   1/2/3 → ZINK / Bluetooth / Portátil se van sumando
  const printScroll = document.querySelector('[data-print-scroll]');
  const printStage = printScroll ? printScroll.querySelector('[data-print-stage]') : null;
  const printEmerge = printScroll ? printScroll.querySelector('[data-print-emerge]') : null;
  if (printScroll && printStage && printEmerge) {
    const PRINT_END = 0.16; // la impresión termina acá
    const FLY_START = 0.2; // arranca el vuelo de la polaroid
    const STAGE_1_START = 0.34; // aterriza: ZINK
    const STAGE_2_START = 0.56; // Bluetooth
    const STAGE_3_START = 0.78; // Portátil

    // Mide dónde está la 1ª polaroid del apilado y deja el desplazamiento
    // (vuelo) listo en variables CSS. offsetLeft/Top no se ven afectados por
    // los transforms, así que la medición es estable.
    const setFlyVars = () => {
      const target = printScroll.querySelector('.print-stack-photo[data-stack="0"]');
      if (!target) return;
      const centerWithin = (el, boundary) => {
        let x = el.offsetWidth / 2;
        let y = el.offsetHeight / 2;
        let node = el;
        while (node && node !== boundary) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent;
        }
        return { x, y };
      };
      const from = centerWithin(printEmerge, printStage);
      // La polaroid tiene translate -50% horizontal: su centro visual queda
      // en offsetLeft, no en offsetLeft + mitad del ancho.
      from.x -= printEmerge.offsetWidth / 2;
      const to = centerWithin(target, printStage);
      // La 1ª del apilado se muestra con translate(-12px, -14px).
      to.x -= 12;
      to.y -= 14;
      printEmerge.style.setProperty('--fly-x', `${(to.x - from.x).toFixed(1)}px`);
      printEmerge.style.setProperty('--fly-y', `${(to.y - from.y).toFixed(1)}px`);
      printEmerge.style.setProperty('--fly-s', (target.offsetWidth / printEmerge.offsetWidth).toFixed(3));
    };

    if (reducedMotion) {
      printStage.dataset.stage = '3';
      printEmerge.style.setProperty('--print-progress', '1');
    } else {
      setFlyVars();
      let ticking = false;
      const updatePrintStages = () => {
        const rect = printScroll.getBoundingClientRect();
        const total = printScroll.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
        const progress = total > 0 ? scrolled / total : 0;

        printEmerge.style.setProperty('--print-progress', Math.min(progress / PRINT_END, 1).toFixed(3));

        let stage = 'print';
        if (progress >= STAGE_3_START) stage = '3';
        else if (progress >= STAGE_2_START) stage = '2';
        else if (progress >= STAGE_1_START) stage = '1';
        else if (progress >= FLY_START) stage = 'fly';
        printStage.dataset.stage = stage;

        ticking = false;
      };
      updatePrintStages();
      window.addEventListener(
        'scroll',
        () => {
          if (!ticking) {
            requestAnimationFrame(updatePrintStages);
            ticking = true;
          }
        },
        { passive: true }
      );
      window.addEventListener('resize', () => {
        setFlyVars();
        updatePrintStages();
      });
      window.addEventListener('load', setFlyVars);
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
    // Solo las <figure> son cards: el carrusel puede tener además un hint
    // ("tocá para girarla") que no forma parte del mazo.
    const cards = Array.from(stack.children).filter((child) => child.matches('figure'));
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
    const retreat = () => {
      order.unshift(order.pop());
      applyOrder();
    };
    stack.addEventListener('click', advance);

    // Flechas laterales opcionales (carrusel de la impresora): avanzan o
    // retroceden sin disparar además el click general del mazo.
    const prevBtn = stack.querySelector('[data-carousel-prev]');
    const nextBtn = stack.querySelector('[data-carousel-next]');
    if (prevBtn) {
      prevBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        retreat();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        advance();
      });
    }
    stack.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advance();
      }
    });

    // Con data-autoplay la imagen interna va cambiando sola (se pausa con el
    // mouse encima y se desactiva si el usuario prefiere menos movimiento).
    if (stack.hasAttribute('data-autoplay') && !reducedMotion) {
      const AUTOPLAY_MS = 3500;
      let timer = setInterval(advance, AUTOPLAY_MS);
      stack.addEventListener('mouseenter', () => clearInterval(timer));
      stack.addEventListener('mouseleave', () => {
        clearInterval(timer);
        timer = setInterval(advance, AUTOPLAY_MS);
      });
    }
  });
});

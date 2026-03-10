/* global gsap, ScrollTrigger */

gsap.registerPlugin(ScrollTrigger);

// Smooth-ish ticker drift
(function ticker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  // clone for seamless loop
  const clone = track.cloneNode(true);
  track.parentElement?.appendChild(clone);

  let x = 0;
  function step() {
    x -= 0.45;
    track.style.transform = `translate3d(${x}px,0,0)`;
    clone.style.transform = `translate3d(${x + track.scrollWidth}px,0,0)`;
    if (Math.abs(x) > track.scrollWidth) x = 0;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

// Scroll choreography (BAYC-esque but restrained)
const scenes = document.querySelectorAll('.scene');
scenes.forEach((scene) => {
  const content = scene.querySelector('.scene__content');
  if (!content) return;

  gsap.fromTo(
    content,
    { opacity: 0, y: 22 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: scene,
        start: 'top 70%',
      },
    },
  );
});

// Subtle parallax on hero background image
const heroImg = document.querySelector('#hero .bgimg');
if (heroImg) {
  gsap.to(heroImg, {
    scale: 1.12,
    y: 40,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// 3D-ish hover tilt on strategy cards
function tilt(el) {
  const max = 6; // degrees
  const reset = () => {
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -max;
    const ry = (px - 0.5) * max;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
  });
  el.addEventListener('mouseleave', reset);
  reset();
}

document.querySelectorAll('[data-tilt]').forEach((el) => tilt(el));

// Catalog modal controls
const catalogModal = document.getElementById('catalogModal');
const openCatalogBtn = document.getElementById('openCatalogBtn');
const closeCatalogBtn = document.getElementById('closeCatalogBtn');
const catalogOverlay = document.getElementById('catalogOverlay');

function openCatalog() {
  if (!catalogModal) return;
  catalogModal.classList.add('is-open');
  catalogModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCatalog() {
  if (!catalogModal) return;
  catalogModal.classList.remove('is-open');
  catalogModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

openCatalogBtn?.addEventListener('click', openCatalog);
closeCatalogBtn?.addEventListener('click', closeCatalog);
catalogOverlay?.addEventListener('click', closeCatalog);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCatalog();
});


// ============================================================
// TERMINAL MOCK — animated cursor interaction (Landing index.html)
// Sequence: Portfolio → hover line items → Research
// ============================================================
;(function terminalCursorDemo() {
  const mock = document.getElementById('terminalMock');
  if (!mock) return;

  const cursor        = document.getElementById('tmCursor');
  const navStrategies = document.getElementById('tmNavStrategies');
  const navPortfolio  = document.getElementById('tmNavPortfolio');
  const navResearch   = document.getElementById('tmNavResearch');

  const panelStrategies = document.getElementById('tmPanelStrategies');
  const panelPortfolio  = document.getElementById('tmPanelPortfolio');
  const panelResearch   = document.getElementById('tmPanelResearch');

  const portAAPL = document.getElementById('tmPortAAPL');
  const portAMZN = document.getElementById('tmPortAMZN');
  const portNVDA = document.getElementById('tmPortNVDA');

  if (!cursor || !navPortfolio || !navResearch || !navStrategies) return;

  function relCentre(el) {
    const mRect = mock.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left - mRect.left + eRect.width / 2 - 8,
      y: eRect.top  - mRect.top  + eRect.height / 2 - 10,
    };
  }

  function moveTo(el) {
    const p = relCentre(el);
    cursor.style.left = p.x + 'px';
    cursor.style.top  = p.y + 'px';
  }

  function setActiveNav(which) {
    [navStrategies, navPortfolio, navResearch].forEach(n => n.classList.remove('tm-active'));
    if (which === 'portfolio') navPortfolio.classList.add('tm-active');
    else if (which === 'research') navResearch.classList.add('tm-active');
    else navStrategies.classList.add('tm-active');
  }

  function showPanel(which) {
    [panelStrategies, panelPortfolio, panelResearch].forEach(p => {
      if (!p) return;
      p.classList.add('tmPanel--hidden');
      p.classList.remove('tmPanel--visible');
    });
    const p = which === 'portfolio' ? panelPortfolio : which === 'research' ? panelResearch : panelStrategies;
    p?.classList.remove('tmPanel--hidden');
    p?.classList.add('tmPanel--visible');
    setActiveNav(which);
  }

  let running = false;
  function runSequence() {
    if (running) return;
    running = true;

    cursor.classList.add('is-visible');
    showPanel('strategies');

    // Hover Portfolio
    moveTo(navPortfolio);
    navPortfolio.classList.add('tm-hover');

    setTimeout(() => {
      navPortfolio.classList.remove('tm-hover');
      showPanel('portfolio');
    }, 1100);

    // Hover a few line items
    setTimeout(() => {
      portAAPL?.classList.add('tm-hover');
      moveTo(portAAPL || navPortfolio);
    }, 1700);

    setTimeout(() => {
      portAAPL?.classList.remove('tm-hover');
      portAMZN?.classList.add('tm-hover');
      moveTo(portAMZN || navPortfolio);
    }, 2500);

    setTimeout(() => {
      portAMZN?.classList.remove('tm-hover');
      portNVDA?.classList.add('tm-hover');
      moveTo(portNVDA || navPortfolio);
    }, 3300);

    // Click Research
    setTimeout(() => {
      portNVDA?.classList.remove('tm-hover');
      navResearch.classList.add('tm-hover');
      moveTo(navResearch);
    }, 4200);

    setTimeout(() => {
      navResearch.classList.remove('tm-hover');
      showPanel('research');
    }, 5100);

    // Reset
    setTimeout(() => {
      cursor.classList.remove('is-visible');
      setTimeout(() => { running = false; }, 700);
    }, 7600);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      setTimeout(runSequence, 650);
      setInterval(() => { if (!running) runSequence(); }, 12000);
      observer.disconnect();
    });
  }, { threshold: 0.45 });

  observer.observe(mock);
})();

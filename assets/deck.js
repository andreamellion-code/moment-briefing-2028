/* ============================================================
   MOMENT — Custom deck navigation
   - One slide visible at a time (.canvas elements)
   - Arrow keys / PageUp-Down / Space / wheel / touch swipe
   - Hash sync (#/N) so the TOC card links work
   - Progress bar + counter + arrow buttons
   ============================================================ */

(function() {
  'use strict';

  function init() {
    const slides = Array.from(document.querySelectorAll('.canvas'));
    if (slides.length === 0) return;

    let current = 0;

    // Read initial slide index from hash
    const m = window.location.hash.match(/#\/(\d+)/);
    if (m) current = clamp(parseInt(m[1], 10), 0, slides.length - 1);

    // Build UI chrome
    buildChrome();

    function clamp(n, min, max) { return Math.max(min, Math.min(n, max)); }

    function show(i) {
      const prev = current;
      current = clamp(i, 0, slides.length - 1);
      if (prev === current && slides[current].classList.contains('active')) {
        // still update UI on initial render
      }
      slides.forEach((s, idx) => {
        s.classList.toggle('active', idx === current);
      });
      history.replaceState(null, '', '#/' + current);
      updateChrome();
    }

    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    // ------ Keyboard ------
    document.addEventListener('keydown', function(e) {
      if (e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault(); next(); break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault(); prev(); break;
        case 'Home':
          e.preventDefault(); show(0); break;
        case 'End':
          e.preventDefault(); show(slides.length - 1); break;
        case 'Escape':
          e.preventDefault(); show(1); break; // jump to TOC (slide index 1)
      }
    });

    // ------ Wheel (debounced) ------
    // On overview/table-of-contents slides (and any element opted in via
    // data-scrollable), wheel events NEVER trigger slide navigation — they
    // only scroll the content natively. Users navigate from there via:
    // arrow keys, the bottom-right buttons, or clicking a chapter card.
    let wheelLocked = false;
    document.addEventListener('wheel', function(e) {
      // If the active slide is an overview/scrollable one, bail out entirely.
      const activeSlide = slides[current];
      const isOverviewSlide = activeSlide && (
        activeSlide.querySelector('.overview-pro') ||
        activeSlide.querySelector('[data-scrollable]')
      );
      if (isOverviewSlide) return; // never navigate by wheel on overview slides

      // Also bail if the event target is inside any scrollable container
      if (e.target.closest && e.target.closest('.overview-pro, .op-grid, [data-scrollable]')) {
        return;
      }

      if (wheelLocked) return;
      if (Math.abs(e.deltaY) < 20) return;
      wheelLocked = true;
      if (e.deltaY > 0) next(); else prev();
      setTimeout(function() { wheelLocked = false; }, 550);
    }, { passive: true });

    // ------ Hash-link clicks (TOC navigation) ------
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a[href^="#/"]');
      if (!a) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      const match = href.match(/#\/(\d+)/);
      if (match) show(parseInt(match[1], 10));
    });

    // ------ Touch swipe ------
    let touchX = 0, touchY = 0;
    document.addEventListener('touchstart', function(e) {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next(); else prev();
      }
    }, { passive: true });

    // ------ Hash change listener (browser back/forward) ------
    window.addEventListener('hashchange', function() {
      const m = window.location.hash.match(/#\/(\d+)/);
      if (m) show(parseInt(m[1], 10));
    });

    // ------ Chrome (progress bar + counter + arrows) ------
    function buildChrome() {
      // Progress bar
      const prog = document.createElement('div');
      prog.className = 'deck-progress';
      const fill = document.createElement('div');
      fill.className = 'fill';
      prog.appendChild(fill);
      document.body.appendChild(prog);

      // Counter
      const counter = document.createElement('div');
      counter.className = 'deck-counter';
      counter.innerHTML = '<strong id="dc-cur">1</strong> / <span id="dc-tot">' + slides.length + '</span>';
      document.body.appendChild(counter);

      // Arrow buttons
      const arrows = document.createElement('div');
      arrows.className = 'deck-arrows';
      const btnP = document.createElement('button');
      btnP.id = 'dc-prev';
      btnP.title = 'Previous slide (←)';
      btnP.innerHTML = '←';
      btnP.addEventListener('click', prev);
      const btnN = document.createElement('button');
      btnN.id = 'dc-next';
      btnN.title = 'Next slide (→)';
      btnN.innerHTML = '→';
      btnN.addEventListener('click', next);
      arrows.appendChild(btnP);
      arrows.appendChild(btnN);
      document.body.appendChild(arrows);
    }

    function updateChrome() {
      const fill = document.querySelector('.deck-progress .fill');
      if (fill) fill.style.width = (((current + 1) / slides.length) * 100) + '%';
      const cur = document.getElementById('dc-cur');
      if (cur) cur.textContent = (current + 1);
      const btnP = document.getElementById('dc-prev');
      const btnN = document.getElementById('dc-next');
      if (btnP) btnP.disabled = current === 0;
      if (btnN) btnN.disabled = current === slides.length - 1;
    }

    // Initial render
    show(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

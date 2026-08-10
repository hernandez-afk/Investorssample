function initHeaderNav() {
  const navItems = document.querySelectorAll('.primary-nav__item');
  const langToggle = document.querySelector('.lang-toggle');

  function closeAllNav(except) {
    navItems.forEach((item) => {
      if (item !== except) item.classList.remove('is-open');
    });
  }

  navItems.forEach((item) => {
    const trigger = item.querySelector('.primary-nav__link');
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const isOpen = item.classList.contains('is-open');
      closeAllNav(item);
      item.classList.toggle('is-open', !isOpen);
      if (langToggle) langToggle.classList.remove('is-open');
    });
  });

  if (langToggle) {
    const trigger = langToggle.querySelector('.lang-toggle__btn');
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      langToggle.classList.toggle('is-open');
      closeAllNav(null);
    });

    langToggle.querySelectorAll('.lang-panel__option').forEach((option) => {
      option.addEventListener('click', () => {
        langToggle.querySelectorAll('.lang-panel__option').forEach((opt) => opt.classList.remove('is-active'));
        option.classList.add('is-active');
        langToggle.classList.remove('is-open');
      });
    });
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.primary-nav__item')) closeAllNav(null);
    if (!event.target.closest('.lang-toggle') && langToggle) langToggle.classList.remove('is-open');
  });

  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobileNav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('.mobile-nav__lang').forEach((option) => {
      option.addEventListener('click', () => {
        mobileNav.querySelectorAll('.mobile-nav__lang').forEach((opt) => opt.classList.remove('is-active'));
        option.classList.add('is-active');
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllNav(null);
      if (langToggle) langToggle.classList.remove('is-open');
      if (navToggle && mobileNav && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.mega-menu__link, .mobile-nav__panel a').forEach((link) => {
    if (link.getAttribute('href') === path) link.classList.add('is-current');
  });
}

function initDocPreview() {
  const overlay = document.getElementById('docPreviewOverlay');
  if (!overlay) return;
  const titleEl = overlay.querySelector('.doc-preview-modal__title');
  const dateEl = overlay.querySelector('.doc-preview-modal__date');
  const actionsEl = overlay.querySelector('.doc-preview-modal__actions');

  function openPreview(row) {
    const title = row.querySelector('.doc-row__title');
    const date = row.querySelector('.doc-row__date');
    titleEl.textContent = title ? title.textContent.trim() : 'Document';
    dateEl.textContent = date ? date.textContent.trim() : '';

    actionsEl.innerHTML = '';
    row.querySelectorAll('.doc-row__actions .pill-btn').forEach((pill) => {
      actionsEl.appendChild(pill.cloneNode(true));
    });

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (event) => {
    const previewBtn = event.target.closest('.doc-preview-btn');
    if (previewBtn) {
      const row = previewBtn.closest('.doc-row');
      if (row) openPreview(row);
      return;
    }
    if (event.target === overlay || event.target.closest('.doc-preview-modal__close')) {
      closePreview();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) closePreview();
  });
}

document.addEventListener('partials:loaded', initHeaderNav);
document.addEventListener('partials:loaded', initDocPreview);

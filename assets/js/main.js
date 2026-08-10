document.addEventListener('DOMContentLoaded', () => {
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
});

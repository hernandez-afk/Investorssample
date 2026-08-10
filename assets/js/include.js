async function loadIncludes() {
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  await Promise.all(nodes.map(async (el) => {
    const file = el.getAttribute('data-include');
    try {
      const res = await fetch(file);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error('Failed to load include:', file, err);
    }
  }));
  document.dispatchEvent(new Event('partials:loaded'));
}

loadIncludes();

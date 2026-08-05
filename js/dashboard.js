document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.dash-sidebar .side-link[data-section]');
  const sections = document.querySelectorAll('.dash-section');
  const sidebar = document.querySelector('.dash-sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const toggle = document.querySelector('.sidebar-toggle');
  const profileTrigger = document.querySelector('.profile-trigger');
  const profileMenu = document.querySelector('.profile-menu');

  function getDisplayName(email){
    const prefix = ((email || '').split('@')[0] || 'stackly user')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim();
    return prefix ? prefix.replace(/\b\w/g, c => c.toUpperCase()) : 'Stackly user';
  }

  const storedEmail = localStorage.getItem('stacklyEmail') || 'hello@stackly.app';
  const profileEmails = document.querySelectorAll('.profile-email');
  const avatars = document.querySelectorAll('.avatar');
  const profileNames = document.querySelectorAll('.profile-name');
  profileEmails.forEach(el => el.textContent = storedEmail);
  avatars.forEach(el => el.textContent = storedEmail.charAt(0).toUpperCase() || 'S');
  profileNames.forEach(el => el.textContent = getDisplayName(storedEmail));
  document.querySelectorAll('.user-email').forEach(el => { el.textContent = storedEmail; });

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.section;
      buttons.forEach(item => item.classList.toggle('active', item === button));
      sections.forEach(section => section.classList.toggle('active', section.id === target));
      if (sidebar.classList.contains('is-open')) {
        sidebar.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (toggle && sidebar && backdrop) {
    if (!window.__dashboardSidebarToggle) {
      toggle.addEventListener('click', () => {
        const open = !sidebar.classList.contains('is-open');
        sidebar.classList.toggle('is-open', open);
        backdrop.classList.toggle('is-open', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        backdrop.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
      window.__dashboardSidebarToggle = true;
    }
  }

  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', () => {
      const isOpen = profileMenu.classList.toggle('open');
      profileTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', event => {
      if (!profileMenu.contains(event.target) && profileMenu.classList.contains('open')) {
        profileMenu.classList.remove('open');
        profileTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }
});

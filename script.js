// Light/Dark Theme Toggle
const toggleButton = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

document.body.classList.toggle('dark', prefersDarkScheme.matches);

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.body.classList.toggle('dark', savedTheme === 'dark');
}

// Language Detection (Placeholder)
const userLang = navigator.language || navigator.userLanguage;
console.log('Detected Language:', userLang);

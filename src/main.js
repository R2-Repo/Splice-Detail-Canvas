// Styles load from index.html (<link>) so the app runs without a bundler.

const root = document.querySelector('#app');

if (!root) {
  throw new Error('App root element #app was not found.');
}

const main = document.createElement('main');
main.className = 'bootstrap-shell';

const eyebrow = document.createElement('p');
eyebrow.className = 'bootstrap-shell__eyebrow';
eyebrow.textContent = 'Agentic static frontend framework';

const title = document.createElement('h1');
title.className = 'bootstrap-shell__title';
title.textContent = 'Bootstrap shell';

const text = document.createElement('p');
text.className = 'bootstrap-shell__text';
text.append(
  'This UI is the intentional pre-product shell. Run onboarding (',
  docLink('docs/ONBOARDING.md'),
  ', ',
  docLink('AGENTS.md'),
  '). Replace this shell with your product UI when milestones require it; update Playwright in ',
  docLink('e2e/'),
  ' accordingly.'
);

main.append(eyebrow, title, text);
root.replaceChildren(main);

function docLink(path) {
  const code = document.createElement('code');
  code.textContent = path;
  return code;
}

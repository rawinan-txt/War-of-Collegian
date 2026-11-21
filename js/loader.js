// Load each screen before initializing the existing game scripts.
(async function initializeGame() {
  const screens = ['home', 'faculty', 'team', 'stageSelect', 'battle', 'result'];
  const scripts = ['public/assets/ui/boot.js', 'assets/characters/animations.js', 'public/assets/characters/fx.js', 'public/assets/characters/manifest.js', 'public/assets/ui/zoom.js', 'assets/enemies/enemies.js', 'js/app-6.js'];
  try {
    for (const name of screens) {
      const response = await fetch(`pages/${name}.html`);
      if (!response.ok) throw new Error(`Cannot load pages/${name}.html (${response.status})`);
      document.getElementById(`page-slot-${name}`).outerHTML = await response.text();
    }
    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Cannot load ${src}`));
        document.body.appendChild(script);
      });
    }
  } catch (error) {
    console.error('Game initialization failed:', error);
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:20px;color:white;background:#7f1d1d">Unable to load game files. Run this project with a local web server and check the assets folder.</p>');
  }
})();

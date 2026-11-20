/* Boot splash: shows the logo while the page really loads, then fades out. No artificial delay:
   it leaves as soon as the window "load" event, fonts and the logo are all ready. */
(function () {
  'use strict';
  var el = document.getElementById('boot');
  if (!el) return;
  var done = false;
  function finish() {
    if (done) return; done = true;
    el.classList.add('out');
    var removed = false;
    function rm() { if (removed) return; removed = true; if (el.parentNode) el.parentNode.removeChild(el); }
    el.addEventListener('transitionend', function (e) { if (e.target === el) rm(); });
    setTimeout(rm, 900); // fallback if transitions are disabled
  }
  var logo = el.querySelector('img');
  var logoReady = !logo || (logo.complete && logo.naturalWidth > 0) ? Promise.resolve() : new Promise(function (r) { logo.addEventListener('load', r); logo.addEventListener('error', r); });
  var pageReady = document.readyState === 'complete' ? Promise.resolve() : new Promise(function (r) { window.addEventListener('load', r); });
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready.catch(function () {}) : Promise.resolve();
  Promise.all([logoReady, pageReady, fontsReady]).then(function () {
    // wait one frame so the menu underneath has painted before the splash fades away
    requestAnimationFrame(function () { requestAnimationFrame(finish); });
  });
  if (logo) logo.addEventListener('error', finish);
})();

/* Battlefield zoom (presentation only): wheel / pinch / +- buttons / drag to pan / double click.
   It only scales the canvas element with CSS; the simulation and drawing code never see it. */
(function () {
  'use strict';
  var canvas = document.getElementById('game');
  if (!canvas || !canvas.parentNode || !canvas.parentNode.insertBefore || !document.createElement) return;
  var MAX = 3, STEP = 0.5, z = 1, tx = 0, ty = 0;
  var view = document.createElement('div');
  view.id = 'zoomView'; view.className = 'zoomview';
  canvas.parentNode.insertBefore(view, canvas); view.appendChild(canvas);

  var bar = document.createElement('div'); bar.className = 'zoombar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'ซูมสนามรบ');
  function mk(txt, label, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = txt; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); bar.appendChild(b); return b; }
  var bMinus = mk('−', 'ซูมออก', function () { zoomAt(z - STEP); });
  var label = document.createElement('span'); label.className = 'zoomlvl'; bar.appendChild(label);
  var bPlus = mk('+', 'ซูมเข้า', function () { zoomAt(z + STEP); });
  var bReset = mk('1:1', 'รีเซ็ตมุมมอง', function () { z = 1; apply(); });
  view.appendChild(bar);

  function size() { var r = view.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function clamp() { var s = size(); tx = Math.min(0, Math.max(s.w - s.w * z, tx)); ty = Math.min(0, Math.max(s.h - s.h * z, ty)); }
  function apply() {
    z = Math.min(MAX, Math.max(1, z)); if (z === 1) { tx = 0; ty = 0; } else clamp();
    canvas.style.transform = z === 1 ? '' : 'translate(' + tx + 'px,' + ty + 'px) scale(' + z + ')';
    view.classList.toggle('zoomed', z > 1);
    label.textContent = Math.round(z * 100) + '%';
    bMinus.disabled = z <= 1; bPlus.disabled = z >= MAX; bReset.disabled = z <= 1;
  }
  // zoom keeping the point (cx, cy) in view coordinates fixed
  function zoomAt(nz, cx, cy) {
    var s = size(); if (cx == null) { cx = s.w / 2; cy = s.h / 2; }
    nz = Math.min(MAX, Math.max(1, nz)); var k = nz / z;
    tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; z = nz; apply();
  }
  view.addEventListener('wheel', function (e) {
    e.preventDefault(); var s = size();
    zoomAt(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - s.l, e.clientY - s.t);
  }, { passive: false });
  view.addEventListener('dblclick', function (e) { if (bar.contains(e.target)) return; var s = size(); if (z > 1) { z = 1; apply(); } else zoomAt(2, e.clientX - s.l, e.clientY - s.t); });

  var ptrs = {}, pinch = 0, drag = null;
  function count() { return Object.keys(ptrs).length; }
  view.addEventListener('pointerdown', function (e) {
    if (bar.contains(e.target)) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (view.setPointerCapture) try { view.setPointerCapture(e.pointerId); } catch (x) {}
    if (count() === 2) { var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }); pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); drag = null; }
    else drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
  });
  view.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (count() === 2) {
      var a = Object.keys(ptrs).map(function (k) { return ptrs[k]; }), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), s = size();
      if (pinch > 0) zoomAt(z * d / pinch, (a[0].x + a[1].x) / 2 - s.l, (a[0].y + a[1].y) / 2 - s.t);
      pinch = d;
    } else if (drag && z > 1) { tx = drag.tx + (e.clientX - drag.x); ty = drag.ty + (e.clientY - drag.y); apply(); }
  });
  function up(e) { delete ptrs[e.pointerId]; pinch = 0; var k = Object.keys(ptrs); drag = k.length === 1 ? { x: ptrs[k[0]].x, y: ptrs[k[0]].y, tx: tx, ty: ty } : null; }
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  window.addEventListener('resize', apply);

  // a new battle starts from the full view
  var screen = document.getElementById('battle');
  if (screen && window.MutationObserver) new MutationObserver(function () { if (screen.classList.contains('hidden') && z !== 1) { z = 1; apply(); } }).observe(screen, { attributes: true, attributeFilter: ['class'] });
  apply();
})();

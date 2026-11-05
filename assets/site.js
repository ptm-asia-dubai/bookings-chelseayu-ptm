(function () {
  'use strict';
  var form = document.getElementById('inquiry');

  /* Fade-up on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  if (!form) return;

  /* Event date: no past dates (local today) */
  var date = document.getElementById('f-date');
  var d = new Date();
  date.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  /* Package filtering by Event type */
  var type = document.getElementById('f-type');
  var groups = form.querySelectorAll('.pkg-group');
  var boxes = form.querySelectorAll('input[name="Package"]');
  var pkgErr = document.getElementById('pkg-err');
  var pkgSet = document.getElementById('pkg');

  function isWedding(v) { return v.indexOf('Wedding') !== -1; }

  function visibleBoxes() {
    return Array.prototype.filter.call(boxes, function (b) { return !b.closest('.pkg-group').hidden; });
  }

  // "At least one" for a checkbox group: require every visible box until one is ticked.
  function syncPkgRequired() {
    var vis = visibleBoxes();
    var any = vis.some(function (b) { return b.checked; });
    boxes.forEach(function (b) {
      b.required = !any && vis.indexOf(b) !== -1;
      b.setCustomValidity(b.required ? 'Choose at least one package.' : '');
    });
    if (any) { pkgErr.textContent = ''; pkgSet.removeAttribute('aria-invalid'); }
  }

  function filterPackages() {
    var v = type.value;
    var mode = !v ? 'all' : (isWedding(v) ? 'V' : 'T');
    groups.forEach(function (g) {
      var show = mode === 'all' || g.dataset.kind === mode;
      g.hidden = !show;
      if (!show) g.querySelectorAll('input').forEach(function (b) { b.checked = false; });
    });
    syncPkgRequired();
  }

  type.addEventListener('change', filterPackages);
  boxes.forEach(function (b) { b.addEventListener('change', syncPkgRequired); });
  filterPackages();

  /* Package cards: pre-tick and set Event type */
  document.querySelectorAll('[data-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = document.getElementById(btn.dataset.pick);
      if (!box) return;
      var wedding = box.closest('.pkg-group').dataset.kind === 'V';
      if (wedding) {
        if (!isWedding(type.value)) type.value = 'Wedding — ceremony and reception';
      } else if (isWedding(type.value)) {
        // A T package can't sit under a wedding event type; clear it so the box stays visible.
        type.value = '';
      }
      filterPackages();
      box.checked = true;
      syncPkgRequired();
      setTimeout(function () { box.focus({ preventScroll: true }); }, 450);
    });
  });

  /* Inline errors + live summary on native validation */
  var summary = document.getElementById('form-summary');
  var pending = null;
  var invalidCount = 0;
  var pkgCounted = false;

  function errFor(el) {
    if (el.name === 'Package') return pkgErr;
    return document.getElementById(el.id + '-err');
  }

  function message(el) {
    var v = el.validity;
    if (el.name === 'Package') return 'Choose at least one package.';
    var label = (form.querySelector('label[for="' + el.id + '"]') || {}).textContent || 'This field';
    label = label.replace('*', '').trim();
    if (v.valueMissing) return el.tagName === 'SELECT' ? 'Choose an option for ' + label + '.' : label + ' is required.';
    if (v.typeMismatch && el.type === 'email') return 'Enter a valid email address, like name@example.com.';
    if (v.rangeUnderflow && el.type === 'date') return 'Choose today or a later date.';
    return el.validationMessage;
  }

  form.addEventListener('invalid', function (e) {
    var el = e.target;
    var err = errFor(el);
    if (el.name === 'Package') {
      if (!pkgCounted) { invalidCount++; pkgCounted = true; }
      pkgSet.setAttribute('aria-invalid', 'true');
    } else {
      el.setAttribute('aria-invalid', 'true');
      invalidCount++;
    }
    if (err) err.textContent = message(el);
    if (!pending) {
      pending = setTimeout(function () {
        summary.textContent = invalidCount === 1
          ? 'One field needs attention before you can send.'
          : invalidCount + ' fields need attention before you can send.';
        invalidCount = 0;
        pkgCounted = false;
        pending = null;
      }, 0);
    }
  }, true);

  function clearIfValid(e) {
    var el = e.target;
    if (!el.name || el.name === 'Package') return;
    if (el.getAttribute('aria-invalid') === 'true' && el.checkValidity()) {
      el.removeAttribute('aria-invalid');
      var err = errFor(el);
      if (err) err.textContent = '';
      if (!form.querySelector('[aria-invalid="true"]')) summary.textContent = '';
    }
  }
  form.addEventListener('input', clearIfValid);
  form.addEventListener('change', clearIfValid);

  form.addEventListener('submit', function () {
    pkgSet.removeAttribute('aria-invalid');
    summary.textContent = '';
  });
})();

/*
 * Szaki – sütihozzájárulás + Google Analytics 4 (Google-címke) betöltése.
 *
 * Működés (EU / GDPR + ePrivacy):
 *  - A Google-címke (GTM-WP34835N) CSAK akkor töltődik be, ha a látogató az
 *    „Elfogadom” gombra kattint. Elutasításnál / döntés előtt semmilyen Google-
 *    kód nem fut, süti nem kerül a gépre.
 *  - A Cloudflare Web Analytics ettől független: süti nélkül, összesítve mér,
 *    ezért nem kell hozzá hozzájárulás (lásd Adatvédelmi tájékoztató 10. pont).
 *  - A döntést 12 hónapig megjegyezzük (localStorage), utána újra kérdezünk.
 *  - A döntés bármikor módosítható: a láblécben „Sütibeállítások”
 *    (bármely elem, amin data-consent-open attribútum van), vagy
 *    window.szakiConsent.open().
 *  - Letöltés-mérés: az áruházi linkekre / a goToStore() gombra kattintás
 *    „app_download_click” eseményt küld (csak elfogadás után ér el a Google-hoz).
 */
(function () {
  'use strict';
  var TAG_ID = 'GTM-WP34835N';
  var KEY = 'szaki-consent';
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  var TEXT = {
    hu: {
      title: 'Sütik a weboldalon',
      body: 'A látogatottságot alapból süti nélkül, névtelenül mérjük. Ha elfogadod, a Google Analytics sütiket is használunk, hogy lássuk, melyik oldal és hirdetés működik. Bármikor módosíthatod a láblécben.',
      accept: 'Elfogadom',
      reject: 'Elutasítom',
      more: 'Adatvédelmi tájékoztató',
      settings: 'Sütibeállítások'
    },
    en: {
      title: 'Cookies on this website',
      body: 'By default we measure visits anonymously, without cookies. If you accept, we also use Google Analytics cookies to see which pages and ads work. You can change this any time in the footer.',
      accept: 'Accept',
      reject: 'Decline',
      more: 'Privacy Policy',
      settings: 'Cookie settings'
    },
    de: {
      title: 'Cookies auf dieser Website',
      body: 'Standardmäßig messen wir Besuche anonym und ohne Cookies. Wenn du zustimmst, verwenden wir zusätzlich Cookies von Google Analytics, um zu sehen, welche Seiten und Anzeigen funktionieren. Du kannst dies jederzeit in der Fußzeile ändern.',
      accept: 'Akzeptieren',
      reject: 'Ablehnen',
      more: 'Datenschutzerklärung',
      settings: 'Cookie-Einstellungen'
    }
  };

  function lang() {
    var l = '';
    try { l = localStorage.getItem('szaki-lang') || ''; } catch (e) {}
    if (!l) l = (document.documentElement.getAttribute('lang') || 'hu').slice(0, 2);
    return TEXT[l] ? l : 'hu';
  }
  function t(k) { return TEXT[lang()][k]; }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || typeof v.analytics !== 'boolean' || !v.ts) return null;
      if (Date.now() - v.ts > MAX_AGE_MS) return null;
      return v;
    } catch (e) { return null; }
  }
  function write(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, analytics: analytics, ts: Date.now() })); } catch (e) {}
  }

  // A gtag-sor mindig létezik (az események így biztonságosan sorba állhatnak),
  // de a Google-kód csak elfogadás után töltődik be, addig semmi nem megy ki.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var loaded = false;
  function loadGoogle() {
    if (loaded) return;
    loaded = true;
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + TAG_ID;
    document.head.appendChild(s);
  }

  // Eseménymérés (pl. letöltés gomb). Elfogadás nélkül nem hív semmit.
  window.szakiTrack = function (name, params) {
    var c = read();
    if (!c || !c.analytics) return;
    loadGoogle();
    try { window.gtag('event', name, params || {}); } catch (e) {}
  };

  // Áruházi linkek kattintása (a jelvények közvetlen <a> linkek).
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var store = /apps\.apple\.com|\/go\/ios/.test(h) ? 'ios' : /play\.google\.com|\/go\/android/.test(h) ? 'android' : '';
    if (store) window.szakiTrack('app_download_click', { store: store, link_location: location.pathname });
  }, true);

  // ---- Sáv ----
  var bar = null;
  function css() {
    if (document.getElementById('szaki-consent-css')) return;
    var st = document.createElement('style');
    st.id = 'szaki-consent-css';
    st.textContent =
      '#szaki-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;' +
      'background:#14171f;color:#f4f6fb;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:18px 18px 16px;' +
      'font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#szaki-consent h2{font-size:15px;margin:0 0 6px;font-weight:600;color:#fff}' +
      '#szaki-consent p{margin:0 0 12px;color:#c9cedb}' +
      '#szaki-consent a{color:#9db6ff;text-decoration:underline}' +
      '#szaki-consent .sc-row{display:flex;gap:10px;flex-wrap:wrap}' +
      '#szaki-consent button{flex:1 1 140px;min-height:42px;border-radius:10px;font:600 14px/1 inherit;cursor:pointer;border:1px solid #3a4152}' +
      '#szaki-consent .sc-accept{background:#2457e0;border-color:#2457e0;color:#fff}' +
      '#szaki-consent .sc-reject{background:#232835;color:#f4f6fb}' +
      '#szaki-consent button:focus-visible{outline:2px solid #9db6ff;outline-offset:2px}';
    document.head.appendChild(st);
  }
  function privacyHref() { return '/adatvedelem'; }
  function close() { if (bar) { bar.remove(); bar = null; } }
  function open() {
    css();
    close();
    bar = document.createElement('div');
    bar.id = 'szaki-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', t('title'));
    bar.innerHTML =
      '<h2></h2><p><span class="sc-body"></span> <a class="sc-more"></a></p>' +
      '<div class="sc-row"><button type="button" class="sc-reject"></button><button type="button" class="sc-accept"></button></div>';
    bar.querySelector('h2').textContent = t('title');
    bar.querySelector('.sc-body').textContent = t('body');
    var more = bar.querySelector('.sc-more');
    more.textContent = t('more');
    more.href = privacyHref();
    bar.querySelector('.sc-accept').textContent = t('accept');
    bar.querySelector('.sc-reject').textContent = t('reject');
    bar.querySelector('.sc-accept').onclick = function () { write(true); close(); loadGoogle(); };
    bar.querySelector('.sc-reject').onclick = function () {
      var was = read();
      write(false);
      close();
      // Ha korábban elfogadta és most visszavonja: a Google-kód már fut,
      // ezért újratöltjük az oldalt, hogy a továbbiakban ne mérjen.
      if (was && was.analytics && loaded) location.reload();
    };
    (document.body || document.documentElement).appendChild(bar);
  }
  function labelLinks() {
    var els = document.querySelectorAll('[data-consent-open]');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = t('settings');
      if (!els[i].__sc) { els[i].__sc = true; els[i].addEventListener('click', function (e) { e.preventDefault(); open(); }); }
    }
  }

  window.szakiConsent = { open: open, relabel: labelLinks };

  // Nyelvváltáskor (index.html setLanguage) a sáv és a lábléc-link is váltson.
  var origSet = window.setLanguage;
  if (typeof origSet === 'function') {
    window.setLanguage = function () {
      var r = origSet.apply(this, arguments);
      labelLinks();
      if (bar) open();
      return r;
    };
  }

  function start() {
    labelLinks();
    var c = read();
    if (c && c.analytics) loadGoogle();
    else if (!c) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

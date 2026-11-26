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
    hu: { pre: 'Ez az oldal sütiket használ. Részletek az ', link: 'adatvédelmi tájékoztatóban', post: '.', accept: 'Elfogadom', reject: 'Elutasítom', settings: 'Sütibeállítások', aria: 'Sütik' },
    en: { pre: 'This website uses cookies. Details in our ', link: 'Privacy Policy', post: '.', accept: 'Accept', reject: 'Decline', settings: 'Cookie settings', aria: 'Cookies' },
    de: { pre: 'Diese Website verwendet Cookies. Details in der ', link: 'Datenschutzerklärung', post: '.', accept: 'Akzeptieren', reject: 'Ablehnen', settings: 'Cookie-Einstellungen', aria: 'Cookies' }
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
      '#szaki-consent{position:fixed;z-index:2147483000;left:12px;right:12px;bottom:12px;' +
      'display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 14px 14px 18px;' +
      'background:rgba(13,19,29,.86);-webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);' +
      'border:1px solid rgba(178,213,229,.16);border-radius:18px;color:#F4F8FB;' +
      'box-shadow:0 18px 48px -12px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.2);' +
      'font:500 14px/1.45 var(--font-body,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);' +
      'animation:sc-in .42s cubic-bezier(.23,1,.32,1) both}' +
      '@media (min-width:640px){#szaki-consent{left:20px;right:auto;bottom:20px;max-width:440px}}' +
      '@keyframes sc-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
      '@media (prefers-reduced-motion:reduce){#szaki-consent{animation:none}}' +
      '#szaki-consent .sc-ico{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;' +
      'background:rgba(79,168,255,.14);color:#9ECFE8}' +
      '#szaki-consent .sc-txt{flex:1 1 220px;margin:0;color:#AEBAC7}' +
      '#szaki-consent .sc-txt a{color:#CDE6F2;text-decoration:underline;text-underline-offset:2px;text-decoration-color:rgba(205,230,242,.45)}' +
      '#szaki-consent .sc-row{display:flex;gap:8px;flex:1 1 100%;justify-content:flex-end}' +
      '#szaki-consent button{flex:1 1 0;max-width:200px;min-height:40px;padding:0 18px;border-radius:999px;cursor:pointer;' +
      'font:700 14px/1 inherit;letter-spacing:.01em;transition:transform .14s cubic-bezier(.23,1,.32,1),filter .14s,background .14s}' +
      '#szaki-consent button:active{transform:scale(.97)}' +
      '#szaki-consent .sc-accept{border:0;color:#061018;background:linear-gradient(135deg,#CDE6F2 0%,#9ECFE8 48%,#63B4FA 100%);' +
      'box-shadow:0 8px 22px -10px rgba(79,168,255,.6),inset 0 1px 0 rgba(255,255,255,.35)}' +
      '#szaki-consent .sc-reject{background:rgba(255,255,255,.04);color:#F4F8FB;border:1px solid rgba(255,255,255,.14)}' +
      '@media (hover:hover){#szaki-consent .sc-accept:hover{filter:brightness(1.06)}#szaki-consent .sc-reject:hover{background:rgba(255,255,255,.09)}}' +
      '#szaki-consent button:focus-visible,#szaki-consent a:focus-visible{outline:2px solid #4FA8FF;outline-offset:2px}';
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
    bar.setAttribute('aria-label', t('aria'));
    bar.innerHTML =
      '<span class="sc-ico" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5z"/><circle cx="8.5" cy="10.5" r="1"/><circle cx="13" cy="15.5" r="1"/><circle cx="8" cy="15" r=".6"/></svg></span>' +
      '<p class="sc-txt"><span class="sc-pre"></span><a class="sc-more"></a><span class="sc-post"></span></p>' +
      '<div class="sc-row"><button type="button" class="sc-reject"></button><button type="button" class="sc-accept"></button></div>';
    bar.querySelector('.sc-pre').textContent = t('pre');
    bar.querySelector('.sc-post').textContent = t('post');
    var more = bar.querySelector('.sc-more');
    more.textContent = t('link');
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

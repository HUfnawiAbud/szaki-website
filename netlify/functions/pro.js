// ÚJ (2026-09-27, a Szaki app "Szakember profil megosztása" + "Deep linkes
// profil megosztás" kérésére): ugyanaz a minta, mint a post.js-nél (lásd
// ottani fejléc-kommentet). A Szaki mobilapp (src/utils/shareProfessional.ts)
// egy https://szakiapp.com/pro/{id} linket oszt meg. Ha a megnyitó eszközön
// telepítve van az app, az iOS Universal Link / Android App Link egyenesen
// az appba viszi (lásd ../../.well-known/apple-app-site-association "/pro/*"
// útvonalát); ha nincs, ez a Function egy márkázott előnézeti oldalt ad
// (Open Graph meta-adatokkal a WhatsApp/Messenger link-előnézethez),
// "Megnyitás a Szaki appban" és App Store gombbal.
//
// Az adatokat a Szaki Firebase projekt `getProfessionalPublicPreview` Cloud
// Function-je adja – KIZÁRÓLAG nyilvánosan megosztható mezőket (név,
// szakma, város, értékelés, jelvények, képek), soha telefonszámot, e-mailt
// vagy címet.

const CLOUD_FUNCTION_BASE = "https://us-central1-szaki-4d32e.cloudfunctions.net";
const APP_STORE_URL = "https://apps.apple.com/app/id6811597956";
const SITE_BASE = "https://szakiapp.com";
const FALLBACK_OG_IMAGE = `${SITE_BASE}/og-image.jpg`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function renderPage({ title, description, ogImage, canonicalUrl, bodyHtml }) {
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Szaki">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:locale" content="hu_HU">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">
<link rel="apple-touch-icon" href="${SITE_BASE}/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="${SITE_BASE}/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="${SITE_BASE}/favicon-16.png">
<meta name="theme-color" content="#0A0E14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800&family=Inter:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --candy: #B2D5E5;
    --candy-mid: #8FC3DA;
    --bg: #0A0E14;
    --bg-soft: #0D131A;
    --surface: #121922;
    --panel-deep: #12222F;
    --line: rgba(255,255,255,0.08);
    --text: #F2F6F9;
    --text-soft: #A7B3BF;
    --text-faint: #6E7A87;
    --font-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-body: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: radial-gradient(circle at 50% -10%, var(--panel-deep), var(--bg) 55%);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 30px 80px -24px rgba(0,0,0,0.6);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 18px 20px 0;
  }
  .brand img { width: 28px; height: 28px; border-radius: 8px; }
  .brand span { font-family: var(--font-display); font-weight: 800; font-size: 16px; letter-spacing: -0.01em; }
  .media {
    width: 100%;
    aspect-ratio: 1.2 / 1;
    object-fit: cover;
    background: var(--bg-soft);
    display: block;
    margin-top: 14px;
  }
  .video-badge {
    position: relative;
  }
  .video-badge::after {
    content: "▶";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(10,14,20,0.55);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .body { padding: 18px 20px 22px; }
  .author { font-family: var(--font-display); font-weight: 700; font-size: 15px; margin: 0 0 6px; }
  .text { font-size: 14px; line-height: 1.5; color: var(--text-soft); margin: 0 0 20px; white-space: pre-wrap; }
  .actions { display: flex; flex-direction: column; gap: 10px; }
  .btn {
    display: block;
    text-align: center;
    padding: 13px 18px;
    border-radius: 14px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 14.5px;
    text-decoration: none;
    border: 1px solid transparent;
  }
  .btn-primary { background: var(--candy); color: var(--bg); }
  .btn-secondary { background: transparent; color: var(--text); border-color: var(--line); }
  .store-note { text-align: center; font-size: 12px; color: var(--text-faint); margin-top: 4px; }
  .badge { display:inline-block; font-size:12px; padding:4px 8px; border-radius:999px; background: rgba(178,213,229,0.14); color: var(--candy); }
  .notfound { text-align: center; padding: 40px 20px; }
  .notfound h1 { font-family: var(--font-display); font-size: 20px; margin: 12px 0 6px; }
  .notfound p { color: var(--text-soft); font-size: 14px; margin: 0 0 20px; }
</style>
</head>
<body>
  <div class="card">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function notFoundBody() {
  return `<div class="notfound">
    <img src="${SITE_BASE}/favicon.png" alt="Szaki" width="40" height="40" style="border-radius:10px" />
    <h1>Ez a profil már nem érhető el</h1>
    <p>Lehet, hogy a fiókot törölték, vagy a link hibás.</p>
    <a class="btn btn-primary" href="${SITE_BASE}/">Ugrás a Szaki főoldalra</a>
  </div>`;
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(Math.max(0, Math.min(5, full))) + "☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, full))));
}

exports.handler = async (event) => {
  const segments = event.path.split("/").filter(Boolean);
  const proId = segments[segments.length - 1];
  if (!proId || proId === "pro") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: renderPage({ title: "Szaki", description: "Helyi, ellenőrzött szakemberek egy helyen.", ogImage: FALLBACK_OG_IMAGE, canonicalUrl: `${SITE_BASE}/`, bodyHtml: notFoundBody() }),
    };
  }

  const canonicalUrl = `${SITE_BASE}/pro/${encodeURIComponent(proId)}`;
  const appLink = `szaki://pro/${encodeURIComponent(proId)}`;

  let pro = null;
  try {
    const response = await fetch(`${CLOUD_FUNCTION_BASE}/getProfessionalPublicPreview?id=${encodeURIComponent(proId)}`);
    if (response.ok) pro = await response.json();
  } catch (err) {
    console.error("pro.js: getProfessionalPublicPreview lekérdezés elhasalt", err);
  }

  if (!pro) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: renderPage({ title: "Profil nem található – Szaki", description: "Ez a profil már nem érhető el.", ogImage: FALLBACK_OG_IMAGE, canonicalUrl, bodyHtml: notFoundBody() }),
    };
  }

  const place = pro.city ? ` · ${pro.city}` : "";
  const title = `${pro.name} – ${pro.category} – Szaki`;
  const ratingText = pro.reviewCount > 0 ? `${pro.rating.toFixed(1)} ★ (${pro.reviewCount} értékelés)` : "Még nincs értékelése";
  const description = truncate(`${pro.category}${place}. ${ratingText}. ${pro.headline || "Nézd meg a profilját a Szaki alkalmazásban."}`, 190);
  const ogImage = pro.coverUrl || pro.avatarUrl || FALLBACK_OG_IMAGE;
  const badges = [
    pro.identityVerified ? '<span class="badge">✔ Igazolt személyazonosság</span>' : "",
    pro.credentialVerified ? '<span class="badge">✔ Ellenőrzött szakember</span>' : "",
  ].join("");

  const bodyHtml = `
    <div class="brand">
      <img src="${SITE_BASE}/favicon.png" alt="" />
      <span>Szaki</span>
    </div>
    ${pro.coverUrl ? `<img class="media" src="${escapeHtml(pro.coverUrl)}" alt="" />` : ""}
    <div class="body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        ${pro.avatarUrl ? `<img src="${escapeHtml(pro.avatarUrl)}" alt="" width="56" height="56" style="border-radius:50%;object-fit:cover;border:2px solid var(--line);" />` : ""}
        <div>
          <p class="author" style="margin:0;">${escapeHtml(pro.name)}</p>
          <p style="margin:2px 0 0;color:var(--text-soft);font-size:13px;">${escapeHtml(pro.category)}${escapeHtml(place)}</p>
        </div>
      </div>
      <p style="margin:0 0 8px;font-size:14px;"><span style="color:#F5C451;letter-spacing:1px;">${stars(pro.rating)}</span> <span style="color:var(--text-soft);">${escapeHtml(ratingText)}</span></p>
      ${badges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;">${badges}</div>` : ""}
      ${pro.headline ? `<p class="text">${escapeHtml(truncate(pro.headline, 240))}</p>` : ""}
      <div class="actions">
        <a class="btn btn-primary" href="${escapeHtml(appLink)}">Megnyitás a Szaki appban</a>
        <a class="btn btn-secondary" href="${escapeHtml(APP_STORE_URL)}">Letöltés az App Store-ból</a>
      </div>
      <p class="store-note">Google Play-en hamarosan</p>
    </div>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: renderPage({ title, description, ogImage, canonicalUrl, bodyHtml }),
  };
};

// reviews.js — App Store értékelések átjárója.
//
// MIÉRT KELL EGYÁLTALÁN SZERVER OLDAL:
// Az Apple nyilvános értékelés-hírcsatornája (itunes.apple.com RSS) NEM küld
// CORS-fejlécet, ezért a böngészőből közvetlenül nem lehet lekérni — a
// böngésző eldobná a választ. Ez a függvény szerver oldalon kéri le, és
// saját, egyszerűsített JSON-t ad vissza a weboldalnak.
//
// MIT NEM CSINÁL: nem talál ki értékeléseket. Ha az Apple nem ad vissza
// egyetlen bejegyzést sem, akkor ez is üres listát ad, és az oldalon a
// meglévő, őszinte "még nincs visszajelzés" állapot marad.
//
// FONTOS, 2026-10-17-i MÉRT állapot: a magyar boltban már van 4 értékelés,
// 5,0 átlaggal (lookup API: userRatingCount=4, averageUserRating=5), DE az
// RSS mind a 7 régióban ÜRES marad. Ennek nem hiba az oka: az Apple RSS-e
// csak a SZÖVEGES véleményeket listázza, a csillag-értékelés szöveg nélkül
// nem kerül bele. Ezért a függvény kétfélét ad vissza:
//   - reviews[]: szöveges vélemények, ha vannak (ma nincs),
//   - summary:   az összesített csillagszám és darabszám, ami VAN.
// Így az oldal valódi adatot tud mutatni most is, és abban a pillanatban
// kiírja a szöveges véleményeket is, amint az Apple publikálja őket.
//
// Google Play: ott nincs hivatalos, kulcs nélküli nyilvános értékelés-API,
// ezért a Play-értékeléseket SZÁNDÉKOSAN nem próbáljuk meg "lekaparni" —
// az törékeny lenne és a Play feltételeibe is ütközhet.

const APP_ID = "6811597956";

// Sorrend: a magyar bolt az elsődleges (a termék magyar piacra készül),
// utána a nagyobb boltok, ahol szintén lehet értékelés.
const REGIONS = ["hu", "us", "gb", "de", "at", "sk", "ro"];

const FEED = (cc) =>
  `https://itunes.apple.com/${cc}/rss/customerreviews/id=${APP_ID}/sortBy=mostRecent/json`;

// Az összesített értékelés (átlag + darabszám) NEM az RSS-ben van, hanem a
// lookup végponton. Ez akkor is ad számot, ha egyetlen vélemény sem szöveges.
const LOOKUP = (cc) =>
  `https://itunes.apple.com/lookup?id=${APP_ID}&country=${cc}`;

/** Végigkérdezi a boltokat, és a legtöbb értékelést tartalmazót adja vissza. */
async function fetchSummary() {
  let best = null;
  for (const cc of REGIONS) {
    try {
      const res = await fetch(LOOKUP(cc), {
        headers: { "User-Agent": "szakiapp.com reviews proxy" },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const app = (json && json.results && json.results[0]) || null;
      if (!app) continue;
      const count = parseInt(app.userRatingCount, 10) || 0;
      const rating = parseFloat(app.averageUserRating) || 0;
      if (count > 0 && (!best || count > best.count)) {
        best = { rating: Math.round(rating * 10) / 10, count, region: cc };
      }
    } catch (err) { /* egy bolt kiesése nem hiba, megyünk tovább */ }
  }
  return best;
}

function parseFeed(json, cc) {
  const feed = (json && json.feed) || {};
  let entries = feed.entry;
  if (!entries) return [];
  if (!Array.isArray(entries)) entries = [entries];

  return entries
    .map((e) => {
      // Az első bejegyzés néha maga az app (nem értékelés) — azt kiszűrjük:
      // valódi értékelésnél van im:rating és content.
      const rating = parseInt((e["im:rating"] || {}).label, 10);
      const body = ((e.content || {}).label || "").trim();
      const title = ((e.title || {}).label || "").trim();
      const author = (((e.author || {}).name || {}).label || "").trim();
      if (!rating || !body) return null;
      return {
        rating: Math.max(1, Math.min(5, rating)),
        title,
        body,
        author,
        version: ((e["im:version"] || {}).label || "").trim(),
        region: cc,
      };
    })
    .filter(Boolean);
}

exports.handler = async function () {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    // 1 óra böngésző-/CDN-gyorsítótár: az értékelések nem percenként
    // változnak, viszont így nem terheljük feleslegesen az Apple-t.
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
    "Access-Control-Allow-Origin": "*",
  };

  // Az összesítés akkor is kell, ha később találunk szöveges véleményt:
  // a csillagátlag és a darabszám attól még érdekes a látogatónak.
  const summary = await fetchSummary();

  const tried = [];
  for (const cc of REGIONS) {
    try {
      const res = await fetch(FEED(cc), {
        headers: { "User-Agent": "szakiapp.com reviews proxy" },
      });
      tried.push(cc + ":" + res.status);
      if (!res.ok) continue;
      const json = await res.json();
      const reviews = parseFeed(json, cc);
      if (reviews.length) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, source: "appstore", region: cc, reviews, summary }),
        };
      }
    } catch (err) {
      tried.push(cc + ":hiba");
    }
  }

  // Nincs egyetlen publikált értékelés sem. Ez NEM hiba — az oldal ilyenkor
  // a saját üres állapotát mutatja.
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, source: "appstore", reviews: [], summary, tried }),
  };
};

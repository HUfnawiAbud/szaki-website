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
// FONTOS, 2026-10-14-i állapot: az app ekkor MINDKÉT áruházban kint van, de
// az Apple RSS-e egyik régióban (hu/us/gb/de) sem ad vissza bejegyzést, és a
// lookup API is 0 értékelést jelez. Az Apple hírcsatornája ismerten késik
// (akár napokkal) az első értékelések után, illetve régiónként külön épül.
// Ezért a függvény TÖBB régiót is végigpróbál, és az elsőt veszi, amiben van
// tartalom — így abban a pillanatban működni fog, amint az Apple publikálja
// őket, kódmódosítás nélkül.
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
          body: JSON.stringify({ ok: true, source: "appstore", region: cc, reviews }),
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
    body: JSON.stringify({ ok: true, source: "appstore", reviews: [], tried }),
  };
};

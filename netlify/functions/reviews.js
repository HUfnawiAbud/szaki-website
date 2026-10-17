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
// GOOGLE PLAY. Hivatalos, kulcs nélküli értékelés-API ott NINCS: a Play
// Developer API szolgáltatásfiókot és Play Console-jogosultságot kér. Amit
// kulcs nélkül, tisztességesen el lehet érni, az a bolti oldal SAJÁT,
// nyilvánosan közzétett schema.org strukturált adata (ld+json), amiben a
// Google maga teszi ki az átlagot és a darabszámot a keresőknek. CSAK ezt
// az összesítést olvassuk ki, a vélemények listáját nem kaparjuk le.
//
// Ez törékenyebb, mint egy API: ha a Google átalakítja az oldalt, a
// kiolvasás elromolhat. Ezért minden hiba NÉMA — ilyenkor egyszerűen nincs
// Play-adat, és az oldal csak az App Store számát mutatja. Semmit nem
// találunk ki, és a hiba nem dönti el a többi adatot sem.
//
// 2026-10-17-i MÉRT állapot: a Play-listában nincs aggregateRating, vagyis
// ott még nulla értékelés van. A kiolvasó ettől függetlenül működik
// (ellenőrizve egy értékelésekkel rendelkező appon), tehát amint az első
// Play-értékelés megérkezik, magától megjelenik az oldalon.

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

const PLAY_ID = "com.szakiapp.szaki";
const PLAY_URL =
  `https://play.google.com/store/apps/details?id=${PLAY_ID}&hl=hu&gl=HU`;

/**
 * A Play-bolt oldalának strukturált adatából (ld+json) olvassa ki az
 * összesített értékelést. null, ha nincs értékelés vagy bármi elromlik.
 */
async function fetchPlaySummary() {
  try {
    const res = await fetch(PLAY_URL, {
      headers: {
        // A Play a böngésző-azonosító nélküli kéréseknek csökkentett
        // oldalt ad, amiben nincs benne a strukturált adat.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        "Accept-Language": "hu,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const blocks = html.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    );
    if (!blocks) return null;

    for (const raw of blocks) {
      const body = raw.replace(/^[^>]*>/, "").replace(/<\/script>$/, "");
      let data;
      try { data = JSON.parse(body); } catch (e) { continue; }
      const ar = data && data.aggregateRating;
      if (!ar) continue;
      const count = parseInt(ar.ratingCount, 10) || 0;
      const rating = parseFloat(ar.ratingValue) || 0;
      if (count > 0) {
        return { rating: Math.round(rating * 10) / 10, count };
      }
    }
    return null;
  } catch (err) {
    return null;   // néma hiba: ilyenkor egyszerűen nincs Play-adat
  }
}

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
  // A két bolt lekérdezése független, ezért párhuzamosan fut — és a Play
  // esetleges hibája nem akaszthatja meg az App Store-adatot.
  const [summary, play] = await Promise.all([fetchSummary(), fetchPlaySummary()]);

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
          body: JSON.stringify({ ok: true, source: "appstore", region: cc, reviews, summary, play }),
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
    body: JSON.stringify({ ok: true, source: "appstore", reviews: [], summary, play, tried }),
  };
};

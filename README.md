# Szaki weboldal — README

Ez a mappa a Szaki bemutató weboldalát tartalmazza. A weboldal egyetlen
önálló HTML fájl (`index.html`), külön build-lépés vagy szerver nélkül
működik — bármilyen statikus tárhelyre feltölthető (pl. Netlify, Vercel,
GitHub Pages, vagy a saját domain mögötti egyszerű tárhely).

**Fontos, kapcsolódó mappa:** `../szaki-functions/` (a `website/` mappa
mellett, a projekt gyökerében) — ez tartalmazza azt a Cloud Function-t,
ami a weboldal keresőjét ténylegesen összeköti a valódi regisztrált
Szakemberekkel. Lásd a 3. pontot és a `szaki-functions/OLVASD_EL.md`
fájlt.

## 1. Hogyan indítom el / nézem meg

Nincs build-folyamat. Két lehetőség:

- **Helyben:** nyisd meg az `index.html` fájlt közvetlenül a böngészőben
  (dupla kattintás, vagy `open index.html` / `start index.html`).
- **Élesben:** töltsd fel a mappa tartalmát (`index.html`, `robots.txt`,
  `sitemap.xml`) a végleges tárhelyre, majd állítsd be rajta a domaint
  (lásd 10. pont).

## 2. Az oldal felépítése: főoldal + két önálló "nézet"

A weboldal szerkezete két részből áll:

**A) Főoldal** (egyetlen hosszú, görgethető kezdőlap), felül navigációval,
amely az alábbi szekciókhoz görget (horgony/anchor linkek):

| Nav felirat | Szekció `id` | Mire keress rá a fájlban |
|---|---|---|
| — (hero) | `hero` | `Találd meg a` |
| Szakmák | `kinalat` | `Kínálat` |
| — | `ranglista` | `id="ranglista"` |
| Hogyan működik | `ilyen-egyszeru` | `Ilyen egyszerű` |
| Vélemények | `velemenyek` | `Amit mások mondanak` |
| — | `arak` | `id="arak"` |
| — | `letoltes` | `Töltsd le a Szakit` |
| Segítség | `segitseg` | `Kérdésed van` |

**B) Két önálló "nézet"**, amelyek NEM a főoldal részei — kattintásra
teljesen lecserélik a látható tartalmat (ugyanaz a mechanizmus, mint az
ÁSZF/Adatvédelem esetében, lásd lent):

| Nav felirat | Nézet `id` | Mire keress rá a fájlban |
|---|---|---|
| Keresés | `view-kereses` | `VIEW: KERESÉS` |
| Funkciók | `view-funkciok` | `VIEW: FUNKCIÓK` |

Ez a szétválasztás szándékos, kifejezett kérésre történt: korábban a
Keresés-demó és a 4 funkció (Térkép/Ranglista/Chat/Naptár) is a főoldalon,
egymás alatt görgetve szerepelt — ez túl zsúfolttá tette a főoldalt. Most
a főoldal csak a legfontosabb, "átfutható" tartalmat mutatja (mire jó az
app, hány szakma van rajta, a Ranglista mint kiemelt funkció, 3 lépéses
működés, vélemények, árak, letöltés), a Keresés-demó és a részletes
Térkép/Chat/Naptár-bemutató pedig egy-egy kattintásra elérhető, önálló
"aloldal".

A nézetváltás JS-mechanizmusa (`showView(name)` / `goToAnchor(id)`):
- `showView('kereses')` és `showView('funkciok')` — teljesen lecseréli a
  látható tartalmat egy önálló nézetre (ugyanígy működik `showView('aszf')`
  és `showView('adatvedelem')` is).
- `goToAnchor(id)` — ha épp egy önálló nézet aktív, először visszavált a
  főoldalra, utána görget a megadott szekcióhoz.
- Mindkét önálló nézet tetején van egy „← Vissza a főoldalra” gomb is,
  a jogi nézetekhez hasonlóan.

Az ÁSZF és az Adatvédelmi tájékoztató továbbra is **kizárólag** a lábléc
(footer) linkjeiről érhető el — szándékosan nincs rájuk mutató link sehol
máshol a szövegben.

Egy szöveg megváltoztatásához nyisd meg az `index.html` fájlt egy
szövegszerkesztőben, keress rá (Ctrl+F / Cmd+F) a fenti "mire keress rá"
oszlop kifejezésére, és írd át a `<...>` jelek közötti részt — magukat a
HTML-tageket (pl. `<h2>`, `<p>`) hagyd érintetlenül.

**Fontos:** az ÁSZF és az Adatvédelmi tájékoztató a jelenlegi, hatályos
szöveget tartalmazza, és nem tartalmazza képviselő nevét — csak a
"Hunem Kft." céget. Ha ezeket módosítod, egyeztesd jogilag is, és
frissítsd a `<div class="meta">Hatályos: ...</div>` dátumot mindkét
dokumentumnál.

## 3. "Keresés" nézet — élő demó + valódi Firebase-adat

A `view-kereses` egy önálló oldal (a felső menü "Keresés" gombjára, vagy a
hero-kártya keresőjére kattintva nyílik meg), amivel a látogató
kipróbálhatja a keresést anélkül, hogy letöltené az appot:

- **Élő, gépelés közbeni szűrés:** a keresőmező (`#demoSearchInput`)
  minden billentyűleütésre szűr (`oninput="handleDemoSearch()"`), nem
  csak a "Keresés" gomb megnyomására.
- **Név szerinti keresés + "élő profil" teaser:** ha valaki egy konkrét
  szakember nevét írja be (pl. "Kovács Béla"), a demó egy kiemelt üzenetet
  mutat: „Kovács Béla, asztalos már használja a Szaki alkalmazást — nézd
  meg lent a profilját, és töltsd le még ma te is!"
- **VALÓDI Firebase-kapcsolat:** a keresés adatforrása nem csak
  illusztratív minta — a `loadFirestoreData()` JS függvény ténylegesen
  lekéri a Szaki app saját Firestore-adatbázisából (a `szaki-4d32e`
  projekt `public_showcase` gyűjteményéből) a nyilvánosan megjeleníthető
  profilokat, és ha talál ilyet, **lecseréli velük** a keresőoldal teljes
  minta-adatbázisát (`renderDemoDataset()` függvény). Ha a
  `public_showcase` gyűjteményben megjelenik egy valódi regisztrált
  Szakember, a weboldal keresője további fejlesztés nélkül az ő valódi
  nevét, értékelését és szakmáját mutatja majd — nem a mostani
  mintaadatot.
- **⚠️ EZ JELENLEG AZÉRT NEM MŰKÖDÖTT, AMIKOR TESZTELTED:** a
  `public_showcase` gyűjtemény a Firestore-szabályok (`firestore-rules-v8.txt`)
  szerint valóban az egyetlen, bejelentkezés nélkül is olvasható
  gyűjtemény — de **eddig semmi nem töltötte fel** (sem az app, sem
  semmilyen automatizmus nem ír bele). A valódi szakember-adatok a
  `users/{userId}` dokumentumokban vannak, de az csak bejelentkezve
  olvasható (helyesen, hiszen telefonszámot/e-mailt/címet is tartalmaz).
  Emiatt a saját fiókodra rákeresve nem találhatott semmit — a
  gyűjtemény, amit a weboldal olvas, egyszerűen üres volt. Ezt a
  `szaki-functions/` mappában mellékelt anyag oldja meg — lásd a
  `szaki-functions/OLVASD_EL.md` fájlt két megoldással: (1) egy 5 perces
  kézi teszt a Firebase Console-ban, és (2) egy kész, telepíthető Cloud
  Function (`mirrorPublicShowcase`), ami minden regisztrált Szakembert
  automatikusan, kézi munka nélkül szinkronizál a `public_showcase`-be.
- **Amíg a `public_showcase` gyűjtemény üres vagy nem elérhető** (pl.
  offline megnyitás, vagy a fenti javítás még nincs alkalmazva), a
  keresőoldal a beépített, illusztratív `SAMPLE_PROFILES` mintaadatot
  mutatja (7 minta-profil, köztük a kifejezetten kért "Kovács Béla,
  asztalos" példával) — ez NEM hibaállapot, ez a szándékos, biztonságos
  alapértelmezett megjelenés.
- **A `public_showcase` dokumentumok elvárt mezői** (ezt olvassa a
  `loadFirestoreData()`, és ezt írja a mellékelt Cloud Function is):
  `name` (string), `category` (string, magyar megnevezés), `city`
  (string), `rating` (number, 0–5), `reviews` (number), `verified`
  (boolean — `false` esetén az "Új" jelvény jelenik meg a "Hitelesítve"
  helyett, de a profil továbbra is megjelenik a keresésben).
- Ha új mintaprofilt szeretnél hozzáadni az illusztratív alapállapothoz,
  a `build_site.py`-ban a `SAMPLE_PROFILES` Python listát szerkeszd.
- A szűrő "pill" gombok (`.demo-pill`) a lenti kártyarácsot
  (`.demo-card`) szűrik kategória szerint — ékezet-független egyezéssel.

### A hero-kártya keresője (a főoldalon)

A főcím melletti kis keresőkártya (`#heroSearchForm`) beírt szöveggel
elküldve **megnyitja a Keresés nézetet** (`showView('kereses')`), és
azonnal le is futtatja rajta a beírt keresést — így a látogató egy
konzisztens, teljes találati listát lát, akárhonnan indította a keresést.

## 4. "Funkciók" nézet — Térkép, Chat, Naptár + árak

A `view-funkciok` egy másik önálló oldal (a felső menü "Funkciók"
gombjára kattintva nyílik meg), három kézzel rajzolt SVG-illusztrációval
kísért blokkban ("feature row") mutatja be: **Térkép**, **Titkosított
chat**, **Naptár**. A Térkép illusztráció egy sötét, felülnézeti
"éjszakai térkép" stílust követ (kanyargó folyó, sziget, halvány városi
tömbök, feliratok nélkül, szétszórt szakember-jelölőkkel) — kifejezett
kérésre, egy Apple Maps sötét nézet mintájára újrarajzolva, de nem valódi
térképcsempe másolataként (az szerzői jogi okokból nem lenne
felhasználható), hanem saját, kézzel rajzolt SVG-ként. Minden blokk három
részből áll:

- egy inline SVG illusztráció (nincs külső képfájl),
- egy `.feature-persona-grid`, amely két oszlopban mutatja be, mit tud
  ezzel kezdeni egy **Ügyfél**, illetve egy **Szakember**,
- egy `.feature-impact` kiemelés (💡), ami egy mondatban összefoglalja,
  mennyit segít ez a funkció a mindennapokban.

A **Ranglista** funkció NEM ebben a nézetben van — kifejezett kérésre a
főoldalra került (lásd 5. pont), mert az egyik legfontosabb, azonnal
látható értékajánlat. A Funkciók nézet alján megismétlődik a teljes
árazási panel (lásd 6. pont) is — ugyanaz a tartalom, mint a főoldali
"Árak" szekcióban, hogy bárhonnan érkezve megtalálható legyen.

## 5. "Ranglista" — kiemelt szekció a főoldalon

A `ranglista` szekció (a `kinalat` és az `ilyen-egyszeru` szekció között)
egy önálló, teljes "feature row" a főoldalon — ugyanaz a tartalom és
SVG-illusztráció, mint korábban a Funkciók aloldal része volt, most
azonban a főoldal saját, azonnal látható eleme, mert ez a leginkább
"eladó" funkció (megbízhatóság, rangsorolás valós teljesítmény alapján).

## 6. Árak — szó szerint az app saját forráskódjából

Mind a főoldali `arak` szekcióban, mind a Funkciók nézet alján egy
3 kártyás árazási panel jelenik meg. Ez a build_site.py-ban NEM
screenshotról átírt vagy kitalált szöveg — hanem szó szerint az
alkalmazás saját `src/data/monetization.ts` fájljából (`SUBSCRIPTION_TIERS`
tömb) átemelt adat (`SZAKI_TIER_FEATURES` / `SZAKI_PLUS_TIER_FEATURES`
Python-listák a `build_site.py`-ban), hogy a weboldal pontosan azt
ígérje, amit az app ténylegesen ad:

| Csomag | Ár | Kinek |
|---|---|---|
| Ügyfeleknek | Örökre ingyenes | böngészés, keresés, üzenetküldés, foglalás, értékelés |
| Szaki | **1 990 Ft/hó** | 8 tételes, teljes funkciólista (ajánlatküldés, foglalás, keresési megjelenés, naptár, üzenetek, alap statisztikák stb.) |
| Szaki Plus | **3 990 Ft/hó** | Minden a Szaki csomagból + 8 extra (kiemelt megjelenés, havi 2 ingyenes kiemelés, haladó statisztikák, "Felkapott szakember" jelvény, korlátlan portfólió, bejegyzés-kiemelés, prioritási értesítés és ügyfélszolgálat) |

Mindkét kártyán egy `<details>`/`<summary>` ("Mit tartalmaz?")
lenyitható lista mutatja a teljes, pontos funkciófelsorolást — ugyanaz az
interakció, mint magában az appban a csomagválasztó képernyőn. A
főoldalon ez alapból **összecsukva** jelenik meg (hogy ne legyen zsúfolt
a "Árak" szekció), a Funkciók nézet dedikált árazási paneljén viszont
alapból **nyitva** van, mert az a lap kifejezetten a részletekről szól.
Mindkettő ugyanabból a Python-adatból generálódik (`_pricing_grid_html()`
függvény, `open_details` paraméterrel), tehát nincs esély rá, hogy a két
hely szétváljon egymástól.

A pontos összegek (1 990 / 3 990 Ft) és a "Bump" kiemelés ára
(**500 Ft / 24 óra**) is az app saját `SZAKI_MONTHLY_PRICE_HUF` /
`SZAKI_PLUS_MONTHLY_PRICE_HUF` / `BOOST_PRICE_HUF` konstansaiból
származik — ugyanez szerepel a weboldalba beépített, hatályos ÁSZF
8. pontjában is. A Bump egy Szakember profiljának ideiglenes, fizetett
előresorolása, nem előfeltétele a munkavégzésnek — erről egy rövid,
halványabb lábjegyzet tájékoztat mindkét árazási panel alján.

Ha a jövőben az app csomagjai/árai változnak, a `build_site.py`-ban a
`SZAKI_TIER_FEATURES`, `SZAKI_PLUS_TIER_FEATURES`, `SZAKI_TAGLINE`,
`SZAKI_PLUS_TAGLINE`, `PRICE_STANDARD`, `PRICE_PLUS` és `PRICE_BUMP`
változókat kell frissíteni az app saját `src/data/monetization.ts`
fájlja alapján — onnantól mindkét weboldali hely automatikusan
együtt frissül.

## 7. Hol tudom a linkeket és elérhetőségeket módosítani

Az `index.html` legalján, a `<script>` blokkban van egy `CONFIG`
objektum — ez az EGYETLEN hely, ahol az alábbiakat kell módosítani:

```js
window.CONFIG = {
  siteUrl: "https://szaki.hu/",     // a végleges domain (lásd 10. pont)
  company: "Hunem Kft.",
  email: "szakiapplikacio@gmail.com",
  phone: "+36 30 557 8309",
  phoneTel: "+36305578309",         // csak számjegyek + "+", a tel: linkhez
  // A székhely SZÁNDÉKOSAN nincs itt és nincs sehol a nyilvánosan
  // látható oldalon — csak a jogilag kötelező ÁSZF/Adatvédelmi
  // tájékoztatóban van feltüntetve, ahogy a törvény megköveteli
  // (lásd 8. pont).
  links: {
    appStoreUrl: "",                // ide kerül a végleges App Store link
    googlePlayUrl: "",              // ide a végleges Google Play link
    instagram: "",
    tiktok: "",
    facebook: ""
  },
  firebase: { ... }                 // NE nyúlj hozzá — az élő app adatbázisa,
                                     // ez táplálja a hero-kártyát ÉS a
                                     // Keresés-nézet élő adatait (lásd 3. pont)
};
```

Ha egy értéket kitöltesz (pl. `appStoreUrl`), az oldal automatikusan:
- aktívvá teszi az adott jelvényt/ikont a Letöltés szekcióban és a
  lábjegyzetben (jelenleg "Hamarosan" felirattal, kattinthatatlanul áll,
  amíg a mező üres — ez szándékos, nem hiba),
- minden más helyen (footer, social ikonok) is felhasználja ugyanazt az
  értéket, nem kell több helyen átírni.

## 8. Fontos: a székhely (cím) nem jelenik meg nyilvánosan

Kifejezett kérésre a cég **székhelye/címe (Rózsa utca) sehol nem
látható a nyilvános marketing-felületen** — nincs a főoldalon, nincs a
Keresés/Funkciók nézetben, nincs a lábléc "Kapcsolat" oszlopában, nincs a
`CONFIG` objektumban sem. Mindenhol, ahol korábban a cím szerepelt, most
csak: **"Hunem Kft."**, e-mail cím és telefonszám áll.

**Az egyetlen kivétel:** a cím a **jogilag kötelező** ÁSZF és
Adatvédelmi Tájékoztató szövegében szerepel (a Ptk. és a GDPR/Infotv.
alapján egy cégnek a hatályos szerződési feltételeiben és adatkezelési
tájékoztatójában fel kell tüntetnie a székhelyét ahhoz, hogy ezek a
dokumentumok érvényesek legyenek). Ez a két dokumentum kizárólag a lábléc
linkjeiről érhető el, nincs rájuk mutató link vagy hivatkozás sehol a
látható, böngészhető tartalomban. Ha ezt is szeretnéd eltávolítani, azt
mindenképp egyeztesd jogilag/könyvelővel — anélkül nem javasolt kivenni a
székhelyet a hatályos ÁSZF-ből/Adatvédelmiből.

## 9. Szakma-kategóriák és a "100+" statisztika

A teljes, valódi kategória-lista (**111 db**, a marketingszövegekben
kerekítve "100+"-ként említve) a `SZAKI_CATEGORIES` JavaScript tömbben
van — ezt használja a Keresés nézet a tényleges egyezés-kereséshez. A
"Kínálat" szekció felül 18 kiemelt kategóriát (`cat-chip`) jelenít meg
ikonnal, névvel és egy illusztratív "X szakember" darabszámmal — ezek a
darabszámok jelenleg **nem mért, illusztratív placeholder értékek**.

A "Kínálat" szekció alján egy önálló, valódi stat-doboz van
(`.single-stat`), ami a 100+ szakma-kategória számot animálja fel — ez az
egyetlen szám a főoldalon, ami tényleges, ellenőrizhető adat. A korábbi,
kitalált (nem mért) statisztikák (regisztrált szakemberek száma,
elvégzett munkák száma, elégedettségi arány) és a hozzájuk tartozó
minőségi jelvények (hitelesítés/titkosítás/magyar fejlesztés) a
főoldalról kikerültek, hogy ne legyen túlzsúfolt a "Kínálat" szekció —
ezek a gondolatok tartalmilag megmaradtak a Funkciók nézet és a Ranglista
szekció szövegeiben (pl. "Okirat-alapú hitelesítés" a Ranglista leírásban,
"végponttól végpontig titkosított" a Chat leírásban).

## 10. Candy Blue / a brand színei, sötét téma

Az `index.html` `<style>` blokkjának a legelején van a `:root { ... }`
token-lista. Minden szín innen származik:

```css
:root {
  --candy: #B2D5E5;        /* a márka fő világoskék tónusa — VÁLTOZATLAN */
  --candy-mid: #8FC3DA;
  --accent: #B2D5E5;        /* gombok, linkek — sötét háttéren világos */
  --accent-hover: #8FC3DA;
  --accent-ink: #0A0E14;    /* sötét szöveg a candy-színű gombokon */
  --bg: #0A0E14;            /* fő háttérszín */
  --surface: #121922;
  --text: #F2F6F9;
  ...
}
```

A weboldal **szándékosan és kizárólag sötét témájú** — ez a
`color-scheme: dark;` sor és az, hogy nincs világos alternatíva a
CSS-ben. Ha pl. telítettebb Candy Blue-t szeretnél, elég a `--candy`
(és a `--accent` / `--accent-hover`) értékét átírni.

## 11. App Store / Google Play linkek hozzáadása később

1. Nyisd meg az `index.html`-t.
2. Keresd meg a `CONFIG.links` objektumot (lásd 7. pont).
3. Írd be: `appStoreUrl: "https://apps.apple.com/..."` és/vagy
   `googlePlayUrl: "https://play.google.com/..."`.
4. Mentsd el, töltsd fel — a Letöltés szekció jelvényei és a lábléc
   ikonjai automatikusan élővé válnak, "Hamarosan" felirat nélkül.

## 12. Production domain beállítása

Amikor megvan a végleges domain:

1. `CONFIG.siteUrl` a `<script>` blokkban → írd át a végleges URL-re.
2. A `<head>`-ben lévő `<link rel="canonical" href="...">` és az
   `og:url` / `og:title` meta tagek jelenleg is ugyanezt az értéket
   használják — ha `CONFIG.siteUrl`-t átírod, ezeket a meta tageket is
   érdemes kézzel ugyanarra az URL-re állítani.
3. `sitemap.xml` és `robots.txt`: cseréld le bennük a `https://szaki.hu/`
   placeholder domaint a véglegesre.
4. Töltsd fel mind a három fájlt (`index.html`, `robots.txt`,
   `sitemap.xml`) a tárhely gyökerébe.

## Amit tudni érdemes a jelenlegi állapotról

- **A Keresés és a Funkciók most önálló nézetek**, nem a főoldal része —
  lásd 2. pont. Ez tudatos döntés volt a főoldal zsúfoltságának
  csökkentésére.
- **A Keresés nézet valódi Firebase-kapcsolattal rendelkezik, DE ehhez a
  `public_showcase` gyűjteményt fel is kell tölteni** — ez eddig nem
  történt meg (innen a "nem látom a fiókomat" tapasztalat), lásd a 3.
  pont "⚠️" bekezdését és a mellékelt `szaki-functions/OLVASD_EL.md`
  fájlt a két megoldással (kézi teszt vs. automatikus Cloud Function).
- **A Ranglista kiemelt helyen, a főoldalon van**, nem a Funkciók
  aloldalon — lásd 5. pont.
- **Az árak és a csomagtartalmak szó szerint az app saját kódjából**
  (`src/data/monetization.ts`) származnak, "Mit tartalmaz?" lenyitható
  listával mindkét csomagnál — lásd 6. pont. Nincs több nyitott pont az
  áraknál.
- **A Térkép illusztráció újrarajzolva**, sötét, felülnézeti térkép
  stílusban (folyó, sziget, városi tömbök, felirat nélkül) — lásd 4.
  pont.
- **A "Kínálat" szekció kategória-darabszámai** (pl. "1 240+
  szakember") illusztratív, nem mért placeholder értékek — lásd 9. pont.
- **A székhely nem jelenik meg nyilvánosan**, csak a jogilag kötelező
  ÁSZF/Adatvédelmi szövegben — lásd 8. pont.
- **App Store / Google Play jelvények:** amíg a `CONFIG.links` mezők
  üresek, a jelvények szándékosan inaktívak, "Hamarosan" felirattal —
  ez nem hiba, hanem a 11. pontban leírt, előkészített állapot.
- **QR-kód a Letöltés szekcióban:** a jelenlegi oldal URL-jét kódolja be
  — ha a domain élesedik, a QR automatikusan naprakész lesz.
- **Bejelentkezés / regisztráció:** ez a weboldal bemutató felület, nem
  tartalmaz valódi felhasználói fiókkezelést — a "Bejelentkezés" gomb
  egy rövid magyarázatot mutat, és az alkalmazás letöltésére irányít.
- **Nincs külön "Kapcsolat" oldal** — a kapcsolati adatok és a GYIK egy
  közös "Segítség" szekcióban vannak, közvetlenül a kezdőlapon
  (`#segitseg`).

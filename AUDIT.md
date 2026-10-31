# Bezpečnostní audit — vzvcarservis.cz

**Datum:** 31. 10. 2026
**Rozsah:** kompletní statický archiv webu (23 HTML stránek, 141 souborů, ~9,8 MB) + konfigurační
a obsahové souvislosti. Původní archivy: `castwebu1.zip`, `castwebu2.zip` (HTTrack mirror).
**Doplněk:** [`AUDIT-UTOKOVE-CESTY.md`](AUDIT-UTOKOVE-CESTY.md) — konkrétní scénáře, jak by se kdo mohl dostat dovnitř (a jak to zavřít).
**Metoda:** ruční revize HTML/CSS/JS, kontrola odkazů a assetů, analýza metadat souborů
(EXIF, PDF), kontrola knihoven a jejich verzí, rešerše zveřejněných údajů, kontrola GDPR
náležitostí a provozních rizik.

> **Co audit NENÍ:** nešlo o penetrační test ani revizi serveru. Nemám přístup k PHP zdrojům
> CMS, k serverové konfiguraci, k DNS, k databázi ani k e-mailovým schránkám. Některé body
> proto označuji jako **„nutno ověřit“** — z veřejného webu je vidět jen část.

---

## 1. Shrnutí (TL;DR)

Web je funkční, ale **bez jediné bezpečnostní hlavičky, se dvěma knihovnami z let 2014/2016
a s veřejně inzerovanou administrací**. Nejvážnější věc není v HTML, ale v tom, co HTML volá:
kontaktní formulář posílal soubory na `/editorweb/lib/upload.php?id=<ID>` — endpoint CMS,
který podle všeho nevyžaduje přihlášení. Pokud to tak opravdu je, může kdokoli nahrát na
server libovolný soubor (typicky PHP shell) a převzít kontrolu nad webem i serverem.

**Hesla:** v archivovaném webu jsem **žádné přihlašovací údaje, heslo, privátní klíč, konfiguraci
ani dump databáze nenašel**. Našel jsem ale tři věci, které se „tajemstvím“ tváří a tajné
nejsou nebo být nemají: Google Maps API klíč, veřejný reCAPTCHA site key a dva různé ověřovací
tokeny Google Search Console. A v archivované kopii cizího e-shopu byly klíče a interní cesty
jeho administrace (viz V5).

**Nejzávažnější nálezy:**

| # | Nález | Závažnost |
|---|-------|-----------|
| K1 | Neveřejněný upload do CMS přes `/editorweb/lib/upload.php?id=…` (možný RCE) | 🔴 kritická |
| K2 | Administrace `/editorweb/` veřejně odkazovaná z patičky každé stránky | 🔴 kritická |
| K3 | Žádné bezpečnostní hlavičky (CSP, HSTS, X-Frame-Options, nosniff…) | 🟠 vysoká |
| K4 | jQuery 2.1.1 (2014) a Materialize 0.98 (2016) — známé CVE, bez záplat | 🟠 vysoká |
| K5 | Formulář bez CSRF tokenu a bez zjevného serverového ověření reCAPTCHA | 🟠 vysoká |
| K6 | Chybí zásady zpracování osobních údajů (GDPR) — jen stránka o cookies | 🟠 vysoká |
| K7 | Zveřejněná jména, přímé mobily a e-maily 7 zaměstnanců (vč. účetní a jednatele) | 🟠 vysoká |

Celkem **40 nálezů**, z toho 2 kritické, 5 vysokých, 12 středních a 21 nízkých / obsahových.
Všechny opravitelné položky, které šly opravit v rámci sloučení webu, jsou opravené
(viz [oddíl 8](#8-co-je-v-tomto-repu-opravené)).

---

## 2. Přehled všech nálezů

### Kritické a vysoké

| ID | Nález | Kde | Stav |
|----|-------|-----|------|
| K1 | Upload souborů do CMS bez autentizace, ID složek ve zdrojáku | `index.html:376–389`, `kontakty/index.html` | klient opraven, **server nutno ověřit** |
| K2 | Administrace inzerovaná v patičce („Log in to editor“) | patička všech stránek | opraveno |
| K3 | Chybí CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy | server | doplněno `.htaccess` / `_headers` |
| K4 | Zastaralé knihovny s CVE (jQuery 2.1.1, Materialize 0.98, Slippry) | `editorweb/…` | neopraveno (nutná migrace) |
| K5 | Formulář: bez CSRF, bez `required`, reCAPTCHA bez zjevné serverové validace | všechny stránky | částečně |
| K6 | Chybí informace o zpracování OÚ dle čl. 13 GDPR | `conditions/index.html` | neopraveno (právní text) |
| K7 | Osobní údaje zaměstnanců na veřejném webu | `kontakty/index.html` | doporučeno omezit |

### Střední

| ID | Nález | Kde |
|----|-------|-----|
| S1 | Google Maps API klíč `AIzaSy…` na veřejné stránce | archiv `_ext/www.google.com/maps/…` |
| S2 | Dva různé `google-site-verification` tokeny = dva vlastníci Search Console | `index.html:20` a `:66` |
| S3 | GTM se načítá dřív, než se nastaví `consent default` (riziko cookies bez souhlasu) | `index.html:193–200` |
| S4 | Consent skript posílá data o návštěvnících na `getup.cz` | `assets/vendor/getup/gtmconsent.js` |
| S5 | Odkaz na staging `vzvcarservis.getup.cz` v CSS | `css/style_yjnp0t.css` |
| S6 | V archivu klony cizích webů včetně jejich admin JS a API klíčů | `_ext/privesyskladem.cz`, `_ext/cfmotoservis.cz` |
| S7 | Bez SPF/DKIM/DMARC hrozí podvržení e-mailů z domény | DNS (mimo web) |
| S8 | Obchodní podmínky v PDF z 10/2020, chybí 2. strana (zakázkový list) | `obchodni-podminky-…pdf` |
| S9 | Formulář sbírá fotografie bez informace o zpracování a bez limitu velikosti/typu | všechny stránky |
| S10 | Chybí HTTPS vynucení a kanonická hostname (www vs. bez www) | server + `searchbox.js` |
| S11 | PDF i obrázky bez `Content-Disposition`/`nosniff` → možné MIME-sniffing útoky | server |
| S12 | Zveřejněné jméno + funkce + přímý mobil účetní a jednatele = ideální cíl BEC podvodu | `kontakty/index.html` |

### Nízké / obsahové / SEO / přístupnost

| ID | Nález |
|----|-------|
| N1 | 106 obrázků v galeriích vůbec není v archivu (rozbité galerie) |
| N2 | Chybí `simple-lightbox.jquery.min.js` → lightbox nefunguje na 6 stránkách |
| N3 | CSS odkazuje `/images/hero.png`, `/images/hero1.png`, `/images/provoz.jpg` — neexistují |
| N4 | Odkaz na `nase-sluzby.png.png` (dvojitá přípona) |
| N5 | Duplicitní načítání Materialize (identický soubor 2×) — opraveno |
| N6 | Duplicitní `<meta name="viewport">` — opraveno |
| N7 | Neplatné `tel:` odkazy (mezery, chybějící `+`, odkaz na `https://…/tel+420…`) — opraveno |
| N8 | Dvě různé osoby mají uvedený stejný mobil 602 790 180 (Vágner i Dvořáčková) |
| N9 | „Mob“ u Ondřeje Poslušného je ve skutečnosti pevná linka 469 667 178 |
| N10 | `alt` texty zkrácené generátorem („elní“, „YUNDAI“, „APSTAN“) — čtečky i SEO |
| N11 | 46 obrázků bez `alt` — doplněno prázdné `alt` (dekorativní) |
| N12 | `<label for="textarea1">` bez `id` na textarei — opraveno |
| N13 | Stránka `sluzby` má název „služby“ malým písmenem a prakticky žádný obsah — částečně opraveno |
| N14 | Formulář na statickém hostingu neodešle nic (`action="?sentform=1"`), vyhledávání `/vyhledavani/` v archivu není |
| N15 | Autocomplete nabízí „Volné pozice“, „Mechanik čtyřkolek…“, „Servis motocyklů…“ — stránky neexistují |
| N16 | Widget otevírací doby je okopírovaný od jiného klienta („NABYTEK MIGRO“, klíč `nabytekmigroWidgetSeen_v1`) |
| N17 | Widget má zadrátované vánoční promo do 18. 12. 2025 / 4. 1. 2026 — už propadlé |
| N18 | Widget zobrazuje mobil jednatele místo centrální linky a sám se otevírá každých 7 s (`localStorage` bez souhlasu) |
| N19 | Zbytky `tarteaucitron` (CSS bez knihovny), `<!-- custom js -->`, prázdné `height:px` v inline stylu slideru |
| N20 | Překlepy a nekonzistence: „vykonát“, „porezentaci“, „více jak 34letou“, „1 t / 1600 mm -“ vs „–“, `www.privesycarservis.cz` vs `privesyskladem.cz` |
| N21 | Chybí Open Graph / strukturovaná data `LocalBusiness`, sitemap a robots.txt — doplněno |

---

## 3. Kritické nálezy do detailu

### K1 — Upload do CMS bez autentizace (možné převzetí serveru)

**Kde:** `index.html` (a všech 22 dalších stránek), skript „drop-area“ v kontaktním formuláři.

**Co tam bylo:**

```js
function uploadFile(file) {
    var url = '/editorweb/lib/upload.php?id=389775755';   // resp. 124140741
    var formData = new FormData();
    formData.append('file', file);
    fetch(url, { method: 'POST', body: formData })...
}
```

**Proč je to problém:**

* URL obsahuje **ID složky** (`389775755`, na jiných stránkách `124140741`) — to je jediné
  „oprávnění“. ID je ve zdrojáku každé stránky, takže ho zná kdokoli.
* Nahrávání probíhá **hned při vložení souboru**, ještě před odesláním formuláře a nezávisle
  na reCAPTCHA. Kontrola člověka vs. robota se tak úplně obchází.
* Endpoint je součástí editoru `editorweb`, který je na stejném serveru jako web. Pokud
  `upload.php` neověřuje session ani příponu, lze nahrát `shell.php` a spustit ho.
* Stejná rodina CMS se používá i na `cfmotoservis.cz` a `privesyskladem.cz` (viz S6) —
  kompromitace jednoho webu je pak klíč k dalším.

**Co je opravené:** klient už na `upload.php` nic neposílá, ID složek jsou z HTML odstraněná.

**Co musí udělat správce serveru (priorita 1):**

1. Ověřit, zda `https://www.vzvcarservis.cz/editorweb/lib/upload.php?id=389775755` vrací
   bez přihlášení cokoli jiného než 401/403. Test **jen vlastním JPG**, ne skriptem.
2. Pokud je přístupný: dočasně ho zablokovat v `.htaccess` (`Require all denied` nebo
   rewrite na 403), zkontrolovat `filemanager/files/` na cizí soubory (`.php`, `.phtml`,
   `.htaccess`, obrázky s PHP kódem), projít logy (`POST /editorweb/*`) a změnit všechna
   hesla CMS i FTP/SSH.
3. Trvale: upload jen s platnou session, kontrola přípony **i obsahu** (finfo), bílé listiny
   `jpg/jpeg/png/webp/pdf`, max. velikost, náhodné názvy, uložení mimo webroot a
   `php_flag engine off` v adresáři s nahranými soubory.

### K2 — Administrace je veřejně inzerovaná

Patička každé stránky měla:

```html
<span title="Log in to editor" onclick="window.open('/editorweb/','_blank');">© 2026 …</span>
```

Web tím sám říká „tady je CMS, zkuste to“. Útočník nemusí hádat cestu ani skenovat.

**Opraveno** (odkaz z patičky odstraněn). **Dál doporučuji:** administraci na samostatné
subdoméně nebo za VPN/IP allowlist, dvoufázové přihlášení, silné heslo, rate-limit,
`noindex` hlavičku a jinou URL než `/editorweb/`. Zároveň zkontrolovat, že v `/editorweb/`
není `install/`, `backup/`, `phpinfo.php`, `test.php` nebo ukázkové soubory z instalace.

### K3 — Žádné bezpečnostní hlavičky

Web posílal jen `Content-Type` a cookies od Googlu. Chybí:

| Hlavička | Co řeší |
|----------|---------|
| `Content-Security-Policy` | omezení zdrojů skriptů → obrana proti XSS a injektáži |
| `Strict-Transport-Security` | vynucení HTTPS i při přímém odkazu na `http://` |
| `X-Frame-Options` / `frame-ancestors` | clickjacking (vkládání webu do cizího rámce) |
| `X-Content-Type-Options: nosniff` | MIME-sniffing nahraných souborů |
| `Referrer-Policy` | únik URL (včetně parametrů) do cizích webů |
| `Permissions-Policy` | přístup ke kameře, mikrofonu, poloze |
| `Cross-Origin-Opener-Policy` | izolace okna (phishing přes `window.opener`) |

**Doplněno** v `.htaccess` a `_headers`. CSP je připravená, ale **zakomentovaná** — web má
stovky inline `onclick` a inline `<script>`, takže vyžaduje `'unsafe-inline'`, a hlavně je
potřeba nejdřív ověřit, jaké domény si stahuje GTM (GA4, případně Ads). Po nasazení
doporučuji zavést CSP nejprve v režimu `Content-Security-Policy-Report-Only`, posbírat
reporty a teprve pak zapnout. Dlouhodobě je správná cesta odstranit inline handlery
a použít nonce.

### K4 — Zastaralé knihovny se známými zranitelnostmi

| Knihovna | Verze | Rok | Stav |
|----------|-------|-----|------|
| jQuery | 2.1.1 | 2014 | EOL, CVE-2019-11358 (prototype pollution), CVE-2020-11022/11023 (XSS přes `htmlPrefilter`), CVE-2015-9251 |
| Materialize | 0.98.0 | 2016 | nevyvíjeno, poslední 1.0.0 (2019) |
| Slippry | 1.x | ~2015 | nevyvíjeno |
| Font Awesome | 4.x **a zároveň** 6.x | — | načítají se dvě sady ikonových fontů zbytečně |
| simple-lightbox | — | — | soubor vůbec chybí (N2) |

**Riziko:** web je zranitelný na XSS v momentě, kdy se `jQuery.html()` dostane k uživatelskému
vstupu (dnes to nedělá — v `searchbox.js` se pracuje jen se statickými daty). Riziko tedy
není akutní, ale je to dluh, který při jakémkoli rozšíření webu (vyhledávání, komentáře,
formulář s výpisem) vybuchne.

**Doporučení:** jQuery 3.7.x + Materialize 1.0.0 (nebo vlastní CSS), ideálně na samostatné
vývojové větvi s testováním menu, modálů a slideru. Zároveň použít jednu sadu Font Awesome.

### K5 — Kontaktní formulář

Co chybí:

* **CSRF token** — formulář jde odeslat z cizího webu (cross-site POST). Bez backendu to
  nejde ověřit, ale v HTML žádný token není.
* **`required` / validace na serveru** — text „Prosíme vyplňte všechna pole“ je jen text.
* **reCAPTCHA** — site key je v pořádku veřejný, ale z klientského kódu není vidět, že
  server odpověď (`g-recaptcha-response`) ověřuje. Nutno zkontrolovat v PHP.
* **Limit počtu odeslání** — chybí rate-limit; formulář je ideální spam relé.
* **Souhlas se zpracováním OÚ** — místo něj je „Odesláním souhlasíte s podmínkami užití“,
  což není právní titul pro zpracování osobních údajů (viz K6).
* **Fotky** — sběr fotografií znamená zpracování OÚ (často i osob třetích, poznávací značky
  apod.) bez jakékoli informace o účelu, době uložení a příjemcích. Fotky nahrané veřejností
  navíc končí v CMS bez moderace.

**Doporučení:** serverová validace + CSRF token + honeypot/rate-limit + ověření reCAPTCHA
server-side, omezení typu a velikosti souborů, samostatná stránka se zásadami zpracování OÚ
a zaškrtávací políčko se odkazem na ně (ne „pokračováním“). Fotky nahrávat jen dočasně
a s automatickým mazáním.

### K6 — GDPR: chybí zásady zpracování osobních údajů

Stránka `conditions/` se jmenuje „Podmínky užití“, ale obsahuje **jen text o cookies**
(mimochodem okopírovaný z e-shopu — mluví o „košíku“, „přihlášení“, „nákupním procesu“).

Na webu **není**:

* kdo je správce (VZV CAR SERVIS spol. s r.o., IČO 25916211 — jen na Kontaktech),
* jaké údaje se z formuláře sbírají a proč (právní základ),
* jak dlouho se uchovávají,
* komu se předávají (Google — GTM/GA, reCAPTCHA; Getup — consent skript; poskytovatel hostingu),
* poučení o právech (přístup, oprava, výmaz, námitka, stížnost u ÚOOÚ),
* informace o předání do třetích zemí (Google = USA) a o tom, na základě čeho se děje,
* zásady pro cookies rozdělené na nezbytné / analytické / marketingové s možností volby.

**Doporučení (priorita):** nechat zpracovat právníkem či DPO stránku „Zásady ochrany
osobních údajů“ a „Nastavení cookies“ s reálným přepínačem (consent mode), do textu
o cookies doplnit tabulku konkrétních cookies (`_ga`, `_gid`, `_gcl_au`, `IDE`…), doby
platnosti a příjemce.

### K7 — Osobní údaje zaměstnanců

Na Kontaktech je 7 osob s přímým mobilem a e-mailem:

| Osoba | Funkce | Co je zveřejněno |
|-------|--------|------------------|
| Jiří Zvěřina | jednatel | mobil 608 988 809, e-mail |
| Jaroslav Vágner | vedoucí servisu | mobil, e-mail |
| Ivana Zvěřinová | hlavní účetní | mobil 778 094 428, e-mail |
| Michaela Dvořáčková | asistentka servisu | mobil, e-mail |
| Ondřej Poslušný | technik | „mobil“ = pevná linka, e-mail |
| Martin Jelínek | obchodní zástupce | mobil, e-mail |
| Vladimír Straka | obchodní zástupce | mobil, e-mail |

**Riziko:** nejde o „únik“ — firma to zveřejnila sama a má na to právní titul (oprávněný
zájem, obchodní kontakt). Riziko je **bezpečnostní**: zveřejněná organizační struktura
s přímými kontakty je hotový scénář pro **phishing a BEC (business e-mail compromise)**.
Útočník ví, kdo je jednatel, kdo platí faktury a jak ho oslovit. Útočník také ví, že
`jelinek@`, `straka@` atd. existují — formát adres `příjmení@doména` je triviální k uhodnutí.

**Doporučení:** zvážit, zda účetní a jednatel potřebují na webu přímý mobil (postačí
centrální linka a role-based adresa `ucetni@…`), u ostatních kontaktů použít formulář nebo
alespoň obfuskovaný e-mail. Zásadnější je ale technické opatření: **SPF + DKIM + DMARC
v režimu `p=reject`** (viz S7), MFA na e-mailu, pravidlo „změna platebních údajů se ověřuje
zpětným telefonátem“ a školení proti phishingu.

---

## 4. Středně závažné nálezy

### S1 — Google Maps API klíč

V archivovaném HTML Google Maps (`_ext/www.google.com/maps/embed/…`) byl klíč:

```
AIzaSyCmL18misQw9KdwqGaw3zHkitj8vG6QF2Y
```

Klientské klíče jsou veřejné ze své podstaty — **problém je jen tehdy, když nejsou omezené**.
Bez omezení je může kdokoli použít pro tisíce požadavků a majitel zaplatí účet.
**Ověřit v Google Cloud Console**, že klíč má:
HTTP referrer restrictions na `https://www.vzvcarservis.cz/*`, API restrictions jen na
Maps Embed/Static Maps, a nastavený budget alert. Klíč v repu je po opravě nahrazený
embedem bez klíče (`https://www.google.com/maps?q=…&output=embed`), takže po nasazení
této verze už klíč na webu není — **přesto ho doporučuji rotovat**, protože byl veřejně
dostupný.

### S2 — Dvě Google Search Console ověření

```html
<meta name="google-site-verification" content="H8Hi46FoSP6pHYY_u6xLQ0CqvPJGZ9V2AIYydWaRM6A">
<meta name="google-site-verification" content="lM0wWOQjyKLnhk1ti8ZymYLNkC572bIDbbh96iX5Cu4">
```

Každý token = jedna ověřená vlastnost v Search Console, tedy jeden účet s přístupem
k datům o návštěvnosti domény (a možnosti měnit nastavení pro vyhledávače). Dva tokeny
znamenají, že doména je (nebo byla) ověřená ze dvou účtů — pravděpodobně agentura
z minulosti. **Zjistit, komu patří, a nepoužívaný token i vlastnost odebrat.**

### S3 — GTM před souhlasem

Pořadí v HTML:

```html
<!-- řádek 195: GTM snippet – načte gtm.js okamžitě -->
<script>… (window,document,'script','dataLayer','GTM-KWLJXJM5');</script>
<!-- řádek 200: teprve tady se nastaví consent default -->
<script src="assets/vendor/getup/gtmconsent.js"></script>
```

Google Consent Mode vyžaduje, aby výchozí stav (`denied`) byl v `dataLayer` **před**
načtením `gtm.js`. Tady je to naopak, takže GTM může stihnout odeslat data (a nasadit
cookies) dřív, než se souhlas nastaví. V praxi to znamená **riziko ukládání analytických
a marketingových cookies bez souhlasu** — přesně to, co řeší stížnosti podle ePrivacy
a kontroluje ÚOOÚ.

**Doporučení:** consent default dát do `<head>` před GTM, nebo GTM vůbec nenačítat, dokud
uživatel neklikne (což `gtmconsent.js` umí — ale jen když se použije správně). Ověřit
v DevTools → Application → Cookies, že bez kliknutí na liště nevznikne `_ga`.

### S4 — Data o návštěvnících na cizí server

`assets/vendor/getup/gtmconsent.js` obsahuje:

```js
xhr.open('POST', 'https://getup.cz/cookie-endpoint.php', true);
xhr.send(`analyticsConsent=…&marketingConsent=…&domain=${location.hostname}`);
fetch('https://getup.cz/cookie-stats-endpoint.php?domain=' + hostname)
```

Web odesílá informaci o volbě souhlasu (a doménu) na server agentury. To je **předání
údajů zpracovateli** — musí být v zásadách OÚ a ideálně v zpracovatelské smlouvě.
Zároveň skript dělá `JSON.parse` bez `try/catch` a do konzole loguje statistiky.
Doporučuji endpoint vypnout nebo přesunout na vlastní doménu.

### S5 — Staging v produkčním CSS

```css
background: url("https://vzvcarservis.getup.cz/editorweb/filemanager/files/89//nase-sluzby.png.png?_t=1737988690")
```

Produkční web tahal obrázek z **vývojového serveru agentury**. To znamená: (a) cizí
subdoména vidí IP adresy návštěvníků a Referer, (b) pokud staging není chráněný, je
veřejně dostupná stará/rozpracovaná verze webu (duplicitní obsah, možné testovací
funkce), (c) při vypnutí stagingu se web rozbije. **Opraveno** na lokální cestu.
Doporučuji staging buď vypnout, nebo ho chránit Basic auth a `noindex`.

### S6 — Klony cizích webů v archivu

Archiv obsahoval celé zkopírované weby:

* `_ext/privesyskladem.cz/` — 12 MB, kompletní e-shop včetně HTML administrace, košíku,
  `api_auth.php` (login/registrace/reset hesla), Heureka widgetů, **Packeta API klíč
  `a033c6f5889374c4`**, obcházení antispamu `antispam_token = "verified_human"`.
* `_ext/cfmotoservis.cz/` — 6,6 MB, včetně `editor/filemanager/…` cest.

Vzniklo to automatickým stahováním (HTTrack) přes odkazy. **Nikdy to nepatří na veřejný
web** — je to cizí obsah (autorská práva, ochranné známky), duplicitní obsah pro vyhledávače
a zbytečná zátěž. Z archivu **odstraněno**, odkazy vedou na skutečné weby. Packeta klíč je
veřejný (widget), ale i tak doporučuji u dodavatele ověřit, že je svázaný s doménou.

### S7 — E-mailová doména (mimo web, ale klíčové)

Z webu to nepoznám, ale u firmy, která komunikuje s dodavateli a odběrateli, je to
nejčastější vektor podvodu. Zkontrolovat:

```bash
dig +short TXT vzvcarservis.cz | grep -i spf
dig +short TXT _dmarc.vzvcarservis.cz
dig +short TXT selector1._domainkey.vzvcarservis.cz
```

Cíl: `v=spf1 … -all`, platný DKIM a `v=DMARC1; p=reject; pct=100; rua=mailto:…`.
Dále: DNSSEC, uzamčený registrar (registry lock), MFA na e-mailu i na hostingu,
pravidelné zálohy mimo hosting.

### S8 — Obchodní podmínky

PDF má jednu stránku, titulek `Obchodní podmínky VZV CAR SERVIS 12_10_2020.docx`
(říjen 2020), a text se odvolává na „zakázkový list na druhé straně této listiny“ — druhá
strana v souboru není. Zároveň odkazuje na „ceník na internetových stránkách“, který
na webu není. **Právní riziko:** neúplné/neaktuální podmínky jsou v praxi hůř vymahatelné.
Doporučuji nové podmínky (vč. reklamací, odpovědnosti za vady, výhrady vlastnictví,
rozhodčí doložky/GDPR) a nahrát celý dokument.

### S9 — Fotky z formuláře

Sběr fotografií je sběr osobních údajů (často i náhodných kolemjdoucích, poznávacích značek,
dokladů na palubní desce). Chybí informace o účelu, době uložení, příjemcích a právo na
výmaz. Doporučuji omezit na `jpg/png`, max. 5 MB, max. 5 souborů, ukládat mimo veřejný
adresář, s automatickou retencí (např. 90 dní) a s upozorněním ve formuláři.

### S10 — HTTP/HTTPS a hostname

Web je dostupný jako `vzvcarservis.cz` i `www.vzvcarservis.cz` a `searchbox.js` posílá
vyhledávání na `https://vzvcarservis.cz/vyhledavani/` (bez www), zatímco zbytek webu
používá `www.`. To znamená zbytečné přesměrování a možnou duplicitu pro vyhledávače.
Přesměrování je doplněné v `.htaccess`; ověřit i na serveru (HTTPS-only, HSTS).

### S11 — MIME sniffing u PDF a obrázků

Server musí posílat `X-Content-Type-Options: nosniff` a u PDF `Content-Disposition: inline`
s korektním typem. Jinak hrozí, že prohlížeč soubor interpretuje jinak, než má (stará známá
technika „PDF s HTML uvnitř“). Řeší se hlavičkou z K3.

### S12 — Sociální inženýrství na účetní

Kombinace „Ivana Zvěřinová — hlavní účetní — 778 094 428 — zverinova@…“ je pro útočníka
kompletní zadání. Doporučuji interní pravidlo: **žádná změna bankovního spojení bez
ověření zpětným hovorem na číslo z rejstříku**, dvouosobové schvalování plateb, upozornění
na „faktury od jednatele z cizí adresy“.

---

## 5. Nízké a obsahové nálezy

### 5.1 Chybějící soubory (archiv nebyl úplný)

| Co | Počet | Důsledek |
|----|-------|----------|
| fotky galerií `pridavna/`, `opravy/`, `rucni/`, `bazar/rucni-*` | **106** | prázdné/rozbité galerie |
| `editorweb/css/new/simple-lightbox.jquery.min.js` | 1 | lightbox nefunguje |
| `/images/hero.png`, `/images/hero1.png`, `/images/provoz.jpg` | 3 | chybí pozadí v CSS |

Reference jsem **nesmazal** — po nasazení na server, kde `/editorweb/filemanager/files/89/`
existuje, se obrázky načtou. Pokud se web nasazuje jako samostatný statický web (GitHub
Pages), je potřeba soubory doplnit z produkce.

### 5.2 Obsahové chyby

* **Duplicitní čísla:** 602 790 180 je uvedeno u Jaroslava Vágnera i Michaely Dvořáčkové.
* **„Mob“ u Ondřeje Poslušného** je pevná linka 469 667 178 (stejná jako ústředna).
* **`alt` texty** typu „elní“, „YUNDAI“, „APSTAN“, „dtahová“ — vznikly zkrácením názvu
  v generátoru šablony. Škodí čtečkám i vyhledávačům.
* **Stránka `sluzby`** má titulek „služby“ (malé s) a kromě dlaždic žádný text — pro
  vyhledávače prázdná stránka.
* **Autocomplete** nabízí „Volné pozice“, „Mechanik čtyřkolek a motorek CF MOTO“,
  „Servis motocyklů a čtyřkolek“ — stránky na webu nejsou, nabídka vede do prázdna.
* **`www.privesycarservis.cz`** v textu „O společnosti“ — skutečný e-shop je
  `privesyskladem.cz`. Ověřit, jestli jde o překlep, nebo o doménu, která už neexistuje.
* **Překlepy:** „vykonát“ → „vykonat“, „porezentaci“ → „prezentaci“, „více jak 34letou“ →
  „více než 34letou“, „NOVÝ“/„novÝ“, `1 t / 1600 mm - NOVÝ` vs `1 t / 2500 mm – NOVÝ`.
* **Právní odkazy** na `§ 134b zákoníku práce`, `ČSN 26 88 05`, `NV 378/2001` — nechat
  ověřit, zda jsou platné a správně citované (ČSN se píše `ČSN 26 8805`).
* **`nase-sluzby.png.png`** — dvojitá přípona v původní URL.
* **Zbytky jiných projektů:** `tarteaucitron` CSS bez knihovny, widget „NABYTEK MIGRO“
  s klíčem `nabytekmigroWidgetSeen_v1`, hardcoded vánoční promo do 18. 12. 2025,
  prázdné `style="width:100%;height:px"` u slideru.

### 5.3 Widget otevírací doby

`assets/vendor/getup/opening-hours.js` je skript agentury napsaný pro jiný e-shop:

* název a klíč z jiného projektu (viz výše),
* **vždy po 1 s se sám otevře** a po 7 s zavře, dokud si ho návštěvník nezavře
  (`localStorage` bez vztahu k souhlasu),
* na `vzvcarservis.cz` zobrazuje mobil **608 988 809** (jednatel) místo centrální linky,
* hodnota „Po–Pá 6:00–14:30“ je zadrátovaná — ověřit, jestli odpovídá realitě,
* používá `innerHTML` (byť se statickým obsahem) a inline `onclick` handlery.

Doporučuji widget přepsat na vlastní jednoduchou komponentu nebo ho vypnout.

### 5.4 SEO a přístupnost

* Chybí `og:` a `twitter:` meta tagy → ošklivé náhledy při sdílení na Facebooku/LinkedInu.
* Chybí strukturovaná data `LocalBusiness`/`Product` (obrovská příležitost pro lokální SEO).
* Byly duplicitní `<meta name="viewport">` a duplicitní načtení Materialize — opraveno.
* 46 obrázků bez `alt` — doplněno prázdné `alt` (dekorativní); u obsahových obrázků
  doporučuji popisky.
* Chyběl `robots.txt`, `sitemap.xml`, `404.html` — doplněno.
* Chybí `lang` na některých vložených prvcích, formulář nemá `aria-describedby` u chybových
  stavů, ikony (`material-icons`) jsou bez `aria-hidden`.
* Kontrast světle zelené (`#7dae41`) na bílé je na hranici WCAG AA pro malý text.

### 5.5 Výkon

* Nevyužitých 19 MB v `_ext/` — odstraněno.
* Největší obrázky 200–360 kB (logo `linde-h80d.png` 363 kB, `eufve.png` 248 kB) — doporučuji
  WebP/AVIF a `srcset`.
* Dvě sady Font Awesome (4 i 6) + 5 formátů každého fontu.
* Na 6 stránkách se zbytečně inicializuje slider (`#slides` je prázdný).
* Po nasazení vyřeší cache a komprese z `.htaccess`.

---

## 6. Co v archivovaném webu NENÍ (a je to dobře)

Pro úplnost, protože se na to ptáte („unikla hesla“):

* ❌ žádné heslo, `passwd`, `htpasswd`, `.env`, konfigurační soubor,
* ❌ žádný privátní klíč, token API, přístup k databázi, dump SQL,
* ❌ žádné PHP zdrojáky (archiv je jen vygenerované HTML),
* ❌ žádná osobní data zákazníků (objednávky, e-maily, faktury),
* ❌ žádná fotka s GPS souřadnicemi v produkčních obrázcích (EXIF je vymazaný).

Našel jsem ale **EXIF data s GPS souřadnicemi** (49.9155 N, 15.9487 E) a modelem telefonu
ve fotkách **naklonovaného e-shopu privesyskladem.cz** — ty byly v archivu a publikovaly by
se spolu s ním. Odstraněním klonů problém mizí. **Pro produkční fotky doporučuji EXIF
čistit při nahrávání** (řada CMS to nechává být) — u fotek z dílny se tak neprozradí, kde
a kdy byly pořízené a čím.

---

## 7. Prioritní plán

### Ihned (do 24 hodin)

1. **Ověřit a zabezpečit `/editorweb/lib/upload.php`** (K1) — pokud je otevřený, považovat
   server za kompromitovaný a projít logy + nahrané soubory.
2. Zkontrolovat administraci: silné heslo, 2FA, IP allowlist, žádné demo soubory (K2).
3. Ověřit a omezit Google Maps klíč (S1), zrušit neznámý Search Console token (S2).

### Do týdne

4. Nasadit `.htaccess`/`_headers` (K3) a ověřit HTTPS + HSTS.
5. Zkontrolovat DNS: SPF, DKIM, DMARC (S7), DNSSEC, registry lock.
6. Doplnit zásady zpracování OÚ a nastavení cookies (K6), upravit text u formuláře (K5, S9).
7. Zkontrolovat pořadí consent mode (S3) a vypnout reporting na `getup.cz` (S4).

### Do měsíce

8. Upgrade jQuery a Materialize, sloučení Font Awesome (K4).
9. Serverová validace formuláře + rate-limit + CSRF (K5).
10. Nové obchodní podmínky a dokončení PDF (S8).
11. Doplnit chybějící obrázky a lightbox (N1, N2), opravit `alt` texty (N10).
12. Zvážit omezení osobních kontaktů na webu (K7) a komunikační pravidla proti BEC (S12).
13. Monitoring dostupnosti, zálohy mimo hosting, plán incidentu.

---

## 8. Co je v tomto repu opravené

| Oblast | Změna | Soubor |
|--------|-------|--------|
| K1 | odstraněn klientský upload na `upload.php` a ID složek | `index.html`, `kontakty/index.html` |
| K2 | odstraněn odkaz na administraci z patičky | všechny stránky |
| K3 | doplněny hlavičky (CSP připravená k zapnutí) | `.htaccess`, `_headers` |
| S5 | odstraněna závislost na staging doméně | `css/style_yjnp0t.css` |
| S6 | odstraněny klony cizích webů, odkazy na reálné weby | `_ext/` → pryč |
| S10 | přesměrování non-www → www, HTTP → HTTPS | `.htaccess` |
| N5 | odstraněno duplicitní načtení Materialize | všechny stránky |
| N6 | odstraněn duplicitní viewport | všechny stránky |
| N7 | normalizované `tel:` odkazy (54×) | všechny stránky |
| N11 | doplněné prázdné `alt` (46×) | všechny stránky |
| N12 | opravený label u textarea | všechny stránky |
| N13 | titulek „Služby“ | `sluzby/index.html` |
| N19 | mapa bez API klíče, `rel="noopener"` | všechny stránky |
| N21 | `robots.txt`, `sitemap.xml`, `404.html`, kanonické URL | nové soubory |
| — | opravené cesty k obrázkům, slugy, rozbitý název souboru | globálně |
| — | knihovny třetích stran lokálně (`assets/vendor/`) | nové soubory |

---

## 9. Kontrolní seznam po nasazení

- [ ] `curl -I https://www.vzvcarservis.cz/` vrací `strict-transport-security`,
      `x-content-type-options`, `x-frame-options`, `referrer-policy`
- [ ] `https://www.vzvcarservis.cz/editorweb/` je chráněné (IP allowlist/2FA), ne indexované
- [ ] `POST /editorweb/lib/upload.php?id=…` bez session vrací 401/403
- [ ] `https://www.vzvcarservis.cz/robots.txt` a `/sitemap.xml` vrací 200
- [ ] `https://vzvcarservis.cz` přesměruje 301 na `https://www.vzvcarservis.cz`
- [ ] v DevTools → Cookies: bez kliknutí na liště nevzniká `_ga`/`_gcl_au`
- [ ] formulář odešle e-mail jen s vyplněnou reCAPTCHA a nepřijímá přílohy > 5 MB
- [ ] v Google Cloud Console má Maps klíč referrer + API restrictions a budget alert
- [ ] SPF `-all`, DKIM validní, DMARC `p=reject`
- [ ] zálohy webu i e-mailů běží mimo hosting a existuje test obnovy
- [ ] všechny účty (CMS, FTP, hosting, doména, e-mail) mají unikátní heslo v password
      manageru a zapnuté 2FA

---

*Audit zpracován na základě veřejně dostupného archivu webu. Doporučuji doplnit ho
o penetrační test serveru a revizi PHP zdrojů CMS, ty z veřejného webu vidět nejsou.*

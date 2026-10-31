# VZV CAR SERVIS — web (sloučená verze)

Statický web `vzvcarservis.cz` sloučený ze dvou archivů (`castwebu1.zip` + `castwebu2.zip`).
Archivy byly dva výřezy téhož webu: jeden obsahoval podstránky, druhý kořenové soubory,
CSS, JS a obrázky. Dohromady tvoří jeden funkční web, který jde otevřít i bez PHP.

**Bezpečnostní audit a seznam všech nalezených rizik: [`AUDIT.md`](AUDIT.md).**
**Jak by se kdo mohl dostat dovnitř: [`AUDIT-UTOKOVE-CESTY.md`](AUDIT-UTOKOVE-CESTY.md).**

---

## Co je v repozitáři

```
/
├─ index.html                  úvodní stránka
├─ <22 adresářů>/index.html    podstránky (služby, bazar, kontakty, …)
├─ css/style_yjnp0t.css        hlavní styl webu
├─ editorweb/                  assety původního CMS (CSS, JS, fonty, nahrané obrázky)
│  └─ filemanager/files/89/    obrázky webu (logo, ikony, fotky strojů)
├─ assets/vendor/              lokálně hostované knihovny třetích stran
│  ├─ fonts/                   Material Icons + Open Sans (self-hosted, žádné Google Fonts)
│  └─ getup/                   consent script + widget otevírací doby
├─ images/                     doplňkové obrázky
├─ obchodni-podminky-vzv-car-servis.pdf
├─ 404.html
├─ sitemap.xml, robots.txt
├─ .htaccess                   bezpečnostní hlavičky, HTTPS, cache, zákaz výpisu adresářů
└─ _headers                    totéž pro Netlify / Cloudflare Pages
```

## Jak si web prohlédnout

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

(otevírat přímo `index.html` ze souborového systému nejde — relativní cesty a `fetch` potřebují server)

## Co jsem při slučování změnil

Vše je vidět v git diffu, tady je souhrn:

1. **Spojení archivů** — podstránky z prvního zipu + kořen a assety z druhého. Cesty
   `../editorweb/…` i `editorweb/…` teď fungují z jedné úrovně.
2. **Oprava cest k obrázkům** — HTTrack uložil soubory z `…/files/89//…` do pomocné složky
   `files/89/_/`. Soubory jsou přesunuté na skutečné místo, takže odpovídají původním URL.
   (Stejně tak rozbitý název `Sn#U00edmek …png` → `Snímek …png`.)
3. **Rozbité slugy produktů** — adresáře `…-1120mm-%93-novy` a `…-2500-mm-%93-novy`
   obsahovaly neplatný percent-escape (`%93`), takže na běžném serveru vedly na 404.
   Přejmenováno na `…-1120mm-novy` a `…-2500-mm-novy` (+ odkazy uvnitř webu).
4. **Odstraněny klony cizích webů** — `_ext/privesyskladem.cz` (12 MB) a
   `_ext/cfmotoservis.cz` (6,6 MB) byly v archivu omylem stažené celé weby jiných firem
   včetně jejich administrace. Odkazy „Přívěsné vozíky“ a „CFMOTO“ teď míří na skutečné
   weby `https://www.privesyskladem.cz/` a `https://cfmotoservis.cz/`.
5. **Knihovny třetích stran lokálně** — reCAPTCHA, GTM a Google Maps se načítají přímo
   z Google; fonty (Material Icons, Open Sans) a skripty agentury jsou uložené v
   `assets/vendor/`, aby web nevisel na cizí doméně.
6. **Bezpečnostní úpravy** (podrobně v auditních bodech K1, V1–V3):
   - odstraněn klient-side upload do `/editorweb/lib/upload.php` a zveřejněná ID složek,
   - odstraněn odkaz „Log in to editor“ z patičky,
   - mapa místo zkopírovaného Google embedu,
   - opravené `tel:` odkazy, `rel="noopener"`, popisky formuláře, duplicitní viewport,
   - odstraněna závislost CSS na staging doméně `vzvcarservis.getup.cz`.
7. **Doplněno** — `404.html`, `sitemap.xml`, `robots.txt`, `.htaccess`, `_headers`,
   kanonické URL, prázdné `alt` u dekorativních obrázků.

## Co zůstalo nedokončené (nejde opravit z archivu)

- **106 obrázků** v galeriích (Přídavná zařízení, Generální opravy, Ruční manipulační
  technika, Bazar) nebylo v archivu vůbec stažených. Reference jsem ponechal — po nasazení
  na server, kde `/editorweb/filemanager/files/89/` existuje, se obrázky načtou.
- **`simple-lightbox.jquery.min.js`** chybí, takže galerie nejdou rozkliknout (chybí i
  většina fotek, viz výše).
- **Kontaktní formulář** nemá v statickém archivu backend. Na produkci ho zpracovává CMS;
  před nahrazením je potřeba vyřešit body K1 a K5 z auditu.
- **Vyhledávání** (`/vyhledavani/?q=…`) je serverová funkce, v archivu není.

## Nasazení

- **Apache hosting** — nahraj obsah repozitáře do `DocumentRoot`, `.htaccess` se postará
  o HTTPS, hlavičky i zákaz výpisu adresářů.
- **Netlify / Cloudflare Pages** — použijí se hlavičky ze souboru `_headers`.
- **GitHub Pages** — funguje, ale `.htaccess` se ignoruje (žádné vlastní hlavičky).
- Po nasazení projdi kontrolní seznam v [`AUDIT.md`](AUDIT.md#kontrolní-seznam-po-nasazení).

## Původní archivy

`castwebu1.zip` a `castwebu2.zip` jsou z pracovního stromu odstraněné (aby se nekopírovaly
do nového webu), ale zůstávají v historii gitu:

```bash
git show aede5f5:castwebu1.zip > castwebu1.zip
git show aede5f5:castwebu2.zip > castwebu2.zip
```

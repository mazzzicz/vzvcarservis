# Jak by se kdo mohl dostat dovnitř

Doplněk k [`AUDIT.md`](AUDIT.md). Cílem je ukázat **konkrétní cesty, kterými se útočník
dostane k webu, k datům nebo k penězům firmy** — a u každé napsat, jak to poznat a jak to
zavřít.

> **Pozor na legalitu:** testovat cizí web bez písemného povolení je trestné. Všechno níže
> je myšleno pro **vlastní** infrastrukturu (nebo s podepsanou smlouvou o penetračním
> testu). Ověřovací kroky jsou záměrně „read-only“; nikde není návod na zneužití.

---

## 0. Kdo vlastně útočí

| Typ útočníka | Co ho zajímá | Jak je pravděpodobný |
|---|---|---|
| **Automatizovaný bot** | cokoli, co se dá prodat nebo použít: otevřené CMS, upload, staré pluginy | velmi vysoká — skenuje celý internet 24/7, vaše firma ho nezajímá |
| **Phisher / podvodník** | peníze: falešná faktura, změna bankovního účtu | vysoká — web mu dá jména, funkce a e-maily |
| **Konkurence** | obsah, ceníky, zákazníci, zničení reputace | nízká–střední |
| **Bývalý dodavatel / zaměstnanec** | přístupy, které mu zůstaly | střední, často přehlížené |
| **Cílený útočník** | databáze zákazníků, vydírání | nízká, ale nejdražší následky |

Drtivá většina reálných incidentů u firem velikosti VZV CAR SERVIS nezačíná „hackerským“
průnikem, ale **e-mailem, slabým heslem nebo nepoužívaným přístupem**.

---

## 1. Přehled cest

| # | Cesta | Náročnost pro útočníka | Dopad | Stav po opravě |
|---|-------|------------------------|-------|----------------|
| A | Nahrání souboru do CMS (K1) | velmi nízká (pokud je endpoint otevřený) | **kritický** — převzetí serveru | klient opraven, **server nutno ověřit** |
| B | Přihlášení do administrace (K2) | nízká–střední | kritický | odkaz odstraněn, server ne |
| C | XSS přes staré knihovny (K4) | střední | vysoký (session admina) | neopraveno |
| D | Phishing / BEC (K7, S7, S12) | **velmi nízká** | vysoký (peníze, přístupy) | neopraveno, mimo web |
| E | GTM / účty třetích stran | nízká (pro toho, kdo má přístup) | kritický, tichý | neopraveno, mimo web |
| F | Doména, DNS, hosting | nízká–střední | kritický (web i e-maily) | neopraveno, mimo web |
| G | Server: výpisy adresářů, zálohy | nízká | vysoký | částečně (`.htaccess`) |
| H | Formulář: injektáž hlaviček, spam | nízká | střední (reputace domény) | neopraveno |
| I | Staging doména agentury | nízká | střední | závislost odstraněna, server ne |
| J | Interní přístupy a offboarding | nízká (pro insidera) | vysoký | neopraveno |

---

## 2. A — Nahrání souboru do CMS

**Kudy:** kontaktní formulář má „drop zónu“ na fotografie. Ve zdrojáku každé stránky bylo:

```
/editorweb/lib/upload.php?id=389775755     (jinde 124140741)
```

**Jak by to šlo:**

1. Útočník otevře web, zmáčkne Ctrl+U (nebo si stáhne stránku) a cestu k `upload.php`
   najde v JavaScriptu. Nemusí nic hádat ani skenovat.
2. Zkusí poslat **neškodný** soubor. Když server vrátí `200 OK` a soubor se objeví na
   veřejné adrese, endpoint nemá autentizaci.
3. Pak už je to rutina: nahraje soubor, který se na serveru **spustí** (PHP). Získá tím
   možnost číst konfiguraci CMS (přihlašovací údaje k databázi, e-mailu, FTP), zapisovat
   do souborů a spouštět příkazy.
4. Z jednoho webshellu je během hodin **kompletní převzetí serveru**: defacement, přesměrování
   na podvodný e-shop, skryté odkazy (SEO spam), skript na stránce, který krade data
   z formuláře, a pivot na **ostatní weby na stejném hostingu** (stejná agentura hostuje
   `cfmotoservis.cz`, `privesyskladem.cz` — viz S6 v auditu).
5. Pokud je PHP v adresáři zakázané, pořád jde nahrát `.html` nebo `.svg` a udělat
   **phishingovou stránku na vaší vlastní doméně** („přihlaste se k odběru“), nebo `.htaccess`
   a přenastavit server. Nebo prostě nahrát 10 GB souborů a zaplnit disk.

**Jak to ověřit (bezpečně, jen vlastní web):**

```bash
# 1) vrací administrace vůbec něco bez přihlášení?
curl -s -o /dev/null -w '%{http_code}\n' https://www.vzvcarservis.cz/editorweb/
curl -s -o /dev/null -w '%{http_code}\n' https://www.vzvcarservis.cz/editorweb/lib/upload.php
```

- `200` u `upload.php` **bez** parametru je špatně; správně má být `401`/`403`/`400`.
- Potom nahrajte **vlastní testovací obrázek** s jedinečným názvem a zkuste ho otevřít.
  Pokud je veřejně dostupný komukoli, je upload otevřený.
- Zda se v adresáři spouští PHP, ověřte **jen v testovacím prostředí** a souborem, který po
  spuštění maximálně vypíše náhodný řetězec. Pokud se řetězec vypíše, je server kompromitovatelný.
- Projděte `https://www.vzvcarservis.cz/editorweb/filemanager/files/` — pokud vidíte seznam
  souborů, máte zapnutý directory listing (G níže).

**Jak zavřít:** autentizace + CSRF token, bílá listina přípon *a* kontrola skutečného typu
obsahu, limit velikosti, náhodné názvy, uložení mimo webroot, `php_flag engine off`
a `Require all denied` pro skriptové přípony v adresáři nahraných souborů, rate-limit.
Podrobný postup je v auditu, nález **K1**.

---

## 3. B — Přihlášení do administrace

**Kudy:** `https://www.vzvcarservis.cz/editorweb/` — do minulé verze webu vedly dveře
přímo z patičky („Log in to editor“). Odkaz je pryč, adresa zůstává.

**Jak by to šlo:**

1. **Hádání a opakování hesel** — bot zkouší tisíce kombinací. Pokud login nemá rate-limit
   ani captchu, je to otázka hodin.
2. **Pře použití hesla** — heslo do CMS je stejné jako do e-mailu, na Facebook nebo do
   některého z 10 zveřejněných firemních e-mailů. Únik přijde odjinud (prolomená databáze
   jiné služby) a útočník ho jen zkusí tady. Tohle je nejčastější reálná cesta.
3. **Zůstatek přístupů po dodavateli** — web dělala agentura, firmu v roce 2019 změnila
   majitele. Kdo všechno má ještě účet v CMS? Bývalý správce, bývalý zaměstnanec, účet
   „test“ z instalace.
4. **Zapomenuté soubory** — `install/`, `backup/`, `phpinfo.php`, `test.php`, `.git/`,
   `wp-config.php.bak` apod. v adresáři administrace.

**Co útočník získá:** editor obsahu (defacement, podvržené ceny), file manager (rovnou
upload z bodu A), často i přístup k nahraným dokumentům zákazníků a k e-mailové konfiguraci.

**Jak to ověřit:**

- Zkuste se přihlásit **špatným** heslem 20× za sebou. Pokud vás to nezastaví (captcha,
  lockout, rostoucí zpoždění), nemá login ochranu proti hádání.
- Zkontrolujte v prohlížeči (DevTools → Application → Cookies) přihlašovací cookie: musí
  mít `HttpOnly`, `Secure` a `SameSite=Lax/Strict`.
- Ověřte, že `/editorweb/install/`, `/editorweb/backup/`, `/editorweb/phpinfo.php` vrací 404.
- Zeptejte se agentury na **seznam účtů** v CMS a kdy se naposledy měnila hesla.

**Jak zavřít:** 2FA, unikátní heslo v password manageru, IP allowlist nebo VPN, administrace
na samostatné doméně (`admin.vzvcarservis.cz` — tím se oddělí cookies od veřejného webu),
rate-limit, logování přihlášení a e-mailová notifikace o novém přihlášení.

---

## 4. C — XSS přes staré knihovny

**Kudy:** jQuery 2.1.1 (2014) a Materialize 0.98 (2016), plus hledání
`/vyhledavani/?q=…`, které na produkci pravděpodobně vypisuje hledaný výraz.

**Jak by to šlo:**

1. Útočník najde místo, kde se **vstup z URL vypíše do stránky** (typicky výsledky hledání,
   „nic jsme nenašli pro…“). Pokud výstup není escapovaný, vloží do `?q=` skript.
2. Odkaz pošle **správci webu** („podívejte se, co o vás píšou“) nebo ho podstrčí do
   reklamy. Klikne na něj oběť, skript se spustí **v kontextu vaší domény**.
3. Protože administrace je na **stejné doméně**, skript může v prohlížeči přihlášeného
   správce dělat akce v CMS (přidat admina, změnit obsah), číst data z formulářů nebo
   vykrást session (pokud cookie není `HttpOnly`).
4. jQuery 2.1.1 k tomu přidává vlastní zranitelnosti (CVE-2020-11022/11023) — stačí, když
   se někde použije `.html()` s daty od uživatele.

**Proč to dnes není akutní:** v kódu, který máme, se uživatelský vstup nikde nevykresluje
přes `.html()`. Riziko vznikne při **prvním rozšíření** webu (vyhledávání, komentáře,
formulář s výpisem, napojení na e-shop).

**Jak ověřit:** do vyhledávání vložte text s lomítky a uvozovkami (`"<b>test</b>`) a podívejte
se ve zdrojáku, zda se vrátí **escapovaný** (`&lt;b&gt;`) nebo jako skutečný tag.
Do konzole prohlížeče napište `jQuery.fn.jquery` — vypíše verzi.

**Jak zavřít:** upgrade jQuery (3.7.x) a Materialize, escapovat výstup, CSP (hlavička je
připravená v `.htaccess`), `HttpOnly` cookies a ideálně **oddělená doména pro administraci**.

---

## 5. D — Phishing a podvod s fakturou (nejpravděpodobnější cesta k penězům)

**Kudy:** web sám dodá kompletní adresář — jména, funkce, e-maily i mobily, včetně
**hlavní účetní a jednatele**. Formát adres je triviálně odvoditelný (`prijmeni@vzvcarservis.cz`).

**Jak by to šlo:**

1. Útočník z webu opíše jména a role. Zjistí, kdo schvaluje faktury a kdo je platí.
2. Pošle e-mail „od jednatele“ účetní: *„Změnili jsme bankovní účet dodavatele, prosím
   aktualizujte platbu, faktura je v příloze.“* Příloha je odkaz na přihlašovací stránku
   (klidně na vaší vlastní doméně, viz bod A) nebo dokument s makrem.
3. Pokud účetní nemá pochybnosti, peníze odejdou na cizí účet. Vymáhání je prakticky nulové.
4. Varianta 2: **podvržení e-mailu** (spoofing). Pokud doména nemá DMARC `p=reject`, útočník
   pošle e-mail, který vypadá, že přišel z `obchod@vzvcarservis.cz`, i bez přístupu ke schránce.
5. Varianta 3: **phishing na zaměstnance** → získá heslo do CMS nebo do e-mailu → dostane se
   k bodu B.

**Jak ověřit (dnes, 2 minuty):**

```bash
dig +short TXT vzvcarservis.cz | grep -i spf
dig +short TXT _dmarc.vzvcarservis.cz
dig +short TXT vzvcarservis.cz | grep -i dmarc
dig +short TXT selector1._domainkey.vzvcarservis.cz   # název selektoru dle poskytovatele
```

- chybí SPF → kdokoli může posílat e-maily „z“ vaší domény,
- `p=none` u DMARC → jen se to loguje, nic se neblokuje,
- chybí DKIM → e-maily se mohou označovat za spam nebo jde o podvržení.

**Jak zavřít:** DMARC `p=reject`, SPF `-all`, DKIM, MFA na e-mailu, pravidlo
**„změna bankovního spojení jen po zpětném telefonátu na číslo z rejstříku“**, dvouosobové
schvalování plateb, banner „externí e-mail“ a školení (jeden pokusný phishing ročně).

---

## 6. E — GTM a účty třetích stran (tichá cesta)

**Kudy:** v hlavičce každé stránky je Google Tag Manager `GTM-KWLJXJM5` a ověřovací tokeny
Google Search Console (dva různé, viz S2).

**Jak by to šlo:**

1. Kdokoli s přístupem do kontejneru GTM může **vložit libovolný JavaScript do všech stránek**
   webu — bez přístupu k serveru, bez FTP, bez hesla do CMS, bez zásahu do souborů.
2. Typické zneužití: skript, který čte, co lidé vyplní do formuláře (jméno, e-mail, telefon,
   text zprávy) a pošle to jinam. Nebo přesměrování na podvodný web. Nebo „reklamní“ skript,
   který posílá falešná data konkurenci.
3. Totéž platí pro **Search Console** (kdo má ověření, může měnit nastavení pro vyhledávače)
   a pro **skript agentury** `gtmconsent.js`, který se načítá z `getup.cz` — pokud ho někdo
   změní, změní se i na vašem webu.

**Jak ověřit:** v GTM → Admin → User Management zjistit, kdo má přístup (a zda mají 2FA).
V Search Console → Users and permissions zjistit, čí jsou oba tokeny. U agentury se zeptat,
kdo má přístup k `getup.cz/cookie-endpoint.php` a co tam teče.

**Jak zavřít:** 2FA u Google účtů, minimální práva (jen „view“ pro ty, kdo nepotřebují
publikovat), pravidelná revize, verze kontejneru pod kontrolou a **monitoring změn** —
stačí týdenní kontrola obsahu kontejneru, nebo CSP, která cizí skripty zablokuje.

---

## 7. F — Doména, DNS a hosting

**Kudy:** doména, DNS a hosting jsou „pozemek“, na kterém web stojí. Kdo je ovládá, ovládá
všechno — často i firemní e-maily.

**Jak by to šlo:**

1. **Převzetí registrátora** — heslo bez 2FA, sdílený účet, expirace domény (boti domény
   hlídají a kupují je v sekundě po expiraci). Útočník pak nastaví vlastní DNS.
2. **Změna DNS** — útočník přesměruje web na svou kopii, získá platný TLS certifikát na vaši
   doménu a sbírá přihlašovací údaje zákazníků. Přes **MX záznamy** dokáže číst i firemní
   e-maily (nebo je tiše přeposílat).
3. **Sdílený hosting** — pokud je na stejném serveru 30 webů a jeden z nich je prolomený
   (typicky přes upload jako v bodě A), útočník může číst konfigurace i vašeho webu.
4. **Staging `vzvcarservis.getup.cz`** — dokud běžel, byla to druhá veřejná verze webu.
   Přesměrování, stará verze, testovací funkce, žádná ochrana.

**Jak ověřit:**

```bash
whois vzvcarservis.cz | grep -iE "expiry|registrar"   # expirace a registrátor
dig +short NS vzvcarservis.cz                          # kdo spravuje DNS
dig +short A www.vzvcarservis.cz                       # kam web míří
curl -sI https://www.vzvcarservis.cz/ | grep -i strict-transport
curl -s "https://crt.sh/?q=vzvcarservis.cz&output=json" | head -c 500   # vydané certifikáty
```

- Neočekávaný certifikát v CT logu = někdo jiný si ho vydal na vaši doménu.
- Doména expirující za měsíc = riziko.

**Jak zavřít:** 2FA + registry lock u registrátora, DNSSEC, e-mailová notifikace na změny
DNS, monitoring CT logů, staging za Basic auth + `noindex`, zálohy **mimo** hosting,
a hlavně **vědět, kdo má k čemu přístup**.

---

## 8. G — Server: výpisy adresářů, zálohy, staré soubory

**Kudy:** hosting s PHP a starou konfigurací.

**Jak by to šlo:**

1. **Directory listing** — `/editorweb/filemanager/files/` bez `Options -Indexes` vypíše
   všechny nahrané soubory. Útočník nemusí hádat názvy, jen prochází a stahuje, co najde
   (fotky, PDF, smlouvy, faktury).
2. **Zálohy a dočasné soubory** — `web.zip`, `backup.sql`, `db.sql.gz`, `index.php.bak`,
   `config.php.old`, `.env`. Boti tyhle názvy zkoušejí automaticky. Pokud některý existuje,
   máte na disku databázi s hešy hesel — a ty se dají lámat offline.
3. **Neznámé soubory v uploadu** — když tam už někdo dřív nahrál skript, poznáte to jen
   podle data a obsahu.
4. **Zastaralé PHP** — stará verze interpretu má vlastní zranitelnosti nezávislé na webu.

**Jak ověřit:** zkuste `…/editorweb/filemanager/files/` (má vrátit 403), dále
`…/backup.zip`, `…/web.zip`, `…/db.sql`, `…/index.php.bak`, `…/.env`, `…/phpinfo.php` —
všechno má vracet 404/403. Nástroj `gobuster`/`ffuf` na vlastním webu projde stovky názvů
za minutu (s povolením).

**Jak zavřít:** `.htaccess` (`Options -Indexes`, deny na archivy) — už je v repu, ale musí
se nasadit na server; zkontrolovat upload adresář; aktualizovat PHP; zálohy držet mimo
`DocumentRoot`.

---

## 9. H — Kontaktní formulář jako zbraň

**Kudy:** formulář na každé stránce.

**Jak by to šlo:**

1. **Injektáž e-mailových hlaviček** — pokud PHP vezme hodnotu z pole „e-mail“ a dá ji do
   `From:`/`Reply-To:` bez validace, útočník tam vloží `Bcc:` s tisíci adres a váš server
   se stane **rozesílačem spamu** (a vaše doména skončí na blacklistech).
2. **Spam a mailbombing** — bez rate-limitu a bez serverového ověření reCAPTCHA může bot
   posílat tisíce zpráv denně. Zaplní schránku, zneplatní e-mail (blacklist), znechutí
   obchodní komunikaci.
3. **Nahrání velkých souborů** — bez limitu zaplní disk (DoS).
4. **Cross-site POST** — bez CSRF tokenu jde formulář odeslat z cizí stránky.

**Jak ověřit:** pošlete formulář s e-mailem obsahujícím nový řádek (v běžném poli to
prohlížeč nedovolí, ale `curl` ano) a sledujte, zda dorazí kopie na jinou adresu. Dále
pošlete 10 zpráv rychle za sebou a sledujte, zda vás to zastaví.

**Jak zavřít:** validace a escapování vstupů, ověření reCAPTCHA na serveru, rate-limit
per IP, honeypot, limit velikosti a počtu příloh, `From:` **pevně** na vlastní doménu
(neverifikovat z uživatelského vstupu), CSRF token, přílohy ukládat mimo webroot.

---

## 10. J — Interní přístupy (nejčastěji opomíjené)

- **Bývalý zaměstnanec** má ještě účet v CMS nebo FTP. V auditu je vidět, že firma v roce
  2019 měnila majitele — kdo všechno měl přístup tehdy?
- **Agentura** má přístup k hostingu i GTM. Co se stane, když spolupráce skončí?
- **Sdílené heslo** „firma2020“ používá pět lidí a nikdo ho nemění.
- **Přístupy v plaintextu** v poznámkách, v Excelu na síti, v e-mailu „heslo k FTP“.
- **Externí účetní / IT podpora** s trvalým přístupem, který už nikdo nepotřebuje.

**Jak zavřít:** seznam všech účtů (CMS, FTP, SSH, hosting, doména, GTM, Google, e-mail)
s vlastníkem a datem posledního použití; hromadná rotace hesel; 2FA všude, kde to jde;
okamžité odebrání přístupů při odchodu; password manager; zásada „žádná hesla v e-mailu“.

---

## 11. Tři realistické řetězy (jak se to skládá dohromady)

**Řetěz 1 — bez jediného technického exploitu (nejpravděpodobnější)**

```
phishing e-mail na obchod@ → heslo do CMS (použité i jinde)
   → přihlášení do /editorweb/ → file manager → nahrání skriptu
   → převzetí serveru → skryté přesměrování zákazníků
```

Žádná zranitelnost v kódu — jen lidský faktor a chybějící 2FA. Proto je K2 a D výš než
„zajímavé“ CVE.

**Řetěz 2 — XSS na veřejné části → admin**

```
odkaz /vyhledavani/?q=<vložený skript> → klikne správce
   → skript jedná jako správce v CMS (stejná doména) → přidá si účet → hotovo
```

Řeší se oddělením administrace na jinou doménu + CSP + `HttpOnly`.

**Řetěz 3 — dodavatel**

```
prolomený e-mail někoho z agentury → přístup do GTM/hostingu
   → skript do všech stránek → sběr dat z formulářů, tichý redirect
```

Nikdo nic nenahraje na server, v souborech se nic nezmění, a přesto tečou data. Ověřuje se
jen pohledem do GTM a do logů.

---

## 12. Co byste měli vidět, když se něco děje

| Signál | Co to znamená |
|---|---|
| nové soubory v `/editorweb/filemanager/files/` (zejména „divné“ přípony) | někdo nahrál obsah |
| neznámý soubor `.php` kdekoliv v uploadu nebo v kořeni | webshell |
| nový uživatel v CMS, nové pravidlo v GTM, nový záznam v DNS | převzetí účtu |
| nestandardní odchozí e-maily, bounce, stížnosti na spam | zneužití formuláře / schránky |
| nárůst 5xx, změna velikosti stránek, `Last-Modified` bez vašeho zásahu | neoprávněná změna |
| varování v Google Search Console („hacked site“, „deceptive pages“) | index už viděl problém |
| nový certifikát na doménu v CT logu, který jste nevydali | DNS/TLS útok |
| hlášení od zákazníků „prohlížeč mě varuje“ | už je pozdě, ale ještě jde reagovat |

**Základní hygiena, která tyhle signály zachytí:** mít zapnuté e-mailové alerty z hostingu,
týdenní kontrolu upload adresáře, Google Search Console (a odebraný neznámý token!),
monitoring dostupnosti a **zálohy, u kterých jste si jisti, že je umíte obnovit**.

---

## 13. Prioritizace podle „cena / užitek“

| Kdy | Co | Proč zrovna tohle |
|---|---|---|
| **dnes** | Ověřit `upload.php`, 2FA na CMS, omezit Maps klíč, odebrat cizí Search Console token | největší dopad za nejmenší práci |
| **tento týden** | DMARC `p=reject` + SPF + DKIM, nasadit `.htaccess`, revize účtů (kdo má co) | zavře phishing i tichou cestu |
| **tento měsíc** | Nové zásady OÚ, serverová validace formuláře, oddělení administrace | legislativa + trvalé riziko |
| **tento kvartál** | Upgrade jQuery/Materialize, CSP s reportem, monitoring, školení, zálohy a test obnovy | dluh, který jinak zůstane |

---

*Tento dokument popisuje cesty, ne postupy zneužití. Konkrétní ověřování dělejte na vlastní
infrastruktuře, ideálně nejdřív na kopii (staging), a s vědomím, že u zásahů do CMS/hostingu
je vhodné mít po ruce zálohu.*

(function() {
    // Get GTM ID from the script's query parameters
    var scriptTag = document.currentScript;
    var queryParams = new URLSearchParams(scriptTag ? scriptTag.src.split('?')[1] : '');
    var gtmId = queryParams.get('gtm') || 'GTM-XXXXXXX'; // Default GTM ID if not provided

    // Google Consent Mode default settings
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_personalization': 'denied',
        'marketing_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied',
        'security_storage': 'denied'
    });

    // Load Google Tag Manager script dynamically
    function loadGTM() {
        if (window.gtmDidLoad) return;
        window.gtmDidLoad = true;
        
        var gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
        document.head.appendChild(gtmScript);
    }

    // Update consent mode based on user's choice
    function updateConsent(analyticsConsent, marketingConsent) {
        gtag('consent', 'update', {
            'analytics_storage': analyticsConsent,
            'ad_storage': marketingConsent,
            'ad_personalization': marketingConsent,
            'marketing_storage': marketingConsent
        });
        
        // Načteme GTM, pokud byl udělen alespoň nějaký souhlas (nebo i pokud nebyl, GTM si s tím poradí)
        loadGTM();
    }

    // Utility function to set a cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    // Utility function to get a cookie by name
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Function to send consent data to the backend
    function sendConsentData(analyticsConsent, marketingConsent) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://getup.cz/cookie-endpoint.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Zde můžete zpracovat odpověď, pokud je potřeba
            }
        };
        xhr.send(`analyticsConsent=${analyticsConsent}&marketingConsent=${marketingConsent}&domain=${window.location.hostname}`);
        fetchConsentStatistics();
    }

    // Fetch and display consent statistics from the server
    function fetchConsentStatistics() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://getup.cz/cookie-stats-endpoint.php?domain='+window.location.hostname, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var stats = JSON.parse(xhr.responseText);
                console.log('Consent Statistics:', stats);
            }
        };
        xhr.send();
    }

    // Get the HTML <html> tag's lang attribute for language detection or use browser language
    var langCode = document.documentElement.lang || navigator.language || 'cs'; // Default to Czech
    langCode = langCode.split('-')[0];

    // Translation dictionary for multiple languages
    // --- AKTUALIZOVÁNO O NOVÉ TEXTY PODLE EUUCP ---
    var translations = {
        en: {
            title: "These sites use cookies",
            // --- AKTUALIZOVÁNO (PRVNÍ VRSTVA) ---
            message: "These websites use essential cookies to ensure their proper functioning and tracking cookies to understand how you interact with them. With your consent, your data may also be used for personalization of ads. By clicking 'Allow all', you also consent to Google's use of data as described here: <a href='https://business.safety.google/privacy/' target='_blank' rel='noopener' style='color: inherit; text-decoration: underline;'>How Google uses data</a>.",
            detailedSettings: "Detailed settings",
            detailedTitle: "Detailed settings",
            // --- AKTUALIZOVÁNO (DRUHÁ VRSTVA - VYZNAČENÁ ČÁST) ---
            detailedMessage: "We use cookies to ensure basic website functions and to improve user comfort. With your consent, your personal data/Cookies may be used for personalization of ads. Google will use your personal data when you give consent on this site. Find out more here: <a href='https://business.safety.google/privacy/' target='_blank' rel='noopener' style='color: inherit; text-decoration: underline;'>How Google uses data</a>.",
            necessary: "Strictly necessary cookies",
            necessaryDesc: "These cookies are necessary for the proper functioning of the website. For example, anonymous user verification.",
            analytical: "Analytical data",
            analyticalDesc: "Cookies used for analysis help collect data that allow services to understand how users interact with a particular service. This information helps services improve content and build better features that enhance the user experience.",
            analyticalDetail: "For analytical purposes, we track, for example, the length of the visit.",
            marketing: "Marketing data",
            marketingDesc: "Marketing cookies help us personalize content and ads directly for you and analyze traffic.",
            marketingDetail1: "Allows storage (e.g., cookies) related to advertising.",
            marketingDetail2: "Sets consent for sending user data to Google for advertising purposes.",
            marketingDetail3: "Sets consent for personalized advertising.",
            agree: "Allow all",
            reject: "Only necessary",
            save: "Confirm current selection",
            cookieName: "Name",
            service: "Service",
            description: "Description",
            validity: "Validity"
        },
        cs: {
            title: "Tyto stránky používají soubory cookie",
            // --- AKTUALIZOVÁNO (PRVNÍ VRSTVA) ---
            message: "Tyto webové stránky používají základní soubory cookie k zajištění svého správného fungování a sledovací soubory cookie k pochopení toho, jak s nimi pracujete. S vaším souhlasem mohou být vaše údaje použity také pro personalizaci reklam. Kliknutím na 'Povolit všechny' souhlasíte i s využitím údajů společností Google, jak je popsáno zde: <a href='https://business.safety.google/privacy/' target='_blank' rel='noopener' style='color: inherit; text-decoration: underline;'>Jak Google využívá data</a>.",
            detailedSettings: "Podrobné nastavení cookies",
            detailedTitle: "Podrobné nastavení cookies",
            // --- AKTUALIZOVÁNO (DRUHÁ VRSTVA - VYZNAČENÁ ČÁST) ---
            detailedMessage: "Používáme cookies k zajištění základních funkcí webu a ke zlepšení pohodlí uživatele. S vaším souhlasem mohou být vaše osobní údaje/cookies použity pro personalizaci reklam. Společnost Google bude využívat vaše osobní údaje, když udělíte souhlas na tomto webu. Více informací naleznete zde: <a href='https://business.safety.google/privacy/' target='_blank' rel='noopener' style='color: inherit; text-decoration: underline;'>Jak Google využívá data</a>.",
            necessary: "Nutně nezbytné cookies",
            necessaryDesc: "Tyto cookies jsou nezbytné pro správné fungování webu. Například anonymní ověření uživatele.",
            analytical: "Analytické údaje",
            analyticalDesc: "Cookies používané pro analýzy pomáhají sbírat údaje, které umožňují službám pochopit, jak uživatelé danou službu používají. Díky těmto informacím mohou služby vylepšovat obsah a vyvíjet lepší funkce, které zlepšují zkušenost uživatele.",
            analyticalDetail: "Je pro analytické účely, sledujeme například délku návštěvy.",
            marketing: "Reklamní údaje",
            marketingDesc: "Marketingové cookies nám pomáhají personalizovat obsah a reklamy přímo pro vás a analyzovat návštěvnost.",
            marketingDetail1: "Povoluje ukládání (např. cookies) související s reklamou.",
            marketingDetail2: "Nastavuje souhlas s odesíláním uživatelských dat Googlu pro reklamní účely.",
            marketingDetail3: "Nastavuje souhlas s personalizovanou reklamou.",
            agree: "Povolit všechny",
            reject: "Pouze nezbytné",
            save: "Potvrdit aktuální výběr",
            cookieName: "Název",
            service: "Služba / Doména",
            description: "Účel / Popis",
            validity: "Platnost"
        }
        // ... Zde ponecháme vaše další jazyky (es, fr, de), pro zkrácení je vynechávám
        // Můžete je doplnit podle 'en' nebo 'cs' šablony
    };

    var translation = translations[langCode] || translations['cs']; // Default to Czech if lang not found

    // --- NOVÉ: CSS STYLY PRO NOVÝ VZHLED ---
    function injectCSS() {
        var css = `
            .cookie-backdrop {
                position: fixed; z-index: 9998; background-color: rgba(0,0,0,0.5); 
                width: 100%; height: 100%; top: 0; left: 0;
            }
            .cookie-common {
                background-color: #fff; padding: 25px; max-width: 550px;
                text-align: left; border-radius: 10px; width: 90%; 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                color: #333;
                line-height: 1.5;
            }
            .cookie-common h2 {
                margin-top: 0; margin-bottom: 15px; font-size: 24px; font-weight: 600;
            }
            .cookie-common p {
                margin-top: 0; margin-bottom: 20px; font-size: 16px;
            }
            /* --- Upraveno pro lepší zobrazení odkazu --- */
            .cookie-common p a {
                color: #0056b3; /* Nebo jiná barva odkazu, pokud 'inherit' není žádoucí */
                text-decoration: underline;
                font-weight: 500;
            }
            .cookie-common-buttons {
                display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 15px;
            }
            .cookie-common-buttons button {
                flex: 1; padding: 12px 15px; border: none; border-radius: 5px; 
                cursor: pointer; font-size: 16px; font-weight: 500;
                min-width: 150px;
                transition: background-color 0.2s ease, box-shadow 0.2s ease;
            }
            /* Styly tlačítek */
            #cookieBannerAgree, #cookieModalAgree {
                background-color: #343a40; color: white; /* Tmavé dle obr. 1 */
            }
            #cookieBannerReject, #cookieModalReject {
                background-color: #343a40; color: white; /* Tmavé dle obr. 1 */
            }
            #cookieBannerDetailed, #cookieModalSave {
                background-color: #f8f9fa; color: #333; border: 1px solid #ddd; /* Světlé dle obr. 1 */
            }
            #cookieBannerAgree:hover, #cookieModalAgree:hover { background-color: #23272b; }
            #cookieBannerReject:hover, #cookieModalReject:hover { background-color: #23272b; }
            #cookieBannerDetailed:hover, #cookieModalSave:hover { background-color: #e2e6ea; }

            /* Banner (Obrázek 1) */
            #cookieConsentBanner {
                position: fixed; z-index: 9999; bottom: 20px; left: 50%; 
                transform: translateX(-50%);
                max-width: 900px; /* Širší banner */
            }
            #cookieConsentBanner .cookie-common-buttons {
                justify-content: center; /* Tlačítka vedle sebe */
            }

            /* Detailní modál (Obrázek 2) */
            #cookieConsentModal {
                position: fixed; z-index: 10000; left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                max-width: 700px; /* Širší modál pro detaily */
                max-height: 90vh;
                overflow-y: auto;
            }
            #cookieModalClose {
                position: absolute; top: 15px; right: 20px; font-size: 30px; 
                color: #888; cursor: pointer; line-height: 1;
                border: none; background: transparent; padding: 0;
            }
            #cookieModalClose:hover { color: #333; }

            /* Kategorie (Akordeon) */
            .cookie-category {
                border: 1px solid #eee; border-radius: 5px; margin-bottom: 10px;
            }
            .cookie-category-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px; cursor: pointer;
                background-color: #f9f9f9;
            }
            .cookie-category-header h3 {
                margin: 0; font-size: 18px; font-weight: 600;
            }
            .cookie-category-header-left {
                display: flex; align-items: center;
                gap: 15px;
            }
            .cookie-category-header-left svg { /* Šipka pro akordeon */
                width: 14px; height: 14px;
                transition: transform 0.2s ease;
            }
            .cookie-category.active .cookie-category-header-left svg {
                transform: rotate(180deg);
            }
            .cookie-category-content {
                display: none;
                padding: 15px; border-top: 1px solid #eee;
            }
            .cookie-category.active .cookie-category-content {
                display: block;
            }
            .cookie-category-content p {
                font-size: 15px; margin-bottom: 10px;
            }
            .cookie-category-content p.detail-item {
                font-size: 14px; padding-left: 20px; position: relative;
            }
             .cookie-category-content p.detail-item::before { /* Odrážka */
                content: '○'; position: absolute; left: 0; top: 0;
            }

            /* Toggle switch (Přepínač) */
            .cookie-toggle {
                position: relative; display: inline-block; width: 50px; height: 26px;
            }
            .cookie-toggle input {
                opacity: 0; width: 0; height: 0;
            }
            .cookie-slider {
                position: absolute; cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: #ccc;
                border-radius: 26px;
                transition: .4s;
            }
            .cookie-slider:before {
                position: absolute; content: "";
                height: 20px; width: 20px;
                left: 3px; bottom: 3px;
                background-color: white;
                border-radius: 50%;
                transition: .4s;
            }
            .cookie-toggle input:checked + .cookie-slider {
                background-color: #858585; /* Zašedlá dle obr. 2 */
            }
            .cookie-toggle input:checked + .cookie-slider:before {
                transform: translateX(24px);
            }
            .cookie-toggle input:disabled + .cookie-slider {
                background-color: #e9e9e9;
                cursor: not-allowed;
            }
            .cookie-toggle input:checked:disabled + .cookie-slider {
                background-color: #b0d0b0; /* Příklad pro disabled-on */
            }
            
            /* Tabulka cookies */
            .cookie-table {
                width: 100%; border-collapse: collapse; margin-top: 15px;
                font-size: 14px;
            }
            .cookie-table th, .cookie-table td {
                border: 1px solid #ddd; padding: 8px; text-align: left;
            }
            .cookie-table th {
                background-color: #f2f2f2;
            }

            /* Ikona pro znovuotevření */
            #cookieIcon {
                position: fixed; bottom: 1px; left: 1px; background-color: transparent; 
                padding: 10px; border-radius: 50%; cursor: pointer; z-index: 9997;
            }
            #cookieIcon img {
                width: 40px; height: 40px;
            }
        `;
        var styleEl = document.createElement('style');
        styleEl.id = 'cookie-consent-styles';
        styleEl.type = 'text/css';
        if (styleEl.styleSheet) {
            styleEl.styleSheet.cssText = css;
        } else {
            styleEl.appendChild(document.createTextNode(css));
        }
        document.head.appendChild(styleEl);
    }

    // --- NOVÉ: Funkce pro zavření všech oken ---
    function closeModals() {
        var banner = document.getElementById('cookieConsentBanner');
        var modal = document.getElementById('cookieConsentModal');
        var backdrop = document.getElementById('cookieBackdrop');
        if (banner) banner.remove();
        if (modal) modal.remove();
        if (backdrop) backdrop.remove();
    }
    
    // --- NOVÉ: Pomocné funkce pro akce ---
    function handleAcceptAll() {
        setCookie('cookieConsent', 'accepted_all', 365);
        setCookie('analyticsConsent', 'granted', 365);
        setCookie('marketingConsent', 'granted', 365);
        updateConsent('granted', 'granted');
        sendConsentData('granted', 'granted');
        closeModals();
    }

    function handleRejectAll() {
        setCookie('cookieConsent', 'rejected_all', 365);
        setCookie('analyticsConsent', 'denied', 365);
        setCookie('marketingConsent', 'denied', 365);
        updateConsent('denied', 'denied');
        sendConsentData('denied', 'denied');
        closeModals();
    }
    
    function handleSaveChoices() {
        var analyticsConsent = document.getElementById('analyticsCookiesToggle').checked ? 'granted' : 'denied';
        var marketingConsent = document.getElementById('marketingCookiesToggle').checked ? 'granted' : 'denied';
        setCookie('cookieConsent', 'custom', 365);
        setCookie('analyticsConsent', analyticsConsent, 365);
        setCookie('marketingConsent', marketingConsent, 365);
        updateConsent(analyticsConsent, marketingConsent);
        sendConsentData(analyticsConsent, marketingConsent);
        closeModals();
    }


    // --- PŘEPRACOVÁNO: Zobrazení detailního modálu (Obrázky 2 a 3) ---
    function showConsentModal() {
        // Zavřeme banner, pokud je otevřený
        var banner = document.getElementById('cookieConsentBanner');
        if (banner) banner.remove();
        
        // Zabráníme duplicitnímu otevření
        if (document.getElementById('cookieConsentModal')) return;

        var analyticsChecked = getCookie('analyticsConsent') === 'granted' ? 'checked' : '';
        var marketingChecked = getCookie('marketingConsent') === 'granted' ? 'checked' : '';
        
        var modalHtml = `
            <div class="cookie-backdrop" id="cookieBackdrop"></div>
            <div id="cookieConsentModal" class="cookie-common">
                <button id="cookieModalClose" title="Zavřít">&times;</button>
                <h2>${translation.detailedTitle}</h2>
                <p>${translation.detailedMessage}</p> <div class="cookie-categories">
                    <div class="cookie-category active"> <div class="cookie-category-header">
                            <div class="cookie-category-header-left">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/></svg>
                                <h3>${translation.necessary}</h3>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-slider"></span>
                            </label>
                        </div>
                        <div class="cookie-category-content" style="display: block;"> <p>${translation.necessaryDesc}</p>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                             <div class="cookie-category-header-left">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/></svg>
                                <h3>${translation.analytical}</h3>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analyticsCookiesToggle" ${analyticsChecked}>
                                <span class="cookie-slider"></span>
                            </label>
                        </div>
                        <div class="cookie-category-content">
                            <p>${translation.analyticalDetail}</p>
                            <p>${translation.analyticalDesc}</p>
                            <table class="cookie-table">
                                <thead>
                                    <tr>
                                        <th>${translation.cookieName}</th>
                                        <th>${translation.service}</th>
                                        <th>${translation.description}</th>
                                        <th>${translation.validity}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>_ga</td>
                                        <td>Google Analytics</td>
                                        <td>Cookie nastaven nástrojem Google Analytics</td>
                                        <td>12 dní</td>
                                    </tr>
                                    <tr>
                                        <td>_gid</td>
                                        <td>Google Analytics</td>
                                        <td>Cookie nastaven nástrojem Google Analytics</td>
                                        <td>Do zavření stránky</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                             <div class="cookie-category-header-left">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/></svg>
                                <h3>${translation.marketing}</h3>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="marketingCookiesToggle" ${marketingChecked}>
                                <span class="cookie-slider"></span>
                            </label>
                        </div>
                        <div class="cookie-category-content">
                            <p class="detail-item">${translation.marketingDetail1}</p>
                            <p class="detail-item">${translation.marketingDetail2}</p>
                            <p class="detail-item">${translation.marketingDetail3}</p>
                            <p>${translation.marketingDesc}</p>
                             <table class="cookie-table">
                                <thead>
                                    <tr>
                                        <th>${translation.cookieName}</th>
                                        <th>${translation.service}</th>
                                        <th>${translation.description}</th>
                                        <th>${translation.validity}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>IDE</td><td>Google / DoubleClick.net</td><td>Cookie pro cílení a zobrazování reklam Google na webech třetích stran. Obsahuje ID uživatele a preferenční údaje.</td><td>1 rok (v EU)</td></tr>
                                    <tr><td>sid</td><td>Sklik (Seznam.cz)</td><td>Identifikační cookie reklamního systému Sklik (Seznam.cz) používaná pro retargeting a měření konverzí.</td><td>30 dní</td></tr>
                                    <tr><td>sznc</td><td>Seznam.cz</td><td>Cookie společnosti Seznam.cz sloužící k obecnému rozpoznání uživatele napříč službami Seznamu.</td><td>Cca 18 měsíců</td></tr>
                                    <tr><td>_fbp</td><td>Facebook (Meta) Pixel</td><td>Cookie používaná Facebookem (Meta) k doručování reklamních produktů a měření konverzí.</td><td>90 dní</td></tr>
                                    <tr><td>_fbc</td><td>Facebook (Meta) Pixel</td><td>Obsahuje informace o posledním kliknutí na reklamu Facebook (Meta), používá se pro atribuci konverzí.</td><td>90 dní</td></tr>
                                    <tr><td>MUID</td><td>Microsoft / Bing Ads</td><td>Unikátní identifikátor uživatele používaný společností Microsoft pro personalizaci a cílení reklamy.</td><td>1 rok</td></tr>
                                    <tr><td>_uetvid</td><td>Microsoft / Bing Ads</td><td>Cookie univerzálního sledování událostí (UET) od Microsoft Advertising pro sledování konverzí a remarketing.</td><td>1 rok</td></tr>
                                    <tr><td>_uetsid</td><td>Microsoft / Bing Ads</td><td>Cookie univerzálního sledování událostí (UET) od Microsoft Advertising. Identifikuje unikátní relaci (návštěvu).</td><td>30 minut</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="cookie-common-buttons">
                    <button id="cookieModalAgree">${translation.agree}</button>
                    <button id="cookieModalReject">${translation.reject}</button>
                    <button id="cookieModalSave">${translation.save}</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // --- Přidání event listenerů pro modál ---
        
        // Tlačítka
        document.getElementById('cookieModalAgree').addEventListener('click', handleAcceptAll);
        document.getElementById('cookieModalReject').addEventListener('click', handleRejectAll);
        document.getElementById('cookieModalSave').addEventListener('click', handleSaveChoices);
        
        // Zavírání
        document.getElementById('cookieModalClose').addEventListener('click', closeModals);
        document.getElementById('cookieBackdrop').addEventListener('click', closeModals);

        // Akordeon
        document.querySelectorAll('.cookie-category-header').forEach(function(header) {
            header.addEventListener('click', function(e) {
                // Nebudeme reagovat na kliknutí na samotný přepínač
                if (e.target.closest('.cookie-toggle')) {
                    return;
                }
                var category = header.closest('.cookie-category');
                // Přepneme 'active' třídu
                category.classList.toggle('active');
                // Zobrazíme/skryjeme obsah
                var content = category.querySelector('.cookie-category-content');
                if (category.classList.contains('active')) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    }

    // --- NOVÉ: Zobrazení hlavního banneru (Obrázek 1) ---
    function showConsentBanner() {
        if (document.getElementById('cookieConsentBanner')) return; // Zabráníme duplikaci

        var bannerHtml = `
            <div id="cookieConsentBanner" class="cookie-common">
                <h2>${translation.title}</h2>
                <p>${translation.message}</p> <div class="cookie-common-buttons">
                    <button id="cookieBannerAgree">${translation.agree}</button>
                    <button id="cookieBannerReject">${translation.reject}</button>
                    <button id="cookieBannerDetailed">${translation.detailedSettings}</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', bannerHtml);

        // Event listenery pro banner
        document.getElementById('cookieBannerAgree').addEventListener('click', handleAcceptAll);
        document.getElementById('cookieBannerReject').addEventListener('click', handleRejectAll);
        document.getElementById('cookieBannerDetailed').addEventListener('click', function() {
            showConsentModal(); // Otevře detailní modál
        });
    }

    // --- UPRAVENO: Zobrazení ikony pro znovuotevření ---
    function showCookieIcon() {
        var cookieIconHtml = `
            <div id="cookieIcon" title="${translation.detailedTitle}">
                <img src="https://getup.cz/cookieicon.png" alt="Cookie Icon">
            </div>
        `;
        if (!document.getElementById('cookieIcon')) {
            document.body.insertAdjacentHTML('beforeend', cookieIconHtml);
        }

        document.getElementById('cookieIcon').addEventListener('click', function() {
            showConsentModal(); // Ikona nyní otevírá detailní modál
        });
    }

    // --- UPRAVENO: Hlavní logika spuštění ---
    
    // Vložíme CSS styly ihned
    injectCSS();

    if (!getCookie('cookieConsent')) {
        // Pokud souhlas neexistuje, zobrazíme banner po načtení DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                showConsentBanner(); // Zobrazíme banner místo modálu
                showCookieIcon();
            });
        } else {
            showConsentBanner();
            showCookieIcon();
        }
    } else {
        // Pokud již souhlas existuje, pouze aktualizujeme stav a zobrazíme ikonu
        var analyticsConsent = getCookie('analyticsConsent') || 'denied';
        var marketingConsent = getCookie('marketingConsent') || 'denied';
        updateConsent(analyticsConsent, marketingConsent);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showCookieIcon);
        } else {
            showCookieIcon();
        }
    }
})();
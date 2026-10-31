/* --------------------------------------------------------------
   WIDGET OTEVÍRACÍ DOBA - NABYTEK MIGRO
   Popis: Externí skript, který vygeneruje vysouvací panel.
   --------------------------------------------------------------
*/

(function () {

    // 1. BLOK - LOGIKA DATUMU
    // -----------------------------------------------------------
    var today = new Date();

    // Nastavení data expirace pro garanci doručení: 18. prosince 2025, 12:00:00
    var expiryDateDelivery = new Date('2025-12-18T12:00:00');
    // Nastavení data expirace pro vánoční režim: 4. ledna 2026, 23:59:59
    var expiryDateXmas = new Date('2026-01-04T23:59:59');

    var showDeliveryGuarantee = today <= expiryDateDelivery;
    var isXmasMode = today <= expiryDateXmas;

    // Detekce domeny
    var host = window.location.hostname;
    var isPrivesy = host.indexOf('privesyskladem.cz') !== -1;
    var isCfmoto = host.indexOf('cfmotoservis.cz') !== -1;

    var phoneNumber = isPrivesy ? '466 766 193' : '608 988 809';
    var themeColor = isCfmoto ? '#00B8D4' : '#7dae41';


    // 2. BLOK - KONFIGURACE
    // -----------------------------------------------------------
    var config = {
        storageKey: 'nabytekmigroWidgetSeen_v1',
        autoCloseTime: 5000
    };

    // 3. BLOK - HTML OBSAH (Dynamicky podle datumu)
    // -----------------------------------------------------------
    var widgetHtml = `
        <div id="mc-widget-container" class="mc-widget-closed">
            <div id="mc-widget-tab" onclick="NabytekmigroWidget.toggle()">
                <span class="vertical-text">Otevírací doba</span>
            </div>

            <div class="mc-widget-content">
                <div class="mc-header">
                    <div style="display:flex; align-items:center;">
                        <!-- Logo removed -->
                        <a href="https://www.google.com/maps/search/?api=1&query=Rosice+160,+538+34" target="_blank" style="text-decoration:none; color:#333;" title="Navigovat (Google Maps)">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                           <span style="margin-left: 8px; font-weight: bold;">Navigovat</span>
                        </a>
                    </div>
                </div>

                <div class="mc-info-box">
                    <p><strong>Rosice 160</strong><br>
                    538 34, Rosice u Chrasti<br>
                    <strong>${phoneNumber}</strong></p>
                </div>

                ${showDeliveryGuarantee ? `
                <div class="mc-delivery-guarantee">
                    <span>Garance doručení do Vánoc<br><small>zboží skladem doručíme do vánoc do 18.12. 12:00</small></span>
                </div>
                ` : ''}

                <div class="mc-tabs">
                    ${isXmasMode ?
            `<button class="tab-link active" onclick="NabytekmigroWidget.switchTab(event, 'sw-vanocni')">Vánoční</button>`
            : ''
        }
                    <button class="tab-link ${!isXmasMode ? 'active' : ''}" onclick="NabytekmigroWidget.switchTab(event, 'sw-bezna')">Běžná</button>
                </div>

                ${isXmasMode ? `
                <div id="sw-vanocni" class="tab-content" style="display: block;">
                    <div class="scrollable-area">
                        <table class="sw-table">
                           <tr><td>Zavřeno od 22.12. - 02. 01</td></tr>
                           <tr><td>Zpět se budeme těšit od 05. 01. 2026</td></tr>
                           <tr><td style="padding-top:10px;">V neodkladných případech volejte<br><strong>${phoneNumber}</strong></td></tr>
                        </table>
                    </div>
                </div>
                ` : ''}

                <div id="sw-bezna" class="tab-content" style="display: ${isXmasMode ? 'none' : 'block'};">
                    <div class="scrollable-area">
                        <table class="sw-table">
                            <tr><td><strong>Pracovní doba Po-Pá</strong></td><td>od 6:00 do 14:30</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 4. BLOK - CSS STYLY
    // -----------------------------------------------------------
    var widgetCss = `
        #mc-widget-container {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            right: -340px;
            width: 340px;
            height: auto;
            max-height: 85vh;
            background: #fff;
            box-shadow: -2px 0 15px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: Arial, sans-serif;
            transition: right 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        #mc-widget-container.open { right: 0; }
        #mc-widget-tab {
            position: absolute;
            left: -40px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 140px;
            background: ${themeColor};
            color: #fff;
            cursor: pointer;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        }
        #mc-widget-tab .vertical-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-weight: bold;
            font-size: 14px;
            letter-spacing: 1px;
            transform: rotate(180deg);
        }
        .mc-header {
            background: #ffffff;
            padding: 15px 15px 10px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 8px;
            border-bottom: 1px solid #eee;
        }
        .mc-header img {
            height: 40px;
            width: auto;
            /* 
                Pokud cheš logo trochu zvětšit, uprav height výše,
                nebo nastav width: auto a max-height dle potřeby.
            */
        }
        .mc-info-box {
            padding: 10px 15px;
            background: #f9f9f9;
            font-size: 13px;
            color: #555;
            border-bottom: 1px solid #eee;
            line-height: 1.4;
        }
        .mc-delivery-guarantee {
            background: ${themeColor};
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            line-height: 1.3;
        }
        .mc-delivery-guarantee small {
            font-weight: normal;
            font-size: 0.9em;
        }
        
        .mc-tabs {
            display: flex;
            background: #f8f8f8;
            border-bottom: 1px solid #ddd;
        }
        .mc-tabs button {
            flex: 1;
            padding: 12px;
            border: none;
            background: inherit;
            cursor: pointer;
            font-weight: bold;
            color: #666;
            transition: 0.3s;
            font-size: 14px;
        }
        .mc-tabs button:hover { background: #eee; color: #333; }
        .mc-tabs button.active {
            background: #fff;
            color: #000;
            border-bottom: 2px solid #333;
            border-top: 1px solid transparent; 
        }
        .tab-content { padding: 15px; background: #fff; }
        .scrollable-area { max-height: 60vh; overflow-y: auto; scrollbar-width: thin; }
        .sw-table { width: 100%; border-collapse: collapse; font-size: 14px; color: #333; }
        .sw-table td { padding: 8px 4px; border-bottom: 1px solid #f0f0f0; }
        .sw-table tr:last-child td { border-bottom: none; }
        h4 { margin: 0 0 15px 0; font-size: 16px; color: #333; }
        @media (max-width: 400px) {
            #mc-widget-container { width: 90%; right: -90%; }
            #mc-widget-container.open { right: 0; }
        }
    `;

    // 5. BLOK - INICIALIZACE A FUNKCE
    // -----------------------------------------------------------
    window.NabytekmigroWidget = {
        init: function () {
            var style = document.createElement('style');
            style.innerHTML = widgetCss;
            document.head.appendChild(style);

            var div = document.createElement('div');
            div.innerHTML = widgetHtml;
            document.body.appendChild(div);

            this.checkState();
        },

        switchTab: function (evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.querySelectorAll('#mc-widget-container .tab-content');
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.querySelectorAll('#mc-widget-container .tab-link');
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            var selectedTab = document.querySelector('#mc-widget-container #' + tabName);
            if (selectedTab) {
                selectedTab.style.display = "block";
            }
            evt.currentTarget.className += " active";
        },

        toggle: function () {
            var container = document.getElementById('mc-widget-container');
            var isOpen = container.classList.contains('open');
            if (isOpen) {
                container.classList.remove('open');
                localStorage.setItem(config.storageKey, 'true');
            } else {
                container.classList.add('open');
            }
        },

        checkState: function () {
            var hasSeen = localStorage.getItem(config.storageKey);
            var container = document.getElementById('mc-widget-container');

            if (!hasSeen) {
                setTimeout(function () {
                    container.classList.add('open');
                }, 1000);
                setTimeout(function () {
                    if (container.classList.contains('open')) {
                        container.classList.remove('open');
                    }
                    localStorage.setItem(config.storageKey, 'true');
                }, config.autoCloseTime + 2000);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { NabytekmigroWidget.init(); });
    } else {
        NabytekmigroWidget.init();
    }

})();

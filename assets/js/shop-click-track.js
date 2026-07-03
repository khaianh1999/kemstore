/**
 * KemStore — track click Shopee / TikTok Shop → Telegram.
 * Dùng trên trang chủ (index.html + Vue) và blog/*.html
 */
(function (global) {
    'use strict';

    var telegram = {
        botToken: '7494446429:AAHTn5fYI0EyxbuUj0HNfOY0Ijy1zYSWM1Q',
        chatId: '-1002187943904'
    };

    var pageSession = { startedAt: null, maxScrollPct: 0 };
    var extraContextFn = null;
    var clickHandler = null;
    var scrollHandler = null;
    var initialized = false;

    function detectDevice() {
        try {
            var userAgent = global.navigator.userAgent;
            var platform = global.navigator.platform;
            var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
            var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
            var iosPlatforms = ['iPhone', 'iPad', 'iPod'];
            var os = null;

            if (macosPlatforms.indexOf(platform) !== -1) os = 'Mac OS';
            else if (iosPlatforms.indexOf(platform) !== -1) os = 'iOS';
            else if (windowsPlatforms.indexOf(platform) !== -1) os = 'Windows';
            else if (/Android/.test(userAgent)) os = 'Android';
            else if (!os && /Linux/.test(platform)) os = 'Linux';

            return os || 'Unknown';
        } catch (e) {
            return 'Lỗi check thiết bị';
        }
    }

    function detectDeviceType() {
        var w = global.innerWidth;
        if (w < 640) return 'Mobile';
        if (w < 1024) return 'Tablet';
        return 'Desktop';
    }

    function detectShopPlatform(href) {
        if (!href || href.charAt(0) === '#') return null;

        try {
            var url = new URL(href, global.location.origin).href.toLowerCase();
            if (url.indexOf('vt.tiktok.com') !== -1 || url.indexOf('shop.tiktok.com') !== -1) return 'tiktok_shop';
            if (url.indexOf('shopee.vn') !== -1) return 'shopee';
        } catch (e) { }

        return null;
    }

    function getPageLabel() {
        var path = global.location.pathname || '';

        if (path.indexOf('/blog/') !== -1) {
            var h1 = document.querySelector('h1');
            var title = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
            if (title) return 'Blog — ' + title.slice(0, 100);
            return 'Blog — ' + path.split('/').pop();
        }

        return 'Trang chủ';
    }

    function getShopClickContext(anchor) {
        var extra = extraContextFn ? extraContextFn() : {};
        var label = (anchor.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Liên kết';

        if (anchor.closest('.shop-float-wrap')) {
            return {
                section: 'Nút nổi',
                label: anchor.getAttribute('aria-label') || 'TikTok Shop nổi',
                product: null
            };
        }

        if (anchor.closest('.shop-box')) {
            var boxTitle = anchor.closest('.shop-box').querySelector('h3');
            return {
                section: 'Shop box — ' + (boxTitle ? boxTitle.textContent.replace(/\s+/g, ' ').trim().slice(0, 50) : 'giữa bài'),
                label: label,
                product: null
            };
        }

        if (anchor.closest('.cta')) {
            return {
                section: 'CTA cuối bài',
                label: label,
                product: null
            };
        }

        if (anchor.closest('.faq')) {
            return {
                section: 'FAQ',
                label: label,
                product: null
            };
        }

        var sectionEl = anchor.closest('section[id], header.site-header, footer, main.wrap');
        var sectionMap = {
            home: 'Trang chủ',
            products: 'Sản phẩm',
            meokem: 'Mèo Kem',
            videos: 'Video',
            voucher: 'Voucher',
            contact: 'Liên hệ',
            blog: 'Blog'
        };

        var sectionId = sectionEl && (sectionEl.id || sectionEl.tagName.toLowerCase());
        var section = (sectionId && sectionMap[sectionId]) || (sectionId === 'wrap' ? 'Nội dung blog' : (sectionId || 'Trang'));

        var productCard = anchor.closest('article');
        var productName = null;

        if (productCard) {
            var heading = productCard.querySelector('h3, h2');
            productName = heading ? heading.textContent.trim() : null;
        }

        if (!productName && extra.productModal && anchor.closest('[role="dialog"]')) {
            return { section: 'Quick view', label: label, product: extra.productModal.name };
        }

        return { section: section, label: label, product: productName };
    }

    function formatDuration(ms) {
        var totalSec = Math.max(0, Math.floor(ms / 1000));
        var min = Math.floor(totalSec / 60);
        var sec = totalSec % 60;
        if (min > 0) return min + ' phút ' + sec + ' giây';
        return sec + ' giây';
    }

    function getScrollPercent() {
        var doc = document.documentElement;
        var total = doc.scrollHeight - global.innerHeight;
        if (total <= 0) return 100;
        return Math.min(100, Math.round((global.scrollY / total) * 100));
    }

    function updatePageScrollDepth() {
        var pct = getScrollPercent();
        if (pct > pageSession.maxScrollPct) pageSession.maxScrollPct = pct;
    }

    function getReferrerLabel() {
        if (!document.referrer) return 'Trực tiếp / bookmark';
        try {
            return new URL(document.referrer).hostname.replace(/^www\./, '');
        } catch (e) {
            return document.referrer.slice(0, 60);
        }
    }

    function getTelegramDateFormat() {
        var date = new Date();
        var pad = function (n) { return n.toString().padStart(2, '0'); };
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
            pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function sendTelegramMessage(text) {
        var url = 'https://api.telegram.org/bot' + telegram.botToken + '/sendMessage';

        var post = function () {
            return global.axios.post(url, {
                chat_id: telegram.chatId,
                text: text
            }).then(function (response) {
                if (!response.data || !response.data.ok) {
                    var err = new Error((response.data && response.data.description) || 'Telegram API error');
                    err.telegram = response.data;
                    throw err;
                }
                return response.data;
            }).catch(function (error) {
                var detail = (error.response && error.response.data && error.response.data.description) || error.message;
                console.error('Telegram error:', detail);
                throw new Error(detail);
            });
        };

        if (global.axios) return post();

        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
            s.async = true;
            s.onload = function () { post().then(resolve).catch(reject); };
            s.onerror = function () { reject(new Error('Không tải được Axios')); };
            document.head.appendChild(s);
        });
    }

    function buildShopClickMessage(platform, href, context) {
        var platformLabel = platform === 'tiktok_shop' ? 'TikTok Shop' : 'Shopee';
        var platformEmoji = platform === 'tiktok_shop' ? '🎵' : '🛍️';
        var startedAt = pageSession.startedAt || Date.now();
        var timeOnSite = formatDuration(Date.now() - startedAt);
        var scrollPct = Math.max(pageSession.maxScrollPct, getScrollPercent());
        var extra = extraContextFn ? extraContextFn() : {};
        var viewport = global.innerWidth + '×' + global.innerHeight;
        var lines = [
            platformEmoji + ' Click ' + platformLabel + ' (KemStore.vn)',
            '📄 Trang: ' + getPageLabel(),
            '📍 Kênh: ' + platformLabel,
            '📌 Vị trí: ' + context.section + ' — "' + context.label + '"'
        ];

        if (context.product) lines.push('🧩 Sản phẩm: ' + context.product);

        lines.push(
            '📱 Thiết bị: ' + detectDevice() + ' · ' + detectDeviceType() + ' · ' + viewport,
            '🌐 Ngôn ngữ: ' + (global.navigator.language || '-'),
            '🔗 Nguồn vào: ' + getReferrerLabel(),
            '⏱️ Trên site: ' + timeOnSite,
            '📊 Cuộn trang: ' + scrollPct + '%'
        );

        if (extra.keyword !== undefined || extra.categoryName !== undefined) {
            lines.push(
                '🔍 Tìm kiếm: ' + (extra.keyword ? '"' + extra.keyword + '"' : '(không)') +
                ' · Danh mục: ' + (extra.categoryName || 'Tất cả')
            );
        }

        if (extra.wishlistCount !== undefined) {
            lines.push('❤️ Yêu thích: ' + extra.wishlistCount + ' sản phẩm');
        }

        lines.push(
            '🔗 URL: ' + href,
            '⏰ Lúc: ' + getTelegramDateFormat()
        );

        return lines.join('\n');
    }

    function reportShopClick(platform, href, anchor) {
        var context = getShopClickContext(anchor);
        var message = buildShopClickMessage(platform, href, context);
        sendTelegramMessage(message).catch(function (err) {
            console.error('Shop click track:', err.message || err);
        });
    }

    function onShopLinkClick(event) {
        var anchor = event.target.closest('a[href]');
        if (!anchor) return;

        var href = anchor.getAttribute('href');
        var platform = detectShopPlatform(href);
        if (!platform) return;

        reportShopClick(platform, href, anchor);
    }

    function onSessionScrollTrack() {
        updatePageScrollDepth();
    }

    function init() {
        if (initialized) return;
        initialized = true;
        pageSession.startedAt = Date.now();
        pageSession.maxScrollPct = getScrollPercent();
        clickHandler = onShopLinkClick;
        scrollHandler = onSessionScrollTrack;
        document.addEventListener('click', clickHandler, true);
        global.addEventListener('scroll', scrollHandler, { passive: true });
    }

    function destroy() {
        if (!initialized) return;
        document.removeEventListener('click', clickHandler, true);
        global.removeEventListener('scroll', scrollHandler);
        clickHandler = null;
        scrollHandler = null;
        initialized = false;
    }

    function setExtraContext(fn) {
        extraContextFn = typeof fn === 'function' ? fn : null;
    }

    global.KemStoreShopTrack = {
        init: init,
        destroy: destroy,
        setExtraContext: setExtraContext
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);

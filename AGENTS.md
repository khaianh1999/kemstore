# KemStore.vn — Hướng dẫn cho AI Agent

Website tĩnh giới thiệu thương hiệu **KemStore.vn** (sticker, văn phòng phẩm, đồ dùng học tập chủ đề **Mèo Kem**). Không có build step, không có backend — deploy qua **GitHub Pages** với domain `kemstore.vn` (file `CNAME`).

---

## Cấu trúc dự án

```
kemstore/
├── .cursor/rules/      # Cursor rules (.mdc) — blog, v.v.
├── index.html          # Trang chủ SPA (~4000 dòng): HTML + CSS + Vue 3 + toàn bộ dữ liệu
├── index.html.bak      # Backup — không chỉnh sửa trừ khi được yêu cầu
├── 404.html            # Trang lỗi (noindex)
├── sitemap.xml         # Sitemap SEO — cập nhật khi thêm blog/trang mới
├── robots.txt
├── CNAME               # kemstore.vn
├── blog/               # 9 bài blog HTML tĩnh, tự chứa CSS
└── assets/images/      # Logo, favicon, ảnh blog (local)
```

**Không có:** `package.json`, framework build, test runner, CI config.

---

## Tech stack

| Thành phần | Cách dùng |
|------------|-----------|
| **Vue 3** | CDN `unpkg.com/vue@3/dist/vue.global.prod.js` — Options API, mount `#app` |
| **Tailwind CSS** | CDN `cdn.tailwindcss.com` — màu custom `kem` trong `tailwind.config` |
| **Font Awesome 6.7.2** | CDN, load async |
| **Axios** | Lazy-load khi gửi Telegram |
| **Google Analytics** | `G-LBBQT5ZZX2` (gtag.js) — có trên mọi trang |
| **Font** | Quicksand (Google Fonts) |

---

## Trang chủ (`index.html`)

### Các section (anchor)

| ID | Nội dung |
|----|----------|
| `#home` | Hero, banner, CTA TikTok Shop / Shopee |
| `#products` | Danh sách sản phẩm, tìm kiếm, lọc danh mục |
| `#meokem` | Nhân vật Mèo Kem |
| `#videos` | Video YouTube embed |
| `#voucher` | Form nhận voucher 10% |
| `#contact` | Form tư vấn |
| `#blog` | Grid bài viết |
| FAQ | Schema FAQPage ở cuối file |

### Vue app (`initKemStoreApp`)

Toàn bộ logic nằm trong `<script defer>` cuối `index.html`:

- **Dữ liệu hardcode** trong `data()`: `products`, `categories`, `blogs`, `youtubeVideos`, `socialLinks`, `vouchers`, v.v.
- **Computed:** `productsFilter` — lọc theo `keyword` + `category`
- **Tính năng:** quick view modal, wishlist (`localStorage`), popup voucher (scroll ≥35% + 25s hoặc sau 60s), form gửi Telegram
- **Mobile menu:** dùng `<teleport to="body">` + class `vue-overlay` — tránh lỗi `fixed` bị cắt

### Danh mục sản phẩm (`category` slug)

`sticker` · `notebook` · `pen` · `combo` · `accessory` · `all`

### Thêm/sửa sản phẩm

Thêm object vào mảng `products` trong `data()`:

```js
{
  id: 24,                          // unique, tăng dần
  name: 'Tên sản phẩm',
  price: 35000,
  oldPrice: 45000,
  discount: 22,                    // % giảm
  review: 100,                     // số đánh giá (hiển thị)
  category: 'sticker',             // slug danh mục
  favorite: false,
  image: 'https://...',            // thường là CDN Shopee
  description: 'Mô tả ngắn.',
  link: 'https://shopee.vn/...'    // link mua hàng
}
```

Giá hiển thị qua `formatMoney()` — `Intl.NumberFormat('vi-VN') + 'đ'`.

### Thêm bài blog trên trang chủ

1. Tạo file `blog/ten-bai-viet.html` (xem mục Blog bên dưới)
2. Thêm entry vào mảng `blogs` trong `data()` — `link: './blog/ten-bai-viet.html'`
3. Thêm URL vào `sitemap.xml` (`lastmod`, `priority: 0.8`)

---

## Blog (`blog/*.html`)

> **Cursor rules:** `.cursor/rules/blog-template.mdc` + `blog-seo-content.mdc` (globs `blog/**/*.html`; áp dụng khi user yêu cầu viết/sửa blog).  
> **User:** *"Viết blog chủ đề: …"*

Mỗi bài là **HTML độc lập** — không dùng Vue/Tailwind. CSS inline, `--kem: #ee5f6d`, `--bg: #fff8f6`.

Khi xuất bản bài mới: tạo `blog/{slug}.html` → thêm vào mảng `blogs` trong `index.html` → cập nhật `sitemap.xml`.

### Danh sách blog hiện có

| File | Chủ đề |
|------|--------|
| `top-sticker-cute-cho-hoc-sinh.html` | Top sticker |
| `cach-trang-tri-goc-hoc-tap.html` | Góc học tập |
| `checklist-do-dung-tuu-truong.html` | Checklist tựu trường |
| `cach-trang-tri-so-tay-bang-sticker.html` | Decor sổ tay |
| `combo-qua-tang-tuu-truong-tiet-kiem.html` | Combo quà tặng |
| `bullet-journal-cho-hoc-sinh.html` | Bullet journal |
| `cach-chon-but-gel-cute-hoc-sinh.html` | Chọn bút gel |
| `scrapbook-study-aesthetic-hoc-sinh.html` | Scrapbook |
| `cach-trang-tri-ban-lam-viec.html` | Bàn làm việc |
| `kiem-tien-online-quay-goc-hoc-tap-study-with-me.html` | Kiếm tiền Study with me |

Chi tiết template, SEO, CTA: xem `.cursor/rules/blog-*.mdc`.

---

## Design system

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--kem` / `kem` | `#ee5f6d` | Màu thương hiệu chính |
| `kem-50` … `kem-600` | Tailwind extend | Nền, border, hover |
| Nền body | `#fff8f6` | Toàn site |
| Shopee CTA | `#f94e30` | Nút Shopee |
| Font | Quicksand 400–800 | Toàn site |

Tone nội dung: **tiếng Việt**, thân thiện, hướng học sinh / study aesthetic, nhắc TikTok Shop (giá tốt) và Shopee (giao toàn quốc).

---

## SEO & metadata

- `lang="vi"` trên `<html>`
- Canonical luôn dùng `https://kemstore.vn/...` (blog dùng absolute; `index.html` dùng `https://kemstore.vn`)
- Schema.org: Organization, WebSite, Store (trang chủ); Article + FAQ (blog)
- Cập nhật `sitemap.xml` khi thêm/xóa URL
- `robots.txt` trỏ tới sitemap; `404.html` dùng `noindex`

---

## Liên kết & kênh bán hàng

Định nghĩa tập trung trong `socialLinks` (Vue `data`):

- **TikTok Shop:** `https://vt.tiktok.com/ZS9jVsyhe92uq-upQ45/`
- **Shopee:** `https://shopee.vn/tiemtaphoanhakem`
- **Facebook, YouTube, TikTok, Zalo** — cùng object

Giữ đồng bộ với schema `sameAs` trong `<head>` và CTA trên blog.

---

## Form & Telegram

Form voucher, liên hệ, popup email gửi tin nhắn qua **Telegram Bot API** (`sendTelegramMessage`). Token/chatId nằm trong `telegram` object — **client-side**, có rủi ro bảo mật; code đã ghi chú không nên mở rộng pattern này mà không có backend proxy.

**localStorage keys:**

- `wishlist` — sản phẩm yêu thích
- `kemstore_voucher_subscribed` — đã đăng ký voucher
- `kemstore_voucher_dismissed` — đóng popup (ẩn 7 ngày)

---

## Quy tắc khi chỉnh sửa

1. **Giữ diff nhỏ** — đây là site tĩnh monolith; tránh tách file hoặc refactor lớn trừ khi được yêu cầu.
2. **Không thêm build toolchain** (npm, Vite, v.v.) trừ khi user yêu cầu rõ ràng.
3. **Không tạo commit** trừ khi user yêu cầu.
4. **Không chỉnh `index.html.bak`** — file backup.
5. **Vue patterns hiện có:** Options API, `v-cloak`, class `vue-overlay` ẩn trước mount (`#app:not([data-v-app]) .vue-overlay { display: none }`).
6. **Ảnh sản phẩm:** thường hotlink CDN Shopee; ảnh thương hiệu/blog để trong `assets/images/`.
7. **Responsive:** Tailwind breakpoints (`sm:`, `md:`, `lg:`) trên trang chủ; blog dùng `@media (max-width:640px)`.
8. **Accessibility:** `aria-label`, `aria-labelledby`, `sr-only` cho search — giữ khi thêm UI mới.
9. **Nội dung tiếng Việt** — title/description meta phải tự nhiên, có từ khóa SEO, không stuff keyword.

---

## Kiểm tra sau khi sửa

- Mở `index.html` local: Vue mount, lọc sản phẩm, modal, menu mobile
- Link blog từ section `#blog` và breadcrumb ngược về trang chủ
- Canonical + OG image resolve đúng trên `https://kemstore.vn`
- Nếu thêm blog: có entry trong `sitemap.xml` và mảng `blogs`

---

## Deploy

Push lên repo GitHub → GitHub Pages serve static files. Domain custom qua `CNAME`. Không cần build trước khi deploy.

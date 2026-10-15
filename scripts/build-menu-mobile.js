const fs = require('fs');
const path = require('path');

// Read menu data from scripts/menu-data.json
const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-data.json'), 'utf8'));

// Category Icons Map (SVGs)
const categoryIcons = {
  'Gỏi / Salad': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a10 10 0 0 0-10 10c0 4.4 2.9 8.2 7 9.5.3-2 .5-4.5.5-6.5C8 13.5 7 12 7 10a5 5 0 0 1 10 0c0 2-1 3.5-2.5 5 0 2 .2 4.5.5 6.5 4.1-1.3 7-5.1 7-9.5A10 10 0 0 0 12 2Z"/></svg>`,
  'Sashimi Tươi Sống': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6.5 12c.94-2.07 1.7-3.8 3.5-5 2.4-1.6 5.2-1.7 8-1 1.8.4 3.4 1.3 4.5 2.6-1.3 1.1-2.2 2.7-2.6 4.4-.4 1.8.2 3.6 1.1 5-2.4 1.5-5.2 1.6-8 1-2-.4-3.7-1.5-4.9-3.2-.8-1.2-1.3-2.5-1.6-3.8Z"/><path d="M12 9v6"/></svg>`,
  'Khai Đạo & Nhâm Nhi': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/><path d="M8 12h.01M16 12h.01"/></svg>`,
  'Set Tổng Hợp': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="3" rx="3"/><path d="M3 9h18M9 21V9"/></svg>`,
  'Bò & Trâu Thượng Hạng': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m19 8-4-4H9L5 8l2 5 5 7 5-7 2-5Z"/><path d="M12 11v6"/></svg>`,
  'Gà Đồi & Chim Bay': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 7h.01"/><path d="M3.4 18c.6-3.5 3-6.5 6.6-8l6-3.5a2 2 0 0 1 2.5 2.8L16 13c-.8 2-2.5 3.5-4.5 4.2L6 20l-2.6-2Z"/></svg>`,
  'Heo & Đảo Sườn Cay': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>`,
  'Đặc Sản Ếch Đồng': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 0 0-9 9c0 3.5 2 6.5 5 8 .5-1.5 1-3.5 1-5.5 0-2.5 2-4.5 4-4.5s4 2 4 4.5c0 2 .5 4 1 5.5 3-1.5 5-4.5 5-8a9 9 0 0 0-9-9Z"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`,
  'Hải Sản Cao Cấp': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 14c2-4 6-7 11-7 3.5 0 5.5 1.5 7 3-1.5 1.5-3.5 3-7 3-5 0-9-3-11-7Z"/><path d="M12 7c0 3-1.5 6-4 8M16 8c0 2.5-1 5-3 7"/></svg>`,
  'Nướng Thả Ga & Xiên Que': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m19 5-7 7-4-4 7-7 4 4ZM5 19l4-4M3 21l2-2"/></svg>`,
  'Vườn Rau Sau Hè': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 20A7 7 0 0 1 4 13c0-4 3.5-7.5 7-10 3.5 2.5 7 6 7 10a7 7 0 0 1-7 7Z"/><path d="M11 20V8"/></svg>`,
  'Đổ Bê Tông (Cơm & Mỳ)': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11a8 8 0 1 1-16 0h16Z"/><path d="M8 5v3M12 4v4M16 5v3M4 19h16"/></svg>`,
  'Giải Rượu & Canh Cháo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h16a1 1 0 0 1 1 1c0 5-4 9-9 9s-9-4-9-9a1 1 0 0 1 1-1Z"/><path d="M7 6c1 1 1 2 0 3M12 5c1 1 1 2 0 3M17 6c1 1 1 2 0 3"/></svg>`,
  'Đồ Uống (Bia Hơi & Giải Khát)': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 2v3M13 2v3M5 8h12v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"/></svg>`,
  'Món Gọi Thêm': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>`
};

// Rich Authentic Dong Son Bronze Drum Vector SVG
const trongDongSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <!-- Deep Royal Gold Radiance -->
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF8E7" stop-opacity="1" />
      <stop offset="25%" stop-color="#FCD34D" stop-opacity="0.95" />
      <stop offset="55%" stop-color="#D4AF37" stop-opacity="0.85" />
      <stop offset="85%" stop-color="#855B14" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#3B2605" stop-opacity="1" />
    </radialGradient>
    
    <linearGradient id="bronzeSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF7" />
      <stop offset="20%" stop-color="#F5DA8A" />
      <stop offset="45%" stop-color="#D4AF37" />
      <stop offset="70%" stop-color="#997316" />
      <stop offset="90%" stop-color="#F5DA8A" />
      <stop offset="100%" stop-color="#C59B27" />
    </linearGradient>

    <!-- Metallic Specular Flare Gradient -->
    <linearGradient id="sheenSweep" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <radialGradient id="rimShade" cx="50%" cy="50%" r="50%">
      <stop offset="85%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
    </radialGradient>
  </defs>

  <!-- 1. Drum Base Background -->
  <circle cx="200" cy="200" r="196" fill="#12141B" stroke="url(#bronzeSheen)" stroke-width="4" />
  <circle cx="200" cy="200" r="196" fill="url(#rimShade)" />

  <!-- 2. Outer Ring 1: Notched Beaded Rim (Văn Chấm Nhỏ) -->
  <circle cx="200" cy="200" r="188" fill="none" stroke="url(#bronzeSheen)" stroke-width="1.8" stroke-dasharray="3,3" opacity="0.85" />
  <circle cx="200" cy="200" r="183" fill="none" stroke="url(#bronzeSheen)" stroke-width="1.2" opacity="0.6" />

  <!-- 3. Outer Ring 2: Sawtooth / Comb Patterns (Văn Răng Cưa & Răng Lược) -->
  <circle cx="200" cy="200" r="174" fill="none" stroke="url(#bronzeSheen)" stroke-width="2.5" stroke-dasharray="7,4" opacity="0.9" />
  <circle cx="200" cy="200" r="165" fill="none" stroke="url(#bronzeSheen)" stroke-width="1" opacity="0.7" />

  <!-- 4. Sacred Flying Cranes Ring (Vành Chim Lạc Bay Ngược Chiều Kim Đồng Hồ) -->
  <g stroke="url(#bronzeSheen)" fill="none" stroke-width="1.6" opacity="0.92">
    <circle cx="200" cy="200" r="154" stroke-dasharray="14,8" />
    <circle cx="200" cy="200" r="136" />
    <!-- 8 Stylized Chim Lạc Glyphs -->
    <path d="M 200 48 Q 215 54 225 45 Q 215 62 205 60 Z" fill="url(#bronzeSheen)" />
    <path d="M 307 93 Q 320 106 331 100 Q 317 114 309 107 Z" fill="url(#bronzeSheen)" />
    <path d="M 352 200 Q 346 215 355 225 Q 338 215 340 205 Z" fill="url(#bronzeSheen)" />
    <path d="M 307 307 Q 294 320 300 331 Q 286 317 293 309 Z" fill="url(#bronzeSheen)" />
    <path d="M 200 352 Q 185 346 175 355 Q 185 338 195 340 Z" fill="url(#bronzeSheen)" />
    <path d="M 93 307 Q 80 294 69 300 Q 83 286 91 293 Z" fill="url(#bronzeSheen)" />
    <path d="M 48 200 Q 54 185 45 175 Q 62 185 60 195 Z" fill="url(#bronzeSheen)" />
    <path d="M 93 93 Q 106 80 100 69 Q 114 83 107 91 Z" fill="url(#bronzeSheen)" />
  </g>

  <!-- 5. Concentric Concentric Circles & Geometric Meanders (Văn Tiếp Tuyến) -->
  <circle cx="200" cy="200" r="126" fill="none" stroke="url(#bronzeSheen)" stroke-width="1.8" stroke-dasharray="5,3" opacity="0.8" />
  <circle cx="200" cy="200" r="114" fill="none" stroke="url(#bronzeSheen)" stroke-width="1.2" opacity="0.75" />
  <circle cx="200" cy="200" r="102" fill="#141720" stroke="url(#bronzeSheen)" stroke-width="2" />

  <!-- 6. 14-Pointed Sacred Solar Star (Ngôi Sao Mặt Trời 14 Cánh Đỉnh Cao) -->
  <g fill="url(#bronzeSheen)" stroke="none">
    <!-- 14 Sun Rays radiating from 200,200 -->
    <!-- Ray 0 (Top) -->
    <polygon points="200,102 206,182 200,174 194,182" />
    <!-- Ray 7 (Bottom) -->
    <polygon points="200,298 206,218 200,226 194,218" />
    <!-- Ray 3.5 (Right) -->
    <polygon points="298,200 218,206 226,200 218,194" />
    <!-- Ray 10.5 (Left) -->
    <polygon points="102,200 182,206 174,200 182,194" />
    
    <!-- Diagonal Rays -->
    <polygon points="269,131 214,187 220,183 218,190" />
    <polygon points="131,269 186,213 180,217 182,210" />
    <polygon points="269,269 213,214 217,220 210,218" />
    <polygon points="131,131 187,186 183,180 190,182" />

    <polygon points="244,113 209,185 214,180 210,188" opacity="0.95" />
    <polygon points="156,287 191,215 186,220 190,212" opacity="0.95" />
    <polygon points="113,156 185,209 180,214 188,210" opacity="0.95" />
    <polygon points="287,244 215,191 220,186 212,190" opacity="0.95" />

    <polygon points="156,113 191,185 186,180 190,188" opacity="0.95" />
    <polygon points="244,287 209,215 214,220 210,212" opacity="0.95" />
    <polygon points="113,244 185,191 180,186 188,190" opacity="0.95" />
    <polygon points="287,156 215,209 220,214 212,210" opacity="0.95" />
  </g>

  <!-- 7. Feather Ornaments between Sun Rays -->
  <g stroke="url(#bronzeSheen)" stroke-width="1.2" opacity="0.7" fill="none">
    <circle cx="200" cy="200" r="88" stroke-dasharray="3,5" />
    <circle cx="200" cy="200" r="66" stroke-dasharray="2,3" />
  </g>

  <!-- 8. Cosmic Core Pearl -->
  <circle cx="200" cy="200" r="24" fill="url(#sunGlow)" />
  <circle cx="200" cy="200" r="14" fill="#0C0E14" />
  <circle cx="200" cy="200" r="7" fill="url(#bronzeSheen)" />
  <circle cx="200" cy="200" r="3" fill="#FFFDF7" />

  <!-- Dynamic metallic sheen highlight sweep overlay -->
  <circle cx="200" cy="200" r="194" fill="url(#sheenSweep)" opacity="0.15" pointer-events="none" />
</svg>`;

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', 'đ');
}

// Generate HTML with custom asset path prefix (default './' for standalone mobile folder)
function buildHtml(assetPrefix = './') {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>Thực Đơn Thượng Lưu | TRỐNG ĐỒNG STATION</title>
  <meta name="description" content="Thực đơn ẩm thực cao cấp Trống Đồng Station - Không gian ẩm thực & Lounge thượng lưu đỉnh cao.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07080A;
      --bg-darker: #040406;
      --surface: #101217;
      --surface-2: #161920;
      --surface-3: #1F232D;
      --border: rgba(212, 175, 55, 0.18);
      --border-bright: rgba(212, 175, 55, 0.45);
      --text: #F7F4EB;
      --muted: #A39D90;
      --accent: #D4AF37;
      --accent-gold: #F5C85A;
      --champagne: #E8C882;
      --gold-glow: rgba(212, 175, 55, 0.4);
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 22px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    html {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      scroll-behavior: smooth;
      scroll-padding-top: 105px;
    }

    body {
      background-color: var(--bg);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient Background Canvas (Floating Gold Dust & Sparkles) */
    #goldCanvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* Mobile-first App Frame */
    .app-container {
      position: relative;
      z-index: 2;
      max-width: 580px;
      margin: 0 auto;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                  radial-gradient(circle at 50% 100%, rgba(212, 175, 55, 0.05) 0%, transparent 60%),
                  var(--bg);
      box-shadow: 0 0 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.05);
      padding-bottom: 70px;
    }

    /* Typography */
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .font-royal {
      font-family: 'Cinzel', serif;
    }

    .text-gold {
      background: linear-gradient(135deg, #FFF5DC 0%, #F5C85A 35%, #D4AF37 70%, #A37920 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .text-champagne {
      background: linear-gradient(135deg, #FFFFFF 0%, #F5DEB3 50%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* ========================================================= */
    /* 1. CINEMATIC INTRO SPLASH & SILKY-SMOOTH FLYING DRUM      */
    /* ========================================================= */
    #introOverlay {
      position: fixed;
      inset: 0;
      z-index: 99990;
      background: radial-gradient(circle at center 42%, #181C25 0%, #0C0E14 55%, #030406 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: opacity 0.8s cubic-bezier(0.2, 0.9, 0.3, 1), visibility 0.8s ease;
    }

    #introOverlay.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    /* Radiant Sunburst God-Rays behind Drum */
    .intro-sunburst {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 650px;
      height: 650px;
      transform: translate(-50%, -50%);
      background: conic-gradient(
        from 0deg,
        rgba(212, 175, 55, 0.12) 0deg 15deg,
        transparent 15deg 30deg,
        rgba(212, 175, 55, 0.15) 30deg 45deg,
        transparent 45deg 60deg,
        rgba(212, 175, 55, 0.12) 60deg 75deg,
        transparent 75deg 90deg,
        rgba(212, 175, 55, 0.15) 90deg 105deg,
        transparent 105deg 120deg,
        rgba(212, 175, 55, 0.12) 120deg 135deg,
        transparent 135deg 150deg,
        rgba(212, 175, 55, 0.15) 150deg 165deg,
        transparent 165deg 180deg,
        rgba(212, 175, 55, 0.12) 180deg 195deg,
        transparent 195deg 210deg,
        rgba(212, 175, 55, 0.15) 210deg 225deg,
        transparent 225deg 240deg,
        rgba(212, 175, 55, 0.12) 240deg 255deg,
        transparent 255deg 270deg,
        rgba(212, 175, 55, 0.15) 270deg 285deg,
        transparent 285deg 300deg,
        rgba(212, 175, 55, 0.12) 300deg 315deg,
        transparent 315deg 330deg,
        rgba(212, 175, 55, 0.15) 330deg 345deg,
        transparent 345deg 360deg
      );
      border-radius: 50%;
      filter: blur(20px);
      animation: sunburstRotate 45s linear infinite;
      pointer-events: none;
    }

    @keyframes sunburstRotate {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    /* Ambient Pulsing Aura */
    .intro-aura {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 420px;
      height: 420px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 200, 90, 0.35) 0%, rgba(212, 175, 55, 0.12) 50%, transparent 75%);
      filter: blur(28px);
      animation: auraBreathe 4s ease-in-out infinite alternate;
      pointer-events: none;
    }

    @keyframes auraBreathe {
      0% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(1.18); opacity: 1; }
    }

    /* THE UNIFIED HERO TRỐNG ĐỒNG ELEMENT (Fixed in screen, smoothly morphs and glides) */
    #heroBronzeDrum {
      position: fixed;
      top: 40%;
      left: 50%;
      width: 290px;
      height: 290px;
      margin-left: -145px;
      margin-top: -145px;
      z-index: 99995;
      cursor: pointer;
      border-radius: 50%;
      box-shadow: 0 0 60px rgba(212, 175, 55, 0.45), inset 0 0 35px rgba(212, 175, 55, 0.25);
      filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.95));
      will-change: transform, opacity;
      transform-origin: center center;
      transition: filter 0.3s ease;
    }

    #heroBronzeDrum:hover {
      filter: drop-shadow(0 15px 45px rgba(212, 175, 55, 0.6));
    }

    /* Orbiting Runic Rings around the Drum */
    .drum-runic-ring {
      position: absolute;
      inset: -16px;
      border: 1px dashed rgba(245, 200, 90, 0.45);
      border-radius: 50%;
      pointer-events: none;
    }

    .drum-outer-glow-ring {
      position: absolute;
      inset: -28px;
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 50%;
      pointer-events: none;
    }

    /* Intro Bottom Typography & Button */
    .intro-content {
      position: absolute;
      bottom: 8%;
      left: 0;
      right: 0;
      text-align: center;
      z-index: 99992;
      padding: 0 20px;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .intro-badge {
      font-size: 11px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--champagne);
      display: inline-block;
      margin-bottom: 12px;
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    }

    .intro-title {
      font-size: 28px;
      letter-spacing: 0.15em;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 8px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
    }

    .intro-desc {
      font-size: 13px;
      color: var(--muted);
      letter-spacing: 0.08em;
      margin-bottom: 26px;
      font-weight: 400;
    }

    .intro-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 14px 34px;
      border-radius: 9999px;
      background: linear-gradient(135deg, rgba(245, 200, 90, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%);
      border: 1.5px solid var(--accent);
      color: #FFF8E7;
      font-family: 'Cinzel', serif;
      font-size: 12px;
      letter-spacing: 0.2em;
      font-weight: 800;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 6px 25px rgba(212, 175, 55, 0.35);
      backdrop-filter: blur(8px);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      animation: btnGlowPulse 2.8s ease-in-out infinite;
    }

    .intro-btn:hover {
      background: linear-gradient(135deg, #F5C85A 0%, #D4AF37 100%);
      color: #07080A;
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 10px 35px rgba(212, 175, 55, 0.6);
    }

    @keyframes btnGlowPulse {
      0%, 100% { box-shadow: 0 6px 25px rgba(212, 175, 55, 0.25); }
      50% { box-shadow: 0 6px 35px rgba(212, 175, 55, 0.55); }
    }

    /* Golden Shockwave Expanding Ripple on Docking */
    .shockwave-ripple {
      position: fixed;
      border-radius: 50%;
      border: 2px solid rgba(245, 200, 90, 0.8);
      box-shadow: 0 0 35px rgba(212, 175, 55, 0.7);
      pointer-events: none;
      z-index: 99996;
      animation: shockwaveExpand 0.95s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
    }

    @keyframes shockwaveExpand {
      0% {
        transform: translate(-50%, -50%) scale(0.1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(14);
        opacity: 0;
      }
    }

    /* ========================================================= */
    /* 2. HEADER & BANNER                                        */
    /* ========================================================= */
    .site-header {
      position: relative;
      border-bottom: 1px solid var(--border);
      overflow: hidden;
      background: #07080A;
    }

    .header-banner {
      position: relative;
      height: 195px;
      background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85') center/cover no-repeat;
    }

    .header-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(7, 8, 10, 0.35) 0%, rgba(7, 8, 10, 0.8) 65%, #07080A 100%);
    }

    .header-banner-watermark {
      position: absolute;
      inset: 0;
      background: url('${assetPrefix}trong-dong-watermark.svg') center/contain no-repeat;
      opacity: 0.16;
      pointer-events: none;
    }

    .header-top-bar {
      position: absolute;
      top: 14px;
      inset-x: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .replay-intro-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 15px;
      background: rgba(16, 18, 23, 0.85);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-size: 11px;
      color: var(--champagne);
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .replay-intro-btn:hover {
      border-color: var(--accent);
      color: #FFF;
      background: rgba(22, 25, 32, 0.95);
      transform: scale(1.03);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(16, 18, 23, 0.85);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-size: 11px;
      color: var(--muted);
      backdrop-filter: blur(10px);
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: pulseGreen 2s infinite;
    }

    @keyframes pulseGreen {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .header-content {
      position: relative;
      margin-top: -46px;
      padding: 0 16px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 5;
    }

    /* Header Pedestal Ring: The exact landing site */
    .header-logo-pedestal {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1C202B 0%, #101217 60%, #07080A 100%);
      border: 2px solid rgba(212, 175, 55, 0.65);
      padding: 4px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.85), 0 0 25px rgba(212, 175, 55, 0.25);
      margin-bottom: 12px;
      position: relative;
      transition: all 0.35s ease;
    }

    .restaurant-name {
      font-size: 23px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .restaurant-tagline {
      font-size: 11px;
      letter-spacing: 0.16em;
      color: var(--champagne);
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 12px;
    }

    .badges-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 4px;
    }

    .luxury-badge {
      font-size: 10px;
      letter-spacing: 0.06em;
      padding: 4px 11px;
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 9999px;
      color: #E8C882;
    }

    /* ========================================================= */
    /* 3. SEARCH BAR & STATS                                     */
    /* ========================================================= */
    .search-box-wrap {
      padding: 14px 16px 8px;
      position: relative;
    }

    .search-input-inner {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input-inner svg {
      position: absolute;
      left: 15px;
      width: 18px;
      height: 18px;
      color: var(--accent);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 12px 42px 12px 44px;
      border-radius: 9999px;
      background: rgba(16, 18, 23, 0.88);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 13px;
      outline: none;
      backdrop-filter: blur(14px);
      transition: all 0.25s ease;
    }

    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 18px rgba(212, 175, 55, 0.3);
      background: rgba(22, 25, 32, 0.95);
    }

    .search-clear-btn {
      position: absolute;
      right: 15px;
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      display: none;
      font-size: 18px;
      line-height: 1;
    }

    /* ========================================================= */
    /* 4. STICKY CATEGORY NAVIGATION (SCROLLSPY)                 */
    /* ========================================================= */
    .category-sticky-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(7, 8, 10, 0.94);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--border);
      padding: 10px 0;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.7);
    }

    .category-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 0 16px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .category-scroll::-webkit-scrollbar {
      display: none;
    }

    .category-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 9999px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      flex-shrink: 0;
    }

    .category-pill svg {
      width: 14px;
      height: 14px;
      color: var(--accent);
    }

    .category-pill:hover {
      border-color: var(--accent);
      color: var(--text);
      background: var(--surface-2);
    }

    .category-pill.active {
      background: linear-gradient(135deg, rgba(245, 200, 90, 0.25) 0%, rgba(212, 175, 55, 0.08) 100%);
      border-color: var(--accent);
      color: #FFF8E7;
      box-shadow: 0 0 18px rgba(212, 175, 55, 0.25);
    }

    .category-count {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.45);
      color: var(--champagne);
    }

    /* ========================================================= */
    /* 5. MENU SECTIONS & DISH CARDS (NO ORDER BUTTONS)          */
    /* ========================================================= */
    .menu-content {
      padding: 14px 16px 20px;
    }

    .section-block {
      margin-bottom: 34px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.16);
      position: relative;
    }

    .section-header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 45px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent) 0%, transparent 100%);
    }

    .section-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 0.03em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-count {
      font-size: 11px;
      color: var(--muted);
      font-weight: 400;
    }

    /* Cards container */
    .cards-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* FEATURED LARGE CARD (Top dish in category) */
    .featured-card {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .featured-card:hover {
      border-color: var(--border-bright);
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.75), 0 0 25px rgba(212, 175, 55, 0.18);
    }

    .featured-img-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #0B0D12;
    }

    .featured-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .featured-card:hover .featured-img {
      transform: scale(1.05);
    }

    .featured-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(16, 18, 23, 0.98) 0%, rgba(16, 18, 23, 0.4) 45%, transparent 100%);
    }

    .featured-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 9999px;
      background: rgba(7, 8, 10, 0.88);
      border: 1px solid var(--accent);
      color: #FFF8E7;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.65);
    }

    .featured-info {
      padding: 14px 16px 16px;
      position: relative;
      margin-top: -30px;
      z-index: 2;
    }

    .featured-title {
      font-size: 18px;
      font-weight: 600;
      color: #FFF;
      letter-spacing: 0.02em;
      line-height: 1.35;
      margin-bottom: 6px;
      transition: color 0.2s ease;
    }

    .featured-card:hover .featured-title {
      color: var(--accent);
    }

    .featured-desc {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
      margin-bottom: 12px;
      font-weight: 300;
    }

    .featured-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dish-price {
      font-size: 17px;
      font-weight: 700;
      color: var(--accent-gold);
      letter-spacing: 0.02em;
    }

    .dish-view-hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--champagne);
      letter-spacing: 0.05em;
      opacity: 0.85;
      transition: opacity 0.2s;
    }

    .dish-view-hint svg {
      width: 14px;
      height: 14px;
      color: var(--accent);
    }

    /* ROW CARD (Follow-up dishes) */
    .row-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }

    .row-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2.5px;
      background: var(--accent);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .row-card:hover {
      border-color: rgba(212, 175, 55, 0.38);
      background: var(--surface-2);
      transform: translateY(-1px);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.55), 0 0 16px rgba(212, 175, 55, 0.1);
    }

    .row-card:hover::before {
      opacity: 1;
    }

    .row-text {
      flex: 1;
      min-width: 0;
      padding-right: 4px;
    }

    .row-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.35;
      margin-bottom: 4px;
      transition: color 0.2s ease;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-card:hover .row-title {
      color: var(--accent);
    }

    .row-desc {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.45;
      font-weight: 300;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .row-footer {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .row-img-wrap {
      width: 88px;
      height: 72px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      border: 1px solid rgba(212, 175, 55, 0.16);
      background: #0B0D12;
    }

    .row-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .row-card:hover .row-img {
      transform: scale(1.08);
    }

    /* ========================================================= */
    /* 6. DISH DETAIL MODAL (POPUP)                              */
    /* ========================================================= */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-sheet {
      position: relative;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: var(--radius-lg);
      background: var(--surface);
      border: 1px solid var(--border-bright);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.25);
      transform: scale(0.92) translateY(20px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }

    .modal-overlay.active .modal-sheet {
      transform: scale(1) translateY(0);
    }

    .modal-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(7, 8, 10, 0.8);
      border: 1px solid var(--border);
      color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      backdrop-filter: blur(8px);
      transition: all 0.2s;
    }

    .modal-close-btn:hover {
      background: var(--accent);
      color: #07080A;
      transform: rotate(90deg);
    }

    .modal-img-wrap {
      width: 100%;
      aspect-ratio: 4/3;
      position: relative;
      overflow: hidden;
      background: #0B0D12;
    }

    .modal-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-tag {
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--champagne);
      margin-bottom: 6px;
      display: inline-block;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      color: #FFF;
      line-height: 1.35;
      margin-bottom: 10px;
    }

    .modal-price {
      font-size: 22px;
      font-weight: 800;
      color: var(--accent-gold);
      margin-bottom: 14px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .modal-divider {
      height: 1px;
      background: linear-gradient(90deg, var(--border-bright) 0%, rgba(212, 175, 55, 0.05) 100%);
      margin: 14px 0;
    }

    .modal-desc {
      font-size: 14px;
      color: #D1CCC0;
      line-height: 1.65;
      font-weight: 300;
      margin-bottom: 18px;
    }

    .modal-notes {
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: rgba(212, 175, 55, 0.06);
      border: 1px dashed rgba(212, 175, 55, 0.28);
      font-size: 12px;
      color: var(--champagne);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modal-notes svg {
      width: 18px;
      height: 18px;
      color: var(--accent);
      flex-shrink: 0;
    }

    /* ========================================================= */
    /* 7. FLOATING ACTIONS & FOOTER                              */
    /* ========================================================= */
    .floating-top-btn {
      position: fixed;
      bottom: 24px;
      right: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(16, 18, 23, 0.88);
      border: 1px solid var(--accent);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.65);
      cursor: pointer;
      z-index: 90;
      backdrop-filter: blur(10px);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .floating-top-btn.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .floating-top-btn:hover {
      background: var(--accent);
      color: #07080A;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.45);
    }

    .site-footer {
      text-align: center;
      padding: 30px 16px 20px;
      border-top: 1px solid var(--border);
      margin-top: 30px;
      position: relative;
    }

    .footer-logo-svg {
      width: 42px;
      height: 42px;
      margin: 0 auto 10px;
      opacity: 0.65;
    }

    .footer-name {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--champagne);
      margin-bottom: 4px;
    }

    .footer-text {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .footer-copy {
      font-size: 10px;
      color: rgba(163, 157, 144, 0.5);
    }
  </style>
</head>
<body>

  <!-- Background Sparkling Gold Dust Canvas -->
  <canvas id="goldCanvas"></canvas>

  <!-- ========================================================= -->
  <!-- 1. EPIC HERO TRỐNG ĐỒNG ELEMENT (Unified Motion Object)   -->
  <!-- ========================================================= -->
  <div id="heroBronzeDrum" title="Chạm để khám phá">
    <div class="drum-runic-ring"></div>
    <div class="drum-outer-glow-ring"></div>
    ${trongDongSvg}
  </div>

  <!-- INTRO SPLASH OVERLAY BACKDROP -->
  <div id="introOverlay">
    <div class="intro-sunburst"></div>
    <div class="intro-aura"></div>

    <div class="intro-content" id="introContent">
      <span class="intro-badge font-royal">✦ Kính Chào Quý Khách ✦</span>
      <h1 class="intro-title font-royal text-gold">TRỐNG ĐỒNG STATION</h1>
      <p class="intro-desc font-serif">Thăng Hoa Phong Vị Việt • Đẳng Cấp Thượng Lưu</p>
      <button class="intro-btn" id="startExploreBtn">
        <span>Khám Phá Menu</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>

  <!-- ========================================================= -->
  <!-- 2. MAIN APP CONTAINER (RESPONSIVE MOBILE VIEW)            -->
  <!-- ========================================================= -->
  <div class="app-container" id="appContainer">

    <!-- SITE HEADER -->
    <header class="site-header">
      <div class="header-banner">
        <div class="header-banner-watermark"></div>

        <div class="header-top-bar">
          <button type="button" class="replay-intro-btn font-royal" id="replayIntroBtn" title="Xem lại hiệu ứng mở đầu">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span>Mở Đầu</span>
          </button>

          <div class="status-pill">
            <span class="status-dot"></span>
            <span>Phục vụ hôm nay</span>
          </div>
        </div>
      </div>

      <div class="header-content">
        <!-- Target pedestal where the hero drum nests -->
        <div class="header-logo-pedestal" id="headerPedestal"></div>

        <h1 class="restaurant-name font-royal text-gold">TRỐNG ĐỒNG STATION</h1>
        <p class="restaurant-tagline font-serif">Ẩm Thực Thượng Lưu & Không Gian Lounge</p>

        <div class="badges-row">
          <span class="luxury-badge">✦ 15 Danh Mục Đặc Sắc</span>
          <span class="luxury-badge">✦ 134 Món Ăn Tinh Hoa</span>
          <span class="luxury-badge">✦ Sơ Đồ 79 Bàn VIP</span>
        </div>
      </div>

      <!-- SEARCH BAR -->
      <div class="search-box-wrap">
        <div class="search-input-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm món ăn, đồ uống thượng hạng..." autocomplete="off">
          <button id="searchClearBtn" class="search-clear-btn">&times;</button>
        </div>
      </div>
    </header>

    <!-- STICKY CATEGORY NAV -->
    <nav class="category-sticky-bar" id="categoryBar">
      <div class="category-scroll" id="categoryScroll">
        ${menuData.map((cat, idx) => `
          <button type="button" class="category-pill ${idx === 0 ? 'active' : ''}" data-cat-id="${cat.id}">
            ${categoryIcons[cat.name] || categoryIcons['Gỏi / Salad']}
            <span>${cat.name}</span>
            <span class="category-count">${cat.items.length}</span>
          </button>
        `).join('')}
      </div>
    </nav>

    <!-- MENU SECTIONS LIST -->
    <main class="menu-content" id="menuContent">
      ${menuData.map(cat => {
        const firstItem = cat.items[0];
        const remainingItems = cat.items.slice(1);

        const resolveImg = (imgUrl) => {
          if (!imgUrl) return assetPrefix + 'trong-dong-logo.svg';
          if (imgUrl.startsWith('/dishes/')) {
            return assetPrefix + 'dishes/' + imgUrl.replace('/dishes/', '');
          }
          return imgUrl;
        };

        return `
          <section class="section-block" id="cat-${cat.id}" data-cat-title="${cat.name}">
            <div class="section-header">
              <h2 class="section-title font-serif">
                ${categoryIcons[cat.name] || ''}
                <span class="text-champagne">${cat.name}</span>
              </h2>
              <span class="section-count">${cat.items.length} món</span>
            </div>

            <div class="cards-grid">
              ${firstItem ? `
                <!-- Featured Top Dish in Category -->
                <article class="featured-card dish-clickable" data-dish='${JSON.stringify({ ...firstItem, imageUrl: resolveImg(firstItem.imageUrl) }).replace(/'/g, "&#39;")}'>
                  <div class="featured-img-wrap">
                    <img 
                      src="${resolveImg(firstItem.imageUrl)}" 
                      alt="${firstItem.name}" 
                      class="featured-img" 
                      loading="lazy"
                      onerror="this.onerror=null; this.src='${assetPrefix}trong-dong-logo.svg';"
                    />
                    <div class="featured-gradient"></div>
                    <div class="featured-badge font-royal">
                      <span>★ Món Đặc Sắc</span>
                    </div>
                  </div>
                  <div class="featured-info">
                    <h3 class="featured-title font-serif">${firstItem.name}</h3>
                    <p class="featured-desc">${firstItem.description || 'Chế biến tươi sống, hòa quyện hương vị thượng hạng.'}</p>
                    <div class="featured-footer">
                      <span class="dish-price">${formatVND(firstItem.price)}</span>
                      <span class="dish-view-hint">
                        <span>Chi tiết</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  </div>
                </article>
              ` : ''}

              <!-- Remaining Dishes in Category -->
              ${remainingItems.map(item => `
                <article class="row-card dish-clickable" data-dish='${JSON.stringify({ ...item, imageUrl: resolveImg(item.imageUrl) }).replace(/'/g, "&#39;")}'>
                  <div class="row-text">
                    <h3 class="row-title font-serif">${item.name}</h3>
                    <p class="row-desc">${item.description || 'Hương vị độc bản được chế biến bởi bếp trưởng Trống Đồng Station.'}</p>
                    <div class="row-footer">
                      <span class="dish-price">${formatVND(item.price)}</span>
                    </div>
                  </div>
                  <div class="row-img-wrap">
                    <img 
                      src="${resolveImg(item.imageUrl)}" 
                      alt="${item.name}" 
                      class="row-img" 
                      loading="lazy"
                      onerror="this.onerror=null; this.src='${assetPrefix}trong-dong-logo.svg';"
                    />
                  </div>
                </article>
              `).join('')}
            </div>
          </section>
        `;
      }).join('')}
    </main>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="footer-logo-svg">
        ${trongDongSvg}
      </div>
      <div class="footer-name font-royal">TRỐNG ĐỒNG STATION</div>
      <p class="footer-text font-serif">Kính Chúc Quý Khách Có Một Bữa Tiệc Trọn Vẹn & Thăng Hoa</p>
      <p class="footer-copy">&copy; 2026 TRỐNG ĐỒNG STATION. All rights reserved.</p>
    </footer>

  </div>

  <!-- FLOATING SCROLL TO TOP BUTTON -->
  <button id="floatingTopBtn" class="floating-top-btn" title="Lên đầu trang">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
  </button>

  <!-- ========================================================= -->
  <!-- 3. DISH DETAIL MODAL (POPUP)                              -->
  <!-- ========================================================= -->
  <div class="modal-overlay" id="dishModal">
    <div class="modal-sheet" id="modalSheet">
      <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Đóng">&times;</button>
      <div class="modal-img-wrap">
        <img id="modalImg" src="" alt="" class="modal-img" />
      </div>
      <div class="modal-body">
        <span class="modal-tag font-royal">✦ Tinh Hoa Ẩm Thực ✦</span>
        <h2 id="modalTitle" class="modal-title font-serif"></h2>
        <div id="modalPrice" class="modal-price"></div>
        <div class="modal-divider"></div>
        <p id="modalDesc" class="modal-desc"></p>
        <div class="modal-notes font-serif">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Món ăn được chuẩn bị từ nguyên liệu tươi sống chọn lọc mỗi ngày.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SCRIPT ENGINE -->
  <script>
    // =========================================================
    // 1. SPARKLING GOLD DUST CANVAS
    // =========================================================
    (function initGoldDust() {
      const canvas = document.getElementById('goldCanvas');
      const ctx = canvas.getContext('2d');
      let w, h;
      let particles = [];
      const COUNT = 45;

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      class DustParticle {
        constructor() {
          this.init(true);
        }
        init(randomY = false) {
          this.x = Math.random() * w;
          this.y = randomY ? Math.random() * h : h + 10;
          this.r = Math.random() * 2 + 0.8;
          this.vy = Math.random() * 0.45 + 0.18;
          this.vx = (Math.random() - 0.5) * 0.35;
          this.alpha = Math.random() * 0.5 + 0.25;
          this.dAlpha = (Math.random() - 0.5) * 0.015;
          this.color = Math.random() > 0.35 ? '#F5C85A' : '#FFF5DC';
        }
        update() {
          this.y -= this.vy;
          this.x += this.vx;
          this.alpha += this.dAlpha;
          if (this.alpha <= 0.15 || this.alpha >= 0.85) this.dAlpha = -this.dAlpha;
          if (this.y < -10 || this.x < -10 || this.x > w + 10) this.init();
        }
        draw() {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
          ctx.fillStyle = this.color;
          ctx.shadowBlur = this.r * 3.5;
          ctx.shadowColor = '#D4AF37';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      for (let i = 0; i < COUNT; i++) particles.push(new DustParticle());

      // Interactive Click/Touch Sparkles
      let touchParticles = [];
      window.addEventListener('pointerdown', (e) => {
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1.2;
          touchParticles.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: Math.random() * 2.2 + 1,
            alpha: 1,
            decay: Math.random() * 0.035 + 0.025,
            color: '#FFF8E7'
          });
        }
      });

      function loop() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });

        for (let i = touchParticles.length - 1; i >= 0; i--) {
          const tp = touchParticles[i];
          tp.x += tp.vx;
          tp.y += tp.vy;
          tp.alpha -= tp.decay;
          if (tp.alpha <= 0) {
            touchParticles.splice(i, 1);
          } else {
            ctx.save();
            ctx.globalAlpha = tp.alpha;
            ctx.fillStyle = tp.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#F5C85A';
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, tp.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        requestAnimationFrame(loop);
      }
      loop();
    })();

    // =========================================================
    // 2. FLAWLESS 60FPS ROTATION & SILKY-SMOOTH PARABOLIC FLIGHT
    // =========================================================
    const heroDrum = document.getElementById('heroBronzeDrum');
    const introOverlay = document.getElementById('introOverlay');
    const headerPedestal = document.getElementById('headerPedestal');
    const startExploreBtn = document.getElementById('startExploreBtn');
    const replayIntroBtn = document.getElementById('replayIntroBtn');

    // Continuous Motion State
    let currentRotationAngle = 0;
    let isFlying = false;
    let isDocked = false;
    let lastTimestamp = performance.now();

    // Idle Spin Speed (degrees per millisecond): ~15 deg/sec
    const IDLE_ROTATION_SPEED = 0.015;

    // Fluid Ease-Out Quintic Curve
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }
    // Smooth Bezier Ease-In-Out
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Main Drum Render Loop
    function drumRenderLoop(timestamp) {
      const dt = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!isFlying) {
        // Continuous smooth rotation with ZERO jumps
        currentRotationAngle = (currentRotationAngle + IDLE_ROTATION_SPEED * dt) % 360;

        if (!isDocked) {
          // Centered on Splash Screen
          heroDrum.style.transform = \`translate3d(0, 0, 0) scale(1) rotate(\${currentRotationAngle.toFixed(2)}deg)\`;
        } else {
          // Docked inside Header Pedestal: Follows header pedestal on scroll smoothly
          const pedRect = headerPedestal.getBoundingClientRect();
          const targetScale = pedRect.width / 290;
          const tx = (pedRect.left + pedRect.width / 2) - window.innerWidth / 2;
          const ty = (pedRect.top + pedRect.height / 2) - (window.innerHeight * 0.40);

          heroDrum.style.transform = \`translate3d(\${tx.toFixed(1)}px, \${ty.toFixed(1)}px, 0) scale(\${targetScale.toFixed(4)}) rotate(\${currentRotationAngle.toFixed(2)}deg)\`;
        }
      }

      requestAnimationFrame(drumRenderLoop);
    }
    requestAnimationFrame(drumRenderLoop);

    // TRIGGER THE SILKY-SMOOTH CINEMATIC FLIGHT
    function executeCinematicFlight() {
      if (isFlying || isDocked) return;
      isFlying = true;

      // 1. Get Starting Center Coordinates (relative to viewport)
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.40;
      const startScale = 1.0;
      const initialAngle = currentRotationAngle;

      // 2. Get Target Pedestal Coordinates
      const pedRect = headerPedestal.getBoundingClientRect();
      const targetX = pedRect.left + pedRect.width / 2;
      const targetY = pedRect.top + pedRect.height / 2;
      const targetScale = pedRect.width / 290; // ~0.276

      // Extra 720 degrees of regal acceleration during flight
      const flightRotationSpan = 720;
      const flightDuration = 1450; // ms
      const flightStartTime = performance.now();

      // Parabolic Arc Lift (lifts slightly as if swooping through space)
      const arcApex = 25; // px

      // Fade out the intro overlay backdrop smoothly
      introOverlay.classList.add('fade-out');

      function flightStep(now) {
        const elapsed = now - flightStartTime;
        const progress = Math.min(1, elapsed / flightDuration);

        // Spline Easing for Organic Cinematic Deceleration
        const easedProgress = easeOutQuint(progress);

        // Interpolate Position
        const curX = startX + (targetX - startX) * easedProgress;
        // Parabolic arc curve: lifts up slightly then swoops down into target
        const arcOffset = Math.sin(progress * Math.PI) * arcApex;
        const curY = startY + (targetY - startY) * easedProgress - arcOffset;

        // Anticipation scale (slightly breathes up to 1.06 at start, then smoothly descends to targetScale)
        let curScale;
        if (progress < 0.15) {
          curScale = 1.0 + Math.sin((progress / 0.15) * (Math.PI / 2)) * 0.06;
        } else {
          const pScale = (progress - 0.15) / 0.85;
          curScale = 1.06 - (1.06 - targetScale) * easeOutQuint(pScale);
        }

        // Seamless Continuous Rotation Angle (No Angle Snap!)
        currentRotationAngle = initialAngle + flightRotationSpan * easeInOutCubic(progress);

        // Convert to offset from heroDrum natural origin
        const tx = curX - (window.innerWidth / 2);
        const ty = curY - (window.innerHeight * 0.40);

        heroDrum.style.transform = \`translate3d(\${tx.toFixed(1)}px, \${ty.toFixed(1)}px, 0) scale(\${curScale.toFixed(4)}) rotate(\${currentRotationAngle.toFixed(2)}deg)\`;

        if (progress < 1) {
          requestAnimationFrame(flightStep);
        } else {
          // LANDING MOMENT: Impact & Golden Shockwave
          isFlying = false;
          isDocked = true;

          // Trigger Screen-Wide Golden Shockwave Ripple
          const shockwave = document.createElement('div');
          shockwave.className = 'shockwave-ripple';
          shockwave.style.left = targetX + 'px';
          shockwave.style.top = targetY + 'px';
          shockwave.style.width = '70px';
          shockwave.style.height = '70px';
          document.body.appendChild(shockwave);

          // Header Pedestal Glow Flash
          headerPedestal.style.borderColor = '#FFF5DC';
          headerPedestal.style.boxShadow = '0 0 35px rgba(245, 200, 90, 0.7)';
          setTimeout(() => {
            headerPedestal.style.borderColor = '';
            headerPedestal.style.boxShadow = '';
            shockwave.remove();
          }, 1000);
        }
      }

      requestAnimationFrame(flightStep);
    }

    // Auto trigger flight after 2.5s or on user tap
    const autoFlightTimer = setTimeout(executeCinematicFlight, 2500);

    startExploreBtn.addEventListener('click', () => {
      clearTimeout(autoFlightTimer);
      executeCinematicFlight();
    });

    heroBronzeDrum.addEventListener('click', () => {
      if (!isDocked && !isFlying) {
        clearTimeout(autoFlightTimer);
        executeCinematicFlight();
      }
    });

    // Replay Intro Button
    replayIntroBtn.addEventListener('click', () => {
      isDocked = false;
      isFlying = false;
      introOverlay.classList.remove('fade-out');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =========================================================
    // 3. STICKY CATEGORY NAV & SCROLLSPY
    // =========================================================
    const categoryBar = document.getElementById('categoryBar');
    const categoryScroll = document.getElementById('categoryScroll');
    const categoryPills = Array.from(document.querySelectorAll('.category-pill'));
    const sections = Array.from(document.querySelectorAll('.section-block'));

    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const catId = pill.getAttribute('data-cat-id');
        const targetSection = document.getElementById('cat-' + catId);
        if (targetSection) {
          const y = targetSection.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });

    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      let currentCatId = null;

      sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentCatId = sec.id.replace('cat-', '');
        }
      });

      if (currentCatId) {
        categoryPills.forEach(pill => {
          const id = pill.getAttribute('data-cat-id');
          if (id === currentCatId) {
            pill.classList.add('active');
            pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            pill.classList.remove('active');
          }
        });
      }

      const topBtn = document.getElementById('floatingTopBtn');
      if (scrollY > 350) {
        topBtn.classList.add('visible');
      } else {
        topBtn.classList.remove('visible');
      }
    }, { passive: true });

    document.getElementById('floatingTopBtn').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =========================================================
    // 4. INSTANT SEARCH & FILTER
    // =========================================================
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const allDishes = Array.from(document.querySelectorAll('.dish-clickable'));

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      searchClearBtn.style.display = query ? 'block' : 'none';

      sections.forEach(sec => {
        let visibleCount = 0;
        const dishes = sec.querySelectorAll('.dish-clickable');
        dishes.forEach(dish => {
          const item = JSON.parse(dish.getAttribute('data-dish'));
          const match = item.name.toLowerCase().includes(query) || 
                        (item.description && item.description.toLowerCase().includes(query));
          if (!query || match) {
            dish.style.display = dish.classList.contains('featured-card') ? 'block' : 'flex';
            visibleCount++;
          } else {
            dish.style.display = 'none';
          }
        });
        sec.style.display = visibleCount > 0 ? 'block' : 'none';
      });
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      searchInput.dispatchEvent(new Event('input'));
    });

    // =========================================================
    // 5. DISH DETAIL MODAL (POPUP)
    // =========================================================
    const modal = document.getElementById('dishModal');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDesc');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    function openDishModal(item) {
      modalImg.src = item.imageUrl || '${assetPrefix}trong-dong-logo.svg';
      modalImg.onerror = function() {
        this.src = '${assetPrefix}trong-dong-logo.svg';
      };
      modalTitle.textContent = item.name;
      modalPrice.textContent = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(item.price).replace('₫', 'đ');
      modalDesc.textContent = item.description || 'Chế biến tươi sống theo phong vị ẩm thực thượng lưu Trống Đồng Station.';

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeDishModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    allDishes.forEach(card => {
      card.addEventListener('click', () => {
        const item = JSON.parse(card.getAttribute('data-dish'));
        openDishModal(item);
      });
    });

    modalCloseBtn.addEventListener('click', closeDishModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDishModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDishModal();
    });
  </script>
</body>
</html>`;
}

// 1. Output to "/home/phongdh04/data/menu mobile/index.html" (standalone folder)
const standaloneHtml = buildHtml('./');
fs.writeFileSync('/home/phongdh04/data/menu mobile/index.html', standaloneHtml);
console.log('✅ Wrote /home/phongdh04/data/menu mobile/index.html');

// 2. Output to QRorder repository root and public
const webHtml = buildHtml('/');
fs.writeFileSync(path.join(__dirname, '../public/menu.html'), webHtml);
fs.writeFileSync(path.join(__dirname, '../menu.html'), webHtml);
if (fs.existsSync(path.join(__dirname, '../.next/standalone/public'))) {
  fs.writeFileSync(path.join(__dirname, '../.next/standalone/public/menu.html'), webHtml);
}
console.log('✅ Synchronized public/menu.html and menu.html');

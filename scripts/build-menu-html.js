const fs = require('fs');
const path = require('path');

// 1. Read menu data from scripts/menu-data.json
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

// SVG Bronze Drum raw markup (from public/trong-dong-logo.svg)
const trongDongSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FBF3D5" />
      <stop offset="45%" stop-color="#D4AF37" />
      <stop offset="85%" stop-color="#997316" />
      <stop offset="100%" stop-color="#4A3608" />
    </radialGradient>
    <linearGradient id="metalGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDF4DC" />
      <stop offset="25%" stop-color="#E5C378" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="75%" stop-color="#AA822A" />
      <stop offset="100%" stop-color="#F5DA8A" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="none" stroke="url(#metalGold)" stroke-width="2.5" opacity="0.9" />
  <circle cx="100" cy="100" r="91" fill="none" stroke="url(#metalGold)" stroke-width="1" stroke-dasharray="2,3" opacity="0.6" />
  <circle cx="100" cy="100" r="84" fill="none" stroke="url(#metalGold)" stroke-width="1.8" opacity="0.85" />
  <g opacity="0.75" stroke="url(#metalGold)" stroke-width="1.2" fill="none">
    <circle cx="100" cy="100" r="74" stroke-dasharray="6,4" />
    <circle cx="100" cy="100" r="65" stroke-width="1.5" />
    <circle cx="100" cy="100" r="56" stroke-dasharray="3,3" />
  </g>
  <circle cx="100" cy="100" r="48" fill="#14161C" stroke="url(#metalGold)" stroke-width="1.5" />
  <circle cx="100" cy="100" r="44" fill="none" stroke="url(#metalGold)" stroke-width="1" stroke-dasharray="1.5,2.5" opacity="0.6" />
  <g fill="url(#metalGold)" stroke="none">
    <polygon points="100,56 103,92 100,88 97,92" />
    <polygon points="100,144 103,108 100,112 97,108" />
    <polygon points="56,100 92,103 88,100 92,97" />
    <polygon points="144,100 108,103 112,100 108,97" />
    <polygon points="69,69 94,91 91,88 88,94" />
    <polygon points="131,131 106,109 109,112 112,106" />
    <polygon points="131,69 109,94 112,91 106,88" />
    <polygon points="69,131 91,106 88,109 94,112" />
    <polygon points="119,60 105,94 102,90 100,96" opacity="0.9" />
    <polygon points="81,140 95,106 98,110 100,104" opacity="0.9" />
    <polygon points="60,81 94,105 90,102 96,100" opacity="0.9" />
    <polygon points="140,119 106,95 110,98 104,100" opacity="0.9" />
    <polygon points="81,60 95,94 98,90 100,96" opacity="0.9" />
    <polygon points="119,140 105,106 102,110 100,104" opacity="0.9" />
    <polygon points="60,119 94,95 90,98 96,100" opacity="0.9" />
    <polygon points="140,81 106,105 110,102 104,100" opacity="0.9" />
  </g>
  <circle cx="100" cy="100" r="9" fill="url(#goldGlow)" />
  <circle cx="100" cy="100" r="4" fill="#08090C" />
  <circle cx="100" cy="100" r="2" fill="#FDF4DC" />
</svg>`;

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', 'đ');
}

// Generate the HTML
function generateHtml() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>Thực Đơn Thượng Lưu | TRỐNG ĐỒNG STATION</title>
  <meta name="description" content="Thực đơn ẩm thực cao cấp Trống Đồng Station - Không gian ẩm thực & Lounge thượng lưu đỉnh cao.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #08090C;
      --bg-darker: #040507;
      --surface: #111318;
      --surface-2: #181B22;
      --surface-3: #222631;
      --border: rgba(212, 175, 55, 0.18);
      --border-bright: rgba(212, 175, 55, 0.45);
      --text: #F7F4EB;
      --muted: #A8A295;
      --accent: #D4AF37;
      --accent-gold: #F3C766;
      --champagne: #E5C378;
      --gold-glow: rgba(212, 175, 55, 0.35);
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
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

    /* Ambient Canvas for sparkling gold dust */
    #goldCanvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* Mobile-first App Container */
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

    /* Typography Utilities */
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .font-royal {
      font-family: 'Cinzel', serif;
    }

    .text-gold {
      background: linear-gradient(135deg, #FFF1D0 0%, #F3C766 40%, #D4AF37 75%, #AA822A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .text-champagne {
      background: linear-gradient(135deg, #FFFFFF 0%, #F5DEB3 50%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* ========================================================= */
    /* 1. INTRO SPLASH SCREEN & FLYING ROTATING BRONZE DRUM      */
    /* ========================================================= */
    #introOverlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: radial-gradient(circle at center, #161920 0%, #0B0D11 50%, #030406 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.8s cubic-bezier(0.2, 0.9, 0.3, 1), visibility 0.8s ease;
      overflow: hidden;
    }

    #introOverlay.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    /* Aura glow behind drum */
    .intro-aura {
      position: absolute;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.28) 0%, rgba(212, 175, 55, 0.08) 45%, transparent 70%);
      filter: blur(25px);
      animation: auraPulse 4s ease-in-out infinite alternate;
      pointer-events: none;
    }

    @keyframes auraPulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      100% { transform: scale(1.15); opacity: 1; }
    }

    /* Rotating drum wrapper */
    .intro-drum-container {
      position: relative;
      width: 270px;
      height: 270px;
      cursor: pointer;
    }

    .intro-drum-circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      position: relative;
      animation: drumContinuousSpin 24s linear infinite;
      box-shadow: 0 0 50px rgba(212, 175, 55, 0.35), inset 0 0 30px rgba(212, 175, 55, 0.2);
      filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.9));
      transition: box-shadow 0.4s ease;
    }

    .intro-drum-circle:hover {
      box-shadow: 0 0 70px rgba(212, 175, 55, 0.55), inset 0 0 40px rgba(212, 175, 55, 0.3);
    }

    @keyframes drumContinuousSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Concentric decorative ring */
    .intro-pulse-ring {
      position: absolute;
      inset: -15px;
      border: 1px dashed rgba(212, 175, 55, 0.35);
      border-radius: 50%;
      animation: ringSpin 35s linear infinite reverse;
      pointer-events: none;
    }

    @keyframes ringSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .intro-content {
      margin-top: 32px;
      text-align: center;
      position: relative;
      z-index: 2;
      padding: 0 24px;
      transition: opacity 0.4s ease, transform 0.4s ease;
    }

    .intro-badge {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--champagne);
      display: inline-block;
      margin-bottom: 10px;
      opacity: 0.85;
    }

    .intro-title {
      font-size: 26px;
      letter-spacing: 0.12em;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .intro-desc {
      font-size: 12px;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .intro-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 28px;
      border-radius: 9999px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.08) 100%);
      border: 1px solid var(--accent);
      color: #FFF1D0;
      font-family: 'Cinzel', serif;
      font-size: 12px;
      letter-spacing: 0.15em;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      animation: btnPulse 2.5s ease-in-out infinite;
    }

    .intro-btn:hover {
      background: linear-gradient(135deg, #F3C766 0%, #D4AF37 100%);
      color: #08090C;
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 8px 30px rgba(212, 175, 55, 0.45);
    }

    @keyframes btnPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2); }
      50% { box-shadow: 0 4px 30px rgba(212, 175, 55, 0.45); }
    }

    /* Flying Drum Cloned Element (for FLIP transition into header) */
    .flying-drum-clone {
      position: fixed;
      z-index: 100000;
      pointer-events: none;
      transition: transform 1.25s cubic-bezier(0.2, 0.9, 0.25, 1),
                  opacity 0.4s ease 0.9s;
      transform-origin: center center;
      filter: drop-shadow(0 10px 25px rgba(212, 175, 55, 0.5));
    }

    /* Target ripple when drum lands */
    .dock-ripple {
      animation: rippleBurst 0.8s ease-out forwards;
    }

    @keyframes rippleBurst {
      0% {
        box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.5);
      }
      100% {
        box-shadow: 0 0 0 35px rgba(212, 175, 55, 0), 0 0 40px rgba(212, 175, 55, 0);
      }
    }

    /* ========================================================= */
    /* 2. HEADER & BANNER                                        */
    /* ========================================================= */
    .site-header {
      position: relative;
      border-bottom: 1px solid var(--border);
      overflow: hidden;
      background: #08090C;
    }

    .header-banner {
      position: relative;
      height: 190px;
      background: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85') center/cover no-repeat;
    }

    .header-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(8, 9, 12, 0.4) 0%, rgba(8, 9, 12, 0.8) 70%, #08090C 100%);
    }

    .header-banner-watermark {
      position: absolute;
      inset: 0;
      background: url('trong-dong-watermark.svg') center/contain no-repeat;
      opacity: 0.15;
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
      gap: 6px;
      padding: 6px 14px;
      background: rgba(17, 19, 24, 0.75);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-size: 11px;
      color: var(--champagne);
      backdrop-filter: blur(8px);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .replay-intro-btn:hover {
      border-color: var(--accent);
      color: #FFF;
      background: rgba(24, 27, 34, 0.9);
      transform: scale(1.02);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(17, 19, 24, 0.75);
      border: 1px solid var(--border);
      border-radius: 9999px;
      font-size: 11px;
      color: #A8A295;
      backdrop-filter: blur(8px);
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
      50% { opacity: 0.4; }
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

    /* Header Logo Ring: TARGET of the flying drum */
    .header-logo-ring {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E222B 0%, #111318 60%, #08090C 100%);
      border: 2px solid rgba(212, 175, 55, 0.6);
      padding: 4px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.25);
      margin-bottom: 12px;
      position: relative;
      transition: transform 0.3s ease;
    }

    .header-logo-ring:hover {
      transform: scale(1.06);
    }

    .header-logo-svg {
      width: 100%;
      height: 100%;
      animation: logoSubtleSpin 40s linear infinite;
    }

    @keyframes logoSubtleSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .restaurant-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .restaurant-tagline {
      font-size: 11px;
      letter-spacing: 0.15em;
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
      letter-spacing: 0.05em;
      padding: 4px 10px;
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.22);
      border-radius: 9999px;
      color: #E5C378;
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
      left: 14px;
      width: 18px;
      height: 18px;
      color: var(--accent);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      border-radius: 9999px;
      background: rgba(17, 19, 24, 0.85);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 13px;
      outline: none;
      backdrop-filter: blur(12px);
      transition: all 0.25s ease;
    }

    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
      background: rgba(24, 27, 34, 0.95);
    }

    .search-clear-btn {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      display: none;
      font-size: 16px;
    }

    /* ========================================================= */
    /* 4. STICKY CATEGORY NAVIGATION (SCROLLSPY)                 */
    /* ========================================================= */
    .category-sticky-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(8, 9, 12, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 10px 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
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
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.08) 100%);
      border-color: var(--accent);
      color: #FFF1D0;
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
    }

    .category-count {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.4);
      color: var(--champagne);
    }

    /* ========================================================= */
    /* 5. MENU SECTIONS & DISH CARDS (NO ORDER BUTTONS)          */
    /* ========================================================= */
    .menu-content {
      padding: 14px 16px 20px;
    }

    .section-block {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.15);
      position: relative;
    }

    .section-header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 40px;
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
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .featured-card:hover {
      border-color: var(--border-bright);
      transform: translateY(-2px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 25px rgba(212, 175, 55, 0.15);
    }

    .featured-img-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #0C0E12;
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
      background: linear-gradient(to top, rgba(17, 19, 24, 0.98) 0%, rgba(17, 19, 24, 0.4) 45%, transparent 100%);
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
      background: rgba(8, 9, 12, 0.85);
      border: 1px solid var(--accent);
      color: #FFF1D0;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
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
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
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
      width: 2px;
      background: var(--accent);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .row-card:hover {
      border-color: rgba(212, 175, 55, 0.35);
      background: var(--surface-2);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.08);
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
      border: 1px solid rgba(212, 175, 55, 0.15);
      background: #0C0E12;
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
      z-index: 10000;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(14px);
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
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.2);
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
      background: rgba(8, 9, 12, 0.75);
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
      color: #08090C;
      transform: rotate(90deg);
    }

    .modal-img-wrap {
      width: 100%;
      aspect-ratio: 4/3;
      position: relative;
      overflow: hidden;
      background: #0C0E12;
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
      letter-spacing: 0.15em;
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
      border: 1px dashed rgba(212, 175, 55, 0.25);
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
      background: rgba(17, 19, 24, 0.85);
      border: 1px solid var(--accent);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
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
      color: #08090C;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
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
      opacity: 0.6;
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
      color: rgba(168, 162, 149, 0.5);
    }

    /* Fallback image styling */
    img.img-error {
      background: #111318 url('trong-dong-logo.svg') center/40% no-repeat;
    }
  </style>
</head>
<body>

  <!-- Background Sparkling Gold Dust Canvas -->
  <canvas id="goldCanvas"></canvas>

  <!-- ========================================================= -->
  <!-- 1. INTRO SPLASH SCREEN WITH ROTATING & FLYING BRONZE DRUM -->
  <!-- ========================================================= -->
  <div id="introOverlay">
    <div class="intro-aura"></div>

    <div class="intro-drum-container" id="introDrumWrapper">
      <div class="intro-pulse-ring"></div>
      <div class="intro-drum-circle" id="introDrum">
        ${trongDongSvg}
      </div>
    </div>

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
  <!-- 2. MAIN APP CONTAINER (RESPONSIVE FOR MOBILE)             -->
  <!-- ========================================================= */ -->
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
        <!-- Target logo ring where the drum lands -->
        <div class="header-logo-ring" id="headerLogoRing">
          <div class="header-logo-svg" id="headerLogoSvg">
            ${trongDongSvg}
          </div>
        </div>

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
                <article class="featured-card dish-clickable" data-dish='${JSON.stringify(firstItem).replace(/'/g, "&#39;")}'>
                  <div class="featured-img-wrap">
                    <img 
                      src="${firstItem.imageUrl || '/trong-dong-logo.svg'}" 
                      alt="${firstItem.name}" 
                      class="featured-img" 
                      loading="lazy"
                      data-raw="${firstItem.imageUrl || ''}"
                      onerror="handleImgError(this)"
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
                <article class="row-card dish-clickable" data-dish='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                  <div class="row-text">
                    <h3 class="row-title font-serif">${item.name}</h3>
                    <p class="row-desc">${item.description || 'Hương vị độc bản được chế biến bởi bếp trưởng Trống Đồng Station.'}</p>
                    <div class="row-footer">
                      <span class="dish-price">${formatVND(item.price)}</span>
                    </div>
                  </div>
                  <div class="row-img-wrap">
                    <img 
                      src="${item.imageUrl || '/trong-dong-logo.svg'}" 
                      alt="${item.name}" 
                      class="row-img" 
                      loading="lazy"
                      data-raw="${item.imageUrl || ''}"
                      onerror="handleImgError(this)"
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
  <!-- 3. DISH DETAIL MODAL                                      -->
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

  <!-- JAVASCRIPT LOGIC -->
  <script>
    // Image Error Handler (handles file://, http://, and fallback)
    function handleImgError(img) {
      img.onerror = null;
      const raw = img.getAttribute('data-raw');
      if (raw && !img.src.includes('public') && location.protocol === 'file:') {
        img.src = './public' + raw;
      } else {
        img.src = 'trong-dong-logo.svg';
        img.classList.add('img-error');
      }
    }

    // =========================================================
    // 1. SPARKLING GOLD DUST CANVAS ANIMATION
    // =========================================================
    (function initGoldCanvas() {
      const canvas = document.getElementById('goldCanvas');
      const ctx = canvas.getContext('2d');
      let width, height;
      let particles = [];
      const PARTICLE_COUNT = 45;

      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
      window.addEventListener('resize', resize);
      resize();

      class Particle {
        constructor() {
          this.reset(true);
        }
        reset(initial = false) {
          this.x = Math.random() * width;
          this.y = initial ? Math.random() * height : height + 10;
          this.size = Math.random() * 2 + 0.8;
          this.speedY = Math.random() * 0.45 + 0.15;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.alpha = Math.random() * 0.6 + 0.2;
          this.alphaDir = (Math.random() - 0.5) * 0.015;
          this.color = Math.random() > 0.3 ? '#F3C766' : '#FFF1D0';
        }
        update() {
          this.y -= this.speedY;
          this.x += this.speedX;
          this.alpha += this.alphaDir;
          if (this.alpha <= 0.15 || this.alpha >= 0.85) {
            this.alphaDir = -this.alphaDir;
          }
          if (this.y < -10 || this.x < -10 || this.x > width + 10) {
            this.reset();
          }
        }
        draw() {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
          ctx.fillStyle = this.color;
          ctx.shadowBlur = this.size * 3.5;
          ctx.shadowColor = '#D4AF37';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }

      // Interactive Touch/Click sparkles
      let touchSparkles = [];
      function addSparkles(x, y) {
        for (let i = 0; i < 7; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.5 + 1;
          touchSparkles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2.5 + 1,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
            color: '#FBF0D2'
          });
        }
      }

      window.addEventListener('pointerdown', (e) => {
        addSparkles(e.clientX, e.clientY);
      });

      function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          p.update();
          p.draw();
        });

        for (let i = touchSparkles.length - 1; i >= 0; i--) {
          const s = touchSparkles[i];
          s.x += s.vx;
          s.y += s.vy;
          s.alpha -= s.decay;
          if (s.alpha <= 0) {
            touchSparkles.splice(i, 1);
          } else {
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#F3C766';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        requestAnimationFrame(animate);
      }
      animate();
    })();

    // =========================================================
    // 2. INTRO ROTATING BRONZE DRUM & FLYING INTO HEADER ANIMATION
    // =========================================================
    const introOverlay = document.getElementById('introOverlay');
    const introDrum = document.getElementById('introDrum');
    const startExploreBtn = document.getElementById('startExploreBtn');
    const replayIntroBtn = document.getElementById('replayIntroBtn');
    const headerLogoRing = document.getElementById('headerLogoRing');
    const headerLogoSvg = document.getElementById('headerLogoSvg');
    let hasPlayedIntro = false;

    function playFlightAnimation() {
      if (hasPlayedIntro) return;
      hasPlayedIntro = true;

      // 1. Get exact coordinates of the rotating drum and target logo
      const drumRect = introDrum.getBoundingClientRect();
      const targetRect = headerLogoRing.getBoundingClientRect();

      // Create a cloned flying drum to perform the FLIP animation
      const clone = introDrum.cloneNode(true);
      clone.classList.add('flying-drum-clone');
      clone.style.width = drumRect.width + 'px';
      clone.style.height = drumRect.height + 'px';
      clone.style.left = drumRect.left + 'px';
      clone.style.top = drumRect.top + 'px';
      document.body.appendChild(clone);

      // Hide original drum & fade out intro overlay backdrop
      introDrum.style.visibility = 'hidden';
      introOverlay.classList.add('fade-out');

      // Calculate travel delta and scale
      const deltaX = (targetRect.left + targetRect.width / 2) - (drumRect.left + drumRect.width / 2);
      const deltaY = (targetRect.top + targetRect.height / 2) - (drumRect.top + drumRect.height / 2);
      const scaleRatio = targetRect.width / drumRect.width;

      // Force reflow
      clone.getBoundingClientRect();

      // Trigger Flight Transition
      requestAnimationFrame(() => {
        clone.style.transform = \`translate(\${deltaX}px, \${deltaY}px) scale(\${scaleRatio}) rotate(720deg)\`;
      });

      // When the flying drum arrives at the destination
      setTimeout(() => {
        clone.remove();
        headerLogoRing.classList.add('dock-ripple');
        headerLogoSvg.style.opacity = '1';

        setTimeout(() => {
          introOverlay.style.display = 'none';
          headerLogoRing.classList.remove('dock-ripple');
        }, 800);
      }, 1250);
    }

    // Auto trigger flight after 2.4s or when clicking "Khám phá"
    const autoFlightTimer = setTimeout(playFlightAnimation, 2400);

    startExploreBtn.addEventListener('click', () => {
      clearTimeout(autoFlightTimer);
      playFlightAnimation();
    });

    introDrum.addEventListener('click', () => {
      clearTimeout(autoFlightTimer);
      playFlightAnimation();
    });

    // Replay Intro Button
    replayIntroBtn.addEventListener('click', () => {
      hasPlayedIntro = false;
      introOverlay.style.display = 'flex';
      introOverlay.classList.remove('fade-out');
      introDrum.style.visibility = 'visible';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // =========================================================
    // 3. STICKY CATEGORY NAV & SCROLLSPY
    // =========================================================
    const categoryBar = document.getElementById('categoryBar');
    const categoryScroll = document.getElementById('categoryScroll');
    const categoryPills = Array.from(document.querySelectorAll('.category-pill'));
    const sections = Array.from(document.querySelectorAll('.section-block'));

    // Click to scroll to category
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

    // ScrollSpy active state
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
            // Ensure visible in scroll view
            pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            pill.classList.remove('active');
          }
        });
      }

      // Floating top button toggle
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
      modalImg.src = item.imageUrl || 'trong-dong-logo.svg';
      modalImg.onerror = function() {
        this.src = 'trong-dong-logo.svg';
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

// Generate files
const htmlContent = generateHtml();
fs.writeFileSync(path.join(__dirname, '../public/menu.html'), htmlContent);
fs.writeFileSync(path.join(__dirname, '../menu.html'), htmlContent);

console.log('✅ Generated public/menu.html and menu.html successfully!');
console.log('Size:', (htmlContent.length / 1024).toFixed(1), 'KB');

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function main() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Tạo SVG icon phong cách luxury hoàng gia với màu vàng kim (Champagne gold) trên nền tối
  const generateSvg = (size: number, isMaskable = false) => {
    const padding = isMaskable ? size * 0.15 : size * 0.08;
    const innerSize = size - padding * 2;
    const bgRadius = isMaskable ? '0' : `${size * 0.22}`;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EED7A1" />
            <stop offset="50%" stop-color="#C9A96A" />
            <stop offset="100%" stop-color="#9A7B38" />
          </linearGradient>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#18181B" />
            <stop offset="100%" stop-color="#0B0B0C" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Nền Bo Góc Sang Trọng -->
        <rect width="${size}" height="${size}" rx="${bgRadius}" fill="url(#bgGrad)" />
        <rect width="${size - 4}" height="${size - 4}" x="2" y="2" rx="${bgRadius}" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-opacity="0.3" />

        <!-- Biểu Tượng Chuông Phục Vụ / Quầy Bar Sang Trọng -->
        <g transform="translate(${size * 0.5}, ${size * 0.5}) scale(${size / 100})">
          <!-- Vòng hào quang -->
          <circle cx="0" cy="0" r="32" fill="#C9A96A" fill-opacity="0.08" />

          <!-- Chuông gọi nhân viên -->
          <path d="M0 -22 C-14 -22 -18 -8 -18 10 L-22 14 L22 14 L18 10 C18 -8 14 -22 0 -22 Z" fill="url(#goldGrad)" filter="url(#glow)" />
          <!-- Quả lắc -->
          <circle cx="0" cy="-26" r="3.5" fill="#EED7A1" />
          <path d="M-6 17 C-4 21 4 21 6 17 Z" fill="url(#goldGrad)" />
          
          <!-- Chữ QRO phong cách Monogram -->
          <text x="0" y="3" font-family="serif" font-size="9" font-weight="bold" fill="#0B0B0C" text-anchor="middle" letter-spacing="1">QR</text>
        </g>
      </svg>
    `;
  };

  const sizes = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'badge-72.png', size: 72, maskable: false },
  ];

  for (const item of sizes) {
    const svgStr = generateSvg(item.size, item.maskable);
    const dest = path.join(iconsDir, item.name);
    await sharp(Buffer.from(svgStr)).png().toFile(dest);
    console.log(`✓ Đã tạo icon: public/icons/${item.name} (${item.size}x${item.size})`);
  }
}

main().catch(console.error);

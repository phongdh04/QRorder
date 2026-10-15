import { prisma } from '../src/lib/prisma';
import { ALL_BLUEPRINT_TABLES } from '../src/lib/floor-plan-data';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function main() {
  console.log('=== TIẾN HÀNH ĐỒNG BỘ TOÀN BỘ BÀN & MÃ QR CỦA QUÁN ===');

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-bar' },
  });

  if (!restaurant) {
    console.error('Không tìm thấy nhà hàng demo-bar');
    return;
  }

  // 1. Đảm bảo có phân khu
  let zoneA = await prisma.zone.findFirst({
    where: { restaurant_id: restaurant.id, name: 'Khu A (Trong nhà & VIP)' },
  });
  if (!zoneA) {
    zoneA = await prisma.zone.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Khu A (Trong nhà & VIP)',
        sort_order: 1,
      },
    });
  }

  let zoneB = await prisma.zone.findFirst({
    where: { restaurant_id: restaurant.id, name: 'Khu B (Ngoài trời & Bar)' },
  });
  if (!zoneB) {
    zoneB = await prisma.zone.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Khu B (Ngoài trời & Bar)',
        sort_order: 2,
      },
    });
  }

  // 2. Lấy danh sách bàn hiện tại
  const existingTables = await prisma.table.findMany({
    where: { restaurant_id: restaurant.id },
  });

  console.log(`Hiện có ${existingTables.length} bàn trong DB. Tiến hành đồng bộ ${ALL_BLUEPRINT_TABLES.length} bàn blueprint...`);

  const qrDir = path.join(process.cwd(), 'public/qrcodes');
  fs.makedirsSync?.(qrDir) ?? fs.mkdirSync(qrDir, { recursive: true });

  const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let createdCount = 0;
  let updatedCount = 0;

  for (const bp of ALL_BLUEPRINT_TABLES) {
    const assignedZoneId = bp.zone === 'indoor' || bp.zone === 'dj' ? zoneA.id : zoneB.id;

    // Tìm bàn tương ứng
    const existing = existingTables.find((t) => {
      if (t.name === bp.name || t.name === bp.code) return true;
      if (bp.zone === 'outdoor') {
        const num = parseInt(bp.code.replace('NT-', ''), 10);
        if (!isNaN(num)) {
          const padded = num < 10 ? `0${num}` : `${num}`;
          return t.name === `Bàn ${padded}` || t.name === `Bàn ${num}` || t.name === `Bàn VIP ${padded}`;
        }
      }
      return false;
    });

    let currentToken = '';
    let tableName = bp.name;

    if (existing) {
      await prisma.table.update({
        where: { id: existing.id },
        data: {
          name: bp.name,
          zone: bp.zone,
          zone_id: assignedZoneId,
          pos_x: bp.x,
          pos_y: bp.y,
          shape: bp.shape,
          capacity: bp.capacity,
          is_active: true,
        },
      });
      currentToken = existing.token;
      updatedCount++;
    } else {
      const codeClean = bp.code.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const token = `table_${codeClean}_${crypto.randomBytes(8).toString('hex')}`;
      const created = await prisma.table.create({
        data: {
          restaurant_id: restaurant.id,
          name: bp.name,
          token,
          is_active: true,
          zone: bp.zone,
          zone_id: assignedZoneId,
          pos_x: bp.x,
          pos_y: bp.y,
          shape: bp.shape,
          capacity: bp.capacity,
        },
      });
      currentToken = created.token;
      createdCount++;
    }

    // 3. Tạo file QR Code PNG chất lượng cao lưu vào public/qrcodes/
    const tableUrl = `${domain}/t/${currentToken}`;
    const qrFilename = `qr_${bp.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
    const qrFilePath = path.join(qrDir, qrFilename);

    await QRCode.toFile(qrFilePath, tableUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  // Tạo thêm QR code dạng token và name để tương thích ngược
  const allFinalTables = await prisma.table.findMany({
    where: { restaurant_id: restaurant.id },
  });

  for (const t of allFinalTables) {
    const tableUrl = `${domain}/t/${t.token}`;
    const tokenQrPath = path.join(qrDir, `${t.token}.png`);
    await QRCode.toFile(tokenQrPath, tableUrl, { width: 500, margin: 2 });
  }

  console.log(`=== HOÀN TẤT ĐỒNG BỘ: Tạo mới ${createdCount} bàn, cập nhật ${updatedCount} bàn. Tổng cộng ${allFinalTables.length} bàn đã sẵn sàng kèm mã QR! ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

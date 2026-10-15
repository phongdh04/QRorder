import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== TIẾN HÀNH FILL ẢNH CHÍNH XÁC VÀO DATABASE CHO 134 MÓN ĂN ===');

  const mappingPath = path.join(process.cwd(), 'scripts/dish-images-map.json');
  const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-bar' },
  });

  if (!restaurant) {
    console.error('Không tìm thấy nhà hàng demo-bar');
    return;
  }

  let updatedCount = 0;

  for (const [dishName, imageUrl] of Object.entries(mapping)) {
    if (!imageUrl) continue;

    const res = await prisma.menuItem.updateMany({
      where: {
        restaurant_id: restaurant.id,
        name: dishName,
      },
      data: {
        image_url: imageUrl,
      },
    });

    if (res.count > 0) {
      updatedCount += res.count;
      console.log(`✓ Đã cập nhật ảnh món: "${dishName}" -> ${imageUrl}`);
    } else {
      console.warn(`! Không tìm thấy món trong DB: "${dishName}"`);
    }
  }

  console.log(`\n=== HOÀN TẤT: ĐÃ CẬP NHẬT THÀNH CÔNG ${updatedCount} MÓN ĂN VÀO DATABASE ===`);

  // Bây giờ cập nhật trực tiếp vào file scripts/seed-trong-dong.ts để đồng bộ 100%
  const seedFile = path.join(process.cwd(), 'scripts/seed-trong-dong.ts');
  let seedContent = fs.readFileSync(seedFile, 'utf-8');

  let seedUpdated = 0;
  for (const [dishName, imageUrl] of Object.entries(mapping)) {
    if (!imageUrl) continue;
    // Tìm đoạn khai báo món có name: "dishName" và thay imageUrl
    // Regex tìm khối món ăn
    const escapedName = dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const dishRegex = new RegExp(`(name:\\s*['"\`]${escapedName}['"\`][\\s\\S]*?imageUrl:\\s*)[^,\\n]+(,)`, 'g');
    if (dishRegex.test(seedContent)) {
      seedContent = seedContent.replace(dishRegex, `$1'${imageUrl}'$2`);
      seedUpdated++;
    }
  }

  fs.writeFileSync(seedFile, seedContent, 'utf-8');
  console.log(`* Đã đồng bộ ${seedUpdated} URL ảnh vào file scripts/seed-trong-dong.ts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

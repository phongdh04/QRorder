import { prisma } from '../src/lib/prisma';
import { PLAN_CONFIGS, RestaurantPlan, formatBytes, getRestaurantQuotaStats } from '../src/lib/image/quota';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'list') {
    await listRestaurants();
    return;
  }

  if (command === 'set') {
    const target = args[1];
    const planArg = args[2]?.toLowerCase() as RestaurantPlan;

    if (!target || !planArg || !['basic', 'pro'].includes(planArg)) {
      console.error('\n❌ Cú pháp không hợp lệ.');
      console.log('Cách dùng: npx tsx scripts/manage-restaurant-plan.ts set <id-hoặc-slug> <basic|pro> [--images <số_lượng>] [--bytes <MB>] [--mode <photo|minimal>]\n');
      process.exit(1);
    }

    // Parse options
    let customImages: number | undefined;
    let customBytesMb: number | undefined;
    let customMode: string | undefined;

    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--images' && args[i + 1]) {
        customImages = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--bytes' && args[i + 1]) {
        customBytesMb = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--mode' && args[i + 1]) {
        customMode = args[i + 1].toLowerCase();
        i++;
      }
    }

    await setRestaurantPlan(target, planArg, {
      customImages,
      customBytesMb,
      customMode,
    });
    return;
  }

  console.error(`\n❌ Lệnh không xác định: "${command}"`);
  printHelp();
  process.exit(1);
}

function printHelp() {
  console.log(`
=============================================================================
🛠️  CÔNG CỤ QUẢN TRỊ HỆ THỐNG: QUẢN LÝ GÓI & HẠN MỨC ẢNH NHÀ HÀNG (QR ORDER)
=============================================================================

Lệnh có sẵn:
1. Danh sách các quán và dung lượng đang sử dụng:
   npx tsx scripts/manage-restaurant-plan.ts list

2. Cài đặt gói dịch vụ cho một quán (áp dụng hạn mức mặc định của gói):
   npx tsx scripts/manage-restaurant-plan.ts set <id-hoặc-slug> <basic|pro>
   Ví dụ:
   npx tsx scripts/manage-restaurant-plan.ts set the-velvet-lounge pro
   npx tsx scripts/manage-restaurant-plan.ts set the-velvet-lounge basic

3. Cài đặt gói kèm hạn mức tùy chỉnh:
   npx tsx scripts/manage-restaurant-plan.ts set <id-hoặc-slug> pro --images 500 --bytes 300
   (Cho phép tối đa 500 ảnh và 300MB)

4. Chỉnh chế độ hiển thị:
   npx tsx scripts/manage-restaurant-plan.ts set <id-hoặc-slug> pro --mode minimal
`);
}

async function listRestaurants() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { created_at: 'asc' },
  });

  if (restaurants.length === 0) {
    console.log('\nChưa có nhà hàng nào trong hệ thống.');
    return;
  }

  console.log(`\nDANH SÁCH NHÀ HÀNG VÀ HẠN MỨC (${restaurants.length} quán):\n`);
  console.log(
    '------------------------------------------------------------------------------------------------------'
  );
  console.log(
    `| ${'ID / SLUG'.padEnd(28)} | ${'TÊN QUÁN'.padEnd(22)} | ${'GÓI'.padEnd(7)} | ${'SỐ ẢNH'.padEnd(12)} | ${'DUNG LƯỢNG'.padEnd(15)} | ${'CHẾ ĐỘ'.padEnd(8)} |`
  );
  console.log(
    '------------------------------------------------------------------------------------------------------'
  );

  for (const r of restaurants) {
    const stats = await getRestaurantQuotaStats(r.id);
    const idSlug = `${r.slug} (${r.id.slice(0, 8)}...)`.padEnd(28);
    const name = r.name.slice(0, 20).padEnd(22);
    const plan = stats.plan.toUpperCase().padEnd(7);
    const images = `${stats.usedImages} / ${stats.maxImages}`.padEnd(12);
    const bytes = `${formatBytes(stats.usedBytes)} / ${formatBytes(stats.maxBytes)}`.padEnd(15);
    const mode = stats.displayMode.padEnd(8);

    console.log(`| ${idSlug} | ${name} | ${plan} | ${images} | ${bytes} | ${mode} |`);
  }

  console.log(
    '------------------------------------------------------------------------------------------------------\n'
  );
}

async function setRestaurantPlan(
  target: string,
  plan: RestaurantPlan,
  options: {
    customImages?: number;
    customBytesMb?: number;
    customMode?: string;
  }
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [{ id: target }, { slug: target }],
    },
  });

  if (!restaurant) {
    console.error(`\n❌ Không tìm thấy nhà hàng nào với ID hoặc Slug: "${target}"\n`);
    process.exit(1);
  }

  const defaultPlanConfig = PLAN_CONFIGS[plan];
  const quotaCount = options.customImages !== undefined ? options.customImages : defaultPlanConfig.maxImages;
  const quotaBytes =
    options.customBytesMb !== undefined
      ? BigInt(options.customBytesMb) * BigInt(1024 * 1024)
      : BigInt(defaultPlanConfig.maxBytes);

  const displayMode =
    options.customMode && ['photo', 'minimal'].includes(options.customMode)
      ? options.customMode
      : undefined;

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      plan,
      image_quota_count: quotaCount,
      image_quota_bytes: quotaBytes,
      ...(displayMode ? { menu_display_mode: displayMode } : {}),
    },
  });

  console.log(`\n✅ CẬP NHẬT THÀNH CÔNG CHO NHÀ HÀNG "${updated.name}"!`);
  console.log('--------------------------------------------------');
  console.log(`• ID:               ${updated.id}`);
  console.log(`• Slug:             ${updated.slug}`);
  console.log(`• Gói mới:          ${updated.plan.toUpperCase()} (${defaultPlanConfig.name})`);
  console.log(`• Hạn mức số ảnh:   ${updated.image_quota_count} ảnh`);
  console.log(`• Hạn mức dung lượng:${formatBytes(updated.image_quota_bytes)}`);
  console.log(`• Chế độ hiển thị:  ${updated.menu_display_mode}`);
  console.log('--------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

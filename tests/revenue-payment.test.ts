import { PrismaClient } from '@prisma/client';
import { adminPayTableSession, adminReopenTableSession } from '../src/lib/dal/payment';
import { getVnDayRangeUtc, getVnDateKey } from '../src/lib/tz';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG CHO THANH TOÁN & DOANH THU');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Quán chính & Quán B để kiểm tra Multi-tenant Isolation
  const mainBar = await prisma.restaurant.findUnique({ where: { slug: 'demo-bar' } });
  if (!mainBar) throw new Error('Không tìm thấy quán demo-bar');

  let barB = await prisma.restaurant.findUnique({ where: { slug: 'bar-b-tenant-test' } });
  if (!barB) {
    barB = await prisma.restaurant.create({
      data: {
        name: 'Bar B Test Isolation',
        slug: 'bar-b-tenant-test',
      },
    });
  }

  // Tạo các bàn chuyên dụng cho bộ test để không xung đột unique index với bàn đang phục vụ
  const uniqueSuffix = Date.now().toString();
  const testTableA = await prisma.table.create({
    data: {
      restaurant_id: mainBar.id,
      name: `Bàn Test A-${uniqueSuffix.slice(-4)}`,
      token: `token_test_a_${uniqueSuffix}_20chars`,
    },
  });

  const testTableB = await prisma.table.create({
    data: {
      restaurant_id: barB.id,
      name: `Bàn Test B-${uniqueSuffix.slice(-4)}`,
      token: `token_test_b_${uniqueSuffix}_20chars`,
    },
  });

  const sampleMenuItem = await prisma.menuItem.findFirst({ where: { restaurant_id: mainBar.id } });
  if (!sampleMenuItem) throw new Error('Không có món mẫu');

  try {
    // =========================================================================
    // TEST 1: Tính tổng tiền loại trừ đơn hủy (Cancelled orders excluded)
    // =========================================================================
    console.log('--- TEST 1: Tính tổng tiền ở server loại trừ đơn hủy ---');
    const session1 = await prisma.tableSession.create({
      data: {
        restaurant_id: mainBar.id,
        table_id: testTableA.id,
        status: 'open',
        total: 0,
      },
    });

    // Đơn 1: 2 món x 100k = 200k (status: served)
    const order1 = await prisma.order.create({
      data: {
        restaurant_id: mainBar.id,
        table_id: testTableA.id,
        session_id: session1.id,
        status: 'served',
      },
    });
    await prisma.orderItem.create({
      data: {
        order_id: order1.id,
        menu_item_id: sampleMenuItem.id,
        name_snapshot: 'Cocktail A',
        price_snapshot: 100000,
        quantity: 2,
      },
    });

    // Đơn 2: 1 món x 300k = 300k (status: cancelled)
    const order2 = await prisma.order.create({
      data: {
        restaurant_id: mainBar.id,
        table_id: testTableA.id,
        session_id: session1.id,
        status: 'cancelled',
        cancel_reason: 'Khách đổi ý',
      },
    });
    await prisma.orderItem.create({
      data: {
        order_id: order2.id,
        menu_item_id: sampleMenuItem.id,
        name_snapshot: 'Cocktail B Bị Hủy',
        price_snapshot: 300000,
        quantity: 1,
      },
    });

    // Tiến hành thanh toán
    const payResult1 = await adminPayTableSession(mainBar.id, session1.id, 'cash');
    assert(
      payResult1.calculatedTotal === 200000 && payResult1.session.total === 200000,
      'Tổng tiền thanh toán đúng 200.000đ, đã loại trừ đơn bị hủy 300.000đ'
    );
    assert(payResult1.session.status === 'paid', 'Trạng thái phiên cập nhật thành paid');

    // =========================================================================
    // TEST 2: Chặn thanh toán hai lần (Idempotent guard)
    // =========================================================================
    console.log('\n--- TEST 2: Chặn thanh toán hai lần trên cùng 1 phiên ---');
    let doublePayBlocked = false;
    try {
      await adminPayTableSession(mainBar.id, session1.id, 'transfer');
    } catch (err: any) {
      doublePayBlocked = true;
      assert(
        err.message.includes('đã được thanh toán trước đó'),
        'Ném lỗi từ chối thanh toán lần 2 rõ ràng: "' + err.message + '"'
      );
    }
    assert(doublePayBlocked, 'Thanh toán lần 2 bị chặn hoàn toàn');

    // =========================================================================
    // TEST 3: Ranh giới ngày theo giờ VN (23:50 và 00:10 rơi vào đúng ngày)
    // =========================================================================
    console.log('\n--- TEST 3: Ranh giới ngày theo giờ VN (UTC+7) ---');
    // Ngày VN mục tiêu: 2026-10-15
    // Mốc 1: 2026-10-15 23:50 VN = 2026-10-15 16:50 UTC (cùng ngày VN 15/10)
    // Mốc 2: 2026-10-16 00:10 VN = 2026-10-15 17:10 UTC (sang ngày VN 16/10)
    const vnRange15 = getVnDayRangeUtc(2026, 10, 15);
    const time2350 = new Date(Date.UTC(2026, 9, 15, 16, 50, 0)); // 23:50 VN
    const time0010 = new Date(Date.UTC(2026, 9, 15, 17, 10, 0)); // 00:10 VN ngày hôm sau

    const key2350 = getVnDateKey(time2350);
    const key0010 = getVnDateKey(time0010);

    assert(key2350 === '2026-10-15', `Bill lúc 23:50 VN có date key là 2026-10-15 (thực tế: ${key2350})`);
    assert(key0010 === '2026-10-16', `Bill lúc 00:10 VN sang ngày mới là 2026-10-16 (thực tế: ${key0010})`);

    assert(
      time2350 >= vnRange15.startUtc && time2350 <= vnRange15.endUtc,
      'Bill 23:50 VN nằm TRONG khoảng ngày 15/10 VN'
    );
    assert(
      time0010 > vnRange15.endUtc,
      'Bill 00:10 VN nằm NGOÀI khoảng ngày 15/10 VN'
    );

    // =========================================================================
    // TEST 4: Bàn quán A không đọc/thanh toán được dữ liệu quán B (Tenant Isolation)
    // =========================================================================
    console.log('\n--- TEST 4: Cách ly dữ liệu đa quán (Tenant Isolation) ---');
    const sessionB = await prisma.tableSession.create({
      data: {
        restaurant_id: barB.id,
        table_id: testTableB.id,
        status: 'open',
        total: 150000,
      },
    });

    const orderB = await prisma.order.create({
      data: {
        restaurant_id: barB.id,
        table_id: testTableB.id,
        session_id: sessionB.id,
        status: 'served',
      },
    });
    await prisma.orderItem.create({
      data: {
        order_id: orderB.id,
        menu_item_id: sampleMenuItem.id,
        name_snapshot: 'Cocktail Quán B',
        price_snapshot: 150000,
        quantity: 1,
      },
    });

    let crossTenantBlocked = false;
    try {
      // Quán A cố tình gọi thanh toán session của Quán B
      await adminPayTableSession(mainBar.id, sessionB.id, 'cash');
    } catch (err: any) {
      crossTenantBlocked = true;
      assert(
        err.message.includes('quán khác'),
        'Từ chối thanh toán chéo quán: "' + err.message + '"'
      );
    }
    assert(crossTenantBlocked, 'Quán A không thể thanh toán phiên của Quán B');

    // =========================================================================
    // TEST 5: Mở lại bill (Reopen Bill) & Ghi nhật ký Audit Log
    // =========================================================================
    console.log('\n--- TEST 5: Mở lại bill dành cho Owner & Ghi Audit Log ---');
    const ownerUser = await prisma.user.findFirst({ where: { restaurant_id: mainBar.id, role: 'owner' } });
    if (!ownerUser) throw new Error('Không tìm thấy tài khoản Owner');

    // Mở lại session1
    const reopened = await adminReopenTableSession(
      mainBar.id,
      ownerUser.id,
      'owner',
      session1.id,
      'Khách gọi thêm món sau thanh toán'
    );

    assert(reopened.status === 'open' && reopened.paid_at === null, 'Session1 đã chuyển về status: open');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        session_id: session1.id,
        action: 'reopen_session',
      },
      orderBy: { created_at: 'desc' },
    });

    assert(
      auditLog !== null && auditLog.reason === 'Khách gọi thêm món sau thanh toán',
      'Đã ghi nhận nhật ký vào bảng audit_logs với lý do chính xác'
    );

    // Thử mở lại bill bằng role staff -> phải bị chặn
    let staffBlocked = false;
    try {
      await adminReopenTableSession(mainBar.id, 'staff_id', 'staff', session1.id, 'Staff thử mở');
    } catch (err: any) {
      staffBlocked = true;
    }
    assert(staffBlocked, 'Tài khoản role "staff" bị chặn không cho mở lại bill');

  } finally {
    // Dọn dẹp dữ liệu test
    await prisma.table.deleteMany({
      where: { id: { in: [testTableA.id, testTableB.id] } },
    });
  }

  console.log('\n====================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Lỗi khi chạy test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

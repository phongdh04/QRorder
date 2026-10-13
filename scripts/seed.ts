import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ĐANG KHỞI TẠO SEED DỮ LIỆU DEMO BAR ---');

  // Kiểm tra nếu đã có quán Demo Bar
  let restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-bar' },
  });

  const barTheme = {
    bg: '#0B0B0C',
    surface: '#151517',
    accent: '#C9A96A',
    currency: 'VND',
    cover_image_url:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
  };

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'The Velvet Lounge',
        slug: 'demo-bar',
        logo_url: null,
        theme: barTheme,
      },
    });
    console.log(`+ Đã tạo quán bar: ${restaurant.name} (${restaurant.id})`);
  } else {
    // Cập nhật theme mới
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { theme: barTheme },
    });
    console.log(`* Quán bar đã tồn tại: ${restaurant.name}`);
  }

  // 1. Tạo tài khoản chủ quán (Owner)
  const ownerEmail = 'owner@demobar.vn';
  const ownerRawPassword = 'Admin@123456';
  const passwordHash = await bcrypt.hash(ownerRawPassword, 10);

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!existingOwner) {
    await prisma.user.create({
      data: {
        restaurant_id: restaurant.id,
        email: ownerEmail,
        password_hash: passwordHash,
        name: 'Quản Lý Quán Bar',
        role: 'owner',
      },
    });
    console.log(`+ Đã tạo tài khoản Owner: ${ownerEmail}`);
  } else {
    console.log(`* Tài khoản Owner đã tồn tại: ${ownerEmail}`);
  }

  // 2. Tạo 10 bàn
  const existingTables = await prisma.table.findMany({
    where: { restaurant_id: restaurant.id },
  });

  let sampleFirstTableToken = '';

  if (existingTables.length < 10) {
    for (let i = 1; i <= 10; i++) {
      const tableName = `Bàn ${i < 10 ? '0' + i : i}`;
      const token = `table_${i}_${crypto.randomBytes(12).toString('hex')}`; // >= 28 ký tự
      
      const existing = existingTables.find((t) => t.name === tableName);
      if (!existing) {
        const createdTable = await prisma.table.create({
          data: {
            restaurant_id: restaurant.id,
            name: tableName,
            token,
            is_active: true,
          },
        });
        if (i === 1) sampleFirstTableToken = createdTable.token;
      } else if (i === 1) {
        sampleFirstTableToken = existing.token;
      }
    }
    console.log('+ Đã tạo danh sách 10 bàn với token ngẫu nhiên bảo mật (>= 20 ký tự)');
  } else {
    sampleFirstTableToken = existingTables[0].token;
    console.log(`* Đã có sẵn ${existingTables.length} bàn`);
  }

  // 3. Tạo 4 danh mục
  const categoryDefs = [
    { name: 'Signature Cocktail', sort_order: 1 },
    { name: 'Whisky & Spirits', sort_order: 2 },
    { name: 'Craft Beer', sort_order: 3 },
    { name: 'Finger Food & Tapas', sort_order: 4 },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of categoryDefs) {
    const existing = await prisma.category.findFirst({
      where: { restaurant_id: restaurant.id, name: cat.name },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: {
          restaurant_id: restaurant.id,
          name: cat.name,
          sort_order: cat.sort_order,
          is_active: true,
        },
      });
      categoriesMap[cat.name] = created.id;
    } else {
      categoriesMap[cat.name] = existing.id;
    }
  }
  console.log('+ Đã tạo 4 danh mục thực đơn');

  // 4. Tạo 12 món đồ uống và món ăn mẫu
  const menuItemsDef = [
    // Cocktail
    {
      cat: 'Signature Cocktail',
      name: 'Old Fashioned',
      description: 'Bourbon whiskey thượng hạng, Angostura bitters, đường nâu mộc và tinh dầu vỏ cam nướng gỗ sồi',
      price: 160000,
      image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      sort_order: 1,
    },
    {
      cat: 'Signature Cocktail',
      name: 'Smoked Velvet Negroni',
      description: 'London Dry Gin, Campari đắng thanh, Sweet Vermouth đỏ sẫm, xông khói gỗ sồi nồng nàn tại bàn',
      price: 185000,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      sort_order: 2,
    },
    {
      cat: 'Signature Cocktail',
      name: 'Cold Brew Espresso Martini',
      description: 'Vodka cao cấp, rượu cà phê Kahlua và shot espresso ủ lạnh với lớp crema mịn màng',
      price: 150000,
      image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
      sort_order: 3,
    },
    {
      cat: 'Signature Cocktail',
      name: 'Passionfruit Mint Mojito',
      description: 'Rum trắng hảo hạng, chanh xanh tươi, lá bạc hà vườn và mật chanh leo nhiệt đới sảng khoái',
      price: 140000,
      image_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80',
      sort_order: 4,
    },

    // Whisky & Spirits
    {
      cat: 'Whisky & Spirits',
      name: 'Macallan 12 Double Cask',
      description: 'Hương mật ong rừng, gừng ấm nhẹ, hậu vị gỗ sồi ủ thùng sherry châu Âu ngọt ngào kéo dài',
      price: 250000,
      image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
      sort_order: 1,
    },
    {
      cat: 'Whisky & Spirits',
      name: 'Glenfiddich 15 Single Malt',
      description: 'Ủ trong thùng Solera vat, phảng phất hương vani, hạnh nhân, quế và quả mọng sấy khô',
      price: 220000,
      image_url: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80',
      sort_order: 2,
    },
    {
      cat: 'Whisky & Spirits',
      name: "Hendrick's Botanical Tonic",
      description: 'Gin chưng cất dưa leo & hoa hồng Bungary, phục vụ cùng tonic thượng hạng và lát dưa leo dài',
      price: 170000,
      image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
      sort_order: 3,
    },

    // Craft Beer
    {
      cat: 'Craft Beer',
      name: 'East West Pale Ale',
      description: 'Bia thủ công cân bằng hoàn hảo giữa hoa bia Mỹ thơm ngát và vị ngọt thanh dịu từ lúa mạch',
      price: 95000,
      image_url: 'https://images.unsplash.com/photo-1608270191763-8a9d1858564e?auto=format&fit=crop&w=800&q=80',
      sort_order: 1,
    },
    {
      cat: 'Craft Beer',
      name: 'Pasteur Street Jasmine IPA',
      description: 'Dòng bia IPA đậm đà hòa quyện hương hoa nhài Việt Nam ngào ngạt, hậu vị đắng thanh quý phái',
      price: 110000,
      image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
      sort_order: 2,
    },
    {
      cat: 'Craft Beer',
      name: 'Corona Extra with Lime',
      description: 'Bia nhập khẩu tươi mát phục vụ cùng lát chanh vàng mát lạnh tinh khiết',
      price: 75000,
      image_url: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?auto=format&fit=crop&w=800&q=80',
      sort_order: 3,
    },

    // Finger Food & Tapas
    {
      cat: 'Finger Food & Tapas',
      name: 'Bò Fuji Nướng Đá Núi Lửa',
      description: 'Thịt bò vân mỡ mềm tan ăn kèm sốt tiêu đen đặc chế và muối khoáng hồng Himalaya',
      price: 220000,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      sort_order: 1,
    },
    {
      cat: 'Finger Food & Tapas',
      name: 'Khoai Tây Truffle & Parmesan',
      description: 'Khoai tây chiên vàng giòn rụm tẩm dầu nấm truffle đen thơm nồng và phô mai Parmesan bào nhuyễn',
      price: 120000,
      image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
      sort_order: 2,
    },
  ];

  for (const item of menuItemsDef) {
    const catId = categoriesMap[item.cat];
    if (!catId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: { restaurant_id: restaurant.id, name: item.name },
    });

    if (!existing) {
      await prisma.menuItem.create({
        data: {
          restaurant_id: restaurant.id,
          category_id: catId,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          sort_order: item.sort_order,
          is_available: true,
        },
      });
    }
  }
  console.log('+ Đã tạo 12 món ăn và đồ uống mẫu');

  // 5. Tạo 40 hóa đơn đã thanh toán rải trong 30 ngày cho module doanh thu
  const allTables = await prisma.table.findMany({ where: { restaurant_id: restaurant.id } });
  const allMenuItems = await prisma.menuItem.findMany({ where: { restaurant_id: restaurant.id } });

  const existingPaidCount = await prisma.tableSession.count({
    where: { restaurant_id: restaurant.id, status: 'paid' },
  });

  if (existingPaidCount < 20) {
    console.log('+ Đang khởi tạo 40 hóa đơn đã thanh toán rải trong 30 ngày qua...');
    const nowMs = Date.now();
    const dayMs = 24 * 3600 * 1000;

    for (let i = 0; i < 40; i++) {
      let dayOffset = 0;
      if (i < 8) dayOffset = 0; // 8 bill hôm nay
      else if (i < 14) dayOffset = 1; // 6 bill hôm qua
      else dayOffset = Math.floor(Math.random() * 28) + 2; // các ngày còn lại

      const hour = 11 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);

      const paidDate = new Date(nowMs - dayOffset * dayMs);
      paidDate.setHours(hour, minute, 0, 0);

      const openedDate = new Date(paidDate.getTime() - (30 + Math.floor(Math.random() * 60)) * 60 * 1000);
      const table = allTables[i % allTables.length];
      const paymentMethod = i % 3 === 0 ? 'cash' : 'transfer';

      const numItems = 2 + Math.floor(Math.random() * 3);
      const chosenItems: Array<{ item: (typeof allMenuItems)[0]; qty: number }> = [];
      for (let j = 0; j < numItems; j++) {
        const randItem = allMenuItems[(i + j * 3) % allMenuItems.length];
        chosenItems.push({
          item: randItem,
          qty: 1 + Math.floor(Math.random() * 2),
        });
      }

      const sessionTotal = chosenItems.reduce((s, c) => s + c.item.price * c.qty, 0);

      const session = await prisma.tableSession.create({
        data: {
          restaurant_id: restaurant.id,
          table_id: table.id,
          status: 'paid',
          total: sessionTotal,
          payment_method: paymentMethod,
          opened_at: openedDate,
          paid_at: paidDate,
        },
      });

      const order = await prisma.order.create({
        data: {
          restaurant_id: restaurant.id,
          table_id: table.id,
          session_id: session.id,
          status: 'served',
          created_at: openedDate,
        },
      });

      for (const ci of chosenItems) {
        await prisma.orderItem.create({
          data: {
            order_id: order.id,
            menu_item_id: ci.item.id,
            name_snapshot: ci.item.name,
            price_snapshot: ci.item.price,
            quantity: ci.qty,
          },
        });
      }
    }
    console.log('+ Đã tạo thành công 40 hóa đơn đã thanh toán mẫu.');
  }

  // In thông tin tài khoản mẫu và liên kết
  console.log('\n================================================================');
  console.log('🎉 SEED DỮ LIỆU THÀNH CÔNG CHO QUÁN "THE VELVET LOUNGE"');
  console.log('----------------------------------------------------------------');
  console.log('🔑 THÔNG TIN ĐĂNG NHẬP ADMIN:');
  console.log(`   URL:      http://localhost:3000/admin/login`);
  console.log(`   Email:    ${ownerEmail}`);
  console.log(`   Mật khẩu: ${ownerRawPassword}`);
  console.log('----------------------------------------------------------------');
  console.log('🍸 LIÊN KẾT GỌI MÓN MẪU TẠI BÀN 01:');
  console.log(`   URL:      http://localhost:3000/t/${sampleFirstTableToken}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

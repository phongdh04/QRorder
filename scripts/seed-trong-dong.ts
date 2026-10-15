import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU SEED MENU TRỐNG ĐỒNG STATION ===');

  // Tìm quán hiện tại hoặc tạo mới
  let restaurant = await prisma.restaurant.findUnique({
    where: { slug: 'demo-bar' },
  });

  const trongDongTheme = {
    bg: '#08090C',
    surface: '#111318',
    surface_2: '#181B22',
    accent: '#D4AF37',
    accent_gold: '#F3C766',
    champagne: '#E5C378',
    currency: 'VND',
    cover_image_url:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
  };

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'TRỐNG ĐỒNG STATION',
        slug: 'demo-bar',
        logo_url: '/trong-dong-logo.svg',
        theme: trongDongTheme,
      },
    });
    console.log(`+ Đã tạo nhà hàng: ${restaurant.name} (${restaurant.id})`);
  } else {
    restaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: 'TRỐNG ĐỒNG STATION',
        logo_url: '/trong-dong-logo.svg',
        theme: trongDongTheme,
      },
    });
    console.log(`* Đã cập nhật thông tin nhà hàng: ${restaurant.name}`);
  }

  // Đảm bảo có tài khoản quản lý Owner
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
        name: 'Quản Lý Trống Đồng Station',
        role: 'owner',
      },
    });
    console.log(`+ Đã tạo tài khoản Owner: ${ownerEmail}`);
  }

  // 1. Đảm bảo có đủ 10 bàn VIP
  const existingTables = await prisma.table.findMany({
    where: { restaurant_id: restaurant.id },
  });

  if (existingTables.length < 10) {
    for (let i = 1; i <= 10; i++) {
      const tableName = `Bàn VIP ${i < 10 ? '0' + i : i}`;
      const token = `table_${i}_trongdong_${Math.random().toString(36).substring(2, 15)}`;
      const existing = existingTables.find((t) => t.name === tableName || t.name === `Bàn ${i < 10 ? '0' + i : i}`);
      if (!existing) {
        await prisma.table.create({
          data: {
            restaurant_id: restaurant.id,
            name: tableName,
            token,
            is_active: true,
          },
        });
      }
    }
    console.log('+ Đã cập nhật 10 bàn VIP Trống Đồng Station');
  }

  // 2. Xóa các danh mục và món cũ (để nạp lại menu chính xác 100% từ hình ảnh)
  console.log('-> Dọn dẹp menu cũ để cập nhật menu chính thức...');
  await prisma.menuItem.deleteMany({
    where: { restaurant_id: restaurant.id },
  });
  await prisma.category.deleteMany({
    where: { restaurant_id: restaurant.id },
  });

  // 3. Danh sách các danh mục và món ăn chính thức từ 4 ảnh menu
  const menuData = [
    {
      category: 'Gỏi / Salad',
      sort_order: 1,
      items: [
        {
          name: 'Khổ Qua Chà Bông "Sung Sướng"',
          price: 79000,
          description: 'Mướp đắng ướp đá giòn lạnh phủ chà bông hảo hạng, món nhắm thanh mát giải nhiệt',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Nộm Sứa Hải Hậu',
          price: 119000,
          description: 'Sứa đỏ giòn sần sật bóp thấu rau củ tươi, lạc rang thơm bùi và nước mắm chua ngọt',
          image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Salad Thăn Ngoại Xông Khói Sốt Chanh Leo',
          price: 139000,
          description: 'Thăn ngoại bò xông khói gỗ sồi thái lát mỏng, rau xanh tươi mát cùng sốt chanh leo chua ngọt',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Salad Rong Biển Trứng Sốt Mè Rang',
          price: 140000,
          description: 'Rong biển tươi giòn kết hợp trứng non và sốt mè rang béo ngậy chuẩn phong vị Á Đông',
          image_url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Somtum Hải Sản',
          price: 150000,
          description: 'Gỏi đu đủ giòn cay nồng vị Thái Lan hòa quyện cùng tôm mực tươi rói đậm đà',
          image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gỏi Xoài Cá Lăng "Trống Đồng"',
          price: 159000,
          description: 'Cá lăng giòn thơm phối cùng xoài xanh bào sợi vị chua cay đậm đà công thức Trống Đồng',
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gỏi Má Heo Sốt Namchimcheo',
          price: 159000,
          description: 'Má heo nướng giòn sần sật bóp sốt chẩm chéo Tây Bắc cay tê kích thích vị giác',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Nộm Rau Má Bắp Bò',
          price: 169000,
          description: 'Rau má non tươi xanh trộn cùng bắp bò hoa chần tái, nước cốt chanh tỏi ớt thơm lừng',
          image_url: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gỏi Bò Bóp Thấu',
          price: 169000,
          description: 'Thịt bò tái chanh chua thanh, chuối chát, khế chua, vừng rang và hành phi giòn rụm',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gỏi Bò "Trống Đồng"',
          price: 179000,
          description: 'Món gỏi đặc trưng của quán với bắp bò thượng hạng sốt gia truyền trứ danh',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Salad Cá Hồi Áp Chảo Sốt Chanh Leo',
          price: 250000,
          description: 'Cá hồi Nauy tươi áp chảo xém cạnh sốt chanh leo vàng óng thượng hạng, món Signature nổi bật',
          image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Sashimi Tươi Sống',
      sort_order: 2,
      items: [
        {
          name: 'Thuyền Sashimi Tổng Hợp',
          price: 459000,
          description: 'Thuyền sashimi thượng hạng bài trí nghệ thuật: cá hồi Nauy, cá trích ép trứng, bạch tuộc tươi ngon',
          image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sashimi Cá Trích Ép Trứng',
          price: 390000,
          description: 'Cá trích ngâm giấm vàng giòn bùi béo kết hợp trứng cá chuồn giòn nổ lách tách',
          image_url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sashimi Cá Hồi',
          price: 499000,
          description: 'Phi lê cá hồi tươi sống vân mỡ cẩm thạch béo mềm tan trong miệng kèm mù tạt cay nồng',
          image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Khai Đạo & Nhâm Nhi',
      sort_order: 3,
      items: [
        {
          name: 'Cá Trứng Chiên Giòn Sốt Me',
          price: 179000,
          description: 'Cá trứng Nauy chiên vàng giòn rụm ngập sốt me chua ngọt đậm đà, món nhắm khoái khẩu',
          image_url: 'https://images.unsplash.com/photo-1535041692120-cf1719c8f9db?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đậu Tẩm Hành Hà Thành',
          price: 79000,
          description: 'Đậu hũ mơ lướt ván nhúng đẫm mắm hành chuẩn vị phố cổ Hà Nội béo ngậy',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Khoai Lang Kén Mật Ong',
          price: 79000,
          description: 'Khoai lang kén vàng ươm thơm lừng mật ong rừng nguyên chất ngọt ngào',
          image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đậu Hũ Xóc Sả Ớt',
          price: 79000,
          description: 'Đậu hũ ngoài giòn trong mềm xóc sả ớt tươi cay nồng dậy mùi hấp dẫn',
          image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Khoai Tây Chiên Lắc Phomai',
          price: 89000,
          description: 'Khoai tây cắt sợi chiên vàng ruộm lắc đẫm bột phô mai béo thơm ngậy',
          image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Nấm Hải Sản Xóc Muối Tomyum',
          price: 99000,
          description: 'Nấm chiên giòn xóc muối vị chua cay Tomyum Thái Lan bùng nổ hương vị',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đậu Hũ Sốt Tứ Xuyên',
          price: 139000,
          description: 'Đậu non mềm mịn quyện sốt cay tê Tứ Xuyên và thịt băm thơm nồng',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ghẹ Sữa Rim Tỏi Ớt',
          price: 139000,
          description: 'Ghẹ sữa nguyên con giòn tan thấm đều nước mắm tỏi ớt kẹo đậm đà',
          image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thăn Ngoại Xông Khói Sốt Hồng',
          price: 169000,
          description: 'Thăn ngoại bò thượng hạng xông khói gỗ sốt hồng kem mịn sang trọng',
          image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Trâu Xé Tay',
          price: 180000,
          description: 'Thịt trâu gác bếp ngọt mềm từng thớ chấm tương ớt Mường Khương cay nồng',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bắp Bò Xông Mầm Cuộn Cải Xanh',
          price: 199000,
          description: 'Bắp bò hoa thái mỏng cuộn mầm cải xanh chấm sốt mù tạt thơm nồng',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sụn Gà Rang Muối Hồng Kông',
          price: 209000,
          description: 'Sụn gà giòn sần sật phủ muối rang hạt Hong Kong thơm lừng sả chiên',
          image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Khô Mực Xé Tay',
          price: 349000,
          description: 'Mực câu đảo nướng than hoa thơm phức xé sợi tơi xốp ngọt thanh tự nhiên',
          image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Dồi Sụn Sốt Xí Muội',
          price: 149000,
          description: 'Dồi sụn nướng than hoa giòn sần sật sốt xí muội chua ngọt đưa đẩy ly bia',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Hến Xúc Phồng Tôm',
          price: 159000,
          description: 'Hến sông xào sả ớt rau răm đậm đà xúc cùng bánh phồng tôm giòn tan',
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Chả Ốc Tây Hồ',
          price: 160000,
          description: 'Ốc nhồi băm giòn sần sật cuốn lá lốt nướng xém cạnh chuẩn hương vị Hà Nội',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lườn Vây Cá Hồi Xóc Muối HK',
          price: 179000,
          description: 'Vây cá hồi giòn rụm béo ngậy xóc muối rang Hong Kong đậm vị',
          image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lườn Vây Cá Hồi Chiên Nước Mắm',
          price: 179000,
          description: 'Vây cá béo ngậy ngào sốt nước mắm nhĩ tỏi ớt kẹo sệt bóng bẩy',
          image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Khô Cá Lim Kim Cháy Mắm Tỏi',
          price: 179000,
          description: 'Cá lim kim biển chiên giòn rụm cháy mắm tỏi thơm nức mũi',
          image_url: 'https://images.unsplash.com/photo-1535041692120-cf1719c8f9db?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cồi Điệp Xào Bắp Bơ',
          price: 179000,
          description: 'Cồi sò điệp tươi ngọt xào bắp ngọt quyện bơ Pháp thơm nồng béo ngậy',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sò Gạo Xúc Phồng Tôm',
          price: 199000,
          description: 'Sò gạo béo ngọt xào lăn rau răm xúc bánh phồng tôm giòn rụm',
          image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lưỡi Vịt Sapo + Bánh Mỳ',
          price: 219000,
          description: 'Lưỡi vịt om tiêu đen nồi đất sền sệt đậm đà ăn kèm bánh mỳ nướng bơ giòn',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Bay Pháp Xúc Phồng Tôm',
          price: 269000,
          description: 'Chim bồ câu Pháp băm nhỏ xào rau thơm, tiêu rừng xúc bánh phồng tôm',
          image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bò Tơ Tái Chanh',
          price: 289000,
          description: 'Bò tơ tươi mềm tái chanh thái mỏng cuốn bánh tráng rau rừng tươi mát',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Set Tổng Hợp',
      sort_order: 4,
      items: [
        {
          name: 'Set Nướng Mỹ Vị Trống Đồng',
          price: 639000,
          description: 'Đại tiệc nướng trọn vẹn: tôm càng, bò tơ, dải heo và sườn cọng sốt đặc chế Trống Đồng',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Set Thịt Nguội Tổng Hợp',
          price: 399000,
          description: 'Khay Cold Cuts cao cấp kiểu Âu: giăm bông, salami, xúc xích nướng, phô mai và ô liu',
          image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Bò & Trâu Thượng Hạng',
      sort_order: 5,
      items: [
        {
          name: 'Thăn Ngoại Bò Mỹ Sốt Đặc Biệt',
          price: 269000,
          description: 'Thăn ngoại bò Mỹ đút lò sốt bí truyền đỉnh cao phục vụ trên thớt gỗ nướng rau củ',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bò Lúc Lắc Khoai Tây Chiên',
          price: 299000,
          description: 'Bò phi lê thái quân cờ xào tiêu ớt chuông mọng nước trên chảo gang kèm khoai tây chiên',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Trâu Cháy Tỏi',
          price: 249000,
          description: 'Thịt trâu tươi xào cháy cạnh tỏi cô đơn thơm lừng, thịt ngọt mềm đậm vị',
          image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Trâu Cháy Tiêu Xanh',
          price: 259000,
          description: 'Thịt trâu mềm ngọt cay nồng hạt tiêu xanh Phú Quốc thơm lựng chảo gang',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bò Tơ Cháy Tỏi',
          price: 259000,
          description: 'Bò tơ non mềm xèo xèo cùng tỏi ta giòn rụm bốc khói nghi ngút',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bò Cháy Tỏi Phán Gang',
          price: 269000,
          description: 'Bò thượng hạng đảo đều trên bản gang giữ trọn vẹn độ mọng nước tự nhiên',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bò Tơ Chao Lá Mắc Mật',
          price: 269000,
          description: 'Bò tơ chao dầu giòn bì hòa quyện hương lá mắc mật Lạng Sơn ngây ngất',
          image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thăn Bò Mỹ Áp Chảo Sốt Teriyaki',
          price: 279000,
          description: 'Thăn bò Mỹ mềm tan sốt ngọt mặn Teriyaki Nhật Bản mè rang thơm phức',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Gà Đồi & Chim Bay',
      sort_order: 6,
      items: [
        {
          name: 'Cánh Gà Chiên Nước Mắm',
          price: 159000,
          description: 'Cánh gà giòn tan ngập sốt nước mắm tỏi ớt kẹo vàng óng thơm nức mũi',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Quay Lu',
          price: 289000,
          description: 'Gà đồi nguyên con quay lu đất da giòn bóng bẩy, thịt mềm ngọt mọng nước',
          image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Bay Pháp Quay',
          price: 219000,
          description: 'Chim câu Pháp quay da giòn rụm bóng bẩy, thịt mềm ngọt thơm thảo mộc',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Chân Gà Sốt Cay Hàn Quốc',
          price: 150000,
          description: 'Chân gà rút xương thấm đẫm sốt cay đỏ Hàn Quốc rắc mè rang thơm lừng',
          image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cánh Gà Sốt Cay Hàn Quốc',
          price: 159000,
          description: 'Cánh gà chiên giòn phủ sốt gochujang cay ngọt đậm vị kích thích vị giác',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Ri Rang Muối',
          price: 279000,
          description: 'Gà ri đồi thả vườn thịt săn chắc rang muối sả giòn rụm thơm lừng',
          image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Chiên Mắm',
          price: 279000,
          description: 'Gà ta chặt miếng chiên vàng ngào sốt mắm nhĩ thơm phức đậm đà',
          image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cánh Gà Nướng Muối Xanh',
          price: 150000,
          description: 'Cánh gà ướp sốt muối ớt xanh Nha Trang nướng the cay độc đáo',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cánh Gà Nướng Muối Ớt',
          price: 150000,
          description: 'Cánh gà nướng than hoa vàng ươm muối ớt cay nồng đậm vị',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Xào Cay Tứ Xuyên',
          price: 189000,
          description: 'Thịt gà xào hoa tiêu và ớt khô cay nồng tê tái đầu lưỡi',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Gà Bay Pháp Xào Cả',
          price: 259000,
          description: 'Chim câu Pháp xào hành răm và thảo mộc thơm ngào ngạt',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Heo & Đảo Sườn Cay',
      sort_order: 7,
      items: [
        {
          name: 'Đảo Sườn Cay Kiểu Thái',
          price: 349000,
          description: 'Tháp sườn cay khổng lồ ninh mềm rưới đẫm nước sốt ớt hiểm chanh sả cay bùng nổ',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lão Trư Tắm Nắng Vườn Chanh',
          price: 169000,
          description: 'Thịt heo cuốn rau rừng tắm sốt chanh tươi thanh mát bùi béo',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thịt Dải Cháy Mắm Tỏi',
          price: 179000,
          description: 'Dải heo giòn sần sật cháy tỏi mắm dậy vị thơm lừng bàn nhậu',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sườn Heo Chiên Tam Vị',
          price: 229000,
          description: 'Sườn non chiên giòn quyện ba tầng hương vị chua cay mặn ngọt hài hòa',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đuôi Lão Trư Rang Muối',
          price: 229000,
          description: 'Đuôi heo chiên giòn bì phủ muối rang thơm bùi sần sật nhai vui miệng',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đuôi Lão Trư Chiên Nước Mắm',
          price: 229000,
          description: 'Đuôi heo giòn sần sật rim sốt nước mắm tỏi ớt kẹo sệt đậm đà',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lão Trư Xào Cải Chua',
          price: 249000,
          description: 'Thịt heo xào dưa cải muối chua giòn đưa bia cực đỉnh',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lão Trư Xào Cay Tứ Xuyên',
          price: 249000,
          description: 'Thịt heo thái mỏng xào cay sốt hoa tiêu Tứ Xuyên nồng ấm',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lão Trư Xào Nấm',
          price: 249000,
          description: 'Thịt heo xào nấm tươi thanh ngọt bổ dưỡng thơm lừng dầu hào',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Giò Heo Muối Nổ Bì Da',
          price: 329000,
          description: 'Chân giò ủ muối chiên phồng nổ bì giòn tan chuẩn phong cách bia Đức',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Đặc Sản Ếch Đồng',
      sort_order: 8,
      items: [
        {
          name: 'Ếch Giòn Rang Muối',
          price: 179000,
          description: 'Thịt ếch chiên xù phủ muối rang hạt thơm phức kèm lá lốt chiên giòn rụm',
          image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ếch Chiên Mắm',
          price: 179000,
          description: 'Đùi ếch béo ngậy chiên nước mắm tỏi ớt kẹo sệt thơm nức mũi',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ếch Xào Măng Cay',
          price: 199000,
          description: 'Ếch đồng xào măng chua ớt hiểm cay nồng đậm đà khó cưỡng',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ếch Xào Cà Xanh',
          price: 199000,
          description: 'Ếch om cà pháo xanh và tía tô đậm vị dân dã miền quê',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ếch Sapo + Bánh Mỳ',
          price: 219000,
          description: 'Ếch om niêu đất sốt tương đậm đặc sền sệt chấm bánh mỳ nướng giòn',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Hải Sản Cao Cấp',
      sort_order: 9,
      items: [
        {
          name: 'Ốc Hương Hoàng Kim + Bánh Mỳ',
          price: 369000,
          description: 'Ốc hương tươi giòn sốt trứng muối hoàng kim béo bùi chấm bánh mỳ nướng bơ giòn',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mực Trứng Chiên Mắm',
          price: 399000,
          description: 'Mực trứng béo ngậy chiên giòn sốt mắm tỏi ớt kẹo vàng óng óng ả',
          image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Tôm Nướng Mọi',
          price: 239000,
          description: 'Tôm sú tươi sống nướng than hồng giữ trọn vị ngọt tự nhiên của biển',
          image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Tôm Nướng Muối Ớt',
          price: 239000,
          description: 'Tôm sú nướng than hoa phết muối ớt Tây Ninh cay nồng đậm vị',
          image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bạch Tuộc Xào Cay Tứ Xuyên',
          price: 279000,
          description: 'Bạch tuộc giòn sần sật xào sốt sa tế Tứ Xuyên nồng cay kích thích',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cá Hồi Áp Chảo Sốt Teriyaki',
          price: 279000,
          description: 'Phi lê cá hồi Nauy áp chảo sốt ngọt mặn Nhật Bản béo ngậy',
          image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cá Hồi Áp Chảo Sốt Chanh Leo',
          price: 279000,
          description: 'Cá hồi áp chảo sốt chanh leo chua thanh tươi mát ăn kèm rau củ',
          image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cá Lóc Rang Muối Hồng Kông',
          price: 279000,
          description: 'Cá lóc đồng phi lê giòn rụm phủ lớp muối Hong Kong thơm ngậy',
          image_url: 'https://images.unsplash.com/photo-1535041692120-cf1719c8f9db?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cá Diêu Hồng Sốt Ớt Thái',
          price: 289000,
          description: 'Cá diêu hồng chiên xù rưới sốt ba vị chua cay ngọt kiểu Thái Lan',
          image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ốc Hương Hấp Chanh Sả',
          price: 339000,
          description: 'Ốc hương tươi giòn ngọt hấp sả cây và lá chanh nồng nàn thơm phức',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mực Ống Sốt Chanh Kiểu Thái',
          price: 389000,
          description: 'Mực ống hấp sốt chanh ớt ngò rí cay tê bùng nổ vị giác',
          image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mực Trứng Chiên Lá Lốt',
          price: 399000,
          description: 'Mực trứng căng tròn chiên thơm lừng lá lốt giòn rụm',
          image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cá Bò Da Nướng Muối Ớt Size Trung',
          price: 579000,
          description: 'Cá bò da biển tươi nướng than hồng muối ớt thơm phức cuốn bánh tráng',
          image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Nướng Thả Ga & Xiên Que',
      sort_order: 10,
      items: [
        {
          name: 'Hàu Bỏ Lò Phomai',
          price: 38000,
          description: 'Hàu sữa tươi đút lò phô mai Mozzarella kéo sợi thơm lừng béo ngậy',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Hàu Nướng Mỡ Hành',
          price: 26000,
          description: 'Hàu sữa tươi nướng than hoa mỡ hành lạc rang bùi béo ngọt nước',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Heo Nướng Xiên Mỹ Vị',
          price: 149000,
          description: 'Xiên thịt heo ướp gia vị Trống Đồng nướng than hoa thơm lừng xém cạnh',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thịt Dải Nướng Mật Ong',
          price: 179000,
          description: 'Dải heo nướng mật ong rừng vàng óng thơm ngọt mọng nước',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sườn Cây Nướng Mật Ong',
          price: 179000,
          description: 'Sườn cọng nướng than hoa phết sốt mật ong thơm lừng mút ngón tay',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Xiên Gà Nướng Pattaya',
          price: 179000,
          description: 'Gà xiên que nướng sốt ớt Pattaya the cay phong cách đường phố Thái',
          image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Xiên Heo Nướng Riềng Mẻ',
          price: 179000,
          description: 'Thịt heo nướng riềng mẻ chua thanh thơm nức mũi chuẩn vị Bắc',
          image_url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thịt Dải Nướng Ngũ Vị',
          price: 189000,
          description: 'Dải heo ướp ngũ vị hương đậm đà nướng than hồng thơm ngát',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Thịt Dải Nướng Tê Cay',
          price: 189000,
          description: 'Dải heo ướp sốt ớt tê cay Tứ Xuyên kích thích đầu lưỡi',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Xiên Bò Nướng Rau Củ',
          price: 219000,
          description: 'Thịt bò xiên ớt chuông, hành tây nướng mọng nước mềm tan',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ốc Hương Nướng Mọi',
          price: 359000,
          description: 'Ốc hương nướng mọi thơm giòn chấm muối tiêu chanh chuẩn biển',
          image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mực Nướng Muối Ớt',
          price: 399000,
          description: 'Mực nướng than muối ớt cay giòn sần sật mồi nhậu số một',
          image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Vườn Rau Sau Hè',
      sort_order: 11,
      items: [
        {
          name: 'Củ Quả Chấm Kho Quẹt',
          price: 99000,
          description: 'Củ quả luộc ngũ sắc tươi giòn chấm niêu kho quẹt tôm thịt tóp mỡ đậm đà',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bí Nụ Cháy Tỏi',
          price: 139000,
          description: 'Bí bao tử non ngọt giòn xào cháy tỏi cô đơn thơm lừng xanh mướt',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đậu Hũ Hải Sản Khói Lửa',
          price: 199000,
          description: 'Đậu hũ non cùng tôm mực bọc giấy bạc xèo xèo khói lửa thơm lừng sốt hải vị',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Dưa Chuột Chẻ',
          price: 36000,
          description: 'Dưa chuột tươi mát ướp lạnh giòn tan chấm muối ớt Tây Ninh',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Rau Muống Đỏ Lửa',
          price: 69000,
          description: 'Rau muống xào tỏi trên ngọn lửa lớn xanh mướt giòn sần sật',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cải Ngồng Xào Tỏi',
          price: 89000,
          description: 'Cải ngồng non ngọt thanh xào tỏi ta dậy mùi thơm hấp dẫn',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đậu Que Xào Ruốc Tôm',
          price: 89000,
          description: 'Đậu que xanh giòn xào cùng ruốc tôm thơm bùi đậm vị',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ngồng Tỏi Xào Bắp Bò',
          price: 199000,
          description: 'Ngồng tỏi giòn ngọt xào bắp bò hoa mọng nước ngọt thanh',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Măng Trúc Xào Bắp Bò',
          price: 199000,
          description: 'Măng trúc Yên Tử giòn sần sật xào bắp bò tươi thơm phức',
          image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Đổ Bê Tông (Cơm & Mỳ)',
      sort_order: 12,
      items: [
        {
          name: 'Cơm Chiên Hải Sản',
          price: 129000,
          description: 'Cơm chiên hạt ngọc vàng ươm cùng tôm, mực, rau củ và trứng muối bùi béo',
          image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cơm Chiên Dưa Bò',
          price: 119000,
          description: 'Cơm hạt tơi giòn xào bắp bò ngọt thịt cùng dưa cải muối chua rắc hành phi',
          image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Pad Thái / Hủ Tiếu Xào Hải Sản',
          price: 129000,
          description: 'Sợi bánh dai dai xào hải sản sốt me chua cay, đậu phộng rang giòn',
          image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mỳ Xào Bò',
          price: 129000,
          description: 'Mỳ trứng sợi dai xào bò tươi, cải ngọt thơm lừng nước sốt',
          image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Mỳ Xào Hải Sản',
          price: 149000,
          description: 'Mỳ xào mực giòn, tôm sú và rau củ tươi xốt dầu hào thơm ngậy',
          image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Giải Rượu & Canh Cháo',
      sort_order: 13,
      items: [
        {
          name: 'Cháo Hàu',
          price: 149000,
          description: 'Cháo hàu sữa ninh nhừ ngọt thơm, tiêu đen hành tía tô bồi bổ giải rượu',
          image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Canh Ngao Chua',
          price: 89000,
          description: 'Ngao hoa nấu chua dứa, cà chua và thì là thanh mát giải rượu ấm lòng',
          image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Canh Chua Thịt Băm',
          price: 99000,
          description: 'Canh sấu / me thịt băm chua thanh dịu nhẹ, giải nhiệt đưa cơm',
          image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Cháo Bò Băm',
          price: 149000,
          description: 'Cháo hoa ninh nhừ bò băm thơm mùi hành hoa và tiêu hạt nóng hổi',
          image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Đồ Uống (Bia Hơi & Giải Khát)',
      sort_order: 14,
      items: [
        {
          name: 'Bia Hơi Hà Nội (Tháp)',
          price: 150000,
          description: 'Tháp bia hơi Hà Nội mát lạnh sảng khoái với lớp bọt dày mịn cho cả bàn',
          image_url: 'https://images.unsplash.com/photo-1608270191763-8a9d1858564e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bia Hơi Hà Nội (Cốc)',
          price: 15000,
          description: 'Cốc bia hơi Hà Nội truyền thống mát lạnh vàng óng tươi mới',
          image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bia Tươi Sao Vàng (Tháp)',
          price: 150000,
          description: 'Tháp bia tươi Sao Vàng đậm đà hương hoa bia lúa mạch thượng hạng',
          image_url: 'https://images.unsplash.com/photo-1608270191763-8a9d1858564e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Bia Sao Vàng Gold',
          price: 20000,
          description: 'Bia lon Sao Vàng Gold ướp lạnh tinh tế, vị êm dịu',
          image_url: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Sao Vàng Ultra Light',
          price: 28000,
          description: 'Dòng bia nhẹ thanh lọc sảng khoái uống êm không đau đầu',
          image_url: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Heineken Bạc Lùn',
          price: 28000,
          description: 'Heineken Silver lon lùn sảng khoái mát lạnh thượng lưu',
          image_url: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Tiger Bạc Lùn',
          price: 25000,
          description: 'Tiger Crystal lon lùn sảng khoái tinh thể băng mát rượi',
          image_url: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Nước Suối Tinh Khiết',
          price: 14000,
          description: 'Nước suối đóng chai mát lạnh tinh khiết',
          image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Pepsi Lon',
          price: 21000,
          description: 'Nước ngọt có gas Pepsi ướp lạnh mát rượi',
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Twister Cam Lon',
          price: 21000,
          description: 'Nước cam ép Twister tép cam tươi thơm ngọt giàu vitamin C',
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: '7UP Lon',
          price: 21000,
          description: 'Nước ngọt 7UP chanh thanh mát sảng khoái',
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Nước Tăng Lực Redbull',
          price: 24000,
          description: 'Bò húc Redbull Thái Lan nạp năng lượng tức thì',
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
    {
      category: 'Món Gọi Thêm',
      sort_order: 15,
      items: [
        {
          name: 'Phồng Tôm Giòn Tan',
          price: 36000,
          description: 'Bánh phồng tôm chiên phồng xốp giòn tan ăn kèm các món gỏi',
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Lạc Sấy',
          price: 20000,
          description: 'Đĩa lạc sấy giòn bùi ngậy khai vị cùng cốc bia mát',
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Ruốc Bông',
          price: 46000,
          description: 'Ruốc thịt heo thơm mềm bùi béo ăn kèm',
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Đĩa Rau Sashimi Tổng Hợp',
          price: 49000,
          description: 'Rau tía tô xanh, củ cải trắng bào sợi và gừng hồng muối Nhật Bản',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Khăn Lạnh Cao Cấp',
          price: 8000,
          description: 'Khăn ướt tiệt trùng ướp hương thơm dịu mát cao cấp',
          image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        },
      ],
    },
  ];

  let totalItemsCount = 0;

  for (const catData of menuData) {
    const category = await prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: catData.category,
        sort_order: catData.sort_order,
        is_active: true,
      },
    });

    for (let i = 0; i < catData.items.length; i++) {
      const item = catData.items[i];
      await prisma.menuItem.create({
        data: {
          restaurant_id: restaurant.id,
          category_id: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          sort_order: i + 1,
          is_available: true,
        },
      });
      totalItemsCount++;
    }
    console.log(`+ Đã tạo nhóm "${catData.category}" (${catData.items.length} món)`);
  }

  console.log(`=== HOÀN TẤT SEED TRỐNG ĐỒNG STATION: ${menuData.length} DANH MỤC, ${totalItemsCount} MÓN ĂN ===`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu Trống Đồng:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

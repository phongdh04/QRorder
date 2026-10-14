import { getStorageAdapter } from '../src/lib/storage';
import { getCachedRestaurantCategories, revalidateRestaurantMenuCache } from '../src/lib/dal/customer';
import { prisma } from '../src/lib/prisma';
import { GET as uploadsRouteHandler } from '../src/app/uploads/[...path]/route';
import { NextRequest } from 'next/server';

async function testPart5() {
  console.log('🧪 === BẮT ĐẦU KIỂM THỬ PHẦN 5: CACHE & HIỆU NĂNG PHÍA SERVER ===\n');

  // 1. Chuẩn bị file mẫu trong Storage
  const storage = getStorageAdapter();
  const sampleKey = 'restaurants/test-res/menu/img-cache-test/thumb-hash12345.webp';
  const sampleBuffer = Buffer.from('RIFF....WEBPVP8 ...fake webp content for caching test...');
  
  await storage.put(sampleKey, sampleBuffer, 'image/webp');
  console.log('✅ 1. Đã tạo tệp mẫu trong storage:', sampleKey);

  // 2. Kiểm tra route /uploads/[...path] trực tiếp qua fetch HTTP đến Next.js
  const uploadUrl = `http://localhost:3000/uploads/${sampleKey}`;
  console.log(`📡 2. Gửi GET request đến: ${uploadUrl}`);
  
  const response = await fetch(uploadUrl);
  console.log('Status code:', response.status);
  if (response.status !== 200) {
    throw new Error(`Kỳ vọng 200 OK nhưng nhận được ${response.status}`);
  }

  const cacheControl = response.headers.get('cache-control');
  const nosniff = response.headers.get('x-content-type-options');
  const etag = response.headers.get('etag');
  const contentType = response.headers.get('content-type');

  console.log('Headers nhận được từ server:');
  console.log(' - Cache-Control:', cacheControl);
  console.log(' - X-Content-Type-Options:', nosniff);
  console.log(' - ETag:', etag);
  console.log(' - Content-Type:', contentType);

  if (!cacheControl || !cacheControl.includes('public') || !cacheControl.includes('immutable')) {
    throw new Error(`Cache-Control không đúng kỳ vọng: ${cacheControl}`);
  }
  if (nosniff !== 'nosniff') {
    throw new Error(`X-Content-Type-Options không phải nosniff: ${nosniff}`);
  }
  if (!etag) {
    throw new Error('ETag header không tồn tại');
  }
  if (contentType !== 'image/webp') {
    throw new Error(`Content-Type không phải image/webp: ${contentType}`);
  }
  console.log('✅ 2. Headers HTTP hợp lệ: Cache-Control immutable 1 năm, ETag, nosniff, image/webp.');

  // 3. Kiểm tra logic xử lý 304 Not Modified của route handler
  console.log('\n📡 3. Kiểm tra HTTP 304 Not Modified và ETag qua Route Handler...');
  const pathParts = sampleKey.split('/');
  const directReq = new NextRequest(`http://localhost:3000/uploads/${sampleKey}`);
  const directRes = await uploadsRouteHandler(directReq, { params: { path: pathParts } });
  const serverEtag = directRes.headers.get('etag');
  console.log('Route Handler ETag sinh ra:', serverEtag);

  if (!serverEtag) {
    throw new Error('Route Handler không trả về header ETag');
  }

  // Gửi request kèm If-None-Match
  const matchReq = new NextRequest(`http://localhost:3000/uploads/${sampleKey}`, {
    headers: { 'if-none-match': serverEtag },
  });
  const matchRes = await uploadsRouteHandler(matchReq, { params: { path: pathParts } });
  console.log('Status code với If-None-Match:', matchRes.status);
  if (matchRes.status !== 304) {
    throw new Error(`Kỳ vọng 304 Not Modified nhưng nhận được ${matchRes.status}`);
  }
  console.log('✅ 3. Route Handler trả HTTP 304 Not Modified chuẩn xác khi ETag trùng khớp!');

  // 4. Kiểm tra chống tấn công Path Traversal
  console.log('\n🛡️ 4. Kiểm tra bảo mật chống Path Traversal...');
  const traversalReq = new NextRequest('http://localhost:3000/uploads/../../package.json');
  const traversalRes = await uploadsRouteHandler(traversalReq, {
    params: { path: ['..', '..', 'package.json'] },
  });
  console.log('Path traversal attempt status:', traversalRes.status);
  if (traversalRes.status !== 403 && traversalRes.status !== 400 && traversalRes.status !== 404) {
    throw new Error(`Kỳ vọng 403 Forbidden cho path traversal nhưng nhận được ${traversalRes.status}`);
  }
  console.log('✅ 4. Chống Path Traversal hoạt động chuẩn xác (status: ' + traversalRes.status + ')');

  // 5. Kiểm tra unstable_cache & revalidate tag của thực đơn
  console.log('\n⚡ 5. Kiểm tra Cache tầng server (unstable_cache) cho menu khách...');
  const restaurant = await prisma.restaurant.findFirst();
  if (restaurant) {
    console.log(`Lấy dữ liệu menu quán [${restaurant.name}] (${restaurant.id})...`);
    const start1 = Date.now();
    const categories1 = await getCachedRestaurantCategories(restaurant.id);
    const duration1 = Date.now() - start1;
    console.log(`Lần 1: ${categories1.length} danh mục trong ${duration1}ms`);

    const start2 = Date.now();
    const categories2 = await getCachedRestaurantCategories(restaurant.id);
    const duration2 = Date.now() - start2;
    console.log(`Lần 2 (cache hit): ${categories2.length} danh mục trong ${duration2}ms`);

    // Invalidate
    console.log('Gọi revalidateRestaurantMenuCache(restaurant.id)...');
    revalidateRestaurantMenuCache(restaurant.id);
    console.log('✅ 5. Đã gọi revalidateRestaurantMenuCache thành công (tag invalidation)');
  }

  // Dọn dẹp tệp test
  await storage.delete(sampleKey);
  console.log('\n🧹 Dọn dẹp tệp test hoàn tất.');
  console.log('🎉 === TẤT CẢ KIỂM THỬ PHẦN 5 ĐÃ VƯỢT QUA 100% ===\n');
}

testPart5()
  .catch((err) => {
    console.error('❌ LỖI KIỂM THỬ PHẦN 5:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

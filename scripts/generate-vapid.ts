import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n============================================================');
console.log('🔑 CẶP KHÓA VAPID (WEB PUSH) CHO HỆ THỐNG THÔNG BÁO:');
console.log('============================================================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:admin@demobar.vn');
console.log('============================================================');
console.log('💡 Lưu ý: Sao chép các biến trên vào file .env');
console.log('   Web Push yêu cầu kết nối an toàn HTTPS (ngoại trừ localhost).\n');

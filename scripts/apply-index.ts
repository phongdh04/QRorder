import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- ĐANG THIẾT LẬP RÀNG BUỘC UNIQUE PARTIAL INDEX (1 SESSION OPEN / BÀN) ---');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_single_open_idx 
      ON table_sessions (table_id) 
      WHERE status = 'open';
    `);
    console.log('✓ Ràng buộc table_sessions_single_open_idx đã được áp dụng thành công.');
  } catch (error) {
    console.error('Lỗi khi tạo unique partial index:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

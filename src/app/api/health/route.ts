import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Kiểm tra kết nối database
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Healthcheck failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}

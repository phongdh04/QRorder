import { NextRequest } from 'next/server';
import { POST as handleOrderPost } from '@/app/api/orders/route';

export async function POST(request: NextRequest) {
  return handleOrderPost(request);
}

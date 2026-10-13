import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawPath = params.path ? params.path.join('/') : '';
    if (!rawPath) {
      return new NextResponse('File path not provided', { status: 400 });
    }

    // Xác định thư mục uploads cấu hình qua biến môi trường
    const uploadDir = path.resolve(
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
    );

    const targetFilePath = path.resolve(uploadDir, rawPath);

    // Bảo vệ an toàn chống tấn công Path Traversal
    if (!targetFilePath.startsWith(uploadDir)) {
      return new NextResponse('Access forbidden', { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(targetFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Lỗi khi phục vụ tệp upload:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

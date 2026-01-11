import { NextRequest, NextResponse } from 'next/server';
import { ImageOptimizer } from '@/lib/image-optimizer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

async function uploadToImgBB(file: File): Promise<{ url: string; thumbnailUrl?: string }> {
  const apiKey = process.env.IMGBB_API_KEY;
  
  if (!apiKey) {
    throw new Error('ImgBB API Key 未配置');
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const formData = new FormData();
  formData.append('image', base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `ImgBB API 错误: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || '上传到 ImgBB 失败');
  }

  return {
    url: data.data.url,
    thumbnailUrl: data.data.thumb?.url
  };
}

async function uploadToLocal(file: File, fileName: string): Promise<{ url: string; filePath: string }> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
  await fs.mkdir(uploadDir, { recursive: true });

  const fullPath = path.join(uploadDir, fileName);
  const buffer = await file.arrayBuffer();
  await fs.writeFile(fullPath, Buffer.from(buffer));

  const filePath = `/uploads/images/${fileName}`;
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}${filePath}`;

  return { url, filePath };
}

export async function POST(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request);

    if (!checkRateLimit(clientIdentifier)) {
      return NextResponse.json(
        { error: '上传频率过高，请稍后再试' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const key = formData.get('key') as string | null;
    const useImgBB = formData.get('useImgBB') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小超过限制（最大10MB）' },
        { status: 400 }
      );
    }

    const optimizer = new ImageOptimizer();
    const isValid = await optimizer.isValidImage(file);

    if (!isValid) {
      return NextResponse.json(
        { error: '无效的图片文件' },
        { status: 400 }
      );
    }

    const optimized = await optimizer.optimize(file);
    const optimizedFile = optimized.optimized;

    let url: string;
    let thumbnailUrl: string | undefined;
    let filePath: string | undefined;
    let fileName: string;
    let provider: string;

    if (useImgBB) {
      try {
        const imgbbResult = await uploadToImgBB(optimizedFile);
        url = imgbbResult.url;
        thumbnailUrl = imgbbResult.thumbnailUrl;
        provider = 'imgbb';
        fileName = key || optimizedFile.name;
      } catch (error) {
        console.error('ImgBB 上传失败，切换到本地存储:', error);
        const timestamp = Date.now();
        fileName = `${timestamp}_${optimizedFile.name}`;
        const localResult = await uploadToLocal(optimizedFile, fileName);
        url = localResult.url;
        filePath = localResult.filePath;
        provider = 'local';
      }
    } else {
      const timestamp = Date.now();
      fileName = `${timestamp}_${optimizedFile.name}`;
      const localResult = await uploadToLocal(optimizedFile, fileName);
      url = localResult.url;
      filePath = localResult.filePath;
      provider = 'local';
    }

    return NextResponse.json({
      success: true,
      url,
      filePath,
      fileName,
      size: optimizedFile.size,
      originalSize: optimized.originalSize,
      compressionRatio: optimized.compressionRatio,
      format: optimized.format,
      thumbnailUrl,
      provider
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const fs = await import('fs/promises');
      const path = await import('path');

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
      
      try {
        const files = await fs.readdir(uploadDir);
        let totalSize = 0;

        for (const file of files) {
          const filePath = path.join(uploadDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }

        return NextResponse.json({
          success: true,
          stats: {
            totalFiles: files.length,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            provider: 'imgbb'
          }
        });
      } catch {
        return NextResponse.json({
          success: true,
          stats: {
            totalFiles: 0,
            totalSize: 0,
            totalSizeMB: '0.00',
            provider: 'imgbb'
          }
        });
      }
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );

  } catch (error) {
    console.error('获取图片统计失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取统计失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * Text Engine v3.20 - API Routes
 * 支持服务端功能：故事管理、云端存档等
 */

export const dynamic = 'force-static';

// 获取所有可用的故事
export async function GET(request: NextRequest) {
  try {
    const stories = {
      demo: {
        id: 'demo',
        title: '神秘森林探险',
        version: '1.0',
        description: '一个展示 Text Engine v3.20 功能的示例冒险故事'
      }
    };

    return NextResponse.json({
      success: true,
      stories
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stories'
      },
      { status: 500 }
    );
  }
}

// 保存游戏存档到服务器（未来扩展）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saveName, saveData } = body;

    // TODO: 实现服务端存档保存
    // 可以使用数据库（PostgreSQL、MongoDB 等）存储存档

    return NextResponse.json({
      success: true,
      message: 'Save uploaded successfully'
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload save'
      },
      { status: 500 }
    );
  }
}

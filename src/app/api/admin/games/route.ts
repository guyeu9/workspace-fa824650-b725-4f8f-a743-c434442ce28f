import { NextRequest, NextResponse } from 'next/server'
import { adminMiddleware } from '@/lib/admin-middleware'
import { db } from '@/lib/db'

// 获取所有社区游戏（带筛选和搜索）
export async function GET(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const authorId = searchParams.get('authorId') || ''

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    }
    
    if (authorId) {
      where.authorId = authorId
    }

    // 获取游戏列表
    const games = await db.game.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // 获取总数
    const total = await db.game.count({ where })

    return NextResponse.json({
      games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取社区游戏列表失败:', error)
    return NextResponse.json(
      { error: '获取社区游戏列表失败' },
      { status: 500 }
    )
  }
}

// 删除游戏
export async function DELETE(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('id')

    if (!gameId) {
      return NextResponse.json(
        { error: '请提供游戏ID' },
        { status: 400 }
      )
    }

    // 删除游戏（级联删除相关投票和评论）
    await db.game.delete({
      where: { id: gameId }
    })

    return NextResponse.json({
      message: '游戏删除成功'
    })
  } catch (error) {
    console.error('删除游戏失败:', error)
    return NextResponse.json(
      { error: '删除游戏失败' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { adminMiddleware } from '@/lib/admin-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// 获取所有评论（带筛选和搜索）
export async function GET(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const userId = searchParams.get('userId') || ''
    const gameId = searchParams.get('gameId') || ''

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = { isDeleted: false }
    
    if (search) {
      where.content = { contains: search, mode: 'insensitive' as const }
    }
    
    if (userId) {
      where.userId = userId
    }
    
    if (gameId) {
      where.gameId = gameId
    }

    // 获取评论列表
    const comments = await db.comment.findMany({
      where,
      select: {
        id: true,
        content: true,
        createdAt: true,
        isDeleted: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        game: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // 获取总数
    const total = await db.comment.count({ where })

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取评论列表失败:', error)
    return NextResponse.json(
      { error: '获取评论列表失败' },
      { status: 500 }
    )
  }
}

// 批量删除评论（软删除）
export async function DELETE(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { commentIds } = body

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json(
        { error: '请提供评论ID列表' },
        { status: 400 }
      )
    }

    // 软删除评论
    const result = await db.comment.updateMany({
      where: { id: { in: commentIds } },
      data: { isDeleted: true }
    })

    return NextResponse.json({
      message: '评论删除成功',
      count: result.count
    })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json(
      { error: '删除评论失败' },
      { status: 500 }
    )
  }
}
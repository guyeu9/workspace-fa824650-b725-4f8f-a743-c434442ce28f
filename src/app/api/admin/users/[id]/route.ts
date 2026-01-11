import { NextRequest, NextResponse } from 'next/server'
import { adminMiddleware } from '@/lib/admin-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const userId = params.id

    // 获取用户基本信息
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取用户统计数据
    const [games, comments, votes, loginRecords, onlineStats] = await Promise.all([
      db.game.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.comment.findMany({
        where: { userId: userId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          game: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      db.vote.findMany({
        where: { userId: userId },
        select: {
          id: true,
          type: true,
          createdAt: true,
          game: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      db.loginRecord.findMany({
        where: { userId: userId },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      db.onlineStats.findUnique({
        where: { userId: userId }
      })
    ])

    return NextResponse.json({
      user,
      stats: {
        gamesCount: games.length,
        commentsCount: comments.length,
        votesCount: votes.length,
        loginCount: loginRecords.length,
      },
      games,
      comments,
      votes,
      loginRecords,
      onlineStats,
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json(
      { error: '获取用户详情失败' },
      { status: 500 }
    )
  }
}

// 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const userId = params.id
    const body = await request.json()
    const { name, role, isActive } = body

    // 验证输入
    if (!name && role === undefined && isActive === undefined) {
      return NextResponse.json(
        { error: '请提供要更新的字段' },
        { status: 400 }
      )
    }

    // 构建更新数据
    const updateData: any = {}
    if (name) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    // 更新用户
    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      message: '用户信息更新成功',
      user
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    )
  }
}
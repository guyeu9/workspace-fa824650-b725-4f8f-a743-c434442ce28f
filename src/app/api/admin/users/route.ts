import { NextRequest, NextResponse } from 'next/server'
import { adminMiddleware } from '@/lib/admin-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'

    const skip = (page - 1) * limit

    // 构建查询条件
    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(role !== 'all' && { role })
    }

    // 获取用户列表
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            games: true,
            comments: true,
            votes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // 获取总数
    const total = await db.user.count({ where })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// 批量更新用户状态
export async function PUT(request: NextRequest) {
  // 验证管理员权限
  const authError = await adminMiddleware(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { userIds, action, value } = body

    if (!Array.isArray(userIds) || !action) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'activate':
        result = await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        })
        break
      case 'deactivate':
        result = await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false }
        })
        break
      case 'role':
        result = await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: value }
        })
        break
      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: '操作成功',
      count: result.count
    })
  } catch (error) {
    console.error('批量更新用户失败:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
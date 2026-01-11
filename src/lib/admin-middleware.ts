import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'

export async function isAdmin(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return false
  }

  // 这里需要从数据库获取用户角色信息
  // 为了简化，我们暂时假设session中包含role信息
  return session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
}

export async function adminMiddleware(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: '未登录' },
      { status: 401 }
    )
  }

  // 检查是否为管理员
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: '权限不足' },
      { status: 403 }
    )
  }

  return null
}
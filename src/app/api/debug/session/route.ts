import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    console.log('Session:', JSON.stringify(session, null, 2))
    
    if (!session) {
      return NextResponse.json(
        { error: '未登录', sessionExists: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      sessionExists: true,
      user: {
        email: session.user?.email,
        name: session.user?.name,
        id: (session.user as any)?.id,
        role: (session.user as any)?.role,
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: '检查失败', details: String(error) },
      { status: 500 }
    )
  }
}

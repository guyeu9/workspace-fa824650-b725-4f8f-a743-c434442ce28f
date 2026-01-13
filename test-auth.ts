import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { InputSanitizer, ValidationRules } from '@/lib/security-utils'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: ValidationRules.email,
  password: ValidationRules.password,
  name: ValidationRules.username,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = registerSchema.parse(body)
    
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }
    
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    const user = await db.user.create({
      data: {
        email: InputSanitizer.sanitizeEmail(validatedData.email),
        name: InputSanitizer.sanitizeText(validatedData.name),
        password: hashedPassword,
      }
    })
    
    await db.onlineStats.create({
      data: {
        userId: user.id,
        totalOnlineTime: 0,
      }
    })

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues && error.issues.length > 0 
        ? error.issues[0].message 
        : '输入数据验证失败'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    console.error('注册失败:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}

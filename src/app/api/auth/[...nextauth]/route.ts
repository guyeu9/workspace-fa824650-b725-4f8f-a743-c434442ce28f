import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('[NextAuth] Authorizing user:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.warn('[NextAuth] Missing credentials')
            return null
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.password) {
            console.warn('[NextAuth] User not found or no password')
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValid) {
            console.warn('[NextAuth] Invalid password')
            return null
          }

          if (!user.isActive) {
            console.warn('[NextAuth] User account disabled')
            throw new Error('您的账户已被禁用，请联系管理员')
          }

          // 记录登录日志
          await db.loginRecord.create({
            data: {
              userId: user.id,
              ipAddress: 'unknown', // 需要在中间件中获取真实IP
              userAgent: 'unknown', // 需要从请求头获取
            }
          })

          // 更新在线统计
          await db.onlineStats.upsert({
            where: { userId: user.id },
            update: { 
              lastLoginAt: new Date()
            },
            create: {
              userId: user.id,
              lastLoginAt: new Date()
            }
          })

          console.log('[NextAuth] User authorized successfully:', user.id)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error('[NextAuth] Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role
          console.log('[NextAuth] JWT token created for user:', user.id)
        }
        return token
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.role = token.role as string
          console.log('[NextAuth] Session created for user:', token.id)
        }
        return session
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error)
        return session
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
}

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
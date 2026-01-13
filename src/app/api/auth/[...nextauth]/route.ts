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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isValid) {
          return null
        }

        if (!user.isActive) {
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  }
}

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
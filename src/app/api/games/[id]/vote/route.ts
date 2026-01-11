import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { ValidationRules } from '@/lib/security-utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const session = await getServerSession()

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const type = body?.type

  // 验证投票类型
  const validationResult = z.enum(['UP', 'DOWN']).safeParse(type)
  if (!validationResult.success) {
    return new Response('Invalid vote type', { status: 400 })
  }

  const gameId = context.params.id

  const vote = await db.vote.upsert({
    where: {
      userId_gameId: {
        userId: user.id,
        gameId,
      },
    },
    update: {
      type,
    },
    create: {
      userId: user.id,
      gameId,
      type,
    },
  })

  return Response.json(vote)
}


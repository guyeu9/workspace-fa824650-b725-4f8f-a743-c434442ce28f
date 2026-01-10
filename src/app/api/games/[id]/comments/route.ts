import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const searchParams = request.nextUrl.searchParams
  const cursor = searchParams.get('cursor')
  const takeParam = searchParams.get('take')

  const take = takeParam ? parseInt(takeParam, 10) : 20

  const comments = await db.comment.findMany({
    where: {
      gameId: context.params.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: take + 1,
    cursor: cursor
      ? {
          id: cursor,
        }
      : undefined,
    include: {
      user: true,
    },
  })

  let nextCursor: string | null = null

  if (comments.length > take) {
    const nextItem = comments.pop()
    if (nextItem) {
      nextCursor = nextItem.id
    }
  }

  const items = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    user: {
      id: comment.user.id,
      name: comment.user.name,
    },
  }))

  return Response.json({
    items,
    nextCursor,
  })
}

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
  const content = body?.content

  if (typeof content !== 'string' || !content.trim()) {
    return new Response('Invalid content', { status: 400 })
  }

  const comment = await db.comment.create({
    data: {
      content: content.trim(),
      userId: user.id,
      gameId: context.params.id,
    },
    include: {
      user: true,
    },
  })

  return Response.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    user: {
      id: comment.user.id,
      name: comment.user.name,
    },
  })
}


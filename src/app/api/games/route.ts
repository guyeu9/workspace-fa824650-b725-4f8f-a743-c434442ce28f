import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET() {
  const games = await db.game.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      votes: true,
      comments: true,
      author: true,
    },
    take: 50,
  })

  const result = games.map((game) => {
    const upvotes = game.votes.filter((v) => v.type === 'UP').length
    const downvotes = game.votes.filter((v) => v.type === 'DOWN').length

    return {
      id: game.id,
      title: game.title,
      description: game.description,
      coverUrl: game.coverUrl,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      author: {
        id: game.author.id,
        name: game.author.name,
      },
      score: upvotes - downvotes,
      upvotes,
      downvotes,
      commentsCount: game.comments.length,
    }
  })

  return Response.json(result)
}

export async function POST(request: NextRequest) {
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

  const formData = await request.formData()
  const title = formData.get('title')
  const description = formData.get('description')
  const coverUrl = formData.get('coverUrl')
  const file = formData.get('file')

  if (typeof title !== 'string' || !title.trim()) {
    return new Response('Invalid title', { status: 400 })
  }

  if (!(file instanceof File)) {
    return new Response('JSON file is required', { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.json')) {
    return new Response('Only JSON files are allowed', { status: 400 })
  }

  const text = await file.text()

  let jsonData: unknown

  try {
    jsonData = JSON.parse(text)
  } catch {
    return new Response('Invalid JSON content', { status: 400 })
  }

  const game = await db.game.create({
    data: {
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      coverUrl: typeof coverUrl === 'string' && coverUrl.trim().length > 0 ? coverUrl.trim() : null,
      jsonData,
      authorId: user.id,
    },
  })

  return Response.json({ id: game.id }, { status: 201 })
}

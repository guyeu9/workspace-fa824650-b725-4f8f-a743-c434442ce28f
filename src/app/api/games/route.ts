import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET() {
  // 使用聚合查询优化性能
  const games = await db.game.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
    take: 50,
  })

  // 获取投票统计（使用单独的查询来优化性能）
  const gameIds = games.map(game => game.id)
  const voteStats = await db.vote.groupBy({
    by: ['gameId', 'type'],
    where: {
      gameId: {
        in: gameIds,
      },
    },
    _count: true,
  })

  // 构建投票统计映射
  const voteStatsMap = new Map<string, { upvotes: number; downvotes: number }>()
  voteStats.forEach(stat => {
    if (!voteStatsMap.has(stat.gameId)) {
      voteStatsMap.set(stat.gameId, { upvotes: 0, downvotes: 0 })
    }
    const current = voteStatsMap.get(stat.gameId)!
    if (stat.type === 'UP') {
      current.upvotes = stat._count
    } else {
      current.downvotes = stat._count
    }
  })

  const result = games.map((game) => {
    const stats = voteStatsMap.get(game.id) || { upvotes: 0, downvotes: 0 }
    
    return {
      id: game.id,
      title: game.title,
      description: game.description,
      coverUrl: game.coverUrl,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      author: game.author,
      score: stats.upvotes - stats.downvotes,
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      commentsCount: game._count.comments,
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

  let finalCoverUrl: string | null = null
  
  if (typeof coverUrl === 'string' && coverUrl.trim().length > 0) {
    const trimmedUrl = coverUrl.trim()
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      finalCoverUrl = trimmedUrl
    } else {
      return new Response('Invalid cover URL. Must be a valid image hosting URL', { status: 400 })
    }
  }

  const game = await db.game.create({
    data: {
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      coverUrl: finalCoverUrl,
      jsonData,
      authorId: user.id,
    },
  })

  return Response.json({ id: game.id }, { status: 201 })
}

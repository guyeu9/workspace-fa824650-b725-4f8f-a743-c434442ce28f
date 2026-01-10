import { db } from '@/lib/db'

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const game = await db.game.findUnique({
    where: {
      id: context.params.id,
    },
    include: {
      author: true,
    },
  })

  if (!game) {
    return new Response('Not found', { status: 404 })
  }

  return Response.json({
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
    jsonData: game.jsonData,
  })
}


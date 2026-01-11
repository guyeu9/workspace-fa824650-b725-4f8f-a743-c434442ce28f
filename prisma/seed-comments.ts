import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 获取测试用户和管理员
  const user = await prisma.user.findUnique({
    where: { email: 'user@example.com' }
  })
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  })

  if (!user || !admin) {
    console.log('用户不存在')
    return
  }

  // 获取游戏
  const game = await prisma.game.findFirst({
    where: { authorId: admin.id }
  })

  if (!game) {
    console.log('游戏不存在')
    return
  }

  // 创建测试评论
  const comment1 = await prisma.comment.create({
    data: {
      content: '这个游戏太棒了！剧情设计很精彩，期待更多内容！',
      userId: user.id,
      gameId: game.id,
    }
  })

  const comment2 = await prisma.comment.create({
    data: {
      content: '作为管理员，我觉得这个游戏还有改进的空间。建议增加更多互动选项。',
      userId: admin.id,
      gameId: game.id,
    }
  })

  // 创建测试投票
  const vote1 = await prisma.vote.create({
    data: {
      type: 'UP',
      userId: user.id,
      gameId: game.id,
    }
  })

  const vote2 = await prisma.vote.create({
    data: {
      type: 'UP',
      userId: admin.id,
      gameId: game.id,
    }
  })

  console.log('测试数据已创建:', { comment1, comment2, vote1, vote2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
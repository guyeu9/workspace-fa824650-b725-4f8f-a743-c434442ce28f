import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 获取管理员用户
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  })

  if (!admin) {
    console.log('管理员用户不存在')
    return
  }

  // 创建测试游戏
  const testGame = await prisma.game.create({
    data: {
      title: '神秘森林探险',
      description: '一个充满神秘和冒险的森林探索游戏，玩家需要在森林中寻找宝藏并解开古老的谜题。',
      coverUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      jsonData: {
        game_title: '神秘森林探险',
        description: '一个充满神秘和冒险的森林探索游戏',
        branches: [
          {
            branch_id: 'start',
            chapter: '森林入口',
            scene_detail: '你站在一片神秘的森林入口前。古老的树木高耸入云，阳光透过树叶洒下斑驳的光影。远处传来鸟儿的鸣叫声和风吹过树叶的沙沙声。',
            choices: [
              {
                choice: '进入森林',
                next_branch: 'forest_deep',
                effect: '你鼓起勇气，踏入了神秘的森林。',
                status_update: '状态：探索中'
              },
              {
                choice: '在入口处观察',
                next_branch: 'observe_entrance',
                effect: '你仔细观察着森林入口的每一个细节。',
                status_update: '状态：观察中'
              }
            ]
          },
          {
            branch_id: 'forest_deep',
            chapter: '森林深处',
            scene_detail: '你深入到了森林的腹地。这里的树木更加茂密，光线也变得昏暗。你发现前方有一个小木屋，看起来已经废弃很久了。',
            choices: [
              {
                choice: '进入木屋',
                next_branch: 'cabin_inside',
                effect: '你小心翼翼地推开了木屋的门。',
                status_update: '状态：探索木屋'
              },
              {
                choice: '继续深入森林',
                next_branch: 'forest_end',
                effect: '你决定继续向森林更深处探索。',
                status_update: '状态：深入探索'
              }
            ]
          },
          {
            branch_id: 'cabin_inside',
            chapter: '木屋内部',
            scene_detail: '木屋内布满了灰尘和蜘蛛网，但你在角落里发现了一个古老的宝箱。宝箱上刻着神秘的符文。',
            choices: [
              {
                choice: '打开宝箱',
                next_branch: 'treasure_found',
                effect: '你小心翼翼地打开了宝箱，里面发出了耀眼的光芒！',
                status_update: '状态：发现宝藏'
              },
              {
                choice: '先检查宝箱',
                next_branch: 'check_treasure',
                effect: '你仔细观察着宝箱上的符文。',
                status_update: '状态：检查宝箱'
              }
            ]
          },
          {
            branch_id: 'treasure_found',
            chapter: '宝藏发现',
            scene_detail: '恭喜！你成功找到了传说中的宝藏！宝箱中装满了金币和珍贵的宝石，还有一张古老的地图，标记着更多宝藏的位置。',
            choices: [
              {
                choice: '结束探险',
                next_branch: 'end_game',
                effect: '你带着宝藏满意地离开了森林。',
                end_game: true,
                status_update: '状态：探险成功'
              }
            ]
          }
        ]
      },
      authorId: admin.id,
    }
  })

  console.log('测试游戏已创建:', testGame)
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
const fs = require('fs');
const path = require('path');

function addMissingBranches(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  const branches = data.branches || [];
  
  const missingBranches = [
    {
      branch_id: "parking_lot_main",
      branch_title: "停车场系列主菜单",
      content: "停车场是一个充满不确定性的场所。在这里，每一次脱衣都是一次羞辱的享受，鸡巴在兴奋中不断发硬，体验被陌生人发现的快感。",
      options: [
        {
          option_id: "opt_parking_1",
          option_text: "1. 停车场骰子游戏",
          target_branch_id: "parking_lot_dice_main",
          effect: "骰子决定你的命运，每一次投掷都是一次刺激的冒险。"
        },
        {
          option_id: "opt_parking_2",
          option_text: "2. 停车场脱衣挑战",
          target_branch_id: "parking_lot_dice_2_main",
          effect: "在停车场脱衣，感受被路过的车辆发现的刺激。"
        },
        {
          option_id: "opt_parking_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "late_night_square_main",
      branch_title: "深夜广场系列主菜单",
      content: "深夜的广场，脱衣游戏的刺激体验。在空旷的广场上体验赤裸的快感，鸡巴在夜风中微微发硬，感受被路人注视的羞辱与兴奋。",
      options: [
        {
          option_id: "opt_square_1",
          option_text: "1. 广场脱衣挑战",
          target_branch_id: "late_night_corridor_main",
          effect: "在广场上脱衣，感受被路人注视的羞辱与兴奋。"
        },
        {
          option_id: "opt_square_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "hotel_main",
      branch_title: "酒店系列主菜单",
      content: "酒店是一个私密而刺激的场所。在这里，你可以体验各种暴露的快感，鸡巴在期待中微微发硬。",
      options: [
        {
          option_id: "opt_hotel_1",
          option_text: "1. 酒店走廊暴露",
          target_branch_id: "late_night_corridor_main",
          effect: "在酒店走廊暴露，感受被发现的刺激。"
        },
        {
          option_id: "opt_hotel_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "university_lake_1",
      branch_title: "大学湖边",
      content: "湖边的风景优美，但你的心思全在暴露上。鸡巴在湖风中微微发硬，感受被同学发现的快感。",
      options: [
        {
          option_id: "opt_lake_1",
          option_text: "1. 在湖边脱衣",
          target_branch_id: "task_center",
          effect: "在湖边脱衣，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 5 },
            { state_id: "shame", operation: "add", value: 3 },
            { state_id: "excitement", operation: "add", value: 8 }
          ]
        },
        {
          option_id: "opt_lake_back",
          option_text: "返回校园主菜单",
          target_branch_id: "university_main",
          effect: "返回校园主菜单。"
        }
      ]
    },
    {
      branch_id: "university_toilet_1",
      branch_title: "大学洗手间",
      content: "洗手间是校园中最私密的暴露场所。在这里，鸡巴在期待中微微发硬，感受被同学发现的刺激。",
      options: [
        {
          option_id: "opt_toilet_1",
          option_text: "1. 在洗手间暴露",
          target_branch_id: "task_center",
          effect: "在洗手间暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 12 }
          ]
        },
        {
          option_id: "opt_toilet_back",
          option_text: "返回校园主菜单",
          target_branch_id: "university_main",
          effect: "返回校园主菜单。"
        }
      ]
    },
    {
      branch_id: "midnight_convenience_1",
      branch_title: "午夜便利店 - 场景1",
      content: "凌晨的便利店，跳蛋的震动让你欲罢不能。在深夜的便利店里，体验被店员发现的刺激，鸡巴在震动中不断发硬，前列腺液不自觉地流出。",
      options: [
        {
          option_id: "opt_midnight_1_1",
          option_text: "1. 继续挑战",
          target_branch_id: "midnight_convenience_2",
          effect: "继续午夜便利店的冒险。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 5 },
            { state_id: "shame", operation: "add", value: 4 },
            { state_id: "excitement", operation: "add", value: 10 }
          ]
        },
        {
          option_id: "opt_midnight_1_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "midnight_convenience_2",
      branch_title: "午夜便利店 - 场景2",
      content: "便利店里的震动越来越强烈，你的鸡巴已经完全发硬。店员似乎注意到了你的异常，但并没有说什么。",
      options: [
        {
          option_id: "opt_midnight_2_1",
          option_text: "1. 继续挑战",
          target_branch_id: "midnight_convenience_3",
          effect: "继续午夜便利店的冒险。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 15 }
          ]
        },
        {
          option_id: "opt_midnight_2_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "midnight_convenience_3",
      branch_title: "午夜便利店 - 场景3",
      content: "你终于无法忍受，在便利店角落里释放了。鸡巴在兴奋中颤抖，前列腺液流了一地。店员看着你，眼神中充满了惊讶和欲望。",
      options: [
        {
          option_id: "opt_midnight_3_1",
          option_text: "1. 完成挑战",
          target_branch_id: "task_center",
          effect: "完成了午夜便利店的挑战！",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 10 },
            { state_id: "shame", operation: "add", value: 8 },
            { state_id: "excitement", operation: "add", value: 20 }
          ]
        },
        {
          option_id: "opt_midnight_3_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "task_selection",
      branch_title: "任务选择",
      content: "选择你想要挑战的任务类型。每个任务都充满了刺激与羞辱的快感。",
      options: [
        {
          option_id: "opt_task_1",
          option_text: "1. 四个任务三种难度",
          target_branch_id: "four_tasks_three_difficulties_main",
          effect: "选择四个任务三种难度的挑战。"
        },
        {
          option_id: "opt_task_2",
          option_text: "2. 随机追踪任务",
          target_branch_id: "random_tracking_main",
          effect: "选择随机追踪任务的挑战。"
        },
        {
          option_id: "opt_task_3",
          option_text: "3. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "four_tasks_three_difficulties_main",
      branch_title: "四个任务三种难度",
      content: "这里有四个任务，每个任务都有三种难度。选择你想要挑战的任务和难度。",
      options: [
        {
          option_id: "opt_four_tasks_1",
          option_text: "1. 简单难度",
          target_branch_id: "task_center",
          effect: "选择简单难度。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 3 },
            { state_id: "shame", operation: "add", value: 2 },
            { state_id: "excitement", operation: "add", value: 5 }
          ]
        },
        {
          option_id: "opt_four_tasks_2",
          option_text: "2. 中等难度",
          target_branch_id: "task_center",
          effect: "选择中等难度。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 6 },
            { state_id: "shame", operation: "add", value: 4 },
            { state_id: "excitement", operation: "add", value: 10 }
          ]
        },
        {
          option_id: "opt_four_tasks_3",
          option_text: "3. 困难难度",
          target_branch_id: "task_center",
          effect: "选择困难难度。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 10 },
            { state_id: "shame", operation: "add", value: 8 },
            { state_id: "excitement", operation: "add", value: 15 }
          ]
        },
        {
          option_id: "opt_four_tasks_back",
          option_text: "返回任务选择",
          target_branch_id: "task_selection",
          effect: "返回任务选择。"
        }
      ]
    },
    {
      branch_id: "random_tracking_main",
      branch_title: "随机追踪任务",
      content: "随机追踪任务充满了不确定性。你不知道下一个挑战是什么，这种未知感让你更加兴奋。",
      options: [
        {
          option_id: "opt_random_1",
          option_text: "1. 开始追踪",
          target_branch_id: "random_tracking_2_main",
          effect: "开始随机追踪任务。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 5 },
            { state_id: "shame", operation: "add", value: 4 },
            { state_id: "excitement", operation: "add", value: 8 }
          ]
        },
        {
          option_id: "opt_random_back",
          option_text: "返回任务选择",
          target_branch_id: "task_selection",
          effect: "返回任务选择。"
        }
      ]
    },
    {
      branch_id: "parking_lot_dice_main",
      branch_title: "停车场骰子游戏",
      content: "停车场里的骰子游戏，充满了不确定性。每一次脱衣都是一次羞辱的享受，鸡巴在兴奋中不断发硬，体验被陌生人发现的快感。",
      options: [
        {
          option_id: "opt_dice_1",
          option_text: "1. 投掷骰子",
          target_branch_id: "task_center",
          effect: "投掷骰子，接受命运的安排。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 12 }
          ]
        },
        {
          option_id: "opt_dice_back",
          option_text: "返回停车场主菜单",
          target_branch_id: "parking_lot_main",
          effect: "返回停车场主菜单。"
        }
      ]
    },
    {
      branch_id: "college_basic_exposure_main",
      branch_title: "大学基础暴露",
      content: "大学校园是暴露的绝佳场所。在知识的殿堂中体验被同学发现的快感，你的鸡巴在期待中微微发硬。",
      options: [
        {
          option_id: "opt_college_1",
          option_text: "1. 基础暴露挑战",
          target_branch_id: "task_center",
          effect: "进行基础暴露挑战。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 5 },
            { state_id: "shame", operation: "add", value: 4 },
            { state_id: "excitement", operation: "add", value: 8 }
          ]
        },
        {
          option_id: "opt_college_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "multiplayer_tasks_main",
      branch_title: "多人任务",
      content: "多人任务充满了更多的刺激和羞辱。你将被多人观看，这种暴露感让你更加兴奋。",
      options: [
        {
          option_id: "opt_multi_1",
          option_text: "1. 开始多人任务",
          target_branch_id: "task_center",
          effect: "开始多人任务。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 10 },
            { state_id: "shame", operation: "add", value: 8 },
            { state_id: "excitement", operation: "add", value: 15 }
          ]
        },
        {
          option_id: "opt_multi_back",
          option_text: "返回任务选择",
          target_branch_id: "task_selection",
          effect: "返回任务选择。"
        }
      ]
    },
    {
      branch_id: "random_tracking_2_main",
      branch_title: "随机追踪任务2",
      content: "随机追踪任务的第二阶段。挑战更加困难，但快感也更加强烈。",
      options: [
        {
          option_id: "opt_random2_1",
          option_text: "1. 继续追踪",
          target_branch_id: "task_center",
          effect: "继续随机追踪任务。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 12 }
          ]
        },
        {
          option_id: "opt_random2_back",
          option_text: "返回任务选择",
          target_branch_id: "task_selection",
          effect: "返回任务选择。"
        }
      ]
    },
    {
      branch_id: "parking_lot_dice_2_main",
      branch_title: "停车场骰子游戏2",
      content: "停车场骰子游戏的第二阶段。骰子的点数决定了你的命运，每一次投掷都是一次刺激的冒险。",
      options: [
        {
          option_id: "opt_dice2_1",
          option_text: "1. 投掷骰子",
          target_branch_id: "task_center",
          effect: "投掷骰子，接受命运的安排。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 10 },
            { state_id: "shame", operation: "add", value: 8 },
            { state_id: "excitement", operation: "add", value: 15 }
          ]
        },
        {
          option_id: "opt_dice2_back",
          option_text: "返回停车场主菜单",
          target_branch_id: "parking_lot_main",
          effect: "返回停车场主菜单。"
        }
      ]
    },
    {
      branch_id: "special_scenes",
      branch_title: "特殊场景",
      content: "特殊场景充满了独特的刺激和羞辱。这些场景不同于普通的暴露任务，更加刺激和危险。",
      options: [
        {
          option_id: "opt_special_1",
          option_text: "1. 浴室场景",
          target_branch_id: "bathhouse_main",
          effect: "选择浴室场景。"
        },
        {
          option_id: "opt_special_2",
          option_text: "2. KTV场景",
          target_branch_id: "ktv_main",
          effect: "选择KTV场景。"
        },
        {
          option_id: "opt_special_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "night_scenes",
      branch_title: "夜间场景",
      content: "夜间场景充满了黑暗和未知。在深夜中暴露，感受被发现的刺激和快感。",
      options: [
        {
          option_id: "opt_night_1",
          option_text: "1. 深夜走廊",
          target_branch_id: "late_night_corridor_main",
          effect: "选择深夜走廊场景。"
        },
        {
          option_id: "opt_night_2",
          option_text: "2. 深夜广场",
          target_branch_id: "late_night_square_main",
          effect: "选择深夜广场场景。"
        },
        {
          option_id: "opt_night_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "outdoor_scenes",
      branch_title: "户外场景",
      content: "户外场景充满了自然和公共的刺激。在户外暴露，感受被路人发现的快感。",
      options: [
        {
          option_id: "opt_outdoor_1",
          option_text: "1. 大学湖边",
          target_branch_id: "university_lake_1",
          effect: "选择大学湖边场景。"
        },
        {
          option_id: "opt_outdoor_2",
          option_text: "2. 停车场",
          target_branch_id: "parking_lot_main",
          effect: "选择停车场场景。"
        },
        {
          option_id: "opt_outdoor_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "cinema_exposure_main",
      branch_title: "电影院暴露",
      content: "电影院是一个黑暗而刺激的场所。在电影播放时暴露，感受被周围观众发现的刺激。",
      options: [
        {
          option_id: "opt_cinema_1",
          option_text: "1. 在电影院暴露",
          target_branch_id: "task_center",
          effect: "在电影院暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 12 }
          ]
        },
        {
          option_id: "opt_cinema_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "gym_exposure_main",
      branch_title: "健身房暴露",
      content: "健身房是一个充满肌肉和汗水的场所。在健身时暴露，感受被其他健身者发现的刺激。",
      options: [
        {
          option_id: "opt_gym_1",
          option_text: "1. 在健身房暴露",
          target_branch_id: "task_center",
          effect: "在健身房暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 7 },
            { state_id: "shame", operation: "add", value: 5 },
            { state_id: "excitement", operation: "add", value: 10 }
          ]
        },
        {
          option_id: "opt_gym_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "late_night_corridor_main",
      branch_title: "深夜走廊",
      content: "深夜的走廊空无一人，但这种安静反而让你更加兴奋。鸡巴在黑暗中微微发硬，感受被发现的刺激。",
      options: [
        {
          option_id: "opt_corridor_1",
          option_text: "1. 在走廊暴露",
          target_branch_id: "task_center",
          effect: "在走廊暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 9 },
            { state_id: "shame", operation: "add", value: 7 },
            { state_id: "excitement", operation: "add", value: 14 }
          ]
        },
        {
          option_id: "opt_corridor_back",
          option_text: "返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "bathhouse_main",
      branch_title: "浴室场景",
      content: "浴室是一个充满蒸汽和裸体的场所。在这里暴露，感受被其他沐浴者发现的刺激。",
      options: [
        {
          option_id: "opt_bath_1",
          option_text: "1. 在浴室暴露",
          target_branch_id: "task_center",
          effect: "在浴室暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 10 },
            { state_id: "shame", operation: "add", value: 8 },
            { state_id: "excitement", operation: "add", value: 15 }
          ]
        },
        {
          option_id: "opt_bath_back",
          option_text: "返回特殊场景",
          target_branch_id: "special_scenes",
          effect: "返回特殊场景。"
        }
      ]
    },
    {
      branch_id: "ktv_main",
      branch_title: "KTV场景",
      content: "KTV是一个充满音乐和酒精的场所。在KTV包厢中暴露，感受被朋友发现的刺激。",
      options: [
        {
          option_id: "opt_ktv_1",
          option_text: "1. 在KTV暴露",
          target_branch_id: "task_center",
          effect: "在KTV暴露，感受被发现的刺激。",
          status_changes: [
            { state_id: "exposure", operation: "add", value: 8 },
            { state_id: "shame", operation: "add", value: 6 },
            { state_id: "excitement", operation: "add", value: 12 }
          ]
        },
        {
          option_id: "opt_ktv_back",
          option_text: "返回特殊场景",
          target_branch_id: "special_scenes",
          effect: "返回特殊场景。"
        }
      ]
    }
  ];
  
  const existingBranchIds = new Set(branches.map(b => b.branch_id));
  const branchesToAdd = missingBranches.filter(b => !existingBranchIds.has(b.branch_id));
  
  console.log(`Adding ${branchesToAdd.length} missing branches`);
  
  data.branches = [...branches, ...branchesToAdd];
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Add missing branches complete!");
  
  console.log("\n=== Add Statistics ===");
  console.log(`Total branches: ${data.branches.length}`);
  const totalOptions = data.branches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`Missing branches added: ${branchesToAdd.length}`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v4.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v5.json');

addMissingBranches(inputFile, outputFile);

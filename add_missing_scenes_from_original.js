const fs = require('fs');
const path = require('path');

function addMissingScenesFromOriginal(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  const branches = data.branches || [];
  
  const newBranches = [
    {
      branch_id: "late_night_community_main",
      branch_title: "小区半夜任务",
      content: "半夜全裸下楼倒垃圾，胆子小的话就穿情趣装或者丁字裤去。如果你有同伴的话，半夜的时候，可以让对方把你的内衣裤、袜子等，藏在小区的各个角落，绿化带等地方，让对方画出小区的简易地形图，圈出藏衣服的地点，然后按顺序去找。",
      options: [
        {
          option_id: "choice_late_night_community_1",
          option_text: "1. 开始任务",
          target_branch_id: "late_night_community_detailed",
          effect: "开始小区半夜任务。"
        },
        {
          option_id: "choice_late_night_community_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "late_night_community_detailed",
      branch_title: "小区半夜任务 - 详细",
      content: "你选择在半夜进行全裸下楼倒垃圾的任务。这是一个危险而刺激的冒险，鸡巴在期待中微微发硬。",
      options: [
        {
          option_id: "choice_late_night_community_detailed_1",
          option_text: "1. 全裸下楼",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 15 },
            { attribute: "shame", operation: "+", value: 12 },
            { attribute: "excitement", operation: "+", value: 20 }
          ],
          effect: "全裸下楼倒垃圾，感受被发现的刺激。"
        },
        {
          option_id: "choice_late_night_community_detailed_2",
          option_text: "2. 穿情趣装",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 12 },
            { attribute: "shame", operation: "+", value: 10 },
            { attribute: "excitement", operation: "+", value: 15 }
          ],
          effect: "穿情趣装下楼，增加羞辱感。"
        }
      ]
    },
    {
      branch_id: "campus_main",
      branch_title: "校园任务",
      content: "校园任务地点包括：宿舍、校园内公厕、图书馆、教室、操场、天台。选择你想要挑战的校园场景。",
      options: [
        {
          option_id: "choice_campus_1",
          option_text: "1. 宿舍",
          target_branch_id: "dormitory_room_main",
          effect: "选择宿舍场景。"
        },
        {
          option_id: "choice_campus_2",
          option_text: "2. 校园内公厕",
          target_branch_id: "public_toilet_main",
          effect: "选择校园公厕场景。"
        },
        {
          option_id: "choice_campus_3",
          option_text: "3. 图书馆",
          target_branch_id: "library_main",
          effect: "选择图书馆场景。"
        },
        {
          option_id: "choice_campus_4",
          option_text: "4. 教室",
          target_branch_id: "classroom_main",
          effect: "选择教室场景。"
        },
        {
          option_id: "choice_campus_5",
          option_text: "5. 操场",
          target_branch_id: "playground_main",
          effect: "选择操场场景。"
        },
        {
          option_id: "choice_campus_6",
          option_text: "6. 天台",
          target_branch_id: "rooftop_main",
          effect: "选择天台场景。"
        },
        {
          option_id: "choice_campus_7",
          option_text: "7. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_main",
      branch_title: "宿舍楼道任务",
      content: "此任务适合有独卫、宿舍楼没有公共卫生间的情况。因为任务比较危险，适合有公共卫生间的任务等这一批次任务更新完后加更。不需要任何道具，拿好手机，穿戴整齐，适合凌晨三点左右做（任务危险度大，慎重）。",
      options: [
        {
          option_id: "choice_dormitory_corridor_1",
          option_text: "1. 开始第一轮",
          target_branch_id: "dormitory_corridor_round1",
          effect: "开始宿舍楼道任务第一轮。"
        },
        {
          option_id: "choice_dormitory_corridor_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round1",
      branch_title: "宿舍楼道任务 - 第一轮",
      content: "从一楼开始，摇出两个数字，得出一个宿舍号，跪在宿舍门口，拍一张自拍，要拍到宿舍号和你的全身。在每一层楼道中脱掉衣服，放在楼梯把手。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round1_1",
          option_text: "1. 继续到二楼",
          target_branch_id: "dormitory_corridor_round1_floor2",
          effect: "前往二楼继续任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round1_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round1_floor2",
      branch_title: "宿舍楼道任务 - 第一轮二楼",
      content: "摇出两个数字，得出二楼的宿舍号，继续脱掉上衣和裤子，放在楼梯把手。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round1_floor2_1",
          option_text: "1. 继续到三楼",
          target_branch_id: "dormitory_corridor_round1_floor3",
          effect: "前往三楼继续任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round1_floor2_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round1_floor3",
      branch_title: "宿舍楼道任务 - 第一轮三楼",
      content: "摇出两个数字，得出三楼的宿舍号，全部脱光，一丝不挂，酌情可以穿鞋子。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round1_floor3_1",
          option_text: "1. 继续到四楼",
          target_branch_id: "dormitory_corridor_round1_floor4",
          effect: "前往四楼继续任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round1_floor3_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round1_floor4",
      branch_title: "宿舍楼道任务 - 第一轮四楼",
      content: "摇出两个数字，得出四楼的宿舍号，继续脱掉上衣和裤子，放在楼梯把手。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round1_floor4_1",
          option_text: "1. 继续到五楼",
          target_branch_id: "dormitory_corridor_round1_floor5",
          effect: "前往五楼继续任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round1_floor4_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round1_floor5",
      branch_title: "宿舍楼道任务 - 第一轮五楼",
      content: "摇出两个数字，得出五楼的宿舍号，继续脱掉上衣和裤子，放在楼梯把手。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round1_floor5_1",
          option_text: "1. 完成第一轮",
          target_branch_id: "dormitory_corridor_round2",
          effect: "完成第一轮任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round1_floor5_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round2",
      branch_title: "宿舍楼道任务 - 第二轮",
      content: "裸体回到一楼，并且拿回所有的衣服。骰子摇出两个数字，然后把衣服分别放在每层楼对应的宿舍（例如：摇出15，则上衣放115门口，裤子放在215，内裤放315，袜子放415，鞋子放515，具体根据自己情况定）。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round2_1",
          option_text: "1. 从五楼开始",
          target_branch_id: "dormitory_corridor_round2_floor5",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 20 },
            { attribute: "shame", operation: "+", value: 15 },
            { attribute: "excitement", operation: "+", value: 25 }
          ],
          effect: "从五楼开始狗爬任务。"
        },
        {
          option_id: "choice_dormitory_corridor_round2_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_corridor_round2_floor5",
      branch_title: "宿舍楼道任务 - 第二轮五楼",
      content: "从楼道头狗爬到楼道尾，中间要有三次狗姿展示。",
      options: [
        {
          option_id: "choice_dormitory_corridor_round2_floor5_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 25 },
            { attribute: "shame", operation: "+", value: 20 },
            { attribute: "excitement", operation: "+", value: 30 }
          ],
          effect: "完成宿舍楼道任务！"
        },
        {
          option_id: "choice_dormitory_corridor_round2_floor5_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_room_main",
      branch_title: "宿舍内任务",
      content: "此任务适合没有独卫、有公共卫生间和阳台的宿舍。基础任务：有床帘或者舍友都睡着的情况下，狗姿照三张。阳台裸照三张。高级任务：首先完成基础任务，然后全裸去公共厕所，全裸来回录像，回到宿舍后在宿舍中间裸照三张。特别任务：在宿舍内进行特殊挑战。",
      options: [
        {
          option_id: "choice_dormitory_room_1",
          option_text: "1. 基础任务",
          target_branch_id: "dormitory_room_basic",
          effect: "开始宿舍内基础任务。"
        },
        {
          option_id: "choice_dormitory_room_2",
          option_text: "2. 阳台裸照",
          target_branch_id: "dormitory_room_balcony",
          effect: "开始阳台裸照任务。"
        },
        {
          option_id: "choice_dormitory_room_3",
          option_text: "3. 高级任务",
          target_branch_id: "dormitory_room_advanced",
          effect: "开始宿舍内高级任务。"
        },
        {
          option_id: "choice_dormitory_room_4",
          option_text: "4. 特别任务",
          target_branch_id: "dormitory_room_special",
          effect: "开始宿舍内特别任务。"
        },
        {
          option_id: "choice_dormitory_room_5",
          option_text: "5. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_room_basic",
      branch_title: "宿舍内任务 - 基础",
      content: "有床帘或者舍友都睡着的情况下，狗姿照三张。阳台裸照三张。",
      options: [
        {
          option_id: "choice_dormitory_room_basic_1",
          option_text: "1. 狗姿照三张",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 8 },
            { attribute: "shame", operation: "+", value: 6 },
            { attribute: "excitement", operation: "+", value: 12 }
          ],
          effect: "完成狗姿拍照任务。"
        },
        {
          option_id: "choice_dormitory_room_basic_2",
          option_text: "2. 阳台裸照三张",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 10 },
            { attribute: "shame", operation: "+", value: 8 },
            { attribute: "excitement", operation: "+", value: 15 }
          ],
          effect: "完成阳台裸照任务。"
        }
      ]
    },
    {
      branch_id: "dormitory_room_balcony",
      branch_title: "宿舍内任务 - 阳台裸照",
      content: "在阳台上裸照三张，感受被发现的刺激。",
      options: [
        {
          option_id: "choice_dormitory_room_balcony_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 12 },
            { attribute: "shame", operation: "+", value: 10 },
            { attribute: "excitement", operation: "+", value: 18 }
          ],
          effect: "完成阳台裸照任务！"
        },
        {
          option_id: "choice_dormitory_room_balcony_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "dormitory_room_advanced",
      branch_title: "宿舍内任务 - 高级",
      content: "首先完成基础任务，然后全裸去公共厕所，全裸来回录像，回到宿舍后在宿舍中间裸照三张。",
      options: [
        {
          option_id: "choice_dormitory_room_advanced_1",
          option_text: "1. 全裸去公共厕所",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 15 },
            { attribute: "shame", operation: "+", value: 12 },
            { attribute: "excitement", operation: "+", value: 20 }
          ],
          effect: "全裸去公共厕所录像。"
        },
        {
          option_id: "choice_dormitory_room_advanced_2",
          option_text: "2. 返回宿舍裸照",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 10 },
            { attribute: "shame", operation: "+", value: 8 },
            { attribute: "excitement", operation: "+", value: 15 }
          ],
          effect: "回到宿舍裸照。"
        }
      ]
    },
    {
      branch_id: "dormitory_room_special",
      branch_title: "宿舍内任务 - 特别",
      content: "在宿舍内进行特殊挑战，体验极致的羞辱与兴奋。",
      options: [
        {
          option_id: "choice_dormitory_room_special_1",
          option_text: "1. 完成特别任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 20 },
            { attribute: "shame", operation: "+", value: 15 },
            { attribute: "excitement", operation: "+", value: 25 }
          ],
          effect: "完成宿舍内特别任务！"
        },
        {
          option_id: "choice_dormitory_room_special_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "humiliation_tasks_main",
      branch_title: "羞辱类任务合集",
      content: "羞辱类任务合集包括：生物课、篮球场、故事分享会、对象故事。选择你想要挑战的羞辱任务。",
      options: [
        {
          option_id: "choice_humiliation_1",
          option_text: "1. 生物课",
          target_branch_id: "biology_class_main",
          effect: "选择生物课羞辱任务。"
        },
        {
          option_id: "choice_humiliation_2",
          option_text: "2. 篮球场",
          target_branch_id: "basketball_court_main",
          effect: "选择篮球场羞辱任务。"
        },
        {
          option_id: "choice_humiliation_3",
          option_text: "3. 故事分享会",
          target_branch_id: "story_sharing_main",
          effect: "选择故事分享会羞辱任务。"
        },
        {
          option_id: "choice_humiliation_4",
          option_text: "4. 对象故事",
          target_branch_id: "partner_story_main",
          effect: "选择对象故事羞辱任务。"
        },
        {
          option_id: "choice_humiliation_5",
          option_text: "5. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "biology_class_main",
      branch_title: "羞辱任务 - 生物课",
      content: "一堂生物课，今天讲到人体生理结构方面的知识，但是内容很抽象，同学们不能集中注意力，你自告奋勇上来为大家展示讲解。先介绍全身各个部分，然后重点讲解狗屌，最后演示射精。但是演示射精时同学们等了很久就没有射出，只能流水，十分无能。你十分愧疚耽误大家时间，于是跪下磕头请罪，请大家责罚（自己想，某同学要求你做什么）。磕头的玩以后羞辱自己，说出自己不能射精的原因，然后执行同学们提出的惩罚（自拟），最后为了弥补大家的时间，承诺以后随便给大家玩等等。",
      options: [
        {
          option_id: "choice_biology_class_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 18 },
            { attribute: "shame", operation: "+", value: 15 },
            { attribute: "excitement", operation: "+", value: 20 }
          ],
          effect: "完成生物课羞辱任务！"
        },
        {
          option_id: "choice_biology_class_2",
          option_text: "2. 返回羞辱任务合集",
          target_branch_id: "humiliation_tasks_main",
          effect: "返回羞辱任务合集。"
        }
      ]
    },
    {
      branch_id: "basketball_court_main",
      branch_title: "羞辱任务 - 篮球场",
      content: "篮球队训练，你是篮球队的队长，今天你们训练很累，你看你的队员累的不成样子了，你主动要求给他们放松放松，放松内容自己告诉你的队员，并对这些内容进行亲自演示，你的队员还是不太想，你磕头请求，发骚求他们，舔鞋，舔脚，闻袜子，用狗嘴清理，每一项单独演示，求他们玩你，看你多骚。",
      options: [
        {
          option_id: "choice_basketball_court_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 20 },
            { attribute: "shame", operation: "+", value: 18 },
            { attribute: "excitement", operation: "+", value: 25 }
          ],
          effect: "完成篮球场羞辱任务！"
        },
        {
          option_id: "choice_basketball_court_2",
          option_text: "2. 返回羞辱任务合集",
          target_branch_id: "humiliation_tasks_main",
          effect: "返回羞辱任务合集。"
        }
      ]
    },
    {
      branch_id: "story_sharing_main",
      branch_title: "羞辱任务 - 故事分享会",
      content: "这是一个故事分享会，你对观众介绍事情经过，详细描述细节，加动作。介绍他最近不想和你亲热，不想让你操他，说菊花不舒服，你以为他身体不舒服，有一天你却发现他自己用假几把操自己。你感到很惊讶，开始注意他的行踪，有一天在他洗澡时候，偶尔看他发现他手机有人给他发消息说明天等着他去你家用它他大肉棒操你对象，还有好多照片，你感到很愤怒。",
      options: [
        {
          option_id: "choice_story_sharing_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 15 },
            { attribute: "shame", operation: "+", value: 12 },
            { attribute: "excitement", operation: "+", value: 18 }
          ],
          effect: "完成故事分享会任务！"
        },
        {
          option_id: "choice_story_sharing_2",
          option_text: "2. 返回羞辱任务合集",
          target_branch_id: "humiliation_tasks_main",
          effect: "返回羞辱任务合集。"
        }
      ]
    },
    {
      branch_id: "partner_story_main",
      branch_title: "羞辱任务 - 对象故事",
      content: "你中午偷偷回家，打开门听到卧室里浪叫，你从留的门缝里看到他们做爱过程，详细描述动作比划，包括说了什么。你好生气但是阳痿几把却硬了，而且比平时吃药还硬的多，在门口偷偷打起飞机，细节详细描述。对方好像发现了你，狠狠地操了你对象好几下，突然打开了门，你被吓的突然射了出来，细节描述。对方对你辱骂，内容，你对象不吭声，对方让你跪着看他们交配，让你舔结合处，你被吓傻了，只能照做，你的鸡巴又硬了，细节描述。对方走了，你和你对象的反应，细节，萌生了你相当绿帽奴的想法。",
      options: [
        {
          option_id: "choice_partner_story_1",
          option_text: "1. 完成任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 18 },
            { attribute: "shame", operation: "+", value: 15 },
            { attribute: "excitement", operation: "+", value: 22 }
          ],
          effect: "完成对象故事任务！"
        },
        {
          option_id: "choice_partner_story_2",
          option_text: "2. 返回羞辱任务合集",
          target_branch_id: "humiliation_tasks_main",
          effect: "返回羞辱任务合集。"
        }
      ]
    },
    {
      branch_id: "airport_exposure_main",
      branch_title: "机场飞机暴露任务",
      content: "在机场进行飞机暴露任务，体验被众多旅客发现的刺激。这是一个高风险高回报的任务，鸡巴在期待中微微发硬。",
      options: [
        {
          option_id: "choice_airport_1",
          option_text: "1. 开始任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 25 },
            { attribute: "shame", operation: "+", value: 20 },
            { attribute: "excitement", operation: "+", value: 30 }
          ],
          effect: "开始机场飞机暴露任务！"
        },
        {
          option_id: "choice_airport_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    },
    {
      branch_id: "campus_hill_main",
      branch_title: "学校后山任务",
      content: "在学校后山进行暴露任务，体验被同学发现的刺激。这是一个充满冒险的任务，鸡巴在期待中微微发硬。",
      options: [
        {
          option_id: "choice_campus_hill_1",
          option_text: "1. 开始任务",
          target_branch_id: "task_center",
          status_changes: [
            { attribute: "exposure", operation: "+", value: 15 },
            { attribute: "shame", operation: "+", value: 12 },
            { attribute: "excitement", operation: "+", value: 18 }
          ],
          effect: "开始学校后山任务！"
        },
        {
          option_id: "choice_campus_hill_2",
          option_text: "2. 返回任务中心",
          target_branch_id: "task_center",
          effect: "返回任务选择中心。"
        }
      ]
    }
  ];
  
  const existingBranchIds = new Set(branches.map(b => b.branch_id));
  const branchesToAdd = newBranches.filter(b => !existingBranchIds.has(b.branch_id));
  
  console.log(`Adding ${branchesToAdd.length} missing scenes from original document`);
  
  data.branches = [...branches, ...branchesToAdd];
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Add missing scenes complete!");
  
  console.log("\n=== Add Statistics ===");
  console.log(`Total branches: ${data.branches.length}`);
  const totalOptions = data.branches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`Missing scenes added: ${branchesToAdd.length}`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v8.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v9.json');

addMissingScenesFromOriginal(inputFile, outputFile);

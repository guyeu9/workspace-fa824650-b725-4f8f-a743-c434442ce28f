# 游戏JSON导入完整指南

## 目录
1. [基本结构](#基本结构)
2. [分支系统](#分支系统)
3. [选项系统](#选项系统)
4. [状态系统](#状态系统)
5. [条件系统](#条件系统)
6. [后果系统](#后果系统)
7. [完整示例](#完整示例)
8. [常见问题](#常见问题)

---

## 基本结构

### 游戏元数据
```json
{
  "game_title": "游戏标题",
  "description": "游戏描述，简要介绍游戏背景和玩法",
  "author": "作者名称",
  "tags": ["标签1", "标签2"],
  "version": 1.0,
  "background_image": "背景图片URL（可选）",
  "background_asset_id": "背景图片资源ID（可选）",
  "branches": [...]
}
```

### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|--------|------|
| game_title | string | 是 | 游戏标题 |
| description | string | 是 | 游戏描述 |
| author | string | 否 | 作者名称 |
| tags | string[] | 否 | 游戏标签数组 |
| version | number | 否 | 游戏版本号 |
| background_image | string | 否 | 背景图片URL |
| background_asset_id | string | 否 | 背景图片资源ID |
| branches | Branch[] | 是 | 游戏分支数组 |
| game_states | GameStateConfig[] | 否 | 游戏状态初始配置 |

---

## 分支系统

### 分支结构
```json
{
  "branch_id": "唯一分支ID",
  "branch_title": "分支标题",
  "content": "分支内容描述",
  "options": [...]
}
```

### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|--------|------|
| branch_id | string | 是 | 分支唯一标识符，用于跳转和引用 |
| branch_title | string | 是 | 分支标题，显示在界面上 |
| content | string | 是 | 分支内容，支持换行符 `\n` |
| options | Option[] | 否 | 该分支的选项列表 |

### branch_id 命名规范
- 使用英文小写字母、数字和下划线
- 建议格式：`章节名_场景名` 或 `chapterX_sceneY`
- 示例：`chapter1_start`, `medical_bay`, `cargo_bay`

---

## 选项系统

### 选项结构
```json
{
  "option_id": "唯一选项ID",
  "option_text": "选项文本",
  "target_branch_id": "目标分支ID",
  "effect": "效果文本",
  "status_update": "状态更新文本",
  "status_changes": [...],
  "conditions": [...],
  "consequences": [...],
  "end_game": false
}
```

### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|--------|------|
| option_id | string | 是 | 选项唯一标识符 |
| option_text | string | 是 | 选项显示文本 |
| target_branch_id | string | 是 | 点击后跳转的目标分支ID |
| effect | string | 否 | 选择后显示的效果文本 |
| status_update | string | 否 | 选择后显示的状态更新文本 |
| status_changes | StatusChange[] | 否 | 数值变更数组 |
| conditions | Condition[] | 否 | 显示条件数组 |
| consequences | Consequence[] | 否 | 选择后的后果数组 |
| end_game | boolean | 否 | 是否结束游戏 |

---

## 状态系统

### 游戏状态配置
```json
{
  "game_states": [
    {
      "name": "金币",
      "initial_value": 100
    },
    {
      "name": "暴露度",
      "initial_value": 0
    },
    {
      "name": "好感度",
      "initial_value": 50
    }
  ]
}
```

### 状态变更结构
```json
{
  "attribute": "属性名",
  "operation": "+",
  "value": 10,
  "min": 0,
  "max": 100
}
```

### 支持的运算符
| 运算符 | 说明 | 示例 |
|--------|------|------|
| `+` | 加法 | 当前值 + 10 |
| `-` | 减法 | 当前值 - 10 |
| `*` | 乘法 | 当前值 * 2 |
| `/` | 除法 | 当前值 / 2 |
| `=` | 赋值 | 设置为指定值 |

### 数值限制
| 字段 | 类型 | 说明 |
|------|------|------|
| min | number | 最小值限制，低于此值时自动设为min |
| max | number | 最大值限制，高于此值时自动设为max |

### 自动限制规则
- 包含"度"或"率"的属性会自动限制在 0-100 之间
- 示例：`暴露度`、`好感度`、`生命值百分比`

### 状态变更示例
```json
{
  "option_text": "花费10金币购买物品",
  "status_changes": [
    {
      "attribute": "金币",
      "operation": "-",
      "value": 10,
      "min": 0
    },
    {
      "attribute": "好感度",
      "operation": "+",
      "value": 5,
      "max": 100
    }
  ]
}
```

---

## 条件系统

### 条件结构
```json
{
  "conditions": [
    {
      "type": "hasItem",
      "key": "物品ID",
      "operator": "eq",
      "value": true
    }
  ]
}
```

### 支持的条件类型

#### 1. hasItem - 物品条件
检查玩家是否拥有指定物品

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 固定值 `"hasItem"` |
| key | string | 物品ID |
| operator | string | 固定值 `"eq"` |
| value | boolean | 固定值 `true` |

**示例**：
```json
{
  "option_text": "使用钥匙打开门",
  "conditions": [
    {
      "type": "hasItem",
      "key": "engineer_keycard",
      "operator": "eq",
      "value": true
    }
  ]
}
```

---

## 后果系统

### 后果结构
```json
{
  "consequences": [
    {
      "type": "add_item",
      "key": "物品ID",
      "value": "物品名称"
    },
    {
      "type": "show_message",
      "key": "消息ID",
      "value": "消息内容"
    }
  ]
}
```

### 支持的后果类型

#### 1. add_item - 添加物品
给玩家添加物品

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 固定值 `"add_item"` |
| key | string | 物品唯一ID |
| value | string | 物品显示名称 |

**示例**：
```json
{
  "option_text": "拾取纳米急救喷雾",
  "consequences": [
    {
      "type": "add_item",
      "key": "medkit",
      "value": "纳米急救喷雾"
    }
  ]
}
```

#### 2. show_message - 显示消息
在游戏界面显示额外消息

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 固定值 `"show_message"` |
| key | string | 消息唯一ID |
| value | string | 消息内容 |

**示例**：
```json
{
  "option_text": "启动跃迁",
  "consequences": [
    {
      "type": "show_message",
      "key": "warp_warning",
      "value": "『塞壬』：『跃迁坐标已设定。警告：未知生物信号读数极高。』"
    }
  ]
}
```

---

## 完整示例

### 示例1：基础分支游戏
```json
{
  "game_title": "简单冒险",
  "description": "一个简单的分支选择游戏示例",
  "author": "示例作者",
  "tags": ["冒险", "简单"],
  "version": 1.0,
  "branches": [
    {
      "branch_id": "start",
      "branch_title": "起点",
      "content": "你站在一个十字路口，面前有三条路。",
      "options": [
        {
          "option_id": "opt_left",
          "option_text": "向左走",
          "target_branch_id": "left_path"
        },
        {
          "option_id": "opt_right",
          "option_text": "向右走",
          "target_branch_id": "right_path"
        },
        {
          "option_id": "opt_forward",
          "option_text": "继续前进",
          "target_branch_id": "forward_path"
        }
      ]
    },
    {
      "branch_id": "left_path",
      "branch_title": "左侧小路",
      "content": "你走在左侧的小路上，发现了一个宝箱。",
      "options": [
        {
          "option_id": "opt_open_chest",
          "option_text": "打开宝箱",
          "target_branch_id": "chest_opened"
        },
        {
          "option_id": "opt_back",
          "option_text": "返回起点",
          "target_branch_id": "start"
        }
      ]
    }
  ]
}
```

### 示例2：带状态系统的游戏
```json
{
  "game_title": "生存挑战",
  "description": "管理资源，做出选择，努力生存下去",
  "author": "示例作者",
  "tags": ["生存", "策略"],
  "version": 1.0,
  "game_states": [
    {
      "name": "金币",
      "initial_value": 50
    },
    {
      "name": "生命值",
      "initial_value": 100
    },
    {
      "name": "食物",
      "initial_value": 10
    }
  ],
  "branches": [
    {
      "branch_id": "start",
      "branch_title": "营地",
      "content": "你在营地休息，目前状态良好。",
      "options": [
        {
          "option_id": "opt_buy_food",
          "option_text": "花费10金币购买食物（金币-10，食物+5）",
          "target_branch_id": "start",
          "status_changes": [
            {
              "attribute": "金币",
              "operation": "-",
              "value": 10,
              "min": 0
            },
            {
              "attribute": "食物",
              "operation": "+",
              "value": 5
            }
          ],
          "effect": "你购买了一些食物。"
        },
        {
          "option_id": "opt_eat",
          "option_text": "进食（食物-1，生命值+20）",
          "target_branch_id": "start",
          "status_changes": [
            {
              "attribute": "食物",
              "operation": "-",
              "value": 1,
              "min": 0
            },
            {
              "attribute": "生命值",
              "operation": "+",
              "value": 20,
              "max": 100
            }
          ],
          "effect": "你感觉好多了。"
        },
        {
          "option_id": "opt_explore",
          "option_text": "外出探索",
          "target_branch_id": "forest"
        }
      ]
    }
  ]
}
```

### 示例3：带条件和后果的完整游戏
```json
{
  "game_title": "密室逃脱",
  "description": "找到钥匙，解开谜题，逃离密室",
  "author": "示例作者",
  "tags": ["解谜", "冒险"],
  "version": 1.0,
  "branches": [
    {
      "branch_id": "room_start",
      "branch_title": "密室入口",
      "content": "你被锁在一个密室里。房间中央有一张桌子，墙上有一幅画。",
      "options": [
        {
          "option_id": "opt_search_table",
          "option_text": "搜索桌子",
          "target_branch_id": "table_searched"
        },
        {
          "option_id": "opt_look_painting",
          "option_text": "查看画作",
          "target_branch_id": "painting_inspected"
        }
      ]
    },
    {
      "branch_id": "table_searched",
      "branch_title": "桌子",
      "content": "你在桌子抽屉里发现了一把钥匙！",
      "options": [
        {
          "option_id": "opt_take_key",
          "option_text": "拾取钥匙",
          "target_branch_id": "room_start",
          "consequences": [
            {
              "type": "add_item",
              "key": "door_key",
              "value": "铜钥匙"
            },
            {
              "type": "show_message",
              "key": "key_taken",
              "value": "你获得了一把铜钥匙。"
            }
          ]
        },
        {
          "option_id": "opt_back",
          "option_text": "返回",
          "target_branch_id": "room_start"
        }
      ]
    },
    {
      "branch_id": "painting_inspected",
      "branch_title": "画作",
      "content": "画作后面有一个保险箱，需要钥匙才能打开。",
      "options": [
        {
          "option_id": "opt_unlock_box",
          "option_text": "用钥匙打开保险箱",
          "target_branch_id": "box_opened",
          "conditions": [
            {
              "type": "hasItem",
              "key": "door_key",
              "operator": "eq",
              "value": true
            }
          ]
        },
        {
          "option_id": "opt_no_key",
          "option_text": "没有钥匙，返回",
          "target_branch_id": "room_start"
        }
      ]
    },
    {
      "branch_id": "box_opened",
      "branch_title": "保险箱",
      "content": "保险箱打开了，里面有一张逃生地图！",
      "options": [
        {
          "option_id": "opt_take_map",
          "option_text": "拾取地图",
          "target_branch_id": "game_win",
          "consequences": [
            {
              "type": "add_item",
              "key": "escape_map",
              "value": "逃生地图"
            },
            {
              "type": "show_message",
              "key": "map_taken",
              "value": "你获得了逃生地图！"
            }
          ]
        }
      ]
    },
    {
      "branch_id": "game_win",
      "branch_title": "逃脱成功",
      "content": "恭喜！你成功逃离了密室！",
      "options": [
        {
          "option_id": "opt_restart",
          "option_text": "重新开始",
          "target_branch_id": "room_start",
          "status_changes": [
            {
              "attribute": "金币",
              "operation": "=",
              "value": 50
            },
            {
              "attribute": "生命值",
              "operation": "=",
              "value": 100
            }
          ],
          "effect": "游戏已重置。"
        }
      ]
    }
  ]
}
```

---

## 常见问题

### Q1: 如何让某个选项只在特定条件下显示？
**A**: 使用 `conditions` 数组。例如，只有拥有钥匙时才显示"打开门"选项：
```json
{
  "option_text": "打开门",
  "conditions": [
    {
      "type": "hasItem",
      "key": "door_key",
      "operator": "eq",
      "value": true
    }
  ]
}
```

### Q2: 如何限制数值的范围？
**A**: 使用 `min` 和 `max` 字段：
```json
{
  "attribute": "生命值",
  "operation": "+",
  "value": 20,
  "min": 0,
  "max": 100
}
```

### Q3: 如何结束游戏？
**A**: 在选项中设置 `end_game: true`：
```json
{
  "option_text": "结束游戏",
  "target_branch_id": "any_branch",
  "end_game": true
}
```

### Q4: 如何显示多个状态更新？
**A**: 使用 `status_changes` 数组，每个元素代表一个数值变更：
```json
{
  "status_changes": [
    {
      "attribute": "金币",
      "operation": "-",
      "value": 10
    },
    {
      "attribute": "好感度",
      "operation": "+",
      "value": 5
    }
  ]
}
```

### Q5: branch_id 可以重复吗？
**A**: 不可以。每个 `branch_id` 必须在 `branches` 数组中唯一。

### Q6: 如何让玩家获得物品？
**A**: 使用 `consequences` 中的 `add_item` 类型：
```json
{
  "consequences": [
    {
      "type": "add_item",
      "key": "item_id",
      "value": "物品名称"
    }
  ]
}
```

### Q7: effect 和 status_update 有什么区别？
**A**: 
- `effect`: 选择后立即显示的效果文本
- `status_update`: 选择后显示的状态更新文本

两者都会显示在游戏界面上，但语义不同。

### Q8: 如何重置游戏状态？
**A**: 使用 `=` 运算符：
```json
{
  "status_changes": [
    {
      "attribute": "金币",
      "operation": "=",
      "value": 100
    }
  ]
}
```

---

## 最佳实践

1. **命名规范**
   - `branch_id`: 使用英文小写和下划线，如 `chapter1_start`
   - `option_id`: 使用 `opt_` 前缀，如 `opt_take_item`
   - 物品ID: 使用下划线分隔，如 `engineer_keycard`

2. **状态管理**
   - 为百分比属性使用"度"或"率"后缀，自动限制在 0-100
   - 使用 `min` 和 `max` 防止数值越界
   - 在 `game_states` 中定义所有初始状态

3. **用户体验**
   - 使用 `effect` 提供即时反馈
   - 使用 `status_update` 说明状态变化
   - 使用 `consequences` 显示重要事件

4. **数据验证**
   - 确保 `target_branch_id` 对应的 `branch_id` 存在
   - 检查 `branch_id` 唯一性
   - 验证 `status_changes` 的数值类型正确

5. **内容组织**
   - 使用 `\n` 分段长文本
   - 保持每个分支内容简洁明了
   - 选项文本应该清晰描述玩家行为

# 希望号 - 深空求生 游戏修复说明

## 游戏概述

这是一个科幻悬疑探索类互动故事游戏，玩家作为「希望号」的指挥官，探索神秘的『忒修斯』科研空间站，揭开真相并做出艰难的抉择。

## 游戏文件

修复后的游戏文件位于：
```
hope_station_fixed.json
```

## 游戏结构

游戏包含以下主要分支：

1. **spaceship_bridge** - 「希望号」舰桥（起始点）
2. **medical_bay** - 医疗舱
3. **cargo_bay** - 货运舱
4. **engineering_bay** - 工程核心
5. **space_station_docking** - 「忒修斯」站对接舱
6. **space_station_vent** - 维修管道
7. **space_station_core** - 主控室
8. **power_core_chamber** - 能源舱

## 游戏特色

### 物品系统
- **纳米急救喷雾** - 在医疗舱拾取
- **残缺的日志页** - 在医疗舱拾取
- **工程师权限卡** - 在货运舱拾取
- **切割火炬** - 在货运舱拾取
- **反应堆状态报告** - 在工程核心拾取
- **研究员的身份牌** - 在维修管道拾取
- **未污染的能量核心** - 在能源舱拾取

### 条件系统
- 某些选项需要特定物品才能解锁
- 例如：进入工程核心需要工程师权限卡
- 例如：使用主控台覆写接口需要研究员身份牌

### 后果系统
- **add_item** - 添加物品到背包
- **show_message** - 显示消息
- **end_game** - 结束游戏

### 结局分支

1. **可理解的溃逃** - 早期撤退，活下来但噩梦常伴
2. **悲悯的焚化** - 启动净化协议，终结痛苦也抹去一切
3. **英勇的疯狂** - 用切割火炬殊死一搏，赢得胜利但飞船伤痕累累

## 导入游戏

### 方法1：使用游戏库导入

1. 打开游戏库页面
2. 点击「导入游戏」按钮
3. 选择 `hope_station_fixed.json` 文件
4. 等待导入完成

### 方法2：使用浏览器控制台导入

1. 打开浏览器控制台（F12）
2. 复制并运行以下代码：

```javascript
fetch('/hope_station_fixed.json')
  .then(response => response.json())
  .then(gameData => {
    console.log('游戏数据:', gameData);
    
    // 创建游戏数据
    const gameIndex = {
      id: 'hope_station_default',
      title: gameData.game_title,
      description: gameData.description,
      priority: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    // 存储到IndexedDB
    const db = new Dexie('GameLibraryDB').open();
    
    // 检查游戏是否已存在
    db.games_index.get('hope_station_default').then(existingGame => {
      if (existingGame) {
        console.log('游戏已存在，更新数据');
        db.games_index.update('hope_station_default', {
          title: gameData.game_title,
          description: gameData.description,
          updatedAt: new Date().toISOString()
        });
        db.games_data.update('hope_station_default', {
          data: gameData,
          updatedAt: new Date().toISOString()
        });
      } else {
        console.log('创建新游戏');
        db.games_index.add(gameIndex);
        db.games_data.add({
          id: 'hope_station_default',
          data: gameData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    // 设置为默认游戏
    localStorage.setItem('defaultGameId', 'hope_station_default');
    
    console.log('✅ 游戏导入成功并设置为默认游戏');
    alert('游戏导入成功并设置为默认游戏！');
  });
```

### 方法3：使用导入脚本

1. 将 `hope_station_fixed.json` 文件复制到项目的 `public` 目录
2. 在浏览器中访问 `http://localhost:3000/import-default-game.js`
3. 脚本会自动导入游戏并设置为默认游戏

## 开始游戏

### 自动开始（推荐）

1. 游戏导入后，会自动设置为默认游戏
2. 点击首页的「开始游戏」按钮
3. 系统会自动加载默认游戏
4. 从「希望号」舰桥开始游戏

### 手动开始

1. 打开游戏库页面
2. 找到「希望号 - 深空求生」游戏
3. 点击「开始游戏」按钮
4. 游戏引擎会加载游戏数据
5. 从第一个分支开始游戏

## 游戏玩法

### 基本操作
- 阅读当前分支的内容
- 查看可用的选项
- 点击选项进行选择
- 根据选择跳转到不同的分支

### 物品管理
- 拾取物品会自动添加到背包
- 某些选项需要特定物品才能解锁
- 物品可以在后续分支中使用

### 条件判断
- 系统会检查是否满足选项的条件
- 如果不满足条件，选项将不可用
- 满足条件后，选项变为可用

### 结局
- 游戏有多个可能的结局
- 不同的选择会导致不同的结局
- 尝试探索所有可能的结局

## 游戏数据结构

```json
{
  "game_title": "游戏标题",
  "description": "游戏描述",
  "author": "作者",
  "tags": ["标签1", "标签2"],
  "version": 1.0,
  "background_image": "",
  "background_asset_id": "",
  "branches": [
    {
      "branch_id": "分支ID",
      "branch_title": "分支标题",
      "content": "分支内容",
      "options": [
        {
          "option_id": "选项ID",
          "option_text": "选项文本",
          "target_branch_id": "目标分支ID",
          "conditions": [
            {
              "type": "hasItem",
              "key": "物品名称",
              "operator": "eq",
              "value": true
            }
          ],
          "consequences": [
            {
              "type": "add_item",
              "key": "物品名称",
              "value": "物品描述"
            },
            {
              "type": "show_message",
              "key": "消息键",
              "value": "消息内容"
            },
            {
              "type": "end_game",
              "key": "结局键",
              "value": "结局描述"
            }
          ]
        }
      ]
    }
  ]
}
```

## 故事流程

### 路线1：谨慎探索
1. 舰桥 → 医疗舱（拾取物品）→ 货运舱（拾取物品）→ 工程核心（使用权限卡）→ 空间站对接舱 → 主控室 → 能源舱（拾取核心）→ 主控室（启动净化）→ 结局：悲悯的焚化

### 路线2：潜行突入
1. 舰桥 → 货运舱（拾取物品）→ 空间站对接舱 → 维修管道（使用火炬）→ 主控室 → 能源舱（拾取核心）→ 主控室（启动净化）→ 结局：悲悯的焚化

### 路线3：英勇战斗
1. 舰桥 → 货运舱（拾取物品）→ 空间站对接舱 → 主控室 → 能源舱（拾取核心）→ 能源舱（使用火炬战斗）→ 结局：英勇的疯狂

### 路线4：早期撤退
1. 舰桥 → 空间站对接舱 → 紧急返回希望号 → 结局：可理解的溃逃

## 开发者信息

### 游戏引擎兼容性
- ✅ 支持最新的游戏数据结构
- ✅ 支持条件系统
- ✅ 支持后果系统
- ✅ 支持物品系统
- ✅ 支持多结局

### 技术细节
- 使用 `branches` 而不是 `branchs`
- 使用 `branch_id` 而不是 `id`
- 使用 `option_id` 而不是 `id`
- 使用 `target_branch_id` 而不是 `next_branch_id`
- 支持嵌套的条件和后果数组

## 故障排除

### 问题：游戏无法加载
**解决方案**：
1. 检查JSON文件格式是否正确
2. 检查浏览器控制台是否有错误
3. 清除浏览器缓存
4. 重新导入游戏

### 问题：选项无法点击
**解决方案**：
1. 检查是否满足选项的条件
2. 检查是否已经拾取了所需的物品
3. 查看游戏数据结构是否正确

### 问题：游戏无法结束
**解决方案**：
1. 检查是否触发了结局分支
2. 检查后果系统中是否包含 `end_game` 类型
3. 查看控制台是否有错误信息

## 更新日志

### v1.0 (2026-01-11)
- ✅ 修复游戏数据结构
- ✅ 更新为最新的游戏引擎格式
- ✅ 添加完整的物品系统
- ✅ 添加条件系统
- ✅ 添加后果系统
- ✅ 添加多结局支持
- ✅ 修复所有语法错误
- ✅ 确保可以正常导入和游玩

## 联系方式

如有问题，请联系：
- 邮箱：support@yourdomain.com
- GitHub Issues：https://github.com/your-repo/issues

---

**最后更新**: 2026-01-11

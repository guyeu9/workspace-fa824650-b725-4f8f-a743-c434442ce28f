import { GameStore, GameDatabase, db } from '../lib/game-store';
import { ImageHostingService } from '../lib/image-hosting-service';

describe('游戏存储逻辑测试', () => {
  let gameStore: GameStore;

  beforeEach(async () => {
    gameStore = GameStore.getInstance();
    await db.games_index.clear();
    await db.games_data.clear();
    await db.assets.clear();
  });

  afterEach(async () => {
    await db.games_index.clear();
    await db.games_data.clear();
    await db.assets.clear();
  });

  describe('游戏创建测试', () => {
    it('应该成功创建基本游戏', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '这是第一个场景',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      expect(gameIndex).toBeDefined();
      expect(gameIndex.id).toBeDefined();
      expect(gameIndex.title).toBe(title);
      expect(gameIndex.priority).toBe(0);
      expect(gameIndex.version).toBe(1);
      expect(gameIndex.createdAt).toBeDefined();
      expect(gameIndex.updatedAt).toBeDefined();
    });

    it('应该成功创建带选项的游戏', async () => {
      const title = '带选项的游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '这是第一个场景',
            choices: [
              {
                id: 'choice-1',
                choice: '选项1',
                next_branch: 'branch-2'
              },
              {
                id: 'choice-2',
                choice: '选项2',
                next_branch: 'branch-3'
              }
            ]
          },
          {
            branch_id: 'branch-2',
            chapter: '第二章',
            scene_detail: '这是第二个场景',
            choices: []
          },
          {
            branch_id: 'branch-3',
            chapter: '第三章',
            scene_detail: '这是第三个场景',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);
      const gameData = await db.games_data.get(gameIndex.id);

      expect(gameIndex).toBeDefined();
      expect(gameData).toBeDefined();
      expect(gameData?.data.branches).toHaveLength(3);
      expect(gameData?.data.branches[0].choices).toHaveLength(2);
    });

    it('应该支持创建带自定义选项的游戏', async () => {
      const title = '自定义选项游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '选择A',
                next_branch: 'branch-2',
                effect: '增加生命值',
                status_update: '获得物品'
              },
              {
                id: 'choice-2',
                choice: '选择B',
                next_branch: 'branch-3',
                end_game: true
              }
            ]
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);
      const gameData = await db.games_data.get(gameIndex.id);

      expect(gameData?.data.branches[0].choices[0].effect).toBe('增加生命值');
      expect(gameData?.data.branches[0].choices[0].status_update).toBe('获得物品');
      expect(gameData?.data.branches[0].choices[1].end_game).toBe(true);
    });

    it('应该支持创建带图片背景的游戏', async () => {
      const title = '带背景图的游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            background_image: 'https://example.com/image.jpg',
            choices: []
          }
        ]
      };

      jest.spyOn(ImageHostingService.prototype, 'uploadImage').mockResolvedValueOnce({
        success: true,
        url: 'https://example.com/image.jpg',
        cached: false
      });

      const gameIndex = await gameStore.createGame(title, data, {
        backgroundAssetId: 'https://example.com/image.jpg'
      });

      expect(gameIndex.backgroundAssetId).toBe('https://example.com/image.jpg');
    });

    it('应该支持创建带标签的游戏', async () => {
      const title = '带标签的游戏';
      const data = {
        game_title: title,
        branches: []
      };

      const gameIndex = await gameStore.createGame(title, data, {
        tags: ['冒险', '解谜', '恐怖'],
        author: '测试作者'
      });

      expect(gameIndex.tags).toEqual(['冒险', '解谜', '恐怖']);
      expect(gameIndex.author).toBe('测试作者');
    });

    it('应该拒绝空标题的游戏', async () => {
      const title = '';
      const data = {
        game_title: title,
        branches: []
      };

      await expect(gameStore.createGame(title, data)).rejects.toThrow();
    });
  });

  describe('游戏列表查询测试', () => {
    beforeEach(async () => {
      await gameStore.createGame('游戏1', { game_title: '游戏1', branches: [] }, { priority: 1 });
      await gameStore.createGame('游戏2', { game_title: '游戏2', branches: [] }, { priority: 3 });
      await gameStore.createGame('游戏3', { game_title: '游戏3', branches: [] }, { priority: 2 });
    });

    it('应该按优先级降序返回游戏列表', async () => {
      const games = await gameStore.listGames();

      expect(games).toHaveLength(3);
      expect(games[0].title).toBe('游戏2');
      expect(games[1].title).toBe('游戏3');
      expect(games[2].title).toBe('游戏1');
    });

    it('应该支持分页查询', async () => {
      const games = await gameStore.listGames(2, 0);

      expect(games).toHaveLength(2);
      expect(games[0].title).toBe('游戏2');
      expect(games[1].title).toBe('游戏3');

      const games2 = await gameStore.listGames(2, 2);
      expect(games2).toHaveLength(1);
      expect(games2[0].title).toBe('游戏1');
    });

    it('应该支持限制返回数量', async () => {
      const games = await gameStore.listGames(2);

      expect(games).toHaveLength(2);
    });
  });

  describe('游戏详情查询测试', () => {
    it('应该成功获取游戏详情', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);
      const game = await gameStore.getGame(gameIndex.id);

      expect(game).not.toBeNull();
      expect(game?.index.title).toBe(title);
      expect(game?.data.data.branches).toHaveLength(1);
    });

    it('应该返回null对于不存在的游戏', async () => {
      const game = await gameStore.getGame('non-existent-id');

      expect(game).toBeNull();
    });
  });

  describe('游戏更新测试', () => {
    it('应该成功更新游戏标题', async () => {
      const title = '原始标题';
      const data = { game_title: title, branches: [] };
      const gameIndex = await gameStore.createGame(title, data);

      await gameStore.updateGame(gameIndex.id, { title: '新标题' });

      const updatedGame = await db.games_index.get(gameIndex.id);
      expect(updatedGame?.title).toBe('新标题');
    });

    it('应该成功更新游戏数据', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };
      const gameIndex = await gameStore.createGame(title, data);

      const newData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '更新的场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '新选项',
                next_branch: 'branch-2'
              }
            ]
          },
          {
            branch_id: 'branch-2',
            chapter: '第二章',
            scene_detail: '新场景',
            choices: []
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: newData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches).toHaveLength(2);
      expect(gameData?.data.branches[0].scene_detail).toBe('更新的场景描述');
    });

    it('应该成功更新游戏优先级', async () => {
      const title = '测试游戏';
      const data = { game_title: title, branches: [] };
      const gameIndex = await gameStore.createGame(title, data, { priority: 1 });

      await gameStore.updateGamePriority(gameIndex.id, 10);

      const updatedGame = await db.games_index.get(gameIndex.id);
      expect(updatedGame?.priority).toBe(10);
    });

    it('应该同时更新索引和数据', async () => {
      const title = '测试游戏';
      const data = { game_title: title, branches: [] };
      const gameIndex = await gameStore.createGame(title, data);

      await gameStore.updateGame(gameIndex.id, {
        title: '新标题',
        description: '新描述',
        data: { game_title: '新标题', branches: [] }
      });

      const updatedIndex = await db.games_index.get(gameIndex.id);
      const updatedData = await db.games_data.get(gameIndex.id);

      expect(updatedIndex?.title).toBe('新标题');
      expect(updatedIndex?.description).toBe('新描述');
      expect(updatedData?.data.game_title).toBe('新标题');
    });
  });

  describe('游戏删除测试', () => {
    it('应该成功删除单个游戏', async () => {
      const title = '测试游戏';
      const data = { game_title: title, branches: [] };
      const gameIndex = await gameStore.createGame(title, data);

      await gameStore.deleteGame(gameIndex.id);

      const indexExists = await db.games_index.get(gameIndex.id);
      const dataExists = await db.games_data.get(gameIndex.id);

      expect(indexExists).toBeUndefined();
      expect(dataExists).toBeUndefined();
    });

    it('应该成功批量删除游戏', async () => {
      const game1 = await gameStore.createGame('游戏1', { game_title: '游戏1', branches: [] });
      const game2 = await gameStore.createGame('游戏2', { game_title: '游戏2', branches: [] });
      const game3 = await gameStore.createGame('游戏3', { game_title: '游戏3', branches: [] });

      await gameStore.deleteGames([game1.id, game2.id]);

      const game1Exists = await db.games_index.get(game1.id);
      const game2Exists = await db.games_index.get(game2.id);
      const game3Exists = await db.games_index.get(game3.id);

      expect(game1Exists).toBeUndefined();
      expect(game2Exists).toBeUndefined();
      expect(game3Exists).toBeDefined();
    });
  });

  describe('资产存储测试', () => {
    it('应该成功上传图片到图床', async () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      
      jest.spyOn(ImageHostingService.prototype, 'uploadImage').mockResolvedValueOnce({
        success: true,
        url: 'https://example.com/image.jpg',
        cached: false
      });

      const assetId = await gameStore.storeAsset(blob, 'test.jpg', 'image');

      expect(assetId).toBe('https://example.com/image.jpg');
    });

    it('应该成功存储音频资产', async () => {
      const blob = new Blob(['test'], { type: 'audio/mp3' });
      
      const assetId = await gameStore.storeAsset(blob, 'test.mp3', 'audio');

      expect(assetId).toBeDefined();
      expect(assetId).toMatch(/^[0-9]+-[a-z0-9]+$/);
    });

    it('应该成功存储视频资产', async () => {
      const blob = new Blob(['test'], { type: 'video/mp4' });
      
      const assetId = await gameStore.storeAsset(blob, 'test.mp4', 'video');

      expect(assetId).toBeDefined();
      expect(assetId).toMatch(/^[0-9]+-[a-z0-9]+$/);
    });

    it('应该成功获取资产', async () => {
      const blob = new Blob(['test'], { type: 'audio/mp3' });
      const assetId = await gameStore.storeAsset(blob, 'test.mp3', 'audio');

      const asset = await gameStore.getAsset(assetId);

      expect(asset).toBeDefined();
      if (typeof asset !== 'string') {
        expect(asset.id).toBe(assetId);
        expect(asset.type).toBe('audio');
      }
    });

    it('应该直接返回URL对于外部图片', async () => {
      const url = 'https://example.com/image.jpg';
      const asset = await gameStore.getAsset(url);

      expect(asset).toBe(url);
    });

    it('应该成功删除资产', async () => {
      const blob = new Blob(['test'], { type: 'audio/mp3' });
      const assetId = await gameStore.storeAsset(blob, 'test.mp3', 'audio');

      await gameStore.deleteAsset(assetId);

      const asset = await db.assets.get(assetId);
      expect(asset).toBeUndefined();
    });
  });

  describe('游戏数据验证测试', () => {
    it('应该验证有效的游戏数据', () => {
      const data = {
        game_title: '测试游戏',
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝空数据', () => {
      const result = gameStore.validateGameData(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('游戏数据不能为空');
    });

    it('应该拒绝缺少标题的游戏', () => {
      const data = {
        branches: []
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少游戏标题');
    });

    it('应该拒绝缺少分支的游戏', () => {
      const data = {
        game_title: '测试游戏'
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少游戏分支或场景数据');
    });

    it('应该拒绝分支不是数组的情况', () => {
      const data = {
        game_title: '测试游戏',
        branches: 'not an array'
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('branches必须是数组');
    });

    it('应该警告空分支数组', () => {
      const data = {
        game_title: '测试游戏',
        branches: []
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('游戏没有任何分支');
    });

    it('应该拒绝缺少branch_id的分支', () => {
      const data = {
        game_title: '测试游戏',
        branches: [
          {
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分支 1 缺少branch_id');
    });

    it('应该拒绝缺少章节标题和场景描述的分支', () => {
      const data = {
        game_title: '测试游戏',
        branches: [
          {
            branch_id: 'branch-1',
            choices: []
          }
        ]
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分支 branch-1 缺少章节标题或场景描述');
    });

    it('应该验证场景数据', () => {
      const data = {
        game_title: '测试游戏',
        scenes: {
          'scene-1': {
            description: '场景描述'
          }
        }
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(true);
    });

    it('应该拒绝scenes不是对象的情况', () => {
      const data = {
        game_title: '测试游戏',
        scenes: 'not an object'
      };

      const result = gameStore.validateGameData(data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('scenes必须是对象');
    });
  });

  describe('游戏导入测试', () => {
    it('应该成功导入JSON游戏文件', async () => {
      const jsonContent = JSON.stringify({
        game_title: '导入的游戏',
        description: '游戏描述',
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      });

      const file = new File([jsonContent], 'game.json', { type: 'application/json' });
      const result = await gameStore.importGamePack(file);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝无效的JSON文件', async () => {
      const file = new File(['invalid json'], 'game.json', { type: 'application/json' });
      const result = await gameStore.importGamePack(file);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该拒绝不支持的文件格式', async () => {
      const file = new File(['test'], 'game.txt', { type: 'text/plain' });
      const result = await gameStore.importGamePack(file);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('不支持的文件格式');
    });

    it('应该导入ZIP文件中的多个游戏', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file('game1.json', JSON.stringify({
        game_title: '游戏1',
        branches: []
      }));

      zip.file('game2.json', JSON.stringify({
        game_title: '游戏2',
        branches: []
      }));

      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'games.zip', { type: 'application/zip' });

      const result = await gameStore.importGamePack(file);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });

    it('应该处理导入中的错误并继续', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file('valid.json', JSON.stringify({
        game_title: '有效游戏',
        branches: []
      }));

      zip.file('invalid.json', 'invalid json content');

      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'games.zip', { type: 'application/zip' });

      const result = await gameStore.importGamePack(file);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('分支和选项管理测试', () => {
    it('应该支持添加新分支', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      const updatedData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          },
          {
            branch_id: 'branch-2',
            chapter: '第二章',
            scene_detail: '新场景',
            choices: []
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: updatedData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches).toHaveLength(2);
    });

    it('应该支持删除分支', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          },
          {
            branch_id: 'branch-2',
            chapter: '第二章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      const updatedData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: updatedData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches).toHaveLength(1);
      expect(gameData?.data.branches[0].branch_id).toBe('branch-1');
    });

    it('应该支持添加选项', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: []
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      const updatedData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '选项1',
                next_branch: 'branch-2'
              }
            ]
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: updatedData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches[0].choices).toHaveLength(1);
    });

    it('应该支持删除选项', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '选项1',
                next_branch: 'branch-2'
              },
              {
                id: 'choice-2',
                choice: '选项2',
                next_branch: 'branch-3'
              }
            ]
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      const updatedData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '选项1',
                next_branch: 'branch-2'
              }
            ]
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: updatedData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches[0].choices).toHaveLength(1);
    });

    it('应该支持更新选项', async () => {
      const title = '测试游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '原始选项',
                next_branch: 'branch-2'
              }
            ]
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);

      const updatedData = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices: [
              {
                id: 'choice-1',
                choice: '更新后的选项',
                next_branch: 'branch-2'
              }
            ]
          }
        ]
      };

      await gameStore.updateGame(gameIndex.id, { data: updatedData });

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches[0].choices[0].choice).toBe('更新后的选项');
    });

    it('应该支持批量操作', async () => {
      const games = await Promise.all(
        Array(10).fill(null).map((_, i) =>
          gameStore.createGame(`游戏${i}`, { game_title: `游戏${i}`, branches: [] })
        )
      );

      await gameStore.deleteGames(games.map(g => g.id));

      for (const game of games) {
        const exists = await db.games_index.get(game.id);
        expect(exists).toBeUndefined();
      }
    });
  });

  describe('边界情况测试', () => {
    it('应该处理超长标题', async () => {
      const longTitle = 'a'.repeat(1000);
      const data = { game_title: longTitle, branches: [] };

      const gameIndex = await gameStore.createGame(longTitle, data);

      expect(gameIndex.title).toBe(longTitle);
    });

    it('应该处理大量分支', async () => {
      const branches = Array(100).fill(null).map((_, i) => ({
        branch_id: `branch-${i}`,
        chapter: `章节${i}`,
        scene_detail: `场景${i}`,
        choices: []
      }));

      const data = { game_title: '大量分支游戏', branches };
      const gameIndex = await gameStore.createGame('大量分支游戏', data);

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches).toHaveLength(100);
    });

    it('应该处理大量选项', async () => {
      const choices = Array(50).fill(null).map((_, i) => ({
        id: `choice-${i}`,
        choice: `选项${i}`,
        next_branch: `branch-${i + 1}`
      }));

      const data = {
        game_title: '大量选项游戏',
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章',
            scene_detail: '场景描述',
            choices
          }
        ]
      };

      const gameIndex = await gameStore.createGame('大量选项游戏', data);

      const gameData = await db.games_data.get(gameIndex.id);
      expect(gameData?.data.branches[0].choices).toHaveLength(50);
    });

    it('应该处理特殊字符', async () => {
      const title = '测试<>&"\'游戏';
      const data = {
        game_title: title,
        branches: [
          {
            branch_id: 'branch-1',
            chapter: '第一章<script>alert(1)</script>',
            scene_detail: '场景描述&特殊字符',
            choices: [
              {
                id: 'choice-1',
                choice: '选项<>&"\'',
                next_branch: 'branch-2'
              }
            ]
          }
        ]
      };

      const gameIndex = await gameStore.createGame(title, data);
      const gameData = await db.games_data.get(gameIndex.id);

      expect(gameData?.data.branches[0].chapter).toContain('<script>');
      expect(gameData?.data.branches[0].choices[0].choice).toContain('<>&"\'');
    });
  });
});

import Dexie, { Table } from 'dexie';

// 游戏元数据接口
export interface GameIndexItem {
  id: string;
  title: string;
  description?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  thumbnailAssetId?: string;
  backgroundAssetId?: string;
  tags?: string[];
  author?: string;
}

// 游戏数据接口
export interface GameDataItem {
  id: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

// 资产数据接口
export interface AssetItem {
  id: string;
  blob: Blob;
  type: 'image' | 'audio' | 'video';
  name: string;
  size: number;
  createdAt: string;
}

// 游戏包导入结果
export interface ImportResult {
  success: boolean;
  count: number;
  errors: string[];
  warnings: string[];
}

// 游戏数据验证结果
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Dexie数据库类
export class GameDatabase extends Dexie {
  games_index!: Table<GameIndexItem>;
  games_data!: Table<GameDataItem>;
  assets!: Table<AssetItem>;

  constructor() {
    super('GameDatabase');
    this.version(1).stores({
      games_index: 'id, title, priority, createdAt, updatedAt, version',
      games_data: 'id, createdAt, updatedAt',
      assets: 'id, type, name, createdAt'
    });
  }
}

// 创建数据库实例
export const db = new GameDatabase();

// 游戏存储管理类
export class GameStore {
  private static instance: GameStore;

  static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }

  // 创建新游戏
  async createGame(title: string, data: any, options?: {
    description?: string;
    priority?: number;
    thumbnailAssetId?: string;
    backgroundAssetId?: string;
    tags?: string[];
    author?: string;
  }): Promise<GameIndexItem> {
    const now = new Date().toISOString();
    const gameId = this.generateId();

    const gameIndex: GameIndexItem = {
      id: gameId,
      title,
      description: options?.description || '',
      priority: options?.priority || 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
      thumbnailAssetId: options?.thumbnailAssetId,
      backgroundAssetId: options?.backgroundAssetId,
      tags: options?.tags || [],
      author: options?.author || 'Unknown'
    };

    const gameData: GameDataItem = {
      id: gameId,
      data,
      createdAt: now,
      updatedAt: now
    };

    // 并行写入索引和数据
    await Promise.all([
      db.games_index.add(gameIndex),
      db.games_data.add(gameData)
    ]);

    return gameIndex;
  }

  // 获取游戏列表
  async listGames(limit?: number, offset?: number): Promise<GameIndexItem[]> {
    let query = db.games_index.orderBy('priority').reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    return await query.toArray();
  }

  // 获取游戏详情
  async getGame(id: string): Promise<{ index: GameIndexItem; data: GameDataItem } | null> {
    const [index, data] = await Promise.all([
      db.games_index.get(id),
      db.games_data.get(id)
    ]);

    if (!index || !data) return null;
    return { index, data };
  }

  // 更新游戏
  async updateGame(id: string, updates: Partial<GameIndexItem> & { data?: any }): Promise<void> {
    const now = new Date().toISOString();
    
    // 更新索引
    if (Object.keys(updates).length > 1 || updates.data === undefined) {
      const indexUpdates = { ...updates } as Partial<GameIndexItem>;
      delete (indexUpdates as any).data;
      
      await db.games_index.update(id, {
        ...indexUpdates,
        updatedAt: now
      });
    }

    // 更新数据
    if (updates.data !== undefined) {
      await db.games_data.update(id, {
        data: updates.data,
        updatedAt: now
      });
    }
  }

  // 删除游戏
  async deleteGame(id: string): Promise<void> {
    await Promise.all([
      db.games_index.delete(id),
      db.games_data.delete(id)
    ]);
  }

  // 批量删除游戏
  async deleteGames(ids: string[]): Promise<void> {
    await Promise.all([
      db.games_index.bulkDelete(ids),
      db.games_data.bulkDelete(ids)
    ]);
  }

  // 更新游戏优先级
  async updateGamePriority(id: string, priority: number): Promise<void> {
    await this.updateGame(id, { priority });
  }

  // 存储资产
  async storeAsset(blob: Blob, name: string, type: 'image' | 'audio' | 'video'): Promise<string> {
    const assetId = this.generateId();
    const now = new Date().toISOString();

    const asset: AssetItem = {
      id: assetId,
      blob,
      type,
      name,
      size: blob.size,
      createdAt: now
    };

    await db.assets.add(asset);
    return assetId;
  }

  // 获取资产
  async getAsset(id: string): Promise<AssetItem | undefined> {
    return await db.assets.get(id);
  }

  // 删除资产
  async deleteAsset(id: string): Promise<void> {
    await db.assets.delete(id);
  }

  // 验证游戏数据
  validateGameData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('游戏数据不能为空');
      return { valid: false, errors, warnings };
    }

    // 基本结构验证
    if (!data.game_title && !data.title) {
      errors.push('缺少游戏标题');
    }

    if (!data.branches && !data.scenes) {
      errors.push('缺少游戏分支或场景数据');
    }

    // 分支验证
    if (data.branches) {
      if (!Array.isArray(data.branches)) {
        errors.push('branches必须是数组');
      } else if (data.branches.length === 0) {
        warnings.push('游戏没有任何分支');
      } else {
        // 验证每个分支
        data.branches.forEach((branch: any, index: number) => {
          if (!branch.branch_id) {
            errors.push(`分支 ${index + 1} 缺少branch_id`);
          }
          if (!branch.chapter && !branch.scene_detail) {
            errors.push(`分支 ${branch.branch_id || index + 1} 缺少章节标题或场景描述`);
          }
        });
      }
    }

    // 场景验证
    if (data.scenes) {
      if (typeof data.scenes !== 'object') {
        errors.push('scenes必须是对象');
      } else if (Object.keys(data.scenes).length === 0) {
        warnings.push('游戏没有任何场景');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 导入游戏包
  async importGamePack(file: File): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;

    try {
      let content: string;
      
      if (file.name.endsWith('.zip')) {
        // TODO: 实现ZIP文件解压逻辑
        errors.push('ZIP文件导入功能暂未实现');
        return { success: false, count: 0, errors, warnings };
      } else if (file.name.endsWith('.json')) {
        content = await file.text();
      } else {
        errors.push('不支持的文件格式');
        return { success: false, count: 0, errors, warnings };
      }

      const data = JSON.parse(content);
      
      // 验证游戏数据
      const validation = this.validateGameData(data);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return { success: false, count: 0, errors, warnings };
      }

      warnings.push(...validation.warnings);

      // 创建游戏
      const gameIndex = await this.createGame(
        data.game_title || data.title || '未命名游戏',
        data,
        {
          description: data.description,
          author: data.author,
          tags: data.tags || []
        }
      );

      count = 1;
      return { success: true, count, errors, warnings };

    } catch (error) {
      errors.push(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return { success: false, count: 0, errors, warnings };
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // 清理过期数据
  async cleanup(): Promise<void> {
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 清理30天前的临时数据
    const oldAssets = await db.assets
      .where('createdAt')
      .below(thirtyDaysAgo)
      .toArray();

    if (oldAssets.length > 0) {
      await db.assets.bulkDelete(oldAssets.map(a => a.id));
    }
  }
}

// 导出单例实例
export const gameStore = GameStore.getInstance();
import JSZip from 'jszip';
import { gameStore, ImportResult, ValidationResult } from './game-store';
import { ImageUrlValidator } from './image-url-validator';

// 游戏数据验证器
export class GameDataValidator {
  // 验证游戏数据完整性
  static validateGameData(data: any): ValidationResult {
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

    // 验证图片URL
    const imageUrls = ImageUrlValidator.extractImageUrls(data);
    imageUrls.forEach(url => {
      const validation = ImageUrlValidator.validateUrl(url);
      if (!validation.valid) {
        errors.push(`无效的图片URL: ${url} - ${validation.error}`);
      }
    });

    // 分支验证
    if (data.branches) {
      if (!Array.isArray(data.branches)) {
        errors.push('branches必须是数组');
      } else if (data.branches.length === 0) {
        warnings.push('游戏没有任何分支');
      } else {
        // 验证每个分支
        const branchIds = new Set<string>();
        data.branches.forEach((branch: any, index: number) => {
          if (!branch.branch_id) {
            errors.push(`分支 ${index + 1} 缺少branch_id`);
          } else if (branchIds.has(branch.branch_id)) {
            errors.push(`分支ID重复: ${branch.branch_id}`);
          } else {
            branchIds.add(branch.branch_id);
          }

          // 验证分支内容
          if (!branch.chapter) {
            errors.push(`分支 ${branch.branch_id || index + 1} 缺少chapter字段`);
          }
          if (!branch.scene_detail) {
            errors.push(`分支 ${branch.branch_id || index + 1} 缺少scene_detail字段`);
          }

          // 验证选择项
          if (Array.isArray(branch.choices)) {
            branch.choices.forEach((choice: any, choiceIndex: number) => {
              if (!choice.id) {
                errors.push(`分支 ${branch.branch_id} 的选择项 ${choiceIndex + 1} 缺少id字段`);
              }
              if (!choice.target) {
                errors.push(`分支 ${branch.branch_id} 的选择项 ${choiceIndex + 1} 缺少target字段`);
              }
            });
          }
        });

        // 验证分支连接性
        const connections = this.validateBranchConnections(data.branches);
        if (!connections.connected) {
          errors.push(...connections.errors);
        }
        if (connections.warnings.length > 0) {
          warnings.push(...connections.warnings);
        }
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

  // 验证分支连接性
  private static validateBranchConnections(branches: any[]): { connected: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const branchIds = new Set(branches.map(b => b.branch_id));
    const referencedBranches = new Set<string>();
    const startBranch = branches[0]?.branch_id;

    // 收集所有被引用的分支
    branches.forEach(branch => {
      if (branch.choices && Array.isArray(branch.choices)) {
        branch.choices.forEach((choice: any) => {
          if (choice.next_branch) {
            referencedBranches.add(choice.next_branch);
          }
        });
      }
    });

    // 检查孤立分支
    const orphanedBranches = new Set<string>();
    branchIds.forEach(id => {
      if (id !== startBranch && !referencedBranches.has(id)) {
        orphanedBranches.add(id);
      }
    });

    if (orphanedBranches.size > 0) {
      warnings.push(`发现孤立分支: ${Array.from(orphanedBranches).join(', ')}`);
    }

    // 检查引用不存在的分支
    const missingBranches = new Set<string>();
    referencedBranches.forEach(id => {
      if (!branchIds.has(id)) {
        missingBranches.add(id);
      }
    });

    if (missingBranches.size > 0) {
      errors.push(`引用了不存在的分支: ${Array.from(missingBranches).join(', ')}`);
    }

    return {
      connected: errors.length === 0,
      errors,
      warnings
    };
  }

  // 提取缩略图
  static extractThumbnail(data: any): string | null {
    const possibleFields = [
      'thumbnail',
      'cover_image',
      'background_image',
      'image',
      'img',
      'icon'
    ];

    for (const field of possibleFields) {
      if (data[field]) {
        const value = data[field];
        if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
          return value;
        }
        return value;
      }
    }

    if (data.branches && data.branches.length > 0) {
      const firstBranch = data.branches[0];
      for (const field of possibleFields) {
        if (firstBranch[field]) {
          const value = firstBranch[field];
          if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
            return value;
          }
          return value;
        }
      }
    }

    return null;
  }

  // 提取元数据
  static extractMetadata(data: any): {
    title: string;
    description: string;
    author: string;
    tags: string[];
    thumbnail?: string;
  } {
    return {
      title: data.game_title || data.title || '未命名游戏',
      description: data.description || data.game_description || '',
      author: data.author || data.creator || 'Unknown',
      tags: data.tags || data.categories || [],
      thumbnail: this.extractThumbnail(data)
    };
  }
}

// 游戏包导入器
export class GamePackImporter {
  // 导入JSON文件
  static async importJsonFile(file: File): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      
      // 验证游戏数据
      const validation = GameDataValidator.validateGameData(data);
      if (!validation.valid) {
        errors.push(...validation.errors);
        return { success: false, count: 0, errors, warnings };
      }

      warnings.push(...validation.warnings);

      // 提取元数据
      const metadata = GameDataValidator.extractMetadata(data);

      // 创建游戏
      await gameStore.createGame(
        metadata.title,
        data,
        {
          description: metadata.description,
          author: metadata.author,
          tags: metadata.tags
        }
      );

      count = 1;
      return { success: true, count, errors, warnings };

    } catch (error) {
      errors.push(`JSON导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return { success: false, count: 0, errors, warnings };
    }
  }

  // 导入ZIP文件
  static async importZipFile(file: File): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const jsonFiles: JSZip.JSZipObject[] = [];
      const assetFiles: Map<string, JSZip.JSZipObject> = new Map();

      // 分类文件
      contents.forEach((relativePath, zipEntry) => {
        if (zipEntry.name.endsWith('.json')) {
          jsonFiles.push(zipEntry);
        } else if (/\.(jpg|jpeg|png|gif|webp|svg|mp3|wav|ogg)$/i.test(zipEntry.name)) {
          assetFiles.set(zipEntry.name, zipEntry);
        }
      });

      if (jsonFiles.length === 0) {
        errors.push('ZIP文件中没有找到JSON文件');
        return { success: false, count: 0, errors, warnings };
      }

      // 处理每个JSON文件
      for (const jsonFile of jsonFiles) {
        try {
          const content = await jsonFile.async('string');
          const data = JSON.parse(content);
          
          // 验证游戏数据
          const validation = GameDataValidator.validateGameData(data);
          if (!validation.valid) {
            errors.push(`文件 ${jsonFile.name} 验证失败:`, ...validation.errors);
            continue;
          }

          warnings.push(...validation.warnings);

          // 提取元数据
          const metadata = GameDataValidator.extractMetadata(data);

          // 处理资产文件
          let thumbnailAssetId: string | undefined;
          let backgroundAssetId: string | undefined;

          if (metadata.thumbnail) {
            // 检查是否是图床URL
            if (typeof metadata.thumbnail === 'string' && 
                (metadata.thumbnail.startsWith('http://') || metadata.thumbnail.startsWith('https://'))) {
              // 直接使用图床URL
              thumbnailAssetId = metadata.thumbnail;
            } else {
              // 查找对应的资产文件
              const assetFile = assetFiles.get(metadata.thumbnail) || 
                               Array.from(assetFiles.values()).find(f => 
                                 f.name.includes(metadata.thumbnail!) || 
                                 metadata.thumbnail!.includes(f.name)
                               );
              
              if (assetFile) {
                const blob = await assetFile.async('blob');
                thumbnailAssetId = await gameStore.storeAsset(blob, assetFile.name, 'image');
              }
            }
          }

          // 创建游戏
          await gameStore.createGame(
            metadata.title,
            data,
            {
              description: metadata.description,
              author: metadata.author,
              tags: metadata.tags,
              thumbnailAssetId
            }
          );

          count++;

        } catch (error) {
          errors.push(`处理文件 ${jsonFile.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { success: count > 0, count, errors, warnings };

    } catch (error) {
      errors.push(`ZIP导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return { success: false, count: 0, errors, warnings };
    }
  }

  // 通用导入方法
  static async importGamePack(file: File): Promise<ImportResult> {
    if (file.name.endsWith('.zip')) {
      return await this.importZipFile(file);
    } else if (file.name.endsWith('.json')) {
      return await this.importJsonFile(file);
    } else {
      return {
        success: false,
        count: 0,
        errors: ['不支持的文件格式'],
        warnings: []
      };
    }
  }
}

// 导出增强的导入功能
export const enhancedGameStore = {
  ...gameStore,
  createGame: gameStore.createGame.bind(gameStore),
  importGamePack: GamePackImporter.importGamePack.bind(GamePackImporter),
  validateGameData: GameDataValidator.validateGameData.bind(GameDataValidator),
  extractMetadata: GameDataValidator.extractMetadata.bind(GameDataValidator),
  getAllGamesForBackup: gameStore.getAllGamesForBackup.bind(gameStore)
};
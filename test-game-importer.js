// 模拟文件对象
class MockFile {
  constructor(name, content) {
    this.name = name;
    this.content = content;
    this.type = 'application/json';
  }

  async text() {
    return this.content;
  }
}

// 模拟GameDataValidator
class MockGameDataValidator {
  static validateGameData(data) {
    const errors = [];
    const warnings = [];

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
        const branchIds = new Set();
        data.branches.forEach((branch, index) => {
          if (!branch.branch_id) {
            errors.push(`分支 ${index + 1} 缺少branch_id`);
          } else if (branchIds.has(branch.branch_id)) {
            errors.push(`分支ID重复: ${branch.branch_id}`);
          } else {
            branchIds.add(branch.branch_id);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static extractMetadata(data) {
    return {
      title: data.game_title || data.title || '未命名游戏',
      description: data.description || data.game_description || '',
      author: data.author || data.creator || 'Unknown',
      tags: data.tags || data.categories || [],
      thumbnail: null
    };
  }
}

// 模拟GamePackImporter
class MockGamePackImporter {
  static async importJsonFile(file) {
    const errors = [];
    const warnings = [];
    let count = 0;

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      
      console.log('📦 解析游戏数据成功');
      
      // 验证游戏数据
      const validation = MockGameDataValidator.validateGameData(data);
      if (!validation.valid) {
        errors.push(...validation.errors);
        console.error('❌ 游戏数据验证失败:', errors);
        return { success: false, count: 0, errors, warnings };
      }

      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
        console.warn('⚠️  游戏数据验证警告:', warnings);
      }

      console.log('✅ 游戏数据验证成功');

      // 提取元数据
      const metadata = MockGameDataValidator.extractMetadata(data);
      console.log('📋 提取的游戏元数据:', metadata);

      // 模拟创建游戏
      count = 1;
      console.log(`🎮 成功导入 ${count} 个游戏`);
      return { success: true, count, errors, warnings };

    } catch (error) {
      const errorMsg = `JSON导入失败: ${error instanceof Error ? error.message : '未知错误'}`;
      errors.push(errorMsg);
      console.error('❌ 导入过程中发生错误:', errorMsg);
      return { success: false, count: 0, errors, warnings };
    }
  }

  static async importGamePack(file) {
    if (file.name.endsWith('.json')) {
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

// 测试我们生成的游戏JSON文件
const fs = require('fs');
const path = require('path');

async function testGameImport() {
  try {
    console.log('🚀 开始测试游戏导入...');
    
    // 读取游戏JSON文件
    const gameJsonPath = path.join(__dirname, 'gay_life_final.json');
    const content = fs.readFileSync(gameJsonPath, 'utf8');
    
    console.log(`📄 读取游戏文件成功: ${gameJsonPath}`);
    console.log(`📊 文件大小: ${content.length} 字节`);
    
    // 创建模拟文件对象
    const mockFile = new MockFile('gay_life_final.json', content);
    
    // 测试导入
    const result = await MockGamePackImporter.importGamePack(mockFile);
    
    console.log('\n📋 导入结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`🎮 导入数量: ${result.count}`);
    console.log(`❌ 错误: ${result.errors.length > 0 ? result.errors.join(', ') : '无'}`);
    console.log(`⚠️  警告: ${result.warnings.length > 0 ? result.warnings.join(', ') : '无'}`);
    
    if (result.success) {
      console.log('\n🎉 测试通过！我们的游戏JSON文件可以被正确导入！');
    } else {
      console.log('\n💥 测试失败！我们的游戏JSON文件无法被导入！');
    }
    
  } catch (error) {
    console.error('\n💥 测试过程中发生严重错误:', error);
  }
}

// 运行测试
testGameImport();
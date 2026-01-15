// 测试游戏导入功能
const fs = require('fs');
const path = require('path');

// 模拟 File 对象
class MockFile {
  constructor(name, text) {
    this.name = name;
    this.text = text;
    this.type = 'application/json';
  }

  async text() {
    return this.text;
  }
}

async function testImport() {
  try {
    // 读取游戏JSON文件
    const gameJsonPath = path.join(__dirname, 'public', 'gay_life_final.json');
    const content = fs.readFileSync(gameJsonPath, 'utf8');
    const gameData = JSON.parse(content);

    console.log('✅ JSON文件读取成功');
    console.log('游戏标题:', gameData.game_title);
    console.log('分支数量:', gameData.branches.length);

    // 验证字段名
    const firstBranch = gameData.branches[0];
    console.log('第一个分支的字段:', Object.keys(firstBranch).join(', '));
    
    // 检查是否有 choices 字段
    if (firstBranch.choices) {
      console.log('✅ 使用 choices 字段');
      console.log('选项数量:', firstBranch.choices.length);
    } else if (firstBranch.options) {
      console.log('❌ 仍然使用 options 字段，需要转换！');
    } else {
      console.log('❌ 既没有 choices 也没有 options 字段！');
    }

    // 检查 GameDataValidator 是否能正确验证
    const GameDataValidator = require('./src/lib/game-importer.ts').GameDataValidator;
    if (GameDataValidator && GameDataValidator.validateGameData) {
      const validation = GameDataValidator.validateGameData(gameData);
      console.log('\n验证结果:');
      console.log('有效:', validation.valid);
      console.log('错误:', validation.errors);
      console.log('警告:', validation.warnings);
    } else {
      console.log('\n⚠️  GameDataValidator.validateGameData 方法不存在');
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testImport();
const fs = require('fs');
const path = require('path');

// 模拟游戏数据验证逻辑
function validateGameData(data) {
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

// 测试我们生成的游戏JSON文件
const gameJsonPath = path.join(__dirname, 'gay_life_final.json');
const gameData = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'));

const validation = validateGameData(gameData);

console.log('游戏数据验证结果:');
console.log(`有效: ${validation.valid}`);
console.log('错误:', validation.errors);
console.log('警告:', validation.warnings);

if (validation.valid) {
  console.log('✅ 游戏JSON文件符合验证规则，可以导入！');
} else {
  console.log('❌ 游戏JSON文件不符合验证规则，无法导入！');
}
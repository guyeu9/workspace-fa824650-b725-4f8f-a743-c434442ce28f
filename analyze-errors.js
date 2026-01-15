// 详细分析导入错误
const fs = require('fs');
const path = require('path');

const gameJsonPath = path.join(__dirname, 'public', 'gay_life_final.json');
const content = fs.readFileSync(gameJsonPath, 'utf8');
const data = JSON.parse(content);

console.log('=== 游戏JSON基本信息 ===');
console.log('游戏标题:', data.game_title);
console.log('分支数量:', data.branches.length);
console.log('');

// 验证器逻辑
const errors = [];
const warnings = [];

// 1. 基本结构验证
if (!data.game_title) {
  errors.push('缺少游戏标题');
}

if (!data.branches) {
  errors.push('缺少branches字段');
} else if (!Array.isArray(data.branches)) {
  errors.push('branches必须是数组');
}

// 2. 分支验证
if (data.branches && Array.isArray(data.branches)) {
  const branchIds = new Set();
  
  data.branches.forEach((branch, index) => {
    if (!branch.branch_id) {
      errors.push(`分支 ${index + 1} 缺少branch_id`);
    } else if (branchIds.has(branch.branch_id)) {
      errors.push(`分支ID重复: ${branch.branch_id}`);
    } else {
      branchIds.add(branch.branch_id);
    }
    
    // 验证每个分支必须有 content
    if (!branch.content) {
      errors.push(`分支 ${branch.branch_id || index + 1} 缺少content`);
    }
    
    // 验证 choices 字段
    if (!branch.choices) {
      errors.push(`分支 ${branch.branch_id || index + 1} 缺少choices字段`);
    } else if (!Array.isArray(branch.choices)) {
      errors.push(`分支 ${branch.branch_id || index + 1} 的choices不是数组`);
    } else {
      // 验证每个选项
      branch.choices.forEach((choice, choiceIndex) => {
        if (!choice.id) {
          errors.push(`分支 ${branch.branch_id || index + 1} 的选项 ${choiceIndex + 1} 缺少id`);
        }
        
        if (!choice.target_branch_id) {
          errors.push(`分支 ${branch.branch_id || index + 1} 的选项 ${choiceIndex + 1} 缺少target_branch_id`);
        }
      });
    }
  });
}

console.log('=== 错误统计 ===');
console.log('总错误数:', errors.length);
console.log('');

if (errors.length > 0) {
  console.log('=== 前20个错误 ===');
  errors.slice(0, 20).forEach((error, i) => {
    console.log(`${i + 1}. ${error}`);
  });
  
  if (errors.length > 20) {
    console.log(`... 还有 ${errors.length - 20} 个错误`);
  }
} else {
  console.log('✅ 没有发现错误！');
}
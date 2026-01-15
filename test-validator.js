// 使用真正的验证器测试
const fs = require('fs');
const path = require('path');

// 直接复制验证器逻辑
class SimpleValidator {
  static validateGameData(data) {
    const errors = [];
    const warnings = [];

    if (!data) {
      errors.push('游戏数据不能为空');
      return { valid: false, errors, warnings };
    }

    if (!data.game_title && !data.title) {
      errors.push('缺少游戏标题');
    }

    if (!data.branches && !data.scenes) {
      errors.push('缺少游戏分支或场景数据');
    }

    if (data.branches) {
      if (!Array.isArray(data.branches)) {
        errors.push('branches必须是数组');
      } else if (data.branches.length === 0) {
        warnings.push('游戏没有任何分支');
      } else {
        const branchIds = new Set();
        data.branches.forEach((branch, index) => {
          if (!branch.branch_id) {
            errors.push(`分支 ${index + 1} 缺少branch_id`);
          } else if (branchIds.has(branch.branch_id)) {
            errors.push(`分支ID重复: ${branch.branch_id}`);
          } else {
            branchIds.add(branch.branch_id);
          }

          const branchTitle = branch.chapter || branch.branch_title;
          const branchContent = branch.scene_detail || branch.content;
          
          if (!branchTitle) {
            errors.push(`分支 ${branch.branch_id || index + 1} 缺少章节标题`);
          }
          if (!branchContent) {
            errors.push(`分支 ${branch.branch_id || index + 1} 缺少场景描述`);
          }

          const choices = branch.choices || branch.options || [];
          if (Array.isArray(choices)) {
            choices.forEach((choice, choiceIndex) => {
              const choiceId = choice.choice || choice.option_id || choice.id;
              const nextBranch = choice.next_branch || choice.target_branch_id || choice.end_game;
              
              if (!choiceId) {
                errors.push(`分支 ${branch.branch_id} 的选择项 ${choiceIndex + 1} 缺少id字段`);
              }
              if (!nextBranch) {
                errors.push(`分支 ${branch.branch_id} 的选择项 ${choiceIndex + 1} 缺少目标分支字段`);
              }
            });
          }
        });

        const connections = this.validateBranchConnections(data.branches);
        if (!connections.connected) {
          errors.push(...connections.errors);
        }
        if (connections.warnings.length > 0) {
          warnings.push(...connections.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateBranchConnections(branches) {
    const errors = [];
    const warnings = [];
    const branchIds = new Set(branches.map(b => b.branch_id));
    const referencedBranches = new Set();
    const startBranch = branches[0]?.branch_id;

    branches.forEach(branch => {
      const choices = branch.choices || branch.options || [];
      if (Array.isArray(choices)) {
        choices.forEach((choice) => {
          const nextBranch = choice.next_branch || choice.target_branch_id;
          if (nextBranch) {
            referencedBranches.add(nextBranch);
          }
        });
      }
    });

    const orphanedBranches = new Set();
    branchIds.forEach(id => {
      if (id !== startBranch && !referencedBranches.has(id)) {
        orphanedBranches.add(id);
      }
    });

    if (orphanedBranches.size > 0) {
      warnings.push(`发现孤立分支: ${Array.from(orphanedBranches).join(', ')}`);
    }

    const missingBranches = new Set();
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
}

async function test() {
  const gameJsonPath = path.join(__dirname, 'public', 'gay_life_final.json');
  const content = fs.readFileSync(gameJsonPath, 'utf8');
  const data = JSON.parse(content);

  console.log('=== 游戏JSON基本信息 ===');
  console.log('游戏标题:', data.game_title);
  console.log('分支数量:', data.branches.length);
  console.log('');

  const validation = SimpleValidator.validateGameData(data);

  console.log('=== 验证结果 ===');
  console.log('有效:', validation.valid);
  console.log('错误数:', validation.errors.length);
  console.log('警告数:', validation.warnings.length);
  console.log('');

  if (validation.errors.length > 0) {
    console.log('=== 前20个错误 ===');
    validation.errors.slice(0, 20).forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
    
    if (validation.errors.length > 20) {
      console.log(`... 还有 ${validation.errors.length - 20} 个错误`);
    }
  } else {
    console.log('✅ 没有发现错误！');
  }
}

test();
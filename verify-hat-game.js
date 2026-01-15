const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', '一个帽子_修复版_新版.json');

console.log('验证转换结果...\n');

const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log('=== 基本信息 ===');
console.log(`游戏标题: ${data.game_title}`);
console.log(`分支数量: ${data.branches.length}`);
console.log(`初始状态: ${JSON.stringify(data.status)}\n`);

const branchIds = new Set(data.branches.map(b => b.branch_id));
const invalidRefs = [];
const missingStatusChanges = [];
const missingEndGame = [];

console.log('=== 分支引用验证 ===');
data.branches.forEach(branch => {
  if (branch.choices) {
    branch.choices.forEach(choice => {
      if (choice.target && choice.target !== '') {
        if (!branchIds.has(choice.target)) {
          invalidRefs.push({
            branch: branch.branch_id,
            choice: choice.id,
            target: choice.target
          });
        }
      }
      if (choice.sub_choices) {
        choice.sub_choices.forEach(subChoice => {
          if (subChoice.target && subChoice.target !== '') {
            if (!branchIds.has(subChoice.target)) {
              invalidRefs.push({
                branch: branch.branch_id,
                choice: `${choice.id} -> ${subChoice.id}`,
                target: subChoice.target
              });
            }
          }
        });
      }
    });
  }
});

if (invalidRefs.length === 0) {
  console.log('✓ 所有分支引用有效\n');
} else {
  console.log('✗ 发现无效的分支引用:');
  invalidRefs.forEach(ref => {
    console.log(`  分支 ${ref.branch} 的选择 ${ref.choice} 引用了不存在的分支: ${ref.target}`);
  });
  console.log('');
}

console.log('=== status_changes 验证 ===');
let hasStatusChanges = 0;
let noStatusChanges = 0;
data.branches.forEach(branch => {
  if (branch.choices) {
    branch.choices.forEach(choice => {
      if (choice.status_changes && choice.status_changes.length > 0) {
        hasStatusChanges++;
      } else {
        noStatusChanges++;
      }
      if (choice.sub_choices) {
        choice.sub_choices.forEach(subChoice => {
          if (subChoice.status_changes && subChoice.status_changes.length > 0) {
            hasStatusChanges++;
          } else {
            noStatusChanges++;
          }
        });
      }
    });
  }
});

console.log(`有 status_changes 的选择: ${hasStatusChanges}`);
console.log(`无 status_changes 的选择: ${noStatusChanges}\n`);

console.log('=== end_game 验证 ===');
const endGameBranches = data.branches.filter(b => b.end_game === true);
console.log(`end_game 分支数量: ${endGameBranches.length}`);
endGameBranches.forEach(branch => {
  console.log(`  - ${branch.branch_id}: ${branch.chapter}`);
});

let endGameChoices = 0;
data.branches.forEach(branch => {
  if (branch.choices) {
    branch.choices.forEach(choice => {
      if (choice.end_game === true) {
        endGameChoices++;
      }
      if (choice.sub_choices) {
        choice.sub_choices.forEach(subChoice => {
          if (subChoice.end_game === true) {
            endGameChoices++;
          }
        });
      }
    });
  }
});
console.log(`end_game 选择数量: ${endGameChoices}\n`);

console.log('=== 场景合并验证 ===');
const expectedRemoved = ['dorm_training', 'park_gangbang', 'self_humiliation_slap', 'punish_continue', 'netbar_training', 'gym_training', 'construction_rope_walk'];
const actuallyRemoved = expectedRemoved.filter(id => !branchIds.has(id));
console.log(`预期移除的分支: ${expectedRemoved.length}`);
console.log(`实际移除的分支: ${actuallyRemoved.length}`);
if (actuallyRemoved.length === expectedRemoved.length) {
  console.log('✓ 所有预期分支已合并\n');
} else {
  console.log('✗ 部分分支未合并:');
  expectedRemoved.forEach(id => {
    if (branchIds.has(id)) {
      console.log(`  - ${id} 仍然存在`);
    }
  });
  console.log('');
}

console.log('=== 合并后的 sub_choices 验证 ===');
let subChoicesCount = 0;
data.branches.forEach(branch => {
  if (branch.choices) {
    branch.choices.forEach(choice => {
      if (choice.sub_choices) {
        subChoicesCount += choice.sub_choices.length;
      }
    });
  }
});
console.log(`sub_choices 总数: ${subChoicesCount}\n`);

console.log('=== 验证完成 ===');
if (invalidRefs.length === 0 && actuallyRemoved.length === expectedRemoved.length) {
  console.log('✓ 所有验证通过！');
} else {
  console.log('✗ 存在问题需要修复');
}

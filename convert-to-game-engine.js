const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'gay_life_final.json');
const outputPath = path.join(__dirname, 'public', 'gay_life_final.json.bak2');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// 备份原文件
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('✅ 已备份原文件到 gay_life_final.json.bak2');

// 转换字段以符合游戏引擎期望
const convertedData = {
  ...data,
  branches: data.branches.map(branch => {
    // 转换 choices 字段
    let choices = [];
    if (branch.choices && Array.isArray(branch.choices)) {
      choices = branch.choices.map((choice, index) => {
        // 支持多种目标分支字段名
        const targetBranchId = choice.target_branch_id || choice.next_branch || choice.end_game || '';
        
        return {
          id: choice.id || `choice_${Date.now()}_${index}`,
          choice: choice.text || choice.option_text || '未知选项',
          next_branch: targetBranchId,
          target: targetBranchId, // 同时添加 target 字段
          effect: choice.effect || '',
          status_update: choice.status_update || '',
          status_changes: choice.status_changes || []
        };
      });
    }

    const { choices: oldChoices, ...rest } = branch;
    
    return {
      ...rest,
      choices
    };
  })
};

fs.writeFileSync(inputPath, JSON.stringify(convertedData, null, 2));
console.log('✅ 已转换字段格式');

console.log(`\n📋 转换完成！`);
console.log(`总分支数: ${convertedData.branches.length}`);

const totalChoices = convertedData.branches.reduce((sum, b) => sum + (b.choices?.length || 0), 0);
console.log(`总选项数: ${totalChoices}`);

// 验证第一个分支
const firstBranch = convertedData.branches.find(b => b.branch_id === 'chapter1_start');
if (firstBranch) {
  console.log('\n第一个分支示例:');
  console.log('  branch_id:', firstBranch.branch_id);
  console.log('  branch_title:', firstBranch.branch_title);
  console.log('  choices数量:', firstBranch.choices.length);
  if (firstBranch.choices.length > 0) {
    console.log('  第一个选项:');
    console.log('    id:', firstBranch.choices[0].id);
    console.log('    choice:', firstBranch.choices[0].choice);
    console.log('    next_branch:', firstBranch.choices[0].next_branch);
    console.log('    target:', firstBranch.choices[0].target);
  }
}
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'gay_life_final.json');
const outputPath = path.join(__dirname, 'public', 'gay_life_final.json.bak');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// 备份原文件
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('✅ 已备份原文件到 gay_life_final.json.bak');

// 转换字段
const convertedData = {
  ...data,
  branches: data.branches.map(branch => {
    // 转换 choices/options 字段
    let choices = [];
    if (branch.options && Array.isArray(branch.options)) {
      choices = branch.options.map(option => ({
        ...option,
        id: option.option_id || option.id,
        text: option.option_text || option.text,
        target_branch_id: option.target_branch_id || option.next_branch || option.end_game
      }));
    } else if (branch.choices && Array.isArray(branch.choices)) {
      choices = branch.choices;
    }

    // 删除旧的 options 字段，添加 choices 字段
    const { options, ...rest } = branch;
    
    return {
      ...rest,
      choices
    };
  })
};

fs.writeFileSync(inputPath, JSON.stringify(convertedData, null, 2));
console.log('✅ 已转换字段: options → choices');
console.log('✅ 已转换字段: option_id → id');
console.log('✅ 已转换字段: option_text → text');
console.log('✅ 已转换字段: target_branch_id 保持不变');

console.log(`\n📋 转换完成！`);
console.log(`总分支数: ${convertedData.branches.length}`);

const totalChoices = convertedData.branches.reduce((sum, b) => sum + (b.choices?.length || 0), 0);
console.log(`总选项数: ${totalChoices}`);
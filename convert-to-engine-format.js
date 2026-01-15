const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', 'gay_life_final.json');
const outputFile = path.join(__dirname, 'public', 'gay_life_converted.json');

console.log('读取源文件:', inputFile);
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

console.log('开始转换...');
const convertedData = {
  game_title: data.game_title,
  description: data.description,
  author: data.author || 'Unknown',
  tags: data.tags || [],
  version: data.version || 1.0,
  background_image: data.background_image || '',
  background_asset_id: data.background_asset_id || '',
  branches: data.branches.map(branch => {
    const branch_title = branch.branch_title || branch.chapter || '';
    const content = branch.content || branch.scene_detail || '';
    let options = [];
    if (branch.choices && Array.isArray(branch.choices)) {
      options = branch.choices.map((choice, index) => {
        const target_branch_id = choice.target_branch_id || choice.next_branch || choice.end_game || '';
        return {
          option_id: choice.id || `choice_${Date.now()}_${index}`,
          option_text: choice.text || choice.choice || choice.option_text || '未知选项',
          target_branch_id: target_branch_id,
          effect: choice.effect || '',
          status_update: choice.status_update || '',
          status_changes: choice.status_changes || []
        };
      });
    }
    return {
      branch_id: branch.branch_id,
      branch_title: branch_title,
      content: content,
      options: options
    };
  })
};

console.log('写入转换后的文件:', outputFile);
fs.writeFileSync(outputFile, JSON.stringify(convertedData, null, 2), 'utf8');

console.log('转换完成!');
console.log(`- 游戏标题: ${convertedData.game_title}`);
console.log(`- 章节数量: ${convertedData.branches.length}`);
console.log(`- 输出文件: ${outputFile}`);

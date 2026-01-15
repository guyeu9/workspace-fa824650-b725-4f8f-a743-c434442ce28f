const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', 'gay_life_final.json');
const outputFile = path.join(__dirname, 'public', 'gay_life_final.json');

console.log('读取源文件:', inputFile);
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

console.log('开始优化JSON...');

// 递归清理空字符串和空数组
function cleanObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const key in obj) {
      const value = obj[key];
      
      // 移除空字符串
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }
      
      // 移除空数组（可选，保留结构）
      if (Array.isArray(value) && value.length === 0) {
        continue;
      }
      
      // 递归处理嵌套对象
      cleaned[key] = cleanObject(value);
    }
    return cleaned;
  }
  return obj;
}

const cleanedData = cleanObject(data);

console.log('写入优化后的文件:', outputFile);
fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf8');

console.log('优化完成!');
console.log(`- 游戏标题: ${cleanedData.game_title}`);
console.log(`- 章节数量: ${cleanedData.branches.length}`);
console.log(`- 输出文件: ${outputFile}`);

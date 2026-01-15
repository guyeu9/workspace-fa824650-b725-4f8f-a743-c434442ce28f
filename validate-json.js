// 简单的JSON验证脚本
const fs = require('fs');

try {
  const data = fs.readFileSync('gay_life_final.json', 'utf8');
  const gameData = JSON.parse(data);
  
  console.log('✅ JSON格式有效！');
  console.log('📋 游戏信息：');
  console.log('   标题:', gameData.game_title || gameData.title);
  console.log('   描述:', gameData.description);
  console.log('   分支数量:', gameData.branches?.length || 0);
  console.log('   标签:', gameData.tags?.join(', ') || '无');
  
  // 验证基本结构
  if (!gameData.game_title && !gameData.title) {
    console.error('❌ 缺少游戏标题');
  }
  
  if (!gameData.branches && !gameData.scenes) {
    console.error('❌ 缺少游戏分支或场景数据');
  }
  
  console.log('\n🎉 游戏JSON文件验证通过！');
  
} catch (error) {
  console.error('❌ JSON验证失败:', error.message);
}
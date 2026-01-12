// 导入并设置"一个帽子_修复版"游戏脚本
// 使用方法：在浏览器控制台中运行此脚本

async function importAndSetHatGame() {
  try {
    // 读取修复后的游戏JSON文件
    const response = await fetch('/一个帽子_修复版.json');
    const gameData = await response.json();
    
    console.log('游戏数据:', gameData);
    
    // 检查数据结构
    if (!gameData.game_title || !gameData.branches || !Array.isArray(gameData.branches)) {
      console.error('游戏数据结构无效');
      return;
    }
    
    // 创建游戏数据
    const gameIndex = {
      id: 'hat_game_fixed',
      title: gameData.game_title,
      description: gameData.description || '一个帽子修复版',
      priority: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    // 存储到IndexedDB
    const db = new (await import('./src/lib/game-store')).gameStore.db;
    
    // 检查游戏是否已存在
    const existingGame = await db.games_index.get('hat_game_fixed');
    if (existingGame) {
      console.log('游戏已存在，更新数据');
      await db.games_index.update('hat_game_fixed', {
        title: gameData.game_title,
        description: gameData.description || '一个帽子修复版',
        updatedAt: new Date().toISOString()
      });
      await db.games_data.update('hat_game_fixed', {
        data: gameData,
        updatedAt: new Date().toISOString()
      });
    } else {
      console.log('创建新游戏');
      await db.games_index.add(gameIndex);
      await db.games_data.add({
        id: 'hat_game_fixed',
        data: gameData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // 设置为默认游戏
    localStorage.setItem('defaultGameId', 'hat_game_fixed');
    
    console.log('✅ 游戏导入成功并设置为默认游戏');
    console.log('游戏ID: hat_game_fixed');
    console.log('游戏标题:', gameData.game_title);
    console.log('分支数量:', gameData.branches.length);
    
    alert('游戏导入成功并设置为默认游戏！\n\n游戏标题：' + gameData.game_title + '\n分支数量：' + gameData.branches.length);
    
  } catch (error) {
    console.error('导入游戏失败:', error);
    alert('导入游戏失败：' + error.message);
  }
}

// 执行导入
importAndSetHatGame();

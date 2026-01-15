const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', '游戏2.0版本月王故事.json');
const outputFile = path.join(__dirname, 'public', '游戏2.0版本月王故事_新版.json');

const oldData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

function convertEffectsToStatusChanges(effects) {
  const statusChanges = [];
  
  if (!effects) return statusChanges;
  
  if (effects.onEnter) {
    for (const [key, value] of Object.entries(effects.onEnter)) {
      if (key !== 'message') {
        statusChanges.push({
          attribute: key,
          operation: '+',
          value: value
        });
      }
    }
  }
  
  if (effects.effects) {
    for (const [key, value] of Object.entries(effects.effects)) {
      if (key !== 'message') {
        statusChanges.push({
          attribute: key,
          operation: '+',
          value: value
        });
      }
    }
  }
  
  return statusChanges;
}

function convertExitToChoice(exit, allRoomIds) {
  const choice = {
    id: exit.id || `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    choice: Array.isArray(exit.dir) ? exit.dir[0] : exit.dir,
    next_branch: '',
    end_game: false
  };
  
  if (exit.conditions) {
    if (exit.conditions.effects) {
      choice.status_changes = convertEffectsToStatusChanges({ effects: exit.conditions.effects });
    }
    if (exit.conditions.message) {
      choice.effect = exit.conditions.message;
      choice.status_update = exit.conditions.message;
    }
  }
  
  if (exit.id && allRoomIds.includes(exit.id)) {
    choice.next_branch = exit.id;
  }
  
  return choice;
}

function convertToNewFormat(oldData) {
  const gameStates = [
    {
      name: 'desire',
      initial_value: 0,
      min: 0,
      max: 100,
      is_percentage: true
    },
    {
      name: 'corruption',
      initial_value: 0,
      min: 0,
      max: 100,
      is_percentage: true
    },
    {
      name: 'resistance',
      initial_value: 0,
      min: 0,
      max: 100,
      is_percentage: true
    }
  ];
  
  const allRoomIds = oldData.rooms.map(room => room.id);
  
  const branches = oldData.rooms.map(room => {
    const branch = {
      branch_id: room.id,
      chapter: room.name,
      scene_detail: Array.isArray(room.desc) ? room.desc.join('\n') : room.desc,
      choices: room.exits.map(exit => convertExitToChoice(exit, allRoomIds))
    };
    
    if (room.effects && room.effects.onEnter) {
      branch.status_changes = convertEffectsToStatusChanges(room.effects);
      if (room.effects.onEnter.message) {
        branch.effect = room.effects.onEnter.message;
      }
    }
    
    return branch;
  });
  
  const endGameScenes = ['SMOON_FULL_CORRUPTION_END', 'SMOON_DOMINATOR_END', 'SMOON_REFUSE_END', 'SMOON_FINAL_FALL'];
  
  branches.forEach(branch => {
    branch.choices.forEach(choice => {
      if (endGameScenes.includes(choice.next_branch)) {
        choice.end_game = true;
      }
      
      if (choice.next_branch === '') {
        choice.end_game = true;
      }
    });
  });
  
  const newData = {
    game_title: '月王故事',
    description: '一个关于卧底孢魔岛的冒险故事，充满诱惑与堕落的选择。',
    game_states: gameStates,
    branches: branches
  };
  
  return newData;
}

const newData = convertToNewFormat(oldData);

fs.writeFileSync(outputFile, JSON.stringify(newData, null, 2), 'utf8');

console.log('转换完成！');
console.log(`原始场景数量: ${oldData.rooms.length}`);
console.log(`转换后场景数量: ${newData.branches.length}`);
console.log(`输出文件: ${outputFile}`);
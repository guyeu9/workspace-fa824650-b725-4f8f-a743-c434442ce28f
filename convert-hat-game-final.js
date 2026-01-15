const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'public', '一个帽子_修复版.json');
const outputFile = path.join(__dirname, 'public', '一个帽子_修复版_新版.json');

function parseStatusUpdate(statusUpdate) {
  const statusChanges = [];
  
  if (!statusUpdate || statusUpdate === '直接100%/100%') {
    return statusChanges;
  }
  
  const parts = statusUpdate.split('|').map(p => p.trim());
  const saoPart = parts[0];
  const bodyPsyPart = parts[1] || '';
  
  const saoMatch = saoPart.match(/(?:\+)?骚(\d+),(?:\+)?浪(\d+),(?:\+)?贱(\d+)/);
  if (saoMatch) {
    const sao = parseInt(saoMatch[1]);
    const lang = parseInt(saoMatch[2]);
    const jian = parseInt(saoMatch[3]);
    
    if (saoPart.startsWith('+')) {
      if (sao > 0) statusChanges.push({ attribute: 'sao', operation: '+', value: sao });
      if (lang > 0) statusChanges.push({ attribute: 'lang', operation: '+', value: lang });
      if (jian > 0) statusChanges.push({ attribute: 'jian', operation: '+', value: jian });
    } else {
      statusChanges.push({ attribute: 'sao', operation: '=', value: sao });
      statusChanges.push({ attribute: 'lang', operation: '=', value: lang });
      statusChanges.push({ attribute: 'jian', operation: '=', value: jian });
    }
  }
  
  const bodyMatch = bodyPsyPart.match(/(?:\+)?身体(\d+)%/);
  if (bodyMatch) {
    const body = parseInt(bodyMatch[1]);
    if (bodyPsyPart.includes('+')) {
      if (body > 0) statusChanges.push({ attribute: 'body_outtrack', operation: '+', value: body });
    } else {
      statusChanges.push({ attribute: 'body_outtrack', operation: '=', value: body });
    }
  }
  
  const psyMatch = bodyPsyPart.match(/(?:\+)?心理(\d+)%/);
  if (psyMatch) {
    const psy = parseInt(psyMatch[1]);
    if (bodyPsyPart.includes('+')) {
      if (psy > 0) statusChanges.push({ attribute: 'psy_outtrack', operation: '+', value: psy });
    } else {
      statusChanges.push({ attribute: 'psy_outtrack', operation: '=', value: psy });
    }
  }
  
  return statusChanges;
}

const mergePairs = [
  { parent: 'dorm_entry', child: 'dorm_training', choiceId: 'choice_10_1' },
  { parent: 'park_entry', child: 'park_gangbang', choiceId: 'choice_12_1' },
  { parent: 'self_humiliation_entry', child: 'self_humiliation_slap', choiceId: 'choice_14_1' },
  { parent: 'punish_entry', child: 'punish_continue', choiceId: 'choice_16_1' },
  { parent: 'netbar_entry', child: 'netbar_training', choiceId: 'choice_18_1' },
  { parent: 'gym_entry', child: 'gym_training', choiceId: 'choice_20_1' },
  { parent: 'construction_rope', child: 'construction_rope_walk', choiceId: 'choice_5_1' }
];

function mergeScenes(branches) {
  const branchMap = new Map();
  branches.forEach(branch => {
    branchMap.set(branch.branch_id, branch);
  });
  
  const mergedBranches = [];
  const removedIds = new Set();
  
  mergePairs.forEach(({ parent, child, choiceId }) => {
    const parentBranch = branchMap.get(parent);
    const childBranch = branchMap.get(child);
    
    if (parentBranch && childBranch) {
      const choice = parentBranch.choices.find(c => c.id === choiceId);
      if (choice) {
        choice.effect = childBranch.scene_detail;
        choice.status_update = `继续：${childBranch.chapter}`;
        removedIds.add(child);
      }
    }
  });
  
  branches.forEach(branch => {
    if (!removedIds.has(branch.branch_id)) {
      mergedBranches.push(branch);
    }
  });
  
  return mergedBranches;
}

function convertBranchFormat(branches) {
  return branches.map(branch => {
    const convertedBranch = {
      branch_id: branch.branch_id,
      branch_title: branch.chapter,
      content: branch.scene_detail,
      options: branch.choices ? branch.choices.map(choice => {
        const option = {
          option_id: choice.id,
          option_text: choice.choice,
          target_branch_id: choice.next_branch || '',
          effect: choice.effect || '',
          status_changes: choice.status_changes || [],
          end_game: choice.end_game || false
        };
        
        if (choice.status_update) {
          option.status_update = choice.status_update;
          delete choice.status_update;
        }
        
        return option;
      }) : []
    };
    
    if (branch.end_game) {
      convertedBranch.end_game = true;
    }
    
    return convertedBranch;
  });
}

function validateBranches(branches) {
  const branchIds = new Set(branches.map(b => b.branch_id));
  const invalidRefs = [];
  
  branches.forEach(branch => {
    if (branch.options) {
      branch.options.forEach(option => {
        if (option.target_branch_id && option.target_branch_id !== '') {
          if (!branchIds.has(option.target_branch_id)) {
            invalidRefs.push({
              branch: branch.branch_id,
              option: option.option_id,
              target: option.target_branch_id
            });
          }
        }
      });
    }
  });
  
  return invalidRefs;
}

function convertGame() {
  console.log('读取源文件...');
  const sourceData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  console.log(`原始分支数量: ${sourceData.branches.length}`);
  
  console.log('合并场景...');
  const mergedBranches = mergeScenes(sourceData.branches);
  
  console.log(`合并后分支数量: ${mergedBranches.length}`);
  
  console.log('转换格式...');
  const convertedBranches = convertBranchFormat(mergedBranches);
  
  console.log('验证分支引用...');
  const invalidRefs = validateBranches(convertedBranches);
  
  if (invalidRefs.length > 0) {
    console.log('\n警告: 发现无效的分支引用:');
    invalidRefs.forEach(ref => {
      console.log(`  分支 ${ref.branch} 的选项 ${ref.option} 引用了不存在的分支: ${ref.target}`);
    });
  }
  
  const outputData = {
    game_title: sourceData.game_title,
    description: sourceData.description,
    author: sourceData.author,
    branches: convertedBranches
  };
  
  console.log('写入输出文件...');
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log(`\n转换完成!`);
  console.log(`输出文件: ${outputFile}`);
  console.log(`文件大小: ${fs.statSync(outputFile).size} 字节`);
  
  const stats = fs.readFileSync(outputFile, 'utf8');
  try {
    JSON.parse(stats);
    console.log('JSON 格式验证: 通过');
  } catch (e) {
    console.log('JSON 格式验证: 失败 -', e.message);
  }
  
  const endGameBranches = convertedBranches.filter(b => b.end_game === true);
  console.log(`end_game 分支数量: ${endGameBranches.length}`);
  console.log(`end_game 分支: ${endGameBranches.map(b => b.branch_id).join(', ')}`);
}

convertGame();

const fs = require('fs');
const path = require('path');

function parseStatusUpdate(statusUpdate) {
  if (!statusUpdate || statusUpdate.trim() === "") {
    return [];
  }
  
  const statusChanges = [];
  
  const stateIdMap = {
    '暴露度': 'exposure',
    '羞耻感': 'shame',
    '兴奋度': 'excitement',
    '任务完成数': 'completed_tasks',
    '场景解锁数': 'unlocked_scenes'
  };
  
  const parts = statusUpdate.split(/\s+/).filter(part => part.trim() !== '');
  
  for (const part of parts) {
    const match = part.match(/([\u4e00-\u9fa5]+)([+\-]?)(\d+)%?/);
    if (match) {
      const stateName = match[1];
      const operation = match[2] || '';
      const value = parseInt(match[3], 10);
      
      const stateId = stateIdMap[stateName] || stateName;
      
      statusChanges.push({
        state_id: stateId,
        operation: operation === '+' ? 'add' : (operation === '-' ? 'subtract' : 'set'),
        value: value
      });
    }
  }
  
  return statusChanges;
}

function optimizeJsonFile(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  if (!data.game_states) {
    data.game_states = [
      {
        state_id: 'exposure',
        name: '暴露度',
        initial_value: 0,
        min_value: 0,
        max_value: 100,
        display_format: 'percentage'
      },
      {
        state_id: 'shame',
        name: '羞耻感',
        initial_value: 0,
        min_value: 0,
        max_value: 100,
        display_format: 'percentage'
      },
      {
        state_id: 'excitement',
        name: '兴奋度',
        initial_value: 0,
        min_value: 0,
        max_value: 100,
        display_format: 'percentage'
      },
      {
        state_id: 'completed_tasks',
        name: '任务完成数',
        initial_value: 0,
        min_value: 0,
        max_value: 53,
        display_format: 'integer'
      },
      {
        state_id: 'unlocked_scenes',
        name: '场景解锁数',
        initial_value: 0,
        min_value: 0,
        max_value: 53,
        display_format: 'integer'
      }
    ];
    console.log("Added game_states array");
  }
  
  if (data.status) {
    delete data.status;
    console.log("Removed old status field");
  }
  
  const fieldMapping = {
    'chapter': 'branch_title',
    'scene_detail': 'content',
    'choices': 'options',
    'id': 'option_id',
    'choice': 'option_text',
    'next_branch': 'target_branch_id'
  };
  
  const branches = data.branches || [];
  const optimizedBranches = [];
  
  for (const branch of branches) {
    const optimizedBranch = { ...branch };
    
    for (const [oldName, newName] of Object.entries(fieldMapping)) {
      if (optimizedBranch[oldName] !== undefined) {
        optimizedBranch[newName] = optimizedBranch[oldName];
        delete optimizedBranch[oldName];
      }
    }
    
    if (optimizedBranch.options) {
      const optimizedOptions = [];
      
      for (const option of optimizedBranch.options) {
        const optimizedOption = { ...option };
        
        for (const [oldName, newName] of Object.entries(fieldMapping)) {
          if (optimizedOption[oldName] !== undefined) {
            optimizedOption[newName] = optimizedOption[oldName];
            delete optimizedOption[oldName];
          }
        }
        
        if (optimizedOption.status_update) {
          const statusChanges = parseStatusUpdate(optimizedOption.status_update);
          if (statusChanges.length > 0) {
            optimizedOption.status_changes = statusChanges;
          }
          delete optimizedOption.status_update;
        }
        
        optimizedOptions.push(optimizedOption);
      }
      
      optimizedBranch.options = optimizedOptions;
    }
    
    optimizedBranches.push(optimizedBranch);
  }
  
  data.branches = optimizedBranches;
  console.log(`Optimization complete, processed ${optimizedBranches.length} branches`);
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Optimization complete!");
  
  console.log("\n=== Optimization Statistics ===");
  console.log(`Total branches: ${optimizedBranches.length}`);
  const totalOptions = optimizedBranches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`Added game_states: Yes (5 states)`);
  console.log(`Field names updated: Yes`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v2.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v3.json');

optimizeJsonFile(inputFile, outputFile);

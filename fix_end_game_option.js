const fs = require('fs');
const path = require('path');

function fixEndGameOption(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  const branches = data.branches || [];
  
  for (const branch of branches) {
    if (branch.options) {
      for (const option of branch.options) {
        if (option.end_game && !option.target_branch_id) {
          console.log(`Adding target_branch_id to end_game option ${option.option_id} in branch ${branch.branch_id}`);
          option.target_branch_id = branch.branch_id;
        }
      }
    }
  }
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Fix complete!");
  
  console.log("\n=== Fix Statistics ===");
  console.log(`Total branches: ${branches.length}`);
  const totalOptions = branches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`End game options fixed: Yes`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v5.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v6.json');

fixEndGameOption(inputFile, outputFile);

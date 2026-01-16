const fs = require('fs');
const path = require('path');

function fixStatusChangesFormat(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  const branches = data.branches || [];
  
  for (const branch of branches) {
    if (branch.options) {
      for (const option of branch.options) {
        if (option.status_changes) {
          for (const change of option.status_changes) {
            if (change.state_id) {
              change.attribute = change.state_id;
              delete change.state_id;
            }
            
            if (change.operation === 'add') {
              change.operation = '+';
            } else if (change.operation === 'subtract') {
              change.operation = '-';
            } else if (change.operation === 'set') {
              change.operation = '=';
            }
          }
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
  console.log(`Status changes format fixed: Yes`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v6.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v7.json');

fixStatusChangesFormat(inputFile, outputFile);

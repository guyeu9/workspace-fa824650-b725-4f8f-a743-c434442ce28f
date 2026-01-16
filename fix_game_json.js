const fs = require('fs');
const path = require('path');

function fixJsonFile(inputPath, outputPath) {
  console.log(`Reading file: ${inputPath}`);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Original file contains ${data.branches ? data.branches.length : 0} branches`);
  
  const branches = data.branches || [];
  const branchIdMap = new Map();
  const duplicateBranchIds = new Set();
  
  for (const branch of branches) {
    const branchId = branch.branch_id;
    if (branchIdMap.has(branchId)) {
      duplicateBranchIds.add(branchId);
      console.log(`Found duplicate branch_id: ${branchId}`);
    } else {
      branchIdMap.set(branchId, branch);
    }
  }
  
  const uniqueBranches = [];
  const seenBranchIds = new Set();
  
  for (const branch of branches) {
    const branchId = branch.branch_id;
    if (!seenBranchIds.has(branchId)) {
      seenBranchIds.add(branchId);
      uniqueBranches.push(branch);
    }
  }
  
  console.log(`Removed ${branches.length - uniqueBranches.length} duplicate branches`);
  
  for (const branch of uniqueBranches) {
    if (branch.options) {
      for (const option of branch.options) {
        if (!option.target_branch_id && !option.end_game) {
          console.log(`Option ${option.option_id} in branch ${branch.branch_id} is missing target_branch_id`);
          option.target_branch_id = branch.branch_id;
        }
      }
    }
  }
  
  const allBranchIds = new Set(uniqueBranches.map(b => b.branch_id));
  const missingBranchIds = new Set();
  
  for (const branch of uniqueBranches) {
    if (branch.options) {
      for (const option of branch.options) {
        if (option.target_branch_id && !allBranchIds.has(option.target_branch_id)) {
          missingBranchIds.add(option.target_branch_id);
        }
      }
    }
  }
  
  console.log(`Found ${missingBranchIds.size} missing branch references:`, Array.from(missingBranchIds));
  
  data.branches = uniqueBranches;
  
  console.log(`Saving file to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log("Fix complete!");
  
  console.log("\n=== Fix Statistics ===");
  console.log(`Total branches: ${uniqueBranches.length}`);
  const totalOptions = uniqueBranches.reduce((sum, b) => sum + (b.options ? b.options.length : 0), 0);
  console.log(`Total options: ${totalOptions}`);
  console.log(`Duplicate branches removed: ${branches.length - uniqueBranches.length}`);
  console.log(`Missing target_branch_id fixed: Yes`);
}

const inputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v3.json');
const outputFile = path.join(__dirname, 'public', '网调任务合集-完整版-v4.json');

fixJsonFile(inputFile, outputFile);

const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('public/网调任务合集-完整版-v7.json', 'utf8'));
  console.log('JSON format validation passed!');
  console.log('Total branches:', data.branches.length);
  
  const branchIds = new Set(data.branches.map(b => b.branch_id));
  console.log('Unique branch IDs:', branchIds.size);
  
  let missingTarget = 0;
  let missingBranchIds = new Set();
  const allBranchIds = new Set(data.branches.map(b => b.branch_id));
  let statusChangeErrors = 0;
  
  for (const branch of data.branches) {
    if (branch.options) {
      for (const option of branch.options) {
        if (!option.target_branch_id && !option.end_game) {
          missingTarget++;
        }
        if (option.target_branch_id && !allBranchIds.has(option.target_branch_id)) {
          missingBranchIds.add(option.target_branch_id);
        }
        if (option.status_changes) {
          for (const change of option.status_changes) {
            if (!change.attribute || !change.operation || change.value === undefined) {
              statusChangeErrors++;
            }
          }
        }
      }
    }
  }
  
  console.log('Missing target_branch_id options:', missingTarget);
  console.log('Missing branch references:', missingBranchIds.size);
  console.log('Status changes format errors:', statusChangeErrors);
  
  if (missingTarget === 0 && missingBranchIds.size === 0 && branchIds.size === data.branches.length && statusChangeErrors === 0) {
    console.log('\nAll validations passed! File is fully compliant with the specification!');
  } else {
    console.log('\nThere are still issues that need to be fixed');
  }
} catch(e) {
  console.error('Validation failed:', e.message);
}

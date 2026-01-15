const fs = require('fs');
const path = require('path');

const gameJsonPath = path.join(__dirname, 'gay_life_final.json');
const data = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'));

const branchesWithoutChoices = data.branches.filter(b => !b.choices || !Array.isArray(b.choices));

console.log('总分支数量:', data.branches.length);
console.log('没有choices字段的分支数量:', branchesWithoutChoices.length);

if (branchesWithoutChoices.length > 0) {
  console.log('这些分支的branch_id:');
  branchesWithoutChoices.forEach(b => {
    console.log('  -', b.branch_id);
  });
} else {
  console.log('✅ 所有分支都有choices字段！');
}
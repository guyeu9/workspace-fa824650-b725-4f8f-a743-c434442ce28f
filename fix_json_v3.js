const fs = require('fs');

const inputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子.json';
const outputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子_修复版.json';

let content = fs.readFileSync(inputFile, 'utf8');

content = content.replace(/\/\/.*$/gm, '');
content = content.replace(/\/\*[\s\S]*?\*\//g, '');

content = content.replace(/"/g, '\\"');

const branchesRegex = /"branches":\s*\[([\s\S]*?)\]/g;
let allBranches = [];
let match;

while ((match = branchesRegex.exec(content)) !== null) {
  const branchesContent = match[1];
  const branchRegex = /\{[\s\S]*?\}/g;
  let branchMatch;
  
  while ((branchMatch = branchRegex.exec(branchesContent)) !== null) {
    try {
      const branchJson = '{' + branchMatch[0] + '}';
      const branch = JSON.parse(branchJson);
      allBranches.push(branch);
    } catch (e) {
      console.log('无法解析分支:', e.message);
    }
  }
}

const uniqueBranches = [];
const seenIds = new Set();

allBranches.forEach(branch => {
  if (branch.branch_id && !seenIds.has(branch.branch_id)) {
    seenIds.add(branch.branch_id);
    uniqueBranches.push(branch);
  }
});

const headerMatch = content.match(/^(.*?)"branches":/s);
const header = headerMatch ? headerMatch[1].trim() : '{';

const fixedContent = header + '"branches": ' + JSON.stringify(uniqueBranches, null, 2) + '\n}';

fs.writeFileSync(outputFile, fixedContent, 'utf8');

try {
  JSON.parse(fixedContent);
  console.log('JSON修复成功！文件已保存为：一个帽子_修复版.json');
  console.log('合并了', uniqueBranches.length, '个唯一分支');
} catch (error) {
  console.error('JSON验证失败：', error.message);
  console.log('已保存文件，但可能仍有问题需要手动修复');
}

const fs = require('fs');

const inputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子.json';
const outputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子_修复版.json';

let content = fs.readFileSync(inputFile, 'utf8');

content = content.replace(/\/\/.*$/gm, '');
content = content.replace(/\/\*[\s\S]*?\*\//g, '');

content = content.replace(/"/g, '\\"');

const headerEndIndex = content.indexOf('"branches"');
const header = content.substring(0, headerEndIndex).trim();

const firstBranchesStart = content.indexOf('[', headerEndIndex);
let braceCount = 0;
let bracketCount = 0;
let inString = false;
let escapeNext = false;
let firstBranchesEnd = firstBranchesStart;

for (let i = firstBranchesStart; i < content.length; i++) {
  const char = content[i];
  
  if (escapeNext) {
    escapeNext = false;
    continue;
  }
  
  if (char === '\\') {
    escapeNext = true;
    continue;
  }
  
  if (char === '"') {
    inString = !inString;
    continue;
  }
  
  if (!inString) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
  }
  
  if (braceCount === 0 && bracketCount === 0 && i > firstBranchesStart + 10) {
    firstBranchesEnd = i + 1;
    break;
  }
}

const firstBranches = content.substring(firstBranchesStart, firstBranchesEnd).trim();

const finalContent = header + '"branches": ' + firstBranches + '\n}';

fs.writeFileSync(outputFile, finalContent, 'utf8');

try {
  JSON.parse(finalContent);
  console.log('JSON修复成功！文件已保存为：一个帽子_修复版.json');
} catch (error) {
  console.error('JSON验证失败：', error.message);
  console.log('已保存文件，但可能仍有问题需要手动修复');
}

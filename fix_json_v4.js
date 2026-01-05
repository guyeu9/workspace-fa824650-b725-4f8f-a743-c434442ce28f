const fs = require('fs');

const inputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子.json';
const outputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子_修复版.json';

let content = fs.readFileSync(inputFile, 'utf8');

content = content.replace(/\/\/.*$/gm, '');
content = content.replace(/\/\*[\s\S]*?\*\//g, '');

content = content.replace(/"/g, '\\"');

const lines = content.split('\n');
let fixedContent = '';
let braceCount = 0;
let bracketCount = 0;
let inString = false;
let escapeNext = false;
let firstBranchesFound = false;
let branchesContent = '';
let headerContent = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  if (!firstBranchesFound && trimmedLine.includes('"branches"')) {
    firstBranchesFound = true;
    headerContent = fixedContent;
    fixedContent = '';
    braceCount = 0;
    bracketCount = 0;
    continue;
  }
  
  if (firstBranchesFound) {
    for (let char of line) {
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
    }
    
    branchesContent += line + '\n';
    
    if (braceCount === 0 && bracketCount === 0 && i > 10) {
      break;
    }
  } else {
    fixedContent += line + '\n';
  }
}

const header = headerContent.trim();
const branches = branchesContent.trim();

const finalContent = header + '\n  "branches": ' + branches + '\n}';

fs.writeFileSync(outputFile, finalContent, 'utf8');

try {
  JSON.parse(finalContent);
  console.log('JSON修复成功！文件已保存为：一个帽子_修复版.json');
} catch (error) {
  console.error('JSON验证失败：', error.message);
  console.log('已保存文件，但可能仍有问题需要手动修复');
}

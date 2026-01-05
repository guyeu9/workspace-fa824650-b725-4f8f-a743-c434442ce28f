const fs = require('fs');

const inputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子.json';
const outputFile = 'c:\\Users\\86156\\Downloads\\workspace-fa824650-b725-4f8f-a743-c434442ce28f\\一个帽子_修复版.json';

let content = fs.readFileSync(inputFile, 'utf8');

content = content.replace(/\/\/.*$/gm, '');
content = content.replace(/\/\*[\s\S]*?\*\//g, '');

content = content.replace(/"/g, '\\"');

content = content.replace(/,\s*}/g, '}');
content = content.replace(/,\s*]/g, ']');

const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
const openBrackets = (content.match(/\[/g) || []).length;
const closeBrackets = (content.match(/\]/g) || []).length;

const missingBraces = openBraces - closeBraces;
const missingBrackets = openBrackets - closeBrackets;

if (missingBraces > 0) {
  content = content + '}'.repeat(missingBraces);
}
if (missingBrackets > 0) {
  content = content + ']'.repeat(missingBrackets);
}

const lastBraceIndex = content.lastIndexOf('}');
if (lastBraceIndex !== -1 && lastBraceIndex < content.length - 1) {
  const afterLastBrace = content.substring(lastBraceIndex + 1).trim();
  if (afterLastBrace && !afterLastBrace.match(/^[\s,]*$/)) {
    content = content.substring(0, lastBraceIndex + 1);
  }
}

fs.writeFileSync(outputFile, content, 'utf8');

try {
  JSON.parse(content);
  console.log('JSON修复成功！文件已保存为：一个帽子_修复版.json');
} catch (error) {
  console.error('JSON验证失败：', error.message);
  console.log('已保存文件，但可能仍有问题需要手动修复');
}

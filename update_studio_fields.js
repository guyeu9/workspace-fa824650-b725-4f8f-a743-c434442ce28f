const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'studio', 'page.tsx');

console.log(`Reading file: ${filePath}`);
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { old: 'branch.choices', new: 'branch.options' },
  { old: 'branch.chapter', new: 'branch.branch_title' },
  { old: 'branch.scene_detail', new: 'branch.content' },
  { old: 'choice.choice', new: 'choice.option_text' },
  { old: 'choice.next_branch', new: 'choice.target_branch_id' },
  { old: 'choice.status_update', new: 'choice.status_changes' },
  { old: 'gameData.game_title', new: 'gameData.title' },
  { old: 'gameData.game_states', new: 'gameData.game_states' },
  { old: 'selectedBranch.chapter', new: 'selectedBranch.branch_title' },
  { old: 'selectedBranch.scene_detail', new: 'selectedBranch.content' },
  { old: 'selectedBranch.choices', new: 'selectedBranch.options' },
  { old: 'b.choices', new: 'b.options' },
  { old: 'b.chapter', new: 'b.branch_title' },
  { old: 'b.scene_detail', new: 'b.content' },
  { old: 'c.choice', new: 'c.option_text' },
  { old: 'c.next_branch', new: 'c.target_branch_id' },
  { old: 'c.status_update', new: 'c.status_changes' },
  { old: 'raw.game_title', new: 'raw.title' },
  { old: 'raw.game_states', new: 'raw.game_states' },
  { old: 'raw.branches', new: 'raw.branches' },
];

let replaceCount = 0;
for (const replacement of replacements) {
  const regex = new RegExp(replacement.old.replace(/\./g, '\\.'));
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, replacement.new);
    replaceCount++;
  }
}

console.log(`Replaced ${replaceCount} field name occurrences`);

console.log(`Saving file to: ${filePath}`);
fs.writeFileSync(filePath, content, 'utf8');

console.log("Update complete!");

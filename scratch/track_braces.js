const fs = require('fs');
const code = fs.readFileSync('apps/api/src/server.ts', 'utf8');
const lines = code.split('\n');

const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let strChar = '';
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inString) {
      if (ch === '\\') { j++; continue; }
      if (ch === strChar) inString = false;
    } else {
      if (ch === "'" || ch === '"' || ch === '`') {
        inString = true;
        strChar = ch;
      } else if (ch === '/' && line[j+1] === '/') {
        break;
      } else if (ch === '{') {
        stack.push({ line: i + 1, col: j + 1, text: line.trim() });
      } else if (ch === '}') {
        if (stack.length > 0) stack.pop();
        else console.log(`Extra closing brace at ${i + 1}:${j + 1}`);
      }
    }
  }
}

console.log(`Unclosed braces remaining: ${stack.length}`);
stack.forEach(item => console.log(`  Line ${item.line}: ${item.text}`));

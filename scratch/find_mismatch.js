const fs = require('fs');
const code = fs.readFileSync('apps/api/src/server.ts', 'utf8');

let paren = 0;
let brace = 0;
let bracket = 0;
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive parse ignoring strings/comments
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
      } else if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (ch === '{') brace++;
      else if (ch === '}') brace--;
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket--;
    }
  }
  if (paren < 0 || brace < 0 || bracket < 0) {
    console.log(`Mismatch at line ${i + 1}: paren=${paren}, brace=${brace}, bracket=${bracket}`);
    console.log(`Line content: ${line}`);
    break;
  }
}

console.log(`Final count: paren=${paren}, brace=${brace}, bracket=${bracket}`);

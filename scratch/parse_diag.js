const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('apps/api/src/server.ts', 'utf8');
const sf = ts.createSourceFile('server.ts', code, ts.ScriptTarget.Latest, true);

sf.parseDiagnostics.forEach(d => {
  const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
  console.log(`Parse Diagnostic (${line + 1},${character + 1}): ${d.messageText}`);
});

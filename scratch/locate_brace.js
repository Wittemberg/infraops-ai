const fs = require('fs');
const code = fs.readFileSync('apps/api/src/server.ts', 'utf8');

// Let's use typescript from node_modules
const ts = require('typescript');
const sourceFile = ts.createSourceFile('server.ts', code, ts.ScriptTarget.Latest, true);

function checkDiagnostics() {
  const program = ts.createProgram(['apps/api/src/server.ts'], { noEmit: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  for (const diag of diagnostics) {
    const { line, character } = diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start) : { line: 0, character: 0 };
    const msg = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    console.log(`TS Diagnostic (${line + 1},${character + 1}): ${msg}`);
  }
}

try {
  checkDiagnostics();
} catch (e) {
  console.log('Error checking diagnostics:', e);
}

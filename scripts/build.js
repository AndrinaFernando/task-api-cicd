const ts = require('typescript');
const fs = require('node:fs/promises');
const path = require('node:path');

async function build() {
  const output = path.join(__dirname, '..', 'dist');
  await fs.mkdir(output, { recursive: true });
  const program = ts.createProgram(['src/server.js', 'src/app.js'], {
    allowJs: true, checkJs: true, strict: true, skipLibCheck: true,
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    outDir: output, rootDir: 'src', sourceMap: true, noEmitOnError: true
  });
  const result = program.emit();
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(result.diagnostics);
  if (diagnostics.length || result.emitSkipped) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: name => name,
      getNewLine: () => '\n'
    }));
  }
  console.log('Compiled server modules and source maps into dist/');
}
build().catch(error => { console.error(error); process.exit(1); });

const { spawn, execSync } = require('node:child_process');
const path = require('node:path');

const backendDir = path.resolve(__dirname, '..');
const tscBin = require.resolve('typescript/bin/tsc', { paths: [backendDir] });

// Compilación inicial síncrona para emitir design:paramtypes (DTOs y Swagger)
execSync(`"${process.execPath}" "${tscBin}"`, {
  cwd: backendDir,
  stdio: 'inherit',
});

const tscWatch = spawn(
  process.execPath,
  [tscBin, '--watch', '--preserveWatchOutput'],
  { cwd: backendDir, stdio: 'inherit' },
);

const appWatch = spawn(
  process.execPath,
  ['--watch', 'dist/main.js'],
  { cwd: backendDir, stdio: 'inherit' },
);

function shutdown() {
  tscWatch.kill();
  appWatch.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

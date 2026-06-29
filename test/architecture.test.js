import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const bannedDatabases = /\b(supabase|firebase|postgres(?:ql)?|mysql|mariadb|mongodb|sqlite|sql server|oracle)\b/i;

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(target));
    else if (/\.(?:js|json|css)$/.test(entry.name)) files.push(target);
  }
  return files;
}

test('mantem o frontend sem bancos de dados proibidos', async () => {
  const files = await sourceFiles(path.join(root, 'src'));
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, bannedDatabases, path.relative(root, file));
  }
});

test('centraliza toda comunicacao HTTP de dados no servico oficial', async () => {
  const files = (await sourceFiles(path.join(root, 'src'))).filter((file) => file.endsWith('.js'));
  const fetchFiles = [];
  for (const file of files) {
    if (/\bfetch\s*\(/.test(await readFile(file, 'utf8'))) fetchFiles.push(path.relative(root, file).replaceAll('\\', '/'));
  }
  assert.deepEqual(fetchFiles, ['src/services/googleApiService.js']);
});

test('preserva pasta, Script ID, variavel da API e identidade visual oficiais', async () => {
  const config = await readFile(path.join(root, 'apps-script', 'Config.gs'), 'utf8');
  const clasp = JSON.parse(await readFile(path.join(root, '.clasp.json'), 'utf8'));
  const appConfig = await readFile(path.join(root, 'src', 'config', 'appConfig.js'), 'utf8');
  const tokens = await readFile(path.join(root, 'src', 'styles', 'tokens.css'), 'utf8');

  assert.match(config, /1skkXiZHim8lPadjPrzbTlxh19ZKBo_Ly/);
  assert.equal(clasp.scriptId, '1Ek05osjoYyK11VmCaZz3LJ2OJiYPoDdkGOiA_u5jU-BIoRkyog1yt0zg');
  assert.equal(clasp.rootDir, 'apps-script');
  assert.match(appConfig, /VITE_GOOGLE_APPS_SCRIPT_URL/);
  assert.match(tokens, /--color-primary:\s*#0072ce/i);
  assert.match(tokens, /\[data-theme="dark"\]/);
});

test('mantem somente dependencias coerentes com o frontend Vite', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const dependencies = Object.keys(pkg.dependencies || {}).join(' ');
  assert.doesNotMatch(dependencies, bannedDatabases);
  assert.equal(pkg.scripts['verify:architecture'], 'node --test test/architecture.test.js');
});

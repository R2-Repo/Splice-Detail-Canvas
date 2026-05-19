import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const entriesToCopy = [
  'index.html',
  'src',
  'docs',
  'assets',
  'public'
];

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(distDir, { recursive: true });

for (const entry of entriesToCopy) {
  const source = path.join(projectRoot, entry);
  const target = entry === 'public' ? distDir : path.join(distDir, entry);

  if (await exists(source)) {
    await fs.cp(source, target, { recursive: true });
  }
}

await fs.writeFile(path.join(distDir, '.nojekyll'), '');
console.log('Static site built to dist/.');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

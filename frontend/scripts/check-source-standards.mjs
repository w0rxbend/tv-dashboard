import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const errors = [];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  }));
  return nested.flat();
}

function relative(file) {
  return path.relative(process.cwd(), file);
}

function fail(file, message) {
  errors.push(`${relative(file)}: ${message}`);
}

const files = await listFiles(SRC_DIR);
const sourceFiles = files.filter((file) => /\.(jsx?|css)$/.test(file));

for (const file of sourceFiles) {
  const contents = await readFile(file, 'utf8');
  const isComponent = file.includes(`${path.sep}components${path.sep}`);

  if (isComponent && /from ['"]\.\.\/api/.test(contents)) {
    fail(file, 'components must receive resources/view models instead of importing API clients');
  }

  if (isComponent && /createPolling|createResource/.test(contents)) {
    fail(file, 'components must not create dashboard data resources directly');
  }

  if (/id=["'](?:cl-glow|th-glow|sunGrad|ar\d+)["']/.test(contents)) {
    fail(file, 'SVG defs must use instance-scoped ids');
  }

  if (/POLL\.(?:DEVICES|ENERGY)\b/.test(contents)) {
    fail(file, 'legacy device/energy polling constants must not be referenced by the frontend');
  }
}

const componentCss = path.join(SRC_DIR, 'styles', 'components.css');
const componentCssStats = await stat(componentCss);
if (componentCssStats.size > 4_000) {
  fail(componentCss, 'shared components.css should stay small; put feature styles in feature CSS files');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('source standards passed');

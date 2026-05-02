#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DETECTION_RULES = {
  python: {
    manifests: ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile', 'uv.lock'],
    extensions: ['.py'],
  },
  nodejs: {
    manifests: ['package.json'],
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'],
  },
  go: {
    manifests: ['go.mod'],
    extensions: ['.go'],
  },
  rust: {
    manifests: ['Cargo.toml'],
    extensions: ['.rs'],
  },
  ruby: {
    manifests: ['Gemfile'],
    extensions: ['.rb'],
  },
  java: {
    manifests: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    extensions: ['.java'],
  },
};

const EXCLUDED_DIRS = new Set([
  'node_modules', 'dist', 'build', 'target',
  'venv', '__pycache__', 'coverage',
]);

const MAX_DEPTH = 4;
const EXTENSION_THRESHOLD = 3;

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    fragmentsDir: path.join(__dirname, '..', 'fragments'),
  };
  for (const arg of argv) {
    if (arg.startsWith('--root=')) args.root = arg.slice('--root='.length);
    else if (arg.startsWith('--fragments-dir=')) args.fragmentsDir = arg.slice('--fragments-dir='.length);
  }
  return args;
}

function listFragmentLangs(fragmentsDir) {
  try {
    const files = fs.readdirSync(fragmentsDir);
    return new Set(
      files
        .filter((f) => f.startsWith('lang-') && f.endsWith('.md'))
        .map((f) => f.slice('lang-'.length, -'.md'.length)),
    );
  } catch {
    return new Set();
  }
}

function walkExtensions(root, extCounts, allExts, depth = 0) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;
      walkExtensions(path.join(root, entry.name), extCounts, allExts, depth + 1);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (allExts.has(ext)) {
        extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
      }
    }
  }
}

function main() {
  const { root, fragmentsDir } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`Root path not found or not a directory: ${root}`);
    process.exit(1);
  }

  const availableLangs = listFragmentLangs(fragmentsDir);
  if (availableLangs.size === 0) {
    process.stdout.write('[]\n');
    return;
  }

  const manifestHits = {};
  for (const [lang, { manifests }] of Object.entries(DETECTION_RULES)) {
    if (!availableLangs.has(lang)) continue;
    const found = manifests.filter((m) => fs.existsSync(path.join(root, m)));
    if (found.length > 0) manifestHits[lang] = found;
  }

  const allExts = new Set();
  for (const [lang, { extensions }] of Object.entries(DETECTION_RULES)) {
    if (!availableLangs.has(lang)) continue;
    for (const ext of extensions) allExts.add(ext);
  }
  const extCounts = new Map();
  walkExtensions(root, extCounts, allExts);

  const result = [];
  for (const lang of availableLangs) {
    const rule = DETECTION_RULES[lang];
    if (!rule) continue;
    const manifests = manifestHits[lang] ?? [];
    const langExtCount = rule.extensions.reduce(
      (sum, ext) => sum + (extCounts.get(ext) ?? 0),
      0,
    );

    if (manifests.length === 0 && langExtCount < EXTENSION_THRESHOLD) continue;

    const evidenceParts = [];
    if (manifests.length > 0) evidenceParts.push(manifests.join(', '));
    if (langExtCount > 0) {
      const extList = rule.extensions.map((e) => `*${e}`).join('/');
      evidenceParts.push(`${langExtCount} ${extList}`);
    }

    result.push({
      lang,
      evidence: evidenceParts.join(' + '),
      fragmentName: `lang-${lang}`,
    });
  }

  result.sort((a, b) => a.lang.localeCompare(b.lang));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();

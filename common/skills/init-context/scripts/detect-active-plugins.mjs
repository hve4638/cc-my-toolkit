#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';

function parseArgs(argv) {
  const args = { mode: null, owner: 'hve', projectRoot: null };
  for (const arg of argv) {
    if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
    else if (arg.startsWith('--owner=')) args.owner = arg.slice('--owner='.length);
    else if (arg.startsWith('--project-root=')) args.projectRoot = arg.slice('--project-root='.length);
  }
  return args;
}

function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeEnabledPlugins(...settingsPaths) {
  const merged = {};
  for (const p of settingsPaths) {
    const data = readJsonSafe(p);
    const enabled = data?.enabledPlugins;
    if (enabled && typeof enabled === 'object') {
      for (const [key, val] of Object.entries(enabled)) {
        if (val === true) merged[key] = true;
      }
    }
  }
  return merged;
}

function findInstallPath(installedPlugins, qualifiedName, predicate) {
  const records = installedPlugins?.plugins?.[qualifiedName];
  if (!Array.isArray(records)) return null;
  const match = records.find(predicate);
  return match?.installPath ?? null;
}

function usage() {
  console.error('Usage: detect-active-plugins.mjs --mode=global|project [--owner=hve] [--project-root=<path>]');
}

function main() {
  const { mode, owner, projectRoot } = parseArgs(process.argv.slice(2));

  if (mode !== 'global' && mode !== 'project') {
    usage();
    process.exit(1);
  }

  const home = os.homedir();
  const root = projectRoot ?? process.cwd();
  const installedPlugins = readJsonSafe(
    path.join(home, '.claude', 'plugins', 'installed_plugins.json'),
  );

  const enabledMap = mode === 'global'
    ? mergeEnabledPlugins(
        path.join(home, '.claude', 'settings.json'),
        path.join(home, '.claude', 'settings.local.json'),
      )
    : mergeEnabledPlugins(
        path.join(root, '.claude', 'settings.json'),
        path.join(root, '.claude', 'settings.local.json'),
      );

  const result = [];
  for (const qualifiedName of Object.keys(enabledMap)) {
    const at = qualifiedName.lastIndexOf('@');
    if (at < 1) continue;
    const name = qualifiedName.slice(0, at);
    const ownerOf = qualifiedName.slice(at + 1);
    if (ownerOf !== owner) continue;

    const installPath = mode === 'global'
      ? findInstallPath(installedPlugins, qualifiedName, (r) => r?.scope === 'user')
      : findInstallPath(installedPlugins, qualifiedName, (r) =>
          (r?.scope === 'project' || r?.scope === 'local') && r?.projectPath === root,
        );
    if (!installPath) continue;

    const partialPath = path.join(installPath, 'docs', 'AGENTS.partial.md');
    const hasPartial = fs.existsSync(partialPath);

    result.push({ name, owner: ownerOf, installPath, hasPartial });
  }

  result.sort((a, b) => a.name.localeCompare(b.name));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();

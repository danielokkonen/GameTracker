import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const llamaPlatformPackage = `@node-llama-cpp/${process.platform}-${process.arch}`;

function isModuleDir(dir: string): boolean {
  const parent = path.dirname(dir);
  return (
    path.basename(parent) === 'node_modules' ||
    (path.basename(parent).startsWith('@') && path.basename(path.dirname(parent)) === 'node_modules')
  );
}

function findModuleRoot(entryPath: string): string {
  let dir = path.dirname(entryPath);
  while (true) {
    if (isModuleDir(dir)) {
      if (!fs.existsSync(path.join(dir, 'package.json'))) throw new Error(`No package.json in module dir ${dir}`);
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`No module root found above ${entryPath}`);
    dir = parent;
  }
}

function collectLlamaModuleDirs(): string[] {
  const projectRoot = process.cwd();
  const seenRoots = new Set<string>();
  const moduleDirs: string[] = [];
  const queue: Array<{ spec: string; fromDir: string }> = [{ spec: 'node-llama-cpp', fromDir: projectRoot }];

  for (let i = 0; i < queue.length; i++) {
    const { spec, fromDir } = queue[i];
    if (spec.startsWith('@node-llama-cpp/') && spec !== llamaPlatformPackage) continue;

    let entryPath: string;
    try {
      entryPath = createRequire(path.join(fromDir, 'noop.js')).resolve(spec);
    } catch {
      continue; // Optional dependency not installed for this platform.
    }
    const moduleRoot = findModuleRoot(entryPath);
    if (seenRoots.has(moduleRoot)) continue;
    seenRoots.add(moduleRoot);
    moduleDirs.push(path.relative(projectRoot, moduleRoot));

    const pkg = JSON.parse(fs.readFileSync(path.join(moduleRoot, 'package.json'), 'utf8'));
    for (const dep of [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.optionalDependencies ?? {})]) {
      queue.push({ spec: dep, fromDir: moduleRoot });
    }
  }

  return moduleDirs;
}

const shippedModuleDirs = new Set(collectLlamaModuleDirs());
const traversalDirs = new Set(['node_modules']);
for (const dir of [...shippedModuleDirs]) {
  const parts = dir.split(path.sep);
  if (parts[1]?.startsWith('@')) traversalDirs.add(parts.slice(0, 2).join('/'));
}

const inDir = (file: string, dir: string) => {
  const posixDir = `/${dir.split(path.sep).join('/')}`;
  return file === posixDir || file.startsWith(`${posixDir}/`);
};

const nlcBuildOnlyPaths = [
  'node_modules/node-llama-cpp/llama/gitRelease.bundle',
  'node_modules/node-llama-cpp/llama/localBuilds',
  'node_modules/node-llama-cpp/llama/llama.cpp',
  'node_modules/node-llama-cpp/llama/xpack/store',
  'node_modules/node-llama-cpp/llama/xpack/xpacks',
];

const isShippedNodeModulesPath = (file: string) => {
  if (nlcBuildOnlyPaths.some((dir) => inDir(file, dir))) return false;
  return (
    [...shippedModuleDirs].some((dir) => inDir(file, dir)) ||
    [...traversalDirs].some((dir) => file === `/${dir.split(path.sep).join('/')}`)
  );
};

const config: ForgeConfig = {
  packagerConfig: {
    // Native binaries must sit outside the asar: dlopen needs real file paths for the addon's $ORIGIN-based RUNPATH to
    // find sibling .so files. node-llama-cpp resolves its binding under `.asar.unpacked/`, exactly where these land.
    asar: {
      unpackDir: `node_modules/${llamaPlatformPackage}`,
    },
    // Without this, the pruner keeps the whole production closure (react, @mui, ...) that Vite already bundles into `.vite`.
    prune: false,
    // `file` is empty for the project root, which must always be kept.
    ignore: (file) => !!file && !(file.startsWith('/.vite') || isShippedNodeModulesPath(file)),
  },
  rebuildConfig: {},
  makers: [
    ...(process.platform === 'win32' ? [new MakerSquirrel({})] : []),
    ...(process.platform === 'darwin' ? [new MakerZIP({}, ['darwin'])] : []),
    ...(process.platform === 'linux' ? [new MakerDeb({})] : []),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;

import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { pluginExposeRenderer } from './vite.base.config.mts';

// GameDetails fetches IGDB cover art and converts it to a data: URI; all other renderer I/O is IPC.
// MUI/emotion inject <style> tags and style attributes, so style-src needs 'unsafe-inline'; scripts do not.
// Vite inlines the tiny @fontsource Roboto subsets into the CSS as data: URIs, so font-src allows data:.
const CSP_PROD =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://images.igdb.com; object-src 'none'; base-uri 'self'; form-action 'self'";

// In serve mode Vite injects an inline react-refresh preamble and the HMR socket is same-port ws:.
const CSP_DEV =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:* http://localhost:* https://images.igdb.com; object-src 'none'; base-uri 'self'; form-action 'self'";

function pluginContentSecurityPolicy(command: 'serve' | 'build'): Plugin {
  return {
    name: 'content-security-policy',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: command === 'serve' ? CSP_DEV : CSP_PROD,
        },
        injectTo: 'head-prepend',
      },
    ],
  };
}

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'renderer'>;
  const { root, mode, command, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
      rollupOptions: {
        // MUI ships "use client" banners for React Server Components; they are inert in a desktop renderer.
        onwarn(warning, defaultHandler) {
          if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
            defaultHandler(warning);
          }
        },
      },
    },
    plugins: [pluginContentSecurityPolicy(command), pluginExposeRenderer(name)],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  } as UserConfig;
});

import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';

// Node 22+ reads the local .env without adding a runtime dependency.
if (existsSync('.env')) process.loadEnvFile('.env');

const configuredSite = process.env.SITE_URL;
if (configuredSite && !/^https:\/\/[^/]+\/?$/.test(configuredSite)) {
  throw new Error('SITE_URL must be a public HTTPS origin, for example https://your-domain.kr');
}

export default defineConfig({
  site: configuredSite || undefined,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { server: { allowedHosts: true } },
});
